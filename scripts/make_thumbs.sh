#!/bin/bash
# make_thumbs.sh — generate lightweight gallery thumbnails of the 88 card frames.
#
# The full frames in assets/cards/ are ~1 MB each (90 MB total) — far too heavy to load
# in the Faction Introduction gallery. This produces assets/thumbs/ with the SAME filenames,
# resized to 200 px wide and re-encoded as JPEG (~q70, target <=25 KB each) using macOS `sips`.
#
# RE-RUN THIS whenever a card frame is re-exported (e.g. the four pending re-exports:
# Chandrahas, Hanuman, Neela, Angad) so its thumbnail stays in sync.
#
# Usage:  bash scripts/make_thumbs.sh
set -euo pipefail
cd "$(dirname "$0")/.."

SRC="assets/cards"
OUT="assets/thumbs"
mkdir -p "$OUT"

shopt -s nullglob
count=0
for f in "$SRC"/*.png; do
  base="$(basename "$f")"
  # --resampleWidth 200 keeps aspect (portrait 750x1050 -> 200x280); JPEG q60 keeps every thumb <=25 KB.
  # Same filename (JPEG bytes in a .png name — browsers sniff content); sips' "suffix should be jpg" note is cosmetic, silenced.
  sips --resampleWidth 200 -s format jpeg -s formatOptions 60 "$f" --out "$OUT/$base" >/dev/null 2>&1
  count=$((count+1))
done

echo "Generated $count thumbnails in $OUT/"
du -sh "$OUT" 2>/dev/null || true
