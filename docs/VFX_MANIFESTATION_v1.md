# VFX_MANIFESTATION_v1 — Card Manifestation VFX System
Owner directive, 2026-09-13. Source: "Card Manifestation VFX System —
System Design v1" (PDF, prepared for Claude Code handoff).
STATUS: EXPERIMENT. Built entirely inside lab/vfx-manifestation/ in the
game repo. The live game is not modified until the owner rules the
export after the full plan has proven itself. Supersedes the
VFX_DEVELOPMENT_PATH_v1 pilot triad (Deva landing / Brahmastra /
Gayatri) as the active VFX direction; all standing laws survive
(engine sole authority, black-ground/no-text source rules, script
veto, device verdict over preview).

## CORE DECISION
Pre-rendered actors + real-time GPU compositing. Every clash becomes a
board-anchored manifestation: the attacking card awakens, its character
emerges, performs the resolved action, the defender reacts, and both
apparitions fizzle back into their cards. The board remains visible
throughout.

- KLING IS THE AUTHORING BRUSH: isolated character performances
  generated offline, curated, background removed, frames + optical
  flow extracted, shipped as optimized atlases — never source MP4s.
- THE EXISTING RENDERER IS THE STAGE: the game's GPU/Canvas overlay
  supplies card portals, actor placement, projectiles, bloom, impact,
  particles, numbers, and faction-specific exits.

## NON-NEGOTIABLES
1. The game resolves first. Animation depicts the emitted result and
   never determines state.
2. No movie per card pairing. Compose reusable attacker, defender and
   outcome modules.
3. Intensity and duration follow rarity and consequence.
4. The real board stays visible — gameplay, not a cutscene.
5. Retain WebGL and Canvas fallbacks, reduced-motion behavior, and
   match-specific lazy loading.

DESIGN PRINCIPLE: characters carry the storytelling; traditional VFX
supplies integration, impact and finish.

## RUNTIME ARCHITECTURE (presentation layer above the event stream)
1. GAME RESOLUTION — existing engine mutates state, emits events.
2. CLASH CONTEXT — UI adapter combines source, target, card identity
   and resolved outcome.
3. MANIFESTATION DIRECTOR — builds the timed entry / action /
   reaction / impact / exit plan.
4. LAYERED RENDERER — GPU (WebGPU/WebGL) performs the plan; Canvas
   remains the floor.
5. BOARD SETTLE — numbers, badges, discard state and turn flow
   become fully readable.

