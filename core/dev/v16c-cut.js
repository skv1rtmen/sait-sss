/* BauStern v16c — «проезд без выдумки».
   Veo получает только два 2D-кадра и не знает геометрии между ними. Когда расстояние большое,
   он ЗАПОЛНЯЕТ середину выдуманным помещением: в schwelle→kueche полторы секунды показывается
   чужая кухня с верхними шкафами и духовкой, в ankunft→schwelle — несуществующий тамбур.
   Первый и последний кадры при этом идеальные — поэтому проверка по стыкам (PSNR 42–48 dB)
   этого не поймала.

   Здесь исходный 8-секундный клип режется на три части:
     [0.5 … t1]  честный отъезд из комнаты A  — обычная скорость
     [t1 … t2]   выдуманная середина          — разгон в RAMP раз, проносится за ~0.2 с
     [t2 … 8.0]  честное прибытие в комнату B — обычная скорость
   Получается «проход через дверь» одним движением: разогнались у проёма, прошли, затормозили.
   Читаемого вранья на экране нет — оно проскакивает быстрее, чем глаз успевает его прочесть.

   Границы t1/t2 сняты покадрово с готовых клипов (см. core/dev/_frames/_all.png), в секундах ИСХОДНИКА.
   Пересчёт из времени старого выхода: src = 0.5 + out * 2.5.

   Запуск: node core/dev/v16c-cut.js */
const fs=require('fs'),path=require('path'),cp=require('child_process');
const ROOT=path.resolve(__dirname,'..','..');
const INC=path.join(ROOT,'core','_incoming','v16b');
const OUT=path.join(ROOT,'site','img','film','v16');
const FF=path.join(__dirname,'node_modules','ffmpeg-static','ffmpeg.exe');
const TMP=path.join(require('os').tmpdir(),'bs-v16c');
const FPS=60, RATE=0.4;                 /* 24 → 60 fps, каждый исходный кадр ровно один раз */
const RAMP=8;                           /* во столько раз ускоряется выдуманная середина */
const XF_D=0.22;                        /* сведение к холду назначения в конце */
const PW=608, PH=1080;
const PX={ankunft:502,schwelle:760,kueche:600,bad:500,schlaf:500,wohnen:480,'wohnen-rohbau':480,eingang:500};
/* leg -> [t1, t2] в секундах исходника: где начинается и кончается выдуманная середина */
const CUT={
  'ankunft-schwelle':[3.13,5.38],
  /* Schwelle→Küche neu generiert (2. Anlauf, Prompt beschreibt die Zielküche explizit und verbietet
     Oberschränke/Backofen): der Clip ist von Anfang bis Ende ehrlich → kein Durchreissen nötig. */
  'schwelle-kueche' :null,
  'kueche-bad'      :[2.75,5.38],
  'bad-schlaf'      :[2.75,4.75],
  'schlaf-wohnen'   :[2.75,4.75],
  'wohnen-eingang'  :[3.13,4.75],
};
const LEGS=Object.keys(CUT).map(k=>[k.split('-')[0],k.split('-').slice(1).join('-'),k]);
const LOG=path.join(__dirname,'_v16c.log');fs.writeFileSync(LOG,'=== v16c '+new Date().toISOString()+'\n');
const log=s=>{fs.appendFileSync(LOG,s+'\n');console.log(s);};
function run(args){const r=cp.spawnSync(FF,['-hide_banner','-loglevel','error','-y',...args],{encoding:'utf8',maxBuffer:1e8});
  if(r.status!==0){log('ffmpeg FAIL '+args.slice(0,12).join(' ')+'\n'+(r.stderr||'').slice(-600));return false;}return true;}
function probe(f){const r=cp.spawnSync(FF,['-hide_banner','-i',f],{encoding:'utf8'});const t=r.stderr||'';
  const d=t.match(/Duration: (\d+):(\d+):([\d.]+)/),v=t.match(/(\d{3,4})x(\d{3,4})/),fp=t.match(/([\d.]+) fps/);
  return{dur:d?(+d[1]*3600+ +d[2]*60+ +d[3]):0,w:v?+v[1]:0,h:v?+v[2]:0,fps:fp?+fp[1]:0};}
fs.mkdirSync(TMP,{recursive:true});
const ENC=['-an','-c:v','libx264','-preset','slow','-profile:v','high','-pix_fmt','yuv420p','-movflags','+faststart'];
const only=(process.env.ONLY||'').split(',').filter(Boolean);

