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

## AMENDMENT 2026-09-18 — THE EXPORT (EXPORT-1)
OWNER RULINGS, consolidated at the export rung as ruled at LAB-19 ("docs/
consolidation of all lab amendments happens at the EXPORT rung"). They
amend VFX_MANIFESTATION_v1 and the 2026-09-13 amendment above; A1–A8
stand except where an item below narrows them. Numbered X so no label
collides with A1–A8 or with the budget line E1.
X1. THE PREMIUM RULING (owner ruling in chat, 2026-09-16, first
    recorded in the lab at LAB-19), in full:
    1. Actors are Heroes-only by default. A Hero card's play may
       manifest as an actor.
    2. Meghnad is grandfathered as the pilot. He stays an actor
       although he is a Unit.
    3. Unit actors are reserved as a future paid-cosmetic tier. No
       other Unit gets an actor under the default rules.
    4. Mythic and Legendary Astras, Mantras and Artifacts get the
       premium effects track.
    5. Lower rarities, and all other Units, keep their existing VFX.
X2. THE MEGHNAD GRANDFATHER IS SCOPED TO THE LAB (owner ruling,
    EXPORT-1 scope amendment). Meghnad stays the lab's pilot and
    reference; he is NOT exported, and his live-game presentation
    stays exactly as it is. The live game's rule is exception-free.
X3. THE EXPORT'S PRESENTATION LAW: HEROES MANIFEST, ALL IN-PLACE, ALL
    NATIVE EXITS. Verified against the twenty exported actors: every
    one exits natively (no procedural FIZZLE), and every one stands
    where its card stands — sixteen because their contact is a nova,
    four (Indra, Bali, Kartikeya, Makardhwaja) because their
    travelScale is 0. Meghnad was the only actor that charged and the
    only procedural exit.
X4. ADDITIVE EFFECT CLIPS AND THE WEAPON CARVE-OUT (owner amendments,
    LAB-19). (1) The premium track admits additive effect clips:
    Mythic and Legendary Astras, Mantras and Artifacts may play
    black-background emissive Kling footage additively, alongside
    procedural work. The "no Kling" line is narrowed to "no
    actor-class assets": no mattes, no rungs, no per-actor memory
    ladder. (2) The v4a carve-out: an Astra's effect may depict the
    Astra's own weapon — the weapon is the spell. The v4a "no
    objects" law stays in force everywhere else.
X5. E1 — THE EFFECT-CLIP BUDGET LINE, BESIDE A5 (owner ruling,
    LAB-19). An additive effect clip is capped at the effect layer's
    hi-rung class, ~18 MB decoded (3072×1536 RGBA = 18.00 MB). It is
    loaded on play and released after, and at most one effect clip
    is decoded at once. A chain (two clips) keeps E1 unchanged: its
    clips decode one after the other, the first released before the
    second decodes.
X6. THE EFFECT ROTATION RULE (owner ruling, LAB-20b): Actors never
    rotate (the upright law stands). A directional effect may rotate
    its layer to align its motion feature with its board path: the
    rotation is taken from the actual caster-to-target vector,
    applies only while the feature is in motion, and eases back to
    the clip's authored orientation before its impact frame. An
    effect's authored orientation is kept at its impact.
X7. FAIL-OPEN (owner ruling, LAB-20a), and where it falls in the
    live game (EXPORT-1/7). Beats never wait on a decode: the cast
    and contact sounds fire on time, the board lands on the engine's
    AFTER, and a clip that is not ready or fails simply does not
    draw. In the live game, fail-open FALLS BACK TO YESTERDAY'S GAME,
    NEVER TO ABSENCE: a routed effect clip that is not ready, or
    fails, at its moment draws the card's classic sprite instead. A
    failure is logged to the console and to the battle log's
    diagnostics — never narrated, no player banner.
X8. SCALE IS MEASURED LEGIBILITY (owner ruling, LAB-21/3). 2.4 card
    widths is the effects shelf's default, not a law: each clip's
    scale is set by measured legibility over the real board.
X9. THE WIRE-CLOCK RULING (owner ruling, EXPORT-1/1 as amended): ONE
    SPEED EVERYWHERE. Actors play FULL in every mode — solo, story
    and the wire — and the player's Relaxed/Normal/Fast speed
    setting does NOT scale actor manifestations: the certified tempo
    is the presentation, uniform for all players. Full on the wire
    is an owner ruling with the measured cost accepted: +4.5 to
    +6.6 s of a fresh per-move 120 s budget, on the move after a
    Hero is played, at most three Hero plays per player per match,
    launch pool only (the server plays no wave cards). Effects cost
    0 ms of wire clock everywhere by design: they draw on the game's
    own beats and re-time nothing. Consequence, binding for
    EXPORT-2: the choreography watchdog becomes plan-aware (its
    budget taken from the running plan) as the FIRST item built,
    before any actor route — Vasuki's Full manifestation (8,018 ms)
    exceeds today's fixed 8,000 ms cap.
X10. THE EXPORT RULINGS, binding for both export rungs (EXPORT-1):
    (a) Split: EXPORT-1 = the three premium effects (Vajra,
    Sudarshana Chakra's travelling chain, Pashupatastra); EXPORT-2 =
    the twenty Hero actors, after EXPORT-1 lands and verifies.
    (b) Actor rung for EXPORT-2: 256 only; 512 is a separate later
    ruling, the Pages headroom reserved for Brahmastra's rebuild and
    future waves. (c) The opponent's centre-screen showcase stays
    for routed Heroes (reveal, then manifest), revisitable by owner
    ruling after device experience. (d) Sounds: sfx_unit_clash at
    the play; the spectacle boom moves to the CONTACT instant; native
    exits are silent; the bespoke-sound wishlist stands. (e) Routing
    is data: a card plays its clip or actor only while it is listed
    in assets/manifest/registry.json; removing its entry returns it
    to its classic presentation without a revert. (f) Brahmastra is
    excluded: its live sprite stays exactly as it is until the
    owner's rebuilt clip re-runs the template. (g) The lab suite's
    experiment-rule check (G1) re-anchors to each ruled export
    commit; the runtime copy is regenerated and the lab restamped.
X11. THE EXPERIMENT RULE, AMENDED NARROWLY (owner ruling, EXPORT-1).
    An export rung may touch the game's index.html and game-side
    assets to port the lab's certified presentation. src/engine.js
    stays UNTOUCHABLE — zero engine lines; the export is
    presentation only. The lab stays intact and working: everything
    is copied out of lab/, nothing moves.

## AMENDMENT 2026-09-18 — THE HEROES ENTER THE GAME (EXPORT-2)

Y1. THE PLAN-AWARE WATCHDOG, built first. The choreography
    watchdog's budget is per step: 8,000 ms for an ordinary step, and
    a Hero manifestation raises its own step's budget to its plan's
    total + 2,000 ms (choreoBudgetFor). Every new step resets it.
    Vasuki's Full plan (8,018 ms) runs under a 10,018 ms budget; the
    same tick with the old flat cap trips on him, and the game's
    manifest suite pins exactly that (H11, falsifiable).
Y2. TWENTY HEROES, ONE LAW. Every Hero the engine has — the twelve
    launch Heroes and the eight wave Heroes — is routed; Meghnad
    (a Unit) is not. Each plays AWAKEN → EMERGE → ACT (contact on its
    contact cell) → SETTLE with a native exit, in place, at the 256
    rung, Full in every mode (solo, story, the wire). Every other
    card keeps its presentation byte-for-byte.
Y3. THE BATCH STAYS WITH THE GAME. The manifestation's context is
    built from the whole batch (so the board difference is split into
    what a later event carries and what none does), then its queue is
    emptied: SETTLE floats only the un-evented part (GL-4 — Indra's
    aura +1s float for the first time), and the game's own loop plays
    the rest of the batch as it always has. Per Unit, the SETTLE float
    plus what the later events carry equals its whole change.
Y4. PRESENTATION CHOICES MADE IN THE PORT. The stage runs Canvas 2D
    (its default); the game's Pixi layer stays the only GPU context
    on the page. The actor's own contact impulse replaces the
    spectacle screen-shake at the play (never both); the game's
    card-pulse and callout stay, so the plan's pulse is a no-op.
    Prior is always 0 (a Hero enters once per match).
Y5. FAIL-OPEN, TO THE LETTER. Not ready at the play, a refused
    decode, a decode still pending at EMERGE (or one that never
    settles), a missing manifest, no actors in the registry, or
    reduced motion: the Hero plays today's landing. The manifestation
    never waits on a decode; one that lands after the Hero was handed
    back is released at once. Failures go to console.warn and the
    battle log's diagnostics (layer 'actor'), never narrated.
Y6. MEMORY. Compressed bytes are prefetched when a routed Hero enters
    a visible hand; the atlas decodes on play, alongside AWAKEN, and
    is released after SETTLE. One actor decoded at a time: the peak
    is the largest single actor (14.23 MB).

## AMENDMENT 2026-09-18 — BRAHMASTRA JOINS THE PREMIUM SHELF (EXPORT-3)

Z1. THE PIN IS REVERSED. Brahmastra's live presentation was pinned
    (EXPORT-1/X10f) until the owner's rebuilt clip re-ran the template.
    LAB-22 certified that clip (commit ce5e15a), so the registry now
    routes it: the fourth premium effect, moment "play". Meghnad remains
    the only pinned entry.
Z2. THE CLASSIC SPRITE IS THE FALLBACK. sprBrahmastra stays in the
    game byte-for-byte; its one call site is gated behind
    fxOwnsMoment('brahmastra', fire), the Pashupatastra pattern. A clip
    not ready at the cast never starts and the sprite fires on the cast
    as before; a clip that fails after the cast fires the sprite late,
    once — never absent.
Z3. TOP-FLUSH, AS A FRACTION OF THE HALF. The game takes LAB-22's player
    verbatim: a new "enemy-half-top" placement and plates recorded as a
    fraction of the enemy half (Brahmastra: 0.93). The game's halfOf
    now reports the half's top and width; a half that reports neither
    plays no plate. The top-flush positional dependency (LAB-22/4)
    carries into the game: re-rule if the anchor or the scale changes.
Z4. TIMING. The impact (the landing, cell 26) lands on the first destroy
    at 1443 ms Normal / 866 ms Fast; wire-clock cost 0.

## AMENDMENT 2026-09-19 — THE DEVICE MATRIX (EXPORT-4)

AA1. MEASURED, NOT ASSUMED. The live game's drawn geometry was
    measured on 16 viewports (4 phones, 8 tablets portrait and
    landscape, 4 laptops) and is kept as src/device_matrix.json. Every
    rule below is argued from it, and the checks replay it.
AA2. THE ACTOR RUNG BY DRAWN SIZE. An actor takes 512 when it draws
    taller than 420 device px (card height x 2.1 x min(DPR, 2)), else
    256. 420 sits just over the most any phone draws (407), so every
    phone keeps the rung the owner approved; DPR-1 laptops stay on 256
    (they draw at most 318 px, less than the phone). Retina laptops at
    1440 px and wider, the 1194x834 iPad and the 12.9-inch iPad Pro
    take 512. Fallback: 512 -> 256 -> the classic path. The rung is
    decided at play from the live card; prefetch takes the layout's
    implied rung.
AA3. THE FITTED LAW for the row weapons (Brahmastra 0.93, Pashupatastra
    1.047): the plate's width is the certified fraction of the enemy
    half's width, clamped so its height never exceeds the half's
    height. It never engages on a phone; it fixes the landscape
    overflow (Brahmastra at 1280x800: 928x522 -> 408x230).
AA4. PASHUPATASTRA converts to the fitted law and hangs TOP-FLUSH. Its
    token top band's hard cut hides at the half boundary on every
    screen: the LAB-21 positional dependency is RESOLVED BY ANCHOR.
AA5. THE CARD FLOOR for the single-target strikes (Vajra, both
    Sudarshana clips): they stay card-width, but a card counts as at
    least 0.294 x the half's height wide — just under the narrowest
    card ratio on the 390 px phone — so where the field outgrows the
    cards (430 px phones, portrait tablets, the iPad Pro) the strike's
    height lands near 0.84 of the half. Both Sudarshana clips size from
    the same floored width, so the disc hand-off is unchanged.
AA6. UNCHANGED: every atlas byte-identical; every impact pin and beat
    timing; the 375 px phone in rung, plate and timing (Pashupatastra's
    width to within 0.1 px, its position moved top-flush by ruling).

## AMENDMENT 2026-09-19 — RESILIENCE (EXPORT-5)

BB1. THE DESIGN FREEZE (owner, binding for EXPORT-5 and every later
    rung): the certified animations are immutable. Every atlas,
    portion, plate size, tempo, plan and impact frame stays
    byte-identical; the suite pins one digest over all 73 certified
    files in assets/manifest. A proposal that would change how a
    certified animation looks or plays in the normal case stops for an
    owner ruling.
BB2. THE FIRST-CAST LAG was not our code. The play beat is synchronous
    work plus two timers; 12 of 12 cold casts were on time. The one
    catch was a pause across the whole host renderer: an independent
    heartbeat ran 601 ms late and frames dropped from 358 to 288, with
    no long task. The clip therefore answers to the game's real beat,
    whatever delays it.
BB3. THE BEAT GATE. A routed cast listens for the event its contract
    names (Vajra and Brahmastra: destroy; Pashupatastra: damage;
    Sudarshana: its bite). If the clip reaches its impact before that
    beat, it FREEZES on the pre-impact cell (impact - 1), the weapon at
    maximum tension, redrawn until the beat. No looping, no synthesized
    motion. Sudarshana's disc freezes at its arrival point. On the beat
    the impact fires and everything after it plays, shifted by the
    lateness. A beat that arrives on time or early leaves the
    animation byte-identical to the ungated player. A beat within one
    clip frame after the impact shifts nothing; its first impact draw
    can land at most one frame later.
BB4. THE CAP. If the beat has not come 1,500 ms after the planned
    impact, the clip stands down (cleared, released, impact never
    drawn) and the classic sprite takes the beat through the existing
    late-fire and ownership paths. The glue records beat-late-cap in
    diagnostics; it is never narrated.
BB5. THE RETRY. One helper per asset URL covers effect specs and
    atlases and actor specs and atlases: an initial fetch, then retries
    at 2, 8 and 30 s, then give up. The count resets only after a
    fetch and decode succeed. A failed decode evicts the bytes so a
    retry fetches fresh ones. Every step fails open to the classic
    path, and nothing waits on a retry. This also fixes the EXPORT-4
    actor prefetch, which retried on every render.

## AMENDMENT 2026-09-19 — VASUKI VENOM STRIKE ENTERS THE LIVE GAME (EXPORT-6)

CC1. THE RULINGS, verbatim. "Export Vasuki Venom in live game." Then, on the STEP-0
    decisions, "Go." — meaning: A = hand-entry prefetch only (no match-start
    prefetch) AND the ready-anchored rise approved; B = the drain side-check
    approved (it also corrects the classic plate in Naga mirrors); C = the
    staked-road striker derived from the cast's play event approved (the classic
    drain plate and the flood become live on the staked road); D = the flood
    ending a still-playing rise approved. Lanka Dahan is not in scope (reshoot).
CC2. THE PACKS. The two LAB-24 packs (venomstrike_rise, venomstrike_flood) are
    copied byte-identical into assets/manifest/effects/. The certified set
    extends 73 -> 77; the original 73 are unchanged (the registry differs only by
    its one new route). One route, "venomstrike": the RISE at the cast,
    replacing sprVenomSurge; its nested "drain" moment, the FLOOD at the
    empowered round-end drain, replacing sprVenomDrain.
CC3. THE RISE. An arming clip at the cast on the CASTER's half, height-fit and
    bottom-flush, no impact, no beat gate, no wire clock. READY-ANCHORED: its
    clock starts when its atlas is decoded, so it always opens on cell 0 (never
    a partial play); if it is not decoded by the cast beat's settle (1,443 ms
    Normal / 866 Fast) it stands down and the classic surge fires once.
