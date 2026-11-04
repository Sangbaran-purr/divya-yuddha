#!/usr/bin/env python3
"""ARCADE-1 · THE HD FIGHTER SETS (enhancement test).   Run with the matting venv:
      lab/vfx-manifestation/tools/.venv/bin/python -I lab/arcade/tools/make_fighter_hd.py [indra meghnad]

The same four clips as the clip test, cut again for the owner's "too basic, too small" review:
  • STANCE 512 px on the hi sheet, 320 on the lo (the 12 fps baseline stays at 320 / 192, untouched, in fighters/<hero>/)
  • fighters/<hero>/f24/ — every source frame (24 fps)
  • fighters/<hero>/f48/ — 48 fps: the in-between frames made OFFLINE by optical-flow interpolation (never at runtime)
  • multi-page sheets: a set is split into pages of at most 4096 px (hi) / 2048 px (lo) square

THE INTERPOLATOR (not RIFE — RIFE needs a model download, which was not made without the owner's say-so): OpenCV DIS optical
flow both ways between two matted frames, the in-between flows estimated the Super SloMo way (F_t→0 = −t(1−t)F01 + t²F10,
F_t→1 = (1−t)²F01 − t(1−t)F10), both frames warped there and blended (1−t, t) — on PREMULTIPLIED colour and alpha, so the
matte edge travels with the figure. The audit is objective: re-make a REAL frame from its two neighbours and measure the
error against it, on the whole figure and on the weapon end alone — for the slow idle and for the light's fastest frames.

THE LIGHT AT 24 / 48 fps: the game plays the light in 17 logic frames (19 for Meghnad's reach), so the clip is TIME-MAPPED onto
the phases — startup = wind-up → contact, active = the contact hold, recovery = hold end → back in stance — and each phase gets
round(frames × fps / 60) cells, each the NEAREST REAL source frame — never interpolated: the audit shows a fast strike ghosts
(a doubled weapon, a smeared hand) when made from its neighbours, and the time-compressed clip has real frames to spare. Only the
idle (real time, slow motion) is interpolated, where the audit error is a few levels in 255.
"""
import os, sys, json, math
import numpy as np, cv2
from PIL import Image, ImageDraw
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import make_fighter as MF

ARC = MF.ARC
STANCE = {"hi": 512, "lo": 320}
PAGE = {"hi": 4096, "lo": 2048}
QUAL = {"hi": 80, "lo": 78}
LIGHT = {"indra": {"startup": 5, "active": 3, "recovery": 9}, "meghnad": {"startup": 5, "active": 3, "recovery": 11}}   # moves.js + the reach archetype's +2
SCREENS = MF.SCREENS
DIS = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)

def to_rgba(m):   # a matte (alpha float, fg float) → straight RGBA uint8, kept compact
    a, fg = m[0], m[1]
    return np.dstack([np.clip(fg, 0, 255), np.clip(a * 255, 0, 255)]).astype(np.uint8)

def from_rgba(r):
    return r[..., 3].astype(np.float32) / 255.0, r[..., :3].astype(np.float32)

def grey(r):      # the frame composited on mid-grey, for flow (alpha edges carry signal)
    a = r[..., 3:4].astype(np.float32) / 255.0
    return cv2.cvtColor((r[..., :3] * a + 128 * (1 - a)).astype(np.uint8), cv2.COLOR_RGB2GRAY)

def warp(img, flow):
    h, w = flow.shape[:2]
    gx, gy = np.meshgrid(np.arange(w, dtype=np.float32), np.arange(h, dtype=np.float32))
    return cv2.remap(img, gx + flow[..., 0], gy + flow[..., 1], cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)

