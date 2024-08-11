import { PrismaClient } from "@prisma/client";
import { Worker } from 'worker_threads'
import TCGdex, { type Card, type SetResume } from "@tcgdex/sdk";
const prisma = new PrismaClient();
function normalizeRange(min: number, max: number, value: number) {
    return Math.ceil((value - min) / (max - min) * 4)
}
async function main() {
    const tcg = new TCGdex('pt');
    const index = await prisma.card.count()
    const cards = (await tcg.fetchCards())?.filter(card => card.image !== undefined)
    console.log(cards?.length)
    if (!cards) return
    for await (const card of cards.slice(index)) {
        console.log('Iniciou os loops!')
        let card_detailed: Card<SetResume> | undefined
        try {
            card_detailed = await (await fetch(`https://api.tcgdex.net/v2/pt/cards/${card.id}`)).json()
            console.log('Fetchou carta')
        } catch (e) {
            console.error('Error fetching card', e)
            continue
        }
        try {

            const alreadyExists = await prisma.card.findFirst({ where: { card_id: card.id } })
            if (alreadyExists) continue
            console.log('Não existe!')
            // todo: think about to handle not pokemon cards
            if (!card_detailed || !card_detailed.hp || !card.image) continue
            console.log('Passou as verificações!')
            // rarity is 1 to 4
            const rarity = normalizeRange(0, 300, card_detailed.hp)
            console.log('Raridade:', rarity)
            await prisma.card.create({
                data: {
                    image_url: card.image,
                    rarity,
                    card_id: card.id,
                    name: card.name,
                }
            })
            console.log('Criou carta!')
        } catch (e) {
            console.error('Error creating card', e)
            continue;
        }
    console.log('Seed done!')
    }
}

main()
