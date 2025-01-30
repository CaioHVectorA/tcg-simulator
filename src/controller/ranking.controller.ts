import Elysia, { t } from "elysia";
import { prisma } from "../helpers/prisma.client";
import { sucessResponse } from "../lib/mount-response";

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
  );
});
