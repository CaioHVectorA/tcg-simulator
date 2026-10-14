import { translateText } from "../../apps/www/src/i18n/text";
import type { Locale } from "../../shared/i18n/lookup";
import { test, expect } from '@playwright/test';

const locales = [
  { code:'pt', lang:'pt-BR', open:'Abrir 1 Pacote', tear:'Rasgue aqui', title:'Simulador Pokémon TCG' },
  { code:'en', lang:'en-US', open:'Open 1 Pack', tear:'Tear here', title:'Pokémon TCG simulator' },
  { code:'es', lang:'es-ES', open:'Abrir 1 Paquete', tear:'Rasga aquí', title:'Simulador Pokémon TCG' },
  { code:'jp', lang:'ja-JP', open:'1パック開封', tear:'ここから開封', title:'ポケモンTCGシミュレーター' },
];
for (const locale of locales) {
  test(`guest journey and explicit opening in ${locale.code}`, async ({ page, context, request }) => {
    await context.addCookies([{name:'tcg_locale',value:locale.code,url:'http://127.0.0.1:3009'}]);
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('lang',locale.lang);
    await expect(page.locator('body')).not.toContainText('landing.');
    if (locale.code !== "pt") await expect(page.locator("body")).not.toContainText("Abra Pacotes.");
    await page.goto('/entrar');
    const nickname = `E2E_${crypto.randomUUID().slice(0,8)}`;
    // Guest signup is exercised through the browser, not a mocked API.
    await page.getByRole('tab').last().click();
    await page.locator('input').first().fill(nickname);
    await page.getByRole('button', {name:/Jogar Imediatamente|Play now|Jugar ahora|今すぐ遊ぶ/}).click();
    await expect(page).toHaveURL(/\/home/);
    await page.goto('/inventario');
    await expect(page.locator('body')).not.toContainText('inventory.');
    await expect(page.getByRole('button', {name:translateText('inventory.openOne',locale.code as Locale),exact:true})).toBeVisible();
    const inventoryPromise=page.waitForResponse(r=>r.url().endsWith('/packages')&&r.request().method()==='GET').then(response=>response.json());
    // Reload reads inventory; navigation itself must never consume a pack.
    await page.reload();
    const inventory=await inventoryPromise;
    const pack=inventory.data[0]; expect(pack.quantity).toBe(5);
    await page.getByRole('button', {name:translateText('inventory.openOne',locale.code as Locale),exact:true}).click();
    const dialog=page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    const opening=page.waitForResponse(r=>r.url().endsWith('/packages/open')&&r.request().method()==='POST');
    await dialog.getByRole('button',{name:translateText('store.tearAndOpen',locale.code as Locale)}).click();
    const response=await opening;expect(response.status()).toBe(200);
    const body=await response.json();expect(body.data.length).toBe(5);
    await expect(dialog).not.toContainText('Liberando cartas do booster...', { timeout: 3000 });
    await expect(dialog).not.toContainText('rarities.');
    if(['en','jp'].includes(locale.code)) await expect(dialog).not.toContainText('restantes');
    await dialog.getByRole('button',{name:translateText('store.flipCard',locale.code as Locale),exact:true}).click();
    await expect(dialog).toContainText(translateText('rarities.tier1',locale.code as Locale));
    const token=(await context.cookies()).find(c=>c.name==='token')!.value;
    const stock=await request.get('http://127.0.0.1:8089/packages',{headers:{Authorization:`Bearer ${token}`}});
    expect((await stock.json()).data[0].quantity).toBe(4);
    await page.screenshot({path:`test-results/opening-${locale.code}.png`});
  });
}

