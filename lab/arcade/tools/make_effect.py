#!/usr/bin/env python3
"""ARCADE-1 · THE EFFECT TOOL (the Kling effect layer, owner brief 2026-11-05).   Run with the matting venv:
      lab/vfx-manifestation/tools/.venv/bin/python -I lab/arcade/tools/make_effect.py [vajra_bolt vajra_impact nagapasha_flight nagapasha_bind]

Kling effect clips on pure black (lab/arcade/sources/fx/fx_<name>.mp4, gitignored) → effects/fx_<name>/{hi,lo}_<n>.webp + .ktx2 + manifest.json,
packed and encoded with the fighter tool's own helpers (make_fighter.py: pages, KTX2 hi = the fighters' UASTC, lo = ETC1S).

  ALPHA   lightning ("add"): black is the transparent base — the colour is kept as is, alpha = its brightest channel (the page carries
          the premultiplied colour = the clip's pixel, drawn ADDITIVELY). serpents ("normal"): alpha from brightness (a soft ramp on the
          brightest channel), the colour un-premultiplied — drawn with NORMAL blending so they stay solid over a bright arena.
  CROP    one box for every cell (the union of the content over the sampled frames, + a margin): the cells line up, the anchor is fixed.
  LOOP    the SHORTEST loop whose seam (mean |Δ| between its first frame and the frame after its last) is no bigger than the clip's own mean
          frame-to-frame change — the jump back is then like any other frame; if none, the loop with the lowest seam. Sampled every STEP
          source frames (24 / STEP fps): the lightning flickers at 12 fps; the serpents (one continuous 5 s cycle each) at 8 fps.
  SIZE    hi: the cell's reference dimension (REF) in px, chosen so the effect is never upscaled more than ~1.2× at the closest zoom at
          DPR 2; lo = 0.6 × hi.
"""
import os, sys, json, math, tempfile
import numpy as np, cv2
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import make_fighter as mf

ARC = mf.ARC
# REF: which dimension the size refers to and its hi px (display logical size × 2.5 for zoom 1.25 at DPR 2, ÷ 1.2 allowed upscale)
FX = {
    "vajra_bolt":       {"blend": "add",    "ref": ("h", 128), "step": 2, "minLoop": 12, "anchor": "left-mid",  "display": "stretched from the weapon tip to the shot, 60 logical px tall"},
    "vajra_impact":     {"blend": "add",    "ref": ("h", 420), "step": 2, "minLoop": 12, "anchor": "center",    "display": "200 logical px on a hit, 110 on a block"},
    "nagapasha_flight": {"blend": "normal", "ref": ("w", 460), "step": 3, "minLoop": 24, "anchor": "right-mid", "display": "220 logical px long, head leading"},
    "nagapasha_bind":   {"blend": "normal", "ref": ("h", 520), "step": 3, "minLoop": 24, "anchor": "center",    "display": "its height = the bound Hero's body height (220 logical)"},
}
LO = 0.6
A_LO, A_HI = 6.0, 150.0          # the serpents' alpha ramp on the brightest channel (0–255)
THRESH = 10                      # content: the brightest channel above this

def decode(path):
    cap = cv2.VideoCapture(path); fr = []
    while True:
        ok, f = cap.read()
        if not ok: break
        fr.append(cv2.cvtColor(f, cv2.COLOR_BGR2RGB))
    return fr, cap.get(cv2.CAP_PROP_FPS)

def rgba_of(rgb, blend):
    m = rgb.max(axis=2).astype(np.float32)
    if blend == "add":            # straight colour = rgb / alpha with alpha = max channel, so the premultiplied colour is the pixel itself
        a = m / 255.0
    else:
        a = np.clip((m - A_LO) / (A_HI - A_LO), 0, 1)
    col = np.where(a[..., None] > 1e-3, rgb.astype(np.float32) / np.maximum(a[..., None], 1e-3), 0)
    return np.dstack([np.clip(col, 0, 255), a * 255]).astype(np.uint8)

