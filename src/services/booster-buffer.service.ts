import type { Card, Package, PrismaClient } from "@prisma/client";
import { prisma } from "../helpers/prisma.client";
import { getByRarityCluster, getRandomCardFromPackage, OpenPackage } from "../lib/open-package";

/**
 * BoosterBufferService
 * Mantém um buffer em memória de aberturas pré-sorteadas (20 por pacote)
 * para responder a requisições de abertura em tempo O(1) (<5ms),
 * repondo o estoque em background de forma assíncrona.
 */
export class BoosterBufferService {
  private static readonly BUFFER_TARGET_SIZE = 20;
  private static buffer = new Map<number, Card[][]>();
  private static isReplenishing = new Map<number, boolean>();
  private static isInitialized = false;

  /**
   * Inicializa o buffer pré-carregando 20 aberturas para cada pacote do sistema
   */
  public static async initialize(prismaClient: PrismaClient = prisma) {
    if (this.isInitialized) return;
    this.isInitialized = true;

    try {
      console.log("[BoosterBuffer] 🚀 Inicializando buffer de aberturas pré-geradas...");
      const packages = await prismaClient.package.findMany();

      // Warm a bounded batch, sharing the already loaded card cache.
      for (let offset = 0; offset < packages.length; offset += 4) {
        await Promise.all(packages.slice(offset, offset + 4).map(async (pkg) => {
          this.buffer.set(pkg.id, []);
          await this.replenishBuffer(pkg, prismaClient);
        }));
      }
      console.log(`[BoosterBuffer] 📦 Buffer registrado para ${packages.length} pacotes.`);
    } catch (err) {
      this.isInitialized = false;
      console.error("[BoosterBuffer] Initialization failed");
    }
  }

  /**
   * Retira 1 abertura pré-gerada do buffer de forma instantânea (0ms de sorteio)
   * e dispara a reposição assíncrona em background.
   */
  public static getPreRolledPack(pkg: Package, prismaClient: PrismaClient = prisma): Card[] | null {
    const queue = this.buffer.get(pkg.id);
    if (!queue || queue.length === 0) {
      // Dispara reposição se estiver vazio e retorna null para fallback síncrono
      this.triggerReplenish(pkg, prismaClient);
      return null;
    }

    const preRolled = queue.shift() || null;
    this.triggerReplenish(pkg, prismaClient);
    return preRolled;
  }

  /**
   * Dispara a reposição de novos packs em background se o buffer estiver abaixo do alvo
   */
  private static triggerReplenish(pkg: Package, prismaClient: PrismaClient = prisma) {
    if (this.isReplenishing.get(pkg.id)) return;

    // Executa em microtask para não prender a resposta HTTP atual
    setImmediate(() => {
      this.replenishBuffer(pkg, prismaClient).catch((err) =>
        console.error(`[BoosterBuffer] Erro ao repor pacote ${pkg.id}:`, err)
      );
    });
  }

  /**
   * Preenche o buffer até a meta de 20 aberturas
   */
  private static async replenishBuffer(pkg: Package, prismaClient: PrismaClient = prisma) {
    if (this.isReplenishing.get(pkg.id)) return;
    this.isReplenishing.set(pkg.id, true);

    try {
      let queue = this.buffer.get(pkg.id);
      if (!queue) {
        queue = [];
        this.buffer.set(pkg.id, queue);
      }

      const needed = this.BUFFER_TARGET_SIZE - queue.length;
      if (needed <= 0) return;

      const cardsByRarity = await getByRarityCluster({ pkg, prisma: prismaClient });

      for (let i = 0; i < needed; i++) {
        const packCards: Card[] = [];
        const count = pkg.cards_quantity || 5;

        for (let j = 0; j < count; j++) {
          const card = getRandomCardFromPackage(pkg, cardsByRarity);
          if (card) {
            packCards.push(card);
          }
        }

        if (packCards.length === count) {
          queue.push(packCards);
        }
      }
    } finally {
      this.isReplenishing.set(pkg.id, false);
    }
  }

  /**
   * Retorna o status do buffer (útil para telemetria/debug)
   */
  public static getBufferStats() {
    const stats: Record<number, number> = {};
    for (const [pkgId, queue] of this.buffer.entries()) {
      stats[pkgId] = queue.length;
    }
    return stats;
  }
}
