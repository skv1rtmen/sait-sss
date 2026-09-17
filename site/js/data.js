/* BauStern — Daten-Konstanten (global, kein Modul-System)
   Alles Unbekannte ist sichtbar als [PLATZHALTER: …] markiert. */
/* ---------- Analytics (js/analytics.js) ----------
   ga4Id: Mess-ID aus GA4 (Verwaltung -> Datenstreams -> Web), z. B. 'G-ABC123XYZ'.
   gtmId: Container-ID aus Google Tag Manager, z. B. 'GTM-ABC1234'. Ist gtmId gesetzt, lädt NUR GTM
          (GA4 dann als Tag im Container anlegen; alle Site-Ereignisse liegen im dataLayer, s. analytics.js).
   Beide leer = nichts wird geladen, der dataLayer wird trotzdem befüllt (debug:true zeigt Ereignisse in der Konsole). */
const ANALYTICS={ga4Id:'',gtmId:'',debug:false};
/* Supabase liefert derzeit 401; bis ein gültiger read-only Anon-Key vorliegt, bleiben die kuratierten Fallback-Rezensionen aktiv. */
const REVIEWS_LIVE={enabled:false};
const CO={name:"BauStern",legal:"Einzelunternehmen BauStern Kozlovskyi",owner:"Artem Kozlovskyi",
  uid:"CHE-485.600.736",hr:"CH-020.1.105.382-8 · Kanton Zürich",hrSince:"19.02.2026",addr:"Jakob-Fügli-Strasse 18 · 8048 Zürich",
  hours:"Mo–Fr 07:00–18:00 · Sa 08:00–14:00",area:"Zürich und die gesamte Deutschschweiz",
  langs:"Deutsch · English · Русский · Українська",phone:"+41 76 524 98 98",phoneRaw:"+41765249898",mail:"info@baustern.ch",
  /* Reactivate direct booking only after its amount/currency and website copy agree. */
  calendlyEnabled:false,calendly:"https://calendly.com/baustern-info/booking",wa:"https://wa.me/41765249898",
  renovero:"https://www.renovero.ch/de/handwerker/baustern-kozlovskyi",google:"https://maps.google.com/?cid=14507779548291923599",
  /* Bewertungs-Badge (Startseite, Kundenstimmen): erst sichtbar, wenn rating UND count gesetzt sind — z. B. rating:"5.0",count:17 */
  rating:"4.6",ratingCount:12,ratingSrc:"Google",
  /* Renovero zeigt keine einzelne Durchschnittszahl, nur eine Sternverteilung (76% 5★, 3% 4★, 3% 3★, 6% 2★, 12% 1★, Stand 07.09.2026).
     renoveroRating ist daraus RECHNERISCH ermittelt (0.76*5+0.03*4+0.03*3+0.06*2+0.12*1=4.25, gerundet 4.3) — kein von Renovero selbst ausgewiesener Wert. */
  renoveroRating:"4.3",renoveroCount:33,
  /* Kurz-Link zum Bewerten: der bestehende n8n-Webhook "BauStern — Bewertungslink (QR → Google)" leitet auf den in
     Supabase (Tabelle einstellungen, Schlüssel google_review_url) hinterlegten Google-Rezensionslink weiter und
     protokolliert jeden Klick nach Quelle (?q=…). Sobald Artem in seinem Google-Business-Profil unter
     "Mehr Rezensionen erhalten" den offiziellen g.page/r/…/review-Kurzlink erzeugt hat, dort in Supabase eintragen —
     an dieser Zeile hier muss dann nichts geändert werden. */
  googleReviewUrl:"https://n8n.baucrm.net/webhook/bewerten?q=website"};
const IMG='img/hero.jpg';

/* ---------- Aus dem Alltag (Startseite): echte, unbearbeitete Baustellenfotos, KEINE Renders/Stockfotos,
   und keine Bilder, die anderswo auf der Seite schon als Referenz-/Leistungsbild laufen (sonst wirkt es
   wie eine Wiederholung statt wie ein ehrlicher Blick hinter die Kulissen). Format je Eintrag:
   {img:"img/....jpg", cap:"Badsanierung, Zürich-Altstetten — Mai 2026"} — Bildunterschrift mit Gewerk,
   Ort (Quartier reicht) und Monat/Jahr, so wie Artem sie beim Hochladen mitgibt.
   Leer = der Abschnitt wird auf der Startseite gar nicht gerendert (siehe dailyGrid() in pages.js) —
   bewusst kein Platzhalter-Raster mit grauen Kacheln. Die einzigen 3 unbearbeiteten Baustellenfotos im
   Projekt (before-demo.jpg, before-drywall.jpg, process-drywall.jpg) laufen schon in Referenzen/Rückblende/
   Ablauf — sie hier nochmal zu zeigen wäre genau die Bild-Wiederholung, die vermieden werden sollte.
   Sobald neue, frische Fotos von echten (auch laufenden) Baustellen da sind: hier eintragen. */
const DAILY_PHOTOS=[];

