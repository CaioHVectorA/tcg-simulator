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
          // Check if user owns any card containing targetName
          const ownedMatch = userCards.find((uc) =>
            uc.Card.name.toLowerCase().includes(targetName.toLowerCase())
          );

          // Sample card info for preview/silhouette
          const sampleCard =
            referenceCards.find((rc) =>
              rc.name.toLowerCase().includes(targetName.toLowerCase())
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
          uc.Card.name.toLowerCase().includes(targetName.toLowerCase())
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
