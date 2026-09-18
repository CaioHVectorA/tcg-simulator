"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  MapPin,
  Lock,
  Compass,
  CheckCircle2,
  Sparkles,
  Coins,
  ArrowRight,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { soundFx } from "@/lib/sound-fx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { loadTcgImg } from "@/lib/load-tcg-img";

interface AreaItem {
  id: number;
  name: string;
  region: string;
  description: string;
  requiredLevel: number;
  typeTheme: string;
  accentColor: string;
  imageUrl: string;
  cardTypes: string[];
  baseRewardCoins: number;
  unlocked: boolean;
  exploredToday: boolean;
  levelDifference: number;
}

interface ExplorationResult {
  areaName: string;
  coins: number;
  card: {
    id: number;
    name: string;
    image_url: string;
    rarity: number;
    type: string;
    hp: number;
  } | null;
}

export default function AreasPage() {
  const { get, post } = useApi();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [explorationModal, setExplorationModal] = useState<ExplorationResult | null>(null);

  const { data, isLoading } = useQuery<{
    userLevel: number;
    xp: number;
    areas: AreaItem[];
  }>({
    queryKey: ["areas"],
    queryFn: async () => {
      const res = await get("/areas");
      return res.data.data;
    },
  });

  const { mutate: exploreArea, isPending: exploring } = useMutation({
    mutationFn: async (areaId: number) => {
      const res = await post(`/areas/explore/${areaId}`, {});
      return res.data.data as ExplorationResult;
    },
    onSuccess: (result) => {
      soundFx.playLegendaryFanfare();
      setExplorationModal(result);
      queryClient.invalidateQueries({ queryKey: ["areas"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["cards"] });
    },
    onError: (err: any) => {
      toast({
        title: "Expedição indisponível",
        description: err.response?.data?.toast || "Não foi possível explorar esta área.",
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

  const { userLevel, xp, areas } = data;
  const nextLevelXp = Math.pow(userLevel, 2) * 100;
  const currentLevelBaseXp = Math.pow(userLevel - 1, 2) * 100;
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round(((xp - currentLevelBaseXp) / (nextLevelXp - currentLevelBaseXp)) * 100))
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl font-syne">
      {/* Header com Progresso do Treinador */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-border">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold mb-1.5">
            <Compass className="size-3.5 text-primary" />
            <span>Mapa & Expedições</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Zonas de Expedição Pokémon
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1 max-w-2xl">
            Avance seu Nível de Treinador para desbloquear novos biomas. Cada área desbloqueada concede uma expedição diária gratuita com moedas e cartas selvagens!
          </p>
        </div>

        {/* Level Card */}
        <div className="bg-card border border-border/80 rounded-2xl p-4 min-w-[260px] shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground font-sans">Nível de Treinador</span>
            <Badge className="bg-primary text-primary-foreground font-mono font-bold text-xs px-2.5">
              NV. {userLevel}
            </Badge>
          </div>
          <Progress value={progressPercent} className="h-2 mb-1.5" />
          <div className="flex justify-between text-[11px] text-muted-foreground font-mono">
            <span>{xp} XP</span>
            <span>{nextLevelXp} XP (Próximo)</span>
          </div>
        </div>
      </div>

      {/* Grid de Áreas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {areas.map((area) => (
          <div
            key={area.id}
            className={`group relative rounded-2xl border overflow-hidden transition-all duration-300 flex flex-col justify-between ${
              area.unlocked
                ? "bg-card border-border/80 hover:border-primary/50 shadow-md hover:shadow-xl"
                : "bg-muted/40 border-border/40 opacity-75 grayscale-50"
            }`}
          >
            {/* Imagem de Fundo com Overlay */}
            <div className="relative h-44 w-full overflow-hidden">
              <img
                src={area.imageUrl}
                alt={area.name}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />

              {/* Badges de Topo */}
              <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                <Badge
                  variant="outline"
                  className="bg-black/60 text-white backdrop-blur-md border-white/20 text-xs font-mono"
                >
                  <MapPin className="size-3 mr-1 text-primary" /> {area.region}
                </Badge>

                {area.unlocked ? (
                  <Badge className="bg-emerald-600/90 text-white text-[11px] font-bold">
                    Desbloqueado
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="flex items-center gap-1 text-[11px]">
                    <Lock className="size-3" /> Requer Nível {area.requiredLevel}
                  </Badge>
                )}
              </div>

              {/* Bioma Theme */}
              <div className="absolute bottom-2 left-3">
                <span className="text-[10px] uppercase font-mono tracking-widest text-primary font-bold">
                  {area.typeTheme}
                </span>
                <h3 className="text-xl font-bold text-white tracking-tight">{area.name}</h3>
              </div>
            </div>

            {/* Descrição e Ações */}
            <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
              <p className="text-xs text-muted-foreground font-sans leading-relaxed">
                {area.description}
              </p>

              <div className="pt-3 border-t border-border/60">
                <div className="flex items-center justify-between text-xs mb-3 text-muted-foreground">
                  <span className="font-sans">Recompensa base diária:</span>
                  <span className="font-mono font-bold text-amber-500 flex items-center gap-1">
                    <Coins className="size-3.5" /> ~{area.baseRewardCoins} moedas + Carta
                  </span>
                </div>

                {area.unlocked ? (
                  area.exploredToday ? (
                    <Button
                      variant="outline"
                      disabled
                      className="w-full rounded-xl text-xs h-10 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    >
                      <CheckCircle2 className="size-4 mr-1.5" /> Expedição Concluída Hoje
                    </Button>
                  ) : (
                    <Button
                      onClick={() => exploreArea(area.id)}
                      disabled={exploring}
                      className="w-full rounded-xl text-xs h-10 font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                    >
                      {exploring ? (
                        <Loader2 className="size-4 animate-spin mr-1.5" />
                      ) : (
                        <Compass className="size-4 mr-1.5" />
                      )}
                      Explorar Área Agora
                    </Button>
                  )
                ) : (
                  <Button
                    variant="outline"
                    disabled
                    className="w-full rounded-xl text-xs h-10 border-border/40 text-muted-foreground"
                  >
                    <Lock className="size-3.5 mr-1.5" /> Faltam {area.levelDifference} nível(is)
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Recompensa de Expedição */}
      <Dialog open={Boolean(explorationModal)} onOpenChange={(open) => !open && setExplorationModal(null)}>
        <DialogContent className="max-w-md bg-card/95 border-border backdrop-blur-xl font-syne p-6 text-center">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-center text-foreground flex items-center justify-center gap-2">
              <Sparkles className="size-6 text-amber-400" /> Expedição Bem-Sucedida!
            </DialogTitle>
          </DialogHeader>

          {explorationModal && (
            <div className="space-y-4 pt-2">
              <p className="text-xs sm:text-sm text-muted-foreground font-sans">
                Seus exploradores retornaram de <b>{explorationModal.areaName}</b> com grandes tesouros!
              </p>

              {/* Carta Encontrada */}
              {explorationModal.card && (
                <div className="relative mx-auto max-w-[200px] rounded-xl overflow-hidden shadow-2xl border-2 border-amber-400/60 animate-bounce-short">
                  <img
                    src={loadTcgImg(explorationModal.card.image_url)}
                    alt={explorationModal.card.name}
                    className="w-full aspect-[2.5/3.5] object-cover"
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-black/80 backdrop-blur-xs p-1.5 text-center">
                    <p className="text-xs font-bold text-white truncate">{explorationModal.card.name}</p>
                    <span className="text-[10px] text-amber-300 font-mono">
                      Tier {explorationModal.card.rarity}
                    </span>
                  </div>
                </div>
              )}

              {/* Moedas */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 flex items-center justify-center gap-2 text-amber-500">
                <Coins className="size-5" />
                <span className="text-lg font-bold font-mono">+{explorationModal.coins} Moedas Coletadas!</span>
              </div>

              <Button
                onClick={() => setExplorationModal(null)}
                className="w-full h-11 rounded-xl font-bold bg-primary text-primary-foreground"
              >
                Coletar e Fechar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
