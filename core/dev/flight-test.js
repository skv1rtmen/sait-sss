const { chromium } = require('playwright');
const EXE = process.env.CHROME || undefined;
const fling=require('./fling.js');
(async () => {
  const browser = await chromium.launch({ executablePath: EXE, args:['--enable-gpu-rasterization'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errs=[];page.on('console',m=>{if(m.type()==='error'&&!/TUNNEL|ERR_/.test(m.text()))errs.push(m.text())});page.on('pageerror',e=>errs.push(String(e)));
  await page.goto('http://localhost:8099/', { waitUntil: 'load' });
  await page.waitForFunction(() => { const w=document.getElementById('wohnung'); return w && !w.classList.contains('is-driving') && +w.dataset.frame>=60; }, null, {timeout:20000});
  await page.waitForTimeout(800);
  await page.evaluate(() => { window.__log=[]; const f=t=>{ const w=document.getElementById('wohnung'); window.__log.push([Math.round(t),Math.round(scrollY),+w.dataset.frame,w.dataset.scene,w.classList.contains('is-flying')?1:0,document.querySelector('.w-vid.on')?1:0]); if(window.__rec)requestAnimationFrame(f); }; window.__rec=true; requestAnimationFrame(f); });
  // one hard trackpad-like fling: 25 wheel events of 120px within 400ms, then inertia tail
  await fling(page, 3000, 700); await page.waitForTimeout(3500);
  const r1 = await page.evaluate(()=>{ const L=window.__log; const fly=L.filter(x=>x[4]); const t0=L[0][0]; const v=document.querySelector('.w-vid'); return { flyStart: fly.length?fly[0][0]-t0:null, flyEnd: fly.length?fly[fly.length-1][0]-t0:null, flyFrames: fly.length, videoOnFrames:L.filter(x=>x[5]).length, videoOff:!document.querySelector('.w-vid.on'),videoSrc:v&&v.getAttribute('src'),frameFrom: fly.length?fly[0][2]:null, frameTo: fly.length?fly[fly.length-1][2]:null, final:[L[L.length-1][1],L[L.length-1][2],L[L.length-1][3]], scene:document.getElementById('wohnung').dataset.scene }; });
  // room 1 progress
  const p1 = await page.evaluate(()=>{ const r=document.querySelectorAll('.w-room')[1]; const b=r.getBoundingClientRect(); return +((-b.top)/r.offsetHeight).toFixed(3); });
  console.log('fling1', JSON.stringify(r1), 'p1', p1);
  await page.screenshot({path:'flight-arrived.png'});
  // second fling: should go through dwell zone, sheet... check we do not fly again immediately
  await page.evaluate(()=>{window.__log=[];});
  await fling(page, 3000, 700); await page.waitForTimeout(4000);
  const r2 = await page.evaluate(()=>{ const L=window.__log; return { from:L[0][1], to:L[L.length-1][1], scene:L[L.length-1][3], flew:L.some(x=>x[4]) }; });
  console.log('fling2', JSON.stringify(r2));
  // scroll back up into fly zone -> backward flight
  await page.evaluate(()=>{window.__log=[];});
  await fling(page, 3600, 700, -1); await page.waitForTimeout(3500);
  const r3 = await page.evaluate(()=>{ const L=window.__log; const fly=L.filter(x=>x[4]); return { from:L[0][1], to:L[L.length-1][1], flew:fly.length, frameFrom: fly.length?fly[0][2]:null, frameTo: fly.length?fly[fly.length-1][2]:null, scene:L[L.length-1][3] }; });
  console.log('back', JSON.stringify(r3));
  // nav dot click -> room 3 (from wherever we are: first fly forward to be in a room)
  await fling(page, 3000, 700); await page.waitForTimeout(3500);
  await page.click('.w-roomnav-dot[data-i="3"]',{force:true}); await page.waitForTimeout(5500);
  const r4 = await page.evaluate(()=>{ const w=document.getElementById('wohnung'); const r=document.querySelectorAll('.w-room')[3]; const b=r.getBoundingClientRect(); return {scene:w.dataset.scene, frame:w.dataset.frame, p:+((-b.top)/r.offsetHeight).toFixed(3)}; });
  console.log('dot3', JSON.stringify(r4), 'errors', errs);
  await browser.close();
})();
