import Elysia from "elysia";
import { prisma } from "../helpers/prisma.client";

export const storeController = new Elysia({}).group("/store", (app) => {
  return app.decorate("prisma", prisma).get("/data", async ({ prisma }) => {
    const promotionalCards = await prisma.promotional_Cards.findMany({
      select: {
        card_id: true,
        id: true,
        price: true,
        created_at: true,
        updated_at: true,
        card: {
          select: {
            image_url: true,
            name: true,
            rarity: true,
          },
        },
      },
    });
    const packages = await prisma.package.findMany({
      select: {
        id: true,
        name: true,
        image_url: true,
        tcg_id: true,
        price: true,
      },
    });
    const tematics = packages.filter((p) => p.tcg_id);
    const standard = packages.filter((p) => !p.tcg_id);
    return {
      toast: null,
      data: {
        promotionalCards,
        tematics,
        standard,
      },
      ok: true,
      error: null,
    };
  });
  // checkout,
});
