const {chromium}=require('playwright'),Axe=require('@axe-core/playwright').default,fs=require('node:fs'),path=require('node:path');
(async()=>{const b=await chromium.launch({channel:'chrome'});try{
 const ctx=await b.newContext({viewport:{width:1440,height:900}}),p=await ctx.newPage();
 await p.goto((process.env.BASE||'http://localhost:8098')+'/?nolenis');await p.waitForTimeout(4200);
 await p.evaluate(()=>{const r=document.querySelectorAll('.w-room')[5];scrollTo(0,r.getBoundingClientRect().top+scrollY+r.offsetHeight*.6);ScrollTrigger.update();});await p.waitForTimeout(1600);
 const x=await new Axe({page:p}).include('#wCmp').withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze();
 const colors=await p.evaluate(()=>{const c=e=>getComputedStyle(e).color,b=e=>getComputedStyle(e).backgroundColor;return {panel:b(document.querySelector('#wCmp')),label:c(document.querySelector('.w-cmp-tag')),thumb:b(document.querySelector('.w-cmp-h')),icon:c(document.querySelector('.w-cmp-h i'))};});
 const rgb=s=>s.match(/[\d.]+/g).map(Number),lum=rgb=>rgb.slice(0,3).map(v=>v/255).map(v=>v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4)).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0),ratio=(a,b)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
 const panel=rgb(colors.panel),alpha=panel[3]??1;
 const backdrop=lum(rgb(colors.label))>.5?255:0;
 const manualContrast={method:'Computed colours; translucent panel composited over '+(backdrop?'white (light text)':'black (dark text)')+', the worst-case backdrop. No assumption about the photograph.',label:ratio(rgb(colors.label),panel.slice(0,3).map(v=>v*alpha+backdrop*(1-alpha))),icon:ratio(rgb(colors.icon),rgb(colors.thumb)),colors};
 const r={violations:x.violations,incomplete:x.incomplete.map(v=>v.id),passes:x.passes.length,manualContrast};const out=path.resolve(__dirname,process.env.REPORT_DIR||'reports/frame-budget-2026-09-14');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'slider-axe.json'),JSON.stringify(r,null,2));console.log(JSON.stringify(r));if(x.violations.length||manualContrast.label<4.5||manualContrast.icon<4.5)process.exitCode=1;await ctx.close();
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
