export type Locale = "pt" | "en" | "es" | "jp";
export function flatten(value: unknown, path = ""): [string, string][] {
  if (typeof value === "string") return [[path, value]];
  if (!value || typeof value !== "object" || Array.isArray(value)) return [];
  return Object.entries(value).flatMap(([key, item]) => flatten(item, path ? `${path}.${key}` : key));
}
export function lookup(dictionary: unknown, path: string): unknown {
  let current: unknown = dictionary;
  for (const part of path.split('.')) {
    if (!current || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}
export function interpolate(text: string, params?: Record<string, string | number>): string {
  return text.replace(/\{([^}]+)\}/g, (match, key: string) => params?.[key] === undefined ? match : String(params[key]));
}
