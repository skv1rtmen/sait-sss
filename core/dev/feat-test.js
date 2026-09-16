const { chromium } = require('playwright');
const EXE = process.env.CHROME || undefined;
const fling=require('./fling.js');
(async () => {
  const browser = await chromium.launch({ executablePath: EXE });
  const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const errs=[];page.on('pageerror',e=>errs.push(String(e)));page.on('console',m=>{if(m.type()==='error'&&!/TUNNEL|ERR_/.test(m.text()))errs.push(m.text())});
  await page.goto('http://localhost:8099/', { waitUntil: 'load' });
  await page.waitForFunction(() => { const w=document.getElementById('wohnung'); return w && !w.classList.contains('is-driving') && +w.dataset.frame>=60; }, null, {timeout:20000});
  await page.waitForTimeout(500);
  // parallax: move mouse, check transform changes
  const t0=await page.evaluate(()=>document.querySelector('.w-cam').style.transform);
  await page.mouse.move(100,100); await page.waitForTimeout(400); await page.mouse.move(1300,800); await page.waitForTimeout(600);
  const t1=await page.evaluate(()=>({cam:document.querySelector('.w-cam').style.transform,hot:document.getElementById('wHot').style.transform}));
  console.log('parallax', t0, '->', JSON.stringify(t1));
  // sound toggle
  await page.click('#wSound'); const snd=await page.evaluate(()=>[document.getElementById('wSound').getAttribute('aria-pressed'),localStorage.getItem('bs_sound')]); console.log('sound', snd);
  // keyboard → next room
  await page.keyboard.press('ArrowRight'); await page.waitForTimeout(600);
  const mid=await page.evaluate(()=>({flying:document.getElementById('wohnung').classList.contains('is-flying'),fly:getComputedStyle(document.getElementById('wFly')).opacity,txt:document.querySelector('.w-fly-t').textContent,bar:document.getElementById('wFly').style.getPropertyValue('--fly')}));
  await page.screenshot({path:'feat-midflight.png'});
  await page.waitForTimeout(3000);
  const after=await page.evaluate(()=>({scene:document.getElementById('wohnung').dataset.scene,fly:getComputedStyle(document.getElementById('wFly')).opacity,totop:getComputedStyle(document.getElementById('totop')).opacity,inFilm:document.documentElement.classList.contains('in-film')}));
  console.log('key→', JSON.stringify(mid), JSON.stringify(after));
  await page.keyboard.press('ArrowLeft'); await page.waitForTimeout(4000);
  console.log('key←', await page.evaluate(()=>document.getElementById('wohnung').dataset.scene));
  // note gone?
  console.log('note present:', await page.evaluate(()=>!!document.querySelector('.w-note')), 'errors', errs);
  await browser.close();
})();
