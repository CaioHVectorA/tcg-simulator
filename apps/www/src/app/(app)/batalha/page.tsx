"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Swords,
  Shield,
  Zap,
  Sparkles,
  Trophy,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Plus,
  Trash2,
  Lock,
  Coins,
  History,
  Loader2,
} from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/i18n/LanguageContext";
import { soundFx } from "@/lib/sound-fx";
import { TcgCardImage } from "@/components/tcg-card-image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";

interface DeckSlotCard {
  id?: number;
  slot: number;
  cardId: number;
  isMarkedForTrade?: boolean;
  recruitPoints: number;
  combatPower: {
    baseCp: number;
    hpBonus: number;
    subtypeBonus: number;
    terrainBonus: number;
    totalCp: number;
  };
  card: {
    id: number;
    name: string;
    image_url: string;
    rarity: number;
    hp: number;
    type: string;
  };
}

interface AvailableCardItem {
  card: {
    id: number;
    name: string;
    image_url: string;
    rarity: number;
    hp: number;
    type: string;
  };
  quantity: number;
  isMarkedForTrade: boolean;
  recruitPoints: number;
  combatPower: number;
}

interface GymLeaderItem {
  id: string;
  name: string;
  title: string;
  avatar: string;
  badge: string;
  difficulty: string;
  difficultyLabel: string;
  description: string;
  rewardCoins: number;
  rewardXp: number;
  preferredTerrain?: {
    id: string;
    name: string;
    favoredTypes: string[];
    description: string;
    badge: string;
    accentColor: string;
  };
  isDefeated: boolean;
  victoryCount: number;
  deckPreview: {
    name: string;
    image_url: string;
    rarity: number;
    hp: number;
    type: string;
  }[];
}

const RARITY_STYLE: Record<number, { color: string; border: string; bg: string }> = {
  1: { color: "text-slate-600 dark:text-slate-300", border: "border-slate-300 dark:border-slate-700", bg: "bg-slate-100 dark:bg-slate-800/80" },
  2: { color: "text-blue-600 dark:text-blue-400", border: "border-blue-300 dark:border-blue-500", bg: "bg-blue-50 dark:bg-blue-950/80" },
  3: { color: "text-purple-600 dark:text-purple-400", border: "border-purple-300 dark:border-purple-500", bg: "bg-purple-50 dark:bg-purple-950/80" },
  4: { color: "text-amber-600 dark:text-amber-400 font-bold", border: "border-amber-400 dark:border-amber-500", bg: "bg-amber-50 dark:bg-amber-950/80" },
  5: { color: "text-rose-600 dark:text-rose-400 font-black", border: "border-rose-400 dark:border-rose-500", bg: "bg-rose-50 dark:bg-rose-950/80" },
};

