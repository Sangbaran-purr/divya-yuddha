#!/usr/bin/env python3
# tools/make_actor_from_clip.py — VFX-LAB-4. A Kling performance on a flat chroma ground (green, blue — any key colour, LAB-7) → an ACTOR (ruling A4):
# matted with real alpha, trimmed rectangular cells at 512 px with one ground pivot, WebP with alpha, NO motion vectors.
#
#   lab/vfx-manifestation/tools/.venv/bin/python lab/vfx-manifestation/tools/make_actor_from_clip.py [card]      (meghnad · indra)
#
# LAB-6 · THE TEMPLATE: every card is one entry in CARDS below — its clip, its audited frame ranges, its matte, its contact rule,
# its pivot rule, its facing and aim. The phase lengths come from the frame ranges at the owner's tuned pace (MS_PER_SRC: the seconds
# per source frame Meghnad's EMERGE and ACT were tuned at), so a new card needs no new numbers. A card without "tempo" inherits the
# registry's defaults (data/manifestations.json). Two mattes: "dark-body" (Meghnad: a dark rider and horse, bright lightning cut off
# the figure) and "bright" (Indra: a white-and-gold figure whose bolt IS the action — see key_bright). Contact rules: "spear-tip" (the
# leftmost solid spear tip), "bolt-edge" (the frame after the bolt first reaches the frame's edge) and "ground-impact" (LAB-7: the
# frame the weapon reaches the ground band clear of the standing feet). THE KEY COLOUR (LAB-7): auto-detected from the frame's corners
# (the ground's strongest channel is the key — green, blue, …), or pinned per card with "key_colour": [r, g, b]. "engine_id" names the
# card's id in the engine when it differs from the card's name (Bali is "hanuman"). "travel_scale": 0-1 scales the charge across the board
# (LAB-10: 0 keeps the actor where it stands; absent means 1). Pivot rules: "front-left" (the
# horse's front hooves) and "feet" (the centre of the ground contact).
# LAB-8 · Varuna, the first NATIVE EXIT: "contact": ("nova", f) names the audited frame the burst begins (the stage flashes radially from
# the actor's centre); "exit": "native" packs no fizzle phase — ACT runs to the clip's end — and "fade_tail": n bakes a linear alpha ramp
# (100% → 0%) into the last n cells so the clip's own exit dissipates instead of popping. The atlas levers, in the owner's order, when a
# pack is over the 4096 px ceiling: "thin_alternate": (a, b) drops every other frame in fa–fb; "cell_px": N packs cells below the 512 px
# ceiling (the manifest keeps cellMax 512 and records cellPx).
# LAB-9: "feather_bottom": px fades the clip's BOTTOM edge only, where fire pools on the frame's cut edge (Agni, Mahabali). The band is
# GUARDED: the character's core (its largest solid part — feet, throne base) must never enter it, measured over every frame up to contact,
# and the band is narrowed to fit if it would. "contact_strength": {"flash": f, "impulse": i} scales the stage's contact flash and camera
# impulse for a card whose action is a self-cast, not a strike (Shukracharya: half flash, no impulse); absent means 1 and 1.
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

