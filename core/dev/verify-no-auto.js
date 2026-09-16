const { chromium } = require('playwright');
const EXE = process.env.CHROME || undefined;

(async () => {
  const browser = await chromium.launch({ executablePath: EXE });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !m.text().includes('ERR_TUNNEL')) errors.push(m.text()); });

  await page.goto('http://localhost:8099/', { waitUntil: 'load' });
  await page.waitForSelector('#pre.gone', { timeout: 15000 }).catch(()=>{});
  await page.waitForTimeout(1500);

  for (let i = 0; i < 14; i++) { await page.mouse.wheel(0, 220); await page.waitForTimeout(160); }
  await page.waitForTimeout(1500);
  const settled = await page.evaluate(() => ({ scene: document.getElementById('wohnung').dataset.scene, scrollY: window.scrollY }));
  console.log('settled at room:', JSON.stringify(settled));

  // wait 6s with ZERO input -> should NOT move at all now
  await page.waitForTimeout(6000);
  const after = await page.evaluate(() => ({ scene: document.getElementById('wohnung').dataset.scene, scrollY: window.scrollY }));
  console.log('after 6s idle (must be IDENTICAL, no auto-scroll):', JSON.stringify(after));
  console.log('unchanged:', settled.scrollY === after.scrollY && settled.scene === after.scene);

  // measure how much wheel-scroll distance is needed to go from settled room1 to settled room2 (tightness check)
  let ticks = 0;
  const startScene = after.scene;
  for (let i = 0; i < 40; i++) {
    await page.mouse.wheel(0, 150);
    await page.waitForTimeout(90);
    ticks++;
    const s = await page.evaluate(() => document.getElementById('wohnung').dataset.scene);
    if (s !== startScene) break;
  }
  console.log(`wheel ticks (x150px) to leave room ${startScene}:`, ticks, '-> ~', ticks*150, 'px');

  console.log('ERRORS:', JSON.stringify(errors));
  await browser.close();
})();
