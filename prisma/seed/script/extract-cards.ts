import { Prisma, PrismaClient } from "@prisma/client";
import fs from 'fs/promises'
async function extract() {
    const prisma = new PrismaClient()
    const cards = await prisma.card.findMany()
    await fs.writeFile(process.cwd()+'/prisma/data'+'/cards.json', JSON.stringify(cards, null, 2))
}

extract()