import { battleReward } from "../lib/battle-rewards";
import { lockUsers } from "../lib/economy";
import { operation } from "../lib/operation";
import { DomainError } from "../lib/domain-error";
import { prisma } from "../helpers/prisma.client";
import {
  NPC_TRAINERS,
  BATTLE_TERRAINS,
  MAX_DECK_POINTS,
  REQUIRED_DECK_SIZE,
  getCardRecruitPoints,
  calculateCombatPower,
  simulateBattle,
  simulateGoBattle,
  type BattleSimulationResult,
} from "../lib/battle-engine";
import { type BackendLocale, translate } from "../i18n";

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
    await prisma.$transaction(async (tx) => {
      await lockUsers(tx, [userId]);
      const prisma = tx;
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

      await tx.userDeckCard.deleteMany({ where: { userId } });
      await tx.userDeckCard.createMany({ data: cardIds.map((cardId, slot) => ({ userId, cardId, slot })) });
    });

    return await this.getUserDeck(userId);
  }

  /**
   * Lista todos os Líderes de Ginásio disponíveis e o status de vitória do usuário
   */
  static async getGymLeaders(userId: number) {
    const userVictories = await prisma.userBattleRecord.groupBy({
      by: ["npcId"],
      where: {
        userId,
        won: true,
      },
      _count: true,
    });

    const victoryCounts: Record<string, number> = {};
    for (const rec of userVictories) {
      victoryCounts[rec.npcId] = rec._count;
    }

    const day = new Date(); day.setUTCHours(0, 0, 0, 0);
    const paidToday = await prisma.userBattleRecord.groupBy({by:["npcId","rewardCoins"],where:{userId,won:true,createdAt:{gte:day},rewardCoins:{gt:0}},_count:true});
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
        rewardCoins: wins===0 ? trainer.rewardCoins : paidToday.filter(r=>r.npcId===trainer.id && r.rewardCoins<trainer.rewardCoins).reduce((sum,r)=>sum+r._count,0)<2 ? Math.floor(trainer.rewardCoins*0.1) : 0,
        rewardXp: wins===0 ? Math.floor(trainer.rewardXp/10)*10 : 0,
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
    locale: BackendLocale = "pt",
    key?: string
  ): Promise<{ simulation: BattleSimulationResult; toastMessage: string }> {
    return operation(prisma, userId, "fightNpc", { npcId }, key, async (tx) => {
    const prisma = tx;
    const recent = await tx.userBattleRecord.count({ where: { userId, createdAt: { gt: new Date(Date.now() - 10_000) } } });
    if (recent) throw new DomainError("battle.cooldown", 429);
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
    Object.assign(simulation, await battleReward(tx, userId, trainer, simulation.won));

    await (async () => {
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
    })();

    const toastMessage = translate("battle.reward", locale, { coins: simulation.rewardCoins, xp: simulation.rewardXp });

    return { simulation, toastMessage };
    });
  }

  /**
   * Executa a batalha estilo Pokémon GO (Blefe 6 leva 3) com 2 escudos, ataques carregados e duelo de 3 rounds
   */
  static async fightNpcGo(
    userId: number,
    npcId: string,
    selectedCardIds: number[],
    locale: BackendLocale = "pt",
    key?: string
  ) {
    if (!Array.isArray(selectedCardIds) || selectedCardIds.length !== 3) {
      throw new DomainError("battle.selectThree");
    }

    return operation(prisma, userId, "fightNpcGo", { npcId, selectedCardIds }, key, async (tx) => {
    const prisma = tx;
    const recent = await tx.userBattleRecord.count({ where: { userId, createdAt: { gt: new Date(Date.now() - 10_000) } } });
    if (recent) throw new DomainError("battle.cooldown", 429);
    const trainer = NPC_TRAINERS.find((n) => n.id === npcId);
    if (!trainer) {
      throw new Error(translate("battle.npcNotFound", locale));
    }

    // Busca as cartas selecionadas e valida posse do usuário
    const ownedCards = await prisma.cards_user.findMany({
      where: {
        userId,
        cardId: { in: selectedCardIds },
      },
      include: { Card: true },
    });

    const cardsMap = new Map<number, any>();
    for (const oc of ownedCards) {
      cardsMap.set(oc.cardId, oc.Card);
    }

    const slots = await tx.userDeckCard.findMany({ where: { userId }, include: { Card: true } });
    if (slots.length !== REQUIRED_DECK_SIZE || slots.reduce((sum, s) => sum + getCardRecruitPoints(s.Card.rarity), 0) > MAX_DECK_POINTS) throw new DomainError("battle.deckIncompleteToFight");
    const counts = new Map<number, number>();
    for (const id of selectedCardIds) counts.set(id, (counts.get(id) || 0) + 1);
    for (const [id, needed] of counts) {
      if (ownedCards.filter((c) => c.cardId === id).length < needed || slots.filter((c) => c.cardId === id).length < needed) throw new DomainError("battle.notAllCardsOwnedOrTrade");
    }
    const playerPicks: any[] = [];
    for (const cid of selectedCardIds) {
      const card = cardsMap.get(cid);
      if (!card) {
        throw new DomainError("battle.notAllCardsOwnedOrTrade");
      }
      playerPicks.push(card);
    }

    // Revalidação de cartas em negociação
    const tradeMarked = await prisma.tradeMarkedCard.findMany({
      where: {
        userId,
        cardId: { in: selectedCardIds },
      },
    });

    if (tradeMarked.length > 0) {
      throw new DomainError("battle.notAllCardsOwnedOrTrade");
    }

    // Simula o combate Pokémon GO
    const simulation = simulateGoBattle(playerPicks, trainer);
    Object.assign(simulation, await battleReward(tx, userId, trainer, simulation.won));

    // Registra batalha e premiação
    await (async () => {
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
    })();

    const toastMessage = translate("battle.reward", locale, { coins: simulation.rewardCoins, xp: simulation.rewardXp });

    return { simulation, toastMessage };
    });
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

    // Bounded dynamic programming: O(collection size × 6 slots × 20 points).
    // Each row is a physical owned copy, so duplicate types never exceed inventory.
    type Candidate = { power: number; picks: typeof eligibleCards };
    const states = Array.from({ length: REQUIRED_DECK_SIZE + 1 }, () => new Map<number, Candidate>());
    states[0].set(0, { power: 0, picks: [] });
    for (const candidate of eligibleCards) {
      for (let count = REQUIRED_DECK_SIZE - 1; count >= 0; count--) {
        for (const [points, state] of states[count]) {
          const nextPoints = points + candidate.recruitPoints;
          if (nextPoints > MAX_DECK_POINTS) continue;
          const power = state.power + candidate.combatPower;
          if (power > (states[count + 1].get(nextPoints)?.power ?? -1)) states[count + 1].set(nextPoints, { power, picks: [...state.picks, candidate] });
        }
      }
    }
    const best = [...states[REQUIRED_DECK_SIZE].values()].sort((a, b) => b.power - a.power)[0];
    if (!best) throw new DomainError("battle.insufficientLowPrCards");
    const bestDeck = best.picks;

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
