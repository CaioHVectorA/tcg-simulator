import Elysia, { t } from "elysia";
import { jwt } from "../middlewares/jwt/jwt";
import { getUserInterceptor } from "../middlewares/jwt";
import { prisma } from "../helpers/prisma.client";

export const cardController = new Elysia({ prefix: '/cards' })
    .use(jwt)
    .decorate("prisma", prisma)
    .derive(getUserInterceptor)
    .get("/my", async ({ prisma, query, user }) => {
        if (!user) return { body: { error: "Unauthorized" } };
        const limit = 32;
        const { page, search } = query
        const skip = search ? 0 : (parseInt((page || '1')) - 1) * limit;
        const where = search ? { name: { startsWith: search } } : {};
        const cards = await prisma.card.findMany({ where: { ...where, Cards_user: { some: { userId: user.id } } }, skip, take: search ? undefined : limit, orderBy: { rarity: 'desc' } });
        return { cards };
    }, { query: t.Object({ page: t.Optional(t.String()), search: t.Optional(t.String()) }) })
    .get("/", async ({ prisma, query }) => {
        const limit = 32;
        const { page, search } = query
        const skip = search ? 0 : (parseInt((page || '1')) - 1) * limit;
        const where = search ? { name: { startsWith: search } } : {};
        const cards = await prisma.card.findMany({ where, skip, take: search ? undefined : limit, orderBy: { rarity: 'desc' } });
        return { cards };
    }, { query: t.Object({ page: t.Optional(t.String()), search: t.Optional(t.String()) }) })
    .get("/:id", async ({ prisma, params, set }) => {
        const { id } = params;
        const card = await prisma.card.findFirst({ where: { id: parseInt(id) } });
        if (!card) {
            set.status = 404;
            return { error: "Card not found" };
        };
        return { card };
    }, { params: t.Object({ id: t.String() }) })
