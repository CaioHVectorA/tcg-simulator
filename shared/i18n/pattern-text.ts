import type { Locale } from "./lookup";
const position = (locale: Locale) => ["pt", "en", "es", "jp"].indexOf(locale);
const elements: Record<string, [string, string, string]> = {
  fogo: ["Fire", "Fuego", "炎"], planta: ["Grass", "Planta", "草"], água: ["Water", "Agua", "水"],
  elétrica: ["Electric", "Eléctrico", "電気"], elétricas: ["Electric", "Eléctrico", "電気"], dragão: ["Dragon", "Dragón", "ドラゴン"],
  fada: ["Fairy", "Hada", "フェアリー"], inseto: ["Bug", "Bicho", "虫"], "inseto ou grama": ["Bug or Grass", "Bicho o Planta", "虫または草"],
  psíquico: ["Psychic", "Psíquico", "エスパー"], "noturno/escuridão": ["Dark", "Siniestro", "悪"],
};
export function patternText(text: string, locale: Locale): string | undefined {
  if (locale === "pt") return undefined;
  const language = position(locale) - 1;
  const amount = (value: string) => /^(um|uma)$/.test(value) ? "1" : value;
  let match = text.match(/^(Consiga|Colecione) (\d+|um|uma) (cartas?|Pokémon)(?: (?:de|do tipo) (.+?))?( hoje)?[.!]?$/i);
  if (match) {
    const count = amount(match[2]); const kind = match[4]?.toLowerCase();
    const type = kind ? elements[kind]?.[language] : "";
    if (kind && !type) return undefined;
    const today = match[5] ? [" today", " hoy", " 今日"][language] : "";
    return [`Collect ${count} ${type ? `${type} ` : ""}${match[3] === "Pokémon" ? "Pokémon" : "cards"}${today}.`, `Colecciona ${count} ${type ? `de tipo ${type} ` : ""}${match[3] === "Pokémon" ? "Pokémon" : "cartas"}${today}.`, `${type || ""}${match[3] === "Pokémon" ? "ポケモン" : "カード"}を${count}${match[3] === "Pokémon" ? "匹" : "枚"}集める${today}。`][language];
  }
  match = text.match(/^Consiga (\d+|um|uma) (?:cartas?|cartas repetidas|carta repetida) (?:com )?(mais|menos) de (\d+) (?:de )?hp( hoje)?$/i);
  if (match) return [`Collect ${amount(match[1])} cards with ${match[2] === "mais" ? "more" : "less"} than ${match[3]} HP${match[4] ? " today" : ""}.`, `Consigue ${amount(match[1])} cartas con ${match[2] === "mais" ? "más" : "menos"} de ${match[3]} PS${match[4] ? " hoy" : ""}.`, `HPが${match[3]}${match[2] === "mais" ? "より多い" : "未満の"}カードを${amount(match[1])}枚集める${match[4] ? "（今日）" : ""}。`][language];
  match = text.match(/^Consiga (\d+|um|uma) (?:cartas? repetidas?|iniciais?|inicias)( hoje)?$/i);
  if (match) { const starter = /inici|inicia/.test(text); return [`Collect ${amount(match[1])} ${starter ? "starter" : "duplicate"} cards${match[2] ? " today" : ""}.`, `Consigue ${amount(match[1])} cartas ${starter ? "iniciales" : "duplicadas"}${match[2] ? " hoy" : ""}.`, `${starter ? "最初の仲間の" : "重複"}カードを${amount(match[1])}枚集める${match[2] ? "（今日）" : ""}。`][language]; }
  match = text.match(/^Abra (\d+|um|uma) pacotes?(?: (padrão|padrãos|temático|temáticos))?( hoje)?$/i);
  if (match) { const type = match[2]?.startsWith("padr") ? ["standard", "estándar", "標準"] : match[2] ? ["themed", "temáticos", "テーマ"] : ["", "", ""]; return [`Open ${amount(match[1])} ${type[0]} packs${match[3] ? " today" : ""}.`, `Abre ${amount(match[1])} paquetes ${type[1]}${match[3] ? " hoy" : ""}.`, `${type[2]}パックを${amount(match[1])}個開封${match[3] ? "（今日）" : ""}。`][language]; }
  match = text.match(/^Feche (\d+|todas as) miss(?:ão|ões)[.!]?$/i);
  if (match) return [`Complete ${match[1] === "todas as" ? "all" : match[1]} quests.`, `Completa ${match[1] === "todas as" ? "todas las" : match[1]} misiones.`, `${match[1] === "todas as" ? "すべての" : match[1] + "件の"}ミッションを完了。`][language];
  match = text.match(/^Colecione (\d+) cartas V, VMAX, VSTAR ou ex$/);
  if (match) return [`Collect ${match[1]} V, VMAX, VSTAR or ex cards.`, `Colecciona ${match[1]} cartas V, VMAX, VSTAR o ex.`, `V、VMAX、VSTAR、exカードを${match[1]}枚集める。`][language];
  match = text.match(/^Consiga (\d+) cartas Místicas ou Lendárias \(Tier 4 ou 5\)$/);
  if (match) return [`Collect ${match[1]} Mystic or Legendary cards (Tier 4 or 5).`, `Consigue ${match[1]} cartas místicas o legendarias (nivel 4 o 5).`, `ミスティックまたはレジェンダリー（Tier 4・5）を${match[1]}枚集める。`][language];
  match = text.match(/^Descubra (?:todas as )?(\d+) evoluções (?:diferentes )?da família Eevee!?$/);
  if (match) return [`Collect ${match[1]} different Eevee evolutions.`, `Consigue ${match[1]} evoluciones diferentes de Eevee.`, `イーブイの進化を${match[1]}種類集める。`][language];
  match = text.match(/^Participe de (\d+) trocas? no mercado de treinadores$/);
  if (match) return [`Complete ${match[1]} community trades.`, `Completa ${match[1]} intercambios de la comunidad.`, `コミュニティの交換を${match[1]}回完了。`][language];
  match = text.match(/^(.+) (Poder Supremo|Fúria Lendária)$/);
  if (match) return [`${match[1]} — ${match[2] === "Poder Supremo" ? "Supreme power" : "Legendary fury"}`, `${match[1]} — ${match[2] === "Poder Supremo" ? "Poder supremo" : "Furia legendaria"}`, `${match[1]} — ${match[2] === "Poder Supremo" ? "究極の力" : "伝説の怒り"}`][language];
  match = text.match(/^Bônus de ([\d.]+) moedas$/);
  if (match) return [`Bonus: ${match[1]} coins`, `Bonificación: ${match[1]} monedas`, `ボーナス：${match[1]}コイン`][language];
  return undefined;
}
