import { prisma } from "../../src/helpers/prisma.client";
import { hash } from "bcrypt";
import crypto from "crypto";

async function run() {
  console.log("=== Iniciando Normalização de Raridades e Seed de Trocas ===");

  // 1. CORREÇÃO DE RARIDADES NO BANCO DE DADOS
  console.log("1. Analisando e corrigindo raridades de cartas...");

  const allCards = await prisma.card.findMany({
    select: { id: true, name: true, rarity: true, hp: true, card_id: true }
  });

  let updatedCount = 0;

  for (const card of allCards) {
    const name = card.name;
    const hp = card.hp || 0;
    let targetRarity = card.rarity;

    // VMAX, VSTAR, V-UNION, Mega: Devem ser no mínimo Mística (4), ou Lendária (5) se titãs com 300+ HP
    if (/\b(VMAX|VSTAR|V-UNION)\b/i.test(name) || /\b(Mega\s|M\s)/i.test(name)) {
      if (hp >= 300 || card.rarity === 5) {
        targetRarity = 5;
      } else {
        targetRarity = Math.max(card.rarity, 4);
      }
    }
    // V, ex, EX, GX: Devem ser no mínimo Épica (3), ou Mística (4) se HP alto (>= 220, ex: Mega Rayquaza)
    else if (/\b(V|ex|EX|GX)\b/.test(name)) {
      if (hp >= 230 || card.rarity >= 4) {
        targetRarity = Math.max(card.rarity, 4);
      } else {
        targetRarity = Math.max(card.rarity, 3);
      }
    }
    // Cartas com HP absurdo (>= 280) que porventura estavam com raridade baixa
    else if (hp >= 280) {
      targetRarity = Math.max(card.rarity, 4);
    }

    if (targetRarity !== card.rarity) {
      await prisma.card.update({
        where: { id: card.id },
        data: { rarity: targetRarity }
      });
      updatedCount++;
    }
  }

  console.log(`✓ Concluído: ${updatedCount} cartas tiveram suas raridades corrigidas e promovidas!`);

  // 2. SEED DE TREINADORES SIMULADOS E TROCAS REALISTAS
  console.log("2. Verificando e criando treinadores simulados para o Mercado de Trocas...");

  const simulatedTrainers = [
    { username: "Red_Champion", email: "red.champion@poketcg.io", picture: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png" },
    { username: "Cynthia_Sinnoh", email: "cynthia@poketcg.io", picture: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/448.png" },
    { username: "Steven_Stone", email: "steven.hoenn@poketcg.io", picture: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/376.png" },
    { username: "Lance_DragonMaster", email: "lance@poketcg.io", picture: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/149.png" },
    { username: "Misty_Cerulean", email: "misty.water@poketcg.io", picture: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/131.png" },
  ];

  const defaultPasswordHash = await hash("treinador123", 10);
  const trainerUsers: any[] = [];

  for (const t of simulatedTrainers) {
    let user = await prisma.user.findFirst({ where: { email: t.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          username: t.username,
          email: t.email,
          password: defaultPasswordHash,
          picture: t.picture,
          money: 250000,
          totalBudget: 500000,
          rarityPoints: 3500,
        }
      });
    }
    trainerUsers.push(user);
  }

  console.log(`✓ ${trainerUsers.length} treinadores ativos para criação de trocas.`);

  // Buscar cartas icônicas no banco para montar trocas realistas
  const findCard = async (query: string, minRarity: number = 2) => {
    return prisma.card.findFirst({
      where: {
        name: { contains: query, mode: "insensitive" },
        rarity: { gte: minRarity }
      }
    });
  };

  const charizard = await findCard("Charizard", 3);
  const blastoise = await findCard("Blastoise", 2);
  const venusaur = await findCard("Venusaur", 2);
  const pikachu = await findCard("Pikachu", 2);
  const mewtwo = await findCard("Mewtwo", 3);
  const rayquaza = await findCard("Rayquaza", 3);
  const lucario = await findCard("Lucario", 3);
  const gengar = await findCard("Gengar", 3);
  const dragonite = await findCard("Dragonite", 2);
  const gyarados = await findCard("Gyarados", 2);
  const eevee = await findCard("Eevee", 1);
  const umbreon = await findCard("Umbreon", 2);

  const realisticOffers = [
    {
      trainer: trainerUsers[0], // Red
      offerCard: charizard || venusaur,
      desc: "Troco meu Charizard por Blastoise ou cartas raras de Kanto! Oferta séria de Campeão.",
      receiveMoney: 5000,
      durationDays: 7,
    },
    {
      trainer: trainerUsers[1], // Cynthia
      offerCard: lucario || gengar,
      desc: "Disponibilizo Lucario para quem tiver cartas psíquicas raras (Mewtwo ou Gengar) ou oferta justa.",
      receiveMoney: 8000,
      durationDays: 14,
    },
    {
      trainer: trainerUsers[2], // Steven
      offerCard: rayquaza || dragonite,
      desc: "Procurando minerais raros e Pokémon metálicos! Aceito ofertas em cartas ou moedas.",
      receiveMoney: 12000,
      durationDays: 10,
    },
    {
      trainer: trainerUsers[3], // Lance
      offerCard: dragonite || rayquaza,
      desc: "Coleciono dragões lendários. Ofereço este Dragonite para quem tiver Charizard ou Rayquaza.",
      receiveMoney: 6000,
      durationDays: 5,
    },
    {
      trainer: trainerUsers[4], // Misty
      offerCard: gyarados || blastoise,
      desc: "Troco Gyarados poderoso por Pokémon aquáticos fofos ou elétricos como Pikachu.",
      receiveMoney: 3000,
      durationDays: 7,
    },
    {
      trainer: trainerUsers[0], // Red
      offerCard: pikachu || eevee,
      desc: "Pikachu especial em busca de um novo parceiro de jornada! Aberto a qualquer proposta justa.",
      receiveMoney: 2000,
      durationDays: 3,
    },
    {
      trainer: trainerUsers[1], // Cynthia
      offerCard: gengar || mewtwo,
      desc: "Gengar fantasmagórico disponível para troca. Aceito ofertas variadas ou 10k em moedas.",
      receiveMoney: 10000,
      durationDays: 12,
    },
    {
      trainer: trainerUsers[4], // Misty
      offerCard: umbreon || blastoise,
      desc: "Buscando completar meu álbum aquático! Faça sua oferta com cartas raras.",
      receiveMoney: 4000,
      durationDays: 6,
    },
  ];

  let tradesCreated = 0;

  for (const offer of realisticOffers) {
    if (!offer.offerCard || !offer.trainer) continue;

    // Verificar se a carta já está associada ao treinador
    const hasCard = await prisma.cards_user.findFirst({
      where: { userId: offer.trainer.id, cardId: offer.offerCard.id }
    });
    if (!hasCard) {
      await prisma.cards_user.create({
        data: { userId: offer.trainer.id, cardId: offer.offerCard.id }
      });
    }

    // Marcar também como trade-marked para o treinador
    await prisma.tradeMarkedCard.upsert({
      where: {
        userId_cardId: {
          userId: offer.trainer.id,
          cardId: offer.offerCard.id
        }
      },
      update: {},
      create: {
        userId: offer.trainer.id,
        cardId: offer.offerCard.id
      }
    });

    const tradeHash = crypto.randomBytes(8).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + offer.durationDays);

    const trade = await prisma.trade.create({
      data: {
        name: `Oferta de ${offer.offerCard.name}`,
        hash: tradeHash,
        description: offer.desc,
        acceptOffers: true,
        acceptMoney: offer.receiveMoney > 0,
        moneyReceiving: offer.receiveMoney,
        expiresAt,
        maxRarity: offer.offerCard.rarity,
        public: true,
        userTrades: {
          create: {
            user_id: offer.trainer.id,
            is_sender: true,
          }
        },
        cards: {
          create: {
            card_id: offer.offerCard.id,
            is_sender: true,
          }
        }
      }
    });

    tradesCreated++;
  }

  console.log(`✓ ${tradesCreated} trocas realistas criadas com sucesso no mercado!`);
  console.log("=== Normalização e Seeds Finalizados com Sucesso! ===");
}

run()
  .catch((e) => {
    console.error("Erro durante execução:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
