import { prisma } from "../../src/helpers/prisma.client";

async function run() {
  console.log("=== Semeando Novas Missões Criativas & Recompensas Rebalanceadas ===");

  const creativeQuests = [
    {
      name: "Mestre das Trevas",
      description: [
        "Colecione 5 Pokémon do tipo Noturno/Escuridão",
        "Colecione 15 Pokémon do tipo Noturno/Escuridão",
        "Colecione 35 Pokémon do tipo Noturno/Escuridão",
      ],
      levelRewards: [8000, 20000, 50000],
      levelGoals: [5, 15, 35],
      levelCount: 3,
      isDiary: false,
      queryCheck: `SELECT count(*) >= $GOAL as mission_complete, count(*) as progress FROM cards_user CU INNER JOIN cards C ON CU."cardId" = C.id WHERE CU."userId" = $USER_ID AND (C.type ILIKE '%DARK%' OR C.type ILIKE '%NOTURNO%');`,
    },
    {
      name: "Especialista Psíquico",
      description: [
        "Colecione 5 Pokémon do tipo Psíquico",
        "Colecione 15 Pokémon do tipo Psíquico",
        "Colecione 35 Pokémon do tipo Psíquico",
      ],
      levelRewards: [8000, 20000, 50000],
      levelGoals: [5, 15, 35],
      levelCount: 3,
      isDiary: false,
      queryCheck: `SELECT count(*) >= $GOAL as mission_complete, count(*) as progress FROM cards_user CU INNER JOIN cards C ON CU."cardId" = C.id WHERE CU."userId" = $USER_ID AND (C.type ILIKE '%PSYCHIC%' OR C.type ILIKE '%PSIQUICO%');`,
    },
    {
      name: "Poder de Titã (HP Extremo)",
      description: [
        "Consiga 3 cartas com mais de 220 de HP",
        "Consiga 10 cartas com mais de 220 de HP",
        "Consiga 25 cartas com mais de 220 de HP",
      ],
      levelRewards: [12000, 30000, 75000],
      levelGoals: [3, 10, 25],
      levelCount: 3,
      isDiary: false,
      queryCheck: `SELECT count(*) >= $GOAL as mission_complete, count(*) as progress FROM cards_user CU INNER JOIN cards C ON CU."cardId" = C.id WHERE CU."userId" = $USER_ID AND C.hp >= 220;`,
    },
    {
      name: "Caçador de Místicas & Lendárias",
      description: [
        "Consiga 2 cartas Místicas ou Lendárias (Tier 4 ou 5)",
        "Consiga 6 cartas Místicas ou Lendárias (Tier 4 ou 5)",
        "Consiga 15 cartas Místicas ou Lendárias (Tier 4 ou 5)",
      ],
      levelRewards: [15000, 45000, 100000],
      levelGoals: [2, 6, 15],
      levelCount: 3,
      isDiary: false,
      queryCheck: `SELECT count(*) >= $GOAL as mission_complete, count(*) as progress FROM cards_user CU INNER JOIN cards C ON CU."cardId" = C.id WHERE CU."userId" = $USER_ID AND C.rarity >= 4;`,
    },
    {
      name: "Arsenal V & VMAX",
      description: [
        "Colecione 3 cartas V, VMAX, VSTAR ou ex",
        "Colecione 10 cartas V, VMAX, VSTAR ou ex",
        "Colecione 25 cartas V, VMAX, VSTAR ou ex",
      ],
      levelRewards: [10000, 25000, 60000],
      levelGoals: [3, 10, 25],
      levelCount: 3,
      isDiary: false,
      queryCheck: `SELECT count(*) >= $GOAL as mission_complete, count(*) as progress FROM cards_user CU INNER JOIN cards C ON CU."cardId" = C.id WHERE CU."userId" = $USER_ID AND (C.name ILIKE '% V' OR C.name ILIKE '% VMAX%' OR C.name ILIKE '% VSTAR%' OR C.name ILIKE '% ex' OR C.name ILIKE '% EX');`,
    },
    {
      name: "Dinastia Eeveelution",
      description: [
        "Descubra 2 evoluções diferentes da família Eevee",
        "Descubra 4 evoluções diferentes da família Eevee",
        "Descubra todas as 8 evoluções da família Eevee!",
      ],
      levelRewards: [8000, 22000, 65000],
      levelGoals: [2, 4, 8],
      levelCount: 3,
      isDiary: false,
      queryCheck: `SELECT count(DISTINCT C.name) >= $GOAL as mission_complete, count(DISTINCT C.name) as progress FROM cards_user CU INNER JOIN cards C ON CU."cardId" = C.id WHERE CU."userId" = $USER_ID AND (C.name ILIKE '%Eevee%' OR C.name ILIKE '%Vaporeon%' OR C.name ILIKE '%Jolteon%' OR C.name ILIKE '%Flareon%' OR C.name ILIKE '%Espeon%' OR C.name ILIKE '%Umbreon%' OR C.name ILIKE '%Leafeon%' OR C.name ILIKE '%Glaceon%' OR C.name ILIKE '%Sylveon%');`,
    },
    {
      name: "Negociador da Liga",
      description: [
        "Participe de 1 troca no mercado de treinadores",
        "Participe de 5 trocas no mercado de treinadores",
        "Participe de 15 trocas no mercado de treinadores",
      ],
      levelRewards: [5000, 18000, 45000],
      levelGoals: [1, 5, 15],
      levelCount: 3,
      isDiary: false,
      queryCheck: `SELECT count(*) >= $GOAL as mission_complete, count(*) as progress FROM user_trade UT WHERE UT.user_id = $USER_ID;`,
    },
  ];

  let added = 0;
  for (const q of creativeQuests) {
    const existing = await prisma.quest.findFirst({
      where: { name: q.name }
    });

    if (existing) {
      await prisma.quest.update({
        where: { id: existing.id },
        data: q
      });
      console.log(`✓ Atualizada: ${q.name}`);
    } else {
      const created = await prisma.quest.create({
        data: q
      });
      console.log(`+ Criada: ${q.name} (ID ${created.id})`);
      added++;
    }
  }

  // Associar para usuários existentes em lote
  const allQuests = await prisma.quest.findMany();
  const allUsers = await prisma.user.findMany({ select: { id: true } });
  const existingRelations = await prisma.questUser.findMany({
    select: { user_id: true, quest_id: true }
  });
  const existingSet = new Set(existingRelations.map(r => `${r.user_id}_${r.quest_id}`));

  const toCreate: { user_id: number; quest_id: number }[] = [];
  for (const u of allUsers) {
    for (const q of allQuests) {
      if (q.isDiary) continue;
      if (!existingSet.has(`${u.id}_${q.id}`)) {
        toCreate.push({ user_id: u.id, quest_id: q.id });
      }
    }
  }

  if (toCreate.length > 0) {
    await prisma.questUser.createMany({
      data: toCreate,
      skipDuplicates: true,
    });
    console.log(`✓ ${toCreate.length} novas relações usuário-missão criadas.`);
  }

  console.log(`=== Missões Criativas Sincronizadas com Todos os Usuários! ===`);
}

run()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
