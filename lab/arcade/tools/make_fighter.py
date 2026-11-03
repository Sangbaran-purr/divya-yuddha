#!/usr/bin/env python3
"""ARCADE-1 · THE FIGHTER TOOL (clip test: idle + light).   Run with the matting venv (the VFX lab's; rembg + OpenCV live there):
      lab/vfx-manifestation/tools/.venv/bin/python -I lab/arcade/tools/make_fighter.py [indra meghnad]

Kling clips on chroma green (lab/arcade/sources/<hero>/<hero>_NN_<move>.mp4, gitignored) → one fighter per Hero:
  lab/arcade/fighters/<hero>/hi.webp, lo.webp, manifest.json   (committed: packed sheets only — the clip law)
and, for the owner, contact sheets in ~/Desktop/DY_arcade_screens/ (never committed).

THE STEPS
  1 MATTE      green first: alpha from G − max(R, B) with a soft ramp, edge colours un-mixed from the ground, then despilled so no
               pixel is greener than its strongest other channel (the VFX lab's key, single-channel). The figure is the largest
               opaque part plus anything touching it (the spear and the Vajra are held); flecks off the figure are cut.
               rembg is called only where an edge band still holds ground-coloured pixels kept mostly opaque (over FRINGE_LIMIT).
  2 PIVOT      the feet: the ground row (the lowest opaque row) and the feet's centre (the mean x of the opaque pixels in the
               bottom FEET_ROWS rows), measured on the stance frame (idle f0). One pivot per Hero for every move; the wobble of
               each kept frame's own feet against it is reported.
  3 ONE SCALE  both Heroes to one stance height: the head's top (the top opaque row in a band around the feet's x, so the
               spear tip held out front is not the head) to the ground row → STANCE_HI px on the hi sheet, STANCE_LO on the lo.
  4 FRAMES     idle: the tightest loop (the smallest L whose frame L matches frame 0 under LOOP_MAE), sampled at 12 fps.
               light: the game's own timing, 5 / 3 / 9 logic frames → LIGHT_CELLS = 2 startup + 1 active + 3 recovery cells,
               chosen on the clip's motion: the reach (the figure's front edge) climbs to its maximum (contact = the first frame
               at ≥ 98% of it) and later falls back to the stance.
  5 PACK       trimmed cells, one shelf-packed WebP sheet per rung (hi ≤ 4096 px wide, lo ≤ 2048), straight alpha; the manifest
               carries each cell's rect and pivot.
  6 MIRROR     the cells are authored facing right; the mirror test flips every cell about its pivot and checks the pivot lands
               where the game will put it (cell width − pivot x).
"""
import os, sys, json, hashlib, math
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont

ARC = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO = os.path.dirname(os.path.dirname(ARC))
os.environ.setdefault("U2NET_HOME", os.path.join(REPO, "lab", "vfx-manifestation", "tools", ".venv", "u2net"))
SCREENS = os.path.expanduser("~/Desktop/DY_arcade_screens")

EDGE_TINT = float(os.environ.get("ARC_EDGE_TINT", "6"))                     # the edge despill's allowance (0–255) for green over the mean of red and blue
EDGE_RIM = 2                         # px (source): the opaque rim the edge despill also covers
CONTACT_LOOK = 6                     # frames into the hold searched for the sharpest contact cell
KEY_T0, KEY_T1 = 28.0, 85.0          # green dominance: ≤ T0 fully figure, ≥ T1 fully ground (the VFX lab's values)
FLECK = 400                          # px (source): an opaque island smaller than this, not touching the figure, is cut
FRINGE_LIMIT = 0.002                 # share of edge-band pixels near-pure ground yet mostly opaque → rembg trims that band
FEET_ROWS = 14                       # px (source): the feet are the opaque pixels in this many rows above the ground row
HEAD_BAND = 140                      # px (source): the head's top is looked for within ±this of the feet's x
STANCE_HI, STANCE_LO = 320, 192      # px: the stance height on each sheet (budget: cells 320 tall high, 192 low)
SHEET_W = {"hi": 4096, "lo": 2048}
LOOP_MIN = 16                        # frames: no idle loop shorter than this
FPS_OUT = 12
LIGHT_CELLS = {"startup": 2, "active": 1, "recovery": 3}
QUALITY = {"hi": 82, "lo": 80}

