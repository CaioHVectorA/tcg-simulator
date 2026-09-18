import Elysia, { t } from "elysia";
import { getUserUserMiddleware } from "../middlewares/jwt";
import { prisma } from "../helpers/prisma.client";
import { jwt } from "../middlewares/jwt/jwt";
import type { User, Card } from "@prisma/client";
import { errorResponse, sucessResponse } from "../lib/mount-response";

const baseResponse = t.Object({
  ok: t.Boolean(),
  toast: t.Union([t.String(), t.Null()]),
  error: t.Union([t.String(), t.Null()]),
  data: t.Any(),
});

interface AreaDefinition {
  id: number;
  name: string;
  region: string;
  description: string;
  requiredLevel: number;
  typeTheme: string;
  accentColor: string;
  imageUrl: string;
  cardTypes: string[];
  baseRewardCoins: number;
}

export const AREAS_CONFIG: AreaDefinition[] = [
  {
    id: 1,
    name: "Planície de Pallet",
    region: "Kanto",
    description: "Campos verdejantes onde jovens treinadores iniciam sua jornada colecionando Pokémon das espécies comuns e iniciais.",
    requiredLevel: 1,
    typeTheme: "GRASS / NORMAL",
    accentColor: "#10b981",
    imageUrl: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800&auto=format&fit=crop&q=80",
    cardTypes: ["GRASS", "NORMAL"],
    baseRewardCoins: 120,
  },
  {
    id: 2,
    name: "Floresta de Viridian",
    region: "Kanto",
    description: "Uma densa floresta repleta de copas fechadas, habitat natural de insetos raros e Pokémon elétricos faiscantes.",
    requiredLevel: 3,
    typeTheme: "BUG / ELECTRIC",
    accentColor: "#eab308",
    imageUrl: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&auto=format&fit=crop&q=80",
    cardTypes: ["GRASS", "ELECTRIC"],
    baseRewardCoins: 250,
  },
  {
    id: 3,
    name: "Cavernas de Mt. Moon",
    region: "Kanto",
    description: "Labirinto subterrâneo esculpido em rochas antigas com fósseis e pedras lunares energéticas.",
    requiredLevel: 6,
    typeTheme: "ROCK / FIGHTING",
    accentColor: "#f97316",
    imageUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80",
    cardTypes: ["FIGHTING", "PSYCHIC"],
    baseRewardCoins: 450,
  },
  {
    id: 4,
    name: "Baía de Cerulean",
    region: "Kanto",
    description: "Águas cristalinas e recifes oceânicos onde habitam poderosas criaturas marinhas e cartas temáticas de gelo.",
    requiredLevel: 9,
    typeTheme: "WATER",
    accentColor: "#06b6d4",
    imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop&q=80",
    cardTypes: ["WATER"],
    baseRewardCoins: 750,
  },
  {
    id: 5,
    name: "Vulcão de Cinnabar",
    region: "Kanto",
    description: "Caldeira vulcânica ativa e tempestades de fogo onde se encontram dragões temíveis e cartas épicas incandescentes.",
    requiredLevel: 12,
    typeTheme: "FIRE / DRAGON",
    accentColor: "#ef4444",
    imageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80",
    cardTypes: ["FIRE", "DRAGON"],
    baseRewardCoins: 1200,
  },
  {
    id: 6,
    name: "Planalto Índigo (Santuário)",
    region: "Kanto / Johto",
    description: "O ápice dos campeões. Território sagrado onde apenas mestres de alto calibre conseguem invocar Pokémon lendários.",
    requiredLevel: 15,
    typeTheme: "LEGENDARY / PSYCHIC",
    accentColor: "#8b5cf6",
    imageUrl: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&auto=format&fit=crop&q=80",
    cardTypes: ["PSYCHIC", "DRAGON"],
    baseRewardCoins: 2000,
  },
];

// Cache em memória para rastrear explorações diárias por usuário e área
// Chave: `explore-${userId}-${areaId}-${YYYY-MM-DD}`
const explorationCache = new Set<string>();

