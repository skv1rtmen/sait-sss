# BauStern v16 — ТЗ Этап 8 «Семь глав, два примитива» (v1.0, 17.09.2026)

Продолжает `PLAN-v16-ETAPPE5.md` (Этап 5) и `HANDOFF.md §15–§16`. Утверждено владельцем 17.09 после рендеров (`core/dev/refs/etappe8/etappe8-desktop.jpg`, `etappe8-phone.jpg`; скрипт рендеров — `core/dev/mock-etappe8.js`, он накладывает статичные оверлеи на живой фильм и годится как эталон размеров/позиций).
Вставь этот файл первым сообщением в чат для кода. Роль: фронт-разработчик (vanilla JS, без сборки; GSAP только ≥1000px, как и раньше). Дизайн решён — аккуратность важнее креатива. Все строки интерфейса — на немецком, из этого файла, без «улучшений».

---

## 0. Модели, правила, порядок

| Работа | Модель |
|---|---|
| Весь код §2–§6 | **Opus** |
| Мелкие правки после ревью владельца | Sonnet |

Правила владельца без изменений (`PLAN-v16.md §1`): деплой по умолчанию draft, **прод только по явному «в прод»**; `core/_incoming/` никогда не в `site/`; не утверждать, что проверено, если не проверено; старый GitHub-PAT скомпрометирован — не использовать. Ветка `v16-chapters`. Один коммит на раздел, Playwright-прогон (§7) после каждого. В конце — `HANDOFF.md §17`, пререндер (`node core/dev/prerender-run.js`), бандл владельцу (§8).

**Почему этап вообще нужен (диагноз владельца и мой):** в фильме шесть разных механик на восемь глав, каждая — отдельное мини-приложение со своими багами на трёх форматах. Этап 8 сводит всё к **двум примитивам**: (а) **карточка в фиксированном слоте** (один компонент для Schwelle, Küche, Schlaf, Wohnen, Eingang), (б) **один `Slider`** на Pointer Events (Bad-десктоп). Rückblende перестаёт быть главой. Фильм = **7 глав**.

**Порядок сборки (жёсткий):**
§2 Фаза A (баги, ничего не меняет по смыслу) → §3 слияние 07→06 и общий примитив карточки → §4 главы по одной: Schwelle → Küche → Schlaf → Wohnen → Eingang → Bad → §5 конец фильма → §6 пререндер/HANDOFF → §7 приёмка → §8 бандл.

---

## 1. Факты кода (проверено 17.09, не менять без нужды)

- Движок: `site/js/film-v16.js`. Главы: `FILM_V16.v16.rooms` (data.js ~838) `['ankunft','schwelle','kueche','bad','schlaf','wohnen','wohnen-rohbau','eingang']`, переходы `legs` `['ankunft-schwelle','schwelle-kueche','kueche-bad','bad-schlaf','schlaf-wohnen',null,'wohnen-eingang']`, `fadeInLegs:[6]`. `N=S.length` (film-v16.js:15). Клип **`wohnen-eingang` уже существует** — слияние глав не требует нового видео.
- Rückblende сейчас: `showHoldWipe()` (film-v16.js ~380–415, константы `WIPE_MS/SPLIT_LEG/SPLIT_HOLD`), элемент `.v16-wipe` (создаётся ~166), `RUECK_K/RUECK_AFTER_K` и привязка `#wCmp` (~328–360). Всё это в §3 удаляется.
- Выход из фильма: `exitHouse()` (~673) → `releaseHouse()` + `scrollTo(sheet.top)`, `sheet = .w-sheet--final || .w-sheet` (~662). Секции после фильма в `index.html`: `.w-sheet` «Hinter Glas» (v8.2, `app.js glassify()` ~161, инвертированные токены `.wohnung:not(.is-plain) .w-sheet` в `site.css` ~1444).
- Пины: `buildHots()` (film-v16.js ~220–304). **Баг закрытия:** второй клик по открытому пину вызывает `goRoute(hp.go)` вместо закрытия (~300), клика «мимо» нет.
- Stage 5: `site/js/stage5-v16.js` (события `v16:hold` → `build(k,scene)`, `v16:leave`/`v16:exit` → `teardown()`, `v16:mounted` → `boot()`; механики `mechSix2One`, `mechTakt`, `mechDusk`, `mechAblauf`, `mechWipe`, `mechClock`; `todoLine()` ~97 с таймингами 120/820/1320 мс; `akteSheet()` ~60 с кнопкой `data-s5="calc"` → `Film16.release()` + скролл к `#richtwert`; `deadline48()`), стили `site/css/stage5-v16.css` (токены `--s5-brass:#D6B685`, `--s5-blue:#6FA3F2`, `--s5-ink:rgba(14,18,22,.74)`, `--s5-scale` по брейкпоинтам 1/1.25/1.34/1.45/1.6), данные `FILM_V15.s5{flur,kueche,bad,schlaf,wohnen,rohbau,eingang}` (data.js ~684–747).
- Миникарта `.w-plan` (site.css:1015) `top:calc(78px + 22px)`, точки глав `.v16-chap-p` (film-v16.css:104) `position:fixed; right:clamp(20px,4vw,64px); top:clamp(84px,11vh,120px)` — **накладываются друг на друга** на десктопе (регрессия, §2.3).
- Слой стадии: `#wStage` (fixed) → `.w-cam` (z auto) · `.w-shade` (z 2) · `#wHot` (6) · `#wPopM` (6) · `#wS5` (5) · `#wOv` (5) · `#wSig` (5) · `#wPlan` (5) · `.v16-chap` (5). Всё, что должно лежать **под** текстом главы, вставляется в `.w-cam`-сосед с `z-index:1` (так делает `mock-etappe8.js` для Rückblende и Bad).
- Стиллы: `site/img/film/v16/stills/<room>-{L,P}.jpg`, `bad-dusk-{L,P}.jpg`, `wohnen-rohbau-{L,P}.jpg`.
- Подпись: `#wSig .w-sig svg.sig` (index.html:130, `fx.js _sigRun()/_sigReset()`).
- Телефон в CSS = `@media (max-width:760px)`, в JS `isPhone()`. Reduced motion — `RED()`.

