import { useWebSocket } from "@/context/WebSocketContext";

export function useSocket() {
  const { sendMessage, sendFriendRequest, sendTradeRequest, socket } =
    useWebSocket();

  return { sendMessage, sendFriendRequest, sendTradeRequest, socket };
}
