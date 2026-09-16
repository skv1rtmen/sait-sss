#!/usr/bin/env python3
"""Align an AI edit to the production plate using feature matches in unchanged regions."""
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
    ap.add_argument("reference")
    ap.add_argument("generated")
    ap.add_argument("output")
    args = ap.parse_args()

    ref = read_image(args.reference)
    gen = read_image(args.generated)
    if ref is None or gen is None:
        raise SystemExit("Could not read an input image")

    sift = cv2.SIFT_create(nfeatures=6000)
    kr, dr = sift.detectAndCompute(cv2.cvtColor(ref, cv2.COLOR_BGR2GRAY), None)
    kg, dg = sift.detectAndCompute(cv2.cvtColor(gen, cv2.COLOR_BGR2GRAY), None)
    pairs = cv2.BFMatcher().knnMatch(dg, dr, k=2)
    good = [m for m, n in pairs if m.distance < 0.72 * n.distance]
    if len(good) < 12:
        raise SystemExit(f"Not enough feature matches: {len(good)}")

    src = np.float32([kg[m.queryIdx].pt for m in good]).reshape(-1, 1, 2)
    dst = np.float32([kr[m.trainIdx].pt for m in good]).reshape(-1, 1, 2)
    H, inliers = cv2.findHomography(src, dst, cv2.RANSAC, 4.0)
    if H is None:
        raise SystemExit("Homography failed")
    aligned = cv2.warpPerspective(gen, H, (ref.shape[1], ref.shape[0]), flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REFLECT)
    warp = np.eye(2, 3, dtype=np.float32)
    try:
        score, warp = cv2.findTransformECC(
            cv2.GaussianBlur(cv2.cvtColor(ref, cv2.COLOR_BGR2GRAY), (0, 0), 4).astype(np.float32) / 255,
            cv2.GaussianBlur(cv2.cvtColor(aligned, cv2.COLOR_BGR2GRAY), (0, 0), 4).astype(np.float32) / 255,
            warp, cv2.MOTION_EUCLIDEAN,
            (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 200, 1e-5), None, 5)
        aligned = cv2.warpAffine(aligned, warp, (ref.shape[1], ref.shape[0]), flags=cv2.INTER_LANCZOS4 | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REFLECT)
    except cv2.error:
        score = 0.0
    write_webp(args.output, aligned)
    print({"matches": len(good), "inliers": int(inliers.sum()), "ecc": round(float(score), 3), "size": [ref.shape[1], ref.shape[0]]})


if __name__ == "__main__":
    main()
