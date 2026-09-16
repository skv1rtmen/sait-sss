const {spawnSync}=require('child_process'),path=require('path'),fs=require('fs');
const site=path.resolve(__dirname,'../../site');
for(const file of ['verify-static.js',path.join(site,'_tools/prerender.js')]){
 const r=spawnSync(process.execPath,[file],{cwd:__dirname,env:{...process.env,NODE_PATH:path.join(__dirname,'node_modules')},encoding:'utf8'});
 process.stdout.write(r.stdout||'');process.stderr.write(r.stderr||'');if(r.status!==0)process.exit(r.status||1);
}
const routes=JSON.parse(fs.readFileSync(path.join(site,'_tools/prerender-report.json'),'utf8'));
if(routes.length!==31)throw Error('Expected 31 prerendered routes');
console.log('BUILD PASS: 31 routes, JS/CSS lint and shell assets verified.');
