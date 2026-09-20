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
    id: "kanto_trio",
    title: "Trio das Aves de Kanto",
    category: "Lendários",
    description: "Consiga as lendárias aves elementais: Articuno (Gelo), Zapdos (Elétrico) e Moltres (Fogo).",
    targetNames: ["Articuno", "Zapdos", "Moltres"],
    rewardGold: 12000,
    rewardXp: 400,
    badge: "Ultra Raro",
  },
  {
    id: "kanto_starters",
    title: "Iniciais Clássicos de Kanto",
    category: "Regiões",
    description: "O quarteto icônico de Pallet Town: Bulbasaur, Charmander, Squirtle e Pikachu.",
    targetNames: ["Bulbasaur", "Charmander", "Squirtle", "Pikachu"],
    rewardGold: 8000,
    rewardXp: 250,
    badge: "Nostalgia",
  },
  {
    id: "johto_starters",
    title: "Iniciais de Johto",
    category: "Regiões",
    description: "Os companheiros de New Bark Town: Chikorita, Cyndaquil e Totodile.",
    targetNames: ["Chikorita", "Cyndaquil", "Totodile"],
    rewardGold: 10000,
    rewardXp: 300,
    badge: "Ouro & Prata",
  },
  {
    id: "johto_beasts",
    title: "Cães Lendários de Johto",
    category: "Lendários",
    description: "Ressuscitados por Ho-Oh na Torre Queimada: Raikou, Entei e Suicune.",
    targetNames: ["Raikou", "Entei", "Suicune"],
    rewardGold: 15000,
    rewardXp: 500,
    badge: "Lendário",
  },
  {
    id: "hoenn_starters",
    title: "Iniciais de Hoenn",
    category: "Regiões",
    description: "Os jovens exploradores de Littleroot Town: Treecko, Torchic e Mudkip.",
    targetNames: ["Treecko", "Torchic", "Mudkip"],
    rewardGold: 10000,
    rewardXp: 300,
    badge: "Rubi & Safira",
  },
  {
    id: "hoenn_weather",
    title: "Guardiões do Clima de Hoenn",
    category: "Lendários",
    description: "Os titãs dos Mares, da Terra e dos Céus: Kyogre, Groudon e Rayquaza.",
    targetNames: ["Kyogre", "Groudon", "Rayquaza"],
    rewardGold: 20000,
    rewardXp: 700,
    badge: "Lendário",
  },
  {
    id: "regi_titans",
    title: "Titãs Selados (Regis)",
    category: "Lendários",
    description: "Forjados na era glacial e rochosa: Regirock, Regice, Registeel e o colosso Regigigas.",
    targetNames: ["Regirock", "Regice", "Registeel", "Regigigas"],
    rewardGold: 24000,
    rewardXp: 800,
    badge: "Ancestral",
  },
  {
    id: "sinnoh_starters",
    title: "Iniciais de Sinnoh",
    category: "Regiões",
    description: "Os parceiros do Professor Rowan: Turtwig, Chimchar e Piplup.",
    targetNames: ["Turtwig", "Chimchar", "Piplup"],
    rewardGold: 12000,
    rewardXp: 350,
    badge: "Diamante & Pérola",
  },
  {
    id: "lake_guardians",
    title: "Guardiões dos Lagos de Sinnoh",
    category: "Lendários",
    description: "Espíritos da Sabedoria, Emoção e Força de Vontade: Uxie, Mesprit e Azelf.",
    targetNames: ["Uxie", "Mesprit", "Azelf"],
    rewardGold: 16000,
    rewardXp: 550,
    badge: "Espiritual",
  },
  {
    id: "sinnoh_creation",
    title: "Trio da Criação de Sinnoh",
    category: "Lendários",
    description: "Os governantes do Tempo, Espaço e Antimatéria: Dialga, Palkia e Giratina.",
    targetNames: ["Dialga", "Palkia", "Giratina"],
    rewardGold: 22000,
    rewardXp: 750,
    badge: "Estelar",
  },
  {
    id: "arceus_creator",
    title: "O Alfa & Criador Universal",
    category: "Especiais",
    description: "Reúna o Deus Arceus junto aos pilares do universo (Arceus, Dialga, Palkia e Giratina).",
    targetNames: ["Arceus", "Dialga", "Palkia", "Giratina"],
    rewardGold: 40000,
    rewardXp: 1200,
    badge: "Divino",
  },
  {
    id: "unova_starters",
    title: "Iniciais de Unova",
    category: "Regiões",
    description: "A nova geração de Nuvema Town: Snivy, Tepig e Oshawott.",
    targetNames: ["Snivy", "Tepig", "Oshawott"],
    rewardGold: 12000,
    rewardXp: 350,
    badge: "Preto & Branco",
  },
  {
    id: "unova_tao",
    title: "Dragões Tao de Unova",
    category: "Lendários",
    description: "Verdade, Ideais e o Vazio Congelado: Reshiram, Zekrom e Kyurem.",
    targetNames: ["Reshiram", "Zekrom", "Kyurem"],
    rewardGold: 25000,
    rewardXp: 850,
    badge: "Místico",
  },
  {
    id: "kalos_starters",
    title: "Iniciais de Kalos & Greninja",
    category: "Regiões",
    description: "A elite de Vaniville: Chespin, Fennekin, Froakie e o supremo Greninja.",
    targetNames: ["Chespin", "Fennekin", "Froakie", "Greninja"],
    rewardGold: 16000,
    rewardXp: 500,
    badge: "Kalosiano",
  },
  {
    id: "kalos_mortals",
    title: "Entidades da Vida & Morte",
    category: "Lendários",
    description: "O equilíbrio natural de Kalos: Xerneas (Vida), Yveltal (Destruição) e Zygarde (Equilíbrio).",
    targetNames: ["Xerneas", "Yveltal", "Zygarde"],
    rewardGold: 26000,
    rewardXp: 900,
    badge: "Aura Pura",
  },
  {
    id: "alola_stars",
    title: "Espíritos Tropicais de Alola",
    category: "Regiões",
    description: "Os companheiros das ilhas tropicais: Rowlet, Litten e Mimikyu.",
    targetNames: ["Rowlet", "Litten", "Mimikyu"],
    rewardGold: 14000,
    rewardXp: 450,
    badge: "Alola Alii",
  },
  {
    id: "alola_light",
    title: "Trio da Luz de Alola",
    category: "Lendários",
    description: "Os arautos do Sol, da Lua e do Prisma Estelar: Solgaleo, Lunala e Necrozma.",
    targetNames: ["Solgaleo", "Lunala", "Necrozma"],
    rewardGold: 28000,
    rewardXp: 950,
    badge: "Cósmico",
  },
  {
    id: "galar_heroes",
    title: "Espada & Escudo de Galar",
    category: "Lendários",
    description: "Os protetores da Noite Negra: Zacian, Zamazenta e o cataclísmico Eternatus.",
    targetNames: ["Zacian", "Zamazenta", "Eternatus"],
    rewardGold: 30000,
    rewardXp: 1000,
    badge: "Galar Heroico",
  },
  {
    id: "paldea_starters",
    title: "Iniciais de Paldea",
    category: "Regiões",
    description: "Os jovens aprendizes da Academia: Sprigatito, Fuecoco e Quaxly.",
    targetNames: ["Sprigatito", "Fuecoco", "Quaxly"],
    rewardGold: 15000,
    rewardXp: 500,
    badge: "Terastal",
  },
  {
    id: "paldea_paradox",
    title: "Dragões do Passado & Futuro",
    category: "Lendários",
    description: "Os ápices da linha temporal da Grande Cratera de Paldea: Koraidon, Miraidon e Cyclizar.",
    targetNames: ["Koraidon", "Miraidon", "Cyclizar"],
    rewardGold: 32000,
    rewardXp: 1100,
    badge: "Paradoxo",
  },
  {
    id: "eeveelutions_classic",
    title: "Eeveelutions Clássicas",
    category: "Especiais",
    description: "A evolução elementar primária: Eevee, Vaporeon, Jolteon e Flareon.",
    targetNames: ["Eevee", "Vaporeon", "Jolteon", "Flareon"],
    rewardGold: 16000,
    rewardXp: 550,
    badge: "Adaptação",
  },
  {
    id: "eeveelutions_modern",
    title: "Eeveelutions da Harmonia",
    category: "Especiais",
    description: "As evoluções espirituais e afetivas: Espeon, Umbreon, Leafeon, Glaceon e Sylveon.",
    targetNames: ["Espeon", "Umbreon", "Leafeon", "Glaceon", "Sylveon"],
    rewardGold: 25000,
    rewardXp: 850,
    badge: "Laços Puros",
  },
  {
    id: "fire_dragons",
    title: "Mestres de Chamas",
    category: "Especiais",
    description: "O poder do fogo e calor supremo: Charizard, Typhlosion e Blaziken.",
    targetNames: ["Charizard", "Typhlosion", "Blaziken"],
    rewardGold: 14000,
    rewardXp: 450,
    badge: "Fogo Puro",
  },
  {
    id: "psychic_gods",
    title: "Força Psíquica Suprema",
    category: "Especiais",
    description: "A mente e o DNA mais avançados do mundo Pokémon: Mewtwo, Mew e Alakazam.",
    targetNames: ["Mewtwo", "Mew", "Alakazam"],
    rewardGold: 25000,
    rewardXp: 850,
    badge: "Psíquico",
  },
  {
    id: "ghost_squad",
    title: "Pesadelo Noturno",
    category: "Especiais",
    description: "As assombrações mais temidas de Lavender Town: Gengar, Haunter e Gastly.",
    targetNames: ["Gengar", "Haunter", "Gastly"],
    rewardGold: 10000,
    rewardXp: 350,
    badge: "Fantasma",
  },
  {
    id: "dragon_titans",
    title: "Dragões do Panteão",
    category: "Lendários",
    description: "Os dragões mais poderosos da história: Dragonite, Salamence, Garchomp e Rayquaza.",
    targetNames: ["Dragonite", "Salamence", "Garchomp", "Rayquaza"],
    rewardGold: 30000,
    rewardXp: 950,
    badge: "Supremo",
  },
];