def seam(frames, minLoop):
    # the loop (s, L): the lowest mean |Δ| between frame s and frame s+L, over s in the first second and L ≥ minLoop; ties → the shorter
    small = [cv2.resize(f, (f.shape[1] // 8, f.shape[0] // 8), interpolation=cv2.INTER_AREA).astype(np.float32) for f in frames]
    n = len(small); best = None
    step = [float(np.abs(small[i] - small[i + 1]).mean()) for i in range(n - 1)]
    mean = float(np.mean(step)); seams = {}
    for s in range(0, min(24, n - minLoop)):
        for L in range(minLoop, n - s):
            e = float(np.abs(small[s] - small[s + L]).mean())
            if L not in seams or e < seams[L][0]: seams[L] = (e, s)
            if best is None or e < best[0] - 1e-6: best = (e, s, L)
    ok = [L for L in sorted(seams) if seams[L][0] <= mean]
    if ok: L = ok[0]; best = (seams[L][0], seams[L][1], L)
    return best, mean

def build(name):
    sp = FX[name]; path = os.path.join(ARC, "sources", "fx", "fx_%s.mp4" % name)
    frames, fps = decode(path); n = len(frames)
    (err, s, L), consec = seam(frames, sp["minLoop"])
    src = list(range(s, s + L, sp["step"]))
    # the crop: the union of the content over the sampled frames, + a margin
    mask = np.zeros(frames[0].shape[:2], bool)
    for i in src: mask |= frames[i].max(axis=2) > THRESH
    ys, xs = np.where(mask); m = 6
    x0, x1, y0, y1 = max(0, xs.min() - m), min(mask.shape[1], xs.max() + m + 1), max(0, ys.min() - m), min(mask.shape[0], ys.max() + m + 1)
    cw, ch = x1 - x0, y1 - y0
    dim, ref = sp["ref"]; scale_hi = ref / (ch if dim == "h" else cw)
    out = os.path.join(ARC, "effects", "fx_" + name); os.makedirs(out, exist_ok=True)
    for f in os.listdir(out):
        if f.endswith((".webp", ".ktx2")): os.remove(os.path.join(out, f))
    tmp = tempfile.mkdtemp(prefix="arcfx"); rungs = {}
    for rung, sc in (("hi", scale_hi), ("lo", scale_hi * LO)):
        W, H = max(4, int(round(cw * sc))), max(4, int(round(ch * sc)))
        cells = []
        for i in src:
            crop = frames[i][y0:y1, x0:x1]
            small = cv2.resize(crop, (W, H), interpolation=cv2.INTER_AREA)
            cells.append(rgba_of(small, sp["blend"]))
        sheets, rects = mf.pack_pages(cells, mf.PAGE[rung])
        enc = mf.ENC_CHOSEN[rung] if hasattr(mf, "ENC_CHOSEN") and rung in mf.ENC_CHOSEN else mf.ENC[rung][0]
        pages = []
        for k, sh in enumerate(sheets):
            wp, kt = "%s_%d.webp" % (rung, k), "%s_%d.ktx2" % (rung, k)
            Image.fromarray(sh, "RGBA").save(os.path.join(out, wp), "WEBP", quality=mf.WEBP_Q[rung], method=6)
            png = os.path.join(tmp, "p.png"); pm = mf.premult(sh); Image.fromarray(pm, "RGBA").save(png); mf.run_basisu(png, os.path.join(out, kt), enc[1])
            dec = mf.ktx2_rgba(os.path.join(out, kt), 0, 0); q = mf.psnr(dec, pm, sh[..., 3] > 0)
            pages.append({"webp": wp, "ktx2": kt, "size": [int(sh.shape[1]), int(sh.shape[0])], "psnr": q,
                          "bytes": {"webp": os.path.getsize(os.path.join(out, wp)), "ktx2": os.path.getsize(os.path.join(out, kt))}})
        ax = {"left-mid": 0.0, "center": 0.5, "right-mid": 1.0}[sp["anchor"]]
        rungs[rung] = {"pages": pages, "encoding": enc[0], "cellSize": [W, H], "scale": round(sc, 5),
                       "cells": [{"page": r[0], "x": int(r[1]), "y": int(r[2]), "w": int(r[3]), "h": int(r[4]), "px": round(ax * W, 2), "py": round(0.5 * H, 2)} for r in rects]}
        print("  %s %s: %d cells %dx%d on %d page(s) %s · KTX2 %d KB (%s, %.1f dB) · WebP %d KB · GPU %.2f MB" % (name, rung, len(cells), W, H, len(pages), [p["size"] for p in pages],
              sum(p["bytes"]["ktx2"] for p in pages) // 1024, enc[0], min(p["psnr"] for p in pages), sum(p["bytes"]["webp"] for p in pages) // 1024, sum(p["size"][0] * p["size"][1] for p in pages) / 1048576))
    man = {"effect": name, "class": "fx-clip", "version": 1, "blend": sp["blend"], "alpha": "brightest channel" if sp["blend"] == "add" else "brightness ramp %g–%g, colour un-premultiplied" % (A_LO, A_HI),
           "source": {"file": os.path.basename(path), "sha256": mf.sha(path), "frames": n, "fps": fps, "crop": [int(x0), int(y0), int(cw), int(ch)]},
           "loop": {"start": s, "frames": L, "seamError": round(err, 2), "meanFrameStep": round(consec, 2), "src": src, "fps": fps / sp["step"]},
           "anchor": sp["anchor"], "display": sp["display"], "rungs": rungs}
    with open(os.path.join(out, "manifest.json"), "w") as f: json.dump(man, f, indent=1)
    print("  %s: loop f%d–f%d (%d frames, seam |Δ| %.2f vs %.2f between neighbours) → %d cells at %g fps; crop %dx%d" % (name, s, s + L, L, err, consec, len(src), fps / sp["step"], cw, ch))
    # a contact sheet for the owner (never committed)
    sh0 = rungs["hi"]; pg = [np.asarray(Image.open(os.path.join(out, p["webp"])).convert("RGBA")) for p in sh0["pages"]]
    tiles = [pg[c["page"]][c["y"]:c["y"] + c["h"], c["x"]:c["x"] + c["w"]] for c in sh0["cells"]]
    mf.contact_sheet(os.path.join(mf.SCREENS, "fx_%s_contact.jpg" % name), tiles, ["f%03d" % i for i in src], "fx · %s · %d cells at %g fps (%s)" % (name, len(src), fps / sp["step"], sp["blend"]),
                     [(t.shape[1] / 2, t.shape[0] - 4) for t in tiles], bg=(40, 40, 40))
    return man

if __name__ == "__main__":
    # the encoding: the hi tier is the fighters' UASTC choice (read from Indra's manifest); lo ETC1S
    ind = json.load(open(os.path.join(ARC, "fighters", "indra", "manifest.json")))
    mf.ENC_CHOSEN = {r: (ind["rungs"][r]["encoding"]["chosen"], ind["rungs"][r]["encoding"]["args"]) for r in ("hi", "lo")}
    for nm in sys.argv[1:] or list(FX): build(nm)
