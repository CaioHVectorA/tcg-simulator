import { PrismaClient } from "@prisma/client";
const url = process.env.TCG_TEST_DATABASE_URL;
if (!url || !['127.0.0.1','localhost'].includes(new URL(url).hostname) || !new URL(url).pathname.endsWith('_test')) throw new Error('E2E fixtures require local *_test database');
const db = new PrismaClient({ datasourceUrl: url });
if (!await db.package.findFirst({where:{name:'Pacote simples'}})) await db.package.create({data:{name:'Pacote simples',description:'Pacote simples',price:100,image_url:'/fixture.svg',cards_quantity:5,common_rarity:1,rare_rarity:0,epic_rarity:0,legendary_rarity:0,full_legendary_rarity:0}});
for(let i=0;i<6;i++) await db.card.upsert({where:{card_id:`e2e-fixture-${i}`},update:{},create:{card_id:`e2e-fixture-${i}`,name:`Pikachu ${i}`,rarity:1,type:'Lightning',hp:100,image_url:'/fixture.svg'}});
await db.$disconnect();
