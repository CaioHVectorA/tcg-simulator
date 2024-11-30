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
        const ranking = await prisma.user_Ranking.findUnique({ where: { user_id: user.id } })
        const topCards = (await prisma.card.findMany({ take: 3, orderBy: { rarity: 'desc' }, where: {
            Cards_user: {
                some: {
                    userId: user.id
                }
            },
        
        }, select: {
                Cards_user: { select: { Card: { select: {  image_url: true } } } }
        } })).map(card => card.Cards_user[0].Card.image_url)
        const count = await prisma.user.count()
        console.log({ ranking })
        const data = { banners, ranking: {
            count,
            position: Number(ranking?.position || count + 1),
            total_rarity: Number(ranking?.total_rarity || 0)
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