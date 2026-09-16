/* BauStern — spatial release: object-linked callouts, quiet dot navigation, no audio, HD s13/r13 media.
   Mobile: native 60/30-fps video in film-mobile.js. Desktop: video owns visible flight pixels;
   canvas resumes on stall/end. Decoded caches are bounded to 40 entries each, including pinned holds.
   Historical architecture notes below describe the original v7 scroll model.
   Startseite v7: «Die Wohnung ist die Seite», scroll-scrubbed (Block 1, vorher v6/SPEC-v6.md).
   Fixierter Film-Canvas (.w-stage, CSS position:fixed) unter der ganzen Startseite. Räume (.w-room) sind
   echte Scroll-Distanzen (roomVh): Kader-Position = ScrollTrigger-Fortschritt (scrub), kein Zeit-Tween mehr.
   Jeder Raum: 0..camFrac = Kamerafahrt zur Zielszene (frame=lerp(vorher,jetzt,easeIO(t))), camFrac..1 =
   Verweilzone (Kader steht, Hotspots/Titel sichtbar, Drift läuft weiter). snap zieht auf 0 oder camFrac.
   Blätter (.w-sheet) sind Papier-Sektionen darüber; Kader dahinter dunkelt ab (cover()).
   Hotspots liegen in Kader-Prozent und werden mit dem Canvas-Cover-Fit + Drift mitbewegt. Mini-Grundriss aus
   PLAN, dazu ein vertikaler Raum-Fortschrittsanzeiger (#wRoomNav) und ein "Scrollen"-Hinweis (#wScrollHint).
   Modi: full (≥1000px, Motion, GSAP, scroll-scrub) · lite (Telefon: Standbilder, Blende statt Fahrt) ·
   plain (Reduced-Motion / ohne GSAP).
   API: Film.full(root) / Film.lite(root) / Film.plain(root) -> cleanup, Film.auto(route), Film.unmount(), Film.mode(). */
