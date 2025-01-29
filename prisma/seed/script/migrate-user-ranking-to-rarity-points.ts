import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany({
    include: {
      User_Ranking: true,
    },
  });
  const promises = users.map((user) => {
    const rarityPoints = user.User_Ranking?.total_rarity ?? 0;
    return prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        rarityPoints,
      },
    });
  });

  await Promise.all(promises);

  console.log("Migration completed");
}

main();
