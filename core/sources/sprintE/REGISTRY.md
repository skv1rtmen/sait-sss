# Sprint E — v15 «Berghaus» · реестр сцен и ассетов

Один дом во всех сценах: лиственничный стеклянный павильон на бетонном цоколе над скалой, море тумана, горы.
Палитра: бетон (board-formed), тёплая лиственница/дуб, чёрная тонкая сталь, латунный акцент.
Генерация: Google Flow (PRO), Nano Banana Pro (стиллы), Veo 3.1 Quality (клипы). Скачивание 2K (1K native + Google upscale; 4K требует смены тарифа — не покупаем).
Проект Flow: «сент. 15 - 01:30» (270cd58f-3119-4009-bc91-5a67d8cc00ac).

Мастера: `core/_incoming/` (raw из Downloads) → веб-деривативы: `site/img/film/s15/` (16:9), `s15p/` (9:16), `r15/` (клипы L), `mp15/` (клипы P).

| # | Сцена | still-L (16:9) | still-P (9:16) | clip-L | clip-P | Статус |
|---|-------|----------------|----------------|--------|--------|--------|
| 0 | KEY (ключевой вид дома) | Alpine_house_on_rocky_ridge (2K ✓) | Glass pavilion on concrete plinth (в Flow, не скачан) | — | — | референс |
| 1 | Ankunft — мостик к дому | Footbridge_leading_to_illuminate… (2K ✓) | Arrival_at_mountain_larch_pavilion (2K ✓) | Veo Quality 1080p ✓ (заканчивается у стеклянной двери) | Veo Quality 1080p ✓ | ✓ |
| 2 | Schwelle — стеклянная галерея вдоль скалы | Glass_gallery_looking_toward_mou… (2K ✓) | Gallery_interior_with_fog_and (2K ✓) | Dolly_shot_through_glass_gallery (Fast 1080p ✓) | Camera_moving_through_glass_gallery ✓ | ✓ |
| 3 | Küche — остров тёмный дуб/камень у панорамного окна | Kitchen_interior_with_island_and… (2K ✓) | Kitchen_overlooking_mountain_fog (2K ✓) | Camera_pushing_toward_mountain_w… ✓ (holdAt 3.0 с) | Camera_moving_toward_window_view ✓ | ✓ |
| 4 | Bad — тёплый камень + окно в горы | Limestone_bathroom_with_freestan… (2K ✓) | Bathtub_overlooking_mountain_fog (2K ✓) | Camera_pushing_toward_stone_bathtub ✓ (holdAt 2.5) | Stone_bathtub_viewing_mountains ✓ | ✓ |
| 5 | Schlafzimmer — дубовые рейки + остекление в туман | Minimal_bedroom_with_panoramic_w… (2K ✓) | Bedroom_interior_with_bed_and (2K ✓) | Camera_pushing_towards_foggy_window_…061601 ✓ | …063019 ✓ | ✓ |
| 6 | Wohnen — диван + угловое остекление + бетонный камин | Living_room_in_glass_pavilion (2K ✓) | Living_room_interior_with_mounta… (2K ✓) | Camera_moving_toward_mountain_view ✓ (holdAt 2.5) | Camera_moving_past_sofa_towards ✓ | ✓ |
| 7 | Rückblende — тот же ракурс Wohnen в стадии Rohbau | Concrete_room_under_construction (2K ✓) | Work_lamp_in_concrete_interior (2K ✓) | Camera_moving_through_concrete_room_…061427 ✓ (кадр 2.5 с → st-rohbau) | …062331 ✓ | ✓ (flash, без главы в кадрах) |
| 8 | Eingang — бетон, дубовая консоль, круглое зеркало, ключи | Entrance_hall_interior_architect… (2K ✓) | Entrance_hall_with_mirror_and_co… (2K ✓) | Forward_push-in_along_entrance_c… ✓ (holdAt 2.0) | Camera_moving_toward_mirror ✓ | ✓ |

Все 16 клипов скачаны (1080p) в `core/_incoming/v15/`, собраны `core/dev/v15-build.js` → `site/img/film/{f15,f15h,f15l,fp15,s15,s15p,r15,mp15}` (см. HANDOFF §11).

## v15.1 — пролёты между комнатами (Veo 3.1 first/last frame)

Первый кадр = холд предыдущей комнаты (`s15/st{k}.jpg` / `s15p/st{k}.jpg`, holdAt), последний = стилл следующей (`first{k+1}.jpg`).
Загрузка кадров в Flow: перехват `<input type=file>` + fetch с draft-URL (папка «Загрузки» проекта).

