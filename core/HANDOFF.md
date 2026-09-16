# BauStern — HANDOFF v10 → следующая сессия

Дата: 2026-09-10. Автор: Claude (Cowork-сессия с Сержио). Этот документ — единственный источник правды
для продолжения работы в новой сессии. Всё, чего здесь нет, в контексте новой сессии не существует.

---

## 0. Как стартовать новую сессию (5 шагов)

1. Загрузить в новую сессию ТРИ архива (лимит вложения 30 МБ, поэтому пакет разбит):
   - `baustern-site-v9_2.zip` — деплой-папка (index.html в корне) → распаковать в `/mnt/user-data/working/site/`
   - `baustern-handoff-core.zip` — HANDOFF.md, NEW-SESSION-PROMPT.md, `dev/`, `docs/`, `sources/` (buildfilm.py, спеки, фото «до», контактные листы)
     → распаковать в `/mnt/user-data/working/`
   - `baustern-handoff-film-v6.zip` — 7 исходных AI-клипов (`sources/film-v6/`) → распаковать в `/mnt/user-data/working/`
     (опционально `baustern-handoff-film-early.zip`: ранние 4 клипа + склейка v1 — нужны только для истории)
2. Итоговая структура: `working/site/`, `working/dev/`, `working/sources/`, `working/docs/`, `working/HANDOFF.md`.
3. `cd /mnt/user-data/working && npm i playwright@1.62 --no-save` (если `node_modules` нет). Chromium в песочнице:
   `/opt/pw-browsers/chromium-1194/chrome-linux/chrome` (все скрипты в `dev/` используют этот путь через `EXE`).
4. Запустить dev-сервер: `nohup node dev/static-srv.js > /tmp/srv.log 2>&1 &` → `http://localhost:8099/`
   (сервер отдаёт `site/`, эмулирует Netlify: `/kontakt` → `kontakt.html`, SPA-fallback → `index.html`).
   ВАЖНО: `static-srv.js` ожидает папку `site/` рядом с собой ИЛИ на уровень выше — см. константу `root` в файле.
5. Прогнать smoke: `node dev/route-test.js` (роутинг), `node dev/flight-test.js` (полёты), `node dev/crawl-v9.js`
   (31 route × 3 вьюпорта, ~5 мин). Всё должно быть зелёным до любых правок.

Стартовый промпт для новой сессии — в `NEW-SESSION-PROMPT.md` (скопировать целиком в первое сообщение).

---

## 1. Проект и контекст

- **Что:** сайт строительной фирмы BauStern (Цюрих, CH), B2B (Hausverwaltungen, Generalunternehmer, Gewerbe).
  Язык сайта — немецкий (Швейцария): «ss» вместо «ß», CHF, всегда Sie-форма. Комментарии в коде — по-немецки (традиция проекта).
- **Стек:** vanilla JS + CSS, без сборки. GSAP 3.12 + ScrollTrigger + Lenis 1.3.26 (локально в `site/vendor/`).
  Шрифты self-hosted (`vendor/fonts.css`, Archivo + Instrument Sans).
- **Хостинг:** Netlify (drag-and-drop папки `site/` → deploy). Тестовый URL: `illustrious-crumble-5efc09.netlify.app`.
  Домен `baustern.ch` ещё указывает на старый Vercel — переключение на Netlify не сделано (задача клиента).
  В деплое виден бейдж «Powered by Netlify» — это настройка Netlify (Site settings → Netlify badge), не код.
- **Заказчик/пользователь:** Сержио (русскоязычный). Владелец фирмы — Artem Kozlovskyi (подпись «AK» в сцене Eingang).
- **Стиль общения с Сержио:** коротко, прямо, без воды и вступлений, по-русски; критика приветствуется;
  никаких «Отличный вопрос». Он предпочитает: сделать → показать скриншоты/метрики → короткий отчёт.
- **Протокол работы (его требование):** автономно, без промежуточных вопросов (кроме реальных развилок),
  каждое изменение проверяется в реальном браузере (Playwright) на 375 / 768 / 1440, консоль и сеть чистые,
  в конце — структурированный отчёт с метриками. Задачи вести через TaskCreate/TaskUpdate.

### Внешние сервисы (ничего не ломать, ничего реального не отправлять)
- Лиды: `POST https://n8n.baucrm.net/webhook/web-anfrage` (все формы через `sendLead()` в app.js),
  `…/webhook/datenschutz-klick` (лог кликов по Datenschutz из формы), `…/webhook/bewerten` (Bewertung).
  **В тестах ВСЕГДА стабить:** `page.route(/n8n\.baucrm\.net/, r=>r.fulfill({status:200,body:'{"ok":true}'}))`.
