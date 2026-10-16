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
      const card = await prisma.card.findFirst({ where: { id: body.cardId, rarity: 4 }, select: { id: true } });
      if (!card) { set.status = 400; return errorResponse("Escolha um inicial válido.", "Escolha um inicial válido."); }
      await prisma.cards_user.create({ data: { userId: user.id, cardId: card.id } });
      return sucessResponse({ completed: true, cardId: card.id }, "Seu inicial entrou na coleção!");
    }, { body: t.Object({ cardId: t.Integer({ minimum: 1 }) }) })
);
