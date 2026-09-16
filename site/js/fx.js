/* BauStern — FX: portierte Bewegungsmuster (21st.dev-Ideen, ohne React):
   Timeline-Scrub, Spotlight-Karten, Shine-Border, Tilt, Text-Rotate, Odometer, Handschrift-Signatur.
   API: FX.mount(root,mode)  mode: 'full' | 'lite' | 'off'   ·  FX.unmount()
   Animation läuft immer (Produktentscheidung, OS-Reduced-Motion wird ignoriert); nur fehlendes GSAP -> CSS-Endzustände. */
window.FX=(function(){
  const q=(r,s)=>r.querySelector(s),qa=(r,s)=>[...r.querySelectorAll(s)];
  const reduced=()=>false; /* Produktentscheidung: Animation läuft immer, OS-Reduced-Motion wird bewusst ignoriert */
  const hasST=()=>typeof gsap!=='undefined'&&typeof ScrollTrigger!=='undefined'&&typeof ScrollTrigger.create==='function'&&!document.documentElement.classList.contains('no-gsap');
  const fine=()=>matchMedia('(hover:hover) and (pointer:fine)').matches;
  const clamp=(v,a,b)=>v<a?a:v>b?b:v;
  let cleanups=[];
  const on=(el,ev,fn,opt)=>{el.addEventListener(ev,fn,opt);cleanups.push(()=>el.removeEventListener(ev,fn,opt));};

  /* ---------- 1 Timeline: Linie füllt sich mit dem Scroll, Punkte schalten ein ---------- */
  function timeline(root){
    const tl=q(root,'.tl');if(!tl)return;
    const items=qa(tl,'.tl-item'),fill=q(tl,'.tl-fill');
    if(!hasST()||reduced()){tl.classList.add('is-static');items.forEach(i=>i.classList.add('is-on'));if(fill)fill.style.height='100%';return;}
    const st=ScrollTrigger.create({trigger:tl,start:'top 62%',end:'bottom 62%',scrub:.4,
      onUpdate:s=>{if(fill)fill.style.height=(s.progress*100).toFixed(2)+'%';}});
    cleanups.push(()=>st.kill());
    items.forEach(it=>{const t=ScrollTrigger.create({trigger:it,start:'top 64%',end:'bottom 64%',
      onEnter:()=>it.classList.add('is-on'),onLeaveBack:()=>it.classList.remove('is-on'),
      onEnterBack:()=>it.classList.add('is-on')});cleanups.push(()=>t.kill());});
    cleanups.push(()=>{items.forEach(i=>i.classList.remove('is-on'));if(fill)fill.style.height='';});
  }

  /* ---------- 1b Sticky-Scroll-Reveal: linke Spalte bleibt sticky (Titel+Foto), rechts schaltet die aktive
     These/Karte per Scroll-Fortschritt um (Block 3, 3.2 — ersetzt die vier identischen .promise-Karten).
     Gleiche Technik wie timeline() oben (ScrollTrigger pro Item, .is-on schaltet um), nur ohne Füll-Linie. */
  function stickyReveal(root){
    qa(root,'.ssr').forEach(box=>{
      const items=qa(box,'.ssr-item');if(!items.length)return;
      const setActive=it=>items.forEach(x=>x.classList.toggle('is-on',x===it));
      if(!hasST()||reduced()){items.forEach(i=>i.classList.add('is-on'));return;}
      items.forEach(it=>{const t=ScrollTrigger.create({trigger:it,start:'top 62%',end:'bottom 62%',
        onEnter:()=>setActive(it),onEnterBack:()=>setActive(it)});cleanups.push(()=>t.kill());});
      setActive(items[0]);
      cleanups.push(()=>items.forEach(i=>i.classList.remove('is-on')));
    });
  }

  /* ---------- 2 Spotlight: radialer Messing-Schein folgt dem Cursor (Aceternity Spotlight Card) ---------- */
  function spotlight(root){
    const cards=qa(root,'.promise,.svc-card,.sit article,.wcard,.tl-body,.rev-card');
    if(!cards.length||!fine()||reduced())return;
    cards.forEach(c=>{c.classList.add('spot');
      const mv=e=>{const r=c.getBoundingClientRect();c.style.setProperty('--mx',(e.clientX-r.left)+'px');c.style.setProperty('--my',(e.clientY-r.top)+'px');};
      on(c,'pointermove',mv,{passive:true});});
    cleanups.push(()=>cards.forEach(c=>{c.classList.remove('spot');c.style.removeProperty('--mx');c.style.removeProperty('--my');}));
  }

  /* ---------- 3 Shine-Border: einmaliger Lichtlauf um die Richtwert-Karte beim Erscheinen ---------- */
  function shine(root){
    const els=qa(root,'.shine-target');if(!els.length)return;
    if(!hasST()||reduced()){els.forEach(e=>e.classList.add('shine-done'));return;}
    els.forEach(el=>{const t=ScrollTrigger.create({trigger:el,start:'top 80%',once:true,onEnter:()=>{el.classList.add('shine-run');setTimeout(()=>el.classList.add('shine-done'),2400);}});cleanups.push(()=>t.kill());});
    cleanups.push(()=>els.forEach(e=>e.classList.remove('shine-run','shine-done')));
  }

  /* ---------- 4 Tilt v8.1 (Karten-Choreografie, Vorgabe Runde 3) ----------
     Block 3 hatte den 3D-Tilt entfernt (zu verspielt für B2B). Jetzt gewünscht — daher bewusst zurückhaltend:
     max. 3° Neigung, nur auf Foto-/Feature-Karten (nie auf dichten Listenzeilen), nur bei hover+pointer:fine,
     reine transform/opacity-Änderungen, ein rAF pro Pointer-Frame, will-change nur während des Hovers.
     Dazu echte Parallaxe: das Bild bewegt sich gegen die Neigung (--px/--py), plus ein weicher Lichtschein
     an der Cursorposition (--mx/--my, gleiches Prinzip wie spotlight()). */
  function tilt(root){
    const SEL='.sol,.ref,.projcard,.case-cell,.wcard,.gal-cell,.work,.svc-row .svc-thumb,.seg-fig';
    if(!fine()||reduced())return;
    const MAX=3;let active=null,raf=0,px=0,py=0;
    /* Delegiert (ein Listener-Set pro Seite): funktioniert auch für Karten, die später neu gerendert werden
       (Referenz-Filter, "Mehr laden"), ohne dass pro Karte Listener gebunden/entfernt werden müssen. */
    const set=(c,rx,ry,x,y)=>{c.style.setProperty('--rx',rx);c.style.setProperty('--ry',ry);c.style.setProperty('--px',x);c.style.setProperty('--py',y);};
    const apply=()=>{raf=0;if(!active)return;set(active,(-py*MAX).toFixed(2)+'deg',(px*MAX).toFixed(2)+'deg',px.toFixed(3),py.toFixed(3));};
    const leave=()=>{const c=active;if(!c)return;active=null;set(c,'0deg','0deg','0','0');setTimeout(()=>{if(active!==c)c.classList.remove('is-tilting');},650);};
    const move=e=>{const c=e.target.closest(SEL);
      if(c!==active){leave();if(c){active=c;c.classList.add('tilt','is-tilting');}}
      if(!c)return;const r=c.getBoundingClientRect();px=clamp((e.clientX-r.left)/r.width*2-1,-1,1);py=clamp((e.clientY-r.top)/r.height*2-1,-1,1);
      c.style.setProperty('--mx',(e.clientX-r.left)+'px');c.style.setProperty('--my',(e.clientY-r.top)+'px');if(!raf)raf=requestAnimationFrame(apply);};
    const out=e=>{if(active&&!(e.relatedTarget&&active.contains(e.relatedTarget)))leave();};
    qa(root,SEL).forEach(c=>c.classList.add('tilt'));
    on(root,'pointermove',move,{passive:true});on(root,'pointerout',out);
    const mo=new MutationObserver(()=>qa(root,SEL).forEach(c=>c.classList.add('tilt')));mo.observe(root,{childList:true,subtree:true});
    cleanups.push(()=>{mo.disconnect();leave();qa(root,'.tilt').forEach(c=>{c.classList.remove('tilt','is-tilting');['--rx','--ry','--px','--py','--mx','--my'].forEach(v=>c.style.removeProperty(v));});});
  }
  /* ---------- 5 Text-Rotate: Wörter wechseln mit Cut-Reveal (Daniel Petho Text Rotate) ---------- */
  function textRotate(root){
    qa(root,'[data-rotate]').forEach(el=>{
      const words=el.dataset.rotate.split('|').map(w=>w.trim()).filter(Boolean);if(words.length<2)return;
      el.innerHTML=`<span class="rot-w">${words[0]}</span>`;const span=q(el,'.rot-w');
      if(reduced()){return;}
      let i=0;const step=()=>{i=(i+1)%words.length;span.classList.add('out');
        setTimeout(()=>{span.textContent=words[i];span.classList.remove('out');span.classList.add('in');setTimeout(()=>span.classList.remove('in'),420);},260);};
      const id=setInterval(step,2600);cleanups.push(()=>clearInterval(id));});
  }

  /* ---------- 6 Odometer: Ziffern rollen wie ein Zählwerk (statt linearem countUp) ---------- */
  function odometer(root){
    const els=qa(root,'[data-odo]');if(!els.length)return;
    els.forEach(el=>{const raw=el.dataset.odo;const m=raw.match(/^([^\d]*)(\d[\d']*)(.*)$/);if(!m){el.textContent=raw;return;}
      const pre=m[1],digits=m[2],suf=m[3];
      el.innerHTML=`${pre?`<span>${pre}</span>`:''}${[...digits].map(ch=>/\d/.test(ch)?`<span class="odo-d" data-d="${ch}"><span class="odo-r">${[...Array(10).keys()].map(n=>`<i>${n}</i>`).join('')}</span></span>`:`<span>${ch}</span>`).join('')}${suf?`<span>${suf}</span>`:''}`;
      el.classList.add('odo');
      const roll=()=>{qa(el,'.odo-d').forEach((d,k)=>{const n=+d.dataset.d;const r=q(d,'.odo-r');r.style.transitionDelay=(k*.09)+'s';r.style.transform=`translateY(${-n*10}%)`;});el.classList.add('odo-on');};
      if(!hasST()||reduced()){qa(el,'.odo-r').forEach(r=>{r.style.transition='none';});roll();return;}
      const t=ScrollTrigger.create({trigger:el,start:'top 90%',once:true,onEnter:roll});cleanups.push(()=>t.kill());});
  }

  /* ---------- 7 Handschrift: SVG-Pfad zeichnet sich (kokonutd Hand Writing Text), stroke-dashoffset ---------- */
  function signature(root){
    qa(root,'.sig').forEach(svg=>{const paths=qa(svg,'path');
      const len=p=>{try{return p.getTotalLength()||300;}catch(e){return 300;}};
      const reset=()=>{paths.forEach(p=>{const L=len(p);p.style.transition='none';p.style.strokeDasharray=L;p.style.strokeDashoffset=reduced()?0:L;});svg.classList.remove('sig-done');};
      const run=()=>{if(reduced()){paths.forEach(p=>{p.style.strokeDashoffset=0;});svg.classList.add('sig-done');return;}
        let delay=0;paths.forEach(p=>{const L=len(p);p.style.strokeDasharray=L;p.style.strokeDashoffset=L;void p.getBoundingClientRect();const d=Math.max(.55,L/150);p.style.transition=`stroke-dashoffset ${d.toFixed(2)}s cubic-bezier(.45,.05,.55,.95) ${delay.toFixed(2)}s`;p.style.strokeDashoffset=0;delay+=d*.85;   /* v9.2: Handschrift-Tempo (~150 px/s) statt 420 px/s — vorher war die Unterschrift fertig, bevor sie eingeblendet war */});svg.classList.add('sig-done');};
      reset();svg._sigRun=run;svg._sigReset=reset;
      if(svg.closest('.w-stage'))return;   /* im Rundgang steuert film.js den Start */
      if(!hasST()){run();return;}
      const t=ScrollTrigger.create({trigger:svg,start:'top 85%',once:true,onEnter:run});cleanups.push(()=>t.kill());});
  }

  function mount(root,mode){
    unmount();if(!root)return;
    textRotate(root);odometer(root);signature(root);timeline(root);stickyReveal(root);shine(root);
    if(mode!=='off'){spotlight(root);tilt(root);}
  }
  function unmount(){cleanups.forEach(f=>{try{f();}catch(e){}});cleanups=[];}
  return {mount,unmount};
})();
