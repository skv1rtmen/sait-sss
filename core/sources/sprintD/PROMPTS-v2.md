# BauStern — Sprint D: Vertikaler Schnitt + Ankunft (Generierungs-Prompts)

Stand 15.09.2026. Ziel: (1) Portrait-Fassungen aller 7 Räume, die wie eigens gedrehte Hochkant-Aufnahmen wirken,
nicht wie Ausschnitte der 16:9-Master; (2) neue Eröffnungsszene «Ankunft» (Fassade → Haustür öffnet sich) für Desktop UND Telefon.
Reihenfolge der Arbeit: A (Outpainting, Stunden) → B (Portrait-Clips, 1–2 Tage) → C (Ankunft) → D (Pipeline).

Alle Bilder sind AI-Interieurs derselben Serie (film-v6, LUT `sprintA/baustern.cube`). Neue Bilder müssen zu dieser Serie
passen: warmes Nachmittagslicht, Eiche/Messing/Terrazzo, weisse Wände, keine Menschen, keine Logos, kein Text im Bild.

---------------------------------------------------------------------------------------------------------------------

## 0. Vertrag: Dateinamen, die der Code erwartet (film-mobile-v2.js / data.js `FILM.portrait`)

| Was | Pfad | Format |
|---|---|---|
| Portrait-Standbild Raum i (0..6) | `site/img/film/s14p/st{i}.jpg` + `st{i}-720.jpg` | 1080×1920 / 720×1280, JPEG q82, sRGB |
| Portrait-Standbild Rückblende «nachher» | `site/img/film/s14p/st-flash-after.jpg` | 1080×1920 |
| Portrait-Materialisierung (7 Stufen) | `site/img/film/mat6p/step{0..6}.webp` | 1080×1920, WebP q80 |
| Portrait-Scrub-Kader (12 fps, gleiche Indizes wie `f13`) | `site/img/film/fp14/f{0000..0575}.webp` | 540×960, WebP q78 |
| Portrait-Flug-Videos (Autopilot/Fallback) | `site/img/film/mp14/{clip}.fwd.mp4`, `.rev.mp4` | 1080×1920, 60 fps, H.264 High |
| Ankunft — Standbild | `site/img/film/s14/st-ankunft.jpg` (1920×1080), `site/img/film/s14p/st-ankunft.jpg` (1080×1920) | JPEG |
| Ankunft — Eröffnungsclip | `site/img/film/r14/ankunft.{av1,hevc,h264}.mp4`, `site/img/film/mp14/ankunft.mp4` (portrait) | 4.0 s, 60 fps |
| Ankunft — Haltekader (Tür offen) | `site/img/film/s14/st-ankunft-hold.jpg`, `s14p/st-ankunft-hold.jpg` | JPEG |

Frame-Indizes bleiben identisch zum 16:9-Master (Küche 95, Flur 191, Bad 287, Schlaf 383, Wohnen 479, Eingang 575),
damit Pins, Szenenlogik und Prefetch-Fenster für beide Orientierungen dieselben Zahlen benutzen. Fehlt ein Portrait-Set,
fällt der Code automatisch auf Pan-Scan des 16:9-Masters zurück (Kamera fährt seitlich über das breite Bild) — nichts bricht.

Cache-Regel (Netlify `_headers`, immutable): NIE alte Pfade überschreiben. Neue Versionen = neue Ordner (s14p, fp14, mp14, mat6p, r14).

---------------------------------------------------------------------------------------------------------------------

## A. Outpainting der 7 Standbilder → 1080×1920 (Flux Fill / FLUX.1 Kontext / Photoshop «Generative Expand»)

Quelle: `site/img/film/s13/st{i}.jpg` (1920×1080). Vorgehen pro Bild:
1. Canvas auf 1080×1920 (Hochkant) — das 16:9-Bild mittig, NICHT skaliert (Breite 1080 → das Original wird auf 1080×608 verkleinert, das ist ok: die
   Detailschärfe kommt am Ende von Schritt 4).
   Alternativ (empfohlen für Räume mit starkem Vordergrund): Original auf 1440×810 skalieren, horizontal auf den Fokuspunkt
   zentrieren (Fokus-x pro Raum s. Tabelle), auf 1080 beschneiden → weniger Dorisierung oben/unten (nur je ~555 px statt 656 px).
