import { prisma } from "../helpers/prisma.client";
import {
  getByRarityCluster,
  getRandomCardFromPackage,
  OpenPackage,
} from "../lib/open-package";
import type { Card, Package } from "@prisma/client";

export interface UserInventoryPackage {
  name: string;
  image_url: string;
  id: number;
  tcg_id?: string;
  quantity: number;
  description: string;
}

export interface ThematicLootboxResult {
  cards: Card[];
  cardsCount: number;
  goldSpent: number;
  packageName: string;
}

export class PackageService {
  /**
   * Pure function: Computa a quantidade de cartas proporcional ao ouro depositado
   * Mínimo de 3 cartas, escala com a raiz quadrada do ouro, teto de 25 cartas.
   */
  static calculateLootboxCardsCount(goldAmount: number): number {
    return Math.min(25, Math.max(3, Math.floor(Math.sqrt(goldAmount / 35)) + 1));
  }

  /**
   * Pure function: Computa a distribuição de probabilidades de raridade (CDF) com base no ouro investido
   * Mantém EV econômico controlado (EV <= 60%)
   */
  static calculateLootboxRarityWeights(goldAmount: number): Array<{ rarity: number; weight: number }> {
    const goldRatio = Math.min(30, Math.max(1, goldAmount / 1000));
    const p5 = Math.min(0.0015, Math.max(0.00002, 0.00002 + 0.000049 * (goldAmount / 35000)));
    const p4 = Math.min(0.02, Math.max(0.0003, 0.0003 + 0.00065 * (goldAmount / 35000)));
    const p3 = Math.min(0.38, 0.05 + 0.06 * Math.sqrt(goldRatio));
    const p2 = Math.min(0.40, 0.25 + 0.005 * goldRatio);
    const p1 = Math.max(0.20, 1 - (p5 + p4 + p3 + p2));

    return [
      { rarity: 5, weight: p5 }, // full_legendary (God Pull)
      { rarity: 4, weight: p4 }, // legendary
      { rarity: 3, weight: p3 }, // epic
      { rarity: 2, weight: p2 }, // rare
      { rarity: 1, weight: p1 }, // common
    ];
  }

  /**
   * Pure function: Sorteia uma raridade a partir dos pesos fornecidos
   */
  static rollRarityFromWeights(weights: Array<{ rarity: number; weight: number }>): number {
    const total = weights.reduce((s, w) => s + w.weight, 0);
    let r = Math.random() * total;
    for (const w of weights) {
      if (r <= w.weight) return w.rarity;
      r -= w.weight;
    }
    return 1;
  }

  /**
   * Pure function: Ordena cartas crescentemente por raridade (Tier 1 -> Tier 5)
   * Criando suspense crescente para o unboxing do jogador
   */
  static sortCardsByRarityAscending<T extends { rarity?: number | null }>(cards: T[]): T[] {
    return [...cards].sort((a, b) => (a.rarity || 1) - (b.rarity || 1));
  }

  /**
   * Pure function: Calcula o total de pontos de raridade concedidos por um conjunto de cartas
   */
  static calculateRarityPointsGain(cards: Array<{ rarity?: number | null }>): number {
    return cards.reduce((sum, c) => sum + (c.rarity || 1), 0);
  }

  /**
   * Pure function: Sorteia cartas de um pool temático garantindo proteção contra repetição
   */
  static drawThematicLootboxCards(
    pool: Card[],
    cardsCount: number,
    weights: Array<{ rarity: number; weight: number }>
  ): Card[] {
    if (pool.length === 0) return [];

    const chosenCards: Card[] = [];
    const chosenIds = new Set<number>();

    for (let i = 0; i < cardsCount; i++) {
      const targetRarity = this.rollRarityFromWeights(weights);
      // Candidatas com a raridade sorteada e que AINDA NÃO foram escolhidas
      let candidates = pool.filter((c) => c.rarity === targetRarity && !chosenIds.has(c.id));
      if (candidates.length === 0) {
        // Fallback para qualquer carta do pool que ainda não foi sorteada
        candidates = pool.filter((c) => !chosenIds.has(c.id));
      }
      if (candidates.length === 0) {
        // Se o pool for menor que cardsCount, permite re-sorteio
        candidates = pool;
      }
      const picked = candidates[Math.floor(Math.random() * candidates.length)];
      chosenCards.push(picked);
      chosenIds.add(picked.id);
    }

    return chosenCards;
  }

