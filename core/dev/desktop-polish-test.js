const {chromium,webkit}=require('playwright'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
const BASE=process.env.BASE||'http://localhost:8099',PHASE=process.env.PHASE||'before';
const profiles=process.env.SIZE?[process.env.SIZE.split('x').map(Number)]:process.env.QUICK?[[1440,900]]:[[1000,700],[1280,720],[1440,640],[1440,900],[1920,1080],[2560,1440],[3840,2160]];
const out=path.join(__dirname,'reports','desktop-polish-'+PHASE);fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await (process.env.ENGINE==='webkit'?webkit:chromium).launch();const rows=[],errors=[];
try{for(const [width,height]of profiles){const p=await browser.newPage({viewport:{width,height},deviceScaleFactor:1});await p.route(/n8n\.baucrm\.net/,r=>r.fulfill({status:200,contentType:'application/json',body:'{"ok":true,"nr":"MOCK"}'}));
p.on('pageerror',e=>errors.push({width,error:e.message}));p.on('console',m=>{if(['error','warning'].includes(m.type()))errors.push({width,type:m.type(),error:m.text()});});
await p.goto(BASE+'/?nolenis',{waitUntil:'load'});await p.waitForTimeout(4200);
const viewport=await p.locator('meta[name="viewport"]').getAttribute('content');assert.equal(viewport.includes('interactive-widget=resizes-content'),process.env.ENGINE!=='webkit','Keyboard viewport compatibility');
for(const i of [0,1,2,3,4,5,6,5,4,3,2,1,0]){
await p.evaluate(i=>{const r=document.querySelectorAll('.w-room')[i];scrollTo(0,i===0?0:r.getBoundingClientRect().top+scrollY+r.offsetHeight*.55);ScrollTrigger.update();},i);await p.waitForTimeout(1600);
const row=await p.evaluate(i=>{const W=document.querySelector('#wohnung'),ov=document.querySelector('#wOv'),h=ov.querySelector('.w-h');
const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height,right:r.right,bottom:r.bottom};};
const visible=e=>{if(!e)return false;let a=e,o=1;while(a&&a!==document){const s=getComputedStyle(a);if(s.display==='none'||s.visibility==='hidden')return false;o*=+s.opacity;a=a.parentElement;}return o>.8;};
const intersect=(a,b)=>a.x<b.right&&a.right>b.x&&a.y<b.bottom&&a.bottom>b.y;
const title=rect(h),controls=['#wRoomNav','#wSound','#wPlan'].map(s=>document.querySelector(s)).filter(visible).map(e=>({name:e.id,...rect(e)}));
const tips=[...document.querySelectorAll('#wHot .w-hs,#wHot .w-ann-lab')].map(e=>{const r=rect(e),v=visible(e),x=Math.max(0,Math.min(innerWidth-1,r.x+r.w/2)),y=Math.max(0,Math.min(innerHeight-1,r.y+r.h/2)),top=document.elementFromPoint(x,y);return {name:e.getAttribute('aria-label'),visible:v,rect:r,inView:r.y>=70&&r.x>=0&&r.right<=innerWidth&&r.bottom<=innerHeight,clickable:v&&(e===top||e.contains(top))};});
const style=e=>({class:e.className,opacity:getComputedStyle(e).opacity,transform:getComputedStyle(e).transform,inline:e.getAttribute('style')});
return {target:i,scene:W.dataset.scene,heading:h.innerText,headingVisible:visible(h)&&[...h.querySelectorAll('.w-w>span')].every(visible),diagnostic:{overlay:style(ov),heading:style(h),words:[...h.querySelectorAll('.w-w>span')].map(style),stage:style(document.querySelector('#wStage')),animations:document.getAnimations().filter(a=>h.contains(a.effect?.target)).map(a=>({state:a.playState,time:a.currentTime}))},reveal:document.querySelector('#wStage').style.getPropertyValue('--reveal'),covered:W.classList.contains('is-covered'),title,controls,overlaps:controls.filter(c=>intersect(c,title)).map(c=>c.name),tips,overflow:document.documentElement.scrollWidth>innerWidth+1};},i);
rows.push({width,height,...row});if(width===1440&&height===900)await p.screenshot({path:path.join(out,`scene-${i}-${rows.length}.png`)});
const old=await p.evaluate(()=>performance.getEntriesByType('resource').map(r=>r.name).filter(s=>/\/img\/film\/(?:f|f2|f12|f12h|f12l|s9|s10|s11|s12|m1|m1p|m2|m2p|r1|mat|mat3|mat4)\/|poster-v(?:10|11|12)\./.test(s)));assert.deepEqual(old,[],'Legacy desktop media requested');
}
await p.evaluate(()=>go('kontakt'));await p.waitForTimeout(1600);await p.evaluate(()=>history.back());await p.waitForTimeout(1700);rows.push({width,height,spaBack:true,visible:await p.locator('.w-h').evaluate(e=>+getComputedStyle(e.closest('#wOv')).opacity>.8)});await p.close();}
const failures=rows.filter(r=>r.spaBack?!r.visible:r.overlaps.length||!r.headingVisible||r.overflow||r.tips.some(t=>!t.visible||!t.inView||!t.clickable));fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({base:BASE,profiles,rows,failures,errors},null,2));console.log(JSON.stringify({profiles:profiles.length,rows:rows.length,failures:failures.map(r=>({width:r.width,height:r.height,scene:r.scene,target:r.target,headingVisible:r.headingVisible,overlaps:r.overlaps,badTips:r.tips?.filter(t=>!t.visible||!t.inView||!t.clickable)})),errors},null,2));if(PHASE!=='before')assert(!failures.length&&!errors.length,'Desktop visual/state regression');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
