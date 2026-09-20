"use client";

import React, { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";

const POKEMON_FLAVOR_TEXTS = [
  "Achando shinies...",
  "Embaralhando o deck...",
  "Polindo as cartas raras...",
  "Alimentando o Snorlax...",
  "Consultando o Professor Carvalho...",
  "Calibrando as Pokébolas...",
  "Sintonizando com o Centro Pokémon...",
  "Separando os pacotes especiais...",
  "Verificando os pontos de raridade...",
  "Aquecendo a chama do Charizard...",
];

export function LoadingRing({ className = "" }: { className?: string }) {
  return (
    <div className={`size-12 border-3 border-primary/30 border-t-primary rounded-full animate-spin ${className}`} />
  );
}

export function Loader({ customText }: { customText?: string }) {
  const [flavorIndex, setFlavorIndex] = useState(0);

  useEffect(() => {
    if (customText) return;
    const interval = setInterval(() => {
      setFlavorIndex((prev) => (prev + 1) % POKEMON_FLAVOR_TEXTS.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [customText]);

  const currentText = customText || POKEMON_FLAVOR_TEXTS[flavorIndex];

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background/85 backdrop-blur-md font-syne select-none p-4">
      {/* Aura de fundo suave */}
      <div className="absolute size-56 rounded-full bg-red-500/10 blur-3xl pointer-events-none animate-pulse" />

      {/* Pokébola Tátil Animada */}
      <div className="relative mb-6">
        <div className="size-20 sm:size-24 rounded-full border-4 border-slate-950 dark:border-white shadow-2xl relative overflow-hidden flex flex-col items-center justify-center animate-bounce duration-1000">
          {/* Hemisfério Superior (Vermelho) */}
          <div className="w-full h-1/2 bg-gradient-to-b from-red-500 via-rose-500 to-red-600 border-b-2 border-slate-950 dark:border-slate-900 relative">
            <div className="absolute top-1 left-2 w-4 h-1.5 rounded-full bg-white/40 blur-[0.5px]" />
          </div>

          {/* Hemisfério Inferior (Branco) */}
          <div className="w-full h-1/2 bg-gradient-to-t from-slate-200 via-slate-100 to-white" />

          {/* Botão Central com Luz Pulsante */}
          <div className="absolute size-7 rounded-full bg-white border-3 border-slate-950 dark:border-slate-900 shadow-md flex items-center justify-center z-10">
            <div className="size-3 rounded-full bg-slate-100 border border-slate-400 flex items-center justify-center">
              <div className="size-1.5 rounded-full bg-cyan-400 animate-ping opacity-90" />
            </div>
          </div>
        </div>

        {/* Efeito de Faísca */}
        <div className="absolute -top-1 -right-1 text-amber-400 animate-spin" style={{ animationDuration: "4s" }}>
          <Sparkles className="size-5" />
        </div>
      </div>

      {/* Texto Dinâmico */}
      <div className="text-center space-y-2 max-w-xs">
        <p className="font-bold text-base sm:text-lg text-foreground tracking-wide transition-all duration-300 ease-in-out min-h-[1.75rem]">
          {currentText}
        </p>
        <div className="flex items-center justify-center gap-1.5">
          <span className="size-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: "0ms" }} />
          <span className="size-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: "200ms" }} />
          <span className="size-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: "400ms" }} />
        </div>
      </div>
    </div>
  );
}

export function LoaderSimple({ className = "size-5" }: { className?: string }) {
  return (
    <div role="status" className={`relative inline-flex items-center justify-center shrink-0 ${className} animate-spin`} style={{ animationDuration: '0.8s' }}>
      <div className="w-full h-full rounded-full border-2 border-foreground/80 overflow-hidden flex flex-col relative shadow-xs">
        <div className="w-full h-1/2 bg-red-500" />
        <div className="w-full h-1/2 bg-white" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="size-[36%] rounded-full bg-white border border-slate-900 flex items-center justify-center shadow-xs">
            <div className="size-1/2 rounded-full bg-slate-900" />
          </div>
        </div>
      </div>
      <span className="sr-only">Carregando...</span>
    </div>
  );
}