@echo off
rem Sammelt die aus Google Flow heruntergeladenen Ankunft-Assets (PNG 2K + MP4 1080p) aus Downloads nach site\img\film\s14\_incoming\
rem Danach: Dateien sichten und umbenennen (PROMPTS-v2.md §0): s14p/st-ankunft.jpg, s14p/st-ankunft-hold.jpg, s14/st-ankunft.jpg, s14/st-ankunft-hold.jpg,
rem r14/ankunft.h264.mp4 (16:9), mp14/ankunft.mp4 (9:16). Hold-Kader = LETZTER Frame des Videos (ffmpeg -sseof -0.05 -i ankunft.mp4 -frames:v 1 hold.jpg).
chcp 65001 >nul
cd /d "%~dp0..\.."
set LOG=core\dev\_v2-collect.log
set DST=site\img\film\s14\_incoming
if not exist "%DST%" mkdir "%DST%"
echo === collect %DATE% %TIME% === > "%LOG%"
dir /o-d /t:w "%USERPROFILE%\Downloads\*.png" "%USERPROFILE%\Downloads\*.mp4" >> "%LOG%" 2>&1
for %%p in (entrance Entrance building Building Apartment Camera camera Door door hallway) do (
  for %%f in ("%USERPROFILE%\Downloads\*%%p*.png" "%USERPROFILE%\Downloads\*%%p*.mp4") do copy /y "%%~f" "%DST%\" >> "%LOG%" 2>&1
)
echo --- incoming: >> "%LOG%"
dir /o-d "%DST%" >> "%LOG%" 2>&1
echo done >> "%LOG%"
