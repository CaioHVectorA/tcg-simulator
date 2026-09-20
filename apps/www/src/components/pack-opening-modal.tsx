"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { loadTcgImg } from "@/lib/load-tcg-img";
import { soundFx } from "@/lib/sound-fx";
import { CardDetailModal, CardModalData } from "./card-detail-modal";
import { MaxRarityCelebration } from "./max-rarity-celebration";
import { Sparkles, Eye, ArrowRight, CheckCircle2, RotateCcw, Flame, Trophy } from "lucide-react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useApi } from "@/hooks/use-api";
import { BoosterPackArt } from "./booster-pack-art";

export interface OpenedCard {
  id: number;
  name: string;
  image_url: string;
  rarity: number;
  hp?: number;
  type?: string;
  card_id?: string;
}

interface PackOpeningModalProps {
  isOpen: boolean;
  onClose: () => void;
  pack: UserPackage;
  initialQuantity?: number;
  preloadedCards?: OpenedCard[];
}

const RARITY_COLORS: Record<number, { glow: string; text: string; label: string; badge: string }> = {
  1: { glow: "rgba(59, 130, 246, 0.4)", text: "text-blue-400", label: "Comum", badge: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  2: { glow: "rgba(14, 165, 233, 0.6)", text: "text-sky-300", label: "Rara", badge: "bg-sky-500/20 text-sky-200 border-sky-500/40" },
  3: { glow: "rgba(168, 85, 247, 0.8)", text: "text-purple-300", label: "Épica", badge: "bg-purple-500/20 text-purple-200 border-purple-500/50" },
  4: { glow: "rgba(234, 179, 8, 0.95)", text: "text-amber-300", label: "Mística", badge: "bg-amber-500/20 text-amber-200 border-amber-500/60" },
  5: { glow: "rgba(244, 63, 94, 1.0)", text: "text-rose-300", label: "Lendária", badge: "bg-gradient-to-r from-rose-500/30 to-amber-500/30 text-rose-200 border-rose-500/60" },
};

// Componente para o Verso da Carta estilo Pokémon
function PokemonCardBack() {
  return (
    <div className="w-full h-full rounded-2xl bg-gradient-to-br from-blue-950 via-indigo-950 to-slate-950 p-3 shadow-2xl border-4 border-amber-500/70 flex items-center justify-center relative overflow-hidden select-none">
      {/* Luz ambiente interna */}
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-400 via-transparent to-transparent pointer-events-none" />

      {/* Borda dourada decorativa interna */}
      <div className="w-full h-full border-2 border-amber-400/40 rounded-xl flex flex-col items-center justify-center p-4 relative">
        {/* Pokébola clássica estilizada */}
        <div className="w-32 h-32 rounded-full border-4 border-slate-900 bg-gradient-to-b from-red-600 50% to-white 50% relative flex items-center justify-center shadow-2xl shadow-black/80">
          {/* Faixa central preta */}
          <div className="w-full h-3 bg-slate-900 absolute" />
          {/* Botão central da Pokébola */}
          <div className="w-10 h-10 rounded-full bg-white border-4 border-slate-900 flex items-center justify-center z-10 shadow-md">
            <div className="w-4 h-4 rounded-full bg-slate-200 border border-slate-400 animate-pulse" />
          </div>
        </div>

        {/* Texto do verso */}
        <span className="font-syne font-black text-xs tracking-widest text-amber-400/90 uppercase mt-5 drop-shadow-md">
          POKÉMON TCG
        </span>
      </div>
    </div>
  );
}

export function PackOpeningModal({
  isOpen,
  onClose,
  pack,
  initialQuantity = 1,
  preloadedCards,
}: PackOpeningModalProps) {
  const { post, loading } = useApi();
  const qClient = useQueryClient();
  const isStandardPack = !pack.tcg_id || !pack.image_url || pack.image_url.includes("placeholder");

  // Estados do fluxo
  // 'idle' -> 'ready' -> 'tearing' -> 'revealing' -> 'summary'
  const [phase, setPhase] = useState<"ready" | "tearing" | "revealing" | "summary">("ready");
  const [cards, setCards] = useState<OpenedCard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [inspectCard, setInspectCard] = useState<CardModalData | null>(null);
  const [maxRarityCard, setMaxRarityCard] = useState<OpenedCard | null>(null);
  const [totalOpenedInSession, setTotalOpenedInSession] = useState(0);
  const [summaryCountdown, setSummaryCountdown] = useState(0);
  const summaryTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Background Prefetch Refs e Estado
  const prefetchedCardsRef = useRef<OpenedCard[] | null>(null);
  const prefetchPromiseRef = useRef<Promise<OpenedCard[]> | null>(null);
  const [isPrefetching, setIsPrefetching] = useState(false);

  // Inicialização e prefetch instantâneo ao abrir modal
  useEffect(() => {
    if (isOpen) {
      if (summaryTimerRef.current) clearInterval(summaryTimerRef.current);

      if (phase === "ready") {
        if (preloadedCards && preloadedCards.length > 0) {
          prefetchedCardsRef.current = preloadedCards;
          preloadedCards.forEach((c) => {
            if (c.image_url) {
              const img = new Image();
              img.src = loadTcgImg(c.image_url);
            }
          });
        } else if (!prefetchedCardsRef.current && !prefetchPromiseRef.current && pack?.id) {
          setIsPrefetching(true);
          const promise = post("/packages/open", { packageId: pack.id })
            .then((res) => {
              const list = res.data.data || res.data || [];
              prefetchedCardsRef.current = list;
              // Pré-carrega imagens imediatamente no cache do browser
              if (Array.isArray(list)) {
                list.forEach((c: OpenedCard) => {
                  if (c.image_url) {
                    const img = new Image();
                    img.src = loadTcgImg(c.image_url);
                  }
                });
              }
              return list;
            })
            .catch((err) => {
              console.error("Falha no prefetch do pacote:", err);
              return [];
            })
            .finally(() => {
              setIsPrefetching(false);
            });
          prefetchPromiseRef.current = promise;
        }
      }
    } else {
      // Ao fechar o modal, sincroniza dados se algum pacote foi aberto
      if (prefetchedCardsRef.current) {
        qClient.invalidateQueries({ queryKey: ["packages"] });
        qClient.invalidateQueries({ queryKey: ["user"] });
        qClient.invalidateQueries({ queryKey: ["cards"] });
      }
      prefetchedCardsRef.current = null;
      prefetchPromiseRef.current = null;
      setCards([]);
      setCurrentCardIndex(0);
      setIsFlipped(false);
    }
  }, [isOpen, phase, pack?.id, preloadedCards]);

  // Ação de rasgar o pacote
  const handleTearPack = async () => {
    if (phase !== "ready") return;

    soundFx.playPackTear();
    setPhase("tearing");

    try {
      let cardsGetted: OpenedCard[] = [];

      if (prefetchedCardsRef.current && prefetchedCardsRef.current.length > 0) {
        cardsGetted = prefetchedCardsRef.current;
      } else if (prefetchPromiseRef.current) {
        cardsGetted = await prefetchPromiseRef.current;
      } else if (preloadedCards && preloadedCards.length > 0) {
        cardsGetted = preloadedCards;
      } else {
        const res = await post("/packages/open", { packageId: pack.id });
        cardsGetted = res.data.data || res.data || [];
      }

      // Pré-carrega instantaneamente todas as imagens das cartas para visualização sem delay
      if (Array.isArray(cardsGetted)) {
        cardsGetted.forEach((card: OpenedCard) => {
          if (card.image_url) {
            const img = new Image();
            img.src = loadTcgImg(card.image_url);
          }
        });
      }

      // Transição fluida de 350ms sem interrupções
      setTimeout(() => {
        setCards(cardsGetted);
        setCurrentCardIndex(0);
        setIsFlipped(false);
        setPhase("revealing");
        setTotalOpenedInSession((prev) => prev + 1);

        // Atualiza cache de usuário e inventário
        qClient.invalidateQueries({ queryKey: ["packages"] });
        qClient.invalidateQueries({ queryKey: ["user"] });
        qClient.invalidateQueries({ queryKey: ["cards"] });
      }, 350);
    } catch (err) {
      setPhase("ready");
    }
  };

  // Ação de virar a carta atual
  const handleFlipCard = () => {
    if (isFlipped) return;
    setIsFlipped(true);

    const currentCard = cards[currentCardIndex];
    if (!currentCard) return;

    soundFx.playCardFlip();

    const rarity = currentCard.rarity || 1;
    if (rarity === 5) {
      soundFx.playMaxRarityAura();
      setTimeout(() => {
        setMaxRarityCard(currentCard);
      }, 500);
    } else if (rarity >= 4) {
      setTimeout(() => soundFx.playLegendaryFanfare(), 150);
    } else if (rarity === 3) {
      setTimeout(() => soundFx.playEpicAura(), 150);
    } else if (rarity === 2) {
      setTimeout(() => soundFx.playRareChime(), 150);
    }
  };

  // Avançar para a próxima carta
  const handleNextCard = () => {
    if (currentCardIndex < cards.length - 1) {
      setIsFlipped(false);
      setCurrentCardIndex((prev) => prev + 1);
    } else {
      soundFx.playSuccess();
      setPhase("summary");
      // Inicia contagem regressiva auto-close de 10s
      setSummaryCountdown(10);
      summaryTimerRef.current = setInterval(() => {
        setSummaryCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(summaryTimerRef.current!);
            onClose();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  // Revelar todas de uma vez
  const handleRevealAll = () => {
    soundFx.playSuccess();
    setPhase("summary");
    // Inicia contagem regressiva auto-close de 10s
    setSummaryCountdown(10);
    summaryTimerRef.current = setInterval(() => {
      setSummaryCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(summaryTimerRef.current!);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Abrir mais um pacote do mesmo tipo
  const handleOpenAnother = () => {
    prefetchedCardsRef.current = null;
    prefetchPromiseRef.current = null;
    setCards([]);
    setCurrentCardIndex(0);
    setIsFlipped(false);
    setPhase("ready");
  };

  const currentCard = cards[currentCardIndex];
  const rarityConfig = currentCard ? RARITY_COLORS[currentCard.rarity || 1] : RARITY_COLORS[1];

  // Estatísticas do resumo
  const raresCount = cards.filter((c) => (c.rarity || 1) === 2).length;
  const epicsCount = cards.filter((c) => (c.rarity || 1) === 3).length;
  const mythicsCount = cards.filter((c) => (c.rarity || 1) === 4).length;
  const legendariesCount = cards.filter((c) => (c.rarity || 1) === 5).length;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-4xl w-[95vw] h-[90vh] max-h-[850px] p-0 border border-slate-800 bg-slate-950/95 backdrop-blur-2xl text-white font-syne overflow-hidden flex flex-col justify-between shadow-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Abertura de Pacote - {pack?.name}</DialogTitle>
          </DialogHeader>

          {/* Iluminação Ambiente Dinâmica de Fundo */}
          <div
            className="absolute inset-0 pointer-events-none transition-all duration-700 -z-10"
            style={{
              background:
                phase === "revealing" && isFlipped && currentCard
                  ? `radial-gradient(circle at 50% 50%, ${rarityConfig.glow} 0%, rgba(15,23,42,0.8) 50%, rgba(2,6,23,0.98) 100%)`
                  : phase === "tearing"
                  ? "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.7) 0%, rgba(234,179,8,0.3) 40%, rgba(2,6,23,0.98) 100%)"
                  : "radial-gradient(circle at 50% 50%, rgba(59,130,246,0.15) 0%, rgba(2,6,23,0.98) 100%)",
            }}
          />

          {/* Topo: Nome do Pacote & Indicadores */}
          <div className="p-4 sm:p-6 flex items-center justify-between border-b border-white/10 z-10 bg-slate-900/40">
            <div className="flex items-center gap-3">
              <span className="text-xl sm:text-2xl font-black tracking-wide text-amber-400">
                {pack.name}
              </span>
              <Badge variant="outline" className="border-amber-500/30 text-amber-300 font-mono text-xs">
                {pack.quantity} restantes
              </Badge>
            </div>

            {phase === "revealing" && (
              <div className="flex items-center gap-3">
                <span className="text-xs sm:text-sm font-semibold text-slate-300 font-mono">
                  Carta {currentCardIndex + 1} de {cards.length}
                </span>
                <div className="flex gap-1">
                  {cards.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        idx === currentCardIndex
                          ? "w-6 bg-amber-400"
                          : idx < currentCardIndex
                          ? "w-2 bg-emerald-500"
                          : "w-2 bg-slate-700"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Centro: Palco Principal */}
          <div className="flex-1 flex items-center justify-center p-4 relative overflow-hidden">
            {/* FASE 1: PACOTE PRONTO PARA RASGAR */}
            <AnimatePresence mode="wait">
              {phase === "ready" && (
                <motion.div
                  key="ready"
                  initial={{ scale: 0.8, opacity: 0, y: 30 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 1.05, opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col items-center gap-6 cursor-pointer group"
                  onClick={handleTearPack}
                >
                  <motion.div
                    animate={{ y: [-6, 6, -6] }}
                    transition={{ repeat: Infinity, duration: 3.5, ease: "easeInOut" }}
                    className="relative w-64 sm:w-72 aspect-[1/1.5] rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.8)] border-4 border-amber-500/50 group-hover:border-amber-400 transition-colors"
                  >
                    {/* Imagem do Pacote */}
                    {isStandardPack ? (
                      <BoosterPackArt name={pack.name} cardsQuantity={pack.cards_quantity} className="w-full h-full" />
                    ) : (
                      <img
                        src={loadTcgImg(pack.image_url)}
                        alt={pack.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    )}

                    {/* Reflexo metálico brilhante */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent pointer-events-none -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                    {/* Linha pontilhada de rasgo */}
                    <div className="absolute top-12 left-0 right-0 border-t-2 border-dashed border-amber-300/80 flex items-center justify-end px-3">
                      <span className="text-[10px] uppercase font-mono tracking-widest text-amber-200 bg-slate-900/80 px-1.5 py-0.5 rounded">
                        Rasgue aqui ✂️
                      </span>
                    </div>
                  </motion.div>

                  <Button
                    size="lg"
                    disabled={loading}
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black px-8 py-6 text-lg rounded-2xl shadow-xl shadow-amber-500/20 group-hover:scale-105 transition-transform"
                  >
                    <Sparkles className="size-5 mr-2" /> Rasgar e Abrir Pacote
                  </Button>
                </motion.div>
              )}

              {/* FASE 2: RASGANDO PACOTE */}
              {phase === "tearing" && (
                <motion.div
                  key="tearing"
                  className="relative w-64 sm:w-72 aspect-[1/1.5] flex flex-col items-center justify-center"
                >
                  {/* Topo do pacote rasgado voando */}
                  <motion.div
                    initial={{ y: 0, rotate: 0 }}
                    animate={{ y: -100, rotate: -20, opacity: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="w-full h-16 rounded-t-2xl overflow-hidden border-4 border-b-0 border-amber-400 shadow-xl"
                  >
                    {isStandardPack ? (
                      <div className="w-full h-72">
                        <BoosterPackArt name={pack.name} cardsQuantity={pack.cards_quantity} className="w-full h-full" />
                      </div>
                    ) : (
                      <img
                        src={loadTcgImg(pack.image_url)}
                        alt={pack.name}
                        className="w-full h-72 object-cover"
                      />
                    )}
                  </motion.div>

                  {/* Clarão de luz do interior do pacote */}
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: [0.5, 2.5], opacity: [0, 1, 0] }}
                    transition={{ duration: 0.6 }}
                    className="absolute inset-0 bg-white rounded-full blur-2xl pointer-events-none"
                  />

                  {/* Cartas brilhantes emergindo do interior do pacote */}
                  <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: -25, opacity: 0.9 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="absolute top-12 w-48 aspect-[2.5/3.5] rounded-xl bg-gradient-to-tr from-amber-400/30 via-indigo-500/20 to-amber-200/30 border-2 border-amber-400/60 shadow-[0_0_40px_rgba(245,158,11,0.5)] pointer-events-none -z-10"
                  />

                  {/* Corpo inferior do pacote */}
                  <motion.div
                    initial={{ y: 0 }}
                    animate={{ y: 40, opacity: 0.9 }}
                    transition={{ duration: 0.6 }}
                    className="w-full flex-1 rounded-b-2xl overflow-hidden border-4 border-t-0 border-amber-400 shadow-2xl"
                  >
                    {isStandardPack ? (
                      <div className="w-full h-72 -mt-16">
                        <BoosterPackArt name={pack.name} cardsQuantity={pack.cards_quantity} className="w-full h-full" />
                      </div>
                    ) : (
                      <img
                        src={loadTcgImg(pack.image_url)}
                        alt={pack.name}
                        className="w-full h-72 object-cover -mt-16"
                      />
                    )}
                  </motion.div>

                  {/* Indicador animado para nunca parecer travado */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -bottom-8 flex items-center gap-2 bg-slate-900/90 border border-amber-400/50 text-amber-300 font-mono text-xs px-3.5 py-1 rounded-full shadow-xl"
                  >
                    <Sparkles className="size-3.5 text-amber-400 animate-spin" />
                    <span>Liberando cartas do booster...</span>
                  </motion.div>
                </motion.div>
              )}

              {/* FASE 3: REVELANDO CARTAS UMA A UMA */}
              {phase === "revealing" && currentCard && (
                <motion.div
                  key={`card-${currentCardIndex}`}
                  initial={{ scale: 0.7, y: 50, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0.8, x: 200, opacity: 0 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col items-center gap-6"
                >
                  {/* Card Container com rotação 3D */}
                  <div
                    className="relative w-64 sm:w-72 aspect-[2.5/3.5] cursor-pointer"
                    style={{ perspective: 1200 }}
                    onClick={handleFlipCard}
                  >
                    <motion.div
                      animate={{ rotateY: isFlipped ? 180 : 0 }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      style={{ transformStyle: "preserve-3d" }}
                      className="w-full h-full relative"
                    >
                      {/* Suspense Glow para carta Rarity 5 antes de virar */}
                      {!isFlipped && currentCard.rarity === 5 && (
                        <div className="absolute -inset-3 rounded-3xl bg-gradient-to-r from-rose-500 via-amber-400 to-indigo-500 opacity-90 blur-xl animate-pulse pointer-events-none" />
                      )}

                      {/* LADO DA FRENTE (VERSO POKÉMON - ANTES DE VIRAR) */}
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

                      {/* LADO DA CARTA REVELADA (ROTACIONADA EM 180 DEG) */}
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

                        {/* Efeito Holográfico Cintilante se for Carta Rara ou Maior */}
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

                  {/* Informações da Carta Revelada */}
                  <div className="flex flex-col items-center gap-3 text-center min-h-[90px]">
                    {isFlipped ? (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center gap-2"
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={`${rarityConfig.badge} font-mono text-xs px-3 py-0.5 rounded-full`}>
                            {rarityConfig.label}
                          </Badge>
                          {currentCard.type && currentCard.type !== "none" && (
                            <Badge variant="outline" className="border-slate-600 font-mono text-xs text-slate-300">
                              {currentCard.type.toUpperCase()}
                            </Badge>
                          )}
                        </div>

                        <h3 className="text-xl sm:text-2xl font-black text-white">
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
                        Toque na carta ou use o botão para virar...
                      </p>
                    )}
                  </div>
                </motion.div>
              )}

              {/* FASE 4: RESUMO GERAL DAS CARTAS OBTIDAS */}
              {phase === "summary" && (
                <motion.div
                  key="summary"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full max-w-3xl flex flex-col items-center gap-6 max-h-[60vh] overflow-y-auto px-4 py-2"
                >
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center p-3 bg-amber-500/20 text-amber-400 rounded-full mb-3 border border-amber-500/30">
                      <Trophy className="size-8" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-white">
                      Pacote Aberto com Sucesso! 🎉
                    </h2>
                    <p className="text-sm text-slate-400 mt-1">
                      {cards.length} novas cartas adicionadas ao seu inventário.
                    </p>
                  </div>

                  {/* Badges de Destaque */}
                  <div className="flex flex-wrap items-center justify-center gap-3">
                    {legendariesCount > 0 && (
                      <Badge variant="outline" className="border-rose-500/40 bg-rose-500/10 text-rose-300 font-mono px-3 py-1">
                        👑 {legendariesCount} Lendárias
                      </Badge>
                    )}
                    {mythicsCount > 0 && (
                      <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-300 font-mono px-3 py-1">
                        ✨ {mythicsCount} Místicas
                      </Badge>
                    )}
                    {epicsCount > 0 && (
                      <Badge variant="outline" className="border-purple-500/40 bg-purple-500/10 text-purple-300 font-mono px-3 py-1">
                        💎 {epicsCount} Épicas
                      </Badge>
                    )}
                    {raresCount > 0 && (
                      <Badge variant="outline" className="border-sky-500/40 bg-sky-500/10 text-sky-300 font-mono px-3 py-1">
                        ⭐ {raresCount} Raras
                      </Badge>
                    )}
                  </div>

                  {/* Grid com todas as cartas */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 w-full pt-2">
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
            </AnimatePresence>
          </div>

          {/* Rodapé: Botões de Ação */}
          <div className="p-4 sm:p-6 border-t border-white/10 bg-slate-900/50 flex items-center justify-between z-10">
            {phase === "revealing" ? (
              <>
                <Button
                  variant="ghost"
                  onClick={handleRevealAll}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Revelar Todas Direto
                </Button>

                <div className="flex items-center gap-3">
                  {!isFlipped ? (
                    <Button
                      onClick={handleFlipCard}
                      className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-6"
                    >
                      Virar Carta
                    </Button>
                  ) : (
                    <Button
                      onClick={handleNextCard}
                      className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold px-6"
                    >
                      {currentCardIndex < cards.length - 1 ? (
                        <>Próxima Carta <ArrowRight className="size-4 ml-1.5" /></>
                      ) : (
                        <>Ver Resumo <CheckCircle2 className="size-4 ml-1.5" /></>
                      )}
                    </Button>
                  )}
                </div>
              </>
            ) : phase === "summary" ? (
              <div className="w-full flex flex-col gap-3">
                {/* Botão Concluir Proeminente com countdown */}
                <Button
                  onClick={() => {
                    if (summaryTimerRef.current) clearInterval(summaryTimerRef.current);
                    onClose();
                  }}
                  className="w-full h-12 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm rounded-xl shadow-lg shadow-amber-500/20"
                >
                  <CheckCircle2 className="size-4 mr-2" />
                  Concluir & Fechar
                  {summaryCountdown > 0 && (
                    <span className="ml-2 text-xs bg-slate-950/30 px-2 py-0.5 rounded-full font-mono">
                      {summaryCountdown}s
                    </span>
                  )}
                </Button>

                {/* Opções secundárias */}
                <div className="flex items-center justify-between gap-3">
                  <Button
                    variant="outline"
                    asChild
                    className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800 text-xs"
                  >
                    <Link href="/colecao" onClick={onClose}>
                      Ver Coleção
                    </Link>
                  </Button>
                  {pack.quantity > 1 && (
                    <Button
                      onClick={() => {
                        if (summaryTimerRef.current) clearInterval(summaryTimerRef.current);
                        handleOpenAnother();
                      }}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
                    >
                      <RotateCcw className="size-3.5 mr-1.5" /> Abrir Outro ({pack.quantity - 1}x)
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="w-full flex justify-end">
                <Button variant="ghost" onClick={onClose} className="text-slate-400 hover:text-white">
                  Fechar
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Universal de Detalhes da Carta */}
      <CardDetailModal
        isOpen={Boolean(inspectCard)}
        onClose={() => setInspectCard(null)}
        card={inspectCard}
      />

      {/* Celebração Cinemática de Máxima Raridade (Tier 5 / God Pull) */}
      <MaxRarityCelebration
        card={maxRarityCard}
        isOpen={Boolean(maxRarityCard)}
        onClose={() => setMaxRarityCard(null)}
      />
    </>
  );
}
