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

  # SHIELD FORMATION — the state-ARRIVAL class: a barrier FORMS (not an impact). RING first (the anchor beat), DOME rises
  # from it, calm strength. Weight sits BETWEEN the status ticks and a landing. 14 frames = 583ms @24fps (~0.875s at 16fps),
  # one-shot, 1254² square. ALL whole-layer (no particle extraction — a formation does not scatter). Reuses scale_anchor +
  # op_sine (no new vocabulary). This is the ARRIVAL only; the persistent shield state stays on the .shieldbadge.
  "shield": {
    "seed": 0x5A1E1D, "fps": 24, "frames": 14, "one_shot": True, "layers_dir": "shield",
    "layers": [
      # L2 RING — fires FIRST: 2-frame snap (the ground circle inscribes), hold, fade.
      { "src": "L2_ring", "kind": "xform",
        "opacity": [[1, 2, 0.0, 0.8, "out"], [3, 9, 0.8, 0.8, "lin"], [10, 14, 0.8, 0.0, "out"]],
        "scale":   [[1, 2, 0.85, 1.0, "out"]] },
      # L1 DOME — rises FROM the ring plane (bottom-anchored scale 0.25→1.0), holds with a single breathe, hands off by 14.
      { "src": "L1_dome", "kind": "xform", "scale_anchor": "bottom",
        "opacity": [[3, 7, 0.0, 0.75, "io"], [11, 14, 0.75, 0.0, "out"]],
        "op_sine": [8, 10, 0.75, 0.07],   # hold-breathe 0.75→0.82→0.75 (the barrier is alive)
        "scale":   [[3, 7, 0.25, 1.0, "io"]] },
      # L3 GLOW — capped 0.35 (the source is the brightest glow in the library; the cap holds the weight band).
      { "src": "L3_glow", "kind": "xform",
        "opacity": [[2, 6, 0.0, 0.35, "out"], [7, 10, 0.35, 0.35, "lin"], [11, 14, 0.35, 0.0, "out"]] },
    ],
  },

  # VENOM TICK — the LIGHTEST effect in the library (≤ the damage tick), fires on venom application AND each drain. Venom
  # SEEPS DOWNWARD (damage bursts out, buff rises, venom falls — the direction triad closes). 10 frames = 417ms @24fps
  # (~0.625s at 16fps, the SHORTEST), one-shot, 1254² square. Acid-green. All caps below damage's (0.55/0.6/0.3). L2 = drops.
  "venom": {
    "seed": 0x7E4032, "fps": 24, "frames": 10, "one_shot": True, "layers_dir": "venom",
    "layers": [
      # L1 SPLASH — 2-frame snap CAPPED at 0.55 (under damage's 0.7), fast die.
      { "src": "L1_splash", "kind": "xform",
        "opacity": [[1, 2, 0.0, 0.55, "out"], [3, 6, 0.55, 0.0, "in"]],
        "scale":   [[1, 2, 0.94, 1.0, "out"]] },
      # L2 DROPS — seep DOWNWARD (staggered 1-4, not a burst), capped 0.6, dead by 9.
      { "src": "L2_drops", "kind": "particles",
        "emit_frames": [1, 4], "inner_radius": 1.0, "inner_boost": 1.0, "drift": "down",
        "speed_px_s": [35, 75], "jitter_deg": 5.0, "life_frames": [4, 7], "fade_frames": 2,
        "op_cap": 0.6, "die_by": 9, "lum_thresh": 40, "min_area": 3 },
      # L3 GLOW — the DIMMEST glow in the library, capped 0.3, rise/hold/fade, alive at 9, black at 10.
      { "src": "L3_glow", "kind": "xform",
        "opacity": [[1, 3, 0.0, 0.3, "out"], [4, 6, 0.3, 0.3, "lin"], [7, 10, 0.3, 0.0, "out"]] },
    ],
  },

  # CHAOS WASH — the Asura storm that the weapons carry: a wild, rolling, UNSTABLE row plate over the surging half. 24 frames
  # = 1000ms @24fps (~1.5s at 16fps), one-shot, 1920×640 cover-fit (mixed source dims). All whole-layer (arcs FLICKER, not
  # extract). Seed 0xC4057A is ODD → storm_sign +1 → the storm rolls RIGHT (+30px). W2 edge law (top/bottom fade, L/R burn).
  "chaos_wash": {
    "seed": 0xC4057A, "fps": 24, "frames": 24, "one_shot": True, "layers_dir": "chaos_wash", "canvas": (1920, 640),
    "layers": [
      # L1 STORM — rolls in, breathes hot, fades; horizontal ROLL +30px across life (seed → right).
      { "src": "L1_storm", "kind": "xform",
        "opacity":  [[1, 4, 0.0, 0.8, "out"], [15, 24, 0.8, 0.0, "in"]],
        "op_sine":  [5, 14, 0.8, 0.10],   # breathes hot 0.8→0.9→0.8
        "drift_x":  [1, 24, 30] },
      # L2 ARCS — ERRATIC flicker (spikes and dips, NOT a clean decay — chaos), scale creep.
      { "src": "L2_arcs", "kind": "xform",
        "op_keys": [2, [0.7, 0.3, 0.85, 0.45, 0.6, 0.25, 0.75, 0.35, 0.5, 0.2, 0.55, 0.3, 0.4, 0.15, 0.25, 0.1, 0.0]],   # frames 2-18
        "scale":   [[2, 18, 1.0, 1.04, "lin"]] },
      # L3 GLOW — rise/hold/fade, last alive at 23, black at 24.
      { "src": "L3_glow", "kind": "xform",
        "opacity": [[1, 6, 0.0, 0.5, "out"], [7, 16, 0.5, 0.5, "lin"], [17, 24, 0.5, 0.0, "out"]] },
    ],
  },

  # CHAOS MARK — where the storm LANDS: an erratic spark on the blessed unit, tick-scale. 12 frames = 500ms @24fps, one-shot,
  # 1254² square, both whole-layer. Erratic op_keys flicker (distinct from Vajra's ORDERLY restrike — chaos is never clean).
  "chaos_mark": {
    "seed": 0xC4A12A, "fps": 24, "frames": 12, "one_shot": True, "layers_dir": "chaos_mark",
    "layers": [
      # L1 CRACKLE — 2-frame snap, then erratic flicker, dead by 9. Scale creeps 0.9→1.05→1.1.
      { "src": "L1_crackle", "kind": "xform",
        "opacity": [[1, 2, 0.0, 0.75, "out"]],
        "op_keys": [3, [0.75, 0.4, 0.65, 0.3, 0.45, 0.2, 0.0]],   # frames 3-9 erratic
        "scale":   [[1, 2, 0.9, 1.05, "out"], [3, 9, 1.05, 1.1, "lin"]] },
      # L2 GLOW — capped 0.35, rise/hold/fade, alive at 11, black at 12.
      { "src": "L2_glow", "kind": "xform",
        "opacity": [[1, 3, 0.0, 0.35, "out"], [4, 8, 0.35, 0.35, "lin"], [9, 12, 0.35, 0.0, "out"]] },
    ],
  },

  # PASHUPATASTRA — Brahmastra's INVERSE: it CONSUMES. Everything converges inward (ash drawn to the void), the vortex
  # breathes wider then SNAPS SHUT. Same mythic weight + four-beat skeleton, mirrored flow. 40 frames = 1667ms @24fps
  # (~2.5s at 16fps, matching Brahmastra), one-shot, 1920×640 cover-fit. The VIOLET is the F2 exemption (nothing else wears it).
  # Beat-3 L1 breathe = OPACITY (op_sine dip 1.0→0.92→1.0) — scale_sine can't do a partial breathe (it holds a scale ramp on
  # either side); reported. drift:'inward' (radial inverse) + rotate (15° churn) are the new vocabulary.
  "pashupatastra": {
    "seed": 0x9A54BA, "fps": 24, "frames": 40, "one_shot": True, "layers_dir": "pashupatastra", "canvas": (1920, 640),
    "layers": [
      # L1 VORTEX — beat 2 TEARS open (2-frame snap + scale 0.6→1.0), beat 3 holds + breathes, beat 4 COLLAPSES to a point
      # (scale 1.0→0.15). Slow rotation 15° across its whole life (slow reads as massive).
      { "src": "L1_vortex", "kind": "xform",
        "opacity": [[11, 12, 0.0, 1.0, "out"], [13, 28, 1.0, 1.0, "lin"], [29, 36, 1.0, 0.0, "in"]],
        "op_sine": [15, 28, 1.0, -0.08],   # beat-3 breathe: opacity dip 1.0→0.92→1.0
        "scale":   [[11, 14, 0.6, 1.0, "out"], [15, 28, 1.0, 1.0, "lin"], [29, 36, 1.0, 0.15, "in"]],
        "rotate":  [11, 36, 15] },
      # L2 ARCS — beat 3 erratic flicker (the world crackling as it is unmade), dead by 26.
      { "src": "L2_arcs", "kind": "xform",
        "op_keys": [15, [0.8, 0.4, 0.7, 0.35, 0.55, 0.3, 0.6, 0.25, 0.4, 0.15, 0.2, 0.0]],   # frames 15-26
        "scale":   [[15, 26, 1.0, 1.04, "lin"]] },
      # L3 ASH — INWARD-drifting particles in two cohorts: early (20%, beat 1, slow pull) + main (80%, beat 3, fast consumption).
      # Deaths near the centre are CORRECT (ash vanishing into the void), all clamped dead by 32.
      { "src": "L3_ash", "kind": "particles", "drift": "inward",
        "cohorts": [ {"frac": 0.2, "emit_frames": [3, 10],  "speed_px_s": [20, 40],  "life_frames": [12, 22]},
                     {"frac": 0.8, "emit_frames": [15, 20], "speed_px_s": [60, 110], "life_frames": [8, 16]} ],
        "emit_frames": [3, 20], "inner_radius": 1.0, "inner_boost": 1.0, "speed_px_s": [20, 110], "life_frames": [8, 22],
        "jitter_deg": 12.0, "fade_frames": 2, "die_by": 32, "lum_thresh": 44, "min_area": 3 },
      # L4 GLOW — beat 1 dread rises SLOWLY (ease-in, the inverse of Brahmastra's snap), deepens, holds, lifts LAST (black at 40).
      { "src": "L4_glow", "kind": "xform",
        "opacity": [[1, 10, 0.0, 0.5, "in"], [11, 14, 0.5, 0.7, "lin"], [15, 28, 0.7, 0.7, "lin"], [29, 40, 0.7, 0.0, "out"]] },
    ],
  },

  # SUDARSHANA CHAKRA — the THROWN spinning discus (second Deva Mythic; the rotate + squash_y vocabulary showcase). It is
  # HURLED flat across the board: a face-on serrated disc spinning in its own plane, foreshortened by squash_y 0.35 to an
  # ellipse (frisbee perspective), that flies to the struck hero and BITES (sparks + glow at arrival). Target-strike class
  # (square, source-res, 18f one-shot). TWO PHASES: FLIGHT f1-8 (squashed disc + trail only, no sparks/glow) → IMPACT f9-18
  # (disc passes THROUGH + radial spark burst + glow bloom). STROBE FIX A stands: rotation 84° across f1-12 (~7.6°/frame,
  # under a tooth-gap) so the rim TRACKS during flight. The cross-board TRAVEL is a RUNTIME concern (addSheetSpr travel) —
  # the compositor renders the disc IN PLACE, squashed + spinning; the runtime carries it from the caster's half to the target.
  "sudarshana": {
    "seed": 0x5DA12A, "fps": 24, "frames": 18, "one_shot": True, "layers_dir": "sudarshana",
    "layers": [
      # L1 DISCUS — FLIGHT f1-8: 2-frame rise to 0.85, spins as a squashed (0.35) ellipse; CONTACT PIN f9-10: HELD at full
      # presence (it bites before it vanishes); PASS-THROUGH f11-13: fade to 0 (the disc passes on). (3f addendum.)
      { "src": "L1_discus", "kind": "xform", "squash_y": 0.35,
        "opacity": [[1, 2, 0.0, 0.85, "out"], [3, 10, 0.85, 0.85, "lin"], [11, 13, 0.85, 0.0, "in"]],
        "scale":   [[1, 3, 0.9, 1.0, "out"], [4, 13, 1.0, 1.05, "lin"]],
        "rotate":  [1, 12, 84] },
      # L2 TRAIL — the squashed (0.35) spin-blur ring, MATCHED rotation, 0.6, lags the disc on arrival + lingers 2f past.
      { "src": "L2_trail", "kind": "xform", "squash_y": 0.35,
        "opacity": [[2, 3, 0.0, 0.6, "out"], [4, 10, 0.6, 0.6, "lin"], [11, 14, 0.6, 0.0, "in"]],
        "scale":   [[2, 14, 1.0, 1.06, "lin"]],
        "rotate":  [1, 12, 84] },
      # L3 SPARKS — IMPACT ONLY: RADIAL burst at the BITE (emit f9-11, the T91 numbers), consumed outward, dead by 18. NOT squashed (a round bite).
      { "src": "L3_sparks", "kind": "particles", "drift": "radial",
        "emit_frames": [9, 11], "inner_radius": 1.0, "inner_boost": 1.0, "speed_px_s": [80, 150], "life_frames": [6, 12],
        "jitter_deg": 14.0, "fade_frames": 2, "die_by": 18, "lum_thresh": 44, "min_area": 3 },
      # L4 GLOW — IMPACT ONLY: rises f9-12 to 0.5 at the bite, lingers, black at 18. NOT squashed (a round bloom).
      { "src": "L4_glow", "kind": "xform",
        "opacity": [[9, 12, 0.0, 0.5, "out"], [13, 15, 0.5, 0.5, "lin"], [16, 18, 0.5, 0.0, "out"]] },
    ],
  },

  # NAGAPASHA — SERPENT-NOOSE BIND ARRIVAL (target-strike class; RESTRAINT register, NOT a kill — NO hit-stop anywhere).
  # Target-local (Vajra-anchored, no travel — beats 1-2 merge: the cast wash flickers AT the target as the coils converge).
  # 18f one-shot @24fps, 768x768 working. Uses the T94 xform-cohorts + radial-drift primitives for the converging coils.
  # op_cap is NOT ported to xform (ruling) → the L1/L3 caps are BAKED into the op values. RULED (T94 squint): the coils
  # carry a CONSTANT squash_y 0.92 — deliberate, NOT the brief's "final 3 frames" (windowed squash would be a 3rd primitive,
  # declined). Frames are the compositor's 1-based (brief f0-f17 → f1-f18).
  "nagapasha": {
    "seed": 0xBA9A5A, "fps": 24, "frames": 18, "one_shot": True, "layers_dir": "nagapasha", "canvas": (768, 768),
    "layers": [
      # L1 WASH — CAST (the noose thrown, not summoned): low, brief flicker (f1-f5). op_keys peak BAKED to the 0.35 cap.
      { "src": "nagapasha_wash", "kind": "xform",
        "op_keys": [1, [0.0, 0.32, 0.15, 0.35, 0.0]],
        "scale":   [[1, 5, 0.9, 1.05, "io"]] },
      # L2 COIL — CONVERGE: 3 cohorts (base 0/135/250 ±15 jitter, counter-rotating +2.5/-2.0/+1.7 deg/frame), radial drift
      # 0.85→0.30 of cell (io), scale 0.55, squash_y 0.92 (constant — see header note). f3-f16.
      { "src": "nagapasha_coil", "kind": "xform", "squash_y": 0.92, "cohort_jitter_deg": 15.0,
        "cohorts": [ {"base_rotation": 0,   "rotate_rate":  2.5},
                     {"base_rotation": 135, "rotate_rate": -2.0},
                     {"base_rotation": 250, "rotate_rate":  1.7} ],
        "radial":  {"radius_start": 0.85, "radius_end": 0.30, "frames": [3, 14]},
        "opacity": [[3, 6, 0.0, 0.8, "io"], [6, 11, 0.8, 0.8, "lin"], [11, 14, 0.8, 0.5, "io"], [14, 16, 0.5, 0.0, "out"]],
        "scale":   [[3, 14, 0.55, 0.55, "lin"]] },
      # L3 NOOSE — SEIZE: the cinch (scale 1.15→0.88 io f10-f14), slow spin (+1.2 deg/frame), ONE op_sine breathe pulse
      # (f14-f17, peak BAKED to the 0.85 cap). NO hit-stop at the cinch. f10-f18.
      { "src": "nagapasha_noose", "kind": "xform",
        "opacity": [[10, 14, 0.0, 0.72, "io"], [17, 18, 0.72, 0.0, "out"]],
        "op_sine": [14, 17, 0.72, 0.13],
        "scale":   [[10, 14, 1.15, 0.88, "io"], [14, 18, 0.88, 0.88, "lin"]],
        "rotate":  [10, 18, 9.6] },
      # L4 RESIDUE — SETTLE (arrival-only → hands off to the ⛓ bindbadge): op ramp then die_by fade to 0 at f18. f14-f18.
      { "src": "nagapasha_residue", "kind": "xform", "scale_anchor": "bottom",
        "opacity": [[14, 16, 0.0, 0.4, "io"], [16, 18, 0.4, 0.0, "out"]],
        "scale":   [[14, 18, 0.9, 0.9, "lin"]] },
    ],
  },

  # PAVAMANA — the PURIFYING CHANT wash (BOARD SETTLE class, Gayatri SIBLING). SERENE, friendly-half — a chant, NOT a strike:
  # no hit-stop/shake/impact anywhere. Anti-venom: PURITY ONLY, nothing green added. 36f one-shot @24fps, 1920x640 row plate —
  # MATCHES Gayatri (the T95 brief's 48f rescaled ×0.75 per the Q4 ruling; windows below). op_cap is NOT ported to xform →
  # the caps are BAKED into the op values. L3 = the DERIVED pavamana_ribbons_wide (owner ruling OPTION D: 3 curls at 20/50/80%
  # composited by scripts/make_pavamana_ribbons_wide.py — NO new compositor vocabulary) rendered as ONE unified rise (rotate 0
  # — a chant breathes together). DIRECTION LAW: everything RISES, nothing descends. Frames 1-based (owner's 0-based +1).
  "pavamana": {
    "seed": 0xFA7A4A, "fps": 24, "frames": 36, "one_shot": True, "layers_dir": "pavamana", "canvas": (1920, 640),
    "layers": [
      # L1 FLOOR — GROUND GLOW (the quiet base everything sits on): op ramp to the 0.30 cap (f1-7), hold, die_by fade f29-34.
      # No drift. Position baked (the glow sits in the sprite's lower third → cover-fit lands it at the plate bottom).
      { "src": "pavamana_floor", "kind": "xform",
        "opacity": [[1, 7, 0.0, 0.20, "lin"], [7, 29, 0.20, 0.20, "lin"], [29, 34, 0.20, 0.0, "out"]] },   # T95 item-6: 0.30→0.20 so the floor glow's plate-bottom bleed clears the row-plate edge law (the quiet base stays visible)
      # L2 BAND — THE BREATH ARRIVES: spans the width; op ramp io to ~0.72 (f1-10), gentle breathe (op_sine, capped ≤0.75)
      # f10-28, die_by fade f25-31. drift_x = seed-signed SLOW roll (the river flows one way, the seed decides which).
      { "src": "pavamana_band", "kind": "xform",
        "opacity": [[1, 10, 0.0, 0.72, "io"], [25, 31, 0.72, 0.0, "out"]],
        "op_sine": [10, 28, 0.67, 0.08],
        "drift_x": [1, 30, 40] },
      # L3 RIBBONS (derived wide) — THE LIFT: ONE xform layer, unified SLOW rise (drift up), rotate 0, scale_anchor bottom,
      # op ramp to 0.6 (f9-13), hold, die_by fade f23-28. The impurity rising off the row — reads as release, not smoke.
      { "src": "pavamana_ribbons_wide", "kind": "xform", "scale_anchor": "bottom",
        "opacity": [[9, 13, 0.0, 0.6, "io"], [13, 23, 0.6, 0.6, "lin"], [23, 28, 0.6, 0.0, "out"]],
        "drift_up": [9, 28, 60] },
      # L4 MOTES — THE GAINS: spans the width (upper-two-thirds baked), very-slow rise; gentle SHIMMER (op_keys, capped ≤0.55,
      # spread across f12-33 — never strobing, frame-to-frame Δ ≤0.15), die_by fade in the tail.
      { "src": "pavamana_motes", "kind": "xform",
        "op_keys": [12, [0.0, 0.15, 0.3, 0.42, 0.5, 0.46, 0.52, 0.48, 0.55, 0.5, 0.53, 0.47, 0.52, 0.45, 0.5, 0.42, 0.46, 0.38, 0.42, 0.3, 0.18, 0.0]],
        "drift_up": [12, 33, 30] },
    ],
  },

  # AHAMKARA — the EGO WEAPON arrival (unit-anchored SQUARE, Vajra cell class; DARK-BUFF register — the buff family's
  # crimson mirror). Glorification, NOT damage: no hit-stop/shake/dissolve, nothing strikes — the unit exalts itself.
  # Crimson-first, gold-within; direction UP (everything rises); ARRIVAL-ONLY (R38: the doomed unit clears silently with the
  # board — no round-end moment). 24f one-shot @24fps, square canvas (1254). All caps BAKED into op values (op_cap is
  # particle-only). Single-draw layers — the T94 xform primitives are NOT used. Frames 1-based (brief f0-f23 → f1-f24).
  "ahamkara": {
    "seed": 0xA44A2A, "fps": 24, "frames": 24, "one_shot": True, "layers_dir": "ahamkara", "canvas": (1254, 1254),
    "layers": [
      # L1 WASH — IGNITE (the crimson ground): scale 0.9→1.05 (io), op ramp to the 0.35 cap (f1-5), hold, die_by fade f14-19.
      { "src": "ahamkara_wash", "kind": "xform",
        "opacity": [[1, 5, 0.0, 0.35, "lin"], [5, 14, 0.35, 0.35, "lin"], [14, 19, 0.35, 0.0, "out"]],
        "scale":   [[1, 19, 0.9, 1.05, "io"]] },
      # L2 SEAL — THE GROUND RING (squint retune: THE SEAL, not a crown). Ignites FIRST and renders BEFORE the pillar so the
      # fire stands INSIDE the circle. The ring flattened to a perspective ground ellipse (squash_y 0.34) pinned at the cell
      # base (scale_anchor bottom — same anchor as the pillar), slowly turning. op ramp to 0.7 (f2-5), one op_sine breathe
      # (f7-13, amp 0.12), die_by fade f15-21. (Q4: no doomed marker → fades clean.)
      { "src": "ahamkara_halo", "kind": "xform", "scale_anchor": "bottom", "squash_y": 0.34,
        "opacity": [[2, 5, 0.0, 0.7, "io"], [5, 15, 0.7, 0.7, "lin"], [15, 21, 0.7, 0.0, "out"]],
        "op_sine": [7, 13, 0.7, 0.12],
        "scale":   [[2, 21, 0.9, 0.9, "lin"]],
        "rotate":  [2, 21, 15.2] },
      # L3 PILLAR — THE ASCENT (rises OUT of the lit seal, grows UP from the base — the rise is the read): scale_anchor bottom,
      # scale 0.72→1.0 (io, f5-14) then holds; op ramp to 0.85 (f5-9), one op_sine breathe (f10-15, the fire exults), die_by
      # fade f16-21. No drift. The baked base fire-pool now pools INSIDE the seal ring (owner-ruled: keep).
      { "src": "ahamkara_pillar_aligned", "kind": "xform", "scale_anchor": "bottom",
        "opacity": [[5, 9, 0.0, 0.85, "io"], [16, 21, 0.85, 0.0, "out"]],
        "op_sine": [10, 15, 0.85, 0.08],
        "scale":   [[5, 14, 0.72, 1.0, "io"], [14, 21, 1.0, 1.0, "lin"]] },
      # L4 EMBERS — RISING SPARKS (last layer standing, drawn on top): slow drift up, gentle flicker (op_keys, capped ≤0.55,
      # spread f3-24, never strobing — Δ≤0.15), fades in the tail.
      { "src": "ahamkara_embers", "kind": "xform",
        "op_keys": [3, [0.0, 0.12, 0.25, 0.35, 0.45, 0.4, 0.5, 0.45, 0.55, 0.5, 0.52, 0.46, 0.5, 0.44, 0.48, 0.4, 0.44, 0.36, 0.4, 0.28, 0.15, 0.0]],
        "drift_up": [3, 24, 40] },
    ],
  },

  # T98 SANJIVANI CORRUPTION — DARK REVIVAL ARRIVAL (unit-anchored square, EMERGENCE register — the dark mirror of a landing).
  # ONE stolen unit is DRAGGED BACK to the Asura board; the ground exhales, crimson wells up HEAVILY from beneath, corruption-threads
  # claim the space, ash settles. Register law: emergence NOT impact (no hit-stop/shake/dissolve — nothing is struck), COLD (crimson +
  # ash-grey, NO gold, no green, no violet), everything rises but HEAVILY (labored ease, not eager). Ahamkara is ego's blaze; this is the
  # grave's cold — side by side it must read heavier and colder, never brighter/fierier. Single-draw layers (T94 primitives NOT used).
  # The brief's design timeline is 0-based (f0-f27, 28 frames); the compositor is 1-based, so every window is shifted +1 (f0-f22 → 1-23,
  # etc.) — relative timing preserved. Worst-case-sum clamp (owner-checked): shroud 1-23 · surge 6-21 · threads 13-25 · ashes 9-28, all ≤28.
  "sanjivani": {
    "seed": 0x5A9A11, "fps": 24, "frames": 28, "one_shot": True, "layers_dir": "sanjivani", "canvas": (1254, 1254),
    "layers": [
      # L1 shroud — THE GRAVE BREATH (the mist gathers SLOWLY): cover-fit, anchored low (scale_anchor bottom, scale 1.0 constant),
      # op ramp 0→0.4 over f0-f6 (slow — the grave exhales), hold, die_by fade f16-f22. No drift.
      { "src": "sanjivani_shroud", "kind": "xform", "scale_anchor": "bottom",
        "opacity": [[1, 7, 0.0, 0.4, "lin"], [7, 17, 0.4, 0.4, "lin"], [17, 23, 0.4, 0.0, "out"]],
        "scale":   [[1, 23, 1.0, 1.0, "lin"]] },
      # L2 surge — THE EMERGENCE (crimson wells up from beneath, LABORED): scale_anchor bottom (the eruption sources below the cell edge
      # and rises from beneath the board), scale 0.6→0.95 io f5-f16 (SLOWER than Ahamkara's rise — dragged, not eager), op ramp 0→0.8
      # f5-f10, hold, die_by fade f15-f20. NO breathe (the grave does not exult — no op_sine).
      { "src": "sanjivani_surge", "kind": "xform", "scale_anchor": "bottom",
        "opacity": [[6, 11, 0.0, 0.8, "lin"], [11, 16, 0.8, 0.8, "lin"], [16, 21, 0.8, 0.0, "out"]],
        "scale":   [[6, 17, 0.6, 0.95, "io"], [17, 21, 0.95, 0.95, "lin"]] },
      # L3 threads — THE CLAIMING (corruption-threads reach and turn, thin-and-smoky): cover-fit, scale 0.9, drift_up very slow,
      # rotate +0.5 deg/frame (6° across the window), op ramp 0→0.5 f12-f16, die_by fade f19-f24.
      { "src": "sanjivani_threads", "kind": "xform",
        "opacity": [[13, 17, 0.0, 0.5, "lin"], [17, 20, 0.5, 0.5, "lin"], [20, 25, 0.5, 0.0, "out"]],
        "scale":   [[13, 25, 0.9, 0.9, "lin"]],
        "rotate":  [13, 25, 6.0],
        "drift_up": [13, 25, 14] },
      # L4 ashes — THE SETTLING (last layer standing, the slowest drift in the catalog): cover-fit, drift_up BARELY, op_keys flicker
      # (the owner's 7 sparse keys [0.0,0.25,0.4,0.3,0.45,0.25,0.0] expanded per-frame across f8-f27 → cap 0.45 baked, Δ≤0.15, no strobe),
      # fades in the tail (f23-f27 = the trailing 0.30→0.0). Frames 9-28 (1-based).
      { "src": "sanjivani_ashes", "kind": "xform",
        "op_keys": [9, [0.0, 0.08, 0.16, 0.24, 0.29, 0.34, 0.38, 0.38, 0.35, 0.32, 0.32, 0.37, 0.42, 0.43, 0.37, 0.30, 0.24, 0.16, 0.08, 0.0]],
        "drift_up": [9, 28, 7] },
    ],
  },

  # T100-R DEVA HERO ENTRY (GRAND retune) — THE catalog CEILING (hero-class weight ABOVE landing 1.0). Sovereign, radiant, descending
  # glory; no hit-stop (the heavens ARRIVE, nothing is struck). Pure Deva white-gold. Single-draw layers (T94 primitives unused). Now
  # 34 frames — the PEAK LINGERS (the beam holds at FULL for 9 frames; the crown blooms PAST the cell edge, A5 mask crops the overhang).
  # Design timeline 0-based (f0-f33) → compositor 1-based (+1). WORST-CASE-SUM (owner-checked): rays 1-14 · motes 3-31 · beam 5-23 ·
  # corona 15-29, all ≤34. Beam v2 = blazing pillar spanning the middle half (floor 0, sides black); corona v2 = 93%-wide sun-crown.
  "deva_hero_entry": {
    "seed": 0xDE7AE1, "fps": 24, "frames": 34, "one_shot": True, "layers_dir": "deva_hero", "canvas": (1254, 1254),
    "layers": [
      # L1 rays — THE HERALD (dawn breaks before the king): scale_anchor bottom, scale 0.85→1.0 io; op ramp 0→0.75 (f0-f4), hold, die_by fade f9-f13.
      { "src": "deva_hero_rays", "kind": "xform", "scale_anchor": "bottom",
        "opacity": [[1, 5, 0.0, 0.75, "io"], [5, 10, 0.75, 0.75, "lin"], [10, 14, 0.75, 0.0, "out"]],
        "scale":   [[1, 14, 0.85, 1.0, "io"]] },
      # L2 motes — GLORY DUST: cover-fit; gentle per-frame shimmer (cap 0.5 baked, Δ≤0.15 no strobe), extended to f2-f30, fades in the tail (trailing 0.30→0).
      { "src": "deva_hero_motes", "kind": "xform",
        "op_keys": [3, [0.0, 0.12, 0.25, 0.35, 0.42, 0.38, 0.45, 0.40, 0.48, 0.43, 0.50, 0.44, 0.48, 0.42, 0.46, 0.40, 0.44, 0.40, 0.46, 0.41, 0.47, 0.42, 0.44, 0.38, 0.30, 0.22, 0.14, 0.07, 0.0]] },
      # L3 beam — THE DESCENT + LINGERING BLAZE (the arrival IS the opacity bloom; the HOLD AT FULL is the grandness): cover-fit full cell height; op ramp 0→1.0 io (f4-f8), HOLD AT FULL f8-f17, die_by fade f17-f22; scale 1.06→1.0 io (settling, f4-f10); NO drift.
      { "src": "deva_hero_beam", "kind": "xform",
        "opacity": [[5, 9, 0.0, 1.0, "io"], [9, 18, 1.0, 1.0, "lin"], [18, 23, 1.0, 0.0, "out"]],
        "scale":   [[5, 11, 1.06, 1.0, "io"], [11, 23, 1.0, 1.0, "lin"]] },
      # L4 corona — THE CROWN OF ARRIVAL (blooms PAST the cell edge as the beam hands off — the mask crops the overhang, intended): centred; scale 0.7→1.45 io (f14-f21) then holds; op ramp 0→1.0 io (f14-f17), ONE op_sine breathe (base 0.9 amp 0.1 → peaks at 1.0, no dip since the io ramp meets it), die_by fade f23-f28. op_sine end (0.9)=fade start → continuous.
      { "src": "deva_hero_corona", "kind": "xform",
        "opacity": [[15, 18, 0.0, 1.0, "io"], [24, 29, 0.9, 0.0, "out"]],
        "op_sine": [18, 24, 0.9, 0.1],
        "scale":   [[15, 22, 0.7, 1.45, "io"], [22, 29, 1.45, 1.45, "lin"]] },
    ],
  },

  # T100-R DEVA HERO AURA (GRAND retune + NEW halo layer) — serene idle breathing; the T99 ping-pong loop's FIRST consumer. 12 frames
  # (0..11; runtime plays 0..11..0). REVERSAL-SYMMETRY LAW: opacity/scale oscillation ONLY — ZERO drift AND ZERO rotate anywhere (a
  # reversed rotation is visible wrong-way motion; the halo breathes, it does NOT spin). The io ramp is a smooth half-cycle (zero
  # velocity at f1/f12) → the ping-pong reflection completes the breath, no kink at the reversal. Pure Deva white-gold. The grandness is
  # the NEW L3 halo — the sun-crown (deva_hero_corona REUSED, first cross-brief layer reuse → the corona sprite feeds BOTH sheets, no
  # extra decode) breathing faintly behind the hero; the envelope keeps it idle-quiet. Cycle (22 steps @ 16 × vfxT): Normal 1.79s.
  "deva_hero_aura": {
    "seed": 0xDE7AA1, "fps": 24, "frames": 12, "one_shot": True, "layers_dir": "deva_hero", "canvas": (1254, 1254),
    "layers": [
      # L1 nimbus — the breath: scale_anchor bottom, scale 0.95 (constant); op smooth io half-cycle 0.4→0.75 (the reflection completes it). NO drift. cap 0.75.
      { "src": "deva_aura_nimbus", "kind": "xform", "scale_anchor": "bottom",
        "opacity": [[1, 12, 0.4, 0.75, "io"]],
        "scale":   [[1, 12, 0.95, 0.95, "lin"]] },
      # L2 aura motes — the faint dust breathing with it: cover-fit, scale 0.9 (constant); op io ramp 0.25→0.5. NO drift. cap 0.5.
      { "src": "deva_aura_motes", "kind": "xform",
        "opacity": [[1, 12, 0.25, 0.5, "io"]],
        "scale":   [[1, 12, 0.9, 0.9, "lin"]] },
      # L3 halo (NEW) — the sun-crown breathing behind the hero (deva_hero_corona REUSED): centred, scale 0.55 fixed; op io ramp 0.15→0.32 (idle-quiet). NO drift, NO rotate. cap 0.32.
      { "src": "deva_hero_corona", "kind": "xform",
        "opacity": [[1, 12, 0.15, 0.32, "io"]],
        "scale":   [[1, 12, 0.55, 0.55, "lin"]] },
    ],
  },

  # T101 INDRA PER-HERO OVERRIDE — ENTRY (first of the twelve; replaces the T100 Deva default for Indra ONLY). INDRA'S STORM: the sky
  # declaring its king — gold-dominant lightning with blue charge. THE VAJRA SEPARATION RULE (absolute): Vajra strikes DOWN onto a victim;
  # this storm RISES and ENCLOSES his own cell (every layer scale_anchor bottom / centred — NOTHING descends). T100-R sibling: the peak
  # LINGERS (storm holds at full f12-f20). Single-draw. Design timeline 0-based → compositor 1-based (+1). WORST-CASE-SUM: seal 1-27 ·
  # debris 5-19 · storm 9-27 · wreath 19-34, all ≤34.
  "indra_hero_entry": {
    "seed": 0x1ADA11, "fps": 24, "frames": 34, "one_shot": True, "layers_dir": "indra", "canvas": (1254, 1254),
    "layers": [
      # L1 seal — THE GROUND WAKES (electrified ground ellipse, baked perspective → NO squash_y): scale_anchor bottom, scale 0.95; op_keys = ramp 0→0.8 (f0-f5) then a subtle crackle riding the hold (0.67-0.80, Δ≤0.09 no strobe) then die_by fade (f20-f26). One per-frame track avoids the segment/op_keys overlap.
      { "src": "indra_seal", "kind": "xform", "scale_anchor": "bottom",
        "op_keys": [1, [0.0, 0.15, 0.35, 0.55, 0.70, 0.80, 0.72, 0.78, 0.69, 0.76, 0.80, 0.71, 0.75, 0.68, 0.77, 0.72, 0.79, 0.70, 0.74, 0.71, 0.68, 0.55, 0.42, 0.30, 0.18, 0.08, 0.0]],
        "scale":   [[1, 27, 0.95, 0.95, "lin"]] },
      # L2 debris — THE CHARGE (shard burst + arcs): scale_anchor bottom, scale 0.9→1.0 io; op_keys flicker (the owner's [0,.5,.3,.65,.4,.7,.35,.5,0] expanded per-frame across f4-f18, cap 0.7 — a CHARGE crackle, jumpy by design, unlike the seal).
      { "src": "indra_debris", "kind": "xform", "scale_anchor": "bottom",
        "op_keys": [5, [0.0, 0.29, 0.47, 0.36, 0.40, 0.60, 0.54, 0.40, 0.57, 0.65, 0.45, 0.39, 0.48, 0.29, 0.0]],
        "scale":   [[5, 19, 0.9, 1.0, "io"]] },
      # L3 storm — THE STORM RISES (the grandness; the Vajra separation embodied in motion): scale_anchor bottom, scale 0.75→1.0 io (f8-f15 — it RISES), op ramp 0→1.0 io (f8-f12), HOLD AT FULL f12-f20 (the T100-R law: loudness is duration), die_by fade f20-f26. Dark centre = the card's home.
      { "src": "indra_storm", "kind": "xform", "scale_anchor": "bottom",
        "opacity": [[9, 13, 0.0, 1.0, "io"], [13, 21, 1.0, 1.0, "lin"], [21, 27, 1.0, 0.0, "out"]],
        "scale":   [[9, 16, 0.75, 1.0, "io"], [16, 27, 1.0, 1.0, "lin"]] },
      # L4 wreath — THE CROWN OF STORMS (gold lightning wreath, open centre): centred; scale 0.8→1.2 io (f18-f24) then holds; op ramp 0→0.9 io (f18-f21), ONE op_sine breathe (base 0.9 amp 0.1 → peaks 1.0, no dip since the io ramp meets it), die_by fade f28-f33.
      { "src": "indra_wreath", "kind": "xform",
        "opacity": [[19, 22, 0.0, 0.9, "io"], [29, 34, 0.9, 0.0, "out"]],
        "op_sine": [23, 29, 0.9, 0.1],
        "scale":   [[19, 25, 0.8, 1.2, "io"], [25, 34, 1.2, 1.2, "lin"]] },
    ],
  },

  # T101 INDRA PER-HERO OVERRIDE — AURA (ping-pong loop; replaces the Deva default aura for Indra ONLY). Idle STORM-breath. REVERSAL-
  # SYMMETRY LAW: op/scale oscillation only — ZERO drift, ZERO rotate (lightning flicker is DIRECTION-FREE, ideal ping-pong material; the
  # ring breathes in CRACKLE not sine, but every per-frame Δ≤0.12 so the 0..11..0 reflection stays smooth). L2 wreath REUSES indra_wreath
  # (the T100-R cross-brief precedent → the sprite feeds both sheets, no extra decode). Cycle (22 steps @16×vfxT): Normal 1.79s.
  "indra_hero_aura": {
    "seed": 0x1ADAA1, "fps": 24, "frames": 12, "one_shot": True, "layers_dir": "indra", "canvas": (1254, 1254),
    "layers": [
      # L1 ring — the storm-breath (lightning ring): scale_anchor bottom, scale 0.95; op_keys micro-flicker riding a 0.3→0.55 rise (Δ≤0.05, so the reversal is smooth). cap 0.55.
      { "src": "indra_ring", "kind": "xform", "scale_anchor": "bottom",
        "op_keys": [1, [0.30, 0.34, 0.38, 0.41, 0.45, 0.42, 0.47, 0.50, 0.48, 0.52, 0.54, 0.55]],
        "scale":   [[1, 12, 0.95, 0.95, "lin"]] },
      # L2 wreath — the crown breathing faintly (indra_wreath REUSED): centred, scale 0.6 fixed; op io ramp 0.12→0.28 (idle-quiet). NO drift, NO rotate. cap 0.28.
      { "src": "indra_wreath", "kind": "xform",
        "opacity": [[1, 12, 0.12, 0.28, "io"]],
        "scale":   [[1, 12, 0.6, 0.6, "lin"]] },
    ],
  },

  # T102 AGNI PER-HERO OVERRIDE — ENTRY (second of the twelve; replaces the T100 Deva default for Agni ONLY, via the T101 maps). AGNI'S
  # FIRE: the sacrificial flame arrives — the hearth of the gods, bright orange-gold. WARM and ASCENDING, not violent — every layer is
  # scale_anchor bottom / cover-fit, nothing descends, nothing reads as an attack. Distinct from Ahamkara (crimson+gold Asura ego) and the
  # red damage tick by temperature+context (bright gold-orange at his own cell). T100-R sibling (peak lingers). Single-draw; 0-based → +1.
  # WORST-CASE-SUM: ground 1-27 · shockwave 7-17 · burst 9-27 · foreground 17-34, all ≤34.
  "agni_hero_entry": {
    "seed": 0xA6011E, "fps": 24, "frames": 34, "one_shot": True, "layers_dir": "agni", "canvas": (1254, 1254),
    "layers": [
      # L1 ground — THE HEARTH IGNITES (lava-cracked ground disc, baked perspective → NO squash_y): scale_anchor bottom, scale 0.95; op_keys = ramp 0→0.8 (f0-f5) then an ember-crackle riding the hold (0.67-0.80, Δ≤0.09) then die_by fade (f20-f26).
      { "src": "agni_ground", "kind": "xform", "scale_anchor": "bottom",
        "op_keys": [1, [0.0, 0.15, 0.35, 0.55, 0.70, 0.80, 0.72, 0.78, 0.69, 0.76, 0.80, 0.71, 0.75, 0.68, 0.77, 0.72, 0.79, 0.70, 0.74, 0.71, 0.68, 0.55, 0.42, 0.30, 0.18, 0.08, 0.0]],
        "scale":   [[1, 27, 0.95, 0.95, "lin"]] },
      # L2 shockwave — THE RING RACES OUT (fire ring ellipse): scale_anchor bottom, scale 0.55→1.15 io (f6-f12 — the expanding wave) then holds; op ramp 0→0.85 io (f6-f8), hold, die_by fade f11-f16.
      { "src": "agni_shockwave", "kind": "xform", "scale_anchor": "bottom",
        "opacity": [[7, 9, 0.0, 0.85, "io"], [9, 12, 0.85, 0.85, "lin"], [12, 17, 0.85, 0.0, "out"]],
        "scale":   [[7, 13, 0.55, 1.15, "io"], [13, 17, 1.15, 1.15, "lin"]] },
      # L3 burst — THE FIRE RISES (the grandness; twin rising flame pillars, dark centre = the card's home): scale_anchor bottom, scale 0.75→1.0 io (f8-f15 — it RISES), op ramp 0→1.0 io (f8-f12), HOLD AT FULL f12-f20 (the T100-R law), die_by fade f20-f26.
      { "src": "agni_burst", "kind": "xform", "scale_anchor": "bottom",
        "opacity": [[9, 13, 0.0, 1.0, "io"], [13, 21, 1.0, 1.0, "lin"], [21, 27, 1.0, 0.0, "out"]],
        "scale":   [[9, 16, 0.75, 1.0, "io"], [16, 27, 1.0, 1.0, "lin"]] },
      # L4 foreground — THE EMBERS SETTLE (ember debris + corner flame licks): cover-fit; op_keys = ramp 0→0.7 (f16-f20) then a gentle flicker (0.61-0.70, Δ≤0.09) then die_by fade (f27-f33).
      { "src": "agni_foreground", "kind": "xform",
        "op_keys": [17, [0.0, 0.20, 0.40, 0.58, 0.70, 0.64, 0.70, 0.61, 0.68, 0.62, 0.66, 0.58, 0.48, 0.38, 0.28, 0.18, 0.09, 0.0]],
        "scale":   [[17, 34, 1.0, 1.0, "lin"]] },
    ],
  },

  # T102 AGNI PER-HERO OVERRIDE — AURA (ping-pong loop; replaces the Deva default aura for Agni ONLY). Idle HEARTH-breath. REVERSAL-SYMMETRY
  # LAW: op/scale oscillation only — ZERO drift, ZERO rotate (fire flicker via op_keys, Δ≤0.12 so the 0..11..0 reflection stays smooth). L1
  # REUSES agni_burst (cross-brief, third use of the pattern → feeds both sheets, no extra decode; also covers the vetoed aura-back layer).
  # Cycle (22 steps @16×vfxT): Normal 1.79s.
  "agni_hero_aura": {
    "seed": 0xA601AA, "fps": 24, "frames": 12, "one_shot": True, "layers_dir": "agni", "canvas": (1254, 1254),
    "layers": [
      # L1 burst-as-hearth (agni_burst REUSED) — the twin flames breathing low behind the card: scale_anchor bottom, scale 0.8; op io ramp 0.15→0.32 (idle-quiet). NO drift, NO rotate. cap 0.32.
      { "src": "agni_burst", "kind": "xform", "scale_anchor": "bottom",
        "opacity": [[1, 12, 0.15, 0.32, "io"]],
        "scale":   [[1, 12, 0.8, 0.8, "lin"]] },
      # L2 aura front — the ember-swoosh hearth-breath: centred, scale 0.9; op_keys micro-flicker riding a 0.3→0.55 rise (Δ≤0.05, smooth reversal). cap 0.55.
      { "src": "agni_aura_front", "kind": "xform",
        "op_keys": [1, [0.30, 0.34, 0.38, 0.41, 0.45, 0.42, 0.47, 0.50, 0.48, 0.52, 0.54, 0.55]],
        "scale":   [[1, 12, 0.9, 0.9, "lin"]] },
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

def _warp(rgb, s, dx, dy, anchor="center", rot=0.0, squash_y=1.0):
    """Scale by s (pivot centre / bottom-centre), optional rotation `rot`° about the pivot, then translate (dx,dy).
    T92-amend: optional post-rotate vertical squash_y about the pivot — rotate IN-PLANE FIRST, then foreshorten to an
    ellipse (frisbee perspective). squash_y==1.0 → the matrix is byte-identical to before (every prior effect, incl. the
    rot==0 fast path, is untouched)."""
    h, w = rgb.shape[:2]; cx = w / 2.0; cy = (h if anchor == "bottom" else h / 2.0)
    if rot == 0.0:
        M = np.float32([[s, 0, cx - s * cx + dx], [0, s, cy - s * cy + dy]])   # UNCHANGED (byte-identical for every prior effect)
    else:
        M = cv2.getRotationMatrix2D((cx, cy), rot, s); M[0, 2] += dx; M[1, 2] += dy   # T89: scale + rotate about the pivot (getRotationMatrix2D(_,0,s) == the manual matrix above)
    if squash_y != 1.0:                                                         # T92-amend: foreshorten AFTER rotate → the in-plane spin reads as an ellipse in perspective
        S = np.float32([[1.0, 0.0, 0.0], [0.0, squash_y, cy * (1.0 - squash_y)]])   # vertical squash about the pivot cy
        M = (S @ np.vstack([M, [0.0, 0.0, 1.0]]))[:2]                           # S · [scale/rotate/translate] — squash composes LAST (order matters)
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

def _particle_vel(drift, ajit, spd, cx, cy, cx0, cy0):
    """Per-drift velocity. radial=outward, inward=toward centre (T89 devour), down, up (default). Byte-identical to the inline forms."""
    if drift == "radial":
        ang = math.atan2(cy - cy0, cx - cx0) + ajit; return math.cos(ang)*spd, math.sin(ang)*spd
    if drift == "inward":
        ang = math.atan2(cy0 - cy, cx0 - cx) + ajit; return math.cos(ang)*spd, math.sin(ang)*spd
    if drift == "down":
        return math.sin(ajit)*spd, math.cos(ajit)*spd
    return math.sin(ajit)*spd, -math.cos(ajit)*spd   # up

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
    storm_sign = 1 if (b["seed"] & 1) else -1                        # T87: seed-derived roll direction (right if odd) — from the seed VALUE, NOT an rng draw, so it never perturbs the determinism sequence
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
            xc = None
            if L["kind"] == "xform" and "cohorts" in L:                # T94 primitive 1 — XFORM COHORTS (GATED: rng is drawn ONLY when the key is present ⇒ every existing brief keeps its exact draw sequence, byte-identical)
                jd = L.get("cohort_jitter_deg", 0.0)
                xc = [{"base": co["base_rotation"] + random.uniform(-jd, jd), "rate": co["rotate_rate"]} for co in L["cohorts"]]
            parts_meta.append({"xcohorts": xc} if xc else None); continue
        blobs = _extract_particles(rgb, L["lum_thresh"], L["min_area"])
        ef0, ef1 = L["emit_frames"]; ir = L["inner_radius"] * rref; ib = L["inner_boost"]
        s0, s1 = L["speed_px_s"]; jit = math.radians(L["jitter_deg"]); l0, l1 = L["life_frames"]
        drift = L.get("drift", "up"); die_by = L.get("die_by", N)   # T83: radial-outward burst + a per-brief death-by frame (default N)
        cohorts = L.get("cohorts")                                   # T89: [{frac,emit_frames,speed_px_s,life_frames}...] — assign each particle to a cohort (staggered waves). Gated → c1a (no cohorts) is byte-identical.
        for pt in blobs:
            if cohorts:                                              # COHORT path (Pashupatastra's early/main ash) — one assignment draw, then that cohort's window/speed/life
                rc = random.random(); cum = 0.0; co = cohorts[-1]
                for cc in cohorts:
                    cum += cc["frac"]
                    if rc <= cum: co = cc; break
                cef0, cef1 = co["emit_frames"]; cs0, cs1 = co["speed_px_s"]; cl0, cl1 = co["life_frames"]
                pt["act"] = random.randint(cef0, cef1)
                ajit = random.uniform(-jit, jit); spd = random.uniform(cs0, cs1)
                pt["vx"], pt["vy"] = _particle_vel(drift, ajit, spd, pt["cx"], pt["cy"], cx0, cy0)
                pt["life"] = max(1, min(random.randint(cl0, cl1), die_by - pt["act"]))
            else:                                                    # SINGLE-WINDOW path (c1a / gayatri / damage / buff / venom) — UNCHANGED, byte-identical draw order
                r = math.hypot(pt["cx"] - cx0, pt["cy"] - cy0); inner = r <= ir
                choices = list(range(ef0, ef1 + 1))                  # centre-weighted burst: inner blobs are inner_boost× more likely in frames ef0..ef0+1
                weights = [(ib if (inner and fr <= ef0 + 1) else 1.0) for fr in choices]
                pt["act"] = random.choices(choices, weights=weights, k=1)[0]
                ajit = random.uniform(-jit, jit)                     # angle jitter (draw order PRESERVED = the old `theta`)
                spd = random.uniform(s0, s1)
                pt["vx"], pt["vy"] = _particle_vel(drift, ajit, spd, pt["cx"], pt["cy"], cx0, cy0)
                pt["life"] = max(1, min(random.randint(l0, l1), die_by - pt["act"]))   # clamp: dead by die_by (default N)
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
                dx = 0.0
                if "drift_x" in L:                              # horizontal ROLL [f0,f1,px]; sign = seed-derived storm_sign (T87)
                    xf0, xf1, xpx = L["drift_x"]
                    if f >= xf0:
                        dx = storm_sign * xpx * min(1.0, (f - xf0) / max(1, xf1 - xf0))
                rot = 0.0
                if "rotate" in L:                               # T89: slow rotation [f0,f1,total_deg] across the layer's life (the vortex churns)
                    rf0, rf1, rdeg = L["rotate"]
                    if f >= rf0:
                        rot = rdeg * min(1.0, (f - rf0) / max(1, rf1 - rf0))
                xc = pm.get("xcohorts") if pm else None
                if xc:                                          # T94 — draw the layer ONCE PER COHORT: radial placement (primitive 2) + per-cohort base+rate spin (primitive 1)
                    rad = L.get("radial"); anch = L.get("scale_anchor", "center"); sq = L.get("squash_y", 1.0)
                    for co in xc:
                        ang = math.radians(co["base"]); cdx, cdy = dx, dy
                        if rad:                                 # primitive 2 — XFORM RADIAL DRIFT: off-centre start → converge (io ease), placed at the cohort's angle
                            rf0, rf1 = rad["frames"]; rs, re = rad["radius_start"], rad["radius_end"]
                            t = 0.0 if f < rf0 else (1.0 if f > rf1 else (f - rf0) / (rf1 - rf0))
                            r = (rs + (re - rs) * _io(t)) * rref
                            cdx = r * math.cos(ang); cdy = r * math.sin(ang)
                        crot = co["base"] + co["rate"] * (f - (rad["frames"][0] if rad else 1))
                        canvas += _warp(rgb, sc, cdx, cdy, anch, crot, sq).astype(np.float32) * op
                else:
                    canvas += _warp(rgb, sc, dx, dy, L.get("scale_anchor", "center"), rot, L.get("squash_y", 1.0)).astype(np.float32) * op   # EXISTING single draw — byte-identical when no xform cohorts (absent key)
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
