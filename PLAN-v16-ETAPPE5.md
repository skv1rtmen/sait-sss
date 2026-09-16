# BauStern v16 — ТЗ Этап 5 «Один вопрос — один жест» (v2.1, 16.09.2026 — все вопросы закрыты)

Заменяет §3.3 в `PLAN-v16.md`. Утверждено владельцем 16.09 после трёх раундов референсов (см. `core/dev/refs/` — 8 кадров, если положены в репо).
Вставь этот файл первым сообщением в чат для кода. Роль: фронт-разработчик (vanilla JS + GSAP, без сборки), аккуратность важнее креатива — дизайн уже решён.

---

## 0. Модели, правила, порядок

| Работа | Модель | Усилие |
|---|---|---|
| Весь код этого файла (§2–§8) | **Opus 5** | высокое |
| Мелкие правки текста/CSS после ревью | Sonnet 5 | низкое |
| Вечерний рендер Bad (§6) | **Claude через Chrome владельца (Flow / Nano Banana Pro)** — владелец дал доступ, генерацию делаю сам, кадр утверждает владелец | — |
| Ревью референсов и вкус | Fable 5.1 | только по запросу |

Правила владельца без изменений (`PLAN-v16.md` §1): деплой по умолчанию draft, прод только по явному «в прод»; `core/_incoming/` никогда не в `site/`; не утверждать, что проверено, если не проверено. Ветка `v16-chapters`. Один коммит на комнату, Playwright-прогон после каждого (§9).

**Порядок сборки (жёсткий):** §2 чистка → §3 to-do-строка → §4.1 Schwelle → §4.2 Küche → §4.4 Schlaf → §4.6 Eingang + Akte → §4.5 Rückblende (драг) → §4.3 Bad (когда есть рендер) → §7 Ankunft-чистка → §9 финал.

---

## 1. Где что лежит (факты кода, не менять без нужды)

- Движок B: `site/js/film-v16.js` (`mount()`, `enterHold(k)`, `fillScene()`, `buildHots()`, `chapShow()`, `gesture()/command()`, `onTouchMove` — дискретный свайп, порог `V.swipeMin=46`). Отладка: `window.Film16` (`ch`, `phase`, `go(k)`, `next()`, `prev()`, `orient`, `house`).
- Стили: `site/css/film-v16.css` (телефон = `@media (max-width:760px)`, в JS `isPhone()`), базовые классы в `site/css/site.css`.
- Данные: `FILM_V16 = Object.assign({}, FILM_V15, {...})` в `site/js/data.js`; сцены — массив `FILM_V15.scenes` (id: `ankunft, flur, kueche, bad, schlaf, wohnen, rohbau, eingang`). `STEPS` (5 шагов Ablauf), `RICHTWERTE` + калькулятор `#richtwert` (`pages.js estimateSec`, `app.js` → `window.PREFILL`).
- DOM: `#wohnung.is-v16 > #wStage` → `.w-cam` (`.v16-hold` img ×2, `.v16-gl` canvas, `.v16-wipe`), `#wHot` (пины `.w-hs`), `#wOv` (`.w-kicker-t`, `.w-h`, `.w-d`, `.w-chips`, `.w-counters`, `.w-ctas`, `.w-trust`, `#wStart`), `#wPlan`, `#wRoomNav`, `.v16-chap` (`-n`, `-t`, `-s`, `-p` точки), `#wCmp.w-cmp` (шторка до/после; на телефоне для v16 `display:none`), `.w-sig svg` (подпись, `fx.js`: `_sigRun()/_sigReset()`), `#stickycall` (`.cb` Rückruf, `.call` Anrufen, `.off` Offerte).
- Стиллы: `site/img/film/v16/stills/<room>-L.jpg` 1920×1080 и `-P.jpg` 1080×1920, ~270–400 КБ. Карты глубины `site/img/film/v16/depth/<room>-<L|P>.webp` (`site/js/depth-v16.js`).

---

## 2. Чистка кадра (телефон и десктоп)

Цель: на кадре остаются **номер · имя · точки · вопрос · заголовок · to-do-строка · жест · две кнопки · бейдж Akte**. Всё остальное уходит.

