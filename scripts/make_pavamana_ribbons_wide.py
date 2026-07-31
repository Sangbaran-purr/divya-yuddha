#!/usr/bin/env python3
"""T95 L3 (owner ruling: OPTION D — derived layer, no new compositor vocabulary).

DETERMINISTIC pre-process (NO rng, fixed placements → reproducible): composite pavamana_ribbons_wide.png
from the committed pavamana_ribbons.png. Three copies of the source curl-set at 20/50/80% x on a 2:1 canvas
(matching the band class), baselines aligned LOW (bottom-anchored — the impurity rises from the row),
scaled so each curl-set reads at roughly the height the original does in a single cell, MAX composite on
true black (overlaps don't over-brighten). The SOURCE sprite is untouched. The compositor then renders
pavamana_ribbons_wide as ONE xform layer (unified rise — a chant breathes together).

Run: python3 scripts/make_pavamana_ribbons_wide.py   (idempotent; commit the output alongside the source)
"""
import os
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LDIR = os.path.join(ROOT, "assets/vfx/layers/pavamana")
SRC  = os.path.join(LDIR, "pavamana_ribbons.png")
OUT  = os.path.join(LDIR, "pavamana_ribbons_wide.png")

CW, CH = 1774, 887            # 2:1, matches the band class
XFRAC  = [0.20, 0.50, 0.80]   # three copies across the plate width
SCALE  = 0.62                 # each curl-set ≈ its single-cell height; spread stays distinct
BASE_MARGIN = 175             # T95 item-6: lift the baselines 175px off the canvas bottom. Cover-fit to the 3:1 plate CROPS
                              # the wide sprite's bottom, so the plate's bottom edge maps to ~wide-y735 — the ribbons must be
                              # DARK there. Ending the curls above that row (still "low", ~lower fifth) keeps the plate bottom
                              # dark while the bodies rise from just above the row. NO rng — deterministic.

def main():
    src = Image.open(SRC).convert("RGB")
    sw, sh = src.size
    cp = np.asarray(src.resize((round(sw * SCALE), round(sh * SCALE)), Image.LANCZOS)).astype(np.uint8)
    ph, pw = cp.shape[:2]
    canvas = np.zeros((CH, CW, 3), np.uint8)
    for xf in XFRAC:
        cx = round(xf * CW)
        x0, y0 = cx - pw // 2, CH - BASE_MARGIN - ph         # centred at xf; baseline LOW (BASE_MARGIN off the bottom → plate-bottom stays dark)
        xs0, xs1 = max(0, x0), min(CW, x0 + pw)
        ys0, ys1 = max(0, y0), min(CH, y0 + ph)
        if xs1 <= xs0 or ys1 <= ys0:
            continue
        if ys1 <= ys0 or xs1 <= xs0:
            continue
        patch = cp[ys0 - y0:ys1 - y0, xs0 - x0:xs1 - x0]
        canvas[ys0:ys1, xs0:xs1] = np.maximum(canvas[ys0:ys1, xs0:xs1], patch)   # MAX composite on black
    Image.fromarray(canvas).save(OUT)
    print(f"wrote {OUT}  {CW}x{CH}  3 copies @ {XFRAC}  scale {SCALE}")

if __name__ == "__main__":
    main()
