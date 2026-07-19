# DIVYA YUDDHA — BATTLE_RESKIN_DESIGN_v1 ("THE KSHETRA")
# Authority doc for T42, the match-table reskin — the heaviest
# regression surface in the game. Approved by owner 2026-07-19.
# Every engine fact herein is marked PULL — CC's STEP 0 pulls it;
# this doc asserts none of them (Indra's Net; the T41 lesson).

## S1 RULINGS
R-A THE HAND IS MINI-CARDS. Hand cards render as the T41b
    component: art crop ~65%, name band, epithet (def.sub), corner
    power chip (absent on P0), sub-480 name-wrap. Full frames with
    rules text do NOT render in the hand; rules text lives in the
    existing zoom. REVERSAL: a desktop-only full-frame variant may
    be revisited as its own task on device verdict.
R-B RED = ENEMY, BY CONVENTION NOT FACTION. Crimson upper field =
    opponent side for all matchups; slate lower = yours. No task
    may tint zones per matchup.
R-C ROOM BANNERS = NEUTRAL ARENA HERALDRY (ruled default; owner
    may reverse on device: regenerate-neutral or CSS overlay).
    Nothing in T42 may depend on banners carrying meaning.
R-D FACTION CARD BACKS. Four dedicated backs (Deva navy, Asura
    ash-ember, Vanara forest, Naga abyss) + the current shipped
    back as neutral FALLBACK. T42 builds the faction-to-back
    lookup with fallback; back assets land as pure asset commits
    (two owner eye-calls open: Asura mask, Naga heads). Back gems
    are FACTION ACCENT, never rarity; two-tone accents legal
    (Vanara precedent). Deck stacks wear the owner's back.
R-E BAKED-TEXT BAN HOLDS. All board text is live Cinzel/DS;
    BEGIN BATTLE remains the only baked-text exception.
R-F ZONE-COOL PIPELINE. The slate field was produced by the
    in-container zone-selective color pass (mask + gold-protect +
    feather); the tall table receives the same pass.

## S2 LAYOUT SPEC
DESKTOP (>=1024): header row (title/subtitle - realm chip +
difficulty chip - settings roundels - ROUND n) - opponent line -
two-zone table center - deck stacks left of table (opponent top,
yours bottom, count badges, faction backs) - score column right
(enemy avatar / enemy plaque red / star pips / your plaque blue /
your avatar) - YOU line - LOG line - mini-card hand row - footer
(avatar + YOUR TURN left, PASS ROUND right).
PORTRAIT (<1024): same vertical order; deck stacks OVERLAY the
board's left margin, score column OVERLAYS the right margin;
board stays full-bleed-wide; hand 5-across T41b sizing. Scroll
contract: fit 390x844 if engine max-hand permits; if not, the
hand row scrolls horizontally, never the board.
BOTH: room plate ground under the 41b-calibrated scrim family;
ember 0.15; the table asset sits above the scrim at full
saturation.

## S3 ENGINE PULL LIST (CC STEP 0 — pull, print, then build)
P1 Realm system: names, current-realm state, what the chip shows
   ("KALKI KSHETRA" is UNVERIFIED mockup text).
P2 Counts: deck/hand both players; whether a discard count exists
   and is surfaced anywhere.
P3 Best-of-3: roundHistory shape, round wins to star pips,
   round-score source for the plaques.
P4 Turn/coin flow: coin flip event, turn indicator source, PASS
   ROUND call, round-transition sequence.
P5 Log: the log() stream; what the single LOG line shows; whether
   a fuller log view exists to preserve.
P6 In-match overlays that must survive: targeting, cutscene
   (z-96), zoom (z-97), mulligan (z-96), deathmatch scoring,
   story beat panels; current #hudwrap (z-95) contents.
P7 Token rendering: venom/ghost/shield/realm marks — restyle
   containers, never logic.
P8 Difficulty chip: what renderDiffSelector persists and how the
   in-match chip mirrors it.

## S4 ASSETS
DONE: battle rooms wide+tall; four faction backs generated (two
eye-calls open); board table WIDE (cooled, accepted).
NEEDED: board table TALL (transparent PNG; cool pass applied at
intake). INTAKE: one batch — ls -lt, mv block, commit, curl
tails. T42 Step 1: mode-checks + Pillow slim-downs (rooms
~370-400KB JPEG-in-png; table + backs keep alpha; backs cropped
to card edge, ~97KB class).

## S5 SCOPE FENCE (what T42 does NOT do)
No interaction-flow changes (reskin in place; STEP 0 maps, gates
re-prove). No engine changes. No per-matchup tinting (R-B), no
banner logic (R-C). No discard-pile UI invention if P2 finds none
surfaced. No animation redesign; motion verdicts to device.

## S6 GATES
G1 Parity ceremony, engine 0 lines, byte-identical suite.
G2 Both widths: overlap/scroll/texel/tap per T39/41b standard +
   the S2 portrait fit contract.
G3 FULL MATCH RE-PROOF, real buttons, all three tiers: coin flip
   - (mulligan) - play unit - targeted effect - astra - pass -
   round transition - round win (pips update) - match end both
   outcomes. Deathmatch scoring overlay intact.
G4 Token/overlay survival: venom ticks, ghost tokens, shields,
   targeting above the new board, zoom above all, story beat
   mid-match renders.
G5 Counts live: deck decrements on draw, hand counts match engine
   per turn, log line updates per play.
G6 Faction backs: lookup proven all four + fallback path.
G7 Regression sweep: every reskinned screen identical pre/post,
   both widths.
G8 Reduced-motion on all new entry points; 0 console.

