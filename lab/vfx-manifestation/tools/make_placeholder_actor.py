#!/usr/bin/env python3
# tools/make_placeholder_actor.py — VFX-LAB-3. A PLACEHOLDER actor, cut from the card art, so the director and the stage run
# end to end before any Kling frame exists. NOT a performance: one painted pose, hand-traced, turned into 5 posed cells.
# LAB-4: the real Meghnad actor (tools/make_actor_from_clip.py) replaced it in actors/meghnad/; this tool stays as the pattern for
# a card that has no clip yet, and writes to actors/_placeholder/<card>/ so it can never overwrite a real actor.
#
#   python3 lab/vfx-manifestation/tools/make_placeholder_actor.py
#
# Reads the lab's own art copy (art/Asuras_Unit_Meghnad_P6_rRare.png); writes actors/meghnad/atlas.webp + manifest.json in
# the ACTOR asset class of ruling A4: real alpha (straight), normal blending, NO vignette, trimmed rectangular cells with
# pivot data (the feet), cells at most 512 px, NO motion vectors. Deterministic: same art in, same atlas out.
# Tools: Pillow + NumPy only (already present). The matting venv of A6 is LAB-4's step; this is a traced silhouette.
import json, math, os, sys
from PIL import Image, ImageDraw, ImageFilter

LAB = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(LAB, "art", "Asuras_Unit_Meghnad_P6_rRare.png")
OUT = os.path.join(LAB, "actors", "_placeholder", "meghnad")   # LAB-4: the real actor lives in actors/meghnad/; the placeholder pattern writes beside it, never over it
CELL_MAX = 512
PAD = 2
# the silhouette, traced on the 750×1050 art: horse head → mane → rider, plume → shoulder → cape → tail → hind legs → front legs
BODY = [(268,210),(292,222),(318,238),(340,258),(372,262),(392,236),(404,196),(415,150),(432,118),(460,108),(474,132),(470,172),
        (488,196),(520,214),(548,244),(568,262),(610,262),(655,290),(700,318),(700,360),(676,420),(700,470),(660,468),(612,440),
        (600,478),(640,500),(684,540),(668,560),(620,548),(600,520),(590,560),(608,620),(640,690),(626,716),(590,712),(560,660),
        (520,620),(486,640),(478,690),(446,704),(420,690),(430,640),(432,590),(396,572),(372,612),(346,642),(312,640),(300,616),
        (330,590),(356,556),(330,540),(292,600),(262,628),(232,622),(236,590),(270,548),(292,500),(270,470),(250,430),(238,380),
        (246,340),(232,318),(226,292),(236,262),(252,232)]
SPEAR = [(458,436),(472,442),(622,98),(606,92)]      # the shaft, from below the rider's grip to the lit tip
FEET = (440.0, 712.0)                                   # the ground contact between the hooves: every cell's pivot
POSES = [  # name, rotation (degrees, + = counter-clockwise on screen), horizontal stretch about the feet
    ("rise",    -2.0, 1.00),
    ("stand",    0.0, 1.00),
    ("windup",  -9.0, 0.98),
    ("strike",  11.0, 1.06),
    ("recover",  3.0, 1.00),
]
PHASES = {"emerge": [0, 1], "act": [2, 3, 4], "fizzle": [4, 1]}

def cut():
    # the traced outline, then a colour key inside it: the painted storm behind the figure is lighter and bluer (or, below the
    # horse's belly, saturated red cloud) than the dark rider, horse and cape. Keep the figure, its warm armour highlights and the
    # magenta spear glow; drop the sky and the cloud. A soft ramp, a median to clear specks, a light blur for the edge.
    import numpy as np
    art = Image.open(SRC).convert("RGB")
    poly = Image.new("L", art.size, 0); d = ImageDraw.Draw(poly)
    d.polygon(BODY, fill=255); d.polygon(SPEAR, fill=255)
    spear = Image.new("L", art.size, 0); ImageDraw.Draw(spear).polygon(SPEAR, fill=255)
    a = np.asarray(art).astype(np.float32); r, g, b = a[..., 0], a[..., 1], a[..., 2]
    lum = 0.299 * r + 0.587 * g + 0.114 * b
    mx, mn = a.max(axis=2), a.min(axis=2); sat = (mx - mn) / np.maximum(mx, 1)
    ramp = lambda x, lo, hi: np.clip((x - lo) / (hi - lo), 0, 1)
    sky = ramp(b - r, 4, 22) * ramp(lum, 60, 95)                                  # blue-dominant storm sky and lightning haze
    grey = ramp(lum, 105, 150) * (1 - ramp(sat, 0.22, 0.4))                        # pale grey cloud
    yy = np.arange(a.shape[0])[:, None] * np.ones((1, a.shape[1]))
    below = ramp(yy, 540, 600)                                                     # the red cloud only surrounds the legs
    redcloud = below * ramp(r - g, 40, 90) * ramp(lum, 70, 110) * (1 - ramp(b - g, 30, 60))
    glow = ramp(r, 150, 200) * ramp(b, 110, 160) * (1 - ramp(g, 110, 150))         # the magenta spear current: always kept
    keep = np.clip(1 - np.maximum(np.maximum(sky, grey), redcloud) + glow, 0, 1)
    alpha = (np.asarray(poly).astype(np.float32) / 255.0) * keep
    alpha = np.maximum(alpha, (np.asarray(spear).astype(np.float32) / 255.0) * np.maximum(glow, 1 - np.maximum(sky, grey)))
    mask = Image.fromarray((alpha * 255).astype(np.uint8), "L").filter(ImageFilter.MedianFilter(5)).filter(ImageFilter.GaussianBlur(1.2))
    rgba = art.copy(); rgba.putalpha(mask)
    return rgba

