/* Perf harness: (A) first-load timings under throttled network, (B) rAF frame-time stats while wheel-scrolling through rooms.
   Headless Chromium here renders with software GL, so absolute numbers are pessimistic — use for BEFORE/AFTER comparison only. */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const EXE = process.env.CHROME || undefined;
const label = process.argv[2] || 'run';

async function firstLoad(browser, throttle) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable');
  if (throttle) await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 120, downloadThroughput: 1.6 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8 });
  const t0 = Date.now();
  await page.goto('http://localhost:8099/', { waitUntil: 'commit' });
  const marks = await page.evaluate(() => new Promise(res => {
    const out = {}; const start = performance.timeOrigin;
    const done = () => { out.now = performance.now(); res(out); };
    const seen = (k, cond) => { const id = setInterval(() => { if (cond()) { out[k] = Math.round(performance.now()); clearInterval(id); } }, 20); };
    seen('firstDrawnFrame', () => { const w = document.getElementById('wohnung'); return w && w.classList.contains('is-drawn'); });
    seen('preloaderGone', () => { const p = document.getElementById('pre'); return p && p.classList.contains('gone'); });
    seen('introFinished', () => { const w = document.getElementById('wohnung'); return w && !w.classList.contains('is-driving') && w.dataset.frame && +w.dataset.frame >= 60; });
    setTimeout(done, 14000);
    const id = setInterval(() => { if (out.firstDrawnFrame && out.preloaderGone && out.introFinished) { clearInterval(id); done(); } }, 50);
  }));
  const nav = await page.evaluate(() => { const n = performance.getEntriesByType('navigation')[0]; return { domContentLoaded: Math.round(n.domContentLoadedEventEnd), load: Math.round(n.loadEventEnd), fcp: Math.round((performance.getEntriesByName('first-contentful-paint')[0] || {}).startTime || 0) }; });
  await ctx.close();
  return { ...nav, ...marks };
}

async function scrollFps(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:8099/', { waitUntil: 'load' });
  await page.waitForSelector('#pre.gone', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2500);
  await page.evaluate(() => { window.__ft = []; let last = performance.now(); const f = t => { window.__ft.push(t - last); last = t; if (window.__rec) requestAnimationFrame(f); }; window.__rec = true; requestAnimationFrame(f); });
  // ~5s of wheel scrolling through rooms 1..3 (60 ticks x 85ms)
  for (let i = 0; i < 60; i++) { await page.mouse.wheel(0, 140); await page.waitForTimeout(85); }
  await page.waitForTimeout(600);
  const stats = await page.evaluate(() => { window.__rec = false; const a = window.__ft.slice(5); a.sort((x, y) => x - y); const n = a.length; const sum = a.reduce((s, v) => s + v, 0);
    return { frames: n, avgMs: +(sum / n).toFixed(1), p50: +a[Math.floor(n * .5)].toFixed(1), p95: +a[Math.floor(n * .95)].toFixed(1), maxMs: +a[n - 1].toFixed(1), pctOver33: +((a.filter(v => v > 33).length / n) * 100).toFixed(1), scene: document.getElementById('wohnung').dataset.scene }; });
  await ctx.close();
  return stats;
}

(async () => {
  const browser = await chromium.launch({ executablePath: EXE, headless: process.env.HEADED !== '1', args: ['--enable-gpu-rasterization'] });
  const fast = await firstLoad(browser, false);
  const slow = await firstLoad(browser, true);
  const fps1 = await scrollFps(browser);
  const fps2 = await scrollFps(browser);
  const report={ label, firstLoad_unthrottled: fast, firstLoad_1p6Mbps_120ms: slow, scroll_run1: fps1, scroll_run2: fps2 };
  fs.writeFileSync(path.join(__dirname,'reports','bench-'+label+'.json'),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report, null, 2));
  await browser.close();
})();