/* ---------- Gewerke (k = Filter-Key im Arbeiten-Grid, slug = Route #/leistungen/:slug) ---------- */
const SVC=[
 {no:"01",k:"renovation",slug:"renovation",t:"Renovation",img:"img/living-walnut.jpg",d:"Leerwohnungs-Renovation, Objektbäder und Ausbau von Gewerbeflächen — im Bauzeitplan.",
  long:"Bei laufendem Mieterwechsel zählt jeder Tag Leerstand. Wir übernehmen die komplette Leerwohnungs-Renovation termingebunden — Böden, Wände, Bad, Küche, abnahmefertig übergeben. Für Portfolios mit wiederkehrendem Bedarf arbeiten wir über Rahmenverträge.",
  pts:["Leerwohnungs-Renovation","Objektbäder in Serie","Ausbau von Gewerbeflächen","Einzelgewerk oder Gesamtauftrag"],
  detail:{
   h1:"Renovation in Zürich",
   lead:"Leerwohnungen, Objektbäder und Gewerbeflächen — alle Gewerke koordiniert, Beginn und Übergabe schriftlich fixiert. Sie sprechen mit einer Person, nicht mit fünf Firmen.",
   merkmale:[["Fixer Übergabetermin","Beginn und Übergabe stehen im Werkvertrag. Verzögerungen melden wir, bevor sie entstehen."],
             ["Sechs Gewerke, ein Vertrag","Maler, Fliesen, Sanitär, Böden und Rückbau laufen über einen Bauleiter — ohne Schnittstellenverluste."],
             ["Rahmenvertrag möglich","Feste Konditionen für wiederkehrende Objekte, gebündelte Abrechnung pro Monat oder pro Objekt."],
             ["Dokumentiert übergeben","Abnahmeprotokoll, Fotos vorher/nachher und eine nachvollziehbare Rechnung pro Position."]],
   teil:[{t:"Leerwohnungs-Renovation",d:"Komplette Instandstellung beim Mieterwechsel: Wände, Böden, Bad, Küche, Kleinreparaturen. Abnahmefertig am vereinbarten Datum."},
         {t:"Objektbäder",d:"Bäder einzeln oder in Serie über mehrere Wohnungen — mit Abdichtung im Verbund und Sanitärprotokoll."},
         {t:"Ausbau von Gewerbeflächen",d:"Büro, Praxis, Laden: Trennwände, Böden, Beleuchtungsvorbereitung und Malerarbeiten, auch ausserhalb der Öffnungszeiten."},
         {t:"Küchen",d:"Ausbau der alten Küche, Anpassung der Anschlüsse, Montage der neuen Küche inklusive Rückwand und Geräten."},
         {t:"Böden und Wände",d:"Parkett, Platten, Spachtel- und Malerarbeiten aus einer Hand — einheitlich über das ganze Objekt."}],
   incl:["Besichtigung und Aufnahme vor Ort","Verbindliche Offerte, Position für Position","Schutz von Böden, Treppenhaus und Durchgängen","Entsorgung von Schutt und Verpackung","Baustellenreinigung und besenreine Übergabe","Werkgarantie 24 Monate"],
   gruende:[["Leerstand verkürzen","Ein Bauleiter koordiniert alle Gewerke parallel statt nacheinander. Das spart Wochen, in denen keine Miete fliesst."],
            ["Kosten vorher kennen","Festpreis nach Besichtigung. Nachträge nur, wenn Sie den Umfang ändern — und dann schriftlich vor der Ausführung."],
            ["Für die Akten","Abnahmeprotokoll und Fotodokumentation für Eigentümer, Verwaltung oder Mieterabrechnung."]],
   faq:[["Wie lange dauert eine Leerwohnungs-Renovation?","Das hängt vom Umfang ab: Malerei und Kleinreparaturen sind in wenigen Tagen erledigt, eine Wohnung mit neuem Bad und Küche braucht mehrere Wochen. Für eine 3.5-Zimmer-Leerwohnung mit Malerei, Böden und Kleinreparaturen rechnen wir typischerweise mit ein bis zwei Wochen. Der Termin steht in jedem Fall im Werkvertrag."],
        ["Können Sie mehrere Wohnungen gleichzeitig renovieren?","Ja. Bei Serien im gleichen Objekt planen wir die Gewerke versetzt, damit Maler, Bodenleger und Sanitär nicht aufeinander warten. Wie viele Wohnungen parallel laufen können, klären wir bei der Besichtigung — abhängig von Umfang und Terminen."],
        ["Was ist, wenn beim Rückbau Überraschungen auftauchen?","Wir stoppen, dokumentieren mit Fotos und schicken Ihnen einen Nachtrag mit Preis. Ausgeführt wird erst nach Ihrer Freigabe."],
        ["Arbeiten Sie auch für Privateigentümer?","Ja, ab drei Stunden Arbeitszeit. Unser Ablauf ist derselbe: Besichtigung, Festpreis-Offerte, Werkvertrag mit Terminen."]]
  }},
 {no:"02",k:"sanitaer",slug:"sanitaer",t:"Sanitär",img:"img/bath-green.jpg",d:"Serienbäder, Wasserinstallation, Boiler und Unterhalt — SIA-konform und dokumentiert.",
  long:"Sanitärarbeiten SIA-konform und dokumentiert — von der einzelnen Boiler-Sanierung bis zum Serienbad über das ganze Portfolio. Wir arbeiten auch als Subunternehmer für Generalunternehmer und liefern saubere Nachweise für Ihre Abnahme.",
  pts:["Serienbäder & Objektbäder","Wasserinstallation & Boiler","Unterhalt im Portfolio","Als Subunternehmer"],
  detail:{
   h1:"Sanitärarbeiten in Zürich",
   lead:"Bäder, Wasserinstallation, Boiler und Heizkörper — ausgeführt nach SIA, geprüft mit Protokoll, garantiert für 24 Monate. Für Verwaltungen, Generalunternehmer und Gewerbe.",
   merkmale:[["SIA-konform","Ausführung nach den geltenden SIA-Normen und den Vorgaben des Wasserversorgers."],
             ["Druck- und Dichtigkeitsprüfung","Jede neue Leitung wird geprüft. Das Protokoll geht mit der Rechnung an Sie."],
             ["Werkgarantie 24 Monate","Auf unsere Arbeit. Materialgarantien der Hersteller kommen dazu."],
             ["Als Subunternehmer","Für Generalunternehmer als einzelnes Gewerk oder als Paket mit Fliesen und Rückbau."]],
   teil:[{t:"Objekt- und Serienbäder",d:"Vollsanierung oder Auffrischung — einzeln oder über mehrere Wohnungen im bewohnten Objekt, etappenweise."},
         {t:"Wasserinstallation",d:"Kalt- und Warmwasserleitungen, Verteiler, Ersatz alter Steigleitungen, Anschlüsse für Küche und Bad."},
         {t:"Boiler und Warmwasser",d:"Ersatz von Elektroboilern und Wassererwärmern, Entkalkung, Anpassung an aktuelle Vorschriften."},
         {t:"Heizung und Heizkörper",d:"Ersatz und Versetzen von Heizkörpern, Thermostatventile, Entlüftung, Anbindung an bestehende Verteiler."},
         {t:"Unterhalt und Reparaturen",d:"Tropfende Armaturen, verstopfte Abläufe, defekte Spülkästen — im Rahmenvertrag mit vereinbarter Reaktionszeit."}],
   incl:["Besichtigung und Aufnahme vor Ort","Verbindliche Offerte, Position für Position","Demontage und Entsorgung der Altgeräte","Druck- und Dichtigkeitsprüfung mit Protokoll","Baustellenreinigung nach jedem Arbeitstag","Werkgarantie 24 Monate"],
   gruende:[["Nachweise für die Abnahme","Prüfprotokoll, Materialliste und Fotos der Leitungen vor dem Schliessen — alles in einem Dossier."],
            ["Ein Gewerk weniger zu koordinieren","Fliesen, Rückbau und Maler kommen aus demselben Betrieb. Keine Wartezeiten zwischen Firmen."],
            ["Planbare Reaktionszeit","Im Rahmenvertrag legen wir fest, wie schnell wir bei Störungen vor Ort sind."]],
   faq:[["Wie lange dauert eine Badsanierung?","Eine Vollsanierung mit Rückbau, Leitungen, Platten und Montage dauert drei bis vier Wochen. Eine Auffrischung ohne neue Platten — Armaturen, WC, Silikon, Anstrich — ist in drei bis fünf Werktagen erledigt."],
        ["Wie schnell ist ein Boiler ersetzt?","Ein Standard-Elektroboiler wird an einem Tag getauscht, inklusive Entsorgung des Altgeräts. Sonderformate oder Warmwasser-Wärmepumpen klären wir bei der Besichtigung."],
        ["Arbeiten Sie auch abends oder am Wochenende?","Für Gewerbe, Gastronomie und Praxen nach Absprache — damit der Betrieb weiterläuft."],
        ["Was passiert bei einem Wasserschaden ausserhalb der Bürozeiten?","Im Rahmenvertrag vereinbaren wir eine Reaktionszeit für Störungen. Ohne Rahmenvertrag: Wasser abstellen, Schaden fotografieren, Versicherung informieren — und uns anrufen. Wir melden uns am nächsten Werktag früh und kommen so schnell wie möglich vorbei."],
        ["Übernehmen Sie die Abstimmung mit dem Wasserversorger?","Ja. Anmeldungen und die Abnahme durch den Versorger koordinieren wir und legen die Unterlagen bei."]]
  }},
 {no:"03",k:"neu-umbau",slug:"neu-umbau",t:"Neu- & Umbau",img:"img/kitchen-lux.jpg",d:"Grundrissänderungen, Anbauten, Dachausbau und Fit-out — koordiniert und termintreu.",
  long:"Strukturelle Eingriffe brauchen einen Partner, der Statik, Bewilligung und Ausführung zusammendenkt. Wir koordinieren Grundrissänderungen, Anbauten und den Fit-out von Gewerbeflächen — mit fixen Terminen für Beginn und Übergabe.",
  pts:["Grundrissänderungen","Anbauten & Erweiterungen","Estrich- & Dachausbau","Fit-out von Gewerbeflächen"],
  detail:{
   h1:"Neu- und Umbau in Zürich",
   lead:"Grundrisse ändern, Estrich ausbauen, Gewerbeflächen einrichten — mit Ausführungsplänen, koordinierten Fachplanern und festen Terminen für Beginn und Übergabe.",
   merkmale:[["Bewilligung und Statik vorab","Wir klären, was bewilligungspflichtig ist, und ziehen den Statiker bei, bevor die erste Wand fällt."],
             ["Ausführungspläne","Grundriss, Leitungsführung und Elektroplan werden vor Baubeginn gezeichnet und mit Ihnen freigegeben."],
             ["Alle Gewerke koordiniert","Rückbau, Trockenbau, Sanitär, Elektro, Böden und Maler laufen über einen Bauleiter."],
             ["Termin im Werkvertrag","Beginn, Etappen und Übergabe sind schriftlich fixiert."]],
   teil:[{t:"Grundrissänderungen",d:"Wände versetzen, Räume zusammenlegen, Küche öffnen — inklusive Statik-Abklärung und Anpassung der Leitungen."},
         {t:"Anbauten und Erweiterungen",d:"Erweiterung bestehender Gebäude in Koordination mit Architekt, Statiker und Behörde."},
         {t:"Estrich- und Dachausbau",d:"Dämmung, Trockenbau, Fenster-Anschlüsse und Haustechnik — aus dem Dachraum wird Wohn- oder Bürofläche."},
         {t:"Fit-out von Gewerbeflächen",d:"Büro, Praxis, Salon, Laden: vom Rohbau bis zur Übergabe, auch ausserhalb der Öffnungszeiten."},
         {t:"Trennwände und Trockenbau",d:"Leichtbauwände, Vorsatzschalen, abgehängte Decken mit indirekter Beleuchtung, Schallschutz."}],
   incl:["Besichtigung und Aufnahme vor Ort","Verbindliche Offerte, Position für Position","Abklärung Bewilligungspflicht und Koordination Fachplaner","Ausführungspläne für Grundriss und Leitungen","Entsorgung und Baustellenreinigung","Werkgarantie 24 Monate"],
   gruende:[["Ein Bauleiter statt fünf Firmen","Sie sprechen mit einer Person, die Planer, Behörde und alle Gewerke koordiniert."],
            ["Keine Überraschungen in der Wand","Statik und Leitungen werden vor Baubeginn geklärt und gezeichnet — nicht während der Ausführung."],
            ["Referenz: Komplettausbau 47 m²","Sechs Räume von der Planung bis zur Übergabe, inklusive Fussbodenheizung und Ausführungsplänen."]],
   faq:[["Brauche ich eine Baubewilligung?","Grundrissänderungen ohne Eingriff in die Tragstruktur sind oft bewilligungsfrei, Anbauten und Nutzungsänderungen nicht. Wir klären das vor der Offerte mit der zuständigen Behörde."],
        ["Wer macht die Statik?","Ein externer Bauingenieur, den wir beiziehen und koordinieren. Seine Kosten weisen wir in der Offerte separat aus."],
        ["Wie lange dauert ein Umbau?","Vom Rückbau bis zur Übergabe dauert ein Wohnungsumbau je nach Umfang meist mehrere Wochen bis wenige Monate. Der Termin steht im Werkvertrag, die Etappen im Bauprogramm."],
        ["Kann der Betrieb während des Umbaus weiterlaufen?","Bei Gewerbeflächen ja — in Etappen, mit Staubschutzwänden und Arbeiten ausserhalb der Öffnungszeiten nach Absprache."]]
  }},
 {no:"04",k:"abbruch",slug:"abbruch-rueckbau",t:"Abbruch & Rückbau",img:"img/before-demo.jpg",d:"Entkernung, selektiver Rückbau und Entsorgung — sortenrein, mit Wiegeschein.",
  long:"Rückbau mit Nachweis: Wir entkernen und trennen sortenrein, entsorgen fachgerecht und liefern Wiegeschein und Nachweis für jede Fraktion. Sauber, dokumentiert und bewilligungskonform.",
  pts:["Entkernung","Selektiver Rückbau","Sortenreine Trennung","Wiegeschein & Nachweis"],
  detail:{
   h1:"Abbruch und Rückbau in Zürich",
   lead:"Entkernung und selektiver Rückbau von Wohnungen, Bädern und Gewerbeflächen — sortenrein getrennt, fachgerecht entsorgt und mit Wiegeschein belegt.",
   merkmale:[["Sortenrein getrennt","Holz, Metall, Mineralik und Mischabfall werden vor Ort getrennt — das senkt Entsorgungskosten."],
             ["Wiegeschein für jede Fraktion","Sie erhalten die Belege der Entsorgungsstelle mit der Rechnung."],
             ["Schutz vor dem ersten Schlag","Böden, Treppenhaus und Lift werden abgedeckt, Staubschutzwände gestellt."],
             ["Bereit für den Ausbau","Nach dem Rückbau ist die Fläche besenrein und aufgenommen — der Ausbau kann direkt starten."]],
   teil:[{t:"Entkernung",d:"Rückbau bis auf den Rohbau: Böden, Wände, Decken, Installationen und Einbauten."},
         {t:"Selektiver Rückbau",d:"Gezielter Ausbau einzelner Bauteile — Bad, Küche, Trennwände — ohne die übrige Wohnung zu beschädigen."},
         {t:"Sortenreine Trennung",d:"Trennung in Fraktionen direkt auf der Baustelle, Mulden nach Bedarf, keine Zwischenlagerung im Treppenhaus."},
         {t:"Entsorgung mit Nachweis",d:"Transport zur zugelassenen Entsorgungsstelle. Wiegeschein und Nachweis pro Fraktion für Ihre Akten."},
         {t:"Vorbereitung für den Ausbau",d:"Reinigung, Aufnahme der Fläche, Markierung der Leitungen — als Übergabe an uns oder an ein anderes Gewerk."}],
   incl:["Besichtigung und Aufnahme vor Ort","Verbindliche Offerte, Position für Position","Abdeckung von Böden, Treppenhaus und Lift","Mulden, Transport und Entsorgung","Wiegeschein und Nachweis pro Fraktion","Besenreine Übergabe der Fläche"],
   gruende:[["Entsorgung ist inbegriffen","Keine separate Rechnung von der Mulde oder vom Transporteur — eine Position in der Offerte."],
            ["Nachbarn bleiben informiert","Wir melden Lärmzeiten vorab und halten Treppenhaus und Zugänge frei."],
            ["Nahtlos zum Ausbau","Rückbau und Ausbau aus demselben Betrieb — ohne Wartezeit zwischen zwei Firmen."]],
   faq:[["Was ist mit Asbest und anderen Schadstoffen?","Bei Gebäuden mit Baujahr vor 1990 ist vor dem Rückbau eine Schadstoffabklärung vorgeschrieben. Die Abklärung macht ein unabhängiger Schadstoffdiagnostiker; wird Asbest gefunden, übernimmt ein dafür zugelassener Sanierungsbetrieb den Ausbau, bevor wir mit dem Rückbau weiterfahren."],
        ["Wie laut und wie staubig wird es?","Wir stellen Staubschutzwände, decken Zugänge ab und arbeiten mit Absaugung. Lärmintensive Arbeiten legen wir nach Absprache in die Kernzeiten."],
        ["Wohin geht das Material?","Zu zugelassenen Entsorgungsstellen im Kanton Zürich, getrennt nach Fraktion. Den Wiegeschein legen wir der Rechnung bei."],
        ["Braucht ein Rückbau eine Bewilligung?","Innere Rückbauten ohne Eingriff in die Tragstruktur in der Regel nicht. Abbruch ganzer Bauteile schon — wir klären das vor der Offerte."]]
  }},
 {no:"05",k:"fliesen",slug:"fliesen-parkett",t:"Fliesen & Parkett",img:"img/bath-green2.jpg",d:"Platten, Abdichtung im Verbund, Parkett und Bodenbeläge — als Serie oder einzeln.",
  long:"Plattenarbeiten mit Abdichtung im Verbund — normgerecht ausgeführt, damit Bäder dicht bleiben. Parkett und Bodenbeläge über ganze Objekte, einheitlich verlegt, als Serie oder Einzelgewerk.",
  pts:["Platten für Bäder & Böden","Abdichtung im Verbund","Parkett & Bodenbeläge","Serie oder Einzelgewerk"],
  detail:{
   h1:"Fliesen und Parkett in Zürich",
   lead:"Plattenarbeiten mit Abdichtung im Verbund, Parkett und Bodenbeläge — normgerecht verlegt, einzeln oder als Serie über das ganze Objekt.",
   merkmale:[["Abdichtung im Verbund","Nassbereiche werden vor dem Plattenbelag abgedichtet — die Grundlage für ein dichtes Bad."],
             ["Grossformate und Naturstein","Platten bis Grossformat, Marmor und Feinsteinzeug — mit dem passenden Untergrund."],
             ["Parkett in Serie","Einheitlicher Belag über mehrere Wohnungen, mit Sockelleisten und Übergängen."],
             ["Aus einer Hand mit Sanitär","Leitungen und Platten aus demselben Betrieb — keine Abstimmungsfehler an der Wand."]],
   teil:[{t:"Platten für Bäder und Küchen",d:"Wand- und Bodenplatten, Nischen, Duschtassen bodeneben, Küchenrückwände."},
         {t:"Abdichtung im Verbund",d:"Flüssigabdichtung mit Dichtbändern an Anschlüssen und Durchdringungen, dokumentiert vor dem Belag."},
         {t:"Bodenplatten und Grossformate",d:"Feinsteinzeug, Naturstein und Grossformate — mit Nivellierung des Untergrunds."},
         {t:"Parkett",d:"Verlegen, Schleifen und Versiegeln von Parkett, Ersatz einzelner Felder, Sockelleisten."},
         {t:"Bodenbeläge für Leerwohnungen",d:"Vinyl, Laminat und Parkett in Serie für den Mieterwechsel — schnell verlegt, einheitlich im Portfolio."}],
   incl:["Besichtigung und Aufnahme vor Ort","Verbindliche Offerte, Position für Position","Untergrundprüfung und Nivellierung","Abdichtung im Verbund (Nassbereiche)","Verfugen, Silikonfugen und Reinigung","Werkgarantie 24 Monate"],
   gruende:[["Dicht bleibt dicht","Abdichtung nach Norm, dokumentiert mit Fotos vor dem Plattenbelag — für Ihre Unterlagen."],
            ["Ein Betrieb für Nass und Trocken","Platten im Bad, Parkett im Wohnraum, Sanitär dazwischen: alles über einen Bauleiter."],
            ["Serienfähig","Gleiche Materialien, gleiche Ausführung, gleiche Preise über mehrere Wohnungen."]],
   faq:[["Können Sie Platten auf bestehende Platten verlegen?","In vielen Fällen ja, wenn der Untergrund tragfähig ist. Bei Nassbereichen prüfen wir die Abdichtung — im Zweifel bauen wir zurück."],
        ["Wie lange muss ein neues Bad trocknen?","Abdichtung und Kleber brauchen ihre Trocknungszeiten; eingerechnet sind sie im Bauprogramm. Betreten ist nach dem Verfugen möglich, Duschen frühestens 24 Stunden nach den Silikonfugen — den genauen Zeitpunkt sagen wir Ihnen bei der Übergabe."],
        ["Liefern Sie das Material?","Ja, aus unserem Lager oder direkt vom Händler. Sie können auch eigenes Material stellen — wir prüfen es vor dem Verlegen."],
        ["Verlegen Sie auch Parkett in bewohnten Wohnungen?","Ja, raumweise mit Möbelumstellung nach Absprache und täglicher Reinigung."]]
  }},
 {no:"06",k:"maler",slug:"malerarbeiten",t:"Malerarbeiten",img:"img/bedroom-fluted.jpg",d:"Innen- und Fassadenanstrich, Tapezieren, Leerwohnungsmalerei — im laufenden Betrieb.",
  long:"Maleranstrich mit sauberen Kanten — innen und an der Fassade, einheitlich über das ganze Portfolio. Auch im laufenden Betrieb, ohne den Alltag Ihrer Mieter zu stören.",
  pts:["Innen- & Fassadenanstrich","Tapezieren","Leerwohnungsmalerei","Einheitlich übers Portfolio"],
  detail:{
   h1:"Malerarbeiten in Zürich",
   lead:"Innen- und Fassadenanstrich, Tapezieren und Leerwohnungsmalerei — mit sauberer Vorbereitung, abgedeckten Böden und einem Termin, der hält.",
   merkmale:[["Untergrund zuerst","Spachteln, Schleifen, Grundieren — der Anstrich hält nur so gut wie der Untergrund darunter."],
             ["Einheitlich im Portfolio","Gleiche Farbtöne, gleiche Produkte, gleiche Ausführung über alle Objekte einer Verwaltung."],
             ["Im laufenden Betrieb","Treppenhäuser, Büros und bewohnte Wohnungen — etappenweise, abgedeckt, täglich gereinigt."],
             ["Schnell bei Mieterwechsel","Leerwohnungsmalerei innert weniger Tage, damit die Wohnung pünktlich vermietet wird."]],
   teil:[{t:"Innenanstrich",d:"Wände und Decken in Wohnungen, Treppenhäusern und Büros — Dispersion, Mineralfarbe oder Latex je nach Raum."},
         {t:"Fassadenanstrich",d:"Reinigung, Ausbesserung und Anstrich von Putzfassaden. Gerüst und Bewilligung koordinieren wir."},
         {t:"Tapezieren",d:"Vlies- und Papiertapeten, Wandbilder und Panoramatapeten — mit sauberer Stossverarbeitung."},
         {t:"Leerwohnungsmalerei",d:"Komplette Wohnung beim Mieterwechsel: Löcher schliessen, Flecken isolieren, zwei Anstriche, saubere Kanten."},
         {t:"Spachtel- und Untergrundarbeiten",d:"Rissbehandlung, Glattspachtelung, Abrieb, Grundierung — auch als Vorbereitung für andere Gewerke."}],
   incl:["Besichtigung und Aufnahme vor Ort","Verbindliche Offerte, Position für Position","Abdeckung von Böden, Fenstern und Einbauten","Untergrundvorbereitung und Grundierung","Entsorgung und Endreinigung","Werkgarantie 24 Monate"],
   gruende:[["Kalkulierbar pro Wohnung","Für Leerwohnungen bieten wir Pauschalen pro Zimmerzahl im Rahmenvertrag an. Die Pauschalen richten sich nach Zimmerzahl und Umfang — Richtwerte zeigt der Rechner auf der Startseite."],
            ["Kein Farbchaos im Portfolio","Wir führen für jede Verwaltung eine Materialliste mit Farbtönen und Produkten."],
            ["Kombinierbar","Maler plus Bodenbelag plus Kleinreparaturen: Die ganze Leerwohnung aus einem Betrieb."]],
   faq:[["Wie viele Anstriche sind inbegriffen?","Zwei Anstriche auf vorbereitetem Untergrund. Bei starken Farbwechseln oder Flecken kommt eine Isoliergrundierung dazu — ausgewiesen in der Offerte."],
        ["Riecht die Farbe lange?","Wir arbeiten mit lösemittelarmen Produkten. Räume sind in der Regel am Folgetag wieder nutzbar."],
        ["Malen Sie auch im bewohnten Zustand?","Ja, raumweise mit Abdeckung der Möbel und täglicher Reinigung. Mieter werden vorab schriftlich informiert."],
        ["Wie schnell ist eine Leerwohnung gestrichen?","Eine 3.5-Zimmer-Wohnung mit normalem Untergrund ist in der Regel in drei bis fünf Arbeitstagen gestrichen. Der Termin steht im Werkvertrag."]]
  }},
];
const svcBySlug=s=>SVC.find(x=>x.slug===s||x.k===s)||null;