2.1 Новый модуль `site/js/stage5-v16.js` + `site/css/stage5-v16.css`, подключить после `film-v16.js` в `index.html` и `pages.js` (там же, где рендерится `#wohnung`). Никакой логики стадии 5 внутри `film-v16.js` — только два хука (2.2).

2.2 Хуки в `film-v16.js` (минимально): в конце `enterHold(k)` после показа холда — `W.dispatchEvent(new CustomEvent('v16:hold',{detail:{k,scene:S[k]}}))`; в начале `gesture()` (когда команда принята и начинается полёт) — `W.dispatchEvent(new CustomEvent('v16:leave',{detail:{k:ch}}))`. Также экспорт `Film16.stage=W` не нужен — модуль сам берёт `#wohnung`.

2.3 Скрыть на телефоне через CSS (`.wohnung.is-v16` + media 760): `#wPlan`, `.v16-chap-s` («Kapitel N von 8»), `.w-d` (описание остаётся в DOM для SEO), `#wStart` везде кроме `k=0`, `#wScrollHint`. `#stickycall .call` — скрыть (две кнопки: «Rückruf in 5 Min» + «Offerte in 48 h»). Утверждено владельцем.

2.4 Пины: `buildHots()` не строит `.w-hs`, если `scene.mech` задан (§4) — на всех устройствах. Пины остаются только у `ankunft` (1 шт.) и `wohnen`.

2.5 Кикер = вопрос комнаты: `fillScene()` берёт `scene.q`, если есть, иначе `scene.kicker`. Значения в data.js:

| id | q |
|---|---|
| flur | Wer ist zuständig? |
| kueche | Wer macht was? |
| bad | Abnahme bei Tageslicht |
| schlaf | Wie läuft es ab? |
| wohnen | Wie bleibt es? |
| rohbau | Wie war es vorher? |
| eingang | Wann geht es los? |

Ankunft без изменений (`Zürich · Deutschschweiz …`).

2.6 Десктоп: план `#wPlan` остаётся, `.w-d` остаётся, пины по 2.4. **Механики те же, но крупнее** (утверждено): все размеры из §4 умножаются на `--s5-scale` = `clamp(1.25, 100vw / 1100, 1.6)` (карточки, бумажки, ручки шторок, толщина линий ×1.5, шрифты +2 px); координаты фигур — из `L`-наборов; «hold» = `mousedown`, «tap» = `click`, драг = `pointermove` с зажатой кнопкой; hover над зоной/узлом подсвечивает его.

---

## 3. To-do-строка (все комнаты кроме Ankunft)

3.1 Разметка: `<p class="w-todo"><s>…</s><em>…</em></p>` вставляется в `#wOv` **сразу после `.w-h`** (в потоке, не absolute — так в Eingang она не ляжет на подпись и CTA). Стиль: 13px/1.35 Instrument Sans, `rgba(255,255,255,.62)`; `s` без стандартного `line-through`; `em` — латунь `#D6B685`, 600.

3.2 Анимация на `v16:hold` (после демо механики, см. 4.0): текст появляется (opacity 0→1, 250 мс) → через 700 мс латунная линия рисуется слева направо поверх `s` (псевдоэлемент `::after`, `width 0→100%`, 480 мс, `power2.inOut`) → `em` появляется (opacity+`x:-6→0`, 300 мс). Один раз на визит комнаты (`v16:leave` сбрасывает). `prefers-reduced-motion`: сразу конечное состояние.

3.3 Тексты (data.js `todo:{task, done}`), утверждены владельцем:

| id | task | done |
|---|---|---|
| flur | Sechs Offerten einholen und vergleichen | eine. |
| kueche | Schreiner, Sanitär und Elektro koordinieren | ein Takt. |
| bad | Abdichtung und Normen selbst kontrollieren | protokolliert. |
| schlaf | Handwerker-Termine abstimmen | ein Bauzeitplan. |
| wohnen | Wöchentlich auf die Baustelle | wöchentliches Update. |
| rohbau | Schutt, Staub und Container organisieren | täglich besenrein. |
| eingang | — (без зачёркивания) | **Ihre Liste: leer.** Ein Anruf genügt. |

