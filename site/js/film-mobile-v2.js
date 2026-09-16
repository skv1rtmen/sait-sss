/* BauStern — film-mobile-v2.js (v14) «Vertikaler Schnitt»
   Das Telefon bekommt denselben Film wie der Desktop, nicht einen Slider mit Pult:
   1. Nativer Scroll ohne Sperre. Kamera = Scrollposition (Kader-Scrub aus dem Kaderarchiv, wie film.js full()).
      Jeder Raum = Fahrt (0..CAM der Raumhöhe) + Verweilzone (CAM..1). Weiches scroll-snap nur auf den Beginn der Verweilzone.
   2. Kein Pult: keine Pfeile, kein Fortschritt, kein Replay, kein Vollbild. Nur eine kleine Raumkarte, die beim Ankommen kurz aufscheint.
   3. Pins statt Chips: die Desktop-Hotspots (scene.hot, Prozent des 16:9-Kaders) sitzen auf dem Bild, erscheinen gestaffelt in der
      Verweilzone; Tipp → Bottom-Sheet mit dem Kartentext. Chips/Karten-Reihe entfällt.
   4. Pan-Scan: solange keine Portrait-Kader (FILM.portrait.enabled) vorliegen, wird der 16:9-Kader Cover-gefittet und die Fahrt
      schwenkt seitlich von pan.from nach pan.to — man sieht über den Scrollweg mehr vom breiten Bild. Mit Portrait-Set: 1:1.
   5. Ankunft (FILM.ankunft.enabled): Szene 0 vor der Küche — Intro-Video Fassade→Tür, Halt «Tür offen», Übergang durch Weiss → Kader 0.
   Aktivierung: FILM.mobileV2.enabled oder ?mv2=1 (film.js lite() lädt dieses Modul nach). Bindet nur DOM aus pages.js wStage()/wRoom().
   API: window.MobileFilmV2.mount(root,{F,S,fillScene,countUp,goRoute,easeIO,clamp}) → cleanup(). */