test('mobile layout and reduced-motion navigation', async ({page,context})=>{
  await page.setViewportSize({width:390,height:844});
  await page.emulateMedia({reducedMotion:'reduce',colorScheme:'dark'});
  await context.addCookies([{name:'tcg_locale',value:'en',url:'http://127.0.0.1:3009'}]);
  await page.goto('/');
  await expect(page.getByRole('link',{name:'Start a free collection'})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.getByRole('link',{name:'Start a free collection'}).click();
  await expect(page).toHaveURL(/\/entrar/);
  await expect(page.getByRole('tablist')).toBeVisible();
  await page.screenshot({path:'test-results/mobile-reduced-motion.png'});
});

for (const code of ['en','es','jp'] as const) {
  test(`localized screens, API data and browser errors in ${code}`, async ({ page, context, request }) => {
    const nickname=`Screens_${crypto.randomUUID().slice(0,8)}`;
    const signup=await request.post('http://127.0.0.1:8089/auth/register',{data:{email:`${nickname}@example.com`,username:nickname,password:'test-password'},headers:{'X-Locale':code}});
    expect(signup.status()).toBe(200);
    const token=(await signup.json()).data.token;
    await context.addCookies([{name:'token',value:token,url:'http://127.0.0.1:3009'},{name:'tcg_locale',value:code,url:'http://127.0.0.1:3009'}]);
    const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
    const screens=[
      ['/loja','store.title'],['/colecao?view=albums','Fichário do Colecionador'],['/batalha','Arena de Batalha Pokémon'],
      ['/trocas','trades.stationTitle'],['/missoes','Missões e Metas'],['/config','Informações da Conta'],['/afiliado','Convide seus amigos, ganhe moedas!'],
    ];
    for(const [route,source] of screens){
      await page.goto(route);

      await expect(page.locator('body')).toContainText(translateText(source,code));
      await expect(page.locator('body')).not.toContainText(/\b(?:store|battle|collection|trades|quests|config|inventory)\.[a-zA-Z]+/);
      if((code==='en'||code==='jp') && !source.includes('.')) await expect(page.locator('body')).not.toContainText(source);
      if(route.includes('albums')) await expect(page.locator('body')).toContainText(translateText('Iniciais Clássicos de Kanto',code));
      if(route==='/batalha') await expect(page.locator('body')).not.toContainText('Monte seu elenco');
    }
    expect(errors).toEqual([]);
    await page.screenshot({path:`test-results/screens-${code}.png`});
  });
}

test('authenticated mobile navigation, focus and rejected purchase feedback', async ({page,context,request}) => {
  const nickname=`Mobile_${crypto.randomUUID().slice(0,8)}`;
  const signup=await request.post('http://127.0.0.1:8089/auth/register',{data:{email:`${nickname}@example.com`,username:nickname,password:'test-password'}});
  const token=(await signup.json()).data.token;
  await context.addCookies([{name:'token',value:token,url:'http://127.0.0.1:3009'},{name:'tcg_locale',value:'en',url:'http://127.0.0.1:3009'}]);
  await page.setViewportSize({width:390,height:844});
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/loja');
  await expect(page.getByRole('heading',{name:translateText('store.title','en')})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const menu=page.getByRole('button',{name:'Menu',exact:true});
  await menu.click();
  const nav=page.getByRole('dialog');
  await expect(nav).toBeVisible();
  await expect(nav.getByRole('link',{name:'Inventory',exact:true})).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(menu).toBeFocused();
  await page.route('**/store/checkout?*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:false,data:null,error:'Insufficient coins',toast:'Insufficient coins'})}));
  await page.getByRole('button',{name:translateText('store.buyAndOpen','en'),exact:true}).first().click();
  await expect(page.locator('body')).toContainText('Insufficient coins');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button',{name:translateText('store.buyAndOpen','en'),exact:true}).first()).toBeEnabled();
  await page.evaluate(() => document.documentElement.classList.remove('dark'));
  await page.screenshot({path:'test-results/mobile-store-light.png'});
  await page.evaluate(() => document.documentElement.classList.add('dark'));
  await page.screenshot({path:'test-results/mobile-store-dark.png'});
  await page.setViewportSize({width:1280,height:900});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('guest login shows a connection error for an HTML response', async ({page,context}) => {
  await context.addCookies([{name:'tcg_locale',value:'en',url:'http://127.0.0.1:3009'}]);
  await page.route('**/auth/guest',route=>route.fulfill({status:404,contentType:'text/html',body:'<!doctype html><html><body>Not found</body></html>'}));
  await page.goto('/entrar');
  await page.getByRole('tab').last().click();
  await page.locator('input').first().fill('HTML_response_test');
  await page.getByRole('button',{name:'Play now',exact:true}).click();
  await expect(page.locator('body')).toContainText(translateText('Não foi possível conectar ao servidor.','en'));
  await expect(page).toHaveURL(/\/entrar/);
  await expect(page.getByRole('button',{name:'Play now',exact:true})).toBeEnabled();
});

for(const code of ['pt','en'] as const) test(`interactive arena decisions and resume in ${code}`,async({page,context,request})=>{
  const nickname=`Arena_${crypto.randomUUID().slice(0,8)}`;
  const signup=await request.post('http://127.0.0.1:8089/auth/guest',{data:{nickname}});
  const token=(await signup.json()).data.token;
  const headers={Authorization:`Bearer ${token}`};
  const inventory=await request.get('http://127.0.0.1:8089/packages',{headers});
  const pack=(await inventory.json()).data[0];
  for(let i=0;i<2;i++) expect((await request.post('http://127.0.0.1:8089/packages/open',{headers,data:{packageId:pack.id}})).ok()).toBe(true);
  const recommended=await request.get('http://127.0.0.1:8089/battle/recommend-deck',{headers});
  const ids=(await recommended.json()).data.recommendedCards.map((c:{cardId:number})=>c.cardId);
  expect((await request.post('http://127.0.0.1:8089/battle/deck',{headers,data:{cardIds:ids}})).ok()).toBe(true);
  await context.addCookies([{name:'token',value:token,url:'http://127.0.0.1:3009'},{name:'tcg_locale',value:code,url:'http://127.0.0.1:3009'}]);
  await page.setViewportSize({width:390,height:844}); await page.emulateMedia({reducedMotion:'reduce',colorScheme:'dark'});
  await page.goto('/batalha');
  const text=(key:string)=>translateText(key,code);
  await expect(page.getByRole('button',{name:text('Salvar Time'),exact:true})).toBeEnabled();
  await page.getByRole('tab').nth(1).click();
  await page.getByRole('button',{name:text('Desafiar'),exact:true}).first().click();
  const preview=page.getByRole('dialog');
  await expect(preview.locator('button[aria-pressed="true"]')).toHaveCount(3);
  await preview.getByRole('button',{name:text('Entrar no Duelo (3 vs 3)'),exact:true}).click();
  await page.evaluate(()=>document.documentElement.classList.add('dark'));
  const dialog=page.getByRole('dialog');await expect(dialog).toContainText(text('arena.turn').replace('{turn}','1'));
  await expect(dialog.getByRole('button',{name:new RegExp(text('arena.charge'))})).toBeDisabled();
  const hp=await dialog.getByRole('progressbar').last().getAttribute('aria-valuenow');
  await dialog.getByRole('button',{name:new RegExp(text('arena.quick'))}).click();
  await expect(dialog).toContainText(text('arena.turn').replace('{turn}','2'));
  expect(Number(await dialog.getByRole('progressbar').last().getAttribute('aria-valuenow'))).toBeLessThan(Number(hp));
  await expect(dialog).not.toContainText('arena.');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:`test-results/interactive-arena-${code}-dark.png`});
  await dialog.getByRole('button',{name:text('arena.pause'),exact:true}).click();await page.reload();
  await page.getByRole('button',{name:text('arena.resume'),exact:true}).click();
  await expect(page.getByRole('dialog')).toContainText(text('arena.turn').replace('{turn}','2'));
  await page.evaluate(()=>document.documentElement.classList.remove('dark'));
  await page.screenshot({path:`test-results/interactive-arena-${code}-light.png`});
  await page.getByRole('button',{name:text('arena.forfeit'),exact:true}).click();
  await expect(page.getByRole('dialog')).toContainText(text('arena.lost'));
});
