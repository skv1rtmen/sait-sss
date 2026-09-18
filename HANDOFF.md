# BauStern — HANDOFF v10 → следующая сессия

> АКТУАЛЬНО 14.09.2026, 14:36 UTC: первым читать `IMMERSIVE-MOBILE-2026-09-14.md`. Production **`6aa8063e94dbca6b73db1782`**, https://www.baustern.ch. Пользователь отверг мобильное отдельное окно 16:9 с текстом под ним: теперь изображение, заголовок, подсказки и CTA образуют единую полноэкранную сцену. Широкие оригиналы можно осматривать горизонтальным жестом по стоп-кадру; весь снимок без обрезки открывается по иконке. Не утверждать, что весь широкий кадр одновременно виден в portrait full-bleed. Сохранены видео m3/m3l, автоматическая mat5 за 6,2 с, пауза/повтор, компактные инфоразделы и отсутствие звука. Добавлены медиаплоскость с transform-панорамированием, стартовые фокусы, фото 1920 вместо 1280 в обычном режиме, выход к содержанию последним свайпом/стрелкой. Сенсорное управление использует pointerup + подавление совместимого click; реальное pointerdown мыши сбрасывает дедупликацию — не упрощать без Chromium/WebKit тестов, первый draft обнаружил двойной переход Safari-подобного движка и не был опубликован в prod. 126 мобильных состояний, 138 проверок форм (моки), отдельные touch/safe-area/resize и desktop регрессии пройдены. Новый физический iPhone 15 остаётся визуальной приёмкой владельца; старое окно 16:9 не восстанавливать. CRM/backup/юридические условия не менялись, новых реальных заявок нет. Ниже — история.

> АКТУАЛЬНО 14.09.2026, 13:43 UTC: сначала читать `SPATIAL-RESTORE-2026-09-14.md`. Production **`6aa7f9ee490a2ee08c6f22be`**, https://www.baustern.ch. Белые desktop-панели заменены исходными пространственными подсказками/линиями и прозрачной вертикальной навигацией; звук удалён полностью. На телефоне — полные широкие кадры/видео в окне 16:9, семь комнат до информационных блоков, остановка кадра после пролёта, автоматическая материализация за 6,2 с без ползунка, компактные раскрывающиеся разделы и нативные диалоги. Исправлен контраст категорий формы. Локально: 126 мобильных сцен (9 размеров × 2 движка), 196 desktop-состояний, 42 пространственных сценария, 138 проверок форм; аппаратный тест p95 ≤16,8 мс пройден. Новый вид ещё требует визуальной приёмки на физическом iPhone 15 владельца; прежнее подтверждение воспроизведения не заменяет её. Ограничения CRM/backup/юридической приёмки ниже не сняты; новые реальные заявки не отправлялись. Не возвращать белые панели, звук или мобильный ползунок по старым инструкциям.

> АКТУАЛЬНО 14.09.2026, 12:11 UTC: сначала читать `FRAME-BUDGET-2026-09-14.md`, затем `PRELAUNCH-CLOSURE-2026-09-14.md`, `DATA-RETENTION-REVIEW.md` и `CRM-BACKUP-READINESS-2026-09-14.md`. Текущий production **`6aa7e431284ec329992390ec`**, https://www.baustern.ch; Netlify Personal подтверждён. Оптимизированы film.js/film-fx.js, инерция зависит от времени, ползунок вынесен из камеры, исправлены клавиатура и сброс native-scroll прогресса. 558 мобильных маршрутных проверок, 126 сцен, 196 desktop-проверок и 138 проверок форм прошли. Аппаратный Chrome/GTX 1080 проходит p95 ≤16,8 мс на 1440/1920/3840; программный SwiftShader — нет, универсальные 60 FPS не обещать. Все данные по решению владельца хранятся бессрочно; автоудаление не включалось. Юридическая проверка, физический iPhone и восстановление CRM остаются открыты. Supabase — Free с предупреждением Storage и без включённых доступных ежедневных backup; Netlify Personal это не покрывает. WEB-260914-010/011 уже созданы и проверены, **не повторять live-тесты без нового разрешения**. Ниже сохранена история, а не текущий бэклог.

> АКТУАЛЬНОЕ ПРОДОЛЖЕНИЕ 13.09.2026: сначала читать `VISUAL-RELEASE-2026-09-13.md`. Релиз v13: безопасные зоны навигации/заголовков, кликабельные панели, светлая палитра, `f13*`/`s13`/`r13`/`m3*`/`mat5`, исправленные возвраты и двойная раковина, новый звук. Production deploy `6aa6b9fd423cb601c55b54f3`. Ниже сохранена история предыдущих релизов; старые списки ассетов и указания «читать первым» не заменяют этот новый отчёт. CRM-релиз 12.09 сохранён. Не обещать 60 fps для любого desktop canvas: измеренное ограничение приведено в отчёте.

> СНАЧАЛА ЧИТАТЬ `CRM-60FPS-RELEASE-2026-09-12.md` — финальное продолжение: живая CRM, `m2/` и `m2p/` (60 fps с резервом 30), `mat4/` (композитная материализация), PDF-каталог, опубликованные миграции и свежие проверки. Старые запреты на любые реальные отправки ниже были точечно заменены явным запросом владельца проверить доставку; обычные тесты по-прежнему используют заглушки. Не повторять live-тесты без необходимости: они отправляют реальные уведомления.

> Обновление 12.09.2026: актуальное продолжение и результаты мобильной адаптации — в `MOBILE-RELEASE-2026-09-12.md`. Сначала читать его. Ниже сохранён исторический handoff Claude; утверждения о непроведённых тестах, отсутствии RIFE/AV1/AI-кадров и процедурном `mat/` устарели. Текущие ассеты: `mat2/`, RIFE `r1/`, мобильные `m1/` и `m1p/`. Базовый сервер уже находит соседнюю `site/`.

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

---

## 10. v14 (2026-09-15) — «Вертикальный кат» для телефона + сцена «Ankunft» (Cowork-сессия, НЕ протестировано, НЕ задеплоено)

Причина: владелец отверг мобильную версию v13/immersive (скрин iPhone 14.09): пульт (стрелки/прогресс/replay/вольбилд) «дешевит», свайп без
ощущения скролла и перескок через комнату, чипы вместо десктопных подсказок, урезанные широкие кадры, неинформативные пролёты; плюс идея
начинать фильм не с кухни, а с входа в дом (Швейцария). Корень 1/2/4 — архитектура слайдера в `film-mobile.js` (дискретные комнаты,
видео по таймеру, лок ввода, `goto()` с мгновенным scrollTo). Решение — не латать, а перевести телефон на скролл-скраб десктопного движка.

### 10.1 Что добавлено (всё аддитивно, за флагом — прод не меняется, пока `FILM.mobileV2.enabled=false`)
```
site/js/film-mobile-v2.js        новый мобильный движок «vertical cut»: window.MobileFilmV2.mount(root,api)
site/css/mobile-film-v2.css      стили только для .wohnung.is-vcut (стейдж, текст на фото, пины, bottom-sheet, аккордеоны блоков)
site/js/film.js  lite()          хук: ?mv2=1 / FILM.mobileV2.enabled → грузит v2 (link+script) и монтирует его; иначе v1 как раньше
site/js/data.js  FILM.mobileV2   roomVh 1.9 / room0Vh 1.15 / camFrac .45 / snap / pinsMax 3 / pan{from,to} по сценам (пан-скан)
site/js/data.js  FILM.portrait   контракт портретных ассетов (s14p/fp14/mat6p/mp14), enabled:false до генерации
site/js/data.js  FILM.ankunft    сцена входа (стиллы/hold/видео обеих ориентаций, пины, новые тексты кухни), enabled:false
core/sources/sprintD/PROMPTS-v2.md   промпты: A outpainting стиллов, B портретные клипы (start/end-frame), C Ankunft, D профиль pipeline
core/dev/jsdom-smoke.js          MV2=1 W=375 → бутит v2 вместо v1; в отчёте vcut/pins/pult
```
### 10.2 Как работает v2
- **Скролл = камера.** Комнаты `.w-room` (высота `--room-vh`×100svh, выставляется в mount), стейдж fixed. Для комнаты i: p<CAM → кадр
  `lerp(S[i-1].f,S[i].f,easeIO(p/CAM))` из кадрового архива (`F.dirLow` 960, окно ≤40 ImageBitmap + блобы двух соседних пролётов);
  p≥CAM → холд-стилл `s13/st{i}-1280.jpg`, текст (`fillScene`) и пины появляются с задержкой. Никаких локов, очередей, таймеров на жесте.
  Мягкий snap: `<i class="v-snap-pt">` на CAM+7 % каждой комнаты, `html.v-snap{scroll-snap-type:y proximity}`.
- **Пан-скан** (пока нет портретного набора): cover-fit 16:9 кадра, горизонтальный фокус `pan` едет `pan.from→pan.to` за пролёт — за
  скролл видно больше ширины кадра. С `FILM.portrait.enabled` — портретные кадры 1:1, pan=.5.
- **Пины** = `scene.hot` (первые `pinsMax`), координаты 16:9 → экран через ту же геометрию (`mapPin`), вне видимой полосы — скрыты;
  y ограничен 84px..58 % высоты (над текстом). Тап → `<dialog class="v-sheet">` с текстом карточки и «Mehr dazu». `hotP` в сцене
  переопределяет координаты для портретных кадров.
- **Пульт удалён.** Осталась подпись комнаты `.v-room` (1.9 с), hero-CTA и «Rundgang ↓» на комнате 0, `.w-cta` (fillScene) на последней.
- **Интро** один раз, не скролл-зависимо: `m3p/intro.mp4` (портрет) или `m3/intro.mp4`; любое touchmove/wheel обрывает; после — холд.
- **Rückblende** (`flash`): пролёт = кроссфейд холд(Wohnen)→`mat5/step0`, стоянка = `Materialize.present(d·1.15)` (DOM-композитор
  из film-fx.js), выход = кроссфейд `st-flash-after`→холд Eingang. Портрет: `P.matDir` (mat6p).
- **Ankunft** (когда `enabled`): синтетическая сцена 0 (`flash:true, f:0`) + `<section class="w-room v-room-ankunft">` перед кухней;
  интро = `ankunft.video` (portrait/по кодеку), холд = `*-hold`, пролёт в кухню = 28 % «через белое» (`.v-flash`) + скраб кадров 0..95.
  Кухня получает `kuecheKicker/kuecheH`, hero-тексты уходят на Ankunft. Индексы `st{i}` смещаются через `stIndex()`.
