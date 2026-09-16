"use client";

import React, { useState } from "react";
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
  Filter,
  ArrowRight,
  CheckCircle,
  Coins,
  Sparkles,
  Layers,
  Check,
  X,
  Loader2,
  AlertCircle,
  MessageSquare,
} from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { loadTcgImg } from "@/lib/load-tcg-img";
import { soundFx } from "@/lib/sound-fx";
import { CardDetailModal, CardModalData } from "@/components/card-detail-modal";
import { ChatDialog } from "@/components/chat-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface TradeCardItem {
  id: number;
  card_id: string;
  name: string;
  image_url: string;
  rarity: number;
  hp: number;
  type: string;
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

export default function TrocasPage() {
  const { get, post, delete: del } = useApi();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Navigation & Filter states
  const [activeTab, setActiveTab] = useState("market");
  const [searchQuery, setSearchQuery] = useState("");
  const [canFulfillOnly, setCanFulfillOnly] = useState(false);
  const [minRarityFilter, setMinRarityFilter] = useState<string>("all");

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

  // 1. Query: Feed de Trocas do Mercado
  const { data: marketData, isLoading: loadingMarket } = useQuery<{
    trades: TradeListing[];
    pagination: { totalCount: number };
  }>({
    queryKey: ["trades", searchQuery, canFulfillOnly, minRarityFilter],
    queryFn: async () => {
      let url = `/trades?search=${encodeURIComponent(searchQuery)}&canFulfill=${canFulfillOnly}`;
      if (minRarityFilter !== "all") {
        url += `&minRarity=${minRarityFilter}`;
      }
      const res = await get(url);
      return res.data.data;
    },
    refetchInterval: 12000,
  });

  // 2. Query: Meu Inventário para Seleção de Cartas
  const { data: myInventory = [] } = useQuery<any[]>({
    queryKey: ["my-inventory-cards"],
    queryFn: async () => {
      const res = await get("/card/my");
      return res.data.data ?? [];
    },
  });

  // 3. Query: Catálogo Geral de Cartas para Escolha do que Quer Receber
  const { data: catalogCards = [] } = useQuery<TradeCardItem[]>({
    queryKey: ["catalog-search", catalogSearch],
    queryFn: async () => {
      if (!catalogSearch.trim() || catalogSearch.trim().length < 2) return [];
      const res = await get(`/card/search?query=${encodeURIComponent(catalogSearch.trim())}`);
      return res.data.data ?? [];
    },
    enabled: catalogSearch.trim().length >= 2,
  });

  // 4. Query: Minhas Trocas Ativas
  const { data: myTrades = [], isLoading: loadingMyTrades } = useQuery<any[]>({
    queryKey: ["my-trades"],
    queryFn: async () => {
      const res = await get("/trades/my");
      return res.data.data ?? [];
    },
  });

  // 5. Query: Histórico de Trocas Concluídas
  const { data: tradeHistory = [], isLoading: loadingHistory } = useQuery<any[]>({
    queryKey: ["trade-history"],
    queryFn: async () => {
      const res = await get("/trades/my/history");
      return res.data.data ?? [];
    },
  });

  // MUTAÇÕES
  const { mutate: createTrade, isPending: creatingTrade } = useMutation({
    mutationFn: async () => {
      const payload = {
        name: tradeTitle.trim(),
        description: tradeDesc.trim(),
        sender_cards: selectedSenderCards,
        receiver_cards: selectedReceiverCards,
        moneySending: sendMoney,
        moneyReceiving: receiveMoney,
        acceptOffers: allowOffers,
      };
      const res = await post("/trades", payload);
      return res.data;
    },
    onSuccess: () => {
      soundFx.playSuccess();
      toast({ title: "Troca publicada com sucesso!", description: "Sua oferta está visível no mercado." });
      setTradeTitle("");
      setTradeDesc("");
      setSelectedSenderCards([]);
      setSelectedReceiverCards([]);
      setSendMoney(0);
      setReceiveMoney(0);
      setActiveTab("market");
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      queryClient.invalidateQueries({ queryKey: ["my-trades"] });
    },
    onError: (err: any) => {
      toast({
        title: "Erro ao criar troca",
        description: err.response?.data?.toast || "Verifique as cartas e dados informados.",
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
      soundFx.playLegendaryFanfare();
      toast({ title: "Troca concluída!", description: "As cartas e moedas foram transferidas para o seu inventário!" });
      setConfirmAcceptTrade(null);
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["cards"] });
      queryClient.invalidateQueries({ queryKey: ["trade-history"] });
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
      toast({ title: "Contraproposta enviada!", description: "O criador da troca foi notificado da sua oferta." });
      setOfferTradeTarget(null);
      setOfferSelectedCards([]);
      setOfferMoney(0);
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
      soundFx.playLegendaryFanfare();
      toast({ title: "Contraproposta aceita!", description: "Troca finalizada com sucesso." });
      queryClient.invalidateQueries({ queryKey: ["my-trades"] });
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
      queryClient.invalidateQueries({ queryKey: ["cards"] });
    },
  });

  const { mutate: cancelTrade } = useMutation({
    mutationFn: async (tradeId: number) => {
      await del(`/trades/${tradeId}`);
    },
    onSuccess: () => {
      toast({ title: "Troca cancelada com sucesso" });
      queryClient.invalidateQueries({ queryKey: ["my-trades"] });
      queryClient.invalidateQueries({ queryKey: ["trades"] });
    },
  });

  const trades = marketData?.trades || [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl font-syne">
      {/* Header Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-border">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold mb-1.5">
            <RefreshCw className="size-3.5 text-primary" />
            <span>Mercado P2P</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Sistema de Trocas TCG
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1 max-w-2xl">
            Troque cartas com outros jogadores, anuncie o que procura e faça propostas inteligentes para completar sua coleção.
          </p>
        </div>

        <Button
          onClick={() => setActiveTab("create")}
          className="rounded-xl h-11 px-5 font-bold shadow-sm gap-2"
        >
          <PlusCircle className="size-4" /> Criar Nova Oferta
        </Button>
      </div>

      {/* Tabs de Navegação */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 w-full sm:w-[600px] h-11 rounded-xl p-1 bg-accent/50 mb-6">
          <TabsTrigger value="market" className="rounded-lg text-xs gap-1.5 data-[state=active]:bg-background">
            <RefreshCw className="size-3.5" /> Mercado
          </TabsTrigger>
          <TabsTrigger value="create" className="rounded-lg text-xs gap-1.5 data-[state=active]:bg-background">
            <PlusCircle className="size-3.5" /> Criar Oferta
          </TabsTrigger>
          <TabsTrigger value="my" className="rounded-lg text-xs gap-1.5 data-[state=active]:bg-background relative">
            <Clock className="size-3.5" /> Minhas ({myTrades.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-lg text-xs gap-1.5 data-[state=active]:bg-background">
            <History className="size-3.5" /> Histórico
          </TabsTrigger>
        </TabsList>

        {/* 1. ABA: MERCADO PÚBLICO */}
        <TabsContent value="market" className="space-y-6">
          {/* Filtros e Barra de Busca */}
          <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por carta ou nome da troca..."
                className="pl-10 h-11 rounded-xl text-xs font-sans"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-2 bg-accent/40 px-3 py-2 rounded-xl border border-border/40">
                <Switch
                  id="can-fulfill"
                  checked={canFulfillOnly}
                  onCheckedChange={setCanFulfillOnly}
                />
                <Label htmlFor="can-fulfill" className="text-xs cursor-pointer select-none">
                  Apenas as que posso aceitar
                </Label>
              </div>

              <select
                value={minRarityFilter}
                onChange={(e) => setMinRarityFilter(e.target.value)}
                className="h-11 rounded-xl bg-accent/40 border border-border/40 text-xs px-3 font-sans outline-hidden"
              >
                <option value="all">Todas as Raridades</option>
                <option value="2">Rara ou superior (★ 2+)</option>
                <option value="3">Épica ou superior (★ 3+)</option>
                <option value="4">Lendária (★ 4+)</option>
              </select>
            </div>
          </div>

          {/* Lista de Trocas */}
          {loadingMarket ? (
            <div className="py-24 flex justify-center">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : trades.length === 0 ? (
            <div className="bg-card border border-border/80 rounded-2xl p-16 text-center text-muted-foreground">
              <RefreshCw className="size-10 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-bold">Nenhuma troca encontrada</p>
              <p className="text-xs mt-1">Tente ajustar seus filtros ou crie sua própria oferta!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {trades.map((trade) => (
                <div
                  key={trade.id}
                  className={`bg-card border rounded-2xl p-5 shadow-sm transition-all duration-300 hover:shadow-md flex flex-col justify-between ${
                    trade.canFulfill
                      ? "border-emerald-500/40 bg-emerald-500/[0.02]"
                      : "border-border/80"
                  }`}
                >
                  <div>
                    {/* Header do Card de Troca */}
                    <div className="flex items-center justify-between gap-3 mb-3 pb-3 border-b border-border/60">
                      <div className="flex items-center gap-2.5">
                        <Avatar
                          username={trade.creator?.username || "Treinador"}
                          src={trade.creator?.picture}
                          className="size-8"
                        />
                        <div>
                          <h3 className="font-bold text-sm text-foreground leading-tight">{trade.name}</h3>
                          <span className="text-[11px] text-muted-foreground font-sans">
                            por {trade.creator?.username} • {new Date(trade.createdAt).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {trade.canFulfill && (
                          <Badge className="bg-emerald-600 text-white text-[10px] font-bold">
                            Disponível para você!
                          </Badge>
                        )}
                        {trade.creator && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-7 rounded-lg"
                            title="Conversar"
                            onClick={() => setChatFriend(trade.creator)}
                          >
                            <MessageSquare className="size-3.5 text-blue-400" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {trade.description && (
                      <p className="text-xs text-muted-foreground font-sans mb-4 italic">
                        "{trade.description}"
                      </p>
                    )}

                    {/* Comparativo de Troca: Ofertado vs Solicitado */}
                    <div className="grid grid-cols-2 gap-3 mb-4 bg-accent/20 p-3 rounded-xl border border-border/40">
                      {/* O que o criador oferece */}
                      <div>
                        <span className="text-[11px] font-bold text-emerald-500 uppercase tracking-wider block mb-2">
                          Oferece:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {trade.offeredCards.map((c) => (
                            <div
                              key={c.id}
                              onClick={() => setInspectCard(c)}
                              className="relative group cursor-pointer"
                              title={`${c.name} (★ Tier ${c.rarity})`}
                            >
                              <img
                                src={loadTcgImg(c.image_url)}
                                alt={c.name}
                                className="w-14 h-20 object-cover rounded-lg border border-border group-hover:scale-105 transition-transform"
                              />
                              <Badge className="absolute -bottom-1 -right-1 text-[9px] px-1 py-0 bg-black/80 font-mono">
                                ★{c.rarity}
                              </Badge>
                            </div>
                          ))}
                        </div>
                        {trade.moneySending > 0 && (
                          <div className="flex items-center gap-1 mt-2 text-xs font-mono font-bold text-amber-500">
                            <Coins className="size-3.5" /> +{trade.moneySending} moedas
                          </div>
                        )}
                      </div>

                      {/* O que o criador deseja receber */}
                      <div>
                        <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider block mb-2">
                          Pede em troca:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {trade.requestedCards.length === 0 ? (
                            <span className="text-xs text-muted-foreground font-sans italic">
                              Qualquer carta conforme critério
                            </span>
                          ) : (
                            trade.requestedCards.map((c) => (
                              <div
                                key={c.id}
                                onClick={() => setInspectCard(c)}
                                className="relative group cursor-pointer"
                                title={`${c.name} (★ Tier ${c.rarity})`}
                              >
                                <img
                                src={loadTcgImg(c.image_url)}
                                alt={c.name}
                                className="w-14 h-20 object-cover rounded-lg border border-border group-hover:scale-105 transition-transform"
                              />
                                <Badge className="absolute -bottom-1 -right-1 text-[9px] px-1 py-0 bg-black/80 font-mono">
                                  ★{c.rarity}
                                </Badge>
                              </div>
                            ))
                          )}
                        </div>
                        {trade.moneyReceiving > 0 && (
                          <div className="flex items-center gap-1 mt-2 text-xs font-mono font-bold text-amber-500">
                            <Coins className="size-3.5" /> +{trade.moneyReceiving} moedas
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Ações da Troca */}
                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-border/60">
                    <span className="text-[11px] text-muted-foreground font-sans">
                      {trade.acceptOffers ? "Aceita contrapropostas" : "Troca direta 1x1"}
                    </span>

                    <div className="flex items-center gap-2">
                      {trade.isCreator ? (
                        <Badge variant="outline" className="text-xs">
                          Sua Oferta
                        </Badge>
                      ) : (
                        <>
                          {trade.acceptOffers && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setOfferTradeTarget(trade);
                                setOfferSelectedCards([]);
                                setOfferMoney(0);
                              }}
                              className="text-xs h-9 rounded-xl"
                            >
                              Fazer Proposta
                            </Button>
                          )}

                          <Button
                            size="sm"
                            disabled={!trade.canFulfill}
                            onClick={() => setConfirmAcceptTrade(trade)}
                            className={`text-xs h-9 rounded-xl font-bold ${
                              trade.canFulfill
                                ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                                : ""
                            }`}
                          >
                            <CheckCircle className="size-3.5 mr-1" />
                            {trade.canFulfill ? "Aceitar Troca" : "Faltam Itens"}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* 2. ABA: CRIAR OFERTA */}
        <TabsContent value="create" className="space-y-6 max-w-3xl mx-auto">
          <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-sm space-y-5">
            <div>
              <h2 className="text-xl font-bold text-foreground">Configurar Nova Troca</h2>
              <p className="text-xs text-muted-foreground font-sans mt-0.5">
                Defina o que você está disposto a ceder e o que gostaria de receber.
              </p>
            </div>

            {/* Título & Descrição */}
            <div className="space-y-3 font-sans text-xs">
              <div>
                <label className="font-semibold text-foreground block mb-1">Título do Anúncio:</label>
                <Input
                  value={tradeTitle}
                  onChange={(e) => setTradeTitle(e.target.value)}
                  placeholder="Ex: Troco Charizard por Blastoise ou Venussaur"
                  className="rounded-xl h-10 font-syne text-sm"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">Observações / Descrição:</label>
                <Input
                  value={tradeDesc}
                  onChange={(e) => setTradeDesc(e.target.value)}
                  placeholder="Ex: Aceito contrapropostas com cartas de água"
                  className="rounded-xl h-10"
                />
              </div>
            </div>

            {/* 1. SELEÇÃO DO QUE OFEREÇO */}
            <div className="pt-3 border-t border-border/60">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <Layers className="size-4 text-emerald-500" /> 1. O que você está ofertando:
                </span>
                <span className="text-xs text-muted-foreground font-sans">
                  {selectedSenderCards.length} carta(s) selecionada(s)
                </span>
              </div>

              <div className="max-h-56 overflow-y-auto p-2 bg-accent/20 rounded-xl border border-border/40 grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {myInventory.map((item) => {
                  const card = item.Card || item;
                  const isSelected = selectedSenderCards.includes(card.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedSenderCards(selectedSenderCards.filter((id) => id !== card.id));
                        } else {
                          setSelectedSenderCards([...selectedSenderCards, card.id]);
                        }
                      }}
                      className={`relative rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                        isSelected
                          ? "border-primary ring-2 ring-primary/40 scale-95"
                          : "border-transparent hover:border-border"
                      }`}
                    >
                      <img
                        src={loadTcgImg(card.image_url)}
                        alt={card.name}
                        className="w-full aspect-[2.5/3.5] object-cover"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
                          <Check className="size-5 text-white font-black" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-sans">Incluir moedas na oferta:</span>
                <Input
                  type="number"
                  min={0}
                  value={sendMoney}
                  onChange={(e) => setSendMoney(Math.max(0, Number(e.target.value)))}
                  className="w-32 h-9 rounded-xl font-mono text-xs"
                  placeholder="0 moedas"
                />
              </div>
            </div>

            {/* 2. SELEÇÃO DO QUE DESEJA RECEBER */}
            <div className="pt-3 border-t border-border/60">
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <Sparkles className="size-4 text-blue-400" /> 2. O que você deseja receber:
                </span>
                <span className="text-xs text-muted-foreground font-sans">
                  {selectedReceiverCards.length} carta(s) selecionada(s)
                </span>
              </div>

              {/* Busca no catálogo */}
              <div className="relative mb-2">
                <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder="Buscar no catálogo pelo nome da carta (ex: Pikachu, Mew)..."
                  className="pl-9 h-9 rounded-xl text-xs font-sans"
                />
              </div>

              {catalogCards.length > 0 && (
                <div className="max-h-48 overflow-y-auto p-2 bg-accent/20 rounded-xl border border-border/40 grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 mb-3">
                  {catalogCards.map((card) => {
                    const isSelected = selectedReceiverCards.includes(card.id);
                    return (
                      <div
                        key={card.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedReceiverCards(selectedReceiverCards.filter((id) => id !== card.id));
                          } else {
                            setSelectedReceiverCards([...selectedReceiverCards, card.id]);
                          }
                        }}
                        className={`relative rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                          isSelected
                            ? "border-blue-500 ring-2 ring-blue-500/40 scale-95"
                            : "border-transparent hover:border-border"
                        }`}
                      >
                        <img
                          src={loadTcgImg(card.image_url)}
                          alt={card.name}
                          className="w-full aspect-[2.5/3.5] object-cover"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-blue-500/30 flex items-center justify-center">
                            <Check className="size-5 text-white font-black" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground font-sans">Pedir moedas na troca:</span>
                <Input
                  type="number"
                  min={0}
                  value={receiveMoney}
                  onChange={(e) => setReceiveMoney(Math.max(0, Number(e.target.value)))}
                  className="w-32 h-9 rounded-xl font-mono text-xs"
                  placeholder="0 moedas"
                />
              </div>
            </div>

            {/* Opções extras */}
            <div className="pt-3 border-t border-border/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-foreground block">Permitir Contrapropostas</span>
                <span className="text-[11px] text-muted-foreground font-sans">
                  Outros jogadores poderão sugerir cartas alternativas
                </span>
              </div>
              <Switch checked={allowOffers} onCheckedChange={setAllowOffers} />
            </div>

            <Button
              onClick={() => createTrade()}
              disabled={creatingTrade || !tradeTitle.trim() || selectedSenderCards.length === 0}
              className="w-full h-11 rounded-xl font-bold bg-primary text-primary-foreground text-sm shadow-md mt-4"
            >
              {creatingTrade ? (
                <Loader2 className="size-4 animate-spin mr-2" />
              ) : (
                <PlusCircle className="size-4 mr-2" />
              )}
              Publicar Troca no Mercado
            </Button>
          </div>
        </TabsContent>

        {/* 3. ABA: MINHAS TROCAS */}
        <TabsContent value="my" className="space-y-6">
          {loadingMyTrades ? (
            <div className="py-24 flex justify-center">
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : myTrades.length === 0 ? (
            <div className="bg-card border border-border/80 rounded-2xl p-16 text-center text-muted-foreground">
              <Clock className="size-10 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-bold">Você não tem trocas ativas</p>
              <p className="text-xs mt-1">Crie uma nova oferta na aba "Criar Oferta".</p>
            </div>
          ) : (
            <div className="space-y-6">
              {myTrades.map((trade) => (
                <div
                  key={trade.id}
                  className="bg-card border border-border/80 rounded-2xl p-5 shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-base text-foreground">{trade.name}</h3>
                      <span className="text-xs text-muted-foreground font-sans">
                        Publicado em {new Date(trade.createdAt).toLocaleDateString("pt-BR")}
                      </span>
                    </div>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (confirm("Deseja cancelar esta oferta de troca?")) {
                          cancelTrade(trade.id);
                        }
                      }}
                      className="rounded-xl text-xs h-8"
                    >
                      Cancelar Troca
                    </Button>
                  </div>

                  {/* Propostas Recebidas nesta troca */}
                  {trade.offers && trade.offers.length > 0 && (
                    <div className="pt-3 border-t border-border/60">
                      <h4 className="text-xs font-bold text-foreground mb-3 flex items-center gap-1.5">
                        <Sparkles className="size-3.5 text-amber-400" /> Contrapropostas Recebidas ({trade.offers.length}):
                      </h4>

                      <div className="space-y-2">
                        {trade.offers.map((offer: CounterOffer) => (
                          <div
                            key={offer.id}
                            className="bg-accent/30 border border-border/40 rounded-xl p-3 flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar
                                username={offer.users?.username || "Treinador"}
                                src={offer.users?.picture}
                                className="size-8"
                              />
                              <div>
                                <span className="text-xs font-bold text-foreground">{offer.users?.username}</span>
                                <div className="flex items-center gap-2 mt-1">
                                  {offer.trade_offer_cards.map((c, idx) => (
                                    <span key={idx} className="text-[11px] bg-card px-2 py-0.5 rounded-md border text-muted-foreground">
                                      {c.cards.name}
                                    </span>
                                  ))}
                                  {offer.money > 0 && (
                                    <span className="text-xs font-mono text-amber-500 font-bold">
                                      +{offer.money} moedas
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <Button
                              size="sm"
                              onClick={() => acceptCounterOffer(offer.id)}
                              disabled={acceptingCounter}
                              className="h-8 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold"
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
              <Loader2 className="size-8 animate-spin text-primary" />
            </div>
          ) : tradeHistory.length === 0 ? (
            <div className="bg-card border border-border/80 rounded-2xl p-16 text-center text-muted-foreground">
              <History className="size-10 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-bold">Nenhuma troca concluída ainda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tradeHistory.map((h) => (
                <div
                  key={h.id}
                  className="bg-card border border-border/80 rounded-xl p-4 flex items-center justify-between gap-4 shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle className="size-5 text-emerald-500 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-foreground">{h.name}</p>
                      <span className="text-xs text-muted-foreground font-sans">
                        {h.iWasCreator ? `Você trocou com ${h.acceptor?.username}` : `Você aceitou a troca de ${h.creator?.username}`}
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

      {/* Modal de Confirmação de Aceite Direto */}
      <Dialog open={Boolean(confirmAcceptTrade)} onOpenChange={(open) => !open && setConfirmAcceptTrade(null)}>
        <DialogContent className="max-w-md bg-card/95 border-border backdrop-blur-xl font-syne p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <RefreshCw className="size-5 text-emerald-500" /> Confirmar Troca
            </DialogTitle>
          </DialogHeader>

          {confirmAcceptTrade && (
            <div className="space-y-4 pt-2 font-sans text-xs">
              <p className="text-muted-foreground">
                Você está prestes a realizar a troca <b>"{confirmAcceptTrade.name}"</b> com <b>{confirmAcceptTrade.creator?.username}</b>.
              </p>

              <div className="bg-accent/30 p-3 rounded-xl space-y-2 border border-border/60">
                <p className="font-semibold text-emerald-500">Você receberá:</p>
                <div className="flex flex-wrap gap-1">
                  {confirmAcceptTrade.offeredCards.map((c) => (
                    <Badge key={c.id} variant="outline" className="text-xs font-mono">{c.name}</Badge>
                  ))}
                  {confirmAcceptTrade.moneySending > 0 && (
                    <Badge className="bg-amber-500/20 text-amber-500 font-mono">+{confirmAcceptTrade.moneySending} moedas</Badge>
                  )}
                </div>

                <p className="font-semibold text-red-400 mt-2">Você entregará:</p>
                <div className="flex flex-wrap gap-1">
                  {confirmAcceptTrade.requestedCards.map((c) => (
                    <Badge key={c.id} variant="outline" className="text-xs font-mono">{c.name}</Badge>
                  ))}
                  {confirmAcceptTrade.moneyReceiving > 0 && (
                    <Badge className="bg-amber-500/20 text-amber-500 font-mono">-{confirmAcceptTrade.moneyReceiving} moedas</Badge>
                  )}
                </div>
              </div>

              <Button
                onClick={() => acceptTrade(confirmAcceptTrade.id)}
                disabled={acceptingTrade}
                className="w-full h-11 rounded-xl font-syne font-bold bg-emerald-600 hover:bg-emerald-500 text-white mt-2"
              >
                {acceptingTrade ? <Loader2 className="size-4 animate-spin mr-2" /> : <CheckCircle className="size-4 mr-2" />}
                Confirmar e Finalizar Troca
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Envio de Contraproposta */}
      <Dialog open={Boolean(offerTradeTarget)} onOpenChange={(open) => !open && setOfferTradeTarget(null)}>
        <DialogContent className="max-w-lg bg-card/95 border-border backdrop-blur-xl font-syne p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Sparkles className="size-5 text-amber-400" /> Enviar Contraproposta
            </DialogTitle>
          </DialogHeader>

          {offerTradeTarget && (
            <div className="space-y-4 pt-2">
              <p className="text-xs text-muted-foreground font-sans">
                Selecione as cartas do seu inventário que você deseja oferecer em contrapartida:
              </p>

              <div className="max-h-52 overflow-y-auto p-2 bg-accent/20 rounded-xl border border-border/40 grid grid-cols-4 sm:grid-cols-6 gap-2">
                {myInventory.map((item) => {
                  const card = item.Card || item;
                  const isSelected = offerSelectedCards.includes(card.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        if (isSelected) {
                          setOfferSelectedCards(offerSelectedCards.filter((id) => id !== card.id));
                        } else {
                          setOfferSelectedCards([...offerSelectedCards, card.id]);
                        }
                      }}
                      className={`relative rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                        isSelected
                          ? "border-primary ring-2 ring-primary/40 scale-95"
                          : "border-transparent hover:border-border"
                      }`}
                    >
                      <img
                        src={loadTcgImg(card.image_url)}
                        alt={card.name}
                        className="w-full aspect-[2.5/3.5] object-cover"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-primary/30 flex items-center justify-center">
                          <Check className="size-4 text-white font-black" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center gap-2 font-sans text-xs">
                <span className="text-muted-foreground">Moedas adicionais:</span>
                <Input
                  type="number"
                  min={0}
                  value={offerMoney}
                  onChange={(e) => setOfferMoney(Math.max(0, Number(e.target.value)))}
                  className="w-32 h-9 rounded-xl font-mono text-xs"
                />
              </div>

              <Button
                onClick={() => sendCounterOffer()}
                disabled={sendingOffer || (offerSelectedCards.length === 0 && offerMoney <= 0)}
                className="w-full h-11 rounded-xl font-bold bg-primary text-primary-foreground mt-2"
              >
                {sendingOffer ? <Loader2 className="size-4 animate-spin mr-2" /> : <RefreshCw className="size-4 mr-2" />}
                Enviar Proposta para o Criador
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Detalhes da Carta */}
      <CardDetailModal
        card={inspectCard}
        isOpen={Boolean(inspectCard)}
        onClose={() => setInspectCard(null)}
      />

      {/* Chat Dialog */}
      <ChatDialog
        friend={chatFriend}
        isOpen={Boolean(chatFriend)}
        onClose={() => setChatFriend(null)}
      />
    </div>
  );
}