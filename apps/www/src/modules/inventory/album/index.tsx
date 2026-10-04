"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useApi } from "@/hooks/use-api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { soundFx } from "@/lib/sound-fx";
import { loadTcgImg } from "@/lib/load-tcg-img";
import { TcgCardImage } from "@/components/tcg-card-image";
import { balanceTranslate } from "@/lib/balance-translate";
import { RewardModal } from "@/components/ui/reward-modal";
import { LoaderSimple } from "@/components/loading-spinner";
import { useTranslation } from "@/i18n/LanguageContext";
import {
  Book,
  Sparkles,
  Coins,
  Trophy,
  CheckCircle2,
  Lock,
  Wrench,
  Search,
  Flame,
  Star,
  Layers,
  Crown,
  Info,
  ShieldAlert,
  FolderLock,
  Check,
  Filter,
} from "lucide-react";

export type CardSlot = {
  targetName: string;
  isOwned: boolean;
  card: {
    id: number;
    name: string;
    image_url: string;
    rarity: number;
  };
};

export type OfficialAlbum = {
  id: string;
  title: string;
  category: "Regiões" | "Lendários" | "Especiais";
  tier: "Fácil" | "Médio" | "Lendário";
  description: string;
  badge: string;
  rewardGold: number;
  rewardXp: number;
  totalCount: number;
  collectedCount: number;
  progressPercent: number;
  isCompleted: boolean;
  isClaimed: boolean;
  canClaim: boolean;
  cardSlots: CardSlot[];
};

