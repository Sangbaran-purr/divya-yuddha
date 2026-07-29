# VFX_SPRITE_DIRECTION_v4_boardscale.md
# THE DIEGETIC PROGRAM: board-scale effect plates.
# Owner calibration (Gwent reference frames, on record): effects
# must be events IN the battlefield, not decals over cards. The
# runtime (GPU layer, MV pipeline, hero sequencer) is complete and
# unchanged; this doc replaces the CONTENT at the correct scale.
# Extends v1-v3; the card-scale kit remains for card-scale moments.
# Resolution law: plates inherit T74's display-resolution standard
# (row plates authored 1920-wide from birth).

═══════════════════════════════════════════
## GLOBAL LAWS (V-laws inherit; deltas below)
═══════════════════════════════════════════
W1. WIDE ASPECT: masters 16:9, composed as a HORIZONTAL BAND of
    effect - the subject sweeps left-to-right across the frame
    like weather over a battlefield row.
W2. EDGE LAW INVERTS LEFT/RIGHT: row plates span the full row, so
    the effect SHOULD run to the left and right edges (they land
    at the row's ends). Top and bottom must still fade to black
    inside the frame (the row has neighbors).
W3. LITERAL, NOT ABSTRACT: fire is fire on ground, light is light
    falling on stone, venom is liquid flooding a surface. If it
    reads as a symbol, reject.
W4. Black background, camera locked, no invented objects, color
    vetoes: all carry over verbatim.
W5. Authoring route per effect is chosen in its motion brief
    (scripted compositor or Kling, per v4a). Downstream pipeline
    (clamp, mask, MV, sheets, GPU playback) already exists.

═══════════════════════════════════════════
## THE PLATES: 6 effects
═══════════════════════════════════════════

B1 · ROW FIRE SWEEP (the Gwent frame itself)
Trigger: multi-target damage, Agni-class astras, Asura row events.
STILL PROMPT: "a wide horizontal sweep of raging fire raking
across dark ground, flames and embers streaming left to right in
a long burning band, painterly cinematic firestorm, pure black
background above and below, no objects, no figures, no text
--ar 16:9"

B2 · ROW DIVINE WASH
Trigger: Deva row blessings, Dharma moments, mass buffs.
STILL: "a wide band of golden divine light washing across dark
stone ground, god-rays falling from above onto a long strip of
sacred radiance, drifting light motes, painterly, serene, pure
black above and below, no objects, no figures, no text --ar 16:9"

B3 · ROW VENOM TIDE
Trigger: Naga multi-venom, Sarpa events.
STILL: "a wide tide of glowing toxic green venom flooding across
dark ground, viscous liquid spreading in a long band with rising
sickly mist, wet glistening poison, deep emerald green only,
painterly, pure black above and below, no objects, no text
--ar 16:9"

B4 · STORM OVERHEAD
Trigger: Vajra, Indra, storm astras - plays across the TOP of the
board, above both rows.
STILL: "a wide storm front of blue-white lightning arcing
horizontally through dark clouds, multiple branching bolts along
a long band of tempest, volumetric, painterly, pure black above
and below, no objects, no text --ar 16:9"

B5 · IMPACT SCORCH (STILL ONLY - the diegetic residue)
A blackened scorched burn-mark decal that PERSISTS on the board
for ~10s after spectacle hits, fading slowly. The "world
remembers" signal.
STILL: "a scorched burn mark seen from above, charred blackened
ground with faint glowing ember cracks, circular impact scar,
painterly, isolated on pure black, no objects, no text --ar 1:1"
(Draws source-over with luminance-shaped alpha; the ONE intended
dark element besides the scene dim - it is ground damage, not
light.)

B6 · EMBER ATMOSPHERE (no generation - procedural)
Sparse drifting embers/motes via the GPU particle system across
the whole board at all times during matches, density breathing
with match intensity. Ruled: the board is never fully still again.

═══════════════════════════════════════════
## T73 (authored after intake): THE DIEGETIC LAYER
═══════════════════════════════════════════
Row-plate renderer in the GPU layer: one wide quad per row,
plates play as MV flipbooks spanning the row's full width behind
the card minis (z below cards, above the board art). Event
routing: multi-target/row events fire the matching plate; the
hero moment's beat 3 gains the B1 sweep across the target row.
Scorch decals on a persistent layer with slow fade. B6 ambient
always-on. All fallbacks/reduced-motion laws inherit.
