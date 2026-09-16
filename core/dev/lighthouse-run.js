/* Reuse Playwright's installed browser; no system-Chrome auto-detection dependency. */
const {chromium}=require('playwright'),fs=require('fs'),path=require('path');
(async()=>{const {default:lighthouse}=await import('lighthouse');const port=9239;const browser=await chromium.launch({args:[`--remote-debugging-port=${port}`]});
 try{const result=await lighthouse(process.env.BASE||'http://localhost:8099',{port,output:'json',logLevel:'error',onlyCategories:['performance','accessibility','best-practices','seo']});
 const r=result.lhr;fs.writeFileSync(path.join(__dirname,'reports',process.env.REPORT||'lighthouse-mobile-cinema.json'),JSON.stringify(r,null,2));
 console.log(JSON.stringify({scores:Object.fromEntries(Object.entries(r.categories).map(([k,v])=>[k,Math.round(v.score*100)])),warnings:r.runWarnings,metrics:Object.fromEntries(['first-contentful-paint','largest-contentful-paint','total-blocking-time','cumulative-layout-shift','speed-index'].map(k=>[k,r.audits[k].displayValue]))},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
