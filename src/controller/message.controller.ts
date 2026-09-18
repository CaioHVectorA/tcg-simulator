import Elysia, { t } from "elysia";
import { getUserUserMiddleware } from "../middlewares/jwt";
import { prisma } from "../helpers/prisma.client";
import { jwt } from "../middlewares/jwt/jwt";
import type { User } from "@prisma/client";
import { errorResponse, sucessResponse } from "../lib/mount-response";
import { wsManager } from "../lib/ws-manager";

const baseResponse = t.Object({
  ok: t.Boolean(),
  toast: t.Union([t.String(), t.Null()]),
  error: t.Union([t.String(), t.Null()]),
  data: t.Any(),
});

export const messageController = new Elysia({}).group("/messages", (app) => {
  return app
    .use(jwt)
    .decorate("prisma", prisma)
    .decorate("user", {} as User)
    .onBeforeHandle(getUserUserMiddleware as any)
    .get(
      "/conversations",
      async ({ user, prisma }) => {
        // Obter todas as amizades aceitas do usuário
        const friendships = await prisma.friend_User.findMany({
          where: {
            OR: [
              { user_id: user.id, accepted: true },
              { friend_id: user.id, accepted: true },
            ],
          },
          include: {
            User: { select: { id: true, username: true, picture: true } },
            Friend: { select: { id: true, username: true, picture: true } },
          },
        });

        const conversations = await Promise.all(
          friendships.map(async (f) => {
            const friend = f.user_id === user.id ? f.Friend : f.User;

            // Última mensagem trocada
            const lastMessage = await prisma.messages.findFirst({
              where: {
                OR: [
                  { sender_id: user.id, receiver_id: friend.id },
                  { sender_id: friend.id, receiver_id: user.id },
                ],
              },
              orderBy: { createdAt: "desc" },
            });

            // Mensagens não lidas
            const unreadCount = await prisma.messages.count({
              where: {
                sender_id: friend.id,
                receiver_id: user.id,
                viewed: false,
              },
            });

            return {
              friend: {
                ...friend,
                online: wsManager.isOnline(friend.id),
              },
              lastMessage,
              unreadCount,
            };
          })
        );

        // Ordenar por data da última mensagem
        conversations.sort((a, b) => {
          const dateA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
          const dateB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
          return dateB - dateA;
        });

        return sucessResponse(conversations);
      },
      {
        detail: { tags: ["Messages"], description: "Lista todas as conversas ativas do usuário" },
        response: baseResponse,
      }
    )
    .get(
      "/:friendId",
      async ({ user, prisma, params, set }) => {
        const friendId = Number(params.friendId);
        if (isNaN(friendId)) {
          set.status = 400;
          return errorResponse("ID inválido", "ID inválido");
        }

        const messages = await prisma.messages.findMany({
          where: {
            OR: [
              { sender_id: user.id, receiver_id: friendId },
              { sender_id: friendId, receiver_id: user.id },
            ],
          },
          orderBy: { createdAt: "asc" },
          take: 100,
        });

        // Marcar mensagens recebidas como lidas
        await prisma.messages.updateMany({
          where: {
            sender_id: friendId,
            receiver_id: user.id,
            viewed: false,
          },
          data: { viewed: true },
        });

        return sucessResponse(messages);
      },
      {
        detail: { tags: ["Messages"], description: "Histórico de mensagens com um amigo" },
        response: baseResponse,
      }
    )
    .post(
      "/:friendId",
      async ({ user, prisma, params, body, set }) => {
        const friendId = Number(params.friendId);
        if (isNaN(friendId) || friendId === user.id) {
          set.status = 400;
          return errorResponse("Destinatário inválido", "Destinatário inválido");
        }

        const friend = await prisma.user.findUnique({
          where: { id: friendId },
          select: { id: true, username: true },
        });

        if (!friend) {
          set.status = 404;
          return errorResponse("Usuário não encontrado", "Usuário não encontrado");
        }

        const { content } = body as { content: string };
        if (!content || !content.trim()) {
          set.status = 400;
          return errorResponse("Mensagem vazia", "A mensagem não pode estar vazia");
        }

        const message = await prisma.messages.create({
          data: {
            sender_id: user.id,
            receiver_id: friendId,
            content: content.trim(),
          },
        });

        const formattedPayload = {
          ...message,
          sender: { id: user.id, username: user.username, picture: user.picture },
        };

        // Enviar via WebSocket em tempo real para o amigo se estiver online
        wsManager.sendToUser(friendId, {
          type: "MESSAGE_NEW",
          payload: formattedPayload,
        });

        // Criar notificação para o destinatário
        await prisma.notifications.create({
          data: {
            user_id: friendId,
            type: "MESSAGE",
            content: `${user.username}: ${content.slice(0, 40)}${content.length > 40 ? "..." : ""}`,
            thumbnail: user.picture,
          },
        });

        wsManager.sendToUser(friendId, {
          type: "NOTIFICATION_NEW",
          payload: {
            type: "MESSAGE",
            content: `Nova mensagem de ${user.username}`,
          },
        });

        return sucessResponse(message, "Mensagem enviada com sucesso!");
      },
      {
        body: t.Object({
          content: t.String({ minLength: 1, maxLength: 1000 }),
        }),
        detail: { tags: ["Messages"], description: "Envia uma mensagem privada para um amigo" },
        response: baseResponse,
      }
    )
    .patch(
      "/read/:friendId",
      async ({ user, prisma, params }) => {
        const friendId = Number(params.friendId);
        if (isNaN(friendId)) {
          return errorResponse("ID inválido", "ID inválido");
        }

        await prisma.messages.updateMany({
          where: {
            sender_id: friendId,
            receiver_id: user.id,
            viewed: false,
          },
          data: { viewed: true },
        });

        wsManager.sendToUser(friendId, {
          type: "MESSAGES_READ",
          payload: { byUserId: user.id },
        });

        return sucessResponse(null, "Mensagens marcadas como lidas");
      },
      {
        detail: { tags: ["Messages"], description: "Marca mensagens como lidas" },
        response: baseResponse,
      }
    );
});
