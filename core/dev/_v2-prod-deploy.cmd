@echo off
rem BauStern v14 — PRODUCTION deploy (netlify deploy --prod --dir=site). Log: core\dev\_v2-prod-out.txt
chcp 65001 >nul
cd /d "%~dp0..\.."
set LOG=core\dev\_v2-prod-out.txt
echo === PROD deploy %DATE% %TIME% === > "%LOG%"
rem Sicherheitsnetz: Rohmaterial (Downloads-Kopien, private Fotos) darf NICHT mit deployt werden
if not exist "core\_incoming" mkdir "core\_incoming"
if exist "site\img\film\s14\_incoming" move /y "site\img\film\s14\_incoming\*" "core\_incoming\" >> "%LOG%" 2>&1
if exist "site\img\film\s14\_incoming" rmdir "site\img\film\s14\_incoming" >> "%LOG%" 2>&1
call npx -y netlify-cli@17 deploy --prod --dir=site --message "v14 vertical cut + Ankunft + portrait stills" >> "%LOG%" 2>&1
echo EXIT %ERRORLEVEL% >> "%LOG%"