- Отзывы: Supabase `https://ebnlafxzsjinngfbmoxc.supabase.co` (anon key в `reviews-live.js` — публичный по дизайну, read-only кэш).
  В песочнице внешняя сеть режется прокси → в консоли `ERR_TUNNEL_CONNECTION_FAILED` — это НЕ баг сайта, фильтровать в тестах.
- Calendly `https://calendly.com/baustern-info/booking`, WhatsApp `wa.me/41765249898`, тел. +41 76 524 98 98.

---

## 2. Карта файлов (`site/` = корень деплоя, `index.html` ОБЯЗАН лежать в корне архива для Netlify)

```
site/
  index.html            shell + <base href="/"> + prerendered home между <!--prerender:start-->…<!--prerender:end-->
  <route>.html          31 вырендеренных страниц (tools/prerender.js) — НЕ править руками
  _redirects            генерируется prerender.js: /kontakt → /kontakt.html 200 … , последняя строка /* /index.html 200
  _headers              security-заголовки + immutable cache для img/film и vendor
  sitemap.xml, robots.txt, site.webmanifest
  _tools/prerender.js   prerender (запуск из site/: node _tools/prerender.js) + README.md (инструкция и настройка аналитики)
  css/site.css (1378 строк)  css/lightbox.css
  js/data.js (630)      ВЕСЬ контент и конфиг: CO (контакты), SVC (6 ремёсел), SOL, WORKS (20 работ), PROJECTS, REGION_SEO,
                        WISSEN, STEPS, RICHTWERTE/EST_RANGE (калькулятор), REVIEWS, FILM (сцены, кадры, режимы), ANALYTICS
  js/analytics.js (80)  dataLayer + GA4/GTM + Consent Mode v2 + хуки событий
  js/pages.js (918)     шаблоны страниц: pHome (wStage, wRoom, w-sheet), pLeistungen, pLoesungen, pReferenzen, pProjekt,
                        pUeber, pWissen*, pKontakt, pKarriere, pBewertung, pRegionSeo, pImpressum, pDatenschutz, META (title/description)
  js/app.js (797)       Smooth (Lenis-обёртка: to/fly/stop/start/lenis), History-роутер, render(), формы, Rückruf, Lightbox,
                        калькулятор (initEstimate), сегменты (initSegments), works-grid (renderWorks), glassify(), boot()
  js/film.js (714)      движок «Die Wohnung ist die Seite»: кадры, интро-видео, полёты, хотспоты, Bauplan, подпись, звук
  js/fx.js (129)        spotlight, tilt (делегированный, MutationObserver), odometer, signature (stroke-dashoffset), shine
  js/motion.js (241)    Motion.mount/unmount: reveals (.rv), group stagger, splitHeads, marquee, SheetKit (fade/wipe/grow)
  js/plan.js            мини-план квартиры (#wPlan) — подсветка активной комнаты
  js/reviews-live.js    подмена REVIEWS данными из Supabase
  img/                  фото проектов (JPG, 29 шт.), бренд-ассеты (favicon.svg, favicon-32.png, apple-touch-icon.png, icon-512.png, og-image.jpg)
  img/film/f/f0000..f0383.webp   384 кадра 1280×720 (~12 КБ)   ← ИЗ 8 fps ЭКСТРАКЦИИ (см. §6)
  img/film/fl/…                  384 кадра 960×540 (~7 КБ), слабые устройства / плейсхолдер
  img/film/s/st0..st6(-p).jpg    стоп-кадры (lite-режим, телефон) + st-flash-after(-p).jpg (сцена Rohbau «после»)
  img/film/intro.mp4 (H.264 CRF26, ~1.0 МБ) intro.webm (VP9, ~1.1 МБ) poster.jpg   интро = клип C1, easeIO вшит, 60 fps
  vendor/  gsap.min.js ScrollTrigger.min.js lenis.min.js fonts.css fonts/
```

Порядок скриптов в `index.html` (все `defer`): gsap, ScrollTrigger, lenis, data.js, **analytics.js**, reviews-live.js,
pages.js, plan.js, film.js, fx.js, motion.js, app.js. analytics.js обязан идти ДО app.js (первый page_view — от роутера).

```
dev/   (не деплоится)  static-srv.js · bench.js · bench-scroll.js · crawl-v9.js · route-test.js · analytics-test.js ·
                       flight-test.js · hybrid-test.js · fling.js (реалистичный wheel-флинг) · arrive-test.js · sig-test.js ·
                       load-ready.js · shots-v9.js · final-home-check.js · nojs-check.js · visual-check.js · feat-test.js ·
                       tools/prerender.js (копия) · package.json
sources/ film-v6/v6-c1..c7.mp4 (7 AI-клипов 1280×720 24 fps 8 с — ЕДИНСТВЕННЫЙ исходник фильма)
         film-clips/ (ранние 4 клипа), baustern-rundgang-v1.mp4 (склейка v1), film-src/ (реальные фото стройки a_*/b_* «до»)
         buildfilm.py (как из клипов делаются кадры: fps=8, unsharp, WebP q78/q72, стоп-кадры, индексы в data.js)
         gen-brand-assets.js · SPEC.md · SPEC-v6.md · film-sheet/ (контактные листы клипов)
docs/    baustern-audit.html (экспертный аудит, v8.4) · bogen-konzept.html (борд вариантов A/B/C/D карточек) · baustern-v8-spec.html
```

