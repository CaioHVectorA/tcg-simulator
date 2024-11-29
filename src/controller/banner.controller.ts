import Elysia, { t } from "elysia"
import { prisma } from "../helpers/prisma.client"
import { storeImg } from "../lib/store-img"
import { jwt } from "../middlewares/jwt/jwt"
import { getUserInterceptor } from "../middlewares/jwt"


export const bannerController = new Elysia({}).group("/banner", (app) => {
    return app
    .decorate("prisma", prisma)
    .get("/", async ({ prisma }) => {
        const banners = await prisma.banner.findMany()
        return {
            ok: true,
            data: banners,
            toast: null,
            error: null
        }
    })
    .use(jwt)
    .derive(getUserInterceptor)
    .post("/", async ({ body, prisma, jwt, user, set }) => {
        console.log(user)
        if (!user || !user.isAdmin) {
            set.status = 401;
            return {
              ok: false,
              toast: "Não autorizado",
              error: "Não autorizado",
              data: null
            };
          }
        const banner = await prisma.banner.create({ data: {
            description: body.description,
            title: body.title,
            active: Boolean(Number(body.active)) ?? false
        } })
        const storePath = await storeImg(banner.id, "/banners/", body.image)
        await prisma.banner.update({ where: { id: banner.id }, data: { image_url: storePath } })
        return {
            ok: true,
            data: null,
            toast: "Banner criado com sucesso",
            error: null
        }
    }, { body: t.Object({ title: t.String(), description: t.String(), image: t.File(), active: t.Optional(t.String()) }),  })
    .patch("/:id", async ({ params, body, prisma, jwt, user, set }) => {
        if (!user || !user.isAdmin) {
            set.status = 401;
            return {
              ok: false,
              toast: "Não autorizado",
              error: "Não autorizado",
              data: null
            };
          }
        const banner = await prisma.banner.findUnique({ where: { id: Number(params.id) } })
        if (!banner) {
            set.status = 404;
            return {
                ok: false,
                toast: "Banner não encontrado",
                error: "Banner não encontrado",
                data: null
            }
        }
        await prisma.banner.update({ where: { id: banner.id }, data: {
            description: body.description,
            title: body.title,
        } })
        if (body.image) {
            const storePath = await storeImg(banner.id, "/banners/", body.image)
            await prisma.banner.update({ where: { id: banner.id }, data: { image_url: storePath } })
        }
        return {
            ok: true,
            data: null,
            toast: "Banner atualizado com sucesso",
            error: null
        }
    }, { body: t.Object({ title: t.String(), description: t.String(), image: t.File(), active: t.Optional(t.Boolean()) }),  })
})