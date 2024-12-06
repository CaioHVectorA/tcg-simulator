import { Patterns, type CronConfig } from "@elysiajs/cron";
import { prisma } from "../helpers/prisma.client";
async function getRandom(index: number = 0) {
  const rarity = Math.max(1, Math.min(index, 5));
  const cards = await prisma.card.findMany({
    where: {
      rarity,
    },
    select: {
      id: true,
    },
  });
  const firstId = await prisma.card.findFirst({
    orderBy: {
      id: "asc",
    },
    select: {
      id: true,
    },
  });
  const random = Math.floor(Math.random() * cards.length) + (firstId?.id || 1);
  const card = await prisma.card.findFirst({
    where: {
      id: cards[random]?.id,
      rarity: rarity,
    },
  });
  console.log({ card, random, rarity });
  return card;
}
export function CardsCron(): CronConfig {
  return {
    name: "card",
    // pattern: Patterns.everyDayAt("06:00"),
    pattern: Patterns.EVERY_HOUR,
    async run() {
      await prisma.promotional_Cards.deleteMany({});
      // random six cards and measure a price to them by some metrics
      const cards = [];
      for (let i = 0; i < 6; i++) {
        const rnd = await getRandom(i);
        cards.push(rnd);
      }
      console.log({ cards });
      const firstId = await prisma.promotional_Cards.findFirst({
        orderBy: {
          id: "asc",
        },
        select: {
          id: true,
        },
      });
      //   console.log({ firstId });
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        if (!card) continue; // Pula se não houver carta no índice
        const promoId = (firstId?.id || 1) + i; // Calcula o ID corretamente
        await prisma.promotional_Cards.upsert({
          where: {
            id: promoId,
          },
          create: {
            card_id: card.id,
            price: Math.random() * 1000,
          },
          update: {
            card_id: card.id,
            price: Math.random() * 1000,
          },
        });
      }

      console.table({
        message: "Cards cron updated",
        date: new Date().toLocaleString(),
      });
    },
  };
}
