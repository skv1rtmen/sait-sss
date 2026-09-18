#!/usr/bin/env bash
# BauStern — leichte Fassung der v16-Clips (Etappe 9).
# Die ausgelieferte «lite»-Fassung war mit 4,4 Mbit/s kaum leichter als nötig: 1,2 MB für 2,2 s.
# crf 27 bei 720p ist am Telefon nicht von der HD-Fassung zu unterscheiden (SSIM 0,955), spart aber ~40 %.
# Aufruf: bash core/dev/lite-encode.sh   (arbeitet in site/img/film/v16/clips)
set -eu
cd "$(dirname "$0")/../../site/img/film/v16/clips"
mkdir -p lite
for f in *.mp4; do
  case "$f" in *-P.*) SC="scale=720:1280:flags=lanczos";; *) SC="scale=1280:720:flags=lanczos";; esac
  ffmpeg -v error -y -i "$f" -c:v libx264 -crf 27 -preset slow -tune film -pix_fmt yuv420p \
    -movflags +faststart -an -vf "$SC" "lite/$f"
  printf '%-34s %6s KB\n' "$f" "$(( $(stat -c%s "lite/$f") / 1024 ))"
done
du -sh lite
