#!/usr/bin/env python3
# Erzeugt die Board-Assets für die Szene «Vorher/Nachher» (Rohbau → Ausbau) aus dem Nachher-Standbild.
# Ausgabe: masks/*.png (Alpha, gefeathert), layers/*.jpg|png (before, technik, edges, after, after-lit)
# Aufruf: python3 make-board-assets.py <after.jpg> <outdir>
import sys, os, numpy as np, cv2

src, out = sys.argv[1], sys.argv[2]
os.makedirs(f'{out}/masks', exist_ok=True); os.makedirs(f'{out}/layers', exist_ok=True)
after = cv2.imread(src); H, W = after.shape[:2]
rng = np.random.default_rng(7)

def poly(pts, feather=18):
    m = np.zeros((H, W), np.uint8); cv2.fillPoly(m, [np.array(pts, np.int32)], 255)
    return cv2.GaussianBlur(m, (0, 0), feather) if feather else m

# ---- Geometrie (1280×714, Standbild Rohbau/Eingang «nachher») -----------------------------------
FLOOR = poly([(0,568),(940,598),(1280,688),(1280,H),(0,H)], 10)
FURN  = np.maximum.reduce([
    poly([(430,388),(850,388),(948,452),(948,H),(268,H),(268,452)], 8),       # Tisch + Stühle
    poly([(536,262),(704,262),(704,428),(536,428)], 6),                        # Vase + Pflanze
    poly([(348,178),(600,178),(600,258),(348,258)], 5),                        # Regal
    poly([(140,156),(250,156),(250,280),(140,280)], 5),                        # Bild
    poly([(588,0),(676,0),(676,244),(588,244)], 5),                            # Pendelleuchte
])
LIGHT = poly([(688,0),(1280,0),(1280,600),(940,600),(688,440)], 22)           # Fenster + Vorhang
inv = lambda m: 255 - m
WALLS = cv2.min(inv(FLOOR), inv(LIGHT))
FLOOR_ONLY = FLOOR
for n, m in [('walls', WALLS), ('floor', FLOOR_ONLY), ('furniture', FURN), ('light', LIGHT)]:
    rgba = np.dstack([np.full((H, W, 3), 255, np.uint8), m]); cv2.imwrite(f'{out}/masks/{n}.png', rgba)

# ---- «Vorher» prozedural: Möbel wegrechnen, Beton/Putz, Estrich ---------------------------------
furn_hard = (FURN > 90).astype(np.uint8) * 255
furn_hard = cv2.dilate(furn_hard, np.ones((9, 9), np.uint8))
# Zeilenweise lineare Füllung zwischen linkem/rechtem Rand jedes Möbel-Laufs (keine Inpaint-Schlieren:
# links vom Tisch ist die Wand sauber, die Perspektive bleibt zeilenweise plausibel)
base = after.astype(np.float32).copy()
for y in range(H):
    row = furn_hard[y] > 0
    if not row.any(): continue
    xs = np.flatnonzero(np.diff(np.concatenate(([0], row.astype(np.int8), [0]))))
    for x0, x1 in zip(xs[::2], xs[1::2]):
        l = base[y, max(x0 - 1, 0)]; r = base[y, min(x1, W - 1)] if x1 < W else l
        t = np.linspace(0, 1, x1 - x0, dtype=np.float32)[:, None]
        base[y, x0:x1] = l * (1 - t) + r * t
# Innerhalb der Füllung: Zeilenstreifen wegglätten (nur dort), Körnung wieder drauf
fm = cv2.GaussianBlur(furn_hard, (0, 0), 6).astype(np.float32)[..., None] / 255
soft = cv2.GaussianBlur(base, (0, 0), 16)
grain = rng.normal(0, 2.2, (H, W, 1)).astype(np.float32)
base = base * (1 - fm) + (soft + grain) * fm
base_sharp = np.clip(base, 0, 255).astype(np.uint8)
base = cv2.GaussianBlur(base, (0, 0), 3).astype(np.uint8)

