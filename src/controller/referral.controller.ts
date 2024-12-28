import type { User } from "@prisma/client";
import { prisma } from "../helpers/prisma.client";
import { sucessResponse } from "../lib/mount-response";
import { getUserUserMiddleware } from "../middlewares/jwt";
import Elysia from "elysia";
import { jwt } from "../middlewares/jwt/jwt";

export const bannerController = new Elysia({}).group("/referral", (app) => {
  return app
    .decorate("prisma", prisma)
    .use(jwt)
    .decorate("user", {} as User)
    .onBeforeHandle(getUserUserMiddleware as any)
    .get("/my-referrals", async ({ prisma, user }) => {});
});
