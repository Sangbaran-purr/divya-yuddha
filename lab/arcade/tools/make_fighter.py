#!/usr/bin/env python3
"""ARCADE-1 · THE FIGHTER TOOL (full moveset, owner rulings of 2026-11-04).   Run with the matting venv:
      lab/vfx-manifestation/tools/.venv/bin/python -I lab/arcade/tools/make_fighter.py [indra meghnad]
   env: ARC_STRIKE24=1 adds the 24 fps strike frames (only if tools/budget.js says they fit — ruling 1);
        ARC_DESPILL=old reproduces the clip test's gentler edge despill (for the before/after only).

Kling clips on chroma green (lab/arcade/sources/<hero>/<hero>_NN_<move>.mp4, gitignored) → one fighter per Hero:
  lab/arcade/fighters/<hero>/{hi,lo}_<n>.webp + .ktx2 pages and manifest.json   (committed: packed pages only — the clip law)
and, for the owner, contact sheets in ~/Desktop/DY_arcade_screens/ (never committed).

THE STEPS
  1 MATTE      green first: alpha from G − max(R, B) with a soft ramp, edge colours un-mixed from the ground; the figure is the
               largest opaque part plus anything touching it; flecks, specks and detached puffs off the figure are cut.
               THE EDGE DESPILL (ruling 7, now the default): on the edge zone (semi-transparent, or the outer EDGE_RIM px) green may
               never be the strongest channel, and on a warm pixel (red ≥ blue + WARM) it may not exceed WARM_CAP × red — so the
               olive (yellow-green) rim goes to 0 while true gold (green ≈ 0.75–0.85 × red) is untouched; solid interiors untouched.
               Per-move clean-ups: CUT BEYOND THE TIP (the special's baked lightning), ground-shadow cut (crouch), skipped ranges.
  2 PIVOT      the stance frame (idle f0): ground row + the feet's centre; each clip registered to it by its own frame 0. A cell
               whose lowest opaque row sits below the ground (a body lying down) is lifted onto it; the jump's cells stand on
               their own lowest point (the engine supplies the height); the walk's cells follow the torso (root motion removed).
  3 ONE SCALE  stance height → STANCE_HI px (hi), STANCE_LO (lo).
  4 FRAMES     every move is TIMED TO THE GAME: its cells are chosen for the game's own durations (the logic frame data), on sharp
               source frames (the sharpest within ±1, avoiding skipped ranges). Idle loops at 8 fps. HOLDS ARE TRIMMED: neighbouring
               cells closer than HOLD_MAE become ONE cell (the sharpest), shown for longer — the cell list repeats it.
  5 PACK       pages (hi ≤ 4096², lo ≤ 2048²), sides a multiple of 4, each page as WebP (straight alpha, the fallback) and as
               KTX2 / Basis Universal (premultiplied: UASTC or ETC1S, chosen by measured quality and size — ruling 1).
  6 MIRROR     the cells are authored facing right and flipped about the pivot at run time; checked on every cell.
"""
import os, sys, json, hashlib, math, subprocess, tempfile
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont

ARC = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO = os.path.dirname(os.path.dirname(ARC))
os.environ.setdefault("U2NET_HOME", os.path.join(REPO, "lab", "vfx-manifestation", "tools", ".venv", "u2net"))
SCREENS = os.path.expanduser("~/Desktop/DY_arcade_screens")

DESPILL = os.environ.get("ARC_DESPILL", "strong")
EDGE_TINT_OLD, EDGE_RIM_OLD = 6.0, 2   # the clip test's rule (kept for the before/after)
EDGE_RIM = 3                         # px (source): the opaque rim the despill covers
WARM, WARM_CAP = 40, 0.92            # a warm pixel: red ≥ blue + WARM; its green capped at WARM_CAP × red
CONTACT_LOOK = 6
KEY_T0, KEY_T1 = 28.0, 85.0
FLECK = 400
FRINGE_LIMIT = 0.002
FEET_ROWS = 14
HEAD_BAND = 140
STANCE_HI, STANCE_LO = int(os.environ.get("ARC_STANCE_HI", 320)), 192   # ARC_STANCE_HI: an option build (the clarity pass) — never the shipped sheets
PAGE = {"hi": 4096, "lo": 2048}
LOOP_MIN = 16
FPS_OUT, IDLE_FPS, HOLD_FPS = 12, 8, 8
HOLD_MAE = 4.0                       # mean |Δ| (0–255, premultiplied RGBA at ¼ size, on the figure's box) under which neighbouring cells are one hold
IDLE_MAE = 2.0                       # the idle keeps its breathing: only true near-duplicates merge
HOLD_WINDOW = 24                     # source frames (1 s) of a held pose, played forward then back (a seamless loop) — Kling's holds drift
LIGHT_CELLS = {"startup": 2, "active": 1, "recovery": 3}
WEBP_Q = {"hi": 82, "lo": 80}
STRIKE24 = os.environ.get("ARC_STRIKE24") == "1"
STRIKE = {"before": 5, "after": 5}   # logic frames around the active frames shown at 24 fps (when STRIKE24)
FRAMES = {"light": (5, 3, 9), "heavy": (12, 4, 18), "special": (16, 8, 26), "counter": (6, 2, 14)}   # core/moves.js (Meghnad's +2 recovery is stretched at run time)
KO_SPAN = 60                         # logic frames the K.O. fall plays over before the last still frame holds
# the KTX2 candidates per rung (ruling 1: UASTC for hi, ETC1S for lo, or the measured best): tried on page 0, PSNR on the premultiplied RGBA
ETC1S_MAX = ["-etc1s", "-q", "255", "-max_endpoints", "16128", "-max_selectors", "16128"]
# OWNER RULING (2026-11-04, third set): ETC1S on both rungs, UASTC off (it measured 35.8 dB but 4.9 MB a fighter on hi, 3× the cap)
ENC = {"hi": [("etc1s", ETC1S_MAX)], "lo": [("etc1s", ETC1S_MAX)]}
UASTC_HI = ["-uastc", "-uastc_level", "2", "-uastc_rdo_l", "1.0", "-ktx2_zstandard_level", "18"]
if os.environ.get("ARC_ENC_HI") == "uastc": ENC["hi"] = [("uastc", UASTC_HI)]   # an option build (the clarity pass)
OPT_OUT = os.environ.get("ARC_OUT")      # an option build writes here (not fighters/), with no contact sheets

# THE CHOICE (ruling 1: "UASTC for hi, ETC1S for lo, or your measured best"): the best PSNR whose projected per-fighter download fits the
# budget's cap (docs/ARCADE_v1.md: hi 1.6 MB, lo 0.7 MB); if none fits, the smallest
DL_CAP = {"hi": 1.6 * 1048576, "lo": 0.7 * 1048576}
NODE = "node"

