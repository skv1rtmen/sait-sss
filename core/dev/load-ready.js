const { chromium } = require('playwright');
const EXE = process.env.CHROME || undefined;
(async () => {
  const browser = await chromium.launch({ executablePath: EXE });
  for (const throttle of [false, true]) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page); await cdp.send('Network.enable');
  if (throttle) await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 80, downloadThroughput: 4 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8 });
  await page.goto('http://localhost:8099/', { waitUntil: 'load' });
  const r = await page.evaluate(() => new Promise(res => { const t0=performance.now(); const id=setInterval(()=>{ const w=document.getElementById('wohnung'); if(w && !w.classList.contains('is-driving') && +w.dataset.frame>=60){ clearInterval(id); const s=window.__filmStats(); res({introDoneAt:Math.round(performance.now()), full_0_63:s.has(new Map([...Array(0)]),0,0), bm:s.bm, low:s.low}); } }, 30); }));
  const cov = await page.evaluate(() => { const s=window.__filmStats(); return { t:Math.round(performance.now()), fly1_full:'n/a' }; });
  // coverage of first fly frames 63..127 (S[0].f..S[1].f)
  const cov2 = await page.evaluate(() => { const s=window.__filmStats(); const S=window.SITE&&SITE.film&&SITE.film.scenes; return {bm:s.bm, low:s.low, blobs:s.blobs, lowBlobs:s.lowBlobs}; });
  await page.waitForTimeout(1500);
  const cov3 = await page.evaluate(() => { const s=window.__filmStats(); return {t:Math.round(performance.now()), bm:s.bm, low:s.low, blobs:s.blobs, lowBlobs:s.lowBlobs}; });
  await page.waitForTimeout(6000);
  const cov4 = await page.evaluate(() => { const s=window.__filmStats(); return {t:Math.round(performance.now()), bm:s.bm, low:s.low, blobs:s.blobs, lowBlobs:s.lowBlobs}; });
  console.log(throttle?'4Mbps/80ms':'unthrottled', JSON.stringify({introDoneAt:r.introDoneAt, atIntroEnd:cov2, plus1500:cov3, plus7500:cov4}));
  await ctx.close();
  }
  await browser.close();
})();