/* ---------- Lösungen (Segmente) ---------- */
const SOL=[
 {slug:"hausverwaltungen",t:"Für Hausverwaltungen",tag:"Portfolio & Unterhalt",img:"img/kitchen-white.jpg",d:"Werterhalt, Leerwohnungen und Objektpflege über das ganze Portfolio — gebündelt über einen Rahmenvertrag, abgerechnet über einen Ansprechpartner.",
  detail:{
   h1:"Bauleistungen für Hausverwaltungen",
   lead:"Leerwohnungen, Unterhalt und Sanierungen über das ganze Portfolio — ein Rahmenvertrag, ein Ansprechpartner, nachvollziehbare Dokumentation für Eigentümer und Mieter.",
   real:[["Zu viele Ansprechpartner","Maler, Sanitär, Bodenleger, Entsorger: Jede Leerwohnung bedeutet fünf Telefonate, fünf Offerten und fünf Rechnungen."],
         ["Leerstand kostet Miete","Jede Woche ohne Übergabe ist eine Woche ohne Mietzins. Handwerker, die nicht greifbar sind, verlängern den Leerstand."],
         ["Fehlende Nachweise","Eigentümer und Mieter verlangen Belege: Was wurde gemacht, wann, mit welchem Material — und was davon ist verrechenbar?"]],
   takes:[["Rahmenvertrag und fester Ansprechpartner","Feste Konditionen, ein Bauleiter für alle Objekte, gebündelte Abrechnung pro Monat oder pro Objekt."],
          ["Leerwohnungs-Renovation","Komplette Instandstellung beim Mieterwechsel mit fixem Übergabetermin — Maler, Böden, Bad, Küche, Kleinreparaturen."],
          ["Laufender Unterhalt und Störungsbehebung","Sanitär, Boiler, Heizkörper, Kleinreparaturen — mit vereinbarter Reaktionszeit im Rahmenvertrag."],
          ["Dokumentation","Abnahmeprotokoll, Fotos vorher/nachher und eine Rechnung, die Position für Position der Offerte folgt."]],
   gruende:[["Weniger Koordination","Sie melden das Objekt, wir übernehmen den Rest — inklusive Mieterinformation und Schlüsselübergabe."],
            ["Kürzerer Leerstand","Alle Gewerke parallel geplant aus einem Betrieb. Der Übergabetermin steht im Werkvertrag."],
            ["Saubere Akten","Jede Leistung ist belegt und pro Wohnung zugeordnet — für Eigentümerabrechnung und Nebenkosten."]],
   faq:[["Bieten Sie Rahmenverträge an?","Ja. Feste Regieansätze, Pauschalen für wiederkehrende Arbeiten und eine Reaktionszeit für Störungen — schriftlich, mit jährlicher Überprüfung."],
        ["Wie schnell sind Sie bei einer Störung vor Ort?","Die Reaktionszeit wird im Rahmenvertrag vereinbart und hängt von Objektzahl und Region ab. Ohne Rahmenvertrag antworten wir an Werktagen innert 24 Stunden."],
        ["Übernehmen Sie auch die Hauswartung?","Nein. Wir übernehmen den technischen Unterhalt — Sanitär, Heizkörper, Reparaturen, Malerei — aber keine Reinigung, Gartenpflege oder Winterdienst."],
        ["Wie läuft die Abrechnung?","Pro Objekt oder gebündelt pro Monat, mit Zuordnung zur Liegenschaft und zur Wohnung. Die Rechnung folgt der Offerte Position für Position."]]
  }},
 {slug:"generalunternehmer",t:"Für Generalunternehmer",tag:"Subunternehmer",img:"img/before-drywall.jpg",d:"Zuverlässiger Subunternehmer für einzelne Gewerke oder Gewerkepakete — SIA-konform, dokumentiert und termintreu im Bauzeitplan.",
  detail:{
   h1:"Subunternehmer für Generalunternehmer",
   lead:"Einzelne Gewerke oder Pakete — Rückbau, Sanitär, Trockenbau, Fliesen, Maler — ausgeführt nach SIA, mit Nachweisen für Ihre Abnahme und im Takt Ihres Bauprogramms.",
   real:[["Ein Gewerk fällt aus, das Bauprogramm kippt","Ein Subunternehmer, der nicht liefert, verschiebt alle nachfolgenden Gewerke."],
         ["Nachweise fehlen bei der Abnahme","Prüfprotokolle, Materialnachweise und Fotos vor dem Schliessen müssen bei der Bauabnahme vorliegen."],
         ["Zu viele kleine Verträge","Fünf Subunternehmer für fünf Gewerke bedeuten fünf Verträge, fünf Bauleiter und fünf Schnittstellen."]],
   takes:[["Gewerkepakete aus einer Hand","Rückbau, Trockenbau, Sanitär, Fliesen und Maler als Paket — ein Vertrag, ein Bauleiter auf Ihrer Seite."],
          ["Einzelgewerk im Bauprogramm","Auch als reiner Sanitär- oder Plattenleger-Sub: Wir halten die Termine, die Sie uns im Bauprogramm geben."],
          ["Nachweise für die Abnahme","Druck- und Dichtigkeitsprüfung mit Protokoll, Fotodokumentation, Materiallisten — geliefert ohne Nachfrage."],
          ["Kapazität nach Absprache","Wie viele Baustellen wir parallel führen, hängt vom Bauprogramm ab — bei der Anfrage nennen wir einen verbindlichen Starttermin. Wir sagen zu, was wir halten können."]],
   gruende:[["Termintreu im Takt","Beginn und Ende jedes Gewerks stehen im Werkvertrag und richten sich nach Ihrem Bauprogramm."],
            ["Ausführung nach SIA","Normkonforme Ausführung, versichert, mit Werkgarantie 24 Monate auf unsere Arbeit."],
            ["Ein Ansprechpartner auf der Baustelle","Der Bauleiter ist vor Ort erreichbar und nimmt an Ihren Bausitzungen teil."]],
   faq:[["Welche Gewerke bieten Sie als Sub an?","Renovation, Sanitär, Neu- und Umbau (Trockenbau), Abbruch und Rückbau, Fliesen und Parkett, Malerarbeiten — einzeln oder als Paket."],
        ["Arbeiten Sie nach unseren Plänen?","Ja. Wir führen nach Ihren Ausführungsplänen aus und melden Abweichungen schriftlich vor der Ausführung."],
        ["Wie sieht die Abrechnung aus?","Nach Werkvertrag mit Ausmass oder Pauschale, Teilrechnungen nach Baufortschritt, Schlussrechnung nach Abnahme. Zahlungsfristen stehen im Werkvertrag."],
        ["Sind Sie versichert?","Ja, Betriebshaftpflicht. Den Versicherungsnachweis legen wir auf Wunsch der Offerte bei."]]
  }},
 {slug:"gewerbe-ladenbau",t:"Für Gewerbe & Ladenbau",tag:"Fit-out",img:"img/salon-recep.jpg",d:"Fit-out und Umbau von Büro-, Gewerbe- und Ladenflächen — auch ausserhalb der Öffnungszeiten, damit Ihr Betrieb weiterläuft.",
  detail:{
   h1:"Fit-out für Gewerbe, Büro und Ladenbau",
   lead:"Umbau und Ausbau von Büro-, Praxis-, Salon- und Ladenflächen — in Etappen, ausserhalb der Öffnungszeiten und mit einem Eröffnungstermin, der im Werkvertrag steht.",
   real:[["Der Betrieb darf nicht stehen","Jeder geschlossene Tag ist ein Tag ohne Umsatz. Der Umbau muss um die Öffnungszeiten herum geplant werden."],
         ["Der Eröffnungstermin ist fix","Werbung, Personal und Mietbeginn sind geplant — die Baustelle muss sich danach richten, nicht umgekehrt."],
         ["Viele Gewerke, wenig Zeit","Trennwände, Böden, Sanitär, Elektro-Vorbereitung, Maler: alles auf kleiner Fläche in kurzer Zeit."]],
   takes:[["Fit-out aus einer Hand","Rückbau, Trennwände, Böden, Sanitär, Malerarbeiten und Montage — koordiniert über einen Bauleiter."],
          ["Arbeiten ausserhalb der Öffnungszeiten","Abend-, Nacht- und Wochenendarbeit nach Absprache, mit täglicher Reinigung und Staubschutz."],
          ["Etappenplanung","Der Betrieb läuft in einem Teil weiter, während der andere umgebaut wird."],
          ["Übergabe zum Eröffnungstermin","Abnahmeprotokoll, gereinigte Fläche, Abdeckungen entfernt — am Datum aus dem Werkvertrag."]],
   gruende:[["Eröffnung wie geplant","Der Termin steht im Werkvertrag, das Bauprogramm richtet sich danach."],
            ["Umsatz läuft weiter","Etappen und Arbeiten ausserhalb der Öffnungszeiten halten den Betrieb offen."],
            ["Referenz: Coiffure-Salon","Empfang, Rundbögen, Marmor und Messing — Fit-out einer Ladenfläche."]],
   faq:[["Können Sie nachts oder am Wochenende arbeiten?","Ja, nach Absprache und im Rahmen der örtlichen Lärmschutzvorschriften. Lärmintensive Arbeiten planen wir in erlaubte Zeitfenster."],
        ["Übernehmen Sie auch Elektro?","Die Vorbereitung — Schlitze, Leerrohre, Dosen — ja. Die Elektroinstallation selbst führt ein konzessionierter Partnerbetrieb aus, den wir koordinieren."],
        ["Wie lange dauert ein Fit-out?","Je nach Fläche und Ausbaustandard einige Wochen — bei Ladenflächen planen wir rückwärts vom Eröffnungstermin. Der Termin steht im Werkvertrag."],
        ["Arbeiten Sie mit unserem Innenarchitekten zusammen?","Ja. Wir führen nach dessen Plänen aus und bringen Ausführungsdetails vor Baubeginn ein."]]
  }},
];
const solBySlug=s=>SOL.find(x=>x.slug===s)||null;

const STEPS=[   /* v16: fünf Schritte, Versprechen "Offerte innert 48 h" */
 {n:"01",t:"Anfrage & Rückruf",s:"Telefon · Formular · WhatsApp",d:"Sie schildern kurz, worum es geht. Wir rufen in 5 Minuten zurück und klären Objekt, Umfang und Termin.",
  pts:["Rückruf in 5 Minuten","Erste Einschätzung am Telefon","Fotos genügen oft für den Start"],dur:"Tag 1"},
 {n:"02",t:"Besichtigung & Aufmass",s:"Kostenlos · vor Ort",d:"Wo nötig, kommen wir vorbei, messen aus und prüfen Leitungen, Untergrund und Zugang.",
  pts:["Aufmass vor Ort","Ist-Zustand mit Fotos dokumentiert","Material und Ablauf besprochen"],dur:"Tag 1–2",photo:"img/before-demo.jpg",photoCap:"Aufmass vor Ort, im Ist-Zustand"},
 {n:"03",t:"Festpreis-Offerte",s:"Innert 48 h",d:"Sie erhalten die Offerte Position für Position — als Festpreis oder mit transparenten Regieansätzen, dazu den Bauzeitplan.",
  pts:["Offerte innert 48 h","Jede Position einzeln ausgewiesen","Beginn und Übergabe als Termin"],dur:"innert 48 h"},
 {n:"04",t:"Ausführung",s:"Ein Bauleiter · termintreu",d:"Alle Gewerke nach Bauzeitplan, koordiniert von einer Person. Die Baustelle bleibt sauber, Sie erhalten jede Woche ein Update.",
  pts:["Werkvertrag mit fixen Daten","Wöchentliches Update","Baustelle täglich sauber"],dur:"nach Bauzeitplan",photo:"img/process-drywall.jpg",photoCap:"Ausführungsplan wird Wand"},
 {n:"05",t:"Abnahme & Übergabe",s:"Protokoll · Schlüssel",d:"Gemeinsame Abnahme mit Protokoll und Fotos. Am vereinbarten Tag übergeben wir die Schlüssel.",
  pts:["Abnahmeprotokoll mit Fotos","Rechnung folgt der Offerte","24 Monate Werkgarantie"],dur:"am Termin",photo:"img/atlant-kitchen2.jpg",photoCap:"Übergabe, besenrein"},
];
const PROMISES=[
 {t:"Festpreis oder Regie",d:"Verbindliche Offerte Position für Position — oder transparente Regieansätze für laufenden Unterhalt.",scroll:"richtwert",cta:"Richtwerte ansehen"},
 {t:"Im Bauzeitplan",d:"Beginn und Übergabe werden schriftlich fixiert und mit Ihrer Bauleitung koordiniert — und eingehalten.",scroll:"wohnung",cta:"Rundgang ansehen"},
 {t:"Ein Ansprechpartner",d:"Sechs Gewerke unter einem Dach. Sie sprechen mit einer Person — von der Offerte bis zur Abnahme.",go:"ueber-uns",cta:"Über uns ansehen"},
 {t:"Rahmenverträge",d:"Feste Konditionen und gebündelte Abrechnung über das ganze Portfolio in der Deutschschweiz.",go:"loesungen/hausverwaltungen",cta:"Lösung ansehen"},
];
const PROMISE=PROMISES.map(p=>[p.t,p.d]); // Abwärtskompatibilität
const COUNTERS=[["6","","Gewerke aus einer Hand"],["24","h","Antwort an Werktagen"],["3","h","Mindestauftrag ab"],["100","%","Deutschschweiz abgedeckt"]];
const HERO_TRUST=["Offerte innert 48 h","HR Zürich","Versichert","Werkgarantie 24 Monate"];
/* Logo-Band unter den Kennzahlen. [PLATZHALTER]: echte Kundennamen/Logos eintragen (svg: Pfad zu einem SVG/PNG, sonst Wortmarke aus dem Namen).
   Leeres Array -> Band wird nicht gerendert. */
const CLIENTS=[];   /* leer = Band wird nicht gerendert. Erst füllen, wenn echte Kunden ihr Logo freigegeben haben. */

/* ---------- Baustellen-Knigge + Festpreis-Inhalt ---------- */
const KNIGGE=[
 {t:"Abdeckung vor Beginn",d:"Böden, Treppenhaus, Lift und Durchgänge werden geschützt, bevor das erste Werkzeug ausgepackt wird."},
 {t:"Schutt laufend raus",d:"Bauschutt und Verpackung verlassen die Baustelle täglich — nichts lagert im Treppenhaus oder vor dem Haus."},
 {t:"Treppenhaus frei, Nachbarn informiert",d:"Zugänge bleiben passierbar. Lärmzeiten werden vorab angekündigt, Mieter und Nachbarn schriftlich informiert."},
 {t:"Übergabe ohne Werkzeug",d:"Am Übergabetag ist die Fläche gereinigt, Abdeckungen sind entfernt, Werkzeug und Material sind weg."},
];
const INCLUDED=["Vor-Ort-Aufnahme und Beratung","Verbindliche Offerte, Position für Position","Entsorgung von Schutt und Verpackung","Druck- und Dichtigkeitsprüfung mit Protokoll (Sanitär)","Baustellenreinigung und besenreine Übergabe","Werkgarantie 24 Monate"];

/* ---------- Richtwert-Rechner (Startseite #richtwert) ----------
   Quelle: CRM preis_richtwerte (Stand 31.08.2026) — bei Änderung im CRM hier nachziehen.
   k = Chip-Key · einheit = Mengen-Typ (auftrag 1–10, zimmer 1–12, m2 10–400/5) · label = Mengen-Bezeichnung
   min/max = CHF pro Einheit · gewerk = exakt der <option>-Text in #i-svc (SVC[i].t) · material:false = "exkl. Material" */
const RICHTWERTE=[
 {k:'leerwohnung', t:'Leerwohnungs-Renovation', einheit:'auftrag', label:'Wohnungen', min:7000,  max:20000, note:'2.5 bis 4.5 Zimmer, Arbeiten von Rückbau bis Übergabe', gewerk:'Renovation', material:false},
 {k:'bad',         t:'Badsanierung komplett',   einheit:'auftrag', label:'Bäder',     min:9000,  max:26000, note:'Arbeiten für Abbruch, Sanitär, Abdichtung und Plattenverlegung', gewerk:'Sanitär', material:false},
 {k:'maler-zi',    t:'Malerarbeiten',           einheit:'zimmer',  label:'Zimmer',    min:550,   max:950,   note:'pro Zimmer bis ca. 20 m² (≈ CHF 28–48 pro m²), zweifacher Anstrich', gewerk:'Malerarbeiten', material:false},
 {k:'maler-m2',    t:'Wand- & Fassadenanstrich',einheit:'m2',      label:'m² Fläche', min:12,    max:22,    note:'pro m² inkl. Vorbereitungsarbeiten', gewerk:'Malerarbeiten', material:false},
 {k:'platten',     t:'Plattenarbeiten',         einheit:'m2',      label:'m² Fläche', min:95,    max:150,   note:'Verlegen und Verfugen; Platten, Kleber und Fugenmaterial separat', gewerk:'Fliesen & Parkett', material:false},
 {k:'boden',       t:'Parkett & Bodenbelag',    einheit:'m2',      label:'m² Fläche', min:38,    max:65,    note:'schwimmend verlegt', gewerk:'Fliesen & Parkett', material:false},
 {k:'rueckbau',    t:'Abbruch & Rückbau',       einheit:'zimmer',  label:'Räume',     min:600,   max:1200,  note:'selektiver Rückbau pro Raum, Entsorgung separat', gewerk:'Abbruch & Rückbau', material:false},
 {k:'trockenbau',  t:'Trockenbau & Gipser',     einheit:'auftrag', label:'Wände',     min:800,   max:1600,  note:'Montage einer Leichtbauwand oder Spachtelarbeiten', gewerk:'Neu- & Umbau', material:false},
 {k:'sanitaer',    t:'Sanitär-Reparatur / Montage', einheit:'auftrag', label:'Einsätze', min:240, max:480,  note:'Montage einzelner Apparate, ab 3 Stunden', gewerk:'Sanitär', material:false},
 {k:'kueche',      t:'Küchenmontage',           einheit:'auftrag', label:'Küchen',    min:900,   max:1800,  note:'ohne Geräteanschluss-Sonderfälle', gewerk:'Neu- & Umbau', material:false},
];

/* ---------- Kundenstimmen — Auszüge aus öffentlichen Google-Rezensionen (Stand 07.09.2026, siehe CO.google) ---------- */
const REVIEWS=[
 {q:"Ich möchte mich herzlich für die komplette Renovierung unseres Badezimmers bedanken. Die Arbeit wurde auf höchstem Niveau ausgeführt — vom Abbruch bis zur Endmontage war alles sauber und professionell umgesetzt.",who:"Helmut Fischer",role:"Badsanierung",src:"Google",rating:5},
 {q:"Vielen Dank für die hervorragend ausgeführten Malerarbeiten. Die Wände wurden perfekt vorbereitet — alle Unebenheiten und Risse wurden beseitigt und die Oberfläche vor dem Streichen sorgfältig geglättet.",who:"Dmitriy Sapozhnik",role:"Malerarbeiten",src:"Google",rating:5},
 {q:"Bereits zum zweiten Mal bei BauStern beauftragt – zuerst für die Neueindeckung des Dachs, jetzt für die Verlegung von Fliesen in Bad und Küche.",who:"Serega",role:"Fliesen, Bad und Küche",src:"Google",rating:5},
 {q:"Zunächst einmal möchte ich sagen, dass ich meine Entscheidung für BauStern nie bereut habe. Während des gesamten Projekts stand ich in engem Kontakt mit dem Projektmanager, der mich stets auf dem Laufenden hielt.",who:"Ruslan Tur",role:"Renovation",src:"Google",rating:5},
];
/* rating-Feld ist Pflicht für neue Einträge (auch aus dem n8n-Sync, siehe reviews.json) — Anzeige filtert immer auf >=4,
   damit ein einzelner 1–3★-Ausreisser nie automatisch auf der Seite landet. */
const MIN_REVIEW_RATING=4;

/* ---------- Einsatzgebiet ---------- */
/* ---------- Karriere: 3 Stellen. Keine erfundenen Lohnzahlen — Ansatz wird im Gespräch besprochen. ---------- */
const KARRIERE=[
 {slug:"sanitaermonteur",t:"Sanitärmonteur / Heizungsinstallateur (m/w/d)",pensum:"100%, Festanstellung",
  aufgaben:["Sanitär- und Heizungsinstallationen bei Renovation, Umbau und Neubau","Montage von Leitungen, Armaturen, Bädern und Heizkörpern","Fehlersuche und Reparaturen bei laufendem Betrieb","Zusammenarbeit mit Bauleitung und anderen Gewerken auf der Baustelle"],
  anforderungen:["Abgeschlossene Berufslehre als Sanitärinstallateur/in oder Heizungsinstallateur/in (EFZ) — oder gleichwertige Erfahrung","Fahrausweis Kat. B","Deutschkenntnisse für die Verständigung auf der Baustelle","Selbständige, saubere Arbeitsweise"]},
 {slug:"gipser-maler",t:"Gipser & Maler (m/w/d)",pensum:"100%, Festanstellung",
  aufgaben:["Verputz-, Spachtel- und Malerarbeiten innen und aussen","Vorbereitung von Untergründen (Schleifen, Grundieren, Ausbessern)","Tapezieren und Oberflächenbeschichtungen","Sorgfältiges Arbeiten in bewohnten Objekten"],
  anforderungen:["Erfahrung als Gipser, Maler oder in einem verwandten Beruf","Auge fürs Detail, saubere Ausführung","Deutschkenntnisse für die Verständigung auf der Baustelle","Fahrausweis Kat. B von Vorteil"]},
 {slug:"bauleitender-allrounder",t:"Bauleitender Allrounder / Monteur (m/w/d)",pensum:"100%, Festanstellung",
  aufgaben:["Koordination mehrerer Gewerke auf der Baustelle","Ansprechpartner für Kundschaft und Subunternehmer vor Ort","Termin- und Qualitätskontrolle bis zur Abnahme","Handwerkliche Mitarbeit je nach Projekt"],
  anforderungen:["Mehrjährige Erfahrung im Baugewerbe, idealerweise mit erster Führungs- oder Koordinationserfahrung","Organisationstalent und ruhiges Auftreten gegenüber Kundschaft","Fahrausweis Kat. B","Gute Deutschkenntnisse"]},
];

/* ---------- Region-SEO-Seiten (#/sanierung-:slug) — eigene, indexierbare Landingpages je Region,
   B2B-Fokus (Hausverwaltung/GU/Gewerbe), Inhalte konsistent mit REGIONS/RICHTWERTE, keine Duplizierung
   der Startseite. Siehe Hinweis in app.js zu Pfad- vs. Hash-Routing für die eigentliche URL-Struktur. */
