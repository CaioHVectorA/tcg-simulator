"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { loadTcgImg } from "@/lib/load-tcg-img";
import { TcgCardImage } from "@/components/tcg-card-image";
import { useApi } from "@/hooks/use-api";
import { soundFx } from "@/lib/sound-fx";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Heart,
  Search,
  Sparkles,
  Layers,
  ShoppingBag,
  PackageOpen,
  Filter,
  Book,
  ArrowLeftRight,
  ShieldAlert,
  Check,
  X,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AlbumView } from "@/modules/inventory/album";
import { useToast } from "@/hooks/use-toast";

export type CardItem = {
  id: number;
  name: string;
  image_url: string;
  card_id: string;
  rarity: number;
  quantity: number;
  type?: string;
  hp?: number;
  isFavorite?: boolean;
  isTradeMarked?: boolean;
};

interface CollectionProps {
  data: CardItem[];
  currentPage: number;
  totalPages: number;
  totalCards?: number;
  search?: string;
  filters?: Record<string, string>;
  isLoading?: boolean;
}

const RARITY_MAP: Record<number, { label: string; color: string }> = {
  1: { label: "Comum", color: "bg-slate-500/20 text-slate-300 border-slate-500/40" },
  2: { label: "Rara", color: "bg-blue-500/20 text-blue-400 border-blue-500/40" },
  3: { label: "Épica", color: "bg-purple-500/20 text-purple-400 border-purple-500/40" },
  4: { label: "Mística", color: "bg-amber-500/20 text-amber-400 border-amber-500/40" },
  5: { label: "Lendária", color: "bg-rose-500/20 text-rose-400 border-rose-500/40" },
};

const POKEMON_TYPES = [
  { value: "", label: "Todos os Tipos" },
  { value: "FOGO", label: "🔥 Fogo" },
  { value: "ÁGUA", label: "💧 Água" },
  { value: "GRAMA", label: "🌿 Grama" },
  { value: "ELÉTRICO", label: "⚡ Elétrico" },
  { value: "PSÍQUICO", label: "🔮 Psíquico" },
  { value: "NOTURNO", label: "🌑 Noturno" },
  { value: "LUTADOR", label: "🥊 Lutador" },
  { value: "METAL", label: "⚙️ Metal" },
  { value: "DRAGÃO", label: "🐉 Dragão" },
  { value: "INCOLOR", label: "⚪ Incolor" },
];

