# dev/ — скрипты проверки (не деплоятся)
Запуск из папки, где лежат `site/` и `dev/` (например `/mnt/user-data/working`):
  nohup node dev/static-srv.js > /tmp/srv.log 2>&1 &     # http://localhost:8099, эмулирует Netlify-rewrites
  node dev/route-test.js | node dev/flight-test.js | node dev/hybrid-test.js | node dev/analytics-test.js
  node dev/crawl-v9.js (31 route × 3 вьюпорта) | node dev/final-home-check.js | node dev/bench.js LABEL
Все скрипты используют Chromium песочницы: EXE='/opt/pw-browsers/chromium-1194/chrome-linux/chrome' (заменить при другом окружении).
Зависимость: playwright (npm i playwright --no-save). fling.js — реалистичный wheel-флинг для тестов полётов.
Prerender: `cd site && node _tools/prerender.js` (копия в dev/tools/ — идентична).
