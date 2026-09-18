import Elysia, { t } from "elysia";
import { getUserUserMiddleware } from "../middlewares/jwt";
import { prisma } from "../helpers/prisma.client";
import { jwt } from "../middlewares/jwt/jwt";
import type { User } from "@prisma/client";
import { errorResponse, sucessResponse } from "../lib/mount-response";

const baseResponse = t.Object({
  ok: t.Boolean(),
  toast: t.Union([t.String(), t.Null()]),
  error: t.Union([t.String(), t.Null()]),
  data: t.Any(),
});

export const notificationController = new Elysia({}).group("/notifications", (app) => {
  return app
    .use(jwt)
    .decorate("prisma", prisma)
    .decorate("user", {} as User)
    .onBeforeHandle(getUserUserMiddleware as any)
    .get(
      "/",
      async ({ user, prisma }) => {
        const notifications = await prisma.notifications.findMany({
          where: { user_id: user.id },
          orderBy: { createdAt: "desc" },
          take: 40,
        });

        const unreadCount = await prisma.notifications.count({
          where: { user_id: user.id, viewed: false },
        });

        return sucessResponse({
          notifications,
          unreadCount,
        });
      },
      {
        detail: { tags: ["Notifications"], description: "Lista todas as notificações do usuário logado" },
        response: baseResponse,
      }
    )
    .patch(
      "/:id/read",
      async ({ user, prisma, params }) => {
        const id = Number(params.id);
        if (isNaN(id)) {
          return errorResponse("ID inválido", "ID inválido");
        }

        const notification = await prisma.notifications.findFirst({
          where: { id, user_id: user.id },
        });

        if (!notification) {
          return errorResponse("Notificação não encontrada", "Notificação não encontrada");
        }

        await prisma.notifications.update({
          where: { id },
          data: { viewed: true },
        });

        return sucessResponse(null, "Notificação marcada como lida");
      },
      {
        detail: { tags: ["Notifications"], description: "Marca uma notificação como lida" },
        response: baseResponse,
      }
    )
    .patch(
      "/read-all",
      async ({ user, prisma }) => {
        await prisma.notifications.updateMany({
          where: { user_id: user.id, viewed: false },
          data: { viewed: true },
        });

        return sucessResponse(null, "Todas as notificações foram marcadas como lidas");
      },
      {
        detail: { tags: ["Notifications"], description: "Marca todas as notificações como lidas" },
        response: baseResponse,
      }
    )
    .delete(
      "/:id",
      async ({ user, prisma, params }) => {
        const id = Number(params.id);
        if (isNaN(id)) {
          return errorResponse("ID inválido", "ID inválido");
        }

        const notification = await prisma.notifications.findFirst({
          where: { id, user_id: user.id },
        });

        if (!notification) {
          return errorResponse("Notificação não encontrada", "Notificação não encontrada");
        }

        await prisma.notifications.delete({ where: { id } });
        return sucessResponse(null, "Notificação removida com sucesso");
      },
      {
        detail: { tags: ["Notifications"], description: "Exclui uma notificação" },
        response: baseResponse,
      }
    );
});
