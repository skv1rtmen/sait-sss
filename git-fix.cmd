@echo off
echo === git-fix === > git-fix.log
if exist .git\index.lock del /f /q .git\index.lock
echo lock removed >> git-fix.log
git status --short >> git-fix.log 2>&1
git log --oneline -1 >> git-fix.log 2>&1
git branch --show-current >> git-fix.log 2>&1
echo === DONE === >> git-fix.log
echo Done. See git-fix.log
timeout /t 5
