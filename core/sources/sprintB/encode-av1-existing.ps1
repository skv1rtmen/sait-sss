param(
  [string]$SiteRoot = (Join-Path $PSScriptRoot '..\..\..\site'),
  [switch]$Force,
  [switch]$Verify
)

$ErrorActionPreference = 'Stop'
$userPath = [Environment]::GetEnvironmentVariable('Path', 'User')
if ($userPath) { $env:Path += ";$userPath" }
if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
  throw 'ffmpeg is not available on PATH'
}

$film = Join-Path $SiteRoot 'img\film'
$inputs = @(Get-ChildItem -LiteralPath (Join-Path $film 'v') -Filter '*.h264.mp4' -File)
$intro = Join-Path $film 'intro.h264.mp4'
if (Test-Path -LiteralPath $intro) { $inputs += Get-Item -LiteralPath $intro }

$rows = foreach ($input in $inputs) {
  $output = $input.FullName -replace '\.h264\.mp4$', '.av1.mp4'
  if ($Force -or -not (Test-Path -LiteralPath $output)) {
    Write-Host "Encoding $($input.Name)"
    if ($input.Name -eq 'intro.h264.mp4') {
      # Critical path: smaller, grain-free encode; CRF 40 still clears VMAF 93 against the H.264 production source.
      & ffmpeg -hide_banner -loglevel error -y -i $input.FullName `
        -c:v libsvtav1 -preset 5 -crf 40 -g 30 -pix_fmt yuv420p10le `
        -color_primaries bt709 -color_trc bt709 -colorspace bt709 `
        -movflags +faststart -an $output
    } else {
      & ffmpeg -hide_banner -loglevel error -y -i $input.FullName `
        -c:v libsvtav1 -preset 5 -crf 30 -g 30 -pix_fmt yuv420p10le `
        -svtav1-params 'tune=0:film-grain=8:film-grain-denoise=0:enable-overlays=1:scd=0:keyint=30' `
        -color_primaries bt709 -color_trc bt709 -colorspace bt709 `
        -movflags +faststart -an $output
    }
    if ($LASTEXITCODE -ne 0) { throw "AV1 encode failed: $($input.Name)" }
  }

  $vmaf = $null
  if ($Verify) {
    $vmafText = & ffmpeg -hide_banner -i $output -i $input.FullName `
      -lavfi '[0:v]scale=1920:1080:flags=bicubic[a];[1:v]scale=1920:1080:flags=bicubic[b];[a][b]libvmaf=model=version=vmaf_v0.6.1:n_threads=8' `
      -f null - 2>&1 | Select-String -Pattern 'VMAF score:' | Select-Object -Last 1
    if ($vmafText -and $vmafText.Line -match 'VMAF score:\s*([0-9.]+)') { $vmaf = [double]$Matches[1] }
  }

  $outItem = Get-Item -LiteralPath $output
  [pscustomobject]@{
    File = $outItem.Name
    SourceMB = [math]::Round($input.Length / 1MB, 2)
    Av1MB = [math]::Round($outItem.Length / 1MB, 2)
    SavingPct = [math]::Round((1 - $outItem.Length / $input.Length) * 100, 1)
    Vmaf = $vmaf
  }
}

$rows | Format-Table -AutoSize