export function Cards({
  data = [],
  currentPage = 1,
  totalPages = 1,
  totalCards = 0,
  search = "",
  filters = {},
  isLoading = false,
}: CollectionProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { post } = useApi();
  const { toast } = useToast();

  const [selectedCard, setSelectedCard] = useState<CardItem | null>(null);
  const [searchTerm, setSearchTerm] = useState(search);
  const [currentView, setCurrentView] = useState<"cards" | "albums">("cards");

  const [favoritesList, setFavoritesList] = useState<Record<number, boolean>>(() => {
    const initial: Record<number, boolean> = {};
    data.forEach((c) => {
      if (c.isFavorite) initial[c.id] = true;
    });
    return initial;
  });

  const [tradeMarkedList, setTradeMarkedList] = useState<Record<number, boolean>>(() => {
    const initial: Record<number, boolean> = {};
    data.forEach((c) => {
      if (c.isTradeMarked) initial[c.id] = true;
    });
    return initial;
  });

  React.useEffect(() => {
    if (data && data.length > 0) {
      setFavoritesList((prev) => {
        const next = { ...prev };
        data.forEach((c) => {
          if (c.isFavorite !== undefined && next[c.id] === undefined) {
            next[c.id] = c.isFavorite;
          }
        });
        return next;
      });
      setTradeMarkedList((prev) => {
        const next = { ...prev };
        data.forEach((c) => {
          if (c.isTradeMarked !== undefined && next[c.id] === undefined) {
            next[c.id] = c.isTradeMarked;
          }
        });
        return next;
      });
    }
  }, [data]);

  const isFavoritesOnly = searchParams.get("favorites") === "true";
  const isTradeOnly = searchParams.get("tradeOnly") === "true";
  const currentRarity = searchParams.get("rarity") || "";
  const currentType = searchParams.get("type") || "";

  const updateFilters = (newParams: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");
    Object.entries(newParams).forEach(([k, v]) => {
      if (v === null || v === "") {
        params.delete(k);
      } else {
        params.set(k, v);
      }
    });
    router.push(`/colecao?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateFilters({ search: searchTerm.trim() || null });
  };

  const toggleFavorite = async (card: CardItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const currentFav = favoritesList[card.id] ?? !!card.isFavorite;
    const newFav = !currentFav;

    setFavoritesList((prev) => ({ ...prev, [card.id]: newFav }));
    if (newFav) {
      soundFx.playRareChime();
    } else {
      soundFx.playCardFlip();
    }

    try {
      await post(`/cards/favorite/${card.id}`, {});
    } catch {
      setFavoritesList((prev) => ({ ...prev, [card.id]: currentFav }));
    }
  };

  const toggleTradeMark = async (card: CardItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const currentMarked = tradeMarkedList[card.id] ?? !!card.isTradeMarked;
    const newMarked = !currentMarked;

    setTradeMarkedList((prev) => ({ ...prev, [card.id]: newMarked }));
    soundFx.playCardFlip();

    try {
      const res = await post(`/cards/toggle-trade-mark/${card.id}`, {});
      if (res?.data?.toast) {
        toast({
          title: newMarked ? "Marcada para Troca! ⇄" : "Removida da Troca",
          description: res.data.toast,
        });
      }
    } catch {
      setTradeMarkedList((prev) => ({ ...prev, [card.id]: currentMarked }));
      toast({
        title: "Erro ao atualizar troca",
        description: "Não foi possível atualizar a marcação de troca da carta.",
        variant: "destructive",
      });
    }
  };

  const buildPageUrl = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    return `/colecao?${params.toString()}`;
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-6 sm:py-10">
      <div className="container mx-auto px-4 max-w-7xl">
        <Tabs value={currentView} onValueChange={(v) => setCurrentView(v as any)} className="w-full">
          {/* Cabeçalho */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-border/60">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-xs font-semibold mb-2">
                <Layers className="size-3.5 text-amber-500" />
                <span>Coleção & Conquistas</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-bold font-syne tracking-tight">
                {currentView === "cards" ? "Sua Coleção" : "Álbuns Oficiais & Missões"}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {currentView === "cards"
                  ? `Cartas que você possui (${totalCards} no total) • Inspecione, filtre e marque cartas para trocas`
                  : "Complete os conjuntos temáticos de todas as regiões para reivindicar recompensas em ouro e XP!"}
              </p>
            </div>

            {/* Alternador de Abas */}
            <TabsList className="bg-secondary/80 border border-border p-1">
              <TabsTrigger value="cards" className="text-xs sm:text-sm font-semibold gap-2">
                <Layers className="size-4 text-primary" />
                <span>Minhas Cartas ({totalCards})</span>
              </TabsTrigger>
              <TabsTrigger value="albums" className="text-xs sm:text-sm font-semibold gap-2">
                <Book className="size-4 text-amber-500" />
                <span>Álbuns & Conquistas</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ABA: MINHAS CARTAS */}
          <TabsContent value="cards" className="mt-0 space-y-6">
            {/* Barra de Filtros Completa */}
            <div className="bg-card/70 border border-border/80 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
              {/* Linha 1: Categorias Principais (Todas, Favoritas, Para Troca) + Busca */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateFilters({ favorites: null, tradeOnly: null })}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      !isFavoritesOnly && !isTradeOnly
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow"
                        : "bg-secondary/70 text-muted-foreground hover:text-foreground border border-border"
                    }`}
                  >
                    Todas ({totalCards})
                  </button>

                  <button
                    type="button"
                    onClick={() => updateFilters({ favorites: "true", tradeOnly: null })}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isFavoritesOnly
                        ? "bg-rose-600 text-white shadow"
                        : "bg-secondary/70 text-muted-foreground hover:text-foreground border border-border"
                    }`}
                  >
                    <Heart className={`size-3.5 ${isFavoritesOnly ? "fill-white" : "text-rose-500"}`} />
                    <span>Favoritas</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateFilters({ tradeOnly: "true", favorites: null })}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isTradeOnly
                        ? "bg-teal-600 text-white shadow"
                        : "bg-secondary/70 text-muted-foreground hover:text-foreground border border-border"
                    }`}
                  >
                    <ArrowLeftRight className="size-3.5 text-teal-400" />
                    <span>Marcadas p/ Troca</span>
                  </button>
                </div>

                {/* Busca por Nome */}
                <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
                  <div className="relative flex-1 sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                    <Input
                      type="search"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Buscar por nome do Pokémon..."
                      className="pl-9 h-10 text-xs sm:text-sm bg-background border-border text-foreground"
                    />
                  </div>
                  <Button type="submit" size="sm" className="h-10 px-4 font-bold text-xs shrink-0 bg-primary text-primary-foreground hover:opacity-90">
                    Buscar
                  </Button>
                </form>
              </div>

              {/* Linha 2: Filtros de Raridade e Tipo Elemental */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/50">
                {/* Raridades */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-xs font-semibold text-muted-foreground mr-1">Raridade:</span>
                  <button
                    type="button"
                    onClick={() => updateFilters({ rarity: null })}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      !currentRarity
                        ? "bg-muted text-foreground border border-border font-extrabold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Todas
                  </button>
                  {[1, 2, 3, 4, 5].map((r) => {
                    const info = RARITY_MAP[r];
                    const active = currentRarity === String(r);
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => updateFilters({ rarity: active ? null : String(r) })}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                          active
                            ? `${info.color} ring-2 ring-primary/40 font-extrabold scale-105`
                            : "border-border/60 text-muted-foreground hover:text-foreground bg-secondary/40"
                        }`}
                      >
                        {info.label}
                      </button>
                    );
                  })}
                </div>

                {/* Tipos Elementais */}
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-muted-foreground shrink-0">Tipo:</span>
                  <select
                    value={currentType}
                    onChange={(e) => updateFilters({ type: e.target.value || null })}
                    className="h-8 px-2.5 py-0.5 rounded-lg text-xs bg-background border border-border text-foreground font-semibold cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {POKEMON_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>

                  {(currentRarity || currentType || isFavoritesOnly || isTradeOnly || search) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearchTerm("");
                        router.push("/colecao");
                      }}
                      className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <X className="size-3 mr-1" /> Limpar filtros
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Aviso Informativo sobre Trocas & Batalhas */}
            <div className="bg-teal-500/10 border border-teal-500/20 rounded-xl p-3 flex items-center gap-3 text-xs text-teal-300">
              <ArrowLeftRight className="size-4 shrink-0 text-teal-400" />
              <span>
                <strong>Sistema de Trocas Ativo:</strong> Apenas cartas marcadas para troca aparecem na criação de ofertas no Mercado. Cartas marcadas para troca <u>não poderão ser usadas em decks de batalha</u> futuros.
              </span>
            </div>

            {/* Loading Skeleton ou Empty State */}
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 mb-10">
                {Array.from({ length: 18 }).map((_, i) => (
                  <div key={i} className="rounded-2xl overflow-hidden bg-card/80 border border-border/70 p-2 space-y-2 animate-pulse">
                    <div className="aspect-[2.5/3.5] rounded-xl bg-zinc-900/10 dark:bg-zinc-50/10 w-full" />
                    <div className="h-4 bg-zinc-900/10 dark:bg-zinc-50/10 rounded-md w-3/4 mx-auto" />
                    <div className="h-3 bg-zinc-900/10 dark:bg-zinc-50/10 rounded-md w-1/2 mx-auto" />
                  </div>
                ))}
              </div>
            ) : data.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-md mx-auto">
                {isTradeOnly ? (
                  <>
                    <div className="size-20 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center mb-4">
                      <ArrowLeftRight className="size-10 text-teal-400" />
                    </div>
                    <h3 className="text-xl font-bold font-syne mb-2">Nenhuma carta marcada para troca</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-6">
                      Você ainda não marcou nenhuma carta para troca. Clique em qualquer carta da sua coleção e selecione "Marcar para Troca"!
                    </p>
                    <Button
                      onClick={() => updateFilters({ tradeOnly: null })}
                      variant="outline"
                      className="gap-2 font-semibold text-xs text-foreground"
                    >
                      <Filter className="size-4" /> Ver Todas as Minhas Cartas
                    </Button>
                  </>
                ) : isFavoritesOnly ? (
                  <>
                    <div className="size-20 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4">
                      <Heart className="size-10 text-rose-500 animate-pulse" />
                    </div>
                    <h3 className="text-xl font-bold font-syne mb-2">Nenhuma favorita ainda</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-6">
                      Você ainda não favoritou nenhuma carta. Clique no ícone de coração sobre as suas cartas para fixá-las aqui!
                    </p>
                    <Button
                      onClick={() => updateFilters({ favorites: null })}
                      variant="outline"
                      className="gap-2 font-semibold text-xs text-foreground"
                    >
                      <Filter className="size-4" /> Ver Todas as Minhas Cartas
                    </Button>
                  </>
                ) : search || currentRarity || currentType ? (
                  <>
                    <div className="size-20 rounded-full bg-secondary border border-border flex items-center justify-center mb-4">
                      <Search className="size-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-bold font-syne mb-2">Nenhum Pokémon encontrado</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-6">
                      Não encontramos nenhuma carta que combine com seus filtros de busca atuais.
                    </p>
                    <Button
                      onClick={() => {
                        setSearchTerm("");
                        router.push("/colecao");
                      }}
                      variant="outline"
                      className="text-xs font-semibold text-foreground"
                    >
                      Limpar Filtros
                    </Button>
                  </>
                ) : (
                  <>
                    <div className="size-24 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-5">
                      <PackageOpen className="size-12 text-amber-500" />
                    </div>
                    <h3 className="text-2xl font-bold font-syne mb-2">Seu deck está vazio!</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-6 leading-relaxed">
                      Você ainda não possui cartas na sua coleção. Adquira pacotes na loja ou complete missões diárias para abrir seus primeiros boosters!
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
                      <Button asChild className="gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold font-sans">
                        <Link href="/loja">
                          <ShoppingBag className="size-4" /> Ir para a Loja de Pacotes
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="font-semibold text-xs text-foreground">
                        <Link href="/missoes">
                          <Sparkles className="size-4 mr-1 text-amber-500" /> Ver Missões
                        </Link>
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ) : null}

            {/* Grid de Cartas */}
            {!isLoading && data.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 mb-10">
                {data.map((card) => {
                  const isFav = favoritesList[card.id] ?? !!card.isFavorite;
                  const isTrade = tradeMarkedList[card.id] ?? !!card.isTradeMarked;
                  const rarityInfo = RARITY_MAP[card.rarity] || {
                    label: "Comum",
                    color: "bg-slate-500/20 text-slate-300 border-slate-500/40",
                  };

                  return (
                    <div
                      key={card.id}
                      onClick={() => setSelectedCard(card)}
                      className="group relative rounded-2xl overflow-hidden bg-card/80 border border-border/70 hover:border-amber-500/50 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col cursor-pointer"
                    >
                      {/* Badge de Quantidade */}
                      {card.quantity > 1 && (
                        <div className="absolute top-2 left-2 z-20 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-xs border border-white/20 text-white font-mono font-bold text-[10px] shadow">
                          x{card.quantity}
                        </div>
                      )}

                      {/* Badge de Marcada para Troca */}
                      {isTrade && (
                        <div
                          className={`absolute ${card.quantity > 1 ? "top-7" : "top-2"} left-2 z-20 px-2 py-0.5 rounded-md bg-teal-600/90 text-white font-mono font-bold text-[9px] shadow flex items-center gap-1 border border-teal-400/40`}
                          title="Marcada para Troca (indisponível para decks futuros)"
                        >
                          <ArrowLeftRight className="size-2.5" />
                          <span>TROCA</span>
                        </div>
                      )}

                      {/* Botão de Favorito */}
                      <button
                        type="button"
                        onClick={(e) => toggleFavorite(card, e)}
                        className="absolute top-2 right-2 z-20 size-7 rounded-full bg-black/60 backdrop-blur-xs border border-white/10 flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all shadow"
                        title={isFav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                      >
                        <Heart
                          className={`size-4 transition-colors ${
                            isFav ? "fill-rose-500 text-rose-500" : "text-white/70 hover:text-white"
                          }`}
                        />
                      </button>

                      {/* Imagem da Carta */}
                      <div className="relative aspect-[1/1.4] w-full flex items-center justify-center overflow-hidden bg-slate-950">
                        <TcgCardImage
                          src={card.image_url}
                          alt={card.name}
                          lowQuality={true}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/15 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out" />
                      </div>

                      {/* Detalhes no Rodapé */}
                      <div className="p-2.5 bg-card/95 border-t border-border/50 flex flex-col justify-between flex-1">
                        <h4 className="font-bold text-xs text-foreground truncate" title={card.name}>
                          {card.name}
                        </h4>

                        <div className="flex items-center justify-between mt-2">
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${rarityInfo.color}`}>
                            {rarityInfo.label}
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground/70">
                            #{card.id}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center my-8">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href={currentPage > 1 ? buildPageUrl(currentPage - 1) : "#"}
                        className={currentPage <= 1 ? "pointer-events-none opacity-40" : "cursor-pointer"}
                      />
                    </PaginationItem>

                    <PaginationItem>
                      <span className="text-xs font-mono font-bold px-3 py-1 text-muted-foreground">
                        Página {currentPage} de {totalPages}
                      </span>
                    </PaginationItem>

                    <PaginationItem>
                      <PaginationNext
                        href={currentPage < totalPages ? buildPageUrl(currentPage + 1) : "#"}
                        className={currentPage >= totalPages ? "pointer-events-none opacity-40" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </TabsContent>

          {/* ABA: ÁLBUNS & CONQUISTAS */}
          <TabsContent value="albums" className="mt-0">
            <AlbumView />
          </TabsContent>
        </Tabs>

        {/* Modal de Zoom & Ações da Carta */}
        <Dialog open={!!selectedCard} onOpenChange={(open) => !open && setSelectedCard(null)}>
          <DialogContent className="max-w-md bg-zinc-950 text-white border-zinc-800 p-5 text-center">
            <DialogTitle className="text-white font-bold text-lg mb-1 truncate">
              {selectedCard?.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400 mb-3">
              #{selectedCard?.id} • {selectedCard ? (RARITY_MAP[selectedCard.rarity]?.label || "Comum") : ""}
            </DialogDescription>

            {selectedCard && (
              <div className="space-y-4">
                <div className="relative aspect-[1/1.4] max-h-[65vh] w-full rounded-xl overflow-hidden shadow-2xl mx-auto flex items-center justify-center bg-black border border-zinc-800">
                  <TcgCardImage
                    src={selectedCard.image_url}
                    alt={selectedCard.name}
                    className="w-full h-full object-contain"
                  />
                </div>

                {/* Botões de Ação */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => toggleFavorite(selectedCard)}
                    className={`gap-2 text-xs font-bold ${
                      favoritesList[selectedCard.id]
                        ? "bg-rose-950/60 border-rose-600 text-rose-300"
                        : "border-zinc-700 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"
                    }`}
                  >
                    <Heart className={`size-4 ${favoritesList[selectedCard.id] ? "fill-rose-500 text-rose-500" : ""}`} />
                    {favoritesList[selectedCard.id] ? "Favoritada" : "Favoritar"}
                  </Button>

                  <Button
                    type="button"
                    onClick={() => toggleTradeMark(selectedCard)}
                    className={`gap-2 text-xs font-bold ${
                      tradeMarkedList[selectedCard.id]
                        ? "bg-teal-600 hover:bg-teal-500 text-white border border-teal-400"
                        : "bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700"
                    }`}
                  >
                    <ArrowLeftRight className="size-4" />
                    {tradeMarkedList[selectedCard.id] ? "✓ Marcada p/ Troca" : "Marcar p/ Troca"}
                  </Button>
                </div>

                {/* Aviso sobre decks futuros */}
                <div className="bg-amber-950/40 border border-amber-600/30 rounded-lg p-2.5 text-[11px] text-amber-200 text-left flex items-start gap-2">
                  <ShieldAlert className="size-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Atenção às Regras de Batalha:</strong> Cartas marcadas para troca ficam visíveis no mercado de trocas e <u>não poderão</u> ser utilizadas nos seus decks de batalha.
                  </span>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}