HEROES = {
    "indra":   {"name": "Indra", "clips": {"idle": "indra_01_idle.mp4", "light": "indra_06_light.mp4"},
                "still": "indra-fighter-right-green-1920x1080-v2.png", "weapon": "Vajra"},
    "meghnad": {"name": "Meghnad", "clips": {"idle": "meghnad_01_idle.mp4", "light": "meghnad_06_light.mp4"},
                "still": "meghnad-fighter-right-green-1920x1080-v2.png", "weapon": "spear"},
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

def key(rgb, K):
    kc = int(np.argmax(K)); o1, o2 = [c for c in (0, 1, 2) if c != kc]
    a = rgb.astype(np.float32)
    dom = a[..., kc] - np.maximum(a[..., o1], a[..., o2])
    alpha = 1.0 - np.clip((dom - KEY_T0) / (KEY_T1 - KEY_T0), 0, 1)
    am = np.maximum(alpha, 0.05)[..., None]
    fg = np.clip((a - (1.0 - alpha)[..., None] * K) / am, 0, 255)
    fg[..., kc] = np.minimum(fg[..., kc], np.maximum(fg[..., o1], fg[..., o2]))
    # EDGE DESPILL (clip test): on skin and gold the rule above stops green exceeding red but leaves the spill as a yellow-green
    # (olive) tint on motion-smeared and soft edges and on the outermost opaque rim. On those pixels only — semi-transparent,
    # or within EDGE_RIM px of the boundary — the key channel may not exceed the mean of the other two by more than EDGE_TINT.
    # The body's own opaque gold, inside the rim, is untouched.
    soft = edge_zone(alpha)
    cap = (fg[..., o1] + fg[..., o2]) / 2 + EDGE_TINT
    fg[..., kc] = np.where(soft, np.minimum(fg[..., kc], cap), fg[..., kc])
    return alpha, fg

def edge_zone(alpha):
    inner = cv2.erode((alpha > 0.98).astype(np.uint8), np.ones((2 * EDGE_RIM + 1, 2 * EDGE_RIM + 1), np.uint8)).astype(bool)
    return (alpha > 0.0) & ~inner

def tinted(alpha, fg):
    # the audit: edge pixels (soft, or on the rim) still tinted toward the key (green over the mean of red and blue by more than 20)
    soft = (alpha > 0.05) & edge_zone(alpha)
    return int((soft & (fg[..., 1] > (fg[..., 0] + fg[..., 2]) / 2 + 20)).sum())

def sharpness(rgb, alpha):
    g = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY).astype(np.float32)
    lap = cv2.Laplacian(g, cv2.CV_32F)
    m = cv2.erode((alpha > 0.5).astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool)
    return float(lap[m].var()) if m.any() else 0.0

def isolate(alpha):
    mask = (alpha > 0.35).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(mask, 8)
    if n <= 1: return alpha, 0
    main = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
    near = cv2.dilate((lab == main).astype(np.uint8), np.ones((9, 9), np.uint8)).astype(bool)
    keep = np.zeros_like(mask, bool); dropped = 0
    for i in range(1, n):
        comp = lab == i
        if i == main or (st[i, cv2.CC_STAT_AREA] >= FLECK and near[comp].any()) or (near[comp].any() and st[i, cv2.CC_STAT_AREA] >= 20): keep |= comp
        else: dropped += 1
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

