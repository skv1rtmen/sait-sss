@echo off
rem v15 Berghaus: Master (core\_incoming\v15) → Web-Derivate (site\img\film\{f15,f15h,f15l,fp15,s15,s15p,r15,mp15}). Log: core\dev\_v15-build.log
chcp 65001 >nul
cd /d "%~dp0"
if not exist node_modules\ffmpeg-static (call npm i ffmpeg-static --no-audit --no-fund >> _v15-build-npm.log 2>&1)
node v15-build.js > _v15-build-out.txt 2>&1
echo EXIT %ERRORLEVEL% >> _v15-build-out.txt
