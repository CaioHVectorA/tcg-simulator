import { patternText } from "../../../../shared/i18n/pattern-text";
import { pt } from "./locales/pt";
import { en } from "./locales/en";
import { es } from "./locales/es";
import { jp } from "./locales/jp";
import { apiCopy } from "../../../../shared/i18n/api-copy";
import { uiCopy } from "../../../../shared/i18n/ui-copy";
import { flatten, lookup, interpolate, type Locale } from "../../../../shared/i18n/lookup";
export const dictionaries = { pt, en, es, jp };
const phraseKeys = new Map(flatten(pt).map(([key, text]) => [text, key]));
for (const [phrase, values] of Object.entries(uiCopy)) for (const value of values) phraseKeys.set(value, phrase);
export function translateText(text: string, locale: Locale, params?: Record<string, string | number>): string {
  const api = apiCopy[text];
  if (api) return interpolate(api[["pt", "en", "es", "jp"].indexOf(locale)], params);
  const key = phraseKeys.get(text) || text;
  const found = lookup(dictionaries[locale], key);
  if (typeof found === "string") return interpolate(found, params);
  const legacy = uiCopy[key] || uiCopy[text];
  if (legacy) return interpolate(locale === "pt" ? key : legacy[locale === "en" ? 0 : locale === "es" ? 1 : 2], params);
  const fallback = lookup(en, key) ?? lookup(pt, key);
  return interpolate(typeof fallback === 'string' ? fallback : (patternText(text, locale) ?? text), params);
}
export function translatedList(key: string, locale: Locale): string[] {
  const value = lookup(dictionaries[locale], key) ?? lookup(en, key);
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}