---

## 2. Фаза A — баги (без смены идей)

### 2.1 Общий `Slider` (нужен для Bad-десктоп; Rückblende-слайдер больше не существует)
Новая функция в `stage5-v16.js`: `makeSlider(host, handle, {x0, onChange})`. Требования:
- Только Pointer Events: `pointerdown` на ручке → `handle.setPointerCapture(e.pointerId)`, `pointermove`/`pointerup`/`pointercancel` на ручке; `e.preventDefault()` в `pointerdown`.
- Ручка и трек: `touch-action:none`. На время драга `.wohnung` получает класс `is-s5-drag` → `user-select:none; -webkit-user-select:none; cursor:ew-resize` на `html` (это и есть «вся страница синяя» — выделение текста при драге).
- `pointerdown` на ручке — `e.stopPropagation()` **в capture-фазе на `window`** для этого элемента (тот же приём, что для Akte в Этапе 5, HANDOFF §15): capture-слушатели `film-v16.js` не должны видеть жест.
- Клик по треку вне ручки = прыжок (как сейчас в `#wCmp`).
- Сначала воспроизвести баг Playwright-ом на 1470×956 (`page.mouse.move/down/move/up` по ручке `.s5-dusk-h`): ожидание — `--x` меняется. Только потом чинить. Причину записать в HANDOFF (гипотеза: `mousedown`-только + capture-перехват; проверить `pointer-events` слоёв `#wS5` vs `.w-shade`).

### 2.2 Пины Wohnen закрываются
В `buildHots()`: второй клик по открытому пину → **закрыть**, не `goRoute`. Переход по ссылке — только клик по `<u>Mehr dazu →</u>` внутри `.w-hs-pop` (свой слушатель, `stopPropagation`). Клик/тап «мимо» (`pointerdown` на `document` в capture) и `Escape` закрывают все `.w-hs.open`. Открыт максимум один. (В §4.4 пины Wohnen заменяются лентой, но правка нужна для `ankunft` и как страховка.)

### 2.3 Миникарта на место
`stage5-v16.css`, десктоп: `.wohnung.is-v16 .w-plan{top:calc(clamp(84px,11vh,120px) + 3px + 14px); right:clamp(20px,4vw,64px)}` — карта **под** рядом точек (точки 3 px высотой), правый край общий с точками, зазор 14 px. Проверить на 1440×900, 1470×956, 1920×1080: `rect(.v16-chap-p).bottom + 10 < rect(.w-plan).top`, `right`-края совпадают ±2 px. На телефоне карта скрыта (Этап 5 §2.3) — не трогать.

### 2.4 Вычёркивание позже
`todoLine()`: `is-in` через **1500 мс** после `v16:hold`, `is-struck` через **2500 мс**, длительность самого штриха в CSS (`.w-todo s i` width-transition) **800 мс**, `is-done` через 3400 мс. Eingang-вариант (после Versprechen) сдвигается так же (+1400 к текущим). При явном жесте пользователя в главе (тап по карточке/пину/ручке) — вычёркивание немедленно. `RED()` — как сейчас.

