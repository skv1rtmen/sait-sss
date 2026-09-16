param([string]$ProjectRoot = (Join-Path $PSScriptRoot '..\..\..'),[switch]$Portrait,[ValidateSet(30,60)][int]$FrameRate=30)
$ErrorActionPreference = 'Stop'
$ProjectRoot = (Resolve-Path -LiteralPath $ProjectRoot).Path
$ffmpeg = Get-Command ffmpeg -ErrorAction SilentlyContinue
if (-not $ffmpeg) {
  $pkg = Get-ChildItem -LiteralPath "$env:LOCALAPPDATA/Microsoft/WinGet/Packages" -Directory -Filter 'BtbN.FFmpeg*' | Select-Object -First 1
  $ffmpeg = Get-ChildItem -LiteralPath $pkg.FullName -Recurse -Filter ffmpeg.exe -File | Select-Object -First 1
}
if (-not $ffmpeg) { throw 'FFmpeg fehlt' }
$exe = if ($ffmpeg.Source) { $ffmpeg.Source } else { $ffmpeg.FullName }
$version = if ($FrameRate -eq 60) { 'm2' } else { 'm1' }
$folder = $version + $(if ($Portrait) { 'p' } else { '' })
$out = Join-Path $ProjectRoot ('site/img/film/' + $folder)
New-Item -ItemType Directory -Path $out -Force | Out-Null
$src = Join-Path $ProjectRoot '_work-rife/seg'
$inputs = @(Get-ChildItem -LiteralPath $src -File -Filter 'c*.mov' | Where-Object Name -notlike 'c1-*')
$inputs += Get-Item -LiteralPath (Join-Path $src 'intro-ref.mov')
$report = foreach ($input in $inputs) {
  $name = if ($input.Name -eq 'intro-ref.mov') { 'intro' } else { $input.BaseName }
  $output = Join-Path $out ($name + '.mp4')
  # Ein universeller 16:9-Master: object-fit:cover liefert denselben Mittelpunkt wie die Portrait-Stills.
  # Main 3.2 erlaubt 720p60; 30 fps bleibt als sparsamer, unveränderter m1-Fallback erhalten.
  $filter = if ($Portrait) { "fps=$FrameRate,crop=608:1080:(iw-608)/2:0,scale=540:960:flags=lanczos,setsar=1" } else { "fps=$FrameRate,scale=1280:720:flags=lanczos,setsar=1" }
  $level = if ($FrameRate -eq 60) { '3.2' } else { '3.1' }
  & $exe -hide_banner -loglevel error -y -i $input.FullName -vf $filter -c:v libx264 -threads 2 -preset slow -crf 25 -profile:v main -level:v $level -pix_fmt yuv420p -g $FrameRate -keyint_min $FrameRate -sc_threshold 0 -movflags +faststart -an $output
  if ($LASTEXITCODE -ne 0) { throw "Encoding fehlgeschlagen: $name" }
  [pscustomobject]@{File=$name+'.mp4';Bytes=(Get-Item -LiteralPath $output).Length}
}
$reportFile = if ($FrameRate -eq 60) { 'core/dev/reports/mobile-encode-'+$folder+'.json' } elseif ($Portrait) { 'core/dev/reports/mobile-encode-portrait.json' } else { 'core/dev/reports/mobile-encode.json' }
$report | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $ProjectRoot $reportFile) -Encoding utf8
$report | Format-Table -AutoSize
