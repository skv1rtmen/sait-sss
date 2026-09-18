#!/usr/bin/env node
/* BauStern — Prerender (v9). Rendert jede Route der SPA einmal in Chromium (ohne GSAP = statischer Zustand) und
   schreibt sie als eigenständige HTML-Datei ins Deploy-Verzeichnis:
     site/index.html                (Startseite: Inhalt zwischen <!--prerender:start--> … <!--prerender:end-->)
     site/kontakt.html, site/leistungen/sanitaer.html, …
   Dazu: site/_redirects (Rewrite /kontakt -> /kontakt.html, SPA-Fallback zuletzt) und site/sitemap.xml.
   Aufruf:  node tools/prerender.js            (aus dem Projektordner, Chromium via Playwright)
   Wann:    nach JEDER Änderung an js/pages.js, js/data.js, css/ oder index.html — vor dem Deploy auf Netlify.
   Die App selbst braucht die Dateien nicht (Fallback index.html rendert alles clientseitig) — sie sind für Google,
   Social-Previews (og:*) und den ersten Paint ohne JS. */
const fs=require('fs'),path=require('path'),http=require('http');
const {chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..');
/* Liegt das Skript in <deploy>/_tools/, ist <deploy> selbst die Site; im Entwicklungs-Repo liegt sie unter site/ */
const SITE=fs.existsSync(path.join(ROOT,'site','index.html'))?path.join(ROOT,'site'):ROOT;
const ORIGIN=new URL(process.env.SITE_ORIGIN||'https://www.baustern.ch').origin;
if(!ORIGIN.startsWith('https://'))throw Error('SITE_ORIGIN must be an HTTPS origin');
const SANDBOX='/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const EXE=process.env.CHROME||(fs.existsSync(SANDBOX)?SANDBOX:undefined);   /* undefined = Playwright-eigenes Chromium (npx playwright install chromium) */
const PORT=8131;
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2','.json':'application/json','.mp4':'video/mp4','.webm':'video/webm','.webmanifest':'application/manifest+json'};
function serve(){return new Promise(res=>{const s=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]);
  let f=path.join(SITE,p==='/'?'index.html':p);if(!path.extname(p))f=path.join(SITE,'index.html');   /* Shell für alle Routen: der Prerender rendert immer clientseitig frisch */
  fs.readFile(f,(e,d)=>{if(e){r.writeHead(404);r.end();return;}r.writeHead(200,{'Content-Type':mime[path.extname(f)]||'application/octet-stream'});r.end(d);});});
  s.listen(PORT,()=>res(s));});}
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
const START='<!--prerender:start-->',END='<!--prerender:end-->';
/* Kanonische Form des SPA-Behälters. Hier UND in site/index.html ändern, sonst fällt der SSR-Inhalt weg. */
const VIEW_OPEN='<div id="view" role="main" tabindex="-1">';
const VIEW_OPEN_PR='<div id="view" role="main" tabindex="-1" data-prerender="1">';
const VIEW_TAG=VIEW_OPEN+'</div>';
function shell(){let h=fs.readFileSync(path.join(SITE,'index.html'),'utf8');
  /* vorhandenen Prerender-Inhalt der Startseite entfernen -> neutrale Shell */
  h=h.replace(new RegExp(START+'[\\s\\S]*?'+END),'');
  /* Etappe 11: Die Shell trug bis Etappe 10 genau <div id="view" tabindex="-1">. Seit role="main"
     dazukam, passte das feste Muster nicht mehr — die Routen wurden ohne SSR-Inhalt geschrieben
     (13 KB statt 25-85 KB, also ohne Text für Suchmaschinen und ohne JS). Darum attributtolerant. */
  h=h.replace(/<div id="view"[^>]*>\s*<\/div>/,VIEW_TAG);
  return h;}
