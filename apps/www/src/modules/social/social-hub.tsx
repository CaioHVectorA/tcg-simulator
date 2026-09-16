"use client";

import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  UserPlus,
  Inbox,
  Send,
  MessageSquare,
  Gift,
  UserMinus,
  Check,
  X,
  Search,
  Loader2,
  Coins,
} from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { ChatDialog, ChatFriend } from "@/components/chat-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FriendUser {
  id: number;
  username: string;
  email: string;
  picture?: string;
  online?: boolean;
}

interface FriendRequest {
  id: number;
  user_id: number;
  username: string;
  email: string;
  picture?: string;
}

interface SentRequest {
  id: number;
  friend_id: number;
  username: string;
  email: string;
  picture?: string;
}

interface SearchUserResult {
  id: number;
  username: string;
  picture?: string;
  rarityPoints: number;
  totalBudget: number;
  online: boolean;
  relationStatus: "none" | "friend" | "sent" | "received";
  requestId?: number | null;
}

export const SocialHub: React.FC = () => {
  const { get, post, delete: del } = useApi();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Chat State
  const [chatFriend, setChatFriend] = useState<ChatFriend | null>(null);

  // Donation State
  const [donationFriend, setDonationFriend] = useState<FriendUser | null>(null);
  const [donationAmount, setDonationAmount] = useState<number>(100);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [friendFilter, setFriendFilter] = useState("");

  // 1. Query: Amigos
  const { data: friends = [], isLoading: loadingFriends } = useQuery<FriendUser[]>({
    queryKey: ["friends"],
    queryFn: async () => {
      const res = await get("/user/friends");
      return res.data.data ?? [];
    },
  });

  // 2. Query: Pedidos Recebidos
  const { data: receivedRequests = [], isLoading: loadingRequests } = useQuery<FriendRequest[]>({
    queryKey: ["requests"],
    queryFn: async () => {
      const res = await get("/user/requests");
      return res.data.data ?? [];
    },
  });

  // 3. Query: Pedidos Enviados
  const { data: sentRequests = [], isLoading: loadingSent } = useQuery<SentRequest[]>({
    queryKey: ["requests-sent"],
    queryFn: async () => {
      const res = await get("/user/requests/sent");
      return res.data.data ?? [];
    },
  });

  // 4. Query: Busca de Usuários
  const { data: searchResults = [], isFetching: searching } = useQuery<SearchUserResult[]>({
    queryKey: ["user-search", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim() || searchQuery.trim().length < 2) return [];
      const res = await get(`/user/search?q=${encodeURIComponent(searchQuery.trim())}`);
      return res.data.data ?? [];
    },
    enabled: searchQuery.trim().length >= 2,
  });

  // Mutações
  const { mutate: sendRequest, isPending: sendingRequest } = useMutation({
    mutationFn: async (userId: number) => {
      await post(`/user/send/${userId}`, {});
    },
    onSuccess: () => {
      toast({ title: "Solicitação enviada!", description: "Pedido de amizade enviado com sucesso." });
      queryClient.invalidateQueries({ queryKey: ["user-search"] });
      queryClient.invalidateQueries({ queryKey: ["requests-sent"] });
    },
    onError: (err: any) => {
      toast({ title: "Erro ao enviar pedido", description: err.response?.data?.toast || "Não foi possível enviar o pedido.", variant: "destructive" });
    },
  });

  const { mutate: acceptRequest } = useMutation({
    mutationFn: async (requestId: number) => {
      await post(`/user/accept/${requestId}`, {});
    },
    onSuccess: () => {
      toast({ title: "Amizade aceita!", description: "Agora vocês são amigos!" });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["requests"] });
    },
  });

  const { mutate: rejectRequest } = useMutation({
    mutationFn: async (requestId: number) => {
      await del(`/user/reject/${requestId}`);
    },
    onSuccess: () => {
      toast({ title: "Pedido recusado" });
      queryClient.invalidateQueries({ queryKey: ["requests"] });
    },
  });

  const { mutate: cancelSent } = useMutation({
    mutationFn: async (requestId: number) => {
      await del(`/user/remove-sent/${requestId}`);
    },
    onSuccess: () => {
      toast({ title: "Pedido cancelado" });
      queryClient.invalidateQueries({ queryKey: ["requests-sent"] });
    },
  });

  const { mutate: removeFriend } = useMutation({
    mutationFn: async (friendId: number) => {
      await del(`/user/remove/${friendId}`);
    },
    onSuccess: () => {
      toast({ title: "Amizade removida" });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
  });

  const { mutate: executeDonation, isPending: donating } = useMutation({
    mutationFn: async () => {
      if (!donationFriend) return;
      await post("/user/donate", { receiver_id: donationFriend.id, amount: donationAmount });
    },
    onSuccess: () => {
      toast({ title: "Doação enviada!", description: `${donationAmount} moedas doadas para ${donationFriend?.username}!` });
      queryClient.invalidateQueries({ queryKey: ["user"] });
      setDonationFriend(null);
    },
    onError: (err: any) => {
      toast({ title: "Falha na doação", description: err.response?.data?.toast || "Verifique seu saldo de moedas.", variant: "destructive" });
    },
  });

  const filteredFriends = friends.filter((f) =>
    f.username.toLowerCase().includes(friendFilter.toLowerCase())
  );

  return (
    <div className="w-full font-syne">
      <Tabs defaultValue="friends" className="w-full">
        <TabsList className="grid grid-cols-4 w-full h-11 rounded-xl p-1 bg-accent/50 mb-4">
          <TabsTrigger value="friends" className="rounded-lg text-xs flex items-center gap-1.5 data-[state=active]:bg-background">
            <Users className="size-3.5" />
            <span>Amigos ({friends.length})</span>
          </TabsTrigger>

          <TabsTrigger value="requests" className="rounded-lg text-xs flex items-center gap-1.5 data-[state=active]:bg-background relative">
            <Inbox className="size-3.5" />
            <span>Recebidos</span>
            {receivedRequests.length > 0 && (
              <span className="size-2 rounded-full bg-red-500 absolute top-1.5 right-1.5" />
            )}
          </TabsTrigger>

          <TabsTrigger value="sent" className="rounded-lg text-xs flex items-center gap-1.5 data-[state=active]:bg-background">
            <Send className="size-3.5" />
            <span>Enviados</span>
          </TabsTrigger>

          <TabsTrigger value="add" className="rounded-lg text-xs flex items-center gap-1.5 data-[state=active]:bg-background">
            <UserPlus className="size-3.5" />
            <span>Buscar</span>
          </TabsTrigger>
        </TabsList>

        {/* 1. ABA: AMIGOS */}
        <TabsContent value="friends" className="space-y-3">
          <div className="relative">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={friendFilter}
              onChange={(e) => setFriendFilter(e.target.value)}
              placeholder="Filtrar por nome de amigo..."
              className="pl-9 h-10 rounded-xl text-xs font-sans"
            />
          </div>

          <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {loadingFriends ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredFriends.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Users className="size-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-semibold">Nenhum amigo encontrado</p>
                <p className="text-xs mt-1">Use a aba "Buscar" para convidar outros treinadores!</p>
              </div>
            ) : (
              filteredFriends.map((friend) => (
                <div
                  key={friend.id}
                  className="p-3 bg-card border border-border/80 rounded-xl flex items-center justify-between gap-3 shadow-xs hover:border-border transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative">
                      <Avatar username={friend.username} src={friend.picture} className="size-10" />
                      {friend.online && (
                        <span className="absolute bottom-0 right-0 size-2.5 bg-emerald-500 rounded-full ring-2 ring-background" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate text-foreground">{friend.username}</p>
                      <span className="text-[11px] text-muted-foreground font-sans block">
                        {friend.online ? (
                          <span className="text-emerald-500 font-semibold">Online</span>
                        ) : (
                          "Offline"
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      size="icon"
                      variant="outline"
                      className="size-8 rounded-lg"
                      title="Abrir Chat"
                      onClick={() => setChatFriend(friend)}
                    >
                      <MessageSquare className="size-4 text-blue-500" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="size-8 rounded-lg"
                      title="Doar Moedas"
                      onClick={() => setDonationFriend(friend)}
                    >
                      <Gift className="size-4 text-pink-500" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-8 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                      title="Desfazer Amizade"
                      onClick={() => {
                        if (confirm(`Deseja remover ${friend.username} da sua lista de amigos?`)) {
                          removeFriend(friend.id);
                        }
                      }}
                    >
                      <UserMinus className="size-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        {/* 2. ABA: PEDIDOS RECEBIDOS */}
        <TabsContent value="requests" className="space-y-2">
          {loadingRequests ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : receivedRequests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Inbox className="size-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-semibold">Nenhum pedido pendente</p>
              <p className="text-xs mt-1">Você está em dia com todas as solicitações.</p>
            </div>
          ) : (
            receivedRequests.map((req) => (
              <div
                key={req.id}
                className="p-3 bg-card border border-border/80 rounded-xl flex items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <Avatar username={req.username} src={req.picture} className="size-9" />
                  <div>
                    <p className="text-sm font-bold text-foreground">{req.username}</p>
                    <span className="text-[11px] text-muted-foreground font-sans">Quer ser seu amigo</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-2.5"
                    onClick={() => acceptRequest(req.id)}
                  >
                    <Check className="size-3.5 mr-1" /> Aceitar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 rounded-lg text-xs px-2.5"
                    onClick={() => rejectRequest(req.id)}
                  >
                    <X className="size-3.5 mr-1" /> Recusar
                  </Button>
                </div>
              </div>
            ))
          )}
        </TabsContent>

        {/* 3. ABA: PEDIDOS ENVIADOS */}
        <TabsContent value="sent" className="space-y-2">
          {loadingSent ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : sentRequests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Send className="size-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm font-semibold">Nenhum pedido enviado</p>
              <p className="text-xs mt-1">Busque novos treinadores na aba "Buscar".</p>
            </div>
          ) : (
            sentRequests.map((req) => (
              <div
                key={req.id}
                className="p-3 bg-card border border-border/80 rounded-xl flex items-center justify-between gap-3 shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <Avatar username={req.username} src={req.picture} className="size-9" />
                  <div>
                    <p className="text-sm font-bold text-foreground">{req.username}</p>
                    <span className="text-[11px] text-muted-foreground font-sans">Aguardando resposta</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 rounded-lg text-xs text-muted-foreground hover:text-red-500"
                  onClick={() => cancelSent(req.id)}
                >
                  Cancelar
                </Button>
              </div>
            ))
          )}
        </TabsContent>

        {/* 4. ABA: BUSCAR TREINADORES */}
        <TabsContent value="add" className="space-y-3">
          <div className="relative">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Digite o nome de usuário (mín. 2 letras)..."
              className="pl-9 h-10 rounded-xl text-xs font-sans"
            />
          </div>

          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {searching ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
              </div>
            ) : searchQuery.trim().length >= 2 && searchResults.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <UserPlus className="size-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-semibold">Nenhum treinador com esse nome</p>
              </div>
            ) : (
              searchResults.map((user) => (
                <div
                  key={user.id}
                  className="p-3 bg-card border border-border/80 rounded-xl flex items-center justify-between gap-3 shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <Avatar username={user.username} src={user.picture} className="size-9" />
                    <div>
                      <p className="text-sm font-bold text-foreground">{user.username}</p>
                      <span className="text-[11px] text-muted-foreground font-sans">
                        {user.rarityPoints} pts de raridade
                      </span>
                    </div>
                  </div>

                  {user.relationStatus === "friend" ? (
                    <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
                      Amigos
                    </Badge>
                  ) : user.relationStatus === "sent" ? (
                    <Badge variant="secondary" className="text-xs">
                      Enviado
                    </Badge>
                  ) : user.relationStatus === "received" ? (
                    <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-400">
                      Pendente
                    </Badge>
                  ) : (
                    <Button
                      size="sm"
                      className="h-8 rounded-lg text-xs"
                      disabled={sendingRequest}
                      onClick={() => sendRequest(user.id)}
                    >
                      <UserPlus className="size-3.5 mr-1" /> Convidar
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Chat Dialog */}
      <ChatDialog
        friend={chatFriend}
        isOpen={Boolean(chatFriend)}
        onClose={() => setChatFriend(null)}
      />

      {/* Modal de Doação de Moedas */}
      <Dialog open={Boolean(donationFriend)} onOpenChange={(open) => !open && setDonationFriend(null)}>
        <DialogContent className="max-w-sm bg-card/95 border-border backdrop-blur-xl font-syne p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Gift className="size-5 text-pink-500" /> Doar Moedas
            </DialogTitle>
          </DialogHeader>

          {donationFriend && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-3 bg-accent/40 p-3 rounded-xl">
                <Avatar username={donationFriend.username} src={donationFriend.picture} className="size-10" />
                <div>
                  <p className="text-sm font-bold">{donationFriend.username}</p>
                  <p className="text-xs text-muted-foreground font-sans">Enviar presente de moedas</p>
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground block mb-1.5 font-sans">
                  Quantidade de Moedas:
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    value={donationAmount}
                    onChange={(e) => setDonationAmount(Math.max(1, Number(e.target.value)))}
                    className="h-10 rounded-xl font-mono text-base"
                  />
                  <Coins className="size-6 text-amber-400 shrink-0" />
                </div>
              </div>

              <div className="flex gap-2">
                {[100, 500, 1000, 5000].map((val) => (
                  <Button
                    key={val}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setDonationAmount(val)}
                    className={`flex-1 text-xs rounded-lg ${donationAmount === val ? "border-primary bg-primary/10" : ""}`}
                  >
                    {val}
                  </Button>
                ))}
              </div>

              <Button
                onClick={() => executeDonation()}
                disabled={donating || donationAmount <= 0}
                className="w-full h-11 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold"
              >
                {donating ? <Loader2 className="size-4 animate-spin mr-2" /> : <Gift className="size-4 mr-2" />}
                Confirmar Doação
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
