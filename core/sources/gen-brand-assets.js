const { chromium } = require('playwright');
const path = require('path');

const ICON_SVG = `
<g transform="translate(44,0)">
  <rect fill="#1C1F22" x="12" y="56" width="22" height="52"/>
  <rect fill="#1C1F22" x="38" y="28" width="22" height="80"/>
  <rect fill="#4A5C6B" x="64" y="42" width="26" height="66"/>
  <polygon fill="#4A5C6B" points="49,4 51.7,11.28 59.46,11.6 53.37,16.42 55.47,23.9 49,19.6 42.53,23.9 44.63,16.42 38.54,11.6 46.3,11.28"/>
</g>`;

const EXE = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

async function shot(html, outfile, w, h) {
  const browser = await chromium.launch({ executablePath: EXE });
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.screenshot({ path: outfile, omitBackground: true });
  await browser.close();
}

async function shotOpaque(html, outfile, w, h) {
  const browser = await chromium.launch({ executablePath: EXE });
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.screenshot({ path: outfile });
  await browser.close();
}

(async () => {
  const OUT = path.join(__dirname, 'site', 'img');

  // favicon-32 / apple-touch-icon(180) / android(512) — transparent PNG, icon only, no padding math needed (viewBox handles it)
  for (const [size, name] of [[32, 'favicon-32.png'], [180, 'apple-touch-icon.png'], [512, 'icon-512.png']]) {
    const html = `<!doctype html><html><body style="margin:0"><svg width="${size}" height="${size}" viewBox="0 0 100 112" xmlns="http://www.w3.org/2000/svg">${ICON_SVG.replace('translate(44,0)','translate(6,0)')}</svg></body></html>`;
    await shot(html, path.join(OUT, name), size, size);
    console.log('wrote', name);
  }

  // apple-touch-icon needs an opaque background per iOS convention (transparent gets black-boxed by iOS)
  {
    const size = 180;
    const html = `<!doctype html><html><body style="margin:0;background:#E8E7E4;display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px">
      <svg width="${Math.round(size*0.72)}" height="${Math.round(size*0.72*1.12)}" viewBox="0 0 100 112" xmlns="http://www.w3.org/2000/svg">${ICON_SVG.replace('translate(44,0)','translate(6,0)')}</svg>
    </body></html>`;
    await shotOpaque(html, path.join(OUT, 'apple-touch-icon.png'), size, size);
    console.log('wrote apple-touch-icon.png (opaque)');
  }

  // OG image 1200x630
  {
    const html = `<!doctype html><html><head>
      <link href="https://fonts.googleapis.com/css2?family=Archivo:wght@700;800&family=Instrument+Sans:wght@400;500&display=swap" rel="stylesheet">
      <style>
        *{margin:0;box-sizing:border-box}
        body{width:1200px;height:630px;background:radial-gradient(130% 160% at 82% 8%,#2A3038,#1C1F22);display:flex;flex-direction:column;align-items:flex-start;justify-content:center;padding:0 92px;font-family:'Instrument Sans',sans-serif;position:relative;overflow:hidden}
        .grain{position:absolute;inset:0;opacity:.05;mix-blend-mode:overlay;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")}
        .wm{display:flex;align-items:center;gap:22px;margin-bottom:38px}
        .word{font-family:'Archivo',sans-serif;font-weight:800;font-size:56px;letter-spacing:-.03em}
        .word b{color:#fff;font-weight:800}
        .word i{color:#99A2A8;font-style:normal;font-weight:800}
        h1{font-family:'Archivo',sans-serif;font-weight:700;font-size:44px;color:#fff;letter-spacing:-.02em;line-height:1.16;max-width:820px}
        p{margin-top:22px;font-size:22px;color:rgba(255,255,255,.68);max-width:640px;line-height:1.5}
        .tags{display:flex;gap:12px;margin-top:36px}
        .tags span{font-size:16px;font-weight:600;color:#E8E7E4;border:1px solid rgba(255,255,255,.22);padding:8px 18px;border-radius:100px}
      </style>
      </head><body>
      <div class="grain"></div>
      <div class="wm">
        <svg width="52" height="58" viewBox="0 0 100 112" xmlns="http://www.w3.org/2000/svg">
          <rect fill="#fff" x="6" y="56" width="22" height="52"/>
          <rect fill="#fff" x="32" y="28" width="22" height="80"/>
          <rect fill="#99A2A8" x="58" y="42" width="26" height="66"/>
          <polygon fill="#99A2A8" points="43,4 45.7,11.28 53.46,11.6 47.37,16.42 49.47,23.9 43,19.6 36.53,23.9 38.63,16.42 32.54,11.6 40.3,11.28"/>
        </svg>
        <span class="word"><b>Bau</b><i>Stern</i></span>
      </div>
      <h1>Sechs Gewerke, ein Ansprechpartner —<br>Renovation &amp; Umbau in der Deutschschweiz</h1>
      <p>Festpreis-Offerte, termintreu. Von der ersten Begehung bis zur Schlüsselübergabe.</p>
      <div class="tags"><span>Zürich &amp; Umgebung</span><span>Werkgarantie 24 Monate</span></div>
      </body></html>`;
    await shotOpaque(html, path.join(OUT, 'og-image.jpg'), 1200, 630);
    console.log('wrote og-image.jpg');
  }
})();
