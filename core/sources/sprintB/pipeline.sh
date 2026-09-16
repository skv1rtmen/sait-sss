#!/usr/bin/env bash
# BauStern Film — Produktions-Pipeline (Sprint B)
# Quelle: sources/film-v6/v6-c1..c7.mp4 (1280×720, 24 fps, 8 s, H.264) → Master 1920×1080 60 fps ProRes/FFV1
# → LUT → Segmente fwd/rev → AV1 / HEVC / H.264 → Scrub-Frames WebP → VMAF-Report.
#
# Aufruf:  bash pipeline.sh all            # komplett
#          bash pipeline.sh upscale c7     # nur ein Schritt / ein Clip
# Schritte: upscale | lut | segments | encode | scrub | vmaf | intro | all
# Umgebung: ffmpeg ≥ 6 (libsvtav1, libx265, libx264, libwebp, libvmaf), optional rife-ncnn-vulkan / Topaz Video AI CLI.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"            # …/core
SRC="$ROOT/../film/sources/film-v6"                     # Original-Clips
LUT="${LUT:-$ROOT/sources/sprintA/baustern.cube}"
OUT="${OUT:-$ROOT/../site/img/film}"                    # Deploy-Ziel (site/img/film)
WORK="${WORK:-$ROOT/../_work}"                          # Zwischenprodukte (nicht deployen)
# The deployed film contains six 8-second camera clips (6 × 96 scrub frames = 576).
# c7-rohbau is a materialisation source, not a room-to-room flight, and must not shift global frame numbering.
CLIPS=(c1-kueche c2-flur c3-bad c4-schlaf c5-wohnen c6-eingang)
FPS_OUT=60; W_OUT=1920; H_OUT=1080
UPSCALER="${UPSCALER:-auto}"                            # auto | topaz | rife | ffmpeg
TRIM="${TRIM:-}"                                         # Test: nur die ersten N Sekunden (z. B. TRIM=2)
mkdir -p "$WORK"/{master,seg,scrub} "$OUT"/{v,f2,f,fl}

log(){ printf '\033[1;36m▸ %s\033[0m\n' "$*"; }
have(){ command -v "$1" >/dev/null 2>&1; }
ENCODERS="$(ffmpeg -hide_banner -encoders 2>/dev/null || true)"
enc(){ [[ "$ENCODERS" == *" $1 "* ]] || { echo "   (Encoder $1 fehlt in dieser ffmpeg-Build — übersprungen)"; return 1; }; }
pick(){ # Clip-Filter: alle oder nur $1
  if [[ -n "${1:-}" && "$1" != "all" ]]; then printf '%s\n' "${CLIPS[@]}" | grep "^$1" ; else printf '%s\n' "${CLIPS[@]}"; fi; }

