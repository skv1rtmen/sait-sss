/* Never sends a real lead. Every external write is intercepted before navigation. */
const pw=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const BASE=process.env.BASE||'http://localhost:8098',OUT=path.join(__dirname,process.env.REPORT_DIR||'reports/release-fixes-2026-09-14');
fs.mkdirSync(OUT,{recursive:true});
async function run(engine){
 const browser=await pw[engine].launch(),ctx=await browser.newContext({viewport:{width:375,height:667},isMobile:true,hasTouch:true,locale:'de-CH'});
 const checks=[],errors=[];let reply='error',held=null,sent=[];
 await ctx.route('**/*',async r=>{const req=r.request();if(req.method()==='GET'&&new URL(req.url()).origin===new URL(BASE).origin)return r.continue();
   if(req.url().includes('/web-anfrage')){sent.push(req.postDataJSON());if(reply==='hold'){held=r;return;}if(reply==='offline')return r.abort('internetdisconnected');return r.fulfill({status:reply==='error'?503:200,contentType:'application/json',body:JSON.stringify(reply==='error'?{ok:false}:reply==='unconfirmed'?{ok:true}:{ok:true,nr:'MOCK-FIX-ONLY'})});}
   return r.fulfill({status:200,body:'{}'});
 });
 const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));
 const check=(name,condition)=>{assert.ok(condition,name);checks.push(name);};
 const goto=async route=>{await p.goto(BASE+route);await p.waitForTimeout(500);};
 const fill=async()=>{await p.locator('#who button').first().click();await p.locator('#i-name').fill('Ирина Müller 🏠');await p.locator('#i-mail').fill(' qa@example.invalid ');await p.locator('#i-phone').fill('+41 (79) 123-45-67');await p.locator('#i-msg').fill('Nur Browser-Mock.');await p.locator('#i-priv').check();};
 try{
  await goto('/kontakt');
  await p.locator('a[data-message]').first().click();check('Free consultation prefilled on current contact page',(await p.locator('#i-msg').inputValue()).includes('kostenlose Beratung'));
  check('Semantic form',await p.locator('form#formCard').count()===1);
  await p.locator('#submitBtn').click();check('Empty validation',await p.locator('#i-phone').getAttribute('aria-invalid')==='true');
  await fill();await p.locator('#who button').first().focus();await p.keyboard.press('ArrowRight');check('Radio arrows + selected state',await p.locator('#who button[aria-checked=true]').getAttribute('data-who')==='Generalunternehmer');
  const popupWait=ctx.waitForEvent('page');await p.locator('#formCard a[data-go=datenschutz]').click();const popup=await popupWait;await popup.waitForLoadState();check('Privacy opens separate tab',popup.url().endsWith('/datenschutz')&&p.url().endsWith('/kontakt'));await popup.close();
  await p.locator('#i-mail').press('Enter');await p.waitForSelector('#e-send');check('Enter submits once',sent.length===1);check('Phone normalized',sent[0].telefon==='+41791234567');
  check('Failure preserves text',await p.locator('#i-name').inputValue()==='Ирина Müller 🏠');
  reply='unconfirmed';await p.locator('#submitBtn').click();await p.waitForSelector('#e-send');check('Unconfirmed success rejected',await p.locator('.sent').count()===0);
  const id=sent[0].request_id;check('Retry stable id',sent.every(s=>s.request_id===id));
  await p.locator('#i-fotos').setInputFiles({name:'broken.jpg',mimeType:'image/jpeg',buffer:Buffer.from('not an image')});await p.waitForFunction(()=>document.querySelector('#e-foto').textContent.includes('gelesen'));check('Decode error specific',(await p.locator('#e-foto').innerText()).includes('broken.jpg'));
  const colors=await p.locator('#fotoAdd').evaluate(e=>({color:getComputedStyle(e).color,height:e.getBoundingClientRect().height}));check('Upload button visible and 44px',colors.color!=='rgb(255, 255, 255)'&&colors.height>=44);
  await p.screenshot({path:path.join(OUT,engine+'-form.png'),fullPage:true});
  reply='hold';await p.locator('#submitBtn').dblclick({force:true});await p.waitForTimeout(250);check('Double click single pending',sent.length===3);assert(held);
  await p.locator('#nav .brand').click();await p.waitForURL(BASE+'/');await p.waitForSelector('#i-msg');await p.locator('#i-msg').fill('NEW UNSENT PROJECT');
  await held.fulfill({status:200,contentType:'application/json',body:'{"ok":true,"nr":"MOCK-OLDER"}'});held=null;await p.waitForTimeout(250);
  check('Late response cannot erase newer draft',await p.locator('#i-msg').inputValue()==='NEW UNSENT PROJECT');check('Late receipt announced separately',(await p.locator('#leadNotice').innerText()).includes('MOCK-OLDER'));
  await p.evaluate(()=>go('leistungen'));await p.waitForURL('**/leistungen');await p.waitForTimeout(300);await p.evaluate(()=>go('kontakt'));await p.waitForURL('**/kontakt');await p.waitForTimeout(300);
  check('Unsent draft survives route changes',await p.locator('#i-msg').inputValue()==='NEW UNSENT PROJECT');
  reply='hold';await p.locator('#submitBtn').click();await p.waitForTimeout(250);await p.evaluate(()=>go('leistungen'));await p.waitForURL('**/leistungen');await p.waitForTimeout(300);await held.fulfill({status:200,contentType:'application/json',body:'{"ok":true,"nr":"MOCK-DETACHED"}'});held=null;await p.waitForTimeout(250);check('Detached success no JS exception',errors.length===0);
  await p.evaluate(()=>go('kontakt'));await p.waitForURL('**/kontakt');await p.waitForTimeout(600);check('Previously confirmed draft cannot resubmit',await p.locator('#submitBtn').isDisabled());await p.locator('#i-msg').fill('NEW SECOND REQUEST');check('Editing confirmed draft enables new request',await p.locator('#submitBtn').isEnabled());
  await p.locator('#burger').click();await p.waitForTimeout(100);for(let i=0;i<22;i++){await p.keyboard.press('Tab');check('Menu focus isolated '+i,await p.evaluate(()=>!!document.activeElement.closest('#mobmenu')||document.activeElement.id==='burger'));}await p.keyboard.press('Escape');check('Menu Escape restores burger',await p.locator('#burger').evaluate(e=>e===document.activeElement));
  await p.locator('#cbOpen').evaluate(e=>e.click());await p.waitForTimeout(450);await p.locator('#cbPhone').fill('+41 (79) 123-45-67');reply='success';await p.locator('#cbSend').click();await p.waitForSelector('#cbOk',{state:'visible'});check('Callback success focus',await p.locator('#cbOkT').evaluate(e=>e===document.activeElement));
  for(let i=0;i<5;i++){await p.keyboard.press('Tab');check('Callback success trap '+i,await p.evaluate(()=>!!document.activeElement.closest('#cbwrap')));}await p.keyboard.press('Escape');
  await goto('/karriere');await p.locator('#j-name').fill('QA Bewerber');await p.locator('#j-phone').fill('123');await p.locator('#jobSubmitBtn').click();check('Career format error',await p.locator('#j-phone').getAttribute('aria-invalid')==='true'&&(await p.locator('#jm-phone').innerText()).includes('+41'));
  await p.locator('#j-phone').fill('+41 (79) 123-45-67');reply='error';await p.locator('#j-phone').press('Enter');await p.waitForSelector('#j-e-send');check('Career network failure announced + focused',await p.locator('#j-e-send').evaluate(e=>e===document.activeElement)&&(await p.locator('#jobStatus').innerText()).includes('nicht geklappt'));
  reply='success';await p.locator('#jobSubmitBtn').click();await p.waitForSelector('.sent h3');check('Career confirmed receipt',await p.locator('.sent h3').evaluate(e=>e===document.activeElement));
  await goto('/');check('Calculator singular',!(await p.locator('#estQty').innerText()).includes('1 Wohnungen'));
  await p.locator('#richtwert-sheet > details > summary').click();
  for(const chip of await p.locator('#estChips button').all()){await chip.click();check('Labor-only calculator '+await chip.innerText(),await p.locator('#estMat').isVisible()&&(await p.locator('#estMat').innerText()).includes('Material separat'));}
  await p.locator('.m-section-extra').filter({has:p.locator('#magmail')}).locator(':scope > summary').click();
  await p.locator('#magmail').fill('pdf@example.invalid');reply='success';await p.locator('#magmail').press('Enter');await p.waitForSelector('#magnote a[download]');check('PDF Enter produces confirmed download',await p.locator('#magnote').evaluate(e=>e===document.activeElement));
  await goto('/leistungen');
  check('No non-home poster preload',await p.locator('link[rel=preload][href*=poster]').count()===0);
  check('Unconfigured analytics not loaded',!(await p.evaluate(()=>Analytics.state())).loaded);
  for(const route of ['/audit-missing','/leistungen/missing','/img/missing.webp']){const r=await ctx.request.get(BASE+route);const html=await r.text();check('HTTP 404 '+route,r.status()===404&&html.includes('noindex,follow')&&!html.includes('rel="canonical"'));}
  check('No browser JS errors',errors.length===0);
 }finally{fs.writeFileSync(path.join(OUT,engine+'.json'),JSON.stringify({checks,errors,requestsToMock:sent.length},null,2));await browser.close();}
 console.log(engine+': '+checks.length+' checks passed; '+sent.length+' mocked leads; '+errors.length+' JS errors');
}
(async()=>{for(const engine of process.env.ENGINE?[process.env.ENGINE]:['chromium','webkit'])await run(engine);})().catch(e=>{console.error(e);process.exitCode=1;});
