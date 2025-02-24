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
      .post("/setup", async ({ user, set }) => {
        const quests = await prisma.quest.findMany();
        const questsUser = await prisma.questUser.findMany({
          where: {
            user_id: user.id,
          },
        });
        if (questsUser.length === quests.length) {
          return sucessResponse({ message: "All quests are already set up" });
        }
        for (const quest of quests) {
          if (quest.isDiary) continue;
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
        const questsResponse = [];
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
          const response = {
            name: quest.Quest.name,
            description: quest.Quest.description[quest.currentLevel],
            id: quest.Quest.id,
            currentLevel: quest.currentLevel,
            actualReward: quest.Quest.levelRewards[quest.currentLevel],
            completed: queryRes.mission_complete,
            progress: Number(queryRes.progress),
            fullCompleted: quest.completed,
          };
          questsResponse.push(response);
        }
        return sucessResponse(
          questsResponse,
          "Suas missões foram atualizadas!"
        );
      })

      .get("/", async ({ user }) => {
        let questsUser = await prisma.questUser.findMany({
          where: { user_id: user.id },
          include: { Quest: true },
          orderBy: { Quest: { id: "asc" } },
        });

        // Filtra as missões diárias do usuário
        let diaryUser = questsUser.filter(
          (quest) => quest.Quest.isDiary && quest.Quest.isDiaryActive
        );

        // Se não houver exatamente 3 missões diárias, sincroniza
        if (diaryUser.length !== 3) {
          await prisma.questUser.deleteMany({
            where: {
              user_id: user.id,
              Quest: { isDiary: true },
            },
          });

          // Obtém as três missões diárias ativas
          const diaryQuests = await prisma.quest.findMany({
            where: { isDiary: true, isDiaryActive: true },
            orderBy: { id: "asc" },
            take: 3,
          });

          // Reatribui as três missões diárias ao usuário
          const userDiaryMissions = await prisma.questUser.createManyAndReturn({
            data: diaryQuests.map((quest) => ({
              user_id: user.id,
              quest_id: quest.id,
            })),
            include: { Quest: true },
          });

          questsUser = questsUser
            .filter((q) => !q.Quest.isDiary)
            .concat(userDiaryMissions);
        }

        // Mapeia as queries em um array de Promises
        const queryPromises = questsUser.map(async (quest) => {
          if (questsCache.has(`quest-${quest.quest_id}`)) {
            //@ts-ignore
            const [cachedQuest, lastUpdate] = questsCache.get(
              `quest-${quest.quest_id}`
            );
            if (new Date().getTime() - lastUpdate.getTime() < 5000) {
              return cachedQuest;
            }
          }
          let queryRes: {
            mission_complete: boolean;
            progress: number | bigint;
          };
          // in a mission, same if user completed all levels, isnt completed in DB. We will check if the user completed all levels
          // go horse way to fix a bug, TODO: Refactor this
          let isFullCompleted = false;
          if (!quest.Quest.levelGoals[quest.currentLevel]) {
            console.log(
              "entrou",
              quest.Quest,
              quest.currentLevel,
              quest.completed
            );
            isFullCompleted = true;
            queryRes = {
              mission_complete: true,
              progress: quest.Quest.levelGoals[quest.currentLevel - 1],
            };
            console.log({ queryRes });
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
            description: quest.Quest.description[quest.currentLevel],
            id: quest.Quest.id,
            currentLevel: quest.currentLevel,
            actualReward: quest.Quest.levelRewards[quest.currentLevel],
            completed: queryRes.mission_complete,
            total:
              quest.Quest.levelGoals[quest.currentLevel] || queryRes.progress,
            progress: Number(queryRes.progress),
            fullCompleted: isFullCompleted || quest.completed,
            isDiary: quest.Quest.isDiary,
          };

          questsCache.set(`quest-${quest.Quest.id}`, [response, new Date()]);
          return response;
        });

        // Espera todas as queries terminarem
        const questsResponse = (await Promise.all(queryPromises)).sort(
          (a, b) => (a.isDiary ? -1 : 1)
        );
        return sucessResponse(questsResponse);
      })
      // .get("/diary", async ({ user }) => {

      // })
      .patch("/get-reward/:id", async ({ user, params }) => {
        // Get the quest for the user
        const questUser = await prisma.questUser.findFirst({
          where: { user_id: user.id, quest_id: Number(params.id) },
          include: { Quest: true },
        });

        if (!questUser) {
          return errorResponse("Quest não encontrada para o usuário.");
        }

        // Run the query to check if the quest is completed
        const query = runQuery(
          questUser.Quest.queryCheck,
          questUser.Quest.levelGoals[questUser.currentLevel],
          user.id
        );

        const [queryRes] = (await prisma.$queryRaw(Prisma.sql([query]))) as {
          mission_complete: boolean;
          progress: number | bigint;
        }[];

        if (!queryRes.mission_complete) {
          return errorResponse("A missão ainda não foi completada.");
        }

        // Update the user's reward
        await prisma.user.update({
          where: { id: user.id },
          data: {
            money: {
              increment: questUser.Quest.levelRewards[questUser.currentLevel],
            },
            totalBudget: {
              increment: questUser.Quest.levelRewards[questUser.currentLevel],
            },
          },
        });

        // Update the questUser to the next level or mark as completed
        if (questUser.currentLevel < questUser.Quest.levelGoals.length - 1) {
          await prisma.questUser.update({
            where: { id: questUser.id },
            data: { currentLevel: { increment: 1 } },
          });
        } else {
          await prisma.questUser.update({
            where: { id: questUser.id },
            data: { completed: true },
          });
        }
        questsCache.delete(`quest-${questUser.quest_id}`);
        return sucessResponse(null, "Recompensa recebida com sucesso!");
      })
  );
});
