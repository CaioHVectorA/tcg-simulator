"use client";

import React from "react";
import { Sparkles } from "lucide-react";

interface BoosterPackArtProps {
  name: string;
  cardsQuantity?: number;
  className?: string;
  showCrimp?: boolean;
}

type ThemeConfig = {
  bgGradient: string;
  accentGradient: string;
  glowColor: string;
  borderColor: string;
  crimpColor: string;
  ballType: "poke" | "great" | "ultra" | "master" | "legendary" | "hazard" | "rainbow" | "celestial" | "void" | "elemental";
  badgeBg: string;
  foilSheen: string;
};

function getTheme(name: string): ThemeConfig {
  const lower = name.toLowerCase();

  // Pacote Mítico Celestial (Especial #1 - Ouro Divino Arceus)
  if (lower.includes("mítico") || lower.includes("mitico") || lower.includes("celestial")) {
    return {
      bgGradient: "from-amber-950 via-yellow-600 to-amber-400",
      accentGradient: "from-yellow-200 via-amber-300 to-yellow-500",
      glowColor: "rgba(251, 191, 36, 0.8)",
      borderColor: "border-amber-300 ring-2 ring-yellow-400/50",
      crimpColor: "bg-amber-500",
      ballType: "celestial",
      badgeBg: "bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-950 font-black",
      foilSheen: "from-yellow-200/50 via-white/60 to-transparent",
    };
  }

  // Pacote Vórtice Sombrio (Especial #2 - Dimensão Giratina)
  if (lower.includes("vórtice") || lower.includes("vortice") || lower.includes("sombrio")) {
    return {
      bgGradient: "from-black via-purple-950 to-zinc-950",
      accentGradient: "from-purple-500 via-rose-600 to-indigo-900",
      glowColor: "rgba(168, 85, 247, 0.8)",
      borderColor: "border-purple-500 ring-2 ring-purple-600/50",
      crimpColor: "bg-purple-950",
      ballType: "void",
      badgeBg: "bg-gradient-to-r from-purple-700 to-rose-600 text-white font-black",
      foilSheen: "from-purple-400/40 via-rose-300/40 to-transparent",
    };
  }

  // Pacote Tempestade Elemental
  if (lower.includes("tempestade") || lower.includes("elemental")) {
    return {
      bgGradient: "from-slate-950 via-cyan-950 to-blue-900",
      accentGradient: "from-amber-400 via-cyan-400 to-rose-500",
      glowColor: "rgba(6, 182, 212, 0.6)",
      borderColor: "border-cyan-400/80",
      crimpColor: "bg-cyan-800",
      ballType: "elemental",
      badgeBg: "bg-cyan-500 text-slate-950 font-bold",
      foilSheen: "from-cyan-300/40 via-amber-200/30 to-transparent",
    };
  }

  if (lower.includes("lendário") || lower.includes("lendario")) {
    return {
      bgGradient: "from-amber-700 via-amber-500 to-yellow-300",
      accentGradient: "from-amber-300 via-yellow-400 to-amber-600",
      glowColor: "rgba(245, 158, 11, 0.6)",
      borderColor: "border-amber-400/80",
      crimpColor: "bg-amber-600",
      ballType: "legendary",
      badgeBg: "bg-amber-400 text-slate-950",
      foilSheen: "from-yellow-200/30 via-white/40 to-transparent",
    };
  }

  if (lower.includes("tudo ou nada")) {
    return {
      bgGradient: "from-zinc-950 via-rose-950 to-red-800",
      accentGradient: "from-rose-500 via-red-600 to-zinc-900",
      glowColor: "rgba(225, 29, 72, 0.6)",
      borderColor: "border-rose-500/80",
      crimpColor: "bg-red-800",
      ballType: "hazard",
      badgeBg: "bg-rose-500 text-white",
      foilSheen: "from-rose-300/30 via-white/40 to-transparent",
    };
  }

  if (lower.includes("grande pacote épico") || lower.includes("grande pacote epico")) {
    return {
      bgGradient: "from-purple-900 via-pink-600 to-indigo-700",
      accentGradient: "from-cyan-400 via-fuchsia-400 to-amber-300",
      glowColor: "rgba(217, 70, 239, 0.6)",
      borderColor: "border-fuchsia-400/80",
      crimpColor: "bg-purple-800",
      ballType: "rainbow",
      badgeBg: "bg-gradient-to-r from-fuchsia-500 to-indigo-500 text-white",
      foilSheen: "from-cyan-300/40 via-pink-200/40 to-yellow-200/40",
    };
  }

  if (lower.includes("épico") || lower.includes("epico") || lower.includes("épicos") || lower.includes("epicos")) {
    return {
      bgGradient: "from-indigo-950 via-purple-900 to-violet-700",
      accentGradient: "from-fuchsia-500 to-purple-600",
      glowColor: "rgba(168, 85, 247, 0.6)",
      borderColor: "border-purple-400/80",
      crimpColor: "bg-purple-900",
      ballType: "master",
      badgeBg: "bg-purple-500 text-white",
      foilSheen: "from-purple-300/30 via-white/30 to-transparent",
    };
  }

  if (lower.includes("grande")) {
    return {
      bgGradient: "from-zinc-950 via-neutral-900 to-amber-950",
      accentGradient: "from-amber-400 via-yellow-500 to-amber-600",
      glowColor: "rgba(251, 191, 36, 0.5)",
      borderColor: "border-amber-400/80",
      crimpColor: "bg-amber-600",
      ballType: "ultra",
      badgeBg: "bg-amber-400 text-slate-950",
      foilSheen: "from-amber-200/30 via-white/30 to-transparent",
    };
  }

  if (lower.includes("raro")) {
    return {
      bgGradient: "from-sky-950 via-blue-900 to-cyan-700",
      accentGradient: "from-cyan-400 to-blue-500",
      glowColor: "rgba(14, 165, 233, 0.5)",
      borderColor: "border-sky-400/80",
      crimpColor: "bg-sky-800",
      ballType: "great",
      badgeBg: "bg-sky-500 text-white",
      foilSheen: "from-sky-200/30 via-white/30 to-transparent",
    };
  }

  // Pacote simples / padrão
  return {
    bgGradient: "from-slate-950 via-red-950 to-slate-900",
    accentGradient: "from-red-500 to-rose-600",
    glowColor: "rgba(239, 68, 68, 0.4)",
    borderColor: "border-red-500/70",
    crimpColor: "bg-red-800",
    ballType: "poke",
    badgeBg: "bg-red-500 text-white",
    foilSheen: "from-red-200/20 via-white/30 to-transparent",
  };
}

