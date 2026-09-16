/* Each authorization has a separate, write-once ledger. Never erase it to retry.
   The owner separately authorized one notification-repair test after the initial lead. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{chromium}=require('playwright'),sharp=require('sharp');
const notificationTest=process.env.LIVE_NOTIFICATION_APPROVED==='2026-09-14-after-fix';
const out=path.join(__dirname,'reports/release-fixes-2026-09-14'),ledger=path.join(out,notificationTest?'one-live-notification-retest.json':'one-live-lead.json');
const base=process.env.BASE;
(async()=>{
 assert((notificationTest||process.env.LIVE_LEAD_APPROVED==='2026-09-14')&&base?.startsWith('https://'),'Explicit test authorization and HTTPS URL required');
 assert(!fs.existsSync(ledger),'A live attempt already exists. Read CRM before any further action; do not resubmit.');
 const b=await chromium.launch(),p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 const record={base,markedTest:true,purpose:notificationTest?'Owner-authorized notification repair retest':'Initial authorized CRM test',attemptedAt:null,requests:[],response:null};
 p.on('request',r=>{if(r.url().includes('/web-anfrage')&&r.method()==='POST'){const d=r.postDataJSON();record.requests.push({request_id:d.request_id,name:d.name,files:d.fotos?.map(f=>({title:f.titel,bytes:f.bytes}))});fs.writeFileSync(ledger,JSON.stringify(record,null,2));}});
 try{
  await p.goto(base+'/kontakt',{waitUntil:'load'});
  await p.locator('#who button').last().click();
  await p.locator('#i-name').fill(notificationTest?'SYSTEMTEST BauStern Benachrichtigung 2026-09-14':'SYSTEMTEST BauStern Freigabe 2026-09-14');
  await p.locator('#i-mail').fill('info@baustern.ch');
  await p.locator('#i-phone').fill('+41765249898');
  await p.locator('#i-svc').selectOption({label:'Renovation'});
  await p.locator('#i-msg').fill(notificationTest?'SYSTEMTEST — KEIN KUNDENAUFTRAG. Vom Inhaber separat autorisierter einmaliger Nachtest am 14.09.2026: Telegram-Wiederholung und Team-E-Mail nach Reparatur prüfen. Bitte keinen Rückruf und keine Offerte auslösen. Vorheriger Test WEB-260914-010. Referenz: NOTIFICATION-QA-20260914.':'SYSTEMTEST — KEIN KUNDENAUFTRAG. Vom Inhaber autorisierte einmalige Release-Prüfung am 14.09.2026. Bitte keinen Rückruf und keine Offerte auslösen. Zweck: CRM-Eingang, Bestätigung und genau ein Testbild prüfen. Referenz: RELEASE-QA-20260914.');
  const png=await sharp(Buffer.from('<svg width="640" height="360" xmlns="http://www.w3.org/2000/svg"><rect width="640" height="360" fill="#f3eee5"/><text x="40" y="160" font-size="36" fill="#1c1f22">SYSTEMTEST BAUSTERN</text><text x="40" y="220" font-size="24" fill="#1c1f22">RELEASE-QA-20260914 — kein Kundenfoto</text></svg>')).png().toBuffer();
  await p.locator('#i-fotos').setInputFiles({name:'SYSTEMTEST-RELEASE-20260914.png',mimeType:'image/png',buffer:png});
  await p.waitForFunction(()=>document.querySelectorAll('#fotoList .foto-item').length>0||document.querySelector('#fotoList')?.textContent.includes('SYSTEMTEST'));
  await p.locator('#i-priv').check();
  record.attemptedAt=new Date().toISOString();fs.writeFileSync(ledger,JSON.stringify(record,null,2),{flag:'wx'});
  const response=p.waitForResponse(r=>r.url().includes('/web-anfrage')&&r.request().method()==='POST',{timeout:45000});
  await p.locator('#submitBtn').click();const r=await response;record.response={status:r.status(),body:await r.json()};fs.writeFileSync(ledger,JSON.stringify(record,null,2));
  assert.equal(record.requests.length,1);assert.equal(record.response.body.ok,true);assert(record.response.body.nr);assert.equal(record.response.body.fotos,1);
  await p.locator('.sent h3').waitFor();await p.screenshot({path:path.join(out,notificationTest?'live-notification-retest.png':'live-lead-confirmation.png')});
  record.visibleReceipt=await p.locator('.sent').innerText();fs.writeFileSync(ledger,JSON.stringify(record,null,2));console.log(JSON.stringify(record,null,2));
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
