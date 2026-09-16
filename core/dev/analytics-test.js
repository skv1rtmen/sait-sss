const { chromium } = require('playwright');
const EXE = process.env.CHROME || undefined;
(async () => {
  const browser = await chromium.launch({ executablePath: EXE });
  const results = {};
  for (const mode of ['ga4', 'gtm', 'none']) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    const errs = [], tagReq = [];
    page.on('console', m => { if (m.type() === 'error' && !/TUNNEL|ERR_/.test(m.text())) errs.push(m.text()); }); page.on('pageerror', e => errs.push(String(e)));
    await page.route(/n8n\.baucrm\.net/, r => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"nr":"T-1"}' }));
    await page.route(/js\/data\.js/, async r => { const res = await r.fetch(); let body = await res.text();
      const ids = mode === 'ga4' ? "ga4Id:'G-TEST1234',gtmId:''" : mode === 'gtm' ? "ga4Id:'G-TEST1234',gtmId:'GTM-TEST99'" : "ga4Id:'',gtmId:''";
      body = body.replace("ga4Id:'',gtmId:''", ids); r.fulfill({ status: 200, contentType: 'text/javascript', body }); });
    await page.route(/googletagmanager\.com/, r => { tagReq.push(r.request().url()); r.fulfill({ status: 200, contentType: 'text/javascript', body: 'window.__tagLoaded=true;' }); });
    await page.goto('http://localhost:8099/', { waitUntil: 'load' });
    await page.waitForSelector('#pre.gone', { timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(500);
    // interactions: nav → kontakt (page_view + cta), phone click prevented, callback open, form validation error, form success, double-click dedupe
    await page.click('.nav-links a[data-go=kontakt]'); await page.waitForTimeout(1500);
    await page.evaluate(() => { document.addEventListener('click', e => { const a = e.target.closest('a[href^="tel:"],a[href^="mailto:"],a[target=_blank]'); if (a) e.preventDefault(); }, true); });
    await page.click('#view a[href^="tel:"]').catch(() => {}); await page.waitForTimeout(100);
    await page.click('#view a[href^="tel:"]').catch(() => {}); await page.waitForTimeout(100);   // duplicate within 800ms -> suppressed
    await page.click('#cbOpen').catch(() => {}); await page.waitForTimeout(400); await page.click('#cbClose').catch(() => {});
    await page.click('#submitBtn'); await page.waitForTimeout(400);   // validation error
    await page.fill('#i-name', 'Test Person'); await page.fill('#i-phone', '+41 79 123 45 67'); await page.fill('#i-mail', 'test@example.com');
    await page.click('#who button').catch(() => {}); await page.check('#i-priv').catch(() => {});
    await page.click('#submitBtn'); await page.waitForTimeout(1500);
    const dl = await page.evaluate(() => (window.dataLayer || []).map(x => (x && typeof x.length === 'number' && !Array.isArray(x)) ? ['gtag', ...Array.from(x)] : x));
    const st = await page.evaluate(() => window.Analytics && Analytics.state());
    const names = dl.map(x => Array.isArray(x) ? (x[1] === 'event' ? 'gtag:' + x[2] : 'gtag:' + x[1] + (x[2] && typeof x[2] === 'string' ? ':' + x[2] : '')) : x.event).filter(Boolean);
    results[mode] = { state: st, tagRequests: tagReq, events: names, errors: errs, sample: dl.filter(x => !Array.isArray(x) ? /generate_lead|form_error|page_view/.test(x.event) : /generate_lead|form_error|page_view/.test(x[2])).slice(0, 6) };
    await ctx.close();
  }
  console.log(JSON.stringify(results, null, 1));
  await browser.close();
})();
