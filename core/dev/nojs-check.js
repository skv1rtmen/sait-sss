const { chromium } = require('playwright');
const EXE = process.env.CHROME || undefined;
(async () => {
  const browser = await chromium.launch({ executablePath: EXE });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
  const page = await ctx.newPage();
  for (const u of ['/leistungen/sanitaer','/','/kontakt']) {
    await page.goto('http://localhost:8099'+u, { waitUntil: 'load' });
    const info = await page.evaluate(() => ({ title: document.title, h1: (document.querySelector('#view h1')||{}).textContent, textLen: document.getElementById('view').innerText.length, canon: document.querySelector('link[rel=canonical]').href, pre: !!document.getElementById('pre') }));
    console.log(u, JSON.stringify(info));
    await page.screenshot({ path: 'nojs'+u.replace(/\//g,'_')+'.png' });
  }
  await browser.close();
})();
