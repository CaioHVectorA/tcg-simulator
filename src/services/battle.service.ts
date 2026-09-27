import { prisma } from "../helpers/prisma.client";
import {
  NPC_TRAINERS,
  BATTLE_TERRAINS,
  MAX_DECK_POINTS,
  REQUIRED_DECK_SIZE,
  getCardRecruitPoints,
  calculateCombatPower,
  simulateBattle,
  type BattleSimulationResult,
} from "../lib/battle-engine";
import { BackendLocale, translate } from "../i18n";

export interface UserDeckSummary {
  cards: Array<{
    id: number;
    slot: number;
    cardId: number;
    isMarkedForTrade: boolean;
    recruitPoints: number;
    combatPower: ReturnType<typeof calculateCombatPower>;
    card: any;
  }>;
  totalPoints: number;
  maxPoints: number;
  requiredCards: number;
  isComplete: boolean;
  hasTradeConflict: boolean;
  totalCp: number;
}

export class BattleService {
  /**
   * Obtém o deck de batalha atual do usuário
   */
  static async getUserDeck(userId: number): Promise<UserDeckSummary> {
    const deckSlots = await prisma.userDeckCard.findMany({
      where: { userId },
      include: { Card: true },
      orderBy: { slot: "asc" },
    });

    const cardIds = deckSlots.map((d) => d.cardId);
    const tradeMarked = await prisma.tradeMarkedCard.findMany({
      where: {
        userId,
        cardId: { in: cardIds },
      },
    });
    const tradeMarkedSet = new Set(tradeMarked.map((tm) => tm.cardId));

    let totalPoints = 0;
    let totalCp = 0;

    const cards = deckSlots.map((d) => {
      const pr = getCardRecruitPoints(d.Card.rarity);
      const cp = calculateCombatPower(d.Card);
      totalPoints += pr;
      totalCp += cp.totalCp;

      return {
        id: d.id,
        slot: d.slot,
        cardId: d.cardId,
        isMarkedForTrade: tradeMarkedSet.has(d.cardId),
        recruitPoints: pr,
        combatPower: cp,
        card: d.Card,
      };
    });

    return {
      cards,
      totalPoints,
      maxPoints: MAX_DECK_POINTS,
      requiredCards: REQUIRED_DECK_SIZE,
      isComplete: cards.length === REQUIRED_DECK_SIZE,
      hasTradeConflict: tradeMarkedSet.size > 0,
      totalCp,
    };
  }

  /**
   * Valida e persiste um novo deck de batalha para o usuário
   */
  static async saveUserDeck(userId: number, cardIds: number[], locale: BackendLocale = "pt") {
    // 1. Validação de tamanho
    if (!Array.isArray(cardIds) || cardIds.length !== REQUIRED_DECK_SIZE) {
      throw new Error(translate("battle.deckRequiredSize", locale));
    }

    // 2. Validação de posse
    const requiredCounts: Record<number, number> = {};
    for (const cid of cardIds) {
      requiredCounts[cid] = (requiredCounts[cid] || 0) + 1;
    }

    const ownedCards = await prisma.cards_user.findMany({
      where: {
        userId,
        cardId: { in: Object.keys(requiredCounts).map(Number) },
      },
      include: { Card: true },
    });

    for (const [cidStr, reqCount] of Object.entries(requiredCounts)) {
      const cid = Number(cidStr);
      const owned = ownedCards.filter((c) => c.cardId === cid);
      if (owned.length < reqCount) {
        throw new Error(translate("battle.notAllCardsOwned", locale));
      }
    }

    // 3. Regra de Isolamento de Trocas: cartas marcadas para troca NÃO podem compor decks
    const tradeMarked = await prisma.tradeMarkedCard.findMany({
      where: {
        userId,
        cardId: { in: cardIds },
      },
      include: { Card: true },
    });

    if (tradeMarked.length > 0) {
      const cardNames = tradeMarked.map((tm) => tm.Card.name).join(", ");
      throw new Error(`${translate("battle.tradeConflict", locale)} (${cardNames})`);
    }

    // 4. Validação de Teto Salarial (Max 20 PR)
    const cardsMap = new Map<number, any>();
    for (const oc of ownedCards) {
      cardsMap.set(oc.cardId, oc.Card);
    }

    let totalPr = 0;
    for (const cid of cardIds) {
      const card = cardsMap.get(cid);
      if (!card) {
        throw new Error(translate("battle.cardNotFound", locale));
      }
      totalPr += getCardRecruitPoints(card.rarity);
    }

    if (totalPr > MAX_DECK_POINTS) {
      throw new Error(
        `${translate("battle.prLimitExceeded", locale)} (${totalPr}/${MAX_DECK_POINTS} PR)`
      );
    }

    // 5. Transação atômica para salvar os slots
    await prisma.$transaction(async (tx) => {
      await tx.userDeckCard.deleteMany({
        where: { userId },
      });

      await tx.userDeckCard.createMany({
        data: cardIds.map((cardId, slot) => ({
          userId,
          cardId,
          slot,
        })),
      });
    });

    return await this.getUserDeck(userId);
  }

