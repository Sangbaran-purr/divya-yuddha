#!/usr/bin/env python3
# tools/make_actor_from_clip.py — VFX-LAB-4. A Kling performance on a flat chroma-green ground → an ACTOR (ruling A4):
# matted with real alpha, trimmed rectangular cells at 512 px with one ground pivot, WebP with alpha, NO motion vectors.
#
#   lab/vfx-manifestation/tools/.venv/bin/python lab/vfx-manifestation/tools/make_actor_from_clip.py
#
# Run it with the lab venv: rembg (A6, amended) lives there and nowhere else. Its model lives in tools/.venv/u2net/.
#   IN (never committed, A7):   sources/kling_20260913_VIDEO_Create_a_p_5011_0.mp4
#   AUDIT (never committed):    frames/meghnad/f###.png (the kept frames, matted) · frames/meghnad_contact_sheet.jpg
#   OUT (committed):            actors/meghnad/atlas.webp + atlas_256.webp (LAB-5: the quality rung) + manifest.json
#
# THE MATTE — green FIRST, rembg only where the key leaves fringe:
#   1 key       alpha from green dominance (G − max(R, B)) with a soft ramp, calibrated on the clip's own ground colour
#   2 decontam  edge colours un-mixed from the ground (C = aF + (1−a)K ⇒ F), then despilled (G ≤ max(R, B)) — the cape
#               edges and the mane lose their green
#   3 isolate   the largest solid body and the solid parts near it are the figure; translucent light further than
#               GLOW_R px from that body (Kling's crossing lightning bolt) is cut, so nothing floats off the figure
#   4 cleanup   if an edge band still holds ground-coloured pixels above FRINGE_LIMIT, rembg's mask trims that band only
# THE FRAMES — per the audit: idle 0–33 dropped; EMERGE = the rear (34–56); ACT = flare → thrust → settle (57–88), contact
#   = the frame the spear is fully extended (the leftmost spear tip in 66–82); Kling's own dissolve (89 on — pink energy
#   from f90, smoke from f96) dropped: the stage does the fizzle. LAB-4d: EVERY usable frame in the window is kept — only a
#   true duplicate (its picture repeats the last kept frame, mean |Δ| < DUP_MAE) is dropped — so the motion stays smooth at
#   the owner's slower tempo. The phases keep the lengths the owner tuned against (PHASE_MS at tempo 1: EMERGE 583 ms, ACT
#   1208 ms — LAB-4's 14 + 29 cells at 24 fps), so more cells play in the same time; TEMPO is the card's default (ruling
#   2026-09-13: 0.6×), written into the manifest.
# THE CELLS — one scale for every frame (the largest trimmed frame fits 512 px); one pivot for every frame: the ground
#   contact under the front hooves, measured on a settled frame (the camera is locked, so that world point is fixed).
import hashlib, json, math, os, sys
import numpy as np
import cv2
from PIL import Image, ImageDraw

LAB = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CARD = "meghnad"
CLIP = os.path.join(LAB, "sources", "kling_20260913_VIDEO_Create_a_p_5011_0.mp4")
OUT = os.path.join(LAB, "actors", CARD)
AUDIT = os.path.join(LAB, "frames", CARD)
SHEET = os.path.join(LAB, "frames", CARD + "_contact_sheet.jpg")
os.environ.setdefault("U2NET_HOME", os.path.join(LAB, "tools", ".venv", "u2net"))

EMERGE_RANGE, ACT_RANGE = (34, 56), (57, 88)
DUP_MAE = 0.6                        # mean |Δ| (0–255, 240×135 grey) under which a frame repeats its predecessor: a true duplicate
PHASE_MS = {"emerge": 583, "act": 1208}   # the phase lengths at tempo 1 the owner tuned against (LAB-4: 14 + 29 cells at 24 fps)
TEMPO = 0.6                          # the card's default tempo (owner ruling 2026-09-13) — 0.6 × those lengths' pace
CONTACT_SEARCH = (66, 82)
SETTLED_FRAME = 84
CELL_MAX, FPS, PAD = 512, 24, 2
KEY_T0, KEY_T1 = 28.0, 85.0          # green dominance: ≤ T0 fully figure, ≥ T1 fully ground
SOLID = 0.92
DARK_LUM = 150.0                     # the body is darker than this; the lightning is brighter
GLOW_R = 28                          # px (source) — translucent light allowed this close to the solid body
FRINGE_LIMIT = 0.002                 # share of edge-band pixels that are near-pure ground yet kept mostly opaque → rembg is called in

