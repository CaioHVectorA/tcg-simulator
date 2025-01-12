export function balanceTranslate(balance: number): string {
  if (balance == 0) return "0";
  const suffixes = ["", "k", "M", "B", "T"];
  const suffixNum = Math.floor(Math.log10(balance) / 3);
  const shortValue = (balance / Math.pow(1000, suffixNum)).toFixed(2);

  return String(parseFloat(shortValue) + suffixes[suffixNum]);
}
