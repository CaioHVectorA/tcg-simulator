import Elysia, { t } from "elysia";
import { prisma } from "../helpers/prisma.client";
import { errorResponse, sucessResponse } from "../lib/mount-response";
import type { User } from "@prisma/client";
import { getUserUserMiddleware } from "../middlewares/jwt";
import { jwt } from "../middlewares/jwt/jwt";

export const storeController = new Elysia({}).group("/store", (app) => {
  return app
    .decorate("prisma", prisma)
    .get("/data", async ({ prisma }) => {
      const promotionalCards = await prisma.promotional_Cards.findMany({
        select: {
          card_id: true,
          id: true,
          price: true,
          original_price: true,
          created_at: true,
          updated_at: true,
          card: {
            select: {
              image_url: true,
              name: true,
              rarity: true,
            },
          },
        },
        orderBy: {
          price: "asc",
        },
      });
      const packages = await prisma.package.findMany({
        select: {
          id: true,
          name: true,
          image_url: true,
          tcg_id: true,
          price: true,
          description: true,
          cards_quantity: true,
        },
        orderBy: {
          price: "asc",
        },
      });
      const tematics = packages.filter((p) => p.tcg_id);
      const standard = packages.filter((p) => !p.tcg_id);
      return sucessResponse({
        promotionalCards,
        tematics,
        standard,
      });
    })
    .decorate("user", {} as User)
    .use(jwt)
    .onBeforeHandle(getUserUserMiddleware as any)
    .post(
      "/checkout",
      async ({ body, query, user, set }) => {
        const { items } = body;
        const packageItems = items.filter((i) => i.type === "package");
        const cardItems = items.filter((i) => i.type === "card");

        const packageIds = packageItems.map((i) => i.id);
        const cardIds = cardItems.map((i) => i.id);

        const [packages, promotionalCards] = await Promise.all([
          packageIds.length > 0
            ? prisma.package.findMany({ where: { id: { in: packageIds } } })
            : Promise.resolve([]),
          cardIds.length > 0
            ? prisma.promotional_Cards.findMany({
                where: { id: { in: cardIds } },
                include: { card: true },
              })
            : Promise.resolve([]),
        ]);

        const packageMap = new Map(packages.map((p) => [p.id, p]));
        const cardMap = new Map(promotionalCards.map((c) => [c.id, c]));

        let total = 0;
        let rarityPointsGain = 0;
        const packagesToCreate: { packageId: number; userId: number }[] = [];
        const cardsToCreate: { cardId: number; userId: number }[] = [];
        const purchasesToCreate: any[] = [];

        for (const item of packageItems) {
          const pack = packageMap.get(item.id);
          if (!pack) {
            set.status = 404;
            return errorResponse("Package not found", "Um dos pacotes não foi encontrado");
          }
          total += pack.price * item.quantity;
          for (let i = 0; i < item.quantity; i++) {
            packagesToCreate.push({ packageId: pack.id, userId: user.id });
          }
          purchasesToCreate.push({
            quantity: item.quantity,
            package_id: pack.id,
            user_id: user.id,
          });
        }

        for (const item of cardItems) {
          const promo = cardMap.get(item.id);
          if (!promo) {
            set.status = 404;
            return errorResponse("Card not found", "Carta não encontrada");
          }
          total += promo.price * item.quantity;
          for (let i = 0; i < item.quantity; i++) {
            cardsToCreate.push({ cardId: promo.card_id, userId: user.id });
            purchasesToCreate.push({
              user_id: user.id,
              card_id: promo.card_id,
            });
          }
          rarityPointsGain += promo.card.rarity * item.quantity;
        }

        if (user.money < total) {
          set.status = 400;
          return errorResponse(
            "Sem dinheiro suficiente",
            "Você não tem moedas suficientes para comprar esses itens"
          );
        }

        const txs: any[] = [
          prisma.user.update({
            where: { id: user.id },
            data: {
              money: { decrement: total },
              rarityPoints: { increment: rarityPointsGain },
            },
          }),
        ];

        if (purchasesToCreate.length > 0) {
          txs.push(prisma.user_Purchase.createMany({ data: purchasesToCreate }));
        }
        if (packagesToCreate.length > 0) {
          txs.push(prisma.packages_User.createMany({ data: packagesToCreate }));
        }
        if (cardsToCreate.length > 0) {
          txs.push(prisma.cards_user.createMany({ data: cardsToCreate }));
        }

        await prisma.$transaction(txs);
        return sucessResponse(null, "Compra realizada com sucesso");
      },
      {
        query: t.Object({ key: t.String() }),
        body: t.Object({
          items: t.Array(
            t.Object({
              id: t.Number(),
              quantity: t.Number(),
              type: t.Union([t.Literal("package"), t.Literal("card")]),
            })
          ),
        }),
      }
    )
    .get("/bought-promotional", async ({ user }) => {
      const cards = await prisma.user_Purchase.findMany({
        where: {
          user_id: user.id,
          card_id: { not: null },
        },
        select: {
          card_id: true,
        },
      });
      const formatted = cards.map((c) => c.card_id!);
      return sucessResponse(formatted);
    });
});
