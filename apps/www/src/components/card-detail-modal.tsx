"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { loadTcgImg } from "@/lib/load-tcg-img";
import { Sparkles, Shield, Heart, Tag, Layers } from "lucide-react";

export interface CardModalData {
  id: number;
  name: string;
  image_url: string;
  rarity: number;
  hp?: number;
  type?: string;
  card_id?: string;
  ownedCount?: number;
}

interface CardDetailModalProps {
  card: CardModalData | null;
  isOpen: boolean;
  onClose: () => void;
}

const RARITY_LABELS: Record<number, { label: string; color: string; stars: string }> = {
  1: { label: "Comum", color: "bg-slate-500/20 text-slate-300 border-slate-500/40", stars: "★" },
  2: { label: "Rara", color: "bg-blue-500/20 text-blue-400 border-blue-500/40", stars: "★★" },
  3: { label: "Épica", color: "bg-purple-500/20 text-purple-400 border-purple-500/40", stars: "★★★" },
  4: { label: "Lendária", color: "bg-amber-500/20 text-amber-300 border-amber-500/40", stars: "★★★★" },
  5: { label: "Ultra / Full Art", color: "bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-amber-500/20 text-amber-300 border-amber-400/50", stars: "★★★★★" },
};

const TYPE_COLORS: Record<string, string> = {
  FIRE: "bg-red-500/20 text-red-400 border-red-500/40",
  WATER: "bg-blue-500/20 text-blue-400 border-blue-500/40",
  GRASS: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
  ELECTRIC: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
  PSYCHIC: "bg-purple-500/20 text-purple-400 border-purple-500/40",
  FIGHTING: "bg-amber-700/20 text-amber-500 border-amber-700/40",
  DRAGON: "bg-indigo-500/20 text-indigo-400 border-indigo-500/40",
  NORMAL: "bg-zinc-500/20 text-zinc-300 border-zinc-500/40",
};

export const CardDetailModal: React.FC<CardDetailModalProps> = ({
  card,
  isOpen,
  onClose,
}) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  if (!card) return null;

  const rarityInfo = RARITY_LABELS[card.rarity] || RARITY_LABELS[1];
  const typeKey = (card.type || "NORMAL").toUpperCase();
  const typeStyle = TYPE_COLORS[typeKey] || TYPE_COLORS.NORMAL;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl bg-card/95 border-border backdrop-blur-xl font-syne p-6 sm:p-8">
        <DialogHeader className="sr-only">
          <DialogTitle>{card.name}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Visual Card Display com Efeito Holográfico */}
          <div
            className="relative rounded-2xl overflow-hidden shadow-2xl transition-transform duration-300 mx-auto max-w-[280px] w-full cursor-pointer group"
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
              transform: isHovered
                ? `perspective(800px) rotateY(${(mousePos.x - 50) * 0.25}deg) rotateX(${-(mousePos.y - 50) * 0.25}deg) scale3d(1.03, 1.03, 1.03)`
                : "perspective(800px) rotateY(0deg) rotateX(0deg) scale3d(1, 1, 1)",
            }}
          >
            <img
              src={loadTcgImg(card.image_url)}
              alt={card.name}
              className="w-full aspect-[2.5/3.5] object-cover rounded-2xl border border-white/10"
            />

            {/* Foil Holográfico Overlay */}
            {isHovered && card.rarity >= 3 && (
              <div
                className="absolute inset-0 pointer-events-none rounded-2xl opacity-60 mix-blend-color-dodge transition-opacity"
                style={{
                  background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(255,255,255,0.8) 0%, rgba(255,0,128,0.3) 30%, rgba(0,255,255,0.3) 60%, transparent 80%)`,
                }}
              />
            )}
          </div>

          {/* Card Meta & Stats */}
          <div className="flex flex-col gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Badge variant="outline" className={`${rarityInfo.color} font-mono text-xs px-2.5 py-0.5 rounded-full`}>
                  {rarityInfo.stars} {rarityInfo.label}
                </Badge>
                {card.type && card.type !== "none" && (
                  <Badge variant="outline" className={`${typeStyle} font-mono text-xs px-2.5 py-0.5 rounded-full`}>
                    {card.type.toUpperCase()}
                  </Badge>
                )}
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                {card.name}
              </h2>
              {card.card_id && (
                <p className="text-xs text-muted-foreground font-mono mt-0.5 flex items-center gap-1">
                  <Tag className="size-3" /> ID: {card.card_id}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 py-3 border-y border-border/60">
              <div className="flex items-center gap-2.5 bg-accent/40 rounded-xl p-3">
                <Heart className="size-5 text-red-500" />
                <div>
                  <span className="text-[11px] text-muted-foreground block font-sans">Pontos de Vida</span>
                  <span className="text-lg font-bold font-mono">{card.hp ? `${card.hp} HP` : "N/A"}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 bg-accent/40 rounded-xl p-3">
                <Sparkles className="size-5 text-amber-400" />
                <div>
                  <span className="text-[11px] text-muted-foreground block font-sans">Raridade</span>
                  <span className="text-lg font-bold font-mono">Tier {card.rarity}</span>
                </div>
              </div>
            </div>

            {card.ownedCount !== undefined && (
              <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-xl p-3">
                <span className="text-sm font-semibold flex items-center gap-2">
                  <Layers className="size-4 text-primary" /> Cópias na sua coleção:
                </span>
                <Badge className="font-mono text-sm px-2.5 py-0.5 bg-primary text-primary-foreground">
                  {card.ownedCount}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
