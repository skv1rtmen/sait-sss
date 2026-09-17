/* Mockups Etappe 8 — Overlays auf der echten Bühne (Film16), pro Kapitel Desktop + Phone. */
const { chromium } = require('playwright');
const fs = require('fs');
const OUT = '/tmp/mock/out'; fs.mkdirSync(OUT, { recursive: true });
const VPS = {
  desktop: { width: 1470, height: 956, touch: false },
  phone:   { width: 390,  height: 844, touch: true  },
};
const SIG = fs.readFileSync('/home/claude/sait-sss/site/index.html', 'utf8').match(/<svg class="sig"[\s\S]*?<\/svg>/)[0]
  .replace(/style="[^"]*"/g, '');

const BASE_CSS = `
#mock{position:fixed;inset:0;z-index:80;pointer-events:none;font-family:'Instrument Sans',system-ui,sans-serif;color:#fff;
  --br:#D6B685;--ink:rgba(14,18,22,.80);--blue:#6FA3F2;--k:1}
#mock *{box-sizing:border-box}
#mock .slot{position:absolute;right:6%;top:37%;width:400px}
#mock .card{background:var(--ink);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-radius:12px;
  box-shadow:inset 0 0 0 1.5px var(--br),0 18px 50px rgba(0,0,0,.5);padding:18px 20px 18px;position:relative}
#mock .k{font-family:'Archivo',system-ui,sans-serif;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--br);font-weight:600}
#mock .t{font-family:'Archivo',system-ui,sans-serif;font-weight:600;letter-spacing:-.02em;font-size:22px;line-height:1.1;margin-top:6px}
#mock .s{font-size:14.5px;line-height:1.5;color:rgba(255,255,255,.78);margin-top:8px}
#mock .btn{display:inline-flex;align-items:center;gap:10px;border-radius:999px;padding:11px 18px;font-weight:600;font-size:14.5px;
  background:var(--br);color:#14181c;margin-top:14px}
#mock .btn.line{background:transparent;color:#fff;box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.55)}
#mock .hint{position:absolute;font-size:11.5px;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.7);
  font-family:'Archivo',system-ui,sans-serif;font-weight:600}
#mock .pin{position:absolute;width:30px;height:30px;border-radius:50%;background:var(--ink);box-shadow:inset 0 0 0 1.5px var(--br),0 6px 18px rgba(0,0,0,.5);
  display:grid;place-items:center;font-family:'Archivo',system-ui,sans-serif;font-weight:700;font-size:12px;transform:translate(-50%,-50%);color:var(--br)}
#mock .pin.on{background:var(--br);color:#14181c;box-shadow:0 0 0 6px rgba(214,182,133,.25),0 6px 18px rgba(0,0,0,.5)}
#mock .pin.done{color:rgba(255,255,255,.7);box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.35)}
#mock .spot{position:absolute;width:38vw;height:38vw;max-width:520px;max-height:520px;border-radius:50%;transform:translate(-50%,-50%);
  background:radial-gradient(circle,rgba(255,231,184,.34),rgba(255,231,184,.12) 38%,transparent 66%);mix-blend-mode:screen}
@media(max-width:760px){
  #mock .slot{left:16px;right:16px;top:186px;width:auto}
  #mock .card{padding:16px 16px 16px}
  #mock .t{font-size:19px}
  #mock .s{font-size:13.5px}
  #mock .spot{width:70vw;height:70vw}
  #mock .slot>.hint{top:auto!important;bottom:-24px}
}
`;

