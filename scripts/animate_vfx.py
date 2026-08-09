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
      # T104 TURN-TAKING (≤2 layers >0.5 at any frame; structure-forward) — L1 GROUND/HERALD (deva_hero_rays, dawn breaks before the king): IGNITES SOLO f1-f8 at cap 0.9 (the painted rays ARE the gorgeousness), DIMS to 0.5, held crisp 0.5 through f20, die_by fade f20-f26. scale_anchor bottom, the dawn spreads 0.85→1.0.
      { "src": "deva_hero_rays", "kind": "xform", "scale_anchor": "bottom",
        "opacity": [[1, 5, 0.0, 0.9, "io"], [5, 8, 0.9, 0.9, "lin"], [8, 11, 0.9, 0.5, "out"], [11, 20, 0.5, 0.5, "lin"], [20, 26, 0.5, 0.0, "out"]],
        "scale":   [[1, 10, 0.85, 1.0, "io"], [10, 26, 1.0, 1.0, "lin"]] },
      # T104 — L2 MOTES ambient glory-dust (deva has no ring layer; the dust fills the ambient beat): cover-fit; gentle shimmer UNCHANGED (cap 0.50 baked, never >0.5 → never competes with a structure beat). f3-f31.
      { "src": "deva_hero_motes", "kind": "xform",
        "op_keys": [3, [0.0, 0.12, 0.25, 0.35, 0.42, 0.38, 0.45, 0.40, 0.48, 0.43, 0.50, 0.44, 0.48, 0.42, 0.46, 0.40, 0.44, 0.40, 0.46, 0.41, 0.47, 0.42, 0.44, 0.38, 0.30, 0.22, 0.14, 0.07, 0.0]] },
      # T104 TURN-TAKING — L3 RISE (deva_hero_beam, the descent; the wash UNDER the structure, not the whiteout OVER it): rises AFTER the herald settles. peak op 0.85 (was 1.0), HOLD SHORTENED to 4f (f21-f25), fade f25-f30. cover-fit, settles 1.06→1.0.
      { "src": "deva_hero_beam", "kind": "xform",
        "opacity": [[18, 21, 0.0, 0.85, "io"], [21, 25, 0.85, 0.85, "lin"], [25, 30, 0.85, 0.0, "out"]],
        "scale":   [[18, 25, 1.06, 1.0, "io"], [25, 30, 1.0, 1.0, "lin"]] },
      # T104 TURN-TAKING — L4 CROWN (deva_hero_corona, the crown of arrival; character UNCHANGED, re-staggered to settle AFTER the rise): centred; ramp f24-f28, ONE op_sine breathe f28-f31 (base 0.9 amp 0.1), die_by fade f31-f34; scale blooms 0.7→1.45 past the edge (mask crops, intended).
      { "src": "deva_hero_corona", "kind": "xform",
        "opacity": [[24, 28, 0.0, 0.9, "io"], [31, 34, 0.9, 0.0, "out"]],
        "op_sine": [28, 31, 0.9, 0.1],
        "scale":   [[24, 31, 0.7, 1.45, "io"], [31, 34, 1.45, 1.45, "lin"]] },
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
      # T104 TURN-TAKING (≤2 layers >0.5 at any frame; structure-forward) — L1 GROUND (indra_seal, electrified ground ellipse, baked perspective → NO squash_y): IGNITES SOLO f1-f8 at cap 0.9 (the painted seal IS the gorgeousness — read it crisp), DIMS to 0.5 as the ring races, held crisp at 0.5 through f20, die_by fade f20-f26. scale_anchor bottom.
      { "src": "indra_seal", "kind": "xform", "scale_anchor": "bottom",
        "opacity": [[1, 5, 0.0, 0.9, "io"], [5, 8, 0.9, 0.9, "lin"], [8, 11, 0.9, 0.5, "out"], [11, 20, 0.5, 0.5, "lin"], [20, 26, 0.5, 0.0, "out"]],
        "scale":   [[1, 26, 0.95, 0.95, "lin"]] },
      # T104 TURN-TAKING — L2 RING (indra_debris, the charge) TWO PULSES (rings read as motion; motion reads as craft): pulse1 f8-f14 cap 0.85, echo f14-f20 cap 0.6 — the ground is dimmed to 0.5 beneath it so only the ring is loud. scale_anchor bottom, expands per pulse (op=0 at f14 hides the scale reset).
      { "src": "indra_debris", "kind": "xform", "scale_anchor": "bottom",
        "opacity": [[8, 11, 0.0, 0.85, "io"], [11, 14, 0.85, 0.0, "out"], [14, 17, 0.0, 0.6, "io"], [17, 20, 0.6, 0.0, "out"]],
        "scale":   [[8, 14, 0.55, 1.15, "io"], [14, 20, 0.7, 1.3, "io"]] },
      # T104 TURN-TAKING — L3 RISE (indra_storm, the wash UNDER the structure, not the whiteout OVER it): rises AFTER the ring (ring gone, ground low). peak op 0.85 (was 1.0), HOLD SHORTENED to 4f (f21-f25), fade f25-f30. scale_anchor bottom, rises 0.75→1.05.
      { "src": "indra_storm", "kind": "xform", "scale_anchor": "bottom",
        "opacity": [[18, 21, 0.0, 0.85, "io"], [21, 25, 0.85, 0.85, "lin"], [25, 30, 0.85, 0.0, "out"]],
        "scale":   [[18, 25, 0.75, 1.05, "io"], [25, 30, 1.05, 1.05, "lin"]] },
      # T104 TURN-TAKING — L4 CROWN (indra_wreath, gold lightning wreath, open centre; character UNCHANGED, re-staggered to settle AFTER the rise): ramp f24-f28, ONE op_sine breathe f28-f31 (base 0.9 amp 0.1 → peaks 1.0, solo by now), die_by fade f31-f34. centred, blooms past the edge (mask crops, intended).
      { "src": "indra_wreath", "kind": "xform",
        "opacity": [[24, 28, 0.0, 0.9, "io"], [31, 34, 0.9, 0.0, "out"]],
        "op_sine": [28, 31, 0.9, 0.1],
        "scale":   [[24, 31, 0.7, 1.35, "io"], [31, 34, 1.35, 1.35, "lin"]] },
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
      # T104 TURN-TAKING (≤2 layers >0.5 at any frame; structure-forward) — L1 GROUND (agni_ground, lava-cracked disc, baked perspective → NO squash_y): IGNITES SOLO f1-f8 at cap 0.9 (the painted hearth IS the gorgeousness), DIMS to 0.5 as the ring races, held crisp 0.5 through f20, die_by fade f20-f26. scale_anchor bottom.
      { "src": "agni_ground", "kind": "xform", "scale_anchor": "bottom",
        "opacity": [[1, 5, 0.0, 0.9, "io"], [5, 8, 0.9, 0.9, "lin"], [8, 11, 0.9, 0.5, "out"], [11, 20, 0.5, 0.5, "lin"], [20, 26, 0.5, 0.0, "out"]],
        "scale":   [[1, 26, 0.95, 0.95, "lin"]] },
      # T104 TURN-TAKING — L2 RING (agni_shockwave, fire ring) TWO PULSES: pulse1 f8-f14 cap 0.85, echo f14-f20 cap 0.6 (rings read as motion). scale_anchor bottom, expands per pulse (op=0 at f14 hides the reset).
      { "src": "agni_shockwave", "kind": "xform", "scale_anchor": "bottom",
        "opacity": [[8, 11, 0.0, 0.85, "io"], [11, 14, 0.85, 0.0, "out"], [14, 17, 0.0, 0.6, "io"], [17, 20, 0.6, 0.0, "out"]],
        "scale":   [[8, 14, 0.55, 1.15, "io"], [14, 20, 0.7, 1.3, "io"]] },
      # T104 TURN-TAKING — L3 RISE (agni_burst, twin flame pillars, dark centre = the card's home; the wash UNDER the structure): rises AFTER the ring. peak op 0.85 (was 1.0), HOLD SHORTENED to 4f (f21-f25), fade f25-f30. scale_anchor bottom, rises 0.75→1.05.
      { "src": "agni_burst", "kind": "xform", "scale_anchor": "bottom",
        "opacity": [[18, 21, 0.0, 0.85, "io"], [21, 25, 0.85, 0.85, "lin"], [25, 30, 0.85, 0.0, "out"]],
        "scale":   [[18, 25, 0.75, 1.05, "io"], [25, 30, 1.05, 1.05, "lin"]] },
      # T104 TURN-TAKING — L4 CROWN/SETTLE (agni_foreground, ember debris + corner flame licks; character kept, re-staggered to settle AFTER the rise): cover-fit; gentle ember flicker f24-f34 (cap 0.68, Δ≤0.1 no strobe) — the settle detail reading crisp once the blaze is gone.
      { "src": "agni_foreground", "kind": "xform",
        "op_keys": [24, [0.0, 0.30, 0.55, 0.68, 0.62, 0.68, 0.58, 0.46, 0.32, 0.18, 0.0]],
        "scale":   [[24, 34, 1.0, 1.0, "lin"]] },
    ],
  },

  # T104 PART 3 (T103 ABSORBED) — VARUNA PER-HERO ENTRY (authored directly in the FINAL T104 shape; renders ONCE, already correct). VARUNA'S
  # OCEAN: the tide rises and crowns — cyan-white water, RISING and ENCLOSING his own cell (Vajra separation: scale_anchor bottom / centred,
  # NOTHING descends). SEPARATION NOTE (owner): LIQUID, NEVER ELECTRIC — this is water (tide-pool, wave, spray), distinct from Indra's storm.
  # Structure-forward, solo-stagger law (≤2 layers >0.5 at any frame: ground solo → wave races → tide rises → spray settles), delayed-arrival
  # reveal beat (~f25). 34 frames. WORST-CASE-SUM: ground 1-26 · shockwave 8-20 · burst 18-30 · foreground 24-34, all ≤34.
  "varuna_hero_entry": {
    "seed": 0x7A40DA, "fps": 24, "frames": 34, "one_shot": True, "layers_dir": "varuna", "canvas": (1254, 1254),
    "layers": [
      # L1 GROUND (varuna_ground, tide-pool disc): IGNITES SOLO f1-f8 at cap 0.9 (the painted tide-ground IS the gorgeousness), DIMS to 0.5 as the wave races, held crisp 0.5 through f20, die_by fade f20-f26. scale_anchor bottom.
      { "src": "varuna_ground", "kind": "xform", "scale_anchor": "bottom",
        "opacity": [[1, 5, 0.0, 0.9, "io"], [5, 8, 0.9, 0.9, "lin"], [8, 11, 0.9, 0.5, "out"], [11, 20, 0.5, 0.5, "lin"], [20, 26, 0.5, 0.0, "out"]],
        "scale":   [[1, 26, 0.95, 0.95, "lin"]] },
      # L2 RING (varuna_shockwave, the wave races out) TWO PULSES: pulse1 f8-f14 cap 0.85, echo f14-f20 cap 0.6 (rings read as motion). scale_anchor bottom, expands per pulse (op=0 at f14 hides the reset).
      { "src": "varuna_shockwave", "kind": "xform", "scale_anchor": "bottom",
        "opacity": [[8, 11, 0.0, 0.85, "io"], [11, 14, 0.85, 0.0, "out"], [14, 17, 0.0, 0.6, "io"], [17, 20, 0.6, 0.0, "out"]],
        "scale":   [[8, 14, 0.55, 1.15, "io"], [14, 20, 0.7, 1.3, "io"]] },
      # L3 RISE (varuna_burst, the tide rises; the wash UNDER the structure): rises AFTER the wave. peak op 0.85, HOLD 4f (f21-f25), fade f25-f30. scale_anchor bottom, rises 0.75→1.05.
      { "src": "varuna_burst", "kind": "xform", "scale_anchor": "bottom",
        "opacity": [[18, 21, 0.0, 0.85, "io"], [21, 25, 0.85, 0.85, "lin"], [25, 30, 0.85, 0.0, "out"]],
        "scale":   [[18, 25, 0.75, 1.05, "io"], [25, 30, 1.05, 1.05, "lin"]] },
      # L4 CROWN/SETTLE (varuna_foreground, spray + droplet detail settling): cover-fit; gentle ripple flicker f24-f34 (cap 0.68, Δ≤0.1 no strobe).
      { "src": "varuna_foreground", "kind": "xform",
        "op_keys": [24, [0.0, 0.30, 0.55, 0.68, 0.62, 0.68, 0.58, 0.46, 0.32, 0.18, 0.0]],
        "scale":   [[24, 34, 1.0, 1.0, "lin"]] },
    ],
  },

  # RAMA NAAM — the Mantra class (G3 row wash), Gayatri/Pavamana SIBLING. New register: RADIANT BUFF (the light mirror
  # of DARK BUFF). Devotion carve-out palette (saffron/vermilion at full strength — the source layers carry it). Owner
  # motion brief, built verbatim: (1-10) wash rises sole-above-0.5 → (8-18) rays break with a slow diagonal drift, wash
  # dims to 0.45 for the rays' solo beat → (16-28) motes lift bottom-to-top + pulse breathes ONCE → (26-36) core blooms
  # to the 0.85 blaze ceiling (T104), holds ~4f, then ALL layers decay together in the final 6. xform: wash/rays/pulse/
  # core; particle: motes. The +2 floaters are wired UI-side in the G3 dispatch (Rama Naam emits only a log — no engine
  # touch under this task). Seed 0xAA4A11.
  "ramanaam": {
    "seed": 0xAA4A11, "fps": 24, "frames": 36, "one_shot": True, "layers_dir": "ramanaam", "canvas": (1920, 640),
    "layers": [
      # WASH (xform) — rises 0→0.80 sole-above-0.5 (f1-10, soft io), dims to 0.45 by f16 for the rays' solo beat, holds, final-6 decay.
      { "src": "ramanaam_wash", "kind": "xform",
        "opacity": [[1, 10, 0.0, 0.80, "io"], [10, 16, 0.80, 0.45, "in"], [16, 30, 0.45, 0.45, "lin"], [30, 36, 0.45, 0.0, "out"]],
        "scale":   [[1, 10, 0.97, 1.0, "io"]] },
      # RAYS (xform) — break in 0→0.75 (f8-18) with a slow diagonal drift matching the painted angle, decay to 0.35 as motes+pulse take the frame, final-6 decay.
      { "src": "ramanaam_rays", "kind": "xform",
        "opacity": [[8, 18, 0.0, 0.75, "io"], [18, 24, 0.75, 0.35, "out"], [24, 30, 0.35, 0.35, "lin"], [30, 36, 0.35, 0.0, "out"]],
        "drift_x": [8, 36, 24], "drift_up": [8, 36, 16] },
      # MOTES (particle) — lift bottom-to-top, EVEN activation (inner_boost 1.0 = no burst), peak cap 0.65, die by 36 with a soft fade (the final-6 decay).
      { "src": "ramanaam_motes", "kind": "particles", "op_cap": 0.65,
        "emit_frames": [16, 26], "inner_radius": 0.42, "inner_boost": 1.0,
        "speed_px_s": [10, 22], "jitter_deg": 8.0, "life_frames": [12, 20], "fade_frames": 3,
        "lum_thresh": 44, "min_area": 3 },
      # PULSE (xform) — breathes ONCE (f16-28): scale 0.96→1.04→1.00, opacity 0→0.70→0.40, final-6 decay.
      { "src": "ramanaam_pulse", "kind": "xform",
        "opacity": [[16, 22, 0.0, 0.70, "io"], [22, 28, 0.70, 0.40, "io"], [28, 30, 0.40, 0.40, "lin"], [30, 36, 0.40, 0.0, "out"]],
        "scale":   [[16, 22, 0.96, 1.04, "io"], [22, 28, 1.04, 1.00, "io"]] },
      # CORE (xform) — the blessing settles: blooms 0→0.85 (f26-30, the T104 blaze ceiling), HOLDS 4 frames (30-34), decays last (34-36).
      { "src": "ramanaam_core", "kind": "xform",
        "opacity": [[26, 30, 0.0, 0.85, "io"], [30, 34, 0.85, 0.85, "lin"], [34, 36, 0.85, 0.0, "out"]],
        "scale":   [[26, 30, 0.94, 1.0, "io"]] },
    ],
  },

  # KISHKINDHA OATH — CAST. The WARD register (light single-target seal; mirror family of BIND / DARK-BUFF seal). Class:
  # CARD-SCALE SQUARE (Vajra cell, radial mask — NOT a row plate). Jade/emerald + gold (faction bond, NOT the saffron
  # carve-out — the source layers carry it). Owner brief, verbatim: (1-8) ring rises sole-above-0.5 → (6-16) veil drapes
  # over the face with a slow upward drift, ring dims to 0.45 → (14-24) oath settles, both decay to the persistent state
  # (the between-moments ward marker is PROPOSED, not built under this task — the cast decays to 0 and hands off). Two
  # layers only (ring, veil). Seed 0x0A7A0A.
  "kishkindhaoath_cast": {
    "seed": 0x0A7A0A, "fps": 24, "frames": 24, "one_shot": True, "layers_dir": "kishkindhaoath",
    "layers": [
      # RING (xform) — rises 0→0.80 sole-above-0.5 (f1-8, io), slight scale settle 1.05→1.00, dims to 0.45 as the veil takes the beat, decays f16-24.
      { "src": "kishkindhaoath_ring", "kind": "xform",
        "opacity": [[1, 8, 0.0, 0.80, "io"], [8, 16, 0.80, 0.45, "in"], [16, 24, 0.45, 0.0, "out"]],
        "scale":   [[1, 8, 1.05, 1.0, "io"]] },
      # VEIL (xform) — drapes over the card face 0→0.65 (f6-16, io) with a slow upward drift, decays f16-24.
      { "src": "kishkindhaoath_veil", "kind": "xform",
        "opacity": [[6, 16, 0.0, 0.65, "io"], [16, 24, 0.65, 0.0, "out"]],
        "drift_up": [6, 24, 20] },
    ],
  },

  # KISHKINDHA OATH — FIRE. The ward TRIGGERS inside a destruction: the warded unit survives at 1, the witnesses rally +1.
  # Same WARD register / card-scale square (Vajra cell). Plays on the engine's `ward` emit (abilityName 'Kishkindha Oath').
  # Owner brief, verbatim: (1-6) flash blooms to the 0.85 blaze ceiling, holds 3 — the survive-at-1 read → (5-16) threads
  # fan outward 0→0.70 as flash decays to 0.40 (the bond reaching the witnesses; the painted symmetric fan stands — the
  # compositor does not aim per-neighbor) → (12-24) motes ripple outward (particle, op_cap 0.50) + threads decay to 0.35;
  # the witness +1 floaters land in this window, the warded unit's →1 floater at the flash → (22-28) all decay together.
  "kishkindhaoath_fire": {
    "seed": 0x0A7A0A, "fps": 24, "frames": 28, "one_shot": True, "layers_dir": "kishkindhaoath",
    "layers": [
      # FLASH (xform) — the vow holds: blooms 0→0.85 (f1-4), holds 3 (the T104 blaze ceiling, the survive-at-1 read), decays to 0.40 as threads reach, final decay f22-28.
      { "src": "kishkindhaoath_flash", "kind": "xform",
        "opacity": [[1, 4, 0.0, 0.85, "io"], [4, 6, 0.85, 0.85, "lin"], [6, 16, 0.85, 0.40, "in"], [16, 22, 0.40, 0.40, "lin"], [22, 28, 0.40, 0.0, "out"]],
        "scale":   [[1, 4, 0.94, 1.0, "io"]] },
      # THREADS (xform) — fan OUTWARD 0→0.70 (f5-16, scale expansion = the fan), decay to 0.35 as motes ripple, final decay f22-28.
      { "src": "kishkindhaoath_threads", "kind": "xform",
        "opacity": [[5, 16, 0.0, 0.70, "io"], [16, 24, 0.70, 0.35, "in"], [24, 28, 0.35, 0.0, "out"]],
        "scale":   [[5, 16, 0.85, 1.15, "io"]] },
      # MOTES (particle) — witness ripple: drift radial-OUTWARD, op_cap 0.50 (never above the solo-stagger line), die by 28 with a soft fade.
      { "src": "kishkindhaoath_motes", "kind": "particles", "op_cap": 0.50, "drift": "out",
        "emit_frames": [12, 22], "inner_radius": 0.42, "inner_boost": 1.0,
        "speed_px_s": [12, 26], "jitter_deg": 10.0, "life_frames": [10, 16], "fade_frames": 3,
        "lum_thresh": 44, "min_area": 3 },
    ],
  },

  # MRITYUNJAYA — the Mantra DEATHLESS revival (venom-tinged: light conquered, then corrupted). Sanjivani Corruption's
  # SQUARE arrival SIBLING (unit-anchored, Vajra cell class), 32f one-shot on the REVIVED cell. Q3 landing-interplay ON
  # RECORD (structural — the revived unit has no play event → neutral .bc.landing pop, no landing flare). Palette: abyssal
  # teal / ghost white-green, venom-green ONLY in the bloom beat (THE PRICE = the token lands). Coil: opacity + slight scale
  # + drift_up ONLY (no rotation primitive — the painted spiral reads as winding through its rise). ≤2 layers >0.5 (audit).
  "mrityunjaya": {
    "seed": 0xD3AD1A, "fps": 24, "frames": 32, "one_shot": True, "layers_dir": "mrityunjaya", "canvas": (1254, 1254),
    "layers": [
      # PLATE (xform) — THE DEEP OPENS: soft ground rise 0→0.70 (f1-8, sole layer above 0.5), dims to 0.45 as the column rises, decays to 0 by 32.
      { "src": "mrityunjaya_plate", "kind": "xform",
        "opacity": [[1, 8, 0.0, 0.70, "io"], [8, 16, 0.70, 0.45, "in"], [16, 32, 0.45, 0.0, "out"]] },
      # COLUMN (xform) — DEATHLESS LIGHT: rises 0→0.80 (f6-16) with slow drift_up, decays to 0.40 as the coil winds, out by 32.
      { "src": "mrityunjaya_column", "kind": "xform",
        "opacity": [[6, 16, 0.0, 0.80, "io"], [16, 22, 0.80, 0.40, "in"], [22, 32, 0.40, 0.0, "out"]],
        "drift_up": [6, 28, 22] },
      # COIL (xform) — THE COIL WINDS: 0→0.70 (f12-22), scale 0.94→1.02 + gentle drift_up (the painted spiral winds through its rise — no rotation), decays to 0.35 as the bloom lands.
      { "src": "mrityunjaya_coil", "kind": "xform",
        "opacity": [[12, 22, 0.0, 0.70, "io"], [22, 26, 0.70, 0.35, "in"], [26, 32, 0.35, 0.0, "out"]],
        "scale":   [[12, 22, 0.94, 1.02, "io"]],
        "drift_up": [12, 32, 16] },
      # BLOOM (xform) — THE PRICE: the venom lands 0→0.75 (f18-26, venom-green ONLY here), gentle bloom-open scale, out by 32. Coincides with the unit's arrival render + venombadge (frames 18-26).
      { "src": "mrityunjaya_bloom", "kind": "xform",
        "opacity": [[18, 26, 0.0, 0.75, "io"], [26, 32, 0.75, 0.0, "out"]],
        "scale":   [[18, 26, 0.92, 1.0, "io"]] },
      # MOTES (particle) — SURFACING: rise (drift UP), op_cap 0.50 (never above the solo-stagger line), a brief late flourish that decays with the rest by 32.
      { "src": "mrityunjaya_motes", "kind": "particles", "op_cap": 0.50, "drift": "up",
        "emit_frames": [24, 29], "inner_radius": 0.40, "inner_boost": 1.0,
        "speed_px_s": [14, 30], "jitter_deg": 10.0, "life_frames": [3, 6], "fade_frames": 2,
        "lum_thresh": 44, "min_area": 3 },
    ],
  },

  # SARPA SATRA — the serpent sacrifice; closes the Mantra row. TWO ZONES, TWO SHEETS (the pipeline can't combine a square
  # and a wide cell). ZONE A = the sacrificed FRIENDLY cell (square, Vajra cell class) — fired on the engine's `destroy`
  # event (abilityName 'Sarpa Satra'), framing the unit's normal dissolve. Register: SACRIFICE. Palette venom-green/black-gold.
  # SOLO-STAGGER (global): fire decays ≤0.5 by f10 BEFORE serpent rises >0.5 (~f11) → fire ⊥ serpent, so the only concurrent
  # >0.5 pair across BOTH zones is serpent+veil = 2, GUARANTEED regardless of the Zone-B dispatch offset.
  "sarpasatra_a": {
    "seed": 0x5A4A5A, "fps": 24, "frames": 20, "one_shot": True, "layers_dir": "sarpasatra", "canvas": (1254, 1254),
    "layers": [
      # FIRE (xform) — THE FIRE TAKES: 0→0.80 (f1-6), decays to 0.45 by f10 (FASTER than the brief's f14 so fire ⊥ serpent — the global solo-stagger guarantee), out by 20.
      { "src": "sarpasatra_fire", "kind": "xform",
        "opacity": [[1, 6, 0.0, 0.80, "io"], [6, 10, 0.80, 0.45, "in"], [10, 20, 0.45, 0.0, "out"]] },
      # SERPENT (xform) — THE SOUL RISES: 0→0.75 (f5-14) with drift_up (the soul ascends), decays to 0 by 20.
      { "src": "sarpasatra_serpent", "kind": "xform",
        "opacity": [[5, 14, 0.0, 0.75, "io"], [14, 18, 0.75, 0.35, "in"], [18, 20, 0.35, 0.0, "out"]],
        "drift_up": [5, 20, 30] },
      # ASH (particle) — ASH SINKS (drift DOWN + fade), op_cap 0.45 (never above the solo-stagger line), f12-20.
      { "src": "sarpasatra_ash", "kind": "particles", "op_cap": 0.45, "drift": "down",
        "emit_frames": [12, 18], "inner_radius": 0.40, "inner_boost": 1.0,
        "speed_px_s": [10, 22], "jitter_deg": 10.0, "life_frames": [3, 6], "fade_frames": 2,
        "lum_thresh": 44, "min_area": 3 },
    ],
  },

  # SARPA SATRA — ZONE B = THE DRAIN (wide row-plate, Pashupatastra/Gayatri geometry, canvas 1920×640 cover-fit) — fired on
  # the FIRST enemy `damage` event (abilityName 'Sarpa Satra'), over the opponent's half. The veil reads as WEIGHT descending.
  # Only ONE xform (veil) → Zone B internal ≤1; combined with the fire⊥serpent guarantee, the global cross-zone max is 2.
  "sarpasatra_b": {
    "seed": 0x5A4A5A, "fps": 24, "frames": 24, "one_shot": True, "layers_dir": "sarpasatra", "canvas": (1920, 640),
    "layers": [
      # VEIL (xform) — THE GLOOM DESCENDS: 0→0.75 (f1-11) with DOWNWARD drift (drift_up NEGATIVE = dy>0, the gloom sinks over the enemy row), holds 0.50 through the surge, out by 24.
      { "src": "sarpasatra_veil", "kind": "xform",
        "opacity": [[1, 11, 0.0, 0.75, "io"], [11, 19, 0.75, 0.50, "in"], [19, 24, 0.50, 0.0, "out"]],
        "drift_up": [1, 24, -40] },
      # SURGE (particle) — VENOM SURGE descends (drift DOWN), op_cap 0.50 (never above the solo-stagger line), a wide spread across the enemy row, f7-19.
      { "src": "sarpasatra_surge", "kind": "particles", "op_cap": 0.50, "drift": "down",
        "emit_frames": [7, 19], "inner_radius": 0.55, "inner_boost": 1.0,
        "speed_px_s": [14, 32], "jitter_deg": 12.0, "life_frames": [4, 8], "fade_frames": 2,
        "lum_thresh": 44, "min_area": 3 },
    ],
  },

  # GANDIVA ARROW — the Vanara row's first Astra, a single-target STRIKE (Vajra family, square cell on the victim,
  # victim-showcase, strike-lands-first). 20f one-shot per victim (FAST — a half-blessing; Vajra is 18f, same class).
  # Speed IS the read: the streak blazes in along its painted diagonal (upper-left→lower-right), the flash lands, shards
  # scatter, the ring blesses once. Palette: gold + leaf-green accent (baked into the shards/ring art). ≤2 layers >0.5
  # (audit). SEED 0x6A0D1A is EVEN → storm_sign=-1 (drift_x rolls left by default), so the streak's drift_x uses a
  # NEGATIVE magnitude to travel RIGHT (−1 × −px = +), matching the painted upper-left→lower-right diagonal (+drift_up
  # negative = down → the down-right arrow line). A double-kill (Leap → a 2nd shaft) fires this sheet SERIALLY per victim.
  "gandiva": {
    "seed": 0x6A0D1A, "fps": 24, "frames": 20, "one_shot": True, "layers_dir": "gandiva",
    "layers": [
      # STREAK (xform) — THE ARROW ARRIVES: blazes 0→0.85 (f1-5, sole layer >0.5), cuts to 0.30 the instant it lands (f5-6),
      # gone by 16. Strong diagonal drift down-RIGHT (drift_x negative ⇒ right under storm_sign=-1; drift_up negative ⇒ down).
      { "src": "gandiva_streak", "kind": "xform",
        "opacity": [[1, 5, 0.0, 0.85, "out"], [5, 6, 0.85, 0.30, "lin"], [6, 16, 0.30, 0.0, "out"]],
        "scale":   [[1, 5, 1.06, 1.0, "out"]],
        "drift_x": [1, 9, -50], "drift_up": [1, 9, -36] },
      # FLASH (xform) — IMPACT: 0→0.85 (f4-7) hold 2 (f7-9), the streak has already cut below 0.5 → the handoff stays ≤2;
      # decays to 0.40 as the scatter takes over (f9-14), out by 20. The victim-showcase clone takes its hit in this window.
      { "src": "gandiva_flash", "kind": "xform",
        "opacity": [[4, 7, 0.0, 0.85, "out"], [7, 9, 0.85, 0.85, "lin"], [9, 14, 0.85, 0.40, "in"], [14, 20, 0.40, 0.0, "out"]],
        "scale":   [[4, 6, 0.9, 1.0, "out"]] },
      # RING (xform) — BLESSED SCATTER: a single expand, scale 0.85→1.15, opacity 0→0.60→0.25 (f8-16), out by 20.
      { "src": "gandiva_ring", "kind": "xform",
        "opacity": [[8, 12, 0.0, 0.60, "out"], [12, 16, 0.60, 0.25, "in"], [16, 20, 0.25, 0.0, "out"]],
        "scale":   [[8, 16, 0.85, 1.15, "out"]] },
      # SHARDS (particle) — BLESSED SCATTER: a sharp radial burst (tight emit f8-10), op_cap 0.50 (never above the line),
      # fast + short so it's dead by ~19 and hands the aftermath to the victim's exit debris (choreolayer).
      { "src": "gandiva_shards", "kind": "particles", "op_cap": 0.50, "drift": "out",
        "emit_frames": [8, 10], "inner_radius": 0.28, "inner_boost": 1.0,
        "speed_px_s": [30, 60], "jitter_deg": 12.0, "life_frames": [5, 9], "fade_frames": 2,
        "lum_thresh": 44, "min_area": 3 },
    ],
  },

  # SANJEEVANI CALL — the mountain brought whole (revival-arrival). MRITYUNJAYA'S SQUARE SIBLING, INVERTED: Mrityunjaya
  # rises from the deep (cold abyssal teal); Sanjeevani DESCENDS from the sky (warm mountain-green + dawn-gold). 32f one-shot
  # over the REVIVED cell, SHEET_FPS 16 (2000ms hold, matching Mrityunjaya). Beats: the sky opens (plate) → the carried
  # mountain is LOWERED from above and holds (mountain, the signature beat — drift_settle: enters from above, eases to rest,
  # decelerating) → life lands (bloom, the mountain→herb handoff IS the transfer of life; REBIRTH-BRIGHT exception → peak 0.90)
  # → the after-glow settles downward (motes, drift down). Grandness = brightness × HOLD (mountain holds near-full f9-16).
  # ≤2 layers >0.5 at every frame (audit). SEED 0x11FE5A: 0x5A even → seed&1=0 → storm_sign=-1 (gandiva 0x6A0D1A idiom) —
  # MOOT here (this recipe uses drift_settle, vertical; no drift_x). COMPOSITOR VOCAB: adds drift_settle (descent), additive —
  # no other recipe uses it → every existing sheet re-bakes byte-identical (mrityunjaya byte-identity gate enforced).
  "sanjeevani": {
    "seed": 0x11FE5A, "fps": 24, "frames": 32, "one_shot": True, "layers_dir": "sanjeevani", "canvas": (1254, 1254),
    "layers": [
      # PLATE (xform) — THE SKY OPENS: soft dawn plate blooms 0→0.72 (f1-8, sole layer >0.5), gentle scale-open, dims to 0.45 as the mountain settles, out by 32. Screen-blend warmth (baked in the art).
      { "src": "sanjeevani_plate", "kind": "xform",
        "opacity": [[1, 8, 0.0, 0.72, "io"], [8, 16, 0.72, 0.45, "in"], [16, 32, 0.45, 0.0, "out"]],
        "scale":   [[1, 8, 0.94, 1.02, "io"]] },
      # MOUNTAIN (xform) — THE DESCENT (signature): LOWERED from above — drift_settle enters 200px above rest and eases DOWN to
      # center, decelerating (a thing lowered, not dropped). Rises to 0.85 and HOLDS near-full f9-16 (grandness = brightness×hold),
      # then fades as the bloom ignites. Slight scale-DOWN 1.10→1.0 as it settles (looms close overhead, then rests).
      { "src": "sanjeevani_mountain", "kind": "xform",
        "opacity": [[6, 9, 0.0, 0.85, "io"], [9, 16, 0.85, 0.85, "lin"], [16, 24, 0.85, 0.35, "in"], [24, 32, 0.35, 0.0, "out"]],
        "scale":   [[6, 20, 1.10, 1.0, "out"]],
        "drift_settle": [6, 20, 200, "out"] },
      # BLOOM (xform) — LIFE LANDS: the herb bloom ignites as the mountain fades — the handoff IS the transfer of life. REBIRTH-
      # BRIGHT exception ON RECORD → peak 0.90 (above the revival-class norm), brief hold, out by 32. Bloom-open scale.
      { "src": "sanjeevani_bloom", "kind": "xform",
        "opacity": [[16, 22, 0.0, 0.90, "io"], [22, 26, 0.90, 0.90, "lin"], [26, 32, 0.90, 0.0, "out"]],
        "scale":   [[16, 22, 0.90, 1.0, "io"]] },
      # MOTES (particle) — THE AFTER-GLOW: gold/green motes settle DOWNWARD (drift down), slow + quiet, op_cap 0.50 (never above
      # the line), a short tail dead by 32 (clamp: emit 22-27 + life ≤5 ⇒ last ≤32).
      { "src": "sanjeevani_motes", "kind": "particles", "op_cap": 0.50, "drift": "down",
        "emit_frames": [22, 27], "inner_radius": 0.42, "inner_boost": 1.0,
        "speed_px_s": [12, 28], "jitter_deg": 10.0, "life_frames": [3, 5], "fade_frames": 2,
        "lum_thresh": 44, "min_area": 3 },
    ],
  },

  # LANKA DAHAN — the tail set alight (INVERTED Sarpa Satra two-zone). Sarpa = sacrifice(square) + drain(enemy plate);
  # Lanka = FIRE PLATE over the enemy half (this sheet) + INSPIRATION WASH over the friendly half (the sibling sheet).
  # Fire-budget law: the enemy plate owns the faction's ENTIRE flame allowance; the wash is warmth WITHOUT flame. THE MIRROR:
  # enemy fire embers FALL (drift down); friendly wash sparks RISE (drift up). Both wide 1920×640 cover-fit, 24f, fps 24
  # (sarpasatra_b class). SEED 0xF14E5B: 0x5B odd → seed&1=1 → storm_sign=+1 → the fire's drift_x lateral roll sweeps RIGHT
  # (the firestorm front); the wash has no drift_x (sign moot). SIDE_FEATHER 120 on both (mandated bake repair — fire sides
  # 185/203 → black). ≤2 layers >0.5 (audit; each sheet is one xform + one particle ⇒ trivially ≤1 xform).
  "lankadahan_fire": {
    "seed": 0xF14E5B, "fps": 24, "frames": 24, "one_shot": True, "layers_dir": "lankadahan", "canvas": (1920, 640), "side_feather": 120,
    "layers": [
      # FIRE (xform) — THE ENEMY BURN: the firestorm front SURGES in with a lateral roll (drift_x right, fast attack f1-6), then
      # HOLDS near-full f5-18 (grandness law — the faction's one big fire gets its hold), then RECEDES f18-24 (dying reds).
      { "src": "lankadahan_fire", "kind": "xform",
        "opacity": [[1, 5, 0.0, 0.88, "out"], [5, 18, 0.88, 0.88, "lin"], [18, 24, 0.88, 0.0, "out"]],
        "scale":   [[1, 6, 1.06, 1.0, "out"]],
        "drift_x": [1, 8, 70] },
      # EMBERS (particle) — falling THROUGH the fire (downward drift), op_cap 0.50, kindled across the hold, the tail carries the
      # dying reds. Clamp: emit 4-17 + life ≤7 ⇒ last ≤24.
      { "src": "lankadahan_embers", "kind": "particles", "op_cap": 0.50, "drift": "down",
        "emit_frames": [4, 17], "inner_radius": 0.50, "inner_boost": 1.0,
        "speed_px_s": [20, 45], "jitter_deg": 12.0, "life_frames": [4, 7], "fade_frames": 2,
        "lum_thresh": 40, "min_area": 3 },
    ],
  },

  # LANKA DAHAN — INSPIRATION WASH over the FRIENDLY half. Warmth WITHOUT flame (budget law). The MIRROR of the burn: sparks RISE.
  "lankadahan_wash": {
    "seed": 0xF14E5B, "fps": 24, "frames": 24, "one_shot": True, "layers_dir": "lankadahan", "canvas": (1920, 640), "side_feather": 120,
    "layers": [
      # WASH (xform) — THE INSPIRATION: a warm wash BREATHES in over the row (gentle attack f1-8, NO flame — dimmer peak 0.72
      # than the fire's 0.88, budget law), HOLDS warm f8-20, SETTLES to a warm afterglow f20-24.
      { "src": "lankadahan_wash", "kind": "xform",
        "opacity": [[1, 8, 0.0, 0.72, "io"], [8, 20, 0.72, 0.60, "lin"], [20, 24, 0.60, 0.0, "out"]],
        "scale":   [[1, 8, 0.96, 1.0, "io"]] },
      # SPARKS (particle) — rising UPWARD through the wash (ascending drift — the MIRROR of the ember fall), op_cap 0.50, gentle.
      # Clamp: emit 6-18 + life ≤6 ⇒ last ≤24.
      { "src": "lankadahan_sparks", "kind": "particles", "op_cap": 0.50, "drift": "up",
        "emit_frames": [6, 18], "inner_radius": 0.50, "inner_boost": 1.0,
        "speed_px_s": [16, 38], "jitter_deg": 10.0, "life_frames": [4, 6], "fade_frames": 2,
        "lum_thresh": 40, "min_area": 3 },
    ],
  },

  # VASUKI VENOM STRIKE — the ocean turns (TWO-BEAT AMPLIFIER, the mirror within one card). CAST = THE POISON RISES (surge over
  # the CASTER's half, off the astra's play event); ROUND END = THE TIDE FALLS (amplified drain plate over the ENEMY half, off
  # the drain 'toast', state-peek attribution). Palette: cold abyssal green/teal — Mrityunjaya's cousin, NEVER Sanjeevani's warmth.
  # THE MIRROR: cast bubbles RISE (tide drift_settle from BELOW) / payoff droplets FALL (veil drift_settle from ABOVE). Both wide
  # 1920×640 cover-fit, 24f, fps 24 (sarpasatra_b class), side_feather 120 (tide sides 134/54 → black). SEED 0x0CEA17: 0x17 odd →
  # seed&1=1 → storm_sign=+1, but both recipes use drift_settle (vertical) — no drift_x, sign moot. ≤2 layers >0.5 (one xform +
  # one particle each ⇒ ≤1). side_feather is the Lanka-Dahan vocab (no new primitive this task).
  "venomstrike_surge": {
    "seed": 0x0CEA17, "fps": 24, "frames": 24, "one_shot": True, "layers_dir": "venomstrike", "canvas": (1920, 640), "side_feather": 120,
    "layers": [
      # TIDE (xform) — THE POISON RISES: the tide SURGES up into frame from BELOW (drift_settle -160 ⇒ starts below rest, rises
      # decelerating — the ocean turning), rises to 0.82 by f6 and HOLDS f6-18 (grandness — a Legendary announcement), settles f18-24.
      { "src": "venomstrike_tide", "kind": "xform",
        "opacity": [[1, 6, 0.0, 0.82, "out"], [6, 18, 0.82, 0.82, "lin"], [18, 24, 0.82, 0.0, "out"]],
        "scale":   [[1, 8, 0.96, 1.0, "io"]],
        "drift_settle": [1, 10, -160, "out"] },
      # RISE (particle) — bubbles ASCENDING through the tide (drift up), op_cap 0.50. Clamp: emit 2-17 + life ≤6 ⇒ last ≤23.
      { "src": "venomstrike_rise", "kind": "particles", "op_cap": 0.50, "drift": "up",
        "emit_frames": [2, 17], "inner_radius": 0.50, "inner_boost": 1.0,
        "speed_px_s": [16, 38], "jitter_deg": 10.0, "life_frames": [4, 6], "fade_frames": 2,
        "lum_thresh": 40, "min_area": 3 },
    ],
  },

  # VASUKI VENOM STRIKE — THE TIDE FALLS (round-end amplified drain over the ENEMY half). The MIRROR of the surge: the veil SINKS.
  "venomstrike_drain": {
    "seed": 0x0CEA17, "fps": 24, "frames": 24, "one_shot": True, "layers_dir": "venomstrike", "canvas": (1920, 640), "side_feather": 120,
    "layers": [
      # VEIL (xform) — THE TIDE FALLS: the veil strata SINK into frame from ABOVE (drift_settle +140 ⇒ starts above rest, sinks
      # decelerating — heavy and slow), holds oppressive 0.80 f6-18, dissipates downward f18-24.
      { "src": "venomstrike_veil", "kind": "xform",
        "opacity": [[1, 6, 0.0, 0.80, "out"], [6, 18, 0.80, 0.80, "lin"], [18, 24, 0.80, 0.0, "out"]],
        "scale":   [[1, 6, 1.04, 1.0, "out"]],
        "drift_settle": [1, 10, 140, "out"] },
      # FALL (particle) — droplets SINKING through the veil (drift down — the MIRROR of the rise), op_cap 0.50. Clamp: emit 4-18 + life ≤6 ⇒ last ≤24.
      { "src": "venomstrike_fall", "kind": "particles", "op_cap": 0.50, "drift": "down",
        "emit_frames": [4, 18], "inner_radius": 0.50, "inner_boost": 1.0,
        "speed_px_s": [18, 40], "jitter_deg": 12.0, "life_frames": [4, 6], "fade_frames": 2,
        "lum_thresh": 40, "min_area": 3 },
    ],
  },

  # TAMASA — THE SMOTHERING (FIRST ASURA ASTRA ship; enemy-half descent, the DIMMEST set in the catalog by design). The darkness
  # SETTLES, it does not strike (register: dim — NO hit-stop beyond the spectacle astra play beat; the spectacle tier owns that).
  # Wide 1920x640 cover-fit, 24f, fps 24 (venomstrike/lanka class), side_feather 120. SEED 0x2A0E07 — the set is VERTICAL
  # (drift_settle + drift down; NO drift_x), so storm_sign is MOOT (0x07 odd -> +1, unused; noted per the parity->sign idiom).
  # THE TAIL IS THE THEFT: the void-motes murk is the LAST content standing (dark, guttering out) — the sparks (the lights) DIE
  # DOWNWARD through the murk, the front/strata recede WITHOUT a bright clear. BRIGHTNESS-FLOOR audited (check D) — the dimmest
  # legible sheet; per-layer luminance GAIN sanctioned iff sub-floor (rides the byte-identity re-bake gate). SOLO-STAGGER: only two
  # xform layers exist (strata, front) so >0.5 count is <=2 by construction; particles capped <0.5 (never counted). Comet note:
  # the sparks' static trails read UP; the bake's DOWN drift rules the motion — verified in baked frames.
  "tamasa": {
    "seed": 0x2A0E07, "fps": 24, "frames": 24, "one_shot": True, "layers_dir": "tamasa", "canvas": (1920, 640), "side_feather": 120,
    "layers": [
      # STRATA (xform) — the murk SINKS into frame (heavy, slow): drift_settle positive (from above, f1-6), attack f1-6 to 0.66,
      # HOLDS oppressive f6-16, RECEDES f16-24 as the void tail takes over (the murk hands off to the motes, never a bright clear).
      { "src": "tamasa_strata", "kind": "xform",
        "opacity": [[1, 6, 0.0, 0.66, "out"], [6, 16, 0.66, 0.60, "lin"], [16, 24, 0.60, 0.0, "out"]],
        "scale":   [[1, 6, 1.05, 1.0, "out"]],
        "drift_settle": [1, 6, 110, "out"] },
      # FRONT (xform) — THE SMOTHER (signature): the darkness DESCENDS from above and HOLDS (grandness law — the smothering needs
      # its dwell): drift_settle positive f4-16, attack f4-10 to 0.80, HOLDS f10-16, recedes f16-24.
      { "src": "tamasa_front", "kind": "xform",
        "opacity": [[4, 10, 0.0, 0.80, "out"], [10, 16, 0.80, 0.80, "lin"], [16, 24, 0.80, 0.0, "out"]],
        "scale":   [[4, 12, 1.05, 1.0, "io"]],
        "drift_settle": [4, 16, 150, "out"] },
      # SPARKS (particle) — the DYING LIGHTS gutter DOWNWARD through the murk (drift down + fade — the lights going out). op_cap
      # 0.46 (<0.5, un-counted). Clamp: emit 8-19 + life <=5, die_by=24 -> last <=24.
      { "src": "tamasa_sparks", "kind": "particles", "op_cap": 0.46, "drift": "down",
        "emit_frames": [8, 19], "inner_radius": 0.50, "inner_boost": 1.0,
        "speed_px_s": [16, 38], "jitter_deg": 10.0, "life_frames": [3, 5], "fade_frames": 2,
        "lum_thresh": 40, "min_area": 3 },
      # MOTES (particle) — VOID MOTES drift in the tail; everything dims to true black (the theft). drift down, slow, dark. op_cap
      # 0.42. Emit LATE (15-21) so the motes are the LAST content standing -> the sheet ends on dark void, not a bright dissipation.
      # Clamp: emit 15-21 + life <=5, die_by=24 -> last <=24. Brightness-floor candidate (check D).
      { "src": "tamasa_motes", "kind": "particles", "op_cap": 0.46, "drift": "down", "lum_gain": 6.0,
        "emit_frames": [15, 21], "inner_radius": 0.55, "inner_boost": 1.0,
        "speed_px_s": [8, 22], "jitter_deg": 8.0, "life_frames": [3, 5], "fade_frames": 2,
        "lum_thresh": 24, "min_area": 2 },   # lum_gain 6.0: src max 14.4 (near-black, sub-floor) → ~86; composited void ~35 (dimmest-but-legible at arm's length, well below front ~130); thresh 24 extracts the gained cores
    ],
  },

  # NAGASTRA — THE STOLEN SERPENT (Asura astra; contamination plate over the CASTER's ENEMY half, off the multi-target 'token'
  # emit). PALETTE LAW: venom green VEINED with Asura crimson, GREEN DOMINANT (measured on baked frames; source green/crimson
  # wash 3.4 / haze 2.1 / darts 2.6 / tokens 42). Chaos Surge fires (Asura caster) → the RULED anchor inherits (plate ENEMY half /
  # chaos wash ASURA half, serialized, opposite halves, never merged). COEXISTENCE: ADD, suppress nothing — the per-token beat
  # (pulse/callout/skull badges/sfx_venom_apply) plays whole; the plate is the WEATHER, the beat is the rain. Wide 1920x640
  # cover-fit, 24f, fps 24, side_feather 120. SEED 0x5E4D0B — 0x0B ODD → seed&1=1 → storm_sign=+1: the DARTS rake DOWN-RIGHT and
  # the haze banks roll RIGHT (parity->sign->rake-direction; the sign is LIVE here, unlike the vertical venom set). NEW VOCAB:
  # particle drift 'diag' (down-diagonal rake in the storm_sign direction, sign threaded) — ADDITIVE + GATED (only 'diag' particles
  # read the sign; every existing sheet re-bakes byte-identical). Register: venom family — no hit-stop beyond the spectacle astra
  # beat; the DARTS are the one aggressive beat, the rest settles. SOLO-STAGGER: two xforms (haze, wash), particles capped <0.5.
  "nagastra": {
    "seed": 0x5E4D0B, "fps": 24, "frames": 24, "one_shot": True, "layers_dir": "nagastra", "canvas": (1920, 640), "side_feather": 120,
    "layers": [
      # HAZE (xform) — the contamination ARRIVES: horizontal banks roll in (drift_x right under storm_sign=+1 — the strata law made
      # lateral), attack f1-6 to 0.62, HOLDS as the weather f6-18, recedes f18-24.
      { "src": "nagastra_haze", "kind": "xform",
        "opacity": [[1, 6, 0.0, 0.62, "out"], [6, 18, 0.62, 0.58, "lin"], [18, 24, 0.58, 0.0, "out"]],
        "scale":   [[1, 6, 1.04, 1.0, "out"]],
        "drift_x": [1, 12, 55] },
      # DARTS (particle, DIAG) — THE WEAPON STRIKES ALL: the darts rake DOWN-DIAGONAL through the haze (drift 'diag' = down-RIGHT
      # under storm_sign=+1), FAST — the one aggressive beat. op_cap 0.48 (<0.5, un-counted). Clamp: emit 4-14 + life <=6 -> last <=20.
      { "src": "nagastra_darts", "kind": "particles", "op_cap": 0.48, "drift": "diag",
        "emit_frames": [4, 14], "inner_radius": 0.50, "inner_boost": 1.0,
        "speed_px_s": [60, 120], "jitter_deg": 8.0, "life_frames": [4, 6], "fade_frames": 2,
        "lum_thresh": 40, "min_area": 3 },
      # WASH (xform) — THE VENOM TAKES HOLD: the green-crimson churn SURGES up from below (drift_settle -120 ⇒ rises, the venom
      # welling), attack f10-16 to 0.72, holds f16-20, settles to a green simmer f20-24.
      { "src": "nagastra_wash", "kind": "xform",
        "opacity": [[10, 16, 0.0, 0.72, "out"], [16, 20, 0.72, 0.66, "lin"], [20, 24, 0.66, 0.0, "out"]],
        "scale":   [[10, 18, 0.97, 1.0, "io"]],
        "drift_settle": [10, 18, -120, "out"] },
      # TOKENS (particle, down) — THE BEADS LAND: the venom beads SINK onto the row (drift down, slow), settling where the skull
      # badges persist (the badge-arrival handoff). op_cap 0.46. Source has bright cores (max 255) — no lum_gain. Clamp: emit 16-22 + life <=5 -> last <=24.
      { "src": "nagastra_tokens", "kind": "particles", "op_cap": 0.46, "drift": "down",
        "emit_frames": [16, 22], "inner_radius": 0.55, "inner_boost": 1.0,
        "speed_px_s": [10, 26], "jitter_deg": 8.0, "life_frames": [3, 5], "fade_frames": 2,
        "lum_thresh": 40, "min_area": 2 },
    ],
  },

  # AMRITA KALASHA — THE VESSEL'S BLESSING (ARTIFACT ROW opener). ARRIVAL POLARITY (the row's class): the blessing wash lands on the
  # CASTER'S OWN half — artifacts bless their own board (inverse of the whole Astra row). Palette: pure WHITE-GOLD liquid nectar —
  # the revival family's THIRD palette (vs Mrityunjaya cold-teal, Sanjeevani mountain-green+dawn-gold). SERENE throughout: no
  # hit-stop, no shake, no landing flare (Q3). Wide 1920x640 cover-fit, 24f, fps 24, side_feather 120. SEED 0xA1C7E3 (shared with
  # amrita_revive) — VERTICAL set (drift_settle + drift up/down, NO drift_x) → storm_sign MOOT (0xE3 odd → +1, unused; noted per the
  # parity->sign idiom). BRIGHTEST set since Sanjeevani: radiance is a big bright field (src p99.9 250 @ 48.8% cover) → opacity
  # MODERATED (0.64) so the additive composite doesn't blow out; particles op_cap <0.5. SOLO-STAGGER: two xforms (shafts, radiance).
  "amrita_bless": {
    "seed": 0xA1C7E3, "fps": 24, "frames": 24, "one_shot": True, "layers_dir": "amrita", "canvas": (1920, 640), "side_feather": 120,
    "layers": [
      # SHAFTS (xform) — GRACE ARRIVES FIRST (dim): the light shafts descend into frame (drift_settle from above, f1-8), attack
      # f1-6 to 0.52, holds through the bloom, recedes f16-24.
      { "src": "amrita_shafts", "kind": "xform",
        "opacity": [[1, 6, 0.0, 0.52, "out"], [6, 16, 0.52, 0.48, "lin"], [16, 24, 0.48, 0.0, "out"]],
        "scale":   [[1, 6, 1.04, 1.0, "out"]],
        "drift_settle": [1, 8, 90, "out"] },
      # RADIANCE (xform) — THE BLESSING BLOOMS and HOLDS (grandness law — a Mythic blessing gets its dwell): attack f4-10 to 0.64
      # (MODERATED — the radiance field is large + bright; keep the additive composite off the ceiling), HOLDS f10-16, recedes f16-24.
      { "src": "amrita_radiance", "kind": "xform",
        "opacity": [[4, 10, 0.0, 0.64, "io"], [10, 16, 0.64, 0.60, "lin"], [16, 24, 0.60, 0.0, "out"]],
        "scale":   [[4, 12, 0.97, 1.0, "io"]] },
      # RAIN (particle) — NECTAR RAIN falls through the light (drift down), op_cap 0.46. Clamp: emit 4-18 + life <=6 -> last <=24.
      { "src": "amrita_rain", "kind": "particles", "op_cap": 0.46, "drift": "down",
        "emit_frames": [4, 18], "inner_radius": 0.50, "inner_boost": 1.0,
        "speed_px_s": [22, 46], "jitter_deg": 8.0, "life_frames": [4, 6], "fade_frames": 2,
        "lum_thresh": 44, "min_area": 3 },
      # MOTES (particle) — the BLESSING MOTES drift in the warm afterglow (drift up, serene), op_cap 0.44. Clamp: emit 14-21 + life <=5 -> last <=24.
      { "src": "amrita_motes", "kind": "particles", "op_cap": 0.44, "drift": "up",
        "emit_frames": [14, 21], "inner_radius": 0.50, "inner_boost": 1.0,
        "speed_px_s": [10, 24], "jitter_deg": 8.0, "life_frames": [3, 5], "fade_frames": 2,
        "lum_thresh": 44, "min_area": 2 },
    ],
  },

  # AMRITA KALASHA — THE REVIVAL (nectar square, the aegis revive at the cell). Mrityunjaya/Sanjeevani SQUARE sibling, 32f, the
  # THIRD revival palette (white-gold nectar). Fires off the engine 'revive' emit (abilityName scoped). SEED 0xA1C7E3 (shared) —
  # vertical set, sign MOOT. SERENE — no hit-stop/shake. White-gold nectar is bright by nature; the splash peaks 0.88 (serene, NOT a
  # rebirth-bright exception — the nectar simply IS bright). SOLO-STAGGER: three STAGGERED xforms (plate->stream->splash, sanjeevani
  # structure — never >2 at once); motes particle-capped.
  "amrita_revive": {
    "seed": 0xA1C7E3, "fps": 24, "frames": 32, "one_shot": True, "layers_dir": "amrita", "canvas": (1254, 1254),
    "layers": [
      # REV_PLATE (xform) — THE POOL: the nectar plate blooms at the cell 0->0.70 (f1-8), holds, dims as the splash lands, out by 32.
      { "src": "amrita_rev_plate", "kind": "xform",
        "opacity": [[1, 8, 0.0, 0.70, "io"], [8, 16, 0.70, 0.46, "in"], [16, 32, 0.46, 0.0, "out"]],
        "scale":   [[1, 8, 0.94, 1.02, "io"]] },
      # REV_STREAM (xform) — THE POUR (signature): the nectar DESCENDS from above (drift_settle 200px -> rest, decelerating — a thing
      # poured, not dropped), rises to 0.82 and HOLDS f9-16 (grandness = brightness x hold), fades as the splash blooms.
      { "src": "amrita_rev_stream", "kind": "xform",
        "opacity": [[5, 9, 0.0, 0.82, "io"], [9, 16, 0.82, 0.82, "lin"], [16, 22, 0.82, 0.30, "in"], [22, 32, 0.30, 0.0, "out"]],
        "scale":   [[5, 18, 1.08, 1.0, "out"]],
        "drift_settle": [5, 18, 200, "out"] },
      # REV_SPLASH (xform) — LIFE LANDS: the crown splash blooms low as the stream pours home — the handoff IS the life landing.
      { "src": "amrita_rev_splash", "kind": "xform",
        "opacity": [[14, 20, 0.0, 0.88, "io"], [20, 24, 0.88, 0.88, "lin"], [24, 32, 0.88, 0.0, "out"]],
        "scale":   [[14, 20, 0.90, 1.0, "io"]] },
      # REV_MOTES (particle) — THE IMMORTAL RESIDUE ASCENDS (the mirror of the pour): gold motes RISE (drift up), slow + serene,
      # op_cap 0.48. Clamp: emit 20-27 + life <=5 -> last <=32.
      { "src": "amrita_rev_motes", "kind": "particles", "op_cap": 0.48, "drift": "up",
        "emit_frames": [20, 27], "inner_radius": 0.44, "inner_boost": 1.0,
        "speed_px_s": [12, 28], "jitter_deg": 10.0, "life_frames": [3, 5], "fade_frames": 2,
        "lum_thresh": 44, "min_area": 3 },
    ],
  },

  # DHARMA KAVACHA — THE WALL OF LAW (Artifact row; the row's cheapest ship — arrival-only). Wide plate over the CASTER'S OWN half
  # (R95 polarity), off the play event. Palette: Amrita's white-gold family but COOLER + STILLER — masonry, not nectar. Register:
  # STRUCTURED — the one card whose light has EDGES; serene, no hit-stop. Wide 1920x640 cover-fit, 24f, fps 24, side_feather 120.
  # SEED 0xB4C0D2 — 0xD2 EVEN → storm_sign=-1, MOOT (vertical set: drift_settle + drift up, NO drift_x). THREE xforms (strata,
  # wall, crest) — the <=2 solo-stagger cap is this build's one real constraint: strata RISES then HANDS OFF (drops <0.5) before
  # the crest enters >0.5; the wall holds through both. Interior peak sanctioned (the wall core runs near-255 — law has edges);
  # blow-out moderated via opacity (Amrita radiance precedent — opacity tighten, not lum_gain). The tail is STILLNESS.
  "kavacha": {
    "seed": 0xB4C0D2, "fps": 24, "frames": 24, "one_shot": True, "layers_dir": "kavacha", "canvas": (1920, 640), "side_feather": 120,
    "layers": [
      # STRATA (xform) — LAW IS BUILT, NOT POURED: the strata STACK UPWARD into place (drift_settle NEGATIVE -100 ⇒ rises from
      # BELOW, decelerating), attack f1-7 to 0.66, brief hold, then HANDS OFF beneath the wall — drops <0.5 by ~f12 (before the crest).
      { "src": "kavacha_strata", "kind": "xform",
        "opacity": [[1, 7, 0.0, 0.66, "out"], [7, 10, 0.66, 0.60, "lin"], [10, 15, 0.60, 0.0, "in"]],
        "scale":   [[1, 7, 1.03, 1.0, "out"]],
        "drift_settle": [1, 8, -100, "out"] },
      # WALL (xform) — THE WALL IGNITES and HOLDS (the wall's dwell IS the card): attack f6-13 to 0.62 (MODERATED — big bright field,
      # keep the additive composite off the ceiling; the core still peaks near-255), HOLDS f13-20, settles to a steady STAND f20-24.
      { "src": "kavacha_wall", "kind": "xform",
        "opacity": [[6, 13, 0.0, 0.62, "io"], [13, 20, 0.62, 0.58, "lin"], [20, 24, 0.58, 0.0, "out"]],
        "scale":   [[6, 13, 0.98, 1.0, "io"]] },
      # CREST (xform) — THE CREST GLEAMS along the top: enters ONLY as the strata drops <0.5 (f15+, the stagger constraint), attack
      # f15-21 to 0.56, recedes f21-24. The steady gleam of a wall that stands.
      { "src": "kavacha_crest", "kind": "xform",
        "opacity": [[15, 21, 0.0, 0.56, "io"], [21, 24, 0.56, 0.0, "out"]],
        "scale":   [[15, 21, 0.99, 1.0, "io"]] },
      # GLINTS (particle) — sparks CLIMB the rampart (drift up), op_cap 0.44. Clamp: emit 8-20 + life <=5 -> last <=24 (die_by).
      { "src": "kavacha_glints", "kind": "particles", "op_cap": 0.44, "drift": "up",
        "emit_frames": [8, 20], "inner_radius": 0.50, "inner_boost": 1.0,
        "speed_px_s": [14, 34], "jitter_deg": 8.0, "life_frames": [3, 5], "fade_frames": 2,
        "lum_thresh": 44, "min_area": 2 },
    ],
  },

  # TRIPURA — THE THREE CITIES (Asura Mythic artifact; RISE and FALL, ONE layer set → TWO sheets, the Sarpa a/b shape). Palette:
  # tri-metal (gold/silver/iron-red) over Asura smolder. Register: DOMINION. Wide 1920x640, 24f, fps 24, side_feather 120. SEED
  # 0x3C1A0E (shared) — 0x0E even → storm_sign=-1, MOOT (vertical sets: drift_settle + drift up/down, NO drift_x). Layer map: RISE
  # = lights + shimmer + haze; FALL = lights (dimming) + shards + embers + haze (guttering). The FALL is the row's one violent
  # moment but ENDS DARK (the Tamasa-tail law), not loud.
  "tripura_rise": {
    "seed": 0x3C1A0E, "fps": 24, "frames": 24, "one_shot": True, "layers_dir": "tripura", "canvas": (1920, 640), "side_feather": 120,
    "layers": [
      # HAZE (xform) — the dominion GATHERS: rolls in low (slight rise from below), attack f1-6 to 0.55, holds as the ground f6-18,
      # simmers out f18-24.
      { "src": "tripura_haze", "kind": "xform",
        "opacity": [[1, 6, 0.0, 0.55, "out"], [6, 18, 0.55, 0.50, "lin"], [18, 24, 0.50, 0.0, "out"]],
        "scale":   [[1, 6, 1.03, 1.0, "out"]],
        "drift_settle": [1, 8, -70, "out"] },
      # LIGHTS (xform) — THE THREE LIGHTS ASCEND (built, not poured): drift_settle NEGATIVE (rise from below), attack f4-10 to 0.66,
      # HOLD f10-16 (Mythic dwell), recede f16-24.
      { "src": "tripura_lights", "kind": "xform",
        "opacity": [[4, 10, 0.0, 0.66, "io"], [10, 16, 0.66, 0.62, "lin"], [16, 24, 0.62, 0.0, "out"]],
        "scale":   [[4, 12, 0.97, 1.0, "io"]],
        "drift_settle": [4, 16, -120, "out"] },
      # SHIMMER (particle) — sparkles CLIMB through the lights (drift up), op_cap 0.44. Clamp: emit 6-18 + life <=5 -> last <=24.
      { "src": "tripura_shimmer", "kind": "particles", "op_cap": 0.44, "drift": "up",
        "emit_frames": [6, 18], "inner_radius": 0.50, "inner_boost": 1.0,
        "speed_px_s": [12, 30], "jitter_deg": 8.0, "life_frames": [3, 5], "fade_frames": 2,
        "lum_thresh": 44, "min_area": 2 },
    ],
  },

  # TRIPURA — THE FALL (the ninth-sibling shatter; the three cities come apart). The MIRROR of the rise. Ends DARK (Tamasa-tail law).
  "tripura_fall": {
    "seed": 0x3C1A0E, "fps": 24, "frames": 24, "one_shot": True, "layers_dir": "tripura", "canvas": (1920, 640), "side_feather": 120,
    "layers": [
      # LIGHTS (xform) — THE ALIGNMENT BREAKS: the three lights DIM and SINK (drift_settle POSITIVE — descend from above as they die),
      # quick presence f1-3 (already lit), then dims to 0 by f14.
      { "src": "tripura_lights", "kind": "xform",
        "opacity": [[1, 3, 0.0, 0.58, "out"], [3, 14, 0.58, 0.0, "in"]],
        "scale":   [[1, 14, 1.02, 0.94, "in"]],
        "drift_settle": [1, 14, 110, "out"] },
      # HAZE (xform) — GUTTERS: dim ground (peak 0.42, never >0.5), gutters out f12-22.
      { "src": "tripura_haze", "kind": "xform",
        "opacity": [[1, 6, 0.0, 0.42, "out"], [6, 12, 0.42, 0.36, "lin"], [12, 22, 0.36, 0.0, "in"]],
        "scale":   [[1, 6, 1.0, 1.02, "out"]] },
      # SHARDS (particle) — the cities COME APART: shards rain DOWN through the dying lights (drift down), FAST, op_cap 0.48. Clamp:
      # emit 4-16 + life <=6 -> last <=22.
      { "src": "tripura_shards", "kind": "particles", "op_cap": 0.48, "drift": "down",
        "emit_frames": [4, 16], "inner_radius": 0.50, "inner_boost": 1.0,
        "speed_px_s": [30, 70], "jitter_deg": 10.0, "life_frames": [4, 6], "fade_frames": 2,
        "lum_thresh": 44, "min_area": 3 },
      # EMBERS (particle) — everything DIMS: embers fall (drift down), slow, the DARK TAIL (the fall ends dark — Tamasa-tail law).
      # op_cap 0.42, source Lmax 138 (dimmest layer — brightness-floor candidate, lum_gain if sub-floor). Clamp: emit 12-21 + life <=5 -> last <=24.
      { "src": "tripura_embers", "kind": "particles", "op_cap": 0.42, "drift": "down",
        "emit_frames": [12, 21], "inner_radius": 0.55, "inner_boost": 1.0,
        "speed_px_s": [10, 26], "jitter_deg": 8.0, "life_frames": [3, 5], "fade_frames": 2,
        "lum_thresh": 40, "min_area": 2 },
    ],
  },

  # CHANDRAHAS — THE MOON BLADE'S GLEAM (Asura Rare artifact, arrival-only — the pair's Kavacha). Wide plate over the CASTER'S OWN
  # half (R95). PALETTE LAW: cold SILVER above (the crescent — the ONLY cold light in the Asura catalog, Shiva's gift in demon
  # hands), crimson RISING beneath; the two bands APPROACH but NEVER merge (silver upper / crimson lower — measured, no mixed frame).
  # Register: GLEAM, not strike — no hit-stop. Wide 1920x640, 24f, fps 24, side_feather 120. SEED 0x6C1A2E — 0x2E even →
  # storm_sign=-1, MOOT (vertical: drift_settle + drift up, NO drift_x). SOLO-STAGGER: two bright xforms (crescent, crimson); haze
  # under 0.5; glints particle-capped.
  "chandrahas": {
    "seed": 0x6C1A2E, "fps": 24, "frames": 24, "one_shot": True, "layers_dir": "chandrahas", "canvas": (1920, 640), "side_feather": 120,
    "layers": [
      # HAZE (xform) — THE NIGHT GATHERS: eclipse haze banks in, dim + cold (peak 0.42, NEVER >0.5), holds, settles out f18-24.
      { "src": "chandrahas_haze", "kind": "xform",
        "opacity": [[1, 8, 0.0, 0.42, "out"], [8, 18, 0.42, 0.36, "lin"], [18, 24, 0.36, 0.0, "out"]],
        "scale":   [[1, 8, 1.03, 1.0, "out"]] },
      # CRESCENT (xform) — THE MOON BLADE SWEEPS IN and HANGS (the dwell IS the card): drift_settle NEGATIVE (slight rise into
      # place), attack f4-10 to 0.68, HOLD f10-18 (the gleam), recede f18-24. Cold silver.
      { "src": "chandrahas_crescent", "kind": "xform",
        "opacity": [[4, 10, 0.0, 0.68, "io"], [10, 18, 0.68, 0.64, "lin"], [18, 24, 0.64, 0.0, "out"]],
        "scale":   [[4, 12, 0.97, 1.0, "io"]],
        "drift_settle": [4, 14, -70, "out"] },
      # CRIMSON (xform) — THE DOMINION RISES beneath (drift_settle NEGATIVE from the base — reaching up to meet the gift; the bands
      # APPROACH but NEVER merge: crimson stays LOW, the crescent holds HIGH). attack f8-14 to 0.60, hold, recede f20-24.
      { "src": "chandrahas_crimson", "kind": "xform",
        "opacity": [[8, 14, 0.0, 0.60, "io"], [14, 20, 0.60, 0.56, "lin"], [20, 24, 0.56, 0.0, "out"]],
        "drift_settle": [8, 18, -140, "out"] },
      # GLINTS (particle) — edge glints SHEAR off the crescent (drift up, cold-silver sparks), op_cap 0.44. Clamp: emit 6-18 + life <=5 -> last <=24.
      { "src": "chandrahas_glints", "kind": "particles", "op_cap": 0.44, "drift": "up",
        "emit_frames": [6, 18], "inner_radius": 0.50, "inner_boost": 1.0,
        "speed_px_s": [14, 34], "jitter_deg": 8.0, "life_frames": [3, 5], "fade_frames": 2,
        "lum_thresh": 44, "min_area": 2 },
    ],
  },

  # RAMA'S SIGNET — THE SEAL OF TRUST (Vanara Rare artifact, arrival-only — the Vanara pair opens). Wide plate over the CASTER'S
  # OWN half (R95). SIGNATURE MOTION — THE PRESS (the row's first stamped-down arrival: Amrita poured, Kavacha built, Tripura
  # ascended, Chandrahas gleamed — the Signet is SET). Palette: warm GOLD dominant, leaf-GREEN accent (the Gandiva pairing).
  # Register: steadfast, serene — once pressed it HOLDS; no hit-stop. Wide 1920x640, 24f, fps 24, side_feather 120. SEED 0x9A5E2C —
  # 0x2C even → storm_sign=-1, MOOT (vertical: drift_settle + drift up, NO drift_x). CONTAIN VOCAB: ring + motes are fit:"contain"
  # (the full-height circle in a 3:2 source composites WHOLE on the 3:1 plate; motes populate around the whole circle — the Tamasa
  # extraction lesson). band + haze stay cover-fit. SOLO-STAGGER: band + ring the two bright xforms; haze <0.5; motes capped.
  "ramasignet": {
    "seed": 0x9A5E2C, "fps": 24, "frames": 24, "one_shot": True, "layers_dir": "ramasignet", "canvas": (1920, 640), "side_feather": 120,
    "layers": [
      # HAZE (xform) — the promise's ground: haze settles LOW, dim + warm (peak 0.40, NEVER >0.5), holds, out f18-24.
      { "src": "ramasignet_haze", "kind": "xform",
        "opacity": [[1, 8, 0.0, 0.40, "out"], [8, 18, 0.40, 0.35, "lin"], [18, 24, 0.35, 0.0, "out"]],
        "scale":   [[1, 8, 1.03, 1.0, "out"]] },
      # BAND (xform) — THE PROMISE LAID DOWN: the gold band glows in beneath the host, attack f1-8 to 0.58, HOLDS f8-20 (the seal's
      # ground), band HOLDS LAST — recedes f20-24.
      { "src": "ramasignet_band", "kind": "xform",
        "opacity": [[1, 8, 0.0, 0.58, "out"], [8, 20, 0.58, 0.54, "lin"], [20, 24, 0.54, 0.0, "out"]],
        "scale":   [[1, 8, 1.02, 1.0, "out"]] },
      # RING (xform, CONTAIN — the WHOLE circle) — THE PRESS (signature): the ring DESCENDS from above and SETS (drift_settle
      # POSITIVE, decelerating to rest — a seal stamped into wax), slight scale-DOWN as it presses (Mohini scale vocab), then HOLDS
      # FLAT (the dwell is the oath). attack f4-10 to 0.68, HOLD f10-18, recede f18-24.
      { "src": "ramasignet_ring", "kind": "xform", "fit": "contain",
        "opacity": [[4, 10, 0.0, 0.68, "io"], [10, 18, 0.68, 0.64, "lin"], [18, 24, 0.64, 0.0, "out"]],
        "scale":   [[4, 12, 1.08, 1.0, "out"]],
        "drift_settle": [4, 14, 120, "out"] },
      # MOTES (particle, CONTAIN — populated around the whole circle) — the host's warmth ANSWERING: leaf-gold motes RISE around the
      # set seal (drift up), op_cap 0.44. Clamp: emit 10-20 + life <=5 -> last <=24.
      { "src": "ramasignet_motes", "kind": "particles", "fit": "contain", "op_cap": 0.44, "drift": "up",
        "emit_frames": [10, 20], "inner_radius": 0.50, "inner_boost": 1.0,
        "speed_px_s": [12, 30], "jitter_deg": 8.0, "life_frames": [3, 5], "fade_frames": 2,
        "lum_thresh": 44, "min_area": 2 },
    ],
  },

  # KISHKINDHA CROWN — THE CANOPY CROWNS THE HOST (Vanara Mythic artifact, arrival-only — the Vanara pair CLOSES). Wide plate over
  # the CASTER'S OWN half (R95). PAIR MIRROR: the Signet PRESSED DOWN (drift_settle positive); the Crown CRESTS UP (drift_settle
  # NEGATIVE). Palette: GREEN-dominant, gold accent (the mirror of the Signet's gold-dominant — measured on baked frames). Register:
  # verdant, serene, ASCENDING — no hit-stop. Wide 1920x640, 24f, fps 24, side_feather 120. SEED 0x4B8E1D — 0x1D odd → storm_sign=+1,
  # MOOT (vertical: drift_settle + drift up, NO drift_x). FIT: ascent → contain (3:2 full-content, the pre-shipped vocab); bond +
  # crest + haze → cover-fit (bond's two orbs + thread survive the 61% centre crop — proven on bake). SOLO-STAGGER: crest + bond the
  # two bright xforms (the handoff); haze <0.5; ascent capped.
  "kishkindhacrown": {
    "seed": 0x4B8E1D, "fps": 24, "frames": 24, "one_shot": True, "layers_dir": "kishkindhacrown", "canvas": (1920, 640), "side_feather": 120,
    "layers": [
      # HAZE (xform) — the forest floor of light: kingdom haze settles LOW, dim + green (peak 0.40, NEVER >0.5), holds, out f18-24.
      { "src": "kishkindhacrown_haze", "kind": "xform",
        "opacity": [[1, 8, 0.0, 0.40, "out"], [8, 18, 0.40, 0.35, "lin"], [18, 24, 0.35, 0.0, "out"]],
        "scale":   [[1, 8, 1.03, 1.0, "out"]] },
      # CREST (xform) — THE CANOPY CRESTS UP (the Signet's MIRROR): drift_settle NEGATIVE (rises from below, crowning the host),
      # attack f4-10 to 0.66, HOLD f10-16 (Mythic dwell), recede f16-24.
      { "src": "kishkindhacrown_crest", "kind": "xform",
        "opacity": [[4, 10, 0.0, 0.66, "io"], [10, 16, 0.66, 0.62, "lin"], [16, 24, 0.62, 0.0, "out"]],
        "scale":   [[4, 12, 0.97, 1.0, "io"]],
        "drift_settle": [4, 14, -110, "out"] },
      # BOND (xform) — THE TWIN BOND gleams within the crest's heart (the two-as-one sign): gentle BLOOM, NO travel — attack f8-14
      # to 0.60, hold f14-20, recede f20-24. Cover-fit (both orbs + the thread survive the centre crop).
      { "src": "kishkindhacrown_bond", "kind": "xform",
        "opacity": [[8, 14, 0.0, 0.60, "io"], [14, 20, 0.60, 0.56, "lin"], [20, 24, 0.56, 0.0, "out"]],
        "scale":   [[8, 14, 0.92, 1.0, "io"]] },
      # ASCENT (particle, CONTAIN — the whole braid) — the host RISING TOGETHER: braided pairs spiral UP through the crest (drift
      # up), op_cap 0.44. Clamp: emit 10-20 + life <=5 -> last <=24.
      { "src": "kishkindhacrown_ascent", "kind": "particles", "fit": "contain", "op_cap": 0.44, "drift": "up",
        "emit_frames": [10, 20], "inner_radius": 0.50, "inner_boost": 1.0,
        "speed_px_s": [12, 30], "jitter_deg": 8.0, "life_frames": [3, 5], "fade_frames": 2,
        "lum_thresh": 44, "min_area": 2 },
    ],
  },

  # PATALA THRONE — THE SEAT OF SERPENT KINGS (Naga Mythic artifact, arrival-only — the artifact row continues into the deep). Wide
  # plate over the CASTER'S OWN half (R95 artifact-row polarity). SIGNATURE MOTION — THE THRONE RISES FROM THE ABYSS (drift_settle
  # NEGATIVE, the Tripura-rise / Crown-crest idiom, but ABYSSAL: dark, patient, heavy — the Naga does not race; the seat ascends and
  # SITS, the longest hold in the row). Palette (probed on the layers): abyssal TEAL dominant — rift bright R/G/B 9/104/102, strata +
  # breath teal — with an OLD-GOLD accent (gold glints R/G/B 74/75/34, specky: 0.4% cov spread over 12% of the frame). Register:
  # menacing, deep, still — no hit-stop (an artifact, not an astra). Wide 1920x640, 24f, fps 24, side_feather 120. SEED 0x2E7A4C —
  # 0x4C even → storm_sign=-1, MOOT (vertical set: drift_settle + glints drift up, NO drift_x). ALL cover-fit (the Chandrahas
  # precedent — horizontal rift/throne content centres in the crop; no circle → no 'contain' vocab, no new primitive). SOLO-STAGGER:
  # rift + strata the two bright xforms (the deep opens; the strata answer, LOW, never merging with the high rift); haze (breath)
  # <0.5; gold glints capped. LOAD-BEARING NOTE (STRIKE-PLATE NO-FIRE): this VFX is the ARRIVAL only. The Throne's R11 passive
  # (Venom drain −(1+round)) renders through the existing venom pipeline; its deepened −3-at-R2 round-end toast MUST NOT fire the
  # Vasuki-Strike payoff plate (index.html sprVenomDrain) — that guard keys on venomStrikeNpAtAction (an ACTUAL Strike cast), NOT
  # the drain amount, so Throne-alone stays -1 → silent. No guard change; proven live both ways (Throne-only silent, Throne+Strike fires).
  "patala": {
    "seed": 0x2E7A4C, "fps": 24, "frames": 24, "one_shot": True, "layers_dir": "patala", "canvas": (1920, 640), "side_feather": 120,
    "layers": [
      # HAZE (breath, xform) — THE ABYSS BREATHES OUT: the deep exhales, dim + teal (peak 0.40, NEVER >0.5), holds, out f18-24.
      { "src": "patala_breath", "kind": "xform",
        "opacity": [[1, 8, 0.0, 0.40, "out"], [8, 18, 0.40, 0.35, "lin"], [18, 24, 0.35, 0.0, "out"]],
        "scale":   [[1, 8, 1.03, 1.0, "out"]] },
      # RIFT (xform) — THE DEEP OPENS / THE THRONE RISES (signature): drift_settle NEGATIVE (the seat ascends from the abyss — the
      # Tripura-rise / Crown-crest idiom), attack f4-10 to 0.66, HOLD f10-18 (the throne SITS — Mythic dwell, longest hold in the
      # row), recede f18-24. Abyssal teal, brightest layer.
      { "src": "patala_rift", "kind": "xform",
        "opacity": [[4, 10, 0.0, 0.66, "io"], [10, 18, 0.66, 0.62, "lin"], [18, 24, 0.62, 0.0, "out"]],
        "scale":   [[4, 12, 0.97, 1.0, "io"]],
        "drift_settle": [4, 14, -120, "out"] },
      # STRATA (xform) — THE DEEP ROCK ANSWERS beneath the throne (the strata bands rise to meet the ascending seat; APPROACH but
      # NEVER merge — rift holds HIGH, strata stay LOW, the Chandrahas crescent/crimson discipline): gentle bloom + slight rise,
      # attack f8-14 to 0.56, hold f14-20, recede f20-24.
      { "src": "patala_strata", "kind": "xform",
        "opacity": [[8, 14, 0.0, 0.56, "io"], [14, 20, 0.56, 0.52, "lin"], [20, 24, 0.52, 0.0, "out"]],
        "drift_settle": [8, 18, -80, "out"] },
      # GOLD (particle) — OLD-GOLD GLINTS rise off the serpent thrones (drift up, warm-gold sparks against the teal deep), op_cap
      # 0.44. Clamp: emit 6-18 + life <=5 -> last <=24.
      { "src": "patala_gold", "kind": "particles", "op_cap": 0.44, "drift": "up",
        "emit_frames": [6, 18], "inner_radius": 0.50, "inner_boost": 1.0,
        "speed_px_s": [12, 30], "jitter_deg": 8.0, "life_frames": [3, 5], "fade_frames": 2,
        "lum_thresh": 44, "min_area": 2 },
    ],
  },

  # MOHINI TRAP — the illusion snare. Sanjivani Corruption's SQUARE sibling in the ILLUSION register (a live unit turned to the
  # captor's side, arriving at its NEW cell). 28f one-shot (the Sanjivani sibling length). R94 SILHOUETTE-LAW: illusion renders
  # as PHENOMENON, never as person — no figures/faces/eyes (the layer art obeys this; the compositor only moves light). Palette:
  # moon-silver + iridescent violet, cold teal undertone — moderate peaks (a snare, NOT a rebirth; no rebirth-bright). Beats:
  # veil blooms → rings CONVERGE INWARD (scale-down, the snare cinching — existing scale vocab, no new primitive) → shards SWIRL
  # (rotate, the illusion refracting) → motes linger and thin (dreamlike dispersal). ≤2 layers >0.5 (audit). SEED 0x9E1D5A:
  # 0x5A even → storm_sign=-1, MOOT (no drift_x; rings=scale, shards=rotate — neither seed-signed). Square → no side_feather.
  "mohini": {
    "seed": 0x9E1D5A, "fps": 24, "frames": 28, "one_shot": True, "layers_dir": "mohini", "canvas": (1254, 1254),
    "layers": [
      # VEIL (xform) — the illusion blooms at the cell (iridescent, gentle) 0→0.65 (f1-8), dims as the rings converge, out by 24.
      { "src": "mohini_veil", "kind": "xform",
        "opacity": [[1, 8, 0.0, 0.65, "io"], [8, 16, 0.65, 0.35, "in"], [16, 24, 0.35, 0.0, "out"]],
        "scale":   [[1, 8, 0.94, 1.02, "io"]] },
      # RINGS (xform) — THE SNARE CINCHES: the rings CONVERGE INWARD (scale 1.18→0.90 over f5-16 — the snare tightening), opacity
      # 0→0.70 hold, out by 24.
      { "src": "mohini_rings", "kind": "xform",
        "opacity": [[5, 12, 0.0, 0.70, "io"], [12, 16, 0.70, 0.70, "lin"], [16, 24, 0.70, 0.0, "out"]],
        "scale":   [[5, 16, 1.18, 0.90, "io"]] },
      # SHARDS (xform) — the illusion REFRACTING: a slow swirl (rotate 40° over f12-28), opacity 0→0.62 hold, out by 28.
      { "src": "mohini_shards", "kind": "xform",
        "opacity": [[12, 18, 0.0, 0.62, "io"], [18, 22, 0.62, 0.62, "lin"], [22, 28, 0.62, 0.0, "out"]],
        "scale":   [[12, 18, 0.95, 1.0, "io"]],
        "rotate":  [12, 28, 40] },
      # MOTES (particle) — the dreamlike TAIL: motes linger and thin, dispersing outward (drift out), op_cap 0.50. Clamp: emit 18-23 + life ≤5 ⇒ last ≤28.
      { "src": "mohini_motes", "kind": "particles", "op_cap": 0.50, "drift": "out",
        "emit_frames": [18, 23], "inner_radius": 0.40, "inner_boost": 1.0,
        "speed_px_s": [10, 24], "jitter_deg": 12.0, "life_frames": [3, 5], "fade_frames": 2,
        "lum_thresh": 40, "min_area": 3 },
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

def _fit_contain(rgb, W, H):
    """Scale a layer to FIT WHOLE inside a WxH canvas (preserve aspect, black-pad the overflow — nothing cropped). RAMA'S SIGNET
    ring-wholeness: a full-height circle in a 3:2 source composites WHOLE on the 3:1 plate (s=min → scale-to-fit, centred, padded)."""
    h, w = rgb.shape[:2]
    if (w, h) == (W, H):
        return rgb
    s = min(W / w, H / h)
    rw, rh = max(1, round(w * s)), max(1, round(h * s))
    r = cv2.resize(rgb, (rw, rh), interpolation=cv2.INTER_LANCZOS4 if s < 1 else cv2.INTER_LINEAR)
    out = np.zeros((H, W, rgb.shape[2]), rgb.dtype)
    x0 = (W - rw) // 2; y0 = (H - rh) // 2
    out[y0:y0 + rh, x0:x0 + rw] = r
    return out

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

def _particle_vel(drift, ajit, spd, cx, cy, cx0, cy0, sign=1):
    """Per-drift velocity. radial=outward, inward=toward centre (T89 devour), down, up (default), diag (NAGASTRA down-diagonal
    rake in the storm_sign direction). GATED: every non-'diag' mode ignores `sign` (defaulted 1) ⇒ byte-identical to the inline forms."""
    if drift == "radial":
        ang = math.atan2(cy - cy0, cx - cx0) + ajit; return math.cos(ang)*spd, math.sin(ang)*spd
    if drift == "inward":
        ang = math.atan2(cy0 - cy, cx0 - cx) + ajit; return math.cos(ang)*spd, math.sin(ang)*spd
    if drift == "down":
        return math.sin(ajit)*spd, math.cos(ajit)*spd
    if drift == "diag":                                      # NAGASTRA — down-diagonal dart rake (~50 deg below horizontal); horizontal component in the storm_sign direction (sign threaded from the recipe seed parity)
        a = math.radians(50) + ajit; return sign * math.cos(a) * spd, math.sin(a) * spd
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
        layers = [(L, (_fit_contain if L.get("fit") == "contain" else _fit_cover)(rgb, resW, resH)) for L, rgb in raw]   # per-layer fit (RAMA'S SIGNET): default COVER (byte-identical for every no-fit recipe); fit:"contain" scales-to-fit WHOLE (the ring circle)
    else:
        resH, resW = raw[0][1].shape[:2]; layers = raw

    # SIDE_FEATHER (LANKA DAHAN mandate) — horizontal edge fade: multiply every layer's RGB by a ramp that is 0 at the L/R
    # edges and 1 by `side_feather` px in, so the side columns bake to BLACK (the plate law; intake fire sides measured 185/203).
    # ADDITIVE: only briefs that declare `side_feather` are touched ⇒ every existing sheet re-bakes byte-identical (gate).
    sf = b.get("side_feather")
    if sf:
        col = np.arange(resW)
        ramp = (np.minimum(col, col[::-1]).astype(np.float32) / float(sf)).clip(0.0, 1.0)[None, :, None]   # (1,W,1) → 0 at both edges, 1 interior
        layers = [(L, (rgb.astype(np.float32) * ramp).astype(rgb.dtype)) for L, rgb in layers]

    # PER-LAYER LUMINANCE GAIN (TAMASA brightness-floor mandate, check D) — multiply a layer's RGB by L['lum_gain'] before
    # particle extraction / xform compositing, so an intentionally near-black layer (Tamasa's void motes: src max 14 < its own
    # lum_thresh ⇒ ZERO extracted, invisible) lifts to the legibility floor while staying the DIMMEST layer. ADDITIVE + GATED:
    # only layers declaring 'lum_gain' are touched ⇒ every existing sheet re-bakes byte-identical (the re-bake gate). Applied
    # AFTER side_feather so the edge ramp still zeroes the sides (order preserved).
    layers = [((L, np.clip(rgb.astype(np.float32) * L["lum_gain"], 0, 255).astype(rgb.dtype)) if "lum_gain" in L else (L, rgb)) for L, rgb in layers]

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
                pt["vx"], pt["vy"] = _particle_vel(drift, ajit, spd, pt["cx"], pt["cy"], cx0, cy0, storm_sign)
                pt["life"] = max(1, min(random.randint(cl0, cl1), die_by - pt["act"]))
            else:                                                    # SINGLE-WINDOW path (c1a / gayatri / damage / buff / venom) — UNCHANGED, byte-identical draw order
                r = math.hypot(pt["cx"] - cx0, pt["cy"] - cy0); inner = r <= ir
                choices = list(range(ef0, ef1 + 1))                  # centre-weighted burst: inner blobs are inner_boost× more likely in frames ef0..ef0+1
                weights = [(ib if (inner and fr <= ef0 + 1) else 1.0) for fr in choices]
                pt["act"] = random.choices(choices, weights=weights, k=1)[0]
                ajit = random.uniform(-jit, jit)                     # angle jitter (draw order PRESERVED = the old `theta`)
                spd = random.uniform(s0, s1)
                pt["vx"], pt["vy"] = _particle_vel(drift, ajit, spd, pt["cx"], pt["cy"], cx0, cy0, storm_sign)
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
                if "drift_settle" in L:                         # SANJEEVANI descent: the layer ENTERS from above (dy=-from_px) and EASES to rest (dy=0) — a thing LOWERED, not dropped. [f0,f1,from_px,ease] (ease default 'out' ⇒ decelerating arrival). ADDITIVE: no other recipe uses this key, so every existing sheet re-bakes byte-identical (mrityunjaya byte-identity gate).
                    sf0, sf1, spx = L["drift_settle"][:3]
                    sease = L["drift_settle"][3] if len(L["drift_settle"]) > 3 else "out"
                    if f >= sf0:
                        sp = min(1.0, (f - sf0) / max(1, sf1 - sf0))
                        dy += -spx * (1.0 - EASE[sease](sp))    # dy: -from_px (above rest) → 0 (rest); the layer travels DOWN, decelerating
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
