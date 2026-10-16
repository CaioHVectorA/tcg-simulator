import Elysia, { t } from "elysia";
import { prisma } from "../helpers/prisma.client";
import { jwt } from "../middlewares/jwt/jwt";
import { getUserUserMiddleware } from "../middlewares/jwt";
import { errorResponse, sucessResponse } from "../lib/mount-response";

export const onboardingController = new Elysia({}).group("/onboarding", (app) =>
  app
    .use(jwt)
    .decorate("user", {} as { id: number })
    .onBeforeHandle(getUserUserMiddleware as any)
    .get("/", async ({ user }) => {
      const owned = await prisma.cards_user.count({ where: { userId: user.id } });
      if (owned > 0) return sucessResponse({ completed: true, starters: [] });
      const starters = await prisma.card.findMany({
        where: { rarity: 4 },
        orderBy: { id: "asc" },
        take: 6,
        select: { id: true, name: true, image_url: true, rarity: true, type: true, hp: true },
      });
      return sucessResponse({ completed: false, starters });
    })
    .post("/starter", async ({ user, body, set }) => {
      const owned = await prisma.cards_user.count({ where: { userId: user.id } });
      if (owned > 0) return sucessResponse({ completed: true }, "Sua jornada já começou.");
      const ids = [...new Set(body.cardIds)];
      const cards = await prisma.card.findMany({ where: { id: { in: ids }, rarity: 4 }, select: { id: true, type: true } });
      if (ids.length !== 3 || cards.length !== 3 || new Set(cards.map(card => card.type)).size !== 3) { set.status = 400; return errorResponse("Escolha três iniciais de tipos diferentes.", "Escolha três iniciais de tipos diferentes."); }
      await prisma.cards_user.createMany({ data: cards.map(card => ({ userId: user.id, cardId: card.id })) });
      return sucessResponse({ completed: true, cardIds: cards.map(card => card.id) }, "Seu trio inicial entrou na coleção!");
    }, { body: t.Object({ cardIds: t.Array(t.Integer({ minimum: 1 }), { minItems: 3, maxItems: 3 }) }) })
);
