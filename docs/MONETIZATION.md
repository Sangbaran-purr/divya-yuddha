# DIVYA YUDDHA — MONETIZATION DESIGN
### What Money Buys, What It Never Buys, and Why That Line Is the Product
*Prepared for investor and partner discussions · v1.0 · July 2026*

---

## 1. THE MODEL IN ONE PARAGRAPH

Divya Yuddha is a free-to-play collectible card battler (iOS / Android /
web) monetized on a single governing principle: **money buys time, never
permanence.** Every purchasable gameplay item becomes earnable by every
player through play; paying accelerates a collection, it never gates one.
Combined with a hard wall between the cosmetic and gameplay economies,
this yields the monetization profile of the genre's most durable earners
(seasonal card games, battle-pass ecosystems) while avoiding the
pay-to-win reputation that caps the lifetime of aggressive gacha titles —
a distinction that matters doubly in our launch market, where players are
sophisticated about predatory F2P and vocal about it.

---

## 2. REVENUE STREAMS

**2.1 · Ratna cards — seasonal early access (flagship stream)**
Each content season ships 24 new "Ratna" (jewel-tier) cards — six per
faction — available for direct purchase at season start. The following
season, every Ratna card rotates into the free-to-earn pool at standard
in-game (Amsha) prices. What the customer buys is a season of early
access: new deck archetypes today instead of in twelve weeks.
*Anti-pay-to-win enforcement is structural, not rhetorical:* every Ratna
set passes a simulation audit before release — decks built with Ratna
cards must show ≈0% win-rate advantage over free-card decks across our
automated balance harness (500 simulated matches per matchup). Paying
players get different decks early, never stronger ones. This audit is a
shipping gate, and its results are publishable — a trust asset most
competitors cannot offer.

**2.2 · Amsha packs — purchasable acceleration**
Amsha is the earned currency that buys cards. Selling Amsha directly is
the genre-standard "time skip": a full faction's seasonal card set
represents ~7 weeks of regular free play, and that time is the product.
Prices per card are identical for payers and non-payers; there is no
payer-only pool beyond the current-season Ratna window.

**2.3 · Cosmetics — the clean margin**
Battle-board skins, card backs, and profile flair: zero gameplay contact,
unlimited shelf life, near-zero marginal cost (our AI-assisted art
pipeline already produces cosmetic-grade alternates as a byproduct of
card production). Cosmetics are the stream that scales with attachment
rather than advantage.

**2.4 · Season pass (planned)**
A paid progression track alongside the free one, paying out cosmetics and
Amsha at an accelerated rate — the industry's proven wrapper for
converting engaged non-spenders, and a natural fit for a game whose
seasons already rotate content.

---

## 3. WHAT MONEY CAN NEVER BUY

This list is the moat. Each item is a binding design rule, already
enforced in the shipped codebase:

- **XP and player Levels** — earned through play only. A paying and a
  free player at the same level have played the same amount.
- **Ranks** (the Seeker → Parashakti prestige ladder) — derived purely
  from wins.
- **Story Mode progress and its rewards** — the game's acclaimed
  tutorial campaign gates nothing behind payment.
- **Sadhana progress** (the pinned-card pursuit system) — advances only
  on victories.
- **Permanent exclusivity of any gameplay item** — the Ratna rotation
  guarantees the only thing money permanently secures is *having had it
  early.*

---

## 4. CURRENCY ARCHITECTURE (why there are two)

**Amsha** (earned; later also sold) buys **cards** — it touches gameplay.
**Coins** (earned) buy **cosmetics** — they touch identity.
**The two never convert.** This no-bridge rule is load-bearing: it means
every generous coin faucet in the game is reputationally free (it can
never leak into gameplay power), and every gameplay-power question
reduces to the single, auditable Amsha economy. One wall, in exchange
for never needing to defend a hundred doors.

---

## 5. WHY THIS MODEL — THE COMMERCIAL ARGUMENT

1. **Retention economics.** Ethical-F2P card games monetize on multi-year
   player lifetimes; pay-to-win titles monetize on short whale cycles and
   die by review score. Our model deliberately trades day-30 revenue for
   month-30 revenue.
2. **The trust line is marketable.** "Every card earnable, audited
   non-pay-to-win, no loot boxes" is a store-page differentiator and a
   community talking point — earned media in a genre whose players
   actively warn each other about the alternative.
3. **Regulatory posture.** No randomized paid loot (cards are bought
   directly, never rolled) keeps the model clear of loot-box legislation
   trends across major markets.
4. **Content flywheel already runs.** The seasonal wave that monetization
   rides on is produced by a two-person, AI-accelerated pipeline that has
   already shipped an 88-card launch set, a complete seven-chapter
   narrative campaign, and a fully designed 88-card second wave — content
   cost per season is a fraction of genre norms.

---

## 6. ROLLOUT SEQUENCE (deliberately earn-first)

- **Live now:** the full free game — 88 cards, story campaign, seven
  battle realms. No store exists yet, by design.
- **M1 (in build):** the earning economy — XP, levels, ranks, quests,
  wallets, Sadhana. Ships *before* anything is sellable, so months of
  real earning-rate telemetry exist before a single price is set.
- **M2:** the second card wave + deck construction — the collection depth
  that gives the economy meaning.
- **M3:** multiplayer — the competitive context that gives collection
  urgency.
- **M4:** the store opens — Ratna sales, Amsha packs, cosmetics — priced
  from observed data, not guesses.
- **M5:** seasonal cadence — each season a new wave, a new Ratna set, a
  rotation of the last one into free play.

The sequencing is itself a monetization decision: pricing a time-skip
requires knowing exactly how long things take, and by store-open we will.

---

## 7. OPEN DECISIONS (flagged honestly)

- Whether Coins are ever directly sellable, or remain purely earned
  (either preserves the no-bridge rule; the choice is brand tone).
- Season-pass pricing and tier structure.
- Regional pricing strategy for the launch market.
All three are M4 decisions, deliberately deferred until earning-rate
telemetry from the live playtest cohort matures.

---

*Companion internal documents: LIVE_GAME_DESIGN.md (full economy
specification), M1_DESIGN.md (earning systems, shipped design),
WAVE1_ROSTER v0.2 (the first seasonal content wave, design-complete).*