# THE CUT LIST per Hero (owner brief 2026-11-04 + the clip strips). Frame numbers are source frames (24 fps).
HEROES = {
    "indra": {"name": "Indra", "weapon": "Vajra", "still": "indra-fighter-right-green-1920x1080-v2.png",
        "clips": {"idle": "indra_01_idle.mp4", "walk": "indra_02_walk_forward.mp4", "jump": "indra_04_jump.mp4", "crouch": "indra_05_crouch.mp4",
                  "light": "indra_06_light.mp4", "heavy": "indra_07_heavy.mp4", "special": "indra_08_special.mp4", "block": "indra_09_block.mp4",
                  "hit": "indra_10_hit_reaction.mp4", "knockdown": "indra_10b_knockdown.mp4", "ko": "indra_11_ko.mp4", "win": "indra_12_win.mp4",
                  "parry": "indra_13_counter_parry.mp4", "throw": "indra_14_throw.mp4"},
        "cut": {
            # walk (the reshoot, 2026-11-04): one clean stride cycle f25–f92 of the low guarded stance; the clip's forward travel
            # (~280 px) removed by PIVOT-TRACKING THE FEET (a straight line between the planted feet at f25 and f92, so the stride's
            # own sway stays); sampled every 3rd source frame and played at 12 fps — 1.5× the shot speed (see the report: the game walks
            # ~7× faster than the clip strides, so the feet skate; this narrows it and halves the cells)
            "walk":      {"clip": "walk", "range": [25, 92], "root": "feet-linear", "step": 3, "playFps": 20},   # 20 fps: owner ruling (the skate)
            # the new hop: load 22–33, take-off 40–48, tucked peak 55–65, landing 72–84 → the 40-frame airtime from take-off to touch-down
            "jump":      {"clip": "jump", "span": [42, 82], "n": 8, "pivot": "feet", "look": 2},
            "crouch":    {"clip": "crouch", "enter": [28, 40], "nEnter": 2, "hold": [72, 96], "shadow": True},
            "light":     {"clip": "light", "auto": True},
            # heavy: wind-up 36–46 into the strike 62–70; 50–58 skipped (the Vajra lost in a green smear, the chest turns)
            "heavy":     {"clip": "heavy", "phases": {"startup": [36, 46], "active": [62, 66], "recovery": [70, 96]}, "n": {"startup": 3, "active": 1, "recovery": 4}, "skip": [[50, 58]]},
            # special: overhead raise → the two-handed drive → held → stance; the baked lightning (50–84) cut beyond the Vajra's tip
            "special":   {"clip": "special", "phases": {"startup": [22, 46], "active": [50, 56], "recovery": [60, 94]}, "n": {"startup": 3, "active": 2, "recovery": 5},
                          "cutBeyondTip": {"frames": [48, 86], "ref": 86, "margin": 6}},
            "block":     {"clip": "block", "enter": [12, 26], "nEnter": 2, "hold": [29, 53]},
            # hit: the light flinch is the first flinch, the heavy the full stagger; the mist puff (22–36) is cut by isolation
            "hitLight":  {"clip": "hit", "frames": [31, 37, 41], "exact": True},   # the first flinch = the heavy stagger's first three cells (shared: the lo download cap)
            "hitHeavy":  {"clip": "hit", "span": [30, 54], "n": 5},
            # 10b: struck, falls to hands and knees (wired to knockdown), rises to stance (wired to get-up)
            # 10b (the reshoot, 2026-11-04): hit 8–14, thrown backwards 14–30, lands on his back 30–48, a backward roll over the
            # shoulder 48–66, rises through a crouch 70–80, stance by 88. The clip's leftward travel removed by the body's CENTROID
            # (the engine slides him itself); from the landing on, his lowest point sits on the ground line (the roll included).
            # The get-up is the approved 20 frames: the roll and rise (40 source frames) play ~5× faster than shot — see the report.
            "knockdown": {"clip": "knockdown", "span": [8, 46], "n": 7, "root": "centroid", "groundFrom": 30},
            "getup":     {"clip": "knockdown", "frames": [50, 56, 62, 72, 82], "root": "centroid", "groundFrom": 30},
            # 11 KO: staggers 20–60 (tightened), falls onto the back 60–90, lies still — the last still frame holds
            "ko":        {"clip": "ko", "span": [22, 90], "n": 7, "lie": [100, 120]},
            "win":       {"clip": "win", "enter": [24, 62], "nEnter": 4, "hold": [96, 120]},
            # 13: the deflect (30–42) is the parry; 46–56 skipped (a stray floating object, a shaft to the right edge); the lunge 58–66 is
            # not used (our parry has no built-in counter — the punish is the player's own move)
            "parry":     {"clip": "parry", "span": [30, 42], "n": 3, "skip": [[46, 56]]},
            # the AUTOMATIC COUNTER (ruling 5): after the deflect, the clip's lunge strike (58–66), back to stance; 46–56 skipped
            "counter":   {"clip": "parry", "frames": {"startup": [43, 57], "active": [62], "recovery": [68, 79]}, "skip": [[46, 56]]},
            # 14 THROW (ruling 8): reach + grab 40–48 on the throw's startup/active (a whiff plays the reach back to stance);
            # the pull-in 52–74 during the grab's hold (the tech window); the knee strike — the sharpest frame of 78–86 — lands
            # when the engine applies the throw, then back to stance by ~100
            "throw":     {"clip": "throw", "frames": {"startup": [41, 44], "active": [48], "recovery": [44, 41, 100]}, "exact": True},   # a whiff plays the reach's own cells back
            "throwGrab": {"clip": "throw", "span": [54, 74], "n": 3},
            "throwHit":  {"clip": "throw", "impact": [78, 86], "span": [90, 100], "n": 3},
        }},
    # Meghnad: the full cut (owner brief 2026-11-05, all 14 clips). Moves 01–08 have no owner frame notes: chosen from the clip strips (see
    # the report); 05–14 from the owner's notes. Kling's strays: pieces off the body are cut by isolation; the knockdown's spear, apart
    # from his hand for a few frames (f78–84), is kept by a wider reach so it does not blink out.
    "meghnad": {"name": "Meghnad", "weapon": "spear", "still": "meghnad-fighter-right-green-1920x1080-v2.png",
        "clips": {"idle": "meghnad_01_idle.mp4", "walk": "meghnad_02_walk_forward.mp4", "jump": "meghnad_04_jump.mp4", "crouch": "meghnad_05_crouch.mp4",
                  "light": "meghnad_06_light.mp4", "heavy": "meghnad_07_heavy.mp4", "special": "meghnad_08_special.mp4", "block": "meghnad_09_block.mp4",
                  "hit": "meghnad_10_hit_reaction.mp4", "knockdown": "meghnad_10b_knockdown.mp4", "ko": "meghnad_11_ko.mp4", "win": "meghnad_12_win.mp4",
                  "parry": "meghnad_13_counter_parry.mp4", "throw": "meghnad_14_throw.mp4"},
        "iso": {"knockdown": [{"frames": [10, 15], "mainOnly": True}, {"frames": [76, 86], "nearPx": 61}],
                "ko": [{"frames": [12, 18], "mainOnly": True}],
                "hit": [{"frames": [26, 34], "mainOnly": True}]},
        "cut": {
            # walk: the clip steps out of the wide stance (f25–40), shuffles in a narrow guard (40–76), steps back into the wide stance (76–92) —
            # no repeating stride inside it (the tightest loop, f46–64, barely moves the legs: it glided). So, like Indra's reshoot: the one pass
            # f25–f92 between the two planted wide stances, travel removed by the feet's straight line; every 3rd frame at 20 fps
            "walk":      {"clip": "walk", "range": [25, 92], "root": "feet-linear", "ground": "lowest", "step": 3, "playFps": 20},
            # jump: crouch 25–30, take-off 31–34, tucked 38–44, falling 45–49, landing 50–55 → the 40-frame airtime
            # (the clip smears the take-off 30–36 and the drop 44–49: the cells sit on its sharpest frames — measured, see the report)
            "jump":      {"clip": "jump", "frames": [29, 36, 38, 40, 42, 44, 50, 54], "exact": True, "pivot": "feet"},
            # 05 crouch (owner): down f20–33 (up = reversed by the engine), hold f35–120 (breathing)
            "crouch":    {"clip": "crouch", "enter": [20, 33], "nEnter": 2, "hold": [35, 120], "shadow": True},
            "light":     {"clip": "light", "auto": True},
            # 07 heavy: overhead raise 16–36, the downward spear-drive lands 44–48, held, back to stance by ~100; the clip
            # travels ~450 px forward and back (removed: the engine moves him); 72–90 skipped (a second, smeared thrust)
            "heavy":     {"clip": "heavy", "phases": {"startup": [16, 38], "active": [44, 48], "recovery": [52, 100]}, "n": {"startup": 3, "active": 1, "recovery": 4},
                          "skip": [[72, 90]], "root": "centroid"},
            # 08 special (the Nagapasha cast): the spear drawn back 18–36, the thrust 40–46 into the held cast 46–76, back by ~100
            "special":   {"clip": "special", "phases": {"startup": [16, 38], "active": [44, 52], "recovery": [60, 100]}, "n": {"startup": 3, "active": 2, "recovery": 5}},
            # 09 block (owner): raise f30–45 (lowering reversed), hold f45–60 ping-pong; f60+ ignored (the spear drifts)
            "block":     {"clip": "block", "enter": [30, 45], "nEnter": 2, "hold": [45, 60]},
            # 10 hit (owner): f0–34 unusable (a stray spear through his chest f29–32); recoil 35–44, recoiled 45–76, recovery 77–90;
            # the ~250 px backward travel removed (the engine supplies knockback). The light flinch = the heavy stagger's first three cells.
            "hitLight":  {"clip": "hit", "frames": [36, 40, 44], "root": "centroid"},
            "hitHeavy":  {"clip": "hit", "frames": [36, 40, 44, 58, 76, 84, 90], "root": "centroid"},
            # 10b knockdown (owner): strays f12–13 dropped, start ~f16; flight 16–29, flat on his back 30–47; get-up 48–88 (sits up,
            # kneels, grabs the spear, rises) on the approved 40 frames; the leftward travel removed (the centroid)
            # (f25–29 smear the spear into a translucent streak that isolation would cut — the cells skip them: the spear never blinks out)
            "knockdown": {"clip": "knockdown", "frames": [16, 20, 23, 30, 36, 41, 46], "exact": True, "root": "centroid", "groundFrom": 30},
            "getup":     {"clip": "knockdown", "frames": [52, 62, 72, 80, 88], "root": "centroid", "groundFrom": 30},
            # 11 KO (owner): strays f14–16 dropped; recoil 20–35; 36–58 SKIPPED (he stumbles toward the opponent); the fall 60–100,
            # backward, flat, head to the left; joined 35→60 by the presentation's cross-fade; the last frame held; all travel removed
            "ko":        {"clip": "ko", "frames": [22, 29, 35, 66, 78, 90, 100], "root": "centroid", "groundFrom": 80, "lie": [100, 118]},
            # 12 win (owner): rise, plant the spear, raise the fist 15–90; hold from 90; the ~250 px forward step removed
            "win":       {"clip": "win", "enter": [15, 90], "nEnter": 4, "hold": [90, 114], "root": "centroid"},
            # 13 (owner): the deflect 15–24 is the parry; the counter: lunge 25–30, hit ~28–34, the held thrust 30–65, recovery 66–85;
            # the ~400 px lunge travel removed; strike frames at 24 fps
            "parry":     {"clip": "parry", "span": [15, 24], "n": 3},
            "counter":   {"clip": "parry", "phases": {"startup": [23, 29], "active": [30, 34], "recovery": [40, 88]}, "n": {"startup": 2, "active": 1, "recovery": 3},
                          "root": "centroid", "strike24": True},
            # 14 the spear-hook throw (owner): wind-up 20–28, hook/catch 38–45 (startup/active; a whiff plays the wind-up back),
            # the yank 45–56 over the grab's hold (the engine pulls the caught Hero to knee distance), the knee 58–75 (impact the
            # sharpest of 62–68), recovery 76–90. The engine's throw range stays short: the hook's length is visual only.
            "throw":     {"clip": "throw", "frames": {"startup": [22, 28], "active": [41], "recovery": [28, 22, 88]}, "exact": True, "root": "centroid"},
            "throwGrab": {"clip": "throw", "span": [46, 56], "n": 3, "root": "centroid"},
            "throwHit":  {"clip": "throw", "impact": [62, 68], "span": [76, 90], "n": 3, "root": "centroid"},
        }},
}

