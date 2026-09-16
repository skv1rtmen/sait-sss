const { chromium } = require('playwright');
const EXE = process.env.CHROME || undefined;
(async () => {
  const browser = await chromium.launch({ executablePath: EXE });
  for (const [vp, size] of Object.entries({ m375: { width: 375, height: 812 }, t768: { width: 768, height: 1024 }, d1440: { width: 1440, height: 900 } })) {
    const ctx = await browser.newContext({ viewport: size, isMobile: vp==='m375', hasTouch: vp!=='d1440' });
    const page = await ctx.newPage(); const errs=[]; const failed=[];
    page.on('console', m => { if (m.type()==='error' && !/TUNNEL|ERR_|Failed to load resource/.test(m.text())) errs.push(m.text()); }); page.on('pageerror', e => errs.push(String(e)));
    page.on('response', r => { if (r.url().startsWith('http://localhost') && r.status()>=400) failed.push(r.status()+' '+r.url()); });
    await page.goto('http://localhost:8099/', { waitUntil: 'load' }); await page.waitForSelector('#pre.gone',{timeout:15000}).catch(()=>{});
    await page.waitForTimeout(3500);
    // scroll through the whole page
    const H = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < H; y += 300) { await page.evaluate(v => window.scrollTo(0, v), y); await page.waitForTimeout(60); }
    await page.waitForTimeout(800);
    const info = await page.evaluate(() => ({ scene: document.getElementById('wohnung').dataset.scene, mode: document.getElementById('wohnung').className, dl: (window.dataLayer||[]).filter(x=>x&&x.event).map(x=>x.event).join(',') }));
    console.log(vp, JSON.stringify({ errs, failed, ...info }));
    await ctx.close();
  }
  await browser.close();
})();
