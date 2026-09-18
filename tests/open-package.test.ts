import { describe, expect, it } from "bun:test";
import { getRandomCardFromPackage } from "../src/lib/open-package";
import type { Card, Package } from "@prisma/client";

describe("Pack Opening Randomization & CDF", () => {
  const mockPkg: Partial<Package> = {
    id: 1,
    name: "Base Set Booster",
    cards_quantity: 5,
    common_rarity: 0.50,
    rare_rarity: 0.30,
    epic_rarity: 0.15,
    legendary_rarity: 0.04,
    full_legendary_rarity: 0.01,
  };

  const mockCardsByRarity: Record<string, Card[]> = {
    common: [
      { id: 1, name: "Pidgey", rarity: 1 } as Card,
      { id: 2, name: "Rattata", rarity: 1 } as Card,
    ],
    rare: [
      { id: 3, name: "Electabuzz", rarity: 2 } as Card,
    ],
    epic: [
      { id: 4, name: "Dragonite", rarity: 3 } as Card,
    ],
    legendary: [
      { id: 5, name: "Mewtwo", rarity: 4 } as Card,
    ],
    full_legendary: [
      { id: 6, name: "Charizard Holographic", rarity: 5 } as Card,
    ],
  };

  it("should draw cards belonging to the available pool", () => {
    const card = getRandomCardFromPackage(mockPkg as Package, mockCardsByRarity);
    expect(card).not.toBeNull();
    expect(card?.id).toBeGreaterThanOrEqual(1);
    expect(card?.id).toBeLessThanOrEqual(6);
  });

  it("should return null if the entire pool is empty", () => {
    const emptyPool: Record<string, Card[]> = {
      common: [],
      rare: [],
      epic: [],
      legendary: [],
      full_legendary: [],
    };
    const card = getRandomCardFromPackage(mockPkg as Package, emptyPool);
    expect(card).toBeNull();
  });

  it("should guarantee full_legendary when full_legendary weight is 1.0", () => {
    const godPack: Partial<Package> = {
      ...mockPkg,
      common_rarity: 0,
      rare_rarity: 0,
      epic_rarity: 0,
      legendary_rarity: 0,
      full_legendary_rarity: 1.0,
    };

    for (let i = 0; i < 20; i++) {
      const card = getRandomCardFromPackage(godPack as Package, mockCardsByRarity);
      expect(card).not.toBeNull();
      expect(card?.rarity).toBe(5);
      expect(card?.name).toBe("Charizard Holographic");
    }
  });

  it("should fallback to common pool when requested rarity pool is empty", () => {
    const noLegendaryPool: Record<string, Card[]> = {
      common: [{ id: 10, name: "Caterpie", rarity: 1 } as Card],
      rare: [],
      epic: [],
      legendary: [],
      full_legendary: [],
    };

    const legendPack: Partial<Package> = {
      ...mockPkg,
      common_rarity: 0,
      rare_rarity: 0,
      epic_rarity: 0,
      legendary_rarity: 1.0,
      full_legendary_rarity: 0,
    };

    const card = getRandomCardFromPackage(legendPack as Package, noLegendaryPool);
    expect(card).not.toBeNull();
    expect(card?.name).toBe("Caterpie");
  });
});
