import { PrismaClient } from "@prisma/client";
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
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({
    include: {
      User_Purchase: {
        include: {
          Package: true,
          Card: true,
        },
      },
    },
  });
  const usersWithBudget = users.map((user) => {
    const totalBudget = user.User_Purchase.reduce((acc, purchase) => {
      return (
        acc +
        (purchase.Package?.price ||
          getPrice(purchase.Card?.rarity || 1)[1] ||
          0)
      );
    }, 0);
    return totalBudget;
  });
  for (let i = 0; i < users.length; i++) {
    await prisma.user.update({
      where: { id: users[i].id },
      data: {
        totalBudget: usersWithBudget[i],
      },
    });
    console.log(
      `User ${users[i].username} updated with totalBudget ${usersWithBudget[i]}`
    );
  }
}

main();
