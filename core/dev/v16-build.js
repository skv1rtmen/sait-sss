/* BauStern v16 — веб-деривативы для движка B (видео-пролёты + 2.5D-холды).
   Вход:  core/_incoming/v16/  t_<a>-<b>-<L|P>_1080p_*.mp4 (Veo, 8 с, 24 fps) и <room>-<L|P>_2K_*.jpeg
   Выход: site/img/film/v16/
     clips/<id>.fwd.mp4        3.00 с, 60 fps, h264 crf19, faststart, без звука      (основной tier)
     clips/<id>.rev.mp4        точная обратная пара (reverse от ретаймленного fwd)
     clips/lite/<id>.fwd.mp4   720p crf23 — лёгкий tier (saveData / медленная сеть)
     clips/lite/<id>.rev.mp4
     clips/<id>.first.jpg / .last.jpg   кадры стыка (постеры)
     stills/<room>-<L|P>.jpg (1920x1080 / 1080x1920) + -1280.jpg + .webp
     manifest.json             длительности, размеры, веса — для движка и для проверок

   РЕТАЙМИНГ (важно): исходник 8 с/24 fps = 192 кадра. Первые ~0.5 с — статичный холд (так был написан промпт).
   Отрезаем HEAD=0.5 с (12 кадров) и проигрываем оставшиеся 180 кадров на 60 fps → ровно 3.00 с.
   setpts*0.4 = 24/60: КАЖДЫЙ исходный кадр используется ровно один раз, без дублей и без выброса →
   ровная каденция, нет джаддера. Последний кадр сохраняется → стык с холдом следующей комнаты точный.
   rev делается из уже ретаймленного fwd (-vf reverse) → гарантированно та же длительность, fps и обратный
   порядок тех же кадров (требование «fwd/rev — согласованная пара»).

   Запуск: node core/dev/v16-build.js   (env V16_ONLY=clips|stills|lite|verify, через запятую) */
const fs=require('fs'),path=require('path'),cp=require('child_process');
const ROOT=path.resolve(__dirname,'..','..');
const INC=path.join(ROOT,'core','_incoming','v16');
const OUT=path.join(ROOT,'site','img','film','v16');
const FF=path.join(__dirname,'node_modules','ffmpeg-static','ffmpeg.exe');
const TMP=path.join(require('os').tmpdir(),'bs-v16');
const HEAD=0.5, RATE=0.4, FPS=60;            /* 0.5 c обрезки, 24→60 fps, итог 3.00 с */
const XF_ST=2.68, XF_D=0.28;                 /* сведение к холду внутри последних 0.28 с клипа */
/* Кто с кем: clip id -> [комната первого кадра, комната последнего кадра].
   Холд комнаты = ПЕРВЫЙ кадр её исходящего клипа → отправление пиксель-в-пиксель.
   Прибытие делаем точным, запекая в конец клипа сведение к холду комнаты назначения. */
const LINK={'ankunft-schwelle':['ankunft','schwelle'],'schwelle-kueche':['schwelle','kueche'],
  'kueche-bad':['kueche','bad'],'bad-schlaf':['bad','schlaf'],'schlaf-wohnen':['schlaf','wohnen'],
  'wohnen-eingang':['wohnen','eingang']};
const only=(process.env.V16_ONLY||'').split(',').filter(Boolean);const want=k=>!only.length||only.includes(k);
const LOG=path.join(__dirname,'_v16-build.log');fs.writeFileSync(LOG,'=== v16-build '+new Date().toISOString()+'\n');
const log=s=>{fs.appendFileSync(LOG,s+'\n');console.log(s);};
function run(args){const r=cp.spawnSync(FF,['-hide_banner','-loglevel','error','-y',...args],{encoding:'utf8',maxBuffer:1e8});
  if(r.status!==0){log('ffmpeg FAIL '+args.join(' ')+'\n'+(r.stderr||'').slice(-700));return false;}return true;}
function probe(f){const r=cp.spawnSync(FF,['-hide_banner','-i',f],{encoding:'utf8'});const t=(r.stderr||'');
  const d=t.match(/Duration: (\d+):(\d+):([\d.]+)/),v=t.match(/(\d{3,4})x(\d{3,4})/),fp=t.match(/([\d.]+) fps/);
  return{dur:d?(+d[1]*3600+ +d[2]*60+ +d[3]):0,w:v?+v[1]:0,h:v?+v[2]:0,fps:fp?+fp[1]:0};}