/* ---------- 1 · Schwelle ---------- */
const NOTES = [
  ['M','Maler','verpasster Anruf · 09:12','Kommen wir Di oder Mi? Gipser noch nicht fertig.'],
  ['S','Sanitär','SMS · 09:40','Armatur nicht lieferbar, Alternative?'],
  ['E','Elektro','verpasster Anruf · 10:05','Rechnung 2/6 offen — Rückruf bitte.'],
  ['R','Rückbau','WhatsApp · 10:31','Wiegeschein fehlt für die Mulde.'],
  ['P','Plattenleger','verpasster Anruf · 11:18','Wer macht die Abdichtung?'],
  ['H','Schreiner','E-Mail · 11:52','Lieferung 3 Wochen verschoben.'],
];
const CSS_S1 = `
#mock .stack{position:relative;height:530px}
#mock .slot.st{top:27%}
#mock .note{position:absolute;left:0;right:0;background:rgba(20,24,28,.86);backdrop-filter:blur(10px);border-radius:12px;padding:11px 14px;
  display:grid;grid-template-columns:34px 1fr auto;gap:12px;align-items:center;box-shadow:0 10px 30px rgba(0,0,0,.45),inset 0 0 0 1px rgba(255,255,255,.08)}
#mock .note .av{width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.12);display:grid;place-items:center;font-family:'Archivo';font-weight:700;color:rgba(255,255,255,.85)}
#mock .note b{display:block;font-size:14px}
#mock .note i{display:block;font-style:normal;font-size:12.5px;color:rgba(255,255,255,.62);margin-top:2px}
#mock .note em{font-style:normal;font-size:11px;color:#F28B82;font-family:'Archivo';font-weight:600;letter-spacing:.06em}
#mock .note .dot{width:8px;height:8px;border-radius:50%;background:#F28B82;justify-self:end}
#mock .ghost{position:absolute;left:14px;right:14px;height:56px;border-radius:12px;background:rgba(20,24,28,.6);box-shadow:inset 0 0 0 1px rgba(255,255,255,.06)}
#mock .one .card .av{width:38px;height:38px;border-radius:10px;background:#2F6BFF;display:grid;place-items:center;font-family:'Archivo';font-weight:800;color:#fff}
#mock .one .row{display:flex;gap:12px;align-items:center}
@media(max-width:760px){#mock .note i{display:none}#mock .slot.st{top:186px}#mock .stack{height:360px}#mock .note{padding:9px 12px}#mock .note b{font-size:13px}#mock .note i{font-size:12px}}
`;
const S1A = (vp)=>`<div class="slot st"><div class="stack">${NOTES.map((n,i)=>{
  const top = i*(vp==='phone'?62:86), rot = [-2.5,2,-1.5,2.5,-2,1.5][i], dx = [0,10,-8,6,-10,8][i];
  return `<div class="note" style="top:${top}px;transform:translate(${dx}px,0) rotate(${rot}deg);z-index:${10-i}">
    <span class="av">${n[0]}</span><span><b>${n[1]}</b><em>${n[2]}</em><i>${n[3]}</i></span><span class="dot"></span></div>`;}).join('')}
  </div><div class="hint" style="left:0;top:-26px">Halten — sechs Baustellen-Chats</div></div>`;
const S1B = `<div class="slot one">
  <div class="ghost" style="top:-18px;opacity:.5"></div><div class="ghost" style="top:-9px;left:7px;right:7px;opacity:.7"></div>
  <div class="card">
    <div class="k">Ein Ansprechpartner</div>
    <div class="row" style="margin-top:10px"><span class="av">B</span><span><b style="font-size:16px;display:block">BauStern · Bauleitung</b><span style="font-size:12.5px;color:rgba(255,255,255,.62)">gerade eben</span></span></div>
    <div class="s" style="margin-top:12px">Alles koordiniert. Nächster Schritt: Aufmass am Freitag, 9:00 — Sie müssen niemanden anrufen.</div>
    <div class="btn">📞 Rückruf in 5 Min</div>
  </div><div class="hint" style="left:0;top:-32px">Loslassen — ein Chat</div></div>`;

/* ---------- 2 · Küche ---------- */
const CSS_S2 = `
#mock .takt{display:flex;gap:6px;margin-top:14px}#mock .takt i{flex:1;height:3px;border-radius:2px;background:rgba(255,255,255,.18)}
#mock .takt i.on{background:var(--br)}
#mock .slot.kue{right:auto;left:31%;top:13%;width:360px}
@media(max-width:760px){#mock .slot.kue{left:16px;top:186px;width:auto}}
`;
const S2 = (vp)=>{
  const P = vp==='phone';
  const pins = P ? [[73,67],[33,58],[72,38]] : [[74,70],[40,54],[78,50]];
  return `<div class="spot" style="left:${pins[1][0]}%;top:${pins[1][1]}%"></div>
  <div class="pin done" style="left:${pins[0][0]}%;top:${pins[0][1]}%">✓</div>
  <div class="pin on" style="left:${pins[1][0]}%;top:${pins[1][1]}%">2</div>
  <div class="pin" style="left:${pins[2][0]}%;top:${pins[2][1]}%">3</div>
  <div class="slot kue"><div class="card">
    <div class="k">Takt 2 von 3 · Sanitär</div>
    <div class="t">Anschlüsse und Armatur.</div>
    <div class="s">Kommt, wenn die Insel steht — abgestimmt mit dem Schreiner. Ein Termin, nicht drei.</div>
    <div class="takt"><i class="on"></i><i class="on"></i><i></i></div>
    <div class="hint" style="position:static;display:block;margin-top:12px;color:rgba(255,255,255,.55)">Tippen — nächster Takt</div>
  </div></div>`;
};

