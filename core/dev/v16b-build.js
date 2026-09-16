/* BauStern v16b — веб-деривативы из СОГЛАСОВАННОЙ цепочки (16.09.2026).
   Отличие от v16-build.js: генерируется только ландшафт (Veo, 6 клипов), портрет получается
   кадрированием из него. Это и вдвое дешевле, и — главное — портрет гарантированно показывает
   ТЕ ЖЕ пиксели, что и ландшафт, поэтому цепочка «комната → проём → следующая комната» не расходится.

   Вход:  core/_incoming/v16b/
            t_<a>-<b>-L.mp4            Veo 3.1 Quality, 8 с, 24 fps, 1080p (16:9)
            wohnen-rohbau-L_2K.jpeg    Rückblende (клипа нет по замыслу)
   Выход: site/img/film/v16/  (та же раскладка, что и раньше — движок не меняется)

   РЕТАЙМИНГ: 8 с/24 fps = 192 кадра. Первые HEAD=0.5 с — статичный холд (так написан промпт).
   Отрезаем их и проигрываем оставшиеся 180 кадров на 60 fps → ровно 3.00 с; setpts*0.4 = 24/60,
   каждый исходный кадр используется ровно один раз → ровная каденция без джаддера.

   ПОРТРЕТ: окно 608x1080 из кадра 1920x1080, затем scale до 1080x1920. Позиция окна по X линейно
   идёт от «своей» точки комнаты отправления к точке комнаты назначения, поэтому первый кадр
   портретного клипа = портретный холд комнаты A, последний = холд комнаты B. Чистая математика,
   никакой второй генерации.

   Запуск: node core/dev/v16b-build.js   (env V16_ONLY=clips|stills|lite|verify) */
const fs=require('fs'),path=require('path'),cp=require('child_process');
const ROOT=path.resolve(__dirname,'..','..');
const INC=path.join(ROOT,'core','_incoming','v16b');
const OUT=path.join(ROOT,'site','img','film','v16');
const FF=path.join(__dirname,'node_modules','ffmpeg-static','ffmpeg.exe');
const TMP=path.join(require('os').tmpdir(),'bs-v16b');
const HEAD=0.5, RATE=0.4, FPS=60, DUR=3.0;
const XF_ST=2.68, XF_D=0.28;                 /* сведение к холду внутри последних 0.28 с */
const PW=608, PH=1080;                       /* портретное окно в исходном кадре 1920x1080 */
/* X-позиция портретного окна для каждой комнаты (левый край, 0..1312).
   Выбрана так, чтобы в кадр попадал и «характер» комнаты, и проём в следующую. */
const PX={ankunft:502,schwelle:760,kueche:600,bad:500,schlaf:500,wohnen:480,'wohnen-rohbau':480,eingang:500};
/* Kontrolliert an den fertigen Standbildern: bei kueche=330 füllte die Badtür das Hochformat
   (der Halt «Küche» zeigte ein Bad), bei bad=800 war die Wanne am linken Rand abgeschnitten. */
const LEGS=[['ankunft','schwelle'],['schwelle','kueche'],['kueche','bad'],['bad','schlaf'],
            ['schlaf','wohnen'],['wohnen','eingang']];
const only=(process.env.V16_ONLY||'').split(',').filter(Boolean);const want=k=>!only.length||only.includes(k);
const LOG=path.join(__dirname,'_v16b-build.log');fs.writeFileSync(LOG,'=== v16b-build '+new Date().toISOString()+'\n');
const log=s=>{fs.appendFileSync(LOG,s+'\n');console.log(s);};
function run(args){const r=cp.spawnSync(FF,['-hide_banner','-loglevel','error','-y',...args],{encoding:'utf8',maxBuffer:1e8});
  if(r.status!==0){log('ffmpeg FAIL '+args.slice(0,14).join(' ')+'\n'+(r.stderr||'').slice(-700));return false;}return true;}