def sha(path):
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for b in iter(lambda: f.read(1 << 20), b""): h.update(b)
    return h.hexdigest()

def decode(path):
    cap = cv2.VideoCapture(path); fr = []
    while True:
        ok, f = cap.read()
        if not ok: break
        fr.append(cv2.cvtColor(f, cv2.COLOR_BGR2RGB))
    return fr, cap.get(cv2.CAP_PROP_FPS)

def ground_colour(rgb):
    c = np.concatenate([rgb[:40, :40].reshape(-1, 3), rgb[:40, -40:].reshape(-1, 3), rgb[-40:, -40:].reshape(-1, 3)])
    return np.median(c, axis=0).astype(np.float32)

def key(rgb, K, mode=None):
    mode = mode or DESPILL
    kc = int(np.argmax(K)); o1, o2 = [c for c in (0, 1, 2) if c != kc]
    a = rgb.astype(np.float32)
    dom = a[..., kc] - np.maximum(a[..., o1], a[..., o2])
    alpha = 1.0 - np.clip((dom - KEY_T0) / (KEY_T1 - KEY_T0), 0, 1)
    am = np.maximum(alpha, 0.05)[..., None]
    fg = np.clip((a - (1.0 - alpha)[..., None] * K) / am, 0, 255)
    fg[..., kc] = np.minimum(fg[..., kc], np.maximum(fg[..., o1], fg[..., o2]))
    if mode == "old":   # the clip test's rule: on the edge zone, green ≤ mean(red, blue) + 6
        soft = edge_zone(alpha, EDGE_RIM_OLD)
        cap = (fg[..., o1] + fg[..., o2]) / 2 + EDGE_TINT_OLD
        fg[..., kc] = np.where(soft, np.minimum(fg[..., kc], cap), fg[..., kc])
        return alpha, fg
    # THE STRONG EDGE DESPILL (ruling 7, the default): on the edge zone green is never the strongest channel (whites stay
    # neutral), and on a warm pixel (red ≥ blue + WARM) green ≤ WARM_CAP × red — the olive rim goes, true gold (G ≈ 0.75–0.85 R) stays
    soft = edge_zone(alpha, EDGE_RIM)
    R, B = fg[..., 0], fg[..., 2]
    cap = np.maximum(R, B)
    cap = np.where(R >= B + WARM, np.minimum(cap, WARM_CAP * R), cap)
    fg[..., 1] = np.where(soft, np.minimum(fg[..., 1], cap), fg[..., 1])
    return alpha, fg

def edge_zone(alpha, rim=EDGE_RIM):
    inner = cv2.erode((alpha > 0.98).astype(np.uint8), np.ones((2 * rim + 1, 2 * rim + 1), np.uint8)).astype(bool)
    return (alpha > 0.0) & ~inner

def final_despill(alpha, fg):
    soft = edge_zone(alpha, EDGE_RIM); fg = fg.copy(); R, B = fg[..., 0], fg[..., 2]
    cap = np.maximum(R, B); cap = np.where(R >= B + WARM, np.minimum(cap, WARM_CAP * R), cap)
    fg[..., 1] = np.where(soft, np.minimum(fg[..., 1], cap), fg[..., 1]); return fg

ENC_LOCK = {}   # ruling 1 — one encoding per rung for every Hero: the first FULL cut (≥ 100 cells) measures and chooses; placeholders follow

def olive(alpha, fg):
    # the audit (ruling 7): edge pixels (alpha > 0.05, in the edge zone) carrying an olive / green tint — green the strongest channel,
    # or a warm pixel whose green is above 0.95 × red
    z = (alpha > 0.05) & edge_zone(alpha, EDGE_RIM)
    R, G, B = fg[..., 0], fg[..., 1], fg[..., 2]
    bad = (G > np.maximum(R, B) + 2) | ((R >= B + WARM) & (G > 0.95 * R + 2))
    return int((z & bad).sum())


def sharpness(rgb, alpha):
    g = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY).astype(np.float32)
    lap = cv2.Laplacian(g, cv2.CV_32F)
    m = cv2.erode((alpha > 0.5).astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool)
    return float(lap[m].var()) if m.any() else 0.0

ISO_LAST = {"maxDropped": 0}
def isolate(alpha, nearPx=9, mainOnly=False):
    # nearPx: a piece within this many px of the body is kept (a spear tip a hand's width off the grip, for a few frames);
    # mainOnly: only the body's own component survives (frames with stray objects Kling added touching nothing)
    mask = (alpha > 0.35).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(mask, 8)
    ISO_LAST["maxDropped"] = 0
    if n <= 1: return alpha, 0
    main = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
    near = cv2.dilate((lab == main).astype(np.uint8), np.ones((nearPx, nearPx), np.uint8)).astype(bool)
    keep = np.zeros_like(mask, bool); dropped = 0
    for i in range(1, n):
        comp = lab == i
        if i == main or (not mainOnly and ((st[i, cv2.CC_STAT_AREA] >= FLECK and near[comp].any()) or (near[comp].any() and st[i, cv2.CC_STAT_AREA] >= 20))): keep |= comp
        else: dropped += 1; ISO_LAST["maxDropped"] = max(ISO_LAST["maxDropped"], int(st[i, cv2.CC_STAT_AREA]))
    # soft edge pixels below the threshold survive only next to what was kept
    zone = cv2.dilate(keep.astype(np.uint8), np.ones((7, 7), np.uint8)).astype(bool)
    out = np.where(zone, alpha, 0.0)
    return out.astype(np.float32), dropped

def edge_band(alpha, w=4):
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * w + 1, 2 * w + 1))
    return (cv2.dilate((alpha > 0.02).astype(np.uint8), k) & (1 - cv2.erode((alpha > 0.98).astype(np.uint8), k))).astype(bool)

def fringe_share(rgb, alpha, K, region=None):
    band = edge_band(alpha)
    if region is not None: band &= region
    if not band.any(): return 0.0
    near_ground = np.linalg.norm(rgb.astype(np.float32) - K, axis=2) < 45
    return float(((alpha > 0.5) & near_ground & band).sum()) / float(band.sum())

_rembg = None
def rembg_mask(rgb):
    global _rembg
    if _rembg is None:
        from rembg import new_session, remove
        _rembg = (new_session("isnet-general-use"), remove)
    s, rm = _rembg
    return np.asarray(rm(Image.fromarray(rgb), session=s, only_mask=True)).astype(np.float32) / 255.0

def matte(rgb, K, mode=None, iso=None):
    alpha, fg = key(rgb, K, mode)
    alpha, dropped = isolate(alpha, **(iso or {})); biggest = ISO_LAST["maxDropped"]
    share = fringe_share(rgb, alpha, K); used = False
    if share > FRINGE_LIMIT:
        band = edge_band(alpha); m = rembg_mask(rgb)
        alpha = np.where(band, np.minimum(alpha, m), alpha); used = True
    return alpha, fg, {"fringe": round(share, 5), "fringeAfter": round(fringe_share(rgb, alpha, K), 5), "rembg": used, "flecksCut": dropped, "strayPx": biggest}

def feet(alpha):
    rows = np.where((alpha > 0.5).any(axis=1))[0]
    gy = int(rows.max())
    ys, xs = np.where(alpha[gy - FEET_ROWS + 1: gy + 1] > 0.5)
    return gy, float(xs.mean())

def head_top(alpha, fx):
    x0, x1 = int(max(0, fx - HEAD_BAND)), int(min(alpha.shape[1], fx + HEAD_BAND))
    rows = np.where((alpha[:, x0:x1] > 0.5).any(axis=1))[0]
    return int(rows.min())

def front_x(alpha):
    cols = np.where((alpha > 0.5).any(axis=0))[0]
    return int(cols.max())