/* ---------- 3 · Bad ---------- */
const CSS_S3 = `
#mock .dusk{position:absolute;inset:0;object-fit:cover;width:100%;height:100%}
#mock .sw{position:absolute;left:12%;top:46%;width:64px;height:92px;border-radius:8px;background:linear-gradient(#EDE9E2,#D9D4CB);
  box-shadow:0 8px 24px rgba(0,0,0,.45),inset 0 0 0 1px rgba(0,0,0,.15);transform:translate(-50%,-50%)}
#mock .sw i{position:absolute;left:12px;right:12px;top:12px;bottom:12px;border-radius:5px;background:linear-gradient(#F7F4EE,#E3DED5);
  box-shadow:0 2px 0 rgba(0,0,0,.25)}
#mock .sw i::after{content:"";position:absolute;left:0;right:0;top:50%;height:1px;background:rgba(0,0,0,.18)}
#mock .sw b{position:absolute;left:50%;top:24px;width:8px;height:8px;border-radius:50%;background:#D6B685;transform:translateX(-50%);box-shadow:0 0 10px #D6B685}
#mock .tap{position:absolute;width:44px;height:44px;border-radius:50%;border:2px solid rgba(255,255,255,.85);transform:translate(-50%,-50%);
  box-shadow:0 0 0 10px rgba(255,255,255,.14)}
#mock .lab{position:absolute;font-family:'Archivo';font-size:11px;letter-spacing:.16em;text-transform:uppercase;font-weight:600;
  background:rgba(14,18,22,.7);padding:6px 10px;border-radius:999px}
#mock .hd{position:absolute;left:50%;top:50%;width:64px;height:64px;border-radius:50%;background:#fff;transform:translate(-50%,-50%);
  box-shadow:0 8px 24px rgba(0,0,0,.45);display:grid;place-items:center;color:#14181c;font-size:20px;cursor:ew-resize}
#mock .hd::before{content:"";position:absolute;top:-50vh;bottom:-50vh;left:50%;width:2px;background:#fff;transform:translateX(-50%);z-index:-1}
#mock .hd small{position:absolute;top:74px;left:50%;transform:translateX(-50%);white-space:nowrap;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#fff;font-family:'Archivo';font-weight:600}
`;
const S3U = (vp)=> vp==='phone'
  ? `<img style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:1" src="img/film/v16/stills/bad-dusk-P.jpg">`
  : `<div style="position:absolute;inset:0;clip-path:inset(0 0 0 44%);z-index:1"><img style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover" src="img/film/v16/stills/bad-dusk-L.jpg"></div>`;
const S3 = (vp)=> vp==='phone'
  ? `<div class="sw"><i></i><b></b></div>
     <div class="tap" style="left:12%;top:46%"></div>
     <div class="lab" style="left:12%;top:calc(46% + 62px);transform:translateX(-50%)">Licht aus</div>
     <div class="lab" style="right:16px;top:186px">Abend</div>`
  : `<div class="hd" style="left:44%">⇔<small>ziehen</small></div>
     <div class="lab" style="left:6%;top:56%">Tageslicht</div><div class="lab" style="right:6%;top:56%">Abend</div>`;