Eingang: `em` первым, белый хвост «Ein Anruf genügt.» обычным весом; `em` появляется с задержкой 400 мс после четырёх обещаний (§4.6).

---

## 4. Механики по комнатам

**4.0 Общий принцип «показать себя один раз».** На `v16:hold` через 900 мс (после появления текста) механика проигрывает демо 1.2–1.8 с, затем передаёт управление пальцу/мыши. Демо — один раз за сессию на комнату (`sessionStorage['s5demo:'+id]`), при повторном входе — сразу интерактив. `prefers-reduced-motion` → без демо, конечное состояние. Все слои механик живут в новом контейнере `#wS5` (`position:absolute;inset:0;z-index:5;pointer-events:none`), вставленном в `#wStage` **перед** `#wOv` — при равном z-index текст как более поздний сосед рисуется поверх. Интерактивные элементы внутри `#wS5` получают `pointer-events:auto`. Затемняющие слои никогда не перекрывают `#wOv`.

Координаты всех фигур — в процентах сцены (`#wStage`), отдельно для `L` и `P` (как `hot/hotP`). Для трассировки: dev-режим `?trace=1` — клик по кадру пишет в консоль `{x%, y%}` и рисует точку; это 15 строк, сделать первым.

**4.1 Schwelle (`flur`) — «Sechs → Eins».** `mech:'six2one'`.
- Точка (латунь, r=7, кольцо r=26) в `P:{x:50,y:40}`, `L:{x:52,y:52}`. Хит-зона 96 px.
- Состояние *held* (палец/мышь удерживает точку): из точки вылетают 6 «бумажек» (`.s5-note`: светлая карточка 132 px, лёгкий поворот −7…+7°, тень), каждая с пунктирной латунной линией к точке. Появление: stagger 60 мс, `scale .6→1`, `y +12→0`, `back.out(1.4)`. Позиции `P` (в %): Sanitär 6/23, Elektro 60/17, Schreiner 63/28, Maler 9/35, Plattenleger 33/43, Rückbau 63/44; `L` — трассировать по §4.0.
- Тексты бумажек (data.js `six:[{t,l}]`): Sanitär — «Offerte ausstehend · Termin: ?»; Elektro — «Rechnung 2/6 · Rückruf offen»; Schreiner — «Lieferung verschoben · 3 Wochen»; Maler — «wartet auf Gipser»; Plattenleger — «Abdichtung: wer?»; Rückbau — «Wiegeschein fehlt». Слова `?`, `verschoben`, `wer?` — красным `#b3261e`.
- Состояние *released* (отпустил): бумажки схлопываются в точку (`scale→.2, opacity→0`, 260 мс), под точкой карточка `.s5-card` (латунная рамка): `EIN BAULEITER` / `eine Nummer · ein Werkvertrag · eine Rechnung` (+ вторая строка мельче: `Artem Kozlovskyi · Inhaber` — без фото).
- Демо: held 1.4 с → released. Пока держат, `#wOv` притушен до `opacity:.35`.
- Чипы `.w-chips` для `flur` скрыть (их роль берут бумажки).

**4.2 Küche — «Takt».** `mech:'takt'`.
- Три зоны-полигона (SVG, координаты в %). `P`: Schreiner (остров) `55,52 100,49.5 100,61.5 63,61.5`; Sanitär (стойка) `60.5,46.5 84.5,46.5 84.5,49 60.5,49`; Elektro (подвесы) `71,33.5 90,33.5 94,41.7 75,42.2`. `L` — трассировать.
- Тап в любом месте кадра (не по UI) → последовательность 3 такта по 650 мс: зона заливается `rgba(111,163,242,.25)` + обводка `#6FA3F2` 2 px, рядом карточка `N · GEWERK` / текст; предыдущая зона остаётся латунной обводкой с галочкой в пилюле («1 · Schreiner ✓»). После третьего — строка в латуни по центру кадра `Drei Gewerke, ein Termin.` 1.8 с, затем всё гаснет до пилюль.
- Тексты: 1 Schreiner — «Insel Räuchereiche, Abdeckung Naturstein»; 2 Sanitär — «Anschlüsse und Armatur — im Takt mit dem Schreiner»; 3 Elektro — «Pendel, Stromschienen, Steuerung — koordiniert».
- Бонус (десктоп + телефон): pointer над зоной подсвечивает её без последовательности.
- Демо = один автоматический прогон.

