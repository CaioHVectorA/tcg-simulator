"use client";

import React from "react";
import { Sparkles } from "lucide-react";

interface BoosterPackArtProps {
  name: string;
  cardsQuantity?: number;
  className?: string;
  showCrimp?: boolean;
  logoUrl?: string;
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

  // 151 — Coleção Clássica
  if (lower.includes("151")) {
    return {
      bgGradient: "from-slate-900 via-rose-950 to-slate-950",
      accentGradient: "from-rose-500 via-amber-300 to-sky-400",
      glowColor: "rgba(244, 63, 94, 0.7)",
      borderColor: "border-rose-400/80 ring-1 ring-rose-400/30",
      crimpColor: "bg-rose-900",
      ballType: "rainbow",
      badgeBg: "bg-gradient-to-r from-rose-500 to-amber-400 text-slate-950 font-black",
      foilSheen: "from-rose-300/40 via-white/50 to-transparent",
    };
  }

  // Fenda Paradoxal
  if (lower.includes("fenda") || lower.includes("paradoxal")) {
    return {
      bgGradient: "from-slate-950 via-cyan-950 to-amber-950",
      accentGradient: "from-cyan-400 via-emerald-400 to-amber-400",
      glowColor: "rgba(6, 182, 212, 0.7)",
      borderColor: "border-cyan-400/80 ring-1 ring-cyan-400/30",
      crimpColor: "bg-cyan-900",
      ballType: "elemental",
      badgeBg: "bg-cyan-500 text-slate-950 font-black",
      foilSheen: "from-cyan-300/40 via-white/50 to-transparent",
    };
  }

  // Coroa Estelar
  if (lower.includes("coroa") || lower.includes("estelar")) {
    return {
      bgGradient: "from-indigo-950 via-purple-900 to-sky-950",
      accentGradient: "from-sky-300 via-indigo-300 to-amber-200",
      glowColor: "rgba(168, 85, 247, 0.7)",
      borderColor: "border-purple-400/80 ring-1 ring-purple-400/30",
      crimpColor: "bg-indigo-900",
      ballType: "celestial",
      badgeBg: "bg-gradient-to-r from-purple-400 to-sky-300 text-slate-950 font-black",
      foilSheen: "from-purple-300/40 via-white/60 to-transparent",
    };
  }

  // Forças Temporais
  if (lower.includes("temporais") || lower.includes("forças") || lower.includes("forcas")) {
    return {
      bgGradient: "from-zinc-950 via-teal-950 to-blue-950",
      accentGradient: "from-teal-400 via-cyan-400 to-indigo-500",
      glowColor: "rgba(20, 184, 166, 0.7)",
      borderColor: "border-teal-400/80",
      crimpColor: "bg-teal-900",
      ballType: "elemental",
      badgeBg: "bg-teal-400 text-slate-950 font-bold",
      foilSheen: "from-teal-300/40 via-white/50 to-transparent",
    };
  }

  // Máscaras do Crepúsculo
  if (lower.includes("máscaras") || lower.includes("mascaras") || lower.includes("crepúsculo") || lower.includes("crepusculo")) {
    return {
      bgGradient: "from-emerald-950 via-teal-950 to-indigo-950",
      accentGradient: "from-teal-300 via-emerald-400 to-purple-400",
      glowColor: "rgba(16, 185, 129, 0.7)",
      borderColor: "border-teal-400/80",
      crimpColor: "bg-teal-900",
      ballType: "great",
      badgeBg: "bg-teal-500 text-slate-950 font-bold",
      foilSheen: "from-teal-300/40 via-white/50 to-transparent",
    };
  }

  // Fábulas Nebulosas
  if (lower.includes("fábulas") || lower.includes("fabulas") || lower.includes("nebulosas")) {
    return {
      bgGradient: "from-purple-950 via-violet-900 to-amber-950",
      accentGradient: "from-purple-300 via-pink-400 to-amber-300",
      glowColor: "rgba(192, 132, 252, 0.7)",
      borderColor: "border-purple-400/80",
      crimpColor: "bg-purple-900",
      ballType: "celestial",
      badgeBg: "bg-purple-400 text-slate-950 font-bold",
      foilSheen: "from-purple-300/40 via-white/50 to-transparent",
    };
  }

