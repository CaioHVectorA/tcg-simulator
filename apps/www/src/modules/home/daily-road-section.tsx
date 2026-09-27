"use client";

import React, { useState, useEffect, useRef } from "react";
import { useApi } from "@/hooks/use-api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { soundFx } from "@/lib/sound-fx";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RewardModal } from "@/components/ui/reward-modal";
import {
  Gift,
  Clock,
  Sparkles,
  Coins,
  CheckCircle2,
  Flame,
  Package as PackageIcon,
  ChevronRight,
  ChevronLeft,
  Trophy,
  Crown,
} from "lucide-react";
import { balanceTranslate } from "@/lib/balance-translate";
import { useTranslation } from "@/i18n/LanguageContext";

interface DailyRewardItem {
  day: number;
  coins: number;
  packName: string | null;
  isMilestone: boolean;
  isGrandFinale?: boolean;
  title: string;
}

interface DailyRoadData {
  currentDay: number;
  canClaim: boolean;
  nextDiff: number;
  completedCycles: number;
  totalClaimedDays: number;
  rewards: DailyRewardItem[];
  todayReward: DailyRewardItem;
}

function formatCountdown(ms: number, readyText: string) {
  if (ms <= 0) return readyText;
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
}

export function DailyRoadSection() {
  const { t } = useTranslation();
  const { get, post } = useApi();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [rewardModalOpen, setRewardModalOpen] = useState(false);
  const [rewardAmount, setRewardAmount] = useState(0);
  const [rewardPack, setRewardPack] = useState<string | null>(null);
  const [remainingMs, setRemainingMs] = useState<number | null>(null);

  const { data, isLoading } = useQuery<DailyRoadData>({
    queryKey: ["daily-road"],
    queryFn: async () => {
      const res = await get("/user/daily-road");
      return res.data.data;
    },
    staleTime: 30 * 1000,
  });

  useEffect(() => {
    if (data?.nextDiff !== undefined) {
      setRemainingMs(data.nextDiff);
    }
  }, [data]);

  useEffect(() => {
    if (remainingMs === null || remainingMs <= 0) return;
    const timer = setInterval(() => {
      setRemainingMs((prev) => (prev !== null && prev > 1000 ? prev - 1000 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [remainingMs]);

  // Auto-scroll para o dia atual no primeiro carregamento
  useEffect(() => {
    if (data?.currentDay && scrollContainerRef.current) {
      const targetElement = document.getElementById(`road-day-${data.currentDay}`);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }
  }, [data?.currentDay]);

  const { mutate: claimDaily, isPending: claiming } = useMutation({
    mutationFn: async () => {
      const res = await post("/user/daily-road/claim", {});
      return res.data;
    },
    onSuccess: (res: any) => {
      if (res?.ok) {
        const claimed = data?.todayReward?.coins || 1000;
        const pack = data?.todayReward?.packName || null;
        soundFx.playLegendaryFanfare();
        setRewardAmount(claimed);
        setRewardPack(pack);
        setRewardModalOpen(true);
        queryClient.invalidateQueries({ queryKey: ["user"] });
        queryClient.invalidateQueries({ queryKey: ["daily-road"] });
        queryClient.invalidateQueries({ queryKey: ["packages"] });
      } else {
        toast({
          title: t("dailyRoad.claimErrorTitle"),
          description: res?.toast || res?.error || t("dailyRoad.waitRecharge"),
          variant: "destructive",
        });
      }
    },
    onError: (err: any) => {
      toast({
        title: t("dailyRoad.claimUnavailableTitle"),
        description: err.response?.data?.toast || t("dailyRoad.waitRecharge"),
        variant: "destructive",
      });
    },
  });

  const scrollRoad = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;
    const amount = direction === "left" ? -320 : 320;
    scrollContainerRef.current.scrollBy({ left: amount, behavior: "smooth" });
  };

  if (isLoading || !data) {
    return (
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 animate-pulse space-y-4 font-syne">
        <div className="flex items-center justify-between">
          <div className="h-6 w-48 bg-muted rounded-xl" />
          <div className="h-10 w-32 bg-muted rounded-xl" />
        </div>
        <div className="h-32 w-full bg-muted/60 rounded-2xl" />
      </div>
    );
  }

  const isReady = data.canClaim || (remainingMs !== null && remainingMs <= 0);
  const currentDay = data.currentDay || 1;
  const rewards = data.rewards || [];
  const todayReward = data.todayReward || rewards[currentDay - 1];
  const progressPercent = Math.min(100, Math.round(((currentDay - 1) / 30) * 100));

  return (
    <section className="font-syne relative overflow-hidden rounded-3xl border border-border bg-card shadow-lg p-5 sm:p-8">
      {/* Glow e iluminação ambiente de fundo */}
      <div className="absolute -top-24 -right-24 size-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 size-72 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      {/* Topo da Seção: Informações de Status e Botão de Resgate */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-border relative z-10">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-bold">
              <Flame className="size-3.5 fill-amber-500 text-amber-500" />
              <span>{t("dailyRoad.tag")}</span>
            </span>
            <Badge variant="outline" className="font-mono text-xs font-semibold border-border">
              {t("dailyRoad.cycleDay", { cycle: data.completedCycles + 1, day: currentDay })}
            </Badge>
            {isReady ? (
              <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold text-xs">
                {t("dailyRoad.prizeAvailable")}
              </Badge>
            ) : (
              <Badge variant="secondary" className="font-mono text-xs">
                {t("dailyRoad.rechargeInProgress")}
              </Badge>
            )}
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            {t("dailyRoad.title")}
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl font-sans">
            {t("dailyRoad.subtitle")}
          </p>
        </div>

        {/* Card do Resgate de Hoje */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 bg-secondary/50 p-3.5 sm:p-4 rounded-2xl border border-border">
          <div className="flex items-center gap-3">
            <div className={`size-12 rounded-xl flex items-center justify-center shrink-0 border ${
              isReady 
                ? "bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/30" 
                : "bg-muted text-muted-foreground border-border"
            }`}>
              <Gift className={`size-6 ${isReady ? "animate-bounce" : ""}`} />
            </div>
            <div>
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block font-mono">
                {isReady ? t("dailyRoad.todayReward") : t("dailyRoad.nextClaim")}
              </span>
              <div className="flex items-center gap-1.5 font-black text-sm sm:text-base text-foreground">
                <Coins className="size-4 text-amber-500 fill-amber-500/20" />
                <span>+{balanceTranslate(todayReward?.coins || 1000)}</span>
                {todayReward?.packName && (
                  <span className="text-xs text-primary font-bold ml-1">
                    + 1x {todayReward.packName}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="sm:ml-2">
            {isReady ? (
              <Button
                onClick={() => claimDaily()}
                disabled={claiming}
                className="w-full sm:w-auto h-11 px-6 font-black text-sm bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 shadow-lg shadow-amber-500/25 hover:scale-105 active:scale-95 transition-all"
              >
                <Sparkles className="size-4 mr-1.5" />
                <span>{claiming ? t("dailyRoad.collecting") : t("dailyRoad.claimDay", { day: currentDay })}</span>
              </Button>
            ) : (
              <div className="flex items-center gap-2 bg-card px-4 py-2.5 rounded-xl border border-border text-xs font-mono font-bold text-muted-foreground justify-center">
                <Clock className="size-4 text-amber-500 shrink-0" />
                <span>{formatCountdown(remainingMs || 0, t("dailyRoad.availableNow"))}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Barra de Progresso Global do Mês */}
      <div className="py-4 space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-muted-foreground font-sans">
            {t("dailyRoad.overallProgress", { days: data.totalClaimedDays })}
          </span>
          <span className="font-mono text-primary font-bold">
            {t("dailyRoad.completedPercent", { percent: progressPercent })}
          </span>
        </div>
        <Progress value={progressPercent} className="h-2.5 bg-secondary" />
      </div>

      {/* Controles de Rolagem da Estrada */}
      <div className="flex items-center justify-between pt-2 pb-3">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          {t("dailyRoad.fullTrail")}
        </span>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon"
            onClick={() => scrollRoad("left")}
            className="size-8 rounded-lg border-border"
            title="Scroll left"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => scrollRoad("right")}
            className="size-8 rounded-lg border-border"
            title="Scroll right"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {/* Trilha Horizontal Ampla dos 30 Dias */}
      <div
        ref={scrollContainerRef}
        className="flex gap-3 overflow-x-auto pb-4 pt-1 scroll-smooth scrollbar-thin scrollbar-thumb-muted-foreground/20"
      >
        {rewards.map((reward) => {
          const isPast = reward.day < currentDay;
          const isCurrent = reward.day === currentDay;
          const isFuture = reward.day > currentDay;

          return (
            <div
              key={reward.day}
              id={`road-day-${reward.day}`}
              className={`relative flex flex-col justify-between shrink-0 w-36 sm:w-40 p-3.5 rounded-2xl border transition-all duration-300 select-none ${
                isCurrent
                  ? "bg-amber-500/10 border-amber-500 shadow-lg shadow-amber-500/15 ring-2 ring-amber-500/40 scale-[1.02]"
                  : isPast
                  ? "bg-secondary/40 border-border/60 opacity-70"
                  : reward.isMilestone
                  ? "bg-primary/5 border-primary/40 hover:border-primary/70"
                  : "bg-card border-border hover:border-border/80"
              }`}
            >
              {/* Badge de Status / Marco */}
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[11px] font-mono font-black ${
                  isCurrent ? "text-amber-500" : "text-muted-foreground"
                }`}>
                  {t("dailyRoad.day", { day: reward.day })}
                </span>

                {isPast && (
                  <CheckCircle2 className="size-4 text-emerald-500" />
                )}
                {isCurrent && (
                  <Badge className="bg-amber-500 text-slate-950 font-black text-[9px] px-1.5 py-0">
                    {t("dailyRoad.today")}
                  </Badge>
                )}
                {isFuture && reward.isMilestone && (
                  <Crown className="size-4 text-amber-500" />
                )}
              </div>

              {/* Ícone Central */}
              <div className="my-2 flex flex-col items-center justify-center text-center">
                {reward.isGrandFinale ? (
                  <div className="size-12 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 text-slate-950 flex items-center justify-center shadow-md mb-1.5 animate-pulse">
                    <Trophy className="size-6" />
                  </div>
                ) : reward.packName ? (
                  <div className="size-11 rounded-xl bg-primary/15 text-primary border border-primary/30 flex items-center justify-center shadow-xs mb-1.5">
                    <PackageIcon className="size-5" />
                  </div>
                ) : (
                  <div className="size-11 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center shadow-xs mb-1.5">
                    <Coins className="size-5" />
                  </div>
                )}

                {/* Valor de Moedas */}
                <span className="font-mono font-black text-sm sm:text-base text-foreground flex items-center gap-1">
                  <Coins className="size-3.5 text-amber-500 shrink-0" />
                  {balanceTranslate(reward.coins)}
                </span>
              </div>

              {/* Nome do Booster ou Título */}
              <div className="pt-2 border-t border-border/60 text-center">
                {reward.packName ? (
                  <span className="text-[10px] font-bold text-primary truncate block" title={reward.packName}>
                    🎁 1x {reward.packName}
                  </span>
                ) : (
                  <span className="text-[10px] text-muted-foreground truncate block font-sans">
                    {reward.title}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Celebratório de Recompensa Resgatada */}
      <RewardModal
        open={rewardModalOpen}
        onOpenChange={setRewardModalOpen}
        title={t("dailyRoad.modalSuccessTitle", { day: currentDay })}
        description={t("dailyRoad.modalSuccessDesc", {
          coins: balanceTranslate(rewardAmount),
          pack: rewardPack ? t("dailyRoad.modalPackDesc", { pack: rewardPack }) : "",
        })}
        rewardAmount={rewardAmount}
        iconType="general"
      />
    </section>
  );
}