---

## 3. Архитектура — что как работает (ключевые факты, без которых сломаешь)

### 3.1 Роутер (app.js) — History API, с v9
- `ROUTES` (map name → template), `parseRoute(src)` принимает путь, `#/…` или null (берёт `location.pathname`, старый `#/` хэш имеет приоритет).
- `go(g)` → `history.pushState` + `navigateTo()` (curtain-transition ≈ 0.9 с). `popstate` → `navigateTo(parseRoute(location.pathname))`.
- Старые `#/kontakt` → `replaceState` на `/kontakt` в `boot()` и на `hashchange`.
- Клик по `a[data-go]`: preventDefault только для внутренних href (`/…`, `#/…`); с Ctrl/⌘/Shift — нативная навигация (на prerendered-файл).
- `setMeta(route)` ставит title, description, canonical, og:url/title/description, twitter:*; 404 → `noindex,follow`, без canonical.
- `render()` снимает `data-prerender` с `#view` (prerendered-контент заменяется), диспатчит `bs:route` (analytics).
- Все ссылки в `pages.js/data.js/index.html` — `href="/…"`; `<base href="/">` в head (относительные пути к img/vendor работают на глубоких URL).
- `linkify(root)` дописывает href для `a[data-go]` без href.

### 3.2 Prerender (site/_tools/prerender.js)
- Поднимает свой сервер на :8131, блокирует gsap/ScrollTrigger/lenis → страница рендерится в `no-gsap` режиме (всё видно, без inline-стилей),
  снимает `#view.innerHTML` для каждого ключа `META` (кроме notfound), пишет `<route>.html` из шаблона `index.html`
  (title/description/canonical/og/twitter подменяются), home — внутрь `index.html` между маркерами. Идемпотентен.
- Генерирует `_redirects` и `sitemap.xml` (29 URL, без impressum/datenschutz). Отчёт `prerender-report.json`.
- **Запускать после каждой правки pages.js / data.js / css / index.html перед деплоем.** Live-приложение от этого не зависит.
- CSS `#view[data-prerender] .rv{opacity:1}` + `<noscript>` (прячет прелоадер) → страницы читаемы без JS.

### 3.3 Аналитика (analytics.js + `ANALYTICS` в data.js)
- `ANALYTICS={ga4Id:'',gtmId:'',debug:false}` — ОБА ПУСТЫЕ (клиент ещё не дал ID). При пустых ничего не грузится, dataLayer заполняется.
- Consent Mode v2 default = всё denied (cookieless), `Analytics.consent({analytics:true})` — хук для будущего баннера. DNT уважается.
- События: page_view (через `bs:route`), cta_offerte, callback_open/submit, generate_lead (в `sendLead()` — form: anfrage|rueckruf|referenzmappe|karriere),
  form_error (validation/send), phone/whatsapp/email/calendly_click, gallery_open/filter/more, segment_select, calc_use, tour_room (film.js, full+lite),
  scroll_depth 25/50/75/100, outbound_click. Дедуп 800 мс по name+params. Кастомные события из кода: `document.dispatchEvent(new CustomEvent('bs:event',{detail:{name,params}}))`
  или хелпер `trackEv(name,params)` в app.js.
- Datenschutz-текст обновлён под GA4/Consent Mode (pages.js, «Cookies & Tracking»).
- GTM-режим: page_view НЕ должен слаться GA4-тегом (уже есть от роутера) — написано в `_tools/README.md`.

### 3.4 Движок фильма (film.js) — full-режим (desktop ≥1000px, тонкий указатель)
Структура DOM (pages.js `wStage()`): `.w-stage(fixed)` → `.w-cam` (poster, canvas, stills, w-cmp) · `.w-shade` · **`.w-hot` (хотспоты, z6, вынесен из .w-cam в v9.1 — иначе текст перекрывал клики)** · `.w-popm` · `.w-ov` (текст сцены, z5) · `.w-sig` · `.w-scrollhint` · `.w-fly` (индикатор полёта). Рядом: `.w-roomnav` (точки + `#wSound`), `#wHud` (вертикальный HUD, виден только когда карточка закрывает фильм), `.w-marks`, `#wPlan`.
`.w-cam` и `.w-hot` получают ОДИН и тот же transform (drift + cursor-parallax) в `render()`.

