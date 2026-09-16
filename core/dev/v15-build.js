/* BauStern v15 «Berghaus» — Master → Web-Derivate (Windows, per _v15-build.cmd; ffmpeg-static aus core/dev/node_modules).
   Quelle: core/_incoming/v15/ (Flow-Downloads: Stills 2K jpeg, Clips 1080p mp4). Zuordnung: core/dev/v15-map.json
     { "chapters":[ {"id":"ankunft","L":"<regex auf Clip L>","P":"<regex Clip P>","stillL":"<regex>","stillP":"<regex>"}, ... ],
       "rohbau":{"stillL":"<regex>","stillP":"<regex>"} }
   Erzeugt (alles unter site/img/film/):
     f15/  fNNNN.webp 1280×720   – 96 Kader je Kapitel (12 fps × 8 s), Kapitel k = Kader k*96 … k*96+95;
           ab Kapitel 1 sind die ersten 0.6 s eine Überblendung vom Haltekader des Vorkapitels in den Clip (xfade)
     f15h/ 1920×1080, f15l/ 960×540 (gleiche Nummern)
     fp15/ 540×960 aus den Hochkant-Clips (gleiche Nummern, gleiche Überblendung)
     s15/  st{i}.jpg + -1280 = LETZTER Kader des Clips (Haltebild, 1920), i = Szenenindex (Rohbau i=6 hat kein Haltebild → st-rohbau.jpg aus dem Still)
     s15p/ st{i}.jpg (1080×1920) + -720 = letzter Kader des Hochkant-Clips; st6.jpg = Rohbau-Still hochkant
     r15/  intro.h264.mp4 (Ankunft L, 1.7× → ~4.7 s), intro.mp4 (Kopie für mobileVideo.dir)
     mp15/ intro.mp4 (Ankunft P, 1.7×)
     poster-v15.jpg (erster Kader Ankunft, 1920), intro-hold-v15.jpg (= s15/st0.jpg)
   Log: core/dev/_v15-build.log */
