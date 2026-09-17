/* BauStern — Abnahme Etappe 8 (PLAN-v16-ETAPPE8.md §7)
   Prüft alle sieben Kapitel in vier Formaten: Fehler in der Konsole, Überschneidungen der Karte mit
   Kapitelmarke/Überschrift/To-do/Grundriss/Sticky, Timing des Durchstreichens, jede Mechanik einzeln
   und das Ende des Rundgangs. Aufruf: node core/dev/pw-stage8.js [filter]
   Server:  cd site && python3 -m http.server 8123   */
const { chromium } = require('playwright');
const fs = require('fs');
const BASE = 'http://127.0.0.1:8123/index.html';
const SHOTS = __dirname + '/shots/etappe8';
fs.mkdirSync(SHOTS, { recursive: true });

const VPS = [
  { id: 'phone',     width: 390,  height: 844, touch: true  },
  { id: 'air',       width: 1470, height: 956, touch: false },
  { id: 'desktop',   width: 1440, height: 900, touch: false },
  { id: 'landscape', width: 844,  height: 390, touch: true  },
];
const CH = ['Ankunft', 'Schwelle', 'Küche', 'Bad', 'Schlaf', 'Wohnen', 'Eingang'];
const fails = [];
const only = process.argv[2];
const fail = (vp, k, msg) => { fails.push(`${vp} · ${k} · ${msg}`); };