(function(){
  'use strict';
  const clampF=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t;
  const easeIOF=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
  const isBm=im=>typeof ImageBitmap!=='undefined'&&im instanceof ImageBitmap;
  const okIm=im=>!!im&&(isBm(im)?im.width>0:(im.complete&&im.naturalWidth>0));
  const dim=im=>({w:isBm(im)?im.width:(im.naturalWidth||im.width||1280),h:isBm(im)?im.height:(im.naturalHeight||im.height||720)});
  const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  let introSeen=false;

  function mount(root,api){
    const F=api.F,fillScene=api.fillScene,countUp=api.countUp,goRoute=api.goRoute;
    const clamp=api.clamp||clampF,easeIO=api.easeIO||easeIOF;
    const W=root.querySelector('#wohnung');if(!W)return null;
    const q=s=>W.querySelector(s);
    const stage=q('#wStage'),cam=q('.w-cam'),cv=q('.w-canvas'),ov=q('#wOv'),hotL=q('#wHot'),flow=q('#wFlow'),cmp=q('#wCmp'),sig=q('#wSig'),hint=q('#wScrollHint'),startBtn=q('#wStart'),roomNav=q('#wRoomNav');
    const rooms0=[...W.querySelectorAll('.w-room')],sheets=[...W.querySelectorAll('.w-sheet')];
    if(!stage||!cam||!cv||!ov||!flow||!rooms0.length)return null;
    const V2=F.mobileV2||{},P=F.portrait||{};
    /* Portrait-Assets getrennt: Standbilder (s14p, Outpainting) können da sein, bevor Portrait-Kader (fp14) existieren.
       pStills: Haltebilder hochkant; pFrames: Scrub-Kader hochkant. Ohne pFrames laufen die Fahrten weiter als Pan-Scan
       des 16:9-Masters und blenden am Anfang/Ende in das hochkante Haltebild über. */
    /* v15: Hochkant-Assets nur bei hochkantem Viewport — quer gehaltenes Telefon/Tablet bekommt die 16:9-Kader und -Haltebilder */
    const portraitVp=innerHeight>innerWidth;
    const pStills=!!(P.enabled&&P.stillDir&&portraitVp),pFrames=!!(P.enabled&&P.dir&&portraitVp),usePortrait=pFrames;
    const AK=(F.ankunft&&F.ankunft.enabled)?F.ankunft:null;
    const CAM=clamp(V2.camFrac||.45,.2,.8),ROOM_VH=V2.roomVh||1.9,ROOM0_VH=V2.room0Vh||1.15,STAG=V2.pinStagger||.32,PINS_MAX=V2.pinsMax||3;
    const PAN=V2.pan||{};
    const ctx=cv.getContext('2d',{alpha:false});if(!ctx)return null;

    /* ---------- Szenen: optional Ankunft als Szene 0 davor ---------- */
    const S0=api.S||F.scenes;
    const S=AK?[Object.assign({},AK,{f:0,flash:true,ankunft:true,hero:true,final:false,sig:false,counters:null,rot:null})]
                .concat(S0.map((s,i)=>i===0?Object.assign({},s,{hero:false,kicker:AK.kuecheKicker||s.kicker,h:AK.kuecheH||s.h,counters:null,rot:null}):s))
             :S0.map((s,i)=>i===0?Object.assign({},s,{rot:null}):s);   /* kein rotierender Kicker-Zusatz auf dem Telefon */
    const off=AK?1:0;                       /* Index-Versatz zu FILM.scenes (Standbilder st{i}) */
    const stIndex=i=>i-off;
    const N=S.length;

    /* ---------- DOM: Räume, Blätter (Räume zuerst, Blätter danach als Aufklapper), Pins, Sheet, Raumkarte ---------- */
    W.classList.add('is-vcut');W.classList.remove('is-full','is-plain','is-lite');W.style.setProperty('--reveal','1');
    const flowOrder=[...flow.childNodes];
    let akRoom=null;
    if(AK){akRoom=document.createElement('section');akRoom.className='w-room v-room-ankunft';akRoom.dataset.scene='ankunft';akRoom.setAttribute('aria-label',esc(AK.kicker||'Ankunft'));
      akRoom.innerHTML=`<div class="w-room-in"><img src="${esc(AK.still)}" alt="${esc(AK.kicker+' — '+String(AK.h).replace(/<[^>]+>/g,''))}" loading="eager" decoding="async"><div class="w-room-txt"><p class="w-kicker">${esc(AK.kicker)}</p><h2 class="disp">${AK.h}</h2><p class="w-d">${esc(AK.d)}</p></div></div>`;}
    const rooms=akRoom?[akRoom].concat(rooms0):rooms0;
    flow.append(...rooms,...sheets);
    const savedVh=rooms.map(r=>r.style.getPropertyValue('--room-vh'));
    /* Letzter Raum bekommt +0.6 Bildschirmhöhen: seine Verweilzone soll nicht sofort von den Blättern zugedeckt werden. */
    rooms.forEach((r,i)=>{r.style.setProperty('--room-vh',String(i===0?ROOM0_VH:(i===rooms.length-1?ROOM_VH+.6:ROOM_VH)));r.dataset.vIndex=String(i);});
    /* Snap-Marker: Beginn der Verweilzone (nur Räume ≥ 1). scroll-snap-type liegt auf <html> (Klasse v-snap), proximity = weich. */
    /* Marker liegt 14 % HINTER dem Zonenbeginn: html hat scroll-padding-top (~84 px, Navigation) — der Snap landet also ~5 % früher;
       nach dem Einrasten ist man trotzdem sicher in der Verweilzone (Text + Pins sichtbar). */
    const coarse=matchMedia('(pointer:coarse)').matches;
    /* Auf dem Telefon KEIN scroll-snap: iOS zieht nach dem Momentum nach und das fühlt sich wie ein Ruckler an. Verweilzonen sind lang genug. */
    const markers=[];if(V2.snap!==false&&!coarse){rooms.forEach((r,i)=>{if(!i)return;const m=document.createElement('i');m.className='v-snap-pt';m.style.top=((CAM+.14)*100).toFixed(2)+'%';r.append(m);markers.push(m);});document.documentElement.classList.add('v-snap');}
    /* Blätter wie in v1: kompakte Aufklapper (bewährt, unverändert übernommen) */
    const sectionNames=['Leistungen & Versprechen','Kosten einschätzen','Arbeiten ansehen','Referenz & Kundenstimmen','So läuft Ihr Umbau'];
    const disclosures=[];
    sheets.filter(sh=>!sh.classList.contains('w-sheet--final')).forEach((sh,i)=>{const children=[...sh.childNodes],box=document.createElement('details'),summary=document.createElement('summary');box.className='m-section';
      summary.innerHTML=`<span class="m-section-n">0${i+1}</span><span>${sectionNames[i]||('Abschnitt '+(i+1))}</span><i aria-hidden="true">+</i>`;box.append(summary);children.forEach(c=>box.append(c));sh.append(box);disclosures.push({sh,box,children});});
    const extraSections=[];W.querySelectorAll('.w-sheet--final .w-paper > .sec:not(:first-child):not(.m-keep)').forEach(section=>{const heading=section.querySelector('h2');if(!heading)return;const box=document.createElement('details'),summary=document.createElement('summary');box.className='m-section m-section-extra';const t=document.createElement('span');t.textContent=heading.textContent;const icon=document.createElement('i');icon.textContent='+';icon.setAttribute('aria-hidden','true');summary.append(t,icon);section.before(box);box.append(summary,section);extraSections.push({section,box});});
    const duplicateReviews=[];W.querySelectorAll('.rv-track').forEach(track=>[...track.children].slice(track.children.length/2).forEach(r=>{duplicateReviews.push({review:r,hidden:r.hidden});r.hidden=true;}));
    if(hotL){hotL.replaceChildren();hotL.hidden=true;}
    if(cmp)cmp.hidden=true;
    if(hint)hint.classList.add('hide');
    const pins=document.createElement('div');pins.className='v-pins';pins.setAttribute('aria-label','Details zu diesem Raum');stage.append(pins);
    const sheet=document.createElement('dialog');sheet.className='v-sheet';sheet.setAttribute('aria-label','Raumdetail');stage.after(sheet);
    const card=document.createElement('div');card.className='v-room';card.setAttribute('aria-hidden','true');stage.append(card);
    const intro=document.createElement('video');intro.className='v-intro';intro.muted=true;intro.defaultMuted=true;intro.playsInline=true;intro.preload='auto';intro.setAttribute('muted','');intro.setAttribute('playsinline','');intro.setAttribute('aria-hidden','true');intro.disablePictureInPicture=true;cam.append(intro);
    const flashEl=document.createElement('div');flashEl.className='v-flash';flashEl.setAttribute('aria-hidden','true');stage.append(flashEl);
    if(startBtn){startBtn.hidden=false;startBtn.querySelector('i')&&(startBtn.querySelector('i').textContent='↓');}

    /* ---------- Kader-Archiv: Blobs (komprimiert, 2 Fahrten) + Bitmap-Fenster (≤ 40 dekodiert) ---------- */
    const frameDir=usePortrait?P.dir:(F.dirLow||F.dir),pad=F.pad||4,ext=F.ext||'.webp',FRAMES=F.frames||576;
    /* Telefon: jeder zweite Kader (6 fps) + Überblendung zum Nachbarn — halbiert Decodes und Speicher, sieht beim Scrubben gleich aus */
    const STEP=coarse?2:1;const snapK=k=>Math.round(k/STEP)*STEP;
    const srcFrame=k=>frameDir+'f'+String(k).padStart(pad,'0')+ext;
    const hasBitmap=typeof createImageBitmap==='function'&&typeof fetch==='function';
    const blobs=new Map(),bm=new Map(),pending=new Map(),failed=new Set();let gen=0,focus=0;
    const holdFrames=new Set(S.map(s=>s.f));
    function fetchBlob(k){if(blobs.has(k))return Promise.resolve(blobs.get(k));return fetch(srcFrame(k),{priority:'low'}).then(r=>{if(!r.ok)throw 0;return r.blob();}).then(b=>{blobs.set(k,b);return b;});}
    function loadImgEl(k){return new Promise((res,rej)=>{const im=new Image();im.decoding='async';im.onload=()=>{(im.decode?im.decode().catch(()=>{}):Promise.resolve()).then(()=>res(im));};im.onerror=rej;im.src=srcFrame(k);});}
    function loadFrame(k){if(bm.has(k))return Promise.resolve(bm.get(k));if(pending.has(k))return pending.get(k);if(failed.has(k))return Promise.resolve(null);
      const g=gen;const p=(hasBitmap?fetchBlob(k).then(b=>createImageBitmap(b)):loadImgEl(k)).then(im=>{pending.delete(k);if(g!==gen||!alive){if(im&&im.close)im.close();return null;}bm.set(k,im);capBitmaps();kick();return im;})
        .catch(()=>{pending.delete(k);failed.add(k);return null;});pending.set(k,p);return p;}
    /* v15.1: Fahrten sind länger (Übergang + Push-in ≈ 84–144 Kader, jeder zweite dekodiert) → Fenster 72 statt 40 Bitmaps (960×540 ≈ 2 MB je) */
    const BM_CAP=coarse?72:96;
    function capBitmaps(){if(bm.size<=BM_CAP)return;const keys=[...bm.keys()].filter(k=>!holdFrames.has(k)).sort((a,b)=>Math.abs(b-focus)-Math.abs(a-focus));while(bm.size>BM_CAP&&keys.length){const k=keys.shift(),im=bm.get(k);bm.delete(k);if(im&&im.close){try{im.close();}catch(e){}}}}
    function ensure(a,b,conc){a=Math.round(a);b=Math.round(b);const lo=Math.max(0,Math.min(a,b)),hi=Math.min(FRAMES-1,Math.max(a,b));const ks=[];
      for(let k=lo;k<=hi;k++)if((k%STEP===0||holdFrames.has(k))&&!bm.has(k)&&!pending.has(k)&&!failed.has(k))ks.push(k);
      ks.sort((x,y)=>Math.abs(x-focus)-Math.abs(y-focus));let i=0,active=0;const n=Math.min(ks.length,BM_CAP-8);
      const next=()=>{while(active<(conc||4)&&i<n){const k=ks[i++];active++;loadFrame(k).then(()=>{active--;next();});}};next();}
    function nearest(k){k=clamp(Math.round(k),0,FRAMES-1);if(bm.has(k))return k;for(let d=1;d<=24;d++){if(bm.has(k-d))return k-d;if(bm.has(k+d))return k+d;}return -1;}
    function prefetchBlobs(a,b){if(!hasBitmap)return;a=Math.round(a);b=Math.round(b);const lo=Math.max(0,Math.min(a,b)),hi=Math.min(FRAMES-1,Math.max(a,b));
      const ks=[];for(let k=lo;k<=hi;k++)if(!blobs.has(k)&&!failed.has(k))ks.push(k);let i=0,active=0;
      const next=()=>{if(!alive)return;while(active<2&&i<ks.length){const k=ks[i++];active++;fetchBlob(k).catch(()=>failed.add(k)).then(()=>{active--;next();});}};next();}
    /* Haltebilder (Standbilder / Ankunft) */
    const holds=new Map();
    const stillSrc=i=>{const s=S[i];if(s.ankunft)return pStills?(AK.holdP||AK.hold):AK.hold;
      if(s.mat||s.flash)return null;const j=stIndex(i);return pStills?P.stillDir+'st'+j+'.jpg':F.stillDir+'st'+j+'-1280.jpg';};
    function loadHold(i){if(holds.has(i))return holds.get(i);const u=stillSrc(i);if(!u){holds.set(i,null);return null;}const im=new Image();im.decoding='async';im.onload=()=>{(im.decode?im.decode().catch(()=>{}):Promise.resolve()).then(()=>{im.__ok=true;kick();});};im.src=u;holds.set(i,im);return im;}
    const holdIm=i=>{const im=holds.get(i);return im&&im.__ok?im:null;};
    /* Rückblende (Materialisierung) — Compositor aus film-fx.js, im Verweilbereich per Scroll 0..1 */
    const matIndex=S.findIndex(s=>s.mat);
    const matCfg=matIndex>=0?Object.assign({},S[matIndex].mat,usePortrait&&P.matDir?{compositeDir:P.matDir}:{}):null;
    const material=matCfg&&window.FilmFX&&FilmFX.Materialize?FilmFX.Materialize(matCfg):null;
    /* v15: Rückblende ohne Materialisierungs-Layer (nur img/compareImg, wie film.js flash): vorher = Rohbau-Standbild (hochkant: imgP),
       nachher = fertiger Raum (compareImgP); in der Verweilzone blendet der Scroll von Rohbau zu fertig (Vorher → Nachher). */
    const flashIndex=matIndex>=0?matIndex:S.findIndex(s=>s.flash&&!s.ankunft);
    const fsc=flashIndex>=0?S0[stIndex(flashIndex)]:null;
    const matAfter=fsc?loadHoldUrl((pStills&&fsc.compareImgP)||fsc.compareImg||F.stillDir+'st-flash-after.jpg'):null;
    const matBefore=fsc?loadHoldUrl(matCfg?(matCfg.compositeDir||matCfg.dir)+'step0.webp':((pStills&&fsc.imgP)||fsc.img)):null;
    const akStill=AK?loadHoldUrl(pStills&&AK.stillP?AK.stillP:AK.still):null;   /* Fassade, Tür zu — bis das Intro gelaufen ist */
    function loadHoldUrl(u){const im=new Image();im.decoding='async';im.onload=()=>{(im.decode?im.decode().catch(()=>{}):Promise.resolve()).then(()=>{im.__ok=true;kick();});};im.src=u;return im;}
    const okHold=im=>im&&im.__ok?im:null;

    /* ---------- Zeichnen: Cover-Fit + Pan ---------- */
    let cw=0,ch=0,dpr=1;
    function fit(){const w=cv.clientWidth||innerWidth,h=cv.clientHeight||innerHeight;const d=Math.min(2,window.devicePixelRatio||1);
      if(w!==cw||h!==ch||d!==dpr){cw=w;ch=h;dpr=d;cv.width=Math.round(w*d);cv.height=Math.round(h*d);ctx.setTransform(d,0,0,d,0,0);}}
    let pan=.5;
    function geomFor(iw,ih){const s=Math.max(cw/iw,ch/ih),dw=iw*s,dh=ih*s;const dx=dw>cw+1?(cw-dw)*pan:(cw-dw)/2,dy=(ch-dh)/2;return {dx,dy,dw,dh};}
    function put(im,alpha){if(!okIm(im))return false;const d=dim(im),g=geomFor(d.w,d.h);ctx.globalAlpha=alpha==null?1:alpha;ctx.drawImage(im,g.dx,g.dy,g.dw,g.dh);ctx.globalAlpha=1;return true;}
    let frame=0,drawnKey='',baseIm=null,mixIm=null,mixA=0,matP=-1;
    function draw(){fit();
      const imKey=im=>im?(im.src?im.src.slice(-32):'bm'):'';
      const key=[frame.toFixed(2),pan.toFixed(3),cw,ch,imKey(baseIm),imKey(mixIm),mixA.toFixed(3),matP.toFixed(3)].join('|');
      if(key===drawnKey)return;
      let drew=false;
      if(baseIm){drew=put(baseIm,1);if(mixIm&&mixA>0)drew=put(mixIm,mixA)||drew;}
      else{const k0=Math.floor(frame/STEP)*STEP,k1=Math.min(FRAMES-1,k0+STEP),t=(frame-k0)/STEP;
        const cur0=S[cur];const hold=(cur0&&Math.abs(frame-cur0.f)<.01)?holdIm(cur):null;
        if(hold)drew=put(hold,1);
        else{const j=nearest(t<.5?k0:k1);if(j>=0){focus=j;drew=put(bm.get(j),1);if(j===k0&&t>.02&&t<.98&&bm.has(k1)&&k1!==k0)put(bm.get(k1),t);}
          else{/* noch kein Kader geladen: bis zur Mitte der Fahrt das Halte-Bild des vorigen Raums, danach das Ziel */
            const prevH=cur>0?holdIm(cur-1):null,curH=holdIm(cur),mid=cur>0?(S[cur-1].f+S[cur].f)/2:0;const h2=(frame<mid?(prevH||curH):(curH||prevH));if(h2)drew=put(h2,1);}
        /* Überblendung über die Kader (Pan-Scan 16:9 ↔ hochkantes Haltebild am Anfang/Ende der Fahrt) */
        if(drew&&mixIm&&mixA>0)put(mixIm,mixA);}}
      if(drew){drawnKey=key;if(!W.classList.contains('is-drawn'))W.classList.add('is-drawn');placePins();}
    }

    /* ---------- Pins ---------- */
    let pinItems=[],pinScene=-1,pinsShown=false;
    const mapPin=(h,iw,ih)=>{const g=geomFor(iw,ih);return {x:g.dx+g.dw*h.x/100,y:g.dy+g.dh*h.y/100};};
    pins.style.setProperty('--stag',STAG+'s');
    /* Pins: hot[] ist in Prozent des 16:9-Kaders. Auf hochkanten Haltebildern (Outpainting: Original sitzt mittig, volle Breite,
       ~31.6 % der Höhe) wird automatisch umgerechnet; scene.hotP[k]={x,y} überschreibt pro Pin nach Sichtung. */
    function buildPins(i){pinScene=i;pins.replaceChildren();pinItems=[];const s=S[i];
      const list=(s.noPinsMobile?[]:(s.hot||[])).slice(0,PINS_MAX).map((h,k)=>{if(!pStills)return h;const o=s.hotP&&s.hotP[k];return Object.assign({},h,{x:o&&o.x!=null?o.x:h.x,y:o&&o.y!=null?o.y:(34.2+h.y*.316)});});
      list.forEach((h,k)=>{const b=document.createElement('button');b.type='button';b.className='v-pin';b.style.setProperty('--k',k);b.setAttribute('aria-label',h.t);b.dataset.k=k;
        b.innerHTML=`<i class="v-pin-dot"><b>${String(k+1).padStart(2,'0')}</b></i><span class="v-pin-lbl">${esc(h.t)}</span>`;pins.append(b);pinItems.push({h,b});});}
    function placePins(){if(pinScene<0||!pinItems.length)return;const s=S[pinScene];const iw=pStills?1080:1280,ih=pStills?1920:720;
      /* unter Navigation + Raumkarte, über dem Szenentext: Grenze aus der echten Oberkante von .w-ov (Hero-Text beginnt höher, SE-Screens sind kurz) */
      const ovr=ov.getBoundingClientRect();const topClear=118,bottomLimit=Math.max(ch*.3,Math.min(ch*.72,(ovr.height>0?ovr.top:ch*.72)-36));
      pinItems.forEach(({h,b},k)=>{const p=mapPin(h,iw,ih);let x=p.x,y=p.y;const vis=x>-8&&x<cw+8;
        if(!vis){b.classList.add('off');return;}b.classList.remove('off');
        x=clamp(x,26,cw-26);y=clamp(y,topClear,bottomLimit);
        b.classList.toggle('l',x>cw*.55);b.style.transform=`translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0)`;});}
    function showPins(on){if(pinsShown===on)return;pinsShown=on;pins.classList.toggle('on',on);}
    function openSheet(k){const it=pinItems[k];if(!it)return;const h=it.h,s=S[pinScene];
      sheet.innerHTML=`<button type="button" class="v-sheet-x" aria-label="Schliessen">×</button><span class="v-sheet-eyebrow">${esc(s.navLabel||'')} · ${String(k+1).padStart(2,'0')}</span><h3>${esc(h.t)}</h3>${h.l&&h.l[0]?`<p>${esc(h.l[0])}</p>`:''}${h.l&&h.l[1]?`<p class="v-sheet-sub">${esc(h.l[1])}</p>`:''}${h.go?`<button type="button" class="v-sheet-go">Mehr dazu <span aria-hidden="true">→</span></button>`:''}`;
      sheet.querySelector('.v-sheet-x').onclick=()=>closeSheet();const g=sheet.querySelector('.v-sheet-go');if(g)g.onclick=()=>{closeSheet();goRoute(h.go);};
      pinItems.forEach(({b},j)=>b.classList.toggle('open',j===k));
      try{sheet.showModal();}catch(e){sheet.setAttribute('open','');}
      try{document.dispatchEvent(new CustomEvent('bs:event',{detail:{name:'tour_hotspot',params:{room:s.room||s.id,title:h.t}}}));}catch(e){}}
    function closeSheet(){if(sheet.open){try{sheet.close();}catch(e){sheet.removeAttribute('open');}}pinItems.forEach(({b})=>b.classList.remove('open'));}
    const onPin=e=>{const b=e.target.closest('.v-pin');if(!b||!pins.contains(b))return;e.preventDefault();openSheet(+b.dataset.k);};
    const onSheetClick=e=>{if(e.target===sheet)closeSheet();};
    sheet.addEventListener('click',onSheetClick);sheet.addEventListener('cancel',e=>{e.preventDefault();closeSheet();});pins.addEventListener('click',onPin);

    /* ---------- Szenenwechsel ---------- */
    let cur=-1,covered=false,cardTimer=0,textOn=false;
    const timers=new Set(),later=(fn,ms)=>{const t=setTimeout(()=>{timers.delete(t);if(alive)fn();},ms);timers.add(t);return t;};
    /* Sichtbarer Anteil der Kaderbreite bei Cover-Fit (Hochkant: Höhe bindet) */
    const visFrac=()=>usePortrait?1:Math.min(1,(cw/Math.max(1,ch))/(16/9));
    /* Haltefokus so wählen, dass möglichst viele Pins im sichtbaren Streifen liegen (Daten-Fokus bricht Gleichstand). */
    const panCache=new Map();
    function fitPan(i,base){const s=S[i];const list=(s.hot||[]).slice(0,PINS_MAX);const v=visFrac();if(usePortrait||!list.length||v>=1)return base;
      const key=i+'|'+cw+'|'+ch;if(panCache.has(key))return panCache.get(key);
      const cands=[base*(1-v)].concat(list.map(a=>clamp(a.x/100-.035,0,1-v)),list.map(a=>clamp(a.x/100-v+.035,0,1-v)));let best=null;
      for(const x0 of cands){const n=list.filter(b=>b.x/100>=x0+.012&&b.x/100<=x0+v-.012).length;const pan=x0/(1-v);const score=n*10-Math.abs(pan-base)*2;if(!best||score>best.score)best={score,pan};}
      const r=best?clamp(best.pan,0,1):base;panCache.set(key,r);return r;}
    function panFor(i){const s=S[i];const c=PAN[s.id]||PAN[s.room]||{};const to0=c.to!=null?c.to:.5,from0=c.from!=null?c.from:to0;if(usePortrait)return {from:.5,to:.5};
      const to=fitPan(i,to0);const from=c.from!=null?from0:clamp(to+(to0-to)*.5+(to>.5?-.12:.12),0,1);return {from,to};}
    function setScene(i){if(i===cur)return;const prev=cur;cur=i;W.dataset.scene=String(i);
      const s=S[i];fillScene(ov,s);ov.classList.remove('show');textOn=false;
      if(sig){sig.hidden=!s.sig;if(s.sig)[...sig.querySelectorAll('path')].forEach((p,k)=>{p.style.transition='none';p.style.strokeDashoffset='0';try{p.animate([{opacity:0},{opacity:1}],{duration:950,delay:600+k*110,fill:'backwards'});}catch(e){}});}
      buildPins(i);showPins(false);closeSheet();
      loadHold(i);if(i+1<N)loadHold(i+1);if(i>0)loadHold(i-1);
      if(material){if(i===matIndex||i===matIndex-1)material.mount(cam,kick);if(i!==matIndex)material.hide();}
      /* Raumkarte kurz einblenden (kein Pult, nur ein Titel) */
      card.textContent=(s.navLabel||s.kicker||'');card.classList.add('on');clearTimeout(cardTimer);cardTimer=setTimeout(()=>card.classList.remove('on'),1900);
      try{document.dispatchEvent(new CustomEvent('bs:event',{detail:{name:'tour_room',params:{room:s.room||s.id||String(i),index:i}}}));}catch(e){}
      /* Prefetch: diese Fahrt vollständig, die nächste als Blobs */
      if(i>0&&!S[i].flash&&!S[i-1].ankunft)ensure(S[i-1].f,S[i].f,4);
      if(i+1<N&&!S[i+1].flash)prefetchBlobs(S[i].f,S[i+1].f);
      /* v15.1: erste Fahrt schon während des Intros dekodieren — der erste Wisch soll nie auf Kader warten */
      if(i===0&&N>1&&!S[1].flash)later(()=>ensure(S[0].f,S[1].f,3),600);
      if(prev<0&&i===0)startIntro();
    }
    function showText(on){if(textOn===on)return;textOn=on;ov.classList.toggle('show',on);if(on&&S[cur]&&S[cur].counters)countUp(ov,.9);}

    /* ---------- Intro (einmal, nicht scrollgetrieben) ---------- */
    let introRunning=false,introDone=introSeen;
    function introSrc(){const portrait=innerHeight>innerWidth;
      if(AK&&AK.video){if(portrait&&AK.video.portrait)return AK.video.portrait;if(window.FilmFX&&FilmFX.Codecs)return FilmFX.Codecs.src(AK.video.base,AK.video.codecs);return AK.video.base+'.h264.mp4';}
      const MV=F.mobileVideo;if(!MV)return null;const c=navigator.connection||{};const eco=!!(c.saveData||/^(slow-)?[23]g$/.test(c.effectiveType||''));
      const dir=portrait?(eco?(MV.fallbackPortraitDir||MV.portraitDir||MV.fallbackDir||MV.dir):(MV.portraitDir||MV.dir)):(eco?(MV.fallbackDir||MV.dir):MV.dir);return dir?dir+'intro.mp4':null;}
    function startIntro(){if(introDone||introRunning||document.hidden)return;if(scrollY>40){introDone=true;return;}const src=introSrc();if(!src){introDone=true;return;}
      introRunning=true;let token=++introGen;intro.src=src;intro.load();
      const finish=()=>{if(token!==introGen)return;introGen++;introRunning=false;introDone=true;introSeen=true;intro.classList.remove('on');later(()=>{try{intro.pause();}catch(e){}},260);showText(true);showPins(true);kick();};
      intro.onended=finish;intro.onerror=finish;
      later(finish,((AK&&AK.video&&AK.video.dur)||(F.introSources&&F.introSources.dur)||3.4)*1000+2500);   /* Wächter: hängt das Video, endet das Intro trotzdem */
      /* Ankunft-Clip (8 s) läuft mit 1.45× — die Annäherung an die Tür soll nicht länger als ~5.5 s dauern */
      try{intro.playbackRate=AK&&AK.video?(AK.video.rate||1.45):((F.mobileVideo&&F.mobileVideo.rate)||1);}catch(e){}
      const pr=intro.play();(pr&&pr.then?pr:Promise.resolve()).then(()=>{if(token!==introGen)return;intro.classList.add('on');}).catch(()=>{finish();});
      /* Eine Geste während des Intros: nicht hart abbrechen (Sprung von der Fassade ins Treppenhaus), sondern die Tür schnell
         zu Ende öffnen (4×) und dann halten — der Finger gewinnt, das Bild bleibt kontinuierlich */
      const abort=()=>{if(token!==introGen||!introRunning)return;try{intro.playbackRate=2;}catch(e){}later(()=>{if(token===introGen&&introRunning)finish();},3200);};   /* iOS: Rate > 2 unzuverlässig */
      window.addEventListener('touchmove',abort,{passive:true,once:true});window.addEventListener('wheel',abort,{passive:true,once:true});}
    let introGen=0;

    /* ---------- Scroll → Szene, Kader, Pan, Text, Pins ---------- */
    let raf=0,alive=true;
    /* Geometrie einmal messen (kein getBoundingClientRect pro Frame — auf iOS ist Layout-Lesen während des Scrollens die Hauptquelle von Rucklern) */
    let geo={tops:[],hs:[],sheetTop:Infinity,wBottom:0,vh:innerHeight,vw:innerWidth};
    function measure(){const y0=scrollY;geo.vh=innerHeight;geo.vw=innerWidth;geo.tops=rooms.map(r=>r.getBoundingClientRect().top+y0);geo.hs=rooms.map(r=>Math.max(1,r.getBoundingClientRect().height));
      geo.sheetTop=sheets[0]?sheets[0].getBoundingClientRect().top+y0:Infinity;geo.wBottom=W.getBoundingClientRect().bottom+y0;}
    /* Geglättete Scrollposition: der Kader folgt dem Finger mit leichter Trägheit (kein Scroll-Hijacking — nur die Bildquelle wird geglättet) */
    let sy=scrollY,syT=scrollY,lastScrollAt=0;
    /* v15.1: Glättung enger am Finger (.34 statt .24) — weniger «Nachziehen» beim Wischen, bleibt aber ohne Kader-Springen */
    function update(){const now=performance.now();syT=scrollY;const gap=syT-sy;sy=Math.abs(gap)<.4?syT:sy+gap*(Math.abs(gap)>400?.6:.34);
      /* Canvas nur neu rastern, wenn Breite wechselt oder Ruhe herrscht (iOS-Adressleiste ändert die Höhe mitten im Scroll) */
      if(cv.clientWidth!==cw||(now-lastScrollAt>260&&Math.abs(gap)<.5))fit();
      const vh=geo.vh;let i=-1,p=0;
      for(let k=0;k<rooms.length;k++){const top=geo.tops[k]-sy;if(top<=vh*.02&&top+geo.hs[k]>vh*.02){i=k;p=clamp(-top/geo.hs[k],0,1);break;}}
      if(i<0){if(geo.tops[0]-sy>0){i=0;p=0;}else{i=rooms.length-1;p=1;}}
      /* Blätter decken den Film erst ab, wenn sie das obere Drittel erreichen — die Verweilzone des letzten Raums bleibt frei. */
      const st=geo.sheetTop-sy;const nextCovered=st<vh*.3;
      if(nextCovered!==covered){covered=nextCovered;W.classList.toggle('is-covered',covered);if(covered)closeSheet();if(typeof syncNav==='function')syncNav();}
      const fade=clamp((vh*.62-st)/Math.max(1,vh*.5),0,1);stage.style.setProperty('--cov',fade.toFixed(3));stage.style.setProperty('--ovo',(1-fade).toFixed(3));
      const pinned=geo.wBottom-sy>vh;if(pinned!==W.classList.contains('is-pinned')){W.classList.toggle('is-pinned',pinned);if(typeof syncNav==='function')syncNav();}
      if(i!==cur)setScene(i);
      const s=S[i],prev=i>0?S[i-1]:null;const pn=panFor(i);
      baseIm=null;mixIm=null;mixA=0;matP=-1;
      if(i===0){frame=s.f;pan=pn.to;flashEl.style.opacity='0';
        if(s.ankunft){baseIm=introDone?(okHold(holdIm(0))||okHold(akStill)):(okHold(akStill)||okHold(holdIm(0)));}
        /* Hero-Text bleibt über Raum 0 sichtbar (auch während des Intros); Pins erst nach dem Intro */
        showText(true);showPins(introDone&&p<.6);}
      else if(p<CAM){const t=easeIO(p/CAM);pan=lerp(pn.from,pn.to,t);showText(false);showPins(false);
        if(prev.ankunft){/* Tür offen → Weissblende → Kader 0 → Fahrt in die Küche */const u=p/CAM;
          if(u<.28){baseIm=okHold(holdIm(0));frame=0;flashEl.style.opacity=(Math.sin(u/.28*Math.PI)*.9).toFixed(3);}
          else{flashEl.style.opacity='0';const tt=easeIO((u-.28)/.72);frame=lerp(0,s.f,tt);if(!bm.has(snapK(frame)))ensure(0,s.f,4);
            if(pStills&&!pFrames&&tt>.7){mixIm=holdIm(i);mixA=(tt-.7)/.3;}}}
        else if(s.flash){/* Rückblende: Überblendung Halt(vorher) → Rohbau */baseIm=okHold(holdIm(i-1));mixIm=okHold(matBefore);mixA=t;frame=prev.f;if(material)material.hide();}
        else if(prev.flash){/* aus der Rückblende: fertiges Bild → Haltekader der nächsten Szene */baseIm=okHold(matAfter)||okHold(holdIm(i-1));mixIm=holdIm(i)||(nearest(s.f)>=0?bm.get(nearest(s.f)):null);mixA=t;frame=s.f;if(material)material.hide();}
        else{frame=lerp(prev.f,s.f,t);if(p>.02&&!bm.has(snapK(frame)))ensure(prev.f,s.f,4);
          /* Hochkant-Haltebilder + 16:9-Kader: Ein- und Ausblenden des Haltebilds, damit der Wechsel des Ausschnitts weich ist */
          if(pStills&&!pFrames){if(t<.3){mixIm=holdIm(i-1);mixA=1-t/.3;}else if(t>.7){mixIm=holdIm(i);mixA=(t-.7)/.3;}}}
      }
      else{/* Verweilzone */const d=(p-CAM)/Math.max(.05,1-CAM);pan=pn.to;frame=s.f;flashEl.style.opacity='0';
        if(s.flash&&material){matP=clamp(d*1.15,0,1);material.present(matP);baseIm=okHold(matBefore)||okHold(holdIm(i-1));W.dataset.materialProgress=matP.toFixed(3);}
        else if(s.flash){/* v15: Rohbau → fertig, scrollgetrieben (erst ~40 % Verweilzone Rohbau zeigen, dann überblenden) */
          matP=clamp((d-.38)/.5,0,1);baseIm=okHold(matBefore)||okHold(holdIm(i-1));mixIm=okHold(matAfter);mixA=easeIO(matP);W.dataset.materialProgress=matP.toFixed(3);}
        showText(d>.015);showPins(d>.05);
        if(i+1<N&&!S[i+1].flash&&d>.3)ensure(s.f,S[i+1].f,2);
      }
      if(!s.flash&&material&&i!==matIndex)material.hide();
      stage.style.setProperty('--m-focal',(pan*100).toFixed(1)+'%');
      focus=Math.round(frame);
      if(!covered)draw();
      if(Math.abs(syT-sy)>=.4)kick();   /* Glättung läuft weiter, bis der Kader die Scrollposition eingeholt hat */
    }
    function render(){raf=0;if(!alive)return;update();}
    function kick(){if(!raf&&alive)raf=requestAnimationFrame(render);}
    const onScroll=()=>{lastScrollAt=performance.now();kick();};
    let resizeT=0;
    const onResize=()=>{/* iOS: Adressleiste ein/aus ändert nur die Höhe — das ist kein Layoutwechsel, nur Breite zählt sofort */
      clearTimeout(resizeT);resizeT=setTimeout(()=>{measure();drawnKey='';panCache.clear();kick();},innerWidth!==geo.vw?0:220);};
    const onVis=()=>{if(!document.hidden)kick();};
    const onStart=e=>{e.preventDefault();const r=rooms[1];if(!r)return;const y=r.getBoundingClientRect().top+scrollY+r.offsetHeight*(CAM+.02);window.scrollTo({top:Math.round(y),behavior:'smooth'});};
    const onNav=e=>{const b=e.target.closest('.w-roomnav-dot');if(!b)return;const i=+b.dataset.i+off;const r=rooms[i];if(!r)return;e.preventDefault();const y=i===0?0:r.getBoundingClientRect().top+scrollY+r.offsetHeight*(CAM+.02);window.scrollTo({top:Math.round(y),behavior:'smooth'});};
    addEventListener('scroll',onScroll,{passive:true});addEventListener('resize',onResize);document.addEventListener('visibilitychange',onVis);
    if(startBtn)startBtn.addEventListener('click',onStart);if(roomNav)roomNav.addEventListener('click',onNav);
    /* Erster Kader sofort: Haltebild Szene 0 (+ Ankunft-Standbild), dann Intro */
    measure();later(measure,600);loadHold(0);if(N>1)loadHold(1);kick();
    window.__mv2={get:()=>({cur,frame:+frame.toFixed(2),pan:+pan.toFixed(3),bm:bm.size,pending:pending.size,blobs:blobs.size,failed:[...failed].slice(0,6),introDone,covered,textOn,pinsShown,drawnKey})};

    return function cleanup(){alive=false;gen++;introGen++;timers.forEach(clearTimeout);clearTimeout(cardTimer);clearTimeout(resizeT);if(raf)cancelAnimationFrame(raf);
      removeEventListener('scroll',onScroll);removeEventListener('resize',onResize);document.removeEventListener('visibilitychange',onVis);
      if(startBtn)startBtn.removeEventListener('click',onStart);if(roomNav)roomNav.removeEventListener('click',onNav);
      pins.removeEventListener('click',onPin);sheet.removeEventListener('click',onSheetClick);closeSheet();
      try{intro.pause();intro.removeAttribute('src');intro.load();}catch(e){}intro.remove();flashEl.remove();pins.remove();sheet.remove();card.remove();
      if(material)material.destroy();
      for(const im of bm.values()){if(im&&im.close){try{im.close();}catch(e){}}}bm.clear();blobs.clear();pending.clear();
      markers.forEach(m=>m.remove());document.documentElement.classList.remove('v-snap');
      rooms.forEach((r,i)=>{if(savedVh[i])r.style.setProperty('--room-vh',savedVh[i]);else r.style.removeProperty('--room-vh');delete r.dataset.vIndex;});
      extraSections.forEach(({section,box})=>{box.before(section);box.remove();});duplicateReviews.forEach(({review,hidden})=>{review.hidden=hidden;});
      disclosures.forEach(({sh,box,children})=>{children.forEach(c=>sh.append(c));box.remove();});
      if(akRoom)akRoom.remove();flow.replaceChildren(...flowOrder);
      if(hotL)hotL.hidden=false;if(cmp)cmp.hidden=true;
      stage.style.removeProperty('--m-focal');delete W.dataset.materialProgress;
      W.classList.remove('is-vcut','is-covered','is-pinned','is-drawn');W.style.removeProperty('--reveal');};
  }
  window.MobileFilmV2={mount};
})();
