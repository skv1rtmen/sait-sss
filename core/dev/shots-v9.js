const { chromium } = require('playwright');
const EXE = process.env.CHROME || undefined;
(async () => {
  const browser = await chromium.launch({ executablePath: EXE });
  for (const [vp, size] of Object.entries({ m375: { width: 375, height: 812 }, t768: { width: 768, height: 1024 }, d1440: { width: 1440, height: 900 } })) {
    const ctx = await browser.newContext({ viewport: size, isMobile: vp==='m375', hasTouch: vp!=='d1440' });
    const page = await ctx.newPage();
    await page.goto('http://localhost:8099/', { waitUntil: 'load' }); await page.waitForSelector('#pre.gone',{timeout:15000}).catch(()=>{});
    await page.waitForFunction(() => { const w=document.getElementById('wohnung'); return w && !w.classList.contains('is-driving') && (+w.dataset.frame>=60||w.classList.contains('is-lite')||w.classList.contains('is-plain')); }, null, {timeout:15000}).catch(()=>{});
    await page.waitForTimeout(800);
    await page.screenshot({ path: `v9-${vp}-home.png` });
    await page.goto('http://localhost:8099/leistungen', { waitUntil: 'load' }); await page.waitForTimeout(1500);
    await page.screenshot({ path: `v9-${vp}-leistungen.png` });
    await ctx.close();
  }
  await browser.close();
})();
