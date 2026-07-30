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
try:
    import cv2   # T70-P1 S2-DATA: Farneback optical flow for the MV sheets (mv mode only)
except Exception:
    cv2 = None

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

# ---- T70-P1 S2-DATA: MOTION-VECTOR PIPELINE (mv mode) ----
# Farneback flow between ADJACENT extracted frames (the SAME window/cadence/idx as the color sheets, frame-for-frame).
# Encode flow into R,G (signed x,y displacement, ±16px @384 range, centred 128); B=0. TRUE PNG (flow must not JPEG-block).
# MV frame i = flow (frame_i -> frame_i+1); the shader negates for reverse playback. Last frame = neutral (128,128,0).
MVDIR = os.path.join(SHEETS, "mv")
MV_RANGE = 16.0          # ±px at 384 (per spec)
def build_mv_sheet(effect, mv_cell):
    frames, start = CLIP_CFG[effect]
    cols = frames // ROWS
    rd = imageio.get_reader(os.path.join(CLIPS, f"vfx_{effect}_clip.mp4"))
    total = rd.count_frames()
    cadence = WIN / frames
    idx = [min(total - 1, start + round(i * cadence)) for i in range(frames)]   # IDENTICAL to build_sheet
    grays = []
    for j in idx:
        im = Image.fromarray(rd.get_data(j)[:, :, :3]).convert("L").resize((mv_cell, mv_cell), Image.LANCZOS)
        grays.append(np.asarray(im))
    rd.close()
    fscale = 384.0 / mv_cell                                   # express flow in 384px units regardless of MV resolution
    sheet = Image.new("RGB", (cols * mv_cell, ROWS * mv_cell), (128, 128, 0))
    for i in range(frames):
        enc = np.zeros((mv_cell, mv_cell, 3), np.uint8); enc[..., 0] = 128; enc[..., 1] = 128
        if i < frames - 1:
            flow = cv2.calcOpticalFlowFarneback(grays[i], grays[i + 1], None, 0.5, 3, 15, 3, 5, 1.2, 0)
            fx = np.clip(flow[..., 0] * fscale, -MV_RANGE, MV_RANGE)
            fy = np.clip(flow[..., 1] * fscale, -MV_RANGE, MV_RANGE)
            enc[..., 0] = np.clip(128 + fx / MV_RANGE * 127, 0, 255).astype(np.uint8)
            enc[..., 1] = np.clip(128 + fy / MV_RANGE * 127, 0, 255).astype(np.uint8)
        sheet.paste(Image.fromarray(enc, "RGB"), ((i % cols) * mv_cell, (i // cols) * mv_cell))
    out = os.path.join(MVDIR, f"vfx_{effect}.png")
    sheet.save(out, "PNG")
    return os.path.getsize(out), cols, ROWS, frames, mv_cell

def build_all_mv(mv_cell):
    os.makedirs(MVDIR, exist_ok=True)
    tot = 0
    print(f"=== MV SHEETS ({mv_cell}px cells, TRUE PNG) — Farneback flow, same idx as color sheets ===")
    for e in CLIP_CFG:
        sz, cols, rows, fr, cell = build_mv_sheet(e, mv_cell); tot += sz
        print(f"  mv/vfx_{e}.png  {sz/1024:.0f}KB  {cols}x{rows}={fr}f  {cols*cell}x{rows*cell}")
    print(f"  TOTAL MV payload: {tot/1048576:.2f}MB  (6MB ceiling)")
    return tot

# ---- T74: DISPLAY-RESOLUTION QUALITY LADDER (t74 mode) ----
# The T71 desktop board draws effects up to ~2100 physical px @DPR2; the 384px sheets / 512px stills upscale ≤4.1×
# (worst = the ring-shockwave STILL) → visible softness. Re-derive at display resolution from the 1254px still masters
# and the 960px clips. Ruling asked 768/64f sheets, but 768/64f × the 3 GPU-loaded sheets (surge_1/2, smoke_1) + MV =
# ~540MB decoded (≈720 with mipmaps) >> the 420MB ceiling, and the sheet draws are only 1.2–1.7× — so HIGH sheets are
# 512px/64f (fits 420MB, 512 ≥ the ≤651px sheet draws → crisp) and the decisive fix is STILLS → 1024px (the 4.1× case).
SPR_NAMES_PY = ["aura_1","aura_2","aura_3","bloom_1","bloom_2","lightning_1","lightning_2","lightning_3","lightning_4",
                "ring_1","ring_2","shield_1","shield_2","smoke_1","smoke_2","streak_1","streak_2","surge_1","surge_2","venom_1","venom_2"]
RUNGS = { "hi": {"cell":512,"frames":64,"cols":8,"mv":384,"still":1024},
          "md": {"cell":448,"frames":48,"cols":8,"mv":384,"still":768} }
def _idx(effect, frames):
    start = CLIP_CFG[effect][1]; rd = imageio.get_reader(os.path.join(CLIPS, f"vfx_{effect}_clip.mp4")); total = rd.count_frames(); rd.close()
    cadence = WIN / frames
    return [min(total-1, start+round(i*cadence)) for i in range(frames)], cadence
def build_rung_sheet(effect, cfg, rk):
    cell,frames,cols = cfg["cell"],cfg["frames"],cfg["cols"]; rows = frames//cols
    idx,cad = _idx(effect, frames); mask = radial_mask(cell)
    rd = imageio.get_reader(os.path.join(CLIPS, f"vfx_{effect}_clip.mp4"))
    sheet = Image.new("RGB", (cols*cell, rows*cell), (0,0,0))
    for i,j in enumerate(idx):
        im = Image.fromarray(rd.get_data(j)[:,:,:3]).convert("RGB").resize((cell,cell), Image.LANCZOS)
        sheet.paste(Image.fromarray(treat(np.asarray(im), mask), "RGB"), ((i%cols)*cell, (i//cols)*cell))
    rd.close()
    od = os.path.join(SHEETS, rk); os.makedirs(od, exist_ok=True); out = os.path.join(od, f"vfx_{effect}.png"); sheet.save(out, "JPEG", quality=Q)
    return os.path.getsize(out), cols, rows, frames, cell, round(cad/24.0*1000), (cols*cell*rows*cell*4)
def build_rung_mv(effect, cfg, rk):
    cell,frames,cols,mv = cfg["cell"],cfg["frames"],cfg["cols"],cfg["mv"]; rows = frames//cols
    idx,cad = _idx(effect, frames); rd = imageio.get_reader(os.path.join(CLIPS, f"vfx_{effect}_clip.mp4"))
    grays = [np.asarray(Image.fromarray(rd.get_data(j)[:,:,:3]).convert("L").resize((mv,mv), Image.LANCZOS)) for j in idx]; rd.close()
    fscale = 384.0/mv; sheet = Image.new("RGB", (cols*mv, rows*mv), (128,128,0))
    for i in range(frames):
        enc = np.zeros((mv,mv,3), np.uint8); enc[...,0]=128; enc[...,1]=128
        if i < frames-1:
            flow = cv2.calcOpticalFlowFarneback(grays[i], grays[i+1], None, 0.5,3,15,3,5,1.2,0)
            fx = np.clip(flow[...,0]*fscale, -MV_RANGE, MV_RANGE); fy = np.clip(flow[...,1]*fscale, -MV_RANGE, MV_RANGE)
            enc[...,0]=np.clip(128+fx/MV_RANGE*127,0,255).astype(np.uint8); enc[...,1]=np.clip(128+fy/MV_RANGE*127,0,255).astype(np.uint8)
        sheet.paste(Image.fromarray(enc,"RGB"), ((i%cols)*mv, (i//cols)*mv))
    od = os.path.join(SHEETS, rk, "mv"); os.makedirs(od, exist_ok=True); out = os.path.join(od, f"vfx_{effect}.png"); sheet.save(out, "PNG")
    return os.path.getsize(out)
def build_rung_still(name, cfg, rk):
    size = cfg["still"]; m = radial_mask(size)
    im = Image.open(os.path.join(MASTERS, f"vfx_{name}.png")).convert("RGB").resize((size,size), Image.LANCZOS)
    od = os.path.join(GAME, rk); os.makedirs(od, exist_ok=True); out = os.path.join(od, f"vfx_{name}.png")
    Image.fromarray(treat(np.asarray(im), m), "RGB").save(out, "JPEG", quality=85)
    return os.path.getsize(out)

# ---- A5: SEQ MODE — ingest a pre-rendered PNG sequence (animate_vfx.py output) → packed sheet + MV ----
# TWO CLASSES (T78): SQUARE card-anchored effects (c1a: radial mask, square rung cells 384/448/512 — UNCHANGED)
# and WIDE row-plate board effects (brahmastra 1920×640 3:1: TOP/BOTTOM edge-law mask per v5a G2, RECTANGULAR cells
# cellW=rung board width {512/640/768}, cellH=cellW/aspect). Class is auto-detected from the source aspect (>1.4 = wide).
# Grid derives from the frame count (27→9×3, 40→8×5, exact). Sheets are JPEG-in-.png (runtime bakeAlpha, T72).
SEQDIR = os.path.join(ROOT, "assets/vfx/seq")
SEQ_RUNGS = { "lo": {"cell":384, "bw":512, "dir":SHEETS},                       # bw = row-plate cell WIDTH per rung
              "md": {"cell":448, "bw":640, "dir":os.path.join(SHEETS,"md")},
              "hi": {"cell":512, "bw":768, "dir":os.path.join(SHEETS,"hi")} }
SEQ_MVW = 384                                                                   # MV cell width (height = /aspect for wide)
def _seq_grid(n):
    for c in (8, 9, 7, 6, 10, 5, 4):
        if n % c == 0: return c, n // c                                         # exact grid, no blanks
    c = min(9, n); return c, math.ceil(n / c)                                   # fallback (padded)
def _rowplate_mask(W, H):
    # ROW-PLATE EDGE LAW (v5a G2): top/bottom cosine-fade to 0 (blend into the board); a GENTLE left/right fade
    # (8%) prevents a hard cell-boundary seam while letting the sweep burn most of the width.
    fy = np.ones(H, np.float32); vt = max(1, int(H*0.18))
    for i in range(vt): fy[i] = fy[H-1-i] = 0.5*(1-math.cos(math.pi*i/vt))
    fx = np.ones(W, np.float32); ht = max(1, int(W*0.08))
    for i in range(ht): fx[i] = fx[W-1-i] = 0.5*(1-math.cos(math.pi*i/ht))
    return (fy[:,None]*fx[None,:])[..., None]
def build_seq(name):
    fdir = os.path.join(SEQDIR, name)
    files = sorted(f for f in os.listdir(fdir) if f.startswith("frame_") and f.endswith(".png"))
    if not files:
        print(f"*** no frame_*.png in {fdir} — run animate_vfx.py {name} first ***"); sys.exit(1)
    frames = [np.asarray(Image.open(os.path.join(fdir, f)).convert("RGB")) for f in files]
    n = len(frames); cols, rows = _seq_grid(n)
    srcH, srcW = frames[0].shape[:2]; aspect = srcW/srcH; wide = aspect > 1.4
    cls = f"WIDE row-plate (aspect {aspect:.2f})" if wide else "square card-anchored"
    print(f"=== SEQ '{name}': {n} frames @ {srcW}x{srcH} source → {cols}x{rows} grid, {cls}, rungs lo/md/hi + MV ===")
    for rk, cfg in SEQ_RUNGS.items():
        if wide:
            cw = cfg["bw"]; ch = round(cw/aspect); mask = _rowplate_mask(cw, ch)   # rectangular cell + edge-law mask
            mvw = SEQ_MVW; mvh = round(mvw/aspect)
        else:
            cw = ch = cfg["cell"]; mask = radial_mask(cw); mvw = mvh = SEQ_MVW      # square (c1a path, unchanged)
        os.makedirs(cfg["dir"], exist_ok=True)
        sheet = Image.new("RGB", (cols*cw, rows*ch), (0,0,0))
        for i, fr in enumerate(frames):
            im = np.asarray(Image.fromarray(fr).resize((cw,ch), Image.LANCZOS))
            sheet.paste(Image.fromarray(treat(im, mask), "RGB"), ((i%cols)*cw, (i//cols)*ch))
        out = os.path.join(cfg["dir"], f"vfx_{name}.png"); sheet.save(out, "JPEG", quality=Q)
        # MV: Farneback flow between adjacent frames (last frame neutral). Canvas2D board plate uses frame-blend, not MV;
        # MV is built per the seq spec for a future GPU wire.
        grays = [np.asarray(Image.fromarray(fr).convert("L").resize((mvw,mvh), Image.LANCZOS)) for fr in frames]
        fscale = 384.0/mvw; mvsheet = Image.new("RGB", (cols*mvw, rows*mvh), (128,128,0))
        for i in range(n):
            enc = np.zeros((mvh,mvw,3), np.uint8); enc[...,0]=128; enc[...,1]=128
            if i < n-1:
                flow = cv2.calcOpticalFlowFarneback(grays[i], grays[i+1], None, 0.5,3,15,3,5,1.2,0)
                fx = np.clip(flow[...,0]*fscale, -MV_RANGE, MV_RANGE); fy = np.clip(flow[...,1]*fscale, -MV_RANGE, MV_RANGE)
                enc[...,0]=np.clip(128+fx/MV_RANGE*127,0,255).astype(np.uint8); enc[...,1]=np.clip(128+fy/MV_RANGE*127,0,255).astype(np.uint8)
            mvsheet.paste(Image.fromarray(enc,"RGB"), ((i%cols)*mvw, (i//cols)*mvh))
        mvd = os.path.join(cfg["dir"], "mv"); os.makedirs(mvd, exist_ok=True); mvsheet.save(os.path.join(mvd, f"vfx_{name}.png"), "PNG")
        sz = os.path.getsize(out); mvsz = os.path.getsize(os.path.join(mvd, f"vfx_{name}.png"))
        print(f"  {rk}: cell {cw}x{ch}  sheet {cols*cw}x{rows*ch} {sz/1024:.0f}KB  + mv {mvsz/1024:.0f}KB  decoded={(cols*cw*rows*ch*4)/1048576:.1f}MB")
    print(f"  SEQ '{name}' DONE ({n} frames, {cols}x{rows} grid)")

if __name__ == "__main__":
    if len(sys.argv) > 2 and sys.argv[1] == "seq":
        if cv2 is None: print("*** cv2 missing: pip install opencv-python-headless ***"); sys.exit(1)
        build_seq(sys.argv[2]); sys.exit(0)
    if len(sys.argv) > 1 and sys.argv[1] == "t74":
        if cv2 is None: print("*** cv2 missing ***"); sys.exit(1)
        for rk, cfg in RUNGS.items():
            print(f"=== RUNG '{rk}': sheets {cfg['cell']}px/{cfg['frames']}f (8x{cfg['frames']//cfg['cols']}), stills {cfg['still']}px, MV {cfg['mv']}px ===")
            ctot=0; dec=0; adjms=0
            for e in CLIP_CFG:
                sz,cols,rows,fr,cell,ms,d = build_rung_sheet(e, cfg, rk); ctot+=sz; dec+=d; adjms=ms
                print(f"  sheets/{rk}/vfx_{e}.png  {sz/1024:.0f}KB  {cols}x{rows}={fr}f  {cols*cell}x{rows*cell}  adj={ms}ms")
            mvtot=0
            for e in CLIP_CFG: mvtot += build_rung_mv(e, cfg, rk)
            stot=0
            for n in SPR_NAMES_PY: stot += build_rung_still(n, cfg, rk)
            gpu3 = 3*(cfg['cols']*cfg['cell']*(cfg['frames']//cfg['cols'])*cfg['cell']*4) + 3*(cfg['cols']*cfg['mv']*(cfg['frames']//cfg['cols'])*cfg['mv']*4)
            print(f"  color {ctot/1048576:.2f}MB + MV {mvtot/1048576:.2f}MB + stills {stot/1048576:.2f}MB = {(ctot+mvtot+stot)/1048576:.2f}MB payload  ·  adj-frame {adjms}ms  ·  GPU-loaded(3 sheets+MV) decoded {gpu3/1048576:.0f}MB (ceiling 420)")
        print("  T74 LADDER DONE")
        sys.exit(0)
    if len(sys.argv) > 1 and sys.argv[1] == "mv":
        if cv2 is None:
            print("*** cv2 missing: pip install opencv-python-headless ***"); sys.exit(1)
        tot = build_all_mv(384)
        if tot > 6 * 1048576:                                  # spec: drop to 192px if over 6MB
            print("  *** OVER 6MB — rebuilding MV at 192px (flow is smooth; half-res upsamples fine) ***")
            tot = build_all_mv(192)
        print("  MV DONE")
        sys.exit(0)
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
