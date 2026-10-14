import { randomUUID } from "node:crypto";
import type { Prisma } from "@prisma/client";
import { prisma } from "../helpers/prisma.client";
import { operation } from "../lib/operation";
import { DomainError } from "../lib/domain-error";
import { NPC_TRAINERS, getCardRecruitPoints } from "../lib/battle-engine";
import { arenaFighter, advanceArena } from "../lib/arena-engine";
import { battleReward } from "../lib/battle-rewards";
import type { ArenaState, ArenaAction } from "../../shared/arena";
function json(state: ArenaState): Prisma.InputJsonValue { return JSON.parse(JSON.stringify(state)); }
export class ArenaService {
  static async eligible(tx: Prisma.TransactionClient, userId: number, selected: number[]) {
    const slots = await tx.userDeckCard.findMany({where:{userId},include:{Card:true},orderBy:{slot:"asc"}});
    if(slots.length!==6 || slots.reduce((a,s)=>a+getCardRecruitPoints(s.Card.rarity),0)>20) throw new DomainError("battle.deckIncompleteToFight");
    const ids=slots.map(s=>s.cardId);
    const [owned,marked] = await Promise.all([
      tx.cards_user.groupBy({by:['cardId'],where:{userId,cardId:{in:ids}},_count:true}),
      tx.tradeMarkedCard.count({where:{userId,cardId:{in:ids}}}),
    ]);
    if(marked || ids.some(id=>ids.filter(i=>i===id).length>(owned.find(c=>c.cardId===id)?._count || 0))) throw new DomainError("battle.notAllCardsOwnedOrTrade");
    if(selected.length!==3 || selected.some(id=>selected.filter(i=>i===id).length>ids.filter(i=>i===id).length)) throw new DomainError("battle.selectThree");
    return selected.map(id=>slots.find(s=>s.cardId===id)!.Card);
  }
  static async resume(userId: number) {
    const row=await prisma.transaction.findFirst({where:{user_id:userId,status:"arena_active"},orderBy:{createdAt:"desc"}});
    if(!row?.result) return null;
    const s=row.result as unknown as ArenaState;
    return Date.parse(s.expiresAt)>Date.now()?s:null;
  }
  static async start(userId: number,npcId:string,selectedCardIds:number[],key:string) {
    return operation(prisma,userId,"arenaStart",{npcId,selectedCardIds},key,async tx=>{
      const npc=NPC_TRAINERS.find(n=>n.id===npcId); if(!npc) throw new DomainError("battle.npcNotFound");
      const active=await tx.transaction.findFirst({where:{user_id:userId,status:"arena_active"}});
      if(active?.result && Date.parse((active.result as unknown as ArenaState).expiresAt)>Date.now()) throw new DomainError("arena.alreadyActive",409);
      if(active) await tx.transaction.update({where:{id:active.id},data:{status:"arena_expired"}});
      const cards=await this.eligible(tx,userId,selectedCardIds);
      const id=randomUUID();
      const state: ArenaState={id,npcId,npcName:npc.name,expiresAt:new Date(Date.now()+30*60_000).toISOString(),turn:0,selectedCardIds,
        player:cards.map(arenaFighter),opponent:npc.deck.filter((_,i)=>[0,3,2].includes(i)).map(arenaFighter),active:0,enemyActive:0,
        shields:2,swapReadyAt:0,intent:"quick",status:"active",log:[],rewardCoins:0,rewardXp:0};
      // Persisted in the existing operation journal, independently of process restarts.
      await tx.transaction.create({data:{id,user_id:userId,idempotencyKey:`arena:${userId}:${id}`,status:"arena_active",result:json(state)}});
      return state;
    });
  }
  static async act(userId:number,id:string,turn:number,action:ArenaAction,key:string) {
    return operation(prisma,userId,"arenaAction",{id,turn,action},key,async tx=>{
      const row=await tx.transaction.findFirst({where:{id,user_id:userId,status:"arena_active"}});
      if(!row?.result) throw new DomainError("arena.finished",409);
      const current=row.result as unknown as ArenaState;
      if(action.kind!=="forfeit" && Date.parse(current.expiresAt)<=Date.now()) throw new DomainError("arena.expired",409);
      if(current.turn!==turn) throw new DomainError("arena.staleTurn",409);
      if(action.kind!=="forfeit") await this.eligible(tx,userId,current.selectedCardIds);
      const next=advanceArena(current,action);
      if(next.status!=="active") {
        const npc=NPC_TRAINERS.find(n=>n.id===next.npcId)!;
        Object.assign(next,await battleReward(tx,userId,npc,next.status==="won"));
        await tx.userBattleRecord.create({data:{userId,npcId:next.npcId,won:next.status==="won",playerScore:next.opponent.filter(f=>f.hp===0).length,opponentScore:next.player.filter(f=>f.hp===0).length,rewardCoins:next.rewardCoins,rewardXp:next.rewardXp}});
        await tx.user.update({where:{id:userId},data:{money:{increment:next.rewardCoins},rarityPoints:{increment:next.rewardXp}}});
      }
      await tx.transaction.update({where:{id},data:{status:next.status==="active"?"arena_active":"arena_finished",result:json(next)}});
      return next;
    });
  }
}
