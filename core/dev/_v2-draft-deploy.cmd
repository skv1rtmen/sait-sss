@echo off
echo start %DATE% %TIME% > "%~dp0_v2-deploy-start.txt"
chcp 65001 >nul
cd /d "%~dp0..\.."
set LOG=core\dev\_v2-deploy-out.txt
echo === draft deploy %DATE% %TIME% === > "%LOG%"
echo cwd=%CD% >> "%LOG%"
rem Sicherheitsnetz: Rohmaterial (Downloads-Kopien, private Fotos) darf NICHT mit deployt werden
if not exist "core\_incoming" mkdir "core\_incoming"
if exist "site\img\film\s14\_incoming" move /y "site\img\film\s14\_incoming\*" "core\_incoming\" >> "%LOG%" 2>&1
if exist "site\img\film\s14\_incoming" rmdir "site\img\film\s14\_incoming" >> "%LOG%" 2>&1
if not exist "%APPDATA%\netlify\config.json" (
  echo --- netlify login: im Browser "Authorize" klicken >> "%LOG%"
  call npx -y netlify-cli@17 login >> "%LOG%" 2>&1
)
echo --- npx netlify-cli deploy (draft) >> "%LOG%"
call npx -y netlify-cli@17 deploy --dir=site --message "v14 vertical cut (flagged, mv2)" >> "%LOG%" 2>&1
echo EXIT %ERRORLEVEL% >> "%LOG%"
echo done %DATE% %TIME% >> "%~dp0_v2-deploy-start.txt"