### 2.5 Кнопка калькулятора наружу
Сейчас «Richtpreis berechnen» живёт только в Akte-sheet. Вынести в главу Eingang (§4.5): десктоп — вторая кнопка под карточкой Protokoll; телефон — строка-ссылка внизу карточки. Поведение = существующий обработчик `data-s5="calc"` (закрыть sheet если открыт → `Film16.release()` → скролл к `#richtwert`). В Akte-sheet кнопка остаётся.

### 2.6 Конец фильма — см. §5 (это тоже баг, но он сцеплен с новым блоком).

---

## 3. Слияние 07→06 и примитив «карточка в слоте»

### 3.1 Семь глав
- `data.js` **только в `FILM_V16`** (FILM_V15 не трогать — rollback `?film=15`): `rooms` без `'wohnen-rohbau'`; `legs:['ankunft-schwelle','schwelle-kueche','kueche-bad','bad-schlaf','schlaf-wohnen','wohnen-eingang']`; `fadeInLegs` — проверить первый кадр клипа `wohnen-eingang`: если он начинается с чистового Wohnen, `fadeInLegs:[]`, иначе `[5]`. Сцену `id:'rohbau'` удалить из `FILM_V16.scenes`; `s5.rohbau` удалить.
- `film-v16.js`: удалить `showHoldWipe()`, `.v16-wipe`, `RUECK_K/RUECK_AFTER_K`, привязку `#wCmp` (элемент оставить в `pages.js`, для v16 — `hidden` всегда). Ветка в `gesture()/command()`, где выбирался wipe вместо клипа, — убрать. `N` станет 7 автоматически; `.v16-chap-s` «Kapitel k von 7», точек `.v16-chap-p i` — 7, `#wRoomNav` — 7 пунктов, `#wPlan` без комнаты Rohbau. Комментарий в шапке файла (строка 8) обновить.
- `stage5-v16.js`: удалить `mechWipe`. `core/dev/pw-stage5.js` — ожидания 8→7 глав (или заменить на `pw-stage8.js`, §7).

### 3.2 Примитив `s5Card`
Одна функция `s5Card({slot:'right'|'top', kicker, title, text, body, hint})` → `.s5-slot.s5-slot--right|--top > .s5-card`. CSS (значения из `mock-etappe8.js` BASE_CSS, они утверждены):
- Десктоп: `--right` = `position:absolute; right:6%; top:37%; width:400px` (× `--s5-scale` через `transform-origin: 100% 0`); `--top` (только Küche) = `left:31%; top:13%; width:360px`.
- Телефон: любой слот = `left:16px; right:16px; top:186px` (зона между шапкой главы и заголовком; заголовок начинается ~y 600 на 844 — карточка не выше 380 px, иначе `max-height` + внутренний скролл).
- Карточка: `background:rgba(14,18,22,.80); backdrop-filter:blur(12px); border-radius:12px; box-shadow: inset 0 0 0 1.5px var(--s5-brass), 0 18px 50px rgba(0,0,0,.5); padding:18px 20px` (телефон 16px). Кикер `.s5-k` — Archivo 11px, letter-spacing .18em, uppercase, brass. Заголовок `.s5-t` — Archivo 600, 22px (телефон 19px). Текст `.s5-s` — 14.5px/1.5, `rgba(255,255,255,.78)`. Подсказка `.s5-hint` — Archivo 11.5px uppercase, `rgba(255,255,255,.55)`, **на телефоне всегда внутри карточки последней строкой** (снаружи она садится на имя главы — проверено).
- Кнопки: `.s5-btn` пилюля brass/тёмный текст; `.s5-btn-line` прозрачная с кольцом `rgba(255,255,255,.55)`.
- Появление: `opacity 0→1, translateY 8px→0, 360 мс` через 300 мс после `v16:hold`. Уход — в `teardown()` мгновенно.
- **Инвариант приёмки:** bounding box любой `.s5-card`/`.s5-slot` не пересекается с `#wOv .w-h`, `.w-todo`, `.v16-chap`, `.v16-chap-p`, `#wPlan`, `#stickycall` ни на одном формате (§7).

---

## 4. Главы

### 4.1 Schwelle (`flur`) — «Sechs Anrufe → ein Rückruf», без жеста
Заменяет `mechSix2One`. **Решение владельца:** уведомления прилетают сами, сами собираются, никакого hold/release; единственный интерактив — кнопка звонка на финальной карточке.

