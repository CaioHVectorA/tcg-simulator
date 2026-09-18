"use client";

import React from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Bell, CheckCheck, MessageSquare, UserPlus, RefreshCw, Gift, Sparkles, Check } from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface NotificationItem {
  id: number;
  type: string;
  content: string;
  thumbnail?: string;
  createdAt: string;
  viewed: boolean;
}

export const NotificationsPopover: React.FC = () => {
  const { get, patch } = useApi();
  const queryClient = useQueryClient();

  const { data } = useQuery<{ notifications: NotificationItem[]; unreadCount: number }>({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await get("/notifications");
      return res.data.data ?? { notifications: [], unreadCount: 0 };
    },
    refetchInterval: 15000,
  });

  const { mutate: markAllRead } = useMutation({
    mutationFn: async () => {
      await patch("/notifications/read-all", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const { mutate: markRead } = useMutation({
    mutationFn: async (id: number) => {
      await patch(`/notifications/${id}/read`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  const getIcon = (type: string) => {
    switch (type) {
      case "MESSAGE":
        return <MessageSquare className="size-4 text-blue-400" />;
      case "FRIEND_REQUEST":
      case "FRIEND_ACCEPTED":
        return <UserPlus className="size-4 text-emerald-400" />;
      case "TRADE_ACCEPTED":
      case "TRADE_OFFER":
        return <RefreshCw className="size-4 text-amber-400" />;
      case "DONATION":
        return <Gift className="size-4 text-pink-400" />;
      default:
        return <Sparkles className="size-4 text-purple-400" />;
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative size-10 rounded-full">
          <Bell className="size-5 text-foreground" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 size-4 rounded-full bg-red-500 text-white font-mono text-[10px] font-bold flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
          <span className="sr-only">Notificações</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 sm:w-96 p-0 font-syne bg-card/95 border-border backdrop-blur-xl shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-base">Notificações</h4>
            {unreadCount > 0 && (
              <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full font-mono">
                {unreadCount} nova{unreadCount > 1 ? "s" : ""}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllRead()}
              className="text-xs text-muted-foreground hover:text-foreground h-8 px-2"
            >
              <CheckCheck className="size-3.5 mr-1" /> Ler todas
            </Button>
          )}
        </div>

        <div className="max-h-[380px] overflow-y-auto divide-y divide-border/60">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="size-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-semibold">Tudo tranquilo por aqui!</p>
              <p className="text-xs mt-1">Nenhuma notificação recente.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.viewed && markRead(n.id)}
                className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer hover:bg-accent/50 ${
                  !n.viewed ? "bg-primary/5" : ""
                }`}
              >
                <div className="mt-0.5 p-2 rounded-xl bg-accent/60 shrink-0">
                  {getIcon(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-xs leading-snug font-sans ${!n.viewed ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                    {n.content}
                  </p>
                  <span className="text-[10px] text-muted-foreground/70 font-mono mt-1 block">
                    {new Date(n.createdAt).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                {!n.viewed && (
                  <span className="size-2 rounded-full bg-primary mt-2 shrink-0" />
                )}
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};
