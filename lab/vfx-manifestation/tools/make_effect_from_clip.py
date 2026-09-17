#!/usr/bin/env python3
# tools/make_effect_from_clip.py — LAB-19. THE PREMIUM EFFECTS TRACK: an ADDITIVE EFFECT CLIP from black-ground Kling footage.
#
#   tools/.venv/bin/python tools/make_effect_from_clip.py vajra      → effects/vajra/atlas.webp + manifest.json, frames/vajra_effect_sheet.jpg
#
# NOT an actor (owner amendment, LAB-19): no matte, no rungs, no pivot, no phases, no per-actor memory ladder. The ground is pure black,
# so the frame IS the effect — played additively, black adds nothing. The pack only crops, scales, fades and feathers:
#   · the crop box is the union of every kept frame's content (luma > 4), so no glow is cut that the source kept
#   · one cell size for every cell (the effect layer's hi-rung class, E1), packed on shelf rows no wider than 4096
#   · a FADE-IN HEAD (the weapon would otherwise pop in on the first cell) and a FADE TAIL (the clip never exits: its ring is still
#     growing on its last frame, so the tail is mandatory)
#   · TOP and BOTTOM FEATHERS: the weapon is cut by the frame's top edge, and the impact's glow and spike by its bottom edge. Each band is
#     a linear ramp to black, applied to the RGB (under additive blending darkness is transparency). The bottom band has a GUARD: it may
#     never reach the impact's RING BODY — a row holding at least RING_ROW bright (> 150) pixels off the beam column — on any frame from the
#     impact up to the fade tail. Sparse sparks are not the body (they reach the edge on the tail's last frames by design); the frames the
#     body itself grows into the band are named, and are inside the fade tail
# Measured, then checked against the card's ruling: the impact frame (the largest picture change in the strike window), the impact point
# (the brightest blurred point in the lower half on the impact frame) and the ring diameter on the scale frame (off-beam ring pixels).
import os, sys, json, math, hashlib
import numpy as np, cv2
from PIL import Image, ImageDraw

LAB = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LUMA = np.array([0.299, 0.587, 0.114], np.float32)
PAD = 2
RING_ROW = 20

EFFECTS = {
    # LAB-19 ruling: S1, the strike alone. The charge phase (f000–f084) stays in the source, unused (a possible cast cinematic, not built).
    "vajra": {"label": "Vajra", "clip": "vajra/vajra_black.mp4", "card_id": "vajra", "range": (85, 120), "impact": 93, "impact_window": (90, 100),
              "cell_px": 448, "fade_in": 4, "fade_tail": 10, "feather_top": 64, "feather_bottom": 64,
              "scale_frame": 112, "card_widths": 2.4, "beam_half": 70, "ring_floor": 780,
              "contract": {"trigger": "destroy", "abilityName": "Vajra", "anchor": "target-card-centre", "castSound": "sfx_astra", "impactSound": "sfx_unit_destroy",
                           "castHitStopMs": 110, "castHoldMs": 1000, "crackAfterMs": 40, "destroyDwellMs": 600, "awaited": False}},
    # LAB-20 · THE FIRST CHAIN: Sudarshana Chakra (Mythic). An INVOCATION clip at the caster's half centre (the game's own throw origin),
    # handed off to a STRIKE clip on the removed Hero, whose ring-snap lands on the game's bite. Two clips, decoded one after the other (E1).
    "sudarshana_invoke": {"kind": "chain-clip", "role": "invoke", "label": "Sudarshana invocation", "clip": "sudarshana/sudarshana_invoke_black.mp4", "card_id": "sudarshana",
              "range": (83, 98), "impact": None, "cell_px": 448, "fade_in": 3, "fade_out": 4, "fade_tail": 0,   # the last spin revolutions into the tilt-flat throw; f099+ runs off the left edge
              "feather_top": 0, "feather_bottom": 48, "feather_left": 32, "feather_right": 32, "anchor_frame": 83,
              "scale": {"feature": "disc", "frame": 83, "card_widths": 2.0}},
    "sudarshana_strike": {"kind": "chain-clip", "role": "strike", "label": "Sudarshana strike", "clip": "sudarshana/sudarshana_strike_black.mp4", "card_id": "sudarshana",
              "range": (34, 88), "impact": 53, "impact_window": (50, 56), "cell_px": 288, "fade_in": 0, "fade_out": 0, "fade_tail": 10,   # ends before the f090+ red-contour burst (a reshoot candidate)
              "feather_top": 64, "feather_bottom": 64, "feather_left": 0, "feather_right": 0, "anchor_frame": 53, "body_frame": 50,
              "scale": {"feature": "burst span", "frame": 85, "card_widths": 2.4},
              # LAB-20b: THE CHAKRA TRAVELS. The disc moves +x in the source (its trail streams left). The layer travels the game's own throw path
              # during the trail, arriving where the trail dies; the easing is the trail's own integral; rotation only while travelling
              "travel": {"source_motion": "+x", "fallback_ease": "easeOutQuad"}},
    "sudarshana": {"kind": "chain", "card_id": "sudarshana", "card_name": "Sudarshana Chakra", "clips": ["sudarshana_invoke", "sudarshana_strike"],
              "contract": {"trigger": "passive", "abilityName": "Sudarshana", "target": "enemy-hero", "castSound": "sfx_astra", "impactSound": None,
                           "castHitStopMs": 110, "castHoldMs": 1000, "flightMs": 380, "crackAfterMs": 100, "exitKind": "removal", "exitMs": 320,
                           "calloutAfterMs": 300, "destroyDwellMs": 440, "invokeAnchor": "caster-half-centre", "anchor": "target-card-centre", "awaited": False}},
}
E1_CAP = 3072 * 1536 * 4   # the effect layer's hi-rung class (LAB-19)