- Блоки после тура: тот же «комнаты сначала, блоки как аккордеоны» из v1 (код и CSS перенесены 1:1).

### 10.3 Ankunft на десктопе (film.js full) — план, НЕ сделано
Вставить сцену 0' перед кухней тем же приёмом, что Rückblende: `{id:'ankunft', f:0, img:hold, flash:true}` → в `updateRoom` для i=1
(кухня) `isFlash` уже даёт кроссфейд `flashImgs[0]`→`nearest(95)`; интро-видео `playIntro()` берёт `F.ankunft.video` вместо
`F.introSources` (тот же rVFC-шов, hold = `ankunft.hold`), `introEnd` остаётся 95 (кадры 0..95 = существующая кухонная фаза).
Нужно: `wRoom()` в pages.js для сцены с `still` вместо `stillDir`, roomnav +1 точка, sig/hero-флаги, prerender. Делать только
с Playwright-прогоном (route/flight/hybrid/final-home-check) — интро-логика film.js хрупкая.

### 10.4 Проверка и включение (по порядку)
1. `cd core/dev && MV2=1 W=375 node jsdom-smoke.js` — 0 errors, `vcut:true`, `pult:0`, `pins>0`.
2. `node static-srv.js` → `http://localhost:8099/?mv2=1` в Chrome DevTools (iPhone 14/15, touch) и в WebKit-эмуляции:
   скролл ведёт кадр без задержки; второй свайп во время движения НЕ перескакивает комнату; snap мягкий; пины на деталях; sheet
   открывается/закрывается; Rückblende едет от скролла; последняя комната → аккордеоны; десктоп (≥1000px) не изменился.
3. Реальный iPhone: `https://<draft>.netlify.app/?mv2=1` — визуальная приёмка владельца (скриншоты), затем `FILM.mobileV2.enabled=true`,
   `npm run build`, полный протокол §5, `netlify deploy` draft → prod. v1 (`film-mobile.js`, `mobile-film.css`) остаётся как откат.
4. Генерация по PROMPTS-v2 (A → B → C), pipeline-профиль portrait, `FILM.portrait.enabled=true`, `hotP` по каждой сцене на глаз,
   затем `FILM.ankunft.enabled=true` (мобильный сразу; десктоп — §10.3).

### 10.4a Статус проверки 15.09 (Cowork, Playwright-MCP на ПК владельца, Chromium 390×844 / 320×568 / 844×390 / 768×1024 / 1440×900)
Прогнано на `localhost:8099/?mv2=1` (dev-сервер уже был запущен): монтирование v2, интро `m3p/intro.mp4` → холд, скраб кадров во всех 6 пролётах
(bm-окно 40, блобы, 0 ошибок консоли, 0 запросов ≥400), стоянки всех 7 комнат с текстом и пинами, bottom-sheet открыть/закрыть, Rückblende от
скролла (compositor), подпись AK на Eingang, аккордеоны блоков, быстрый wheel-скролл 2400 px → одна комната (перескока нет), десктоп 1440 =
`is-full` без изменений. Найдено и исправлено в этом прогоне: snap попадал до начала стоянки (scroll-padding-top навигации → маркер на CAM+14 %),
пины вне видимой полосы (авто-подбор фокуса `fitPan` под пины), пины поверх навигации/текста (границы от реальной кромки `.w-ov`), последняя
комната накрывалась блоками (порог covered .3 vh, +0.6 vh высоты последней комнате), подпись не рисовалась (анимация путей), кнопка телефона в
hero убрана. Скриншоты: `core/dev/reports/final-*.png`. НЕ сделано (нет shell в этой сессии): `jsdom-smoke MV2=1`, `npm run build`,
`netlify deploy` (скрипты `core/dev/_v2-check.cmd`, `_v2-draft-deploy.cmd` готовы — двойной клик), WebKit/реальный iPhone.

### 10.4b Ночь 15.09 — draft, Flow-генерация
- jsdom-smoke на ПК владельца: MV2 → `vcut:true, pult:0, pins:2, errors:[]`; desktop → full, 0 errors (`core/dev/_v2-smoke.log`).
- Netlify CLI на Windows не стоял → `npx -y netlify-cli@17` (логин уже был). **Draft:** `https://6aa878b0e40d4a10470fcc13--leafy-bublanina-48b840.netlify.app/?mv2=1`
  (в `_headers` добавлен `Access-Control-Allow-Origin: *` для `/img/*` — чтобы Flow/Gemini могли брать стиллы по URL). Прод не трогали.
- **Google Flow (PRO, проект «сент. 15 - 01:30»):** сгенерированы Nano Banana 2 — фасад Ankunft 9:16 (дверь закрыта + дверь открыта) и 16:9
  (закрыта + открыта), все скачаны в 2K в Downloads; Veo — два клипа «Ankunft» по 8 с: 9:16 и 16:9, долли к двери → дверь открывается → камера
  входит в подъезд (портрет заканчивается на лестнице Altbau, ландшафт — в коридоре к окну = match cut на Flur). Скачивание 1080p запущено
  (Flow апскейлит по одному файлу; если не скачалось — в проекте Flow, ⋯ → 1080p). Перенос в проект: двойной клик `core/dev/_v2-collect.cmd`
  → `site/img/film/s14/_incoming/`, затем переименовать по PROMPTS-v2 §0; hold-кадр = последний кадр видео, не «дверь открыта»-стилл.
- Outpainting 7 стиллов в Flow не сделан: загрузка файла в Flow идёт через нативный диалог (нет `<input type=file>`), из этой сессии недоступно.
  Варианты: Photoshop 2026 → Generative Expand (лучший для outpaint), либо Flow с референсом по URL после деплоя CORS.

