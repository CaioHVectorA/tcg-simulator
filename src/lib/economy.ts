import type { Prisma } from "@prisma/client";
import { DomainError } from "./domain-error";

export function positiveInteger(value: number, maximum = 1_000_000): number {
  if (!Number.isSafeInteger(value) || value < 1 || value > maximum) {
    throw new DomainError("common.invalidQuantity");
  }
  return value;
}

export async function debit(tx: Prisma.TransactionClient, userId: number, amount: number) {
  positiveInteger(amount, 2_147_483_647);
  const changed = await tx.user.updateMany({
    where: { id: userId, money: { gte: amount } },
    data: { money: { decrement: amount } },
  });
  if (changed.count !== 1) throw new DomainError("store.insufficientFunds");
}

export async function consumePacks(tx: Prisma.TransactionClient, userId: number, ids: number[]) {
  if (!ids.length) throw new DomainError("packages.packageNotFound");
  const changed = await tx.packages_User.updateMany({
    where: { userId, id: { in: ids }, opened: false },
    data: { opened: true },
  });
  if (changed.count !== ids.length) throw new DomainError("packages.insufficientStock", 409);
}

export async function consumeCards(tx: Prisma.TransactionClient, userId: number, ids: number[]) {
  const changed = await tx.cards_user.deleteMany({ where: { userId, id: { in: ids } } });
  if (changed.count !== ids.length) throw new DomainError("battle.notAllCardsOwnedOrTrade", 409);
}

// Lock participants in a stable order; shared by transfers, claims and battle validation.
export async function lockUsers(tx: Prisma.TransactionClient, userIds: number[]) {
  const ids = [...new Set(userIds)].sort((a, b) => a - b);
  for (const id of ids) positiveInteger(id, 2_147_483_647);
  await tx.$queryRaw`SELECT id FROM users WHERE id = ANY(${ids}::int[]) ORDER BY id FOR UPDATE`;
}
