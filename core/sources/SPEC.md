# BauStern Website v3 — Architektur-Spec (für alle Ausführenden)

Projekt: `/mnt/user-data/working/site/` — aktuell ein einziges `index.html` (~310 KB, Vanilla JS + GSAP 3.12 + ScrollTrigger lokal in `vendor/`) + `img/` (29 JPG).
Sprache der Website: **Deutsch (Schweiz)** — "ss" statt "ß", Währung CHF, Du-Form NIE, Sie-Form immer.
Zielgruppe: **B2B** — Hausverwaltungen/Eigentümer, Generalunternehmer, Gewerbe/Büro/Laden. Privatkunden sekundär.

## 0. Harte Regeln (vom Kunden, nicht verhandelbar)

- **Erster Bildschirm (Hero) bleibt ruhig.** Kein Scroll-Storytelling, keine Wort-Masken, kein Sticky-420vh. Erlaubt: dezenter Parallax des Fotos.
- **Keine "Fade überall".** Eine authored Motion-Sprache, nicht 40 zufällige Fades. Reveals kurz (≤ .6 s), Distanz klein (≤ 16 px).
- **Kein visueller Müll**: keine 15 Karten in Folge, keine riesigen leeren Blöcke, keine Eyebrow-Labels wie "SECTION 01".
- **Nichts kaputt machen**: Formulare posten bereits an `https://n8n.baucrm.net/webhook/web-anfrage` (Funktionen `sendLead`, `leadKontext`, `bindForm`, Rückruf-Modal, PDF-Magnet) — unverändert lassen.
- **Kein React / kein Build-Step.** Statische Dateien, Netlify Drop. Hash-Router, kein History-API-Rewrite nötig.
- Design-System **nicht ändern**: Farben `--night #0A1628`, `--ink #080F1A`, `--brass #C8A265` (`--brass-lo #A9854A`, `--brass-hi #E4C88E`), `--paper #F3F0E9`, `--paper-2 #E9E4D8`, `--card #FBF9F4`, `--fg #111A26`, `--muted #5A6472`. Fonts: Space Grotesk 600 (Display) + Instrument Sans (Text). Raute (Quadrat 45°) in Messing = Marken-Marker.
- `prefers-reduced-motion: reduce` → alle Animationen aus, Inhalt sofort sichtbar. Ohne GSAP (CDN/Netz weg) → Seite muss trotzdem komplett lesbar sein (`html.no-gsap` existiert bereits).
- Mobile 390 px muss ohne horizontales Scrollen und ohne überlappende Elemente funktionieren.
- Jedes Bild hat `alt`, jede Sektion ein `<h2>`, jede Route einen eigenen `<title>` + `meta description` (siehe `META`).

## 1. Ziel-Dateistruktur

```
site/
  index.html          Shell: head, nav, modals, #view, footer-slot, script-tags (Reihenfolge!)
  css/site.css        gesamtes CSS (aus <style> ausgelagert, plus neue Sektionen)
  js/data.js          CO, SVC, WORKS, PROJECTS, LAPSE, SIT, FAQ, META, STEPS, PROMISES, KNIGGE, REVIEWS, REGIONS, WISSEN, TEAM
  js/pages.js         Seiten-Templates: pHome, pLeistungen, pLeistung(slug), pLoesungen, pLoesung(slug), pReferenzen, pProjekt(slug), pUeber, pKontakt, pWissen, pImpressum, pDatenschutz, footer, ctaBand, pageHead
  js/motion.js        gesamte GSAP/ScrollTrigger-Choreografie: `Motion.mount(route)` / `Motion.unmount()`
  js/app.js           Router (hash, mit Parametern), render(), Preloader, Curtain, Nav, Cursor, Lightbox, Formulare (sendLead etc.), Rückruf, Magnet
  vendor/gsap.min.js, vendor/ScrollTrigger.min.js
  img/…
```

Script-Reihenfolge in `index.html`: gsap → ScrollTrigger → data.js → pages.js → motion.js → app.js.
`window.HERO_B64` (Base64-Hero im HTML) wird **entfernt**; Hero nutzt `img/hero.jpg`.

## 2. Routing

