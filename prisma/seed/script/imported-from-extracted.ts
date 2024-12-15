import { Prisma, PrismaClient } from "@prisma/client";
import fs from "fs/promises";
async function store() {
  const prisma = new PrismaClient();
  await prisma.$connect();
  await prisma.card.deleteMany();
  console.time("store");
  const data = await fs.readFile(
    process.cwd() + "/prisma/data" + "/cards.json",
    "utf-8"
  );
  if (!data) throw new Error("No data found");
  const cards = JSON.parse(data);
  for (const card of cards) {
    await prisma.card.create({
      data: card,
    });
  }
  console.timeEnd("store");
}

store();
