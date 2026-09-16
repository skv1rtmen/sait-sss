/* Run ALONE. Hardware-backed headless Chrome; not a physical iPhone/display certification. */
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const BASE=process.env.BASE||'http://localhost:8098',out=path.resolve(__dirname,process.env.REPORT_DIR||'reports/frame-budget-2026-09-14');fs.mkdirSync(out,{recursive:true});
const summary=a=>{a=a.filter(x=>x>0).sort((a,b)=>a-b);const n=a.length;return {frames:n,p50:a[Math.floor(n*.5)],p95:a[Math.floor(n*.95)],p99:a[Math.floor(n*.99)],max:a.at(-1),over20:100*a.filter(x=>x>20).length/n,over33:100*a.filter(x=>x>33.4).length/n};};
(async()=>{const browser=await chromium.launch({channel:'chrome'}),rows=[],errors=[];try{
 const sys=await(await browser.newBrowserCDPSession()).send('SystemInfo.getInfo');
 const hardware={browser:browser.version(),devices:sys.gpu.devices,features:sys.gpu.featureStatus};
 assert.equal(hardware.features.gpu_compositing,'enabled','Hardware acceptance requires a hardware compositor');
 for(const [width,height]of [[1440,900],[1920,1080],[3840,2160]]){
  const ctx=await browser.newContext({viewport:{width,height}}),p=await ctx.newPage();p.on('pageerror',e=>errors.push({width,message:e.message}));
  await p.route('**/*',r=>!['GET','HEAD','OPTIONS'].includes(r.request().method())?r.fulfill({status:503,body:'QA: no real submission'}):r.continue());
  await p.addInitScript(()=>{window.__qaDraws=0;const draw=CanvasRenderingContext2D.prototype.drawImage;CanvasRenderingContext2D.prototype.drawImage=function(...args){if(this.canvas.classList.contains('w-canvas'))__qaDraws++;return draw.apply(this,args);};});
  await p.goto(BASE+'/?nolenis');await p.waitForTimeout(4200);
  const measure=async(name,work)=>{
   await p.evaluate(()=>{window.__qaTimes=[];window.__qaRecording=true;let last=0;requestAnimationFrame(function tick(t){if(last)__qaTimes.push(t-last);last=t;if(__qaRecording)requestAnimationFrame(tick);});});
   await work();const values=await p.evaluate(()=>{__qaRecording=false;return __qaTimes;});
   const state=await p.evaluate(()=>({scene:wohnung.dataset.scene,heading:document.querySelector('.w-h')?.innerText,overflow:document.documentElement.scrollWidth>innerWidth+1,renderer:wohnung.dataset.materialRenderer,images:[...document.querySelectorAll('.w-material:not([hidden]) img')].map(e=>({width:e.naturalWidth,height:e.naturalHeight,opacity:e.style.opacity})),video:[...document.querySelectorAll('video')].map(v=>({width:v.videoWidth,height:v.videoHeight,quality:v.getVideoPlaybackQuality?.()}))}));
   const row={width,height,name,...summary(values),...state};rows.push(row);console.log(JSON.stringify({width,name,p95:row.p95,over33:row.over33}));
  };
  await measure('slow-wheel',async()=>{for(let i=0;i<60;i++){await p.mouse.wheel(0,140);await p.waitForTimeout(85);}});
  const bounds=await p.evaluate(()=>{const r=document.querySelectorAll('.w-room')[5],y=r.getBoundingClientRect().top+scrollY;return [y+r.offsetHeight*.48,y+r.offsetHeight*.95];});
  await p.evaluate(y=>{scrollTo(0,y);ScrollTrigger.update();},bounds[0]);await p.waitForTimeout(1800);
  await measure('material-forward',async()=>{for(let i=0;i<100;i++){await p.evaluate(y=>{scrollTo(0,y);ScrollTrigger.update();},bounds[0]+(bounds[1]-bounds[0])*i/99);await p.waitForTimeout(50);}});
  await measure('material-reverse',async()=>{for(let i=99;i>=0;i--){await p.evaluate(y=>{scrollTo(0,y);ScrollTrigger.update();},bounds[0]+(bounds[1]-bounds[0])*i/99);await p.waitForTimeout(50);}});
  await p.screenshot({path:path.join(out,'material-'+width+'.png')});
  await p.evaluate(()=>{const r=document.querySelectorAll('.w-room')[2];scrollTo(0,r.getBoundingClientRect().top+scrollY+r.offsetHeight*.6);ScrollTrigger.update();});await p.waitForTimeout(2500);
  await measure('bathroom-pointer',async()=>{for(let i=0;i<120;i++){await p.mouse.move(width*(.2+.6*i/119),height*.45);await p.waitForTimeout(16);}});
  await p.waitForTimeout(1600);const before=await p.evaluate(()=>__qaDraws);await p.waitForTimeout(1000);const extra=await p.evaluate(n=>__qaDraws-n,before);rows.push({width,height,name:'idle-canvas',draws:extra});assert.equal(extra,0);
  await p.screenshot({path:path.join(out,'bathroom-'+width+'.png')});await ctx.close();
 }
 const failures=rows.filter(r=>r.overflow||(r.name.startsWith('material')&&(r.scene!=='5'||r.renderer!=='compositor'||r.images.length!==2))||(r.frames&&r.p95>16.8));
 const result={base:BASE,environment:'Windows, clean headless Google Chrome profile, GTX 1080 hardware path; rAF timing is NOT proof of physical screen/video FPS. Full scene UI retained; no diagnostic hiding.',hardware,rows,errors,failures};
 fs.writeFileSync(path.join(out,(process.env.TAG||'local')+'-acceptance.json'),JSON.stringify(result,null,2));assert.equal(errors.length,0);assert.equal(failures.length,0,'95th percentile must meet the 16.8 ms (60 Hz, rounded) regression budget');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
