/* BauStern v10 deep audit: accessibility, responsive layout, touch ergonomics,
   reduced motion, modal/menu keyboard handling, and SPA lifecycle stability. */
const { chromium } = require('playwright');
const { AxeBuilder } = require('@axe-core/playwright');
const fs = require('fs');
const path = require('path');

const BASE = process.env.BASE || 'http://localhost:8099';
const EXE = process.env.CHROME || undefined;
const root = path.resolve(__dirname, '../..');
const reportPath = path.join(root, 'site/_tools/prerender-report.json');
const allRoutes = JSON.parse(fs.readFileSync(reportPath, 'utf8')).map(x => x.route);
const routes = process.env.ROUTE ? process.env.ROUTE.split(',') : allRoutes;
const archetypes = new Set([
  'home','leistungen','leistungen/sanitaer','loesungen','loesungen/hausverwaltungen',
  'referenzen','projekt/atlant-komplettausbau','wissen','wissen/badsanierung-kosten-zuerich-2026',
  'kontakt','karriere','bewertung','datenschutz'
]);
const profiles = {
  mobile: { viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true },
  tablet: { viewport: { width: 768, height: 1024 }, isMobile: true, hasTouch: true },
  desktop: { viewport: { width: 1440, height: 900 }, isMobile: false, hasTouch: false }
};
const urlFor = route => BASE + '/' + (route === 'home' ? '' : route);
const localFailure = url => url.startsWith(BASE);

async function settle(page, route) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForFunction(() => document.querySelector('#view .page'), null, { timeout: 15000 });
  await page.waitForTimeout(route === 'home' ? 1300 : 450);
}

async function inspectPage(page) {
  return page.evaluate(() => {
    const visible = el => {
      const s = getComputedStyle(el), r = el.getBoundingClientRect();
      return s.display !== 'none' && s.visibility !== 'hidden' && +s.opacity !== 0 && r.width > 0 && r.height > 0;
    };
    const name = el => (el.getAttribute('aria-label') || (el.labels&&[...el.labels].map(x=>x.textContent).join(' ')) || el.textContent || el.querySelector?.('img[alt]:not([alt=""])')?.alt || el.getAttribute('title') || el.value || el.placeholder || '').trim().replace(/\s+/g,' ').slice(0,80);
    const selector = el => `${el.tagName.toLowerCase()}${el.id?'#'+el.id:''}${typeof el.className==='string'&&el.className.trim()?'.'+el.className.trim().split(/\s+/).slice(0,2).join('.'):''}`;
    const wide = [...document.querySelectorAll('body *')].filter(el => {
      if (!visible(el) || getComputedStyle(el).position === 'fixed') return false;
      const r = el.getBoundingClientRect(); return r.right > innerWidth + 2 || r.left < -2;
    }).slice(0,10).map(selector);
    const unnamed = [...document.querySelectorAll('button,a[href],input,select,textarea')]
      .filter(el => visible(el) && !name(el) && !el.closest('[aria-hidden="true"]')).map(el=>({el:selector(el),html:el.outerHTML.slice(0,300)})).slice(0,20);
    const touch = [...document.querySelectorAll('button,a[href],input,select,textarea,[role="button"]')]
      .filter(el => {
        if (!visible(el) || el.closest('[aria-hidden="true"]')) return false;
        const s=getComputedStyle(el), r=el.getBoundingClientRect();
        const inlineLink=el.tagName==='A'&&s.display==='inline'&&!el.classList.contains('btn');
        return !inlineLink && (r.width < 44 || r.height < 44);
      }).map(el => { const r=el.getBoundingClientRect(); return { el:selector(el), name:name(el), w:+r.width.toFixed(1), h:+r.height.toFixed(1) }; }).slice(0,30);
    const unlabeled = [...document.querySelectorAll('input:not([type="hidden"]),select,textarea')]
      .filter(el => visible(el) && !el.closest('[aria-hidden="true"]') && !el.labels?.length && !el.getAttribute('aria-label') && !el.getAttribute('aria-labelledby')).map(selector);
    const images = [...document.images].filter(img => visible(img) && !img.closest('[aria-hidden="true"]'));
    const missingAlt = images.filter(img => !img.hasAttribute('alt')).map(selector);
    const broken = images.filter(img => (img.currentSrc || img.getAttribute('src')) && img.complete && !img.naturalWidth).map(img => img.currentSrc || img.src);
    const noDimensions = images.filter(img => !(img.width && img.height) && !getComputedStyle(img).aspectRatio).map(selector).slice(0,20);
    const h1=[...document.querySelectorAll('#view h1')].filter(visible);
    const fixedBottom=[...document.querySelectorAll('body *')].filter(el=>visible(el)&&getComputedStyle(el).position==='fixed'&&el.getBoundingClientRect().bottom>=innerHeight-2).map(selector).slice(0,8);
    return {
      title: document.title,
      lang: document.documentElement.lang,
      h1: h1.length,
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      wide, unnamed, touch, unlabeled, missingAlt, broken, noDimensions, fixedBottom,
      dialogs: [...document.querySelectorAll('[role="dialog"]')].map(d=>({id:d.id,hidden:d.getAttribute('aria-hidden'),modal:d.getAttribute('aria-modal')})),
      videos: document.querySelectorAll('video').length,
      pages: document.querySelectorAll('#view>.page').length
    };
  });
}