  /**
   * Lista todos os pacotes disponíveis (temáticos e padrão)
   */
  static async getAllPackages() {
    const packages = await prisma.package.findMany({
      select: {
        id: true,
        name: true,
        image_url: true,
        tcg_id: true,
        price: true,
      },
    });
    const tematics = packages.filter((p) => p.tcg_id);
    const standard = packages.filter((p) => !p.tcg_id);
    return { tematics, standard };
  }

  /**
   * Lista as cartas de um pacote com paginação e ordenação
   */
  static async getPackageCards(packageId: string, page?: number, sort?: string) {
    const orderBy = {
      "A-Z": { name: "asc" as const },
      "Z-A": { name: "desc" as const },
      "r-asc": { rarity: "asc" as const },
      "r-desc": { rarity: "desc" as const },
    };
    const limit = 32;
    const offset = ((Number(page) || 1) - 1) * limit;
    const count = await prisma.card.count({
      where: {
        card_id: {
          startsWith: packageId,
        },
      },
    });
    const pages = Math.ceil(count / limit);
    const cards = await prisma.card.findMany({
      where: {
        card_id: {
          startsWith: packageId,
        },
      },
      orderBy: orderBy[(sort || "r-desc") as keyof typeof orderBy] || orderBy["r-desc"],
      take: limit,
      skip: offset,
    });
    return {
      cards,
      pages,
      currentPage: Number(page) || 1,
    };
  }

  /**
   * Busca pacote por ID
   */
  static async getPackageById(id: number) {
    return prisma.package.findFirst({
      where: { id: Number(id) },
      select: { id: true, name: true, image_url: true, price: true },
    });
  }

  /**
   * Obtém os pacotes no inventário do usuário.
   * Utiliza agregação única (groupBy) para evitar gargalos sequenciais no Supabase PgBouncer.
   */
  static async getUserInventoryPackages(userId: number, userEmail?: string): Promise<UserInventoryPackage[]> {
    const isAdmin = userEmail === "admin@gmail.com";
    if (isAdmin) {
      const allPkgs = await prisma.package.findMany({ orderBy: { id: "asc" } });
      return allPkgs.map((p) => ({
        name: p.name,
        image_url: p.image_url,
        id: p.id,
        quantity: 9999,
        tcg_id: p.tcg_id || undefined,
        description: p.description || "",
      }));
    }

    // Agregação paralela direta no banco
    const counts = await prisma.packages_User.groupBy({
      by: ["packageId"],
      where: { userId, opened: false },
      _count: { id: true },
    });

    if (counts.length === 0) {
      return [];
    }

    const packageIds = counts.map((c) => c.packageId);
    const packagesList = await prisma.package.findMany({
      where: { id: { in: packageIds } },
      orderBy: { id: "asc" },
    });

    const countMap = new Map(counts.map((c) => [c.packageId, c._count.id]));

    return packagesList.map((p) => ({
      name: p.name,
      image_url: p.image_url,
      id: p.id,
      quantity: countMap.get(p.id) || 0,
      tcg_id: p.tcg_id || undefined,
      description: p.description || "",
    }));
  }

