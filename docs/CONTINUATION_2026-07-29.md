# CONTINUATION 2026-07-29 — THE VFX RUNTIME COMPLETED, THE CONTENT WAVE OPENS
# Supersedes CONTINUATION_2026-07-28 (ef2f9b0). Read with the full VFX doc
# chain: VFX_SPRITE_DIRECTION v1 + v2 + v3 + v4 + v4a + v5 + v5a and
# VFX_GPU_PROGRAM_v1 (all committed in docs/).
# House laws unchanged and reproven today: engine sole authority · CC
# STEP-0-diagnose-first (refuted TWO of Claude's own prime suspects today
# — the wake-dt theory and the blendMode theory — and found the real root
# both times) · owner rules by one-liners · mode-check step zero (two
# generated references today: the board-VFX guide, the Gwent frames — both
# taken as effect language only per L7) · device verdict authoritative
# (L10) · heredoc arrow-free · plain-text pastes · one CC task at a time,
# repo untouched while CC chews.

═══════════════════════════════════════════
## HEADLINE STATE
═══════════════════════════════════════════
THE VFX RUNTIME IS COMPLETE AS A FEEL SYSTEM. In one day: GPU program
P0-P2H shipped (Pixi v8 WebGPU/WebGL/Canvas2D triple fallback, shader
pack, hero moment), ALL THREE black-tile habitats closed, desktop stage
pass, resolution ladder, linger pass. Owner device verdicts sequence:
black gone -> pixelation reduced (residual accepted: lives in old
384-512px sheet content that Wave 1 replaces) -> pacing fixed by T75
(linger verdict + VFX.linger default value STILL OWED).
NEXT SESSION OPENS AT: MJ Test 1 — C1a Deva landing still (prompt in
v5/v5a docs; F1 script-veto watch; all four edges fade; upscale before
download). Then Claude audits -> writes the first motion brief -> CC
builds scripts/animate_vfx.py (v4a compositor) + seq pipeline mode ->
sheet -> T73 wiring. Test 2 = B1 fire sweep (row-plate class proof).
Both classes proven -> Wave 1 production.

═══════════════════════════════════════════
## TODAY'S SHIPPED CHAIN (all pushed; HEAD ab0f001)
═══════════════════════════════════════════
5807f63 T71 DESKTOP STAGE: board 520px -> min(1000px,90vw) (27%->52%
  at 1920), MINI_MAX 150 desktop, wide table asset (the T42b reversal
  hook), vignette + depth glow. Mobile byte-identical.
