"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { useApi } from "@/hooks/use-api";
import { Loader2, RefreshCw, Trophy, Coins, Crown, Medal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { balanceTranslate } from "@/lib/balance-translate";
import { Avatar } from "@/components/avatar";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "@/i18n/LanguageContext";

export type RankingItem = {
  id: number;
  username: string;
  picture?: string;
  rarityPoints?: number;
  totalBudget?: number;
  position?: number;
};

export function RankingView({ data }: { data?: RankingItem[] }) {
  const [tab, setTab] = useState<"rarity" | "budget">("rarity");
  const [isSyncing, setIsSyncing] = useState(false);
  const { post } = useApi();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const {
    data: ranking = data || [],
    isLoading,
    refetch,
  } = useQuery<RankingItem[]>({
    queryKey: ["ranking", tab],
    queryFn: async () => {
      const endpoint = tab === "rarity" ? "/ranking/rarity" : "/ranking/budget";
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}${endpoint}?page=1`
      );
      const json = await res.json();
      return json?.data ?? [];
    },
    staleTime: 60 * 1000,
  });

  const handleSyncRarity = async () => {
    setIsSyncing(true);
    try {
      const res = await post("/ranking/sync", {});
      toast({
        title: "Pontos Sincronizados!",
        description: `Seus pontos de raridade foram atualizados para ${res?.data?.data?.rarityPoints ?? 0}.`,
      });
      queryClient.invalidateQueries({ queryKey: ["ranking"] });
      await refetch();
    } catch (err) {
      toast({
        title: "Falha na sincronização",
        description: "Não foi possível recalcular seus pontos no momento.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 font-syne max-w-4xl">
      {/* Cabeçalho */}
      <div className="w-full flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="size-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <Trophy className="size-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
                {t("ranking.title")}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground font-sans">
                {t("ranking.subtitle")}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {tab === "rarity" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncRarity}
              disabled={isSyncing}
              className="font-sans text-xs gap-1.5 rounded-xl border-border hover:bg-secondary"
            >
              <RefreshCw className={`size-3.5 ${isSyncing ? "animate-spin" : ""}`} />
              Sincronizar Pontos
            </Button>
          )}

          <Tabs value={tab} onValueChange={(val) => setTab(val as "rarity" | "budget")}>
            <TabsList className="bg-secondary/60 border border-border p-1 rounded-xl">
              <TabsTrigger
                value="rarity"
                className="text-xs font-bold data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950 rounded-lg"
              >
                <Crown className="size-3.5 mr-1.5" /> {t("ranking.rarityTab")}
              </TabsTrigger>
              <TabsTrigger
                value="budget"
                className="text-xs font-bold data-[state=active]:bg-amber-500 data-[state=active]:text-slate-950 rounded-lg"
              >
                <Coins className="size-3.5 mr-1.5" /> {t("ranking.budgetTab")}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Lista de Ranking */}
      <div className="space-y-3">
        {isLoading && ranking.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="size-8 animate-spin text-amber-500" />
            <p className="text-xs font-sans">Carregando posições do ranking...</p>
          </div>
        ) : ranking.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <p className="text-base font-bold">Nenhum treinador no ranking ainda.</p>
            <p className="text-xs font-sans mt-1">Abra pacotes ou negocie para entrar no placar!</p>
          </div>
        ) : (
          ranking.map((item, index) => {
            const position = item.position || index + 1;
            const isFirst = position === 1;
            const isSecond = position === 2;
            const isThird = position === 3;

            return (
              <Card
                key={item.id || index}
                className={`transition-all duration-300 rounded-2xl border ${
                  isFirst
                    ? "border-amber-400 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent shadow-[0_0_25px_rgba(234,179,8,0.12)] ring-1 ring-amber-400/40"
                    : isSecond
                    ? "border-slate-400/60 bg-slate-500/5"
                    : isThird
                    ? "border-amber-700/50 bg-amber-900/5"
                    : "border-border/80 bg-card hover:border-border"
                }`}
              >
                <CardHeader className="p-3.5 sm:p-4 flex flex-row items-center justify-between space-y-0 gap-3">
                  {/* Posição e Avatar */}
                  <div className="flex items-center gap-3">
                    <div className="size-8 sm:size-10 rounded-xl flex items-center justify-center font-mono font-black text-sm shrink-0">
                      {isFirst ? (
                        <span className="text-2xl">🥇</span>
                      ) : isSecond ? (
                        <span className="text-2xl">🥈</span>
                      ) : isThird ? (
                        <span className="text-2xl">🥉</span>
                      ) : (
                        <span className="text-muted-foreground font-sans font-bold">#{position}</span>
                      )}
                    </div>

                    <Avatar username={item.username} src={item.picture} className="size-10 sm:size-11 border border-border/80" />

                    <div>
                      <CardTitle className="text-sm sm:text-base font-bold truncate max-w-[160px] sm:max-w-[260px] text-foreground">
                        {item.username}
                      </CardTitle>
                      <span className="text-[11px] text-muted-foreground font-sans">
                        Treinador #{item.id}
                      </span>
                    </div>
                  </div>

                  {/* Pontuação */}
                  <div className="text-right shrink-0">
                    <div className="text-base sm:text-lg font-mono font-black text-foreground">
                      {tab === "rarity"
                        ? (item.rarityPoints ?? 0).toLocaleString("pt-BR")
                        : `${balanceTranslate(item.totalBudget ?? 0)} moedas`}
                    </div>
                    <span className="text-[10px] sm:text-xs text-muted-foreground font-sans">
                      {tab === "rarity" ? "🏆 Pontos de Raridade" : "🪙 Riqueza Acumulada"}
                    </span>
                  </div>
                </CardHeader>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}