# LAB-6 · THE TEMPLATE
MS_PER_SRC = {"emerge": 583 / 23, "act": 1208 / 32}   # the owner-tuned pace (LAB-4d): Meghnad's EMERGE 583 ms over f34–f56, ACT 1208 ms over f57–f88
RESCUE_R = 10                        # px (source) — "bright" matte: thin light next to solid matter keeps the alpha its colour un-mixes to
SPECK = 150                          # px (source) — "bright" matte: an isolated fleck smaller than this, off the figure, is sparkle or noise
CARDS = {
    "meghnad": {"label": "Meghnad", "clip": "kling_20260913_VIDEO_Create_a_p_5011_0.mp4", "emerge": (34, 56), "act": (57, 88), "tempo": 0.6,
                "matte": "dark-body", "key": (28.0, 85.0), "contact": ("spear-tip", (66, 82)), "settled": 84, "pivot": "front-left",
                "facing": "left", "aim": None, "feather": 0},
    "indra":   {"label": "Indra", "clip": "kling_20260914_VIDEO_Preserve_I_5205_0.mp4", "emerge": (36, 52), "act": (53, 120), "tempo": None,   # LAB-10: the clip's own gold-dust ending, restored
                "matte": "bright", "key": (10.0, 45.0), "contact": ("bolt-edge", (53, 60)), "settled": 70, "pivot": "feet",
                "facing": "right", "aim": "up", "feather": 8, "exit": "native", "fade_tail": 10, "travel_scale": 0},
    "bali":    {"label": "Bali", "clip": "kling_20260914_VIDEO_Preserve_B_5645_0.mp4", "emerge": (28, 56), "act": (57, 109), "tempo": None,   # LAB-10: the earth exit, stopped at f109 to leave out the clip's green blob (f110-f120)
                "matte": "bright", "key": (10.0, 45.0), "contact": ("ground-impact", (57, 72)), "settled": 28, "pivot": "feet",
                "facing": "left", "aim": None, "feather": 8, "engine_id": "hanuman", "exit": "native", "fade_tail": 10, "travel_scale": 0},
    "varuna":  {"label": "Varuna", "clip": "varuna/varuna_green.mp4", "emerge": (0, 85), "act": (86, 120), "tempo": None,
                "matte": "bright", "key": (10.0, 45.0), "contact": ("nova", 86), "settled": 0, "pivot": "feet",
                "facing": "right", "aim": None, "feather": 8, "engine_id": "varuna",
                "exit": "native", "fade_tail": 10, "cell_px": 512, "thin_alternate": None},
    "agni":    {"label": "Agni", "clip": "agni/agni_green.mp4", "emerge": (0, 85), "act": (86, 120), "tempo": None,   # LAB-9 owner ruling: ACT starts as the ring collapses, so a 30 Hz device at tempo 1 keeps to the LAB-8 bound
                "matte": "bright", "key": (10.0, 45.0), "contact": ("nova", 98), "settled": 0, "pivot": "feet",
                "facing": "left", "aim": None, "feather": 8, "feather_bottom": 24, "engine_id": "agni",
                "exit": "native", "fade_tail": 10, "cell_px": 384, "thin_alternate": None},
    "mahabali": {"label": "Mahabali", "clip": "mahabali/mahabali_green.mp4", "emerge": (0, 93), "act": (94, 120), "tempo": None,
                "matte": "bright", "key": (10.0, 45.0), "contact": ("nova", 96), "settled": 0, "pivot": "feet",
                "facing": "right", "aim": None, "feather": 8, "feather_bottom": 24, "engine_id": "mahabali",
                "exit": "native", "fade_tail": 10, "cell_px": 512, "thin_alternate": None},
    "shukracharya": {"label": "Shukracharya", "clip": "shukracharya/shukracharya_green.mp4", "emerge": (0, 63), "act": (64, 120), "tempo": None,
                "matte": "bright", "key": (10.0, 45.0), "contact": ("nova", 64), "settled": 0, "pivot": "feet",
                "facing": "left", "aim": None, "feather": 8, "engine_id": "shukra",
                "exit": "native", "fade_tail": 10, "cell_px": 448, "thin_alternate": (100, 120),
                "contact_strength": {"flash": 0.5, "impulse": 0}},
    "mahishi": {"label": "Mahishi", "clip": "mahishi/mahishi_green.mp4", "emerge": (33, 55), "act": (56, 115), "tempo": None,   # LAB-11: the idle f000-f032 dropped (no idle padding: AWAKEN is the anticipation); stopped at f115, past which the red powder is gone and only khaki ground residue is left
                "matte": "bright", "key": (10.0, 45.0), "contact": ("nova", 56), "settled": 36, "pivot": "feet",
                "facing": "left", "aim": None, "feather": 8, "feather_bottom": 12, "engine_id": "mahishi",
                "exit": "native", "fade_tail": 10, "cell_px": 448, "thin_alternate": None},
    "vritra":  {"label": "Vritra", "clip": "vritra/vritra_green.mp4", "emerge": (0, 71), "act": (72, 112), "tempo": None,   # LAB-11: ACT opens on the top of the rear (the roar IS the strike); stopped at f112, past which the drifting chunks carry ground halos
                "matte": "bright", "key": (10.0, 45.0), "contact": ("nova", 72), "settled": 0, "pivot": "feet",
                "facing": "left", "aim": None, "feather": 8, "feather_bottom": 16, "engine_id": "vritra",
                "exit": "native", "fade_tail": 10, "cell_px": 448, "thin_alternate": None},
    "garuda":  {"label": "Garuda", "clip": "garuda/garuda_green.mp4", "emerge": (0, 39), "act": (40, 116), "tempo": None,   # LAB-12: ACT opens on the wing snap; only the empty frames f117-f120 are dropped - his dust tail is clean
                "matte": "bright", "key": (10.0, 45.0), "contact": ("nova", 41), "settled": 0, "pivot": "feet",
                "facing": "left", "aim": None, "feather": 8, "engine_id": "garuda",
                "exit": "native", "fade_tail": 10, "cell_px": 448, "thin_alternate": None},
    "kartikeya": {"label": "Kartikeya", "clip": "kartikeya/kartikeya_magenta.mp4", "emerge": (0, 44), "act": (45, 102), "tempo": None,   # LAB-13: the first MAGENTA ground, keyed by the R+B pair; stopped at f102, past which his translucent dissolve un-mixes to pink ground residue
                "matte": "bright", "key": (10.0, 45.0), "contact": ("bolt-edge", (44, 64)), "settled": 0, "pivot": "feet",
                "facing": "right", "aim": None, "feather": 8, "engine_id": "kartikeya", "travel_scale": 0,   # LAB-13a: the Vel throws, the god stands. bolt-edge does NOT imply travel - travel is per-card data, and LAB-13 simply never set it
                "exit": "native", "fade_tail": 10, "cell_px": 384, "thin_alternate": None},   # LAB-13: 448 was ruled, but at 448 his 256 rung packs to 27.3% of the 512 rung and fails the A5 quarter-rung invariant; 384 packs to 25.4% and costs 8.0 MB on the low rung, the least of any card

    # LAB-14 · the first NAGA actors. All three sit on coils, so "feet" resolves to the COIL BASE (the Vritra reading); all three
    # exit natively, so the Naga dissolve preset stays untuned and unexercised (the M15 note now covers Deva and Naga alike).
    "vasuki":  {"label": "Vasuki", "clip": "vasuki/vasuki_magenta.mp4", "emerge": (0, 44), "act": (45, 120), "tempo": None,   # the ring pulse is born at f045; his closing teal cloud is genuine, not residue, so nothing is trimmed and the fade tail carries it
                "matte": "bright", "key": (10.0, 45.0), "contact": ("nova", 45), "settled": 0, "pivot": "feet",
                "facing": "right", "aim": None, "feather": 8, "engine_id": "vasuki",
                "exit": "native", "fade_tail": 10, "cell_px": 384, "thin_alternate": None},
    "takshaka": {"label": "Takshaka", "clip": "takshaka/takshaka_magenta.mp4", "emerge": (0, 54), "act": (55, 110), "tempo": None,   # stopped at f110: past it his specks are increasingly ground, the Kartikeya pink-residue class
                "matte": "bright", "key": (10.0, 45.0), "contact": ("nova", 56), "settled": 0, "pivot": "feet",
                "facing": "left", "aim": None, "feather": 8, "feather_bottom": 16, "engine_id": "takshaka",
                "exit": "native", "fade_tail": 10, "cell_px": 384, "thin_alternate": None},
    "shesha":  {"label": "Shesha", "clip": "shesha/shesha_magenta.mp4", "emerge": (0, 44), "act": (45, 113), "tempo": None,   # nothing in his clip strikes: the flash rides the radiance at its fullest (f078), softened like Shukracharya
                "matte": "bright", "key": (10.0, 45.0), "contact": ("nova", 78), "settled": 0, "pivot": "feet",
                "facing": "right", "aim": None, "feather": 8, "engine_id": "shesha",
                "exit": "native", "fade_tail": 10, "cell_px": 384, "thin_alternate": None,
                "contact_strength": {"flash": 0.5, "impulse": 0}},
    # LAB-15 · two Wave-1 Nagas. PADMAVATI is the lab's first card below 384: her box is COMPACT (hood-tall, never frame-wide),
    # and a small box forces a LARGER scale, so every cell is denser — box compactness drives atlas cost, not character size.
    "padmavati": {"label": "Padmavati", "clip": "padmavati/padmavati_magenta.mp4", "emerge": (0, 49), "act": (50, 110), "tempo": None,
                "matte": "bright", "key": (10.0, 45.0), "contact": ("nova", 76), "settled": 0, "pivot": "feet",
                "facing": "right", "aim": None, "feather": 8, "feather_bottom": 12, "engine_id": "padmavati",
                "exit": "native", "fade_tail": 10, "cell_px": 320, "thin_alternate": None,
                "contact_strength": {"flash": 0.5, "impulse": 0}},
    "kulika":  {"label": "Kulika", "clip": "kulika/kulika_magenta.mp4", "emerge": (0, 69), "act": (70, 104), "tempo": None,   # her burst IS her exit: ACT opens where the orb collapses to a wisp and the ignition lands mid-ACT
                "matte": "bright", "key": (10.0, 45.0), "contact": ("nova", 87), "settled": 0, "pivot": "feet",
                "facing": "left", "aim": None, "feather": 8, "feather_bottom": 8, "engine_id": "kulika",
                "exit": "native", "fade_tail": 10, "cell_px": 448, "thin_alternate": None},
    # LAB-16 · the first Vanara actors since the pilot wave. Their dissolves are TAN-GOLD DUST, which the source ground-share metric
    # cannot see (tan has B < G, so no source pixel is ground-dominant) — the trims were set on the OUTPUT pink cast as well.
    "sugriva": {"label": "Sugriva", "clip": "sugriva/sugriva_magenta.mp4", "emerge": (0, 51), "act": (52, 110), "tempo": None,   # the SLAM is his contact, not the sweep: the sweep has no clean onset
                "matte": "bright", "key": (10.0, 45.0), "contact": ("nova", 56), "settled": 0, "pivot": "feet",
                "facing": "right", "aim": None, "feather": 8, "feather_bottom": 16, "engine_id": "sugriva",
                "exit": "native", "fade_tail": 10, "cell_px": 448, "thin_alternate": None},
    "angad":   {"label": "Angad", "clip": "angad/angad_magenta.mp4", "emerge": (0, 47), "act": (48, 104), "tempo": None,   # no bottom feather: his core touches the bottom edge at f039, so the all-frames guard can never pass one
                "matte": "bright", "key": (10.0, 45.0), "contact": ("nova", 53), "settled": 0, "pivot": "feet",
                "facing": "left", "aim": None, "feather": 8, "engine_id": "angad",
                "exit": "native", "fade_tail": 10, "cell_px": 448, "thin_alternate": None},
    # LAB-17 · two Wave-1 Vanaras. ANJANA touches no frame edge in any frame — the first card that needs no feather at all.
    "anjana":  {"label": "Anjana", "clip": "anjana/anjana_magenta.mp4", "emerge": (0, 47), "act": (48, 105), "tempo": None,   # a SOFT cast: the nova rides the ribbon at its fullest (f085), five frames before the gold exit glow ignites at f090
                "matte": "bright", "key": (10.0, 45.0), "contact": ("nova", 85), "settled": 0, "pivot": "feet",
                "facing": "right", "aim": None, "feather": 8, "engine_id": "anjana",
                "exit": "native", "fade_tail": 10, "cell_px": 384, "thin_alternate": None,
                "contact_strength": {"flash": 0.5, "impulse": 0}},
    # MAKARDHWAJA is the first GROUND-IMPACT card since Bali, and inherits both of Bali's conditions. Its search window (56, 70) keeps
    # the rule out of his airborne frames: unwindowed it fires at f040, where his TAIL sweeps low through the ground band mid-leap —
    # and his wide lunge leaves only ONE foot within 14 px of the ground line, so the feet exclusion covers 16% of the width. And
    # ground-impact is not nova, so the nova zero-travel case does not cover him: travel_scale 0 is stated here (the LAB-13a trap).
    "makardhwaja": {"label": "Makardhwaja", "clip": "makardhwaja/makardhwaja_magenta.mp4", "emerge": (0, 54), "act": (55, 106), "tempo": None,
                "matte": "bright", "key": (10.0, 45.0), "contact": ("ground-impact", (56, 70)), "settled": 0, "pivot": "feet",
                "facing": "left", "aim": None, "feather": 8, "engine_id": "makardhwaja", "travel_scale": 0,
                "exit": "native", "fade_tail": 10, "cell_px": 352, "thin_alternate": None},   # LAB-17: 320 was ruled, but at 320 his 256 rung packs to 25.532% of the 512 rung and fails the M21 quarter-rung invariant by 35,269 B; 288, 352 and 384 all pass, and 352 is the nearest to the ruling, still sub-384, at 8.3 MB
    # LAB-18 · RAHU, the last card of the roster — a severed floating head, black smoke matter, on the batch's one GREEN key (single channel,
    # after nine pair keys). The BRIGHT matte: the numbers tie with dark-body on all three risks (green cast in translucent smoke, despill on
    # near-black, corona hue), but dark-body gaps his corona at f076 and fringes the smoke red. PIVOT READING FOUR: the ordinary feet rule on
    # f000 lands on his lowest smoke tendril, so the smoke is the tether on the ground line and the head hangs above it (no knob — Garuda).
    # The most static clip in the lab (picture change under 0.8 through f024–f060) and no ignition: a SOFT nova at the glow's fullest, f044.
    # He touches no frame edge (the second card, after Anjana). His dissolve is near-black: the source ground share crosses 20% at f090.
    "rahu":    {"label": "Rahu", "clip": "rahu/rahu_green.mp4", "emerge": (0, 31), "act": (32, 92), "tempo": None,
                "matte": "bright", "key": (10.0, 45.0), "contact": ("nova", 44), "settled": 0, "pivot": "feet",
                "facing": "right", "aim": None, "feather": 8, "engine_id": "rahu",
                "exit": "native", "fade_tail": 10, "cell_px": 384, "thin_alternate": None,
                "contact_strength": {"flash": 0.5, "impulse": 0},
                "keep_duplicates": True},   # LAB-18 ruling: his shimmer moves below DUP_MAE on 29 GENUINE frames (f001–f057 odd: change inside a dropped pair 0.37–0.54 matches between pairs 0.36–0.57), so the duplicate rule's premise fails — calling them duplicates would make the manifest false and halve the static head against the dissolve
}
CFG = None
def configure(card):
    global CARD, CLIP, OUT, AUDIT, SHEET, EMERGE_RANGE, ACT_RANGE, PHASE_MS, TEMPO, CONTACT_SEARCH, SETTLED_FRAME, KEY_T0, KEY_T1, CFG, CELL_MAX
    if card not in CARDS: sys.exit("unknown card %r — one of %s" % (card, ", ".join(CARDS)))
    CFG = CARDS[card]; CARD = card
    CLIP = os.path.join(LAB, "sources", CFG["clip"])
    OUT = os.path.join(LAB, "actors", CARD); AUDIT = os.path.join(LAB, "frames", CARD); SHEET = os.path.join(LAB, "frames", CARD + "_contact_sheet.jpg")
    EMERGE_RANGE, ACT_RANGE = CFG["emerge"], CFG["act"]
    PHASE_MS = {k: int(round((CFG[k][1] - CFG[k][0] + 1) * MS_PER_SRC[k])) for k in ("emerge", "act")}
    CELL_MAX = CFG.get("cell_px") or 512
    TEMPO = CFG["tempo"]; CONTACT_SEARCH = CFG["contact"][1]; SETTLED_FRAME = CFG["settled"]; KEY_T0, KEY_T1 = CFG["key"]

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

