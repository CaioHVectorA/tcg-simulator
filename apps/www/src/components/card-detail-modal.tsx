"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TcgCardImage } from "./tcg-card-image";
import { Sparkles, Heart, Tag, Coins, Rotate3d, Compass } from "lucide-react";
import { useTranslation } from "@/i18n/LanguageContext";

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

const TYPE_COLORS: Record<string, string> = {
  FIRE: "bg-red-500/20 text-red-400 border-red-500/40",
  WATER: "bg-blue-500/20 text-blue-400 border-blue-500/40",
  GRASS: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
  ELECTRIC: "bg-yellow-500/20 text-yellow-400 border-yellow-500/40",
  PSYCHIC: "bg-purple-500/20 text-purple-400 border-purple-500/40",
  FIGHTING: "bg-amber-700/20 text-amber-500 border-amber-700/40",
  DRAGON: "bg-indigo-500/20 text-indigo-400 border-indigo-500/40",
  NORMAL: "bg-zinc-500/20 text-zinc-300 border-zinc-500/40",
  DARK: "bg-slate-800 text-slate-200 border-slate-600",
  METAL: "bg-slate-400/20 text-slate-300 border-slate-400/40",
};

// Verso da Carta estilo Pokémon Oficial
function PokemonCardBack() {
  return (
    <div className="w-full aspect-[2.5/3.5] rounded-2xl bg-gradient-to-br from-blue-950 via-indigo-950 to-slate-950 p-3 shadow-2xl border-4 border-amber-500/70 flex items-center justify-center relative overflow-hidden select-none">
      <div className="absolute inset-0 opacity-25 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-400 via-transparent to-transparent pointer-events-none" />
      <div className="w-full h-full border-2 border-amber-400/40 rounded-xl flex flex-col items-center justify-center p-4 relative">
        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-slate-900 bg-gradient-to-b from-red-600 50% to-white 50% relative flex items-center justify-center shadow-2xl shadow-black/80">
          <div className="w-full h-3 bg-slate-900 absolute" />
          <div className="w-10 h-10 rounded-full bg-white border-4 border-slate-900 flex items-center justify-center z-10 shadow-md">
            <div className="size-4 rounded-full bg-slate-200 border border-slate-400 animate-pulse" />
          </div>
        </div>
        <span className="font-syne font-black text-[11px] tracking-widest text-amber-400/90 uppercase mt-4 drop-shadow-md">
          POKÉMON TCG
        </span>
      </div>
    </div>
  );
}

