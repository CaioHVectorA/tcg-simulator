import { html } from "@elysiajs/html";
import { cors } from "@elysiajs/cors";
import { compare } from "bcrypt";
import { Elysia, t } from "elysia";
import { userController } from "./controller/user.controller";
import { packageController } from "./controller/package.controller";
import { tradeController } from "./controller/trade.controller";
import { cardController } from "./controller/card.controller";
import { authController } from "./controller/auth.controller";
import { logger } from "@grotto/logysia";
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
//@ts-ignore
export const server: Elysia = new Elysia({})
  .use(staticPlugin())
  .use(helmet())
  .use(
    cors({
      origin: process.env.CLIENT_URL || "*",
      methods: ["GET", "POST", "PUT", "DELETE"],
      allowedHeaders: ["Content-Type", "Authorization"],
      exposeHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    })
  )
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
    return errorResponse(error.message, error.message);
  })
  .use(authController)
  .use(userController)
  .use(packageController)
  .use(tradeController)
  .use(cardController)
  .use(bannerController)
  .use(homeController)
  .use(rankingController)
  .use(storeController)
  .use(specialController)
  .use(cron(RankingCron()))
  .use(cron(CardsCron()))
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
  .listen(8080);
console.log("Server running");
//@ts-ignore
RankingCron().run();
//@ts-ignore
CardsCron().run();
