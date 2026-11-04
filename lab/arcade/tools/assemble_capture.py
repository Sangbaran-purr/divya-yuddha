#!/usr/bin/env python3
"""ARCADE-1 · assemble a capture (tools/capture_server.js calls this): the JPEG frames of one demo bout → an MP4 (30 fps, H.264
where OpenCV has it, else MPEG-4) and a GIF (15 fps, 640 px wide), each frame stamped with the mode label, into
~/Desktop/DY_arcade_screens/.   python assemble_capture.py <frames dir> <name> <label>"""
import os, sys, glob
import cv2
from PIL import Image, ImageDraw, ImageFont

src, name, label = sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else ""
out = os.path.expanduser("~/Desktop/DY_arcade_screens"); os.makedirs(out, exist_ok=True)
frames = sorted(glob.glob(os.path.join(src, "f*.jpg")))
if not frames: print("no frames"); sys.exit(1)
def font(sz):
    for p in ("/System/Library/Fonts/Supplemental/Arial Bold.ttf", "/System/Library/Fonts/Helvetica.ttc"):
        if os.path.exists(p): return ImageFont.truetype(p, sz)
    return ImageFont.load_default()
F = font(18)
def stamped(path):
    im = Image.open(path).convert("RGB"); d = ImageDraw.Draw(im)
    text = name.upper() + "  ·  " + label
    d.rectangle([0, im.height - 30, im.width, im.height], fill=(0, 0, 0))
    d.text((10, im.height - 26), text, fill=(232, 200, 116), font=F)
    return im
first = stamped(frames[0]); W, H = first.size
mp4 = os.path.join(out, name + ".mp4"); vw = None
for cc in ("avc1", "mp4v"):
    vw = cv2.VideoWriter(mp4, cv2.VideoWriter_fourcc(*cc), 30, (W, H))
    if vw.isOpened(): codec = cc; break
gif_frames = []
for i, p in enumerate(frames):
    im = stamped(p)
    vw.write(cv2.cvtColor(__import__("numpy").asarray(im), cv2.COLOR_RGB2BGR))
    if i % 2 == 0: g = im.copy(); g.thumbnail((640, 640)); gif_frames.append(g.convert("P", palette=Image.ADAPTIVE, colors=128))
vw.release()
gif = os.path.join(out, name + ".gif")
gif_frames[0].save(gif, save_all=True, append_images=gif_frames[1:], duration=66, loop=0, optimize=True)
print("%s: %d frames %dx%d · mp4 (%s) %.1f MB · gif %.1f MB" % (name, len(frames), W, H, codec, os.path.getsize(mp4) / 1048576, os.path.getsize(gif) / 1048576))