const REGION_SEO=[
 {slug:"winterthur",n:"Winterthur",zeit:"ca. 30 Min. ab unserem Standort Zürich-Altstetten",
  lead:"Renovation, Sanitär und Umbau für Hausverwaltungen, Generalunternehmer und Gewerbe in Winterthur und Umgebung — von Zürich-Altstetten aus, ohne Anfahrtspauschale auf der Rechnung."},
 {slug:"zug",n:"Zug",zeit:"ca. 35 Min. ab unserem Standort Zürich-Altstetten",
  lead:"Renovation, Sanitär und Umbau im Kanton Zug — koordiniert von einer Bauleitung, dokumentiert bis zur Abnahme, für Verwaltungen mit Objekten in Zug und der Region Zürich."},
 {slug:"luzern",n:"Luzern",zeit:"ca. 50 Min. ab unserem Standort Zürich-Altstetten",
  lead:"Renovation, Sanitär und Umbau in Luzern und der Agglomeration — als Einzelauftrag oder im Rahmenvertrag für Verwaltungen mit mehreren Standorten."},
];

const REGIONS=[
 {n:"Zürich",sub:"Sitz in Altstetten, Materiallager, A1-Anschluss",time:"Stadt und Agglomeration"},
 {n:"Winterthur",sub:"Stadt und Umland",time:"ca. 30 Min. ab Altstetten"},
 {n:"Zug",sub:"Kanton Zug",time:"ca. 35 Min. ab Altstetten"},
 {n:"Luzern",sub:"Stadt und Agglomeration",time:"ca. 50 Min. ab Altstetten"},
 {n:"Deutschschweiz",sub:"Weitere Regionen nach Absprache",time:"je nach Auftragsvolumen"},
];

/* ---------- Wissen (Teaser, kein Volltext) ---------- */
const WISSEN=[
 {t:"Was kostet eine Renovation in Zürich?",cat:"Kosten",d:"Richtwerte pro Quadratmeter und pro Gewerk, typische Kostentreiber und was in einer Festpreis-Offerte stehen muss. Mit Beispielrechnung für eine 3.5-Zimmer-Wohnung."},
 {t:"Sanitärnotfall in Zürich",cat:"Sanitär",d:"Wasser abstellen, Schaden dokumentieren, Versicherung informieren — die ersten Schritte bei Rohrbruch und Wasserschaden. Und wann ein Notdienst wirklich nötig ist."},
 {slug:"baubewilligung-zuerich-sanierung",t:"Baubewilligung in Zürich: Wann ist ein Baugesuch für Sanierungen nötig?",cat:"Bewilligungen",d:"Welche Sanierungsarbeiten bewilligungsfrei sind, wann ein Baugesuch nötig wird und wie lange die Gemeinde für den Entscheid braucht.",
  body:`<p>Die kurze Antwort zuerst: Es kommt auf den Kanton, die Gemeinde und die Art der Arbeiten an — eine allgemeingültige Liste gibt es nicht. Im Kanton Zürich regelt das Planungs- und Baugesetz (PBG) zusammen mit der kantonalen Bauverfahrensverordnung, welche Vorhaben bewilligungspflichtig sind. Als Faustregel gilt: Reine Unterhaltsarbeiten, die am Erscheinungsbild und an der Nutzung nichts ändern, sind meist bewilligungsfrei. Sobald sich Grundriss, Fassade, Nutzung oder die Statik ändern, wird es bewilligungspflichtig.</p>
<h3 class="disp">Meist ohne Baugesuch möglich</h3>
<p>Innensanierungen, die nichts an tragenden Wänden, an der Statik oder an der Gebäudehülle ändern, laufen in der Regel ohne Bewilligung: neue Bodenbeläge, ein neuer Anstrich, der Ersatz von Sanitärapparaten am selben Ort, eine neue Küche im bestehenden Grundriss. Auch der Ersatz von Fenstern in gleicher Grösse und Position ist häufig meldepflichtig statt bewilligungspflichtig — die genaue Grenze zieht die jeweilige Gemeinde.</p>
<h3 class="disp">Meist mit Baugesuch</h3>
<p>Sobald eine tragende Wand versetzt oder entfernt wird, sobald sich der Grundriss eines Bades wesentlich ändert (neue Nasszelle an neuem Ort mit neuen Steigzonen), sobald an der Fassade oder am Dach etwas verändert wird (neue Fensteröffnungen, Balkon, Dachaufbau) oder sobald sich die Nutzung ändert (z. B. Wohnung zu Gewerbe), braucht es in der Regel ein Baugesuch bei der zuständigen Gemeinde. Bei Liegenschaften in der Kernzone, unter Schutz oder mit besonderen Bau- und Zonenvorschriften gelten oft zusätzliche Auflagen.</p>
<p>Die Bearbeitungsdauer eines ordentlichen Baugesuchs liegt in den meisten Zürcher Gemeinden zwischen wenigen Wochen und mehreren Monaten, je nach Vorhaben, Einsprachen und Auslastung des Bauamts. Das gehört von Anfang an in die Terminplanung — ein Baugesuch lässt sich nicht beschleunigen, indem man später mit den Arbeiten beginnt.</p>
<h3 class="disp">Was wir konkret tun</h3>
<p>Bei der Besichtigung sagen wir Ihnen, ob wir Ihr Vorhaben für bewilligungspflichtig halten, und empfehlen bei Unklarheit die Rückfrage bei der Bauverwaltung der Standortgemeinde — die Gemeinde entscheidet verbindlich, nicht wir. Ist ein Baugesuch nötig, liefern wir die für den Bauabschnitt nötigen Pläne und Angaben zu, planen den Baustart erst nach rechtskräftiger Bewilligung ein und weisen bei Mehrfamilienhäusern und Verwaltungen frühzeitig auf mögliche Einsprachefristen hin.</p>
<p style="color:var(--muted);font-size:14px">Dieser Artikel ersetzt keine Rechtsberatung und keine Bauberatung durch die Gemeinde. Massgebend ist immer der Entscheid der zuständigen Baubehörde am Standort Ihrer Liegenschaft.</p>`},
 {t:"Leerwohnungs-Renovation beim Mieterwechsel",cat:"Hausverwaltung",d:"Ablauf von der Wohnungsabnahme bis zur Neuvermietung, was zu Lasten des Mieters geht und wie sich der Leerstand auf wenige Tage verkürzen lässt."},
 {t:"Liegenschaftsunterhalt und Steuern",cat:"Steuern",d:"Werterhaltend oder wertvermehrend? Was Eigentümer im Kanton Zürich abziehen können und welche Belege das Steueramt verlangt."},
 {slug:"badsanierung-kosten-zuerich-2026",t:"Was kostet eine Badsanierung in Zürich 2026? Richtwerte & Kostenfallen.",cat:"Kosten",d:"Richtwerte für eine komplette Badsanierung, die grössten Kostentreiber und die Positionen, die in vielen Offerten fehlen.",
  body:`<p>Für die Arbeiten einer Badsanierung in einer Zürcher Wohnung bewegen sich unsere Richtwerte zwischen rund <b>CHF 9'000 und CHF 26'000</b> pro Bad. <b>Materialien und Sanitärapparate sind nicht enthalten und werden separat berechnet.</b> Der Rechner zeigt keinen schlüsselfertigen Gesamtpreis. Den konkreten Umfang einschliesslich allfälliger Elektroarbeiten, MWST und Anfahrt klären wir in der individuellen Offerte. Die Position der Steigzonen, der Ausbaustandard und nötige Anpassungen an Statik oder Belüftung beeinflussen den Aufwand.</p>
<h3 class="disp">Was den Preis nach oben treibt</h3>
<p>Am teuersten wird es, wenn sich die Position von Dusche, WC oder Waschtisch verschiebt — jede Verschiebung braucht neue Steigleitungen, oft durch die Decke zur Wohnung darunter, was zusätzliche Abdichtungs- und Rückbauarbeiten auslöst. Auch ältere Liegenschaften mit unbekannter Leitungsführung bergen ein Risiko: Erst nach dem Abbruch zeigt sich, ob Steigzonen und Anschlüsse dem heutigen Standard entsprechen oder ersetzt werden müssen. Grossformatige Platten, bodenebene Duschen mit Gefälleestrich und hochwertige Armaturen erhöhen den Preis zusätzlich, verglichen mit einer funktionalen Auffrischung im bestehenden Grundriss.</p>
<h3 class="disp">Positionen, die in günstigen Offerten oft fehlen</h3>
<p>Ein tiefer Angebotspreis lohnt sich einen zweiten Blick: Enthält er die fachgerechte Entsorgung des Abbruchmaterials mit Wiegeschein? Ist eine Dichtigkeitsprüfung mit Protokoll vorgesehen, bevor die Platten verlegt werden? Ist die Baustellenreinigung nach Übergabe eingerechnet? Diese Positionen machen selten mehr als ein paar hundert Franken aus, tauchen aber in nachträglichen Rechnungen gerne als Überraschung auf, wenn sie im ursprünglichen Angebot fehlten.</p>
<h3 class="disp">Was die Dauer beeinflusst</h3>
<p>Eine Vollsanierung dauert bei uns in der Regel drei bis vier Wochen, von Abbruch bis Übergabe — vorausgesetzt, die Materialien sind rechtzeitig bestellt und es gibt keine bösen Überraschungen hinter der Wand. Wird gleichzeitig ein zweites Bad oder eine Küche mitsaniert, lassen sich Gewerke wie Sanitär und Elektro bündeln, was pro Bad Zeit spart.</p>
<h3 class="disp">So bekommen Sie eine belastbare Zahl</h3>
<p>Eine seriöse Zahl für Ihr konkretes Bad braucht eine Besichtigung vor Ort — Grösse, Position der Anschlüsse, Baujahr der Liegenschaft und Ihr gewünschter Ausbaustandard bestimmen, wo Sie innerhalb der Spanne landen. Unser Richtwert-Rechner auf der <a data-go="home" href="/" style="text-decoration:underline">Startseite</a> gibt eine erste Einschätzung; die verbindliche Zahl steht danach in der Festpreis-Offerte, Position für Position.</p>`},
 {slug:"leerwohnung-streichen-preise",t:"Leerwohnung streichen: Preise pro Zimmer & Quadratmeter im Kanton Zürich.",cat:"Kosten",d:"Was Malerarbeiten in einer Leerwohnung pro Zimmer und pro Quadratmeter kosten, und wovon der Preis abhängt.",
  body:`<p>Für Malerarbeiten in einer leeren Wohnung — Wände und Decken, zweifacher Anstrich auf normalem Untergrund — rechnen wir pro Zimmer bis rund 20 m² mit <b>CHF 550 bis CHF 950</b>, umgerechnet etwa <b>CHF 28 bis CHF 48 pro Quadratmeter</b>. Für reine Wand- oder Fassadenflächen ausserhalb eines ganzen Zimmers (z. B. eine einzelne Wand oder ein Flur) liegt der Ansatz bei rund CHF 12 bis CHF 22 pro Quadratmeter, wiederum abhängig vom Untergrund. <b>Alle Richtwerte betreffen nur die Arbeit; Farbe und weitere Materialien werden separat berechnet.</b> MWST, Anfahrt und den genauen Leistungsumfang weisen wir in der individuellen Offerte aus.</p>
<h3 class="disp">Wovon die Spanne abhängt</h3>
<p>Der grösste Preistreiber ist der Zustand des Untergrunds. Eine Wand mit ein paar Dübellöchern und kleinen Kratzern ist schnell gespachtelt und geschliffen. Eine Wand mit grossflächigen Rissen, alten Tapetenresten oder unebenem Verputz braucht deutlich mehr Vorbereitungszeit — und die zeigt sich am Ende in der Rechnung, nicht im Farbeimer. Auch Deckenhöhe, Anzahl Ecken und Fensterlaibungen sowie die gewünschte Farbe (Weiss ab Stange vs. Sonderfarbton mit mehr Deckgängen) spielen eine Rolle.</p>
<h3 class="disp">Was im Preis inbegriffen sein sollte</h3>
<p>In unseren Offerten ist die Untergrundvorbereitung — Spachteln, Schleifen, Grundieren bei Bedarf — Teil des Zimmerpreises, nicht eine separate Position, die erst nach Baubeginn auftaucht. Ebenso inbegriffen: das Abdecken von Böden und verbleibenden Einbauten sowie die besenreine Übergabe. Nicht inbegriffen sind in der Regel Sonderwünsche wie Lasuren, Tapeten oder Strukturputz — die kalkulieren wir separat, weil Materialaufwand und Zeit stark abweichen.</p>
<h3 class="disp">Dauer</h3>
<p>Eine normale Leerwohnung mit unauffälligem Untergrund ist bei uns in der Regel innerhalb von drei bis fünf Arbeitstagen fertig gestrichen — je nach Anzahl Zimmer und Trocknungszeiten zwischen den Anstrichen. Bei laufendem Mieterwechsel planen wir das so, dass die Wohnung am vereinbarten Übergabedatum fertig ist, nicht erst kurz davor.</p>
<h3 class="disp">Eine belastbare Zahl für Ihre Wohnung</h3>
<p>Die genaue Fläche und der Zustand Ihrer Wände bestimmen, wo Sie innerhalb der Spanne landen. Für Hausverwaltungen mit wiederkehrendem Bedarf bei Mieterwechseln lohnt sich oft ein Rahmenvertrag mit festen Ansätzen pro Zimmer — dazu beraten wir Sie gerne im persönlichen Gespräch.</p>`},
 {t:"Generalunternehmer vs. Einzelgewerke",cat:"Planung",d:"Wann sich ein Gesamtauftrag lohnt, wann Einzelvergabe günstiger ist und wo die Schnittstellenkosten versteckt sind."},
 {slug:"buero-gewerbe-umbau-ablauf",t:"Büroumbau & Gewerbe-Renovierung: Ablauf, Terminsicherheit und Kostenkontrolle für GU & Verwaltungen.",cat:"Gewerbe",d:"Wie ein Büro- oder Ladenumbau typischerweise abläuft, worauf es bei einem fixen Eröffnungstermin ankommt und wie Sie die Kosten im Griff behalten.",
  body:`<p>Ein Büro- oder Ladenumbau unterscheidet sich von einer Wohnungsrenovation vor allem in einem Punkt: Es gibt fast immer ein hartes Datum. Ein Mietvertrag beginnt, eine Eröffnung ist beworben, ein Team muss an einem bestimmten Tag einziehen können. Der Ablauf muss sich diesem Datum unterordnen — nicht umgekehrt.</p>
<h3 class="disp">Typischer Ablauf</h3>
<p>Am Anfang steht die Bestandsaufnahme: Was ist an Trennwänden, Elektro, Beleuchtung und Bodenbelag vorhanden, was muss raus, was bleibt? Danach folgt die Grobplanung der Gewerke — bei einem Fit-out sind das meist Trockenbau für neue Trennwände, Elektro für Beleuchtung und Anschlüsse sowie Malerarbeiten für den Innenausbau, je nach Objekt ergänzt durch Bodenbeläge. Diese Gewerke laufen bei uns über eine Bauleitung, damit zum Beispiel Elektroleitungen fertig verlegt sind, bevor die Trockenbauwände geschlossen werden — eine Reihenfolge, die auf offenen Baustellen erfahrungsgemäss oft durcheinandergerät, wenn mehrere unabhängige Handwerker koordiniert werden müssen.</p>
<h3 class="disp">Terminsicherheit bei laufendem Betrieb</h3>
<p>Viele Gewerbeumbauten laufen ausserhalb der Geschäftszeiten oder in einem noch nicht eröffneten Objekt — beides erlaubt zügigeres Arbeiten als in einer bewohnten Wohnung, verlangt aber saubere Absprachen mit Vermieter, Nachbarmietern und gegebenenfalls der Verwaltung des Gebäudes bezüglich Lärm, Anlieferung und Zugängen. Ein fixer Eröffnungstermin steht bei uns im Werkvertrag; Verzögerungen bei Material oder Vorgewerken melden wir, sobald sie sich abzeichnen, statt erst kurz vor dem Termin.</p>
<h3 class="disp">Kostenkontrolle für GU und Verwaltungen</h3>
<p>Für Generalunternehmer und Verwaltungen, die mehrere Objekte gleichzeitig betreuen, zählt vor allem eines: eine Rechnung, die zur Offerte passt. Unsere Angebote sind nach Positionen aufgeschlüsselt (Gewerk, Menge, Ansatz), Nachträge entstehen nur bei tatsächlichen Änderungen gegenüber der Ausgangslage und werden vor Ausführung schriftlich bestätigt — nicht erst auf der Schlussrechnung. Bei wiederkehrendem Bedarf über mehrere Standorte bündeln wir Ansätze in einem Rahmenvertrag, was die Kalkulation für künftige Objekte vereinfacht.</p>
<h3 class="disp">Was Sie für eine erste Einschätzung brauchen</h3>
<p>Weil Bürofläche, Ausbaustandard und technische Vorgaben (Brandschutz, Lüftung, Elektro-Kapazität) von Objekt zu Objekt stark variieren, geben wir für Gewerbeumbauten keine pauschale Quadratmeter-Zahl, sondern eine Zahl nach Besichtigung — meist innert weniger Werktage nach dem ersten Rundgang durch das Objekt.</p>`},
];

