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
        const { key } = query;
        let total = 0;
        const cardsId = [];
        const packagesId = [];
        for (const item of items) {
          if (item.type === "package") {
            const pack = await prisma.package.findUnique({
              where: { id: item.id },
            });
            if (!pack) {
              set.status = 404;
              return errorResponse(
                "Package not found",
                "Um dos pacotes não foi encontrado"
              );
            }
            for (let i = 0; i < item.quantity; i++) {
              packagesId.push(pack.id);
            }
            await prisma.user_Purchase.create({
              data: {
                quantity: item.quantity,
                package_id: pack.id,
                user_id: user.id,
              },
            });
            total += pack.price * item.quantity;
          } else {
            const promotional_card = await prisma.promotional_Cards.findUnique({
              where: { id: item.id },
              include: { card: true },
            });
            if (!promotional_card) {
              set.status = 404;
              return errorResponse("Card not found", "Carta não encontrada");
            }
            await prisma.user_Purchase.create({
              data: {
                promotional_card_id: promotional_card.id,
                user_id: user.id,
              },
            });
            cardsId.push(promotional_card.card_id);
            total += promotional_card.price;
          }
        }
        if (user.money < total)
          return errorResponse(
            "Sem dinheiro suficiente",
            "Você não tem dinheiro suficiente para comprar esses itens"
          );
        await prisma.$transaction([
          prisma.user.update({
            where: { id: user.id },
            data: { money: user.money - total },
          }),
          prisma.cards_user.createMany({
            data: cardsId.map((id) => ({
              cardId: id,
              userId: user.id,
            })),
          }),
          prisma.packages_User.createMany({
            data: packagesId.map((id) => ({
              packageId: id,
              userId: user.id,
            })),
          }),
        ]);
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
          promotional_card_id: { not: null },
        },
      });
      return sucessResponse(cards);
    });
});