def decode(path):
    cap = cv2.VideoCapture(path); frames = []
    while True:
        ok, f = cap.read()
        if not ok: break
        frames.append(cv2.cvtColor(f, cv2.COLOR_BGR2RGB))
    return frames, cap.get(cv2.CAP_PROP_FPS)

def ground_colour(rgb):
    c = np.concatenate([rgb[:40, :40].reshape(-1, 3), rgb[:40, -40:].reshape(-1, 3), rgb[-40:, :40].reshape(-1, 3), rgb[-40:, -40:].reshape(-1, 3)])
    return np.median(c, axis=0).astype(np.float32)

def key(rgb, K):
    a = rgb.astype(np.float32); r, g, b = a[..., 0], a[..., 1], a[..., 2]
    gdom = g - np.maximum(r, b)
    alpha = 1.0 - np.clip((gdom - KEY_T0) / (KEY_T1 - KEY_T0), 0, 1)
    am = np.maximum(alpha, 0.05)[..., None]
    fg = np.clip((a - (1.0 - alpha)[..., None] * K) / am, 0, 255)          # un-mix the ground from edge colours
    fg[..., 1] = np.minimum(fg[..., 1], np.maximum(fg[..., 0], fg[..., 2]))  # despill: never greener than its strongest other channel
    return alpha, fg

def isolate(alpha, rgb):
    # the body is the DARK solid matter (rider, horse, cape, the spear shaft): Kling's lightning is bright, so it can never
    # anchor the figure. Everything — even opaque light — further than GLOW_R px from that body is cut; the glow at the
    # spear tip, within reach of the shaft, stays.
    lum = rgb.astype(np.float32) @ np.array([0.299, 0.587, 0.114], np.float32)
    solid = ((alpha > SOLID) & (lum < DARK_LUM)).astype(np.uint8)
    n, lab, stats, _ = cv2.connectedComponentsWithStats(solid, 8)
    if n <= 1: return alpha, 0
    main = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    near = cv2.dilate((lab == main).astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (33, 33)))
    core = np.zeros_like(solid)
    dropped = 0
    for i in range(1, n):
        comp = lab == i
        if i == main or near[comp].any(): core[comp] = 1
        else: dropped += 1
    dist = cv2.distanceTransform((1 - core).astype(np.uint8), cv2.DIST_L2, 5)
    out = alpha.copy()
    out[(dist > GLOW_R)] = 0.0                                               # nothing floats off the figure
    return out, dropped

def edge_band(alpha, w=4):
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * w + 1, 2 * w + 1))
    return (cv2.dilate((alpha > 0.02).astype(np.uint8), k) & (1 - cv2.erode((alpha > 0.98).astype(np.uint8), k))).astype(bool)

def fringe_share(rgb, alpha, K):
    band = edge_band(alpha)
    if not band.any(): return 0.0, band
    near_ground = np.linalg.norm(rgb.astype(np.float32) - K, axis=2) < 45
    return float(((alpha > 0.5) & near_ground & band).sum()) / float(band.sum()), band

def distinct(indices, grays, keep=()):
    # every usable frame, in order; a frame whose picture repeats the last kept one is a true duplicate and dropped (never a forced one)
    out, dropped = [], []
    for i in indices:
        if out and i not in keep and float(np.abs(grays[i].astype(np.float32) - grays[out[-1]].astype(np.float32)).mean()) < DUP_MAE:
            dropped.append(i); continue
        out.append(i)
    return out, dropped

