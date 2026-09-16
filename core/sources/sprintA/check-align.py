#!/usr/bin/env python3
# Prüft, ob ein KI-abgeleiteter Frame («vorher», «leer», Technik) dieselbe Kamera hat wie das «nachher»-Standbild.
# Metrik: Kanten (Canny) von Boden-/Fensterlinien ohne Möbel; mittlere Verschiebung via ECC (Euclidean) + Overlay.
# Aufruf: python3 check-align.py after.jpg candidate.jpg overlay.jpg  → druckt dx, dy, Rotation, Score (≥ .55 gut)
import sys, numpy as np, cv2
a, b, out = sys.argv[1:4]
A = cv2.imdecode(np.fromfile(a, dtype=np.uint8), cv2.IMREAD_GRAYSCALE)
B = cv2.imdecode(np.fromfile(b, dtype=np.uint8), cv2.IMREAD_GRAYSCALE)
B = cv2.resize(B, (A.shape[1], A.shape[0]))
ea, eb = cv2.Canny(cv2.GaussianBlur(A, (0, 0), 2), 60, 160), cv2.Canny(cv2.GaussianBlur(B, (0, 0), 2), 60, 160)
warp = np.eye(2, 3, dtype=np.float32)
try:
    cc, warp = cv2.findTransformECC(cv2.GaussianBlur(A, (0, 0), 4).astype(np.float32) / 255, cv2.GaussianBlur(B, (0, 0), 4).astype(np.float32) / 255,
                                    warp, cv2.MOTION_EUCLIDEAN, (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 200, 1e-5), None, 5)
except cv2.error: cc = 0.0
dx, dy = warp[0, 2], warp[1, 2]; rot = np.degrees(np.arctan2(warp[1, 0], warp[0, 0]))
ov = cv2.cvtColor(A, cv2.COLOR_GRAY2BGR); ov[ea > 0] = (0, 255, 0); ov[eb > 0] = (0, 0, 255); ov[(ea > 0) & (eb > 0)] = (0, 255, 255)
ok, enc = cv2.imencode('.jpg', ov, [cv2.IMWRITE_JPEG_QUALITY, 90])
if ok: enc.tofile(out)
print(f'dx={dx:.2f}px dy={dy:.2f}px rot={rot:.3f}° score={cc:.3f}  →', 'OK' if cc > .3 and abs(dx) < 3 and abs(dy) < 3 and abs(rot) < .2 else 'REGENERATE (ECC fehlgeschlagen)' if cc == 0 else 'REGENERATE')
