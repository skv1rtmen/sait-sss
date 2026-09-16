#!/usr/bin/env python3
"""Mesh-warp the AI empty-room floor line back onto the production plate."""
import argparse
import cv2
import numpy as np


def read_image(path):
    return cv2.imdecode(np.fromfile(path, dtype=np.uint8), cv2.IMREAD_COLOR)


def write_webp(path, image):
    ok, data = cv2.imencode(".webp", image, [cv2.IMWRITE_WEBP_QUALITY, 92])
    if not ok:
        raise SystemExit("Could not encode output")
    data.tofile(path)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("input")
    ap.add_argument("output")
    args = ap.parse_args()
    im = read_image(args.input)
    h, w = im.shape[:2]
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    taper = np.clip((950.0 - xx) / 180.0, 0.0, 1.0)
    source_line = 500.0 - 0.020 * xx
    target_line = 590.0 - 0.040 * xx
    target_line = source_line + (target_line - source_line) * taper
    upper = yy <= target_line
    map_y = np.empty_like(yy)
    map_y[upper] = yy[upper] * source_line[upper] / np.maximum(target_line[upper], 1.0)
    map_y[~upper] = source_line[~upper] + (yy[~upper] - target_line[~upper]) * (h - source_line[~upper]) / np.maximum(h - target_line[~upper], 1.0)
    out = cv2.remap(im, xx, map_y, cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REFLECT)
    write_webp(args.output, out)


if __name__ == "__main__":
    main()
