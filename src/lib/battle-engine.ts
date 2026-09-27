export interface BattleTerrain {
  id: string;
  name: string;
  favoredTypes: string[];
  description: string;
  badge: string;
  accentColor: string;
}

export const BATTLE_TERRAINS: BattleTerrain[] = [
  {
    id: "volcano",
    name: "Vulcão Ativo",
    favoredTypes: ["Fire", "Dragon"],
    description: "Lava incandescente que potencializa Pokémon de Fogo e Dragões ancestrais.",
    badge: "🌋",
    accentColor: "from-amber-600 to-red-600",
  },
  {
    id: "ocean",
    name: "Abismo Marinho",
    favoredTypes: ["Water", "Lightning"],
    description: "Águas turbulentas e condutividade elétrica que favorecem Água e Elétrico.",
    badge: "🌊",
    accentColor: "from-blue-600 to-cyan-600",
  },
  {
    id: "jungle",
    name: "Floresta Ancestral",
    favoredTypes: ["Grass"],
    description: "Vegetação densa e energia da natureza que amplificam Pokémon de Grama.",
    badge: "🌿",
    accentColor: "from-emerald-600 to-green-600",
  },
  {
    id: "psychic_chamber",
    name: "Câmara Psíquica",
    favoredTypes: ["Psychic", "Darkness"],
    description: "Vórtices mentais e sombras que favorecem energias Psíquicas e Sombrias.",
    badge: "🔮",
    accentColor: "from-purple-600 to-indigo-600",
  },
  {
    id: "combat_dojo",
    name: "Dojo de Combate",
    favoredTypes: ["Fighting", "Metal"],
    description: "Solo de ferro e disciplina marcial que elevam Pokémon de Luta e Metal.",
    badge: "🥋",
    accentColor: "from-amber-700 to-stone-700",
  },
  {
    id: "sky_peak",
    name: "Pico dos Céus",
    favoredTypes: ["Colorless", "Dragon"],
    description: "Ventos de alta altitude que concedem livre mobilidade a dragões e Pokémon voadores.",
    badge: "🌪️",
    accentColor: "from-sky-500 to-indigo-500",
  },
];

/**
 * Matriz de Vantagens Elementais (Pokémon TCG Classic Matchups)
 * O atacante ganha +15% de poder contra tipos vulneráveis.
 */
export const TYPE_ADVANTAGES: Record<string, string[]> = {
  Fire: ["Grass", "Metal", "Bug", "Ice"],
  Water: ["Fire", "Ground", "Rock"],
  Grass: ["Water", "Ground", "Rock"],
  Lightning: ["Water", "Flying"],
  Fighting: ["Colorless", "Darkness", "Metal", "Rock", "Normal"],
  Psychic: ["Fighting", "Poison"],
  Darkness: ["Psychic", "Ghost"],
  Metal: ["Fairy", "Ice", "Rock"],
  Dragon: ["Dragon"],
};

/**
 * Retorna o multiplicador / bônus de vantagem elemental entre dois tipos
 */
export function hasTypeAdvantage(attackerType?: string, defenderType?: string): boolean {
  if (!attackerType || !defenderType) return false;
  const list = TYPE_ADVANTAGES[attackerType] || [];
  return list.some((target) => target.toLowerCase() === defenderType.toLowerCase());
}

/**
 * Verifica se duas cartas na mesma rota geram Sinergia de Dupla (Teamwork)
 * (+10% CP se compartilharem o mesmo tipo ou forem do tipo favorito da arena)
 */
export function checkDuoSynergy(
  cardA?: { type?: string },
  cardB?: { type?: string },
  terrain?: BattleTerrain
): boolean {
  if (!cardA?.type || !cardB?.type) return false;
  if (cardA.type.toLowerCase() === cardB.type.toLowerCase() && cardA.type.toLowerCase() !== "none") {
    return true;
  }
  if (terrain) {
    const aFavored = terrain.favoredTypes.some(
      (ft) => ft.toLowerCase() === cardA.type?.toLowerCase()
    );
    const bFavored = terrain.favoredTypes.some(
      (ft) => ft.toLowerCase() === cardB.type?.toLowerCase()
    );
    if (aFavored && bFavored) return true;
  }
  return false;
}

