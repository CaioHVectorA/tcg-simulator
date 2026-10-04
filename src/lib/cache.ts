import type { Card } from "@prisma/client";

// Cache legada para compatibilidade com testes existentes
export const cache = new Map<string, Card[]>();
export const questsCache = new Map<string, [any, Date]>();

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

class InMemoryCache {
  private store = new Map<string, CacheEntry<any>>();

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlMs: number): void {
    this.store.set(key, {
      data,
      expiresAt: Date.now() + ttlMs,
    });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  async getOrSet<T>(key: string, fetcher: () => Promise<T>, ttlMs: number): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }
    const freshData = await fetcher();
    this.set(key, freshData, ttlMs);
    return freshData;
  }
}

export const memoryCache = new InMemoryCache();

// Helpers com TTLs calibrados para dados estáticos do jogo
export const TTL = {
  ONE_MINUTE: 60 * 1000,
  FIVE_MINUTES: 5 * 60 * 1000,
  FIFTEEN_MINUTES: 15 * 60 * 1000,
  THIRTY_MINUTES: 30 * 60 * 1000,
  ONE_HOUR: 60 * 60 * 1000,
};
