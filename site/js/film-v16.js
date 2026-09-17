/* BauStern — film-v16.js · Engine B, Stufe 1: Video-Flüge statt Scroll-Scrubbing.
   ------------------------------------------------------------------------------------------------
   Modell: Der Film hängt NICHT mehr an der Scroll-Position. Solange der Besucher «im Haus» ist, ist die
   Seite gepinnt; Rad/Swipe/Pfeiltasten/Punkte sind reine ABSICHT («ein Kapitel weiter / zurück»).
   Zustände:  HOLD(k)  ·  FLY(k→k+1)  ·  FLY(k+1→k)      (Laden/Fehler sind interne Unterzustände)
   Flug  = normales <video> (v16/clips/<a>-<b>-<L|P>.fwd.mp4), zurück = .rev.mp4 (NIE playbackRate=-1).
   Halt  = v16/stills/<room>-<L|P>.jpg — identisch mit dem letzten Kader des ankommenden Clips.
   Kapitel (Etappe 8): 0 ankunft · 1 schwelle · 2 kueche · 3 bad · 4 schlaf · 5 wohnen · 6 eingang.
   Die Rückblende ist seit Etappe 8 KEIN Kapitel mehr, sondern eine Geste in «Wohnen» (stage5-v16.js §4.4) —
   damit hat jede Strecke einen echten Clip, der Wischer und der Vorher/Nachher-Regler sind entfallen.
   Öffentliche API wie bei film.js: Film.full/lite/plain/auto/unmount/mode + Film.v16 (Debug/Tests).
   ------------------------------------------------------------------------------------------------ */