  /**
   * Realiza a compra de um único pacote
   */
  static async buyPackage(userId: number, packageId: number) {
    if (packageId < 1) {
      throw new Error("ID inválido!");
    }

    const pkg = await prisma.package.findFirst({
      where: { id: packageId },
    });
    if (!pkg) {
      throw new Error("Pacote não existente");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user || user.money < pkg.price) {
      throw new Error("Dinheiro insuficiente");
    }

    await prisma.$transaction([
      prisma.packages_User.create({
        data: {
          userId,
          packageId,
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: {
          money: { decrement: pkg.price },
        },
      }),
    ]);

    return { success: true };
  }

  /**
   * Realiza a compra de múltiplos pacotes em lote de forma atômica
   */
  static async buyManyPackages(userId: number, packagesId: number[]) {
    if (!packagesId || packagesId.length === 0) {
      throw new Error("Nenhum pacote selecionado!");
    }

    const uniqueIds = Array.from(new Set(packagesId));
    const packages = await prisma.package.findMany({
      where: { id: { in: uniqueIds } },
    });

    if (packages.length !== uniqueIds.length) {
      throw new Error("ID de pacote inválido!");
    }

    const quantities: Record<number, number> = {};
    packagesId.forEach((id: number) => {
      quantities[id] = (quantities[id] || 0) + 1;
    });

    const total = packages.reduce((acc, curr) => acc + curr.price * (quantities[curr.id] || 1), 0);

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user || user.money < total) {
      throw new Error("Dinheiro insuficiente!");
    }

    const userPackages: Array<{ userId: number; packageId: number }> = [];
    for (const [id, quantity] of Object.entries(quantities)) {
      for (let i = 0; i < quantity; i++) {
        userPackages.push({
          userId,
          packageId: Number(id),
        });
      }
    }

    await prisma.$transaction([
      prisma.packages_User.createMany({ data: userPackages }),
      prisma.user.update({
        where: { id: userId },
        data: {
          money: { decrement: total },
        },
      }),
    ]);

    return { success: true };
  }

  /**
   * Abre um pacote individual do inventário do usuário
   */
  static async openSinglePackage(userId: number, packageId: number, userEmail?: string): Promise<Card[]> {
    const isAdmin = userEmail === "admin@gmail.com";
    let userPkg = await prisma.packages_User.findFirst({
      where: { userId, packageId, opened: false },
    });

    if (!userPkg && isAdmin) {
      userPkg = await prisma.packages_User.create({
        data: { userId, packageId, opened: false },
      });
    }

    if (!userPkg) {
      throw new Error("Pacote não encontrado");
    }

    const packageToOpen = await prisma.package.findFirst({
      where: { id: packageId },
    });
    if (!packageToOpen) {
      throw new Error("Pacote não encontrado");
    }

    const cards = await OpenPackage(packageToOpen, prisma);
    const rarityPointsGain = this.calculateRarityPointsGain(cards);

    const txOps: any[] = [
      prisma.cards_user.createMany({
        data: cards.map((card) => ({ userId, cardId: card.id })),
      }),
      prisma.user.update({
        where: { id: userId },
        data: {
          rarityPoints: {
            increment: rarityPointsGain,
          },
        },
      }),
    ];

    if (!isAdmin) {
      txOps.unshift(
        prisma.packages_User.update({
          where: { id: userPkg.id },
          data: { opened: true },
        })
      );
    }

    await prisma.$transaction(txOps);
    return this.sortCardsByRarityAscending(cards);
  }

