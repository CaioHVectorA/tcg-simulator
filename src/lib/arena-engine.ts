import { hasTypeAdvantage } from "./battle-engine";
import { DomainError } from "./domain-error";
import type { ArenaAction, ArenaFighter, ArenaState } from "../../shared/arena";
export function arenaFighter(card: { name: string; image_url: string; type?: string | null; rarity: number; hp?: number | null }): ArenaFighter {
  // Compressed stats keep ordinary collection cards playable; elemental choices matter.
  const maxHp = 100 + Math.min(60, Math.max(0, card.hp || 0) / 5);
  return { name: card.name, image_url: card.image_url, type: card.type || "Colorless", rarity: card.rarity,
    maxHp: Math.round(maxHp), hp: Math.round(maxHp), energy: 0, power: 18 + Math.min(5, card.rarity) * 2 };
}
function damage(attacker: ArenaFighter, defender: ArenaFighter, charged: boolean) {
  return Math.round(attacker.power * (charged ? 2.8 : 1) * (hasTypeAdvantage(attacker.type, defender.type) ? 1.3 : 1));
}
export function advanceArena(previous: ArenaState, action: ArenaAction): ArenaState {
  if (previous.status !== "active") throw new DomainError("arena.finished", 409);
  const s = structuredClone(previous);
  s.log = [];
  if(action.kind==="forfeit") {s.status="lost";s.turn++;return s;}
  let p = s.player[s.active]; const n = s.opponent[s.enemyActive];
  let blocked = false;
  if (action.kind === "swap") {
    if (!Number.isInteger(action.slot) || action.slot < 0 || action.slot >= s.player.length || action.slot === s.active || s.player[action.slot].hp <= 0 || s.turn < s.swapReadyAt) throw new DomainError("arena.invalidSwap");
    s.active = action.slot; p = s.player[s.active]; s.swapReadyAt = s.turn + 3;
    s.log.push({key:"arena.swapped",name:p.name});
  } else if (action.kind === "shield") {
    if (s.shields < 1 || s.intent !== "charge") throw new DomainError("arena.invalidShield");
    s.shields--; blocked = true; p.energy = Math.min(100, p.energy + 15);
    s.log.push({key:"arena.shielded"});
  } else {
    const charged = action.kind === "charge";
    if (charged && p.energy < 60) throw new DomainError("arena.noEnergy");
    p.energy = charged ? p.energy - 60 : Math.min(100, p.energy + 20);
    const dealt = Math.min(n.hp, damage(p, n, charged)); n.hp -= dealt;
    s.log.push({key: charged ? "arena.playerCharge" : "arena.playerQuick",damage:dealt});
  }
  if (n.hp > 0) {
    const charged = s.intent === "charge";
    n.energy = charged ? 0 : Math.min(100, n.energy + 25);
    const dealt = Math.min(p.hp, blocked ? 0 : damage(n, p, charged)); p.hp -= dealt;
    s.log.push({key:charged ? "arena.enemyCharge" : "arena.enemyQuick",damage:dealt});
  }
  if (n.hp === 0) { s.log.push({key:"arena.enemyDown",name:n.name}); s.enemyActive = s.opponent.findIndex(f=>f.hp>0); }
  if (p.hp === 0) { s.log.push({key:"arena.playerDown",name:p.name}); s.active = s.player.findIndex(f=>f.hp>0); }
  s.turn++;
  if (s.enemyActive === -1) s.status = "won";
  else if (s.active === -1) s.status = "lost";
  else if (s.turn >= 60) { s.status = s.player.reduce((a,f)=>a+f.hp/f.maxHp,0) > s.opponent.reduce((a,f)=>a+f.hp/f.maxHp,0) ? "won" : "lost"; s.log.push({key:"arena.timeLimit"}); }
  if(s.status === "active") s.intent = s.opponent[s.enemyActive].energy >= 75 ? "charge" : "quick";
  return s;
}