(function(){
  if(typeof FILM_V16==='undefined'||typeof FILM==='undefined'||FILM.engine!=='v16')return;
  const F=FILM_V16,S=F.scenes,N=S.length;
  const V=F.v16,ROOMS=V.rooms,LEGS=V.legs,DUR=V.clipDur;
  const qs=(r,s)=>r.querySelector(s),qa=(r,s)=>Array.prototype.slice.call(r.querySelectorAll(s));
  const clamp=(v,a,b)=>v<a?a:v>b?b:v;
  const reduced=()=>matchMedia('(prefers-reduced-motion:reduce)').matches;
  const orient=()=>innerHeight>innerWidth?'P':'L';
  const isPhone=()=>matchMedia('(max-width:760px)').matches;
  /* Etappe 5: Stammdaten der Kammer-Mechaniken liegen in FILM_V16.s5[id] (data.js), nicht in der Szene
     selbst — so bleibt scenes[] mit ?film=15 kompatibel. */
  const s5of=scene=>(scene&&F.s5&&F.s5[scene.id])||null;
  const sceneMech=scene=>{const c=s5of(scene);return c&&c.mech||null;};
  const goRoute=g=>{if(typeof go==='function')go(g);else location.href='/'+String(g).replace(/^\/+/,'');};

  /* ---------- Netz/Gerät: leichter Tier (720p) ---------- */
  let TIER='hd',tierProbe=null;
  function pickTier(){
    const m=/[?&]tier=(hd|lite)\b/.exec(location.search);if(m)return m[1];      /* Testschalter */
    const n=navigator,c=n.connection||n.mozConnection||n.webkitConnection;
    if((n.deviceMemory&&n.deviceMemory<=2)||(n.hardwareConcurrency&&n.hardwareConcurrency<=2))return 'lite';
    if(c){
      if(c.saveData)return 'lite';
      const e=c.effectiveType||'';
      if(e==='slow-2g'||e==='2g'||e==='3g')return 'lite';
      /* downlink ist auf frischen Profilen anfangs konservativ — nur ein wirklich schlechter Wert zählt */
      if(e==='4g'&&typeof c.downlink==='number'&&c.downlink>0&&c.downlink<1)return 'lite';
      return 'hd';
    }
    return 'probe';   /* ohne Network Information API (Safari/Firefox): Messung am ersten Standbild */
  }
  /* Fallback-Messung: Ladezeit des ersten Haltebildes (bekannte Grösse) -> grobe Bandbreite. */
  function probeBandwidth(url,bytes){
    if(tierProbe)return tierProbe;
    const t0=performance.now();
    tierProbe=fetch(url,{cache:'reload'}).then(r=>r.blob()).then(b=>{
      const s=(performance.now()-t0)/1000,mbit=(b.size*8)/1e6/Math.max(s,.05);
      if(mbit<2.2)TIER='lite';else TIER='hd';
      return TIER;
    }).catch(()=>{TIER='hd';return TIER;});
    return tierProbe;
  }
  const clipUrl=(id,dirn)=>(TIER==='lite'?V.liteDir:V.clipDir)+id+'.'+dirn+'.mp4';
  const edgeUrl=(id,which)=>V.clipDir+id+'.'+which+'.jpg';     /* erster/letzter Kader als Bild */
  const stillUrl=(k,o)=>V.stillDir+ROOMS[k]+'-'+(o||orient())+'.jpg';
  const depthUrl=(k,o)=>V.depthDir?V.depthDir+ROOMS[k]+'-'+(o||orient())+'.webp':null;
  const legIx=(from,to)=>Math.min(from,to);
  const legOf=(from,to)=>LEGS[legIx(from,to)];
  /* Strecken, deren Anfangskader NICHT der Halt der Ausgangskammer ist (Rückblende → Wohnen-Blickwinkel):
     dort wird vor dem Video kurz in den ersten Kader geblendet, und beim Zurückkommen aus ihm heraus. */
  const needFade=(from,to)=>(V.fadeInLegs||[]).indexOf(legIx(from,to))>=0;

  /* ---------- Video-Pool: warme, dekodierbereite Elemente ---------- */
  const POOL_MAX=6;
  const pool=new Map();                 /* url -> {v, ready:Promise<void>, used:number} */
  let poolHost=null;
  function makeVideo(url){
    const v=document.createElement('video');
    v.className='v16-v';v.muted=true;v.defaultMuted=true;v.playsInline=true;
    v.setAttribute('playsinline','');v.setAttribute('webkit-playsinline','');v.setAttribute('muted','');
    v.preload='auto';v.disablePictureInPicture=true;v.tabIndex=-1;v.setAttribute('aria-hidden','true');
    v.crossOrigin='anonymous';v.src=url;
    const ready=new Promise(res=>{
      if(v.readyState>=3)return res();
      const ok=()=>{v.removeEventListener('canplay',ok);v.removeEventListener('loadeddata',ok);res();};
      v.addEventListener('canplay',ok);v.addEventListener('loadeddata',ok);
      v.addEventListener('error',()=>res(),{once:true});
      setTimeout(res,9000);
    });
    (poolHost||document.body).appendChild(v);
    try{v.load();}catch(e){}
    return {v,ready,used:performance.now()};
  }
  function warm(url){
    if(!url)return null;
    let e=pool.get(url);
    if(e){e.used=performance.now();return e;}
    e=makeVideo(url);pool.set(url,e);trimPool();return e;
  }
  function trimPool(keep){
    if(pool.size<=POOL_MAX)return;
    const items=[...pool.entries()].filter(([u,e])=>!e.active&&u!==keep).sort((a,b)=>a[1].used-b[1].used);
    while(pool.size>POOL_MAX&&items.length){
      const [u,e]=items.shift();pool.delete(u);
      try{e.v.pause();e.v.removeAttribute('src');e.v.load();}catch(x){}
      e.v.remove();
    }
  }
  function dropPool(){pool.forEach(e=>{try{e.v.pause();e.v.removeAttribute('src');e.v.load();}catch(x){}e.v.remove();});pool.clear();}

  /* Ist der Kader an der aktuellen Position dekodiert und damit sofort darstellbar?
     WICHTIG: requestVideoFrameCallback feuert erst, wenn ein Kader KOMPONIERT wird — bei einem pausierten,
     unsichtbaren <video> also nie. Darum zählt hier readyState (>=2 = HAVE_CURRENT_DATA); nach einem Seek
     liefert bereits 'seeked' die Garantie. rVFC wird nur benutzt, wenn das Video schon sichtbar läuft. */
  function frameReady(v){
    if(v.readyState>=2)return Promise.resolve();
    return new Promise(res=>{
      const ok=()=>{v.removeEventListener('loadeddata',ok);v.removeEventListener('canplay',ok);res();};
      v.addEventListener('loadeddata',ok);v.addEventListener('canplay',ok);
      setTimeout(res,1200);
    });
  }
  /* Nach dem Umschalten: warten, bis wirklich ein Kader des neuen Videos auf dem Schirm war. */
  function painted(v){
    return new Promise(res=>{
      if(typeof v.requestVideoFrameCallback==='function'){let d=false;const f=()=>{if(!d){d=true;res();}};
        v.requestVideoFrameCallback(f);setTimeout(f,120);}
      else requestAnimationFrame(()=>res());
    });
  }
  function seekTo(v,t){
    return new Promise(res=>{
      const target=clamp(t,0,Math.max(0,(v.duration||DUR)-0.02));
      if(Math.abs(v.currentTime-target)<0.02)return res();
      const ok=()=>{v.removeEventListener('seeked',ok);res();};
      v.addEventListener('seeked',ok);
      try{v.currentTime=target;}catch(e){res();}
      setTimeout(res,900);
    });
  }

  /* ================================ Mount ================================ */
  let st=null;
  function unmount(){if(!st)return;try{st.cleanup();}catch(e){}st=null;}

  function mount(root){
    unmount();
    const W=qs(root,'#wohnung');if(!W)return null;
    const cam=qs(W,'.w-cam');if(!cam)return null;
    const ov=qs(W,'#wOv'),hotL=qs(W,'#wHot'),planHost=qs(W,'#wPlan'),roomNav=qs(W,'#wRoomNav'),
          hint=qs(W,'#wScrollHint'),hud=qs(W,'#wHud'),sig=qs(W,'.w-sig'),startBtn=qs(W,'#wStart'),
          cmp=qs(W,'#wCmp'),cmpAfter=cmp&&qs(cmp,'.w-cmp-after');
    W.classList.add('is-v16');W.classList.remove('is-full','is-lite','is-plain');
    document.documentElement.classList.add('v16');
    /* Bug-Fix (HANDOFF §8.1): .w-ov/.w-kicker/.w-d nehmen ihre Deckkraft aus --reveal (0..1), das bisher
       nur film.js/film-mobile setzten. v16 hat kein Scroll-Scrub, also ist der Wert konstant 1 — der Text
       ist einfach immer da, sobald der Halt steht (fillScene/showHoldImage steuern Auftreten separat). */
    W.style.setProperty('--reveal','1');

    /* --- Ebenen --- */
    const stage=qs(W,'#wStage');
    poolHost=document.createElement('div');poolHost.className='v16-pool';poolHost.setAttribute('aria-hidden','true');cam.appendChild(poolHost);
    const holdA=document.createElement('img'),holdB=document.createElement('img');
    [holdA,holdB].forEach(i=>{i.className='v16-hold';i.alt='';i.decoding='async';i.setAttribute('aria-hidden','true');cam.appendChild(i);});
    let holdTop=holdA,holdBot=holdB;
    const glCanvas=document.createElement('canvas');glCanvas.className='v16-gl';glCanvas.setAttribute('aria-hidden','true');cam.appendChild(glCanvas);
    /* v16.1 Kapitelmarke: Nummer + Name oben links, Fortschritt oben rechts. Sichtbar im Halt, weg im Flug —
       sie sagt dem Besucher «neues Kapitel», damit ein Dekorationswechsel als Absicht gelesen wird. */
    const chap=document.createElement('div');chap.className='v16-chap';chap.setAttribute('aria-hidden','true');
    chap.innerHTML='<div class="v16-chap-n"></div><div class="v16-chap-rule"></div><div class="v16-chap-t"></div><div class="v16-chap-s"></div>'+
      '<div class="v16-chap-p">'+S.map((_,i)=>'<i data-i="'+i+'"></i>').join('')+'</div>';
    stage.appendChild(chap);
    /* Etappe 8: der Rückblende-Wischer ist entfallen (die Rückblende lebt jetzt als Geste in «Wohnen»). */
    const chapN=qs(chap,'.v16-chap-n'),chapT=qs(chap,'.v16-chap-t'),chapS=qs(chap,'.v16-chap-s'),chapP=qa(chap,'.v16-chap-p i');
    function chapShow(k){
      chapN.textContent=String(k+1).padStart(2,'0');chapT.textContent=S[k].navLabel||'';
      chapS.textContent='Kapitel '+(k+1)+' von '+N;
      chapP.forEach((el,i)=>{el.classList.toggle('done',i<k);el.classList.toggle('cur',i===k);});
      chap.classList.toggle('is-hero',!!S[k].hero);   /* Titelkapitel: nur der Fortschritt, die Nummer wäre doppelt zum Hero */
      chap.classList.remove('show');void chap.offsetWidth;chap.classList.add('show');
    }
    function chapHide(){chap.classList.remove('show');}

    const RED=reduced();
    let ch=0,phase='HOLD',flyDir=0,flyTo=0,gen=0,active=null,pending=0,destroyed=false;
    let houseActive=true,lockScroll=true;

    /* ---------------- Szenentext / Punkte / Grundriss ---------------- */
    let rotTimer=0;
    function fillScene(scene){
      if(!ov)return;
      const k=qs(ov,'.w-kicker-t')||qs(ov,'.w-kicker'),h=qs(ov,'.w-h'),d=qs(ov,'.w-d'),
            chips=qs(ov,'.w-chips'),cnt=qs(ov,'.w-counters'),cta=qs(ov,'.w-cta');
      if(rotTimer){clearInterval(rotTimer);rotTimer=0;}
      if(scene.rot&&scene.rot.length>1&&!RED&&innerWidth>=1000){
        k.innerHTML=`${scene.kicker?scene.kicker+' · ':''}<span class="w-rot"><span class="rot-w">${scene.rot[0]}</span></span>`;
        const sp=qs(k,'.rot-w');let i=0;
        rotTimer=setInterval(()=>{if(!sp.isConnected){clearInterval(rotTimer);rotTimer=0;return;}
          i=(i+1)%scene.rot.length;sp.classList.add('out');
          setTimeout(()=>{sp.textContent=scene.rot[i];sp.classList.remove('out');sp.classList.add('in');setTimeout(()=>sp.classList.remove('in'),420);},260);},2600);
      } else k.textContent=((s5of(scene)||{}).q||scene.kicker||'')+(scene.rot?' · '+scene.rot[0]:'');
      /* Etappe 5 §2.5: In den Kammern ersetzt die FRAGE der Kammer den Gewerk-Kicker. Die Rotator-Variante
         oben betrifft nur die Ankunft (scene.rot), dort bleibt der Kicker unverändert. */
      h.innerHTML=String(scene.h||'');
      const walker=document.createTreeWalker(h,NodeFilter.SHOW_TEXT),nodes=[];let tn;
      while((tn=walker.nextNode()))nodes.push(tn);
      nodes.forEach(node=>{const fr=document.createDocumentFragment();
        node.textContent.split(/(\s+)/).forEach(w=>{if(!w)return;
          if(/^\s+$/.test(w)){fr.append(document.createTextNode(w));return;}
          const o=document.createElement('span'),inn=document.createElement('span');o.className='w-w';inn.textContent=w;o.append(inn);fr.append(o);});
        node.replaceWith(fr);});
      d.textContent=scene.d||'';
      if(chips)chips.hidden=!scene.chips;
      if(cnt){cnt.hidden=!scene.counters;
        if(scene.counters)cnt.innerHTML=scene.counters.map(c=>`<div><b class="odo">${c[0]}${c[1]||''}</b><span>${c[2]}</span></div>`).join('');}
      if(cta)cta.hidden=!scene.final;
      if(sig)sig.hidden=!scene.sig;
      ov.classList.toggle('is-hero',!!scene.hero);
      /* Bug (gefunden bei der v16-Sichtprüfung): #wRoomNav hängt links fix auf Höhe ~15vh und kollidiert auf
         breiten Desktops mit dem Kicker/Rotator der Hero-Kammer (Ankunft), der bei .w-ov.is-hero vertikal
         zentriert ist und dort durchläuft. War unsichtbar, solange --reveal (Bug §8.1) den Overlay-Text
         unterdrückte — seit dessen Fix real sichtbar. Blendet die Raumliste nur für die Dauer der Hero-Kammer aus. */
      if(roomNav)roomNav.classList.toggle('is-hero-active',!!scene.hero);
    }
    function buildHots(scene){
      if(!hotL)return;hotL.innerHTML='';
      /* Etappe 5 §2.4: Eine Kammer hat entweder Pins ODER eine Geste, nie beides — die Pin-Texte leben
         ab jetzt in der Mechanik selbst (Zonen, Notizzettel, Knoten). Betrifft alle Geräte. */
      if(sceneMech(scene))return;
      const list=(orient()==='P'?(scene.hotP&&scene.hot?scene.hot.slice(0,scene.hotP.length):scene.hot):scene.hot)||[];
      const pos=orient()==='P'&&scene.hotP?scene.hotP:null;
      const items=list.slice(0,orient()==='P'?3:4).map((hp,i)=>({hp,x:pos&&pos[i]?pos[i].x:hp.x,y:pos&&pos[i]?pos[i].y:hp.y}));
      /* Bug (Sichtprüfung nach dem Positionierungs-Fix, Telefon): ein fester Y-Deckel (58 %) reichte nicht für
         Szenen mit hohem Text-Turm (Zähler-Reihe, Chips oder CTA lassen .w-ov weiter nach oben wachsen als in
         einer schlichten Szene — betrifft sowohl bottom-verankerte Szenen als auch die vertikal zentrierte
         Hero-Kammer, .w-ov.is-hero) — Pins landeten trotzdem auf Headline/Fliesstext (z. B. "Renovation aus
         einer Hand", "Schlüsselübergabe", der Hero-Kicker). Fix: die TATSÄCHLICHE Oberkante von .w-ov pro Szene
         messen. Erster Versuch dafür verschob EINFACH ALLE Pins gemeinsam um denselben Betrag nach oben — das
         liess zwei vorher sauber getrennte Pins auf demselben (Boden-)Wert übereinanderfallen (Rückblende,
         y:60 und y:78 → beide 58; Schwelle, y:40 und y:16 → beide 8 nach zu grossem Versatz). Zweiter Versuch
         verschob NUR die Pins, deren y die Grenze selbst überschreitet — das liess wiederum einen verschobenen
         Pin direkt neben einem unverschobenen, eigentlich unbeteiligten Pin landen (Bad, "Dicht nach Norm" auf
         52 neben "Grossformat, kaum Fugen" auf 50). Jetzt: von unten nach oben durchgehen (grösstes y zuerst),
         jeden Pin auf die bisherige Decke ODER seinen eigenen Wert deckeln (je nachdem, was kleiner ist), dann
         die Decke für den nächsthöheren Pin um den Mindestabstand weiter absenken — so bleiben unbeteiligte Pins
         unverändert, solange kein tieferer Pin sie beim Hochschieben einholt, und kein Pin überschreitet je die
         Grenze oder landet auf demselben Wert wie ein Nachbar. */
      if(isPhone()&&items.length&&stage&&ov){
        const stageR=stage.getBoundingClientRect(),ovR=ov.getBoundingClientRect();
        if(stageR.height>0){
          const ovTopPct=((ovR.top-stageR.top)/stageR.height)*100;
          /* Bug (Sichtprüfung, nach obigem Fix): Pins, die weit genug hochgeschoben wurden (Szenen mit Zähler-
             Reihe wie "Wohnen"), liefen oben in die Kapitelmarke (.v16-chap: Nummer + Name + "Kapitel N von 8"
             oben links) hinein — "Beton, der bleibt" landete auf "Kapitel 6 von 8". Der Frame selbst hat keine
             feste Untergrenze dafür, darum jetzt zusätzlich die TATSÄCHLICHE Unterkante von .v16-chap messen und
             als harte Untergrenze für floor verwenden (statt der vorher geschätzten 12). */
          const floor=chap?Math.min(30,Math.max(14,((chap.getBoundingClientRect().bottom-stageR.top)/stageR.height)*100+2)):14;
          /* Kein Deckel nach UNTEN mehr für safeMax (früher Math.max(30,...)): der liess safeMax nie unter 30
             fallen und erlaubte Hero-Pins damit direkt in dessen — deutlich höher liegenden — Text hineinzuragen.
             62 bleibt als Obergrenze gegen unnötiges Verschieben, falls die Messung mal einen sehr niedrigen
             Wert liefert. Rand auf 4 (statt 7) verkleinert: bei drei Pins in einer Szene mit hohem Text-Turm
             UND Kapitelmarke blieb sonst zu wenig Korridor übrig, um alle drei ohne Überlappung zu stapeln
             (Wohnen: "Beton, der bleibt" / "Drei Gewerke im Takt" / "Bis zum letzten Vorhang"). */
          const safeMax=Math.min(62,Math.max(floor,ovTopPct-4));
          /* Bug (Sichtprüfung, Telefon): mit der Kapitelmarke als zusätzlicher Untergrenze (floor, s. o.) wird
             der Korridor zwischen floor und safeMax bei manchen Szenen zu schmal für den festen Mindestabstand
             von 12 — die Kaskade unten drückte dann mehrere Pins auf (fast) denselben floor-Wert (Schwelle:
             "Geprüft, nicht geschätzt" und "Licht in der Decke" praktisch übereinander). Ein einfach verkleinerter
             fester Abstand half nicht zuverlässig, weil floor jeden weiteren Pin auf denselben Wert zieht, sobald
             einer ihn erreicht. Fix: zuerst die natürliche Kaskade (nur mit Decke, ohne Boden) ausrechnen — passt
             sie in den Korridor, bleibt sie stehen (unbeteiligte Pins unverändert); reicht der Platz nicht, ALLE
             Pins der Szene gleichmässig zwischen floor und safeMax verteilen (garantiert kollisionsfrei, statt
             mehrere am unteren Ende zu stapeln). */
          const n=items.length,sorted=items.slice().sort((a,b)=>b.y-a.y);
          if(n===1){
            sorted[0].y=Math.max(floor,Math.min(sorted[0].y,safeMax));
          }else{
            const nominalGap=12;let ceiling=safeMax;const naturalY=[];
            sorted.forEach(it=>{const y=Math.min(it.y,ceiling);naturalY.push(y);ceiling=y-nominalGap;});
            if(naturalY[naturalY.length-1]<floor){
              const gap=(safeMax-floor)/(n-1);
              sorted.forEach((it,i)=>{it.y=safeMax-i*gap;});
            }else{
              sorted.forEach((it,i)=>{it.y=naturalY[i];});
            }
          }
        }
      }
      items.forEach(({hp,x,y},i)=>{
        const el=document.createElement('button');
        /* Erst jetzt (Sichtprüfung) bekommen .w-hs überhaupt eine echte Position (siehe film-v16.css:
           #wHot .w-hs{left/top}) — vorher lagen alle bei 0,0 und der flip-Schwellwert 66 % kam nie zum Tragen.
           Auf dem schmalen Telefon reicht 66 % nicht: das Label ist dort ein deutlich grösserer Anteil der
           Bildbreite als am Desktop, darum kippt es auf dem Telefon schon ab der Bildmitte nach links. */
        const flipAt=isPhone()?50:66;
        el.type='button';el.className='w-hs'+(x>flipAt?' flip':'')+(y>66?' up':'');
        el.style.setProperty('--hx',x);el.style.setProperty('--hy',y);el.style.setProperty('--i',i);
        el.setAttribute('aria-label',hp.t);el.setAttribute('aria-expanded','false');
        el.innerHTML=`<i></i><span class="w-hs-lbl">${hp.t}</span><span class="w-hs-pop"><b>${hp.l[0]}</b><em>${hp.l[1]||''}</em>${hp.go?'<u>Mehr dazu →</u>':''}</span>`;
        /* Etappe 8 §2.2 (Bug des Eigentümers): Der zweite Klick auf eine offene Marke FOLGTE der Route,
           statt sie zu schliessen — die Sprechblase liess sich nie mehr wegklicken. Jetzt schliesst der
           zweite Klick; zur Route führt nur noch «Mehr dazu →» in der Blase selbst. */
        el.addEventListener('click',e=>{
          e.stopPropagation();
          if(hp.go&&e.target.closest&&e.target.closest('.w-hs-pop u'))return goRoute(hp.go);
          const open=el.classList.contains('open');
          closeHots();
          if(!open){el.classList.add('open');el.setAttribute('aria-expanded','true');}
        });
        hotL.appendChild(el);
      });
    }
    function closeHots(){qa(hotL||W,'.w-hs.open').forEach(x=>{x.classList.remove('open');x.setAttribute('aria-expanded','false');});}
    /* Tippen/Klicken daneben und Escape schliessen die offene Marke ebenfalls (§2.2). */
    function onDocDown(e){if(e.target.closest&&e.target.closest('.w-hs'))return;closeHots();}
    const plan=(()=>{
      const P=(typeof PLAN!=='undefined')?PLAN:null;if(!P||!planHost)return null;
      planHost.innerHTML=`<svg viewBox="0 0 ${P.w} ${P.h}" aria-hidden="true">${P.rooms.map(r=>`<path class="w-pr" data-room="${r.id}" d="${r.d}"></path>`).join('')}
        <g class="w-pcam"><path class="w-cone" d="M0 0 L-16 -26 A30 30 0 0 1 16 -26 Z"></path><circle r="3.2"></circle></g></svg><div class="w-plan-lbl"></div>`;
      return {svg:qs(planHost,'svg'),cam:qs(planHost,'.w-pcam'),lbl:qs(planHost,'.w-plan-lbl'),P};
    })();
    /* Etappe 8: PLAN.cam ist nach den ACHT v15-Szenen indexiert (plan.js, mit Rückblende an 6). Der
       v16-Film hat sieben Kapitel — die Zuordnung läuft darum über den Raumnamen, nicht über den Index. */
    const CAM_IX={ankunft:0,schwelle:1,kueche:2,bad:3,schlaf:4,wohnen:5,'wohnen-rohbau':6,eingang:7};
    function setPlan(i){
      if(!plan)return;const ix=CAM_IX[ROOMS[i]];
      const c=plan.P.cam[ix!=null?ix:i]||plan.P.cam[0];
      qa(plan.svg,'.w-pr').forEach(p=>p.classList.toggle('on',p.dataset.room===c.room));
      plan.cam.setAttribute('transform',`translate(${c.x} ${c.y}) rotate(${c.a})`);
      const r=plan.P.rooms.find(r=>r.id===c.room);plan.lbl.textContent=r?r.label:'';
    }
    const dots=roomNav?qa(roomNav,'.w-roomnav-dot'):[];
    function setDots(i,target){
      dots.forEach((b,k)=>{b.classList.toggle('on',k===i);b.classList.toggle('is-target',target!=null&&k===target&&k!==i);
        b.setAttribute('aria-current',k===i?'true':'false');});
      if(hud){const t=qs(hud,'.k'),b=qs(hud,'b');if(t)t.textContent=String(i+1).padStart(2,'0');if(b)b.textContent=S[i].navLabel||'';}
    }

    /* Etappe 8 §3.1: Der Vorher/Nachher-Regler (#wCmp) gehörte zur Rückblende-Kammer. Die gibt es nicht mehr;
       das Markup bleibt für ?film=15 in der Seite, im v16-Film ist es immer aus. */
    function updateCmp(){if(cmp)cmp.hidden=true;}

    /* ---------------- Halt / Flug ---------------- */
    function showHoldImage(url,fade){
      return new Promise(res=>{
        const next=holdBot;
        const done=()=>{
          next.classList.add('on');holdTop.classList.remove('on');
          const t=holdTop;holdTop=next;holdBot=t;
          setTimeout(res,fade?Math.min(fade,520):0);
        };
        if(next.getAttribute('src')===url&&next.complete)return done();
        next.onload=done;next.onerror=()=>res();
        next.style.transitionDuration=(fade||0)+'ms';
        next.src=url;
      });
    }
    function setStageFly(on){stage.classList.toggle('is-fly',!!on);}

    async function enterHold(k,opts){
      opts=opts||{};
      phase='HOLD';flyDir=0;ch=k;
      const scene=S[k];
      /* Bug (Sichtprüfung, Telefon): buildHots() misst jetzt die Unterkante von .v16-chap (Kapitelmarke), um
         Pins nicht darauf landen zu lassen — chapShow(k) stand hier aber bisher NACH buildHots(), lieferte also
         noch die Geometrie des VORHERIGEN Kapitels (kürzer bei der Hero-Kammer, die nur den Fortschritt zeigt,
         ohne Nummer/Titel/"Kapitel N von 8"). Reihenfolge getauscht, damit buildHots() die Kapitelmarke des
         NEUEN Kapitels misst. */
      fillScene(scene);chapShow(k);buildHots(scene);setPlan(k);setDots(k);updateCmp(k);
      if(hint)hint.classList.toggle('is-off',k>0);
      await showHoldImage(stillUrl(k),opts.fade||0);
      setStageFly(false);
      if(active){try{active.v.pause();}catch(e){}active.v.classList.remove('is-on');active.active=false;active=null;}
      if(ov)ov.classList.add('show');if(hotL)hotL.classList.add('show');
      /* Handschrift-Reveal der Inhaber-Unterschrift (fx.js: signature()) nachrüsten: fx.js hängt _sigRun/
         _sigReset an jedes .w-sig svg, überspringt aber bewusst den Auto-Start innerhalb von .w-stage
         ("im Rundgang steuert film.js den Start") — das war für Engine A (film.js, Zeile ~558) gedacht.
         film-v16.js schaltete bisher nur sig.hidden um, ohne den Trigger je aufzurufen — die Unterschrift
         stand darum in der Abnahme-Kammer nur als fertiger (weil nie gezeichneter, also unsichtbarer) Strich
         da, statt sich wie beabsichtigt von Hand zu schreiben. Reset bei jedem anderen Kapitel, damit sie bei
         erneutem Besuch der Kammer wieder neu zeichnet statt nur aufzupoppen. */
      /* Etappe 5 §4.6: In der Abnahme-Kammer startet stage5-v16.js die Unterschrift erst NACH den vier
         Versprechen — hier nur noch zurücksetzen, damit sie beim erneuten Besuch wieder neu schreibt. */
      if(sig){const sv=sig.querySelector('svg');if(sv){if(scene.sig){if(!sceneMech(scene)&&sv._sigRun)sv._sigRun();else if(sv._sigReset)sv._sigReset();}else if(sv._sigReset)sv._sigReset();}}
      prefetchNeighbours();
      /* 2,5D erst NACH dem neutralen Haltebild: erst steht das Bild, dann wächst die Tiefe hinein.
         Der erste gezeichnete Kader ist pixelgleich zum Standbild — kein Sprung am Übergang. */
      showDepth(k);
      W.dispatchEvent(new CustomEvent('v16:hold',{detail:{ch:k,k,scene:S[k]}}));   /* stepChain() + stage5-v16.js hängen hier dran */
      if(pending&&chainTarget==null){const p=pending;pending=0;setTimeout(()=>command(p),40);}
      else pending=0;
    }
    /* ---------------- 2,5D-Halt (depth-v16.js) ---------------- */
    let depthOn=false,depthGen=0;
    function depthReady(){return !RED&&V.depth&&window.V16Depth&&depthOn;}
    function mountDepth(){
      if(RED||!V.depth||!window.V16Depth||!V16Depth.mount)return;
      try{depthOn=!!V16Depth.mount(glCanvas,cam);}catch(e){depthOn=false;}
    }
    function showDepth(k){
      if(!depthReady())return;
      const my=++depthGen,u=depthUrl(k);
      if(!u)return;
      Promise.resolve(V16Depth.show(stillUrl(k),u)).then(ok=>{
        if(my!==depthGen||phase!=='HOLD')V16Depth.hide();
      }).catch(()=>{});
    }
    function hideDepth(){depthGen++;if(depthReady())try{V16Depth.hide();}catch(e){}}
    function prepareDepth(k){if(!depthReady()||!V16Depth.prepare)return;const u=depthUrl(k);if(u)try{V16Depth.prepare(stillUrl(k),u);}catch(e){}}
    function prefetchNeighbours(){
      const o=orient();
      if(V.depth)[ch+1,ch-1].forEach(k=>{if(k>=0&&k<N){const im=new Image();im.decoding='async';im.src=depthUrl(k,o);}});
      [[ch,ch+1,1],[ch,ch-1,-1]].forEach(([a,b,d])=>{
        if(b<0||b>=N)return;const leg=legOf(a,b);if(!leg)return;
        warm(clipUrl(leg+'-'+o,d>0?'fwd':'rev'));
      });
      /* Haltebild des Nachbarn vorladen (Blende ohne Nachladen) */
      [ch+1,ch-1].forEach(k=>{if(k>=0&&k<N){const im=new Image();im.decoding='async';im.src=stillUrl(k);}});
    }

    async function startFly(from,to,dir){
      const myGen=++gen;
      phase='FLY';flyDir=dir;flyTo=to;
      hideDepth();                                   /* Halt-Ebene sofort neutral, kein Doppelspiel mit dem Video */
      setDots(from,to);chapHide();
      if(cmp)cmp.hidden=true;
      if(ov)ov.classList.remove('show');if(hotL)hotL.classList.remove('show');
      closeHots();
      const leg=legOf(from,to);
      /* Etappe 8: jede Strecke hat einen Clip. Fehlt einer (oder reduzierte Bewegung), bleibt die Blende. */
      if(!leg||RED){
        await showHoldImage(stillUrl(to),260);
        if(myGen!==gen)return;
        return enterHold(to,{fade:0});
      }
      const o=orient(),dirn=dir>0?'fwd':'rev';
      const url=clipUrl(leg+'-'+o,dirn);
      const e=warm(url);
      prepareDepth(to);                              /* v16.1: Ziel-Halt schon während des Flugs auf die GPU */
      /* Rückblende → Wohnen: erst weich in den ersten Kader des Clips blenden, dann fahren. */
      if(needFade(from,to)&&dir>0){
        await showHoldImage(edgeUrl(leg+'-'+o,'first'),V.flashFade);
        if(myGen!==gen)return;
      }
      try{await e.ready;}catch(x){}
      if(myGen!==gen||destroyed)return;
      const v=e.v;
      await seekTo(v,0);
      if(myGen!==gen)return;
      await frameReady(v);
      if(myGen!==gen)return;
      swapActive(e);
      setStageFly(true);
      try{await v.play();}catch(x){ /* Autoplay blockiert: Standbild behalten und weiterschalten */
        if(myGen!==gen)return;return enterHold(to,{fade:260});}
      W.dispatchEvent(new CustomEvent('v16:fly',{detail:{from,to,dir}}));
      watchEnd(v,myGen,to,needFade(from,to)&&dir<0?V.flashFade:0);
    }
    function swapActive(e){
      if(active&&active!==e){active.v.classList.remove('is-on');active.active=false;try{active.v.pause();}catch(x){}}
      e.active=true;e.used=performance.now();e.v.classList.add('is-on');active=e;trimPool(e.v.currentSrc||e.v.src);
    }
    function watchEnd(v,myGen,to,endFade){
      const onEnd=()=>{cleanup();if(myGen!==gen||destroyed)return;enterHold(to,{fade:endFade||0});};
      const onErr=()=>{cleanup();if(myGen!==gen||destroyed)return;enterHold(to,{fade:220});};
      /* Sicherheitsnetz: 'ended' kann ausbleiben (Stall/Tab-Wechsel) */
      const guard=setInterval(()=>{
        if(myGen!==gen){cleanup();return;}
        if(v.ended||(v.duration&&v.currentTime>=v.duration-0.05))onEnd();
      },120);
      function cleanup(){clearInterval(guard);v.removeEventListener('ended',onEnd);v.removeEventListener('error',onErr);}
      v.addEventListener('ended',onEnd);v.addEventListener('error',onErr);
    }
    /* Richtungswechsel mitten im Flug: Gegenclip bei dur − t, erst nach fertigem Kader umschalten. */
    /* Richtungswechsel: neues Ziel = bisheriger Ausgangspunkt. Der Gegenclip startet bei dur − t;
       das laufende Video wird sofort eingefroren, damit die Position beim Umschalten exakt passt. */
    async function reverseNow(){
      if(phase!=='FLY')return;
      const myGen=++gen;
      const newFrom=flyTo,newTo=ch,newDir=-flyDir;
      const cur=active&&active.v;
      const d=(cur&&cur.duration)||DUR,t=cur?cur.currentTime:0;
      hideDepth();
      if(cur){try{cur.pause();}catch(x){}}
      const leg=legOf(newFrom,newTo);
      ch=newFrom;flyTo=newTo;flyDir=newDir;setDots(ch,flyTo);chapHide();
      if(!leg||RED||!cur){
        await showHoldImage(stillUrl(newTo),V.flashFade);
        if(myGen!==gen)return;return enterHold(newTo);
      }
      const o=orient(),url=clipUrl(leg+'-'+o,newDir>0?'fwd':'rev'),e=warm(url);
      prepareDepth(newTo);
      try{await e.ready;}catch(x){}
      if(myGen!==gen||destroyed)return;
      await seekTo(e.v,clamp(d-t,0,d));
      if(myGen!==gen)return;
      await frameReady(e.v);
      if(myGen!==gen)return;
      swapActive(e);setStageFly(true);
      try{await e.v.play();}catch(x){return enterHold(newTo,{fade:220});}
      W.dispatchEvent(new CustomEvent('v16:reverse',{detail:{to:newTo,at:+(d-t).toFixed(2)}}));
      watchEnd(e.v,myGen,newTo,needFade(newFrom,newTo)&&newDir<0?V.flashFade:0);
    }

    /* ---------------- Absicht ---------------- */
    const QUIET=V.quiet||700, IDLE_GAP=140, OPP_GAP=150, OPP_MIN=8;
    let inGesture=false,lastDir=0,lastFire=-1e9,idleT=0,chainTarget=null;
    function command(dir,keepChain){
      if(dir&&!keepChain)chainTarget=null;             /* Handgeste bricht eine laufende Punkt-Kette ab */
      if(!houseActive||destroyed)return;
      if(phase==='HOLD'){
        const t=ch+dir;
        if(t<0){return;}                                  /* oben: bleibt in Ankunft */
        if(t>=N){return exitHouse();}                      /* nach der letzten Kammer: Seite freigeben */
        /* Etappe 5: die Kammer wird verlassen — stage5-v16.js räumt Mechanik und To-do-Zeile ab,
           BEVOR der Flug startet (sonst bliebe ein Overlay über dem Video stehen). */
        W.dispatchEvent(new CustomEvent('v16:leave',{detail:{k:ch}}));
        startFly(ch,t,dir);
      } else {
        if(dir===flyDir){ if(!pending)pending=dir; }       /* höchstens EIN Schritt in der Warteschlange */
        else reverseNow();
      }
    }
    function gesture(dir,strength){
      const now=performance.now();
      if(!inGesture){
        inGesture=true;
        if(now-lastFire<QUIET&&dir===lastDir)return;       /* Schutz vor Doppelauslösung desselben Wischens */
        lastDir=dir;lastFire=now;command(dir);return;
      }
      if(dir!==lastDir&&now-lastFire>OPP_GAP&&strength>=OPP_MIN){lastDir=dir;lastFire=now;command(dir);}
    }
    function endGestureSoon(){clearTimeout(idleT);idleT=setTimeout(()=>{inGesture=false;},IDLE_GAP);}

    const isFormish=el=>!!(el&&el.closest&&el.closest('input,textarea,select,[contenteditable=""],[contenteditable="true"],.lb,dialog[open]'));
    function onWheel(e){
      if(!houseActive)return;
      if(isFormish(e.target))return;
      e.preventDefault();
      const dy=e.deltaY||0,dx=e.deltaX||0;
      if(Math.abs(dy)<Math.abs(dx))return;                 /* horizontales Wischen ignorieren */
      if(Math.abs(dy)<2)return;
      gesture(dy>0?1:-1,Math.abs(dy));endGestureSoon();
    }
    let tY=0,tX=0,tActive=false,tFired=false;
    function onTouchStart(e){if(!houseActive||isFormish(e.target))return;const t=e.touches[0];tY=t.clientY;tX=t.clientX;tActive=true;tFired=false;}
    function onTouchMove(e){
      if(!houseActive||!tActive)return;
      const t=e.touches[0],dy=tY-t.clientY,dx=tX-t.clientX;
      if(e.cancelable)e.preventDefault();
      if(tFired)return;
      if(Math.abs(dy)<(V.swipeMin||46)||Math.abs(dy)<Math.abs(dx))return;
      tFired=true;inGesture=false;
      /* Handy-Sichtprüfung: spürbarer Mikrofreeze genau im Moment des Wischs. Ursache: startFly() (u.a.
         showHoldWipe()'s void offsetWidth-Zwangs-Reflow, prepareDepth()) lief bisher synchron im selben
         Touchmove-Callback — non-passive touchmove blockiert damit einen Frame lang die Touch-Pipeline.
         rAF schiebt den Start eine Frame weiter: der Browser darf den aktuellen Touch-Frame zuerst fertig
         verarbeiten, bevor die schwerere Übergangslogik läuft. */
      const dirn=dy>0?1:-1,strength=Math.abs(dy);
      requestAnimationFrame(()=>gesture(dirn,strength));
    }
    function onTouchEnd(){tActive=false;setTimeout(()=>{tFired=false;},80);}
    const KEY_NEXT={ArrowDown:1,PageDown:1,' ':1,Space:1,ArrowRight:1},KEY_PREV={ArrowUp:-1,PageUp:-1,ArrowLeft:-1};
    function onKey(e){
      if(!houseActive||isFormish(e.target)||e.metaKey||e.ctrlKey||e.altKey)return;
      const d=KEY_NEXT[e.key]||KEY_PREV[e.key];
      if(d){e.preventDefault();if(e.repeat)return;inGesture=false;gesture(d,99);return;}
      if(e.key==='Home'){e.preventDefault();gotoChapter(0);return;}
      if(e.key==='End'){e.preventDefault();gotoChapter(N-1);return;}
      if(e.key==='Escape'&&houseActive){
        e.preventDefault();
        if(qa(hotL||W,'.w-hs.open').length)return closeHots();   /* §2.2: erst die Sprechblase, dann das Haus */
        exitHouse();
      }
    }
    /* Punkt-Navigation: Sprung auf ein beliebiges Kapitel = Kette benachbarter Flüge.
       Es wird immer nur EIN Ziel gemerkt — eine neue Auswahl ersetzt das alte, es entsteht keine Warteschlange.
       Läuft gerade ein Flug in die falsche Richtung, kehrt er sofort um. */
    function gotoChapter(k){
      k=clamp(k,0,N-1);
      if(k===ch&&phase==='HOLD'){chainTarget=null;setDots(ch);return;}
      chainTarget=k;
      if(phase==='FLY'){
        const want=k>ch?1:-1;
        if(want!==flyDir&&k!==flyTo)reverseNow();          /* falsche Richtung → umkehren */
        return;                                            /* sonst: nach Ankunft weiter (v16:hold) */
      }
      stepChain();
    }
    function stepChain(){
      if(chainTarget==null||phase!=='HOLD')return;
      if(ch===chainTarget){chainTarget=null;setDots(ch);return;}
      command(chainTarget>ch?1:-1,true);
    }
    function onDots(e){const b=e.target.closest&&e.target.closest('.w-roomnav-dot');if(!b)return;e.preventDefault();gotoChapter(+b.dataset.i);}

    /* ---------------- Haus / Seite ---------------- */
    /* Etappe 8 §5: Der Film entlässt in den «Werkvertrag-Auszug» (#ende) — eine undurchsichtige, helle
       Sektion. Vorher war es das erste .w-sheet, das nach «Hinter Glas» (v8.2) durchsichtig über dem
       noch gepinnten Film lag: die Karten verloren ihre Farbe und der Text lag auf dem Kader. */
    const sheet=qs(W,'#ende')||qs(W,'.w-sheet--final')||qs(W,'.w-sheet');
    function lock(on){
      lockScroll=!!on;
      document.documentElement.classList.toggle('v16-lock',lockScroll);
    }
    /* Grenzen: nach der letzten Kammer gibt das Haus die Seite frei. Der Rückweg ins Haus verlangt, dass der
       Besucher wirklich unten war (leftTop) und wieder ganz oben ankommt — sonst würde das eigene
       Weg-Scrollen sofort als «wieder im Haus» gelesen und man säse in einer Scroll-Falle. */
    let exitAt=0,leftTop=false;
    /* Etappe 8 §5: Ist der Rundgang vorbei, verschwindet auch seine Bedienung — Raumpunkte, HUD und
       Grundriss hingen sonst als fixe Elemente über dem «Werkvertrag-Auszug» und allem darunter. */
    function releaseHouse(){houseActive=false;lock(false);chainTarget=null;exitAt=performance.now();leftTop=false;
      W.classList.add('is-released');
      if(depthReady())V16Depth.pause();}
    function exitHouse(){
      if(!houseActive)return;
      releaseHouse();
      if(hint)hint.classList.add('is-off');
      const y=(sheet?sheet.getBoundingClientRect().top+scrollY:innerHeight);
      scrollTo({top:Math.max(1,Math.round(y)),behavior:RED?'auto':'smooth'});
      W.dispatchEvent(new CustomEvent('v16:exit'));
    }
    function enterHouse(atLast){
      if(houseActive)return;
      houseActive=true;lock(true);leftTop=false;W.classList.remove('is-released');
      if(depthReady()&&phase==='HOLD')V16Depth.resume();
      inGesture=true;lastFire=performance.now();          /* laufende Geste nicht sofort als Kapitelbefehl werten */
      endGestureSoon();
      scrollTo({top:0,behavior:'auto'});
      if(atLast&&ch!==N-1&&phase==='HOLD')enterHold(N-1,{fade:200});
      W.dispatchEvent(new CustomEvent('v16:enter',{detail:{ch}}));
    }
    function onScroll(){
      if(lockScroll){if(scrollY>0)scrollTo({top:0,behavior:'auto'});return;}
      if(houseActive)return;
      if(scrollY>innerHeight*0.3)leftTop=true;
      if(leftTop&&scrollY<=2&&performance.now()-exitAt>400)enterHouse(true);
    }
    /* Klick auf Anker/Route gibt die Seite frei, damit kein Scroll-Käfig entsteht. */
    function onClickAny(e){
      const t=e.target.closest&&e.target.closest('[data-go],a[href^="#"],a[href^="/"],.w-chip,.btn');
      if(t&&houseActive&&!t.closest('#wRoomNav')&&!t.closest('.w-hs')&&t.id!=='wStart')releaseHouse();
    }

    /* ---------------- Orientierung / Resize ---------------- */
    let lastO=orient(),lastW=innerWidth,rT=0;
    async function onResize(){
      clearTimeout(rT);
      rT=setTimeout(async()=>{
        const o=orient();
        if(o===lastO&&Math.abs(innerWidth-lastW)<80)return;   /* Adressleiste des Telefons ignorieren */
        lastO=o;lastW=innerWidth;
        buildHots(S[ch]);
        if(phase==='HOLD'){hideDepth();await showHoldImage(stillUrl(ch),0);prefetchNeighbours();showDepth(ch);return;}
        /* Im Flug: gleiche Strecke, gleiche Position, andere Ausrichtung */
        const myGen=++gen,cur=active&&active.v,t=cur?cur.currentTime:0;
        const from=flyDir>0?ch:flyTo,to=flyDir>0?flyTo:ch,leg=legOf(from,to);
        if(!leg)return;
        const url=clipUrl(leg+'-'+o,flyDir>0?'fwd':'rev'),e=warm(url);
        try{await e.ready;}catch(x){}
        if(myGen!==gen)return;
        await seekTo(e.v,t);await frameReady(e.v);
        if(myGen!==gen)return;
        swapActive(e);try{await e.v.play();}catch(x){}
        watchEnd(e.v,myGen,flyTo);
      },260);
    }
    function onVis(){
      if(document.hidden){if(active){try{active.v.pause();}catch(e){}}if(depthReady())V16Depth.pause();}
      else {if(phase==='FLY'&&active)active.v.play().catch(()=>{});
            if(depthReady()&&phase==='HOLD')V16Depth.resume();}
    }

    /* ---------------- Start ---------------- */
    TIER=pickTier();
    if(TIER==='probe'){TIER='hd';probeBandwidth(stillUrl(0),0).then(()=>{});}
    const poster=stillUrl(0);
    const startup=async()=>{
      mountDepth();
      await enterHold(0,{fade:0});
      if(startBtn)startBtn.classList.add('show');
    };
    startup();

    addEventListener('wheel',onWheel,{passive:false});
    addEventListener('touchstart',onTouchStart,{passive:true});
    addEventListener('touchmove',onTouchMove,{passive:false});
    addEventListener('touchend',onTouchEnd,{passive:true});
    addEventListener('keydown',onKey);
    addEventListener('scroll',onScroll,{passive:true});
    document.addEventListener('pointerdown',onDocDown,true);
    addEventListener('resize',onResize);
    addEventListener('orientationchange',onResize);
    document.addEventListener('visibilitychange',onVis);
    document.addEventListener('click',onClickAny,true);
    if(roomNav)roomNav.addEventListener('click',onDots);
    if(startBtn)startBtn.addEventListener('click',e=>{e.preventDefault();gesture(1,99);});
    W.addEventListener('v16:hold',stepChain);
    lock(true);

    const cleanup=()=>{
      destroyed=true;gen++;
      removeEventListener('wheel',onWheel);removeEventListener('touchstart',onTouchStart);
      removeEventListener('touchmove',onTouchMove);removeEventListener('touchend',onTouchEnd);
      removeEventListener('keydown',onKey);removeEventListener('scroll',onScroll);
      document.removeEventListener('pointerdown',onDocDown,true);
      removeEventListener('resize',onResize);removeEventListener('orientationchange',onResize);
      document.removeEventListener('visibilitychange',onVis);
      document.removeEventListener('click',onClickAny,true);
      if(roomNav)roomNav.removeEventListener('click',onDots);
      if(rotTimer)clearInterval(rotTimer);
      clearTimeout(rT);clearTimeout(idleT);
      if(window.V16Depth&&V16Depth.destroy)V16Depth.destroy();
      dropPool();
      [holdA,holdB,glCanvas].forEach(el=>el.remove());
      if(poolHost)poolHost.remove();poolHost=null;
      lock(false);
      W.classList.remove('is-v16','is-released');document.documentElement.classList.remove('v16');
      W.style.removeProperty('--reveal');
      if(cmp)cmp.hidden=true;
    };
    st={mode:'v16',cleanup};
    /* Etappe 5: Die SPA (pages.js) ersetzt beim Rendern der Startseite das gesamte #view und damit auch
       die Bühne — ein Modul, das sich an #wohnung hängt, verliert dabei seine Ebene. Dieses Signal sagt
       stage5-v16.js, dass eine frische Bühne steht und es sich neu einhängen muss. */
    dispatchEvent(new CustomEvent('v16:mounted',{detail:{root:W}}));
    /* Debug/Tests */
    window.Film16={
      get ch(){return ch;},get phase(){return phase;},get dir(){return flyDir;},get to(){return flyTo;},
      get tier(){return TIER;},get orient(){return orient();},get house(){return houseActive;},
      get active(){return active&&(active.v.currentSrc||active.v.src);},
      get poolSize(){return pool.size;},
      go:gotoChapter,cmd:command,next:()=>command(1),prev:()=>command(-1),exit:exitHouse,enter:()=>enterHouse(true),
      release:releaseHouse,   /* Etappe 5: die Akte-Schublade gibt die Seite frei, bevor sie zum Rechner scrollt */
      setTier(t){TIER=t;},rooms:ROOMS,legs:LEGS,N
    };
    return cleanup;
  }

  function auto(route){
    const name=(route&&route.name)||'home';
    if(name!=='home')return unmount();
    const root=document.getElementById('view')||document;
    if(!document.getElementById('wohnung'))return;
    if(st)return;mount(root);
  }
  window.Film={full:mount,lite:mount,plain:mount,auto,unmount,mode:()=>st&&st.mode||'none',v16:true};
})();
