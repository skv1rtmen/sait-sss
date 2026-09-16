/* Dev-Server für site/ (Port 8099). Verhält sich wie Netlify mit den _redirects-Regeln aus tools/prerender.js:
   /kontakt -> kontakt.html (vorgerendert), sonst SPA-Fallback auf index.html. */
const http=require('http'),fs=require('fs'),path=require('path');const root=[path.join(__dirname,'site'),path.join(__dirname,'..','site'),path.join(__dirname,'..','..','site')].find(d=>fs.existsSync(path.join(d,'index.html')))||path.join(__dirname,'..','..','site');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.woff2':'font/woff2','.woff':'font/woff','.json':'application/json','.mp4':'video/mp4','.webm':'video/webm','.webmanifest':'application/manifest+json','.xml':'application/xml','.txt':'text/plain'};
const exists=f=>{try{return fs.statSync(f).isFile();}catch(e){return false;}};
http.createServer((q,r)=>{let p;try{p=decodeURIComponent(q.url.split('?')[0]);}catch(e){r.writeHead(400);r.end();return;}if(p==='/')p='/index.html';
  let f=path.join(root,p);
  const relative=path.relative(root,f);if(relative.startsWith('..')||path.isAbsolute(relative)){r.writeHead(403);r.end();return;}
  if(!path.extname(p)){const clean=p.replace(/\/+$/,'');const c1=path.join(root,clean+'.html'),c2=path.join(root,clean,'index.html');f=exists(c1)?c1:exists(c2)?c2:path.join(root,'404.html');}
  const status=exists(f)&&path.basename(f)!=='404.html'?200:404;
  if(status===404)f=path.join(root,'404.html');
  fs.stat(f,(e,st)=>{if(e||!st.isFile()){r.writeHead(404);r.end();return;}const type=mime[path.extname(f)]||'application/octet-stream',range=q.headers.range;
    if(range&&status===200){const m=/bytes=(\d*)-(\d*)/.exec(range),start=m&&m[1]?+m[1]:0,end=m&&m[2]?Math.min(+m[2],st.size-1):st.size-1;
      if(!m||start>end||start>=st.size){r.writeHead(416,{'Content-Range':`bytes */${st.size}`});r.end();return;}
      r.writeHead(206,{'Content-Type':type,'Content-Length':end-start+1,'Content-Range':`bytes ${start}-${end}/${st.size}`,'Accept-Ranges':'bytes','Cache-Control':'no-store'});fs.createReadStream(f,{start,end}).pipe(r);return;}
    r.writeHead(status,{'Content-Type':type,'Content-Length':st.size,'Accept-Ranges':'bytes','Cache-Control':'no-store',...(status===404?{'X-Robots-Tag':'noindex'}:{})});if(q.method==='HEAD')r.end();else fs.createReadStream(f).pipe(r);});}).listen(Number(process.env.PORT)||8099,()=>console.log('Site server ready on '+(process.env.PORT||8099)));
