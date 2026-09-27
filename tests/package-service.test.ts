import { describe, expect, it } from "bun:test";
import { PackageService } from "../src/services/package.service";
import type { Card } from "@prisma/client";

describe("PackageService Unit Tests", () => {
  describe("Lootbox Cards Count Formula", () => {
    it("should enforce a minimum of 3 cards for small gold amounts", () => {
      expect(PackageService.calculateLootboxCardsCount(10)).toBe(3);
      expect(PackageService.calculateLootboxCardsCount(100)).toBe(3);
    });

    it("should scale card count with gold investment correctly", () => {
      // sqrt(500/35) = sqrt(14.28) ~ 3.77 -> floor 3 + 1 = 4
      expect(PackageService.calculateLootboxCardsCount(500)).toBe(4);
      // sqrt(2500/35) = sqrt(71.42) ~ 8.45 -> floor 8 + 1 = 9
      expect(PackageService.calculateLootboxCardsCount(2500)).toBe(9);
      // sqrt(10000/35) = sqrt(285.71) ~ 16.9 -> floor 16 + 1 = 17
      expect(PackageService.calculateLootboxCardsCount(10000)).toBe(17);
    });

    it("should cap maximum card count at 25 for massive investments", () => {
      expect(PackageService.calculateLootboxCardsCount(100000)).toBe(25);
      expect(PackageService.calculateLootboxCardsCount(1000000)).toBe(25);
    });
  });

  describe("Lootbox Rarity Distribution & Weights (CDF)", () => {
    it("should generate 5 rarity tiers from Common (1) to Full Legendary (5)", () => {
      const weights = PackageService.calculateLootboxRarityWeights(1000);
      expect(weights).toHaveLength(5);
      const rarities = weights.map((w) => w.rarity);
      expect(rarities).toContain(1);
      expect(rarities).toContain(2);
      expect(rarities).toContain(3);
      expect(rarities).toContain(4);
      expect(rarities).toContain(5);
    });

    it("should give higher high-tier probability for larger gold deposits", () => {
      const lowInvest = PackageService.calculateLootboxRarityWeights(500);
      const highInvest = PackageService.calculateLootboxRarityWeights(100000);

      const lowP5 = lowInvest.find((w) => w.rarity === 5)?.weight || 0;
      const highP5 = highInvest.find((w) => w.rarity === 5)?.weight || 0;
      expect(highP5).toBeGreaterThan(lowP5);

      const lowP4 = lowInvest.find((w) => w.rarity === 4)?.weight || 0;
      const highP4 = highInvest.find((w) => w.rarity === 4)?.weight || 0;
      expect(highP4).toBeGreaterThan(lowP4);
    });

    it("should guarantee rarity selection when weight is 1.0", () => {
      const deterministicWeights = [
        { rarity: 5, weight: 1.0 },
        { rarity: 4, weight: 0 },
        { rarity: 3, weight: 0 },
        { rarity: 2, weight: 0 },
        { rarity: 1, weight: 0 },
      ];

      for (let i = 0; i < 20; i++) {
        expect(PackageService.rollRarityFromWeights(deterministicWeights)).toBe(5);
      }
    });
  });

  describe("Ascending Rarity Sorting & Suspense", () => {
    it("should sort cards from least rare (Tier 1) to most rare (Tier 5)", () => {
      const unsorted = [
        { id: 1, name: "Charizard", rarity: 5 },
        { id: 2, name: "Pidgey", rarity: 1 },
        { id: 3, name: "Dragonite", rarity: 4 },
        { id: 4, name: "Pikachu", rarity: 2 },
        { id: 5, name: "Gengar", rarity: 3 },
      ];

      const sorted = PackageService.sortCardsByRarityAscending(unsorted);
      expect(sorted.map((c) => c.rarity)).toEqual([1, 2, 3, 4, 5]);
      expect(sorted[0].name).toBe("Pidgey");
      expect(sorted[4].name).toBe("Charizard");
    });

    it("should safely handle cards with missing or null rarities", () => {
      const edgeCards = [
        { id: 1, name: "Rare", rarity: 3 },
        { id: 2, name: "Unknown", rarity: null as any },
        { id: 3, name: "Legendary", rarity: 5 },
      ];

      const sorted = PackageService.sortCardsByRarityAscending(edgeCards);
      expect(sorted[0].name).toBe("Unknown"); // Treated as rarity 1
      expect(sorted[2].name).toBe("Legendary");
    });
  });

  describe("Rarity Points Calculation", () => {
    it("should compute exact total rarity points gain from drawn cards", () => {
      const cards = [
        { id: 1, rarity: 1 },
        { id: 2, rarity: 2 },
        { id: 3, rarity: 3 },
        { id: 4, rarity: 4 },
        { id: 5, rarity: 5 },
      ];
      expect(PackageService.calculateRarityPointsGain(cards)).toBe(15);
    });

    it("should default missing rarity to 1 point", () => {
      const cards = [
        { id: 1, rarity: null as any },
        { id: 2, rarity: undefined as any },
      ];
      expect(PackageService.calculateRarityPointsGain(cards)).toBe(2);
    });
  });

  describe("Thematic Lootbox Card Draw & Duplicate Protection", () => {
    const mockPool: Card[] = Array.from({ length: 40 }, (_, i) => ({
      id: i + 1,
      name: `Pokemon ${i + 1}`,
      rarity: (i % 5) + 1,
      card_id: `base-${i + 1}`,
      hp: 60 + (i % 5) * 20,
      image_url: `https://example.com/card-${i + 1}.png`,
      type: "Colorless",
      created_at: new Date(),
    }));

    const weights = PackageService.calculateLootboxRarityWeights(5000);

    it("should draw the exact number of requested cards", () => {
      const drawn = PackageService.drawThematicLootboxCards(mockPool, 10, weights);
      expect(drawn).toHaveLength(10);
    });

    it("should enforce duplicate protection within a single lootbox opening", () => {
      const drawn = PackageService.drawThematicLootboxCards(mockPool, 15, weights);
      const uniqueIds = new Set(drawn.map((c) => c.id));
      expect(uniqueIds.size).toBe(15);
    });

    it("should handle empty pool gracefully without throwing error", () => {
      const drawn = PackageService.drawThematicLootboxCards([], 5, weights);
      expect(drawn).toEqual([]);
    });

    it("should allow drawing even when requested count exceeds unique pool size by repeating gracefully", () => {
      const smallPool = mockPool.slice(0, 3);
      const drawn = PackageService.drawThematicLootboxCards(smallPool, 8, weights);
      expect(drawn).toHaveLength(8);
      // All drawn cards must belong to smallPool
      for (const card of drawn) {
        expect(smallPool.some((p) => p.id === card.id)).toBe(true);
      }
    });
  });
});
