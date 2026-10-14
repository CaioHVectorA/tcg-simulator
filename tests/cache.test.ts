import { describe, expect, it, beforeEach } from "bun:test";
import { cache, questsCache } from "../src/lib/cache";
import type { Card } from "@prisma/client";

describe("In-Memory Cache System", () => {
  beforeEach(() => {
    cache.clear();
    questsCache.clear();
  });

  it("should store and retrieve cards from cache by tcg_id", () => {
    const mockCards: Partial<Card>[] = [
      { id: 1, name: "Charizard", rarity: 5, card_id: "base1-4" },
      { id: 2, name: "Pikachu", rarity: 1, card_id: "base1-58" },
    ];

    cache.set("base1", mockCards as Card[]);
    expect(cache.has("base1")).toBe(true);

    const retrieved = cache.get("base1");
    expect(retrieved).toBeDefined();
    expect(retrieved?.length).toBe(2);
    expect(retrieved?.[0].name).toBe("Charizard");
  });

  it("should isolate user-specific quest cache entries", () => {
    const user1Quests = [{ questId: 1, completed: true }];
    const user2Quests = [{ questId: 1, completed: false }];

    const now = new Date();
    questsCache.set("quests_user_1", [user1Quests, now]);
    questsCache.set("quests_user_2", [user2Quests, now]);

    expect(questsCache.get("quests_user_1")?.[0]).toEqual(user1Quests);
    expect(questsCache.get("quests_user_2")?.[0]).toEqual(user2Quests);
    expect(questsCache.get("quests_user_1")?.[0]).not.toEqual(questsCache.get("quests_user_2")?.[0]);
  });

  it("should delete cache keys properly", () => {
    cache.set("temp-key", []);
    expect(cache.has("temp-key")).toBe(true);

    cache.delete("temp-key");
    expect(cache.has("temp-key")).toBe(false);
  });
});

describe("shared cache loads", () => {
  it("deduplicates concurrent loads and retries after failure", async () => {
    const { memoryCache } = await import("../src/lib/cache");
    memoryCache.clear();
    let calls = 0;
    const load = async () => { calls++; await Bun.sleep(5); return [42]; };
    const results = await Promise.all(Array.from({ length: 20 }, () => memoryCache.getOrSet("concurrent", load, 1000)));
    expect(calls).toBe(1);
    expect(results.every((r) => r === results[0])).toBe(true);
    await expect(memoryCache.getOrSet("retry", async () => { throw new Error("unavailable"); }, 1000)).rejects.toThrow("unavailable");
    expect(await memoryCache.getOrSet("retry", load, 1000)).toEqual([42]);
  });
  it("does not repopulate an entry invalidated during a load", async () => {
    const { memoryCache } = await import("../src/lib/cache");
    memoryCache.clear();
    let resolve!: (value: number) => void;
    const pending = memoryCache.getOrSet("invalidated", () => new Promise<number>((r) => { resolve = r; }), 1000);
    await Promise.resolve();
    memoryCache.delete("invalidated");
    resolve(1);
    await pending;
    expect(memoryCache.get("invalidated")).toBeNull();
  });
});
