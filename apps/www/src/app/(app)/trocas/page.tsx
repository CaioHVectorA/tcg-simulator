"use client";

import React, { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Avatar } from "@/components/avatar";
import {
  RefreshCw,
  PlusCircle,
  Clock,
  History,
  Search,
  CheckCircle2,
  Coins,
  Sparkles,
  Layers,
  Check,
  X,
  Loader2,
  AlertCircle,
  MessageSquare,
  ArrowLeftRight,
  ShieldCheck,
  Lock,
  Flame,
  ArrowRight,
  TrendingUp,
  Crown,
} from "lucide-react";
import Link from "next/link";
import { useApi } from "@/hooks/use-api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { loadTcgImg } from "@/lib/load-tcg-img";
import { soundFx } from "@/lib/sound-fx";
import { CardDetailModal, CardModalData } from "@/components/card-detail-modal";
import { ChatDialog } from "@/components/chat-dialog";
import { useUser } from "@/context/UserContext";
import { GuestRestrictionCard } from "@/components/guest-restriction-card";
import { UpgradeAccountModal } from "@/components/upgrade-account-modal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface TradeCardItem {
  id: number;
  card_id: string;
  name: string;
  image_url: string;
  rarity: number;
  hp?: number;
  type?: string;
  userOwns?: boolean;
}

interface TradeCreator {
  id: number;
  username: string;
  picture?: string;
  rarityPoints: number;
}

interface TradeListing {
  id: number;
  hash: string;
  name: string;
  description: string;
  createdAt: string;
  expiresAt?: string;
  acceptOffers: boolean;
  acceptMoney: boolean;
  moneySending: number;
  moneyReceiving: number;
  minRarity: number;
  maxRarity: number;
  creator: TradeCreator | null;
  offeredCards: TradeCardItem[];
  requestedCards: TradeCardItem[];
  canFulfill: boolean;
  isCreator: boolean;
  offersCount: number;
}

interface CounterOffer {
  id: number;
  trade_id: number;
  user_id: number;
  money: number;
  users: { id: number; username: string; picture?: string };
  trade_offer_cards: { cards: TradeCardItem }[];
}

const RARITY_STYLING: Record<
  number,
  { label: string; border: string; glow: string; text: string; badge: string; stars: string }
> = {
  1: {
    label: "Comum",
    border: "border-slate-500/40",
    glow: "hover:border-slate-400",
    text: "text-slate-300",
    badge: "bg-slate-700/80 text-slate-200 border-slate-600",
    stars: "★",
  },
  2: {
    label: "Rara",
    border: "border-blue-500/50",
    glow: "hover:border-blue-400 shadow-blue-500/10",
    text: "text-blue-400",
    badge: "bg-blue-600/80 text-blue-100 border-blue-400",
    stars: "★★",
  },
  3: {
    label: "Épica",
    border: "border-purple-500/60",
    glow: "hover:border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.25)]",
    text: "text-purple-400",
    badge: "bg-purple-600/80 text-purple-100 border-purple-400 font-bold",
    stars: "★★★",
  },
  4: {
    label: "Mística",
    border: "border-amber-400/80",
    glow: "hover:border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.35)]",
    text: "text-amber-300",
    badge: "bg-amber-500 text-slate-950 border-amber-300 font-black",
    stars: "★★★★",
  },
  5: {
    label: "God Pull",
    border: "border-rose-400",
    glow: "hover:border-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.45)] ring-1 ring-rose-400/50",
    text: "text-rose-300",
    badge: "bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 text-white font-black animate-pulse",
    stars: "★★★★★",
  },
};

