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
    description: "Pacote comum com 8 cartas",
    epic_rarity: 0.15,
    legendary_rarity: 0.05,
    full_legendary_rarity: 0.01,
    image_url: "https://via.placeholder.com/150",
    cards_quantity: 8,
  },
  {
    name: "Pacote raro",
    description: "Pacote com 8, mais chance de vir raras!",
    price: 200,
    common_rarity: 0.3,
    rare_rarity: 0.4,
    epic_rarity: 0.2,
    legendary_rarity: 0.08,
    full_legendary_rarity: 0.02,
    image_url: "https://via.placeholder.com/150",
    cards_quantity: 8,
  },
  {
    name: "Grande pacote",
    price: 600,
    cards_quantity: 16,
    common_rarity: 0.25,
    description: "Pacote com 16 cartas! Tá mais pra pacotão!",
    rare_rarity: 0.25,
    epic_rarity: 0.2,
    legendary_rarity: 0.2,
    full_legendary_rarity: 0.1,
    image_url: "https://via.placeholder.com/150",
  },
  {
    name: "Pacote épicos",
    price: 2000,
    description: "Pacote com 3 cartas, mas grandes chances de vir épicas!",
    cards_quantity: 3,
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
    common_rarity: 0.05,
    description:
      "Há apenas uma carta, mas ela tem altas chances de ser uma lendária!",
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
    common_rarity: 0.01,
    rare_rarity: 0.02,
    description:
      "Pra quem gosta de viver perigosamente! Uma carta, mas pode ser a Carta...",
    epic_rarity: 0.05,
    legendary_rarity: 0.1,
    full_legendary_rarity: 0.82,
    image_url: "https://via.placeholder.com/150",
  },
  {
    name: "Grande pacote épico",
    price: 10000,
    cards_quantity: 24,
    common_rarity: 0.1,
    rare_rarity: 0.1,
    epic_rarity: 0.5,
    description:
      "Pra quem não se contenta com pouco! 24 cartas, várias épicas!",
    legendary_rarity: 0.15,
    full_legendary_rarity: 0.05,
    image_url: "https://via.placeholder.com/150",
  },
] as Package[];
async function seedPackages() {
  await prisma.package.deleteMany();
  let index = 0;
  for (const packageData of data) {
    index++;
    await prisma.package.create({
      data: {
        ...packageData,
        // id: index,
      },
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
        common_rarity: 0.2,
        // id: index,
        rare_rarity: 0.2,
        epic_rarity: 0.2,
        legendary_rarity: 0.25,
        full_legendary_rarity: 0.15,
        cards_quantity: 10,
        price: 600,
      },
    });
    index++;
  }
  console.log("Packages seeded");
  prisma.$disconnect();
}

seedPackages();
