# Sprint A — Промпты и режиссура (кадры «до», Bad, Flur, keyframe-to-video)

Единый принцип: **одна камера на всю сцену**. Все производные кадры (до / пусто / после) — image-edit на том же файле, никакой перегенерации сцены с нуля. Проверка совпадения: наложить Canny-края «после» на результат (скрипт `check-align.py`), допустимо ≤ 3 px сдвига линий пола/окна.

## 1. «До» из «после» (Rohbau reconstruction)

Исходник: `site/img/film/s/st-flash-after.jpg` → апскейл 1920 (Topaz Gigapixel «Standard v2», без face-recovery) → `after-1920.jpg`.

### 1.1 Flux Kontext / Nano Banana / Kling Image-Edit (предпочтительно — держат геометрию)
Prompt (EN, модели лучше держат англ.):
```
Same photo, same camera position, same lens, same window and framing. Transform the interior into an
unrenovated construction site (Rohbau): remove ALL furniture, decor, shelf, picture, pendant lamp, curtains
and rug. Walls: bare grey cement plaster with trowel marks, small cracks, exposed electrical conduit
(orange PVC tubes) and flush-mounted socket boxes at 30 cm height. Ceiling: raw concrete with formwork
seams. Floor: grey cement screed with dust, a few footprints, expansion joint. Window: same frame, glass
dusty, protective plastic sheeting taped on the frame. No people. Daylight only, overcast, no artificial
light, slightly cooler white balance, low contrast, fine dust in the air. Photorealistic, 35 mm lens,
f/8, ISO 400, documentary construction photo, Swiss apartment building, Zürich.
```
Negative: `furniture, people, text, watermark, warm lamp light, plants, curtains, painted walls, wood floor, blur, fisheye, changed perspective, new windows`
Настройки: guidance 3.5–4.5 (Kontext), strength/denoise 0.85–0.92 (чтобы стереть мебель, но оставить окно/геометрию); seed фиксировать; 3–5 семплов, выбор по `check-align.py`.

### 1.2 «Пусто» (после, но без мебели) — нужен для слоёв стен/пола
```
Same photo, same camera and lens. Remove all furniture, rug, vase, plants, shelf, picture and pendant lamp.
Keep walls, floor (oak parquet), curtains, window, radiator, light exactly as they are. Fill the empty areas
with the continuation of the parquet floor and the plain white plaster wall. Photorealistic, no new objects.
```
denoise 0.6–0.7 (только маска мебели + 24 px dilate, inpaint-режим).

### 1.3 SD/ControlNet-фоллбек (если edit-модели «уводят» перспективу)
- SDXL + ControlNet **depth (Depth-Anything-v2)** weight 0.8 + **canny** weight 0.45 (canny только структурные линии: стены/пол/окно; края мебели заранее стереть в canny-карте по маске furniture).
- Inpaint по маске «вся комната минус окно», denoise 0.9, промпт из 1.1. Refiner 0.25.

### 1.4 Промежуточная фаза «Technik» (опционально — реальный кадр вместо оверлея)
```
Same construction site photo, same camera. Now the electrical installation and screed are done:
orange conduits chased into walls, junction boxes, first coat of white base plaster on the left wall
(unfinished, patchy), fresh smooth grey anhydrite screed on the floor, radiator pipes visible under window.
```

## 2. Режиссура новых ключевых кадров

Общие параметры (все комнаты): **35 mm, f/2.8, высота камеры 1.35 м, горизонт по центру** (нулевой tilt — иначе вертикали сходятся и ломается Bauplan-оверлей), 3:2 → кроп 16:9. Ключевой свет **LED 3000 K** (тёплый, внутри), заполняющий — **окно 5600 K** (холодный). Контраст температур = глубина. Всегда **передний план** (10–15 % кадра, слегка не в фокусе) — это даёт параллакс-слой в C.5.

### 2.1 Bad (санузел) — сейчас «плоский»
```
Interior photo of a renovated small bathroom in a Zürich apartment, 35 mm lens f/2.8, camera height 1.35 m,
horizon centered. Foreground left: out-of-focus edge of a matte black towel rail with a folded linen towel
(10 % of frame). Midground: floating oak vanity with a white ceramic basin, large frameless mirror with
warm LED backlight (3000 K) glowing softly around its edge; the mirror reflects the opposite wall with
large-format light grey stone tiles and a walk-in glass shower with a black slim profile. Background:
narrow frosted window with cool daylight (5600 K) creating a rim light on the shower glass. Wet-look
tiles with subtle reflections, water droplets on the glass, a single eucalyptus branch. Shallow depth of
field, sharp on the basin, photorealistic, editorial architecture photography, no people, no text.
```
Проверки: в зеркале не должно быть камеры (промпт: `the mirror reflects the tiled wall, camera not visible`); вертикали параллельны — если нет, Perspective Correct в Lightroom (Upright «Vertical»), затем ре-кроп.
Слои для параллакса: `fg` (полотенце/рейл), `mid` (тумба+зеркало), `bg` (душ+окно) — SAM по боксам, экспорт как в `sam-masks.py`; фон под передним планом — inpaint 1.2.

### 2.2 Flur (коридор, Bauplan-сцена) — нужен «герой»
```
Renovated entrance hallway, Zürich apartment, 35 mm f/2.8, camera 1.35 m, horizon centered, one-point
perspective down the corridor. Foreground right: out-of-focus corner of a built-in white wardrobe door.
Midground: a single oak bench with a folded coat, a linear LED cove light (3000 K) running along the ceiling
edge towards the vanishing point, oak parquet continuing into the living room. Background: open door with
cool daylight (5600 K) from a window, glowing rectangle at the vanishing point. Clean white walls with
enough empty surface at the left for annotations, wide tonal range, photorealistic, no people, no text.
```
«Пустая стена слева» — обязательна: туда ложится хореография Bauplan (одна услуга-герой + оффер «Leerwohnung in 14 Tagen — Festpreis»).

## 3. Keyframe-to-video (пролёты)

Модели: Kling 2.1/2.5 (first+last frame), Veo 3.1 (first/last), Runway Gen-4 (first frame + prompt). На каждый пролёт **3 генерации**, выбор по: отсутствию «желе» на прямых линиях, стабильности окна, плавности скорости (не должно быть ускорения в конце).
- Ввод: first = стоп-кадр комнаты N (1920), last = стоп-кадр N+1. Длительность 5 с (Kling) / 8 с (Veo). 24 fps → интерполяция в B.
- Промпт (шаблон): `Slow, steady dolly forward and slight pan from the {room A} into the {room B}, camera height constant, no zoom, no cuts, no people, consistent daylight, photorealistic, architectural walkthrough, 35 mm`. Camera control (Kling): pan 0, tilt 0, zoom 0, «truck/dolly» ~ +3.
- Negative: `cut, flicker, morphing furniture, warping walls, text, people, camera shake, zoom burst`.
- Выходной кадр последнего кадра **не должен** заменять стоп-кадр N+1: hold-кадр всегда = оригинальный still (иначе шов). В плеере (C.1) hold берётся из того же мастера.

## 4. LUT / Color Grading
Параметры из HANDOFF: WB 4500 K, blacks 8, whites 246, HSL yellow −12, blue −14, split-tone тени H210 S8, grain 14/20/45 (grain — не в LUT, отдельно в ffmpeg `noise` или CSS `.grain`).
Скрипт `make-lut.py` → `baustern.cube` (33³), CSS-аппроксимация и GLSL-пасс — см. файл. Порядок применения в конвейере: апскейл → LUT (`lut3d`) → энкод; фото — тот же .cube в Lightroom/Photoshop (Color Lookup).