  // Origem Perdida
  if (lower.includes("origem perdida")) {
    return {
      bgGradient: "from-black via-fuchsia-950 to-purple-950",
      accentGradient: "from-fuchsia-500 via-rose-500 to-indigo-500",
      glowColor: "rgba(217, 70, 239, 0.7)",
      borderColor: "border-fuchsia-500/80",
      crimpColor: "bg-fuchsia-950",
      ballType: "void",
      badgeBg: "bg-fuchsia-600 text-white font-bold",
      foilSheen: "from-fuchsia-400/40 via-white/50 to-transparent",
    };
  }

  // Tempestade Prateada
  if (lower.includes("tempestade prateada")) {
    return {
      bgGradient: "from-slate-900 via-blue-950 to-slate-950",
      accentGradient: "from-sky-300 via-slate-200 to-blue-400",
      glowColor: "rgba(148, 163, 184, 0.7)",
      borderColor: "border-slate-300/80 ring-1 ring-white/30",
      crimpColor: "bg-slate-800",
      ballType: "ultra",
      badgeBg: "bg-slate-200 text-slate-950 font-black",
      foilSheen: "from-slate-200/50 via-white/70 to-transparent",
    };
  }

  // Realeza Absoluta
  if (lower.includes("realeza") || lower.includes("absoluta")) {
    return {
      bgGradient: "from-amber-950 via-rose-950 to-amber-950",
      accentGradient: "from-yellow-300 via-amber-400 to-yellow-600",
      glowColor: "rgba(234, 179, 8, 0.7)",
      borderColor: "border-amber-400/80 ring-2 ring-amber-400/30",
      crimpColor: "bg-amber-900",
      ballType: "legendary",
      badgeBg: "bg-amber-400 text-slate-950 font-black",
      foilSheen: "from-amber-200/50 via-white/60 to-transparent",
    };
  }

  // Astros Cintilantes
  if (lower.includes("astros") || lower.includes("cintilantes")) {
    return {
      bgGradient: "from-slate-950 via-indigo-950 to-amber-950",
      accentGradient: "from-yellow-200 via-amber-300 to-sky-400",
      glowColor: "rgba(245, 158, 11, 0.7)",
      borderColor: "border-yellow-400/80",
      crimpColor: "bg-yellow-900",
      ballType: "celestial",
      badgeBg: "bg-yellow-400 text-slate-950 font-bold",
      foilSheen: "from-yellow-200/40 via-white/50 to-transparent",
    };
  }

  // Céus em Evolução
  if (lower.includes("céus") || lower.includes("ceus") || lower.includes("evolução") || lower.includes("evolucao")) {
    return {
      bgGradient: "from-emerald-950 via-teal-950 to-sky-950",
      accentGradient: "from-emerald-400 via-teal-300 to-sky-400",
      glowColor: "rgba(16, 185, 129, 0.7)",
      borderColor: "border-emerald-400/80",
      crimpColor: "bg-emerald-900",
      ballType: "great",
      badgeBg: "bg-emerald-400 text-slate-950 font-bold",
      foilSheen: "from-emerald-300/40 via-white/50 to-transparent",
    };
  }

  // Destinos de Paldea / Destinos Brilhantes
  if (lower.includes("destinos")) {
    return {
      bgGradient: "from-slate-950 via-purple-950 to-slate-900",
      accentGradient: "from-purple-400 via-pink-300 to-cyan-300",
      glowColor: "rgba(192, 132, 252, 0.7)",
      borderColor: "border-purple-400/80",
      crimpColor: "bg-purple-900",
      ballType: "master",
      badgeBg: "bg-purple-400 text-slate-950 font-bold",
      foilSheen: "from-purple-300/40 via-white/50 to-transparent",
    };
  }

