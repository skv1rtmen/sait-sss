/* Local-only measured Rückblende scroll. Does not submit forms or alter product code. */
const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),assert=require('assert/strict');
(async()=>{const b=await chromium.launch();try{
 const p=await b.newPage({viewport:{width:1440,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto((process.env.BASE||'http://localhost:8098')+'/?nolenis');await p.waitForTimeout(4200);
 const bounds=await p.evaluate(()=>{const r=document.querySelectorAll('.w-room')[5],top=r.getBoundingClientRect().top+scrollY;return {start:top+r.offsetHeight*.48,end:top+r.offsetHeight*.95};});
 await p.evaluate(y=>{scrollTo(0,y);ScrollTrigger.update();},bounds.start);await p.waitForTimeout(1200);
 const runs=[];for(let run=0;run<2;run++){
  await p.evaluate(()=>{window.__materialFrames=[];window.__recordMaterial=true;let last=performance.now();function frame(t){__materialFrames.push(t-last);last=t;if(__recordMaterial)requestAnimationFrame(frame);}requestAnimationFrame(frame);});
  for(let i=0;i<100;i++){const k=(run===0?i:99-i)/99;await p.evaluate(y=>{scrollTo(0,y);ScrollTrigger.update();},bounds.start+(bounds.end-bounds.start)*k);await p.waitForTimeout(50);}
  runs.push(await p.evaluate(()=>{__recordMaterial=false;const a=__materialFrames.slice(5).filter(x=>x>0).sort((a,b)=>a-b),n=a.length;return {frames:n,p50:a[Math.floor(n*.5)],p95:a[Math.floor(n*.95)],pctOver33:100*a.filter(x=>x>33).length/n,scene:wohnung.dataset.scene,renderer:wohnung.dataset.materialRenderer,visibleImages:document.querySelectorAll('.w-material:not([hidden]) img').length,budget:window.__filmBudget?.()};}));
 }
 const report={environment:'Windows Chromium, local, 1440x900. Scripted scrolling through Rückblende; rAF is not physical GPU/video FPS.',runs,errors};
 fs.writeFileSync(path.join(__dirname,'reports/release-fixes-2026-09-14/material-bench.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 assert(!errors.length&&runs.every(r=>r.scene==='5'&&r.renderer==='compositor'&&r.visibleImages===2&&r.pctOver33<40));
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