Кадры и память:
- `FILM` (data.js): `frames:384, dir/dirLow, introEnd:63, scenes[]` с `f` (стоп-кадр): kueche 63 · flur 127 · bad 191 · schlaf 255 · wohnen 319 · rohbau 319 (flash-сцена: фото «до» + compare-слайдер) · eingang 383 (sig:true).
- `pickDir()`: слабое устройство (≤4 ядер / ≤4 ГБ / saveData / ширина <1200) → `dirLow`. В headless Playwright ВСЕГДА low (4 ядра) — учитывать при бенчмарках.
- Blob-кэш всего фильма (`prefetchAllBlobs`, идёт после интро, с паузой пока `is-driving`, `fetch priority:'low'`), ImageBitmap-кэш `bm` (окно: пред./тек./след. пролёт), `prune()`.
- `pickFrame(k, drawnK)` — монотонный выбор: если кадр не загружен, берётся ближайший загруженный МЕЖДУ последним нарисованным и целью, иначе держим последний (нет прыжков). `failed`-set против бесконечных refetch.
- Суб-кадровый блендинг: `drawFrame(cv,ctx,im,im2,t)` — два drawImage с alpha по дробной части `frame`.
- Первый пролёт (63→127) грузится ВО ВРЕМЯ интро-видео (после `play()` +0.5 с low, +1.4 с full).

Скролл-геометрия: каждая комната = блок высотой `roomVh`=2.1vh (room0 = 1.2vh). Прогресс `p` 0..1; `CAM=camFrac=.45`:
`p<CAM` — пролёт (`frame=lerp(prev.f, sc.f, easeIO(p/CAM))`), `p≥CAM` — dwell (стоп-кадр, `--reveal` → текст). `REVEAL=max(CAM,.35)`.
ScrollTrigger на каждой комнате: `scrub:1`, `snap` только без Lenis; `onUpdate → updateRoom(i,p)` → `flightCheck(i,p)`; `onEnter/Back → setupRoom(i)`.

**Полёты («Стации», v9.1–9.2), только с Lenis:**
- `FLY` = Smooth.on && flyMode≠'scrub'; `HYBRID` = flyMode==='hybrid' (по умолчанию). Конфиг data.js: `flyMode:'hybrid'|'auto'|'scrub'`, `flyDur:2.2`, `flyFast:380`.
- Зоны на комнату: `top`(p≤.002) / `fly` / `scrub` / `dwell`(p≥CAM−.002), Map `zone`.
  Вход в зону из `top`: `fast()` (сумма |deltaY| wheel за 120 мс > flyFast) → `startFlight(i,+1)`, иначе `scrub`.
  Из `dwell` назад дальше 3 % → fast → `startFlight(i,−1)`, иначе `scrub`. В `scrub` при ускорении → полёт в направлении `wheelDir`.
- `startFlight`: `Smooth.fly(target,{duration})` = Lenis `scrollTo(…, {easing:linear, lock:true, force:true})` — ввод заблокирован; кадр всё равно считается из p (easeIO даёт кинематографичность). Длительность масштабируется по оставшемуся пути (мин .7 с).
  Во время полёта: `.is-flying` на `#wohnung`, `#wFly` показывает «→ Раум» и линию `--fly` 0..1, `Sound.whoosh`. По завершении: `Sound.tick`, `zone` = dwell|top, при вперёд — `settle()`.
- `settle()`: `Smooth.stop()` пока приходят wheel-события (интервал <150 мс, максимум 1.4 с) → проглатывает инерцию трекпада; затем `Smooth.start()`.
- Lenis-snap (`armSnap/trySnap`): после 160 мс покоя, только если Lenis сам остановился, не во время полёта: в зоне пролёта тянет к 0 или CAM по направлению; в dwell дальше CAM+6 % не трогает.
- `gotoRoom(idx)` (точки, клавиши ←→/J/K): Lenis-полёт к верху комнаты (+3 px) с `navLock`, затем `startFlight(idx,+1)`.
- ST-snap-конфликт с Lenis (два писателя scrollY) был причиной «зависания на стоп-кадре» — не возвращать `snap:{…}` при Lenis.
- **Тест-харнесс:** Playwright `mouse.wheel` даёт события раз в ~90 мс → `fast()` никогда не сработает. Для флингов использовать `dev/fling.js` (диспатч WheelEvent в странице каждые 12 мс).

Интро: `<video class="w-intro">` (mp4+webm) в `.w-cam`, `muted playsinline`, стартует на `canplaythrough/loadeddata`; `vFinish` на `ended` ИЛИ страховочный таймаут `duration+1.5 с`; фоллбек `bitmapIntro()` (кадры), пропуск при медленной сети (`INTRO_WAIT` 2200 мс). Passing к кадру 63 — известный шов (см. §7 п.1).

Подпись (sig, сцена Eingang): FSM в updateRoom — `p≥CAM && !sigRan && !sigTimer` → таймер 420 мс → `svg._sigRun()`; при `p<CAM−.02` → reset. fx.js `signature()`: темп 150 px/s, `cubic-bezier(.45,.05,.55,.95)`, стаггер 85 %. `.w-sig` видим только `:not(.is-driving)`.

