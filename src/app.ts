import { existsSync, readdirSync } from "node:fs";
import { DomainError } from "./lib/domain-error";
import { rateLimit } from "./lib/rate-limit";
import { getLocaleFromHeaders, localizeResponse } from "./i18n";
import { receiveUser } from "./middlewares/jwt";
import { areaController } from "./controller/area.controller";
import { html } from "@elysiajs/html";
import { cors } from "@elysiajs/cors";
import { compare } from "bcrypt";
import { Elysia, t } from "elysia";
import { userController } from "./controller/user.controller";
import { packageController } from "./controller/package.controller";
import { tradeController } from "./controller/trade.controller";
import { cardController } from "./controller/card.controller";
import { authController } from "./controller/auth.controller";
import { cron } from "@elysiajs/cron";
import { swagger } from "./middlewares/swagger";
import { bannerController } from "./controller/banner.controller";
import { homeController } from "./controller/home.controller";
import { staticPlugin } from "@elysiajs/static";
import { RankingCron, runRankingSync } from "./lib/ranking-cron";
import { rankingController } from "./controller/ranking.controller";
import { CardsCron } from "./lib/cards-cron";
import { helmet } from "elysia-helmet";
import { storeController } from "./controller/store.controller";
import { errorResponse } from "./lib/mount-response";
import { AUTH_ERROR } from "./helpers/const";
import { specialController } from "./controller/special.controller";
import { referralController } from "./controller/referral.controller";
import { questsController } from "./controller/quests.controller";
import { DiaryQuestsCron } from "./lib/diary-quests-cron";
import { messageController } from "./controller/message.controller";
import { notificationController } from "./controller/notification.controller";
import { albumController } from "./controller/album.controller";
import { battleController } from "./controller/battle.controller";
import { onboardingController } from "./controller/onboarding.controller";
import { publicProofController } from "./controller/public-proof.controller";
import { wsManager } from "./lib/ws-manager";
import { jwt } from "./middlewares/jwt/jwt";
import { warmupCardsCache } from "./lib/open-package";
import { prisma } from "./helpers/prisma.client";
import { BoosterBufferService } from "./services/booster-buffer.service";
export const app = new Elysia({
  precompile: false,
  //@ts-ignore
  serve: { idleTimeout: 30 },
})
  .use(existsSync("public") && readdirSync("public").length > 0 ? staticPlugin() : new Elysia())
  .use(helmet())
  .use(jwt)
  .use(
    cors({
      origin: process.env.CLIENT_URL?.split(",").map((url) => url.trim()) || ["http://localhost:3000"],
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      allowedHeaders: ["Content-Type", "Authorization", "Accept-Language", "X-Locale", "Idempotency-Key"],
      exposeHeaders: ["Content-Type", "Authorization", "Accept-Language", "X-Locale", "Idempotency-Key"],
      credentials: true,
    })
  )
  .ws("/ws", {
    async open(ws: any) {
      try {
        const token = (ws.data.query as any)?.token;
        if (!token) {
          ws.send(JSON.stringify({ type: "ERROR", message: "Token não fornecido" }));
          ws.close(4001, "No token");
          return;
        }
        const payload: any = await (ws.data as any).jwt.verify(token);
        if (!payload || !payload.id) {
          ws.send(JSON.stringify({ type: "ERROR", message: "Token inválido" }));
          ws.close(4002, "Invalid token");
          return;
        }
        const authenticated = await receiveUser(token, ws.data.jwt);
        const userId = authenticated.id;
        (ws as any).userId = userId;
        await wsManager.register(userId, ws);
        ws.send(JSON.stringify({ type: "CONNECTED", payload: { userId } }));
      } catch (err) {
        console.error(JSON.stringify({ event: "socket_auth_failed" }));
        ws.close(4003, "Auth error");
      }
    },
    async message(ws: any, message: any) {
      if (message === "ping" || (typeof message === "object" && (message as any)?.type === "ping")) {
        ws.send(JSON.stringify({ type: "PONG", timestamp: new Date().toISOString() }));
      }
    },
    async close(ws: any) {
      const userId = (ws as any).userId;
      if (userId) {
        await wsManager.unregister(userId, ws);
      }
    },
  })
  .use(swagger)
  .onBeforeHandle(({ request, server }) => {
    const path = new URL(request.url).pathname;
    if (request.method === "POST" && path.startsWith("/auth/")) {
      const ip = server?.requestIP(request)?.address || "unknown";
      rateLimit(`auth:${ip}`, 20);
    }
  })
  .onError(({ error, code, set, headers }) => {
    const locale = getLocaleFromHeaders(headers);
    if (error instanceof DomainError) {
      set.status = error.status;
      return errorResponse(error.key, error.key, locale);
    }
    if (error instanceof Error && error.message === AUTH_ERROR) {
      set.status = 401;
      return errorResponse("auth.unauthorized", "auth.unauthorized", locale);
    }
    if (code === "VALIDATION" || code === "PARSE") {
      set.status = 400;
      return errorResponse("common.invalidRequest", "common.invalidRequest", locale);
    }
    if (code === "NOT_FOUND") {
      set.status = 404;
      return errorResponse("common.invalidRequest", undefined, locale);
    }
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      set.status = 409;
      return errorResponse("common.requestConflict", "common.requestConflict", locale);
    }
    // Structured diagnostic without query, body, token, credentials or SQL parameters.
    console.error(JSON.stringify({ event: "request_failed", code, type: error instanceof Error ? error.name : "Unknown" }));
    set.status = 500;
    return errorResponse("common.error", "common.error", locale);
  })
  .onAfterHandle(({ response, headers, request }) => {
    const path = new URL(request.url).pathname;
    const data = /^(\/packages|\/store\/data|\/albums|\/battle|\/quests|\/areas|\/user\/(daily-road|level-road))/.test(path);
    return localizeResponse(response, getLocaleFromHeaders(headers), data);
  })
  .get("/ping", () => "pong")
  .get("/health/ready", async ({ set }: { set: { status?: number | string } }) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return { ready: true };
    } catch {
      set.status = 503;
      return { ready: false };
    }
  })
  .use(authController)
  .use(userController)
  .use(packageController)
  .use(tradeController)
  .use(cardController)
  .use(questsController)
  .use(bannerController)
  .use(homeController)
  .use(onboardingController)
  .use(publicProofController)
  .use(rankingController)
  .use(storeController)
  .use(referralController)
  .use(specialController)
  .use(messageController)
  .use(notificationController)
  .use(albumController)
  .use(battleController)
  .use(areaController)
;

export function startBackgroundJobs() {
  app.use(cron(RankingCron())).use(cron(CardsCron())).use(cron(DiaryQuestsCron()));
  void warmupCardsCache(prisma).then(() => BoosterBufferService.initialize(prisma));
  void runRankingSync();
}
