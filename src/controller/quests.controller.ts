import { claimQuests } from "../services/quest-reward.service";
import { positiveInteger } from "../lib/economy";
import Elysia from "elysia";
import { prisma } from "../helpers/prisma.client";
import { Prisma, type User } from "@prisma/client";
import { jwt } from "../middlewares/jwt/jwt";
import { getUserUserMiddleware } from "../middlewares/jwt";
import { sucessResponse, errorResponse } from "../lib/mount-response";
import { runQuery } from "../lib/run-quests-query";
import { cache, questsCache } from "../lib/cache";

export const questsController = new Elysia({}).group("/quests", (app) => {
  return (
    app
      .decorate("prisma", prisma)
      .decorate("user", {} as User)

      .use(jwt)
      .onBeforeHandle(getUserUserMiddleware as any)
      .post("/setup-stream", async function* ({}) {
        const user = { id: 29 };
        const quests = await prisma.quest.findMany();
        const questsUser = await prisma.questUser.findMany({
          where: {
            user_id: user.id,
          },
        });
        if (questsUser.length === quests.length) {
          yield sucessResponse(questsUser, "Suas missões já foram criadas!");
          return;
        }
        yield sucessResponse(null, "Criando suas missões...");
        for (const quest of quests) {
          const exists = await prisma.questUser.findFirst({
            where: { user_id: user.id, quest_id: quest.id },
          });
          if (exists) continue;
          await prisma.questUser.create({
            data: {
              user_id: user.id,
              quest_id: quest.id,
            },
          });
        }
        const questsUserUpdated = await prisma.questUser.findMany({
          where: { user_id: user.id },
          include: {
            Quest: true,
          },
        });
        for (const quest of questsUserUpdated) {
          const query = runQuery(
            quest.Quest.queryCheck,
            quest.Quest.levelGoals[quest.currentLevel],
            user.id
          );
          const [queryRes] = (await prisma.$queryRaw(Prisma.sql([query]))) as {
            mission_complete: boolean;
            progress: number | bigint;
          }[];
          yield {
            name: quest.Quest.name,
            description: quest.Quest.description[quest.currentLevel],
            id: quest.Quest.id,
            currentLevel: quest.currentLevel,
            actualReward: quest.Quest.levelRewards[quest.currentLevel],
            completed: queryRes.mission_complete,
            progress: Number(queryRes.progress),
          };
        }
        yield sucessResponse(null, "Suas missões foram atualizadas!");
      })
      .post("/setup", async ({ user }) => {
        const [quests, questsUser] = await Promise.all([
          prisma.quest.findMany({ where: { isDiary: false } }),
          prisma.questUser.findMany({
            where: { user_id: user.id },
            select: { quest_id: true },
          }),
        ]);

        const existingQuestIds = new Set(questsUser.map((q) => q.quest_id));
        const missingQuests = quests.filter((q) => !existingQuestIds.has(q.id));

        if (missingQuests.length > 0) {
          await prisma.questUser.createMany({
            data: missingQuests.map((q) => ({
              user_id: user.id,
              quest_id: q.id,
            })),
            skipDuplicates: true,
          });
        }

        const questsUserUpdated = await prisma.questUser.findMany({
          where: { user_id: user.id },
          include: {
            Quest: true,
          },
        });

        const questsResponse = await Promise.all(
          questsUserUpdated.map(async (quest) => {
            const query = runQuery(
              quest.Quest.queryCheck,
              quest.Quest.levelGoals[quest.currentLevel],
              user.id
            );
            const [queryRes] = (await prisma.$queryRaw(Prisma.sql([query]))) as {
              mission_complete: boolean;
              progress: number | bigint;
            }[];
            return {
              name: quest.Quest.name,
              description: quest.Quest.description[quest.currentLevel],
              id: quest.Quest.id,
              currentLevel: quest.currentLevel,
              actualReward: quest.Quest.levelRewards[quest.currentLevel],
              completed: queryRes?.mission_complete ?? false,
              progress: Number(queryRes?.progress ?? 0),
              fullCompleted: quest.completed,
            };
          })
        );

        return sucessResponse(questsResponse);
      })

      .get("/", async ({ user }) => {
        let questsUser = await prisma.questUser.findMany({
          where: { user_id: user.id },
          include: { Quest: true },
          orderBy: { Quest: { id: "asc" } },
        });

        // Garante que o usuário possua todas as missões padrão
        const standardQuests = await prisma.quest.findMany({
          where: { isDiary: false },
          select: { id: true },
        });
        const userStandardQuestIds = new Set(
          questsUser.filter((q) => !q.Quest.isDiary).map((q) => q.quest_id)
        );
        const missingQuests = standardQuests.filter((q) => !userStandardQuestIds.has(q.id));
        if (missingQuests.length > 0) {
          const newStandard = await prisma.questUser.createManyAndReturn({
            data: missingQuests.map((q) => ({
              user_id: user.id,
              quest_id: q.id,
            })),
            include: { Quest: true },
            skipDuplicates: true,
          });
          questsUser = questsUser.concat(newStandard);
        }

        // Filtra as missões diárias do usuário
        let diaryUser = questsUser.filter(
          (quest) => quest.Quest.isDiary && quest.Quest.isDiaryActive
        );

        const activeDiary = await prisma.quest.findMany({ where: { isDiary: true, isDiaryActive: true }, orderBy: { id: "asc" }, take: 3 });
        const assigned = new Set(diaryUser.map((q) => q.quest_id));
        const missing = activeDiary.filter((q) => !assigned.has(q.id));
        if (missing.length) {
          const created = await prisma.questUser.createManyAndReturn({
            data: missing.map((quest) => ({ user_id: user.id, quest_id: quest.id })),
            include: { Quest: true }, skipDuplicates: true,
          });
          questsUser = questsUser.concat(created);
        }
        questsUser = questsUser.filter((q) => !q.Quest.isDiary || activeDiary.some((d) => d.id === q.quest_id));

        // Nomes de missões que migraram para o sistema de Álbuns
        const EXCLUDED_QUEST_NAMES = [
          "deus dos deuses",
          "ao lado do fantasma",
          "voando alto",
          "assim como ash",
          "com o canil",
          "o trio do tempo",
        ];

        questsUser = questsUser.filter(
          (q) => !EXCLUDED_QUEST_NAMES.some((ex) => q.Quest.name.toLowerCase().includes(ex))
        );

        // Mapeia as queries em um array de Promises paralelas com skip de finalizadas
        const queryPromises = questsUser.map(async (quest) => {
          let queryRes: {
            mission_complete: boolean;
            progress: number | bigint;
          };

          let isFullCompleted = false;
          if (quest.completed || !quest.Quest.levelGoals[quest.currentLevel]) {
            isFullCompleted = true;
            queryRes = {
              mission_complete: true,
              progress: quest.Quest.levelGoals[quest.currentLevel - 1] || quest.Quest.levelGoals[quest.Quest.levelGoals.length - 1] || 1,
            };
          } else {
            const query = runQuery(
              quest.Quest.queryCheck,
              quest.Quest.levelGoals[quest.currentLevel],
              user.id
            );
            [queryRes] = (await prisma.$queryRaw(Prisma.sql([query]))) as {
              mission_complete: boolean;
              progress: number | bigint;
            }[];
          }

          const response = {
            name: quest.Quest.name,
            description: quest.Quest.description[quest.currentLevel] || quest.Quest.description[quest.Quest.description.length - 1],
            id: quest.Quest.id,
            currentLevel: quest.currentLevel,
            actualReward: quest.Quest.levelRewards[quest.currentLevel] || quest.Quest.levelRewards[quest.Quest.levelRewards.length - 1],
            completed: Boolean(queryRes.mission_complete),
            total:
              quest.Quest.levelGoals[quest.currentLevel] || Number(queryRes.progress),
            progress: Number(queryRes.progress),
            fullCompleted: isFullCompleted || quest.completed,
            isDiary: quest.Quest.isDiary,
          };

          return response;
        });

        // Espera todas as queries terminarem
        const questsResponse = (await Promise.all(queryPromises)).sort(
          (a, b) => (a.isDiary ? -1 : 1)
        );
        return sucessResponse(questsResponse);
      })
      .patch("/get-reward/:id", async ({ user, params }) => {
        positiveInteger(Number(params.id), 2147483647);
        const result = await claimQuests(user.id, Number(params.id));
        questsCache.delete(`quest-${user.id}-${params.id}`);
        return sucessResponse(result, "quests.rewardClaimed");
      })
      .post("/claim-all", async ({ user }) => {
        const result = await claimQuests(user.id);
        for (const key of questsCache.keys()) if (key.startsWith(`quest-${user.id}-`)) questsCache.delete(key);
        return sucessResponse(result, "quests.allClaimed");
      })
  );
});
