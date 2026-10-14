import { Prisma } from "@prisma/client";
import { prisma } from "../helpers/prisma.client";
import { runQuery } from "../lib/run-quests-query";
import { lockUsers } from "../lib/economy";
import { DomainError } from "../lib/domain-error";
export async function claimQuests(userId: number, questId?: number) {
  return prisma.$transaction(async (tx) => {
    await lockUsers(tx, [userId]);
    const quests = await tx.questUser.findMany({ where: { user_id: userId, completed: false, ...(questId ? { quest_id: questId } : {}) }, include: { Quest: true } });
    let totalReward = 0;
    let count = 0;
    // Bounded fanout: batches of four prevent a quest count from exhausting the pool.
    for (let offset = 0; offset < quests.length; offset += 4) {
      await Promise.all(quests.slice(offset, offset + 4).map(async (qu) => {
        const goal = qu.Quest.levelGoals[qu.currentLevel];
        const reward = qu.Quest.levelRewards[qu.currentLevel];
        if (goal === undefined || reward === undefined || (qu.Quest.isDiary && !qu.Quest.isDiaryActive)) return;
        const sql = runQuery(qu.Quest.queryCheck, goal, userId);
        const [result] = await tx.$queryRaw<{ mission_complete: boolean }[]>(Prisma.sql([sql]));
        if (!result?.mission_complete) return;
        const next = qu.currentLevel < qu.Quest.levelGoals.length - 1;
        const updated = await tx.questUser.updateMany({ where: { id: qu.id, user_id: userId, completed: false, currentLevel: qu.currentLevel }, data: next ? { currentLevel: { increment: 1 } } : { completed: true } });
        if (updated.count !== 1) throw new DomainError("common.requestConflict", 409);
        totalReward += reward;
        count++;
      }));
    }
    if (!count) throw new DomainError("quests.noRewardsToClaim");
    await tx.user.update({ where: { id: userId }, data: { money: { increment: totalReward }, totalBudget: { increment: totalReward } } });
    return { totalClaimed: totalReward, count };
  }, { timeout: 15_000 });
}
