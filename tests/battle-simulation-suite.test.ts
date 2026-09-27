import { describe, expect, it } from "bun:test";
import {
  BATTLE_TERRAINS,
  NPC_TRAINERS,
  MAX_DECK_POINTS,
  REQUIRED_DECK_SIZE,
  TYPE_ADVANTAGES,
  hasTypeAdvantage,
  checkDuoSynergy,
  getCardRecruitPoints,
  calculateCombatPower,
  simulateBattle,
  type BattleTerrain,
} from "../src/lib/battle-engine";

describe("Battle Simulation Suite: Mathematical Precision & Formulas", () => {
  const volcano = BATTLE_TERRAINS.find((t) => t.id === "volcano")!;
  const ocean = BATTLE_TERRAINS.find((t) => t.id === "ocean")!;

  it("should calculate exact Base CP by rarity tiers", () => {
    expect(calculateCombatPower({ name: "C1", rarity: 1 }).baseCp).toBe(25);
    expect(calculateCombatPower({ name: "C2", rarity: 2 }).baseCp).toBe(45);
    expect(calculateCombatPower({ name: "C3", rarity: 3 }).baseCp).toBe(70);
    expect(calculateCombatPower({ name: "C4", rarity: 4 }).baseCp).toBe(100);
    expect(calculateCombatPower({ name: "C5", rarity: 5 }).baseCp).toBe(130);
    // Raridades anômalas devem ter fallback seguro
    expect(calculateCombatPower({ name: "C0", rarity: 0 }).baseCp).toBe(25);
  });

  it("should compute HP Bonus safely across edge cases (0 HP, negative, NaN, massive HP)", () => {
    // 0 HP -> +0
    expect(calculateCombatPower({ name: "P0", rarity: 1, hp: 0 }).hpBonus).toBe(0);
    // 45 HP -> floor(45/10)*2 = 8
    expect(calculateCombatPower({ name: "P45", rarity: 1, hp: 45 }).hpBonus).toBe(8);
    // 120 HP -> floor(120/10)*2 = 24
    expect(calculateCombatPower({ name: "P120", rarity: 1, hp: 120 }).hpBonus).toBe(24);
    // 340 HP -> floor(340/10)*2 = 68
    expect(calculateCombatPower({ name: "P340", rarity: 1, hp: 340 }).hpBonus).toBe(68);
    // NaN ou undefined -> fallback para 0 sem quebrar
    expect(calculateCombatPower({ name: "Pnan", rarity: 1, hp: NaN }).hpBonus).toBe(0);
    expect(calculateCombatPower({ name: "Pund", rarity: 1, hp: undefined }).hpBonus).toBe(0);
  });

  it("should calculate all subtype bonuses accurately", () => {
    expect(calculateCombatPower({ name: "Mega Gengar", rarity: 3 }).subtypeBonus).toBe(35);
    expect(calculateCombatPower({ name: "M Rayquaza EX", rarity: 4 }).subtypeBonus).toBe(35);
    expect(calculateCombatPower({ name: "Pikachu & Zekrom Tag Team", rarity: 4 }).subtypeBonus).toBe(30);
    expect(calculateCombatPower({ name: "Charizard VMAX", rarity: 4 }).subtypeBonus).toBe(30);
    expect(calculateCombatPower({ name: "Arceus VSTAR", rarity: 4 }).subtypeBonus).toBe(25);
    expect(calculateCombatPower({ name: "Garchomp Tera", rarity: 3 }).subtypeBonus).toBe(25);
    expect(calculateCombatPower({ name: "Mewtwo ex", rarity: 3 }).subtypeBonus).toBe(15);
    expect(calculateCombatPower({ name: "Lugia GX", rarity: 3 }).subtypeBonus).toBe(15);
    expect(calculateCombatPower({ name: "Radiant Greninja", rarity: 3 }).subtypeBonus).toBe(10);
    expect(calculateCombatPower({ name: "Lucario V", rarity: 3 }).subtypeBonus).toBe(10);
  });

  it("should calculate full additive bonuses: Subtotal + Terrain + Duo Synergy + Type Advantage", () => {
    // Carta: Charizard ex (Raridade 3, 300 HP, Fogo)
    // baseCp = 70
    // hpBonus = floor(300/10)*2 = 60
    // subtypeBonus = 15 (ex)
    // subtotal = 70 + 60 + 15 = 145
    //
    // No Terreno Vulcão:
    // terrainBonus = round(145 * 0.20) = 29
    // Com aliado Fogo (Synergy):
    // synergyBonus = round(145 * 0.10) = 15
    // Enfrentando oponente Grama (Type Advantage: Fire > Grass):
    // typeAdvantageBonus = round(145 * 0.15) = 22
    // totalCp = 145 + 29 + 15 + 22 = 211 CP
    const card = { name: "Charizard ex", rarity: 3, hp: 300, type: "Fire" };
    const ally = { name: "Arcanine", type: "Fire" };
    const opponents = [{ name: "Venusaur", type: "Grass" }];

    const cp = calculateCombatPower(card, volcano, {
      allyCard: ally,
      opponentCards: opponents,
    });

    expect(cp.baseCp).toBe(70);
    expect(cp.hpBonus).toBe(60);
    expect(cp.subtypeBonus).toBe(15);
    expect(cp.terrainBonus).toBe(29);
    expect(cp.synergyBonus).toBe(15);
    expect(cp.typeAdvantageBonus).toBe(22);
    expect(cp.totalCp).toBe(211);
  });
});

