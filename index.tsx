import { html } from "@elysiajs/html";
import { PrismaClient } from "@prisma/client";
import { Elysia } from "elysia";
const prisma = new PrismaClient()
new Elysia({})
  .use(html())
  .get("/hello", () => {
    return "Hello World!";
  })
  .get("/cards", async () => {
    const cards = await prisma.card.findMany({ where: { rarity: { in: [5] } } })
    return `
    <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Cards</title>
        </head>
        <body>
            <h1>Cards</h1>
            <div>
                <ul>
                ${cards.map(card => (
                    `<li>
                        <h2>${card.name} ${card.rarity}</h2>
                        <img src="${card.image_url+'/low.webp'}" alt="${card.name}" />
                    </li>`
                ))}
                </ul>
            </div>
        </body>
    `
  })
  .listen(3000);

  console.log("Server running on http://localhost:3000");