/* ---------- Team ---------- */
const TEAM={name:"Artem Kozlovskyi",role:"Inhaber & Bauleiter",img:"https://www.baustern.ch/about/artem.jpg",fallback:"img/office.jpg",
 quote:"Ich bin auf jeder Baustelle selbst — von der Besichtigung bis zur Abnahme. Was in der Offerte steht, wird so gebaut; was sich unterwegs ändert, besprechen wir, bevor es Geld kostet.",
 bio:"Artem Kozlovskyi führt BauStern als Inhaber und Bauleiter in Personalunion: Er nimmt jedes Objekt selbst auf, schreibt die Offerte, koordiniert die Gewerke und übergibt am Ende persönlich. Das Unternehmen ist seit Februar 2026 im Handelsregister des Kantons Zürich eingetragen und arbeitet von Zürich-Altstetten aus in der ganzen Deutschschweiz.",
 facts:[["Funktion","Inhaber und Bauleiter"],["Handelsregister","Kanton Zürich, seit 19.02.2026"],["Sprachen","Deutsch, English, Русский, Українська"],["Sitz","Zürich-Altstetten"]]};

/* ---------- Arbeiten (id = Lightbox-Key, project = PROJECTS-Slug, imgs = weitere Bilder) ---------- */
const WORKS=[
 {id:"kueche-grifflos",img:"img/atlant-kitchen.jpg",imgs:["img/atlant-kitchen2.jpg"],t:"Küche, grifflos",loc:"Referenzprojekt",g:["neu-umbau"],project:"atlant-komplettausbau",
  text:"Grifflose Fronten, Naturstein-Rückwand mit indirekter Beleuchtung, Einbaugeräte. Teil des Komplettausbaus WHK Atlant: Anschlüsse neu gesetzt, Küche nach Ausführungsplan montiert."},
 {id:"wohnraum-offen",img:"img/atlant-living.jpg",t:"Wohnraum, offener Grundriss",loc:"Referenzprojekt",g:["renovation","maler"],project:"atlant-komplettausbau",
  text:"Offener Wohn- und Essbereich mit Wandbild-Panorama und indirekter LED-Beleuchtung. Trennwände versetzt, Decke abgehängt, Böden mit Fussbodenheizung."},
 {id:"objektbad-marmor",img:"img/bath-green.jpg",imgs:["img/bath-green2.jpg"],t:"Objektbad, grüner Marmor",loc:"Zürich",g:["sanitaer","fliesen"],project:"objektbad-gruener-marmor",
  text:"Grossformatige Marmorplatten, Walk-in-Dusche mit Glaswand, Armaturen in Messing. Abdichtung im Verbund, Sanitär mit Druckprüfung und Protokoll."},
 {id:"kueche-nussbaum",img:"img/kitchen-lux.jpg",t:"Küche in Nussbaum",loc:"Zürich",g:["neu-umbau"],
  text:"Küche mit Nussbaum-Fronten, Steinabdeckung und indirekter Beleuchtung unter den Oberschränken. Anschlüsse verlegt, Rückwand und Geräte montiert."},
 {id:"salon-empfang",img:"img/salon-recep.jpg",imgs:["img/salon-chairs.jpg","img/salon-arch.jpg"],t:"Coiffure-Salon, Empfang",loc:"Deutschschweiz",g:["renovation","neu-umbau"],project:"salon-fitout",
  text:"Empfangstheke in Marmor mit Messingkante, hinterleuchtetes Logo, Rundbögen zu den Arbeitsplätzen. Fit-out einer Ladenfläche."},
 {id:"bad-walk-in",img:"img/atlant-bath.jpg",t:"Bad mit Walk-in-Dusche",loc:"Referenzprojekt",g:["sanitaer","fliesen"],project:"atlant-komplettausbau",
  text:"Bad und WC mit grossformatigen Platten, Walk-in-Dusche und Wandeinbau-Nische. Leitungen neu, Druck- und Dichtigkeitsprüfung mit Protokoll."},
 {id:"hotelzimmer-serie",img:"img/hotel-room.jpg",imgs:["img/hotel-room2.jpg"],t:"Hotelzimmer in Serie",loc:"Deutschschweiz",g:["renovation","maler"],project:"hotel-gewoelbe",
  text:"Sanierung mehrerer Hotelzimmer in Serie: Wände, Böden, Beleuchtung, Anstrich — im laufenden Betrieb, etagenweise."},
 {id:"gewoelbekeller-bar",img:"img/bar-vault.jpg",imgs:["img/hotel-vault.jpg"],t:"Gewölbekeller, Bar",loc:"Deutschschweiz",g:["neu-umbau","renovation"],project:"hotel-gewoelbe",
  text:"Ausbau eines Naturstein-Gewölbes zu Bar und Lounge: Bartheke, Beleuchtung, Boden, Sitznischen. Gastroausbau mit Rücksicht auf die historische Substanz."},
 {id:"schlafzimmer-paneele",img:"img/atlant-bed.jpg",t:"Schlafzimmer, Holzpaneele",loc:"Referenzprojekt",g:["maler","renovation"],project:"atlant-komplettausbau",
  text:"Schlafzimmer mit Holzpaneel-Wand, indirekter Beleuchtung und Klimagerät. Wände gespachtelt und gestrichen, Einbauten nach Ausführungsplan."},
 {id:"naturstein-wandeinbau",img:"img/bath-green2.jpg",t:"Naturstein, Wandeinbau",loc:"Zürich",g:["fliesen","sanitaer"],project:"objektbad-gruener-marmor",
  text:"Wand-WC und Dusche im grünen Marmor, Einbauschrank mit Spiegelfront. Vorwandinstallation, Abdichtung im Verbund, Platten grossformatig verlegt."},
 {id:"entkernung",img:"img/before-demo.jpg",t:"Entkernung vor Ausbau",loc:"Zürich",g:["abbruch"],
  text:"Wohnung bis auf den Rohbau zurückgebaut: Böden, Wände, Installationen. Sortenrein getrennt, mit Wiegeschein entsorgt, besenrein an den Ausbau übergeben."},
 {id:"trennwaende-rohbau",img:"img/before-drywall.jpg",imgs:["img/kitchen-walnut.jpg","img/process-drywall.jpg"],t:"Trennwände, Rohbau",loc:"Zürich",g:["abbruch","neu-umbau"],
  text:"Neuer Grundriss in Trockenbau: Ständerwände, Vorsatzschalen, Leitungsführung für Sanitär und Elektro. Zwischenstand vor Spachtelung und Bodenaufbau."},
 {id:"kueche-klassisch",img:"img/kitchen-classic.jpg",imgs:["img/kitchen-classic2.jpg"],t:"Klassische Küche",loc:"Zürich",g:["renovation","neu-umbau"],
  text:"Küche mit weissen Rahmenfronten, Einbaugeräten und dunkler Steinabdeckung. Altküche ausgebaut, Anschlüsse angepasst, neue Küche montiert."},
 {id:"ankleide",img:"img/atlant-wardrobe.jpg",t:"Begehbare Ankleide",loc:"Referenzprojekt",g:["neu-umbau"],project:"atlant-komplettausbau",
  text:"Begehbarer Schrank mit Glasfronten und dunklem Furnier. Raum aus dem bestehenden Grundriss abgetrennt, Beleuchtung integriert."},
 {id:"ladenbau-rundboegen",img:"img/salon-arch.jpg",t:"Ladenbau, Rundbögen",loc:"Deutschschweiz",g:["maler","neu-umbau"],project:"salon-fitout",
  text:"Rundbogen-Durchgänge in Trockenbau, Wände in tiefem Rot, Messingdetails. Teil des Salon-Fit-outs."},
 {id:"vorraum-einbau",img:"img/atlant-hall.jpg",t:"Vorraum mit Einbauschränken",loc:"Referenzprojekt",g:["neu-umbau","maler"],project:"atlant-komplettausbau",
  text:"Eingangsbereich mit Einbauschränken, Sitzbank und Wandgestaltung. Schränke nach Mass, Wände gespachtelt und gestrichen, Boden durchgehend."},
 {id:"kueche-dunkel",img:"img/kitchen-dark.jpg",t:"Küche, dunkle Fronten",loc:"Zürich",g:["neu-umbau","renovation"],
  text:"Küche mit dunklen Fronten, Steinabdeckung und Beleuchtung in der Deckennische. Abgehängte Decke, Anschlüsse neu."},
 {id:"kueche-weiss",img:"img/kitchen-white.jpg",t:"Küche, weiss",loc:"Zürich",g:["renovation"],
  text:"Küchenzeile mit weissen Fronten und Lichtband in der Decke. Typischer Umfang einer Leerwohnungs-Renovation: Küche, Anstrich, Boden."},
 {id:"kuechenzeile-holz",img:"img/living-walnut.jpg",t:"Küchenzeile, Holz und Stein",loc:"Zürich",g:["renovation","fliesen"],
  text:"Küchenzeile mit Holzfronten, Lamellenwand und Steinabdeckung. Rückwand und Abdeckung aus einem Stück."},
 {id:"gewerbe-kuechenzeile",img:"img/office.jpg",t:"Gewerbefläche, Teeküche",loc:"Zürich",g:["neu-umbau","renovation"],
  text:"Teeküche mit Insel in einer Gewerbefläche: Fronten in Holz und Weiss, Steinabdeckung, Boden in Fischgrat."},
];
const workById=id=>WORKS.find(w=>w.id===id)||null;
const workByImg=src=>WORKS.find(w=>w.img===src||(w.imgs||[]).includes(src))||null;

/* ---------- Fallstudien ---------- */
const PROJECTS=[
 {slug:"atlant-komplettausbau",title:"WHK Atlant — Komplettausbau",sub:"Wohnungs-Komplettausbau, 47 m², 6 Räume — von der Planung bis zur schlüsselfertigen Übergabe.",
  loc:"Referenzprojekt",cover:"img/atlant-kitchen.jpg",
  gallery:["img/atlant-living.jpg","img/atlant-kitchen2.jpg","img/atlant-bath.jpg","img/atlant-bed.jpg","img/atlant-wardrobe.jpg","img/atlant-hall.jpg"],
  facts:[["47","m² Wohnfläche"],["6","Räume komplett"],["6","Gewerke"],["1","Ansprechpartner"]],
  gewerke:["Planung & Ausführungspläne","Rückbau & Trennwände","Unterlagsboden & Fussbodenheizung","Sanitär SIA-konform","Elektro & Beleuchtung","Küche, Bad, Einbauten"],
  story:{
   ausgangslage:"Eine Wohnung mit 47 m² und altem Grundriss: kleine Räume, Leitungen am Ende ihrer Lebensdauer, kein Stauraum. Der Eigentümer wollte einen offenen Wohnraum, ein neues Bad, eine begehbare Ankleide und einen festen Übergabetermin — aus einer Hand.",
   loesung:"BauStern hat Design, Ausführungspläne und Bau übernommen. Ablauf: Planung → Rückbau bis auf den Rohbau → neue Trennwände in Trockenbau → Sanitär, Elektro und Heizung mit Fussbodenheizung → Böden, Platten, Maler → Küche, Bad und Einbauten → Übergabe.",
   ergebnis:"Sechs Räume, schlüsselfertig übergeben: offener Wohn- und Essbereich, grifflose Küche mit Naturstein-Rückwand, Bad mit Walk-in-Dusche, Schlafzimmer mit Holzpaneelen, Ankleide, Vorraum mit Einbauschränken. Abnahme per Protokoll."},
  related:["kueche-grifflos","wohnraum-offen","bad-walk-in","schlafzimmer-paneele","ankleide","vorraum-einbau"]},
 {slug:"objektbad-gruener-marmor",title:"Objektbad — Grüner Marmor und Messing",sub:"Badsanierung mit grossformatigem Naturstein, Walk-in-Dusche und Wandeinbau.",
  loc:"Zürich",cover:"img/bath-green.jpg",gallery:["img/bath-green.jpg","img/bath-green2.jpg"],
  facts:[["1","Ansprechpartner"],["3–4","Wochen Vollsanierung"],["2","Gewerke"],["24","Monate Werkgarantie"]],
  gewerke:["Rückbau","Sanitär SIA-konform","Abdichtung im Verbund","Naturstein grossformatig","Vorwandinstallation"],
  story:{
   ausgangslage:"Ein älteres Bad mit alten Leitungen, Badewanne und kleinteiligen Platten. Gewünscht: eine bodenebene Dusche, Naturstein und Stauraum in der Wand.",
   loesung:"Vollsanierung: Rückbau bis auf den Rohbau, neue Wasser- und Abwasserleitungen mit Druckprüfung, Vorwandinstallation für WC und Nische, Abdichtung im Verbund, grossformatige Marmorplatten, Armaturen in Messing.",
   ergebnis:"Ein dichtes, dokumentiertes Bad in drei bis vier Wochen. Prüfprotokoll und Fotos der Leitungen vor dem Schliessen liegen beim Eigentümer."},
  related:["objektbad-marmor","naturstein-wandeinbau","bad-walk-in"]},
 {slug:"salon-fitout",title:"Fit-out Coiffure-Salon",sub:"Ladenbau mit Empfangstheke in Marmor, Rundbögen und Messingdetails.",
  loc:"Deutschschweiz",cover:"img/salon-recep.jpg",gallery:["img/salon-recep.jpg","img/salon-chairs.jpg","img/salon-arch.jpg"],
  facts:[["3","Gewerke"],["1","Ansprechpartner"],["Fix","Eröffnungstermin"],["24","Monate Werkgarantie"]],
  gewerke:["Rückbau","Trockenbau & Rundbögen","Malerarbeiten","Empfangstheke Marmor/Messing","Sanitär Waschplätze"],
  story:{
   ausgangslage:"Eine leere Ladenfläche sollte zu einem Coiffure-Salon mit Empfang, Arbeitsplätzen und Waschplätzen werden — mit festem Eröffnungstermin.",
   loesung:"Rundbogen-Durchgänge in Trockenbau, Wände in tiefem Rot, Empfangstheke in Marmor mit Messingkante, Spiegel und Beleuchtung nach Plan des Innenarchitekten. Sanitäranschlüsse für die Waschplätze.",
   ergebnis:"Übergabe zum Eröffnungstermin, gereinigt und ohne Werkzeug."},
  related:["salon-empfang","ladenbau-rundboegen"]},
 {slug:"hotel-gewoelbe",title:"Hotel — Zimmer in Serie und Gewölbe-Bar",sub:"Serien-Sanierung von Hotelzimmern und Ausbau eines Naturstein-Gewölbes zu Bar und Lounge.",
  loc:"Deutschschweiz",cover:"img/hotel-vault.jpg",gallery:["img/hotel-room.jpg","img/hotel-room2.jpg","img/bar-vault.jpg","img/hotel-vault.jpg"],
  facts:[["4","Gewerke"],["Betrieb","lief weiter"],["1","Ansprechpartner"],["24","Monate Werkgarantie"]],
  gewerke:["Renovation in Serie","Malerarbeiten","Böden","Gastroausbau Gewölbe","Beleuchtung"],
  story:{
   ausgangslage:"Ein Hotel im laufenden Betrieb: Zimmer mit abgenutzten Böden und Wänden, dazu ein ungenutzter Gewölbekeller. Ziel: Zimmer etagenweise erneuern und den Keller als Bar bewirtschaften.",
   loesung:"Zimmer in Serie — gleiche Materialien, gleiche Abläufe, etagenweise gesperrt. Im Gewölbe: Bartheke, Sitznischen, Boden und Beleuchtung mit Rücksicht auf die Natursteinsubstanz.",
   ergebnis:"Zimmer nach Etappen wieder buchbar, Gewölbe-Bar eröffnet."},
  related:["hotelzimmer-serie","gewoelbekeller-bar"]},
];
const projectBySlug=s=>PROJECTS.find(p=>p.slug===s)||null;

/* ---------- Etappen (Signatur-Sektion) ---------- */
/* Startseite v6 — «Die Wohnung ist die Seite» (SPEC-v6.md). Kader img/film/f/fNNNN.webp, 8 fps.
   scenes[i]: f = Kader, an dem die Kamera im Raum hält; fin = Kader, ab dem die Fahrt in diesen Raum beginnt (= Halt der Vorszene);
   hot[] = Hotspots mit Position in % des 16:9-Kaders (x,y), Label, 2 Zeilen, Ziel; sheet = Blatt danach (Typ = Übergang).
   still9 = 9:16-Standbild für Telefon. Werte f/fin werden nach dem Schnitt gesetzt (buildfilm.py). */