export default function TrocasPage() {
  const user = useUser();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const { get, post, delete: del } = useApi();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Navigation & Filter states
  const [activeTab, setActiveTab] = useState("market");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "can-fulfill" | "5" | "4" | "3" | "with-money">("all");

  // Inspection & Dialog states
  const [inspectCard, setInspectCard] = useState<CardModalData | null>(null);
  const [chatFriend, setChatFriend] = useState<any | null>(null);
  const [confirmAcceptTrade, setConfirmAcceptTrade] = useState<TradeListing | null>(null);

  // Counter-offer modal state
  const [offerTradeTarget, setOfferTradeTarget] = useState<TradeListing | null>(null);
  const [offerSelectedCards, setOfferSelectedCards] = useState<number[]>([]);
  const [offerMoney, setOfferMoney] = useState<number>(0);

  // New Trade Creation Form State
  const [tradeTitle, setTradeTitle] = useState("");
  const [tradeDesc, setTradeDesc] = useState("");
  const [selectedSenderCards, setSelectedSenderCards] = useState<number[]>([]);
  const [selectedReceiverCards, setSelectedReceiverCards] = useState<number[]>([]);
  const [sendMoney, setSendMoney] = useState<number>(0);
  const [receiveMoney, setReceiveMoney] = useState<number>(0);
  const [allowOffers, setAllowOffers] = useState<boolean>(true);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [catalogRarityFilter, setCatalogRarityFilter] = useState<number | null>(null);
  const [durationDays, setDurationDays] = useState<number>(7);

  // Taxa de publicação: 2.000 moedas por dia
  const calculateTradeFee = (days: number) => {
    const d = Math.max(1, Math.min(30, Number(days ?? 1)));
    return d * 2000;
  };

  const tradeFee = calculateTradeFee(durationDays);
  const totalRequiredMoney = tradeFee + (sendMoney || 0);
  const userMoney = user?.money ?? 0;
  const hasEnoughBalance = userMoney >= totalRequiredMoney;

  // 1. Query: Feed de Trocas do Mercado
  const { data: marketData, isLoading: loadingMarket, refetch: refetchMarket } = useQuery<{
    trades: TradeListing[];
    pagination: { totalCount: number };
  }>({
    queryKey: ["trades", searchQuery],
    queryFn: async () => {
      const url = `/trades?search=${encodeURIComponent(searchQuery)}`;
      const res = await get(url);
      return res.data?.data;
    },
    staleTime: 10000,
  });

  // 2. Query: Minhas Trocas Criadas
  const { data: myTradesData, isLoading: loadingMyTrades } = useQuery<any[]>({
    queryKey: ["my-trades"],
    queryFn: async () => {
      const res = await get("/trades/my");
      return res.data?.data || [];
    },
    enabled: !user?.isGuest,
    staleTime: 10000,
  });

  // 3. Query: Cartas Disponíveis para Oferta (Marcadas para Troca)
  const { data: tradeableCardsData } = useQuery<any[]>({
    queryKey: ["my-tradeable-cards"],
    queryFn: async () => {
      const res = await get("/cards/my-tradeable");
      return res.data?.data || [];
    },
    enabled: !user?.isGuest,
    staleTime: 15000,
  });

  // 4. Query: Catálogo de Cartas Oficiais
  const { data: catalogData } = useQuery<any[]>({
    queryKey: ["catalog-cards", catalogSearch, catalogRarityFilter],
    queryFn: async () => {
      let url = `/cards?page=1&limit=24&search=${encodeURIComponent(catalogSearch)}`;
      const res = await get(url);
      let cards = res.data?.data || [];
      if (catalogRarityFilter) {
        cards = cards.filter((c: any) => c.rarity === catalogRarityFilter);
      }
      return cards;
    },
    staleTime: 60000,
  });

  // 5. Query: Histórico de Trocas Concluídas
  const { data: tradeHistoryData, isLoading: loadingHistory } = useQuery<any[]>({
    queryKey: ["trade-history"],
    queryFn: async () => {
      const res = await get("/trades/history");
      return res.data?.data || [];
    },
    enabled: activeTab === "history",
    staleTime: 20000,
  });

  const rawTrades = marketData?.trades || [];
  const myTrades = myTradesData || [];
  const myInventory = tradeableCardsData || [];
  const catalogCards = catalogData || [];
  const tradeHistory = tradeHistoryData || [];

  // Contagem de trocas que o usuário pode cumprir agora
  const canFulfillCount = useMemo(() => {
    return rawTrades.filter((t) => t.canFulfill).length;
  }, [rawTrades]);

  // Filtragem tátil no cliente
  const filteredTrades = useMemo(() => {
    return rawTrades.filter((t) => {
      if (filterMode === "can-fulfill") return t.canFulfill;
      if (filterMode === "5") return t.maxRarity === 5;
      if (filterMode === "4") return t.maxRarity === 4;
      if (filterMode === "3") return t.maxRarity === 3;
      if (filterMode === "with-money") return t.moneySending > 0 || t.moneyReceiving > 0;
      return true;
    });
  }, [rawTrades, filterMode]);

  // Mutations
  const { mutate: createTrade, isPending: creatingTrade } = useMutation({
    mutationFn: async () => {
      const res = await post("/trades", {
        name: tradeTitle,
        description: tradeDesc,
        sender_cards: selectedSenderCards,
        receiver_cards: selectedReceiverCards,
        moneySending: sendMoney,
        moneyReceiving: receiveMoney,
        acceptOffers: allowOffers,
        durationDays,
      });
      return res.data;
    },
    onSuccess: () => {
      soundFx.playSuccess();
      toast({
        title: "Oferta Publicada com Sucesso!",
        description: `Sua oferta de troca está ativa no mercado por ${durationDays} dias.`,
      });
      setTradeTitle("");
      setTradeDesc("");
      setSelectedSenderCards([]);
      setSelectedReceiverCards([]);
      setSendMoney(0);
      setReceiveMoney(0);
      setActiveTab("market");
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      queryClient.invalidateQueries({ queryKey: ["my-trades"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["my-tradeable-cards"] });
    },
    onError: (err: any) => {
      toast({
        title: "Erro ao criar troca",
        description: err.response?.data?.toast || "Verifique o saldo e os campos preenchidos.",
        variant: "destructive",
      });
    },
  });

  const { mutate: acceptTrade, isPending: acceptingTrade } = useMutation({
    mutationFn: async (tradeId: number) => {
      const res = await post(`/trades/accept/${tradeId}`, {});
      return res.data;
    },
    onSuccess: () => {
      soundFx.playTradeSuccess();
      toast({
        title: "Troca Realizada com Sucesso! 🎉",
        description: "As cartas e moedas foram transferidas para sua conta.",
      });
      setConfirmAcceptTrade(null);
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["my-tradeable-cards"] });
      queryClient.invalidateQueries({ queryKey: ["cards"] });
    },
    onError: (err: any) => {
      toast({
        title: "Não foi possível aceitar a troca",
        description: err.response?.data?.toast || "Verifique se você possui os itens solicitados.",
        variant: "destructive",
      });
    },
  });

  const { mutate: sendCounterOffer, isPending: sendingOffer } = useMutation({
    mutationFn: async () => {
      if (!offerTradeTarget) return;
      const res = await post(`/trades/${offerTradeTarget.id}/offer`, {
        card_ids: offerSelectedCards,
        money: offerMoney,
      });
      return res.data;
    },
    onSuccess: () => {
      soundFx.playSuccess();
      toast({
        title: "Contraproposta Enviada!",
        description: "O criador da troca foi notificado da sua proposta.",
      });
      setOfferTradeTarget(null);
      setOfferSelectedCards([]);
      setOfferMoney(0);
      queryClient.invalidateQueries({ queryKey: ["trades"] });
    },
    onError: (err: any) => {
      toast({
        title: "Falha ao enviar proposta",
        description: err.response?.data?.toast || "Verifique as cartas selecionadas.",
        variant: "destructive",
      });
    },
  });

  const { mutate: acceptCounterOffer, isPending: acceptingCounter } = useMutation({
    mutationFn: async (offerId: number) => {
      const res = await post(`/trades/offer/${offerId}/accept`, {});
      return res.data;
    },
    onSuccess: () => {
      soundFx.playTradeSuccess();
      toast({
        title: "Contraproposta Aceita! 🤝",
        description: "Troca finalizada com sucesso! O binder foi atualizado.",
      });
      queryClient.invalidateQueries({ queryKey: ["my-trades"] });
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["my-tradeable-cards"] });
    },
  });

  const { mutate: cancelTrade } = useMutation({
    mutationFn: async (tradeId: number) => {
      await del(`/trades/${tradeId}`);
    },
    onSuccess: () => {
      soundFx.playSuccess();
      toast({ title: "Troca cancelada com sucesso" });
      queryClient.invalidateQueries({ queryKey: ["my-trades"] });
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      queryClient.invalidateQueries({ queryKey: ["my-tradeable-cards"] });
    },
  });

  const formatRemainingTime = (expiresAt?: string) => {
    if (!expiresAt) return null;
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return "Expirada";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days >= 1) return `Expira em ${days}d`;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    return `Expira em ${hours}h`;
  };

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 max-w-7xl font-syne select-none">
      {/* HEADER PRINCIPAL TÁTIL */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-border/80">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/80 border border-border/80 text-secondary-foreground text-xs font-semibold mb-2 shadow-xs">
            <ArrowLeftRight className="size-3.5 text-amber-500" />
            <span>Mesa de Negociações P2P</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
            <span>Estação de Trocas</span>
            <span className="text-xs font-mono font-bold bg-amber-500/15 border border-amber-500/30 text-amber-500 px-2.5 py-0.5 rounded-lg">
              {rawTrades.length} Ofertas Ativas
            </span>
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1 max-w-2xl font-sans">
            Negocie diretamente com outros treinadores. Descubra cartas que faltam no seu binder, compare raridades e feche acordos justos.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => {
              setActiveTab("create");
              soundFx.playCardFlip();
            }}
            className="rounded-xl h-11 px-6 font-syne font-bold shadow-lg shadow-amber-500/15 gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 transition-all hover:scale-105 active:scale-95"
          >
            <PlusCircle className="size-4" /> Criar Nova Oferta
          </Button>
        </div>
      </div>

      {/* TABS DE NAVEGAÇÃO PRINCIPAIS */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => {
          setActiveTab(val);
          soundFx.playCardFlip();
        }}
        className="w-full"
      >
        <TabsList className="grid grid-cols-4 w-full sm:w-[640px] h-12 rounded-2xl p-1 bg-secondary/60 border border-border/80 mb-6">
          <TabsTrigger
            value="market"
            className="rounded-xl text-xs sm:text-sm font-bold gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm"
          >
            <RefreshCw className="size-3.5" /> Mercado
          </TabsTrigger>
          <TabsTrigger
            value="create"
            className="rounded-xl text-xs sm:text-sm font-bold gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm"
          >
            <PlusCircle className="size-3.5" /> Criar Oferta
          </TabsTrigger>
          <TabsTrigger
            value="my"
            className="rounded-xl text-xs sm:text-sm font-bold gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm relative"
          >
            <Clock className="size-3.5" /> Minhas ({myTrades.length})
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="rounded-xl text-xs sm:text-sm font-bold gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm"
          >
            <History className="size-3.5" /> Histórico
          </TabsTrigger>
        </TabsList>

        {/* 1. ABA: MERCADO PÚBLICO */}
        <TabsContent value="market" className="space-y-6">
          {user?.isGuest && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <Sparkles className="size-4 text-amber-500 shrink-0" />
                <span className="text-muted-foreground font-sans">
                  Você está visualizando o mercado como <strong>Convidado</strong>. Salve sua conta para aceitar trocas e enviar contrapropostas.
                </span>
              </div>
              <Button
                size="sm"
                onClick={() => setUpgradeOpen(true)}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs h-8 shrink-0 rounded-lg shadow-xs"
              >
                Salvar Minha Conta
              </Button>
            </div>
          )}

          {/* BARRA DE BUSCA E CHIPS DE FILTRO RÁPIDO */}
          <div className="bg-card/70 border border-border/80 rounded-2xl p-4 sm:p-5 shadow-xs backdrop-blur-xs space-y-4">
            <div className="relative w-full">
              <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nome do Pokémon ou título da troca (ex: Charizard, Pikachu, Mewtwo)..."
                className="pl-10 pr-9 h-11 rounded-xl text-xs font-sans bg-secondary/40 border-border/60"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            {/* CHIPS RÁPIDOS DE FILTRAGEM TÁTIL */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/40">
              <button
                type="button"
                onClick={() => {
                  setFilterMode("all");
                  soundFx.playCardFlip();
                }}
                className={`text-xs font-mono font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                  filterMode === "all"
                    ? "bg-foreground text-background border-foreground shadow-xs"
                    : "bg-secondary/60 border-border/60 text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                Todas ({rawTrades.length})
              </button>

              <button
                type="button"
                onClick={() => {
                  setFilterMode("can-fulfill");
                  soundFx.playCardFlip();
                }}
                className={`text-xs font-mono font-bold px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                  filterMode === "can-fulfill"
                    ? "bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30"
                    : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                }`}
              >
                <CheckCircle2 className="size-3.5" />
                <span>Posso Aceitar Já</span>
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-emerald-700/80 text-[10px]">
                  {canFulfillCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFilterMode("5");
                  soundFx.playCardFlip();
                }}
                className={`text-xs font-mono font-bold px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1 cursor-pointer ${
                  filterMode === "5"
                    ? "bg-amber-500 text-slate-950 border-amber-400 shadow-xs"
                    : "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
                }`}
              >
                <Crown className="size-3" />
                <span>God Pulls (★5)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFilterMode("4");
                  soundFx.playCardFlip();
                }}
                className={`text-xs font-mono font-bold px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1 cursor-pointer ${
                  filterMode === "4"
                    ? "bg-purple-600 text-white border-purple-500 shadow-xs"
                    : "bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20"
                }`}
              >
                <Sparkles className="size-3" />
                <span>Místicas (★4)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setFilterMode("3");
                  soundFx.playCardFlip();
                }}
                className={`text-xs font-mono font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                  filterMode === "3"
                    ? "bg-indigo-600 text-white border-indigo-500 shadow-xs"
                    : "bg-indigo-500/10 border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20"
                }`}
              >
                Épicas (★3)
              </button>

              <button
                type="button"
                onClick={() => {
                  setFilterMode("with-money");
                  soundFx.playCardFlip();
                }}
                className={`text-xs font-mono font-bold px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1 cursor-pointer ${
                  filterMode === "with-money"
                    ? "bg-amber-600 text-white border-amber-500 shadow-xs"
                    : "bg-secondary/60 border-border/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                <Coins className="size-3 text-amber-400" />
                <span>Com Moedas</span>
              </button>
            </div>
          </div>

          {/* LISTA PRINCIPAL DE TROCAS: CARDS EM FORMATO DE MESA DE NEGOCIAÇÃO */}
          {loadingMarket ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3">
              <Loader2 className="size-8 animate-spin text-amber-500" />
              <span className="text-xs font-mono text-muted-foreground">Carregando ofertas da comunidade...</span>
            </div>
          ) : filteredTrades.length === 0 ? (
            <div className="bg-card/40 border border-border/80 rounded-3xl p-16 text-center text-muted-foreground">
              <RefreshCw className="size-12 mx-auto mb-3 opacity-30 text-amber-500" />
              <p className="text-lg font-bold text-foreground font-syne">Nenhuma troca encontrada</p>
              <p className="text-xs font-sans mt-1 max-w-md mx-auto">
                {filterMode === "can-fulfill"
                  ? "Você ainda não possui as cartas solicitadas para as trocas ativas. Abra mais pacotes na Loja ou limpe o filtro!"
                  : "Nenhuma oferta corresponde aos filtros selecionados. Tente buscar outro nome ou crie sua própria oferta!"}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setFilterMode("all");
                  setSearchQuery("");
                }}
                className="mt-4 text-xs font-bold"
              >
                Restaurar Todos os Filtros
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {filteredTrades.map((trade) => {
                const remainingTime = formatRemainingTime(trade.expiresAt);
                return (
                  <div
                    key={trade.id}
                    className={`rounded-3xl border p-5 sm:p-6 transition-all duration-300 flex flex-col justify-between relative overflow-hidden backdrop-blur-xs ${
                      trade.canFulfill
                        ? "bg-gradient-to-br from-emerald-950/20 via-card/80 to-card/60 border-emerald-500/40 shadow-lg shadow-emerald-500/5 hover:border-emerald-500/70"
                        : "bg-card/70 border-border/80 hover:border-border hover:shadow-md"
                    }`}
                  >
                    <div>
                      {/* HEADER DO CARD: TREINADOR + METADADOS */}
                      <div className="flex items-center justify-between gap-3 pb-3.5 border-b border-border/60 mb-4">
                        <div className="flex items-center gap-3">
                          <Avatar
                            username={trade.creator?.username || "Treinador"}
                            src={trade.creator?.picture}
                            className="size-9 rounded-full ring-2 ring-amber-500/40 shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-sm text-foreground leading-tight font-syne">
                                {trade.creator?.username || "Treinador da Liga"}
                              </h3>
                              {trade.creator?.rarityPoints ? (
                                <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-secondary text-muted-foreground border border-border/60">
                                  {trade.creator.rarityPoints.toLocaleString("pt-BR")} RP
                                </span>
                              ) : null}
                            </div>
                            <span className="text-[11px] text-muted-foreground font-sans flex items-center gap-1.5 mt-0.5">
                              {remainingTime ? (
                                <span className="flex items-center gap-1 text-amber-400 font-mono text-[10px]">
                                  <Clock className="size-3" /> {remainingTime}
                                </span>
                              ) : (
                                `Publicado em ${new Date(trade.createdAt).toLocaleDateString("pt-BR")}`
                              )}
                            </span>
                          </div>
                        </div>

                        {/* STATUS DE DISPONIBILIDADE E CHAT */}
                        <div className="flex items-center gap-2">
                          {trade.canFulfill && (
                            <Badge className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black px-2.5 py-0.5 shadow-xs animate-pulse">
                              ✓ Disponível p/ Você
                            </Badge>
                          )}
                          {trade.creator && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 rounded-xl hover:bg-secondary"
                              title={`Conversar com ${trade.creator.username}`}
                              onClick={() => setChatFriend(trade.creator)}
                            >
                              <MessageSquare className="size-4 text-sky-400" />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* TÍTULO E DESCRIÇÃO DA OFERTA */}
                      <div className="mb-4">
                        <h2 className="font-syne font-black text-base text-foreground leading-tight mb-1">
                          {trade.name}
                        </h2>
                        {trade.description && (
                          <p className="text-xs text-muted-foreground font-sans italic line-clamp-2">
                            "{trade.description}"
                          </p>
                        )}
                      </div>

                      {/* A MESA DE NEGOCIAÇÃO: VOCÊ RECEBE ⇄ VOCÊ ENTREGA */}
                      <div className="bg-secondary/40 border border-border/60 rounded-2xl p-4 mb-4 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                        {/* LADO ESQUERDO: VOCÊ RECEBE (OFERTADO) */}
                        <div className="sm:col-span-5 flex flex-col items-center sm:items-start text-center sm:text-left">
                          <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest block mb-2 flex items-center gap-1">
                            <Sparkles className="size-3" /> Você Recebe:
                          </span>

                          <div className="flex flex-wrap gap-2.5 justify-center sm:justify-start">
                            {trade.offeredCards.map((card) => {
                              const style = RARITY_STYLING[card.rarity] || RARITY_STYLING[1];
                              return (
                                <div
                                  key={card.id}
                                  onClick={() => {
                                    setInspectCard(card);
                                    soundFx.playCardFlip();
                                  }}
                                  className={`relative group cursor-pointer w-20 aspect-[2.5/3.5] rounded-xl overflow-hidden border-2 transition-all duration-300 hover:scale-105 hover:z-20 ${style.border} ${style.glow}`}
                                  title={`Clique para inspecionar ${card.name}`}
                                >
                                  <img
                                    src={loadTcgImg(card.image_url)}
                                    alt={card.name}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute top-1 left-1">
                                    <span className={`text-[8px] px-1 py-0.2 rounded-sm font-mono ${style.badge}`}>
                                      {style.stars}
                                    </span>
                                  </div>
                                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-1">
                                    <span className="text-[9px] font-bold text-white truncate w-full">
                                      {card.name}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {trade.moneySending > 0 && (
                            <div className="mt-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-400 font-mono font-bold text-xs">
                              <Coins className="size-3" />
                              <span>+ {trade.moneySending.toLocaleString("pt-BR")} moedas</span>
                            </div>
                          )}
                        </div>

                        {/* CENTRO: CONECTOR VISUAL COM ÍCONE BIDIRECIONAL */}
                        <div className="sm:col-span-2 flex flex-col items-center justify-center py-1">
                          <div className="size-9 rounded-full bg-secondary border border-border/80 flex items-center justify-center shadow-xs">
                            <ArrowLeftRight className="size-4 text-amber-400 animate-pulse" />
                          </div>
                          <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest mt-1">
                            Troca
                          </span>
                        </div>

                        {/* LADO DIREITO: VOCÊ ENTREGA (SOLICITADO COM INDICADOR DE POSSE) */}
                        <div className="sm:col-span-5 flex flex-col items-center sm:items-end text-center sm:text-right">
                          <span className="text-[10px] font-mono font-bold text-sky-400 uppercase tracking-widest block mb-2 flex items-center gap-1">
                            <Layers className="size-3" /> Você Entrega:
                          </span>

                          <div className="flex flex-wrap gap-2.5 justify-center sm:justify-end">
                            {trade.requestedCards.length === 0 ? (
                              <div className="p-3 rounded-xl border border-dashed border-border/80 text-xs font-sans text-muted-foreground italic">
                                Qualquer oferta justa
                              </div>
                            ) : (
                              trade.requestedCards.map((card) => {
                                const style = RARITY_STYLING[card.rarity] || RARITY_STYLING[1];
                                const ownsCard = Boolean(card.userOwns);
                                return (
                                  <div
                                    key={card.id}
                                    onClick={() => {
                                      setInspectCard(card);
                                      soundFx.playCardFlip();
                                    }}
                                    className={`relative group cursor-pointer w-20 aspect-[2.5/3.5] rounded-xl overflow-hidden border-2 transition-all duration-300 hover:scale-105 hover:z-20 ${
                                      ownsCard
                                        ? "border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)] ring-2 ring-emerald-500/40"
                                        : "border-border/80 opacity-70 grayscale-[30%]"
                                    }`}
                                    title={`${card.name} — ${ownsCard ? "Você possui esta carta no seu binder!" : "Falta na sua coleção"}`}
                                  >
                                    <img
                                      src={loadTcgImg(card.image_url)}
                                      alt={card.name}
                                      className="w-full h-full object-cover"
                                    />
                                    {/* BADGE DE POSSE EM TEMPO REAL */}
                                    <div className="absolute top-1 right-1 z-10">
                                      {ownsCard ? (
                                        <span className="size-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                                          <Check className="size-3 stroke-[3]" />
                                        </span>
                                      ) : (
                                        <span className="size-5 rounded-full bg-slate-900/80 text-muted-foreground border border-white/20 flex items-center justify-center shadow-xs">
                                          <Lock className="size-2.5" />
                                        </span>
                                      )}
                                    </div>
                                    <div className="absolute bottom-1 left-1 right-1">
                                      <span
                                        className={`text-[8px] px-1 py-0.2 rounded-sm font-mono block text-center truncate ${
                                          ownsCard ? "bg-emerald-950/90 text-emerald-300 border border-emerald-500/50" : "bg-slate-950/90 text-slate-400"
                                        }`}
                                      >
                                        {ownsCard ? "✓ No Binder" : "🔒 Falta"}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>

                          {trade.moneyReceiving > 0 && (
                            <div className="mt-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-400 font-mono font-bold text-xs">
                              <Coins className="size-3" />
                              <span>Pede {trade.moneyReceiving.toLocaleString("pt-BR")} moedas</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* RODAPÉ DO CARD COM AÇÕES E FEEDBACK TÁTIL */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border/60">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-sans">
                        {trade.offersCount > 0 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-500/15 text-sky-400 font-mono text-[11px] font-bold">
                            <MessageSquare className="size-3" /> {trade.offersCount} propostas ativas
                          </span>
                        )}
                        <span>{trade.acceptOffers ? "Aceita contrapropostas" : "Troca direta 1x1"}</span>
                      </div>

                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        {trade.isCreator ? (
                          <Badge variant="outline" className="text-xs font-mono py-1 px-3 border-amber-500/40 text-amber-500">
                            Sua Oferta de Troca
                          </Badge>
                        ) : (
                          <>
                            {trade.acceptOffers && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (user?.isGuest) {
                                    setUpgradeOpen(true);
                                    return;
                                  }
                                  setOfferTradeTarget(trade);
                                  setOfferSelectedCards([]);
                                  setOfferMoney(0);
                                  soundFx.playCardFlip();
                                }}
                                className="text-xs h-10 px-4 rounded-xl font-bold border-border/80 hover:bg-secondary"
                              >
                                Fazer Proposta
                              </Button>
                            )}

                            <Button
                              size="sm"
                              disabled={!trade.canFulfill}
                              onClick={() => {
                                if (user?.isGuest) {
                                  setUpgradeOpen(true);
                                  return;
                                }
                                setConfirmAcceptTrade(trade);
                                soundFx.playCardFlip();
                              }}
                              className={`text-xs h-10 px-5 rounded-xl font-bold font-syne transition-all ${
                                trade.canFulfill
                                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-600/20 hover:scale-105 active:scale-95 cursor-pointer"
                                  : "opacity-40 cursor-not-allowed"
                              }`}
                            >
                              <CheckCircle2 className="size-4 mr-1.5" />
                              {trade.canFulfill ? "Aceitar Troca" : "Faltam Itens"}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* 2. ABA: CRIAR NOVA OFERTA (TRADE BUILDER) */}
        <TabsContent value="create" className="space-y-6 max-w-4xl mx-auto">
          {user?.isGuest ? (
            <GuestRestrictionCard featureTitle="a Criação de Ofertas de Troca" />
          ) : (
            <div className="bg-card/80 border border-border/80 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-md space-y-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold font-mono mb-2">
                  <PlusCircle className="size-3.5" />
                  <span>Novo Anúncio no Mercado</span>
                </div>
                <h2 className="text-2xl font-black text-foreground font-syne">Configurar Oferta de Troca</h2>
                <p className="text-xs sm:text-sm text-muted-foreground font-sans mt-0.5">
                  Selecione as cartas marcadas da sua coleção que deseja ceder e configure os requisitos que deseja receber.
                </p>
              </div>

              {/* TÍTULO E DESCRIÇÃO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 font-sans text-xs">
                <div>
                  <label className="font-bold text-foreground block mb-1">Título do Anúncio:</label>
                  <Input
                    value={tradeTitle}
                    onChange={(e) => setTradeTitle(e.target.value)}
                    placeholder="Ex: Troco Charizard por Blastoise ou cartas de Água"
                    className="rounded-xl h-11 font-syne text-sm bg-secondary/40"
                  />
                </div>

                <div>
                  <label className="font-bold text-foreground block mb-1">Mensagem para a Comunidade:</label>
                  <Input
                    value={tradeDesc}
                    onChange={(e) => setTradeDesc(e.target.value)}
                    placeholder="Ex: Aberto a contrapropostas com cartas de raridade equivalente"
                    className="rounded-xl h-11 bg-secondary/40"
                  />
                </div>
              </div>

              {/* PASSO 1: O QUE VOCÊ OFERECE (CARTAS MARCADAS PARA TROCA) */}
              <div className="pt-4 border-t border-border/60 space-y-3">
                <div className="bg-teal-500/10 border border-teal-500/30 rounded-2xl p-4 flex items-start gap-3 text-xs text-teal-300">
                  <ArrowLeftRight className="size-4 shrink-0 text-teal-400 mt-0.5" />
                  <div>
                    <strong className="block mb-0.5 text-teal-200">Apenas cartas marcadas para troca:</strong>
                    Você pode selecionar abaixo cartas que marcou na sua Coleção. Lembre-se: cartas marcadas para troca ficam bloqueadas para montagem de decks no modo Batalha!
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-foreground flex items-center gap-2">
                    <Layers className="size-4 text-emerald-500" />
                    <span>1. Suas Cartas Ofertadas ({myInventory.length} disponíveis):</span>
                  </span>
                  <span className="text-xs font-mono text-muted-foreground">
                    {selectedSenderCards.length} selecionada(s)
                  </span>
                </div>

                {myInventory.length === 0 ? (
                  <div className="py-10 px-4 text-center rounded-2xl border border-dashed border-border/80 flex flex-col items-center justify-center gap-3">
                    <Layers className="size-8 text-muted-foreground/40" />
                    <p className="text-xs text-muted-foreground max-w-md">
                      Você ainda não marcou nenhuma carta para troca na sua coleção.
                    </p>
                    <Button asChild variant="outline" size="sm" className="text-xs font-bold gap-2 border-teal-500/40 text-teal-400 hover:bg-teal-500/10">
                      <Link href="/colecao">
                        <ArrowLeftRight className="size-3.5" /> Ir para Minha Coleção & Marcar Cartas
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="max-h-60 overflow-y-auto p-3 bg-secondary/30 rounded-2xl border border-border/40 grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                    {myInventory.map((item) => {
                      const card = item.Card || item;
                      const isSelected = selectedSenderCards.includes(card.id);
                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            soundFx.playCardFlip();
                            if (isSelected) {
                              setSelectedSenderCards(selectedSenderCards.filter((id) => id !== card.id));
                            } else {
                              setSelectedSenderCards([...selectedSenderCards, card.id]);
                            }
                          }}
                          className={`relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all duration-200 aspect-[2.5/3.5] ${
                            isSelected
                              ? "border-amber-400 ring-2 ring-amber-400/50 scale-95 shadow-md shadow-amber-500/20"
                              : "border-border/60 hover:border-border hover:scale-105"
                          }`}
                        >
                          <img
                            src={loadTcgImg(card.image_url)}
                            alt={card.name}
                            className="w-full h-full object-cover"
                          />
                          {isSelected && (
                            <div className="absolute inset-0 bg-amber-500/30 flex items-center justify-center backdrop-blur-xs">
                              <Check className="size-6 text-white font-black stroke-[3]" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-2">
                  <span className="text-xs text-muted-foreground font-sans">Incluir moedas na oferta (opcional):</span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={0}
                      value={sendMoney}
                      onChange={(e) => setSendMoney(Math.max(0, Number(e.target.value)))}
                      className="w-32 h-10 rounded-xl font-mono text-xs bg-secondary/40"
                      placeholder="0 moedas"
                    />
                    {[2000, 5000, 20000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          setSendMoney(amt);
                          soundFx.playCardFlip();
                        }}
                        className="text-[11px] font-mono px-2 py-1 rounded-lg border border-border/60 bg-secondary/60 hover:text-foreground text-muted-foreground"
                      >
                        +{amt / 1000}k
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* PASSO 2: O QUE VOCÊ DESEJA RECEBER */}
              <div className="pt-4 border-t border-border/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-foreground flex items-center gap-2">
                    <Sparkles className="size-4 text-sky-400" />
                    <span>2. O que você deseja receber do outro treinador:</span>
                  </span>
                  <span className="text-xs font-mono text-muted-foreground">
                    {selectedReceiverCards.length} selecionada(s)
                  </span>
                </div>

                {/* BUSCA NO CATÁLOGO E FILTRO POR RARIDADE */}
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="relative flex-1 w-full">
                    <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={catalogSearch}
                      onChange={(e) => setCatalogSearch(e.target.value)}
                      placeholder="Buscar no catálogo oficial (ex: Pikachu, Mewtwo, Rayquaza)..."
                      className="pl-9 h-10 rounded-xl text-xs font-sans bg-secondary/40"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 w-full sm:w-auto">
                    {[
                      { r: null, l: "Todos" },
                      { r: 3, l: "★3" },
                      { r: 4, l: "★4" },
                      { r: 5, l: "★5" },
                    ].map((btn) => (
                      <button
                        key={String(btn.r)}
                        type="button"
                        onClick={() => setCatalogRarityFilter(btn.r)}
                        className={`text-xs font-mono px-2.5 py-1.5 rounded-lg border transition-all ${
                          catalogRarityFilter === btn.r
                            ? "bg-sky-600 text-white border-sky-500 font-bold"
                            : "bg-secondary/60 border-border/60 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {btn.l}
                      </button>
                    ))}
                  </div>
                </div>

                {catalogCards.length > 0 && (
                  <div className="max-h-56 overflow-y-auto p-3 bg-secondary/30 rounded-2xl border border-border/40 grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                    {catalogCards.map((card) => {
                      const isSelected = selectedReceiverCards.includes(card.id);
                      return (
                        <div
                          key={card.id}
                          onClick={() => {
                            soundFx.playCardFlip();
                            if (isSelected) {
                              setSelectedReceiverCards(selectedReceiverCards.filter((id) => id !== card.id));
                            } else {
                              setSelectedReceiverCards([...selectedReceiverCards, card.id]);
                            }
                          }}
                          className={`relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all duration-200 aspect-[2.5/3.5] ${
                            isSelected
                              ? "border-sky-500 ring-2 ring-sky-500/50 scale-95 shadow-md shadow-sky-500/20"
                              : "border-border/60 hover:border-border hover:scale-105"
                          }`}
                        >
                          <img
                            src={loadTcgImg(card.image_url)}
                            alt={card.name}
                            className="w-full h-full object-cover"
                          />
                          {isSelected && (
                            <div className="absolute inset-0 bg-sky-500/30 flex items-center justify-center backdrop-blur-xs">
                              <Check className="size-6 text-white font-black stroke-[3]" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-2">
                  <span className="text-xs text-muted-foreground font-sans">Pedir moedas na troca (opcional):</span>
                  <Input
                    type="number"
                    min={0}
                    value={receiveMoney}
                    onChange={(e) => setReceiveMoney(Math.max(0, Number(e.target.value)))}
                    className="w-32 h-10 rounded-xl font-mono text-xs bg-secondary/40"
                    placeholder="0 moedas"
                  />
                </div>
              </div>

              {/* PASSO 3: DURAÇÃO & TAXA DE PUBLICAÇÃO (2K / DIA) */}
              <div className="pt-4 border-t border-border/60 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Clock className="size-4 text-amber-500" />
                      <span>3. Duração da Oferta no Mercado:</span>
                    </span>
                    <span className="text-[11px] text-muted-foreground font-sans">
                      Taxa de publicação oficial: 2.000 moedas por dia
                    </span>
                  </div>
                  <Badge className="font-mono text-xs bg-amber-500/15 border-amber-500/30 text-amber-400">
                    {durationDays} {durationDays === 1 ? "dia" : "dias"}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                  {[
                    { days: 1, label: "1 dia" },
                    { days: 3, label: "3 dias" },
                    { days: 5, label: "5 dias" },
                    { days: 7, label: "7 dias" },
                    { days: 14, label: "14 dias" },
                    { days: 30, label: "30 dias" },
                  ].map((opt) => {
                    const isSelected = durationDays === opt.days;
                    const optFee = calculateTradeFee(opt.days);
                    return (
                      <button
                        key={opt.days}
                        type="button"
                        onClick={() => {
                          setDurationDays(opt.days);
                          soundFx.playCardFlip();
                        }}
                        className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                          isSelected
                            ? "border-amber-500 bg-amber-500/15 shadow-sm ring-1 ring-amber-500/50"
                            : "border-border/60 bg-secondary/40 hover:bg-secondary"
                        }`}
                      >
                        <span className={`text-xs font-bold ${isSelected ? "text-amber-400" : "text-foreground"}`}>
                          {opt.label}
                        </span>
                        <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-0.5">
                          <Coins className="size-3 text-amber-500" /> {optFee.toLocaleString("pt-BR")}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* TRADE TICKET: RESUMO DE NEGOCIAÇÃO */}
                <div className="p-4 rounded-2xl bg-secondary/50 border border-border/80 space-y-2.5 text-xs font-sans">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Taxa de publicação ({durationDays} dias):</span>
                    <span className="font-mono font-bold text-amber-400 flex items-center gap-1">
                      <Coins className="size-3.5" /> {tradeFee.toLocaleString("pt-BR")} moedas
                    </span>
                  </div>

                  {sendMoney > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Moedas inclusas na troca:</span>
                      <span className="font-mono font-bold text-foreground">
                        + {sendMoney.toLocaleString("pt-BR")} moedas
                      </span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-border/60 flex items-center justify-between">
                    <span className="font-bold text-foreground">Total exigido para publicar:</span>
                    <div className="text-right">
                      <span className="font-mono font-black text-sm text-foreground block">
                        {totalRequiredMoney.toLocaleString("pt-BR")} moedas
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        Seu saldo atual:{" "}
                        <strong className={!hasEnoughBalance ? "text-destructive" : "text-emerald-400"}>
                          {userMoney.toLocaleString("pt-BR")}
                        </strong>
                      </span>
                    </div>
                  </div>

                  {!hasEnoughBalance && (
                    <div className="flex items-center gap-2 text-destructive font-bold text-xs bg-destructive/10 border border-destructive/20 rounded-xl p-2.5 mt-2">
                      <AlertCircle className="size-4 shrink-0" />
                      <span>Saldo insuficiente para a taxa e moedas (faltam {totalRequiredMoney - userMoney} moedas)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* PERMITIR CONTRAPROPOSTAS */}
              <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-foreground block">Permitir Contrapropostas</span>
                  <span className="text-[11px] text-muted-foreground font-sans">
                    Outros treinadores poderão sugerir cartas alternativas caso não possuam a solicitada
                  </span>
                </div>
                <Switch
                  checked={allowOffers}
                  onCheckedChange={(val) => {
                    setAllowOffers(val);
                    soundFx.playCardFlip();
                  }}
                />
              </div>

              {/* BOTÃO PUBLICAR */}
              <Button
                onClick={() => createTrade()}
                disabled={
                  creatingTrade ||
                  !tradeTitle.trim() ||
                  selectedSenderCards.length === 0 ||
                  !hasEnoughBalance
                }
                className="w-full h-12 rounded-2xl font-syne font-black text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-xl shadow-amber-500/20 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
              >
                {creatingTrade ? (
                  <Loader2 className="size-4 animate-spin mr-2" />
                ) : (
                  <PlusCircle className="size-4 mr-2" />
                )}
                Publicar Oferta de Troca ({tradeFee.toLocaleString("pt-BR")} moedas)
              </Button>
            </div>
          )}
        </TabsContent>

        {/* 3. ABA: MINHAS TROCAS */}
        <TabsContent value="my" className="space-y-6">
          {user?.isGuest ? (
            <GuestRestrictionCard featureTitle="o Painel de Minhas Trocas" />
          ) : loadingMyTrades ? (
            <div className="py-24 flex justify-center">
              <Loader2 className="size-8 animate-spin text-amber-500" />
            </div>
          ) : myTrades.length === 0 ? (
            <div className="bg-card/40 border border-border/80 rounded-3xl p-16 text-center text-muted-foreground">
              <Clock className="size-12 mx-auto mb-3 opacity-30 text-amber-500" />
              <p className="text-lg font-bold text-foreground font-syne">Você não tem trocas ativas no momento</p>
              <p className="text-xs font-sans mt-1">Crie uma nova oferta na aba "Criar Oferta" para anunciar suas cartas.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {myTrades.map((trade) => (
                <div
                  key={trade.id}
                  className="bg-card/70 border border-border/80 rounded-3xl p-6 shadow-sm space-y-4 backdrop-blur-xs"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-base text-foreground font-syne">{trade.name}</h3>
                      <span className="text-xs text-muted-foreground font-sans">
                        Publicado em {new Date(trade.createdAt).toLocaleDateString("pt-BR")}
                      </span>
                    </div>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (confirm("Deseja cancelar esta oferta de troca? As cartas voltarão para sua coleção.")) {
                          cancelTrade(trade.id);
                        }
                      }}
                      className="rounded-xl text-xs h-9 px-4 font-bold"
                    >
                      Cancelar Oferta
                    </Button>
                  </div>

                  {/* CONTRAPROPOSTAS RECEBIDAS */}
                  {trade.offers && trade.offers.length > 0 && (
                    <div className="pt-4 border-t border-border/60">
                      <h4 className="text-xs font-bold text-foreground mb-3 flex items-center gap-2">
                        <Sparkles className="size-3.5 text-amber-400" />
                        <span>Contrapropostas Recebidas ({trade.offers.length}):</span>
                      </h4>

                      <div className="space-y-3">
                        {trade.offers.map((offer: CounterOffer) => (
                          <div
                            key={offer.id}
                            className="bg-secondary/40 border border-border/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar
                                username={offer.users?.username || "Treinador"}
                                src={offer.users?.picture}
                                className="size-9 rounded-full ring-1 ring-amber-500/30"
                              />
                              <div>
                                <span className="text-xs font-bold text-foreground block">
                                  {offer.users?.username}
                                </span>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                  {offer.trade_offer_cards.map((c, idx) => (
                                    <span
                                      key={idx}
                                      className="text-[11px] bg-card px-2.5 py-0.5 rounded-lg border border-border/80 text-foreground font-medium"
                                    >
                                      {c.cards.name}
                                    </span>
                                  ))}
                                  {offer.money > 0 && (
                                    <span className="text-xs font-mono text-amber-400 font-bold">
                                      +{offer.money.toLocaleString("pt-BR")} moedas
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <Button
                              size="sm"
                              onClick={() => acceptCounterOffer(offer.id)}
                              disabled={acceptingCounter}
                              className="h-9 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold font-syne cursor-pointer"
                            >
                              Aceitar Proposta
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* 4. ABA: HISTÓRICO */}
        <TabsContent value="history" className="space-y-4">
          {loadingHistory ? (
            <div className="py-24 flex justify-center">
              <Loader2 className="size-8 animate-spin text-amber-500" />
            </div>
          ) : tradeHistory.length === 0 ? (
            <div className="bg-card/40 border border-border/80 rounded-3xl p-16 text-center text-muted-foreground">
              <History className="size-12 mx-auto mb-3 opacity-30 text-amber-500" />
              <p className="text-lg font-bold text-foreground font-syne">Nenhuma troca concluída ainda</p>
              <p className="text-xs font-sans mt-1">Suas negociações finalizadas com outros jogadores serão listadas aqui.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tradeHistory.map((h) => (
                <div
                  key={h.id}
                  className="bg-card/70 border border-border/80 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="size-5 text-emerald-500 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-foreground">{h.name}</p>
                      <span className="text-xs text-muted-foreground font-sans">
                        {h.iWasCreator
                          ? `Você negociou com ${h.acceptor?.username}`
                          : `Você aceitou a troca de ${h.creator?.username}`}
                      </span>
                    </div>
                  </div>

                  <span className="text-xs text-muted-foreground font-mono">
                    Concluída em {new Date(h.updatedAt || h.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* MODAL DE CONFIRMAÇÃO DE ACEITE DIRETO (ANIMAÇÃO TÁTIL) */}
      <Dialog open={Boolean(confirmAcceptTrade)} onOpenChange={(open) => !open && setConfirmAcceptTrade(null)}>
        <DialogContent className="max-w-lg bg-card/95 border-border/80 backdrop-blur-xl font-syne p-6 sm:p-7 rounded-3xl">
          <DialogHeader className="text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold font-mono mb-1 w-fit">
              <ArrowLeftRight className="size-3.5" />
              <span>Confirmar Negociação P2P</span>
            </div>
            <DialogTitle className="text-xl font-black text-foreground">
              Finalizar Troca de Cartas
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-sans">
              Você está prestes a concluir a troca "{confirmAcceptTrade?.name}" com {confirmAcceptTrade?.creator?.username}.
            </DialogDescription>
          </DialogHeader>

          {confirmAcceptTrade && (
            <div className="space-y-4 my-3 font-sans text-xs">
              <div className="bg-secondary/40 border border-border/60 p-4 rounded-2xl space-y-3">
                {/* O QUE VOCÊ RECEBERÁ */}
                <div>
                  <span className="text-emerald-400 font-bold block mb-1.5 font-mono text-[11px] uppercase tracking-wider">
                    ✓ Você Receberá:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {confirmAcceptTrade.offeredCards.map((c) => (
                      <span key={c.id} className="text-xs bg-card px-2.5 py-1 rounded-lg border border-emerald-500/40 text-foreground font-bold">
                        {c.name} (★{c.rarity})
                      </span>
                    ))}
                    {confirmAcceptTrade.moneySending > 0 && (
                      <span className="text-xs bg-amber-500/20 border border-amber-500/40 text-amber-400 font-mono font-bold px-2.5 py-1 rounded-lg">
                        +{confirmAcceptTrade.moneySending.toLocaleString("pt-BR")} moedas
                      </span>
                    )}
                  </div>
                </div>

                {/* O QUE VOCÊ ENTREGARÁ */}
                <div className="pt-3 border-t border-border/60">
                  <span className="text-rose-400 font-bold block mb-1.5 font-mono text-[11px] uppercase tracking-wider">
                    ⇄ Você Entregará:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {confirmAcceptTrade.requestedCards.map((c) => (
                      <span key={c.id} className="text-xs bg-card px-2.5 py-1 rounded-lg border border-border/80 text-foreground font-medium">
                        {c.name}
                      </span>
                    ))}
                    {confirmAcceptTrade.moneyReceiving > 0 && (
                      <span className="text-xs bg-amber-500/20 border border-amber-500/40 text-amber-400 font-mono font-bold px-2.5 py-1 rounded-lg">
                        -{confirmAcceptTrade.moneyReceiving.toLocaleString("pt-BR")} moedas
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <Button
                onClick={() => acceptTrade(confirmAcceptTrade.id)}
                disabled={acceptingTrade}
                className="w-full h-12 rounded-2xl font-syne font-black text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-xl shadow-emerald-600/20 cursor-pointer"
              >
                {acceptingTrade ? (
                  <Loader2 className="size-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle2 className="size-4 mr-2" />
                )}
                Confirmar e Concluir Troca Agora
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL DE CONTRAPROPOSTA INTERATIVA */}
      <Dialog open={Boolean(offerTradeTarget)} onOpenChange={(open) => !open && setOfferTradeTarget(null)}>
        <DialogContent className="max-w-xl bg-card/95 border-border/80 backdrop-blur-xl font-syne p-6 sm:p-7 rounded-3xl">
          <DialogHeader className="text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-400 text-xs font-bold font-mono mb-1 w-fit">
              <Sparkles className="size-3.5" />
              <span>Contraproposta P2P</span>
            </div>
            <DialogTitle className="text-xl font-black text-foreground">
              Sugerir Acordo Alternativo
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground font-sans">
              Ofereça cartas do seu inventário de trocas e moedas ao criador da oferta "{offerTradeTarget?.name}".
            </DialogDescription>
          </DialogHeader>

          {offerTradeTarget && (
            <div className="space-y-4 my-2">
              <p className="text-xs font-bold text-foreground font-sans">
                Selecione as cartas que deseja oferecer em contrapartida:
              </p>

              {myInventory.length === 0 ? (
                <div className="p-6 rounded-2xl border border-dashed text-center text-xs text-muted-foreground">
                  Você não possui cartas marcadas para troca no seu binder.
                </div>
              ) : (
                <div className="max-h-56 overflow-y-auto p-3 bg-secondary/30 rounded-2xl border border-border/40 grid grid-cols-4 sm:grid-cols-6 gap-2.5">
                  {myInventory.map((item) => {
                    const card = item.Card || item;
                    const isSelected = offerSelectedCards.includes(card.id);
                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          soundFx.playCardFlip();
                          if (isSelected) {
                            setOfferSelectedCards(offerSelectedCards.filter((id) => id !== card.id));
                          } else {
                            setOfferSelectedCards([...offerSelectedCards, card.id]);
                          }
                        }}
                        className={`relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all duration-200 aspect-[2.5/3.5] ${
                          isSelected
                            ? "border-purple-500 ring-2 ring-purple-500/50 scale-95 shadow-md shadow-purple-500/20"
                            : "border-border/60 hover:border-border hover:scale-105"
                        }`}
                      >
                        <img
                          src={loadTcgImg(card.image_url)}
                          alt={card.name}
                          className="w-full h-full object-cover"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-purple-500/30 flex items-center justify-center backdrop-blur-xs">
                            <Check className="size-5 text-white font-black stroke-[3]" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex items-center gap-3 font-sans text-xs">
                <span className="text-muted-foreground">Moedas adicionais para o criador:</span>
                <Input
                  type="number"
                  min={0}
                  value={offerMoney}
                  onChange={(e) => setOfferMoney(Math.max(0, Number(e.target.value)))}
                  className="w-32 h-10 rounded-xl font-mono text-xs bg-secondary/40"
                  placeholder="0 moedas"
                />
              </div>

              <Button
                onClick={() => sendCounterOffer()}
                disabled={sendingOffer || (offerSelectedCards.length === 0 && offerMoney <= 0)}
                className="w-full h-12 rounded-2xl font-syne font-black text-sm bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-xl shadow-purple-600/20 cursor-pointer mt-2"
              >
                {sendingOffer ? (
                  <Loader2 className="size-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="size-4 mr-2" />
                )}
                Enviar Contraproposta ao Criador
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL DE INSPEÇÃO DA CARTA 3D */}
      <CardDetailModal
        card={inspectCard}
        isOpen={Boolean(inspectCard)}
        onClose={() => setInspectCard(null)}
      />

      {/* CHAT PRIVADO COM TREINADOR */}
      <ChatDialog
        friend={chatFriend}
        isOpen={Boolean(chatFriend)}
        onClose={() => setChatFriend(null)}
      />

      <UpgradeAccountModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
    </div>
  );
}