def key_channels(K):
    # LAB-7: the key is the ground's strongest channel (1 on green, 2 on blue, …) and the other two, in order
    kc = int(np.argmax(K)); o = [c for c in (0, 1, 2) if c != kc]
    return kc, o[0], o[1]

PAIR_NAME = {(0, 1): "yellow", (0, 2): "magenta", (1, 2): "cyan"}
def key_axes(K):
    # LAB-13: a chroma ground is keyed either by ONE channel (green, blue — the ground's strongest, LAB-7) or by a PAIR of
    # channels that together oppose the third (magenta = R and B against G). argmax alone cannot tell them apart: on magenta
    # (243, 6, 240) it picks R, and "R - max(G, B)" is 243 - 240 = 3, so the ground reads as LESS key-coloured than the figure
    # and the matte comes out inverted. The pair is read off the sorted ground: the top two close, the third far below.
    order = [int(c) for c in np.argsort(K)[::-1]]; hi, mid, lo = [float(K[c]) for c in order]
    if (hi - mid) < 0.25 * (mid - lo): return "pair", tuple(sorted(order[:2])), int(order[2])
    return "single", (int(order[0]),), tuple(sorted(order[1:]))

def chroma_label(K):
    kind, keys, _ = key_axes(K)
    return PAIR_NAME[keys] if kind == "pair" else {0: "red", 1: "green", 2: "blue"}[keys[0]]

