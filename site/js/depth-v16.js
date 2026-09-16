/* BauStern — v16 Etappe 4: 2,5D-Halt.
   Ein WebGL-Quad zeigt das Standbild und verschiebt die Abtastkoordinate anhand einer Tiefenkarte.
   Die Karten liegen als ein Bild je Raum/Ausrichtung vor:  R = Tiefe (hell = nah), G = Fernmaske (Glas).
   Zusätzlich: langsamer Nebelzug hinter den Fenstern und ein kaum sichtbares Atmen des Lichts.

   Regeln (aus dem Auftrag):
   - Ausschlag höchstens ±1,5 % der Bildkante, Eingabe gedämpft, Rückkehr in die Neutrallage.
   - Neutrallage ist pixelgenau das Standbild — nur so passt der Halt auf den ersten Kader des Clips.
   - Keine leeren Ränder: der nötige Spielraum wird proportional zum aktuellen Ausschlag hineingezoomt.
   - Gesten: Maus am Rechner, waagrechtes Ziehen am Telefon. Senkrechtes Wischen gehört der Navigation.
   - Kreiselsensor nur nach ausdrücklicher Erlaubnis (window.V16Depth.enableGyro()).
   - Kein Rendern im versteckten Tab, ausserhalb des Halts oder bei prefers-reduced-motion.
   - Fällt WebGL aus: sanftes Schwenken des Standbilds per CSS; scheitert auch das: unbewegtes Standbild. */
