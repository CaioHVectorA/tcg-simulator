import { Elysia, t } from "elysia";
import { jwt } from "../middlewares/jwt/jwt";
import { getUserUserMiddleware } from "../middlewares/jwt";
import { prisma } from "../helpers/prisma.client";
import type { User } from "@prisma/client";
import { errorResponse, sucessResponse } from "../lib/mount-response";

export interface OfficialAlbumDef {
  id: string;
  title: string;
  category: "Regiões" | "Lendários" | "Especiais";
  tier: "Fácil" | "Médio" | "Lendário";
  description: string;
  targetNames: string[];
  rewardGold: number;
  rewardXp: number;
  badge: string;
}

export function matchesPokemonName(cardName: string, targetName: string): boolean {
  if (!cardName || !targetName) return false;
  const normalizedCard = cardName.toLowerCase().replace(/[^a-z0-9]/g, " ");
  const normalizedTarget = targetName.toLowerCase().replace(/[^a-z0-9]/g, " ");
  const escaped = normalizedTarget.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(^|\\s)${escaped}(\\s|$)`, "i");
  return regex.test(normalizedCard);
}

export const OFFICIAL_ALBUMS: OfficialAlbumDef[] = [
  {
    id: "kanto_starters",
    title: "Iniciais Clássicos de Kanto",
    category: "Regiões",
    tier: "Fácil",
    description: "O quarteto lendário de Pallet Town: Bulbasaur, Charmander, Squirtle e Pikachu.",
    targetNames: ["Bulbasaur", "Charmander", "Squirtle", "Pikachu"],
    rewardGold: 18000,
    rewardXp: 450,
    badge: "Nostalgia",
  },
  {
    id: "johto_starters",
    title: "Iniciais de Johto",
    category: "Regiões",
    tier: "Fácil",
    description: "Os companheiros de New Bark Town: Chikorita, Cyndaquil e Totodile.",
    targetNames: ["Chikorita", "Cyndaquil", "Totodile"],
    rewardGold: 15000,
    rewardXp: 400,
    badge: "Ouro & Prata",
  },
  {
    id: "hoenn_starters",
    title: "Iniciais de Hoenn",
    category: "Regiões",
    tier: "Fácil",
    description: "Os jovens exploradores de Littleroot Town: Treecko, Torchic e Mudkip.",
    targetNames: ["Treecko", "Torchic", "Mudkip"],
    rewardGold: 16000,
    rewardXp: 400,
    badge: "Rubi & Safira",
  },
  {
    id: "sinnoh_starters",
    title: "Iniciais de Sinnoh",
    category: "Regiões",
    tier: "Fácil",
    description: "Os parceiros do Professor Rowan: Turtwig, Chimchar e Piplup.",
    targetNames: ["Turtwig", "Chimchar", "Piplup"],
    rewardGold: 16000,
    rewardXp: 400,
    badge: "Diamante & Pérola",
  },
  {
    id: "unova_starters",
    title: "Iniciais de Unova",
    category: "Regiões",
    tier: "Fácil",
    description: "A nova geração de Nuvema Town: Snivy, Tepig e Oshawott.",
    targetNames: ["Snivy", "Tepig", "Oshawott"],
    rewardGold: 16000,
    rewardXp: 400,
    badge: "Preto & Branco",
  },
  {
    id: "kalos_starters",
    title: "Iniciais de Kalos & Greninja",
    category: "Regiões",
    tier: "Fácil",
    description: "A elite de Vaniville: Chespin, Fennekin, Froakie e o supremo Greninja.",
    targetNames: ["Chespin", "Fennekin", "Froakie", "Greninja"],
    rewardGold: 22000,
    rewardXp: 550,
    badge: "Kalosiano",
  },
  {
    id: "alola_stars",
    title: "Espíritos Tropicais de Alola",
    category: "Regiões",
    tier: "Fácil",
    description: "Os companheiros das ilhas tropicais: Rowlet, Litten e Mimikyu.",
    targetNames: ["Rowlet", "Litten", "Mimikyu"],
    rewardGold: 18000,
    rewardXp: 450,
    badge: "Alola Alii",
  },
  {
    id: "paldea_starters",
    title: "Iniciais de Paldea",
    category: "Regiões",
    tier: "Fácil",
    description: "Os jovens aprendizes da Academia: Sprigatito, Fuecoco e Quaxly.",
    targetNames: ["Sprigatito", "Fuecoco", "Quaxly"],
    rewardGold: 18000,
    rewardXp: 500,
    badge: "Terastal",
  },
  {
    id: "ghost_squad",
    title: "Pesadelo Noturno",
    category: "Especiais",
    tier: "Médio",
    description: "As assombrações mais temidas de Lavender Town: Gengar, Haunter e Gastly.",
    targetNames: ["Gengar", "Haunter", "Gastly"],
    rewardGold: 45000,
    rewardXp: 800,
    badge: "Fantasma",
  },
  {
    id: "fire_dragons",
    title: "Mestres de Chamas",
    category: "Especiais",
    tier: "Médio",
    description: "O poder do calor supremo: Charizard, Typhlosion e Blaziken.",
    targetNames: ["Charizard", "Typhlosion", "Blaziken"],
    rewardGold: 50000,
    rewardXp: 850,
    badge: "Fogo Puro",
  },
  {
    id: "kanto_trio",
    title: "Trio das Aves de Kanto",
    category: "Lendários",
    tier: "Médio",
    description: "As lendárias aves elementais: Articuno (Gelo), Zapdos (Elétrico) e Moltres (Fogo).",
    targetNames: ["Articuno", "Zapdos", "Moltres"],
    rewardGold: 60000,
    rewardXp: 950,
    badge: "Aves Lendárias",
  },
  {
    id: "johto_beasts",
    title: "Cães Lendários de Johto",
    category: "Lendários",
    tier: "Médio",
    description: "Ressuscitados por Ho-Oh na Torre Queimada: Raikou, Entei e Suicune.",
    targetNames: ["Raikou", "Entei", "Suicune"],
    rewardGold: 65000,
    rewardXp: 1000,
    badge: "Besta Ancestral",
  },
  {
    id: "lake_guardians",
    title: "Guardiões dos Lagos de Sinnoh",
    category: "Lendários",
    tier: "Médio",
    description: "Espíritos da Sabedoria, Emoção e Força de Vontade: Uxie, Mesprit e Azelf.",
    targetNames: ["Uxie", "Mesprit", "Azelf"],
    rewardGold: 65000,
    rewardXp: 1000,
    badge: "Espiritual",
  },
  {
    id: "eeveelutions_classic",
    title: "Eeveelutions Clássicas",
    category: "Especiais",
    tier: "Médio",
    description: "A evolução elementar primária: Eevee, Vaporeon, Jolteon e Flareon.",
    targetNames: ["Eevee", "Vaporeon", "Jolteon", "Flareon"],
    rewardGold: 55000,
    rewardXp: 900,
    badge: "Adaptação",
  },
  {
    id: "eeveelutions_modern",
    title: "Eeveelutions da Harmonia",
    category: "Especiais",
    tier: "Médio",
    description: "As evoluções espirituais e afetivas: Espeon, Umbreon, Leafeon, Glaceon e Sylveon.",
    targetNames: ["Espeon", "Umbreon", "Leafeon", "Glaceon", "Sylveon"],
    rewardGold: 75000,
    rewardXp: 1100,
    badge: "Laços Puros",
  },
  {
    id: "psychic_gods",
    title: "Força Psíquica Suprema",
    category: "Especiais",
    tier: "Médio",
    description: "A mente e o DNA mais avançados do mundo Pokémon: Mewtwo, Mew e Alakazam.",
    targetNames: ["Mewtwo", "Mew", "Alakazam"],
    rewardGold: 80000,
    rewardXp: 1200,
    badge: "Psíquico",
  },
  {
    id: "hoenn_weather",
    title: "Guardiões do Clima de Hoenn",
    category: "Lendários",
    tier: "Lendário",
    description: "Os titãs dos Mares, da Terra e dos Céus: Kyogre, Groudon e Rayquaza.",
    targetNames: ["Kyogre", "Groudon", "Rayquaza"],
    rewardGold: 180000,
    rewardXp: 2800,
    badge: "Senhor do Clima",
  },
  {
    id: "regi_titans",
    title: "Titãs Selados (Regis)",
    category: "Lendários",
    tier: "Lendário",
    description: "Forjados na era glacial e rochosa: Regirock, Regice, Registeel e o colosso Regigigas.",
    targetNames: ["Regirock", "Regice", "Registeel", "Regigigas"],
    rewardGold: 220000,
    rewardXp: 3200,
    badge: "Titã Ancestral",
  },
  {
    id: "sinnoh_creation",
    title: "Trio da Criação de Sinnoh",
    category: "Lendários",
    tier: "Lendário",
    description: "Os governantes do Tempo, Espaço e Antimatéria: Dialga, Palkia e Giratina.",
    targetNames: ["Dialga", "Palkia", "Giratina"],
    rewardGold: 200000,
    rewardXp: 3000,
    badge: "Criadores",
  },
  {
    id: "unova_tao",
    title: "Dragões Tao de Unova",
    category: "Lendários",
    tier: "Lendário",
    description: "Verdade, Ideais e o Vazio Congelado: Reshiram, Zekrom e Kyurem.",
    targetNames: ["Reshiram", "Zekrom", "Kyurem"],
    rewardGold: 190000,
    rewardXp: 2900,
    badge: "Dragão Tao",
  },
  {
    id: "kalos_mortals",
    title: "Entidades da Vida & Morte",
    category: "Lendários",
    tier: "Lendário",
    description: "O equilíbrio natural de Kalos: Xerneas (Vida), Yveltal (Destruição) e Zygarde (Equilíbrio).",
    targetNames: ["Xerneas", "Yveltal", "Zygarde"],
    rewardGold: 210000,
    rewardXp: 3100,
    badge: "Aura Cósmica",
  },
  {
    id: "alola_light",
    title: "Trio da Luz de Alola",
    category: "Lendários",
    tier: "Lendário",
    description: "Os arautos do Sol, da Lua e do Prisma Estelar: Solgaleo, Lunala e Necrozma.",
    targetNames: ["Solgaleo", "Lunala", "Necrozma"],
    rewardGold: 230000,
    rewardXp: 3300,
    badge: "Luz Eterna",
  },
  {
    id: "galar_heroes",
    title: "Espada & Escudo de Galar",
    category: "Lendários",
    tier: "Lendário",
    description: "Os protetores da Noite Negra: Zacian, Zamazenta e o cataclísmico Eternatus.",
    targetNames: ["Zacian", "Zamazenta", "Eternatus"],
    rewardGold: 250000,
    rewardXp: 3600,
    badge: "Galar Heroico",
  },
  {
    id: "paldea_paradox",
    title: "Dragões do Passado & Futuro",
    category: "Lendários",
    tier: "Lendário",
    description: "Os ápices temporais da Grande Cratera de Paldea: Koraidon, Miraidon e Cyclizar.",
    targetNames: ["Koraidon", "Miraidon", "Cyclizar"],
    rewardGold: 260000,
    rewardXp: 3800,
    badge: "Fenda Temporal",
  },
  {
    id: "dragon_titans",
    title: "Dragões do Panteão",
    category: "Lendários",
    tier: "Lendário",
    description: "Os dragões mais poderosos da história: Dragonite, Salamence, Garchomp e Rayquaza.",
    targetNames: ["Dragonite", "Salamence", "Garchomp", "Rayquaza"],
    rewardGold: 280000,
    rewardXp: 4000,
    badge: "Panteão Dragão",
  },
  {
    id: "arceus_creator",
    title: "O Alfa & Criador Universal",
    category: "Especiais",
    tier: "Lendário",
    description: "O Deus Pokémon supremo e a criação de todo o cosmo: Arceus, Dialga, Palkia e Giratina.",
    targetNames: ["Arceus", "Dialga", "Palkia", "Giratina"],
    rewardGold: 500000,
    rewardXp: 6000,
    badge: "Divindade Suprema",
  },
];

import { memoryCache, TTL } from "../lib/cache";

export const albumController = new Elysia({}).group("/albums", (app) => {
  return app
    .decorate("prisma", prisma)
    .decorate("user", {} as User)
    .use(jwt)
    .onBeforeHandle(getUserUserMiddleware as any)
    .get("/", async ({ user, prisma }) => {
      // 1. Busca cartas de referência do cache em memória (TTL: 1h)
      const allTargetNames = Array.from(
        new Set(OFFICIAL_ALBUMS.flatMap((a) => a.targetNames))
      );

      const referenceCardsPromise = memoryCache.getOrSet(
        "album_reference_cards",
        async () => {
          return prisma.card.findMany({
            where: {
              OR: allTargetNames.map((name) => ({
                name: { contains: name, mode: "insensitive" as const },
              })),
            },
            select: {
              id: true,
              name: true,
              image_url: true,
              rarity: true,
            },
          });
        },
        TTL.ONE_HOUR
      );

      // 2. Executa as consultas do usuário e recupera o cache em paralelo
      const [userCards, claims, referenceCards] = await Promise.all([
        prisma.cards_user.findMany({
          where: { userId: user.id },
          select: {
            id: true,
            cardId: true,
            Card: {
              select: {
                id: true,
                name: true,
                image_url: true,
                rarity: true,
              },
            },
          },
        }),
        prisma.transaction.findMany({
          where: {
            user_id: user.id,
            idempotencyKey: { startsWith: `album_claim_${user.id}_` },
            status: "COMPLETED",
          },
          select: {
            idempotencyKey: true,
          },
        }),
        referenceCardsPromise,
      ]);

      const claimedAlbumIds = new Set(
        claims.map((c) => c.idempotencyKey.replace(`album_claim_${user.id}_`, ""))
      );

      const albumsWithProgress = OFFICIAL_ALBUMS.map((album) => {
        const isClaimed = claimedAlbumIds.has(album.id);

        const cardSlots = album.targetNames.map((targetName) => {
          // Checa se o usuário possui alguma cópia correspondente
          const ownedMatch = userCards.find((uc) =>
            matchesPokemonName(uc.Card.name, targetName)
          );

          // Carta de referência para preview/silhueta
          const sampleCard =
            referenceCards.find((rc) =>
              matchesPokemonName(rc.name, targetName)
            ) || {
              id: 0,
              name: targetName,
              image_url: "",
              rarity: 3,
            };

          return {
            targetName,
            isOwned: !!ownedMatch,
            card: ownedMatch ? ownedMatch.Card : sampleCard,
          };
        });

        const collectedCount = cardSlots.filter((s) => s.isOwned).length;
        const totalCount = album.targetNames.length;
        const isCompleted = collectedCount === totalCount;
        const canClaim = isCompleted && !isClaimed;
        const progressPercent = Math.round((collectedCount / totalCount) * 100);

        return {
          id: album.id,
          title: album.title,
          category: album.category,
          tier: album.tier,
          description: album.description,
          badge: album.badge,
          rewardGold: album.rewardGold,
          rewardXp: album.rewardXp,
          totalCount,
          collectedCount,
          progressPercent,
          isCompleted,
          isClaimed,
          canClaim,
          cardSlots,
        };
      });

      return sucessResponse(albumsWithProgress);
    })
    .post("/claim/:id", async ({ user, prisma, params, set }) => {
      const albumId = params.id;
      const albumDef = OFFICIAL_ALBUMS.find((a) => a.id === albumId);
      if (!albumDef) {
        set.status = 404;
        return errorResponse("Álbum não encontrado.", "Álbum não encontrado.");
      }

      const idempotencyKey = `album_claim_${user.id}_${albumId}`;
      const existingClaim = await prisma.transaction.findUnique({
        where: { idempotencyKey },
      });
      if (existingClaim) {
        set.status = 400;
        return errorResponse("Recompensa já coletada.", "Você já colou e resgatou este álbum.");
      }

      // 1. Busca todas as cartas do usuário com IDs para consumir
      const userCards = await prisma.cards_user.findMany({
        where: { userId: user.id },
        include: { Card: true },
      });

      // 2. Identifica exatamente 1 cópia única de card_user para cada targetName do álbum
      const cardsUserIdsToConsume: number[] = [];
      const cardIdsConsumed: number[] = [];
      const consumedCardUserIdsSet = new Set<number>();

      for (const targetName of albumDef.targetNames) {
        const matchingUserCard = userCards.find(
          (uc) =>
            !consumedCardUserIdsSet.has(uc.id) &&
            matchesPokemonName(uc.Card.name, targetName)
        );

        if (!matchingUserCard) {
          set.status = 400;
          return errorResponse(
            "Álbum incompleto.",
            `Você não possui a carta necessária: ${targetName}. Obtenha todas as cartas antes de colar no fichário!`
          );
        }

        consumedCardUserIdsSet.add(matchingUserCard.id);
        cardsUserIdsToConsume.push(matchingUserCard.id);
        cardIdsConsumed.push(matchingUserCard.cardId);
      }

      // 3. Transação atômica: queima/consome as cartas, limpa trocas/favoritos se não sobrarem cópias, credita moedas e XP
      await prisma.$transaction(async (tx) => {
        // Remove as cópias coladas no álbum
        await tx.cards_user.deleteMany({
          where: {
            id: { in: cardsUserIdsToConsume },
            userId: user.id,
          },
        });

        // Checa se o usuário ainda possui cópias remanescentes para limpar decks ou trocas
        const remainingCards = await tx.cards_user.findMany({
          where: {
            userId: user.id,
            cardId: { in: cardIdsConsumed },
          },
          select: { cardId: true },
        });
        const remainingCardIdsSet = new Set(remainingCards.map((rc) => rc.cardId));

        const cardIdsWithZeroRemaining = cardIdsConsumed.filter(
          (cardId) => !remainingCardIdsSet.has(cardId)
        );

        if (cardIdsWithZeroRemaining.length > 0) {
          await tx.tradeMarkedCard.deleteMany({
            where: {
              userId: user.id,
              cardId: { in: cardIdsWithZeroRemaining },
            },
          });
          await tx.favoriteCard.deleteMany({
            where: {
              userId: user.id,
              cardId: { in: cardIdsWithZeroRemaining },
            },
          });
          await tx.userDeckCard.deleteMany({
            where: {
              userId: user.id,
              cardId: { in: cardIdsWithZeroRemaining },
            },
          });
        }

        // Credita recompensas
        await tx.user.update({
          where: { id: user.id },
          data: {
            money: { increment: albumDef.rewardGold },
            rarityPoints: { increment: albumDef.rewardXp },
          },
        });

        // Registra transação do claim
        await tx.transaction.create({
          data: {
            idempotencyKey,
            status: "COMPLETED",
            user_id: user.id,
          },
        });
      });

      return sucessResponse(
        {
          rewardGold: albumDef.rewardGold,
          rewardXp: albumDef.rewardXp,
          albumId: albumDef.id,
          albumTitle: albumDef.title,
          consumedCardsCount: cardsUserIdsToConsume.length,
        },
        `Parabéns! Álbum "${albumDef.title}" colado no seu Fichário! Você recebeu +${albumDef.rewardGold.toLocaleString("pt-BR")} Moedas e +${albumDef.rewardXp} XP.`
      );
    });
});