# ---------- 1. Upscale + Interpolation → Master (ProRes 422 HQ, 1080p60, bt709) -------------------
upscale(){ for c in $(pick "${1:-}"); do
  in="$SRC/v6-$c.mp4"; out="$WORK/master/$c.mov"; [[ -f "$out" && -z "${FORCE:-}" ]] && { log "skip $c (master exists)"; continue; }
  mode="$UPSCALER"; [[ "$mode" == auto ]] && { if have tvai-ffmpeg; then mode=topaz; elif have rife-ncnn-vulkan; then mode=rife; else mode=ffmpeg; fi; }
  log "upscale $c via $mode"
  case "$mode" in
    topaz) # Topaz Video AI 5.x CLI: Proteus (Upscale) + Apollo (60 fps, optischer Fluss, kein «Jelly»)
      tvai-ffmpeg -hide_banner -i "$in" -vf "tvai_up=model=prob-4:scale=1.5:preblur=0:noise=0:details=8:halo=0:blur=0:compression=10:estimate=20:blend=0.2:device=0:vram=1:instances=1,\
tvai_fi=model=apo-8:slowmo=1:fps=$FPS_OUT:device=0,scale=$W_OUT:$H_OUT:flags=lanczos,format=yuv422p10le" \
        -c:v prores_ks -profile:v 3 -vendor apl0 -color_primaries bt709 -color_trc bt709 -colorspace bt709 -an "$out" ;;
    rife)  # RIFE v4.x ncnn: Frames extrahieren → ×2.5 (24→60) → Lanczos-Upscale
      d="$WORK/rife-$c"; rm -rf "$d"; mkdir -p "$d/in" "$d/out"
      ffmpeg -hide_banner -loglevel error -i "$in" -vf "scale=$W_OUT:$H_OUT:flags=lanczos+accurate_rnd,unsharp=5:5:0.4" "$d/in/%05d.png"
      rife-ncnn-vulkan -i "$d/in" -o "$d/out" -m rife-v4.6 -n $(( $(ls "$d/in" | wc -l) * FPS_OUT / 24 )) -f %05d.png -u
      ffmpeg -hide_banner -loglevel error -framerate $FPS_OUT -i "$d/out/%05d.png" -c:v prores_ks -profile:v 3 -pix_fmt yuv422p10le \
        -color_primaries bt709 -color_trc bt709 -colorspace bt709 -an "$out"; rm -rf "$d" ;;
    ffmpeg) # Fallback ohne KI: minterpolate (MCI, bidirektional, VSBMC) — brauchbar für langsame Dolly-Fahrten
      # Zwischenformat hier H.264 qp6 (quasi verlustfrei, 4× schneller als ProRes auf CPU-Kisten)
      ffmpeg -hide_banner -loglevel error ${TRIM:+-t $TRIM} -i "$in" -vf "minterpolate=fps=$FPS_OUT:mi_mode=mci:mc_mode=obmc:me_mode=bilat:me=hexbs:search_param=16:scd=none,\
scale=$W_OUT:$H_OUT:flags=lanczos+accurate_rnd,unsharp=5:5:0.35:5:5:0,format=yuv420p" \
        -c:v libx264 -preset ultrafast -qp 6 -color_primaries bt709 -color_trc bt709 -colorspace bt709 -an "$out" ;;
  esac; done; }

# ---------- 2. LUT auf Master (Korn kommt aus dem Encoder [AV1 film-grain] bzw. .grain-Overlay im CSS — nie einbacken: kostet WebP/H.264 ~3× Bytes) ---
lut(){ for c in $(pick "${1:-}"); do
  in="$WORK/master/$c.mov"; out="$WORK/master/$c.lut.mov"; [[ -f "$out" && -z "${FORCE:-}" ]] && continue
  log "lut $c"; ffmpeg -hide_banner -loglevel error -y -i "$in" -vf "lut3d=file=$LUT:interp=tetrahedral,format=yuv420p" \
    -c:v libx264 -preset ultrafast -qp 6 -color_primaries bt709 -color_trc bt709 -colorspace bt709 -an "$out"; done; }

