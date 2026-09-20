"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { loadTcgImg } from "@/lib/load-tcg-img";
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
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AlbumView } from "@/modules/inventory/album";

export type CardItem = {
  id: number;
  name: string;
  image_url: string;
  card_id: string;
  rarity: number;
  quantity: number;
  isFavorite?: boolean;
};

interface CollectionProps {
  data: CardItem[];
  currentPage: number;
  totalPages: number;
  totalCards?: number;
  search?: string;
}

const RARITY_MAP: Record<number, { label: string; color: string }> = {
  1: { label: "Comum", color: "bg-slate-500/20 text-slate-300 border-slate-500/40" },
  2: { label: "Rara", color: "bg-blue-500/20 text-blue-400 border-blue-500/40" },
  3: { label: "Épica", color: "bg-purple-500/20 text-purple-400 border-purple-500/40" },
  4: { label: "Mística", color: "bg-amber-500/20 text-amber-400 border-amber-500/40" },
  5: { label: "Lendária", color: "bg-rose-500/20 text-rose-400 border-rose-500/40" },
};

export function Cards({
  data = [],
  currentPage = 1,
  totalPages = 1,
  totalCards = 0,
  search = "",
}: CollectionProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { post } = useApi();

  const [selectedCard, setSelectedCard] = useState<CardItem | null>(null);
  const [searchTerm, setSearchTerm] = useState(search);
  const [favoritesList, setFavoritesList] = useState<Record<number, boolean>>(() => {
    const initial: Record<number, boolean> = {};
    data.forEach((c) => {
      if (c.isFavorite) initial[c.id] = true;
    });
    return initial;
  });

  const isFavoritesOnly = searchParams.get("favorites") === "true";
  const [currentView, setCurrentView] = useState<"cards" | "albums">("cards");

  const handleFilterToggle = (showOnlyFavorites: boolean) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");
    if (showOnlyFavorites) {
      params.set("favorites", "true");
    } else {
      params.delete("favorites");
    }
    router.push(`/colecao?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");
    if (searchTerm.trim()) {
      params.set("search", searchTerm.trim());
    } else {
      params.delete("search");
    }
    router.push(`/colecao?${params.toString()}`);
  };

  const toggleFavorite = async (card: CardItem, e: React.MouseEvent) => {
    e.stopPropagation();
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
      // Revert on error
      setFavoritesList((prev) => ({ ...prev, [card.id]: currentFav }));
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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-border/60">
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
                  ? `Cartas que você possui (${totalCards} no total) • Inspecione em alta resolução e selecione favoritas`
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
            {/* Barra de Filtros e Busca */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 mb-6">
              {/* Filtro de Favoritas */}
              <div className="inline-flex rounded-xl bg-secondary/80 p-1 border border-border shrink-0">
                <button
                  type="button"
                  onClick={() => handleFilterToggle(false)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    !isFavoritesOnly
                      ? "bg-primary text-slate-950 shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Todas
                </button>
                <button
                  type="button"
                  onClick={() => handleFilterToggle(true)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    isFavoritesOnly
                      ? "bg-rose-600 text-white shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Heart className={`size-3.5 ${isFavoritesOnly ? "fill-white" : "fill-rose-500/20 text-rose-500"}`} />
                  <span>Favoritas</span>
                </button>
              </div>

              {/* Busca */}
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-1.5">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    type="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar pelo nome..."
                    className="pl-9 h-10 text-xs sm:text-sm bg-secondary/60 border-border"
                  />
                </div>
                <Button type="submit" size="sm" className="h-10 px-4 font-semibold text-xs shrink-0">
                  Buscar
                </Button>
              </form>
            </div>

        {/* Empty States Aprimorados */}
        {data.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-md mx-auto">
            {isFavoritesOnly ? (
              <>
                <div className="size-20 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mb-4">
                  <Heart className="size-10 text-rose-500 animate-pulse" />
                </div>
                <h3 className="text-xl font-bold font-syne mb-2">Nenhuma favorita ainda</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-6">
                  Você ainda não favoritou nenhuma carta. Clique no ícone de coração sobre as suas cartas para fixá-las aqui!
                </p>
                <Button
                  onClick={() => handleFilterToggle(false)}
                  variant="outline"
                  className="gap-2 font-semibold text-xs"
                >
                  <Filter className="size-4" /> Ver Todas as Minhas Cartas
                </Button>
              </>
            ) : search ? (
              <>
                <div className="size-20 rounded-full bg-secondary border border-border flex items-center justify-center mb-4">
                  <Search className="size-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold font-syne mb-2">Nenhum Pokémon encontrado</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-6">
                  Não encontramos nenhuma carta na sua coleção com o termo "{search}". Tente buscar por outro nome.
                </p>
                <Button
                  onClick={() => {
                    setSearchTerm("");
                    router.push("/colecao");
                  }}
                  variant="outline"
                  className="text-xs font-semibold"
                >
                  Limpar Pesquisa
                </Button>
              </>
            ) : (
              <>
                <div className="size-24 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-5">
                  <PackageOpen className="size-12 text-amber-500" />
                </div>
                <h3 className="text-2xl font-bold font-syne mb-2">Seu deck está vazio!</h3>
                <p className="text-xs sm:text-sm text-muted-foreground mb-6 leading-relaxed">
                  Você ainda não possui nenhuma carta na sua coleção. Adquira pacotes na loja ou complete missões para abrir seus primeiros boosters!
                </p>
                <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
                  <Button asChild className="gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold font-sans">
                    <Link href="/loja">
                      <ShoppingBag className="size-4" /> Ir para a Loja de Pacotes
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="font-semibold text-xs">
                    <Link href="/missoes">
                      <Sparkles className="size-4 mr-1 text-amber-500" /> Ver Missões
                    </Link>
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Grid de Cartas */}
        {data.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 mb-10">
            {data.map((card) => {
              const isFav = favoritesList[card.id] ?? !!card.isFavorite;
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
                    <img
                      src={loadTcgImg(card.image_url, true)}
                      alt={card.name}
                      loading="lazy"
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

        {/* Modal de Zoom */}
        <Dialog open={!!selectedCard} onOpenChange={(open) => !open && setSelectedCard(null)}>
          <DialogContent className="max-w-md bg-black/95 backdrop-blur-md border-border/60 p-4 text-center">
            <DialogTitle className="text-white font-bold text-base mb-3 truncate">
              {selectedCard?.name}
            </DialogTitle>
            {selectedCard && (
              <div className="relative aspect-[1/1.4] max-h-[75vh] w-full rounded-xl overflow-hidden shadow-2xl mx-auto flex items-center justify-center bg-black">
                <img
                  src={loadTcgImg(selectedCard.image_url)}
                  alt={selectedCard.name}
                  className="w-full h-full object-contain"
                />
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}