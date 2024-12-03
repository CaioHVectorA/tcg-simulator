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
  const cards = [] as Card[];
  for await (const card of Array.from(
    { length: pkg.cards_quantity },
    (_, i) => i
  )) {
    let rarity: keyof typeof mapRarity = "common";
    const getted = Math.random();
    console.log({ getted });
    if (getted <= pkg.common_rarity) rarity = "common";
    else if (getted <= pkg.rare_rarity) rarity = "rare";
    else if (getted <= pkg.epic_rarity) rarity = "epic";
    else if (getted <= pkg.legendary_rarity) rarity = "legendary";
    else if (getted <= pkg.full_legendary_rarity) rarity = "full_legendary";
    console.log(
      "Raridade: ",
      rarity,
      pkg[(rarity + "_rarity") as keyof Package]
    );
    const handleTcgId = pkg.tcg_id ? { startsWith: pkg.tcg_id } : undefined;
    const count = await prisma.card.count({
      where: {
        rarity: mapRarity[rarity],
        card_id: handleTcgId,
      },
    });
    const random = Math.floor(Math.random() * count);
    const card_ = await prisma.card.findFirst({
      where: { rarity: mapRarity[rarity] },
      skip: random,
    });
    console.log("Carta: ", card_?.name);
    if (!card_) continue;
    cards.push(card_);
  }
  return cards;
}
