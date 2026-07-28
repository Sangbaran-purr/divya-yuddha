# VFX_SPRITE_DIRECTION_v3_flipbooks.md
# Flipbook conversion of the painted VFX kit via Kling I2V.
# Extends v1 + v2 (committed). The 21 still masters remain canon;
# this doc converts the four fluid-bodied effects into animated
# frame sequences. Owner generates in Kling; Claude audits clips;
# CC extracts frames and builds playback (task authored after
# clips are approved).

═══════════════════════════════════════════
## WHY AND WHICH
═══════════════════════════════════════════
Static stamps read tacky in motion; real fluidity is baked frame
animation (the Unity flipbook technique). Convert the four
effects whose bodies should churn:
  P1 SMOKE (worst static offender, also fixes the black-blob
     verdict: dark body becomes rolling glow)
  P2 SURGE (fire must flicker)
  P3 AURA (light must swell and breathe)
  P4 VENOM (poison must drip and crawl)
NOT converted: lightning (4-frame swap already works and stays),
bloom (150ms on screen), ring, shield, streak (transients; may
convert in a later wave if the eye demands).

═══════════════════════════════════════════
## GLOBAL LAWS (every clip)
═══════════════════════════════════════════
V1. START FRAME = the approved master. Feed the exact canonical
    PNG from assets/vfx/ as the Kling image input. The clip must
    stay recognizably that painting in motion.
V2. CAMERA LOCKED. Zero pan, zoom, or drift. Any camera motion
    is a REJECT (it becomes a sliding rectangle in-game).
V3. BACKGROUND STAYS PURE BLACK for the full duration. Kling
    likes to bloom haze into dark areas over time; watch the
    corners across the whole clip. Haze creep is a REJECT.
V4. NO NEW ELEMENTS. Kling invents: faces in fire, objects in
    smoke, sparks becoming fireflies. Anything that appears
    which is not in the master is a REJECT.
V5. EFFECT STAYS CONTAINED. The motion must not carry the body
    into the frame edges at any point in the clip (GL6, now
    per-frame).
V6. COLOR HOLDS. Same palette vetoes as the stills: surge never
    violet, venom never yellow-green or teal, aura white-gold.
V7. NO SEAMLESS LOOP REQUIRED. Playback is ping-pong (forward
    then reverse), so the clip only needs continuous motion, not
    a matched first/last frame. Do not waste rolls on looping.
V8. 5 seconds, highest available resolution, one effect per clip.

═══════════════════════════════════════════
## THE CLIPS: 8 total (2 per effect, one per still variant)
═══════════════════════════════════════════

C1/C2 · SMOKE (from vfx_smoke_1.png, vfx_smoke_2.png)
KLING PROMPT: "the smoke cloud billows and rolls slowly in
place, embers glowing and pulsing at its edges, volumetric
churning motion, camera completely still, pure black background,
no new objects"
VETO: billow must CHURN (internal rolling), not just sway;
embers pulse but never spread into the dark body; the silhouette
may breathe but not migrate.

C3/C4 · SURGE (from vfx_surge_1.png, vfx_surge_2.png)
KLING PROMPT: "the flames flicker and lick upward violently in
place, fire churning with chaotic energy, sparks drifting
upward briefly, camera completely still, pure black background,
no new objects"
VETO: flames flicker at flame speed (slow-motion fire reads as
underwater, REJECT); the eruption stays anchored at its base;
sparks may drift but not swarm.

C5/C6 · AURA (from vfx_aura_1.png, vfx_aura_2.png; aura_3 stays
still as the fallback variant)
KLING PROMPT: "the golden light swells and breathes softly,
radiance pulsing gently from the bright center, fine sparks
drifting slowly, serene divine energy, camera completely still,
pure black background, no new objects"
VETO: SERENE (violent pulsing reads as fire, REJECT); the hot
core stays the brightest point throughout; sparks drift, never
streak.

C7/C8 · VENOM (from vfx_venom_1.png, vfx_venom_2.png)
KLING PROMPT: "the green venom drips slowly downward, liquid
tendrils stretching and falling, droplets forming and dripping,
mist swirling faintly, wet glistening motion, camera completely
still, pure black background, no new objects"
VETO: drips move DOWN only and slowly (dread pace); tendrils
stretch and release, never retract upward; the wet glisten must
survive in motion (matte liquid is a REJECT).

═══════════════════════════════════════════
## INTAKE PROTOCOL
═══════════════════════════════════════════
1. Upload clips here for audit (mp4). Claude checks every clip
   against V1-V8 frame-by-frame (automated frame extraction and
   pixel checks, same discipline as the stills).
2. Approved clips are named vfx_<effect>_<n>_clip.mp4 and
   committed under assets/vfx/clips/ (source-of-truth; the game
   ships sheets, not videos).
3. 8 approved clips gate the wiring task. Partial approval fine:
   any unconverted effect keeps its still + the T68R envelope
   treatment as fallback.

═══════════════════════════════════════════
## WHAT CC DOES AFTER APPROVAL (T68R, authored then)
═══════════════════════════════════════════
Frame extraction (ffmpeg, ~24 frames per clip at even spacing),
256px, black-floor clamp + radial soft mask per frame (the F2
law), packed sprite sheets (JPEG-in-.png grids, target 0.6-1.2MB
per effect), ping-pong playback in the compositor at 24fps
scaled by vfxT(), plus the surviving T68 code work: ground-dim
contrast engine under combat+ effects, white-hot core tint pass,
eased envelopes on the remaining still sprites. One task, one
gate ceremony, device verdict after.