def interp(r0, r1, t, box):
    """the frame at t ∈ (0,1) between straight-RGBA frames r0 and r1, worked inside box (y0,y1,x0,x1) for speed"""
    y0, y1, x0, x1 = box
    A, B = r0[y0:y1, x0:x1], r1[y0:y1, x0:x1]
    f01 = DIS.calc(grey(A), grey(B), None); f10 = DIS.calc(grey(B), grey(A), None)
    ft0 = -t * (1 - t) * f01 + t * t * f10
    ft1 = (1 - t) ** 2 * f01 - t * (1 - t) * f10
    def pm(x): a = x[..., 3:4].astype(np.float32) / 255.0; return np.dstack([x[..., :3].astype(np.float32) * a, a * 255.0])
    w0, w1 = warp(pm(A), ft0), warp(pm(B), ft1)
    blend = (1 - t) * w0 + t * w1
    a = blend[..., 3] / 255.0
    rgb = np.where(a[..., None] > 1e-3, blend[..., :3] / np.maximum(a[..., None], 1e-3), 0)
    out = np.zeros_like(r0); out[y0:y1, x0:x1] = np.dstack([np.clip(rgb, 0, 255), np.clip(a * 255, 0, 255)]).astype(np.uint8)
    return out

def union_box(frames, pad=40):
    ys, xs = [], []
    for r in frames:
        yy, xx = np.where(r[..., 3] > 8)
        if len(yy): ys += [yy.min(), yy.max()]; xs += [xx.min(), xx.max()]
    h, w = frames[0].shape[:2]
    return max(0, min(ys) - pad), min(h, max(ys) + pad), max(0, min(xs) - pad), min(w, max(xs) + pad)

def audit_interp(frames, idxs, box, weapon_cols):
    """re-make real frame i from i−1 and i+1; mean |Δ| (0–255, premultiplied RGB + alpha) over the figure, and over the weapon end"""
    out = []
    for i in idxs:
        fake = interp(frames[i - 1], frames[i + 1], 0.5, box)
        real = frames[i]
        def pm(x): a = x[..., 3:4].astype(np.float32) / 255.0; return np.dstack([x[..., :3].astype(np.float32) * a, a * 255.0])
        d = np.abs(pm(fake) - pm(real)).mean(axis=2)
        fig = (real[..., 3] > 20) | (fake[..., 3] > 20)
        wcol = np.zeros_like(fig); wcol[:, weapon_cols(real):] = True
        out.append({"frame": int(i), "figure": round(float(d[fig].mean()), 2), "weapon": round(float(d[fig & wcol].mean()) if (fig & wcol).any() else 0.0, 2),
                    "fake": fake, "real": real})
    return out

def cells_for(rgbas, fps, L, light_frames, curve, phases_frames):
    """the (move, phase, source position) list for one fps; positions are floats into the source clip"""
    plan = []
    # idle: the loop, real time
    n_idle = L * fps // 24
    for k in range(n_idle): plan.append(("idle", None, k * 24.0 / fps))
    w, c, h, b = curve["windup"], curve["contact"], curve["holdEnd"], curve["back"]
    for ph in ("startup", "active", "recovery"):
        n = max(1, round(phases_frames[ph] * fps / 60))
        for k in range(n):
            if ph == "startup": p = w + (c - w) * k / n
            elif ph == "active": p = c + k * min(1.0, (h - c) / max(1, n))
            else: p = h + (b - h) * (k + 1) / n
            plan.append(("light", ph, p))
    return plan

def pack_pages(cells, maxw):
    pages, rects, cur, x, y, shelf = [], [], [], 0, 0, 0
    for i, c in enumerate(cells):
        h, w = c.shape[:2]
        if x + w + 2 > maxw: x = 0; y += shelf + 2; shelf = 0
        if y + h > maxw:   # page full
            pages.append(cur); cur = []; x = y = shelf = 0
        rects.append((len(pages), x, y, w, h)); cur.append(i); x += w + 2; shelf = max(shelf, h)
    pages.append(cur)
    sheets = []
    for p, idxs in enumerate(pages):
        rs = [rects[i] for i in idxs]
        W = max(r[1] + r[3] for r in rs); H = max(r[2] + r[4] for r in rs)
        s = np.zeros((H, W, 4), np.uint8)
        for i, r in zip(idxs, rs): s[r[2]:r[2] + r[4], r[1]:r[1] + r[3]] = cells[i]
        sheets.append(s)
    return sheets, rects