def posed(rgba, angle, stretch):
    margin = 220                                        # room so a rotation about the feet never clips
    W, H = rgba.size
    big = Image.new("RGBA", (W + 2 * margin, H + 2 * margin), (0, 0, 0, 0)); big.paste(rgba, (margin, margin))
    px, py = FEET[0] + margin, FEET[1] + margin
    im = big.rotate(angle, resample=Image.BICUBIC, center=(px, py), expand=False)
    if stretch != 1.0:
        nw = int(round(im.width * stretch)); im = im.resize((nw, im.height), Image.LANCZOS); px *= stretch
    return im, px, py

def trim(im, px, py):
    # the visible pixels' box, grown to contain the pivot (a lunge can put the feet point just past the lowest hoof)
    x0, y0, x1, y1 = im.getchannel("A").point(lambda a: 255 if a > 8 else 0).getbbox()
    x0, y0 = min(x0, int(math.floor(px))), min(y0, int(math.floor(py)))
    x1, y1 = max(x1, int(math.ceil(px)) + 1), max(y1, int(math.ceil(py)) + 1)
    return im.crop((x0, y0, x1, y1)), px - x0, py - y0

def main():
    rgba = cut()
    raw = []
    for name, ang, st in POSES:
        im, px, py = posed(rgba, ang, st); raw.append((name, *trim(im, px, py)))
    top = max(max(c.width, c.height) for _, c, _, _ in raw)
    s = CELL_MAX / top                                  # ONE scale for every pose, so the actor never pops in size between cells
    cells = []
    for name, c, px, py in raw:
        w, h = max(1, round(c.width * s)), max(1, round(c.height * s))
        cells.append((name, c.resize((w, h), Image.LANCZOS), px * s, py * s))
    # shelf packing, rows up to 1536 px wide
    rows, x, y, rowh, placed = 1536, PAD, PAD, 0, []
    for name, c, px, py in cells:
        if x + c.width + PAD > rows: x, y, rowh = PAD, y + rowh + PAD, 0
        placed.append((name, c, x, y, px, py)); x += c.width + PAD; rowh = max(rowh, c.height)
    AW = max(p[2] + p[1].width for p in placed) + PAD; AH = max(p[3] + p[1].height for p in placed) + PAD
    atlas = Image.new("RGBA", (AW, AH), (0, 0, 0, 0))
    for name, c, x, y, px, py in placed: atlas.paste(c, (x, y), c)
    os.makedirs(OUT, exist_ok=True)
    atlas.save(os.path.join(OUT, "atlas.webp"), "WEBP", quality=88, method=6, exact=True)
    manifest = {
        "cardId": "meghnad", "class": "actor", "version": 1, "placeholder": True,
        "source": "PLACEHOLDER — traced from art/Asuras_Unit_Meghnad_P6_rRare.png (the lab's card art copy) by tools/make_placeholder_actor.py; not a Kling performance (LAB-4 replaces it)",
        "atlas": "atlas.webp", "atlasSize": {"w": AW, "h": AH},
        "alpha": "straight", "blend": "normal", "mv": False, "vignette": False, "cellMax": CELL_MAX,
        "fps": 10, "facing": "left", "mirror": True,
        "refHeight": max(c.height for _, c, _, _ in cells),
        "cells": [{"name": n, "x": x, "y": y, "w": c.width, "h": c.height, "pivot": {"x": round(px, 1), "y": round(py, 1)}} for n, c, x, y, px, py in placed],
        "phases": PHASES,
    }
    with open(os.path.join(OUT, "manifest.json"), "w") as f: json.dump(manifest, f, indent=2); f.write("\n")
    # a preview for the builder's eyes only (not in the repo): the cells over a checker, pivots marked
    prev = Image.new("RGBA", atlas.size, (40, 40, 40, 255)); pd = ImageDraw.Draw(prev)
    for i in range(0, AW, 24):
        for j in range(0, AH, 24):
            if (i // 24 + j // 24) % 2: pd.rectangle([i, j, i + 23, j + 23], fill=(62, 62, 62, 255))
    prev.alpha_composite(atlas); pd = ImageDraw.Draw(prev)
    for n, c, x, y, px, py in placed: pd.rectangle([x, y, x + c.width - 1, y + c.height - 1], outline=(0, 200, 255, 255)); pd.ellipse([x + px - 5, y + py - 5, x + px + 5, y + py + 5], outline=(255, 60, 60, 255), width=2)
    prev.convert("RGB").save(sys.argv[1] if len(sys.argv) > 1 else "/tmp/meghnad_placeholder_preview.png")
    print("atlas %dx%d · %d cells · largest %dpx · %.1f KB" % (AW, AH, len(cells), max(max(c.width, c.height) for _, c, _, _ in cells), os.path.getsize(os.path.join(OUT, "atlas.webp")) / 1024))

if __name__ == "__main__":
    main()