/* v15 (15.09.): FILM_V13 = Zürcher Altbau (Kader f13, Stills s13) — nur noch Rollback (`?film=13`). Aktiv ist FILM_V15 «Berghaus» unten. */
const FILM_V13={
 /* v10 — Kader aus dem 1080p-Master (pipeline.sh): 12 fps × 6 Clips = 576 Kader. dir2 = 1920 (Retina, DPR ≥ 1.5 und ≥ 1400 px),
    dir = 1280, dirLow = 960 (schwache Geräte / Sofort-Platzhalter). Eröffnung + Kamerafahrten laufen als 60-fps-Video (video{}),
    die Kader dienen dem manuellen Scrubben und als Haltekader (gleicher Master → kein Versatz). */
 dir:'img/film/f13/',dir2:'img/film/f13h/',dirLow:'img/film/f13l/',frames:576,pad:4,ext:'.webp',poster:'img/film/poster-v13.jpg',stillDir:'img/film/s13/',hdHolds:true,
 introVideo:'img/film/r13/intro.h264.mp4',
 introSources:{base:'img/film/r13/intro',codecs:['av1','hevc','h264'],hold:'img/film/intro-hold-v13.jpg',dur:3.4},
 /* r1: echte RIFE-NCNN/Vulkan-Zwischenbilder statt minterpolate; neue immutable URLs vermeiden Cache-Mischung. */
 video:{dir:'img/film/r13/',codecs:['av1','h264'],flyDur:2.2},
 mobileVideo:{dir:'img/film/m3/',portraitDir:'img/film/m3p/',fps:60,fallbackDir:'img/film/m3l/',fallbackPortraitDir:'img/film/m3lp/'},
 introEnd:95,   /* Eröffnung: Kader 0..introEnd spielen einmal automatisch (Clip C1) */
 /* Block 1 (v7 — Scroll-Scrub statt Zeit-Tween): roomVh = Scrollweg pro Raum in Viewport-Höhen.
    Jeder Raum ist in zwei Zonen geteilt: camFrac (0..camFrac der Raum-Scrollstrecke) = Kamerafahrt
    zur nächsten Szene, Rest = "Verweilzone" (Scroll wirkt "fest", Drift + Hotspots aktiv). room0Vh
    ist kleiner: Raum 0 spielt den Eröffnungsclip automatisch beim Laden ab (nicht scrollgetrieben).
    Block 4 (v8, 2 Runden Nutzer-Feedback): roomVh/camFrac gelten GLOBAL für jeden Raumwechsel
    (Küche→Flur, Flur→Bad, Bad→Schlaf, Schlaf→Wohnen, Wohnen→Rückblende, Rückblende→Eingang) — es
    gibt keine Pro-Szene-Overrides, ein zu kurzer/langer Wert betrifft also IMMER alle Räume gleich.
    Runde 1: roomVh 2.8/camFrac .3 → Verweilzone 65% von 2.8vh (~1.8 Bildschirmhöhen Leerscrollen
    nach der Kamerafahrt) = "Seite hängt"-Gefühl (Bug #6). Auto-Scroll dagegen wurde probiert und
    abgelehnt ("sieht nicht gut aus, Raum fliegt zu schnell vorbei") — bewusst wieder entfernt.
    Runde 2: roomVh 1.8/camFrac .55 → Verweilzone auf 45% von 1.8vh (~0.8 Bildschirmhöhen) gekürzt,
    das war zu knapp: "fast kein Stopp-Kader, um sich den Raum anzusehen". Runde 3 (aktuell): Ziel
    ~0.95vh Kamerafahrt (weiterhin ruhig) + ~1.15vh echte Verweilzone (genug, um den Raum wirklich
    anzusehen, bevor es weitergeht) — Mittelweg zwischen "hängt" und "rauscht durch". */
 /* v9.2 — Kamerafahrt (film.js «Stationen»):
      flyMode 'hybrid' (Variante C, Standard): langsame Geste = Scrubbing (Kamera folgt der Hand, Einrasten auf 0/CAM bei Stillstand),
                       schneller Wisch (> flyFast px Wheel-Summe in 120 ms) = Autopilot: Fahrt in flyDur s, gesperrt gegen Eingaben,
                       danach steht die Seite, bis eine NEUE Geste kommt (Trackpad-Trägheit wird geschluckt).
              'auto'   = immer Autopilot.   'scrub' = nie Autopilot (Verhalten bis v9). */
 flyMode:'hybrid',
 flyDur:2.2,
 flyFast:380,
 roomVh:2.1,
 room0Vh:1.2,
 camFrac:.45,
 /* Block 1 (1.6): Struktur der .w-sheet-Blätter ist auf zwei Layout-Modi vorbereitet.
    'interleaved' (aktuell, unverändert) — jedes Blatt folgt direkt auf seinen Raum, liegt visuell ALS
    Overlay auf dem fixierten Film (dieser ist bereits CSS position:fixed, die Blätter scrollen einfach
    darüber und decken ihn nach cover() ab) — das erfüllt "Overlay-Slides über dem Pin" schon strukturell.
    'sequential' — alle Räume zuerst, alle Blätter danach als normale Sektionen: siehe Kommentar bei
    #wFlow in pages.js/pHome() für den vorbereiteten Umschaltpunkt (flex 'order' pro Element). Umschalten
    hier setzen, NICHT die Reihenfolge im Template selbst verändern. */
 sheetMode:'interleaved',
 /* v14 — Vertikaler Schnitt fürs Telefon (js/film-mobile-v2.js, css/mobile-film-v2.css). enabled:false = das bisherige
    film-mobile.js bleibt aktiv; `?mv2=1` in der URL erzwingt v2 zum Testen, `?mv2=0` erzwingt v1. Nativer Scroll ohne Sperre:
    Kamera folgt dem Finger (Kader-Scrub wie Desktop), keine Pfeile/Fortschritt/Replay, Pins auf dem Bild statt Chips.
    roomVh/camFrac gelten NUR für v2: ~0.85 Bildschirmhöhen Fahrt + ~1.05 Verweilzone je Raum. */
 mobileV2:{enabled:true,roomVh:1.9,room0Vh:1.15,camFrac:.45,snap:true,pinStagger:.32,pinsMax:3,
   /* Pan-Scan (solange portrait.enabled=false): Fokus 0..1 = Anteil der Bildbreite, der im Hochkant-Ausschnitt mittig steht.
      from = Fokus zu Beginn der Fahrt IN diese Szene, to = Haltefokus. Die Fahrt schwenkt also seitlich mit — der Betrachter sieht
      über den Scrollweg mehr vom breiten Bild als ein fester Ausschnitt zeigen könnte. */
   pan:{kueche:{from:.62,to:.54},flur:{from:.5,to:.5},bad:{from:.55,to:.36},schlaf:{from:.5,to:.5},wohnen:{from:.4,to:.48},rohbau:{from:.5,to:.5},eingang:{from:.62,to:.5}}},
 /* v14 — Portrait-Assets (core/sources/sprintD/PROMPTS-v2.md §0). enabled:false, bis fp14/s14p/mat6p vorliegen; dann true —
    v2 benutzt Hochkant-Kader/Standbilder ohne Pan-Scan. hotP:[{x,y}] pro Szene (in data scenes[]) überschreibt die
    automatische Umrechnung der 16:9-Pins in den Portrait-Ausschnitt, sobald die Portrait-Bilder gesichtet sind. */
 /* 15.09: s14p = Outpainting (Nano Banana 2 in Flow, 2K → 1080×1920 + LUT) für st0–st4, st6. dir/matDir bleiben null, bis Portrait-Kader
    (fp14) und mat6p existieren — bis dahin Pan-Scan-Kader mit Überblendung ins hochkante Haltebild (film-mobile-v2.js). */
 portrait:{enabled:true,stillDir:'img/film/s14p/',dir:null,matDir:null,videoDir:'img/film/mp14/',w:540,h:960},
 /* v14 — Ankunft (neue Szene 0: Fassade in der Dämmerung → Haustür öffnet sich → Wohnung). enabled:false, bis r14/s14/s14p
    vorliegen (PROMPTS-v2 §C). film-mobile-v2.js hängt die Szene vor die Küche (Intro = ankunft-Video, Halt = *-hold, Übergang
    «flash» → Kader 0 → Fahrt in die Küche). Desktop (film.js full): gleiche Szene als Prolog vor Kader 0 — HANDOFF §10.3. */
 /* 15.09: Assets aus Flow (Nano Banana 2 + Veo): Fassade zu/offen in beiden Orientierungen, 8-s-Clip Fassade → Tür öffnet → Kamera
    tritt ins Treppenhaus; hold = LETZTER Videokader (Treppenhaus), nicht das «Tür offen»-Standbild. Telefon (v2) aktiv; Desktop s. HANDOFF §10.3. */
 ankunft:{enabled:true,id:'ankunft',room:'ankunft',navLabel:'Ankunft',kicker:'Zürich · Deutschschweiz',h:'Bauen mit System und <em>Vertrauen.</em>',
   d:'Ihr Umbau. Klar geplant und sauber umgesetzt — bis zur Schlüsselübergabe.',
   still:'img/film/s14/st-ankunft.jpg',stillP:'img/film/s14p/st-ankunft.jpg',hold:'img/film/s14/ankunft-hold.jpg',holdP:'img/film/s14p/ankunft-hold.jpg',
   video:{base:'img/film/r14/ankunft',codecs:['h264'],portrait:'img/film/mp14/ankunft.mp4',dur:8},
   hot:[{x:50,y:60,t:'Ein Haus wie Ihres',l:['Zürcher Altbau — Eiche, Messing, Stuck','Wir arbeiten im bewohnten Haus: sauber, leise, angemeldet'],go:'leistungen/renovation'}],
   hotP:[{x:44,y:58}],
   /* Die Küche gibt die Haupt-Headline an die Ankunft ab und bekommt eine eigene: */
   kuecheKicker:'Gewerk 03 · Küche & Ausbau',kuecheH:'Sechs Gewerke, <em>eine</em> Küche.'},
 scenes:[
  {id:'kueche',f:95,room:'kueche',navLabel:'Küche',kicker:'Sechs Gewerke · ein Ansprechpartner',rot:['für Hausverwaltungen','für Generalunternehmer','für Gewerbe & Ladenbau','für Eigentümer'],h:'Bauen mit System und <em>Vertrauen.</em>',
   d:'Ihr Umbau. Klar geplant und sauber umgesetzt — bis zur Schlüsselübergabe.',
   hero:true,
   /* Block 3 (3.1): Kennzahlen nicht mehr als eigener dunkler Balken (.w-sheet--band) danach, sondern als
      3 Overlay-Zähler direkt im Kader-Pin — dieselbe .w-counters-Mechanik, die die 'wohnen'-Szene unten
      schon nutzt (fillScene() in film.js baut sie automatisch, sobald counters[] gesetzt ist). */
   counters:[["6","","Gewerke aus einer Hand"],["24","h","Antwort an Werktagen"],["100","%","Deutschschweiz abgedeckt"]],
   /* hotP: Pin-Koordinaten in Prozent des hochkanten Standbilds s14p/st0.jpg (v14 Telefon), Reihenfolge = hot[] */
   hotP:[{x:47,y:62},{x:74,y:44},{x:58,y:24}],
   hot:[{x:47,y:84,t:'Schreiner trifft Metall',l:['Tischfuss Messing, gebürstet','Zwei Gewerke, ein Ansprechpartner'],go:'leistungen/neu-umbau'},
        {x:69,y:22,t:'Weniger Fugen, mehr Ruhe',l:['Rückwand 120 × 60 cm, Terrazzo','Fliesen & Parkett, fugenarm verlegt'],go:'leistungen/fliesen-parkett'},
        {x:57,y:9,t:'Licht, das mitdenkt',l:['Stromschienen, Spots, Steuerung','Koordination mit dem Elektriker'],go:'leistungen/renovation'}]},
  {id:'flur',f:191,clip:'c2-flur',room:'flur',navLabel:'Flur',kicker:'Ein Ansprechpartner',h:'Sechs Gewerke. <em>Ein</em> Ansprechpartner.',
   d:'Sie sprechen mit einer Person — wir koordinieren alle Gewerke, Termine und Nachweise.',chips:true,
   /* v8.3 Bauplan (Desktop): die sechs Gewerke als Massketten auf dem Kader — Punkt im Bild -> Linie -> Label.
      x/y = Punkt, lx/ly = Label-Anker (Kaderprozent, wie Hotspots), side = Laufrichtung der Masslinie,
      d = Stagger-Versatz im Reveal. Fakten sind die bestehenden Hotspot-/SVC-Texte, nichts Neues erfunden.
      Auf dem Telefon (lite) bleiben die Chips. */
   /* v10 — Bauplan-Choreografie: nach der Ankunft zeichnet sich EIN Held (hero) zuerst mit Spot und Offer, die übrigen
      fünf folgen gestaffelt (d = Sekunden nach Ankunft, film.js setzt .seq) und bleiben gedimmt, bis man sie berührt. */
   offer:'Leerwohnung in 14 Tagen — Festpreis',
   ann:[
    {no:'01',t:'Renovation',        go:'leistungen/renovation',      x:57,y:14,lx:62,ly:28,side:'r',d:0,   hero:true,f:'Leerwohnungs-Renovation, Objektbäder, Ausbau von Gewerbeflächen — im Bauzeitplan'},
    {no:'06',t:'Malerarbeiten',     go:'leistungen/malerarbeiten',   x:27,y:40,lx:29,ly:22,side:'r',d:.9,  f:'Spachtelung Q3, 2 × gestrichen — Abnahme bei Tageslicht'},
    {no:'03',t:'Neu- & Umbau',      go:'leistungen/neu-umbau',       x:57,y:47,lx:72,ly:42,side:'r',d:1.25,f:'Trockenbau, Türen, Zargen — statisch geprüft'},
    {no:'02',t:'Sanitär',           go:'leistungen/sanitaer',        x:72,y:62,lx:74,ly:60,side:'r',d:1.6, f:'Serienbäder, Wasserinstallation, Boiler — SIA-konform, mit Protokoll'},
    {no:'05',t:'Fliesen & Parkett', go:'leistungen/fliesen-parkett', x:50,y:90,lx:58,ly:82,side:'r',d:1.95,f:'Eiche Landhausdiele, geölt — Unterlagsboden schwimmend verlegt'},
    {no:'04',t:'Abbruch & Rückbau', go:'leistungen/abbruch-rueckbau',x:64,y:97,lx:72,ly:90,side:'r',d:2.3, f:'Entkernung, selektiver Rückbau — sortenrein, mit Wiegeschein'}
   ],
   hotP:[{x:30,y:48},{x:50,y:70},{x:60,y:22}],
   hot:[{x:38,y:46,t:'Geprüft, nicht geschätzt',l:['Neu- & Umbau, statisch geprüft','Trockenbau, Türen, Zargen'],go:'leistungen/neu-umbau'},
        {x:50,y:88,t:'Läuft ruhig, hält lange',l:['Eiche Landhausdiele, geölt','Unterlagsboden schwimmend verlegt'],go:'leistungen/fliesen-parkett'},
        {x:46,y:9,t:'Keine Schatten, geprüft',l:['Spachtelung Q3, 2 × gestrichen','Abnahme bei Tageslicht'],go:'leistungen/malerarbeiten'}],
   sheet:{type:'up',key:'promises'}},
  {id:'bad',f:287,clip:'c3-bad',room:'bad',navLabel:'Bad',kicker:'Gewerk 03 · Sanitär',h:'Bad und Leitungen, <em>SIA-konform.</em>',
   /* Kein before/beforeCap hier: das einzige verfügbare Baustellenfoto (before-drywall.jpg) zeigt ein
      fremdes Zimmer mit grossem Fenster, nicht das Bad — mit echtem Vorher-Foto dieses Bads nachrüsten. */
   d:'Bäder, Küchenanschlüsse, Steigleitungen — Notfall-Einsatz am gleichen Tag.',
   /* Die Raumgeometrie bewegt sich nur als Ganzes. Ein ausgeschnittener Waschtisch über
      demselben Hintergrund erzeugte doppelte Konturen und wurde entfernt. */
   layers:[],
   hotP:[{x:12,y:52},{x:76,y:40},{x:56,y:70}],
   hot:[{x:19,y:52,t:'Dicht nach Norm',l:['Sanitär nach SIA 385/1','Nicht nach Gefühl, sondern geprüft'],go:'leistungen/sanitaer'},
        {x:76,y:32,t:'Grossformat, kaum Fugen',l:['Travertin 120 × 60','Verbundabdichtung inklusive'],go:'leistungen/fliesen-parkett'},
        {x:56,y:88,t:'Keine Schwelle',l:['Gefälle & Rinne, SIA 271','Kein Rutschen, kein Wasser aussen'],go:'leistungen/sanitaer'}],
   sheet:{type:'grow',key:'estimate',from:{x:22,y:50}}},
  {id:'schlaf',f:383,clip:'c4-schlaf',room:'schlaf',navLabel:'Schlafzimmer',kicker:'Gewerk 05 · Malerarbeiten',h:'Zum Schluss die <em>Oberfläche.</em>',
   d:'Spachteln, Grundieren, Streichen — Abnahme bei Tageslicht.',
   hotP:[{x:12,y:44},{x:50,y:36},{x:88,y:50}],
   hot:[{x:8,y:36,t:'Abnahme bei Tageslicht',l:['Spachtelung Q3, 2 × Streichen','Keine Schatten, keine Nacharbeit'],go:'leistungen/malerarbeiten'},
        {x:50,y:22,t:'Holz, das leuchtet',l:['Riffelpaneel Eiche, hinterleuchtet','Koordination im Bauzeitplan'],go:'leistungen/neu-umbau'},
        {x:88,y:46,t:'Kein Zug, kein Schimmel',l:['Dicht, gedämmt, sauber verputzt','Renovation aus einer Hand'],go:'leistungen/renovation'}],
   sheet:{type:'split',key:'works'}},
  {id:'wohnen',f:479,clip:'c5-wohnen',room:'wohnen',navLabel:'Wohnen',kicker:'Gewerk 01 · Renovation',h:'Renovation aus <em>einer</em> Hand.',
   d:'Leerwohnung, Objektbad, Gewerbefläche — Beginn und Übergabe stehen im Werkvertrag.',counters:[["47","","m² Wohnfläche"],["6","","Räume komplett"],["100","%","schlüsselfertig"]],
   hotP:[{x:50,y:47},{x:12,y:42},{x:86,y:36}],
   hot:[{x:44,y:50,t:'Drei Gewerke im Takt',l:['Nussbaum-Insel mit Steinabdeckung','Schreiner, Sanitär, Elektro synchron'],go:'projekt/atlant-komplettausbau'},
        {x:10,y:38,t:'Mass statt Möbelhaus',l:['Einbauschrank Nussbaum, Geräte integriert','Schreiner & Elektro koordiniert'],go:'leistungen/malerarbeiten'},
        {x:90,y:40,t:'Bis zum letzten Vorhang',l:['Vorhänge, Schienen, Montage','Teil der Renovation, kein Nachtrag'],go:'leistungen/renovation'}],
   sheet:{type:'cards',key:'case'}},
  {id:'rohbau',f:479,img:'img/film/mat2/before.webp',compareImg:'img/film/s13/st-flash-after.jpg',compareImgP:'img/film/s13/st-flash-after-p.webp',room:'flur',navLabel:'Rückblende',kicker:'Rückblende · Gewerk 04',h:'So hat es <em>angefangen.</em>',
   d:'Entkernung, sortenreine Trennung, Wiegeschein — der erste Tag jedes Projekts.',flash:true,
   /* v10 — Szene «Vorher/Nachher» als Materialisierung B+ (FilmFX.Materialize): in der Verweilzone treibt der Scroll den
      Fortschritt 0..1 (Rohbau → Technik → Ausbau → Möbel+Licht), der Regler scrubbt mit Trägheit. Layer aus board/make-board-assets.py. */
   mat:{dir:'img/film/mat2/',compositeDir:'img/film/mat5/',w:640,h:357,particles:0,before:'before.webp',dusty:'before-dusty.webp',flat:'flat.webp',flatFull:'flat-full.webp',after:'after.webp',technik:'technik.webp',edges:'edges.webp',bloom:'bloom.webp',
        masks:{walls:'m-walls.webp',floor:'m-floor.webp',furniture:'m-furniture.webp',light:'m-light.webp'},mode:'B+',phases:['Rohbau','Technik','Ausbau','Möblierung & Licht']},
   /* Block 3 (3.5): die separate .w-etappen-Mini-Leiste (LAPSE) ist entfernt — sie duplizierte die grosse
      Ablauf-Timeline (STEPS) gleich danach nur mit anderen Etikett-Namen. Ein Timeline, keine zwei. */
   noPinsMobile:true,   /* v14: Materialisierung läuft noch als 16:9-Pan-Scan; Pins dort wären falsch platziert */
   hot:[{x:30,y:42,t:'Entsorgt mit Nachweis',l:['Entkernung, sortenrein getrennt','Wiegeschein als Beleg'],go:'leistungen/abbruch-rueckbau'},
        {x:66,y:40,t:'Geprüft vor dem Verputz',l:['Leitungen neu, mit Druckprobe','Bevor die Wand wieder zu ist'],go:'leistungen/sanitaer'},
        {x:50,y:84,t:'Grundlage, die trägt',l:['Schwimmend verlegt, mit Dämmung','Fliesen & Parkett'],go:'leistungen/fliesen-parkett'}]},
  {id:'eingang',f:575,clip:'c6-eingang',room:'eingang',navLabel:'Eingang',sig:true,kicker:'Abnahme',h:'Abnahme. <em>Schlüsselübergabe.</em>',
   d:'Am vereinbarten Termin, mit Protokoll. Ihr Objekt: gleicher Ablauf.',final:true,
   hotP:[{x:56,y:57},{x:80,y:38}],
   hot:[{x:55,y:73,t:'Schwarz auf weiss',l:['Gemeinsame Abnahme, Raum für Raum','Werkgarantie 24 Monate'],go:'kontakt'},
        {x:89,y:50,t:'Der Termin steht fest',l:['Datum steht im Werkvertrag','Termintreu, ohne Ausreden'],go:'ueber'}],
   sheet:{type:'up',key:'contact'}},
 ]
};
/* ---------- v15 «Berghaus» (core/sources/sprintE/REGISTRY.md) ----------
   EIN Haus in allen Szenen: Lärchen-Glaspavillon auf Sichtbeton-Sockel über dem Nebelmeer. Acht Kapitel, je ein Standbild (2K,
   Nano Banana Pro) + ein 8-s-Clip (Veo 3.1: langsame Fahrt hinein) in BEIDEN Orientierungen — nichts wird beschnitten.
   Kader-Archiv (core/dev/v15-build.js): 7 Kapitel × 96 Kader (12 fps): Kapitel k = f k*96 … k*96+95, Halt = letzter Kader des Clips.
   Ab Kapitel 1 sind die ersten 0.6 s eine Überblendung vom Haltekader des Vorkapitels in das neue Standbild (= erster Kader des Clips).
   Rückblende = Wohnen-Blickwinkel im Rohbau (flash + Vorher/Nachher-Regler), kein eigenes Kapitel im Kaderarchiv.
   Telefon: film-mobile-v2.js mit Hochkant-Kadern fp15 (aus den 9:16-Clips) + Haltebildern s15p, Intro = mp15/intro.mp4. */