/* ---------- 4 · Schlaf ---------- */
const CSS_S4 = `
#mock .steps{list-style:none;margin:12px 0 0;padding:0;position:relative}
#mock .steps::before{content:"";position:absolute;left:11px;top:10px;bottom:10px;width:1.5px;background:rgba(255,255,255,.18)}
#mock .steps li{position:relative;padding:7px 0 7px 34px;font-size:14px;color:rgba(255,255,255,.7);display:flex;justify-content:space-between;gap:10px}
#mock .steps li::before{content:"";position:absolute;left:6px;top:13px;width:11px;height:11px;border-radius:50%;background:var(--ink);box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.45)}
#mock .steps li.done{color:rgba(255,255,255,.55)}#mock .steps li.done::before{background:rgba(255,255,255,.55);box-shadow:none}
#mock .steps li.on{color:#fff;display:block;background:rgba(255,255,255,.06);border-radius:8px;margin:4px -8px;padding:10px 8px 10px 42px}
#mock .steps li.on::before{left:14px;top:16px;background:var(--br);box-shadow:0 0 0 5px rgba(214,182,133,.25)}
#mock .steps b{font-weight:600;color:#fff}#mock .steps small{font-size:12px;color:rgba(255,255,255,.55);white-space:nowrap}
#mock .steps li.on p{margin:5px 0 0;font-size:13.5px;line-height:1.45;color:rgba(255,255,255,.78)}
#mock .tag{display:inline-block;margin-top:8px;font-family:'Archivo';font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--br);font-weight:600}
`;
const S4 = `<div class="slot"><div class="card">
  <div class="k">Bauzeitplan · 5 Schritte</div>
  <ol class="steps">
    <li class="done"><b>Anfrage</b><small>Rückruf in 5 Min</small></li>
    <li class="done"><b>Besichtigung</b><small>kostenlos, vor Ort</small></li>
    <li class="done"><b>Offerte</b><small>innert 48 h</small></li>
    <li class="on"><b>Ausführung</b><p>Ein Bauleiter, ein Bauzeitplan — Sie bekommen jede Woche ein Update.</p><span class="tag">Woche 2 – 5</span></li>
    <li><b>Übergabe</b><small>Protokoll + Schlüssel</small></li>
  </ol></div><div class="hint" style="left:0;top:-26px">Tippen — nächster Schritt</div></div>`;

/* ---------- 5+6 · Wohnen: dunkle Tooltips + Hold-Rückblende ---------- */
const CSS_S5 = `
#mock .tip{position:absolute;width:280px}
#mock .tip .card{padding:14px 16px}
#mock .tip .x{position:absolute;right:10px;top:8px;font-size:16px;color:rgba(255,255,255,.55)}
#mock .roh{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.62}
#mock .vin{position:absolute;inset:0;background:radial-gradient(120% 90% at 50% 50%,transparent 40%,rgba(0,0,0,.35))}
`;
const S5 = (vp)=>{
  const P = vp==='phone';
  const pin = P ? [64,52] : [58,56];
  return `<div class="pin on" style="left:${pin[0]}%;top:${pin[1]}%;width:22px;height:22px"></div>
  <div class="tip" style="left:${P?'16px':'calc('+pin[0]+'% + 28px)'};right:${P?'16px':'auto'};top:${P?'186px':pin[1]+'%'};width:${P?'auto':'280px'}">
  <div class="card"><span class="x">✕</span><div class="k">Drei Gewerke synchron</div>
  <div class="t" style="font-size:17px">Boden, Decke, Einbauten.</div>
  <div class="s" style="font-size:13.5px">Schreiner, Elektriker, Bodenleger — ein Takt, eine Abnahme.</div></div></div>`;
};
const S6U = (vp)=>`<div style="position:absolute;inset:0;z-index:1"><img class="roh" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.66" src="img/film/v16/stills/wohnen-rohbau-${vp==='phone'?'P':'L'}.jpg"><div class="vin" style="position:absolute;inset:0;background:radial-gradient(120% 90% at 50% 50%,transparent 40%,rgba(0,0,0,.35))"></div></div>`;
const S6 = (vp)=>{
  const P = vp==='phone';
  return `<div class="lab" style="left:50%;top:${P?'186px':'14%'};transform:translateX(-50%);background:rgba(14,18,22,.75);font-family:'Archivo';font-size:11px;letter-spacing:.16em;text-transform:uppercase;font-weight:600;padding:7px 12px;border-radius:999px;position:absolute">Vor 4 Monaten · Halten</div>
  <div class="tap" style="left:50%;top:${P?'44%':'48%'}"></div>`;
};