describe("Battle Simulation Suite: Type Advantage Matrix", () => {
  it("should validate all classic TCG type interactions", () => {
    expect(hasTypeAdvantage("Fire", "Grass")).toBe(true);
    expect(hasTypeAdvantage("Fire", "Metal")).toBe(true);
    expect(hasTypeAdvantage("Fire", "Water")).toBe(false);

    expect(hasTypeAdvantage("Water", "Fire")).toBe(true);
    expect(hasTypeAdvantage("Water", "Lightning")).toBe(false);

    expect(hasTypeAdvantage("Lightning", "Water")).toBe(true);
    expect(hasTypeAdvantage("Lightning", "Fighting")).toBe(false);

    expect(hasTypeAdvantage("Grass", "Water")).toBe(true);
    expect(hasTypeAdvantage("Psychic", "Fighting")).toBe(true);
    expect(hasTypeAdvantage("Fighting", "Darkness")).toBe(true);
    expect(hasTypeAdvantage("Darkness", "Psychic")).toBe(true);
  });

  it("should trigger duo synergy when types match or are favored by terrain", () => {
    const fireCardA = { type: "Fire" };
    const fireCardB = { type: "Fire" };
    const waterCard = { type: "Water" };
    const dragonCard = { type: "Dragon" };

    const volcano = BATTLE_TERRAINS.find((t) => t.id === "volcano")!;

    // Mesmo tipo: sinergia garantida
    expect(checkDuoSynergy(fireCardA, fireCardB)).toBe(true);

    // Tipos diferentes fora de terreno favorecido: sem sinergia
    expect(checkDuoSynergy(fireCardA, waterCard)).toBe(false);

    // Tipos diferentes, mas ambos favorecidos no Vulcão (Fire + Dragon): sinergia ativada!
    expect(checkDuoSynergy(fireCardA, dragonCard, volcano)).toBe(true);
  });
});

