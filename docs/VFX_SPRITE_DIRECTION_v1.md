# VFX_SPRITE_DIRECTION_v1.md
# Painted effect sprites for the T67 compositor upgrade.
# Owner rules by generating. Claude audits every intake against
# the veto lines below before any file is canonical.

═══════════════════════════════════════════
## GLOBAL LAWS (apply to every sprite)
═══════════════════════════════════════════
GL1. PURE BLACK BACKGROUND, always. The compositor uses additive
     blending, so black equals transparent for free. Any sprite
     with a gray or colored ground is a REJECT, no exceptions.
GL2. NO TEXT, NO GLYPHS, NO SCRIPT anywhere in the effect. The
     script veto applies to VFX same as card art. Free-floating
     sparks are fine; anything that reads as writing is not.
GL3. NO CARD, NO FRAME, NO UI in the image. We are generating the
     energy only. The mockup's cards, plaques, and buttons were
     generator inventions; none of that is in scope.
GL4. MASTER COLOR: white-gold. Faction tinting happens in code
     (grounds-not-chrome economy: one master serves all four).
     The two exceptions below (E4 bloom red pass, E5 smoke) say
     so explicitly.
GL5. SQUARE, 1:1, target 1024 generation (compositor downsamples
     to 512). PNG on intake.
GL6. CENTERED SUBJECT with dark breathing room at the edges. The
     effect must not touch the image border (clipping at border
     means a visible square edge in-game, which is a REJECT).
GL7. Painterly, volumetric, textured, matching the game's art
     register. Anything that reads as vector, flat, or clip-art
     is a REJECT.

═══════════════════════════════════════════
## THE KIT: 5 effects, 13 images total
═══════════════════════════════════════════

E1 · GOLD RADIANCE AURA (3 variants)
FILE: vfx_aura_1.png / _2.png / _3.png
ROLE: buff moments, Deva plays, blessing beats (ambient/combat).
PROMPT: "a burst of divine golden light energy on a pure black
background, soft volumetric radiance with fine floating sparks,
painterly, glowing from a bright center, no objects, no figures,
no text --ar 1:1"
VETO: center must be brightest point (additive needs a hot core);
sparks fine and few, not confetti; no lens-flare streaks (reads
photographic, not painterly); edges fade fully to black.

E2 · EMBER RING / GROUND MANDALA (2 variants)
FILE: vfx_ring_1.png / _2.png
ROLE: unit landing at combat weight and up. Power arrives on the
ground. Drawn flattened; code squashes to an ellipse under the
card.
PROMPT: "a glowing golden ring of fire and embers viewed from
above on a pure black background, circular ember ring with small
rising sparks, ornate radiant energy, painterly, no text, no
symbols, no objects --ar 1:1"
VETO: ring must read as a RING at a squint (a filled disc is a
reject); NO mandala geometry that resolves into script-like
detail (the GL2 pressure point: ornate is fine, legible is not);
ring interior stays dark so the card sits inside it.

E3 · LIGHTNING WRAP (4 variants, the animation set)
FILE: vfx_lightning_1.png through _4.png
ROLE: Vajra, Vidyutastra, spectacle-tier entrances. Code
crossfades the 4 variants rapidly for living electricity; they
are poses of one storm, not a sequence, so no frame continuity
needed.
PROMPT: "crackling blue-white lightning arcs on a pure black
background, electric energy branching and forking around an
empty central space, volumetric glow, painterly, no objects, no
figures, no text --ar 1:1"
VETO: the CENTER stays relatively open (the card lives there; a
bolt through image-center is a reject); arcs must branch (single
clean bolts read cheap); blue-white only, no purple drift (Maya
violet is an Asura frame color; keep the wrap faction-neutral).

E4 · IMPACT BLOOM (2 variants)
FILE: vfx_bloom_1.png / _2.png
ROLE: the hit instant on damage/destroy; replaces the flat red
flash. Master is white-gold per GL4; code tints red for damage.
PROMPT: "a sharp explosive flash of white-gold light on a pure
black background, hot radial burst with short jagged rays,
painterly impact energy, no smoke, no objects, no text --ar 1:1"
VETO: SHARP and short-rayed, not a soft glow (E1 owns soft;
these two must be distinguishable at a squint); no smoke in
this one (smoke is E5's job); hot white core mandatory.

E5 · SMOKE / RUBBLE BASE (2 variants)
FILE: vfx_smoke_1.png / _2.png
ROLE: destroys, Brahmastra's roll. The one dark sprite: drawn in
near-black grays with ember-lit edges, composited normally (not
additive) with alpha from luminance.
PROMPT: "billowing dark smoke cloud with glowing orange ember
edges on a pure black background, volumetric painterly smoke
catching firelight from below, no objects, no figures, no text
--ar 1:1"
VETO: embers live at the EDGES of the billow (a lit core reads
as fire, wrong effect); the billow must have a visible top
silhouette against black (shapeless haze is a reject); orange
ember accents only, no green (venom owns green, absolutely).

═══════════════════════════════════════════
## INTAKE PROTOCOL
═══════════════════════════════════════════
1. Mode-check is step zero of every image, per standing law.
2. ls -lt before every mv (Downloads suffix trap).
3. Paste or upload picks; Claude audits each against its veto
   lines plus GL1-GL7 before the filename is canonical.
4. Canonical home: assets/vfx/ in the game repo (created at T67
   intake, not before).
5. 13 approved masters gate T67. Partial approval is fine; T67
   can wire a subset and leave procedural fallbacks where a
   sprite is not yet approved.

═══════════════════════════════════════════
## WHAT T67 DOES WITH THESE (so generation aims right)
═══════════════════════════════════════════
The T66 architecture is untouched: tiers, hit-stop, zoom-punch,
beat sequencing, pacing binding all stay. T67 swaps the visual
payload: the canvas compositor draws these textures (additive,
tinted per faction, scaled, rotated, faded per tier) where it
now draws procedural gradient dots. Ambient tier draws the aura
small and brief. Combat tier draws the bloom at the hit and the
ring under landings. Spectacle tier draws the lightning wrap
crossfade plus ring plus smoke plus everything T66 already
fires. Reduced-motion still kills all of it. Particle CAP and
perf constraints inherit unchanged.
