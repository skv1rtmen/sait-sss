const { chromium } = require('playwright');
const EXE = process.env.CHROME || undefined;
const label = process.argv[2] || 'run';
async function scrollFps(browser, delay) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errs=[];page.on('console',m=>{if(m.type()==='error')errs.push(m.text())});page.on('pageerror',e=>errs.push(String(e)));
  await page.goto('http://localhost:8099/', { waitUntil: 'load' });
  await page.waitForSelector('#pre.gone', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(delay);
  await page.evaluate(() => { window.__ft = []; window.__jumps=[]; let last = performance.now(); let lf=-1; const f = t => { window.__ft.push(t - last); last = t; const k=+document.getElementById('wohnung').dataset.frame; if(lf>=0&&Math.abs(k-lf)>3)window.__jumps.push([lf,k]); lf=k; if (window.__rec) requestAnimationFrame(f); }; window.__rec = true; requestAnimationFrame(f); });
  for (let i = 0; i < 60; i++) { await page.mouse.wheel(0, 140); await page.waitForTimeout(85); }
  await page.waitForTimeout(600);
  const stats = await page.evaluate(() => { window.__rec = false; const a = window.__ft.slice(5); a.sort((x, y) => x - y); const n = a.length; const sum = a.reduce((s, v) => s + v, 0);
    return { frames: n, avgMs: +(sum / n).toFixed(1), p50: +a[Math.floor(n * .5)].toFixed(1), p95: +a[Math.floor(n * .95)].toFixed(1), maxMs: +a[n - 1].toFixed(1), pctOver33: +((a.filter(v => v > 33).length / n) * 100).toFixed(1), scene: document.getElementById('wohnung').dataset.scene, jumps: window.__jumps.length, jumpSample: window.__jumps.slice(0,6) }; });
  stats.errors=errs;
  await ctx.close();
  return stats;
}
(async () => {
  const browser = await chromium.launch({ executablePath: EXE, args: ['--enable-gpu-rasterization'] });
  const r = [];
  for (const d of [1200, 2500, 6000]) r.push({ delayAfterPre: d, ...(await scrollFps(browser, d)) });
  console.log(label, JSON.stringify(r, null, 1));
  await browser.close();
})();
