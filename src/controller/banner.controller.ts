import Elysia, { t } from "elysia";
import { prisma } from "../helpers/prisma.client";
import { storeImg } from "../lib/store-img";
import { jwt } from "../middlewares/jwt/jwt";
import { getUserInterceptor, getUserUserMiddleware } from "../middlewares/jwt";
import { errorResponse, sucessResponse } from "../lib/mount-response";
import type { User } from "@prisma/client";

export const bannerController = new Elysia({}).group("/banner", (app) => {
  return app
    .decorate("prisma", prisma)
    .get("/", async ({ prisma }) => {
      const banners = await prisma.banner.findMany();
      return sucessResponse(banners);
    })
    .use(jwt)
    .decorate("user", {} as User)
    .onBeforeHandle(getUserUserMiddleware as any)
    .post(
      "/",
      async ({ body, prisma, jwt, user, set }) => {
        console.log(user);
        if (!user.isAdmin) {
          set.status = 401;
          return errorResponse("Não autorizado", "Não autorizado!");
        }
        const banner = await prisma.banner.create({
          data: {
            description: body.description,
            title: body.title,
            active: Boolean(Number(body.active)) ?? false,
            anchor: body.anchor,
          },
        });
        const storePath = await storeImg(banner.id, "/banners/", body.image);
        await prisma.banner.update({
          where: { id: banner.id },
          data: { image_url: storePath },
        });
        return sucessResponse(null, "Banner criado com sucesso!");
      },
      {
        body: t.Object({
          title: t.String(),
          anchor: t.Optional(t.String()),
          description: t.String(),
          image: t.File(),
          active: t.Optional(t.String()),
        }),
      }
    )
    .patch(
      "/:id",
      async ({ params, body, prisma, jwt, user, set }) => {
        if (!user || !user.isAdmin) {
          set.status = 401;
          return errorResponse("Não autorizado", "Não autorizado");
        }
        const banner = await prisma.banner.findUnique({
          where: { id: Number(params.id) },
        });
        if (!banner) {
          set.status = 404;
          return errorResponse(
            "Banner não encontrado",
            "Banner não encontrado"
          );
        }
        await prisma.banner.update({
          where: { id: banner.id },
          data: {
            description: body.description,
            title: body.title,
          },
        });
        if (body.image) {
          const storePath = await storeImg(banner.id, "/banners/", body.image);
          await prisma.banner.update({
            where: { id: banner.id },
            data: { image_url: storePath },
          });
        }
        return sucessResponse("Banner atualizado com sucesso!");
      },
      {
        body: t.Object({
          title: t.String(),
          description: t.String(),
          image: t.File(),
          active: t.Optional(t.Boolean()),
        }),
      }
    );
});
