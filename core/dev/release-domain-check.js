const fs=require('fs'),path=require('path'),assert=require('assert/strict'),https=require('https');
(async()=>{
 const origin='https://www.baustern.ch',rows=[];
 for(const [url,status,location] of [['http://baustern.ch/',301,'https://baustern.ch/'],['https://baustern.ch/',301,origin+'/'],['http://www.baustern.ch/',301,origin+'/'],[origin+'/',200,null],[origin+'/release-check-not-found-20260914',404,null]]){
  const r=await fetch(url,{redirect:'manual'});assert.equal(r.status,status);assert.equal(r.headers.get('location'),location);assert.equal(r.headers.get('server'),'Netlify');const html=await r.text();if(status===404)assert(html.includes('noindex,follow')&&!html.includes('rel="canonical"'));rows.push({url,status,location,server:r.headers.get('server')});
 }
 const sitemap=await (await fetch(origin+'/sitemap.xml')).text(),sitemapUrls=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(x=>x[1]);assert.equal(sitemapUrls.length,29); // Prerender intentionally omits two legal pages from sitemap, not from the website.
 const urls=[...sitemapUrls,origin+'/impressum',origin+'/datenschutz'];assert.equal(new Set(urls).size,31);
 for(const url of urls){assert(url.startsWith(origin+'/'));const r=await fetch(url),html=await r.text();assert.equal(r.status,200);assert(html.includes('rel="canonical" href="'+url+'"'),url);assert(!/name="robots"[^>]*noindex/.test(html),url);assert.equal(r.headers.get('x-robots-tag'),null);}
 const robots=await(await fetch(origin+'/robots.txt')).text();assert(robots.includes('Sitemap: '+origin+'/sitemap.xml'));
 const cert=await new Promise((resolve,reject)=>{https.get(origin,r=>{const c=r.socket.getPeerCertificate();resolve({authorized:r.socket.authorized,issuer:c.issuer?.O,subjectAltName:c.subjectaltname,validTo:c.valid_to});r.resume();}).on('error',reject);});assert(cert.authorized&&cert.subjectAltName.includes('DNS:www.baustern.ch')&&cert.subjectAltName.includes('DNS:baustern.ch'));
 const preflight=await fetch('https://n8n.baucrm.net/webhook/web-anfrage',{method:'OPTIONS',headers:{Origin:origin,'Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'content-type'}});
 const cors={status:preflight.status,origin:preflight.headers.get('access-control-allow-origin'),methods:preflight.headers.get('access-control-allow-methods'),headers:preflight.headers.get('access-control-allow-headers')};assert(preflight.ok);assert(cors.origin==='*'||cors.origin===origin);assert(cors.methods.includes('POST'));
 const report={checkedAt:new Date().toISOString(),origin,rows,canonicalRoutes:urls.length,certificate:cert,crmPreflight:cors,passed:true};fs.writeFileSync(path.join(__dirname,process.env.REPORT||'reports/release-fixes-2026-09-14/prod-domain.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
