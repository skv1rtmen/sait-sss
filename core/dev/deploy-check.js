const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const fling = require('./fling.js');

const BASE = (process.env.BASE || '').replace(/\/$/, '');
if (!BASE) throw new Error('Set BASE to the deployed origin');

const reportPath = path.resolve(__dirname, '../../site/_tools/prerender-report.json');
const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
const routeRows = Array.isArray(report) ? report : (report.routes || []);
const routes = routeRows.map(r => typeof r === 'string' ? r : (r.url || r.route || r.path)).filter(Boolean);

(async () => {
  const http = [];
  for (const route of routes) {
    const target = /^https?:/.test(route) ? new URL(route).pathname : route;
    const res = await fetch(BASE + (target.startsWith('/') ? target : '/' + target), { redirect: 'follow' });
    http.push({ route: target, status: res.status, ok: res.ok });
  }

  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME || undefined });
  const viewports = [
    { name: 'mobile', width: 375, height: 812 },
    { name: 'tablet', width: 768, height: 900 },
    { name: 'desktop', width: 1440, height: 900 }
  ];
  const visual = [];

  for (const vp of viewports) {
    const page = await browser.newPage({ viewport: vp });
    await page.addInitScript(() => {
      window.__videoLog = [];
      const bind = v => {
        if (v.__qaBound) return;
        v.__qaBound = true;
        for (const type of ['loadstart','loadedmetadata','loadeddata','canplay','playing','waiting','stalled','suspend','abort','emptied','error']) {
          v.addEventListener(type, () => window.__videoLog.push({
            type, src: v.currentSrc || v.src, readyState: v.readyState,
            networkState: v.networkState, error: v.error && { code: v.error.code, message: v.error.message }
          }));
        }
      };
      new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => {
        if (n.nodeType !== 1) return;
        if (n.matches?.('video')) bind(n);
        n.querySelectorAll?.('video').forEach(bind);
      }))).observe(document, { childList: true, subtree: true });
    });
    const errors = [];
    const failed = [];
    const requested = [];
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', e => errors.push(e.message));
    page.on('request', r => requested.push(r.url()));
    page.on('requestfailed', r => failed.push(`FAIL ${r.url()} ${r.failure()?.errorText || ''}`));
    page.on('response', r => { if (r.url().startsWith(BASE) && r.status() >= 400) failed.push(`${r.status()} ${r.url()}`); });

    await page.goto(BASE + '/', { waitUntil: 'load', timeout: 60000 });
    await page.waitForSelector('#pre.gone', { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(800);
    const dom = await page.evaluate(() => ({
      fx: !!document.querySelector('.w-fx'),
      pictures: document.querySelectorAll('.w-stills picture').length,
      poster: document.querySelector('.w-poster')?.closest('picture')?.querySelector('source')?.getAttribute('srcset') || document.querySelector('.w-poster')?.currentSrc || '',
      mode: document.querySelector('.wohnung')?.classList.contains('is-lite') ? 'lite' : document.querySelector('.wohnung')?.classList.contains('is-plain') ? 'plain' : 'full'
    }));

    let videoOn = false;
    let videoOff = false;
    if (vp.name === 'desktop') {
      await page.waitForFunction(() => {
        const w = document.getElementById('wohnung');
        return w && !w.classList.contains('is-driving') && +w.dataset.frame >= 60;
      }, null, { timeout: 20000 }).catch(() => {});
      await page.waitForTimeout(600);
      const videoOnPromise = page.waitForSelector('video.w-vid.on', { timeout: 5000 }).then(() => true).catch(() => false);
      await fling(page, 3400, 420);
      videoOn = await videoOnPromise;
      if (videoOn) {
        videoOff = await page.waitForFunction(() => !document.querySelector('video.w-vid.on'), null, { timeout: 6000 }).then(() => true).catch(() => false);
      }
    }

    const oldAssets = requested.filter(u => /\/img\/film\/(?:mat\/|s9\/)|\/img\/film\/poster\.jpg(?:\?|$)/.test(u));
    const videoState = vp.name === 'desktop' ? await page.evaluate(() => ({
      videos: [...document.querySelectorAll('video')].map(v => ({
        className: v.className, src: v.currentSrc || v.src, readyState: v.readyState,
        networkState: v.networkState, paused: v.paused,
        error: v.error && { code: v.error.code, message: v.error.message }
      })),
      log: window.__videoLog
    })) : undefined;
    visual.push({ viewport: vp.name, ...dom, videoOn, videoOff, errors, failed, oldAssets, videoState });
    await page.close();
  }

  await browser.close();
  const result = {
    base: BASE,
    routes: http.length,
    routeFailures: http.filter(r => !r.ok),
    visual
  };
  console.log(JSON.stringify(result, null, 2));
  if (result.routeFailures.length || visual.some(v => v.errors.length || v.failed.length || v.oldAssets.length || !v.fx || v.pictures !== 7 || !/poster-v10/.test(v.poster)) || !visual.find(v => v.viewport === 'desktop')?.videoOn || !visual.find(v => v.viewport === 'desktop')?.videoOff) process.exitCode = 1;
})().catch(err => { console.error(err); process.exit(1); });