Данные `s5.flur.push`:
```js
notes:[
 {av:'M',t:'Maler',       m:'verpasster Anruf',time:'09:12',s:'Kommen wir Di oder Mi? Gipser noch nicht fertig.'},
 {av:'S',t:'Sanitär',     m:'SMS',             time:'09:40',s:'Armatur nicht lieferbar, Alternative?'},
 {av:'E',t:'Elektro',     m:'verpasster Anruf',time:'10:05',s:'Rechnung 2/6 offen — Rückruf bitte.'},
 {av:'R',t:'Rückbau',     m:'WhatsApp',        time:'10:31',s:'Wiegeschein fehlt für die Mulde.'},
 {av:'P',t:'Plattenleger',m:'verpasster Anruf',time:'11:18',s:'Wer macht die Abdichtung?'},
 {av:'H',t:'Schreiner',   m:'E-Mail',          time:'11:52',s:'Lieferung 3 Wochen verschoben.'}],
final:{k:'Ein Ansprechpartner',t:'BauStern · Bauleitung',time:'gerade eben',
       s:'Alles koordiniert. Nächster Schritt: Aufmass am Freitag, 9:00 — Sie müssen niemanden anrufen.',
       btn:'Rückruf in 5 Min'}
```
DOM: слот `--right` (десктоп `top:27%`, стопка высотой ~530 px), внутри `.s5-note` ×6 (grid `34px 1fr auto`: аватар-кружок с буквой, `<b>` имя, `<em>` «m · time» цветом `#F28B82`, `<i>` текст; справа красная точка 8 px) и `.s5-one` (карточка примитива: кикер `final.k`, строка с синим квадратом-аватаром «B» + `final.t` + `final.time`, текст `final.s`, кнопка `.s5-btn` «📞 Rückruf in 5 Min» = `<a href="tel:${CO.phoneRaw}">`). На телефоне `<i>` скрыт, шаг стопки 62 px, стопка ≤ 360 px.

Хореография (мс от `v16:hold`, всё CSS-transitions/keyframes, без GSAP):
- 300 + i·400 (i=0..5): нота i въезжает справа (`translateX(40px)→0`, `opacity 0→1`, 320 мс ease-out) и «дзынькает» (`rotate(-1.5deg)→0`, 500 мс, cubic-bezier(.2,.8,.2,1)). Лёгкий разнобой: `rotate` покоя `[-2.5,2,-1.5,2.5,-2,1.5]deg`, `translateX` `[0,10,-8,6,-10,8]px`.
- 2300–3400: пауза (человек читает).
- 3400: **сбор.** Ноты по очереди (шаг 60 мс, снизу вверх) летят в точку финальной карточки: `translate(→центр слота) scale(.92) rotate(0)`, `opacity→0`, 520 мс ease-in. Одновременно `.s5-one` появляется `scale(.9)→1`, `opacity 0→1`, 520 мс, и в 4200 мс — кольцо-импульс `box-shadow: 0 0 0 0 rgba(214,182,133,.45) → 0 0 0 14px rgba(214,182,133,0)`, 700 мс, один раз.
- 4200: кнопка звонка активна. Итого ≈ 4.4 с.
- Повторный вход в главу в той же сессии (`demoDone` как у других механик): без хореографии — сразу финальная карточка, fade 300 мс. `RED()`: сразу финальная карточка.
- Hover/тап по нотам — ничего. `hub`-точка Этапа 5 удаляется.

### 4.2 Küche — пины-иконки, световое пятно, одна карточка
Переписать `mechTakt`. Полигоны `zones[].P/L` **не рисуются** (из данных убрать), остаются координаты пинов `pP/pL`.
- Данные `s5.kueche.takt.zones[i]` дополнить: `icon:'saw'|'tap'|'bolt'`, `card:{t,s}`:
  1. Schreiner — `t:'Insel und Fronten.'`, `s:'Räuchereiche, Naturstein — montiert, bevor die Anschlüsse kommen.'`
  2. Sanitär — `t:'Anschlüsse und Armatur.'`, `s:'Kommt, wenn die Insel steht — abgestimmt mit dem Schreiner. Ein Termin, nicht drei.'`
  3. Elektro — `t:'Pendel, Schienen, Steuerung.'`, `s:'Zuletzt, koordiniert — kein Loch in der fertigen Decke.'`
