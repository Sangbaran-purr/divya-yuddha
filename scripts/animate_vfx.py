#!/usr/bin/env python3
# animate_vfx.py — A3 LAYER COMPOSITOR (v4a): named element layers + a motion brief → a PNG sequence.
#   - Per-layer per-frame transforms: opacity envelopes, scale, positional drift, ease-in/out curves.
#   - PARTICLE layers: connected-component extraction (OpenCV luminance threshold) → each blob a sprite
#     with its source position, animated procedurally per the brief numbers.
#   - DETERMINISM LAW (A3): all randomness seeds from a fixed constant per brief — same brief, same
#     frames, forever.
#   - one_shot | looping via a flag — one script, both behaviours.
#   - Output: PNG sequence, 24fps, TRUE BLACK ground, at SOURCE composite resolution (NO downscale here;
#     the sheet builder owns the T74 resolution ladder). Compositing is ADDITIVE on black; the runtime's
#     bakeAlpha law (T72, luminance-alpha) turns that black transparent at load — not reinvented here.
#   BRIEFS ARE DATA (the dict below), not code. Add a brief = add a dict entry.
# Usage: python3 scripts/animate_vfx.py <brief>            e.g.  c1a_deva
import os, sys, math, random
import numpy as np
from PIL import Image
try:
    import cv2   # connected-component particle extraction + affine warp (same dep as build_vfx_sheets mv/t74)
except Exception:
    cv2 = None

ROOT   = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LAYERS = os.path.join(ROOT, "assets/vfx/layers")
SEQ    = os.path.join(ROOT, "assets/vfx/seq")

# ---- easing curves (t in 0..1) ----
def _lin(t):  return t
def _out(t):  return 1.0 - (1.0 - t) ** 2      # ease-out (fast start, soft land)
def _in(t):   return t * t                     # ease-in  (soft start, fast end)
EASE = {"lin": _lin, "out": _out, "in": _in}

# ═══════════════════════════════════════════════════════════════════════════
# MOTION BRIEFS — DATA. frames are 1-based (matching the brief text). A property's
# segments are [f_start, f_end, v_start, v_end, ease]; opacity outside all segments = 0
# (absent); scale outside = held (first-seg start before, last-seg end after).
# ═══════════════════════════════════════════════════════════════════════════
BRIEFS = {
  # C1A DEVA LANDING — 27 frames = 1125ms @24fps, one-shot (VFX_v4a A3 first pipeline proof).
  "c1a_deva": {
    "seed": 0xC1A0DE, "fps": 24, "frames": 27, "one_shot": True, "layers_dir": "landing_deva",
    "layers": [
      # L1 CORE BEAM — snap in, hold, ease out; scale settle 1.06→1.0; locked to the landing point.
      { "src": "L1_beam", "kind": "xform",
        "opacity": [[1, 2, 0.0, 1.0, "out"], [3, 7, 1.0, 1.0, "lin"], [8, 16, 1.0, 0.0, "in"]],
        "scale":   [[1, 2, 1.06, 1.0, "out"]] },
      # L2 GROUND WASH — starts 1 frame after L1 (causal lag); short rise, long overlapping release;
      # linear outward drift 1.0→1.18.
      { "src": "L2_wash", "kind": "xform",
        "opacity": [[2, 4, 0.0, 0.9, "out"], [5, 16, 0.9, 0.0, "in"]],
        "scale":   [[2, 16, 1.0, 1.18, "lin"]] },
      # L3 PARTICLES — connected-component extraction; centre-weighted emission burst; per-particle
      # upward drift + jitter + lifespan, fast-fade over the final 2 frames (mirrors the T75 eviction).
      { "src": "L3_particles", "kind": "particles",
        "emit_frames": [1, 4], "inner_radius": 0.40, "inner_boost": 2.5,
        "speed_px_s": [25, 55], "jitter_deg": 15.0, "life_frames": [12, 23], "fade_frames": 2,
        "lum_thresh": 40, "min_area": 3 },
      # L4 OUTER GLOW — slowest riser, longest linger (survives to the final frame); slow single sine
      # breathe 1.0→1.04→1.0 across 6–27.
      { "src": "L4_glow", "kind": "xform",
        "opacity": [[1, 5, 0.0, 0.55, "out"], [6, 13, 0.55, 0.55, "lin"], [14, 27, 0.55, 0.0, "out"]],
        "scale_sine": [6, 27, 1.0, 0.04] },   # [f0, f1, base, amp] → base + amp*sin(phase*pi), one arc
    ],
  },
}

