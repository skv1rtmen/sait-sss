#!/usr/bin/env python3
# Statisches Board (PNG): dieselbe Zeitplanung wie board.html (Engine.render), in NumPy nachgerechnet.
# Dient als QA-Referenz und als Bild für Chat/Handoff. Aufruf: python3 render-board-png.py out board.png
import sys, os, numpy as np, cv2
out, dst = sys.argv[1], sys.argv[2]
L = lambda n: cv2.imread(f'{out}/layers/{n}', cv2.IMREAD_UNCHANGED)
M = lambda n: cv2.imread(f'{out}/masks/{n}.png', cv2.IMREAD_UNCHANGED)[..., 3].astype(np.float32) / 255
before, flat, flatFull, after = [L(n).astype(np.float32) for n in ('before.jpg', 'after-flat.jpg', 'after-flat-full.jpg', 'after.jpg')]
technik, edges, bloom = L('technik.png'), L('edges.png'), L('bloom.png')
mW, mF, mFu, mL = M('walls'), M('floor'), M('furniture'), M('light')
H, W = before.shape[:2]
rng = np.random.default_rng(3)

def bez(x1, y1, x2, y2):
    def f(x):
        x = min(max(x, 0), 1); t = x
        for _ in range(8):
            cx = ((1 - 3 * x2 + 3 * x1) * t + (3 * x2 - 6 * x1)) * t * t + 3 * x1 * t
            dx = 3 * (1 - 3 * x2 + 3 * x1) * t * t + 2 * (3 * x2 - 6 * x1) * t + 3 * x1
            if abs(dx) < 1e-6: break
            t -= (cx - x) / dx; t = min(max(t, 0), 1)
        return ((1 - 3 * y2 + 3 * y1) * t + (3 * y2 - 6 * y1)) * t * t + 3 * y1 * t
    return f
E = bez(.7, 0, .2, 1)
lin = lambda p, a, b: min(max((p - a) / (b - a), 0), 1)
seg = lambda p, a, b: E(lin(p, a, b))
pulse = lambda p, a, w: np.sin(lin(p, a, a + w) * np.pi)

yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
DIAG = (xx / W + yy / H) / 2                                  # 0 oben-links … 1 unten-rechts
DOOR = ((xx - 0) * (W * 1.05) + (yy - H) * (H * .55 - H)) / ((W * 1.05) ** 2 + (H * .45) ** 2)  # Projektion auf Vektor (0,H)→(1.05W,.55H)
def wipe(field, pos, feather):  # 1 = sichtbar (hinter der Kante), weiche Kante
    return np.clip((pos - field) / feather, 0, 1)[..., None]
def over(dst_, src, a):  # a: HxWx1 oder Skalar
    return dst_ * (1 - a) + src * a
def rgba_over(dst_, img, a=1.0, w=None):
    al = img[..., 3:4].astype(np.float32) / 255 * a
    if w is not None: al = al * w
    return over(dst_, img[..., :3].astype(np.float32), al)

