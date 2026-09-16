/* BauStern — Analytics (v9): dataLayer + GA4/GTM-Loader + Consent Mode v2 + Ereignis-Hooks.
   Konfiguration in js/data.js (ANALYTICS): ga4Id 'G-XXXXXXX' und/oder gtmId 'GTM-XXXXXXX'.
     - nur ga4Id : gtag.js wird direkt geladen, Ereignisse gehen per gtag('event', …) an GA4.
     - gtmId     : GTM wird geladen; alle Ereignisse landen NUR im dataLayer (GTM verteilt sie) —
                   ga4Id wird dann ignoriert, damit kein Ereignis doppelt gemessen wird.
     - beides leer: nichts wird geladen, der dataLayer wird trotzdem gefüllt (Debug: ANALYTICS.debug=true
                   loggt jedes Ereignis in die Konsole; window.dataLayer ist jederzeit inspizierbar).
   Datenschutz (nDSG/DSGVO): Consent Mode v2 startet mit allem auf "denied" -> GA4 setzt KEINE Cookies und
   sendet nur cookielose Pings (kein Nutzer-Tracking über Seiten hinweg, Modellierung durch Google). Sobald
   ein Cookie-Banner existiert, ruft es Analytics.consent({analytics:true}) auf — mehr ist nicht nötig.
   Ereignisse (alle mit page_path): page_view · cta_offerte · callback_open · generate_lead · form_error ·
   phone_click · whatsapp_click · email_click · calendly_click · gallery_open · gallery_filter ·
   segment_select · calc_use · tour_room · scroll_depth · outbound_click.
   Doppelte Ereignisse werden unterdrückt (gleicher Name + gleiche Parameter innerhalb von 800 ms). */
