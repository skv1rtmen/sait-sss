/* BauStern — Seiten-Templates (global, kein Modul-System)
   Vertrag mit app.js (Phase D):
   - Work-Karten: <article class="work" data-work="ID" tabindex="0" role="button" aria-label="… öffnen"> — Klick global über [data-work]
   - Case-Zellen: <div class="case-cell" data-work="ID" tabindex="0" role="button">
   - Slug-Templates geben null zurück, wenn der Slug unbekannt ist. */

/* ===== Bausteine ===== */
const esc=s=>String(s==null?'':s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
const bookingAttrs=CO.calendlyEnabled?`href="${esc(CO.calendly)}" target="_blank" rel="noopener"`:`href="/kontakt" data-go="kontakt" data-message="Ich wünsche eine kostenlose Beratung mit Ihrem Projektmanager. Bitte kontaktieren Sie mich zur Terminvereinbarung."`;
const bookingLabel=CO.calendlyEnabled?'Beratungstermin buchen':'Kostenlose Beratung';
const livingPic=alt=>`<picture><source media="(max-width:999px)" type="image/webp" srcset="img/atlant-living-672.webp"><img loading="lazy" decoding="async" src="img/atlant-living.jpg" alt="${esc(alt)}"></picture>`;
const workCard=w=>{const svc=SVC.find(s=>s.k===w.g[0]);
  return `<article class="work" data-work="${w.id}" tabindex="0" role="button" aria-label="${esc(w.t)} öffnen">${lz(w.img,w.t+' — '+w.loc)}
    <span class="plus" aria-hidden="true">→</span><div class="cap">${svc?`<b class="tag">${svc.t}</b>`:''}<h3>${w.t}</h3><span>${w.loc}</span></div></article>`;};
const worksGrid=list=>list.length?list.map(workCard).join(''):`<div class="emptyworks">Für dieses Gewerk sind noch keine Bilder hinterlegt.</div>`;
/* Sterne passend zur Bewertung (4.6 -> ★★★★☆ statt fünf volle) */
const starStr=r=>{const n=Math.floor(+r||0);return '★'.repeat(n)+'☆'.repeat(5-n);};
const phv=v=>/^\[PLATZHALTER/.test(String(v))?`<span class="ph">${v}</span>`:v;
const stretch=(go,label)=>`<button class="stretch" data-go="${go}" aria-label="${esc(label)}"></button>`;
/* Wie stretch(), aber Ziel ist ein In-Page-Scroll ({scroll:"id"}) oder eine Route ({go:"pfad"}) — für Karten, deren Ziel je nach Seite variiert (siehe promisesGrid) */
const stretchTo=(target,label)=>(target&&target.scroll)
  ?`<button class="stretch" data-scroll="${esc(target.scroll)}" aria-label="${esc(label)}"></button>`
  :`<button class="stretch" data-go="${esc((target&&target.go)||'')}" aria-label="${esc(label)}"></button>`;
const secHead=(h,lead,mb)=>`<div class="sec-head"${mb?' style="margin-bottom:'+mb+'"':''}><h2 class="rv">${h}</h2>${lead?`<p class="lead rv" style="margin-top:16px">${lead}</p>`:''}</div>`;
const faqList=(list,openFirst)=>`<div class="faq rv">${list.map((f,i)=>`<details${openFirst&&i===0?' open':''}><summary><span>${f[0]}</span><i></i></summary><div class="ans"><p>${f[1]}</p></div></details>`).join('')}</div>`;
const faqSec=(list,h,lead)=>`<section class="sec" style="padding-top:0"><div class="wrap"><div class="faqwrap">
  ${secHead(h,lead)}${faqList(list,true)}</div></div></section>`;
const inclBand=(list,h,sub)=>`<section class="band incl-band"><div class="wrap sec">
  <div class="incl-grid"><div>${secHead(h||'Im Festpreis inbegriffen.',sub||'Was in jeder Offerte enthalten ist — ohne Aufpreis und ohne Kleingedrucktes.')}</div>
  <ul class="dl incl-list rv">${list.map(x=>`<li>${x}</li>`).join('')}</ul></div></div></section>`;
const projCard=p=>`<article class="projcard clickcard rv">${stretch('projekt/'+p.slug,p.title+' — Fallstudie öffnen')}
  <div class="fig">${lz(p.cover,p.title+' — '+p.loc)}</div>
  <div class="body"><div class="loc">${ic.pin} ${p.loc}</div><h3 class="disp">${p.title}</h3><p>${p.sub}</p>
    <div class="meta">${p.facts.slice(0,3).map(f=>`<span><b>${phv(f[0])}</b> ${f[1]}</span>`).join('')}</div>
    <span class="lnk">Fallstudie lesen <span class="a">${ic.arrow}</span></span></div></article>`;
/* ctaBand(svc?, who?): svc = exakter #i-svc-Label-Text (z. B. "Sanitär"), who = exakter #who-Segment-Text
   (z. B. "Hausverwaltung / Eigentümer") — beide optional. Werden als data-Attribute auf den "Offerte
   anfragen"-Button geschrieben und von app.js beim Klick in window.PREFILL übernommen, damit das
   Kontaktformular mit dem passenden Kontext vorausgefüllt öffnet (Nielsen-Audit H6-01). */
const ctaBand=(svc,who)=>`<section class="sec"><div class="wrap"><div class="ctaband rv"><span class="orb"></span>
 <div><h2>Besprechen wir Ihr Vorhaben.</h2><p>Die Beratung mit unserem Projektmanager ist kostenlos. Erste Rückmeldung innert 24 Stunden an Werktagen.</p>
  <div class="cta-alt"><a ${bookingAttrs}>${ic.cal} ${bookingLabel}</a><a href="${CO.wa}" target="_blank" rel="noopener">${ic.chat} WhatsApp</a></div></div>
 <div class="btns"><a class="btn btn-brass mag" data-go="kontakt"${svc?` data-svc="${esc(svc)}"`:''}${who?` data-who="${esc(who)}"`:''}>Offerte anfragen<span class="ic">${ic.arrow}</span></a>
 <a class="btn btn-line" href="tel:${CO.phoneRaw}">${ic.phone} ${CO.phone}</a></div></div></div></section>`;
/* Slug -> #who-Segment-Text-Mapping für die Lösungen-Detailseiten (siehe pLoesung) */
const SOL_WHO={hausverwaltungen:'Hausverwaltung / Eigentümer',generalunternehmer:'Generalunternehmer','gewerbe-ladenbau':'Gewerbe / Büro / Laden'};
const pageHead=(t,s,extra)=>`<section class="sec" style="padding-bottom:20px"><div class="wrap">
 ${extra||''}<h1 class="disp rv" style="font-size:clamp(38px,5.6vw,68px);font-weight:600;line-height:1.02;max-width:16ch">${t}</h1>
 <p class="lead rv" style="margin-top:22px">${s}</p></div></section>`;
const crumb=(name,go)=>`<p class="crumb rv"><button data-go="${go}">${name}</button><span>/</span></p>`;
/* compact=true (Über-uns-Seite): #richtwert/#hero existieren dort nicht -> Festpreis/Bauzeitplan verlinken stattdessen auf Kontakt bzw. Home */
const promisesGrid=compact=>`<div class="promises${compact?' compact':''}">
  ${PROMISES.map(p=>{
    const target=compact
      ?(p.scroll==='richtwert'?{go:'kontakt'}:p.scroll==='wohnung'?{go:''}:{go:p.go})
      :(p.scroll?{scroll:p.scroll}:{go:p.go});
    return `<article class="promise clickcard rv">${stretchTo(target,p.t+' — '+p.cta)}<span class="dia" aria-hidden="true"></span><h3 class="disp">${p.t}</h3><p>${p.d}</p>
      <span class="lnk">${p.cta} <span class="a">${ic.arrow}</span></span></article>`;
  }).join('')}</div>`;
/* Richtwert-Rechner (Startseite): Markup; Logik in app.js initEstimate(), Daten RICHTWERTE (data.js) */
const estimateSec=()=>{
  const list=typeof RICHTWERTE!=='undefined'?RICHTWERTE:[];if(!list.length)return '';
  const def=list[0];
  return `<section class="sec estimate" id="richtwert" style="padding-top:0" data-default="${def.k}"><div class="wrap">
  ${secHead('Was kostet das? Richtwerte in 30 Sekunden.','Unverbindliche Richtwerte für die Arbeit — ohne Material. Materialien werden separat berechnet. Leistungsumfang und Gesamtpreis bestätigen wir in Ihrer individuellen Offerte.','34px')}
  <div class="est rv shine-target">
    <div class="est-bar"><i></i>Live-Rechner</div>
    <div class="est-in">
      <div class="est-lbl" id="estChipsLbl">Leistung</div>
      <div class="est-chips" role="radiogroup" aria-labelledby="estChipsLbl" id="estChips">
        ${list.map((r,i)=>`<button type="button" class="chip" role="radio" aria-checked="${i===0?'true':'false'}" tabindex="${i===0?'0':'-1'}" data-k="${r.k}">${r.t}</button>`).join('')}
      </div>
      <div class="est-qty">
        <label for="estRange"><span class="est-lbl">Menge</span><span class="u" id="estUnit">${def.label}</span></label>
        <div class="est-qty-row">
          <input type="range" class="est-range" id="estRange" min="1" max="10" step="1" value="1" aria-label="Menge: ${def.label}">
          <input type="number" class="est-num-in" id="estNum" inputmode="numeric" min="1" max="10" step="1" value="1" aria-label="Menge: ${def.label}">
        </div>
        <div class="est-minmax" id="estMinMax" aria-hidden="true"><span>1</span><span>10</span></div>
      </div>
    </div>
    <div class="est-out">
      <div class="k">Richtwert für <b id="estTitle">${def.t}</b> · <span id="estQty">1 ${def.label}</span></div>
      <div class="est-num" id="estResult" aria-live="polite" aria-atomic="true">
        <span class="sr-only" id="estSr"></span>
        <span class="est-num-v" aria-hidden="true"><span class="cur">CHF</span><span id="estMin">–</span><span class="dash">–</span><span id="estMax">–</span></span>
      </div>
      <p class="est-note" id="estNote">${def.note}</p>
      <ul class="est-lines">
        <li class="mat" id="estMat">Nur Arbeit · Material separat</li>
        <li>Budgetrahmen — kein verbindlicher Gesamtpreis.</li>
      </ul>
      <div class="est-cta">
        <button type="button" class="btn btn-brass mag" id="estCta">Festpreis-Offerte dafür anfragen<span class="ic">${ic.arrow}</span></button>
        <button type="button" class="nav-cb est-cb" id="cbOpen3" aria-label="Rückruf in 5 Minuten anfordern"><i></i><span>Rückruf in 5 Min</span></button>
      </div>
    </div>
  </div>
  <p class="est-foot rv">Richtwerte für die Arbeit, ohne Material, Stand 09/2026. Materialkosten, MWST, Anfahrt, Bewilligungen und Sonderfälle werden in der individuellen Offerte ausgewiesen. Bitte verwenden Sie den Rechner nicht als verbindliche Kostenfreigabe.</p>
</div></section>`;};
const kniggeList=()=>`<ol class="knigge">${KNIGGE.map(k=>`<li class="rv"><span class="n"><span class="dia" aria-hidden="true"></span></span><div><h3>${k.t}</h3><p>${k.d}</p></div></li>`).join('')}</ol>`;

/* ===== Startseite v6: «Die Wohnung ist die Seite» (SPEC-v6.md) ===== */
const contactForm=()=>`
  <form class="form rv" id="formCard" novalidate aria-label="Offerte anfragen">
    <div class="field"><label id="whoLabel">Wer sind Sie? <span class="req">*</span></label>
      <div class="who" id="who" role="radiogroup" aria-labelledby="whoLabel" aria-required="true" aria-describedby="e-who">${["Hausverwaltung / Eigentümer","Generalunternehmer","Gewerbe / Büro / Laden","Privat-Eigentümer"].map((o,i)=>`<button type="button" role="radio" aria-checked="false" tabindex="${i===0?0:-1}" data-who="${o}">${o}</button>`).join('')}</div>
      <div class="msg" id="e-who" style="display:none">Bitte wählen</div></div>
    <div class="one">
      <div class="field" id="f-name"><label for="i-name">Name <span class="req">*</span></label><input id="i-name" type="text" autocomplete="name" placeholder="Vor- und Nachname" aria-describedby="m-name"><div class="msg" id="m-name" style="display:none">Pflichtfeld</div></div></div>
    <div class="two">
      <div class="field" id="f-phone"><label for="i-phone">Telefon <span class="req">*</span></label><input id="i-phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+41 …" aria-describedby="m-phone"><div class="msg" id="m-phone" style="display:none">Gültige Telefonnummer nötig</div></div>
      <div class="field" id="f-mail"><label for="i-mail">E-Mail <span class="req">*</span></label><input id="i-mail" type="email" inputmode="email" autocomplete="email" placeholder="name@firma.ch" aria-describedby="m-mail"><div class="msg" id="m-mail" style="display:none">Gültige E-Mail nötig</div></div></div>
    <div class="field"><label for="i-msg">Ihr Projekt</label><textarea id="i-msg" rows="4" placeholder="Objekt, Umfang, gewünschter Termin …"></textarea></div>
    <details class="form-more"><summary>Weitere Angaben <span>optional</span></summary><div class="form-more-in">
    <div class="field"><label for="i-firma">Firma</label><input id="i-firma" type="text" autocomplete="organization" placeholder="optional"></div>
    <div class="three">
      <div class="field"><label for="i-obj">Objekt</label><select id="i-obj"><option value="">Bitte wählen (optional)</option><option>Wohnung (bewohnt)</option><option>Leerwohnung</option><option>Einfamilienhaus</option><option>Mehrfamilienhaus / Portfolio</option><option>Büro / Gewerbe / Laden</option><option>Hotel / Gastronomie</option></select></div>
      <div class="field"><label for="i-when">Zeitrahmen</label><select id="i-when"><option value="">Bitte wählen (optional)</option><option>So schnell wie möglich</option><option>Innert 4 Wochen</option><option>1–3 Monate</option><option>Später / in Planung</option></select></div>
      <div class="field"><label for="i-plz">PLZ / Ort des Objekts</label><input id="i-plz" type="text" autocomplete="postal-code" placeholder="z. B. 8048 Zürich"></div>
    </div>
    <div class="field"><label for="i-svc">Gewünschtes Gewerk</label><select id="i-svc"><option value="">Bitte wählen (optional)</option>${SVC.map(s=>`<option>${s.t}</option>`).join('')}<option>Mehrere / noch unklar</option></select></div>
    <div class="field">
      <label>Fotos vom Objekt <span style="font-weight:400;color:var(--muted)">(optional, bis zu 3)</span></label>
      <p style="font-size:13px;color:var(--muted);margin:-2px 0 10px;line-height:1.5">Ein paar Fotos vom Ist-Zustand helfen uns bei der ersten Einschätzung und bei der Vorbereitung unseres Gesprächs.</p>
      <div class="foto-up" id="fotoUp">
        <input type="file" id="i-fotos" accept="image/jpeg,image/png,image/webp,image/avif" multiple hidden>
        <button type="button" class="btn btn-upload" id="fotoAdd" aria-describedby="e-foto">${ic.cam} Fotos auswählen</button>
        <div class="foto-list" id="fotoList" aria-live="polite"></div>
      </div>
      <div class="msg" id="e-foto" role="status" aria-live="polite" style="display:none">Maximal 3 Fotos, je höchstens 10 MB.</div>
    </div>
    </div></details>
    <label class="check"><input type="checkbox" id="i-priv" aria-describedby="e-priv"><span>Ich stimme der <a data-go="datenschutz" target="_blank" rel="noopener" style="text-decoration:underline;text-underline-offset:3px">Datenschutzerklärung</a> zu. Die Daten werden nur zur Bearbeitung meiner Anfrage verwendet. <span class="req">*</span></span></label>
    <div class="msg" id="e-priv" style="display:none;margin:-14px 0 16px">Zustimmung nötig</div>
    <div class="hp" aria-hidden="true"><label>Webseite</label><input id="i-hp" type="text" tabindex="-1" autocomplete="off"></div>
    <button type="submit" class="btn btn-brass mag" id="submitBtn">Offerte anfragen<span class="ic">${ic.arrow}</span></button>
  </form>
  <div id="formStatus" class="sr-only" role="status" aria-live="polite"></div>`;
/* Raumhöhe kommt aus FILM.roomVh/room0Vh (Block 1: 1.3 — Scrollweg pro Raum, Raum 0 kleiner da Eröffnungsclip
   nicht scrollgetrieben ist) statt fest in CSS — so bleiben data.js-Werte die einzige Quelle der Wahrheit. */
/* v16: Richtpreis-Tabelle (SEO + Vergleich) aus RICHTWERTE (data.js) — gleiche Quelle wie der Rechner. */
const richtTable=()=>{const u={auftrag:'pro Auftrag',zimmer:'pro Raum',m2:'pro m²'};const f=n=>String(n).replace(/\B(?=(\d{3})+(?!\d))/g,'’');
  return `<div class="rp-wrap rv"><table class="rp"><caption class="sr-only">Richtpreise in CHF, Arbeit ohne Material</caption>
  <thead><tr><th scope="col">Arbeit</th><th scope="col">Einheit</th><th scope="col" class="num">CHF</th><th scope="col" class="rp-note">Umfang</th></tr></thead>
  <tbody>${RICHTWERTE.map(r=>`<tr><th scope="row">${r.t}<small>${r.gewerk}<span class="rp-mu"> · ${u[r.einheit]||''}</span></small></th><td class="rp-u">${u[r.einheit]||''}</td><td class="num">${f(r.min)}–${f(r.max)}</td><td class="rp-note">${r.note}</td></tr>`).join('')}</tbody></table></div>
  <p class="rp-foot rv">Stand August 2026, Arbeit ohne Material. Verbindlich ist die Offerte, die Sie innert 48 h erhalten.</p>`;};
/* v16: Raumbild kommt aus v16/stills/<room>-L*.jpg (Engine B); v15/v13 weiterhin aus stillDir/st<i>.jpg. */
const V16=(typeof FILM!=='undefined'&&FILM.engine==='v16');
const roomImg=i=>V16?{s:`${FILM.v16.stillDir}${FILM.v16.rooms[i]}-L-1280.jpg`,b:`${FILM.v16.stillDir}${FILM.v16.rooms[i]}-L.jpg`}
                    :{s:`${FILM.stillDir}st${i}-1280.jpg`,b:`${FILM.stillDir}st${i}.jpg`};
const wRoom=i=>{const s=FILM.scenes[i];const vh=(i===0?(FILM.room0Vh||1.2):(FILM.roomVh||2.8));const ri=roomImg(i);
  return `<section class="w-room" data-scene="${i}" aria-label="${esc(s.kicker||'Rundgang')}" style="--room-vh:${vh}">
  <div class="w-room-in"><img src="${ri.s}" srcset="${ri.s} 1280w, ${ri.b} 1920w" sizes="100vw" alt="${esc((s.kicker||'')+' — '+String(s.h).replace(/<[^>]+>/g,''))}" loading="lazy" decoding="async">
    <div class="w-room-txt"><p class="w-kicker">${s.kicker||''}</p><h2 class="disp">${s.h}</h2><p class="w-d">${s.d}</p>
      ${(s.hot||[]).length?`<ul class="w-hs-list">${s.hot.map(h=>`<li><b>${h.t}</b> — ${h.l[0]}${h.go?` <button class="lnk-arrow" data-go="${h.go}">Mehr <span>${ic.arrow}</span></button>`:''}</li>`).join('')}</ul>`:''}
    </div></div></section>`;};
const wStage=()=>`<div class="w-stage" id="wStage">
  <div class="w-cam">
    ${V16?`<!-- v16: Halt- und Videoebenen legt js/film-v16.js an; hier nur das erste Haltebild als schneller Paint.
         Hochkant bekommt das Hochkant-Standbild: das Querformat-Bild wurde auf dem Telefon formatfüllend
         beschnitten und sah als erster Eindruck stark herangezoomt aus (Sichtprüfung 18.09). -->
    <picture class="v16-boot-pic"><source media="(orientation:portrait)" srcset="${FILM.v16.stillDir}ankunft-P.jpg">
    <img class="v16-boot" src="${FILM.v16.stillDir}ankunft-L.jpg" alt="" aria-hidden="true" fetchpriority="high" decoding="async"></picture>`
    :`<picture><source media="(min-width:1000px)" srcset="${FILM.poster}"><img class="w-poster" src="data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=" alt="" aria-hidden="true" fetchpriority="high" decoding="async"></picture>
    <canvas class="w-canvas" aria-hidden="true"></canvas>
    <canvas class="w-fx" aria-hidden="true"></canvas>
    <div class="w-stills" aria-hidden="true">${FILM.scenes.map((s,i)=>`<figure class="w-still${i===0?' on':''}"><picture><source media="(min-width:600px), (min-aspect-ratio:1/1)" ${i===0?'srcset':'data-srcset'}="${FILM.stillDir}st${i}-1280.jpg 1280w, ${FILM.stillDir}st${i}.jpg 1920w" sizes="100vw"><img ${i===0?'src':'data-src'}="${FILM.stillDir}st${i}-p.webp" alt="" ${i===0?'fetchpriority="high"':'loading="lazy"'} decoding="async"></picture></figure>`).join('')}</div>`}
    <div class="w-cmp" id="wCmp" hidden style="--x:.5">
      <img class="w-cmp-after" src="" alt="" aria-hidden="true">
      <span class="w-cmp-tag w-cmp-tag-l">Vorher</span><span class="w-cmp-tag w-cmp-tag-r">Nachher</span>
      <div class="w-cmp-line"></div>
      <div class="w-cmp-h" role="slider" tabindex="0" aria-label="Vorher / Nachher — Ausbaufortschritt" aria-valuemin="0" aria-valuemax="100" aria-valuenow="50" aria-orientation="horizontal"><i aria-hidden="true">‹</i><i aria-hidden="true">›</i></div>
    </div>
  </div>
  <div class="w-shade" aria-hidden="true"></div>
  <!-- v9.1: Hotspot-Ebene liegt NICHT mehr in .w-cam (transformierter Stacking-Context, z-index wirkungslos):
       vorher lag der Szenentext (.w-ov, z5) über den Hotspots/Popups -> Punkte unter der Überschrift nicht klickbar,
       Popup hinter dem Titel. Jetzt eigene Ebene z6 über dem Text; film.js gibt ihr denselben Drift-Transform wie .w-cam. -->
  <div class="w-hot" id="wHot"></div>
  <div class="w-popm" id="wPopM" hidden></div>
  <div class="w-ov is-hero" id="wOv" aria-live="polite">
    <p class="w-kicker"><span class="dia"></span><span class="w-kicker-t"></span></p>
    <h2 class="w-h disp"></h2>
    <p class="w-todo" aria-live="polite"></p>
    <p class="w-d"></p>
    <div class="w-chips" hidden>${SVC.map(s=>`<button type="button" class="w-chip" data-go="leistungen/${s.slug}">${s.t}</button>`).join('')}</div>
    <div class="w-counters" hidden></div>
    <div class="w-ctas">
      <a class="btn btn-brass mag" data-go="kontakt">Offerte anfragen<span class="ic">${ic.arrow}</span></a>
      <a class="btn btn-line" href="tel:${CO.phoneRaw}">${ic.phone} ${CO.phone}</a>
    </div>
    <p class="w-trust">${HERO_TRUST.map(t=>`<span>${t}</span>`).join('<i></i>')}</p>
    <button type="button" class="w-start" id="wStart"><span class="dia"></span>Rundgang durch das Haus<i>↓</i></button>
    <div class="w-cta" hidden><a class="btn btn-brass mag" data-go="kontakt">Offerte anfragen<span class="ic">${ic.arrow}</span></a><a class="btn btn-line" href="${CO.wa}" target="_blank" rel="noopener">${ic.chat} WhatsApp</a></div>
  </div>
  <figure class="w-before" hidden><img src="" alt=""><figcaption></figcaption></figure>
  <div class="w-sig" id="wSig" hidden aria-hidden="true"><svg class="sig" viewBox="0 0 150 100"><path d="M8 74 C 18 44, 32 14, 44 8 C 56 12, 62 44, 68 74"/><path d="M24 46 L 60 46"/><path d="M84 8 C 83 30, 82 52, 80 74"/><path d="M116 10 C 100 30, 92 42, 82 46 C 96 52, 106 64, 120 76"/><path d="M4 86 C 40 96, 96 92, 146 80"/></svg><small>${CO.owner||'Artem Kozlovskyi'} · Inhaber</small></div>
  <div class="w-plan" id="wPlan" aria-label="Grundriss — Position der Kamera"></div>
  <div class="w-scrollhint" id="wScrollHint" aria-hidden="true"><span>Scrollen</span><i></i></div>
  <div class="w-fly" id="wFly" aria-hidden="true"><span class="w-fly-t"></span><i class="w-fly-bar"><b></b></i></div>
</div>`;
/* Etappe 8 §5: «Werkvertrag-Auszug» — der Film entlässt nicht mehr in ein durchsichtiges Blatt über dem
   noch gepinnten Kader (dort verloren die Karten ihre Farbe und der Text lag auf dem Bild), sondern in
   eine undurchsichtige helle Sektion: EIN Blatt mit den vier Versprechen, Unterschrift und Stempel. */
const ENDE_SIG=`<svg class="sig" viewBox="0 0 150 100" aria-hidden="true">
  <path d="M8 74 C 18 44, 32 14, 44 8 C 56 12, 62 44, 68 74"></path><path d="M24 46 L 60 46"></path>
  <path d="M84 8 C 83 30, 82 52, 80 74"></path><path d="M116 10 C 100 30, 92 42, 82 46 C 96 52, 106 64, 120 76"></path>
  <path d="M4 86 C 40 96, 96 92, 146 80"></path></svg>`;
const endeBand=()=>`<section class="ende" id="ende">
  <div class="wrap">
    <p class="ende-k">Rundgang beendet · ${FILM.scenes.length} Kapitel</p>
    <h2 class="disp">Vier Versprechen. Schriftlich.</h2>
    <div class="ende-sheet rv">
      <p class="ende-k ende-k-doc">Werkvertrag · Auszug</p>
      <div class="ende-grid">
        <div><span class="dia" aria-hidden="true"></span><b>Offerte innert 48 h</b><p>Festpreis, Position für Position.</p></div>
        <div><span class="dia" aria-hidden="true"></span><b>Ein Ansprechpartner</b><p>Bis zum Schlüssel, eine Nummer.</p></div>
        <div><span class="dia" aria-hidden="true"></span><b>Nach Norm — SIA</b><p>Mit Protokoll und Nachweisen.</p></div>
        <div><span class="dia" aria-hidden="true"></span><b>Termin im Werkvertrag</b><p>24 Monate Werkgarantie.</p></div>
      </div>
      <div class="ende-foot">
        <div class="ende-sig">${ENDE_SIG}<span>Artem Kozlovskyi · Inhaber</span></div>
        <div class="ende-stamp" aria-hidden="true"><svg viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="52"></circle><circle cx="60" cy="60" r="44"></circle>
          <path id="endeStampPath" d="M60 22 a38 38 0 1 1 -.1 0" fill="none"></path>
          <text><textPath href="#endeStampPath" startOffset="2%">Schriftlich im Werkvertrag ·</textPath></text>
        </svg></div>
      </div>
    </div>
    <p class="ende-next"><button type="button" class="lnk-arrow" data-scroll="richtwert">Was kostet das? Richtwerte in 30 Sekunden <span>${ic.arrow}</span></button></p>
  </div>
</section>`;
function pHome(){return `
<h1 class="sr-only">BauStern — Bauunternehmen Zürich: Renovation, Sanitär, Umbau, Fliesen und Malerarbeiten aus einer Hand</h1>
<div class="wohnung" id="wohnung">
  ${wStage()}
  <!-- v8.2 «Hinter Glas»: Raumpunkte + HUD liegen AUSSERHALB der Stage (position:fixed, z-index über den Bögen),
       damit sie auch über den Glasplatten sichtbar bleiben — die Wohnung verschwindet nie ganz. -->
  <nav class="w-roomnav" id="wRoomNav" aria-label="Fortschritt im Rundgang">
    ${FILM.scenes.map((s,i)=>`<button type="button" class="w-roomnav-dot${i===0?' on':''}" data-i="${i}" aria-label="${esc(s.navLabel||s.kicker||('Raum '+(i+1)))}"><i></i><span>${esc(s.navLabel||s.kicker||'')}</span></button>`).join('')}
  </nav>
  <div class="w-hud" id="wHud" aria-hidden="true"><span class="k"></span><b></b></div>
  <div class="w-marks" aria-hidden="true"></div>
  <!-- Block 1 (1.6): FILM.sheetMode='interleaved' (data.js) ist der aktuelle, getestete Modus — jedes
       .w-sheet folgt direkt auf seinen .w-room und liegt als Overlay über dem fixierten Film (.w-stage ist
       bereits CSS position:fixed). Für den 'sequential'-Modus (alle Räume zuerst, alle Blätter danach als
       normale Sektionen) OHNE die Template-Reihenfolge unten anzufassen: .w-flow auf display:flex;
       flex-direction:column setzen und jedem .w-room/.w-sheet ein style="order:N" mitgeben (Räume 0..6,
       Blätter 7..13) — Flex-'order' ändert auch die Scroll-/Layout-Position, ScrollTrigger folgt automatisch.
       Bewusst nicht fest verdrahtet: das ist ein Layout-Modus-Wechsel mit eigenem Testbedarf (Blätter, die
       jetzt als Overlay auf dem Film "andocken", brauchen im sequential-Modus eigene Übergänge), kein
       Ein-Zeilen-Toggle — hier nur der vorbereitete Ansatzpunkt, keine zwei fertig getestete Layouts. -->
  <div class="w-flow" id="wFlow">
    ${FILM.scenes.map((s,i)=>wRoom(i)).join('\n    ')}
    ${V16?endeBand():''}
    <!-- v16 (Stufe 6): Unter dem Film nur noch EIN Blatt mit normalen Sektionen in Verkaufsreihenfolge:
         Referenzen -> Richtpreise -> Ablauf -> Kundenstimmen -> FAQ -> Team/Versprechen/Nachweise -> Offerte-Formular. -->
    <section class="w-sheet w-sheet--final" data-type="up" id="anfrage"><div class="w-paper">
<div class="sec w-sec m-keep below-first" id="works"><div class="wrap">
  <div class="w-head-row">
    ${secHead('Referenzen aus Zürich<br>und der Deutschschweiz.',`${WORKS.length} Beispiele ausgeführter Arbeiten in Zürich und der Deutschschweiz — nach Gewerk gefiltert, jedes Bild lässt sich öffnen.`)}
    <button class="btn btn-brass rv mag" data-go="kontakt">Offerte anfragen<span class="ic">${ic.arrow}</span></button>
  </div>
  <div class="tabs rv" id="tabs">
    <button class="tab on" data-f="all">Alle<span class="cnt">${WORKS.length}</span></button>
    ${SVC.map(s=>`<button class="tab" data-f="${s.k}">${s.t}<span class="cnt">${WORKS.filter(w=>w.g.includes(s.k)).length}</span></button>`).join('')}
  </div>
  <div class="workgrid workgrid--bento" id="workgrid"></div>
  <div class="works-foot"><button class="btn btn-ghost mag" id="moreworks">Mehr Arbeiten zeigen<span class="ic">${ic.arrow}</span></button>
    <button class="lnk-arrow" data-go="referenzen">Alle Referenzen <span>${ic.arrow}</span></button></div>
</div></div>

<div class="sec w-sec m-keep" id="fallstudie" style="padding-top:0"><div class="wrap">
  <div class="case-fb rv clickcard">${stretch('projekt/atlant-komplettausbau','Fallstudie WHK Atlant öffnen')}
    <div class="case-fb-media">${lz("img/atlant-kitchen.jpg","Referenzprojekt — Küche")}</div>
    <div class="case-fb-plate">
      <span class="badge">Projekt im Fokus · Komplett aus einer Hand</span>
      <h2 class="disp">WHK Atlant — Komplettausbau.</h2>
      <p>Wohnungs-Komplettausbau — von der Planung über Rückbau, Trennwände, Sanitär, Elektrik und Heizung bis zur schlüsselfertigen Übergabe. Design, Ausführungspläne und Bau aus einer Hand.</p>
      <p class="case-fb-facts"><b data-count="47">0</b> m² Wohnfläche<i>·</i><b data-count="6">0</b> Räume komplett<i>·</i><b data-count="100" data-suf="%">0</b> schlüsselfertig</p>
      <button class="lnk-arrow light" data-go="projekt/atlant-komplettausbau">Zur Fallstudie <span>${ic.arrow}</span></button>
    </div>
  </div>
  <div class="case-grid">
    ${ATLANT.slice(0,3).map(a=>`<div class="case-cell" data-work="${a.work}" tabindex="0" role="button" aria-label="${esc(a.t)} öffnen">${lz(a.img,'Referenzprojekt — '+a.t)}<div class="cap"><h3>${a.t}</h3><p>${a.d}</p></div></div>`).join('')}
  </div>
  <div class="case-eng">
    <span>Rückbau & Trennwände</span><span>Unterlagsboden</span><span>Sanitär SIA-konform</span><span>Elektro & Beleuchtung</span><span>Fussbodenheizung</span><span>Ausführungspläne</span>
  </div>

  <div class="rv" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:20px;padding-top:30px;border-top:1px solid var(--line)">
    ${COUNTERS.slice(0,3).map(c=>`<div style="display:flex;align-items:baseline;gap:8px"><b class="disp" style="font-size:clamp(22px,2.6vw,30px);letter-spacing:-.02em" data-odo="${c[0]}${c[1]}">${c[0]}${c[1]}</b><span style="font-size:13.5px;color:var(--muted)">${c[2]}</span></div>`).join('')}
  </div>
  ${(typeof CLIENTS!=='undefined'&&CLIENTS.length)?`<div class="wrap logo-cloud rv" style="padding:0;margin-top:30px">
    <span class="lc-l">Vertrauen von Verwaltungen, GU und Gewerbe</span>
    <div class="lc-track" aria-label="Kunden"><div class="lc-run">${[0,1].map(k=>CLIENTS.map(c=>`<span class="lc-i"${k?' aria-hidden="true"':''}>${c.svg?`<img src="${c.svg}" alt="${c.n}">`:`<b>${c.n}</b>`}<small>${c.sub||''}</small></span>`).join('')).join('')}</div></div>
    ${CO.rating&&CO.ratingCount?`<a class="lc-rating" href="${CO.google}" target="_blank" rel="noopener"><span class="stars" aria-hidden="true">${starStr(CO.rating)}</span><b>${CO.rating}</b><span>${CO.ratingCount} auf ${CO.ratingSrc}</span></a>`:''}</div>`:''}
</div></div>
<div class="sec w-sec m-keep" id="richtpreise"><div class="wrap">
  ${secHead('Richtpreise in CHF.','Bandbreiten für die Arbeit, ohne Material. Den verbindlichen Festpreis erhalten Sie mit der Offerte.','8px')}
  ${richtTable()}
</div></div>
${estimateSec()}
<div class="sec w-sec m-keep" id="ablauf"><div class="wrap">
  ${secHead('Fünf Schritte bis zur Schlüsselübergabe.','Vom ersten Anruf bis zur Schlüsselübergabe — jeder Schritt schriftlich, jeder Termin fix.','44px')}
  <div class="tl" id="ablaufTl">
    <div class="tl-rail" aria-hidden="true"><i class="tl-fill"></i></div>
    ${STEPS.map((s,i)=>`<div class="tl-item" data-i="${i}">
      <div class="tl-head"><span class="tl-dot" aria-hidden="true"></span><div class="tl-n disp">${s.n}</div><h3 class="disp">${s.t}</h3><div class="tl-s">${s.s}</div><div class="tl-dur">${s.dur||''}</div></div>
      <div class="tl-body"><div class="tl-txt"><p class="l">${s.d}</p><ul class="tl-pts">${(s.pts||[]).map(x=>`<li>${x}</li>`).join('')}</ul></div>
        ${s.photo?`<div class="tl-fig">${lz(s.photo,s.photoCap||s.t)}<span class="tl-cap">${s.photoCap||''}</span></div>`:''}</div>
    </div>`).join('')}
    <div class="tl-item tl-item--cta" data-i="${STEPS.length}">
      <div class="tl-head"><span class="tl-dot" aria-hidden="true"></span><div class="tl-n disp">→</div><h3 class="disp">Jetzt starten</h3><div class="tl-s">Offerte innert 48 h</div></div>
      <div class="tl-body"><div class="tl-cta"><p>Kostenlose Beratung mit unserem Projektmanager. Falls nötig, vereinbaren wir anschliessend eine Besichtigung und bestätigen deren Bedingungen vorab.</p>
        <div class="tl-cta-b"><a class="btn btn-brass mag" data-go="kontakt">Offerte anfragen<span class="ic">${ic.arrow}</span></a><a class="btn btn-line" href="${CO.wa}" target="_blank" rel="noopener">${ic.chat} WhatsApp</a></div></div></div>
    </div>
  </div>
</div></div>
<div class="sec w-sec" id="knigge" style="padding-top:0"><div class="wrap">
  ${secHead('So arbeiten wir auf Ihrer Baustelle.','Vier Regeln, die auf jeder Baustelle gelten — im bewohnten Haus, im Laden und auf dem Rohbau.','38px')}
  <div class="knigge-wrap">
    ${kniggeList()}
    <aside class="incl-card rv"><h3 class="disp">Im Festpreis inbegriffen</h3>
      <ol class="wtable wtable--tight">${INCLUDED.map((x,i)=>`<li class="wt-row"><span class="wt-n disp">${String(i+1).padStart(2,'0')}</span><div class="wt-txt"><p>${x}</p></div></li>`).join('')}</ol>
      <button class="lnk-arrow" data-go="leistungen">Alle Leistungen <span>${ic.arrow}</span></button></aside>
  </div>
</div></div>
<div class="sec w-sec m-keep" id="stimmen"><div class="wrap">
        <div class="w-reviews">${secHead('Kundenstimmen.','Was Kundinnen und Kunden nach der Übergabe sagen — Auszüge aus öffentlichen Bewertungen.','22px')}
          ${(()=>{const shown=REVIEWS.filter(r=>(r.rating||5)>=MIN_REVIEW_RATING);   /* nie ungeprüft unter 4★ zeigen, auch nicht nach dem n8n-Sync */
            const card=r=>`<article class="review"><p class="q">${r.q}</p><div class="who"><b>${r.who}</b><span>${r.role}</span><em>${r.src}</em></div></article>`;
            const A=shown.map(card),B=shown.slice(1).concat(shown.slice(0,1)).map(card);   /* zweite Spalte versetzt, damit nie zwei gleiche Karten nebeneinander stehen */
            const col=(cards,rev)=>`<div class="rv-col${rev?' rv-col--rev':''}" aria-hidden="${rev?'true':'false'}"><div class="rv-track">${cards.join('')}${cards.join('')}</div></div>`;
            return `<div class="rv-cols rv" style="--dur:${Math.max(26,shown.length*11)}s">${col(A,false)}${col(B,true)}</div>`;})()}
          ${CO.rating&&CO.ratingCount?`<a class="rating-badge rv" href="${CO.google}" target="_blank" rel="noopener"><span class="stars" aria-hidden="true">${starStr(CO.rating)}</span><b>${CO.rating}</b><span>${CO.ratingCount} Bewertungen auf ${CO.ratingSrc}</span></a>`:''}
          <p class="reviews-src rv">Alle Bewertungen lesen: <a href="${CO.google}" target="_blank" rel="noopener">Google (${CO.rating} · ${CO.ratingCount})</a> und <a href="${CO.renovero}" target="_blank" rel="noopener">Renovero (${CO.renoveroRating} · ${CO.renoveroCount})</a>. <a data-go="bewertung" href="/bewertung">Selbst eine Bewertung schreiben →</a></p>
        </div>
</div></div>
<div class="sec w-sec" style="padding-top:0"><div class="wrap">
  <div class="faqwrap">
    <div class="sec-head"><h2 class="rv">Was uns vor dem ersten Anruf gefragt wird.</h2>
      <p class="lead rv" style="margin-top:16px">Die häufigsten Fragen — kurz beantwortet. Alles andere klären wir am Telefon.</p>
      <div class="rv" style="margin-top:26px"><button class="nav-cb" id="cbOpen2" type="button" aria-label="Rückruf in 5 Minuten anfordern"><i></i><span>Rückruf in 5 Min</span></button></div></div>
    <div class="faq rv" id="faq">
      ${FAQ.map((f,i)=>`<details${i===0?' open':''}><summary><span>${f[0]}</span><i></i></summary><div class="ans"><p>${f[1]}</p></div></details>`).join('')}
    </div>
  </div>
</div></div>
<div class="sec w-sec" id="team" style="padding-top:0"><div class="wrap">
  <div class="team no-fig">
    <div class="team-txt">
      ${secHead('Wer hinter BauStern steht.','')}
      <blockquote class="rv"><p>${TEAM.quote}</p><cite>${TEAM.name}, ${TEAM.role}</cite></blockquote>
      <dl class="team-facts rv">${TEAM.facts.slice(0,3).map(f=>`<div><dt>${f[0]}</dt><dd>${f[1]}</dd></div>`).join('')}</dl>
      <button class="lnk-arrow rv" data-go="ueber">Mehr über den Betrieb <span>${ic.arrow}</span></button>
    </div>
  </div>
</div></div>
<div class="sec w-sec" id="versprechen"><div class="wrap ssr-wrap">
  <div class="ssr" id="promisesSsr">
    <div class="ssr-side"><div class="ssr-side-in">
      ${secHead('Vier Versprechen, schriftlich.','Was in jedem Werkvertrag steht — unabhängig davon, ob Sie eine Leerwohnung oder ein ganzes Portfolio vergeben.','26px')}
      <div class="ssr-fig">${livingPic('Referenzobjekt — Wohnraum')}</div>
    </div></div>
    <div class="ssr-list">
      ${PROMISES.map((p,i)=>{const target=p.scroll?{scroll:p.scroll}:{go:p.go};
        return `<div class="ssr-item" data-i="${i}">${stretchTo(target,p.t+' — '+p.cta)}<span class="ssr-n">0${i+1}</span><h3 class="disp">${p.t}</h3><p>${p.d}</p>
          <span class="lnk">${p.cta} <span class="a">${ic.arrow}</span></span></div>`;}).join('')}
    </div>
  </div>
</div></div>
<div class="band w-band"><div class="wrap sec">
  ${secHead('Eingetragen, eingehalten, einsehbar.','','40px')}
  <div class="trust">
    ${[["Handelsregister Zürich",CO.hr,"seit "+CO.hrSince],
       ["Versichert","Betriebshaftpflicht abgeschlossen","Schäden sind gedeckt"],
       ["Inhaber",CO.owner,"Klare Verantwortung"],
       ["Ein Ansprechpartner","Alle Gewerke aus einer Hand","Schweizweit verfügbar"]]
      .map(r=>`<div class="rv"><div class="k"><span class="dia" aria-hidden="true"></span></div><h3>${r[0]}</h3><p>${r[1]}</p><p style="color:var(--accent-hi);margin-top:8px">${r[2]}</p></div>`).join('')}
  </div>
</div></div>
      <div class="sec w-sec m-keep" id="offerte"><div class="wrap offer-head">${secHead('Offerte innert 48 h.','Fünf Angaben genügen. Wir rufen in 5 Minuten zurück, besichtigen bei Bedarf und senden Ihnen die Festpreis-Offerte innert 48 Stunden.','28px')}</div><div class="wrap contact">
        ${contactForm()}
        <div class="cinfo rv">
          <div class="dark"><div class="k">Direkter Kontakt</div>
            <a class="big" href="tel:${CO.phoneRaw}">${ic.phone} ${CO.phone}</a>
            <a href="mailto:${CO.mail}">${ic.mail} ${CO.mail}</a>
            <a href="${CO.wa}" target="_blank" rel="noopener">${ic.chat} WhatsApp</a>
            <a ${bookingAttrs}>${ic.cal} ${bookingLabel}</a>
            <div class="li">${ic.pin} <span>${CO.addr}</span></div></div>
          <div class="light"><div class="k">Öffnungszeiten</div>
            <div style="font-size:15px;line-height:1.7">${CO.hours}</div>
            <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--line);font-size:13.5px;color:var(--muted)">Kostenlose Beratung. Rückruf in 5 Minuten, Festpreis-Offerte innert 48 h.</div></div>
        </div>
      </div></div>
<!-- Wissen-Teaser entfernt, bis echte Artikel vorliegen (nur "Artikel folgt"-Karten = Sackgasse). Seite #/wissen bleibt über den Footer erreichbar. -->
<div class="sec w-sec" id="region" style="padding-top:0"><div class="wrap">
  <div class="region">
    <div class="region-txt">
      ${secHead('Einsatzgebiet.','')}
      <p class="lead rv" style="margin-top:16px">Sitz und Materiallager in Zürich-Altstetten, direkt am A1-Anschluss. Von dort aus bedienen wir Zürich, Winterthur, Zug, Luzern und nach Absprache die ganze Deutschschweiz.</p>
      <p class="rv" style="margin-top:14px;color:var(--muted);font-size:15px">Für Portfolios mit mehreren Standorten bündeln wir Einsätze regional, damit Anfahrten nicht auf Ihrer Rechnung landen.</p>
      <p class="rv" style="margin-top:22px"><button class="lnk-arrow" data-go="kontakt">Objekt melden <span>${ic.arrow}</span></button></p>
    </div>
    <ul class="region-list rv">${REGIONS.map(r=>{const seo=(typeof REGION_SEO!=='undefined'?REGION_SEO:[]).find(x=>x.n===r.n);const tag=seo?'a':'div';const attrs=seo?` data-go="sanierung-${seo.slug}" href="/sanierung-${seo.slug}"`:'';return `<li><${tag}${attrs}><b>${r.n}</b><span>${r.sub}</span></${tag}><em>${r.time}</em></li>`;}).join('')}</ul>
  </div>
</div></div>
<div class="sec w-sec" style="padding-top:0"><div class="wrap">
  <div class="magnet rv">
    <div class="txt">
      <h2 class="disp">Referenzmappe als PDF.</h2>
      <p>Eine Auswahl unserer Projektfotos und der Ablauf einer Zusammenarbeit — kompakt auf fünf Seiten. Praktisch, wenn Sie intern jemanden überzeugen müssen.</p>
      <div class="mini"><span>Projektfotos</span><span>Leistungen</span><span>Zusammenarbeit</span></div>
      <label for="magmail">E-Mail für die Referenzmappe</label>
      <form class="row" id="magForm" novalidate aria-label="Referenzmappe anfordern">
        <input type="email" inputmode="email" autocomplete="email" id="magmail" placeholder="name@firma.ch" aria-describedby="magnote">
        <button type="submit" class="btn btn-night mag" id="magbtn">PDF anfordern<span class="ic">${ic.arrow}</span></button>
      </form>
      <div class="note" id="magnote" role="status" aria-live="polite" tabindex="-1">Nur für die Zusendung. Kein Newsletter.</div>
    </div>
    <div class="fig">${livingPic('Referenzmappe BauStern')}</div>
  </div>
</div></div>
    </div></section>
  </div>
${dailyGrid()}</div>`;}

/* Aus dem Alltag: nur rendern, wenn echte, frische Baustellenfotos hinterlegt sind (DAILY_PHOTOS in data.js) —
   kein Platzhalter-Raster. Ausserhalb von .w-flow, damit der Kamera-Film unangetastet bleibt. */
function dailyGrid(){
  if(typeof DAILY_PHOTOS==='undefined'||!DAILY_PHOTOS.length)return '';
  const items=DAILY_PHOTOS.slice(0,6);
  return `<div class="sec" id="alltag"><div class="wrap">
  ${secHead('Aus dem Alltag.','Unbearbeitete Fotos direkt von laufenden Baustellen — kein Rendering, kein Stockfoto.')}
  <div class="alltag-grid">${items.map(p=>`<figure class="alltag-cell">${lz(p.img,p.cap)}<figcaption>${p.cap}</figcaption></figure>`).join('')}</div>
</div></div>`;
}

/* ===== Leistungen ===== */
function pLeistungen(){return `
${pageHead("Sechs Gewerke aus einer Hand.","Als Gesamtauftrag oder Einzelgewerk — koordiniert über einen Ansprechpartner, dokumentiert und termintreu im Bauzeitplan.")}
<!-- v8.1 (Vorgabe 1, Referenz: Leistungsverzeichnis statt sechs identischer Grosskarten — blach.com-Rhythmus,
     minaleandmann-Index): links eine sticky Übersicht (Sprung + Vergleich), rechts nummerierte Zeilen mit
     Kernpunkten und kleinem Bild. Ein Blick zeigt alle sechs Gewerke, jede Zeile führt zum Detail. -->
<section class="sec" style="padding-top:12px"><div class="wrap svc-layout">
  <aside class="svc-rail rv">
    <div class="svc-rail-k">Leistungsverzeichnis</div>
    <ol class="svc-rail-list">${SVC.map(s=>`<li><a href="#svc-${s.slug}" data-scroll="svc-${s.slug}"><span class="n">${s.no}</span>${s.t}</a></li>`).join('')}</ol>
    <div class="svc-rail-cmp">
      <div class="cmp-row"><span class="k">Gesamtauftrag</span><span>Alle Gewerke, ein Bauleiter, ein Werkvertrag, ein Übergabetermin.</span></div>
      <div class="cmp-row"><span class="k">Einzelgewerk</span><span>Ein Gewerk, gleicher Ablauf: Besichtigung, Festpreis, Protokoll.</span></div>
    </div>
    <a class="btn btn-night mag" data-go="kontakt">Offerte anfragen<span class="ic">${ic.arrow}</span></a>
  </aside>
  <div class="svc-list">
    ${SVC.map(s=>`<article class="svc-row clickcard" id="svc-${s.slug}">${stretch('leistungen/'+s.slug,s.t+' — Details öffnen')}
      <span class="svc-no">${s.no}</span>
      <div class="svc-main">
        <h2 class="disp">${s.t}</h2>
        <p class="svc-d">${s.d}</p>
        <ul class="svc-pts">${s.pts.slice(0,4).map(p=>`<li>${p}</li>`).join('')}</ul>
        <span class="lnk-arrow">${s.detail?s.detail.h1:s.t} <span>${ic.arrow}</span></span>
      </div>
      <div class="svc-thumb"><div class="fig">${lz(s.img,s.t+' — BauStern Referenz')}</div></div>
    </article>`).join('')}
  </div>
</div></section>
${inclBand(INCLUDED,'In jeder Offerte enthalten.','Unabhängig vom Gewerk — ohne Aufpreis, schriftlich in der Offerte.')}
${ctaBand()}`;}

function pLeistung(slug){
  const s=svcBySlug(slug);if(!s||!s.detail)return null;
  const d=s.detail,works=WORKS.filter(w=>w.g.includes(s.k)).slice(0,8);
  const others=SVC.filter(x=>x!==s);
  return `
<section class="sec" style="padding-bottom:0"><div class="wrap">
  ${crumb('Leistungen','leistungen')}
  <div class="svc-hero">
    <div class="txt">
      <h1 class="disp rv">${d.h1}</h1>
      <p class="lead rv" style="margin-top:22px">${d.lead}</p>
      <div class="hero-cta rv" style="margin-top:28px">
        <a class="btn btn-brass mag" data-go="kontakt" data-svc="${esc(s.t)}">Offerte anfragen<span class="ic">${ic.arrow}</span></a>
        <a class="btn btn-ghost" href="tel:${CO.phoneRaw}">${ic.phone} ${CO.phone}</a></div>
    </div>
    <div class="fig rv">${lz(s.img,s.t+' — BauStern')}</div>
  </div>
  <div class="merkmale">
    ${d.merkmale.map(m=>`<div class="merkmal rv"><span class="dia"></span><h3>${m[0]}</h3><p>${m[1]}</p></div>`).join('')}
  </div>
</div></section>

<section class="sec"><div class="wrap">
  ${secHead('Teilleistungen ' + s.t + '.','Was wir im Gewerk ' + s.t + ' übernehmen — einzeln oder als Teil eines Gesamtauftrags.','34px')}
  <div class="teil-grid">
    ${d.teil.map(t=>`<article class="teil rv"><span class="k"><span class="dia" aria-hidden="true"></span></span><h3 class="disp">${t.t}</h3><p>${t.d}</p></article>`).join('')}
    <article class="teil dark rv"><h3 class="disp">Nicht dabei?</h3><p>Beschreiben Sie den Umfang — wir sagen Ihnen bei der Besichtigung, ob und wie wir es übernehmen.</p>
      <button class="lnk-arrow light" data-go="kontakt">Anfrage stellen <span>${ic.arrow}</span></button></article>
  </div>
</div></section>

${inclBand(d.incl,'Im Festpreis inbegriffen.','Was in jeder Offerte für '+s.t+' enthalten ist — ohne Aufpreis.')}

<section class="sec"><div class="wrap">
  ${secHead('Drei Gründe für BauStern.','','38px')}
  <div class="gruende">
    ${d.gruende.map(g=>`<div class="counter rv"><div class="v"><span class="dia" aria-hidden="true"></span></div><h3 class="disp" style="font-size:22px;margin:14px 0 8px">${g[0]}</h3><p class="l" style="margin-top:0">${g[1]}</p></div>`).join('')}
  </div>
</div></section>

${faqSec(d.faq,'Häufige Fragen zu '+s.t+'.','Kurz beantwortet. Alles andere klären wir bei der Besichtigung.')}

<section class="sec" style="padding-top:0" id="works"><div class="wrap">
  <div class="sec-row">${secHead('Ausgeführte Arbeiten: '+s.t+'.','Bilder aus Projekten in Zürich und der Deutschschweiz. Jedes Bild lässt sich öffnen.')}
    <button class="lnk-arrow rv" data-go="referenzen">Alle Referenzen <span>${ic.arrow}</span></button></div>
  <div class="workgrid">${worksGrid(works)}</div>
</div></section>

<div class="sec" style="padding-top:0"><div class="wrap">
  <div class="other-svc rv"><span>Weitere Gewerke:</span>${others.map(o=>`<button data-go="leistungen/${o.slug}">${o.t}</button>`).join('')}</div>
</div></div>
${ctaBand(s.t)}`;}

/* ===== Lösungen ===== */
function pLoesungen(){return `
${pageHead("Auf Ihren Betrieb zugeschnitten.","Ob Verwaltung, Generalunternehmer oder Gewerbe — wir arbeiten so, wie Ihr Betrieb es braucht: gebündelt, dokumentiert und ohne Kommunikationsverlust.")}
<!-- v8.1 (Vorgabe 1+2, Referenz: Segment-Filter nach Kundentyp — kuemmerlein.de Dual-Achse, minaleandmann):
     ein Segment-Control "Ich bin …" schaltet EIN Panel um (Realität links, Foto + Leistungen rechts) statt drei
     gleicher Fotokarten. Der Wechsel ist animiert (app.js initSegments), Tiefe kommt aus den SOL.detail-Daten. -->
<section class="sec" style="padding-top:8px"><div class="wrap">
  <div class="seg rv" id="segCtl" role="tablist" aria-label="Kundensegment wählen">
    <span class="seg-k">Ich bin …</span>
    ${SOL.map((s,i)=>`<button class="seg-btn${i===0?' on':''}" role="tab" aria-selected="${i===0}" aria-controls="segp-${s.slug}" data-seg="${i}">${s.t.replace('Für ','')}</button>`).join('')}
    <span class="seg-ind" aria-hidden="true"></span>
  </div>
  <div class="seg-panels" id="segPanels">
    ${SOL.map((s,i)=>{const d=s.detail;return `<div class="seg-panel${i===0?' on':''}" id="segp-${s.slug}" role="tabpanel" ${i?'hidden':''}>
      <div class="seg-txt">
        <span class="tag">${s.tag}</span>
        <h2 class="disp">${d.h1}</h2>
        <p class="lead">${d.lead}</p>
        <div class="seg-real">${d.real.map(r=>`<div class="r"><b>${r[0]}</b><span>${r[1]}</span></div>`).join('')}</div>
        <div class="hero-cta">
          <a class="btn btn-brass mag" data-go="loesungen/${s.slug}">Lösung im Detail<span class="ic">${ic.arrow}</span></a>
          <a class="btn btn-ghost" data-go="kontakt" data-who="${esc(SOL_WHO[s.slug]||'')}">Offerte anfragen</a>
        </div>
      </div>
      <div class="seg-side">
        <div class="seg-fig tilt-photo"><div class="fig">${lz(s.img,s.t)}</div></div>
        <div class="seg-takes"><div class="k">Was BauStern übernimmt</div>
          <ol>${d.takes.slice(0,4).map(t=>`<li><b>${t[0]}</b><span>${t[1]}</span></li>`).join('')}</ol></div>
      </div>
    </div>`;}).join('')}
  </div>
</div></section>
<section class="band"><div class="wrap sec">
  ${secHead('Vier Versprechen, schriftlich.','','40px')}
  <div class="trust">${PROMISES.map(p=>`<div class="rv"><div class="k"><span class="dia" aria-hidden="true"></span></div><h3>${p.t}</h3><p>${p.d}</p></div>`).join('')}</div>
</div></section>${ctaBand()}`;}

function pLoesung(slug){
  const s=solBySlug(slug);if(!s||!s.detail)return null;
  const d=s.detail,others=SOL.filter(x=>x!==s);
  return `
<section class="sec" style="padding-bottom:0"><div class="wrap">
  ${crumb('Lösungen','loesungen')}
  <div class="svc-hero">
    <div class="txt"><span class="tag rv">${s.tag}</span>
      <h1 class="disp rv">${d.h1}</h1>
      <p class="lead rv" style="margin-top:22px">${d.lead}</p>
      <div class="hero-cta rv" style="margin-top:28px">
        ${d.cta?`<a class="btn btn-brass mag" data-go="kontakt" data-who="${esc(SOL_WHO[s.slug]||'')}" data-svc="Renovation" data-message="${esc(d.cta.msg)}">${esc(d.cta.t)}<span class="ic">${ic.arrow}</span></a>
        <a class="btn btn-ghost" data-go="kontakt" data-who="${esc(SOL_WHO[s.slug]||'')}">Offerte anfragen</a>`
        :`<a class="btn btn-brass mag" data-go="kontakt" data-who="${esc(SOL_WHO[s.slug]||'')}">Offerte anfragen<span class="ic">${ic.arrow}</span></a>
        <a class="btn btn-ghost" ${bookingAttrs}>${ic.cal} ${bookingLabel}</a>`}</div>
    </div>
    <div class="fig rv">${lz(s.img,s.t+' — BauStern')}</div>
  </div>
</div></section>

<section class="sec"><div class="wrap">
  ${secHead('Ihre Realität.','Drei Probleme, die wir aus Gesprächen mit '+s.t.replace('Für ','')+' kennen.','34px')}
  <div class="real-grid">
    ${d.real.map(r=>`<article class="real rv"><span class="k"><span class="dia" aria-hidden="true"></span></span><h3 class="disp">${r[0]}</h3><p>${r[1]}</p></article>`).join('')}
  </div>
</div></section>

<section class="band"><div class="wrap sec">
  ${secHead('Was BauStern übernimmt.','','40px')}
  <div class="trust">${d.takes.map(t=>`<div class="rv"><div class="k"><span class="dia" aria-hidden="true"></span></div><h3>${t[0]}</h3><p>${t[1]}</p></div>`).join('')}</div>
</div></section>

${d.ablauf?`
<section class="sec"><div class="wrap">
  ${secHead(d.ablauf.t,d.ablauf.lead,'34px')}
  <ol class="wtable">${d.ablauf.steps.map((x,i)=>`<li class="wt-row rv"><span class="wt-n disp">${String(i+1).padStart(2,'0')}</span><div class="wt-txt"><h3>${x[0]}</h3><p>${x[1]}</p></div></li>`).join('')}</ol>
</div></section>`:''}

${d.zugang?`
<section class="sec" style="padding-top:0"><div class="wrap">
  ${secHead(d.zugang.t,d.zugang.lead,'34px')}
  <div class="promises">
    ${d.zugang.items.map(x=>`<article class="promise rv"><span class="dia" aria-hidden="true"></span><h3 class="disp">${x[0]}</h3><p>${x[1]}</p></article>`).join('')}
  </div>
</div></section>`:''}

${d.rahmen?`
<section class="sec incl-band" style="padding-top:0"><div class="wrap">
  ${secHead(d.rahmen.t,d.rahmen.lead,'30px')}
  <ul class="incl-list">${d.rahmen.items.map(x=>`<li class="rv">${x}</li>`).join('')}</ul>
</div></section>`:''}

<section class="sec"><div class="wrap">
  ${secHead('Drei Gründe.','','38px')}
  <div class="gruende">
    ${d.gruende.map(g=>`<div class="counter rv"><div class="v"><span class="dia" aria-hidden="true"></span></div><h3 class="disp" style="font-size:22px;margin:14px 0 8px">${g[0]}</h3><p class="l" style="margin-top:0">${g[1]}</p></div>`).join('')}
  </div>
</div></section>

${faqSec(d.faq,'Häufige Fragen.','Was '+s.t.replace('Für ','')+' uns vor dem ersten Auftrag fragen.')}

<div class="sec" style="padding-top:0"><div class="wrap">
  <div class="other-svc rv"><span>Weitere Lösungen:</span>${others.map(o=>`<button data-go="loesungen/${o.slug}">${o.t}</button>`).join('')}</div>
</div></div>
${ctaBand(null,SOL_WHO[s.slug])}`;}

/* ===== Referenzen ===== */
function pReferenzen(){return `
${pageHead("Ausgeführte Projekte.","Fallstudien und eine Auswahl realisierter Arbeiten in Zürich und der Deutschschweiz — Bäder, Küchen, ganze Objekte und Gewerbeflächen.")}
<!-- v8.1: Zahlenleiste (Fakten statt Floskeln), Fallstudien als Erzählkarten, Galerie als Bento (grosse Kader für
     die stärksten Bilder, Filter mit Aus-/Ein-Übergang statt hartem Neuaufbau) -->
<section class="sec" style="padding-top:0"><div class="wrap">
  <div class="ref-stats rv">
    <div><b data-odo="${WORKS.length}">${WORKS.length}</b><span>Arbeiten dokumentiert</span></div>
    <div><b data-odo="${PROJECTS.length}">${PROJECTS.length}</b><span>Fallstudien komplett</span></div>
    <div><b>${SVC.length}</b><span>Gewerke aus einer Hand</span></div>
    <div><b>${CO.rating}</b><span>${CO.ratingSrc}-Bewertung · ${CO.ratingCount} Rezensionen</span></div>
  </div>
</div></section>
<section class="sec" style="padding-top:0"><div class="wrap">
  ${secHead('Fallstudien.','Ganze Projekte mit Ausgangslage, Lösung und Ergebnis.','30px')}
  <div class="projgrid projcards">${PROJECTS.map(projCard).join('')}</div>
</div></section>
<section class="sec" style="padding-top:0" id="works"><div class="wrap">
  ${secHead('Alle Arbeiten nach Gewerk.',`${WORKS.length} Beispiele, gefiltert nach Gewerk. Jedes Bild lässt sich öffnen.`,'28px')}
  <div class="tabs rv" id="tabs">
    <button class="tab on" data-f="all">Alle<span class="cnt">${WORKS.length}</span></button>
    ${SVC.map(s=>`<button class="tab" data-f="${s.k}">${s.t}<span class="cnt">${WORKS.filter(w=>w.g.includes(s.k)).length}</span></button>`).join('')}
  </div>
  <div class="workgrid workgrid--bento" id="workgrid">${worksGrid(WORKS)}</div>
  <div class="works-foot"><button class="btn btn-ghost mag" id="moreworks" style="display:none">Mehr Arbeiten zeigen<span class="ic">${ic.arrow}</span></button></div>
</div></section>${ctaBand()}`;}

/* ===== Fallstudie ===== */
function pProjekt(slug){
  const p=projectBySlug(slug);if(!p)return null;
  const related=p.related.map(workById).filter(Boolean);
  const others=PROJECTS.filter(x=>x!==p).slice(0,3);
  const cell=src=>{const w=workByImg(src)||related[0];const alt=(w?w.t:p.title)+' — '+p.loc;
    return `<div class="gal-cell" data-work="${w?w.id:''}" tabindex="0" role="button" aria-label="${esc(w?w.t:p.title)} öffnen">${lz(src,alt)}${w?`<span class="cap">${w.t}</span>`:''}</div>`;};
  return `
<section class="sec" style="padding-bottom:0"><div class="wrap">
  ${crumb('Referenzen','referenzen')}
  <div class="proj-head">
    <div><h1 class="disp rv">${p.title}</h1><p class="lead rv" style="margin-top:20px">${p.sub}</p>
      <p class="rv proj-loc">${ic.pin} ${p.loc}</p></div>
    <div class="proj-facts rv">${p.facts.map(f=>`<div class="f"><div class="n">${phv(f[0])}</div><div class="l">${f[1]}</div></div>`).join('')}</div>
  </div>
  <div class="proj-cover rv">${lz(p.cover,p.title+' — '+p.loc)}</div>
</div></section>

<section class="sec"><div class="wrap">
  <div class="story">
    ${[['Ausgangslage',p.story.ausgangslage],['Lösung',p.story.loesung],['Ergebnis',p.story.ergebnis]].map((s,i)=>`<article class="rv"><span class="k">0${i+1}</span><h2 class="disp">${s[0]}</h2><p>${s[1]}</p></article>`).join('')}
  </div>
  <div class="case-eng proj-eng rv">${p.gewerke.map(g=>`<span>${g}</span>`).join('')}</div>
</div></section>

<section class="sec" style="padding-top:0"><div class="wrap">
  ${secHead('Galerie.','Jedes Bild lässt sich öffnen.','28px')}
  <div class="gal-grid rv">${p.gallery.map(cell).join('')}</div>
</div></section>

${others.length?`<section class="sec" style="padding-top:0"><div class="wrap">
  ${secHead('Ähnliche Projekte.','','28px')}
  <div class="projgrid">${others.map(projCard).join('')}</div>
</div></section>`:''}
${ctaBand()}`;}

/* ===== Über uns ===== */
function pUeber(){return `
${pageHead("Wer hinter BauStern steht.",`${CO.legal} — geführt von ${CO.owner}, mit Sitz in Zürich-Altstetten. Sechs Gewerke, ein Ansprechpartner, für Geschäftskunden in der ganzen Deutschschweiz.`)}
<!-- v8.1 (Vorgabe 1, Referenz: Fakten-/Datenblatt statt Textspalte — braggcompanies "Why us", kuemmerlein
     Credentials): links das sticky Datenblatt (prüfbare Angaben: HR, UID, Sitz, Garantie), rechts Inhaber,
     Arbeitsweise und Vertrauenssignale. Kein Portraitfoto (Aufgabe #8). -->
<section class="sec" style="padding-top:12px"><div class="wrap about-v8">
  <aside class="sheet rv">
    <div class="sheet-k">Datenblatt</div>
    <dl class="sheet-dl">
      ${[["Rechtsform",CO.legal],["Inhaber",CO.owner+" · "+TEAM.role],["UID",CO.uid],["Handelsregister",CO.hr],["Eingetragen seit",CO.hrSince],["Sitz",CO.addr],["Einsatzgebiet",CO.area],["Sprachen",CO.langs],["Erreichbar",CO.hours],["Werkgarantie","24 Monate, schriftlich im Werkvertrag"]]
        .map(r=>`<div class="row"><dt>${r[0]}</dt><dd>${r[1]}</dd></div>`).join('')}
    </dl>
    <div class="sheet-trust">
      <span>${starStr(CO.rating)} ${CO.rating} · ${CO.ratingCount} ${CO.ratingSrc}-Rezensionen</span>
      <a href="${CO.google}" target="_blank" rel="noopener" class="lnk-arrow">Bei Google prüfen <span>${ic.arrow}</span></a>
    </div>
  </aside>
  <div class="about-main">
    <div class="owner rv">
      <span class="tag">Inhaber &amp; Bauleiter</span>
      <h2 class="disp">${TEAM.name}</h2>
      <p class="lead">${TEAM.bio}</p>
      <blockquote><p>${TEAM.quote}</p><cite>${TEAM.name}</cite></blockquote>
    </div>
    <div class="fact-grid">
      <div class="fact"><span class="k">Für wen</span><p>Hausverwaltungen und Eigentümer, Generalunternehmer, Büro-, Gewerbe- und Ladenflächen.</p></div>
      <div class="fact"><span class="k">Ablauf</span><p>Besichtigung nach Vereinbarung, verbindliche Festpreis-Offerte Position für Position, Beginn und Übergabe im Werkvertrag.</p></div>
      <div class="fact"><span class="k">Auf der Baustelle</span><p>${CO.langs} — Protokolle und Offerten auf Deutsch, Absprachen in der Sprache, die vor Ort gebraucht wird.</p></div>
      <div class="fact"><span class="k">Logistik</span><p>Materiallager in Zürich-Altstetten mit A1-Anschluss. Einsätze in Zürich, Winterthur, Zug, Luzern und der ganzen Deutschschweiz.</p></div>
    </div>
  </div>
</div></section>

<section class="sec" style="padding-top:0"><div class="wrap">
  ${secHead('Vier Versprechen.','','30px')}
  ${promisesGrid(true)}
</div></section>

<section class="sec" style="padding-top:0"><div class="wrap">
  ${secHead('So arbeiten wir auf Ihrer Baustelle.','','34px')}
  <div class="knigge-wrap">
    ${kniggeList()}
    <aside class="incl-card rv"><h3 class="disp">Im Festpreis inbegriffen</h3>
      <ul class="dl">${INCLUDED.map(x=>`<li>${x}</li>`).join('')}</ul></aside>
  </div>
</div></section>
${ctaBand()}`;}

/* ===== Wissen ===== */
function pWissen(){return `
${pageHead("Wissen & Ratgeber.","Kosten, Bewilligungen, Steuern und Abläufe rund um Renovation und Unterhalt in Zürich — kurz, sachlich, ohne Verkaufstext. Die Artikel werden laufend ergänzt.")}
<section class="sec" style="padding-top:20px"><div class="wrap">
  <!-- Block 3 (3.8): kein Karten-Raster mehr — editorielle Swiss-Table, nummeriert, mit Trennlinien statt Boxen. -->
  <div class="wtable">
    ${WISSEN.map((w,i)=>{const n=String(i+1).padStart(2,'0'),clickable=w.slug&&w.body;
      const body=`<span class="wt-n disp">${n}</span>
        <div class="wt-txt"><span class="wt-cat">${w.cat}</span><h2 class="disp">${w.t}</h2><p>${w.d}</p></div>
        <span class="wt-go">${clickable?`<span class="lnk-arrow">Artikel lesen <span>${ic.arrow}</span></span>`:`<button type="button" class="wt-ask" data-go="kontakt">Frage stellen <span class="lnk-arrow"><span>${ic.arrow}</span></span></button>`}</span>`;
      return clickable?`<article class="wt-row rv clickcard">${stretch('wissen/'+w.slug,w.t)}${body}</article>`:`<article class="wt-row rv is-soon">${body}</article>`;}).join('')}
  </div>
  <p class="rv" style="margin-top:30px;color:var(--muted);font-size:15px;max-width:60ch">Sie haben eine konkrete Frage zu einem dieser Themen? Rufen Sie an oder schreiben Sie uns — wir antworten an Werktagen innert 24 Stunden.</p>
</div></section>
${ctaBand()}`;}

/* Artikel-Detail — nur Slugs mit echtem "body" liefern eine Seite, alles andere faellt auf die Uebersicht
   zurueck (detailOr() in app.js), genau wie bei Leistungen/Loesungen/Projekten. */
function pWissenArtikel(slug){
  const w=WISSEN.find(x=>x.slug===slug&&x.body);
  if(!w)return null;
  return `
${pageHead(w.t,w.d)}
<section class="sec" style="padding-top:0"><div class="wrap">
  <button class="lnk-arrow" data-go="wissen" style="margin-bottom:26px">${ic.arrow.replace('→','←')} Zurück zu Wissen & Ratgeber</button>
  <article class="wissen-art rv"><span class="cat">${w.cat}</span>${w.body}</article>
  <div class="incl-card rv" style="margin-top:40px;max-width:640px">
    <h3 class="disp">Frage zu Ihrem konkreten Fall?</h3>
    <p style="margin:8px 0 16px;color:var(--muted)">Jedes Objekt ist anders — schildern Sie uns Ihr Vorhaben, wir antworten an Werktagen innert 24 Stunden.</p>
    <a class="btn btn-brass mag" data-go="kontakt">Frage stellen<span class="ic">${ic.arrow}</span></a>
  </div>
</div></section>
${ctaBand()}`;
}

/* ===== Region-SEO-Seiten ===== */
function pRegionSeo(slug){
  const r=REGION_SEO.find(x=>x.slug===slug);
  if(!r)return null;
  return `
${pageHead('Bauunternehmen für '+r.n+'.',r.lead)}
<p class="sr-only">Renovation, Sanitär &amp; Umbau in ${r.n} — BauStern</p>
<section class="sec" style="padding-top:0"><div class="wrap">
  <div class="promises">
    <article class="promise rv"><span class="dia" aria-hidden="true"></span><h3 class="disp">Anfahrt</h3><p>${r.zeit} — Anfahrt ist im Festpreis inbegriffen, keine separate Position auf der Rechnung.</p></article>
    <article class="promise rv"><span class="dia" aria-hidden="true"></span><h3 class="disp">Ein Ansprechpartner</h3><p>Sechs Gewerke aus einer Hand, koordiniert von einer Bauleitung — auch für Objekte in ${r.n}.</p></article>
    <article class="promise rv"><span class="dia" aria-hidden="true"></span><h3 class="disp">Rahmenvertrag möglich</h3><p>Für Verwaltungen mit mehreren Objekten in ${r.n} und der Region Zürich: feste Konditionen, gebündelte Abrechnung.</p></article>
  </div>
</div></section>
<section class="sec" style="padding-top:0"><div class="wrap">
  ${secHead('Leistungen in '+r.n+'.','Dieselben Gewerke wie in Zürich — dieselbe Bauleitung, dieselben Festpreis-Konditionen.')}
  <div class="promises">
    ${SVC.slice(0,6).map(s=>`<article class="promise rv"><span class="dia" aria-hidden="true"></span><h3 class="disp">${s.t}</h3><p>${s.d}</p><button class="lnk-arrow" data-go="leistungen/${s.slug}">Mehr <span>${ic.arrow}</span></button></article>`).join('')}
  </div>
</div></section>
${estimateSec()}
${ctaBand()}`;
}

/* ===== 404 ===== */
function pNotFound(slug){return `
${pageHead("Diese Seite gibt es nicht.",`Unter «${esc(String(slug||'').slice(0,60))}» ist nichts hinterlegt — vielleicht ein alter Link oder ein Tippfehler in der Adresse.`)}
<section class="sec" style="padding-top:0"><div class="wrap">
  <div class="promises">
    <article class="promise rv"><span class="dia" aria-hidden="true"></span><h3 class="disp">Leistungen</h3><p>Sechs Gewerke aus einer Hand — Renovation bis Malerarbeiten.</p><button class="lnk-arrow" data-go="leistungen">Zu den Leistungen <span>${ic.arrow}</span></button></article>
    <article class="promise rv"><span class="dia" aria-hidden="true"></span><h3 class="disp">Referenzen</h3><p>Ausgeführte Projekte mit Bildern und Ablauf.</p><button class="lnk-arrow" data-go="referenzen">Referenzen ansehen <span>${ic.arrow}</span></button></article>
    <article class="promise rv"><span class="dia" aria-hidden="true"></span><h3 class="disp">Kontakt</h3><p>Anfrage in 30 Sekunden — Antwort an Werktagen innert 24 Stunden.</p><button class="lnk-arrow" data-go="kontakt">Offerte anfragen <span>${ic.arrow}</span></button></article>
    <article class="promise rv"><span class="dia" aria-hidden="true"></span><h3 class="disp">Startseite</h3><p>Zurück zum Rundgang durch die Wohnung.</p><button class="lnk-arrow" data-go="home">Zur Startseite <span>${ic.arrow}</span></button></article>
  </div>
</div></section>
${ctaBand()}`;}

/* ===== Karriere ===== */
function pKarriere(){return `
${pageHead("Handwerk, das man sieht.",`BauStern baut in Zürich und der Deutschschweiz — mit einem kleinen, eingespielten Team statt anonymer Grossbaustelle. Wir suchen Verstärkung, die sauber arbeitet und mitdenkt.`)}
<section class="sec" style="padding-top:0"><div class="wrap">
  <div class="promises">
    <article class="promise rv"><span class="dia" aria-hidden="true"></span><h3 class="disp">Fairer Lohn</h3><p>Ansatz besprechen wir offen im Gespräch — orientiert an den branchenüblichen Löhnen im Kanton Zürich, nicht an einer anonymen Lohntabelle.</p></article>
    <article class="promise rv"><span class="dia" aria-hidden="true"></span><h3 class="disp">Direkter Draht</h3><p>Kleines Team, kurze Wege — Sie sprechen mit dem Bauleiter, nicht mit einer HR-Abteilung.</p></article>
    <article class="promise rv"><span class="dia" aria-hidden="true"></span><h3 class="disp">Region Zürich</h3><p>Einsätze in Zürich, Winterthur, Zug und Luzern — kein wochenlanger Auswärtseinsatz.</p></article>
    <article class="promise rv"><span class="dia" aria-hidden="true"></span><h3 class="disp">Sauberes Werkzeug</h3><p>Ordentliches Material und Werkzeug statt improvisierter Baustellen — das spart Ihnen Zeit und Nerven.</p></article>
  </div>
</div></section>
<section class="sec" style="padding-top:0"><div class="wrap">
  ${secHead('Offene Stellen.','Passt keine der drei genau? Bewerben Sie sich trotzdem — wir finden meist eine Lösung.')}
  <div class="jobs-grid">
    ${KARRIERE.map(j=>`<article class="job-card rv" id="job-${j.slug}">
      <div class="job-head"><h3 class="disp">${j.t}</h3><span class="job-pensum">${j.pensum}</span></div>
      <div class="job-cols">
        <div><b>Aufgaben</b><ul class="dl">${j.aufgaben.map(a=>`<li>${a}</li>`).join('')}</ul></div>
        <div><b>Das bringen Sie mit</b><ul class="dl">${j.anforderungen.map(a=>`<li>${a}</li>`).join('')}</ul></div>
      </div>
      <button type="button" class="btn btn-brass mag job-apply" data-role="${esc(j.t)}">Für diese Stelle bewerben<span class="ic">${ic.arrow}</span></button>
    </article>`).join('')}
  </div>
</div></section>
<section class="sec" style="padding-top:0"><div class="wrap contact">
  <form class="form rv" id="jobFormCard" novalidate aria-label="Bewerbung senden">
    <h3 class="disp" style="margin-bottom:18px">Bewerbung senden</h3>
    <div class="field"><label for="j-role">Stelle</label><select id="j-role"><option value="">Bitte wählen</option>${KARRIERE.map(j=>`<option>${esc(j.t)}</option>`).join('')}<option>Initiativbewerbung</option></select></div>
    <div class="two">
      <div class="field" id="jf-name"><label for="j-name">Name <span class="req">*</span></label><input id="j-name" type="text" autocomplete="name" placeholder="Vor- und Nachname" aria-describedby="jm-name"><div class="msg" id="jm-name" style="display:none">Bitte Ihren Namen eingeben.</div></div>
      <div class="field" id="jf-phone"><label for="j-phone">Telefon <span class="req">*</span></label><input id="j-phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+41 …" aria-describedby="jm-phone"><div class="msg" id="jm-phone" style="display:none">Bitte eine gültige Nummer eingeben, z. B. +41 79 123 45 67.</div></div>
    </div>
    <div class="field"><label for="j-exp">Berufserfahrung</label><select id="j-exp"><option value="">Bitte wählen (optional)</option><option>Weniger als 2 Jahre</option><option>2–5 Jahre</option><option>5–10 Jahre</option><option>Mehr als 10 Jahre</option></select></div>
    <div class="field">
      <label>Lebenslauf / Zeugnisse <span style="font-weight:400;color:var(--muted)">(optional, PDF, JPEG, PNG oder WebP)</span></label>
      <div class="foto-up" id="jobFotoUp">
        <input type="file" id="j-file" accept="image/jpeg,image/png,image/webp,application/pdf" hidden>
        <button type="button" class="btn btn-upload" id="jobFileAdd" aria-describedby="j-e-file">${ic.cam} Datei auswählen</button>
        <div class="foto-list" id="jobFileList" aria-live="polite"></div>
      </div>
      <div class="msg" id="j-e-file" role="status" aria-live="polite" style="display:none">Datei zu gross (max. 8 MB) oder falsches Format.</div>
    </div>
    <div class="hp" aria-hidden="true"><label>Webseite</label><input id="j-hp" type="text" tabindex="-1" autocomplete="off"></div>
    <p class="form-privacy">Ihre Angaben und Unterlagen verwenden wir für diese Bewerbung. <a data-go="datenschutz" target="_blank" rel="noopener">Datenschutzerklärung</a></p>
    <button type="submit" class="btn btn-brass mag" id="jobSubmitBtn">Bewerbung senden<span class="ic">${ic.arrow}</span></button>
    <div id="jobStatus" class="sr-only" role="status" aria-live="polite"></div>
  </form>
  <div class="cinfo rv">
    <div class="dark"><div class="k">Fragen vorab?</div>
      <a class="big" href="tel:${CO.phoneRaw}">${ic.phone} ${CO.phone}</a>
      <a href="mailto:${CO.mail}?subject=Frage%20zur%20Stelle">${ic.mail} ${CO.mail}</a>
      <div class="li">${ic.pin} <span>${CO.addr}</span></div></div>
  </div>
</div></section>`;}

/* ===== Bewertung (Kurz-URL für E-Mail/WhatsApp nach Projektabschluss, siehe review-request-templates.md) ===== */
function pBewertung(){return `
${pageHead("Wie war's mit BauStern?",`Danke, dass Sie uns beauftragt haben. Eine kurze Bewertung hilft anderen Verwaltungen und Eigentümern, sich für uns zu entscheiden — zwei Minuten reichen.`)}
<section class="sec" style="padding-top:0"><div class="wrap">
  <div class="promises bew-grid">
    <article class="promise rv"><span class="dia" aria-hidden="true"></span><h3 class="disp">Google</h3><p>Am sichtbarsten bei der Suche nach «Bauunternehmen Zürich».</p><a class="btn btn-brass mag" href="${CO.googleReviewUrl.replace('q=website','q=bewertung-seite')}" target="_blank" rel="noopener">Auf Google bewerten <span class="ic">${ic.arrow}</span></a></article>
    <article class="promise rv"><span class="dia" aria-hidden="true"></span><h3 class="disp">Renovero</h3><p>Bauplattform, auf der wir bereits ${CO.renoveroCount} Bewertungen haben.</p><a class="btn btn-ghost" href="${CO.renovero}" target="_blank" rel="noopener">Auf Renovero bewerten <span class="ic">${ic.arrow}</span></a></article>
  </div>
  <p style="max-width:620px;margin:28px auto 0;text-align:center;color:var(--muted);font-size:14px">Schreiben Sie, was tatsächlich passiert ist — Handwerk, Termine, Kommunikation. Kein Text wird vorgegeben.</p>
</div></section>`;}

/* ===== Kontakt ===== */
function pKontakt(){return `
${pageHead("In 30 Sekunden zur Anfrage.","Schildern Sie Ihr Projekt — wir melden uns an Werktagen innert 24 Stunden mit den nächsten Schritten.")}
<section class="sec" style="padding-top:20px"><div class="wrap contact">
  ${contactForm()}
  <div class="cinfo rv">
    <div class="dark"><div class="k">Direkter Kontakt</div>
      <a class="big" href="tel:${CO.phoneRaw}">${ic.phone} ${CO.phone}</a>
      <a href="mailto:${CO.mail}">${ic.mail} ${CO.mail}</a>
      <a href="${CO.wa}" target="_blank" rel="noopener">${ic.chat} WhatsApp</a>
      <a ${bookingAttrs}>${ic.cal} ${bookingLabel}</a>
      <div class="li">${ic.pin} <span>${CO.addr}</span></div></div>
    <div class="light"><div class="k">Öffnungszeiten</div>
      <div style="font-size:15px;line-height:1.7">${CO.hours}</div>
      <div style="margin-top:16px;padding-top:16px;border-top:1px solid var(--line);font-size:13.5px;color:var(--muted)">Kostenlose Beratung. Rückruf in 5 Minuten, Festpreis-Offerte innert 48 h.</div></div>
  </div>
</div></section>`;}

/* ===== Footer ===== */
const footer=`<footer><div class="wrap">
  <div class="fgrid">
    <div><div class="fbrand"><svg class="brand-mark" viewBox="0 0 190 170" role="img" aria-label="BauStern"><g transform="translate(44,0)"><rect fill="var(--logo-ink)" x="12" y="56" width="22" height="52"/><rect fill="var(--logo-ink)" x="38" y="28" width="22" height="80"/><rect fill="var(--logo-accent)" x="64" y="42" width="26" height="66"/><polygon fill="var(--logo-accent)" points="49,4 51.7,11.28 59.46,11.6 53.37,16.42 55.47,23.9 49,19.6 42.53,23.9 44.63,16.42 38.54,11.6 46.3,11.28"/></g><text x="95" y="150" text-anchor="middle" font-family="Archivo,sans-serif" font-weight="800" font-size="34" letter-spacing="-1"><tspan fill="var(--logo-ink)">Bau</tspan><tspan fill="var(--logo-accent)">Stern</tspan></text></svg></div>
      <p style="color:rgba(255,255,255,.6);font-size:14px;line-height:1.7;max-width:30ch">Baupartner für Immobilien & Gewerbe. Sechs Gewerke, ein Ansprechpartner — in der ganzen Deutschschweiz.</p>
      <div class="tags"><span>HR Zürich</span><span>Versichert</span><span>Werkgarantie 24 Monate</span></div>
      <p class="fjob">Wir suchen Monteure → <a data-go="karriere" href="/karriere">Offene Stellen</a></p></div>
    <div><div class="k">Leistungen</div>${SVC.map(s=>`<a data-go="leistungen/${s.slug}">${s.t}</a>`).join('')}</div>
    <div><div class="k">Unternehmen</div>${SOL.map(s=>`<a data-go="loesungen/${s.slug}">${s.t}</a>`).join('')}<a data-go="referenzen">Referenzen</a><a data-go="ueber">Über uns</a><a data-go="wissen">Wissen</a><a data-go="karriere" href="/karriere">Karriere</a><a data-go="kontakt">Kontakt</a></div>
    <div><div class="k">Regionen</div>${REGIONS.map(r=>{const seo=(typeof REGION_SEO!=='undefined'?REGION_SEO:[]).find(x=>x.n===r.n);return seo?`<a data-go="sanierung-${seo.slug}" href="/sanierung-${seo.slug}">${r.n}</a>`:`<div class="li">${r.n}</div>`;}).join('')}</div>
    <div><div class="k">Kontakt</div><a href="tel:${CO.phoneRaw}" style="color:#fff;font-weight:600">${CO.phone}</a><a href="mailto:${CO.mail}">${CO.mail}</a><a href="${CO.wa}" target="_blank" rel="noopener">WhatsApp</a><a ${bookingAttrs}>${bookingLabel}</a><div class="li">${CO.addr}</div><div class="li">${CO.hours}</div></div>
  </div>
  <div class="fbot"><span>© 2026 ${CO.legal}</span><span style="display:flex;gap:18px"><a data-go="impressum">Impressum</a><a data-go="datenschutz">Datenschutz</a></span><span>UID ${CO.uid} · ${CO.hr}</span></div>
</div></footer>`;

/* ===== Rechtliches ===== */
function pImpressum(){return `
${pageHead("Impressum.","Angaben gemäss schweizerischem Recht.")}
<section class="sec" style="padding-top:20px"><div class="wrap legal">
  <h2>Betreiber</h2><p>${CO.legal}<br>${CO.addr}<br>Schweiz</p>
  <h2>Kontakt</h2><p>Telefon ${CO.phone}<br>E-Mail ${CO.mail}</p>
  <h2>Handelsregister</h2><p>${CO.hr}<br>UID ${CO.uid}</p>
  <h2>Verantwortlich für den Inhalt</h2><p>${CO.owner}</p>
  <h2>Haftungsausschluss</h2><p>Die Inhalte dieser Website wurden mit Sorgfalt erstellt. Für Richtigkeit, Vollständigkeit und Aktualität wird keine Gewähr übernommen. Referenzbilder zeigen ausgeführte Arbeiten und Visualisierungen; sie sind nicht Teil eines Angebots.</p>
</div></section>`;}
function pDatenschutz(){return `
${pageHead("Datenschutz.","Was wir mit Ihren Daten tun — und was nicht.")}
<section class="sec" style="padding-top:20px"><div class="wrap legal">
  <h2>Verantwortliche Stelle</h2><p>${CO.legal}, ${CO.addr}. Fragen zum Datenschutz: ${CO.mail}.</p>
  <h2>Anfragen und Objektfotos</h2><p>Im Kontaktformular verarbeiten wir Ihre Kontaktdaten und freiwilligen Angaben zu Firma, Kundentyp, Objekt, Ort, Zeitraum und Projekt. Sie können bis zu drei Objektfotos hinzufügen. Diese werden vor dem Versand im Browser verkleinert. Bitte laden Sie keine unnötigen Angaben oder Bilder anderer Personen hoch.</p>
  <h2>Rückruf und Referenzmappe</h2><p>Für einen Rückruf benötigen wir Ihre Telefonnummer. Bei einer PDF-Anforderung verwenden wir die eingegebene E-Mail-Adresse zur Bearbeitung und Zustellung der Referenzmappe. Kein Newsletter und keine Weitergabe zu fremden Werbezwecken.</p>
  <h2>Bewerbungen</h2><p>Über das Bewerbungsformular erhalten wir Ihren Namen, Ihre Telefonnummer, die gewünschte Stelle und gegebenenfalls Angaben zur Berufserfahrung. Lebenslauf und Zeugnisse sind freiwillige Anhänge. Wir verwenden diese Angaben zur Prüfung Ihrer Bewerbung und zur Kontaktaufnahme.</p>
  <h2>Bearbeitung und Empfänger</h2><p>Anfragen und Bewerbungen werden über unsere Automations-Umgebung n8n unter baucrm.net in unserem CRM mit Supabase gespeichert. Die Datenbankregion ist Frankfurt, Deutschland. Zugriffe und Benachrichtigungen dienen der Bearbeitung durch unser Team. E-Mail-Bestätigungen werden über unseren Google-E-Mail-Dienst versendet; interne Eingangsbenachrichtigungen erfolgen auch über Telegram. Neben Ihren Eingaben übermitteln die Formulare die Herkunftsseite, vorhandene Kampagnenparameter und eine technische Anfragen-ID zur Vermeidung doppelter Einträge.</p>
  <h2>Speicherdauer</h2><p>Anfragen, Kunden- und Auftragsdaten sowie Bewerbungsunterlagen werden derzeit unbefristet in unserem CRM gespeichert; eine automatische Löschung nach zwölf Monaten ist nicht eingerichtet. Gesetzliche Aufbewahrungspflichten und Ihre Datenschutzrechte bleiben davon unberührt. Für Auskunft oder eine Prüfung der Löschung Ihrer Daten kontaktieren Sie uns unter ${CO.mail}.</p>
  <h2>Ihre Rechte</h2><p>Auskunft, Berichtigung, Löschung, Einschränkung und Widerspruch — per E-Mail an ${CO.mail}. Aufsichtsbehörde: Eidgenössischer Datenschutz- und Öffentlichkeitsbeauftragter (EDÖB).</p>
  <h2>Browser-Speicher und Messung</h2><p>Google Analytics und Google Tag Manager sind derzeit nicht aktiviert. Die Website setzt selbst keine Analyse- oder Werbe-Cookies. Bedienereignisse bleiben ohne konfigurierten Analysedienst in der geöffneten Seite. Ein Aufruf dieser Datenschutzerklärung aus einem Formular kann ohne Formulareingaben an unsere n8n-Umgebung protokolliert werden.</p><p>Nicht abgesendete Formulare bleiben bei Seitenwechseln innerhalb dieser Website im Arbeitsspeicher derselben Registerkarte erhalten. Beim Neuladen oder Schliessen gehen diese Entwürfe verloren. Im Sitzungsspeicher liegen Kampagnenparameter sowie Hash, Kennung und Zeit einer Sendeversuch-Wiederholung, jedoch keine Klartext-Kontaktdaten. Technische Anzeigeeinstellungen können im Browser gespeichert werden.</p>
  <h2>Hosting und externe Angebote</h2><p>Die Website wird über Netlify (Netlify Inc., USA, weltweites Content-Delivery-Netz) ausgeliefert. Dabei werden technisch notwendige Verbindungsdaten wie IP-Adresse, Zeitpunkt und angeforderte Dateien verarbeitet. Schriftdateien liegen auf unserem eigenen Webspace. Der direkte Abruf von Google-Rezensionen über einen externen Zwischenspeicher ist deaktiviert. Erst beim Öffnen externer Angebote wie Calendly, WhatsApp, Google oder Renovero gelten auch deren Datenschutzbestimmungen.</p>
  <p style="color:var(--muted);font-size:13px;margin-top:28px">Stand: September 2026.</p>
</div></section>`;}

/* Route-Name -> Template (slug-lose Seiten). Slug-Seiten: pLeistung(slug), pLoesung(slug), pProjekt(slug) — null bei unbekanntem Slug. */
const PAGES={home:pHome,leistungen:pLeistungen,loesungen:pLoesungen,referenzen:pReferenzen,'ueber-uns':pUeber,wissen:pWissen,kontakt:pKontakt,impressum:pImpressum,datenschutz:pDatenschutz};
const META={
 'notfound':["Seite nicht gefunden — BauStern","Diese Adresse existiert nicht."],
 bewertung:["Bewertung schreiben — BauStern","Bewerten Sie BauStern auf Google oder Renovero — zwei Minuten für andere Auftraggeber."],
 karriere:["Karriere — Wir suchen Monteure | BauStern Zürich","Offene Stellen als Sanitärmonteur, Gipser/Maler und Bauleiter bei BauStern in Zürich. Kleines Team, direkter Draht, faire Bezahlung."],
 'wissen/badsanierung-kosten-zuerich-2026':["Was kostet eine Badsanierung in Zürich 2026? — BauStern","Richtwerte für eine komplette Badsanierung in Zürich, Kostentreiber und was in der Offerte stehen sollte."],
 'wissen/leerwohnung-streichen-preise':["Leerwohnung streichen: Preise pro Zimmer & m² — BauStern","Was Malerarbeiten in einer Leerwohnung im Kanton Zürich pro Zimmer und Quadratmeter kosten."],
 'wissen/baubewilligung-zuerich-sanierung':["Baubewilligung in Zürich für Sanierungen — BauStern","Wann ein Baugesuch für Sanierungsarbeiten in Zürich nötig ist und was meist bewilligungsfrei bleibt."],
 'wissen/buero-gewerbe-umbau-ablauf':["Büroumbau & Gewerbe-Renovierung — BauStern Zürich","Ablauf, Terminsicherheit und Kostenkontrolle beim Büro- oder Ladenumbau für GU und Verwaltungen."],
 'sanierung-winterthur':["Renovation & Sanitär in Winterthur — BauStern","Bauunternehmen für Renovation, Sanitär und Umbau in Winterthur — für Hausverwaltungen, GU und Gewerbe. Festpreis, ein Ansprechpartner."],
 'sanierung-zug':["Renovation & Sanitär im Kanton Zug — BauStern","Bauunternehmen für Renovation, Sanitär und Umbau im Kanton Zug — für Hausverwaltungen, GU und Gewerbe. Festpreis, ein Ansprechpartner."],
 'sanierung-luzern':["Renovation & Sanitär in Luzern — BauStern","Bauunternehmen für Renovation, Sanitär und Umbau in Luzern — für Hausverwaltungen, GU und Gewerbe. Festpreis, ein Ansprechpartner."],
 home:["BauStern — Bauunternehmen Zürich | Renovation, Sanitär, Umbau","Sechs Gewerke aus einer Hand für Immobilien & Gewerbe in Zürich und der Deutschschweiz."],
 leistungen:["Leistungen — BauStern Bauunternehmen Zürich","Renovation, Sanitär, Neu- & Umbau, Abbruch, Fliesen und Malerarbeiten aus einer Hand."],
 'leistungen/renovation':["Renovation in Zürich — BauStern","Leerwohnungs-Renovation, Objektbäder und Gewerbeflächen mit fixem Übergabetermin. Festpreis, ein Ansprechpartner."],
 'leistungen/sanitaer':["Sanitärarbeiten in Zürich — BauStern","Bäder, Wasserinstallation, Boiler und Heizkörper — SIA-konform, mit Prüfprotokoll und 24 Monaten Werkgarantie."],
 'leistungen/neu-umbau':["Neu- und Umbau in Zürich — BauStern","Grundrissänderungen, Dachausbau und Fit-out mit Ausführungsplänen, Statik-Abklärung und festen Terminen."],
 'leistungen/abbruch-rueckbau':["Abbruch und Rückbau in Zürich — BauStern","Entkernung und selektiver Rückbau — sortenrein getrennt, entsorgt mit Wiegeschein, bereit für den Ausbau."],
 'leistungen/fliesen-parkett':["Fliesen und Parkett in Zürich — BauStern","Platten mit Abdichtung im Verbund, Naturstein, Parkett und Bodenbeläge — einzeln oder in Serie."],
 'leistungen/malerarbeiten':["Malerarbeiten in Zürich — BauStern","Innen- und Fassadenanstrich, Tapezieren, Leerwohnungsmalerei — sauber vorbereitet, termintreu."],
 loesungen:["Lösungen für Verwaltungen, GU & Gewerbe — BauStern","Rahmenverträge, Subunternehmer-Leistungen und Gewerbe-Fit-out in der Deutschschweiz."],
 'loesungen/hausverwaltungen':["Bauleistungen für Hausverwaltungen — BauStern Zürich","Leerwohnungen, Unterhalt und Sanierungen im Rahmenvertrag — ein Ansprechpartner, dokumentiert."],
 'loesungen/generalunternehmer':["Subunternehmer für Generalunternehmer — BauStern","Gewerke einzeln oder als Paket, SIA-konform, mit Nachweisen für die Abnahme, im Takt Ihres Bauprogramms."],
 'loesungen/gewerbe-ladenbau':["Fit-out für Gewerbe und Ladenbau — BauStern Zürich","Umbau von Büro-, Praxis- und Ladenflächen in Etappen und ausserhalb der Öffnungszeiten."],
 referenzen:["Referenzen — BauStern Zürich","Fallstudien und ausgeführte Bäder, Küchen und Gewerbeprojekte in Zürich und der Deutschschweiz."],
 'projekt/atlant-komplettausbau':["WHK Atlant — Komplettausbau 47 m² | BauStern","Fallstudie: sechs Räume von der Planung bis zur schlüsselfertigen Übergabe, sechs Gewerke aus einer Hand."],
 'projekt/objektbad-gruener-marmor':["Objektbad in grünem Marmor — Fallstudie | BauStern","Badsanierung mit Naturstein, Walk-in-Dusche und Wandeinbau — Sanitär und Fliesen aus einer Hand."],
 'projekt/salon-fitout':["Fit-out Coiffure-Salon — Fallstudie | BauStern","Ladenbau mit Rundbögen, Marmortheke und Messingdetails — übergeben zum Eröffnungstermin."],
 'projekt/hotel-gewoelbe':["Hotelzimmer und Gewölbe-Bar — Fallstudie | BauStern","Zimmer in Serie saniert und Naturstein-Gewölbe zur Bar ausgebaut — im laufenden Betrieb."],
 'ueber-uns':["Über uns — BauStern Bauunternehmen Zürich","Artem Kozlovskyi, Inhaber und Bauleiter. Sechs Gewerke, ein Ansprechpartner, Sitz in Zürich-Altstetten."],
 wissen:["Wissen & Ratgeber — BauStern Zürich","Ratgeber zu Renovationskosten, Sanitär, Bewilligungen und Liegenschaftsunterhalt in Zürich."],
 impressum:["Impressum — BauStern","Angaben gemäss schweizerischem Recht."],
 datenschutz:["Datenschutz — BauStern","Was wir mit Ihren Daten tun."],
 kontakt:["Kontakt & Offerte — BauStern Zürich","Kostenlose Beratung mit unserem Projektmanager. Festpreis-Offerte innert 48 h."],
};
