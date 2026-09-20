"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { loadTcgImg } from "@/lib/load-tcg-img";
import { soundFx } from "@/lib/sound-fx";
import { CardDetailModal, CardModalData } from "./card-detail-modal";
import { useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/hooks/use-api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Layers,
  Crown,
  Trophy,
  Filter,
  Package as PackageIcon,
  CheckCircle2,
  Eye,
} from "lucide-react";
import { BoosterPackArt } from "./booster-pack-art";

export interface BatchCard {
  id: number;
  name: string;
  image_url: string;
  rarity: number;
  hp?: number;
  type?: string;
  card_id?: string;
}

interface BatchOpeningModalProps {
  isOpen: boolean;
  onClose: () => void;
  pack: UserPackage;
  quantityToOpen: number;
}

const RARITY_LABELS: Record<number, { label: string; badge: string; color: string }> = {
  1: { label: "Comum", badge: "bg-blue-500/15 text-blue-300 border-blue-500/30", color: "border-blue-500/30" },
  2: { label: "Rara", badge: "bg-sky-500/15 text-sky-200 border-sky-500/40", color: "border-sky-400" },
  3: { label: "Épica", badge: "bg-purple-500/15 text-purple-200 border-purple-500/50", color: "border-purple-400" },
  4: { label: "Mística", badge: "bg-amber-500/15 text-amber-200 border-amber-500/60", color: "border-amber-400" },
  5: { label: "Lendária", badge: "bg-gradient-to-r from-rose-500/30 to-amber-500/30 text-rose-200 border-rose-500/60", color: "border-rose-500" },
};

