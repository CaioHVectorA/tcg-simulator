"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { loadTcgImg } from "@/lib/load-tcg-img";
import { soundFx } from "@/lib/sound-fx";
import { CardDetailModal, CardModalData } from "@/components/card-detail-modal";
import { Sparkles, Eye, ArrowRight, CheckCircle2, RotateCcw, Trophy, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface PackOpenViewProps {
  cards: Card[];
}

const RARITY_COLORS: Record<number, { glow: string; text: string; label: string; badge: string }> = {
  1: { glow: "rgba(59, 130, 246, 0.4)", text: "text-blue-400", label: "Comum", badge: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  2: { glow: "rgba(14, 165, 233, 0.6)", text: "text-sky-300", label: "Rara", badge: "bg-sky-500/20 text-sky-200 border-sky-500/40" },
  3: { glow: "rgba(168, 85, 247, 0.8)", text: "text-purple-300", label: "Épica", badge: "bg-purple-500/20 text-purple-200 border-purple-500/50" },
  4: { glow: "rgba(234, 179, 8, 0.95)", text: "text-amber-300", label: "Lendária", badge: "bg-amber-500/20 text-amber-200 border-amber-500/60" },
  5: { glow: "rgba(244, 63, 94, 1.0)", text: "text-rose-300", label: "Ultra Rara", badge: "bg-gradient-to-r from-rose-500/30 to-amber-500/30 text-rose-200 border-rose-500/60" },
};

function PokemonCardBack() {
  return (
    <div className="w-full h-full rounded-2xl bg-gradient-to-br from-blue-950 via-indigo-950 to-slate-950 p-2.5 shadow-2xl border-4 border-amber-600/70 flex items-center justify-center relative overflow-hidden select-none">
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-400 via-transparent to-transparent pointer-events-none" />
      <div className="w-full h-full border border-amber-500/40 rounded-xl flex flex-col items-center justify-center p-3 relative">
        <div className="w-28 h-28 rounded-full border-4 border-slate-900 bg-gradient-to-b from-red-600 50% to-white 50% relative flex items-center justify-center shadow-lg shadow-black/60">
          <div className="w-full h-2.5 bg-slate-900 absolute" />
          <div className="w-9 h-9 rounded-full bg-white border-4 border-slate-900 flex items-center justify-center z-10 shadow-sm">
            <div className="w-3.5 h-3.5 rounded-full bg-slate-200 border border-slate-400 animate-pulse" />
          </div>
        </div>
        <span className="font-syne font-extrabold text-[11px] tracking-widest text-amber-400/80 uppercase mt-4">
          POKÉMON TCG
        </span>
      </div>
    </div>
  );
}

export function PackOpenView({ cards }: PackOpenViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [inspectCard, setInspectCard] = useState<CardModalData | null>(null);

  const currentCard = cards[currentIndex];
  const rarityConfig = currentCard ? RARITY_COLORS[currentCard.rarity || 1] : RARITY_COLORS[1];

  const handleFlip = () => {
    if (isFlipped) return;
    setIsFlipped(true);

    soundFx.playCardFlip();
    const rarity = currentCard?.rarity || 1;
    if (rarity === 2) {
      setTimeout(() => soundFx.playRareChime(), 150);
    } else if (rarity === 3) {
      setTimeout(() => soundFx.playEpicAura(), 150);
    } else if (rarity >= 4) {
      setTimeout(() => soundFx.playLegendaryFanfare(), 150);
    }
  };

  const handleNext = () => {
    if (currentIndex < cards.length - 1) {
      setIsFlipped(false);
      setCurrentIndex((prev) => prev + 1);
    } else {
      soundFx.playSuccess();
      setIsCompleted(true);
    }
  };

  const handleRevealAll = () => {
    soundFx.playSuccess();
    setIsCompleted(true);
  };

  const raresCount = cards.filter((c) => (c.rarity || 1) >= 2).length;
  const epicsCount = cards.filter((c) => (c.rarity || 1) >= 3).length;
  const legendariesCount = cards.filter((c) => (c.rarity || 1) >= 4).length;

  return (
    <div className="min-h-[85vh] relative flex flex-col justify-between p-4 sm:p-8 font-syne overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-950/90 shadow-2xl backdrop-blur-2xl">
      {/* Iluminação Ambiente Dinâmica */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-700 -z-10"
        style={{
          background:
            !isCompleted && isFlipped && currentCard
              ? `radial-gradient(circle at 50% 50%, ${rarityConfig.glow} 0%, rgba(15,23,42,0.8) 50%, rgba(2,6,23,0.98) 100%)`
              : "radial-gradient(circle at 50% 50%, rgba(59,130,246,0.15) 0%, rgba(2,6,23,0.98) 100%)",
        }}
      />

      {/* Topo: Navegação e Progresso */}
      <div className="flex items-center justify-between z-10">
        <Button variant="ghost" asChild className="text-slate-400 hover:text-white">
          <Link href="/inventario">
            <ArrowLeft className="size-4 mr-2" /> Voltar ao Inventário
          </Link>
        </Button>

        {!isCompleted && (
          <div className="flex items-center gap-3">
            <span className="text-xs sm:text-sm font-semibold text-slate-300 font-mono">
              Carta {currentIndex + 1} de {cards.length}
            </span>
            <div className="flex gap-1">
              {cards.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === currentIndex
                      ? "w-6 bg-amber-400"
                      : idx < currentIndex
                      ? "w-2 bg-emerald-500"
                      : "w-2 bg-slate-700"
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Palco Central */}
      <div className="flex-1 flex items-center justify-center p-4">
        {!isCompleted && currentCard ? (
          <motion.div
            key={`card-${currentIndex}`}
            initial={{ scale: 0.7, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, x: 200, opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center gap-6"
          >
            {/* 3D Flip Card Container */}
            <div
              className="relative w-64 sm:w-80 aspect-[2.5/3.5] cursor-pointer"
              style={{ perspective: 1200 }}
              onClick={handleFlip}
            >
              <motion.div
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                style={{ transformStyle: "preserve-3d" }}
                className="w-full h-full relative"
              >
                {/* Lado Verso */}
                <div
                  style={{ backfaceVisibility: "hidden" }}
                  className="absolute inset-0 rounded-2xl overflow-hidden"
                >
                  <PokemonCardBack />
                  <div className="absolute inset-0 bg-white/5 hover:bg-white/10 transition-colors flex items-end justify-center pb-6">
                    <span className="bg-slate-900/90 border border-amber-400/50 text-amber-300 font-bold text-xs px-3 py-1 rounded-full shadow-lg animate-bounce">
                      👆 Clique para Revelar
                    </span>
                  </div>
                </div>

                {/* Lado Revelado */}
                <div
                  style={{
                    backfaceVisibility: "hidden",
                    transform: "rotateY(180deg)",
                  }}
                  className={`absolute inset-0 rounded-2xl overflow-hidden shadow-2xl border-2 transition-all duration-500 ${
                    currentCard.rarity >= 4
                      ? "border-amber-400 shadow-[0_0_50px_rgba(234,179,8,0.8)]"
                      : currentCard.rarity === 3
                      ? "border-purple-400 shadow-[0_0_40px_rgba(168,85,247,0.7)]"
                      : currentCard.rarity === 2
                      ? "border-sky-400 shadow-[0_0_30px_rgba(14,165,233,0.5)]"
                      : "border-slate-600 shadow-[0_0_20px_rgba(0,0,0,0.6)]"
                  }`}
                >
                  <img
                    src={loadTcgImg(currentCard.image_url)}
                    alt={currentCard.name}
                    className="w-full h-full object-cover rounded-2xl"
                  />

                  {currentCard.rarity >= 2 && (
                    <div
                      className="absolute inset-0 pointer-events-none rounded-2xl opacity-40 mix-blend-color-dodge animate-pulse"
                      style={{
                        background:
                          "linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,0,128,0.3) 30%, rgba(0,255,255,0.4) 70%, transparent 100%)",
                      }}
                    />
                  )}
                </div>
              </motion.div>
            </div>

            {/* Informações da Carta */}
            <div className="flex flex-col items-center gap-2 text-center min-h-[90px]">
              {isFlipped ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center gap-2"
                >
                  <Badge variant="outline" className={`${rarityConfig.badge} font-mono text-xs px-3 py-0.5 rounded-full`}>
                    {rarityConfig.label}
                  </Badge>

                  <h3 className="text-2xl sm:text-3xl font-black text-white">
                    {currentCard.name}
                  </h3>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setInspectCard(currentCard)}
                    className="text-xs text-amber-300 hover:text-amber-200 hover:bg-white/10"
                  >
                    <Eye className="size-3.5 mr-1" /> Inspecionar 3D com Foil
                  </Button>
                </motion.div>
              ) : (
                <p className="text-sm text-slate-400 font-mono animate-pulse">
                  Clique na carta para revelar...
                </p>
              )}
            </div>
          </motion.div>
        ) : (
          /* Resumo Geral */
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-4xl flex flex-col items-center gap-6"
          >
            <div className="text-center">
              <div className="inline-flex items-center justify-center p-3 bg-amber-500/20 text-amber-400 rounded-full mb-3 border border-amber-500/30">
                <Trophy className="size-8" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white">
                Todas as Cartas Reveladas! 🎉
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                {cards.length} cartas foram salvas diretamente na sua coleção.
              </p>
            </div>

            {/* Badges de Destaque */}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-300 font-mono px-3 py-1">
                👑 {legendariesCount} Lendárias
              </Badge>
              <Badge variant="outline" className="border-purple-500/40 bg-purple-500/10 text-purple-300 font-mono px-3 py-1">
                💎 {epicsCount} Épicas
              </Badge>
              <Badge variant="outline" className="border-sky-500/40 bg-sky-500/10 text-sky-300 font-mono px-3 py-1">
                ⭐ {raresCount} Raras
              </Badge>
            </div>

            {/* Grid de Cartas Reveladas */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 w-full pt-4">
              {cards.map((card, idx) => (
                <div
                  key={card.id + idx}
                  onClick={() => setInspectCard(card)}
                  className="group relative aspect-[2.5/3.5] rounded-xl overflow-hidden border border-white/10 hover:border-amber-400 hover:scale-105 transition-all duration-300 cursor-pointer shadow-lg"
                >
                  <img
                    src={loadTcgImg(card.image_url)}
                    alt={card.name}
                    className="w-full h-full object-cover rounded-xl"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2 flex flex-col justify-end">
                    <span className="text-xs font-bold text-white truncate">{card.name}</span>
                    <span className="text-[10px] text-amber-300 font-mono">
                      {RARITY_COLORS[card.rarity || 1]?.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Rodapé: Controles */}
      <div className="flex items-center justify-between pt-4 border-t border-white/10 z-10">
        {!isCompleted ? (
          <>
            <Button
              variant="ghost"
              onClick={handleRevealAll}
              className="text-xs text-slate-400 hover:text-white"
            >
              Revelar Todas
            </Button>

            <div className="flex items-center gap-3">
              {!isFlipped ? (
                <Button
                  onClick={handleFlip}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-6"
                >
                  Virar Carta
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-6"
                >
                  {currentIndex < cards.length - 1 ? (
                    <>Próxima Carta <ArrowRight className="size-4 ml-1.5" /></>
                  ) : (
                    <>Ver Resumo <CheckCircle2 className="size-4 ml-1.5" /></>
                  )}
                </Button>
              )}
            </div>
          </>
        ) : (
          <div className="w-full flex items-center justify-between">
            <Button variant="outline" asChild className="border-slate-700 text-slate-300">
              <Link href="/inventario">Voltar ao Inventário</Link>
            </Button>
            <Button asChild className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold">
              <Link href="/colecao">Ver na Coleção</Link>
            </Button>
          </div>
        )}
      </div>

      <CardDetailModal
        isOpen={Boolean(inspectCard)}
        onClose={() => setInspectCard(null)}
        card={inspectCard}
      />
    </div>
  );
}
