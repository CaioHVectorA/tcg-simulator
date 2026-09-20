"use client";

import React, { useState } from "react";
import { loadTcgImg } from "@/lib/load-tcg-img";

interface TcgCardImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string;
  alt?: string;
  lowQuality?: boolean;
  className?: string;
}

export function TcgCardImage({
  src,
  alt = "Carta Pokémon",
  lowQuality = false,
  className = "w-full h-full object-cover",
  ...props
}: TcgCardImageProps) {
  const [hasError, setHasError] = useState(!src);
  const resolvedSrc = src ? loadTcgImg(src, lowQuality) : "";

  if (hasError || !resolvedSrc) {
    return (
      <div
        className={`relative aspect-[2.5/3.5] w-full h-full bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-slate-700/60 rounded-lg flex flex-col items-center justify-center p-3 text-center overflow-hidden select-none ${className}`}
      >
        {/* Glow de fundo */}
        <div className="absolute inset-0 bg-radial from-amber-500/10 via-transparent to-transparent pointer-events-none" />

        {/* Emblema Pokebola estilizado */}
        <div className="relative size-14 sm:size-16 rounded-full border-4 border-slate-600/60 flex flex-col overflow-hidden shadow-inner opacity-70 mb-2">
          <div className="flex-1 bg-red-600/60 border-b-2 border-slate-900" />
          <div className="flex-1 bg-slate-200/60" />
          <div className="absolute inset-0 m-auto size-5 rounded-full bg-white border-2 border-slate-900 flex items-center justify-center shadow">
            <div className="size-2 rounded-full bg-slate-900" />
          </div>
        </div>

        <span className="text-[10px] sm:text-xs font-mono font-bold text-slate-300 line-clamp-2 px-1">
          {alt || "TCG Card"}
        </span>
        <span className="text-[9px] font-mono text-amber-400/70 mt-1 uppercase tracking-wider">
          TCG Simulator
        </span>
      </div>
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      onError={() => setHasError(true)}
      className={className}
      {...props}
    />
  );
}