**4.3 Bad — «Tageslicht ↔ Abend bei Kerzen».** `mech:'dusk'`. Требует ассет §6.
- Слой `.s5-dusk` над холдом: второе изображение `bad-dusk-<L|P>.jpg`, `clip-path:inset(0 0 0 var(--x))` (та же механика, что `.w-cmp-after` в `site.css`). Вертикальная линия-шторка + круглая ручка `☀ ☾` (50 px), метки-пилюли `TAGESLICHT` слева и `ABEND` справа (латунь).
- Драг ручки/линии по горизонтали (pointer), диапазон 4–96 %. Демо: `x` 0→100→38 % за 1.8 с (`power2.inOut`).
- Живой огонь: поверх dusk-слоя два радиальных тёплых блика у свечей (координаты по рендеру) с `opacity` дыханием 0.85↔1 (2.6 с, разный сдвиг фаз) — 20 строк CSS, продаёт «свечи горят».
- 2.5D-параллакс (`depth-v16.js`) на этой комнате **отключить**, пока `--x > 0` (иначе холд двигается, dusk-слой нет). Расширение шейдера второй текстурой — в бэклог, не сейчас.
- Кикер «Abnahme bei Tageslicht» уже задан в 2.5; to-do по 3.3.

**4.4 Schlaf — световая линия Ablauf.** `mech:'ablauf'`. Сроков нет — только факты из `STEPS.pts`.
- Горизонтальная линия на стене: `P: y=38%, x 14→86%`; `L` — вдоль скрытой подсветки лиственницы, трассировать. Цвет `#FFE7B8`, свечение `drop-shadow(0 0 6px rgba(255,231,184,.9))`.
- 5 узлов = `STEPS[0..4].t` (Anfrage · Besichtigung · Offerte · Ausführung · Übergabe) с подписью-фактом: `Rückruf in 5 Min` · `kostenlos, vor Ort` · `innert 48 h` · `wöchentliches Update` · `Protokoll + Schlüssel` (подписи чередуются над/под линией, чтобы не слипались).
- Демо: линия «пробегает» 0→100 % за 1.8 с, узлы загораются по ходу, активным остаётся 4 (Ausführung) с карточкой `SCHRITT 4 VON 5` / «Ein Bauleiter, ein Bauzeitplan — Sie bekommen jede Woche ein Update». Тексты карточек остальных узлов: 1 «Sie schildern kurz, worum es geht — wir rufen in 5 Minuten zurück»; 2 «Aufmass vor Ort, Ist-Zustand mit Fotos»; 3 «Festpreis-Offerte, Position für Position»; 5 «Gemeinsame Abnahme, Protokoll, Schlüssel».
- Горизонтальный драг по кадру скраббит активный узел (ближайший к пальцу). Не конфликтует с вертикальным свайпом глав: `onTouchMove` уже игнорирует движение, где `|dx| > |dy|` — оставить как есть, механика слушает `pointermove` с `touch-action:pan-y` на `#wS5`.

**4.5 Wohnen** — без механики (`mech:null`); кикер и to-do по §2.5/§3. Счётчики остаются.

**4.5b Rückblende (`rohbau`) — шторка драгом.** `mech:'wipe'`.
- На телефоне сейчас split-stop (`film-v16.js` ~L376–405, `SPLIT_LEG/SPLIT_HOLD`). Оставить split-stop как **вход** в главу, после него включить `#wCmp` и на телефоне тоже (снять `display:none!important` в `film-v16.css` для `k===RUECK_K`), ручка `‹ ›`, метки `Monate früher` / `Heute` (латунь). Драг как на десктопе (`.w-cmp` уже умеет). Демо не нужно — split-stop и есть демо.

