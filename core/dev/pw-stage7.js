/* BauStern — core/dev/pw-stage7.js · Etappe 7 Design-Durchgang: alle Routen, zwei Formate.
   Prüft je Route: JS-Fehler, kein waagerechtes Überlaufen (Telefon), keine Überlappung im #workgrid,
   Sticky-Leiste nicht auf /kontakt, Tippziele ≥44px in Nav/Sticky/Formular, h1 vorhanden und einmalig.
   Aufruf: node core/dev/pw-stage7.js [baseUrl] [--shots]   (Server: python3 -m http.server 8123 aus site/) */
const { chromium } = require('playwright');
const BASE = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'http://127.0.0.1:8123';
const SHOTS = process.argv.includes('--shots');
const ROUTES=['/','/leistungen','/leistungen/renovation','/leistungen/sanitaer','/loesungen','/loesungen/hausverwaltungen','/referenzen','/projekt/atlant-komplettausbau','/ueber-uns','/wissen','/kontakt','/karriere','/bewertung','/sanierung-zug','/impressum','/404'];
const file = r => r==='/' ? '/index.html' : r+'.html';
(async()=>{
  const b=await chromium.launch({executablePath:process.env.PW_CHROME||'/opt/pw-browsers/chromium-1194/chrome-linux/chrome',headless:true,args:['--no-sandbox']});
  let failures=0; const out=[];
  for(const [name,vp] of [['phone',{width:390,height:844,touch:true}],['desktop',{width:1440,height:900,touch:false}]]){
    const ctx=await b.newContext({viewport:{width:vp.width,height:vp.height},deviceScaleFactor:1,hasTouch:vp.touch,isMobile:vp.touch});
    const p=await ctx.newPage(); const errs=[];
    p.on('pageerror',e=>errs.push('PAGEERROR '+String(e).slice(0,120)));
    p.on('console',m=>{if(m.type()==='error'&&!/favicon|analytics|supabase|401|404|ERR_TUNNEL_CONNECTION_FAILED/i.test(m.text()))errs.push('CONSOLE '+m.text().slice(0,120));});
    for(const r of ROUTES){
      errs.length=0;
      try{await p.goto(BASE+file(r),{waitUntil:'networkidle',timeout:30000});}catch(e){out.push({vp:name,r,issues:['goto: '+String(e).slice(0,80)]});failures++;continue;}
      await p.waitForTimeout(900);
      await p.evaluate(async()=>{const H=document.body.scrollHeight;for(let y=0;y<H;y+=700){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,40));}window.scrollTo(0,0);});
      await p.waitForTimeout(400);
      const info=await p.evaluate((MIN)=>{
        const R=e=>e.getBoundingClientRect();
        const tiles=[...document.querySelectorAll('#workgrid .work')].map(R);
        let overlap=0;for(let i=0;i<tiles.length;i++)for(let j=i+1;j<tiles.length;j++){const a=tiles[i],c=tiles[j];if(a.left<c.right-2&&a.right>c.left+2&&a.top<c.bottom-2&&a.bottom>c.top+2)overlap++;}
        const small=[...document.querySelectorAll('#nav a,#nav button,#stickycall a,#stickycall button,.form button,.form .btn,#mobmenu a')].filter(e=>{const r=R(e);const st=getComputedStyle(e);return st.display!=='none'&&st.visibility!=='hidden'&&r.width>0&&(r.height<MIN||r.width<MIN);}).map(e=>(e.textContent||e.getAttribute('aria-label')||'').trim().slice(0,24)+' '+Math.round(R(e).width)+'x'+Math.round(R(e).height));
        const sticky=document.getElementById('stickycall');const stOn=sticky&&getComputedStyle(sticky).display!=='none';
        return {sw:document.documentElement.scrollWidth,iw:innerWidth,h1:document.querySelectorAll('h1').length,overlap,tiles:tiles.length,small,stOn,route:document.body.dataset.route||'',
          labels:[...new Set([...document.querySelectorAll('.btn,#stickycall a')].map(e=>e.textContent.trim()).filter(t=>/Anfrage starten|Jetzt anfragen/.test(t)))]};
      },vp.touch?44:24);   /* Touch: 44px (Apple/Material); Maus: WCAG 2.2 AA 24px */
      const issues=[];
      if(info.sw>info.iw+1)issues.push(`waagerechter Überlauf: ${info.sw} > ${info.iw}`);
      if(info.h1!==1)issues.push(`h1 ×${info.h1}`);
      if(info.overlap)issues.push(`#workgrid: ${info.overlap} überlappende Kacheln`);
      if(info.small.length)issues.push(`Zielgrösse <${vp.touch?44:24}px: `+info.small.slice(0,4).join(' · '));
      if(r==='/kontakt'&&info.stOn)issues.push('Sticky «Offerte» auf /kontakt sichtbar');
      if(info.labels.length)issues.push('uneinheitliche CTA: '+info.labels.join(', '));
      if(errs.length)issues.push(...errs.slice(0,3));
      failures+=issues.length; out.push({vp:name,r,issues});
      if(SHOTS){await p.evaluate(()=>{document.querySelectorAll('img[loading=lazy]').forEach(i=>i.loading='eager');});await p.addStyleTag({content:'#curtain,#pre,.grain{display:none!important}'});await p.waitForTimeout(500);await p.screenshot({path:`/tmp/audit/s7_${name}_${r==='/'?'home':r.slice(1).replace(/\//g,'-')}.png`,fullPage:true});}
    }
    await ctx.close();
  }
  await b.close();
  let s='';out.forEach(o=>{s+=`${o.issues.length?'✗':'✓'} ${o.vp.padEnd(8)} ${o.r}\n`;o.issues.forEach(i=>s+='    → '+i+'\n');});
  s+=`\n${failures?failures+' Befund(e)':'ALLES GRÜN'}\n`;console.log(s);process.exit(failures?1:0);
})();
