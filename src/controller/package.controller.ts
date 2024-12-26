import { Elysia, t } from "elysia";
import { jwt } from "../middlewares/jwt/jwt";
import {
  getUserInterceptor,
  getUserUserMiddleware,
  receiveUser,
} from "../middlewares/jwt";
import { prisma } from "../helpers/prisma.client";
import { OpenPackage } from "../lib/open-package";
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
        const ids = await prisma.packages_User.findMany({
          where: { userId: user.id, opened: false },
          select: { packageId: true },
        });
        // i want duplicates packages
        const packages = [] as {
          name: string;
          image_url: string;
          id: number;
          quantity: number;
        }[];
        for (const id of ids) {
          const package_ = await prisma.package.findFirst({
            where: { id: id.packageId },
            select: { name: true, image_url: true, id: true },
          });
          if (!package_) continue;
          if (packages.some((p) => p.id === package_.id)) {
            const index = packages.findIndex((p) => p.id === package_.id);
            packages[index].quantity++;
            continue;
          }
          packages.push({ ...package_, quantity: 1 });
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
            (id) => id > packagesCount + first.id || id < first.id
          )
        ) {
          set.status = 400;
          return errorResponse(
            "ID de pacote inválido!",
            "ID de pacote inválido!"
          );
        }
        const quantities = {} as Record<number, number>;
        packagesId.forEach((id) => {
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
        packagesId.forEach((id) => {
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
            allCards.push(...cards);
          }
          const packageUserId =
            packagesUser.find((p) => p.packageId === package_.id)?.id || 10000;
          if (packageUserId === 10000) {
            console.log("Package not found");
            continue;
          }
          await prisma.packages_User.update({
            where: {
              userId: user.id,
              packageId: package_.id,
              id: packageUserId,
            },
            data: { opened: true },
          });
        }
        for await (const card of allCards) {
          await prisma.cards_user.create({
            data: { userId: user.id, cardId: card.id },
          });
        }
        return sucessResponse(allCards.sort((a, b) => b.rarity - a.rarity));
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
    );
});