dusty = None
def render(p, plus):
    global dusty
    if dusty is None:
        g = cv2.cvtColor(before.astype(np.uint8), cv2.COLOR_BGR2GRAY).astype(np.float32)[..., None]
        dusty = (before * .6 + g * .4 - 128) * .78 + 128 * 1.04
    band = lin(p, .10, .62) if plus else 0
    wallsT = lin(band, .08, .78) if plus else seg(p, .22, .50)
    floorT = lin(band, .30, 1.0) if plus else seg(p, .42, .68)
    techIn = lin(band, 0, .35) if plus else seg(p, .15, .30)
    wireT, wireOut = seg(p, .03, .15), 1 - seg(p, .20, .34)
    furnT, flash, lift = seg(p, .62, .84), pulse(p, .64, .06) * .6, (1 - seg(p, .62, .84)) * 6
    lightT = seg(p, .80, 1); bloomA = lightT * .25
    settle = pulse(p, .94, .06) * .08 if plus else 0
    img = before.copy()
    if plus:
        dA = 1 - lin(p, .28, .55)
        if dA > 0: img = over(img, dusty, dA)
    if wireT > 0 and wireOut > 0: img = rgba_over(img, edges, .55 * wireOut, wipe(DIAG, wireT * 1.2, .25))
    if techIn > 0: img = rgba_over(img, technik, 1, wipe(DIAG, techIn * 1.15, .2))
    if wallsT > 0:
        img = over(img, flat, mW[..., None] * wipe(DIAG, wallsT * 1.15, .14))
        img = over(img, flat, mL[..., None] * min(1, wallsT * 1.6) * wipe(DIAG, wallsT * 1.15, .14))
    if floorT > 0: img = over(img, flat, mF[..., None] * wipe(DOOR, floorT * 1.12, .12))
    if furnT > 0:
        sh = np.roll(flatFull, int(round(lift)), axis=0); shm = np.roll(mFu, int(round(lift)), axis=0)[..., None]
        img = over(img, sh, shm * furnT)
        if flash > 0: img = over(img, np.full_like(img, 255), shm * flash)
    if lightT > 0:
        img = over(img, after, lightT)
        img = img + bloom[..., :3].astype(np.float32) * (bloom[..., 3:4] / 255) * bloomA
    if plus and 0 < band < 1:
        pos = band * 1.3 - .15; w = .10; d = DIAG - pos
        core = np.clip(1 - np.abs(d) / (w * .35), 0, 1) * .55 + np.clip(1 - np.abs(d) / w, 0, 1) * .28
        img = img + np.array([222, 244, 255], np.float32) * core[..., None]
        cx, cy = pos * W, pos * H; r = np.sqrt(((xx - cx) / (W * .55)) ** 2 + ((yy - cy) / (W * .55 * .18)) ** 2)
        img = img + np.array([210, 240, 255], np.float32) * np.clip(1 - r, 0, 1)[..., None] * .18
        # Staub (statisch, «eingeschwungen»)
        vis = (1 - lin(p, .30, .60)) * (.9 - .5 * lin(p, 0, .3))
        if vis > 0:
            for _ in range(300):
                x, y = rng.integers(0, W), rng.integers(0, H); a = (.25 + rng.random() * .5) * vis
                cv2.circle(img, (int(x), int(y)), int(1 + rng.random() * 1.2), (255, 255, 255), -1, cv2.LINE_AA) if a > .35 else None
    if settle > 0: img = img + np.array([230, 246, 255], np.float32) * settle
    s = 1 + .01 * p
    Mz = cv2.getRotationMatrix2D((W / 2, H / 2), 0, s); img = cv2.warpAffine(img, Mz, (W, H))
    return np.clip(img, 0, 255).astype(np.uint8)

PS = [.08, .26, .55, .92]; LAB = ['1 ROHBAU', '2 TECHNIK', '3 AUSBAU', '4 MOEBEL+LICHT']
cw, ch, gap, labw = 480, 268, 12, 90
board = np.full((2 * ch + 3 * gap + 40, labw + 4 * (cw + gap) + gap, 3), 17, np.uint8)
for r, plus in enumerate([False, True]):
    y0 = 40 + gap + r * (ch + gap)
    cv2.putText(board, 'B+' if plus else 'B', (18, y0 + ch // 2 + 10), cv2.FONT_HERSHEY_SIMPLEX, 1.1, (107, 166, 201), 2, cv2.LINE_AA)
    for c, p in enumerate(PS):
        x0 = labw + gap + c * (cw + gap)
        cell = cv2.resize(render(p, plus), (cw, ch), interpolation=cv2.INTER_AREA)
        board[y0:y0 + ch, x0:x0 + cw] = cell
        cv2.rectangle(board, (x0 + 6, y0 + 6), (x0 + 175, y0 + 26), (0, 0, 0), -1)
        cv2.putText(board, f'{LAB[c]}  p={p}', (x0 + 10, y0 + 21), cv2.FONT_HERSHEY_SIMPLEX, .42, (255, 255, 255), 1, cv2.LINE_AA)
cv2.putText(board, 'BauStern  ·  Rohbau -> Ausbau  ·  Variante B vs B+  ·  4 Phasen', (labw + gap, 28), cv2.FONT_HERSHEY_SIMPLEX, .6, (200, 200, 200), 1, cv2.LINE_AA)
cv2.imwrite(dst, board); print(dst, board.shape)
