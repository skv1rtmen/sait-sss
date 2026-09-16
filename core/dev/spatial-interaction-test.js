/* Spatial labels must remain tied to the scene without becoming a blocking dock. */
const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const BASE=process.env.BASE||'http://localhost:8099';
const out=path.join(__dirname,'reports/spatial-restore-2026-09-14');fs.mkdirSync(out,{recursive:true});
(async()=>{const rows=[],errors=[];
for(const [engine,type] of Object.entries({chromium,webkit}).filter(([e])=>!process.env.ENGINE||e===process.env.ENGINE)){
 const browser=await type.launch();try{
 for(const [width,height] of [[1000,700],[1440,900],[1920,1080]]){
  const p=await browser.newPage({viewport:{width,height}});
  p.on('pageerror',e=>errors.push({engine,width,error:e.message}));
  await p.route('**/*',r=>!['GET','HEAD','OPTIONS'].includes(r.request().method())?r.fulfill({status:503,body:'QA: no real submission'}):r.continue());
  await p.addInitScript(()=>{localStorage.setItem('bs_sound','1');window.__qaAudio=0;for(const name of ['AudioContext','webkitAudioContext'])if(window[name])window[name]=new Proxy(window[name],{construct(target,args){window.__qaAudio++;return Reflect.construct(target,args);}});});
  await p.goto(BASE+'/?nolenis');await p.waitForTimeout(4600);
  const scene=async i=>{await p.evaluate(i=>{const r=document.querySelectorAll('.w-room')[i];scrollTo(0,i?r.getBoundingClientRect().top+scrollY+r.offsetHeight*.6:0);ScrollTrigger.update();},i);await p.waitForTimeout(1700);};
  for(let i=0;i<7;i++){
   await scene(i);
   const state=await p.evaluate(i=>{
    const rect=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height};};
    const overlaps=(a,b)=>a.x<b.x+b.w-1&&a.x+a.w>b.x+1&&a.y<b.y+b.h-1&&a.y+a.h>b.y+1;
    const layer=document.querySelector('#wHot'),buttons=[...layer.querySelectorAll('.w-hs,.w-ann-lab')],boxes=buttons.map(rect),heading=rect(document.querySelector('#wOv'));
    return{scene:document.querySelector('#wohnung').dataset.scene,count:buttons.length,expected:(FILM.scenes[i].ann||FILM.scenes[i].hot||[]).length,paths:layer.querySelectorAll('svg path').length,spatial:layer.classList.contains('is-spatial'),dock:layer.classList.contains('is-docked'),nav:getComputedStyle(document.querySelector('#wRoomNav')).backgroundColor,soundUI:!!document.querySelector('#wSound,.w-sound'),soundEngine:typeof FilmFX.Sound,audio:window.__qaAudio,muted:[...document.querySelectorAll('video')].every(v=>v.muted),headingOverlap:boxes.map((b,k)=>overlaps(b,heading)?k:-1).filter(k=>k>=0),hintOverlap:boxes.flatMap((a,j)=>boxes.slice(j+1).map((b,k)=>overlaps(a,b)?[j,j+k+1]:null).filter(Boolean)),boxes};
   },i);
   rows.push({engine,width,height,...state});assert.equal(state.scene,String(i));assert.equal(state.count,state.expected);assert.equal(state.paths,state.expected);assert(state.spatial&&!state.dock);assert.equal(state.nav,'rgba(0, 0, 0, 0)');assert(!state.soundUI&&state.soundEngine==='undefined'&&state.audio===0&&state.muted);assert.deepEqual(state.headingOverlap,[],`Heading collision ${engine} ${width} scene ${i}`);assert.deepEqual(state.hintOverlap,[],`Hint collision ${engine} ${width} scene ${i}`);
   if(i!==1&&state.count){const button=p.locator('#wHot .w-hs').first(),panel=p.locator('#w-spatial-detail');await button.click();await panel.waitFor({state:'visible'});assert.equal(await button.getAttribute('aria-expanded'),'true');await p.keyboard.press('Escape');assert.equal(await panel.isVisible(),false);assert(await button.evaluate(e=>e===document.activeElement));await button.click();await p.locator('.w-spatial-close').click();assert.equal(await panel.isVisible(),false);await button.click();await p.mouse.click(width/2,85);assert.equal(await panel.isVisible(),false);}
   if(i===1&&width===1440)await p.screenshot({path:path.join(out,`flur-${engine}.png`)});
  }
  await p.keyboard.press('m');assert.equal(await p.evaluate(()=>__qaAudio),0);
  await scene(2);await p.locator('#wHot .w-hs').first().click();const href=await p.locator('#w-spatial-detail a').getAttribute('href');await p.locator('#w-spatial-detail a').click();await p.waitForTimeout(1300);assert(new URL(p.url()).pathname.includes(href.replace(/\/$/,'')));await p.goBack();await p.waitForTimeout(2000);assert(await p.locator('.w-h').isVisible());assert.equal(await p.locator('#wSound').count(),0);await p.close();
 }
 }finally{await browser.close();}
}
assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,`spatial-interactions-${process.env.ENGINE||'all'}.json`),JSON.stringify({base:BASE,passed:true,rows,errors},null,2));console.log('SPATIAL INTERACTIONS PASS '+rows.length);
})().catch(e=>{console.error(e);process.exitCode=1;});
