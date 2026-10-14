"use client";
import { BattleArena } from "@/components/battle-arena";
import type { ArenaState } from "../../../../../../shared/arena";
import { useUser } from "@/context/UserContext";
import { event } from "@/lib/telemetry";
import { LocalizedText, useUiText } from "@/i18n/localized-text";

import React, { useState, useMemo, useEffect, useRef } from "react";
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
  Info,
  Flame,
  Droplets,
  HelpCircle,
  Play,
  FastForward,
  Check,
  Eye,
  Crosshair,
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
  DialogFooter,
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
  const ui = useUiText();
  const user = useUser();
  const { t } = useTranslation();
  const { get, post } = useApi();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const RARITY_LABELS: Record<number, { name: string; color: string; border: string; bg: string }> = {
    1: { name: t("rarities.tier1") || "Comum", ...RARITY_STYLE[1] },
    2: { name: t("rarities.tier2") || "Incomum", ...RARITY_STYLE[2] },
    3: { name: t("rarities.tier3") || "Rara", ...RARITY_STYLE[3] },
    4: { name: t("rarities.tier4") || "Ultra Rara", ...RARITY_STYLE[4] },
    5: { name: t("rarities.tier5") || "Secreta / God Pull", ...RARITY_STYLE[5] },
  };

  const [activeTab, setActiveTab] = useState<"deck" | "gyms" | "history">("deck");
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [isCardPickerOpen, setIsCardPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerRarity, setPickerRarity] = useState<number | "all">("all");

  // Modais
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [selectedGymLeader, setSelectedGymLeader] = useState<GymLeaderItem | null>(null);
  const [isTeamPreviewOpen, setIsTeamPreviewOpen] = useState(false);
  const [selectedGoPicks, setSelectedGoPicks] = useState<number[]>([]); // 3 distinct deck slots; duplicate card types remain selectable

  // Live Battle Arena State
  const [isGoBattleModalOpen, setIsGoBattleModalOpen] = useState(false);
  const [currentGoBattle, setCurrentGoBattle] = useState<ArenaState | null>(null);
  const startRequest = useRef<{payload:string;key:string}|null>(null);
  const [isBattling, setIsBattling] = useState(false);

  // 1. Fetch User Deck
  const { data: deckData } = useQuery({
    queryKey: ["battle-deck", user?.id],
    queryFn: async () => {
      const res = await get("/battle/deck");
      return res.data?.data || res.data;
    },
  });

  // 2. Fetch Available Cards for Deck Builder
  const { data: availableCardsData } = useQuery({
    queryKey: ["battle-available-cards", user?.id],
    queryFn: async () => {
      const res = await get("/battle/available-cards");
      return res.data?.data || res.data;
    },
  });

  // 3. Fetch NPC Gym Leaders
  const { data: npcsData } = useQuery({
    queryKey: ["battle-npcs", user?.id],
    queryFn: async () => {
      const res = await get("/battle/npcs");
      return res.data.data.npcs;
    },
  });

  // 4. Fetch Battle History
  const { data: historyData } = useQuery({
    queryKey: ["battle-history", user?.id],
    queryFn: async () => {
      const res = await get("/battle/history");
      return res.data.data.history;
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

  const getCardCombatPowerNumber = (c: any): number => {
    if (!c) return 0;
    if (typeof c.combatPower === "number") return c.combatPower;
    if (typeof c.combatPower?.totalCp === "number") return c.combatPower.totalCp;
    return 0;
  };

  // Computes current total PR & CP
  const totalPr = useMemo(() => {
    return localDeck.reduce((acc, slot) => acc + (slot?.recruitPoints || 0), 0);
  }, [localDeck]);

  const totalCp = useMemo(() => {
    return localDeck.reduce((acc, slot) => acc + getCardCombatPowerNumber(slot), 0);
  }, [localDeck]);

  const isDeckFull = useMemo(() => {
    return localDeck.every((slot) => slot !== null);
  }, [localDeck]);

  // Track how many copies of each card are currently assigned
  const usedCardCounts = useMemo(() => {
    const counts: Record<number, { count: number; slots: number[] }> = {};
    localDeck.forEach((slot, idx) => {
      if (slot) {
        if (!counts[slot.cardId]) counts[slot.cardId] = { count: 0, slots: [] };
        counts[slot.cardId].count++;
        counts[slot.cardId].slots.push(idx + 1);
      }
    });
    return counts;
  }, [localDeck]);

  // Available cards filtered by picker search and rarity
  const filteredAvailableCards = useMemo(() => {
    const list: AvailableCardItem[] = availableCardsData?.cards || [];
    return list.filter((item) => {
      const matchesSearch = item.card.name.toLowerCase().includes(pickerSearch.toLowerCase());
      const matchesRarity = pickerRarity === "all" || item.card.rarity === pickerRarity;
      return matchesSearch && matchesRarity;
    });
  }, [availableCardsData, pickerSearch, pickerRarity]);

  // Save Deck Mutation
  const saveDeckMutation = useMutation({
    mutationFn: async (cardIds: number[]) => {
      const res = await post("/battle/deck", { cardIds });
      return res.data?.data || res.data;
    },
    onSuccess: () => {
      soundFx.playCardFlip();
      queryClient.invalidateQueries({ queryKey: ["battle-deck", user?.id] });
      toast({
        title: t("battle.deckSaved") || "Deck Salvo!",
        description: t("battle.deckSavedDesc") || "Sua equipe de 6 cartas está pronta para o combate.",
      });
    },
    onError: (err: any) => {
      toast({
        title: t("common.error") || "Erro",
        description: err.response?.data?.toast || err.message,
        variant: "destructive",
      });
    },
  });

  // Recommend Deck Mutation
  const recommendDeckMutation = useMutation({
    mutationFn: async () => {
      const res = await get("/battle/recommend-deck");
      return res.data?.data || res.data;
    },
    onSuccess: async (data) => {
      if (data?.recommendedCards) {
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

        try {
          await saveDeckMutation.mutateAsync(cardIds);
          soundFx.playEpicAura();
          toast({
            title: "Deck Recomendado Salvo!",
            description: `Deck tático balanceado salvo com sucesso! (${data.totalPoints}/20 PR - ${data.totalCp} CP)`,
          });
        } catch {
          toast({
            title: "Deck Sugerido!",
            description: `Deck balanceado montado (${data.totalPoints}/20 PR - ${data.totalCp} CP)`,
          });
        }
      }
    },
    onError: (err: any) => {
      toast({
        title: t("common.error") || "Erro",
        description: err.response?.data?.toast || err.message,
        variant: "destructive",
      });
    },
  });

  const {data:resumedArena} = useQuery({queryKey:["battle-arena",user?.id],queryFn:async()=>{const res=await get("/battle/arena");return res.data.data as ArenaState|null;}});
  useEffect(()=>{if(resumedArena) setCurrentGoBattle(resumedArena);},[resumedArena]);
  const updateArena = (state:ArenaState) => {
    setCurrentGoBattle(state);
    if(state.status!=="active") {
      event("first_battle_completed",{},true);
      for(const key of ["battle-npcs","battle-history","user","level-road","dashboard"]) queryClient.invalidateQueries({queryKey:[key]});
      queryClient.setQueryData(["battle-arena",user?.id],null);
    }
  };
  const fightNpcGoMutation = useMutation({
    mutationFn: async ({npcId,selectedCardIds}:{npcId:string;selectedCardIds:number[]}) => {
      const payload=JSON.stringify({npcId,selectedCardIds});
      if(startRequest.current?.payload!==payload) startRequest.current={payload,key:crypto.randomUUID()};
      const res=await post("/battle/arena/start",{npcId,selectedCardIds,key:startRequest.current.key});
      return res.data.data as ArenaState;
    },
    onMutate:()=>{setIsBattling(true);soundFx.playCardFlip();},
    onSuccess:(state)=>{startRequest.current=null;setIsBattling(false);setIsTeamPreviewOpen(false);setCurrentGoBattle(state);setIsGoBattleModalOpen(true);},
    onError:()=>{setIsBattling(false);queryClient.invalidateQueries({queryKey:["battle-arena",user?.id]});},
  });

  // Inicia desafio abrindo o Team Preview
  const handleOpenTeamPreview = (leader: GymLeaderItem) => {
    if(currentGoBattle?.status==="active" && Date.parse(currentGoBattle.expiresAt)>Date.now()) { setIsGoBattleModalOpen(true); return; }
    if (!isDeckFull) {
      toast({
        title: "Deck Incompleto",
        description: "Monte e salve seu time de 6 cartas na aba 'Montar Time' antes de batalhar!",
        variant: "destructive",
      });
      setActiveTab("deck");
      return;
    }
    setSelectedGymLeader(leader);
    // Pré-seleciona os 3 primeiros por padrão
    const firstThreeIds = [0, 1, 2];
    setSelectedGoPicks(firstThreeIds);
    setIsTeamPreviewOpen(true);
    soundFx.playCardFlip();
  };

  // Alterna seleção de picks no Team Preview (máx 3)
  const handleToggleGoPick = (slotIndex: number) => {
    if (selectedGoPicks.includes(slotIndex)) {
      setSelectedGoPicks(selectedGoPicks.filter((id) => id !== slotIndex));
    } else {
      if (selectedGoPicks.length < 3) {
        setSelectedGoPicks([...selectedGoPicks, slotIndex]);
        soundFx.playCardFlip();
      } else {
        toast({
          title: "Limite de 3 Pokémon",
          description: "Você já selecionou os 3 combatentes. Desmarque um para trocar!",
        });
      }
    }
  };

  // Executa o combate após confirmar os 3 picks
  const handleConfirmGoBattle = () => {
    if (!selectedGymLeader || selectedGoPicks.length !== 3) {
      toast({
        title: "Selecione 3 Pokémon",
        description: "Escolha exatamente 3 Pokémon do seu time para levar ao duelo!",
        variant: "destructive",
      });
      return;
    }
    fightNpcGoMutation.mutate({
      npcId: selectedGymLeader.id,
      selectedCardIds: selectedGoPicks.map(slot=>localDeck[slot]!.cardId),
    });
  };

  // Manipulação de slots no Deck Builder
  const handleSlotClick = (slotIdx: number) => {
    setSelectedSlotIndex(slotIdx);
    setIsCardPickerOpen(true);
  };

  const handleClearSlot = (slotIdx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = [...localDeck];
    updated[slotIdx] = null;
    setLocalDeck(updated);
  };

  const handleSelectCardForSlot = (item: AvailableCardItem) => {
    if (selectedSlotIndex === null) return;
    if (item.isMarkedForTrade) {
      toast({
        title: "Carta em Troca",
        description: "Cartas marcadas para troca não podem ser usadas em decks de batalha.",
        variant: "destructive",
      });
      return;
    }

    const usedInfo = usedCardCounts[item.card.id] || { count: 0, slots: [] };
    const currentlyInThisSlot = localDeck[selectedSlotIndex]?.cardId === item.card.id;
    const usedInOtherSlots = currentlyInThisSlot ? Math.max(0, usedInfo.count - 1) : usedInfo.count;
    if (usedInOtherSlots >= (item.quantity || 1)) {
      toast({
        title: "Cópias Esgotadas",
        description: `Todas as suas ${item.quantity} cópias já estão em uso em outros slots.`,
        variant: "destructive",
      });
      return;
    }

    const currentCardPr = localDeck[selectedSlotIndex]?.recruitPoints || 0;
    const projectedPr = totalPr - currentCardPr + item.recruitPoints;
    if (projectedPr > 20) {
      toast({
        title: "Teto de PR Excedido",
        description: `Esta carta excederia o teto salarial da Liga (${projectedPr}/20 PR).`,
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

  const handleSaveDeck = () => {
    if (!isDeckFull) {
      toast({
        title: "Deck Incompleto",
        description: "Preencha todos os 6 slots antes de salvar seu deck.",
        variant: "destructive",
      });
      return;
    }
    if (totalPr > 20) {
      toast({
        title: "Teto de PR Excedido",
        description: "O custo total do deck não pode ultrapassar 20 PR.",
        variant: "destructive",
      });
      return;
    }
    const cardIds = localDeck.map((slot) => slot!.cardId);
    saveDeckMutation.mutate(cardIds);
  };

  return (
    <div className="space-y-6">
      {/* CABEÇALHO HERO COM BOTÃO INFORMATIVO (i) */}
      <div className="relative overflow-hidden rounded-2xl border border-red-500/20 bg-gradient-to-r from-zinc-950 via-zinc-900 to-red-950/40 p-5 sm:p-6 shadow-2xl">
        <div className="absolute -right-12 -top-12 size-48 rounded-full bg-red-500/10 blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center size-8 rounded-lg bg-red-500/20 border border-red-500/40 text-red-400">
                <Swords className="size-4" />
              </span>
              <h2 className="text-xl sm:text-2xl font-bold font-syne text-foreground tracking-tight flex flex-wrap items-center gap-2"> <LocalizedText text={"Arena de Batalha Pokémon"} /> <Badge variant="outline" className="text-[10px] font-mono border-red-500/50 text-red-400 bg-red-500/10"> <LocalizedText text={"Modo Duelo GO"} /> </Badge>
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl leading-relaxed"> <LocalizedText text={"Monte seu elenco de 6 Pokémon, aplique o blefe tático escolhendo seus 3 combatentes, use escudos com sabedoria e derrote os Líderes de Ginásio!"} /> </p>
          </div>

          {/* BOTÃO (i) COMO BATALHAR */}
          <Button
            onClick={() => setIsHowToPlayOpen(true)}
            variant="outline"
            className="rounded-xl border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold text-xs gap-2 shrink-0 h-10 shadow-lg shadow-amber-500/10"
          >
            <Info className="size-4 text-amber-400 animate-pulse" />
            <span><LocalizedText text={"Como Batalhar (Tutorial & Regras)"} /></span>
          </Button>
        </div>
      </div>

      {/* TABS PRINCIPAIS */}
      <p className="mb-4 rounded-xl border bg-muted p-3 text-sm">{t("arena.rewardRules")}</p>
      {currentGoBattle?.status==="active" && <Button className="mb-4" onClick={()=>setIsGoBattleModalOpen(true)}>{t("arena.resume")}</Button>}
      <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-full space-y-4">
        <div className="flex min-w-0 flex-wrap items-center justify-between border-b border-border/80 pb-2">
          <TabsList className="h-auto flex-wrap justify-start bg-secondary/80 border border-border p-1">
            <TabsTrigger value="deck" className="text-xs sm:text-sm font-semibold gap-2">
              <Shield className="size-4 text-amber-500" />
              <span><LocalizedText text={"Montar Time (6 Pokémon)"} /></span>
            </TabsTrigger>
            <TabsTrigger value="gyms" className="text-xs sm:text-sm font-semibold gap-2">
              <Swords className="size-4 text-red-500" />
              <span><LocalizedText text={"Desafiar Ginásios ("} />{npcsData?.length || 5})</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs sm:text-sm font-semibold gap-2">
              <History className="size-4 text-purple-400" />
              <span><LocalizedText text={"Histórico"} /></span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* TAB 1: MONTAR TIME DE 6 CARTAS */}
        <TabsContent value="deck" className="mt-0 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 rounded-lg bg-muted border border-border text-center">
                <span className="text-[10px] uppercase font-mono text-muted-foreground block"><LocalizedText text={"Teto de PR"} /></span>
                <span className={`text-sm font-bold font-mono ${totalPr > 20 ? "text-rose-500" : "text-amber-400"}`}>
                  {totalPr} <LocalizedText text={"/ 20 PR"} /> </span>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-muted border border-border text-center">
                <span className="text-[10px] uppercase font-mono text-muted-foreground block"><LocalizedText text={"Poder Total (CP)"} /></span>
                <span className="text-sm font-bold font-mono text-emerald-400">
                  {totalCp} <LocalizedText text={"CP"} /> </span>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => recommendDeckMutation.mutate()}
                disabled={recommendDeckMutation.isPending}
                className="rounded-xl text-xs font-semibold gap-1.5 flex-1 sm:flex-initial border-purple-500/40 text-purple-400 hover:bg-purple-500/10"
              >
                <Sparkles className="size-3.5" />
                <span><LocalizedText text={"Auto Recomendar"} /></span>
              </Button>
              <Button
                size="sm"
                onClick={handleSaveDeck}
                disabled={saveDeckMutation.isPending || !isDeckFull || totalPr > 20}
                className="rounded-xl text-xs font-bold gap-1.5 flex-1 sm:flex-initial bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
              >
                <Check className="size-3.5 stroke-[3]" />
                <span><LocalizedText text={"Salvar Time"} /></span>
              </Button>
            </div>
          </div>

          {/* GRID DOS 6 SLOTS DO DECK */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {localDeck.map((slot, idx) => (
              <div
                key={idx}
                onClick={() => handleSlotClick(idx)}
                className={`group relative aspect-[1/1.4] rounded-2xl border-2 p-2 flex flex-col justify-between transition-all cursor-pointer select-none overflow-hidden ${
                  slot
                    ? "border-amber-500/60 bg-card/90 shadow-lg hover:border-amber-400"
                    : "border-dashed border-border/80 bg-muted/30 hover:bg-muted/60 hover:border-border"
                }`}
              >
                {slot ? (
                  <>
                    <div className="relative w-full flex-1 rounded-xl overflow-hidden mb-1.5">
                      <TcgCardImage src={slot.card.image_url} alt={ui(slot.card.name)} />
                      <button
                        onClick={(e) => handleClearSlot(idx, e)}
                        className="absolute top-1 right-1 size-6 rounded-full bg-rose-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                      <div className="absolute top-1 left-1 bg-black/80 rounded px-1 text-[9px] font-mono font-bold text-amber-400">
                        {slot.recruitPoints} <LocalizedText text={"PR"} /> </div>
                    </div>
                    <div className="text-left w-full">
                      <p className="text-xs font-bold text-foreground truncate">{ui(slot.card.name)}</p>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                        <span><LocalizedText text={"HP"} /> {slot.card.hp}</span>
                        <span className="text-amber-400 font-bold">{getCardCombatPowerNumber(slot)} <LocalizedText text={"CP"} /></span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-2 space-y-2">
                    <div className="size-10 rounded-full bg-secondary/80 border border-border flex items-center justify-center text-muted-foreground group-hover:scale-110 transition-transform">
                      <Plus className="size-5" />
                    </div>
                    <span className="text-[11px] font-mono text-muted-foreground font-semibold"> <LocalizedText text={"Slot #"} />{idx + 1}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        {/* TAB 2: DESAFIAR LÍDERES DE GINÁSIO */}
        <TabsContent value="gyms" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {(npcsData || []).map((leader: GymLeaderItem) => (
              <div
                key={leader.id}
                className="rounded-2xl border border-border/80 bg-card/90 overflow-hidden flex flex-col justify-between shadow-xl"
              >
                <div className="p-5 space-y-4">
                  {/* Top Leader Info */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="size-14 rounded-2xl overflow-hidden border-2 border-amber-500/40 bg-muted shrink-0">
                        <img src={leader.avatar} alt={ui(leader.name)} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold font-syne text-lg text-foreground">{ui(leader.name)}</span>
                          <span className="text-xs">{leader.badge}</span>
                        </div>
                        <p className="text-xs text-muted-foreground font-mono">{ui(leader.title)}</p>
                        <Badge variant="outline" className="mt-1 text-[9px] font-mono border-border text-muted-foreground">
                          {leader.difficultyLabel}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {ui(leader.description)}
                  </p>

                  {/* Elenco de 6 Pokémon do Líder (Team Preview) */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-bold block"> <LocalizedText text={"Elenco do Ginásio (6 Pokémon):"} /> </span>
                    <div className="grid grid-cols-6 gap-1.5">
                      {leader.deckPreview?.map((card, i) => (
                        <div key={i} className="aspect-[1/1.4] rounded-lg overflow-hidden border border-border/60 bg-muted" title={ui(card.name)}>
                          <img src={card.image_url} alt={ui(card.name)} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Rodapé do Card do Líder */}
                <div className="p-4 border-t border-border/60 bg-muted/50 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-amber-400 font-bold flex items-center gap-1">
                      <Coins className="size-3.5" /> +{leader.rewardCoins.toLocaleString()}
                    </span>
                    <span className="text-purple-400 font-bold flex items-center gap-1">
                      <Zap className="size-3.5" /> +{leader.rewardXp} <LocalizedText text={"XP"} /> </span>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => handleOpenTeamPreview(leader)}
                    className="rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs px-4 h-9 shadow-md shadow-red-500/20"
                  >
                    <Swords className="size-3.5 mr-1.5" />
                    <span><LocalizedText text={"Desafiar"} /></span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* TAB 3: HISTÓRICO */}
        <TabsContent value="history" className="mt-0">
          <div className="rounded-2xl border border-border/80 bg-card/60 p-4 space-y-3">
            {(!historyData || historyData.length === 0) ? (
              <div className="text-center py-12 text-muted-foreground text-xs font-mono"> <LocalizedText text={"Nenhum combate registrado ainda. Desafie os Líderes de Ginásio para entrar no histórico!"} /> </div>
            ) : (
              historyData.map((h: any) => (
                <div key={h.id} className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/60 font-mono text-xs">
                  <div className="flex items-center gap-2">
                    <Badge variant={h.won ? "default" : "destructive"} className="text-[10px] font-bold">
                      {h.won ? ui("VITÓRIA") : ui("DERROTA")}
                    </Badge>
                    <span className="font-bold text-foreground">{h.npcName}</span>
                    <span className="text-muted-foreground text-[10px]">({h.playerScore} <LocalizedText text={"x"} /> {h.opponentScore})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-amber-400 font-bold">+{h.rewardCoins.toLocaleString()} <LocalizedText text={"moedas"} /></span>
                    <span className="text-purple-400 font-bold">+{h.rewardXp * 10} <LocalizedText text={"XP"} /></span>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* MODAL 1: COMO BATALHAR (TUTORIAL & REGRAS) */}
      <Dialog open={isHowToPlayOpen} onOpenChange={setIsHowToPlayOpen}>
        <DialogContent className="sm:max-w-2xl bg-background border-amber-500/40 text-foreground p-6 rounded-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="space-y-2">
            <div className="size-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-1">
              <Info className="size-6" />
            </div>
            <DialogTitle className="text-xl font-bold font-syne text-foreground flex items-center gap-2"> <LocalizedText text={"Manual do Treinador: Modo Duelo Pokémon GO"} /> </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed"> <LocalizedText text={"Aprenda a blefar, escolher os counters certos e gerenciar seus escudos de proteção!"} /> </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3 text-sm leading-relaxed">
            <p>{t("arena.instructions")}</p><p>{t("arena.swapHint")}</p><p>{t("arena.rewardRules")}</p>
          </div>

          <DialogFooter>
            <Button onClick={() => setIsHowToPlayOpen(false)} className="rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"> <LocalizedText text={"Entendido, Mestre!"} /> </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: TELA DE BLEFE & TEAM PREVIEW (6 vs 6 -> ESCOLHER 3) */}
      <Dialog open={isTeamPreviewOpen} onOpenChange={setIsTeamPreviewOpen}>
        <DialogContent className="sm:max-w-4xl bg-background border-red-500/40 text-foreground p-6 sm:p-8 rounded-3xl max-h-[95vh] overflow-y-auto">
          <DialogHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="font-mono text-xs border-red-500/50 text-red-400 bg-red-500/10"> <LocalizedText text={"Fase de Blefe: Team Preview"} /> </Badge>
              <span className="text-xs font-mono text-muted-foreground"> <LocalizedText text={"Selecionados:"} /> <strong className="text-amber-400">{selectedGoPicks.length}/3</strong>
              </span>
            </div>
            <DialogTitle className="text-xl sm:text-2xl font-bold font-syne text-foreground"> <LocalizedText text={"Desafio contra"} /> {ui(selectedGymLeader?.name)} ({selectedGymLeader?.badge})
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground"> <LocalizedText text={"Analise o elenco de 6 do Líder de Ginásio e selecione"} /> <strong><LocalizedText text={"3 Pokémon"} /></strong> <LocalizedText text={"da sua equipe para entrar no duelo!"} /> </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Elenco do Líder */}
            <div className="space-y-2 p-4 rounded-2xl border border-red-500/30 bg-red-500/5">
              <span className="text-xs font-mono uppercase tracking-wider text-red-400 font-bold block flex items-center gap-1.5">
                <Eye className="size-3.5" /> <LocalizedText text={"Elenco de"} /> {ui(selectedGymLeader?.name)} <LocalizedText text={"(6 Pokémon Visíveis):"} /> </span>
              <div className="grid grid-cols-6 gap-2">
                {selectedGymLeader?.deckPreview.map((card, i) => (
                  <div key={i} className="aspect-[1/1.4] rounded-xl overflow-hidden border border-red-500/30 bg-muted shadow-md">
                    <img src={card.image_url} alt={ui(card.name)} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>

            {/* Seleção do Jogador (Escolha seus 3) */}
            <div className="space-y-2 p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5">
              <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-bold block flex items-center gap-1.5">
                <Crosshair className="size-3.5" /> <LocalizedText text={"Escolha os 3 Pokémon que você levará para a Arena:"} /> </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                {localDeck.map((slot, i) => {
                  if (!slot) return null;
                  const isSelected = selectedGoPicks.includes(i);
                  const pickIndex = selectedGoPicks.indexOf(i);
                  const roleLabel = pickIndex === 0 ? ui("1º (Lead)") : pickIndex === 1 ? ui("2º (Swap)") : pickIndex === 2 ? ui("3º (Closer)") : "";

                  return (
                    <button type="button" aria-pressed={isSelected} aria-label={slot.card.name}
                      key={i}
                      onClick={() => handleToggleGoPick(i)}
                      className={`relative aspect-[1/1.4] rounded-xl overflow-hidden border-2 cursor-pointer transition-all p-1 flex flex-col justify-between ${
                        isSelected
                          ? "border-amber-400 bg-amber-500/20 scale-[1.03] shadow-lg shadow-amber-500/20"
                          : "border-border/60 bg-muted opacity-60 hover:opacity-100"
                      }`}
                    >
                      <div className="relative w-full flex-1 rounded-lg overflow-hidden">
                        <TcgCardImage src={slot.card.image_url} alt={ui(slot.card.name)} />
                        {isSelected && (
                          <div className="absolute top-1 right-1 size-5 rounded-full bg-amber-400 text-slate-950 font-mono font-black text-xs flex items-center justify-center shadow-md">
                            {pickIndex + 1}
                          </div>
                        )}
                      </div>
                      <div className="text-center pt-1">
                        <p className="text-[10px] font-bold text-foreground truncate">{ui(slot.card.name)}</p>
                        {isSelected && (
                          <span className="text-[9px] font-mono font-bold text-amber-300 block">
                            {roleLabel}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setIsTeamPreviewOpen(false)} className="rounded-xl text-xs"> <LocalizedText text={"Cancelar"} /> </Button>
            <Button
              size="sm"
              disabled={selectedGoPicks.length !== 3 || isBattling}
              onClick={handleConfirmGoBattle}
              className="rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-xs px-6 shadow-lg shadow-red-500/20"
            >
              {isBattling ? (
                <>
                  <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                  <span><LocalizedText text={"Iniciando Combate..."} /></span>
                </>
              ) : (
                <>
                  <Swords className="size-3.5 mr-1.5" />
                  <span><LocalizedText text={"Entrar no Duelo (3 vs 3)"} /></span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {currentGoBattle && <BattleArena state={currentGoBattle} open={isGoBattleModalOpen} onOpenChange={setIsGoBattleModalOpen} onUpdate={updateArena}/>}

      {/* CARD PICKER MODAL (PARA MONTAR O TIME) */}
      <Dialog open={isCardPickerOpen} onOpenChange={setIsCardPickerOpen}>
        <DialogContent className="sm:max-w-3xl bg-background border-amber-500/40 text-foreground p-6 rounded-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold font-syne text-foreground flex items-center gap-2">
              <Shield className="size-5 text-amber-500" /> <LocalizedText text={"Selecionar Pokémon para o Slot #"} />{selectedSlotIndex !== null ? selectedSlotIndex + 1 : ""}
            </DialogTitle>
          </DialogHeader>

          {/* Filtros do Picker */}
          <div className="flex flex-col sm:flex-row items-center gap-2 py-2 border-b border-border/60">
            <Input
              value={pickerSearch}
              onChange={(e) => setPickerSearch(e.target.value)}
              placeholder={ui("Buscar por nome do Pokémon...")}
              className="h-8 text-xs rounded-xl bg-muted border-border"
            />
            <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
              <Button
                size="sm"
                variant={pickerRarity === "all" ? "default" : "outline"}
                onClick={() => setPickerRarity("all")}
                className="h-7 text-xs px-2 rounded-lg"
              > <LocalizedText text={"Todas"} /> </Button>
              {[1, 2, 3, 4, 5].map((r) => (
                <Button
                  key={r}
                  size="sm"
                  variant={pickerRarity === r ? "default" : "outline"}
                  onClick={() => setPickerRarity(r)}
                  className="h-7 text-xs px-2 rounded-lg font-mono"
                > <LocalizedText text={"T"} />{r}
                </Button>
              ))}
            </div>
          </div>

          {/* Grid de Cartas */}
          <div className="flex-1 overflow-y-auto py-3 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5">
            {filteredAvailableCards.map((item) => {
              const currentSlotPr = selectedSlotIndex !== null && localDeck[selectedSlotIndex] ? localDeck[selectedSlotIndex]!.recruitPoints : 0;
              const wouldExceed = totalPr - currentSlotPr + item.recruitPoints > 20;
              const usedInfo = usedCardCounts[item.card.id] || { count: 0, slots: [] };
              const currentlyInThisSlot = selectedSlotIndex !== null && localDeck[selectedSlotIndex]?.cardId === item.card.id;
              const usedInOtherSlots = currentlyInThisSlot ? Math.max(0, usedInfo.count - 1) : usedInfo.count;
              const isOutOfCopies = usedInOtherSlots >= (item.quantity || 1);
              const isDisabled = item.isMarkedForTrade || wouldExceed || isOutOfCopies;

              return (
                <div
                  key={item.card.id}
                  onClick={() => !isDisabled && handleSelectCardForSlot(item)}
                  className={`aspect-[1/1.4] rounded-xl border-2 p-1.5 flex flex-col justify-between transition-all select-none ${
                    isDisabled
                      ? "opacity-50 border-border bg-muted/40 cursor-not-allowed"
                      : "cursor-pointer hover:scale-[1.02] hover:border-amber-400 bg-muted border-border"
                  }`}
                >
                  <div className="relative w-full flex-1 rounded-lg overflow-hidden">
                    <TcgCardImage src={item.card.image_url} alt={ui(item.card.name)} />
                    <div className="absolute top-1 left-1 bg-black/80 rounded px-1 text-[8px] font-mono font-bold text-amber-400">
                      {item.recruitPoints} <LocalizedText text={"PR"} /> </div>
                  </div>
                  <div className="pt-1">
                    <p className="text-[10px] font-bold text-foreground truncate">{ui(item.card.name)}</p>
                    <div className="flex items-center justify-between text-[9px] text-muted-foreground font-mono">
                      <span><LocalizedText text={"HP"} /> {item.card.hp}</span>
                      <span className="text-amber-400 font-bold">{item.combatPower} <LocalizedText text={"CP"} /></span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
