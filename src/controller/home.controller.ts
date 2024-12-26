import Elysia from "elysia";
import { prisma } from "../helpers/prisma.client";
import { jwt } from "../middlewares/jwt/jwt";
import { getUserInterceptor, getUserUserMiddleware } from "../middlewares/jwt";
import { errorResponse, sucessResponse } from "../lib/mount-response";
import type { User } from "@prisma/client";

export const homeController = new Elysia({}).group("/home", (app) => {
  return app
    .decorate("prisma", prisma)
    .decorate("user", {} as User)
    .use(jwt)
    .onBeforeHandle(getUserUserMiddleware as any)
    .get("/", async ({ user, set }) => {
      const banners = await prisma.banner.findMany({ where: { active: true } });
      const ranking = await prisma.user_Ranking.findUnique({
        where: { user_id: user.id },
      });
      const topCards = (
        await prisma.card.findMany({
          take: 3,
          orderBy: { rarity: "desc" },
          where: {
            Cards_user: {
              some: {
                userId: user.id,
              },
            },
          },
          select: {
            Cards_user: { select: { Card: { select: { image_url: true } } } },
          },
        })
      ).map((card) => card.Cards_user[0].Card.image_url);
      if (topCards.length > 1) {
        [topCards[0], topCards[1]] = [topCards[1], topCards[0]];
      }
      const count = await prisma.user.count();
      console.log({ ranking });
      const data = {
        banners,
        ranking: {
          count,
          position: Number(ranking?.position || count + 1),
          total_rarity: Number(ranking?.total_rarity || 0),
        },
        topCards,
      };
      console.log(data);
      return sucessResponse(data);
    });
});
