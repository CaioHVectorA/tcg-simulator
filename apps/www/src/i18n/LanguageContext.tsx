"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { pt } from "./locales/pt";
import { en } from "./locales/en";
import { es } from "./locales/es";
import { jp } from "./locales/jp";
import { api } from "@/lib/api";
import { translateText } from "./text";

export type Locale = "pt" | "en" | "es" | "jp";

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (path: string, params?: Record<string, string | number>) => string;
}

const dictionaries: Record<Locale, any> = { pt, en, es, jp };

const langCodeMap: Record<Locale, string> = {
  pt: "pt-BR",
  en: "en-US",
  es: "es-ES",
  jp: "ja-JP",
};

function getInitialLocale(): Locale {
  if (typeof window === "undefined") return "pt";
  try {
    const queryLocale = new URLSearchParams(window.location.search).get("lang");
    if (queryLocale && ["pt", "en", "es", "jp"].includes(queryLocale)) return queryLocale as Locale;
    // 1. Check cookie 'tcg_locale'
    const cookieMatch = document.cookie.match(/(?:^|;\s*)tcg_locale=([^;]+)/);
    if (cookieMatch && ["pt", "en", "es", "jp"].includes(cookieMatch[1])) {
      return cookieMatch[1] as Locale;
    }
    // 2. Check localStorage
    const saved = localStorage.getItem("tcg_locale") as Locale;
    if (saved && ["pt", "en", "es", "jp"].includes(saved)) {
      return saved;
    }
    // 3. Browser language detection
    const browserLang = navigator.language?.toLowerCase() || "";
    if (browserLang.startsWith("ja")) return "jp";
    if (browserLang.startsWith("en")) return "en";
    if (browserLang.startsWith("es")) return "es";
  } catch {
    // Fallback to default
  }
  return "pt";
}

const updateHtmlLang = (loc: Locale) => {
  if (typeof document !== "undefined") {
    document.documentElement.lang = langCodeMap[loc] || "pt-BR";
  }
};

const updateApiHeaders = (loc: Locale) => {
  const acceptLang =
    loc === "en" ? "en-US,en;q=0.9" :
    loc === "es" ? "es-ES,es;q=0.9" :
    loc === "jp" ? "ja-JP,ja;q=0.9" :
    "pt-BR,pt;q=0.9";
  api.defaults.headers.common["Accept-Language"] = acceptLang;
  api.defaults.headers.common["X-Locale"] = loc;
  try {
    document.cookie = `tcg_locale=${loc}; path=/; max-age=31536000; SameSite=Lax`;
  } catch {}
  updateHtmlLang(loc);
};

const LanguageContext = createContext<LanguageContextType>({
  locale: "pt",
  setLocale: () => {},
  t: (path: string) => path,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode; initialLocale?: Locale }> = ({
  children,
  initialLocale,
}) => {
  // Sincronização imediata no cliente para evitar flash de idioma
  const [locale, setLocaleState] = useState<Locale>(() => initialLocale || getInitialLocale());

  // Load and apply saved language on mount
  useEffect(() => {
    const initial = getInitialLocale();
    setLocaleState(initial);
    updateApiHeaders(initial);
  }, [initialLocale]);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (url.searchParams.has("lang")) { url.searchParams.set("lang", newLocale); window.history.replaceState(null, "", url); }
    }
    try {
      localStorage.setItem("tcg_locale", newLocale);
      updateApiHeaders(newLocale);
    } catch {}
  }, []);

  const t = useCallback((path: string, params?: Record<string, string | number>) => translateText(path, locale, params), [locale]);

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => useContext(LanguageContext);
