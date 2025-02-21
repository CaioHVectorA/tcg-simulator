import Elysia, { t } from "elysia";
import { jwt } from "../middlewares/jwt/jwt";
import { getUserInterceptor, getUserUserMiddleware } from "../middlewares/jwt";
import { prisma } from "../helpers/prisma.client";
import { errorResponse, sucessResponse } from "../lib/mount-response";
import type { Prisma, User } from "@prisma/client";
const baseResponse = t.Object({
  ok: t.Boolean(),
  toast: t.Union([t.String(), t.Null()]),
  error: t.Union([t.String(), t.Null()]),
  data: t.Any(),
});

export const cardController = new Elysia({}).group("/cards", (app) => {
  return app
    .use(jwt)
    .decorate("prisma", prisma)
    .decorate("user", {} as User)
    .onBeforeHandle(getUserUserMiddleware as any)
    .get(
      "/",
      async ({ prisma, query, user }) => {
        const limit = 32;
        const { page, search } = query;
        const skip = search ? 0 : (parseInt(page || "1") - 1) * limit;
        const where = (
          search ? { name: { contains: search, mode: "insensitive" } } : {}
        ) as Prisma.CardWhereInput;
        const cards = await prisma.card.findMany({
          where,
          skip,
          take: limit,
          orderBy: { rarity: "desc" },
        });

        return sucessResponse(cards);
      },
      {
        query: t.Object({
          page: t.Optional(
            t.String({ description: "Página escrita numericamente." })
          ),
          search: t.Optional(t.String({ description: "Pesquisa" })),
        }),
        detail: { tags: ["Card"], description: "Lista todas as cartas" },
        response: baseResponse,
      }
    )

    .get(
      "/:id",
      async ({ prisma, params, set }) => {
        const { id } = params;

        const card = await prisma.card.findFirst({
          where: { id: parseInt(id) },
        });

        if (!card) {
          set.status = 404;
          return errorResponse("Carta não encontrada.", "Card not found");
        }

        return sucessResponse(card);
      },
      {
        params: t.Object({ id: t.String() }),
        detail: { tags: ["Card"], description: "Lista a carta pelo seu id" },
        response: baseResponse,
      }
    )
    .derive(getUserInterceptor)

    .get(
      "/my",
      async ({ prisma, query, user, set }) => {
        const limit = 32;
        const { page, search } = query;
        const skip = search ? 0 : (parseInt(page || "1") - 1) * limit;
        const where: Prisma.CardWhereInput = search
          ? { name: { contains: search, mode: "insensitive" } }
          : {};
        const count = await prisma.card.count({
          where: { ...where, Cards_user: { some: { userId: user.id } } },
        });
        const cards = await prisma.card.findMany({
          where: { ...where, Cards_user: { some: { userId: user.id } } },
          skip,
          take: limit,
          orderBy: { rarity: "desc" },
        });
        const cardsWithQuantity = await Promise.all(
          cards.map(async (card) => {
            const quantity = await prisma.cards_user.count({
              where: {
                Card: where,
                cardId: card.id,
                userId: user.id,
              },
            });
            return {
              ...card,
              quantity,
            };
          })
        );
        return sucessResponse({
          data: cardsWithQuantity,
          totalPages: Math.ceil(count / limit),
          currentPage: parseInt(page || "1"),
          totalCards: count,
        });
      },
      {
        query: t.Object({
          page: t.Optional(t.String()),
          search: t.Optional(t.String()),
        }),
        detail: { tags: ["Card"], description: "Resgata cartas do usuário" },
        response: baseResponse,
      }
    );
  // .get("/duplicates", async ({ prisma, user }) => {
  //   const duplicates = await prisma.cards_user.findMany({
  //     select: {
  //       id: true,
  //     },
  //     where: { userId: user.id },
  //   });
  //   const diff = duplicates.length - new Set(duplicates).size;
  //   return sucessResponse(diff);
  // });
});