Хотспоты/Bauplan: `buildHotspots()` строит `.w-hs` (лейбл+попап) и `.w-ann` (SVG-линии Bauplan для сцены Flur, `ann[]` в data.js с no/t/go/x/y/lx/ly/side/d/f); `placeHotspots()` — transform по геометрии cover-fit. Lite-режим (`place()`): лимит высоты хотспотов от реальной кромки `.w-ov` (−64 px), не влезающие скрываются.

Прочее: `cover()` считает перекрытие карточками → `--cov`, `--ovo`, `.is-covered` на `#wohnung`, `html.in-film` (истинно когда фильм видим; прячет `#totop`, включает клавиши). `setHud(i)`. Cursor-parallax `par` (±.6 %/.4 %, lerp .07). `Sound` — WebAudio-синтез (whoosh = bandpass-шум, tick = sine 1180→760 Гц), выкл. по умолчанию, `localStorage bs_sound`, кнопка `#wSound`, клавиша M.
Lite-режим (<1000px / touch): стоп-кадры `.w-still` + crossfade, без полётов, без Lenis (Lenis только `(hover:hover) and (pointer:fine)`).
`reduced()` = false намеренно во ВСЕХ модулях (продуктовое решение: анимация всегда).

### 3.5 CSS — палитра и «Hinter Glas»
- Токены `:root` (Block 4, v8): `--bg:#E8E7E4 --ink:#1C1F22 --accent:#4A5C6B` + алиасы (--paper/--night/--brass/--muted/--line…). Логотип inline-SVG.
- Карточки в фильме (`.w-sheet`) — «Hinter Glas» (Variante C): блок `.wohnung:not(.is-plain) .w-sheet{ инверсия токенов … }` (~строка 1259): фон прозрачный, текст белый, `--night:#E8E7E4`. Тела карточек оборачиваются в `.w-glass` (app.js `glassify()`, grid/flex → `.w-glass--self`).
  ЛОВУШКА: любой блок с захардкоженным `color:#fff` + `background:var(--night)` при инверсии становится белым-на-светлом. Исключения собраны в конце блока (btn-night, inputs, est-*, chips, `.band/.tl-item--cta .tl-body/.cinfo .dark/.teil.dark` → стеклянные плиты).
- `.w-roomnav` — `top:clamp(112px,15vh,160px)` под шапкой (v9.2), скрыта при `.is-covered`. `#totop` скрыт при `html.in-film`.
- Reveal-система: `.rv{opacity:0;transform:translateY(12px)}` + GSAP; `.no-gsap .rv` и `#view[data-prerender] .rv` → видимы. Слова заголовков `.w-w>span` — transform/opacity без blur.
- Vignette `.w-stage::after` (radial .6→.9 по `--cov`), `.grain` без mix-blend-mode, никаких `backdrop-filter` на слоях фильма.

---

## 4. Хронология решений (почему так, чтобы не откатить случайно)

| Версия | Решение | Причина |
|---|---|---|
| v7→v8 | Scroll-scrub вместо time-tween, палитра #E8E7E4/#1C1F22/#4A5C6B, SVG-логотип | Blueprint v8 |
| v8.1 | Интро как видео (mp4/webm) вместо 64 кадров | стало тормозить на загрузке |
| v8.2 | Автоскролл добавлен и УДАЛЁН | Сержио: «не хочу автоскролл, комната пролетает» |
| v8.2 | roomVh 2.1 / camFrac .45 | «почти нет стоп-кадра» при 1.8/.55 |
| v8.2–8.3 | Карточки «Hinter Glas» (вариант C борда), Bauplan-аннотации в Flur | выбор Сержио |
| v8.4 | Аудит + багфиксы (Bewertung, hotspot overflow, H1 регионов, skip-link, Netlify-файлы) | |
| v9 | Blob-кэш, блендинг, монотонный pickFrame, Lenis-snap вместо ST-snap; History-роутер + prerender; аналитика | «лагает покадрово», «сайт для Google — одна страница», «ноль аналитики» |
| v9.1 | Полёты-«станции» (lock), settle инерции; хотспоты вынесены из .w-cam; контраст стеклянных блоков; roomnav скрыта под карточками; hotspot-лимит на мобиле | «пролёт незаметен, пауза крошечная», «хотспоты под заголовком не кликаются», «белое на белом» |
| v9.2 | Гибрид scrub/autopilot (flyMode hybrid), подпись при видимости, roomnav под шапку, убрана надпись «Visualisierung…», индикатор полёта, клавиши, cursor-parallax, звук (выкл.) | выбор «Вариант C» + фичи |

Отвергнуто навсегда: автоскролл/auto-advance; ST-snap вместе с Lenis; blur в reveal-анимациях; backdrop-filter на фильме; уважение prefers-reduced-motion.