/**
 * Retorna o custo em Pontos de Recrutamento (PR) com base na Raridade
 * Tier 1 = 1 PR | Tier 2 = 2 PR | Tier 3 = 3 PR | Tier 4 = 5 PR | Tier 5 = 8 PR
 * Conforme especificação oficial do GDD v2.0.0
 */
export const RARITY_RECRUIT_POINTS: Record<number, number> = {
  1: 1,
  2: 2,
  3: 3,
  4: 5,
  5: 8,
};

export function getCardRecruitPoints(rarity: number): number {
  return RARITY_RECRUIT_POINTS[rarity] ?? 1;
}

export const calculateCardPr = getCardRecruitPoints;

export const MAX_DECK_POINTS = 20;
export const REQUIRED_DECK_SIZE = 6;

export interface CombatPowerResult {
  baseCp: number;
  hpBonus: number;
  subtypeBonus: number;
  terrainBonus: number;
  synergyBonus: number;
  typeAdvantageBonus: number;
  totalCp: number;
}

export interface TacticalContext {
  allyCard?: { type?: string; name?: string };
  opponentCards?: { type?: string; name?: string }[];
}

/**
 * Calcula o Poder de Combate Real (CP) de um Pokémon
 * Base CP + Bônus de HP + Bônus de Subtipo + Modificador de Terreno + Bônus Táticos (Sinergia e Vantagem de Tipo)
 */
export function calculateCombatPower(
  card: {
    name: string;
    rarity: number;
    hp?: number;
    type?: string;
  },
  terrain?: BattleTerrain,
  context?: TacticalContext
): CombatPowerResult {
  // 1. Base por Raridade
  let baseCp = 25;
  if (card.rarity === 2) baseCp = 45;
  else if (card.rarity === 3) baseCp = 70;
  else if (card.rarity === 4) baseCp = 100;
  else if (card.rarity >= 5) baseCp = 130;

  // 2. Bônus de HP: floor(HP / 10) * 2 (com fallback seguro para evitar NaN)
  const hp = typeof card.hp === "number" && !isNaN(card.hp) ? Math.max(0, card.hp) : 0;
  const hpBonus = Math.floor(hp / 10) * 2;

  // 3. Bônus de Subtipo e Forma Especial no Nome
  const name = card.name || "";
  let subtypeBonus = 0;
  if (/\b(Mega|M-)\b/i.test(name) || /^M\s+/i.test(name)) {
    subtypeBonus = Math.max(subtypeBonus, 35);
  }
  if (/\b(VMAX|Tag Team)\b/i.test(name)) {
    subtypeBonus = Math.max(subtypeBonus, 30);
  }
  if (/\b(VSTAR|Tera)\b/i.test(name)) {
    subtypeBonus = Math.max(subtypeBonus, 25);
  }
  if (/\b(ex|EX|GX)\b/i.test(name)) {
    subtypeBonus = Math.max(subtypeBonus, 15);
  }
  if (/\b(Radiant)\b/i.test(name)) {
    subtypeBonus = Math.max(subtypeBonus, 10);
  }
  if (/\bV\b/i.test(name) && !/\b(VMAX|VSTAR)\b/i.test(name)) {
    subtypeBonus = Math.max(subtypeBonus, 10);
  }

  const subtotal = baseCp + hpBonus + subtypeBonus;

  // 4. Modificador de Terreno (+20% se o tipo for favorecido)
  let terrainBonus = 0;
  if (terrain && card.type && card.type !== "none") {
    const isFavored = terrain.favoredTypes.some(
      (ft) => ft.toLowerCase() === card.type?.toLowerCase()
    );
    if (isFavored) {
      terrainBonus = Math.round(subtotal * 0.20);
    }
  }

  // 5. Bônus de Sinergia de Dupla (+10% se houver parceiro sinérgico na mesma rota)
  let synergyBonus = 0;
  if (context?.allyCard && checkDuoSynergy(card, context.allyCard, terrain)) {
    synergyBonus = Math.round(subtotal * 0.10);
  }

  // 6. Bônus de Vantagem Elemental (+15% se tiver vantagem sobre pelo menos um oponente na rota)
  let typeAdvantageBonus = 0;
  if (context?.opponentCards && context.opponentCards.length > 0) {
    const hasAdvantage = context.opponentCards.some((opp) =>
      hasTypeAdvantage(card.type, opp.type)
    );
    if (hasAdvantage) {
      typeAdvantageBonus = Math.round(subtotal * 0.15);
    }
  }

  const totalCp = subtotal + terrainBonus + synergyBonus + typeAdvantageBonus;

  return {
    baseCp,
    hpBonus,
    subtypeBonus,
    terrainBonus,
    synergyBonus,
    typeAdvantageBonus,
    totalCp,
  };
}

