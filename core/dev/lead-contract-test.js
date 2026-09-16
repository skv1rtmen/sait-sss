const {chromium,webkit}=require('playwright'),fs=require('fs'),assert=require('assert/strict');
(async()=>{const rows=[];for(const [name,engine] of Object.entries({chromium,webkit})){const b=await engine.launch();try{const p=await b.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});let reply={status:200,body:'{}'},sent=[];
 await p.route('**/web-anfrage',async r=>{sent.push(r.request().postDataJSON());await r.fulfill({contentType:'application/json',...reply});});await p.goto('http://localhost:8099/kontakt?utm_source=contract_test');
 const lead={name:'QA contract',email:'qa@example.invalid',telefon:'+41000000000',gewerk:'Renovation',nachricht:'Local mock only'};
 for(const body of ['{}','{"ok":true}','{"ok":false,"nr":"X"}','<html>Error</html>']){reply={status:200,body};assert.equal((await p.evaluate(d=>sendLead(d),lead)).ok,false);}
 const id=sent[0].request_id;assert(sent.every(d=>d.request_id===id));await p.reload();reply={status:503,body:'{"ok":false}'};assert.equal((await p.evaluate(d=>sendLead(d),lead)).ok,false);assert.equal(sent.at(-1).request_id,id);
 assert.equal(await p.evaluate(()=>sessionStorage.getItem('bs_lead_attempt').includes('qa@example')),false);
 reply={status:200,body:'{"ok":true,"nr":"QA-CONTRACT"}'};assert.equal((await p.evaluate(d=>sendLead(d),lead)).ok,true);assert.equal(sent.at(-1).request_id,id);
 await p.evaluate(d=>sendLead(d),{...lead,nachricht:'Changed local test'});assert.notEqual(sent.at(-1).request_id,id);
 assert(sent.every(d=>d.utm_source==='contract_test'&&d.form==='anfrage'));rows.push({engine:name,checks:11,requestsToMock:sent.length,passed:true});
 }finally{await b.close();}}fs.writeFileSync('reports/lead-contract.json',JSON.stringify(rows,null,2));console.log(rows);})().catch(e=>{console.error(e);process.exitCode=1;});