ClashContext contract (example shape; field values must be mapped to
the engine's REAL event vocabulary at STEP-0):
{ sourceUid, targetUid, attackerId, defenderId, attackerFaction,
  defenderFaction, action, outcome, amount, lethal, shielded,
  rarity, intensity }

## CHOREOGRAPHY GRAMMAR — the 3.2-second manifestation
- AWAKEN 0.0–0.4s: card lifts, portal opens, faction energy gathers.
- EMERGE 0.4–1.0s: actor rises from the artwork, takes board-space.
- ACT 1.0–2.0s: signature move travels visibly source → target.
- OUTCOME 2.0–2.6s: defender blocks, breaks, takes damage, is
  destroyed.
- FIZZLE 2.6–3.2s: actors dissolve; numbers and final board settle.

IMPACT MUST LAND: at contact — 50–70ms hit-stop, directional flash,
one restrained camera impulse, layered impact sound, delayed number
reveal. Animation makes the mechanical result easier to read, never
hides it.

DURATION BY IMPORTANCE:
- Common 1.5–2.0s (partial apparition, fast shared action)
- Uncommon/Rare 2.0–3.0s (full actor, identifiable weapon/movement)
- Epic/Legendary 3.0–4.0s (bespoke entry, action, aftermath)
- Mythic finisher up to 5.0s (controlled board takeover; first-use or
  decisive moments)
REPEAT RULE: after the first full performance, repeats may play a
fast version or skip to action + impact.

## ASSET PIPELINE (Kling creates performances, not shipping movies)
01 IDENTITY MASTER — clean full-body reference from approved card art.
02 ISOLATED PERFORMANCE — locked-camera action against pure black.
03 CURATE — reject identity drift, unstable anatomy, unusable
   silhouettes.
04 MATTE — remove background; clean hair, cloth, weapon, mount edges.
05 FRAME SELECT — keep ~24–48 decisive frames per action.
06 OPTICAL FLOW — motion-vector maps for smooth interpolation.
07 PACK — high/medium/low atlases via the current pipeline
   (scripts/build_vfx_sheets.py).
08 COMPOSITE — runtime portals, shadows, lighting, particles,
   outcome VFX.

KLING SOURCE RULES: locked camera, fixed scale; full silhouette
visible; pure black background; no environment, text or interface;
strong separation around limbs and weapons; neutral first and final
particle state; one action per clip; separate attack and reaction
clips; left/right variants when mirroring fails; short decisive
motion, no idle padding.

## REUSABLE CONTENT MODEL — a vocabulary, not a pairing matrix
Card-type manifestation:
- HERO/UNIT: character emerges, performs signature action.
- ASTRA: the weapon/projectile manifests and travels.
- MANTRA: sigil/apparition/environmental phenomenon fills the area.
- ARTIFACT: object rises, establishes its field, settles back.
- REVIVE: actor reforms from faction particles at the restored card.

Reusable action families:
- ATTACK-family: mounted charge | spear | sword | arrow | caster |
  beast | crush
- DEFENCE: guard | shield | dodge | absorb | resist | guard break
- OUTCOME: damage | lethal | destroy | bind | steal | heal | revive
- EXIT: Deva lightning | Asura embers | Naga mist | Vanara wind

AUTHORING ECONOMY: Common cards reuse archetype motion with
character-specific art; Epic/Legendary/Mythic earn bespoke
performances.

## PILOT (vertical slice): Meghnad versus Indra
Proves mounted entry, two actors, cross-board travel, guard
penetration, injury response, faction exits.
Sequence: both cards lift and open faction portals → Indra emerges in
a blue lightning guard → Meghnad and armored horse burst from the
attacking card → the horse crosses the lane, magenta spear current
seeks a gap → Indra blocks with Vajra, the current penetrates →
Indra recoils, cracked shoulder armor, drops to one knee → damage
appears; both dissolve through faction exits.
Pilot asset set: meghnad_enter, meghnad_direct_attack,
indra_enter_guard, indra_guard_break, indra_injured, asura_exit,
deva_exit.
NOTE (STEP-0): the beats must be mapped to the engine's real event
vocabulary (12 types; there is no "attack" event) before any asset or
runtime work.

## PERFORMANCE CONTRACT (target phone)
60 FPS on supported mobiles; <16.7ms total frame time in routine
clashes; <5ms routine VFX GPU contribution; max 2 simultaneous
actors; 20–25MB preferred match-specific VFX transfer budget; max 1
full-board spectacle at a time.
RUNTIME RULES: prefetch only the two current decks' manifestations;
pool sprites/portals/particles/render targets; bound bloom and
distortion to the clash region; serialize full spectacles; Full /
Fast / Reduced cinematic modes; retain WebGPU/WebGL/Canvas +
prefers-reduced-motion; allow skip/fast-forward for long Mythic
performances; measure decode time, GPU time, dropped frames, peak
memory on devices.

## IMPLEMENTATION ORDER + ACCEPTANCE GATE
Phase 1 MODULARIZE — extract VFX runtime and recipes (into the lab;
  the live index.html is NOT modified under the experiment rule).
Phase 2 DIRECT — ClashManifestationDirector + resolved ClashContext
  adapter.
Phase 3 STAGE — portal, actor anchoring, facing, depth, shadow,
  layer order.
Phase 4 PROVE — integrate Meghnad vs Indra with audio, hit-stop,
  damage timing.
Phase 5 CERTIFY — fallbacks, reduced motion, repeat speed, target
  mobile performance.
Phase 6 EXPAND — archetypes, faction exits, bespoke high-rarity
  manifestations (only after the pilot's device verdict).

ACCEPTANCE GATE FOR THE PILOT: correct source and target on both
player sides; outcome matches emitted state every time; no face,
costume, horse or weapon drift; no layout shift, no stale actor after
skip; smooth Full and Fast modes on target phones; Canvas and
reduced-motion paths functional; automated event-routing and cleanup
tests pass; owner device verdict — cinematic, readable, worth
expanding.

## REFERENCE MAP (read before editing)
index.html (VFX config, overlay, recipes, choreography dispatch) ·
src/engine.js (canonical mechanics + events) ·
docs/VFX_GPU_PROGRAM_v1.md · docs/VFX_SPRITE_DIRECTION_v4a_authoring.md ·
docs/VFX_SPRITE_DIRECTION_v5a_scale_grammar.md ·
docs/VFX_ANCHOR_CLASSIFICATION_v1_1.md · scripts/animate_vfx.py ·
scripts/build_vfx_sheets.py

FIRST TASK: the reusable manifestation runtime + the Meghnad-versus-
Indra vertical slice only, inside the lab. No catalogue production
until the device verdict closes the pilot.

## AMENDMENT 2026-09-13
OWNER RULINGS (2026-09-13), amending VFX_MANIFESTATION_v1:
A1. SINGLE-ACTOR MANIFESTATION. When a Hero or Unit card is played,
    its character emerges from the card, performs its signature
    action toward the enemy side, and fizzles. No defender actor,
    ever. One clip per card, never per pairing. After the fizzle,
    the BOARD shows the outcome (power change, destroy, buff) from
    the board difference — the animation is the statement, the
    board is the truth. Nothing is depicted on the target.
A2. SCOPE. Hero and Unit cards only. Astra, Mantra, Artifact keep
    their existing effect VFX and are out of scope until one
    character's manifestation passes the owner's device verdict.
A3. PILOT = Meghnad on play (emerge, mounted charge + spear strike
    toward the enemy Hero's side, fizzle; board then shows the Hero
    −2). Exempt from the rarity duration ladder as the proof of the
    full grammar; the ladder applies from expansion onward.
A4. ACTORS ARE A SECOND ASSET CLASS: real alpha, normal (source-
    over) blending, no vignette, trimmed rectangular cells with
    pivot data, 512px, NO motion vectors. Effect laws (v4a "no
    objects", T72 brightness-to-alpha) stay in force for effects
    and are explicitly carved out for actors.
A5. BUDGET: actors ~10 MB per match on top of today's effect load;
    loaded on first play, released after; one live actor (two only
    if wire plays overlap).
A6. MATTING: rembg, installed by CC inside lab/vfx-manifestation/
    tools/ in a Python venv (nothing global) — LAB-4's step.
A7. THE LAB IS PUBLIC ON PAGES, UNLINKED (for the WebGPU verdict).
    Kling sources and matted frames are gitignored always; only
    packed atlases are ever committed. Pages capacity (682 MB of
    ~1 GB) is a standing watch item — report the tracked total on
    every lab commit.
A8. THE DOC: explicit word — this rung commits
    docs/VFX_MANIFESTATION_v1.md, with an "AMENDMENT 2026-09-13"
    section appended carrying A1–A8 verbatim. That file is the one
    exception to the experiment rule for this rung only.
