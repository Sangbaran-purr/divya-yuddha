# DIVYA YUDDHA — LIVE GAME DESIGN v1.2
# Story Mode · Progression · Monetisation · Hidden Cards · Multiplayer
# Extends GDD v2.0 + GDD_DELTAS.
# ⚠ OWNER AMENDMENT v1.2 (2026-07): Monetisation model = SEASONAL PURCHASE-FIRST
# ROTATION. Each season, 6 of the wave's 22 cards are purchase-only (direct sale);
# they rotate into the earnable fragment pool the FOLLOWING season. All other cards
# are earnable at release via the Amsha fragment economy (§3.5). GDD Pillar 3 is
# AMENDED (not revoked): 'Money buys time, never permanence.' Section 13 to be
# rewritten accordingly in the next GDD revision.

═══════════════════════════════════════════════════════════════════
## 1. STORY MODE — "DIVYA YATRA" (The Divine Journey)
═══════════════════════════════════════════════════════════════════

Single-player campaign. PvE is where hidden cards are discovered, where new players
learn the game, and where the mythology becomes THE product.

### Structure: 4 Books × 7 Chapters (28 battles at launch of the mode)
One Book per faction, playable in any order after Book 1 Chapter 3.

- **Book of Order (Devas)** — Indra's throne under siege; the churning of the ocean
- **Book of Ambition (Asuras)** — Mahabali's rise, exile, and promised return
- **Book of Devotion (Vanaras)** — the search for Sita; the burning of Lanka
- **Book of the Deep (Nagas)** — Janamejaya's serpent sacrifice; Astika's plea

