/* Diagnostic ablations only. Hidden UI / removed transforms are NEVER production scores. */
const {chromium}=require('playwright'),fs=require('fs'),path=require('path');
const out=path.join(__dirname,'reports/frame-budget-2026-09-14');fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch(process.env.CHANNEL?{channel:process.env.CHANNEL}:{});try{const rows=[];
 const system=await (await browser.newBrowserCDPSession()).send('SystemInfo.getInfo');
 fs.writeFileSync(path.join(out,'gpu-'+(process.env.TAG||'before')+'.json'),JSON.stringify({channel:process.env.CHANNEL||'bundled-headless-shell',devices:system.gpu.devices,features:system.gpu.featureStatus},null,2));
 for(const mode of (process.env.MODES||'baseline,no-cam,no-ui,no-effects').split(',')){
  const ctx=await browser.newContext({viewport:{width:+process.env.WIDTH||1440,height:+process.env.HEIGHT||900}}),p=await ctx.newPage();
  await p.goto((process.env.BASE||'http://localhost:8098')+'/?nolenis');await p.waitForTimeout(4200);
  const bounds=await p.evaluate(()=>{const r=document.querySelectorAll('.w-room')[5],y=r.getBoundingClientRect().top+scrollY;return [y+r.offsetHeight*.48,y+r.offsetHeight*.95];});
  await p.evaluate(y=>{scrollTo(0,y);ScrollTrigger.update();},bounds[0]);await p.waitForTimeout(1500);
  if(mode==='no-cam')await p.addStyleTag({content:'.w-cam{transform:none!important;transition:none!important}'});
  if(mode==='no-ui')await p.addStyleTag({content:'#wOv,#wHot,#wCmp,#wPlan,#wRoomNav,#wHud,#wScrollHint,#nav{display:none!important}'});
  if(mode==='no-effects')await p.addStyleTag({content:'.w-stage::after,.w-shade{display:none!important}*{box-shadow:none!important;filter:none!important;backdrop-filter:none!important}'});
  if(mode==='no-backdrop')await p.addStyleTag({content:'*{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}'});
  if(mode==='no-shadow')await p.addStyleTag({content:'*{box-shadow:none!important}'});
  if(mode==='no-filter')await p.addStyleTag({content:'*{filter:none!important}'});
  if(mode==='no-shade')await p.addStyleTag({content:'.w-stage::after,.w-shade{display:none!important}'});
  if(mode==='no-cmp')await p.addStyleTag({content:'#wCmp{display:none!important}'});
  const cdp=await ctx.newCDPSession(p);await cdp.send('Performance.enable');const before=(await cdp.send('Performance.getMetrics')).metrics;
  await p.evaluate(()=>{window.__frameTimes=[];window.__recordFrames=true;let last=performance.now();const loop=t=>{__frameTimes.push(t-last);last=t;if(__recordFrames)requestAnimationFrame(loop)};requestAnimationFrame(loop);});
  for(let i=0;i<100;i++){await p.evaluate(y=>{scrollTo(0,y);ScrollTrigger.update();},bounds[0]+(bounds[1]-bounds[0])*i/99);await p.waitForTimeout(50);}
  const row=await p.evaluate(()=>{__recordFrames=false;const a=__frameTimes.slice(5).filter(x=>x>0).sort((a,b)=>a-b);return {frames:a.length,p50:a[Math.floor(a.length*.5)],p95:a[Math.floor(a.length*.95)],over33:100*a.filter(x=>x>33).length/a.length,scene:wohnung.dataset.scene,renderer:wohnung.dataset.materialRenderer};});
  const after=(await cdp.send('Performance.getMetrics')).metrics,metrics={};for(const name of ['TaskDuration','ScriptDuration','LayoutDuration','RecalcStyleDuration','LayoutCount','RecalcStyleCount'])metrics[name]=after.find(x=>x.name===name).value-before.find(x=>x.name===name).value;
  rows.push({mode,...row,metrics});console.log(rows.at(-1));await ctx.close();fs.writeFileSync(path.join(out,'diagnostic-'+(process.env.TAG||'before')+'.json'),JSON.stringify(rows,null,2));
 }
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