- Пины `.s5-pin` 30 px (× scale): тёмный круг + brass-кольцо, внутри inline-SVG 18 px (пила / кран / молния — три простых path, свои, без библиотек). Состояния: `done` — иконка заменена на ✓, кольцо `rgba(255,255,255,.35)`; `on` — заливка brass, тёмная иконка, гало `0 0 0 6px rgba(214,182,133,.25)`; `next` — гало пульсирует 0→8 px, 1.6 с, бесконечно (не при `RED()`). Пины — `<button>` с `aria-label="<Gewerk> — Takt n"`; тап = перейти к этому такту.
- Световое пятно `.s5-spot`: круг 520 px (телефон 70vw), `radial-gradient(circle, rgba(255,231,184,.34), rgba(255,231,184,.12) 38%, transparent 66%)`, `mix-blend-mode:screen`, вставлен в `.w-cam`-сосед с `z-index:1` (под текстом главы), центр = активный пин, `left/top` transition 600 мс, `opacity` 500 мс.
- Карточка слот `--top` (десктоп) / телефонный слот: кикер `TAKT n VON 3 · <Gewerk>`, `card.t`, `card.s`, полоска из трёх сегментов (`.s5-takt i`, активные brass) — **сегменты кликабельны**; десктоп: кнопки `‹ ›` в правом верхнем углу карточки (36 px, `aria-label="Vorheriger/Nächster Takt"`), клавиши ← →; телефон: тап по карточке = следующий такт. Подсказка: десктоп `Klicken — nächster Takt`, телефон `Tippen — nächster Takt`.
- Авто-демо при первом входе: 1→2→3 с шагом 1400 мс, затем строка `end` («Drei Gewerke, ein Termin.») как сейчас; любое действие пользователя останавливает демо.

### 4.3 Schlaf — «Bauzeitplan»-степпер
Переписать `mechAblauf`: линию, точки на линии и подписи над/под линией удалить. Карточка слот `--right` (десктоп `width:400`) / телефон.
- Кикер `BAUZEITPLAN · 5 SCHRITTE`. Список `<ol class="s5-steps">` из `ablauf.steps` (t, f, c): строка = `01–05` (Archivo, brass для активного) · `<b>t</b>` · справа `<small>f</small>`; активная строка раскрыта аккордеоном: `c` полным текстом (13.5px/1.45) и **никаких недель/дней** (правило владельца: сроков по этапам нет; `f` — единственная «дата»). Вертикальная линия слева 1.5 px, точки: done — белая заливка, on — brass с гало, будущие — контур.
- Вся строка — цель тапа (`<button>` на всю ширину). Переключение: `height` через `grid-template-rows: 0fr→1fr`, 300 мс.
- Авто-демо: при первом входе активный шаг идёт 1→5 с шагом 3000 мс, останавливается на первом касании; повторный вход — сразу шаг 4 (Ausführung), без демо.
- Десктоп: клавиши ↑↓, колесо мыши **внутри карточки** переключает шаги — обязательно `wheel` с `{capture:true}` на карточке + `stopPropagation()` + `preventDefault()`, иначе фильм примет колесо за смену главы. Телефон: вертикальный свайп по карточке (порог 24 px) — `touchstart/touchmove` на карточке с `stopPropagation()` в capture по той же причине.

### 4.4 Wohnen — «Wochen-Update»-лента + Rückblende по hold
Пины Wohnen больше не строятся (`scene.mech='feed'`; `buildHots()` уже пропускает сцены с `mech`). `counters` у сцены `wohnen` в `FILM_V16` удалить (6/1/24 убраны владельцем).

**Лента** — карточка примитива, слот `--right` / телефон, стилизована как сообщение мессенджера:
```js
s5.wohnen.feed:{ kicker:'Wochen-Update · Baustelle', sender:'BauStern · Bauleitung',
 weeks:[
  {w:'Woche 1', t:'Rückbau abgeschlossen, Leitungen neu.', s:'Nächste Woche: Boden.',      imgs:['…','…']},
  {w:'Woche 2', t:'Boden verlegt, Decke geschlossen.',      s:'Nächste Woche: Einbauten.',  imgs:['…','…']},
  {w:'Woche 3', t:'Einbauten montiert.',                    s:'Abnahme Freitag, 14:00.',    imgs:['…','…','…']}]}
```
- Структура: шапка (синий квадрат «B», `sender`, справа `w` в brass), `t` жирно, `s` обычным, ряд миниатюр 64×48 (`object-fit:cover`, radius 6), внизу три точки-индикатора + подсказка `Tippen — nächste Woche` (десктоп: `Klicken — nächste Woche`, плюс `‹ ›`).
- Миниатюры: **только существующие фото из `site/img/`** (кейс Atlant и Referenzen). Сделать уменьшенные копии 160×120 через sharp/ffmpeg в `site/img/film/v16/feed/w{1..3}-{1..3}.jpg` (≤ 12 КБ каждая). Ничего из `core/_incoming/`.
- Тап/клик = следующая неделя (по кругу), смена содержимого — crossfade 240 мс. Авто-демо при первом входе: 1→2→3, шаг 2200 мс, останавливается на касании.

