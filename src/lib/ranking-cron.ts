import { Patterns, type CronConfig } from "@elysiajs/cron";
import { prisma } from "../helpers/prisma.client";
export function RankingCron(): CronConfig {
    return {
        name: 'ranking',
        // each 15 min
        pattern: Patterns.everyHours(1),
        async run() {
            const usersWithRarity = await prisma.user.findMany({
                include: {
                    Cards_user: {
                        include: {
                            Card: true,
                        },
                    },
                },
            });
        
            // Calcular a soma e ordenar os usuários pelo total_rarity
            const rankings = usersWithRarity
                .map((user) => ({
                    userId: user.id,
                    totalRarity: user.Cards_user.reduce(
                        (sum, cu) => sum + (cu.Card?.rarity || 0),
                        0
                    ),
                }))
                .sort((a, b) => b.totalRarity - a.totalRarity)
                .map((user, index) => ({
                    ...user,
                    position: index + 1,
                }));
        
            // Atualizar a tabela de rankings no banco
            const updatePromises = rankings.map((rank) =>
                prisma.user_Ranking.upsert({
                    where: { user_id: rank.userId },
                    update: { total_rarity: rank.totalRarity, position: rank.position },
                    create: {
                        user_id: rank.userId,
                        total_rarity: rank.totalRarity,
                        position: rank.position,
                    },
                })
            );
        
            await Promise.all(updatePromises);
            console.log(`
                Ranking atualizado com sucesso! \n
                Horário: ${new Date().toLocaleString()}
                `);
        }
    }
}