const fs=require('fs'),path=require('path'),cp=require('child_process'),os=require('os');
const ROOT=path.resolve(__dirname,'..','..'),SITE=path.join(ROOT,'site'),FILM=path.join(SITE,'img','film');
const INC=path.join(ROOT,'core','_incoming','v15'),LOG=path.join(__dirname,'_v15-build.log');
const log=s=>{fs.appendFileSync(LOG,s+'\n');console.log(s);};
fs.writeFileSync(LOG,'=== v15-build '+new Date().toISOString()+'\n');
let FF='ffmpeg';try{FF=require('ffmpeg-static')||FF;}catch(e){}
const FP=FF.replace(/ffmpeg(\.exe)?$/i,'ffprobe$1');
const ffOk=(()=>{try{cp.execFileSync(FF,['-version'],{stdio:'pipe'});return true;}catch(e){return false;}})();
log('ffmpeg: '+FF+' ok='+ffOk);
if(!ffOk){log('ffmpeg fehlt → in core/dev: npm i ffmpeg-static');process.exit(1);}
const TMP=path.join(os.tmpdir(),'bs-v15');fs.mkdirSync(TMP,{recursive:true});
/* ffmpeg-Filterpfade mit Leerzeichen/Kyrillisch sind heikel → Eingaben nach TMP kopieren (ASCII-Namen) und dort arbeiten */
const run=(args,cwd)=>{const r=cp.spawnSync(FF,['-hide_banner','-loglevel','error','-y',...args],{encoding:'utf8',cwd:cwd||TMP,maxBuffer:64e6});if(r.status!==0){log('  ffmpeg FAIL '+args.join(' ')+'\n'+(r.stderr||''));return false;}return true;};
const probe=p=>{try{const r=cp.spawnSync(FP,['-v','error','-select_streams','v:0','-show_entries','stream=width,height,duration,r_frame_rate','-of','csv=p=0',p],{encoding:'utf8'});return (r.stdout||'').trim();}catch(e){return '';}};
const mapFile=path.join(__dirname,'v15-map.json');
if(!fs.existsSync(mapFile)){log('kein v15-map.json');process.exit(1);}
const MAP=JSON.parse(fs.readFileSync(mapFile,'utf8'));
const files=fs.readdirSync(INC);
const find=re=>{if(!re)return null;const rx=new RegExp(re,'i');const m=files.filter(f=>rx.test(f)).sort();if(!m.length){log('MISSING '+re);return null;}if(m.length>1)log('  mehrere Treffer für '+re+': '+m.join(', ')+' → nehme '+m[m.length-1]);return path.join(INC,m[m.length-1]);};
const stage=(src,name)=>{const dst=path.join(TMP,name);fs.copyFileSync(src,dst);return dst;};
const D=n=>{const d=path.join(FILM,n);fs.mkdirSync(d,{recursive:true});return d;};
const F15=D('f15'),F15H=D('f15h'),F15L=D('f15l'),FP15=D('fp15'),S15=D('s15'),S15P=D('s15p'),R15=D('r15'),MP15=D('mp15');
const only=(process.env.V15_ONLY||'').split(',').filter(Boolean);   /* z. B. V15_ONLY=stills,frames,video */
const want=k=>!only.length||only.includes(k);
const N=96,FPS=12,XF=0.6;
const pad=n=>String(n).padStart(4,'0');
const ch=MAP.chapters;
/* ---- 1. Haltebilder (letzter Kader der Clips) + Rohbau-Stills ---- */
const holdL=[],holdP=[],endL=[],endP=[];
ch.forEach((c,k)=>{const L=find(c.L),P=find(c.P);c._L=L?stage(L,'c'+k+'L.mp4'):null;c._P=P?stage(P,'c'+k+'P.mp4'):null;
  if(c._L)log('clip L '+c.id+': '+probe(c._L));if(c._P)log('clip P '+c.id+': '+probe(c._P));
  const i=c.sceneIndex;
  const hl=path.join(TMP,'hold'+k+'L.jpg'),hp=path.join(TMP,'hold'+k+'P.jpg');
  /* Haltekader: Ende des Clips — oder holdAt (Sekunden), wenn der Clip am Ende zu nah dran ist (Küche, Bad, Wohnen, Eingang).
     ACHTUNG: fürs Kader-Archiv (xfade ins nächste Kapitel) zählt weiterhin der LETZTE Kader (Kontinuität) → holdEnd getrennt. */
  const seek=c.holdAt!=null?['-ss',String(c.holdAt)]:['-sseof','-0.08'];
  const seekP=seek; /* holdAt gilt für L und P gleich — die Kaderindizes (f) sind für f15 und fp15 identisch */
  const el=path.join(TMP,'end'+k+'L.jpg'),ep=path.join(TMP,'end'+k+'P.jpg');
  if(c._L&&run(['-sseof','-0.08','-i',c._L,'-frames:v','1','-vf','scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080','-q:v','2',el]))endL[k]=el;
  if(c._P&&run(['-sseof','-0.08','-i',c._P,'-frames:v','1','-vf','scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920','-q:v','2',ep]))endP[k]=ep;
  if(c._L&&run([...seek,'-i',c._L,'-frames:v','1','-vf','scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080','-q:v','2',hl])){holdL[k]=hl;
    if(want('stills')){fs.copyFileSync(hl,path.join(S15,'st'+i+'.jpg'));run(['-i',hl,'-vf','scale=1280:720','-q:v','4',path.join(S15,'st'+i+'-1280.jpg')]);}}
  if(c._P&&run([...seekP,'-i',c._P,'-frames:v','1','-vf','scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920','-q:v','2',hp])){holdP[k]=hp;
    /* st{i}-p.webp = Hochkant-Variante für den Plain-Modus (<picture> in pages.js wStage) */
    if(want('stills')){fs.copyFileSync(hp,path.join(S15P,'st'+i+'.jpg'));run(['-i',hp,'-vf','scale=720:1280','-q:v','4',path.join(S15P,'st'+i+'-720.jpg')]);run(['-i',hp,'-vf','scale=720:1280','-c:v','libwebp','-quality','78',path.join(S15,'st'+i+'-p.webp')]);}}
  /* Erstbilder (die 2K-Stills) als Referenz/Poster */
  const sl=find(c.stillL),sp=find(c.stillP);
  if(want('stills')&&sl){const t=stage(sl,'s'+k+'L.jpg');run(['-i',t,'-vf','scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080','-q:v','3',path.join(S15,'first'+i+'.jpg')]);}
  if(want('stills')&&sp){const t=stage(sp,'s'+k+'P.jpg');run(['-i',t,'-vf','scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920','-q:v','3',path.join(S15P,'first'+i+'.jpg')]);}
});
if(want('stills')&&MAP.rohbau){const R=MAP.rohbau;const i=R.sceneIndex;let rl=find(R.stillL),rp=find(R.stillP);
  /* Rohbau-Bild aus dem Rohbau-CLIP an derselben Stelle wie der Wohnen-Halt (holdAt) — gleicher Kamerafortschritt wie das "Nachher" */
  if(R.holdAt!=null){const cl=find(R.L),cpp=find(R.P);
    if(cl){const t=stage(cl,'rohL.mp4'),o=path.join(TMP,'rohL-frame.jpg');if(run(['-ss',String(R.holdAt),'-i',t,'-frames:v','1','-q:v','2',o]))rl=o;}
    if(cpp){const t=stage(cpp,'rohP.mp4'),o=path.join(TMP,'rohP-frame.jpg');if(run(['-ss',String(R.holdAt),'-i',t,'-frames:v','1','-q:v','2',o]))rp=o;}}
  if(rl){const t=stage(rl,'rohL.jpg');run(['-i',t,'-vf','scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080','-q:v','3',path.join(S15,'st-rohbau.jpg')]);run(['-i',t,'-vf','scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720','-q:v','4',path.join(S15,'st-rohbau-1280.jpg')]);
    /* pages.js wRoom() erwartet st{i}-1280.jpg für JEDE Szene (auch Rohbau) */
    fs.copyFileSync(path.join(S15,'st-rohbau.jpg'),path.join(S15,'st'+i+'.jpg'));fs.copyFileSync(path.join(S15,'st-rohbau-1280.jpg'),path.join(S15,'st'+i+'-1280.jpg'));}
  if(rp){const t=stage(rp,'rohP.jpg');run(['-i',t,'-vf','scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920','-q:v','3',path.join(S15P,'st-rohbau.jpg')]);fs.copyFileSync(path.join(S15P,'st-rohbau.jpg'),path.join(S15P,'st'+i+'.jpg'));run(['-i',t,'-vf','scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280','-q:v','4',path.join(S15P,'st'+i+'-720.jpg')]);run(['-i',t,'-vf','scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280','-c:v','libwebp','-quality','78',path.join(S15,'st'+i+'-p.webp')]);}
  log('rohbau stills ok');}
