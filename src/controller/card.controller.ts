import Elysia, { t } from "elysia";
import { jwt } from "../middlewares/jwt/jwt";
import { getUserInterceptor } from "../middlewares/jwt";
import { prisma } from "../helpers/prisma.client";

export const cardController = new Elysia({}).group("/cards", (app) => {
  return app
    .use(jwt)
    .decorate("prisma", prisma)
    .derive(getUserInterceptor)
    .get(
      "/my",
      async ({ prisma, query, user, set }) => {
        if (!user) {
          set.status = 401;
          return { error: "Sem token de autorização!" };
        }
        const limit = 32;
        const { page, search } = query;
        const skip = search ? 0 : (parseInt(page || "1") - 1) * limit;
        const where = search ? { name: { startsWith: search } } : {};
        const cards = await prisma.card.findMany({
          where: { ...where, Cards_user: { some: { userId: user.id } } },
          skip,
          take: limit,
          orderBy: { rarity: "desc" },
        });
        return cards;
      },
      {
        query: t.Object({
          page: t.Optional(t.String()),
          search: t.Optional(t.String()),
        }),
        detail: { tags: ["Card"], description: "Resgata cartas do usuário" },
        response: {
          200: t.Array(
            t.Object({
              name: t.String(),
              id: t.Number(),
              card_id: t.String(),
              image_url: t.String(),
              rarity: t.Number(),
            }),
            {
              description: "Cartas do usuário",
            }
          ),
          401: t.Object(
            { error: t.String() },
            { description: "Token inválida" }
          ),
        },
      }
    )
    .get(
      "/",
      async ({ prisma, query, set }) => {
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
        return { cards };
      },
      {
        query: t.Object({
          page: t.Optional(
            t.String({ description: "Página escrita numericamente." })
          ),
          search: t.Optional(t.String({ description: "Pesquisa" })),
        }),
        detail: { tags: ["Card"], description: "Lista todas as cartas" },
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
          return { error: "Card not found" };
        }
        return { card };
      },
      {
        params: t.Object({ id: t.String() }),
        detail: { tags: ["Card"], description: "Lista a carta pelo seu" },
        response: {
            200: t.Object(
                {
                card: t.Object({
                    name: t.String(),
                    id: t.Number(),
                    card_id: t.String(),
                    image_url: t.String(),
                    rarity: t.Number(),
                }),
                },
                { description: "Carta encontrada" }
            ),
            404: t.Object(
                { error: t.String() },
                { description: "Carta não encontrada" }
            ),
            },
      }
    );
});
