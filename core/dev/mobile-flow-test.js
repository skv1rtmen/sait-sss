const engines=require('playwright'),fs=require('fs'),path=require('path');
const engine=process.env.ENGINE||'chromium',BASE=process.env.BASE||'http://localhost:8099',out=path.join(__dirname,'reports');
const assert=(ok,msg)=>{if(!ok)throw Error(msg);};
const tap=async(p,sel)=>{await p.locator(sel).scrollIntoViewIfNeeded();await p.waitForTimeout(250);await p.locator(sel).tap();};
(async()=>{const browser=await engines[engine].launch();const results=[];
 try{for(const width of [320,390,430]){
  const ctx=await browser.newContext({viewport:{width,height:width===320?568:844},isMobile:true,hasTouch:true});let responseStatus=500;const leads=[],errors=[];
  await ctx.route(/n8n\.baucrm\.net/,async r=>{if(r.request().url().includes('web-anfrage')){leads.push(r.request().postDataJSON());await r.fulfill({status:responseStatus,contentType:'application/json',body:responseStatus===200?'{"ok":true,"nr":"QA-LOCAL"}':'{"ok":false}'});}else await r.fulfill({status:200,body:'{}'});});
  const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));await p.goto(BASE+'/kontakt');await p.waitForTimeout(600);
  await tap(p,'#submitBtn');assert(await p.locator('#i-name').getAttribute('aria-invalid')==='true','Missing required field accepted');assert(!leads.length,'Empty form sent');
  await tap(p,'#who button:first-child');await p.locator('#i-name').fill('QA Local Test');await p.locator('#i-mail').fill('qa@example.com');await p.locator('#i-phone').fill('abc');await p.locator('#i-priv').check();
  await tap(p,'#submitBtn');assert(await p.locator('#i-phone').getAttribute('aria-invalid')==='true','Invalid phone accepted');assert(!leads.length,'Invalid form sent');
  await p.locator('#i-phone').fill('+41 79 000 00 00');await p.locator('#i-msg').fill('Automatischer lokaler Test — keine echte Anfrage.');
  const upload=path.resolve(__dirname,'../../site/img/favicon-32.png');await p.locator('#i-fotos').setInputFiles(upload);await p.waitForSelector('.foto-rm');const box=await p.locator('.foto-rm').boundingBox();assert(box.width>=44&&box.height>=44,'Photo remove target small');await tap(p,'.foto-rm');assert(await p.locator('.foto-chip').count()===0,'Photo removal failed');
  await p.locator('#i-fotos').setInputFiles(upload);await p.waitForSelector('.foto-rm');
  await tap(p,'#submitBtn');await p.waitForSelector('#e-send');assert(await p.locator('#submitBtn').isEnabled(),'Retry disabled after failure');assert((await p.locator('#i-msg').inputValue()).includes('Automatischer'),'Form values lost on error');
  responseStatus=200;await tap(p,'#submitBtn');await p.waitForSelector('.sent h3');assert((await p.locator('.sent h3').textContent())==='Anfrage erfasst.','Success not shown');assert(leads.length===2,'Duplicate submission');assert(leads[0].request_id===leads[1].request_id,'Retry lost idempotency key');assert(leads[1].fotos?.length===1,'Photo payload missing');assert(await p.locator('.sent h3').evaluate(e=>e===document.activeElement),'Success not announced');
  await p.goto(BASE+'/');await p.waitForTimeout(3000);await p.locator('.m-tour-track button[data-room="5"]').tap();await p.waitForTimeout(1400);
  const before=await p.locator('#wCmp').evaluate(e=>+e.style.getPropertyValue('--x'));await p.locator('.w-cmp-h').focus();await p.keyboard.press('Home');assert(+await p.locator('.w-cmp-h').getAttribute('aria-valuenow')===4,'Compare Home');await p.keyboard.press('End');assert(+await p.locator('.w-cmp-h').getAttribute('aria-valuenow')===96,'Compare End');
  await p.keyboard.press('Home');for(let i=0;i<9;i++)await p.keyboard.press('ArrowRight');
  const handle=p.locator('.w-cmp-h'),h=await handle.boundingBox();
  if(engine==='chromium'){
   const cdp=await ctx.newCDPSession(p);const y=h.y+h.height/2,x=h.x+h.width/2;
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
   for(let i=1;i<=12;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+(width*.3-x)*i/12,y}]});await p.waitForTimeout(16);}
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();
  }else await handle.tap({position:{x:h.width*.75,y:h.height/2}});
  const after=await p.locator('#wCmp').evaluate(e=>+e.style.getPropertyValue('--x'));assert(engine==='chromium'?after>.25&&after<.35:after>.5,'Compare touch position wrong');
  await p.emulateMedia({reducedMotion:'reduce'});await p.waitForTimeout(500);assert(await p.evaluate(()=>Film.mode())==='plain','Dynamic reduced motion ignored');assert(await p.locator('.m-film').count()===0,'Video leaked in reduced mode');
  await p.emulateMedia({reducedMotion:'no-preference'});await p.waitForTimeout(500);assert(await p.locator('.m-film').count()===1,'Native motion not restored');
  for(let i=0;i<5;i++)for(const route of ['leistungen','home']){await p.evaluate(r=>go(r),route);await p.waitForTimeout(350);}
  assert(await p.locator('.m-tour').count()===1&&await p.locator('.m-film').count()===1,'SPA controller leak');
  await p.setViewportSize({width:852,height:393});await p.waitForTimeout(500);await p.evaluate(()=>scrollTo(0,0));await p.waitForTimeout(500);await p.locator('.m-tour-track button[data-room="0"]').tap();await p.locator('.m-tour-play').tap();await p.waitForFunction(()=>/\/m3\//.test(document.querySelector('.m-film')?.currentSrc),null,{timeout:5000});
  await p.setViewportSize({width:1024,height:768});await p.waitForTimeout(500);assert(await p.evaluate(()=>Film.mode())==='plain','Wide no-vendor fallback failed');
  await p.setViewportSize({width,height:844});await p.waitForTimeout(500);assert(await p.locator('.m-tour').count()===1,'Return to portrait failed');
  assert(!errors.length,errors.join('; '));results.push({width,passed:true,submittedOnlyToMock:leads.length,photoTarget:box,comparison:{before,after},routeCycles:5,errors});await ctx.close();console.log('FLOW PASS',engine,width);
 }
 }finally{await browser.close();}
 fs.writeFileSync(path.join(out,'mobile-flow-'+engine+'.json'),JSON.stringify(results,null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