2. Maske: alles ausserhalb des Originals (oben Decke, unten Boden). 24 px Feather in das Original hinein, damit die Naht verschwindet.
3. Prompt unten, 2–3 Kandidaten, Auswahl nach: gerade Fluchtlinien, Boden ohne neue Möbel, Decke ohne neue Lampen.
4. Upscale auf 1080×1920 mit Detailrückgewinn (Topaz Gigapixel «Standard v2» ×1 oder Magnific «Subtle»), dann LUT `baustern.cube` NICHT erneut anwenden
   (Quelle ist bereits gegradet) — nur die dorisierten Zonen leicht an die Quelle angleichen (Match Color auf das Original).
5. Export `s14p/st{i}.jpg` q82 + `st{i}-720.jpg`.

Negativ (für alle): `people, person, text, watermark, logo, extra furniture, extra lamps, extra doors, extra windows, warped lines,
fisheye, blur, painting, illustration, cartoon, oversaturated`.

| i | Raum | Fokus-x | Prompt (Outpainting, oben/unten) |
|---|---|---|---|
| 0 | Küche | 0.54 | Continue this modern Zurich apartment kitchen vertically. Above: the same white ceiling with black track-light rail and slim pendant, plain plaster, soft daylight falloff. Below: the same light oak plank floor continuing toward the camera, subtle reflection of the brass table base, nothing added. Same lens, same perspective, same warm afternoon light. Photorealistic architectural photography. |
| 1 | Flur | 0.50 | Extend this bright hallway with a glass door at the end vertically. Above: white ceiling with two black cylindrical spotlights on a rail, clean plaster. Below: continuous pale oak floor leading to the door, straight perspective lines converging on the door, no rugs, no objects. Same afternoon light through the glass. Photorealistic. |
| 2 | Bad | 0.36 | Extend this luxury bathroom vertically. Above: white ceiling with a soft linear LED cove, travertine wall continues upward. Below: large-format travertine floor tiles with a flush walk-in shower channel, no threshold, minimal grout lines, no objects. Same warm light. Photorealistic. |
| 3 | Schlafzimmer | 0.50 | Extend this bedroom vertically. Above: white ceiling, the fluted oak wall panel continues to the ceiling with its warm LED backlight glow. Below: the oak platform bed base and pale oak floor continue toward the camera, no rug, no objects. Same warm evening light. Photorealistic. |
| 4 | Wohnen | 0.48 | Extend this open living room with walnut kitchen island vertically. Above: white ceiling, the brass linear pendant hangs from a plain ceiling, sheer curtains continue to a ceiling track. Below: walnut island base and pale oak floor, beige sofa base, no added furniture. Same soft daylight. Photorealistic. |
| 5 | Rückblende (nachher) | 0.50 | (wie Flur) — Quelle `st-flash-after.jpg` → `s14p/st-flash-after.jpg`. |
| 6 | Eingang | 0.50 | Extend this entrance area with a round black-framed mirror vertically. Above: white ceiling, warm wall wash from a hidden light, the mirror frame completes as a full circle. Below: the oak console with the key tray and a pair of keys, pale oak floor, nothing else on the floor. Same light. Photorealistic. |

Materialisierung (`mat5/step0..6.webp` → `mat6p/`): step0 (Rohbau) und step6 (fertig) zuerst; Prompt für step0: «Continue the raw concrete shell
vertically: bare concrete ceiling with exposed cable conduits above, screed floor with dust below, same perspective». Steps 1–5 mit derselben
Seed und derselben Maske, Prompt = Mischung («partially finished: primed walls, screed floor, no furniture» usw.). Wenn Zwischenstufen
nicht sauber werden: nur step0 + step6 liefern — der Code blendet dann in 2 Stufen (Rohbau → fertig) statt in 7.

---------------------------------------------------------------------------------------------------------------------

## B. Portrait-Kamerafahrten (Kling 2.x «Start & End Frame» / Runway Gen-4 Keyframes / Veo mit Referenzbildern)