Hash-Router: `#/` (home), `#/leistungen`, `#/leistungen/:slug`, `#/loesungen`, `#/loesungen/:slug`, `#/referenzen`, `#/projekt/:slug`, `#/ueber-uns`, `#/wissen`, `#/kontakt`, `#/impressum`, `#/datenschutz`.
Alte `data-go="leistungen"`-Attribute bleiben funktionsfähig (Mapping: `home→#/`, `ueber→#/ueber-uns`, sonst `#/<name>`). Neue Links: `data-go="leistungen/sanitaer"`, `data-go="projekt/atlant-komplettausbau"`.
Bei Hash-Änderung (Back-Button) rendert der Router die Seite; Curtain-Übergang bleibt (≈ 0.9 s).
Nach Render: `window.scrollTo(0,0)`, `Motion.mount(route)`, `syncNav()`, Titel/Meta setzen.

Slugs Leistungen: `renovation`, `sanitaer`, `neu-umbau`, `abbruch-rueckbau`, `fliesen-parkett`, `malerarbeiten`.
Slugs Lösungen: `hausverwaltungen`, `generalunternehmer`, `gewerbe-ladenbau`.

## 3. Startseite — Sektionsfolge (final)

1. **Hero** (bestehendes Split-Layout behalten: dunkle Textspalte + Foto). Zusätzlich unter den CTAs eine Zeile mit 3 Mikro-Trust: "HR Zürich · Versichert · Werkgarantie 24 Monate". Counter-Leiste (`.hero-bar`) bleibt.
2. **Vier Versprechen** (neu) — 4 Karten: Festpreis oder Regie / Im Bauzeitplan / Ein Ansprechpartner / Rahmenverträge. Quelle: baustern.ch.
3. **Wo stehen Sie gerade?** (bestehend, 3 Situationen) — jede Karte klickbar → `#/loesungen/:slug`.
4. **Arbeiten nach Gewerk** (Tabs + Grid, bestehend) — **jede Karte klickbar → Lightbox** (siehe §5). Unter dem Grid Link "Alle Referenzen →" `#/referenzen`.
5. **Trust-Band** (bestehend, dunkel) — Zahlen zählen beim Scrollen hoch.
6. **Vom Rückbau bis zur Übergabe** — wird die **Signatur-Scroll-Animation** (§6): gepinnte Sektion, 4 Etappen fahren horizontal durch, Fortschrittsleiste. Auf Mobile: normales vertikales Grid ohne Pin.
7. **Projekt im Fokus — WHK Atlant** (bestehend) — Cover klickbar → `#/projekt/atlant-komplettausbau`, Zellen → Lightbox.
8. **Wer hinter BauStern steht** (neu) — Foto Artem Kozlovskyi (`https://www.baustern.ch/about/artem.jpg`, `onerror` → `img/office.jpg`), Zitat (Platzhalter, markiert), Fakten: Inhaber & Bauleiter, seit 19.02.2026 im HR Zürich, 4 Sprachen. Link `#/ueber-uns`.
9. **So arbeiten wir auf Ihrer Baustelle** (neu, "Baustellen-Knigge") — 4 Punkte aus baustern.ch (Abdeckung vor Beginn, Schutt laufend raus, Treppenhaus frei/Nachbarn, Übergabe besenrein ohne Werkzeug) + "Im Festpreis inbegriffen"-Liste (Vor-Ort-Aufnahme, verbindliche Offerte, Entsorgung, Druck-/Dichtigkeitsprüfung mit Protokoll, Baustellenreinigung, Werkgarantie 24 Monate).
10. **Drei Schritte** (bestehend).
11. **Kundenstimmen** (neu) — 3 Zitate als **PLATZHALTER** (Text beginnt mit `[PLATZHALTER]`, damit sie im Report auffallen) + Zeile "Bewertungen auf Google & Renovero" mit Links (`https://www.renovero.ch`, Google-Link Platzhalter `#`).
12. **Einsatzgebiet** (neu) — Zürich (Sitz Altstetten), Winterthur, Zug, Luzern, ganze Deutschschweiz. Textblock + einfache Liste mit Fahrzeit-Platzhaltern. Kein echtes Kartenbild nötig (kein Leaflet/Google Maps).
13. **FAQ** (bestehend, +3 Fragen: Reaktionszeit bei Störungen / Rahmenvertrag / Hauswartung nein).
14. **Wissen** (neu) — 4 Artikel-Teaser (Titel + 1 Satz) → `#/wissen`.
15. **Referenzmappe PDF** (bestehend) + **CTA-Band** (bestehend, plus zweite Zeile: "Termin buchen" → `https://calendly.com/baustern-info/booking`, "WhatsApp" → `https://wa.me/41765249898`).
16. Footer (bestehend) + Spalte "Regionen".

