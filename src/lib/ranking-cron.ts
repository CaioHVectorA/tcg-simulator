import type { CronConfig } from "@elysiajs/cron";
import { prisma } from "../helpers/prisma.client";

export async function runRankingSync() {
  try {
    const usersWithRarity = await prisma.user.findMany({
      include: {
        Cards_user: {
          select: {
            Card: { select: { rarity: true } },
          },
        },
      },
    });

    const rankings = usersWithRarity
      .map((user) => ({
        userId: user.id,
        totalRarity: user.Cards_user.reduce(
          (sum, cu) => sum + (cu.Card?.rarity || 1),
          0
        ),
      }))
      .sort((a, b) => b.totalRarity - a.totalRarity)
      .map((user, index) => ({
        ...user,
        position: index + 1,
      }));

    const updatePromises = rankings.flatMap((rank) => [
      prisma.user.update({
        where: { id: rank.userId },
        data: { rarityPoints: rank.totalRarity },
      }),
      prisma.user_Ranking.upsert({
        where: { user_id: rank.userId },
        update: { total_rarity: rank.totalRarity, position: rank.position },
        create: {
          user_id: rank.userId,
          total_rarity: rank.totalRarity,
          position: rank.position,
        },
      }),
    ]);

    for (let offset = 0; offset < updatePromises.length; offset += 8) {
      await Promise.all(updatePromises.slice(offset, offset + 8));
    }
    console.log(`[RankingCron] Ranking atualizado com sucesso (3x/dia)! Horário: ${new Date().toISOString()}`);
  } catch (err) {
    console.error("[RankingCron] Erro ao sincronizar ranking:", err);
  }
}

export function RankingCron(): CronConfig {
  return {
    name: "ranking",
    // 3 vezes ao dia: às 00:00, 08:00 e 16:00 UTC
    pattern: "0 0,8,16 * * *",
    run: runRankingSync,
  };
}
