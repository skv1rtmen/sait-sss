const { chromium } = require('playwright');
const EXE = process.env.CHROME || undefined;
(async () => {
  const browser = await chromium.launch({ executablePath: EXE });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errs=[];page.on('pageerror',e=>errs.push(String(e)));
  await page.goto('http://localhost:8099/?nolenis', { waitUntil: 'load' });
  await page.waitForFunction(() => { const w=document.getElementById('wohnung'); return w && !w.classList.contains('is-driving') && +w.dataset.frame>=60; }, null, {timeout:20000});
  // jump to room 2 (Bad) dwell
  const y = await page.evaluate(()=>{ const r=document.querySelectorAll('.w-room')[2]; let t=0,n=r; while(n){t+=n.offsetTop||0;n=n.offsetParent;} return Math.round(t+r.offsetHeight*0.5); });
  await page.evaluate(v=>window.scrollTo(0,v), y); await page.waitForTimeout(2500);
  // find a hotspot overlapping the overlay text box, click it
  const info = await page.evaluate(()=>{ const ov=document.getElementById('wOv').getBoundingClientRect(); const hs=[...document.querySelectorAll('.w-hs')].map(h=>{const b=h.getBoundingClientRect();return {x:b.x+b.width/2,y:b.y+b.height/2,lbl:h.textContent.trim().slice(0,30),over:b.bottom>ov.top&&b.right>ov.left}}); return {ov:[ov.left,ov.top,ov.right,ov.bottom], hs}; });
  console.log(JSON.stringify(info));
  const target = info.hs.find(h=>h.over) || info.hs[0];
  const el = await page.evaluate(([x,y])=>{ const e=document.elementFromPoint(x,y); return e?e.tagName+'.'+e.className:null; }, [target.x,target.y]);
  console.log('elementFromPoint at hotspot:', el);
  await page.mouse.click(target.x, target.y); await page.waitForTimeout(600);
  const open = await page.evaluate(()=>[...document.querySelectorAll('.w-hs.open')].length);
  console.log('popup open:', open);
  await page.screenshot({ path: 'vc-hotspot.png' });
  // band + tl-cta + cinfo: scroll to them
  for (const [sel,name] of [['.tl-item--cta','vc-tlcta'],['.w-band','vc-band'],['.cinfo .dark','vc-cinfo']]) {
    await page.evaluate(s=>{ const e=document.querySelector(s); e.scrollIntoView({block:'center'}); }, sel); await page.waitForTimeout(1200);
    await page.screenshot({ path: name+'.png' });
  }
  console.log('errors', errs);
  await browser.close();
})();