def main():
    if not os.path.exists(CLIP): sys.exit("the source clip is not at " + CLIP)
    frames, fps = decode(CLIP)
    H, W = frames[0].shape[:2]
    K = ground_colour(frames[0])
    sha = hashlib.sha256(open(CLIP, "rb").read()).hexdigest()
    print("clip %d frames @ %.0f fps · %dx%d · ground RGB %s" % (len(frames), fps, W, H, K.astype(int).tolist()))
    grays = {i: cv2.resize(cv2.cvtColor(f, cv2.COLOR_RGB2GRAY), (240, 135)) for i, f in enumerate(frames)}

    mattes = {}
    def matte(i):
        if i not in mattes:
            al, fg = key(frames[i], K); al, dropped = isolate(al, frames[i]); mattes[i] = (al, fg, dropped)
        return mattes[i]
    # contact: the leftmost solid spear tip in the search window (earliest within 4 px of the extreme)
    tips = {}
    for i in range(CONTACT_SEARCH[0], CONTACT_SEARCH[1] + 1):
        al, _, _ = matte(i)
        lum = frames[i].astype(np.float32) @ np.array([0.299, 0.587, 0.114], np.float32)
        xs = np.where(((al > SOLID) & (lum < DARK_LUM)).any(axis=0))[0]; tips[i] = int(xs.min()) if len(xs) else W
    lo = min(tips.values()); contact_src = min(i for i, x in tips.items() if x <= lo + 4)
    emerge, dup_e = distinct(range(EMERGE_RANGE[0], EMERGE_RANGE[1] + 1), grays)
    act, dup_a = distinct(range(ACT_RANGE[0], ACT_RANGE[1] + 1), grays, keep=(contact_src,))
    kept = emerge + act
    diffs = [float(np.abs(grays[i].astype(np.float32) - grays[i - 1].astype(np.float32)).mean()) for i in range(EMERGE_RANGE[0] + 1, ACT_RANGE[1] + 1)]
    print("kept %d frames · EMERGE %d (f%d–f%d) · ACT %d (f%d–f%d) · duplicates dropped %s · smallest neighbour |Δ| %.2f · contact f%d (spear tip x=%d)" % (
        len(kept), len(emerge), emerge[0], emerge[-1], len(act), act[0], act[-1], dup_e + dup_a if dup_e + dup_a else "none", min(diffs), contact_src, tips[contact_src]))

    shares = {i: fringe_share(frames[i], matte(i)[0], K)[0] for i in kept}
    need = [i for i in kept if shares[i] > FRINGE_LIMIT]
    print("fringe share per kept frame (limit %.3f%%): max %.3f%% · over the limit: %s" % (FRINGE_LIMIT * 100, max(shares.values()) * 100, need if need else "none — rembg not needed"))
    # rembg, only where the key leaves fringe on the edge band
    session, remove = None, None
    stats = []
    os.makedirs(AUDIT, exist_ok=True)
    rgba = {}
    for i in kept:
        al, fg, dropped = matte(i)
        share, band = fringe_share(frames[i], al, K)
        used = False
        if share > FRINGE_LIMIT:
            if session is None:
                from rembg import new_session, remove as rb_remove
                session, remove = new_session("isnet-general-use"), rb_remove
            m = np.asarray(remove(Image.fromarray(frames[i]), session=session, only_mask=True)).astype(np.float32) / 255.0
            al = np.where(band, np.minimum(al, m), al); used = True
            share_after, _ = fringe_share(frames[i], al, K)
        else:
            share_after = share
        stats.append({"src": i, "fringeBefore": round(share, 5), "fringeAfter": round(share_after, 5), "rembg": used, "detachedDropped": dropped})
        img = np.dstack([np.clip(fg, 0, 255).astype(np.uint8), (np.clip(al, 0, 1) * 255).astype(np.uint8)])
        img[..., :3][img[..., 3] == 0] = 0
        rgba[i] = img
        Image.fromarray(img, "RGBA").save(os.path.join(AUDIT, "f%03d.png" % i))

    # the pivot: ground contact under the front hooves (the horse faces left), on a settled frame
    al, _, _ = matte(SETTLED_FRAME)
    ys, xs = np.where(al > 0.5)
    ground = int(ys.max()); band = xs[ys >= ground - 14]
    left = band[band <= np.percentile(band, 50)]
    PIV = (float(np.mean(left)), float(ground))
    # trim every kept frame; one scale for all
    boxes = {}
    for i in kept:
        a = rgba[i][..., 3]; yy, xx = np.where(a > 5)
        x0, y0, x1, y1 = int(xx.min()), int(yy.min()), int(xx.max()) + 1, int(yy.max()) + 1
        x0, y0 = min(x0, int(math.floor(PIV[0]))), min(y0, int(math.floor(PIV[1])))
        x1, y1 = max(x1, int(math.ceil(PIV[0])) + 1), max(y1, int(math.ceil(PIV[1])) + 1)
        boxes[i] = (x0, y0, x1, y1)
    s = CELL_MAX / max(max(b[2] - b[0], b[3] - b[1]) for b in boxes.values())
    cells, origins = [], {}
    for i in kept:
        x0, y0, x1, y1 = boxes[i]
        crop = Image.fromarray(rgba[i][y0:y1, x0:x1], "RGBA")
        w, h = max(1, round((x1 - x0) * s)), max(1, round((y1 - y0) * s))
        cells.append((i, crop.resize((w, h), Image.LANCZOS), (PIV[0] - x0) * s, (PIV[1] - y0) * s))
        origins[i] = (x0, y0)
    # pack: shelf rows, 4096 px wide at most (the phone texture ceiling)
    ROW_W = 4096; x, y, rowh, placed = PAD, PAD, 0, []
    for i, c, px, py in cells:
        if x + c.width + PAD > ROW_W: x, y, rowh = PAD, y + rowh + PAD, 0
        placed.append((i, c, x, y, px, py)); x += c.width + PAD; rowh = max(rowh, c.height)
    AW = max(p[2] + p[1].width for p in placed) + PAD; AH = max(p[3] + p[1].height for p in placed) + PAD
    if AW > 4096 or AH > 4096: sys.exit("atlas %dx%d exceeds 4096" % (AW, AH))
    atlas = Image.new("RGBA", (AW, AH), (0, 0, 0, 0))
    for i, c, cx, cy, px, py in placed: atlas.paste(c, (cx, cy), c)
    os.makedirs(OUT, exist_ok=True)
    atlas.save(os.path.join(OUT, "atlas.webp"), "WEBP", quality=90, method=6, exact=True)
    # LAB-5 · THE QUALITY RUNG: the same cells at half size (256 px max), resized from the source crops (not from the 512 atlas, so no
    # neighbour bleeds in), packed on their own atlas, same order, same pivot point. The page picks the rung by device.
    R = 2
    half = []
    for i in kept:
        x0, y0, x1, y1 = boxes[i]
        crop = Image.fromarray(rgba[i][y0:y1, x0:x1], "RGBA")
        w, h = max(1, round((x1 - x0) * s / R)), max(1, round((y1 - y0) * s / R))
        half.append((i, crop.resize((w, h), Image.LANCZOS), (PIV[0] - x0) * s / R, (PIV[1] - y0) * s / R))
    x, y, rowh, placed_h = PAD, PAD, 0, []
    for i, c, px, py in half:
        if x + c.width + PAD > 2048: x, y, rowh = PAD, y + rowh + PAD, 0
        placed_h.append((i, c, x, y, px, py)); x += c.width + PAD; rowh = max(rowh, c.height)
    HW = max(p[2] + p[1].width for p in placed_h) + PAD; HH = max(p[3] + p[1].height for p in placed_h) + PAD
    atlas_h = Image.new("RGBA", (HW, HH), (0, 0, 0, 0))
    for i, c, cx, cy, px, py in placed_h: atlas_h.paste(c, (cx, cy), c)
    atlas_h.save(os.path.join(OUT, "atlas_256.webp"), "WEBP", quality=90, method=6, exact=True)
    ne = len(emerge)
    manifest = {
        "cardId": CARD, "class": "actor", "version": 2, "placeholder": False,
        "source": "Kling clip %s (sha256 %s…, %d frames @ %d fps, %dx%d, chroma green) — kept f%d–f%d; matted by tools/make_actor_from_clip.py" % (os.path.basename(CLIP), sha[:12], len(frames), round(fps), W, H, kept[0], kept[-1]),
        "atlas": "atlas.webp", "atlasSize": {"w": AW, "h": AH},
        "alpha": "straight", "blend": "normal", "mv": False, "vignette": False, "cellMax": CELL_MAX,
        "fps": FPS, "timing": "native", "tempo": TEMPO, "phaseMs": PHASE_MS, "facing": "left", "mirror": True,
        "refHeight": max(c.height for _, c, _, _ in cells),
        "cells": [{"name": "f%03d" % i, "src": i, "x": cx, "y": cy, "w": c.width, "h": c.height, "pivot": {"x": round(px, 1), "y": round(py, 1)}, "origin": list(origins[i])} for i, c, cx, cy, px, py in placed],
        "rungs": [{"cellMax": CELL_MAX // R, "atlas": "atlas_256.webp", "atlasSize": {"w": HW, "h": HH}, "refHeight": max(c.height for _, c, _, _ in half),
                   "cells": [{"name": "f%03d" % i, "src": i, "x": cx, "y": cy, "w": c.width, "h": c.height, "pivot": {"x": min(c.width, round(px, 1)), "y": min(c.height, round(py, 1))}} for i, c, cx, cy, px, py in placed_h]}],
        "phases": {"emerge": list(range(0, ne)), "act": list(range(ne, len(kept))), "fizzle": [len(kept) - 1]},
        "contact": act.index(contact_src),
        "audit": {"idle": [0, EMERGE_RANGE[0] - 1], "emerge": list(EMERGE_RANGE), "act": list(ACT_RANGE), "droppedTail": [ACT_RANGE[1] + 1, len(frames) - 1], "duplicatesDropped": dup_e + dup_a, "contactSrc": contact_src, "pivotSrc": [round(PIV[0], 1), round(PIV[1], 1)], "scale": round(s, 5)},
    }
    with open(os.path.join(OUT, "manifest.json"), "w") as f: json.dump(manifest, f, indent=2); f.write("\n")
    with open(os.path.join(AUDIT, "matte_stats.json"), "w") as f: json.dump(stats, f, indent=1)

    # the contact sheet for the owner: every kept frame, matted, over a checker, labelled with its phase; contact starred
    tw = 300; th = int(round(tw * max(c.height for _, c, _, _ in cells) / max(c.width for _, c, _, _ in cells)))
    cols = 8; rows = (len(cells) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * tw, rows * (th + 22) + 30), (18, 18, 18)); d = ImageDraw.Draw(sheet)
    d.text((8, 8), "Meghnad actor · %d frames kept of %d · EMERGE %d in %d ms · ACT %d in %d ms (tempo 1; default %.1fx) · contact f%d · atlas %dx%d" % (len(kept), len(frames), ne, PHASE_MS["emerge"], len(act), PHASE_MS["act"], TEMPO, contact_src, AW, AH), fill=(235, 210, 150))
    chk = Image.new("RGB", (tw, th)); cd = ImageDraw.Draw(chk)
    for gx in range(0, tw, 12):
        for gy in range(0, th, 12): cd.rectangle([gx, gy, gx + 11, gy + 11], fill=(70, 70, 70) if (gx // 12 + gy // 12) % 2 else (100, 100, 100))
    for k, (i, c, _, _, px, py) in enumerate(placed):
        col, row = k % cols, k // cols; ox, oy = col * tw, 30 + row * (th + 22)
        tile = chk.copy(); sc = min(tw / c.width, th / c.height); t = c.resize((max(1, int(c.width * sc)), max(1, int(c.height * sc))), Image.LANCZOS)
        tile.paste(t, ((tw - t.width) // 2, (th - t.height) // 2), t); td = ImageDraw.Draw(tile)
        pxs, pys = (tw - t.width) // 2 + px * sc, (th - t.height) // 2 + py * sc; td.ellipse([pxs - 4, pys - 4, pxs + 4, pys + 4], outline=(255, 70, 70), width=2)
        sheet.paste(tile, (ox, oy + 22))
        label = "f%d %s%d%s" % (i, "E" if k < ne else "A", k if k < ne else k - ne, "  ★ CONTACT" if i == contact_src else "")
        d.text((ox + 4, oy + 5), label, fill=(255, 220, 120) if i != contact_src else (255, 120, 120))
    sheet.save(SHEET, quality=88)
    used = sum(1 for x in stats if x["rembg"])
    print("atlas %dx%d · %.1f KB · decoded %.1f MB · cells max %dpx · rembg edge cleanup on %d of %d frames · wrote %s" % (AW, AH, os.path.getsize(os.path.join(OUT, "atlas.webp")) / 1024, AW * AH * 4 / 1048576, max(max(c.width, c.height) for _, c, _, _ in cells), used, len(kept), os.path.relpath(SHEET, LAB)))
    print("rung 256: atlas %dx%d · %.1f KB · decoded %.1f MB (%.1f%% of the 512 rung) · cells max %dpx" % (HW, HH, os.path.getsize(os.path.join(OUT, "atlas_256.webp")) / 1024, HW * HH * 4 / 1048576, 100.0 * HW * HH / (AW * AH), max(max(c.width, c.height) for _, c, _, _ in half)))

if __name__ == "__main__":
    main()
