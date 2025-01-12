import TCGdex from "@tcgdex/sdk";
import { prisma } from "../../src/helpers/prisma.client";
const tcg = new TCGdex("pt");
const map_types = {
  Água: "WATER",
  Planta: "GRASS",
  Fogo: "FIRE",
  Psíquico: "PSYCHIC",
  Incolor: "NORMAL",
  Elétrico: "ELECTRIC",
  Sombrio: "DARK",
  Dragão: "DRAGON",
  Fada: "FAIRY",
  Lutador: "FIGHTING",
  Metal: "METAL",
};
async function main() {
  const cards = await prisma.card.findMany();
  let count = 0;
  for (const card of cards) {
    if (card.hp !== 0 && card.type !== "none") {
      count++;
      console.log(`Skipped ${count}/${cards.length} cards...`);
      continue;
    }
    const cardFound = await tcg.fetchCard(card.card_id);
    if (!cardFound) continue;
    const hp = cardFound.hp;
    const type = cardFound?.types?.[0];
    if (!hp || !type) continue;
    await prisma.card.update({
      where: { id: card.id },
      data: {
        hp,
        type: map_types[type as keyof typeof map_types] || "none",
      },
    });
    count++;
    if (count % 10 === 0) {
      console.log(`Updated ${count}/${cards.length} cards...`);
    }
  }
  await prisma.card.deleteMany({
    where: {
      type: "none",
    },
  });
}

main();