  // Celebrações (25 Anos)
  if (lower.includes("celebrações") || lower.includes("celebracoes")) {
    return {
      bgGradient: "from-amber-950 via-red-900 to-zinc-950",
      accentGradient: "from-yellow-300 via-amber-400 to-red-500",
      glowColor: "rgba(234, 179, 8, 0.8)",
      borderColor: "border-amber-400 ring-2 ring-yellow-400/40",
      crimpColor: "bg-amber-800",
      ballType: "legendary",
      badgeBg: "bg-amber-400 text-slate-950 font-black",
      foilSheen: "from-yellow-200/50 via-white/60 to-transparent",
    };
  }

  // Golpe Fusão
  if (lower.includes("fusão") || lower.includes("fusao")) {
    return {
      bgGradient: "from-pink-950 via-purple-950 to-cyan-950",
      accentGradient: "from-pink-500 via-purple-400 to-cyan-400",
      glowColor: "rgba(236, 72, 153, 0.7)",
      borderColor: "border-pink-500/80",
      crimpColor: "bg-pink-900",
      ballType: "rainbow",
      badgeBg: "bg-pink-500 text-white font-bold",
      foilSheen: "from-pink-300/40 via-white/50 to-transparent",
    };
  }

  // Escarlate e Violeta / Paldea / Obsidiana
  if (lower.includes("escarlate") || lower.includes("violeta") || lower.includes("paldea") || lower.includes("obsidiana")) {
    return {
      bgGradient: "from-red-950 via-purple-950 to-slate-950",
      accentGradient: "from-red-500 via-purple-500 to-indigo-500",
      glowColor: "rgba(168, 85, 247, 0.6)",
      borderColor: "border-purple-400/80",
      crimpColor: "bg-purple-900",
      ballType: "master",
      badgeBg: "bg-gradient-to-r from-red-500 to-purple-600 text-white font-bold",
      foilSheen: "from-purple-300/30 via-white/40 to-transparent",
    };
  }

