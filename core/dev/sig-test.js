const { chromium } = require('playwright');
const EXE = process.env.CHROME || undefined;
(async () => {
  const browser = await chromium.launch({ executablePath: EXE });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:8099/', { waitUntil: 'load' });
  await page.waitForFunction(() => { const w=document.getElementById('wohnung'); return w && !w.classList.contains('is-driving') && +w.dataset.frame>=60; }, null, {timeout:20000});
  await page.waitForTimeout(500);
  // jump near room 6 top via Lenis immediate, then wheel into it
  await page.evaluate(()=>{ const r=document.querySelectorAll('.w-room')[6]; let t=0,n=r; while(n){t+=n.offsetTop||0;n=n.offsetParent;} Smooth.to(t-200,{immediate:true}); });
  await page.waitForTimeout(800);
  await page.evaluate(()=>{ window.__sig=[]; const f=()=>{ const p=document.querySelector('.w-sig svg path'); const w=document.getElementById('wohnung'); window.__sig.push([Math.round(performance.now()), p?p.style.strokeDashoffset:'-', w.dataset.scene, getComputedStyle(document.querySelector('.w-sig')).opacity, w.classList.contains('is-driving')?1:0]); if(window.__rec)requestAnimationFrame(f); }; window.__rec=true; requestAnimationFrame(f); });
  for (let i=0;i<8;i++){ await page.mouse.wheel(0,120); await page.waitForTimeout(30); }
  await page.waitForTimeout(4500);
  const log = await page.evaluate(()=>{ window.__rec=false; const L=window.__sig; const t0=L[0][0]; return L.filter((x,i)=>i%6===0).map(x=>[x[0]-t0,x[1],x[2],x[3],x[4]]); });
  console.log(JSON.stringify(log));
  await page.screenshot({path:'sig-arrived.png'});
  await browser.close();
})();