def tightest_loop(mattes):
    # the error is measured on the FIGURE (its premultiplied colour and alpha, in frame 0's box) — the green ground would
    # otherwise swamp it, and a barely-moving figure would "loop" after a few frames. The loop closes at the error's minimum
    # inside the first full cycle: after it has climbed past half its peak, before it climbs past half again.
    a0 = mattes[0][0]; ys, xs = np.where(a0 > 0.5)
    y0, y1, x0, x1 = max(0, ys.min() - 20), ys.max() + 20, max(0, xs.min() - 20), xs.max() + 20
    def g(m): a, fg = m[0], m[1]; return np.dstack([fg * a[..., None], a[..., None] * 255])[y0:y1, x0:x1].astype(np.float32)
    g0 = g(mattes[0]); errs = [float(np.abs(g(m) - g0).mean()) for m in mattes]
    half = max(errs) / 2
    up = next(i for i, e in enumerate(errs) if e > half)
    down = next((i for i in range(up, len(errs)) if errs[i] <= half), len(errs) - 1)
    again = next((i for i in range(down, len(errs)) if errs[i] > half), len(errs))
    L = down + int(np.argmin(errs[down:again]))
    return max(L, LOOP_MIN), errs

def pick_light(fronts, base):
    # the reach curve. base = the stance's front edge. The reach is the PLATEAU (a 3-frame rolling median, so a one-frame
    # motion-smear spike can't set it); contact = the first CLEAN frame at it (within ±2%). Startup = the wind-up (the front
    # edge's lowest point before contact, when the Hero draws back at all) and the first frame at ≥ 40% of the reach.
    rolled = [sorted(fronts[max(0, i - 1): i + 2])[len(fronts[max(0, i - 1): i + 2]) // 2] for i in range(len(fronts))]
    plateau = max(rolled); span = plateau - base
    contact = next(i for i, f in enumerate(fronts) if abs(f - plateau) <= 0.02 * span)
    mid = next(i for i, f in enumerate(fronts) if f - base >= 0.4 * span)
    wind = int(np.argmin(fronts[:contact]))
    start = wind if base - fronts[wind] >= 0.03 * span else next(i for i, f in enumerate(fronts) if f - base > 0.06 * span)
    # the return: after the hold, the first frame back under 15% of the span; the hold's end is the last frame still at ≥ 90%
    back = next((i for i in range(contact, len(fronts)) if fronts[i] - base < 0.15 * span), len(fronts) - 1)
    hold_end = max(i for i in range(contact, back + 1) if fronts[i] - base >= 0.9 * span)
    su = [start, mid] if mid > start else [start, contact - 1]
    rec = [int(round(hold_end + (back - hold_end) * (k + 1) / (LIGHT_CELLS["recovery"] + 1))) for k in range(LIGHT_CELLS["recovery"])]
    spike = [i for i, f in enumerate(fronts) if f - plateau > 0.05 * span]
    return {"startup": [int(x) for x in su], "active": [int(contact)], "recovery": [int(x) for x in rec]}, \
        {"windup": int(start), "mid": int(mid), "contact": int(contact), "holdEnd": int(hold_end), "back": int(back), "reachPx": int(span), "plateauX": int(plateau), "spikeFrames": spike}

def cut_cell(alpha, fg, scale, pivot):
    # scale the frame (premultiplied, so edges don't pick up dark halos), trim to the alpha box, record the pivot in the cell
    h, w = alpha.shape
    pm = np.dstack([fg * alpha[..., None], alpha * 255.0]).astype(np.float32)
    sw, sh = max(1, int(round(w * scale))), max(1, int(round(h * scale)))
    small = cv2.resize(pm, (sw, sh), interpolation=cv2.INTER_AREA)
    a = small[..., 3] / 255.0
    ys, xs = np.where(a > 0.004)
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    rgb = np.where(a[..., None] > 0, small[..., :3] / np.maximum(a[..., None], 1e-4), 0)
    rgba = np.dstack([np.clip(rgb, 0, 255), np.clip(a * 255, 0, 255)]).astype(np.uint8)[y0:y1, x0:x1]
    px, py = pivot[0] * scale - x0, pivot[1] * scale - y0
    return rgba, round(float(px), 2), round(float(py), 2)

def pack(cells, maxw):
    # shelf packing in the order given; 2 px gutters
    x = y = shelf = 0; rects = []
    for c in cells:
        h, w = c.shape[:2]
        if x + w + 2 > maxw: x = 0; y += shelf + 2; shelf = 0
        rects.append((x, y, w, h)); x += w + 2; shelf = max(shelf, h)
    W = max(r[0] + r[2] for r in rects); H = y + shelf
    sheet = np.zeros((H, W, 4), np.uint8)
    for c, (x, y, w, h) in zip(cells, rects): sheet[y:y + h, x:x + w] = c
    return sheet, rects

def font(sz):
    for p in ("/System/Library/Fonts/Supplemental/Arial.ttf", "/System/Library/Fonts/Helvetica.ttc"):
        if os.path.exists(p): return ImageFont.truetype(p, sz)
    return ImageFont.load_default()

def checker(w, h, s=16):
    yy, xx = np.mgrid[0:h, 0:w]; c = (((yy // s) + (xx // s)) % 2) * 30 + 40
    return np.dstack([c, c, c]).astype(np.uint8)

def contact_sheet(path, cells, labels, title, pivots, flip=False, bg="checker"):
    # tiles sized by the widest reach on EACH side of the feet (centring wide cells on the feet would clip a weapon held out front)
    L = max(px for px, py in pivots); Rr = max(c.shape[1] - px for c, (px, py) in zip(cells, pivots))
    if flip: L, Rr = Rr, L
    th = max(c.shape[0] for c in cells) + 8; tw = int(math.ceil(L + Rr)) + 16; cols = min(8, len(cells)); rows = math.ceil(len(cells) / cols)
    W, H = cols * tw, rows * (th + 22) + 34
    out = Image.new("RGB", (W, H), (18, 14, 10)); d = ImageDraw.Draw(out); f = font(14)
    d.text((8, 8), title, fill=(232, 200, 116), font=font(16))
    for k, (c, lab, (px, py)) in enumerate(zip(cells, labels, pivots)):
        x, y = (k % cols) * tw + 4, (k // cols) * (th + 22) + 34
        if flip: c = c[:, ::-1]; px = c.shape[1] - px
        base = Image.fromarray(checker(tw - 8, th - 8) if bg == "checker" else np.full((th - 8, tw - 8, 3), bg, np.uint8))
        ox, oy = int(L + 4 - px), int(th - 8 - py - 2)      # every cell placed by its pivot: the feet on one line
        base.paste(Image.fromarray(c), (ox, oy), Image.fromarray(c[..., 3]))
        out.paste(base, (x, y + 18))
        dd = ImageDraw.Draw(out)
        dd.line([(x, y + 18 + th - 10), (x + tw - 8, y + 18 + th - 10)], fill=(232, 200, 116), width=1)          # the ground line
        dd.line([(x + L + 4, y + 18 + th - 18), (x + L + 4, y + 18 + th - 2)], fill=(255, 80, 60), width=1)   # the pivot
        dd.text((x + 2, y + 2), lab, fill=(220, 210, 180), font=f)
    out.save(path, quality=85)

def crops_sheet(path, title, crops):
    # zoomed matte edges over dark and light grounds, to judge fringe by eye
    tiles = []
    for lab, rgba in crops:
        z = cv2.resize(rgba, (rgba.shape[1] * 3, rgba.shape[0] * 3), interpolation=cv2.INTER_NEAREST)
        for bg in ((16, 12, 8), (235, 235, 235)):
            base = Image.new("RGB", (z.shape[1], z.shape[0]), bg); base.paste(Image.fromarray(z), (0, 0), Image.fromarray(z[..., 3]))
            tiles.append((lab, base))
    W = sum(t.width for _, t in tiles) + 10 * len(tiles) + 10; H = max(t.height for _, t in tiles) + 50
    out = Image.new("RGB", (W, H), (30, 24, 16)); d = ImageDraw.Draw(out); d.text((8, 6), title, fill=(232, 200, 116), font=font(16)); x = 10
    for lab, t in tiles: out.paste(t, (x, 40)); d.text((x, 26), lab, fill=(220, 210, 180), font=font(12)); x += t.width + 10
    out.save(path, quality=90)


# ═══ the full-moveset build ═══
class Clip:
    """one source clip: decoded frames, its ground colour, and a cache of CROPPED mattes (a float32 alpha + uint8 colour + offset)"""
    LRU = []                     # at most two clips' full-resolution frames in memory (a clip is ~750 MB decoded)
    def __init__(self, hero, name, fn):
        self.path = os.path.join(ARC, "sources", hero, fn)
        self.name, self.fn, self.sha = name, fn, sha(self.path)
        self._frames = None; fr = self.frames; self.n = len(fr); self.fps = self._fps
        self.K = ground_colour(fr[0]); self.cache = {}; self.post = None; self.notes = {}; self.iso = []
    @property
    def frames(self):
        if self._frames is None:
            self._frames, self._fps = decode(self.path)
            Clip.LRU.append(self)
            while len(Clip.LRU) > 2: old = Clip.LRU.pop(0); old._frames = None
        return self._frames
    def m(self, i, mode=None):
        k = (i, mode or DESPILL)
        if k not in self.cache:
            iso = next(({k: v for k, v in r.items() if k != "frames"} for r in self.iso if r["frames"][0] <= i <= r["frames"][1]), None)
            a, fg, st = matte(self.frames[i], self.K, mode, iso)
            if self.post: a = self.post(i, a, fg, st)
            fg = np.clip(np.rint(fg), 0, 255)           # despill the values as STORED (8-bit), so the audit sees exactly what ships
            if (mode or DESPILL) != "old": fg = np.floor(final_despill(a, fg))   # isolation and the clean-ups make new edges: despill them too
            ys, xs = np.where(a > 0.004)
            y0, y1, x0, x1 = max(0, ys.min() - 4), min(a.shape[0], ys.max() + 5), max(0, xs.min() - 4), min(a.shape[1], xs.max() + 5)
            self.cache[k] = {"a": a[y0:y1, x0:x1].copy(), "fg": np.clip(fg[y0:y1, x0:x1], 0, 255).astype(np.uint8), "ox": int(x0), "oy": int(y0), "st": st, "i": i, "clip": self.name}
        return self.cache[k]

def M_rows(M): return np.where((M["a"] > 0.5).any(axis=1))[0]
def M_lowest(M): return int(M_rows(M).max()) + M["oy"]
def M_top(M): return int(M_rows(M).min()) + M["oy"]
def M_front(M): return int(np.where((M["a"] > 0.5).any(axis=0))[0].max()) + M["ox"]
def M_feet(M):
    a = M["a"]; gy = int(M_rows(M).max()); ys, xs = np.where(a[max(0, gy - FEET_ROWS + 1): gy + 1] > 0.5)
    return gy + M["oy"], float(xs.mean()) + M["ox"]
def M_sharp(M): return sharpness(M["fg"], M["a"])
def M_torso(M, stance):   # the torso's x: the alpha centroid between 15% and 50% of the stance height below the frame's own top
    a = M["a"] > 0.5; top = int(M_rows(M).min()); r0, r1 = top + int(0.15 * stance), top + int(0.5 * stance)
    ys, xs = np.where(a[r0:r1]); return float(xs.mean()) + M["ox"] if len(xs) else float(M["ox"])

def small_pm(M, box, shift=0):
    # the premultiplied RGBA of a matte at ¼ size, placed in a frame-coordinate box (x0, y0, x1, y1); shift moves it in x (root motion)
    x0, y0, x1, y1 = box; W, H = (x1 - x0) // 4 + 1, (y1 - y0) // 4 + 1
    out = np.zeros((H, W, 4), np.float32)
    pm = np.dstack([M["fg"].astype(np.float32) * M["a"][..., None], M["a"] * 255.0])
    sm = cv2.resize(pm, (max(1, pm.shape[1] // 4), max(1, pm.shape[0] // 4)), interpolation=cv2.INTER_AREA)
    ox, oy = (M["ox"] + shift - x0) // 4, (M["oy"] - y0) // 4
    xa, ya = max(0, ox), max(0, oy); xb, yb = min(W, ox + sm.shape[1]), min(H, oy + sm.shape[0])
    if xb > xa and yb > ya: out[ya:yb, xa:xb] = sm[ya - oy: yb - oy, xa - ox: xb - ox]
    return out

def figdiff(A, B, shiftB=0):
    box = (min(A["ox"], B["ox"] + shiftB), min(A["oy"], B["oy"]), max(A["ox"] + A["a"].shape[1], B["ox"] + shiftB + B["a"].shape[1]), max(A["oy"] + A["a"].shape[0], B["oy"] + B["a"].shape[0]))
    box = tuple(int(v) for v in box)
    return float(np.abs(small_pm(A, box) - small_pm(B, box, int(shiftB))).mean())

def pick(clip, t, look=1, skip=()):
    # the sharpest frame within ±look of t, never inside a skipped range
    bad = lambda i: any(a <= i <= b for a, b in skip) or i < 0 or i >= clip.n
    cand = [i for i in range(int(round(t)) - look, int(round(t)) + look + 1) if not bad(i)]
    if not cand:
        j = int(round(t)); d = 1
        while bad(j): j = int(round(t)) + (d if d > 0 else d); d = -d if d > 0 else -d + 1
        cand = [j]
    return max(cand, key=lambda i: M_sharp(clip.m(i)))

def even(a, b, n): return [a + (b - a) * k / max(1, n - 1) for k in range(n)] if n > 1 else [(a + b) / 2]

def dedupe(clip, frames, mae=None):
    mae = HOLD_MAE if mae is None else mae
    # HOLD TRIM: a run of neighbouring frames closer than HOLD_MAE is one cell — the sharpest of the run, repeated
    out, run = [], [frames[0]]
    def flush():
        best = max(run, key=lambda i: M_sharp(clip.m(i))); out.extend([best] * len(run))
    for i in frames[1:]:
        if figdiff(clip.m(run[-1]), clip.m(i)) < mae: run.append(i)
        else: flush(); run[:] = [i]
    flush()
    return out

def loop_len(errs):   # v1's rule: the minimum inside the first full cycle (after rising past half the peak, before rising again)
    half = max(errs) / 2
    up = next((i for i, e in enumerate(errs) if e > half), 1)
    down = next((i for i in range(up, len(errs)) if errs[i] <= half), len(errs) - 1)
    again = next((i for i in range(down, len(errs)) if errs[i] > half), len(errs))
    return down + int(np.argmin(errs[down:again]))

def run_basisu(png, out, args):
    r = subprocess.run(["basisu"] + args + ["-ktx2", png, "-output_file", out], capture_output=True, text=True)
    if r.returncode != 0 or not os.path.exists(out): raise RuntimeError("basisu failed: " + r.stdout[-400:] + r.stderr[-400:])

def ktx2_rgba(path, w, h):
    raw = path + ".rgba"
    r = subprocess.run([NODE, os.path.join(ARC, "tools", "ktx2_decode.js"), path, raw], capture_output=True, text=True)
    if r.returncode != 0: raise RuntimeError("decode failed: " + r.stderr)
    W, H = [int(v) for v in r.stdout.split()[:2]]
    d = np.fromfile(raw, np.uint8).reshape(H, W, 4); os.remove(raw); return d

def psnr(a, b, mask):
    e = ((a.astype(np.float32) - b.astype(np.float32)) ** 2)[mask].mean()
    return 99.0 if e <= 1e-9 else round(float(10 * np.log10(255 ** 2 / e)), 2)

def pack_pages(cells, side):
    # shelf packing, tallest first, 2 px gutters; a new page when one is full; every side padded to a multiple of 4
    order = sorted(range(len(cells)), key=lambda k: -cells[k].shape[0])
    pages, rects = [], [None] * len(cells)
    x = y = shelf = 0; cur = []
    for k in order:
        h, w = cells[k].shape[:2]
        if x + w > side: x = 0; y += shelf + 2; shelf = 0
        if y + h > side: pages.append(cur); cur = []; x = y = shelf = 0
        rects[k] = (len(pages), x, y, w, h); cur.append(k); x += w + 2; shelf = max(shelf, h)
    pages.append(cur)
    sheets = []
    for p, ks in enumerate(pages):
        W = max(rects[k][1] + rects[k][3] for k in ks); H = max(rects[k][2] + rects[k][4] for k in ks)
        W, H = (W + 3) // 4 * 4, (H + 3) // 4 * 4
        sh = np.zeros((H, W, 4), np.uint8)
        for k in ks: _, x, y, w, h = rects[k]; sh[y:y + h, x:x + w] = cells[k]
        sheets.append(sh)
    return sheets, rects

def premult(rgba):
    a = rgba[..., 3:4].astype(np.float32) / 255.0
    return np.dstack([np.round(rgba[..., :3].astype(np.float32) * a), rgba[..., 3:4]]).astype(np.uint8)

def build(hero):
    H = HEROES[hero]; print("── %s ──" % H["name"])
    clips = {}
    for name, fn in H["clips"].items():
        clips[name] = Clip(hero, name, fn)
        c = clips[name]; print("  %s: %d frames @ %g fps, ground %s" % (fn, c.n, c.fps, c.K.astype(int).tolist()))
    cut = H["cut"]
    for cn, rules in H.get("iso", {}).items(): clips[cn].iso = rules

    # ── per-clip clean-ups, before anything is measured ──
    notes = {}
    if "special" in cut and "cutBeyondTip" in cut["special"]:
        cb = cut["special"]["cutBeyondTip"]; sp = clips["special"]
        ref = sp.m(cb["ref"]); tip = M_front(ref); sp.cache.clear()
        def cut_tip(i, a, fg, st, tip=tip, cb=cb):
            if cb["frames"][0] <= i <= cb["frames"][1]:
                before = int((a > 0.05).sum()); a = a.copy(); a[:, tip + cb["margin"]:] = 0; a, _ = isolate(a)
                st["tipCut"] = before - int((a > 0.05).sum())
            return a
        sp.post = cut_tip; notes["special"] = {"tipX": int(tip), "refFrame": cb["ref"]}
    if "crouch" in cut and cut["crouch"].get("shadow"):
        cr = clips["crouch"]; g0, _ = M_feet(cr.m(0)); cr.cache.clear()
        def no_shadow(i, a, fg, st, g0=g0):
            # the faint ground shadow: dark, mostly-transparent pixels on the ground band (never the body's solid pixels)
            band = np.zeros_like(a, bool); band[max(0, g0 - 24): g0 + 8] = True
            dark = fg.mean(axis=2) < 110
            kill = band & dark & (a > 0) & (a < 0.8); st["shadowCut"] = int(kill.sum()); a = a.copy(); a[kill] = 0; return a
        cr.post = no_shadow

    # ── the stance, the scale, each clip's registration ──
    idle = clips["idle"]; s0 = idle.m(0); gy, fx = M_feet(s0)
    top = head_top(np.pad(s0["a"], ((s0["oy"], 0), (s0["ox"], 0))), fx); stance_src = gy - top
    scale = {"hi": STANCE_HI / stance_src, "lo": STANCE_LO / stance_src}
    reg = {}
    for name, c in clips.items():
        g, x = M_feet(c.m(0)); reg[name] = (round(x - fx, 1), int(g - gy))
    print("  stance (idle f0): ground row %d, feet x %.1f, head top %d → %d px source · registration of each clip's frame 0: %s" % (gy, fx, top, stance_src, reg))
    def piv(name): dx, dy = reg[name]; return (fx + (dx if abs(dx) > 1.5 else 0), gy + (dy if abs(dy) > 1 else 0))

    cells, cid = [], {}          # cells: {clip, i, pivot, move}
    def cell(name, i, pivot, move):
        k = (name, int(i), round(pivot[0], 1), round(pivot[1], 1))
        if k not in cid: cid[k] = len(cells); cells.append({"clip": name, "i": int(i), "pivot": [float(pivot[0]), float(pivot[1])], "move": move})
        return cid[k]
    def grounded(name, i, p):
        low = M_lowest(clips[name].m(i)); return (p[0], float(low)) if low > p[1] + 2 else p
    anim, moves_meta = {}, {}

    # IDLE — the tightest loop, at 8 fps, holds trimmed
    recs = [idle.m(i) for i in range(idle.n)]
    errs = [figdiff(recs[0], r) for r in recs]; L = max(LOOP_MIN, loop_len(errs))
    src = list(range(0, L, int(round(idle.fps / IDLE_FPS))))
    src = dedupe(idle, src, IDLE_MAE)
    anim["idle"] = {"loop": [cell("idle", i, piv("idle"), "idle") for i in src], "fps": IDLE_FPS}
    moves_meta["idle"] = {"loopFrames": int(L), "loopError": round(errs[L], 2), "src": src}
    print("  idle: loop %d frames (%.2f s, |Δ| %.2f) → %d cells at 8 fps (%d after the hold trim)" % (L, L / idle.fps, errs[L], len(src), len(set(src))))

    # WALK — root motion removed by the torso; the tightest full cycle inside the search range; 12 fps
    if "walk" in cut:
        c = clips["walk"]; w = cut["walk"]
        if "range" in w: a0, b0 = w["range"]
        else: a0, b0 = w["search"]
        tor = {i: M_torso(c.m(i), stance_src) for i in range(a0, b0 + 1)}
        if w.get("root") == "feet-linear":   # the travel = a straight line between the PLANTED feet at the cycle's two ends (both feet
            # down there; mid-stride the feet's mean jumps as a foot lifts, so it can't be fitted) — the loop then closes exactly in place
            fa, fb = M_feet(c.m(a0))[1], M_feet(c.m(b0))[1]
            tor = {int(i): fa + (fb - fa) * (i - a0) / (b0 - a0) for i in range(a0, b0 + 1)}
        if "range" in w:
            s, Lw = a0, b0 - a0; e = figdiff(c.m(a0), c.m(b0), shiftB=tor[a0] - tor[b0])
        else:
            best = None
            for s in range(a0, a0 + 14):
                for Lw in range(w["minLen"], 64):
                    if s + Lw > b0: break
                    e = figdiff(c.m(s), c.m(s + Lw), shiftB=tor[s] - tor[s + Lw])
                    if best is None or e < best[0]: best = (e, s, Lw)
            e, s, Lw = best
        off = M_torso(c.m(0), stance_src) if w.get("root") != "feet-linear" else 0.0
        base = piv("walk") if w.get("root") != "feet-linear" else (0.0, piv("walk")[1])
        wsrc = list(range(s, s + Lw, w.get("step", 2)))
        if "search" in w:   # the torso's travel from the cycle's own start, on its feet there; each cell on its own lowest point (the planted foot:
            # Meghnad's clip drifts toward the camera, so frame 0's ground row is not the cycle's)
            base, off = (M_feet(c.m(s))[1], None), tor[s]
            anim["walk"] = {"loop": [cell("walk", i, (base[0] + tor[i] - off, float(M_lowest(c.m(i)))), "walk") for i in wsrc], "fps": w.get("playFps", FPS_OUT)}
        else:   # ground "lowest": each cell on its own planted foot (Meghnad's clip drifts toward the camera — its ground row is not frame 0's)
            gyw = (lambda i: float(M_lowest(c.m(i)))) if w.get("ground") == "lowest" else (lambda i: base[1])
            anim["walk"] = {"loop": [cell("walk", i, (base[0] + tor[i] - off, gyw(i)), "walk") for i in wsrc], "fps": w.get("playFps", FPS_OUT)}
        moves_meta["walk"] = {"loop": [s, s + Lw], "loopError": round(e, 2), "rootTravelSource": round(max(tor.values()) - min(tor.values()), 1), "root": w.get("root", "torso"), "step": w.get("step", 2)}
        print("  walk: cycle f%d–f%d (%d frames, |Δ| %.2f after the torso shift) → %d cells at 12 fps; the clip's own travel %.0f px removed" % (s, s + Lw, Lw, e, len(wsrc), moves_meta["walk"]["rootTravelSource"]))

    def centroid_x(M): ys, xs = np.where(M["a"] > 0.5); return float(xs.mean()) + M["ox"]
    def spiv(move, i):
        sp = cut[move]; c = clips[sp["clip"]]; p = piv(sp["clip"])
        if sp.get("root") == "centroid":   # the clip's travel removed: the body's centroid keeps the stance's offset from the feet
            M0 = c.m(0); p = (p[0] + centroid_x(c.m(i)) - centroid_x(M0), p[1])
        if sp.get("pivot") == "feet": return (p[0], float(M_lowest(c.m(i))))
        if "groundFrom" in sp and i >= sp["groundFrom"]: return (p[0], float(M_lowest(c.m(i))))   # on the ground line: lying, rolling, rising
        return grounded(sp["clip"], i, p)
    def span(move):
        sp = cut[move]; c = clips[sp["clip"]]; skip = sp.get("skip", [])
        if "frames" in sp: fr = [pick(c, t, 0 if sp.get("exact") else 1, skip) for t in sp["frames"]]
        else: fr = [pick(c, t, sp.get("look", 1), skip) for t in even(sp["span"][0], sp["span"][1], sp["n"])]
        fr = dedupe(c, fr)
        ids = [cell(sp["clip"], i, spiv(move, i), move) for i in fr]
        moves_meta[move] = {"src": fr}
        return ids
    def enter_hold(move):
        sp = cut[move]; c = clips[sp["clip"]]
        e = dedupe(c, [pick(c, t) for t in even(sp["enter"][0], sp["enter"][1], sp["nEnter"])])
        h = dedupe(c, list(range(sp["hold"][0], min(sp["hold"][1], sp["hold"][0] + HOLD_WINDOW) + 1, int(round(c.fps / HOLD_FPS)))))
        h = h + h[-2:0:-1]          # forward then back: a seamless loop without a jump
        moves_meta[move] = {"enter": e, "hold": h}
        M0 = c.m(0)
        def ep(i):
            p = piv(sp["clip"])
            if sp.get("root") == "centroid": p = (p[0] + centroid_x(c.m(i)) - centroid_x(M0), p[1])
            return grounded(sp["clip"], i, p)
        return {"enter": [cell(sp["clip"], i, ep(i), move) for i in e],
                "hold": [cell(sp["clip"], i, ep(i), move) for i in h], "fps": FPS_OUT, "holdFps": HOLD_FPS}

    for mv in ("jump", "hitLight", "hitHeavy", "knockdown", "getup", "parry"):
        if mv in cut: anim[mv] = {"span": span(mv)}
    for mv in ("crouch", "block", "win"):
        if mv in cut: anim[mv] = enter_hold(mv)
    if "ko" in cut:
        ko = span("ko"); c = clips["ko"]; lie = dedupe(c, list(range(cut["ko"]["lie"][0], cut["ko"]["lie"][1] + 1, 3)))
        last = lie[-1]
        anim["ko"] = {"span": ko, "frames": KO_SPAN, "hold": [cell("ko", last, spiv("ko", last), "ko")]}
        moves_meta["ko"]["lie"] = lie

    # THE ATTACKS — light (the clip test's reach-curve pick), heavy and special (the cut list), on the game's phases
    tips = {}
    def attack(move):
        sp = cut[move]; c = clips[sp["clip"]]
        if sp.get("auto"):
            fronts = [M_front(c.m(i)) for i in range(c.n)]
            ph, curve = pick_light(fronts, fronts[0])
            look = list(range(curve["contact"], min(curve["contact"] + CONTACT_LOOK, curve["holdEnd"]) + 1))
            best = max(look, key=lambda i: M_sharp(c.m(i))); curve["firstAtReach"] = curve["contact"]; curve["contact"] = int(best); ph["active"] = [int(best)]
            phases = {p: ph[p] for p in ("startup", "active", "recovery")}; meta = {"curve": curve}
        elif "frames" in sp:
            phases = {p: [pick(c, t, 0 if sp.get("exact") else 1, sp.get("skip", [])) for t in L] for p, L in sp["frames"].items()}; meta = {}
        else:
            phases = {p: [pick(c, t, 1, sp.get("skip", [])) for t in even(r[0], r[1], sp["n"][p])] for p, r in sp["phases"].items()}; meta = {}
        out = {}
        M0 = c.m(0)
        def ap(i):   # the attack's pivot: the clip's feet, or (root: centroid) the body's travel removed
            p = piv(sp["clip"])
            if sp.get("root") == "centroid": p = (p[0] + centroid_x(c.m(i)) - centroid_x(M0), p[1])
            return grounded(sp["clip"], i, p)
        if STRIKE24 and move in FRAMES and (move != "counter" or sp.get("strike24")):   # ruling 1: the strike frames at 24 fps (light, heavy, special) — real source frames, more of them around contact
            if sp.get("auto"):
                cu = meta["curve"]; ranges = {"startup": [cu["windup"], cu["contact"] - 1], "active": [cu["contact"], cu["contact"] + 3], "recovery": [cu["holdEnd"], cu["back"]]}
            else: ranges = sp["phases"]
            su, ac, rc = FRAMES[move]; plen = {"startup": su, "active": ac, "recovery": rc}
            win = {"startup": (max(0, su - STRIKE["before"]), su), "active": (0, ac), "recovery": (0, min(rc, STRIKE["after"]))}
            for p in ("startup", "active", "recovery"):
                Lp, (w0, w1) = plen[p], win[p]; pts = []; t = 0.0
                while t < Lp:
                    pts.append(t); t = t + 2.5 if w0 <= t < w1 else (t + 5 if t + 5 <= w0 or t >= w1 else w0)
                if len(pts) < len(phases[p]): pts = [Lp * k / len(phases[p]) for k in range(len(phases[p]))]
                a, b = ranges[p]
                fr = [pick(c, a + (b - a) * (t / Lp), 1, sp.get("skip", [])) for t in pts]
                keep = [k for k in range(len(fr)) if k == 0 or fr[k] != fr[k - 1]]   # the same real frame twice in a row is one cell
                # a cell starts on a WHOLE logic frame (the game steps in whole frames: a cell at 2.5 of a 3-frame phase would never show)
                keep = [k for k in keep if k == 0 or math.floor(pts[k]) != math.floor(pts[keep[keep.index(k) - 1]])]
                phases[p] = [fr[k] for k in keep]; out[p] = [[cell(sp["clip"], fr[k], ap(fr[k]), move), round(math.floor(pts[k]) / Lp, 4)] for k in keep]
        else:
            for p in ("startup", "active", "recovery"):
                fr = phases[p]; n = len(fr)
                out[p] = [[cell(sp["clip"], i, ap(i), move), round(k / n, 4)] for k, i in enumerate(fr)]
        tips[move] = round(max(M_front(c.m(i)) - ap(i)[0] for i in phases["active"]) * 220.0 / stance_src, 1)
        moves_meta[move] = dict(meta, phases=phases, tipFromPivotLogical=tips[move])
        print("  %s: startup %s · active %s · recovery %s · the weapon tip at contact %.1f logical px from the feet" % (move, phases["startup"], phases["active"], phases["recovery"], tips[move]))
        return {"phases": out}
    for mv in ("light", "heavy", "special", "counter", "throw"):
        if mv in cut: anim[mv] = attack(mv)
    if "throwGrab" in cut: anim["throwGrab"] = {"span": span("throwGrab")}
    if "throwHit" in cut:   # the knee's impact — the sharpest frame in its range — first, then the way back to stance
        sp = cut["throwHit"]; c = clips["throw"]
        imp = max(range(sp["impact"][0], sp["impact"][1] + 1), key=lambda i: M_sharp(c.m(i)))
        rest = dedupe(c, [pick(c, t) for t in even(sp["span"][0], sp["span"][1], sp["n"])])
        fr = [imp] + rest; moves_meta["throwHit"] = {"src": fr, "impact": int(imp)}
        anim["throwHit"] = {"span": [cell("throw", i, spiv("throwHit", i), "throwHit") for i in fr]}
    if "parry" in cut:
        c = clips["parry"]; tips["parry"] = round((max(M_front(c.m(i)) for i in moves_meta["parry"]["src"]) - piv("parry")[0]) * 220.0 / stance_src, 1)
    for mv in ("jump", "hitLight", "hitHeavy", "knockdown", "getup", "parry", "ko", "throwGrab", "throwHit"):
        if mv in moves_meta: print("  %s: frames %s%s" % (mv, moves_meta[mv]["src"], (" · lie (held) " + str(moves_meta[mv].get("lie"))) if mv == "ko" else ""))
    for mv in ("crouch", "block", "win"):
        if mv in moves_meta: print("  %s: enter %s · hold %s (%d distinct)" % (mv, moves_meta[mv]["enter"], moves_meta[mv]["hold"], len(set(moves_meta[mv]["hold"]))))

    # ── audits ──
    aligned = [{"move": cl["move"], "src": "%s f%d" % (cl["clip"], cl["i"]), "liftPx": round(M_lowest(clips[cl["clip"]].m(cl["i"])) - piv(cl["clip"])[1], 1)}
               for cl in cells if cl["pivot"][1] != piv(cl["clip"])[1] and cut.get(cl["move"], {}).get("pivot") != "feet"]
    olive_new = sum(olive(clips[cl["clip"]].m(cl["i"])["a"], clips[cl["clip"]].m(cl["i"])["fg"].astype(np.float32)) for cl in cells)
    sample = cells[:: max(1, len(cells) // 12)]
    olive_old = sum(olive(clips[cl["clip"]].m(cl["i"], "old")["a"], clips[cl["clip"]].m(cl["i"], "old")["fg"].astype(np.float32)) for cl in sample)
    olive_new_s = sum(olive(clips[cl["clip"]].m(cl["i"])["a"], clips[cl["clip"]].m(cl["i"])["fg"].astype(np.float32)) for cl in sample)
    strays = [{"src": "%s f%d" % (cl["clip"], cl["i"]), "move": cl["move"], "droppedPx": clips[cl["clip"]].m(cl["i"])["st"].get("strayPx", 0)} for cl in cells]
    strays = [x for x in strays if x["droppedPx"] >= FLECK]
    print("  strays dropped (a detached piece ≥ %d source px): %s" % (FLECK, [(x["src"], x["droppedPx"]) for x in strays]))
    audit = {"strayPiecesDropped": strays, "oliveEdgePixels": olive_new, "despillSample": {"cells": len(sample), "old": olive_old, "new": olive_new_s}, "groundAligned": aligned}
    if "win" in clips: audit["winTopRowMin"] = min(M_top(clips["win"].m(i)) for i in set(moves_meta["win"]["enter"] + moves_meta["win"]["hold"]))
    if "jump" in clips: audit["jumpTopRowMin"] = min(M_top(clips["jump"].m(i)) for i in moves_meta["jump"]["src"])
    if "special" in notes:
        semi = lambda M: int(((M["a"] > 0.05) & (M["a"] < 0.9)).sum())
        cutf = [i for i in set(sum(moves_meta["special"]["phases"].values(), [])) if 48 <= i <= 86]
        audit["specialHalo"] = {"refSemi": semi(clips["special"].m(notes["special"]["refFrame"])), "cutFramesSemi": {int(i): semi(clips["special"].m(i)) for i in sorted(cutf)},
                                "tipX": notes["special"]["tipX"], "pixelsCut": {int(i): int(clips["special"].m(i)["st"].get("tipCut", 0)) for i in sorted(cutf)}}
    if "crouch" in clips: audit["crouchShadowCut"] = {int(i): int(clips["crouch"].m(i)["st"].get("shadowCut", 0)) for i in sorted(set(moves_meta["crouch"]["hold"]))}
    print("  audit: olive edge pixels left %d · despill sample (%d cells) old %d → new %d · ground-aligned %d cells %s" % (olive_new, len(sample), olive_old, olive_new_s, len(aligned), [a["src"] + " +" + str(a["liftPx"]) for a in aligned]))
    for k in ("winTopRowMin", "jumpTopRowMin", "specialHalo", "crouchShadowCut"):
        if k in audit: print("    %s: %s" % (k, audit[k]))

    # ── the cells, both rungs: pages, WebP + KTX2 ──
    out = os.path.join(OPT_OUT, hero) if OPT_OUT else os.path.join(ARC, "fighters", hero); os.makedirs(out, exist_ok=True)
    for f in os.listdir(out):
        if f.endswith((".webp", ".ktx2")): os.remove(os.path.join(out, f))
    rungs, hi_cells = {}, None
    tmp = tempfile.mkdtemp(prefix="arcfighter")
    for rung in ("hi", "lo"):
        imgs, pvs = [], []
        for cl in cells:
            M = clips[cl["clip"]].m(cl["i"]); im, px, py = cut_cell(M["a"], M["fg"].astype(np.float32), scale[rung], (cl["pivot"][0] - M["ox"], cl["pivot"][1] - M["oy"]))
            imgs.append(im); pvs.append((px, py))
        sheets, rects = pack_pages(imgs, PAGE[rung])
        # the encoding: candidates measured on page 0 (premultiplied, as uploaded); the smallest at or above PSNR_MIN wins
        p0 = os.path.join(tmp, "p0.png"); pm0 = premult(sheets[0]); Image.fromarray(pm0, "RGBA").save(p0); mask = sheets[0][..., 3] > 0
        cand = []
        for name, args in ENC[rung]:
            k = os.path.join(tmp, name + ".ktx2"); run_basisu(p0, k, args)
            dec = ktx2_rgba(k, pm0.shape[1], pm0.shape[0])
            cand.append({"name": name, "args": args, "bytes": os.path.getsize(k), "psnr": psnr(dec, pm0, mask)})
        area0 = sheets[0].shape[0] * sheets[0].shape[1]; area = sum(sh.shape[0] * sh.shape[1] for sh in sheets)
        for c in cand: c["projectedBytes"] = int(c["bytes"] * area / area0)
        fit = [c for c in cand if c["projectedBytes"] <= DL_CAP[rung]]
        choice = max(fit, key=lambda c: c["psnr"]) if fit else min(cand, key=lambda c: c["projectedBytes"])
        if rung in ENC_LOCK: choice = next(c for c in cand if c["name"] == ENC_LOCK[rung]); choice = dict(choice, lockedBy=ENC_LOCK["by"])
        elif len(imgs) >= 100: ENC_LOCK[rung] = choice["name"]; ENC_LOCK["by"] = hero
        print("  %s encodings (page 0): %s → %s" % (rung, ", ".join("%s %d KB (all pages ≈%d KB) %.1f dB" % (c["name"], c["bytes"] // 1024, c["projectedBytes"] // 1024, c["psnr"]) for c in cand), choice["name"]))
        pages = []
        for n, sh in enumerate(sheets):
            wp = "%s_%d.webp" % (rung, n); kt = "%s_%d.ktx2" % (rung, n)
            Image.fromarray(sh, "RGBA").save(os.path.join(out, wp), "WEBP", quality=WEBP_Q[rung], method=6)
            png = os.path.join(tmp, "p.png"); Image.fromarray(premult(sh), "RGBA").save(png); run_basisu(png, os.path.join(out, kt), choice["args"])
            pages.append({"webp": wp, "ktx2": kt, "size": [int(sh.shape[1]), int(sh.shape[0])], "bytes": {"webp": os.path.getsize(os.path.join(out, wp)), "ktx2": os.path.getsize(os.path.join(out, kt))}})
        rungs[rung] = {"pages": pages, "encoding": {"chosen": choice["name"], "args": choice["args"], "candidates": cand, "downloadCap": DL_CAP[rung]},
                       "cells": [{"page": r[0], "x": int(r[1]), "y": int(r[2]), "w": int(r[3]), "h": int(r[4]), "px": pv[0], "py": pv[1]} for r, pv in zip(rects, pvs)]}
        if rung == "hi": hi_cells, hi_piv = imgs, pvs
        print("  %s: %d cells on %d page(s) %s · WebP %d KB · KTX2 %d KB · decoded RGBA %.1f MB → compressed 8 bpp %.1f MB" % (rung, len(imgs), len(pages), [p["size"] for p in pages],
              sum(p["bytes"]["webp"] for p in pages) // 1024, sum(p["bytes"]["ktx2"] for p in pages) // 1024, sum(p["size"][0] * p["size"][1] * 4 for p in pages) / 1048576, sum(p["size"][0] * p["size"][1] for p in pages) / 1048576))

    # mirror test
    feet_ok = []
    for c_, (px, py) in zip(hi_cells, hi_piv):
        f = c_[:, ::-1]; rows = np.where((f[..., 3] > 127).any(axis=1))[0]; feet_ok.append(abs(rows.max() - py) <= 3)
    wob = [round(M_feet(idle.m(i))[1] - fx, 1) for i in sorted(set(moves_meta["idle"]["src"]))]
    man = {"hero": hero, "name": H["name"], "class": "fighter", "version": 2, "facing": "right", "alpha": {"webp": "straight", "ktx2": "premultiplied"},
           "fpsOut": FPS_OUT, "idleFps": IDLE_FPS, "strike24": bool(STRIKE24), "despill": DESPILL,
           "stance": {"heightPx": {"hi": STANCE_HI, "lo": STANCE_LO}, "sourceHeight": int(stance_src), "pivotSource": [round(float(fx), 1), int(gy)], "headTopSource": int(top)},
           "sources": {n: {"file": c.fn, "sha256": c.sha, "frames": c.n, "fps": c.fps, "registration": reg[n]} for n, c in clips.items()},
           "still": H["still"], "weapon": H["weapon"], "moves": moves_meta, "tipsLogical": tips, "audit": audit,
           "idleWobbleSource": wob, "rungs": rungs, "anim": anim,
           "cellsSrc": ["%s f%d" % (cl["clip"], cl["i"]) for cl in cells], "cellsMove": [cl["move"] for cl in cells],
           "mirrorTest": {"feetOnGround": int(sum(feet_ok)), "of": len(feet_ok)}}
    with open(os.path.join(out, "manifest.json"), "w") as f: json.dump(man, f, indent=1)
    print("  cells per move: %s · total %d" % ({m: len(set(k for k, cl in enumerate(cells) if cl["move"] == m)) for m in dict.fromkeys(cl["move"] for cl in cells)}, len(cells)))
    print("  mirror: feet within 3 px of the ground row on %d of %d flipped cells" % (sum(feet_ok), len(feet_ok)))

    # ── the owner's screens: one contact sheet per move, and the despill before/after ──
    if OPT_OUT: return man
    os.makedirs(SCREENS, exist_ok=True)
    for mv in dict.fromkeys(cl["move"] for cl in cells):
        ks = [k for k, cl in enumerate(cells) if cl["move"] == mv]
        labs = ["%s f%03d" % (cells[k]["clip"], cells[k]["i"]) for k in ks]
        contact_sheet(os.path.join(SCREENS, "%s_%s_contact.jpg" % (hero, mv)), [hi_cells[k] for k in ks], labs,
                      "%s · %s · %d cells · feet on one line (gold), pivot (red)" % (H["name"], mv.upper(), len(ks)), [hi_piv[k] for k in ks])
    despill_sheet(hero, H, clips, cells, tips)
    return man

def despill_sheet(hero, H, clips, cells, tips):
    # BEFORE / AFTER (ruling 7): the same edges with the clip test's despill and with the new default, ×3 at source size, dark and light grounds
    picks = []
    for mv in ("light", "special", "idle", "heavy"):
        ks = [cl for cl in cells if cl["move"] == mv]
        if ks: picks.append(ks[len(ks) // 2 if mv != "light" else min(len(ks) - 1, 2)])
    crops = []
    for cl in picks:
        c = clips[cl["clip"]]
        for mode in ("old", "strong"):
            M = c.m(cl["i"], mode); a = M["a"]; ys, xs = np.where(a > 0.5)
            fr = int(xs.max()); y = int(ys[xs.argmax()])
            rgba = np.dstack([M["fg"], a * 255]).astype(np.uint8)
            cr = rgba[max(0, y - 50): y + 50, max(0, fr - 120): fr + 10]
            crops.append(("%s f%d %s · olive %d" % (cl["clip"], cl["i"], "BEFORE" if mode == "old" else "AFTER", olive(a, M["fg"].astype(np.float32))), cr))
    crops_sheet(os.path.join(SCREENS, "%s_despill_before_after.jpg" % hero), "%s · edge despill BEFORE (clip test) / AFTER (the new default): the weapon's front edge ×3 · olive = tinted edge pixels in the whole cell" % H["name"], crops)

def sheets_only(hero):
    # the contact sheets again from the BUILT hi pages (no matting): python make_fighter.py --sheets indra
    out = os.path.join(ARC, "fighters", hero); man = json.load(open(os.path.join(out, "manifest.json"))); R = man["rungs"]["hi"]
    pages = [np.asarray(Image.open(os.path.join(out, p["webp"])).convert("RGBA")) for p in R["pages"]]
    cells = [pages[c["page"]][c["y"]:c["y"] + c["h"], c["x"]:c["x"] + c["w"]] for c in R["cells"]]; piv = [(c["px"], c["py"]) for c in R["cells"]]
    for mv in dict.fromkeys(man["cellsMove"]):
        ks = [k for k, m in enumerate(man["cellsMove"]) if m == mv]
        contact_sheet(os.path.join(SCREENS, "%s_%s_contact.jpg" % (hero, mv)), [cells[k] for k in ks], [man["cellsSrc"][k] for k in ks],
                      "%s · %s · %d cells · feet on one line (gold), pivot (red)" % (man["name"], mv.upper(), len(ks)), [piv[k] for k in ks])
    print("sheets: %s (%d moves)" % (hero, len(dict.fromkeys(man["cellsMove"]))))

if __name__ == "__main__":
    if sys.argv[1:2] == ["--sheets"]:
        for h in sys.argv[2:] or list(HEROES): sheets_only(h)
        sys.exit(0)
    want = sys.argv[1:] or list(HEROES)
    for h in want: build(h)
    print("screens → %s" % SCREENS)