(function(){
  const CFG=Object.assign({ga4Id:'',gtmId:'',debug:false,anonymizeIp:true},(typeof ANALYTICS==='object'&&ANALYTICS)||{});
  const dl=window.dataLayer=window.dataLayer||[];
  function gtag(){dl.push(arguments);}
  window.gtag=window.gtag||gtag;
  const useGtm=!!CFG.gtmId,useGa=!useGtm&&!!CFG.ga4Id;
  const DNT=navigator.doNotTrack==='1'||window.doNotTrack==='1';
  /* ---- Consent Mode v2: Standard = alles verweigert (cookielos) ---- */
  gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',functionality_storage:'granted',security_storage:'granted',wait_for_update:0});
  let consentState={analytics:false,ads:false};
  function consent(o){o=o||{};consentState={analytics:!!o.analytics,ads:!!o.ads};
    gtag('consent','update',{analytics_storage:o.analytics?'granted':'denied',ad_storage:o.ads?'granted':'denied',ad_user_data:o.ads?'granted':'denied',ad_personalization:o.ads?'granted':'denied'});
    try{localStorage.setItem('bs_consent',JSON.stringify(consentState));}catch(e){}
    track('consent_update',{analytics:consentState.analytics?'granted':'denied',ads:consentState.ads?'granted':'denied'});}
  try{const saved=JSON.parse(localStorage.getItem('bs_consent')||'null');if(saved&&(saved.analytics||saved.ads)){consentState=saved;gtag('consent','update',{analytics_storage:saved.analytics?'granted':'denied',ad_storage:saved.ads?'granted':'denied',ad_user_data:saved.ads?'granted':'denied',ad_personalization:saved.ads?'granted':'denied'});}}catch(e){}
  /* ---- Loader ---- */
  let loaded=false;
  function load(){if(loaded||DNT||(!useGtm&&!useGa))return;loaded=true;
    if(useGtm){dl.push({'gtm.start':Date.now(),event:'gtm.js'});const s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtm.js?id='+encodeURIComponent(CFG.gtmId);document.head.appendChild(s);}
    else if(useGa){const s=document.createElement('script');s.async=true;s.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(CFG.ga4Id);document.head.appendChild(s);
      gtag('js',new Date());gtag('config',CFG.ga4Id,{send_page_view:false,anonymize_ip:!!CFG.anonymizeIp,transport_type:'beacon'});}}
  /* ---- Ereignisse ---- */
  const recent=new Map();
  const pagePath=()=>location.pathname+(location.search||'');
  function track(name,params){params=params||{};
    const key=name+'|'+JSON.stringify(params),now=Date.now();
    const last=recent.get(key);if(last&&now-last<800)return false;recent.set(key,now);
    if(recent.size>60)for(const [k,t] of recent){if(now-t>5000)recent.delete(k);}
    const payload=Object.assign({event:name,page_path:pagePath(),page_title:document.title},params);
    if(useGa&&loaded)gtag('event',name,Object.assign({},params,{page_path:payload.page_path,page_title:payload.page_title}));
    else dl.push(payload);                        /* GTM (oder Debug ohne IDs): reines dataLayer-Ereignis */
    if(CFG.debug)try{console.info('[analytics]',name,params);}catch(e){}
    return true;}
  /* Seitenaufruf pro SPA-Route (app.js meldet 'bs:route') + Scroll-Tiefe je Seite zurücksetzen */
  let depthSeen=new Set(),curRoute='';
  function pageView(route){const path=pagePath();if(path===curRoute)return;curRoute=path;depthSeen=new Set();
    track('page_view',{page_location:location.href,route:route&&route.name||'',slug:route&&route.slug||''});}
  document.addEventListener('bs:route',e=>pageView(e.detail));
  document.addEventListener('bs:event',e=>{const d=e.detail||{};if(d.name)track(d.name,d.params||{});});
  /* Scroll-Tiefe 25/50/75/100 (throttled) */
  let sd=0;addEventListener('scroll',()=>{if(sd)return;sd=setTimeout(()=>{sd=0;const h=document.documentElement.scrollHeight-innerHeight;if(h<200)return;const p=Math.round((scrollY/h)*100);
    [25,50,75,100].forEach(m=>{if(p>=m&&!depthSeen.has(m)){depthSeen.add(m);track('scroll_depth',{percent:m});}});},400);},{passive:true});
  /* Klick-Hooks (delegiert, laufen auch in Lightbox/Overlays) */
  const label=el=>(el.getAttribute('aria-label')||el.textContent||'').replace(/\s+/g,' ').trim().slice(0,60);
  const placement=el=>{const s=el.closest('[data-place],section[id],.w-sheet,.sheet,footer,nav,header,#lb,#cbwrap');if(!s)return 'page';return s.dataset.place||s.id||(s.classList.contains('w-sheet')?'sheet:'+(s.dataset.sheet||''):s.tagName.toLowerCase());};
  document.addEventListener('click',e=>{
    const t=e.target instanceof Element?e.target:null;if(!t)return;
    const a=t.closest('a[href],button,[data-go],[data-work]');if(!a)return;
    const href=a.getAttribute('href')||'';const go=a.dataset.go||'';
    if(/^tel:/.test(href)){track('phone_click',{label:label(a),placement:placement(a)});return;}
    if(/wa\.me|whatsapp/.test(href)){track('whatsapp_click',{placement:placement(a)});return;}
    if(/^mailto:/.test(href)){track('email_click',{placement:placement(a)});return;}
    if(/calendly/.test(href)){track('calendly_click',{placement:placement(a)});return;}
    if(go==='kontakt'||a.id==='estCta'){track('cta_offerte',{label:label(a),placement:placement(a)});return;}
    if(a.id==='cbOpen'||a.id==='cbOpen2'||a.id==='cbOpen3'){track('callback_open',{placement:placement(a)});return;}
    if(a.id==='cbSend'){track('callback_submit',{});return;}
    if(a.id==='moreworks'){track('gallery_more',{});return;}
    if(a.dataset.work){track('gallery_open',{work:a.dataset.work,placement:placement(a)});return;}
    if(a.classList.contains('seg-btn')){track('segment_select',{segment:a.dataset.seg||label(a)});return;}
    if(a.dataset.filter!==undefined||a.dataset.f!==undefined){track('gallery_filter',{filter:a.dataset.filter||a.dataset.f||'all'});return;}
    if(/^https?:\/\//.test(href)&&!href.startsWith(location.origin)){track('outbound_click',{url:href.slice(0,120),placement:placement(a)});}
  },true);
  window.Analytics={track,consent,pageView,config:()=>Object.assign({},CFG,{loaded,consent:consentState}),state:()=>({loaded,consent:consentState,dnt:DNT,mode:useGtm?'gtm':useGa?'ga4':'datalayer-only'})};
  load();
  /* Läuft vor app.js (Skriptreihenfolge in index.html) — der erste page_view kommt vom Router über 'bs:route'. */
})();