**Rückblende внутри Wohnen** (замена главы 07):
- При `v16:hold` Wohnen предзагрузить `wohnen-rohbau-{L|P}.jpg` и вставить `.s5-roh` (img `object-fit:cover`, `opacity:0`) + виньетка `.s5-roh-vin` (`radial-gradient(120% 90% at 50% 50%, transparent 40%, rgba(0,0,0,.35))`) как соседа `.w-cam` с `z-index:1` — **под** `.w-shade` и текстом главы (см. §1).
- Жест: **hold ≥ 250 мс в любой точке кадра**, кроме карточек/кнопок/навигации (`pointerdown` на `#wStage`, таймер 250 мс; отмена при `pointermove` > 12 px — это свайп, отдать фильму). На hold: `.s5-roh` `opacity 0→.66` 700 мс, метка `.s5-roh-lab` «Vor 4 Monaten · Halten» (пилюля, Archivo 11px uppercase, `rgba(14,18,22,.75)`) вверху по центру (десктоп `top:14%`, телефон `top:186px`), лента в это время `opacity:.25`. На `pointerup/pointercancel`: обратно 500 мс.
- Не мешать фильму: клик, который завершает hold, — `preventDefault()`+`stopPropagation()` в capture на `window` (иначе `onClickAny` → `releaseHouse()`). На стадии в Wohnen: `-webkit-touch-callout:none; user-select:none`, `contextmenu` → `preventDefault()` (длинное нажатие на телефоне не должно открывать меню картинки).
- Подсказка жеста — последней строкой **внутри карточки ленты** (десктоп и телефон): `Halten — wie war es vorher?`; после первого успешного hold в сессии строка исчезает. Клавиатура: удерживать Space.
- Вопрос главы остаётся `Wie bleibt es?`; to-do-строка Wohnen как сейчас.

### 4.5 Eingang — «Übergabeprotokoll» + калькулятор
Переписать `mechClock`: три объекта (карточка срока, список Versprechen, подпись `#wSig`) объединяются в **один** — карточку примитива, слот `--right` (десктоп; `width:400`) / телефон (`top:140px`).
- Шапка карточки (border-bottom `rgba(255,255,255,.12)`): brass-кружок 34 px с иконкой ключа (inline-SVG: круг + стержень с двумя зубцами), кикер `ÜBERGABEPROTOKOLL`, под ним `Anfrage jetzt` (12.5px, `.6`).
- Тело: кикер-серый `OFFERTE BIS`, крупно brass (Archivo 600, 24px/телефон 20px) — `deadline48()` как сейчас (`Samstag, 18:00`); список 4 Versprechen с brass-✓ (`s5.eingang.clock.versprechen`); внизу строка с пунктиром сверху: слева подпись — **перенести существующий `#wSig svg.sig` внутрь карточки** (96×64, штрих белый 3 px, анимация `_sigRun()` через 120·4+500 мс как сейчас), справа `ARTEM KOZLOVSKYI / INHABER` (Archivo 11px uppercase, `.6`, выравнивание вправо). Отдельный `#wSig` на кадре больше не показывается.
- «Ключ поворачивается»: при появлении карточки иконка ключа `rotate(-90deg)→0` 400 мс cubic-bezier(.2,.8,.2,1), после чего кольцо-импульс brass 600 мс (как в 4.1). `RED()` — без анимации.
- Кнопки: десктоп — под карточкой ряд `.s5-btn` «Offerte anfragen →» (= действие `offer` из Akte-sheet: `PREFILL` + `go('kontakt')`) и `.s5-btn-line` «Richtpreis berechnen» (= действие `calc`, §2.5). Телефон — кнопки Offerte/WhatsApp остаются в `#stickycall`; в карточке последней строкой brass-кикер-ссылка `Richtpreis berechnen →`.
- Akte-бейдж и Akte-sheet — без изменений.

