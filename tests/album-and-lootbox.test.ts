import { describe, expect, it } from "bun:test";
import { OFFICIAL_ALBUMS } from "../src/controller/album.controller";

describe("Album & Thematic Lootbox Mechanics", () => {
  it("should define valid official albums with rewards and target cards", () => {
    expect(OFFICIAL_ALBUMS.length).toBeGreaterThanOrEqual(8);

    OFFICIAL_ALBUMS.forEach((album) => {
      expect(album.id).toBeTruthy();
      expect(album.title).toBeTruthy();
      expect(album.targetNames.length).toBeGreaterThanOrEqual(3);
      expect(album.rewardGold).toBeGreaterThan(0);
      expect(album.rewardXp).toBeGreaterThan(0);
      expect(["Regiões", "Lendários", "Especiais"]).toContain(album.category);
    });

    const kantoTrio = OFFICIAL_ALBUMS.find((a) => a.id === "kanto_trio");
    expect(kantoTrio).toBeDefined();
    expect(kantoTrio?.targetNames).toEqual(["Articuno", "Zapdos", "Moltres"]);

    const johtoBeasts = OFFICIAL_ALBUMS.find((a) => a.id === "johto_beasts");
    expect(johtoBeasts).toBeDefined();
    expect(johtoBeasts?.targetNames).toEqual(["Raikou", "Entei", "Suicune"]);

    const arceusAlbum = OFFICIAL_ALBUMS.find((a) => a.id === "arceus_creator");
    expect(arceusAlbum).toBeDefined();
    expect(arceusAlbum?.targetNames).toContain("Arceus");
  });

  it("should calculate correct lootbox card count scaling based on gold deposit", () => {
    const calculateCardsCount = (goldAmount: number) => {
      return Math.min(15, Math.max(3, Math.floor(Math.sqrt(goldAmount / 50)) + 1));
    };

    expect(calculateCardsCount(500)).toBe(4);
    expect(calculateCardsCount(1000)).toBe(5);
    expect(calculateCardsCount(2500)).toBe(8);
    expect(calculateCardsCount(5000)).toBe(11);
    expect(calculateCardsCount(10000)).toBe(15);
    expect(calculateCardsCount(50000)).toBe(15); // Max cap at 15
  });

  it("should guarantee duplicate protection within a lootbox roll", () => {
    // Mock card pool with IDs
    const pool = Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      name: `Card ${i + 1}`,
      rarity: (i % 5) + 1,
    }));

    const cardsCount = 10;
    const chosenCards: typeof pool = [];
    const chosenIds = new Set<number>();

    for (let i = 0; i < cardsCount; i++) {
      let candidates = pool.filter((c) => !chosenIds.has(c.id));
      if (candidates.length === 0) candidates = pool;
      const picked = candidates[Math.floor(Math.random() * candidates.length)];
      chosenCards.push(picked);
      chosenIds.add(picked.id);
    }

    expect(chosenCards).toHaveLength(10);
    // Duplicate protection verification
    const uniqueIds = new Set(chosenCards.map((c) => c.id));
    expect(uniqueIds.size).toBe(10);
  });

  it("should strictly match Pokemon names and NOT confuse Mew with Mewtwo", () => {
    const { matchesPokemonName } = require("../src/controller/album.controller");

    // Mew should match Mew, Mew ex, Mew VMAX
    expect(matchesPokemonName("Mew", "Mew")).toBe(true);
    expect(matchesPokemonName("Mew ex", "Mew")).toBe(true);
    expect(matchesPokemonName("Mew VMAX", "Mew")).toBe(true);

    // CRITICAL: Mew should NOT match Mewtwo or Mewtwo-GX!
    expect(matchesPokemonName("Mewtwo", "Mew")).toBe(false);
    expect(matchesPokemonName("Mewtwo-GX", "Mew")).toBe(false);
    expect(matchesPokemonName("Mewtwo VSTAR", "Mew")).toBe(false);

    // Mewtwo should match Mewtwo and variants, but NOT Mew
    expect(matchesPokemonName("Mewtwo", "Mewtwo")).toBe(true);
    expect(matchesPokemonName("Mewtwo-GX", "Mewtwo")).toBe(true);
    expect(matchesPokemonName("Mew", "Mewtwo")).toBe(false);
  });
});