function getTodayKey(userId: number, areaId: number): string {
  const today = new Date().toISOString().slice(0, 10);
  return `explore-${userId}-${areaId}-${today}`;
}

export const areaController = new Elysia({}).group("/areas", (app) => {
  return app
    .use(jwt)
    .decorate("prisma", prisma)
    .decorate("user", {} as User)
    .onBeforeHandle(getUserUserMiddleware as any)
    .get(
      "/",
      async ({ user, prisma }) => {
        // Calcular nível atual do treinador
        const xp = Number(user.rarityPoints || 0) * 10 + Math.floor(Number(user.totalBudget || 0) / 10);
        const userLevel = Math.max(1, Math.floor(Math.sqrt(xp / 100)) + 1);

        const areasWithStatus = AREAS_CONFIG.map((area) => {
          const unlocked = userLevel >= area.requiredLevel;
          const exploredToday = explorationCache.has(getTodayKey(user.id, area.id));

          return {
            ...area,
            unlocked,
            exploredToday,
            levelDifference: Math.max(0, area.requiredLevel - userLevel),
          };
        });

        return sucessResponse({
          userLevel,
          xp,
          areas: areasWithStatus,
        });
      },
      {
        detail: { tags: ["Areas"], description: "Lista todas as áreas e status de exploração do usuário" },
        response: baseResponse,
      }
    )
    .post(
      "/explore/:areaId",
      async ({ user, prisma, params, set }) => {
        const areaId = Number(params.areaId);
        const area = AREAS_CONFIG.find((a) => a.id === areaId);

        if (!area) {
          set.status = 404;
          return errorResponse("Área não encontrada", "Área não encontrada");
        }

        const xp = Number(user.rarityPoints || 0) * 10 + Math.floor(Number(user.totalBudget || 0) / 10);
        const userLevel = Math.max(1, Math.floor(Math.sqrt(xp / 100)) + 1);

        if (userLevel < area.requiredLevel) {
          set.status = 403;
          return errorResponse(
            `Você precisa atingir o Nível ${area.requiredLevel} para explorar esta área!`,
            `Nível insuficiente (${userLevel}/${area.requiredLevel})`
          );
        }

        const key = getTodayKey(user.id, area.id);
        if (explorationCache.has(key)) {
          set.status = 400;
          return errorResponse(
            "Você já realizou a expedição diária nesta área hoje. Volte amanhã!",
            "Expedição diária já realizada"
          );
        }

        // Sortear carta selvagem temática da área
        const availableCards = await prisma.card.findMany({
          where: {
            OR: area.cardTypes.map((type) => ({ type: { contains: type, mode: "insensitive" } })),
          },
          take: 50,
        });

        let foundCard: Card | null = null;
        if (availableCards.length > 0) {
          const randIndex = Math.floor(Math.random() * availableCards.length);
          foundCard = availableCards[randIndex];
        }

        // Bônus de moedas com variação de até +50%
        const coinBonus = Math.floor(area.baseRewardCoins * (1 + Math.random() * 0.5));

        // Transação atômica
        const transactionOps: any[] = [
          prisma.user.update({
            where: { id: user.id },
            data: {
              money: { increment: coinBonus },
              totalBudget: { increment: coinBonus },
              rarityPoints: { increment: foundCard ? foundCard.rarity : 0 },
            },
          }),
        ];

        if (foundCard) {
          transactionOps.push(
            prisma.cards_user.create({
              data: {
                userId: user.id,
                cardId: foundCard.id,
              },
            })
          );
        }

        await prisma.$transaction(transactionOps);
        explorationCache.add(key);

        return sucessResponse(
          {
            areaName: area.name,
            coins: coinBonus,
            card: foundCard,
          },
          `Expedição concluída em ${area.name}! Você resgatou ${coinBonus} moedas e ${foundCard ? foundCard.name : "suprimentos"}!`
        );
      },
      {
        detail: { tags: ["Areas"], description: "Realiza a expedição diária em uma área desbloqueada" },
        response: baseResponse,
      }
    );
});