**4.6 Eingang — 48 часов + Vier Versprechen + Akte.** `mech:'clock'`.
- Карточка вверху кадра (`P: y=26%`, по центру; `L: справа сверху`): `ANFRAGE JETZT` / `Offerte bis <b>{Tag}, {HH:MM}</b>` (латунь). Расчёт `deadline48()`: **календарные 48 часов** (утверждено): `deadline = now + 48 h`, без пропуска выходных; вывод: день недели по-немецки (`Montag…Sonntag`) + `HH:MM` в Europe/Zurich, минуты округлить до :00/:30 вверх. Обновлять раз в минуту, пока глава активна.
- Под карточкой 4 строки «Vier Versprechen» (номер в латунном кольце 18 px + текст 12.5 px): 01 Offerte innert 48 h · 02 Ein Ansprechpartner — bis zum Schlüssel · 03 Nach Norm — SIA, mit Protokoll · 04 Termin im Werkvertrag · 24 Mt. Garantie. Появление stagger 120 мс; после 4-й строки — `_sigRun()` подписи (сейчас подпись стартует в `enterHold` сразу — перенести запуск в модуль для `eingang`, для остальных сцен `sig` не используется).
- Подпись на телефоне: сдвинуть `.w-sig` так, чтобы не пересекалась с `.w-todo` и `.w-ctas` (сейчас `A` ложится на кнопки — см. кадр 08). Целевое место: справа над `.w-ctas`, `max-width:120px`.
- To-do финал по §3.3.

**4.7 Akte.**
- Бейдж на `#stickycall .off` (латунь, `AKTE` + число посещённых комнат, `position:absolute;top:-10px;right:-4px`). Комнаты считаются по `v16:hold` (Set в `sessionStorage`).
- Тап по бейджу или по `.off` **внутри дома** (`houseActive`) → bottom-sheet `#wAkte` (высота ~46 vh, backdrop-blur): заголовок «Ihre Akte», список посещённых комнат чипами, две кнопки: **«Richtpreis berechnen»** → `releaseHouse()` + плавный скролл к `#richtwert`; **«Offerte anfragen»** → `window.PREFILL={gewerk:'Renovation', msg:'Anfrage nach dem Rundgang — angeschaut: Küche, Bad, Schlafzimmer. Bitte um Rückruf und Offerte innert 48 h.'}` и `go('kontakt')` (как в `app.js` L304/L373). Вне дома `.off` ведёт на `/kontakt` как сейчас.
- Десктоп: та же шторка, вкладка справа не делаем.

---

## 5. Данные (data.js, дополнить сцены)

```js
// пример для kueche
{ id:'kueche', …, q:'Wer macht was?', mech:'takt',
  todo:{task:'Schreiner, Sanitär und Elektro koordinieren', done:'ein Takt.'},
  takt:{ P:[{t:'Schreiner',l:'Insel Räuchereiche, Abdeckung Naturstein',poly:'55,52 100,49.5 100,61.5 63,61.5'},
            {t:'Sanitär',  l:'Anschlüsse und Armatur — im Takt mit dem Schreiner',poly:'60.5,46.5 84.5,46.5 84.5,49 60.5,49'},
            {t:'Elektro',  l:'Pendel, Stromschienen, Steuerung — koordiniert',poly:'71,33.5 90,33.5 94,41.7 75,42.2'}],
         L:[/* трассировать ?trace=1 */] } }
```
Аналогично `six` (flur), `ablauf` (schlaf: `lineP:{y:38,x0:14,x1:86}`, `lineL:{…}`), `dusk` (bad: `glowP:[{x,y}], glowL:[…]`), `clock` (eingang). `FILM_V15` не трогать — поля добавляются в те же объекты сцен (они общие), для `?film=15` они просто игнорируются.

---

## 6. Ассет: Bad при свечах (Tageslicht ↔ Abend)

Исполнение: **Claude в Chrome владельца → Flow (Nano Banana Pro), image-to-image от `site/img/film/v16/stills/bad-L.jpg`** (владелец разрешил пользоваться его компьютером и браузером; утверждение кадра — владелец). Мастер кладётся в `core/_incoming/v16/bad-dusk_L_2K_*.jpeg`, в `site/` только деривативы.