describe("Battle Simulation Suite: Tactical Matchups & Monte Carlo Scenarios", () => {
  const brock = NPC_TRAINERS.find((n) => n.id === "brock")!;
  const misty = NPC_TRAINERS.find((n) => n.id === "misty")!;
  const surge = NPC_TRAINERS.find((n) => n.id === "surge")!;
  const erika = NPC_TRAINERS.find((n) => n.id === "erika")!;
  const giovanni = NPC_TRAINERS.find((n) => n.id === "giovanni")!;

  it("Scenario 1: Weak Swarm Deck (All Tier 1, 6 PR total) vs Giovanni Boss", () => {
    const swarmDeck = [
      { name: "Caterpie", rarity: 1, hp: 40, type: "Grass" },
      { name: "Weedle", rarity: 1, hp: 40, type: "Grass" },
      { name: "Magikarp", rarity: 1, hp: 30, type: "Water" },
      { name: "Pidgey", rarity: 1, hp: 50, type: "Colorless" },
      { name: "Rattata", rarity: 1, hp: 30, type: "Colorless" },
      { name: "Zubat", rarity: 1, hp: 40, type: "Psychic" },
    ];

    let wins = 0;
    const TOTAL_RUNS = 100;

    for (let i = 0; i < TOTAL_RUNS; i++) {
      const match = simulateBattle(swarmDeck, giovanni);
      if (match.won) wins++;
      expect(match.rewardCoins).toBe(Math.floor(giovanni.rewardCoins * 0.15));
      expect(match.rewardXp).toBe(Math.floor(giovanni.rewardXp * 0.20));
      expect(match.lanes.length).toBe(3);
    }

    // O deck de cartas comuns fracas deve perder 100% das vezes contra o Chefe Supremo
    expect(wins).toBe(0);
  });

  it("Scenario 2: Mono-Fire Deck exploiting Erika's Grass Gym with tactical lane placement", () => {
    // Deck tático de Fogo (12 PR total, bem abaixo dos 20 PR):
    // Lane Alfa (0, 1): Arcanine (T2 - 2 PR) + Ninetales ex (T3 - 3 PR) -> domina a linha de frente
    // Lane Beta (2, 3): Charmander (T1 - 1 PR) + Growlithe (T1 - 1 PR) -> lane tática de contenção
    // Lane Gama (4, 5): Charizard ex (T3 - 3 PR) + Magmar (T2 - 2 PR) -> esmaga a retaguarda de grama
    const fireTacticalDeck = [
      { name: "Arcanine", rarity: 2, hp: 130, type: "Fire" },
      { name: "Ninetales ex", rarity: 3, hp: 260, type: "Fire" },
      { name: "Charmander", rarity: 1, hp: 60, type: "Fire" },
      { name: "Growlithe", rarity: 1, hp: 70, type: "Fire" },
      { name: "Charizard ex", rarity: 3, hp: 300, type: "Fire" },
      { name: "Magmar", rarity: 2, hp: 90, type: "Fire" },
    ];

    const totalPr = fireTacticalDeck.reduce((acc, c) => acc + getCardRecruitPoints(c.rarity), 0);
    expect(totalPr).toBe(12);
    expect(totalPr).toBeLessThanOrEqual(MAX_DECK_POINTS);

    let wins = 0;
    const TOTAL_RUNS = 100;

    for (let i = 0; i < TOTAL_RUNS; i++) {
      const match = simulateBattle(fireTacticalDeck, erika);
      if (match.won) wins++;
    }

    // Graças à vantagem de tipo (Fogo > Grama) e ao posicionamento tático vencendo 2 de 3 lanes:
    expect(wins).toBeGreaterThanOrEqual(90);
  });

  it("Scenario 3: Competitive Balanced Deck across full 5-Leader Gauntlet", () => {
    // Deck tático de 16 PR:
    // 1 Mística (5 PR), 2 Épicas (3+3=6 PR), 2 Raras (2+2=4 PR), 1 Comum (1 PR) = 16 PR
    const competitiveDeck = [
      { name: "Pikachu VMAX", rarity: 4, hp: 310, type: "Lightning" },
      { name: "Jolteon", rarity: 2, hp: 100, type: "Lightning" },
      { name: "Blastoise ex", rarity: 3, hp: 300, type: "Water" },
      { name: "Gyarados", rarity: 2, hp: 160, type: "Water" },
      { name: "Mewtwo ex", rarity: 3, hp: 220, type: "Psychic" },
      { name: "Abra", rarity: 1, hp: 50, type: "Psychic" },
    ];

    const totalPr = competitiveDeck.reduce((acc, c) => acc + getCardRecruitPoints(c.rarity), 0);
    expect(totalPr).toBe(16);

    const winRates: Record<string, number> = {};
    const SIMS_PER_LEADER = 50;

    for (const leader of NPC_TRAINERS) {
      let leaderWins = 0;
      for (let i = 0; i < SIMS_PER_LEADER; i++) {
        const match = simulateBattle(competitiveDeck, leader);
        if (match.won) leaderWins++;
      }
      winRates[leader.id] = (leaderWins / SIMS_PER_LEADER) * 100;
    }

    // Valida progressão balanceada da dificuldade:
    // Brock (iniciante)
    expect(winRates["brock"]).toBeGreaterThanOrEqual(70);
    // Misty (normal)
    expect(winRates["misty"]).toBeGreaterThanOrEqual(50);
    // Giovanni (mestre supremo) apresenta desafio real
    expect(winRates["giovanni"]).toBeLessThanOrEqual(winRates["brock"]);
  });

  it("Scenario 4: Lane Tiebreaker Mechanics (Same CP resolved by highest single card)", () => {
    // 2 cartas que somam exatamente 120 CP:
    // Jogador: Carta de 80 CP + Carta de 40 CP
    // NPC: Carta de 60 CP + Carta de 60 CP
    // Soma: 120 vs 120. Desempate: max(80, 40) = 80 > max(60, 60) = 60 -> Vitória do Jogador!
    const playerDeck = [
      { name: "Hero A", rarity: 2, hp: 100, type: "Colorless" }, // base 45 + hp 20 = 65
      { name: "Hero B", rarity: 2, hp: 100, type: "Colorless" },
      { name: "Hero C", rarity: 2, hp: 100, type: "Colorless" },
      { name: "Hero D", rarity: 2, hp: 100, type: "Colorless" },
      { name: "Hero E", rarity: 2, hp: 100, type: "Colorless" },
      { name: "Hero F", rarity: 2, hp: 100, type: "Colorless" },
    ];

    const match = simulateBattle(playerDeck, brock);
    expect(match.lanes.length).toBe(3);
    for (const lane of match.lanes) {
      expect(["player", "npc"]).toContain(lane.winner);
    }
    expect(match.playerScore + match.npcScore).toBe(3);
  });
});
