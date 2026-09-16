/* BauStern — film-fx.js (v10): Bausteine für den Film, die film.js einbindet.
   1. Codecs        — wählt pro Browser die beste Video-Quelle (AV1 → HEVC → H.264), einmal pro Sitzung.
   2. VideoFlight   — Hybrid-Player: Kamerafahrt als 60-fps-Video (fwd/rev-Segment, easeIO eingebacken, FLY_DUR s)
                      über dem Canvas; sichtbares Video pausiert verdeckte Canvas-Arbeit. Bei Stall/Fehler/Ende
                      fordert onInvalidate sofort den passenden Canvas-Kader an.
                      Sync über requestVideoFrameCallback: mediaTime ↔ erwarteter Fortschritt, Drift > 60 ms → Rate-Nudge.
   3. Materialize   — Szene «Vorher/Nachher» Variante B+: Rohbau → Technik → Ausbau → Möbel+Licht, Lichtleiste als
                      Dirigent, Staub (≤300 Partikel, eigener Canvas), Settle. Nur drawImage/globalAlpha/Masken —
                      kein filter auf dem Vollbild. Regler mit Trägheit + Rückfederung.
   4. Layers        — Tiefenebenen über dem Standbild (Bad: Waschtisch, Glas-Reflex, LED-Glow) — Cursor ×2.5, Gyroskop.
   5. Gyro          — deviceorientation (iOS: Permission beim ersten Touch), gelerpt.
   Alles ohne Abhängigkeiten, wird von film.js über window.FilmFX benutzt. */
