const { chromium } = require('playwright');
const fs=require('fs');
const path=require('path');
const EXE = process.env.CHROME || undefined;
const repPath=[path.resolve(__dirname,'../../site/_tools/prerender-report.json'),path.resolve(process.cwd(),'site/_tools/prerender-report.json'),path.resolve(process.cwd(),'tools/prerender-report.json')].find(p=>fs.existsSync(p));
const routes = repPath ? JSON.parse(fs.readFileSync(repPath,'utf8')).map(r=>r.route) : ['home','leistungen','leistungen/sanitaer','loesungen','referenzen','projekt/atlant-komplettausbau','ueber-uns','wissen','kontakt','impressum','datenschutz','bewertung','karriere','sanierung-winterthur'];
const VP = { mobile: { width: 375, height: 812 }, tablet: { width: 768, height: 1024 }, desktop: { width: 1440, height: 900 } };
(async () => {
  const browser = await chromium.launch({ executablePath: EXE });
  const report = [];let bad=0;
  for (const [vp, size] of Object.entries(VP)) {
    const ctx = await browser.newContext({ viewport: size, isMobile: vp==='mobile', hasTouch: vp!=='desktop', deviceScaleFactor: 1 });
    await ctx.route(/n8n\.baucrm\.net/, r => r.fulfill({ status: 200, body: '{}' }));
    for (const route of routes) {
      const page = await ctx.newPage();
      const errs = [], failed = [];
      page.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0,160)); });
      page.on('pageerror', e => errs.push('PAGEERROR ' + String(e).slice(0,200)));
      page.on('response', r => { const u=r.url(); if (u.startsWith('http://localhost') && r.status() >= 400) failed.push(r.status()+' '+u.replace('http://localhost:8099','')); });
      page.on('requestfailed', r => { const u=r.url(); if (u.startsWith('http://localhost')) failed.push('FAIL '+u.replace('http://localhost:8099','')); });
      const url = 'http://localhost:8099/' + (route === 'home' ? '' : route);
      try { await page.goto(url, { waitUntil: 'load', timeout: 30000 }); } catch (e) { errs.push('NAV ' + e.message.slice(0,100)); }
      await page.waitForTimeout(route==='home'?2500:1200);
      const m = await page.evaluate(() => { const de=document.documentElement; const h1=document.querySelectorAll('#view h1').length; const wide=[...document.querySelectorAll('#view *')].filter(el=>{const r=el.getBoundingClientRect();return r.width>0&&(r.right>innerWidth+2||r.left<-2)&&getComputedStyle(el).position!=='fixed';}).slice(0,3).map(el=>el.tagName.toLowerCase()+(el.className&&typeof el.className==='string'?'.'+el.className.split(' ')[0]:''));
        return { overflow: de.scrollWidth > de.clientWidth+1, sw: de.scrollWidth, cw: de.clientWidth, h1, title: document.title, canonical:(document.querySelector('link[rel=canonical]')||{}).href||null, wide, prerenderAttr: document.getElementById('view').hasAttribute('data-prerender') }; });
      const extErr = errs.filter(e => !/TUNNEL|ERR_CONNECTION|ERR_NAME|Failed to load resource/.test(e));
      const ok = extErr.length === 0 && failed.length === 0 && !m.overflow && m.h1 === 1;
      if (!ok) bad++;
      report.push({ vp, route, ok, errors: extErr, failed, overflow: m.overflow ? m.sw + '>' + m.cw : false, wide: m.wide, h1: m.h1, prerenderAttr: m.prerenderAttr });
      if (!ok) console.log('✗', vp, route, JSON.stringify({ errors: extErr, failed, overflow: m.overflow, wide: m.wide, h1: m.h1 }));
      await page.close();
    }
    await ctx.close();
  }
  fs.writeFileSync('crawl-v9-report.json', JSON.stringify(report, null, 1));
  console.log(`checked ${report.length} page×viewport combos, problems: ${bad}`);
  await browser.close();
})();
