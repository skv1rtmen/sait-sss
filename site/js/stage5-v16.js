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
  function todoLine(cfg){
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
    later(()=>p.classList.add('is-in'),120);
    if(t.task){
      later(()=>p.classList.add('is-struck'),820);
      later(()=>p.classList.add('is-done'),1320);
    }else{
      later(()=>p.classList.add('is-struck','is-done'),900);   /* Eingang: erst nach den Versprechen */
    }
  }

  /* ---------------------------------- Mechanik 1: Sechs → Eins ---------------------------------- */
  function mechSix2One(cfg){
    const d=cfg.six,hub=pick(d.hub),o=orient();
    const wrap=el('div','s5-six');
    const svg=svgEl('svg',{viewBox:'0 0 100 100',preserveAspectRatio:'none',class:'s5-lines'});
    const notes=[];
    d.notes.forEach((n,i)=>{
      const p=n[o]||n.P;
      const line=svgEl('line',{x1:p.x+8,y1:p.y+4,x2:hub.x,y2:hub.y,class:'s5-line'});
      svg.appendChild(line);
      const note=el('div','s5-note','<b>'+n.t+'</b>'+n.l);
      note.style.left=p.x+'%';note.style.top=p.y+'%';
      note.style.setProperty('--r',n.r+'deg');note.style.setProperty('--i',i);
      notes.push(note);
    });
    wrap.appendChild(svg);notes.forEach(n=>wrap.appendChild(n));
    const dot=el('button','s5-hub');dot.type='button';
    dot.setAttribute('aria-label','Sechs Gewerke — halten zum Vergleich');
    at(dot,hub.x,hub.y);wrap.appendChild(dot);
    const card=el('div','s5-card s5-card-hub',
      '<small>'+d.card.k+'</small><b>'+d.card.t+'</b><u>'+d.card.s+'</u>');
    at(card,hub.x,hub.y);wrap.appendChild(card);
    host.appendChild(wrap);

    /* Die sechs Gewerke-Chips im Overlay sagen dasselbe wie die Zettel — in dieser Kammer übernimmt
       die Geste, die Chips bleiben weg (§4.1). */
    const chips=ov&&qs(ov,'.w-chips');
    if(chips&&!chips.hidden){chips.hidden=true;detach.push(()=>{chips.hidden=false;});}
    const hold=v=>{
      wrap.classList.toggle('is-held',v);
      if(ov)ov.classList.toggle('s5-dim',v);
    };
    on(dot,'pointerdown',e=>{e.preventDefault();hold(true);try{dot.setPointerCapture(e.pointerId);}catch(x){}});
    ['pointerup','pointercancel','pointerleave'].forEach(ev=>on(dot,ev,()=>hold(false)));
    on(dot,'keydown',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();hold(true);later(()=>hold(false),1400);}});

    return {
      demo(){later(()=>{hold(true);later(()=>hold(false),1400);},0);},
      rest(){wrap.classList.add('is-rest');},
      destroy(){if(ov)ov.classList.remove('s5-dim');}
    };
  }

  /* ---------------------------------- Mechanik 2: Takt (Küche) ---------------------------------- */
  function mechTakt(cfg){
    const d=cfg.takt,o=orient();
    const wrap=el('div','s5-takt');
    const svg=svgEl('svg',{viewBox:'0 0 100 100',preserveAspectRatio:'none',class:'s5-zones'});
    const polys=[],pills=[],card=el('div','s5-card s5-card-takt');
    d.zones.forEach((z,i)=>{
      const poly=svgEl('polygon',{points:z[o]||z.P,class:'s5-zone','data-i':i});
      svg.appendChild(poly);polys.push(poly);
      const pp=z['p'+o]||z.pP;
      const pill=el('span','s5-pill',(i+1)+' · '+z.t+'<i>✓</i>');
      at(pill,pp.x,pp.y);pill.style.setProperty('--i',i);
      wrap.appendChild(pill);pills.push(pill);
    });
    wrap.insertBefore(svg,wrap.firstChild);
    const cp=(d.card&&(d.card[o]||d.card.P))||{x:50,y:28};
    at(card,cp.x,cp.y);wrap.appendChild(card);
    const endLine=el('div','s5-takt-end',d.end);wrap.appendChild(endLine);
    host.appendChild(wrap);

    let running=false;
    const show=i=>{
      polys.forEach((p,j)=>{p.classList.toggle('is-on',j===i);p.classList.toggle('is-done',j<i);});
      pills.forEach((p,j)=>{p.classList.toggle('is-on',j===i);p.classList.toggle('is-done',j<i);});
      if(i>=0){card.innerHTML='<small>'+(i+1)+' · '+d.zones[i].t.toUpperCase()+'</small><b>'+d.zones[i].l+'</b>';card.classList.add('show');}
      else card.classList.remove('show');
    };
    const run=()=>{
      if(running)return;running=true;endLine.classList.remove('show');
      const beat=RED()?0:650;
      d.zones.forEach((z,i)=>later(()=>show(i),beat*i));
      later(()=>{
        show(-1);polys.forEach(p=>p.classList.add('is-done'));pills.forEach(p=>p.classList.add('is-done'));
        endLine.classList.add('show');
        later(()=>{endLine.classList.remove('show');running=false;},1800);
      },beat*d.zones.length);
    };
    /* Tippen irgendwo im Kader (nicht auf Bedienelemente) startet den Takt. */
    on(stage,'click',e=>{
      if(e.target.closest('button,a,input,.w-ov,#stickycall,.s5-sheet,.w-cmp-h'))return;
      run();
    });
    /* Bonus: Zeiger über einer Zone hebt sie hervor, ohne die Sequenz zu starten. */
    polys.forEach((p,i)=>{p.style.pointerEvents='auto';
      on(p,'pointerenter',()=>{if(!running)show(i);});
      on(p,'pointerleave',()=>{if(!running)show(-1);});
    });
    return {demo(){run();},rest(){polys.forEach(p=>p.classList.add('is-done'));pills.forEach(p=>p.classList.add('is-done'));},destroy(){}};
  }

  /* ---------------------------------- Mechanik 3: Abend bei Kerzen (Bad) ---------------------------------- */
  function mechDusk(cfg,scene){
    const d=cfg.dusk,o=orient();
    const wrap=el('div','s5-dusk');
    const img=el('img','s5-dusk-img');img.alt='';img.setAttribute('aria-hidden','true');img.decoding='async';
    img.src=d.img+o+'.jpg';
    /* Solange der Abend-Render (§6) nicht im Repo liegt, wird der Tages-Halt per Filter zum Abend
       umgefärbt — die Geste funktioniert, nur die Kerzen fehlen. Der Austausch ist ein Dateikopieren. */
    img.addEventListener('error',()=>{
      wrap.classList.add('is-fallback');
      img.src=(FILM_V16.v16.stillDir)+(FILM_V16.v16.rooms[Film16?Film16.ch:3])+'-'+o+'.jpg';
    },{once:true});
    wrap.appendChild(img);
    const glows=el('div','s5-dusk-glow');
    (d.glow[o]||d.glow.P).forEach((g,i)=>{
      const f=el('i');f.style.left=g.x+'%';f.style.top=g.y+'%';
      f.style.setProperty('--r',(g.r||7)+'vmin');f.style.setProperty('--i',i);
      glows.appendChild(f);
    });
    wrap.appendChild(glows);
    const line=el('div','s5-wipe-line'),
          grip=el('button','s5-wipe-grip','<i>☀</i><i>☾</i>'),
          labL=el('span','s5-wipe-lab is-l',d.labL),
          labR=el('span','s5-wipe-lab is-r',d.labR);
    grip.type='button';grip.setAttribute('role','slider');
    grip.setAttribute('aria-label','Tageslicht bis Abend');
    grip.setAttribute('aria-valuemin','0');grip.setAttribute('aria-valuemax','100');
    const ui=el('div','s5-wipe');ui.append(line,grip,labL,labR);
    host.appendChild(wrap);host.appendChild(ui);

    const setX=x=>{
      x=clamp(x,4,96);
      wrap.style.setProperty('--x',x+'%');ui.style.setProperty('--x',x+'%');
      grip.setAttribute('aria-valuenow',String(Math.round(x)));
      /* 2,5D würde den Tages-Halt bewegen, während der Abend-Layer stillsteht — darum aus, sobald gewischt wird. */
      if(window.V16Depth&&V16Depth.pause&&x>4)V16Depth.pause();
    };
    setX(RED()?d.start:0);
    let drag=false;
    const fromEv=e=>{const r=stage.getBoundingClientRect();return ((e.clientX-r.left)/Math.max(1,r.width))*100;};
    on(grip,'pointerdown',e=>{drag=true;ui.classList.add('is-drag');try{grip.setPointerCapture(e.pointerId);}catch(x){}setX(fromEv(e));e.preventDefault();});
    on(window,'pointermove',e=>{if(drag)setX(fromEv(e));},{passive:true});
    ['pointerup','pointercancel'].forEach(ev=>on(window,ev,()=>{drag=false;ui.classList.remove('is-drag');}));
    on(grip,'keydown',e=>{
      const v=parseFloat(ui.style.getPropertyValue('--x'))||d.start;
      if(e.key==='ArrowLeft'){setX(v-6);e.preventDefault();}
      else if(e.key==='ArrowRight'){setX(v+6);e.preventDefault();}
    });
    /* Tippen auf den Kader springt zur Stelle — auf dem Telefon ist der Griff klein. */
    on(stage,'click',e=>{if(e.target.closest('button,a,.w-ov,#stickycall,.s5-sheet'))return;setX(fromEv(e));});

    const tween=(from,to,ms)=>new Promise(res=>{
      if(RED()){setX(to);return res();}
      const t0=performance.now();
      const step=now=>{
        const p=clamp((now-t0)/ms,0,1),e=p<.5?2*p*p:1-Math.pow(-2*p+2,2)/2;   /* power2.inOut */
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

  /* ---------------------------------- Mechanik 4: Ablauf-Lichtlinie (Schlaf) ---------------------------------- */
  function mechAblauf(cfg){
    const d=cfg.ablauf,o=orient(),L=d.line[o]||d.line.P;
    const n=d.steps.length,xs=d.steps.map((_,i)=>L.x0+(L.x1-L.x0)*i/(n-1));
    const wrap=el('div','s5-ablauf');
    const svg=svgEl('svg',{viewBox:'0 0 100 100',preserveAspectRatio:'none',class:'s5-abl-svg'});
    svg.appendChild(svgEl('line',{x1:L.x0,y1:L.y,x2:L.x1,y2:L.y,class:'s5-abl-base'}));
    const lit=svgEl('line',{x1:L.x0,y1:L.y,x2:L.x0,y2:L.y,class:'s5-abl-lit'});
    svg.appendChild(lit);wrap.appendChild(svg);
    const dots=[],labs=[];
    d.steps.forEach((s,i)=>{
      const dot=el('i','s5-abl-dot');at(dot,xs[i],L.y);wrap.appendChild(dot);dots.push(dot);
      const lab=el('div','s5-abl-lab'+(i%2?' is-up':'')+(i===0?' is-first':'')+(i===n-1?' is-last':''),'<b>'+s.t+'</b><span>'+s.f+'</span>');
      at(lab,xs[i],L.y);wrap.appendChild(lab);labs.push(lab);
    });
    const card=el('div','s5-card s5-card-abl');at(card,50,L.y+14);wrap.appendChild(card);
    host.appendChild(wrap);

    let act=-1;
    const setActive=i=>{
      if(i===act)return;act=i;
      dots.forEach((dt,j)=>{dt.classList.toggle('is-on',j===i);dt.classList.toggle('is-done',j<i);});
      labs.forEach((lb,j)=>{lb.classList.toggle('is-on',j===i);lb.classList.toggle('is-done',j<=i);});
      lit.setAttribute('x2',String(xs[clamp(i,0,n-1)]));
      if(i>=0){
        card.innerHTML='<small>Schritt '+(i+1)+' von '+n+'</small><b>'+d.steps[i].c+'</b>';
        card.classList.add('show');
      }else card.classList.remove('show');
    };
    const nearest=clientX=>{
      const r=stage.getBoundingClientRect(),x=((clientX-r.left)/Math.max(1,r.width))*100;
      let best=0,bd=1e9;xs.forEach((v,i)=>{const dd=Math.abs(v-x);if(dd<bd){bd=dd;best=i;}});
      return best;
    };
    /* Waagerechtes Ziehen scrubbt — film-v16.js ignoriert waagerechte Gesten, darum kein Konflikt
       mit dem Kapitelwechsel (dort zählt nur |dy| > |dx|). */
    on(stage,'pointermove',e=>{if(e.pointerType==='mouse'&&!e.buttons)return;setActive(nearest(e.clientX));},{passive:true});
    let tx=0,ty=0;
    on(stage,'touchstart',e=>{const t=e.touches[0];tx=t.clientX;ty=t.clientY;},{passive:true});
    on(stage,'touchmove',e=>{
      const t=e.touches[0],dx=Math.abs(t.clientX-tx),dy=Math.abs(t.clientY-ty);
      if(dx>10&&dx>dy)setActive(nearest(t.clientX));
    },{passive:true});
    dots.forEach((dt,i)=>{dt.style.pointerEvents='auto';on(dt,'pointerenter',()=>setActive(i));});

    const sweep=()=>{
      if(RED())return setActive(d.active);
      wrap.classList.add('is-sweep');
      const ms=1800,t0=performance.now();
      const step=now=>{
        const p=clamp((now-t0)/ms,0,1);
        lit.setAttribute('x2',String(L.x0+(L.x1-L.x0)*p));
        const upto=Math.min(n-1,Math.floor(p*n));
        dots.forEach((dt,j)=>dt.classList.toggle('is-done',j<=upto));
        labs.forEach((lb,j)=>lb.classList.toggle('is-done',j<=upto));
        if(p<1)requestAnimationFrame(step);
        else{wrap.classList.remove('is-sweep');setActive(d.active);}
      };
      requestAnimationFrame(step);
    };
    return {demo(){sweep();},rest(){setActive(d.active);},destroy(){}};
  }

  /* ---------------------------------- Mechanik 5: Rückblende-Wischer ---------------------------------- */
  function mechWipe(cfg){
    const cmp=document.getElementById('wCmp');
    if(!cmp)return {demo(){},rest(){},destroy(){}};
    const l=qs(cmp,'.w-cmp-tag-l'),r=qs(cmp,'.w-cmp-tag-r');
    const oldL=l?l.textContent:'',oldR=r?r.textContent:'';
    if(l)l.textContent=cfg.wipe.labL;
    if(r)r.textContent=cfg.wipe.labR;
    cmp.classList.add('s5-wipe-on');
    return {demo(){},rest(){},destroy(){
      cmp.classList.remove('s5-wipe-on');
      if(l)l.textContent=oldL;if(r)r.textContent=oldR;
    }};
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
  function mechClock(cfg){
    const d=cfg.clock,o=orient();
    const wrap=el('div','s5-clock');
    const card=el('div','s5-card s5-card-clock');
    wrap.appendChild(card);
    const list=el('div','s5-versprechen');
    d.versprechen.forEach((t,i)=>{
      const row=el('div','s5-vp','<span>'+String(i+1).padStart(2,'0')+'</span><b>'+t+'</b>');
      row.style.setProperty('--i',i);list.appendChild(row);
    });
    wrap.appendChild(list);host.appendChild(wrap);

    const paint=()=>{const t=deadline48();
      card.innerHTML='<small>'+d.kicker+'</small><b>'+d.pre+' <u>'+t.day+', '+t.time+'</u></b>';};
    paint();
    const iv=setInterval(paint,60000);detach.push(()=>clearInterval(iv));

    const sig=document.getElementById('wSig'),sv=sig&&sig.querySelector('svg');
    W.classList.add('s5-clock-on');            /* CSS rückt die Unterschrift in das freie Band unter den Versprechen */
    return {
      demo(){
        wrap.classList.add('is-in');
        later(()=>{if(sv&&sv._sigRun)sv._sigRun();},RED()?0:120*d.versprechen.length+500);
      },
      rest(){wrap.classList.add('is-in','no-anim');if(sv&&sv._sigRun)sv._sigRun();},
      destroy(){W.classList.remove('s5-clock-on');if(sv&&sv._sigReset)sv._sigReset();}
    };
  }

  const MECHS={six2one:mechSix2One,takt:mechTakt,dusk:mechDusk,ablauf:mechAblauf,wipe:mechWipe,clock:mechClock};

  /* ---------------------------------- Auf-/Abbau je Kammer ---------------------------------- */
  function teardown(){
    clearTimers();
    detach.forEach(fn=>{try{fn();}catch(e){}});detach=[];
    if(cur&&cur.destroy){try{cur.destroy();}catch(e){}}
    cur=null;curCfg=null;curScene=null;
    if(host){host.innerHTML='';host.classList.remove('is-on');}
    if(W)W.classList.remove('s5-clock-on');
    if(ov){ov.classList.remove('s5-dim');const p=qs(ov,'.w-todo');if(p)p.classList.remove('is-in','is-struck','is-done');}
  }
  function build(k,scene){
    teardown();
    if(!scene)return;
    const cfg=S5[scene.id];
    curScene=scene;curCfg=cfg;
    W.setAttribute('data-s5-k',String(k));   /* CSS: «Rundgang»-Knopf nur in der Ankunft */
    akteAdd(scene.navLabel);
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
    /* «Offerte in 48 h» führt im Haus zuerst in die Akte. */
    const off=document.querySelector('#stickycall .off');
    if(off&&!off._s5){
      off._s5=true;
      off.addEventListener('click',e=>{
        const inHouse=window.Film16&&Film16.house;
        if(!inHouse)return;
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
  window.Stage5={boot,teardown,deadline48,akte:akteRooms};
})();
