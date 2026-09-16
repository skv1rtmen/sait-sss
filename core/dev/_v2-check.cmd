@echo off
rem BauStern v14 — Smoke MV2 + Dev-Server (von Claude/Cowork gestartet). Log: core\dev\_v2-smoke.log
chcp 65001 >nul
cd /d "%~dp0"
set MV2=1
set W=375
echo === smoke MV2=1 W=375 %DATE% %TIME% === > "_v2-smoke.log"
node --version >> "_v2-smoke.log" 2>&1
node jsdom-smoke.js >> "_v2-smoke.log" 2>&1
echo EXIT %ERRORLEVEL% >> "_v2-smoke.log"
echo === desktop W=1440 === >> "_v2-smoke.log"
set MV2=0
set W=1440
node jsdom-smoke.js >> "_v2-smoke.log" 2>&1
echo EXIT %ERRORLEVEL% >> "_v2-smoke.log"
echo === static-srv === >> "_v2-smoke.log"
start "baustern-srv" /min cmd /c "node static-srv.js > _v2-srv.log 2>&1"
echo started >> "_v2-smoke.log"