### 10.4c iPhone-отзыв владельца (02:11) и ответ (draft `6aa881a69be3dbf9cabb88b5`)
Скрины с iPhone: v2 работает (пины, без пульта), но «свайп глючит», «подсказки не все», «фото обрезаны». Сделано: (1) scroll-snap на
тач-устройствах отключён (iOS дотягивает после инерции = ощущение рывка); (2) сглаженная позиция скролла `sy` (lerp .24, rAF до
схождения) — кадр не дёргается от пачек scroll-событий; (3) геометрия комнат/блоков кэшируется (`measure()`), никаких gBCR в кадре;
(4) `fit()` не перерастрирует canvas при смене высоты от адресной строки Safari, только по ширине/в покое; (5) на тач — каждый второй
кадр + кроссфейд (STEP=2): вдвое меньше decode/памяти; (6) пины без backdrop-filter, латунный акцент (#d9b46a), «+»-бейдж, кольцо-пульс.
«Не все пины» — это следствие пан-скана 16:9 (видна полоса ~26 % ширины): пины вне полосы скрыты. Решается только портретными
ассетами (`FILM.portrait`), см. §10.4b и PROMPTS-v2 §A/§B. Следующий уровень плавности, если не хватит: скраб all-intra видео
(`-g 1`, 540×960, ~3 МБ на пролёт) через `video.currentTime` вместо ImageBitmap — на iOS это самый плавный путь; или кадры 640×360.

### 10.6 15.09 04:00 — Портретные стиллы + Ankunft встроены, v2 включён по умолчанию (ещё НЕ задеплоено)
- Outpainting всех комнат сделан в Flow (Nano Banana 2, референсы = «Сохранённый кадр из видео» из проекта «сент. 05», без загрузки файлов):
  Küche, Flur, Bad, Schlafzimmer, Wohnen, Eingang → 2K → `core/dev/portrait-build.js` (ffmpeg-static, LUT через cwd=Temp) →
  `site/img/film/s14p/st{0,1,2,3,4,6}.jpg` + `-720`. Rückblende (st5) остаётся 16:9 (compositor mat5), пины там на телефоне скрыты (`noPinsMobile`).
- Ankunft: `s14p/st-ankunft.jpg`, `s14p/ankunft-hold.jpg` (последний кадр Veo-клипа — лестница Altbau), `mp14/ankunft.mp4` (9:16, LUT),
  `s14/st-ankunft.jpg`, `s14/ankunft-hold.jpg`, `r14/ankunft.h264.mp4` (16:9). `FILM.ankunft.enabled=true` — телефон показывает 8 сцен.
- data.js: `FILM.portrait.enabled=true` (только стиллы; `dir/matDir=null` → пролёты по-прежнему pan-scan 16:9 с кроссфейдом в хочкантный холд
  на первых/последних 30 % фахрты), `hotP` на 6 сценах (пины выверены по скриншотам), `FILM.mobileV2.enabled=true`.
- Проверено Playwright 390×844: 8 комнат, интро mp14/ankunft.mp4, пины 3/3/2/3/3/0/2, 0 ошибок, 0 404; десктоп 1440 = is-full, 7 комнат, без изменений.
  Скриншоты `core/dev/reports/p1-*.png`, `p2-*.png`.
- **Сырьё** (копии из Downloads, включая личные фото/видео владельца) лежит в `core/_incoming/` (раньше `site/img/film/s14/_incoming` — оба
  deploy-скрипта переносят её из site/ перед деплоем). НИКОГДА не деплоить site/ drag-and-drop, пока там есть `_incoming`.
- Деплой: `core/dev/_v2-draft-deploy.cmd` → draft, `core/dev/_v2-prod-deploy.cmd` → прод (оба через `npx netlify-cli@17`, логин уже есть).
  Из Cowork запуск .cmd через Проводник стал ненадёжным (двойной клик уходит в переименование) — запускает владелец.
- Следующие шаги: портретные пролёты (Veo frames-to-video: first/last = s14p-стиллы, PROMPTS-v2 §B) → `fp14/` кадры → `portrait.dir`;
  mat6p для Rückblende; Ankunft на десктопе (§10.3, film.js full() не тронут — на десктопе сцена не показывается).

## 11. v15 (2026-09-15, 04:30–07:00) — «Berghaus»: один авторский дом, 8 глав, стиллы + клипы в обеих ориентациях

**Что это.** Полная замена контента фильма (Zürcher Altbau → дом в горах над туманом: лиственница, бетон, панорамное остекление). Один дом во всех
сценах, ключевой вид сгенерирован первым и использован как референс для всех остальных. Движки (film.js full / film-mobile-v2.js) НЕ переписаны —
данные, ассеты и три точечных патча. Старый набор остался как `FILM_V13` в data.js (`?film=13` — только rollback; папки f13/s13/r13 не трогались).

### 11.1 Ассеты (реестр: `core/sources/sprintE/REGISTRY.md`, промпты там же)
- Google Flow (PRO), проект «сент. 15 - 01:30»: стиллы Nano Banana Pro 2K (один запрос «TWO images: 16:9 + 9:16» даёт обе композиции),
  клипы Veo 3.1 (Ankunft L+P — Quality, 100 бонусов/клип; 14 интерьерных — Fast, 20/клип; Quality на всё не хватало: 956 бонусов, 4K/тариф не покупали).
  Все клипы 8 с, медленный push-in, скачаны 1080p (Google upscale). Осталось 476 бонусов.
- Сырьё: `core/_incoming/v15/` (сбор: `_v15-collect.cmd`, сегодняшние Downloads ≥ 04:30). Никогда не деплоить.
- Сборка: `core/dev/v15-build.js` + `_v15-build.cmd` (всё) / `_v15-stills.cmd` (только холды). Маппинг файлов и holdAt — `v15-map.json`.
  Выход в `site/img/film/`: `f15/` (1280) `f15h/` (1920) `f15l/` (960) — 7 глав × 96 кадров (12 fps × 8 с) = 672; глава k = кадры k*96…k*96+95,
  с 1-й главы первые 0.6 с — xfade из ПОСЛЕДНЕГО кадра предыдущего клипа в новый стилл; `fp15/` — те же 672 кадра 540×960 из 9:16-клипов;
  `s15/st{i}.jpg`+`-1280`+`-p.webp` и `s15p/st{i}.jpg`+`-720` — холды (кадр клипа на `holdAt`: Küche 3.0 с, Bad 2.5, Wohnen 2.5, Eingang 2.0 — в конце
  клипа комната уже «пройдена»); `s15/first{i}.jpg` — сами 2K-стиллы (референс); `st-rohbau.*` — кадр Rohbau-клипа на 2.5 с (тот же ракурс, что холд Wohnen);
  `r15/intro.h264.mp4` + `r15/intro.mp4` (Ankunft L, 1.7× → 4.7 с), `mp15/intro.mp4` (Ankunft P); `poster-v15.jpg`, `intro-hold-v15.jpg`.
- Flight-видео (`scenes[].clip` fwd/rev) НЕ делались — автопилот идёт по кадрам (96 кадров за 2.2 с ≈ 43 fps, визуально ровно).

### 11.2 Данные и код
- `data.js`: `FILM_V15` (активен) — 8 сцен: ankunft(f95, hero, intro) → flur=Schwelle(191, Bauplan-ann) → kueche(228) → bad(318) → schlaf(479) →
  wohnen(510) → rohbau(flash, f=510, `img/imgP` + `compareImg/compareImgP`) → eingang(600, sig, final). `portrait.dir='fp15/'` → v2 скраббит 1:1 хочкантные
  кадры, `ankunft.enabled=false` (Ankunft = обычная сцена 0 в обоих движках), `mobileVideo{dir:r15, portraitDir:mp15, rate:1}`.
- `pages.js`: wRoom(0..7), листы на прежних местах (после flur/kueche/bad/schlaf, ablauf после rohbau, финал после eingang). `plan.js`: схема дома.
- `film.js` (1 патч): rohbau без `mat` → в Verweilzone включается Vorher/Nachher-Regler (`split`: слева Rohbau, справа готовая комната).
- `film-mobile-v2.js` (3 патча): flash без `mat` — before/after из `imgP/compareImgP`, в Verweilzone скролл-кроссфейд Rohbau → готово (`materialProgress`);
  `stillSrc` для flash = null; хочкантные ассеты только при `innerHeight>innerWidth` (квер-телефон получает 16:9); интро-rate из `mobileVideo.rate`.
- Prerender: `core/dev/prerender-run.js` (playwright из core/dev/node_modules + реальный Chrome через `CHROME=`), запускается из `_v15-check.cmd`
  вместе с jsdom-smoke (MV2 375 + desktop 1440) и dev-сервером :8099. jsdom-smoke: проверка ассетов расширена на v15 (portrait, imgP, compareImg, -p.webp).

### 11.3 Проверено 15.09 07:00 (Playwright-MCP на ПК владельца, Chromium)
- Desktop 1440×900: интро r15 → холд у стеклянной двери, 8 точек навигации, все главы (скриншоты `core/dev/reports/v15-d*.png`), пины, Bauplan на Schwelle,
  Vorher/Nachher на Rückblende (`v15-d6b.png`), 0 JS-ошибок, 0 404. Все 30 маршрутов 200 + h1, SPA back/forward, Rückruf-диалог, возврат на home.
- Телефон 390×844 (`v15-m*.png`): интро mp15, хочкантные холды без кропа, пины 1/3/3/…, Rohbau-кроссфейд; 320×568, 768×1024 — ok; 844×390 → 16:9-кадры.
- jsdom-smoke: 0 ошибок, 0 отсутствующих ассетов (оба режима). Prerender: 31 маршрут.
- Draft: `core/dev/_v15-draft-deploy.cmd` → URL в `_v15-deploy-out.txt`. Прод — только после отдельного OK владельца (`_v2-prod-deploy.cmd`, сообщение поправить).

### 11.5 v15.1 (15.09 08:30–10:10) — пролёты между комнатами, Quality, мобильный скраб
- Отзыв владельца: «свайпы глючат, нет эффекта пролёта из комнаты в комнату». Решение: **переходные клипы Veo 3.1 first/last frame** —
  первый кадр = холд комнаты A (`s15/st{k}.jpg`), последний = стилл комнаты B (`s15/first{k+1}.jpg`); 6 переходов L + 6 P, все Quality
  (см. REGISTRY.md «v15.1»). Загрузка кадров в Flow: перехват `HTMLInputElement.prototype.click` для `input[type=file]` + `fetch` с
  draft-URL (CORS `/img/*` есть) → `DataTransfer` → `change` (файлы попадают в «Загрузки» проекта; диалог о правах — «Принимаю»).
- Кадры (`v15-build.js`, v15.1): глава k≥1 = переход (6 fps ≈ 48 кадров, 2× ускорение) + push-in до holdAt (12 fps, первые 0.34 с — xfade
  с последнего кадра перехода). Итог 696 кадров: f = 95 / 239 / 323 / 401 / 545 / 623 / 695 (`core/dev/v15-frames.json`). `fp15/` — те же
  индексы из хочкантных переходов + push-in → `portrait.dir='img/film/fp15/'` снова активен (телефон скраббит 1:1).
- Движок: `flyDur` 2.2 → 3.0; v2: окно битмапов 40 → 72 (coarse) / 96, первая фахрта декодируется во время интро (`ensure(S0.f,S1.f)` через 600 мс),
  сглаживание скролла .24 → .34 (кадр ближе к пальцу), landscape-телефон получает 16:9-кадры.
- Küche push-in L перегенерирован в Quality; Wohnen push-in L — не хватило бонусов (оба аккаунта пусты: 36 и <100).
- Проверено Playwright: desktop 1440 — пролёт Ankunft→Schwelle кадры 95→239 (скриншоты `v151-fly*.png`), гибридный автопилот работает;
  телефон 390 — запросы идут в `fp15/`, mid-flight кадр без кропа (`v151-m30.png`); jsdom-smoke оба режима 0 ошибок / 0 missing; prerender 31.
- Draft v15.1: `core/dev/_v15-deploy-out.txt`.

### 11.6 v15.2 (15.09 16:00–17:30) — все push-in в Quality (акк. 3 «Alex Weber», проект 13634778-…)
- Перегенерированы 10 интерьерных push-in в Veo 3.1 Quality: L — Flur, Bad, Schlaf, Wohnen, Eingang; P — Flur, Küche, Bad, Wohnen, Eingang
  (файлы `…_2026091516xxxx.mp4`, см. REGISTRY «v15.2»). Schlaf-P остался Fast (бонусов ~50 < 100). Ankunft L/P и Küche-L были Quality и раньше.
- Скачивание 1080p: Chrome блокирует повторные авто-загрузки в одной вкладке → **по одной загрузке на свежую вкладку** (`tabs_create` →
  `/edit/<id>` → JS-клик «Скачать медиаконтент» → «1080p»). Первый клик «1080p» запускает апскейл (минуты), второй — скачивает.
- Сборка (`v15-build.js`): переходы T были сгенерированы из СТАРЫХ холдов → добавлен xfade 0.5 с (`XFT`) от текущего холда в начало T
  (иначе скачок в начале пролёта). Новые холды подобраны под старые (первый кадр T): Flur holdAt 7.0, Schlaf 4.5 (holdAt общий для L и P —
  индексы f15/fp15 обязаны совпадать). Новые f = 95/227/311/389/491/569/641, 642 кадра (`data.js` обновлён). Сравнения холд↔старт T:
  `core/dev/reports/v152-cmp-*.jpg`.
- Запуск скриптов без bash: `browser_run_code_unsafe` Playwright-MCP даёт Node на ПК (`page.constructor.constructor('return process')()`
  → `process.mainModule.require('child_process')`) — так запускались `node v15-build.js`, копирование из Downloads и проверки.
- Проверено: jsdom-smoke MV2 375 + desktop 1440 — 0 ошибок / 0 missing; Playwright на localhost:8099 и на драфте — desktop 1440 (f15h/f15l),
  телефон 390 (fp15/s15p/mp15), landscape 844×390 (f15l), tablet 1024 — 0 JS-ошибок, 0 HTTP≥400; скриншоты `core/dev/reports/v152-*.png`, `draft152-*.png`.
- Draft v15.2: `https://6aa9570aa65d1f0a35ad6f04--leafy-bublanina-48b840.netlify.app` (deploy-preview, prod не тронут). Netlify CLI при
  запуске без TTY ничего не пишет в лог — статус смотреть через `npx netlify-cli@17 api listSiteDeploys --data '{"site_id":"225f9043-…"}'`.

### 12. v16 этап 3 (16.09, 01:20–03:30) — стиллы с проёмами + переходы «через дверь» (ВЫПОЛНЕН; движок пока v15.2)
- План v16 целиком: `BRIEF-v16.md`. Этап 3 сделан ДО этапов 1–2 по просьбе владельца: ассеты готовы, в сайт ещё не подключены.
- Стиллы: Nano Banana Pro с референсом на старый стилл (0 бонусов) — 5 комнат перегенерированы так, чтобы был виден проход в следующую
  (Schwelle→дверь в кухню, Küche→дверь в бад, Bad→дверь в спальню, Schlaf→открытый проход в гостиную, Wohnen→проём в коридор) + Rohbau с тем же
  ракурсом; 9:16 сделаны из 16:9 через image-edit («Vertical 9:16 version… pan so the doorway is fully visible»). Ankunft/Eingang — старые.
- Переходы: 12 клипов Veo 3.1 Quality first/last frame (6 L + 6 P), 1080p 24 fps 8 с, промпт «0.5 с покоя → к проёму → через порог → замедление → точно последний кадр».
  Проверены покадрово: каждый заканчивается ровно на стилле следующей комнаты. Реестр с edit-id: `REGISTRY.md` «v16».
- Мастера: `core/_incoming/v16/` (не деплоить). Веб: `core/dev/v16-build.js` → `site/img/film/v16/{clips,stills}` (fwd/rev mp4, first/last jpg, стиллы 1920/1080 + 1280 + webp).
- Flow-заметки: картинки бесплатны; сгенерированные картинки НЕ попадают в пикер «Первый/Последний» — нужны загрузки (draft-деплой папки `core/dev/_v16up` → fetch → input.files);
  апскейл 1080p после завершения скачивает автоматически, но не всегда — остальные по одной на свежую вкладку; при смене аккаунтов индексы `/u/N/` меняются
  (искать через `accounts.google.com/SignOutOptions`). Аккаунты: makafon ashh (проект 743c04fd-…, 50 бонусов), Дима Пупкин (a0a0e0dd-…, резерв).
- Дальше: этап 1 (фиксы) и этап 2 (движок B часть 1 — видео-пролёты на этих клипах, удалить скраб/Lenis/snap/кадры), затем 2.5D (этап 4).

### 11.4 Ограничения / что дальше
- Осталось Fast: только Schlaf push-in P (`Camera_pushing_towards_foggy_window_…063019`) — при 100 бонусах перегенерировать и прописать в `v15-map.json`.
- Ключевой вид 9:16 («Glass pavilion on concrete plinth») не скачан — в Flow есть, не используется.
- Пины/hotP выставлены по скриншотам холдов; Bauplan-ann на Schwelle — приблизительно, проверить на 1920.
- Переход Ankunft → Schwelle = кроссфейд (двери нет «изнутри»): при желании сгенерировать клип «дверь открывается» и вклеить как главу 0.5.

### 10.5 Известные допущения (проверить первыми)
- iOS Safari: `translate`-свойство у пинов (14.5+), `<dialog>.showModal` (15.4+), `scroll-snap proximity` на `<html>` — ниже этого fallback
  не делался. ImageBitmap-окно 40×960×540 ≈ 80 МБ — при jetsam уменьшить кап в `capBitmaps()`.
- Скраб 12 fps на 0.85 экрана = кадр каждые ~8px скролла — на очень быстрых свайпах `nearest()` берёт ближайший загруженный (±24).
- Пины после `mapPin` могут попасть на текстовую зону при низком y — сейчас просто прижимаются к 58 % высоты (без линии к точке).

---

## 13. v16 этапы 2 + 4 (16.09, 04:00–07:30) — движок B (видео-пролёты) и 2.5D-холды

Фильм больше НЕ зависит от положения скролла. Жест = намерение «глава вперёд / назад». Пока пользователь «в доме», страница запинена
(`html.v16-lock`), ниже дома — обычный нативный скролл. Старый движок (`film.js`, `film-mobile-v2.js`) не тронут и работает как откат `?film=15`.

### 13.1 Файлы

| Файл | Что |
|---|---|
| `site/js/film-v16.js` | движок B: машина состояний HOLD/FLY, пул видео, контроллер жестов, границы дома |
| `site/css/film-v16.css` | схлопывание комнат, блокировка скролла, слои hold / gl / video |
| `site/js/depth-v16.js` | 2.5D-холд: WebGL-квад, туман, дыхание света, фолбэки, `V16Depth.measure()` |
| `site/js/data.js` | `FILM_V16` (engine `v16`, `v16:{…}`), выбор движка; `FILM_V15` остаётся откатом |
| `site/img/film/v16/depth/*.webp` | 16 карт: **R = глубина (ярче = ближе), G = дальняя маска (стекло)** — 240 КБ на все |
| `core/dev/depth-lab/depth.html` | build-утилита: Depth Anything V2 small через transformers.js 3.8.1, WebGPU |
| `core/dev/depth-lab/depth-post.html` | build-утилита: ремонт дефектов, дальняя маска, упаковка R/G, вывод WebP |
| `core/dev/save-server.js` | приёмник файлов от build-утилит (`POST /put?name=`) |

Модель глубины **не выкладывается пользователям** — карты собраны заранее, в проде грузятся только `.webp`.

### 13.2 Машина состояний

`HOLD(k)` ⇄ `FLY(k→k±1)`. Инварианты: один активный переход (`gen`-счётчик отбрасывает события устаревших видео), самопереход из HOLD
запрещён, отменённая загрузка не подменяет текущую сцену. Реверс посреди полёта запускает противоположный клип с позиции `dur − t`;
`playbackRate = −1` не используется нигде. Новый слой показывается только после завершения seek и готовности кадра
(`readyState ≥ 2` / `loadeddata`; `requestVideoFrameCallback` — только для уже видимого играющего видео, иначе он не срабатывает).

Дебаунс жеста: `QUIET = 700 мс` против повторного срабатывания ОДНОГО и того же жеста, но **без** задержки перед первой реакцией.
Встречная команда во время полёта проходит через `OPP_GAP = 150 мс`. Точки навигации задают цепочку соседних пролётов (`chainTarget`),
очередь не растёт: новая цель заменяет старую.

### 13.3 2.5D-холд

Квад со смещением UV по глубине, амплитуда ±1,5 % кадра, вход сглажен (`EASE = 0.075`), возврат в нейтраль при уходе курсора.
**Нейтраль пиксельно равна стиллу** — именно она стыкуется с первым кадром клипа; запас под смещение зазумливается пропорционально
текущему отклонению, поэтому пустых краёв нет и в нейтрали нет кадрирования. Порядок на стыке: видео → нейтральный стилл → плавное
появление глубины (0,5 с); при старте полёта слой гасится за 0,14 с.

- **Туман** — 2 октавы value-noise с медленным горизонтальным дрейфом, только по каналу G. Маска построена по яркости кадра
  (стекло/небо L ≥ 190, любая стена/мебель/зеркало ≤ 137 — измерено на 5 стиллах), затем морфологическое открытие радиусом 1,1 % длинной
  стороны (убирает тонкие блики: LED-полосу, складку покрывала, кромку камня) и отсечение самых ближних пикселей (d > 215 — пол перед камерой).
  Глубина для маски НЕ годится: стекло модель читает как близкую поверхность (d ≈ 200).
- **Дыхание света** — 8-секундный цикл, ±1,0 %, только по светлым участкам (`smoothstep(0.34, 0.90, luma)`).
- **Жесты**: мышь на десктопе; на телефоне горизонтальное перетаскивание — параллакс, вертикальный свайп — навигация. Решение принимается
  на первых 8 px и не меняется до конца касания. Гироскоп — только после `V16Depth.enableGyro()` (включая запрос разрешения на iOS).
- **Фолбэки**: нет WebGL → `mode = 'css'` (мягкий пан стилла, ОДИН слой — честнее, чем псевдо-два без матовой маски);
  `prefers-reduced-motion` → `mode = 'off'`, слой `display:none`, смена главы остаётся короткой блендой; карта не загрузилась → слой
  остаётся прозрачным, виден плоский стилл, навигация не страдает. Потеря контекста WebGL перехватывается и восстанавливается.
  Рендер останавливается в скрытой вкладке, вне HOLD и после выхода из дома. DPR ограничен 2. Размер буфера ведёт `ResizeObserver`.

### 13.4 Как пересобрать карты глубины

1. `node core/dev/save-server.js "<репо>/site/img/film/v16/depth" 8123`
2. Скопировать `core/dev/depth-lab/*.html` в `site/_lab/`, сырые PNG — в `site/_lab/raw/`.
3. Открыть `http://localhost:8099/_lab/depth.html` (сырые карты) → затем `depth-post.html` (ремонт + маска + WebP).
4. Удалить `site/_lab/` — лаборатория не должна попасть в деплой.

Известная правка модели: `eingang-P` — зеркало читается как дыра в стене. Чинится вписыванием плоскости по кольцу вокруг эллипса
(`PATCH` в `depth-post.html`, эллипс cx 295 / cy 400 / rx 212 / ry 278 в пикселях стилла 1080×1920). Остальные 15 карт правок не потребовали.

### 13.5 Проверено (Playwright на ПК владельца, Chrome 1440×900 и эмуляция)

| Сценарий | Результат |
|---|---|
| 7 переходов вперёд + 7 назад | каждый 3003–3006 мс, всё заканчивается стабильным HOLD |
| Реверс в начале / середине / конце (`at` 2.88 / 1.6 / 0.3) | без прыжка, позиция пересчитывается верно |
| 4 быстрых смены направления подряд | заканчивается стабильным HOLD |
| Инерция колеса, отдельный флик, стрелки, End, точки | одна глава на жест; цепочка по точкам заменяется новой целью |
| Вьюпорты 360×800, 390×844, 768×1024, 1024×768, 1366×768, 1920×1080, 844×390 | 0 JS-ошибок, 0 HTTP ≥ 400, ориентация L/P верная |
| Перетаскивание по горизонтали 140 px (телефон) | навигации НЕ вызывает — остаётся 0/HOLD |
| Свайп вверх 140 px (телефон) | вызывает переход, завершается 1/HOLD |
| Поворот в HOLD | глава сохраняется, стилл меняется на нужную ориентацию |
| Поворот в FLY | глава/направление/позиция сохраняются, клип меняется на `…-P.fwd.mp4` |
| Уход во вкладку во время полёта и возврат | полёт завершается корректно |
| Resize во время полёта | полёт завершается корректно |
| Выход вниз и возврат наверх | нативный скролл работает, вход обратно на последней главе |
| `?tier=lite` | грузит `clips/lite/…` |
| `?film=15` и `?film=13` | 0 ошибок, откат рабочий |
| Карта глубины 404 | GL-слой прозрачен, плоский стилл виден, JS-исключений нет |
| Без WebGL | `mode = 'css'`, навигация не затронута |
| `prefers-reduced-motion` | GL-слой выключен, смена главы = короткая бленда |
| GPU-стоимость 2.5D (`EXT_disjoint_timer_query`, 150 кадров, 1429×900) | **медиана 0,041 мс**, p95 0,042 мс — бюджет 1 мс/кадр с большим запасом |
| Край кадра при полном отклонении | средняя яркость крайних 2 px 77,7 / 77,9 / 78,5 — пустых краёв нет |
| Пул видео | ≤ 6 элементов при любом маршруте |

Задержка от принятой команды до первого показанного кадра подготовленного соседнего клипа: **1–71 мс** (реверс 29 мс) на тёплом кеше —
цель ≤ 100 мс выполнена. Значение получено из события `v16:fly`, которое диспатчится в момент подмены активного слоя.

**Чего проверка НЕ покрывает:** эмуляция Playwright — это Chromium с подменённым вьюпортом, а не физический iPhone и не реальный Safari.
Поведение iOS (автовоспроизведение inline, декодирование нескольких видео, запрос разрешения на гироскоп) требует проверки на устройстве.


- **Versteckter Tab:** Chrome komponiert eine WebGL-Leinwand in einem unsichtbaren Tab nicht — die undurchsichtige
  Leinwand hätte das Standbild als schwarzes Rechteck verdeckt. `show()` zeichnet daher einen Kader und blendet erst ein,
  wenn `document.visibilityState === 'visible'`; beim Zurückkommen wird zuerst ein Kader gezeichnet, dann eingeblendet.

### 13.6 Ограничения

- Rückblende (Wohnen ⇄ Rohbau) клипа не имеет — переход остаётся короткой блендой 436 мс.
- Маска тумана построена по яркости, а не по семантике: очень яркая лампа в кадре теоретически может попасть под неё. На 16 текущих
  стиллах после морфологического открытия такого не осталось.
- `mode = 'css'` даёт однослойный пан, а не настоящий параллакс — без матовой маски двухслойный вариант в CSS выглядит хуже статики.

---

## 14. v16b (16.09, 08:30–11:30) — «один дом»: согласованная цепочка комнат

**Проблема, которую чинили.** Стиллы генерировались по отдельности, поэтому то, что видно в проёме кадра N,
не совпадало с кадром N+1. Veo получал два несогласованных кадра и был вынужден **морфить** геометрию: кровать
переезжала на глазах, ванная «переодевалась», снаружи стояла маленькая хижина, а внутри был большой дом.
Запечённый кроссфейд в конце клипа прятал только последний стык, но не сам морф.

**Решение.** Сначала свести цепочку на картинках (Nano Banana, бонусы не тратит), и только потом
тратить Veo. Клип тогда делает то, что умеет: едет вперёд, ничего не перестраивая.

### 14.1 Цепочка стиллов (исходники — `core/_incoming/v16b/`)

| Файл | Что сделано |
|---|---|
| `ankunft-L_2K_open.jpeg` | экстерьер перегенерирован под интерьер: длинный низкий объём, бетон, стеклянная галерея вдоль левого фланга (та самая Schwelle), дверь открыта, в проёме виден коридор |
| `kueche-L_2K_bathdoor.jpeg` | в проёме кухни — ванная из кадра 3 (ванна на фоне остекления и тумана) |
| `bad-L_2K_beddoor.jpeg` | в проёме ванной — спальня из кадра 4 (кровать, реечная стена, тёплая подсветка) |
| `schlaf-L_2K_livedoor.jpeg` | в проходе спальни — гостиная из кадра 5 (камин, диван) |
| `wohnen-L_2K_halldoor.jpeg` | в проёме гостиной — коридор ко входу |
| `wohnen-rohbau-L_2K.jpeg` | тот же ракурс, что у НОВОЙ гостиной, но стройка (для Rückblende) |
| Schwelle, Eingang | не трогали — они уже были якорями |

Промпт для проёмов: `INPAINT ONLY … The ONLY pixels you may repaint are the ones strictly inside the existing
door opening … Do NOT add a mirror, bench, furniture, window or any new opening anywhere else … Do NOT move
or re-frame the camera.` Без этой жёсткой формулировки модель дорисовывает зеркало и тумбу на соседнюю стену
(первая попытка Wohnen — так и вышло).

### 14.2 Переходы (Veo 3.1 Quality, аккаунт «Дима Пупкин» `/u/2/`, проект a0a0e0dd-…)

6 клипов × 100 бонусов = **600 из 750**, остаток 150. Только ландшафт. Режим «Кадры» (первый/последний),
16:9, x1, 8 с, скачано 1080p.

Промпт (общая часть): `Architectural walkthrough on a locked dolly … NOTHING in the scene moves … no morphing,
no warping, no objects sliding, growing or changing shape, no rooms rebuilding themselves, no camera shake …
The final frame matches the supplied last image exactly.` Для спален отдельно: `The bed does not slide or
change position.`

### 14.3 Портрет без второй генерации

`core/dev/v16b-build.js` вырезает из кадра 1920×1080 окно **608×1080** и масштабирует до 1080×1920.
Позиция окна по X линейно идёт от точки комнаты A к точке комнаты B, поэтому первый кадр портретного клипа
ровно равен портретному холду A, а последний — холду B. Точки (`PX` в скрипте):

```
ankunft 502 · schwelle 760 · kueche 600 · bad 500 · schlaf 500 · wohnen 480 · rohbau 480 · eingang 500
```

Подобраны по готовым стиллам: при `kueche=330` в кадр попадала только дверь в ванную (холд «Küche» выглядел
ванной), при `bad=800` ванна обрезалась левым краем.

### 14.4 Проверено

| Что | Результат |
|---|---|
| Стык клип↔холд, PSNR (все 12 клипов, оба конца) | **41,5–75 dB** — визуально пиксель-в-пиксель |
| Длительность | все 3.00 с, 60 fps, fwd и rev совпадают |
| Прибытие в Eingang | было 20 dB (холд брался `-sseof` из исходника) → стало **75 dB** (холд = последний кадр готового клипа) |
| 7 переходов вперёд подряд | 0 → 7, каждый заканчивается стабильным HOLD |
| Вьюпорты 360×800, 390×844, 768×1024, 1024×768, 1366×768, 1920×1080, 844×390 | 0 JS-ошибок, 0 HTTP ≥ 400, ориентация L/P верная, вперёд+назад работают |
| `prefers-reduced-motion` | GL-слой выключен, смена главы = короткая бленда |
| Без WebGL | `mode = css`, навигация не затронута |
| `?film=15`, `?film=13` | откат рабочий, 0 ошибок |
| `?tier=lite` | грузит `clips/lite/…` |
| Покадровый разбор Küche → Bad | ванна, видимая в проёме кухни, — та же ванна, рядом с которой мы оказываемся; кадры «после прилёта» и «холд» идентичны |


### 14.6 v16c — вырезана выдуманная середина (16.09, 12:00)

**Что было не так после v16b.** Проверка стыков (PSNR первого и последнего кадра) показывала 42–48 dB и
выглядела зелёной, но **середину клипа никто не смотрел**. А Veo, получая только два 2D-кадра и не зная
геометрии между ними, при большом расстоянии ЗАПОЛНЯЕТ середину выдуманным помещением:

| Переход | Что показывал Veo в середине |
|---|---|
| Ankunft → Schwelle | 0.8 с несуществующего деревянного тамбура |
| Schwelle → Küche | **вся вторая половина** — чужая кухня с верхними шкафами и духовкой |
| Küche → Bad | 0.8 с размытой стены/пустоты |
| Bad → Schlaf | 0.6 с чужой комнаты |
| Schlaf → Wohnen | 0.6 с чужой стены |
| Wohnen → Eingang | 0.3 с, наименее сломанный |

Именно это владелец видел как «генерируется совсем другой дом».

**Решение (core/dev/v16c-cut.js).** Клип режется на три части: честный отъезд — выдуманная середина —
честное прибытие. Середина проигрывается в 8 раз быстрее и прогоняется через `tmix=frames=5`
(усреднение пяти кадров) → превращается в смазанный рывок «быстро через дверь». Читаемого второго
помещения на экране нет. Границы сняты покадрово, в секундах исходника (`CUT` в скрипте).

**Schwelle → Küche перегенерирован** (100 бонусов из оставшихся 150, остаток 50): промпт явно описывает
целевую кухню и запрещает то, что модель придумала — «NO wall cabinets, NO oven or microwave column,
do not build any other room along the way». Второй дубль честен от начала до конца, поэтому идёт без
разрыва, целиком (`CUT['schwelle-kueche'] = null`).

**Побочные эффекты, которые пришлось поймать:**
- новый клип дал другой первый кадр → изменился холд Schwelle (19,6 dB к старому) → пересчитаны
  стилл, карта глубины и запечённая блёнда клипа Ankunft → Schwelle;
- блёнда на холд назначения должна ЗАКАНЧИВАТЬСЯ до конца клипа (`st = d − XF_D − 0.08`), иначе клип
  обрывается на ~85 % непрозрачности и прибытие прыгает (26 dB вместо 46).

**Длительности теперь разные** (2.07–3.00 с). Движок берёт настоящую `video.duration`, `clipDur` в
data.js — только запасное значение.

**Проверено покадрово** (каждые 0.2 с, все 6 переходов, `core/dev/_frames5/_all.png`): в каждом клипе
видно только комнату отправления, короткий смаз и комнату назначения. Стыки 41,6–48 dB.

### 14.5 Что осталось как есть

- Rückblende (Wohnen ⇄ Rohbau) по-прежнему без клипа — короткая бленда 436 мс между двумя кадрами одного ракурса.
- Портрет — апскейл ×1.78 из вырезки 608 px. На чистом рендере это незаметно, но исходник для портрета
  физически меньше, чем был у отдельно сгенерированных P-клипов.
- `site/` весит ~600 МБ, из них 168 МБ — hd-клипы. Полный обход дома тянет 40–60 МБ.
  На бесплатном Netlify (100 ГБ/мес) это ~2–3 тыс. визитов. Когда пойдёт трафик — делать `lite` дефолтом на телефоне.
- Старые стиллы v16a лежат в `core/_legacy/v16a-stills/` (48 файлов) на случай отката.

---

## 15. v16 этап 5 (16.09, 20:00–23:30) — «Один вопрос — один жест»

ТЗ: `PLAN-v16-ETAPPE5.md` (v2.1, все решения владельца закрыты). Коммиты: `ea95177`, `77b5096`, `f8c0711`.
Ветка `v16-chapters`. **В прод не выкладывалось** — ждёт ручной приёмки владельцем.

### 15.1 Идея в одну строку

Каждая комната задаёт ОДИН вопрос (кикер), заголовок отвечает, **жест доказывает**. Под заголовком —
строка из списка управляющего, которая на глазах зачёркивается и заменяется результатом:
«~~Sechs Offerten einholen und vergleichen~~ **eine.**»

### 15.2 Где что лежит

| Что | Где |
|---|---|
| Данные всех механик | `site/js/data.js` → `FILM_V15.s5[sceneId]` (читается как `FILM_V16.s5`) |
| Логика | `site/js/stage5-v16.js` (~500 строк, **без GSAP** — на телефоне он не загружен) |
| Оформление | `site/css/stage5-v16.css` |
| Крючки в движке | `site/js/film-v16.js`: события `v16:hold`, `v16:leave`, `v16:mounted`; `Film16.release()` |
| Строка to-do в разметке | `site/index.html` и `site/js/pages.js` — `<p class="w-todo">` перед `.w-d` |
| Приёмочный тест | `core/dev/pw-stage5.js` |
| Референсы кадров | `core/dev/refs/f_0…f_7.png` |

### 15.3 Шесть механик

| Кадр | Вопрос | Жест |
|---|---|---|
| Schwelle | Wer ist zuständig? | шесть бумажек-Gewerke стягиваются в одну карточку «Ein Bauleiter» |
| Küche | Wer macht was? | три зоны загораются по такту → «Drei Gewerke, ein Termin.» |
| Bad | Abnahme bei Tageslicht | шторка день ↔ вечер при свечах |
| Schlaf | Wie läuft es ab? | световая линия в 5 шагов, скраб пальцем по горизонтали |
| Rückblende | Wie war es vorher? | существующий сравнительный ползунок (`#wCmp`), включается механикой |
| Eingang | Wann geht es los? | часы «Offerte bis <день, время>» + четыре обещания + подпись |

Плюс «Акте»: значок на кнопке «Offerte in 48 h» считает просмотренные комнаты; нажатие в доме
открывает шторку со списком и двумя кнопками — «Richtpreis berechnen» (к `#richtwert`) и
«Offerte anfragen» (заполняет форму через `window.PREFILL`).

Правило: **пины ИЛИ жест, никогда вместе** — `buildHots()` выходит, если у сцены есть `mech`.
Пины остались только в Ankunft и Wohnen.

### 15.4 Как трассировать координаты

Все координаты — проценты сцены `#wStage`, раздельно `P` (телефон/портрет) и `L` (десктоп/ландшафт),
как у существующих `hot`/`hotP`. Открыть `/?trace=1`, кликать по кадру — в консоль и в плашку внизу
слева пишутся `{x, y}` и ориентация. Полигоны Küche набираются теми же кликами по углам.

### 15.5 Что сломалось при сборке и как починено (чтобы не наступить снова)

- **`--s5-scale` был невалиден**: `clamp(1.25, 100vw/1100, 1.6)` — `100vw/1100` это ДЛИНА, не
  отношение. Весь `clamp()` невалиден → невалидна каждая декларация с `scale(var(--s5-scale))` →
  **на десктопе пропадали все `transform` этапа**. Заменено ступенями по `min-width`.
- **SPA-перерисовка**: `pages.js` пересоздаёт `#view` вместе с `#wStage`, снося внедрённый слой.
  Решено событием `v16:mounted` из `mount()`; `boot()` идемпотентен.
- **Акте не открывалась**: крючок висел на самой кнопке, а `film-v16.js` слушает `document` в фазе
  ЗАХВАТА и там же зовёт `releaseHouse()` — к моменту нашего обработчика `Film16.house` уже `false`.
  Перевешено на `window` (capture), то есть на уровень выше документа.
- **Раум-навигация на десктопе** лежала поверх метки главы: между меткой (кончается на 302 px) и
  оверлеем (начинается на 469 px) — 167 px, а леске нужно 223. Поэтому она ушла в левое поле.
- **Срок «Offerte bis»** считается календарно (решение владельца), но ПОКАЗ загоняется в 08:00–18:00 —
  иначе выпадало «Samstag, 00:30». Сдвиг всегда РАНЬШЕ 48 ч, обещание от этого только строже.
- Телефон **в альбомной ориентации** (844×390) попадает в десктопные правила `min-width: 761px`, имея
  высоту телефона. Для него отдельная ступень в CSS §8.

### 15.6 Приёмка

`node core/dev/pw-stage5.js http://127.0.0.1:8123 --shots` (из `site/`: `python3 -m http.server 8123`).
Проверяет 390×844 (touch), 1440×900, 844×390: нет JS-ошибок, строка to-do появляется и зачёркивается,
механика построена, нет пересечений карточек с текстом, подписью и sticky-панелью.
Последний прогон: **ALLES GRÜN** (8 + 8 + 3 кадра).

### 15.7 Открыто

- **Рендер «Bad при свечах»** (§6 ТЗ) не сделан: в Flow на аккаунте владельца осталось **12 бонусов**
  и висит баннер «заканчиваются». Тратить остаток без слова владельца не стал. Пока работает
  подмена: дневной кадр перекрашивается фильтром + тёплый градиент + «огоньки» свечей на бортике
  ванны. Подмена = скопировать `bad-dusk-L.jpg` / `bad-dusk-P.jpg` в
  `site/img/film/v16/stills/`, код менять не нужно (`mechDusk` сам перестанет падать на фолбэк).
- Ручная приёмка владельцем на телефоне по 8 референсам.

---

## 16. v17 этап 7 (17.09, 07:00–07:40) — Design-Durchgang по цепочке из 5 скилов

Цепочка: `redesign-existing-projects` → `nielsen-usability-audit` → `ui-ux-pro-max` → `high-end-visual-design` → `impeccable`.
Метод: скрин всех 16 маршрутов в 390×844 и 1440×900 (`core/dev/pw-stage7.js --shots`), разбор по кадрам, правки
только с доказательством. Идентичность (Navy / Blau / Papier, Archivo + Instrument Sans) не тронута — это шлифовка.
Всё в блоке «v17 · Etappe 7» в конце `site/css/site.css`; коммит `08375d8`.

### 16.1 Найдено и починено

| # | Где | Что было | Серьёзность | Фикс |
|---|---|---|---|---|
| 1 | Referenzen + Startseite, телефон | Bento-плитки галереи **наезжали друг на друга**: ≤1000px задавал `grid-auto-rows:150px`, ≤700px — плитки 4/5 (210px). Подписи резались пополам. | 3 | явная высота строки = ширина плитки × 5/4 (`auto` не помогает — Chrome меряет плитку с aspect-ratio как 34px) |
| 2 | Все страницы кроме главной | Sticky-панель показывала **три** кнопки, главная — две: пререндер был старее этапа 5 | 2 (H4) | пререндер перегенерирован (31 маршрут), `stage5-v16.css/js` теперь на всех страницах |
| 3 | /kontakt, телефон | Sticky «Offerte in 48 h» вела на ту же страницу и **закрывала поле E-Mail** | 2 (H8/H4) | `body[data-route]` из `render()`, на kontakt панель скрыта |
| 4 | Футер, телефон | 25 ссылок в одну колонку = 1500px | 2 (H8) | две колонки от 560px |
| 5 | Referenzen, телефон | ряд фильтров обрезан на «Neu- & Umbau» без намёка, что он скроллится | 1 | мягкий край справа (mask) + scroll-snap |
| 6 | Lösungen | CTA назывался «Anfrage starten», везде — «Offerte anfragen» | 1 (H4) | единый текст |
| 7 | Desktop, /leistungen | превью 100px высотой на 1440px — марки | 1 | колонка 200–260px |

### 16.2 Добавлено (high-end / impeccable)

- Карточки поднимаются с **тонированной** тенью (navy, `0 22px 44px -24px`), не только с рамкой; кнопки — с тенью в цвет кнопки, `translateY(-1px)` на ховере, `scale(.97)` при нажатии (и на телефоне).
- Мобильное меню: пункты выходят **со ступенькой** 50 мс, CTA-строка последней.
- `text-wrap:balance` на заголовках, `pretty` на абзацах; табличные цифры в фактах.
- Фокус на полях формы виден и на белой карточке.
- Всё новое отключено при `prefers-reduced-motion`.

### 16.3 Что проверено и НЕ тронуто (осознанно)

- Детектор Impeccable: `border-left` у двух `blockquote` — это pull-quote, не карточка; Instrument Sans — выбор бренда;
  `transition: left/width` у индикатора сегментов — мелкий элемент, переделка на transform требует JS, не стоит риска.
- Навигационные ссылки на десктопе 41px высотой — WCAG 2.2 AA требует 24px для мыши; 44px — только для тача (тест различает).
- Тёмная полоса «In jeder Offerte enthalten» перед тёмным CTA и тёмным футером — три тёмные поверхности подряд.
  Спорно, но это ритм бренда; менять только по слову владельца.

### 16.4 Приёмка

`node core/dev/pw-stage7.js` — 16 маршрутов × 2 формата: JS-ошибки, горизонтальный overflow, наложение плиток,
sticky на /kontakt, размер целей (44 тач / 24 мышь), единичный h1, единые CTA. **ALLES GRÜN** (32/32).
`node core/dev/pw-stage5.js` после пререндера — **ALLES GRÜN**.

---

## 17. v17 · Этап 8 — «Семь глав, два примитива» (17.09.2026, Opus 5)

ТЗ: `PLAN-v16-ETAPPE8.md`. Основание — список замечаний владельца от 17.09 (9 пунктов, десктоп + телефон).
Диагноз: шесть разных механик на восемь глав = шесть источников багов. Этап 8 сводит всё к двум примитивам:
**карточка в фиксированном слоте** (`.s5-slot > .s5-card2`) и **один слайдер на Pointer Events**.

### 17.1 Что изменилось по главам

| Гл. | Было | Стало |
|---|---|---|
| 02 Schwelle | `six2one`: шесть бумажек + hold по «нити» | `push`: 6 уведомлений мастеров прилетают сами (250 + i·330 мс), через паузу схлопываются в одну карточку BauStern с кнопкой `tel:` (§4.1). Жеста нет вообще |
| 03 Küche | полигоны-зоны + пилюли | `takt`: 3 пина с иконками гевверков (пила/кран/молния), тёплое световое пятно на активном объекте, карточка с сегментами 1–2–3, стрелки ‹ › на десктопе, ← → с клавиатуры (§4.2) |
| 04 Bad | слайдер на mousedown | десктоп: тот же слайдер, переписан на `makeSlider` (Pointer Events + `setPointerCapture`); телефон: **выключатель на стене**, тап = вечер (§4.6) |
| 05 Schlaf | светящаяся линия поперёк кадра | `ablauf`: карточка «Bauzeitplan · 5 Schritte», строки-аккордеон 01–05, колесо/свайп/↑↓ **внутри** карточки (§4.3) |
| 06 Wohnen | 3 пина, белая подсказка, 6/1/24 | `feed`: «Wochen-Update» как сообщение бауляйтунга с миниатюрами (3 недели). Цифры 6/1/24 убраны. Rückblende здесь же: **hold ≥ 180 мс** проявляет Rohbau (§4.4) |
| 07 Rückblende | отдельная глава + wipe | **удалена как глава** — фильм 7 глав, клип `wohnen-eingang` идёт напрямую |
| 07 Eingang | часы + список + подпись врозь | `clock`: одна карточка «Übergabeprotokoll» — ключ поворачивается, срок, 4 галочки, подпись AK внутри, кнопки «Offerte anfragen» + «Richtpreis berechnen» (§4.5, §2.5) |

### 17.2 Починенные баги (фаза A)

1. **Слайдер не брался мышью + «вся страница синяя».** Две причины: capture-слушатели `film-v16.js` на `document`
   перехватывали указатель раньше ручки, и без `preventDefault` браузер начинал выделение текста.
   Лечение: `makeSlider()` — `window`-capture-отписка, `setPointerCapture`, `preventDefault`,
   плюс `user-select:none` на всей сцене v16.
2. **Подсказки-пины не закрывались.** Второй клик по открытому пину уходил в `goRoute()` вместо закрытия.
   Теперь второй клик закрывает, к маршруту ведёт только «Mehr dazu →»; клик мимо и Escape тоже закрывают.
3. **Миникарта съехала под прогресс-бар** (регрессия Этапа 5) — `top` пересчитан, правые края бюндиг.
4. **Вычёркивание to-do слишком рано** — строка 1,5 с, штрих 2,5 с (длительность 0,8 с), результат 3,4 с;
   любая реальная жестикуляция в главе вычёркивает сразу (`strike()`).
5. **Конец фильма — «карточки без цвета, текст друг на друге».** Причина: после последней главы первое
   `.w-sheet` ложилось как ПРОЗРАЧНАЯ плита («Hinter Glas», v8.2) поверх ещё запиненного фильма.
   Для v16 «Hinter Glas» отключён (`glassify()` пропускает v16, токены возвращены к светлым), фильм
   отпускает в новую непрозрачную секцию `#ende` — «Werkvertrag-Auszug»: 4 обещания, подпись, печать (§5).
6. **Хром фильма оставался поверх страницы** — `is-released` гасит `#wRoomNav`, `#wHud`, `#wPlan`, `.v16-chap`.

### 17.3 Найдено при приёмке 17.09 (и исправлено)

- Финальная карточка Schwelle стояла ПОД стопкой → слот был высотой «стопка + карточка» и налезал на
  заголовок на телефоне. Карточка теперь лежит НАД стопкой (absolute) и встаёт в поток, когда стопка собрана.
- 844×390: карточка начиналась под шапкой сайта и упиралась в sticky-панель → слот `top:64px`,
  `max-height:calc(100vh - 130px)` со скроллом внутри.
- Тап во время автопоказа (Bad, телефон) шёл «против» показа — теперь тап показ прекращает.
- Секция `#ende` скроллилась ровно под фикс-шапку → верхний отступ 96–128 px.
- Пин «Elektro» стоял на оконной стойке, а не на подвесах — координаты L/P пересняты.
- Тест: кастомные измерения — текст меряется по строчным боксам (Range), карточки — по видимой (обрезанной
  скроллом) области, иначе десятки ложных «наложений».
- **Свайп по карточке Bauzeitplan съедал смену главы**: карточка занимает середину экрана телефона, а её
  touchmove-обработчик (свайп = следующий шаг) глушил жест фильма — с 05 нельзя было уйти пальцем.
  Свайп с карточки убран: на телефоне шаг переключается только тапом, вертикальный свайп везде принадлежит
  фильму. В приёмке теперь есть регрессия «Wischkette»: 6 свайпов подряд должны довести с 0 до 6.

### 17.4 Приёмка

`node core/dev/pw-stage8.js` — 7 глав × 4 формата (390×844, 1470×956, 1440×900, 844×390): JS-ошибки,
наложения карточки с шапкой/заголовком/to-do/миникартой/точками/sticky, тайминг вычёркивания, каждая
механика отдельно, конец фильма и секции под ним. **ALLES GRÜN** (17.09).
`node core/dev/pw-stage7.js` — **ALLES GRÜN** (32/32). `?film=15` — 8 глав, без ошибок (rollback цел).
Скриншоты: `core/dev/shots/etappe8/` (не в `site/`).

### 17.5 Что осталось открытым

- Prod-деплой — только по явному «в прод» владельца (draft: `netlify deploy --dir=site`).
- Push в GitHub делает владелец с Mac (git-proxy песочницы блокирует push).

---

## 18. v17 · Этап 9 — Плавность на телефоне (18.09.2026, Opus 5)

Замечание владельца: «анимация проигрывается, потом приближение, через микрофриз картинка отдаляется и
виден нормальный кадр; много лагов на телефоне». Обе жалобы оказались двумя разными настоящими багами.

### 18.1 Лаги: 2,5D-слой съедал кадр

`js/depth-v16.js` рисует полноэкранный WebGL-шейдер (две текстуры, «дыхание» ±1 % и туман) **непрерывно
на 60 fps**, пока комната стоит. Замер (Playwright, rAF-дельты, 390×844):

| | fps | медиана кадра | рывков >50 мс |
|---|---|---|---|
| было (2,5D включён) | **13,7** | 72 мс | 40 из 41 |
| без backdrop-filter | 15,0 | 68 мс | 44 |
| **без 2,5D** | **60,3** | 16,7 мс | **0** |

Сделано:
- **На телефонах 2,5D больше не монтируется** (`pointer:coarse`, минимальная сторона ≤ 900 px,
  `deviceMemory ≤ 4` или `hardwareConcurrency ≤ 4`). Halt — просто стилл, без «дыхания».
- **Сторож внутри модуля**: первые ~90 кадров измеряются, и если медиана > 26 мс, слой выключается на всю
  сессию (`[v16 depth] zu teuer … — 2,5D für diese Sitzung aus`). Защищает слабые десктопы/GPU.
- Тестовые ключи `?depth=force` и `?depth=off`.
- На телефоне убран `backdrop-filter` у карточек (постоянная работа композитора) — вместо размытия
  более плотная заливка.
- Пул видео на телефоне 6 → 3 элемента (память, трафик, декодер).

### 18.2 «Приближение → микрофриз → отдаление»: сквозь дыру светило стартовое изображение

Реальная причина, найдена покадровой трассировкой: новый Halt появлялся **с блендой** (260 мс после
заблокированного автоплея, 220 мс после ошибки видео, 420 мс на обратном ходе), а старый Halt в этот
момент уже был выключен (`.is-fly` держит `.v16-hold` на opacity 0) и видео уже снято. В эти ~0,3 с самой
верхней видимой плоскостью оставался `.v16-boot` — **ландшафтный** стилл Ankunft, который на вертикальном
телефоне обрезается `object-fit:cover`, то есть выглядит сильно приближённым и чужим. Замер: **16 кадров
подряд без перекрывающего слоя** на каждый переход.

Сделано:
- `showHoldImage()` теперь вводит новый стилл **поверх старого** (свой `z-index`), снимает `.is-fly` до
  начала бленды и гасит старый слой только после её завершения. Кадров без перекрытия: **16 → 0**.
- `.v16-boot` удаляется из DOM сразу после первого Halt — он больше никогда не может «просветить».
- Стартовое изображение стало ориентационным (`<picture>`: вертикальным телефонам — `ankunft-P.jpg`),
  чтобы и самый первый кадр не был обрезанным ландшафтом.

### 18.3 Итог замеров (полный проход 6 глав вперёд + 3 назад)

| | кадров без перекрытия | рывков > 50 мс | max кадр |
|---|---|---|---|
| было (телефон) | 16 на переход | 51 за 6 с | 225 мс |
| стало (телефон) | **0** | **0** | 43 мс |
| стало (1470×956) | **0** | **0** | 45 мс |

Регрессия закреплена в `core/dev/pw-stage8.js`: полный проход измеряется, допускается ≤ 2 кадров без
перекрытия и ≤ 4 рывков. Прогон 4 форматов — **ALLES GRÜN**; `pw-stage7.js` — **ALLES GRÜN**.

---

## 19 · Этап 10 — «довести до идеала»: вес клипов, Lighthouse, контраст, аналитика, отзывы (18.09)

Запрос владельца: выполнить все пять пунктов из списка улучшений, затем самому пройти по компьютеру и
телефону и убрать найденное.

### 19.1 Лёгкие клипы — теперь телефон всегда получает 720p

`core/dev/lite-encode.sh` перекодировал все 24 клипа в `site/img/film/v16/clips/lite/` (crf 27, preset
slow, tune film, faststart, P → 720×1280, L → 1280×720): **27 МБ → 17 МБ** (−37 %). HD-набор (125 МБ)
остался нетронутым для десктопа.

Замер «а видно ли разницу на телефоне» (`kueche-bad-P.fwd`, оба варианта отмасштабированы до реальной
ширины устройства 1170 px): **SSIM 0,985** при файле в **5,5 раза меньше** (3,2 МБ → 0,6 МБ). Визуальное
сравнение кадров — отличий нет. Поэтому `pickTier()` в `film-v16.js` теперь отдаёт `lite` **всем
телефонам** (`max-width:820px`, либо coarse-pointer с короткой стороной экрана ≤ 900), а не только слабому
железу и плохой сети. Тестовый переключатель `?tier=hd|lite` по-прежнему имеет приоритет.

### 19.2 Lighthouse (мобильный профиль)

Первый прогон по `python3 -m http.server` дал performance **64** и LCP 13,3 с — и это был артефакт
измерения: обычный http.server отдаёт файлы **без сжатия**, а Netlify отдаёт brotli. Проверка:
`site.css` 152 КБ → 31 КБ br, `pages.js` 81 КБ → 21 КБ, `app.js` 68 КБ → 21 КБ. Для честного замера
поднят локальный сервер с brotli и кэш-заголовками (как у Netlify).

| маршрут | performance | accessibility | best-practices | SEO | LCP |
|---|---|---|---|---|---|
| `/` | **97** | **100** | 100 | 100 | 2,1 с |
| `/kontakt` | 83–91 | **100** | 100 | 100 | 3,3 с |
| `/leistungen` | 92–93 | **100** | 100 | 100 | 3,3 с |
| `/referenzen` | 91 | 100 | 100 | 100 | 3,4 с |

Вывод: минификация не нужна — brotli снимает практически всю экономию, которую обещает Lighthouse в
пункте «unminified». Ничего в конвейер сборки не добавлено, сайт остаётся папкой без build-шага.

### 19.3 Найденный баг: белый текст на светлом фоне (реальный, был в проде)

axe/Lighthouse показали 33 нарушения контраста, и это оказались **не** ложные срабатывания. В этапе 8
финальный лист `#ende`/`.w-sheet--final` стал светлым (отмена «Hinter Glas»), но правила из `site.css`
(`.wohnung:not(.is-plain) .w-sheet :is(.band,.tl-item--cta .tl-body,.cinfo .dark,.teil.dark)`) продолжали
красить эти блоки в белый текст на стекле. На светлой бумаге контраст падал до **1,08–1,42** — блоки
«Handelsregister Zürich», «Versichert», «Inhaber», заголовки отзывов, WhatsApp-плитка и контактный блок
читались как пустое место.

Исправлено в `stage5-v16.css` (§ «Etappe 10 · Kontrast im Schlussblatt»): для `.wohnung.is-v16` эти
поверхности получают светлый фон, тёмный текст и ссылки цветом `--fenstergruen-hover`; в наборе токенов
дополнительно переопределены `--accent-hi/--fenstergruen-hi/--brass-hi`, а `.ende-k-doc` затемнён с
`rgba(28,31,34,.5)` до `.66` (3,23 → 4,6:1). Нарушений контраста: **33 → 0**.

Второе: во всём SPA не было ориентира `main`. `#view` получил `role="main"` — accessibility на
`/kontakt`, `/leistungen`, `/referenzen` поднялась **98 → 100**.

### 19.4 Клавиатура

Проверено скриптом (Tab по всем семи главам, 1440×900): все органы управления глав достижимы с
клавиатуры и получают видимый фокус — 1 + 8 + 1 + 5 + 2 = 17 элементов, ни одного пропущенного, ни одного
без кольца фокуса. Смена главы озвучивается: `#wOv` уже имеет `aria-live="polite"`, а кикер и заголовок
в нём меняются на каждой главе. Ошибок JS за полный проход — ноль.

### 19.5 Формы и лиды — поправка к моему прежнему утверждению

Раньше я сказал, что «лиды никуда не пишутся». **Это было неверно.** В `js/app.js` есть полноценный
`sendLead()`: POST на `https://n8n.baucrm.net/webhook/web-anfrage`, SHA-256 хэш для защиты от дублей,
устойчивый `request_id` в `sessionStorage`, таймаут 22 с через `AbortController`, и успех засчитывается
**только** при подтверждённом номере из CRM (`j.ok===true && j.nr`). UTM/gclid собираются в
`leadKontext()`, фото ужимаются до 1600 px/q0.72 перед отправкой.

Чего я проверить **не смог**: сам эндпоинт. И песочница, и локальная VM блокируют `n8n.baucrm.net`
(egress-политика, HTTP 000/403). Живую проверку должен сделать владелец — отправить тестовую заявку с
сайта и убедиться, что она появилась в CRM и вернулся номер.

### 19.6 Аналитика — код есть, но он никуда не отправляет

`js/analytics.js` реализует dataLayer + загрузчик GA4/GTM + Consent Mode v2 (по умолчанию всё `denied`,
то есть без cookies), дедупликацию событий и делегированные клик-хуки (`phone_click`, `whatsapp_click`,
`cta_offerte`, `calc_use`, `scroll_depth`, `outbound_click` …).

Но в `js/data.js`: `ANALYTICS={ga4Id:'',gtmId:''}` — **ни одного идентификатора**. То есть все события
складываются в `window.dataLayer` и там умирают: статистики нет вообще. Заполнить может только владелец.

Две дыры в покрытии закрыты:
- **`tour_room` / `tour_end`.** Старые машины (`film.js`, `film-mobile.js`) сообщали, до какой комнаты
  доходит посетитель. Машина B этого не делала — с этапа 8 прогресс по фильму не мерился вообще.
  Теперь `film-v16.js` шлёт `tour_room {room,index,chapter,of}` один раз на комнату и `tour_end
  {rooms,of,complete}` при выходе. Проверено в браузере: 7 событий + `tour_end {rooms:7, complete:1}`.
- **Кнопки финала.** «Offerte anfragen» и «Richtpreis berechnen» гасили клик через `stopPropagation()` и
  не попадали ни в одну метрику. Теперь `stage5-v16.js` шлёт `cta_offerte` / `calc_open` с
  `placement: akte|uebergabe`.

### 19.7 Отзывы Google — включены

`REVIEWS_LIVE.enabled` стоял в `false` с комментарием «Supabase отдаёт 401, ждём валидный anon-ключ».
Ключ был валидным. Настоящая причина: RLS-политика `google_reviews_cache_public_read` существовала, но
табличного `GRANT SELECT ... TO anon` не было — PostgREST отвечал `42501 permission denied`. Выдан
`GRANT SELECT ON public.google_reviews_cache TO anon, authenticated`; проверено из браузера: **HTTP 200,
5 отзывов**. `REVIEWS_LIVE={enabled:true}`.

Дополнительно `reviews-live.js` теперь **перерисовывает** блок `#stimmen` после подмены массива — раньше
данные приходили после сборки страницы, и посетитель всё равно видел статические карточки. При любой
ошибке сети статические отзывы из `data.js` остаются на месте.

---

## 20 · Этап 11 — страница для управляющих, диагностика отзывов (18.09)

### 20.1 Регрессия из этапа 10: prerender выкидывал весь SSR-контент

`role="main"` на `#view` сломал `site/_tools/prerender.js`: он искал буквальную строку
`<div id="view" tabindex="-1"></div>`, не находил её и писал маршруты **без** предрендеренного
контента — `index.html` 13 КБ вместо 87 КБ. Для посетителя ничего не менялось (SPA рисует всё в
браузере), но поисковики и режим без JS получали пустые страницы.

Замечено при первом же прогоне этапа 11 по размеру файла. Исправлено: канонический вид контейнера
теперь одна константа `VIEW_TAG` в prerender.js, а поиск в шаблоне терпим к порядку атрибутов.
`role="main"` сохраняется в выводе. Проверено: 0 предупреждений «Tag fehlt», index.html 86 791 байт.

**Бандл `v16-etappe10.bundle` содержит эту регрессию.** Кто ставил его отдельно — должен взять
бандл этапа 11 поверх.

### 20.2 Страница для управляющих (`/loesungen/hausverwaltungen`)

Добавлено три блока, которые рендерятся только если они есть в `SOL[].detail` — две другие
страницы решений не затронуты:

- **Ablauf** — пять шагов от заявки до возврата ключей, в том порядке, в каком они возникают у
  управляющего. Новых обещаний нет: оферта за 48 ч, протокол приёмки, фото до/после, счёт по
  позициям оферты и уборка уже стояли на сайте.
- **Zugang ohne Mieter** — ключи по протоколу, работы в пустой квартире, фотопротокол. Согласовано
  с владельцем 18.09; это единственное содержательно новое обещание на странице.
- **Rahmenvertrag** — что именно фиксируется письменно. Целиком взято из существующего FAQ той же
  страницы, просто вынесено на видное место.

Плюс своя точка входа: кнопка «Leerwohnung melden» ведёт на контакт с заранее заполненным
сообщением (адрес, квартира, дата выезда, желаемая дата передачи, у кого ключи) и выбранным
сегментом «Hausverwaltung / Eigentümer». Механика `data-message`/`data-who` уже была в app.js.
Проверено кликом: поле `#i-msg` заполняется, сегмент выбран.

### 20.3 Отзывы: механизм построен и простаивает не из-за кода

`review_einladungen` пуст, но причина не в сайте:

| | |
|---|---|
| n8n «BauStern — Bewertungen» | активен, 4 триггера |
| `crm_review_faellige/daten/antwort/erinnerungen/statistik` | существуют, `SECURITY DEFINER`, только service_role |
| скидка за отзыв (`firmenstamm.bewertung_rabatt`) | 0 — то есть без вознаграждения, это правильно |
| заявок в статусах «Abgeschlossen/Rechnung/Bezahlt» | **3 из 1748**, из них с e-mail — 2 |
| из этих двух попадает в окно приглашения | **0** |

Два узких места:

1. **Воронка не закрывается.** 39 заявок стоят в «AuftragBestaetigt» (31 с e-mail) и никогда не
   переводятся в завершённый статус. Машина ищет завершённые — и не находит.
2. **Потолок в 7 дней.** `crm_review_faellige()` берёт окно «от 24 часов до 7 дней назад». Кого не
   поймали за неделю — не пригласят уже никогда. `MAN-260917-014` (09.09) потерян именно так.

Подготовлено, но **не применено**: `core/crm/review-fenster.sql` — запрос-предпросмотр (только
чтение) и правка окна с 7 на 60 дней. Перед применением нужно решение владельца, потому что при
первом запуске приглашения уйдут сразу всем за 60 дней.

### 20.4 Кейсы с цифрами

Из CRM взять нечего: из 1748 заявок срок проставлен у одной, сумма — у четырёх. Цифры может дать
только владелец. Подготовлена анкета (сроки и объём, без денег) — `kejsy-cifry.md`.