/* Кусок исходника с собственным темпом. mb = лёгкое смазывание для разогнанной части. */
function seg(src,a,b,rate,outFile,port,px0,px1,t0,t1,blur){
  const crop=port?`,crop=${PW}:${PH}:'${px0}+(${px1}-${px0})*min(1\\,max(0\\,(t-${t0})/${t1-t0}))':0,scale=1080:1920`:'';
  /* Beim Durchreissen werden je 5 Quellkader gemittelt: aus dem erfundenen Zwischenraum wird eine
     Bewegungsunschärfe. Man sieht «schnell durch die Tür», nicht ein zweites, falsches Zimmer. */
  const mb=blur?'tmix=frames=5:weights=\'1 1 1 1 1\',':'';
  const vf=`trim=start=${a}:end=${b},setpts=(PTS-STARTPTS)*${rate},${mb}fps=${FPS}${crop}`;
  return run(['-i',src,'-vf',vf,...ENC,'-crf','18',outFile]);
}

for(const [A,B,leg] of LEGS){
  if(only.length&&!only.includes(leg))continue;
  const src=path.join(INC,'t_'+leg+'-L.mp4');
  if(!fs.existsSync(src)){log('fehlt '+src);continue;}
  const cut=CUT[leg];
  const [t1,t2]=cut||[8.0,8.0];
  for(const o of ['L','P']){
    const port=o==='P',id=leg+'-'+o;
    /* Доли выходного времени, чтобы вести окно портрета непрерывно через все три куска */
    const oh=(t1-0.5)*RATE, om=(t2-t1)*RATE/RAMP, ot=(8.0-t2)*RATE, tot=oh+om+ot;
    const x0=PX[A],x1=PX[B];
    const xa=x0, xb=x0+(x1-x0)*(oh/tot), xc=x0+(x1-x0)*((oh+om)/tot);
    const f1=path.join(TMP,id+'_1.mp4'),f2=path.join(TMP,id+'_2.mp4'),f3=path.join(TMP,id+'_3.mp4');
    const joined=path.join(TMP,id+'_j.mp4');
    if(!cut){
      /* ehrlicher Clip: ein Stück, 24 → 60 fps, jeder Quellkader genau einmal */
      if(!seg(src,0.5,8.0,RATE,joined,port,x0,x1,0,(8.0-0.5)*RATE,false))continue;
    } else {
      if(!seg(src,0.5,t1,RATE,f1,port,xa,xb,0,oh,false))continue;
      if(!seg(src,t1,t2,RATE/RAMP,f2,port,xb,xc,0,om,true))continue;
      const parts=[f1,f2];
      if(ot>0.05){if(!seg(src,t2,8.0,RATE,f3,port,xc,x1,0,ot,false))continue;parts.push(f3);}
      const lst=path.join(TMP,id+'.txt');
      fs.writeFileSync(lst,parts.map(f=>"file '"+f.replace(/\\/g,'/')+"'").join('\n')+'\n');
      if(!run(['-f','concat','-safe','0','-i',lst,'-c','copy',joined]))continue;
    }
    /* сведение к холду назначения в самом конце (прибытие без скачка) */
    const hold=path.join(OUT,'stills',B+'-'+o+'.jpg');
    /* Die Blende muss VOR dem Ende fertig sein: die letzten 0.08 s sind dann exakt das Standbild.
       Sonst endet der Clip bei ~85 % Deckkraft und die Ankunft springt (gemessen: 26 statt 45 dB). */
    const d=probe(joined).dur, st=Math.max(0,d-XF_D-0.08);
    const dst=path.join(OUT,'clips',id+'.fwd.mp4');
    let ok;
    if(fs.existsSync(hold)){
      ok=run(['-i',joined,'-loop','1','-i',hold,'-filter_complex',
        `[1:v]scale=${port?'1080:1920':'1920:1080'},format=yuva420p,fade=t=in:st=${st.toFixed(2)}:d=${XF_D}:alpha=1[o];[0:v][o]overlay=shortest=1:format=auto[out]`,
        '-map','[out]',...ENC,'-crf','19',dst]);
    } else ok=run(['-i',joined,'-c','copy',dst]);
    if(!ok)continue;
    run(['-i',dst,'-vf','reverse',...ENC,'-crf','19',path.join(OUT,'clips',id+'.rev.mp4')]);
    run(['-i',dst,'-frames:v','1','-q:v','2',path.join(OUT,'clips',id+'.first.jpg')]);
    run(['-sseof','-0.04','-i',dst,'-frames:v','1','-q:v','2',path.join(OUT,'clips',id+'.last.jpg')]);
    const sc=port?'scale=720:1280':'scale=1280:720';
    run(['-i',dst,'-vf',sc,...ENC,'-crf','23',path.join(OUT,'clips','lite',id+'.fwd.mp4')]);
    run(['-i',path.join(OUT,'clips',id+'.rev.mp4'),'-vf',sc,...ENC,'-crf','23',path.join(OUT,'clips','lite',id+'.rev.mp4')]);
    const p=probe(dst);
    log(`${id}  ${p.dur.toFixed(2)}s  ${p.w}x${p.h} ${p.fps}fps  ${Math.round(fs.statSync(dst).size/1024)}k  (kopf ${oh.toFixed(2)} + sprung ${om.toFixed(2)} + ankunft ${ot.toFixed(2)})`);
  }
}
log('done');
