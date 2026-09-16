/* Real Chromium touch dispatch: panning never moves copy, changes room or loses the exit. */
const {chromium,webkit}=require('playwright'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const BASE=process.env.BASE||'http://localhost:8099',out=path.resolve(__dirname,process.env.REPORT_DIR||'reports/immersive-2026-09-14');fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch(),rows=[];
try{for(const [width,height] of [[320,568],[375,667],[393,852],[430,932]]){
 const ctx=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true}),p=await ctx.newPage(),cdp=await ctx.newCDPSession(p);
 await ctx.route('**/*',r=>r.request().method()==='POST'?r.abort():r.continue());await p.goto(BASE);await p.waitForTimeout(4600);
 const swipe=async(dx,dy)=>{const x=width*.48,y=220;await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});for(let i=1;i<=15;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx*i/15,y:y+dy*i/15}]});await p.waitForTimeout(18);}await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(200);};
 const initial=await p.locator('.m-camera-plane').evaluate(e=>getComputedStyle(e).transform),heading=await p.locator('.w-h').boundingBox();
 await swipe(-130,3);const shifted=await p.locator('.m-camera-plane').evaluate(e=>getComputedStyle(e).transform);
 assert.notEqual(initial,shifted,'Horizontal touch pans the photograph');assert.equal(await p.locator('#wohnung').getAttribute('data-scene'),'0');assert.deepEqual(await p.locator('.w-h').boundingBox(),heading,'Panning never shifts text');
 await swipe(130,2);const restored=await p.locator('.m-camera-plane').evaluate(e=>getComputedStyle(e).transform);assert.equal(restored,initial,'Pan is reversible');
 await swipe(2,-78);await p.waitForFunction(()=>document.querySelector('#wohnung').dataset.scene==='1');await p.waitForTimeout(5100);assert.equal(await p.locator('#wohnung').getAttribute('data-scene'),'1','One vertical gesture, one room');
 for(let i=2;i<7;i++){await p.locator('.m-tour-next').tap();await p.waitForTimeout(100);}
 assert.equal(await p.locator('#wohnung').getAttribute('data-scene'),'6');await swipe(2,-78);await p.waitForFunction(()=>document.querySelector('#wohnung').classList.contains('is-covered'),null,{timeout:5000});
 rows.push({width,height,pan:true,reverse:true,stationaryCopy:true,oneRoomSwipe:true,finalExit:true});
 if(width===320){await p.goto(BASE);await p.waitForTimeout(3500);await p.locator('.m-tour-next').tap();assert.equal(await p.locator('#wohnung').getAttribute('data-scene'),'1');await p.locator('.m-tour-next').focus();await p.keyboard.press('Enter');assert.equal(await p.locator('#wohnung').getAttribute('data-scene'),'2');await p.locator('.m-tour-next').click();assert.equal(await p.locator('#wohnung').getAttribute('data-scene'),'3');rows.push({mixedTouchKeyboardMouse:true});}
 await ctx.close();console.log('IMMERSIVE TOUCH PASS',width);
}}finally{await browser.close();}
const safari=await webkit.launch();try{const p=await safari.newPage({viewport:{width:390,height:667},isMobile:true,hasTouch:true});await p.route('**/css/mobile-film.css',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text()).replaceAll('env(safe-area-inset-top)','47px').replaceAll('env(safe-area-inset-bottom)','34px')});});await p.goto(BASE);await p.waitForTimeout(4700);const cta=await p.locator('.m-tour-offer').boundingBox();assert(cta.y+cta.height<=667,'Safe-area CTA visible');await p.locator('.m-tour-offer').tap();await p.waitForURL('**/kontakt');rows.push({engine:'webkit',safeAreaTop:47,safeAreaBottom:34,cta:true});}finally{await safari.close();}
fs.writeFileSync(path.join(out,'touch.json'),JSON.stringify({base:BASE,passed:true,rows},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
