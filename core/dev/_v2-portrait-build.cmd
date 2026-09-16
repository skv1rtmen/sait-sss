@echo off
rem BauStern v14 — Portrait-Assets aus Downloads einbauen (siehe portrait-build.js). Log: core\dev\_v2-portrait.log
chcp 65001 >nul
cd /d "%~dp0"
if not exist node_modules\ffmpeg-static (
  echo installing ffmpeg-static ... > _v2-portrait-npm.log
  call npm i ffmpeg-static@5 --no-save --no-audit --no-fund >> _v2-portrait-npm.log 2>&1
)
node portrait-build.js > _v2-portrait-run.log 2>&1