def main_chain_clip(key):
    # LAB-20: a chain member. Same crop / scale / fade / feather law as the single clip; its own anchor rule (the disc's core), its own
    # scale feature, an optional named impact, side feathers, a fade-OUT (an invocation hands off, it does not end), and a body guard
    C = EFFECTS[key]; clip = os.path.join(LAB, "sources", C["clip"])
    if not os.path.exists(clip): sys.exit("the source clip is not at " + clip)
    frames, fps = decode(clip); N = len(frames); H, W = frames[0].shape[:2]
    sha = hashlib.sha256(open(clip, "rb").read()).hexdigest(); L = [luma(f) for f in frames]
    corners = max(int(np.concatenate([f[:32, :32], f[:32, -32:], f[-32:, :32], f[-32:, -32:]]).max()) for f in frames)
    far, far_mean = 0, 0.0
    for f in frames:
        content = (f.max(axis=2) > 40).astype(np.uint8); dist = cv2.distanceTransform(1 - content, cv2.DIST_L2, 5); g = f.max(axis=2)[dist > 300]
        if g.size: far = max(far, int(g.max())); far_mean = max(far_mean, float(g.mean()))
    a, b = C["range"]; kept = list(range(a, b + 1))
    core = lambda i: tuple(int(v) for v in np.unravel_index(int(np.argmax(cv2.GaussianBlur(L[i], (0, 0), 25))), (H, W))[::-1])
    CORE = core(C["anchor_frame"]); cores = {i: core(i) for i in kept}; drift = max(math.hypot(c[0] - CORE[0], c[1] - CORE[1]) for c in cores.values())
    impact, window = C["impact"], None
    if impact is not None:
        w0, w1 = C["impact_window"]; window = {i: round(float(np.abs(L[i] - L[i - 1]).mean()), 2) for i in range(w0, w1 + 1)}
    # the scale feature, measured on its frame
    sf = C["scale"]["frame"]
    if C["scale"]["feature"] == "disc":
        n, lab_, stats, _ = cv2.connectedComponentsWithStats((L[sf] > 150).astype(np.uint8), 8)
        comp = lab_[CORE[1], CORE[0]]; span = int(stats[comp, cv2.CC_STAT_WIDTH])
    else:
        xs = np.where((L[sf] > 40).any(axis=0))[0]; span = int(xs.max() - xs.min() + 1)
    x0, y0, x1, y1 = W, H, 0, 0
    for i in kept:
        ys, xs = np.where(L[i] > 4); x0, y0, x1, y1 = min(x0, int(xs.min())), min(y0, int(ys.min())), max(x1, int(xs.max()) + 1), max(y1, int(ys.max()) + 1)
    bw, bh = x1 - x0, y1 - y0
    edge = lambda sel: sum(1 for i in kept if sel(L[i]))
    edges = {"top": edge(lambda l: (l[:3] > 40).any()), "bottom": edge(lambda l: (l[-3:] > 40).any()), "left": edge(lambda l: (l[:, :3] > 40).any()), "right": edge(lambda l: (l[:, -3:] > 40).any()), "of": len(kept)}
    fades = {}
    for k, i in enumerate(kept[:C["fade_in"]]): fades[i] = round((k + 1) / float(C["fade_in"] + 1), 4)
    if C["fade_out"]:
        n_o = C["fade_out"]
        for k, i in enumerate(kept[-n_o:]): fades[i] = round(min(fades.get(i, 1.0), (n_o - k) / float(n_o + 1)), 4)
    if C["fade_tail"]:
        n_t = C["fade_tail"]
        for k, i in enumerate(kept[-n_t:]): fades[i] = round(min(fades.get(i, 1.0), 1.0 - k / float(n_t - 1)), 4)
    ft, fbm, fl, fr = C["feather_top"], C["feather_bottom"], C["feather_left"], C["feather_right"]
    guard = None
    if C.get("body_frame") is not None:
        # the disc never moves (its core drifts at most `drift` px over the kept frames), so its body box on the frame it stands alone is its box
        n, lab_, stats, _ = cv2.connectedComponentsWithStats((L[C["body_frame"]] > 40).astype(np.uint8), 8)
        comp = lab_[CORE[1], CORE[0]]; by0 = int(stats[comp, cv2.CC_STAT_TOP]); by1 = by0 + int(stats[comp, cv2.CC_STAT_HEIGHT]) - 1
        top_room, bot_room = by0, (H - 1) - by1
        ft = min(ft, max(0, top_room - 2)); fbm = min(fbm, max(0, bot_room - 2))
        guard = {"bodyFrame": C["body_frame"], "bodyRows": [by0, by1], "topRoom": top_room, "bottomRoom": bot_room, "coreDriftMax": round(drift, 1)}
    ramp_y = np.ones(H, np.float32); ramp_x = np.ones(W, np.float32)
    if ft: ramp_y[:ft] = np.linspace(0.0, 1.0, ft, endpoint=False, dtype=np.float32)
    if fbm: ramp_y[H - fbm:] = np.minimum(ramp_y[H - fbm:], np.linspace(1.0, 0.0, fbm, endpoint=True, dtype=np.float32))
    if fl: ramp_x[:fl] = np.linspace(0.0, 1.0, fl, endpoint=False, dtype=np.float32)
    if fr: ramp_x[W - fr:] = np.minimum(ramp_x[W - fr:], np.linspace(1.0, 0.0, fr, endpoint=True, dtype=np.float32))
    ramp = ramp_y[:, None, None] * ramp_x[None, :, None]
    s = C["cell_px"] / float(max(bw, bh)); cw, ch = round(bw * s), round(bh * s)
    cells = []
    for i in kept:
        f = frames[i].astype(np.float32) * ramp * fades.get(i, 1.0)
        cells.append((i, Image.fromarray(np.clip(np.round(f[y0:y1, x0:x1]), 0, 255).astype(np.uint8), "RGB").resize((cw, ch), Image.LANCZOS)))
    ROW = 4096; x, y, placed = PAD, PAD, []
    for i, c in cells:
        if x + c.width + PAD > ROW: x, y = PAD, y + c.height + PAD
        placed.append((i, c, x, y)); x += c.width + PAD
    AW = max(p[2] + p[1].width for p in placed) + PAD; AH = max(p[3] + p[1].height for p in placed) + PAD
    if AW > 4096 or AH > 4096: sys.exit("atlas %dx%d exceeds 4096" % (AW, AH))
    if AW * AH * 4 > E1_CAP: sys.exit("atlas %dx%d decodes to %.2f MB, past the E1 cap" % (AW, AH, AW * AH * 4 / 1048576))
    atlas = Image.new("RGB", (AW, AH), (0, 0, 0))
    for i, c, cx, cy in placed: atlas.paste(c, (cx, cy))
    out = os.path.join(LAB, "effects", key); os.makedirs(out, exist_ok=True)
    atlas.save(os.path.join(out, "atlas.webp"), "WEBP", quality=90, method=6)
    anchor = {"x": round((CORE[0] - x0) * s, 1), "y": round((CORE[1] - y0) * s, 1)}
    manifest = {
        "cardId": C["card_id"], "class": "effect-clip", "role": C["role"], "version": 1,
        "source": "Kling clip %s (sha256 %s…, %d frames @ %d fps, %dx%d, black ground) — kept f%03d–f%03d; packed by tools/make_effect_from_clip.py" % (os.path.basename(clip), sha[:12], N, round(fps), W, H, a, b),
        "atlas": "atlas.webp", "atlasSize": {"w": AW, "h": AH}, "channels": "rgb", "blend": "add", "alpha": "luminance",
        "fps": round(fps), "timing": "native", "cellPx": max(cw, ch), "cellSize": {"w": cw, "h": ch},
        "cells": [{"name": "f%03d" % i, "src": i, "x": cx, "y": cy, "w": c.width, "h": c.height} for i, c, cx, cy in placed],
        "impact": kept.index(impact) if impact is not None else None, "anchor": anchor,
        "scaleRule": {"feature": C["scale"]["feature"], "frame": sf, "spanSrc": span, "spanCell": round(span * s, 2), "cardWidths": C["scale"]["card_widths"]},
        "audit": {"range": [a, b], "droppedHead": [0, a - 1] if a > 0 else None, "droppedTail": [b + 1, N - 1] if b < N - 1 else None,
                  "anchorFrame": C["anchor_frame"], "anchorPoint": list(CORE), "coreDriftMax": round(drift, 1),
                  "box": [x0, y0, x1, y1], "scale": round(s, 5), "ground": {"cornersMax": corners, "farMax": far, "farMeanMax": round(far_mean, 3)}, "edges": edges,
                  "fades": [[i, fades[i]] for i in kept if i in fades],
                  "feathers": {"top": ft, "bottom": fbm, "left": fl, "right": fr, "asked": {"top": C["feather_top"], "bottom": C["feather_bottom"], "left": C["feather_left"], "right": C["feather_right"]}, "guard": guard}},
    }
    if impact is not None:
        manifest["audit"].update({"impactSrc": impact, "impactRule": "named (owner ruling LAB-20: the ring closes around the disc)", "impactWindow": list(C["impact_window"]), "windowChange": {("f%03d" % k): v for k, v in window.items()}, "largestChangeAt": "f%03d" % max(window, key=window.get)})
    if C.get("travel"):
        # the trail's length per frame from the first kept frame: the pixels of content left of the disc body, in the body's rows. Its length
        # is the disc's speed; its running sum, normalised, is the position. Arrival = the first frame with no trail left
        n_, lab_, stats_, _ = cv2.connectedComponentsWithStats((L[C["body_frame"]] > 40).astype(np.uint8), 8); comp_ = lab_[CORE[1], CORE[0]]
        bx0 = int(stats_[comp_, cv2.CC_STAT_LEFT]); by0_ = int(stats_[comp_, cv2.CC_STAT_TOP]); by1_ = by0_ + int(stats_[comp_, cv2.CC_STAT_HEIGHT])
        lengths = []
        for i in kept:
            cols = np.where((L[i][by0_:by1_] > 40).any(axis=0))[0]; ln = max(0, bx0 - int(cols.min())) if len(cols) else 0
            if ln == 0: break
            lengths.append(ln)
        arrive = len(lengths); tot = float(sum(lengths)); cum = [0.0]
        for v in lengths: cum.append(cum[-1] + v)
        table = [round(c / tot, 4) for c in cum]
        parked = [arrive, kept.index(impact) - 1] if impact is not None else None
        manifest["travel"] = {"sourceMotion": C["travel"]["source_motion"], "from": "caster-half-centre", "to": "target-card-centre",
                              "startCell": 0, "arriveCell": arrive, "arriveSrc": kept[arrive], "trailLengths": lengths, "table": table,
                              "tableSource": "the trail's length per frame (px of content left of the disc body, rows %d-%d, body left x %d on f%03d), integrated and normalised" % (by0_, by1_ - 1, bx0, C["body_frame"]),
                              "fallbackEase": C["travel"]["fallback_ease"], "startsOn": "the first drawn strike cell (a slow decode shortens the flight, never jumps it)",
                              "rotation": {"while": "travelling", "parkedCells": parked, "zeroBy": kept.index(impact) if impact is not None else None,
                                           "rule": "Actors never rotate (the upright law stands). A directional effect may rotate its layer to align its motion feature with its board path: the rotation is taken from the actual caster-to-target vector, applies only while the feature is in motion, and eases back to the clip's authored orientation before its impact frame. An effect's authored orientation is kept at its impact."},
                              "bodyWidthSrc": int(stats_[comp_, cv2.CC_STAT_WIDTH])}
    with open(os.path.join(out, "manifest.json"), "w") as fh: json.dump(manifest, fh, indent=2); fh.write("\n")
    tw = 300; th = int(round(tw * ch / cw)); cols = 6; rows = (len(placed) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * tw, rows * (th + 20) + 28), (12, 12, 12)); d = ImageDraw.Draw(sheet)
    d.text((8, 8), "%s · %d cells f%03d–f%03d · cell %dx%d · atlas %dx%d · %.1f MB decoded" % (C["label"], len(placed), a, b, cw, ch, AW, AH, AW * AH * 4 / 1048576), fill=(235, 210, 150))
    for k, (i, c, _, _) in enumerate(placed):
        ox, oy = (k % cols) * tw, 28 + (k // cols) * (th + 20)
        sheet.paste(c.resize((tw, th), Image.LANCZOS), (ox, oy + 20)); td = ImageDraw.Draw(sheet)
        ax, ay = ox + anchor["x"] * tw / cw, oy + 20 + anchor["y"] * th / ch; td.ellipse([ax - 3, ay - 3, ax + 3, ay + 3], outline=(80, 200, 255))
        td.text((ox + 4, oy + 4), "f%03d%s" % (i, "  ★ IMPACT" if i == impact else ""), fill=(255, 120, 120) if i == impact else (255, 220, 120))
    sheet.save(os.path.join(LAB, "frames", key + "_effect_sheet.jpg"), quality=88)
    print("%s: %d frames · ground corners %d, far %d (mean %.3f) · kept f%03d–f%03d (%d cells) · core %s drift %.1f px · %s %d px on f%03d · box %dx%d · edges %s" % (key, N, corners, far, far_mean, a, b, len(kept), CORE, drift, C["scale"]["feature"], span, sf, bw, bh, edges))
    print("   feathers top %d bottom %d left %d right %d · guard %s · fades %s" % (ft, fbm, fl, fr, guard, [fades[i] for i in kept if i in fades]))
    if impact is not None: print("   impact f%03d (cell %d, named) · window changes %s · largest change at %s" % (impact, kept.index(impact), window, manifest["audit"]["largestChangeAt"]))
    print("   atlas %dx%d · %.1f KB · decoded %.2f MB · cells %dx%d · anchor %s" % (AW, AH, os.path.getsize(os.path.join(out, "atlas.webp")) / 1024, AW * AH * 4 / 1048576, cw, ch, anchor))
    return manifest

def main_chain(key):
    C = EFFECTS[key]
    for k in C["clips"]: main_chain_clip(k)
    inv = json.load(open(os.path.join(LAB, "effects", C["clips"][0], "manifest.json"))); stk = json.load(open(os.path.join(LAB, "effects", C["clips"][1], "manifest.json")))
    # LAB-20b: the strike layer starts at the invocation disc's on-screen size and recedes to its own — the ratio, from both packs' own scale rules
    scale_from = None
    if stk.get("travel"):
        inv_disc = inv["scaleRule"]["cardWidths"]                                             # card widths across, on screen
        stk_disc = stk["travel"]["bodyWidthSrc"] * stk["scaleRule"]["cardWidths"] / stk["scaleRule"]["spanSrc"]
        scale_from = round(inv_disc / stk_disc, 4)
    chain = {"cardId": C["card_id"], "cardName": C["card_name"], "class": "effect-chain", "version": 1,
             "clips": [{"role": EFFECTS[k]["role"], "manifest": "../" + k + "/manifest.json"} for k in C["clips"]],
             "handoff": "sequential: the invocation is released at the handoff, then the strike decodes (E1: one effect clip decoded at a time)",
             "contract": C["contract"]}
    if scale_from is not None: chain["travel"] = {"scaleFrom": scale_from, "scaleTo": 1.0, "why": "the invocation disc (%.1f card widths on screen) hands off in place to the strike disc (%.3f card widths): the strike layer eases from the one to the other on the travel curve, receding as it flies" % (inv["scaleRule"]["cardWidths"], stk["travel"]["bodyWidthSrc"] * stk["scaleRule"]["cardWidths"] / stk["scaleRule"]["spanSrc"])}
    out = os.path.join(LAB, "effects", key); os.makedirs(out, exist_ok=True)
    with open(os.path.join(out, "chain.json"), "w") as fh: json.dump(chain, fh, indent=2); fh.write("\n")
    print("chain %s: %s" % (key, [c["manifest"] for c in chain["clips"]]))


def decode(path):
    cap = cv2.VideoCapture(path); fps = cap.get(cv2.CAP_PROP_FPS); out = []
    while True:
        ok, f = cap.read()
        if not ok: break
        out.append(cv2.cvtColor(f, cv2.COLOR_BGR2RGB))
    return out, fps

def luma(f): return f.astype(np.float32) @ LUMA

def main(key):
    if key not in EFFECTS: sys.exit("unknown effect %r — one of %s" % (key, ", ".join(EFFECTS)))
    C = EFFECTS[key]; clip = os.path.join(LAB, "sources", C["clip"])
    if not os.path.exists(clip): sys.exit("the source clip is not at " + clip)
    frames, fps = decode(clip); N = len(frames); H, W = frames[0].shape[:2]
    sha = hashlib.sha256(open(clip, "rb").read()).hexdigest()
    L = [luma(f) for f in frames]

    # the ground: black, measured — the corners in every channel, and the brightest pixel far (> 300 px) from any content
    corners = max(int(np.concatenate([f[:32, :32], f[:32, -32:], f[-32:, :32], f[-32:, -32:]]).max()) for f in frames)
    far = 0
    for f in frames:
        content = (f.max(axis=2) > 40).astype(np.uint8)
        dist = cv2.distanceTransform(1 - content, cv2.DIST_L2, 5); g = f.max(axis=2)[dist > 300]
        if g.size: far = max(far, int(g.max()))

    a, b = C["range"]; kept = list(range(a, b + 1))
    # the impact frame: the largest picture change inside its window — must agree with the ruled frame
    w0, w1 = C["impact_window"]
    change = {i: float(np.abs(L[i] - L[i - 1]).mean()) for i in range(w0, w1 + 1)}
    impact = max(change, key=change.get)
    if impact != C["impact"]: sys.exit("the measured impact f%03d disagrees with the ruled f%03d" % (impact, C["impact"]))
    blur = cv2.GaussianBlur(L[impact][H // 2:], (0, 0), 9); iy, ix = np.unravel_index(int(np.argmax(blur)), blur.shape); IMP = (int(ix), int(iy + H // 2))
    # the ring on the scale frame: bright (> 150) pixels below the ring floor, off the beam column
    yy, xx = np.where(L[C["scale_frame"]] > 150); m = (yy > C["ring_floor"]) & (np.abs(xx - IMP[0]) > C["beam_half"])
    ring_d = int(xx[m].max() - xx[m].min() + 1)
    # the crop box: the union of content (luma > 4) over the kept frames
    x0, y0, x1, y1 = W, H, 0, 0
    for i in kept:
        ys, xs = np.where(L[i] > 4); x0, y0, x1, y1 = min(x0, int(xs.min())), min(y0, int(ys.min())), max(x1, int(xs.max()) + 1), max(y1, int(ys.max()) + 1)
    bw, bh = x1 - x0, y1 - y0
    top_cut = sum(1 for i in kept if (L[i][:3] > 40).any()); bot_cut = sum(1 for i in kept if (L[i][-3:] > 40).any())
    side_cut = sum(1 for i in kept if (L[i][:, :3] > 40).any() or (L[i][:, -3:] > 40).any())

    n_in, n_tail = C["fade_in"], C["fade_tail"]
    fades = {}
    for k, i in enumerate(kept[:n_in]): fades[i] = round((k + 1) / float(n_in + 1), 4)
    for k, i in enumerate(kept[-n_tail:]): fades[i] = round(min(fades.get(i, 1.0), 1.0 - k / float(n_tail - 1)), 4)
    # the bottom band's guard: the lowest RING-BODY row (>= RING_ROW bright pixels off the beam column), impact up to the fade tail
    def body_low(i):
        f = L[i] > 150; f[:, max(0, IMP[0] - C["beam_half"]):IMP[0] + C["beam_half"] + 1] = False
        rows = np.where(f.sum(axis=1) >= RING_ROW)[0]; return int(rows.max()) if len(rows) else -1
    tail0 = kept[-C["fade_tail"]]
    guard_frames = [i for i in kept if impact <= i < tail0]
    lows = {i: body_low(i) for i in guard_frames}; ring_low = max(lows.values()); ring_low_at = min(i for i, v in lows.items() if v == ring_low)
    room = (H - 1) - ring_low
    fb = min(C["feather_bottom"], max(0, room - 2)); ft = C["feather_top"]
    into = [i for i in kept if i >= tail0 and body_low(i) >= H - fb] if fb else []

    # per frame: crop, feather, fade (in source space), then one scale for every cell
    s = C["cell_px"] / float(max(bw, bh)); cw, ch = round(bw * s), round(bh * s)
    ramp_y = np.ones(H, np.float32)
    if ft: ramp_y[:ft] = np.linspace(0.0, 1.0, ft, endpoint=False, dtype=np.float32)
    if fb: ramp_y[H - fb:] = np.minimum(ramp_y[H - fb:], np.linspace(1.0, 0.0, fb, endpoint=True, dtype=np.float32))
    cells = []
    for i in kept:
        f = frames[i].astype(np.float32) * ramp_y[:, None, None] * fades.get(i, 1.0)
        crop = np.clip(np.round(f[y0:y1, x0:x1]), 0, 255).astype(np.uint8)
        cells.append((i, Image.fromarray(crop, "RGB").resize((cw, ch), Image.LANCZOS)))
    ROW = 4096; x, y, rowh, placed = PAD, PAD, 0, []
    for i, c in cells:
        if x + c.width + PAD > ROW: x, y, rowh = PAD, y + rowh + PAD, 0
        placed.append((i, c, x, y)); x += c.width + PAD; rowh = max(rowh, c.height)
    AW = max(p[2] + p[1].width for p in placed) + PAD; AH = max(p[3] + p[1].height for p in placed) + PAD
    if AW > 4096 or AH > 4096: sys.exit("atlas %dx%d exceeds 4096" % (AW, AH))
    atlas = Image.new("RGB", (AW, AH), (0, 0, 0))
    for i, c, cx, cy in placed: atlas.paste(c, (cx, cy))
    out = os.path.join(LAB, "effects", key); os.makedirs(out, exist_ok=True)
    atlas.save(os.path.join(out, "atlas.webp"), "WEBP", quality=90, method=6)

    anchor = {"x": round((IMP[0] - x0) * s, 1), "y": round((IMP[1] - y0) * s, 1)}
    manifest = {
        "cardId": C["card_id"], "class": "effect-clip", "version": 1,
        "source": "Kling clip %s (sha256 %s…, %d frames @ %d fps, %dx%d, black ground) — kept f%03d–f%03d; packed by tools/make_effect_from_clip.py" % (os.path.basename(clip), sha[:12], N, round(fps), W, H, a, b),
        "atlas": "atlas.webp", "atlasSize": {"w": AW, "h": AH}, "channels": "rgb", "blend": "add", "alpha": "luminance",
        "fps": round(fps), "timing": "native", "cellPx": max(cw, ch), "cellSize": {"w": cw, "h": ch},
        "cells": [{"name": "f%03d" % i, "src": i, "x": cx, "y": cy, "w": c.width, "h": c.height} for i, c, cx, cy in placed],
        "impact": kept.index(impact), "anchor": anchor,
        "scaleRule": {"ringFrame": C["scale_frame"], "ringDiameterSrc": ring_d, "ringDiameterCell": round(ring_d * s, 2), "cardWidths": C["card_widths"]},
        "contract": C["contract"],
        "audit": {"range": [a, b], "droppedHead": [0, a - 1] if a > 0 else None, "droppedTail": [b + 1, N - 1] if b < N - 1 else None,
                  "impactSrc": impact, "impactWindow": list(C["impact_window"]), "impactChange": round(change[impact], 2), "impactPoint": list(IMP),
                  "box": [x0, y0, x1, y1], "scale": round(s, 5),
                  "ground": {"cornersMax": corners, "farMax": far},
                  "edges": {"top": top_cut, "bottom": bot_cut, "sides": side_cut, "of": len(kept)},
                  "fadeIn": [[i, fades[i]] for i in kept[:n_in]], "fadeTail": [[i, fades[i]] for i in kept[-n_tail:]],
                  "featherTop": {"px": ft, "cellPx": round(ft * s, 1)},
                  "featherBottom": {"px": fb, "asked": C["feather_bottom"], "cellPx": round(fb * s, 1), "ringBodyLowest": ring_low, "ringBodyLowestAt": ring_low_at, "room": room,
                                    "guardScope": "impact to fade tail", "guardFrames": [guard_frames[0], guard_frames[-1]], "ringRow": RING_ROW,
                                    "bodyInBandTail": [[i, fades[i]] for i in into]}},
    }
    with open(os.path.join(out, "manifest.json"), "w") as fh: json.dump(manifest, fh, indent=2); fh.write("\n")

    # the owner's sheet: every cell, the impact starred, the anchor marked
    tw = 300; th = int(round(tw * ch / cw)); cols = 6; rows = (len(placed) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * tw, rows * (th + 20) + 28), (12, 12, 12)); d = ImageDraw.Draw(sheet)
    d.text((8, 8), "%s effect clip · %d cells f%03d–f%03d · impact f%03d (cell %d) · cell %dx%d · atlas %dx%d · %.1f MB decoded" % (C["label"], len(placed), a, b, impact, kept.index(impact), cw, ch, AW, AH, AW * AH * 4 / 1048576), fill=(235, 210, 150))
    for k, (i, c, _, _) in enumerate(placed):
        ox, oy = (k % cols) * tw, 28 + (k // cols) * (th + 20)
        t = c.resize((tw, th), Image.LANCZOS); sheet.paste(t, (ox, oy + 20)); td = ImageDraw.Draw(sheet)
        ax, ay = ox + anchor["x"] * tw / cw, oy + 20 + anchor["y"] * th / ch; td.ellipse([ax - 3, ay - 3, ax + 3, ay + 3], outline=(80, 200, 255))
        td.text((ox + 4, oy + 4), "f%03d%s" % (i, "  ★ IMPACT" if i == impact else ""), fill=(255, 120, 120) if i == impact else (255, 220, 120))
    os.makedirs(os.path.join(LAB, "frames"), exist_ok=True); sheet.save(os.path.join(LAB, "frames", key + "_effect_sheet.jpg"), quality=88)

    print("clip %d frames @ %.0f fps · %dx%d · ground: corners max %d, >300 px from content max %d" % (N, fps, W, H, corners, far))
    print("kept f%03d–f%03d (%d cells) · impact f%03d (change %.2f, cell %d) at %s · ring on f%03d %d px across" % (a, b, len(kept), impact, change[impact], kept.index(impact), IMP, C["scale_frame"], ring_d))
    print("box x %d–%d y %d–%d = %dx%d · edges touched: top %d, bottom %d, sides %d of %d frames" % (x0, x1, y0, y1, bw, bh, top_cut, bot_cut, side_cut, len(kept)))
    print("feathers: top %d px · bottom %d px (asked %d; ring body lowest y %d on f%03d across f%03d–f%03d, room %d; the body grows into the band only in the fade tail: %s) · fade-in %s · fade tail %s" % (
        ft, fb, C["feather_bottom"], ring_low, ring_low_at, guard_frames[0], guard_frames[-1], room, [["f%03d" % i, fades[i]] for i in into], [fades[i] for i in kept[:n_in]], [fades[i] for i in kept[-n_tail:]]))
    print("atlas %dx%d · %.1f KB · decoded %.2f MB · cells %dx%d · anchor %s" % (AW, AH, os.path.getsize(os.path.join(out, "atlas.webp")) / 1024, AW * AH * 4 / 1048576, cw, ch, anchor))

if __name__ == "__main__":
    k = sys.argv[1] if len(sys.argv) > 1 else "vajra"
    kind = EFFECTS.get(k, {}).get("kind")
    main_chain(k) if kind == "chain" else main_chain_clip(k) if kind == "chain-clip" else main(k)
