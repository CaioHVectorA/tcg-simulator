import { prisma } from "../helpers/prisma.client";

export interface WsEvent<T = any> {
  type: string;
  payload: T;
  timestamp?: string;
}

export class WebSocketManager {
  private static instance: WebSocketManager;
  // Map of userId -> Set of active WebSocket instances
  private connections: Map<number, Set<any>> = new Map();

  private constructor() {}

  public static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager();
    }
    return WebSocketManager.instance;
  }

  /**
   * Register a new socket connection for a given user
   */
  public async register(userId: number, ws: any) {
    if (!this.connections.has(userId)) {
      this.connections.set(userId, new Set());
    }

    const userSockets = this.connections.get(userId)!;
    userSockets.add(ws);

    // If first connection for this user, mark as online in DB
    if (userSockets.size === 1) {
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { online: true, last_online: new Date() },
        });
        this.broadcast({
          type: "USER_PRESENCE",
          payload: { userId, online: true },
        }, userId);
      } catch (err) {
        console.error(`[WS] Error updating user ${userId} online status:`, err);
      }
    }
  }

  /**
   * Unregister a socket connection when closed
   */
  public async unregister(userId: number, ws: any) {
    const userSockets = this.connections.get(userId);
    if (!userSockets) return;

    userSockets.delete(ws);

    if (userSockets.size === 0) {
      this.connections.delete(userId);
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { online: false, last_online: new Date() },
        });
        this.broadcast({
          type: "USER_PRESENCE",
          payload: { userId, online: false },
        }, userId);
      } catch (err) {
        console.error(`[WS] Error updating user ${userId} offline status:`, err);
      }
    }
  }

  /**
   * Check if a specific user is currently connected
   */
  public isOnline(userId: number): boolean {
    const sockets = this.connections.get(userId);
    return Boolean(sockets && sockets.size > 0);
  }

  /**
   * Get all currently online user IDs
   */
  public getOnlineUserIds(): number[] {
    return Array.from(this.connections.keys());
  }

  /**
   * Send an event to all open connections of a specific user
   */
  public sendToUser(userId: number, event: WsEvent): boolean {
    const sockets = this.connections.get(userId);
    if (!sockets || sockets.size === 0) return false;

    const message = JSON.stringify({
      ...event,
      timestamp: event.timestamp || new Date().toISOString(),
    });

    for (const socket of sockets) {
      try {
        socket.send(message);
      } catch (err) {
        console.error(`[WS] Failed to send message to user ${userId}:`, err);
      }
    }
    return true;
  }

  /**
   * Send an event to multiple users
   */
  public sendToUsers(userIds: number[], event: WsEvent) {
    for (const userId of userIds) {
      this.sendToUser(userId, event);
    }
  }

  /**
   * Broadcast an event to all connected users, optionally excluding one
   */
  public broadcast(event: WsEvent, excludeUserId?: number) {
    const message = JSON.stringify({
      ...event,
      timestamp: event.timestamp || new Date().toISOString(),
    });

    for (const [userId, sockets] of this.connections.entries()) {
      if (excludeUserId && userId === excludeUserId) continue;
      for (const socket of sockets) {
        try {
          socket.send(message);
        } catch (err) {
          console.error(`[WS] Failed to broadcast to user ${userId}:`, err);
        }
      }
    }
  }
}

export const wsManager = WebSocketManager.getInstance();
