/* Statische Schlüsselzustände aus dem bisherigen Renderer; Laufzeit zeigt nur zwei fertige Bilder. */
const {chromium}=require('playwright'),sharp=require('sharp'),fs=require('fs'),path=require('path');
const phases=[0,.15,.30,.50,.65,.84,1];
(async()=>{const b=await chromium.launch();try{const p=await b.newPage({reducedMotion:'reduce'});await p.goto('http://localhost:8099');const out=path.resolve(__dirname,'../../site/img/film/mat5');fs.mkdirSync(out,{recursive:true});
 await p.evaluate(async()=>{window.__bakeM=FilmFX.Materialize({...FILM.scenes[5].mat,w:1920,h:1071});await __bakeM.load();window.__bakeCv=document.createElement('canvas');__bakeCv.width=1920;__bakeCv.height=1071;});
 for(let i=0;i<phases.length;i++){const data=await p.evaluate(x=>{__bakeM.render(__bakeCv,__bakeCv.getContext('2d'),x,{mode:'B+'});return __bakeCv.toDataURL('image/png').split(',')[1];},phases[i]);const file=path.join(out,`step${i}.webp`);await sharp(Buffer.from(data,'base64')).webp({quality:94}).toFile(file);console.log(i,phases[i],fs.statSync(file).size);}
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
