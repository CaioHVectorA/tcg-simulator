import { pt } from "./locales/pt";
import { en } from "./locales/en";
import { es } from "./locales/es";
import { jp } from "./locales/jp";

export type BackendLocale = "pt" | "en" | "es" | "jp";

const dictionaries: Record<BackendLocale, any> = { pt, en, es, jp };

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

/**
 * Detecta o idioma a partir dos headers HTTP enviados pelo cliente
 */
export function getLocaleFromHeaders(headers?: Record<string, string | undefined>): BackendLocale {
  if (!headers) return "en";

  const xLocale = (headers["x-locale"] || headers["X-Locale"])?.toLowerCase();
  if (xLocale === "en" || xLocale === "pt" || xLocale === "es" || xLocale === "jp") return xLocale as BackendLocale;

  const acceptLang = headers["accept-language"] || headers["Accept-Language"] || "";
  if (acceptLang.toLowerCase().startsWith("ja")) return "jp";
  if (acceptLang.toLowerCase().startsWith("es")) return "es";
  if (acceptLang.toLowerCase().startsWith("pt")) return "pt";
  if (acceptLang.toLowerCase().startsWith("en")) return "en";

  return "en";
}

/**
 * Traduz uma chave ou frase legada para o idioma solicitado
 */
export function translate(keyOrMessage: string, locale: BackendLocale = "en"): string {
  if (!keyOrMessage) return "";

  // Se já for uma frase em português e o destino for pt, retorna ela diretamente
  if (locale === "pt" && !keyOrMessage.includes(".") && !legacyPhrasesMap[keyOrMessage]) {
    return keyOrMessage;
  }

  // Mapeia frase legada em PT para a chave do dicionário (ex: "Pacote não encontrado" -> "packages.packageNotFound")
  const targetKey = legacyPhrasesMap[keyOrMessage] || keyOrMessage;
  const keys = targetKey.split(".");

  const dict = dictionaries[locale] || dictionaries.en;
  let current: any = dict;
  for (const k of keys) {
    current = current?.[k];
    if (current === undefined) break;
  }

  if (typeof current === "string") {
    return current;
  }

  // Fallback para inglês
  if (locale !== "en") {
    let fallbackCurrent: any = dictionaries.en;
    for (const k of keys) {
      fallbackCurrent = fallbackCurrent?.[k];
      if (fallbackCurrent === undefined) break;
    }
    if (typeof fallbackCurrent === "string") {
      return fallbackCurrent;
    }
  }

  return keyOrMessage;
}
