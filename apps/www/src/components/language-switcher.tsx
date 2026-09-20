"use client";

import React from "react";
import { useTranslation, Locale } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { soundFx } from "@/lib/sound-fx";
import { Check, Globe } from "lucide-react";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useTranslation();

  const handleSelect = (newLocale: Locale) => {
    if (newLocale === locale) return;
    setLocale(newLocale);
    soundFx.playCardFlip();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={compact ? "icon" : "sm"}
          className="h-9 px-2.5 rounded-xl border border-border/60 hover:bg-accent flex items-center gap-1.5 text-xs font-mono font-bold"
          title="Alterar Idioma / Change Language"
        >
          <span className="text-sm select-none">
            {locale === "pt" ? "🇧🇷" : "🇺🇸"}
          </span>
          {!compact && (
            <span className="uppercase text-[11px] text-foreground tracking-wider">
              {locale}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40 font-syne z-[100]">
        <DropdownMenuItem
          onClick={() => handleSelect("pt")}
          className="flex items-center justify-between cursor-pointer py-2"
        >
          <div className="flex items-center gap-2">
            <span className="text-base">🇧🇷</span>
            <span className="text-xs font-medium">Português (BR)</span>
          </div>
          {locale === "pt" && <Check className="size-3.5 text-primary stroke-[3]" />}
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleSelect("en")}
          className="flex items-center justify-between cursor-pointer py-2"
        >
          <div className="flex items-center gap-2">
            <span className="text-base">🇺🇸</span>
            <span className="text-xs font-medium">English (US)</span>
          </div>
          {locale === "en" && <Check className="size-3.5 text-primary stroke-[3]" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