## S7 OPEN ITEMS FEEDING T42
Owner eye-calls: Asura back mask (kirtimukha reroll?) - Naga back
heads (cobra reroll?) — backs can land after T42 (fallback covers
the gap). Board table tall roll - cool pass - batch intake.

## S8 SEQUENCING GATE
T42 fires only after: (1) owner's 41b phone verdict approves the
scrim family; (2) the asset batch (incl. tall table) is committed
and curl-proven; (3) this doc is committed. R88 landed (ebe0790).
T38 stays queued behind T42.

## S9 T42 BUILD RECORD (2026-07-19 — index.html + docs only, engine 0 lines, NOT committed)
STEP 1 — asset slim-downs (Pillow, alpha preserved where needed):
24,762,414 → 1,895,300 B (92.3% smaller). Rooms JPEG-in-png
(wide 399,696 / port 403,106); tables 256-color FASTOCTREE quantize
(alpha survives: wide 342,916 α0-255 / tall 460,151 α0-254); four
backs 460px JPEG-in-png (deva 58,589 / asura 69,157 / vanara 84,379
/ naga 77,306). Backs cropped to card edge. curl/mode-verified.

LAYERING (built, owner "confirmed as ruled"): bottom→top =
#battlestage room plate (41b-calibrated scrim brightness .42 +
bs-dim + bs-vig) + ember 0.15 gated on #hudwrap (z0, behind #app) →
#field realm floor (board_bg/#realmboard UNCHANGED — the per-realm
board is preserved) → #boardtable two-zone play surface (z2, above
the #field darkening overlay so the table reads at full saturation;
its feathered/transparent edges reveal the realm floor around it) →
.half zones (R-B crimson-enemy / slate-you radials over the baked
zone-cooled table) → board minis + tokens (z3) → #hudwrap score
column (z95). R-E: all board text live Cinzel/DS.

R-A HAND = MINI-CARD: art window = top 65% of the frame
(object-position:top hides the frame's baked name/power), band fills
65%→100% with name + def.sub epithet, corner power chip (absent on
P0), sub-480 name-wrap. Rules text stays in the zoom (openInspect).
The live state classes (focus/targetable/dead/story-hi) are
preserved verbatim. RULING RESOLVED: R-A cites the T41b component
(which carries an in-band "POWER n" line) AND lists a "corner power
chip" — showing power twice. The explicit enumeration governs: band
= name+epithet only, the corner chip is the sole power display.

R-D FACTION BACKS: factionBackSrc(faction) → per-faction back with
DOUBLE fallback — a map miss (unknown faction) and a 404 (missing
file, via img.onerror) both resolve to the shipped card_back.png.
setDeckStack drives deck stacks; setScoreAvatar drives the score
column crest avatars (crest_<faction>_tile.png).

DEVIATIONS (2, both defensible under S5):
(1) TABLE ASSET = TALL EVERYWHERE — #field is always ≤520px
(portrait) because #app is 520-capped on EVERY width, so #boardtable
always uses the TALL table; the WIDE table would object-fit:cover-
crop to a vertical sliver in the 520 column. Desktop today = the 520
match column CENTERED, room plate filling the margins, deck stacks +
score column at the column's edges. board_table_wide.png ships in
the repo, unused, waiting.
    REVERSAL CONDITION: a future task that widens #app on desktop
    (the S2 "wide table + side columns" full-width battle layout —
    out of T42's reskin fence) adopts board_table_wide.png; the only
    change needed is battleSetTable() re-branching on innerWidth
    (its ≥1024→wide branch is preserved in a comment at the call
    site). Until then TALL is correct on all widths.
(2) The dropped "POWER n" band-line (see R-A ruling above).

POST-GATE ADD (item-b affordance): #hand carries a two-line
horizontal edge-fade mask (linear-gradient, 26px each side) so
off-edge hand cards are evident on top of the carousel partial-peek.
An off-edge card the player must reach (the story-hi guided card,
the nearest real analog to a "targetable" hand card — hand cards
never take .targetable in engine play) is centered by the existing
storyScrollToHighlight() (hand.scrollTo); its target math is proven
to bring the off-edge card fully into view (the smooth animation is
rAF-frozen in this preview → device).

GATES (all green): G1 engine git-clean, test.js byte-identical,
40.9/59.1, ASTRA_DMG {Agneyastra,Lanka Dahan,Pashupatastra,Suryastra,
Vidyutastra}, scenario 50 / venom 38 / story 48. G2 mobile 375 +
desktop 1280 (no overlap/h-scroll, portrait fit, crisp minis). G3
full match ALL 3 tiers through real buttons: coin flip → mulligan →
unit → Dharma Shield designation (real 🛡 + tap) → pass → round
transition → pips (round-0 winner=1 → opp gold star) → deck draw
(12→10) → match end BOTH outcomes (DEFEAT 2–0, VICTORY 2–0);
deathmatch = 11-card AI hand + 💀 chip + deck 11/12 asymmetry +
scoring overlay intact. G4 venom badge z3 > table z2, shield badge +
overlay, targeting outline, zoom, STORY BEAT (Brihaspati dual-line +
Yama story-hi glow) all over the new board. G5 counts live (deck
decrement on draw, hand == engine, log per play). G6 all four backs
live (deva/naga/asura/vanara) + map-miss + 404 onerror fallback.
G7 regression: landing / faction-select / collection render, Ember
gateId change backward-compatible (default gate = screenId). G8
reduced-motion (Ember guards reducedMotion(); plate/table/stage no
CSS animation) + 0 console.log, 0 console errors through the flow.
Motion/loudness/final look verdicts → owner device pass.
