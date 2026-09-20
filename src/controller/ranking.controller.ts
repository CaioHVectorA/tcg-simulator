import Elysia, { t } from "elysia";
import { prisma } from "../helpers/prisma.client";
import { sucessResponse } from "../lib/mount-response";
import { jwt } from "../middlewares/jwt/jwt";
import { getUserUserMiddleware } from "../middlewares/jwt";
import type { User } from "@prisma/client";

// Cache em memória de 60s para rankings
const rankingCache = new Map<string, { data: any[]; timestamp: number }>();
const CACHE_TTL_MS = 60 * 1000;

function getCachedRanking(key: string) {
  const entry = rankingCache.get(key);
  if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
    return entry.data;
  }
  return null;
}

function setCachedRanking(key: string, data: any[]) {
  rankingCache.set(key, { data, timestamp: Date.now() });
}

async function getRarityRanking(pageStr?: string) {
  const page = Math.max(1, parseInt(pageStr ?? "1") || 1);
  const limit = 15;
  const offset = (page - 1) * limit;
  const cacheKey = `rarity-page-${page}`;

  const cached = getCachedRanking(cacheKey);
  if (cached) return cached;

  const users = await prisma.user.findMany({
    take: limit,
    skip: offset,
    orderBy: {
      rarityPoints: "desc",
    },
    select: {
      username: true,
      picture: true,
      id: true,
      rarityPoints: true,
    },
  });

  const formatted = users.map((u, idx) => ({
    ...u,
    position: offset + idx + 1,
  }));

  setCachedRanking(cacheKey, formatted);
  return formatted;
}

async function getBudgetRanking(pageStr?: string) {
  const page = Math.max(1, parseInt(pageStr ?? "1") || 1);
  const limit = 15;
  const offset = (page - 1) * limit;
  const cacheKey = `budget-page-${page}`;

  const cached = getCachedRanking(cacheKey);
  if (cached) return cached;

  const users = await prisma.user.findMany({
    take: limit,
    skip: offset,
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

  const formatted = users.map((u, idx) => ({
    ...u,
    position: offset + idx + 1,
  }));

  setCachedRanking(cacheKey, formatted);
  return formatted;
}

export const rankingController = new Elysia({}).group("/ranking", (app) => {
  return app
    .get(
      "/",
      async ({ query }) => {
        const data = await getRarityRanking(query.page);
        return sucessResponse(data);
      },
      { query: t.Object({ page: t.Optional(t.String()) }) }
    )
    .get(
      "/rarity",
      async ({ query }) => {
        const data = await getRarityRanking(query.page);
        return sucessResponse(data);
      },
      { query: t.Object({ page: t.Optional(t.String()) }) }
    )
    .get(
      "/monetary",
      async ({ query }) => {
        const data = await getBudgetRanking(query.page);
        return sucessResponse(data);
      },
      { query: t.Object({ page: t.Optional(t.String()) }) }
    )
    .get(
      "/budget",
      async ({ query }) => {
        const data = await getBudgetRanking(query.page);
        return sucessResponse(data);
      },
      { query: t.Object({ page: t.Optional(t.String()) }) }
    )
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

      // Invalida cache de ranking para atualização imediata
      rankingCache.clear();

      return sucessResponse(
        { rarityPoints: realSum },
        "Pontos de raridade sincronizados com sucesso!"
      );
    });
});
