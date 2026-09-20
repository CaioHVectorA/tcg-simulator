"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { pt } from "./locales/pt";
import { en } from "./locales/en";
import { api } from "@/lib/api";

export type Locale = "pt" | "en";

interface LanguageContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (path: string, params?: Record<string, string | number>) => string;
}

const dictionaries: Record<Locale, any> = { pt, en };

const LanguageContext = createContext<LanguageContextType>({
  locale: "pt",
  setLocale: () => {},
  t: (path: string) => path,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>("pt");

  // Carrega idioma salvo na inicialização
  useEffect(() => {
    try {
      const saved = localStorage.getItem("tcg_locale") as Locale;
      if (saved === "pt" || saved === "en") {
        setLocaleState(saved);
        updateApiHeaders(saved);
      } else {
        // Detecta do navegador
        const browserLang = navigator.language?.toLowerCase() || "";
        const initial: Locale = browserLang.startsWith("en") ? "en" : "pt";
        setLocaleState(initial);
        updateApiHeaders(initial);
      }
    } catch {
      // Ignora erro em ambientes sem window
    }
  }, []);

  const updateApiHeaders = (loc: Locale) => {
    const acceptLang = loc === "en" ? "en-US,en;q=0.9" : "pt-BR,pt;q=0.9";
    api.defaults.headers.common["Accept-Language"] = acceptLang;
    api.defaults.headers.common["X-Locale"] = loc;
    try {
      document.cookie = `tcg_locale=${loc}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {}
  };

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem("tcg_locale", newLocale);
      updateApiHeaders(newLocale);
    } catch {}
  }, []);

  // Função de tradução dot-notation (ex: t("nav.store"))
  const t = useCallback(
    (path: string, params?: Record<string, string | number>): string => {
      const dict = dictionaries[locale] || dictionaries.pt;
      const fallbackDict = dictionaries.pt;

      const keys = path.split(".");
      let result: any = dict;
      for (const k of keys) {
        result = result?.[k];
        if (result === undefined) break;
      }

      // Fallback para português se não encontrar
      if (result === undefined) {
        let fallbackResult: any = fallbackDict;
        for (const k of keys) {
          fallbackResult = fallbackResult?.[k];
          if (fallbackResult === undefined) break;
        }
        result = fallbackResult ?? path;
      }

      if (typeof result !== "string") {
        return path;
      }

      // Interpolação de parâmetros {current}, {total}, etc.
      if (params) {
        let interpolated = result;
        for (const [key, value] of Object.entries(params)) {
          interpolated = interpolated.replace(new RegExp(`\\{${key}\\}`, "g"), String(value));
        }
        return interpolated;
      }

      return result;
    },
    [locale]
  );

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => useContext(LanguageContext);