Prinzip: jede Fahrt ist ein Clip von Raum i-1 nach Raum i, Startbild = `s14p/st{i-1}.jpg`, Endbild = `s14p/st{i}.jpg`.
So bleiben Haltekader und Flug pixelgleich an beiden Enden (kein Versatz beim Anhalten) — dieselbe Logik wie im Desktop-Master.
Wo die Räume physisch nicht verbunden sind (Küche→Flur ist ok, Flur→Bad ok, Bad→Schlaf, Schlaf→Wohnen, Wohnen→Eingang), darf die Fahrt
durch eine Tür/einen Durchgang gehen; die KI erfindet den Übergang — das ist gewollt, im Master ist es genauso.

Gemeinsame Vorgaben: 1080×1920, 5 s (wird später auf 2.2 s easeInOut umgetastet), 24/30 fps → RIFE ×2, Kamera langsamer Dolly vorwärts,
KEINE Handkamera, KEIN Zoom, KEIN Schwenk über 15°, keine Menschen, keine Bewegungen von Objekten (Vorhänge maximal minimal),
Belichtung konstant. Motion-Strength niedrig (Kling «Standard», creativity 0.2–0.3).

| Clip | Von → Nach | Prompt |
|---|---|---|
| `c1-ankunft-kueche` | Ankunft-Hold → Küche | Slow forward dolly through an open apartment door into a bright modern kitchen with a white oval table on a brass base, camera height 1.4 m, steady, no pan, soft afternoon light, photorealistic architectural film. |
| `c2-flur` | Küche → Flur | Slow forward dolly from the kitchen into a bright hallway toward a glass door, straight steady movement, camera 1.4 m, no pan, soft light. |
| `c3-bad` | Flur → Bad | Slow forward dolly through a doorway into a travertine bathroom with a walk-in shower, steady, camera 1.4 m, warm light. |
| `c4-schlaf` | Bad → Schlafzimmer | Slow forward dolly into a bedroom with a fluted backlit oak wall and a platform bed, steady, camera 1.4 m, warm evening light. |
| `c5-wohnen` | Schlaf → Wohnen | Slow forward dolly into an open living room with a walnut island and a beige sofa, sheer curtains, steady, camera 1.4 m, soft daylight. |
| `c6-eingang` | Wohnen → Eingang | Slow forward dolly toward an entrance console with a round black mirror and a key tray, steady, camera 1.4 m, warm light, ends on the keys. |

Rückwärts-Fahrten (`.rev`) NICHT generieren — sie entstehen in der Pipeline durch Umkehrung der Kader (wie im Master).

Abnahme pro Clip: Startkader und Endkader im Vergleich zum Standbild (SSIM ≥ 0.85 auf 1/4 Auflösung); keine «morphenden» Möbel;
keine Helligkeitssprünge (>6 % Luma zwischen Frame 0 und Standbild). Durchgefallene Clips: neu würfeln, Motion-Strength senken.

---------------------------------------------------------------------------------------------------------------------

## C. Ankunft (neue Szene 0) — «Ihr Name an der Tür»

Dramaturgie: Der Film beginnt draussen, in der Dämmerung, vor einem Zürcher Mehrfamilienhaus. Die Kamera fährt langsam auf die Haustür zu,
das Messing-Klingelschild wird lesbar, die Tür öffnet sich, warmes Licht fällt heraus — Schnitt/Übergang in die Wohnung.
Am Ende der Tour liegt der Schlüssel auf dem Tablett (Szene Eingang): Ankunft → Rundgang → Schlüsselübergabe = ein Kreis.

Schweiz ohne Kitsch (keine Flagge, keine Berge, keine Kühe): Zürcher Altbau mit hellem Putz und Sichtbeton-Sockel, Fensterläden,
Messing-Klingelschild mit gravierten Namen (Etagenwohnungen), der normierte Schweizer Briefkasten (CH-Norm, anthrazit), blaue Zürcher
Strassentafel mit weissem Text an der Ecke, Kopfsteinpflaster-Vorplatz, ein Fahrrad. Kein Text, der lesbar sein muss — die Tafel und das Schild
bleiben unscharf/klein, den Schriftzug «BauStern» setzen wir NICHT ins Bild (Marken im Bild altern schlecht; Overlay macht das im Code).

