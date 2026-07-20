# DIVYA YUDDHA — UI DESIGN SYSTEM & RESKIN ROLLOUT v1
# Source of visual truth: the approved landing (landing_final_v11) —
# MJ sky-rotunda plates · final logo lockup · plaque menu · ember field.
# Law of this document: REskin, never REwire. Every screen keeps its
# shipped DOM ids, handlers, and flows (Tasks 30–33 proofs stay valid).
# Every CC task: index.html only · engine untouched · full parity
# ceremony (flag-off byte-identical, 40.9/59.1, ASTRA_DMG set,
# scenario 50 / venom 38 / story 48) · measured gates, not assertions.

═══════════════════════════════════════════════════════════
## 1. TOKENS (one :root block, single source — no per-screen colors)
═══════════════════════════════════════════════════════════
--ink:#070402            page ground
--panel:#160d05 / #2b1c0a  plaque face gradient ends
--gold:#c9a84c           chrome, borders, labels
--gold-hi:#e8c874        emphasis text, fills
--gold-bright:#f4df9a    hover text
--gold-dim:rgba(232,200,116,.25)   quiet borders
--parchment:#d8c9a3      body text
--ember:#ff8c33          fire accent (landing + quest-claim only)
Type: Cinzel (display/labels, tracked small-caps: .22–.34em) ·
Crimson Pro (long body only: story text, quest descriptions).
Radii: plaques use clip-path hex (16px cut); rounded elements 8–10px.
FORBIDDEN on any UI chrome: violet (maya gameplay color), venom green,
faction colors as chrome (they belong to cards/frames only).

═══════════════════════════════════════════════════════════
## 2. COMPONENTS (defined once in a DS block, reused everywhere)
═══════════════════════════════════════════════════════════
PLAQUE-LG   the landing menu unit: hex clip frame (gold bevel gradient),
            dark face, diamond finials, sheen sweep + lift on hover,
            optional .cap subtitle, optional .track progress bar
            (ALL shaped/measured internals display:block — the law
            written by three inline-span bugs).
PLAQUE-SM   same language at tab scale: faction tabs (Collection/Vault),
            filter pills. Min 44px hit target (Task 31 law).
PILL-BACK   the .metaback "‹ Back" pill restyled into plaque-sm skin;
            same class, same handlers, all screens.
CARD-CHROME untouched — card frames, backs, two-flip, zoom lightbox,
            ceremony are shipped and proven; the reskin never enters
            .cc/.cz internals.
PROFILE-PLAQUE / CHIP  the landing profile card + quests chip pattern,
            reused wherever identity/wallet shows.
HEADER      screen title: Cinzel, .3em tracking, gold; flanked by the
            diamond-line flourish from the logo's tagline rule.
EMBER MODULE one shared JS module, density parameter:
            landing 1.0 · narrative screens 0.35 · card screens 0.15 ·
            match screens 0 (never). One canvas per visible screen,
            paused when hidden, killed by prefers-reduced-motion.
SCROLL      every scrolling screen: the metascreen contract —
            column scrolls, stage fixed, flex-shrink:0 children,
            overscroll contain, bottom clearance past fixed footers.
            The masthead-roller is LANDING-ONLY (its signature).

═══════════════════════════════════════════════════════════
## 3. BACKGROUND LAW (the one hard aesthetic ruling)
═══════════════════════════════════════════════════════════
THE PLATES DO NOT FOLLOW THE PLAYER EVERYWHERE.
- CARD-BEARING screens (Collection, Ratna Vault, Sadhana pick,
  deck builder when M2 lands): ground stays INK, near-black, with at
  most a whisper of vignette + ember-0.15. Reason: the board-art law
  — cards are the stars; a painted rotunda behind 44 thumbnails
  murders them. The chrome (plaques, tabs, headers) carries the
  identity on these screens.
- NARRATIVE screens (Story select, Quests, Faction Introduction,
  Settings): the DESKTOP plate, heavily treated — blur(3px),
  brightness .4, plus the landing's dim scrim — as a shared
  "somewhere in the same temple" backdrop. One asset, one treatment
  class, all four screens.
- MATCH screens: untouched in this rollout (see §6).

