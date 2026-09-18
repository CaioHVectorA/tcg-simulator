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
