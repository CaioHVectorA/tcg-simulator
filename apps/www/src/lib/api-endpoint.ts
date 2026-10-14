// The deployed backend for this project; local example values must never direct
// a public browser to the visitor's own computer.
export const DEPLOYED_API_URL = "https://poke-tcg-center.fly.dev";
const frontendHosts = new Set(["tcg-alpha.vercel.app", "tcg-caiohvectoras-projects.vercel.app", "tcgsim.com", "www.tcgsim.com"]);
export function resolveApiEndpoint(configured?: string, production = process.env.NODE_ENV === "production"): string {
  const value = configured?.trim().replace(/\/+$/, "");
  if (!production) return value || "http://localhost:8080";
  if (value) {
    try {
      const url = new URL(value);
      const local = /^(localhost|.*\.localhost|127(?:\.\d+){3}|0\.0\.0\.0|\[?::1\]?)$/i.test(url.hostname);
      if (url.protocol === "https:" && !local && !frontendHosts.has(url.hostname) && !url.username && !url.password) return value;
    } catch { /* Use this project's deployed API for an invalid production value. */ }
  }
  return DEPLOYED_API_URL;
}