### 4.6 Bad — слайдер починить, на телефоне выключатель
- Десктоп: `mechDusk` остаётся визуально как есть, драг переводится на `makeSlider` (§2.1). Ручка 64 px, белая, тень, иконка ⇔, под ней подпись `ziehen` (Archivo 11px uppercase). Метки `Tageslicht` / `Abend` — пилюли `rgba(14,18,22,.7)` на 56 % высоты по краям. Старт `--x` из `dusk.start` (38).
- Телефон: слайдера нет. **Выключатель** `.s5-switch` на стене слева: `P:{x:12,y:46}`, 64×92 px, пластина `linear-gradient(#EDE9E2,#D9D4CB)`, клавиша со швом, индикатор-точка brass когда «включено». Тап (`<button aria-pressed>`) переключает день/вечер: вечерний стилл `bad-dusk-P.jpg` лежит соседом `.w-cam` с `z-index:1` (под текстом главы!) и получает `opacity 0↔1` 700 мс; кандл-глоу-точки (`dusk.glow.P`) появляются только в вечернем состоянии. Подпись под выключателем: `Licht aus` (день) / `Licht an` (вечер) — пилюля; метка `Abend` справа на уровне слота. Авто-демо при первом входе: через 1200 мс само переключает в вечер, через 3800 мс обратно в день; повторный вход — день.
- Кольцо-подсказка тапа (44 px, белое кольцо + ореол) один раз при первом входе, 1.5 с.

---

## 5. Конец фильма — «Werkvertrag-Auszug»
Проблема (скрин владельца, 1470×956): после последней главы контент страницы (чипы, 6/24h/3h, «Richtwerte») скроллится **поверх** запиненной сцены, карточки без фона — это v8.2 «Hinter Glas» (`.w-sheet` + инвертированные токены `.wohnung:not(.is-plain) .w-sheet`) в сочетании с v16. **Решение владельца: «Hinter Glas» для v16 отменяется** — фильм отпускает в непрозрачную светлую секцию.

- Новая секция `#ende` в `index.html` сразу после `#wohnung`-блока и **перед** первым `.w-sheet`: фон `var(--bg-putz)`, `padding: 30px clamp(20px,6vw,90px)`, минимум 52 % высоты вьюпорта на десктопе. Содержимое: кикер `RUNDGANG BEENDET · 7 KAPITEL` (цвет `--fenstergruen`), h2 `Vier Versprechen. Schriftlich.` (Archivo 600, clamp(22px,2.4vw,34px)), затем **один лист** `.ende-sheet`: белая карточка (radius 8, `0 0 0 1px rgba(28,31,34,.12)`, padding clamp(22px,3vw,34px)) с заголовком-кикером `WERKVERTRAG · AUSZUG`, четырьмя пунктами в две колонки (телефон — одна) — каждый: ромб `--fenstergruen` 10 px, `<b>` название, `<p>` пояснение:
  1. `Offerte innert 48 h` — `Festpreis, Position für Position.`
  2. `Ein Ansprechpartner` — `Bis zum Schlüssel, eine Nummer.`
  3. `Nach Norm — SIA` — `Mit Protokoll und Nachweisen.`
  4. `Termin im Werkvertrag` — `24 Monate Werkgarantie.`
  внизу листа строка с пунктиром: слева копия подписи (тот же SVG-путь, штрих `--text-main` 2.5 px, статично или `_sigRun()` при появлении в вьюпорте), справа «печать» — круглый штамп 64 px, контур `--fenstergruen` 1.5 px, текст по кругу `SCHRIFTLICH IM WERKVERTRAG` (SVG `textPath`), лёгкий наклон −8°. Под листом строка-подводка `↓ Was kostet das? Richtwerte in 30 Sekunden.` (ссылка `data-scroll="richtwert"`).
- `exitHouse()`: `sheet` = `#ende` (скролл к нему), `W.classList.add('is-plain')` при выходе для v16 (или scoped-отключение инвертированных токенов для `.is-v16`), чтобы ни один `.w-sheet` ниже не рендерился «за стеклом». `enterHouse()` снимает `is-plain`.
- `.w-sec.below-first`/`m-keep`-логика и `glassify()` — не вызывать для v16 (`glassify` пропускает, если `#wohnung.is-v16`).
- Приёмка: после выхода `getComputedStyle(#ende).backgroundColor` непрозрачный; в вьюпорте ниже `rect(#ende).top` нет видимых элементов `#wStage`; на 1470×956 и 390×844 скриншот.

---

