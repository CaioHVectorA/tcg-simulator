import type {
  Card,
  Package,
  Packages_User,
  PrismaClient,
} from "@prisma/client";
import {} from "@elysiajs/stream";
import { cache } from "./cache";
const mapRarity = {
  common: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
  full_legendary: 5,
};
export function getRandomCardFromPackage(
  pkg: Package,
  cardsByRarity: Record<string, Card[]>
): Card | null {
  function getRarity(): keyof typeof mapRarity {
    const weights: { key: keyof typeof mapRarity; weight: number }[] = [
      { key: "full_legendary", weight: pkg.full_legendary_rarity ?? 0.01 },
      { key: "legendary", weight: pkg.legendary_rarity ?? 0.04 },
      { key: "epic", weight: pkg.epic_rarity ?? 0.15 },
      { key: "rare", weight: pkg.rare_rarity ?? 0.30 },
      { key: "common", weight: pkg.common_rarity ?? 0.50 },
    ];

    const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
    if (totalWeight <= 0) return "common";

    let rand = Math.random() * totalWeight;

    for (const item of weights) {
      if (rand <= item.weight) {
        return item.key;
      }
      rand -= item.weight;
    }

    return "common";
  }

  const rarity = getRarity();
  const requestedPool = cardsByRarity[rarity];
  const pool =
    requestedPool && requestedPool.length > 0
      ? requestedPool
      : cardsByRarity["common"] && cardsByRarity["common"].length > 0
      ? cardsByRarity["common"]
      : Object.values(cardsByRarity).find((p) => p && p.length > 0) || [];

  if (pool.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
}

export async function getByRarityCluster({
  pkg,
  prisma,
}: {
  pkg: Package;
  prisma: PrismaClient;
}) {
  const handleTcgId = pkg.tcg_id ? { startsWith: pkg.tcg_id } : undefined;
  let allCards: Card[] = [];
  if (pkg.tcg_id && cache.get(pkg.tcg_id)) {
    allCards = cache.get(pkg.tcg_id) as Card[];
  } else if (!pkg.tcg_id && cache.get("all")) {
    allCards = cache.get("all") as Card[];
  } else {
    allCards = await prisma.card.findMany({
      where: { card_id: handleTcgId },
    });
    if (pkg.tcg_id) {
      cache.set(pkg.tcg_id, allCards);
    } else {
      cache.set("all", allCards);
    }
  }

  const cardsByRarity = allCards.reduce<Record<string, Card[]>>((acc, card) => {
    const rarity = Object.keys(mapRarity).find(
      //@ts-ignore
      (key) => mapRarity[key] === card.rarity
    );
    if (rarity) {
      acc[rarity] = acc[rarity] || [];
      acc[rarity].push(card);
    }
    return acc;
  }, {});
  return cardsByRarity;
}

export async function OpenPackage(
  pkg: Package,
  prisma: PrismaClient
): Promise<Card[]> {
  const cards: Card[] = [];
  const cardsByRarity = await getByRarityCluster({ pkg, prisma });

  for (let i = 0; i < pkg.cards_quantity; i++) {
    const card = getRandomCardFromPackage(pkg, cardsByRarity);
    if (card) {
      cards.push(card);
    }
  }

  return cards;
}

export async function* OpenPackageStreamingHandle(
  pkg: Package,
  qtd: number,
  prisma: PrismaClient
) {
  yield "start";
  await new Promise((resolve) => setTimeout(resolve, 1000));
  yield "loading";
  await new Promise((resolve) => setTimeout(resolve, 1000));
  yield "end";
}
