export type ArenaAction = { kind: "quick" | "charge" | "shield" | "forfeit" } | { kind: "swap"; slot: number };
export interface ArenaFighter {
  name: string; image_url: string; type: string; rarity: number;
  maxHp: number; hp: number; energy: number; power: number;
}
export interface ArenaState {
  id: string; npcId: string; npcName: string; expiresAt: string;
  selectedCardIds: number[];
  turn: number; player: ArenaFighter[]; opponent: ArenaFighter[];
  active: number; enemyActive: number; shields: number; swapReadyAt: number;
  intent: "quick" | "charge"; status: "active" | "won" | "lost";
  log: { key: string; damage?: number; name?: string }[];
  rewardCoins: number; rewardXp: number;
}
