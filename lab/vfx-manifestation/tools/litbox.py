#!/usr/bin/env python3
# NO-CUT ruling (owner, 2026-11-26 18:04), rule 2: "fit the picture's real extent, not the black frame around it". This measures a pack's LIT BOX — the
# union, over ALL its cells (after the mid-tone lift and the baked fades/feathers, exactly as the player draws them), of the rows and columns where at
# least MIN_SHARE of the pixels reach luminance THR — and writes it into the manifest as "litBox" (cell px). Fainter glow outside the box is what the
# player feathers out at the half's edge. Run after make_effect_from_clip.py for every pack drawn whole inside a half.
#   python3 tools/litbox.py pavamana pavamana_hi kavacha kavacha_hi nagastra nagastra_hi tamasa tamasa_hi
import json, os, sys
import numpy as np
from PIL import Image
LAB = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
THR = 40          # luminance (0-255, Rec.601) a pixel must reach to count as lit
MIN_SHARE = 0.004 # a row/column counts only if at least 0.4% of its pixels are lit (loose dust and sparkle do not widen the box)

def lit_box(atlas, cells):
    A = np.asarray(atlas.convert("RGB")).astype(np.float32); Y = 0.299 * A[..., 0] + 0.587 * A[..., 1] + 0.114 * A[..., 2]
    w, h = cells[0]["w"], cells[0]["h"]; rows = np.zeros(h, bool); cols = np.zeros(w, bool)
    for c in cells:
        L = Y[c["y"]:c["y"] + c["h"], c["x"]:c["x"] + c["w"]] >= THR
        rows |= L.sum(axis=1) >= MIN_SHARE * w; cols |= L.sum(axis=0) >= MIN_SHARE * h
    r, k = np.where(rows)[0], np.where(cols)[0]
    return {"x0": int(k.min()), "y0": int(r.min()), "x1": int(k.max()) + 1, "y1": int(r.max()) + 1, "thr": THR, "minShare": MIN_SHARE,
            "rule": "NO-CUT ruling (owner, 2026-11-26 18:04): the lit extent over all cells (luminance >= %d on >= %.1f%% of a row/column, after the lift); on a wide board this box is fitted to the half it acts on with a margin, and anything fainter outside it is feathered out at the half's edge" % (THR, MIN_SHARE * 100)}

if __name__ == "__main__":
    for key in sys.argv[1:]:
        d = os.path.join(LAB, "effects", key); mp = os.path.join(d, "manifest.json"); m = json.load(open(mp))
        lb = lit_box(Image.open(os.path.join(d, m["atlas"])), m["cells"]); out = {}
        for k, v in m.items():
            if k == "litBox": continue
            out[k] = v
            if k == "anchor": out["litBox"] = lb
        with open(mp, "w") as fh: json.dump(out, fh, indent=2); fh.write("\n")
        cw, ch = m["cellSize"]["w"], m["cellSize"]["h"]
        print("%-12s cell %dx%d  litBox x %d-%d (%.3f-%.3f)  y %d-%d (%.3f-%.3f)" % (key, cw, ch, lb["x0"], lb["x1"], lb["x0"] / cw, lb["x1"] / cw, lb["y0"], lb["y1"], lb["y0"] / ch, lb["y1"] / ch))
