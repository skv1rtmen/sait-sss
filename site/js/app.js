/* BauStern — App: Router, render, Preloader, Curtain, Nav, Cursor, Formulare, Rückruf, Magnet, Boot.
   Lädt nach vendor/gsap, vendor/ScrollTrigger, js/data.js, js/pages.js, js/motion.js. */

/* ===== engine ===== */
if(typeof gsap==='undefined'){
  document.documentElement.classList.add('no-gsap');
  const noop=()=>{};
  window.gsap={to:noop,set:noop,fromTo:noop,killTweensOf:noop,
    utils:{toArray:x=>typeof x==='string'?[...document.querySelectorAll(x)]:[...(x||[])]},
    timeline:o=>{const t={set:()=>t,to:()=>t,add:f=>{if(typeof f==='function')f();return t},kill:()=>t};
      setTimeout(()=>{if(o&&o.onComplete)o.onComplete();},0);return t;}};
  window.ScrollTrigger={create:noop,getAll:()=>[],refresh:noop,killAll:noop};
}else{gsap.registerPlugin(ScrollTrigger);}

/* ===== Smooth Scroll (Lenis, MIT) =====
   Nur Desktop mit Maus/Trackpad und nur mit GSAP; Touch-Geräte scrollen nativ. Lenis fährt am GSAP-Ticker,
   ScrollTrigger wird pro Lenis-Frame aktualisiert. Smooth.to(ziel,{offset,immediate}) ersetzt window.scrollTo/scrollIntoView. */
window.Smooth=(function(){
  let L=null;
  const fine=matchMedia('(hover:hover) and (pointer:fine)').matches;
  /* v16 (Engine B): kein Lenis. Der Film hängt nicht mehr am Scroll, und ein zweiter Scroll-Treiber würde
     mit der Pin-Sperre in js/film-v16.js um dasselbe Rad konkurrieren. Rollback ?film=15 behält Lenis. */
  const v16=(typeof FILM!=='undefined'&&FILM.engine==='v16');
  const ok=typeof Lenis==='function'&&!v16&&!document.documentElement.classList.contains('no-gsap')&&fine&&!/nolenis/.test(location.search);
  /* Block 1 (1.8): Basis-Werte vs. "schwerere" Werte innerhalb der Wohnung-Pin-Zone (#wohnung) — dort soll
     Scrollen bewusst träger/präziser wirken (kein "über das Ziel hinausschiessen" mehr beim Kader-Scrubbing).
     film.js schaltet über einen ScrollTrigger auf #wohnung per setHeavy(true/false) um. */
  const BASE={wheelMultiplier:1,lerp:.1},HEAVY={wheelMultiplier:.75,lerp:.085};
  let heavy=false;
  if(ok){try{
    L=new Lenis({lerp:BASE.lerp,smoothWheel:true,wheelMultiplier:BASE.wheelMultiplier,autoRaf:false,anchors:false,autoResize:true});
    L.on('scroll',ScrollTrigger.update);
    gsap.ticker.add(t=>L.raf(t*1000));gsap.ticker.lagSmoothing(0);
  }catch(e){L=null;}}
  /* Zielposition ohne Transform-Einfluss (Blätter/Karten sind beim Aufruf oft noch skaliert/verschoben): offsetTop-Kette statt getBoundingClientRect */
  const absTop=el=>{let y=0,n=el;while(n){y+=n.offsetTop||0;n=n.offsetParent;}return y;};
  const to=(target,o)=>{o=o||{};
    const y=Math.max(0,(typeof target==='number'?target:absTop(target))+(o.offset||0));
    if(L){L.scrollTo(y,{immediate:!!o.immediate,duration:o.immediate?0:(o.duration||1.1),easing:t=>1-Math.pow(1-t,3),lock:false,force:!!o.immediate});return;}
    window.scrollTo({top:y,behavior:o.immediate?'auto':'smooth'});};
  /* on = true innerhalb #wohnung, false ausserhalb — schreibt defensiv auf mehrere mögliche Lenis-Property-Pfade,
     da sich die interne Struktur zwischen Lenis-Versionen unterscheidet; no-op, falls keine davon existiert. */
  const setHeavy=on=>{on=!!on;if(!L||heavy===on)return;heavy=on;const o=on?HEAVY:BASE;
    try{if(L.options){L.options.wheelMultiplier=o.wheelMultiplier;L.options.lerp=o.lerp;}
      if('wheelMultiplier' in L)L.wheelMultiplier=o.wheelMultiplier;if('lerp' in L)L.lerp=o.lerp;}catch(e){}};
  /* v9.1 — Kamerafahrt als gesperrte, lineare Fahrt (film.js «Stationen»): Nutzer-Eingaben werden bis onComplete ignoriert */
  const fly=(y,o)=>{o=o||{};if(!L)return false;L.scrollTo(Math.max(0,y),{duration:o.duration||2,easing:t=>t,lock:true,force:true,onComplete:o.onComplete});return true;};
  return {to,fly,stop:()=>{if(L)L.stop();},start:()=>{if(L)L.start();},resize:()=>{if(L)L.resize();},lenis:()=>L,on:!!L,setHeavy};
})();
/* Analytics-Brücke (js/analytics.js hört auf diese Ereignisse; ohne analytics.js sind es No-ops) */
const trackEv=(name,params)=>{try{document.dispatchEvent(new CustomEvent('bs:event',{detail:{name,params:params||{}}}));}catch(e){}};
const view=document.getElementById('view'),nav=document.getElementById('nav'),curtain=document.getElementById('curtain'),curtainMark=curtain.querySelector('.mark');
let current=null,animating=false,pending=null;

/* ===== router ===== */
/* Router (v9: History API statt Hash): / (home), /leistungen, /leistungen/:slug, /loesungen/:slug, /referenzen,
   /projekt/:slug, /ueber-uns, /wissen, /kontakt, /impressum, /datenschutz … — echte, für Google indexierbare URLs.
   Jede Route liegt zusätzlich vorgerendert als <route>.html im Deploy (tools/prerender.js), Netlify liefert sie per
   _redirects-Rewrite (200) aus; alles Unbekannte fällt auf index.html (SPA) zurück. Alte #/-Links werden beim Start
   per replaceState auf den Pfad umgeschrieben (Lesezeichen/Backlinks bleiben gültig). Unbekannte Route -> 404-Seite. */