def _seg_val(segs, f, default_before, hold):
    """Evaluate a keyframe-segment list at (1-based) frame f."""
    if not segs:
        return default_before
    first, last = segs[0], segs[-1]
    if f < first[0]:
        return first[2] if hold else default_before          # scale holds its start; opacity = 0 (absent)
    if f > last[1]:
        return last[3] if hold else default_before            # scale holds its end;  opacity = 0 (absent)
    for fs, fe, vs, ve, ez in segs:
        if fs <= f <= fe:
            t = 0.0 if fe == fs else (f - fs) / (fe - fs)
            return vs + (ve - vs) * EASE[ez](max(0.0, min(1.0, t)))
    return default_before                                     # a gap between segments (opacity → 0)

def _warp(rgb, s, dx, dy):
    """Scale about centre by s, then translate by (dx,dy) px. cv2 affine (bilinear)."""
    h, w = rgb.shape[:2]; cx, cy = w / 2.0, h / 2.0
    M = np.float32([[s, 0, cx - s * cx + dx], [0, s, cy - s * cy + dy]])
    return cv2.warpAffine(rgb, M, (w, h), flags=cv2.INTER_LINEAR, borderValue=(0, 0, 0))

def _extract_particles(rgb, lum_thresh, min_area):
    """Connected-component blobs above a luminance threshold → (patch_rgb_float, cx, cy)."""
    lum = rgb.max(axis=2).astype(np.uint8)
    _, binimg = cv2.threshold(lum, lum_thresh, 255, cv2.THRESH_BINARY)
    n, lab, stats, cent = cv2.connectedComponentsWithStats(binimg, connectivity=8)
    out = []
    for i in range(1, n):                                     # 0 = background
        x, y, ww, hh, area = stats[i]
        if area < min_area:
            continue
        patch = rgb[y:y + hh, x:x + ww].astype(np.float32)
        mask = (lab[y:y + hh, x:x + ww] == i).astype(np.float32)[..., None]
        out.append({"patch": patch * mask, "x0": x, "y0": y, "w": ww, "h": hh,
                    "cx": float(cent[i][0]), "cy": float(cent[i][1])})
    return out

def _add_patch(canvas, patch, ox, oy, op):
    """Additive paste of patch's top-left at (ox,oy), clipped to canvas, scaled by op."""
    H, W = canvas.shape[:2]; ph, pw = patch.shape[:2]
    ox, oy = int(round(ox)), int(round(oy))
    x0, y0 = max(0, ox), max(0, oy); x1, y1 = min(W, ox + pw), min(H, oy + ph)
    if x1 <= x0 or y1 <= y0:
        return
    canvas[y0:y1, x0:x1] += patch[y0 - oy:y1 - oy, x0 - ox:x1 - ox] * op

