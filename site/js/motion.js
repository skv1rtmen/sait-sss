/* BauStern — Motion: gesamte GSAP/ScrollTrigger-Choreografie (SPEC §6).
   Motion.mount(route) legt alles in einem gsap.context() an, Motion.unmount() räumt auf.
   Modi (gsap.matchMedia):
     full : ≥1000px und normale Bewegung -> volle Choreografie (Home: Pin, Parallax, Clips, Stagger)
     lite : <1000px und normale Bewegung -> nur .rv-Reveals, Counter, Marquee, Rundgang als Standbilder
     off  : prefers-reduced-motion -> statische, vollständig sichtbare Inhalte ohne Pin/Scrub
   html.no-gsap (Vendor fehlt) -> mount() tut nichts, CSS zeigt alles. */
(function(){
  const MQ_FULL='(min-width:1000px) and (prefers-reduced-motion:no-preference)';
  const MQ_LITE='(max-width:999px) and (prefers-reduced-motion:no-preference)';
  const MQ_OFF='(prefers-reduced-motion:reduce)';
  const REVEAL={duration:.5,ease:'power2.out'};

  let ctx=null,mm=null,obs=null,mode='none',worksTriggers=[],nativeCleanup=null;
  const noGsap=()=>document.documentElement.classList.contains('no-gsap');
  const live=()=>!noGsap()&&typeof gsap!=='undefined'&&typeof gsap.context==='function'&&typeof ScrollTrigger!=='undefined'&&typeof ScrollTrigger.create==='function';
  const refresh=()=>{if(live())ScrollTrigger.refresh();};

  if(typeof ScrollTrigger!=='undefined'&&typeof ScrollTrigger.config==='function')ScrollTrigger.config({ignoreMobileResize:true});
  if(document.readyState!=='complete')addEventListener('load',refresh,{once:true});
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(refresh).catch(()=>{});

  /* ---------- Bausteine ---------- */
  const qa=(root,sel)=>Array.prototype.slice.call(root.querySelectorAll(sel));
  const q1=(root,sel)=>root.querySelector(sel);

  /* ---------- Sheet-Kit (Block 3, ЭТАП 2.1/2.2) ----------
     Ersetzt die verstreuten Ad-hoc-y:64/opacity-Tweens durch 3 kanonische Entrance-Typen, konsequent nach
     Kontext gewählt: fade (weiches Einblenden für Hintergrund-Flächen/Zitate/Textblöcke), wipe (architektonischer
     Schnitt per clip-path für Fotos/Full-Bleed-Blöcke), splitLine (maskierte Enthüllung für H2/Kernthesen).
     opt.scrub (Zahl oder true) schaltet auf scroll-gebundenes Scrubbing (film.js' Blätter) statt einmaligem
     Reveal (generische .rv/Gruppen-Reveals) — beide Modi teilen sich dieselbe Logik, damit es EIN Sheet-Kit ist,
     kein zweites System nur für die Wohnung. window.SheetKit macht die drei Typen auch film.js zugänglich. */
  const SheetKit=(function(){
    function stConf(list,opt){
      const st={trigger:opt.trigger||list[0],start:opt.start||'top 88%'};
      if(opt.scrub){st.end=opt.end||'top 45%';st.scrub=opt.scrub===true?.5:opt.scrub;}else{st.once=opt.once!==false;}
      return st;
    }
    function fade(els,opt){
      opt=opt||{};const list=Array.isArray(els)?els:[els];if(!list.length)return null;
      return gsap.fromTo(list,{opacity:0,y:opt.y!=null?opt.y:16},
        {opacity:1,y:0,duration:opt.duration||.6,ease:opt.scrub?'none':(opt.ease||'power2.out'),stagger:opt.stagger||0,
         scrollTrigger:stConf(list,opt)});
    }
    function wipe(els,opt){
      opt=opt||{};const list=Array.isArray(els)?els:[els];if(!list.length)return null;
      const from=opt.from||'inset(100% 0 0 0)';
      gsap.set(list,{opacity:1});
      return gsap.fromTo(list,{clipPath:from},
        {clipPath:'inset(0 0 0 0)',duration:opt.duration||.9,ease:opt.scrub?'none':(opt.ease||'power3.out'),stagger:opt.stagger||0,
         clearProps:opt.scrub?'':'clipPath',scrollTrigger:stConf(list,opt)});
    }
    /* Maskierte Block-Enthüllung: der komplette Überschriften-Block fährt aus einer overflow:hidden-Maske hoch —
       bewusst ohne das Innen-HTML zu zerlegen (H2 tragen oft <em>/<br>, ein Wort-für-Wort-Rebuild würde das zerstören).
       Läuft je Element nur einmal (el.__slDone). */
    function splitLine(el,opt){
      opt=opt||{};if(!el||el.__slDone)return null;el.__slDone=1;
      const wrap=document.createElement('div');wrap.className='sl-mask';
      el.parentNode.insertBefore(wrap,el);wrap.appendChild(el);
      gsap.set(wrap,{overflow:'hidden'});
      return gsap.fromTo(el,{yPercent:112,opacity:0},{yPercent:0,opacity:1,duration:opt.duration||.85,ease:opt.ease||'power4.out',
        scrollTrigger:{trigger:opt.trigger||wrap,start:opt.start||'top 85%',once:true}});
    }
    return {fade,wipe,splitLine};
  })();
  window.SheetKit=SheetKit;

  function countUp(root){
    qa(root,'[data-count]').forEach(el=>{
      const target=parseFloat(el.dataset.count),suf=el.dataset.suf||'';
      if(isNaN(target))return;
      ScrollTrigger.create({trigger:el,start:'top 92%',once:true,onEnter:()=>{
        gsap.to({v:0},{v:target,duration:1.4,ease:'power2.out',onUpdate:function(){el.textContent=Math.round(this.targets()[0].v)+suf;}});
      }});
    });
  }
  /* Alle .rv (ausser den bereits gesondert animierten): Sheet-Kit fade, einmalig, top 92% —
     Block 3 (2.2): ersetzt das frühere Ad-hoc-opacity/y-Tween 1:1 durch den kanonischen "fade"-Typ. */
  function reveals(root,skip){
    qa(root,'.rv').filter(el=>!skip.has(el)).forEach(el=>{
      SheetKit.fade(el,{trigger:el,start:'top 92%',once:true,y:12,duration:REVEAL.duration,ease:REVEAL.ease});
    });
  }
  /* Gruppe: Sheet-Kit fade mit Stagger, einmalig — ersetzt den .rv-Fade dieser Elemente */
  function group(els,trigger,skip,start){
    if(!els.length)return;
    els.forEach(e=>skip.add(e));
    SheetKit.fade(els,{trigger:trigger||els[0].parentElement,start:start||'top 88%',once:true,stagger:.07});
  }
  /* Split-Line: jedes H2 der Seite (ausser dem Film-Hero-Titel .w-h, der sein eigenes Wort-Reveal in film.js
     hat) bekommt die maskierte Block-Enthüllung — Block 3 (2.2), Vorgabe "split-line für H2 und Kernthesen". */
  function splitHeads(root){
    qa(root,'h2').filter(h=>!h.classList.contains('w-h')).forEach(h=>SheetKit.splitLine(h,{start:'top 88%'}));
  }
  function magnetic(){
    if(matchMedia('(hover:none)').matches||matchMedia(MQ_OFF).matches)return;
    document.querySelectorAll('.mag').forEach(b=>{
      if(b.__m)return;b.__m=1;
      b.addEventListener('mousemove',e=>{const r=b.getBoundingClientRect();
        gsap.to(b,{x:(e.clientX-r.left-r.width/2)*.3,y:(e.clientY-r.top-r.height/2)*.4,duration:.4,ease:'power2.out'});});
      b.addEventListener('mouseleave',()=>gsap.to(b,{x:0,y:0,duration:.5,ease:'elastic.out(1,.4)'}));
    });
  }
  /* Kundenstimmen: Kinder von .reviews-track so oft kopieren, dass eine Hälfte breiter als der Viewport ist,
     dann die Hälfte einmal duplizieren (translateX(-50%)-Loop). Duplikate aria-hidden. */
  function marquee(root){
    const mq=q1(root,'.reviews-marquee'),track=mq&&mq.querySelector('.reviews-track');
    if(!track)return null;
    if(!mq.dataset.dup){
      const items=Array.prototype.slice.call(track.children);
      if(!items.length)return null;
      mq.dataset.dup='1';
      const w=items[0].getBoundingClientRect().width||420,period=items.length*(w+18);
      const m=Math.max(1,Math.ceil(innerWidth/period));
      const clone=el=>{const c=el.cloneNode(true);c.setAttribute('aria-hidden','true');c.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));return c;};
      for(let i=1;i<m;i++)items.forEach(el=>track.appendChild(clone(el)));
      Array.prototype.slice.call(track.children).forEach(el=>track.appendChild(clone(el)));
      track.style.setProperty('--mq-dur',(38*m)+'s');
    }
    mq.classList.add('is-marquee');
    return mq;
  }
  /* Arbeiten-Grid: neue Karten (ohne data-m) skalieren .96->1 + opacity, gestaffelt, beim ersten Sichtbarwerden */
  function refreshWorks(){
    const grid=document.getElementById('workgrid');
    if(!grid||!ctx||mode!=='full')return;
    const fresh=qa(grid,'.work:not([data-m])');
    if(!fresh.length)return;
    fresh.forEach(el=>el.dataset.m='1');
    ctx.add(()=>{
      worksTriggers.forEach(t=>{try{t.kill();}catch(e){}});worksTriggers=[];
      gsap.set(fresh,{opacity:0,scale:.96});
      worksTriggers=ScrollTrigger.batch(fresh,{start:'top 92%',once:true,interval:.08,
        onEnter:b=>gsap.to(b,{opacity:1,scale:1,duration:.55,ease:'power2.out',stagger:.05,overwrite:true,clearProps:'transform,opacity'})});
    });
  }
  function worksInit(root){
    const grid=q1(root,'#workgrid');if(!grid)return;
    refreshWorks();
    obs=new MutationObserver(()=>refreshWorks());
    obs.observe(grid,{childList:true});
  }
  /* app.js blendet .page mit y:14->0 ein; GSAP lässt translate(0,0) stehen, was position:fixed-Pins bricht.
     Nach dem Tween Transform entfernen und Positionen neu messen. */
  function settlePage(root){
    const page=q1(root,'.page');if(!page)return;
    const done=()=>{gsap.set(page,{clearProps:'transform'});refresh();};
    const tw=gsap.getTweensOf(page).filter(t=>t.progress()<1);
    if(tw.length)tw[tw.length-1].eventCallback('onComplete',done);else done();
  }

  /* ---------- Startseite, volle Choreografie ---------- */
  function homeFull(root,skip){
    const cleanups=[];
    // 1. Hero-Rundgang (Scroll-Film): Pin + Scrub in film.js — zuerst anlegen, damit spätere Trigger den Pin-Abstand kennen
    if(window.Film){const c=Film.full(root);if(c)cleanups.push(c);}
    // 2. Vier Versprechen: Sheet-Kit wipe (architektonischer Schnitt von unten), stagger .08
    const pr=qa(root,'.promises .promise');
    if(pr.length){
      pr.forEach(e=>skip.add(e));
      gsap.set(pr,{y:0});
      SheetKit.wipe(pr,{from:'inset(0 0 100% 0)',trigger:q1(root,'.promises'),start:'top 85%',once:true,duration:.7,stagger:.08});
    }
    // 3. Situationen, Wissen-Teaser, Regionen-Zeilen, Knigge: y 16->0 + opacity, stagger .07
    group(qa(root,'.sit article'),q1(root,'.sit'),skip);
    group(qa(root,'.wissen-grid .wcard'),q1(root,'.wissen-grid'),skip);
    group(qa(root,'.knigge li'),q1(root,'.knigge'),skip);
    const rl=q1(root,'.region-list');
    if(rl){skip.add(rl);gsap.set(rl,{opacity:1,y:0});group(qa(rl,'li'),rl,skip);}
    // 5. Trust-Band: Trennlinien scaleY 0->1 (Pseudo-Element über CSS-Variable), stagger .1; Counter via countUp
    const lines=qa(root,'.trust > div').slice(1);
    if(lines.length){
      lines.forEach(d=>d.classList.add('has-ln'));
      gsap.fromTo(lines,{'--ln':0},{'--ln':1,duration:.6,ease:'power2.out',stagger:.1,scrollTrigger:{trigger:q1(root,'.trust'),start:'top 85%',once:true}});
      cleanups.push(()=>lines.forEach(d=>d.classList.remove('has-ln')));
    }
    // 7. Case Atlant: Cover yPercent -8->8 (Scrub) auf dem Wrapper .cover .par (Fallback: img), leicht vergrössert,
    //    damit keine Ränder erscheinen — der CSS-Hover-Zoom bleibt auf dem img und wird nicht überschrieben
    const cb=q1(root,'.case-fb'),cov=cb&&cb.querySelector('.case-fb-media img');
    if(cb&&cov){
      gsap.set(cov,{scale:1.16,transformOrigin:'50% 50%'});
      gsap.fromTo(cov,{yPercent:-8},{yPercent:8,ease:'none',scrollTrigger:{trigger:cb,start:'top bottom',end:'bottom top',scrub:true}});
    }
    // 8. Team: Foto clipPath inset(0 100% 0 0) -> inset(0 0% 0 0), .8 s; Zitat/Fakten bleiben .rv
    const tf=q1(root,'.team-fig');
    if(tf){
      skip.add(tf);gsap.set(tf,{y:0});
      SheetKit.wipe(tf,{from:'inset(0 100% 0 0)',trigger:tf,start:'top 85%',once:true,duration:.8});
    }
    // 10. CTA-Band: .orb y 40->-40 (Scrub)
    qa(root,'.ctaband').forEach(band=>{const orb=band.querySelector('.orb');
      if(orb)gsap.fromTo(orb,{y:40},{y:-40,ease:'none',scrollTrigger:{trigger:band,start:'top bottom',end:'bottom top',scrub:true}});});
    return cleanups;
  }
  /* Startseite, reduziert (<1000px): Rundgang als Standbilder mit weicher Blende (film.js, ohne Pin/Scrub) */
  function homeLite(root){
    if(window.Film)Film.lite(root);
  }

  /* ---------- API ---------- */
  /* Mobile: dieselbe gestaffelte Dramaturgie mit IntersectionObserver + Web Animations.
     Inhalte bleiben ohne JS sofort lesbar; nur beim tatsächlichen Eintritt läuft eine kurze Animation. */
  function nativeMount(root,name){
    const mq=matchMedia(MQ_OFF),wide=matchMedia('(min-width:1000px)'),onChange=()=>mount({name});mq.addEventListener('change',onChange);wide.addEventListener('change',onChange);
    nativeCleanup=()=>{mq.removeEventListener('change',onChange);wide.removeEventListener('change',onChange);};
    mode=mq.matches||innerWidth>=1000?'off':'native';
    if(name==='home'&&window.Film){if(mode==='off')Film.plain(root);else Film.lite(root);}
    /* Bug (Playwright-Sichtprüfung, <1000px bzw. reduzierte Bewegung): countUp() aus dem vollen GSAP-Pfad
       läuft hier nie, darum blieben Zähler wie "0 m² Wohnfläche · 0 Räume komplett · 0 schlüsselfertig" für
       praktisch jeden Handy-/Tablet-Besucher dauerhaft auf "0" stehen — sichtbar erst nach echtem Scrollen bis
       zur Fallstudie, nie behoben. Zielwert hier sofort statisch setzen, analog zum bestehenden
       .no-gsap .rv{opacity:1}-Fallback (Endzustand ohne Animation statt kaputtem Nullwert). */
    qa(root,'[data-count]').forEach(el=>{
      const target=parseFloat(el.dataset.count),suf=el.dataset.suf||'';
      if(!isNaN(target))el.textContent=Math.round(target)+suf;
    });
    if(mode==='off'||!window.IntersectionObserver||!Element.prototype.animate)return;
    const running=new Set(),targets=new Set();
    const observer=new IntersectionObserver(entries=>{entries.forEach(({target:el,isIntersecting})=>{
      if(!isIntersecting)return;observer.unobserve(el);if(el.getBoundingClientRect().top<80)return;
      const parent=el.parentElement,idx=parent?Array.prototype.indexOf.call(parent.children,el):0;
      const animation=el.animate([{opacity:0,transform:'translate3d(0,24px,0)'},{opacity:1,transform:'translate3d(0,0,0)'}],{duration:720,delay:Math.min(idx%4*65,195),easing:'cubic-bezier(.16,1,.3,1)',fill:'backwards'});
      running.add(animation);animation.finished.catch(()=>{}).finally(()=>running.delete(animation));
    });},{threshold:.08,rootMargin:'0px 0px -5% 0px'});
    function scan(){qa(root,'.rv,.w-grow,.sec-head,.tl-item,.work,.promise,.region-list li').forEach(el=>{
      if(targets.has(el)||el.closest('.w-stage')||el.parentElement.closest('.rv,.w-grow,.sec-head,.tl-item,.work,.promise'))return;targets.add(el);observer.observe(el);
    });}
    scan();const mo=new MutationObserver(scan);mo.observe(root,{childList:true,subtree:true});
    nativeCleanup=()=>{mq.removeEventListener('change',onChange);wide.removeEventListener('change',onChange);observer.disconnect();mo.disconnect();running.forEach(a=>a.cancel());targets.clear();};
  }
  function mount(route){
    if(!live()){unmount();const root=document.getElementById('view');if(root)nativeMount(root,(route&&route.name)||'home');return;}
    unmount();
    const root=document.getElementById('view');if(!root)return;
    const name=(route&&route.name)||'home';
    ctx=gsap.context(()=>{
      mm=gsap.matchMedia();
      mm.add({full:MQ_FULL,lite:MQ_LITE,off:MQ_OFF},c=>{
        const {full,lite,off}=c.conditions;
        mode=off?'off':full?'full':lite?'lite':'off';
        if(mode==='off'){gsap.set(qa(root,'.rv'),{opacity:1,y:0});if(name==='home'&&window.Film)Film.plain(root);return;}
        const skip=new Set();let cleanups=[];
        if(name==='home'){cleanups=full?homeFull(root,skip):(homeLite(root),[]);}
        countUp(root);
        /* v8.1: Karten-Raster staggern als Gruppe ein (statt jede Karte einzeln per .rv) */
        ['.sols','.refs','.projcards','.gal','.svc-list','.seg-panels','.fact-grid'].forEach(sel=>{const box=q1(root,sel);if(box)group(qa(box,':scope > *'),box,skip);});
        reveals(root,skip);
        splitHeads(root);
        const mq=marquee(root);
        worksInit(root);
        return ()=>{cleanups.forEach(f=>{try{f();}catch(e){}});if(mq)mq.classList.remove('is-marquee');if(obs){obs.disconnect();obs=null;}worksTriggers=[];};
      });
    },root);
    settlePage(root);
    magnetic();
    refresh();
  }
  function unmount(){
    if(nativeCleanup){nativeCleanup();nativeCleanup=null;}
    if(window.Film)Film.unmount();
    if(obs){obs.disconnect();obs=null;}
    worksTriggers=[];
    if(ctx){try{ctx.revert();}catch(e){}ctx=null;}
    mm=null;mode='none';
    if(typeof ScrollTrigger!=='undefined'&&ScrollTrigger.getAll)ScrollTrigger.getAll().forEach(t=>t.kill());
  }

  window.Motion={mount,unmount,refreshWorks,countUp,reveals,magnetic,mode:()=>mode};
})();
