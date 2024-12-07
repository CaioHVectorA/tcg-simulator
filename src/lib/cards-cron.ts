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
  const weights = [
    [50, 500],
    [500, 1_500],
    [2_000, 10_000],
    [10_000, 50_000],
    [50_000, 100_000],
  ];
  function round(number: number) {
    return parseInt(String(number / 100)) * 100;
  }
  function weightedRandomInt(
    min: number,
    max: number,
    weights: (value: number) => number
  ): number {
    const range = max - min + 1;
    const values = Array.from({ length: range }, (_, i) => min + i);
    const weightValues = values.map((value) => weights(value));

    const totalWeight = weightValues.reduce((sum, weight) => sum + weight, 0);
    const randomValue = Math.random() * totalWeight;

    let cumulativeWeight = 0;
    for (let i = 0; i < values.length; i++) {
      cumulativeWeight += weightValues[i];
      if (randomValue < cumulativeWeight) {
        return values[i];
      }
    }

    return values[values.length - 1]; // Fallback (deveria ser improvável alcançar aqui)
  }
  const callback = (min: number, max: number) => (value: number) => {
    // Exemplo de pesos: valores mais próximos de 8000 têm maior chance
    const target = (max - min) * 0.8 + min;
    const influence = 1400; // Controle do alcance da "concentração" em torno do target
    return Math.exp(
      -Math.pow(value - target, 2) / (2 * Math.pow(influence, 2))
    );
  };
  const [min, max] = weights[rarity - 1];
  return [round(weightedRandomInt(min, max, callback(min, max))), round(max)];
}
export function CardsCron(): CronConfig {
  return {
    name: "card",
    // pattern: Patterns.everyDayAt("06:00"),
    pattern: Patterns.EVERY_HOUR,
    startAt: new Date(),
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
