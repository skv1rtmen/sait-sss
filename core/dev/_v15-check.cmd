@echo off
rem BauStern v15 — Prerender (Playwright-Chromium) → jsdom-Smoke (Telefon v2 + Desktop) → Dev-Server :8099. Log: core\dev\_v15-check.log
chcp 65001 >nul
cd /d "%~dp0"
set NODE_PATH=%~dp0node_modules
rem Prerender: echtes Google Chrome statt Playwright-Chromium (kein Browser-Download nötig)
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" set CHROME=C:\Program Files\Google\Chrome\Application\chrome.exe
echo === v15 check %DATE% %TIME% === > "_v15-check.log"
node --version >> "_v15-check.log" 2>&1
echo --- prerender >> "_v15-check.log"
node prerender-run.js >> "_v15-check.log" 2>&1
echo prerender EXIT %ERRORLEVEL% >> "_v15-check.log"
echo --- smoke MV2=1 W=375 >> "_v15-check.log"
set MV2=1
set W=375
node jsdom-smoke.js >> "_v15-check.log" 2>&1
echo EXIT %ERRORLEVEL% >> "_v15-check.log"
echo --- smoke desktop W=1440 >> "_v15-check.log"
set MV2=0
set W=1440
node jsdom-smoke.js >> "_v15-check.log" 2>&1
echo EXIT %ERRORLEVEL% >> "_v15-check.log"
echo --- static-srv >> "_v15-check.log"
start "baustern-srv" /min cmd /c "node static-srv.js > _v2-srv.log 2>&1"
echo started >> "_v15-check.log"
