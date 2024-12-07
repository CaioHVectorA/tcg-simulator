import Elysia, { t } from "elysia";
import { jwt } from "../middlewares/jwt/jwt";
import { getUserInterceptor } from "../middlewares/jwt";
import { prisma } from "../helpers/prisma.client";
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
    .get(
      "/",
      async ({ prisma, query }) => {
        const limit = 32;
        const { page, search } = query;
        const skip = search ? 0 : (parseInt(page || "1") - 1) * limit;

        const where = search ? { name: { startsWith: search } } : {};
        const cards = await prisma.card.findMany({
          where,
          skip,
          take: limit,
          orderBy: { rarity: "desc" },
        });

        return {
          ok: true,
          toast: null,
          error: null,
          data: cards,
        };
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
          return {
            ok: false,
            toast: "Carta não encontrada.",
            error: "Card not found",
            data: null,
          };
        }

        return {
          ok: true,
          toast: null,
          error: null,
          data: card,
        };
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
        if (!user) {
          set.status = 401;
          return {
            ok: false,
            toast: "É necessário estar autenticado para acessar este recurso.",
            error: "Sem token de autorização!",
            data: null,
          };
        }
        const limit = 32;
        const { page, search } = query;
        const skip = search ? 0 : (parseInt(page || "1") - 1) * limit;
        const where = search ? { name: { startsWith: search } } : {};
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

        return {
          ok: true,
          toast: null,
          error: null,
          data: {
            data: cardsWithQuantity,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page || "1"),
            totalCards: count,
          },
        };
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
});
