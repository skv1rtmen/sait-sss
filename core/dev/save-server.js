/* Winziger Ablage-Server für die Build-Werkzeuge im Browser (Tiefenkarten-Labor).
   Nimmt POST /put?name=<datei> mit Binärkörper entgegen und legt die Datei unter DEST ab.
   Nur lokal (127.0.0.1), nur Dateinamen ohne Pfadanteile. Start: node core/dev/save-server.js <ziel-ordner> [port] */
const http=require('http'),fs=require('fs'),path=require('path');
const DEST=path.resolve(process.argv[2]||'.');
const PORT=Number(process.argv[3]||8123);
fs.mkdirSync(DEST,{recursive:true});
http.createServer((q,r)=>{
  r.setHeader('Access-Control-Allow-Origin','*');
  r.setHeader('Access-Control-Allow-Headers','content-type');
  if(q.method==='OPTIONS'){r.writeHead(204);r.end();return;}
  if(q.method!=='POST'||!q.url.startsWith('/put')){r.writeHead(404);r.end('no');return;}
  const name=path.basename(new URL(q.url,'http://x').searchParams.get('name')||'');
  if(!name||!/^[\w.-]+$/.test(name)){r.writeHead(400);r.end('bad name');return;}
  const ch=[];q.on('data',d=>ch.push(d));
  q.on('end',()=>{const b=Buffer.concat(ch);fs.writeFileSync(path.join(DEST,name),b);
    console.log('saved',name,b.length);r.writeHead(200);r.end(String(b.length));});
}).listen(PORT,'127.0.0.1',()=>console.log('save-server',DEST,PORT));