Karriere: nur ein Satz im Footer "Wir suchen Monteure → info@baustern.ch".

## 4. Unterseiten

- `#/leistungen` — 6 Karten (bestehendes `.ldet`), jede Karte komplett klickbar → Detail.
- `#/leistungen/:slug` — Struktur wie baustern.ch: H1 "Sanitärarbeiten in Zürich" · Lead · 4 Merkmale · 5 Teilleistungen (Karten) · "Im Festpreis inbegriffen" · 3 Gründe · FAQ (3–5) · passende Arbeiten aus WORKS (gefiltert nach Gewerk, klickbar) · CTA-Band. Inhalte in `data.js` unter `SVC[i].detail`.
- `#/loesungen/:slug` — Struktur: H1 · "Ihre Realität" (3 Probleme) · "Was BauStern übernimmt" (4) · "Drei Gründe" · FAQ · CTA. Inhalte aus baustern.ch (Hausverwaltungen liegt vollständig vor; GU & Gewerbe analog ableiten, Platzhalter markieren wo nötig).
- `#/referenzen` — alle WORKS als Grid mit Tabs (gleiche Komponente wie Home), klickbar → Lightbox; oben die 2–3 `PROJECTS` als grosse Karten → `#/projekt/:slug`.
- `#/projekt/:slug` — Fallstudie: Cover, Fakten (m², Räume, Dauer, Gewerke), Ausgangslage / Lösung / Ergebnis (Texte), Galerie (Lightbox), "Ähnliche Projekte", CTA. Mindestens `atlant-komplettausbau` voll; weitere Projekte aus WORKS-Gruppen (z. B. `objektbad-gruener-marmor`, `salon-fitout`, `hotel-gewoelbe`) mit kurzen Texten.
- `#/wissen` — 7 Artikel-Teaser (Titel, Kategorie, 2 Sätze) — **kein** Volltext; Link öffnet Kontakt mit vorgewähltem Thema ist NICHT nötig, einfach "Artikel folgt"-Badge. Titel aus baustern.ch/wissen.
- `#/ueber-uns` — Foto, Bio-Platzhalter, Fakten, Sprachen, "Vier Versprechen" kompakt, Knigge, CTA.
- Kontakt, Impressum, Datenschutz: bestehend.

## 5. Lightbox (alles klickbar)

- Öffnet für jede `.work`-Karte und jede Case-Zelle: Bild gross (object-fit contain, max 88vh), Titel, Ort, Gewerke-Chips, 2–3 Sätze Beschreibung (aus `WORKS[i].text`, Platzhalter erlaubt), Buttons "Offerte für ein ähnliches Projekt" (→ `#/kontakt`) und, falls `WORKS[i].project` gesetzt, "Zur Fallstudie".
- Pfeile ← → durch die aktuell gefilterte Liste, Tastatur (Esc, ←, →), Swipe auf Touch, Fokus-Trap, `aria-modal`, Scroll-Lock des Body, Schliessen per Klick auf Backdrop.
- Öffnen/Schliessen: 0.35 s, GSAP falls vorhanden, sonst CSS-Klasse.
- Kein Hash-Wechsel beim Öffnen (Lightbox ist kein Route).

## 6. Motion (nur `js/motion.js`) — eine Sprache

Alle Trigger werden in `Motion.mount(route)` erstellt und in `Motion.unmount()` gekillt (`ScrollTrigger.getAll().forEach(t=>t.kill())`, `gsap.killTweensOf`). Nutzt `gsap.matchMedia()`: Desktop ≥ 1000 px volle Choreografie, darunter reduziert; `(prefers-reduced-motion: reduce)` → nichts.

