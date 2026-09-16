@echo off
echo start %DATE% %TIME% > "%~dp0_v15-deploy-start.txt"
chcp 65001 >nul
cd /d "%~dp0..\.."
set LOG=core\dev\_v15-deploy-out.txt
echo === v15 draft deploy %DATE% %TIME% === > "%LOG%"
rem Sicherheitsnetz: Rohmaterial darf NICHT mit deployt werden
if exist "site\img\film\s14\_incoming" (if not exist "core\_incoming" mkdir "core\_incoming") & (move /y "site\img\film\s14\_incoming\*" "core\_incoming\" >> "%LOG%" 2>&1) & rmdir "site\img\film\s14\_incoming" >> "%LOG%" 2>&1
call npx -y netlify-cli@17 deploy --dir=site --message "v15.2 Berghaus: Quality-Push-ins, 642 Kader, xfade Halt->Uebergang" >> "%LOG%" 2>&1
echo EXIT %ERRORLEVEL% >> "%LOG%"
echo done %DATE% %TIME% >> "%~dp0_v15-deploy-start.txt"