---

## 5. Тестовый протокол (обязателен перед любым архивом)

```
node dev/route-test.js        # прямые загрузки, legacy #/, клики, back/forward, 404 noindex, rail-anchor
node dev/analytics-test.js    # ga4 / gtm / none: порядок consent→js→config, дедуп, generate_lead/form_error
node dev/flight-test.js       # флинг 3000px → полёт, стоп на p=.45 (±.005), инерция=0; назад; точка навигации
node dev/hybrid-test.js       # медленно = scrub без полёта + snap; быстро = полёт
node dev/sig-test.js          # dashoffset начинает меняться при opacity 1 (после прибытия)
node dev/final-home-check.js  # home 375/768/1440, полный скролл, ошибки/failed/dataLayer
node dev/crawl-v9.js          # 93 комбинации: 0 errors, 0 failed, 0 overflow, ровно 1 H1
node dev/bench.js LABEL       # first-load + scroll frame-times (software GL — только относительно!)
```
Эталоны v9.2: crawl 93/93 ок; flight: flyStart≈0.4 с после жеста, длительность 2.0–2.2 с, финал p1=0.450; bench (headless, low-res): scroll p50 16.7 мс, >33 мс 28–34 % (v8.4 в тех же условиях 32–43 %).
Скриншоты: `dev/shots-v9.js` (home + leistungen на 3 вьюпортах), `dev/visual-check.js` (хотспот-попап, стеклянные блоки).
Упаковка: `cd site && zip -qr ../baustern-site-vX.zip . -x "*.DS_Store"` — index.html в корне архива!

---

## 6. Ассеты фильма — правда об исходниках

- Единственный исходник: `sources/film-v6/v6-c1..c7.mp4` — AI-видео 1280×720, 24 fps, по 8 с (Küche-drift, Küche→Flur, Flur→Bad, Bad→Schlaf, Schlaf→Wohnen, Wohnen→Eingang, Rohbau).
- Кадры сделаны `buildfilm.py`: **fps=8** (!) → 64 кадра на 8-секундный клип, unsharp, WebP q78 (1280) / q72 (960). Поэтому 29 fps в полёте на самом деле 8 исходных кадров/с, растянутые блендингом.
  Любая новая генерация должна идти через тот же скрипт (с новыми параметрами fps/size) — он же пишет индексы `f` в data.js и стоп-кадры.
- Интро = клип C1 с вшитым easeIO, ffmpeg → 60 fps mp4 CRF26 / webm VP9.
- Реальные фото «до» (стройка): `sources/film-src/a_*.jpg, b_*.jpg` — используются в сцене Rohbau и в WORKS (before-demo.jpg, before-drywall.jpg).

---

## 7. Открытые проблемы (известные, не закрытые)

1. **Шов интро → кадр 63**: последний кадр mp4 ≠ WebP-кадр 63 (разные кодеки/момент) + гонка `ended` vs страховочный таймаут → на Windows виден скачок и текст поверх едущего видео. Фикс в плане (спринт C.2): единственный источник конца = `mediaTime ≥ duration−1/fps`, hold-кадр извлекать из того же видео.
2. Flur (Bauplan): 6 подписей одинакового веса — услуга не считывается за 2 с (план: последовательная хореография, прожектор, один хотспот-герой, оффер «Leerwohnung in 14 Tagen — Festpreis»).
3. Кикер `.dia` (ромб в акцентном цвете) + активная точка навигации = два акцента на кадре → заменить ромб линией.
4. Санузел плоский (ракурс/свет/ГРИП) — только перегенерация.
5. Качество: 720p/8 fps исходник; DPR-кап 1.5 в `fit()`; апскейл 1.7× на Retina.
6. Cookie-баннера нет (Consent Mode по умолчанию denied — легально для CH, но клиенту сказать).
7. GA4/GTM ID пустые; домен на Vercel; бейдж Netlify.
8. `Powered by Netlify` перекрывает `#totop` на некоторых экранах — `#totop` теперь скрыт в фильме, вне фильма проверить.

---

## 8. ПЛАН «Качество» — принятые решения и следующий этап

**Выбор Сержио: «до/после» = Вариант B «Materialisierung слоями»** (главный), плюс он хочет увидеть, как объединяются A+C
(световой вайп + пыль/атмосфера) — сделать как **B+ (композит)** и показать оба на борде до кода.

