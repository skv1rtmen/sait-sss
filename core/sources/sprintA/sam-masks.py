#!/usr/bin/env python3
"""
SAM-2 Layer-Masken für die Szene «Vorher/Nachher» (4 Schichten: walls / floor / furniture / light).

Pipeline
  1. Grounding DINO (Text → Boxen) für semantische Klassen, SAM-2 (Box → Maske) für exakte Kanten.
     Ohne GroundingDINO: Boxen per --boxes JSON übergeben (x0,y0,x1,y1 in Pixeln des Bildes).
  2. Nachbearbeitung: kleine Inseln entfernen, Löcher füllen, Feather (Gauss), Prioritätsordnung
     furniture > light > floor > walls (jedes Pixel gehört genau einer Schicht, Übergänge 8–18 px weich).
  3. Export: PNG RGBA 1920 px (Alpha = Maske), plus Preview-Overlay + JSON mit Flächenanteilen.

Aufruf
  pip install torch torchvision "git+https://github.com/facebookresearch/sam2.git" groundingdino-py opencv-python
  python3 sam-masks.py after-1920.jpg out/ --ckpt sam2.1_hiera_large.pt --cfg configs/sam2.1/sam2.1_hiera_l.yaml
  python3 sam-masks.py after-1920.jpg out/ --boxes boxes.json        # ohne GroundingDINO

Klassen-Prompts (GroundingDINO): siehe PROMPTS unten — für jedes Layer mehrere Synonyme, Box-Threshold 0.32.
"""
import argparse, json, os, sys
import numpy as np, cv2

PROMPTS = {
    'furniture': ['table', 'chair', 'sofa', 'shelf', 'picture frame', 'vase', 'plant', 'pendant lamp', 'rug', 'sink', 'toilet', 'bathtub', 'mirror', 'cabinet'],
    'light':     ['window', 'curtain', 'lamp light', 'led strip'],
    'floor':     ['floor', 'parquet', 'tiles floor'],
    'walls':     ['wall', 'ceiling', 'door'],
}
ORDER = ['furniture', 'light', 'floor', 'walls']      # Priorität bei Überlappung
FEATHER = {'furniture': 6, 'light': 14, 'floor': 10, 'walls': 12}

def load_sam(ckpt, cfg):
    import torch
    from sam2.build_sam import build_sam2
    from sam2.sam2_image_predictor import SAM2ImagePredictor
    dev = 'cuda' if torch.cuda.is_available() else 'cpu'
    return SAM2ImagePredictor(build_sam2(cfg, ckpt, device=dev))

def ground_boxes(img_rgb, prompts, box_thr=0.32, text_thr=0.25):
    """Grounding DINO: Textprompts → Boxen (xyxy Pixel). Gibt {layer: [boxes]} zurück."""
    from groundingdino.util.inference import load_model, predict
    import torch, torchvision.transforms as T
    model = load_model('GroundingDINO_SwinT_OGC.py', 'groundingdino_swint_ogc.pth')
    H, W = img_rgb.shape[:2]
    tf = T.Compose([T.ToTensor(), T.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])])
    t = tf(img_rgb)
    out = {}
    for layer, words in prompts.items():
        boxes, logits, phrases = predict(model=model, image=t, caption=' . '.join(words) + ' .', box_threshold=box_thr, text_threshold=text_thr)
        b = boxes.numpy() * np.array([W, H, W, H])       # cxcywh → xyxy
        xyxy = np.stack([b[:, 0] - b[:, 2] / 2, b[:, 1] - b[:, 3] / 2, b[:, 0] + b[:, 2] / 2, b[:, 1] + b[:, 3] / 2], 1)
        out[layer] = xyxy.tolist()
    return out

def masks_from_boxes(predictor, img_rgb, boxes):
    predictor.set_image(img_rgb)
    H, W = img_rgb.shape[:2]
    m = np.zeros((H, W), np.uint8)
    for b in boxes:
        masks, scores, _ = predictor.predict(box=np.array(b, np.float32), multimask_output=True)
        m |= (masks[int(np.argmax(scores))] > 0).astype(np.uint8)
    return m * 255

def clean(m, min_area=1200, close=9):
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (close, close))
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, k)
    n, lab, stats, _ = cv2.connectedComponentsWithStats(m, 8)
    keep = np.zeros_like(m)
    for i in range(1, n):
        if stats[i, cv2.CC_STAT_AREA] >= min_area: keep[lab == i] = 255
    # Löcher füllen
    inv = cv2.bitwise_not(keep); n, lab, stats, _ = cv2.connectedComponentsWithStats(inv, 8)
    for i in range(1, n):
        if stats[i, cv2.CC_STAT_AREA] < min_area * 2: keep[lab == i] = 255
    return keep

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('image'); ap.add_argument('out')
    ap.add_argument('--ckpt', default='sam2.1_hiera_large.pt'); ap.add_argument('--cfg', default='configs/sam2.1/sam2.1_hiera_l.yaml')
    ap.add_argument('--boxes', help='JSON {layer:[[x0,y0,x1,y1],...]} statt GroundingDINO')
    ap.add_argument('--width', type=int, default=1920)
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    bgr = cv2.imread(a.image); H0, W0 = bgr.shape[:2]
    if W0 != a.width:
        bgr = cv2.resize(bgr, (a.width, round(H0 * a.width / W0)), interpolation=cv2.INTER_LANCZOS4)
    rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB); H, W = rgb.shape[:2]
    boxes = json.load(open(a.boxes)) if a.boxes else ground_boxes(rgb, PROMPTS)
    json.dump(boxes, open(f'{a.out}/boxes.json', 'w'), indent=1)
    predictor = load_sam(a.ckpt, a.cfg)
    raw = {l: clean(masks_from_boxes(predictor, rgb, boxes.get(l, []))) for l in ORDER}
    # walls = Rest (alles, was keine andere Schicht ist) — robust gegen DINO-Lücken
    rest = np.full((H, W), 255, np.uint8)
    for l in ORDER[:-1]: rest[raw[l] > 0] = 0
    raw['walls'] = cv2.bitwise_or(raw['walls'], rest)
    # Exklusivität nach Priorität, dann Feather
    taken = np.zeros((H, W), np.uint8); final = {}
    for l in ORDER:
        m = cv2.bitwise_and(raw[l], cv2.bitwise_not(taken)); taken |= m
        final[l] = cv2.GaussianBlur(m, (0, 0), FEATHER[l])
    report = {}
    prev = bgr.copy()
    colors = {'furniture': (107, 74, 226), 'light': (122, 226, 246), 'floor': (74, 160, 226), 'walls': (226, 144, 74)}
    for l in ORDER:
        cv2.imwrite(f'{a.out}/{l}.png', np.dstack([np.full((H, W, 3), 255, np.uint8), final[l]]))
        report[l] = round(float((final[l] > 127).mean()), 4)
        col = np.full((H, W, 3), colors[l], np.uint8)
        prev = (prev * (1 - final[l][..., None] / 255 * .45) + col * (final[l][..., None] / 255 * .45)).astype(np.uint8)
    cv2.imwrite(f'{a.out}/preview.jpg', prev, [cv2.IMWRITE_JPEG_QUALITY, 88])
    json.dump(report, open(f'{a.out}/report.json', 'w'), indent=1)
    print('Flächenanteile:', report)

if __name__ == '__main__': main()
