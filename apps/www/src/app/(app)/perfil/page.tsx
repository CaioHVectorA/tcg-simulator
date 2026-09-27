"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
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
  Sun,
  Moon,
  Gift,
  Lock,
  CheckCircle2,
  Package as PackageIcon,
  Handshake,
  ArrowRight,
  Dice5,
  Image as ImageIcon,
  Link2,
} from "lucide-react";
import Link from "next/link";
import { useApi } from "@/hooks/use-api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { TcgCardImage } from "@/components/tcg-card-image";
import { soundFx } from "@/lib/sound-fx";
import { CardDetailModal, CardModalData } from "@/components/card-detail-modal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { setCachedUser } from "@/context/UserContext";
import { useTranslation } from "@/i18n/LanguageContext";

interface LevelMilestone {
  level: number;
  coins: number;
  packCount: number;
  badge: string;
  title: string;
  isReached: boolean;
  isClaimed: boolean;
}

interface LevelRoadData {
  level: number;
  xp: number;
  nextLevelXp: number;
  levelProgress: number;
  milestones: LevelMilestone[];
  unclaimedCount: number;
}

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

const PRESET_AVATARS = [
  { name: "Pikachu", url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png" },
  { name: "Charizard", url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/6.png" },
  { name: "Gengar", url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/94.png" },
  { name: "Mewtwo", url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/150.png" },
  { name: "Eevee", url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/133.png" },
  { name: "Lucario", url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/448.png" },
  { name: "Umbreon", url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/197.png" },
  { name: "Rayquaza", url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/384.png" },
  { name: "Blastoise", url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/9.png" },
  { name: "Venusaur", url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/3.png" },
  { name: "Mimikyu", url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/778.png" },
  { name: "Lugia", url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/249.png" },
  { name: "Greninja", url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/658.png" },
  { name: "Snorlax", url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/143.png" },
  { name: "Gardevoir", url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/282.png" },
  { name: "Tyranitar", url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/248.png" },
];

const RANDOM_NAMES = [
  "Red", "Blue", "Cynthia", "Steven", "Leon", "AshKetchum", "Misty", "Brock",
  "Lance", "Volkner", "Diantha", "Alder", "Iris", "N_Reshiram", "Silver",
];

export default function PerfilPage() {
  const { t, locale } = useTranslation();
  const { get, post, patch } = useApi();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [selectedCard, setSelectedCard] = useState<CardModalData | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  // Estados do modal de edição de perfil
  const [newUsername, setNewUsername] = useState("");
  const [newPicture, setNewPicture] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data, isLoading } = useQuery<ProfileData>({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const res = await get("/user/profile");
      return res.data.data;
    },
  });

  const { data: levelRoad } = useQuery<LevelRoadData>({
    queryKey: ["level-road"],
    queryFn: async () => {
      const res = await get("/user/level-road");
      return res.data.data;
    },
  });

  // User collection cards for avatar picker inside modal
  const { data: userCards = [], isLoading: loadingCards } = useQuery<any[]>({
    queryKey: ["user-cards-for-profile-avatar"],
    queryFn: async () => {
      const res = await get("/cards?page=1&limit=36");
      const list = res.data?.data?.cards || res.data?.data || [];
      return Array.isArray(list) ? list : [];
    },
    enabled: editModalOpen,
  });

  const { mutate: claimReward, isPending: claimingReward } = useMutation({
    mutationFn: async (targetLevel?: number) => {
      const payload = targetLevel ? { level: targetLevel } : {};
      const res = await post("/user/level-road/claim", payload);
      return res.data;
    },
    onSuccess: (res) => {
      soundFx.playSuccess();
      toast({
        title: t("common.success"),
        description: res.toast || "Rewards claimed successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["level-road"] });
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["packages"] });
    },
    onError: (err: any) => {
      toast({
        title: t("common.error"),
        description: err.response?.data?.toast || "Could not claim this reward.",
        variant: "destructive",
      });
    },
  });

  const { mutate: recycleDuplicates, isPending: recycling } = useMutation({
    mutationFn: async () => {
      const res = await post("/user/recycle-duplicates", {});
      return res.data;
    },
    onSuccess: (res) => {
      soundFx.playSuccess();
      toast({
        title: t("profile.recycleDuplicates"),
        description: res.toast || "Duplicate cards converted into coins!",
      });
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["cards"] });
    },
    onError: (err: any) => {
      toast({
        title: t("common.error"),
        description: err.response?.data?.toast || "No duplicate cards found to recycle.",
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
      // Atualiza cache local instantaneamente
      setCachedUser({
        username: newUsername.trim() || undefined,
        picture: newPicture.trim() || undefined,
      });

      toast({
        title: t("profileModal.success"),
      });
      setEditModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
    onError: (err: any) => {
      toast({
        title: t("common.error"),
        description: err.response?.data?.toast || "Could not update profile.",
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

  const generateRandomName = () => {
    const random = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
    const suffix = Math.floor(Math.random() * 900) + 100;
    setNewUsername(`${random}_${suffix}`);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl font-syne">
      {/* Banner & Perfil do Treinador */}
      <div className="bg-card/70 border border-border/80 rounded-3xl p-6 sm:p-8 backdrop-blur-md shadow-md mb-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div
            className="relative group cursor-pointer"
            onClick={handleOpenEdit}
            title={t("profileModal.title")}
          >
            <Avatar username={user.username} src={user.picture} className="size-24 sm:size-28 shadow-xl group-hover:opacity-85 transition-opacity" />
            <div className="absolute inset-0 rounded-full bg-black/45 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-[10px] font-bold gap-1">
              <Camera className="size-5" />
              <span>{t("common.edit")}</span>
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
                  {t("profile.memberSince")} {new Date(user.createdAt).toLocaleDateString(locale === "en" ? "en-US" : "pt-BR", { month: "long", year: "numeric" })}
                </p>
              </div>

              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenEdit}
                  className="rounded-xl text-xs h-9 text-foreground font-semibold"
                >
                  <Edit2 className="size-3.5 mr-1.5" /> {t("profile.editProfile")}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => recycleDuplicates()}
                  disabled={recycling}
                  className="rounded-xl text-xs h-9 bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500/20 font-semibold"
                >
                  {recycling ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : <Trash2 className="size-3.5 mr-1.5" />}
                  {recycling ? t("profile.recycling") : t("profile.recycleDuplicates")}
                </Button>
              </div>
            </div>

            {/* Barra de XP */}
            <div className="mt-4 bg-accent/40 rounded-2xl p-3 border border-border/40">
              <div className="flex justify-between text-xs mb-1.5">
                <span className="font-sans text-muted-foreground font-semibold">
                  {t("profile.progressToLevel").replace("{level}", String(stats.level + 1))}
                </span>
                <span className="font-mono font-bold text-foreground">{stats.xp} / {stats.nextLevelXp} XP</span>
              </div>
              <Progress value={stats.levelProgress} className="h-2.5" />
            </div>
          </div>
        </div>
      </div>

      {/* Trilha do Treinador: Progressão de Nível & XP */}
      <div className="bg-card/70 border border-border/80 rounded-3xl p-6 sm:p-7 backdrop-blur-md shadow-md mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shadow-inner">
              <Trophy className="size-6 text-amber-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold tracking-tight text-foreground">
                  {t("profile.levelRoadTitle")}
                </h2>
                <Badge variant="outline" className="text-[10px] font-mono border-amber-500/40 text-amber-500 bg-amber-500/10">
                  {t("profile.levelRoadBadge")}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground font-sans mt-0.5">
                {t("profile.levelRoadSubtitle")}
              </p>
            </div>
          </div>

          {levelRoad && levelRoad.unclaimedCount > 0 && (
            <Button
              onClick={() => claimReward(undefined)}
              disabled={claimingReward}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold font-syne rounded-xl shadow-lg shadow-amber-500/20 text-xs h-9 px-4 self-start sm:self-auto shrink-0"
            >
              {claimingReward ? (
                <Loader2 className="size-4 animate-spin mr-1.5" />
              ) : (
                <Gift className="size-4 mr-1.5 animate-bounce" />
              )}
              {t("profile.claimAll").replace("{count}", String(levelRoad.unclaimedCount))}
            </Button>
          )}
        </div>

        {/* Milestones Scroll Track */}
        <div className="flex gap-3.5 overflow-x-auto pb-3 pt-1 scrollbar-thin scrollbar-thumb-border">
          {levelRoad?.milestones.map((m) => {
            const isClaimed = m.isClaimed;
            const isClaimable = m.isReached && !m.isClaimed;

            return (
              <div
                key={m.level}
                className={`min-w-[170px] max-w-[185px] shrink-0 rounded-2xl p-3.5 border transition-all duration-200 flex flex-col justify-between ${
                  isClaimable
                    ? "bg-gradient-to-b from-amber-500/15 via-card to-card border-amber-400/80 shadow-md shadow-amber-500/10 ring-1 ring-amber-400/40"
                    : isClaimed
                    ? "bg-card/40 border-border/50 opacity-75"
                    : "bg-card/25 border-dashed border-border/60 opacity-60"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <Badge
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 ${
                        isClaimable
                          ? "bg-amber-500 text-slate-950"
                          : isClaimed
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      Nv. {m.level}
                    </Badge>
                    <span className="text-lg leading-none" title={m.title}>
                      {m.badge}
                    </span>
                  </div>

                  <h3 className="text-xs font-bold text-foreground line-clamp-1 mb-2.5" title={m.title}>
                    {m.title}
                  </h3>

                  <div className="space-y-1.5 mb-3.5 text-[11px] font-sans">
                    <div className="flex items-center gap-1.5 text-amber-500 font-semibold">
                      <Coins className="size-3.5 shrink-0" />
                      <span>+{m.coins.toLocaleString(locale === "en" ? "en-US" : "pt-BR")} {t("profile.coins")}</span>
                    </div>

                    {m.packCount > 0 && (
                      <div className="flex items-center gap-1.5 text-blue-400 font-semibold">
                        <PackageIcon className="size-3.5 shrink-0" />
                        <span>+{m.packCount} {m.packCount > 1 ? t("profile.packs") : t("profile.pack")}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  {isClaimed ? (
                    <span className="flex items-center justify-center text-[10px] font-bold text-emerald-500 bg-emerald-500/10 rounded-xl py-1.5 px-2.5 w-full border border-emerald-500/20">
                      <CheckCircle2 className="size-3 mr-1" /> {t("profile.claimed")}
                    </span>
                  ) : isClaimable ? (
                    <Button
                      size="sm"
                      onClick={() => claimReward(m.level)}
                      disabled={claimingReward}
                      className="w-full text-xs font-bold rounded-xl h-8 bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm"
                    >
                      {claimingReward ? <Loader2 className="size-3 animate-spin mr-1" /> : <Gift className="size-3 mr-1" />}
                      {t("profile.claim")}
                    </Button>
                  ) : (
                    <span className="flex items-center justify-center text-[10px] font-medium text-muted-foreground bg-muted/40 rounded-xl py-1.5 px-2.5 w-full border border-border/40">
                      <Lock className="size-3 mr-1 opacity-70" /> {t("profile.locked")}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid de Estatísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 sm:gap-4 mb-8">
        <div className="bg-card border border-border/80 rounded-2xl p-4 text-center shadow-xs">
          <Layers className="size-5 mx-auto mb-1.5 text-blue-400" />
          <span className="text-2xl font-bold font-mono text-foreground block">{stats.totalCards}</span>
          <span className="text-[11px] text-muted-foreground font-sans">{t("profile.statTotalCards")}</span>
        </div>

        <div className="bg-card border border-border/80 rounded-2xl p-4 text-center shadow-xs">
          <Sparkles className="size-5 mx-auto mb-1.5 text-amber-400" />
          <span className="text-2xl font-bold font-mono text-foreground block">{stats.uniqueCards}</span>
          <span className="text-[11px] text-muted-foreground font-sans">{t("profile.statUniqueCards")}</span>
        </div>

        <div className="bg-card border border-border/80 rounded-2xl p-4 text-center shadow-xs">
          <Trophy className="size-5 mx-auto mb-1.5 text-purple-400" />
          <span className="text-2xl font-bold font-mono text-foreground block">{user.rarityPoints}</span>
          <span className="text-[11px] text-muted-foreground font-sans">{t("profile.statRarityPoints")}</span>
        </div>

        <div className="bg-card border border-border/80 rounded-2xl p-4 text-center shadow-xs">
          <Coins className="size-5 mx-auto mb-1.5 text-yellow-400" />
          <span className="text-2xl font-bold font-mono text-foreground block">{user.money.toLocaleString()}</span>
          <span className="text-[11px] text-muted-foreground font-sans">{t("profile.statCoins")}</span>
        </div>

        <div className="bg-card border border-border/80 rounded-2xl p-4 text-center shadow-xs">
          <Award className="size-5 mx-auto mb-1.5 text-emerald-400" />
          <span className="text-2xl font-bold font-mono text-foreground block">{stats.completedQuests}</span>
          <span className="text-[11px] text-muted-foreground font-sans">{t("profile.statQuests")}</span>
        </div>

        <div className="bg-card border border-border/80 rounded-2xl p-4 text-center shadow-xs">
          <RefreshCw className="size-5 mx-auto mb-1.5 text-pink-400" />
          <span className="text-2xl font-bold font-mono text-foreground block">{stats.tradesDone}</span>
          <span className="text-[11px] text-muted-foreground font-sans">{t("profile.statTrades")}</span>
        </div>
      </div>

      {/* Seletor de Tema Visual: White Mode / Black Mode */}
      <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-xs mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-foreground">{t("profile.themeTitle")}</span>
            <Badge variant="outline" className="text-[10px] font-mono">
              {mounted && theme === "dark" ? t("profile.themeActiveDark") : t("profile.themeActiveLight")}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground font-sans mt-0.5">
            {t("profile.themeDesc")}
          </p>
        </div>

        {mounted && (
          <div className="flex items-center gap-2 bg-secondary/80 p-1 rounded-xl border border-border">
            <Button
              type="button"
              variant={theme !== "dark" ? "default" : "ghost"}
              size="sm"
              onClick={() => setTheme("light")}
              className={`rounded-lg text-xs h-8 px-3 font-bold gap-1.5 ${
                theme !== "dark" ? "bg-amber-500 text-slate-950 hover:bg-amber-400" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sun className="size-3.5" />
              <span>{t("profile.themeWhite")}</span>
            </Button>
            <Button
              type="button"
              variant={theme === "dark" ? "default" : "ghost"}
              size="sm"
              onClick={() => setTheme("dark")}
              className={`rounded-lg text-xs h-8 px-3 font-bold gap-1.5 ${
                theme === "dark" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Moon className="size-3.5" />
              <span>{t("profile.themeBlack")}</span>
            </Button>
          </div>
        )}
      </div>

      {/* Top 5 Cartas Raras */}
      <div className="space-y-4 mb-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Sparkles className="size-5 text-amber-400" /> {t("profile.rarestCards")}
          </h2>
          <span className="text-xs text-muted-foreground font-sans">{t("profile.clickToInspect")}</span>
        </div>

        {topCards.length === 0 ? (
          <div className="bg-card border border-border/80 rounded-2xl p-12 text-center text-muted-foreground">
            <Layers className="size-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-semibold">{t("profile.noCardsYet")}</p>
            <p className="text-xs mt-1">{t("profile.noCardsYetDesc")}</p>
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
                  <TcgCardImage
                    src={card.image_url}
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

      {/* Seção de Afiliados */}
      <div className="bg-card/70 border border-border/80 rounded-3xl p-6 sm:p-7 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
              <Handshake className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-foreground">{t("profile.affiliateTitle")}</h3>
                <Badge variant="outline" className="border-amber-500/40 text-amber-500 bg-amber-500/10 text-[10px] font-mono">
                  {t("profile.affiliateTag")}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground font-sans mt-0.5 max-w-xl">
                {t("profile.affiliateBannerDesc")}
              </p>
            </div>
          </div>

          <Button
            asChild
            className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold font-syne text-xs h-10 px-5 rounded-xl shrink-0 shadow-md shadow-amber-500/15"
          >
            <Link href="/afiliado">
              <span>{t("profile.accessAffiliate")}</span>
              <ArrowRight className="size-3.5 ml-1.5" />
            </Link>
          </Button>
        </div>
      </div>

      {/* MODAL REDESENHADO DE EDIÇÃO DE PERFIL / TRAINER STUDIO */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-lg bg-card/95 border-border backdrop-blur-2xl font-syne p-6 shadow-2xl rounded-3xl overflow-hidden max-h-[90vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="text-xl font-extrabold flex items-center gap-2">
              <Sparkles className="size-5 text-amber-400" />
              {t("profileModal.title")}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-sans">
              {t("profileModal.subtitle")}
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto pr-1 space-y-5 pt-3 font-sans flex-1">
            {/* Live Trainer Card Preview */}
            <div className="bg-gradient-to-r from-amber-500/10 via-card to-primary/10 border border-border/80 rounded-2xl p-4 flex items-center gap-4 shadow-inner">
              <div className="relative shrink-0">
                <Avatar
                  username={newUsername || user.username}
                  src={newPicture || user.picture}
                  className="size-16 sm:size-18 shadow-md ring-2 ring-primary/30"
                />
                <Badge className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-mono font-bold bg-primary text-primary-foreground px-1.5 py-0 shadow-xs">
                  NV. {stats.level}
                </Badge>
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block font-mono">
                  {t("profileModal.currentAvatar")}
                </span>
                <h4 className="text-base sm:text-lg font-bold font-syne text-foreground truncate">
                  {newUsername.trim() || user.username}
                </h4>
                <p className="text-[11px] text-muted-foreground truncate">
                  {user.email || "trainer@pokemon-tcg.com"}
                </p>
              </div>
            </div>

            {/* Trainer Name Input */}
            <div>
              <label className="text-xs font-bold text-foreground flex items-center justify-between mb-1.5">
                <span>{t("profileModal.usernameLabel")}</span>
                <button
                  type="button"
                  onClick={generateRandomName}
                  className="text-[11px] text-primary hover:underline flex items-center gap-1 font-semibold"
                >
                  <Dice5 className="size-3.5" /> 🎲 Sugerir Nome
                </button>
              </label>
              <Input
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder={t("profileModal.usernamePlaceholder")}
                className="rounded-xl h-11 font-syne text-sm bg-background/60"
              />
            </div>

            {/* Avatar Selector Tabs */}
            <div>
              <label className="text-xs font-bold text-foreground block mb-2">
                {t("profileModal.avatarLabel")}
              </label>

              <Tabs defaultValue="presets" className="w-full">
                <TabsList className="w-full grid grid-cols-3 h-9 rounded-xl bg-muted/60 p-1 mb-3">
                  <TabsTrigger value="presets" className="text-xs rounded-lg font-syne font-semibold">
                    <Sparkles className="size-3.5 mr-1 text-amber-500" />
                    {t("profileModal.tabTrainers")}
                  </TabsTrigger>
                  <TabsTrigger value="cards" className="text-xs rounded-lg font-syne font-semibold">
                    <Layers className="size-3.5 mr-1 text-blue-500" />
                    {t("profileModal.tabCards")}
                  </TabsTrigger>
                  <TabsTrigger value="url" className="text-xs rounded-lg font-syne font-semibold">
                    <Link2 className="size-3.5 mr-1 text-purple-500" />
                    {t("profileModal.tabUrl")}
                  </TabsTrigger>
                </TabsList>

                {/* Tab: Presets */}
                <TabsContent value="presets" className="m-0 focus-visible:outline-none">
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 max-h-48 overflow-y-auto p-1 scrollbar-thin">
                    {PRESET_AVATARS.map((preset) => {
                      const isSelected = newPicture === preset.url;
                      return (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => setNewPicture(preset.url)}
                          className={`relative rounded-xl p-1 border transition-all aspect-square flex flex-col items-center justify-center group ${
                            isSelected
                              ? "border-primary bg-primary/10 ring-2 ring-primary shadow-sm"
                              : "border-border/70 bg-background/50 hover:border-primary/50 hover:bg-accent/40"
                          }`}
                          title={preset.name}
                        >
                          <img
                            src={preset.url}
                            alt={preset.name}
                            className="size-9 object-contain group-hover:scale-110 transition-transform"
                            loading="lazy"
                          />
                          {isSelected && (
                            <span className="absolute top-0.5 right-0.5 size-3.5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[9px] shadow-xs">
                              <Check className="size-2.5" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </TabsContent>

                {/* Tab: My Cards */}
                <TabsContent value="cards" className="m-0 focus-visible:outline-none">
                  {loadingCards ? (
                    <div className="h-36 flex items-center justify-center">
                      <Loader2 className="size-5 animate-spin text-primary" />
                    </div>
                  ) : userCards.length === 0 ? (
                    <div className="h-32 flex flex-col items-center justify-center text-center p-4 rounded-xl border border-dashed text-muted-foreground text-xs">
                      <Layers className="size-6 mb-1 opacity-40" />
                      <span>{t("profile.noCardsYet")}</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-1 scrollbar-thin">
                      {userCards.map((c: any) => {
                        const cardImg = c.card?.image_url || c.image_url;
                        const cardName = c.card?.name || c.name || "Card";
                        const isSelected = newPicture === cardImg;
                        return (
                          <button
                            key={c.id || cardImg}
                            type="button"
                            onClick={() => setNewPicture(cardImg)}
                            className={`relative rounded-xl overflow-hidden aspect-[2.5/3.5] border transition-all ${
                              isSelected
                                ? "border-primary ring-2 ring-primary shadow-sm scale-95"
                                : "border-border/70 hover:border-primary/50"
                            }`}
                            title={cardName}
                          >
                            <img
                              src={cardImg}
                              alt={cardName}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                            {isSelected && (
                              <span className="absolute top-1 right-1 size-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[9px] shadow-xs">
                                <Check className="size-2.5" />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>

                {/* Tab: Custom URL */}
                <TabsContent value="url" className="m-0 focus-visible:outline-none space-y-2">
                  <Input
                    value={newPicture}
                    onChange={(e) => setNewPicture(e.target.value)}
                    placeholder={t("profileModal.urlPlaceholder")}
                    className="rounded-xl h-10 font-mono text-xs bg-background/60"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Insira o link direto de uma imagem (JPG, PNG, WebP) para usá-la como seu avatar exclusivo.
                  </p>
                </TabsContent>
              </Tabs>
            </div>
          </div>

          <div className="pt-4 shrink-0 flex items-center gap-3 border-t border-border/60 mt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditModalOpen(false)}
              className="flex-1 rounded-xl h-11 text-xs font-semibold"
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              onClick={() => updateProfile()}
              disabled={updating || (!newUsername.trim() && !newPicture.trim())}
              className="flex-1 rounded-xl h-11 font-syne font-bold bg-primary text-primary-foreground text-xs shadow-md"
            >
              {updating ? <Loader2 className="size-4 animate-spin mr-1.5" /> : <Check className="size-4 mr-1.5" />}
              {updating ? t("profileModal.saving") : t("profileModal.saveChanges")}
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
    </div>
  );
}
