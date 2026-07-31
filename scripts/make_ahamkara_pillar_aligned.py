#!/usr/bin/env python3
"""T96 L3 (owner ruling: OPTION D — derived aligned asset; T95 precedent). Center the fire's ORIGIN (its baked
base POOL) on the seal ring's center, both axes.

Alignment is NOT derived from sprite metadata (that missed — the pool is asymmetric). It is found by a CLOSED
LOOP on the COMPOSITED output (the T93 law): render the ring and the pillar ALONE at f10, measure the ring's
lit-pixel centroid and the pillar POOL's centroid (bottom 12% of lit content), and adjust the shift until they
coincide within 2% of the cell. That loop lives in tools/ahamkara_align_loop.py; the CONVERGED shift is baked
into SHIFT_DX/SHIFT_DY below, and this script applies it deterministically (no rng). Source sprite untouched.

Run: python3 scripts/make_ahamkara_pillar_aligned.py
"""
import os
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LDIR = os.path.join(ROOT, "assets/vfx/layers/ahamkara")
PILL = os.path.join(LDIR, "ahamkara_pillar.png")
OUT  = os.path.join(LDIR, "ahamkara_pillar_aligned.png")

# CONVERGED by the closed loop (tools/ahamkara_align_loop.py) — shift applied to the raw pillar sprite (px).
# f10 composited: ring centroid (562,1052) ↔ pool centroid (562,1050), error (0.0%, 0.2%) of cell.
SHIFT_DX = -87
SHIFT_DY = -150

def build(dx=SHIFT_DX, dy=SHIFT_DY, save=True):
    src = np.asarray(Image.open(PILL).convert("RGB"))
    Hp, Wp = src.shape[:2]
    out = np.zeros_like(src)
    sy0, sy1 = max(0, -dy), min(Hp, Hp - dy); dy0 = sy0 + dy
    sx0, sx1 = max(0, -dx), min(Wp, Wp - dx); dx0 = sx0 + dx
    out[dy0:dy0 + (sy1 - sy0), dx0:dx0 + (sx1 - sx0)] = src[sy0:sy1, sx0:sx1]
    if save:
        Image.fromarray(out).save(OUT)
    return out

if __name__ == "__main__":
    build()
    print(f"wrote {OUT}  shift dx={SHIFT_DX} dy={SHIFT_DY} (converged on the composited f10 pool↔ring centroids)")