## 6. Пререндер, документация
- `node core/dev/prerender-run.js` после всех правок (index.html/pages.js/css менялись) — 31 маршрут, `_redirects`, `sitemap.xml`.
- `HANDOFF.md §17 «v16 этап 8»`: таблица механик (7 глав), что удалено (wipe, `#wCmp` для v16, `mechSix2One/Wipe`, полигоны, `counters` Wohnen, Hinter-Glas для v16), тайминги (2.4, 4.1), причина бага слайдера (2.1), инвариант карточек (3.2), приёмка. `PLAN-v16.md` — строка «Этап 8 ✅ … → HANDOFF §17».

---

## 7. Приёмка — `core/dev/pw-stage8.js`
Форматы: **390×844 (touch)**, **1470×956** (Air владельца, `deviceScaleFactor 2`), 1440×900, **844×390 (landscape touch)**. Локальный сервер `python3 -m http.server 8123` в `site/`.
Для каждой главы 0..6 (`Film16.go(k)`, ждать `Film16.ch===k` + 3000 мс):
1. `pageerror`/`console.error` = fail (кроме favicon/analytics).
2. Инвариант 3.2: пересечения `.s5-slot|.s5-card` × `{#wOv .w-h, .w-todo, .v16-chap, .v16-chap-p, #wPlan, #stickycall}` = fail.
3. `.v16-chap-s` содержит `von 7`; `.v16-chap-p i` = 7; `#wRoomNav` 7 кнопок.
4. §2.3: `rect(.v16-chap-p).bottom + 10 <= rect(#wPlan).top` (десктоп).
5. §2.4: класс `is-struck` на `.w-todo` **отсутствует** на 2000 мс и **присутствует** на 3200 мс после `v16:hold`.
6. Schwelle: на 5000 мс `.s5-one` видима (`opacity>.9`), `.s5-note` все `opacity<.05`; `a[href^="tel:"]` внутри.
7. Küche: три `.s5-pin` (`button`), клик по третьему → карточка содержит `TAKT 3 VON 3`; `.s5-spot` центр в ±6 % от пина.
8. Schlaf: клик по строке 02 → она `is-on`; `wheel` над карточкой не меняет `Film16.ch`.
9. Wohnen: `.s5-feed` видима; клик → `Woche 2`; `pointerdown` 600 мс в центре кадра → `.s5-roh` `opacity>.5`, `pointerup` → `<.05`; `Film16.ch` не изменился; пинов `.w-hs` нет.
10. Eingang: `.s5-card` содержит `ÜBERGABEPROTOKOLL`, `svg.sig` внутри карточки; десктоп — две кнопки, клик «Richtpreis berechnen» → `scrollY` у `#richtwert` ±40 px; телефон — ссылка в карточке.
11. Bad: десктоп — `mouse.down` на `.s5-dusk-h`, `move +200px`, `up` → `--x` вырос ≥ .1, `getSelection().toString()===''`; телефон — тап по `.s5-switch` → `aria-pressed="true"`, вечерний слой `opacity>.9`.
12. Конец: после `Film16.next()` из главы 6 — §5 приёмка.
13. Скриншоты каждой главы и конца в `core/dev/shots/etappe8/<vp>_<k>.png` (не в `site/`), контакт-лист `montage` как в `mock-etappe8.js`.
Итог печатать как «ALLES GRÜN» или список падений; в HANDOFF — только фактический результат прогона.

---

## 8. Сдача
- Коммиты по разделам: `feat(v16): Etappe 8 — §2 Bugs`, `… §3 sieben Kapitel`, `… §4.1 Schwelle` и т. д., хвост коммита по правилам репо.
- Пуш из облачной песочницы невозможен (git-proxy) — как в Этапе 7: `git bundle create v16-chapters-etappe8.bundle v16-chapters ^origin/v16-chapters` → файл владельцу в чат; он на Mac: `git fetch <bundle> v16-chapters:refs/remotes/bundle/v16-chapters && git merge --ff-only refs/remotes/bundle/v16-chapters && git push origin v16-chapters`, затем **draft**: `netlify deploy --dir=site` (без `--prod`). Прод — только после «в прод».

## 9. Чего не делать
- Не трогать `FILM_V13/FILM_V15`, `?film=15` должен работать как раньше.
- Не добавлять сроки по этапам/неделям (правило владельца), не показывать цены в фильме, не добавлять фото Артема.
- Не вводить новых библиотек; GSAP только там, где уже был (≥1000px).
- Не оставлять старые механики «на всякий случай» — удалять вместе с CSS и данными.
- Не писать в HANDOFF «проверено», если прогон §7 не был зелёным на всех четырёх форматах.
