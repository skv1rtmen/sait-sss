const { chromium } = require('playwright');
const EXE = process.env.CHROME || undefined;
(async () => {
  const browser = await chromium.launch({ executablePath: EXE });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:8099/', { waitUntil: 'load' });
  await page.waitForFunction(() => { const w=document.getElementById('wohnung'); return w && !w.classList.contains('is-driving') && +w.dataset.frame>=60; }, null, {timeout:20000});
  await page.evaluate(()=>{ const r=document.querySelectorAll('.w-room')[6]; let t=0,n=r; while(n){t+=n.offsetTop||0;n=n.offsetParent;} Smooth.to(t-200,{immediate:true}); });
  await page.waitForTimeout(800);
  for (let i=0;i<8;i++){ await page.mouse.wheel(0,120); await page.waitForTimeout(30); }
  await page.waitForTimeout(4000);
  const r = await page.evaluate(async ()=>{ const svg=document.querySelector('.w-sig svg'); const p=svg.querySelector('path'); const out={hidden:svg.parentElement.hidden, cs:getComputedStyle(p).transition, inline:p.style.transition, off:p.style.strokeDashoffset, len:p.getTotalLength()};
    svg._sigReset(); await new Promise(r=>setTimeout(r,50)); svg._sigRun(); const s=[]; for(let i=0;i<12;i++){ await new Promise(r=>setTimeout(r,120)); s.push(getComputedStyle(p).strokeDashoffset); } out.samples=s; out.inlineAfter=p.style.transition; return out; });
  console.log(JSON.stringify(r));
  await browser.close();
})();
