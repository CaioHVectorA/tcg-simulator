import Elysia, { t } from "elysia";
import { getUserInterceptor } from "../middlewares/jwt";
import { prisma } from "../helpers/prisma.client";
import { jwt } from "../middlewares/jwt/jwt";

export const tradeController = new Elysia({})
  .group("/trades", (app) => {
  return app
  .use(jwt)
  .decorate("prisma", prisma)
  .derive(getUserInterceptor)
  .get(
    "/",
    async ({ user, prisma, query }) => {
      if (!user) return { body: { error: "Unauthorized" } };
      const { page, search } = query;
      if (isNaN(Number(page))) return { body: { error: "Invalid page" } };
      if (search) {
        const trades = await prisma.trade.findMany({
          skip: (Number(page) - 1) * 16,
          take: 16,
          where: {
            OR: [{ cards: { some: { Card: { name: { contains: search } } } } }],
          },
        });
        return trades;
      }
      const trades = await prisma.trade.findMany({
        skip: (Number(page) - 1) * 16,
        take: 16,
      });
      return trades;
    },
    {
      query: t.Object({
        page: t.String({ error: "Você deve providenciar o número da página" }),
        search: t.Optional(t.String()),
      }),
      detail: { tags: ["Trade"] },
    }
  )
  .get("/:id", async ({ user, prisma, params }) => {
    if (!user) return { body: { error: "Unauthorized" } };
    const { id } = params;
    if (isNaN(Number(id))) return { body: { error: "Invalid id" } };
    const trade = await prisma.trade.findFirst({ where: { id: Number(id) } });
    if (!trade) return { body: { error: "Trade not found" } };
    return trade;
  })
  .get("/available", async ({ user, prisma }) => {
    if (!user) return { body: { error: "Unauthorized" } };
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
    return trades;
  }, { detail: { tags: ["Trade"] } })
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
      return trade.id;
    },
    {
      body: t.Object({
        receiver_cards: t.Array(t.Number()),
        sender_cards: t.Array(t.Number()),
      }),
      detail: { tags: ["Trade"] },
    }
  )
  .get("/my", async ({ user, prisma }) => {
    if (!user) return { body: { error: "Unauthorized" } };
    const trades = await prisma.trade.findMany({
      where: {
        userTrades: {
          some: { user_id: user.id, is_sender: true },
        },
      },
    });
    return trades;
  }, { detail: { tags: ["Trade"] } })
  .post("/accept/:id", async ({ user, prisma, params }) => {
    if (!user) return { body: { error: "Unauthorized" } };
    const { id } = params;
    if (isNaN(Number(id))) return { body: { error: "Invalid id" } };
    const trade = await prisma.trade.findFirst({
      where: { id: Number(id) },
      include: { userTrades: true },
    });
    if (!trade) return { body: { error: "Trade not found" } };
    if (trade.userTrades.some((t) => t.user_id === user.id))
      return { body: { error: "You already accepted this trade" } };
    await prisma.user_Trade.create({
      data: { user_id: user.id, trade_id: trade.id, is_sender: false },
    });
    return { message: "Trade accepted" };
  }, { detail: { tags: ["Trade"] } })
  .get("/my/accepted", async ({ user, prisma }) => {
    if (!user) return { body: { error: "Unauthorized" } };
    const trades = await prisma.trade.findMany({
      where: {
        userTrades: {
          some: { user_id: user.id, is_sender: false },
        },
      },
    });
    return trades;
  }, { detail: { tags: ["Trade"] } })
})