fs.mkdirSync(path.join(OUT,'clips','lite'),{recursive:true});fs.mkdirSync(path.join(OUT,'stills'),{recursive:true});
fs.mkdirSync(TMP,{recursive:true});
const files=fs.readdirSync(INC);
const ENC=['-an','-c:v','libx264','-preset','slow','-profile:v','high','-pix_fmt','yuv420p','-movflags','+faststart'];
const clipIds=[];

/* ---- шаг 1: холды из исходных клипов (первый кадр после обрезки = холд комнаты отправления) ---- */
const HOLD={};                                  /* 'schwelle-L' -> путь к jpg */
if(want('clips')||want('stills')){
  for(const f of files.filter(f=>/^t_.*\.mp4$/.test(f))){
    const m=f.match(/^t_([a-z]+)-([a-z]+)-([LP])_/);if(!m)continue;
    const [a,b]=LINK[m[1]+'-'+m[2]]||[];if(!a)continue;const o=m[3];
    const src=path.join(INC,f);
    const hA=path.join(TMP,`hold_${a}-${o}.jpg`);
    if(run(['-ss',String(HEAD),'-i',src,'-frames:v','1','-q:v','2',hA]))HOLD[a+'-'+o]=hA;
    if(b==='eingang'){const hB=path.join(TMP,`hold_${b}-${o}.jpg`);
      if(run(['-sseof','-0.05','-i',src,'-frames:v','1','-q:v','2',hB]))HOLD[b+'-'+o]=hB;}
  }
  log('holds: '+Object.keys(HOLD).sort().join(', '));
}

if(want('clips')||want('lite')){
  for(const f of files.filter(f=>/^t_.*\.mp4$/.test(f)).sort()){
    const m=f.match(/^t_([a-z]+)-([a-z]+)-([LP])_/);if(!m)continue;
    const id=`${m[1]}-${m[2]}-${m[3]}`,P=m[3]==='P',o=m[3];clipIds.push(id);
    const src=path.join(INC,f),C=path.join(OUT,'clips');
    const [ra,rb]=LINK[m[1]+'-'+m[2]]||[];
    const target=HOLD[rb+'-'+o];                /* холд комнаты назначения */
    if(want('clips')){
      const base=`trim=start=${HEAD},setpts=(PTS-STARTPTS)*${RATE},fps=${FPS}`;
      let ok;
      if(target&&rb!=='eingang'){
        /* fwd: ретайм + сведение последних 0.28 с к точному холду назначения (прибытие без скачка) */
        ok=run(['-i',src,'-loop','1','-i',target,'-filter_complex',
          `[0:v]${base}[v];[1:v]scale=${P?'1080:1920':'1920:1080'},format=yuva420p,fade=t=in:st=${XF_ST}:d=${XF_D}:alpha=1[o];[v][o]overlay=shortest=1:format=auto[out]`,
          '-map','[out]',...ENC,'-crf','19',path.join(C,id+'.fwd.mp4')]);
      } else ok=run(['-i',src,'-vf',base,...ENC,'-crf','19',path.join(C,id+'.fwd.mp4')]);
      if(!ok)continue;
      /* rev: реверс УЖЕ готового fwd → точная пара (та же длительность, fps, обратный порядок тех же кадров) */
      run(['-i',path.join(C,id+'.fwd.mp4'),'-vf','reverse',...ENC,'-crf','19',path.join(C,id+'.rev.mp4')]);
      run(['-i',path.join(C,id+'.fwd.mp4'),'-frames:v','1','-q:v','2',path.join(C,id+'.first.jpg')]);
      run(['-sseof','-0.04','-i',path.join(C,id+'.fwd.mp4'),'-frames:v','1','-q:v','2',path.join(C,id+'.last.jpg')]);
    }
    if(want('lite')){
      const sc=P?'scale=720:1280':'scale=1280:720';
      run(['-i',path.join(C,id+'.fwd.mp4'),'-vf',sc,...ENC,'-crf','23',path.join(C,'lite',id+'.fwd.mp4')]);
      run(['-i',path.join(C,id+'.rev.mp4'),'-vf',sc,...ENC,'-crf','23',path.join(C,'lite',id+'.rev.mp4')]);
    }
    const p=probe(path.join(C,id+'.fwd.mp4'));
    log(`clip ${id}  ${p.dur.toFixed(2)}s ${p.w}x${p.h} ${p.fps}fps  ${Math.round(fs.statSync(path.join(C,id+'.fwd.mp4')).size/1024)}k`);
  }
}

