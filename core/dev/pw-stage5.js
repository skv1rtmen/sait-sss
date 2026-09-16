/* BauStern — core/dev/pw-stage5.js · Abnahmetest Etappe 5 (PLAN-v16-ETAPPE5.md §9)
   Läuft gegen einen lokalen Server:  python3 -m http.server 8123 --bind 127.0.0.1   (aus site/)
   Aufruf:  node core/dev/pw-stage5.js [baseUrl] [--shots]
   Prüft je Kammer: JS-Fehler, To-do-Zeile (erscheint + wird durchgestrichen), Mechanik gebaut,
   keine Überlappung von Karten/To-do/Unterschrift/Sticky-Leiste, und das Ganze in drei Formaten. */
const { chromium } = require('playwright');

const BASE = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'http://127.0.0.1:8123';
const SHOTS = process.argv.includes('--shots');
const SHOT_DIR = '/tmp/pw-shots';
const VIEWPORTS = [
  { name: 'phone',     width: 390,  height: 844,  touch: true,  chapters: 8 },
  { name: 'desktop',   width: 1440, height: 900,  touch: false, chapters: 8 },
  { name: 'landscape', width: 844,  height: 390,  touch: true,  chapters: 3 },
];
/* Kammern mit Mechanik — hier muss #wS5 nach dem Halt Inhalt haben. */
const MECH = { 1: 'six2one', 2: 'takt', 3: 'dusk', 4: 'ablauf', 6: 'wipe', 7: 'clock' };

