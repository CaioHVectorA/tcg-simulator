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
import { Send, Loader2, MessageSquare } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { api } from "@/lib/api";
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
  const { id: myUserId } = useUser();
  const [inputText, setInputText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const { subscribe } = useWebSocket();
  const hasMarkedReadRef = useRef<number | null>(null);

  const { data: messages = [], isLoading } = useQuery<MessageItem[]>({
    queryKey: ["messages", friend?.id],
    queryFn: async () => {
      if (!friend?.id) return [];
      const res = await api.get(`/messages/${friend.id}`);
      return res.data?.data ?? [];
    },
    enabled: Boolean(friend?.id && isOpen),
    refetchInterval: 8000,
  });

  // Marcar como lidas apenas uma vez por abertura/amigo (evita loop e vazamento de memória)
  useEffect(() => {
    if (friend?.id && isOpen) {
      if (hasMarkedReadRef.current !== friend.id) {
        hasMarkedReadRef.current = friend.id;
        api.patch(`/messages/read/${friend.id}`).catch(() => {});
      }
    } else {
      hasMarkedReadRef.current = null;
    }
  }, [friend?.id, isOpen]);

  // Listener para mensagens recebidas em tempo real via WebSocket
  useEffect(() => {
    if (!friend?.id || !isOpen) return;

    const unsubscribe = subscribe("MESSAGE_NEW", (payload) => {
      if (payload?.sender_id === friend.id || payload?.receiver_id === friend.id) {
        queryClient.invalidateQueries({ queryKey: ["messages", friend.id] });
      }
    });

    return () => unsubscribe();
  }, [friend?.id, isOpen, subscribe, queryClient]);

  // Auto-scroll suave para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const { mutate: sendMessage, isPending: isSending } = useMutation({
    mutationFn: async (text: string) => {
      if (!friend?.id) return;
      const res = await api.post(`/messages/${friend.id}`, { content: text });
      return res.data?.data;
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
      <DialogContent className="max-w-lg h-[620px] max-h-[92vh] flex flex-col p-0 gap-0 bg-background border-border shadow-2xl font-syne overflow-hidden rounded-2xl">
        {/* Header com avatar e status */}
        <DialogHeader className="p-4 border-b border-border/80 flex flex-row items-center justify-between space-y-0 bg-card/60 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar username={friend.username} src={friend.picture} className="size-10 border border-border/60" />
              {friend.online ? (
                <span className="absolute bottom-0 right-0 size-3 bg-emerald-500 rounded-full ring-2 ring-background animate-pulse" />
              ) : (
                <span className="absolute bottom-0 right-0 size-2.5 bg-slate-400 rounded-full ring-2 ring-background" />
              )}
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground leading-tight">
                {friend.username}
              </DialogTitle>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`size-1.5 rounded-full ${
                    friend.online ? "bg-emerald-500" : "bg-slate-400"
                  }`}
                />
                <span className="text-[11px] font-sans font-medium text-muted-foreground">
                  {friend.online ? "Online agora" : "Offline"}
                </span>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 font-sans text-sm bg-muted/20">
          {isLoading ? (
            <div className="flex flex-col justify-center items-center h-full gap-2 text-muted-foreground">
              <Loader2 className="size-6 animate-spin text-amber-500" />
              <span className="text-xs">Carregando conversa...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground gap-2 p-6">
              <div className="size-12 rounded-full bg-secondary/80 flex items-center justify-center text-foreground/60 mb-1">
                <MessageSquare className="size-6" />
              </div>
              <p className="font-syne font-bold text-base text-foreground">Inicie uma conversa!</p>
              <p className="text-xs max-w-xs text-muted-foreground">
                Envie uma mensagem para {friend.username} para combinar trocas e interagir.
              </p>
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
                    className={`max-w-[78%] rounded-2xl px-4 py-2.5 shadow-sm transition-all ${
                      isMine
                        ? "bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-medium rounded-br-xs"
                        : "bg-card text-foreground border border-border/80 rounded-bl-xs"
                    }`}
                  >
                    <p className="break-words leading-relaxed text-[13px]">{msg.content}</p>
                    <span
                      className={`text-[10px] block mt-1 font-mono ${
                        isMine ? "text-slate-900/70 text-right font-bold" : "text-muted-foreground"
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
        <form onSubmit={handleSend} className="p-3 border-t border-border/80 flex items-center gap-2 bg-card/60">
          <Input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Mensagem para ${friend.username}...`}
            className="flex-1 font-sans text-sm h-11 rounded-xl bg-background border-border/80 text-foreground placeholder:text-muted-foreground"
            autoFocus
          />
          <Button
            type="submit"
            size="icon"
            disabled={!inputText.trim() || isSending}
            className="rounded-xl size-11 shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-sm"
          >
            {isSending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
