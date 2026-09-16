/* Explizit angeforderter Live-Test. Nur eigene BauStern-Adresse, deutlich als SYSTEMTEST markiert.
   Nicht in npm test aufnehmen; erzeugt echte, nachvollziehbare CRM-Datensätze und interne Meldungen. */
const {chromium}=require('playwright'),fs=require('fs'),path=require('path');
const BASE=process.env.BASE||'http://localhost:8099',marker=process.env.QA_MARKER||'SYSTEMTEST-60FPS-20260912';
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const requests=[],responses=[];
 p.on('request',r=>{if(r.url().endsWith('/web-anfrage')){const d=r.postDataJSON();requests.push({...d,fotos:d.fotos?.map(x=>({titel:x.titel,bytes:x.daten.length}))});}});
 p.on('response',async r=>{if(r.url().endsWith('/web-anfrage'))responses.push({status:r.status(),body:await r.json().catch(()=>null)});});
 try{await p.goto(BASE+'/kontakt?utm_source=codex_qa&utm_campaign='+marker);
 await p.locator('#who button:first-child').click();await p.locator('#i-name').fill('SYSTEMTEST BauStern');
 await p.locator('#i-phone').fill('+41 00 000 00 00');await p.locator('#i-mail').fill('info@baustern.ch');
 await p.locator('#i-plz').fill('8001 Zürich');await p.locator('#i-msg').fill(marker+' — Technischer Test mit Foto. KEIN Kundenauftrag. Bitte nicht kontaktieren.');
 await p.locator('#i-fotos').setInputFiles(path.resolve(__dirname,'../../site/img/favicon-32.png'));await p.waitForSelector('.foto-chip');await p.locator('#i-priv').check();await p.locator('#submitBtn').click();
 await p.waitForSelector('.sent h3',{timeout:35000});await p.screenshot({path:'reports/crm-live-success.png',fullPage:false});
 if(!responses[0]?.body?.nr)throw Error('Keine CRM-Referenz');
 const report={marker,base:BASE,requests,responses,success:await p.locator('.sent').innerText()};fs.writeFileSync('reports/crm-live-test.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
 }catch(e){console.log(JSON.stringify({requests,responses,body:await p.locator('#formCard').innerText().catch(()=>''),error:String(e)},null,2));throw e;}finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
