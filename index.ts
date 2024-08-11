import Tcgdex from '@tcgdex/sdk'
import { Database } from 'bun:sqlite'
const tcg = new Tcgdex('pt');

(async () => {
    console.time('fetchCards')
    const cards = (await tcg.fetchCards())?.map(card => card.image)
    // console.log(cards?.map)

    console.timeEnd('fetchCards')
})()