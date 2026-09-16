const { chromium } = require('playwright');
const EXE = process.env.CHROME || undefined;
const fling=require('./fling.js');
(async () => {
  const browser = await chromium.launch({ executablePath: EXE });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errs=[];page.on('pageerror',e=>errs.push(String(e)));
  await page.goto('http://localhost:8099/', { waitUntil: 'load' });
  await page.waitForFunction(() => { const w=document.getElementById('wohnung'); return w && !w.classList.contains('is-driving') && +w.dataset.frame>=60; }, null, {timeout:20000});
  await page.waitForTimeout(600);
  const rec=()=>page.evaluate(()=>{ window.__log=[]; const f=()=>{ const w=document.getElementById('wohnung'); window.__log.push([Math.round(performance.now()),Math.round(scrollY),+w.dataset.frame,w.classList.contains('is-flying')?1:0,document.querySelector('.w-vid.on')?1:0]); if(window.__rec)requestAnimationFrame(f); }; window.__rec=true; requestAnimationFrame(f); });
  const stop=()=>page.evaluate(()=>{ window.__rec=false; const L=window.__log; return { from:L[0][1], to:L[L.length-1][1], flew:L.some(x=>x[3]), videoOn:L.some(x=>x[4]), videoOff:!document.querySelector('.w-vid.on'), frames:[L[0][2],L[L.length-1][2]] }; });
  const p1=()=>page.evaluate(()=>{ const r=document.querySelectorAll('.w-room')[1]; const b=r.getBoundingClientRect(); return +((-b.top)/r.offsetHeight).toFixed(3); });
  // SLOW: 30 small wheel ticks of 30px every 60ms (=> 150px/120ms < 380)
  await rec(); for (let i=0;i<40;i++){ await page.mouse.wheel(0,30); await page.waitForTimeout(60); } await page.waitForTimeout(1500);
  console.log('slow scrub', JSON.stringify(await stop()), 'p1', await p1());
  // wait for snap to settle
  await page.waitForTimeout(1200); console.log('after snap p1', await p1());
  // FAST flick from the snapped position (should fly if still in fly zone, else continue)
  await rec(); await fling(page,3400,420); await page.waitForTimeout(3500);
  console.log('fast', JSON.stringify(await stop()), 'p1', await p1());
  console.log('errors', errs);
  await browser.close();
})();