export const albumController = new Elysia({}).group("/albums", (app) => {
  return app
    .decorate("prisma", prisma)
    .decorate("user", {} as User)
    .use(jwt)
    .onBeforeHandle(getUserUserMiddleware as any)
    .get("/", async ({ user, prisma }) => {
      // Get all cards owned by the authenticated user
      const userCards = await prisma.cards_user.findMany({
        where: { userId: user.id },
        include: {
          Card: true,
        },
      });

      // Get all claimed albums by this user
      const claims = await prisma.transaction.findMany({
        where: {
          user_id: user.id,
          idempotencyKey: { startsWith: `album_claim_${user.id}_` },
          status: "COMPLETED",
        },
      });
      const claimedAlbumIds = new Set(
        claims.map((c) => c.idempotencyKey.replace(`album_claim_${user.id}_`, ""))
      );

      // Pre-fetch sample cards from database for the target names
      const allTargetNames = Array.from(
        new Set(OFFICIAL_ALBUMS.flatMap((a) => a.targetNames))
      );
      
      const referenceCards = await prisma.card.findMany({
        where: {
          OR: allTargetNames.map((name) => ({
            name: { contains: name, mode: "insensitive" as const },
          })),
        },
      });

      const albumsWithProgress = OFFICIAL_ALBUMS.map((album) => {
        const isClaimed = claimedAlbumIds.has(album.id);

        const cardSlots = album.targetNames.map((targetName) => {
          // Check if user owns any card matching targetName strictly
          const ownedMatch = userCards.find((uc) =>
            matchesPokemonName(uc.Card.name, targetName)
          );

          // Sample card info for preview/silhouette
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
        return errorResponse("Recompensa já coletada.", "Você já coletou a recompensa deste álbum.");
      }

      // Check user cards to ensure 100% completion
      const userCards = await prisma.cards_user.findMany({
        where: { userId: user.id },
        include: { Card: true },
      });

      const hasAllCards = albumDef.targetNames.every((targetName) =>
        userCards.some((uc) =>
          matchesPokemonName(uc.Card.name, targetName)
        )
      );

      if (!hasAllCards) {
        set.status = 400;
        return errorResponse("Álbum incompleto.", "Você ainda não possui todas as cartas necessárias deste álbum.");
      }

      // Atomic transaction: credit money + rarityPoints, record claim
      await prisma.$transaction([
        prisma.user.update({
          where: { id: user.id },
          data: {
            money: { increment: albumDef.rewardGold },
            rarityPoints: { increment: albumDef.rewardXp },
          },
        }),
        prisma.transaction.create({
          data: {
            idempotencyKey,
            status: "COMPLETED",
            user_id: user.id,
          },
        }),
      ]);

      return sucessResponse(
        {
          rewardGold: albumDef.rewardGold,
          rewardXp: albumDef.rewardXp,
          albumId: albumDef.id,
          albumTitle: albumDef.title,
        },
        `Parabéns! Álbum "${albumDef.title}" resgatado com sucesso! (+${albumDef.rewardGold} Moedas, +${albumDef.rewardXp} XP)`
      );
    });
});