export const CardDetailModal: React.FC<CardDetailModalProps> = ({
  card,
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  if (!card) return null;

  const RARITY_LABELS: Record<number, { label: string; color: string; stars: string }> = {
    1: { label: t("rarities.tier1"), color: "bg-slate-500/20 text-slate-300 border-slate-500/40", stars: "★" },
    2: { label: t("rarities.tier2"), color: "bg-blue-500/20 text-blue-400 border-blue-500/40", stars: "★★" },
    3: { label: t("rarities.tier3"), color: "bg-purple-500/20 text-purple-400 border-purple-500/40", stars: "★★★" },
    4: { label: t("rarities.tier4"), color: "bg-amber-500/20 text-amber-300 border-amber-500/40", stars: "★★★★" },
    5: { label: t("rarities.tier5"), color: "bg-gradient-to-r from-rose-500/20 via-purple-500/20 to-amber-500/20 text-rose-300 border-rose-400/50", stars: "★★★★★" },
  };

  const VALUATION_CONFIG: Record<number, { text: string; subtext: string; isLuxury: boolean }> = {
    1: { text: "100 ~ 500", subtext: t("common.coins"), isLuxury: false },
    2: { text: "1.500 ~ 5.000", subtext: t("common.coins"), isLuxury: false },
    3: { text: "35.000 ~ 120.000", subtext: t("common.coins"), isLuxury: false },
    4: { text: "1.200.000 ~ 4.500.000", subtext: `${t("common.coins")} (7 ${t("collection.digits")})`, isLuxury: true },
    5: { text: "8.000.000 ~ 25.000.000", subtext: `${t("common.coins")} (8 ${t("collection.digits")})`, isLuxury: true },
  };

  const rarityInfo = RARITY_LABELS[card.rarity] || RARITY_LABELS[1];
  const typeKey = (card.type || "NORMAL").toUpperCase();
  const typeStyle = TYPE_COLORS[typeKey] || TYPE_COLORS.NORMAL;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });
  };

  const rotY = isHovered ? (mousePos.x - 50) * 0.4 : 0;
  const rotX = isHovered ? -(mousePos.y - 50) * 0.4 : 0;
  const shadowX = -(mousePos.x - 50) * 0.5;
  const shadowY = (mousePos.y - 50) * 0.5 + 10;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl bg-card/95 border-border backdrop-blur-2xl font-syne p-6 sm:p-8 shadow-2xl rounded-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>{card.name}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Card 3D Inspector */}
          <div className="flex flex-col items-center gap-3">
            <div
              className="relative rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing mx-auto max-w-[280px] w-full select-none"
              onMouseMove={handleMouseMove}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => {
                setIsHovered(false);
                setMousePos({ x: 50, y: 50 });
              }}
              onClick={() => setIsFlipped(!isFlipped)}
              style={{
                perspective: 1000,
                transform: `perspective(1000px) rotateY(${rotY}deg) rotateX(${rotX}deg) scale3d(${isHovered ? 1.05 : 1}, ${isHovered ? 1.05 : 1}, 1)`,
                boxShadow: isHovered
                  ? `${shadowX}px ${shadowY}px 35px rgba(0,0,0,0.5), 0 0 25px ${card.rarity >= 4 ? "rgba(251,191,36,0.3)" : "rgba(99,102,241,0.2)"}`
                  : "0 10px 25px rgba(0,0,0,0.3)",
                transition: isHovered ? "transform 0.08s ease-out, box-shadow 0.15s ease-out" : "transform 0.4s ease-out, box-shadow 0.4s ease-out",
              }}
            >
              {!isFlipped ? (
                <div className="relative">
                  <TcgCardImage
                    src={card.image_url}
                    alt={card.name}
                    className="w-full aspect-[2.5/3.5] object-cover rounded-2xl border-2 border-white/15"
                  />

                  {/* Efeito Holográfico & Glare Glint */}
                  {isHovered && (
                    <>
                      {/* Efeito Brilho / Glare Especular */}
                      <div
                        className="absolute inset-0 pointer-events-none rounded-2xl opacity-40 mix-blend-overlay transition-opacity"
                        style={{
                          background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.2) 35%, transparent 65%)`,
                        }}
                      />

                      {/* Foil Holográfico Prismático para Tier 3+ */}
                      {card.rarity >= 3 && (
                        <div
                          className="absolute inset-0 pointer-events-none rounded-2xl opacity-50 mix-blend-color-dodge transition-opacity"
                          style={{
                            background: `linear-gradient(${mousePos.x * 3.6}deg, rgba(255,0,128,0.35) 0%, rgba(0,255,255,0.35) 25%, rgba(255,255,0,0.35) 50%, rgba(0,255,128,0.35) 75%, rgba(255,0,255,0.35) 100%)`,
                          }}
                        />
                      )}

                      {/* God Pull Aura para Tier 5 */}
                      {card.rarity === 5 && (
                        <div className="absolute inset-0 pointer-events-none rounded-2xl border-2 border-rose-400 animate-pulse shadow-[inset_0_0_20px_rgba(244,63,94,0.6)]" />
                      )}
                    </>
                  )}
                </div>
              ) : (
                <PokemonCardBack />
              )}
            </div>

            {/* Controles do Inspector 3D */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFlipped(!isFlipped)}
                className="h-8 text-xs font-semibold gap-1.5 rounded-full px-3"
              >
                <Rotate3d className="size-3.5 text-amber-500" />
                <span>{isFlipped ? "Ver Frente" : "Ver Verso"}</span>
              </Button>
              <Badge variant="secondary" className="text-[10px] font-mono gap-1 text-muted-foreground">
                <Compass className="size-3" /> Mova o mouse para girar em 3D
              </Badge>
            </div>
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
                  <span className="text-[11px] text-muted-foreground block font-sans">{t("collection.hpLabel")}</span>
                  <span className="text-lg font-bold font-mono">{card.hp ? `${card.hp} HP` : "N/A"}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 bg-accent/40 rounded-xl p-3">
                <Sparkles className="size-5 text-amber-400" />
                <div>
                  <span className="text-[11px] text-muted-foreground block font-sans">{t("common.rarity")}</span>
                  <span className="text-lg font-bold font-mono">Tier {card.rarity}</span>
                </div>
              </div>
            </div>

            {/* Valuation de Mercado Estimado */}
            <div className={`rounded-xl p-3 border transition-all ${
              (VALUATION_CONFIG[card.rarity] || VALUATION_CONFIG[1]).isLuxury
                ? "bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-amber-500/5 border-amber-500/40 shadow-sm shadow-amber-500/10"
                : "bg-accent/40 border-border/60"
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Coins className="size-4 text-amber-500" /> {t("collection.marketValuation")}
                </span>
                {(VALUATION_CONFIG[card.rarity] || VALUATION_CONFIG[1]).isLuxury && (
                  <Badge className="bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-[10px] uppercase tracking-wider px-2 py-0.5 shadow-sm">
                    ✨ {t("collection.luxuryItem")}
                  </Badge>
                )}
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <span className={`text-lg font-black font-mono ${(VALUATION_CONFIG[card.rarity] || VALUATION_CONFIG[1]).isLuxury ? "text-amber-400 drop-shadow-sm" : "text-foreground"}`}>
                  {(VALUATION_CONFIG[card.rarity] || VALUATION_CONFIG[1]).text}
                </span>
                <span className="text-[11px] text-muted-foreground font-sans">
                  {(VALUATION_CONFIG[card.rarity] || VALUATION_CONFIG[1]).subtext}
                </span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
