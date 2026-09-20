"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useApi } from "@/hooks/use-api";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { soundFx } from "@/lib/sound-fx";
import { loadTcgImg } from "@/lib/load-tcg-img";
import { balanceTranslate } from "@/lib/balance-translate";
import { RewardModal } from "@/components/ui/reward-modal";
import { LoaderSimple } from "@/components/loading-spinner";
import {
  Book,
  Sparkles,
  Coins,
  Trophy,
  CheckCircle2,
  Lock,
  Wrench,
  Layers,
  Flame,
  Star,
  ExternalLink,
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
  const { get, post } = useApi();
  const qClient = useQueryClient();

  const [rewardModalOpen, setRewardModalOpen] = useState(false);
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

  const { mutateAsync: claimAlbum, isPending: isClaiming } = useMutation({
    mutationKey: ["albums", "claim"],
    mutationFn: async (album: OfficialAlbum) => {
      const res = await post(`/albums/claim/${album.id}`, {});
      soundFx.playGodPullFanfare();
      setClaimedReward({
        title: album.title,
        gold: album.rewardGold,
        xp: album.rewardXp,
      });
      setRewardModalOpen(true);
      await qClient.invalidateQueries({ queryKey: ["user"] });
      await refetch();
      return res.data?.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <LoaderSimple className="size-8 mb-4" />
        <p className="text-xs font-mono text-muted-foreground">Carregando seus álbuns...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sub-Tabs de Navegação: Prontos vs Customizados */}
      <Tabs defaultValue="official" className="w-full">
        <div className="flex items-center justify-between mb-6">
          <TabsList className="bg-secondary/80 border border-border p-1">
            <TabsTrigger value="official" className="text-xs sm:text-sm font-semibold gap-2">
              <Book className="size-4 text-amber-500" />
              <span>Álbuns Oficiais ({albums.length})</span>
            </TabsTrigger>
            <TabsTrigger value="custom" className="text-xs sm:text-sm font-semibold gap-2">
              <Wrench className="size-4 text-purple-400" />
              <span>Customizados</span>
              <Badge variant="outline" className="text-[9px] font-mono border-purple-500/40 text-purple-400 py-0 px-1">
                WIP
              </Badge>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ABA 1: ÁLBUNS OFICIAIS */}
        <TabsContent value="official" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {albums.map((album) => (
              <Card
                key={album.id}
                className={`overflow-hidden border bg-card/90 transition-all duration-300 rounded-2xl flex flex-col justify-between ${
                  album.isClaimed
                    ? "border-emerald-500/40 shadow-sm opacity-90"
                    : album.canClaim
                    ? "border-amber-500 shadow-xl shadow-amber-500/10 ring-1 ring-amber-500/40"
                    : "border-border/80 hover:border-border"
                }`}
              >
                <CardHeader className="p-4 sm:p-6 pb-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-secondary border border-border text-muted-foreground">
                      {album.category}
                    </span>

                    <Badge
                      variant="outline"
                      className={`text-[10px] font-mono font-bold ${
                        album.isClaimed
                          ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                          : album.canClaim
                          ? "border-amber-500/50 text-amber-400 bg-amber-500/10"
                          : "border-border text-muted-foreground"
                      }`}
                    >
                      {album.badge}
                    </Badge>
                  </div>

                  <CardTitle className="text-lg sm:text-xl font-bold font-syne text-foreground">
                    {album.title}
                  </CardTitle>
                  <CardDescription className="text-xs leading-relaxed mt-1">
                    {album.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="p-4 sm:p-6 pt-0 space-y-4">
                  {/* Slots das Cartas do Álbum */}
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3 py-1">
                    {album.cardSlots.map((slot, idx) => (
                      <div
                        key={`${slot.targetName}-${idx}`}
                        className={`relative aspect-[1/1.38] rounded-xl overflow-hidden border flex flex-col items-center justify-center text-center group transition-all duration-200 ${
                          slot.isOwned
                            ? "border-amber-500/60 shadow-md bg-slate-950"
                            : "border-border/50 bg-slate-950/80"
                        }`}
                      >
                        {slot.isOwned ? (
                          <>
                            <img
                              src={loadTcgImg(slot.card.image_url, true)}
                              alt={slot.card.name}
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute top-1 right-1 z-10 size-4 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950 shadow">
                              <CheckCircle2 className="size-3 fill-white text-emerald-600" />
                            </div>
                            <div className="absolute bottom-0 inset-x-0 bg-black/80 px-1 py-0.5 text-center">
                              <span className="text-[9px] font-mono text-emerald-400 font-bold truncate block">
                                Obtida
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center relative bg-gradient-to-b from-slate-900 to-slate-950">
                            {slot.card.image_url && (
                              <img
                                src={loadTcgImg(slot.card.image_url, true)}
                                alt="Faltante"
                                loading="lazy"
                                className="absolute inset-0 w-full h-full object-cover opacity-10 filter grayscale blur-[1px]"
                              />
                            )}
                            <div className="size-7 rounded-full bg-secondary/80 border border-border flex items-center justify-center text-muted-foreground mb-1 relative z-10">
                              <Lock className="size-3.5 text-muted-foreground/60" />
                            </div>
                            <span className="text-[9px] font-mono font-bold text-muted-foreground/70 truncate max-w-full px-1 relative z-10">
                              {slot.targetName}
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Barra de Progresso */}
                  <div>
                    <div className="flex items-center justify-between text-xs font-mono mb-1.5 text-muted-foreground">
                      <span>Progresso do Álbum</span>
                      <span className="font-bold text-foreground">
                        {album.collectedCount} / {album.totalCount} ({album.progressPercent}%)
                      </span>
                    </div>
                    <Progress
                      value={album.progressPercent}
                      className={`h-2.5 rounded-full ${
                        album.isClaimed
                          ? "[&>div]:bg-emerald-500"
                          : album.canClaim
                          ? "[&>div]:bg-amber-400 animate-pulse"
                          : "[&>div]:bg-primary"
                      }`}
                    />
                  </div>
                </CardContent>

                {/* Rodapé com Cálculo de Recompensa & Botão de Resgate */}
                <CardFooter className="p-4 sm:p-6 pt-0 border-t border-border/50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-1">
                  {/* Recompensas calculadas */}
                  <div className="flex items-center gap-2">
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono font-bold text-xs">
                      <Coins className="size-3.5" />
                      <span>+{balanceTranslate(album.rewardGold)}</span>
                    </div>
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 font-mono font-bold text-xs">
                      <Trophy className="size-3.5" />
                      <span>+{album.rewardXp} XP</span>
                    </div>
                  </div>

                  {/* Botão de Resgate */}
                  {album.isClaimed ? (
                    <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-1.5 py-1 px-2">
                      <CheckCircle2 className="size-4" /> Recompensa Coletada
                    </span>
                  ) : album.canClaim ? (
                    <Button
                      size="sm"
                      disabled={isClaiming}
                      onClick={() => claimAlbum(album)}
                      className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold font-sans text-xs px-4 h-9 rounded-xl shadow-lg shadow-amber-500/20 animate-pulse"
                    >
                      <Sparkles className="size-3.5 mr-1.5" />
                      <span>Resgatar Recompensas</span>
                    </Button>
                  ) : (
                    <Button variant="outline" disabled size="sm" className="text-xs text-muted-foreground h-9">
                      Em Progresso ({album.collectedCount}/{album.totalCount})
                    </Button>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ABA 2: ÁLBUNS CUSTOMIZADOS (WIP) */}
        <TabsContent value="custom" className="mt-0">
          <Card className="border-dashed border-2 border-border/80 bg-card/40 p-8 sm:p-12 text-center rounded-2xl max-w-xl mx-auto">
            <div className="size-16 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto mb-4">
              <Wrench className="size-8 text-purple-400" />
            </div>
            <Badge variant="outline" className="mb-2 font-mono text-[10px] text-purple-400 border-purple-500/40">
              EM DESENVOLVIMENTO • WIP
            </Badge>
            <h3 className="font-syne text-xl sm:text-2xl font-bold text-foreground mb-2">
              Álbuns Customizados
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-6">
              Em breve você poderá criar seus próprios biders e álbuns temáticos customizados, definir suas cartas dos sonhos e compartilhar publicamente com a comunidade Pokémon!
            </p>
            <Button variant="outline" disabled className="text-xs font-semibold">
              Criador de Álbum Customizado (Em Breve)
            </Button>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Recompensa de Álbum */}
      <RewardModal
        open={rewardModalOpen}
        onOpenChange={setRewardModalOpen}
        iconType="general"
        title="Álbum Concluído! 🎉"
        description={`Parabéns! Você completou o álbum "${claimedReward?.title}" com maestria.`}
        rewardAmount={claimedReward?.gold}
      />
    </div>
  );
}