Startseite:
- Hero: Foto `y: -6%→6%` scrub (Parallax), Textspalte `opacity 1→0.4` beim Verlassen. Sonst nichts.
- Vier Versprechen: Karten `clipPath inset(0 0 100% 0) → inset(0)` gestaffelt 0.08 s, `once`.
- Situations-Karten & Wissen-Teaser: `y:16→0, opacity` gestaffelt, `once`.
- Arbeiten-Grid: beim ersten Sichtbarwerden Karten skalieren `0.96→1` gestaffelt; Bild `scale 1.08→1` scrub leicht.
- Trust-Band: Counter (`data-count`) zählen hoch, Trennlinien `scaleY 0→1`.
- **Vom Rückbau bis zur Übergabe (Signatur):** Sektion pinnen (`pin: true, scrub: 1, end: '+=' + (panels*0.8*innerWidth)`), Track fährt `x` von 0 bis `-(trackWidth - viewport)`; jede Etappe hat Nummer, Bild (4:5), Titel, Text; Fortschrittsleiste oben füllt sich; aktive Etappe wird hervorgehoben (Klasse `.on`). Keine Bild-Kreuzblende, keine Text-Fades — nur die horizontale Bewegung + Fortschritt. Mobile (< 1000): kein Pin, normales Grid mit Stagger.
- Case Atlant: Cover `y: -8%→8%` scrub; Fakten-Zahlen zählen.
- Team-Block: Foto `clipPath` Reveal, Zitat-Zeilen `y:12`.
- Kundenstimmen: sanfte, endlose horizontale Marquee (CSS `@keyframes`, `animation-play-state: paused` bei Hover), duplizierter Inhalt für Loop.
- CTA-Band: `.orb` `y: 40→-40` scrub.
- Alle `.rv` Reveals: `opacity 0→1, y 12→0, 0.5 s, once, start 'top 92%'`.
- Magnetische Buttons (`.mag`) und Cursor bleiben wie gehabt.

Unterseiten: nur `.rv` Reveals + Counter. Kein Pin.

## 7. Content-Regeln (Copy)

- Ton: sachlich, präzise, schweizerisch-zurückhaltend, B2B. Keine Superlative ohne Beleg ("beste", "Nr. 1"). Keine Emojis.
- Jeder Block beantwortet eine Kundenfrage: Was kostet es / wie lange / wer haftet / was ist inbegriffen / wie läuft es ab / wer sind Sie.
- Fakten nur aus `SPEC.md` §8 und baustern.ch. Alles Unbekannte (Anzahl Projekte, Gründungsjahr des Inhabers im Handwerk, Referenzkunden, Bewertungszahl, Teamgrösse, Fahrzeiten, Zitate) als `[PLATZHALTER: …]` schreiben — sichtbar im Text, damit es im Morgenreport gesammelt wird.
- Titel/Description pro Route in `META` pflegen (≤ 60 / ≤ 155 Zeichen).

## 8. Fakten (verifiziert, baustern.ch + Handelsregister)