| Переход | L (16:9) | P (9:16) |
|---|---|---|
| Ankunft → Schwelle | Camera_gliding_through_glass_gal…_083754 (Quality, акк. 1) | …_091530 (Quality, акк. 2) |
| Schwelle → Küche | Camera_moving_through_gallery_ki…_084213 (Q) | Camera_gliding_through_glass_gal…_094720 (Q) |
| Küche → Bad | Camera_gliding_into_stone_bathroom_084434 (Q) | Camera_moving_through_bathroom_1080p_094545 (Q) |
| Bad → Schlafzimmer | Camera_moving_through_bedroom_co…_084310 (Q) | Camera_moving_through_apartment_…_095021 (Q) |
| Schlafzimmer → Wohnen | Camera_moving_through_living_pav…_093605 (Q, акк. 2; Fast-версия 084126 не используется) | …_093921 (Q) |
| Wohnen → Eingang | Camera_moving_through_corridor_1080p_093431 (Q; Fast 084054 не используется) | …_093751 (Q) |

Дополнительно на акк. 2: Küche push-in L в Quality (Camera_pushing_past_kitchen_island_092721) — заменяет Fast-версию.
Аккаунты: skv1rtmen69 — 36 бонусов, akakijmorozilka75 — <100. Rohbau-клипы в кадрах не используются (flash + Vorher/Nachher).

## v15.2 — интерьерные push-in в Quality (акк. 3 «Alex Weber», проект 13634778-a652-4c8c-a868-739e55dbf71a, 1080p)

| Сцена | L (16:9) | P (9:16) |
|---|---|---|
| Schwelle | Camera_moving_toward_fog_mountains_162047 (edit 3a38e598) | Dolly_shot_towards_foggy_mountains_162958 (65f2077c) |
| Küche | Camera_pushing_past_kitchen_island_092721 (v15.1, акк. 2) | Camera_moving_toward_window_view_161954 (21f3ec8a) |
| Bad | Camera_moving_toward_stone_bathtub_164608 (179dd6fb) | Stone_bathtub_overlooking_mountains_1080p_161932 (44998e61) |
| Schlafzimmer | Camera_pushing_towards_foggy_window_162020 (18148494) | **Fast** …063019 — бонусов не хватило (~50 < 100) |
| Wohnen | Camera_moving_toward_mountain_view_164702 (49cb929a) | Camera_moving_towards_mountain_view_162004 (6c48ebac) |
| Eingang | Camera_moving_down_hallway_corridor_164636 (1f098396) | Camera_pushing_towards_mirror_co…_164450 (d6599366) |

Итого Quality: Ankunft L+P, 12 переходов, 11 из 12 интерьерных push-in.

## v16 — стиллы с проёмами + переходы «через дверь» (16.09.2026, акк. makafon ashh `/u/1/`, проект 743c04fd-d82f-428f-9df2-12f52e4418b5; 2 клипа на акк. «Дима Пупкин» `/u/0/`, проект a0a0e0dd-71cd-4003-86e2-244a8ee7691f)

Мастера: `core/_incoming/v16/`. Стиллы — Nano Banana Pro с референсом на старый стилл (бонусы не тратит), 2K, 16:9 и 9:16; портрет делался из 16:9 через image-edit «Vertical 9:16 version… pan so the doorway is fully visible».

| Сцена | 16:9 | 9:16 | Что добавлено |
|---|---|---|---|
| Ankunft | старый `s15/first0.jpg` | старый `s15p/first0.jpg` | дверь уже видна |
| Schwelle | schwelle-L_2K_…015436 | schwelle-P_2K_…015541 | проём в кухню в конце галереи (справа) |
| Küche | kueche-L_2K_…015220 | kueche-P_2K_…015341 | проём в бад слева |
| Bad | bad-L_2K_…014733 | bad-P_2K_…015122 | проём в спальню справа |
| Schlafzimmer | schlaf-L_2K_…014456 | schlaf-P_2K_…014622 | открытый проход в гостиную (без двери) |
| Wohnen | wohnen-L_2K_…014303 | wohnen-P_2K_…014143 | проём в коридор слева от камина |
| Rückblende (Rohbau) | wohnen-rohbau-L_2K_…014329 | wohnen-rohbau-P_2K_…014040 | тот же ракурс, стройка |
| Eingang | старый `s15/first7.jpg` | старый `s15p/first7.jpg` | — |

Переходы Veo 3.1 Quality, first/last frame = стиллы выше, 8 с, 1080p (24 fps), промпт: 0.5 с покоя → к проёму → через порог → замедление → точно последний кадр.