export function AlbumView() {
  const { t } = useTranslation();
  const { get, post } = useApi();
  const qClient = useQueryClient();

  // Estados de Filtros e Busca
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"all" | "Regiões" | "Lendários" | "Especiais">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "claimable" | "in_progress" | "claimed">("all");
  const [tierFilter, setTierFilter] = useState<"all" | "Fácil" | "Médio" | "Lendário">("all");

  // Estados de Modais
  const [rewardModalOpen, setRewardModalOpen] = useState(false);
  const [confirmClaimAlbum, setConfirmClaimAlbum] = useState<OfficialAlbum | null>(null);
  const [claimedReward, setClaimedReward] = useState<{
    title: string;
    gold: number;
    xp: number;
  } | null>(null);

  const { data: albums = [], isLoading, refetch } = useQuery<OfficialAlbum[]>({
    queryKey: ["albums"],
    queryFn: async () => {
      const res = await get("/albums");
      return res.data?.data || [];
    },
  });

  const { mutateAsync: claimAlbumMutation, isPending: isClaiming } = useMutation({
    mutationKey: ["albums", "claim"],
    mutationFn: async (album: OfficialAlbum) => {
      const res = await post(`/albums/claim/${album.id}`, {});
      soundFx.playGodPullFanfare();
      setClaimedReward({
        title: album.title,
        gold: album.rewardGold,
        xp: album.rewardXp,
      });
      setConfirmClaimAlbum(null);
      setRewardModalOpen(true);
      await Promise.all([
        qClient.invalidateQueries({ queryKey: ["user"] }),
        qClient.invalidateQueries({ queryKey: ["user-cards"] }),
        qClient.invalidateQueries({ queryKey: ["my-cards"] }),
      ]);
      await refetch();
      return res.data?.data;
    },
  });

  // Estatísticas do Fichário
  const totalAlbums = albums.length;
  const claimedCount = albums.filter((a) => a.isClaimed).length;
  const claimableCount = albums.filter((a) => a.canClaim && !a.isClaimed).length;
  const totalGoldEarned = albums
    .filter((a) => a.isClaimed)
    .reduce((sum, a) => sum + a.rewardGold, 0);

  // Filtragem Dinâmica
  const filteredAlbums = useMemo(() => {
    return albums.filter((album) => {
      // 1. Busca por texto
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const matchesTitle = album.title.toLowerCase().includes(query);
        const matchesDesc = album.description.toLowerCase().includes(query);
        const matchesTargets = album.cardSlots.some((s) =>
          s.targetName.toLowerCase().includes(query) || (s.card?.name && s.card.name.toLowerCase().includes(query))
        );
        if (!matchesTitle && !matchesDesc && !matchesTargets) return false;
      }

      // 2. Filtro de Categoria
      if (categoryFilter !== "all" && album.category !== categoryFilter) {
        return false;
      }

      // 3. Filtro de Status
      if (statusFilter === "claimable" && (!album.canClaim || album.isClaimed)) {
        return false;
      }
      if (statusFilter === "in_progress" && album.isCompleted) {
        return false;
      }
      if (statusFilter === "claimed" && !album.isClaimed) {
        return false;
      }

      // 4. Filtro de Tier
      if (tierFilter !== "all" && album.tier !== tierFilter) {
        return false;
      }

      return true;
    });
  }, [albums, searchQuery, categoryFilter, statusFilter, tierFilter]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <LoaderSimple className="size-10 text-amber-500 animate-spin" />
        <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          Carregando Fichário & Conjuntos Oficiais...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER DO FICHÁRIO 3D / BINDER STATS */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-r from-zinc-950 via-zinc-900 to-amber-950/40 p-5 sm:p-6 shadow-2xl">
        <div className="absolute -right-12 -top-12 size-48 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center size-8 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400">
                <Book className="size-4" />
              </span>
              <h2 className="text-xl sm:text-2xl font-bold font-syne text-foreground tracking-tight flex items-center gap-2">
                Fichário do Colecionador
                <Badge variant="outline" className="text-[10px] font-mono border-amber-500/50 text-amber-400 bg-amber-500/10">
                  Binder 3D
                </Badge>
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl leading-relaxed">
              Cole suas cartas nos conjuntos oficiais para eternizar suas conquistas no fichário e desbloquear recompensas gigantescas em moedas e prestígio!
            </p>
          </div>

          {/* Mini Painel de Estatísticas */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full md:w-auto shrink-0 font-mono text-center">
            <div className="rounded-xl border border-border/80 bg-zinc-900/80 p-2.5 sm:px-4">
              <span className="text-[10px] uppercase text-muted-foreground block font-sans">Completados</span>
              <span className="text-sm sm:text-base font-bold text-emerald-400">
                {claimedCount} <span className="text-xs text-muted-foreground">/ {totalAlbums}</span>
              </span>
            </div>
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-2.5 sm:px-4">
              <span className="text-[10px] uppercase text-amber-400/80 block font-sans">Prontos</span>
              <span className="text-sm sm:text-base font-bold text-amber-300">
                {claimableCount}
              </span>
            </div>
            <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-2.5 sm:px-4">
              <span className="text-[10px] uppercase text-yellow-400/80 block font-sans">Ouro Coletado</span>
              <span className="text-sm sm:text-base font-bold text-yellow-300">
                +{balanceTranslate(totalGoldEarned)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CONTROLES, TABS E FILTROS */}
      <Tabs defaultValue="official" className="w-full space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <TabsList className="bg-secondary/80 border border-border p-1 w-fit">
            <TabsTrigger value="official" className="text-xs sm:text-sm font-semibold gap-2">
              <Book className="size-4 text-amber-500" />
              <span>{t("albums.tabOfficial")} ({albums.length})</span>
            </TabsTrigger>
            <TabsTrigger value="custom" className="text-xs sm:text-sm font-semibold gap-2">
              <Wrench className="size-4 text-purple-400" />
              <span>{t("albums.tabCustom")}</span>
              <Badge variant="outline" className="text-[9px] font-mono border-purple-500/40 text-purple-400 py-0 px-1">
                Comunidade
              </Badge>
            </TabsTrigger>
          </TabsList>

          {/* Barra de Pesquisa Rápida */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nome do álbum, região ou Pokémon..."
              className="pl-9 h-9 text-xs rounded-xl bg-card border-border/80"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* FILTROS INTERATIVOS (STATUS, CATEGORIA E DIFICULDADE) */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm">
          {/* Filtro de Status de Resgate */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground mr-1 hidden sm:inline-flex items-center gap-1">
              <Filter className="size-3" /> Status:
            </span>
            <Button
              size="sm"
              variant={statusFilter === "all" ? "default" : "outline"}
              onClick={() => setStatusFilter("all")}
              className="h-7 text-xs rounded-lg px-2.5"
            >
              Todos ({albums.length})
            </Button>
            <Button
              size="sm"
              variant={statusFilter === "claimable" ? "default" : "outline"}
              onClick={() => setStatusFilter("claimable")}
              className={`h-7 text-xs rounded-lg px-2.5 gap-1.5 ${
                claimableCount > 0
                  ? "border-amber-500/60 bg-amber-500/10 text-amber-500 dark:text-amber-400"
                  : ""
              } ${statusFilter === "claimable" ? "!bg-amber-500 !text-slate-950 font-bold" : ""}`}
            >
              <Sparkles className="size-3" />
              <span>Prontos para Colar</span>
              {claimableCount > 0 && (
                <Badge className="bg-amber-400 text-slate-950 text-[9px] px-1 py-0 font-bold ml-0.5">
                  {claimableCount}
                </Badge>
              )}
            </Button>
            <Button
              size="sm"
              variant={statusFilter === "in_progress" ? "default" : "outline"}
              onClick={() => setStatusFilter("in_progress")}
              className="h-7 text-xs rounded-lg px-2.5"
            >
              Em Progresso
            </Button>
            <Button
              size="sm"
              variant={statusFilter === "claimed" ? "default" : "outline"}
              onClick={() => setStatusFilter("claimed")}
              className="h-7 text-xs rounded-lg px-2.5"
            >
              Colados ({claimedCount})
            </Button>
          </div>

          {/* Filtro de Categoria & Dificuldade */}
          <div className="flex flex-wrap items-center gap-1.5 ml-auto">
            {/* Categoria */}
            <div className="flex items-center gap-1 bg-secondary/50 p-0.5 rounded-lg border border-border/50">
              {(["all", "Regiões", "Lendários", "Especiais"] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-2 py-0.5 text-[11px] font-medium rounded-md transition-colors ${
                    categoryFilter === cat
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {cat === "all" ? "Categorias: Todas" : cat}
                </button>
              ))}
            </div>

            {/* Dificuldade / Tier */}
            <div className="flex items-center gap-1 bg-secondary/50 p-0.5 rounded-lg border border-border/50">
              {(["all", "Fácil", "Médio", "Lendário"] as const).map((tier) => (
                <button
                  key={tier}
                  onClick={() => setTierFilter(tier)}
                  className={`px-2 py-0.5 text-[11px] font-medium rounded-md transition-colors ${
                    tierFilter === tier
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tier === "all" ? "Tiers: Todos" : tier}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ABA 1: ÁLBUNS OFICIAIS */}
        <TabsContent value="official" className="mt-0">
          {filteredAlbums.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-border bg-card/40">
              <FolderLock className="size-10 text-muted-foreground/50 mb-3" />
              <h3 className="text-base font-bold font-syne mb-1">
                Nenhum álbum corresponde aos filtros selecionados
              </h3>
              <p className="text-xs text-muted-foreground max-w-md">
                Tente limpar sua busca ou selecionar outros filtros para ver os conjuntos do fichário.
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setCategoryFilter("all");
                  setStatusFilter("all");
                  setTierFilter("all");
                }}
                className="mt-4 text-xs rounded-xl"
              >
                Limpar Todos os Filtros
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
              {filteredAlbums.map((album) => {
                const tierColor =
                  album.tier === "Lendário"
                    ? "border-amber-500/50 bg-amber-500/10 text-amber-400"
                    : album.tier === "Médio"
                    ? "border-purple-500/50 bg-purple-500/10 text-purple-400"
                    : "border-blue-500/50 bg-blue-500/10 text-blue-400";

                return (
                  <Card
                    key={album.id}
                    className={`relative overflow-hidden border bg-zinc-950/90 dark:bg-zinc-950/90 transition-all duration-300 rounded-2xl flex flex-col justify-between shadow-lg ${
                      album.isClaimed
                        ? "border-emerald-500/40 shadow-emerald-500/5 ring-1 ring-emerald-500/20"
                        : album.canClaim
                        ? "border-amber-500 shadow-xl shadow-amber-500/15 ring-2 ring-amber-500/50"
                        : "border-border/80 hover:border-border"
                    }`}
                  >
                    {/* BINDER RINGS DECORATION (Lombada de Fichário) */}
                    <div className="absolute top-0 bottom-0 left-0 w-2.5 bg-gradient-to-r from-zinc-800 to-zinc-900 border-r border-zinc-700/50 flex flex-col justify-around py-4 z-20 pointer-events-none">
                      <div className="size-1.5 rounded-full bg-zinc-950 shadow-inner mx-auto" />
                      <div className="size-1.5 rounded-full bg-zinc-950 shadow-inner mx-auto" />
                      <div className="size-1.5 rounded-full bg-zinc-950 shadow-inner mx-auto" />
                      <div className="size-1.5 rounded-full bg-zinc-950 shadow-inner mx-auto" />
                    </div>

                    <div className="pl-3.5 flex flex-col flex-1 justify-between">
                      <CardHeader className="p-4 sm:p-5 pb-2">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-secondary border border-border text-muted-foreground">
                              {album.category}
                            </span>
                            <Badge variant="outline" className={`text-[10px] font-mono font-bold py-0.5 ${tierColor}`}>
                              {album.tier === "Lendário" && <Crown className="size-3 mr-1 inline" />}
                              Tier {album.tier}
                            </Badge>
                          </div>

                          <Badge
                            variant="outline"
                            className={`text-[10px] font-mono font-bold ${
                              album.isClaimed
                                ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                                : album.canClaim
                                ? "border-amber-500/50 text-amber-400 bg-amber-500/10 animate-pulse"
                                : "border-border text-muted-foreground"
                            }`}
                          >
                            {album.isClaimed ? "✓ Colado no Fichário" : album.badge}
                          </Badge>
                        </div>

                        <CardTitle className="text-base sm:text-lg font-bold font-syne text-foreground flex items-center justify-between">
                          <span>{album.title}</span>
                          <span className="text-xs font-mono font-normal text-muted-foreground">
                            {album.collectedCount}/{album.totalCount}
                          </span>
                        </CardTitle>
                        <CardDescription className="text-xs leading-relaxed mt-1 line-clamp-2">
                          {album.description}
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="p-4 sm:p-5 pt-0 space-y-3.5">
                        {/* SLOTS DO FICHÁRIO (POCKET SLEEVES) */}
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-2.5 py-1">
                          {album.cardSlots.map((slot, idx) => (
                            <div
                              key={`${slot.targetName}-${idx}`}
                              className={`relative aspect-[1/1.38] rounded-xl overflow-hidden border flex flex-col items-center justify-center text-center group transition-all duration-200 ${
                                slot.isOwned
                                  ? "border-amber-500/60 shadow-md bg-zinc-950"
                                  : "border-border/40 bg-zinc-950/80"
                              }`}
                            >
                              {slot.isOwned ? (
                                <>
                                  <TcgCardImage
                                    src={slot.card.image_url}
                                    alt={slot.card.name}
                                    lowQuality={true}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  />
                                  {/* Badge de Obtida / Colada */}
                                  <div className="absolute top-1 right-1 z-10 size-4 rounded-full bg-emerald-500 flex items-center justify-center text-zinc-950 shadow-md">
                                    <Check className="size-3 stroke-[3]" />
                                  </div>
                                  <div className="absolute bottom-0 inset-x-0 bg-black/85 backdrop-blur-xs px-1 py-0.5 text-center">
                                    <span className="text-[9px] font-mono text-emerald-400 font-bold truncate block">
                                      {slot.targetName}
                                    </span>
                                  </div>
                                </>
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center relative bg-gradient-to-b from-zinc-900 to-zinc-950">
                                  {slot.card.image_url && (
                                    <img
                                      src={loadTcgImg(slot.card.image_url, true)}
                                      alt={slot.targetName}
                                      loading="lazy"
                                      className="absolute inset-0 w-full h-full object-cover opacity-10 filter grayscale blur-[1px]"
                                    />
                                  )}
                                  <div className="size-6 rounded-full bg-secondary/80 border border-border/80 flex items-center justify-center text-muted-foreground mb-1 relative z-10">
                                    <Lock className="size-3 text-muted-foreground/60" />
                                  </div>
                                  <span className="text-[9px] font-mono font-bold text-muted-foreground/70 truncate max-w-full px-1 relative z-10">
                                    {slot.targetName}
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>

                        {/* BARRA DE PROGRESSO DO ÁLBUM */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground">
                            <span>Progresso de Coleção</span>
                            <span className="font-bold text-foreground">
                              {album.progressPercent}%
                            </span>
                          </div>
                          <Progress
                            value={album.progressPercent}
                            className={`h-2 rounded-full ${
                              album.isClaimed
                                ? "[&>div]:bg-emerald-500"
                                : album.canClaim
                                ? "[&>div]:bg-amber-400"
                                : "[&>div]:bg-primary"
                            }`}
                          />
                        </div>
                      </CardContent>

                      {/* RODAPÉ DO ÁLBUM (RECOMPENSAS E AÇÃO DE COLAR) */}
                      <CardFooter className="p-4 sm:p-5 pt-0 border-t border-border/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 mt-auto">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono font-bold text-xs">
                            <Coins className="size-3.5" />
                            <span>+{balanceTranslate(album.rewardGold)}</span>
                          </div>
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 font-mono font-bold text-xs">
                            <Trophy className="size-3.5" />
                            <span>+{album.rewardXp} XP</span>
                          </div>
                        </div>

                        {album.isClaimed ? (
                          <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5 py-1 px-2 justify-center sm:justify-start">
                            <CheckCircle2 className="size-4" /> Colado no Fichário
                          </span>
                        ) : album.canClaim ? (
                          <Button
                            size="sm"
                            onClick={() => setConfirmClaimAlbum(album)}
                            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs px-4 h-8.5 rounded-xl shadow-lg shadow-amber-500/20 animate-pulse"
                          >
                            <Sparkles className="size-3.5 mr-1.5" />
                            <span>Colar no Fichário</span>
                          </Button>
                        ) : (
                          <Button variant="outline" disabled size="sm" className="text-xs text-muted-foreground h-8.5 rounded-xl">
                            Faltam {album.totalCount - album.collectedCount} cartas
                          </Button>
                        )}
                      </CardFooter>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ABA 2: ÁLBUNS CUSTOMIZADOS DA COMUNIDADE */}
        <TabsContent value="custom" className="mt-0">
          <Card className="border-dashed border-2 border-border/80 bg-card/40 p-8 sm:p-12 text-center rounded-2xl max-w-xl mx-auto">
            <div className="size-16 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-4">
              <Wrench className="size-8 text-purple-400" />
            </div>
            <Badge variant="outline" className="mb-2 font-mono text-[10px] text-purple-400 border-purple-500/40">
              Roadmap & Comunidade
            </Badge>
            <h3 className="font-syne text-xl sm:text-2xl font-bold text-foreground mb-2">
              Fichários Customizados da Comunidade
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-6">
              Em breve você poderá montar seus próprios fichários temáticos, definir cartas raras exigidas, adicionar recompensas em moedas e publicar no mural global para outros treinadores completarem!
            </p>
          </Card>
        </TabsContent>
      </Tabs>

      {/* MODAL DE CONFIRMAÇÃO DE COLAGEM & CONSUMO DE CARTAS (BURNING) */}
      <Dialog open={!!confirmClaimAlbum} onOpenChange={(open) => !open && setConfirmClaimAlbum(null)}>
        <DialogContent className="sm:max-w-lg bg-zinc-950 border-amber-500/40">
          <DialogHeader className="space-y-2">
            <div className="size-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-1">
              <Sparkles className="size-6" />
            </div>
            <DialogTitle className="text-lg font-bold font-syne text-foreground">
              Colar Conjunto "{confirmClaimAlbum?.title}" no Fichário?
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Ao confirmar, <strong className="text-amber-400">1 cópia de cada carta</strong> necessária será eternizada no seu Fichário (removida do seu inventário de trocas/batalhas) e você receberá as seguintes recompensas:
            </DialogDescription>
          </DialogHeader>

          {confirmClaimAlbum && (
            <div className="space-y-3 py-2">
              {/* Resumo das cartas que serão consumidas */}
              <div className="rounded-xl border border-border/60 bg-zinc-900/80 p-3 space-y-2">
                <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground block font-bold">
                  Cartas que serão coladas no Fichário ({confirmClaimAlbum.cardSlots.length}):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {confirmClaimAlbum.cardSlots.map((slot, i) => (
                    <Badge key={i} variant="secondary" className="text-xs font-mono py-1 px-2 border border-border">
                      ✓ {slot.targetName}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Recompensas a receber */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-center">
                  <span className="text-[10px] uppercase font-mono text-amber-400/80 block">Moedas</span>
                  <span className="text-base font-bold font-mono text-amber-300">
                    +{balanceTranslate(confirmClaimAlbum.rewardGold)}
                  </span>
                </div>
                <div className="p-3 rounded-xl border border-purple-500/30 bg-purple-500/10 text-center">
                  <span className="text-[10px] uppercase font-mono text-purple-400/80 block">Experiência</span>
                  <span className="text-base font-bold font-mono text-purple-300">
                    +{confirmClaimAlbum.rewardXp} XP
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-zinc-900/60 border border-zinc-800 text-[11px] text-muted-foreground">
                <Info className="size-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  As cartas coladas completam sua conquista para sempre no seu perfil de Treinador.
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              disabled={isClaiming}
              onClick={() => setConfirmClaimAlbum(null)}
              className="text-xs rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              disabled={isClaiming}
              onClick={() => confirmClaimAlbum && claimAlbumMutation(confirmClaimAlbum)}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl gap-1.5 shadow-md shadow-amber-500/20"
            >
              {isClaiming ? (
                <>
                  <LoaderSimple className="size-3.5 animate-spin" />
                  <span>Colando no Fichário...</span>
                </>
              ) : (
                <>
                  <Sparkles className="size-3.5" />
                  <span>Confirmar e Resgatar</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE RECOMPENSA RESGATADA */}
      <RewardModal
        open={rewardModalOpen}
        onOpenChange={setRewardModalOpen}
        iconType="general"
        title="Conjunto Colado no Fichário!"
        description={claimedReward ? `${claimedReward.title} concluído com sucesso!` : ""}
        rewardAmount={claimedReward?.gold}
      />
    </div>
  );
}