# ---------- 3. Flug-Segmente: forward + reverse, auf FLY_DUR s gestaucht, easeInOut eingebacken ----------------
# Der Autopilot (film.js startFlight) fährt p linear in FLY_DUR s und zeichnet frame=lerp(easeIO(p)). Das Video muss
# dieselbe Zeitkurve haben: t_src = 8·easeIO(t/FLY_DUR). Rückflug = eigene Datei (Browser spielen nicht rückwärts).
# Teilflüge starten bei currentTime = p0/CAM·FLY_DUR (siehe film.js VideoFlight).
FLY_DUR="${FLY_DUR:-2.2}"
segments(){ for c in $(pick "${1:-}"); do
  m="$WORK/master/$c.lut.mov"; log "segments $c (FLY_DUR=$FLY_DUR)"
  D=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$m")
  # setpts: neue Zeit t' aus Quellzeit T: t' = FLY_DUR·easeIO⁻¹(T/D). Einfacher: Quelle auf 60·FLY_DUR Frames
  # neu abtasten, indem wir die Quell-Zeitachse mit easeIO⁻¹ verzerren — ffmpeg kann nur t'(T), also invertieren
  # wir numerisch (glatt, monoton) in Python und schreiben ein Frame-Mapping.
  python3 - "$m" "$WORK/seg/$c" "$D" "$FLY_DUR" "$FPS_OUT" <<'PY'
import sys, subprocess, math, os
m, base, D, FD, fps = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4]), int(sys.argv[5])
n = round(FD * fps)                                   # Zielframes (132 bei 2.2 s)
ease = lambda t: 2*t*t if t < .5 else 1 - (-2*t+2)**2/2
# Ziel-Frame k (Zeit k/fps) zeigt Quellzeit D·easeIO(k/n): select-Filter mit expr ist träge -> wir schreiben
# eine concat-Liste aus Einzelframes (PNG) — exakt, 132 Frames, kein Interpolationsfehler.
import tempfile, os, shutil
tmp = tempfile.mkdtemp(); subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',m,'-fps_mode','passthrough',f'{tmp}/%05d.png'],check=True)
src = sorted(os.listdir(tmp)); N = len(src)
for direction in (('fwd',) if os.environ.get('ONLY_FWD') else ('fwd','rev')):
    out = f'{base}.{direction}.mov'; lst = f'{tmp}/{direction}.txt'
    with open(lst,'w') as f:
        for k in range(n):
            u = ease(k/(n-1)); j = min(N-1, round(u*(N-1))); j = j if direction=='fwd' else N-1-j
            f.write(f"file '{tmp}/{src[j]}'\nduration {1/fps:.6f}\n")
        f.write(f"file '{tmp}/{src[N-1] if direction=='fwd' else src[0]}'\n")
    subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',lst,'-r',str(fps),'-frames:v',str(n),
                    '-c:v','prores_ks','-profile:v','3','-pix_fmt','yuv422p10le','-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709','-an',out],check=True)
    print(direction, out, n, 'frames')
shutil.rmtree(tmp)
PY
done; }

# ---------- 4. Multi-Codec-Encode (AV1 / HEVC hvc1 / H.264 High 4.2), GOP 30 (0.5 s), kein Audio -----------
encode_one(){ local in="$1" base="$2"
  # AV1 — Chrome/Firefox/Android. preset 5 = Qualität/Zeit-Balance, film-grain=8 synthetisiert Korn (spart Bits)
  enc libsvtav1 && ffmpeg -hide_banner -loglevel error -y -i "$in" -c:v libsvtav1 -preset 5 -crf 30 -g 30 -pix_fmt yuv420p10le \
    -svtav1-params "tune=0:film-grain=8:film-grain-denoise=0:enable-overlays=1:scd=0:keyint=30" \
    -color_primaries bt709 -color_trc bt709 -colorspace bt709 -movflags +faststart -an "$base.av1.mp4"
  # HEVC — Safari/iOS/macOS. hvc1-Tag Pflicht, 8-bit Main für breite HW-Decodierung
  enc libx265 && ffmpeg -hide_banner -loglevel error -y -i "$in" -c:v libx265 -preset slow -crf 22 -tag:v hvc1 -pix_fmt yuv420p \
    -x265-params "keyint=30:min-keyint=30:scenecut=0:aq-mode=3:psy-rd=1.5:rc-lookahead=60:bframes=4:no-open-gop=1:colorprim=bt709:transfer=bt709:colormatrix=bt709" \
    -movflags +faststart -an "$base.hevc.mp4"
  # H.264 — universeller Fallback. High 4.2, CRF 20, tune film, GOP 30, closed GOP, faststart
  enc libx264 && ffmpeg -hide_banner -loglevel error -y -i "$in" -c:v libx264 -preset slow -crf 21 -profile:v high -level 4.2 -tune film -pix_fmt yuv420p \
    -g 30 -keyint_min 30 -sc_threshold 0 -bf 3 -x264-params "open-gop=0:aq-mode=3:psy-rd=1.0,0.15" \
    -color_primaries bt709 -color_trc bt709 -colorspace bt709 -movflags +faststart -an "$base.h264.mp4"; return 0; }
encode(){ for c in $(pick "${1:-}"); do for d in fwd rev; do
  log "encode $c.$d"; encode_one "$WORK/seg/$c.$d.mov" "$OUT/v/$c.$d"; done; done
  ( cd "$OUT/v" && ls -l *.mp4 | awk '{printf "%-28s %6.1f MB\n",$9,$5/1048576}' ); }

