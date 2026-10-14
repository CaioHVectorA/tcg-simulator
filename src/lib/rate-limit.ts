import { DomainError } from "./domain-error";
const attempts = new Map<string, { expires: number; count: number }>();
export function rateLimit(key: string, limit: number, now = Date.now()) {
  const entry = attempts.get(key);
  if (entry && entry.expires > now) {
    if (entry.count >= limit) throw new DomainError("common.rateLimited", 429);
    entry.count++;
    return;
  }
  if (attempts.size >= 10_000) {
    for (const [id, record] of attempts) if (record.expires <= now) attempts.delete(id);
    if (attempts.size >= 10_000) throw new DomainError("common.rateLimited", 429);
  }
  attempts.set(key, { expires: now + 60_000, count: 1 });
}