/* Poster + Intro-Hold */
if(want('stills')&&ch[0]._L){run(['-i',ch[0]._L,'-frames:v','1','-vf','scale=1920:1080','-q:v','3',path.join(FILM,'poster-v15.jpg')]);if(holdL[0])fs.copyFileSync(holdL[0],path.join(FILM,'intro-hold-v15.jpg'));log('poster/hold ok');}
/* ---- 2. Kader (v15.1): Kapitel 0 = Ankunft-Clip (96 Kader, 12 fps).
   Kapitel k≥1 = [Übergangsclip T_k (Veo first/last frame: Halt k-1 → Stilll k), 6 fps ≈ 48 Kader = 2× Zeitraffer]
                 + [Push-in-Clip P_k von 0 bis holdAt (bzw. ganz), 12 fps, erste 0.33 s xfade vom letzten T-Kader].
   Ohne T_k (Map ohne "T" / Datei fehlt): Fallback wie v15.0 — xfade 0.6 s vom Endkader des Vorkapitels in den Push-in.
   Halt f_k = letzter Kader des Kapitels; die Indizes werden fortlaufend vergeben und am Ende geloggt (→ data.js scenes[].f). ---- */
const TFPS=MAP.transitionFps||6,XF2=0.34,XFT=0.5;
function extract(args,seq){fs.rmSync(seq,{recursive:true,force:true});fs.mkdirSync(seq,{recursive:true});if(!run(args))return [];return fs.readdirSync(seq).filter(f=>/^f\d+\.webp$/.test(f)).sort().map(f=>path.join(seq,f));}
function chapterFrames(c,k,W,H,q,prevEnd,tClip){const sc=`scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H}`;const enc=['-c:v','libwebp','-quality',String(q),'-compression_level','4'];const out=[];
  const pClip=c._L;if(!pClip)return out;
  if(k===0){return extract(['-i',pClip,'-vf',`${sc},fps=${FPS}`,'-frames:v',String(N),...enc,path.join(TMP,'s'+k+'_'+W,'f%04d.webp')],path.join(TMP,'s'+k+'_'+W));}
  const nP=c.holdAt!=null?Math.round(c.holdAt*FPS):N;
  if(tClip){/* v15.2: T wurde aus dem ALTEN Halt generiert; der neue (Quality-)Push-in endet leicht anders → 0.5 s xfade vom aktuellen Halt (prevEnd) in T, damit kein Sprung am Kapitelanfang entsteht */
    const a=prevEnd?extract(['-loop','1','-t',String(XFT),'-i',prevEnd,'-i',tClip,'-filter_complex',`[0:v]${sc},fps=${TFPS},format=yuv420p[a];[1:v]${sc},fps=${TFPS},format=yuv420p[b];[a][b]xfade=transition=fade:duration=${XFT}:offset=0,fps=${TFPS}`,...enc,path.join(TMP,'t'+k+'_'+W,'f%04d.webp')],path.join(TMP,'t'+k+'_'+W))
                     :extract(['-i',tClip,'-vf',`${sc},fps=${TFPS}`,...enc,path.join(TMP,'t'+k+'_'+W,'f%04d.webp')],path.join(TMP,'t'+k+'_'+W));
    const lastT=path.join(TMP,'tlast'+k+'.jpg');run(['-sseof','-0.08','-i',tClip,'-frames:v','1','-q:v','2',lastT]);
    const b=extract(['-loop','1','-t',String(XF2),'-i',lastT,'-i',pClip,'-filter_complex',`[0:v]${sc},fps=${FPS},format=yuv420p[a];[1:v]${sc},fps=${FPS},format=yuv420p[b];[a][b]xfade=transition=fade:duration=${XF2}:offset=0,fps=${FPS}`,'-frames:v',String(nP),...enc,path.join(TMP,'p'+k+'_'+W,'f%04d.webp')],path.join(TMP,'p'+k+'_'+W));
    return a.concat(b);}
  return extract(['-loop','1','-t',String(XF),'-i',prevEnd,'-i',pClip,'-filter_complex',`[0:v]${sc},fps=${FPS},format=yuv420p[a];[1:v]${sc},fps=${FPS},format=yuv420p[b];[a][b]xfade=transition=fade:duration=${XF}:offset=0,fps=${FPS}`,'-frames:v',String(nP),...enc,path.join(TMP,'p'+k+'_'+W,'f%04d.webp')],path.join(TMP,'p'+k+'_'+W));}