export function BoosterPackArt({
  name,
  cardsQuantity,
  className = "",
  showCrimp = true,
}: BoosterPackArtProps) {
  const theme = getTheme(name);

  return (
    <div
      className={`relative w-full aspect-[1/1.48] rounded-xl overflow-hidden shadow-xl border-2 ${theme.borderColor} flex flex-col justify-between select-none group bg-gradient-to-b ${theme.bgGradient} ${className}`}
      style={{
        boxShadow: `0 10px 30px -5px ${theme.glowColor}`,
      }}
    >
      {/* Crimp Superior (Borda de lacre serrilhada) */}
      {showCrimp && (
        <div className={`h-4 w-full ${theme.crimpColor} flex items-center justify-center relative overflow-hidden border-b border-black/30 shadow-inner z-10`}>
          <div className="absolute inset-0 opacity-40 bg-[repeating-linear-gradient(90deg,transparent,transparent_3px,rgba(0,0,0,0.5)_3px,rgba(0,0,0,0.5)_6px)]" />
          <div className="w-12 h-1 rounded-full bg-white/30" />
        </div>
      )}

      {/* Foil Background Sheen Lines */}
      <div className="absolute inset-0 pointer-events-none opacity-30 mix-blend-overlay bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-transparent to-black" />

      {/* Dynamic Metallic Foil Sweep Effect */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out z-20" />

      {/* Conteúdo Central do Pacote */}
      <div className="flex-1 flex flex-col items-center justify-between p-3.5 sm:p-4 text-center z-10">
        {/* Header da Marca */}
        <div className="w-full">
          {/* <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-black/50 border border-white/20 backdrop-blur-xs text-[9px] uppercase tracking-widest font-mono text-white/90 mb-1">
            <Sparkles className="size-2.5 text-amber-400 animate-spin" />
            <span>Pokémon TCG</span>
          </div> */}
          <h3 className="font-syne font-black text-lg sm:text-xl text-white tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] line-clamp-2">
            {name}
          </h3>
        </div>

        {/* Emblema Esférico Central */}
        <div className="relative my-auto flex items-center justify-center">
          {/* Aura pulsante */}
          <div
            className="absolute size-24 sm:size-28 rounded-full blur-xl opacity-60 animate-pulse pointer-events-none"
            style={{ backgroundColor: theme.glowColor }}
          />

          {/* Emblema de Bola */}
          <div className="size-20 sm:size-24 rounded-full border-4 border-white/80 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center bg-slate-900 group-hover:scale-110 transition-transform duration-300">
            {theme.ballType === "poke" && (
              <>
                <div className="w-full h-1/2 bg-gradient-to-b from-red-500 to-red-600 border-b-2 border-slate-950" />
                <div className="w-full h-1/2 bg-gradient-to-t from-white to-slate-200" />
              </>
            )}

            {theme.ballType === "great" && (
              <>
                <div className="w-full h-1/2 bg-gradient-to-b from-blue-600 to-sky-500 relative border-b-2 border-slate-950">
                  <div className="absolute top-1 left-2 size-3 bg-red-600 rounded-sm rotate-45" />
                  <div className="absolute top-1 right-2 size-3 bg-red-600 rounded-sm rotate-45" />
                </div>
                <div className="w-full h-1/2 bg-gradient-to-t from-white to-slate-200" />
              </>
            )}

            {theme.ballType === "ultra" && (
              <>
                <div className="w-full h-1/2 bg-gradient-to-b from-zinc-900 to-black relative border-b-2 border-slate-950">
                  <div className="absolute inset-x-2 top-1 h-2 bg-amber-400 rounded-sm" />
                </div>
                <div className="w-full h-1/2 bg-gradient-to-t from-white to-slate-200" />
              </>
            )}

            {theme.ballType === "master" && (
              <>
                <div className="w-full h-1/2 bg-gradient-to-b from-purple-800 to-indigo-900 relative border-b-2 border-slate-950 flex items-center justify-center">
                  <span className="text-white font-black font-syne text-xs z-10 drop-shadow">M</span>
                  <div className="absolute top-1 left-1.5 size-3 bg-pink-500 rounded-full" />
                  <div className="absolute top-1 right-1.5 size-3 bg-pink-500 rounded-full" />
                </div>
                <div className="w-full h-1/2 bg-gradient-to-t from-white to-slate-200" />
              </>
            )}

            {theme.ballType === "legendary" && (
              <>
                <div className="w-full h-1/2 bg-gradient-to-b from-amber-400 via-yellow-300 to-amber-500 border-b-2 border-slate-950 relative flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 bg-yellow-200/40 mix-blend-overlay" />
                  <Sparkles className="size-4 text-amber-950 animate-pulse relative z-10" />
                </div>
                <div className="w-full h-1/2 bg-gradient-to-t from-slate-100 to-amber-100" />
              </>
            )}

            {theme.ballType === "hazard" && (
              <>
                <div className="w-full h-1/2 bg-gradient-to-b from-rose-700 to-red-900 border-b-2 border-slate-950 relative flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 opacity-25 bg-[repeating-linear-gradient(45deg,#000,#000_3px,transparent_3px,transparent_6px)]" />
                  <span className="text-white font-black text-[10px] font-mono relative z-10">⚠️</span>
                </div>
                <div className="w-full h-1/2 bg-gradient-to-t from-zinc-800 to-zinc-950" />
              </>
            )}

            {theme.ballType === "rainbow" && (
              <>
                <div className="w-full h-1/2 bg-gradient-to-r from-red-500 via-amber-400 via-emerald-400 to-cyan-500 border-b-2 border-slate-950 relative flex items-center justify-center" />
                <div className="w-full h-1/2 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500" />
              </>
            )}

            {theme.ballType === "celestial" && (
              <>
                <div className="w-full h-1/2 bg-gradient-to-b from-yellow-200 via-amber-400 to-yellow-500 border-b-2 border-slate-950 relative flex items-center justify-center overflow-hidden">
                  <div className="size-5 rounded-full border-2 border-amber-950/70 animate-spin" style={{ animationDuration: '6s' }} />
                  <div className="absolute inset-0 bg-yellow-100/30 mix-blend-overlay" />
                </div>
                <div className="w-full h-1/2 bg-gradient-to-t from-white via-amber-50 to-slate-100" />
              </>
            )}

            {theme.ballType === "void" && (
              <>
                <div className="w-full h-1/2 bg-gradient-to-b from-zinc-950 via-purple-950 to-slate-950 border-b-2 border-slate-950 relative flex items-center justify-center overflow-hidden">
                  <div className="size-3.5 rounded-full bg-rose-600/70 blur-xs animate-ping" />
                  <div className="absolute inset-x-1 top-1 h-1 bg-purple-500/80 rounded-full" />
                </div>
                <div className="w-full h-1/2 bg-gradient-to-t from-purple-950 to-zinc-900" />
              </>
            )}

            {theme.ballType === "elemental" && (
              <>
                <div className="w-full h-1/2 bg-gradient-to-r from-red-600 via-amber-400 to-blue-600 border-b-2 border-slate-950 relative flex items-center justify-center" />
                <div className="w-full h-1/2 bg-gradient-to-t from-white to-slate-200" />
              </>
            )}

            {/* Centro Botão da Bola */}
            <div className="absolute size-6 rounded-full bg-white border-2 border-slate-950 shadow-md flex items-center justify-center z-10">
              <div className="size-2.5 rounded-full bg-slate-200 border border-slate-400" />
            </div>
          </div>
        </div>

        {/* Rodapé do Pacote: Quantidade de Cartas & Selo */}
        <div className="w-full flex items-center justify-between text-left mt-auto">
          {cardsQuantity ? (
            <span className={`px-2 py-0.5 rounded-md font-mono font-bold text-[10px] sm:text-[11px] shadow-sm ${theme.badgeBg}`}>
              {cardsQuantity} CARTAS
            </span>
          ) : (
            <span className={`px-2 py-0.5 rounded-md font-mono font-bold text-[10px] sm:text-[11px] shadow-sm ${theme.badgeBg}`}>
              BOOSTER
            </span>
          )}
          {/* 
          <span className="text-[9px] font-mono text-white/70 uppercase tracking-widest drop-shadow">
            Oficial SimTCG
          </span> */}
        </div>
      </div>

      {/* Crimp Inferior (Borda de lacre serrilhada) */}
      {showCrimp && (
        <div className={`h-4 w-full ${theme.crimpColor} flex items-center justify-center relative overflow-hidden border-t border-black/30 shadow-inner z-10`}>
          <div className="absolute inset-0 opacity-40 bg-[repeating-linear-gradient(90deg,transparent,transparent_3px,rgba(0,0,0,0.5)_3px,rgba(0,0,0,0.5)_6px)]" />
          <div className="w-12 h-1 rounded-full bg-white/30" />
        </div>
      )}
    </div>
  );
}
