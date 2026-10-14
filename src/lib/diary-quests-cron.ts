import { Patterns, type CronConfig } from "@elysiajs/cron";
import { prisma } from "../helpers/prisma.client";

export function DiaryQuestsCron(): CronConfig {
  return {
    name: "Diary Quests",
    pattern: Patterns.EVERY_DAY_AT_10AM,
    async run() {
      const candidates = await prisma.quest.findMany({
        where: { isDiary: true, isDiaryActive: false },
      });
      // Sample without replacement; empty catalogs are valid and never produce undefined IDs.
      const shuffled = [...candidates];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      const chosen = shuffled.slice(0, 3);
      await prisma.$transaction(async (tx) => {
        await tx.quest.updateMany({ where: { isDiary: true, isDiaryActive: true }, data: { isDiaryActive: false } });
        if (chosen.length) await tx.quest.updateMany({ where: { id: { in: chosen.map((q) => q.id) } }, data: { isDiaryActive: true } });
        await tx.questUser.deleteMany({ where: { Quest: { isDiary: true } } });
      });
      console.info(JSON.stringify({ event: "daily_quests_rotated", count: chosen.length }));
    },
  };
}
