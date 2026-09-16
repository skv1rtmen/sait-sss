/* Run alone: browser emulation measures regressions, not physical iPhone GPU performance. */
const {chromium}=require('playwright'),fs=require('fs'),path=require('path');
const BASE=process.env.BASE||'http://localhost:8099';
const stats=a=>{a=a.filter(x=>x>0).sort((a,b)=>a-b);return {samples:a.length,medianMs:+a[Math.floor(a.length*.5)].toFixed(2),p95Ms:+a[Math.floor(a.length*.95)].toFixed(2),over33Percent:+(100*a.filter(x=>x>33.4).length/a.length).toFixed(2),maxMs:+a.at(-1).toFixed(2)};};
(async()=>{const browser=await chromium.launch();const rows=[];
 try{for(const width of [375,393,430]){
  const ctx=await browser.newContext({viewport:{width,height:width===375?667:852},isMobile:true,hasTouch:true,deviceScaleFactor:2});
  const p=await ctx.newPage(),cdp=await ctx.newCDPSession(p),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(()=>{window.__qa={frames:[],videos:[],long:[],cls:0,lcp:0};let last=0;const frame=t=>{if(last)__qa.frames.push(t-last);last=t;requestAnimationFrame(frame);};requestAnimationFrame(frame);
   for(const type of ['largest-contentful-paint','layout-shift','longtask'])try{new PerformanceObserver(list=>list.getEntries().forEach(e=>{if(type==='largest-contentful-paint')__qa.lcp=e.startTime;else if(type==='layout-shift'&&!e.hadRecentInput)__qa.cls+=e.value;else if(type==='longtask')__qa.long.push(e.duration);})).observe({type,buffered:true});}catch(e){}
   const videoTicks=new WeakMap();document.addEventListener('playing',e=>{const v=e.target;if(!v.classList?.contains('m-film')||!v.requestVideoFrameCallback)return;const ticks=[];videoTicks.set(v,ticks);const tick=(now,m)=>{if(videoTicks.get(v)!==ticks)return;ticks.push({now,media:m.mediaTime,presented:m.presentedFrames});if(!v.ended)v.requestVideoFrameCallback(tick);};v.requestVideoFrameCallback(tick);},true);
   document.addEventListener('ended',e=>{if(e.target.classList?.contains('m-film')){const v=e.target,q=v.getVideoPlaybackQuality(),ticks=videoTicks.get(v)||[],a=ticks[0],z=ticks.at(-1);__qa.videos.push({src:v.currentSrc,total:q.totalVideoFrames,dropped:q.droppedVideoFrames,callbackCount:ticks.length,deliveredMediaFps:a&&z?+(1000*(ticks.length-1)/(z.now-a.now)).toFixed(1):null,encodedFramesPerSecond:a&&z?+((z.presented-a.presented)/(z.media-a.media)).toFixed(1):null});}},true);
  });
  await p.goto(BASE,{waitUntil:'load'});await p.waitForTimeout(4200);
  for(let i=1;i<7;i++){await p.locator('.m-tour-next').tap();await p.waitForTimeout(i===5?1200:2600);}
  const before=await p.evaluate(()=>scrollY);
  // Actual browser touch input; no window.scrollTo substitute for this check.
  const x=Math.floor(width*.8),y=width===375?400:550;
  const hit=await p.evaluate(([x,y])=>document.elementFromPoint(x,y)?.outerHTML.slice(0,180),[x,y]);
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
  for(let i=1;i<=18;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-i*15}]});await p.waitForTimeout(16);}
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(1000);
  const after=await p.evaluate(()=>scrollY);
  const r=await p.evaluate(()=>({...__qa,bytes:performance.getEntriesByType('resource').reduce((s,r)=>s+r.transferSize,0),portrait:[...document.querySelectorAll('video')].every(v=>/m3p/.test(v.currentSrc)),videoElements:document.querySelectorAll('video').length,heap:performance.memory?.usedJSHeapSize}));
  rows.push({width,viewport:ctx._options?.viewport,raf:stats(r.frames.slice(10)),videos:r.videos,lcpMs:Math.round(r.lcp),cls:r.cls,longTasks:r.long,transferBytes:r.bytes,touchScrolled:after>before,videoElements:r.videoElements,heap:r.heap,errors});
  if(errors.length||after<=before){console.error({width,before,after,hit,errors});fs.writeFileSync(path.join(__dirname,'reports/mobile-bench-fail.json'),JSON.stringify(rows,null,2));throw Error('Mobile touch/performance smoke failed');}await ctx.close();
 }
 // Slower connection: preserve content/navigation when decoding cannot begin in time.
 const ctx=await browser.newContext({viewport:{width:393,height:852},isMobile:true,hasTouch:true}),p=await ctx.newPage(),cdp=await ctx.newCDPSession(p);
 await cdp.send('Network.enable');await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:80,downloadThroughput:4*1024*1024/8,uploadThroughput:750*1024/8});await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
 await p.goto(BASE,{waitUntil:'load'});await p.waitForTimeout(4000);const slow=await p.evaluate(()=>({titleOpacity:+getComputedStyle(document.querySelector('.w-ov')).opacity,controller:!!document.querySelector('.m-tour'),resources:performance.getEntriesByType('resource').map(r=>({name:r.name,bytes:r.transferSize})),navigation:performance.getEntriesByType('navigation')[0].toJSON(),fcp:performance.getEntriesByName('first-contentful-paint')[0]?.startTime}));
 if(slow.titleOpacity<.95||!slow.controller)throw Error('Slow network hid content');rows.push({profile:'4Mbps / 80ms / CPU4x',...slow});await ctx.close();
 }finally{await browser.close();}
 const report={environment:'Windows headless Chromium; emulated touch viewports, not physical iOS/Android; UI rAF and adaptive 60/30fps video (requestVideoFrameCallback) are measured separately.',rows};fs.writeFileSync(path.join(__dirname,'reports',process.env.REPORT||'mobile-bench-v13.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