export function BatchOpeningModal({
  isOpen,
  onClose,
  pack,
  quantityToOpen,
}: BatchOpeningModalProps) {
  const { post, loading } = useApi();
  const qClient = useQueryClient();

  const [phase, setPhase] = useState<"opening" | "revealed">("opening");
  const [cards, setCards] = useState<BatchCard[]>([]);
  const [activeFilter, setActiveFilter] = useState<number | "all">("all");
  const [inspectCard, setInspectCard] = useState<CardModalData | null>(null);

  const isStandardPack = !pack.tcg_id || !pack.image_url || pack.image_url.includes("placeholder");

  useEffect(() => {
    if (isOpen && quantityToOpen > 0) {
      setPhase("opening");
      setCards([]);
      setActiveFilter("all");

      const executeBatchOpen = async () => {
        try {
          soundFx.playPackTear();
          const packagesId = Array(quantityToOpen).fill(pack.id);
          const res = await post("/packages/open-packages", { packagesId });
          const allCards: BatchCard[] = res.data?.data || res.data || [];

          // Pré-carrega imagens das cartas
          allCards.forEach((c) => {
            if (c.image_url) {
              const img = new Image();
              img.src = loadTcgImg(c.image_url);
            }
          });

          // Tempo mínimo para a animação de rasgo em lote fluir
          setTimeout(() => {
            setCards(allCards);
            setPhase("revealed");

            const maxRarity = Math.max(...allCards.map((c) => c.rarity || 1));
            if (maxRarity >= 5) {
              soundFx.playGodPullFanfare();
            } else if (maxRarity >= 4) {
              soundFx.playLegendaryFanfare();
            } else {
              soundFx.playSuccess();
            }

            qClient.invalidateQueries({ queryKey: ["packages"] });
            qClient.invalidateQueries({ queryKey: ["user"] });
            qClient.invalidateQueries({ queryKey: ["cards"] });
          }, 800);
        } catch (err) {
          console.error("Batch open error:", err);
          onClose();
        }
      };

      executeBatchOpen();
    }
  }, [isOpen, quantityToOpen]);

  const legendaries = cards.filter((c) => (c.rarity || 1) === 5);
  const mythics = cards.filter((c) => (c.rarity || 1) === 4);
  const epics = cards.filter((c) => (c.rarity || 1) === 3);
  const rares = cards.filter((c) => (c.rarity || 1) === 2);
  const commons = cards.filter((c) => (c.rarity || 1) === 1);

  const filteredCards =
    activeFilter === "all"
      ? cards
      : cards.filter((c) => (c.rarity || 1) === activeFilter);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-5xl w-[95vw] h-[90vh] max-h-[850px] p-0 border border-slate-800 bg-slate-950/98 backdrop-blur-2xl text-white font-syne overflow-hidden flex flex-col justify-between shadow-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Abertura de {quantityToOpen}x {pack.name}</DialogTitle>
          </DialogHeader>

          {/* Topo do Modal */}
          <div className="p-4 sm:p-5 flex items-center justify-between border-b border-white/10 bg-slate-900/60 z-10">
            <div className="flex items-center gap-3">
              <span className="text-lg sm:text-2xl font-black text-amber-400">
                {pack.name}
              </span>
              <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-300 font-mono text-xs">
                Abertura de {quantityToOpen}x Pacotes
              </Badge>
            </div>

            {phase === "revealed" && (
              <span className="font-mono text-xs text-slate-400">
                Total: <strong className="text-white">{cards.length} cartas</strong>
              </span>
            )}
          </div>

          {/* Corpo: Animação de Abertura ou Grid das Cartas */}
          <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden relative">
            <AnimatePresence mode="wait">
              {phase === "opening" ? (
                /* FASE DE ABERTURA EM LOTE ANIMADA */
                <motion.div
                  key="opening-animation"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  className="flex flex-col items-center gap-6 text-center"
                >
                  <div className="relative size-44 sm:size-52 flex items-center justify-center">
                    {/* Glow de fundo */}
                    <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-3xl animate-pulse pointer-events-none" />

                    {/* Pilha de Boosters abrindo */}
                    <motion.div
                      animate={{ rotate: [0, -5, 5, 0], scale: [1, 1.05, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="w-32 sm:w-36 aspect-[1/1.4] rounded-2xl overflow-hidden shadow-2xl border-2 border-amber-400"
                    >
                      {isStandardPack ? (
                        <BoosterPackArt name={pack.name} cardsQuantity={pack.cards_quantity} className="w-full h-full" />
                      ) : (
                        <img
                          src={loadTcgImg(pack.image_url)}
                          alt={pack.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </motion.div>

                    {/* Partículas girando */}
                    <div className="absolute -top-3 -right-3 text-amber-400 animate-spin">
                      <Sparkles className="size-8" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-xl sm:text-2xl font-black text-white">
                      Abrindo {quantityToOpen} Booster Packs...
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-400">
                      Rasgando lacres e sorteando cartas para seu deck.
                    </p>
                  </div>
                </motion.div>
              ) : (
                /* FASE REVELADA: RESUMO COMPLETO EM LOTE */
                <motion.div
                  key="revealed-screen"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-full h-full flex flex-col justify-between gap-4"
                >
                  {/* Barra de Filtros por Raridade */}
                  <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-white/10 shrink-0">
                    <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
                      <Button
                        variant={activeFilter === "all" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setActiveFilter("all")}
                        className={`text-xs h-8 rounded-lg font-mono font-bold ${
                          activeFilter === "all" ? "bg-amber-500 text-slate-950" : "border-slate-700 text-slate-300"
                        }`}
                      >
                        Todas ({cards.length})
                      </Button>

                      {legendaries.length > 0 && (
                        <Button
                          variant={activeFilter === 5 ? "default" : "outline"}
                          size="sm"
                          onClick={() => setActiveFilter(5)}
                          className={`text-xs h-8 rounded-lg font-mono font-bold ${
                            activeFilter === 5 ? "bg-rose-500 text-white" : "border-rose-500/40 text-rose-300"
                          }`}
                        >
                          👑 Lendárias ({legendaries.length})
                        </Button>
                      )}

                      {mythics.length > 0 && (
                        <Button
                          variant={activeFilter === 4 ? "default" : "outline"}
                          size="sm"
                          onClick={() => setActiveFilter(4)}
                          className={`text-xs h-8 rounded-lg font-mono font-bold ${
                            activeFilter === 4 ? "bg-amber-500 text-slate-950" : "border-amber-500/40 text-amber-300"
                          }`}
                        >
                          ✨ Místicas ({mythics.length})
                        </Button>
                      )}

                      {epics.length > 0 && (
                        <Button
                          variant={activeFilter === 3 ? "default" : "outline"}
                          size="sm"
                          onClick={() => setActiveFilter(3)}
                          className={`text-xs h-8 rounded-lg font-mono font-bold ${
                            activeFilter === 3 ? "bg-purple-600 text-white" : "border-purple-500/40 text-purple-300"
                          }`}
                        >
                          💎 Épicas ({epics.length})
                        </Button>
                      )}

                      {rares.length > 0 && (
                        <Button
                          variant={activeFilter === 2 ? "default" : "outline"}
                          size="sm"
                          onClick={() => setActiveFilter(2)}
                          className={`text-xs h-8 rounded-lg font-mono font-bold ${
                            activeFilter === 2 ? "bg-sky-600 text-white" : "border-sky-500/40 text-sky-300"
                          }`}
                        >
                          ⭐ Raras ({rares.length})
                        </Button>
                      )}
                    </div>

                    <span className="text-[11px] text-slate-400 font-sans hidden sm:inline">
                      Clique em uma carta para ampliar
                    </span>
                  </div>

                  {/* Grid de Cartas */}
                  <div className="flex-1 overflow-y-auto pr-1">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 p-1">
                      {filteredCards.map((card, idx) => {
                        const isLegendary = card.rarity === 5;
                        const isMythic = card.rarity === 4;

                        return (
                          <div
                            key={`${card.id}-${idx}`}
                            onClick={() => setInspectCard(card)}
                            className={`group relative rounded-xl overflow-hidden border p-1 bg-slate-900/60 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl ${
                              isLegendary
                                ? "border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.4)] ring-1 ring-rose-400"
                                : isMythic
                                ? "border-amber-400 shadow-[0_0_15px_rgba(234,179,8,0.3)] ring-1 ring-amber-400/60"
                                : card.rarity === 3
                                ? "border-purple-500/70"
                                : card.rarity === 2
                                ? "border-sky-500/50"
                                : "border-slate-800 hover:border-slate-600"
                            }`}
                          >
                            <div className="relative aspect-[2.5/3.5] rounded-lg overflow-hidden bg-slate-950">
                              <img
                                src={loadTcgImg(card.image_url)}
                                alt={card.name}
                                className="w-full h-full object-cover"
                              />

                              {/* Brilho holográfico para cartas especiais */}
                              {(isLegendary || isMythic) && (
                                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent pointer-events-none mix-blend-color-dodge animate-pulse" />
                              )}
                            </div>

                            <div className="p-1.5 text-left">
                              <p className="font-bold text-xs text-white truncate">{card.name}</p>
                              <div className="flex items-center justify-between mt-0.5">
                                <span className="text-[10px] font-mono text-amber-300 font-semibold">
                                  {RARITY_LABELS[card.rarity || 1]?.label}
                                </span>
                                <Badge className="text-[9px] font-mono px-1 py-0 bg-slate-800 text-slate-300">
                                  ★{card.rarity}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Rodapé */}
          {phase === "revealed" && (
            <div className="p-4 sm:p-5 border-t border-white/10 bg-slate-900/60 flex items-center justify-between gap-3 shrink-0">
              <span className="text-xs text-slate-400 font-sans hidden sm:inline">
                Todas as cartas foram adicionadas com sucesso à sua coleção.
              </span>

              <Button
                onClick={onClose}
                className="w-full sm:w-auto px-8 h-11 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-amber-500/20"
              >
                <CheckCircle2 className="size-4 mr-2" /> Concluir & Adicionar ao Deck
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Inspeção da Carta */}
      <CardDetailModal
        card={inspectCard}
        isOpen={Boolean(inspectCard)}
        onClose={() => setInspectCard(null)}
      />
    </>
  );
}
