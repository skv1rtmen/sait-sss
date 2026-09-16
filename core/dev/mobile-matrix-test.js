/* All routes, real rendering engines, touch-size/layout/forms: no production leads. */
const engines=require('playwright'),{AxeBuilder}=require('@axe-core/playwright'),fs=require('fs'),path=require('path');
const engine=process.env.ENGINE||'chromium',BASE=process.env.BASE||'http://localhost:8099';
const allRoutes=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../site/_tools/prerender-report.json'),'utf8')).map(r=>r.route);
const routes=process.env.ROUTE?process.env.ROUTE.split(','):allRoutes;
const profiles=[[320,568],[360,640],[375,667],[390,844],[393,852],[412,915],[430,932],[768,1024],[812,375]].filter(([w])=>!process.env.WIDTH||process.env.WIDTH.split(',').includes(String(w)));
const out=path.join(__dirname,'reports',(process.env.REPORT_PREFIX||'')+(process.env.ROUTE||process.env.WIDTH?'mobile-matrix-targeted-':'mobile-matrix-')+engine);fs.mkdirSync(out,{recursive:true});
const assert=(x,s)=>{if(!x)throw Error(s);};
async function inspect(p){return p.evaluate(()=>{
 const visible=e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&+s.opacity>0&&r.width>0&&r.height>0&&!e.closest('[hidden],[inert],[aria-hidden="true"]');};
 const name=e=>e.tagName.toLowerCase()+(e.id?'#'+e.id:'')+(typeof e.className==='string'&&e.className?'.'+e.className.trim().split(/\s/)[0]:'');
 const clipped=e=>{for(let n=e.parentElement;n&&n!==document.body&&n!==document.documentElement;n=n.parentElement)if(['hidden','clip','auto','scroll'].includes(getComputedStyle(n).overflowX))return true;return false;};
 const wide=[...document.querySelectorAll('#view *')].filter(e=>{if(!visible(e)||clipped(e))return false;const r=e.getBoundingClientRect();return r.top<innerHeight&&r.bottom>0&&(r.left< -2||r.right>innerWidth+2);}).map(name).slice(0,12);
 const inputs=[...document.querySelectorAll('input:not([type=hidden]):not([type=checkbox]):not([type=radio]),select,textarea')].filter(visible).filter(e=>parseFloat(getComputedStyle(e).fontSize)<16).map(name);
 const small=[...document.querySelectorAll('#view button,#view a[href],#view [role=button],.m-tour button,#stickycall a,#burger')].filter(e=>{
  if(!visible(e)||e.disabled)return false;const r=e.getBoundingClientRect(),s=getComputedStyle(e);if(r.top<0||r.bottom>innerHeight||r.left<0||r.right>innerWidth)return false;
  if(e.tagName==='A'&&s.display==='inline')return false;
  const pseudo=getComputedStyle(e,'::before');if(pseudo.content!=='none'&&pseudo.position==='absolute'){const w=r.width-(parseFloat(pseudo.left)||0)-(parseFloat(pseudo.right)||0),h=r.height-(parseFloat(pseudo.top)||0)-(parseFloat(pseudo.bottom)||0);if(w>=44&&h>=44)return false;}
  return r.width<43.9||r.height<43.9;
 }).map(e=>({el:name(e),w:Math.round(e.getBoundingClientRect().width),h:Math.round(e.getBoundingClientRect().height),text:(e.ariaLabel||e.textContent).trim().slice(0,50)}));
 return {overflow:document.documentElement.scrollWidth>innerWidth+1,wide,small,inputs,pages:document.querySelectorAll('#view>.page').length,h1:document.querySelectorAll('#view h1').length,broken:[...document.images].filter(e=>visible(e)&&e.complete&&(e.currentSrc||e.getAttribute('src'))&&!e.naturalWidth).map(e=>e.currentSrc),motion:window.Motion?.mode()};
 });}
