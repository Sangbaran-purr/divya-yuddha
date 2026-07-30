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
def _io(t):   return 0.5 * (1.0 - math.cos(math.pi * t))   # ease-in-out (symmetric S-curve — serene rises)
EASE = {"lin": _lin, "out": _out, "in": _in, "io": _io}

# ═══════════════════════════════════════════════════════════════════════════
# MOTION BRIEFS — DATA. frames are 1-based (matching the brief text). A property's
# segments are [f_start, f_end, v_start, v_end, ease]; opacity outside all segments = 0
# (absent); scale outside = held (first-seg start before, last-seg end after).
# ═══════════════════════════════════════════════════════════════════════════
# ═══ LANDING CLASS (T80) — the c1a brief IS the shared landing brief. EVERY faction uses these EXACT envelopes; only the
# layers_dir + seed differ (layer filenames are identical per faction). Tune the landing choreography by editing LANDING_LAYERS
# ONCE → it propagates to all factions. 27 frames = 1125ms @24fps, one-shot (the VFX_v4a A3 proof, now generalized).
LANDING_LAYERS = [
  # L1 CORE BEAM — snap in, hold, ease out; scale settle 1.06→1.0; locked to the landing point.
  { "src": "L1_beam", "kind": "xform",
    "opacity": [[1, 2, 0.0, 1.0, "out"], [3, 7, 1.0, 1.0, "lin"], [8, 16, 1.0, 0.0, "in"]],
    "scale":   [[1, 2, 1.06, 1.0, "out"]] },
  # L2 GROUND WASH — starts 1 frame after L1 (causal lag); short rise, long overlapping release; drift 1.0→1.18.
  { "src": "L2_wash", "kind": "xform",
    "opacity": [[2, 4, 0.0, 0.9, "out"], [5, 16, 0.9, 0.0, "in"]],
    "scale":   [[2, 16, 1.0, 1.18, "lin"]] },
  # L3 PARTICLES — connected-component extraction; centre-weighted burst; upward drift + jitter + lifespan, 2-frame fast-fade.
  { "src": "L3_particles", "kind": "particles",
    "emit_frames": [1, 4], "inner_radius": 0.40, "inner_boost": 2.5,
    "speed_px_s": [25, 55], "jitter_deg": 15.0, "life_frames": [12, 23], "fade_frames": 2,
    "lum_thresh": 40, "min_area": 3 },
  # L4 OUTER GLOW — slowest riser, longest linger (survives to the final frame); slow single sine breathe 1.0→1.04→1.0.
  { "src": "L4_glow", "kind": "xform",
    "opacity": [[1, 5, 0.0, 0.55, "out"], [6, 13, 0.55, 0.55, "lin"], [14, 27, 0.55, 0.0, "out"]],
    "scale_sine": [6, 27, 1.0, 0.04] },   # [f0, f1, base, amp] → base + amp*sin(phase*pi), one arc
]
def _landing_brief(layers_dir, seed):
    return { "seed": seed, "fps": 24, "frames": 27, "one_shot": True, "layers_dir": layers_dir, "layers": LANDING_LAYERS }

