import { useUser } from "@/context/UserContext";
import { useEffect, useRef } from "react";

const HEARTBEAT_INTERVAL = 30000; // 30 segundos
const URL = process.env.NEXT_PUBLIC_WS_URL;
export function useWebSocket() {
  const socketRef = useRef<WebSocket | null>(null);
  const heartbeatRef = useRef<number | null>(null);
  const { id } = useUser();
  useEffect(() => {
    // Função para enviar um Heartbeat
    const sendHeartbeat = () => {
      if (
        socketRef.current &&
        socketRef.current.readyState === WebSocket.OPEN
      ) {
        socketRef.current.send(JSON.stringify({ event: "HEARTBEAT" }));
      }
    };

    // Conectar ao WebSocket
    socketRef.current = new WebSocket(`${URL}?userId=${id}`);

    socketRef.current.onopen = () => {
      console.log("Conectado ao WebSocket");
      // Iniciar o intervalo de Heartbeat
      heartbeatRef.current = window.setInterval(
        sendHeartbeat,
        HEARTBEAT_INTERVAL
      );
    };

    socketRef.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log("Mensagem recebida:", message);
    };

    socketRef.current.onclose = () => {
      console.log("Desconectado do WebSocket");
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
    };

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current);
      }
    };
  }, [id]);

  const sendMessage = (to: number, text: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const message = {
        event: "MESSAGE",
        content: { to, text },
      };
      socketRef.current.send(JSON.stringify(message));
    }
  };

  const sendFriendRequest = (to: number) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const request = {
        event: "FRIEND_REQUEST",
        content: { to },
      };
      socketRef.current.send(JSON.stringify(request));
    }
  };

  const sendTradeRequest = (recipient: number) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const request = {
        event: "TRADE_REQUEST",
        content: { recipient },
      };
      socketRef.current.send(JSON.stringify(request));
    }
  };

  return {
    socket: socketRef.current,
    sendMessage,
    sendFriendRequest,
    sendTradeRequest,
  };
}
