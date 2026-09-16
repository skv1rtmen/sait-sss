@echo off
echo === setup-git start === > setup-git.log
echo Working dir: %CD% >> setup-git.log
git --version >> setup-git.log 2>&1
if errorlevel 1 goto nogit

if exist .git rmdir /s /q .git
echo [1] old .git removed >> setup-git.log

git init >> setup-git.log 2>&1
git branch -M main >> setup-git.log 2>&1
git config core.autocrlf true
git config core.longpaths true
git config user.name "skv1rtmen"
git config user.email "prekrasniyyy@gmail.com"
echo [2] init done >> setup-git.log

echo.
echo Adding files. This takes 1-3 minutes. Please wait...
echo.
git add -A >> setup-git.log 2>&1
echo [3] add done >> setup-git.log

git commit -m "Initial commit: site + core, final v16 videos" >> setup-git.log 2>&1
echo [4] commit done >> setup-git.log

git log --oneline -1 >> setup-git.log 2>&1
git count-objects -vH >> setup-git.log 2>&1
echo === DONE === >> setup-git.log
echo.
echo Finished. See setup-git.log
timeout /t 15
exit /b 0

:nogit
echo GIT NOT FOUND IN PATH >> setup-git.log
echo.
echo ERROR: git not found in PATH
timeout /t 20
exit /b 1
