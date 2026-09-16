/* Mechanical CSS migration: retain non-hover branches of combined selectors. */
const fs=require('fs'),path=require('path'),postcss=require('postcss');
let count=0;
for(const name of ['site.css','lightbox.css']){
 const file=path.resolve(__dirname,'../../site/css',name),root=postcss.parse(fs.readFileSync(file,'utf8'),{from:file});
 const rules=[];root.walkRules(rule=>{if(rule.selector.includes(':hover'))rules.push(rule);});
 for(const rule of rules){
  let scoped=false;for(let p=rule.parent;p;p=p.parent)if(p.type==='atrule'&&p.name==='media'&&/hover\s*:\s*hover/.test(p.params)&&/pointer\s*:\s*fine/.test(p.params))scoped=true;
  if(scoped)continue;
  const sels=postcss.list.comma(rule.selector),hover=sels.filter(s=>s.includes(':hover')),plain=sels.filter(s=>!s.includes(':hover'));
  const media=postcss.atRule({name:'media',params:'(hover: hover) and (pointer: fine)'});media.append(rule.clone({selector:hover.join(',')}));rule.after(media);
  if(plain.length)rule.selector=plain.join(',');else rule.remove();count++;
 }
 fs.writeFileSync(file,root.toString());
}
console.log(`Scoped ${count} hover rules; active/focus branches retained.`);