CC4. THE FLOOD. Armed at the empowered drain's toast — the striker's OWN drain,
    naming the drained player (the striker's opponent), reading at least 3 — on
    the ENEMY half; its eruption (cell 14 = f077) heard on that drain's FIRST
    venom beat through the EXPORT-5 gate (late: the pre-impact cell holds; past
    1,500 ms: the classic plate takes the beat). It starts 48 ms after the toast
    (29 at Fast): no wire clock. One flood per drain. A rise still playing is
    ended first: one effect decoded at a time, beside the one A5 actor.
CC5. THE STRIKER, by ABSOLUTE seat. The engine roads hold it as
    pl.venomStrike === round; the staked view does not (its flag is always 0),
    so the cast's own play event is recorded (seat, round) and either answers.
    This replaces the old capture, which returned a seat relative to ME while the
    drain plate read it as absolute (right in solo, the wrong half at the wire's
    seat 1). The same pick feeds the classic plate and the flood.
CC6. THE PREFETCH. Hand entry only: Venom Strike entering a visible hand fetches
    both packs' bytes on the shared 2/8/30 s retry; each decodes only at its own
    moment. A staked opponent's first cast (no hand to see) plays the classic
    surge, by fail-open.
CC7. UNCHANGED. The engine; every sound (sfx_astra at the cast, the drain's own
    synth tick; the packs bring no audio); the classic surge and plate as the
    stand-down path everywhere — a player whose fetches or decodes all fail sees
    exactly the game they saw before.

## AMENDMENT 2026-09-19 — LANKA DAHAN ENTERS THE LIVE GAME (EXPORT-7)

DD1. THE RULINGS, verbatim. "Export." Then, on the STEP-0 decisions, "Go." —
    meaning: the frozen set 77 -> 82 confirmed (five files — the chain.json rides
    with the two packs, the Sudarshana precedent); the gold's cold decode = (a)
    accept the measured loss, the lab player verbatim; the caster seat derived
    from the first damage target (the Astra-uid lookup with its silent seat-0
    fallback is retired for this route); an empty caster half = the gold washes
    it, matching classic; a zero-damage cast = nothing plays, matching classic;
    the +1 floaters stay on the classic timer in both paths.
DD2. THE PACKS. The LAB-25 chain and its two packs (effects/lankadahan/chain.json,
    lankadahan_fire, lankadahan_gold) are copied byte-identical into
    assets/manifest/effects/. The certified set extends 77 -> 82; the 77 and the
    original 73 reproduce their digests (the registry differs only by its one new
    route). One route, "lankadahan": the chain at the damage beat, the FIRE
    replacing sprLankaFire; its nested "wash", the GOLD, replacing sprLankaWash.
DD3. THE PLAYER. The page's inlined player is the LAB-25 player, verbatim: the
    afterglow role, the strike-afterglow chain and its timeline, the
    second-segment handoff, the divider-flush halves.
DD4. THE FIRE. Cast at the play beat (the ordinary routed-Astra hook) on the
    ENEMY half, width-fit 1.0 of the half's width, height-capped, divider-flush.
    Its impact (cell 26 = f088) is heard on the cast's FIRST damage event through
    the EXPORT-5 gate: on time byte-identical; late, f087 holds; past 1,500 ms it
    stands down, the gold never decodes, and the classic pair fires once each. It
    starts ~35 ms after the cast (21 at Fast): no wire clock.
DD5. THE GOLD. At the burn + (18/16) x vfxT x 1000 (1,462.5 ms Normal, 877.5
    Fast), the game's own wash timer, positional (no gate, no impact), on the
    CASTER's half, divider-flush. The fire is released BEFORE the gold decodes:
    never two decoded, no frame draws both. Its cold decode (54 ms desktop, ~104 at
    4x CPU, ~140 at 6x) may skip its first fade-in cells — accepted (DD1).
DD6. THE BURN BEAT. The chain owns the classic burn and wash only if its FIRE is
    decoded by the first damage beat; otherwise the classic pair plays on the
    classic timer. A clip failing after the beat fires the classic burn (or, for
    the gold, the classic wash) late: never both, never neither. The +1 floaters
    ride the classic timer in both paths (DD1).
DD7. THE CASTER SEAT. The other side of the first damage target, on every road —
    measured: on the staked road a spent Astra's uid is recovered only through the
    Hall's lastMove card id; the damage target needs no such lookup (DD1).
DD8. UNCHANGED. The engine; every sound (sfx_astra at the cast, the debuff blips
    on the damage beats; the packs bring no audio); the classic pair as the
    stand-down path everywhere — a player whose fetches or decodes all fail sees
    exactly the game they saw before. A zero-damage cast plays nothing, as classic.

## AMENDMENT 2026-09-23 — THE PREMIUM EFFECTS REACH THE OPPONENT'S CLIENT (EXPORT-8)

OWNER RULINGS, 2026-09-23, verbatim:

  "I approve all your recommendations."

meaning, as put to him and approved:

  (1) at STAKED match start the receiver prefetches the routed launch
      pool of the OPPONENT'S FACTION (public via the seat's faction;
      that faction's routed Hero actors at the device's rung + its
      routed premium Astra/Mantra clips) — own-hand prefetch
      unchanged; free road unchanged (hands visible, prefetch already
      correct); everything keeps failing open to classic; 0 ms wire
      clock.

  (2) STANDING LAW — REMOTE-CAST PROOF: no export is proven until a
      genuine remote cast has been seen on the RECEIVING client, on
      both roads, in a real browser (not jsdom, not the AI on the same
      machine). Record it beside the EXPORT-5 laws.

