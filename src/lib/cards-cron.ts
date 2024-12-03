import { Patterns, type CronConfig } from "@elysiajs/cron";
import { prisma } from "../helpers/prisma.client";
async function getRandom(count: number) {
    const random = Math.random() * count
    const card = await prisma.card.findFirst({
        where: {
            id: random
        }
    })
    return card
}
export function RankingCron(): CronConfig {
    return {
        name: "card",
        pattern: Patterns.everyDayAt('06:00'),
        async run() {
            // random six cards and measure a price to them by some metrics
            const count = await prisma.card.count()
            const cards = []
            for (let i =0; i < 5; i++) {
                const rnd = await getRandom() 
                cards.push(rnd)
            }
            const firstId = await prisma.promotional_Cards.findFirst({ orderBy: {
               id: 'asc',
            }, select: {
                id: true
            } })
            for (let i = (firstId?.id || 0); i < i + 5;i++ ) {
                await prisma.promotionalCard.upsert({
                    where: {
                        id: i,
                    }, create: {
                        cardId: cards[i],
                    }, {

                    }
                })
            }
        }
    }
}