- BauStern Kozlovskyi, Einzelunternehmen, Inhaber & Bauleiter Artem Kozlovskyi. UID CHE-485.600.736, HR CH-020.1.105.382-8, Kanton Zürich, seit 19.02.2026.
- Jakob-Fügli-Strasse 18, 8048 Zürich (Altstetten). +41 76 524 98 98, info@baustern.ch. Mo–Fr 07:00–18:00, Sa 08:00–14:00. Termin: https://calendly.com/baustern-info/booking. WhatsApp: https://wa.me/41765249898.
- Sprachen: Deutsch, English, Русский, Українська. Region: Zürich, Winterthur, Zug, Luzern, ganze Deutschschweiz. Materiallager in Zürich, A1-Anschluss.
- MwSt-befreit (Art. 10 Abs. 2 MWStG). Versichert. Aufträge ab 3 Stunden. Antwort innert 24 h an Werktagen. Kostenlose Besichtigung. Offerte i. d. R. 2–5 Werktage nach Besichtigung.
- Sechs Gewerke (Teilleistungen siehe baustern.ch): Renovation (Leerwohnungs-Renovation, Objektbäder, Ausbau Gewerbeflächen) · Sanitär (Objekt-/Serienbäder, Wasserinstallation, Boiler & Warmwasser, Heizung & Heizkörper, Unterhalt/Reparaturen/Sub; SIA-konform; Druck- und Dichtigkeitsprüfung mit Protokoll; Werkgarantie 24 Monate) · Neu- & Umbau (Grundrissänderungen, Anbauten, Estrich-/Dachausbau, Fit-out) · Abbruch & Rückbau (Entkernung, selektiver Rückbau, sortenrein, Wiegeschein) · Fliesen & Parkett (Platten, Abdichtung im Verbund, Parkett) · Malerarbeiten (Innen/Fassade, Tapezieren, Leerwohnungsmalerei).
- Vier Versprechen: Festpreis oder Regie (verbindliche Offerte Position für Position) · Im Bauzeitplan (Beginn & Übergabe schriftlich fixiert) · Ein Ansprechpartner (sechs Gewerke unter einem Dach) · Rahmenverträge (feste Konditionen, gebündelte Abrechnung).
- Drei Schritte: Beratung & Devis (gratis, vor Ort) → Vertrag & Planung (Werkvertrag, fixe Daten) → Ausführung & Übergabe (wöchentliche Kommunikation, Abnahmeprotokoll).
- Baustellen-Knigge: Flächen/Böden/Durchgänge vor Beginn geschützt · Schutt & Verpackung laufend entsorgt · Treppenhaus passierbar, Rücksicht auf Nachbarn · Übergabe ohne Werkzeug, gereinigt, Abdeckungen entfernt.
- Hausverwaltungen (baustern.ch/loesungen/hausverwaltungen): Realität: zu viele Ansprechpartner / Leerstand kostet Miete / fehlende Nachweise. Übernimmt: Rahmenvertrag & fester Ansprechpartner · Leerwohnungs-Renovation · laufender Unterhalt & Störungsbehebung · Dokumentation (Abnahmeprotokoll, Fotos, nachvollziehbare Rechnung). FAQ: Rahmenverträge ja / Reaktionszeit nach Vereinbarung im Rahmenvertrag / Hauswartung nein (nur technischer Unterhalt).
- Sanitär-FAQ-Fakten: Vollsanierung Bad 3–4 Wochen, Auffrischung ohne Platten 3–5 Werktage; Standard-Elektroboiler-Tausch an einem Tag; Abend-/Wochenendarbeit für Gewerbe nach Absprache.
- Wissen (Titel): Was kostet eine Renovation in Zürich? · Sanitärnotfall in Zürich · Bewilligungen für Renovationen in Zürich · Leerwohnungs-Renovation beim Mieterwechsel · Liegenschaftsunterhalt und Steuern · Badezimmer-Renovationskosten in Zürich · Generalunternehmer vs. Einzelgewerke.
- Referenzprojekt WHK Atlant: Komplettausbau 47 m², 6 Räume, Planung → Rückbau → Trennwände → Sanitär/Elektro/Heizung → Übergabe; Fussbodenheizung, Ausführungspläne. Ort nur "Referenzprojekt" (NICHT die Stadt nennen).
- Bilder (img/): siehe `WORKS` in data.js. Bilder von "Haubert Paris"-Salon (salon-*.jpg): Status unklar → in Lightbox-Text `[PLATZHALTER: Objekt bestätigen]`.

## 9. Abnahme-Kriterien (werden vom Architekten geprüft)

- `node -e` Syntax-Check aller JS-Dateien ohne Fehler; keine Konsolenfehler beim Durchklicken aller Routen (Playwright-Sweep vorhanden: `/mnt/user-data/working/qa.js`, `shot.js`).
- Desktop 1440 & Mobile 390: keine horizontale Scrollbar (`document.documentElement.scrollWidth === innerWidth`), keine leeren Sektionen, kein überlappendes Nav.
- Jede Karte / jedes Bild / jeder Teaser hat ein Klickziel (Lightbox oder Route). `cursor:pointer` + Fokus-Stil + `role="button"`/`<a>`.
- Formulare posten weiterhin die exakt gleichen Payloads (Test: `/mnt/user-data/working/formtest.js`).
- Reduced-motion und no-gsap: gesamter Inhalt sichtbar.
- Alle `[PLATZHALTER: …]` sind grep-bar.
