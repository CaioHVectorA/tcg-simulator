import type { Prisma } from "@prisma/client";
import { debit, lockUsers } from "./economy";
import { DomainError } from "./domain-error";

export async function beginTrade(tx: Prisma.TransactionClient, tradeId: number, participants: number[]) {
  await lockUsers(tx, participants);
  await tx.$queryRaw`SELECT id FROM trades WHERE id = ${tradeId} FOR UPDATE`;
  const trade = await tx.trade.findUnique({ where: { id: tradeId } });
  if (!trade || (trade.expiresAt && trade.expiresAt <= new Date())) throw new DomainError("trades.unavailable");
  if (await tx.user_Trade.count({ where: { trade_id: tradeId, is_sender: false } })) throw new DomainError("common.requestConflict", 409);
}

export async function transferCards(tx: Prisma.TransactionClient, from: number, to: number, ids: number[]) {
  if (!ids.length) return;
  const rows = await tx.cards_user.findMany({ where: { userId: from, cardId: { in: ids } }, orderBy: { id: "asc" } });
  const selected: number[] = [];
  for (const cardId of ids) {
    const row = rows.find((r) => r.cardId === cardId && !selected.includes(r.id));
    if (!row) throw new DomainError("battle.notAllCardsOwnedOrTrade");
    selected.push(row.id);
  }
  const changed = await tx.cards_user.updateMany({ where: { userId: from, id: { in: selected } }, data: { userId: to } });
  if (changed.count !== selected.length) throw new DomainError("common.requestConflict", 409);
  // Slots are re-built explicitly by the player after a transfer; never retain ghost copies.
  await tx.userDeckCard.deleteMany({ where: { userId: from, cardId: { in: ids } } });
  const remaining = await tx.cards_user.findMany({ where: { userId: from, cardId: { in: ids } }, select: { cardId: true } });
  const owned = new Set(remaining.map((r) => r.cardId));
  const absent = [...new Set(ids)].filter((id) => !owned.has(id));
  await tx.tradeMarkedCard.deleteMany({ where: { userId: from, cardId: { in: absent } } });
  await tx.favoriteCard.deleteMany({ where: { userId: from, cardId: { in: absent } } });
}

export async function transferMoney(tx: Prisma.TransactionClient, from: number, to: number, amount: number) {
  if (!amount) return;
  await debit(tx, from, amount);
  await tx.user.update({ where: { id: to }, data: { money: { increment: amount }, totalBudget: { increment: amount } } });
}
