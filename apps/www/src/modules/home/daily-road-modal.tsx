"use client";

import React, { useState } from "react";
import { useApi } from "@/hooks/use-api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { soundFx } from "@/lib/sound-fx";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RewardModal } from "@/components/ui/reward-modal";
import {
  Gift,
  Coins,
  Package as PackageIcon,
  CheckCircle2,
  Lock,
  Sparkles,
  Flame,
  Crown,
  Trophy,
} from "lucide-react";
import { balanceTranslate } from "@/lib/balance-translate";
import { motion, AnimatePresence } from "framer-motion";

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

export function DailyRoadModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { get, post } = useApi();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [claimedReward, setClaimedReward] = useState<DailyRewardItem | null>(null);

  const { data, isLoading, refetch } = useQuery<DailyRoadData>({
    queryKey: ["daily-road"],
    queryFn: async () => {
      const res = await get("/user/daily-road");
      return res.data.data;
    },
    enabled: open,
    staleTime: 10 * 1000,
  });

  const { mutate: claimReward, isPending: claiming } = useMutation({
    mutationFn: async () => {
      const res = await post("/user/daily-road/claim", {});
      return res.data;
    },
    onSuccess: (res: any) => {
      if (res?.ok) {
        soundFx.playLegendaryFanfare();
        setClaimedReward(res?.data?.reward || data?.todayReward || null);
        setSuccessModalOpen(true);
        queryClient.invalidateQueries({ queryKey: ["user"] });
        queryClient.invalidateQueries({ queryKey: ["daily-road"] });
        queryClient.invalidateQueries({ queryKey: ["daily-bounty"] });
        refetch();
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
        title: "Erro ao resgatar",
        description: err.response?.data?.toast || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    },
  });

  if (!data && isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="font-syne max-w-2xl bg-card border-border p-8 text-center">
          <div className="flex flex-col items-center justify-center gap-3">
            <Gift className="size-10 text-amber-500 animate-bounce" />
            <p className="text-sm font-medium">Carregando Estrada de 30 Dias...</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const { currentDay, canClaim, rewards = [] } = data || {};

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="font-syne max-w-4xl max-h-[92vh] flex flex-col p-4 sm:p-6 bg-gradient-to-b from-card via-card to-background border-border text-foreground overflow-hidden">
          <DialogHeader className="pb-3 border-b border-border">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[11px] font-bold mb-1">
                  <Flame className="size-3.5 fill-amber-500" />
                  <span>Jornada do Treinador • 30 Dias</span>
                </div>
                <DialogTitle className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
                  <span>Estrada de Recompensas</span>
                  <Sparkles className="size-5 text-amber-400" />
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Entre todos os dias para acumular moedas e boosters especiais no 7º, 14º, 21º, 28º e 30º dia!
                </DialogDescription>
              </div>

              {canClaim && (
                <Button
                  onClick={() => claimReward()}
                  disabled={claiming}
                  className="bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 text-slate-950 font-black shadow-lg shadow-amber-500/25 hover:scale-105 active:scale-95 transition-all text-xs sm:text-sm px-4 h-10 shrink-0"
                >
                  <Gift className="size-4 mr-1.5 animate-bounce" />
                  <span>{claiming ? "Resgatando..." : `Resgatar Dia ${currentDay}!`}</span>
                </Button>
              )}
            </div>
          </DialogHeader>

          {/* Grid de 30 Dias com Scroll */}
          <ScrollArea className="flex-1 pr-2 py-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-2.5 sm:gap-3">
              {rewards.map((reward) => {
                const isClaimed = reward.day < (currentDay || 1) || (!canClaim && reward.day === currentDay);
                const isToday = reward.day === currentDay;
                const isReadyToClaim = isToday && canClaim;
                const isFuture = reward.day > (currentDay || 1);

                return (
                  <motion.div
                    key={reward.day}
                    whileHover={{ scale: isReadyToClaim ? 1.05 : 1.02 }}
                    className={`relative rounded-xl p-3 flex flex-col justify-between border-2 transition-all ${
                      reward.isGrandFinale
                        ? "col-span-2 sm:col-span-3 md:col-span-2 bg-gradient-to-br from-amber-500/20 via-purple-500/20 to-yellow-500/10 border-amber-400/90 shadow-lg shadow-amber-500/20 ring-2 ring-amber-400/30"
                        : reward.isMilestone
                        ? "bg-gradient-to-br from-amber-500/10 to-card border-amber-500/60 shadow-md"
                        : isReadyToClaim
                        ? "bg-amber-500/10 border-amber-400 shadow-md ring-2 ring-amber-400/40"
                        : isClaimed
                        ? "bg-muted/40 border-border/60 opacity-70"
                        : "bg-card border-border/80"
                    }`}
                  >
                    {/* Header do Card (Dia + Status) */}
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[11px] font-mono font-black px-1.5 py-0.5 rounded ${
                        reward.isGrandFinale
                          ? "bg-amber-500 text-slate-950"
                          : reward.isMilestone
                          ? "bg-amber-500/20 text-amber-500 border border-amber-500/30"
                          : "bg-secondary text-secondary-foreground"
                      }`}>
                        DIA {reward.day}
                      </span>

                      {isClaimed ? (
                        <div className="flex items-center gap-0.5 text-emerald-500 text-[10px] font-bold">
                          <CheckCircle2 className="size-3.5 fill-emerald-500/20" />
                          <span>Obtido</span>
                        </div>
                      ) : isReadyToClaim ? (
                        <Badge className="bg-amber-500 text-slate-950 font-black text-[9px] uppercase px-1.5 py-0 animate-pulse">
                          Hoje!
                        </Badge>
                      ) : (
                        <Lock className="size-3 text-muted-foreground/60" />
                      )}
                    </div>

                    {/* Ícone da Recompensa */}
                    <div className="my-auto py-2 flex flex-col items-center justify-center text-center">
                      {reward.isGrandFinale ? (
                        <div className="size-12 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-200 text-slate-950 flex items-center justify-center shadow-md animate-bounce mb-1">
                          <Crown className="size-7" />
                        </div>
                      ) : reward.packName ? (
                        <div className="size-10 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/40 flex items-center justify-center shadow-xs mb-1">
                          <PackageIcon className="size-5" />
                        </div>
                      ) : (
                        <div className="size-9 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center mb-1">
                          <Coins className="size-4" />
                        </div>
                      )}

                      <span className="text-xs sm:text-sm font-black text-foreground">
                        +{balanceTranslate(reward.coins)}
                      </span>

                      {reward.packName && (
                        <span className="text-[10px] font-bold text-purple-400 line-clamp-1 mt-0.5">
                          +1 {reward.packName}
                        </span>
                      )}
                    </div>

                    {/* Botão Resgatar Direto no Card do Dia */}
                    {isReadyToClaim && (
                      <Button
                        size="sm"
                        onClick={() => claimReward()}
                        disabled={claiming}
                        className="w-full mt-2 h-7 text-[11px] font-black bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-sm"
                      >
                        Resgatar
                      </Button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Modal Celebratório de Sucesso */}
      <RewardModal
        open={successModalOpen}
        onOpenChange={setSuccessModalOpen}
        title="Recompensa Diária Conquistada! 🎉"
        description={
          claimedReward?.packName
            ? `Você garantiu ${balanceTranslate(claimedReward.coins)} moedas e um ${claimedReward.packName} direto no seu inventário!`
            : `Você garantiu ${balanceTranslate(claimedReward?.coins || 0)} moedas para abrir pacotes!`
        }
        rewardAmount={claimedReward?.coins}
        iconType={claimedReward?.packName ? "general" : "bounty"}
      />
    </>
  );
}
