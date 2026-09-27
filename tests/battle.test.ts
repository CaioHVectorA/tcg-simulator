import { describe, expect, it } from "bun:test";
import {
  BATTLE_TERRAINS,
  NPC_TRAINERS,
  MAX_DECK_POINTS,
  REQUIRED_DECK_SIZE,
  getCardRecruitPoints,
  calculateCombatPower,
  simulateBattle,
  type BattleTerrain,
} from "../src/lib/battle-engine";

describe("Battle Engine: Recruitment Points (PR) & Salary Cap", () => {
  it("should assign correct PR based on card rarity", () => {
    expect(getCardRecruitPoints(1)).toBe(1); // Comum: 1 PR
    expect(getCardRecruitPoints(2)).toBe(2); // Rara: 2 PR
    expect(getCardRecruitPoints(3)).toBe(3); // Épica: 3 PR (harmonizado com GDD v2.0.0)
    expect(getCardRecruitPoints(4)).toBe(5); // Mística: 5 PR (harmonizado com GDD v2.0.0)
    expect(getCardRecruitPoints(5)).toBe(8); // Lendária/God Pull: 8 PR
  });

  it("should enforce exactly 6 cards and maximum 20 PR cap", () => {
    expect(REQUIRED_DECK_SIZE).toBe(6);
    expect(MAX_DECK_POINTS).toBe(20);

    // Composição clássica do GDD v2.0.0: 1 Lendária (8), 1 Mística (5), 1 Épica (3), 1 Rara (2), 2 Comuns (1+1) -> Exatamente 20 PR (Válido!)
    const classicDeckRarities = [5, 4, 3, 2, 1, 1];
    const totalClassicPr = classicDeckRarities.reduce(
      (acc, r) => acc + getCardRecruitPoints(r),
      0
    );
    expect(totalClassicPr).toBe(20);
    expect(totalClassicPr <= MAX_DECK_POINTS).toBe(true);

    // Deck excessivamente caro: 2 Lendárias (8+8=16), 1 Mística (5), 1 Épica (3), 2 Raras (2+2=4) -> 28 PR (Inválido!)
    const expensiveDeckRarities = [5, 5, 4, 3, 2, 2];
    const totalExpensivePr = expensiveDeckRarities.reduce(
      (acc, r) => acc + getCardRecruitPoints(r),
      0
    );
    expect(totalExpensivePr).toBe(28);
    expect(totalExpensivePr > MAX_DECK_POINTS).toBe(true);

    // Deck tático balanceado: 1 Mística (5), 2 Épicas (3+3=6), 2 Raras (2+2=4), 1 Comum (1) -> 16 PR (Válido!)
    const legalDeckRarities = [4, 3, 3, 2, 2, 1];
    const totalLegalPr = legalDeckRarities.reduce(
      (acc, r) => acc + getCardRecruitPoints(r),
      0
    );
    expect(totalLegalPr).toBe(16);
    expect(totalLegalPr <= MAX_DECK_POINTS).toBe(true);
  });
});

describe("Battle Engine: Combat Power (CP) Calculation", () => {
  const volcanoTerrain = BATTLE_TERRAINS.find((t) => t.id === "volcano")!;
  const oceanTerrain = BATTLE_TERRAINS.find((t) => t.id === "ocean")!;

  it("should compute base CP and HP bonus correctly", () => {
    // Carta Comum, 60 HP, sem bônus de subtipo nem terreno
    const card = { name: "Charmander", rarity: 1, hp: 60, type: "Fire" };
    const cp = calculateCombatPower(card);

    expect(cp.baseCp).toBe(25);
    expect(cp.hpBonus).toBe(12); // Math.floor(60 / 10) * 2 = 12
    expect(cp.subtypeBonus).toBe(0);
    expect(cp.terrainBonus).toBe(0);
    expect(cp.totalCp).toBe(37);
  });

  it("should apply special mechanic / subtype bonuses correctly", () => {
    // Mega Charizard EX (Mega: +35)
    const megaCard = { name: "Mega Charizard EX", rarity: 4, hp: 220, type: "Fire" };
    const cpMega = calculateCombatPower(megaCard);
    expect(cpMega.baseCp).toBe(100);
    expect(cpMega.hpBonus).toBe(44); // floor(220/10)*2
    expect(cpMega.subtypeBonus).toBe(35); // Mega bonus
    expect(cpMega.totalCp).toBe(179);

    // Pikachu VMAX (VMAX: +30)
    const vmaxCard = { name: "Pikachu VMAX", rarity: 4, hp: 310, type: "Lightning" };
    const cpVmax = calculateCombatPower(vmaxCard);
    expect(cpVmax.subtypeBonus).toBe(30);

    // Arceus VSTAR (VSTAR: +25)
    const vstarCard = { name: "Arceus VSTAR", rarity: 4, hp: 280, type: "Colorless" };
    const cpVstar = calculateCombatPower(vstarCard);
    expect(cpVstar.subtypeBonus).toBe(25);

    // Mewtwo ex (ex: +15)
    const exCard = { name: "Mewtwo ex", rarity: 3, hp: 180, type: "Psychic" };
    const cpEx = calculateCombatPower(exCard);
    expect(cpEx.subtypeBonus).toBe(15);
  });

  it("should apply +20% terrain bonus only when type is favored", () => {
    const fireCard = { name: "Charizard ex", rarity: 3, hp: 330, type: "Fire" };
    // Subtotal = base(70) + hp(66) + ex(15) = 151
    const cpInOcean = calculateCombatPower(fireCard, oceanTerrain);
    expect(cpInOcean.terrainBonus).toBe(0);
    expect(cpInOcean.totalCp).toBe(151);

    const cpInVolcano = calculateCombatPower(fireCard, volcanoTerrain);
    // 151 * 0.20 = 30.2 -> Math.round = 30
    expect(cpInVolcano.terrainBonus).toBe(30);
    expect(cpInVolcano.totalCp).toBe(181);
  });
});