(function(){
  const clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t;
  const easeIO=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
  /* cubic-bezier(.7,0,.2,1) — numerisch (Newton), identisch zum Board */
  function bezier(x1,y1,x2,y2){const A=(a,b)=>1-3*b+3*a,B=(a,b)=>3*b-6*a,C=a=>3*a;
    const cx=t=>((A(x1,x2)*t+B(x1,x2))*t+C(x1))*t,cy=t=>((A(y1,y2)*t+B(y1,y2))*t+C(y1))*t,dx=t=>3*A(x1,x2)*t*t+2*B(x1,x2)*t+C(x1);
    return x=>{if(x<=0)return 0;if(x>=1)return 1;let t=x;for(let i=0;i<6;i++){const d=dx(t);if(Math.abs(d)<1e-6)break;t-=(cx(t)-x)/d;}return cy(clamp(t,0,1));};}
  const EASE=bezier(.7,0,.2,1);
  const seg=(p,a,b)=>EASE(clamp((p-a)/(b-a),0,1)),lin=(p,a,b)=>clamp((p-a)/(b-a),0,1),pulse=(p,a,w)=>Math.sin(lin(p,a,a+w)*Math.PI);
  const mk=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
  const loadImg=src=>new Promise((res,rej)=>{const im=new Image();im.decoding='async';im.onload=()=>res(im);im.onerror=()=>rej(new Error('img '+src));im.src=src;});

  /* ---------- 1. Codecs ---------- */
  const Codecs=(()=>{let best=null,support=null;
    const probe=()=>{if(best)return best;const v=document.createElement('video');if(!v.canPlayType)return best='h264';
      const ok=t=>{try{return /probably|maybe/.test(v.canPlayType(t));}catch(e){return false;}};
      /* Chromium unter Windows meldet HEVC teils als "maybe", obwohl der Systemdecoder fehlt. HEVC deshalb nur in Safari
         vorziehen; AV1 und H.264 sind in Chromium zuverlässig. Der Laufzeit-Fallback in VideoFlight bleibt zusätzlich aktiv. */
      const safari=/Safari/i.test(navigator.userAgent)&&!/Chrome|Chromium|Edg/i.test(navigator.userAgent);
      support={av1:ok('video/mp4; codecs="av01.0.08M.10"'),hevc:safari&&ok('video/mp4; codecs="hvc1.1.6.L123.B0"'),h264:ok('video/mp4; codecs="avc1.640028"')||true};
      if(support.av1)best='av1';else if(support.hevc)best='hevc';else best='h264';
      return best;};
    /* Quelle: {base:'img/film/v/c2-flur.fwd'} → 'img/film/v/c2-flur.fwd.hevc.mp4'; fehlende Dateien meldet HEAD nicht — wir
       vertrauen dem Build (pipeline.sh) und fallen bei 'error' des <video> auf den Kader-Pfad zurück. */
    const src=(base,avail)=>{probe();for(const k of ['av1','hevc','h264'])if((!avail||avail.includes(k))&&support[k])return base+'.'+k+'.mp4';return base+'.h264.mp4';};
    return {probe,src};})();

  /* ---------- 2. VideoFlight ---------- */
  /* opts: {cam: .w-cam Element, canvas, F (FILM), onFrame(p) optional}
     start(i,dir,p0,dur): Szene i, Richtung, aktueller Zonenfortschritt p0 (0..CAM), Fahrtdauer s → true wenn Video übernimmt.
     end(): Video ausblenden (Kader steht bereits darunter). */
  function VideoFlight(opts){
    const {cam,F}=opts;const V=F.video||{};let vid=null,vidB=null,active=null,gen=0;
    const hasRVFC='requestVideoFrameCallback' in HTMLVideoElement.prototype;
    const make=()=>{const v=document.createElement('video');v.className='w-vid';v.muted=true;v.playsInline=true;v.preload='auto';v.setAttribute('muted','');v.setAttribute('playsinline','');v.setAttribute('aria-hidden','true');v.disablePictureInPicture=true;cam.appendChild(v);return v;};
    const clipFor=(i,dir)=>{const sc=F.scenes[i];if(!sc||!sc.clip||!V.dir)return null;return V.dir+sc.clip+(dir>0?'.fwd':'.rev');};
    /* Prefetch: nächstes Segment in den zweiten Slot laden (≤ 2 lebende <video>) */
    function warm(i,dir){const base=clipFor(i,dir);if(!base)return;const url=Codecs.src(base,V.codecs);
      if(!vidB)vidB=make();if(vidB.dataset.src===url||(vid&&vid.dataset.src===url))return;vidB.dataset.src=url;vidB.src=url;try{vidB.load();}catch(e){}}
    function start(i,dir,p0,dur,CAM){const base=clipFor(i,dir);if(!base)return false;const url=Codecs.src(base,V.codecs);
      /* Slot wählen: ist das Segment schon vorgeladen (vidB), tauschen */
      if(vidB&&vidB.dataset.src===url){const t=vid;vid=vidB;vidB=t;}else{if(!vid)vid=make();if(vid.dataset.src!==url){vid.dataset.src=url;vid.src=url;try{vid.load();}catch(e){}}}
      const v=vid,myGen=++gen;const D=V.flyDur||F.flyDur||2.2;const h264=base+'.h264.mp4';let triedH264=url===h264;
      /* Teilflug: Video-Zeit = Anteil der Fahrtzone. vorwärts: p0/CAM·D, rückwärts: (1−p0/CAM)·D (rev-Datei läuft von CAM nach 0) */
      const frac=clamp(p0/CAM,0,1);const t0=dir>0?frac*D:(1-frac)*D;
      active={v,i,dir,t0,dur,start:0,CAM,gen:myGen};
      const begin=()=>{if(gen!==myGen||!active)return;try{v.currentTime=t0;}catch(e){}
        /* Rate = Verhältnis Restvideo/Restfahrt (bei Teilflügen skaliert film.js die Dauer, hier nur Feinschliff) */
        const rest=Math.max(.05,D-t0);v.playbackRate=clamp(rest/Math.max(.05,dur),.5,2);
        const pr=v.play();(pr&&pr.then?pr:Promise.resolve()).then(()=>{if(gen!==myGen)return;v.classList.add('on');active.start=performance.now();sync();}).catch(()=>{fail();});};
      const fail=()=>{if(gen!==myGen)return;v.classList.remove('on');
        /* canPlayType() kann unter Windows HEVC melden, obwohl der Decoder beim Start fehlt. Einmal transparent auf H.264
           zurückfallen; erst danach übernimmt ausschliesslich der bereits laufende Canvas-Pfad. */
        if(!triedH264&&(!V.codecs||V.codecs.includes('h264'))){triedH264=true;v.dataset.src=h264;v.src=h264;active.start=0;
          const retry=()=>{v.removeEventListener('loadeddata',retry);begin();};v.addEventListener('loadeddata',retry);try{v.load();}catch(e){}
          setTimeout(()=>{if(gen===myGen&&active&&!active.start)fail();},900);return;}
        active=null;opts.onInvalidate?.();};
      const sync=()=>{if(!hasRVFC||gen!==myGen||!active)return;v.requestVideoFrameCallback((now,meta)=>{if(gen!==myGen||!active)return;
        const el=(performance.now()-active.start)/1000;const want=t0+el*(v.playbackRate||1);const drift=meta.mediaTime-want;
        if(Math.abs(drift)>.06){v.playbackRate=clamp((v.playbackRate||1)*(drift>0?.94:1.06),.5,2.5);}   /* sanft nachziehen statt seeken (kein Ruck) */
        sync();});};
      v.onerror=fail;v.onwaiting=()=>{if(gen===myGen){v.classList.remove('on');opts.onInvalidate?.();}};
      v.onplaying=()=>{if(gen===myGen&&active)v.classList.add('on');};
      if(v.readyState>=2)begin();else{const once=()=>{v.removeEventListener('loadeddata',once);begin();};v.addEventListener('loadeddata',once);
        setTimeout(()=>{if(gen===myGen&&active&&!active.start){fail();}},450);}   /* nicht rechtzeitig da → Kader-Fahrt (kein Warten) */
      return true;}
    function end(){gen++;const a=active;active=null;if(!a)return;const v=a.v;
      opts.onInvalidate?.();
      /* Übergabe: der Haltekader liegt bereits auf dem Canvas (gleicher Master) → 140 ms ausblenden, dann pausieren */
      requestAnimationFrame(()=>{v.classList.remove('on');setTimeout(()=>{try{v.pause();}catch(e){}},180);});}
    const isActive=()=>!!active;
    const isPresenting=()=>!!(active&&active.v.classList.contains('on')&&!active.v.paused&&active.v.readyState>=2);
    function destroy(){gen++;active=null;[vid,vidB].forEach(v=>{if(v){try{v.pause();v.removeAttribute('src');v.load();}catch(e){}v.remove();}});vid=vidB=null;}
    return {start,end,warm,isActive,isPresenting,destroy,codec:Codecs.probe};
  }

  /* ---------- 3. Materialize (B+) ---------- */
  /* cfg (scene.mat): {dir, before, dusty, flat, flatFull, after, technik, edges, bloom, masks:{walls,floor,furniture,light}, w:1280, h:714}
     Methoden: load() → Promise, render(ctx, cv, p, opts) zeichnet in den Film-Canvas (Cover-Fit), dust(fxCtx, p, dt) */
  function Materialize(cfg){
    const W=cfg.w||1280,H=cfg.h||714;const im={},pre={};let ready=false,loading=null;
    let dom=null,domCam=null,domReady=false,domLoading=null,domBand=-1,domNotify=null;const domImages=[];
    const domPhases=[0,.15,.30,.50,.65,.84,1];
    function mount(cam,onReady){if(!cfg.compositeDir)return false;domCam=cam;if(onReady)domNotify=onReady;
      if(!domLoading){domLoading=Promise.all(domPhases.map((_,k)=>loadImg(cfg.compositeDir+'step'+k+'.webp').then(async img=>{if(img.decode)await img.decode();img.className='w-material-layer';img.alt='';domImages[k]=img;})))
        .then(()=>{if(!domCam)return;dom=document.createElement('div');dom.className='w-material';dom.setAttribute('aria-hidden','true');dom.hidden=true;domCam.append(dom);domReady=true;if(domNotify)domNotify();}).catch(()=>{domReady=false;});}
      return domReady;}
    function present(p){if(!domReady||!dom)return false;if(dom.hidden)dom.hidden=false;p=clamp(p,0,1);
      let k=0;while(k<domPhases.length-2&&p>domPhases[k+1])k++;
      if(k!==domBand){domBand=k;dom.replaceChildren(domImages[k],domImages[k+1]);domImages[k].style.opacity='1';}
      const opacity=lin(p,domPhases[k],domPhases[k+1]).toFixed(4);if(domImages[k+1].style.opacity!==String(+opacity))domImages[k+1].style.opacity=opacity;return true;}
    function hide(){if(dom)dom.hidden=true;}
    function destroy(){hide();if(dom)dom.remove();dom=null;domCam=null;domReady=false;domNotify=null;}
    const tmp=mk(W,H),tctx=tmp.getContext('2d'),msk=mk(W,H),mctx=msk.getContext('2d'),frame=mk(1,1),fctx=frame.getContext('2d');let lastFrame=-1;
    const dust=[];for(let i=0;i<(cfg.particles??300);i++)dust.push({x:Math.random()*W,y:Math.random()*H,r:.6+Math.random()*1.1,a:.25+Math.random()*.5,vx:(Math.random()-.5)*.25,vy:-.05-Math.random()*.12,ph:Math.random()*6.28});
    let t=0;
    const masked=(img,mask,white)=>{const c=mk(W,H),x=c.getContext('2d');x.fillStyle='#fff';white?x.fillRect(0,0,W,H):x.drawImage(img,0,0,W,H);x.globalCompositeOperation='destination-in';x.drawImage(mask,0,0,W,H);return c;};
    function load(){if(loading)return loading;const d=cfg.dir||'';const keys=['before','dusty','flat','flatFull','after','technik','edges'];
      loading=Promise.all(keys.map(k=>loadImg(d+cfg[k]).then(x=>{im[k]=x;})).concat(Object.keys(cfg.masks).map(k=>loadImg(d+cfg.masks[k]).then(x=>{im['m_'+k]=x;})))).then(()=>{
        pre.walls=masked(im.flat,im.m_walls);pre.light=masked(im.flat,im.m_light);pre.floor=masked(im.flat,im.m_floor);
        pre.furniture=masked(im.flatFull,im.m_furniture);pre.flash=masked(null,im.m_furniture,true);ready=true;});return loading;}
    function layer(ctx,img,alpha,wipe){if(alpha<=0||!img)return;
      tctx.globalCompositeOperation='source-over';tctx.globalAlpha=1;tctx.clearRect(0,0,W,H);tctx.drawImage(img,0,0,W,H);
      if(wipe){mctx.clearRect(0,0,W,H);mctx.fillStyle=wipe(mctx);mctx.fillRect(0,0,W,H);tctx.globalCompositeOperation='destination-in';tctx.drawImage(msk,0,0);}
      ctx.globalAlpha=alpha;ctx.drawImage(tmp,0,0);ctx.globalAlpha=1;}
    const grad=(x0,y0,x1,y1)=>(pos,feather)=>ctx=>{const g=ctx.createLinearGradient(x0,y0,x1,y1);const a=clamp(pos-feather,0,1),b=clamp(pos,0,1);
      g.addColorStop(0,'rgba(0,0,0,1)');g.addColorStop(a,'rgba(0,0,0,1)');g.addColorStop(b,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,0)');return g;};
    const diag=grad(0,0,W,H),fromDoor=grad(0,H,W*1.05,H*.55);
    /* Zeichnet den kompletten Zustand p (0..1) in den Film-Canvas cv (bereits fit()) — Cover-Fit wie drawFrame */
    function render(cv,ctx,p,opt){if(!ready)return false;opt=opt||{};const plus=opt.mode!=='B';
      const dest=ctx,cw=cv.width,ch=cv.height,key=Math.round(clamp(p,0,1)*48);if(frame.width!==cw||frame.height!==ch){frame.width=cw;frame.height=ch;lastFrame=-1;}
      if(key===lastFrame){if(cv.__filmMaterial===frame)return true;dest.save();dest.setTransform(1,0,0,1,0,0);dest.drawImage(frame,0,0);dest.restore();cv.__filmMaterial=frame;return true;}
      lastFrame=key;p=key/48;ctx=fctx;ctx.clearRect(0,0,cw,ch);const s=Math.max(cw/W,ch/H),dw=W*s,dh=H*s,dx=(cw-dw)/2,dy=(ch-dh)/2;
      const band=plus?lin(p,.10,.62):0;
      const wallsT=plus?lin(band,.08,.78):seg(p,.22,.50),floorT=plus?lin(band,.30,1):seg(p,.42,.68),techIn=plus?lin(band,0,.35):seg(p,.15,.30);
      const wireT=seg(p,.03,.15),wireOut=1-seg(p,.20,.34);
      const furnT=seg(p,.62,.84),flash=pulse(p,.64,.06)*.6,lift=(1-furnT)*6;
      const lightT=seg(p,.80,1),settle=plus?pulse(p,.94,.06)*.08:0;
      const push=1+.01*p;
      ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.translate(dx+dw/2,dy+dh/2);ctx.scale(s*push,s*push);ctx.translate(-W/2,-H/2);
      ctx.drawImage(im.before,0,0,W,H);
      if(plus){const dA=1-lin(p,.28,.55);if(dA>0){ctx.globalAlpha=dA;ctx.drawImage(im.dusty,0,0,W,H);ctx.globalAlpha=1;}}
      if(wireT>0&&wireOut>0)layer(ctx,im.edges,.55*wireOut,diag(wireT*1.2,.25));
      if(techIn>0)layer(ctx,im.technik,1,diag(techIn*1.15,.2));
      if(wallsT>0){layer(ctx,pre.walls,1,diag(wallsT*1.15,.14));layer(ctx,pre.light,Math.min(1,wallsT*1.6),diag(wallsT*1.15,.14));}
      if(floorT>0)layer(ctx,pre.floor,1,fromDoor(floorT*1.12,.12));
      if(furnT>0){ctx.save();ctx.translate(0,lift);ctx.globalAlpha=furnT;ctx.drawImage(pre.furniture,0,0);ctx.globalAlpha=1;
        if(flash>0){ctx.globalAlpha=flash;ctx.drawImage(pre.flash,0,0);ctx.globalAlpha=1;}
        ctx.restore();}
      if(lightT>0){ctx.globalAlpha=lightT;ctx.drawImage(im.after,0,0,W,H);ctx.globalAlpha=1;}
      if(plus&&band>0&&band<1){const pos=band*1.3-.15,w=.08;const g=ctx.createLinearGradient(0,0,W,H);const c=a=>`rgba(236,240,236,${a})`;
        g.addColorStop(clamp(pos-w,0,1),c(0));g.addColorStop(clamp(pos-w*.35,0,1),c(.08));g.addColorStop(clamp(pos,0,1),c(.20));g.addColorStop(clamp(pos+w*.35,0,1),c(.07));g.addColorStop(clamp(pos+w,0,1),c(0));
        ctx.globalCompositeOperation='lighter';ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
        const cx=pos*W,cy=pos*H;const r=ctx.createRadialGradient(cx,cy,0,cx,cy,W*.55);r.addColorStop(0,'rgba(236,240,236,.06)');r.addColorStop(1,'rgba(236,240,236,0)');
        ctx.save();ctx.translate(cx,cy);ctx.scale(1,.18);ctx.translate(-cx,-cy);ctx.fillStyle=r;ctx.fillRect(-W,-H*4,3*W,9*H);ctx.restore();ctx.globalCompositeOperation='source-over';}
      if(settle>0){ctx.globalCompositeOperation='lighter';ctx.fillStyle=`rgba(255,246,230,${settle})`;ctx.fillRect(0,0,W,H);ctx.globalCompositeOperation='source-over';}
      ctx.restore();dest.save();dest.setTransform(1,0,0,1,0,0);dest.drawImage(frame,0,0);dest.restore();cv.__filmMaterial=frame;return true;}
    /* Staub auf eigenem Canvas (fx), Cover-Fit-Koordinaten wie oben; dt in s. Gibt true zurück, solange sichtbar. */
    function dustDraw(fx,fctx,p,dt){if(!dust.length)return false;const cw=fx.width,ch=fx.height;fctx.clearRect(0,0,cw,ch);const vis=(1-lin(p,.30,.60))*(.9-.5*lin(p,0,.3));if(vis<=0)return false;
      const s=Math.max(cw/W,ch/H),dw=W*s,dh=H*s,dx=(cw-dw)/2,dy=(ch-dh)/2;t+=dt;fctx.fillStyle='#fff';const sink=lin(p,.3,.6)*.9;
      for(const d of dust){d.x+=d.vx+Math.sin(t*.9+d.ph)*.18;d.y+=d.vy+Math.cos(t*.7+d.ph)*.12+sink;if(d.y<-4)d.y=H+2;if(d.y>H+4)d.y=-2;if(d.x<-4)d.x=W+2;if(d.x>W+4)d.x=-2;
        fctx.globalAlpha=d.a*vis*(.6+.4*Math.sin(t*2+d.ph*3));fctx.beginPath();fctx.arc(dx+d.x*s,dy+d.y*s,Math.max(.8,d.r*s),0,6.283);fctx.fill();}
      fctx.globalAlpha=1;return true;}
    return {load,render,dustDraw,mount,present,hide,destroy,isReady:()=>ready,after:()=>im.after,W,H};
  }
  /* Regler mit Trägheit + Rückfederung: value 0..1, velocity aus Zeigerbewegung, nach Loslassen ausrollen (Reibung .92/Frame),
     über die Enden hinaus → Feder zurück (Overshoot max 6 %). tick(dt) → aktueller Wert; setTarget bei Scroll. */
  function Inertial(v0){let v=v0||0,vel=0,dragging=false,lastX=0,lastT=0,target=null;
    const down=(x,t)=>{dragging=true;lastX=x;lastT=t;vel=0;target=null;};
    const move=(x,t)=>{if(!dragging)return;const dt=Math.max(1,t-lastT);vel=(x-lastX)/dt*16;v+=x-lastX;lastX=x;lastT=t;};
    const up=()=>{dragging=false;};
    // Integrate elapsed time, not callback count: identical feel at 60/120/180 Hz.
    const tick=(dt=1/60)=>{if(dragging)return v;const steps=clamp(dt*60,.06,3);if(target!==null){v+=(target-v)*(1-Math.pow(.82,steps));if(Math.abs(target-v)<.0008)v=target;return clamp(v,0,1);}
      for(let left=steps;left>0;){const step=Math.min(1,left);left-=step;v+=vel*step;vel*=Math.pow(.92,step);if(v<0){vel+=(-v)*.22*step;v+=(-v)*(1-Math.pow(.72,step));}else if(v>1){vel-=(v-1)*.22*step;v-=(v-1)*(1-Math.pow(.72,step));}}
      if(Math.abs(vel)<.00005)vel=0;return clamp(v,-.06,1.06);};
    return {down,move,up,tick,get:()=>clamp(v,0,1),set:x=>{v=x;vel=0;},follow:x=>{if(!dragging){target=x;vel=0;}},isDragging:()=>dragging,settled:()=>!dragging&&vel===0&&(target===null||Math.abs(target-v)<.001)};}

  /* ---------- 4. Layers (Tiefenebenen) ---------- */
  /* scene.layers: [{src, depth, mode:'normal'|'lighter', alpha, breathe}] + optional sheen:{poly:[[x,y]..] in % , depth}
     draw(cv, ctx, iw, ih, par{x,y} in %, t s): zeichnet nach dem Kader; Verschiebung = par × depth × 2.5 (in % der Kaderbreite). */
  function Layers(list,sheen){const ims=[];let ready=false;
    const load=()=>Promise.all(list.map((l,i)=>loadImg(l.src).then(x=>{ims[i]=x;}))).then(()=>{ready=true;});
    function draw(cv,ctx,iw,ih,par,t){if(!ready)return;const cw=cv.width,ch=cv.height;const s=Math.max(cw/iw,ch/ih),dw=iw*s,dh=ih*s,dx=(cw-dw)/2,dy=(ch-dh)/2;
      list.forEach((l,i)=>{const im=ims[i];if(!im)return;const k=(l.depth||1)*2.5;const ox=par.x/100*dw*k,oy=par.y/100*dh*k;const br=l.breathe?1+.006*Math.sin(t*.9):1;
        ctx.save();ctx.globalCompositeOperation=l.mode||'source-over';ctx.globalAlpha=l.alpha==null?1:l.alpha;ctx.translate(dx+dw/2+ox,dy+dh/2+oy);ctx.scale(br,br);ctx.drawImage(im,-dw/2,-dh/2,dw,dh);ctx.restore();});
      if(sheen){/* Glas-Reflex: weiche Lichtbahn, wandert gegen die Blickrichtung (depth negativ = hinter dem Glas) */
        const k=(sheen.depth||-1.6)*2.5;const ox=par.x/100*dw*k;ctx.save();ctx.beginPath();sheen.poly.forEach((pt,j)=>{const X=dx+dw*pt[0]/100,Y=dy+dh*pt[1]/100;j?ctx.lineTo(X,Y):ctx.moveTo(X,Y);});ctx.closePath();ctx.clip();
        const gx=dx+dw*(sheen.x||60)/100+ox;const g=ctx.createLinearGradient(gx-dw*.16,0,gx+dw*.16,0);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.45,`rgba(255,255,255,${sheen.alpha||.13})`);g.addColorStop(.55,`rgba(255,255,255,${(sheen.alpha||.13)*.8})`);g.addColorStop(1,'rgba(255,255,255,0)');
        ctx.globalCompositeOperation='lighter';ctx.fillStyle=g;ctx.fillRect(dx,dy,dw,dh);ctx.restore();}}
    return {load,draw,isReady:()=>ready};}

  /* ---------- 5. Gyro ---------- */
  function Gyro(onChange){let on=false,base=null;const st={x:0,y:0};
    const h=e=>{if(e.gamma==null||e.beta==null)return;if(!base)base={g:e.gamma,b:e.beta};
      st.x=clamp((e.gamma-base.g)/18,-1,1);st.y=clamp((e.beta-base.b)/18,-1,1);onChange(st);};
    const enable=()=>{if(on)return;on=true;window.addEventListener('deviceorientation',h,{passive:true});};
    const ask=()=>{const D=window.DeviceOrientationEvent;if(!D)return;if(typeof D.requestPermission==='function'){D.requestPermission().then(r=>{if(r==='granted')enable();}).catch(()=>{});}else enable();};
    const stop=()=>{if(on)window.removeEventListener('deviceorientation',h);on=false;base=null;};
    return {ask,stop,recenter:()=>{base=null;}};}

  /* Architekturklang: Luftbewegung + kurzer Holz-/Filzanschlag, keine Sinus-Pieptöne.
     Vier begrenzte Stimmen, ein wiederverwendeter Rauschpuffer, echte Stille bei Mute. */
  window.FilmFX={Codecs,VideoFlight,Materialize,Inertial,Layers,Gyro,EASE,easeIO,loadImg};
})();
