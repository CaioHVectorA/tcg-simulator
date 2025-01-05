import type { User } from "@prisma/client";
import Elysia from "elysia";
import { prisma } from "../helpers/prisma.client";
import { getUserUserMiddleware } from "../middlewares/jwt";
import { jwt } from "../middlewares/jwt/jwt";
import { errorResponse, sucessResponse } from "../lib/mount-response";
const GENGAR_CARD_ID = "xy4-114";
export const specialController = new Elysia({}).group("/special", (app) => {
  return app
    .decorate("prisma", prisma)
    .decorate("user", {} as User)
    .use(jwt)
    .onBeforeHandle(getUserUserMiddleware as any)
    .post("/gengar/claim", async ({ user, prisma }) => {
      const userCard = await prisma.cards_user.findFirst({
        where: {
          Card: { card_id: GENGAR_CARD_ID },
        },
      });
      if (userCard) {
        return errorResponse(
          "Você já possui esse card!",
          "Você já possui esse card!"
        );
      }
      const gengarCard = await prisma.card.findFirst({
        where: { card_id: GENGAR_CARD_ID },
      });
      if (!gengarCard) {
        return errorResponse("Card não encontrado!", "Card não encontrado!");
      }
      const created = await prisma.cards_user.create({
        data: {
          userId: user.id,
          cardId: gengarCard.id,
        },
      });
      return sucessResponse(null, "Card resgatado com sucesso!");
    });
});
