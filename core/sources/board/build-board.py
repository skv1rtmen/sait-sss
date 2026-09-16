#!/usr/bin/env python3
# Baut board.html: Assets skalieren (Masken/Bloom 640 px, Fotos 1280 px), base64 in Template einsetzen.
import base64, io, os, sys
from PIL import Image
here = os.path.dirname(os.path.abspath(__file__)); out = f'{here}/out'
def b64(path, size=None, fmt=None, q=86):
    im = Image.open(path)
    if size: im = im.resize(size, Image.LANCZOS)
    fmt = fmt or ('PNG' if im.mode == 'RGBA' else 'JPEG')
    buf = io.BytesIO()
    if fmt == 'JPEG': im.convert('RGB').save(buf, 'JPEG', quality=q, optimize=True)
    elif fmt == 'WEBP': im.save(buf, 'WEBP', quality=q, method=6)
    else: im.save(buf, 'PNG', optimize=True)
    mime = {'JPEG': 'image/jpeg', 'PNG': 'image/png', 'WEBP': 'image/webp'}[fmt]
    return f'data:{mime};base64,' + base64.b64encode(buf.getvalue()).decode()
A = {
  'before': b64(f'{out}/layers/before.jpg', fmt='WEBP', q=82),
  'technik': b64(f'{out}/layers/technik.png', fmt='WEBP', q=90),
  'edges': b64(f'{out}/layers/edges.png', (640, 357), fmt='WEBP', q=80),
  'flat': b64(f'{out}/layers/after-flat.jpg', fmt='WEBP', q=84),
  'flatFull': b64(f'{out}/layers/after-flat-full.jpg', fmt='WEBP', q=84),
  'after': b64(f'{out}/layers/after.jpg', fmt='WEBP', q=86),
  'bloom': b64(f'{out}/layers/bloom.png', (640, 357), fmt='WEBP', q=80),
  'mWalls': b64(f'{out}/masks/walls.png', (640, 357), fmt='WEBP', q=85),
  'mFloor': b64(f'{out}/masks/floor.png', (640, 357), fmt='WEBP', q=85),
  'mFurn': b64(f'{out}/masks/furniture.png', (640, 357), fmt='WEBP', q=85),
  'mLight': b64(f'{out}/masks/light.png', (640, 357), fmt='WEBP', q=85),
}
html = open(f'{here}/board.template.html', encoding='utf-8').read()
for k, v in A.items(): html = html.replace('{{' + k + '}}', v)
dst = sys.argv[1] if len(sys.argv) > 1 else f'{here}/board.html'
open(dst, 'w', encoding='utf-8').write(html)
print(dst, round(len(html) / 1024), 'KB')
