/* jsdom-Smoke (ohne Chromium): lädt index.html + alle Skripte, stubbt Canvas/Video/Bitmap, bootet die Startseite,
   fährt updateRoom/flight-Pfade durch und meldet Laufzeitfehler. Kein Ersatz für Playwright — fängt aber ReferenceErrors,
   kaputte Templates und Ausnahmen in render()/updateRoom()/Materialize ab.
   Aufruf: node core/dev/jsdom-smoke.js   (braucht: npm i jsdom) */
const fs=require('fs'),path=require('path');
const {JSDOM,VirtualConsole}=require(process.env.JSDOM||'jsdom');
const SITE=path.resolve(__dirname,'../../site');
const html=fs.readFileSync(path.join(SITE,'index.html'),'utf8');
const vc=new VirtualConsole();const errors=[];vc.on('jsdomError',e=>{if(!/Could not load|not implemented|Not implemented/i.test(String(e.message)))errors.push('jsdomError: '+e.message);});
vc.on('error',m=>errors.push('console.error: '+m));vc.on('warn',()=>{});vc.on('log',()=>{});
/* MV2=1 W=375 node jsdom-smoke.js → Vertikaler Schnitt (film-mobile-v2.js) statt v1; das Modul wird hier direkt eingehängt,
   weil jsdom die dynamische Nachladung aus film.js lite() ohne resources:'usable' nicht ausführt. */
const MV2=process.env.MV2==='1';
const dom=new JSDOM(html,{url:'http://localhost:8099/'+(MV2?'?mv2=1':''),pretendToBeVisual:true,runScripts:'dangerously',virtualConsole:vc});
const w=dom.window,d=w.document;
/* ---- Stubs: Canvas 2D, ImageBitmap, fetch, Video, matchMedia, rAF/rVFC ---- */
const ctxStub=()=>{const o={};['clearRect','drawImage','fillRect','save','restore','translate','scale','setTransform','beginPath','arc','fill','rect','clip','moveTo','lineTo','closePath','fillText','stroke'].forEach(k=>o[k]=()=>{});
  o.createLinearGradient=o.createRadialGradient=()=>({addColorStop(){}});o.globalAlpha=1;o.globalCompositeOperation='source-over';o.fillStyle='#000';o.filter='none';return o;};
w.HTMLCanvasElement.prototype.getContext=function(){return this.__ctx||(this.__ctx=ctxStub());};
w.HTMLCanvasElement.prototype.toDataURL=()=>'data:,';
class FakeBitmap{constructor(){this.width=1280;this.height=720;}close(){}}
w.ImageBitmap=FakeBitmap;w.createImageBitmap=()=>Promise.resolve(new FakeBitmap());
w.fetch=(u)=>Promise.resolve({ok:true,blob:()=>Promise.resolve({size:12000,url:u}),json:()=>Promise.resolve({})});
/* Bilder «laden» sofort */
const RealImage=w.Image;w.Image=function(){const im=d.createElement('img');Object.defineProperty(im,'naturalWidth',{get:()=>1280});Object.defineProperty(im,'naturalHeight',{get:()=>720});Object.defineProperty(im,'complete',{get:()=>true});
  im.decode=()=>Promise.resolve();let src='';Object.defineProperty(im,'src',{get:()=>src,set:v=>{src=v;setTimeout(()=>{im.dispatchEvent(new w.Event('load'));},0);}});return im;};