async function auditRoutes(browser) {
  const rows=[];
  for (const [profile, options] of Object.entries(profiles).filter(([name])=>!process.env.PROFILE||process.env.PROFILE===name)) {
    const ctx = await browser.newContext({ ...options, deviceScaleFactor: 1, locale: 'de-CH' });
    await ctx.route(/n8n\.baucrm\.net/, r => r.fulfill({ status: 200, contentType:'application/json', body:'{"ok":true}' }));
    for (const route of routes) {
      const page=await ctx.newPage(), errors=[], failures=[];
      page.on('console',m=>{if(m.type()==='error')errors.push(m.text().slice(0,240));});
      page.on('pageerror',e=>errors.push('PAGEERROR '+String(e).slice(0,240)));
      page.on('requestfailed',r=>{if(localFailure(r.url()))failures.push('FAIL '+r.url()+' '+(r.failure()?.errorText||''));});
      page.on('response',r=>{if(localFailure(r.url())&&r.status()>=400)failures.push(r.status()+' '+r.url());});
      let dom={},axe=[];
      try {
        await page.goto(urlFor(route),{waitUntil:'load',timeout:30000});await settle(page,route);dom=await inspectPage(page);
        if(profile==='mobile'||(profile==='desktop'&&archetypes.has(route))){
          const a=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
          axe=a.violations.map(v=>({id:v.id,impact:v.impact,help:v.help,nodes:v.nodes.length,targets:v.nodes.map(n=>n.target.join(' ')),details:v.nodes.map(n=>({target:n.target.join(' '),html:n.html,failureSummary:n.failureSummary}))}));
        }
      } catch(e){errors.push('AUDIT '+String(e).slice(0,300));}
      const serious=axe.filter(v=>v.impact==='critical'||v.impact==='serious');
      const ok=!errors.length&&!failures.length&&!dom.overflow&&dom.h1===1&&!dom.unnamed?.length&&!dom.unlabeled?.length&&!dom.broken?.length&&!serious.length;
      rows.push({profile,route,ok,errors,failures,dom,axe});
      if(!ok)console.log('ISSUE',profile,route,JSON.stringify({errors,failures,overflow:dom.overflow,h1:dom.h1,unnamed:dom.unnamed,unlabeled:dom.unlabeled,broken:dom.broken,serious}));
      await page.close();
    }
    await ctx.close();
  }
  return rows;
}