# ---------- 5. Scrub-Frames aus DEMSELBEN Master (kein Codec-Versatz zum Video) ---------------------------
# 12 fps × 8 s = 96 Frames/Clip (v9: 8 fps/64). f2/ = 1920 WebP q80, f/ = 1280 WebP q78 (Retina-Kappe DPR 2).
scrub(){ local fps="${SCRUB_FPS:-12}"; for c in $(pick "${1:-}"); do
  m="$WORK/master/$c.lut.mov"; log "scrub $c @${fps}fps"
  # Ohne Master (FROM_SRC=1): direkt aus dem 24-fps-Original (12 teilt 24 → identische Momente wie im Video), gleiche Skalierung + LUT
  if [[ -n "${FROM_SRC:-}" || ! -f "$m" ]]; then m="$SRC/v6-$c.mp4"; pre="scale=$W_OUT:$H_OUT:flags=lanczos+accurate_rnd,unsharp=5:5:0.35:5:5:0,lut3d=file=$LUT:interp=tetrahedral,"; else pre=""; fi
  ffmpeg -hide_banner -loglevel error -y -i "$m" -vf "${pre}fps=$fps,scale=1920:-2:flags=lanczos" -c:v libwebp -quality 74 -preset picture -compression_level 6 "$WORK/scrub/$c.1920.%04d.webp"
  ffmpeg -hide_banner -loglevel error -y -i "$m" -vf "${pre}fps=$fps,scale=1280:-2:flags=lanczos,unsharp=3:3:0.25" -c:v libwebp -quality 72 -preset picture -compression_level 6 "$WORK/scrub/$c.1280.%04d.webp"
  ffmpeg -hide_banner -loglevel error -y -i "$m" -vf "${pre}fps=$fps,scale=960:-2:flags=lanczos,unsharp=3:3:0.2" -c:v libwebp -quality 66 -preset picture -compression_level 6 "$WORK/scrub/$c.960.%04d.webp"
done
  # Globale Nummerierung wie data.js (Clip-Reihenfolge, fortlaufend) + Stop-Frames (letzter Frame je Clip)
  python3 - "$WORK/scrub" "$OUT" "$fps" <<'PY'
import sys, os, glob, shutil, json
src, out, fps = sys.argv[1], sys.argv[2], int(sys.argv[3])
order = ['c1-kueche','c2-flur','c3-bad','c4-schlaf','c5-wohnen','c6-eingang','c7-rohbau']
idx = {}; n = 0
for c in order:
    fr = sorted(glob.glob(f'{src}/{c}.1920.*.webp')); lo = sorted(glob.glob(f'{src}/{c}.1280.*.webp')); ll = sorted(glob.glob(f'{src}/{c}.960.*.webp'))
    if not fr: continue
    start = n
    for a, b, d in zip(fr, lo, ll):
        shutil.copy(a, f'{out}/f2/f{n:04d}.webp'); shutil.copy(b, f'{out}/f/f{n:04d}.webp'); shutil.copy(d, f'{out}/fl/f{n:04d}.webp'); n += 1
    idx[c] = {'start': start, 'end': n - 1}
json.dump({'frames': n, 'fps': fps, 'clips': idx}, open(f'{out}/frames.json', 'w'), indent=1)
print('frames', n, idx)
PY
}