def build(hero):
    H = MF.HEROES[hero]; src = os.path.join(ARC, "sources", hero)
    print("── %s (HD) ──" % H["name"])
    fi, _ = MF.decode(os.path.join(src, H["clips"]["idle"])); Ki = MF.ground_colour(fi[0])
    fl, _ = MF.decode(os.path.join(src, H["clips"]["light"])); Kl = MF.ground_colour(fl[0])
    class Lazy:   # the mattes as (alpha, fg) on demand, from the compact RGBA frames
        def __init__(self, rs): self.rs = rs
        def __len__(self): return len(self.rs)
        def __getitem__(self, i): return from_rgba(self.rs[i])
        def __iter__(self): return (from_rgba(r) for r in self.rs)
    idle_r = [to_rgba(MF.matte(f, Ki)) for f in fi]; L, errs = MF.tightest_loop(Lazy(idle_r))
    light_r = [to_rgba(MF.matte(f, Kl)) for f in fl]; fronts = [MF.front_x(r[..., 3].astype(np.float32) / 255.0) for r in light_r]
    phases, curve = MF.pick_light(fronts, fronts[0])
    look = list(range(curve["contact"], min(curve["contact"] + MF.CONTACT_LOOK, curve["holdEnd"]) + 1))
    curve["contact"] = int(max(look, key=lambda i: MF.sharpness(fl[i], light_r[i][..., 3].astype(np.float32) / 255.0)))
    del fl, fi
    a0, _ = from_rgba(idle_r[0]); gy, fx = MF.feet(a0); top = MF.head_top(a0, fx); stance_src = gy - top
    box_i, box_l = union_box(idle_r[:L + 1]), union_box(light_r)
    weapon_cols = lambda r: max(0, np.where((r[..., 3] > 127).any(axis=0))[0].max() - 120)
    print("  idle loop %d frames · light wind-up f%d → contact f%d → hold to f%d → back f%d · stance %d px source" % (L, curve["windup"], curve["contact"], curve["holdEnd"], curve["back"], stance_src))

    # ── the interpolation audit: re-make real frames from their neighbours ──
    idle_test = list(range(4, L - 1, max(1, L // 8)))[:8]
    fast = sorted(set([curve["windup"] + 2, (curve["windup"] + curve["contact"]) // 2, curve["contact"] - 1, curve["holdEnd"] + 2, (curve["holdEnd"] + curve["back"]) // 2]))
    ai = audit_interp(idle_r, idle_test, box_i, weapon_cols)
    al = audit_interp(light_r, fast, box_l, weapon_cols)
    rep = {"idle": [{k: v for k, v in x.items() if k in ("frame", "figure", "weapon")} for x in ai],
           "lightFast": [{k: v for k, v in x.items() if k in ("frame", "figure", "weapon")} for x in al]}
    print("  interpolation audit (mean |Δ| 0–255 vs the real frame it re-makes): idle figure %s · weapon %s" % ([x["figure"] for x in rep["idle"]], [x["weapon"] for x in rep["idle"]]))
    print("                                                         light fast  figure %s · weapon %s" % ([x["figure"] for x in rep["lightFast"]], [x["weapon"] for x in rep["lightFast"]]))
    # the owner's crops: real vs interpolated, at the worst light frame, around the weapon end and the hands
    worst = max(al, key=lambda x: x["weapon"])
    real, fake = worst["real"], worst["fake"]
    yy, xx = np.where(real[..., 3] > 127); tipx = xx.max(); tipy = int(yy[xx.argmax()])
    def crop(r): return r[max(0, tipy - 130): tipy + 130, max(0, tipx - 420): tipx + 40]
    MF.crops_sheet(os.path.join(SCREENS, "%s_interp_artefacts.jpg" % hero), "%s · INTERPOLATION ARTEFACTS at the worst fast frame f%03d (weapon end): the REAL frame vs the one re-made from f%03d + f%03d (left dark, right light ground)" % (H["name"], worst["frame"], worst["frame"] - 1, worst["frame"] + 1),
                   [("real f%03d" % worst["frame"], crop(real)), ("interpolated", crop(fake))])

    out_all = {}
    for fps in (24, 48):
        plan = cells_for(None, fps, L, None, curve, LIGHT[hero])
        frames, made = [], 0
        for move, ph, p in plan:
            seq = idle_r if move == "idle" else light_r
            lo = int(math.floor(p)); t = p - lo
            if move == "idle": lo %= L
            if move == "light": fr = seq[min(len(seq) - 1, int(round(p)))]   # the audit's verdict: a fast strike ghosts and smears when
            #   interpolated (doubled weapon, smeared hand), and the time-compressed clip has real frames to spare — the light is never interpolated
            elif t < 0.25: fr = seq[lo]
            elif t > 0.75: fr = seq[(lo + 1) % (L if move == "idle" else len(seq))]
            else: fr = interp(seq[lo], seq[(lo + 1) % (L if move == "idle" else len(seq))], t, box_i if move == "idle" else box_l); made += 1
            frames.append(fr)
        dst = os.path.join(ARC, "fighters", hero, "f%d" % fps); os.makedirs(dst, exist_ok=True)
        man = {"hero": hero, "name": H["name"], "class": "fighter", "version": 2, "facing": "right", "alpha": "straight", "fpsOut": fps,
               "stance": {"heightPx": dict(STANCE), "sourceHeight": int(stance_src), "pivotSource": [round(float(fx), 1), int(gy)]},
               "interpolated": made, "interpolator": "OpenCV DIS optical flow (medium) both ways, Super-SloMo intermediate flows, premultiplied warp + blend; offline",
               "moves": {"idle": {"loop": True, "loopFrames": int(L)}, "light": {"curve": {k: v for k, v in curve.items() if not isinstance(v, (dict, list))}, "logicFrames": LIGHT[hero]}},
               "plan": [[m, ph, round(p, 3)] for m, ph, p in plan], "interpAudit": rep, "rungs": {}}
        for rung in ("hi", "lo"):
            sc = STANCE[rung] / stance_src
            cells, piv = [], []
            for fr in frames:
                a, fg = from_rgba(fr); c, px, py = MF.cut_cell(a, fg, sc, (fx, gy)); cells.append(c); piv.append((px, py))
            sheets, rects = pack_pages(cells, PAGE[rung])
            files, bytes_, decoded = [], 0, 0
            for p, s in enumerate(sheets):
                fn = "%s_%d.webp" % (rung, p); Image.fromarray(s, "RGBA").save(os.path.join(dst, fn), "WEBP", quality=QUAL[rung], method=6)
                files.append({"sheet": fn, "size": [int(s.shape[1]), int(s.shape[0])], "bytes": os.path.getsize(os.path.join(dst, fn))})
                bytes_ += files[-1]["bytes"]; decoded += s.shape[0] * s.shape[1] * 4
            man["rungs"][rung] = {"pages": files, "bytes": bytes_, "decodedBytes": decoded,
                                  "cells": [{"move": m, "phase": ph, "page": int(r[0]), "x": int(r[1]), "y": int(r[2]), "w": int(r[3]), "h": int(r[4]), "px": pv[0], "py": pv[1]} for (m, ph, _), r, pv in zip(plan, rects, piv)]}
            print("  f%d %s: %d cells (%d interpolated) on %d page(s) %s · %.2f MB download · %.0f MB decoded" % (fps, rung, len(cells), made, len(sheets), [f["size"] for f in files], bytes_ / 1048576, decoded / 1048576))
        idx = {"idle": [k for k, (m, _, _) in enumerate(plan) if m == "idle"]}
        idx["light"] = {ph: [k for k, (m, q, _) in enumerate(plan) if m == "light" and q == ph] for ph in ("startup", "active", "recovery")}
        man["cellIndex"] = idx
        with open(os.path.join(dst, "manifest.json"), "w") as f: json.dump(man, f, indent=1)
        out_all[fps] = man
    return out_all

if __name__ == "__main__":
    os.makedirs(SCREENS, exist_ok=True)
    for h in (sys.argv[1:] or list(MF.HEROES)): build(h)
