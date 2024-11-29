import Elysia from "elysia"
import { prisma } from "../helpers/prisma.client"
import { jwt } from "../middlewares/jwt/jwt"
import { getUserInterceptor } from "../middlewares/jwt"

export const homeController = new Elysia({}).group("/home", (app) => {
    return app
    .decorate("prisma", prisma)
    .use(jwt)
    .derive(getUserInterceptor)
    .get('/', async ({ user, set }) => {
        if (!user) {
            set.status = 401
            return {
                ok: false,
                data: null,
                toast: "Não autorizado",
                error: "Não autorizado"
            }
        }
        const banners = await prisma.banner.findMany({ where: { active: true } })
        const ranking = await prisma.$queryRaw`
        SELECT 
            ranking.position,
            ranking.id,
            ranking.username,
            ranking.total_rarity
        FROM (
            SELECT 
                u.id,
                u.username,
                COALESCE(SUM(c.rarity), 0) AS total_rarity,
                ROW_NUMBER() OVER (ORDER BY COALESCE(SUM(c.rarity), 0) DESC, u.id ASC) AS position
            FROM users u
            LEFT JOIN cards_user cu ON u.id = cu.userId
            LEFT JOIN cards c ON cu.cardId = c.id
            WHERE u.id = ${user.id}
            GROUP BY u.id, u.username
        ) AS ranking` as [Ranking]
        const topCards = await prisma.card.findMany({ take: 3, orderBy: { rarity: 'desc' }, where: {
            Cards_user: {
                some: {
                    userId: user.id
                }
            }
        } })
        console.log({ ranking })
        const data = { banners, ranking: {
            ...ranking[0],
            position: Number(ranking[0].position),
            total_rarity: Number(ranking[0].total_rarity)
        }, topCards }
        console.log(data)
        return {
            ok: true,
            data,
            toast: null,
            error: null
        }
    })
})