def key_tag(K):
    # what the manifest records: "G", "B" for a single channel, "RB" for a magenta pair
    return "".join("RGB"[c] for c in key_axes(K)[1])

def key(rgb, K):
    if key_axes(K)[0] == "pair": sys.exit("the dark-body matte is single-channel only; this ground is a %s pair key — use matte \"bright\"" % chroma_label(K))
    kc, o1, o2 = key_channels(K)
    a = rgb.astype(np.float32)
    dom = a[..., kc] - np.maximum(a[..., o1], a[..., o2])                   # key dominance (on green: G − max(R, B))
    alpha = 1.0 - np.clip((dom - KEY_T0) / (KEY_T1 - KEY_T0), 0, 1)
    am = np.maximum(alpha, 0.05)[..., None]
    fg = np.clip((a - (1.0 - alpha)[..., None] * K) / am, 0, 255)          # un-mix the ground from edge colours
    fg[..., kc] = np.minimum(fg[..., kc], np.maximum(fg[..., o1], fg[..., o2]))   # despill: never more key-coloured than its strongest other channel
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

def key_bright(rgb, K):
    # the "bright" matte (LAB-6): the key, strict (T0/T1 low, so key-tinted sparkle keys out); then, next to solid matter, every pixel
    # keeps at least the alpha its colour UN-MIXES to — the largest a with F = (C − (1−a)K)/a not key-dominant — so thin light (a bolt's
    # edges, a mace's glow, a shockwave ring) keeps its alpha where the plain key would drop it; then decontam + despill. Any key colour (LAB-7).
    # LAB-13: the key may be a PAIR (magenta = R and B against G). Both cases are the same shape — "the key level, less the best
    # non-key level" — so only how the two levels are read differs; the single-channel path below is untouched, to the operation.
    kind, keys, other = key_axes(K)
    a = rgb.astype(np.float32)
    d = a - K
    if kind == "pair":
        k1, k2 = keys; o = other
        lev, oth = np.minimum(a[..., k1], a[..., k2]), a[..., o]                 # the pair's JOINT level against the lone other
        au = np.clip(-(np.minimum(d[..., k1], d[..., k2]) - d[..., o]) / max(1.0, float(min(K[k1], K[k2]) - K[o])), 0, 1)
    else:
        kc = keys[0]; o1, o2 = other
        lev, oth = a[..., kc], np.maximum(a[..., o1], a[..., o2])
        au = np.maximum(np.clip(-(d[..., kc] - d[..., o1]) / max(1.0, float(K[kc] - K[o1])), 0, 1), np.clip(-(d[..., kc] - d[..., o2]) / max(1.0, float(K[kc] - K[o2])), 0, 1))
    ak = 1.0 - np.clip((lev - oth - KEY_T0) / (KEY_T1 - KEY_T0), 0, 1)
    near = cv2.dilate((ak > SOLID).astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * RESCUE_R + 1, 2 * RESCUE_R + 1))).astype(bool)
    alpha = np.where(near, np.maximum(ak, au), ak)
    am = np.maximum(alpha, 0.05)[..., None]
    fg = np.clip((a - (1.0 - alpha)[..., None] * K) / am, 0, 255)
    if kind == "pair":
        # despill, the dual of the single-channel rule: subtract the pair's excess over the lone other from BOTH key channels,
        # so neither can end below it. Gold, white and the peacock's blue-green have no such excess and pass through untouched.
        sp = np.maximum(0.0, np.minimum(fg[..., k1], fg[..., k2]) - fg[..., o])
        fg[..., k1] -= sp; fg[..., k2] -= sp
    else:
        fg[..., kc] = np.minimum(fg[..., kc], np.maximum(fg[..., o1], fg[..., o2]))
    return alpha, fg