async function interactionAudit(browser) {
  const out={};
  const ctx=await browser.newContext({...profiles.mobile,locale:'de-CH'});
  await ctx.route(/n8n\.baucrm\.net/,r=>r.fulfill({status:200,contentType:'application/json',body:'{"ok":true}'}));
  const p=await ctx.newPage();await p.goto(urlFor('home'),{waitUntil:'load'});await settle(p,'home');
  await p.locator('#burger').click();await p.waitForTimeout(60);
  out.mobileOpen=await p.evaluate(()=>({expanded:burger.getAttribute('aria-expanded'),hidden:mobmenu.getAttribute('aria-hidden'),active:document.activeElement?.textContent?.trim(),locked:document.body.classList.contains('mob-open'),inert:mobmenu.inert}));
  await p.keyboard.press('Shift+Tab');out.mobileWrapBack=await p.evaluate(()=>document.activeElement?.textContent?.trim());
  await p.keyboard.press('Escape');out.mobileClosed=await p.evaluate(()=>({expanded:burger.getAttribute('aria-expanded'),hidden:mobmenu.getAttribute('aria-hidden'),focus:document.activeElement?.id,locked:document.body.classList.contains('mob-open'),inert:mobmenu.inert}));
  await p.close();await ctx.close();

  const modalCtx=await browser.newContext({...profiles.desktop,locale:'de-CH'});const mp=await modalCtx.newPage();await mp.goto(urlFor('kontakt'),{waitUntil:'load'});await settle(mp,'kontakt');
  await mp.locator('#cbOpen').click();await mp.waitForTimeout(450);out.callbackOpen=await mp.evaluate(()=>({open:document.querySelector('#cbwrap').classList.contains('open'),hidden:document.querySelector('#cbwrap').getAttribute('aria-hidden'),active:document.activeElement?.id}));
  await mp.keyboard.press('Escape');out.callbackClosed=await mp.evaluate(()=>({open:document.querySelector('#cbwrap').classList.contains('open'),hidden:document.querySelector('#cbwrap').getAttribute('aria-hidden'),active:document.activeElement?.id}));
  await mp.close();await modalCtx.close();

  const reduced=await browser.newContext({...profiles.desktop,reducedMotion:'reduce'});const rp=await reduced.newPage();
  await rp.goto(urlFor('home'),{waitUntil:'load'});await settle(rp,'home');
  out.reduced=await rp.evaluate(()=>({motion:matchMedia('(prefers-reduced-motion:reduce)').matches,mode:window.Motion?.mode(),film:window.Film?.mode(),videos:document.querySelectorAll('.w-vid').length,marquee:!!document.querySelector('.is-marquee'),running:document.getAnimations().filter(a=>a.playState==='running'&&a.effect?.getTiming?.().duration>20).length}));
  await rp.close();await reduced.close();

  const desk=await browser.newContext({...profiles.desktop});const sp=await desk.newPage();await sp.goto(urlFor('leistungen'),{waitUntil:'load'});await settle(sp,'leistungen');
  for(let i=0;i<3;i++)for(const route of ['kontakt','referenzen','leistungen/sanitaer','home','leistungen']){await sp.evaluate(r=>window.go(r),route);await sp.waitForTimeout(1050);}
  out.spaLifecycle=await sp.evaluate(()=>({pages:document.querySelectorAll('#view>.page').length,videos:document.querySelectorAll('video').length,scrollTriggers:window.ScrollTrigger?.getAll?.().length||0,route:window.__route?.name,heap:performance.memory?.usedJSHeapSize||null}));
  await sp.close();await desk.close();

  const land=await browser.newContext({viewport:{width:812,height:375},isMobile:true,hasTouch:true});const lp=await land.newPage();
  await lp.goto(urlFor('home'),{waitUntil:'load'});await settle(lp,'home');out.landscape=await inspectPage(lp);await lp.close();await land.close();
  return out;
}

(async()=>{
  fs.mkdirSync(path.join(__dirname,'reports'),{recursive:true});
  const browser=await chromium.launch({executablePath:EXE});
  const rows=await auditRoutes(browser),interactions=process.env.SKIP_INTERACTIONS?{}:await interactionAudit(browser);
  await browser.close();
  const allAxe=rows.flatMap(r=>r.axe.map(v=>({...v,profile:r.profile,route:r.route})));
  const summary={
    checked:rows.length,failed:rows.filter(r=>!r.ok).length,
    seriousAxe:allAxe.filter(v=>v.impact==='critical'||v.impact==='serious').length,
    axeByRule:[...new Set(allAxe.map(v=>v.id))].map(id=>({id,count:allAxe.filter(v=>v.id===id).reduce((n,v)=>n+v.nodes,0)})),
    overflow:rows.filter(r=>r.dom.overflow).map(r=>`${r.profile}:${r.route}`),
    touchSamples:rows.filter(r=>r.dom.touch?.length).slice(0,20).map(r=>({profile:r.profile,route:r.route,count:r.dom.touch.length,samples:r.dom.touch.slice(0,5)})),
    interactions
  };
  fs.writeFileSync(path.join(__dirname,'reports/audit-v10.json'),JSON.stringify({summary,rows},null,2));
  console.log(JSON.stringify(summary,null,2));
  process.exitCode=summary.failed||summary.seriousAxe?1:0;
})().catch(e=>{console.error(e);process.exitCode=1;});
