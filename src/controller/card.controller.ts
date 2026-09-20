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
      "/search",
      async ({ prisma, query }) => {
        const searchTerm = (query.query || query.search || "").trim();
        if (!searchTerm || searchTerm.length < 2) {
          return sucessResponse([]);
        }
        const cards = await prisma.card.findMany({
          where: {
            name: { contains: searchTerm, mode: "insensitive" },
          },
          take: 24,
          orderBy: { rarity: "desc" },
        });
        return sucessResponse(cards);
      },
      {
        query: t.Object({
          query: t.Optional(t.String()),
          search: t.Optional(t.String()),
        }),
        detail: { tags: ["Card"], description: "Busca cartas no catálogo" },
        response: baseResponse,
      }
    )
    .get(
      "/my-tradeable",
      async ({ prisma, user }) => {
        const userCards = await prisma.cards_user.findMany({
          where: { userId: user.id },
          include: { Card: true },
          orderBy: { Card: { rarity: "desc" } },
        });

        const map = new Map<number, { id: number; Card: any; quantity: number }>();
        for (const uc of userCards) {
          if (!uc.Card) continue;
          if (map.has(uc.cardId)) {
            map.get(uc.cardId)!.quantity++;
          } else {
            map.set(uc.cardId, {
              id: uc.id,
              Card: uc.Card,
              quantity: 1,
            });
          }
        }
        return sucessResponse(Array.from(map.values()));
      },
      {
        detail: { tags: ["Card"], description: "Retorna cartas do inventário para trocas" },
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
        const { page, search, favorites } = query;
        const skip = search ? 0 : (parseInt(page || "1") - 1) * limit;
        const isFavoritesOnly = favorites === "true";
        const where: Prisma.CardWhereInput = {
          ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
          ...(isFavoritesOnly ? { FavoriteCard: { some: { userId: user.id } } } : {}),
        };
        const count = await prisma.card.count({
          where: { ...where, Cards_user: { some: { userId: user.id } } },
        });
        const cards = await prisma.card.findMany({
          where: { ...where, Cards_user: { some: { userId: user.id } } },
          skip,
          take: limit,
          orderBy: { rarity: "desc" },
        });

        const cardIds = cards.map((c) => c.id);
        const [counts, userFavs] = await Promise.all([
          prisma.cards_user.groupBy({
            by: ["cardId"],
            where: {
              userId: user.id,
              cardId: { in: cardIds },
            },
            _count: { cardId: true },
          }),
          prisma.favoriteCard.findMany({
            where: {
              userId: user.id,
              cardId: { in: cardIds },
            },
            select: { cardId: true },
          }),
        ]);

        const countsMap = new Map(counts.map((c) => [c.cardId, c._count.cardId]));
        const favsSet = new Set(userFavs.map((f) => f.cardId));

        const cardsWithQuantity = cards.map((card) => ({
          ...card,
          quantity: countsMap.get(card.id) || 1,
          isFavorite: favsSet.has(card.id),
        }));

        return sucessResponse({
          data: cardsWithQuantity,
          totalPages: Math.ceil(count / limit) || 1,
          currentPage: parseInt(page || "1"),
          totalCards: count,
        });
      },
      {
        query: t.Object({
          page: t.Optional(t.String()),
          search: t.Optional(t.String()),
          favorites: t.Optional(t.String()),
        }),
        detail: { tags: ["Card"], description: "Resgata cartas do usuário" },
        response: baseResponse,
      }
    )
    .get(
      "/album",
      async ({ prisma, query, user }) => {
        const limit = 24;
        const { page, search, filter, rarity } = query;
        const pageNum = Math.max(1, parseInt(page || "1"));
        const skip = (pageNum - 1) * limit;

        const baseWhere: Prisma.CardWhereInput = {};
        if (search) {
          baseWhere.name = { contains: search, mode: "insensitive" };
        }
        if (rarity && !isNaN(parseInt(rarity))) {
          baseWhere.rarity = parseInt(rarity);
        }

        if (filter === "owned") {
          baseWhere.Cards_user = { some: { userId: user.id } };
        } else if (filter === "missing") {
          baseWhere.Cards_user = { none: { userId: user.id } };
        } else if (filter === "favorites") {
          baseWhere.FavoriteCard = { some: { userId: user.id } };
        }

        const [totalMatching, cards, totalInGame, distinctOwnedGroup, favsCount] = await Promise.all([
          prisma.card.count({ where: baseWhere }),
          prisma.card.findMany({
            where: baseWhere,
            skip,
            take: limit,
            orderBy: [{ rarity: "desc" }, { id: "asc" }],
          }),
          prisma.card.count(),
          prisma.cards_user.groupBy({
            by: ["cardId"],
            where: { userId: user.id },
          }),
          prisma.favoriteCard.count({ where: { userId: user.id } }),
        ]);

        const cardIdsOnPage = cards.map((c) => c.id);

        const [userCardsOnPage, userFavsOnPage] = await Promise.all([
          prisma.cards_user.groupBy({
            by: ["cardId"],
            where: {
              userId: user.id,
              cardId: { in: cardIdsOnPage },
            },
            _count: { cardId: true },
          }),
          prisma.favoriteCard.findMany({
            where: {
              userId: user.id,
              cardId: { in: cardIdsOnPage },
            },
            select: { cardId: true },
          }),
        ]);

        const quantitiesMap = new Map(userCardsOnPage.map((u) => [u.cardId, u._count.cardId]));
        const favsSet = new Set(userFavsOnPage.map((f) => f.cardId));

        const cardsWithStatus = cards.map((card) => {
          const quantity = quantitiesMap.get(card.id) || 0;
          return {
            ...card,
            quantity,
            isOwned: quantity > 0,
            isFavorite: favsSet.has(card.id),
          };
        });

        const distinctOwnedCount = distinctOwnedGroup.length;
        const completionPercentage = totalInGame > 0 ? Math.round((distinctOwnedCount / totalInGame) * 100) : 0;

        return sucessResponse({
          data: cardsWithStatus,
          totalPages: Math.ceil(totalMatching / limit) || 1,
          currentPage: pageNum,
          totalCards: totalMatching,
          stats: {
            totalInGame,
            totalOwnedDistinct: distinctOwnedCount,
            completionPercentage,
            favoritesCount: favsCount,
          },
        });
      },
      {
        query: t.Object({
          page: t.Optional(t.String()),
          search: t.Optional(t.String()),
          filter: t.Optional(t.String()),
          rarity: t.Optional(t.String()),
        }),
        detail: { tags: ["Card"], description: "Retorna o álbum de cartas com status de posse e favoritos" },
        response: baseResponse,
      }
    )
    .post(
      "/:id/favorite",
      async ({ prisma, params, user, set }) => {
        const cardId = parseInt(params.id);
        if (isNaN(cardId)) {
          set.status = 400;
          return errorResponse("ID de carta inválido", "Carta inválida");
        }

        const existing = await prisma.favoriteCard.findUnique({
          where: {
            userId_cardId: {
              userId: user.id,
              cardId,
            },
          },
        });

        if (existing) {
          await prisma.favoriteCard.delete({
            where: { id: existing.id },
          });
          return sucessResponse({ isFavorite: false }, "Carta removida dos favoritos");
        } else {
          await prisma.favoriteCard.create({
            data: {
              userId: user.id,
              cardId,
            },
          });
          return sucessResponse({ isFavorite: true }, "Carta adicionada aos favoritos! ❤️");
        }
      },
      {
        params: t.Object({ id: t.String() }),
        detail: { tags: ["Card"], description: "Alterna favorito da carta" },
        response: {
          200: baseResponse,
          400: baseResponse,
          401: baseResponse,
        },
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