def matte(rgb, K):
    alpha, fg = key(rgb, K)
    alpha, dropped = isolate(alpha)
    share = fringe_share(rgb, alpha, K); used = False
    if share > FRINGE_LIMIT:
        band = edge_band(alpha); m = rembg_mask(rgb)
        alpha = np.where(band, np.minimum(alpha, m), alpha); used = True
    return alpha, fg, {"fringe": round(share, 5), "fringeAfter": round(fringe_share(rgb, alpha, K), 5), "rembg": used, "flecksCut": dropped}

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
    th = max(c.shape[0] for c in cells) + 8; tw = max(c.shape[1] for c in cells) + 8; cols = min(8, len(cells)); rows = math.ceil(len(cells) / cols)
    W, H = cols * tw, rows * (th + 22) + 34
    out = Image.new("RGB", (W, H), (18, 14, 10)); d = ImageDraw.Draw(out); f = font(14)
    d.text((8, 8), title, fill=(232, 200, 116), font=font(16))
    for k, (c, lab, (px, py)) in enumerate(zip(cells, labels, pivots)):
        x, y = (k % cols) * tw + 4, (k // cols) * (th + 22) + 34
        if flip: c = c[:, ::-1]; px = c.shape[1] - px
        base = Image.fromarray(checker(tw - 8, th - 8) if bg == "checker" else np.full((th - 8, tw - 8, 3), bg, np.uint8))
        ox, oy = int((tw - 8) / 2 - px), int(th - 8 - py - 2)      # every cell placed by its pivot: the feet on one line
        base.paste(Image.fromarray(c), (ox, oy), Image.fromarray(c[..., 3]))
        out.paste(base, (x, y + 18))
        dd = ImageDraw.Draw(out)
        dd.line([(x, y + 18 + th - 10), (x + tw - 8, y + 18 + th - 10)], fill=(232, 200, 116), width=1)          # the ground line
        dd.line([(x + (tw - 8) / 2, y + 18 + th - 18), (x + (tw - 8) / 2, y + 18 + th - 2)], fill=(255, 80, 60), width=1)   # the pivot
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

def build(hero):
    H = HEROES[hero]; src = os.path.join(ARC, "sources", hero)
    print("── %s ──" % H["name"])
    clips = {}
    for move, fn in H["clips"].items():
        fr, fps = decode(os.path.join(src, fn)); K = ground_colour(fr[0])
        clips[move] = {"frames": fr, "fps": fps, "K": K, "file": fn, "sha256": sha(os.path.join(src, fn))}
        print("  %s: %d frames @ %g fps, %dx%d, ground %s" % (fn, len(fr), fps, fr[0].shape[1], fr[0].shape[0], K.astype(int).tolist()))

    # the frames this Hero needs
    idle = clips["idle"]
    allidle = [matte(f, idle["K"]) for f in idle["frames"]]
    L, errs = tightest_loop(allidle)
    idle_src = list(range(0, L, int(round(idle["fps"] / FPS_OUT))))
    print("  idle: tightest loop %d frames (%.2f s): frame %d matches frame 0 at mean |Δ| %.2f on the figure (peak %.1f) → %d cells at 12 fps" % (L, L / idle["fps"], L, errs[L], max(errs), len(idle_src)))
    light = clips["light"]
    lm = {}
    fronts = []
    for i, rgb in enumerate(light["frames"]):
        a, fg, st = matte(rgb, light["K"]); lm[i] = (a, fg, st); fronts.append(front_x(a))
    phases, curve = pick_light(fronts, fronts[0])
    # the contact cell: the SHARPEST frame early in the hold — Kling's fast jab smears its first frames (the weapon can vanish)
    look = list(range(curve["contact"], min(curve["contact"] + CONTACT_LOOK, curve["holdEnd"]) + 1))
    sharp = {i: sharpness(light["frames"][i], lm[i][0]) for i in look}
    best = max(look, key=lambda i: sharp[i])
    curve["firstAtReach"], curve["sharpness"] = curve["contact"], {int(i): round(v, 1) for i, v in sharp.items()}
    curve["contact"] = int(best); phases["active"] = [int(best)]
    print("  light: wind-up f%d, 40%% f%d, contact f%d (sharpest of the hold's first frames %s)"
          % (curve["windup"], curve["mid"], curve["contact"], curve["sharpness"]))
    print("         reach +%d px source; one-frame spikes skipped: %s; holds to f%d, back by f%d → startup %s · active %s · recovery %s"
          % (curve["reachPx"], curve["spikeFrames"], curve["holdEnd"], curve["back"], phases["startup"], phases["active"], phases["recovery"]))

    # matte the idle frames; pivot + scale from the stance frame (idle f0)
    im = {}
    for i in idle_src: im[i] = allidle[i]
    a0 = im[0][0]; gy, fx = feet(a0); top = head_top(a0, fx); stance_src = gy - top
    scale = {"hi": STANCE_HI / stance_src, "lo": STANCE_LO / stance_src}
    l0 = lm[0][0]; lgy, lfx = feet(l0)
    print("  stance (idle f0): ground row %d, feet x %.1f, head top %d → stance height %d px source; light f0 feet (%d, %.1f) — registration %+.1f, %+d px"
          % (gy, fx, top, stance_src, lgy, lfx, lfx - fx, lgy - gy))

    # wobble: each kept frame's own feet against the Hero's pivot (source px)
    def wob(a): g, x = feet(a); return round(float(x - fx), 1), int(g - gy)
    wobble = {"idle": [wob(im[i][0]) for i in idle_src], "light": [wob(lm[i][0]) for p in ("startup", "active", "recovery") for i in phases[p]]}
    for m, w in wobble.items():
        print("  pivot wobble, %s: x %+.1f…%+.1f, y %+d…%+d px source  (×%.3f on the hi sheet)" % (m, min(v[0] for v in w), max(v[0] for v in w), min(v[1] for v in w), max(v[1] for v in w), scale["hi"]))

    # fringe audit on the weapon tip and the head (the plume / crown), over every kept frame
    def region(a, kind):
        reg = np.zeros_like(a, bool); ys, xs = np.where(a > 0.5)
        if kind == "weapon": reg[:, max(0, xs.max() - 60):] = True
        else: reg[: ys.min() + 90, :] = True
        return reg
    audit = {}
    kept = [("idle", i, im[i]) for i in idle_src] + [("light", i, lm[i]) for p in ("startup", "active", "recovery") for i in phases[p]]
    for kind in ("weapon", "head"):
        shares = [fringe_share((clips[m]["frames"][i]), mt[0], clips[m]["K"], region(mt[0], kind)) for m, i, mt in kept]
        audit[kind] = {"maxShare": round(max(shares), 5)}
    rembg_frames = [("%s f%d" % (m, i)) for m, i, mt in kept if mt[2]["rembg"]]
    green_left = sum(tinted(mt[0], mt[1]) for m, i, mt in kept)
    print("  fringe: weapon-tip band max %.3f%%, head band max %.3f%% (limit %.3f%%); rembg on %s; green-tinted soft edge pixels left: %d"
          % (audit["weapon"]["maxShare"] * 100, audit["head"]["maxShare"] * 100, FRINGE_LIMIT * 100, rembg_frames or "no frame", green_left))

    # cells, both rungs
    order = [("idle", i, im[i]) for i in idle_src] + [("light", i, lm[i]) for p in ("startup", "active", "recovery") for i in phases[p]]
    out = os.path.join(ARC, "fighters", hero); os.makedirs(out, exist_ok=True)
    man = {"hero": hero, "name": H["name"], "class": "fighter", "version": 1, "facing": "right", "alpha": "straight", "fpsOut": FPS_OUT,
           "stance": {"heightPx": {"hi": STANCE_HI, "lo": STANCE_LO}, "sourceHeight": int(stance_src), "pivotSource": [round(float(fx), 1), int(gy)], "headTopSource": int(top)},
           "sources": {m: {"file": c["file"], "sha256": c["sha256"], "frames": len(c["frames"]), "fps": c["fps"]} for m, c in clips.items()},
           "still": H["still"], "weapon": H["weapon"],
           "moves": {"idle": {"loop": True, "loopFrames": int(L), "loopError": round(errs[L], 2), "src": idle_src},
                     "light": {"phases": {p: phases[p] for p in ("startup", "active", "recovery")}, "curve": curve,
                               "reachLogical": round(curve["reachPx"] * 220.0 / stance_src, 1),
                               "tipFromPivotLogical": round((curve["plateauX"] - fx) * 220.0 / stance_src, 1)}},
           "wobbleSource": wobble, "fringe": audit, "tintedEdgePixels": green_left, "rembgFrames": rembg_frames, "rungs": {}}
    sizes = {}
    for rung in ("hi", "lo"):
        cells, piv = [], []
        for m, i, (a, fg, st) in order:
            c, px, py = cut_cell(a, fg, scale[rung], (fx, gy)); cells.append(c); piv.append((px, py))
        sheet, rects = pack(cells, SHEET_W[rung])
        p = os.path.join(out, rung + ".webp")
        Image.fromarray(sheet, "RGBA").save(p, "WEBP", quality=QUALITY[rung], method=6)
        sizes[rung] = os.path.getsize(p)
        man["rungs"][rung] = {"sheet": rung + ".webp", "size": [int(sheet.shape[1]), int(sheet.shape[0])], "bytes": sizes[rung],
                              "cells": [{"move": m, "src": int(i), "x": int(r[0]), "y": int(r[1]), "w": int(r[2]), "h": int(r[3]), "px": pv[0], "py": pv[1]} for (m, i, _), r, pv in zip(order, rects, piv)]}
        if rung == "hi": hi_cells, hi_piv = cells, piv
    # the move → cell index lists the game reads
    idx = {"idle": [k for k, (m, _, _) in enumerate(order) if m == "idle"]}
    n_idle = len(idx["idle"]); k = n_idle
    for p in ("startup", "active", "recovery"):
        idx[p] = list(range(k, k + len(phases[p]))); k += len(phases[p])
    man["cellIndex"] = {"idle": idx["idle"], "light": {"startup": idx["startup"], "active": idx["active"], "recovery": idx["recovery"]}}
    # the mirror test: flipping a cell about its pivot puts the pivot at (w − px); the feet stay on the ground row
    mir = all(abs((c.shape[1] - px) - (c[:, ::-1].shape[1] - px)) < 1e-6 for c, (px, py) in zip(hi_cells, hi_piv))
    feet_ok = []
    for c, (px, py) in zip(hi_cells, hi_piv):
        f = c[:, ::-1]; a = f[..., 3] > 127; rows = np.where(a.any(axis=1))[0]
        feet_ok.append(abs(rows.max() - py) <= 3)
    man["mirrorTest"] = {"pivotFlip": bool(mir), "feetOnGround": int(sum(feet_ok)), "of": len(feet_ok)}
    with open(os.path.join(out, "manifest.json"), "w") as f: json.dump(man, f, indent=1)
    print("  sheets: hi %s %d KB, lo %s %d KB · %d cells (idle %d, light %d)" % (man["rungs"]["hi"]["size"], sizes["hi"] // 1024, man["rungs"]["lo"]["size"], sizes["lo"] // 1024, len(order), n_idle, len(order) - n_idle))
    print("  mirror: pivot flips to w − px on every cell; feet within 3 px of the ground row on %d of %d flipped cells" % (sum(feet_ok), len(feet_ok)))

    # the owner's screens
    os.makedirs(SCREENS, exist_ok=True)
    labs = ["idle f%03d" % i for i in idle_src]
    contact_sheet(os.path.join(SCREENS, "%s_idle_contact.jpg" % hero), hi_cells[:n_idle], labs, "%s · IDLE · tightest loop %d frames, %d cells at 12 fps · feet on one line (gold), pivot (red)" % (H["name"], L, n_idle), hi_piv[:n_idle])
    llabs = ["%s f%03d" % (p, i) for p in ("startup", "active", "recovery") for i in phases[p]]
    contact_sheet(os.path.join(SCREENS, "%s_light_contact.jpg" % hero), hi_cells[n_idle:], llabs, "%s · LIGHT · 2 startup + 1 active (contact) + 3 recovery cells, for 5/3/9 logic frames" % H["name"], hi_piv[n_idle:])
    contact_sheet(os.path.join(SCREENS, "%s_mirror_test.jpg" % hero), [hi_cells[0], hi_cells[n_idle + 2]], ["idle f000 mirrored", "light contact mirrored"], "%s · MIRROR TEST — facing left, flipped about the pivot" % H["name"], [hi_piv[0], hi_piv[n_idle + 2]], flip=True)
    # fringe crops at source resolution: the weapon tip at contact, and the head
    a, fg, _ = lm[phases["active"][0]]; ys, xs = np.where(a > 0.5)
    rgba = np.dstack([fg, a * 255]).astype(np.uint8)
    tip = rgba[max(0, ys[xs.argmax()] - 60): ys[xs.argmax()] + 60, xs.max() - 140: xs.max() + 20]
    a0f, fg0, _ = im[0]; ys0, xs0 = np.where(a0f > 0.5); top_y = ys0.min()
    rgba0 = np.dstack([fg0, a0f * 255]).astype(np.uint8)
    hx = int(xs0[ys0.argmin()]); head = rgba0[top_y: top_y + 140, max(0, hx - 90): hx + 90]
    crops_sheet(os.path.join(SCREENS, "%s_fringe_crops.jpg" % hero), "%s · matte edges ×3 at source size: the %s tip at contact, and the head (left dark, right light ground)" % (H["name"], H["weapon"]), [(H["weapon"] + " tip", tip), ("head", head)])
    return man

if __name__ == "__main__":
    want = sys.argv[1:] or list(HEROES)
    for h in want: build(h)
    print("screens → %s" % SCREENS)
