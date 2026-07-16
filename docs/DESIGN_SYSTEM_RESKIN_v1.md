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
