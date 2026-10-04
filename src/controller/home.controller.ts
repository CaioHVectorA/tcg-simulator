import Elysia from "elysia";
import { prisma } from "../helpers/prisma.client";
import { jwt } from "../middlewares/jwt/jwt";
import { getUserUserMiddleware } from "../middlewares/jwt";
import { sucessResponse } from "../lib/mount-response";
import type { User } from "@prisma/client";
import { memoryCache, TTL } from "../lib/cache";

export const homeController = new Elysia({}).group("/home", (app) => {
  return app
    .decorate("prisma", prisma)
    .decorate("user", {} as User)
    .use(jwt)
    .onBeforeHandle(getUserUserMiddleware as any)
    .get("/", async ({ user }) => {
      // Paraleliza todas as consultas independentes em 1 único round-trip
      const [banners, rankingResult, rankingMoneyResult, topUserCards, totalUsers] = await Promise.all([
        memoryCache.getOrSet("active_banners", () => prisma.banner.findMany({ where: { active: true } }), TTL.FIVE_MINUTES),
        prisma.$queryRaw<{ position: number }[]>`
          SELECT COUNT(*)::int + 1 as position
          FROM "users"
          WHERE "rarityPoints" > ${(user.rarityPoints || 0)}
             OR ("rarityPoints" = ${(user.rarityPoints || 0)} AND id < ${user.id})
        `,
        prisma.$queryRaw<{ position: number }[]>`
          SELECT COUNT(*)::int + 1 as position
          FROM "users"
          WHERE "totalBudget" > ${(user.totalBudget || 0)}
             OR ("totalBudget" = ${(user.totalBudget || 0)} AND id < ${user.id})
        `,
        prisma.cards_user.findMany({
          where: { userId: user.id },
          orderBy: { Card: { rarity: "desc" } },
          take: 3,
          select: {
            Card: { select: { image_url: true } },
          },
        }),
        memoryCache.getOrSet("total_users_count", () => prisma.user.count(), TTL.ONE_MINUTE),
      ]);

      const topCards = topUserCards
        .map((uc) => uc.Card?.image_url)
        .filter(Boolean) as string[];

      if (topCards.length > 1) {
        [topCards[0], topCards[1]] = [topCards[1], topCards[0]];
      }

      const ranking = rankingResult[0];
      const rankingMoney = rankingMoneyResult[0];

      const data = {
        banners,
        ranking: {
          count: totalUsers,
          position: Number(ranking?.position || totalUsers + 1),
          total_rarity: Number(user.rarityPoints || 0),
        },
        rankingMoney: {
          count: totalUsers,
          position: Number(rankingMoney?.position || totalUsers + 1),
          total_money: Number(user.totalBudget || 0),
        },
        topCards,
      };

      return sucessResponse(data);
    });
});