const rectsOverlap = (a, b) => a && b && a.w > 0 && a.h > 0 && b.w > 0 && b.h > 0 &&
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', headless: true, args: ['--no-sandbox'] });
  for (const vp of VPS) {
    if (only && !vp.id.startsWith(only)) continue;
    const ctx = await b.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 2, hasTouch: vp.touch, isMobile: vp.touch });
    const p = await ctx.newPage();
    const errs = [];
    p.on('pageerror', e => errs.push('PAGEERROR ' + String(e).slice(0, 180)));
    p.on('console', m => { if (m.type() === 'error' && !/favicon|analytics|supabase|401|ERR_ABORTED/i.test(m.text())) errs.push('CONSOLE ' + m.text().slice(0, 160)); });
    await p.goto(BASE + '?v=' + Date.now(), { waitUntil: 'networkidle', timeout: 35000 });
    await p.waitForTimeout(1600);

    /* §7.3 — sieben Kapitel überall */
    const nav = await p.evaluate(() => ({
      dots: document.querySelectorAll('.v16-chap-p i').length,
      rooms: document.querySelectorAll('#wRoomNav .w-roomnav-dot').length,
      N: window.Film16 ? Film16.N : -1,
    }));
    if (nav.dots !== 7) fail(vp.id, 'nav', `Fortschrittspunkte ${nav.dots} statt 7`);
    if (nav.rooms !== 7) fail(vp.id, 'nav', `Raumpunkte ${nav.rooms} statt 7`);
    if (nav.N !== 7) fail(vp.id, 'nav', `Film16.N ${nav.N} statt 7`);

    for (let k = 0; k < 7; k++) {
      await p.evaluate(ch => Film16.go(ch), k);
      await p.waitForFunction(ch => window.Film16 && Film16.ch === ch && Film16.phase === 'HOLD', k, { timeout: 30000 });
      const t0 = Date.now();
      await p.waitForTimeout(2000);

      /* §7.5 — Durchstreichen frühestens nach 2,5 s */
      const early = await p.evaluate(() => { const t = document.querySelector('#wOv .w-todo'); return t ? t.className : ''; });
      if (k > 0 && /is-struck/.test(early) && Date.now() - t0 < 2400) fail(vp.id, CH[k], 'To-do zu früh durchgestrichen');
      await p.waitForTimeout(1600);
      const late = await p.evaluate(() => { const t = document.querySelector('#wOv .w-todo'); return { cls: t ? t.className : '', txt: t ? t.textContent.trim() : '' }; });
      if (k > 0 && late.txt && !/is-struck/.test(late.cls)) fail(vp.id, CH[k], 'To-do nach 3,6 s nicht durchgestrichen');

      /* §7.2 — Karte kollidiert mit nichts */
      const hit = await p.evaluate(() => {
        const vis = e => e && getComputedStyle(e).visibility !== 'hidden' && +getComputedStyle(e).opacity > .05
          && getComputedStyle(e).display !== 'none';
        const R = s => { const e = document.querySelector(s); if (!vis(e)) return null; const r = e.getBoundingClientRect();
          return (r.width && r.height) ? { x: r.left, y: r.top, w: r.width, h: r.height } : null; };
        /* Text wird über die Zeilenkästen gemessen: die Spalte ist breit, die Zeile nicht. */
        const T = s => { const e = document.querySelector(s); if (!vis(e) || !e.textContent.trim()) return null;
          const rg = document.createRange(); rg.selectNodeContents(e); const rs = [...rg.getClientRects()].filter(r => r.width && r.height);
          if (!rs.length) return null;
          const x = Math.min(...rs.map(r => r.left)), y = Math.min(...rs.map(r => r.top));
          return { x, y, w: Math.max(...rs.map(r => r.right)) - x, h: Math.max(...rs.map(r => r.bottom)) - y }; };
        /* gemessen werden alle sichtbaren Teile der Karte (Slot, Stapel, Karte selbst) */
        const clip = e => { let r = e.getBoundingClientRect(), x1 = r.left, y1 = r.top, x2 = r.right, y2 = r.bottom;
          for (let a = e.parentElement; a && a !== document.body; a = a.parentElement) {
            if (getComputedStyle(a).overflow === 'visible') continue;
            const ar = a.getBoundingClientRect();
            x1 = Math.max(x1, ar.left); y1 = Math.max(y1, ar.top); x2 = Math.min(x2, ar.right); y2 = Math.min(y2, ar.bottom);
          }
          return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 }; };
        const slots = [...document.querySelectorAll('#wS5 .s5-slot, #wS5 .s5-stack, #wS5 .s5-card2')].map(e => {
          if (!vis(e)) return null; const r = clip(e);
          return (r.w > 1 && r.h > 1) ? r : null; }).filter(Boolean);
        return { slots, others: { h: T('#wOv .w-h'), todo: T('#wOv .w-todo'), chap: R('.v16-chap'), dots: R('.v16-chap-p'), plan: R('#wPlan'), sticky: R('#stickycall'), nav: R('#nav') } };
      });
      hit.slots.forEach(s => Object.entries(hit.others).forEach(([name, o]) => {
        if (rectsOverlap(s, o)) fail(vp.id, CH[k], `Karte überschneidet ${name}`);
      }));

      /* §7.4 — Grundriss unter den Punkten */
      if (!vp.touch) {
        const g = await p.evaluate(() => {
          const d = document.querySelector('.v16-chap-p'), pl = document.querySelector('#wPlan');
          if (!d || !pl || getComputedStyle(pl).display === 'none') return null;
          const a = d.getBoundingClientRect(), c = pl.getBoundingClientRect();
          return { gap: c.top - a.bottom, dr: a.right, pr: c.right };
        });
        if (g && g.gap < 8) fail(vp.id, CH[k], `Grundriss zu nah an den Punkten (${Math.round(g.gap)} px)`);
        if (g && Math.abs(g.dr - g.pr) > 3) fail(vp.id, CH[k], `Grundriss nicht bündig (${Math.round(g.dr - g.pr)} px)`);
      }

      /* Mechaniken einzeln */
      if (k === 1) {   /* §7.6 Schwelle */
        await p.waitForFunction(() => { const c = document.querySelector('.s5-push'); return c && +getComputedStyle(c).opacity > .9; },
          null, { timeout: 12000 }).catch(() => {});
        await p.waitForTimeout(700);
        const s = await p.evaluate(() => {
          const one = document.querySelector('.s5-push'), notes = [...document.querySelectorAll('.s5-note2')];
          return { one: one ? +getComputedStyle(one).opacity : -1,
            notes: notes.map(n => +getComputedStyle(n).opacity).filter(o => o > .05).length,
            tel: !!document.querySelector('.s5-push a[href^="tel:"]') };
        });
        if (s.one < .9) fail(vp.id, CH[k], 'finale Karte nicht sichtbar');
        if (s.notes) fail(vp.id, CH[k], `${s.notes} Meldungen noch sichtbar`);
        if (!s.tel) fail(vp.id, CH[k], 'Rückruf-Knopf fehlt');
      }
      if (k === 2) {   /* §7.7 Küche */
        const pins = await p.$$('#wS5 .s5-pin');
        if (pins.length !== 3) fail(vp.id, CH[k], `${pins.length} Marken statt 3`);
        else {
          await pins[2].click({ force: true });
          await p.waitForTimeout(500);
          const s = await p.evaluate(() => {
            const c = document.querySelector('.s5-takt2'), sp = document.querySelector('.s5-spot');
            return { txt: c ? c.textContent : '', spot: sp ? { l: parseFloat(sp.style.left), t: parseFloat(sp.style.top), on: sp.classList.contains('is-on') } : null };
          });
          if (!/Takt 3 von 3/i.test(s.txt)) fail(vp.id, CH[k], 'Karte schaltet nicht auf Takt 3');
          if (!s.spot || !s.spot.on) fail(vp.id, CH[k], 'Lichtfeld nicht aktiv');
        }
      }
      if (k === 4) {   /* §7.8 Schlaf */
        const chBefore = await p.evaluate(() => Film16.ch);
        await p.evaluate(() => { const li = document.querySelectorAll('.s5-steps li')[1]; li && li.querySelector('button').click(); });
        await p.waitForTimeout(400);
        const s = await p.evaluate(() => ({
          on: [...document.querySelectorAll('.s5-steps li')].findIndex(l => l.classList.contains('is-on')),
          card: !!document.querySelector('.s5-abl2'),
        }));
        if (!s.card) fail(vp.id, CH[k], 'Bauzeitplan-Karte fehlt');
        if (s.on !== 1) fail(vp.id, CH[k], 'Zeile 02 wird nicht aktiv');
        await p.evaluate(() => { const c = document.querySelector('.s5-abl2'); const r = c.getBoundingClientRect();
          c.dispatchEvent(new WheelEvent('wheel', { deltaY: 120, bubbles: true, cancelable: true, clientX: r.left + 20, clientY: r.top + 20 })); });
        await p.waitForTimeout(700);
        if (await p.evaluate(() => Film16.ch) !== chBefore) fail(vp.id, CH[k], 'Rad in der Karte wechselt das Kapitel');
      }
      if (k === 5) {   /* §7.9 Wohnen */
        const s0 = await p.evaluate(() => ({ feed: !!document.querySelector('.s5-feed'), hs: document.querySelectorAll('#wHot .w-hs').length }));
        if (!s0.feed) fail(vp.id, CH[k], 'Wochen-Update fehlt');
        if (s0.hs) fail(vp.id, CH[k], `${s0.hs} alte Pins in Wohnen`);
        const wk = () => p.evaluate(() => (document.querySelector('.s5-feed').textContent.match(/Woche \d/) || [''])[0]);
        const w0 = await wk();
        await p.evaluate(() => document.querySelector('.s5-feed').click());
        await p.waitForTimeout(500);
        const w1 = await wk();
        if (!w1 || w1 === w0) fail(vp.id, CH[k], `Wochenwechsel geht nicht (${w0} → ${w1})`);
        /* Halten → Rohbau */
        const chBefore = await p.evaluate(() => Film16.ch);
        const box = { x: vp.width * 0.35, y: vp.height * 0.62 };
        await p.mouse.move(box.x, box.y); await p.mouse.down();
        await p.waitForTimeout(1500);
        const rohOn = await p.evaluate(() => { const r = document.querySelector('.s5-roh'); return r ? +getComputedStyle(r).opacity : -1; });
        await p.mouse.up(); await p.waitForTimeout(900);
        const rohOff = await p.evaluate(() => { const r = document.querySelector('.s5-roh'); return r ? +getComputedStyle(r).opacity : -1; });
        if (rohOn < .5) fail(vp.id, CH[k], `Rückblende blendet nicht ein (${rohOn})`);
        if (rohOff > .05) fail(vp.id, CH[k], `Rückblende bleibt stehen (${rohOff})`);
        if (await p.evaluate(() => Film16.ch) !== chBefore) fail(vp.id, CH[k], 'Halten wechselt das Kapitel');
      }
      if (k === 6) {   /* §7.10 Eingang */
        const s = await p.evaluate(() => {
          const c = document.querySelector('.s5-prot');
          return { txt: c ? c.textContent.toUpperCase() : '', sig: !!document.querySelector('.s5-prot svg.sig'),
            calc: !!document.querySelector('.s5-slot [data-s5="calc"]'), offer: !!document.querySelector('.s5-slot [data-s5="offer"]') };
        });
        if (!/ÜBERGABEPROTOKOLL/.test(s.txt)) fail(vp.id, CH[k], 'Protokoll-Karte fehlt');
        if (!s.sig) fail(vp.id, CH[k], 'Unterschrift nicht in der Karte');
        if (!s.calc) fail(vp.id, CH[k], 'Rechner-Knopf fehlt');
        if (!vp.touch && !s.offer) fail(vp.id, CH[k], 'Offerte-Knopf fehlt (Desktop)');
      }
      if (k === 3) {   /* §7.11 Bad */
        if (vp.touch && vp.width < 800) {
          await p.waitForFunction(() => !document.querySelector('.s5-tapring'), null, { timeout: 8000 }).catch(() => {});
          await p.waitForTimeout(400);
          const sw = await p.$('.s5-switch');
          if (!sw) fail(vp.id, CH[k], 'Lichtschalter fehlt');
          else {
            await sw.click({ force: true }); await p.waitForTimeout(1100);
            const s = await p.evaluate(() => ({ pressed: document.querySelector('.s5-switch').getAttribute('aria-pressed'),
              dusk: +getComputedStyle(document.querySelector('.s5-dusk')).opacity }));
            if (s.pressed !== 'true') fail(vp.id, CH[k], 'Schalter schaltet nicht');
            if (s.dusk < .9) fail(vp.id, CH[k], 'Abendbild nicht sichtbar');
          }
        } else {
          const grip = await p.$('.s5-wipe-grip');
          if (!grip) fail(vp.id, CH[k], 'Regler-Griff fehlt');
          else {
            await p.evaluate(() => getSelection().removeAllRanges());
            const bb = await grip.boundingBox();
            await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
            await p.mouse.down();
            await p.mouse.move(bb.x + bb.width / 2 + 220, bb.y + bb.height / 2, { steps: 12 });
            await p.mouse.up();
            await p.waitForTimeout(300);
            const s = await p.evaluate(() => ({ x: parseFloat(getComputedStyle(document.querySelector('.s5-dusk')).getPropertyValue('--x')) || 0,
              sel: String(getSelection()) }));
            if (s.x < 10) fail(vp.id, CH[k], `Regler bewegt sich nicht (--x=${s.x})`);
            if (s.sel.length) fail(vp.id, CH[k], 'Ziehen markiert die Seite');
          }
        }
      }
      await p.screenshot({ path: `${SHOTS}/${vp.id}_${k}_${CH[k]}.png` });
    }

    /* Wischkette (Abnahme 17.09): eine Karte darf den Kapitelwechsel nie schlucken — der Bauzeitplan tat
       genau das, weil er auf dem Telefon in der Bildmitte liegt. */
    if (vp.touch) {
      await p.evaluate(() => { Film16.enter(); Film16.go(0); });
      await p.waitForFunction(() => Film16.ch === 0 && Film16.phase === 'HOLD', null, { timeout: 25000 });
      await p.waitForTimeout(1200);
      for (let i = 0; i < 6; i++) {
        await p.evaluate(() => {
          const el = document.elementFromPoint(innerWidth / 2, innerHeight * 0.5) || document.body;
          const mk = (x, y) => new Touch({ identifier: Date.now(), target: el, clientX: x, clientY: y, pageX: x, pageY: y });
          const f = (t, x, y) => { const tt = mk(x, y); el.dispatchEvent(new TouchEvent(t, { bubbles: true, cancelable: true,
            touches: t === 'touchend' ? [] : [tt], changedTouches: [tt], targetTouches: t === 'touchend' ? [] : [tt] })); };
          const cx = innerWidth / 2;
          f('touchstart', cx, innerHeight * 0.72); f('touchmove', cx, innerHeight * 0.55);
          f('touchmove', cx, innerHeight * 0.38); f('touchend', cx, innerHeight * 0.38);
        });
        await p.waitForTimeout(4200);
      }
      const endCh = await p.evaluate(() => Film16.ch);
      if (endCh !== 6) fail(vp.id, 'Wischkette', `nach 6 Wischern in Kapitel ${endCh} statt 6 — eine Karte schluckt den Wisch`);
    } else {
      await p.evaluate(() => { Film16.enter(); Film16.go(6); });
      await p.waitForFunction(() => Film16.ch === 6 && Film16.phase === 'HOLD', null, { timeout: 25000 });
      await p.waitForTimeout(1200);
    }

    /* §7.12 — Ende des Rundgangs */
    await p.evaluate(() => Film16.next());
    await p.waitForTimeout(2000);
    const end = await p.evaluate(() => {
      const e = document.getElementById('ende');
      if (!e) return { miss: true };
      const r = e.getBoundingClientRect(), cs = getComputedStyle(e);
      const st = document.getElementById('wStage'), sr = st.getBoundingClientRect();
      return { top: r.top, bg: cs.backgroundColor, stageVisible: sr.bottom > r.top + 10 && +getComputedStyle(st).opacity > .05,
        stamp: !!e.querySelector('.ende-stamp'), sig: !!e.querySelector('.ende-sig svg'),
        cards: e.querySelectorAll('.ende-grid > div').length,
        cardBg: e.querySelector('.ende-sheet') ? getComputedStyle(e.querySelector('.ende-sheet')).backgroundColor : '' };
    });
    if (end.miss) fail(vp.id, 'Ende', '#ende fehlt');
    else {
      if (/rgba\(0, 0, 0, 0\)|transparent/.test(end.bg)) fail(vp.id, 'Ende', 'Sektion ist durchsichtig');
      if (end.cards !== 4) fail(vp.id, 'Ende', `${end.cards} Versprechen statt 4`);
      if (!end.sig) fail(vp.id, 'Ende', 'Unterschrift fehlt');
      if (!end.stamp) fail(vp.id, 'Ende', 'Stempel fehlt');
      if (/rgba\(0, 0, 0, 0\)|transparent/.test(end.cardBg)) fail(vp.id, 'Ende', 'Blatt ohne Fläche');
    }
    await p.screenshot({ path: `${SHOTS}/${vp.id}_7_Ende.png` });
    /* Weiter runter: die Sektionen unter dem Film müssen wieder normal hell sein (§5) */
    await p.evaluate(() => { const t = document.getElementById('works'); if (t) t.scrollIntoView(); });
    await p.waitForTimeout(900);
    await p.screenshot({ path: `${SHOTS}/${vp.id}_8_Danach.png` });
    const after = await p.evaluate(() => {
      const s = document.querySelector('.w-sheet'); if (!s) return null;
      const cs = getComputedStyle(s);
      return { color: cs.color, glass: !!document.querySelector('.w-glass') };
    });
    if (after && /255, 255, 255/.test(after.color)) fail(vp.id, 'Danach', 'Blatt schreibt noch weiss auf hell');
    if (after && after.glass) fail(vp.id, 'Danach', 'Glasplatte im v16-Film');

    errs.slice(0, 6).forEach(e => fail(vp.id, 'JS', e));
    console.log(`— ${vp.id}: fertig`);
    await ctx.close();
  }
  await b.close();
  console.log('');
  if (fails.length) { console.log('FEHLER (' + fails.length + '):'); fails.forEach(f => console.log(' ✗ ' + f)); process.exit(1); }
  console.log('ALLES GRÜN');
})();