/* ---------- 7 · Eingang ---------- */
const CSS_S7 = `
#mock .prot .card{padding:0;overflow:hidden}
#mock .prot .hdr{display:flex;align-items:center;gap:12px;padding:14px 18px;border-bottom:1px solid rgba(255,255,255,.12)}
#mock .prot .key{width:34px;height:34px;border-radius:50%;background:var(--br);display:grid;place-items:center;color:#14181c}
#mock .prot .body{padding:14px 18px 16px}
#mock .prot .big{font-family:'Archivo';font-weight:600;font-size:24px;letter-spacing:-.02em;color:var(--br);margin-top:2px}
#mock .prot ul{list-style:none;padding:0;margin:12px 0 0;display:grid;gap:7px}
#mock .prot li{display:flex;gap:10px;font-size:13.5px;align-items:flex-start;color:rgba(255,255,255,.85)}
#mock .prot li::before{content:"✓";color:var(--br);font-weight:700;flex:none}
#mock .prot .sigrow{display:flex;align-items:flex-end;justify-content:space-between;margin-top:12px;padding-top:12px;border-top:1px dashed rgba(255,255,255,.18)}
#mock .prot .sig{width:96px;height:64px}#mock .prot .sig path{fill:none;stroke:#fff;stroke-width:3;stroke-linecap:round}
#mock .prot .who{font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:rgba(255,255,255,.6);font-family:'Archivo';font-weight:600;text-align:right;line-height:1.5}
#mock .btns{display:flex;gap:10px;margin-top:12px;flex-wrap:wrap}
#mock .btns .btn{margin-top:0}
@media(max-width:760px){#mock .slot.prot{top:140px}#mock .prot .big{font-size:20px}#mock .prot li{font-size:12.5px}#mock .prot ul{gap:5px}#mock .prot .sig{width:64px;height:44px}#mock .prot .sigrow{margin-top:8px;padding-top:8px}#mock .prot .body{padding:10px 16px 12px}#mock .prot .hdr{padding:10px 16px}}
`;
const S7 = (vp)=>`<div class="slot prot"><div class="card">
  <div class="hdr"><span class="key"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="8" cy="12" r="4"/><path d="M12 12h9M18 12v3M21 12v3"/></svg></span>
    <span><span class="k">Übergabeprotokoll</span><br><span style="font-size:12.5px;color:rgba(255,255,255,.6)">Anfrage jetzt</span></span></div>
  <div class="body">
    <div class="k" style="color:rgba(255,255,255,.6)">Offerte bis</div><div class="big">Samstag, 18:00</div>
    <ul><li>Offerte innert 48 h</li><li>Ein Ansprechpartner — bis zum Schlüssel</li><li>Nach Norm — SIA, mit Protokoll</li><li>Termin im Werkvertrag · 24 Mt. Garantie</li></ul>
    <div class="sigrow">${SIG}<span class="who">Artem Kozlovskyi<br>Inhaber</span></div>
    ${vp==='phone' ? `<div class="k" style="margin-top:10px;color:var(--br)">Richtpreis berechnen →</div>` : ``}
  </div></div>
  ${vp==='phone' ? ``
                 : `<div class="btns"><div class="btn">Offerte anfragen →</div><div class="btn line">Richtpreis berechnen</div></div>`}
</div>`;

