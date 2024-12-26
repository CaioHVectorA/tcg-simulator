export function generateUUID(): string {
  // Função auxiliar para gerar números hexadecimais
  const hex = (n: number): string => n.toString(16).padStart(2, "0");

  // Gera um número hexadecimal aleatório
  const randomHex = (bytes: number): string => {
    const array = new Uint8Array(bytes);
    crypto.getRandomValues(array);
    return Array.from(array, hex).join("");
  };

  // Gera UUID versão 4 (RFC 4122)
  const timestamp = Date.now().toString(16).padStart(12, "0");

  // Formato: 8-4-4-4-12
  return (
    randomHex(4) +
    "-" + // primeiros 8 caracteres
    randomHex(2) +
    "-" + // próximos 4
    "4" +
    randomHex(1).slice(1) +
    "-" + // versão 4
    ["8", "9", "a", "b"][Math.floor(Math.random() * 4)] +
    randomHex(1).slice(1) +
    "-" + // variant
    randomHex(6)
  ) // últimos 12 caracteres
    .toLowerCase();
}
