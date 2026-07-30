#!/usr/bin/env python3
"""T93b — board-tile art derivatives via TEMPLATE-CROP (owner ruling: option C, PROVISIONAL).

Extracts the clean art window from the 1024x1536 framed finals in approved_masters/ (the Canva template
system) at fixed per-faction coordinates, then runs the T93-validated tile pipeline: top-biased cover-crop
to 3:4, 225x300, q92 JPEG bytes in a .png name, canonical stems, assets/board/.

PROVISIONAL LAW: `extract_art_window()` is the ONLY source-specific step. When the owner supplies raw
un-framed art, that art already IS the window — replace extract_art_window() with an identity (return im)
and change MASTERS; nothing else in the pipeline changes.

VARIANT TABLE (per-faction art window, native 1024x1536; STEP-0 measured via per-faction mean/std maps and
verified visually). The window clears: the top rarity tag (top=90), the LEFT faction crest (per-faction left
edge — Asura's crest is the widest at ~x340), the RIGHT gold frame border (per-faction right edge — Asura's
border is the thickest), and the text-anchored nameplate (bottom=850, safely above the highest nameplate).
  Devas   [168, 90, 985, 850]   Asuras [348, 90, 952, 850]
  Vanaras [298, 90, 985, 850]   Nagas  [308, 90, 978, 850]

STANDING STEM LAWS (carried from T93): the two epithet-baked Deva masters map long->short; Access_Torana is
skipped (frame element); The Setu Stones has no master -> skipped (render falls back to the framed card);
the Rakta token (Asura folder) is cut with the Asura window.
"""
import os, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MASTERS = "/Users/sangbaranchatterjee/Documents/Divya Yuddha — Card Game Production/approved_masters"
OUT = os.path.join(ROOT, "assets/board")
TW, TH = 225, 300                     # 3:4, 2x the desktop-max 112.5x150 slot
TOP_BIAS = 0.30                       # protect faces on any vertical crop
QUALITY = 92

# per-faction art window (L,T,R,B) in native 1024x1536 — the PROVISIONAL template coordinates
WINDOW = {
    "Devas":   (168, 140, 985, 850),
    "Asuras":  (348, 140, 952, 850),
    "Vanaras": (298, 140, 985, 850),
    "Nagas":   (308, 140, 978, 850),
}
EPITHET = {
    "Devas_Unit_SaranyuCloudMare_P5_rEpic": "Devas_Unit_Saranyu_P5_rEpic",
    "Devas_Unit_UshasDawnHerald_P3_rUncommon": "Devas_Unit_Ushas_P3_rUncommon",
}
SKIP = {"Access_Torana"}

def extract_art_window(im, faction):
    """PROVISIONAL SWAP-POINT: framed final -> clean art window at per-faction template coords.
    Replace with `return im` when the source is raw un-framed art."""
    if im.size != (1024, 1536):
        im = im.resize((1024, 1536), Image.LANCZOS)   # a few masters vary by a px; normalise to the template grid
    return im.crop(WINDOW[faction])

def cover_crop(im, tw, th, top_bias):
    w, h = im.size
    s = max(tw / w, th / h)
    nw, nh = round(w * s), round(h * s)
    r = im.resize((nw, nh), Image.LANCZOS)
    x = (nw - tw) // 2                         # horizontal: centred
    y = round((nh - th) * top_bias)            # vertical: top-biased (protect faces)
    return r.crop((x, y, x + tw, y + th))

def main():
    os.makedirs(OUT, exist_ok=True)
    wrote = 0; total = 0
    for faction in ["Devas", "Asuras", "Vanaras", "Nagas"]:
        d = os.path.join(MASTERS, faction)
        for f in sorted(os.listdir(d)):
            if not f.lower().endswith(".png"):
                continue
            stem = f[:-4]
            if stem in SKIP:
                continue
            out_stem = EPITHET.get(stem, stem)
            total += 1
            im = Image.open(os.path.join(d, f)).convert("RGB")
            win = extract_art_window(im, faction)          # PROVISIONAL step
            tile = cover_crop(win, TW, TH, TOP_BIAS)        # T93-validated pipeline
            tile.save(os.path.join(OUT, out_stem + ".png"), "JPEG", quality=QUALITY)
            wrote += 1
    print(f"board tiles written: {wrote} / {total} card masters (assets/board/, provisional template-crop)")

if __name__ == "__main__":
    main()
