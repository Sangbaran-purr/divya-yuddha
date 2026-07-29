# VFX_GPU_PROGRAM_v1.md — THE T70 PROGRAM CHARTER
# Owner mandate (on record, three device verdicts): in-game VFX must
# reach Unity-level AAA; change the pipeline if needed. This charter
# is that change. Owner rules by committing this doc; each phase
# gates on a CC report AND an owner device verdict before the next.

═══════════════════════════════════════════
## THE THESIS
═══════════════════════════════════════════
Market-standard VFX = simulation-grade source content + GPU shader
playback. The source content is already proven (owner verdict: the
Kling clips are smooth and awesome). The runtime is the confirmed
gap: Canvas2D cannot do HDR bloom chains, motion-vector
interpolation, heat distortion, or particle counts beyond ~120.
Therefore: RUNTIME FIRST. Authoring upgrade is Phase 4, optional,
and gated on the post-runtime verdict.

═══════════════════════════════════════════
## PROGRAM LAWS
═══════════════════════════════════════════
PL1. ENGINE UNTOUCHED, every phase. Full parity ceremony every
     commit (byte-identical test.js, 40.9/59.1 anchor, suites
     green, 0 console.log).
PL2. THE OVERLAY ARCHITECTURE: the GPU layer mounts as a
     transparent canvas above the board. Game DOM, UI, engine,
     input: unchanged. Only the effects renderer changes.
PL3. TRIPLE FALLBACK, always shippable: WebGPU where available
     (Safari 26 / iOS 26 / Chrome / Edge / Firefox) -> WebGL
     automatically -> the existing Canvas2D system as the floor.
     The T66-T69A stack is never deleted; it is the floor.
PL4. ASSETS CARRY OVER: the 21 painted masters, the 8 Kling clips,
     and their sheets are the textures of the GPU layer. Nothing
     regenerated, nothing wasted.
PL5. RECIPE API STABLE: effects keep firing through the same
     VFX.spr* entry points and the T66 tier system. The GPU layer
     implements the same contract, so the renderer can be swapped
     again later (including fully custom WebGPU) without touching
     dispatch.
PL6. Runtime scaffold: Pixi v8 (WebGPU-native, automatic WebGL
     fallback), vendored locally (no CDN dependency in the game),
     used as plumbing only — all visual quality lives in our own
     WGSL/GLSL shaders and assets. If the scaffold ever caps
     quality, PL5 licenses replacing it.
PL7. Reduced-motion kills the GPU layer entirely, same as always.
PL8. Every phase ends with a continuation-doc update and an owner
     DEVICE VERDICT naming what lands and what does not.

═══════════════════════════════════════════
## PHASE 0 — FOUNDATION (one CC session)
═══════════════════════════════════════════
Vendor Pixi v8. Mount the overlay canvas (board-sized, transparent,
z above #vfxcanvas). Detect WebGPU/WebGL, report which path the
device took. Load ONE effect (surge) as GPU textures from the
existing sheets. Migrate the surge recipe behind PL5. A/B debug
toggle (GPU surge vs Canvas2D surge). Gate: parity + real-match
probe + owner sees GPU surge on device and rules "continue".

═══════════════════════════════════════════
## PHASE 1 — THE SHADER PACK (the AAA delta; 1-2 CC sessions)
═══════════════════════════════════════════
S1. HDR BLOOM CHAIN: brightness-threshold extract -> multi-scale
    Gaussian pyramid blur -> additive recombine with tonemap. The
    real thing, not a box blur.
S2. MOTION-VECTOR INTERPOLATION: offline step first — CC computes
    per-frame optical flow (OpenCV Farneback) from each Kling clip
    and packs MV maps alongside the sheets. Playback shader warps
    adjacent frames along the vectors: 32 frames plays like the
    original 240. This replaces crossfade blending on the GPU path.
S3. HEAT DISTORTION: a refraction shader displacing the BOARD
    pixels behind surge/smoke/spectacle (the overlay samples a
    snapshot of the board region). The effect that makes fire hot.
    If board-sampling proves too costly, distort within the effect
    only and report.
S4. GPU PARTICLES: instanced quads, thousands, replacing the 120-
    cap procedural layer on the GPU path (embers, sparks, motes
    riding every effect per tier).
S5. GROUND DIM moves into the layer as a shader vignette (radial,
    soft, never rectangular by construction).
Gate: A/B screenshots per shader, frame timing on throttled
profile, device verdict.

═══════════════════════════════════════════
## PHASE 2 — FULL MIGRATION (1-2 CC sessions)
═══════════════════════════════════════════
All nine effects on the GPU path with tier-scaled shader dressing
(ambient = texture + light particles; combat = + bloom weight +
hit-stop sync; spectacle = + distortion + particle burst + dim).
Venom stays forward-only. Lightning gets its 4 variants as
textures + additive bloom (its procedural bolts may retire on the
GPU path if the textured version wins the A/B). Canvas2D floor
verified intact by forced-fallback test. Gate: full-match probes
both matchups, perf, memory, device verdict.

═══════════════════════════════════════════
## PHASE 3 — CERTIFICATION
═══════════════════════════════════════════
Matrix: WebGPU device, WebGL-only device, Canvas2D floor, reduced
motion, Capacitor webview note (iOS 26+ = WebGPU; older iOS =
WebGL path — verify the wrapper's webview version passes the same
detection). Memory ceilings measured. Payload report. The
continuation doc records the certified matrix.

═══════════════════════════════════════════
## PHASE 4 — AUTHORING UPGRADE (OPTIONAL, verdict-gated)
═══════════════════════════════════════════
Only if the Phase-2 device verdict still falls short of the bar:
upgrade source content to true fluid simulation. Paths, in order
of preference at that time: EmberGen 2.0 macOS edition if shipped
(roadmapped by JangaFX; exports flipbooks + motion vectors + 6-
point lighting natively) · Blender Mantaflow (free, macOS, slower
iteration) · EmberGen 1.2 via a Windows/cloud box. New sims flow
into the SAME pipeline (sheets + MV maps) — the runtime does not
change again. A direction doc with per-effect briefs and veto
criteria (the art-program pattern) charters it then.

═══════════════════════════════════════════
## SEQUENCING VS THE REST OF THE PROJECT
═══════════════════════════════════════════
This program runs on LANE-M. It does not block LANE-W (StakeEscrow
queue unchanged) or the owner 60-seconders (A3 remains first and
oldest). The hero-moment composites (vortex mockup) become a
Phase-2+ addendum authored INSIDE the GPU layer, not before it.
