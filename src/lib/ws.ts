import { Elysia } from "elysia";

// Store active connections and messages
const connections = new Map<string, WebSocket>();
const messages: Array<{
  from: string;
  to: string;
  message: string;
  timestamp: number;
}> = [];

const _ws = new Elysia().ws("/ws", {
  open(ws) {
    // Extract user ID from query params
    const userId = ws.data.query.userId;

    if (!userId) {
      ws.close();
      console.error("User ID not provided");
      return;
    }

    // Store connection
    connections.set(userId, ws);
    console.log(`User ${userId} connected`);
  },
  message(ws, message) {
    const senderId = ws.data.query.userId;
    console.log({ message });
    try {
      // Validate message format
      // if (typeof message !== "string") throw new Error("Invalid message type");
      const normalizedMessage =
        typeof message === "string" ? JSON.parse(message) : message;
      const { to, message: content } = normalizedMessage;
      console.log({ message, to, content });
      if (!to || !content) throw new Error("Invalid message format");

      // Create message object
      const newMessage = {
        from: senderId,
        to,
        message: content,
        timestamp: Date.now(),
      };

      // Store message
      messages.push(newMessage);

      // Forward message to recipient if connected
      const recipient = connections.get(to);
      recipient?.send(JSON.stringify(newMessage));

      // Send confirmation to sender
      ws.send(
        JSON.stringify({
          status: "sent",
          timestamp: newMessage.timestamp,
        })
      );
    } catch (error) {
      console.error("Message handling error:", error);
      ws.send(
        JSON.stringify({
          error: "Invalid message format. Use { to: string, message: string }",
        })
      );
    }
  },
  close(ws) {
    const userId = ws.data.query.userId;

    // Cleanup connection
    if (connections.get(userId) === ws) {
      connections.delete(userId);
      console.log(`User ${userId} disconnected`);
    }
  },
});

export const ws = _ws;