export interface NpcCardData {
  name: string;
  image_url: string;
  rarity: number;
  hp: number;
  type: string;
}

export interface NpcTrainer {
  id: string;
  name: string;
  title: string;
  avatar: string;
  badge: string;
  difficulty: "iniciante" | "normal" | "desafiador" | "dificil" | "mestre";
  difficultyLabel: string;
  description: string;
  rewardCoins: number;
  rewardXp: number;
  preferredTerrainId: string;
  deck: NpcCardData[];
}

export const NPC_TRAINERS: NpcTrainer[] = [
  {
    id: "brock",
    name: "Brock",
    title: "Líder de Pewter",
    avatar: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/95.png",
    badge: "🪨 Insígnia da Rocha",
    difficulty: "iniciante",
    difficultyLabel: "Iniciante (Nível 1)",
    description: "Especialista em defesas impenetráveis com Pokémon dos tipos Pedra e Luta.",
    rewardCoins: 1500,
    rewardXp: 150,
    preferredTerrainId: "combat_dojo",
    deck: [
      // Lane Alfa: Linha de Frente
      { name: "Geodude", image_url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/74.png", rarity: 1, hp: 60, type: "Fighting" },
      { name: "Kabuto", image_url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/140.png", rarity: 1, hp: 70, type: "Fighting" },
      // Lane Beta (Combat Dojo - Trunfo)
      { name: "Golem ex", image_url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/76.png", rarity: 3, hp: 160, type: "Fighting" },
      { name: "Onix", image_url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/95.png", rarity: 2, hp: 110, type: "Fighting" },
      // Lane Gama: Retaguarda
      { name: "Graveler", image_url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/75.png", rarity: 2, hp: 90, type: "Fighting" },
      { name: "Rhyhorn", image_url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/111.png", rarity: 2, hp: 80, type: "Fighting" },
    ],
  },
  {
    id: "misty",
    name: "Misty",
    title: "Líder de Cerulean",
    avatar: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/121.png",
    badge: "💧 Insígnia da Cascata",
    difficulty: "normal",
    difficultyLabel: "Normal (Nível 3)",
    description: "Mestra das correntezas e táticas fluídas no comando de poderosos Pokémon de Água.",
    rewardCoins: 3500,
    rewardXp: 300,
    preferredTerrainId: "ocean",
    deck: [
      // Lane Alfa
      { name: "Psyduck", image_url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/54.png", rarity: 1, hp: 70, type: "Water" },
      { name: "Golduck", image_url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/55.png", rarity: 2, hp: 100, type: "Water" },
      // Lane Beta (Ocean - Trunfo)
      { name: "Lapras ex", image_url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/131.png", rarity: 3, hp: 210, type: "Water" },
      { name: "Starmie V", image_url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/121.png", rarity: 3, hp: 190, type: "Water" },
      // Lane Gama
      { name: "Staryu", image_url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/120.png", rarity: 1, hp: 60, type: "Water" },
      { name: "Seaking", image_url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/119.png", rarity: 2, hp: 90, type: "Water" },
    ],
  },
  {
    id: "surge",
    name: "Lt. Surge",
    title: "O Americano Relâmpago",
    avatar: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/26.png",
    badge: "⚡ Insígnia do Trovão",
    difficulty: "desafiador",
    difficultyLabel: "Desafiador (Nível 5)",
    description: "Táticas agressivas de choque rápido e sobrecarga de energia elétrica.",
    rewardCoins: 8000,
    rewardXp: 600,
    preferredTerrainId: "ocean",
    deck: [
      // Lane Alfa
      { name: "Voltorb", image_url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/100.png", rarity: 1, hp: 60, type: "Lightning" },
      { name: "Electrode", image_url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/101.png", rarity: 2, hp: 90, type: "Lightning" },
      // Lane Beta (Ocean - Trunfo)
      { name: "Raichu VMAX", image_url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/26.png", rarity: 4, hp: 300, type: "Lightning" },
      { name: "Jolteon ex", image_url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/135.png", rarity: 3, hp: 200, type: "Lightning" },
      // Lane Gama
      { name: "Magneton", image_url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/82.png", rarity: 2, hp: 100, type: "Lightning" },
      { name: "Electabuzz", image_url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/125.png", rarity: 2, hp: 100, type: "Lightning" },
    ],
  },
  {
    id: "erika",
    name: "Erika",
    title: "Princesa da Natureza",
    avatar: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/45.png",
    badge: "🌸 Insígnia do Arco-Íris",
    difficulty: "dificil",
    difficultyLabel: "Difícil (Nível 8)",
    description: "Harmonia vegetal e regeneração sustentável em florestas antigas.",
    rewardCoins: 15000,
    rewardXp: 1000,
    preferredTerrainId: "jungle",
    deck: [
      // Lane Alfa
      { name: "Bellsprout", image_url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/69.png", rarity: 1, hp: 60, type: "Grass" },
      { name: "Victreebel", image_url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/71.png", rarity: 2, hp: 130, type: "Grass" },
      // Lane Beta (Jungle - Trunfo)
      { name: "Venusaur VSTAR", image_url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/3.png", rarity: 4, hp: 280, type: "Grass" },
      { name: "Vileplume GX", image_url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/45.png", rarity: 3, hp: 240, type: "Grass" },
      // Lane Gama
      { name: "Tangela", image_url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/114.png", rarity: 2, hp: 80, type: "Grass" },
      { name: "Gloom", image_url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/44.png", rarity: 2, hp: 80, type: "Grass" },
    ],
  },
  {
    id: "giovanni",
    name: "Giovanni",
    title: "Chefe da Equipe Rocket",
    avatar: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/150.png",
    badge: "👑 Insígnia da Terra",
    difficulty: "mestre",
    difficultyLabel: "Mestre Supremo (Boss)",
    description: "O líder do submundo com monstros brutais e o lendário clone genético.",
    rewardCoins: 40000,
    rewardXp: 2500,
    preferredTerrainId: "psychic_chamber",
    deck: [
      // Lane Alfa
      { name: "Kangaskhan ex", image_url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/115.png", rarity: 3, hp: 230, type: "Colorless" },
      { name: "Persian", image_url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/53.png", rarity: 2, hp: 100, type: "Colorless" },
      // Lane Beta (Psychic Chamber - Trunfo)
      { name: "Mewtwo VSTAR (God Pull)", image_url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/150.png", rarity: 5, hp: 280, type: "Psychic" },
      { name: "Nidoqueen", image_url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/31.png", rarity: 2, hp: 140, type: "Psychic" },
      // Lane Gama
      { name: "Nidoking", image_url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/34.png", rarity: 2, hp: 150, type: "Psychic" },
      { name: "Rhydon", image_url: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/112.png", rarity: 2, hp: 120, type: "Fighting" },
    ],
  },
];

export interface LaneCombatResult {
  laneIndex: number;
  laneName: string;
  terrain: BattleTerrain;
  playerCards: {
    card: any;
    combatPower: CombatPowerResult;
  }[];
  npcCards: {
    card: any;
    combatPower: CombatPowerResult;
  }[];
  playerTotalCp: number;
  npcTotalCp: number;
  winner: "player" | "npc" | "draw";
}

export interface BattleSimulationResult {
  npc: {
    id: string;
    name: string;
    title: string;
    badge: string;
    avatar: string;
  };
  lanes: LaneCombatResult[];
  playerScore: number;
  npcScore: number;
  won: boolean;
  rewardCoins: number;
  rewardXp: number;
}

/**
 * Simula uma Batalha Tática nas 3 Rotas
 * O minideck de 6 cartas é distribuído em 3 lanes (2 cartas por lane)
 */
export function simulateBattle(
  playerDeck: any[],
  npcTrainer: NpcTrainer
): BattleSimulationResult {
  if (playerDeck.length !== REQUIRED_DECK_SIZE) {
    throw new Error("O deck precisa conter exatamente 6 cartas para a batalha.");
  }

  // Sorteia 3 terrenos distintos para as 3 rotas (garante o terreno preferido do NPC na rota central)
  const availableTerrains = BATTLE_TERRAINS.filter((t) => t.id !== npcTrainer.preferredTerrainId);
  const shuffledOther = [...availableTerrains].sort(() => Math.random() - 0.5);
  const preferred = BATTLE_TERRAINS.find((t) => t.id === npcTrainer.preferredTerrainId) || BATTLE_TERRAINS[0];

  const laneTerrains: BattleTerrain[] = [
    shuffledOther[0] || BATTLE_TERRAINS[1],
    preferred,
    shuffledOther[1] || BATTLE_TERRAINS[2],
  ];

  const laneNames = ["Arena Alfa", "Arena Central (Beta)", "Arena Gama"];

  const lanes: LaneCombatResult[] = [];
  let playerScore = 0;
  let npcScore = 0;

  for (let laneIdx = 0; laneIdx < 3; laneIdx++) {
    const terrain = laneTerrains[laneIdx];
    // 2 cartas por rota: [0, 1] na rota 0, [2, 3] na rota 1, [4, 5] na rota 2
    const pSlice = playerDeck.slice(laneIdx * 2, laneIdx * 2 + 2);
    const nSlice = npcTrainer.deck.slice(laneIdx * 2, laneIdx * 2 + 2);

    // Calcula CP do jogador com contexto tático (parceiro de rota + oponentes na rota)
    const playerCardsWithCp = pSlice.map((c, i) => {
      const ally = pSlice[i === 0 ? 1 : 0];
      return {
        card: c,
        combatPower: calculateCombatPower(c, terrain, {
          allyCard: ally,
          opponentCards: nSlice,
        }),
      };
    });

    // Calcula CP do NPC com contexto tático (parceiro de rota + oponentes na rota)
    const npcCardsWithCp = nSlice.map((c, i) => {
      const ally = nSlice[i === 0 ? 1 : 0];
      return {
        card: c,
        combatPower: calculateCombatPower(c, terrain, {
          allyCard: ally,
          opponentCards: pSlice,
        }),
      };
    });

    const pTotal = playerCardsWithCp.reduce((acc, curr) => acc + curr.combatPower.totalCp, 0);
    const nTotal = npcCardsWithCp.reduce((acc, curr) => acc + curr.combatPower.totalCp, 0);

    let winner: "player" | "npc" | "draw" = "draw";
    if (pTotal > nTotal) {
      winner = "player";
      playerScore++;
    } else if (nTotal > pTotal) {
      winner = "npc";
      npcScore++;
    } else {
      // Desempate por maior CP individual
      const maxP = Math.max(...playerCardsWithCp.map((c) => c.combatPower.totalCp));
      const maxN = Math.max(...npcCardsWithCp.map((c) => c.combatPower.totalCp));
      if (maxP > maxN) {
        winner = "player";
        playerScore++;
      } else if (maxN > maxP) {
        winner = "npc";
        npcScore++;
      } else {
        // Desempate secundário por maior HP total
        const hpP = playerCardsWithCp.reduce((acc, c) => acc + (c.card.hp || 0), 0);
        const hpN = npcCardsWithCp.reduce((acc, c) => acc + (c.card.hp || 0), 0);
        if (hpP >= hpN) {
          winner = "player";
          playerScore++;
        } else {
          winner = "npc";
          npcScore++;
        }
      }
    }

    lanes.push({
      laneIndex: laneIdx,
      laneName: laneNames[laneIdx],
      terrain,
      playerCards: playerCardsWithCp,
      npcCards: npcCardsWithCp,
      playerTotalCp: pTotal,
      npcTotalCp: nTotal,
      winner,
    });
  }

  const won = playerScore > npcScore;
  const rewardCoins = won ? npcTrainer.rewardCoins : Math.floor(npcTrainer.rewardCoins * 0.15);
  const rewardXp = won ? npcTrainer.rewardXp : Math.floor(npcTrainer.rewardXp * 0.20);

  return {
    npc: {
      id: npcTrainer.id,
      name: npcTrainer.name,
      title: npcTrainer.title,
      badge: npcTrainer.badge,
      avatar: npcTrainer.avatar,
    },
    lanes,
    playerScore,
    npcScore,
    won,
    rewardCoins,
    rewardXp,
  };
}
