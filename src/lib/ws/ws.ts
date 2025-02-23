// websocket.ts
import { Elysia } from "elysia";
import {
  WSEvent,
  type WSMessage,
  type MessageContent,
  type FriendRequestContent,
  type TradeRequestContent,
} from "./types";
import type { ServerWebSocket } from "bun";
import type { ElysiaWS } from "elysia/ws";
import { prisma } from "../../helpers/prisma.client";

type Connection = {
  ws: ElysiaWS<ServerWebSocket<any>>;
  userId: number;
};

const connections = new Map<number, Connection>();
const events: WSMessage[] = [];

export const ws = new Elysia().ws("/ws", {
  open(ws) {
    const userId = Number(ws.data.query.userId!);
    if (!userId) {
      ws.close();
      return;
    }
    //@ts-ignore
    connections.set(userId, { ws, userId });
    console.log(`User ${userId} connected`);
  },

  async message(ws, rawMessage) {
    const senderId = Number(ws.data.query.userId!);
    console.log({ senderId, rawMessage });
    try {
      const message = (
        typeof rawMessage === "string" ? JSON.parse(rawMessage) : rawMessage
      ) as WSMessage;

      // Validar estrutura básica
      if (!message.event || !Object.values(WSEvent).includes(message.event)) {
        throw new Error("Evento inválido");
      }

      // Adicionar timestamp do servidor
      const serverTimestamp = Date.now();

      // Construir evento completo
      const fullEvent: WSMessage = {
        ...message,
        timestamp: serverTimestamp,
      };

      // Armazenar evento
      events.push(fullEvent);

      // Processar diferentes tipos de eventos
      switch (message.event) {
        case WSEvent.Message:
          await handleMessage(senderId, message.content as MessageContent);
          break;

        case WSEvent.FriendRequest:
          await handleFriendRequest(
            senderId,
            message.content as FriendRequestContent
          );
          break;

        case WSEvent.TradeRequest:
          await handleTradeRequest(
            senderId,
            message.content as TradeRequestContent
          );
          break;
      }

      // Confirmar recebimento
      ws.send(
        JSON.stringify({
          status: "EVENT_RECEIVED",
          eventId: fullEvent.timestamp,
        })
      );
    } catch (error) {
      console.error("Erro no processamento:", error);
      ws.send(
        JSON.stringify({
          error: "INVALID_EVENT_FORMAT",
          message: (error as any).message,
        })
      );
    }
  },

  close(ws) {
    const userId = Number(ws.data.query.userId!);
    if (connections.get(userId)?.ws === ws) {
      connections.delete(userId);
      console.log(`User ${userId} disconnected`);
    }
  },
});

// Handlers para diferentes tipos de eventos
async function handleMessage(senderId: number, content: MessageContent) {
  const recipient = connections.get(content.to);
  if (!recipient) return;

  const message: WSMessage<MessageContent> = {
    event: WSEvent.Message,
    content: {
      to: content.to,
      text: content.text,
      from: senderId,
    },
    timestamp: Date.now(),
  };
  await prisma.message.create({
    data: {
      receiver_id: content.to,
      sender_id: senderId,
      content: content.text,
    },
  });
  recipient.ws.send(JSON.stringify(message));
}

async function handleFriendRequest(
  senderId: number,
  content: FriendRequestContent
) {
  const recipient = connections.get(content.to);
  if (!recipient) return;

  const request: WSMessage<FriendRequestContent> = {
    event: WSEvent.FriendRequest,
    content: {
      from: senderId,
      to: content.to,
    },
    timestamp: Date.now(),
  };

  recipient.ws.send(JSON.stringify(request));
}

async function handleTradeRequest(
  senderId: number,
  content: TradeRequestContent
) {
  const recipient = connections.get(content.recipient);
  if (!recipient) return;

  const request: WSMessage<TradeRequestContent> = {
    event: WSEvent.TradeRequest,
    content: {
      initiator: senderId,
      recipient: content.recipient,
      items: content.items,
    },
    timestamp: Date.now(),
  };

  recipient.ws.send(JSON.stringify(request));
}
