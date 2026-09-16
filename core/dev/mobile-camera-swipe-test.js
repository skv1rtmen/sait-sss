const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
(async()=>{const b=await chromium.launch(),rows=[];try{for(const width of [320,375,393,430]){
 const height=width<390?667:852,p=await b.newPage({viewport:{width,height},isMobile:true,hasTouch:true}),cdp=await p.context().newCDPSession(p);
 await p.goto(process.env.BASE||'http://localhost:8099');await p.waitForTimeout(4300);
 for(let scene=1;scene<=2;scene++){const r=await p.locator('.w-cam').boundingBox(),x=width*.35,y=r.y+r.height*.37;
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});for(let k=1;k<=12;k++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-k*6}]});await p.waitForTimeout(16);}await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await p.waitForFunction(i=>document.querySelector('#wohnung').dataset.scene===String(i),scene,{timeout:3000});await p.waitForTimeout(5500);
  const state=await p.evaluate(()=>({scene:wohnung.dataset.scene,covered:wohnung.classList.contains('is-covered'),playing:wohnung.classList.contains('is-mobile-playing'),scrollY,infoTop:document.querySelector('.w-sheet').getBoundingClientRect().top}));assert.equal(state.scene,String(scene));assert(!state.covered&&!state.playing&&state.infoTop>height);rows.push({width,height,...state});
 }
 await p.close();console.log('CAMERA SWIPE PASS',width);
}}finally{await b.close();}fs.writeFileSync(path.join(__dirname,process.env.REPORT||'reports/spatial-restore-2026-09-14/camera-swipe.json'),JSON.stringify({passed:true,rows},null,2));})().catch(e=>{console.error(e);process.exitCode=1;});
