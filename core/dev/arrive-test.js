const { chromium } = require('playwright');
const EXE = process.env.CHROME || undefined;
(async () => {
  const browser = await chromium.launch({ executablePath: EXE, args: ['--enable-gpu-rasterization'] });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errs=[];page.on('console',m=>{if(m.type()==='error')errs.push(m.text())});page.on('pageerror',e=>errs.push(String(e)));
  await page.goto('http://localhost:8099/', { waitUntil: 'load' });
  await page.waitForSelector('#pre.gone', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2500);
  await page.evaluate(() => { window.__log = []; const f = t => { const w=document.getElementById('wohnung'); window.__log.push([Math.round(t), Math.round(scrollY), +w.dataset.frame, w.dataset.scene]); if (window.__rec) requestAnimationFrame(f); }; window.__rec = true; requestAnimationFrame(f); });
  // scroll ~ 0.5 room (fly zone) then stop
  for (let i = 0; i < +(process.argv[2]||18); i++) { await page.mouse.wheel(0, 120); await page.waitForTimeout(80); }
  await page.waitForTimeout(2200);
  const res = await page.evaluate(() => { window.__rec=false; const L=window.__log; const out={n:L.length}; 
    // find last user-driven movement and analyze settling
    let rev=0, stalls=0, maxDt=0; for(let i=2;i<L.length;i++){ const d1=L[i][1]-L[i-1][1], d0=L[i-1][1]-L[i-2][1]; if(d1*d0<0 && Math.abs(d1)>1) rev++; const dt=L[i][0]-L[i-1][0]; if(dt>maxDt)maxDt=dt; }
    out.reversals=rev; out.maxFrameMs=maxDt; out.final=L[L.length-1]; 
    const w=document.getElementById('wohnung'); const r=w.querySelectorAll('.w-room')[1]; const rect=r.getBoundingClientRect(); out.p1=+((-rect.top)/r.offsetHeight).toFixed(3);
    out.tail=L.slice(-40).map(x=>x[1]).join(',');
    return out; });
  console.log(JSON.stringify({...res, errors: errs}, null, 1));
  await page.screenshot({ path: 'arrive-settled.png' });
  await browser.close();
})();