# ---------- 6. Intro (C1, auf INTRO_DUR s gestaucht, easeIO eingebacken, 60 fps; CRF etwas höher: kritischer Pfad) ------
INTRO_DUR="${INTRO_DUR:-3.4}"
intro(){ m="$WORK/master/c1-kueche.lut.mov"; log "intro (INTRO_DUR=$INTRO_DUR)"
  # segments() schreibt immer auf den kanonischen c1-Namen. Das reguläre 2.2-s-Referenzsegment sichern,
  # damit ein nachfolgender VMAF-Lauf weiterhin exakt den Flight-Encode statt den 3.4-s-Intro vergleicht.
  keep="$WORK/seg/c1-kueche.fwd.flight.mov"; [[ -f "$WORK/seg/c1-kueche.fwd.mov" ]] && mv "$WORK/seg/c1-kueche.fwd.mov" "$keep"
  FLY_DUR="$INTRO_DUR" ONLY_FWD=1 segments c1-kueche; mv "$WORK/seg/c1-kueche.fwd.mov" "$WORK/seg/intro.mov"
  enc libx265 && ffmpeg -hide_banner -loglevel error -y -i "$WORK/seg/intro.mov" -c:v libx265 -preset slow -crf 24 -tag:v hvc1 -pix_fmt yuv420p \
    -x265-params "keyint=30:min-keyint=30:scenecut=0:no-open-gop=1" -movflags +faststart -an "$OUT/intro.hevc.mp4"
  enc libx264 && ffmpeg -hide_banner -loglevel error -y -i "$WORK/seg/intro.mov" -c:v libx264 -preset slow -crf 22 -profile:v high -level 4.2 -tune film -pix_fmt yuv420p \
    -g 30 -keyint_min 30 -sc_threshold 0 -movflags +faststart -an "$OUT/intro.h264.mp4"
  enc libsvtav1 && ffmpeg -hide_banner -loglevel error -y -i "$WORK/seg/intro.mov" -c:v libsvtav1 -preset 5 -crf 40 -g 30 -pix_fmt yuv420p10le \
    -svtav1-params "tune=0:film-grain=0:enable-overlays=1:scd=0:keyint=30" -color_primaries bt709 -color_trc bt709 -colorspace bt709 \
    -movflags +faststart -an "$OUT/intro.av1.mp4"
  ffmpeg -hide_banner -loglevel error -y -sseof -0.05 -i "$WORK/seg/intro.mov" -frames:v 1 -update 1 -q:v 2 "$OUT/intro-hold.jpg"   # Hold aus demselben Master (Naht-Fix C.2)
  ffmpeg -hide_banner -loglevel error -y -i "$WORK/seg/intro.mov" -frames:v 1 -update 1 -q:v 3 -vf scale=1920:-2 "$OUT/poster.jpg"
  rm -f "$WORK/seg/intro.mov"; [[ -f "$keep" ]] && mv "$keep" "$WORK/seg/c1-kueche.fwd.mov"; return 0; }

# ---------- 7. VMAF gegen Master (Ziel ≥ 93) ----------------------------------------------------------------
vmaf(){ for c in $(pick "${1:-}"); do for codec in av1 hevc h264; do
  f="$OUT/v/$c.fwd.$codec.mp4"; [[ -f "$f" ]] || continue
  s=$(ffmpeg -hide_banner -i "$f" -i "$WORK/seg/$c.fwd.mov" -lavfi "[0:v]scale=1920:1080:flags=bicubic[a];[1:v]scale=1920:1080:flags=bicubic[b];[a][b]libvmaf=model=version=vmaf_v0.6.1:n_threads=8" -f null - 2>&1 | grep -o 'VMAF score: [0-9.]*' | awk '{print $3}')
  printf '%-22s %-5s VMAF %s\n' "$c" "$codec" "${s:-n/a}"; done; done; }

# ---------- 8. Ein Clip komplett, Zwischenprodukte danach löschen (wenig Platz) ---------------------------
clip(){ c="$1"; upscale "$c"; lut "$c"; segments "$c"; encode "$c"; scrub_one "$c"; [[ "$c" == c1-kueche ]] && intro; rm -f "$WORK/master/$c"*.mov "$WORK/seg/$c"*.mov; }
scrub_one(){ SCRUB_ONE=1 scrub "$1"; }

case "${1:-all}" in
  clip) clip "${2:?clip}";;
  upscale) upscale "${2:-}";; lut) lut "${2:-}";; segments) segments "${2:-}";; encode) encode "${2:-}";;
  scrub) scrub "${2:-}";; intro) intro;; vmaf) vmaf "${2:-}";;
  all) upscale; lut; segments; encode; scrub; intro; vmaf;;
  *) echo "usage: $0 {upscale|lut|segments|encode|scrub|intro|vmaf|all} [clip]"; exit 1;;
esac