═══════════════════════════════════════════════════════════
## 4. SCREEN-BY-SCREEN APPLICATION
═══════════════════════════════════════════════════════════
LANDING (#landing) — Task 34, fully specced by the approved mockup:
plates, masthead roller, plaque menu in ruled order, profile plaque,
quests chip, gear, ember-1.0. Gate: scroll/roller/rest-state/plaque-
height proofs at 390 and desktop, measured.

COLLECTION (#collection) + VAULT (#vault) + SADHANA PICK (#sadhanapick)
— Task 35. Ink ground per §3. Faction tabs → plaque-sm. .metaback →
pill-back skin. Screen headers → HEADER component with flourish.
Vault set-panel + purchase gate copy restyled into plaque language
(buttons stay disabled with the M4 gate text verbatim). Sadhana panel
keeps its scroll contract; list rows gain plaque-sm framing. Ember-0.15.
Gate: two-flip, zoom, PIN/BUY, ceremony re-proven through the real
buttons (Task 33 regression suite re-run); grid rects unchanged ±2px.

QUESTS (#quests) + STORY SELECT (#storyselect) — Task 36. Treated
plate ground. Quest rows and chapter rows → plaque-lg with .cap
(claimable state = ember accent + badge, the ONE ember use outside
landing). Reset timers, star states, completion flourish keep ids.
Gate: claim flow through the real button; story chapter launch
unchanged; both screens scroll-proven.

FACTION INTRODUCTION (#factionintro) + FACTION SELECT (#factionselect)
+ MULLIGAN + SETTINGS — Task 37. Treated plate on intro/settings;
faction select and mulligan are match-adjacent overlays: chrome-only
pass (buttons → plaque-sm, headers → HEADER), grounds untouched.
FI inspect and the 22-slot hidden gallery keep all behavior; hidden
slots keep the fi-q treatment (it is a designed tease, not art-pending).
Gate: a full match launched end-to-end from faction select through
mulligan; FI swipe nav intact.

═══════════════════════════════════════════════════════════
## 5. TASK SERIES (order, one CC task each, audit between)
═══════════════════════════════════════════════════════════
T34 landing + DS foundation (tokens + components land HERE, once;
    later tasks may only CONSUME the DS block, never redefine it —
    the selector-specificity law).
T35 card screens (the highest-traffic surfaces; also re-proves the
    entire Task 30–33 interaction suite under new chrome).
T36 narrative screens.
T37 match-adjacent chrome + settings.
Sequencing rule: no task starts until the previous audit passes —
each inherits the DS block and the accumulated regression suite.
Asset manifest (ships in T34, reused after): plate_port.jpg ·
plate_wide.jpg (q86) · logo_lockup_final (web export, q-optimized) ·
grain tile · ember module JS.

═══════════════════════════════════════════════════════════
## 6. EXPLICITLY OUT OF SCOPE (need separate rulings)
═══════════════════════════════════════════════════════════
- The MATCH BOARD and in-match HUD: the board_bg/realm-board art
  direction already governs it; reskinning battle chrome is its own
  lane with its own risk profile. Not touched by T34–T37.
- CUTSCENE frames (#cutscene): shipped visual language; only the
  advance-button chrome may adopt plaque-sm in T37 if zero-risk.
- The Devanagari line, logo usage on sub-screens: sub-screens carry
  the HEADER component, never the full lockup (the name lives on the
  front door and the trailer; screens state their own purpose).

═══════════════════════════════════════════════════════════
## AMENDMENT A1 — TOKEN NAMING (ruled 2026-07-16, during T34)
═══════════════════════════════════════════════════════════
WHY: §1 was written against the approved landing mockup, whose token
names were chosen fresh. The SHIPPED app already had a :root block in
which FIVE of those names existed with DIFFERENT meanings. Defining
§1 verbatim would not have restyled those screens — it would have
BROKEN them (--ink is the exact inversion: light body text in the
shipped app, near-black page ground in §1; 22 sites would have gone
black-on-black). Found by T34's STEP 0; ruled before any code.

THE RULING: §1's VALUES are canon. Where a §1 NAME collides with a
shipped token of different meaning, the value lands under a
non-colliding name, and the shipped name survives as a LEGACY ALIAS
until its last consumer is reskinned. There is still exactly ONE
token block (index.html :root) and nothing outside it defines tokens.

CANONICAL NAMES AS SHIPPED (T34, index.html :root):
  --ds-ink        #070402                 page ground
  --plaque-hi     #2b1c0a                 plaque face gradient, top
  --plaque-lo     #160d05                 plaque face gradient, bottom
  --gold-hi       #e8c874                 emphasis text, fills
  --gold-bright   #f4df9a                 hover text
  --gold-dim-25   rgba(232,200,116,.25)   quiet borders
  --parchment     #d8c9a3                 body text
  --ember         #ff8c33                 fire accent (landing + quest-claim only)

LEGACY ALIAS TABLE (pre-DS; still consumed by un-reskinned screens):
  name          value      role today        uses   collides with §1
  --ink         #e8ddc0    light body text   22     §1 --ink (dark ground) — INVERTED
  --ink-dim     #cbbd96    dim body text     53     (no §1 equivalent; → --parchment-dim)
  --gold        #E8C874    emphasis/labels   105    §1 --gold is #c9a84c — NAMES INVERTED
  --gold-2      #C9A84C    chrome/borders    21     holds the §1 --gold VALUE already
  --gold-dim    #8a7434    solid quiet gold  33     §1 --gold-dim is rgba(...,.25)
  --panel       #201808    single face color 2      §1 --panel is a gradient PAIR
  --line        #3a2e14    hairlines         —      (no §1 equivalent)
  --hi          #F0D080    bright accent     23     ≈ §1 --gold-bright (#f4df9a)
NOTE the gold inversion: shipped --gold (#E8C874) carries the §1
--gold-hi VALUE, and shipped --gold-2 (#C9A84C) carries the §1 --gold
VALUE. So the §1 --gold role needs no new token — it already exists
as --gold-2. This is the single most confusing item in the table and
the main reason the migration is per-screen, not global.

RETIREMENT PLAN (an alias line is deleted when its last consumer goes):
  T35 card screens        — Collection, Vault, Sadhana pick
  T36 narrative screens   — Quests, Story select
  T37 match-adjacent      — Faction intro/select, Mulligan, Settings
  Each task migrates ONLY its own screen: --ink → --parchment,
  --ink-dim → --parchment-dim, --gold → --gold-hi, --gold-2 → the §1
  --gold role, --gold-dim → --gold-dim-25, --panel → --plaque-lo/-hi.
  The match board (§6) is out of scope, so --panel/--line/--gold may
  outlive T37 via .bc and the HUD; the last screen to migrate deletes
  what it can and this amendment is updated with what remains.
  NEVER migrate outside the task that owns the screen — T34 is
  landing-only, and each migration re-runs its screen's regression
  gate.

ALSO RULED IN T34 (recorded so the doc and the build agree):
- FOOTER: the landing footer carries the version string only. The
  reference's "Sound · On" link has NO existing control to bind to —
  #mutebtn lives in #app>header at z-1 and is painted over by the
  landing overlay (z-80); measured: elementFromPoint at its own
  centre returns .land-col. Per reskin-never-rewire, no control was
  invented. Sound-on-landing is backlogged to T37, where musictoggle
  lives.
- PLAQUE-SM is DEFINED in T34's DS block but APPLIED in T35. Wiring
  .metaback / .col-tab to it in T34 would change #collection, which
  T34's own regression gate requires to stay byte-identical.
- FLAG GATING: no landing element is flag-gated (grep: #landing never
  reads opts.wave1) and all four suites are engine-only (0 DOM refs),
  so flag-off byte-identical is carried by engine.js being untouched.
  No gating was implemented. The parity ceremony still runs as a gate.

── A1 MIGRATION LEDGER — updated by T35 (2026-07-16) ──
MIGRATED: #collection · #vault · #sadhanapick (+ the shared .metaback
pill-back, which every screen consumes). These rules now read ONLY DS
tokens: --ds-ink (ground) · --plaque-hi/--plaque-lo (faces) ·
--gold-hi (labels/emphasis) · --gold-bright (hover/price) ·
--gold-dim-25 (quiet borders) · --parchment (body text).
VERIFIED: zero var(--ink|--ink-dim|--gold-dim|--panel) reads remain in
the three screens' rules (scripted audit over each rule, card-chrome
selectors excluded).

REMAINING FILE-WIDE USE-COUNTS (was → now):
  --ink        22 → 20     --ink-dim    53 → 47
  --gold      105 → 91     --gold-2     21 → 20
  --gold-dim   33 → 29     --panel       2 →  2
  --hi         23 → 16     --line        6 →  6
Owners of the remainder: T36 (Quests, Story select) · T37 (Faction
intro/select, Mulligan, Settings) · and the MATCH BOARD + card chrome,
which are out of the T34–T37 rollout entirely (§6) — .bc/.hc/HUD and
the .cc/.cz/.ap card-chrome rules keep --panel/--line/--gold/--ink*
until a separate ruling covers them. So --panel (2) and --line (6) will
almost certainly OUTLIVE T37: both are match-board tokens.

⚠ --gold-2 CANNOT BE RETIRED BY THE PER-SCREEN MIGRATION, and T35 hit
this: A1 says the §1 --gold role (#c9a84c chrome/borders) "already
exists as --gold-2", so a migrated screen that needs that role must
read var(--gold-2) — the three migrated screens legitimately do (5
reads: .col-tab:hover/.on, .sad-opt:hover/.on, .metaback:hover). The
name can only be fixed at the END: once T36/T37 move the last of the
91 var(--gold) reads onto --gold-hi, the name `--gold` is free, and a
single closing edit renames --gold-2 → --gold (its value is already
#C9A84C = the §1 value). Scheduled as the LAST step of T37, not before
— renaming it earlier would leave two names for one role.

ALSO RULED/REPORTED IN T35:
- VIOLET REMOVED FROM THE VAULT (DS §1: violet is the maya GAMEPLAY
  colour and is forbidden as chrome). Ratna panes/badges/set-panel were
  rgba(210,150,230,…) on rgba(20,8,24,…); they now carry the gold
  plaque bevel + plaque face. The card ART is the only colour in the
  Vault. NOTE the .cc-vault "RATNA" badge on collection cards is CARD
  CHROME (out of T35's bounds) and is still violet — the one surviving
  violet in the meta layer; needs a ruling in the card-chrome lane.
- FACTION TINT REMOVED FROM THE SADHANA ROWS (DS §1: faction colours
  belong to cards/frames, not chrome). Rows were deva-gold/asura-red/
  vanara-amber/naga-teal. This LOSES faction-at-a-glance in the picker;
  the .fac-* classes are still emitted, so a ruled affordance (sigil or
  a parchment faction word) can restore the signal without colour.
- PLAQUE-SM is now APPLIED (defined in T34, deferred to T35 as planned):
  faction tabs (.col-tab), sadhana rows (.sad-opt), and the .metaback
  pill all carry the skin. The lightbox's #zoom-close is a .metaback and
  therefore inherits it BY DESIGN (the DS names one pill for every
  screen); no .cz/#cardzoom rule was touched.
- EMBER MODULE generalized to (screenId, density): one implementation,
  N instances. Landing keeps its own rAF (which also drives plate +
  roller) and calls the same Ember.step at density 1.0 — behavior
  unchanged; the three card screens run their own self-terminating
  loops at 0.15.

═══════════════════════════════════════════════════════════
## AMENDMENT A3 — FACTION SELECT (ruled 2026-07-17, during T36)
═══════════════════════════════════════════════════════════
(a) SEQUENCING SWAP. §5's order was T35 card screens → T36 narrative
    → T37 match-adjacent. Faction select builds NOW (T36); the
    narrative screens (Quests, Story select) move to T37. Rationale:
    faction select is the pre-battle gate every PvAI match passes
    through — it earns its rebuild before the narrative surfaces.
    §5's T36/T37 lines are superseded by this amendment.

(b) PROMOTED: CHROME-ONLY → FULL REBUILD, WITH ITS OWN PLATES.
    §4 filed #factionselect under "match-adjacent overlays: chrome-
    only pass, grounds untouched". That is superseded. It is now a
    full metascreen with factionselect_plate_port.jpg /
    _wide.jpg (1024x1536 / 1536x1024 — the landing's dims, so the
    plate maths ports straight), orientation-picked, cover-fit, the
    landing's dim scrim, and an ember instance at density 0.35.
    It LEFT the shared menu_bg group (#landing/#factionintro/
    #storyselect/#quests) — those keep menu_bg until their own task.
    NOTE this extends, not contradicts, DS §3: the ink law binds
    CARD-BEARING screens (cards are the stars). Faction select bears
    crests and chrome, not cards, so it carries a plate like the
    landing.

(c) TILE-GROUND LAW. On a faction tile the GROUND carries the faction
    colour and the CREST carries the identity. The four grounds are
    dark gradients, measured as shipped:
      Deva    linear-gradient(#111d3a → #060a16)   deep navy
      Asura   linear-gradient(#2a0d0d → #140505)   crimson-black
      Vanara  linear-gradient(#0f2413 → #050e07)   forest-black
      Naga    linear-gradient(#0a2422 → #04100f)   teal-black
      Random  linear-gradient(--plaque-hi → --plaque-lo)  plain plaque
    This is the ONE sanctioned use of faction colour outside a card
    frame (DS §1 forbids faction colour as chrome): it is a GROUND
    under a crest, not chrome, and it never touches text or borders —
    the label stays --gold-hi, the border --gold-dim-25/--gold-2.
    Selected state (mockup fidelity): gold border (--gold-2) + outer
    glow + an inner gradient lift (::after), crest lifted 1px with a
    warm drop-shadow, name in --gold-bright.

(d) MASTHEAD RULING. NO logo lockup on this screen. DS §6 stands:
    the name lives on the front door and the trailer; sub-screens
    state their purpose. Faction select carries the HEADER component
    ("CHOOSE YOUR BATTLE" + diamond-line flourish) and section
    flourishes for YOUR FACTION / OPPONENT / DIFFICULTY. A logo
    variant here would be a recorded one-liner override, not a
    default.

(e) BAKED-BUTTON EXCEPTION. begin_battle_btn.png is the game's ONE
    baked-text button — a fixed label, a single use, seated over the
    plate's floor-mandala zone. States are CSS filters ON the image:
    disabled = grayscale(.85) brightness(.5); hover = brightness lift
    + warm glow; active = press scale. EVERY other control in the
    game stays live DOM text (i18n, a11y, and copy edits all die on
    baked text). Do not generalise this exception.

(f) OPPONENT PICKER — ruling (b), a deliberate small capability add.
    STEP 0 found the shipped screen ALREADY let the player choose the
    opponent (a second .fsel-opts[data-side="p1"], default DEVAS) —
    it was never random or derived. T36 mirrors that (four tiles,
    DEVAS default) and ADDS a fifth RANDOM tile. RANDOM resolves in
    the UI at BEGIN via Math.random (the quest-draw precedent);
    startGame() receives a CONCRETE faction, so g.rng is never
    touched and the engine's seeded reproducibility is intact.
    Measured uniform: 8000 samples → 24.3 / 25.9 / 25.2 / 24.6 %.

(g) BEGIN GATING — a ruled deviation from shipped. The shipped screen
    pre-selected DEVAS for the PLAYER, so BEGIN was always live. Item
    F requires BEGIN disabled "until a player faction is selected",
    which is only real if the player starts with none. So YOUR
    FACTION now starts UNSELECTED on every entry and the screen earns
    its name; the OPPONENT keeps the shipped default. Consequence:
    a returning player re-picks their faction each match (the screen
    no longer remembers p0). If that friction is unwanted, the fix is
    to seed p0 from currentFactions and drop the disabled state —
    but then gate 3 is unprovable and item F is dead code.

(h) PROFILE CHIP — prefixed-id mirror. renderProfile() is refactored
    into renderProfileChip(prefix, …) called for '' (landing) and
    'fsel-' (faction select). Duplicating ids would make
    getElementById return only the landing's node and the mirror
    would silently never update. Every write is null-guarded, so a
    prefix whose nodes are absent is a no-op. The levelRolloverPending
    one-shot stays owned by the LANDING chip (no rollover theatre on a
    pre-battle chip). Landing chip proven unchanged pre/post at both
    widths (name, rank, level, bar width, stats, wallet, sadhana).

(i) MOCKUP FIDELITY — what was mapped, what was omitted. Built and
    live: profile chip (top-left), QUESTS + SETTINGS roundels
    (top-right), COLLECTION roundel (bottom-left), TIP plaque
    (bottom-right, static). Visible-locked (data-soon + lock glyph +
    toast, the Multiplayer pattern): DECKS (lands M2), STORE (lands
    M4). ⚠ REVERSED IN 36b — see A3(e-R) below: T36 ALSO locked the
    BEGINNER + DEATH MATCH difficulty tiers; that was wrong.
    OMITTED ENTIRELY:
    the mockup's JOURNAL roundel — nothing exists behind it, and
    inventing a control violates the DS. Locked controls NEVER block
    BEGIN, and locked difficulty tiers never move the selection.

── A3(e-R) — DIFFICULTY TIERS: THE LOCK IS REVERSED (36b, 2026-07-17) ──
T36 LOCKED SHIPPED FEATURES ON A MISTAKEN PREMISE; CORRECTED IN 36b.

BEGINNER and DEATH MATCH were never unbuilt. They are shipped,
measured features delivered by tasks D1/D2/D3 and recorded in
CLAUDE.md: DIFF_META carries all three tiers' chip + caption +
warn flag; renderDiffSelector drives the caption; selectedDifficulty
persists to dy_meta.settings.difficulty; startGame passes
p1Difficulty into newGame; and the engine's DIFFICULTY table
(engine.js ~2190) gives each tier real behaviour —
  beginner   randomPlayP:0.5 · autoMulligan:false · extraCard:0
  advanced   randomPlayP:0   · the launch AI, zero deviation
  deathmatch randomPlayP:0   · autoMulligan:true · extraCard:1 ·
             extraDraw:1 · concession:true · + the scoring overlay
T36 shipped `data-soon` locks + "Coming soon" toasts on two of the
three, regressing live functionality to a "lands with M2 / lands
with the boss-modifier config" premise that was simply false.

36b removes the locks from the markup, the JS guard, and the CSS
(grep-zero on the difficulty data-soon path). All three tiers are
selectable with the T36 selected-state styling, and the caption
under the row is renderDiffSelector's full shipped behaviour,
Rewards multiplier included (×0.8 / ×1.0 / ×1.5) with the
deathmatch .warn treatment.

LESSON FOR FUTURE TASKS: T36's STEP 0 had the evidence in hand —
it enumerated the live diffopts handler and all three DIFF_META
tiers — and the task text's premise contradicted it. A task premise
that contradicts a STEP 0 finding is a STOP-AND-REPORT, exactly like
a ruling clause that contradicts an engine fact.

── 36b ALSO FIXED (same task) ──
- #mullconfirm INVISIBLE: T36 repurposed the SHARED .fsel-start
  class (a text-button style) into an image-button style for BEGIN
  BATTLE (background:none; border:0; padding:0). That silently
  stripped THREE consumers, not one — #mullconfirm (KEEP HAND), the
  settings DONE button, and #fselstart itself. 36b id-scopes the
  image rule to #fselstart and returns .fsel-start to a shared DS
  plaque TEXT button (gold bevel frame, ::before dark face at
  z-index:-1 inside an isolated stacking context so the face sits
  above the bevel but below the label, Cinzel tracked caps, >=44px).
  Mulligan's one sanctioned touch (§4 match-adjacent chrome).
- TILE SIZING: one responsive pass, base = portrait, override =
  desktop (the T34c capability-split pattern). Sizes are CSS custom
  properties (--ft-h/--ft-crest/--ft-name/--ft-word) declared once
  per grid per breakpoint — no duplicated magic numbers. Portrait:
  your-faction 175x102 (crest 62), opponent FIVE-ACROSS 67.6x78.
  Desktop >=1024: your-faction 181x176 (crest 112), opponent
  5-across 124.8x124. Tile grounds gain ~.85 alpha so the plate
  reads through (the A3(c) tile-ground law is unchanged — the ground
  still carries the faction colour, it is merely translucent).

═══════════════════════════════════════════════════════════
## AMENDMENT A4 — COLLECTION (ruled 2026-07-17, during T39)
═══════════════════════════════════════════════════════════
(a) EPITHETS — NO MAP. THE ENGINE IS THE SOURCE. T39's STEP 0 found
    that the planned docs/DEVA_WAVE_EPITHETS_v1.md NEVER EXISTED in
    the repo, and that the premise "wave 66 are unauthored" was FALSE:
    all 176 cards already carry their epithet in-engine as def.sub,
    fully authored (Bhasma Sainika → "Soldier of the Pyre",
    Swayamprabha → "Keeper of the Hidden Vale", Vishalakshi the Pale
    → "Eyes of the Deep"). DEVA_FACTION_CARDS_v1.md has ZERO "EPITHET"
    fields — its epithets live in the card headings and are verbatim
    the engine's sub (Indra → "King of Devas", …); the doc RENDERS
    engine data, and its own header says so.
    RULED: the grid's epithet line reads def.sub live. There is no
    EPITHETS map and no docs merge — a hand-transcribed map would be a
    SECOND source of truth for a field the engine owns, guaranteed to
    drift (the T35-A2 duplicate-FAC_LABEL lesson; the R83/R84 name-keyed
    -data lesson). "Zero invented strings" is therefore true BY
    CONSTRUCTION, not by grep. The epithet doc is formally dead.
    The compendium header gained a one-line note recording this.

(b) GRID WEARS THE BAND; FRAMES LIVE IN THE LIGHTBOX. Measured: the
    shipped frames' BAKED nameplate begins at 66-70% of frame height
    (Indra 69.6%, Surya Dev 68.3%, Vajra 65.9%). Rendering the whole
    frame at grid size therefore duplicates name/power under a CSS
    band and covers the art. RULED: the grid cell shows the TOP 65% of
    the frame (pure illustration, no baked text) and a CSS band carries
    name / epithet / POWER N (or "POWER N/A" for p:0). The art layer's
    aspect-ratio (750/683) makes its height exactly 65.05% of the 5:7
    cell at EVERY width — one rule, no per-breakpoint magic number —
    and the band abuts at top:65%. The ZOOM LIGHTBOX still shows the
    whole frame (.cz is not .cc, so the crop does not reach it).
    Nothing new ships into assets/cards. FEEDS the frame-program §5
    scope ruling: the grid does NOT need a second art export — the
    existing frames crop cleanly because the art zone is consistent.

(c) JOURNAL + REWARDS — VISIBLE-LOCKED (option (a) now, (b) is the
    target). icon_journal/icon_rewards are COMPLETE roundels (ornate
    gold ring + glyph), not glyphs — unlike T36's CSS roundels (dark
    fill, 1px gold border, inline-SVG line art). Shipping them beside
    the CSS roundels makes the LOCKED items richer than the live ones;
    the .locked dim (opacity .5) closes most of that gap and is
    accepted for now. TARGET (option b): when art exists for
    quests/settings/collection/decks/store, ALL FIVE become image
    roundels and the CSS roundel retires. Until then the row is mixed
    by necessity, not by design.

(d) PORTRAIT ADAPTATION (ruled; reversal conditions stated). At <1024:
    filter rail collapses to a horizontal pill row under the tabs
    (scrollable, 44px pills); progress panel is a compact strip (104px
    ring + rarity rows); grid 2-across. At >=1024: 4-across grid, 132px
    ring, roomier rail — same DOM, sizes in the media query only (the
    T34c capability-split pattern).
    REVERSE THIS IF: (1) the filter row's horizontal scroll is missed
    on device (no affordance that more pills exist off-screen) — then
    wrap to two rows instead of scrolling; (2) the 2-across grid reads
    too sparse against 44 cards — then 3-across at 390 with a shorter
    band; (3) the compact progress strip is judged to bury the ring —
    then move progress below the grid as a footer panel.

(e) COLLECTION GROUND — DS §3 IS HONORED, NOT BROKEN. §3 says card
    screens ground on INK because "a painted rotunda behind 44
    thumbnails murders them". T39 carries the collection plate, but
    under a HEAVY treatment: brightness(.34) saturate(.72) + a
    top-to-bottom dim + a vignette. Measured: the plate texel beside
    the progress panel reads rgb(236,211,188) raw but composites to a
    near-ink wash. #vault and #sadhanapick keep the PURE ink ground.
    The law's intent (cards are the stars) holds; the plate is
    atmosphere, not a competitor.

(f) ASSET PIPELINE (T39). Tooling: ImageMagick is NOT installed;
    Pillow (12.3.0) was pip-installed and is now the image tool of
    record for trims/rescales — LOG THIS DEV DEPENDENCY.
    Trim threshold: the four transparent assets carry a sub-threshold
    alpha haze across the whole 1536x1024 MJ canvas, so a naive
    -trim/getbbox (alpha>0) returns ~1500x1023 and does nothing. The
    real bbox only resolves at ALPHA>4 (the dust is alpha 3-4) and is
    stable from there to alpha>32. Trim at alpha>4 with 2px pad.
    Opaque assets (both plates, card_back) ship as JPEG BYTES UNDER A
    .png NAME — the make_thumbs.sh precedent, documented in CLAUDE.md
    ("browsers sniff content"). Alpha verified intact post-trim on all
    four RGBA assets (extrema 0/255, bands RGBA).

═══════════════════════════════════════════════════════════
## AMENDMENT A5 — MULLIGAN: THE DIVINE CHOICE (ruled 2026-07-17, T41)
═══════════════════════════════════════════════════════════
Supersedes the 36b KEEP HAND plaque. This screen sits INSIDE the match
flow (z-index 96, above #hudwrap 95 — a full pre-round-1 TAKEOVER;
cutscene/cardzoom are never active during the mulligan phase).

(a) CANON STRINGS (ruled): eyebrow "DIVYA YUDDHA" · title "The Divine
    Choice" · quote "The first weapon is not steel — it is choice." ·
    confirm morphs "KEEP DESTINY" (0 marked) ↔ "REDRAW FATE (n)" (n>0).
    All live Cinzel — the baked-text ban holds (BEGIN BATTLE remains the
    sole exception). The story #mull-story Brihaspati line stays canon
    where a chapter supplies mulliganLine (ch4: "Three of your ten may
    return to the deck. A wise hand is chosen twice.").

(b) ENGINE MULLIGAN FACTS (pulled in STEP 0, never assumed):
    - CAP N = g.mulliganCount ?? 3. Pulled live, never hardcoded; the
      grid renders G.players[0].hand.length (story hands are 5/8/9/10 —
      the screen only shows at 10 today, but the code must not assume it).
    - RETURN SEMANTICS = SHUFFLE-BACK-THEN-REDRAW, not discard. Marked
      cards are pushed to the deck, the DECK IS SHUFFLED, then the same
      count is drawn from the top — so a returned card CAN come back.
      The confirm help states this exactly: "Marked cards are shuffled
      back into your deck; you draw the same number." No replace/discard
      language (ruled).
    - Once per match, pre-Round-1 only.

(c) ⚠ CORRECTED PREMISE — DEATH MATCH (the task text was the author's
    error, caught by STEP 0). The task claimed "Death Match: 11-card
    hand, mulligan SKIPPED, straight to match." WRONG for the human.
    startGame passes only p1Difficulty, so ONLY the AI (p1) takes the
    tier; startGame calls beginMulligan() UNCONDITIONALLY. The 11-card
    hand and the autoMulligan belong to the AI; the HUMAN is always
    advanced, 10 cards, and mulligans in ALL THREE tiers. The intact
    "skip" is the AI's: d.autoMulligan runs mulligan() in newGame (sets
    p1.mulliganed=true, no UI), and the driver's confirm-time
    mulligan(G,1) NO-OPs (returns [], verified) → exactly one AI
    mulligan per game. Ruling: build normally, human mulligans in all
    tiers; the gate proves the AI autoMulligan skip is intact.

(d) RULED DEVIATION 1 — ONE TRAY (mockup shows twin trays). A single
    row of N lotus slots centered under the medallion; a slot fills per
    mark. REVERSE IF: (1) N ever exceeds ~5 and one row crowds — split
    into two rows; (2) the design wants marked-vs-kept to read as two
    physical piles — restore twin trays (marked / keeping).

(e) RULED DEVIATION 2 — ONE MORPHING CONFIRM (mockup shows twin
    buttons). One DS plaque button: navy face "KEEP DESTINY" at 0,
    gold face "REDRAW FATE (n)" at n>0 (CSS variants of the 36b
    .fsel-start plaque via .mull-redraw). REVERSE IF: (1) users miss
    that one button does both actions (no discoverability that marking
    changes what confirm does) — split into a persistent "Keep" +
    a "Redraw (n)" that only enables when n>0; (2) a twin-button layout
    is wanted for symmetry with the twin trays if (d) is reversed.

(f) CACHE STRATEGY (STEP 0b finding + adopted pattern). GitHub Pages
    repo with NO _headers/netlify/vercel config, NO .github/workflows,
    and ZERO existing ?v= busting — nothing controls asset caching, so
    re-exported assets go stale on device (the recurring "did the new
    frame land?" problem). ADOPTED: a ?v=N version-stamp on asset URLs,
    bumped per asset-changing commit. Applied in T41 to the two mulligan
    plates and the shared ring_progress ref on this screen (?v=1).
    WIDER ADOPTION (recommended, not yet done): stamp all re-exportable
    asset refs — card frames, board plates, the meta plates — so a frame
    re-export (R84 Rakta, R85 Vayu, R87 heroes, the pending Asura wave)
    busts cleanly. Smallest honest pattern; no server config needed.

── A5 ADDENDUM — DEVICE FIXES (T41b, both device-ruled) ──
DEFECT 1 — SCRIM TOO HEAVY (owner: plate must read like faction select).
  Root: TWO compounding crushers — the plate baked at brightness(.36)
  (fsel is .84) AND .ms-dim a FLAT full-screen wash (.74/.5/.82
  everywhere), vs fsel's .fs-dim which is a CENTER radial that leaves
  the open field transparent. Fix: brightness .36→.6; .ms-dim → a
  content-zone gradient (.58 top for the header, .3 mid, .06 in the
  open lower floor). Vignette (.ms-vig) UNCHANGED per the ruling (fix
  the flat scrim, not the edges).
  Measured plate-contribution (raw texel × brightness × (1−dim_alpha)),
  PRE → POST at 390:
    title 7%      10.9% → 28.1%   (composited lum 23 → 60)
    hand 46%      16.8% → 40.6%   (39 → 94)
    help 55%      15.1% → 43.8%   (18 → 53)
    open floor 82% 9.9% → 54.9%   (18 → 99)   ← the plate now reads
  Calibration: fsel is ~12.6% through a tile / 70–84% open field; the
  mulligan post-fix (40% behind hand, 55% open) sits in that band —
  "reads like faction select." Text legibility: gold-bright title and
  parchment help retain clear luminance separation over the brightest
  plate region behind them, plus their text-shadows. FINAL LOOK VERDICT
  RETURNS TO DEVICE (per the ruling).
DEFECT 2 — POWER ILLEGIBLE (owner: restore the mockup corner chip).
  Added .mc-chip — DS profile-chip family (dark radial ground, gold-2
  ring, gold-bright numeral), top-right over the art crop, pointer-
  events:none (never eats the card tap). Numeral 16px@390 / 19px
  desktop (≥16 ruling met); chip 26px@390 clear of the card border.
  P0 cards get NO chip (absence reads "not a power card"); the band's
  POWER N/A line carries them. The band keeps its POWER line on ALL
  cards (redundant with the chip by design; the chip is the glanceable
  one). Grid gap 4→7px @390 (breathing room), cards ~66.8px, 5-across,
  no h-scroll, taps ≥44.
OPTIONAL (applied, not struck): below 480px the epithet line is dropped
  and the name wraps to two lines (line-clamp:2) instead of truncating
  ("Sanjeevani Call", "Kishkindha Crown" now wrap). Verified the band
  does NOT overflow the card at the wrapped height. Reversal: if the
  owner prefers the epithet on phone over full names, delete the
  <480px .mc-epi/.mc-nm override — truncation returns.

## AMENDMENT A6 — HOW TO WIN (Codex page 1) (ruled 2026-07-19, during T45)
RULED ENTRY POINT — the Journal roundel becomes the Codex. The
collection masthead's JOURNAL roundel (T39, visible-locked "Coming
soon", book+quill icon) is now the LIVE Codex entry → opens the HOW
TO WIN screen. Book+quill is the semantic fit for codex content, so
the icon (icon_journal.png) is kept; the roundel loses its
locked/data-soon/lock-overlay and gains id=col-r-codex →
showHowToWin(). No new roundel was minted.
  REVERSAL: if a DISTINCT Journal feature (match history / lore log)
  ever ships, the Codex gets its OWN roundel then and the Journal
  roundel reverts to its own destination.

SCOPE (a) — this is Codex PAGE 1 only. The Codex nav is a pill tab
row: HOW TO WIN active; DEVAS, ASURAS, VANARAS, NAGAS, REALMS are
visible-locked (T36 data-soon "Coming soon" toast, no navigation) —
they stand as the CODEX ROADMAP (each becomes its own page later).

GROUND — .metascreen, DS §3 ds-ink ground + ember 0.15, NO room
plate (the T35 card-screen precedent: #vault/#sadhanapick pattern —
pure ink + vignette ::after). Masthead plaque + live Cinzel "HOW TO
WIN"; back pill → landing. #howtowin registered in COL_HIDE + the
showLanding hide-list; z-index 87.

COPY — CONTENT-LOCKED (owner-approved v2 mockup, transcribed
verbatim): eyebrow; THE OBJECTIVE (6 lines, last in crimson-warn);
THE ROUND FLOW (Round 1/2/3 — subtitle, three steps, coaching, each
an icon triplet icon_cards→icon_swords→icon_shield with → glyphs);
THE ROUND ECONOMY (HOW YOU WIN A ROUND — the engine-true win line
"Higher total power wins the round." + pip rows You 7 / Opponent 5
captioned TOTAL POWER + "Lose the round. Keep your cards."; THE TRUE
COST — two cost lines + italic resource line + the two REAL
committed backs card_back_deva + card_back_asura via factionBackSrc
[T42 double fallback to neutral] with a ⇄ exchange glyph); WHEN TO
PASS (three rows PASS BEHIND?/CONCEDE?/SAVE FOR LATER?); CLOSING
"Discipline is power. Patience is victory."
  ⚠ ONE PHRASED LINE (not from the mockup): the ROUND-ECONOMY
  "engine-true win line" was described, not quoted, in the task, so
  it is phrased as "Higher total power wins the round." — a faithful
  statement of the engine's Yuddha-Row-total round rule. Flagged for
  the owner to lock or re-word.

ASSETS — 5 files, STEP-1 optimized in place: howtowin_hero.png
(1753×897 → 1600×819 JPEG-in-png 310KB), howtowin_namaste.png
(1536×1024 → 1400×933 JPEG-in-png 220KB), icon_cards/swords/shield
(512px RGBA → 160px FASTOCTREE-quantize ~11KB each, alpha 0-254/255
preserved). ?v=1 stamps on every new reference. The namaste panel
gets a CSS radial edge-fade mask (seam-kill in CSS, not baked).

GATES (all green): both widths 390/1280 (no h-overflow; objective/
flow/economy/pass all switch to 2-col at ≥1024; taps back 44 / tabs
40); the Journal→Codex roundel navigates IN and back returns (real
buttons); the 5 locked Codex tabs toast and do not navigate; the two
committed backs load via factionBackSrc; collection/vault/mulligan/
battle/landing regression identical (only the collection roundel row
changed — codex live, rewards still locked, 6 roundels intact;
battle has no roundel row); asset 200s curl-proven; parity — engine
0 lines, test.js byte-identical 40.9/59.1, scenario 50 / venom 38 /
story 48, 0 console.log / 0 console errors. NOT committed.

── A6 ADDENDUM — HOW TO WIN MERGED INTO FACTIONS & REALMS (T45b, owner-ruled 2026-07-19) ──
REVERSAL EXECUTED (A6's own reversal clause fires): the single entry
point for How to Win is now the FACTIONS & REALMS page (#factionintro,
reachable from the landing 'Factions & Realms' button #mode-factions)
— its pre-existing 'How to win' tab (data-tab="win", the default). The
T45 Journal-roundel entry point is REVERSED: the Journal roundel
reverts to visible-locked "Coming soon" (locked + data-soon + lock
overlay restored). The T45 standalone #howtowin overlay, its
show/render functions, the col-r-codex wiring, and the COL_HIDE /
showLanding registrations were all removed → EXACTLY ONE How-to-Win
implementation exists, mounted in the tab (fiRenderWin).

CONTENT — the T45 Codex content is canon and was carried over verbatim
(objective + hero art, round-flow icon triplets, engine-true round
economy [win line "Higher total power wins the round." + You/Opponent
pip rows + TOTAL POWER caption + real card_back_deva/card_back_asura
via factionBackSrc], when-to-pass + namaste with the CSS radial
edge-fade, closing line). Built with fh() into .htw-body using the
reused .htw-* CSS. CONTAINER ADAPTATION: the fi tab lives in .fi-col
(max-width 520, centered, ALL widths — measured, not assumed), so the
content is SINGLE-COLUMN at every width; the T45 overlay's ≥1024 2-col
media and its #howtowin-scoped ground/ember/nav rules were removed.

FALSE-TEACHING REMOVAL — the old 'win' tab's invented gem/point
economy is GONE: the FI_CONTENT.win object (the ROUND-1 pip life-track
"YOU 8 → spend 2, concede / ENEMY 8 → spends 5, wins round", the
margin-equivalence pass rule, and the per-deck copy-limit callout —
all engine-false) was deleted, along with fiRenderEconomy /
fiRenderPassRules. Grep-zero proven on the two flagged strings.

PER-TAB AUDIT (read-only, spot-check — the other five tabs were NOT
edited): all five make engine-fact claims; every claim spot-checked
VERIFIED against src/engine.js —
  · DEVAS: Dharma Kavacha "guards two units, not one" (Kavacha = 2
    designations ✓; this was the v1.1 fix for the fabricated
    "Indra's Net").
  · ASURAS: Chandrahas "first Astra each round amplified" ✓; Ahamkara
    "double a giant, he dies at round end" ✓.
  · VANARAS: Rama Naam "+2 to every Vanara Unit" ✓; Hanuman "every 4+
    Vanara lands with +1 on entry" ✓; Kishkindha Crown "Leap feeds
    both units, Leap twice per round" ✓.
  · NAGAS: Venom "−1 at round end" ✓; Karkotaka "Venom strikes on
    every enemy turn" (R10) ✓; Sarpa Satra "Venom doubles this round"
    (sarpaDouble ✓); Rama's Signet "switches your faction mechanic off
    entirely" — VERIFIED board-wide (def: "Your Vanara Units … Venom
    on them is negated", floors at 1) ✓; "Devas vs Nagas ~40:60" =
    the LAUNCH BASELINE 40.9/59.1 ✓.
  · REALMS: the effect line renders REALM_INFO.fx at RUNTIME
    (engine-derived) → engine-true by construction; thrives/suffers
    prose is guidance (Swarga hero-answer copy already corrected).
  NO false teaching surfaced on spot-check. CAVEAT: this was a
  spot-check of the numeric/mechanic claims, not an exhaustive
  line-by-line audit — the gem economy proved content can survive a
  "corrected to engine truth" pass, so a dedicated full audit of the
  five prose tabs remains available if the owner wants it.

GATES (all green): entry from landing #mode-factions → win tab → the
corrected content (real buttons); grep-zero on the two economy
strings; Journal roundel toasts "Coming soon" again (no nav); the T45
asset set (hero/namaste/icons/backs) renders in the tab both widths
(single-column in the 520 fi-col, no h-overflow, panels fill 488px);
the other five tabs render unchanged; collection roundel row intact (6
roundels); landing/vault/mulligan/battle identical; parity — engine 0
lines, test.js byte-identical 40.9/59.1, scenario 50 / venom 38 /
story 48, 0 console.log / 0 console errors. NOT committed.

## AMENDMENT A7 — DEVAS CODEX PAGE + FI-COL WIDEN (ruled 2026-07-20, T47)
Authority: docs/DEVAS_CODEX_CONTENT_v1.md. The Devas tab of the
Factions & Realms page (#factionintro, data-tab="devas") now renders
the dedicated Devas codex (fiRenderDevas) — §1 hero + chips + pillars,
§2 Dharma Shield panel, §3 strengths/altar/weaknesses, §4 core
strategy, §5 the Celestial Host, §6 signature synergies, §7 matchup
guidance, §8 closing + CTAs. Every card render is the T41b codex mini
(.fic-mini: art crop 65% + name band + power chip, tappable → inspect);
every txt shown is the LIVE engine txt (verbatim by construction,
pulled from DECKS.devas). The old fiRenderFaction('devas') content is
replaced; the other 5 tabs are untouched.

THE WIDEN (ruled): .fi-col max-width 520 → 960 at >=1024; phone
unchanged. The 5 tabs built for 520 (How to win, Asuras, Vanaras,
Nagas, Realms) are constrained to 520 CENTERED inside the wide column
via `#fi-body > *:not(.fi-devas-page){ max-width:520px; margin:auto }`
(inside the >=1024 media) — only the Devas page uses the full 960, so
no untouched content reflows. Measured at 1280: fi-col 960, devas page
928, each other tab 520, no h-overflow.

CLAIM TABLE (final rendered text ↔ engine):
  [VERIFY-1] shield-block — draft "ignores the next source of damage;
    the shield breaks instead" was the WRONG mechanic. STEP 0 pulled:
    a shielded Unit is `astraProtected` → it drops out of every
    single-target Astra's targetSpec (untargetable; e.g. Agneyastra/
    Gandiva/Vajra → 0 targets), AoE Astras iterate opp.units directly
    and PIERCE, Venom drain is unaffected, shields are sticky per-round
    (no absorb/break). FINAL rendered line: "A shielded Unit cannot be
    targeted by the opponent's single-target Astras. Board-wide Astras
    still strike it." (a [VERIFY] resolution within protocol — the
    shield exists, described precisely; NOT a STOP.)
  [VERIFY-2] shield-limit — `shieldCap(pl)` = 1 by default (Kavacha →
    2). FINAL: "By default you may hold one Dharma Shield at a time." ✓
  [PULLED] Dharma Kavacha "…protects TWO Units instead of one." =
    kavacha def txt verbatim ✓ (rendered mini txt === engine).
  [PULLED] "Brahmastra overrides all shields and immunities." =
    brahmastra def txt fragment ✓.
  [PULLED] §5 six host txts (indra/surya/brihaspati/vayu/vajra/gayatri)
    = live DECKS.devas txt, verbatim ✓.
  [PULLED-baseline] Naga "~40:60 at launch" = the launch anchor
    Deva-vs-Naga 40.9/59.1 ✓.
  [ED] intro / chips / strengths-weaknesses phrasing / strategy /
    synergy results / closing — editorial voice, no engine claim.

CTA WIRING (all proven through real buttons): §5 [View Full
Collection] and §8 [View Deva Collection] → colFaction='devas';
showCollection() (lands on the Devas collection tab; the collection's
own BACK returns to the landing). §8 [Build a Deva Deck] →
visible-locked, toasts "Coming with the Wave" (no nav). §8 [Continue
to Asuras] → fiSelectTab('asuras') (tab switch). Every card mini →
fiOpenInspectCard('devas', c) (the existing FI inspect).

ASSETS — 3 files, optimized in place: devas_codex_hero (1920×819 →
1600×682 JPEG-in-png 273KB), devas_codex_altar (1536×1024 → 1200×800
234KB), devas_codex_shield (1254² 377KB). ?v=1 stamps.

GATES (all green): claim table verified (rendered === engine); both
widths — 390 single-column stacked, 1280 the devas page at 960 with
2-col shield/key-cards/host/strengths/strategy, the 5 other tabs at
520, no overlap/h-scroll, minis tappable; all 3 CTAs real-button
proven; the other 5 tabs + the win(45b) tab render unchanged at BOTH
phone and 960; regression landing/collection(44)/vault/mulligan/battle
identical; parity — engine 0 lines, test.js byte-identical 40.9/59.1,
scenario 50 / venom 38 / story 48, 0 console.log / 0 console errors.
NOT committed.

## AMENDMENT A8 — ASURAS CODEX PAGE (ruled 2026-07-20, T48)
Authority: docs/ASURAS_CODEX_CONTENT_v1.md. The Asuras tab of the
Factions & Realms page (data-tab="asuras") now renders the Asuras
codex (fiRenderAsuras) via the T47 shell — the same §1–§8 structure
and .fi-d*/.fic-* classes as the Devas page, faction='asuras', crimson
theme (.fi-asuras-page recolors the faction-identity accents only;
the strength-green / weakness-crimson semantics are left intact). The
codex mini helpers were parameterized by faction (fiCM/fiCMtxt/fiCMtrio
now take faction); the widen selector became `#fi-body >
*:not(.fi-codex-page)` so BOTH codex pages use 960 at >=1024 (measured:
asuras 928, devas 928, the other 4 tabs 520, no h-overflow). Every card
mini renders LIVE verbatim txt from DECKS.asuras (post-R90). The old
fiRenderFaction('asuras') content is replaced; all other tabs untouched.
⚠ BUILD NOTE: a comment `/* … .fi-d*/.fic-* … */` closed early on the
`*/` inside `.fi-d*/`, silently eating the crimson rules — caught by a
CSSOM check (rule absent), reworded; the lesson: no `*/` glob-strings
inside CSS comments.

CHAOS SURGE — the STEP 0 pull: chaosSurge(g,pi,times,amount=3) is
Asura-only; per `times` it picks a RANDOM friendly non-ghost Unit
(g.rng) and adds `amount` power, then sets chaosThisRound (for Kali).
CALL-SITE AMOUNT TABLE (the complete set, T48 pre-commit reconcile):
line 1642 floor surge = +1; line 1678 Asura Astra = +3 (default); line
1698 Asura Mantra (EXP-H) = +3 (default); line 1717 Chandrahas ON PLAY
= +3 (default). So the only REACHABLE amounts are +3 and +1. NO call
site passes +2 — the `// EXP-I: +2 from Unit plays` comment on line 818
is VESTIGIAL (that experiment was never wired; a unit/hero play that
doesn't otherwise surge falls through to the +1 floor at 1642), so +2
is UNREACHABLE and the shipped S2 line's two amounts are complete.
Triggered immediately by Asura Astras (nearly all read "Triggers Chaos
Surge") AND Asura Mantras (EXP-H); a +1 floor surge fires on any Asura
play that didn't otherwise surge (engine.js ~1642). Chandrahas doubles
`times`; Vidyutastra fires twice. R37
negation-source: Manasa cancels effect AND surge (surgeNegated);
Brahmadanda cancels effect only → the caster's Surge still fires.
FINAL S2 [VERIFY] core line shipped: "When you play an Asura Astra,
Chaos Surge fires: a random friendly Unit gains +3 power. Even an Asura
play that triggers nothing sparks a smaller +1 Surge — chaos always
finds a way." — states the pulled behavior exactly (random beneficiary,
+3 Astra / +1 floor). The R37 negation nuance was OMITTED as advanced
(the doc's one-sentence allowance): an accurate single sentence would
have to introduce Manasa/Brahmadanda with no context and confuse the
codex reader.

CLAIM TABLE (rendered === engine):
  [VERIFY] Surge core — the written line (above) quoted against the
    chaosSurge pull ✓ (no contradiction with the doc's [ED] lead; a
    rewrite-to-truth within protocol, not a STOP).
  [PULLED] "…and some trigger it twice" — Vidyutastra "Triggers Chaos
    Surge twice" ✓; Kali "If Chaos Surge triggered this round, gain +3
    power." = kali def verbatim ✓; Chandrahas double-first-Astra + surge
    twice = chandrahas def ✓. All three rendered mini txts === engine.
  [PULLED] S3 "Board-wide Astras pierce Dharma Shields." + "Single-
    target removal is blanked by a Dharma Shield." = the T47 shield pull
    (AoE iterates opp.units, ignores astraProtected; single-target astras
    filter !astraProtected) ✓.
  [PULLED] Iron Crucible "returns 1, and only to the already-wounded" =
    "your Units that lost power this round regain 1." ✓; Tripura "ends
    the instant any Astra is played — including yours" = "Ends the
    instant any Astra is played by either player." ✓.
  [PULLED] S5 six host txts (mahabali/ravana/kumbha/pashupata/ahamkara/
    chandrahas) = live DECKS.asuras post-R90, verbatim ✓ (spot: pashupata
    rendered === engine).
  [ED] intro / chips / strengths-weaknesses phrasing / strategy / synergy
    results / closing — editorial voice. The mockup's invented mechanics
    (Chaos-spend economy, BHAIRAVA/KAAL ASTRA/ANDHAKAR MANTRA, "44 of 66")
    are VOID and were not built.

CTA WIRING (real-button proven): §5/§8 [View …Collection] →
colFaction='asuras'; showCollection() (lands on the Asuras collection
tab; BACK → landing). §8 [Build an Asura Deck] → visible-locked, toasts
"Coming with the Wave" (no nav). §8 [Continue to Vanaras] →
fiSelectTab('vanaras'). Every mini → fiOpenInspectCard('asuras', c).

ASSETS — 3 files optimized in place: asuras_codex_hero (1653×952 →
1600×921 JPEG-in-png 256KB), asuras_codex_surge (1254² 315KB),
asuras_codex_throne (1844×853 → 1200×555 144KB). ?v=1 stamps. (Note:
hero = the lord, throne = the empty throne — filenames match content
per c8ef995.)

GATES (all green): claim table verified (rendered === engine, Surge line
quoted against the pull); both widths — 390 stacked, 1280 the asuras
page at 960 with 2-col shield/key-cards/host + 3-col strengths/strategy,
the 4 other tabs 520, no overlap/h-scroll, minis tappable; 3 CTAs real-
button proven; the other 5 tabs + the win(45b) + the Devas codex(T47)
render unchanged at both widths (Devas title stays gold — crimson scoped
to .fi-asuras-page); regression landing/collection(44)/vault/mulligan/
battle identical; parity — engine 0 lines, test.js byte-identical
40.9/59.1, scenario 50 / venom 38 / story 48, 0 console.log / 0 console
errors. NOT committed.

── A8 MICRO (2026-07-20) — CACHE-STAMP DISCIPLINE + THRONE DIVIDER ──
CACHE STAMP: all six codex asset refs (devas_codex_hero/shield/altar,
asuras_codex_hero/surge/throne) bumped ?v=1 → ?v=2. RULE: an in-place
asset BYTE-SWAP must bump the ?v= stamp in the SAME commit — otherwise
browsers (and the preview) serve the STALE cached bytes under the old
stamp. This exact bug produced the throne complaint: the owner swapped
asuras_codex_throne.png in place (disk 1600×921, the empty-throne art)
but the ref stayed ?v=1, so the page kept serving the OLD cached
1200×555 image (the standing lord, beheaded by that crop). The v=2 bump
loads the correct fresh image.
THRONE DIVIDER: resolved by the stamp bump — no CSS change. The fresh
empty-throne image is symmetric and self-framing (horns intact at top,
dais + banners), and .fi-daltar img (width:100%; height:auto) shows it
FULLY at both widths with no crop (desktop: img height 129 < container
304 → no clip). No object-position was added — a cover-crop would only
damage the now-correct full composition. (Had the fresh image still
cropped badly, a square regen was the fallback; it did not.)