if(want('frames')){
  ch.forEach((c,k)=>{const t=find(c.T);c._T=t?stage(t,'t'+k+'.mp4'):null;if(c._T)log('transition '+k+' ('+c.id+'): '+path.basename(t));});
  const fIdx=[];
  for(const [dir,W,H,q] of [[F15,1280,720,80],[F15H,1920,1080,80],[F15L,960,540,70]]){
    fs.rmSync(dir,{recursive:true,force:true});fs.mkdirSync(dir,{recursive:true});let idx=0;
    ch.forEach((c,k)=>{const prevEnd=k?holdL[k-1]:null;const fr=chapterFrames(c,k,W,H,q,prevEnd,c._T);
      fr.forEach(src=>{fs.copyFileSync(src,path.join(dir,'f'+pad(idx)+'.webp'));idx++;});
      if(W===1280){fIdx.push({id:c.id,sceneIndex:c.sceneIndex,start:idx-fr.length,f:idx-1,n:fr.length,transition:!!c._T});}
      log('  '+path.basename(dir)+' k='+k+' '+c.id+' frames='+fr.length+' → f='+(idx-1));});
    log('  '+path.basename(dir)+' total='+idx);}
  fs.writeFileSync(path.join(__dirname,'v15-frames.json'),JSON.stringify({fps:FPS,transitionFps:TFPS,chapters:fIdx,frames:fIdx.length?fIdx[fIdx.length-1].f+1:0},null,1));
  log('f-Werte: '+fIdx.map(x=>x.id+'='+x.f).join(', ')+'  frames='+(fIdx.length?fIdx[fIdx.length-1].f+1:0));}
/* Hochkant-Kader (fp15) nur, wenn für ALLE Kapitel ≥1 ein Hochkant-Übergang TP vorliegt — sonst Pan-Scan (portrait.dir=null) */
if(want('pframes')){const tps=ch.map(c=>find(c.TP));if(ch.slice(1).every((c,i)=>tps[i+1])){fs.rmSync(FP15,{recursive:true,force:true});fs.mkdirSync(FP15,{recursive:true});let idx=0;
    ch.forEach((c,k)=>{const cc=Object.assign({},c,{_L:c._P,_T:tps[k]?stage(tps[k],'tp'+k+'.mp4'):null});const fr=chapterFrames(cc,k,540,960,78,k?holdP[k-1]:null,cc._T);fr.forEach(src=>{fs.copyFileSync(src,path.join(FP15,'f'+pad(idx)+'.webp'));idx++;});log('  fp15 k='+k+' frames='+fr.length);});}
  else log('fp15 übersprungen (keine Hochkant-Übergänge TP für alle Kapitel) → portrait.dir=null, Pan-Scan');}
/* ---- 3. Videos: Intro (Ankunft) 1.7× schneller, ohne Ton, faststart ---- */
if(want('video')&&ch[0]._L){const SP=MAP.introSpeed||1.7;
  run(['-i',ch[0]._L,'-an','-vf',`setpts=PTS/${SP},scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fps=60,format=yuv420p`,'-c:v','libx264','-preset','slow','-crf','19','-profile:v','high','-movflags','+faststart',path.join(R15,'intro.h264.mp4')]);
  fs.copyFileSync(path.join(R15,'intro.h264.mp4'),path.join(R15,'intro.mp4'));
  if(ch[0]._P)run(['-i',ch[0]._P,'-an','-vf',`setpts=PTS/${SP},scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=60,format=yuv420p`,'-c:v','libx264','-preset','slow','-crf','20','-profile:v','high','-movflags','+faststart',path.join(MP15,'intro.mp4')]);
  log('intro videos ok ('+SP+'x): '+probe(path.join(R15,'intro.h264.mp4')));}
log('done');
