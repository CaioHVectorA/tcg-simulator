import { DomainError } from "./domain-error";
import { apiCopy } from "../../shared/i18n/api-copy";
import { uiCopy } from "../../shared/i18n/ui-copy";
import { flatten } from "../../shared/i18n/lookup";
import { pt } from "../i18n/locales/pt";
import { en } from "../i18n/locales/en";
import { es } from "../i18n/locales/es";
import { jp } from "../i18n/locales/jp";
const known = new Set([
  ...Object.keys(apiCopy), ...Object.keys(uiCopy), ...Object.values(uiCopy).flat(),
  ...Object.values(apiCopy).flat(), ...[pt,en,es,jp].flatMap((dict) => flatten(dict).flatMap(([key,text]) => [key,text])),
]);
export function publicError(error: unknown): string {
  if (error instanceof DomainError) return error.key;
  if (error instanceof Error && known.has(error.message)) return error.message;
  console.error(JSON.stringify({ event: "operation_failed", type: error instanceof Error ? error.name : "Unknown" }));
  return "common.error";
}
