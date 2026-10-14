import { DomainError } from "../lib/domain-error";
import type { User } from "@prisma/client";
import { prisma } from "../helpers/prisma.client";
import { errorResponse, sucessResponse } from "../lib/mount-response";
import { getUserUserMiddleware } from "../middlewares/jwt";
import Elysia, { t } from "elysia";
import { jwt } from "../middlewares/jwt/jwt";
import { randomUUID } from "crypto";

export const referralController = new Elysia({}).group("/referral", (app) => {
  return app
    .decorate("prisma", prisma)
    .use(jwt)
    .decorate("user", {} as User)
    .onBeforeHandle(getUserUserMiddleware as any)
    .post("/create-referral", async ({ prisma, user }) => {
      const referralExists = await prisma.referrerProtocol.findFirst({
        where: { referrerCreatorId: user.id },
      });
      if (referralExists) {
        return sucessResponse(referralExists);
      }
      const hash = randomUUID().replaceAll("-", "");
      const referral = await prisma.referrerProtocol.create({
        data: { referrerCreatorId: user.id, hash },
      });
      return sucessResponse(referral);
    })
    .get("/my-referrals", async ({ prisma, user, set }) => {
      const protocol = await prisma.referrerProtocol.findFirst({
        where: { referrerCreatorId: user.id },
      });
      if (!protocol) {
        set.status = 404;
        return errorResponse("Protocolo não encontrado");
      }
      const referrals = await prisma.referred.findMany({
        where: { referrerProtocolId: protocol.id },
        include: { referred: { include: { User_Ranking: true } } },
      });
      const response = {
        hash: protocol.hash,
        referrals: referrals.map((referral) => ({
          id: referral.id,
          referredId: referral.referredId,
          referrerProtocolId: referral.referrerProtocolId,
          userId: referral.referred.id,
          username: referral.referred.username,
          referredDate: referral.createdAt,
          referredRarity: referral.referred.User_Ranking?.total_rarity || 0,
          redeemed: referral.bountyRedeemed,
          picture: referral.referred.picture,
        })),
      };
      return sucessResponse(response);
    })
    .post(
      "/redeem",
      async ({ prisma, user, body, set }) => {
        const { referredId } = body;
        const protocol = await prisma.referrerProtocol.findFirst({
          where: { referrerCreatorId: user.id },
        });
        if (!protocol) {
          set.status = 404;
          return errorResponse("Protocolo não encontrado");
        }
        const referred = await prisma.referred.findFirst({
          where: { id: referredId, referrerProtocolId: protocol.id },
        });
        if (!referred) {
          set.status = 404;
          return errorResponse("Referido não encontrado");
        }
        if (referred.bountyRedeemed) {
          set.status = 400;
          return errorResponse("Referido já resgatado");
        }
        await prisma.$transaction(async (tx) => {
          const changed = await tx.referred.updateMany({ where: { id: referred.id, referrerProtocolId: protocol.id, bountyRedeemed: false }, data: { bountyRedeemed: true } });
          if (changed.count !== 1) throw new DomainError("common.requestConflict", 409);
          await tx.user.update({ where: { id: user.id }, data: { money: { increment: 2000 }, totalBudget: { increment: 2000 } } });
        });
        return sucessResponse(
          "Referido resgatado com sucesso",
          "Parabéns! Você recebeu 2000 moedas"
        );
      },
      {
        body: t.Object({ referredId: t.Number() }),
      }
    );
});