export default function BattlePage() {
  const { t } = useTranslation();
  const { get, post } = useApi();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const RARITY_LABELS: Record<number, { name: string; color: string; border: string; bg: string }> = {
    1: { name: t("rarities.tier1"), ...RARITY_STYLE[1] },
    2: { name: t("rarities.tier2"), ...RARITY_STYLE[2] },
    3: { name: t("rarities.tier3"), ...RARITY_STYLE[3] },
    4: { name: t("rarities.tier4"), ...RARITY_STYLE[4] },
    5: { name: t("rarities.tier5"), ...RARITY_STYLE[5] },
  };

  const LANE_NAMES = [
    t("battle.laneAlfa"),
    t("battle.laneBeta"),
    t("battle.laneGama"),
  ];

  const [activeTab, setActiveTab] = useState<"deck" | "gyms" | "history">("deck");
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [isCardPickerOpen, setIsCardPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerRarity, setPickerRarity] = useState<number | "all">("all");

  // Battle Match Replay State
  const [isBattleModalOpen, setIsBattleModalOpen] = useState(false);
  const [currentBattle, setCurrentBattle] = useState<any | null>(null);
  const [isBattling, setIsBattling] = useState(false);

  // 1. Fetch User Deck
  const { data: deckData } = useQuery({
    queryKey: ["battle-deck"],
    queryFn: async () => {
      const res = await get("/battle/deck");
      return res.data?.data || res.data;
    },
  });

  // 2. Fetch Available Cards for Deck Builder
  const { data: availableCardsData } = useQuery({
    queryKey: ["battle-available-cards"],
    queryFn: async () => {
      const res = await get("/battle/available-cards");
      return res.data?.data || res.data;
    },
  });

  // 3. Fetch NPC Gym Leaders
  const { data: npcsData } = useQuery({
    queryKey: ["battle-npcs"],
    queryFn: async () => {
      const res = await get("/battle/npcs");
      return res.data?.data || res.data;
    },
  });

  // 4. Fetch Battle History
  const { data: historyData } = useQuery({
    queryKey: ["battle-history"],
    queryFn: async () => {
      const res = await get("/battle/history");
      return res.data?.data || res.data;
    },
  });

  // Local Deck State for interactive manipulation
  const [localDeck, setLocalDeck] = useState<(DeckSlotCard | null)[]>([
    null, null, null, null, null, null,
  ]);

  // Sync server deck to local deck when loaded
  useEffect(() => {
    if (deckData?.cards) {
      const slots: (DeckSlotCard | null)[] = [null, null, null, null, null, null];
      for (const cardItem of deckData.cards) {
        if (cardItem.slot >= 0 && cardItem.slot < 6) {
          slots[cardItem.slot] = cardItem;
        }
      }
      setLocalDeck(slots);
    }
  }, [deckData]);

  // Helper to safely get CP regardless of shape
  const getCardCp = (item: DeckSlotCard | null | undefined): number => {
    if (!item) return 0;
    if (typeof item.combatPower === "number") return item.combatPower;
    return item.combatPower?.totalCp || 0;
  };

  // Computed PR and CP metrics
  const totalPr = useMemo(() => {
    return localDeck.reduce((acc, curr) => acc + (curr ? curr.recruitPoints : 0), 0);
  }, [localDeck]);

  const totalCp = useMemo(() => {
    return localDeck.reduce((acc, curr) => acc + getCardCp(curr), 0);
  }, [localDeck]);

  const isDeckFull = useMemo(() => {
    return localDeck.every((slot) => slot !== null);
  }, [localDeck]);

  const hasTradeConflict = useMemo(() => {
    return localDeck.some((slot) => slot?.isMarkedForTrade);
  }, [localDeck]);

  // Check if current localDeck matches server deck
  const isDeckSaved = useMemo(() => {
    if (!deckData?.cards || deckData.cards.length !== 6) return false;
    if (!isDeckFull) return false;
    for (let i = 0; i < 6; i++) {
      const localCardId = localDeck[i]?.cardId;
      const serverCard = deckData.cards.find((c: any) => c.slot === i);
      if (!serverCard || serverCard.cardId !== localCardId) {
        return false;
      }
    }
    return true;
  }, [localDeck, deckData, isDeckFull]);

  // Compute how many copies of each card are currently assigned to localDeck slots
  const usedCardCounts = useMemo(() => {
    const counts: Record<number, { count: number; slots: number[] }> = {};
    localDeck.forEach((slotItem, slotIdx) => {
      if (slotItem?.cardId) {
        if (!counts[slotItem.cardId]) {
          counts[slotItem.cardId] = { count: 0, slots: [] };
        }
        counts[slotItem.cardId].count += 1;
        counts[slotItem.cardId].slots.push(slotIdx + 1);
      }
    });
    return counts;
  }, [localDeck]);

  // Save Deck Mutation
  const saveDeckMutation = useMutation({
    mutationFn: async (cardIds: number[]) => {
      const res = await post("/battle/deck", { cardIds });
      return res.data;
    },
    onSuccess: (data) => {
      soundFx.playSuccess();
      toast({
        title: t("common.success"),
        description: data?.toast || t("battle.deckComplete"),
      });
      queryClient.invalidateQueries({ queryKey: ["battle-deck"] });
      queryClient.invalidateQueries({ queryKey: ["battle-available-cards"] });
    },
    onError: (err: any) => {
      toast({
        title: t("common.error"),
        description: err.response?.data?.toast || err.message,
        variant: "destructive",
      });
    },
  });

  // Auto-recommend deck mutation: auto-persists to backend immediately!
  const recommendDeckMutation = useMutation({
    mutationFn: async () => {
      const res = await get("/battle/recommend-deck");
      return res.data?.data || res.data;
    },
    onSuccess: async (data) => {
      if (data?.recommendedCards && data.recommendedCards.length === 6) {
        const slots: (DeckSlotCard | null)[] = [null, null, null, null, null, null];
        const cardIds: number[] = [];
        for (const item of data.recommendedCards) {
          slots[item.slot] = {
            slot: item.slot,
            cardId: item.cardId,
            recruitPoints: item.recruitPoints,
            combatPower: {
              baseCp: item.combatPower,
              hpBonus: 0,
              subtypeBonus: 0,
              terrainBonus: 0,
              totalCp: item.combatPower,
            },
            card: item.card,
          };
          cardIds[item.slot] = item.cardId;
        }
        setLocalDeck(slots);

        // Auto-save recommended deck to backend immediately!
        try {
          await saveDeckMutation.mutateAsync(cardIds);
          soundFx.playEpicAura();
          toast({
            title: t("battle.autoRecommend"),
            description: `${t("battle.deckSavedAndReady")} (${data.totalPoints}/20 PR - ${data.totalCp} CP)`,
          });
        } catch {
          toast({
            title: t("battle.autoRecommend"),
            description: `${t("battle.recommendedDesc")} (${data.totalPoints}/20 PR - ${data.totalCp} CP)`,
          });
        }
      }
    },
    onError: (err: any) => {
      toast({
        title: t("common.error"),
        description: err.response?.data?.toast || err.message,
        variant: "destructive",
      });
    },
  });

  // Fight NPC Mutation
  const fightNpcMutation = useMutation({
    mutationFn: async (npcId: string) => {
      setIsBattling(true);
      const res = await post("/battle/fight-npc", { npcId });
      return res.data?.data || res.data;
    },
    onSuccess: (data) => {
      setIsBattling(false);
      setCurrentBattle(data);
      setIsBattleModalOpen(true);
      if (data?.won) {
        soundFx.playLegendaryFanfare();
      } else {
        soundFx.playCardFlip();
      }
      queryClient.invalidateQueries({ queryKey: ["battle-npcs"] });
      queryClient.invalidateQueries({ queryKey: ["battle-history"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
    onError: (err: any) => {
      setIsBattling(false);
      toast({
        title: t("common.error"),
        description: err.response?.data?.toast || err.message,
        variant: "destructive",
      });
    },
  });

  // Handle slot click to open card picker
  const handleSlotClick = (slotIdx: number) => {
    setSelectedSlotIndex(slotIdx);
    setIsCardPickerOpen(true);
  };

  // Remove card from slot
  const handleClearSlot = (slotIdx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = [...localDeck];
    updated[slotIdx] = null;
    setLocalDeck(updated);
  };

  // Select card from picker
  const handleSelectCardForSlot = (item: AvailableCardItem) => {
    if (selectedSlotIndex === null) return;
    if (item.isMarkedForTrade) {
      toast({
        title: t("battle.tradeConflictWarning"),
        description: t("battle.modalSelectDesc"),
        variant: "destructive",
      });
      return;
    }

    // Check duplicate usage across deck slots
    const usedInfo = usedCardCounts[item.card.id] || { count: 0, slots: [] };
    const currentlyInThisSlot = localDeck[selectedSlotIndex]?.cardId === item.card.id;
    const usedInOtherSlots = currentlyInThisSlot ? Math.max(0, usedInfo.count - 1) : usedInfo.count;
    if (usedInOtherSlots >= (item.quantity || 1)) {
      toast({
        title: t("battle.tradeConflictWarning"),
        description: t("battle.inUse", { slot: usedInfo.slots.join(", ") }),
        variant: "destructive",
      });
      return;
    }

    // Check if adding this card would exceed 20 PR
    const currentCardPr = localDeck[selectedSlotIndex]?.recruitPoints || 0;
    const projectedPr = totalPr - currentCardPr + item.recruitPoints;
    if (projectedPr > 20) {
      toast({
        title: t("battle.prExceeded"),
        description: `${t("battle.prProjectedExceeded")} (${projectedPr}/20 PR)`,
        variant: "destructive",
      });
      return;
    }

    const updated = [...localDeck];
    updated[selectedSlotIndex] = {
      slot: selectedSlotIndex,
      cardId: item.card.id,
      recruitPoints: item.recruitPoints,
      combatPower: {
        baseCp: item.combatPower,
        hpBonus: 0,
        subtypeBonus: 0,
        terrainBonus: 0,
        totalCp: item.combatPower,
      },
      card: item.card,
    };

    setLocalDeck(updated);
    setIsCardPickerOpen(false);
    setSelectedSlotIndex(null);
    soundFx.playCardFlip();
  };

  // Save current deck
  const handleSaveDeck = () => {
    if (!isDeckFull) {
      toast({
        title: t("battle.deckIncomplete"),
        variant: "destructive",
      });
      return;
    }
    if (totalPr > 20) {
      toast({
        title: t("battle.prExceeded"),
        variant: "destructive",
      });
      return;
    }
    const cardIds = localDeck.map((slot) => slot!.cardId);
    saveDeckMutation.mutate(cardIds);
  };

  // Challenge Leader flow: auto-saves if deck not saved on server yet
  const handleChallengeLeader = async (npcId: string) => {
    if (!isDeckFull) {
      toast({
        title: t("battle.deckIncomplete"),
        description: t("battle.deckIncomplete"),
        variant: "destructive",
      });
      return;
    }
    if (totalPr > 20) {
      toast({
        title: t("battle.prExceeded"),
        variant: "destructive",
      });
      return;
    }
    if (hasTradeConflict) {
      toast({
        title: t("battle.tradeConflictWarning"),
        variant: "destructive",
      });
      return;
    }

    // If localDeck is not saved on server yet, save it automatically before combat!
    if (!isDeckSaved) {
      try {
        const cardIds = localDeck.map((s) => s!.cardId);
        await saveDeckMutation.mutateAsync(cardIds);
      } catch (err: any) {
        toast({
          title: t("common.error"),
          description: err.response?.data?.toast || err.message,
          variant: "destructive",
        });
        return;
      }
    }

    fightNpcMutation.mutate(npcId);
  };

  const [isAutoBuilding, setIsAutoBuilding] = useState(false);

  // Auto-Build & Battle in one seamless step if deck is incomplete
  const handleAutoBuildAndChallenge = async (npcId: string) => {
    setIsAutoBuilding(true);
    setIsBattling(true);
    try {
      const recRes = await get("/battle/recommend-deck");
      const recData = recRes.data?.data || recRes.data;
      if (recData?.recommendedCards && recData.recommendedCards.length === 6) {
        const cardIds = recData.recommendedCards.map((c: any) => c.cardId);
        await saveDeckMutation.mutateAsync(cardIds);
        queryClient.invalidateQueries({ queryKey: ["battle-deck"] });
        queryClient.invalidateQueries({ queryKey: ["battle-available-cards"] });
        fightNpcMutation.mutate(npcId);
      } else {
        throw new Error(t("battle.insufficientEligibleCards"));
      }
    } catch (err: any) {
      setIsBattling(false);
      toast({
        title: t("common.error"),
        description: err.response?.data?.toast || err.message,
        variant: "destructive",
      });
    } finally {
      setIsAutoBuilding(false);
    }
  };

  // Filtered available cards
  const filteredAvailableCards = useMemo(() => {
    const list: AvailableCardItem[] = availableCardsData?.cards || [];
    return list.filter((item) => {
      const matchesSearch = pickerSearch.trim() === "" || item.card.name.toLowerCase().includes(pickerSearch.toLowerCase());
      const matchesRarity = pickerRarity === "all" || item.card.rarity === pickerRarity;
      return matchesSearch && matchesRarity;
    });
  }, [availableCardsData, pickerSearch, pickerRarity]);

  return (
    <div className="min-h-screen bg-background text-foreground py-6 sm:py-10 font-syne">
      <div className="container mx-auto px-4 max-w-7xl space-y-8">
        
        {/* Header Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-card to-card p-6 sm:p-10 shadow-xl backdrop-blur-xl">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
                <Swords className="size-3.5" />
                {t("battle.leagueTag")}
              </div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground flex items-center gap-3">
                {t("battle.title")}
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground font-sans">
                {t("battle.subtitle")}
              </p>
            </div>

            {/* Quick Metrics Badge Group */}
            <div className="flex flex-wrap md:flex-col items-end gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2.5 bg-card border border-border/80 rounded-2xl px-4 py-2.5 shadow-sm">
                <Shield className="size-5 text-indigo-500" />
                <div>
                  <div className="text-[11px] text-muted-foreground font-mono uppercase">{t("battle.salaryCap")}</div>
                  <div className={`text-lg font-black font-mono ${totalPr > 20 ? "text-rose-500" : "text-emerald-500"}`}>
                    {totalPr} / 20 PR
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 bg-card border border-border/80 rounded-2xl px-4 py-2.5 shadow-sm">
                <Zap className="size-5 text-amber-500" />
                <div>
                  <div className="text-[11px] text-muted-foreground font-mono uppercase">{t("battle.totalCp")}</div>
                  <div className="text-lg font-black font-mono text-amber-500">
                    {totalCp} CP
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="space-y-6">
          <TabsList className="grid grid-cols-3 max-w-md bg-secondary/80 border border-border/60 p-1 rounded-2xl">
            <TabsTrigger value="deck" className="rounded-xl flex items-center gap-2 font-bold text-xs sm:text-sm">
              <Shield className="size-4" />
              {t("battle.tabDeck")}
            </TabsTrigger>
            <TabsTrigger value="gyms" className="rounded-xl flex items-center gap-2 font-bold text-xs sm:text-sm">
              <Trophy className="size-4" />
              {t("battle.tabGyms")}
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-xl flex items-center gap-2 font-bold text-xs sm:text-sm">
              <History className="size-4" />
              {t("battle.tabHistory")}
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: DECK BUILDER */}
          <TabsContent value="deck" className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border border-border/80 p-4 sm:p-6 rounded-3xl shadow-sm">
              <div className="space-y-1">
                <h3 className="text-xl font-bold flex items-center gap-2 text-foreground">
                  <Shield className="size-5 text-amber-500" />
                  {t("battle.tabDeck")}
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground font-sans">
                  {t("battle.subtitle")}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => recommendDeckMutation.mutate()}
                  disabled={recommendDeckMutation.isPending}
                  className="rounded-xl flex-1 sm:flex-none border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 font-bold"
                >
                  {recommendDeckMutation.isPending ? (
                    <Loader2 className="size-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="size-4 mr-2 text-amber-500" />
                  )}
                  {t("battle.autoRecommend")}
                </Button>

                <Button
                  size="sm"
                  onClick={handleSaveDeck}
                  disabled={!isDeckFull || totalPr > 20 || hasTradeConflict || saveDeckMutation.isPending}
                  className="rounded-xl flex-1 sm:flex-none bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20"
                >
                  {saveDeckMutation.isPending ? (
                    <Loader2 className="size-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="size-4 mr-2" />
                  )}
                  {t("battle.saveDeck")}
                </Button>
              </div>
            </div>

            {/* Warning Banners */}
            {hasTradeConflict && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 px-4 py-3 rounded-2xl flex items-center gap-3 text-sm font-sans">
                <AlertTriangle className="size-5 shrink-0" />
                <span>{t("battle.tradeConflictWarning")}</span>
              </div>
            )}

            {totalPr > 20 && (
              <div className="bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 px-4 py-3 rounded-2xl flex items-center gap-3 text-sm font-sans">
                <AlertTriangle className="size-5 shrink-0" />
                <span>{t("battle.prExceeded")}</span>
              </div>
            )}

            {/* 6 SLOTS ORGANIZED IN 3 LANES */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[0, 1, 2].map((laneIdx) => {
                const slotA = laneIdx * 2;
                const slotB = laneIdx * 2 + 1;
                const cardA = localDeck[slotA];
                const cardB = localDeck[slotB];
                const laneCp = getCardCp(cardA) + getCardCp(cardB);

                return (
                  <div
                    key={laneIdx}
                    className="relative bg-card border border-border/80 rounded-3xl p-5 space-y-4 hover:border-amber-500/40 transition-colors shadow-sm"
                  >
                    {/* Lane Header */}
                    <div className="flex items-center justify-between border-b border-border/60 pb-3">
                      <div>
                        <span className="text-xs font-mono uppercase text-amber-500 tracking-wider">
                          {t("battle.leagueTag")}
                        </span>
                        <h4 className="text-lg font-black text-foreground">{LANE_NAMES[laneIdx]}</h4>
                      </div>
                      <Badge variant="outline" className="font-mono bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400 font-bold">
                        {laneCp} CP
                      </Badge>
                    </div>

                    {/* 2 Card Slots in this Lane */}
                    <div className="grid grid-cols-2 gap-3">
                      {[slotA, slotB].map((slotIdx) => {
                        const item = localDeck[slotIdx];
                        const rarityInfo = item ? RARITY_LABELS[item.card.rarity] || RARITY_LABELS[1] : null;

                        return (
                          <div
                            key={slotIdx}
                            onClick={() => handleSlotClick(slotIdx)}
                            className={`group relative aspect-[2.5/3.6] rounded-2xl border-2 cursor-pointer transition-all duration-300 overflow-hidden flex flex-col items-center justify-center p-2 text-center select-none ${
                              item
                                ? `${rarityInfo?.border} bg-secondary/50 shadow-md hover:scale-[1.02]`
                                : "border-dashed border-border hover:border-amber-400 bg-secondary/20 hover:bg-amber-500/5"
                            }`}
                          >
                            {item ? (
                              <>
                                <div className="relative w-full flex-1 rounded-xl overflow-hidden mb-2">
                                  <TcgCardImage src={item.card.image_url} alt={item.card.name} />
                                  {/* PR Badge Top Left */}
                                  <div className="absolute top-1 left-1 bg-background/90 border border-border rounded-md px-1.5 py-0.5 text-[10px] font-mono font-bold text-foreground shadow">
                                    {item.recruitPoints} PR
                                  </div>

                                  {/* CP Badge Top Right */}
                                  <div className="absolute top-1 right-1 bg-background/90 border border-amber-400/60 rounded-md px-1.5 py-0.5 text-[10px] font-mono font-bold text-amber-500 shadow">
                                    {getCardCp(item)} CP
                                  </div>

                                  {/* Delete Button */}
                                  <button
                                    onClick={(e) => handleClearSlot(slotIdx, e)}
                                    className="absolute bottom-1 right-1 p-1 bg-rose-500/80 hover:bg-rose-600 text-white rounded-lg transition-colors shadow"
                                    title={t("battle.clearSlot")}
                                  >
                                    <Trash2 className="size-3.5" />
                                  </button>
                                </div>

                                <div className="w-full text-left px-1">
                                  <p className="text-xs font-bold text-foreground truncate">{item.card.name}</p>
                                  <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                                    <span>HP {item.card.hp}</span>
                                    <span className={rarityInfo?.color}>{rarityInfo?.name}</span>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <div className="flex flex-col items-center justify-center text-muted-foreground group-hover:text-amber-500 transition-colors">
                                <div className="size-10 rounded-full border border-dashed border-border group-hover:border-amber-400 flex items-center justify-center mb-2">
                                  <Plus className="size-5" />
                                </div>
                                <span className="text-xs font-bold">{t("battle.selectCard")}</span>
                                <span className="text-[10px] text-muted-foreground font-mono mt-0.5">{t("battle.slotsCount", { slot: slotIdx + 1 })}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* TAB 2: GYM LEADERS (NPCs) */}
          <TabsContent value="gyms" className="space-y-6">
            <div className="bg-card border border-border/80 p-4 sm:p-6 rounded-3xl shadow-sm">
              <h3 className="text-xl font-bold flex items-center gap-2 text-foreground">
                <Trophy className="size-5 text-amber-500" />
                {t("battle.tabGyms")}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-sans">
                {t("battle.subtitle")}
              </p>
            </div>

            {/* Incomplete Deck Notice Banner in Gyms Tab */}
            {!isDeckFull && (
              <div className="bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 p-4 sm:p-5 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="size-6 shrink-0 text-amber-500" />
                  <div>
                    <h4 className="font-bold text-foreground">{t("battle.deckIncompleteTitle")}</h4>
                    <p className="text-xs text-muted-foreground font-sans">
                      {t("battle.deckIncompleteNotice", { current: localDeck.filter(Boolean).length })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Button
                    size="sm"
                    onClick={() => recommendDeckMutation.mutate()}
                    disabled={recommendDeckMutation.isPending}
                    className="rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs"
                  >
                    {recommendDeckMutation.isPending ? (
                      <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                    ) : (
                      <Sparkles className="size-3.5 mr-1.5" />
                    )}
                    {t("battle.autoRecommend")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setActiveTab("deck")}
                    className="rounded-xl font-bold text-xs"
                  >
                    {t("battle.buildManually")}
                  </Button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {npcsData?.npcs?.map((trainer: GymLeaderItem) => (
                <div
                  key={trainer.id}
                  className="relative group bg-card border border-border/80 rounded-3xl p-6 space-y-5 hover:border-amber-500/50 transition-all duration-300 shadow-md hover:shadow-xl overflow-hidden flex flex-col justify-between"
                >
                  {/* Background Glow */}
                  <div className="absolute top-0 right-0 -mr-16 -mt-16 size-36 rounded-full bg-amber-500/10 blur-2xl group-hover:bg-amber-500/20 transition-all pointer-events-none" />

                  <div className="space-y-4">
                    {/* Top Row: Avatar & Badge */}
                    <div className="flex items-center gap-4">
                      <div className="relative size-16 sm:size-20 rounded-2xl overflow-hidden border-2 border-border bg-secondary/40 shadow-sm shrink-0">
                        <img
                          src={trainer.avatar}
                          alt={trainer.name}
                          className="w-full h-full object-contain p-1"
                        />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{trainer.badge.split(" ")[0]}</span>
                          <h4 className="text-xl font-black text-foreground">{trainer.name}</h4>
                        </div>
                        <p className="text-xs font-mono text-amber-600 dark:text-amber-400 font-bold">{trainer.title}</p>
                        <Badge
                          variant="outline"
                          className="text-[10px] font-bold uppercase tracking-wider border-border text-muted-foreground"
                        >
                          {trainer.difficultyLabel}
                        </Badge>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed font-sans">
                      {trainer.description}
                    </p>

                    {/* Preferred Terrain Banner */}
                    {trainer.preferredTerrain && (
                      <div className="bg-secondary/60 border border-border rounded-xl p-2.5 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{trainer.preferredTerrain.badge}</span>
                          <div>
                            <span className="text-[10px] text-muted-foreground uppercase font-mono block">
                              {t("battle.preferredTerrain")}
                            </span>
                            <span className="font-bold text-foreground">{trainer.preferredTerrain.name}</span>
                          </div>
                        </div>
                        <Badge className="bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                          {t("battle.terrainBonusActive")}
                        </Badge>
                      </div>
                    )}

                    {/* Rewards Info */}
                    <div className="grid grid-cols-2 gap-2 bg-muted/40 border border-border/80 rounded-xl p-3 text-center">
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-mono block">{t("common.coins")}</span>
                        <span className="text-sm font-black text-amber-500 flex items-center justify-center gap-1 font-mono">
                          <Coins className="size-3.5 text-amber-500" />
                          +{trainer.rewardCoins.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-mono block">{t("common.exp")} / Pts</span>
                        <span className="text-sm font-black text-primary flex items-center justify-center gap-1 font-mono">
                          <Zap className="size-3.5 text-primary" />
                          +{trainer.rewardXp} XP
                        </span>
                      </div>
                    </div>

                    {/* Deck Preview Mini Badges */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] text-muted-foreground uppercase font-mono">
                        {t("battle.cardsQuantity")} ({trainer.deckPreview.length})
                      </span>
                      <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                        {trainer.deckPreview.map((card, idx) => (
                          <div
                            key={idx}
                            className="size-8 rounded-lg border border-border bg-secondary overflow-hidden shrink-0 shadow-xs"
                            title={`${card.name} (HP ${card.hp})`}
                          >
                            <img src={card.image_url} alt={card.name} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Challenge Button */}
                  <div className="pt-2">
                    {!isDeckFull ? (
                      <Button
                        onClick={() => handleAutoBuildAndChallenge(trainer.id)}
                        disabled={isBattling || isAutoBuilding}
                        className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20 flex items-center justify-center gap-2"
                      >
                        {isBattling || isAutoBuilding ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Sparkles className="size-4" />
                        )}
                        {t("battle.autoBuildAndBattle")}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleChallengeLeader(trainer.id)}
                        disabled={!isDeckFull || hasTradeConflict || totalPr > 20 || isBattling}
                        className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20 flex items-center justify-center gap-2"
                      >
                        {isBattling ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Swords className="size-4" />
                        )}
                        {t("battle.challengeLeader")}
                      </Button>
                    )}
                    {trainer.isDefeated && (
                      <p className="text-[11px] text-center text-emerald-600 dark:text-emerald-400 font-mono mt-1.5 flex items-center justify-center gap-1">
                        <CheckCircle2 className="size-3" />
                        {t("battle.leaderDefeated")} ({trainer.victoryCount}x)
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* TAB 3: BATTLE HISTORY */}
          <TabsContent value="history" className="space-y-6">
            <div className="bg-card border border-border/80 p-4 sm:p-6 rounded-3xl shadow-sm">
              <h3 className="text-xl font-bold flex items-center gap-2 text-foreground">
                <History className="size-5 text-amber-500" />
                {t("battle.tabHistory")}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 font-sans">
                {t("battle.historySubtitle")}
              </p>
            </div>

            {(!historyData?.history || historyData.history.length === 0) ? (
              <div className="text-center py-16 bg-card border border-border rounded-3xl space-y-3">
                <Swords className="size-12 mx-auto text-muted-foreground/60" />
                <p className="text-muted-foreground font-bold">{t("battle.noHistory")}</p>
                <Button variant="outline" onClick={() => setActiveTab("gyms")} className="rounded-xl">
                  {t("battle.tabGyms")}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {historyData.history.map((record: any) => (
                  <div
                    key={record.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl border border-border/80 bg-card shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{record.npcBadge?.split(" ")[0] || "🏅"}</div>
                      <div>
                        <h4 className="font-bold text-foreground">{record.npcName}</h4>
                        <p className="text-xs text-muted-foreground font-mono">{record.npcTitle}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                      <Badge
                        className={`font-black text-xs px-3 py-1 ${
                          record.won
                            ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                            : "bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {record.won ? t("battle.roundWon") : t("battle.roundLost")} ({record.playerScore} x {record.opponentScore})
                      </Badge>

                      <div className="text-right text-xs font-mono">
                        <span className="font-bold text-amber-500 block">+{record.rewardCoins.toLocaleString()} {t("store.coinsShort")}</span>
                        <span className="text-[10px] text-muted-foreground">{new Date(record.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* CARD SELECTION MODAL */}
        <Dialog open={isCardPickerOpen} onOpenChange={setIsCardPickerOpen}>
          <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col bg-card border-border text-foreground p-6 rounded-3xl shadow-2xl">
            <DialogHeader className="space-y-2 pb-2 border-b border-border/80">
              <DialogTitle className="text-2xl font-black text-foreground flex items-center gap-2">
                <Shield className="size-6 text-amber-500" />
                {t("battle.modalSelectTitle")} #{selectedSlotIndex !== null ? selectedSlotIndex + 1 : ""}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground font-sans">
                {t("battle.modalSelectDesc")}
              </DialogDescription>
            </DialogHeader>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3 py-3 border-b border-border/80">
              <div className="relative flex-1 w-full">
                <Input
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  placeholder={t("collection.searchPlaceholder")}
                  className="rounded-xl bg-secondary/50 border-border text-sm"
                />
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                <Button
                  size="sm"
                  variant={pickerRarity === "all" ? "default" : "outline"}
                  onClick={() => setPickerRarity("all")}
                  className="rounded-lg text-xs h-8 px-2.5 font-bold"
                >
                  {t("common.all")}
                </Button>
                {[1, 2, 3, 4, 5].map((r) => (
                  <Button
                    key={r}
                    size="sm"
                    variant={pickerRarity === r ? "default" : "outline"}
                    onClick={() => setPickerRarity(r)}
                    className="rounded-lg text-xs h-8 px-2.5 font-bold"
                  >
                    T{r}
                  </Button>
                ))}
              </div>
            </div>

            {/* Cards Grid */}
            <div className="flex-1 overflow-y-auto py-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filteredAvailableCards.map((item) => {
                const rarityInfo = RARITY_LABELS[item.card.rarity] || RARITY_LABELS[1];
                const currentSlotPr = selectedSlotIndex !== null && localDeck[selectedSlotIndex] ? localDeck[selectedSlotIndex]!.recruitPoints : 0;
                const wouldExceed = totalPr - currentSlotPr + item.recruitPoints > 20;

                // Duplicate prevention: count copies used across other slots
                const usedInfo = usedCardCounts[item.card.id] || { count: 0, slots: [] };
                const currentlyInThisSlot = selectedSlotIndex !== null && localDeck[selectedSlotIndex]?.cardId === item.card.id;
                const usedInOtherSlots = currentlyInThisSlot ? Math.max(0, usedInfo.count - 1) : usedInfo.count;
                const isOutOfCopies = usedInOtherSlots >= (item.quantity || 1);

                const isDisabled = item.isMarkedForTrade || wouldExceed || isOutOfCopies;

                return (
                  <div
                    key={item.card.id}
                    onClick={() => !isDisabled && handleSelectCardForSlot(item)}
                    className={`relative aspect-[2.5/3.6] rounded-2xl border-2 p-2 flex flex-col justify-between transition-all select-none ${
                      isDisabled
                        ? "opacity-60 border-border bg-muted/30 cursor-not-allowed"
                        : "cursor-pointer hover:scale-[1.03] hover:border-amber-400 bg-secondary/40 border-border shadow-xs hover:shadow-md"
                    }`}
                  >
                    <div className="relative w-full flex-1 rounded-xl overflow-hidden mb-1.5">
                      <TcgCardImage src={item.card.image_url} alt={item.card.name} />

                      {/* Trade Locked Overlay */}
                      {item.isMarkedForTrade && (
                        <div className="absolute inset-0 bg-background/85 flex flex-col items-center justify-center p-2 text-center rounded-xl z-10">
                          <Lock className="size-6 text-rose-500 mb-1" />
                          <span className="text-[10px] font-bold text-rose-500">{t("collection.markedForTrade")}</span>
                        </div>
                      )}

                      {/* Out of copies in use Overlay */}
                      {isOutOfCopies && !item.isMarkedForTrade && (
                        <div className="absolute inset-0 bg-background/85 flex flex-col items-center justify-center p-2 text-center rounded-xl z-10">
                          <Lock className="size-6 text-amber-500 mb-1" />
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                            {t("battle.inUse", { slot: usedInfo.slots.join(", ") })}
                          </span>
                        </div>
                      )}

                      {wouldExceed && !item.isMarkedForTrade && !isOutOfCopies && (
                        <div className="absolute inset-0 bg-background/85 flex flex-col items-center justify-center p-2 text-center rounded-xl z-10">
                          <AlertTriangle className="size-6 text-amber-500 mb-1" />
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">{t("battle.prExceeded")}</span>
                        </div>
                      )}

                      {/* PR & CP tags */}
                      <div className="absolute top-1 left-1 bg-background/90 border border-border rounded px-1 text-[9px] font-mono font-bold text-foreground">
                        {item.recruitPoints} PR
                      </div>
                      <div className="absolute top-1 right-1 bg-background/90 border border-amber-400/60 rounded px-1 text-[9px] font-mono font-bold text-amber-500">
                        {item.combatPower} CP
                      </div>
                    </div>

                    <div className="w-full text-left">
                      <p className="text-xs font-bold text-foreground truncate">{item.card.name}</p>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                        <span>HP {item.card.hp}</span>
                        <span className={rarityInfo.color}>{rarityInfo.name}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>

        {/* LIVE BATTLE REPLAY ARENA MODAL */}
        <Dialog open={isBattleModalOpen} onOpenChange={setIsBattleModalOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-card border-amber-500/40 text-foreground p-6 sm:p-8 rounded-3xl shadow-2xl">
            {currentBattle && (
              <div className="space-y-6">
                {/* Result Hero Header */}
                <div className="text-center space-y-2 py-4">
                  <Badge
                    className={`font-black text-sm px-5 py-2 uppercase tracking-widest ${
                      currentBattle.won
                        ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/25"
                        : "bg-gradient-to-r from-rose-500 to-amber-600 text-white shadow-lg shadow-rose-500/25"
                    }`}
                  >
                    {currentBattle.won ? t("battle.victory") : t("battle.defeat")}
                  </Badge>

                  <h2 className="text-4xl sm:text-6xl font-black text-foreground font-mono">
                    {currentBattle.playerScore} x {currentBattle.npcScore}
                  </h2>
                  <p className="text-sm text-muted-foreground font-sans">
                    {t("battle.opposingLeader")}: <span className="font-bold text-foreground">{currentBattle.npc.name}</span> ({currentBattle.npc.title})
                  </p>

                  {/* Rewards Claimed */}
                  <div className="inline-flex items-center gap-6 bg-secondary/80 border border-border rounded-2xl px-6 py-2.5 mt-2 shadow-sm font-mono">
                    <div className="flex items-center gap-2">
                      <Coins className="size-5 text-amber-500" />
                      <span className="text-base font-black text-amber-500">+{currentBattle.rewardCoins.toLocaleString()} {t("store.coinsShort")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="size-5 text-primary" />
                      <span className="text-base font-black text-primary">+{currentBattle.rewardXp} XP</span>
                    </div>
                  </div>
                </div>

                {/* 3 LANES REPLAY CARDS WITH STAGGERED ENTRANCE */}
                <div className="space-y-4">
                  <h4 className="text-sm font-mono uppercase tracking-wider text-muted-foreground border-b border-border/80 pb-2">
                    {t("battle.battleLog")}
                  </h4>

                  <AnimatePresence>
                    {currentBattle.lanes.map((lane: any, idx: number) => {
                      const isLaneWon = lane.winner === "player";
                      const totalLaneCp = (lane.playerTotalCp || 0) + (lane.npcTotalCp || 0);
                      const playerPercent = totalLaneCp > 0 ? Math.round((lane.playerTotalCp / totalLaneCp) * 100) : 50;

                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.15, duration: 0.3 }}
                          className={`rounded-2xl border p-4 sm:p-5 space-y-3.5 backdrop-blur-md transition-all ${
                            isLaneWon
                              ? "bg-emerald-500/10 border-emerald-500/30 shadow-sm shadow-emerald-500/10"
                              : "bg-rose-500/10 border-rose-500/30 shadow-sm shadow-rose-500/10"
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{lane.terrain.badge}</span>
                              <div>
                                <span className="font-black text-foreground text-sm">{lane.laneName}</span>
                                <span className="text-muted-foreground ml-2 font-mono">({lane.terrain.name})</span>
                              </div>
                            </div>
                            <Badge
                              className={`font-black text-xs px-3 py-1 ${
                                isLaneWon
                                  ? "bg-emerald-500 text-slate-950 font-black"
                                  : "bg-rose-500 text-white font-black"
                              }`}
                            >
                              {isLaneWon ? t("battle.roundWon") : t("battle.roundLost")} ({lane.playerTotalCp} CP vs {lane.npcTotalCp} CP)
                            </Badge>
                          </div>

                          {/* Dynamic Combat Power Bar Gauge */}
                          <div className="space-y-1">
                            <div className="h-2 w-full bg-secondary/80 rounded-full overflow-hidden flex">
                              <div
                                style={{ width: `${playerPercent}%` }}
                                className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-500"
                              />
                              <div
                                style={{ width: `${100 - playerPercent}%` }}
                                className="h-full bg-rose-500 transition-all duration-500"
                              />
                            </div>
                            <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                              <span>Player: {playerPercent}%</span>
                              <span>Leader: {100 - playerPercent}%</span>
                            </div>
                          </div>

                          {/* Player vs NPC cards comparison */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            {/* Player Side */}
                            <div className="space-y-1.5">
                              <span className="text-[10px] text-amber-600 dark:text-amber-400 uppercase font-mono font-bold block">
                                {t("battle.tabDeck")} ({lane.playerTotalCp} CP)
                              </span>
                              <div className="flex items-center gap-2">
                                {lane.playerCards.map((pc: any, pIdx: number) => (
                                  <div key={pIdx} className="flex-1 bg-card rounded-xl p-2 border border-border flex items-center gap-2 shadow-xs">
                                    <div className="size-10 rounded-lg overflow-hidden shrink-0 border border-border">
                                      <TcgCardImage src={pc.card.image_url} alt={pc.card.name} />
                                    </div>
                                    <div className="overflow-hidden flex-1">
                                      <p className="text-xs font-bold text-foreground truncate">{pc.card.name}</p>
                                      <div className="flex items-center gap-1 flex-wrap mt-0.5 font-mono">
                                        <span className="text-[10px] text-amber-500 font-bold">{pc.combatPower.totalCp} CP</span>
                                        {pc.combatPower.synergyBonus > 0 && (
                                          <span className="text-[8px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded px-1" title={t("battle.synergyBonus")}>
                                            +10%
                                          </span>
                                        )}
                                        {pc.combatPower.typeAdvantageBonus > 0 && (
                                          <span className="text-[8px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded px-1" title={t("battle.typeAdvantage")}>
                                            +15%
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* NPC Side */}
                            <div className="space-y-1.5">
                              <span className="text-[10px] text-rose-500 uppercase font-mono font-bold block">
                                {t("battle.opposingLeader")} ({lane.npcTotalCp} CP)
                              </span>
                              <div className="flex items-center gap-2">
                                {lane.npcCards.map((nc: any, nIdx: number) => (
                                  <div key={nIdx} className="flex-1 bg-card rounded-xl p-2 border border-border flex items-center gap-2 shadow-xs">
                                    <div className="size-10 rounded-lg overflow-hidden shrink-0 border border-border">
                                      <TcgCardImage src={nc.card.image_url} alt={nc.card.name} />
                                    </div>
                                    <div className="overflow-hidden flex-1">
                                      <p className="text-xs font-bold text-foreground truncate">{nc.card.name}</p>
                                      <div className="flex items-center gap-1 flex-wrap mt-0.5 font-mono">
                                        <span className="text-[10px] text-rose-500 font-bold">{nc.combatPower.totalCp} CP</span>
                                        {nc.combatPower.synergyBonus > 0 && (
                                          <span className="text-[8px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded px-1" title={t("battle.synergyBonus")}>
                                            +10%
                                          </span>
                                        )}
                                        {nc.combatPower.typeAdvantageBonus > 0 && (
                                          <span className="text-[8px] bg-rose-500/10 text-rose-500 border border-rose-500/30 rounded px-1" title={t("battle.typeAdvantage")}>
                                            +15%
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    onClick={() => setIsBattleModalOpen(false)}
                    className="rounded-xl font-bold"
                  >
                    {t("battle.backToGyms")}
                  </Button>
                  <Button
                    onClick={() => {
                      setIsBattleModalOpen(false);
                      handleChallengeLeader(currentBattle.npc.id);
                    }}
                    className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20"
                  >
                    <RotateCcw className="size-4 mr-2" />
                    {t("battle.rematch")}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
