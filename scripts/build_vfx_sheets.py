#!/usr/bin/env python3
# build_vfx_sheets.py — T68R flipbook pipeline (RERUNNABLE).
# A1: extract 24 evenly-spaced frames per clip @256px.
# A2: per frame — black-floor clamp (lum<12 -> 0) THEN F2 radial soft mask
#     (1.0 inside 70% radius, cosine ease to 0.0 by 98%; corners guaranteed 0).
# A3: pack 6x4 grid -> 1536x1024 JPEG-in-.png q85 into assets/vfx/game/sheets/.
# A4: apply the SAME clamp+mask to the 13 remaining still derivatives
#     (ring/shield/bloom/streak/lightning + aura_3) from their masters.
# Usage: python3 scripts/build_vfx_sheets.py   (run from repo root)
import os, sys, math
import numpy as np
from PIL import Image
import imageio.v2 as imageio

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CLIPS = os.path.join(ROOT, "assets/vfx/clips")
MASTERS = os.path.join(ROOT, "assets/vfx")
SHEETS = os.path.join(ROOT, "assets/vfx/game/sheets")
GAME = os.path.join(ROOT, "assets/vfx/game")
os.makedirs(SHEETS, exist_ok=True)

FRAMES = 24
CELL = 256
COLS, ROWS = 6, 4
Q = int(os.environ.get("SHEET_Q", "85"))
CLIP_EFFECTS = ["aura_1","aura_2","smoke_1","smoke_2","surge_1","surge_2","venom_1","venom_2"]
A4_STILLS = ["ring_1","ring_2","shield_1","shield_2","bloom_1","bloom_2",
             "streak_1","streak_2","lightning_1","lightning_2","lightning_3","lightning_4","aura_3"]

# --- F2 radial soft mask, precomputed for a CELL x CELL frame ---
def radial_mask(n):
    yy, xx = np.mgrid[0:n, 0:n]
    cx = cy = (n - 1) / 2.0
    r = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / (n / 2.0)   # 0 at center, 1 at edge midpoint, ~1.41 at corner
    m = np.ones_like(r, dtype=np.float32)
    ease = (r > 0.70) & (r < 0.98)
    m[ease] = 0.5 * (1 + np.cos(math.pi * (r[ease] - 0.70) / (0.98 - 0.70)))   # cosine 1 -> 0
    m[r >= 0.98] = 0.0
    return m[..., None]  # HxWx1
MASK = radial_mask(CELL)

def treat(rgb):  # clamp black floor then radial mask (additive-safe: edges -> pure black)
    a = rgb.astype(np.float32)
    lum = a.max(axis=2)
    a[lum < 12] = 0
    a = a * MASK
    return np.clip(a, 0, 255).astype(np.uint8)

def build_sheet(effect):
    path = os.path.join(CLIPS, f"vfx_{effect}_clip.mp4")
    rd = imageio.get_reader(path)
    n = rd.count_frames()
    if not n or n == float("inf"):
        frames_all = [f for f in rd]; n = len(frames_all)
        pick = [frames_all[min(n-1, round(i*(n-1)/(FRAMES-1)))] for i in range(FRAMES)]
    else:
        idx = [min(n-1, round(i*(n-1)/(FRAMES-1))) for i in range(FRAMES)]
        pick = [rd.get_data(j) for j in idx]
    rd.close()
    sheet = Image.new("RGB", (COLS*CELL, ROWS*CELL), (0,0,0))
    for i, fr in enumerate(pick):
        im = Image.fromarray(fr[:, :, :3]).convert("RGB").resize((CELL, CELL), Image.LANCZOS)
        t = treat(np.asarray(im))
        sheet.paste(Image.fromarray(t, "RGB"), ((i % COLS)*CELL, (i // COLS)*CELL))
    out = os.path.join(SHEETS, f"vfx_{effect}.png")
    sheet.save(out, "JPEG", quality=Q)
    return os.path.getsize(out)

def mask_still(name):
    src = os.path.join(MASTERS, f"vfx_{name}.png")
    im = Image.open(src).convert("RGB").resize((512, 512), Image.LANCZOS)
    a = np.asarray(im).astype(np.float32)
    lum = a.max(axis=2); a[lum < 12] = 0
    m = radial_mask(512)
    a = np.clip(a * m, 0, 255).astype(np.uint8)
    out = os.path.join(GAME, f"vfx_{name}.png")
    Image.fromarray(a, "RGB").save(out, "JPEG", quality=85)
    return os.path.getsize(out)

if __name__ == "__main__":
    tot = 0
    print("=== A1-A3: sheets (6x4, 1536x1024, q%d) ===" % Q)
    for e in CLIP_EFFECTS:
        sz = build_sheet(e); tot += sz
        print(f"  vfx_{e}.png  {sz/1024:.0f}KB")
    print(f"  TOTAL sheet payload: {tot/1048576:.2f}MB  (8MB hard ceiling)")
    if tot > 8*1048576:
        print("  *** OVER 8MB CEILING — rerun with SHEET_Q=80 or FRAMES=20 ***"); sys.exit(1)
    print("=== A4: radial-mask the 13 remaining stills ===")
    for s in A4_STILLS:
        sz = mask_still(s); print(f"  vfx_{s}.png  {sz/1024:.0f}KB")
    print("DONE")
