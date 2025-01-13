import { Prisma, PrismaClient } from "@prisma/client";
import { QUESTS } from "./quests";
interface Quest {
  levelCount: number;
  levelRewards: number[];
  levelGoals: number[];
  name: string;
  description: string[];
  queryCheck: string;
}

function createQuest(
  levelCount: number,
  levelRewards: number[],
  levelGoals: number[],
  name: string,
  description: string | string[],
  queryCheck: string
): Quest {
  return {
    levelCount,
    levelRewards: levelRewards.map((r) => Math.floor(r / 5)), // balancing rewards
    levelGoals: levelGoals, // balancing goals
    name,
    description: Array.isArray(description)
      ? description
      : Array.from({ length: levelCount }, (_, i) => `description`),
    queryCheck,
  };
}

const quests: Quest[] = [
  createQuest(
    3,
    [3000, 6000, 15000],
    [1, 3, 10],
    "Desde a base",
    ["Consiga um inicial", "Consiga 5 iniciais", "Consiga 27 inicias"],
    QUESTS.GET_INITIALS
  ),
  createQuest(
    5,
    [3000, 6000, 15000, 30000, 50000],
    [5, 10, 30, 50, 100],
    "Piromaníaco",
    [
      "Consiga 5 cartas de fogo",
      "Consiga 10 cartas de fogo",
      "Consiga 50 cartas de fogo",
      "Consiga 100 cartas de fogo",
      "Consiga 500 cartas de fogo",
    ],
    QUESTS.GET_FIRE_CARDS
  ),
  createQuest(
    7,
    [3000, 6000, 15000, 30000, 50000, 75000, 100000],
    [10, 30, 50, 80, 100, 500, 1000],
    "De bem com a natureza",
    [
      "Consiga 10 cartas de planta",
      "Consiga 30 cartas de planta",
      "Consiga 50 cartas de planta",
      "Consiga 80 cartas de planta",
      "Consiga 100 cartas de planta",
      "Consiga 500 cartas de planta",
      "Consiga 1000 cartas de planta",
    ],
    QUESTS.GET_GRASS_CARDS
  ),
  createQuest(
    5,
    [5000, 10000, 20000, 50000, 75000],
    [5, 10, 30, 50, 100],
    "Como treinar seu dragão",
    [
      "Consiga 5 cartas de dragão",
      "Consiga 10 cartas de dragão",
      "Consiga 30 cartas de dragão",
      "Consiga 50 cartas de dragão",
      "Consiga 100 cartas de dragão",
    ],
    QUESTS.GET_DRAGON_CARDS
  ),
  createQuest(
    5,
    [3000, 6000, 15000, 30000, 50000],
    [5, 10, 30, 50, 100],
    "Conto de fadas",
    [
      "Consiga 5 cartas de fada",
      "Consiga 10 cartas de fada",
      "Consiga 30 cartas de fada",
      "Consiga 50 cartas de fada",
      "Consiga 100 cartas de fada",
    ],
    QUESTS.GET_FAIRY_CARDS
  ),
  // Consiga n cartas!
  createQuest(
    20,
    [
      1000, 2000, 3000, 5000, 10000, 20000, 30000, 50000, 75000, 100000,
      150_000, 200000, 250000, 300000, 350000, 400000, 450000, 500000, 750000,
      1_000_000,
    ],
    [
      10, 50, 100, 200, 500, 1000, 2000, 3000, 5000, 7500, 10000, 15000, 20000,
      25000, 30000, 35000, 40000, 45000, 50000, 100000,
    ],
    "Mestre colecionador",
    [
      "Consiga 10 cartas",
      "Consiga 50 cartas",
      "Consiga 100 cartas",
      "Consiga 200 cartas",
      "Consiga 500 cartas",
      "Consiga 1000 cartas",
      "Consiga 2000 cartas",
      "Consiga 3000 cartas",
      "Consiga 5000 cartas",
      "Consiga 7500 cartas",
      "Consiga 10000 cartas",
      "Consiga 15000 cartas",
      "Consiga 20000 cartas",
      "Consiga 25000 cartas",
      "Consiga 30000 cartas",
      "Consiga 35000 cartas",
      "Consiga 40000 cartas",
      "Consiga 45000 cartas",
      "Consiga 50000 cartas",
      "Consiga 100000 cartas",
    ],
    QUESTS.GET_N_CARDS
  ),
  // faça missões
  // consiga cartas repetidas!
  createQuest(
    7,
    [3000, 6000, 15000, 30000, 50000, 75000, 100000],
    [1, 3, 10, 20, 50, 100, 200],
    "Coleção de repetidas",
    [
      "Consiga 1 carta repetida",
      "Consiga 3 cartas repetidas",
      "Consiga 10 cartas repetidas",
      "Consiga 20 cartas repetidas",
      "Consiga 50 cartas repetidas",
      "Consiga 100 cartas repetidas",
      "Consiga 200 cartas repetidas",
    ],
    QUESTS.GET_DUPLICATES
  ),
  // abra pacotes não temáticos
  createQuest(
    5,
    [3000, 6000, 15000, 30000, 50000],
    [1, 5, 20, 50, 100],
    "Abre-alas",
    [
      "Abra 1 pacote padrão",
      "Abra 5 pacotes padrãos",
      "Abra 20 pacotes padrãos",
      "Abra 50 pacotes padrãos",
      "Abra 100 pacotes padrãos",
    ],
    QUESTS.OPEN_NON_TEMATIC_PACKAGES
  ),
  // abra pacotes temáticos
  createQuest(
    5,
    [3000, 6000, 15000, 30000, 50000],
    [1, 5, 20, 50, 100],
    "Abridor de temáticos",
    [
      "Abra 1 pacote temático",
      "Abra 5 pacotes temáticos",
      "Abra 20 pacotes temáticos",
      "Abra 50 pacotes temáticos",
      "Abra 100 pacotes temáticos",
    ],
    QUESTS.OPEN_TEMATIC_PACKAGES
  ),
  // consiga cartas com mais de x hp
  createQuest(
    5,
    [3000, 6000, 15000, 30000, 50000],
    [1, 5, 20, 50, 100],
    "Domador de gigantes",
    [
      "Consiga 1 carta com mais de 150 hp",
      "Consiga 5 cartas com mais de 150 hp",
      "Consiga 20 cartas com mais de 150 hp",
      "Consiga 50 cartas com mais de 150 hp",
      "Consiga 100 cartas com mais de 150 hp",
    ],
    QUESTS.GET_N_CARDS_WITH_MORE_THAN_X_HP
  ),
  // consiga cartas com menos de x hp
  createQuest(
    5,
    [3000, 6000, 15000, 30000, 50000],
    [1, 20, 50, 100, 300],
    "Criando os pequenos",
    [
      "Consiga 1 carta com menos de 70 hp",
      "Consiga 20 cartas com menos de 70 hp",
      "Consiga 50 cartas com menos de 70 hp",
      "Consiga 100 cartas com menos de 70 hp",
      "Consiga 300 cartas com menos de 70 hp",
    ],
    QUESTS.GET_N_CARDS_WITH_LESS_THAN_X_HP
  ),
  // createQuest(
  //   1,
  //   [1_000_000],
  //   [1],
  //   "Com o canil",
  //   ["Consiga todos os cães lendários"],
  //   QUESTS.GET_SUICUNE_ENTEI_RAIKOU
  // ),
  // createQuest(
  //   1,
  //   [1_000_000],
  //   [1],
  //   "O trio do tempo",
  //   ["Consiga todos os dragões lendários"],
  //   QUESTS.GET_PALKIA_GIRATINA_DIALGA
  // ),
  createQuest(
    1,
    [1_000_000],
    [1],
    "Deus dos deuses",
    ["Consiga o deus dos deuses"],
    QUESTS.GET_ARCEUS
  ),
  createQuest(
    1,
    [50_000],
    [1],
    "Ao lado do fantasma",
    ["Consiga o gengar"],
    QUESTS.GET_GENGAR
  ),
  createQuest(
    1,
    [50_000],
    [1],
    "Voando alto",
    ["Consiga o Charizard"],
    QUESTS.GET_CHARIZARD
  ),
  createQuest(
    1,
    [10_000],
    [1],
    "Assim como Ash",
    ["Consiga um pikachu"],
    QUESTS.GET_PIKACHU
  ),
];
quests.push(
  createQuest(
    3,
    [10_000, 50_000, 1_000_000, 10_000_000],
    [1, 3, 10, quests.length],
    "Missão dada é missão cumprida",
    [
      "Feche 1 missão",
      "Feche 3 missões",
      "Feche 10 missões",
      "Feche todas as missões.",
    ],
    QUESTS.MAKE_QUESTS
  )
);
function runQuery(query: string, goal: number, user_id: number) {
  return query
    .replace("$GOAL", goal.toString())
    .replace("$USER_ID", user_id.toString());
}
async function main(userId: number) {
  const prisma = new PrismaClient();
  await prisma.quest.deleteMany();
  const questsCreated = await prisma.quest.createManyAndReturn({
    data: quests,
  });
  if (userId == -1) return console.log("Quests created!");
  for (const quest of questsCreated) {
    const exists = await prisma.questUser.findFirst({
      where: { user_id: userId, quest_id: quest.id },
    });
    if (exists) continue;
    await prisma.questUser.create({
      data: {
        user_id: userId,
        quest_id: quest.id,
      },
    });
  }
  const questUser = await prisma.questUser.findMany({
    where: { user_id: userId },
    include: { Quest: true },
  });
  for (const qu of questUser) {
    //   const queryRes = await prisma.$queryRaw`${qu.Quest.queryCheck}`;
    const query = runQuery(
      qu.Quest.queryCheck,
      qu.Quest.levelGoals[qu.currentLevel],
      userId
    );
    const queryRes = await prisma.$queryRaw(Prisma.sql([query]));
    console.log({ queryRes });
  }
  console.log("Seed done!");
}
main(-1);
// Example usage of quests to avoid unused variable error
