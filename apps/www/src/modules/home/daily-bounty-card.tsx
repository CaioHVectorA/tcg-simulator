"use client";

import React, { useState, useEffect } from "react";
import { useApi } from "@/hooks/use-api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { soundFx } from "@/lib/sound-fx";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RewardModal } from "@/components/ui/reward-modal";
import { DailyRoadModal } from "./daily-road-modal";
import { Gift, Clock, Sparkles, Coins, CheckCircle2, Calendar, Flame, Package as PackageIcon } from "lucide-react";
import { balanceTranslate } from "@/lib/balance-translate";

interface DailyRewardItem {
  day: number;
  coins: number;
  packName: string | null;
  isMilestone: boolean;
  title: string;
}

interface DailyRoadData {
  currentDay: number;
  canClaim: boolean;
  nextDiff: number;
  completedCycles: number;
  totalClaimedDays: number;
  todayReward: DailyRewardItem;
}

function formatCountdown(ms: number) {
  if (ms <= 0) return "Pronto!";
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
}

export function DailyBountyCard() {
  const { get, post } = useApi();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [roadModalOpen, setRoadModalOpen] = useState(false);
  const [rewardModalOpen, setRewardModalOpen] = useState(false);
  const [rewardAmount, setRewardAmount] = useState(0);
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

  const { mutate: claimDaily, isPending: claiming } = useMutation({
    mutationFn: async () => {
      const res = await post("/user/daily-road/claim", {});
      return res.data;
    },
    onSuccess: (res: any) => {
      if (res?.ok) {
        const claimed = data?.todayReward?.coins || 500;
        soundFx.playLegendaryFanfare();
        setRewardAmount(claimed);
        setRewardModalOpen(true);
        queryClient.invalidateQueries({ queryKey: ["user"] });
        queryClient.invalidateQueries({ queryKey: ["daily-road"] });
      } else {
        toast({
          title: "Não foi possível resgatar",
          description: res?.toast || res?.error || "Aguarde o tempo de recarga.",
          variant: "destructive",
        });
      }
    },
    onError: (err: any) => {
      toast({
        title: "Recompensa Indisponível",
        description: err.response?.data?.toast || "Aguarde o tempo de recarga.",
        variant: "destructive",
      });
    },
  });

  if (isLoading || !data) {
    return (
      <div className="rounded-2xl border border-border/80 bg-card/60 p-6 flex items-center justify-between animate-pulse">
        <div className="space-y-2">
          <div className="h-4 w-32 bg-muted rounded" />
          <div className="h-6 w-48 bg-muted rounded" />
        </div>
        <div className="h-10 w-32 bg-muted rounded-xl" />
      </div>
    );
  }

  const isReady = data.canClaim || (remainingMs !== null && remainingMs <= 0);
  const currentDay = data.currentDay || 1;
  const todayReward = data.todayReward;

  return (
    <>
      <div className="rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card/90 to-muted/20 p-4 sm:p-6 shadow-md backdrop-blur-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden group">
        {/* Glow de fundo */}
        <div className="absolute -top-12 -left-12 size-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center gap-3 sm:gap-4 z-10 min-w-0">
          <button
            onClick={() => setRoadModalOpen(true)}
            className={`size-12 sm:size-14 rounded-2xl flex items-center justify-center shrink-0 shadow-md transition-transform hover:scale-105 active:scale-95 cursor-pointer ${
              isReady
                ? "bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-500 text-slate-950 shadow-amber-500/25 ring-2 ring-amber-400/40"
                : "bg-muted text-muted-foreground border border-border"
            }`}
          >
            <Gift className={`size-6 sm:size-7 ${isReady ? "animate-bounce" : ""}`} />
          </button>

          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <Badge variant="outline" className={`font-mono text-[10px] uppercase ${
                isReady
                  ? "border-amber-500/40 text-amber-500 bg-amber-500/10"
                  : "border-border text-muted-foreground"
              }`}>
                {isReady ? "Disponível Hoje" : "Aguardando Recarga"}
              </Badge>
              <span className="text-[11px] font-mono text-muted-foreground font-semibold flex items-center gap-1">
                <Flame className="size-3 text-amber-500 fill-amber-500" />
                <span>Dia {currentDay} de 30</span>
              </span>
            </div>

            <h3 className="font-syne font-black text-base sm:text-lg text-foreground truncate">
              {isReady
                ? `Resgate seu Bônus do Dia ${currentDay}!`
                : `Dia ${currentDay} Concluído! Volte amanhã`}
            </h3>

            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2 flex-wrap">
              <span>
                Prêmio de hoje: <strong className="text-foreground">+{balanceTranslate(todayReward?.coins || 500)} moedas</strong>
                {todayReward?.packName ? ` + 1x ${todayReward.packName}` : ""}
              </span>
            </p>
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center gap-2 w-full md:w-auto shrink-0 z-10">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRoadModalOpen(true)}
            className="h-10 text-xs font-syne font-bold flex-1 md:flex-initial gap-1.5"
          >
            <Calendar className="size-3.5 text-amber-500" />
            <span>Ver Estrada 30 Dias</span>
          </Button>

          {isReady ? (
            <Button
              onClick={() => claimDaily()}
              disabled={claiming}
              className="h-10 text-xs sm:text-sm font-syne font-black bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 shadow-md shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all flex-1 md:flex-initial"
            >
              <Sparkles className="size-3.5 mr-1" />
              <span>{claiming ? "Resgatando..." : `Coletar Dia ${currentDay}`}</span>
            </Button>
          ) : (
            <div className="flex items-center gap-2 bg-secondary px-3 py-2 rounded-xl border border-border text-xs text-muted-foreground font-mono flex-1 md:flex-initial justify-center">
              <Clock className="size-3.5 text-muted-foreground shrink-0" />
              <span>{formatCountdown(remainingMs || 0)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Modal Interativo da Estrada de 30 Dias */}
      <DailyRoadModal open={roadModalOpen} onOpenChange={setRoadModalOpen} />

      {/* Modal Celebratório de Bônus Coletado */}
      <RewardModal
        open={rewardModalOpen}
        onOpenChange={setRewardModalOpen}
        title={`Recompensa do Dia ${currentDay} Resgatada! 🎉`}
        description={`Você recebeu ${balanceTranslate(rewardAmount)} moedas para turbinar sua coleção!`}
        rewardAmount={rewardAmount}
        iconType="bounty"
      />
    </>
  );
}