def isolate_bright(alpha):
    # flecks smaller than SPECK px that touch nothing large are sparkle or noise: cut. Everything larger stays — the bolt and its
    # branches may run far from the body.
    mask = (alpha > 0.3).astype(np.uint8)
    n, lab, stats, _ = cv2.connectedComponentsWithStats(mask, 8)
    if n <= 1: return alpha, 0
    big = np.isin(lab, [k for k in range(1, n) if stats[k, cv2.CC_STAT_AREA] >= SPECK])
    near = cv2.dilate(big.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (13, 13))).astype(bool)
    out, dropped = alpha.copy(), 0
    for k in range(1, n):
        if stats[k, cv2.CC_STAT_AREA] >= SPECK: continue
        comp = lab == k
        if not near[comp & ~big].any() or True:
            touching = cv2.dilate(comp.astype(np.uint8), np.ones((5, 5), np.uint8)).astype(bool) & big
            if not touching.any(): out[comp] = 0.0; dropped += 1
    return out, dropped

def feather(alpha, px):
    # the action may run off the frame (Indra's bolt leaves at the top and the right): its cut edge fades over the last px pixels
    if not px: return alpha
    h, w = alpha.shape; yy = np.arange(h, dtype=np.float32)[:, None]; xx = np.arange(w, dtype=np.float32)[None, :]
    ramp = np.minimum(np.minimum(np.clip((yy + 0.5) / px, 0, 1), np.clip((h - 0.5 - yy) / px, 0, 1)), np.minimum(np.clip((xx + 0.5) / px, 0, 1), np.clip((w - 0.5 - xx) / px, 0, 1)))
    return alpha * ramp

def feather_bottom(alpha, px):
    # LAB-9: the clip's own bottom edge, where a fire pool is cut off by the frame — faded over the last px rows only
    if not px: return alpha
    h = alpha.shape[0]; yy = np.arange(h, dtype=np.float32)[:, None]
    return alpha * np.clip((h - 0.5 - yy) / px, 0, 1)

def core_gap(alpha):
    # rows between the character's core (its largest solid part) and the frame's bottom edge
    solid = (alpha > SOLID).astype(np.uint8)
    n, lab, stats, _ = cv2.connectedComponentsWithStats(solid, 8)
    if n <= 1: return alpha.shape[0]
    main = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    ys = np.where((lab == main).any(axis=1))[0]
    return alpha.shape[0] - 1 - int(ys.max())

def edge_band(alpha, w=4):
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * w + 1, 2 * w + 1))
    return (cv2.dilate((alpha > 0.02).astype(np.uint8), k) & (1 - cv2.erode((alpha > 0.98).astype(np.uint8), k))).astype(bool)

def fringe_share(rgb, alpha, K):
    band = edge_band(alpha)
    if not band.any(): return 0.0, band
    near_ground = np.linalg.norm(rgb.astype(np.float32) - K, axis=2) < 45
    return float(((alpha > 0.5) & near_ground & band).sum()) / float(band.sum()), band

def distinct(indices, grays, keep=(), keep_all=False):
    # every usable frame, in order; a frame whose picture repeats the last kept one is a true duplicate and dropped (never a forced one).
    # LAB-18: keep_all (a card's "keep_duplicates") keeps every frame — for a clip whose genuine motion sits below DUP_MAE
    out, dropped = [], []
    for i in indices:
        if out and not keep_all and i not in keep and float(np.abs(grays[i].astype(np.float32) - grays[out[-1]].astype(np.float32)).mean()) < DUP_MAE:
            dropped.append(i); continue
        out.append(i)
    return out, dropped

