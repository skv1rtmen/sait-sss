/* No network calls, email delivery or CRM mutations. */
const vm=require('node:vm'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const cfg=JSON.parse(fs.readFileSync(path.join(__dirname,'../integrations/web-notifications-after-20260914.json')));
const code=cfg.nodes.find(n=>n.name==='Bestaetigung Bauen').parameters.jsCode;
const run=(response,fields)=>new vm.Script('(function(){'+code+'})()').runInNewContext({$input:{first:()=>({json:response})},$:()=>({first:()=>({json:fields})})});
assert.equal(run({ok:false},{email:'test@example.invalid'}).length,0);
assert.equal(run({ok:true,doppelt:true},{email:'test@example.invalid'}).length,0);
assert.equal(run({ok:true},{email:''}).length,0);
const pdf=run({ok:true,nr:'MOCK'},{email:'test@example.invalid',gewerk:'Referenzmappe PDF'});
assert(pdf[0].json.html.includes('https://www.baustern.ch/downloads/baustern-referenzen-v1.pdf'));
const contact=run({ok:true,nr:'MOCK'},{email:'test@example.invalid',name:'<img onerror=alert(1)>',gewerk:'<b>Test</b>'});
assert(!contact[0].json.html.includes('<img onerror=')&&contact[0].json.html.includes('&lt;img'));
const expression=cfg.nodes.find(n=>n.name==='Team E-Mail').parameters.message;
const message=new vm.Script('('+expression.slice(3,-2)+')').runInNewContext({$json:{text:'SYSTEMTEST'}});
assert.equal(message,'SYSTEMTEST\n\nCRM: https://baucrm.net/');
for(const name of ['TG Senden','Team E-Mail']){const n=cfg.nodes.find(n=>n.name===name);assert(n.retryOnFail&&n.maxTries===3&&n.waitBetweenTries===1500);}
console.log('NOTIFICATION CODE PASS: receipt guards, HTML escaping, canonical PDF, line breaks, bounded retries');
