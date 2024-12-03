import { PrismaClient, type Package } from "@prisma/client";
import TCGDex, { type Card } from "@tcgdex/sdk";
const prisma = new PrismaClient();
const tcg = new TCGDex("pt");
const data = [
  {
    name: "Pacote simples",
    price: 100,
    common_rarity: 0.5,
    rare_rarity: 0.3,
    epic_rarity: 0.15,
    legendary_rarity: 0.05,
    full_legendary_rarity: 0.01,
    image_url: "https://via.placeholder.com/150",
    cards_quantity: 8,
    id: 1,
  },
  {
    name: "Pacote raro",
    price: 200,
    common_rarity: 0.3,
    rare_rarity: 0.4,
    epic_rarity: 0.2,
    legendary_rarity: 0.08,
    full_legendary_rarity: 0.02,
    image_url: "https://via.placeholder.com/150",
    cards_quantity: 8,
    id: 2,
  },
  {
    name: "Grande pacote",
    price: 400,
    cards_quantity: 16,
    id: 3,
    common_rarity: 0.4,
    rare_rarity: 0.4,
    epic_rarity: 0.1,
    legendary_rarity: 0.05,
    full_legendary_rarity: 0.05,
    image_url: "https://via.placeholder.com/150",
  },
  {
    name: "Pacote épicos",
    price: 2000,
    cards_quantity: 3,
    id: 4,
    common_rarity: 0.1,
    rare_rarity: 0.2,
    epic_rarity: 0.4,
    legendary_rarity: 0.2,
    full_legendary_rarity: 0.1,
    image_url: "https://via.placeholder.com/150",
  },
  {
    name: "Pacote lendário",
    price: 5000,
    cards_quantity: 1,
    id: 5,
    common_rarity: 0.05,
    rare_rarity: 0.1,
    epic_rarity: 0.2,
    legendary_rarity: 0.4,
    full_legendary_rarity: 0.25,
    image_url: "https://via.placeholder.com/150",
  },
  {
    name: "Pacote tudo ou nada",
    price: 10000,
    cards_quantity: 1,
    id: 6,
    common_rarity: 0.01,
    rare_rarity: 0.02,
    epic_rarity: 0.05,
    legendary_rarity: 0.1,
    full_legendary_rarity: 0.82,
    image_url: "https://via.placeholder.com/150",
  },
  {
    name: "Grande pacote épico",
    price: 10000,
    cards_quantity: 24,
    id: 7,
    common_rarity: 0.1,
    rare_rarity: 0.1,
    epic_rarity: 0.5,
    legendary_rarity: 0.15,
    full_legendary_rarity: 0.05,
    image_url: "https://via.placeholder.com/150",
  },
] as Package[];
async function seedPackages() {
  await prisma.package.deleteMany();
  for (const packageData of data) {
    await prisma.package.create({
      data: packageData,
    });
  }
  const sets = await tcg.fetchSets();
  if (!sets) return console.error("Error fetching sets");
  for (const set of sets) {
    if (!set.logo) continue;
    await prisma.package.create({
      data: {
        tcg_id: set.id,
        image_url: set.logo,
        name: set.name,
        common_rarity: 0.5,
        rare_rarity: 0.3,
        epic_rarity: 0.15,
        legendary_rarity: 0.04,
        full_legendary_rarity: 0.02,
        cards_quantity: 8,
        price: 100,
      },
    });
  }
  console.log("Packages seeded");
  prisma.$disconnect();
}

seedPackages();