### C1. Standbild Fassade (Landscape 1920×1080 + Portrait 1080×1920, gleiche Seed)

Prompt: `Entrance of an elegant early-20th-century Zurich apartment building at blue hour, light rendered plaster facade with a
board-formed concrete plinth, tall wooden entrance door with brass hardware and a small brass doorbell nameplate panel, a Swiss standard
anthracite letterbox beside the door, wooden window shutters, warm interior light glowing through the door's glass panel and the windows above,
cobblestone forecourt, one bicycle leaning at the side, a blue Zurich street sign on the corner out of focus, no people, no readable text,
cinematic architectural photography, 35 mm, f/4, soft dusk light, muted warm palette matching an oak-and-brass interior, photorealistic.`

Negativ: `people, cars, readable text, flags, mountains, snow, neon, night, rain, wide angle distortion, illustration`.

Portrait-Variante: gleiche Seed, Prompt-Zusatz `vertical composition, door centered, facade continues upward, cobblestones in the foreground`.

### C2. Haltekader «Tür offen» (beide Orientierungen)

Aus C1 per Inpainting: Tür 70 % offen, Blick durch die Tür in einen warm beleuchteten Flur mit Eichenboden (unscharf), Klingelschild im
Vordergrund noch sichtbar. Prompt: `the wooden entrance door swung open, warm light from an oak-floored hallway inside, everything else unchanged`.

### C3. Eröffnungsclip «Ankunft» (4.0 s, Landscape + Portrait; Kling/Veo Start-Frame = C1, End-Frame = C2)

Prompt: `Slow forward dolly toward the entrance door of the building at dusk, steady camera at eye level, the brass nameplate comes into focus,
the door slowly swings open revealing warm light inside, no people, no camera shake, continuous smooth motion, photorealistic.`
Timing-Vorgabe für den Schnitt: 0.0–2.6 s Dolly, 2.6–4.0 s Tür öffnet sich; letzter Frame = C2.

### C4. Anschluss in die Wohnung

Option 1 (sofort, ohne neuen Clip): Übergang «Tür offen» → Kader 0 des Küchen-Intros als 400-ms-Überblendung durch Weiss (Licht aus der Tür
blendet auf) — Code: Szene `ankunft` mit `flash:true` wie die Rückblende. Option 2 (später, B-Clip `c1-ankunft-kueche`): echte Fahrt durch die Tür.

### C5. Text auf der Ankunft (Overlay, kein Bild-Text)

Kicker: `Zürich · Deutschschweiz` · Headline: `Bauen mit System und <em>Vertrauen.</em>` (zieht von der Küche hierher) ·
Unterzeile: `Ihr Umbau. Klar geplant und sauber umgesetzt — bis zur Schlüsselübergabe.` · Die Küche bekommt neu: Kicker `Gewerk 03 · Küche & Ausbau`,
Headline `Sechs Gewerke, <em>eine</em> Küche.` (bestehende Pins bleiben).

---------------------------------------------------------------------------------------------------------------------

## D. Pipeline-Profil (core/sources/sprintB/pipeline.sh)

Aufruf für Portrait: `PROFILE=portrait W_OUT=1080 H_OUT=1920 OUT=site/img/film SCRUB_W=540 SCRUB_DIR=fp14 VIDEO_DIR=mp14 bash pipeline.sh all`
— Quelle: `core/film/sources/film-p14/v14p-c1..c6.mp4` (Clips aus B), `ankunft.mp4` aus C3. Schritte identisch: upscale/interpolate (RIFE) →
LUT nur, wenn der Clip NICHT bereits aus gegradeten Standbildern erzeugt wurde → segments (2.2 s easeIO fwd/rev) → encode (H.264 reicht fürs
Telefon, AV1 optional) → scrub (12 fps → 96 Kader je Clip, Indizes 0..575) → vmaf. Für Landscape-Ankunft: `r14/ankunft.*` + `s14/st-ankunft*.jpg`.

Nach dem Lauf: `node core/dev/jsdom-smoke.js` (prüft fehlende Dateien), dann `FILM.portrait.enabled=true` in data.js.
