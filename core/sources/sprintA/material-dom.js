/* Maskierte Ebenen einmalig in nativer Auflösung erzeugen, nicht pro Scroll-Frame. */
const path=require('path'),fs=require('fs');
const sharp=require(path.resolve(__dirname,'../../dev/node_modules/sharp'));
const root=path.resolve(__dirname,'../../../site/img/film'),src=path.join(root,'mat2'),out=path.join(root,'mat3');
(async()=>{fs.mkdirSync(out,{recursive:true});for(const [name,image,mask] of [['walls','flat.webp','m-walls.webp'],['light','flat.webp','m-light.webp'],['floor','flat.webp','m-floor.webp'],['furniture','flat-full.webp','m-furniture.webp']]){
 const file=path.join(out,name+'.webp');await sharp(path.join(src,image)).ensureAlpha().composite([{input:path.join(src,mask),blend:'dest-in'}]).webp({quality:92,alphaQuality:100}).toFile(file);console.log(name,fs.statSync(file).size);
}})().catch(e=>{console.error(e);process.exitCode=1;});
