// model Package {
//     price                 Int
//     id                    Int             @id @default(autoincrement())
//     common_rarity         Float
//     rare_rarity           Float
//     epic_rarity           Float
//     legendary_rarity      Float
//     full_legendary_rarity Float
//     name                  String
//     image_url             String
//     cards_quantity        Int
//     Packages_User         Packages_User[]

import type { Card, Package, PrismaClient } from "@prisma/client";

//     @@map("packages")
//   }
const mapRarity = {
  common: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
  full_legendary: 5,
};
export async function OpenPackage(
  pkg: Package,
  prisma: PrismaClient
): Promise<Card[]> {
  const cards: Card[] = [];

  // Carregar todas as cartas possíveis do pacote em uma única consulta
  const handleTcgId = pkg.tcg_id ? { startsWith: pkg.tcg_id } : undefined;
  const allCards = await prisma.card.findMany({
    where: { card_id: handleTcgId },
  });

  // Agrupar cartas por raridade
  const cardsByRarity = allCards.reduce<Record<string, Card[]>>((acc, card) => {
    const rarity = Object.keys(mapRarity).find(
      (key) => mapRarity[key] === card.rarity
    );
    if (rarity) {
      acc[rarity] = acc[rarity] || [];
      acc[rarity].push(card);
    }
    return acc;
  }, {});

  // Função para calcular a raridade com base nas probabilidades
  function getRarity(): keyof typeof mapRarity {
    const getted = Math.random();
    if (getted <= pkg.common_rarity) return "common";
    if (getted <= pkg.rare_rarity) return "rare";
    if (getted <= pkg.epic_rarity) return "epic";
    if (getted <= pkg.legendary_rarity) return "legendary";
    if (getted <= pkg.full_legendary_rarity) return "full_legendary";
    return "common"; // Fallback
  }

  // Iterar sobre a quantidade de cartas e selecionar
  for (let i = 0; i < pkg.cards_quantity; i++) {
    const rarity = getRarity();
    const pool = cardsByRarity[rarity] || [];
    if (pool.length === 0) continue;

    // Selecionar carta aleatória do pool
    const randomIndex = Math.floor(Math.random() * pool.length);
    const card = pool[randomIndex];
    cards.push(card);
  }

  return cards;
}
