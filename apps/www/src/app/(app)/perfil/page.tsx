"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Avatar } from "@/components/avatar";
import {
  User,
  Sparkles,
  Coins,
  Layers,
  Award,
  RefreshCw,
  Trophy,
  Edit2,
  Trash2,
  Loader2,
  Check,
  Camera,
} from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { loadTcgImg } from "@/lib/load-tcg-img";
import { CardDetailModal, CardModalData } from "@/components/card-detail-modal";
import { AvatarPickerModal } from "@/components/avatar-picker-modal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ProfileData {
  user: {
    id: number;
    username: string;
    email: string;
    picture: string;
    money: number;
    rarityPoints: number;
    totalBudget: number;
    createdAt: string;
  };
  stats: {
    totalCards: number;
    uniqueCards: number;
    openedPackages: number;
    completedQuests: number;
    tradesDone: number;
    level: number;
    xp: number;
    nextLevelXp: number;
    levelProgress: number;
  };
  topCards: CardModalData[];
}

export default function PerfilPage() {
  const { get, post, patch } = useApi();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedCard, setSelectedCard] = useState<CardModalData | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newPicture, setNewPicture] = useState("");

  const { data, isLoading } = useQuery<ProfileData>({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const res = await get("/user/profile");
      return res.data.data;
    },
  });

  const { mutate: recycleDuplicates, isPending: recycling } = useMutation({
    mutationFn: async () => {
      const res = await post("/user/recycle-duplicates", {});
      return res.data;
    },
    onSuccess: (res) => {
      toast({
        title: "Cartas Recicladas!",
        description: res.toast || "Cópias repetidas foram transformadas em moedas.",
      });
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["cards"] });
    },
    onError: (err: any) => {
      toast({
        title: "Erro ao reciclar",
        description: err.response?.data?.toast || "Nenhuma carta repetida encontrada.",
        variant: "destructive",
      });
    },
  });

  const { mutate: updateProfile, isPending: updating } = useMutation({
    mutationFn: async () => {
      const payload: any = {};
      if (newUsername.trim()) payload.username = newUsername.trim();
      if (newPicture.trim()) payload.picture = newPicture.trim();
      const res = await patch("/user/profile", payload);
      return res.data;
    },
    onSuccess: () => {
      toast({ title: "Perfil atualizado com sucesso!" });
      setEditModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
    onError: (err: any) => {
      toast({
        title: "Falha na atualização",
        description: err.response?.data?.toast || "Verifique os dados informados.",
        variant: "destructive",
      });
    },
  });

  if (isLoading || !data) {
    return (
      <div className="py-24 flex justify-center items-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  const { user, stats, topCards } = data;

  const handleOpenEdit = () => {
    setNewUsername(user.username);
    setNewPicture(user.picture || "");
    setEditModalOpen(true);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl font-syne">
      {/* Banner & Perfil do Treinador */}
      <div className="bg-card/70 border border-border/80 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-md mb-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div
            className="relative group cursor-pointer"
            onClick={() => setAvatarPickerOpen(true)}
            title="Clique para alterar avatar"
          >
            <Avatar username={user.username} src={user.picture} className="size-24 sm:size-28 shadow-xl group-hover:opacity-85 transition-opacity" />
            <div className="absolute inset-0 rounded-full bg-black/45 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[10px] font-bold gap-1">
              <Camera className="size-5" />
              <span>Trocar</span>
            </div>
            <Badge className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 font-mono font-bold text-xs bg-primary text-primary-foreground px-2.5 shadow-sm pointer-events-none">
              NV. {stats.level}
            </Badge>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                  {user.username}
                </h1>
                <p className="text-xs text-muted-foreground font-sans mt-0.5">
                  Membro desde {new Date(user.createdAt).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
                </p>
              </div>

              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenEdit}
                  className="rounded-xl text-xs h-9"
                >
                  <Edit2 className="size-3.5 mr-1.5" /> Editar Perfil
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => recycleDuplicates()}
                  disabled={recycling}
                  className="rounded-xl text-xs h-9 bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500/20"
                >
                  {recycling ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : <Trash2 className="size-3.5 mr-1.5" />}
                  Reciclar Repetidas
                </Button>
              </div>
            </div>

            {/* Barra de XP */}
            <div className="mt-4 bg-accent/40 rounded-2xl p-3 border border-border/40">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-sans text-muted-foreground font-semibold">Progresso para o Nível {stats.level + 1}</span>
                <span className="font-mono font-bold text-foreground">{stats.xp} / {stats.nextLevelXp} XP</span>
              </div>
              <Progress value={stats.levelProgress} className="h-2.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Estatísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4 mb-8">
        <div className="bg-card border border-border/80 rounded-2xl p-4 text-center shadow-xs">
          <Layers className="size-5 mx-auto mb-1.5 text-blue-400" />
          <span className="text-2xl font-bold font-mono text-foreground block">{stats.totalCards}</span>
          <span className="text-[11px] text-muted-foreground font-sans">Total de Cartas</span>
        </div>

        <div className="bg-card border border-border/80 rounded-2xl p-4 text-center shadow-xs">
          <Sparkles className="size-5 mx-auto mb-1.5 text-amber-400" />
          <span className="text-2xl font-bold font-mono text-foreground block">{stats.uniqueCards}</span>
          <span className="text-[11px] text-muted-foreground font-sans">Cartas Únicas</span>
        </div>

        <div className="bg-card border border-border/80 rounded-2xl p-4 text-center shadow-xs">
          <Trophy className="size-5 mx-auto mb-1.5 text-purple-400" />
          <span className="text-2xl font-bold font-mono text-foreground block">{user.rarityPoints}</span>
          <span className="text-[11px] text-muted-foreground font-sans">Pts de Raridade</span>
        </div>

        <div className="bg-card border border-border/80 rounded-2xl p-4 text-center shadow-xs">
          <Coins className="size-5 mx-auto mb-1.5 text-yellow-400" />
          <span className="text-2xl font-bold font-mono text-foreground block">{user.money}</span>
          <span className="text-[11px] text-muted-foreground font-sans">Moedas</span>
        </div>

        <div className="bg-card border border-border/80 rounded-2xl p-4 text-center shadow-xs">
          <Award className="size-5 mx-auto mb-1.5 text-emerald-400" />
          <span className="text-2xl font-bold font-mono text-foreground block">{stats.completedQuests}</span>
          <span className="text-[11px] text-muted-foreground font-sans">Missões Concluídas</span>
        </div>

        <div className="bg-card border border-border/80 rounded-2xl p-4 text-center shadow-xs">
          <RefreshCw className="size-5 mx-auto mb-1.5 text-pink-400" />
          <span className="text-2xl font-bold font-mono text-foreground block">{stats.tradesDone}</span>
          <span className="text-[11px] text-muted-foreground font-sans">Trocas Feitas</span>
        </div>
      </div>

      {/* Top 5 Cartas Raras */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="size-5 text-amber-400" /> Suas Cartas Mais Raras
          </h2>
          <span className="text-xs text-muted-foreground font-sans">Clique para inspecionar</span>
        </div>

        {topCards.length === 0 ? (
          <div className="bg-card border border-border/80 rounded-2xl p-12 text-center text-muted-foreground">
            <Layers className="size-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-semibold">Nenhuma carta descoberta ainda</p>
            <p className="text-xs mt-1">Abra pacotes na Loja para começar sua coleção lendária!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {topCards.map((card) => (
              <div
                key={card.id}
                onClick={() => setSelectedCard(card)}
                className="group relative bg-card border border-border/80 hover:border-amber-400/60 rounded-2xl p-2.5 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              >
                <div className="relative rounded-xl overflow-hidden aspect-[2.5/3.5] mb-2">
                  <img
                    src={loadTcgImg(card.image_url)}
                    alt={card.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <Badge className="absolute top-1.5 right-1.5 bg-black/70 text-amber-300 text-[10px] font-mono backdrop-blur-xs">
                    ★ Tier {card.rarity}
                  </Badge>
                </div>
                <p className="text-xs font-bold text-foreground truncate text-center">{card.name}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Edição de Perfil */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-md bg-card/95 border-border backdrop-blur-xl font-syne p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Editar Perfil</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2 font-sans text-sm">
            <div>
              <label className="text-xs font-semibold text-muted-foreground block mb-1">
                Nome de Usuário (mín. 3 letras):
              </label>
              <Input
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Seu novo nome de treinador"
                className="rounded-xl h-10 font-syne"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-muted-foreground block">
                  Avatar do Perfil:
                </label>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  onClick={() => setAvatarPickerOpen(true)}
                  className="h-auto p-0 text-xs font-semibold text-primary"
                >
                  <Sparkles className="size-3 mr-1" /> Galeria / Cartas
                </Button>
              </div>
              <Input
                value={newPicture}
                onChange={(e) => setNewPicture(e.target.value)}
                placeholder="https://exemplo.com/avatar.jpg"
                className="rounded-xl h-10 font-mono text-xs"
              />
            </div>

            <Button
              onClick={() => updateProfile()}
              disabled={updating || (!newUsername.trim() && !newPicture.trim())}
              className="w-full h-11 rounded-xl font-syne font-bold bg-primary text-primary-foreground mt-2"
            >
              {updating ? <Loader2 className="size-4 animate-spin mr-2" /> : <Check className="size-4 mr-2" />}
              Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Detalhes da Carta */}
      <CardDetailModal
        card={selectedCard}
        isOpen={Boolean(selectedCard)}
        onClose={() => setSelectedCard(null)}
      />

      {/* Modal de Escolha de Avatar */}
      <AvatarPickerModal
        isOpen={avatarPickerOpen}
        onClose={() => setAvatarPickerOpen(false)}
        currentPicture={user.picture}
        username={user.username}
      />
    </div>
  );
}
