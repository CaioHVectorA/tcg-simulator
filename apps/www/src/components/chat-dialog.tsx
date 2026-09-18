"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/avatar";
import { Send, Loader2 } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWebSocket } from "@/context/WebSocketContext";
import { useUser } from "@/context/UserContext";

export interface ChatFriend {
  id: number;
  username: string;
  picture?: string;
  online?: boolean;
}

interface ChatDialogProps {
  friend: ChatFriend | null;
  isOpen: boolean;
  onClose: () => void;
}

interface MessageItem {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  createdAt: string;
  viewed: boolean;
}

export const ChatDialog: React.FC<ChatDialogProps> = ({
  friend,
  isOpen,
  onClose,
}) => {
  const { get, post, patch } = useApi();
  const { id: myUserId } = useUser();
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { subscribe } = useWebSocket();

  const { data: messages = [], isLoading } = useQuery<MessageItem[]>({
    queryKey: ["messages", friend?.id],
    queryFn: async () => {
      if (!friend?.id) return [];
      const res = await get(`/messages/${friend.id}`);
      return res.data.data ?? [];
    },
    enabled: Boolean(friend?.id && isOpen),
    refetchInterval: 10000, // Fallback polling além do WS
  });

  // Marcar como lidas ao abrir
  useEffect(() => {
    if (friend?.id && isOpen) {
      patch(`/messages/read/${friend.id}`, {}).catch(() => {});
    }
  }, [friend?.id, isOpen, patch]);

  // Listener para mensagens recebidas em tempo real
  useEffect(() => {
    if (!friend?.id || !isOpen) return;

    const unsubscribe = subscribe("MESSAGE_NEW", (payload) => {
      if (payload?.sender_id === friend.id || payload?.receiver_id === friend.id) {
        queryClient.invalidateQueries({ queryKey: ["messages", friend.id] });
      }
    });

    return () => unsubscribe();
  }, [friend?.id, isOpen, subscribe, queryClient]);

  // Auto-scroll para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const { mutate: sendMessage, isPending: isSending } = useMutation({
    mutationFn: async (text: string) => {
      if (!friend?.id) return;
      const res = await post(`/messages/${friend.id}`, { content: text });
      return res.data.data;
    },
    onSuccess: () => {
      setInputText("");
      queryClient.invalidateQueries({ queryKey: ["messages", friend?.id] });
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;
    sendMessage(inputText.trim());
  };

  if (!friend) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg h-[600px] max-h-[90vh] flex flex-col p-0 gap-0 bg-card/95 border-border backdrop-blur-xl font-syne overflow-hidden">
        {/* Header com avatar e status */}
        <DialogHeader className="p-4 border-b border-border flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar username={friend.username} src={friend.picture} className="size-10" />
              {friend.online && (
                <span className="absolute bottom-0 right-0 size-2.5 bg-emerald-500 rounded-full ring-2 ring-background" />
              )}
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground leading-none">
                {friend.username}
              </DialogTitle>
              <span className="text-xs text-muted-foreground font-sans">
                {friend.online ? "Online agora" : "Offline"}
              </span>
            </div>
          </div>
        </DialogHeader>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 font-sans text-sm">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <p className="font-syne font-bold text-base mb-1">Nenhuma mensagem ainda</p>
              <p className="text-xs max-w-xs">Diga oi para seu amigo e iniciem uma nova conversa ou combinem trocas!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = String(msg.sender_id) === String(myUserId);
              const time = new Date(msg.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                      isMine
                        ? "bg-primary text-primary-foreground rounded-br-xs"
                        : "bg-muted text-foreground rounded-bl-xs"
                    }`}
                  >
                    <p className="break-words leading-relaxed">{msg.content}</p>
                    <span
                      className={`text-[10px] block mt-1 ${
                        isMine ? "text-primary-foreground/70 text-right" : "text-muted-foreground"
                      }`}
                    >
                      {time}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <form onSubmit={handleSend} className="p-3 border-t border-border flex items-center gap-2 bg-background/50">
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Conversar com ${friend.username}...`}
            className="flex-1 font-sans text-sm h-10 rounded-xl"
            autoFocus
          />
          <Button
            type="submit"
            size="icon"
            disabled={!inputText.trim() || isSending}
            className="rounded-xl size-10 shrink-0"
          >
            {isSending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
