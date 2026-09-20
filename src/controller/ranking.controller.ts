import Elysia, { t } from "elysia";
import { prisma } from "../helpers/prisma.client";
import { sucessResponse } from "../lib/mount-response";
import { jwt } from "../middlewares/jwt/jwt";
import { getUserUserMiddleware } from "../middlewares/jwt";
import type { User } from "@prisma/client";

export const rankingController = new Elysia({}).group("/ranking", (app) => {
  return (
    app
      .get(
        "/",
        async ({ query }) => {
          const { page } = query;
          const limit = 10;
          const offset = (parseInt(page ?? "1") - 1) * limit;
          const ranking = await prisma.user.findMany({
            take: Number(limit ?? 10),
            skip: Number(offset ?? 0),
            orderBy: {
              rarityPoints: "desc",
            },
            select: {
              // total_rarity: true,
              // position: true,
              // user: {
              // select: {
              // username: true,
              // picture: true,
              // id: true,
              // },
              // },
              username: true,
              picture: true,
              id: true,
              rarityPoints: true,
            },
          });
          return sucessResponse(ranking);
        },
        {
          query: t.Object({
            page: t.Optional(t.String()),
          }),
        }
      )
      .get(
        "/monetary",
        async ({ query }) => {
          const { page } = query;
          const limit = 10;
          const offset = (parseInt(page ?? "1") - 1) * limit;
          const ranking = await prisma.user.findMany({
            take: Number(limit ?? 10),
            skip: Number(offset ?? 0),
            orderBy: {
              totalBudget: "desc",
            },
            select: {
              username: true,
              picture: true,
              id: true,
              totalBudget: true,
            },
          });
          return sucessResponse(ranking);
        },
        {
          query: t.Object({
            page: t.Optional(t.String()),
          }),
        }
      )
      // todo ranking to completed quests
      .get("/quests", async ({ query }) => {
        const { page } = query;
        const limit = 10;
        const offset = (parseInt(page ?? "1") - 1) * limit;
        const ranking = await prisma.user.findMany({
          take: Number(limit ?? 10),
          skip: Number(offset ?? 0),
          orderBy: {
            totalBudget: "desc",
          },
          select: {
            username: true,
            picture: true,
            id: true,
            totalBudget: true,
          },
        });
        return sucessResponse(ranking);
      })
      .use(jwt)
      .decorate("user", {} as User)
      .onBeforeHandle(getUserUserMiddleware as any)
      .post("/sync", async ({ user }) => {
        const cards = await prisma.cards_user.findMany({
          where: { userId: user.id },
          include: { Card: { select: { rarity: true } } },
        });
        const realSum = cards.reduce((sum, cu) => sum + (cu.Card?.rarity || 1), 0);
        await prisma.user.update({
          where: { id: user.id },
          data: { rarityPoints: realSum },
        });
        return sucessResponse(
          { rarityPoints: realSum },
          "Pontos de raridade sincronizados com sucesso!"
        );
      })
  );
});
