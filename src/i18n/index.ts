import { pt } from "./locales/pt";
import { en } from "./locales/en";

export type BackendLocale = "pt" | "en";

const dictionaries: Record<BackendLocale, any> = { pt, en };

// Mapeamento direto de mensagens em português legado para chaves/inglês
const legacyPhrasesMap: Record<string, string> = {
  "Saldo insuficiente para abrir este pacote": "packages.insufficientMoney",
  "Pacote aberto com sucesso!": "packages.openedSuccess",
  "Pacote não encontrado": "packages.packageNotFound",
  "Limite máximo de moedas atingido (1.000.000)": "packages.limitReached",
  "Treinador cadastrado com sucesso!": "auth.registeredSuccess",
  "Conta de convidado criada!": "auth.guestCreated",
  "Token inválido!": "auth.invalidToken",
  "Não autorizado": "auth.unauthorized",
  "Email ou senha inválidos": "auth.invalidCredentials",
  "Recompensa coletada com sucesso!": "quests.rewardClaimed",
  "Todas as recompensas disponíveis foram coletadas!": "quests.allClaimed",
  "Nenhuma recompensa pronta para ser resgatada no momento": "quests.noRewardsToClaim",
  "Compra realizada com sucesso!": "store.purchaseSuccess",
  "Moedas insuficientes": "store.insufficientFunds",
  "Oferta de troca publicada com sucesso!": "trades.createdSuccess",
  "Troca aceita com sucesso!": "trades.acceptedSuccess",
  "Troca cancelada com sucesso!": "trades.cancelledSuccess",
};

/**
 * Detecta o idioma a partir dos headers HTTP enviados pelo cliente
 */
export function getLocaleFromHeaders(headers?: Record<string, string | undefined>): BackendLocale {
  if (!headers) return "pt";

  const xLocale = headers["x-locale"] || headers["X-Locale"];
  if (xLocale === "en" || xLocale === "pt") return xLocale;

  const acceptLang = headers["accept-language"] || headers["Accept-Language"] || "";
  if (acceptLang.toLowerCase().startsWith("en")) return "en";

  return "pt";
}

/**
 * Traduz uma chave ou frase legada para o idioma solicitado
 */
export function translate(keyOrMessage: string, locale: BackendLocale = "pt"): string {
  if (!keyOrMessage) return "";
  if (locale === "pt") return keyOrMessage;

  // Verifica se é uma chave de dicionário direta
  const targetKey = legacyPhrasesMap[keyOrMessage] || keyOrMessage;
  const keys = targetKey.split(".");

  let current: any = dictionaries[locale] || dictionaries.pt;
  for (const k of keys) {
    current = current?.[k];
    if (current === undefined) break;
  }

  if (typeof current === "string") {
    return current;
  }

  // Se não encontrou tradução, retorna a mensagem original
  return keyOrMessage;
}
