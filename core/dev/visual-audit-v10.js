const { chromium } = require('playwright');
const path = require('path');

const BASE = process.env.BASE || 'http://localhost:8099';
const EXE = process.env.CHROME || undefined;
const out = path.join(__dirname, 'reports', 'visual-v10');

async function ready(page, url) {
  await page.goto(BASE + url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);
}

(async () => {
  const browser = await chromium.launch({ executablePath: EXE });
  const errors = [];

  const mobile = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true });
  const m = await mobile.newPage();
  m.on('pageerror', e => errors.push('mobile: ' + e.message));
  await ready(m, '/');
  await m.screenshot({ path: path.join(out, 'mobile-home.png') });
  await m.click('#burger');
  await m.waitForTimeout(450);
  await m.screenshot({ path: path.join(out, 'mobile-menu.png') });
  await m.press('body', 'Escape');
  for (const [selector, name] of [['#versprechen', 'mobile-versprechen'], ['#richtwert', 'mobile-richtwert']]) {
    await m.locator(selector).scrollIntoViewIfNeeded();
    await m.waitForTimeout(700);
    await m.screenshot({ path: path.join(out, name + '.png') });
  }
  await ready(m, '/kontakt');
  await m.screenshot({ path: path.join(out, 'mobile-kontakt.png') });
  await m.locator('#anfrage').scrollIntoViewIfNeeded().catch(() => {});
  await m.waitForTimeout(500);
  await m.screenshot({ path: path.join(out, 'mobile-form.png') });
  await ready(m, '/projekt/atlant-komplettausbau');
  await m.screenshot({ path: path.join(out, 'mobile-projekt.png') });
  await mobile.close();

  const landscape = await browser.newContext({ viewport: { width: 812, height: 375 }, isMobile: true, hasTouch: true });
  const l = await landscape.newPage();
  l.on('pageerror', e => errors.push('landscape: ' + e.message));
  await ready(l, '/');
  await l.screenshot({ path: path.join(out, 'mobile-landscape-home.png') });
  await landscape.close();

  const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const d = await desktop.newPage();
  d.on('pageerror', e => errors.push('desktop: ' + e.message));
  await ready(d, '/?nolenis');
  await d.waitForTimeout(4200);
  for (const [index, name] of [[2, 'desktop-bad'], [4, 'desktop-rueckblende']]) {
    const room = d.locator('.w-room').nth(index);
    await room.scrollIntoViewIfNeeded();
    await d.evaluate(i => {
      const r = document.querySelectorAll('.w-room')[i];
      window.scrollTo(0, r.offsetTop + r.offsetHeight * .48);
    }, index);
    await d.waitForTimeout(2300);
    await d.screenshot({ path: path.join(out, name + '.png') });
  }
  await desktop.close();
  await browser.close();
  console.log(JSON.stringify({ errors, out }, null, 2));
  if (errors.length) process.exitCode = 1;
})().catch(e => { console.error(e); process.exit(1); });
