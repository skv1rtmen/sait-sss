/* BauStern v14 — Portrait-Assets aus Google-Flow-Downloads einbauen (Windows, ohne Shell-Zugang von Claude: per _v2-portrait-build.cmd).
   Schritt 1 (ohne portrait-map.json): kopiert alle heute geänderten PNG/JPG/MP4 aus %USERPROFILE%\Downloads nach
     site/img/film/s14/_incoming/ und schreibt _v2-portrait.log mit Liste + Bildmassen.
   Schritt 2 (mit core/dev/portrait-map.json {"<incoming-datei>":"<ziel>"}): konvertiert
     - Bilder → JPG 1080×1920 (Cover-Crop) + LUT baustern.cube + 720er-Variante → site/img/film/s14p/<ziel>.jpg, <ziel>-720.jpg
       (Ziel 'st-ankunft' landscape → s14/<ziel>.jpg 1920×1080 + -1280)
     - Videos → site/img/film/mp14/<ziel>.mp4 (H.264, faststart, ohne Audio, max 1080p) + Hold-Kader (letzter Frame) → s14p/<ziel>-hold.jpg
   ffmpeg: ffmpeg-static aus node_modules (npm i ffmpeg-static) oder PATH. */
const fs=require('fs'),path=require('path'),cp=require('child_process');
const ROOT=path.resolve(__dirname,'..','..'),SITE=path.join(ROOT,'site'),FILM=path.join(SITE,'img','film');
const INC=path.join(ROOT,'core','_incoming'),LOG=path.join(__dirname,'_v2-portrait.log');   /* ausserhalb von site/ — wird nie deployt */
const LUT=path.join(ROOT,'core','sources','sprintA','baustern.cube');
const log=s=>{fs.appendFileSync(LOG,s+'\n');console.log(s);};
fs.writeFileSync(LOG,'=== portrait-build '+new Date().toISOString()+'\n');
let FF='ffmpeg';try{FF=require('ffmpeg-static')||FF;}catch(e){}
const ffOk=(()=>{try{cp.execFileSync(FF,['-version'],{stdio:'pipe'});return true;}catch(e){return false;}})();
log('ffmpeg: '+FF+' ok='+ffOk+' lut='+fs.existsSync(LUT));
let CWD=process.cwd();
const run=(args)=>{const r=cp.spawnSync(FF,['-hide_banner','-loglevel','error','-y',...args],{encoding:'utf8',cwd:CWD});if(r.status!==0)log('  ffmpeg FAIL '+args.join(' ')+'\n'+(r.stderr||''));return r.status===0;};
fs.mkdirSync(INC,{recursive:true});
const dl=path.join(process.env.USERPROFILE||process.env.HOME,'Downloads');
const since=Date.now()-36*3600e3;
for(const f of fs.readdirSync(dl)){if(!/\.(png|jpe?g|mp4|webm)$/i.test(f))continue;const p=path.join(dl,f);const st=fs.statSync(p);if(st.mtimeMs<since)continue;
  const dst=path.join(INC,f);if(!fs.existsSync(dst)||fs.statSync(dst).size!==st.size){fs.copyFileSync(p,dst);log('copied '+f+' ('+Math.round(st.size/1024)+' KB)');}}
/* Masse ermitteln */
const probe=p=>{try{const r=cp.spawnSync(FF.replace(/ffmpeg(\.exe)?$/i,'ffprobe$1'),['-v','error','-select_streams','v:0','-show_entries','stream=width,height,duration','-of','csv=p=0',p],{encoding:'utf8'});return (r.stdout||'').trim();}catch(e){return '';}};
log('--- incoming:');for(const f of fs.readdirSync(INC).sort()){const p=path.join(INC,f);log('  '+f+'  '+Math.round(fs.statSync(p).size/1024)+' KB  '+probe(p)+'  '+fs.statSync(p).mtime.toISOString());}
const mapFile=path.join(__dirname,'portrait-map.json');
if(!fs.existsSync(mapFile)){log('no portrait-map.json → nur gesammelt. Jetzt Bilder sichten und Map schreiben.');process.exit(0);}
if(!ffOk){log('ffmpeg fehlt → npm i ffmpeg-static in core/dev');process.exit(1);}
const map=JSON.parse(fs.readFileSync(mapFile,'utf8'));
const S14P=path.join(FILM,'s14p'),S14=path.join(FILM,'s14'),MP14=path.join(FILM,'mp14'),R14=path.join(FILM,'r14');
[S14P,S14,MP14,R14].forEach(d=>fs.mkdirSync(d,{recursive:true}));
/* ffmpeg-Filterparser stolpert über Leerzeichen/Kyrillisch im Pfad → LUT in ein einfaches Temp-Verzeichnis kopieren */
let lutF='';if(fs.existsSync(LUT)){const dir=require('os').tmpdir();fs.copyFileSync(LUT,path.join(dir,'bs_baustern.cube'));CWD=dir;lutF=',lut3d=bs_baustern.cube:interp=tetrahedral';log('lut via cwd '+dir);}for(const [src,dst] of Object.entries(map)){const inp=path.join(INC,src);if(!fs.existsSync(inp)){log('MISSING '+src);continue;}
  const isVideo=/\.(mp4|webm)$/i.test(src),landscape=/-l$/.test(dst),name=dst.replace(/-l$/,'');
  if(!isVideo){
    if(landscape){run(['-i',inp,'-vf','scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080'+lutF,'-q:v','3',path.join(S14,name+'.jpg')]);
      run(['-i',inp,'-vf','scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720'+lutF,'-q:v','4',path.join(S14,name+'-1280.jpg')]);log('still L '+name);}
    else{run(['-i',inp,'-vf','scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920'+lutF,'-q:v','3',path.join(S14P,name+'.jpg')]);
      run(['-i',inp,'-vf','scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280'+lutF,'-q:v','4',path.join(S14P,name+'-720.jpg')]);log('still P '+name);}
  }else{
    const out=landscape?path.join(R14,name+'.h264.mp4'):path.join(MP14,name+'.mp4');
    const sc=landscape?'scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080':'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920';
    run(['-i',inp,'-an','-vf',sc+lutF+',format=yuv420p','-c:v','libx264','-preset','slow','-crf','20','-profile:v','high','-movflags','+faststart',out]);
    const hold=landscape?path.join(S14,name+'-hold.jpg'):path.join(S14P,name+'-hold.jpg');
    run(['-sseof','-0.08','-i',out,'-frames:v','1','-q:v','2',hold]);
    if(landscape)run(['-i',hold,'-vf','scale=1280:720','-q:v','4',path.join(S14,name+'-hold-1280.jpg')]);
    log('video '+(landscape?'L ':'P ')+name+' + hold');}
}
log('done');
