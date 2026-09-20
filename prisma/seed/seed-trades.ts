import { PrismaClient } from "@prisma/client";
import { hash } from "bcrypt";
import crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Iniciando Seed Otimizado de Trocas (P2P Trading) ===");

  const defaultPasswordHash = await hash("treinador123", 10);

  // 1. Criar ou atualizar os 10 treinadores da comunidade
  const trainersData = [
    {
      username: "Red_Champion",
      email: "red.champion@poketcg.io",
      picture: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png", // Pikachu
      money: 850000,
      totalBudget: 1500000,
      rarityPoints: 14500,
    },
    {
      username: "Cynthia_Sinnoh",
      email: "cynthia.champion@poketcg.io",
      picture: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/448.png", // Lucario
      money: 1200000,
      totalBudget: 2200000,
      rarityPoints: 16800,
    },
    {
      username: "Steven_Hoenn",
      email: "steven.hoenn@poketcg.io",
      picture: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/376.png", // Metagross
      money: 950000,
      totalBudget: 1800000,
      rarityPoints: 13200,
    },
    {
      username: "Lance_DragonMaster",
      email: "lance@poketcg.io",
      picture: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/149.png", // Dragonite
      money: 600000,
      totalBudget: 1200000,
      rarityPoints: 11500,
    },
    {
      username: "Blue_Rival",
      email: "blue.oak@poketcg.io",
      picture: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/9.png", // Blastoise
      money: 500000,
      totalBudget: 1000000,
      rarityPoints: 9800,
    },
    {
      username: "Sabrina_Psychic",
      email: "sabrina.saffron@poketcg.io",
      picture: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/65.png", // Alakazam
      money: 380000,
      totalBudget: 750000,
      rarityPoints: 8600,
    },
    {
      username: "Leon_Galar",
      email: "leon.champion@poketcg.io",
      picture: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png", // Charizard
      money: 1100000,
      totalBudget: 2000000,
      rarityPoints: 15400,
    },
    {
      username: "Nemona_Paldea",
      email: "nemona.champion@poketcg.io",
      picture: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/923.png", // Pawmot
      money: 320000,
      totalBudget: 600000,
      rarityPoints: 7400,
    },
    {
      username: "Misty_Cerulean",
      email: "misty.water@poketcg.io",
      picture: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/131.png", // Lapras
      money: 250000,
      totalBudget: 500000,
      rarityPoints: 6200,
    },
    {
      username: "Brock_Pewter",
      email: "brock.pewter@poketcg.io",
      picture: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/95.png", // Onix
      money: 210000,
      totalBudget: 420000,
      rarityPoints: 5500,
    },
  ];

  const trainersMap: Record<string, any> = {};

  // Buscar todos os usuários existentes com esses emails em uma única query
  const existingUsers = await prisma.user.findMany({
    where: { email: { in: trainersData.map((t) => t.email) } },
  });
  const existingMap = new Map(existingUsers.map((u) => [u.email, u]));

  for (const t of trainersData) {
    const existing = existingMap.get(t.email);
    if (existing) {
      const updated = await prisma.user.update({
        where: { id: existing.id },
        data: {
          username: t.username,
          picture: t.picture,
          money: t.money,
          totalBudget: t.totalBudget,
          rarityPoints: t.rarityPoints,
        },
      });
      trainersMap[t.username] = updated;
    } else {
      const created = await prisma.user.create({
        data: {
          username: t.username,
          email: t.email,
          password: defaultPasswordHash,
          picture: t.picture,
          money: t.money,
          totalBudget: t.totalBudget,
          rarityPoints: t.rarityPoints,
        },
      });
      trainersMap[t.username] = created;
    }
  }

  console.log(`✓ ${Object.keys(trainersMap).length} treinadores ativos prontos.`);

  // 2. Limpar trocas anteriores dos bots
  const botTrainerIds = Object.values(trainersMap).map((u) => u.id);
  await prisma.trade.deleteMany({
    where: {
      userTrades: {
        some: {
          user_id: { in: botTrainerIds },
          is_sender: true,
        },
      },
    },
  });
  console.log("✓ Trocas anteriores de bots limpas.");

  // 3. Buscar cartas em lote com UMA única query
  const targetNames = [
    "Charizard", "Blastoise", "Venusaur", "Pikachu", "Eevee",
    "Mewtwo", "Rayquaza", "Lucario", "Gengar", "Dragonite",
    "Gyarados", "Umbreon", "Alakazam", "Squirtle", "Charmander",
    "Bulbasaur", "Snorlax", "Machamp", "Lapras",
  ];

  const allCards = await prisma.card.findMany({
    where: {
      OR: targetNames.map((n) => ({ name: { contains: n, mode: "insensitive" } })),
    },
    orderBy: { rarity: "desc" },
  });

  const getCard = (name: string, minRarity: number = 1, maxRarity: number = 5) => {
    return allCards.find(
      (c) =>
        c.name.toLowerCase().includes(name.toLowerCase()) &&
        c.rarity >= minRarity &&
        c.rarity <= maxRarity
    );
  };

  const charizardGodPull = getCard("Charizard", 4, 5);
  const charizardEpic = getCard("Charizard", 3, 3) || charizardGodPull;
  const blastoise = getCard("Blastoise", 2, 4);
  const venusaur = getCard("Venusaur", 2, 4);
  const pikachu = getCard("Pikachu", 1, 3);
  const eevee = getCard("Eevee", 1, 2);
  const mewtwo = getCard("Mewtwo", 3, 5);
  const rayquaza = getCard("Rayquaza", 3, 5);
  const lucario = getCard("Lucario", 3, 4);
  const gengar = getCard("Gengar", 3, 5);
  const dragonite = getCard("Dragonite", 2, 4);
  const gyarados = getCard("Gyarados", 2, 3);
  const umbreon = getCard("Umbreon", 2, 4);
  const alakazam = getCard("Alakazam", 2, 3);
  const squirtle = getCard("Squirtle", 1, 1);
  const charmander = getCard("Charmander", 1, 1);
  const bulbasaur = getCard("Bulbasaur", 1, 1);
  const snorlax = getCard("Snorlax", 2, 3);
  const machamp = getCard("Machamp", 2, 3);
  const lapras = getCard("Lapras", 2, 3);

  console.log(`✓ ${allCards.length} cartas indexadas na memória.`);

  // 4. Definição das 12 Ofertas Realistas
  const tradesToCreate = [
    {
      trainer: trainersMap["Red_Champion"],
      title: "Charizard Épico por Blastoise de Kanto",
      desc: "Troco meu Charizard por Blastoise clássico para completar a Pokédex de Kanto. Oferta de Campeão!",
      offeredCard: charizardEpic,
      requestedCard: blastoise,
      moneySending: 0,
      moneyReceiving: 2500,
      durationDays: 7,
      acceptOffers: true,
    },
    {
      trainer: trainersMap["Leon_Galar"],
      title: "Charizard God Pull ★★★★★ em busca de Mewtwo",
      desc: "Carta de raridade máxima! Busco Mewtwo de nível equivalente ou proposta com alto valor em moedas.",
      offeredCard: charizardGodPull,
      requestedCard: mewtwo,
      moneySending: 15000,
      moneyReceiving: 0,
      durationDays: 14,
      acceptOffers: true,
    },
    {
      trainer: trainersMap["Nemona_Paldea"],
      title: "Troco Eevee por Pikachu (Iniciante Amigável)",
      desc: "Adoro colecionar e batalhar! Se você tiver um Pikachu comum, troco pelo meu Eevee e ainda dou moedas!",
      offeredCard: eevee,
      requestedCard: pikachu,
      moneySending: 1500,
      moneyReceiving: 0,
      durationDays: 5,
      acceptOffers: true,
    },
    {
      trainer: trainersMap["Blue_Rival"],
      title: "Squirtle por Charmander ou Bulbasaur",
      desc: "Tenho Squirtle repetido. Quem tiver Charmander ou Bulbasaur pode aceitar na hora!",
      offeredCard: squirtle || blastoise,
      requestedCard: charmander || bulbasaur,
      moneySending: 500,
      moneyReceiving: 0,
      durationDays: 4,
      acceptOffers: true,
    },
    {
      trainer: trainersMap["Steven_Hoenn"],
      title: "Rayquaza Místico procurando Dragonite ou Lucario",
      desc: "Coleção de Hoenn quase finalizada. Procuro Dragonite com boas condições para fechar negócio.",
      offeredCard: rayquaza,
      requestedCard: dragonite,
      moneySending: 0,
      moneyReceiving: 5000,
      durationDays: 10,
      acceptOffers: true,
    },
    {
      trainer: trainersMap["Lance_DragonMaster"],
      title: "Dragonite Poderoso por Gyarados ou Charizard",
      desc: "Dragões e feras colossais. Troco Dragonite por Gyarados de boa raridade.",
      offeredCard: dragonite,
      requestedCard: gyarados,
      moneySending: 2000,
      moneyReceiving: 0,
      durationDays: 6,
      acceptOffers: true,
    },
    {
      trainer: trainersMap["Sabrina_Psychic"],
      title: "Alakazam Psíquico por Gengar Assombrado",
      desc: "A energia das cartas psíquicas se conecta com o oculto. Busco um Gengar de raridade equivalente.",
      offeredCard: alakazam,
      requestedCard: gengar,
      moneySending: 0,
      moneyReceiving: 3000,
      durationDays: 8,
      acceptOffers: true,
    },
    {
      trainer: trainersMap["Cynthia_Sinnoh"],
      title: "Lucario de Sinnoh por Mewtwo Psíquico",
      desc: "Ofereço Lucario especial com bônus de moedas para quem tiver Mewtwo.",
      offeredCard: lucario,
      requestedCard: mewtwo,
      moneySending: 10000,
      moneyReceiving: 0,
      durationDays: 12,
      acceptOffers: true,
    },
    {
      trainer: trainersMap["Misty_Cerulean"],
      title: "Lapras Aquático por Eevee ou Umbreon",
      desc: "Estou montando meu time de Eeveelutions! Troco este lindo Lapras por Eevee ou Umbreon.",
      offeredCard: lapras || gyarados,
      requestedCard: eevee || umbreon,
      moneySending: 1000,
      moneyReceiving: 0,
      durationDays: 5,
      acceptOffers: true,
    },
    {
      trainer: trainersMap["Brock_Pewter"],
      title: "Machamp Fortalecido por Snorlax ou Venusaur",
      desc: "Defesa e força física inabaláveis. Aceito Snorlax ou Venusaur em troca.",
      offeredCard: machamp,
      requestedCard: snorlax || venusaur,
      moneySending: 0,
      moneyReceiving: 2000,
      durationDays: 7,
      acceptOffers: true,
    },
    {
      trainer: trainersMap["Red_Champion"],
      title: "Umbreon Secreto por Gengar ou Alakazam",
      desc: "Carta noturna de alto prestígio. Aberto a contrapropostas inteligentes.",
      offeredCard: umbreon || snorlax,
      requestedCard: gengar || alakazam,
      moneySending: 3000,
      moneyReceiving: 0,
      durationDays: 9,
      acceptOffers: true,
    },
    {
      trainer: trainersMap["Leon_Galar"],
      title: "Gengar Épico por Lucario ou Blastoise",
      desc: "Troco Gengar para quem deseja completar sua linha de fantasmas!",
      offeredCard: gengar,
      requestedCard: lucario || blastoise,
      moneySending: 0,
      moneyReceiving: 4000,
      durationDays: 6,
      acceptOffers: true,
    },
  ];

  // 5. Garantir cartas dos treinadores em lote
  const cardsUserToCreate: { userId: number; cardId: number }[] = [];
  const tradeMarksToCreate: { userId: number; cardId: number }[] = [];

  for (const t of tradesToCreate) {
    if (t.offeredCard && t.trainer) {
      cardsUserToCreate.push({ userId: t.trainer.id, cardId: t.offeredCard.id });
      tradeMarksToCreate.push({ userId: t.trainer.id, cardId: t.offeredCard.id });
    }
  }

  // Também cartas para contrapropostas de Blue e Brock
  if (trainersMap["Blue_Rival"] && venusaur) {
    cardsUserToCreate.push({ userId: trainersMap["Blue_Rival"].id, cardId: venusaur.id });
  }
  if (trainersMap["Brock_Pewter"] && snorlax) {
    cardsUserToCreate.push({ userId: trainersMap["Brock_Pewter"].id, cardId: snorlax.id });
  }

  await prisma.cards_user.createMany({
    data: cardsUserToCreate,
    skipDuplicates: true,
  });

  await prisma.tradeMarkedCard.createMany({
    data: tradeMarksToCreate,
    skipDuplicates: true,
  });

  // 6. Criar as trocas em lote no banco
  let createdCount = 0;

  for (const t of tradesToCreate) {
    if (!t.offeredCard || !t.trainer) continue;

    const tradeHash = crypto.randomBytes(8).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + t.durationDays);

    const trade = await prisma.trade.create({
      data: {
        name: t.title,
        hash: tradeHash,
        description: t.desc,
        acceptOffers: t.acceptOffers,
        acceptMoney: t.moneyReceiving > 0 || t.moneySending > 0,
        moneySending: t.moneySending,
        moneyReceiving: t.moneyReceiving,
        expiresAt,
        minRarity: t.requestedCard?.rarity || 1,
        maxRarity: t.offeredCard.rarity,
        public: true,
        userTrades: {
          create: {
            user_id: t.trainer.id,
            is_sender: true,
          },
        },
        cards: {
          create: [
            {
              card_id: t.offeredCard.id,
              is_sender: true,
            },
            ...(t.requestedCard
              ? [
                  {
                    card_id: t.requestedCard.id,
                    is_sender: false,
                  },
                ]
              : []),
          ],
        },
      },
    });

    createdCount++;

    // Criar contrapropostas
    if (t.title.includes("Charizard Épico") && trainersMap["Blue_Rival"] && venusaur) {
      const offer = await prisma.trade_offers.create({
        data: {
          trade_id: trade.id,
          user_id: trainersMap["Blue_Rival"].id,
          money: 3000,
        },
      });

      await prisma.trade_offer_cards.create({
        data: {
          card_id: venusaur.id,
          trade_id: offer.id,
        },
      });
    }

    if (t.title.includes("Eevee") && trainersMap["Brock_Pewter"] && snorlax) {
      const offer = await prisma.trade_offers.create({
        data: {
          trade_id: trade.id,
          user_id: trainersMap["Brock_Pewter"].id,
          money: 500,
        },
      });

      await prisma.trade_offer_cards.create({
        data: {
          card_id: snorlax.id,
          trade_id: offer.id,
        },
      });
    }
  }

  console.log(`✓ ${createdCount} ofertas de troca ativas e contrapropostas criadas com sucesso!`);
  console.log("=== Seed de Trocas Finalizado com Sucesso! ===");
}

main()
  .catch((e) => {
    console.error("Erro ao rodar seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