async function interactions(p,width,height){
 const checks={};await p.goto(BASE+'/kontakt');await p.waitForTimeout(600);
 await p.locator('#burger').tap();await p.waitForTimeout(500);checks.menu=await p.evaluate(()=>({open:mobmenu.classList.contains('open'),inert:mobmenu.inert,scrollable:mobmenu.scrollHeight>mobmenu.clientHeight,clip:getComputedStyle(mobmenu).clipPath,body:getComputedStyle(document.body).overflowY}));
 assert(checks.menu.open&&!checks.menu.inert&&checks.menu.body==='hidden'&&checks.menu.clip==='none','Menu state');
 await p.screenshot({path:path.join(out,`${width}-menu.png`)});await p.keyboard.press('Escape');assert(await p.locator('#burger').getAttribute('aria-expanded')==='false','Menu Escape');
 await p.locator('#cbOpen').evaluate(e=>e.click());await p.waitForTimeout(500);await p.locator('#cbPhone').fill('12');await p.locator('#cbSend').tap();assert((await p.locator('#cbNote').textContent()).includes('gültige'),'Invalid callback not explained');
 checks.callback=await p.evaluate(()=>{const r=cb.getBoundingClientRect();return {top:r.top,bottom:r.bottom,vh:innerHeight,font:getComputedStyle(cbPhone).fontSize,overflow:getComputedStyle(document.documentElement).overflowY};});
 assert(checks.callback.top>=0&&checks.callback.bottom<=height+1,'Callback outside viewport');assert(checks.callback.overflow==='hidden','Callback background unlocked');
 await p.screenshot({path:path.join(out,`${width}-callback.png`)});await p.keyboard.press('Escape');
 await p.goto(BASE+'/referenzen');await p.waitForTimeout(600);const work=p.locator('[data-work]').first();await work.scrollIntoViewIfNeeded();await work.tap();await p.waitForTimeout(500);assert(await p.locator('#lb').getAttribute('aria-hidden')==='false','Lightbox open');
 const lb=await p.locator('.lb-close').boundingBox();assert(lb.y>=0&&lb.y+lb.height<=height,'Lightbox close offscreen');await p.screenshot({path:path.join(out,`${width}-lightbox.png`)});await p.locator('.lb-close').tap();await p.waitForTimeout(450);assert(await p.locator('#lb').getAttribute('aria-hidden')==='true','Lightbox close');
 return checks;
}
(async()=>{const browser=await engines[engine].launch();const rows=[],ui=[];
 try{for(const [width,height]of profiles){
  const ctx=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,deviceScaleFactor:1,locale:'de-CH'});
  await ctx.route(/n8n\.baucrm\.net/,r=>r.fulfill({status:200,contentType:'application/json',body:'{"ok":true}'}));
  const p=await ctx.newPage();let errors=[],http=[];p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.url().startsWith(BASE)&&r.status()>=400)http.push(r.status()+' '+r.url());});
  for(const route of routes){errors=[];http=[];const row={width,height,route};try{
   await p.goto(BASE+'/'+(route==='home'?'':route),{waitUntil:'load'});await p.waitForTimeout(route==='home'?950:750);
   row.top=await inspect(p);
   if(width===390){const a=await new AxeBuilder({page:p}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();row.axe=a.violations.map(v=>({id:v.id,impact:v.impact,targets:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}));}
   await p.evaluate(()=>scrollTo({top:(document.documentElement.scrollHeight-innerHeight)*.5,behavior:'instant'}));await p.waitForTimeout(850);row.middle=await inspect(p);
   await p.evaluate(()=>scrollTo({top:document.documentElement.scrollHeight,behavior:'instant'}));await p.waitForTimeout(850);row.bottom=await inspect(p);
   row.errors=[...errors];row.http=[...http];row.ok=!errors.length&&!http.length&&[row.top,row.middle,row.bottom].every(s=>!s.overflow&&!s.wide.length&&!s.inputs.length&&!s.broken.length&&s.pages===1&&s.h1===1)&&!row.axe?.length;
   if(!row.ok)await p.screenshot({path:path.join(out,`${width}-${route.replaceAll('/','-')}-FAIL.png`)});
  }catch(e){row.ok=false;row.exception=e.message;}
  rows.push(row);if(!row.ok)console.log('ISSUE',JSON.stringify(row));fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({rows,ui},null,2));
  }
  try{ui.push({width,height,ok:true,...await interactions(p,width,height)});}catch(e){ui.push({width,height,ok:false,error:e.message});await p.screenshot({path:path.join(out,`${width}-ui-FAIL.png`)});console.log('UI ISSUE',width,e.message);}
  await ctx.close();console.log('DONE',engine,width,height);
 }
 }finally{await browser.close();}
 const summary={engine,profiles:profiles.length,routes:routes.length,checked:rows.length,failed:rows.filter(r=>!r.ok).length,interactionFailures:ui.filter(r=>!r.ok),smallTargets:[...new Map(rows.flatMap(r=>[r.top,r.middle,r.bottom].filter(Boolean).flatMap(s=>s.small||[])).map(s=>[s.el+' '+s.text,s])).values()]};
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({summary,rows,ui},null,2));console.log(JSON.stringify(summary,null,2));if(summary.failed||summary.interactionFailures.length)process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