describe("Battle Engine: NPC Gym Leaders & Roster", () => {
  it("should have all 5 Gym Leaders with complete 6-card decks", () => {
    expect(NPC_TRAINERS.length).toBe(5);

    const leaderIds = NPC_TRAINERS.map((l) => l.id);
    expect(leaderIds).toEqual(["brock", "misty", "surge", "erika", "giovanni"]);

    for (const trainer of NPC_TRAINERS) {
      expect(trainer.deck.length).toBe(6);
      expect(trainer.rewardCoins).toBeGreaterThan(0);
      expect(trainer.rewardXp).toBeGreaterThan(0);
      expect(trainer.badge).toBeTruthy();
      expect(trainer.avatar).toBeTruthy();

      const terrain = BATTLE_TERRAINS.find((t) => t.id === trainer.preferredTerrainId);
      expect(terrain).toBeDefined();
    }
  });

  it("should progressively scale rewards by difficulty", () => {
    const brock = NPC_TRAINERS.find((n) => n.id === "brock")!;
    const misty = NPC_TRAINERS.find((n) => n.id === "misty")!;
    const surge = NPC_TRAINERS.find((n) => n.id === "surge")!;
    const erika = NPC_TRAINERS.find((n) => n.id === "erika")!;
    const giovanni = NPC_TRAINERS.find((n) => n.id === "giovanni")!;

    expect(brock.rewardCoins).toBeLessThan(misty.rewardCoins);
    expect(misty.rewardCoins).toBeLessThan(surge.rewardCoins);
    expect(surge.rewardCoins).toBeLessThan(erika.rewardCoins);
    expect(erika.rewardCoins).toBeLessThan(giovanni.rewardCoins);
  });
});

describe("Battle Engine: Tactical 3-Lane Combat Simulation", () => {
  const brock = NPC_TRAINERS.find((n) => n.id === "brock")!;

  it("should throw error if player deck does not have exactly 6 cards", () => {
    expect(() => simulateBattle([], brock)).toThrow();
    expect(() => simulateBattle([{} as any, {} as any], brock)).toThrow();
  });

  it("should resolve 3 lanes and determine match winner correctly", () => {
    // Powerful high-tier deck
    const godDeck = [
      { name: "Charizard ex", rarity: 3, hp: 330, type: "Fire" },
      { name: "Mega Blastoise", rarity: 4, hp: 280, type: "Water" },
      { name: "Rayquaza VMAX", rarity: 4, hp: 320, type: "Dragon" },
      { name: "Arceus VSTAR", rarity: 4, hp: 280, type: "Colorless" },
      { name: "Mewtwo ex", rarity: 3, hp: 200, type: "Psychic" },
      { name: "Gengar ex", rarity: 3, hp: 210, type: "Psychic" },
    ];

    const result = simulateBattle(godDeck, brock);

    expect(result.lanes.length).toBe(3);
    expect(result.playerScore + result.npcScore).toBe(3);
    expect(result.won).toBe(true);
    expect(result.rewardCoins).toBe(brock.rewardCoins);
    expect(result.rewardXp).toBe(brock.rewardXp);
  });

  it("should award consolation rewards on defeat", () => {
    // Very weak deck against Giovanni
    const giovanni = NPC_TRAINERS.find((n) => n.id === "giovanni")!;
    const weakDeck = [
      { name: "Magikarp", rarity: 1, hp: 30, type: "Water" },
      { name: "Caterpie", rarity: 1, hp: 40, type: "Grass" },
      { name: "Weedle", rarity: 1, hp: 40, type: "Grass" },
      { name: "Pidgey", rarity: 1, hp: 50, type: "Colorless" },
      { name: "Rattata", rarity: 1, hp: 30, type: "Colorless" },
      { name: "Zubat", rarity: 1, hp: 40, type: "Psychic" },
    ];

    const result = simulateBattle(weakDeck, giovanni);
    expect(result.won).toBe(false);
    expect(result.rewardCoins).toBe(Math.floor(giovanni.rewardCoins * 0.15));
    expect(result.rewardXp).toBe(Math.floor(giovanni.rewardXp * 0.20));
  });
});

describe("Battle Rules: Trade-Marked Card Segregation", () => {
  it("should detect trade-marked card collision", () => {
    const deckCardIds = [101, 102, 103, 104, 105, 106];
    const tradeMarkedCards = [{ cardId: 104 }, { cardId: 200 }];

    const tradeMarkedSet = new Set(tradeMarkedCards.map((tm) => tm.cardId));
    const conflicts = deckCardIds.filter((id) => tradeMarkedSet.has(id));

    expect(conflicts).toEqual([104]);
    expect(conflicts.length > 0).toBe(true);
  });
});
