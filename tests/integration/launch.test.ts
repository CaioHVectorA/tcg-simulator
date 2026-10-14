import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import type { PrismaClient } from "@prisma/client";
import type { app as application } from "../../src/app";
import type { PackageService as Packages } from "../../src/services/package.service";
import type { BattleService as Battles } from "../../src/services/battle.service";
import type { RewardService as Rewards } from "../../src/services/reward.service";

const databaseUrl = process.env.TCG_TEST_DATABASE_URL;
describe.skipIf(!databaseUrl)("Isolated PostgreSQL + HTTP launch contracts", () => {
  let db: PrismaClient;
  let app: typeof application;
  let packages: typeof Packages;
  let battles: typeof Battles;
  let rewards: typeof Rewards;
  let userId: number;
  let otherId: number;
  let packageId: number;
  let cardIds: number[];
  let token: string;
  const tag = crypto.randomUUID();
  const users: number[] = [];

  async function http(path: string, method = "GET", body?: unknown, locale = "en", key?: string) {
    const response = await app.handle(new Request(`http://localhost${path}`, { method,
      headers: { "Content-Type": "application/json", "X-Locale": locale, ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(key ? { "Idempotency-Key": key } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    }));
    return { status: response.status, body: await response.json() };
  }
  beforeAll(async () => {
    const url = new URL(databaseUrl!);
    if (!['localhost','127.0.0.1'].includes(url.hostname) || !url.pathname.endsWith('_test')) throw new Error('Integration tests require a disposable local *_test database');
    process.env.DATABASE_URL = databaseUrl;
    process.env.DIRECT_URL = databaseUrl;
    process.env.SECRET_JWT = 'isolated-test-jwt-secret-32-characters';
    process.env.GOOGLE_CLIENT_ID = 'isolated-test-client';
    db = (await import('../../src/helpers/prisma.client')).prisma;
    app = (await import('../../src/app')).app;
    packages = (await import('../../src/services/package.service')).PackageService;
    battles = (await import('../../src/services/battle.service')).BattleService;
    rewards = (await import('../../src/services/reward.service')).RewardService;
    const { hash } = await import('bcrypt');
    const user = await db.user.create({ data: { email: `trainer-${tag}@example.com`, username: `Trainer-${tag}`, password: await hash('secret-pass',10), money: 100, totalBudget: 500 } });
    const other = await db.user.create({ data: { email: `other-${tag}@example.com`, username: `Other-${tag}`, password: 'unused', money: 100 } });
    userId=user.id;otherId=other.id;users.push(userId,otherId);
    const pack = await db.package.create({ data: { name:'Pacote simples', price:100, image_url:'/test.png', cards_quantity:2, common_rarity:1, rare_rarity:0, epic_rarity:0, legendary_rarity:0, full_legendary_rarity:0 } });
    packageId=pack.id;
    const cards = await Promise.all(Array.from({length:6},(_,i)=>db.card.create({ data: { name:`Test ${i}`,card_id:`audit-${tag}-${i}`,image_url:'/test.png',rarity:1,hp:100,type:'Fire' } })));
    cardIds=cards.map(c=>c.id);
    const login=await http('/auth/login','POST',{email:user.email,password:'secret-pass'});
    expect(login.status).toBe(200);token=login.body.data.token;
  });
  afterAll(async () => {
    if (!db) return;
    await db.user.deleteMany({ where: { id: { in: users } } });
    if (cardIds) await db.card.deleteMany({ where: { id: { in: cardIds } } });
    if (packageId) await db.package.deleteMany({ where: { id: packageId } });
  });

  it('projects /user/me without password or admin flags',async()=>{
    const res=await http('/user/me');expect(res.status).toBe(200);expect(res.body.data.id).toBe(userId);
    expect(res.body.data.password).toBeUndefined();expect(res.body.data.isAdmin).toBeUndefined();
  });
  it('rejects OAuth identity forged from an email',async()=>{
    const before=await db.user.count();
    const fake=await http('/auth/google','POST',{email:'victim@example.com',name:'Victim',image:'x'});
    expect(fake.status).toBe(400);
    const invalid=await http('/auth/google','POST',{idToken:'fake-token-without-signature-123456789'});
    expect(invalid.status).toBe(401);expect(await db.user.count()).toBe(before);
  });
  it('rejects negative, zero, fractional and excessive checkout quantities in all languages',async()=>{
    for(const locale of ['pt','en','es','jp']){
      for(const quantity of [-1,0,0.5,101]){
        const res=await http(`/store/checkout?key=${crypto.randomUUID()}`,'POST',{items:[{id:packageId,type:'package',quantity}]},locale);
        expect(res.status).toBe(400);expect(res.body.ok).toBe(false);
      }
    }
    expect((await db.user.findUniqueOrThrow({where:{id:userId}})).money).toBe(100);
  });
  it('does not overspend under simultaneous purchases',async()=>{
    const results=await Promise.allSettled([packages.buyPackage(userId,packageId),packages.buyPackage(userId,packageId)]);
    expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);
    expect((await db.user.findUniqueOrThrow({where:{id:userId}})).money).toBe(0);
    expect(await db.packages_User.count({where:{userId,opened:false}})).toBe(1);
  });
  it('concurrent retries return the same opening without extra cards',async()=>{
    const key=crypto.randomUUID();
    const [a,b]=await Promise.all([packages.openSinglePackage(userId,packageId,key),packages.openSinglePackage(userId,packageId,key)]);
    expect(a).toEqual(b);expect(a).toHaveLength(2);
    expect(await db.cards_user.count({where:{userId}})).toBe(2);
    expect(await db.packages_User.count({where:{userId,opened:false}})).toBe(0);
    await expect(packages.openSinglePackage(userId,packageId)).rejects.toThrow();
    expect(await db.cards_user.count({where:{userId}})).toBe(2);
  });
  it('does not open another trainer inventory',async()=>{
    await db.packages_User.create({data:{userId:otherId,packageId}});
    await expect(packages.openSinglePackage(userId,packageId)).rejects.toThrow();
    expect(await db.packages_User.count({where:{userId:otherId,opened:false}})).toBe(1);
  });
  it('checkout retry credits only one purchase and rejects altered payload',async()=>{
    await db.user.update({where:{id:userId},data:{money:300}});
    const key=crypto.randomUUID();const items=[{id:packageId,type:'package',quantity:1}];
    const [a,b]=await Promise.all([http(`/store/checkout?key=${key}`,'POST',{items}),http(`/store/checkout?key=${key}`,'POST',{items})]);
    expect(a.body.ok).toBe(true);expect(b.body.ok).toBe(true);
    expect((await db.user.findUniqueOrThrow({where:{id:userId}})).money).toBe(200);
    const changed=await http(`/store/checkout?key=${key}`,'POST',{items:[{...items[0],quantity:2}]});expect(changed.status).toBe(409);
  });
  it('serializes daily claims across legacy and new routes',async()=>{
    const results=await Promise.allSettled([rewards.claimDaily(userId),rewards.claimDaily(userId,true)]);
    expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);
    expect((await db.user.findUniqueOrThrow({where:{id:userId}})).daily_bounty_level).toBe(2);
  });
  it('does not pay a finished quest twice',async()=>{
    const quest=await db.quest.create({data:{name:'Audit quest',description:['Audit quest'],levelCount:1,levelGoals:[1],levelRewards:[100],queryCheck:'SELECT count(*) >= $GOAL AS mission_complete FROM cards_user WHERE "userId" = $USER_ID'}});
    await db.questUser.create({data:{user_id:userId,quest_id:quest.id}});
    const {claimQuests}=await import('../../src/services/quest-reward.service');
    const results=await Promise.allSettled([claimQuests(userId,quest.id),claimQuests(userId,quest.id)]);
    expect(results.filter(r=>r.status==='fulfilled')).toHaveLength(1);
    expect((await db.questUser.findUniqueOrThrow({where:{user_id_quest_id:{user_id:userId,quest_id:quest.id}}})).completed).toBe(true);
    await db.questUser.deleteMany({where:{quest_id:quest.id}});await db.quest.delete({where:{id:quest.id}});
  });
  it('GO rejects repeated picks beyond owned copies and outside saved team',async()=>{
    await db.cards_user.createMany({data:cardIds.map(cardId=>({userId,cardId}))});
    await battles.saveUserDeck(userId,cardIds);
    const {NPC_TRAINERS}=await import('../../src/lib/battle-engine');
    await expect(battles.fightNpcGo(userId,NPC_TRAINERS[0].id,[cardIds[0],cardIds[0],cardIds[0]])).rejects.toThrow();
    const result=await battles.fightNpcGo(userId,NPC_TRAINERS[0].id,cardIds.slice(0,3));
    expect(result.simulation.rounds).toHaveLength(3);
    expect(await db.userBattleRecord.count({where:{userId}})).toBe(1);
  });
  it('donation retries transfer coins only once', async () => {
    await db.user.update({where:{id:userId},data:{money:500}});
    const before=(await db.user.findUniqueOrThrow({where:{id:otherId}})).money;
    const key=crypto.randomUUID();
    const body={receiver_id:otherId,amount:100};
    const [first,retry]=await Promise.all([http('/user/donate','POST',body,'en',key),http('/user/donate','POST',body,'en',key)]);
    expect(first.body.ok).toBe(true);expect(retry.body.ok).toBe(true);
    expect((await db.user.findUniqueOrThrow({where:{id:userId}})).money).toBe(400);
    expect((await db.user.findUniqueOrThrow({where:{id:otherId}})).money).toBe(before+100);
  });
  it('private trade authorization and concurrent acceptance preserve copies and balances', async () => {
    const cardId=cardIds[5];
    await db.cards_user.create({data:{userId:otherId,cardId}});
    await db.tradeMarkedCard.create({data:{userId:otherId,cardId}});
    await db.favoriteCard.create({data:{userId:otherId,cardId}});
    await db.userDeckCard.create({data:{userId:otherId,cardId,slot:0}});
    const trade=await db.trade.create({data:{name:'Private fixture',hash:crypto.randomUUID(),public:false,acceptMoney:true,acceptOffers:true,moneyReceiving:100,
      userTrades:{create:{user_id:otherId,is_sender:true}},cards:{create:{card_id:cardId,is_sender:true}}}});
    try {
      expect((await http(`/trades/accept/${trade.id}`,'POST',{})).status).toBe(404);
      expect((await http(`/trades/${trade.id}/offer`,'POST',{card_ids:[],money:0})).status).toBe(404);
      await db.trade.update({where:{id:trade.id},data:{public:true}});
      const before=(await db.user.findUniqueOrThrow({where:{id:otherId}})).money;
      const results=await Promise.all([http(`/trades/accept/${trade.id}`,'POST',{}),http(`/trades/accept/${trade.id}`,'POST',{})]);
      expect(results.filter(r=>r.body.ok)).toHaveLength(1);
      expect(await db.cards_user.count({where:{userId:otherId,cardId}})).toBe(0);
      expect((await db.user.findUniqueOrThrow({where:{id:otherId}})).money).toBe(before+100);
      expect(await db.user_Trade.count({where:{trade_id:trade.id,is_sender:false}})).toBe(1);
      expect(await db.userDeckCard.count({where:{userId:otherId,cardId}})).toBe(0);
      expect(await db.favoriteCard.count({where:{userId:otherId,cardId}})).toBe(0);
    } finally { await db.trade.delete({where:{id:trade.id}}); }
  });
  it('concurrent album claims consume one collection and grant one reward', async () => {
    const ids:number[]=[];
    const previousToken=token;
    const {hash}=await import("bcrypt");
    const albumUser=await db.user.create({data:{email:`album-${tag}@example.com`,username:`Album-${tag}`,password:await hash("album-password",10)}});
    const albumUserId=albumUser.id;users.push(albumUserId);
    token=(await http("/auth/login","POST",{email:albumUser.email,password:"album-password"})).body.data.token;
    try {
      for(const name of ['Bulbasaur','Charmander','Squirtle','Pikachu']) {
        const card=await db.card.create({data:{name,card_id:`album-${tag}-${name}`,image_url:'/test.png',rarity:1,hp:60,type:'Grass'}});
        ids.push(card.id);await db.cards_user.create({data:{userId:albumUserId,cardId:card.id}});
      }
      const before=(await db.user.findUniqueOrThrow({where:{id:albumUserId}})).money;
      const results=await Promise.all([http('/albums/claim/kanto_starters','POST',{}),http('/albums/claim/kanto_starters','POST',{})]);
      expect(results.filter(r=>r.body.ok)).toHaveLength(1);
      expect((await db.user.findUniqueOrThrow({where:{id:albumUserId}})).money).toBe(before+18000);
      expect(await db.cards_user.count({where:{userId:albumUserId,cardId:{in:ids}}})).toBe(0);
      expect(await db.transaction.count({where:{idempotencyKey:`album_claim_${albumUserId}_kanto_starters`}})).toBe(1);
    } finally { token=previousToken; await db.card.deleteMany({where:{id:{in:ids}}}); }
  });
  it('password recovery is single-use and revokes prior sessions',async()=>{
    const {createHash}=await import('node:crypto');
    const raw='a'.repeat(64);
    await db.passwordResetToken.create({data:{userId,tokenHash:createHash('sha256').update(raw).digest('hex'),expiresAt:new Date(Date.now()+60_000)}});
    const results=await Promise.all([http('/auth/password/reset','POST',{token:raw,password:'new-password'}),http('/auth/password/reset','POST',{token:raw,password:'new-password'})]);
    expect(results.filter(r=>r.body.ok)).toHaveLength(1);
    expect((await http('/user/me')).status).toBe(401);
    const user=await db.user.findUniqueOrThrow({where:{id:userId}});
    expect((await http('/auth/login','POST',{email:user.email,password:'secret-pass'})).body.ok).toBe(false);
    const login=await http('/auth/login','POST',{email:user.email,password:'new-password'});expect(login.body.ok).toBe(true);
    token=login.body.data.token;expect((await http('/user/me')).status).toBe(200);
  });
  it('API errors use request locale for grouped controllers',async()=>{
    for(const [locale,word] of [['en','Invalid'],['es','inválida'],['jp','無効']]){
      const res=await http('/auth/register','POST',{email:'invalid',password:'x',username:'x'},locale);
      expect(res.status).toBe(400);expect(res.body.toast).toContain(word);
    }
  });
});
