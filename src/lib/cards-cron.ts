import { Patterns, type CronConfig } from "@elysiajs/cron";
import { prisma } from "../helpers/prisma.client";
async function getRandom(index: number = 0) {
  // const rarity = Math.max(1, Math.min(index, 5));
  const rarity = [Math.floor(Math.random() * 2), 2, 3, 4, 4, 5][index];
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
  return card;
}

function getPrice(rarity: number): [number, number] {
  // Pesos de mercado rebalanceados:
  // Rarity 4 (Mística): Artigo de puro luxo com 7 dígitos (1.2M a 4.5M)
  // Rarity 5 (Lendária): 8 dígitos (8M a 25M)
  const weights: [number, number][] = [
    [50, 500],
    [1_000, 5_000],
    [25_000, 120_000],
    [1_200_000, 4_500_000],
    [8_000_000, 25_000_000],
  ];
  const [min, max] = weights[Math.max(0, Math.min(4, (rarity || 1) - 1))];
  const factor = Math.pow(Math.random(), 0.85);
  const rawPrice = min + factor * (max - min);
  const roundedPrice = Math.round(rawPrice / 100) * 100;
  return [roundedPrice, max];
}
export function CardsCron(): CronConfig {
  return {
    name: "card",
    // pattern: Patterns.everyDayAt("06:00"),
    pattern: Patterns.EVERY_DAY_AT_10AM,
    // startAt: new Date(),
    // pattern: Patterns.everySenconds(15),
    async run() {
      // random six cards and measure a price to them by some metrics
      const cards = [];
      for (let i = 0; i < 6; i++) {
        const rnd = await getRandom(i);
        cards.push(rnd);
      }
      const firstId = await prisma.promotional_Cards.findFirst({
        orderBy: {
          id: "asc",
        },
        select: {
          id: true,
        },
      });
      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        if (!card) continue; // Pula se não houver carta no índice
        const [price, originalPrice] = getPrice(card.rarity);
        const promoId = (firstId?.id || 1) + i; // Calcula o ID corretamente
        await prisma.promotional_Cards.upsert({
          where: {
            id: promoId,
          },
          create: {
            card_id: card.id,
            original_price: originalPrice,
            price: price,
          },
          update: {
            card_id: card.id,
            price: price,
            original_price: originalPrice,
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
