const { chromium } = require('playwright');
const fs=require('fs');
const EXE = process.env.CHROME || undefined;

(async () => {
  const browser = await chromium.launch({ executablePath: EXE, headless: process.env.HEADED !== '1', args: ['--enable-gpu-rasterization'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto('http://localhost:8099/?nolenis', { waitUntil: 'load' });
  await page.waitForSelector('#pre.gone', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2500);
  const info = await page.evaluate(async () => {
    const room = document.querySelectorAll('.w-room')[5];
    const top = room.getBoundingClientRect().top + scrollY;
    const h = room.offsetHeight;
    const CAM = .45;
    const at = p => { scrollTo(0, top + h * (CAM + (1 - CAM) * p)); ScrollTrigger.update(); };
    for (const [name, p] of [['before', 0], ['technik', .28], ['ausbau', .56], ['after', 1]]) {
      at(p); await new Promise(r => setTimeout(r, 450));
      await window.__materializeShot?.(name);
    }
    at(0); await new Promise(r => setTimeout(r, 250));
    const dt = []; let last = performance.now(); const frames = 180;
    for (let i = 0; i < frames; i++) await new Promise(resolve => requestAnimationFrame(t => {
      dt.push(t - last); last = t; at(i / (frames - 1)); resolve();
    }));
    const a = dt.slice(5).sort((x, y) => x - y), n = a.length;
    return { frames: n, avgMs: +(a.reduce((s,v)=>s+v,0)/n).toFixed(1), p50:+a[Math.floor(n*.5)].toFixed(1), p95:+a[Math.floor(n*.95)].toFixed(1), maxMs:+a[n-1].toFixed(1), pctOver33:+(a.filter(v=>v>33).length/n*100).toFixed(1), scene:document.getElementById('wohnung').dataset.scene };
  });
  for (const [name, p] of [['before', 0], ['technik', .28], ['ausbau', .56], ['after', 1]]) {
    await page.evaluate(([p]) => { const room=document.querySelectorAll('.w-room')[5],top=room.getBoundingClientRect().top+scrollY,h=room.offsetHeight;scrollTo(0,top+h*(.45+.55*p));ScrollTrigger.update(); }, [p]);
    await page.waitForTimeout(400);
    await page.screenshot({ path: `mat-${name}.png` });
  }
  const report={...info,errors,environment:'1440x900 Windows headless Chromium; rAF scroll benchmark, not physical device certification'};
  fs.writeFileSync('reports/materialize-v13.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
  await browser.close();
})();
