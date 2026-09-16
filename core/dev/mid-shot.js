const { chromium } = require('playwright');
const EXE = process.env.CHROME || undefined;
(async () => {
  const browser = await chromium.launch({ executablePath: EXE });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await page.goto('http://localhost:8099/', { waitUntil: 'load' });
  await page.waitForFunction(() => { const w=document.getElementById('wohnung'); return w && !w.classList.contains('is-driving') && +w.dataset.frame>=60; }, null, {timeout:20000});
  await page.waitForTimeout(300); await page.mouse.move(900,300);
  await page.keyboard.press('ArrowRight'); await page.waitForTimeout(1700);
  await page.screenshot({path:'feat-midflight.png'});
  await page.waitForTimeout(2500); await page.screenshot({path:'feat-arrived.png'});
  await browser.close();
})();
