// Read-only aggregate audit: no player data or database writes.
import {PrismaClient} from '@prisma/client';
import {DAILY_ROAD_REWARDS,LEVEL_MILESTONES} from '../src/lib/reward-config';
const p=new PrismaClient();
const packs=await p.package.findMany({where:{tcg_id:null},orderBy:{price:'asc'},select:{name:true,price:true,cards_quantity:true,common_rarity:true,rare_rarity:true,epic_rarity:true,legendary_rarity:true,full_legendary_rarity:true}});
const tiers=await p.card.groupBy({by:['rarity'],_count:true});
console.log(JSON.stringify({tiers,dailyCoins30:DAILY_ROAD_REWARDS.reduce((a,d)=>a+d.coins,0),milestoneCoins:LEVEL_MILESTONES.reduce((a,m)=>a+m.coins,0),packs:packs.map(x=>{const w=[x.common_rarity??.5,x.rare_rarity??.3,x.epic_rarity??.15,x.legendary_rarity??.04,x.full_legendary_rarity??.01];const total=w.reduce((a,v)=>a+v,0);const p3=w.slice(2).reduce((a,v)=>a+v,0)/total;return {name:x.name,price:x.price,cards:x.cards_quantity,costPerCard:x.price/x.cards_quantity,tier3PerPack:x.cards_quantity*p3,chanceTier4Plus:1-(1-(w[3]+w[4])/total)**x.cards_quantity,chanceTier5:1-(1-w[4]/total)**x.cards_quantity,costPerTier3:x.price/(x.cards_quantity*p3)};})},null,2));await p.$disconnect();
