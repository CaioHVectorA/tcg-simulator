export function balanceTranslate(balance: number | null | undefined): string {
  if (balance === undefined || balance === null || isNaN(balance) || balance <= 0) return "0";
  const suffixes = ["", "k", "M", "B", "T"];
  const suffixNum = Math.min(suffixes.length - 1, Math.max(0, Math.floor(Math.log10(balance) / 3)));
  const shortValue = (balance / Math.pow(1000, suffixNum)).toFixed(2);

  return String(parseFloat(shortValue) + suffixes[suffixNum]);
}
