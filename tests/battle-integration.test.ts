import { describe, expect, it } from "bun:test";
import {
  NPC_TRAINERS,
  BATTLE_TERRAINS,
  MAX_DECK_POINTS,
  REQUIRED_DECK_SIZE,
  getCardRecruitPoints,
  calculateCombatPower,
  simulateBattle,
} from "../src/lib/battle-engine";

describe("Battle Integration: End-to-End Game Flow", () => {
  it("should execute a full gym campaign against all 5 leaders", () => {
    // Player equips a balanced legal team: 16 PR total (under 20 PR cap)
    // 1 Mística (5), 2 Épicas (3+3=6), 2 Raras (2+2=4), 1 Comum (1) = 16 PR
    const playerDeck = [
      { name: "Charizard ex", rarity: 3, hp: 330, type: "Fire" },
      { name: "Blastoise ex", rarity: 3, hp: 320, type: "Water" },
      { name: "Pikachu VMAX", rarity: 4, hp: 310, type: "Lightning" },
      { name: "Venusaur", rarity: 2, hp: 160, type: "Grass" },
      { name: "Machamp", rarity: 2, hp: 150, type: "Fighting" },
      { name: "Pidgeot", rarity: 1, hp: 130, type: "Colorless" },
    ];

    const totalPr = playerDeck.reduce((acc, c) => acc + getCardRecruitPoints(c.rarity), 0);
    expect(totalPr).toBe(16);
    expect(totalPr).toBeLessThanOrEqual(MAX_DECK_POINTS);
    expect(playerDeck.length).toBe(REQUIRED_DECK_SIZE);

    let totalCoinsEarned = 0;
    let totalXpEarned = 0;
    let victories = 0;

    for (const leader of NPC_TRAINERS) {
      const match = simulateBattle(playerDeck, leader);

      expect(match.lanes.length).toBe(3);
      expect(match.playerScore + match.npcScore).toBe(3);
      expect(match.rewardCoins).toBeGreaterThan(0);
      expect(match.rewardXp).toBeGreaterThan(0);

      totalCoinsEarned += match.rewardCoins;
      totalXpEarned += match.rewardXp;

      if (match.won) {
        victories++;
        expect(match.rewardCoins).toBe(leader.rewardCoins);
        expect(match.rewardXp).toBe(leader.rewardXp);
      } else {
        expect(match.rewardCoins).toBe(Math.floor(leader.rewardCoins * 0.15));
        expect(match.rewardXp).toBe(Math.floor(leader.rewardXp * 0.20));
      }
    }

    expect(totalCoinsEarned).toBeGreaterThan(0);
    expect(totalXpEarned).toBeGreaterThan(0);
    expect(victories).toBeGreaterThanOrEqual(1); // Player deck is strong enough to beat at least Brock
  });

  it("should verify terrain bonuses enhance combat power accurately across all 6 terrains", () => {
    for (const terrain of BATTLE_TERRAINS) {
      expect(terrain.favoredTypes.length).toBeGreaterThanOrEqual(1);

      // Card that matches one of the favored types
      const favoredType = terrain.favoredTypes[0];
      const favoredCard = { name: "Test Favored", rarity: 2, hp: 100, type: favoredType };
      const cpFavored = calculateCombatPower(favoredCard, terrain);

      // Card that does not match
      const neutralCard = { name: "Test Neutral", rarity: 2, hp: 100, type: "UnknownType" };
      const cpNeutral = calculateCombatPower(neutralCard, terrain);

      expect(cpFavored.terrainBonus).toBeGreaterThan(0);
      expect(cpNeutral.terrainBonus).toBe(0);
      expect(cpFavored.totalCp).toBeGreaterThan(cpNeutral.totalCp);
    }
  });
});
