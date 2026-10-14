import type { PrismaClient, Prisma } from "@prisma/client";
import { createHash, randomUUID } from "node:crypto";
import { lockUsers } from "./economy";
import { DomainError } from "./domain-error";

export async function operation<T>(
  db: PrismaClient, userId: number, name: string, input: unknown,
  key: string | undefined, work: (tx: Prisma.TransactionClient) => Promise<T>, participants: number[] = [userId],
): Promise<T> {
  if (key && !/^[a-zA-Z0-9_-]{8,100}$/.test(key)) throw new DomainError("common.invalidRequest");
  const idempotencyKey = `${userId}:${name}:${key || randomUUID()}`;
  const requestHash = createHash("sha256").update(JSON.stringify(input)).digest("hex");
  return db.$transaction(async (tx) => {
    await lockUsers(tx, participants);
    const previous = await tx.transaction.findUnique({ where: { idempotencyKey } });
    if (previous) {
      if (previous.requestHash !== requestHash) throw new DomainError("common.requestConflict", 409);
      return previous.result as T;
    }
    const result = await work(tx);
    await tx.transaction.create({ data: {
      user_id: userId, idempotencyKey, requestHash, status: "completed",
      result: JSON.parse(JSON.stringify(result)) as Prisma.InputJsonValue,
    } });
    return result;
  }, { maxWait: 5_000, timeout: 15_000 });
}
