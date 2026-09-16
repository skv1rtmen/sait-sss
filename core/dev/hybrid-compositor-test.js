const {chromium}=require('playwright'),fs=require('fs'),assert=require('assert/strict');
const fling=require('./fling.js');
(async()=>{const b=await chromium.launch();try{const p=await b.newPage({viewport:{width:1440,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
await p.addInitScript(()=>{window.__paint={visible:0,fallback:0};const draw=CanvasRenderingContext2D.prototype.drawImage;CanvasRenderingContext2D.prototype.drawImage=function(...a){if(this.canvas.classList.contains('w-canvas')){const v=document.querySelector('.w-vid.on');__paint[v&&!v.paused&&v.readyState>=2?'visible':'fallback']++;}return draw.apply(this,a);};});
await p.goto(process.env.BASE||'http://localhost:8099/');await p.waitForFunction(()=>document.querySelector('#wOv.show'));await p.waitForTimeout(1300);
await p.evaluate(()=>__paint={visible:0,fallback:0});await fling(p,3000,700);await p.waitForTimeout(2700);const normal=await p.evaluate(()=>({...__paint,scene:wohnung.dataset.scene,frame:wohnung.dataset.frame,videoOff:!document.querySelector('.w-vid.on')}));
assert(normal.visible<=4,'Hidden canvas still redraws throughout video');assert.equal(normal.scene,'1');assert.equal(+normal.frame,191);assert(normal.videoOff);
// A stalled decoder must expose a freshly rendered canvas, then recover on playing.
await p.locator('.w-roomnav-dot[data-i="2"]').click();await p.waitForSelector('.w-vid.on');await p.evaluate(()=>{const v=document.querySelector('.w-vid.on');v.pause();v.dispatchEvent(new Event('waiting'));__paint.fallback=0;});await p.waitForTimeout(300);
const stalled=await p.evaluate(()=>({...__paint,videoOff:!document.querySelector('.w-vid.on')}));assert(stalled.fallback>0,'No canvas redraw on decoder stall');assert(stalled.videoOff);
await p.waitForTimeout(3000);const arrival=await p.evaluate(()=>({scene:wohnung.dataset.scene,frame:wohnung.dataset.frame,title:getComputedStyle(document.querySelector('#wOv')).opacity}));assert.equal(arrival.scene,'2');assert.equal(+arrival.frame,287);assert(+arrival.title>.95);
assert.deepEqual(errors,[]);fs.writeFileSync('reports/hybrid-compositor-v13.json',JSON.stringify({normal,stalled,arrival,errors},null,2));console.log('HYBRID COMPOSITOR PASS');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