### B «Materialisierung» — спецификация
Нужны: финальный кадр сцены (hold Rohbau→«после») и из него выведенное «до» (image-edit модель на том же кадре → та же геометрия),
маски 4 слоёв (стены / пол / фурнитура+сантехника / свет) — SAM или Photoshop, PNG с альфой 1920 px.
Хореография по прогрессу скролла в dwell-зоне сцены (0..1), easing `cubic-bezier(.7,0,.2,1)`:
- 0–.15 ничего (только медленный push-in 1 %), .15–.45 стены: маска штукатурки растёт от угла (clip-path polygon / mask-image градиент по диагонали),
- .35–.65 пол: паркет «раскатывается» от двери (mask translate), .55–.8 фурнитура: появляется с 120 мс бликом (белый highlight-слой, opacity 0→.6→0),
- .8–1 свет: LED зеркала загорается (слой «после-освещённый» opacity + лёгкий bloom через дублированный слой с opacity .25).
Реализация: слои — `<img>`/canvas внутри `.w-cam` поверх canvas стоп-кадра, только transform/opacity/mask, без filter на полном кадре. Fallback (lite/no-mask): crossfade.

### B+ = B + элементы A и C (композит для показа)
- Из A: перед первым слоем по кадру проходит **полоса света** 10 % ширины (mask-image linear-gradient, feathered), за ней слои B «включаются» не по глобальному прогрессу, а с задержкой относительно положения полосы — т.е. вайп становится дирижёром материализации.
- Из C: до старта кадр «до» показан через **пыль**: контраст/насыщенность 60 %, canvas-частицы (≤ 300, 1 px, дрейф), которые оседают к .5 прогресса; в финале — короткий световой «settle».
- Звук (если тумблер включён): низкий шум стройки → тишина → tick.
Показать Сержио оба варианта как борд (2 кадра × 4 фазы) ПЕРЕД кодом; после выбора — спринт A: маски и «до»-кадр.

### Спринты (из предыдущего анализа, кратко)
- **A** ассеты: hold-кадры ×2 апскейл; новые ключевые кадры Bad и Flur (режиссура: 35 мм f/2.8, передний план, ключевой свет LED 3000K + окно 5600K); «до» из «после»; keyframe-to-video (Kling 2.x / Veo 3.1 / Runway Gen-4, first+last frame) ×3 на пролёт; оригиналы фото у Артёма; LUT (WB 4500K, blacks 8/whites 246, HSL yellow −12/blue −14, split-tone тени H210 S8, grain 14/20/45) → `.cube`.
- **B** видео: Topaz апскейл 1080p + 60 fps; `lut3d` + bt709-теги; сегменты fwd/rev ×6 + интро; AV1 (`libsvtav1 -preset 5 -crf 30 -g 30 film-grain=8`), HEVC (`libx265 -crf 22 -tag:v hvc1 keyint=30`), H.264 (`libx264 -preset slow -crf 20 -g 30 -sc_threshold 0 -movflags +faststart -an`); скраб-кадры 1920/1280 WebP из того же мастера; VMAF ≥ 93.
- **C** фронтенд: гибридный плеер (видео 60 fps на автопилоте, `requestVideoFrameCallback`-синхронизация, hold из того же мастера, ≤2 живых video, реверс-файлы), фикс шва интро, Bauplan-хореография, сцена «до/после» (B или B+), передний план-слой Bad с параллаксом ×2.5, `<picture>`+srcset, DPR-кап 2, QA-трассы.

Порядок: борд B/B+ → выбор → A → B → C. Первое действие в новой сессии: борд.


---

## 9. v10 (2026-09-11) — что сделано в этой сессии (Сержио выбрал B+)