(function(){
  /* v16: Diese Engine (Kader-Scrubbing) läuft nur noch im Rollback ?film=15 / ?film=13.
     Im v16-Pfad installiert sie sich gar nicht — window.Film kommt dann aus js/film-v16.js. */
  const F=(typeof FILM!=='undefined')?FILM:null;if(!F||F.engine==='v16')return;
  const S=F.scenes,N=S.length;let rotTimer=0;
  const q=(r,s)=>r.querySelector(s),qa=(r,s)=>Array.prototype.slice.call(r.querySelectorAll(s));
  const clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t,smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
  const easeIO=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
  /* Kaderquelle: normales Set oder kleines Set (dirLow) auf schwachen Geräten / Datensparmodus */
  const pickDir=()=>{const n=navigator;const low=F.dirLow&&((n.hardwareConcurrency||8)<=4||(n.deviceMemory&&n.deviceMemory<=4)||(n.connection&&n.connection.saveData));if(low)return F.dirLow;
    /* Auch normale 1440/1920-Monitore benötigen mehr als 1280 Pixel. */
    const hi=F.dir2&&Math.max(innerWidth,innerHeight*16/9)*(window.devicePixelRatio||1)>1280;return hi?F.dir2:F.dir;};
  let dirCur=pickDir();
  const holdIndex=new Map(S.map((s,i)=>[s.f,i]).filter(([,i])=>!S[i].flash));
  const src=i=>F.hdHolds&&holdIndex.has(i)?F.stillDir+'st'+holdIndex.get(i)+'.jpg':dirCur+'f'+String(i).padStart(F.pad,'0')+F.ext;
  const reduced=()=>matchMedia('(prefers-reduced-motion:reduce)').matches;
  const hasGsap=()=>typeof gsap!=='undefined'&&typeof gsap.to==='function'&&!document.documentElement.classList.contains('no-gsap');
  /* Scrollen zu einem Element: über Lenis (app.js: window.Smooth), sonst nativ */
  const scrollEl=el=>{if(!el)return;if(window.Smooth&&Smooth.to)Smooth.to(el);else el.scrollIntoView({behavior:'smooth',block:'start'});};

  /* ---------- Kader-Cache ----------
     Kader werden als ImageBitmap gehalten: Decode läuft ausserhalb des Hauptthreads (fetch -> blob -> createImageBitmap),
     drawImage ist danach nur noch ein Blit. Speicherfenster: nur die Kader der aktuellen und der nächsten Fahrt (max. 2 Clips),
     alles andere wird mit close() freigegeben. Fallback ohne createImageBitmap: Image + decode(). */
  const hasBitmap=typeof createImageBitmap==='function'&&typeof fetch==='function';
  const bm=new Map(),pending=new Map(),failed=new Set();let loadGen=0,cacheFocus=0,bitmapReady=null;
  const capCache=map=>{if(map.size<=40)return;const candidates=[...map.keys()].filter(k=>!holdIndex.has(k)).sort((a,b)=>Math.abs(b-cacheFocus)-Math.abs(a-cacheFocus));while(map.size>40&&candidates.length){const k=candidates.shift(),im=map.get(k);map.delete(k);if(im?.close)im.close();}};
  /* v9 (Glättung): komprimierte Kader (Blobs, 7–12 KB) für den GANZEN Film im Speicher halten — dann kostet
     ein Kader an beliebiger Stelle nur noch das Decoding (Worker, ~5 ms), nie mehr das Netz. Vorher lieferte
     nearest() bei schnellem Scrollen den zuletzt geladenen Kader zurück = sichtbares "Springen in Kadern". */
  const blobs=new Map(),lowBlobs=new Map();let blobPrefetch=null;
  const fetchBlob=(url,map,k)=>map.has(k)?Promise.resolve(map.get(k)):fetch(url,{priority:'low'}).then(r=>{if(!r.ok)throw 0;return r.blob();}).then(b=>{map.set(k,b);return b;});
  /* Diagnose (nur lesend, für QA-Skripte): Füllstand der Caches */
  window.__filmStats=()=>{const has=(m,a,b)=>{let n=0;for(let k=a;k<=b;k++)if(m.has(k))n++;return n;};return {bm:bm.size,low:lowBm.size,blobs:blobs.size,lowBlobs:lowBlobs.size,has};};
  const isBm=im=>typeof ImageBitmap!=='undefined'&&im instanceof ImageBitmap;
  const okIm=im=>!!im&&(isBm(im)?im.width>0:(im.complete&&im.naturalWidth>0));
  const dim=im=>({w:isBm(im)?im.width:(im.naturalWidth||im.width||1280),h:isBm(im)?im.height:(im.naturalHeight||im.height||720)});
  function loadImg(k){return new Promise((res,rej)=>{const im=new Image();im.decoding='async';im.onload=()=>{(im.decode?im.decode().catch(()=>{}):Promise.resolve()).then(()=>res(im));};im.onerror=rej;im.src=src(k);});}
  function loadBitmap(k){if(bm.has(k))return Promise.resolve(bm.get(k));if(pending.has(k))return pending.get(k);if(failed.has(k))return Promise.resolve(null);
    const gen=loadGen;
    const p=(hasBitmap?fetchBlob(src(k),blobs,k).then(b=>createImageBitmap(b)):loadImg(k))
      .then(im=>{pending.delete(k);if(gen!==loadGen){if(im&&im.close)im.close();return null;}bm.set(k,im);capCache(bm);if(bitmapReady)bitmapReady(k);return im;})
      .catch(()=>{pending.delete(k);failed.add(k);return null;});
    pending.set(k,p);return p;}
  /* Alle Kader eines Bereichs laden (Reihenfolge = Fahrtrichtung); löst auf, wenn alle da sind */
  function ensureRange(a,b,conc){conc=conc||6;a=Math.round(a);b=Math.round(b);   /* a/b kommen bei schnellem Scrollen manchmal als Zwischenwert einer laufenden Fahrt (frame ist während des Tweens gebrochen) — ungerundet erzeugt die For-Schleife unten Kaderindizes mit Nachkommastellen und damit kaputte, 404-liefernde Dateinamen. */
    const lo=Math.max(0,Math.min(a,b)),hi=Math.min(F.frames-1,Math.max(a,b));const ks=[];
    for(let k=lo;k<=hi;k++)if(!bm.has(k))ks.push(k);if(a>b)ks.reverse();
    return new Promise(res=>{let i=0,active=0,done=0;const n=ks.length;if(!n)return res();
      const next=()=>{while(active<conc&&i<n){const k=ks[i++];active++;loadBitmap(k).then(()=>{active--;done++;if(done>=n)res();else next();});}};next();});}
  const rangeReady=(a,b)=>{a=Math.round(a);b=Math.round(b);const lo=Math.min(a,b),hi=Math.max(a,b);for(let k=lo;k<=hi;k++)if(!bm.has(k))return false;return true;};
  /* Speicher freigeben: alles ausserhalb der Fenster [lo,hi] (Haltekader der Szenen bleiben immer) */
  function prune(windows){const keepF=new Set(S.map(x=>x.f));
    for(const k of Array.from(bm.keys())){if(keepF.has(k)||windows.some(w=>k>=Math.min(w[0],w[1])&&k<=Math.max(w[0],w[1])))continue;const im=bm.get(k);bm.delete(k);if(im&&im.close){try{im.close();}catch(e){}}}
    for(const k of Array.from(lowBm.keys())){if(keepF.has(k)||windows.some(w=>k>=Math.min(w[0],w[1])&&k<=Math.max(w[0],w[1])))continue;const im=lowBm.get(k);lowBm.delete(k);if(im&&im.close){try{im.close();}catch(e){}}}}
  function nearest(k){k=clamp(Math.round(k),0,F.frames-1);
    if(bm.has(k))return bm.get(k);if(lowBm.has(k))return lowBm.get(k);
    for(let d=1;d<F.frames;d++){
      if(k-d>=0&&bm.has(k-d))return bm.get(k-d);if(k+d<F.frames&&bm.has(k+d))return bm.get(k+d);
      if(k-d>=0&&lowBm.has(k-d))return lowBm.get(k-d);if(k+d<F.frames&&lowBm.has(k+d))return lowBm.get(k+d);
    }
    return null;}
  /* v9: Kaderwahl ohne Sprünge. Fehlt der Zielkader k noch, wird NICHT irgendein nächstliegender Kader genommen
     (der konnte jenseits des Ziels liegen -> sichtbares Vor-/Zurückspringen), sondern der dem Ziel nächste bereits
     geladene Kader ZWISCHEN dem zuletzt gezeichneten (from) und k. Gibt es keinen, bleibt der letzte stehen, bis
     der Zielkader da ist (render() fordert ihn an) — Bewegung ist damit immer monoton. Liefert den Kaderindex. */
  function pickFrame(k,from){k=clamp(Math.round(k),0,F.frames-1);
    if(bm.has(k)||lowBm.has(k))return k;
    if(from>=0&&from!==k){const step=from<k?-1:1;for(let j=k+step;step<0?j>=from:j<=from;j+=step){if(bm.has(j)||lowBm.has(j))return j;}
      if(bm.has(from)||lowBm.has(from))return from;}
    for(let d=1;d<F.frames;d++){if(k-d>=0&&(bm.has(k-d)||lowBm.has(k-d)))return k-d;if(k+d<F.frames&&(bm.has(k+d)||lowBm.has(k+d)))return k+d;}
    return -1;}
  const imAt=j=>j<0?null:(bm.get(j)||lowBm.get(j)||null);
  function clearCache(){loadGen++;for(const im of bm.values()){if(im&&im.close){try{im.close();}catch(e){}}}bm.clear();pending.clear();
    for(const im of lowBm.values()){if(im&&im.close){try{im.close();}catch(e){}}}lowBm.clear();lowPending.clear();}

  /* ---------- Low-Res-Vorschau (1.10) ----------
     Auf leistungsfähigen Geräten (dirCur === F.dir, volle Auflösung aktiv) wird beim Betreten eines Raums
     der Bereich bis zum nächsten Raum zusätzlich in low-res (F.dirLow) vorgeladen: kleine Dateien, schnell da,
     dienen nearest() als Sofort-Platzhalter, während die vollen Kader im Hintergrund progressiv nachladen
     (ensureRange). Auf ohnehin schwachen Geräten (dirCur === F.dirLow) ist dieser Zwischenschritt sinnlos —
     dort ist bereits alles low-res, loadLow()/ensureRangeLow() werden dann zu No-ops. */
  const lowBm=new Map(),lowPending=new Map();
  const srcLow=i=>(F.dirLow||dirCur)+'f'+String(i).padStart(F.pad,'0')+F.ext;
  function loadLow(k){if(!F.dirLow||dirCur===F.dirLow)return Promise.resolve(null);
    if(bm.has(k)||lowBm.has(k))return Promise.resolve(lowBm.get(k)||null);if(lowPending.has(k))return lowPending.get(k);
    const gen=loadGen;
    const p=(hasBitmap?fetchBlob(srcLow(k),lowBlobs,k).then(b=>createImageBitmap(b)):loadImg(k))
      .then(im=>{lowPending.delete(k);if(gen!==loadGen||bm.has(k)){if(im&&im.close)im.close();return null;}lowBm.set(k,im);capCache(lowBm);return im;})
      .catch(()=>{lowPending.delete(k);return null;});
    lowPending.set(k,p);return p;}
  function ensureRangeLow(a,b){if(!F.dirLow||dirCur===F.dirLow)return;a=Math.round(a);b=Math.round(b);
    const lo=Math.max(0,Math.min(a,b)),hi=Math.min(F.frames-1,Math.max(a,b));
    for(let k=lo;k<=hi;k++)if(!bm.has(k)&&!lowBm.has(k))loadLow(k);}

  /* ---------- Canvas ---------- */
  let srcW=1280;   /* Breite der Kaderquelle: der Canvas wird nie grösser als die Quelle gerastert (Upscaling kostet nur GPU) */
  /* v10: DPR-Kappe 2 (vorher 1.5) — mit 1920-Kadern lohnt sich Retina; die Quelle bleibt die Obergrenze (nie über srcW rastern) */
  function fit(cv){const w=cv.clientWidth,h=cv.clientHeight;const dpr=Math.min(2,window.devicePixelRatio||1,Math.max(.6,srcW/Math.max(1,w)),cv.__filmMoving?Math.min(1,1280/Math.max(1,w)):2);
    if(cv.width!==Math.round(w*dpr)||cv.height!==Math.round(h*dpr)){cv.width=Math.round(w*dpr);cv.height=Math.round(h*dpr);}return {w:cv.width,h:cv.height,dpr};}
  /* Cover-Fit-Geometrie in CSS-Pixeln (für Hotspots) */
  function geom(cv,iw,ih){const w=cv.clientWidth,h=cv.clientHeight;const s=Math.max(w/iw,h/ih);const dw=iw*s,dh=ih*s;return {dx:(w-dw)/2,dy:(h-dh)/2,dw,dh};}
  function drawFrame(cv,ctx,im,im2,mix){if(!im)return false;cv.__filmMaterial=null;const {w,h}=fit(cv);
    const put=(img,alpha)=>{const d=dim(img),iw=d.w,ih=d.h;const s=Math.max(w/iw,h/ih),dw=iw*s,dh=ih*s;ctx.globalAlpha=alpha;ctx.drawImage(img,(w-dw)/2,(h-dh)/2,dw,dh);};
    put(im,1);if(im2&&mix>0)put(im2,mix);ctx.globalAlpha=1;return true;}
  /* Vorher/Nachher: links 'before' (Foto), rechts 'after' (Kader); Trennlinie bei x (0..1) */
  function drawSplit(cv,ctx,after,before,x){if(!after||!before)return false;cv.__filmMaterial=null;const {w,h,dpr}=fit(cv);
    const put=img=>{const d=dim(img),iw=d.w,ih=d.h;const s=Math.max(w/iw,h/ih),dw=iw*s,dh=ih*s;ctx.drawImage(img,(w-dw)/2,(h-dh)/2,dw,dh);};
    put(after);const sx=Math.round(w*x);ctx.save();ctx.beginPath();ctx.rect(0,0,sx,h);ctx.clip();put(before);ctx.restore();return true;}
  /* Kurzer Hinweis-Schwung des Reglers beim Erscheinen (0.5 -> 0.38 -> 0.5) */
  function nudgeCompare(box,onMove){if(!box||reduced())return;const t0=performance.now();box.classList.add('is-nudge');
    const f=now=>{if(box.hidden||box.classList.contains('is-drag')){box.classList.remove('is-nudge');return;}const t=Math.min(1,(now-t0)/1200);const x=.5-.12*Math.sin(t*Math.PI);box.style.setProperty('--x',x.toFixed(4));onMove(x);if(t<1)requestAnimationFrame(f);else box.classList.remove('is-nudge');};
    setTimeout(()=>requestAnimationFrame(f),350);}
  /* Regler für den Vergleich (Pointer + Tastatur); onMove(x 0..1) */
  function bindCompare(box,onMove){if(!box)return()=>{};const h=box.querySelector('.w-cmp-h');let drag=false;
    const measure=()=>{const width=box.clientWidth;if(width)box.style.setProperty('--cmp-w',width+'px');};measure();
    const observer=typeof ResizeObserver==='function'?new ResizeObserver(measure):null;if(observer)observer.observe(box);
    const setX=x=>{const mat=box.classList.contains('is-mat');x=clamp(x,mat?0:.04,mat?1:.96);box.style.setProperty('--x',x.toFixed(4));h.setAttribute('aria-valuenow',String(Math.round(x*100)));onMove(x,{dragging:drag});};
    const fromEv=e=>{const r=box.getBoundingClientRect(),pad=box.classList.contains('is-mat')?28:0;return (e.clientX-r.left-pad)/Math.max(1,r.width-pad*2);};
    const down=e=>{drag=true;box.classList.add('is-drag');try{h.setPointerCapture(e.pointerId);}catch(_){ }setX(fromEv(e));e.preventDefault();};
    const move=e=>{if(!drag)return;setX(fromEv(e));};const up=()=>{drag=false;box.classList.remove('is-drag');};
    const tap=e=>{if(e.target===h||h.contains(e.target))return;setX(fromEv(e));};
    const key=e=>{const value=parseFloat(box.style.getPropertyValue('--x')),x=Number.isFinite(value)?value:.5;if(e.key==='ArrowLeft'||e.key==='ArrowDown'){setX(x-.05);e.preventDefault();}else if(e.key==='ArrowRight'||e.key==='ArrowUp'){setX(x+.05);e.preventDefault();}else if(e.key==='Home'||e.key==='End'){setX(e.key==='Home'?0:1);e.preventDefault();}};
    h.addEventListener('pointerdown',down);window.addEventListener('pointermove',move,{passive:true});window.addEventListener('pointerup',up);window.addEventListener('pointercancel',up);box.addEventListener('click',tap);h.addEventListener('keydown',key);
    return()=>{if(observer)observer.disconnect();h.removeEventListener('pointerdown',down);window.removeEventListener('pointermove',move);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',up);box.removeEventListener('click',tap);h.removeEventListener('keydown',key);};}

  /* Spatial callouts: labels live in safe viewport space, leaders point into the photograph.
     Layout is measured once per scene/size; camera drift updates only SVG coordinates. */
  function spatialHotspots(layer,scene,onGo){
    layer.classList.add('is-spatial');layer.style.transform='none';layer.removeAttribute('data-lenis-prevent');
    const NS='http://www.w3.org/2000/svg',svg=document.createElementNS(NS,'svg');svg.classList.add('w-ann');svg.setAttribute('aria-hidden','true');layer.append(svg);
    const panel=document.createElement('div');panel.className='w-spatial-pop';panel.hidden=true;panel.id='w-spatial-detail';layer.append(panel);
    const close=restore=>{const active=layer.querySelector('[aria-expanded="true"]');if(active){active.setAttribute('aria-expanded','false');active.classList.remove('open');if(restore)active.focus({preventScroll:true});}panel.hidden=true;};
    layer.onkeydown=e=>{if(e.key==='Escape'){close(true);e.stopPropagation();}else if(e.target.closest('button,a')&&e.key.startsWith('Arrow'))e.stopPropagation();};
    const items=(scene.ann||scene.hot||[]).map((a,i)=>{
      const annotation=!!scene.ann,button=document.createElement('button'),line=document.createElementNS(NS,'path'),dot=document.createElementNS(NS,'circle');
      button.type='button';button.className=annotation?'w-ann-lab'+(a.hero?' hero':''):'w-hs';button.setAttribute('aria-label',a.t);button.style.setProperty('--d',String(Math.min(a.d||i*.1,.5)));button.style.setProperty('--i',i);
      button.innerHTML=annotation?`<span class="n">${a.no}</span><b>${a.t}</b><span class="f">${a.f}</span>${a.hero&&scene.offer?`<span class="o">${scene.offer}</span>`:''}`:`<i aria-hidden="true"></i><span class="w-hs-lbl">${a.t}</span>`;
      line.style.setProperty('--d',String(Math.min(a.d||i*.1,.5)));dot.setAttribute('r',a.hero?'4.5':'3');dot.classList.add('w-anchor');svg.append(line,dot);layer.append(button);
      if(annotation)button.addEventListener('click',()=>onGo(a.go));
      else{button.setAttribute('aria-expanded','false');button.setAttribute('aria-controls',panel.id);button.addEventListener('click',e=>{e.stopPropagation();const wasOpen=button.getAttribute('aria-expanded')==='true';close(false);if(wasOpen)return;button.classList.add('open');button.setAttribute('aria-expanded','true');
        panel.innerHTML=`<button type="button" class="w-spatial-close" aria-label="Detail schliessen">×</button><h3>${a.t}</h3><p>${a.l[0]}</p><p>${a.l[1]||''}</p>${a.go?`<a href="/${typeof goPath==='function'?goPath(a.go):a.go}">Mehr dazu →</a>`:''}`;panel.hidden=false;
        button.focus({preventScroll:true});panel.querySelector('button').onclick=()=>close(true);panel.querySelector('a')?.addEventListener('click',event=>{event.preventDefault();onGo(a.go);});
        const r=button.getBoundingClientRect(),pw=panel.offsetWidth,ph=panel.offsetHeight;panel.style.left=clamp(r.left,24,innerWidth-pw-24)+'px';panel.style.top=clamp(r.bottom+10,90,innerHeight-ph-24)+'px';});}
      return {a,button,line,dot,annotation};
    });
    layer.__spatial={items,svg,key:'',close};
  }
  function placeSpatial(layer,cv,iw,ih,pose={s:1,x:0,y:0}){
    const state=layer.__spatial;if(!state)return;const {items,svg}=state,w=innerWidth,h=innerHeight,scale=Math.max(w/iw,h/ih),g={dx:(w-iw*scale)/2,dy:(h-ih*scale)/2,dw:iw*scale,dh:ih*scale},W=layer.closest('.wohnung');
    const key=[w,h,iw,ih].join('|');
    if(state.key!==key){state.key=key;svg.setAttribute('viewBox',`0 0 ${w} ${h}`);
      const margin=28,top=96,occupied=[],pad=14;
      const reserve=e=>{if(!e||e.hidden)return;const r=e.getBoundingClientRect();if(r.width&&r.height)occupied.push({x:r.left-pad,y:r.top-pad,w:r.width+pad*2,h:r.height+pad*2});};
      reserve(W.querySelector('#wOv'));reserve(W.querySelector('#wRoomNav'));reserve(W.querySelector('#wPlan'));reserve(W.querySelector('#wCmp'));
      const intersects=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
      items.forEach(item=>{const {a,button,annotation}=item,bw=button.offsetWidth,bh=button.offsetHeight;
        const rawX=g.dx+g.dw*(annotation?a.lx:a.x)/100,rawY=g.dy+g.dh*(annotation?a.ly:a.y)/100;
        const dx=clamp(rawX-(annotation?0:22),margin,w-margin-bw),dy=clamp(rawY-(annotation?bh+10:bh/2),top,h-margin-bh);
        let best=null,score=Infinity;
        const xs=[dx,margin+145,w-margin-bw,w*.5-bw/2];
        for(let x=margin;x<=w-margin-bw;x+=48)xs.push(x);
        const ys=[dy];for(let y=top;y<=h-margin-bh;y+=16)ys.push(y);
        for(const x of xs)for(const y of ys){if(x<margin||x+bw>w-margin||y<top||y+bh>h-margin)continue;const r={x,y,w:bw,h:bh};
          const clashes=occupied.filter(o=>intersects(r,o)).length,cost=clashes*1e9+(x-dx)**2+(y-dy)**2;
          if(cost<score){score=cost;best=r;}}
        item.box=best||{x:dx,y:dy,w:bw,h:bh};const b=item.box;button.style.transform=`translate3d(${b.x.toFixed(1)}px,${b.y.toFixed(1)}px,0)`;occupied.push({x:b.x-pad/2,y:b.y-pad/2,w:b.w+pad,h:b.h+pad});
      });
    }
    items.forEach(({a,line,dot,box,annotation})=>{if(!box)return;const ax=clamp(w/2+(g.dx+g.dw*a.x/100-w/2)*pose.s+pose.x*w/100,12,w-12),ay=clamp(h/2+(g.dy+g.dh*a.y/100-h/2)*pose.s+pose.y*h/100,80,h-12);
      const ex=annotation?box.x+Math.min(box.w,180):box.x+22,ey=annotation?box.y+box.h+5:box.y+box.h/2;
      const d=annotation?`M${ax.toFixed(1)} ${ay.toFixed(1)} L${box.x.toFixed(1)} ${ey.toFixed(1)} H${ex.toFixed(1)}`:`M${ax.toFixed(1)} ${ay.toFixed(1)} L${ex.toFixed(1)} ${ey.toFixed(1)}`;
      if(line.getAttribute('d')!==d)line.setAttribute('d',d);dot.setAttribute('cx',ax.toFixed(1));dot.setAttribute('cy',ay.toFixed(1));
    });
  }
  /* ---------- Hotspots ---------- */
  function buildHotspots(layer,scene,onGo){
    layer.innerHTML='';layer.onkeydown=null;
    const full=layer.closest('.wohnung')?.classList.contains('is-full');
    layer.classList.remove('is-docked','is-spatial');layer.__spatial=null;
    if(full){
      spatialHotspots(layer,scene,onGo);return;
    }
    (scene.hot||[]).forEach((h,i)=>{
      const el=document.createElement('button');el.type='button';el.className='w-hs'+(h.x>66?' flip':'')+(h.y>66?' up':'');el.style.setProperty('--hx',h.x);el.style.setProperty('--hy',h.y);el.style.setProperty('--i',i);
      el.setAttribute('aria-label',h.t);el.setAttribute('aria-expanded','false');
      el.innerHTML=`<i></i><span class="w-hs-lbl">${h.t}</span><span class="w-hs-pop"><b>${h.l[0]}</b><em>${h.l[1]}</em>${h.go?`<u>Mehr dazu →</u>`:''}</span>`;
      el.addEventListener('click',e=>{e.stopPropagation();const open=el.classList.contains('open');layer.querySelectorAll('.w-hs.open').forEach(x=>{x.classList.remove('open');x.setAttribute('aria-expanded','false');});
        if(!open){el.classList.add('open');el.setAttribute('aria-expanded','true');}});
      const u=el.querySelector('u');if(u&&h.go)u.addEventListener('click',e=>{e.stopPropagation();onGo(h.go);});
      layer.appendChild(el);
    });
  }
  /* Mindestabstand von der oberen Kante: die fixe Navigation (≈78px) liegt sonst über Hotspots mit
     kleinem y-Wert und blockiert sie unabhängig vom z-index (echtes Element, nicht nur Optik). */
  const HOT_TOP_CLEAR=96;
  /* Perf (v8.1): Position per transform statt left/top — left/top erzwingt pro Kader Layout für jeden Hotspot
     (Drift ändert sich mit jedem Scroll-Tick); translate3d bleibt auf dem Compositor, kein Reflow. */
  function placeHotspots(layer,cv,iw,ih,pose){if(layer.classList.contains('is-spatial'))return placeSpatial(layer,cv,iw,ih,pose);const g=geom(cv,iw,ih);
    qa(layer,'.w-hs,.w-ann-dot,.w-spot').forEach(el=>{const x=+el.style.getPropertyValue('--hx'),y=+el.style.getPropertyValue('--hy');
      const px=(g.dx+g.dw*x/100).toFixed(1),py=Math.max(HOT_TOP_CLEAR,g.dy+g.dh*y/100).toFixed(1);
      el.style.transform=`translate3d(${px}px,${py}px,0) translate(-50%,-50%)`;});
    /* Bauplan: Labels sitzen über dem Ende der Masslinie (rechts: linksbündig ab Anker, links: rechtsbündig) */
    const vw=cv.clientWidth,M=Math.max(22,(vw-1280)/2);
    qa(layer,'.w-ann-lab').forEach(el=>{const x=+el.style.getPropertyValue('--hx'),y=+el.style.getPropertyValue('--hy');
      let px=g.dx+g.dw*x/100;const py=(g.dy+g.dh*y/100).toFixed(1);const left=el.classList.contains('l');const w=el.offsetWidth||220;
      if(left)px=Math.max(M+w,px);else px=Math.min(vw-M-w,px);   /* nie über den Viewport hinaus, egal wie breit der Kader beschnitten wird */
      el.style.transform=`translate3d(${px.toFixed(1)}px,${py}px,0) translate(${left?'-100%':'0'},-100%) translateY(-9px)`;});
    const svg=layer.querySelector('.w-ann');if(svg){const k=`${g.dx.toFixed(1)}|${g.dy.toFixed(1)}|${g.dw.toFixed(1)}|${g.dh.toFixed(1)}`;
      if(svg.dataset.g!==k){svg.dataset.g=k;svg.style.left=g.dx+'px';svg.style.top=g.dy+'px';svg.style.width=g.dw+'px';svg.style.height=g.dh+'px';svg.setAttribute('viewBox',`0 0 ${g.dw.toFixed(1)} ${g.dh.toFixed(1)}`);
        qa(svg,'path').forEach(p=>{const [x,y,lx,ly,run]=p.dataset.pts.split(',').map(Number);
          const X=v=>(v*g.dw/100).toFixed(1),Y=v=>(v*g.dh/100).toFixed(1);
          p.setAttribute('d',run?`M${X(x)} ${Y(y)} L${X(lx)} ${Y(ly)} h${(run*g.dw/100).toFixed(1)}`:`M${X(x)} ${Y(y)} L${X(lx)} ${Y(ly)}`);
          let L=100;try{L=p.getTotalLength()||100;}catch(e){}p.style.strokeDasharray=L;p.style.setProperty('--len',L.toFixed(1)+'px');});}}}

  /* ---------- Szenen-Text ---------- */
  function fillScene(ov,scene){
    const k=ov.querySelector('.w-kicker-t')||ov.querySelector('.w-kicker'),h=ov.querySelector('.w-h'),d=ov.querySelector('.w-d'),chips=ov.querySelector('.w-chips'),cnt=ov.querySelector('.w-counters'),et=ov.querySelector('.w-etappen'),bf=(ov.parentElement||ov).querySelector('.w-before'),cta=ov.querySelector('.w-cta');
    if(rotTimer){clearInterval(rotTimer);rotTimer=0;}
    if(scene.rot&&scene.rot.length>1&&!reduced()&&innerWidth>=1000){k.innerHTML=`${scene.kicker?scene.kicker+' · ':''}<span class="w-rot"><span class="rot-w">${scene.rot[0]}</span></span>`;
      const sp=k.querySelector('.rot-w');let i=0;rotTimer=setInterval(()=>{if(!sp.isConnected){clearInterval(rotTimer);rotTimer=0;return;}i=(i+1)%scene.rot.length;sp.classList.add('out');
        setTimeout(()=>{sp.textContent=scene.rot[i];sp.classList.remove('out');sp.classList.add('in');setTimeout(()=>sp.classList.remove('in'),420);},260);},2600);}
    else k.textContent=(scene.kicker||'')+(scene.rot?' · '+scene.rot[0]:'');
    h.innerHTML=String(scene.h||'');
    const walker=document.createTreeWalker(h,NodeFilter.SHOW_TEXT),words=[];let textNode;
    while((textNode=walker.nextNode()))words.push(textNode);
    words.forEach(node=>{const fragment=document.createDocumentFragment();node.textContent.split(/(\s+)/).forEach(word=>{if(!word)return;if(/^\s+$/.test(word)){fragment.append(document.createTextNode(word));return;}const outer=document.createElement('span'),inner=document.createElement('span');outer.className='w-w';inner.textContent=word;outer.append(inner);fragment.append(outer);});node.replaceWith(fragment);});
    d.textContent=scene.d||'';
    if(chips)chips.hidden=!scene.chips;if(cnt){cnt.hidden=!scene.counters;if(scene.counters)cnt.innerHTML=scene.counters.map(c=>`<div><b class="odo" data-n="${c[0]}" data-suf="${c[1]}">${[...String(c[0])].map(ch=>/\d/.test(ch)?`<span class="odo-d" data-d="${ch}"><span class="odo-r">${[...Array(10).keys()].map(n=>`<i>${n}</i>`).join('')}</span></span>`:`<span>${ch}</span>`).join('')}${c[1]?`<span>${c[1]}</span>`:''}</b><span>${c[2]}</span></div>`).join('');}
    if(et)et.hidden=!scene.etappen;
    if(bf){if(scene.before){bf.hidden=false;const im=bf.querySelector('img');if(im.getAttribute('src')!==scene.before){im.src=scene.before;im.alt=scene.beforeCap||'';}bf.querySelector('figcaption').textContent=scene.beforeCap||'';}else bf.hidden=true;}
    if(cta)cta.hidden=!scene.final;const sg=(ov.parentElement||ov).querySelector('.w-sig');if(sg){sg.hidden=!scene.sig;const sv=sg.querySelector('svg');if(sv&&sv._sigReset)sv._sigReset();}
    ov.classList.toggle('is-hero',!!scene.hero);
  }
  /* Zählwerk: Ziffernrollen laufen auf ihren Zielwert (reduced-motion: sofort) */
  function countUp(ov,dur){qa(ov,'.w-counters .odo-d').forEach((d,k)=>{const r=d.querySelector('.odo-r');if(!r)return;const n=+d.dataset.d||0;
    r.style.transition=reduced()?'none':`transform ${Math.max(.8,dur)}s cubic-bezier(.16,1,.3,1) ${(k*.09).toFixed(2)}s`;r.style.transform='translateY(0)';
    requestAnimationFrame(()=>requestAnimationFrame(()=>{r.style.transform=`translateY(${-n*10}%)`;}));});}

  /* ---------- Mini-Grundriss ---------- */
  function buildPlan(host){
    const P=(typeof PLAN!=='undefined')?PLAN:null;if(!P||!host)return null;
    host.innerHTML=`<svg viewBox="0 0 ${P.w} ${P.h}" aria-hidden="true">${P.rooms.map(r=>`<path class="w-pr" data-room="${r.id}" d="${r.d}"></path>`).join('')}
      <g class="w-pcam"><path class="w-cone" d="M0 0 L-16 -26 A30 30 0 0 1 16 -26 Z"></path><circle r="3.2"></circle></g></svg>
      <div class="w-plan-lbl"></div>`;
    return {svg:host.querySelector('svg'),cam:host.querySelector('.w-pcam'),lbl:host.querySelector('.w-plan-lbl'),P};
  }
  function setPlan(pl,i){if(!pl)return;const c=pl.P.cam[i]||pl.P.cam[0];qa(pl.svg,'.w-pr').forEach(p=>p.classList.toggle('on',p.dataset.room===c.room));
    pl.cam.setAttribute('transform',`translate(${c.x} ${c.y}) rotate(${c.a})`);const r=pl.P.rooms.find(r=>r.id===c.room);pl.lbl.textContent=r?r.label:'';}

  let state=null;
  /* Fix #3/#1: die Eröffnung (Kader 0..introEnd) läuft nur EINMAL pro SPA-Sitzung. Beim Zurückkehren auf die
     Startseite (Nav/Logo/Browser-Zurück) wird direkt der Haltekader gezeigt und der Titel sofort eingeblendet —
     vorher lief der 3.4-s-Clip jedes Mal neu (plus bis 3 s Nachladen), d. h. 6–7 s Stage ohne jeden Text. */
  let introPlayed=false;let introVideo=null;
  const killIntroVideo=()=>{if(!introVideo)return;try{introVideo.pause();}catch(e){}introVideo.remove();introVideo=null;};
  function unmount(){if(rotTimer){clearInterval(rotTimer);rotTimer=0;}if(!state)return;try{state.cleanup();}catch(e){}state=null;}
  const goRoute=g=>{if(typeof go==='function')go(g);else location.href='/'+String(g).replace(/^\/+/,'');};

  /* ================= full ================= */
  /* v7 (Block 1): Kader-Position folgt direkt dem Scroll-Fortschritt (ScrollTrigger scrub) statt einem
     Zeit-Tween. Jeder Raum >0 hat einen eigenen ScrollTrigger über seine volle Höhe (roomVh): die ersten
     camFrac (30%) sind die Kamerafahrt zur nächsten Szene (frame = lerp(vorher, jetzt, easeIO(lokalerFortschritt))),
     der Rest ist die Verweilzone (Kader steht auf der Zielszene, Hotspots/Titel erscheinen, Drift läuft weiter).
     snap zieht das Scrollen nach dem Loslassen auf 0 (noch nicht angekommen) oder camFrac (angekommen) —
     das ist die Antwort auf "man muss genau das richtige Pixel treffen": es gibt jetzt gar kein Pixel mehr,
     auf dem man "falsch" stehen bleiben kann, snap erledigt das automatisch.
     .w-stage ist bereits CSS position:fixed (site.css) — ein zusätzliches ScrollTrigger-pin:true auf #wohnung
     würde .w-flow (die echten Scroll-Distanzen der Räume/Blätter) mit fixieren und die ganze Architektur
     brechen. Der Scrub-Effekt (kein Zeit-Tween mehr) wird deshalb ohne pin:true erreicht — CSS liefert die
     Fixierung bereits, ScrollTrigger liefert nur noch den Fortschrittswert. */
  function full(root){
    unmount();
    const nextDir=pickDir();if(nextDir!==dirCur){clearCache();blobs.clear();failed.clear();dirCur=nextDir;}
    const W=q(root,'#wohnung');if(!W)return null;
    const stage=q(W,'#wStage'),cam=q(W,'.w-cam'),cv=q(W,'.w-canvas'),hotL=q(W,'#wHot'),ov=q(W,'#wOv'),planHost=q(W,'#wPlan'),roomNav=q(W,'#wRoomNav'),scrollHint=q(W,'#wScrollHint'),rooms=qa(W,'.w-room'),sheets=qa(W,'.w-sheet'),hud=q(W,'#wHud'),flyEl=q(W,'#wFly');
    const setHud=i=>{if(!hud)return;const sc=S[i];hud.querySelector('.k').textContent='Kader '+String(sc.f).padStart(3,'0')+' · '+(sc.navLabel||sc.kicker||'');hud.querySelector('b').textContent=String(i+1).padStart(2,'0')+' / '+String(rooms.length).padStart(2,'0');};
    if(!stage||!cv||!rooms.length)return null;
    // Avoid repeated inherited-property assignments in animation hot paths.
    // Read inline values only (no layout flush), then write actual changes once.
    const cssValue=(el,key,value)=>{if(el&&el.style.getPropertyValue(key)!==value)el.style.setProperty(key,value);};
    const ctx=cv.getContext('2d',{alpha:false});
    /* A decoded photograph composites more cheaply than a transformed canvas texture.
       Holds stay at source HD quality; canvas is only needed for scrubbing and fallback. */
    const held=new Image();held.className='w-held';held.alt='';held.setAttribute('aria-hidden','true');held.decoding='async';held.hidden=true;cv.after(held);
    let heldIndex=-1,heldReady=false,heldUrl=null;
    W.classList.add('is-full');W.classList.remove('is-lite','is-plain');
    document.documentElement.classList.add('pre-hold');
    const CAM=clamp(F.camFrac||.3,.1,.9);
    /* REVEAL muss >= CAM sein: snapTo darf nie exakt auf CAM ruhen, wenn REVEAL erst danach kommt — sonst
       gibt es einen "toten" Rastpunkt, an dem das Kader schon korrekt steht, Titel/Hotspots aber für immer
       unsichtbar bleiben (bei sehr schnellem Scrollen von Playwright-Regression 1.11 real reproduziert). */
    const REVEAL=Math.max(CAM,.35);
    /* Fix #3: frame startet bei 0 (= poster.jpg, Kader 0), NICHT bei S[0].f (63, Ende des Eröffnungsclips) —
       vorher wurde nach dem Poster zuerst der END-Kader gezeichnet und der Clip sprang danach sichtbar auf 0 zurück
       ("Eröffnung beginnt mit einem Hänger"). Bei übersprungener Eröffnung (introPlayed) direkt der Haltekader. */
    let sigTimer=0,sigRan=false,revealTimer=0;
    /* A decorative transition must never own the final content state. WebKit can suspend
       CSS timelines inside a previously covered fixed stage. Settle after the longest
       word/odometer entrance, scoped to this scene and cancelled on replacement/unmount. */
    const resetReveal=()=>{clearTimeout(revealTimer);revealTimer=0;ov.classList.remove('reveal-settled');hotL.classList.remove('reveal-settled');};
    const settleReveal=()=>{if(revealTimer||ov.classList.contains('reveal-settled'))return;const scene=cur;revealTimer=setTimeout(()=>{revealTimer=0;if(!alive||cur!==scene)return;ov.classList.add('reveal-settled');hotL.classList.add('reveal-settled');if(hotL.__spatial)hotL.__spatial.key='';hotDirty=true;kick();},1150);};
    const par={x:0,y:0,tx:0,ty:0};
    const finePointer=matchMedia('(hover:hover) and (pointer:fine)').matches;
    const onPar=e=>{if(!finePointer||document.hidden||W.classList.contains('is-covered'))return;par.tx=(e.clientX/innerWidth-.5)*1.2;par.ty=(e.clientY/innerHeight-.5)*.8;kick();};
    if(finePointer)addEventListener('pointermove',onPar,{passive:true});
    /* Tastatur: ← → (und J/K) springen zwischen den Räumen. Der Rundgang ist stumm. */
    const onKey=e=>{if(e.defaultPrevented||e.metaKey||e.ctrlKey||e.altKey)return;const t=e.target;if(t&&(/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)||t.isContentEditable))return;
      if(!document.documentElement.classList.contains('in-film'))return;
      if(e.key==='ArrowRight'||e.key==='j'||e.key==='J'){e.preventDefault();warmFirstFull();gotoRoom(Math.min(rooms.length-1,cur+1));}
      else if(e.key==='ArrowLeft'||e.key==='k'||e.key==='K'){e.preventDefault();warmFirstFull();gotoRoom(Math.max(0,cur-1));}};
    addEventListener('keydown',onKey);
    let cur=-1,frame=introPlayed?S[0].f:0,drawn=-1,raf=0,alive=true,mix={im:null,a:0},drift={s:1,x:0,y:0},baseIm=null,lastTr='',hotDirty=true,lastCov=0,lastEnter=0,revealDone=false;
    let introRunning=false,introDone=introPlayed;
    const cmp=q(W,'#wCmp'),cmpParent=cmp&&cmp.parentElement;const split={on:false,x:.5};
    // Controls are viewport UI, not part of the drifting/scaling photographic camera.
    if(cmp)stage.append(cmp);
    /* v10 — Materialisierung (Szene mit sc.mat): Fortschritt 0..1 aus Scroll (Verweilzone) ODER Regler (Trägheit + Rückfederung) */
    const fxCv=q(W,'.w-fx'),fxCtx=fxCv?fxCv.getContext('2d'):null;
    const MAT={};S.forEach((sc,i)=>{if(sc.mat&&window.FilmFX)MAT[i]=FilmFX.Materialize(sc.mat);});
    const LAY={};S.forEach((sc,i)=>{if(sc.layers?.length&&window.FilmFX)LAY[i]=FilmFX.Layers(sc.layers,sc.sheen);});
    const matI=window.FilmFX?FilmFX.Inertial(0):null;let matOn=false,matP=0,matLast=0,matDrag=false;
    const cmpTagL=cmp&&cmp.querySelector('.w-cmp-tag-l'),cmpTagR=cmp&&cmp.querySelector('.w-cmp-tag-r'),cmpHandle=cmp&&cmp.querySelector('.w-cmp-h');
    const cmpOff=bindCompare(cmp,(x,input)=>{if(matOn&&matI){if(!input.dragging){matDrag=false;matI.up();matI.set(x);matI.follow(x);kick();return;}/* Regler = Scrubber der Materialisierung */const now=performance.now();if(!matDrag){matDrag=true;matI.down(x,now);matI.set(x);}else matI.move(x,now);kick();return;}
      split.x=x;drawn=-1;hotL.style.opacity=clamp((x-.2)/.3,0,1).toFixed(2);kick();});
    const onCmpUp=()=>{if(matDrag&&matI){matDrag=false;matI.up();kick();}};window.addEventListener('pointerup',onCmpUp);window.addEventListener('pointercancel',onCmpUp);
    /* Rückblende-Szenen zeigen ein echtes Foto (scene.img) statt eines Kaders */
    const flashImgs={};S.forEach((sc,i)=>{if(sc.img){const im=new Image();im.decoding='async';im.src=sc.img;flashImgs[i]=im;}});
    /* Vorher/Nachher-Regler: eigenes 'Nachher'-Foto statt eines wiederverwendeten Kaders aus einer anderen Szene
       (sonst zeigt der Slider dieselbe Aufnahme, die man kurz zuvor schon als eigene Szene gesehen hat). */
    const compareImgs={};S.forEach((sc,i)=>{if(sc.compareImg){const im=new Image();im.decoding='async';im.src=sc.compareImg;compareImgs[i]=im;}});
    const pl=buildPlan(planHost);
    const frameSize={w:1280,h:720};
    /* Vertikaler Raum-Fortschrittsanzeiger (1.7) */
    const navDots=roomNav?qa(roomNav,'.w-roomnav-dot'):[];
    const setActiveDot=i=>{navDots.forEach(d=>d.classList.toggle('on',+d.dataset.i===i));setHud(i);};
    if(roomNav)navDots.forEach(d=>d.classList.remove('on'));
    /* Fix #10: Ziel eines Sprungs ist NICHT die Oberkante des Raums (= Fortschritt 0 = Kamerafahrt noch nicht
       gestartet = Kader der VORSZENE, Titel versteckt, snap hält dort fest), sondern ein Punkt innerhalb der
       Verweilzone (REVEAL + 3 %): Kader steht auf der Zielszene, snap zieht auf REVEAL, Titel/Hotspots sichtbar.
       Raum 0 = Seitenanfang (Szene 0 wird über restoreScene0() wiederhergestellt). */
    const absTop=el=>{let y=0,n=el;while(n){y+=n.offsetTop||0;n=n.offsetParent;}return y;};
    function gotoRoom(idx){const r=rooms[idx];if(!r)return;setActiveDot(idx);
      if(FLY&&idx>0){/* zur Oberkante des Raums (p=0) fahren, dann die Kamerafahrt normal abspielen */
        const y0=Math.round(absTop(r))+3;if(Math.abs(scrollY-y0)<6){zone.set(idx,'top');startFlight(idx,1);return;}
        navLock=true;Smooth.fly(y0,{duration:clamp(Math.abs(scrollY-y0)/2400,.5,1.1),onComplete:()=>{navLock=false;if(!alive)return;zone.set(idx,'top');startFlight(idx,1);}});return;}
      const y=idx===0?0:Math.round(absTop(r)+r.offsetHeight*(REVEAL+.01));
      if(window.Smooth&&Smooth.to)Smooth.to(y);else window.scrollTo({top:y,behavior:'smooth'});}
    const onRoomNav=e=>{const b=e.target.closest('.w-roomnav-dot');if(!b)return;gotoRoom(+b.dataset.i);};
    if(roomNav)roomNav.addEventListener('click',onRoomNav);
    /* "Scrollen"-Hinweis: verschwindet beim ersten echten Scroll-Move */
    let hintGone=false;
    const onHintScroll=()=>{if(hintGone)return;hintGone=true;if(scrollHint)scrollHint.classList.add('hide');};
    if(scrollHint)addEventListener('scroll',onHintScroll,{passive:true});
    /* v9 (Glättung): Zwischen zwei Nachbarkadern wird überblendet (Anteil = Nachkommateil von `frame`) —
       die Kamerafahrt läuft damit kontinuierlich statt in 64 harten Stufen; kostet ein zweites drawImage. */
    let drawnK=-1;   /* Index des zuletzt tatsächlich gezeichneten Kaders (für pickFrame) */
    let layerTimer=0,lastRenderTime=0;
    const render=()=>{raf=0;if(!alive)return;
      const renderTime=performance.now(),elapsed=lastRenderTime?Math.min(.05,(renderTime-lastRenderTime)/1000):1/60;lastRenderTime=renderTime;
      const parEase=1-Math.pow(.93,elapsed*60);
      const k0=Math.floor(frame),k1=Math.min(F.frames-1,k0+1),t=frame-k0,k=t<.5?k0:k1;
      cacheFocus=k0;
      /* The visible hardware video owns the pixels during a flight. Avoid decoding and
         painting two hidden HD canvas frames per tick. Waiting/error/end invalidates
         this shortcut immediately; the pinned arrival still is retained in the cache. */
      if(VF&&VF.isPresenting()){
        held.hidden=true;W.classList.remove('is-held');
        drawn=-1;W.dataset.frame=k;
        par.x+=(par.tx-par.x)*parEase;par.y+=(par.ty-par.y)*parEase;
        const tr=`translate3d(${(drift.x+par.x).toFixed(2)}%,${(drift.y+par.y).toFixed(2)}%,0) scale(${drift.s.toFixed(4)})`;
        if(tr!==lastTr){lastTr=tr;cam.style.transform=tr;}
        return;
      }
      if(!bm.has(k0))loadBitmap(k0);if(t>.02&&!bm.has(k1))loadBitmap(k1);
      const j=baseIm?-1:pickFrame(k0,drawnK);
      const im=baseIm||imAt(j);
      const im2=(!baseIm&&j===k0&&mix.a===0&&t>.02&&t<.98)?imAt(k1):null;
      /* v10 — Materialisierung: in der Verweilzone der Rohbau-Szene übernimmt FilmFX.Materialize den Canvas */
      const M=MAT[cur];
      const holdEligible=cur>=0&&!S[cur].flash&&!matOn&&!split.on&&!baseIm&&!mix.a&&frame===S[cur].f&&!introRunning&&!W.classList.contains('is-driving');
      if(holdEligible&&heldIndex!==cur){heldIndex=cur;heldReady=false;held.hidden=true;const index=cur;
        if(heldUrl)URL.revokeObjectURL(heldUrl);
        const blob=blobs.get(S[index].f),url=heldUrl=blob&&typeof URL.createObjectURL==='function'?URL.createObjectURL(blob):null;
        const release=()=>{if(url)URL.revokeObjectURL(url);if(heldUrl===url)heldUrl=null;};
        held.onload=()=>{release();if(alive&&heldIndex===index){heldReady=true;kick();}};
        held.onerror=()=>{release();heldReady=false;};
        held.src=url||F.stillDir+'st'+index+'.jpg';
      }
      const useHeld=holdEligible&&heldReady;held.hidden=!useHeld;W.classList.toggle('is-held',useHeld);
      cv.__filmMoving=!holdEligible;
      if(matOn&&M&&M.isReady()){const now=performance.now();const dt=matLast?Math.min(.05,(now-matLast)/1000):.016;matLast=now;
        const v=matI.tick(dt);const pv=clamp(v,0,1);matP=pv;
        const composited=M.present&&M.present(pv);if(!composited){fit(cv);M.render(cv,ctx,pv,{mode:(S[cur].mat.mode)||'B+'});}
        const renderer=composited?'compositor':'canvas';if(W.dataset.materialRenderer!==renderer)W.dataset.materialRenderer=renderer;
        if(cmp){cssValue(cmp,'--x',pv.toFixed(4));const ph=S[cur].mat.phases||[];const pi=pv<.15?0:pv<.35?1:pv<.7?2:3;if(cmpTagL&&cmpTagL.textContent!==(ph[pi]||''))cmpTagL.textContent=ph[pi]||'';const val=String(Math.round(pv*100)),percent=val+' %';if(cmpTagR&&cmpTagR.textContent!==percent)cmpTagR.textContent=percent;if(cmpHandle&&cmpHandle.getAttribute('aria-valuenow')!==val)cmpHandle.setAttribute('aria-valuenow',val);}
        let more=false;if(fxCtx&&!composited){fit(fxCv);more=M.dustDraw(fxCv,fxCtx,pv,dt);}
        if(!W.classList.contains('is-drawn')){W.classList.add('is-drawn');document.documentElement.classList.remove('pre-hold');}
        if(more||!matI.settled()||v!==pv)kick();
        par.x+=(par.tx-par.x)*parEase;par.y+=(par.ty-par.y)*parEase;
        const tr=`translate3d(${(drift.x+par.x).toFixed(2)}%,${(drift.y+par.y).toFixed(2)}%,0) scale(${drift.s.toFixed(4)})`;if(tr!==lastTr){lastTr=tr;cam.style.transform=tr;}
        placeHotspots(hotL,cv,frameSize.w,frameSize.h,{s:drift.s,x:drift.x+par.x,y:drift.y+par.y});
        return;}
      if(!matOn&&W.dataset.materialRenderer)delete W.dataset.materialRenderer;
      if(fxCtx&&fxCv.width&&!matOn&&fxCv.dataset.dirty){fxCtx.clearRect(0,0,fxCv.width,fxCv.height);delete fxCv.dataset.dirty;}
      if(okIm(im)){const d=dim(im);frameSize.w=d.w;frameSize.h=d.h;if(!baseIm)srcW=d.w;
        const L=LAY[cur];const layersOn=!!(L&&L.isReady()&&!W.classList.contains('is-driving'));
        if(!useHeld&&(frame!==drawn||mix.a>0||baseIm||layersOn)){if(split.on&&baseIm&&split.after)drawSplit(cv,ctx,split.after,baseIm,split.x);else if(im2&&im2!==im&&okIm(im2))drawFrame(cv,ctx,im,im2,t);else drawFrame(cv,ctx,im,mix.im,mix.a);drawn=frame;if(!baseIm)drawnK=j;W.dataset.frame=k;
          /* v10 — Tiefenebenen (Bad): Waschtisch/Glow/Glas-Reflex folgen dem Cursor ×2.5; «atmen» → sanfter Dauer-Redraw (≈10 Hz reicht, gelerpt) */
          if(layersOn){L.draw(cv,ctx,d.w,d.h,{x:par.x,y:par.y},performance.now()/1000);if(!layerTimer)layerTimer=setTimeout(()=>{layerTimer=0;drawn=-1;kick();},90);}
          if(j!==k0&&!failed.has(k0)){drawn=-1;raf=requestAnimationFrame(render);}   /* Zielkader fehlt noch: weiter nachzeichnen, bis er da ist */
          if(!W.classList.contains('is-drawn')){W.classList.add('is-drawn');document.documentElement.classList.remove('pre-hold');const pre=document.getElementById('pre');if(pre&&!pre.classList.contains('gone'))setTimeout(()=>pre.classList.add('gone'),150);}}}
      /* v9.2 — Cursor-Parallaxe: die Kamera neigt sich minimal (max ±.6 % / ±.4 %) zur Mausposition; Hotspots liegen in
         derselben Transform-Ebene und folgen automatisch. Gelerpt, damit nichts ruckt; nur mit feinem Zeiger. */
      par.x+=(par.tx-par.x)*parEase;par.y+=(par.ty-par.y)*parEase;if(Math.abs(par.tx-par.x)>.002||Math.abs(par.ty-par.y)>.002)kick();
      const tr=`translate3d(${(drift.x+par.x).toFixed(2)}%,${(drift.y+par.y).toFixed(2)}%,0) scale(${drift.s.toFixed(4)})`;
      if(tr!==lastTr||hotDirty){lastTr=tr;hotDirty=false;cam.style.transform=tr;placeHotspots(hotL,cv,frameSize.w,frameSize.h,{s:drift.s,x:drift.x+par.x,y:drift.y+par.y});}
    };
    const kick=()=>{if(!raf)raf=requestAnimationFrame(render);};
    bitmapReady=k=>{if(alive&&Math.abs(k-frame)<1.1){drawn=-1;kick();}};

    /* Nach dem Betreten eines Raums: nächste Strecke im Hintergrund laden (erst low-res als Sofort-Fallback,
       dann progressiv voll aufgelöst), Speicher auf 2 Clips begrenzen (1.10). */
    /* Fix #9: Kader werden in BEIDE Richtungen vorgeladen. Vorher nur zur nächsten Szene — beim Zurückscrollen
       war die Strecke prev.f..S[i].f längst gepruned/nie geladen, nearest() lieferte nur den Haltekader:
       "beim Hochscrollen bleibt das vorherige Bild stehen, die Fahrt fehlt". Reihenfolge: erst vorwärts (low, dann voll),
       dann rückwärts (low, dann voll) — Blend-Übergänge (flash) brauchen keine Strecke. */
    /* Perf (v8.1b): Fotos des nächsten Bogens schon laden+dekodieren, solange man noch im Raum davor steht —
       sonst treffen Netz+Decode genau im Moment des Einfahrens ein (Hänger). */
    function warmSheet(i){const r=rooms[i];if(!r)return;let n=r.nextElementSibling;while(n&&!n.classList.contains('w-sheet'))n=n.nextElementSibling;if(!n||n.dataset.warm)return;n.dataset.warm='1';
      qa(n,'img[loading="lazy"]').forEach(im=>{im.loading='eager';if(im.decode)im.decode().catch(()=>{});});}
    /* Die erste Scrub-Strecke erst bei echter Nutzungsabsicht laden. Das AV1-Video ist bereits warm; für langsames
       Scrubbing kommen zuerst die kleinen Kader, die volle Auflösung folgt gestaffelt. Ohne Interaktion spart das
       knapp 200 Requests und mehrere MB auf der Startseite. */
    let firstFullStarted=false;
    function warmFirstFull(){if(firstFullStarted||!alive)return;firstFullStarted=true;const nx=S[1];if(!nx||nx.flash||S[0].flash)return;
      ensureRangeLow(S[0].f,nx.f);setTimeout(()=>{if(alive)ensureRange(S[0].f,nx.f,4);},700);}
    W.addEventListener('pointerdown',warmFirstFull,{passive:true});
    /* v9: Ankunft = kein Arbeitsstoss mehr im selben Kader wie Snap + Text-Reveal (das war der kurze Hänger auf
       dem Haltekader): prune/decode/warm laufen erst ~450 ms später, in kleinen Häppchen. */
    function afterArrive(i){if(!alive)return;const nx=S[i+1],pv=S[i-1];const win=[];if(pv)win.push([pv.f,S[i].f]);if(nx)win.push([S[i].f,nx.f]);
      /* v10: Bauplan-Choreografie (Held zuerst, dann gestaffelt), Tiefenebenen/Materialisierung der nächsten Szene vorladen, Video vorwärmen */
      if(S[i].ann)setTimeout(()=>{if(alive&&cur===i)hotL.classList.add('seq');},260);
      if(LAY[i])LAY[i].load().then(()=>{if(alive&&cur===i){drawn=-1;kick();}});
      if(nx&&LAY[i+1])setTimeout(()=>{if(alive)LAY[i+1].load();},900);
      if(nx&&MAT[i+1])setTimeout(()=>{if(alive){MAT[i+1].load();MAT[i+1].mount?.(cam,kick);}},700);if(MAT[i]){MAT[i].load();MAT[i].mount?.(cam,kick);}
      if(VF&&nx&&nx.clip)setTimeout(()=>{if(alive&&cur===i)VF.warm(i+1,1);},500);
      const fwd=!!(nx&&!nx.flash&&!S[i].flash),bwd=!!(pv&&!pv.flash&&!S[i].flash);
      /* low-res der nächsten Strecke sofort (≈450 KB, reine Netz-/Worker-Arbeit) — der Nutzer scrollt oft direkt weiter */
      if(fwd&&i!==0)ensureRangeLow(S[i].f,nx.f);
      setTimeout(()=>{if(!alive||cur!==i)return;prune(win);if(bwd)ensureRangeLow(pv.f,S[i].f);},450);
      setTimeout(()=>{if(!alive||cur!==i)return;warmSheet(i);
        (fwd&&i!==0?ensureRange(S[i].f,nx.f,4):Promise.resolve()).then(()=>{if(alive&&cur===i&&bwd)ensureRange(S[i].f,pv.f,2);});},700);}
    /* Fix #1/#9: Szene 0 nach dem Zurückscrollen an den Seitenanfang wiederherstellen. Vorher gab es für Raum 0
       keinen Ankunfts-Handler: onLeaveBack von Raum 1 liess die Stage in "Szene 1, is-driving, Titel versteckt"
       stehen — am Seitenanfang fehlten dann Titel, Kicker, Hotspots und Zähler dauerhaft. */
    function restoreScene0(){if(!alive||cur===0||!introDone)return;cur=0;resetReveal();const sc=S[0];W.dataset.scene=0;W.dataset.ann=sc.ann?'1':'0';
      stage.style.setProperty('--reveal','1');
      delete W.dataset.materialRenderer;
      hotL.classList.remove('show','seq');ov.classList.remove('show');hotL.style.opacity='';split.on=false;matOn=false;Object.values(MAT).forEach(m=>m.hide?.());if(cmp){cmp.hidden=true;cmp.classList.remove('is-mat');}
      baseIm=null;mix={im:null,a:0};drawn=-1;frame=sc.f;drift.s=1;drift.x=0;drift.y=0;hotDirty=true;
      fillScene(ov,sc);buildHotspots(hotL,sc,goRoute);setPlan(pl,0);setActiveDot(0);W.classList.remove('is-driving');
      ov.classList.add('show');hotL.classList.add('show');settleReveal();revealDone=true;if(sc.counters)countUp(ov,.9);
      kick();afterArrive(0);}

    /* Einmalige Ankunfts-Vorbereitung für Raum i (Text/Hotspots/Grundriss neu aufbauen) — läuft nur bei
       echtem Raumwechsel (onEnter/onEnterBack), nicht bei jedem Scroll-Tick. Die eigentliche Kaderposition
       kommt aus updateRoom() unten, gebunden an den Scroll-Fortschritt. */
    function setupRoom(i){
      if(cur===i)return;cur=i;resetReveal();const sc=S[i];
      delete W.dataset.materialRenderer;
      Object.values(MAT).forEach(m=>m.hide?.());
      /* Fix #3 (Race): scrollt der Nutzer während der Eröffnung weiter, bricht der Clip ab — sonst schreiben
         intro-step (frame=lerp(0,63)) und updateRoom(i) gleichzeitig auf `frame` und der Kader springt hin und her. */
      if(introRunning){introRunning=false;introDone=true;introPlayed=true;killIntroVideo();S.forEach(x=>loadBitmap(x.f));}
      W.dataset.scene=i;W.dataset.ann=sc.ann?'1':'0';W.classList.add('is-driving');
      hotL.classList.remove('show','seq');ov.classList.remove('show');hotL.style.opacity='';hotDirty=true;
      split.on=false;if(cmp&&!matOn)cmp.hidden=true;if(!sc.flash)mix={im:null,a:0};
      revealDone=false;clearTimeout(sigTimer);sigTimer=0;sigRan=false;
      fillScene(ov,sc);buildHotspots(hotL,sc,goRoute);setPlan(pl,i);setActiveDot(i);
      try{document.dispatchEvent(new CustomEvent('bs:event',{detail:{name:'tour_room',params:{room:sc.room||sc.id||String(i),index:i}}}));}catch(e){}   /* Analytics */
      afterArrive(i);
    }
    /* Pro Scroll-Tick: Kaderposition (Kamerafahrt 0..camFrac, danach Verweilzone), Drift, Hotspot/Titel-
       Sichtbarkeit ab lokalem Fortschritt .35 (1.5 — funktioniert vorwärts wie rückwärts, da rein aus dem
       aktuellen Fortschrittswert berechnet, nicht aus einem einmaligen Ereignis). */
    function updateRoom(i,p){
      if(cur!==i)return;const sc=S[i],prev=S[i-1]||S[0];
      flightCheck(i,p);
      const isFlash=!!(sc.flash||prev.flash);
      const camT=clamp(p/CAM,0,1);
      W.classList.toggle('is-driving',p<CAM);
      /* v10 — Materialisierung: nur in der Verweilzone der Szene mit sc.mat; Scroll treibt den Fortschritt (Regler folgt gelerpt) */
      const M=MAT[i];const wantMat=!!(M&&p>CAM&&sc.flash);
      if(wantMat!==matOn){matOn=wantMat;drawn=-1;matLast=0;if(hotL.__spatial)hotL.__spatial.key='';if(!matOn){Object.values(MAT).forEach(m=>m.hide?.());}if(cmp){cmp.hidden=!matOn;cmp.classList.toggle('is-mat',matOn);if(matOn){M.mount?.(cam,kick);M.load().then(()=>{if(alive)kick();});cmp.style.setProperty('--x','0');if(cmpTagR)cmpTagR.textContent='0 %';}else if(fxCv)fxCv.dataset.dirty='1';}}
      if(matOn&&matI)matI.follow(clamp((p-CAM)/(1-CAM),0,1));
      if(p<=CAM){
        /* baseIm/frame hier IMMER explizit setzen (nicht auf einen Rest aus der Dwell-Zone verlassen) —
           diese Zone kann sowohl vorwärts (aus der Dwell der Vorszene) als auch rückwärts (aus der eigenen
           Dwell zurück) betreten werden; ohne das bleibt beim Rückwärtsscrollen aus einer Nach-Flash-Szene
           das eingefrorene Foto/Kader der Dwell-Zone stehen, obwohl camT längst zurückläuft. */
        if(isFlash){
          /* Kader-Index bleibt während der reinen Blend-Fahrt auf dem der Vorszene eingefroren (wie im
             Original: nur mix/baseIm animieren die Blende) — aber IMMER explizit gesetzt, nie nur geerbt,
             damit sowohl vorwärts- als auch rückwärts-Betreten dieser Zone denselben korrekten Zustand ergibt. */
          frame=prev.f;
          if(sc.flash){if(baseIm){baseIm=null;drawn=-1;}mix={im:flashImgs[i],a:easeIO(camT)};}
          else{/* v10: nach einer Materialisierung startet die Blende vom «nachher»-Bild (nicht vom Rohbau-Foto) */
            const pM=MAT[i-1];const prevIm=(pM&&pM.isReady()&&pM.after&&pM.after())||flashImgs[i-1];if(baseIm!==prevIm){baseIm=prevIm;drawn=-1;}mix={im:nearest(sc.f),a:easeIO(camT)};}
        }else{
          if(baseIm){baseIm=null;drawn=-1;}
          frame=lerp(prev.f,sc.f,easeIO(camT));
        }
      }else{
        frame=sc.f;
        if(isFlash){
          if(sc.flash){if(baseIm!==flashImgs[i]){baseIm=flashImgs[i];drawn=-1;}mix={im:null,a:0};
            /* v15: Rückblende ohne Materialisierungs-Layer → Vorher/Nachher-Regler direkt in der Verweilzone (links Rohbau, rechts fertig) */
            if(!MAT[i]&&cmp&&sc.compareImg&&!split.on){split.after=compareImgs[i];split.x=.5;cmp.style.setProperty('--x','.5');split.on=true;cmp.hidden=false;if(cmpTagL)cmpTagL.textContent='Vorher';if(cmpTagR)cmpTagR.textContent='Nachher';nudgeCompare(cmp,x=>{split.x=x;drawn=-1;kick();});}}
          else{if(baseIm){baseIm=null;drawn=-1;}
            if(cmp&&sc.compareImg&&!split.on){split.after=compareImgs[i];split.x=.5;cmp.style.setProperty('--x','.5');split.on=true;cmp.hidden=false;nudgeCompare(cmp,x=>{split.x=x;drawn=-1;kick();});}}
        }
      }
      drift.s=1+.05*p;drift.x=(-.8+1.6*p)*(i%2?1:-1);drift.y=-.5*p;
      /* Motion v8 (3.4) — Bug #2/#6: Karteninhalt erschien bisher erst NACH der Kamerafahrt, hart per
         Klassen-Umschaltung bei p>=REVEAL ("Karte poppt auf"). --reveal macht den Übergang zu einem echten
         Fortschrittswert (0..1) über die ganze Kamerafahrt-Zone (0..REVEAL) — Kicker/Überschrift/Text/Fakten
         wachsen in Etappen WÄHREND man scrollt aus dem Bild heraus (Stufen in site.css), statt als fertige
         Karte zu erscheinen. Der bestehende .show-Klassenwechsel (Wort-für-Wort-Stagger der Ueberschrift,
         Hotspot-Icons) bleibt unverändert erhalten und startet nur etwas früher (2%).
         (Ein automatisches Weiterscrollen nach Erreichen von REVEAL wurde probiert und wieder verworfen —
         fühlte sich wie ein ungewolltes "Wegreissen" an, siehe Nutzer-Feedback. Die eigentliche Ursache des
         "hängt"-Gefühls — die lange reine Verweilzone nach REVEAL — wird stattdessen über roomVh/camFrac in
         data.js gekürzt: kürzerer Leerlauf, aber die Kontrolle bleibt zu 100% beim Scrollen des Nutzers.) */
      const rp=clamp(p/REVEAL,0,1);
      cssValue(stage,'--reveal',rp.toFixed(3));
      const showNow=rp>=.98,startShow=rp>.02;
      hotL.classList.toggle('show',startShow);ov.classList.toggle('show',startShow);
      if(startShow)settleReveal();
      if(showNow&&!revealDone){revealDone=true;if(sc.counters)countUp(ov,.9);}
      /* v9.2 — Unterschrift: erst starten, wenn sie SICHTBAR ist (p >= CAM = nicht mehr is-driving, Einblendung .25 s vorbei).
         Vorher lief das Zeichnen ab rp >= .98 — noch während der Fahrt bei opacity 0 — und war beim Erscheinen fertig ("statisch"). */
      if(sc.sig){if(p>=CAM&&!sigRan&&!sigTimer){sigTimer=setTimeout(()=>{sigTimer=0;if(!alive||cur!==i)return;sigRan=true;const sv=W.querySelector('.w-sig svg');if(sv&&sv._sigRun)sv._sigRun();},420);}
        else if(p<CAM-.02&&(sigRan||sigTimer)){clearTimeout(sigTimer);sigTimer=0;sigRan=false;const sv=W.querySelector('.w-sig svg');if(sv&&sv._sigReset)sv._sigReset();}}
      else if(!showNow&&revealDone){revealDone=false;}
      hotDirty=true;kick();
    }
    /* Absicherung gegen sehr schnelles/grosses Scrollen (z. B. ein einzelner harter Fling): wenn der
       ScrollTrigger eines Raums die aktive Zone verlässt, bevor scrub+snap einen der beiden gültigen
       Ruhepunkte (0 oder REVEAL) erreichen konnten, kann der letzte onUpdate-Wert irgendwo dazwischen
       "einfrieren" (Kader schon korrekt, Hotspots aber inkonsistent versteckt, oder umgekehrt) — onLeave/
       onLeaveBack erzwingen deshalb explizit den korrekten Randwert (1 = angekommen, 0 = noch nicht). */
    function finalizeRoom(i,edgeP){updateRoom(i,edgeP);}
    /* Raum 0 (Eröffnung) — kein Scroll-Scrub: Clip 0..introEnd spielt automatisch beim Laden, bevor
       überhaupt gescrollt wurde. Deshalb bekommt Raum 0 keinen Kamerafahrt-Trigger, nur Drift + einen
       einmaligen "fertig"-Reveal am Ende des Clips. */
    /* Fix #3 — Eröffnung ohne Hänger. Drei Ursachen, drei Massnahmen:
       (a) Start bei Kader 0 statt 63 (siehe Initialisierung von `frame`), Poster = Kader 0 → nahtlos.
       (b) Der Clip läuft nur, wenn der jeweils nächste Kader wirklich im Cache ist: fehlt er, PAUSIERT der
           Fortschritt (statt wie vorher per nearest() den letzten geladenen Kader zu wiederholen = Stottern).
       (c) Sind die Kader nach INTRO_WAIT ms nicht da (langsames Netz/CPU), wird die Eröffnung übersprungen und
           direkt der Haltekader + Titel gezeigt — Produktvorgabe: lieber ohne Eröffnung als mit einer, die "laggt".
       Ausserdem: die 7 Haltekader (S[*].f) werden erst NACH der Eröffnung geladen, damit sie dem Clip nicht die
       Bandbreite streitig machen; und die Eröffnung läuft nur einmal pro Sitzung (introPlayed). */
    const INTRO_DUR=3.4,INTRO_WAIT=2200,INTRO_STALL_MAX=700;
    function playIntro(){
      cur=0;const sc=S[0],f1=sc.f;
      W.dataset.scene=0;fillScene(ov,sc);buildHotspots(hotL,sc,goRoute);setPlan(pl,0);setActiveDot(0);
      /* The opening film is decoration, not a loading gate for the proposition and links.
         A slow decoder must never leave the first screen without readable content. */
      setTimeout(()=>{if(!alive||cur!==0||introDone)return;ov.classList.add('show');hotL.classList.add('show');settleReveal();},350);
      const finish=()=>{if(!alive)return;introRunning=false;introDone=true;introPlayed=true;
        /* Nur die sieben Haltekader laden. Ein globales Prefetch aller 216 Low-res-Kader erzeugte direkt nach
           dem Intro mehr als 200 Requests (~4 MB), obwohl schnelle Fahrten als Video laufen. Die jeweils
           nächste/vorherige Strecke wird weiterhin in afterArrive() bedarfsgerecht vorgewärmt. */
        S.forEach(x=>loadBitmap(x.f));
        if(cur!==0)return;                       /* Nutzer ist inzwischen weitergescrollt: updateRoom() führt */
        frame=f1;drawn=-1;W.classList.remove('is-driving');loadBitmap(f1).then(()=>{if(alive&&cur===0){drawn=-1;kick();}}); /* low-res Haltekader -> voll, sobald da */
        ov.classList.add('show');hotL.classList.add('show');settleReveal();revealDone=true;if(sc.counters)countUp(ov,.9);kick();afterArrive(0);};
      /* Rückkehr zeigt den Inhalt sofort; Netzwerk/HD-Decoding darf den Titel nie sperren. */
      if(introPlayed||!F.introEnd){frame=f1;finish();clearTimeout(revealTimer);revealTimer=0;ov.classList.add('reveal-settled');hotL.classList.add('reveal-settled');return;}
      /* Perf (v8.1) — Eröffnung als echtes Video (img/film/intro.mp4, H.264, easeIO-Timing eingebacken,
         1.0 MB statt 4.7 MB Einzelkader): Hardware-Decoder statt 64 createImageBitmap()+drawImage()-Schritten,
         kein Stottern durch nachladende Kader. Der Canvas zeigt darunter Kader 0 (Poster), das Video liegt in
         .w-cam (drift läuft mit); am Ende steht Kader 63 bereits auf dem Canvas und das Video blendet weg —
         nahtlose Übergabe an den Scroll-Scrub. Fällt auf den Kader-Pfad zurück, wenn das Video nicht startet. */
      if(F.introVideo&&!introVideo&&typeof HTMLVideoElement!=='undefined'){
        const v=document.createElement('video');v.className='w-intro';v.muted=true;v.playsInline=true;v.preload='auto';v.setAttribute('muted','');v.setAttribute('playsinline','');v.setAttribute('aria-hidden','true');
        /* v10: beste Quelle per Codec (AV1 → HEVC → H.264) aus introSources, sonst die alten mp4/webm-Quellen */
        const IS=F.introSources;const srcs=IS&&window.FilmFX?[FilmFX.Codecs.src(IS.base,IS.codecs)]:[F.introVideo,F.introVideoAlt].filter(Boolean);
        srcs.forEach(u=>{const so=document.createElement('source');so.src=u;so.type=/\.webm$/i.test(u)?'video/webm':'video/mp4';v.appendChild(so);});cam.insertBefore(v,cv.nextSibling);introVideo=v;
        loadBitmap(f1);                                 /* Haltekader für die Übergabe schon mal holen */
        /* v10 (Naht-Fix, HANDOFF §7.1): Hold-Bild aus DEMSELBEN Master wie das Video (intro-hold.jpg) — liegt der Kader f1 beim
           Ende noch nicht im Cache, wird es als Basis gezeichnet; f1 ersetzt es unsichtbar, sobald es da ist (identischer Inhalt). */
        let holdIm=null;if(IS&&IS.hold){holdIm=new Image();holdIm.decoding='async';holdIm.src=IS.hold;}
        let vStarted=false,vDone=false;
        const vFinish=()=>{if(vDone)return;vDone=true;frame=f1;drawn=-1;
          if(!bm.has(f1)&&holdIm&&holdIm.complete&&holdIm.naturalWidth){baseIm=holdIm;loadBitmap(f1).then(()=>{if(alive&&baseIm===holdIm){baseIm=null;drawn=-1;kick();}});}
          kick();
          /* Video erst NACH dem nächsten gezeichneten Kader ausblenden (Canvas zeigt bereits das identische Bild) */
          requestAnimationFrame(()=>requestAnimationFrame(()=>{if(introVideo===v){v.classList.remove('on');setTimeout(killIntroVideo,260);}}));finish();};
        /* Einziger verlässlicher Endpunkt: mediaTime ≥ duration − 1/fps (rVFC). 'ended' feuert je nach Browser 1–3 Frames später
           oder nach einem Decoder-Stall gar nicht rechtzeitig; der Timeout bleibt nur als Sicherheitsnetz. */
        const watchEnd=()=>{if(!('requestVideoFrameCallback' in v)||vDone||introVideo!==v)return;v.requestVideoFrameCallback((now,meta)=>{if(vDone||introVideo!==v)return;
          const d=v.duration||((IS&&IS.dur)||INTRO_DUR);if(meta.mediaTime>=d-1/60-.002)vFinish();else watchEnd();});};
        const vFail=()=>{if(vStarted||vDone)return;killIntroVideo();bitmapIntro();};
        v.addEventListener('ended',vFinish);v.addEventListener('error',vFail);
        const tryPlay=()=>{if(vStarted||!alive||introVideo!==v)return;if(v.readyState<3)return;
          const pr=v.play();(pr&&pr.then?pr:Promise.resolve()).then(()=>{vStarted=true;introRunning=true;W.classList.add('is-driving');v.classList.add('on');watchEnd();
            /* v9: erste Kamerafahrt (Szene 0 -> 1) schon WÄHREND der Eröffnung laden — das Video ist zu diesem Zeitpunkt
               gepuffert (canplaythrough), die 64 Kader (low ≈ 450 KB, voll ≈ 770 KB) sind da, bevor der Nutzer scrollen kann.
               Vorher: erst nach der Eröffnung -> wer sofort scrollte, sah nearest()-Sprünge ("Kader für Kader"). */
            setTimeout(()=>{if(introVideo===v&&!vDone)vFinish();},(v.duration||INTRO_DUR)*1000+1500);   /* Sicherheitsnetz (Tab im Hintergrund o. ä.) */
          }).catch(vFail);};
        v.addEventListener('canplaythrough',tryPlay);v.addEventListener('loadeddata',tryPlay);
        /* Frist: Video bis dahin nicht abspielbereit (langsames Netz) -> nicht noch 64 Kader nachladen, sondern direkt
           Haltekader + Titel (Produktvorgabe: lieber ohne Eröffnung als mit einer, die hängt). */
        setTimeout(()=>{if(vStarted||vDone||introVideo!==v)return;if(v.readyState>=3){tryPlay();if(vStarted)return;}
          vDone=true;killIntroVideo();finish();},INTRO_WAIT+1500);
        v.load();return;
      }
      bitmapIntro();
      function bitmapIntro(){
      const run=()=>{if(!alive||introDone||introRunning)return;let prog=0,last=performance.now(),stall=0;introRunning=true;W.classList.add('is-driving');
        const step=now=>{if(!alive||!introRunning)return;const dt=Math.min(.05,(now-last)/1000);last=now;
          const nextProg=clamp(prog+dt/INTRO_DUR,0,1),want=lerp(0,f1,easeIO(nextProg));
          if(bm.has(Math.round(want))||lowBm.has(Math.round(want))){prog=nextProg;frame=want;stall=0;kick();}
          else{stall+=dt*1000;if(!bm.has(Math.round(want)))loadBitmap(Math.round(want));if(stall>INTRO_STALL_MAX){finish();return;}}
          if(prog<1)requestAnimationFrame(step);else finish();};
        requestAnimationFrame(step);};
      let started=false;
      const once=()=>{if(started||!alive)return;started=true;run();};
      const skip=()=>{if(started||!alive)return;started=true;finish();};
      if(rangeReady(0,f1)){once();return;}
      /* Perf (v8.1): Eröffnung startet, sobald die kleinen low-res-Kader da sind (Bruchteil der Bytes); die vollen
         Kader laden parallel weiter und ersetzen sie beim nächsten Zeichnen (nearest() bevorzugt bm vor lowBm). */
      ensureRangeLow(0,f1);
      const lowReady=()=>{for(let k=0;k<=f1;k++)if(!bm.has(k)&&!lowBm.has(k))return false;return true;};
      const lowPoll=setInterval(()=>{if(started||!alive){clearInterval(lowPoll);return;}if(lowReady()){clearInterval(lowPoll);once();}},60);
      ensureRange(0,f1,8).then(()=>{clearInterval(lowPoll);once();});
      /* Frist: nach INTRO_WAIT ms entscheiden. Sind schon >= 60 % der Kader da, einmalig 1.5 s Nachfrist
         (mittlere Verbindung: Clip kommt gleich), sonst sofort überspringen. */
      const loaded=()=>{let n=0;for(let k=0;k<=f1;k++)if(bm.has(k)||lowBm.has(k))n++;return n/(f1+1);};
      setTimeout(()=>{if(started)return;if(loaded()>=.6)setTimeout(skip,1500);else skip();},INTRO_WAIT);
      }
    }
    /* Räume 1..N-1: eigener ScrollTrigger über die volle Raumhöhe; snap zieht auf 0 (noch nicht
       angekommen) oder camFrac (angekommen, Kader steht) — nie auf einen Zwischenwert (1.2/1.3). */
    /* v9 — der "kurze Hänger auf dem Haltekader": ScrollTrigger-snap schreibt window.scrollTo nativ, während Lenis
       gleichzeitig noch auf sein eigenes Ziel lerpt -> zwei Schreiber auf scrollY, ein paar Frames Gezitter/Stillstand
       genau beim Ankommen. Mit Lenis wird deshalb NUR über Lenis eingerastet (ein Schreiber): nach 160 ms Ruhe, erst wenn
       Lenis selbst zur Ruhe gekommen ist, in Scrollrichtung auf 0 bzw. REVEAL; jenseits von REVEAL+6 % (Verweilzone,
       Nutzer verlässt den Raum) wird nicht mehr gezogen. Ohne Lenis (Touch/Fallback) bleibt der ScrollTrigger-snap. */
    /* v9.1 — «Stationen»: Die Kamerafahrt hängt nicht mehr an der Scrollweite. Ein Trackpad-Wisch erzeugt 1500–3000 px
       Trägheit, die Fahrtzone eines Raums ist ~850 px — eine Geste überflog damit Fahrt UND Verweilzone («man sieht den
       Übergang nicht, die Pause ist winzig»). Jetzt: sobald der Scroll die Fahrtzone eines Raums betritt (p: 0 -> >0 bzw.
       aus der Verweilzone zurück), übernimmt die Seite und fährt in FLY_DUR s linear und GESPERRT (Lenis lock) bis zum
       Haltepunkt (p = CAM bzw. 0); frame = lerp(easeIO(p)) macht daraus die filmische Beschleunigung/Abbremsung.
       Nach der Ankunft wird die restliche Trackpad-Trägheit geschluckt (settle): die Seite steht, bis der Nutzer eine
       NEUE Geste macht -> die Verweildauer bestimmt er selbst. Verweilzone und Bögen scrollen normal.
       F.flyMode:'scrub' schaltet auf das reine Scroll-Scrubbing (v9) zurück. Ohne Lenis (Touch/Fallback) unverändert. */
    /* v9.2 — Variante C «Hybrid»: langsame Geste = Scrubbing (der Nutzer führt die Kamera selbst, Kader für Kader),
       schneller Wisch (Wheel-Summe > FLY_FAST px in 120 ms) = Autopilot-Fahrt wie oben. Wer mitten im Scrubben
       beschleunigt, übergibt an den Autopiloten; wer beim Scrubben stehen bleibt, wird von Lenis auf 0/CAM eingerastet.
       F.flyMode: 'hybrid' (Standard) · 'auto' (immer Autopilot) · 'scrub' (nie). */
    const FLY=!!(window.Smooth&&Smooth.on&&Smooth.fly&&F.flyMode!=='scrub');
    const HYBRID=FLY&&(F.flyMode||'hybrid')==='hybrid';
    const FLY_DUR=F.flyDur||2.2,FLY_FAST=F.flyFast||380;
    /* Hybrid: 60-fps video presents the flight; hidden canvas work is suspended until stall/error/end. */
    const VF=(window.FilmFX&&F.video)?FilmFX.VideoFlight({cam,F,onInvalidate:()=>{drawn=-1;kick();}}):null;
    /* Der erste Flug wird bereits während des Intros gepuffert. Der normale enter()-Warmup greift erst nach dem
       ersten Scroll-Update und kann auf einem kalten CDN zu spät kommen; dann bleibt zwar der Canvas-Fallback
       korrekt, aber das 60-fps-Video erscheint beim ersten schnellen Wisch nicht. */
    if(VF&&S[1]&&S[1].clip)setTimeout(()=>{if(alive&&VF)VF.warm(1,1);},1200);
    let flying=false,navLock=false,lastWheel=0;const zone=new Map();   /* je Raum: 'top' | 'fly' | 'scrub' | 'dwell' */
    const zoneOf=p=>p<=.002?'top':p>=CAM-.002?'dwell':'fly';
    const wheelWin=[];let wheelDir=1;
    let fastUntil=0;
    const onWheelTs=e=>{warmFirstFull();lastWheel=performance.now();if(e&&typeof e.deltaY==='number'){wheelWin.push([lastWheel,e.deltaY]);if(e.deltaY)wheelDir=e.deltaY>0?1:-1;while(wheelWin.length&&lastWheel-wheelWin[0][0]>120)wheelWin.shift();
      /* Lenis läuft dem echten Trackpad-Impuls hinterher. Das kurze Geschwindigkeitsfenster deshalb als Impuls-Latch halten,
         bis der geglättete Scroll tatsächlich die Flugzone erreicht; sonst wird ein schneller Wisch als langsames Scrubben verkannt. */
      let sum=0;for(const [,d] of wheelWin)sum+=Math.abs(d);if(sum>FLY_FAST)fastUntil=lastWheel+900;}};
    const wheelSpeed=()=>{const now=performance.now();let sum=0;for(const [t,d] of wheelWin)if(now-t<=120)sum+=Math.abs(d);return sum;};
    const fast=()=>!HYBRID||wheelSpeed()>FLY_FAST||performance.now()<fastUntil;
    addEventListener('wheel',onWheelTs,{passive:true,capture:true});
    /* Ankunft: Lenis anhalten, solange noch Trägheits-Wheel-Events eintreffen (max. 1.4 s) */
    function settle(){if(!alive)return;Smooth.stop();const t0=performance.now();lastWheel=t0;
      const tick=()=>{if(!alive){Smooth.start();return;}const now=performance.now();if(now-lastWheel>150||now-t0>1400){Smooth.start();return;}setTimeout(tick,50);};
      setTimeout(tick,160);}
    function startFlight(i,dir){if(!FLY||flying||!alive)return;const r=rooms[i];if(!r)return;const h=r.offsetHeight||1,top=absTop(r);
      const target=dir>0?Math.ceil(top+h*CAM)+1:Math.round(top);const dist=Math.abs(target-scrollY),full=h*CAM;
      const dur=Math.max(.7,FLY_DUR*Math.min(1,dist/Math.max(1,full)));
      flying=true;W.classList.add('is-flying');
      clearTimeout(snapT);
      const p0=clamp((scrollY-top)/h,0,1);if(VF)VF.start(i,dir,p0,dur,CAM);
      /* Fahrt-Anzeige: Ziel + Fortschrittslinie (--fly 0..1 aus der Scrollposition) */
      const dest=dir>0?S[i]:S[i-1]||S[0];if(flyEl){flyEl.querySelector('.w-fly-t').textContent='→ '+(dest.navLabel||dest.kicker||'');flyEl.style.setProperty('--fly','0');}
      const y0=scrollY,span=Math.max(1,Math.abs(target-y0));
      const prog=()=>{if(!flying||!alive)return;if(flyEl)flyEl.style.setProperty('--fly',clamp(Math.abs(scrollY-y0)/span,0,1).toFixed(3));requestAnimationFrame(prog);};requestAnimationFrame(prog);
      Smooth.fly(target,{duration:dur,onComplete:()=>{flying=false;W.classList.remove('is-flying');zone.set(i,dir>0?'dwell':'top');clearTimeout(snapT);if(flyEl)flyEl.style.setProperty('--fly','1');
        /* Kader liegt bereits (updateRoom p=CAM) auf dem Canvas → Video jetzt ausblenden, dann das nächste Segment vorwärmen */
        if(VF){VF.end();setTimeout(()=>{if(alive&&VF)VF.warm(dir>0?i+1:i,dir>0?1:-1);},600);}
        if(dir>0)settle();}});}
    /* Ausgelöst aus updateRoom(): Eintritt in die Fahrtzone von oben (vorwärts) oder aus der Verweilzone (rückwärts) */
    function flightCheck(i,p){if(!FLY||flying||navLock)return;const z=zoneOf(p),prev=zone.get(i)||(z==='fly'?'top':z);
      if(z!=='fly'){zone.set(i,z);return;}
      if(prev==='top'){if(fast()){zone.set(i,'fly');startFlight(i,1);}else zone.set(i,'scrub');return;}       /* von oben hinein: Wisch -> Autopilot, sonst Scrubben */
      if(prev==='dwell'){if(p<CAM-.03){if(fast()){zone.set(i,'fly');startFlight(i,-1);}else zone.set(i,'scrub');}return;}
      if(prev==='scrub'&&fast()){zone.set(i,'fly');startFlight(i,wheelDir);}}      /* beim Scrubben beschleunigt -> Autopilot übernimmt in Wischrichtung */
    const lenisSnap=!!(window.Smooth&&Smooth.on&&Smooth.lenis&&Smooth.lenis());
    let snapT=0,snapDir=1,snapLastP=-1;
    function armSnap(i,p){if(!lenisSnap)return;if(snapLastP>=0){const d=p-snapLastP;if(Math.abs(d)>1e-4)snapDir=d>0?1:-1;}snapLastP=p;clearTimeout(snapT);snapT=setTimeout(()=>trySnap(i),160);}
    function trySnap(i){if(!alive||cur!==i||document.hidden||flying||navLock)return;const L=Smooth.lenis();if(!L)return;
      if(L.isScrolling==='smooth'&&Math.abs(L.velocity||0)>.3){snapT=setTimeout(()=>trySnap(i),120);return;}
      const r=rooms[i],h=r.offsetHeight||1,top=absTop(r),p=(scrollY-top)/h;
      if(p<-.001||p>REVEAL+.06)return;
      const target=snapDir>0?(p>.03?REVEAL:0):(p<REVEAL-.03?0:REVEAL);
      if(Math.abs(p-target)<.012)return;
      const y=Math.round(top+h*target);
      Smooth.to(y,{duration:clamp(Math.abs(p-target)*2.2,.35,.85)});}
    const triggers=rooms.map((r,i)=>{
      if(i===0){
        /* Fix #1/#9: Raum 0 bekommt Ankunfts-Handler (onEnterBack = von unten zurück an den Seitenanfang). */
        return ScrollTrigger.create({trigger:r,start:'top top',end:'bottom top',
          onEnterBack:restoreScene0,onEnter:restoreScene0,
          onUpdate:s=>{
          const p=s.progress;drift.s=1+.05*p;drift.x=(-.8+1.6*p)*-1;drift.y=-.5*p;kick();
        }});
      }
      return ScrollTrigger.create({trigger:r,start:'top top',end:'bottom top',scrub:1,
        // Native-scroll fallback must not pull a user's material progress back to arrival.
        snap:lenisSnap?false:{snapTo:p=>p>REVEAL+.06?p:(p<REVEAL/2?0:REVEAL),duration:{min:.3,max:.8},delay:.15,ease:'power2.inOut'},
        /* Bereits am Endpunkt liegende Trigger senden beim Zurückkehren kein neues onUpdate.
           Deshalb Text UND Kader atomar aus dem aktuellen Fortschritt wiederherstellen. */
        onEnter:s=>{setupRoom(i);updateRoom(i,s.progress);},onEnterBack:s=>{setupRoom(i);updateRoom(i,s.progress);},
        onLeave:()=>{finalizeRoom(i,1);clearTimeout(snapT);},onLeaveBack:()=>{finalizeRoom(i,0);clearTimeout(snapT);},
        onUpdate:s=>{updateRoom(i,s.progress);armSnap(i,s.progress);}});
    });
    /* Blätter: Kader dahinter dunkelt/zoomt nach Abdeckung; Übergänge je Typ */
    const cover=()=>{let c=0,ce=0;sheets.forEach(sh=>{const r=sh.getBoundingClientRect();const vis=Math.max(0,Math.min(r.bottom,innerHeight)-Math.max(r.top,0));c=Math.max(c,vis/innerHeight);if(r.top>innerHeight*.25)ce=Math.max(ce,vis/innerHeight);});
      /* Bugfix (Block 3, Regression): der Footer (kein .w-sheet, ausserhalb von W) ist mit ~510px
         niedriger als der Viewport und erreicht daher selbst am absoluten Seitenende nie allein
         60% Sichtdeckung -> c fiel unter den Schwellwert -> is-covered fiel fälschlich weg -> Nav
         sprang am Footer wieder in den dunklen "über dem Foto"-Zustand (overhero/overfilm) zurück,
         obwohl nach dem Footer nichts mehr folgt. Fix: am Ende der scrollbaren Seite (kein weiteres
         Scrollen möglich) gilt die Stage immer als vollständig verdeckt. */
      if(innerHeight+scrollY>=document.documentElement.scrollHeight-4)c=1;
      lastCov=c;lastEnter=ce;cssValue(stage,'--cov',c.toFixed(3));cssValue(stage,'--ovo',clamp((cur===0?1.06:1.12)-c*(cur===0?3.6:2.4),0,1).toFixed(3));const cov=c>.6;document.documentElement.classList.toggle('in-film',!cov);if(cov!==W.classList.contains('is-covered')){W.classList.toggle('is-covered',cov);if(typeof syncNav==='function')syncNav();}};
    const sheetTweens=[];
    /* Mit Lenis (eigene Glättung) kurzer Scrub, sonst etwas länger — Blätter sind spätestens bei 'top 40%' komplett sichtbar */
    const SCRUB=(window.Smooth&&Smooth.on)?.25:.5;
    /* Block 3 (2.2): die 6 verschiedenen Ad-hoc-Tweens sind auf die 3 kanonischen Sheet-Kit-Typen konsolidiert
       (SheetKit aus motion.js, scrub-gebunden statt einmalig — dieselbe Logik wie die generischen .rv-Reveals,
       nur mit scrollTrigger.scrub statt once). Zuordnung nach Inhalt, nicht nach altem Typnamen:
       'up'/'band'  = reine Textsektionen (Versprechen, Abschluss)              -> fade (weiches Einblenden)
       'grow'       = Rechner-Karten, bleibt der eigene Scale-Stagger           -> unverändert
       'split'      = Referenzen-Bento (Fotoblock)                             -> wipe (architektonischer Schnitt)
       'cards'      = Case-Atlant-Foto links (wipe) + Kundenstimmen rechts (fade)
       'wipe'       = Ablauf/Etappen-Blatt, dominant Text/Timeline             -> fade */
    const SK=window.SheetKit;
    sheets.forEach(sh=>{const type=sh.dataset.type;const base={trigger:sh,start:'top 92%',end:'top 42%',scrub:SCRUB};
      if(type==='up'||type==='band'){sheetTweens.push(SK.fade(sh.querySelector('.w-paper'),{...base,y:56}));}
      else if(type==='grow'){const cards=qa(sh,'.w-grow');sheetTweens.push(gsap.fromTo(cards,{scale:.62,opacity:0,transformOrigin:sh.dataset.origin||'30% 60%'},{scale:1,opacity:1,ease:'none',stagger:.08,scrollTrigger:{trigger:sh,start:'top 90%',end:'top 35%',scrub:SCRUB}}));}
      /* Perf (v8.1b): der Referenz-Bogen (split) lief als scrub-gebundener clip-path-Wipe über das ganze Papier mit
         8 Fotos — clip-path wird pro Scroll-Frame neu gerastert (kein Compositor-Pfad) und kollidierte mit dem
         Decoding der gerade nachgeladenen Bilder -> spürbarer Hänger beim Einfahren. Jetzt transform/opacity. */
      else if(type==='split'){sheetTweens.push(SK.fade(sh.querySelector('.w-paper'),{...base,start:'top 90%',y:72}));
        sheetTweens.push(gsap.fromTo(sh.querySelector('.w-split-l'),{opacity:1},{opacity:0,ease:'none',scrollTrigger:{trigger:sh,start:'top 50%',end:'top 15%',scrub:SCRUB}}));}
      else if(type==='cards'){const l=sh.querySelector('.w-card-l'),r=sh.querySelector('.w-card-r');
        sheetTweens.push(SK.wipe(l,{...base,from:'inset(0 0 0 100%)'}));
        sheetTweens.push(SK.fade(r,{...base,start:'top 88%',y:36}));}
      else if(type==='wipe'){sheetTweens.push(SK.fade(sh.querySelector('.w-paper'),{...base,start:'top 90%',y:48}));}
    });
    /* Lenis nur innerhalb der Wohnung "schwerer" (1.8): wheelMultiplier .75 / lerp .085, ausserhalb Standard */
    const lenisTrigger=ScrollTrigger.create({trigger:W,start:'top top',end:'bottom bottom',
      onToggle:s=>{if(window.Smooth&&Smooth.setHeavy)Smooth.setHeavy(s.isActive);}});
    triggers.push(lenisTrigger);
    let covRaf=0;const onScroll=()=>{if(!covRaf)covRaf=requestAnimationFrame(()=>{covRaf=0;if(alive)cover();});};addEventListener('scroll',onScroll,{passive:true});
    const onResize=()=>{fit(cv);drawn=-1;hotDirty=true;if(hotL.__spatial){hotL.__spatial.key='';hotL.__spatial.close(false);}kick();cover();};addEventListener('resize',onResize);
    // ScrollTrigger temporarily unpins the stage while refreshing. Re-place labels once
    // its real viewport dimensions return, even when the photographic camera is idle.
    const stageObserver=typeof ResizeObserver==='function'?new ResizeObserver(onResize):null;if(stageObserver)stageObserver.observe(stage);
    /* Klicks: Grundriss-Räume, Chips, CTA-Start */
    /* Fix #10: Grundriss-Klick und "Rundgang"-Button springen ebenfalls in die Verweilzone (gotoRoom), nicht an die Raumkante */
    const onPlan=e=>{const p=e.target.closest('.w-pr');if(!p)return;const idx=S.findIndex(s=>s.room===p.dataset.room&&!s.flash);if(idx<0)return;gotoRoom(idx);};
    if(planHost)planHost.addEventListener('click',onPlan);
    const start=q(W,'#wStart');const onStart=()=>gotoRoom(1);if(start)start.addEventListener('click',onStart);
    const onDoc=e=>{if(!e.target.closest('.w-spatial-pop,.w-hs')){hotL.__spatial?.close(false);hotL.querySelectorAll('.w-hs.open').forEach(x=>{x.classList.remove('open');x.setAttribute('aria-expanded','false');});}};document.addEventListener('click',onDoc);
    /* Fix #3: nur Kader 0 sofort (= Poster, nahtlos); die Haltekader lädt playIntro()/finish() nach dem Clip */
    fit(cv);loadBitmap(introPlayed?S[0].f:0).then(()=>{if(!alive)return;drawn=-1;kick();});
    playIntro();cover();
    /* Preloader spätestens nach 1.8 s freigeben */
    setTimeout(()=>{document.documentElement.classList.remove('pre-hold');const pre=document.getElementById('pre');if(pre)pre.classList.add('gone');},1800);
    const cleanup=()=>{alive=false;introRunning=false;held.onload=held.onerror=null;if(heldUrl)URL.revokeObjectURL(heldUrl);held.remove();W.classList.remove('is-held');delete cv.__filmMoving;killIntroVideo();cmpOff();if(cmp){cmp.hidden=true;cmp.classList.remove('is-mat');}clearCache();if(VF)VF.destroy();clearTimeout(layerTimer);window.removeEventListener('pointerup',onCmpUp);window.removeEventListener('pointercancel',onCmpUp);if(raf)cancelAnimationFrame(raf);triggers.forEach(t=>{try{t.kill();}catch(e){}});sheetTweens.forEach(t=>{try{t.scrollTrigger&&t.scrollTrigger.kill();t.kill();}catch(e){}});
      resetReveal();if(window.Smooth&&Smooth.setHeavy)Smooth.setHeavy(false);
      removeEventListener('scroll',onScroll);removeEventListener('resize',onResize);if(stageObserver)stageObserver.disconnect();document.removeEventListener('click',onDoc);if(planHost)planHost.removeEventListener('click',onPlan);if(start)start.removeEventListener('click',onStart);
      W.removeEventListener('pointerdown',warmFirstFull);
      if(roomNav)roomNav.removeEventListener('click',onRoomNav);if(scrollHint)removeEventListener('scroll',onHintScroll);
      removeEventListener('wheel',onWheelTs,{capture:true});if(FLY){try{Smooth.start();}catch(e){}}W.classList.remove('is-flying');document.documentElement.classList.remove('in-film');
      if(covRaf)cancelAnimationFrame(covRaf);if(cmp&&cmpParent)cmpParent.append(cmp);
      bitmapReady=null;removeEventListener('pointermove',onPar);removeEventListener('keydown',onKey);Object.values(MAT).forEach(m=>m.destroy?.());
      W.classList.remove('is-full','is-drawn','is-driving','is-covered');document.documentElement.classList.remove('pre-hold');};
    /* Diagnose (nur lesend, QA-Skripte: dev/jsdom-smoke.js, Playwright) */
    window.__filmDebug={setupRoom,updateRoom,startFlight,gotoRoom,mat:()=>({on:matOn,p:matP}),vf:()=>VF&&VF.isActive(),cur:()=>cur};
    state={mode:'full',cleanup};return cleanup;
  }

  /* ================= lite (Telefon) ================= */
  function lite(root){
    unmount();
    /* v14 — Vertikaler Schnitt (film-mobile-v2.js): FILM.mobileV2.enabled oder ?mv2=1. Ist das Modul noch nicht geladen, wird es
       nachgeladen (kein Eintrag im HTML nötig) und lite() danach erneut aufgerufen; bis dahin läuft v1 wie bisher. */
    const wantV2=(()=>{const m=/[?&]mv2=([01])/.exec(location.search);return m?m[1]==='1':!!(F.mobileV2&&F.mobileV2.enabled);})();
    if(wantV2&&window.MobileFilmV2){const cleanup=MobileFilmV2.mount(root,{F,S,fillScene,countUp,goRoute,easeIO,clamp});state={mode:'lite',cleanup};return cleanup;}
    if(wantV2&&!window.__mv2Loading){window.__mv2Loading=true;
      const l=document.createElement('link');l.rel='stylesheet';l.href='css/mobile-film-v2.css';document.head.append(l);
      const s=document.createElement('script');s.src='js/film-mobile-v2.js';s.onload=()=>{if(window.MobileFilmV2&&document.getElementById('wohnung')&&state&&state.mode==='lite')lite(root);};document.head.append(s);}
    if(window.MobileFilm&&F.mobileVideo){const cleanup=MobileFilm.mount(root,{F,S,fillScene,countUp,goRoute,bindCompare});state={mode:'lite',cleanup};return cleanup;}
    const W=q(root,'#wohnung');if(!W)return null;
    const stage=q(W,'#wStage'),stills=qa(W,'.w-still'),hotL=q(W,'#wHot'),ov=q(W,'#wOv'),rooms=qa(W,'.w-room'),sheets=qa(W,'.w-sheet');
    if(!stage||!rooms.length)return null;
    W.classList.add('is-lite');W.classList.remove('is-full','is-plain');
    let cur=-1,raf=0,alive=true;
    const cmp=q(W,'#wCmp'),cmpImg=cmp&&cmp.querySelector('.w-cmp-after');const cmpOff=bindCompare(cmp,x=>{hotL.style.opacity=clamp((x-.2)/.3,0,1).toFixed(2);});
    const hudL=q(W,'#wHud');
    const loadStill=k=>{const st=stills[k];if(!st)return;const so=st.querySelector('source[data-srcset]'),im=st.querySelector('img[data-src]');if(so){so.srcset=so.dataset.srcset;delete so.dataset.srcset;}if(im){im.src=im.dataset.src;delete im.dataset.src;}};
    const show=i=>{if(i===cur)return;const first=cur<0&&i===0;loadStill(i);loadStill(i+1);cur=i;W.dataset.scene=i;stills.forEach((s,k)=>s.classList.toggle('on',k===i));if(hudL){hudL.querySelector('.k').textContent='Kader '+String(S[i].f).padStart(3,'0')+' · '+(S[i].navLabel||'');hudL.querySelector('b').textContent=String(i+1).padStart(2,'0')+' / '+String(rooms.length).padStart(2,'0');}const pm=q(W,'#wPopM');if(pm)pm.hidden=true;
      hotL.style.opacity='';if(cmp){const sc=S[i];if(sc.compareImgP&&cmpImg){const src=sc.compareImgP;if(cmpImg.getAttribute('src')!==src)cmpImg.src=src;cmp.style.setProperty('--x','.5');cmp.hidden=false;nudgeCompare(cmp,()=>{});}else cmp.hidden=true;}
      try{document.dispatchEvent(new CustomEvent('bs:event',{detail:{name:'tour_room',params:{room:S[i].room||S[i].id||String(i),index:i}}}));}catch(e){}   /* Analytics (lite) */
      fillScene(ov,S[i]);buildHotspots(hotL,{hot:(S[i].hot||[]).slice(0,2)},goRoute);qa(hotL,'.w-hs').forEach(el=>{if(+el.style.getPropertyValue('--hx')>50)el.classList.add('flip');});hotL.classList.remove('show');ov.classList.remove('show');
      const reveal=()=>{if(alive&&cur===i){ov.classList.add('show');hotL.classList.add('show');if(S[i].counters)countUp(ov,.9);}};
      if(first)reveal();else setTimeout(reveal,380);};
    const place=()=>{const st=stills[cur];const im=st&&st.querySelector('img');if(!im)return;const r=im.getBoundingClientRect(),iw=im.naturalWidth||1080,ih=im.naturalHeight||1920;
      const s=Math.max(r.width/iw,r.height/ih),dw=iw*s,dh=ih*s,dx=(r.width-dw)/2,dy=(r.height-dh)/2;
      /* v9: Obergrenze aus der ECHTEN Oberkante des Szenentextes (.w-ov) statt fixer 30/40 % — auf 375 px begann der
         Titel bereits bei ~30 %, der zweite Hotspot (bis 40 %) lag dann HINTER der Überschrift. Passt ein Hotspot nicht
         mehr darüber, wird er ausgeblendet statt in den Text geschoben. */
      const ovr=ov.getBoundingClientRect();const lim=(ovr.height>0&&ovr.top>r.top)?clamp(((ovr.top-r.top-64)/dh)*100,6,40):30;
      let py=-99;qa(hotL,'.w-hs').forEach(el=>{const x=+el.style.getPropertyValue('--hx');let y=Math.min(+el.style.getPropertyValue('--hy'),lim);
        /* Hotspots sind für 16:9 definiert; 9:16-Standbild zeigt den mittleren Ausschnitt -> x um die Mitte stauchen; untere Hälfte gehört dem Text; keine zwei auf einer Zeile */
        if(Math.abs(y-py)<9)y=py+11;if(y>lim+.01){el.style.display='none';return;}el.style.display='';py=y;
        const xx=50+(x-50)*(9/16)/(16/9)*2.2;el.style.left=(dx+dw*clamp(xx,6,94)/100).toFixed(1)+'px';el.style.top=(dy+dh*y/100).toFixed(1)+'px';});};
    const render=()=>{raf=0;if(!alive)return;let best=-1,bd=1e9;rooms.forEach((r,i)=>{const b=r.getBoundingClientRect();const d=Math.abs(b.top+b.height*.4-innerHeight*.5);if(b.top<innerHeight*.6&&b.bottom>innerHeight*.2&&d<bd){bd=d;best=i;}});
      if(best>=0)show(best);let c=0;sheets.forEach(sh=>{const r=sh.getBoundingClientRect();const vis=Math.max(0,Math.min(r.bottom,innerHeight)-Math.max(r.top,0));c=Math.max(c,vis/innerHeight);});
      if(innerHeight+scrollY>=document.documentElement.scrollHeight-4)c=1; /* gleicher Footer-Fix wie im full-Modus, siehe cover() oben */
      stage.style.setProperty('--cov',c.toFixed(3));stage.style.setProperty('--ovo',clamp(1-c*2.4,0,1).toFixed(3));const cov=c>.6;if(cov!==W.classList.contains('is-covered')){W.classList.toggle('is-covered',cov);if(typeof syncNav==='function')syncNav();}
      const pin=W.getBoundingClientRect().bottom>innerHeight;if(pin!==W.classList.contains('is-pinned')){W.classList.toggle('is-pinned',pin);if(typeof syncNav==='function')syncNav();}place();};
    const kick=()=>{if(!raf)raf=requestAnimationFrame(render);};
    addEventListener('scroll',kick,{passive:true});addEventListener('resize',kick);
    const start=q(W,'#wStart');const onStart=()=>scrollEl(rooms[1]);if(start)start.addEventListener('click',onStart);
    const popM=q(W,'#wPopM');
    const syncPop=()=>{if(!popM)return;const o=hotL.querySelector('.w-hs.open');if(!o){popM.hidden=true;return;}
      const pop=o.querySelector('.w-hs-pop');popM.innerHTML=`<span class="w-popm-t">${o.getAttribute('aria-label')||''}</span>${pop?pop.innerHTML:''}`;popM.hidden=false;
      const u=popM.querySelector('u');if(u){const src=pop&&pop.querySelector('u');u.addEventListener('click',ev=>{ev.stopPropagation();if(src)src.click();});}};
    const onHot=e=>{if(e.target.closest('.w-hs'))setTimeout(syncPop,0);};hotL.addEventListener('click',onHot,true);
    const onDoc=e=>{if(!e.target.closest('.w-hs')&&!e.target.closest('#wPopM')){hotL.querySelectorAll('.w-hs.open').forEach(x=>x.classList.remove('open'));if(popM)popM.hidden=true;}};document.addEventListener('click',onDoc);
    /* v10 — Gyroskop-Parallaxe auf dem Telefon: Standbild neigt sich mit dem Gerät (CSS --gx/--gy, gelerpt); iOS fragt beim ersten Touch */
    const gy=window.FilmFX?FilmFX.Gyro(g=>{stage.style.setProperty('--gx',g.x.toFixed(3));stage.style.setProperty('--gy',g.y.toFixed(3));}):null;
    const onFirstTouch=()=>{if(gy)gy.ask();window.removeEventListener('touchstart',onFirstTouch);};if(gy)window.addEventListener('touchstart',onFirstTouch,{passive:true,once:true});
    show(0);kick();
    const cleanup=()=>{alive=false;if(raf)cancelAnimationFrame(raf);removeEventListener('scroll',kick);removeEventListener('resize',kick);document.removeEventListener('click',onDoc);hotL.removeEventListener('click',onHot,true);cmpOff();if(cmp)cmp.hidden=true;if(start)start.removeEventListener('click',onStart);if(gy)gy.stop();window.removeEventListener('touchstart',onFirstTouch);W.classList.remove('is-lite','is-covered','is-pinned');};
    state={mode:'lite',cleanup};return cleanup;
  }

  /* ================= plain ================= */
  function plain(root){
    unmount();const W=q(root,'#wohnung');if(!W)return null;
    W.classList.add('is-plain');W.classList.remove('is-full','is-lite');
    const cleanup=()=>W.classList.remove('is-plain');state={mode:'plain',cleanup};return cleanup;
  }
  function auto(route){
    const name=(route&&route.name)||'home';if(name!=='home')return unmount();
    const live=window.Motion&&Motion.mode&&Motion.mode()!=='none';if(live)return;
    const root=document.getElementById('view');if(!root)return;
    if(reduced()||innerWidth>=1000||!hasGsap()&&innerWidth>=1000)plain(root);else lite(root);
  }
  window.Film={full,lite,plain,auto,unmount,mode:()=>state&&state.mode||'none'};
})();