126038c T70-DIM: per-effect ground-dim KILLED (it WAS the "black bg"
  complaint's core); VFX.dim flag default false; bloom compensation
  (GPU 1.3, 2D alpha 0.6). Scene-dim reserved for hero moments only.
24bdd8b T70-P2H HERO MOMENT: 4-beat sequencer (anticipation 350ms
  scene-dim+inward-gather / strike +flash+bloom-pulse synced to
  hit-stop / shockwave ring to 100% board width + 1000-particle burst
  / aftermath MV smoke). Perf fix mid-task: particles OUT of the
  bloomed layer (seconds -> sub-ms frames).
9751cdf T70-P2H-fix BLACK-TILE ROOT CAUSE (the big one): NOT
  blendMode (audit showed 'add' everywhere) — opaque RGB JPEGs
  accumulate ALPHA under additive (Pixi add = ONE,ONE both channels).
  Fix: heroKitTex luminance-alpha bake (ring/lightning stills) + MV
  shader outputs alpha=luminance (all 4 WGSL/GLSL branches; covers
  surge/smoke/all future MV effects).
20c494f T72: the THIRD habitat — Canvas2D drawImage of opaque
  JPEGs under 'lighter'. bakeAlpha() on all additive stills + tints
  + sheets at preload (2D smoke sheets draw additive contra old spec
  — CC caught + baked). Aura draw-time tint destination-in fix.
  BLACK TILES NOW IMPOSSIBLE BY ENUMERATION on all paths.
7b7bf56 T74 RESOLUTION LADDER: STEP-0 measured real worst upscale =
  4.1x (ring shockwave STILL at 2096 phys px from 512 src) not 8x;
  RULING CONFLICT resolved ceiling-first: stills -> 1024px (the
  decisive fix), HIGH sheets 512px/64f (31ms adjacent-frame; 768
  was memory-impossible at 540-720MB vs 420MB ceiling — RATIFIED).
  Ladder hi/md/lo, boot heuristic + VFX.gpu.quality override.
  G2: +61% edge gradient. Payload 22.26MB<28. Decoded 300MB<420.
  ⚠ 2D hi-sheet bake ~1.9s async at mulligan (lazy-bake lever
  identified if device janks).
05f4f36 T75 LINGER PASS: attack/sustain/release envelopes — attack
  UNCHANGED (punch+hit-stop), release extends (bloom 160->300, ring
  ->1000, aura ->950, surge ->1150, smoke ->1500, venom ->1300,
  shield ->800, lightning ->750 w/ 300ms afterglow, streak
  unchanged). Hero aftermath 900-1800 -> 900-2900ms; hold only
  +400ms (G3 diff-proven: the ONLY hold change). Particles x1.6 +
  ±30% death jitter; eviction fast-fade 80ms. VFX.linger knob
  0.5-2.0 (release-only) LIVE for owner tuning.
ab0f001 docs v5a SCALE GRAMMAR (owner ruling): Hero/Unit =
  card-anchored landings (G1); Astra = TWO-LAYER (row stage plate +
  card-anchored target strike, targeting-legibility law G2); Mantra
  = pure row wash (G3); Artifact = row ripple arrival + card idle
  glow (G4). Test order ruled: C1a first, B1 second.
Also committed today: VFX_GPU_PROGRAM_v1 (a3f35a5) + T70-P0
  (de8cd50, Pixi vendored ESM-only — v8 UMD discards its global) +
  T70-P1 (b669cab, shader pack: MV optical-flow pipeline
  sheets/mv/, HDR bloom single-pass, S3a distortion + S3b backdrop
  haze DOM flag VFX.gpu.haze, GPU particles cap->3000, uInputSize
  needs highp on GLSL or the layer dies) + T69A (c792b6c,
  round-2-death = thrown frame killed rAF loop permanently, fixed
  try/finally + Canvas2D bloom) + v4 boardscale doc + v4a scripted-
  compositor authoring doc + v5 catalog (f559e10).

═══════════════════════════════════════════
## STANDING VERDICT LEDGER (what the owner's eye has cleared)
═══════════════════════════════════════════
CLEARED: black patches (dead by enumeration, 3 habitats) ·
pixelation (majority; residual = old sheet content, accepted
pending Wave 1 replacement) · board scale/staging (T71).
PENDING OWNER: the LINGER VERDICT — play with VFX.linger in
console (0.5-2.0), report the value that feels right -> one-line
default commit. AND the composition verdict proper (hero moment
vs real Hearthstone footage) — deferred until Wave 1 content
lands since the calibration ruled the gap is CONTENT (Gwent
diegesis), not renderer.

═══════════════════════════════════════════
## THE WAVE 1 PROGRAM (fully chartered, generation-ready)
═══════════════════════════════════════════
Docs: v4 (B1-B6 row plates + scorch + ambient) · v4a (authoring =
MJ layers -> Claude motion briefs in numbers -> CC
scripts/animate_vfx.py deterministic compositor -> PNG seq ->
build_vfx_sheets.py 'seq' mode [NOT YET BUILT] -> existing MV/GPU
playback; Kling = second brush for organic churn) · v5 (3-tier
catalog; F1 script veto ESPECIALLY mantra sigils; F2 Pashupatastra
violet EXEMPT) · v5a (scale grammar above).
TEST 1 (next action): C1a Deva landing. MJ prompt on record in v5;
16:9, highest quality, UPSCALE before download; light ON ground,
nothing legible, four-edge fade, serene gold. Claude pixel-audits
(same discipline: borders per edge-law class, hue, script scan).
TEST 2: B1 fire sweep (W2 row edge law: left/right MAY burn to
edge, top/bottom fade).
Then: motion briefs -> compositor -> T73 diegetic layer wiring
(row-plate renderer, scorch persistence, B6 ambient) -> device
verdict closes Wave 1 -> Wave 2 (feel: round-end, transitions,
number pulses) -> Wave 3 (presence: idle auras, shield stages,
sigils).

═══════════════════════════════════════════
## RUNTIME REFERENCE (for tasks ahead)
═══════════════════════════════════════════
Console knobs: VFX.linger (0.5-2.0) · VFX.gpu.quality (hi/md/lo)
· VFX.gpu.toggle() · VFX.gpu.mv · VFX.gpu.haze (S3b DOM haze,
keep/kill verdict never given — default ON) · VFX.dim (default
false) · VFX.gpu.tuneBloom(threshold,intensity).
Asset tree: assets/vfx/ masters · clips/ 8 mp4 · game/{,hi,md}
stills · game/sheets/{,hi,md,mv} · vendor/pixi.min.mjs (ESM
only). Pipeline: scripts/build_vfx_sheets.py (modes: base, mv,
t74; 'seq' mode is CC's next build).
Known accepted flags: 1.9s 2D hi-sheet bake (lazy-bake lever) ·
S3b haze PL2 exception unruled · story-mode guidance plates
still centered on old 520px geometry (cosmetic).

═══════════════════════════════════════════
## PARKED / OWNER QUEUE (unchanged, aging)
═══════════════════════════════════════════
SEND A3 — the oldest item on the entire project board, ~a week
carried; sixty seconds; their clock starts on the owner's act.
Then: broadcast/ word · S4 squint · G2 audit-scope word · the
07-27 word register (gates IPFS/metadata) · CDX plain-text
pastes · claims word LAST.
LANE-W untouched since 07-27: StakeEscrow -> RE-FREEZE -> claims
S-task; SECURITY_POSTURE_v1 tail unconfirmed.
Parked: Niftyswap/AMM discussion · advanced-features menu ·
hero-moment faction-flavored entry wraps (v5 C2 absorbs).
