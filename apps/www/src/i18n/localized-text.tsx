"use client";
import { useTranslation } from "./LanguageContext";
export function LocalizedText({ text }: { text: string }) {
  return <>{useTranslation().t(text)}</>;
}
export function useUiText() {
  const { t } = useTranslation();
  return (text: unknown) => typeof text === "string" ? t(text) : "";
}
