const {chromium,webkit}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const out=path.resolve(__dirname,process.env.REPORT_DIR||'reports/frame-budget-2026-09-14');fs.mkdirSync(out,{recursive:true});
(async()=>{const rows=[];for(const [engine,type]of Object.entries({chromium,webkit}).filter(([e])=>!process.env.ENGINE||process.env.ENGINE===e)){const b=await type.launch();try{for(const [width,height]of (process.env.SIZE?[process.env.SIZE.split('x').map(Number)]:[[1000,700],[1440,640],[1440,900],[3840,2160]])){
 const p=await b.newPage({viewport:{width,height}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto('http://localhost:8098/?nolenis');await p.waitForTimeout(4200);
 const base=await p.evaluate(()=>{const r=document.querySelectorAll('.w-room')[5],y=r.getBoundingClientRect().top+scrollY;scrollTo(0,y+r.offsetHeight*.6);ScrollTrigger.update();return {y,h:r.offsetHeight};});await p.waitForTimeout(1800);
 const h=p.locator('.w-cmp-h'),box=p.locator('#wCmp');
 const valueIs=value=>p.waitForFunction(value=>document.querySelector('.w-cmp-h').getAttribute('aria-valuenow')===value,value,{timeout:2500});
 await h.focus();await p.keyboard.press('Home');await valueIs('0');
 await p.keyboard.press('ArrowRight');await valueIs('5');assert.equal(await h.getAttribute('aria-valuenow'),'5','Zero is a valid position, not the default 50%');
 await p.keyboard.press('End');await valueIs('100');
 const a=await box.boundingBox(),thumb=await h.boundingBox();assert(thumb.x>=a.x&&thumb.x+thumb.width<=a.x+a.width,'Thumb within panel');
 await p.mouse.click(a.x+a.width*.4,a.y+66);await p.waitForTimeout(350);const tapped=+(await h.getAttribute('aria-valuenow'));assert(tapped>25&&tapped<50);
 const pos=await h.boundingBox();await p.mouse.move(pos.x+pos.width/2,pos.y+pos.height/2);await p.mouse.down();await p.mouse.move(a.x+a.width*.8,a.y+66,{steps:15});await p.mouse.up();await p.waitForTimeout(600);
 await p.evaluate(({y,h})=>{scrollTo(0,y+h*.75);ScrollTrigger.update();},base);await p.waitForTimeout(1000);const resumed=+(await h.getAttribute('aria-valuenow'));console.log({engine,width,height,tapped,resumed,state:await p.evaluate(()=>({scene:wohnung.dataset.scene,mat:__filmDebug.mat()}))});assert(resumed>40&&resumed<80,'Scroll resumes after tap/key/drag');
 const rect=await box.boundingBox(),head=await p.locator('.w-h').boundingBox(),nav=await p.locator('#wRoomNav').boundingBox();console.log({rect,head,nav});const overlaps=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;assert(!overlaps(rect,nav),'Slider and vertical navigation do not overlap');assert(rect.y+rect.height<head.y,'Panel above heading');
 assert.equal(errors.length,0);await p.evaluate(({y,h})=>{scrollTo(0,y+h*.6);ScrollTrigger.update();},base);await p.waitForTimeout(700);await p.screenshot({path:path.join(out,`controls-${engine}-${width}-${height}.png`)});
 if(width===1440&&height===900){await p.evaluate(()=>{const sh=document.querySelectorAll('.w-room')[5].nextElementSibling;scrollTo(0,sh.getBoundingClientRect().top+scrollY+60);ScrollTrigger.update();});await p.waitForTimeout(700);assert.equal(await box.isVisible(),false,'Covered film must not overlay its slider on the content sheet');await p.setViewportSize({width:375,height:667});await p.waitForTimeout(1500);assert.equal(await p.locator('#wCmp').count(),1,'One comparison control after desktop/mobile remount');}
 rows.push({engine,width,height,home:0,end:100,tapped,resumed,layout:true,errors});await p.close();
 }}finally{await b.close();}}fs.writeFileSync(path.join(out,'controls.json'),JSON.stringify({passed:true,rows},null,2));console.log('MATERIAL CONTROLS PASS '+rows.length);})().catch(e=>{console.error(e);process.exitCode=1;});
