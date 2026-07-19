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