Промпт (EN, для Flow):
> Same bathroom, same camera, same geometry, materials and furniture — change ONLY the lighting and time of day. Dusk after sunset: deep blue evening sky over the lake and mountains, thin warm glow left on the horizon, mist below. Interior main lights off; the recessed ceiling light line at ~20 % warm. Nine to twelve lit candles: pillar candles and tea lights along the stone rim of the freestanding bathtub and two on the floor beside it; warm candlelight reflecting on the wet stone, the water surface and the glass wall. Photoreal, calm, no people, no text, no extra objects, no change to the room.

Критерии: геометрия и кадрирование 1:1 с `bad-L.jpg` (наложением в 50 % не должно «плыть» ни стекло, ни ванна); свечи только на бортике/полу у ванны (в портретном кропе ванна слева внизу — свечи должны попасть в кроп); без пересветов; 2K.
Деривативы: `bad-dusk-L.jpg` 1920×1080 и `bad-dusk-P.jpg` 1080×1920 (портрет = кроп из ландшафта по правилу v16b, без второй генерации), JPEG q≈80, ≤ 420 КБ, тем же скриптом, что `core/dev/v16-build.js` делает стиллы. Запись в `core/sources/sprintE/REGISTRY.md` раздел «v16 · Etappe 5».

---

## 7. Ankunft — отдельная чистка (после стадии 5)

Hero перегружен: `.w-trust` (4 чипа) переносится на две строки, `#wStart` упирается в `#stickycall` и бейдж Akte. Сделать: `.w-trust` → максимум 3 чипа в одну строку (`Offerte innert 48 h · HR Zürich · 24 Mt. Garantie`, «Versichert» убрать в футер), `#wStart` поднять над sticky-панелью (`bottom: calc(var(--sticky-h) + 12px)`), `#wPlan` скрыт как везде. Счётчики 6 / 24h / 100 % оставить.

---

## 8. Что НЕ делать

Никаких цен в фильме. Никакого фото Артема. Никаких штампов/ключей/ссылок на объекты рядом. Никакой боковой вкладки. Не трогать `film.js` (Engine A) и `?film=15`. Не менять `onTouchMove`/пороги свайпа. Ничего не ставить absolute внутрь `#wOv`.

---

## 9. Тесты и приёмка

- Скрипт `core/dev/pw-stage5.js` (перенести из `/tmp/pw-full-mobile2.js` этой сессии): Playwright, `hasTouch`, 390×844, реальные `TouchEvent`-свайпы по 8 главам; для каждой: 0 JS-ошибок, `.w-todo` присутствует и после 3 с содержит `s` с завершённой линией, механика отрисована (`#wS5` не пустой для сцен с `mech`), нет пересечений `getBoundingClientRect` между `#wS5 .s5-card`, `.w-todo`, `.w-sig`, `#stickycall`. Плюс 1440×900 и 844×390 (landscape) без ошибок.
- Ручная приёмка владельцем на телефоне по 8 кадрам-референсам `core/dev/refs/f_0…f_7.png`.
- После приёмки: `HANDOFF.md` §15 «Etappe 5» (что сделано, где данные, как трассировать полигоны), `PLAN-v16.md` §3.3 → ✅ со ссылкой сюда. Прод — только по «в прод».

---

## 10. Решения владельца (16.09, закрыто)

1. Две кнопки в sticky-панели: «Rückruf in 5 Min» + «Offerte in 48 h»; «Anrufen» убран, номер остаётся в меню и в Rückruf-шторке.
2. 48 h — календарные часы, без пропуска выходных (§4.6).
3. Десктоп — те же механики, крупнее (§2.6).
4. To-do для Rückblende: «Schutt, Staub und Container organisieren → täglich besenrein.» (из реального обещания STEPS «Baustelle täglich sauber»; вариант «Mieter informieren» отклонён).
5. Bad при свечах — делаем (§6).
6. Akte → «Offerte anfragen»: в сообщении только список комнат (§4.7).
