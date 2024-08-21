import { Elysia, t } from "elysia";
import { prisma } from "../helpers/prisma.client";
import { jwt } from "../middlewares/jwt/jwt";
import { getUserInterceptor } from "../middlewares/jwt";

export const userController = new Elysia({}).group("/user", (app) => {
  return app
    .use(jwt)
    .derive(getUserInterceptor)
    .decorate("prisma", prisma)
    .get(
      "/me",
      async ({ user, set }) => {
        if (!user) {
          set.status = 401;
          return { error: "Unauthorized" };
        }
        await prisma.user.update({
          data: { last_entry: new Date() },
          where: { id: user.id },
        });
        return user;
      },
      {
        detail: { tags: ["User"] },
        response: {
          200: t.Object(
            {
              id: t.Number(),
              username: t.String(),
              email: t.String(),
              money: t.Number(),
              last_daily_bounty: t.Nullable(t.Date()),
              createdAt: t.Date(),
              updatedAt: t.Date(),
              last_entry: t.Date(),
            },
            { description: "Usuário" }
          ),
          401: t.Object(
            { error: t.String() },
            { description: "Erro de não autorizado." }
          ),
        },
      }
    )
    .get(
      "/friends",
      async ({ user, prisma, query, set }) => {
        const { search } = query;
        if (!user) {
          set.status = 401;
          return { error: "Unauthorized" };
        }
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
        return friends_data;
      },
      {
        query: t.Object({ search: t.Optional(t.String()) }),
        detail: { tags: ["User"] },
        response: {
          401: t.Object(
            { error: t.String() },
            { description: "Erro de não autorizado." }
          ),
          200: t.Array(t.Object({ id: t.Number(), username: t.String() }), {
            description: "Lista de amigos",
          }),
        },
      }
    )
    .get(
      "/requests",
      async ({ user, prisma, set }) => {
        if (!user) {
          set.status = 401;
          return { error: "Não autorizado!" };
        }
        const requests = await prisma.friend_User.findMany({
          where: { friend_id: user.id, accepted: false },
          select: {
            User: { select: { email: true, id: true, username: true } },
            id: true,
            user_id: true,
            accepted: true,
          },
        });
        // console.log({ requests: await prisma.friend_User.findMany({ where: { user_id: user.id } }) });
        const formatted = requests.map((i) => ({
          ...i.User,
          user_id: i.User.id,
          id: i.id,
        }));
        return formatted;
      },
      {
        detail: {
          tags: ["User"],
          description: "Endpoint relacionado a Lista de pedidos de amizade",
        },
        response: {
          200: t.Array(
            t.Object(
              {
                id: t.Number(),
                user_id: t.Number(),
                username: t.String(),
                email: t.String(),
              },
              { description: "Lista Pedidos de amizade recebidos" }
            )
          ),
          401: t.Object(
            { error: t.String() },
            { description: "Não autorizado" }
          ),
        },
      }
    )
    .get(
      "/requests/sent",
      async ({ user, prisma, set }) => {
        if (!user) {
          set.status = 401;
          return { error: "Não autorizado!" };
        }
        const requests = await prisma.friend_User.findMany({
          where: { user_id: user.id, accepted: false },
          select: {
            id: true,
            Friend: { select: { id: true, username: true, email: true } },
          },
        });

        return requests.map((i) => ({
          ...i.Friend,
          friend_id: i.Friend.id,
          id: i.id,
        }));
      },
      {
        detail: {
          tags: ["User"],
          description:
            "Endpoint relacionado a Lista de pedidos de amizade enviados",
        },
        response: {
          401: t.Object(
            { error: t.String() },
            { description: "Não autorizado" }
          ),
          200: t.Array(
            t.Object(
              {
                id: t.Number(),
                friend_id: t.Number(),
                username: t.String(),
                email: t.String(),
              },
              { description: "Lista de pedidos de amizade enviados" }
            )
          ),
        },
      }
    )
    .post(
      "send/:id",
      async ({ user, prisma, params, set }) => {
        if (!user) {
          set.status = 401;
          return { error: "Não autorizado!" };
        }
        const { id } = params;
        if (isNaN(Number(id))) {
          set.status = 400;
          return { error: "Id Inválido!" };
        }
        const friend = await prisma.user.findFirst({
          where: { id: Number(id) },
        });
        if (!friend) {
          set.status = 404;
          return { error: "User not found" };
        }
        await prisma.friend_User.create({
          data: { user_id: user.id, friend_id: friend.id },
        });
        return { message: "Friend request sent" };
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
          404: t.Object(
            { error: t.String() },
            { description: "Não autorizado" }
          ),
          200: t.Object(
            { message: t.String() },
            { description: "Pedido de amizade enviado" }
          ),
          401: t.Object(
            { error: t.String() },
            { description: "Não autorizado" }
          ),
        },
      }
    )
    .post(
      "accept/:id",
      async ({ user, prisma, params, set }) => {
        if (!user) {
          set.status = 401;
          return { error: "Não autorizado!" };
        }
        const { id } = params;
        if (isNaN(Number(id))) {
          set.status = 400;
          return { error: "Id Inválido!" };
        }
        const request = await prisma.friend_User.findFirst({
          where: { id: Number(id) },
        });
        if (!request) {
          set.status = 404;
          return { error: "Request not found" };
        }
        if (request.accepted) {
          set.status = 400;
          return { error: "Request already accepted" };
        }
        await prisma.friend_User.update({
          where: { id: request.id },
          data: { accepted: true },
        });
        return { message: "Friend request accepted" };
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
          401: t.Object(
            { error: t.String() },
            { description: "Não autorizado" }
          ),
          200: t.Object(
            { message: t.String() },
            { description: "Pedido de amizade aceito" }
          ),
          400: t.Object(
            { error: t.String() },
            { description: "id inválido ou solicitação já aceita!" }
          ),
          404: t.Object(
            { error: t.String() },
            { description: "Pedido não encontrado" }
          ),
        },
      }
    )
    .delete(
      "reject/:id",
      async ({ user, prisma, params, set }) => {
        if (!user) {
          set.status = 401;
          return { error: "Não autorizado!" };
        }
        const { id } = params;
        if (isNaN(id)) {
          set.status = 400;
          return { error: "Id Inválido!" };
        }
        const request = await prisma.friend_User.findFirst({
          where: { id: Number(id) },
        });
        if (!request) {
          set.status = 404;
          return { error: "Request not found" };
        }
        await prisma.friend_User.delete({ where: { id: request.id } });
        return { message: "Friend request rejected" };
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
          401: t.Object(
            { error: t.String() },
            { description: "Não autorizado" }
          ),
          200: t.Object(
            { message: t.String() },
            { description: "Pedido de amizade rejeitado" }
          ),
          400: t.Object({ error: t.String() }, { description: "id inválido" }),
          404: t.Object(
            { error: t.String() },
            { description: "Pedido não encontrado" }
          ),
        },
      }
    )
    .delete(
      "/remove-sent/:id",
      async ({ user, prisma, params, set }) => {
        if (!user) {
          set.status = 401;
          return { error: "Não autorizado!" };
        }
        const { id } = params;
        if (isNaN(Number(id))) {
          set.status = 400;
          return { error: "Id Inválido!" };
        };
        const request = await prisma.friend_User.findFirst({
          where: { id: Number(id) },
        });
        if (!request) return { error: "Request not found" };
        await prisma.friend_User.delete({ where: { id: request.id } });
        return { message: "Friend request removed" };
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
          401: t.Object(
            { error: t.String() },
            { description: "Não autorizado" }
          ),
          200: t.Object(
            { message: t.String() },
            { description: "Pedido de amizade removido" }
          ),
        },
      }
    )
    .delete(
      "/remove/:id",
      async ({ user, prisma, params, set }) => {
        if (!user) {
          set.status = 401;
          return { error: "Não autorizado!" };
        }
        const { id } = params;
        if (isNaN(Number(id))) {
          set.status = 400;
          return { error: "Id Inválido!" };
        }
        const request = await prisma.friend_User.findFirst({
          where: {
            OR: [
              { AND: [{ user_id: user.id }, { friend_id: Number(id) }] },
              { AND: [{ user_id: Number(id) }, { friend_id: user.id }] }
            ]
          },
          include: { User: true, Friend: true }
        });
        if (!request) {
          set.status = 404;
          console.log({ user_id: user.id, friend_id: Number(id) });
          return { error: "Amigo não encontrado!" };
        }
        await prisma.friend_User.delete({ where: { id: request.id } });
        return { message: "Amizade removida!" };
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
          401: t.Object(
            { error: t.String() },
            { description: "Não autorizado" }
          ),
          200: t.Object(
            { message: t.String() },
            { description: "Amigo removido" }
          ),
        },
      }
    )
    .get(
      "/bounty",
      async ({ user, prisma, set }) => {
        if (!user) {
          set.status = 401;
          return { error: "Não autorizado!" };
        }
        const last_bounty_date = new Date(
          user.last_daily_bounty || new Date("2021-01-01")
        ); // some date in the past that can be used as a default value
        const now = new Date();
        const diff = now.getTime() - last_bounty_date.getTime();
        const diffDays = Math.floor(diff / (1000 * 3600 * 24));
        console.log({ now, last_bounty_date, diff, diffDays });
        if (diffDays < 1) {
          set.status = 400;
          return { error: "Você já coletou sua recompensa diária!" };
        }
        await prisma.user.update({
          where: { id: user.id },
          data: {
            last_daily_bounty: now,
            money: user.money + Math.min(500 * diffDays, 10000),
          },
        });
        return { message: "Recompensa coletada!" };
      },
      {
        detail: {
          tags: ["User"],
          description: "Endpoint relacionado a coleta de recompensa diária",
        },
        response: {
          400: t.Object(
            { error: t.String() },
            { description: "Recompensa diária já coletada!" }
          ),
          401: t.Object(
            { error: t.String() },
            { description: "Não autorizado" }
          ),
          200: t.Object(
            { message: t.String() },
            { description: "Recompensa coletada" }
          ),
        },
      }
    )
    .get(
      "/bounty-time",
      async ({ user, set }) => {
        if (!user) {
          set.status = 401;
          return { error: "Não autorizado!" };
        }
        const diffInMs =
          new Date().getTime() -
          new Date(user.last_daily_bounty || new Date("2021-01-01")).getTime();
        return {
          time: (
            user.last_daily_bounty || new Date("2021-01-01")
          ).toISOString(),
          diff: diffInMs,
        };
      },
      {
        detail: {
          tags: ["User"],
          description:
            "Endpoint relacionado ao resgate do tempo da última recompensa",
        },
        response: {
          401: t.Object(
            { error: t.String() },
            { description: "Não autorizado" }
          ),
          200: t.Object(
            { time: t.String(), diff: t.Number() },
            {
              description:
                "o tempo do último resgate de recompensa e a diferença em milisegundos!",
            }
          ),
        },
      }
    );
});