function probe(f){const r=cp.spawnSync(FF,['-hide_banner','-i',f],{encoding:'utf8'});const t=(r.stderr||'');
  const d=t.match(/Duration: (\d+):(\d+):([\d.]+)/),v=t.match(/(\d{3,4})x(\d{3,4})/),fp=t.match(/([\d.]+) fps/);
  return{dur:d?(+d[1]*3600+ +d[2]*60+ +d[3]):0,w:v?+v[1]:0,h:v?+v[2]:0,fps:fp?+fp[1]:0};}
fs.mkdirSync(path.join(OUT,'clips','lite'),{recursive:true});fs.mkdirSync(path.join(OUT,'stills'),{recursive:true});
fs.mkdirSync(TMP,{recursive:true});
const ENC=['-an','-c:v','libx264','-preset','slow','-profile:v','high','-pix_fmt','yuv420p','-movflags','+faststart'];
const srcOf=leg=>path.join(INC,'t_'+leg+'-L.mp4');
const retimeL=`trim=start=${HEAD},setpts=(PTS-STARTPTS)*${RATE},fps=${FPS}`;
/* портретный ретайм: то же + подвижное окно; x идёт от X0 к X1 за DUR секунд */
const retimeP=(x0,x1)=>`${retimeL},crop=${PW}:${PH}:'${x0}+(${x1}-${x0})*min(1\\,t/${DUR})':0,scale=1080:1920`;

/* ---------- шаг 1: холды ---------- */
const HOLD={};
if(want('clips')||want('stills')){
  for(const [a,b] of LEGS){
    const leg=a+'-'+b;
    const src=srcOf(leg);if(!fs.existsSync(src)){log('fehlt: '+src);continue;}
    const hL=path.join(TMP,`hold_${a}-L.jpg`);
    if(run(['-ss',String(HEAD),'-i',src,'-frames:v','1','-q:v','2',hL]))HOLD[a+'-L']=hL;
    const hP=path.join(TMP,`hold_${a}-P.jpg`);
    if(run(['-ss',String(HEAD),'-i',src,'-frames:v','1','-vf',`crop=${PW}:${PH}:${PX[a]}:0,scale=1080:1920`,'-q:v','2',hP]))HOLD[a+'-P']=hP;
    if(b==='eingang'){
      /* Eingang hat keinen ausgehenden Clip. Sein Halt muss exakt der LETZTE Kader des fertigen
         Clips sein — nicht ein per -sseof aus der Quelle gegriffener Kader, sonst springt die
         Ankunft (gemessen: 20 dB statt 45 dB). Wird nach Schritt 2 aus clips/*.last.jpg gesetzt. */
      HOLD[b+'-L']='@last:'+leg+'-L';HOLD[b+'-P']='@last:'+leg+'-P';
    }
  }
  log('holds: '+Object.keys(HOLD).sort().join(', '));
}