### THE FAULT (measured, MP-FIX-1 STEP-0)

The owner reported that Hero actors and the premium Astra effects play
only on the client that cast them. The first suspicion — that the
wire-apply path bypasses the premium glue — is WRONG and the code
refutes it: both roads land in `runAction` (`wireDrain` → `wireApply`
on the free road, `applyView` on the staked road), so the same
`playEvent` beats, the same `fxCast`, the same Hero-actor gate.

The real gate is BYTES. Every premium path needs its atlas already
prefetched (`fxReady` / `mfPickRung`); otherwise it stands down and the
classic sprite plays — which is why a remote Astra still showed
something and a remote Hero showed nothing (a Hero has no classic
sprite). Prefetch is driven by HAND CONTENTS
(`fxPrefetchHands` / `mfPrefetchHands` walk both hands).

  * STAKED — a structural gap. `viewToState` builds the opponent's hand
    as `{uid:null, id:null, hidden:true}` (a count behind the wall), so
    those helpers can never see one routed card of the caster's.
    Measured: the receiver requested only its OWN atlas.
  * FREE — NOT a structural gap. Both hands are in the frame's own
    engine, and the receiver does request the caster's cards.

### WHAT EXPORT-8 CHANGES

`prefetchFactionPool(faction)`, called from `startWireMatch`'s STAKED
branch at the first moment the receiver knows `oppFaction`. It walks
that faction's printed pool and enqueues its routed Hero actors and
routed clips (with a route's `drain` clip, EXPORT-6) through the SAME
helpers and the same shared 2/8/30 backoff. Never awaited, wrapped in
try/catch, 0 ms on the wire clock; any failure leaves exactly today's
classic path. The wall is untouched: a faction's pool is printed and
public — it is not the hand.

RUNG: at match start no board card is drawn yet, so `mfLayoutRung`
reads 256 — the phone rung, and the cheap one. A later desktop cast
that wants 512 finds 256 present and takes it under `mfPickRung`'s
quiet `rung-fell-back` note, rather than finding nothing.

COST, measured on disk (the bytes this adds per staked match):

    devas    7.1 MB @256   (16.4 MB @512)   indra agni varuna kartikeya garuda + vajra brahmastra sudarshana
    asuras   6.2 MB @256   (17.3 MB @512)   mahabali shukra rahu vritra mahishi + pashupata
    vanaras  4.4 MB @256   (10.8 MB @512)   hanuman sugriva angad makardhwaja anjana + lankadahan
    nagas    4.9 MB @256   (12.4 MB @512)   vasuki takshaka shesha padmavati kulika + venomstrike

  ⚠ FLAGGED TO THE OWNER: 4.4–7.1 MB at staked match start, on the
  device's rung. That is real on a phone on mobile data. The ruling was
  explicit and this is built as ruled; the number is recorded here so a
  later rung can narrow it (e.g. the heroes only, or on first sight).

### THE BEAT GATE ON THE RECEIVING SIDE (STEP-0 left this unmeasured)

MEASURED, staked receiver, a 3-event slice (play → damage → destroy):
the choreography held the lock **4,763 ms**. Beats HOLD — a remote
slice choreographs beat by beat with a real lead before impact, not one
flat frame. A staked view is applied THROUGH `runAction`, which is why.

### THE FREE ROAD — A SECOND CAUSE, REPORTED NOT FIXED

Ruling (2) was applied to this rung and the free road FAILED it, so
per the build's own instruction nothing was changed there. What the
two-client browser proof found:

  A cold remote cast — the FIRST cast of a routed card — lands while the
  receiver's prefetch for that card is still in flight. Every clause of
  the Hero gate reads true moments later, but at the instant of the cast
  the bytes were not there, `mfPickRung` returned null, and the actor
  stood down with no note. Re-running the IDENTICAL cast with the bytes
  warm ran the premium actor on the receiver (`rahu`, rung 512, no
  fallback). Same code, same client, same cast — byte-readiness was the
  only variable.

  So the free-road fault is a RACE between hand-entry prefetch and the
  first remote cast, not a structural gap. The caster never sees it: its
  card sat in hand through the mulligan and many renders. This is the
  owner's to rule.

### STANDING LAW — REMOTE-CAST PROOF (beside the EXPORT-5 laws)

  No export is proven until a genuine remote cast has been seen on the
  RECEIVING client, on both roads, in a real browser — not jsdom, not
  the AI on the same machine.

  Why it now exists: jsdom reaches the actor path and then dies at
  `URL.createObjectURL`, so a headless pass can look like proof while
  proving nothing about what the opponent SEES. The race above is
  invisible to every non-browser harness, and to the caster.

### AMENDMENT 2026-09-23 (RESUME) — THE FREE-ROAD RACE FOLDED IN

OWNER RULINGS, 2026-09-23, verbatim: **"Go."** on the three STEP
decisions, which were put to him as:

  (1) free-road race → (a) prefetch the routed pool at the EARLIEST
      moment on BOTH roads — match start (free: both hands' routed
      cards the instant hands are known; staked: the opponent-faction
      pool as built) — never "when the hands render"; (b)
      READY-ANCHORED START for Hero actors and no-impact premium
      plates on remote casts: if bytes are not decoded at the cast,
      the manifestation starts when they land, bounded by the cast
      beat's settle window (the EXPORT-6 Vasuki-rise precedent,
      1,443/866 ms Normal/Fast); past the window it stays absent for
      Heroes / classic for Astras, exactly as today. Impact-gated
      clips keep the EXPORT-5 law unchanged.

  (2) the staked pool stays as built (4.4–7.1 MB @256, once per staked
      match); follow-up queued, NOT this rung: skip the pool when
      `navigator.connection.saveData` is set.

  (3) the staked half of the remote-cast-proof law is completed AFTER
      the sync against the LIVE match server (HALL-SYNC-4's live
      verification) — recorded here as the proof plan.

