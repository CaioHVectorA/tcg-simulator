"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { soundFx } from "@/lib/sound-fx";
import { loadTcgImg } from "@/lib/load-tcg-img";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Star, Flame, Eye, ArrowRight, Trophy } from "lucide-react";
import { CardDetailModal, CardModalData } from "./card-detail-modal";

export interface MaxRarityCelebrationProps {
  card: {
    id: number | string;
    name: string;
    image_url: string;
    rarity: number;
    hp?: number;
    type?: string;
    card_id?: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

export function MaxRarityCelebration({
  card,
  isOpen,
  onClose,
}: MaxRarityCelebrationProps) {
  const [inspectOpen, setInspectOpen] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (isOpen && card) {
      soundFx.playGodPullFanfare();
    }
  }, [isOpen, card]);

  if (!isOpen || !card) return null;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  const cardImg = loadTcgImg(card.image_url);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[99999] flex flex-col items-center justify-center p-4 overflow-hidden font-syne select-none"
        onMouseMove={handleMouseMove}
      >
        {/* Backdrop escuro com nébula cósmica */}
        <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-xl" />

        {/* Efeito de Flash de Luz Cósmica no Início */}
        <motion.div
          initial={{ opacity: 1, scale: 0.1 }}
          animate={{ opacity: 0, scale: 3 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute inset-0 bg-radial from-amber-200 via-rose-500 to-transparent pointer-events-none"
        />

        {/* Raios de Solburst Giratórios de Fundo */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="absolute size-[800px] sm:size-[1200px] opacity-25 pointer-events-none"
          style={{
            background:
              "conic-gradient(from 0deg, rgba(234,179,8,0.4) 0deg 20deg, transparent 20deg 40deg, rgba(244,63,94,0.4) 40deg 60deg, transparent 60deg 80deg, rgba(234,179,8,0.4) 80deg 100deg, transparent 100deg 120deg, rgba(168,85,247,0.4) 120deg 140deg, transparent 140deg 160deg, rgba(234,179,8,0.4) 160deg 180deg, transparent 180deg 200deg, rgba(244,63,94,0.4) 200deg 220deg, transparent 220deg 240deg, rgba(234,179,8,0.4) 240deg 260deg, transparent 260deg 280deg, rgba(168,85,247,0.4) 280deg 300deg, transparent 300deg 320deg, rgba(234,179,8,0.4) 320deg 340deg, transparent 340deg 360deg)",
          }}
        />

        {/* Anéis de Energia Pulsantes */}
        <motion.div
          animate={{ scale: [1, 1.15, 1], rotate: [0, -180, -360] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute size-[380px] sm:size-[560px] rounded-full border-2 border-dashed border-amber-400/40 pointer-events-none shadow-[0_0_80px_rgba(234,179,8,0.3)]"
        />
        <motion.div
          animate={{ scale: [1.1, 0.95, 1.1], rotate: [0, 180, 360] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute size-[320px] sm:size-[480px] rounded-full border border-rose-500/50 pointer-events-none shadow-[0_0_100px_rgba(244,63,94,0.4)]"
        />

        {/* Conteúdo Central */}
        <div className="relative z-10 flex flex-col items-center text-center max-w-xl mx-auto">
          {/* Header Badge com Fogo e Estrelas */}
          <motion.div
            initial={{ scale: 0, y: -30 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 260, damping: 20 }}
            className="flex flex-col items-center gap-2 mb-4"
          >
            <div className="inline-flex items-center gap-2 px-5 py-1.5 rounded-full bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 text-white font-black text-xs sm:text-sm tracking-widest shadow-[0_0_30px_rgba(244,63,94,0.8)] uppercase animate-pulse">
              <Flame className="size-4 fill-white" />
              <span>✨ GOD PULL! MÁXIMA RARIDADE ✨</span>
              <Flame className="size-4 fill-white" />
            </div>

            {/* Estrelas douradas cintilantes */}
            <div className="flex items-center gap-1.5 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4 + i * 0.1, type: "spring" }}
                >
                  <Star className="size-4 sm:size-5 fill-amber-400 drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]" />
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Carta 3D Flutuante com Tilt Interativo */}
          <motion.div
            initial={{ scale: 0.2, y: 80, rotateZ: -10 }}
            animate={{ scale: 1, y: 0, rotateZ: 0 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 180, damping: 15 }}
            style={{
              perspective: 1000,
              rotateX: mousePos.y * -20,
              rotateY: mousePos.x * 20,
            }}
            className="relative w-64 sm:w-80 aspect-[2.5/3.5] rounded-2xl cursor-pointer group mb-5 transition-transform duration-100 ease-out"
            onClick={() => setInspectOpen(true)}
          >
            {/* Halo de Brilho Extremo atrás da carta */}
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-amber-400 via-rose-500 to-indigo-500 opacity-80 blur-2xl group-hover:opacity-100 transition-opacity animate-pulse" />

            <div className="relative w-full h-full rounded-2xl overflow-hidden border-4 border-amber-300 shadow-[0_0_60px_rgba(234,179,8,0.9)] bg-slate-900">
              <img
                src={cardImg}
                alt={card.name}
                className="w-full h-full object-cover rounded-xl"
              />

              {/* Camada de Foil Holográfico Arco-íris */}
              <div
                className="absolute inset-0 pointer-events-none opacity-60 mix-blend-color-dodge transition-opacity duration-300"
                style={{
                  background: `linear-gradient(${115 + mousePos.x * 60}deg, rgba(255,255,255,0.8) 0%, rgba(255,0,128,0.5) 25%, rgba(0,255,255,0.6) 50%, rgba(255,215,0,0.5) 75%, transparent 100%)`,
                }}
              />

              {/* Brilho cintilante dinâmico */}
              <div
                className="absolute inset-0 pointer-events-none opacity-40 bg-radial from-white via-transparent to-transparent"
                style={{
                  transform: `translate(${mousePos.x * 100}px, ${mousePos.y * 100}px)`,
                }}
              />
            </div>
          </motion.div>

          {/* Nome e Raridade da Carta */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col items-center gap-1.5 mb-6"
          >
            <h2 className="text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-white to-amber-300 drop-shadow-[0_2px_12px_rgba(234,179,8,0.7)]">
              {card.name}
            </h2>
            <div className="flex items-center gap-2">
              <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/60 font-mono text-xs px-3">
                RARIDADE ULTRA RARA ★★★★★
              </Badge>
              {card.hp && (
                <Badge variant="outline" className="border-amber-400/40 text-amber-300 font-mono text-xs">
                  {card.hp} HP
                </Badge>
              )}
            </div>
          </motion.div>

          {/* Botões de Ação */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex items-center gap-3 w-full sm:w-auto"
          >
            <Button
              variant="outline"
              size="lg"
              onClick={() => setInspectOpen(true)}
              className="rounded-2xl border-white/20 hover:bg-white/10 text-white font-bold h-12 px-6 gap-2 text-sm"
            >
              <Eye className="size-4" />
              Inspecionar Carta
            </Button>

            <Button
              size="lg"
              onClick={onClose}
              className="rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold h-12 px-8 gap-2 text-sm shadow-[0_0_25px_rgba(234,179,8,0.5)]"
            >
              <span>Continuar</span>
              <ArrowRight className="size-4" />
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Modal de Detalhes da Carta */}
      <CardDetailModal
        card={inspectOpen ? (card as CardModalData) : null}
        isOpen={inspectOpen}
        onClose={() => setInspectOpen(false)}
      />
    </AnimatePresence>
  );
}