w.HTMLMediaElement.prototype.play=function(){this.__playing=true;setTimeout(()=>this.dispatchEvent(new w.Event('playing')),0);return Promise.resolve();};
w.HTMLMediaElement.prototype.pause=function(){this.__playing=false;};w.HTMLMediaElement.prototype.load=function(){setTimeout(()=>{Object.defineProperty(this,'readyState',{value:4,configurable:true});this.dispatchEvent(new w.Event('loadeddata'));this.dispatchEvent(new w.Event('canplaythrough'));},5);};
w.HTMLMediaElement.prototype.canPlayType=t=>/avc1|h264|mp4/.test(t)&&!/hvc1|av01/.test(t)?'probably':'';
Object.defineProperty(w.HTMLMediaElement.prototype,'duration',{get:()=>3.4,configurable:true});
w.HTMLVideoElement.prototype.requestVideoFrameCallback=function(cb){return setTimeout(()=>cb(performance.now(),{mediaTime:this.currentTime||0}),16);};
const MOBILE=+(process.env.W||1440)<1000;
w.matchMedia=q=>({matches:!MOBILE&&/hover:hover|pointer:fine/.test(q),addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}});
Object.defineProperty(w,'innerWidth',{value:+(process.env.W||1440),configurable:true});Object.defineProperty(w,'innerHeight',{value:+(process.env.H||900),configurable:true});
Object.defineProperty(w.navigator,'hardwareConcurrency',{value:8});
w.requestIdleCallback=cb=>setTimeout(cb,1);
w.HTMLElement.prototype.scrollIntoView=function(){};
w.scrollTo=()=>{};
/* Layout-Stubs: jsdom hat kein Layout → Räume bekommen Höhe, damit ScrollTrigger-Mathematik nicht NaN wird */
Object.defineProperty(w.HTMLElement.prototype,'offsetHeight',{get(){return this.classList&&this.classList.contains('w-room')?1890:(this.tagName==='BODY'?20000:100);},configurable:true});
Object.defineProperty(w.HTMLElement.prototype,'offsetWidth',{get(){return 1440;},configurable:true});
Object.defineProperty(w.HTMLElement.prototype,'clientWidth',{get(){return 1440;},configurable:true});
Object.defineProperty(w.HTMLElement.prototype,'clientHeight',{get(){return 900;},configurable:true});
Object.defineProperty(w.HTMLElement.prototype,'offsetTop',{get(){const r=this.closest&&this.closest('.w-room');if(!r)return 0;return (+r.dataset.scene||0)*1890;},configurable:true});
/* ---- Skripte laden (Reihenfolge wie index.html) ---- */
const srcs=[...html.matchAll(/<script[^>]*src="([^"]+)"[^>]*>/g)].map(m=>m[1]);
if(MV2){const i=srcs.indexOf('js/film.js');srcs.splice(i<0?srcs.length:i,0,'js/film-mobile-v2.js');}
/* <script> im Dokument ausführen (gemeinsamer globaler Scope für const/let wie im Browser); Fehler landen im VirtualConsole */
for(const s of srcs){const f=path.join(SITE,s);const el=d.createElement('script');el.textContent=fs.readFileSync(f,'utf8')+'\n//# sourceURL='+s;d.body.appendChild(el);}
/* n8n nie real */
w.XMLHttpRequest=function(){return {open(){},send(){},setRequestHeader(){},addEventListener(){}};};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
  try{d.dispatchEvent(new w.Event('DOMContentLoaded'));w.dispatchEvent(new w.Event('load'));}catch(e){errors.push('boot: '+e.message);}
  await sleep(400);
  const W=d.getElementById('wohnung');
  const report={mode:w.Film&&w.Film.mode(),scenes:W?W.querySelectorAll('.w-room').length:0,fx:!!d.querySelector('.w-fx'),vid:0,mat:false,
    vcut:!!(W&&W.classList.contains('is-vcut')),pins:d.querySelectorAll('.v-pin').length,pult:d.querySelectorAll('.m-tour, .m-frame-expand').length};
  /* Film explizit im full-Modus booten (jsdom hat keine echte GSAP-Scroll-Umgebung, aber die Aufrufe müssen sauber sein) */
  try{if(w.Film&&W&&!MOBILE){w.Film.full(d.getElementById('view')||d);}}catch(e){errors.push('Film.full: '+e.message+'\n'+e.stack.split('\n').slice(0,4).join('\n'));}
  await sleep(1200);
  report.mode=w.Film&&w.Film.mode();
  /* Szenen durchfahren: setupRoom + updateRoom über alle Zonen (Fahrt, Verweilzone, Materialisierung), Flug starten/enden */
  try{const D=w.__filmDebug;if(!D)throw new Error('no __filmDebug (lite?)');const F0=w.eval('FILM');const rooms=F0.scenes.length;const steps=[0,.05,.2,.44,.46,.6,.8,1];const seen=[];
    for(let i=1;i<rooms;i++){D.setupRoom(i);for(const p of steps){D.updateRoom(i,p);await sleep(20);}seen.push(i+':'+JSON.stringify(D.mat()));}
    for(let i=rooms-1;i>=1;i--){D.setupRoom(i);for(const p of steps.slice().reverse()){D.updateRoom(i,p);await sleep(20);}}
    D.setupRoom(2);D.updateRoom(2,.01);D.startFlight(2,1);await sleep(200);report.flightActive=D.vf();await sleep(2600);report.flightAfter=D.vf();
    report.matTrace=seen.filter(x=>/true/.test(x));report.videos=d.querySelectorAll('.w-vid').length;
  }catch(e){if(!MOBILE)errors.push('drive: '+e.message+'\n'+(e.stack||'').split('\n').slice(0,5).join('\n'));}
  /* Video-Elemente (Intro + Flug-Slots) */
  report.vid=d.querySelectorAll('.w-cam video').length;report.introSrc=(d.querySelector('.w-intro source')||{}).src||null;
  /* FilmFX-Module direkt: Materialize laden + rendern, VideoFlight-Quelle, Inertial */
  try{const F=w.eval('FILM');const sc=F.scenes.find(s=>s.mat);const cv=d.createElement('canvas');cv.width=1440;cv.height=900;
    if(sc){const M=w.FilmFX.Materialize(sc.mat);await M.load();
    for(const p of [0,.08,.26,.55,.92,1])M.render(cv,cv.getContext('2d'),p,{mode:'B+'});const fx=d.createElement('canvas');fx.width=100;fx.height=50;M.dustDraw(fx,fx.getContext('2d'),.2,.016);report.mat=M.isReady();}else report.mat='n/a (v15: flash ohne mat)';
    const I=w.FilmFX.Inertial(0);I.down(.5,0);I.set(.5);I.move(.6,16);I.up();let v=0;for(let k=0;k<200;k++)v=I.tick();report.inertial=+v.toFixed(3);
    const VF=w.FilmFX.VideoFlight({cam:d.querySelector('.w-cam'),F});VF.warm(3,1);await sleep(30);const st=VF.start(2,1,.1,2.2,.45);await sleep(120);report.vfStart=st;report.vfActive=VF.isActive();report.vfOn=!!d.querySelector('.w-vid.on');VF.end();await sleep(250);report.vfAfterEnd=VF.isActive();VF.destroy();
    report.codec=w.FilmFX.Codecs.probe();report.flightSrc=w.FilmFX.Codecs.src('img/film/v/c2-flur.fwd',F.video.codecs);
    const L=w.FilmFX.Layers(F.scenes.find(s=>s.layers).layers,F.scenes.find(s=>s.layers).sheen);await L.load();L.draw(cv,cv.getContext('2d'),1920,1080,{x:.3,y:-.2},1);report.layers=L.isReady();
  }catch(e){errors.push('FilmFX: '+e.message+'\n'+(e.stack||'').split('\n').slice(0,4).join('\n'));}
  /* Assets existieren? */
  const F=w.eval('FILM')||{scenes:[],frames:0,introSources:{},video:{codecs:[]}};const miss=[];const chk=p=>{if(typeof p!=="string")return;if(!fs.existsSync(path.join(SITE,p)))miss.push(p);};
  chk(F.poster);chk(F.introSources.hold);(F.introSources.codecs||['h264']).forEach(c=>chk(F.introSources.base+'.'+c+'.mp4'));
  const P=F.portrait||{};const MV=F.mobileVideo||{};if(MV.dir)chk(MV.dir+'intro.mp4');if(MV.portraitDir)chk(MV.portraitDir+'intro.mp4');
  F.scenes.forEach((s,i)=>{chk(F.dir+'f'+String(s.f).padStart(4,'0')+'.webp');chk(F.dir2+'f'+String(s.f).padStart(4,'0')+'.webp');chk(F.dirLow+'f'+String(s.f).padStart(4,'0')+'.webp');
    chk(F.stillDir+'st'+i+'.jpg');chk(F.stillDir+'st'+i+'-p.webp');chk(F.stillDir+'st'+i+'-1280.jpg');
    if(P.enabled&&P.stillDir&&!s.flash){chk(P.stillDir+'st'+i+'.jpg');chk(P.stillDir+'st'+i+'-720.jpg');}
    if(P.enabled&&P.dir)chk(P.dir+'f'+String(s.f).padStart(4,'0')+'.webp');
    if(s.clip)['fwd','rev'].forEach(dir=>F.video.codecs.forEach(c=>chk(F.video.dir+s.clip+'.'+dir+'.'+c+'.mp4')));
    if(s.img)chk(s.img);if(s.imgP)chk(s.imgP);if(s.compareImg)chk(s.compareImg);if(s.compareImgP)chk(s.compareImgP);if(s.layers)s.layers.forEach(l=>chk(l.src));
    if(s.mat){const m=s.mat;['before','dusty','flat','flatFull','after','technik','edges','bloom'].forEach(k=>chk(m.dir+m[k]));Object.values(m.masks).forEach(v=>chk(m.dir+v));}});
  for(let k=0;k<F.frames;k+=37)chk(F.dir+'f'+String(k).padStart(4,'0')+'.webp');
  report.missingAssets=miss;report.errors=errors;
  console.log(JSON.stringify(report,null,1));
  process.exit(errors.length||miss.length?1:0);
})();