/* ---------- 8 · Ende des Rundgangs ---------- */
const CSS_S8 = `
#mock .end{position:absolute;left:0;right:0;bottom:0;height:52%;background:#F6F4EF;color:#1C1F22;padding:30px clamp(20px,6vw,90px);box-shadow:0 -1px 0 rgba(0,0,0,.08)}
#mock .end .k{color:#405F6B}
#mock .end h3{font-family:'Archivo';font-weight:600;letter-spacing:-.02em;font-size:clamp(22px,2.4vw,34px);margin:6px 0 18px;line-height:1.05}
#mock .vv{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
#mock .vv div{background:#fff;border-radius:8px;padding:16px 16px 14px;box-shadow:0 0 0 1px rgba(28,31,34,.12)}
#mock .vv b{display:block;font-family:'Archivo';font-size:15px;margin-bottom:5px}#mock .vv p{margin:0;font-size:13.5px;line-height:1.5;color:#55596A}
#mock .vv i{display:block;width:10px;height:10px;background:#405F6B;transform:rotate(45deg);margin-bottom:12px}
#mock .end .foot{margin-top:18px;font-size:13.5px;color:#55596A}
@media(max-width:760px){#mock .end{height:62%;padding:22px 16px}#mock .vv{grid-template-columns:1fr 1fr;gap:10px}#mock .vv div{padding:12px}#mock .vv p{font-size:12.5px}}
`;
const S8 = `<div class="end"><div class="k">Rundgang beendet · 7 Kapitel</div><h3>Vier Versprechen. Schriftlich.</h3>
  <div class="vv">
    <div><i></i><b>Offerte innert 48 h</b><p>Festpreis, Position für Position.</p></div>
    <div><i></i><b>Ein Ansprechpartner</b><p>Bis zum Schlüssel, eine Nummer.</p></div>
    <div><i></i><b>Nach Norm — SIA</b><p>Mit Protokoll und Nachweisen.</p></div>
    <div><i></i><b>Termin im Werkvertrag</b><p>24 Monate Werkgarantie.</p></div>
  </div><div class="foot">↓ Was kostet das? Richtwerte in 30 Sekunden.</div></div>`;

const MOCKS = [
  { id:'1a-schwelle-hold',    ch:1, css:CSS_S1, html:S1A },
  { id:'1b-schwelle-release', ch:1, css:CSS_S1, html:()=>S1B },
  { id:'2-kueche',            ch:2, css:CSS_S2, html:S2 },
  { id:'3-bad',               ch:3, css:CSS_S3, html:S3, under:S3U },
  { id:'4-schlaf',            ch:4, css:CSS_S4, html:()=>S4 },
  { id:'5-wohnen-tip',        ch:5, css:CSS_S5, html:S5 },
  { id:'6-wohnen-rueckblende',ch:5, css:CSS_S5, html:S6, under:S6U },
  { id:'7-eingang',           ch:7, css:CSS_S7, html:S7 },
  { id:'8-ende',              ch:7, css:CSS_S8, html:()=>S8 },
];
const only = process.argv[2];

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', headless: true, args: ['--no-sandbox'] });
  for (const [vp, cfg] of Object.entries(VPS)) {
    const ctx = await b.newContext({ viewport: { width: cfg.width, height: cfg.height }, deviceScaleFactor: 2, hasTouch: cfg.touch, isMobile: cfg.touch });
    const p = await ctx.newPage();
    await p.goto('http://127.0.0.1:8123/index.html?v=' + Date.now(), { waitUntil: 'networkidle', timeout: 30000 });
    await p.waitForTimeout(1500);
    for (const m of MOCKS) {
      if (only && !m.id.startsWith(only)) continue;
      await p.evaluate(ch => { document.getElementById('mock')?.remove(); document.getElementById('mockunder')?.remove(); Film16.go(ch); }, m.ch);
      await p.waitForFunction(ch => window.Film16 && Film16.ch === ch, m.ch, { timeout: 30000 }); await p.waitForTimeout(3000);
      await p.evaluate(({ css, html, under }) => {
        const W = document.getElementById('wohnung');
        document.getElementById('mockunder')?.remove();
        if (under) { const u = document.createElement('div'); u.id = 'mockunder'; u.innerHTML = under; const cam = W.querySelector('#wStage .w-cam'); cam.after(u); }
        ['#wS5', '#wHot', '.w-cmp', '#wSig', '.s5-akte-badge'].forEach(s => W.querySelectorAll(s).forEach(e => e.style.visibility = 'hidden'));
        const st = document.createElement('style'); st.id = 'mockcss'; st.textContent = css; document.head.appendChild(st);
        const d = document.createElement('div'); d.id = 'mock'; d.innerHTML = html; W.appendChild(d);
      }, { css: BASE_CSS + m.css, html: m.html(vp), under: m.under ? m.under(vp) : '' });
      await p.waitForTimeout(700);
      await p.screenshot({ path: `${OUT}/${m.id}_${vp}.png` });
      await p.evaluate(() => { document.getElementById('mockcss')?.remove(); });
      console.log('✓', m.id, vp);
    }
    await ctx.close();
  }
  await b.close();
})();
