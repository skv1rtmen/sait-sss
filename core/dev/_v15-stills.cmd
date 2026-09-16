@echo off
rem v15: nur Haltebilder/Stills neu (holdAt aus v15-map.json), Kader und Videos bleiben. Log: core\dev\_v15-build.log
chcp 65001 >nul
cd /d "%~dp0"
set V15_ONLY=stills
node v15-build.js > _v15-build-out.txt 2>&1
echo EXIT %ERRORLEVEL% >> _v15-build-out.txt