  /**
   * Abre múltiplos pacotes do inventário em lote
   */
  static async openBatchPackages(userId: number, packagesId: number[], userEmail?: string): Promise<Card[]> {
    if (!packagesId || packagesId.length === 0) {
      throw new Error("Nenhum pacote selecionado!");
    }

    const quantities: Record<number, number> = {};
    packagesId.forEach((id: number) => {
      quantities[id] = (quantities[id] || 0) + 1;
    });

    const packages = await prisma.package.findMany({
      where: { id: { in: packagesId } },
    });

    const packagesUser = await prisma.packages_User.findMany({
      where: {
        userId,
        packageId: { in: packagesId },
        opened: false,
      },
    });

    const isAdmin = userEmail === "admin@gmail.com";
    if (!isAdmin) {
      for (const [pkgIdStr, neededQty] of Object.entries(quantities)) {
        const pkgId = Number(pkgIdStr);
        const userCount = packagesUser.filter((p) => p.packageId === pkgId).length;
        if (userCount < neededQty) {
          throw new Error("Quantidade insuficiente de pacotes no inventário");
        }
      }
    }

    const allCards: Card[] = [];
    const packagesToMarkOpened: number[] = [];
    let rarityPointsGain = 0;

    for (const package_ of packages) {
      const cardsByRarity = await getByRarityCluster({ pkg: package_, prisma });
      const countToOpen = quantities[package_.id] || 0;
      const qtyPerPack = package_.cards_quantity || 5;

      for (let i = 0; i < countToOpen; i++) {
        for (let j = 0; j < qtyPerPack; j++) {
          const card = getRandomCardFromPackage(package_, cardsByRarity);
          if (card) {
            rarityPointsGain += card.rarity || 1;
            allCards.push(card);
          }
        }
      }

      if (!isAdmin) {
        const pkgPkgIds = packagesUser
          .filter((p) => p.packageId === package_.id)
          .map((p) => p.id)
          .slice(0, quantities[package_.id]);
        packagesToMarkOpened.push(...pkgPkgIds);
      }
    }

    const txOps: any[] = [
      prisma.cards_user.createMany({
        data: allCards.map((card) => ({ userId, cardId: card.id })),
      }),
      prisma.user.update({
        where: { id: userId },
        data: {
          rarityPoints: {
            increment: rarityPointsGain,
          },
        },
      }),
    ];

    if (!isAdmin && packagesToMarkOpened.length > 0) {
      txOps.unshift(
        prisma.packages_User.updateMany({
          where: {
            userId,
            id: { in: packagesToMarkOpened },
            opened: false,
          },
          data: { opened: true },
        })
      );
    }

    await prisma.$transaction(txOps);
    return this.sortCardsByRarityAscending(allCards);
  }

  /**
   * Abre um pacote temático personalizado com base em aporte de moedas
   */
  static async openThematicLootbox(
    userId: number,
    packageId: number,
    goldAmount: number
  ): Promise<ThematicLootboxResult> {
    if (!goldAmount || goldAmount < 500) {
      throw new Error("Valor mínimo de depósito é 500 moedas!");
    }
    if (goldAmount > 1000000) {
      throw new Error("Teto máximo excedido! O teto máximo de investimento é 1.000.000 moedas (1M).");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user || user.money < goldAmount) {
      throw new Error("Saldo insuficiente! Você não possui moedas suficientes.");
    }

    const pkg = await prisma.package.findFirst({
      where: { id: packageId },
    });
    if (!pkg) {
      throw new Error("Pacote temático não encontrado.");
    }

    const cardsCount = this.calculateLootboxCardsCount(goldAmount);
    const weights = this.calculateLootboxRarityWeights(goldAmount);

    const handleTcgId = pkg.tcg_id ? { startsWith: pkg.tcg_id } : undefined;
    let pool = await prisma.card.findMany({
      where: { card_id: handleTcgId },
    });
    if (pool.length === 0) {
      pool = await prisma.card.findMany({ take: 100 });
    }

    const chosenCards = this.drawThematicLootboxCards(pool, cardsCount, weights);
    const rarityGain = this.calculateRarityPointsGain(chosenCards);

    // Transação Atômica: Deduzir ouro, adicionar cartas e somar pontos de raridade
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          money: { decrement: goldAmount },
          rarityPoints: { increment: rarityGain },
        },
      }),
      prisma.cards_user.createMany({
        data: chosenCards.map((c) => ({ userId, cardId: c.id })),
      }),
    ]);

    const sortedCards = this.sortCardsByRarityAscending(chosenCards);
    return {
      cards: sortedCards,
      cardsCount: sortedCards.length,
      goldSpent: goldAmount,
      packageName: pkg.name,
    };
  }
}
