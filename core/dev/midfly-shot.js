const { chromium } = require('playwright');
const EXE = process.env.CHROME || undefined;
(async () => {
  const browser = await chromium.launch({ executablePath: EXE });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:8099/?nolenis', { waitUntil: 'load' });
  await page.waitForSelector('#pre.gone', { timeout: 15000 }).catch(() => {});
  await page.waitForFunction(() => { const w=document.getElementById('wohnung'); return w && !w.classList.contains('is-driving') && +w.dataset.frame>=60; }, null, {timeout:15000});
  await page.waitForTimeout(1500);
  // room 1 starts at 1.2vh=1080; fly zone = 0..0.45*1890 → go to p=.2 → 1080+378
  await page.evaluate(() => window.scrollTo(0, 1080 + 0.2*1890));
  await page.waitForTimeout(120);
  await page.screenshot({ path: 'midfly-a.png' });
  const info = await page.evaluate(() => ({ frame: document.getElementById('wohnung').dataset.frame, drv: document.getElementById('wohnung').className }));
  console.log(info);
  await browser.close();
})();
