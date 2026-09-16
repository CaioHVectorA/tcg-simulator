import { Elysia, t } from "elysia";
import { prisma } from "../helpers/prisma.client";
import { jwt } from "../middlewares/jwt/jwt";
import { getUserInterceptor, getUserUserMiddleware } from "../middlewares/jwt";
import type { User } from "@prisma/client";
import { errorResponse, sucessResponse } from "../lib/mount-response";
import { wsManager } from "../lib/ws-manager";

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
          data: { last_entry: new Date(), online: true },
          where: { id: user.id },
        });
        const currentUser = await prisma.user.findUnique({
          where: { id: user.id },
        });
        return sucessResponse(currentUser || user);
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
          select: { id: true, username: true, email: true, last_entry: true, picture: true },
        });
        const formatted = friends_data.map((f) => ({
          ...f,
          online: wsManager.isOnline(f.id),
        }));
        return sucessResponse(formatted);
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
      "/search",
      async ({ user, prisma, query, set }) => {
        const { q } = query;
        if (!q || q.trim().length < 2) {
          return sucessResponse([]);
        }

        const usersFound = await prisma.user.findMany({
          where: {
            username: { contains: q.trim(), mode: "insensitive" },
            id: { not: user.id },
          },
          take: 20,
          select: {
            id: true,
            username: true,
            picture: true,
            rarityPoints: true,
            totalBudget: true,
          },
        });

        // Buscar relações existentes com esses usuários
        const relations = await prisma.friend_User.findMany({
          where: {
            OR: [
              { user_id: user.id, friend_id: { in: usersFound.map((u) => u.id) } },
              { friend_id: user.id, user_id: { in: usersFound.map((u) => u.id) } },
            ],
          },
        });

        const formatted = usersFound.map((u) => {
          const relation = relations.find(
            (r) =>
              (r.user_id === user.id && r.friend_id === u.id) ||
              (r.friend_id === user.id && r.user_id === u.id)
          );

          let status: "none" | "friend" | "sent" | "received" = "none";
          if (relation) {
            if (relation.accepted) {
              status = "friend";
            } else if (relation.user_id === user.id) {
              status = "sent";
            } else {
              status = "received";
            }
          }

          return {
            ...u,
            online: wsManager.isOnline(u.id),
            relationStatus: status,
            requestId: relation ? relation.id : null,
          };
        });

        return sucessResponse(formatted);
      },
      {
        query: t.Object({ q: t.String() }),
        detail: { tags: ["User"], description: "Busca usuários por nome com status de amizade" },
        response: baseResponse,
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
        const targetId = Number(params.id);
        if (isNaN(targetId)) {
          set.status = 400;
          return errorResponse("ID inválido", "ID inválido");
        }

        if (targetId === user.id) {
          set.status = 400;
          return errorResponse(
            "Você não pode adicionar a si mesmo",
            "Você não pode adicionar a si mesmo"
          );
        }

        const friend = await prisma.user.findFirst({
          where: { id: targetId },
        });

        if (!friend) {
          set.status = 404;
          return errorResponse(
            "Usuário não encontrado",
            "Usuário não encontrado"
          );
        }

        // Verificar se já existe amizade ou pedido pendente
        const existing = await prisma.friend_User.findFirst({
          where: {
            OR: [
              { user_id: user.id, friend_id: targetId },
              { user_id: targetId, friend_id: user.id },
            ],
          },
        });

        if (existing) {
          set.status = 400;
          if (existing.accepted) {
            return errorResponse("Vocês já são amigos!", "Vocês já são amigos!");
          }
          return errorResponse(
            "Já existe um pedido de amizade pendente",
            "Já existe um pedido de amizade pendente"
          );
        }

        const createdRequest = await prisma.friend_User.create({
          data: { user_id: user.id, friend_id: friend.id },
        });

        // Notificar amigo via banco e WebSocket
        await prisma.notifications.create({
          data: {
            user_id: friend.id,
            type: "FRIEND_REQUEST",
            content: `${user.username} enviou uma solicitação de amizade.`,
            thumbnail: user.picture,
          },
        });

        wsManager.sendToUser(friend.id, {
          type: "FRIEND_REQUEST",
          payload: {
            requestId: createdRequest.id,
            from: { id: user.id, username: user.username, picture: user.picture },
          },
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
        if (request.friend_id !== user.id) {
          set.status = 403;
          return errorResponse(
            "Você não tem permissão para aceitar este pedido",
            "Você não tem permissão para aceitar este pedido"
          );
        }

        await prisma.friend_User.update({
          where: { id: request.id },
          data: { accepted: true },
        });

        // Notificar quem enviou o pedido
        await prisma.notifications.create({
          data: {
            user_id: request.user_id,
            type: "FRIEND_ACCEPTED",
            content: `${user.username} aceitou seu pedido de amizade!`,
            thumbnail: user.picture,
          },
        });

        wsManager.sendToUser(request.user_id, {
          type: "FRIEND_ACCEPTED",
          payload: {
            by: { id: user.id, username: user.username, picture: user.picture },
          },
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
    .post(
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
        const bountyAmount = Math.min(
          500 * diffDays,
          20000 * (1 + Math.floor(user.daily_bounty_level / 10))
        );
        await prisma.user.update({
          where: { id: user.id },
          data: {
            last_daily_bounty: now,
            money: {
              increment: bountyAmount,
            },
            totalBudget: {
              increment: bountyAmount,
            },
            daily_bounty_level: {
              increment: 1,
            },
          },
        });
        return sucessResponse(null, "Recompensa coletada com sucesso");
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
        const diffDays = Math.floor(diffInMs / (1000 * 3600 * 24));
        const bountyAmount = Math.min(
          500 * diffDays,
          20000 * (1 + Math.floor(user.daily_bounty_level / 10))
        );
        const oneDay = 1000 * 60 * 60 * 24;
        return sucessResponse({
          time: lastBountyDate.toISOString(),
          diff: oneDay - diffInMs,
          canCollect: diffDays >= 1,
          bountyAmount,
        });
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
    )
    .post(
      "/donate",
      async ({ user, prisma, body, set }) => {
        const { receiver_id, amount } = body as { receiver_id: number; amount: number };

        if (!receiver_id || isNaN(receiver_id) || receiver_id === user.id) {
          set.status = 400;
          return errorResponse("Destinatário inválido", "Destinatário inválido");
        }

        if (!amount || isNaN(amount) || amount <= 0) {
          set.status = 400;
          return errorResponse("Quantidade inválida", "A quantia deve ser maior que zero");
        }

        // Verificar saldo do remetente
        const sender = await prisma.user.findUnique({
          where: { id: user.id },
          select: { money: true, username: true, picture: true },
        });

        if (!sender || sender.money < amount) {
          set.status = 400;
          return errorResponse("Saldo insuficiente", "Você não possui moedas suficientes para esta doação");
        }

        const receiver = await prisma.user.findUnique({
          where: { id: receiver_id },
          select: { id: true, username: true },
        });

        if (!receiver) {
          set.status = 404;
          return errorResponse("Destinatário não encontrado", "Destinatário não encontrado");
        }

        // Transação atômica
        await prisma.$transaction([
          prisma.user.update({
            where: { id: user.id },
            data: { money: { decrement: amount } },
          }),
          prisma.user.update({
            where: { id: receiver_id },
            data: {
              money: { increment: amount },
              totalBudget: { increment: amount },
            },
          }),
          prisma.money_donate.create({
            data: {
              sender_id: user.id,
              receiver_id,
              amount,
            },
          }),
          prisma.notifications.create({
            data: {
              user_id: receiver_id,
              type: "DONATION",
              content: `${sender.username} doou ${amount} moedas para você!`,
              thumbnail: sender.picture,
            },
          }),
        ]);

        wsManager.sendToUser(receiver_id, {
          type: "DONATION_RECEIVED",
          payload: {
            from: { id: user.id, username: sender.username },
            amount,
          },
        });

        return sucessResponse(null, `Você doou ${amount} moedas para ${receiver.username}!`);
      },
      {
        body: t.Object({
          receiver_id: t.Number(),
          amount: t.Number({ minimum: 1 }),
        }),
        detail: { tags: ["User"], description: "Doa moedas para outro treinador" },
        response: baseResponse,
      }
    )
    .post(
      "/recycle-duplicates",
      async ({ user, prisma, set }) => {
        // Obter todas as cartas do usuário
        const userCards = await prisma.cards_user.findMany({
          where: { userId: user.id },
          include: {
            Card: { select: { id: true, rarity: true, name: true } },
          },
        });

        // Agrupar por cardId
        const cardGroups: Record<number, typeof userCards> = {};
        for (const uc of userCards) {
          if (!cardGroups[uc.cardId]) {
            cardGroups[uc.cardId] = [];
          }
          cardGroups[uc.cardId].push(uc);
        }

        const rarityPrices: Record<number, number> = {
          1: 15,
          2: 60,
          3: 250,
          4: 1200,
          5: 3500,
        };

        const idsToDelete: number[] = [];
        let totalCoinsEarned = 0;

        for (const cardId in cardGroups) {
          const group = cardGroups[cardId];
          if (group.length > 1) {
            // Mantém o primeiro exemplar e recicla os excedentes
            const duplicates = group.slice(1);
            for (const dup of duplicates) {
              idsToDelete.push(dup.id);
              const price = rarityPrices[dup.Card.rarity] || 15;
              totalCoinsEarned += price;
            }
          }
        }

        if (idsToDelete.length === 0) {
          return sucessResponse(
            { recycledCount: 0, coinsEarned: 0 },
            "Você não possui cartas repetidas para reciclar!"
          );
        }

        // Executar transação atômica
        await prisma.$transaction([
          prisma.cards_user.deleteMany({
            where: { id: { in: idsToDelete } },
          }),
          prisma.user.update({
            where: { id: user.id },
            data: {
              money: { increment: totalCoinsEarned },
              totalBudget: { increment: totalCoinsEarned },
            },
          }),
        ]);

        return sucessResponse(
          {
            recycledCount: idsToDelete.length,
            coinsEarned: totalCoinsEarned,
          },
          `Sucesso! ${idsToDelete.length} cartas repetidas recicladas por ${totalCoinsEarned} moedas!`
        );
      },
      {
        detail: { tags: ["User"], description: "Recicla cópias repetidas de cartas por moedas" },
        response: baseResponse,
      }
    )
    .get(
      "/profile",
      async ({ user, prisma }) => {
        const [totalCards, uniqueCardsGroup, openedPackages, completedQuests, tradesDone] =
          await Promise.all([
            prisma.cards_user.count({ where: { userId: user.id } }),
            prisma.cards_user.groupBy({
              by: ["cardId"],
              where: { userId: user.id },
            }),
            prisma.packages_User.count({
              where: { userId: user.id, opened: true },
            }),
            prisma.questUser.count({
              where: { user_id: user.id, completed: true },
            }),
            prisma.user_Trade.count({
              where: { user_id: user.id },
            }),
          ]);

        // Top 5 cartas mais raras
        const topCards = await prisma.cards_user.findMany({
          where: { userId: user.id },
          take: 5,
          orderBy: { Card: { rarity: "desc" } },
          include: {
            Card: true,
          },
        });

        // Fórmula de Nível de Treinador & XP
        const xp = Number(user.rarityPoints || 0) * 10 + Math.floor(Number(user.totalBudget || 0) / 10);
        const level = Math.max(1, Math.floor(Math.sqrt(xp / 100)) + 1);
        const nextLevelXp = Math.pow(level, 2) * 100;
        const currentLevelBaseXp = Math.pow(level - 1, 2) * 100;
        const levelProgress = Math.min(
          100,
          Math.max(0, Math.round(((xp - currentLevelBaseXp) / (nextLevelXp - currentLevelBaseXp)) * 100))
        );

        return sucessResponse({
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            picture: user.picture,
            money: user.money,
            rarityPoints: user.rarityPoints,
            totalBudget: user.totalBudget,
            createdAt: user.createdAt,
          },
          stats: {
            totalCards,
            uniqueCards: uniqueCardsGroup.length,
            openedPackages,
            completedQuests,
            tradesDone,
            level,
            xp,
            nextLevelXp,
            levelProgress,
          },
          topCards: topCards.map((tc) => tc.Card),
        });
      },
      {
        detail: { tags: ["User"], description: "Retorna estatísticas detalhadas de perfil e progressão" },
        response: baseResponse,
      }
    )
    .patch(
      "/profile",
      async ({ user, prisma, body, set }) => {
        const { username, picture } = body as { username?: string; picture?: string };

        const updateData: { username?: string; picture?: string } = {};

        if (username && username.trim().length >= 3) {
          updateData.username = username.trim();
        }

        if (picture && picture.trim().length > 0) {
          updateData.picture = picture.trim();
        }

        if (Object.keys(updateData).length === 0) {
          set.status = 400;
          return errorResponse("Nenhum dado informado", "Informe um novo nome ou avatar");
        }

        const updated = await prisma.user.update({
          where: { id: user.id },
          data: updateData,
          select: { id: true, username: true, picture: true, email: true },
        });

        return sucessResponse(updated, "Perfil atualizado com sucesso!");
      },
      {
        body: t.Object({
          username: t.Optional(t.String({ minLength: 3, maxLength: 30 })),
          picture: t.Optional(t.String()),
        }),
        detail: { tags: ["User"], description: "Atualiza dados de perfil do usuário" },
        response: baseResponse,
      }
    );
});

