"use client";

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { WS_URL } from "@/lib/api";
import { getCookie } from "@/lib/cookies";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { soundFx } from "@/lib/sound-fx";

export interface WsMessage<T = any> {
  type: string;
  payload?: T;
  timestamp?: string;
  [key: string]: any;
}

interface WebSocketContextType {
  isConnected: boolean;
  send: (type: string, payload?: any) => void;
  lastMessage: WsMessage | null;
  subscribe: (type: string, handler: (payload: any) => void) => () => void;
  socket: WebSocket | null;
  sendMessage: (to: number, text: string) => void;
  sendFriendRequest: (to: number) => void;
  sendTradeRequest: (recipient: number) => void;
  acceptFriendRequest: (from: number) => void;
}

const WebSocketContext = createContext<WebSocketContextType>({
  isConnected: false,
  send: () => {},
  lastMessage: null,
  subscribe: () => () => {},
  socket: null,
  sendMessage: () => {},
  sendFriendRequest: () => {},
  sendTradeRequest: () => {},
  acceptFriendRequest: () => {},
});

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WsMessage | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef<Map<string, Set<(payload: any) => void>>>(new Map());
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const connect = useCallback(() => {
    if (typeof window === "undefined") return;

    const token = getCookie("token");
    if (!token) return;

    if (socketRef.current?.readyState === WebSocket.OPEN) return;

    try {
      const wsUrl = `${WS_URL}/ws?token=${token}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnected(true);
        // Iniciar ping heartbeat a cada 25 segundos
        const pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping" }));
          } else {
            clearInterval(pingInterval);
          }
        }, 25000);
      };

      ws.onmessage = (event) => {
        try {
          const data: WsMessage = JSON.parse(event.data);
          setLastMessage(data);

          // Disparar handlers registrados
          const listeners = handlersRef.current.get(data.type);
          if (listeners) {
            listeners.forEach((cb) => cb(data.payload));
          }

          // Disparar toasts e atualizar TanStack Query automaticamente
          switch (data.type) {
            case "MESSAGE_NEW":
              queryClient.invalidateQueries({ queryKey: ["messages"] });
              queryClient.invalidateQueries({ queryKey: ["notifications"] });
              soundFx.playRareChime();
              toast({
                title: "Nova mensagem!",
                description: `${data.payload?.sender?.username || "Amigo"}: ${data.payload?.content || ""}`,
              });
              break;

            case "FRIEND_REQUEST":
              queryClient.invalidateQueries({ queryKey: ["friends"] });
              queryClient.invalidateQueries({ queryKey: ["requests"] });
              queryClient.invalidateQueries({ queryKey: ["notifications"] });
              toast({
                title: "Novo pedido de amizade!",
                description: `${data.payload?.from?.username || "Alguém"} quer ser seu amigo.`,
              });
              break;

            case "FRIEND_ACCEPTED":
              queryClient.invalidateQueries({ queryKey: ["friends"] });
              queryClient.invalidateQueries({ queryKey: ["notifications"] });
              toast({
                title: "Amizade aceita!",
                description: `${data.payload?.by?.username || "Seu amigo"} aceitou seu pedido!`,
              });
              break;

            case "TRADE_ACCEPTED":
              queryClient.invalidateQueries({ queryKey: ["user"] });
              queryClient.invalidateQueries({ queryKey: ["trades"] });
              queryClient.invalidateQueries({ queryKey: ["cards"] });
              queryClient.invalidateQueries({ queryKey: ["notifications"] });
              soundFx.playSuccess();
              toast({
                title: "Troca aceita!",
                description: `${data.payload?.by || "Um treinador"} aceitou sua troca "${data.payload?.tradeName || ""}"!`,
              });
              break;

            case "TRADE_OFFER_NEW":
              queryClient.invalidateQueries({ queryKey: ["trades"] });
              queryClient.invalidateQueries({ queryKey: ["notifications"] });
              toast({
                title: "Nova proposta de troca!",
                description: `${data.payload?.from || "Alguém"} enviou uma oferta na sua troca.`,
              });
              break;

            case "DONATION_RECEIVED":
              queryClient.invalidateQueries({ queryKey: ["user"] });
              queryClient.invalidateQueries({ queryKey: ["notifications"] });
              soundFx.playRareChime();
              toast({
                title: "Moedas recebidas!",
                description: `Você recebeu ${data.payload?.amount || 0} moedas de presente de ${data.payload?.from?.username || "um amigo"}!`,
              });
              break;

            case "TRADE_NEW":
              queryClient.invalidateQueries({ queryKey: ["trades"] });
              break;

            default:
              break;
          }
        } catch (err) {
          console.error("[WS Client] Error parsing incoming message:", err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        socketRef.current = null;
        // Tentativa de reconexão automática após 4 segundos
        if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 4000);
      };

      ws.onerror = (err) => {
        console.warn("[WS Client] Connection warning/error:", err);
        ws.close();
      };

      socketRef.current = ws;
    } catch (err) {
      console.error("[WS Client] Failed to establish connection:", err);
    }
  }, [toast, queryClient]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [connect]);

  const send = useCallback((type: string, payload: any = {}) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type, payload }));
    }
  }, []);

  const subscribe = useCallback((type: string, handler: (payload: any) => void) => {
    if (!handlersRef.current.has(type)) {
      handlersRef.current.set(type, new Set());
    }
    handlersRef.current.get(type)!.add(handler);

    return () => {
      handlersRef.current.get(type)?.delete(handler);
    };
  }, []);

  const sendMessage = useCallback((to: number, text: string) => {
    send("MESSAGE", { to, text });
  }, [send]);

  const sendFriendRequest = useCallback((to: number) => {
    send("FRIEND_REQUEST", { to });
  }, [send]);

  const sendTradeRequest = useCallback((recipient: number) => {
    send("TRADE_REQUEST", { recipient });
  }, [send]);

  const acceptFriendRequest = useCallback((from: number) => {
    send("FRIEND_REQUEST_ACCEPTED", { from });
  }, [send]);

  return (
    <WebSocketContext.Provider
      value={{
        isConnected,
        send,
        lastMessage,
        subscribe,
        socket: socketRef.current,
        sendMessage,
        sendFriendRequest,
        sendTradeRequest,
        acceptFriendRequest,
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => useContext(WebSocketContext);