BRIEFS = {
  "c1a_deva":       _landing_brief("landing_deva",   0xC1A0DE),   # Deva landing (shipped sheet name kept; seed unchanged → byte-identical)
  "landing_asura":  _landing_brief("landing_asura",  0xA5172A),   # T80 Asura landing (same class brief, own seed/layers)
  "landing_vanara": _landing_brief("landing_vanara", 0x7A9A2A),   # T81 Vanara landing
  "landing_naga":   _landing_brief("landing_naga",   0x9A6A2A),   # T81 Naga landing

  # BRAHMASTRA — the board-effect class (C2b: "golden pillar of annihilation, ground to sky"). 40 frames = 1667ms @24fps,
  # one-shot, composited into a 1920x640 ROW PLATE (cover-fit of the 16:9 layers → full-width, centre-cropped band) placed over
  # the enemy rows. FOUR BEATS: (1) anticipation — glow gathers; (2) strike — the column slams ground-to-sky (impact beat,
  # coincides with the Astra hit-stop); (3) shockwave — ring expands + embers burst; (4) aftermath — column fades, embers drift,
  # glow lingers longest. AUTHORED brief (no per-frame brief shipped with the layers) — numbers below are the owner's to tune.
  "brahmastra": {
    "seed": 0xB4A17A, "fps": 24, "frames": 40, "one_shot": True, "layers_dir": "brahmastra", "canvas": (1920, 640),
    "layers": [
      # L1 COLUMN (the pillar — the star). Beat 2 strike snap + settle, hold, then aftermath fade. Locked (no drift).
      { "src": "L1_column", "kind": "xform",
        "opacity": [[8, 11, 0.0, 1.0, "out"], [12, 22, 1.0, 1.0, "lin"], [23, 34, 1.0, 0.0, "in"]],
        "scale":   [[8, 11, 1.15, 1.0, "out"]] },
      # L2 RING (the shockwave). Beat 3: quick rise, long release, expanding outward 0.5→1.5.
      { "src": "L2_ring", "kind": "xform",
        "opacity": [[14, 16, 0.0, 0.9, "out"], [17, 30, 0.9, 0.0, "in"]],
        "scale":   [[14, 30, 0.5, 1.5, "lin"]] },
      # L3 EMBERS (particles). Burst after the strike (frames 12–18), centre-weighted, rising, ragged death by frame 40.
      { "src": "L3_embers", "kind": "particles",
        "emit_frames": [12, 18], "inner_radius": 0.42, "inner_boost": 2.5,
        "speed_px_s": [30, 70], "jitter_deg": 18.0, "life_frames": [14, 26], "fade_frames": 2,
        "lum_thresh": 44, "min_area": 3 },
      # L4 GLOW (afterglow). Beat 1 anticipation (rises FIRST), holds through the strike/shockwave, longest linger to frame 40.
      { "src": "L4_glow", "kind": "xform",
        "opacity": [[1, 8, 0.0, 0.45, "out"], [9, 28, 0.45, 0.45, "lin"], [29, 40, 0.45, 0.0, "out"]],
        "scale_sine": [8, 40, 1.0, 0.05] },
    ],
  },

  # GAYATRI MANTRA — the Mantra class (G3 pure row wash), the INVERSE of Brahmastra: nothing strikes, everything SETTLES.
  # 36 frames = 1500ms @24fps (~2.25s at SHEET_FPS 16), one-shot, 1920x640 row plate cover-fit, over the CASTER's (friendly)
  # half. Every envelope is gentle (ease-in-out rises, ≥6-frame spans); the sigil INSCRIBES then breathes, the lotus blooms
  # BEHIND it (lagging ~3f), motes drift up like incense (even spread, no burst), the warmth is the last thing alive.
  "gayatri": {
    "seed": 0x6A47A1, "fps": 24, "frames": 36, "one_shot": True, "layers_dir": "gayatri", "canvas": (1920, 640),
    "layers": [
      # L1 SIGIL — slow inscription (reveals, never pops), a single luminance breathe across the hold, gentle fade. No drift/rotation.
      { "src": "L1_sigil", "kind": "xform",
        "opacity":  [[1, 10, 0.0, 0.85, "io"], [23, 36, 0.85, 0.0, "out"]],
        "op_sine":  [11, 22, 0.85, 0.07],   # hold-breathe 0.85→0.92→0.85 (single arc — alive, not static)
        "scale":    [[1, 10, 0.94, 1.0, "io"]] },
      # L2 LOTUS — blooms BEHIND the sigil (lags ~3f), opening outward, keeps opening barely through the hold, gentle fade.
      { "src": "L2_lotus", "kind": "xform",
        "opacity":  [[4, 14, 0.0, 0.7, "io"], [15, 24, 0.7, 0.7, "lin"], [25, 36, 0.7, 0.0, "out"]],
        "scale":    [[4, 14, 0.85, 1.05, "io"], [15, 24, 1.05, 1.10, "lin"]] },
      # L3 PARTICLES — incense motes: EVEN activation (inner_boost 1.0 = NO burst), calm upward-only drift, soft 3-frame deaths.
      { "src": "L3_particles", "kind": "particles",
        "emit_frames": [3, 20], "inner_radius": 0.42, "inner_boost": 1.0,
        "speed_px_s": [8, 20], "jitter_deg": 8.0, "life_frames": [14, 26], "fade_frames": 3,
        "lum_thresh": 44, "min_area": 3 },
      # L4 GLOW — ambient warmth of the chant, rises with the inscription, holds, the LAST thing alive (fades after the light).
      { "src": "L4_glow", "kind": "xform",
        "opacity":  [[1, 12, 0.0, 0.45, "io"], [13, 26, 0.45, 0.45, "lin"], [27, 36, 0.45, 0.0, "out"]] },
    ],
  },

  # VAJRA — single-unit STRIKE class (card-anchored on the TARGET, refined G2). The FASTEST effect: near-instant attack, hard
  # impact, fast decay, only the glow lingers — the inverse of Gayatri in every number. 18 frames = 750ms @24fps (~1.125s at
  # SHEET_FPS 16), one-shot, 1254² square. No particle extraction (L3 is a whole-layer flicker). ⚠ frame-1 reading: the brief's
  # "0→1 over frames 1-2" is reconciled with the VETO "frame 1 = bolt alone" by resolving toward SNAP — the bolt is already
  # struck (0.85) on frame 1, full on frame 2; the impact flashes ONE FRAME AFTER (frame 2). Keyed via op_keys (electric flicker).
  "vajra": {
    "seed": 0x7A47AB, "fps": 24, "frames": 18, "one_shot": True, "layers_dir": "vajra",
    "layers": [
      # L1 BOLT — instant strike (f1 struck), full, single restrike flicker (f4), dead by f8. Descends into frame (scale 0.85→1.0).
      { "src": "L1_bolt", "kind": "xform",
        "op_keys": [1, [0.85, 1.0, 1.0, 0.55, 1.0, 0.55, 0.2, 0.0]],   # frames 1-8
        "scale":   [[1, 2, 0.85, 1.0, "out"]] },
      # L2 IMPACT — the flash, ONE FRAME AFTER the bolt (f2), hard then fast fade; burst kick outward 0.9→1.18.
      { "src": "L2_impact", "kind": "xform",
        "op_keys": [2, [0.75, 1.0, 0.8, 0.55, 0.35, 0.2, 0.08, 0.0]],   # frames 2-9 (absent f1)
        "scale":   [[2, 3, 0.9, 1.12, "out"], [4, 9, 1.12, 1.18, "lin"]] },
      # L3 CRACKLE — decaying electric flicker (verbatim keys), dead by f12; arcs reaching outward (scale 1.0→1.06).
      { "src": "L3_crackle", "kind": "xform",
        "op_keys": [2, [0.9, 0.5, 0.75, 0.4, 0.55, 0.25, 0.35, 0.15, 0.2, 0.08, 0.0]],   # frames 2-12
        "scale":   [[2, 12, 1.0, 1.06, "lin"]] },
      # L4 GLOW — blooms with the strike, holds, the ONLY linger (alive at f17, black at f18).
      { "src": "L4_glow", "kind": "xform",
        "opacity": [[1, 4, 0.0, 0.6, "out"], [5, 10, 0.6, 0.6, "lin"], [11, 18, 0.6, 0.0, "out"]] },
    ],
  },

  # DAMAGE TICK — shared, faction-agnostic card-anchored STATUS sting (replaces the gated legacy damage bloom). A SMALL FAST
  # HURT at ~HALF the weight of a landing: fires constantly, on both halves, several times a turn. Every opacity is CAPPED
  # (0.7 / 0.75 / 0.4, never 1.0) and it's drawn smaller — the half-weight rule is baked in. 12 frames = 500ms @24fps
  # (~0.75s at 16fps, the shortest in the library), one-shot, 1254² square. 3 layers (not 4). L2 = particle extraction, RADIAL burst.
  "damage": {
    "seed": 0xDA3A6E, "fps": 24, "frames": 12, "one_shot": True, "layers_dir": "damage",
    "layers": [
      # L1 CRACK FLASH — 2-frame snap CAPPED at 0.7 (half-weight), fast die.
      { "src": "L1_crack", "kind": "xform",
        "opacity": [[1, 2, 0.0, 0.7, "out"], [3, 6, 0.7, 0.0, "in"]],
        "scale":   [[1, 2, 0.92, 1.0, "out"]] },
      # L2 SHARDS — a real BURST: all activate in frames 1-3, RADIALLY OUTWARD from centre, capped 0.75, dead by frame 11.
      { "src": "L2_shards", "kind": "particles",
        "emit_frames": [1, 3], "inner_radius": 1.0, "inner_boost": 1.0, "drift": "radial",
        "speed_px_s": [40, 90], "jitter_deg": 10.0, "life_frames": [5, 9], "fade_frames": 2,
        "op_cap": 0.75, "die_by": 11, "lum_thresh": 40, "min_area": 3 },
      # L3 PAIN GLOW — a dark pulse CAPPED at 0.4 (not a bloom), rise/hold/fall, alive at 11, black at 12.
      { "src": "L3_glow", "kind": "xform",
        "opacity": [[1, 3, 0.0, 0.4, "out"], [4, 7, 0.4, 0.4, "lin"], [8, 12, 0.4, 0.0, "out"]] },
    ],
  },

  # BUFF SURGE — damage's INVERSE: a small fast BLESSING, same half-weight law (caps, short, quick exit) but motion RISES
  # everywhere (damage bursts outward; buff streams upward). 12 frames = 500ms @24fps (~0.75s at 16fps), one-shot, 1254²
  # square, 3 layers. L2 = particle extraction, UPWARD drift (not a burst). Every opacity capped (0.65/0.7/0.4).
  "buff": {
    "seed": 0xB4FF00, "fps": 24, "frames": 12, "one_shot": True, "layers_dir": "buff",
    "layers": [
      # L1 SURGE — RISES in (ease-out, not a snap — a blessing arrives), BOTTOM-anchored scale (streams grow upward), capped 0.65.
      { "src": "L1_surge", "kind": "xform", "scale_anchor": "bottom",
        "opacity": [[1, 3, 0.0, 0.65, "out"], [4, 7, 0.65, 0.0, "in"]],
        "scale":   [[1, 3, 0.9, 1.0, "out"]] },
      # L2 MOTES — RISING motes (staggered 1-5, upward drift, NOT a burst), capped 0.7, dead by 11.
      { "src": "L2_motes", "kind": "particles",
        "emit_frames": [1, 5], "inner_radius": 1.0, "inner_boost": 1.0, "drift": "up",
        "speed_px_s": [30, 70], "jitter_deg": 6.0, "life_frames": [5, 9], "fade_frames": 2,
        "op_cap": 0.7, "die_by": 11, "lum_thresh": 40, "min_area": 3 },
      # L3 GLOW — dark pulse capped 0.4, a subtle 6px upward LIFT across the hold, alive at 11, black at 12.
      { "src": "L3_glow", "kind": "xform",
        "opacity":  [[1, 3, 0.0, 0.4, "out"], [4, 8, 0.4, 0.4, "lin"], [9, 12, 0.4, 0.0, "out"]],
        "drift_up": [4, 8, 6] },
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

def _warp(rgb, s, dx, dy, anchor="center"):
    """Scale by s (pivot = centre, or bottom-centre for anchor='bottom' → streams grow upward), then translate (dx,dy)."""
    h, w = rgb.shape[:2]; cx = w / 2.0; cy = (h if anchor == "bottom" else h / 2.0)
    M = np.float32([[s, 0, cx - s * cx + dx], [0, s, cy - s * cy + dy]])
    return cv2.warpAffine(rgb, M, (w, h), flags=cv2.INTER_LINEAR, borderValue=(0, 0, 0))

def _fit_cover(rgb, W, H):
    """Scale a layer to COVER a WxH canvas (fill, preserve aspect, centre-crop the overflow)."""
    h, w = rgb.shape[:2]
    if (w, h) == (W, H):
        return rgb
    s = max(W / w, H / h)
    rw, rh = max(1, round(w * s)), max(1, round(h * s))
    r = cv2.resize(rgb, (rw, rh), interpolation=cv2.INTER_LANCZOS4 if s < 1 else cv2.INTER_LINEAR)
    x0 = (rw - W) // 2; y0 = (rh - H) // 2
    return r[y0:y0 + H, x0:x0 + W]

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
    raw = []
    for L in b["layers"]:
        p = os.path.join(ld, L["src"] + ".png")
        if not os.path.exists(p):
            print(f"*** MISSING LAYER {p} ***"); sys.exit(1)
        raw.append((L, np.asarray(Image.open(p).convert("RGB"))))
    # canvas: brief 'canvas' (W,H) → cover-fit each layer to it (board-effect row plates); else the square layer size.
    if "canvas" in b:
        resW, resH = b["canvas"]
        layers = [(L, _fit_cover(rgb, resW, resH)) for L, rgb in raw]
    else:
        resH, resW = raw[0][1].shape[:2]; layers = raw

    # pre-extract particle blobs (once) + assign deterministic per-particle attributes
    cx0, cy0 = resW / 2.0, resH / 2.0; rref = min(resW, resH) / 2.0    # centre + radius reference (non-square safe)
    parts_meta = []
    for L, rgb in layers:
        if L["kind"] != "particles":
            parts_meta.append(None); continue
        blobs = _extract_particles(rgb, L["lum_thresh"], L["min_area"])
        ef0, ef1 = L["emit_frames"]; ir = L["inner_radius"] * rref; ib = L["inner_boost"]
        s0, s1 = L["speed_px_s"]; jit = math.radians(L["jitter_deg"]); l0, l1 = L["life_frames"]
        drift = L.get("drift", "up"); die_by = L.get("die_by", N)   # T83: radial-outward burst + a per-brief death-by frame (default N)
        for pt in blobs:
            r = math.hypot(pt["cx"] - cx0, pt["cy"] - cy0)
            inner = r <= ir
            # centre-weighted burst: inner blobs are inner_boost× more likely to fire in frames ef0..ef0+1
            choices = list(range(ef0, ef1 + 1))
            weights = [(ib if (inner and fr <= ef0 + 1) else 1.0) for fr in choices]
            pt["act"] = random.choices(choices, weights=weights, k=1)[0]
            ajit = random.uniform(-jit, jit)                           # angle jitter (draw order PRESERVED = the old `theta`, so the up-drift path is byte-identical)
            spd = random.uniform(s0, s1)
            if drift == "radial":                                      # radially OUTWARD from centre (T83 damage burst)
                ang = math.atan2(pt["cy"] - cy0, pt["cx"] - cx0) + ajit
                pt["vx"] = math.cos(ang) * spd; pt["vy"] = math.sin(ang) * spd
            else:                                                      # upward (default: c1a / gayatri, unchanged)
                pt["vx"] = math.sin(ajit) * spd; pt["vy"] = -math.cos(ajit) * spd
            pt["life"] = max(1, min(random.randint(l0, l1), die_by - pt["act"]))   # clamp: dead by `die_by` (default N). VETO "all dead / final frame black". die_by=N leaves c1a/gayatri unchanged.
        parts_meta.append({"blobs": blobs, "fade": L["fade_frames"], "op_cap": L.get("op_cap", 1.0)})

    od = os.path.join(SEQ, name); os.makedirs(od, exist_ok=True)
    for old in os.listdir(od):                                         # clean stale frames (rerunnable)
        if old.startswith("frame_"): os.remove(os.path.join(od, old))

    for f in range(1, N + 1):
        canvas = np.zeros((resH, resW, 3), np.float32)
        for (L, rgb), pm in zip(layers, parts_meta):
            if L["kind"] == "xform":
                op = _seg_val(L.get("opacity", []), f, 0.0, hold=False)
                if "op_sine" in L:                              # a luminance BREATHE across a hold (single sine arc, base+amp*sin)
                    f0, f1, base, amp = L["op_sine"]
                    if f0 <= f <= f1:
                        op = base + amp * math.sin(((f - f0) / (f1 - f0)) * math.pi)
                if "op_keys" in L:                              # PER-FRAME keyed opacity (electric flicker/restrike) — [firstFrame, [v0,v1,...]]; overrides segments for its span
                    kf0, kvals = L["op_keys"]
                    if kf0 <= f < kf0 + len(kvals):
                        op = kvals[f - kf0]
                if op <= 0.0:
                    continue
                if "scale_sine" in L:
                    f0, f1, base, amp = L["scale_sine"]
                    ph = 0.0 if f < f0 else (1.0 if f > f1 else (f - f0) / (f1 - f0))
                    sc = base + amp * math.sin(ph * math.pi)
                else:
                    sc = _seg_val(L.get("scale", []), f, 1.0, hold=True)
                dy = 0.0
                if "drift_up" in L:                             # subtle upward positional lift across a span [f0,f1,total_px]
                    df0, df1, dpx = L["drift_up"]
                    if f >= df0:
                        dy = -dpx * min(1.0, (f - df0) / max(1, df1 - df0))
                canvas += _warp(rgb, sc, 0.0, dy, L.get("scale_anchor", "center")).astype(np.float32) * op
            else:  # particles
                fade = pm["fade"]; cap = pm["op_cap"]
                for pt in pm["blobs"]:
                    age = f - pt["act"]
                    if not one_shot:
                        age = (f - pt["act"]) % N                      # LOOP: lifecycle wraps
                    if age < 0 or age >= pt["life"]:
                        continue
                    op = cap                                           # T83: per-shard opacity cap (default 1.0)
                    if age >= pt["life"] - fade:                       # fast-fade over the final `fade` frames
                        op = cap * max(0.0, (pt["life"] - age) / float(fade))
                    dx = pt["vx"] * (age / fps); dy = pt["vy"] * (age / fps)
                    _add_patch(canvas, pt["patch"], pt["x0"] + dx, pt["y0"] + dy, op)
        Image.fromarray(np.clip(canvas, 0, 255).astype(np.uint8), "RGB").save(
            os.path.join(od, f"frame_{f:03d}.png"))

    mode = "one-shot" if one_shot else "looping"
    print(f"animate_vfx '{name}': {N} frames @ {fps}fps ({mode}), {resW}x{resH} true-black, "
          f"{len(parts_meta[[i for i,(L,_) in enumerate(layers) if L['kind']=='particles'][0]]['blobs']) if any(L['kind']=='particles' for L,_ in layers) else 0} particles → {od}")

if __name__ == "__main__":
    render(sys.argv[1] if len(sys.argv) > 1 else "c1a_deva")