**(1a) THE EARLIEST MOMENT.** On the free road that is the line after
`newGame` has dealt, inside `startWireMatch` — both hands' routed cards
are knowable there. The hand-entry call inside `render()` stays as the
INCREMENTAL path for cards drawn later; it is no longer the only
trigger. The staked call site is unchanged.

**(1b) THE READY-ANCHORED START.** `mfReadyWait(id, want, ms)` — a
REMOTE cast that finds no bytes waits for them, bounded by
`MF_READY_WINDOW_BASE (1110) * vfxT()` = **1,443 ms Normal / 866 ms
Fast**, the EXPORT-6 precedent through the same scaling the beats use.
On decode inside the window it manifests in place (`ready-anchored`
note); past it, `not-ready-in-window` and exactly today's behaviour.
A LOCAL cast never waits — it keeps today's immediate stand-down, so a
player's own act is byte-identical to before. The waiter settles once,
stops polling, starts no fetch of its own, and touches no wire message.

**PROVEN IN A REAL BROWSER (the new law, applied):**

  * The identical cold sequence that FAILED before EXPORT-8 now runs.
    Fresh page (`MF.blobs` 0 at load and at start), match, mulligans,
    then seat 0's routed Hero relayed as a remote cast: `actorRan
    true`, rahu at rung 256 with the documented `rung-fell-back` (it
    wanted 512, took the 256 that was present). Here **(1a) alone won
    the race** — the bytes were ready by cast time.
  * The waiter was then exercised by FORCING the loss: `MF.blobs` and
    `MF.blobP` cleared immediately before the cast (`rahuReady false`,
    `mfPickRung null`). The **`ready-anchored`** note fired, the actor
    ran at rung 512, and the composite shows Rahu manifesting over the
    opponent's half on the RECEIVING client.

**HARNESS BUG FOUND AND WORKED AROUND (reported, not silently fixed):**
`extractFn` in `src/test_wire.js` takes the first `{` after a
signature, which for `runAction(mutate, opts={})` is the DEFAULT
PARAMETER — it returns the signature alone. Latent until EXPORT-8
became the first check to extract such a function; `runAction` is the
only extracted function with a default, so no earlier check was
weakened. The EXPORT-8 checks read that body by the next top-level
`function` instead.

**THE PROOF PLAN for the staked half (ruling 3).** After HALL-SYNC-4
carries EXPORT-8 to divyayuddha.games, the law is completed live: two
clients, a real staked table on the live match server, seat 0 casts a
routed Hero and a premium Astra (and Vasuki's drain and Lanka's pair),
and seat 1's screen is captured. Until that is done, the staked half of
this export is proven by driven checks and a jsdom drive only — and is
recorded as such, not as seen.

**TWO STRUCTURAL COUPLINGS THIS RUNG WALKED INTO (recorded for the next
reader, both caught by guards rather than by review):**

  * **A top-level declaration ABOVE the VFX module moves it.** The lab
    pins that module by LINE RANGE plus a sha. `actionActorSeat` first
    landed above it, and R1 went red with the honest detail "0 lines
    differ" — the bytes were untouched, only the range had shifted. New
    top-level declarations belong BELOW the module; the one added here
    says so in place.
  * **The game may not name the lab, even in a comment.** The comment
    explaining the above originally cited the lab path and its COPY
    file, and G2 ("nothing outside lab/ references the lab") went red
    at once. The constraint is now documented without the reference.