/* ---------- шаг 2: клипы ---------- */
if(want('clips')||want('lite')){
  for(const [a,b] of LEGS){
    const leg=a+'-'+b,src=srcOf(leg);if(!fs.existsSync(src))continue;
    for(const o of ['L','P']){
      const id=leg+'-'+o,C=path.join(OUT,'clips'),P=o==='P';
      const base=P?retimeP(PX[a],PX[b]):retimeL;
      const target=HOLD[b+'-'+o];
      if(want('clips')){
        let ok;
        if(target&&b!=='eingang'){
          ok=run(['-i',src,'-loop','1','-i',target,'-filter_complex',
            `[0:v]${base}[v];[1:v]scale=${P?'1080:1920':'1920:1080'},format=yuva420p,fade=t=in:st=${XF_ST}:d=${XF_D}:alpha=1[o];[v][o]overlay=shortest=1:format=auto[out]`,
            '-map','[out]',...ENC,'-crf','19',path.join(C,id+'.fwd.mp4')]);
        } else ok=run(['-i',src,'-vf',base,...ENC,'-crf','19',path.join(C,id+'.fwd.mp4')]);
        if(!ok){log('FAIL clip '+id);continue;}
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
}

/* ---------- шаг 3: стиллы ---------- */
if(want('stills')){
  const srcs=Object.assign({},HOLD);
  /* Rückblende: клипа нет, берём из 2K-исходника (тот же ракурс, что и Wohnen) */
  const rb=fs.readdirSync(INC).find(f=>/^wohnen-rohbau-L_2K\.jpe?g$/.test(f));
  if(rb){srcs['wohnen-rohbau-L']=path.join(INC,rb);srcs['wohnen-rohbau-P']=path.join(INC,rb);}
  for(let [id,src] of Object.entries(srcs)){
    if(typeof src==='string'&&src.startsWith('@last:'))src=path.join(OUT,'clips',src.slice(6)+'.last.jpg');
    if(!fs.existsSync(src)){log('still '+id+': Quelle fehlt '+src);continue;}
    const P=id.endsWith('-P'),W=P?1080:1920,H=P?1920:1080,o=path.join(OUT,'stills',id);
    /* Rohbau-P кадрируется тем же окном, что и Wohnen-P — блёнда Wohnen↔Rohbau остаётся ровной */
    const vf=(id==='wohnen-rohbau-P')
      ? `scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,crop=${PW}:${PH}:${PX['wohnen-rohbau']}:0,scale=1080:1920`
      : `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H}`;
    run(['-i',src,'-vf',vf,'-q:v','2',o+'.jpg']);
    run(['-i',o+'.jpg','-vf',P?'scale=720:1280':'scale=1280:720','-q:v','4',o+'-1280.jpg']);
    run(['-i',o+'.jpg','-vf',P?'scale=720:1280':'scale=1280:720','-c:v','libwebp','-quality','82',o+'.webp']);
    log('still '+id+' ← '+path.basename(src));
  }
}

/* ---------- шаг 4: проверка стыков ---------- */
if(want('verify')||!only.length){
  const psnr=(a,b)=>{const r=cp.spawnSync(FF,['-hide_banner','-i',a,'-i',b,'-lavfi','[0:v]scale=640:-2[x];[1:v]scale=640:-2[y];[x][y]psnr','-f','null','-'],{encoding:'utf8'});
    const m=(r.stderr||'').match(/average:([\d.]+|inf)/);return m?m[1]:'?';};
  const man={fps:FPS,dur:DUR,clips:{},stills:{}};
  for(const [a,b] of LEGS)for(const o of ['L','P']){
    const id=`${a}-${b}-${o}`,C=path.join(OUT,'clips');
    if(!fs.existsSync(path.join(C,id+'.fwd.mp4')))continue;
    const p=probe(path.join(C,id+'.fwd.mp4')),pr=probe(path.join(C,id+'.rev.mp4'));
    const sA=path.join(OUT,'stills',a+'-'+o+'.jpg'),sB=path.join(OUT,'stills',b+'-'+o+'.jpg');
    const dA=psnr(path.join(C,id+'.first.jpg'),sA),dB=psnr(path.join(C,id+'.last.jpg'),sB);
    const lite=path.join(C,'lite',id+'.fwd.mp4');
    man.clips[id]={dur:+p.dur.toFixed(2),w:p.w,h:p.h,fps:p.fps,kb:Math.round(fs.statSync(path.join(C,id+'.fwd.mp4')).size/1024),
      revDur:+pr.dur.toFixed(2),liteKb:fs.existsSync(lite)?Math.round(fs.statSync(lite).size/1024):null,
      psnrFirst:dA,psnrLast:dB};
    log(`stitch ${id}: first↔${a} ${dA} dB | last↔${b} ${dB} dB | fwd ${p.dur.toFixed(2)}s rev ${pr.dur.toFixed(2)}s`);
  }
  for(const f of fs.readdirSync(path.join(OUT,'stills')).filter(f=>/^[a-z-]+-[LP]\.jpg$/.test(f))){
    const p=probe(path.join(OUT,'stills',f));man.stills[f.replace('.jpg','')]={w:p.w,h:p.h};}
  fs.writeFileSync(path.join(OUT,'manifest.json'),JSON.stringify(man,null,1));
  log('manifest.json ok');
}
log('done');