  // Espada e Escudo / Rixa Rebelde / Escuridão
  if (lower.includes("espada") || lower.includes("escudo") || lower.includes("rixa") || lower.includes("escuridão") || lower.includes("rebelde")) {
    return {
      bgGradient: "from-blue-950 via-slate-900 to-red-950",
      accentGradient: "from-cyan-400 via-blue-500 to-rose-500",
      glowColor: "rgba(59, 130, 246, 0.6)",
      borderColor: "border-blue-400/80",
      crimpColor: "bg-blue-900",
      ballType: "great",
      badgeBg: "bg-blue-500 text-white font-bold",
      foilSheen: "from-cyan-300/30 via-white/40 to-transparent",
    };
  }

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
      crimpColor: "bg-pink-700",
      ballType: "master",
      badgeBg: "bg-fuchsia-400 text-slate-950",
      foilSheen: "from-pink-200/30 via-white/40 to-transparent",
    };
  }

  if (lower.includes("raro kanto") || lower.includes("kanto")) {
    return {
      bgGradient: "from-blue-900 via-sky-600 to-blue-800",
      accentGradient: "from-yellow-400 to-amber-500",
      glowColor: "rgba(14, 165, 233, 0.6)",
      borderColor: "border-sky-400/80",
      crimpColor: "bg-sky-700",
      ballType: "great",
      badgeBg: "bg-sky-400 text-slate-950",
      foilSheen: "from-sky-200/30 via-white/40 to-transparent",
    };
  }

  if (lower.includes("grande pacote") || lower.includes("grande")) {
    return {
      bgGradient: "from-blue-950 via-indigo-900 to-slate-900",
      accentGradient: "from-yellow-400 via-amber-300 to-yellow-500",
      glowColor: "rgba(99, 102, 241, 0.6)",
      borderColor: "border-indigo-400/80",
      crimpColor: "bg-indigo-800",
      ballType: "ultra",
      badgeBg: "bg-indigo-400 text-slate-950",
      foilSheen: "from-indigo-200/30 via-white/40 to-transparent",
    };
  }

  if (lower.includes("épicos") || lower.includes("epico") || lower.includes("épico")) {
    return {
      bgGradient: "from-purple-950 via-purple-700 to-indigo-900",
      accentGradient: "from-fuchsia-400 to-pink-500",
      glowColor: "rgba(168, 85, 247, 0.6)",
      borderColor: "border-purple-400/80",
      crimpColor: "bg-purple-800",
      ballType: "master",
      badgeBg: "bg-purple-400 text-slate-950",
      foilSheen: "from-purple-200/30 via-white/40 to-transparent",
    };
  }

  if (lower.includes("iniciação") || lower.includes("iniciacao")) {
    return {
      bgGradient: "from-emerald-900 via-teal-700 to-slate-900",
      accentGradient: "from-emerald-300 to-cyan-400",
      glowColor: "rgba(16, 185, 129, 0.5)",
      borderColor: "border-emerald-400/70",
      crimpColor: "bg-teal-800",
      ballType: "great",
      badgeBg: "bg-emerald-400 text-slate-950",
      foilSheen: "from-emerald-200/20 via-white/30 to-transparent",
    };
  }

  if (lower.includes("raro")) {
    return {
      bgGradient: "from-sky-950 via-blue-700 to-indigo-950",
      accentGradient: "from-cyan-300 to-blue-400",
      glowColor: "rgba(14, 165, 233, 0.5)",
      borderColor: "border-sky-400/70",
      crimpColor: "bg-blue-800",
      ballType: "great",
      badgeBg: "bg-sky-400 text-slate-950",
      foilSheen: "from-sky-200/20 via-white/30 to-transparent",
    };
  }

  // Pacote Simples (Padrão)
  return {
    bgGradient: "from-red-950 via-rose-700 to-slate-950",
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
  logoUrl,
}: BoosterPackArtProps) {
  const theme = getTheme(name);
  const [logoFailed, setLogoFailed] = React.useState(false);

  return (
    <div
      className={`relative w-full aspect-[1/1.48] rounded-xl overflow-hidden shadow-xl border-2 ${theme.borderColor} flex flex-col justify-between select-none group bg-gradient-to-b ${theme.bgGradient} ${className}`}
      style={{
        boxShadow: `0 10px 30px -5px ${theme.glowColor}`,
      }}
    >
      {/* Crimp Superior (Borda de lacre serrilhada) */}
      {showCrimp && (
        <div className={`h-3.5 sm:h-4 w-full ${theme.crimpColor} flex items-center justify-center relative overflow-hidden border-b border-black/30 shadow-inner z-10 shrink-0`}>
          <div className="absolute inset-0 opacity-40 bg-[repeating-linear-gradient(90deg,transparent,transparent_3px,rgba(0,0,0,0.5)_3px,rgba(0,0,0,0.5)_6px)]" />
          <div className="w-12 h-1 rounded-full bg-white/30" />
        </div>
      )}

      {/* Foil Background Sheen Lines */}
      <div className="absolute inset-0 pointer-events-none opacity-30 mix-blend-overlay bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-transparent to-black" />

      {/* Dynamic Metallic Foil Sweep Effect */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out z-20" />

      {/* Conteúdo Central do Pacote */}
      <div className="flex-1 flex flex-col items-center justify-between p-2.5 sm:p-3 text-center z-10 overflow-hidden">
        {/* Header da Marca (oculto se o logo oficial já traz o nome do set) */}
        <div className="w-full">
          {logoUrl && !logoFailed ? null : (
            <h3 className="font-syne font-black text-sm sm:text-base md:text-lg text-white tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] line-clamp-2">
              {name}
            </h3>
          )}
        </div>

        {/* Emblema Central ou Logo Oficial do Set */}
        <div className="relative my-auto flex items-center justify-center w-full px-2">
          {/* Aura pulsante de fundo */}
          <div
            className="absolute size-24 sm:size-28 rounded-full blur-xl opacity-60 animate-pulse pointer-events-none"
            style={{ backgroundColor: theme.glowColor }}
          />

          {logoUrl && !logoFailed ? (
            <div className="relative w-full max-h-24 sm:max-h-28 flex items-center justify-center py-2 group-hover:scale-105 transition-transform duration-300">
              <img
                src={logoUrl}
                alt={name}
                onError={() => setLogoFailed(true)}
                className="max-h-20 sm:max-h-24 w-auto max-w-[88%] object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,0.85)]"
              />
            </div>
          ) : (
            /* Emblema de Pokébola Clássico como Fallback */
            <div className="size-16 sm:size-20 rounded-full border-4 border-white/80 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center bg-slate-900 group-hover:scale-110 transition-transform duration-300">
              {theme.ballType === "poke" && (
                <>
                  <div className="w-full h-1/2 bg-gradient-to-b from-red-500 to-red-600 border-b-2 border-slate-950" />
                  <div className="w-full h-1/2 bg-gradient-to-t from-white to-slate-200" />
                </>
              )}
              {theme.ballType === "great" && (
                <>
                  <div className="w-full h-1/2 bg-gradient-to-b from-blue-600 to-sky-500 relative border-b-2 border-slate-950">
                    <div className="absolute top-1 left-2 size-2.5 bg-red-600 rounded-sm rotate-45" />
                    <div className="absolute top-1 right-2 size-2.5 bg-red-600 rounded-sm rotate-45" />
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
                    <div className="absolute top-1 left-1.5 size-2.5 bg-pink-500 rounded-full" />
                    <div className="absolute top-1 right-1.5 size-2.5 bg-pink-500 rounded-full" />
                  </div>
                  <div className="w-full h-1/2 bg-gradient-to-t from-white to-slate-200" />
                </>
              )}
              {theme.ballType === "legendary" && (
                <>
                  <div className="w-full h-1/2 bg-gradient-to-b from-amber-400 via-yellow-300 to-amber-500 border-b-2 border-slate-950 relative flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-yellow-200/40 mix-blend-overlay" />
                    <Sparkles className="size-3 text-amber-950 animate-pulse relative z-10" />
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
                    <div className="size-4 rounded-full border-2 border-amber-950/70 animate-spin" style={{ animationDuration: '6s' }} />
                    <div className="absolute inset-0 bg-yellow-100/30 mix-blend-overlay" />
                  </div>
                  <div className="w-full h-1/2 bg-gradient-to-t from-white via-amber-50 to-slate-100" />
                </>
              )}
              {theme.ballType === "void" && (
                <>
                  <div className="w-full h-1/2 bg-gradient-to-b from-zinc-950 via-purple-950 to-slate-950 border-b-2 border-slate-950 relative flex items-center justify-center overflow-hidden">
                    <div className="size-3 rounded-full bg-rose-600/70 blur-xs animate-ping" />
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

              {/* Botão Central da Pokébola */}
              <div className="absolute size-5 rounded-full bg-white border-2 border-slate-950 shadow-md flex items-center justify-center z-10">
                <div className="size-2 rounded-full bg-slate-200 border border-slate-400" />
              </div>
            </div>
          )}
        </div>

        {/* Rodapé do Pacote: Quantidade de Cartas & Selo */}
        <div className="w-full flex items-center justify-between text-left mt-auto pt-1">
          {cardsQuantity ? (
            <span className={`px-2 py-0.5 rounded-md font-mono font-bold text-[9px] sm:text-[10px] shadow-sm ${theme.badgeBg}`}>
              {cardsQuantity} CARTAS
            </span>
          ) : (
            <span className={`px-2 py-0.5 rounded-md font-mono font-bold text-[9px] sm:text-[10px] shadow-sm ${theme.badgeBg}`}>
              BOOSTER
            </span>
          )}
        </div>
      </div>

      {/* Crimp Inferior (Borda de lacre serrilhada) */}
      {showCrimp && (
        <div className={`h-3.5 sm:h-4 w-full ${theme.crimpColor} flex items-center justify-center relative overflow-hidden border-t border-black/30 shadow-inner z-10 shrink-0`}>
          <div className="absolute inset-0 opacity-40 bg-[repeating-linear-gradient(90deg,transparent,transparent_3px,rgba(0,0,0,0.5)_3px,rgba(0,0,0,0.5)_6px)]" />
          <div className="w-12 h-1 rounded-full bg-white/30" />
        </div>
      )}
    </div>
  );
}
