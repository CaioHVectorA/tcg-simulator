import Elysia, { t } from "elysia";
import { getUserInterceptor, getUserUserMiddleware } from "../middlewares/jwt";
import { prisma } from "../helpers/prisma.client";
import { jwt } from "../middlewares/jwt/jwt";
import type { User } from "@prisma/client";
import { errorResponse, sucessResponse } from "../lib/mount-response";

const baseResponse = t.Object({
  ok: t.Boolean(),
  toast: t.Union([t.String(), t.Null()]),
  error: t.Union([t.String(), t.Null()]),
  data: t.Any(),
});

export const tradeController = new Elysia({}).group("/trades", (app) => {
  return app
    .use(jwt)
    .decorate("prisma", prisma)
    .decorate("user", {} as User)
    .onBeforeHandle(getUserUserMiddleware as any)
    .get(
      "/",
      async ({ user, prisma, query, set }) => {
        const { page, search } = query;
        if (isNaN(Number(page))) {
          set.status = 400;
          return errorResponse("Página inválida", "Página inválida");
        }
        if (search) {
          const trades = await prisma.trade.findMany({
            skip: (Number(page) - 1) * 16,
            take: 16,
            where: {
              OR: [
                {
                  cards: {
                    some: {
                      Card: {
                        name: { startsWith: search, mode: "insensitive" },
                      },
                    },
                  },
                },
                { name: { startsWith: search, mode: "insensitive" } },
              ],
              expiresAt: { gte: new Date() },
            },
            orderBy: {
              createdAt: "desc",
            },
            select: {
              id: true,
              hash: true,
              cards: {
                select: {
                  Card: {
                    select: { image_url: true, name: true, card_id: true },
                  },
                  is_sender: true,
                },
              },
              userTrades: {
                select: { user_id: true, User: { select: { username: true } } },
              },
              _count: {
                select: { Trade_Offers: true },
              },
            },
          });
          const formatted = trades.map((t) => {
            const senderCards = t.cards
              .filter((c) => c.is_sender)
              .map((c) => ({
                name: c.Card.name,
                card_id: c.Card.card_id,
                image_url: c.Card.image_url,
              }));
            const receiverCards = t.cards
              .filter((c) => !c.is_sender)
              .map((c) => ({
                name: c.Card.name,
                card_id: c.Card.card_id,
                image_url: c.Card.image_url,
              }));
            const cards = { senderCards, receiverCards };
            return {
              ...cards,
              users: t.userTrades,
              offers: t._count.Trade_Offers,
              id: t.id,
              hash: t.hash,
            };
          });
          return sucessResponse(formatted);
        }
        const trades = await prisma.trade.findMany({
          orderBy: {
            createdAt: "desc",
          },
          skip: (Number(page) - 1) * 16,
          take: 16,
          where: { expiresAt: { gte: new Date() } },
          select: {
            id: true,
            hash: true,
            cards: {
              select: {
                Card: {
                  select: { image_url: true, name: true, card_id: true },
                },
                is_sender: true,
              },
            },
            userTrades: {
              select: { user_id: true, User: { select: { username: true } } },
            },
            _count: {
              select: { Trade_Offers: true },
            },
          },
        });
        // formatted should is a obj[] without subobjects
        const formatted = trades.map((t) => {
          const senderCards = t.cards
            .filter((c) => c.is_sender)
            .map((c) => ({
              name: c.Card.name,
              card_id: c.Card.card_id,
              image_url: c.Card.image_url,
            }));
          const receiverCards = t.cards
            .filter((c) => !c.is_sender)
            .map((c) => ({
              name: c.Card.name,
              card_id: c.Card.card_id,
              image_url: c.Card.image_url,
            }));
          const cards = { senderCards, receiverCards };
          return {
            ...cards,
            users: t.userTrades,
            offers: t._count.Trade_Offers,
            id: t.id,
            hash: t.hash,
          };
        });
        return sucessResponse(formatted);
      },
      {
        query: t.Object({
          page: t.String({
            error: "Você deve providenciar o número da página",
          }),
          search: t.Optional(t.String()),
        }),
        detail: { tags: ["Trade"], description: "Lista todas as trocas" },
        response: baseResponse,
      }
    )
    .get(
      "/:id",
      async ({ user, prisma, params }) => {
        const { id } = params;
        if (isNaN(Number(id))) {
          return errorResponse("ID inválido", "ID inválido");
        }
        const trade = await prisma.trade.findFirst({
          where: { id: Number(id) },
          include: { cards: true, userTrades: true, Trade_Offers: true },
        });
        if (!trade) {
          return errorResponse("Troca não encontrada", "Troca não encontrada");
        }
        return sucessResponse({
          cards: trade.cards,
          users: trade.userTrades,
        });
      },
      { detail: { tags: ["Trade"] }, response: baseResponse }
    )
    .get(
      "/available",
      async ({ user, prisma }) => {
        // available is the trades that user can make based on his cards
        const userCards = await prisma.cards_user.findMany({
          where: { userId: user.id },
          select: { cardId: true },
        });
        const trades = await prisma.trade.findMany({
          where: {
            cards: { every: { id: { in: userCards.map((c) => c.cardId) } } },
            userTrades: { none: { user_id: user.id } },
          },
        });
        return sucessResponse(trades);
      },
      { detail: { tags: ["Trade"] }, response: baseResponse }
    )
    .post(
      "/",
      async ({ body, user, prisma, set }) => {
        const {
          receiver_cards,
          sender_cards,
          acceptMoney,
          acceptOffers,
          daysCount,
          name,
          maxRarity,
          minRarity,
          moneyOffering,
          moneyReceiving,
          protocol,
          isPublic,
        } = body;
        const expiresAt = (() => {
          const date = new Date();
          date.setDate(date.getDate() + daysCount);
          return date;
        })();
        let debit = 1000 * daysCount;
        if (daysCount > 3) {
          debit = 2000 * daysCount;
        }
        if (user.money < debit) {
          return errorResponse("Saldo insuficiente", "Saldo insuficiente");
        }
        await prisma.user.update({
          where: { id: user.id },
          data: { money: { decrement: debit } },
        });
        const trade = await prisma.trade.create({
          data: {
            acceptMoney,
            acceptOffers,
            maxRarity,
            expiresAt,
            minRarity,
            moneySending: moneyOffering,
            moneyReceiving,
            protocol,
            public: isPublic,
            userTrades: {
              create: { user_id: user.id, is_sender: true },
            },
            name,
          },
        });
        const formatted_receiver_cards = receiver_cards.map((i) => ({
          card_id: i,
          is_sender: false,
          trade_id: trade.id,
        }));
        const formatted_sender_cards = sender_cards.map((i) => ({
          card_id: i,
          is_sender: true,
          trade_id: trade.id,
        }));
        await prisma.trade_Card.createMany({
          data: [...formatted_receiver_cards, ...formatted_sender_cards],
        });
        return sucessResponse({
          id: trade.id,
          hash: trade.hash,
        });
      },
      {
        body: t.Object({
          receiver_cards: t.Array(t.Number()),
          sender_cards: t.Array(t.Number()),
          protocol: t.String(),
          isPublic: t.Boolean(),
          acceptOffers: t.Boolean(),
          acceptMoney: t.Boolean(),
          minRarity: t.Number(),
          maxRarity: t.Number(),
          name: t.String(),
          moneyReceiving: t.Number(),
          moneyOffering: t.Number(),
          daysCount: t.Number(),
        }),
        detail: { tags: ["Trade"], responses: baseResponse },
      }
    )
    .post(
      "/:id/offer",
      async ({ body, user, prisma, params }) => {
        const { id } = params;
        if (isNaN(Number(id))) {
          return errorResponse("ID inválido", "ID inválido");
        }
        const myAlreadyOffered = await prisma.trade_Offer.findFirst({
          where: { trade_id: Number(id), user_id: user.id },
        });

        if (
          myAlreadyOffered &&
          myAlreadyOffered.createdAt > new Date(Date.now() - 1000 * 60 * 60)
        ) {
          return errorResponse(
            "Espere 1 hora para enviar outra oferta",
            "Espere 1 hora para enviar outra oferta"
          );
        }
        const trade = await prisma.trade.findFirst({
          where: { id: Number(id) },
          include: { cards: true, userTrades: true },
        });
        if (!trade) {
          return errorResponse("Troca não encontrada", "Troca não encontrada");
        }
        if (!trade.acceptOffers) {
          return errorResponse(
            "Esta troca não aceita ofertas",
            "Esta troca não aceita ofertas"
          );
        }
        if (trade.userTrades.some((t) => t.user_id === user.id)) {
          return errorResponse(
            "Você já aceitou esta troca",
            "Você já aceitou esta troca"
          );
        }
        const { cards, money } = body;
        const tradeOffer = await prisma.trade_Offer.create({
          data: {
            money: money,
            user_id: user.id,
            trade_id: trade.id,
          },
        });
        const offerCards = await prisma.trade_Offer_Cards.createMany({
          data: cards.map((c) => ({ card_id: c, trade_id: tradeOffer.id })),
        });
        return sucessResponse(null, "Oferta enviada com sucesso!");
      },
      {
        body: t.Object({
          cards: t.Array(t.Number()),
          money: t.Number(),
        }),
        params: t.Object({
          id: t.String(),
        }),
        detail: { tags: ["Trade"], responses: baseResponse },
      }
    )
    .get(
      "/my",
      async ({ user, prisma }) => {
        const trades = await prisma.trade.findMany({
          where: {
            userTrades: {
              some: { user_id: user.id, is_sender: true },
            },
          },
        });
        // return trades;
        return sucessResponse(trades);
      },
      { detail: { tags: ["Trade"] }, response: baseResponse }
    )
    .post(
      "/accept/:id",
      async ({ user, prisma, params }) => {
        const { id } = params;
        if (isNaN(Number(id))) {
          return errorResponse("ID inválido", "ID inválido");
        }
        const trade = await prisma.trade.findFirst({
          where: { id: Number(id) },
          include: { userTrades: true },
        });
        if (!trade) {
          return errorResponse("Troca não encontrada", "Troca não encontrada");
        }
        if (trade.userTrades.some((t) => t.user_id === user.id)) {
          return errorResponse(
            "Você já aceitou esta troca",
            "Você já aceitou esta troca"
          );
        }
        await prisma.user_Trade.create({
          data: { user_id: user.id, trade_id: trade.id, is_sender: false },
        });
        return sucessResponse(null, "Trade aceita com sucesso!");
      },
      { detail: { tags: ["Trade"] }, response: baseResponse }
    )
    .get(
      "/my/accepted",
      async ({ user, prisma }) => {
        const trades = await prisma.trade.findMany({
          where: {
            userTrades: {
              some: { user_id: user.id, is_sender: false },
            },
          },
        });
        return sucessResponse(trades);
      },
      { detail: { tags: ["Trade"] }, response: baseResponse }
    );
});
