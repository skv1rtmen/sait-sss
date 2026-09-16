const {chromium}=require('playwright'),fs=require('fs'),path=require('path');
const BASE=process.env.BASE||'http://localhost:8098',OUT=path.join(__dirname,'reports/release-fixes-2026-09-14');fs.mkdirSync(OUT,{recursive:true});
(async()=>{const b=await chromium.launch({args:['--enable-gpu-rasterization']}),rows=[];try{
for(const mode of (process.env.MODES||'normal').split(',')){
 const ctx=await b.newContext({viewport:{width:1440,height:900}}),p=await ctx.newPage();
 await p.addInitScript(()=>{window.__paints=0;const draw=CanvasRenderingContext2D.prototype.drawImage;CanvasRenderingContext2D.prototype.drawImage=function(...args){if(this.canvas.classList.contains('w-canvas'))window.__paints++;return draw.apply(this,args);};});
 await p.goto(BASE,{waitUntil:'load'});await p.waitForTimeout(4500);
 if(mode==='no-cam')await p.addStyleTag({content:'.w-cam{transform:none!important;transition:none!important}'});
 if(mode==='no-canvas')await p.addStyleTag({content:'.w-canvas,.w-fx{visibility:hidden!important}'});
 if(mode==='flat')await p.addStyleTag({content:'*{backdrop-filter:none!important;filter:none!important;box-shadow:none!important}.w-cam{transform:none!important;transition:none!important}.w-stage::after,.w-shade{display:none!important}'});
 const cdp=await ctx.newCDPSession(p);await cdp.send('Performance.enable');const metricsBefore=(await cdp.send('Performance.getMetrics')).metrics;
 await p.evaluate(()=>{window.__ft=[];window.__rec=true;window.__paints=0;let last=performance.now();function t(n){__ft.push(n-last);last=n;if(__rec)requestAnimationFrame(t)}requestAnimationFrame(t);});
 for(let i=0;i<60;i++){await p.mouse.wheel(0,140);await p.waitForTimeout(85);}await p.waitForTimeout(500);
 const data=await p.evaluate(()=>{__rec=false;const a=__ft.slice(5).sort((a,b)=>a-b),n=a.length;return {frames:n,p50:a[Math.floor(n*.5)],p95:a[Math.floor(n*.95)],pctOver33:100*a.filter(x=>x>33).length/n,paints:__paints,scene:document.querySelector('#wohnung')?.dataset.scene,budget:window.__filmBudget?.(),scrollY,canvas:[...document.querySelectorAll('canvas')].map(c=>[c.className,c.width,c.height]),stats:window.__filmStats?.()};});
 const after=(await cdp.send('Performance.getMetrics')).metrics;const metrics={};for(const key of ['TaskDuration','ScriptDuration','LayoutDuration','RecalcStyleDuration','LayoutCount','RecalcStyleCount'])metrics[key]=after.find(m=>m.name===key).value-metricsBefore.find(m=>m.name===key).value;
 rows.push({mode,...data,metrics});console.log(rows.at(-1));await ctx.close();fs.writeFileSync(path.join(OUT,'performance-'+(process.env.TAG||'current')+'.json'),JSON.stringify(rows,null,2));
}}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