### Новые файлы
```
site/js/film-fx.js            Codecs · VideoFlight (гибридный плеер) · Materialize (B+) · Inertial (регулятор) · Layers (параллакс) · Gyro
site/img/film/v/              12 флайт-сегментов c2..c6 × fwd/rev × hevc/h264 (1080p60, 2.2 с, easeIO вшит; AV1 — когда будет svtav1)
site/img/film/f2|f12|fl12/    576 кадров 1920/1280/960 (12 fps из 24-fps исходника, LUT), индексы — img/film/frames.json
site/img/film/s10/            стоп-кадры из мастера: stN.jpg 1920, stN-1280.jpg, stN-p.jpg 810×1440; st5 + st-flash-after прогнаны через LUT
site/img/film/intro.h264|hevc.mp4, intro-hold-v10.jpg, poster-v10.jpg   интро 3.4 с 1080p60 из того же мастера (+hold-кадр = шов закрыт)
site/img/film/mat/            слои материализации (before, before-dusty, flat, flat-full, after, technik, edges, bloom, m-*)
site/img/film/layers/         bad-mid.webp (тумба, RGBA), bad-glow.webp (LED-bloom)
core/sources/board/           борд B/B+: make-board-assets.py · build-board.py · render-board-png.py · board.html · board.png
core/sources/sprintA/         sam-masks.py (SAM-2 + GroundingDINO) · PROMPTS.md (до-из-после, Bad/Flur, keyframe-to-video) · make-lut.py → baustern.cube/.css/.glsl · check-align.py
core/sources/sprintB/         pipeline.sh (upscale|lut|segments|encode|scrub|intro|vmaf|clip|all; Topaz/RIFE/ffmpeg-fallback)
core/dev/jsdom-smoke.js       смоук без Chromium: бут full/lite, все зоны updateRoom, VideoFlight, Materialize, Layers, наличие ассетов
```
### Архитектура (дополнения к §3)
- **Гибридный плеер:** `startFlight()` → `VF.start(i,dir,p0,dur,CAM)`: `<video class="w-vid">` в `.w-cam` поверх canvas, `currentTime = p0/CAM·FLY_DUR` (rev: зеркально), `playbackRate` = остаток видео / остаток полёта, rVFC-синхронизация (drift > 60 мс → мягкий nudge rate, без seek). Canvas ПОД видео продолжает рисовать кадры → stall/ошибка/нет кодека = видно кадры, чёрного нет. По `onComplete` → `VF.end()` (fade 140 мс, кадр уже стоит), затем `VF.warm(i+1)` во второй слот (≤2 live video). Кодек: `FilmFX.Codecs.probe()` — av1 → hevc → h264 через canPlayType; список реально собранных кодеков в `FILM.video.codecs`.
- **Шов интро:** источник по кодеку из `FILM.introSources`; конец = `mediaTime ≥ duration − 1/60` (rVFC), `ended`/таймаут только страховка; hold = `intro-hold-v10.jpg` из того же мастера как `baseIm`, пока кадр 95 не в кэше; видео гасится через 2 rAF после отрисовки.
- **Материализация B+ (сцена rohbau, `sc.mat`):** в dwell (p>CAM) `render()` отдаёт canvas `Materialize.render(cv,ctx,mp)`; `mp` = `Inertial`: follow((p−CAM)/(1−CAM)) от скролла, drag регулятора `.w-cmp.is-mat` (инерция .92/frame, отскок за края ≤6 %). Пыль — `.w-fx` canvas (300 частиц, mix-blend screen). Звук: `Sound.rumble` до .5, tick на .95. Переход в Eingang стартует от `M.after()`, не от фото. Lite: прежний compare-слайдер (st5-p ↔ st-flash-after-p).
- **Bad (`sc.layers`, `sc.sheen`):** после drawFrame в dwell `Layers.draw` — смещение = par × depth × 2.5 (% ширины), glow «дышит» (±.6 %, 10 Гц redraw), блик по стеклу = градиент в clip-полигоне, идёт против взгляда (depth −1.6). Lite: гироскоп → `--gx/--gy` на stage, CSS-transform стилла (iOS: permission на первый touch).
- **Flur:** `afterArrive` через 260 мс ставит `.w-hot.seq`: герой (`ann[].hero`) + `.w-spot` (radial, screen) + оффер `scene.offer` сразу, остальные по `d` (сек) и на .58 до hover. Кикер `.dia` → линия 18×2.
- **Кадры:** `pickDir()` → `dir2` (1920) при DPR ≥ 1.5 и ширине ≥ 1400; DPR-кап в `fit()` = 2; полный префетч только low-набора (12 МБ), остальное — окно ±1 сцена. Все пути версионированы (f12/fl12/s10/poster-v10) — `_headers` immutable, старые URL нельзя переиспользовать.

### Ограничения / что дальше
1. «До» и «пусто» в материализации — процедурные плейсхолдеры (row-fill + шум). Заменить на AI-кадры той же камеры по `sprintA/PROMPTS.md` §1 (проверка `check-align.py`), маски — `sam-masks.py` (1920). Файлы просто перезаписать в `img/film/mat/` (имена те же; при замене — новая папка `mat2/` из-за immutable-кэша).
2. Мастер сделан ffmpeg-minterpolate (fallback): на статичных сценах ок, на быстрых участках возможен лёгкий «jelly». Прогнать `pipeline.sh all` с Topaz (`UPSCALER=topaz`) или RIFE — скрипт сам подхватит; svtav1 в сборке ffmpeg даст AV1 (добавить 'av1' в `FILM.video.codecs` и `introSources.codecs`).
3. Bad-слои вырезаны полигоном из стоп-кадра (тумба); настоящий передний план (полотенце/рейл) — по режиссуре PROMPTS.md §2.1.
4. Prerender не запускался (в песочнице нет Chromium): **перед деплоем `cd site && node _tools/prerender.js`** (pages.js/data.js/css/index.html менялись).
5. Playwright-протокол §5 не прогнан в этой сессии — прогнать у себя: `node dev/static-srv.js` + `route/flight/hybrid/sig/final-home-check/crawl`. Ожидаемые изменения эталонов: длительность полёта не изменилась (2.0–2.2 с), в DOM во время полёта есть `.w-vid.on`.
6. Размер `site/` 111 МБ (кадры 55 МБ, видео 42 МБ). Netlify drag-and-drop тянет, но лучше `netlify deploy --prod --dir=site` (CLI, инкрементально).