const FILM_V15={
 /* v15.2: Kapitel = Übergangsclip (6 fps ≈ 48 Kader, Veo first/last frame, 0.5 s xfade vom Halt) + Quality-Push-in bis holdAt (12 fps).
    f-Werte aus core/dev/v15-frames.json: ankunft 95 · flur 227 · kueche 311 · bad 389 · schlaf 491 · wohnen 569 · eingang 641 → 642 Kader */
 /* v16: Rollback-Diät — f15h (1920) und f15l (960) liegen jetzt unter core/_legacy/v16-removed/ und werden
    nicht mehr ausgeliefert; ?film=15 läuft vollständig auf dem 1280er-Satz f15/ (+ fp15/ hochkant). */
 dir:'img/film/f15/',dir2:null,dirLow:null,frames:642,pad:4,ext:'.webp',poster:'img/film/poster-v15.jpg',stillDir:'img/film/s15/',hdHolds:true,
 introVideo:'img/film/r15/intro.h264.mp4',
 introSources:{base:'img/film/r15/intro',codecs:['h264'],hold:'img/film/intro-hold-v15.jpg',dur:4.7},
 /* keine fwd/rev-Flugvideos (scenes[].clip) — der Autopilot läuft über die Kader (v15.1: ~84–144 je Fahrt → flyDur 3.0 s, ruhiger) */
 video:{dir:'img/film/r15/',codecs:['h264'],flyDur:3.0},
 mobileVideo:{dir:'img/film/r15/',portraitDir:'img/film/mp15/',fps:60,rate:1},
 introEnd:95,
 flyMode:'hybrid',flyDur:3.0,flyFast:380,
 roomVh:2.1,room0Vh:1.2,camFrac:.45,
 sheetMode:'interleaved',
 mobileV2:{enabled:true,roomVh:1.9,room0Vh:1.15,camFrac:.45,snap:true,pinStagger:.32,pinsMax:3,pan:{}},
 /* v15.1: Hochkant-Übergänge (TP) + Push-ins → fp15/ hat dieselben 642 Kader-Indizes wie f15/ → v2 scrubbt 1:1 ohne Pan-Scan.
    Fallback (dir:null): Pan-Scan der 16:9-Kader mit Überblendung in die hochkanten Haltebilder. */
 portrait:{enabled:true,stillDir:'img/film/s15p/',dir:'img/film/fp15/',matDir:null,videoDir:'img/film/mp15/',w:540,h:960},
 ankunft:{enabled:false},   /* v14-Prolog nicht mehr nötig: die Ankunft ist Szene 0 (Intro-Clip) — in beiden Engines */
 /* ---- Etappe 5 «Eine Frage — eine Geste» (PLAN-v16-ETAPPE5.md) -------------------------------------
    S5[id] wird von js/stage5-v16.js gelesen und in film-v16.js nur über scene.mech/scene.q/scene.todo
    berührt. Koordinaten in Prozent der Bühne (#wStage), P = Hochkant (Telefon), L = Querformat (Desktop).
    Neue Polygone/Punkte trassiert man mit ?trace=1 (Klick schreibt {x,y} in die Konsole). */
 s5:{
  /* Etappe 8 §4.1: Die Geste ist weg — sechs Meldungen der Handwerker treffen nacheinander ein und
     sammeln sich von selbst in EINER Nachricht der Bauleitung. Der einzige Knopf ist der Rückruf. */
  flur:{ q:'Wer ist zuständig?', mech:'push',
    todo:{task:'Sechs Offerten einholen und vergleichen', done:'eine.'},
    push:{ notes:[
       {av:'M',t:'Maler',       m:'verpasster Anruf',time:'09:12',s:'Kommen wir Di oder Mi? Gipser noch nicht fertig.'},
       {av:'S',t:'Sanitär',     m:'SMS',             time:'09:40',s:'Armatur nicht lieferbar, Alternative?'},
       {av:'E',t:'Elektro',     m:'verpasster Anruf',time:'10:05',s:'Rechnung 2/6 offen — Rückruf bitte.'},
       {av:'R',t:'Rückbau',     m:'WhatsApp',        time:'10:31',s:'Wiegeschein fehlt für die Mulde.'},
       {av:'P',t:'Plattenleger',m:'verpasster Anruf',time:'11:18',s:'Wer macht die Abdichtung?'},
       {av:'H',t:'Schreiner',   m:'E-Mail',          time:'11:52',s:'Lieferung 3 Wochen verschoben.'}],
      hint:'Sechs Baustellen · eine Nummer',
      final:{k:'Ein Ansprechpartner', t:'BauStern · Bauleitung', time:'gerade eben',
        s:'Alles koordiniert. Nächster Schritt: Aufmass am Freitag, 9:00 — Sie müssen niemanden anrufen.',
        btn:'Rückruf in 5 Min'} } },

  /* Etappe 8 §4.2: keine Polygone mehr — drei Marken mit Gewerk-Zeichen, ein warmes Lichtfeld auf dem
     aktiven Objekt, eine Karte im festen Slot. Koordinaten am Standbild abgelesen (?trace=1). */
  kueche:{ q:'Wer macht was?', mech:'takt',
    todo:{task:'Schreiner, Sanitär und Elektro koordinieren', done:'ein Takt.'},
    takt:{ end:'Drei Gewerke, ein Termin.',
      zones:[
       {t:'Schreiner', icon:'saw', pP:{x:73,y:67}, pL:{x:74,y:70},
        card:{t:'Insel und Fronten.', s:'Räuchereiche, Naturstein — montiert, bevor die Anschlüsse kommen.'}},
       {t:'Sanitär', icon:'tap', pP:{x:33,y:58}, pL:{x:40,y:54},
        card:{t:'Anschlüsse und Armatur.', s:'Kommt, wenn die Insel steht — abgestimmt mit dem Schreiner. Ein Termin, nicht drei.'}},
       /* Sichtprüfung 17.09: die Marke lag auf dem Fensterpfosten statt auf den Messing-Pendeln. */
       {t:'Elektro', icon:'bolt', pP:{x:74,y:24}, pL:{x:64,y:26},
        card:{t:'Pendel, Schienen, Steuerung.', s:'Zuletzt, koordiniert — kein Loch in der fertigen Decke.'}}] } },

  bad:{ q:'Abnahme bei Tageslicht', mech:'dusk',
    todo:{task:'Abdichtung und Normen selbst kontrollieren', done:'protokolliert.'},
    dusk:{ img:'img/film/v16/stills/bad-dusk-', start:38,
      labL:'Tageslicht', labR:'Abend',
      /* Kerzen-Glut: Position der Flammen im ABEND-Bild, Atmung per CSS */
      /* 17.09: am echten Abend-Render (Nano Banana Pro, core/_incoming/v16/bad-dusk_L_2K_20260917.jpeg)
         abgelesen — Kerzen auf dem Wannenrand und je eine am Boden links/rechts. */
      glow:{P:[{x:44,y:62,r:6},{x:56,y:61,r:6},{x:68,y:76,r:6},{x:3,y:76,r:4}],
            L:[{x:22,y:59,r:6},{x:42,y:58,r:6},{x:46,y:73,r:5},{x:23,y:78,r:5}]},
      /* Etappe 8 §4.6: auf dem Telefon kein Ziehen (Konflikt mit dem Wisch) — ein Lichtschalter an der
         linken Wand schaltet Tag/Abend. Desktop behält den Regler. */
      sw:{x:12,y:46}, swOff:'Licht aus', swOn:'Licht an' } },

  /* Etappe 8 §4.3: statt Lichtlinie im Kader eine Bauzeitplan-Karte im festen Slot — jede Zeile ist ein
     Ziel, die aktive klappt auf. Keine Wochen-/Tagesangaben (Vorgabe des Eigentümers), nur f. */
  schlaf:{ q:'Wie läuft es ab?', mech:'ablauf',
    todo:{task:'Handwerker-Termine abstimmen', done:'ein Bauzeitplan.'},
    ablauf:{ active:3, kicker:'Bauzeitplan · 5 Schritte',
      steps:[
       {t:'Anfrage',       f:'Rückruf in 5 Min',      c:'Sie schildern kurz, worum es geht — wir rufen in 5 Minuten zurück'},
       {t:'Besichtigung',  f:'kostenlos, vor Ort',    c:'Aufmass vor Ort, Ist-Zustand mit Fotos dokumentiert'},
       {t:'Offerte',       f:'innert 48 h',           c:'Festpreis-Offerte, Position für Position'},
       {t:'Ausführung',    f:'wöchentliches Update',  c:'Ein Bauleiter, ein Bauzeitplan — Sie bekommen jede Woche ein Update'},
       {t:'Übergabe',      f:'Protokoll + Schlüssel', c:'Gemeinsame Abnahme, Protokoll, Schlüssel'}] } },

  /* Etappe 8 §4.4: Was der Hausverwalter wirklich bekommt — das wöchentliche Update als Nachricht.
     Dazu die Rückblende als Geste (Halten) statt als eigenes Kapitel. */
  wohnen:{ q:'Wie bleibt es?', mech:'feed',
    todo:{task:'Wöchentlich auf die Baustelle', done:'wöchentliches Update.'},
    feed:{ kicker:'Wochen-Update · Baustelle', sender:'BauStern · Bauleitung',
      hold:'Halten — wie war es vorher?',
      weeks:[
       {w:'Woche 1', t:'Rückbau abgeschlossen, Leitungen neu.', s:'Nächste Woche: Boden.',
        imgs:['w1-1.jpg','w1-2.jpg']},
       {w:'Woche 2', t:'Boden verlegt, Decke geschlossen.',     s:'Nächste Woche: Einbauten.',
        imgs:['w2-1.jpg','w2-2.jpg']},
       {w:'Woche 3', t:'Einbauten montiert.',                   s:'Abnahme Freitag, 14:00.',
        imgs:['w3-1.jpg','w3-2.jpg','w3-3.jpg']}] },
    rueck:{ img:'img/film/v16/stills/wohnen-rohbau-', lab:'Vor 4 Monaten · Halten' } },

  /* Etappe 8 §4.5: Frist, Versprechen und Unterschrift sind EIN Objekt — das Übergabeprotokoll. */
  eingang:{ q:'Wann geht es los?', mech:'clock',
    todo:{done:'Ihre Liste: leer.', tail:'Ein Anruf genügt.'},
    clock:{ kicker:'Übergabeprotokoll', sub:'Anfrage jetzt', pre:'Offerte bis',
      versprechen:['Offerte innert 48 h','Ein Ansprechpartner — bis zum Schlüssel','Nach Norm — SIA, mit Protokoll','Termin im Werkvertrag · 24 Mt. Garantie'],
      btnOffer:'Offerte anfragen', btnCalc:'Richtpreis berechnen' } }
 },
 scenes:[
  {id:'ankunft',f:95,room:'ankunft',navLabel:'Ankunft',kicker:'Zürich · Deutschschweiz',rot:['für Hausverwaltungen','für Generalunternehmer','für Gewerbe & Ladenbau','für Eigentümer'],h:'Bauen mit System und <em>Vertrauen.</em>',
   d:'Ihr Umbau. Klar geplant und sauber umgesetzt — bis zur Schlüsselübergabe.',
   hero:true,
   counters:[["6","","Gewerke aus einer Hand"],["24","h","Antwort an Werktagen"],["100","%","Deutschschweiz abgedeckt"]],
   /* Etappe 5 §7: der Stecknadel-Text lag auf dem Kicker — hoch auf die Fassade, links, damit die
      Sprechblase im Kader bleibt. */
   hotP:[{x:30,y:24}],
   hot:[{x:42,y:52,t:'Ein Haus, ein Ansprechpartner',l:['Sichtbeton, Lärche, Glas — sechs Gewerke, ein Werkvertrag','Beginn und Übergabe stehen schriftlich fest'],go:'leistungen/renovation'}]},
  {id:'flur',f:227,room:'flur',navLabel:'Schwelle',kicker:'Ein Ansprechpartner',h:'Sechs Gewerke. <em>Ein</em> Ansprechpartner.',
   d:'Sie sprechen mit einer Person — wir koordinieren alle Gewerke, Termine und Nachweise.',chips:true,
   offer:'Leerwohnung in 14 Tagen — Festpreis',
   /* Bauplan-Massketten (Desktop) auf dem Haltekader der Galerie: Glas links, Beton rechts, Lärchendecke, Eichenboden */
   ann:[
    {no:'01',t:'Renovation',        go:'leistungen/renovation',      x:52,y:52,lx:58,ly:40,side:'r',d:0,   hero:true,f:'Leerwohnungs-Renovation, Objektbäder, Ausbau von Gewerbeflächen — im Bauzeitplan'},
    {no:'06',t:'Malerarbeiten',     go:'leistungen/malerarbeiten',   x:84,y:40,lx:86,ly:26,side:'r',d:.9,  f:'Spachtelung Q3, 2 × gestrichen — Abnahme bei Tageslicht'},
    {no:'03',t:'Neu- & Umbau',      go:'leistungen/neu-umbau',       x:60,y:14,lx:66,ly:8,side:'r',d:1.25,f:'Trockenbau, Türen, Zargen — statisch geprüft'},
    {no:'02',t:'Sanitär',           go:'leistungen/sanitaer',        x:22,y:60,lx:12,ly:72,side:'l',d:1.6, f:'Serienbäder, Wasserinstallation, Boiler — SIA-konform, mit Protokoll'},
    {no:'05',t:'Fliesen & Parkett', go:'leistungen/fliesen-parkett', x:48,y:86,lx:54,ly:92,side:'r',d:1.95,f:'Eiche Landhausdiele, geölt — Unterlagsboden schwimmend verlegt'},
    {no:'04',t:'Abbruch & Rückbau', go:'leistungen/abbruch-rueckbau',x:30,y:30,lx:18,ly:18,side:'l',d:2.3, f:'Entkernung, selektiver Rückbau — sortenrein, mit Wiegeschein'}
   ],
   hotP:[{x:70,y:40},{x:50,y:78},{x:56,y:16}],
   hot:[{x:76,y:40,t:'Geprüft, nicht geschätzt',l:['Sichtbeton, statisch geprüft','Trockenbau, Türen, Zargen'],go:'leistungen/neu-umbau'},
        {x:48,y:84,t:'Läuft ruhig, hält lange',l:['Eiche Landhausdiele, geölt','Unterlagsboden schwimmend verlegt'],go:'leistungen/fliesen-parkett'},
        {x:56,y:12,t:'Licht in der Decke',l:['Lärchenlamellen, Lichtlinie integriert','Koordination mit dem Elektriker'],go:'leistungen/malerarbeiten'}],
   sheet:{type:'up',key:'promises'}},
  /* f = Halt bei 3.0 s des Clips (Kader 192+36): die Insel noch im Bild; die restliche Fahrt ans Fenster gehört zur Kamerafahrt ins Bad */
  {id:'kueche',f:311,room:'kueche',navLabel:'Küche',kicker:'Gewerk 03 · Küche & Ausbau',h:'Sechs Gewerke, <em>eine</em> Küche.',
   d:'Schreiner, Sanitär, Elektro — im Takt, aus einer Hand.',
   hotP:[{x:26,y:66},{x:64,y:44},{x:24,y:32}],
   hot:[{x:42,y:64,t:'Schreiner trifft Stein',l:['Insel Räuchereiche, Abdeckung Naturstein','Zwei Gewerke, ein Ansprechpartner'],go:'leistungen/neu-umbau'},
        {x:72,y:36,t:'Ein Fenster, kein Rahmen',l:['Panoramaverglasung, rahmenlos','Neu- & Umbau, statisch geprüft'],go:'leistungen/neu-umbau'},
        {x:30,y:22,t:'Licht, das mitdenkt',l:['Messing-Pendel, Stromschienen, Steuerung','Koordination mit dem Elektriker'],go:'leistungen/renovation'}],
   sheet:{type:'grow',key:'estimate',from:{x:40,y:60}}},
  {id:'bad',f:389,room:'bad',navLabel:'Bad',kicker:'Gewerk 03 · Sanitär',h:'Bad und Leitungen, <em>SIA-konform.</em>',
   d:'Bäder, Küchenanschlüsse, Steigleitungen — Notfall-Einsatz am gleichen Tag.',
   layers:[],
   hotP:[{x:50,y:66},{x:20,y:50},{x:50,y:34}],
   hot:[{x:50,y:74,t:'Dicht nach Norm',l:['Sanitär nach SIA 385/1','Nicht nach Gefühl, sondern geprüft'],go:'leistungen/sanitaer'},
        {x:10,y:66,t:'Grossformat, kaum Fugen',l:['Kalkstein 120 × 60','Verbundabdichtung inklusive'],go:'leistungen/fliesen-parkett'},
        {x:52,y:24,t:'Ein Fenster in die Berge',l:['Festverglasung, Stahlrahmen schwarz','Neu- & Umbau, statisch geprüft'],go:'leistungen/neu-umbau'}],
   sheet:{type:'split',key:'works'}},
  {id:'schlaf',f:491,room:'schlaf',navLabel:'Schlaf',kicker:'Gewerk 05 · Malerarbeiten',h:'Zum Schluss die <em>Oberfläche.</em>',
   d:'Spachteln, Grundieren, Streichen — Abnahme bei Tageslicht.',
   hotP:[{x:30,y:36},{x:36,y:66},{x:80,y:46}],
   hot:[{x:26,y:30,t:'Holz, das leuchtet',l:['Eichenlamellen, hinterleuchtet','Koordination im Bauzeitplan'],go:'leistungen/neu-umbau'},
        {x:34,y:62,t:'Abnahme bei Tageslicht',l:['Spachtelung Q3, 2 × Streichen','Keine Schatten, keine Nacharbeit'],go:'leistungen/malerarbeiten'},
        {x:80,y:44,t:'Kein Zug, kein Schimmel',l:['Dicht, gedämmt, sauber verputzt','Renovation aus einer Hand'],go:'leistungen/renovation'}],
   sheet:{type:'cards',key:'case'}},
  /* f = Halt bei 2.5 s (480+30): Sofa, Kamin und Eckverglasung im Bild */
  {id:'wohnen',f:569,room:'wohnen',navLabel:'Wohnen',kicker:'Gewerk 01 · Renovation',h:'Renovation aus <em>einer</em> Hand.',
   d:'Leerwohnung, Objektbad, Gewerbefläche — Beginn und Übergabe stehen im Werkvertrag.',counters:[["6","","Gewerke im Takt"],["1","","Ansprechpartner"],["24","","Monate Werkgarantie"]],
   /* Etappe 5 (Sichtprüfung 16.09): die Marken lagen auf Kicker und Beschreibung — beide Sätze
      Koordinaten in die obere Bildhälfte bzw. nach rechts, weg von der Textspalte. */
   hotP:[{x:18,y:27},{x:24,y:41},{x:80,y:22}],
   hot:[{x:40,y:34,t:'Beton, der bleibt',l:['Kamin in Sichtbeton, Schalungsbild geplant','Neu- & Umbau, statisch geprüft'],go:'leistungen/neu-umbau'},
        {x:68,y:82,t:'Drei Gewerke im Takt',l:['Boden, Decke, Einbauten synchron','Schreiner, Elektro, Bodenleger'],go:'projekt/atlant-komplettausbau'},
        {x:88,y:42,t:'Bis zum letzten Vorhang',l:['Eckverglasung, Beschattung, Montage','Teil der Renovation, kein Nachtrag'],go:'leistungen/renovation'}]},
  {id:'rohbau',f:569,img:'img/film/s15/st-rohbau.jpg',imgP:'img/film/s15p/st-rohbau.jpg',compareImg:'img/film/s15/st5.jpg',compareImgP:'img/film/s15p/st5.jpg',room:'wohnen',navLabel:'Rückblende',kicker:'Rückblende · Gewerk 04',h:'So hat es <em>angefangen.</em>',
   d:'Rohbau, Leitungen, Ausbau — derselbe Raum, Monate früher. Der erste Tag jedes Projekts.',flash:true,
   hotP:[{x:30,y:60},{x:60,y:40},{x:50,y:78}],
   hot:[{x:14,y:66,t:'Entsorgt mit Nachweis',l:['Rückbau, sortenrein getrennt','Wiegeschein als Beleg'],go:'leistungen/abbruch-rueckbau'},
        {x:64,y:30,t:'Geprüft vor dem Verputz',l:['Leitungen neu, mit Druckprobe','Bevor die Wand wieder zu ist'],go:'leistungen/sanitaer'},
        {x:52,y:86,t:'Grundlage, die trägt',l:['Unterlagsboden schwimmend, mit Dämmung','Fliesen & Parkett'],go:'leistungen/fliesen-parkett'}]},
  /* f = Halt bei 2.0 s (576+24): Konsole mit Schlüsseln, Spiegel, Fenster zum Fels */
  {id:'eingang',f:641,room:'eingang',navLabel:'Eingang',sig:true,kicker:'Abnahme',h:'Abnahme. <em>Schlüsselübergabe.</em>',
   d:'Am vereinbarten Termin, mit Protokoll. Ihr Objekt: gleicher Ablauf.',final:true,
   hotP:[{x:62,y:66},{x:58,y:30}],
   hot:[{x:84,y:82,t:'Schwarz auf weiss',l:['Gemeinsame Abnahme, Raum für Raum — Schlüssel auf der Konsole','Werkgarantie 24 Monate'],go:'kontakt'},
        {x:80,y:30,t:'Der Termin steht fest',l:['Datum steht im Werkvertrag','Termintreu, ohne Ausreden'],go:'ueber'}],
   sheet:{type:'up',key:'contact'}},
 ]
};
/* ---------------------------------------------------------------------------------------------
   v16 «Berghaus, Engine B» (16.09.2026) — der Film hängt nicht mehr an der Scroll-Position.
   Kapitel = Halt (Standbild), Übergang = echtes Video (v16/clips/<a>-<b>-<L|P>.fwd|rev.mp4, 3.00 s, 60 fps).
   Erzählung, Punkte und Texte bleiben identisch zu v15 (scenes werden übernommen) — neu sind nur die Medien
   und die Steuerung (js/film-v16.js). Rollback: ?film=15 (Kader-Scrubbing) bzw. ?film=13 (Altbau).
   legs[k] = Clip zwischen Kapitel k und k+1; null = bewusst ohne Clip (Rückblende: gleicher Blickwinkel).
   fadeInLegs: Strecke beginnt mit einer Blende in den ersten Kader (Rohbau → Wohnen-Blickwinkel). --------- */
