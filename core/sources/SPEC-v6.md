# BauStern Startseite v6 — «Die Wohnung ist die Seite»

Fixierter Film-Canvas unter der ganzen Startseite. Räume = Emotion + Hotspots, Blätter (Papier) = Fakten.
Regel: ≤ 3 Zeilen + 1 Bild → im Raum. Grid/Formular/Rechner → Blatt. Jeder Übergang anders.
Kamera fährt selbst (1.6–2.2 s) wenn der Nutzer die Raumgrenze überschreitet; Scroll blockiert nie.
Im Raum: Scroll = Drift (Ken Burns 1.00→1.05, leichte Parallaxe), Hotspots erscheinen gestaffelt, Zähler laufen.
Kein Punkte-Navi, kein «Überspringen», kein Progress-Balken. Stattdessen Mini-Grundriss (klickbar) + Nav.

## Szenen

| # | Raum | Clip | Im Raum (Overlay) | Hotspots (Objekt → Label → Ziel) | Blatt danach | Übergang des Blatts |
|---|---|---|---|---|---|---|
| 1 | Küche | C1 Drift | Wortmarke, Slogan «Bauen mit System und Vertrauen.», 2 CTAs, Trust-Zeile | Tischfuss → «Massanfertigung Messing» · Rückwand → «Grossformat-Terrazzo» · Schienen → «Elektro & Licht» | Kennzahlen-Band (dünn, halbtransparent) | Band schiebt sich von unten, Zähler laufen mit der Kamerafahrt |
| 2 | Flur | C2 Küche→Flur | «Sechs Gewerke. Ein Ansprechpartner.» + 6 Gewerk-Chips (klickbar) | Tür → «Neu- & Umbau: Trennwände» · Boden → «Parkett & Unterlagsboden» · Decke → «Malerarbeiten Q3» | Vier Versprechen | Blatt von unten, Kadre dahinter dunkelt + Unschärfe |
| 3 | Bad | C3 Flur→Bad | «Bad und Leitungen, SIA-konform.» + Vorher-Fenster (echtes Foto) | Armatur → «Sanitär SIA 385/1» · Wand → «Travertin 120×60, Abdichtung» · Dusche → «Bodenebene Dusche» | Richtwert-Rechner, Preset «Bad» | Karten wachsen aus dem Waschtisch (scale 0.6→1 vom Hotspot-Punkt) |
| 4 | Schlafzimmer | C4 Bad→Schlafz. | «Zum Schluss die Oberfläche.» | Wand → «Spachtelung Q3, 2× Streichen» · Paneel → «Schreinerarbeit» · Fenster → «Fensteranschluss dicht» | Referenzen (Tabs, Lightbox) | Split: linke Hälfte bleibt Raum, rechte Hälfte wird Papier, dann volles Blatt |
| 5 | Wohnzimmer | C5 Schlafz.→Wohnz. | «Renovation aus einer Hand.» + Zähler 47 m² · 6 Räume · 100 % | Insel → «Küche Nussbaum, Steinabdeckung» · Sofa-Wand → «Tapete & Licht» · Fenster → «Vorhänge, Beschattung» | Fallstudie Atlant + Kundenstimmen | Blatt kommt als zwei Karten von links/rechts |
| 6 | Rohbau (Rückblende) | C7 aus echtem Foto | «So hat es angefangen.» + 4 Etappen als Zeitleiste | Leitungen → «Sanitär-Rohinstallation» · Wand → «Rückbau sortenrein» · Boden → «Unterlagsboden» | Ablauf in 3 Schritten + Baustellen-Knigge | Wipe (Vorhang) von rechts, Papier «legt sich» über das Foto |
| 7 | Eingang · Schlüssel | C6 Wohnz.→Eingang | «Abnahme. Schlüsselübergabe.» + «Ihr Objekt: gleicher Ablauf.» | Schlüssel → «Abnahmeprotokoll» · Tür → «Übergabe am vereinbarten Termin» | Kontakt-Formular + FAQ + Footer | Blatt von unten, bleibt (Seitenende) |

## Mini-Grundriss (SVG, Messing-Linie)
Schematisch, 5 Räume: Küche (oben rechts), Flur (Mitte), Bad (links), Schlafzimmer (unten links), Wohnzimmer (unten rechts), Eingang (oben links). Punkt = Kamera; aktiver Raum gefüllt (brass 12 %). Klick auf Raum → Sprung zur Szene. Auf Telefon ausgeblendet.

## Motion-Vokabular
- Kamerafahrt: Tween über Kaderindex, power2.inOut, 1.6–2.2 s; abbrechbar (neue Fahrt überschreibt).
- Drift im Raum: scale 1→1.05 + translate ≤ 1.5 % über die Raumhöhe (Scroll-gebunden).
- Hotspots: Punkt pulst 1×, Label wächst aus dem Punkt (clip-path), Stagger .12 s; Hover/Fokus → Popover (2 Zeilen + «Mehr»).
- Überschriften: Wörter y 18→0 + opacity, Stagger .05 s, starten wenn die Fahrt zu 60 % ist.
- Zähler: laufen während der Fahrt zum Raum (Dauer = Fahrt).
- Blätter: siehe Tabelle; Rückweg symmetrisch. Kader dahinter: brightness .55, blur 6px.
- Nav: über dem Film dunkel-transluzent, über Blättern Papier.

## Telefon (<1000px)
Stage sticky 100svh, 9:16-Standbilder pro Szene (Nano Banana), Blende .55 s, Hotspots max. 2 pro Raum, kein Grundriss, Blätter = normale Sektionen. Auto-Fahrt = Blende.

## Reduced-Motion / ohne GSAP
Standbilder + Blätter als Sektionen untereinander, Hotspots als statische Liste, alles sichtbar.

## Preloader (nur Startseite, 1. Besuch pro Session)
«Wohnung wird geladen» — Wortmarke, Messing-Balken; wartet auf Poster + Szene-1-Kader (max. 1.8 s), dann Vorhang auf.

## Assets
Clips: Veo 3.1 Quality 1080p 16:9 8 s: C1 Küche-Drift · C2 Küche→Flur · C3 Flur→Bad · C4 Bad→Schlafzimmer · C5 Schlafzimmer→Wohnzimmer · C6 Wohnzimmer→Eingang/Schlüssel · C7 Rohbau (aus echtem Foto).
Kader: 8 fps, 1280 (Standard) + 1920 (≥1600px Viewport, DPR>1), WebP q72/q70. Standbilder 9:16 1080×1920 pro Szene.
