const {spawnSync}=require('node:child_process'),fs=require('node:fs'),path=require('node:path');
const output=path.join(__dirname,process.env.REPORT||'reports/release-fixes-2026-09-14/protocol.json'),rows=[];
for(const file of ['jsdom-smoke.js','route-test.js','flight-test.js','hybrid-test.js','sig-test2.js','final-home-check.js','crawl-v9.js']){
 const r=spawnSync(process.execPath,[file],{cwd:__dirname,encoding:'utf8',timeout:180000,maxBuffer:20*1024*1024});
 rows.push({file,exit:r.status,stdout:r.stdout,stderr:r.stderr,error:r.error?.message});fs.writeFileSync(output,JSON.stringify(rows,null,2));console.log(file+': exit '+r.status);
 if(r.status!==0)process.exitCode=1;
}