const FILM_V16=Object.assign({},FILM_V15,{
 engine:'v16',
 poster:'img/film/v16/stills/ankunft-L.jpg',
 v16:{
  clipDir:'img/film/v16/clips/',liteDir:'img/film/v16/clips/lite/',stillDir:'img/film/v16/stills/',
  /* Etappe 4: je Raum/Ausrichtung eine Karte — R = Tiefe (hell = nah), G = Fernmaske (Glas).
     Build-Werkzeug: core/dev/_depth (Depth Anything V2 small, WebGPU) — das Modell wird nicht ausgeliefert. */
  depthDir:'img/film/v16/depth/',depth:true,
  clipDur:3.0,quiet:700,swipeMin:46,flashFade:420,
  /* Etappe 8 §3.1: sieben Kapitel. Die Rückblende («wohnen-rohbau») ist kein eigenes Kapitel mehr,
     sondern eine Geste in «Wohnen» — damit entfällt auch die legless Blende, jede Strecke hat einen Clip.
     wohnen-eingang beginnt am Wohnen-Halt, also keine Einblende mehr nötig (fadeInLegs leer). */
  rooms:['ankunft','schwelle','kueche','bad','schlaf','wohnen','eingang'],
  legs:['ankunft-schwelle','schwelle-kueche','kueche-bad','bad-schlaf','schlaf-wohnen','wohnen-eingang'],
  fadeInLegs:[]
 },
 /* scenes wird KOPIERT (nicht mutiert): ?film=15 behält seine acht Kapitel samt Rückblende.
    «wohnen» verliert die drei Zahlen — die Wochen-Update-Karte (§4.4) sagt dasselbe konkreter. */
 scenes:FILM_V15.scenes.filter(s=>s.id!=='rohbau').map(s=>s.id==='wohnen'?Object.assign({},s,{counters:null}):s)
});
const FILM=(typeof location!=='undefined'&&/[?&]film=13\b/.test(location.search))?FILM_V13
  :(typeof location!=='undefined'&&/[?&]film=15\b/.test(location.search))?FILM_V15:FILM_V16;
const MARQ=[["Objektbad","Zürich"],["Leerwohnung","Winterthur"],["Fit-out Ladenfläche","Zürich City"],["Serienbäder","Zug"],["Gewölbe-Bar","Luzern"],["Küche Nussbaum","Zürichsee"],["Hotelzimmer","Deutschschweiz"],["Entkernung","Zürich-Altstetten"]];

/* ---------- Situationen (slug = Lösungs-Route, tab = Filter im Arbeiten-Grid) ---------- */
const SIT=[
 {slug:"hausverwaltungen",q:"Die Wohnung steht leer — und jeder Tag kostet.",a:"Mieterwechsel, Frist im Nacken, Handwerker nicht greifbar. Wir übernehmen die Leerwohnung komplett und geben abnahmefertig zurück.",pts:["Fixer Übergabetermin im Werkvertrag","Alle Gewerke über einen Ansprechpartner","Rahmenvertrag für wiederkehrende Objekte"],cta:"Lösung für Hausverwaltungen",tab:"renovation",tabl:"Leerwohnungen ansehen"},
 {slug:"generalunternehmer",q:"Der Sanierungsstau wächst — die Mieter bleiben.",a:"Bäder, Leitungen, Fassade: Älteres Portfolio, laufender Betrieb. Wir sanieren etappenweise, ohne die Bewohner aus dem Haus zu holen.",pts:["Serienbäder im bewohnten Objekt","SIA-konform, dokumentiert für die Abnahme","Wochenweise Kommunikation an die Verwaltung"],cta:"Lösung für Generalunternehmer",tab:"sanitaer",tabl:"Sanierungen ansehen"},
 {slug:"gewerbe-ladenbau",q:"Der Laden muss umgebaut werden — bei offener Tür.",a:"Fit-out oder Umbau von Büro- und Gewerbefläche, aber das Geschäft darf nicht stehen. Wir arbeiten in Etappen und ausserhalb der Öffnungszeiten.",pts:["Nacht- und Wochenendarbeit möglich","Staubschutz und saubere Übergabe täglich","Als Subunternehmer für GU verfügbar"],cta:"Lösung für Gewerbe & Ladenbau",tab:"neu-umbau",tabl:"Fit-outs ansehen"},
];
const FAQ=[
 ["Was kostet eine Renovation ungefähr?","Das hängt von Fläche, Zustand und Material ab. Als Orientierung dienen unsere <a href=\"#richtpreise\" data-scroll=\"richtpreise\">Richtpreise in CHF</a> — die verbindliche Zahl steht in der Festpreis-Offerte, die Sie innert 48 h erhalten."],
 ["Ab welchem Umfang übernehmen Sie einen Auftrag?","Ab drei Stunden Arbeitszeit. Kleine Reparaturen in einem Objekt, das wir bereits betreuen, sind kein Problem — einzelne Kleinstaufträge ohne Bezug zu einem Rahmenvertrag lohnen sich für beide Seiten meist nicht."],
 ["Wie schnell bekommen wir eine Offerte?","Innert 48 Stunden nach dem Aufmass — als Festpreis, Position für Position. Termin und allfällige Besichtigungskosten bestätigen wir vorab. Bei laufendem Unterhalt arbeiten wir mit transparenten Regieansätzen. Erste Bandbreiten liefert unser <a href=\"#richtwert\" data-scroll=\"richtwert\">Richtwert-Rechner</a>."],
 ["Können Sie im bewohnten Objekt arbeiten?","Ja. Serienbäder, Leitungen und Malerarbeiten führen wir etappenweise durch, mit Staubschutz und täglicher Reinigung. Die Mieter werden vorab schriftlich informiert."],
 ["Was ist mit Bewilligungen und Statik?","Bei Grundrissänderungen und Anbauten klären wir Bewilligungspflicht und Statik vorab und koordinieren die Fachplaner. Sie bekommen einen Ansprechpartner, nicht fünf."],
 ["Wer haftet, wenn etwas schiefgeht?","BauStern ist versichert; Beginn, Übergabe und Leistungsumfang stehen im Werkvertrag. Abnahme erfolgt per Protokoll — Mängel werden dokumentiert und behoben. Auf unsere Arbeit geben wir 24 Monate Werkgarantie."],
 ["Arbeiten Sie auch als Subunternehmer?","Ja, für Generalunternehmer als einzelnes Gewerk oder als Paket — SIA-konform, mit Nachweisen für Ihre Abnahme und termintreu im Bauzeitplan."],
 ["Wie schnell sind Sie bei einer Störung vor Ort?","Die Reaktionszeit wird im Rahmenvertrag vereinbart — abhängig von Objektzahl und Region. Ohne Rahmenvertrag antworten wir an Werktagen innert 24 Stunden."],
 ["Was regelt ein Rahmenvertrag?","Feste Regieansätze und Pauschalen für wiederkehrende Arbeiten, eine Reaktionszeit für Störungen, einen festen Ansprechpartner und die gebündelte Abrechnung pro Monat oder pro Objekt."],
 ["Übernehmen Sie auch die Hauswartung?","Nein. Wir übernehmen den technischen Unterhalt — Sanitär, Boiler, Heizkörper, Kleinreparaturen, Malerei — aber keine Reinigung, Gartenpflege oder Winterdienst."],
];
/* Atlant-Zellen auf der Startseite: work = WORKS-id für die Lightbox */
const ATLANT=[
 {img:"img/atlant-living.jpg",t:"Wohnzimmer",d:"Wandbild-Panorama, indirekte LED-Beleuchtung, offener Grundriss",work:"wohnraum-offen"},
 {img:"img/atlant-kitchen2.jpg",t:"Küche",d:"Grifflose Fronten, Naturstein-Rückwand, Einbaugeräte",work:"kueche-grifflos"},
 {img:"img/atlant-bath.jpg",t:"Bad / WC",d:"Grossformatige Platten, Walk-in-Dusche, Wandeinbau",work:"bad-walk-in"},
 {img:"img/atlant-bed.jpg",t:"Schlafzimmer",d:"Holzpaneele, indirekte Beleuchtung, Klimagerät",work:"schlafzimmer-paneele"},
 {img:"img/atlant-wardrobe.jpg",t:"Ankleide",d:"Begehbarer Schrank, Glas & dunkles Furnier",work:"ankleide"},
 {img:"img/atlant-hall.jpg",t:"Vorraum",d:"Einbauschränke, Sitzbank, Wandgestaltung",work:"vorraum-einbau"},
];

const ic={arrow:'→',
 phone:'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 5c0 8 7 15 15 15v-3l-4-2-2 2c-3-1-5-3-6-6l2-2-2-4H4z"/></svg>',
 mail:'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="5" width="18" height="14" rx="1.5"/><path d="M4 7l8 6 8-6"/></svg>',
 pin:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 21s7-6 7-11a7 7 0 10-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.3"/></svg>',
 check:'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 12l4 4L19 7"/></svg>',
 cal:'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
 chat:'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 5h16v11H9l-5 4V5z"/></svg>',
 cam:'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 8h3l2-2h6l2 2h3v11H4z"/><circle cx="12" cy="13.5" r="3.2"/></svg>',
 x:'<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 5l14 14M19 5L5 19"/></svg>'};
const lz=(src,alt,cls="")=>`<img ${cls?'class="'+cls+'" ':''}loading="lazy" decoding="async" src="${src}" alt="${alt}">`;
