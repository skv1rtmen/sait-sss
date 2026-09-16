/* Reproducible lint for this vanilla site: JS syntax, CSS grammar, hover scope and shell assets. */
const fs=require('fs'),path=require('path'),vm=require('vm'),postcss=require('postcss'),{JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'../../site'),errors=[];let js=0,css=0;
for(const file of fs.readdirSync(path.join(root,'js')).filter(x=>x.endsWith('.js'))){try{new vm.Script(fs.readFileSync(path.join(root,'js',file),'utf8'),{filename:file});js++;}catch(e){errors.push(e.message);}}
for(const file of fs.readdirSync(path.join(root,'css')).filter(x=>x.endsWith('.css'))){try{const tree=postcss.parse(fs.readFileSync(path.join(root,'css',file),'utf8'),{from:file});css++;
 tree.walkRules(rule=>{if(!rule.selector.includes(':hover'))return;let scoped=false;for(let p=rule.parent;p;p=p.parent)if(p.type==='atrule'&&p.name==='media'&&/hover\s*:\s*hover/.test(p.params)&&/pointer\s*:\s*fine/.test(p.params))scoped=true;if(!scoped)errors.push(file+': unscoped hover '+rule.selector);});
}catch(e){errors.push(e.message);}}
const dom=new JSDOM(fs.readFileSync(path.join(root,'index.html'),'utf8')),d=dom.window.document;
for(const e of d.querySelectorAll('script[src],link[rel=stylesheet]')){const u=e.getAttribute('src')||e.getAttribute('href');if(!/^(https?:|data:)/.test(u)&&!fs.existsSync(path.join(root,u)))errors.push('Missing shell asset '+u);}
for(const s of ['width=device-width','initial-scale=1','viewport-fit=cover'])if(!d.querySelector('meta[name=viewport]')?.content.includes(s))errors.push('Viewport missing '+s);
if(![...d.scripts].some(s=>s.textContent.includes('interactive-widget=resizes-content')&&s.textContent.includes('navigator.userAgent')))errors.push('Missing Chromium keyboard viewport enhancement');
if(d.querySelector('body link[rel=stylesheet]'))errors.push('Render-blocking stylesheet outside head');
for(const dir of ['m1','m1p','m2','m2p','m3','m3p','m3l','m3lp']){const movies=fs.readdirSync(path.join(root,'img/film',dir)).filter(n=>n.endsWith('.mp4'));if(movies.length!==11)errors.push(dir+': expected 11 mobile movies');for(const f of movies)if(fs.statSync(path.join(root,'img/film',dir,f)).size<10000)errors.push('Incomplete mobile movie '+dir+'/'+f);}
dom.window.close();console.log(JSON.stringify({passed:!errors.length,javascriptFiles:js,stylesheets:css,errors},null,2));if(errors.length)process.exitCode=1;
