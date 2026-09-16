@echo off
rem v15 Berghaus: sammelt heutige Flow-Downloads (jpeg/png/mp4, ab 04:30) aus Downloads nach core\_incoming\v15\  Log: core\dev\_v15-collect.log
chcp 65001 >nul
cd /d "%~dp0..\.."
set LOG=core\dev\_v15-collect.log
set DST=core\_incoming\v15
if not exist "%DST%" mkdir "%DST%"
echo === v15 collect %DATE% %TIME% === > "%LOG%"
powershell -NoProfile -Command "$t=Get-Date '2026-09-15 04:30'; Get-ChildItem \"$env:USERPROFILE\Downloads\" -File | Where-Object { $_.LastWriteTime -gt $t -and $_.Extension -match '^\.(jpeg|jpg|png|mp4)$' } | Sort-Object LastWriteTime | ForEach-Object { Copy-Item $_.FullName -Destination '%DST%' -Force; '{0:HH:mm:ss}  {1,10}  {2}' -f $_.LastWriteTime, $_.Length, $_.Name }" >> "%LOG%" 2>&1
echo --- incoming v15: >> "%LOG%"
dir /o:d "%DST%" >> "%LOG%" 2>&1
echo done >> "%LOG%"
