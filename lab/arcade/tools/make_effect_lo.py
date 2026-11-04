#!/usr/bin/env python3
"""ARCADE-1 · the HALF-SIZE effect atlas for the lo rung (owner ruling 1, 2026-11-04): effects/<fx>/atlas.webp → effects/<fx>/lo/atlas.webp
at half each side (a quarter of the graphics memory), with the manifest's cells, cell size and anchor halved and rungScale 2 (the page
draws it twice as large, so it sits exactly where the hi atlas does).   python3 lab/arcade/tools/make_effect_lo.py vajra"""
import os, sys, json
from PIL import Image
ARC = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
for fx in sys.argv[1:] or ["vajra"]:
    d = os.path.join(ARC, "effects", fx); man = json.load(open(os.path.join(d, "manifest.json")))
    im = Image.open(os.path.join(d, man["atlas"])).convert("RGB")
    W, H = (im.width + 1) // 2, (im.height + 1) // 2
    lo = im.resize((W, H), Image.LANCZOS)
    os.makedirs(os.path.join(d, "lo"), exist_ok=True); out = os.path.join(d, "lo", "atlas.webp"); lo.save(out, "WEBP", quality=85, method=6)
    half = lambda c: {k: (v / 2 if isinstance(v, (int, float)) and k in ("x", "y", "w", "h") else v) for k, v in c.items()}
    m2 = dict(man); m2["atlas"] = "atlas.webp"; m2["atlasSize"] = {"w": W, "h": H}; m2["cellSize"] = {"w": man["cellSize"]["w"] / 2, "h": man["cellSize"]["h"] / 2}
    m2["anchor"] = {"x": man["anchor"]["x"] / 2, "y": man["anchor"]["y"] / 2}; m2["cells"] = [half(c) for c in man["cells"]]; m2["rungScale"] = 2
    m2["derivedFrom"] = "effects/%s/%s at half size (tools/make_effect_lo.py)" % (fx, man["atlas"])
    json.dump(m2, open(os.path.join(d, "lo", "manifest.json"), "w"), indent=1)
    print("%s lo: %dx%d → %dx%d, %d KB, graphics memory %.1f → %.1f MB" % (fx, im.width, im.height, W, H, os.path.getsize(out) // 1024, im.width * im.height * 4 / 1048576, W * H * 4 / 1048576))
