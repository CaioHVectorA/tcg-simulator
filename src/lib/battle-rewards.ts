import type { Prisma } from "@prisma/client";
import type { NpcTrainer } from "./battle-engine";
// One lifetime first-clear bonus; two smaller paid rematches per NPC per UTC day.
// Every mode uses the same records and allowance. Losses never mint currency/XP.
export async function battleReward(tx: Prisma.TransactionClient, userId: number, npc: Pick<NpcTrainer, "id" | "rewardCoins" | "rewardXp">, won: boolean) {
  if (!won) return {rewardCoins:0,rewardXp:0};
  const first = await tx.userBattleRecord.findFirst({where:{userId,npcId:npc.id,won:true},select:{id:true}});
  if (!first) return {rewardCoins:npc.rewardCoins,rewardXp:Math.max(1,Math.floor(npc.rewardXp/10))};
  const day = new Date(); day.setUTCHours(0,0,0,0);
  const paid = await tx.userBattleRecord.count({where:{userId,npcId:npc.id,won:true,rewardCoins:{gt:0,lt:npc.rewardCoins},createdAt:{gte:day}}});
  return {rewardCoins: paid < 2 ? Math.floor(npc.rewardCoins * 0.1) : 0,rewardXp:0};
}
