/* BauStern — stage5-v16.js · Etappe 5 «Eine Frage — eine Geste» (PLAN-v16-ETAPPE5.md)
   ------------------------------------------------------------------------------------------------
   Jede Kammer stellt EINE Frage (Kicker), die Überschrift antwortet, die GESTE beweist. Dazu eine
   To-do-Zeile, die durchgestrichen wird: was der Hausverwalter sonst selbst macht — und was wir
   übernehmen. Steuerung hängt an zwei Ereignissen aus film-v16.js:
        v16:hold  {k, scene}   Kammer steht   -> Mechanik + To-do aufbauen, Demo spielen
        v16:leave {k}          Flug beginnt   -> alles abräumen
   Stammdaten: FILM_V16.s5[sceneId] in data.js. Koordinaten in Prozent der Bühne (#wStage),
   getrennt für P (Hochkant/Telefon) und L (Querformat/Desktop) — trassieren mit ?trace=1.
   WICHTIG: GSAP ist auf dem Telefon NICHT geladen (index.html lädt es erst ab 1000px und ohne
   prefers-reduced-motion). Deshalb läuft hier alles über CSS-Transitions/Keyframes + Timer.
   ------------------------------------------------------------------------------------------------ */
(function(){
  if(typeof FILM_V16==='undefined'||typeof FILM==='undefined'||FILM.engine!=='v16')return;
  const F=FILM_V16,S5=F.s5||{},STEP=(typeof STEPS!=='undefined'?STEPS:[]);
  const qs=(r,s)=>r.querySelector(s),qa=(r,s)=>Array.prototype.slice.call(r.querySelectorAll(s));
  const clamp=(v,a,b)=>v<a?a:v>b?b:v;
  const RED=()=>matchMedia('(prefers-reduced-motion:reduce)').matches;
  const orient=()=>innerHeight>innerWidth?'P':'L';
  const isPhone=()=>matchMedia('(max-width:760px)').matches;
  const pick=o=>!o?null:(o[orient()]!==undefined?o[orient()]:o);
  const el=(tag,cls,html)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(html!=null)n.innerHTML=html;return n;};
  const SVGNS='http://www.w3.org/2000/svg';
  const svgEl=(tag,attrs)=>{const n=document.createElementNS(SVGNS,tag);for(const k in attrs)n.setAttribute(k,attrs[k]);return n;};
  const at=(node,x,y)=>{node.style.left=x+'%';node.style.top=y+'%';return node;};
  const later=(fn,ms)=>{const t=setTimeout(fn,ms);TIMERS.push(t);return t;};
  let TIMERS=[];
  const clearTimers=()=>{TIMERS.forEach(clearTimeout);TIMERS=[];};

  /* Demo («zeig dich einmal selbst») pro Kammer nur einmal je Sitzung. */
  const demoSeen=id=>{try{return sessionStorage.getItem('s5demo:'+id)==='1';}catch(e){return false;}};
  const demoDone=id=>{try{sessionStorage.setItem('s5demo:'+id,'1');}catch(e){}};

  /* ---------------------------------- Zustand ---------------------------------- */
  let W=null,stage=null,ov=null,host=null,cur=null,curCfg=null,curScene=null,detach=[];
  const on=(node,ev,fn,opt)=>{node.addEventListener(ev,fn,opt);detach.push(()=>node.removeEventListener(ev,fn,opt));};

  /* ---------------------------------- Akte ---------------------------------- */
  const AKTE_KEY='s5akte';
  const akteRooms=()=>{try{return JSON.parse(sessionStorage.getItem(AKTE_KEY)||'[]');}catch(e){return [];}};
  const akteAdd=label=>{
    if(!label)return;
    const list=akteRooms();
    if(list.indexOf(label)<0){list.push(label);try{sessionStorage.setItem(AKTE_KEY,JSON.stringify(list));}catch(e){}}
    akteBadge();
  };
  let badgeEl=null,sheetEl=null;
  function akteBadge(){
    const off=document.querySelector('#stickycall .off');if(!off)return;
    const n=akteRooms().length;
    if(!badgeEl){
      badgeEl=el('b','s5-akte-badge');badgeEl.setAttribute('aria-hidden','true');
      off.style.position='relative';off.appendChild(badgeEl);
    }
    badgeEl.textContent='Akte · '+n;
    badgeEl.hidden=n<1;
  }
  /* Innerhalb des Hauses führt «Offerte in 48 h» zuerst in die Akte (was habe ich gesehen?),
     ausserhalb bleibt es der normale Weg nach /kontakt. */
  function akteSheet(){
    if(sheetEl){sheetEl.classList.add('show');return;}
    const rooms=akteRooms();
    sheetEl=el('div','s5-sheet');sheetEl.id='wAkte';
    sheetEl.setAttribute('role','dialog');sheetEl.setAttribute('aria-label','Ihre Akte');
    sheetEl.innerHTML=
      '<button type="button" class="s5-sheet-x" aria-label="Schliessen">✕</button>'+
      '<small>Ihre Akte</small><h3>Sie haben '+rooms.length+' '+(rooms.length===1?'Raum':'Räume')+' angeschaut</h3>'+
      '<div class="s5-sheet-chips">'+rooms.map(r=>'<span>'+r+'</span>').join('')+'</div>'+
      '<div class="s5-sheet-btns">'+
        '<button type="button" class="s5-btn s5-btn-line" data-s5="calc">Richtpreis berechnen</button>'+
        '<button type="button" class="s5-btn s5-btn-brass" data-s5="offer">Offerte anfragen</button>'+
      '</div>';
    document.body.appendChild(sheetEl);
    requestAnimationFrame(()=>sheetEl.classList.add('show'));
    sheetEl.addEventListener('click',e=>{
      const b=e.target.closest('[data-s5],.s5-sheet-x');
      if(!b)return;
      if(b.classList.contains('s5-sheet-x'))return sheetEl.classList.remove('show');
      const rooms=akteRooms();
      if(b.dataset.s5==='calc'){
        sheetEl.classList.remove('show');
        if(window.Film16&&Film16.release)Film16.release();
        const t=document.getElementById('richtwert');
        later(()=>{if(t)t.scrollIntoView({behavior:RED()?'auto':'smooth',block:'start'});},120);
      }else{
        sheetEl.classList.remove('show');
        window.PREFILL={gewerk:'Renovation',
          msg:'Anfrage nach dem Rundgang — angeschaut: '+(rooms.length?rooms.join(', '):'das ganze Haus')+
              '. Bitte um Rückruf und Offerte innert 48 h.'};
        if(window.Film16&&Film16.release)Film16.release();
        if(typeof go==='function')go('kontakt');else location.href='/kontakt';
      }
    });
  }

  /* ---------------------------------- To-do-Zeile ---------------------------------- */
  /* Etappe 8 §2.4: Das Durchstreichen kam zu früh — der Besucher sah den Kader noch gar nicht an, da war
     die Pointe schon vorbei. Zeile nach 1,5 s, Strich nach 2,5 s (Dauer 0,8 s in CSS), Ergebnis nach 3,4 s.
     Eine echte Geste in der Kammer zieht das sofort vor (strikeNow). */
  let strikeNow=null;
  function todoLine(cfg){
    strikeNow=null;
    if(!ov||!cfg||!cfg.todo)return;
    let p=qs(ov,'.w-todo');
    const h=qs(ov,'.w-h');if(!h)return;
    if(!p){p=el('p','w-todo');h.insertAdjacentElement('afterend',p);}
    const t=cfg.todo;
    p.innerHTML=t.task
      ? '<s><i></i>'+t.task+'</s> <em>'+t.done+'</em>'
      : '<em>'+t.done+'</em> <u>'+(t.tail||'')+'</u>';
    p.classList.remove('is-in','is-struck','is-done');
    if(RED()){p.classList.add('is-in','is-struck','is-done');return;}
    later(()=>p.classList.add('is-in'),1500);
    if(t.task){
      later(()=>p.classList.add('is-struck'),2500);
      later(()=>p.classList.add('is-done'),3400);
    }else{
      later(()=>p.classList.add('is-struck','is-done'),2600);   /* Eingang: erst nach den Versprechen */
    }
    strikeNow=()=>{if(p)p.classList.add('is-in','is-struck','is-done');};
  }
  const strike=()=>{if(strikeNow)strikeNow();};

  /* ---------------------------------- Primitive ---------------------------------- */
  /* Etappe 8 §3.2: EINE Karte in EINEM festen Slot — rechts auf dem Desktop, unter der Kapitelmarke auf
     dem Telefon. Damit kann keine Mechanik mehr auf Überschrift, To-do-Zeile oder Kapitelmarke geraten. */
  function s5Card(o){
    o=o||{};
    const slot=el('div','s5-slot'+(o.slot==='top'?' s5-slot--top':' s5-slot--right'));
    const card=el('div','s5-card2'+(o.cls?' '+o.cls:''));
    slot.appendChild(card);
    host.appendChild(slot);
    later(()=>slot.classList.add('is-in'),300);
    return {slot,card};
  }
  const cardHTML=o=>
    (o.kicker?'<div class="s5-k">'+o.kicker+'</div>':'')+
    (o.title?'<div class="s5-t">'+o.title+'</div>':'')+
    (o.text?'<div class="s5-s">'+o.text+'</div>':'')+
    (o.body||'')+
    (o.hint?'<div class="s5-hint">'+o.hint+'</div>':'');

  /* Ein Regler auf Pointer Events — ersetzt den Maus-Regler, der sich am Desktop nicht greifen liess und
     dabei die ganze Seite blau markierte (Etappe 8 §2.1).
     Ursachen, beide behoben: (1) film-v16.js lauscht in der CAPTURE-Phase auf document/window und nahm den
     Zeiger vorweg — darum meldet sich der Griff eine Ebene höher (window, capture) ab; (2) ohne
     preventDefault + user-select:none startet der Browser beim Ziehen eine Textauswahl über das ganze
     Dokument. setPointerCapture hält den Zeiger am Griff, auch wenn er das Element verlässt. */
  function makeSlider(opt){
    const grip=opt.grip,track=opt.track||stage,onChange=opt.onChange||function(){};
    let drag=false;
    const pctOf=e=>{const r=stage.getBoundingClientRect();return clamp(((e.clientX-r.left)/Math.max(1,r.width))*100,opt.min||4,opt.max||96);};
    const stop=e=>{e.stopPropagation();};
    /* window/capture: läuft VOR den Dokument-Listenern des Films (Etappe 5, HANDOFF §15). */
    on(window,'pointerdown',e=>{if(grip.contains(e.target))stop(e);},true);
    on(grip,'pointerdown',e=>{
      drag=true;W.classList.add('is-s5-drag');
      try{grip.setPointerCapture(e.pointerId);}catch(x){}
      e.preventDefault();e.stopPropagation();
      onChange(pctOf(e));strike();
    });
    on(grip,'pointermove',e=>{if(drag){e.preventDefault();onChange(pctOf(e));}});
    ['pointerup','pointercancel'].forEach(ev=>on(grip,ev,e=>{
      if(!drag)return;drag=false;W.classList.remove('is-s5-drag');
      try{grip.releasePointerCapture(e.pointerId);}catch(x){}
    }));
    on(grip,'keydown',e=>{
      if(e.key!=='ArrowLeft'&&e.key!=='ArrowRight')return;
      e.preventDefault();e.stopPropagation();
      onChange(clamp((opt.get?opt.get():50)+(e.key==='ArrowRight'?6:-6),opt.min||4,opt.max||96));strike();
    });
    /* Klick auf die Fläche springt an die Stelle (der Griff ist auf dem Telefon klein). */
    on(track,'click',e=>{
      if(e.target.closest('button,a,input,.w-ov,#stickycall,.s5-sheet,.s5-slot'))return;
      onChange(pctOf(e));strike();
    });
    return {isDrag(){return drag;}};
  }

  /* Gewerk-Zeichen für die Marken (§4.2/§9) — eigene, einfache Pfade, keine Bibliothek. */
  const ICON={
    saw:'<path d="M3 15l7-7 4 4-7 7z"/><path d="M14 12l7-7-3-3-7 7"/><path d="M4 18h5"/>',
    tap:'<path d="M12 21v-9"/><path d="M8 12h8"/><path d="M12 8V6a3 3 0 0 1 3-3h4"/><path d="M9 21h6"/>',
    bolt:'<path d="M13 3L5 14h6l-1 7 8-11h-6z"/>',
    key:'<circle cx="8" cy="12" r="4"/><path d="M12 12h9M18 12v3M21 12v3"/>'
  };
  const icon=(name,size)=>'<svg viewBox="0 0 24 24" width="'+(size||18)+'" height="'+(size||18)+'" fill="none" '+
    'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(ICON[name]||'')+'</svg>';

  /* Eine Ebene UNTER dem Kapiteltext (zwischen .w-cam und .w-shade): Abendbild, Rohbau, Lichtfeld.
     Liegt sie in #wS5, deckt sie den Text zu — das war der Fehler in den ersten Entwürfen. */
  let underEl=null;
  function under(){
    if(underEl&&underEl.parentNode)return underEl;
    underEl=el('div','s5-under');underEl.setAttribute('aria-hidden','true');
    const cam=qs(stage,'.w-cam');
    if(cam&&cam.parentNode)cam.parentNode.insertBefore(underEl,cam.nextSibling);
    else stage.insertBefore(underEl,stage.firstChild);
    return underEl;
  }

  /* ---------------------------------- Mechanik 1: Sechs Anrufe → ein Rückruf (Schwelle) ---------------
     §4.1 — ohne Geste: sechs Meldungen treffen im Takt von 400 ms ein, nach einer Lesepause sammeln sie
     sich von selbst in einer Nachricht der Bauleitung mit dem Rückruf-Knopf. */
  function mechPush(cfg){
    const d=cfg.push;
    const {slot,card}=s5Card({cls:'s5-push'});
    slot.classList.add('s5-slot--stack');
    const stack=el('div','s5-stack');
    const ROT=[-2.5,2,-1.5,2.5,-2,1.5],DX=[0,10,-8,6,-10,8],STEP=isPhone()?62:86;
    d.notes.forEach((n,i)=>{
      const note=el('div','s5-note2',
        '<span class="av">'+n.av+'</span>'+
        '<span class="tx"><b>'+n.t+'</b><em>'+n.m+' · '+n.time+'</em><i>'+n.s+'</i></span>'+
        '<span class="dot"></span>');
      note.style.top=(i*STEP)+'px';
      note.style.setProperty('--r',ROT[i%6]+'deg');
      note.style.setProperty('--dx',DX[i%6]+'px');
      note.style.zIndex=String(10-i);
      stack.appendChild(note);
    });
    card.parentNode.insertBefore(stack,card);
    card.innerHTML=cardHTML({
      kicker:d.final.k,
      body:'<div class="s5-row"><span class="av-b">B</span><span><b>'+d.final.t+'</b><small>'+d.final.time+'</small></span></div>'+
           '<div class="s5-s">'+d.final.s+'</div>'+
           '<a class="s5-btn s5-btn-call" href="tel:'+((typeof CO!=='undefined'&&CO.phoneRaw)||'')+'">'+
             '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 5c0 8 7 15 15 15v-3l-4-2-2 2c-3-1-5-3-6-6l2-2-2-4H4z"/></svg> '+
             d.final.btn+'</a>'
    });
    card.classList.add('is-final');
    const notes=qa(stack,'.s5-note2');
    /* Die sechs Gewerke-Chips im Overlay sagen dasselbe wie die Meldungen (§4.1). */
    const chips=ov&&qs(ov,'.w-chips');
    if(chips&&!chips.hidden){chips.hidden=true;detach.push(()=>{chips.hidden=false;});}

    const collapse=()=>{
      slot.classList.add('is-collapsing');
      notes.slice().reverse().forEach((n,i)=>later(()=>n.classList.add('is-gone'),i*60));
      later(()=>{slot.classList.add('is-one');card.classList.add('is-pulse');strike();},520);
      later(()=>card.classList.remove('is-pulse'),1400);
    };
    return {
      /* Gesamtdauer ~4,3 s ab Halt: 6 Meldungen in 2 s, kurze Lesepause, dann das Sammeln. */
      demo(){
        notes.forEach((n,i)=>later(()=>n.classList.add('is-in'),250+i*330));
        later(collapse,2900);
      },
      rest(){notes.forEach(n=>{n.classList.add('is-in','is-gone');});slot.classList.add('is-collapsing','is-one','no-anim');},
      destroy(){}
    };
  }

  /* ---------------------------------- Mechanik 2: Takt (Küche) ----------------------------------
     §4.2 — keine Polygone mehr: drei Marken mit Gewerk-Zeichen, ein warmes Lichtfeld auf dem aktiven
     Objekt, eine Karte im festen Slot. Marken, Segmente, Pfeile und die Karte schalten weiter. */
  function mechTakt(cfg){
    const d=cfg.takt,o=orient(),n=d.zones.length;
    const {slot,card}=s5Card({slot:'top',cls:'s5-takt2'});
    const spot=el('i','s5-spot');under().appendChild(spot);
    const pins=d.zones.map((z,i)=>{
      const p=z['p'+o]||z.pP;
      const b=el('button','s5-pin',icon(z.icon));b.type='button';
      b.setAttribute('aria-label',z.t+' — Takt '+(i+1)+' von '+n);
      at(b,p.x,p.y);host.appendChild(b);
      on(b,'click',e=>{e.stopPropagation();stopDemo();show(i);strike();});
      return {b,p};
    });
    let act=-1,auto=0;
    const stopDemo=()=>{if(auto){clearTimeout(auto);auto=0;}};
    function show(i){
      act=i;
      pins.forEach((pn,j)=>{
        pn.b.classList.toggle('is-on',j===i);
        pn.b.classList.toggle('is-done',j<i);
        pn.b.classList.toggle('is-next',j===i+1);
        pn.b.innerHTML=j<i?'<span class="ok">✓</span>':icon(d.zones[j].icon);
      });
      const p=pins[i]?pins[i].p:{x:50,y:50};
      spot.style.left=p.x+'%';spot.style.top=p.y+'%';spot.classList.add('is-on');
      const z=d.zones[i];
      card.innerHTML=cardHTML({
        kicker:'Takt '+(i+1)+' von '+n+' · '+z.t,
        title:z.card.t, text:z.card.s,
        body:'<div class="s5-takt-bar" role="tablist">'+d.zones.map((_,j)=>
          '<button type="button" class="'+(j<=i?'on':'')+'" data-i="'+j+'" aria-label="Takt '+(j+1)+'"></button>').join('')+'</div>'+
          (isPhone()?'':'<div class="s5-nav"><button type="button" class="s5-arrow" data-d="-1" aria-label="Vorheriger Takt">‹</button>'+
                        '<button type="button" class="s5-arrow" data-d="1" aria-label="Nächster Takt">›</button></div>'),
        hint:isPhone()?'Tippen — nächster Takt':'Klicken — nächster Takt'
      });
      if(i>=n-1)card.classList.add('is-end');
    }
    const step=dir=>{stopDemo();show(((act+(dir||1))%n+n)%n);strike();};
    on(card,'click',e=>{
      const seg=e.target.closest('.s5-takt-bar button'),arr=e.target.closest('.s5-arrow');
      e.stopPropagation();
      if(seg)return(stopDemo(),show(+seg.dataset.i),strike());
      if(arr)return step(+arr.dataset.d);
      step(1);
    });
    on(window,'keydown',e=>{
      if(e.key!=='ArrowLeft'&&e.key!=='ArrowRight')return;
      e.preventDefault();e.stopPropagation();step(e.key==='ArrowRight'?1:-1);
    },true);
    show(0);
    return {
      demo(){
        const beat=RED()?0:1400;let i=0;
        const tick=()=>{i++;if(i>=n){auto=0;card.classList.add('is-end');return;}show(i);auto=setTimeout(tick,beat);};
        auto=setTimeout(tick,beat);
      },
      rest(){show(n-1);},
      destroy(){stopDemo();}
    };
  }

  /* ---------------------------------- Mechanik 3: Abend bei Kerzen (Bad) ----------------------------
     §4.6 — Desktop: der Regler, jetzt auf Pointer Events (makeSlider). Telefon: kein Ziehen, sondern ein
     Lichtschalter an der Wand; das Abendbild liegt UNTER dem Kapiteltext. */
  function mechDusk(cfg){
    const d=cfg.dusk,o=orient(),phone=isPhone();
    const wrap=el('div','s5-dusk');
    const img=el('img','s5-dusk-img');img.alt='';img.setAttribute('aria-hidden','true');img.decoding='async';
    img.src=d.img+o+'.jpg';
    wrap.appendChild(img);
    const glows=el('div','s5-dusk-glow');
    (d.glow[o]||d.glow.P).forEach((g,i)=>{
      const f=el('i');f.style.left=g.x+'%';f.style.top=g.y+'%';
      f.style.setProperty('--r',(g.r||7)+'vmin');f.style.setProperty('--i',i);
      glows.appendChild(f);
    });
    wrap.appendChild(glows);
    under().appendChild(wrap);

    if(phone){
      /* Lichtschalter: ein Tippen, kein Ziehen — Ziehen kollidiert auf dem Telefon mit dem Kapitelwisch. */
      let on_=false;
      const sw=el('button','s5-switch','<i></i><b></b>');sw.type='button';
      sw.setAttribute('aria-pressed','false');sw.setAttribute('aria-label','Abendlicht');
      at(sw,d.sw.x,d.sw.y);
      const lab=el('span','s5-switch-lab',d.swOff);at(lab,d.sw.x,d.sw.y);
      const ring=el('i','s5-tapring');at(ring,d.sw.x,d.sw.y);
      host.append(sw,lab,ring);
      const set=v=>{
        on_=!!v;wrap.classList.toggle('is-on',on_);sw.classList.toggle('is-on',on_);
        sw.setAttribute('aria-pressed',on_?'true':'false');lab.textContent=on_?d.swOn:d.swOff;
        if(on_&&window.V16Depth&&V16Depth.pause)V16Depth.pause();
      };
      /* Abnahme 17.09: Wer während der Vorführung tippte, schaltete gegen sie an (die Vorführung stellte
         danach wieder zurück). Ein Tippen beendet die Vorführung jetzt sofort. */
      let demoT=[];
      const stopDemo=()=>{demoT.forEach(clearTimeout);demoT=[];};
      on(sw,'click',e=>{e.stopPropagation();stopDemo();ring.remove();set(!on_);strike();});
      set(false);
      return {
        demo(){demoT=[setTimeout(()=>ring.classList.add('is-in'),400),
                     setTimeout(()=>set(true),1200),
                     setTimeout(()=>{set(false);ring.remove();},3800)];
               demoT.forEach(t=>TIMERS.push(t));},
        rest(){ring.remove();set(false);},
        destroy(){stopDemo();if(window.V16Depth&&V16Depth.resume)V16Depth.resume();}
      };
    }

    /* Desktop: Regler. --x = Anteil, ab dem das Abendbild sichtbar ist. */
    let x=0;
    const grip=el('button','s5-wipe-grip','<i>⇔</i><small>ziehen</small>');
    grip.type='button';grip.setAttribute('role','slider');
    grip.setAttribute('aria-label','Tageslicht bis Abend');
    grip.setAttribute('aria-valuemin','0');grip.setAttribute('aria-valuemax','100');
    const line=el('div','s5-wipe-line'),
          labL=el('span','s5-wipe-lab is-l',d.labL),
          labR=el('span','s5-wipe-lab is-r',d.labR);
    const ui=el('div','s5-wipe');ui.append(line,grip,labL,labR);host.appendChild(ui);
    const setX=v=>{
      x=clamp(v,4,96);
      wrap.style.setProperty('--x',x+'%');ui.style.setProperty('--x',x+'%');
      grip.setAttribute('aria-valuenow',String(Math.round(x)));
      if(window.V16Depth&&V16Depth.pause&&x>4)V16Depth.pause();
    };
    setX(RED()?d.start:0);
    /* Greift der Besucher zum Griff, hört die Vorführung sofort auf (sonst zieht sie dagegen). */
    let demoRun=false;
    makeSlider({grip,onChange:v=>{demoRun=false;setX(v);},get:()=>x});
    const tween=(from,to,ms)=>new Promise(res=>{
      if(RED()){setX(to);return res();}
      demoRun=true;
      const t0=performance.now();
      const step=now=>{
        if(!demoRun)return res();
        const p=clamp((now-t0)/ms,0,1),e=p<.5?2*p*p:1-Math.pow(-2*p+2,2)/2;
        setX(from+(to-from)*e);
        if(p<1)requestAnimationFrame(step);else res();
      };
      requestAnimationFrame(step);
    });
    return {
      demo(){tween(0,100,900).then(()=>tween(100,d.start,900));},
      rest(){setX(d.start);},
      destroy(){if(window.V16Depth&&V16Depth.resume)V16Depth.resume();}
    };
  }

  /* ---------------------------------- Mechanik 4: Bauzeitplan (Schlaf) ------------------------------
     §4.3 — senkrechte Karte statt Linie im Kader: fünf Zeilen, die aktive klappt auf. Jede Zeile ist ein
     Knopf; Rad und Pfeiltasten wirken NUR innerhalb der Karte (sonst wäre es ein Kapitelwechsel). */
  function mechAblauf(cfg){
    const d=cfg.ablauf,n=d.steps.length;
    const {slot,card}=s5Card({cls:'s5-abl2'});
    card.innerHTML=cardHTML({
      kicker:d.kicker||'Bauzeitplan',
      body:'<ol class="s5-steps">'+d.steps.map((s,i)=>
        '<li data-i="'+i+'"><button type="button" class="s5-step">'+
          '<span class="no">'+String(i+1).padStart(2,'0')+'</span>'+
          '<span class="tx"><b>'+s.t+'</b><span class="c">'+s.c+'</span></span>'+
          '<small>'+s.f+'</small></button></li>').join('')+'</ol>',
      hint:isPhone()?'Tippen — nächster Schritt':'Klicken — nächster Schritt'
    });
    const items=qa(card,'.s5-steps li');
    let act=-1,auto=0;
    const stopDemo=()=>{if(auto){clearTimeout(auto);auto=0;}};
    function setActive(i){
      act=clamp(i,0,n-1);
      items.forEach((li,j)=>{li.classList.toggle('is-on',j===act);li.classList.toggle('is-done',j<act);});
    }
    on(card,'click',e=>{
      const li=e.target.closest('.s5-steps li');
      e.stopPropagation();
      stopDemo();
      setActive(li?+li.dataset.i:(act+1)%n);strike();
    });
    /* Rad/Tasten/Wisch bleiben in der Karte: capture + stopPropagation, sonst blättert der Film das Kapitel. */
    on(card,'wheel',e=>{
      e.preventDefault();e.stopPropagation();
      stopDemo();setActive(act+((e.deltaY||0)>0?1:-1));strike();
    },{capture:true,passive:false});
    on(card,'keydown',e=>{
      if(e.key!=='ArrowUp'&&e.key!=='ArrowDown')return;
      e.preventDefault();e.stopPropagation();
      stopDemo();setActive(act+(e.key==='ArrowDown'?1:-1));strike();
    },true);
    /* KEIN Wisch auf der Karte (Abnahme 17.09): die Karte deckt auf dem Telefon die Bildmitte ab — wer
       dort wischte, blätterte den Bauzeitplan statt das Kapitel und kam aus der Kammer nicht mehr heraus.
       Auf dem Telefon schaltet nur das Tippen; der senkrechte Wisch gehört überall dem Film. */
    setActive(0);
    return {
      demo(){
        const beat=RED()?0:3000;let i=0;
        const tick=()=>{i++;if(i>=n){auto=0;return;}setActive(i);auto=setTimeout(tick,beat);};
        auto=setTimeout(tick,beat);
      },
      rest(){setActive(d.active!=null?d.active:0);},
      destroy(){stopDemo();}
    };
  }

  /* ---------------------------------- Mechanik 5: Wochen-Update + Rückblende (Wohnen) ----------------
     §4.4 — die Karte zeigt, was der Hausverwalter wirklich bekommt. Halten im Kader blendet den Rohbau
     ein («wie war es vorher»); das ersetzt das frühere Kapitel 07 samt Wischer. */
  function mechFeed(cfg){
    const d=cfg.feed,o=orient(),n=d.weeks.length;
    const {slot,card}=s5Card({cls:'s5-feed'});
    const DIR='img/film/v16/feed/';
    let w=0,auto=0,held=false,holdT=0,downXY=null,holdSeen=false;
    const stopDemo=()=>{if(auto){clearTimeout(auto);auto=0;}};
    function show(i){
      w=((i%n)+n)%n;const k=d.weeks[w];
      card.innerHTML=cardHTML({
        body:'<div class="s5-row s5-feed-h"><span class="av-b">B</span><span><b>'+d.sender+'</b><small>'+d.kicker+'</small></span><em>'+k.w+'</em></div>'+
             '<div class="s5-feed-t">'+k.t+'</div><div class="s5-s">'+k.s+'</div>'+
             '<div class="s5-thumbs">'+k.imgs.map(f=>'<img src="'+DIR+f+'" alt="" loading="lazy" decoding="async">').join('')+'</div>'+
             '<div class="s5-dots">'+d.weeks.map((_,j)=>'<i class="'+(j===w?'on':'')+'"></i>').join('')+'</div>',
        hint:(isPhone()?'Tippen — nächste Woche':'Klicken — nächste Woche')+(holdSeen?'':'<span class="s5-hold">'+d.hold+'</span>')
      });
      card.classList.remove('is-fade');void card.offsetWidth;card.classList.add('is-fade');
    }
    on(card,'click',e=>{e.stopPropagation();stopDemo();show(w+1);strike();});

    /* Rückblende: Rohbau-Ebene unter dem Text. */
    const roh=el('div','s5-roh');
    const rimg=el('img');rimg.alt='';rimg.decoding='async';rimg.src=(cfg.rueck.img)+o+'.jpg';
    roh.append(rimg,el('i','s5-roh-vin'));under().appendChild(roh);
    const lab=el('div','s5-roh-lab',cfg.rueck.lab);host.appendChild(lab);
    const setHold=v=>{
      held=!!v;roh.classList.toggle('is-on',held);lab.classList.toggle('is-on',held);
      slot.classList.toggle('is-dim',held);
      if(held&&!holdSeen){holdSeen=true;strike();}
      if(held&&window.V16Depth&&V16Depth.pause)V16Depth.pause();
    };
    /* pointerdown auf der Bühne, aber nicht auf Bedienelementen; > 12 px Bewegung = Wisch, nicht Halten.
       .w-ov steht bewusst NICHT in der Liste: der Kapiteltext ist kein Bedienelement, deckt aber die halbe
       Bühne ab — mit ihm in der Liste liess sich links im Kader gar nicht halten (Sichtprüfung 17.09). */
    on(stage,'pointerdown',e=>{
      if(e.target.closest('button,a,input,.s5-slot,.w-hs,#stickycall,.s5-sheet,#wRoomNav'))return;
      downXY={x:e.clientX,y:e.clientY};
      holdT=setTimeout(()=>{holdT=0;setHold(true);},180);
      TIMERS.push(holdT);
    },true);
    on(window,'pointermove',e=>{
      if(!downXY)return;
      if(Math.abs(e.clientX-downXY.x)>12||Math.abs(e.clientY-downXY.y)>12){
        if(holdT){clearTimeout(holdT);holdT=0;}
        if(held)setHold(false);
        downXY=null;
      }
    },{passive:true});
    const end=()=>{if(holdT){clearTimeout(holdT);holdT=0;}downXY=null;if(held)setHold(false);};
    ['pointerup','pointercancel'].forEach(ev=>on(window,ev,end,true));
    /* Der Klick, der ein Halten beendet, darf nicht als «Seite freigeben» beim Film landen. */
    on(window,'click',e=>{if(held){e.preventDefault();e.stopPropagation();}},true);
    on(stage,'contextmenu',e=>e.preventDefault());
    on(window,'keydown',e=>{if(e.key===' '&&!e.repeat&&!e.target.closest('button,a,input')){setHold(true);}},true);
    on(window,'keyup',e=>{if(e.key===' ')setHold(false);},true);
    W.classList.add('s5-feed-on');

    show(0);
    return {
      demo(){
        const beat=RED()?0:2200;let i=0;
        const tick=()=>{i++;if(i>=n){auto=0;return;}show(i);auto=setTimeout(tick,beat);};
        auto=setTimeout(tick,beat);
      },
      rest(){show(n-1);},
      destroy(){stopDemo();end();W.classList.remove('s5-feed-on');}
    };
  }

  /* ---------------------------------- Mechanik 6: 48-Stunden-Uhr (Eingang) ---------------------------------- */
  const DE_DAYS=['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];
  /* Kalendarische 48 h (Entscheid des Eigentümers, §10.2): jetzt + 48 h, Wochenende zählt mit.
     Minuten auf die nächste halbe Stunde aufrunden, damit die Zusage rund klingt. */
  function deadline48(now){
    const d=new Date((now||Date.now())+48*3600*1000);
    const fmt=new Intl.DateTimeFormat('de-CH',{timeZone:'Europe/Zurich',weekday:'long',hour:'2-digit',minute:'2-digit',hour12:false});
    const parts={};fmt.formatToParts(d).forEach(p=>parts[p.type]=p.value);
    let h=parseInt(parts.hour,10),m=parseInt(parts.minute,10),day=parts.weekday;
    if(m===0){/* schon rund */}
    else if(m<=30)m=30;
    else{m=0;h=(h+1)%24;if(h===0){const i=DE_DAYS.indexOf(day);day=DE_DAYS[(i+1)%7];}}
    /* Sichtprüfung 16.09: kalendarisch gerechnet (Entscheid des Eigentümers) landete die Frist auch mal auf
       «Samstag, 00:30» — rechnerisch richtig, als Versprechen unglaubwürdig. Darum die ANZEIGE in die
       Bürozeit ziehen: nie später als 18:00, nie früher als 08:00 — beides VOR der 48-h-Marke, das
       Versprechen wird dadurch nur enger, nie weiter. Der Tag bleibt, wie er gerechnet wurde. */
    if(h<8){h=18;m=0;const i=DE_DAYS.indexOf(day);day=DE_DAYS[(i+6)%7];}   /* Vortag 18:00 — früher, nicht später */
    else if(h>18||(h===18&&m>0)){h=18;m=0;}
    return {day,time:String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')};
  }
  /* §4.5 — Frist, Versprechen und Unterschrift als EIN Objekt: das Übergabeprotokoll. Der Schlüssel im
     Kopf dreht sich beim Auftritt; darunter die beiden Wege (Offerte / Richtpreis-Rechner). */
  function mechClock(cfg){
    const d=cfg.clock;
    const {slot,card}=s5Card({cls:'s5-prot'});
    const sig=document.getElementById('wSig'),sv=sig&&sig.querySelector('svg');
    const sigHTML=sv?sv.outerHTML.replace(/style="[^"]*"/g,''):'';
    const btns=isPhone()
      ? '<button type="button" class="s5-k s5-calc" data-s5="calc">'+d.btnCalc+' →</button>'
      : '<div class="s5-btns"><button type="button" class="s5-btn" data-s5="offer">'+d.btnOffer+' →</button>'+
        '<button type="button" class="s5-btn s5-btn-line" data-s5="calc">'+d.btnCalc+'</button></div>';
    const paint=()=>{
      const t=deadline48();
      card.innerHTML=
        '<div class="s5-prot-h"><span class="key">'+icon('key',18)+'</span>'+
          '<span><span class="s5-k">'+d.kicker+'</span><small>'+d.sub+'</small></span></div>'+
        '<div class="s5-prot-b">'+
          '<div class="s5-k s5-k-mute">'+d.pre+'</div><div class="s5-big">'+t.day+', '+t.time+'</div>'+
          '<ul class="s5-vp2">'+d.versprechen.map(v=>'<li>'+v+'</li>').join('')+'</ul>'+
          '<div class="s5-sigrow">'+sigHTML+'<span class="who">Artem Kozlovskyi<br>Inhaber</span></div>'+
          (isPhone()?btns:'')+
        '</div>';
      if(!isPhone())card.insertAdjacentHTML('afterend',btns);
    };
    paint();
    const iv=setInterval(()=>{const t=deadline48(),b=qs(card,'.s5-big');if(b)b.textContent=t.day+', '+t.time;},60000);
    detach.push(()=>clearInterval(iv));
    if(sig)sig.hidden=true;                     /* die Unterschrift lebt jetzt IN der Karte */
    W.classList.add('s5-clock-on');
    /* Beide Wege hängen an denselben Aktionen wie in der Akte-Schublade (§2.5). */
    on(slot,'click',e=>{
      const b=e.target.closest('[data-s5]');if(!b)return;
      e.preventDefault();e.stopPropagation();
      if(b.dataset.s5==='calc'){
        if(window.Film16&&Film16.release)Film16.release();
        const t=document.getElementById('richtwert');
        later(()=>{if(t)t.scrollIntoView({behavior:RED()?'auto':'smooth',block:'start'});},120);
      }else{
        window.PREFILL={gewerk:'Renovation',msg:'Anfrage nach dem Rundgang. Bitte um Rückruf und Offerte innert 48 h.'};
        if(window.Film16&&Film16.release)Film16.release();
        if(typeof go==='function')go('kontakt');else location.href='/kontakt';
      }
    });
    const runSig=()=>{const s=qs(card,'svg.sig');if(!s)return;
      qa(s,'path').forEach(p=>{const L=p.getTotalLength?p.getTotalLength():150;
        p.style.transition='none';p.style.strokeDasharray=L;p.style.strokeDashoffset=L;
        void p.getBoundingClientRect();
        p.style.transition='stroke-dashoffset .7s ease '+(0.12*Array.prototype.indexOf.call(s.children,p))+'s';
        p.style.strokeDashoffset='0';});};
    return {
      demo(){
        later(()=>card.classList.add('is-key'),320);
        later(()=>{card.classList.add('is-pulse');runSig();},760);
        later(()=>card.classList.remove('is-pulse'),1700);
      },
      rest(){card.classList.add('is-key','no-anim');qa(card,'svg.sig path').forEach(p=>{p.style.strokeDashoffset='0';});},
      destroy(){W.classList.remove('s5-clock-on');if(sig)sig.hidden=false;if(sv&&sv._sigReset)sv._sigReset();}
    };
  }

  const MECHS={push:mechPush,takt:mechTakt,dusk:mechDusk,ablauf:mechAblauf,feed:mechFeed,clock:mechClock};

  /* ---------------------------------- Auf-/Abbau je Kammer ---------------------------------- */
  function teardown(){
    clearTimers();
    detach.forEach(fn=>{try{fn();}catch(e){}});detach=[];
    if(cur&&cur.destroy){try{cur.destroy();}catch(e){}}
    cur=null;curCfg=null;curScene=null;strikeNow=null;
    if(host){host.innerHTML='';host.classList.remove('is-on');}
    if(underEl){underEl.remove();underEl=null;}
    if(W)W.classList.remove('s5-clock-on','s5-feed-on','is-s5-drag');
    if(ov){ov.classList.remove('s5-dim');const p=qs(ov,'.w-todo');if(p)p.classList.remove('is-in','is-struck','is-done');}
  }
  function build(k,scene){
    teardown();
    if(!scene)return;
    const cfg=S5[scene.id];
    curScene=scene;curCfg=cfg;
    W.setAttribute('data-s5-k',String(k));   /* CSS: «Rundgang»-Knopf nur in der Ankunft */
    if(k>0)akteAdd(scene.navLabel);            /* die Ankunft ist kein besuchter Raum — die Akte beginnt bei 1 */
    else akteBadge();
    if(!cfg)return;
    todoLine(cfg);
    const make=cfg.mech&&MECHS[cfg.mech];
    if(!make)return;
    try{cur=make(cfg,scene);}catch(e){cur=null;if(window.console)console.warn('[stage5]',cfg.mech,e);}
    if(!cur)return;
    host.classList.add('is-on');
    if(RED()||demoSeen(scene.id)){cur.rest();}
    else{later(()=>{if(cur&&cur.demo)cur.demo();demoDone(scene.id);},900);}
  }

  /* ---------------------------------- Trace-Modus (?trace=1) ---------------------------------- */
  function traceMode(){
    if(!/[?&]trace=1\b/.test(location.search))return;
    const lay=el('div','s5-trace');document.body.appendChild(lay);
    const tag=el('div','s5-trace-tag','klick = {x,y} in %');document.body.appendChild(tag);
    stage.addEventListener('click',e=>{
      const r=stage.getBoundingClientRect();
      const x=+(((e.clientX-r.left)/r.width)*100).toFixed(1),y=+(((e.clientY-r.top)/r.height)*100).toFixed(1);
      const p=el('i');p.style.left=x+'%';p.style.top=y+'%';lay.appendChild(p);
      tag.textContent=x+','+y+'   ('+orient()+')';
      console.log('[trace]',{x,y,orient:orient(),ch:window.Film16?Film16.ch:'?'});
    },true);
  }

  /* ---------------------------------- Start ---------------------------------- */
  function boot(){
    W=document.getElementById('wohnung');if(!W)return;
    stage=document.getElementById('wStage');ov=document.getElementById('wOv');
    if(!stage||!ov)return;
    if(host&&host.parentNode===stage)return;                /* schon montiert (SPA-Rückkehr) */
    host=el('div','s5-host');host.id='wS5';host.setAttribute('aria-hidden','false');
    stage.insertBefore(host,ov);                            /* vor #wOv: gleicher z-index, Text bleibt oben */
    akteBadge();
    /* «Offerte in 48 h» führt im Haus zuerst in die Akte.
       BUG (16.09): der Haken hing am Knopf selbst — film-v16.js lauscht aber auf DOCUMENT in der
       Capture-Phase (onClickAny) und ruft dort releaseHouse(); wenn unser Haken an die Reihe kam, war
       Film16.house schon false und die Schublade öffnete nie. Darum eine Ebene höher, an WINDOW: dort
       läuft er vor dem Dokument, hält das Haus und stoppt die Weitergabe. */
    if(!window.__s5AkteHook){
      window.__s5AkteHook=true;
      addEventListener('click',e=>{
        const t=e.target&&e.target.closest&&e.target.closest('#stickycall .off');
        if(!t)return;
        if(!(window.Film16&&Film16.house))return;      /* ausserhalb des Hauses: normaler Weg nach /kontakt */
        e.preventDefault();e.stopPropagation();akteSheet();
      },true);
    }
    W.addEventListener('v16:hold',e=>{const dt=e.detail||{};build(dt.k!=null?dt.k:dt.ch,dt.scene||F.scenes[dt.ch]);});
    W.addEventListener('v16:leave',teardown);
    W.addEventListener('v16:exit',teardown);
    traceMode();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);
  else boot();
  addEventListener('v16:mounted',boot);
  window.Stage5={boot,teardown,deadline48,akte:akteRooms,sheet:akteSheet};
})();
