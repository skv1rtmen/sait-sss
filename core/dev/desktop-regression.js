const {spawn}=require('child_process'),fs=require('fs'),path=require('path');
const files=['route-test.js','flight-test.js','hybrid-test.js','sig-test.js','final-home-check.js'];
(async()=>{const rows=[];for(const file of files){const r=await new Promise(resolve=>{const p=spawn(process.execPath,[file],{cwd:__dirname,windowsHide:true});let output='';p.stdout.on('data',s=>output+=s);p.stderr.on('data',s=>output+=s);p.on('close',code=>resolve({file,code,output}));});rows.push(r);console.log(file,r.code);if(r.code)console.log(r.output);}
 fs.writeFileSync(path.join(__dirname,'reports/desktop-regression-mobile-release.json'),JSON.stringify(rows,null,2));if(rows.some(r=>r.code!==0))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
