# VFX_SPRITE_DIRECTION_v2_addendum.md
# Extends v1 (committed bce75b0). Adds the four faction-identity
# effects so signature moves read painted, not procedural, next
# to the v1 universal kit. All v1 GLOBAL LAWS (GL1-GL7) apply
# unchanged except where a line below explicitly overrides GL4.

═══════════════════════════════════════════
## THE FACTION ROW: 4 effects, 8 images
═══════════════════════════════════════════

E6 · VENOM BURST (2 variants) — NAGA SIGNATURE
FILE: vfx_venom_1.png / _2.png
ROLE: venom application and venom tick. Ambient weight by ruling
(dread, not punch). GL4 OVERRIDE: master is GREEN. Venom is
always green, absolutely; no code tinting, this ships green.
PROMPT: "toxic green venom mist on a pure black background,
sickly luminous green vapor with dripping liquid tendrils
falling downward, wet glistening poison, painterly, volumetric,
no objects, no figures, no text --ar 1:1"
VETO: must read WET (dry fog is a reject); tendrils drip DOWN
(venom falls, never rises); green only, no yellow-green drift
toward gold and no blue drift toward teal; a soft sickly glow,
never a bright flash (this is the quiet effect of the kit).

E7 · DHARMA SHIELD WRAP (2 variants) — DEVA SIGNATURE
FILE: vfx_shield_1.png / _2.png
ROLE: shield designation. The golden ring snap gets a painted
body. Unlike E2 (a ground ring seen from above), this is a
VERTICAL protective ring facing the viewer, drawn around an
empty center where the card sits.
PROMPT: "a radiant golden circular halo of protective light on
a pure black background, ornate ring of divine energy facing
the viewer with a calm empty center, soft rays, painterly,
sacred and serene, no text, no symbols, no objects --ar 1:1"
VETO: center stays EMPTY and dark (the card lives there);
ornament must never resolve into script or legible symbols
(the GL2 pressure point, same as E2); serene not explosive
(protection reads calm; E4 owns violence); gold only.

E8 · CHAOS SURGE FLARE (2 variants) — ASURA SIGNATURE
FILE: vfx_surge_1.png / _2.png
ROLE: Chaos Surge trigger, the random blessing burst. Two Fires
palette applies: ember-red is the real price. GL4 OVERRIDE:
master is EMBER-RED-ORANGE, shipped as-is, no tinting.
PROMPT: "wild ember-red fire flare erupting upward on a pure
black background, chaotic crimson-orange flame burst with
scattered flying sparks, violent and untamed energy, painterly,
volumetric, no objects, no figures, no text --ar 1:1"
VETO: CHAOTIC silhouette, asymmetric, never a neat symmetric
burst (chaos is the identity; E4's clean radial is the
counterexample); ember-red-orange only, NO violet (Maya violet
is the illusion color and Surge is the real price; violet here
is a reject); sparks scatter irregularly.

E9 · LEAP STREAK (2 variants) — VANARA SIGNATURE
FILE: vfx_streak_1.png / _2.png
ROLE: the Leap arc trail. A horizontal motion streak the
compositor bends and rotates along the leap path; the power
numeral rides it as today. Master white-gold per GL4; code
tints Vanara green in-game.
PROMPT: "a horizontal comet streak of glowing light on a pure
black background, bright leading head with a long tapering
energy tail trailing small sparks, sense of fast motion,
painterly, no objects, no figures, no text --ar 1:1"
VETO: clear HEAD and TAIL (a symmetric bar is a reject; motion
must have direction); tail tapers fully to black before the
image edge (GL6 matters most here, a clipped tail reads as a
cut-off rectangle in-game); one streak only, not a shower.

═══════════════════════════════════════════
## INTAKE + T67
═══════════════════════════════════════════
Same protocol as v1: mode-check first, ls -lt before mv, paste
picks for audit, canonical home assets/vfx/ at T67 intake.
Full kit is now 21 masters (13 v1 + 8 v2). Partial approval
still fine; procedural fallbacks remain wherever a sprite is
not yet approved. T67 wiring: E6 replaces the CSS drip body
(the wet badge stays), E7 replaces the ring-snap body, E8 is
a NEW dispatch on the Chaos Surge event at combat weight, E9
replaces the arc line with the bent streak.
