# BauStern — Tools

## prerender.js — Vorrendern aller Routen (SEO)

Die Seite ist eine SPA mit echten Pfaden (`/kontakt`, `/leistungen/sanitaer`, …). Damit Google, Social-Previews
und Browser ohne JavaScript jede Seite sofort mit Inhalt bekommen, schreibt `tools/prerender.js` jede Route
einmal als fertige HTML-Datei ins Deploy-Verzeichnis `site/`:

```
site/index.html                     Startseite (Inhalt zwischen <!--prerender:start--> … <!--prerender:end-->)
site/kontakt.html                   /kontakt
site/leistungen/sanitaer.html       /leistungen/sanitaer
site/_redirects                     Netlify: /kontakt -> /kontakt.html (200-Rewrite), zuletzt SPA-Fallback /* -> /index.html
site/sitemap.xml                    alle indexierbaren URLs mit lastmod
```

**Wann ausführen:** vor jedem Deploy, sobald sich `js/pages.js`, `js/data.js`, `css/` oder `index.html` geändert haben
(sonst zeigen Google/Previews den alten Text — die Live-App im Browser ist davon nicht betroffen, sie rendert immer aktuell).

**Einrichtung (einmalig):**
```
npm i -D playwright
npx playwright install chromium
```
**Ausführen (im entpackten Deploy-Ordner, dort wo `index.html` liegt):**
```
node _tools/prerender.js
```
Ausgabe: eine Zeile pro Route (URL, Datei, Grösse). Bericht in `tools/prerender-report.json`.
Danach den ganzen Ordner (ohne Änderungen an der Struktur, `index.html` muss im Wurzelverzeichnis liegen) auf Netlify ziehen.
Neue Route = neuer Eintrag in `META` (js/pages.js) + Eintrag in `ROUTES` (js/app.js) → Prerender erneut laufen lassen.

## Analytics einrichten (js/data.js → `ANALYTICS`)

```js
const ANALYTICS={ga4Id:'G-XXXXXXXXXX',gtmId:'',debug:false};
```
- `ga4Id` allein: GA4 wird direkt geladen (Consent Mode v2, cookielos bis zur Einwilligung).
- `gtmId` gesetzt: nur der Tag Manager lädt; GA4 dort als Tag anlegen. Trigger: "Benutzerdefiniertes Ereignis"
  mit den Namen aus `js/analytics.js` (page_view, cta_offerte, generate_lead, phone_click, …). Der GA4-Konfigurations-Tag
  im GTM muss "Seitenaufruf senden" deaktiviert haben — page_view kommt bereits vom Router (sonst doppelt).
- `debug:true`: jedes Ereignis wird in der Browser-Konsole geloggt; `window.dataLayer` zeigt alles Gepushte.
- Einwilligung (falls später ein Cookie-Banner kommt): `Analytics.consent({analytics:true})`.
