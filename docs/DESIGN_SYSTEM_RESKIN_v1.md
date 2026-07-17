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
    M4), BEGINNER + DEATH MATCH difficulty tiers. OMITTED ENTIRELY:
    the mockup's JOURNAL roundel — nothing exists behind it, and
    inventing a control violates the DS. Locked controls NEVER block
    BEGIN, and locked difficulty tiers never move the selection.
