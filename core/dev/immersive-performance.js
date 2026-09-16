/* Isolated hardware Chrome lab sample, not a physical iPhone FPS certification. */
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
(async()=>{const browser=await chromium.launch({channel:'chrome'});try{
 const ctx=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true}),p=await ctx.newPage(),cdp=await ctx.newCDPSession(p);
 await p.goto('http://localhost:8099');await p.waitForTimeout(7500);await cdp.send('Performance.enable');
 const before=await cdp.send('Performance.getMetrics');await p.evaluate(()=>{window.panFrames=[];window.panChanges=0;window.panObserver=new MutationObserver(()=>panChanges++);panObserver.observe(document.querySelector('.m-camera-plane'),{attributes:true,attributeFilter:['style']});});await p.waitForTimeout(1800);assert.equal(await p.evaluate(()=>panChanges),0,'No idle camera updates');
 await p.evaluate(()=>{let prev=performance.now();window.panRaf=requestAnimationFrame(function sample(t){panFrames.push(t-prev);prev=t;panRaf=requestAnimationFrame(sample);});});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:196,y:235}]});
 for(let i=1;i<=120;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:196+145*Math.sin(i/120*Math.PI*4),y:235}]});await p.waitForTimeout(16);}
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 const state=await p.evaluate(()=>{cancelAnimationFrame(panRaf);panObserver.disconnect();const f=panFrames.slice(2).sort((a,b)=>a-b),v=document.querySelector('.m-film'),q=v.getVideoPlaybackQuality();return{frames:f.length,p95:f[Math.floor(f.length*.95)],over33:f.filter(x=>x>33.4).length/f.length*100,panUpdates:panChanges,video:{total:q.totalVideoFrames,dropped:q.droppedVideoFrames,paused:v.paused}};});
 const after=await cdp.send('Performance.getMetrics'),metric=(m,n)=>m.metrics.find(x=>x.name===n)?.value||0,layouts=metric(after,'LayoutCount')-metric(before,'LayoutCount');
 assert.equal(layouts,0,'Panning must not trigger layout');assert(state.p95<=20&&state.over33<5,'Hardware lab frame regression');
 const report={checkedAt:new Date().toISOString(),browser:browser.version(),viewport:'393x852',physicalIPhone:false,idleUpdates:0,layoutCount:layouts,...state};fs.writeFileSync(path.join(__dirname,'reports/immersive-2026-09-14/performance.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
