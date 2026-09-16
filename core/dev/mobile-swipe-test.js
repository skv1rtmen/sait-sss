const {chromium}=require('playwright'),fs=require('fs'),path=require('path');
(async()=>{const browser=await chromium.launch();const results=[];
 try{for(const width of [320,375,393,430]){
 const height=width<390?667:852,ctx=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true}),p=await ctx.newPage(),cdp=await ctx.newCDPSession(p);
 await p.addInitScript(()=>{window.__plays=[];document.addEventListener('playing',e=>{if(e.target.classList?.contains('m-film'))__plays.push(e.target.currentSrc);},true);});await p.goto(process.env.BASE||'http://localhost:8099');await p.waitForTimeout(3800);
 const states=[];for(let i=0;i<12;i++){const x=width*.83,y=height*.66;await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});for(let k=1;k<=18;k++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-k*14}]});await p.waitForTimeout(16);}await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(500);
 const state=await p.evaluate(()=>({y:scrollY,scene:document.querySelector('#wohnung')?.dataset.scene,plays:__plays,covered:document.querySelector('#wohnung')?.classList.contains('is-covered')}));states.push(state);if(state.plays.some(s=>/c2-flur/.test(s)))break;}
 const passed=states.some(s=>s.y>100&&s.plays.some(src=>/c2-flur/.test(src)));results.push({width,height,passed,states});if(!passed)throw Error('Native swipe failed to launch flight at '+width);console.log('SWIPE PASS',width);await ctx.close();
 }}finally{await browser.close();fs.writeFileSync(path.join(__dirname,'reports/mobile-swipe.json'),JSON.stringify(results,null,2));}
})().catch(e=>{console.error(e);process.exitCode=1;});