if(want('stills')){
  /* Холды 7 комнат приходят из клипов (HOLD) — так стык точный. Из 2K-исходника берётся только
     Rückblende (rohbau): у неё по замыслу нет клипа, обе стороны — короткая блёнда. */
  const srcs=Object.assign({},HOLD);
  for(const f of files.filter(f=>/\.jpe?g$/.test(f))){const m=f.match(/^(wohnen-rohbau)-([LP])_2K_/);if(m)srcs[m[1]+'-'+m[2]]=path.join(INC,f);}
  for(const [id,src] of Object.entries(srcs)){
    const P=id.endsWith('-P'),W=P?1080:1920,H=P?1920:1080,o=path.join(OUT,'stills',id);
    run(['-i',src,'-vf',`scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H}`,'-q:v','2',o+'.jpg']);
    run(['-i',o+'.jpg','-vf',P?'scale=720:1280':'scale=1280:720','-q:v','4',o+'-1280.jpg']);
    run(['-i',o+'.jpg','-vf',P?'scale=720:1280':'scale=1280:720','-c:v','libwebp','-quality','82',o+'.webp']);
    log('still '+id+' ← '+path.basename(src));
  }
}

/* ---- verify: стыки клип↔холд (PSNR) + манифест ---- */
if(want('verify')||!only.length){
  const CH=Object.values(LINK);
  const psnr=(a,b)=>{const r=cp.spawnSync(FF,['-hide_banner','-i',a,'-i',b,'-lavfi','[0:v]scale=640:-2[x];[1:v]scale=640:-2[y];[x][y]psnr','-f','null','-'],{encoding:'utf8'});
    const m=(r.stderr||'').match(/average:([\d.]+|inf)/);return m?m[1]:'?';};
  const man={fps:FPS,dur:0,clips:{},stills:{}};
  for(const [a,b] of CH)for(const o of ['L','P']){
    const id=`${a}-${b}-${o}`,C=path.join(OUT,'clips');
    if(!fs.existsSync(path.join(C,id+'.fwd.mp4')))continue;
    const p=probe(path.join(C,id+'.fwd.mp4')),pr=probe(path.join(C,id+'.rev.mp4'));man.dur=+p.dur.toFixed(2);
    const sA=path.join(OUT,'stills',a+'-'+o+'.jpg'),sB=path.join(OUT,'stills',b+'-'+o+'.jpg');
    const dA=psnr(path.join(C,id+'.first.jpg'),sA),dB=psnr(path.join(C,id+'.last.jpg'),sB);
    const lite=path.join(C,'lite',id+'.fwd.mp4');
    man.clips[id]={dur:+p.dur.toFixed(2),w:p.w,h:p.h,fps:p.fps,kb:Math.round(fs.statSync(path.join(C,id+'.fwd.mp4')).size/1024),
      revDur:+pr.dur.toFixed(2),liteKb:fs.existsSync(lite)?Math.round(fs.statSync(lite).size/1024):null};
    log(`stitch ${id}: first↔${a} PSNR ${dA} dB | last↔${b} PSNR ${dB} dB | fwd ${p.dur.toFixed(2)}s rev ${pr.dur.toFixed(2)}s`);
  }
  for(const f of fs.readdirSync(path.join(OUT,'stills')).filter(f=>/^[a-z-]+-[LP]\.jpg$/.test(f))){
    const p=probe(path.join(OUT,'stills',f));man.stills[f.replace('.jpg','')]={w:p.w,h:p.h};}
  fs.writeFileSync(path.join(OUT,'manifest.json'),JSON.stringify(man,null,1));
  log('manifest.json ok');
}
log('done');
