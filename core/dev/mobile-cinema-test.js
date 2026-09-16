const engines=require('playwright'),engine=process.env.ENGINE||'chromium';
const fs=require('fs'),path=require('path');
const BASE=process.env.BASE||'http://localhost:8099';
const out=path.join(__dirname,'reports',(process.env.REPORT_PREFIX||'')+'mobile-cinema-'+engine);fs.mkdirSync(out,{recursive:true});
const profiles=[[320,568],[360,640],[375,667],[390,844],[393,852],[412,915],[430,932],[768,1024],[812,375]].filter(([w])=>!process.env.WIDTH||process.env.WIDTH.split(',').includes(String(w)));
const assert=(ok,msg)=>{if(!ok)throw new Error(msg);};
async function main(){
 const browser=await engines[engine].launch({executablePath:engine==='chromium'?process.env.CHROME||undefined:undefined});
 const rows=[];
 let currentPage;
 try{
 for(const [width,height] of profiles){
  const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,deviceScaleFactor:2});
  const p=await context.newPage(),errors=[],failed=[];p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)failed.push(r.status()+' '+r.url());});
  currentPage=p;
  await p.goto(BASE,{waitUntil:'domcontentloaded'});await p.waitForSelector('.is-cinema');await p.waitForFunction(()=>document.querySelector('.m-film')?.currentTime>0,{},{timeout:10000});await p.waitForTimeout(150);
  const initial=await p.evaluate(()=>{const v=document.querySelector('.m-film');return {mode:Film.mode(),motion:Motion.mode(),videoOn:v.classList.contains('on'),currentTime:v.currentTime,src:v.currentSrc,details:document.querySelectorAll('.m-detail').length};});
  assert(initial.mode==='lite'&&initial.motion==='native','Mobile motion did not mount');
  assert(initial.videoOn&&initial.currentTime>0,'Intro did not play');
  await p.screenshot({path:path.join(out,`${width}-intro.png`)});
  await p.locator('.m-tour-play').tap();const paused=await p.locator('.m-film').evaluate(v=>v.paused);assert(paused,'Pause did not pause');
  await p.locator('.m-tour-play').tap();await p.waitForTimeout(250);assert(await p.locator('.m-film').evaluate(v=>!v.paused),'Resume did not resume');
  await p.waitForTimeout(3500);
  const scenes=[];
  for(let i=0;i<7;i++){
   const transitionStart=Date.now();
   if(i)await p.locator('.m-tour-next').tap();
   // Readiness is asynchronous (fetch + codec warmup); a 350 ms sleep was not a playback assertion.
   // Keep a bounded startup budget and persist its duration instead of hiding slow starts.
   if(i!==0&&i!==5)await p.waitForFunction(()=>{const v=document.querySelector('.m-film');return v?.classList.contains('on')&&v.currentTime>0;},null,{timeout:3000});
   const during=await p.locator('.m-film').evaluate(v=>({on:v.classList.contains('on'),time:v.currentTime,src:v.currentSrc,readyState:v.readyState,error:v.error?.code}));
   during.startupMs=Date.now()-transitionStart;
   if(i!==0&&i!==5)assert(during.on&&during.time>0,`Scene ${i} video failed`);
   await p.waitForTimeout(2500);
   const state=await p.evaluate(()=>{const w=document.querySelector('#wohnung'),o=w.querySelector('.w-ov'),h=o.querySelector('.w-h'),d=o.querySelector('.w-d');
    const rect=h.getBoundingClientRect(),chips=[...w.querySelectorAll('.m-detail')],els=[...w.querySelectorAll('.m-tour-head button:not(:disabled),.m-tour-track button.current')];
    const detailRect=w.querySelector('.m-details-list').getBoundingClientRect();
    return {scene:+w.dataset.scene,title:h.innerText,titleOpacity:+getComputedStyle(o).opacity,descriptionOpacity:+getComputedStyle(d).opacity,details:chips.length,overflow:document.documentElement.scrollWidth>innerWidth+1,titleRect:{top:rect.top,bottom:rect.bottom},titleOverlapsDetails:rect.left<detailRect.right&&rect.right>detailRect.left&&rect.top<detailRect.bottom&&rect.bottom>detailRect.top,vh:innerHeight,videoOn:w.querySelector('.m-film').classList.contains('on'),controls:els.every(e=>{const r=e.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;})};});
   assert(state.scene===i,`Expected scene ${i}, got ${state.scene}`);assert(state.titleOpacity>.95&&state.descriptionOpacity>.95,`Scene ${i} text invisible`);assert(!state.overflow,'Horizontal overflow');assert(state.titleRect.top>=64&&state.titleRect.bottom<state.vh,`Title outside viewport at ${width}/${i}`);assert(!state.titleOverlapsDetails,`Title overlaps details at ${width}/${i}`);assert(state.controls,'Navigation outside viewport');
   const expected=i===1?6:i===6?2:3;assert(state.details===expected,`Lost details at ${i}: ${state.details}`);
   await p.locator('.m-detail').first().tap();await p.waitForTimeout(150);assert(await p.locator('#mDetailCard').isVisible(),'Detail failed to open');
   if([0,1,2,5,6].includes(i))await p.screenshot({path:path.join(out,`${width}-scene-${i}-detail.png`)});
   await p.locator('.m-detail-close').tap();assert(await p.locator('#mDetailCard').isHidden(),'Detail failed to close');
   await p.screenshot({path:path.join(out,`${width}-scene-${i}.png`)});
   scenes.push({...state,playback:during});
  }
  await p.locator('.m-tour-prev').tap();await p.waitForTimeout(2600);
  assert(await p.locator('#wohnung').getAttribute('data-scene')==='5','Reverse navigation failed');
  await p.waitForFunction(()=>document.querySelector('#wohnung').dataset.materialProgress==='1.000',null,{timeout:9500});const comparison=await p.locator('#wohnung').evaluate(e=>+e.dataset.materialProgress);assert(comparison===1&&!(await p.locator('#wCmp').isVisible()),'Automatic transformation must finish without a mobile slider');
  await p.evaluate(()=>go('leistungen'));await p.waitForTimeout(600);assert(await p.locator('.m-film').count()===0,'Mobile video leaked after route change');
  await p.evaluate(()=>go('home'));await p.waitForTimeout(600);assert(await p.locator('.m-tour').count()===1,'Duplicate mobile controller');
  await context.close();assert(!errors.length,'JS errors: '+errors.join(';'));assert(!failed.length,'HTTP failures: '+failed.join(';'));rows.push({width,height,initial,scenes,errors,failed,comparison});console.log('PASS',engine,width,height);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(rows,null,2));
 }
 for(const fallback of ['reduced','saveData','videoBlocked','autoplayBlocked']){
  const context=await browser.newContext({viewport:{width:375,height:812},isMobile:true,hasTouch:true,reducedMotion:fallback==='reduced'?'reduce':'no-preference'});
  if(fallback==='saveData')await context.addInitScript(()=>Object.defineProperty(navigator,'connection',{value:{saveData:true,effectiveType:'4g'}}));
  // WebKit media loading can bypass context.route(media). Point the data fixture to a real 404 instead.
  if(fallback==='videoBlocked')await context.route('**/js/data.js',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text())+"\nFILM.mobileVideo.dir='img/film/__qa_missing__/';FILM.mobileVideo.portraitDir='img/film/__qa_missing__/';FILM.mobileVideo.fallbackDir='img/film/__qa_missing__/';FILM.mobileVideo.fallbackPortraitDir='img/film/__qa_missing__/';"});});
  if(fallback==='autoplayBlocked')await context.addInitScript(()=>{HTMLMediaElement.prototype.play=function(){return Promise.reject(new DOMException('QA autoplay denied','NotAllowedError'));};});
  const p=await context.newPage();await p.goto(BASE);await p.waitForTimeout(fallback==='videoBlocked'?3200:1500);
  const result=await p.evaluate(()=>({film:Film.mode(),motion:Motion.mode(),videos:[...document.querySelectorAll('video')].filter(v=>!v.paused).length,media:[...document.querySelectorAll('video')].map(v=>({src:v.currentSrc,time:v.currentTime,paused:v.paused,error:v.error?.code})),title:document.querySelector('.w-h')?.textContent||document.querySelector('h1')?.textContent}));
  assert(result.videos===0,fallback+' played video');assert(fallback!=='reduced'||result.film==='plain','Reduced motion ignored');rows.push({fallback,...result});await context.close();
 }
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(rows,null,2));console.log(JSON.stringify({passed:true,engine,profiles:profiles.length,scenes:profiles.length*7,fallbacks:4,out},null,2));
 }catch(e){if(currentPage&&!currentPage.isClosed()){await currentPage.screenshot({path:path.join(out,'FAIL.png')});console.error(await currentPage.evaluate(()=>({scene:document.querySelector('#wohnung')?.dataset.scene,errors:document.body.innerText.slice(0,300)})));}throw e;}finally{await browser.close();}
}
main().catch(e=>{console.error(e);process.exit(1);});