def render(name):
    if cv2 is None:
        print("*** cv2 missing: pip install opencv-python-headless ***"); sys.exit(1)
    if name not in BRIEFS:
        print(f"*** unknown brief '{name}' (have: {', '.join(BRIEFS)}) ***"); sys.exit(1)
    b = BRIEFS[name]; N = b["frames"]; fps = b["fps"]; one_shot = b.get("one_shot", True)
    random.seed(b["seed"]); np.random.seed(b["seed"] & 0x7fffffff)   # A3 determinism law
    ld = os.path.join(LAYERS, b.get("layers_dir", name))             # input layer dir (may differ from the brief/output key)
    layers = []
    for L in b["layers"]:
        p = os.path.join(ld, L["src"] + ".png")
        if not os.path.exists(p):
            print(f"*** MISSING LAYER {p} ***"); sys.exit(1)
        rgb = np.asarray(Image.open(p).convert("RGB"))
        layers.append((L, rgb))
    res = layers[0][1].shape[0]

    # pre-extract particle blobs (once) + assign deterministic per-particle attributes
    parts_meta = []
    for L, rgb in layers:
        if L["kind"] != "particles":
            parts_meta.append(None); continue
        blobs = _extract_particles(rgb, L["lum_thresh"], L["min_area"])
        ef0, ef1 = L["emit_frames"]; ir = L["inner_radius"] * (res / 2.0); ib = L["inner_boost"]
        s0, s1 = L["speed_px_s"]; jit = math.radians(L["jitter_deg"]); l0, l1 = L["life_frames"]
        c = res / 2.0
        for pt in blobs:
            r = math.hypot(pt["cx"] - c, pt["cy"] - c)
            inner = r <= ir
            # centre-weighted burst: inner blobs are inner_boost× more likely to fire in frames ef0..ef0+1
            choices = list(range(ef0, ef1 + 1))
            weights = [(ib if (inner and fr <= ef0 + 1) else 1.0) for fr in choices]
            pt["act"] = random.choices(choices, weights=weights, k=1)[0]
            theta = random.uniform(-jit, jit)                          # around vertical (up)
            spd = random.uniform(s0, s1)
            pt["vx"] = math.sin(theta) * spd; pt["vy"] = -math.cos(theta) * spd   # up = -y
            pt["life"] = random.randint(l0, l1)
        parts_meta.append({"blobs": blobs, "fade": L["fade_frames"]})

    od = os.path.join(SEQ, name); os.makedirs(od, exist_ok=True)
    for old in os.listdir(od):                                         # clean stale frames (rerunnable)
        if old.startswith("frame_"): os.remove(os.path.join(od, old))

    for f in range(1, N + 1):
        canvas = np.zeros((res, res, 3), np.float32)
        for (L, rgb), pm in zip(layers, parts_meta):
            if L["kind"] == "xform":
                op = _seg_val(L.get("opacity", []), f, 0.0, hold=False)
                if op <= 0.0:
                    continue
                if "scale_sine" in L:
                    f0, f1, base, amp = L["scale_sine"]
                    ph = 0.0 if f < f0 else (1.0 if f > f1 else (f - f0) / (f1 - f0))
                    sc = base + amp * math.sin(ph * math.pi)
                else:
                    sc = _seg_val(L.get("scale", []), f, 1.0, hold=True)
                canvas += _warp(rgb, sc, 0.0, 0.0).astype(np.float32) * op
            else:  # particles
                fade = pm["fade"]
                for pt in pm["blobs"]:
                    age = f - pt["act"]
                    if not one_shot:
                        age = (f - pt["act"]) % N                      # LOOP: lifecycle wraps
                    if age < 0 or age >= pt["life"]:
                        continue
                    op = 1.0
                    if age >= pt["life"] - fade:                       # fast-fade over the final `fade` frames
                        op = max(0.0, (pt["life"] - age) / float(fade))
                    dx = pt["vx"] * (age / fps); dy = pt["vy"] * (age / fps)
                    _add_patch(canvas, pt["patch"], pt["x0"] + dx, pt["y0"] + dy, op)
        Image.fromarray(np.clip(canvas, 0, 255).astype(np.uint8), "RGB").save(
            os.path.join(od, f"frame_{f:03d}.png"))

    mode = "one-shot" if one_shot else "looping"
    print(f"animate_vfx '{name}': {N} frames @ {fps}fps ({mode}), {res}x{res} true-black, "
          f"{len(parts_meta[[i for i,(L,_) in enumerate(layers) if L['kind']=='particles'][0]]['blobs']) if any(L['kind']=='particles' for L,_ in layers) else 0} particles → {od}")

if __name__ == "__main__":
    render(sys.argv[1] if len(sys.argv) > 1 else "c1a_deva")