const SITE_ORIGIN=document.querySelector('meta[name="site-origin"]')?.content||'https://www.baustern.ch';
const routeUrl=path=>'/'+String(path||'').replace(/^\/+/,'').replace(/\/+$/,'');
/* Slug-Templates (pLeistung/pLoesung/pProjekt) kommen aus pages.js; fehlen sie noch, fällt die Route defensiv auf die Übersicht zurück. */
const detailOr=(getFn,slug,fallback)=>{
  if(!slug)return fallback();
  let html=null;
  try{const fn=getFn();if(typeof fn==='function')html=fn(slug);}catch(e){console.error('Template für Slug "'+slug+'"',e);html=null;}
  return (html==null||html===false)?fallback():html;
};
const ROUTES={
  home:()=>pHome(),
  leistungen:slug=>detailOr(()=>typeof pLeistung==='function'?pLeistung:null,slug,pLeistungen),
  loesungen:slug=>detailOr(()=>typeof pLoesung==='function'?pLoesung:null,slug,pLoesungen),
  referenzen:()=>pReferenzen(),
  projekt:slug=>detailOr(()=>typeof pProjekt==='function'?pProjekt:null,slug,pReferenzen),
  'ueber-uns':()=>pUeber(),
  wissen:slug=>detailOr(()=>typeof pWissenArtikel==='function'?pWissenArtikel:null,slug,pWissen),
  kontakt:()=>pKontakt(),
  impressum:()=>pImpressum(),
  datenschutz:()=>pDatenschutz(),
  bewertung:()=>pBewertung(),
  karriere:()=>pKarriere(),
  'sanierung-winterthur':()=>pRegionSeo('winterthur'),
  'sanierung-zug':()=>pRegionSeo('zug'),
  'sanierung-luzern':()=>pRegionSeo('luzern'),
  notfound:slug=>pNotFound(slug),
};
/* Routen, die im Nav/META auf eine andere Hauptroute abbilden (projekt/:slug gehört zu "Referenzen") */
const ROUTE_ALIAS={projekt:'referenzen'};
/* Abwärtskompatibilität alter data-go-Namen -> Pfad */
const GO_MAP={home:'',ueber:'ueber-uns'};
function goPath(g){g=String(g||'').trim();return Object.prototype.hasOwnProperty.call(GO_MAP,g)?GO_MAP[g]:g.replace(/^#?\/?/,'');}
/* Akzeptiert Pfad ('/kontakt'), Hash-Form ('#/kontakt') oder nichts (= aktuelle Adresse; alter #/-Hash hat Vorrang) */
function parseRoute(src){
  if(src==null)src=(/^#\//.test(location.hash))?location.hash:location.pathname;
  const h=String(src).replace(/^#/,'').replace(/^\/+/,'').replace(/\/+$/,'').replace(/\.html$/,'').split('?')[0];
  const parts=h.split('/').filter(Boolean).map(p=>{try{return decodeURIComponent(p);}catch(e){return p;}});
  /* "index" landet hier nur, wenn jemand /index.html direkt aufruft (Netlify Pretty-URLs leiten das im Betrieb
     zwar auf "/" um, aber ein alter Link, ein Screenshot-Tool oder eine lokale Vorschau umgeht das) — ohne diese
     Zeile griff "index" nicht in ROUTES und die Startseite zeigte fälschlich die 404-Seite. */
  let name=parts[0]||'home';if(name==='index')name='home';
  const slug=parts.slice(1).join('/');
  if(name==='notfound'||!Object.prototype.hasOwnProperty.call(ROUTES,name)||(slug&&!Object.prototype.hasOwnProperty.call(META,name+'/'+slug)))return {name:'notfound',slug:h};
  return {name,slug};
}
const routeKey=r=>r?r.name+'/'+r.slug:'';
/* Nav-Link aktiv: Prefix-Match auf den Routen-Namen (leistungen/sanitaer -> "Leistungen", projekt/x -> "Referenzen") */
function setActive(route){const n=ROUTE_ALIAS[route.name]||route.name;document.querySelectorAll('.nav-links a').forEach(a=>{const p=goPath(a.dataset.go).split('/')[0]||'home';const on=p===n;a.classList.toggle('active',on);a.setAttribute('aria-current',on?'page':'false');});}
/* META[name/slug] || META[name] || META[alias] || META.home */
function setMeta(route){
  const M=typeof META==='object'&&META?META:{};
  const m=(route.slug&&M[route.name+'/'+route.slug])||M[route.name]||M[ROUTE_ALIAS[route.name]]||M.home||[document.title,''];
  document.title=m[0];const d=document.querySelector('meta[name=description]');if(d&&m[1])d.setAttribute('content',m[1]);
  /* Canonical + Open Graph je Route (v9): eine URL pro Seite, keine Duplikate über Hash/Slash-Varianten */
  const url=SITE_ORIGIN+routeUrl(route.name==='home'?'':route.name+(route.slug?'/'+route.slug:''));
  const setTag=(sel,attr,val,make)=>{let el=document.head.querySelector(sel);if(!el){el=make();document.head.appendChild(el);}el.setAttribute(attr,val);};
  if(route.name==='notfound'){const c=document.head.querySelector('link[rel=canonical]');if(c)c.remove();}   /* 404: noindex, kein Canonical */
  else setTag('link[rel=canonical]','href',url,()=>{const l=document.createElement('link');l.rel='canonical';return l;});
  setTag('meta[property="og:url"]','content',url,()=>{const t=document.createElement('meta');t.setAttribute('property','og:url');return t;});
  setTag('meta[property="og:title"]','content',m[0],()=>{const t=document.createElement('meta');t.setAttribute('property','og:title');return t;});
  if(m[1]){setTag('meta[property="og:description"]','content',m[1],()=>{const t=document.createElement('meta');t.setAttribute('property','og:description');return t;});
    setTag('meta[name="twitter:description"]','content',m[1],()=>{const t=document.createElement('meta');t.name='twitter:description';return t;});}
  setTag('meta[name="twitter:title"]','content',m[0],()=>{const t=document.createElement('meta');t.name='twitter:title';return t;});
  const rb=document.querySelector('meta[name=robots]');if(rb)rb.setAttribute('content',route.name==='notfound'?'noindex,follow':'index,follow');
}

/* ===== Arbeiten-Grid (Home, Referenzen, Leistungs-Detail) ===== */
/* WORKS[i].id ist der Slug (Vertrag Phase C); solange er fehlt, dient "w<index>" als stabile Kennung. */
const workId=w=>w.id||('w'+WORKS.indexOf(w));
const findWork=id=>WORKS.find(w=>workId(w)===String(id))||null;
/* Klickbare Karten tastaturbedienbar machen (Phase C darf role/tabindex selbst setzen — hier nur ergänzen) */
function a11yWorks(scope){(scope||document).querySelectorAll('[data-work]').forEach(el=>{
  if(el.tagName==='A'||el.tagName==='BUTTON')return;
  if(!el.hasAttribute('tabindex'))el.tabIndex=0;
  if(!el.hasAttribute('role'))el.setAttribute('role','button');
  const visibleText=String(el.textContent||'').replace(/\s+/g,' ').trim();
  if(visibleText)el.setAttribute('aria-label',visibleText+' — Bild öffnen');
});}
let workLimit=8, workFilter='all';
function renderWorks(f,limit,now){
  const grid=document.getElementById('workgrid');if(!grid)return;
  /* v8.1: Filterwechsel = kurze Aus-Phase (CSS .is-swapping, 160 ms), dann Neuaufbau; die neuen Karten
     staggern über motion.js refreshWorks() wieder ein. "Mehr laden" (gleicher Filter) hängt nur an. */
  if(!now&&grid.children.length&&(f||'all')!==workFilter){
    grid.style.minHeight=grid.offsetHeight+'px';grid.classList.add('is-swapping');
    setTimeout(()=>{grid.classList.remove('is-swapping');renderWorks(f,limit,true);setTimeout(()=>{grid.style.minHeight='';},420);},170);return;}
  f=f||'all';workFilter=f; workLimit=limit;
  const all=f==='all'?WORKS:WORKS.filter(w=>(w.g||[]).includes(f));
  const list=all.slice(0,limit);
  grid.innerHTML=list.length?list.map(w=>{const svc=(typeof SVC!=='undefined'?SVC:[]).find(s=>s.k===(w.g||[])[0]);
    return `<article class="work" data-work="${workId(w)}" role="button" tabindex="0" aria-label="${w.t} — ${w.loc}, Bild öffnen">${lz(w.img,w.t+' — '+w.loc)}
    <span class="plus" aria-hidden="true">→</span><div class="cap">${svc?`<b class="tag">${svc.t}</b>`:''}<h3>${w.t}</h3><span>${w.loc}</span></div></article>`;}).join('')
    :`<div class="emptyworks">Für dieses Gewerk sind noch keine Bilder hinterlegt.</div>`;
  const btn=document.getElementById('moreworks');
  if(btn)btn.style.display=all.length>limit?'inline-flex':'none';
}
/* v8.2 «Hinter Glas» (Variante C, exakt wie im Konzept-Board): Kopf eines Bogens (Kicker/H2/Lead/CTA) liegt
   direkt auf der abgedunkelten Wohnung, nur der Körper (Filter+Galerie, Rechner, Timeline, Formular …) sitzt
   auf einer Graphitplatte .w-glass. Statt sechs Templates umzubauen wird der Bogen nach dem Render einmal
   umgehängt: alles nach dem Kopfblock wandert in .w-glass. */
function glassify(root){
  root.querySelectorAll('.w-sheet').forEach(sh=>{
    if(sh.querySelector('.w-glass'))return;
    const wrap=sh.querySelector('.w-paper .wrap')||sh.querySelector('.w-paper');if(!wrap)return;
    const kids=[...wrap.children];if(!kids.length)return;
    const isHead=el=>el.classList.contains('sec-head')||!!el.querySelector(':scope > .sec-head')||el.classList.contains('w-kicker')||/^H[1-3]$/.test(el.tagName);
    /* Grid-/Flex-Container (Fallstudie .w-cards, Anfrage .contact): Kinder nicht umhängen (bricht die Spalten),
       sondern der Container selbst wird zur Platte. */
    const disp=getComputedStyle(wrap).display;
    if(disp==='grid'||disp==='flex'){wrap.classList.add('w-glass','w-glass--self');return;}
    let i=0;while(i<kids.length&&isHead(kids[i]))i++;
    const body=kids.slice(i);if(!body.length)return;
    const g=document.createElement('div');g.className='w-glass';body[0].before(g);body.forEach(el=>g.appendChild(el));
  });
}
/* v8.1 — Lösungen: Segment-Control ("Ich bin …") schaltet ein Panel um. Zustandswechsel ist choreografiert
   (Vorgabe 2): Indikator gleitet (CSS transition), altes Panel blendet 220 ms aus, neues staggert ein. Tastatur:
   Pfeiltasten wie ein natives Tablist. */
function initSegments(){
  const ctl=document.getElementById('segCtl'),host=document.getElementById('segPanels');if(!ctl||!host)return;
  const btns=[...ctl.querySelectorAll('.seg-btn')],panels=[...host.querySelectorAll('.seg-panel')],ind=ctl.querySelector('.seg-ind');
  let cur=0,busy=false;
  const place=()=>{const b=btns[cur];if(!b||!ind)return;ind.style.left=b.offsetLeft+'px';ind.style.width=b.offsetWidth+'px';};
  const go=i=>{if(i===cur||busy||!panels[i])return;busy=true;const from=panels[cur],to=panels[i];cur=i;
    btns.forEach((b,k)=>{b.classList.toggle('on',k===i);b.setAttribute('aria-selected',k===i?'true':'false');});place();
    from.classList.add('is-out');
    setTimeout(()=>{from.classList.remove('is-out');from.hidden=true;to.hidden=false;to.classList.add('is-in');
      if(window.ScrollTrigger)ScrollTrigger.refresh();
      setTimeout(()=>{to.classList.remove('is-in');busy=false;},560);},220);};
  ctl.addEventListener('click',e=>{const b=e.target.closest('.seg-btn');if(b)go(+b.dataset.seg);});
  ctl.addEventListener('keydown',e=>{if(e.key!=='ArrowRight'&&e.key!=='ArrowLeft')return;e.preventDefault();const n=(cur+(e.key==='ArrowRight'?1:-1)+btns.length)%btns.length;go(n);btns[n].focus();});
  requestAnimationFrame(place);addEventListener('resize',place,{passive:true});
  /* Vorwahl per ?seg= / data-who aus dem Formular ist nicht nötig — Panels sind alle vorhanden, Deep-Link geht auf /loesungen/:slug */
}
/* v8.1 — Leistungen: sticky Rail markiert die Zeile, die gerade im Blick ist */
function initSvcRail(){
  const rail=document.querySelector('.svc-rail-list');if(!rail||!('IntersectionObserver' in window))return;
  const links=[...rail.querySelectorAll('a')],rows=[...document.querySelectorAll('.svc-row')];
  const io=new IntersectionObserver(es=>{es.forEach(en=>{if(!en.isIntersecting)return;const id=en.target.id;links.forEach(a=>a.classList.toggle('on',a.dataset.scroll===id));});},{rootMargin:'-35% 0px -55% 0px'});
  rows.forEach(r=>io.observe(r));
}
/* Tabs + Grid initialisieren, wo #workgrid existiert: Home (8), Referenzen (100, kein "Mehr"),
   leistungen/:slug (Vorfilter aus #workgrid[data-filter], 8). #tabs ist optional. */
function initTabs(route){
  const grid=document.getElementById('workgrid');if(!grid)return;
  const bar=document.getElementById('tabs');
  const base=route&&route.name==='referenzen'?100:8;
  let f=grid.dataset.filter||'all';
  if(bar){
    const pre=bar.querySelector('.tab[data-f="'+f+'"]');
    if(pre){bar.querySelectorAll('.tab').forEach(t=>t.classList.remove('on'));pre.classList.add('on');}
    else{const on=bar.querySelector('.tab.on');if(on&&on.dataset.f)f=on.dataset.f;}
    bar.addEventListener('click',e=>{
      const b=e.target.closest('.tab');if(!b)return;
      bar.querySelectorAll('.tab').forEach(t=>t.classList.remove('on'));
      b.classList.add('on');renderWorks(b.dataset.f,base);
    });
  }
  renderWorks(f,base);
  const more=document.getElementById('moreworks');
  if(more)more.addEventListener('click',()=>renderWorks(workFilter,workLimit+8));
}
function initMagnet(){
  const b=document.getElementById('magbtn');if(!b)return;
  const form=b.closest('form'),draft=bindDraft(form,'magbtn','PDF anfordern');
  form.addEventListener('submit',e=>{
    e.preventDefault();if(draft.state.busy||b.disabled)return;
    const m=document.getElementById('magmail'),note=document.getElementById('magnote');
    const invalid=!/^\S+@\S+\.\S+$/.test(m.value.trim());m.setAttribute('aria-invalid',String(invalid));
    if(invalid){note.textContent='Bitte eine gültige E-Mail eingeben.';note.style.color='#b4331f';m.focus();return;}
    note.textContent='Wird gesendet …';note.style.color='var(--muted)';const sent=draft.begin();
    const adr=m.value.trim();
    sendLead({name:'Referenzmappe',email:adr,gewerk:'Referenzmappe PDF',nachricht:'Hat die Referenzmappe als PDF angefordert.'})
      .then(res=>{
        if(!draft.finish(res,sent))return;
        if(!res.ok){note.innerHTML='Konnte nicht gesendet werden. Bitte erneut versuchen oder direkt anrufen: <a href="tel:'+CO.phoneRaw+'" style="text-decoration:underline">'+CO.phone+'</a>';note.style.color='#b4331f';note.focus();return;}
        note.innerHTML='Anfrage gespeichert ('+esc(res.nr)+'). <a href="/downloads/baustern-referenzen-v1.pdf" download style="text-decoration:underline;font-weight:600">Referenzmappe jetzt herunterladen</a>';note.style.color='var(--brass-lo)';
        m.value='';m.disabled=true;b.disabled=true;b.style.opacity=.6;note.focus({preventScroll:true});
      });
  });
}

/* ===== Richtwert-Rechner (Home, #richtwert) =====
   API: initEstimate() — bindet Chips (role=radio, Pfeiltasten), Range + Zahl (synchron), CTA; no-op ohne #richtwert.
   Daten: RICHTWERTE (data.js). Mengenbereiche pro einheit; def = Startmenge, wenn die bisherige Menge ausserhalb liegt.
   CTA: window.PREFILL={gewerk,msg} setzen und go('kontakt'); bindForm() übernimmt PREFILL einmalig ins Formular. */
const EST_RANGE={auftrag:{min:1,max:10,step:1,def:1},zimmer:{min:1,max:12,step:1,def:1},m2:{min:10,max:400,step:5,def:20}};
const estimateUnit=(row,qty)=>qty===1?({Wohnungen:'Wohnung',Bäder:'Bad',Räume:'Raum',Wände:'Wand',Einsätze:'Einsatz',Küchen:'Küche'}[row.label]||row.label):row.label;
/* CHF-Format: Rundung auf 100 ab 1000, sonst auf 10; Tausendertrennzeichen ' (Schweiz) */
const chf=n=>{const r=n>=1000?Math.round(n/100)*100:Math.round(n/10)*10;return String(r).replace(/\B(?=(\d{3})+(?!\d))/g,"'");};
function initEstimate(){
  const sec=document.getElementById('richtwert');if(!sec||typeof RICHTWERTE==='undefined'||!RICHTWERTE.length)return;
  const $=id=>document.getElementById(id);
  const chips=[...sec.querySelectorAll('.chip[role="radio"]')],range=$('estRange'),num=$('estNum'),unit=$('estUnit'),mm=$('estMinMax'),
        title=$('estTitle'),qtyTxt=$('estQty'),outMin=$('estMin'),outMax=$('estMax'),sr=$('estSr'),note=$('estNote'),mat=$('estMat'),cta=$('estCta'),cb3=$('cbOpen3');
  if(!chips.length||!range||!num||!outMin||!outMax)return;
  const byKey=k=>RICHTWERTE.find(r=>r.k===k)||null;
  let cur=byKey(sec.dataset.default)||RICHTWERTE[0],qty=EST_RANGE[cur.einheit].def,tw=null;
  const shown={min:0,max:0};
  const anim=()=>!document.documentElement.classList.contains('no-gsap');
  const paint=()=>{outMin.textContent=chf(shown.min);outMax.textContent=chf(shown.max);};
  function update(dur){
    const R=EST_RANGE[cur.einheit];
    range.min=num.min=R.min;range.max=num.max=R.max;range.step=num.step=R.step;
    range.value=qty;num.value=qty;
    range.style.setProperty('--p',((qty-R.min)/(R.max-R.min)*100).toFixed(2)+'%');
    range.setAttribute('aria-label','Menge: '+cur.label);num.setAttribute('aria-label','Menge: '+cur.label);
    const unitLabel=estimateUnit(cur,qty);
    if(unit)unit.textContent=unitLabel;
    if(mm&&mm.children.length>1){mm.children[0].textContent=R.min;mm.children[1].textContent=R.max;}
    if(title)title.textContent=cur.t;if(qtyTxt)qtyTxt.textContent=qty+' '+unitLabel;
    range.setAttribute('aria-valuetext',qty+' '+unitLabel);
    if(note)note.textContent=cur.note;if(mat)mat.hidden=cur.material!==false;
    const min=cur.min*qty,max=cur.max*qty;
    if(sr)sr.textContent='CHF '+chf(min)+' – '+chf(max);
    if(tw){tw.kill();tw=null;}
    if(!dur||!anim()){shown.min=min;shown.max=max;paint();return;}
    tw=gsap.to(shown,{min,max,duration:dur,ease:'power2.out',onUpdate:paint,overwrite:true});
  }
  range.addEventListener('change',()=>trackEv('calc_use',{trade:cur.k,qty:+range.value,action:'qty'}));
  function select(r,focus){
    if(!r)return;cur=r;const R=EST_RANGE[r.einheit];trackEv('calc_use',{trade:r.k,action:'trade'});
    qty=(qty<R.min||qty>R.max)?R.def:Math.round((qty-R.min)/R.step)*R.step+R.min;   // Menge behalten, wenn im Bereich
    chips.forEach(c=>{const on=c.dataset.k===r.k;c.setAttribute('aria-checked',on?'true':'false');c.tabIndex=on?0:-1;if(on&&focus)c.focus();});
    update(.55);
  }
  chips.forEach((c,i)=>{
    c.addEventListener('click',()=>select(byKey(c.dataset.k),false));
    c.addEventListener('keydown',e=>{
      let j=null;
      if(e.key==='ArrowRight'||e.key==='ArrowDown')j=(i+1)%chips.length;
      else if(e.key==='ArrowLeft'||e.key==='ArrowUp')j=(i-1+chips.length)%chips.length;
      else if(e.key==='Home')j=0;else if(e.key==='End')j=chips.length-1;
      else if(e.key===' '||e.key==='Enter'){e.preventDefault();select(byKey(c.dataset.k),false);return;}
      if(j==null)return;e.preventDefault();select(byKey(chips[j].dataset.k),true);
    });
  });
  const setQty=(v,dur)=>{const R=EST_RANGE[cur.einheit];v=Number(v);if(isNaN(v))return;
    v=Math.min(R.max,Math.max(R.min,v));qty=Math.round((v-R.min)/R.step)*R.step+R.min;update(dur);};
  range.addEventListener('input',()=>setQty(range.value,.3));
  num.addEventListener('input',()=>{if(num.value!=='')setQty(num.value,.3);});
  num.addEventListener('change',()=>setQty(num.value===''?EST_RANGE[cur.einheit].def:num.value,0));
  if(cta)cta.addEventListener('click',()=>{
    window.PREFILL={gewerk:cur.gewerk,msg:'Richtwert-Anfrage: '+cur.t+' × '+qty+' '+estimateUnit(cur,qty)+' — Arbeit CHF '+chf(cur.min*qty)+'–'+chf(cur.max*qty)+', Material separat. Bitte um kostenlose Beratung und eine individuelle Festpreis-Offerte.'};
    go('kontakt');
  });
  if(cb3)cb3.addEventListener('click',()=>{const o=document.getElementById('cbOpen');if(o)o.click();});
  chips.forEach(c=>{const on=c.dataset.k===cur.k;c.setAttribute('aria-checked',on?'true':'false');c.tabIndex=on?0:-1;});
  update(0);
}
/* Sanftes Scrollen zu einer Sektion ohne Hash-Wechsel ([data-scroll="id"]); Nav-Abstand über CSS scroll-margin-top */
function scrollToId(id){
  const el=document.getElementById(id);if(!el)return false;
  // Anchors into compact mobile sections must reveal their target before measuring.
  for(let parent=el;parent;parent=parent.parentElement)if(parent.tagName==='DETAILS')parent.open=true;
  if(el.classList.contains('w-sheet')){const disclosure=el.querySelector(':scope > details');if(disclosure)disclosure.open=true;}
  const sm=parseFloat(getComputedStyle(el).scrollMarginTop)||0;   /* Nav-Abstand (CSS scroll-margin-top) auch mit Lenis */
  Smooth.to(el,{offset:-sm});
  return true;
}

function render(route,first){
  if(typeof route==='string')route=parseRoute('/'+goPath(route));
  const tpl=ROUTES[route.name]||ROUTES.home;
  view.querySelectorAll('form').forEach(form=>form.saveDraft?.());
  view.removeAttribute('data-prerender');   /* statischer Prerender-Inhalt (SEO/ohne JS) wird jetzt durch die App ersetzt */
  view.innerHTML=`<div class="page">${tpl(route.slug)+footer}</div>`;
  const page=view.querySelector('.page');setActive(route);setMeta(route);linkify(view);
  const h1=view.querySelector('h1');if(h1&&!first){h1.tabIndex=-1;h1.focus({preventScroll:true});}
  const cb2=document.getElementById('cbOpen2');if(cb2)cb2.addEventListener('click',()=>document.getElementById('cbOpen').click());
  glassify(view);initTabs(route);initMagnet();a11yWorks(view);initEstimate();initSegments();initSvcRail();   // no-ops, wenn die Elemente auf der Seite fehlen
  if(document.getElementById('formCard'))bindForm();   // Kontaktseite und Startseite (Blatt «Anfrage»)
  if(document.getElementById('jobFormCard'))bindKarriere();   // /karriere
  Smooth.to(0,{immediate:true});
  if(matchMedia('(prefers-reduced-motion:reduce)').matches)gsap.set(page,{opacity:1,y:0});
  else{gsap.set(page,{opacity:0,y:14});gsap.to(page,{opacity:1,y:0,duration:.5,ease:'power2.out',delay:first?0:.05});}
  current=route;window.__route=route;
  try{document.dispatchEvent(new CustomEvent('bs:route',{detail:route}));}catch(e){}   /* Analytics: page_view je Route */
  requestAnimationFrame(()=>{Motion.unmount();if(window.FX)FX.unmount();Motion.mount(route);if(window.Film)Film.auto(route);if(window.FX)FX.mount(view,document.documentElement.classList.contains('no-gsap')?'off':(Motion.mode()||'full'));syncNav();});
}
/* a[data-go] ohne href sind nicht fokussierbar -> echte Hash-Links nachrüsten (Klick läuft weiter über den delegierten Listener) */
function linkify(root){root.querySelectorAll('a[data-go]').forEach(a=>{const h=a.getAttribute('href');if(!h||/^#\//.test(h))a.setAttribute('href',routeUrl(goPath(a.dataset.go)));});}
linkify(document);
/* Skip-Link: darf den Hash-Router nicht auslösen (#view wäre eine Route) -> nur Fokus setzen */
const skipLnk=document.querySelector('a.skip');if(skipLnk)skipLnk.addEventListener('click',e=>{e.preventDefault();const v=document.getElementById('view');if(v){v.focus({preventScroll:false});}});
/* Curtain-Übergang + Render (≈ 0.9 s) */
function transition(route){
  animating=true;closeMobile();
  if(matchMedia('(prefers-reduced-motion:reduce)').matches){
    render(route,false);animating=false;
    if(pending){const p=pending;pending=null;if(routeKey(p)!==routeKey(current))transition(p);}
    return;
  }
  const tl=gsap.timeline({onComplete:()=>{animating=false;
    if(pending){const p=pending;pending=null;if(routeKey(p)!==routeKey(current))transition(p);}}});
  tl.set(curtain,{y:'100%'}).to(curtain,{y:'0%',duration:.38,ease:'power4.inOut'})
    .to(curtainMark,{opacity:1,y:0,duration:.25,ease:'power2.out'},'-=.15')
    .add(()=>render(route,false)).to(curtainMark,{opacity:0,y:-16,duration:.22,ease:'power2.in'},'+=.05')
    .to(curtain,{y:'-100%',duration:.42,ease:'power4.inOut'},'-=.05').set(curtain,{y:'100%'});
}
/* go('kontakt') / go('leistungen/sanitaer') / go('home') / go('ueber') -> pushState + Übergang; popstate (Zurück/Vor) rendert. */
function navigateTo(r){
  if(routeKey(r)===routeKey(current))return;
  if(window.Lightbox&&Lightbox.isOpen())Lightbox.close(true); // Back-Button bei offener Lightbox
  if(animating){pending=r;return;}
  transition(r);
}
function go(g){
  const path=goPath(g),target=parseRoute('/'+path);
  if(animating){closeMobile();return;}
  if(routeKey(target)===routeKey(current)){
    closeMobile();const card=document.getElementById('formCard');
    if(target.name==='kontakt'&&card){const message=card.querySelector('#i-msg');if(message&&!message.value.trim()&&window.PREFILL?.msg)message.value=window.PREFILL.msg;window.PREFILL=null;card.saveDraft?.();Smooth.to(card,{offset:-96});card.querySelector('input:not([type=hidden])')?.focus({preventScroll:true});}
    return;
  }
  try{history.pushState({path},'',routeUrl(path));}catch(e){location.href=routeUrl(path);return;}
  navigateTo(target);
}
addEventListener('popstate',()=>navigateTo(parseRoute(location.pathname)));
/* Alte #/-Links (Lesezeichen, externe Verweise): Hash-Änderung zur Laufzeit -> auf Pfad umschreiben */
addEventListener('hashchange',()=>{if(!/^#\//.test(location.hash))return;const path=location.hash.replace(/^#\/?/,'');try{history.replaceState({path},'',routeUrl(path));}catch(e){}navigateTo(parseRoute('/'+path));});
/* EIN delegierter Listener für alles Klickbare: [data-go] (Routen), [data-work] (Lightbox), [data-tab] (Situation -> Tab).
   Funktioniert damit auch in der Lightbox und in später dynamisch gerenderten Grids. */
const deeper=(a,b)=>!a?b:!b?a:(a.contains(b)?b:a); // bei Verschachtelung gewinnt das innere Element
document.addEventListener('click',e=>{
  if(e.defaultPrevented||e.button)return;
  const t=e.target instanceof Element?e.target:null;if(!t)return;
  const scEl=t.closest('[data-scroll]');   // In-Page-Sprung (z. B. FAQ -> #richtwert): scrollen, Hash unverändert lassen
  if(scEl){e.preventDefault();scrollToId(scEl.dataset.scroll);return;}
  const goEl=t.closest('[data-go]'),wkEl=t.closest('[data-work]'),tabEl=t.closest('[data-tab]');
  const el=deeper(deeper(goEl,wkEl),tabEl);if(!el)return;
  if(el.tagName==='A'){const h=el.getAttribute('href');
    if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;          // Neuer Tab/Fenster: echte Navigation auf die vorgerenderte Seite
    if(el.target&&el.target!=='_self'){if(el===goEl)logBlankLinkClick(el.dataset.go);return;}
    if(h&&h!=='#'&&!/^(\/|#\/)/.test(h))return;
    if(!h||h==='#'||/^(\/|#\/)/.test(h))e.preventDefault();}        // interne Routen-Links -> Router; echte hrefs (tel:, https:) bleiben
  if(el===goEl){
    /* Bugfix (Nielsen-Audit H3-01): Links mit target="_blank" (z. B. Datenschutzerklärung im
       Anfrage-Formular) sollen echt in einem neuen Tab öffnen, statt zusätzlich im aktuellen Tab
       per SPA-Routing #view neu zu rendern — sonst geht ein bereits ausgefülltes Formular verloren,
       nur weil daneben ein Link angeklickt wurde, der eigentlich nichts am aktuellen Tab ändern soll. */
    if(el.tagName==='A'&&el.target==='_blank'){logBlankLinkClick(el.dataset.go);return;}
    /* Bugfix (Nielsen-Audit H6-01): "Offerte anfragen"-Buttons auf Leistungs-/Lösungen-Detailseiten
       tragen optional data-svc bzw. data-who (siehe ctaBand() / hero-cta in js/pages.js) — Kontext
       vor dem Routenwechsel in window.PREFILL übernehmen, damit bindForm() das Kontaktformular mit
       dem passenden Gewerk bzw. Kundensegment vorbelegt, statt den Nutzer bei null anfangen zu lassen. */
    if(el.dataset.svc||el.dataset.who||el.dataset.message)window.PREFILL={gewerk:el.dataset.svc||'',who:el.dataset.who||'',msg:el.dataset.message||''};
    if(window.Lightbox&&Lightbox.isOpen())Lightbox.close(true);go(el.dataset.go);return;
  }
  if(el===wkEl){e.preventDefault();Lightbox.open(el.dataset.work,el);return;}
  if(el===tabEl)tabJump(el.dataset.tab);
});
/* Enter/Space auf fokussierten [data-work]-Karten (Buttons/Links lösen den Klick nativ aus) */
document.addEventListener('keydown',e=>{
  if(e.key!=='Enter'&&e.key!==' ')return;
  const t=e.target instanceof Element?e.target:null;if(!t)return;
  const el=t.closest('[data-work]');if(!el||el.tagName==='A'||el.tagName==='BUTTON')return;
  if(t!==el&&t.closest('a,button,input,textarea,select'))return;
  e.preventDefault();Lightbox.open(el.dataset.work,el);
});

const burger=document.getElementById('burger'),mob=document.getElementById('mobmenu');
const mobFocus=()=>[...mob.querySelectorAll('a[href],button:not([disabled])')];
/* Isolate siblings along the ancestor chain, preserving their prior inert state. */
function isolateOverlay(allowed){
  const changed=[];
  function walk(root){[...root.children].forEach(el=>{
    if(allowed.includes(el))return;
    if(allowed.some(a=>el.contains(a)))walk(el);
    else if(!/^(SCRIPT|STYLE|LINK)$/.test(el.tagName)){changed.push([el,el.inert]);el.inert=true;}
  });}
  walk(document.body);
  return ()=>changed.forEach(([el,inert])=>{el.inert=inert;});
}
function stepFocus(e,elements){
  if(e.key!=='Tab')return;
  const list=elements.filter(el=>!el.disabled&&el.getClientRects().length&&!el.closest('[inert]'));
  if(!list.length)return;
  e.preventDefault();const i=list.indexOf(document.activeElement);
  list[i<0?(e.shiftKey?list.length-1:0):(i+(e.shiftKey?-1:1)+list.length)%list.length].focus();
}
let releaseMenu=null;
function setMobile(open){
  if(open&&!releaseMenu){releaseMenu=isolateOverlay([mob,burger]);Smooth.stop();}
  if(!open&&releaseMenu){releaseMenu();releaseMenu=null;Smooth.start();}
  burger.classList.toggle('x',open);mob.classList.toggle('open',open);document.body.classList.toggle('mob-open',open);
  burger.setAttribute('aria-expanded',open?'true':'false');mob.setAttribute('aria-hidden',open?'false':'true');mob.inert=!open;
}
function closeMobile(){setMobile(false);}
setMobile(false);
burger.addEventListener('click',()=>{const o=!mob.classList.contains('open');setMobile(o);if(o)setTimeout(()=>mobFocus()[0]?.focus(),30);});
addEventListener('keydown',e=>{if(e.key==='Escape'&&mob.classList.contains('open')){closeMobile();burger.focus();}});
document.addEventListener('keydown',e=>{if(mob.classList.contains('open'))stepFocus(e,[burger,...mobFocus()]);});
document.addEventListener('focusin',e=>{if(mob.classList.contains('open')&&!mob.contains(e.target)&&e.target!==burger)mobFocus()[0]?.focus();});
const readbar=document.getElementById('readbar');
function syncNav(){
  const solid=scrollY>40;nav.classList.toggle('solid',solid);
  const W=document.getElementById('wohnung');   // Startseite v6: Film liegt unter der ganzen Seite, Blätter decken ihn ab (film.js setzt is-covered)
  const overFilm=!!W&&!W.classList.contains('is-plain')&&!W.classList.contains('is-covered')&&(W.classList.contains('is-full')||W.classList.contains('is-lite'));
  nav.classList.toggle('overhero',(!solid&&(!!document.getElementById('hero')||!!W))||overFilm);
  nav.classList.toggle('overfilm',solid&&overFilm);
}
addEventListener('scroll',()=>{
  syncNav();
  const max=document.body.scrollHeight-innerHeight;
  if(readbar){readbar.style.width='100%';readbar.style.transformOrigin='left';readbar.style.transform='scaleX('+(max>0?scrollY/max:0)+')';}
},{passive:true});

/* cursor */
const cur=document.getElementById('cur');
if(!matchMedia('(hover:none)').matches){
  addEventListener('mousemove',e=>gsap.to(cur,{x:e.clientX,y:e.clientY,duration:.25,ease:'power2.out'}));
  document.addEventListener('mouseover',e=>{if(e.target.closest('a,button,[data-go],[data-work],.work,.tab,.ba,.case-cell'))cur.classList.add('big');else cur.classList.remove('big');});
}

const LEAD_URL='https://n8n.baucrm.net/webhook/web-anfrage';
/* Klick-Log fuer target="_blank"-data-go-Links (aktuell nur die Datenschutzerklaerung im Kontaktformular,
   siehe #i-priv weiter unten) — rein informativ, blockiert nichts und wirft nie einen sichtbaren Fehler.
   Beantwortet die offene Frage aus dem Nielsen-Audit (Abschnitt 9): wie oft wird der Link vor der
   Zustimmung tatsaechlich angeklickt, um die P0-Priorisierung von H3-01 rueckwirkend zu pruefen. */
const KLICK_LOG_URL='https://n8n.baucrm.net/webhook/datenschutz-klick';
function logBlankLinkClick(quelle){
  try{
    if(typeof fetch!=='function')return;
    fetch(KLICK_LOG_URL,{method:'POST',keepalive:true,headers:{'Content-Type':'application/json'},body:JSON.stringify({quelle:quelle||'unbekannt'})}).catch(()=>{});
  }catch(e){/* nie blockieren, nie sichtbar fehlschlagen */}
}
function leadKontext(){
  const q=new URLSearchParams(location.search),o={};
  ['utm_source','utm_campaign','utm_term','gclid'].forEach(k=>{const v=q.get(k);if(v)o[k]=v;});
  /* Kampagne über SPA-Wechsel behalten, ohne Kontaktdaten im Browser abzulegen. */
  try{const saved=JSON.parse(sessionStorage.getItem('bs_campaign')||'{}');Object.assign(saved,o);sessionStorage.setItem('bs_campaign',JSON.stringify(saved));Object.assign(o,saved);}catch(e){}
  o.seite=location.pathname+location.hash;
  return o;
}
/* Formulartyp für Analytics aus dem Lead-Inhalt (alle Wege laufen über sendLead) */
const leadForm=d=>{const g=String(d&&d.gewerk||'');return g==='Rückruf'?'rueckruf':/^Referenzmappe/.test(g)?'referenzmappe':/^Bewerbung/.test(g)?'karriere':'anfrage';};
leadKontext();
const leadAttempts=new Map();
async function sendLead(daten){
  const payload=Object.assign(leadKontext(),daten,{form:leadForm(daten)}),raw=JSON.stringify(payload);
  let hash='';
  if(window.crypto?.subtle){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(raw));hash=Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');}
  else{let h=2166136261;for(let i=0;i<raw.length;i++)h=Math.imul(h^raw.charCodeAt(i),16777619);hash=(h>>>0).toString(16)+'-'+raw.length;}
  let requestId=leadAttempts.get(hash);
  try{const saved=JSON.parse(sessionStorage.getItem('bs_lead_attempt')||'null');if(saved?.hash===hash&&Date.now()-saved.at<86400000)requestId=saved.id;}catch(e){}
  if(!requestId){const bytes=crypto.getRandomValues(new Uint8Array(16));bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;requestId=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('').replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/,'$1-$2-$3-$4-$5');}
  leadAttempts.set(hash,requestId);try{sessionStorage.setItem('bs_lead_attempt',JSON.stringify({hash,id:requestId,at:Date.now()}));}catch(e){}
  payload.request_id=requestId;
  const ctrl=new AbortController(),t=setTimeout(()=>ctrl.abort(),22000);
  try{
    const r=await fetch(LEAD_URL,{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify(payload),signal:ctrl.signal});
    if(!r.ok)throw new Error('HTTP '+r.status);
    const j=await r.json();
    if(j?.ok!==true||typeof j.nr!=='string'||!j.nr.trim())throw new Error(j?.error||'Keine bestätigte CRM-Referenz');
    leadAttempts.delete(hash);try{const saved=JSON.parse(sessionStorage.getItem('bs_lead_attempt')||'null');if(saved?.id===requestId)sessionStorage.removeItem('bs_lead_attempt');}catch(e){}
    trackEv('generate_lead',{form:leadForm(daten),gewerk:String(daten.gewerk||'').slice(0,40)});
    return {ok:true,nr:j.nr};
  }catch(e){trackEv('form_error',{form:leadForm(daten),reason:'send',message:String(e&&e.message||e).slice(0,80)});return {ok:false,error:String(e&&e.message||e)};}
  finally{clearTimeout(t);}
}
/* Foto-Upload (Task 4): client-seitig auf max. 1600px Kante + JPEG q0.72 komprimieren, bevor es als
   Base64 im JSON-Body an sendLead() geht — sonst waeren 3 Handyfotos oft schon 15-30 MB roh. */
function shrinkPhoto(file,max=1600){
  return new Promise((resolve,reject)=>{
    const img=new Image();
    const url=URL.createObjectURL(file);
    img.onload=()=>{
      URL.revokeObjectURL(url);
      const sc=Math.min(1,max/Math.max(img.width,img.height));
      const w=Math.max(1,Math.round(img.width*sc)),h=Math.max(1,Math.round(img.height*sc));
      const cv=document.createElement('canvas');cv.width=w;cv.height=h;
      const ctx=cv.getContext('2d');ctx.drawImage(img,0,0,w,h);
      resolve(cv.toDataURL('image/jpeg',0.72));
    };
    img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Bild konnte nicht gelesen werden'));};
    img.src=url;
  });
}
/* Drafts live only in this tab's memory. Async responses never replace a different form instance. */
const formDrafts=new Map();
const validPhone=value=>{const v=String(value||'').trim(),n=v.replace(/\D/g,'');return /^\+?[\d\s().-]+$/.test(v)&&n.length>=9&&n.length<=15;};
const normalizedPhone=value=>String(value||'').trim().replace(/[\s().-]/g,'');
function bindDraft(card,buttonId,label){
  let state=formDrafts.get(card.id);
  if(!state){state={values:{},photos:[],file:null,who:'',busy:false};formDrafts.set(card.id,state);}
  const signature=()=>JSON.stringify([state.values,state.who,state.photos.map(p=>[p.titel,p.daten.length]),state.file&&[state.file.titel,state.file.daten.length]]);
  const fields=()=>[...card.querySelectorAll('input:not([type=file]),textarea,select')];
  fields().forEach(el=>{if(Object.prototype.hasOwnProperty.call(state.values,el.id)){if(el.type==='checkbox')el.checked=state.values[el.id];else el.value=state.values[el.id];}});
  const save=()=>{if(!card.isConnected)return;fields().forEach(el=>{state.values[el.id]=el.type==='checkbox'?el.checked:el.value;});state.sync?.();};
  card.saveDraft=save;card.addEventListener('input',save);card.addEventListener('change',save);
  const button=card.querySelector('#'+buttonId);
  const sync=()=>{const confirmed=state.confirmed===signature();button.disabled=state.busy||confirmed;button.firstChild.textContent=state.busy?'Wird gesendet ':confirmed?'Bereits gesendet ':label+' ';button.querySelector('span').textContent=state.busy?'…':confirmed?'✓':'→';card.setAttribute('aria-busy',String(state.busy));};
  state.sync=sync;sync();
  return {state,save,begin(){save();state.busy=true;sync();return signature();},finish(res,sent){
    save();state.busy=false;if(res.ok)state.confirmed=sent;state.sync?.();
    const same=card.isConnected&&signature()===sent;
    if(res.ok&&same){state.values={};state.photos=[];state.file=null;state.who='';card.saveDraft=null;}
    if(!same){
      let notice=document.getElementById('leadNotice');
      if(!notice){notice=document.createElement('aside');notice.id='leadNotice';notice.className='lead-notice';notice.innerHTML='<p role="status" aria-live="polite"></p><button type="button" aria-label="Meldung schliessen">×</button>';notice.querySelector('button').onclick=()=>notice.remove();document.body.appendChild(notice);}
      notice.querySelector('p').textContent=res.ok?'Ihre zuvor gesendete '+(card.id==='jobFormCard'?'Bewerbung':'Anfrage')+' ist erfasst. Referenz: '+res.nr+'. Ihr aktueller Entwurf bleibt erhalten.':'Die vorherige Anfrage konnte nicht bestätigt werden. Ihr Entwurf bleibt erhalten. Bitte versuchen Sie es erneut oder rufen Sie '+CO.phone+' an.';
    }
    return same;
  }};
}
function bindFotoUpload(photos=[],onChange=()=>{}){
  const addBtn=document.getElementById('fotoAdd'),input=document.getElementById('i-fotos'),
    list=document.getElementById('fotoList'),err=document.getElementById('e-foto');
  if(!addBtn||!input)return [];
  const MAXN=3,MAXBYTES=10*1024*1024;
  const render=()=>{
    list.innerHTML=photos.map((p,i)=>`<span class="foto-chip"><img src="${p.daten}" alt=""><b>${esc(p.titel.slice(0,22))}</b><button type="button" class="foto-rm" data-i="${i}" aria-label="Foto entfernen">${ic.x}</button></span>`).join('');
    list.querySelectorAll('.foto-rm').forEach(b=>b.addEventListener('click',()=>{photos.splice(+b.dataset.i,1);render();}));
    addBtn.style.display=photos.length>=MAXN?'none':'';
    onChange();
  };
  addBtn.addEventListener('click',()=>input.click());
  input.addEventListener('change',async()=>{
    if(photos.pending)return;
    const chosen=[...input.files],files=chosen.slice(0,MAXN-photos.length);
    input.value='';
    photos.pending=true;addBtn.disabled=true;
    const errors=chosen.length>files.length?['Maximal 3 Fotos. '+(chosen.length-files.length)+' zusätzliche Datei(en) wurden nicht übernommen.']:[];
    for(const f of files){
      if(f.size>MAXBYTES){errors.push(f.name+': grösser als 10 MB. Bitte eine kleinere Datei wählen.');continue;}
      if(!['image/jpeg','image/png','image/webp','image/avif'].includes(f.type)){errors.push(f.name+': bitte als JPEG, PNG, WebP oder AVIF exportieren.');continue;}
      try{const daten=await shrinkPhoto(f),mini=await shrinkPhoto(f,240);photos.push({titel:f.name||'Foto',daten,mini});}catch(e){errors.push(f.name+': Bild konnte nicht gelesen werden. Bitte neu exportieren oder ein anderes Foto wählen.');}
    }
    err.textContent=errors.join(' ');err.style.display=errors.length?'block':'none';
    photos.pending=false;addBtn.disabled=false;
    render();
  });
  render();
  return photos;
}
function bindForm(){
  const card=document.getElementById('formCard'),draft=bindDraft(card,'submitBtn','Offerte anfragen'),state=draft.state;
  const $=id=>card.querySelector('#'+id);
  const who={val:state.who};
  const fotos=bindFotoUpload(state.photos,draft.save);
  /* Vorbelegung aus dem Richtwert-Rechner (window.PREFILL={gewerk,msg}) — einmalig, Payload-Struktur bleibt gleich.
     Erweitert um pf.who (Nielsen-Audit H6-01): Lösungen-Detailseiten übergeben statt eines Gewerks ein
     Kundensegment (siehe SOL_WHO in js/pages.js) — das entsprechende #who-Segment wird unten aktiviert,
     sobald die Buttons gebunden sind. */
  const pf=window.PREFILL;
  if(pf&&typeof pf==='object'){
    const svc=document.getElementById('i-svc'),msg=document.getElementById('i-msg');
    if(svc&&pf.gewerk){const o=[...svc.options].find(o=>o.textContent.trim()===String(pf.gewerk).trim());if(o)o.selected=true;}
    if(msg&&pf.msg&&!msg.value.trim())msg.value=pf.msg;
  }
  const choices=[...card.querySelectorAll('#who button')];
  const choose=b=>{who.val=state.who=b.dataset.who;choices.forEach(x=>{const on=x===b;x.classList.toggle('on',on);x.setAttribute('aria-checked',String(on));x.tabIndex=on?0:-1;});$('e-who').style.display='none';$('who').setAttribute('aria-invalid','false');draft.save();};
  choices.forEach((b,i)=>{b.addEventListener('click',()=>choose(b));b.addEventListener('keydown',e=>{
    const delta={ArrowRight:1,ArrowDown:1,ArrowLeft:-1,ArrowUp:-1}[e.key];
    if(delta||e.key==='Home'||e.key==='End'){e.preventDefault();const next=choices[e.key==='Home'?0:e.key==='End'?choices.length-1:(i+delta+choices.length)%choices.length];choose(next);next.focus();}
  });});
  if(who.val){const selected=choices.find(b=>b.dataset.who===who.val);if(selected)choose(selected);}
  if(pf&&typeof pf==='object'&&pf.who){
    const btn=[...view.querySelectorAll('#who button')].find(b=>b.dataset.who===pf.who);
    if(btn)btn.click();
  }
  if(pf&&typeof pf==='object')window.PREFILL=null;
  card.addEventListener('submit',function(event){
    event.preventDefault();
    if(fotos.pending){document.getElementById('formStatus').textContent='Fotos werden vorbereitet. Bitte einen Moment warten.';return;}
    if($('submitBtn').disabled)return;let ok=true;const name=$('i-name'),phone=$('i-phone'),mail=$('i-mail'),priv=$('i-priv');
    let firstBad=null;const fail=(id,c)=>{const f=$(id);f.classList.toggle('err',c);f.querySelector('.msg').style.display=c?'block':'none';const inp=f.querySelector('input');if(inp)inp.setAttribute('aria-invalid',c?'true':'false');if(c){ok=false;if(!firstBad)firstBad=inp;}};
    if(!who.val){document.getElementById('e-who').style.display='block';ok=false;}
    $('who').setAttribute('aria-invalid',String(!who.val));
    fail('f-name',!name.value.trim());fail('f-phone',!validPhone(phone.value));fail('f-mail',!/^\S+@\S+\.\S+$/.test(mail.value.trim()));
    priv.setAttribute('aria-invalid',String(!priv.checked));
    if(!priv.checked){document.getElementById('e-priv').style.display='block';ok=false;}else document.getElementById('e-priv').style.display='none';
    if(!ok){trackEv('form_error',{form:'anfrage',reason:'validation',field:firstBad?firstBad.id||'':(!who.val?'who':'privacy')});const tgt=firstBad||(!who.val?document.querySelector('#who button'):null)||(!priv.checked?priv:null);if(tgt){tgt.focus({preventScroll:true});tgt.scrollIntoView({block:'center',behavior:'smooth'});}return;}
    const btn=$('submitBtn'),sent=draft.begin(),status=document.getElementById('formStatus');
    if(status)status.textContent='Ihre Anfrage wird gesendet.';
    $('e-send')?.remove();
    const fn=name.value.trim().split(' ')[0]||'';
    const svc=document.getElementById('i-svc'),msg=document.getElementById('i-msg'),firma=document.getElementById('i-firma'),hp=document.getElementById('i-hp');
    const v=id=>{const el=document.getElementById(id);return el?el.value.trim():'';};
    sendLead({
      name:name.value.trim(), telefon:normalizedPhone(phone.value), email:mail.value.trim(),
      kundentyp:who.val,firma:(firma&&firma.value.trim())||'',ort:v('i-plz'),objekt:v('i-obj'),zeitrahmen:v('i-when'),datenschutz:true,
      gewerk:(svc&&svc.value)||'Mehrere / noch unklar',
      nachricht:[(msg&&msg.value.trim())||'', 'Kundentyp: '+who.val, (firma&&firma.value.trim())?'Firma: '+firma.value.trim():'',
        v('i-obj')?'Objekt: '+v('i-obj'):'', v('i-when')?'Zeitrahmen: '+v('i-when'):'', v('i-plz')?'Ort: '+v('i-plz'):''].filter(Boolean).join('\n'),
      webseite:(hp&&hp.value)||'',
      fotos:fotos.length?fotos.map(p=>({titel:p.titel,daten:p.daten,mini:p.mini})):undefined
    }).then(res=>{
      if(!draft.finish(res,sent))return;
      /* Screen-Reader-Fix: async Erfolg/Fehler nach dem Absenden wurde bisher nur visuell angezeigt —
         ohne Fokusverschiebung oder Live-Region liest kein Screenreader das Ergebnis automatisch vor
         (WCAG 4.1.3, "Status Messages"). #formStatus liegt AUSSERHALB von #formCard (siehe contactForm()
         in pages.js), damit es das innerHTML-Ersetzen unten übersteht. */
      if(res.ok){
        const refTxt=res.nr?' — Referenz '+res.nr:'';
        card.innerHTML=`<div class="sent"><div class="ok">${ic.check}</div><h3 class="disp" tabindex="-1">Anfrage erfasst.</h3><p>Vielen Dank${fn?', '+esc(fn):''}. Wir melden uns innert 24 Stunden (Werktage) bei Ihnen${res.nr?' — Referenz <b>'+esc(res.nr)+'</b>':''}.</p><div style="font-size:13px;color:var(--muted)">Ihre Anfrage ist gespeichert. Bitte bewahren Sie die Referenz für Rückfragen auf.</div></div>`;
        if(status)status.textContent='Anfrage erfasst. Vielen Dank'+(fn?', '+fn:'')+'. Wir melden uns innert 24 Stunden (Werktage) bei Ihnen'+refTxt+'.';
        const h=card.querySelector('h3');if(h)h.focus({preventScroll:true});
      }else{
        btn.disabled=false;btn.querySelector('span').textContent='→';btn.firstChild.textContent='Offerte anfragen ';
        let er=$('e-send');
        if(!er){er=document.createElement('div');er.id='e-send';er.className='msg';er.style.cssText='display:block;margin-top:14px';er.setAttribute('tabindex','-1');btn.parentNode.appendChild(er);}
        er.innerHTML='Das Senden hat nicht geklappt. Bitte rufen Sie uns an: <a href="tel:'+CO.phoneRaw+'" style="text-decoration:underline">'+CO.phone+'</a>';
        if(status)status.textContent='Das Senden hat nicht geklappt. Bitte rufen Sie uns an: '+CO.phone+'.';
        er.focus({preventScroll:true});
      }
    });
  });
}

/* Liest eine Datei (Bild ODER PDF) als data:-URL ein. Bilder werden dabei NICHT verkleinert (anders als
   shrinkPhoto() beim Kontaktformular) — ein Lebenslauf-Scan soll lesbar bleiben; dafür ist die Grenze
   hier strenger (8 statt 10 MB) und es gibt nur eine Datei statt drei. */
function readFileAsDataUrl(file){
  return new Promise((resolve,reject)=>{
    const r=new FileReader();
    r.onload=()=>resolve(String(r.result||''));
    r.onerror=()=>reject(new Error('Datei konnte nicht gelesen werden'));
    r.readAsDataURL(file);
  });
}
function bindKarriere(){
  const card=document.getElementById('jobFormCard'),draft=bindDraft(card,'jobSubmitBtn','Bewerbung senden'),state=draft.state;
  const status=card.querySelector('#jobStatus');
  const roleSel=document.getElementById('j-role');
  view.querySelectorAll('.job-apply').forEach(b=>b.addEventListener('click',()=>{
    if(roleSel)roleSel.value=b.dataset.role;
    const card=document.getElementById('jobFormCard');
    if(card)card.scrollIntoView({block:'center',behavior:'smooth'});
    const first=document.getElementById('j-name');if(first)first.focus({preventScroll:true});
  }));
  const addBtn=document.getElementById('jobFileAdd'),input=document.getElementById('j-file'),
    list=document.getElementById('jobFileList'),err=document.getElementById('j-e-file');
  let file=state.file,filePending=false;
  const renderFile=()=>{
    list.innerHTML=file?`<span class="foto-chip"><b>${esc(file.titel.slice(0,26))}</b><button type="button" class="foto-rm" aria-label="Datei entfernen">${ic.x}</button></span>`:'';
    list.querySelector('.foto-rm')?.addEventListener('click',()=>{file=state.file=null;renderFile();addBtn.focus();});
    addBtn.style.display=file?'none':'';
    draft.save();
  };
  renderFile();
  if(addBtn&&input){
    addBtn.addEventListener('click',()=>input.click());
    input.addEventListener('change',async()=>{
      if(filePending)return;
      const f=input.files&&input.files[0];input.value='';
      if(!f)return;
      if(f.size>8*1024*1024||!['application/pdf','image/jpeg','image/png','image/webp'].includes(f.type)){err.textContent=f.name+(f.size>8*1024*1024?': grösser als 8 MB. Bitte eine kleinere Datei wählen.':': bitte PDF, JPEG, PNG oder WebP wählen.');err.style.display='block';return;}
      filePending=true;addBtn.disabled=true;
      try{file=state.file={titel:f.name||'Bewerbungsunterlage',daten:await readFileAsDataUrl(f),mini:f.type.startsWith('image/')?await shrinkPhoto(f,240):''};err.style.display='none';}
      catch(e){err.textContent=f.name+': Datei konnte nicht gelesen werden. Bitte neu exportieren und erneut wählen.';err.style.display='block';return;}
      finally{filePending=false;addBtn.disabled=false;}
      renderFile();
    });
  }
  card.addEventListener('submit',function(event){
    event.preventDefault();
    if(filePending){err.textContent='Datei wird vorbereitet. Bitte einen Moment warten.';err.style.display='block';return;}
    if(card.querySelector('#jobSubmitBtn').disabled)return;
    const name=document.getElementById('j-name'),phone=document.getElementById('j-phone');
    let ok=true;const fail=(id,c)=>{const f=document.getElementById(id);f.classList.toggle('err',c);f.querySelector('.msg').style.display=c?'block':'none';f.querySelector('input').setAttribute('aria-invalid',String(c));if(c)ok=false;};
    card.querySelector('#jm-phone').textContent=phone.value.trim()?'Bitte eine gültige Nummer eingeben, z. B. +41 79 123 45 67.':'Bitte Ihre Telefonnummer eingeben.';
    fail('jf-name',!name.value.trim());fail('jf-phone',!validPhone(phone.value));
    if(!ok){(!name.value.trim()?name:phone).focus({preventScroll:true});return;}
    const btn=card.querySelector('#jobSubmitBtn'),sent=draft.begin();
    status.textContent='Ihre Bewerbung wird gesendet.';card.querySelector('#j-e-send')?.remove();
    const role=(document.getElementById('j-role')||{}).value||'Initiativbewerbung';
    const exp=(document.getElementById('j-exp')||{}).value||'';
    const hp=document.getElementById('j-hp');
    sendLead({
      name:name.value.trim(), telefon:normalizedPhone(phone.value),
      gewerk:'Bewerbung: '+role,
      nachricht:['Bewerbung für: '+role, exp?'Berufserfahrung: '+exp:''].filter(Boolean).join('\n'),
      webseite:(hp&&hp.value)||'',
      fotos:file?[{titel:file.titel,daten:file.daten,mini:file.mini}]:undefined
    }).then(res=>{
      if(!draft.finish(res,sent))return;
      if(res.ok){
        card.innerHTML=`<div class="sent"><div class="ok">${ic.check}</div><h3 class="disp" tabindex="-1">Bewerbung erhalten.</h3><p>Danke${name.value.trim()?', '+esc(name.value.trim().split(' ')[0]):''}. Wir melden uns innert einiger Werktage bei Ihnen. Referenz: ${esc(res.nr)}.</p></div>`;
        card.querySelector('h3').focus({preventScroll:true});
      }else{
        btn.disabled=false;btn.querySelector('span').textContent='→';btn.firstChild.textContent='Bewerbung senden ';
        let er=card.querySelector('#j-e-send');
        if(!er){er=document.createElement('div');er.id='j-e-send';er.className='msg';er.style.cssText='display:block;margin-top:14px';er.tabIndex=-1;btn.parentNode.appendChild(er);}
        er.innerHTML='Das Senden hat nicht geklappt. Bitte rufen Sie uns an: <a href="tel:'+CO.phoneRaw+'" style="text-decoration:underline">'+CO.phone+'</a>';
        status.textContent='Das Senden hat nicht geklappt. Ihre Eingaben bleiben erhalten. Bitte erneut versuchen oder anrufen: '+CO.phone+'.';er.focus({preventScroll:true});
      }
    });
  });
}

/* Rückruf-Modal */
/* VisualViewport follows the iOS keyboard even when layout viewport does not resize. */
(function(){
  if(!window.visualViewport)return;
  const update=()=>{const vv=visualViewport,focused=document.activeElement?.matches('input,textarea,select');
    const keyboard=!!focused&&vv.height<document.documentElement.clientHeight*.78;
    document.documentElement.classList.toggle('keyboard-open',keyboard);
    const wrap=document.getElementById('cbwrap');
    if(wrap){wrap.style.setProperty('--keyboard-height',keyboard?vv.height+'px':'100dvh');wrap.style.bottom=keyboard?Math.max(0,innerHeight-vv.height-vv.offsetTop)+'px':'';}
  };
  visualViewport.addEventListener('resize',update);visualViewport.addEventListener('scroll',update);document.addEventListener('focusin',update);document.addEventListener('focusout',()=>requestAnimationFrame(update));
})();
(function(){
  const wrap=document.getElementById('cbwrap'),open=document.getElementById('cbOpen'),close=document.getElementById('cbClose');
  const form=document.getElementById('cbForm'),ok=document.getElementById('cbOk'),ph=document.getElementById('cbPhone'),note=document.getElementById('cbNote');
  if(!wrap||!open)return;
  let trigger=null,releaseCallback=null,focusTimer=0;
  const focusables=()=>[...wrap.querySelectorAll('button:not([disabled]),a[href],input:not([disabled])')].filter(el=>el.getClientRects().length);
  const show=()=>{if(wrap.classList.contains('open'))return;closeMobile();trigger=document.activeElement;wrap.inert=false;releaseCallback=isolateOverlay([wrap]);Smooth.stop();wrap.classList.add('open');wrap.setAttribute('aria-hidden','false');focusTimer=setTimeout(()=>{if(wrap.classList.contains('open'))(form.style.display==='none'?ok.querySelector('h3'):ph).focus();},matchMedia('(prefers-reduced-motion:reduce)').matches?0:380);};
  const hide=()=>{if(!wrap.classList.contains('open'))return;clearTimeout(focusTimer);wrap.classList.remove('open');wrap.setAttribute('aria-hidden','true');wrap.inert=true;releaseCallback?.();releaseCallback=null;Smooth.start();if(trigger?.isConnected)trigger.focus();trigger=null;};
  open.addEventListener('click',show);close.addEventListener('click',hide);
  wrap.addEventListener('click',e=>{if(e.target===wrap)hide();});
  wrap.addEventListener('keydown',e=>{if(e.key==='Enter'&&document.activeElement===ph){e.preventDefault();document.getElementById('cbSend').click();return;}stepFocus(e,focusables());});
  document.addEventListener('focusin',e=>{if(wrap.classList.contains('open')&&!wrap.contains(e.target))close.focus();});
  addEventListener('keydown',e=>{if(e.key==='Escape'&&wrap.classList.contains('open')){e.preventDefault();hide();}});
  document.getElementById('cbSend').addEventListener('click',()=>{
    if(document.getElementById('cbSend').disabled)return;
    ph.setAttribute('aria-invalid',String(!validPhone(ph.value)));
    if(!validPhone(ph.value)){note.textContent='Bitte eine gültige Nummer eingeben, z.\u202fB. +41 79 123 45 67.';note.style.color='#b4331f';ph.focus();return;}
    const nummer=normalizedPhone(ph.value);const btn=document.getElementById('cbSend');
    btn.disabled=true;note.textContent='Wird gesendet …';note.style.color='var(--muted)';
    sendLead({name:'Rückruf-Wunsch',telefon:nummer,gewerk:'Rückruf',nachricht:'Rückruf in 5 Minuten angefordert über die Website.'})
      .then(res=>{
        btn.disabled=false;
        if(!res.ok){note.innerHTML='Konnte nicht gesendet werden. Ihre Nummer bleibt erhalten. Erneut versuchen oder direkt anrufen: <a href="tel:'+CO.phoneRaw+'" style="text-decoration:underline">'+CO.phone+'</a>';note.style.color='#b4331f';if(wrap.classList.contains('open'))note.focus();return;}
        form.style.display='none';ok.style.display='block';
        wrap.setAttribute('aria-labelledby','cbOkT');
        document.getElementById('cbOkP').textContent='Wir rufen '+nummer+' an, an Werktagen 07:00–18:00. Ausserhalb dieser Zeiten am nächsten Werktag. Referenz: '+res.nr+'.';
        if(wrap.classList.contains('open'))ok.querySelector('h3').focus({preventScroll:true});
      });
  });
})();

/* Situation -> Tab (H6), delegiert über [data-tab] */
function tabJump(f){
  const t=document.querySelector('.tab[data-f="'+f+'"]');if(!t)return;
  t.click();
  const sec=document.getElementById('works')||t.closest('section');
  if(sec)Smooth.to(sec,{offset:-80});
  t.classList.remove('flash');void t.offsetWidth;t.classList.add('flash');
}

/* ===== Lightbox (SPEC §5) =====
   API: Lightbox.open(id, triggerEl?) · Lightbox.close(immediate?) · Lightbox.isOpen() · Lightbox.next() · Lightbox.prev()
   Navigationsliste = sichtbare [data-work]-Elemente im DOM beim Öffnen (innerhalb desselben Grids/Abschnitts wie das
   ausgelöste Element, sonst global) — respektiert damit den aktiven Tab-Filter. Kein Hash-Wechsel. */
window.Lightbox=(function(){
  const lb=document.getElementById('lb');
  if(!lb)return {open(){},close(){},isOpen:()=>false,next(){},prev(){}};
  const $=s=>lb.querySelector(s);
  const panel=$('.lb-panel'),media=$('.lb-media'),img=$('#lbImg'),thumbs=$('#lbThumbs'),count=$('#lbCount'),
        title=$('#lbT'),loc=$('#lbLoc'),tags=$('#lbTags'),desc=$('#lbDesc'),btns=$('#lbBtns'),
        prevB=$('#lbPrev'),nextB=$('#lbNext'),closeB=$('#lbClose');
  let items=[],idx=0,opened=false,trigger=null,lockPad=null,closing=false;
  const reduced=()=>matchMedia('(prefers-reduced-motion:reduce)').matches;
  const useGsap=()=>!document.documentElement.classList.contains('no-gsap')&&!reduced();
  const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const svcName=k=>{const s=(typeof SVC!=='undefined'?SVC:[]).find(x=>x.k===k);return s?s.t:k;};
  const visible=el=>!!(el.getClientRects().length)&&getComputedStyle(el).visibility!=='hidden';

  function listFrom(el){
    const scope=(el&&el.closest('[data-work-scope],#workgrid,.case-grid,.casebox,.gallery,section'))||document;
    const seen=new Set(),out=[];
    scope.querySelectorAll('[data-work]').forEach(n=>{
      const w=visible(n)?findWork(n.dataset.work):null;
      if(w&&!seen.has(w)){seen.add(w);out.push(w);}
    });
    return out;
  }
  function pics(w){return [w.img].concat(Array.isArray(w.imgs)?w.imgs:[]).filter(Boolean);}
  function setImg(src,alt){img.src=src;img.alt=alt;thumbs.querySelectorAll('.lb-th').forEach(b=>b.classList.toggle('on',b.dataset.src===src));}
  function preload(){
    if(items.length<2)return;
    [items[(idx+1)%items.length],items[(idx-1+items.length)%items.length]].forEach(w=>{const i=new Image();i.src=w.img;});
  }
  function fill(){
    const w=items[idx];if(!w)return;
    const alt=w.t+(w.loc?' — '+w.loc:'');
    const ps=pics(w);
    thumbs.innerHTML=ps.length>1?ps.map((p,i)=>`<button type="button" class="lb-th${i===0?' on':''}" data-src="${esc(p)}" aria-label="Bild ${i+1} von ${ps.length}"><img src="${esc(p)}" alt="" loading="lazy"></button>`).join(''):'';
    media.classList.toggle('has-thumbs',ps.length>1);
    setImg(w.img,alt);
    title.textContent=w.t||'';
    loc.textContent=w.loc||'';loc.hidden=!w.loc;
    tags.innerHTML=(w.g||[]).map(k=>`<span>${esc(svcName(k))}</span>`).join('');tags.hidden=!(w.g&&w.g.length);
    desc.textContent=w.text||'';desc.hidden=!w.text;
    btns.innerHTML=`<button type="button" class="btn btn-brass" data-go="kontakt">Offerte für ein ähnliches Projekt<span class="ic">→</span></button>`+
      (w.project?`<button type="button" class="btn btn-ghost" data-go="projekt/${esc(w.project)}">Zur Fallstudie<span class="ic">→</span></button>`:'');
    count.textContent=(idx+1)+' / '+items.length;
    const multi=items.length>1;prevB.hidden=!multi;nextB.hidden=!multi;
    preload();
  }
  function lock(){
    const sbw=innerWidth-document.documentElement.clientWidth;
    lockPad={body:document.body.style.paddingRight,nav:nav?nav.style.paddingRight:''};
    document.documentElement.style.overflow='hidden';Smooth.stop();
    if(sbw>0){document.body.style.paddingRight=sbw+'px';if(nav)nav.style.paddingRight=sbw+'px';}
  }
  function unlock(){
    document.documentElement.style.overflow='';Smooth.start();
    if(lockPad){document.body.style.paddingRight=lockPad.body;if(nav)nav.style.paddingRight=lockPad.nav;lockPad=null;}
  }
  const focusables=()=>[...lb.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter(el=>!el.hidden&&!el.disabled&&visible(el));
  function onKey(e){
    if(!opened)return;
    if(e.key==='Escape'){e.preventDefault();close();return;}
    if(e.key==='ArrowRight'){e.preventDefault();next();return;}
    if(e.key==='ArrowLeft'){e.preventDefault();prev();return;}
    if(e.key==='Tab'){
      const f=focusables();if(!f.length){e.preventDefault();return;}
      const first=f[0],last=f[f.length-1],a=document.activeElement;
      if(e.shiftKey&&(a===first||!lb.contains(a))){e.preventDefault();last.focus();}
      else if(!e.shiftKey&&(a===last||!lb.contains(a))){e.preventDefault();first.focus();}
    }
  }
  function onFocusIn(e){if(opened&&!lb.contains(e.target)){const f=focusables();(f[0]||lb).focus();}}
  /* Touch-Swipe (Pointer Events, Schwelle 40 px) */
  let px=null,py=null,swiped=false;
  panel.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;px=e.clientX;py=e.clientY;swiped=false;});
  panel.addEventListener('pointerup',e=>{
    if(px==null)return;const dx=e.clientX-px,dy=e.clientY-py;px=py=null;
    if(Math.abs(dx)>=40&&Math.abs(dx)>Math.abs(dy)*1.2){swiped=true;dx<0?next():prev();}
  });
  panel.addEventListener('pointercancel',()=>{px=py=null;});
  lb.addEventListener('click',e=>{
    if(swiped){swiped=false;e.stopPropagation();e.preventDefault();return;}
    // Backdrop = .lb-back sowie leere Flächen des Panels/Bildbereichs (Padding, Rand neben dem Bild)
    if(e.target.closest('[data-lb-close]')||e.target===panel||e.target===media||e.target.classList.contains('lb-stage')){close();return;}
    const th=e.target.closest('.lb-th');if(th){setImg(th.dataset.src,img.alt);return;}
    if(e.target.closest('#lbPrev')){prev();return;}
    if(e.target.closest('#lbNext')){next();return;}
  });
  function animateIn(){
    lb.classList.add('on');
    if(useGsap()){
      gsap.killTweensOf([lb,panel]);
      gsap.fromTo(lb,{opacity:0},{opacity:1,duration:.35,ease:'power2.out'});
      gsap.fromTo(panel,{y:16,opacity:0},{y:0,opacity:1,duration:.35,ease:'power3.out'});
      lb.classList.add('open');
    }else{void lb.offsetWidth;lb.classList.add('open');}
  }
  function animateOut(done,immediate){
    if(immediate||reduced()){lb.classList.remove('open');done();return;}
    if(useGsap()){
      gsap.killTweensOf([lb,panel]);
      gsap.to(panel,{y:10,opacity:0,duration:.28,ease:'power2.in'});
      gsap.to(lb,{opacity:0,duration:.35,ease:'power2.in',onComplete:done});
    }else{lb.classList.remove('open');setTimeout(done,360);}
  }
  function open(id,el){
    if(closing)return;
    const w=findWork(id);if(!w)return;
    const list=listFrom(el);items=list.length?list:[w];
    idx=Math.max(0,items.indexOf(w));
    trigger=(el&&el.focus)?el:(document.activeElement instanceof HTMLElement?document.activeElement:null);
    fill();
    if(!opened){opened=true;lock();lb.setAttribute('aria-hidden','false');document.addEventListener('keydown',onKey,true);document.addEventListener('focusin',onFocusIn);animateIn();}
    (closeB||lb).focus({preventScroll:true});
  }
  function close(immediate){
    if(!opened||closing)return;closing=true;
    const t=trigger;trigger=null;
    document.removeEventListener('keydown',onKey,true);document.removeEventListener('focusin',onFocusIn);
    animateOut(()=>{
      lb.classList.remove('on','open');lb.setAttribute('aria-hidden','true');
      if(useGsap()){gsap.set([lb,panel],{clearProps:'opacity,transform'});}
      unlock();opened=false;closing=false;items=[];
      if(t&&document.contains(t))t.focus({preventScroll:true});
    },immediate);
  }
  function next(){if(items.length<2)return;idx=(idx+1)%items.length;fill();}
  function prev(){if(items.length<2)return;idx=(idx-1+items.length)%items.length;fill();}
  return {open,close,next,prev,isOpen:()=>opened};
})();
/* nach oben (H3) */
const totop=document.getElementById('totop');
if(totop){totop.addEventListener('click',()=>Smooth.to(0));
  addEventListener('scroll',()=>totop.classList.toggle('on',scrollY>innerHeight*1.2),{passive:true});}
/* preloader */
const pre=document.getElementById('pre');
gsap.to('#pre .bar i',{width:'100%',duration:1.1,ease:'power2.inOut'});
function boot(){if(current)return;
  /* Alter #/-Hash beim Start (Lesezeichen/Backlink) -> Adresse ohne Neuladen auf den Pfad umschreiben */
  if(/^#\//.test(location.hash)){const path=location.hash.replace(/^#\/?/,'');try{history.replaceState({path},'',routeUrl(path));}catch(e){}}
  render(parseRoute(location.pathname),true);setTimeout(()=>{if(!document.documentElement.classList.contains('pre-hold'))pre.classList.add('gone');},1150);}   // film.js hält den Preloader bis zum ersten Kader (max. 1.8 s)
/* defer-Skript: DOM ist bereits vollständig geparst. Nicht auf window.load (alle Bilder/Fonts) warten —
   auf langsamen Mobilnetzen hielt das den Preloader mehrere Sekunden unnötig vor dem fertigen Hero. */
if(document.readyState==='loading')addEventListener('DOMContentLoaded',boot,{once:true});else boot();
setTimeout(()=>{if(!current)boot();},1600); // Fallback
addEventListener('resize',()=>ScrollTrigger.refresh());