def main(card="meghnad"):
    configure(card)
    if not os.path.exists(CLIP): sys.exit("the source clip is not at " + CLIP)
    frames, fps = decode(CLIP)
    H, W = frames[0].shape[:2]
    K = np.array(CFG["key_colour"], np.float32) if isinstance(CFG.get("key_colour"), (list, tuple)) else ground_colour(frames[0])
    sha = hashlib.sha256(open(CLIP, "rb").read()).hexdigest()
    print("clip %d frames @ %.0f fps · %dx%d · ground RGB %s · key channel %s (%s)" % (len(frames), fps, W, H, K.astype(int).tolist(), key_tag(K), "pinned" if isinstance(CFG.get("key_colour"), (list, tuple)) else "auto from the corners"))
    grays = {i: cv2.resize(cv2.cvtColor(f, cv2.COLOR_RGB2GRAY), (240, 135)) for i, f in enumerate(frames)}

    mattes = {}
    def matte(i):
        if i not in mattes:
            if CFG["matte"] == "bright": al, fg = key_bright(frames[i], K); al, dropped = isolate_bright(al)
            else: al, fg = key(frames[i], K); al, dropped = isolate(al, frames[i])
            mattes[i] = (feather(al, CFG["feather"]), fg, dropped)
        return mattes[i]
    if CFG["contact"][0] == "spear-tip":
        # contact: the leftmost solid spear tip in the search window (earliest within 4 px of the extreme)
        tips = {}
        for i in range(CONTACT_SEARCH[0], CONTACT_SEARCH[1] + 1):
            al, _, _ = matte(i)
            lum = frames[i].astype(np.float32) @ np.array([0.299, 0.587, 0.114], np.float32)
            xs = np.where(((al > SOLID) & (lum < DARK_LUM)).any(axis=0))[0]; tips[i] = int(xs.min()) if len(xs) else W
        lo = min(tips.values()); contact_src = min(i for i, x in tips.items() if x <= lo + 4)
        contact_note = "spear tip x=%d" % tips[contact_src]
    elif CFG["contact"][0] == "bolt-edge":
        # the bolt reaches the frame's edge: bright matter kept by the matte in the top rows or the right columns. Contact is the frame
        # after the first such frame — the beam has filled out to the edge.
        edge = {}
        for i in range(CONTACT_SEARCH[0], CONTACT_SEARCH[1] + 1):
            al, _ = key_bright(frames[i], K); al, _ = isolate_bright(al)          # the matte BEFORE the edge feather: the frame's own edge rows
            lum = frames[i].astype(np.float32) @ np.array([0.299, 0.587, 0.114], np.float32)
            lit = (al > 0.5) & (lum > 170)
            edge[i] = int(lit[:3, :].sum() + lit[:, -3:].sum())
        peak = max(edge.values()); first = min(i for i, v in edge.items() if v >= 0.25 * peak)   # a grazing tip is not the bolt reaching the edge
        contact_src = first + 1
        contact_note = "the bolt reaches the frame edge (at least a quarter of its peak edge contact) first at f%d (edge px %s)" % (first, {k: edge[k] for k in sorted(edge)})
    elif CFG["contact"][0] == "nova":
        # "nova" (LAB-8): the audited frame the burst begins — the radial flash is the stage's; the frame is named, not measured
        contact_src = CFG["contact"][1]
        contact_note = "nova: the burst begins at the audited frame f%d" % contact_src
    else:
        # "ground-impact" (LAB-7): the frame the weapon reaches the ground band — matter within 60 px of the settled frame's ground line,
        # clear of the standing feet's columns (±80 px), first reaching 2000 px
        al_s, _, _ = matte(SETTLED_FRAME); ys_s, xs_s = np.where(al_s > 0.5); gy = int(ys_s.max())
        stand = xs_s[ys_s >= gy - 14]; fx0, fx1 = max(0, int(stand.min()) - 80), int(stand.max()) + 80
        hits = {}
        for i in range(CONTACT_SEARCH[0], CONTACT_SEARCH[1] + 1):
            band = matte(i)[0][gy - 60:, :] > 0.5; band[:, fx0:fx1] = False; hits[i] = int(band.sum())
        contact_src = min(i for i, v in hits.items() if v >= 2000)
        contact_note = "the weapon reaches the ground band clear of the feet (columns %d–%d kept out) first at f%d (hits %s)" % (fx0, fx1, contact_src, {k: hits[k] for k in sorted(hits)})
    KEEP_ALL = bool(CFG.get("keep_duplicates"))          # LAB-18: per-card data, default false — the standing duplicate rule for every other card
    emerge, dup_e = distinct(range(EMERGE_RANGE[0], EMERGE_RANGE[1] + 1), grays, keep_all=KEEP_ALL)
    act, dup_a = distinct(range(ACT_RANGE[0], ACT_RANGE[1] + 1), grays, keep=(contact_src,), keep_all=KEEP_ALL)
    thin, thinned = CFG.get("thin_alternate"), []        # LAB-8 lever 1: every other frame in the named range
    if thin: thinned = [i for i in act if thin[0] <= i <= thin[1] and (i - thin[0]) % 2 == 1 and i != contact_src and i != act[-1]]; act = [i for i in act if i not in thinned]
    kept = emerge + act
    diffs = [float(np.abs(grays[i].astype(np.float32) - grays[i - 1].astype(np.float32)).mean()) for i in range(EMERGE_RANGE[0] + 1, ACT_RANGE[1] + 1)]
    print("kept %d frames · EMERGE %d (f%d–f%d) · ACT %d (f%d–f%d) · duplicates dropped %s · smallest neighbour |Δ| %.2f · contact f%d (%s)" % (
        len(kept), len(emerge), emerge[0], emerge[-1], len(act), act[0], act[-1], dup_e + dup_a if dup_e + dup_a else "none", min(diffs), contact_src, contact_note))

    # LAB-9 · THE BOTTOM FEATHER AND ITS GUARD: the band must stay clear of the character's core on every frame up to contact (after contact
    # what sits on the bottom edge is the fire the band is meant to fade). The band is narrowed to fit, and what it ended as is recorded.
    BOTTOM, bottom_note, gaps = CFG.get("feather_bottom") or 0, "none", {}
    if BOTTOM:
        def raw_matte(i):
            if CFG["matte"] == "bright": al, _ = key_bright(frames[i], K); al, _ = isolate_bright(al)
            else: al, _ = key(frames[i], K); al, _ = isolate(al, frames[i])
            return al                                                    # NO side feather: its own 8 px ramp would read as the core's edge
        # LAB-13: measured across EVERY EMERGE frame, not the settled frame alone. The settled frame is one pose; a character who
        # MOVES through the band (Garuda's talons ride the bottom edge for sixteen frames) defeats a single-frame check, which is how
        # LAB-12 found this latent. EMERGE is the right scope: it is the character before the action, so the core is the character —
        # from the action on, what reaches the edge is the fire the band exists to fade (Agni's core "touches" the edge at f097 only
        # because the fire has merged into it).
        gaps = {i: core_gap(raw_matte(i)) for i in emerge}
        worst = min(gaps.values()); worst_at = min(i for i, v in gaps.items() if v == worst)
        room = worst - 2
        if BOTTOM > room: BOTTOM = max(0, room)
        pooled = [i for i in kept if i > SETTLED_FRAME and (raw_matte(i)[-1:, :] > 0.5).any()]
        bottom_note = "%d px (the core comes within %d px of the edge on f%03d — the closest of all %d EMERGE frames, settled f%03d reads %d; asked %d; from f%s the clip's own fire reaches the edge and the band fades that, as intended)" % (
            BOTTOM, worst, worst_at, len(gaps), SETTLED_FRAME, gaps.get(SETTLED_FRAME, -1), CFG["feather_bottom"], ("%03d" % pooled[0]) if pooled else "—")
    print("bottom feather: %s" % bottom_note)
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
        al = feather_bottom(al, BOTTOM)
        stats.append({"src": i, "fringeBefore": round(share, 5), "fringeAfter": round(share_after, 5), "rembg": used, "detachedDropped": dropped})
        img = np.dstack([np.clip(fg, 0, 255).astype(np.uint8), (np.clip(al, 0, 1) * 255).astype(np.uint8)])
        img[..., :3][img[..., 3] == 0] = 0
        rgba[i] = img
        Image.fromarray(img, "RGBA").save(os.path.join(AUDIT, "f%03d.png" % i))

    # the pivot, on a settled frame: "front-left" = ground contact under the front hooves (the horse faces left); "feet" = the centre of
    # the ground contact between both feet
    al, _, _ = matte(SETTLED_FRAME)
    ys, xs = np.where(al > 0.5)
    ground = int(ys.max()); band = xs[ys >= ground - 14]
    if CFG["pivot"] == "front-left":
        left = band[band <= np.percentile(band, 50)]; PIV = (float(np.mean(left)), float(ground))
    else:
        # "feet": halfway between the two feet — the lowest matter left and right of the stance's centre (the robe's hem joins them, so the
        # ground band alone finds only the lower foot)
        top = int(ys.min()); low = ys >= ground - int(0.12 * (ground - top)); lx, ly = xs[low], ys[low]; mid = (lx.min() + lx.max()) / 2.0
        feet = [float(np.mean(lx[side][ly[side] >= ly[side].max() - 6])) for side in (lx < mid, lx >= mid)]
        PIV = (float((feet[0] + feet[1]) / 2), float(ground))
    # trim every kept frame; one scale for all
    boxes = {}
    for i in kept:
        a = rgba[i][..., 3]; yy, xx = np.where(a > 5)
        x0, y0, x1, y1 = int(xx.min()), int(yy.min()), int(xx.max()) + 1, int(yy.max()) + 1
        x0, y0 = min(x0, int(math.floor(PIV[0]))), min(y0, int(math.floor(PIV[1])))
        x1, y1 = max(x1, int(math.ceil(PIV[0])) + 1), max(y1, int(math.ceil(PIV[1])) + 1)
        boxes[i] = (x0, y0, x1, y1)
    # LAB-8 · the fade tail (native exit): a linear alpha ramp over the last n cells, 100% → 0%, after the trim so every cell keeps its rectangle
    fade = []
    if CFG.get("fade_tail"):
        n = CFG["fade_tail"]
        for k, i in enumerate(kept[-n:]):
            f_ = 1.0 - k / float(n - 1); al8 = np.round(rgba[i][..., 3].astype(np.float32) * f_).astype(np.uint8)
            rgba[i][..., 3] = al8; rgba[i][..., :3][al8 == 0] = 0; fade.append([i, round(f_, 4)])
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
    if AW > 4096 or AH > 4096: sys.exit("atlas %dx%d exceeds 4096 (%d cells at %d px) — LAB-8 levers: thin_alternate, then cell_px" % (AW, AH, len(cells), CELL_MAX))
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
        "cardId": CFG.get("engine_id") or CARD, "class": "actor", "version": 2, "placeholder": False,
        "source": "Kling clip %s (sha256 %s…, %d frames @ %d fps, %dx%d, chroma %s) — kept f%d–f%d; matted by tools/make_actor_from_clip.py" % (os.path.basename(CLIP), sha[:12], len(frames), round(fps), W, H, chroma_label(K), kept[0], kept[-1]),
        "atlas": "atlas.webp", "atlasSize": {"w": AW, "h": AH},
        "alpha": "straight", "blend": "normal", "mv": False, "vignette": False, "cellMax": 512,
        "fps": FPS, "timing": "native", "tempo": TEMPO, "phaseMs": PHASE_MS, "facing": CFG["facing"], "mirror": True,
        "refHeight": max(c.height for _, c, _, _ in cells),
        "cells": [{"name": "f%03d" % i, "src": i, "x": cx, "y": cy, "w": c.width, "h": c.height, "pivot": {"x": min(c.width, round(px, 1)), "y": min(c.height, round(py, 1))}, "origin": list(origins[i])} for i, c, cx, cy, px, py in placed],
        "rungs": [{"cellMax": 512 // R, "atlas": "atlas_256.webp", "atlasSize": {"w": HW, "h": HH}, "refHeight": max(c.height for _, c, _, _ in half),
                   "cells": [{"name": "f%03d" % i, "src": i, "x": cx, "y": cy, "w": c.width, "h": c.height, "pivot": {"x": min(c.width, round(px, 1)), "y": min(c.height, round(py, 1))}} for i, c, cx, cy, px, py in placed_h]}],
        "phases": {"emerge": list(range(0, ne)), "act": list(range(ne, len(kept))), "fizzle": [len(kept) - 1]},
        "contact": act.index(contact_src),
        "audit": {"idle": [0, EMERGE_RANGE[0] - 1], "emerge": list(EMERGE_RANGE), "act": list(ACT_RANGE), "droppedTail": [ACT_RANGE[1] + 1, len(frames) - 1] if ACT_RANGE[1] < len(frames) - 1 else None, "duplicatesDropped": dup_e + dup_a, "contactSrc": contact_src, "pivotSrc": [round(PIV[0], 1), round(PIV[1], 1)], "scale": round(s, 5)},
    }
    if TEMPO is None: del manifest["tempo"]          # the card inherits the registry's defaults (data/manifestations.json)
    # LAB-8 · the native exit, the nova rule, the real cell size, the levers — written only for a card that names them
    if CFG.get("exit") == "native":
        del manifest["phases"]["fizzle"]; manifest["exit"] = "native"
        if manifest["phases"]["act"][-1] != len(kept) - 1: sys.exit("a native-exit pack must end ACT on its last cell")
    if CFG["contact"][0] == "nova": manifest["contactRule"] = "nova"
    if CFG.get("contact_strength"): manifest["contactStrength"] = dict(CFG["contact_strength"])
    if KEEP_ALL: manifest["audit"]["keepDuplicates"] = True     # LAB-18: recorded, so the empty duplicatesDropped reads as a ruling, not a measurement
    if CFG.get("travel_scale") is not None: manifest["travelScale"] = CFG["travel_scale"]   # LAB-10: 0 = performs where it stands; absent = 1, the charge as it always was
    if BOTTOM: manifest["audit"]["featherBottom"] = {"px": BOTTOM, "asked": CFG["feather_bottom"], "coreGapMin": min(gaps.values()), "guardFrame": min(gaps, key=lambda i: gaps[i]), "guardScope": "emerge", "guardFrames": len(gaps), "settledGap": gaps.get(SETTLED_FRAME)}
    if "cell_px" in CFG:
        manifest["cellPx"] = max(max(c.width, c.height) for _, c, _, _ in cells); manifest["rungs"][0]["cellPx"] = max(max(c.width, c.height) for _, c, _, _ in half)
        manifest["audit"]["atlasLever"] = (["alternate frames dropped in f%d–f%d: %s" % (thin[0], thin[1], ", ".join("f%03d" % i for i in thinned))] if thin else []) + (["cells at %d px" % CELL_MAX] if CELL_MAX != 512 else []) or "none"
    if CFG.get("fade_tail"): manifest["audit"]["fadeTail"] = fade
    if CFG["aim"]: manifest = dict(sum(([(k, v)] + ([("aim", CFG["aim"])] if k == "facing" else []) for k, v in manifest.items()), []))
    manifest["audit"]["recipe"] = {"matte": CFG["matte"], "key": list(CFG["key"]), "keyColour": [int(round(v)) for v in K.tolist()], "keyChannel": key_tag(K), "keyKind": key_axes(K)[0], "contact": CFG["contact"][0], "pivot": CFG["pivot"], "feather": CFG["feather"],
                                   "msPerSourceFrame": {k: round(v, 4) for k, v in MS_PER_SRC.items()}}
    with open(os.path.join(OUT, "manifest.json"), "w") as f: json.dump(manifest, f, indent=2); f.write("\n")
    with open(os.path.join(AUDIT, "matte_stats.json"), "w") as f: json.dump(stats, f, indent=1)

    # the contact sheet for the owner: every kept frame, matted, over a checker, labelled with its phase; contact starred
    tw = 300; th = int(round(tw * max(c.height for _, c, _, _ in cells) / max(c.width for _, c, _, _ in cells)))
    cols = 8; rows = (len(cells) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * tw, rows * (th + 22) + 30), (18, 18, 18)); d = ImageDraw.Draw(sheet)
    d.text((8, 8), CFG["label"] + " actor · %d frames kept of %d · EMERGE %d in %d ms · ACT %d in %d ms (tempo 1; default %s) · contact f%d · atlas %dx%d" % (len(kept), len(frames), ne, PHASE_MS["emerge"], len(act), PHASE_MS["act"], ("%.1fx" % TEMPO) if TEMPO else "inherited", contact_src, AW, AH), fill=(235, 210, 150))
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
    main(sys.argv[1] if len(sys.argv) > 1 else "meghnad")