Each chapter = one battle with a SCRIPTED twist (this is where PvE gets interesting
without new engine systems — reuse what exists):
- Fixed realm (chapter 3 of each book locks its faction's home realm)
- Opponent uses a scripted deck + scripted opening (e.g., "Ravana always has
  Chandrahas by turn 3")
- Special win conditions via existing mechanics: "Win without your Hero being
  destroyed", "Win a round while 3+ of your units carry Venom", "Win by 15+ power"
- Boss chapters (ch.7): opponent starts with their Hero pre-played + a unique
  modifier (Ravana boss: Rahu discard is 2 cards; Vasuki boss: Venom is -2 base)

### Rewards
- Chapter win: XP + coins
- Chapter win WITH the bonus condition: a SPECIFIC Gupta-tier card unlock (deterministic
  — players can chase the card they want; this is the discovery fantasy)
- Book completion: that faction's Gupta-tier flagship Epic + a cosmetic board skin
  (wave Legendary/Mythic are Ratna-tier — vault only, per §3.3)
- Story mode is replayable on Hard (boss modifiers active every chapter) for the
  remaining hidden cards

### Engineering note
Story mode = data, not systems: a chapters.json (deck lists, realm, script hooks,
win-condition checks against the event stream, reward IDs) + a chapter-select UI.
The event stream built for choreography doubles as the win-condition checker.

═══════════════════════════════════════════════════════════════════
## 2. PROGRESSION — XP, RANKS, QUESTS
═══════════════════════════════════════════════════════════════════

Builds directly on GDD Section 12 (ranks Seeker→Parashakti stay canonical).

### Match XP formula
- Base: 40 XP win / 20 XP loss (losses must progress — retention 101)
- +10 per round won, +15 first-win-of-the-day per faction (drives faction variety)
- Story chapters: 60/30, bonus condition +40
- XP is NEVER purchasable. Ranks are proof of play. (Pillar-locked.)

### Ranks (GDD §12, unchanged) with one addition
1 Seeker → 2 Disciple → 3 Commander → 4 Sage → 5 Yodha → 6 Parashakti
Addition: each rank-up grants one GUPTA CARD CHOICE — pick 1 of 3 revealed
Gupta-tier cards from a faction of your choice. (Ratna tier is vault-only.)

### Daily/weekly quests (retention loop)
- 3 daily slots: "Win 2 matches", "Apply 6 Venom Tokens", "Play 5 Astras",
  "Win a round after passing first" (quests teach mechanics)
- Weekly: "Win with each faction once" → 1 Faction Pack
- Rewards: coins + XP; never gameplay-exclusive items

═══════════════════════════════════════════════════════════════════
## 3. THE HIDDEN CARDS — "GUPTA VIDYA" (Secret Knowledge) SET
═══════════════════════════════════════════════════════════════════

+22 cards per faction (88 new; 176 total). THE key design decisions:

### 3.1 Release in waves, not all at once
Dropping 88 cards at once = un-balanceable and content-exhausting. Release as
4 waves of 22 (one faction's set per season), matching the GDD's season cadence.
Each wave re-runs the full harness (now 10 matchups × new pool) before ship.
⚠ This AMENDS the GDD Season Roadmap (which planned new FACTIONS — Rishis,
Yakshas, Avatars). Decision needed: hidden-card waves FIRST (seasons 2-5), new
factions after — or interleave. Recommendation: hidden cards first; they deepen
existing factions before widening the roster, and they unlock deck building.

### 3.2 Deck building activates (ends the Season-2 deferral)
44 cards per faction → build 22. Rules: max 3 Heroes, max 1 copy per card
(singleton, Gwent-style — preserves the "every card matters" feel), type minimums
(≥10 Units). Deck builder UI ships WITH wave 1.

### 3.3 Acquisition model (v1.2 — seasonal purchase-first rotation)
Each 22-card seasonal wave:
- **6 RATNA cards (purchase-first)** — incl. the wave's most spectacular
  Legendary + Mythic. Direct sale in the Ratna Vault (₹199–₹499 by rarity,
  ₹1,499 the set of 6; no RNG at premium price points). Exclusive THIS season;
  each carries a unique play animation + profile crest. NEXT season they enter
  the fragment pool at Legendary/Mythic Amsha cost — last season's premium
  becomes this season's grail chase.
- **16 GUPTA cards (earnable at release)** — via the Amsha fragment economy
  (§3.5), story chapter bonuses, rank-up choices, and crafting. Also available
  in Gupta Packs for acceleration.
Collection UI: undiscovered Gupta cards = sealed sigils; current-season Ratna
cards = gold vault entries with preview + price; rotated Ratna cards = grail
sigils showing their Amsha progress bar.

### 3.4 Design guardrail for the 88 new cards
New cards must create NEW DECISIONS, not bigger numbers (Depth Over Complexity
pillar). Design space deliberately left open by launch set: artifact removal for
Nagas (closes the known §9 design hole — the first hidden Naga card should be
the artifact-eater), anti-Venom tech for more factions, positioning payoffs
(Vanara adjacency matters — more cards that care), Mantra-matters Deva cards,
pass-timing Asura cards. Power level: sidegrade philosophy — hidden ≠ stronger,
hidden = different. Harness-enforced: no hidden card >55% mirror-isolated.


### 3.5 The AMSHA fragment economy (attention math)
Mechanic: the player pins ONE card as their **Sadhana** (dedicated pursuit);
all fragment income flows into it, progress bar on the home screen. No random
per-card drops, no dupe-waste; overflow carries to the next pinned card.

INCOME (anchor: regular player = ~4 matches/day, 50% WR → 2 wins/day)
  per win 10 · first win of day +20 · loss +3 (streak protection)
  daily quests +20 · weekly quest +100 (~14/day)
  → casual ≈45/day · REGULAR ≈74/day · hardcore ≈115/day

COSTS (time-to-earn targets; 2-week ceiling on any single chase)
  Common 40 (≤1 day) · Uncommon 80 (~1d) · Rare 160 (~2d)
  Epic 400 (~5.5d) · Legendary 1,000 (~2wk) · Mythic 1,500 (~3wk)

SEASON CHECK (42 days): full wave ≈6,600 Amsha. Regular earns ≈3,100 →
~45-50% via fragments, ~60-70% with rank-ups + story rewards. Hardcore
≈4,800 → near-complete. Nobody finishes week 2; nobody runs dry mid-season.

TUNING KNOBS (change these, never the mechanic): per-win amount, first-win
bonus, rarity costs. Re-check the season math whenever any knob moves.
TOKENS (separate currency): wins also grant coins for packs/cosmetics per
GDD §11.2 — fragments build cards, tokens buy everything else. Never bridge
the two (a coins→Amsha exchange collapses both economies).

═══════════════════════════════════════════════════════════════════
## 4. MONETISATION — IAP DESIGN (extends GDD §11.3 + §13)
═══════════════════════════════════════════════════════════════════

GDD price points stay (₹99 Starter / ₹299 Faction / ₹799 Grand / ₹499 Pass /
₹199 Cosmetic). Additions:

- **Gupta Pack** ₹349 — 10 cards from released waves' Gupta tier, 1 guaranteed
  undiscovered (pity: any 5th consecutive dupe converts to undiscovered)
- **Ratna Vault** — the season's 6 purchase-first cards (§3.3): ₹199–₹499 per
  card, ₹1,499 the set. Rotates to earnable next season. The premium line.
- **Battle Pass** (₹499/6-week season): free track = coins, packs, 2 Gupta-card
  choices; paid track = cosmetics, more volume, +2 Gupta choices, AND one Ratna
  card of the season at 50% vault price (pass drives vault conversion).
- **Cosmetics**: board skins per realm, card backs, victory animations, Hero
  alt-art (Midjourney pipeline makes alt-art cheap — high-margin line).
- **Story Mode**: Book 1 free forever (it is the tutorial and the vault's
  shop window); Books 2-4 unlock by play (rank 2) OR ₹199 each.

Hard rules (v1.2): money buys TIME, never permanence (every card earnable
within one season of its debut); XP/ranks play-only; never bridge coins↔Amsha;
publish pack drop rates in-app (legal requirement in several markets; direct
Ratna sales exempt as non-RNG); Ratna power ceiling ≤52% mirror-isolated is
non-negotiable engineering policy — sell spectacle and earliness, not the ladder.

═══════════════════════════════════════════════════════════════════
## 5. MULTIPLAYER — PHASE 6
═══════════════════════════════════════════════════════════════════

### Architecture (the headless engine is the whole ballgame)
The engine already runs in Node — it becomes the SERVER-AUTHORITATIVE referee:
- Server: Node + the same engine.js; clients send actions ({play, uid, target,
  position} / {pass} / {leap} / {shield}), server validates via playableIndices,
  mutates, broadcasts the event stream. Clients render events — the choreography
  system already consumes exactly this. Zero client trust.
- Transport: Colyseus (simpler) or Nakama (GDD's pick, heavier but has
  matchmaking/leaderboards/auth built in). Recommendation: Nakama, since ranked
  ladder + auth are on the roadmap anyway and GDD §15 already specs it.
- Hidden information (hands, Kalanemi disguise, Vibhishana reveal) finally becomes
  REAL — server sends each client only its legal view. This is the one place the
  single-player engine needs surgery: split GameState into server-state +
  per-player views.

### Rollout ladder (each step shippable)
1. **Friend challenge links** (async-lite: both online, private room code) — the
   feature playtesters will beg for first
2. Casual matchmaking (Nakama pools, faction pick before queue)
3. Ranked ladder (GDD §12 seasonal tiers: Bronze→Mythic) + spectate-friend
4. Turn timers (45s soft / 90s hard, pass-on-timeout), reconnect grace (60s)
5. Anti-cheat posture: server-authoritative from day 1 = solved by architecture

═══════════════════════════════════════════════════════════════════
## 6. BUILD ORDER (implement as we go)
═══════════════════════════════════════════════════════════════════

M1. **Meta-foundation**: player profile (local-first, sync-ready), XP/ranks,
    quests, coins, collection UI with sealed sigils. No server needed yet.
M2. **Story Mode Book 1** (Devas, 7 chapters) + first 22 hidden Deva cards
    (wave 1) + deck builder + crafting. Harness re-run gate.
M3. **Multiplayer step 1-2** (Nakama, friend links → casual queue). Profile
    goes server-side; auth (Firebase per GDD §15).
M4. **Battle Pass season 1** + Gupta Packs + IAP integration (Play/App Store).
M5. **Books 2-4 + waves 2-4**, one per season, with ranked ladder maturing.

Rationale: M1 is pure client work (ship this week's momentum); M2 makes the
game CONTENT-deep before INFRASTRUCTURE-deep; multiplayer lands when there's
a progression system worth competing in; money arrives last, after the loop
it accelerates already exists.