(function(){
  'use strict';
  const AMP=0.015;                 /* max. Verschiebung, Anteil der Bildkante */
  const EASE=0.075;                /* Dämpfung pro Kader */
  const FOG=0.17, BREATH=0.010, BREATH_S=8.0;
  const DPR_MAX=2;

  const VS=`attribute vec2 p;varying vec2 uv;void main(){uv=p*0.5+0.5;uv.y=1.0-uv.y;gl_Position=vec4(p,0.0,1.0);}`;
  const FS=`precision highp float;
varying vec2 uv;
uniform sampler2D tPhoto,tDepth;
uniform vec2 uOff;        /* aktuelle Auslenkung, bereits in UV-Einheiten */
uniform float uMag;       /* Betrag der Auslenkung 0..1 — steuert den Zoom-Spielraum */
uniform float uT;         /* Zeit in Sekunden */
uniform float uFog,uBreath;
uniform vec2 uCover;      /* Zuschnitt „cover" */
float h(vec2 v){return fract(sin(dot(v,vec2(127.1,311.7)))*43758.5453);}
float vnoise(vec2 v){vec2 i=floor(v),f=fract(v);f=f*f*(3.0-2.0*f);
  return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}
void main(){
  /* Zuschnitt wie object-fit:cover, dann Spielraum für die Verschiebung */
  vec2 c=(uv-0.5)*uCover+0.5;
  c=(c-0.5)*(1.0-2.0*uMag*${AMP.toFixed(4)})+0.5;
  float d=texture2D(tDepth,c).r;
  vec2 s=c+uOff*(d-0.5);
  vec4 px=texture2D(tPhoto,clamp(s,0.0,1.0));
  float mask=texture2D(tDepth,clamp(s,0.0,1.0)).g;
  /* Nebel: zwei Oktaven, waagrechter Zug, nur hinter Glas */
  if(uFog>0.001&&mask>0.004){
    vec2 q=vec2(s.x*3.0+uT*0.011,s.y*5.0-uT*0.004);
    float n=vnoise(q)*0.65+vnoise(q*2.3+7.0)*0.35;
    n=smoothstep(0.30,0.92,n);
    px.rgb=mix(px.rgb,px.rgb+vec3(0.085,0.090,0.098),mask*uFog*n);
  }
  /* Atmen des Lichts: nur die hellen Partien, weit unter der Sichtbarkeitsschwelle für Flimmern */
  float L=dot(px.rgb,vec3(0.299,0.587,0.114));
  px.rgb*=1.0+uBreath*sin(uT*6.2831853/${BREATH_S.toFixed(1)})*smoothstep(0.34,0.90,L);
  gl_FragColor=vec4(px.rgb,1.0);
}`;

  let cv=null,gl=null,prog=null,U={},tex={photo:null,depth:null},raf=0,host=null;
  let tx=0,ty=0,cx=0,cy=0;                /* Ziel / aktuell */
  let on=false,ready=false,paused=false,lost=false,t0=0,wantShow=false;
  let imgW=0,imgH=0,cssW=0,cssH=0;
  let gyro=false,gyroBase=null,mode='gl',ro=null;
  let fallbackEl=null,token=0;
  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse=()=>matchMedia('(pointer: coarse)').matches;

  /* ---------------- WebGL ---------------- */
  function sh(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);
    if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){console.warn('v16 depth shader',gl.getShaderInfoLog(s));return null;}return s;}
  function initGL(){
    try{gl=cv.getContext('webgl',{alpha:false,antialias:false,depth:false,stencil:false,
      premultipliedAlpha:false,powerPreference:'low-power',preserveDrawingBuffer:false});}catch(e){gl=null;}
    if(!gl)return false;
    const v=sh(gl.VERTEX_SHADER,VS),f=sh(gl.FRAGMENT_SHADER,FS);
    if(!v||!f)return false;
    prog=gl.createProgram();gl.attachShader(prog,v);gl.attachShader(prog,f);gl.linkProgram(prog);
    gl.deleteShader(v);gl.deleteShader(f);
    if(!gl.getProgramParameter(prog,gl.LINK_STATUS)){console.warn('v16 depth link',gl.getProgramInfoLog(prog));return false;}
    gl.useProgram(prog);
    const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
    const loc=gl.getAttribLocation(prog,'p');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
    ['uOff','uMag','uT','uFog','uBreath','uCover','tPhoto','tDepth'].forEach(n=>U[n]=gl.getUniformLocation(prog,n));
    gl.uniform1i(U.tPhoto,0);gl.uniform1i(U.tDepth,1);
    tex.photo=mkTex();tex.depth=mkTex();
    cv.addEventListener('webglcontextlost',onLost,false);
    cv.addEventListener('webglcontextrestored',onRestored,false);
    return true;
  }
  function mkTex(){const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);return t;}
  function upload(unit,t,img){gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);}
  function onLost(e){e.preventDefault();lost=true;ready=false;stop();if(cv)cv.style.opacity='0';}
  function onRestored(){lost=false;U={};if(initGL()&&lastPair)api.show(lastPair[0],lastPair[1]);}

  function resize(){
    if(!cv||!gl)return;
    const r=cv.getBoundingClientRect();cssW=r.width||1;cssH=r.height||1;
    const dpr=Math.min(devicePixelRatio||1,DPR_MAX);
    const w=Math.max(1,Math.round(cssW*dpr)),h=Math.max(1,Math.round(cssH*dpr));
    if(cv.width!==w||cv.height!==h){cv.width=w;cv.height=h;gl.viewport(0,0,w,h);}
    setCover();
  }
  function setCover(){
    if(!gl||!imgW||!cssW)return;
    const ia=imgW/imgH, va=cssW/cssH;
    /* „cover": das kürzere Verhältnis wird beschnitten */
    const sx=ia>va?va/ia:1, sy=ia>va?1:ia/va;
    gl.uniform2f(U.uCover,sx,sy);
  }

  /* ---------------- Schleife ---------------- */
  function frame(){
    raf=0;
    if(!on||paused||!ready||lost||document.hidden)return;
    cx+=(tx-cx)*EASE; cy+=(ty-cy)*EASE;
    const mag=Math.min(1,Math.hypot(cx,cy));
    gl.uniform2f(U.uOff,cx*AMP,cy*AMP);
    gl.uniform1f(U.uMag,mag);
    gl.uniform1f(U.uT,(performance.now()-t0)/1000);
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
    raf=requestAnimationFrame(frame);
  }
  function start(){if(!raf&&on&&ready&&!paused&&!lost&&!document.hidden)raf=requestAnimationFrame(frame);}
  function stop(){if(raf)cancelAnimationFrame(raf);raf=0;}
  function drawOnce(){
    if(!gl||!ready&&!lastPair)return;
    gl.uniform2f(U.uOff,cx*AMP,cy*AMP);gl.uniform1f(U.uMag,Math.min(1,Math.hypot(cx,cy)));
    gl.uniform1f(U.uT,(performance.now()-t0)/1000);
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
  }
  function reveal(){wantShow=false;if(!cv)return;cv.style.transition='opacity .5s ease';cv.style.opacity='1';start();}

  /* ---------------- Eingabe ---------------- */
  let tId=null,tsx=0,tsy=0,tMode=0;          /* 0 = unentschieden, 1 = Parallaxe, 2 = Navigation */
  function setTarget(nx,ny){tx=Math.max(-1,Math.min(1,nx));ty=Math.max(-1,Math.min(1,ny));start();}
  function neutral(){tx=ty=0;start();}
  function onMove(e){
    if(!on||coarse())return;
    const r=(host||cv).getBoundingClientRect();
    setTarget((e.clientX-r.left)/r.width*2-1,(e.clientY-r.top)/r.height*2-1);
  }
  function onLeave(){neutral();}
  function onTS(e){
    if(!on||e.touches.length!==1){tMode=2;return;}
    const t=e.touches[0];tId=t.identifier;tsx=t.clientX;tsy=t.clientY;tMode=0;
  }
  function onTM(e){
    if(!on||tMode===2)return;
    const t=[].slice.call(e.touches).filter(x=>x.identifier===tId)[0];if(!t)return;
    const dx=t.clientX-tsx,dy=t.clientY-tsy;
    if(tMode===0){
      if(Math.abs(dx)<8&&Math.abs(dy)<8)return;
      /* Senkrecht gehört der Navigation (film-v16.js verlangt |dy| ≥ |dx| und ≥ 46 px) */
      if(Math.abs(dy)>=Math.abs(dx)){tMode=2;neutral();return;}
      tMode=1;
    }
    const r=(host||cv).getBoundingClientRect();
    setTarget(dx/(r.width*0.45),dy/(r.height*0.9));
  }
  function onTE(){if(tMode===1)neutral();tMode=0;tId=null;}
  function onOrient(e){
    if(!gyro||!on)return;
    const b=e.beta||0,g=e.gamma||0;
    if(!gyroBase)gyroBase={b,g};
    setTarget((g-gyroBase.g)/22,(b-gyroBase.b)/22);
  }

  /* ---------------- CSS-Ersatz ---------------- */
  function mountFallback(){
    mode='css';
    if(!host)return false;
    fallbackEl=host.querySelector('.v16-hold');
    if(!fallbackEl)return false;
    let fx=0,fy=0,fr=0;
    const apply=()=>{fr=0;
      const el=host.querySelector('.v16-hold.on');if(!el)return;
      el.style.transform=on?`scale(1.012) translate(${(-fx*0.45).toFixed(3)}%,${(-fy*0.45).toFixed(3)}%)`:'';
    };
    const upd=(nx,ny)=>{fx=nx;fy=ny;if(!fr)fr=requestAnimationFrame(apply);};
    api._cssMove=(nx,ny)=>upd(nx,ny);
    api._cssOff=()=>{host.querySelectorAll('.v16-hold').forEach(e=>{e.style.transition='transform .5s ease-out';e.style.transform='';});};
    return true;
  }

  /* ---------------- API ---------------- */
  let lastPair=null;
  const api={
    ready:false, mode:()=>mode, amp:AMP,
    mount(canvas,hostEl){
      cv=canvas;host=hostEl||canvas.parentNode;
      if(reduced()){mode='off';return false;}
      if(!initGL()){gl=null;return mountFallback();}
      mode='gl';t0=performance.now();
      host.addEventListener('pointermove',onMove,{passive:true});
      host.addEventListener('pointerleave',onLeave,{passive:true});
      host.addEventListener('touchstart',onTS,{passive:true});
      host.addEventListener('touchmove',onTM,{passive:true});
      host.addEventListener('touchend',onTE,{passive:true});
      host.addEventListener('touchcancel',onTE,{passive:true});
      /* Der Halt baut sich erst nach dem Einhängen auf (Räume kollabieren, Bühne wird fixiert),
         darum die Fläche beobachten statt einmalig messen — deckt auch Drehung und Adressleiste ab. */
      if(window.ResizeObserver){ro=new ResizeObserver(()=>{resize();start();});ro.observe(cv);}
      addEventListener('resize',resize);
      document.addEventListener('visibilitychange',onVis);
      resize();
      return true;
    },
    /* Bild + Karte laden und einblenden. Vorher immer neutral, damit der Übergang
       vom Video auf den Halt ohne eigene Bewegung beginnt. */
    async show(photoUrl,depthUrl){
      lastPair=[photoUrl,depthUrl];
      if(mode==='off')return false;
      if(mode==='css'){on=true;api.ready=true;return true;}
      if(!gl||lost)return false;
      const my=++token;
      cx=cy=tx=ty=0;
      let a,b;
      try{[a,b]=await Promise.all([loadImg(photoUrl),loadImg(depthUrl)]);}
      catch(e){ if(my===token){api.ready=false;if(cv)cv.style.opacity='0';} return false; }
      if(my!==token||!gl||lost)return false;
      imgW=a.naturalWidth;imgH=a.naturalHeight;
      upload(0,tex.photo,a);upload(1,tex.depth,b);
      resize();
      gl.uniform1f(U.uFog,reduced()?0:FOG);
      gl.uniform1f(U.uBreath,reduced()?0:BREATH);
      ready=true;api.ready=true;on=true;paused=false;
      /* erster Kader in Neutrallage zeichnen, danach einblenden — kein Springen am Übergang.
         Im versteckten Tab wird nicht komponiert: die Leinwand bliebe schwarz und würde das
         Standbild verdecken. Darum erst einblenden, wenn die Seite wieder sichtbar ist. */
      drawOnce();
      if(document.hidden){wantShow=true;return true;}
      reveal();
      return true;
    },
    /* Während eines Flugs: sofort neutral, ausblenden, nicht mehr rendern. */
    hide(){
      token++;on=false;wantShow=false;cx=cy=tx=ty=0;
      if(mode==='css'){api._cssOff&&api._cssOff();return;}
      if(cv){cv.style.transition='opacity .14s linear';cv.style.opacity='0';}
      stop();
    },
    pause(){paused=true;stop();},
    resume(){paused=false;start();},
    /* Kreiselsensor ausschliesslich nach einer Nutzeraktion (iOS verlangt die Erlaubnis-Abfrage) */
    async enableGyro(){
      if(mode!=='gl')return false;
      try{
        const D=window.DeviceOrientationEvent;
        if(!D)return false;
        if(typeof D.requestPermission==='function'){const r=await D.requestPermission();if(r!=='granted')return false;}
        gyro=true;gyroBase=null;addEventListener('deviceorientation',onOrient,true);return true;
      }catch(e){return false;}
    },
    disableGyro(){gyro=false;gyroBase=null;removeEventListener('deviceorientation',onOrient,true);neutral();},
    destroy(){
      token++;on=false;ready=false;api.ready=false;stop();
      if(host){host.removeEventListener('pointermove',onMove);host.removeEventListener('pointerleave',onLeave);
        host.removeEventListener('touchstart',onTS);host.removeEventListener('touchmove',onTM);
        host.removeEventListener('touchend',onTE);host.removeEventListener('touchcancel',onTE);}
      if(ro){try{ro.disconnect();}catch(e){}ro=null;}
      removeEventListener('resize',resize);
      document.removeEventListener('visibilitychange',onVis);
      removeEventListener('deviceorientation',onOrient,true);
      if(gl){
        if(cv){cv.removeEventListener('webglcontextlost',onLost);cv.removeEventListener('webglcontextrestored',onRestored);}
        try{gl.deleteTexture(tex.photo);gl.deleteTexture(tex.depth);gl.deleteProgram(prog);
          const e=gl.getExtension('WEBGL_lose_context');if(e)e.loseContext();}catch(e){}
      }
      gl=null;prog=null;tex={photo:null,depth:null};cv=null;host=null;lastPair=null;mode='gl';
    },
    /* Messung: mittlere GPU-Zeit je Kader, sofern die Erweiterung vorhanden ist; sonst JS-Zeit. */
    async measure(n){
      n=n||120;
      if(mode!=='gl'||!gl||!ready)return {mode,ms:null,note:'kein WebGL-Halt aktiv'};
      const ext=gl.getExtension('EXT_disjoint_timer_query');
      const js=[],gpu=[],qs=[];
      for(let i=0;i<n;i++){
        await new Promise(r=>requestAnimationFrame(r));
        let q=null;
        if(ext){q=ext.createQueryEXT();ext.beginQueryEXT(ext.TIME_ELAPSED_EXT,q);}
        const a=performance.now();
        gl.uniform1f(U.uT,(performance.now()-t0)/1000);
        gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
        js.push(performance.now()-a);
        if(ext){ext.endQueryEXT(ext.TIME_ELAPSED_EXT);qs.push(q);}
      }
      if(ext){
        await new Promise(r=>setTimeout(r,250));
        const dis=gl.getParameter(ext.GPU_DISJOINT_EXT);
        for(const q of qs){
          if(!dis&&ext.getQueryObjectEXT(q,ext.QUERY_RESULT_AVAILABLE_EXT))
            gpu.push(ext.getQueryObjectEXT(q,ext.QUERY_RESULT_EXT)/1e6);
          ext.deleteQueryEXT(q);
        }
      }
      const med=a=>{a=a.slice().sort((x,y)=>x-y);return a.length?+a[a.length>>1].toFixed(3):null;};
      const p95=a=>{a=a.slice().sort((x,y)=>x-y);return a.length?+a[Math.floor(a.length*0.95)].toFixed(3):null;};
      return {mode,size:cv.width+'x'+cv.height,frames:n,
        gpuMedianMs:med(gpu),gpuP95Ms:p95(gpu),gpuSamples:gpu.length,
        jsMedianMs:med(js),jsP95Ms:p95(js),
        note:gpu.length?'gpuMedianMs = echte GPU-Zeit des Halt-Zeichnens (EXT_disjoint_timer_query)'
                       :'GPU-Zeit nicht messbar (Erweiterung fehlt oder disjoint) — jsMedianMs ist nur die Aufrufzeit, nicht die GPU-Kosten'};
    }
  };
  /* Beim Zurückkommen zuerst EINEN Kader zeichnen, dann erst zeigen/weiterlaufen —
     sonst blitzt die noch nicht komponierte Leinwand schwarz auf. */
  function onVis(){
    if(document.hidden){stop();return;}
    if(!ready||!on)return;
    drawOnce();
    if(wantShow)reveal();else start();
  }
  function loadImg(u){return new Promise((res,rej)=>{const i=new Image();i.decoding='async';
    i.onload=()=>res(i);i.onerror=()=>rej(Error('load '+u));i.src=u;});}

  window.V16Depth=api;
})();
