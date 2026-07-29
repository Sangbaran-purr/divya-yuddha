#!/usr/bin/env python3
# build_vfx_sheets.py — T68F temporal-coherence flipbook pipeline (RERUNNABLE).
# CAUSE 1 fix: extract 32 CONSECUTIVE-CADENCE frames from a 2s window (not 24 across 10s).
#   Adjacent sheet frames = ~62ms of real motion (was ~420ms → the time-lapse).
# CAUSE 2 fix: 384px cells, 8x4 grid = 3072x1536 (24-frame variants → 6x4).
# Per frame: black-floor clamp (lum<12->0) + F2 radial cosine mask (soft edge, corners 0).
# A4: same clamp+mask on the 13 remaining stills.
# Usage: python3 scripts/build_vfx_sheets.py
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

CELL = 384
ROWS = 4
Q = int(os.environ.get("SHEET_Q", "85"))
WIN = 48                     # 2-second window at 24fps
# per-clip: (frame count, window-start frame). smoke_2 uses the bloom RISE window; the two
# least-seen (aura_2, venom_1) drop to 24 frames per the F2 decoded-memory mitigation.
CLIP_CFG = {
    "aura_1":  (32, 72), "aura_2":  (24, 72),
    "smoke_1": (32, 72), "smoke_2": (32, 6),     # smoke_2 rise window (destroy bloom envelope)
    "surge_1": (32, 72), "surge_2": (32, 72),
    "venom_1": (24, 72), "venom_2": (32, 72),
}
A4_STILLS = ["ring_1","ring_2","shield_1","shield_2","bloom_1","bloom_2",
             "streak_1","streak_2","lightning_1","lightning_2","lightning_3","lightning_4","aura_3"]

def radial_mask(n):
    yy, xx = np.mgrid[0:n, 0:n]; cx = cy = (n - 1) / 2.0
    r = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / (n / 2.0)
    m = np.ones_like(r, dtype=np.float32)
    ease = (r > 0.70) & (r < 0.98)
    m[ease] = 0.5 * (1 + np.cos(math.pi * (r[ease] - 0.70) / 0.28))
    m[r >= 0.98] = 0.0
    return m[..., None]
MASK = radial_mask(CELL)
MASK_STILL = radial_mask(512)

def treat(rgb, mask):
    a = rgb.astype(np.float32); lum = a.max(axis=2); a[lum < 12] = 0
    return np.clip(a * mask, 0, 255).astype(np.uint8)

def build_sheet(effect):
    frames, start = CLIP_CFG[effect]
    cols = frames // ROWS   # 32→8, 24→6
    rd = imageio.get_reader(os.path.join(CLIPS, f"vfx_{effect}_clip.mp4"))
    total = rd.count_frames()
    cadence = WIN / frames                          # 32f→1.5 src frames, 24f→2.0 (a 2s window either way)
    idx = [min(total - 1, start + round(i * cadence)) for i in range(frames)]
    step_ms = cadence / 24.0 * 1000                 # real-motion ms between adjacent sheet frames (~62ms @32f)
    sheet = Image.new("RGB", (cols * CELL, ROWS * CELL), (0, 0, 0))
    for i, j in enumerate(idx):
        im = Image.fromarray(rd.get_data(j)[:, :, :3]).convert("RGB").resize((CELL, CELL), Image.LANCZOS)
        sheet.paste(Image.fromarray(treat(np.asarray(im), MASK), "RGB"), ((i % cols) * CELL, (i // cols) * CELL))
    rd.close()
    out = os.path.join(SHEETS, f"vfx_{effect}.png")
    sheet.save(out, "JPEG", quality=Q)
    return os.path.getsize(out), frames, cols, ROWS, round(step_ms), (cols * CELL * ROWS * CELL * 4)

def mask_still(name):
    im = Image.open(os.path.join(MASTERS, f"vfx_{name}.png")).convert("RGB").resize((512, 512), Image.LANCZOS)
    out = os.path.join(GAME, f"vfx_{name}.png")
    Image.fromarray(treat(np.asarray(im), MASK_STILL), "RGB").save(out, "JPEG", quality=85)
    return os.path.getsize(out)

if __name__ == "__main__":
    tot = 0; decoded = 0
    print(f"=== SHEETS ({CELL}px cells, q{Q}) — CAUSE 1: 2s window, consecutive-cadence frames ===")
    for e in CLIP_CFG:
        sz, fr, cols, rows, ms, dec = build_sheet(e); tot += sz; decoded += dec
        print(f"  vfx_{e}.png  {sz/1024:.0f}KB  {cols}x{rows}={fr}f  {cols*CELL}x{rows*CELL}  adj={ms}ms  decoded={dec/1048576:.1f}MB")
    print(f"  TOTAL sheet payload: {tot/1048576:.2f}MB  (8MB HARD ceiling)")
    print(f"  Sheet decoded-memory: {decoded/1048576:.0f}MB  (+ ~37MB stills/tints = ~{decoded/1048576+37:.0f}MB total; ~120MB budget)")
    if tot > 8 * 1048576:
        print("  *** OVER 8MB PAYLOAD — rerun SHEET_Q=80 ***"); sys.exit(1)
    print("=== A4: radial-mask the 13 stills ===")
    for s in A4_STILLS: mask_still(s)
    print(f"  {len(A4_STILLS)} stills re-masked. DONE")
