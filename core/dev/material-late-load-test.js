const { chromium } = require('playwright');
const assert = require('assert/strict');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  let release;
  const ready = new Promise(resolve => { release = resolve; });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    let delayedRequests = 0;
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/mat5/*.webp', async route => {
      delayedRequests++;
      await ready;
      await route.continue();
    });
    const base = process.env.BASE || 'http://localhost:8099';
    await page.goto(base + '/?nolenis', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);
    await page.evaluate(() => {
      const room = document.querySelectorAll('.w-room')[5];
      scrollTo(0, room.getBoundingClientRect().top + scrollY + room.offsetHeight * .78);
      ScrollTrigger.update();
    });
    // Let inertia and the render loop settle before the CDN images can finish.
    await page.waitForTimeout(4000);
    assert(delayedRequests >= 7, 'The material images were not intercepted');
    assert.notEqual(await page.locator('#wohnung').getAttribute('data-material-renderer'), 'compositor');
    release();
    // No scroll, pointer input, or resize may be used to wake the renderer here.
    await page.waitForFunction(() => document.querySelector('#wohnung').dataset.materialRenderer === 'compositor');
    assert.equal(await page.locator('.w-material:not([hidden]) img').count(), 2);
    assert.equal(await page.locator('.w-canvas').evaluate(el => getComputedStyle(el).visibility), 'hidden');
    assert.deepEqual(errors, []);
    fs.writeFileSync(process.env.REPORT || 'reports/material-late-load.json', JSON.stringify({ base, delayedRequests, wakeWithoutInput: true, errors }, null, 2));
    console.log('MATERIAL LATE-LOAD PASS');
  } finally {
    release();
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