const overlap = (a, b) => a && b && !(a.right <= b.left || a.left >= b.right || a.bottom <= b.top || a.top >= b.bottom);

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.PW_CHROME || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    headless: true, args: ['--no-sandbox'],
  });
  const report = [];
  let failures = 0;

  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2, hasTouch: vp.touch, isMobile: vp.touch,
    });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push('PAGEERROR ' + String(e).slice(0, 180)));
    page.on('console', m => { if (m.type() === 'error' && !/favicon|analytics|supabase|401/i.test(m.text())) errors.push('CONSOLE ' + m.text().slice(0, 180)); });
    page.on('requestfailed', r => { if (!/analytics|supabase|fonts|favicon/i.test(r.url())) errors.push('REQ ' + r.url().split('/').pop() + ' ' + (r.failure()?.errorText || '')); });

    await page.goto(BASE + '/index.html?v=' + Date.now(), { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1400);

    const advance = async () => {
      if (vp.touch) {
        await page.evaluate(() => {
          const el = document.elementFromPoint(innerWidth / 2, innerHeight * 0.5) || document.body;
          const mk = (x, y) => new Touch({ identifier: Date.now(), target: el, clientX: x, clientY: y, pageX: x, pageY: y });
          const fire = (type, x, y) => { const t = mk(x, y); el.dispatchEvent(new TouchEvent(type, { bubbles: true, cancelable: true, touches: type === 'touchend' ? [] : [t], changedTouches: [t], targetTouches: type === 'touchend' ? [] : [t] })); };
          const cx = innerWidth / 2;
          fire('touchstart', cx, innerHeight * 0.72); fire('touchmove', cx, innerHeight * 0.58);
          fire('touchmove', cx, innerHeight * 0.44); fire('touchmove', cx, innerHeight * 0.34);
          fire('touchend', cx, innerHeight * 0.34);
        });
      } else {
        await page.mouse.wheel(0, 400);
      }
      await page.waitForTimeout(3000);
    };

    for (let k = 0; k < vp.chapters; k++) {
      if (k > 0) await advance();
      await page.waitForTimeout(2600);              /* Demo + To-do-Animation abwarten */

      const info = await page.evaluate(() => {
        const R = el => { if (!el) return null; const r = el.getBoundingClientRect(); return r.width && r.height ? { left: r.left, top: r.top, right: r.right, bottom: r.bottom } : null; };
        const W = document.getElementById('wohnung');
        const s5 = document.getElementById('wS5');
        const todo = document.querySelector('#wOv .w-todo');
        const chapT = document.querySelector('.v16-chap-t');
        const kicker = document.querySelector('#wOv .w-kicker-t');
        const sig = document.getElementById('wSig');
        const sticky = document.getElementById('stickycall');
        return {
          ch: window.Film16 ? Film16.ch : -1,
          room: chapT ? chapT.textContent.trim() : '',
          kicker: kicker ? kicker.textContent.trim() : '',
          s5Children: s5 ? s5.children.length : -1,
          s5Class: s5 ? s5.className : '',
          todoText: todo ? todo.textContent.trim() : '',
          todoStruck: !!(todo && todo.classList.contains('is-struck')),
          todoDone: !!(todo && todo.classList.contains('is-done')),
          strikeW: (() => { const i = document.querySelector('#wOv .w-todo s i'); return i ? Math.round(i.getBoundingClientRect().width) : -1; })(),
          pins: document.querySelectorAll('#wHot .w-hs').length,
          planVisible: (() => { const p = document.getElementById('wPlan'); return p ? getComputedStyle(p).display !== 'none' : false; })(),
          descVisible: (() => { const d = document.querySelector('#wOv .w-d'); return d ? getComputedStyle(d).display !== 'none' : false; })(),
          callVisible: (() => { const c = document.querySelector('#stickycall .call'); return c ? getComputedStyle(c).display !== 'none' : false; })(),
          badge: (() => { const b = document.querySelector('.s5-akte-badge'); return b && !b.hidden ? b.textContent.trim() : ''; })(),
          rects: {
            cards: Array.from(document.querySelectorAll('#wS5 .s5-card.show, #wS5 .s5-card-hub, #wS5 .s5-card-clock')).map(R).filter(Boolean),
            notes: Array.from(document.querySelectorAll('#wS5 .s5-note')).map(R).filter(Boolean),
            todo: R(todo), sig: sig && !sig.hidden ? R(sig) : null, sticky: R(sticky),
            ov: R(document.getElementById('wOv')),
          },
          vw: innerWidth, vh: innerHeight,
        };
      });

      const issues = [];
      const mech = MECH[info.ch];
      if (mech && info.s5Children < 1) issues.push(`Mechanik «${mech}» nicht gebaut (#wS5 leer)`);
      if (info.ch > 0) {
        if (!info.todoText) issues.push('To-do-Zeile fehlt');
        else if (!info.todoDone) issues.push('To-do-Zeile nicht fertig animiert');
        else if (info.strikeW === 0) issues.push('Durchstreichung nicht gezeichnet');
        if (mech && info.pins > 0) issues.push(`${info.pins} Pins trotz Mechanik`);
      }
      if (vp.name === 'phone') {
        if (info.planVisible) issues.push('Grundriss auf dem Telefon sichtbar');
        if (info.descVisible) issues.push('Beschreibung auf dem Telefon sichtbar');
        if (info.callVisible) issues.push('«Anrufen» auf dem Telefon sichtbar');
      }
      /* Überlappungen: Karten dürfen weder Text noch Bedienelemente verdecken. */
      const r = info.rects;
      r.cards.forEach((c, i) => {
        if (overlap(c, r.todo)) issues.push(`Karte ${i} über To-do-Zeile`);
        if (overlap(c, r.sticky)) issues.push(`Karte ${i} über Sticky-Leiste`);
        if (r.sig && overlap(c, r.sig)) issues.push(`Karte ${i} über Unterschrift`);
        if (c.left < -2 || c.right > info.vw + 2) issues.push(`Karte ${i} ausserhalb des Bildes`);
      });
      r.notes.forEach((n, i) => {
        if (n.left < -2 || n.right > info.vw + 2) issues.push(`Zettel ${i} ausserhalb des Bildes`);
      });
      if (r.sig && overlap(r.sig, r.todo)) issues.push('Unterschrift über To-do-Zeile');
      if (r.sig && overlap(r.sig, r.sticky)) issues.push('Unterschrift über Sticky-Leiste');

      if (errors.length) issues.push(...errors.splice(0, errors.length));
      if (issues.length) failures += issues.length;
      report.push({ vp: vp.name, ch: info.ch, room: info.room, kicker: info.kicker, todo: info.todoText.slice(0, 60), badge: info.badge, issues });
      if (SHOTS) await page.screenshot({ path: `${SHOT_DIR}/s5_${vp.name}_${String(k).padStart(2, '0')}.png` });
    }
    await ctx.close();
  }
  await browser.close();

  let out = '';
  report.forEach(r => {
    const flag = r.issues.length ? '✗' : '✓';
    out += `${flag} ${r.vp.padEnd(9)} K${r.ch} ${String(r.room).padEnd(12)} «${r.kicker}»  ${r.todo}\n`;
    r.issues.forEach(i => out += `    → ${i}\n`);
  });
  out += `\n${failures ? failures + ' Befund(e)' : 'ALLES GRÜN'}\n`;
  console.log(out);
  process.exit(failures ? 1 : 0);
})();
