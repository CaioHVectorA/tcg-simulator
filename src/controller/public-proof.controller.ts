import Elysia from "elysia";
import { prisma } from "../helpers/prisma.client";
import { sucessResponse } from "../lib/mount-response";
import { memoryCache, TTL } from "../lib/cache";

export const publicProofController = new Elysia({}).get("/public/proof", async () => {
  const data = await memoryCache.getOrSet("public_proof", async () => {
    const [cards, trainers, trades] = await Promise.all([prisma.card.count(), prisma.user.count(), prisma.trade.count({ where: { public: true } })]);
    return { cards, trainers, trades };
  }, TTL.FIVE_MINUTES);
  return sucessResponse(data);
});