  /**
   * Lista todos os Líderes de Ginásio disponíveis e o status de vitória do usuário
   */
  static async getGymLeaders(userId: number) {
    const userVictories = await prisma.userBattleRecord.findMany({
      where: {
        userId,
        won: true,
      },
      select: { npcId: true },
    });

    const victoryCounts: Record<string, number> = {};
    for (const rec of userVictories) {
      victoryCounts[rec.npcId] = (victoryCounts[rec.npcId] || 0) + 1;
    }

    const npcs = NPC_TRAINERS.map((trainer) => {
      const wins = victoryCounts[trainer.id] || 0;
      const preferredTerrain = BATTLE_TERRAINS.find(
        (t) => t.id === trainer.preferredTerrainId
      );

      return {
        id: trainer.id,
        name: trainer.name,
        title: trainer.title,
        avatar: trainer.avatar,
        badge: trainer.badge,
        difficulty: trainer.difficulty,
        difficultyLabel: trainer.difficultyLabel,
        description: trainer.description,
        rewardCoins: trainer.rewardCoins,
        rewardXp: trainer.rewardXp,
        preferredTerrain,
        isDefeated: wins > 0,
        victoryCount: wins,
        deckPreview: trainer.deck.map((c) => ({
          name: c.name,
          image_url: c.image_url,
          rarity: c.rarity,
          hp: c.hp,
          type: c.type,
        })),
      };
    });

    return { npcs, terrains: BATTLE_TERRAINS };
  }

  /**
   * Executa a batalha contra um Líder de Ginásio (NPC)
   */
  static async fightNpc(
    userId: number,
    npcId: string,
    locale: BackendLocale = "pt"
  ): Promise<{ simulation: BattleSimulationResult; toastMessage: string }> {
    const trainer = NPC_TRAINERS.find((n) => n.id === npcId);
    if (!trainer) {
      throw new Error(translate("battle.npcNotFound", locale));
    }

    const deckSlots = await prisma.userDeckCard.findMany({
      where: { userId },
      include: { Card: true },
      orderBy: { slot: "asc" },
    });

    if (deckSlots.length !== REQUIRED_DECK_SIZE) {
      throw new Error(translate("battle.deckIncompleteToFight", locale));
    }

    const cardIds = deckSlots.map((d) => d.cardId);

    // 1. Revalidação de posse real em tempo real (cards_user)
    const requiredCounts: Record<number, number> = {};
    for (const cid of cardIds) {
      requiredCounts[cid] = (requiredCounts[cid] || 0) + 1;
    }

    const ownedCards = await prisma.cards_user.findMany({
      where: {
        userId,
        cardId: { in: Object.keys(requiredCounts).map(Number) },
      },
      include: { Card: true },
    });

    for (const [cidStr, reqCount] of Object.entries(requiredCounts)) {
      const cid = Number(cidStr);
      const owned = ownedCards.filter((c) => c.cardId === cid);
      if (owned.length < reqCount) {
        throw new Error(
          translate("battle.notAllCardsOwnedOrTrade", locale) ||
            "Você não possui mais todas as cartas deste deck ou uma delas está em negociação."
        );
      }
    }

    // 2. Revalidação de cartas em negociação de trocas (tradeMarkedCard)
    const tradeMarked = await prisma.tradeMarkedCard.findMany({
      where: {
        userId,
        cardId: { in: cardIds },
      },
    });

    if (tradeMarked.length > 0) {
      throw new Error(
        translate("battle.notAllCardsOwnedOrTrade", locale) ||
          "Você não possui mais todas as cartas deste deck ou uma delas está em negociação."
      );
    }

    // 3. Recálculo e validação estrita do teto de Pontos de Recrutamento (PR <= 20)
    let totalPr = 0;
    for (const slot of deckSlots) {
      totalPr += getCardRecruitPoints(slot.Card.rarity);
    }
    if (totalPr > MAX_DECK_POINTS) {
      throw new Error(
        `${translate("battle.prLimitExceeded", locale)} (${totalPr}/${MAX_DECK_POINTS} PR)`
      );
    }

    const playerCards = deckSlots.map((d) => d.Card);
    const simulation = simulateBattle(playerCards, trainer);

    await prisma.$transaction(async (tx) => {
      await tx.userBattleRecord.create({
        data: {
          userId,
          npcId: trainer.id,
          won: simulation.won,
          playerScore: simulation.playerScore,
          opponentScore: simulation.npcScore,
          rewardCoins: simulation.rewardCoins,
          rewardXp: simulation.rewardXp,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: {
          money: { increment: simulation.rewardCoins },
          rarityPoints: { increment: simulation.rewardXp },
        },
      });
    });

    const toastMessage = simulation.won
      ? `${trainer.name} - ${simulation.rewardCoins.toLocaleString()} coins & +${simulation.rewardXp} XP!`
      : `${trainer.name} - +${simulation.rewardCoins.toLocaleString()} coins.`;

    return { simulation, toastMessage };
  }

  /**
   * Retorna o histórico recente de batalhas
   */
  static async getBattleHistory(userId: number, take: number = 10) {
    const records = await prisma.userBattleRecord.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take,
    });

