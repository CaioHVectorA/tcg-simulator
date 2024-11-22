import Elysia, { t } from "elysia";
import { getUserInterceptor } from "../middlewares/jwt";
import { prisma } from "../helpers/prisma.client";
import { jwt } from "../middlewares/jwt/jwt";

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
    .derive(getUserInterceptor)
    .get(
      "/",
      async ({ user, prisma, query, set }) => {
        if (!user) {
          set.status = 401;
          return {
            ok: false,
            toast: "É necessário estar autenticado para acessar este recurso.",
            error: "Sem token de autorização!",
            data: null,
          };
        }
        const { page, search } = query;
        if (isNaN(Number(page))) {
          set.status = 400;
          return {
            ok: false,
            toast: "Página inválida",
            error: "Página inválida",
            data: null,
          };
        }
        if (search) {
          const trades = await prisma.trade.findMany({
            skip: (Number(page) - 1) * 16,
            take: 16,
            where: {
              OR: [
                { cards: { some: { Card: { name: { contains: search } } } } },
              ],
            },
          });
          return {
            ok: true,
            toast: null,
            error: null,
            data: trades,
          };
        }
        const trades = await prisma.trade.findMany({
          skip: (Number(page) - 1) * 16,
          take: 16,
          select: {
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
          },
        });
        // formatted should is a obj[] without subobjects
        const formatted = trades.map((t) => {
          const cards = t.cards.map((c) => ({
            is_sender: c.is_sender,
            name: c.Card.name,
            card_id: c.Card.card_id,
            image_url: c.Card.image_url,
          }));
          return { cards, users: t.userTrades };
        });
        return {
          ok: true,
          toast: null,
          error: null,
          data: formatted,
        };
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
        if (!user)
          return {
            ok: false,
            toast: "É necessário estar autenticado para acessar este recurso.",
            error: "Sem token de autorização!",
            data: null,
          };
        const { id } = params;
        if (isNaN(Number(id)))
          return {
            ok: false,
            toast: "ID inválido",
            error: "ID inválido",
            data: null,
          };
        const trade = await prisma.trade.findFirst({
          where: { id: Number(id) },
          include: { cards: true, userTrades: true },
        });
        if (!trade)
          return {
            ok: false,
            toast: "Troca não encontrada",
            error: "Troca não encontrada",
            data: null,
          };
        return {
          // cards: trade.cards,
          // users: trade.userTrades,
          ok: true,
          toast: null,
          error: null,
          data: {
            cards: trade.cards,
            users: trade.userTrades,
          },
        };
      },
      { detail: { tags: ["Trade"] }, response: baseResponse }
    )
    .get(
      "/available",
      async ({ user, prisma }) => {
        if (!user)
          return {
            ok: false,
            toast: "É necessário estar autenticado para acessar este recurso.",
            error: "Sem token de autorização!",
            data: null,
          };
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
        return {
          ok: true,
          toast: null,
          error: null,
          data: trades,
        };
      },
      { detail: { tags: ["Trade"] }, response: baseResponse }
    )
    .post(
      "/",
      async ({ body, user, prisma, set }) => {
        if (!user) return { body: { error: "Unauthorized" } };
        const { receiver_cards, sender_cards } = body;
        const trade = await prisma.trade.create({});
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
        // return trade.id;
        return {
          ok: true,
          toast: null,
          error: null,
          data: trade.id,
        };
      },
      {
        body: t.Object({
          receiver_cards: t.Array(t.Number()),
          sender_cards: t.Array(t.Number()),
        }),
        detail: { tags: ["Trade"], responses: baseResponse },
      }
    )
    .get(
      "/my",
      async ({ user, prisma }) => {
        if (!user)
          return {
            ok: false,
            toast: "É necessário estar autenticado para acessar este recurso.",
            error: "Sem token de autorização!",
            data: null,
          };
        const trades = await prisma.trade.findMany({
          where: {
            userTrades: {
              some: { user_id: user.id, is_sender: true },
            },
          },
        });
        // return trades;
        return {
          ok: true,
          toast: null,
          error: null,
          data: trades,
        };
      },
      { detail: { tags: ["Trade"] }, response: baseResponse }
    )
    .post(
      "/accept/:id",
      async ({ user, prisma, params }) => {
        if (!user)
          return {
            ok: false,
            toast: "É necessário estar autenticado para acessar este recurso.",
            error: "Sem token de autorização!",
            data: null,
          };
        const { id } = params;
        if (isNaN(Number(id)))
          return {
            ok: false,
            toast: "ID inválido",
            error: "ID inválido",
            data: null,
          };
        const trade = await prisma.trade.findFirst({
          where: { id: Number(id) },
          include: { userTrades: true },
        });
        if (!trade)
          return {
            ok: false,
            toast: "Troca não encontrada",
            error: "Troca não encontrada",
            data: null,
          };
        if (trade.userTrades.some((t) => t.user_id === user.id)) {
          return {
            ok: false,
            toast: "Você já aceitou esta troca",
            error: "Você já aceitou esta troca",
            data: null,
          };
        }
        await prisma.user_Trade.create({
          data: { user_id: user.id, trade_id: trade.id, is_sender: false },
        });
        return {
          ok: true,
          toast: "Trade aceita com sucesso!",
          error: null,
          data: null,
        };
      },
      { detail: { tags: ["Trade"] }, response: baseResponse }
    )
    .get(
      "/my/accepted",
      async ({ user, prisma }) => {
        if (!user)
          return {
            ok: false,
            toast: "É necessário estar autenticado para acessar este recurso.",
            error: "Sem token de autorização!",
            data: null,
          };
        const trades = await prisma.trade.findMany({
          where: {
            userTrades: {
              some: { user_id: user.id, is_sender: false },
            },
          },
        });
        return {
          ok: true,
          toast: null,
          error: null,
          data: trades,
        };
      },
      { detail: { tags: ["Trade"] }, response: baseResponse }
    );
});
