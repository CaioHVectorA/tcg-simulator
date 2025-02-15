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
      await prisma.quest.updateMany({
        where: { isDiaryActive: true, isDiary: true },
        data: {
          isDiaryActive: false,
        },
      });
      console.log({ candidates: candidates.length });
      for (let i = 0; i < 3; i++) {
        const randomIndex = Math.floor(Math.random() * candidates.length);
        const quest = candidates[randomIndex];
        await prisma.quest.update({
          where: { id: quest.id },
          data: {
            isDiaryActive: true,
          },
        });
      }
      // console.log({
      //   activeDiary: await prisma.quest.findMany({
      //     where: { isDiaryActive: true },
      //   }),
      // });
      console.table({
        message: "Diary Quests updated",
        length: (
          await prisma.quest.findMany({ where: { isDiaryActive: true } })
        ).length,
        date: new Date().toLocaleString(),
      });
    },
  };
}
