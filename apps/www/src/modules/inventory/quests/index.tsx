"use client";

import { useState, useEffect, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useApi } from "@/hooks/use-api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Clock, Coins, Flame, Sparkles, Trophy } from "lucide-react";
import { RewardModal } from "@/components/ui/reward-modal";
import { soundFx } from "@/lib/sound-fx";
import { motion, AnimatePresence } from "framer-motion";

export type Quest = {
  name: string;
  description: string;
  id: number;
  total: number;
  progress: number;
  completed: boolean;
  currentLevel: number;
  fullCompleted: boolean;
  actualReward: number;
  isDiary: boolean;
};

// Hook de Countdown até as 10h da manhã (horário do reset diário)
function useDailyResetCountdown() {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const nextReset = new Date();
      nextReset.setHours(10, 0, 0, 0);

      // Se já passou das 10h hoje, o próximo reset é amanhã às 10h
      if (now.getTime() >= nextReset.getTime()) {
        nextReset.setDate(nextReset.getDate() + 1);
      }

      const diffMs = nextReset.getTime() - now.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      const pad = (n: number) => n.toString().padStart(2, "0");
      setTimeLeft(`${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  return timeLeft;
}

function QuestCard({
  quest,
  onClaim,
  isClaiming,
}: {
  quest: Quest;
  onClaim: (quest: Quest) => void;
  isClaiming: boolean;
}) {
  const isReadyToClaim = quest.completed && !quest.fullCompleted;
  const progressPercent = Math.min((quest.progress / quest.total) * 100, 100);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={`font-syne transition-all duration-300 rounded-2xl relative overflow-hidden ${
          quest.fullCompleted
            ? "border-emerald-500/30 bg-card/60 opacity-80"
            : isReadyToClaim
            ? "border-amber-400 bg-amber-500/5 shadow-[0_0_25px_rgba(234,179,8,0.15)] ring-1 ring-amber-400/50"
            : "border-border/80 bg-card hover:border-border"
        }`}
      >
        <CardHeader className="p-4 sm:p-5 pb-3">
          <div className="justify-between flex items-start gap-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-base sm:text-lg font-bold text-foreground">
                  {quest.name}
                </CardTitle>
                {quest.isDiary && (
                  <Badge variant="outline" className="text-[10px] uppercase font-mono border-sky-500/40 text-sky-400 bg-sky-500/10">
                    Diária
                  </Badge>
                )}
              </div>
              <CardDescription className="text-xs text-muted-foreground leading-relaxed">
                {quest.description}
              </CardDescription>
            </div>

            {quest.fullCompleted ? (
              <Badge className="rounded-full bg-emerald-600 text-white font-mono text-xs px-2 py-0.5">
                <Check className="size-3.5 mr-1" /> Concluída
              </Badge>
            ) : (
              <Badge variant="outline" className="rounded-full font-mono text-xs border-border">
                Nível {quest.currentLevel}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5 pt-0 pb-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-mono mb-1.5">
            <span>Progresso</span>
            <span className="font-bold text-foreground">
              {quest.progress} / {quest.total} ({Math.round(progressPercent)}%)
            </span>
          </div>
          <Progress
            value={quest.fullCompleted ? 100 : progressPercent}
            className={`h-2.5 rounded-full ${
              quest.fullCompleted
                ? "[&>div]:bg-emerald-500"
                : isReadyToClaim
                ? "[&>div]:bg-amber-400"
                : "[&>div]:bg-primary"
            }`}
          />
        </CardContent>

        <CardFooter className="p-4 sm:p-5 pt-0 flex items-center justify-between gap-3 border-t border-border/40 mt-1">
          <Badge
            variant="secondary"
            className="text-xs font-bold font-mono bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2.5 py-1 flex items-center gap-1.5"
          >
            <Coins className="size-3.5" /> +{quest.actualReward} Moedas
          </Badge>

          {quest.fullCompleted ? (
            <Button variant="outline" disabled size="sm" className="text-xs text-muted-foreground h-8">
              Recompensa Coletada
            </Button>
          ) : isReadyToClaim ? (
            <Button
              size="sm"
              disabled={isClaiming}
              className="font-bold text-xs bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-md shadow-amber-500/20 h-8 px-4 animate-pulse"
              onClick={() => onClaim(quest)}
            >
              <Sparkles className="size-3.5 mr-1.5" /> Coletar Recompensa
            </Button>
          ) : (
            <Button variant="outline" disabled size="sm" className="text-xs h-8">
              Em Progresso
            </Button>
          )}
        </CardFooter>
      </Card>
    </motion.div>
  );
}

export function Quests() {
  const { get, post, patch } = useApi();
  const [rewardModalOpen, setRewardModalOpen] = useState(false);
  const [rewardAmount, setRewardAmount] = useState<number | null>(null);
  const [rewardTitle, setRewardTitle] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const dailyResetTime = useDailyResetCountdown();

  const { data, isLoading, refetch } = useQuery<Quest[]>({
    queryKey: ["quests"],
    queryFn: async () => {
      const res = await get("/quests");
      if (res.data.data.length > 0 && res.data.data.length !== 3) return res.data.data;
      await post("/quests/setup", {});
      const newRes = await get("/quests");
      return newRes.data.data;
    },
  });

  const qClient = useQueryClient();
  const { mutateAsync, isPending: isMutating } = useMutation({
    mutationKey: ["quests", "claim"],
    mutationFn: async (quest: Quest) => {
      if (isMutating) return;
      const res = await patch(`/quests/get-reward/${quest.id}`, {});
      soundFx.playSuccess();
      setRewardAmount(quest.actualReward);
      setRewardTitle(`Missão: ${quest.name}`);
      setRewardModalOpen(true);
      await qClient.invalidateQueries({ queryKey: ["user"] });
      await qClient.refetchQueries({ queryKey: ["user"] });
      await refetch();
      return res.data.data;
    },
  });

  const handleClaim = (quest: Quest) => {
    mutateAsync(quest);
  };

  const handleClaimAllAvailable = async () => {
    if (!data) return;
    const readyQuests = data.filter((q) => q.completed && !q.fullCompleted);
    for (const quest of readyQuests) {
      await mutateAsync(quest);
    }
  };

  const questsList = data || [];

  // Categorizações
  const diaryQuests = useMemo(() => questsList.filter((d) => d.isDiary), [questsList]);
  const generalQuests = useMemo(() => questsList.filter((d) => !d.isDiary), [questsList]);
  const completedQuests = useMemo(() => questsList.filter((d) => d.fullCompleted), [questsList]);
  const readyToClaimCount = useMemo(
    () => questsList.filter((d) => d.completed && !d.fullCompleted).length,
    [questsList]
  );
  const totalCoinsAvailableToClaim = useMemo(
    () =>
      questsList
        .filter((d) => d.completed && !d.fullCompleted)
        .reduce((sum, q) => sum + q.actualReward, 0),
    [questsList]
  );

  const filteredQuests = useMemo(() => {
    if (activeTab === "daily") return diaryQuests;
    if (activeTab === "general") return generalQuests;
    if (activeTab === "completed") return completedQuests;
    return questsList;
  }, [activeTab, questsList, diaryQuests, generalQuests, completedQuests]);

  if (isLoading) {
    return (
      <div className="col-span-full py-16 flex flex-col items-center justify-center gap-3 font-syne text-muted-foreground">
        <Sparkles className="size-8 text-amber-400 animate-spin" />
        <p>Carregando missões e objetivos...</p>
      </div>
    );
  }

  return (
    <div className="col-span-full font-syne space-y-6">
      {/* Banner de Estatísticas & Countdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-card/60 backdrop-blur-md border border-border/80 rounded-2xl p-5 shadow-xs">
        {/* Reset Diário */}
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Clock className="size-6" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground font-semibold block">
              Próximo Reset Diário
            </span>
            <span className="text-base font-bold font-mono text-sky-400">
              {dailyResetTime || "Calculando..."}
            </span>
          </div>
        </div>

        {/* Progresso Geral de Conclusão */}
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Trophy className="size-6" />
          </div>
          <div>
            <span className="text-xs text-muted-foreground font-semibold block">
              Missões Concluídas
            </span>
            <span className="text-base font-bold font-mono text-foreground">
              {completedQuests.length} / {questsList.length} completas
            </span>
          </div>
        </div>

        {/* Recompensas Prontas para Coleta */}
        <div className="flex items-center justify-between md:justify-end gap-3.5">
          {readyToClaimCount > 0 ? (
            <Button
              onClick={handleClaimAllAvailable}
              disabled={isMutating}
              className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold shadow-md shadow-amber-500/20 text-xs px-4 py-2"
            >
              <Sparkles className="size-4 mr-1.5" /> Coletar Todas ({totalCoinsAvailableToClaim} moedas)
            </Button>
          ) : (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Check className="size-4 text-emerald-500" />
              <span>Nenhuma recompensa pendente</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs de Filtro */}
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-muted/60 p-1 rounded-xl">
          <TabsTrigger value="all" className="rounded-lg text-xs font-semibold">
            Todas ({questsList.length})
          </TabsTrigger>
          <TabsTrigger value="daily" className="rounded-lg text-xs font-semibold">
            Diárias ({diaryQuests.length})
            {diaryQuests.some((q) => q.completed && !q.fullCompleted) && (
              <span className="ml-1.5 size-2 rounded-full bg-amber-400 animate-ping" />
            )}
          </TabsTrigger>
          <TabsTrigger value="general" className="rounded-lg text-xs font-semibold">
            Progressão ({generalQuests.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="rounded-lg text-xs font-semibold">
            Concluídas ({completedQuests.length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Grid de Missões */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <AnimatePresence>
          {filteredQuests.map((quest) => (
            <QuestCard
              key={quest.id}
              quest={quest}
              onClaim={handleClaim}
              isClaiming={isMutating}
            />
          ))}
        </AnimatePresence>
      </div>

      {filteredQuests.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm font-mono">Nenhuma missão encontrada nesta categoria.</p>
        </div>
      )}

      {/* Modal de Recompensa */}
      <RewardModal
        open={rewardModalOpen}
        onOpenChange={setRewardModalOpen}
        iconType="quest"
        title="Recompensa de Missão Coletada! 🏆"
        description={rewardTitle}
        rewardAmount={rewardAmount || undefined}
      />
    </div>
  );
}