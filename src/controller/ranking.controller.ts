import Elysia, { t } from "elysia";
import { prisma } from "../helpers/prisma.client";

export const rankingController = new Elysia({}).group('/ranking', (app) => {
    return app.get('/', async ({ query }) => {
        const { page } = query
        const limit = 10
        const offset = (parseInt(page ?? '1') - 1) * limit
        const ranking = await prisma.user_Ranking.findMany({
            take: Number(limit ?? 10),
            skip: Number(offset ?? 0),
            orderBy: {
                position: 'asc'
            },
            select: {
                total_rarity: true,
                position: true,
               user: {
                select: {
                    username: true,
                    picture: true,
                    id: true
                } 
               } 
            }
        })
        return ranking
    }, {
        query: t.Object({
            page: t.Optional(t.String()),
        })
    })
})