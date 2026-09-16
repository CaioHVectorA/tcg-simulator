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
import { RankingCron } from "./lib/ranking-cron";
import { rankingController } from "./controller/ranking.controller";
import { CardsCron } from "./lib/cards-cron";
import { helmet } from "elysia-helmet";
import { storeController } from "./controller/store.controller";
import { errorResponse } from "./lib/mount-response";
import { AUTH_ERROR } from "./helpers/const";
import { specialController } from "./controller/special.controller";
import { referralController } from "./controller/referral.controller";
//@ts-ignore
import { logger } from "@grotto/logysia";
import { questsController } from "./controller/quests.controller";
import { DiaryQuestsCron } from "./lib/diary-quests-cron";
import { messageController } from "./controller/message.controller";
import { notificationController } from "./controller/notification.controller";
import { areaController } from "./controller/area.controller";
import { wsManager } from "./lib/ws-manager";
import { jwt } from "./middlewares/jwt/jwt";
//@ts-ignore
export const server: Elysia = new Elysia({
  precompile: false,
  //@ts-ignore
  serve: { idleTimeout: 30 },
})
  .use(staticPlugin())
  .use(helmet())
  .use(jwt)
  .use(
    cors({
      origin: process.env.CLIENT_URL || "*",
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      allowedHeaders: ["Content-Type", "Authorization"],
      exposeHeaders: ["Content-Type", "Authorization"],
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
        const userId = Number(payload.id);
        (ws as any).userId = userId;
        await wsManager.register(userId, ws);
        ws.send(JSON.stringify({ type: "CONNECTED", payload: { userId } }));
      } catch (err) {
        console.error("[WS] Connection auth error:", err);
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
  .onError(({ code, error, set }) => {
    console.log({ code, error });
    if (error.message === "Invalid token") {
      set.status = 401;
      return { message: "Token inválida!" };
    }
  })
  .use(swagger)
  .onError(({ error, set }) => {
    if (error.message == AUTH_ERROR) {
      set.status = 401;
    }
    console.log({ error });
    return errorResponse(error.message, error.message);
  })
  .get("/ping", () => "pong")
  .use(authController)
  .use(userController)
  .use(packageController)
  .use(tradeController)
  .use(cardController)
  .use(questsController)
  .use(bannerController)
  .use(homeController)
  .use(rankingController)
  .use(storeController)
  .use(referralController)
  .use(specialController)
  .use(messageController)
  .use(notificationController)
  .use(areaController)
  // .use(cron(RankingCron()))
  .use(cron(CardsCron()))
  .use(cron(DiaryQuestsCron()))
  .use(
    logger({
      logIP: false,
      writer: {
        write(msg: string) {
          console.log(msg);
        },
      },
    })
  )
  .listen({
    port: process.env.PORT || 8080,
    hostname: '0.0.0.0'
  });
console.log("Server running");
//@ts-ignore
// RankingCron().run();
//@ts-ignore
// CardsCron().run();
// DiaryQuestsCron().run();
