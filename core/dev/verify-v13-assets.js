const fs=require('fs'),path=require('path'),{spawnSync}=require('child_process'),assert=require('assert/strict');
const root=path.resolve(__dirname,'../../site/img/film'),exe=process.env.FFMPEG,probe=exe?.replace(/ffmpeg\.exe$/i,'ffprobe.exe');assert(exe,'FFMPEG required');const rows=[];
for(const [folder,fps,w,h,count]of [['r13',60,1920,1080,23],['m3',60,1920,1080,11],['m3p',60,720,1280,11],['m3l',30,1280,720,11],['m3lp',30,540,960,11]]){
 const files=fs.readdirSync(path.join(root,folder)).filter(f=>f.endsWith('.mp4'));assert.equal(files.length,count);
 for(const file of files){const p=path.join(root,folder,file),r=spawnSync(probe,['-v','error','-select_streams','v:0','-show_entries','stream=width,height,r_frame_rate,codec_name,profile:format=duration','-of','json',p],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);const data=JSON.parse(r.stdout),v=data.streams[0];assert.equal(v.width,w);assert.equal(v.height,h);assert.equal(v.r_frame_rate,fps+'/1');
 const decoded=spawnSync(exe,['-v','error','-xerror','-threads','2','-i',p,'-f','null','-'],{encoding:'utf8'});assert.equal(decoded.status,0,decoded.stderr);assert.equal(decoded.stderr,'');rows.push({file:folder+'/'+file,...v,duration:+data.format.duration,bytes:fs.statSync(p).size,decode:true});}
 console.log('MEDIA PASS '+folder);
}
fs.writeFileSync('reports/v13-media-validation.json',JSON.stringify({rows,passed:true,files:rows.length},null,2));
