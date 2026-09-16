# ============================================================
#  Настройка git для проекта "сайт ссс"
#  Неинтерактивный режим. Всё пишется в setup-git.log
# ============================================================

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root
$log = Join-Path $root "setup-git.log"

function L($msg) {
    $line = "$(Get-Date -Format 'HH:mm:ss')  $msg"
    Write-Host $line
    Add-Content -Path $log -Value $line -Encoding UTF8
}

Set-Content -Path $log -Value "=== setup-git $(Get-Date) ===" -Encoding UTF8
L "Папка: $root"

# --- 0. git ---
try {
    $gv = (git --version) 2>&1
    L "git: $gv"
} catch {
    L "ОШИБКА: git не найден. https://git-scm.com/download/win"
    exit 1
}

# --- 1. Снести битый .git ---
if (Test-Path ".git") {
    L "Удаляю старый .git"
    try {
        Remove-Item -Recurse -Force ".git" -ErrorAction Stop
        L "Старый .git удалён"
    } catch {
        L "ОШИБКА при удалении .git: $_"
        exit 1
    }
}

# --- 2. Инициализация ---
git init -q
git branch -M main
git config core.autocrlf true
git config core.longpaths true
if (-not (git config --global user.name))  { git config user.name  "skv1rtmen" }
if (-not (git config --global user.email)) { git config user.email "prekrasniyyy@gmail.com" }
L "Репозиторий создан, ветка main"

# --- 3. Индексация ---
L "Добавляю файлы (1-3 минуты)..."
git add -A 2>&1 | ForEach-Object { if ($_) { L "  git add: $_" } }

$count = (git diff --cached --name-only | Measure-Object -Line).Lines
L "В индексе файлов: $count"

if ($count -eq 0) {
    L "ОШИБКА: индекс пустой, коммитить нечего"
    exit 1
}

# --- 4. Крупные файлы ---
$big = git diff --cached --name-only | Where-Object {
    (Test-Path -LiteralPath $_) -and ((Get-Item -LiteralPath $_).Length -gt 45MB)
}
if ($big) {
    L "ВНИМАНИЕ, файлы >45 МБ:"
    $big | ForEach-Object { L ("  {0,8:N1} MB  {1}" -f ((Get-Item -LiteralPath $_).Length/1MB), $_) }
} else {
    L "Файлов больше 45 МБ нет — ок"
}

# --- 5. Коммит ---
git commit -q -m "Initial commit: сайт + core, финальные видео v16" 2>&1 | ForEach-Object { if ($_) { L "  commit: $_" } }
$head = (git log --oneline -1) 2>&1
L "Коммит: $head"

# --- 6. Размер ---
$size = (git count-objects -vH | Select-String "size-pack").ToString()
L "Размер репозитория: $size"

# --- 7. Готово ---
L ""
L "ЛОКАЛЬНЫЙ РЕПОЗИТОРИЙ ГОТОВ."
L "Для GitHub далее:"
L "   git remote add origin <URL>"
L "   git push -u origin main"
L "=== DONE ==="
