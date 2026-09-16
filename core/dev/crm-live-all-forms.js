/* Nur explizit starten: echte CRM-Systemtests mit BauStern-eigener Adresse. */
const {chromium}=require('playwright'),fs=require('fs'),path=require('path');
const BASE=process.env.BASE||'http://localhost:8099',marker='SYSTEMTEST-CRM-60FPS-20260912',rows=[];
(async()=>{const b=await chromium.launch();try{for(const form of (process.env.FORMS||'anfrage,rueckruf,referenzmappe,karriere').split(',')){
 console.log('START',form);
 const ctx=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),p=await ctx.newPage();let payload,receipt;
 await p.route('**/web-anfrage',async route=>{payload=route.request().postDataJSON();payload.nachricht=marker+' | KEIN Kundenauftrag. Bitte nicht kontaktieren.\n'+payload.nachricht;await route.continue({postData:JSON.stringify(payload)});});
 const route=form==='karriere'?'karriere':form==='referenzmappe'?'':'kontakt';await p.goto(BASE+'/'+route+'?utm_source=codex_qa&utm_campaign='+marker);
 const response=p.waitForResponse(r=>r.url().endsWith('/web-anfrage'),{timeout:40000}).catch(e=>e);
 if(form==='anfrage'){await p.locator('#who button:first-child').click();await p.locator('#i-name').fill('SYSTEMTEST BauStern');await p.locator('#i-phone').fill('+41 00 000 00 00');await p.locator('#i-mail').fill('info@baustern.ch');await p.locator('#i-plz').fill('8001 Zürich');await p.locator('#i-msg').fill('Foto und Idempotenz');await p.locator('#i-fotos').setInputFiles(path.resolve(__dirname,'../../site/img/favicon-32.png'));await p.waitForSelector('.foto-chip');await p.locator('#i-priv').check();await p.locator('#submitBtn').click();}
 if(form==='rueckruf'){await p.locator('#cbOpen').evaluate(e=>e.click());await p.locator('#cbPhone').fill('+41 00 000 00 00');await p.locator('#cbSend').click();}
 if(form==='referenzmappe'){await p.locator('#magmail').fill('info@baustern.ch');await p.locator('#magbtn').click();}
 if(form==='karriere'){await p.locator('#j-name').fill('SYSTEMTEST BauStern PDF');await p.locator('#j-phone').fill('+41 00 000 00 00');await p.locator('#j-file').setInputFiles(path.resolve(__dirname,'../../site/downloads/baustern-referenzen-v1.pdf'));await p.waitForSelector('#jobFileList .foto-chip');await p.locator('#jobSubmitBtn').click();}
 const r=await response;if(r instanceof Error)throw r;receipt=await r.json();if(r.status()!==200||!receipt.ok||!receipt.nr)throw Error(form+': '+JSON.stringify(receipt));
 await p.waitForTimeout(300);await p.screenshot({path:'reports/crm-live-'+form+'.png'});
 const duplicates=await Promise.all([1,2].map(async()=>{const r=await p.request.post('https://n8n.baucrm.net/webhook/web-anfrage',{data:payload});const j=await r.json();if(!j.ok||j.nr!==receipt.nr||!j.duplicate)throw Error('Duplicate failed '+JSON.stringify(j));return {status:r.status(),...j};}));
 const row={form,requestId:payload.request_id,receipt,duplicates,attachmentCount:payload.fotos?.length||0};rows.push(row);fs.writeFileSync('reports/crm-live-all-forms.json',JSON.stringify({marker,base:BASE,rows},null,2));console.log(JSON.stringify(row));await ctx.close();}
 const ctx=await b.newContext();const invalid=await ctx.request.post('https://n8n.baucrm.net/webhook/web-anfrage',{data:{name:marker,telefon:'abc',gewerk:'SYSTEMTEST invalid',nachricht:marker,request_id:require('crypto').randomUUID()}});const result=await invalid.json();if(invalid.status()!==422||result.ok!==false)throw Error('Validation response incorrect');rows.push({validation:{status:invalid.status(),...result}});await ctx.close();
 fs.writeFileSync('reports/crm-live-all-forms.json',JSON.stringify({marker,base:BASE,rows},null,2));
}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
