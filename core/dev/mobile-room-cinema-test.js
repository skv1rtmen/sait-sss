/* Regression for the immersive iPhone redesign: integrated scene, full-frame preview, dwell, automatic materialization,
   compact information and real clickable/keyboard-accessible controls. No real leads. */
const engines=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const engine=process.env.ENGINE||'chromium',BASE=process.env.BASE||'http://localhost:8099';
const profiles=[[320,568],[360,640],[375,667],[390,844],[393,852],[412,915],[430,932],[768,1024],[812,375]].filter(([w])=>!process.env.WIDTH||process.env.WIDTH.split(',').includes(String(w)));
const out=path.resolve(__dirname,process.env.REPORT_DIR||'reports/spatial-restore-2026-09-14','mobile-'+engine);fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await engines[engine].launch(),rows=[],errors=[];let page;
try{for(const [width,height]of profiles){
 const ctx=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,deviceScaleFactor:2});page=await ctx.newPage();const p=page;
 await ctx.route('**/*',r=>!['GET','HEAD','OPTIONS'].includes(r.request().method())?r.fulfill({status:503,body:'QA: no real submission'}):r.continue());
 p.on('pageerror',e=>errors.push({width,error:e.message}));p.on('console',m=>{if(['error','warning'].includes(m.type()))errors.push({width,error:m.text()});});
 await p.addInitScript(()=>{window.__qaPlays=[];document.addEventListener('playing',e=>{if(e.target.classList?.contains('m-film'))__qaPlays.push(e.target.currentSrc);},true);});
 await p.goto(BASE+'/?nolenis');await p.waitForTimeout(4600);
 assert.equal(await p.locator('#wSound').count(),0);assert.equal(await p.locator('.w-sheet > .m-section').count(),5);
 assert(await p.locator('#wFlow').evaluate(e=>[...e.children].slice(0,7).every(c=>c.classList.contains('w-room'))),'Seven rooms precede the information sections');
 for(let i=0;i<7;i++){
  if(i)await p.locator('.m-tour-next').tap();
  await p.waitForFunction(i=>document.querySelector('#wohnung').dataset.scene===String(i),i);
  if(i===5){await p.waitForFunction(()=>+document.querySelector('#wohnung').dataset.materialProgress>.12,null,{timeout:9000});
   if(width===390){await p.locator('.m-tour-play').tap();const paused=await p.locator('#wohnung').getAttribute('data-material-progress');await p.waitForTimeout(450);assert.equal(await p.locator('#wohnung').getAttribute('data-material-progress'),paused,'Materialization pauses');await p.locator('.m-tour-play').tap();}
   await p.waitForFunction(()=>document.querySelector('#wohnung').dataset.materialProgress==='1.000',null,{timeout:9500});
   assert.equal(await p.locator('#wCmp').isVisible(),false,'No inaccessible mobile slider');assert.equal(await p.locator('.w-material:not([hidden]) img').count(),2);await p.waitForTimeout(400);
  }else{if(i>0)await p.waitForFunction(i=>__qaPlays.some(u=>u.includes(FILM.scenes[i].clip+'.fwd.mp4')),i,{timeout:5000});await p.waitForFunction(()=>!document.querySelector('#wohnung').classList.contains('is-mobile-playing'),null,{timeout:7500});await p.waitForTimeout(650);}
  const state=await p.evaluate(i=>{
   const w=document.querySelector('#wohnung'),cam=w.querySelector('.w-cam'),im=w.querySelector('.w-still.on img'),v=w.querySelector('.m-film');
   const rect=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};
   const elements=[...w.querySelectorAll('.m-tour-head button:not(:disabled),.m-details-list .m-detail:first-child,.m-tour-offer,.m-tour-skip,.m-frame-expand')].filter(e=>{const s=getComputedStyle(e);return s.display!=='none'&&e.getBoundingClientRect().width>0;});
   const taps=elements.map(e=>{const r=rect(e),top=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return{label:e.getAttribute('aria-label')||e.textContent,rect:r,reachable:r.y>=64&&r.bottom<=innerHeight+1&&r.x>=0&&r.right<=innerWidth+1,hit:e===top||e.contains(top)};});
   const h=rect(w.querySelector('.w-h')),d=rect(w.querySelector('.m-details-list'));
   return{i,scene:w.dataset.scene,covered:w.classList.contains('is-covered'),details:w.querySelectorAll('.m-detail').length,expected:(FILM.scenes[i].ann||FILM.scenes[i].hot||[]).length,heading:rect(w.querySelector('.w-h')),cam:rect(cam),image:{src:im.currentSrc,width:im.naturalWidth,height:im.naturalHeight,fit:getComputedStyle(im).objectFit,transform:getComputedStyle(im).transform},video:{src:v.currentSrc,fit:getComputedStyle(v).objectFit},taps,overlap:h.x<d.right&&h.right>d.x&&h.y<d.bottom&&h.bottom>d.y,overflow:document.documentElement.scrollWidth>innerWidth+1,firstInfo:document.querySelector('.w-sheet').getBoundingClientRect().top};
  },i);
  rows.push({width,height,...state});assert(!state.covered&&!state.overflow&&!state.overlap,`Layout ${width}/${i}`);assert.equal(state.details,state.expected);assert.equal(state.image.fit,'cover');assert.equal(state.image.transform,'none');assert.equal(state.video.fit,'cover');assert(!/-p\.webp|\/m3p\//.test(state.image.src+state.video.src),'Wide originals remain available; no baked-in portrait crop');assert(state.image.width>state.image.height);
  assert(state.cam.y===0&&state.cam.height>=height-1,'Immersive image covers the stage, not a separate 16:9 player');assert(state.heading.y>(width>height?114:200)&&state.heading.bottom<state.cam.bottom,'Heading integrated over the scene');
  assert(state.taps.every(t=>t.reachable&&t.hit),`Unreachable control ${width}/${i}: ${JSON.stringify(state.taps.filter(t=>!t.reachable||!t.hit))}`);
  if(i<6)assert(state.firstInfo>height,'No sheet covers the room during its hold');
  await p.locator('.m-detail').first().tap();assert(await p.locator('#mDetailCard').evaluate(e=>e.open));await p.keyboard.press('Tab');assert(await p.locator('#mDetailCard').evaluate(e=>e.contains(document.activeElement)),'Native detail dialog owns focus');await p.keyboard.press('Escape');assert.equal(await p.locator('#mDetailCard').isVisible(),false);
  if([320,375,390,812].includes(width)){await p.locator('.m-tour-room').tap();await p.screenshot({path:path.join(out,`${width}-room-${i}.png`)});}
 }
 await p.locator('.m-frame-expand').tap();assert(await p.locator('.m-frame-preview').evaluate(e=>e.open));await p.waitForFunction(()=>document.querySelector('.m-frame-preview img').naturalWidth>0);assert.equal(await p.locator('.m-frame-preview img').evaluate(e=>getComputedStyle(e).objectFit),'contain');await p.keyboard.press('Escape');
 if(height>width){await p.locator('.m-tour-next').tap();await p.waitForTimeout(1700);assert(await p.locator('#wohnung').evaluate(e=>e.classList.contains('is-covered')),'Final room arrow exits the tour');}else await p.evaluate(()=>document.querySelector('.w-sheet').scrollIntoView());
 for(let j=0;j<5;j++){const summary=p.locator('.m-section>summary').nth(j);await summary.scrollIntoViewIfNeeded();await summary.click();await p.waitForTimeout(850);assert(await p.locator('.m-section').nth(j).evaluate(e=>e.open));assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Open section overflow');if(width===390&&[0,2].includes(j))await p.screenshot({path:path.join(out,`info-${j}.png`)});await summary.click();}
 await p.evaluate(()=>scrollToId('richtwert'));await p.waitForTimeout(900);assert(await p.locator('#richtwert').evaluate(e=>e.closest('details').open),'Calculator anchor expands its section');
 await p.evaluate(()=>go('kontakt'));await p.waitForTimeout(700);assert.equal(await p.locator('.m-film').count(),0);assert.equal(await p.locator('.m-camera-plane').count(),0);await p.goBack();await p.waitForTimeout(1800);assert.equal(await p.locator('.m-tour').count(),1);assert.equal(await p.locator('.m-camera-plane').count(),1);assert.equal(await p.locator('.w-sheet > .m-section').count(),5);
 await ctx.close();console.log('PASS',engine,width,height);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({base:BASE,rows,errors},null,2));
}
assert.deepEqual(errors,[]);console.log('MOBILE ROOM CINEMA PASS '+rows.length);
}catch(e){if(page&&!page.isClosed())await page.screenshot({path:path.join(out,'FAIL.png')});throw e;}finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
