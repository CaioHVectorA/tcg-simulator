import { PrismaClient } from "@prisma/client";
import { Worker } from "worker_threads";
import TCGdex, { type Card, type SetResume } from "@tcgdex/sdk";
const prisma = new PrismaClient();
const rarityMap = {
  "ACE SPEC Rare": 5,
  "Amazing Rare": 5,
  "Classic Collection": 4,
  Common: 1,
  Crown: 5,
  "Double rare": 4,
  "Four Diamond": 4,
  "Full Art Trainer": 4,
  "Holo Rare": 3,
  "Holo Rare V": 4,
  "Holo Rare VMAX": 5,
  "Holo Rare VSTAR": 5,
  "Hyper rare": 5,
  "Illustration rare": 5,
  LEGEND: 5,
  None: 1,
  "One Diamond": 2,
  "One Star": 2,
  "Radiant Rare": 5,
  Rare: 2,
  "Rare Holo": 3,
  "Rare Holo LV.X": 4,
  "Rare PRIME": 4,
  "Secret Rare": 5,
  "Shiny Ultra Rare": 5,
  "Shiny rare": 4,
  "Shiny rare V": 4,
  "Shiny rare VMAX": 5,
  "Special illustration rare": 5,
  "Three Diamond": 4,
  "Three Star": 4,
  "Two Diamond": 3,
  "Two Star": 3,
  "Ultra Rare": 5,
  Uncommon: 2,
};

function normalizeRange(min: number, max: number, value: number) {
  return Math.ceil(((value - min) / (max - min)) * 4);
}

async function main() {
  const tcg = new TCGdex("pt");
  const index = await prisma.card.count();
  let count = index;
  const cards = (await tcg.fetchCards())?.filter(
    (card) => card.image !== undefined
  );
  if (!cards) return;
  console.log("Iniciou os loops!");
  for await (const card of cards.slice(index)) {
    let card_detailed: Card<SetResume> | undefined;
    if (count % 10 === 0) {
      console.log(`Inserted ${count}/${cards.length} cards...`);
    }
    try {
      card_detailed = await (
        await fetch(`https://api.tcgdex.net/v2/pt/cards/${card.id}`)
      ).json();
    } catch (e) {
      console.error("Error fetching card", e);
      continue;
    }
    try {
      const alreadyExists = await prisma.card.findFirst({
        where: { card_id: card.id },
      });
      if (alreadyExists) continue;
      // todo: think about to handle not pokemon cards
      if (!card_detailed || !card_detailed.hp || !card.image) continue;
      // rarity is 1 to 5 based on rarityMap
      const rarity =
        rarityMap[card_detailed.rarity as keyof typeof rarityMap] ||
        normalizeRange(0, 300, card_detailed.hp);
      await prisma.card.create({
        data: {
          image_url: card.image,
          rarity,
          card_id: card.id,
          name: card.name,
        },
      });
      count++;
    } catch (e) {
      console.error("Error creating card", e);
      continue;
    }
  }
  console.log("Seed done!");
}

main();
