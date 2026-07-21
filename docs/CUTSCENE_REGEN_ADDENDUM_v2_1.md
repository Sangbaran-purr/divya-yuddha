# CUTSCENE REGEN ADDENDUM v2.1 — P12 corrections to DIRECTION_v2
# The direction doc stands; these findings amend its delivery facts.

1. HOME: cutscene files live in assets/story/ (not assets/img).
   All intake blocks target assets/story/.
2. SHIPPED SPEC: portrait art is 896x1344 (2:3). Mobile regens land
   at that ratio. Wide = 3:2 per the doc.
3. FREE WINS: b1c3_v1, b1c4_v1, b1c5_v1 are referenced-but-missing.
   The resolver is naming-convention, so intaking these three files
   turns text-plate victories into art with ZERO code change.
   Sequence them early.
4. STAMP GAP: cutscene refs carry no ?v= stamps today. First-time
   files (the three v1s, all _wide files) are cache-safe.
   REPLACEMENTS of the shipped 22 wait for T56, which adds stamping
   at the cutImgUrl resolver alongside the wide swap.
5. RULED DEFAULTS (owner veto reverses either):
   a. b1c3_i2 (The Shield Ignites) DROPPED from the generation
      list — chapters.js never adopted it; can be added later by
      its own ruling.
   b. b1c3_i3 PROMOTED to a true panel — the board_swarga inline
      override (chapters.js:164) is deleted in T56; generate the
      pair per the doc.
6. FINAL GENERATION COUNT: 26 panels, 52 images (25 chapter panels
   + b1_defeat, dual orientation; c3_i1 and c7_i2 remain one image
   each per orientation, double-duty).
