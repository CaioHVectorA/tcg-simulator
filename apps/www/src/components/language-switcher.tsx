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

const LOCALES: { value: Locale; flag: string; label: string; shortLabel: string }[] = [
  { value: "pt", flag: "🇧🇷", label: "Português (BR)", shortLabel: "PT" },
  { value: "en", flag: "🇺🇸", label: "English (US)", shortLabel: "EN" },
  { value: "es", flag: "🇪🇸", label: "Español (ES)", shortLabel: "ES" },
  { value: "jp", flag: "🇯🇵", label: "日本語 (JP)", shortLabel: "JP" },
];

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useTranslation();

  const handleSelect = (newLocale: Locale) => {
    if (newLocale === locale) return;
    setLocale(newLocale);
    soundFx.playCardFlip();
  };

  const current = LOCALES.find((l) => l.value === locale) || LOCALES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={compact ? "icon" : "sm"}
          className="h-9 px-2.5 rounded-xl border border-border/60 hover:bg-accent flex items-center gap-1.5 text-xs font-mono font-bold"
          title="Alterar Idioma / Change Language / Cambiar Idioma"
        >
          <span className="text-sm select-none">{current.flag}</span>
          {!compact && (
            <span className="uppercase text-[11px] text-foreground tracking-wider">
              {current.shortLabel}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 font-syne z-[100]">
        {LOCALES.map((loc) => (
          <DropdownMenuItem
            key={loc.value}
            onClick={() => handleSelect(loc.value)}
            className="flex items-center justify-between cursor-pointer py-2"
          >
            <div className="flex items-center gap-2">
              <span className="text-base">{loc.flag}</span>
              <span className="text-xs font-medium">{loc.label}</span>
            </div>
            {locale === loc.value && <Check className="size-3.5 text-primary stroke-[3]" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
