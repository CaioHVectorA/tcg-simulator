import { Elysia, t } from "elysia";
import { jwt } from "../middlewares/jwt/jwt";
import {
  getUserInterceptor,
  getUserUserMiddleware,
  receiveUser,
} from "../middlewares/jwt";
import { prisma } from "../helpers/prisma.client";
import {
  getByRarityCluster,
  getRandomCardFromPackage,
  OpenPackage,
  OpenPackageStreamingHandle,
} from "../lib/open-package";
import type { Card, Package, User } from "@prisma/client";
import { errorResponse, sucessResponse } from "../lib/mount-response";
const baseResponse = t.Object({
  ok: t.Boolean(),
  toast: t.Union([t.String(), t.Null()]),
  error: t.Union([t.String(), t.Null()]),
  data: t.Any(),
});
export const packageController = new Elysia({}).group("/packages", (app) => {
  return app
    .decorate("prisma", prisma)
    .decorate("user", {} as User)
    .get("/all", async ({ prisma }) => {
      const packages = await prisma.package.findMany({
        select: {
          id: true,
          name: true,
          image_url: true,
          tcg_id: true,
          price: true,
        },
      });
      const tematics = packages.filter((p) => p.tcg_id);
      const standard = packages.filter((p) => !p.tcg_id);
      return sucessResponse({ tematics, standard });
    })
    .get(
      "/cards",
      async ({ prisma, query }) => {
        const { packageId, page, sort } = query;
        const orderBy = {
          "A-Z": { name: "asc" as const },
          "Z-A": { name: "desc" as const },
          "r-asc": { rarity: "asc" as const },
          "r-desc": { rarity: "desc" as const },
        };
        const limit = 32;
        const offset = ((Number(page) || 1) - 1) * limit;
        const count = await prisma.card.count({
          where: {
            card_id: {
              startsWith: packageId,
            },
          },
        });
        const pages = Math.ceil(count / limit);
        const cards = await prisma.card.findMany({
          where: {
            card_id: {
              startsWith: packageId,
            },
          },
          orderBy: orderBy[(sort || "r-desc") as keyof typeof orderBy],
          take: limit,
          skip: offset,
        });
        const data = {
          cards,
          pages,
          currentPage: Number(page) || 1,
        };
        return sucessResponse(data);
      },
      {
        query: t.Object({
          packageId: t.String(),
          page: t.Optional(t.Number({ optional: true })),
          sort: t.Optional(
            t.Union([
              t.Literal("A-Z"),
              t.Literal("Z-A"),
              t.Literal("r-asc"),
              t.Literal("r-desc"),
            ])
          ),
        }),
      }
    )
    .use(jwt)
    .onBeforeHandle(getUserUserMiddleware as any)
    .get(
      "/",
      async ({ jwt, headers, user, prisma, set }) => {
        console.log({ user });
        const packagesUnformatted = await prisma.packages_User.findMany({
          where: { userId: user.id, opened: false },
          select: { Package: true },
          distinct: ["packageId"],
        });
        // i want duplicates packages
        const packages = [] as {
          name: string;
          image_url: string;
          id: number;
          tcg_id?: string;
          quantity: number;
          description: string;
        }[];
        for (const package_ of packagesUnformatted) {
          const quantity = await prisma.packages_User.count({
            where: {
              userId: user.id,
              packageId: package_.Package.id,
              opened: false,
            },
          });
          // console.log({ package_ });
          packages.push({
            name: package_.Package.name,
            image_url: package_.Package.image_url,
            id: package_.Package.id,
            quantity,
            tcg_id: package_.Package.tcg_id || undefined,
            description: package_.Package.description || "",
          });
        }
        return packages;
      },
      {
        detail: {
          tags: ["Package"],
          description:
            "Endpoint relacionado a coleta de pacotes a partir da token de usuário",
        },
        response: {
          200: t.Array(
            t.Object({
              name: t.String(),
              image_url: t.String(),
              id: t.Number(),
              description: t.String(),
              quantity: t.Number(),
            }),
            { description: "Pacotes do usuário" }
          ),
          401: t.Object(
            { error: t.String() },
            { description: "Erro de autenticação" }
          ),
        },
      }
    )
    .get("/:id", async ({ prisma, params }) => {
      const { id } = params;
      const package_ = await prisma.package.findFirst({
        where: { id: Number(id) },
        select: { id: true, name: true, image_url: true, price: true },
      });
      if (!package_)
        return errorResponse("Pacote não encontrado", "Pacote não encontrado");
      return sucessResponse(package_);
    })
    .post(
      "/buy",
      async ({ body, user, prisma, set }) => {
        const { packageId } = body;
        if (packageId > 7 || packageId < 1) {
          set.status = 400;
          return errorResponse("ID inválido!", "Ocorreu um erro.");
        }
        const package_ = await prisma.package.findFirst({
          where: { id: packageId },
        });
        if (!package_)
          return errorResponse(
            "Pacote não existente",
            "O pacote não foi encontrado"
          );
        if (user.money < package_.price) {
          set.status = 400;
          return errorResponse(
            "Dinheiro insuficiente",
            "Você não tem dinheiro o suficiente"
          );
        }
        const userPackage = await prisma.packages_User.create({
          data: {
            userId: user.id,
            packageId: packageId,
          },
        });
        await prisma.user.update({
          where: { id: user.id },
          data: {
            money: user.money - package_.price,
          },
        });
        return sucessResponse(null, "Comprado com sucesso!");
      },
      {
        body: t.Object({ packageId: t.Number() }),
        detail: {
          tags: ["Package"],
          deprecated: true,
          description: "Use /buy-many instead",
        },
      }
    )
    .post(
      "/buy-many",
      async ({ user, prisma, body, set }) => {
        const { packagesId } = body;
        const packagesCount = await prisma.package.count({});
        const first = await prisma.package.findFirst({ select: { id: true } });
        if (!first) {
          set.status = 400;
          return errorResponse(
            "Nenhum pacote encontrado!",
            "Nenhum pacote encontrado!"
          );
        }
        console.log({ first, packagesCount, packagesId });
        if (
          packagesId.some(
            (id: number) => id > packagesCount + first.id || id < first.id
          )
        ) {
          set.status = 400;
          return errorResponse(
            "ID de pacote inválido!",
            "ID de pacote inválido!"
          );
        }
        const quantities = {} as Record<number, number>;
        packagesId.forEach((id: number) => {
          quantities[id] = (quantities[id] || 0) + 1;
        });
        const packages = await prisma.package.findMany({
          where: { id: { in: packagesId } },
        });
        const total = packages.reduce((acc, curr) => acc + curr.price, 0);
        if (user.money < total) {
          set.status = 400;
          return errorResponse(
            "Dinheiro insuficiente!",
            "Dinheiro insuficiente!"
          );
        }
        const userPackages = [];
        for (const [id, quantity] of Object.entries(quantities)) {
          for (let i = 0; i < quantity; i++) {
            userPackages.push({
              userId: user.id,
              packageId: Number(id),
            });
          }
        }
        await prisma.packages_User.createMany({ data: userPackages });
        await prisma.user.update({
          where: { id: user.id },
          data: {
            money: user.money - total,
          },
        });
        return sucessResponse("Comprado com sucesso!", "Comprado com sucesso!");
      },
      {
        body: t.Object({ packagesId: t.Array(t.Number()) }),
        detail: {
          tags: ["Package"],
          description:
            "Compre vários pacotes de uma vez, usando seus ID's como referência",
        },
        response: {
          200: baseResponse,
          400: baseResponse,
          401: baseResponse,
        },
      }
    )
    .post(
      "/open-packages",
      async ({ user, prisma, body, set }) => {
        const { packagesId } = body;
        const quantities = {} as Record<number, number>;
        let rarityPointsGain = 0;
        packagesId.forEach((id: number) => {
          quantities[id] = (quantities[id] || 0) + 1;
        });
        const packages = await prisma.package.findMany({
          where: { id: { in: packagesId } },
        });
        const packagesUser = await prisma.packages_User.findMany({
          where: {
            userId: user.id,
            packageId: { in: packagesId },
            opened: false,
          },
        });
        if (packagesUser.length < packagesId.length) {
          set.status = 400;
          return errorResponse(
            "Pacote não encontrado",
            "Pacote não encontrado"
          );
        }
        const allCards = [] as Card[];
        for await (const package_ of packages) {
          for (let i = 0; i < quantities[package_.id]; i++) {
            const cards = await OpenPackage(package_, prisma);
            rarityPointsGain += cards.reduce(
              (acc, curr) => acc + curr.rarity,
              0
            );
            allCards.push(...cards);
          }
          const packageUserId =
            packagesUser.find((p) => p.packageId === package_.id)?.id || 10000;
          if (packageUserId === 10000) {
            console.log("Package not found");
            continue;
          }
          const pkgPkgIds = packagesUser
            .filter((p) => p.packageId === package_.id)
            .map((p) => p.id)
            .slice(0, quantities[package_.id]);
          console.log({ pkgPkgIds });
          await prisma.packages_User.updateMany({
            data: { opened: true },
            where: {
              userId: user.id,
              id: { in: pkgPkgIds },
              opened: false,
            },
          });
        }
        await prisma.cards_user.createMany({
          data: allCards.map((card) => ({ userId: user.id, cardId: card.id })),
        });
        await prisma.user.update({
          where: { id: user.id },
          data: {
            rarityPoints: {
              increment: rarityPointsGain,
            },
          },
        });
        return sucessResponse(allCards.sort((a, b) => a.rarity - b.rarity));
      },
      {
        body: t.Object({ packagesId: t.Array(t.Number()) }),
        detail: {
          tags: ["Package"],
          description:
            "Abra pacotes de cartas, usando seus ID's como referência",
        },
        response: {
          200: baseResponse,
          400: baseResponse,
          401: baseResponse,
        },
      }
    )
    .post(
      "/open",
      async ({ user, prisma, body }) => {
        const { packageId } = body;
        const package_ = await prisma.packages_User.findFirst({
          where: { userId: user.id, packageId, opened: false },
        });
        if (!package_)
          return errorResponse(
            "Pacote não encontrado",
            "Pacote não encontrado"
          );
        const packageToOpen = await prisma.package.findFirst({
          where: { id: packageId },
        });
        if (!packageToOpen)
          return errorResponse(
            "Pacote não encontrado",
            "Pacote não encontrado"
          );
        const cards = await OpenPackage(packageToOpen, prisma);
        await prisma.packages_User.update({
          where: { userId: user.id, packageId, opened: false, id: package_.id },
          data: { opened: true },
        });
        await prisma.cards_user.createMany({
          data: cards.map((card) => ({ userId: user.id, cardId: card.id })),
        });
        const sortedCards = cards.sort((a, b) => a.rarity - b.rarity);
        return sucessResponse(sortedCards);
      },
      { body: t.Object({ packageId: t.Number() }) }
    )
    .post(
      "/thematic-lootbox",
      async ({ user, prisma, body, set }) => {
        const { packageId, goldAmount } = body;
        if (!goldAmount || goldAmount < 500) {
          set.status = 400;
          return errorResponse("Valor mínimo de depósito é 500 moedas!", "Valor mínimo é 500 moedas.");
        }
        if (user.money < goldAmount) {
          set.status = 400;
          return errorResponse("Saldo insuficiente!", "Você não possui moedas suficientes.");
        }

        const pkg = await prisma.package.findFirst({
          where: { id: packageId },
        });
        if (!pkg) {
          set.status = 404;
          return errorResponse("Pacote não encontrado", "Pacote temático não encontrado.");
        }

        // Quantidade de cartas proporcional ao ouro depositado (mínimo 3, escala até 15)
        const cardsCount = Math.min(15, Math.max(3, Math.floor(Math.sqrt(goldAmount / 50)) + 1));

        // Sorte e raridade escalam com o investimento
        const goldRatio = Math.min(10, Math.max(1, goldAmount / 1000));
        const weights: { rarity: number; weight: number }[] = [
          { rarity: 5, weight: Math.min(0.25, 0.01 * goldRatio * 1.6) }, // full_legendary
          { rarity: 4, weight: Math.min(0.38, 0.04 * goldRatio * 1.5) }, // legendary
          { rarity: 3, weight: Math.min(0.42, 0.15 * Math.sqrt(goldRatio)) }, // epic
          { rarity: 2, weight: 0.30 }, // rare
          { rarity: 1, weight: Math.max(0.05, 0.50 - (goldRatio * 0.04)) }, // common
        ];

        // Buscar pool de cartas da temática
        const handleTcgId = pkg.tcg_id ? { startsWith: pkg.tcg_id } : undefined;
        let pool = await prisma.card.findMany({
          where: { card_id: handleTcgId },
        });
        if (pool.length === 0) {
          pool = await prisma.card.findMany({ take: 100 });
        }

        // Sorteio com Proteção contra Repetição (amostragem sem reposição sempre que possível)
        const chosenCards: typeof pool = [];
        const chosenIds = new Set<number>();

        function rollRarity(): number {
          const total = weights.reduce((s, w) => s + w.weight, 0);
          let r = Math.random() * total;
          for (const w of weights) {
            if (r <= w.weight) return w.rarity;
            r -= w.weight;
          }
          return 1;
        }

        for (let i = 0; i < cardsCount; i++) {
          const targetRarity = rollRarity();
          // Candidatas com a raridade sorteada e que AINDA NÃO foram escolhidas
          let candidates = pool.filter((c) => c.rarity === targetRarity && !chosenIds.has(c.id));
          if (candidates.length === 0) {
            // Fallback para qualquer carta do pool que ainda não foi sorteada
            candidates = pool.filter((c) => !chosenIds.has(c.id));
          }
          if (candidates.length === 0) {
            // Se o pool for menor que cardsCount, permite re-sorteio
            candidates = pool;
          }
          const picked = candidates[Math.floor(Math.random() * candidates.length)];
          chosenCards.push(picked);
          chosenIds.add(picked.id);
        }

        // Transação Atômica: Deduzir ouro e adicionar cartas ao inventário
        await prisma.$transaction([
          prisma.user.update({
            where: { id: user.id },
            data: { money: { decrement: goldAmount } },
          }),
          prisma.cards_user.createMany({
            data: chosenCards.map((c) => ({ userId: user.id, cardId: c.id })),
          }),
        ]);

        const sortedCards = chosenCards.sort((a, b) => b.rarity - a.rarity);
        return sucessResponse({
          cards: sortedCards,
          cardsCount: sortedCards.length,
          goldSpent: goldAmount,
          packageName: pkg.name,
        }, `Lootbox ${pkg.name} aberta com sucesso! Você recebeu ${sortedCards.length} cartas.`);
      },
      {
        body: t.Object({
          packageId: t.Number(),
          goldAmount: t.Number(),
        }),
      }
    );
  // TODO
  // .post(
  //   "/open-many-strm",
  //   async function* ({ user, prisma, body }) {
  //     const { packageId, quantity } = body;
  //     const package_ = await prisma.packages_User.findFirst({
  //       where: { userId: user.id, packageId, opened: false },
  //     });
  //     if (!package_)
  //       return errorResponse(
  //         "Pacote não encontrado",
  //         "Pacote não encontrado"
  //       );
  //     const quantityGot = await prisma.packages_User.count({
  //       where: { userId: user.id, packageId, opened: false },
  //     });
  //     if (quantityGot < quantity)
  //       return errorResponse(
  //         "Quantidade insuficiente",
  //         "Quantidade insuficiente"
  //       );
  //     const packageToOpen = await prisma.package.findFirst({
  //       where: { id: packageId },
  //     });
  //     if (!packageToOpen)
  //       return errorResponse(
  //         "Pacote não encontrado",
  //         "Pacote não encontrado"
  //       );
  //     for (let i = 0; i < quantity; i++) {
  //       const rarity = await getByRarityCluster({
  //         pkg: packageToOpen,
  //         prisma,
  //       });
  //       for (let i = 0; i < packageToOpen.cards_quantity * 100; i++) {
  //         const cards = getRandomCardFromPackage(packageToOpen, rarity);
  //         yield cards;
  //       }
  //     }
  //   },
  //   { body: t.Object({ packageId: t.Number(), quantity: t.Number() }) }
  // );
});
