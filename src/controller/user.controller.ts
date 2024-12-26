import { Elysia, t } from "elysia";
import { prisma } from "../helpers/prisma.client";
import { jwt } from "../middlewares/jwt/jwt";
import { getUserInterceptor, getUserUserMiddleware } from "../middlewares/jwt";
import type { User } from "@prisma/client";
import { errorResponse, sucessResponse } from "../lib/mount-response";
// Tipo base para todas as respostas
const baseResponse = t.Object({
  ok: t.Boolean(),
  toast: t.Union([t.String(), t.Null()]),
  error: t.Union([t.String(), t.Null()]),
  data: t.Any(),
});

export const userController = new Elysia({}).group("/user", (app) => {
  return app
    .use(jwt)
    .decorate("user", {} as User)
    .onBeforeHandle(getUserUserMiddleware as any)
    .decorate("prisma", prisma)
    .get(
      "/me",
      async ({ user, set }) => {
        await prisma.user.update({
          data: { last_entry: new Date() },
          where: { id: user.id },
        });
        return sucessResponse(user);
      },
      {
        detail: { tags: ["User"] },
        response: {
          200: baseResponse,
          401: baseResponse,
        },
      }
    )
    .get(
      "/friends",
      async ({ user, prisma, query, set }) => {
        const { search } = query;
        const friends = await prisma.friend_User.findMany({
          where: {
            OR: [
              { user_id: user.id, accepted: true },
              { friend_id: user.id, accepted: true },
            ],
          },
        });
        const friends_ids = friends.map((f) => {
          if (f.user_id === user.id) return f.friend_id;
          return f.user_id;
        });
        const friends_data = await prisma.user.findMany({
          where: {
            id: { in: friends_ids },
            username: { contains: search || "" },
          },
          select: { id: true, username: true, email: true, last_entry: true },
        });
        return sucessResponse(friends_data);
      },
      {
        query: t.Object({ search: t.Optional(t.String()) }),
        detail: { tags: ["User"] },
        response: {
          401: baseResponse,
          200: baseResponse,
        },
      }
    )
    .get(
      "/requests",
      async ({ user, prisma, set }) => {
        const requests = await prisma.friend_User.findMany({
          where: { friend_id: user.id, accepted: false },
          select: {
            User: { select: { email: true, id: true, username: true } },
            id: true,
            user_id: true,
            accepted: true,
          },
        });
        const formatted = requests.map((i) => ({
          ...i.User,
          user_id: i.User.id,
          id: i.id,
        }));
        return sucessResponse(formatted);
      },
      {
        detail: {
          tags: ["User"],
          description: "Endpoint relacionado a Lista de pedidos de amizade",
        },
        response: {
          200: baseResponse,
          401: baseResponse,
        },
      }
    )
    .get(
      "/requests/sent",
      async ({ user, prisma, set }) => {
        const requests = await prisma.friend_User.findMany({
          where: { user_id: user.id, accepted: false },
          select: {
            id: true,
            Friend: { select: { id: true, username: true, email: true } },
          },
        });

        const formatted = requests.map((i) => ({
          ...i.Friend,
          friend_id: i.Friend.id,
          id: i.id,
        }));
        return sucessResponse(formatted);
      },
      {
        detail: {
          tags: ["User"],
          description:
            "Endpoint relacionado a Lista de pedidos de amizade enviados",
        },
        response: {
          401: baseResponse,
          200: baseResponse,
        },
      }
    )
    .post(
      "send/:id",
      async ({ user, prisma, params, set }) => {
        const { id } = params;
        if (isNaN(Number(id))) {
          set.status = 400;
          return errorResponse("ID inválido", "ID inválido");
        }
        const friend = await prisma.user.findFirst({
          where: { id: Number(id) },
        });
        if (!friend) {
          set.status = 404;
          return errorResponse(
            "Usuário não encontrado",
            "Usuário não encontrado"
          );
        }
        await prisma.friend_User.create({
          data: { user_id: user.id, friend_id: friend.id },
        });
        return sucessResponse(null, "Pedido de amizade enviado com sucesso");
      },
      {
        detail: {
          tags: ["User"],
          description: "Endpoint relacionado a envio de pedidos de amizade",
        },
        params: t.Object({
          id: t.Number({ description: "Id do usuário a ser amigo." }),
        }),
        response: {
          404: baseResponse,
          200: baseResponse,
          401: baseResponse,
          400: baseResponse,
        },
      }
    )
    .post(
      "accept/:id",
      async ({ user, prisma, params, set }) => {
        const { id } = params;
        if (isNaN(Number(id))) {
          set.status = 400;
          return errorResponse("ID inválido", "ID inválido");
        }
        const request = await prisma.friend_User.findFirst({
          where: { id: Number(id) },
        });
        if (!request) {
          set.status = 404;
          return errorResponse(
            "Pedido não encontrado",
            "Pedido não encontrado"
          );
        }
        if (request.accepted) {
          set.status = 400;
          return errorResponse(
            "A requisição já foi aceita",
            "A requisição já foi aceita"
          );
        }
        await prisma.friend_User.update({
          where: { id: request.id },
          data: { accepted: true },
        });
        return sucessResponse(null, "Pedido de amizade aceito com sucesso");
      },
      {
        detail: {
          tags: ["User"],
          description: "Endpoint relacionado a aceitação de pedidos de amizade",
        },
        params: t.Object({
          id: t.Number({ description: "Id do pedido de amizade." }),
        }),
        response: {
          401: baseResponse,
          200: baseResponse,
          400: baseResponse,
          404: baseResponse,
        },
      }
    )
    .delete(
      "reject/:id",
      async ({ user, prisma, params, set }) => {
        const { id } = params;
        if (isNaN(id)) {
          set.status = 400;
          return errorResponse("ID inválido", "ID inválido");
        }
        const request = await prisma.friend_User.findFirst({
          where: { id: Number(id) },
        });
        if (!request) {
          set.status = 404;
          return errorResponse(
            "Pedido não encontrado",
            "Pedido não encontrado"
          );
        }
        await prisma.friend_User.delete({ where: { id: request.id } });
        return sucessResponse(null, "Pedido de amizade rejeitado com sucesso");
      },
      {
        detail: {
          tags: ["User"],
          description: "Endpoint relacionado a rejeição de pedidos de amizade",
        },
        params: t.Object({
          id: t.Number({ description: "Id do pedido de amizade." }),
        }),
        response: {
          401: baseResponse,
          200: baseResponse,
          400: baseResponse,
          404: baseResponse,
        },
      }
    )
    .delete(
      "/remove-sent/:id",
      async ({ user, prisma, params, set }) => {
        const { id } = params;
        if (isNaN(Number(id))) {
          set.status = 400;
          return errorResponse("ID inválido", "ID inválido");
        }
        const request = await prisma.friend_User.findFirst({
          where: { id: Number(id) },
        });
        if (!request) {
          return errorResponse(
            "Pedido não encontrado",
            "Pedido não encontrado"
          );
        }
        await prisma.friend_User.delete({ where: { id: request.id } });
        return sucessResponse(null, "Pedido de amizade removido com sucesso");
      },
      {
        detail: {
          tags: ["User"],
          description:
            "Endpoint relacionado a cancelar pedidos de amizade enviados",
        },
        params: t.Object({
          id: t.Number({ description: "Id do pedido de amizade." }),
        }),
        response: {
          401: baseResponse,
          200: baseResponse,
          400: baseResponse,
          404: baseResponse,
        },
      }
    )
    .delete(
      "/remove/:id",
      async ({ user, prisma, params, set }) => {
        const { id } = params;
        if (isNaN(Number(id))) {
          set.status = 400;
          return errorResponse("ID inválido", "ID inválido");
        }
        const request = await prisma.friend_User.findFirst({
          where: {
            OR: [
              { AND: [{ user_id: user.id }, { friend_id: Number(id) }] },
              { AND: [{ user_id: Number(id) }, { friend_id: user.id }] },
            ],
          },
          include: { User: true, Friend: true },
        });
        if (!request) {
          set.status = 404;
          return errorResponse("Amigo não encontrado", "Amigo não encontrado");
        }
        await prisma.friend_User.delete({ where: { id: request.id } });
        return sucessResponse(null, "Amizade removida com sucesso");
      },
      {
        detail: {
          tags: ["User"],
          description: "Endpoint relacionado a remoção de amigos",
        },
        params: t.Object({
          id: t.Number({ description: "Id do amigo a ser removido." }),
        }),
        response: {
          401: baseResponse,
          200: baseResponse,
          400: baseResponse,
          404: baseResponse,
        },
      }
    )
    .get(
      "/bounty",
      async ({ user, prisma, set }) => {
        const last_bounty_date = new Date(
          user.last_daily_bounty || new Date("2021-01-01")
        );
        const now = new Date();
        const diff = now.getTime() - last_bounty_date.getTime();
        const diffDays = Math.floor(diff / (1000 * 3600 * 24));

        if (diffDays < 1) {
          set.status = 400;
          return errorResponse(
            "Você já coletou sua recompensa diária",
            "Você já coletou sua recompensa diária"
          );
        }

        const bountyAmount = Math.min(500 * diffDays, 10000);
        await prisma.user.update({
          where: { id: user.id },
          data: {
            last_daily_bounty: now,
            money: user.money + bountyAmount,
          },
        });
        return sucessResponse(
          { money: user.money + bountyAmount },
          "Recompensa coletada com sucesso"
        );
      },
      {
        detail: {
          tags: ["User"],
          description: "Endpoint relacionado a coleta de recompensa diária",
        },
        response: {
          400: baseResponse,
          401: baseResponse,
          200: baseResponse,
        },
      }
    )
    .get(
      "/bounty-time",
      async ({ user, set }) => {
        const lastBountyDate = new Date(
          user.last_daily_bounty || new Date("2021-01-01")
        );
        const diffInMs = new Date().getTime() - lastBountyDate.getTime();

        return sucessResponse(
          {
            time: lastBountyDate.toISOString(),
            diff: diffInMs,
          },
          "Tempo de recompensa recuperado com sucesso"
        );
      },
      {
        detail: {
          tags: ["User"],
          description:
            "Endpoint relacionado ao resgate do tempo da última recompensa",
        },
        response: {
          401: baseResponse,
          200: baseResponse,
        },
      }
    );
});
