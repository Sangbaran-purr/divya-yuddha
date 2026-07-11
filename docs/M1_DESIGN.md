# DIVYA YUDDHA — M1 META-FOUNDATION DESIGN v0.2 (RULED — BUILD-READY)
# All six decisions ruled by Sangbaran 2026-07-11:
# D1 ✓ 60 Amsha per level milestone · D2 ✓ rank shape approved, tune post-
# telemetry · D3 ✓ quest pool approved (dailies stay partly play-based) ·
# D4 ✓ pace approved (~2 factions/season dedicated) · D5 ✓ SHIP M1 BEFORE
# wave-1 cards (wallet accrues, spend UI gated) · D6 ✓ OPTION A — Sadhana is
# a PARALLEL income stream (extra progress toward the pinned card; fallback
# to earmark model only if the economy sim breaks pace).
# XP · Levels · Ranks · Quests · Coins · Amsha · Sadhana
# Principles (binding, from LIVE_GAME_DESIGN): XP is play-only. Money buys
# time, never permanence. Coins and Amsha never bridge. All constants below
# are TUNABLE (single config object); calibration waits on real matches/day
# telemetry from the playtest.

## 0. THE THREE TRACKS (what each system answers)
- XP/LEVELS: "how much have I played?" — pure volume, never purchasable.
- RANKS: "how well do I play?" — prestige titles from wins/feats.
- ECONOMY (Coins + Amsha + Sadhana): "what do I earn?" — coins for cosmetics
  (M4 sink), Amsha for cards (wave 1 sink).

## 1. XP & LEVELS (replaces the provisional 1+floor(wins/5))
Earn (play-only, win or lose): match completed 20 XP · match won +15 ·
story chapter first-clear 60 · story bonus star first-earn 40 · daily first
match +25. No XP from purchases, ever.
Curve: level N requires 100 + 25×(N−1) XP (to next). L1→L10 ≈ 2,125 XP
(~2 weeks daily casual); soft-infinite, no cap. Level shows on the profile
card where the provisional number sits today — same UI, real math.
Level rewards: coins at every level; Amsha at milestone levels (5/10/15…).
[RULED D1: milestone Amsha amount — proposal 60 per milestone.]

## 2. RANKS (prestige, win-gated, thematic ladder)
Nine ranks by TOTAL WINS (any mode counts; story wins count once per chapter):
Seeker 0 · Disciple 10 · Adept 30 · Rishi 60 · Maharishi 100 · Devarishi 150 ·
Brahmarishi 220 · Avatara 300 · Parashakti 400+.
Rank is displayed beside the name (profile + future multiplayer). Purely
cosmetic prestige in M1; M3 matchmaking MAY consult it later.
[RULED D2: thresholds above are placeholders shaped to ~1 rank/2–3 weeks
for a regular player — approve shape, tune after telemetry.]

## 3. QUESTS (the income lever + the re-engagement hook)
Machinery: quest conditions are PREDICATES over the existing event stream —
the exact machinery story bonuses already use (ch3_no_astra_death etc.).
Every quest below is checkable against events we already emit; no engine
changes.
DAILY (3 slots, drawn from the pool at day-reset; each: 15 coins + 10 Amsha
+ 20 XP):
- Win 1 match · Play 2 matches · Win a round by 8+ · Play 6 Units in one
  match · Use your faction mechanic 3 times (shield/leap/surge-proc/venom-
  apply — resolves per chosen faction) · Win a match with your Hero surviving
  · Cleanse or apply 3 Venom · Complete/replay a story chapter.
WEEKLY (2 slots; each: 60 coins + 50 Amsha + 100 XP):
- Win 7 matches · Win with each of 2 different factions · Earn any story
  bonus star · Win a match in 3 different realms · Destroy 10 enemy Units.
[RULED D3: quest pool approve/edit — the daily pool must stay winnable-
by-losing where possible (play-based, not only win-based), per the XP
philosophy.]
Baseline+quests income model: 40 (wins) + ~30 (dailies) ≈ 70 Amsha/day
regular; dedicated (all dailies + weeklies) ≈ 90–100/day → one faction's
Gupta wave in ~5 weeks dedicated, ~7 casual-regular. Season length target
~12 weeks → dedicated players clear 2 factions + change per season.
[RULED D4: does that pace feel right? The knobs are quest Amsha values.]

## 4. COINS (the parallel soft currency)
Earn: levels, quests, match completion (5/match). Spend: NOTHING in M1 —
the wallet accrues toward M4's cosmetics (board skins, card backs — the
Midjourney reject pile is the supply). Shown on profile from day one so the
number already means something when the store opens.
NEVER purchasable with money in a way that converts to Amsha (the no-bridge
rule); M4 decides if coins are sellable at all.

## 5. AMSHA (the card economy — now with a real sink)
Income: win 10 · first win of day +20 · quests per §3 · level milestones ·
story bonus stars retro-grant 15 each when M1 ships (the stubs finally pay).
Costs (per LIVE_GAME_DESIGN, unchanged): C 40 · U 80 · R 160 · E 400 ·
L 1000 · M 1500.
Sink math (wave 1 Gupta): 3,440/faction · 13,760 total. Ratna: purchase-
first in-season (M4's job), then rotates earnable at these same Amsha costs
next season — the rotation IS the "time not permanence" promise kept.
M1 SCOPE NOTE: the wallet, income, and the SPEND UI ship in M1 only if wave-1
cards exist to buy; otherwise M1 ships wallet+income and the Faction
Introduction's hidden slots gain a "price tag on reveal" tease. 
[RULED D5: ship M1 before wave-1 cards (wallet accrues, spending waits) —
or hold M1 until the wave prototypes? My recommendation: ship first — 
accrual creates anticipation and real telemetry.]

## 6. SADHANA (the pinned-card chase)
The player PINS one card (from the revealed-but-unowned pool); a visible
progress bar on the profile. Every win adds 10 progress toward the pinned
card's Amsha cost; when the bar fills, the card is granted. Pinning is free,
switching pins keeps banked progress on the OLD card (it remembers), one
active pin at a time. Purpose: turns the abstract wallet into a NAMED desire
— "I am 3 wins from Padmavati."
Note Sadhana progress is SEPARATE from the Amsha wallet (it's a second,
focused income stream — effectively doubles income toward exactly one card;
the generosity is deliberate and tunable).
[RULED D6: approve the parallel-stream model vs the alternative (Sadhana
merely earmarks wallet Amsha — less generous, simpler).]

## 7. SURFACES (all UI-layer)
Profile card grows: Level+XP bar (real), Rank title, Coins, Amsha, Sadhana
pin+bar. Quests: a new panel off the landing page (badge shows claimable
count). Day/week reset: the day-key precedent from wins-today extends.
Persistence: localStorage under dy_meta, shaped as a single serializable
object — the deliberate M3 constraint: this object's schema IS the future
server profile; design it once.

## 8. BUILD ORDER
1. Config object (every constant above in one place) + dy_meta store.
2. XP/levels + profile surface (replaces provisional formula; migrates
   existing wins→XP retroactively so no playtester resets to zero).
3. Ranks (pure derivation from wins — trivial).
4. Quest engine (predicate machinery reuse) + daily/weekly reset + panel.
5. Amsha wallet + income hooks + Sadhana pin (spend UI gated on wave 1).
6. Story reward stubs filled (XP/coins/star-Amsha per §1/§5).
Each step is a separate CC task with the standard gate; engine untouched
throughout (everything reads the event stream and match results).