function fill(tpl,d){let h=tpl;
  if(d.route!=='notfound')d.url=ORIGIN+'/'+(d.route==='home'?'':d.route);
  h=h.replace(/<meta name="site-origin"[^>]*>\s*/g,'').replace('<head>','<head>\n<meta name="site-origin" content="'+ORIGIN+'">');
  h=h.replace(/https:\/\/www\.baustern\.ch\/img\//g,ORIGIN+'/img/');
  if(d.route!=='home')h=h.replace(/<link rel="preload"[^>]*href="img\/film\/poster-[^"]*"[^>]*>\s*/g,'');
  const set=(re,val)=>{if(re.test(h))h=h.replace(re,val);else console.warn('  ! Tag fehlt im Template:',re);};
  set(/<title>[^<]*<\/title>/,`<title>${esc(d.title)}</title>`);
  set(/<meta name="description" content="[^"]*"\s*\/?>/,`<meta name="description" content="${esc(d.desc)}"/>`);
  if(d.route==='notfound'){
    h=h.replace(/<link rel="canonical"[^>]*>\s*/,'');
    h=h.replace(/<meta name="robots"[^>]*>/,'<meta name="robots" content="noindex,follow">');
  }else set(/<link rel="canonical" href="[^"]*">/,`<link rel="canonical" href="${d.url}">`);
  set(/<meta property="og:url" content="[^"]*">/,`<meta property="og:url" content="${d.url}">`);
  set(/<meta property="og:title" content="[^"]*">/,`<meta property="og:title" content="${esc(d.title)}">`);
  set(/<meta property="og:description" content="[^"]*">/,`<meta property="og:description" content="${esc(d.desc)}">`);
  set(/<meta name="twitter:title" content="[^"]*">/,`<meta name="twitter:title" content="${esc(d.title)}">`);
  set(/<meta name="twitter:description" content="[^"]*">/,`<meta name="twitter:description" content="${esc(d.desc)}">`);
  set(new RegExp(VIEW_TAG.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')),
      VIEW_OPEN_PR+START+d.html+END+'</div>');
  return h;}
(async()=>{
  const srv=await serve();
  const browser=await chromium.launch({executablePath:EXE});
  const ctx=await browser.newContext({viewport:{width:1440,height:900},locale:'de-CH'});
  /* statischer Zustand: ohne GSAP/Lenis rendert die App im no-gsap-Modus (alles sichtbar, keine Inline-Styles) */
  await ctx.route(/vendor\/(gsap|ScrollTrigger|lenis)\.min\.js/,r=>r.abort());
  await ctx.route(/^https?:\/\/(?!localhost)/,r=>r.abort());   /* keine externen Aufrufe (n8n, Supabase, Calendly) */
  const page=await ctx.newPage();
  await page.goto(`http://localhost:${PORT}/`,{waitUntil:'load'});
  const routes=await page.evaluate(()=>Object.keys(META).filter(k=>k!=='notfound'));
  const tpl=shell();const out=[];const today=new Date().toISOString().slice(0,10);
  for(const route of [...routes,'notfound']){
    const p=await ctx.newPage();
    await p.goto(`http://localhost:${PORT}/${route==='home'?'':route}`,{waitUntil:'load'});
    await p.waitForSelector('#view h1',{timeout:15000});
    await p.waitForTimeout(700);
    const d=await p.evaluate(()=>{
      /* v16 (Engine B): Der Film-Motor läuft auch ohne GSAP. Vor dem Abgreifen abbauen, damit weder die
         Scroll-Sperre noch die zur Laufzeit erzeugten Video-/Halt-Ebenen im statischen HTML landen. */
      if(window.Film&&Film.unmount)try{Film.unmount();}catch(e){}
      document.documentElement.classList.remove('v16','v16-lock');
      document.querySelectorAll('[data-odo]').forEach(e=>{e.textContent=e.dataset.odo;});
      document.querySelectorAll('#view [style]').forEach(e=>{if(/opacity|transform|visibility/.test(e.getAttribute('style')))e.removeAttribute('style');});
      document.querySelectorAll('#view script').forEach(e=>e.remove());
      const g=s=>{const el=document.head.querySelector(s);return el?el.getAttribute('content')||el.getAttribute('href'):'';};
      return {title:document.title,desc:g('meta[name=description]'),url:g('link[rel=canonical]'),html:document.getElementById('view').innerHTML,h1:(document.querySelector('#view h1')||{}).textContent||''};
    });
    await p.close();
    d.route=route;
    const file=route==='home'?'index.html':route==='notfound'?'404.html':route+'.html';
    const abs=path.join(SITE,file);fs.mkdirSync(path.dirname(abs),{recursive:true});
    fs.writeFileSync(abs,fill(tpl,d));
    if(route!=='notfound')out.push({route,file,url:d.url,title:d.title,bytes:fs.statSync(abs).size,h1:d.h1.trim().slice(0,50)});
    console.log(`✓ ${d.url.padEnd(60)} ${file}  ${(fs.statSync(abs).size/1024).toFixed(0)} KB`);
  }
  /* _redirects: Route -> vorgerenderte Datei (200 = Rewrite, kein Redirect); SPA-Fallback zuletzt */
  const rd=['# Generiert von _tools/prerender.js — bekannte Seiten 200, unbekannte Adressen echte 404',
    '/home  /  301',
    ...out.filter(o=>o.route!=='home').flatMap(o=>[`/${o.route}  /${o.file}  200`,`/${o.route}/  /${o.file}  200`]),
    '/*  /404.html  404',''].join('\n');
  fs.writeFileSync(path.join(SITE,'_redirects'),rd);
  /* sitemap.xml */
  const prio=r=>r==='home'?'1.0':/^(leistungen|loesungen|kontakt|referenzen)$/.test(r)?'0.9':/^(leistungen|loesungen|projekt|sanierung)/.test(r)?'0.8':/^(impressum|datenschutz|bewertung)$/.test(r)?'0.3':'0.6';
  const sm=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`+
    out.filter(o=>!/^(impressum|datenschutz)$/.test(o.route)).map(o=>`  <url><loc>${o.url}</loc><lastmod>${today}</lastmod><priority>${prio(o.route)}</priority></url>`).join('\n')+`\n</urlset>\n`;
  fs.writeFileSync(path.join(SITE,'sitemap.xml'),sm);
  const robotsPath=path.join(SITE,'robots.txt');
  if(fs.existsSync(robotsPath))fs.writeFileSync(robotsPath,fs.readFileSync(robotsPath,'utf8').replace(/^Sitemap:.*$/m,'Sitemap: '+ORIGIN+'/sitemap.xml'));
  fs.writeFileSync(path.join(__dirname,'prerender-report.json'),JSON.stringify(out,null,1));
  console.log(`\n${out.length} Routen vorgerendert · _redirects + sitemap.xml geschrieben`);
  await browser.close();srv.close();
})().catch(e=>{console.error(e);process.exit(1);});