    const history = records.map((r) => {
      const trainer = NPC_TRAINERS.find((n) => n.id === r.npcId);
      return {
        id: r.id,
        npcId: r.npcId,
        npcName: trainer?.name || r.npcId,
        npcTitle: trainer?.title || "Gym Leader",
        npcBadge: trainer?.badge || "🏅",
        won: r.won,
        playerScore: r.playerScore,
        opponentScore: r.opponentScore,
        rewardCoins: r.rewardCoins,
        rewardXp: r.rewardXp,
        createdAt: r.createdAt,
      };
    });

    return { history };
  }

  /**
   * Recomenda de forma otimizada o melhor conjunto de 6 cartas dentro do teto de 20 PR
   */
  static async recommendDeck(userId: number, locale: BackendLocale = "pt") {
    const userCards = await prisma.cards_user.findMany({
      where: { userId },
      include: { Card: true },
    });

    if (userCards.length < REQUIRED_DECK_SIZE) {
      throw new Error(translate("battle.insufficientCardsForDeck", locale));
    }

    const tradeMarked = await prisma.tradeMarkedCard.findMany({
      where: { userId },
      select: { cardId: true },
    });
    const tradeMarkedSet = new Set(tradeMarked.map((tm) => tm.cardId));

    const eligibleCards = userCards
      .filter((uc) => !tradeMarkedSet.has(uc.cardId))
      .map((uc) => {
        const pr = getCardRecruitPoints(uc.Card.rarity);
        const cp = calculateCombatPower(uc.Card);
        return {
          card: uc.Card,
          cardId: uc.cardId,
          recruitPoints: pr,
          combatPower: cp.totalCp,
          cpRatio: cp.totalCp / pr,
        };
      });

    if (eligibleCards.length < REQUIRED_DECK_SIZE) {
      throw new Error(translate("battle.insufficientEligibleCards", locale));
    }

    eligibleCards.sort((a, b) => b.combatPower - a.combatPower);

    let bestDeck: typeof eligibleCards = [];
    let bestTotalCp = -1;

    function search(
      startIndex: number,
      current: typeof eligibleCards,
      currentPr: number,
      currentCp: number
    ) {
      if (current.length === REQUIRED_DECK_SIZE) {
        if (currentPr <= MAX_DECK_POINTS && currentCp > bestTotalCp) {
          bestTotalCp = currentCp;
          bestDeck = [...current];
        }
        return;
      }

      const remainingNeeded = REQUIRED_DECK_SIZE - current.length;
      if (currentPr + remainingNeeded * 1 > MAX_DECK_POINTS) return;

      for (let i = startIndex; i < eligibleCards.length; i++) {
        const candidate = eligibleCards[i];
        if (currentPr + candidate.recruitPoints <= MAX_DECK_POINTS) {
          current.push(candidate);
          search(
            i + 1,
            current,
            currentPr + candidate.recruitPoints,
            currentCp + candidate.combatPower
          );
          current.pop();
        }
        if (bestDeck.length === REQUIRED_DECK_SIZE && i > startIndex + 25) break;
      }
    }

    search(0, [], 0, 0);

    // Se o knapsack inicial por CP não completou 6 cartas dentro de 20 PR:
    if (bestDeck.length !== REQUIRED_DECK_SIZE) {
      // Executa algoritmo de downgrade search ordenando pelo menor PR e maior CP
      const sortedByPr = [...eligibleCards].sort(
        (a, b) => a.recruitPoints - b.recruitPoints || b.combatPower - a.combatPower
      );
      const lowestPrCandidates = sortedByPr.slice(0, REQUIRED_DECK_SIZE);
      const lowestPrSum = lowestPrCandidates.reduce((acc, c) => acc + c.recruitPoints, 0);

      if (lowestPrCandidates.length === REQUIRED_DECK_SIZE && lowestPrSum <= MAX_DECK_POINTS) {
        bestDeck = lowestPrCandidates;
      } else {
        throw new Error(
          translate("battle.insufficientLowPrCards", locale) ||
            "Coleção insuficiente para montar um deck tático válido (mínimo de 6 cartas com até 20 PR). Abra novos pacotes para obter cartas básicas!"
        );
      }
    }

    const totalPoints = bestDeck.reduce((acc, c) => acc + c.recruitPoints, 0);
    const totalCp = bestDeck.reduce((acc, c) => acc + c.combatPower, 0);

    if (bestDeck.length !== REQUIRED_DECK_SIZE || totalPoints > MAX_DECK_POINTS) {
      throw new Error(
        translate("battle.insufficientLowPrCards", locale) ||
          "Coleção insuficiente para montar um deck tático válido (mínimo de 6 cartas com até 20 PR). Abra novos pacotes para obter cartas básicas!"
      );
    }

    return {
      recommendedCards: bestDeck.map((d, slot) => ({
        slot,
        cardId: d.cardId,
        card: d.card,
        recruitPoints: d.recruitPoints,
        combatPower: d.combatPower,
      })),
      totalPoints,
      totalCp,
      maxPoints: MAX_DECK_POINTS,
    };
  }

  /**
   * Obtém a lista de cartas disponíveis do usuário para montar decks
   */
  static async getAvailableCards(userId: number) {
    const userCards = await prisma.cards_user.findMany({
      where: { userId },
      include: { Card: true },
    });

    const tradeMarked = await prisma.tradeMarkedCard.findMany({
      where: { userId },
      select: { cardId: true },
    });
    const tradeMarkedSet = new Set(tradeMarked.map((tm) => tm.cardId));

    const cardsMap = new Map<
      number,
      {
        card: any;
        quantity: number;
        isMarkedForTrade: boolean;
        recruitPoints: number;
        combatPower: number;
      }
    >();

    for (const uc of userCards) {
      if (!uc.Card) continue;
      if (cardsMap.has(uc.cardId)) {
        cardsMap.get(uc.cardId)!.quantity++;
      } else {
        const pr = getCardRecruitPoints(uc.Card.rarity);
        const cp = calculateCombatPower(uc.Card);
        cardsMap.set(uc.cardId, {
          card: uc.Card,
          quantity: 1,
          isMarkedForTrade: tradeMarkedSet.has(uc.cardId),
          recruitPoints: pr,
          combatPower: cp.totalCp,
        });
      }
    }

    const cards = Array.from(cardsMap.values()).sort((a, b) => {
      if (a.isMarkedForTrade !== b.isMarkedForTrade) {
        return a.isMarkedForTrade ? 1 : -1;
      }
      return b.combatPower - a.combatPower;
    });

    return { cards };
  }
}