| Переход | L (16:9) — edit id | P (9:16) — edit id |
|---|---|---|
| Ankunft → Schwelle (дверь открывается) | t_ankunft-schwelle-L_…025745 (1b0dd90c) | t_ankunft-schwelle-P_…025455 (8e3cea11) |
| Schwelle → Küche | t_schwelle-kueche-L_…023215 (92e57e9b) | t_schwelle-kueche-P_…034203 (fd988681, акк. Дима Пупкин; первая версия cc72e141 «плавала» по кухне → `_incoming/v16/_rejected/`) |
| Küche → Bad | t_kueche-bad-L_…025829 (20b978f7) | t_kueche-bad-P_…025334 (e69623ca) |
| Bad → Schlafzimmer | t_bad-schlaf-L_…023428 (06c5cd9d) | t_bad-schlaf-P_…031503 (f4d17a1f, акк. Дима Пупкин) |
| Schlafzimmer → Wohnen (открытый) | t_schlaf-wohnen-L_…025904 (edcafa22) | t_schlaf-wohnen-P_…031719 (82b38ed8, акк. Дима Пупкин) |
| Wohnen → Eingang | t_wohnen-eingang-L_…022745 (d2ab5591) | t_wohnen-eingang-P_…025240 (ec81f841) |

Бонусы: makafon 1050 → 50 (10 × 100); Дима Пупкин: 3 × 100 (остаток — резерв на переделки). Реверсы — ffmpeg, не генерируются.
Веб-деривативы: `core/dev/v16-build.js` → `site/img/film/v16/clips/<a>-<b>-<L|P>.{fwd,rev}.mp4` (h264 crf19, 24 fps, faststart, ~6–12 МБ каждый — на этапе 2 добавить лёгкий tier crf23/720p) + `.first.jpg/.last.jpg`; `site/img/film/v16/stills/<room>-<L|P>.jpg` (1920×1080 / 1080×1920) + `-1280.jpg` + `.webp`. Rückblende — без клипа (шторка до/после на стоп-кадре). Старые Fast-файлы остаются в `core/_incoming/v15/` (не используются, маппинг по timestamp в `v15-map.json`).

Бюджет бонусов Flow: было 956 → Ankunft L+P на Veo 3.1 Quality (2×100), остальные 14 клипов на Veo 3.1 Fast (14×20=280). Quality для всех 16 стоил бы 1600 — не хватает без смены тарифа (не покупаем без согласования). Все клипы 8 с, скачивание 1080p (upscale).

Заметки:
- Один запрос «Generate TWO separate images… 16:9 / 9:16» даёт обе ориентации за раз (проверено на Ankunft) — используем для всех сцен.
- Файлы в Downloads именуются по заголовку тайла (`<Title>_2K_<timestamp>.jpeg`); маппинг в `core/dev/portrait-map.json` (v15 секция).


## v16b — согласованная цепочка «один дом» (16.09.2026, акк. «Дима Пупкин» `/u/2/`, проект a0a0e0dd-71cd-4003-86e2-244a8ee7691f)

Мастера: `core/_incoming/v16b/`. Картинки — Nano Banana 2 (бонусы не тратит), видео — Veo 3.1 Quality, 6 × 100 = 600 бонусов (остаток 150).

| Кадр | Файл | Что в проёме |
|---|---|---|
| Ankunft | ankunft-L_2K_open.jpeg | открытая дверь → коридор Schwelle; объём дома приведён к интерьеру |
| Schwelle | (без изменений, v16) | кухня справа |
| Küche | kueche-L_2K_bathdoor.jpeg | ванная слева |
| Bad | bad-L_2K_beddoor.jpeg | спальня справа |
| Schlafzimmer | schlaf-L_2K_livedoor.jpeg | гостиная в проходе |
| Wohnen | wohnen-L_2K_halldoor.jpeg | коридор ко входу слева |
| Rohbau | wohnen-rohbau-L_2K.jpeg | тот же ракурс, стройка |
| Eingang | (без изменений, v16) | — |

Переходы (только L, портрет получается кадрированием): t_ankunft-schwelle-L, t_schwelle-kueche-L, t_kueche-bad-L,
t_bad-schlaf-L, t_schlaf-wohnen-L, t_wohnen-eingang-L — все 1080p, 8 с, «Кадры» first/last, x1.

Сборка: `node core/dev/v16b-build.js` (env V16_ONLY=clips|stills|lite|verify). Портретное окно 608×1080,
позиции PX в скрипте. Стыки PSNR 41,5–75 dB — см. `core/dev/_v16b-build.log`.
