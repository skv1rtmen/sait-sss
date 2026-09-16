// Neue versionierte Dateien; veröffentlichte immutable Assets bleiben unverändert.
const fs=require('fs'),path=require('path'),{spawnSync}=require('child_process');
const root=path.resolve(__dirname,'../..'),film=path.join(root,'site/img/film');
const exe=process.env.FFMPEG;if(!exe)throw Error('FFMPEG must point to ffmpeg.exe');
const phase=process.argv[2]||'all';
const grade='eq=brightness=0.025:saturation=1.14:gamma=1.035,unsharp=5:5:0.40:5:5:0';
const clips=['c1-kueche','c2-flur','c3-bad','c4-schlaf','c5-wohnen','c6-eingang'];
const run=args=>{const r=spawnSync(exe,['-hide_banner','-loglevel','error','-y',...args],{encoding:'utf8',maxBuffer:4e6});if(r.status!==0)throw Error(r.stderr);};
const dir=name=>{const d=path.join(film,name);fs.mkdirSync(d,{recursive:true});return d;};
const photo=(input,output,filter,extra=[])=>run(['-i',input,...extra,'-vf',filter,'-frames:v','1','-threads','2',...(output.endsWith('.webp')?['-c:v','libwebp','-quality','94']:['-q:v','2']),output]);
if(phase==='all'||phase==='frames'){
 const still=dir('s13');
 for(let i=0;i<clips.length;i++){
  const input=path.join(root,'_work-rife/master',clips[i]+'.lut.mov');
  for(const [folder,w,q]of [['f13',1280,87],['f13h',1920,91],['f13l',960,80]]){
   const output=dir(folder);run(['-i',input,'-vf',`fps=12,${grade},scale=${w}:-2:flags=lanczos`,'-frames:v','96','-c:v','libwebp','-quality',String(q),'-compression_level','4','-threads','2','-start_number',String(i*96),path.join(output,'f%04d.webp')]);
  }
  const scene=i<5?i:6,segment=path.join(root,'_work-rife/seg',i===0?'intro-ref.mov':clips[i]+'.fwd.mov');
  for(const [suffix,filter]of [['.jpg',`${grade},scale=1920:1080:flags=lanczos`],['-1280.jpg',`${grade},scale=1280:720:flags=lanczos`],['-p.webp',`${grade},crop=608:1080:(iw-608)/2:0,scale=720:1280:flags=lanczos`]]){
   run(['-sseof','-0.018','-i',segment,'-vf',filter,'-frames:v','1','-threads','2',...(suffix.endsWith('.webp')?['-c:v','libwebp','-quality','94']:['-q:v','2']),path.join(still,'st'+scene+suffix)]);
  }
  console.log('FRAMES '+clips[i]);
 }
 const mat=path.join(film,'mat2');
 for(const [name,source]of [['st5','before.webp'],['st-flash-after','after.webp']]){
  photo(path.join(mat,source),path.join(still,name+'.jpg'),'scale=1920:1080:flags=lanczos');
  photo(path.join(mat,source),path.join(still,name+'-1280.jpg'),'scale=1280:720:flags=lanczos');
  photo(path.join(mat,source),path.join(still,name+'-p.webp'),'crop=ih*9/16:ih:(iw-ih*9/16)/2:0,scale=720:1280:flags=lanczos');
 }
 photo(path.join(root,'_work-rife/seg/intro-ref.mov'),path.join(film,'poster-v13.jpg'),grade);
 fs.copyFileSync(path.join(still,'st0.jpg'),path.join(film,'intro-hold-v13.jpg'));
}
if(phase==='all'||phase==='video'){
 const desktop=dir('r13'),mobile=dir('m3'),portrait=dir('m3p');
 const inputs=['intro',...clips.slice(1).flatMap(c=>[c+'.fwd',c+'.rev'])];
 for(const name of inputs){const input=path.join(root,'_work-rife/seg',name==='intro'?'intro-ref.mov':name+'.mov');
  const h264=path.join(desktop,name+'.h264.mp4');
  run(['-i',input,'-vf',grade,'-c:v','libx264','-threads','2','-preset','slow','-crf','18','-profile:v','high','-level:v','4.2','-pix_fmt','yuv420p','-g','60','-keyint_min','60','-sc_threshold','0','-movflags','+faststart','-an',h264]);
  fs.copyFileSync(h264,path.join(mobile,name+'.mp4'));
  run(['-i',input,'-vf',grade,'-c:v','libsvtav1','-preset','6','-crf','22','-svtav1-params','lp=2:film-grain=0','-pix_fmt','yuv420p10le','-g','60','-movflags','+faststart','-an',path.join(desktop,name+'.av1.mp4')]);
  run(['-i',input,'-vf',`${grade},crop=608:1080:(iw-608)/2:0,scale=720:1280:flags=lanczos,setsar=1`,'-c:v','libx264','-threads','2','-preset','slow','-crf','20','-profile:v','main','-level:v','3.2','-pix_fmt','yuv420p','-g','60','-keyint_min','60','-sc_threshold','0','-movflags','+faststart','-an',path.join(portrait,name+'.mp4')]);
  console.log('VIDEO '+name);
 }
}
const report={grade,phase,source:'Existing 1080p60 RIFE masters; original generated video was 720p. Encoding does not create true 4K detail.',folders:{}};
if(phase==='compat'){
 const still=dir('s13');for(let i=0;i<7;i++)photo(path.join(still,'st'+i+'.jpg'),path.join(still,'st'+i+'-p.jpg'),'crop=ih*9/16:ih:(iw-ih*9/16)/2:0,scale=720:1280:flags=lanczos');
 run(['-i',path.join(root,'_work-rife/seg/intro-ref.mov'),'-vf',grade,'-c:v','libx265','-preset','medium','-crf','20','-x265-params','pools=2:frame-threads=2:log-level=error','-pix_fmt','yuv420p','-tag:v','hvc1','-movflags','+faststart','-an',path.join(dir('r13'),'intro.hevc.mp4')]);console.log('COMPAT PASS');
}
if(phase==='eco'){
 const landscape=dir('m3l'),portrait=dir('m3lp');
 for(const name of ['intro',...clips.slice(1).flatMap(c=>[c+'.fwd',c+'.rev'])]){const input=path.join(root,'_work-rife/seg',name==='intro'?'intro-ref.mov':name+'.mov');
  for(const [folder,filter]of [[landscape,`${grade},fps=30,scale=1280:720:flags=lanczos`],[portrait,`${grade},fps=30,crop=608:1080:(iw-608)/2:0,scale=540:960:flags=lanczos,setsar=1`]])run(['-i',input,'-vf',filter,'-c:v','libx264','-threads','2','-preset','slow','-crf','25','-profile:v','main','-level:v','3.1','-pix_fmt','yuv420p','-g','30','-keyint_min','30','-sc_threshold','0','-movflags','+faststart','-an',path.join(folder,name+'.mp4')]);
  console.log('ECO '+name);
 }
}
for(const name of ['f13','f13h','f13l','s13','r13','m3','m3p','m3l','m3lp']){const d=path.join(film,name);if(fs.existsSync(d)){const files=fs.readdirSync(d);report.folders[name]={files:files.length,bytes:files.reduce((n,f)=>n+fs.statSync(path.join(d,f)).size,0)};}}
fs.writeFileSync(path.join(__dirname,'reports','visual-v13-assets-'+phase+'.json'),JSON.stringify(report,null,2));
