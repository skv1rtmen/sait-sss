#!/usr/bin/env python3
"""
BauStern Grade → .cube (33³), CSS-Approximation, GLSL-Pass.
Parameter (HANDOFF §8): WB 4500 K (auf 6500-K-Referenz → leicht kühler), Blacks 8 / Whites 246,
HSL Yellow −12 % / Blue −14 % Sättigung, Split-Tone Schatten H210 S8, Kontrast-S-Kurve leicht.
Aufruf: python3 make-lut.py baustern.cube [--preview in.jpg out.jpg]
"""
import sys, numpy as np

def kelvin_rgb(k):  # Tanner Helland, 1000–40000 K → RGB 0..1
    t = k / 100.0
    r = 255 if t <= 66 else 329.698727446 * ((t - 60) ** -0.1332047592)
    g = 99.4708025861 * np.log(t) - 161.1195681661 if t <= 66 else 288.1221695283 * ((t - 60) ** -0.0755148492)
    b = 255 if t >= 66 else (0 if t <= 19 else 138.5177312231 * np.log(t - 10) - 305.0447927307)
    return np.clip(np.array([r, g, b]) / 255, 0, 1)

def srgb_to_lin(c): return np.where(c <= .04045, c / 12.92, ((c + .055) / 1.055) ** 2.4)
def lin_to_srgb(c): return np.where(c <= .0031308, c * 12.92, 1.055 * np.power(np.clip(c, 0, None), 1 / 2.4) - .055)

def rgb_to_hsv(rgb):
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    mx, mn = rgb.max(-1), rgb.min(-1); d = mx - mn
    h = np.zeros_like(mx)
    m = d > 1e-8
    rc, gc, bc = (mx - r) / np.where(m, d, 1), (mx - g) / np.where(m, d, 1), (mx - b) / np.where(m, d, 1)
    h = np.where(mx == r, bc - gc, np.where(mx == g, 2 + rc - bc, 4 + gc - rc))
    h = np.where(m, (h / 6) % 1, 0)
    s = np.where(mx > 1e-8, d / np.where(mx > 1e-8, mx, 1), 0)
    return h, s, mx
def hsv_to_rgb(h, s, v):
    i = np.floor(h * 6).astype(int) % 6; f = h * 6 - np.floor(h * 6)
    p, q, t = v * (1 - s), v * (1 - s * f), v * (1 - s * (1 - f))
    r = np.choose(i, [v, q, p, p, t, v]); g = np.choose(i, [t, v, v, q, p, p]); b = np.choose(i, [p, p, t, v, v, q])
    return np.stack([r, g, b], -1)

def grade(rgb, strength=1.0):
    """rgb: (...,3) sRGB 0..1 → gegradet sRGB 0..1"""
    lin = srgb_to_lin(rgb)
    # 1 Weissabgleich: Aufnahme-Referenz 6500 K, Ziel 4500 K → Multiplikator, auf Grün normiert, halbe Stärke
    wb = kelvin_rgb(6500) / kelvin_rgb(4500); wb = wb / wb[1]; wb = 1 + (wb - 1) * .5 * strength
    lin = lin * wb
    # 2 Leichte S-Kurve (Kontrast +6 %) um Mittelgrau, im sRGB-Raum
    s = lin_to_srgb(np.clip(lin, 0, 1))
    s = np.clip(.5 + (s - .5) * (1 + .06 * strength), 0, 1)
    # 3 Levels: Blacks 8 → Output-Schwarz 8/255, Whites 246 → Output-Weiss 246/255 (weiche Schulter)
    lo, hi = 8 / 255 * strength, 1 - (1 - 246 / 255) * strength
    s = lo + s * (hi - lo)
    # 4 HSL: Gelb −12 % (Hue 45–75°), Blau −14 % (Hue 200–260°), weiche Hue-Gewichtung ±20°
    h, sat, v = rgb_to_hsv(np.clip(s, 0, 1))
    def hw(center, width):  # Gewicht 1 im Zentrum, 0 am Rand (+/- width), zyklisch
        d = np.abs(((h * 360 - center + 180) % 360) - 180); return np.clip(1 - d / width, 0, 1)
    sat = sat * (1 - .12 * strength * hw(60, 35)) * (1 - .14 * strength * hw(230, 45))
    s = hsv_to_rgb(h, sat, v)
    # 5 Split-Tone Schatten: Hue 210°, Sättigung 8 %, Gewicht (1 − Luma)²
    luma = .2126 * s[..., 0] + .7152 * s[..., 1] + .0722 * s[..., 2]
    tint = hsv_to_rgb(np.full_like(luma, 210 / 360), np.full_like(luma, 1.0), np.ones_like(luma))  # reines Blau-Cyan
    w = ((1 - luma) ** 2 * .08 * strength)[..., None]
    s = s + (tint - s) * w
    return np.clip(s, 0, 1)

def write_cube(path, n=33):
    g = np.linspace(0, 1, n)
    b, gg, r = np.meshgrid(g, g, g, indexing='ij')          # .cube: R läuft am schnellsten
    rgb = np.stack([r, gg, b], -1).reshape(-1, 3)
    out = grade(rgb)
    with open(path, 'w') as f:
        f.write('TITLE "BauStern Grade v1"\nDOMAIN_MIN 0 0 0\nDOMAIN_MAX 1 1 1\nLUT_3D_SIZE %d\n' % n)
        np.savetxt(f, out, fmt='%.6f')
    print('wrote', path, n ** 3, 'entries')

CSS = """/* CSS-Approximation (nur für Fotos außerhalb des Films; im Film NIE filter auf Vollbild) */
.grade{filter:contrast(1.02) saturate(.94) sepia(.04) hue-rotate(-3deg) brightness(1.01)}"""
GLSL = """// WebGL Color-Grade-Pass (Fragment): 3D-LUT als 2D-Textur (33×33 Kacheln, 1089×33) — tetra-freie trilineare Näherung
precision mediump float; uniform sampler2D uTex, uLut; uniform float uStrength; varying vec2 vUv;
vec3 lut(vec3 c){ float n=33.0; vec3 s=c*(n-1.0); float b0=floor(s.b), b1=min(b0+1.0,n-1.0), f=s.b-b0;
  vec2 uv0=vec2((b0*n+s.r+0.5)/(n*n),(s.g+0.5)/n), uv1=vec2((b1*n+s.r+0.5)/(n*n),(s.g+0.5)/n);
  return mix(texture2D(uLut,uv0).rgb, texture2D(uLut,uv1).rgb, f); }
void main(){ vec4 c=texture2D(uTex,vUv); gl_FragColor=vec4(mix(c.rgb,lut(clamp(c.rgb,0.0,1.0)),uStrength),c.a); }"""

if __name__ == '__main__':
    dst = sys.argv[1] if len(sys.argv) > 1 else 'baustern.cube'
    write_cube(dst)
    open(dst.replace('.cube', '.css'), 'w').write(CSS); open(dst.replace('.cube', '.glsl'), 'w').write(GLSL)
    if '--preview' in sys.argv:
        import cv2
        i = sys.argv.index('--preview'); src, out = sys.argv[i + 1], sys.argv[i + 2]
        im = cv2.cvtColor(cv2.imread(src), cv2.COLOR_BGR2RGB).astype(np.float32) / 255
        g = grade(im)
        both = np.concatenate([im, g], 1)
        cv2.imwrite(out, cv2.cvtColor((both * 255).astype(np.uint8), cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 90]); print('preview', out)
