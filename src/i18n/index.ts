import { patternText } from "../../shared/i18n/pattern-text";
import { apiCopy } from "../../shared/i18n/api-copy";
import { uiCopy } from "../../shared/i18n/ui-copy";
import { flatten, lookup, interpolate } from "../../shared/i18n/lookup";
import { pt } from "./locales/pt";
import { en } from "./locales/en";
import { es } from "./locales/es";
import { jp } from "./locales/jp";

export type BackendLocale = "pt" | "en" | "es" | "jp";

const dictionaries: Record<BackendLocale, unknown> = { pt, en, es, jp };

// Mapeamento direto de mensagens em português legado para chaves/inglês
const legacyPhrasesMap: Record<string, string> = {
  "Saldo insuficiente para abrir este pacote": "packages.insufficientMoney",
  "Pacote aberto com sucesso!": "packages.openedSuccess",
  "Pacote não encontrado": "packages.packageNotFound",
  "Pacote não encontrado!": "packages.packageNotFound",
  "Nenhum pacote encontrado!": "packages.packageNotFound",
  "Pacote não existente": "packages.packageNotFound",
  "O pacote não foi encontrado": "packages.packageNotFound",
  "Limite máximo de moedas atingido (1.000.000)": "packages.limitReached",
  "Comprado com sucesso!": "packages.purchasedSuccess",
  "Compra realizada com sucesso!": "packages.purchasedSuccess",
  "ID de pacote inválido!": "packages.invalidId",
  "ID inválido!": "packages.invalidId",
  "Nenhum pacote selecionado!": "packages.noPackageSelected",
  "Dinheiro insuficiente!": "store.insufficientFunds",
  "Dinheiro insuficiente": "store.insufficientFunds",
  "Moedas insuficientes": "store.insufficientFunds",
  "Você não tem dinheiro o suficiente": "store.insufficientFunds",
  "Quantidade insuficiente de pacotes no inventário": "packages.insufficientStock",
  "Você não possui pacotes suficientes para abrir esta quantidade.": "packages.insufficientStock",
  "Valor mínimo de depósito é 500 moedas!": "packages.minDeposit",
  "Valor mínimo é 500 moedas.": "packages.minDeposit",
  "Teto máximo excedido!": "packages.maxDepositExceeded",
  "O teto máximo de investimento é 1.000.000 moedas (1M).": "packages.maxDepositExceeded",
  "Erro ao carregar inventário.": "packages.loadError",
  "Ocorreu um erro ao comprar o pacote.": "common.error",
  "Ocorreu um erro.": "common.error",
  "Treinador cadastrado com sucesso!": "auth.registeredSuccess",
  "Conta de convidado criada!": "auth.guestCreated",
  "Token inválido!": "auth.invalidToken",
  "Não autorizado": "auth.unauthorized",
  "Email ou senha inválidos": "auth.invalidCredentials",
  "Recompensa coletada com sucesso!": "quests.rewardClaimed",
  "Todas as recompensas disponíveis foram coletadas!": "quests.allClaimed",
  "Nenhuma recompensa pronta para ser resgatada no momento": "quests.noRewardsToClaim",
  "Oferta de troca publicada com sucesso!": "trades.createdSuccess",
  "Troca aceita com sucesso!": "trades.acceptedSuccess",
  "Troca cancelada com sucesso!": "trades.cancelledSuccess",
  "Deck tático salvo com sucesso!": "battle.deckSaved",
  "Selecione exatamente 6 cartas para o deck de batalha.": "battle.deckSelectSix",
  "Você não possui todas as cartas selecionadas em sua coleção.": "battle.notAllCardsOwned",
  "Monte seu deck completo de 6 cartas antes de iniciar a batalha.": "battle.deckIncompleteToFight",
  "Líder de Ginásio não encontrado.": "battle.npcNotFound",
  "Oponente de batalha inexistente.": "battle.npcNotFound",
  "Erro ao carregar deck de batalha.": "battle.combatError",
  "Erro ao listar NPCs de batalha.": "battle.combatError",
  "Erro ao obter histórico de batalhas.": "battle.combatError",
  "Erro ao buscar cartas disponíveis.": "battle.combatError",
  "Você não possui mais todas as cartas deste deck ou uma delas está em negociação.": "battle.notAllCardsOwnedOrTrade",
  "Coleção insuficiente para montar um deck tático válido (mínimo de 6 cartas com até 20 PR). Abra novos pacotes para obter cartas básicas!": "battle.insufficientLowPrCards",
};

const reverse = new Map<string, string>();
for (const dict of Object.values(dictionaries)) for (const [key, value] of flatten(dict)) reverse.set(value, key);
for (const [phrase, values] of Object.entries(uiCopy)) { reverse.set(phrase, phrase); for (const value of values) reverse.set(value, phrase); }
for (const [phrase, key] of Object.entries(legacyPhrasesMap)) reverse.set(phrase, key);
for (const [key, values] of Object.entries(apiCopy)) for (const value of values) reverse.set(value, key);

export function getLocaleFromHeaders(headers?: Record<string, string | undefined>): BackendLocale {
  const explicit = (headers?.["x-locale"] || headers?.["X-Locale"])?.toLowerCase();
  if (explicit === "ja") return "jp";
  if (explicit && ["pt", "en", "es", "jp"].includes(explicit)) return explicit as BackendLocale;
  const language = (headers?.["accept-language"] || headers?.["Accept-Language"] || "pt").toLowerCase();
  if (language.startsWith("ja")) return "jp";
  if (language.startsWith("es")) return "es";
  if (language.startsWith("en")) return "en";
  return "pt";
}

export function translate(text: string, locale: BackendLocale = "pt", params?: Record<string, string | number>): string {
  const key = reverse.get(text) || text;
  const api = apiCopy[key];
  if (api) return interpolate(api[["pt", "en", "es", "jp"].indexOf(locale)], params);
  const value = lookup(dictionaries[locale], key) ?? lookup(dictionaries.en, key);
  if (typeof value === "string") return interpolate(value, params);
  const ui = uiCopy[key] || uiCopy[text];
  if (ui) return interpolate(locale === "pt" ? text : ui[locale === "en" ? 0 : locale === "es" ? 1 : 2], params);
  return interpolate(patternText(text, locale) ?? text, params);
}

export function localizeResponse(response: unknown, locale: BackendLocale, localizeData = true): unknown {
  if (!response || typeof response !== "object" || response instanceof Response) return response;
  if (Array.isArray(response)) return response.map((r) => localizeResponse(r, locale, localizeData));
  if (response instanceof Date) return response;
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(response)) {
    if (typeof value === "string" && (["toast", "error", "toastMessage"].includes(key) || (localizeData && ["title", "description", "name", "packName", "region", "npcTitle", "moveName"].includes(key)))) result[key] = translate(value, locale);
    else if (localizeData && key === "description" && Array.isArray(value)) result[key] = value.map((v) => typeof v === "string" ? translate(v, locale) : v);
    else result[key] = localizeResponse(value, locale, localizeData);
  }
  return result;
}
