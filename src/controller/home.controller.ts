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
      // get the index between rarityPoints asc, like a position in ranking
      const ranking = (
        await prisma.$queryRaw<{ position: number }[]>`
      SELECT 
        COUNT(*)::int + 1 as position
      FROM 
        "users"
      WHERE 
        "rarityPoints" > (SELECT "rarityPoints" FROM "users" WHERE id = ${user.id})
        OR (
          "rarityPoints" = (SELECT "rarityPoints" FROM "users" WHERE id = ${user.id})
          AND id < ${user.id}
        )
    `
      )[0];
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
      const data = {
        banners,
        ranking: {
          count,
          position: Number(ranking?.position || count + 1),
          total_rarity: Number(user.rarityPoints || 0),
        },
        topCards,
      };
      console.log(data);
      return sucessResponse(data);
    });
});
