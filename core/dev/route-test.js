const { chromium } = require('playwright');
const EXE = process.env.CHROME || undefined;
(async () => {
  const browser = await chromium.launch({ executablePath: EXE });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errs=[];page.on('console',m=>{if(m.type()==='error'&&!/TUNNEL|ERR_/.test(m.text()))errs.push(m.text())});page.on('pageerror',e=>errs.push(String(e)));
  await page.route(/n8n\.baucrm\.net/, r=>r.fulfill({status:200,body:'{}'}));
  const out=[];
  const state=async()=>({url:page.url().replace('http://localhost:8099',''),title:await page.title(),h1:(await page.locator('#view h1').first().textContent().catch(()=>'')).trim().slice(0,40),canon:await page.evaluate(()=>{const l=document.querySelector('link[rel=canonical]');return l?l.href:null;})});
  // 1 direct load of deep route
  await page.goto('http://localhost:8099/leistungen/sanitaer',{waitUntil:'load'});await page.waitForTimeout(1500);out.push({step:'direct /leistungen/sanitaer',...await state()});
  // 2 legacy hash
  await page.goto('http://localhost:8099/#/kontakt',{waitUntil:'load'});await page.waitForTimeout(1500);out.push({step:'legacy #/kontakt',...await state()});
  // 3 home + nav click
  await page.goto('http://localhost:8099/',{waitUntil:'load'});await page.waitForSelector('#pre.gone',{timeout:15000}).catch(()=>{});await page.waitForTimeout(800);
  await page.click('.nav-links a[data-go=referenzen]');await page.waitForTimeout(1600);out.push({step:'click Referenzen',...await state()});
  await page.click('.nav-links a[data-go=ueber]');await page.waitForTimeout(1600);out.push({step:'click Über uns',...await state()});
  await page.goBack();await page.waitForTimeout(1600);out.push({step:'back',...await state()});
  await page.goForward();await page.waitForTimeout(1600);out.push({step:'forward',...await state()});
  // footer link to region page, then 404
  await page.goto('http://localhost:8099/gibts-nicht',{waitUntil:'load'});await page.waitForTimeout(1500);out.push({step:'404',...await state(), robots:await page.locator('meta[name=robots]').getAttribute('content')});
  // hash in-page anchors (data-scroll) must not navigate
  await page.goto('http://localhost:8099/leistungen',{waitUntil:'load'});await page.waitForTimeout(1500);const before=page.url();await page.click('.svc-rail-list a').catch(()=>{});await page.waitForTimeout(800);out.push({step:'rail anchor click',urlSame:page.url()===before,url:page.url()});
  console.log(JSON.stringify(out,null,1));console.log('errors',errs);
  await browser.close();
})();