def noise(scale, amp):
    n = rng.normal(0, 1, (H // scale + 2, W // scale + 2)).astype(np.float32)
    n = cv2.resize(n, (W, H), interpolation=cv2.INTER_CUBIC); return n * amp

lum = cv2.cvtColor(base, cv2.COLOR_BGR2GRAY).astype(np.float32)
# Wände: Zementputz, kühl-grau, Flecken, Körnung
wall = 0.72 * lum + 34
wall += noise(2, 4) + noise(10, 4) + noise(48, 6)
wall = np.clip(wall, 0, 255)
wall_bgr = np.dstack([wall * 0.98, wall * 0.97, wall * 0.93]).astype(np.uint8)   # leicht warm-grau (BGR)
# Estrich: heller, flacher, feiner Sand
screed = 0.30 * lum + 112 + noise(1, 6) + noise(6, 4) + noise(90, 6)
screed = np.clip(screed, 0, 255)
screed_bgr = np.dstack([screed * 0.96, screed * 0.97, screed]).astype(np.uint8)
# Fenster/Licht im Rohbau: Glas staubig, kälter, Vorhänge → Baufolie (entsättigt)
win = base.astype(np.float32); g = cv2.cvtColor(base, cv2.COLOR_BGR2GRAY).astype(np.float32)[..., None]
win = 0.35 * win + 0.65 * g; win = win * 0.82 + 20 + noise(3, 4)[..., None]
win_bgr = np.clip(win, 0, 255).astype(np.uint8)

a = lambda m: (m.astype(np.float32) / 255)[..., None]
before = wall_bgr.astype(np.float32)
before = before * (1 - a(FLOOR)) + screed_bgr * a(FLOOR)
before = before * (1 - a(LIGHT)) + win_bgr * a(LIGHT)
# Vignette + Kontrastreduktion (Baustelle ohne Kunstlicht)
yy, xx = np.mgrid[0:H, 0:W]; vig = 1 - 0.28 * (((xx - W * .55) / (W * .6)) ** 2 + ((yy - H * .45) / (H * .7)) ** 2)
before = np.clip(before * vig[..., None], 0, 255).astype(np.uint8)
cv2.imwrite(f'{out}/layers/before.jpg', before, [cv2.IMWRITE_JPEG_QUALITY, 88])
# «vorher» staubig (B+ Startzustand): Sättigung 60 %, Kontrast 78 % — vorgerechnet, im Produkt kein Live-Filter
g = cv2.cvtColor(before, cv2.COLOR_BGR2GRAY).astype(np.float32)[..., None]
dusty = (before.astype(np.float32) * .6 + g * .4 - 128) * .78 + 133
cv2.imwrite(f'{out}/layers/before-dusty.jpg', np.clip(dusty, 0, 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 86])

# ---- Technik-Layer: Leerrohre, Dosen, Kabel (Phase 2) — als RGBA über «vorher» -------------------
tech = np.zeros((H, W, 4), np.uint8)
def tube(pts, w=6, col=(70, 110, 190)):  # orange (BGR) Elektro-Leerrohr
    cv2.polylines(tech, [np.array(pts, np.int32)], False, (*col, 255), w, cv2.LINE_AA)
def box(x, y, r=13):
    cv2.circle(tech, (x, y), r, (60, 60, 60, 255), -1, cv2.LINE_AA); cv2.circle(tech, (x, y), r - 4, (95, 95, 95, 255), 2, cv2.LINE_AA)
# Horizontale Trasse 30 cm über Boden (Wand links)
tube([(0, 520), (700, 548), (930, 570)]); tube([(0, 530), (700, 558), (930, 580)], 4, (120, 120, 120))
# Steigleitungen zu Dosen / Schaltern
tube([(180, 520), (180, 300)]); box(180, 300); box(180, 520)
tube([(470, 538), (470, 250)]); box(470, 250)
tube([(632, 545), (632, 0)]); box(632, 60)                          # Leuchtenauslass
box(300, 505); box(760, 555)
# Heizungsrohre (grau) unter Fenster
tube([(940, 600), (1280, 690)], 8, (140, 140, 140)); tube([(940, 588), (1280, 676)], 8, (140, 140, 140))
# Estrich-Fugen
for x0 in range(0, W, 240): cv2.line(tech, (x0, 580), (x0 + 80, H), (150, 150, 150, 120), 2, cv2.LINE_AA)
cv2.imwrite(f'{out}/layers/technik.png', tech)

# ---- Kanten-Wireframe (Phase 1: Geometrie-Tracking) ---------------------------------------------
edges = cv2.Canny(cv2.GaussianBlur(after, (0, 0), 2.0), 70, 170)
edges = cv2.min(edges, cv2.max(FURN, 255 - LIGHT))  # Vorhang-Rauschen raus
wire = np.dstack([np.full((H, W, 3), 235, np.uint8), edges]); cv2.imwrite(f'{out}/layers/edges.png', wire)

# ---- «Nachher» unbeleuchtet (Phase 3): flach, kühler, ohne Leuchten-Glow -------------------------
empty = base_sharp.astype(np.float32)  # zeilenweise gefüllt, ohne Möbel, scharf
flat = empty.copy()
flat = (flat - 128) * 0.86 + 118          # Kontrast/Helligkeit runter
flat[..., 2] *= 0.94; flat[..., 0] *= 1.04  # kälter (BGR: R runter, B rauf)
cv2.imwrite(f'{out}/layers/after-flat.jpg', np.clip(flat, 0, 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 90])
# dieselbe Tonung MIT Möbeln → Möbel-Layer (Phase 4 vor dem Licht)
ff = (after.astype(np.float32) - 128) * 0.86 + 118; ff[..., 2] *= 0.94; ff[..., 0] *= 1.04
cv2.imwrite(f'{out}/layers/after-flat-full.jpg', np.clip(ff, 0, 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 90])
cv2.imwrite(f'{out}/layers/after.jpg', after, [cv2.IMWRITE_JPEG_QUALITY, 92])
lit_empty = empty.copy(); cv2.imwrite(f'{out}/layers/after-empty.jpg', np.clip(lit_empty, 0, 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 90])

# ---- Bloom-Layer (Phase 4): Lichter isoliert, weichgezeichnet, additiv ---------------------------
hl = np.clip((cv2.cvtColor(after, cv2.COLOR_BGR2GRAY).astype(np.float32) - 190) / 65, 0, 1)
hl = cv2.GaussianBlur(hl, (0, 0), 28)
bloom = np.dstack([np.full((H, W, 3), 255, np.uint8), (hl * 255).astype(np.uint8)]); cv2.imwrite(f'{out}/layers/bloom.png', bloom)

print('ok', W, H)
