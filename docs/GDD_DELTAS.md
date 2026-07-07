# GDD DELTAS — divergences from GDD v2.0 (authority for card frame text)

**This file is the single source of truth for printed card text and rules that differ from GDD v2.0.**
When a card frame is (re)arted, use the text here — not the GDD PDF. Implemented in `src/engine.js`;
balance is FROZEN (see docs/DESIGN_DECISIONS.md) pending the Naga faction.

Printed numbers = what the game actually does (printed == internal; no hidden values). Where a GDD
value was changed by tuning, the printed card shows the CURRENT number and the GDD original is noted.

---

## Resolved rulings (R1–R9)

- **R1 — Death at 0.** A Unit whose power reaches 0 or less is destroyed (to discard; triggers death effects like Yama). Enforced generically, so power-reduction sources (e.g. Venom) also kill.
- **R2 — Round lead.** Rounds 2 & 3, the previous round's winner plays first; a drawn round keeps the same leader as before.
- **R3 — Deva Soldier** redesigned (see card text below).
- **R4 — Amrita Kalasha** official text (below).
- **R5 — Tataka** — "lowest power Unit" excludes Tataka herself; she never suicides on entry.
- **R6 — Leap adjacency** — Units only. Positioning is units-only (Heroes hold no Yuddha-Row slot and are never valid Leap sources / adjacency anchors). Leap is a **free action** (does not cost your turn), once per round (twice with Kishkindha Crown).
- **R7 — Angad** — while Angad is on the board, when the opponent plays an Astra they forfeit their next turn. Stacks with Varuna's per-round Astra limit (both apply if both are on board).
- **R8 — Kishkindha Oath** — proactive ward (below).
- **R9 — Chandrahas** — gains an ON PLAY effect (below).

---

## Faction mechanic — CHAOS SURGE (Asura), new printed text

> **CHAOS SURGE.** When the Asura player plays any **Astra or Mantra**, one random friendly Unit gains **+3 power**. If no Surge has fired this round, the Asura player's **first Unit play** triggers a **+1** Surge — *chaos always finds a way.*

Deltas vs GDD v2.0 (Chaos Surge = "+2 on Astra only"):
- Amount **+2 → +3** (spell-triggered Surges). *Printed number is +3.*
- Also triggers on **Mantras**, not just Astras (5 spell-triggers in deck, not 3).
- Added the guaranteed **+1 floor** (once per round, first Unit play, only if nothing has Surged yet — not stacked, not doubled by Chandrahas).
- Chandrahas still makes each Astra/Mantra Surge fire **twice** while active (the floor is exempt — it is always a single +1).

---

## LEAP (Vanara) — implementation notes (not on a card, but authoritative)
- **Free action**, once per round (twice with Kishkindha Crown). You may Leap and still play a card / pass.
- Copies an **adjacent friendly Unit's current power** (power only — §9: never inherits the Dharma Shield).
- Heroes are never Leap sources or adjacency anchors (R6).

---

## Changed card text (printed form)

### Deva
- **Deva Soldier** (Unit · C · P2) — *R3*
  `PASSIVE: While Indra is on the board, gains +1 power at the start of each of your turns.`
  *(GDD: "+1 at the start of each round" — dead, since Units clear between rounds.)*
- **Amrita Kalasha** (Artifact · M) — *R4*
  `ON PLAY: Your lowest power Unit gains +2. If that unit is destroyed this round, it revives at 1 power (once).`
  *(GDD: a start-of-round trigger that couldn't fire.)*

### Asura
- **Chandrahas** (Artifact · R) — *R9*
  `ON PLAY: trigger one Chaos Surge. PASSIVE: your first Astra each round deals double effect; Chaos Surge triggers twice while active.`
  *(GDD had the PASSIVE only; the ON PLAY line is new — it removes the dead turn of playing the artifact.)*
- **Kumbhakarna** (Unit · E · P8) — *sleep semantics revised*
  `ON PLAY: Its power counts at once. At the start of your next turn it wakes and deals 3 damage to all enemy Units.`
  *(GDD/earlier ruling: power did NOT count while asleep. Revised — an 8-power body that also detonates is the intended tempo threat; "asleep" now only defers the 3-damage sweep.)*

### Vanara
- **Hanuman** (Hero · L · P9) — *≥4 gate*
  `PASSIVE: Each Vanara Unit of printed power 4+ you play gains +1 on entry (+2 while Jambavan is on the board).`
  *(GDD: applied to every Unit. Gated to printed power ≥4 to devalue go-wide chaff; the Jambavan synergy is retained.)*
- **Neela** (Unit · R · P5) — *flat*
  `ON PLAY: All Vanara Units on the board gain +1 power.`
  *(GDD: "+2 if Sugriva is on the board." The Sugriva upgrade was dropped.)*
- **Rama Naam** (Mantra · R) — *flat*
  `All friendly Vanara Units gain +2 power.` *(Internal: also uncounterable by Naga effects — dormant hook, Nagas not built.)*
  *(GDD: "+3 if Hanuman is on the board." The Hanuman upgrade was dropped.)*
- **Kishkindha Crown** (Artifact · M) — *+1/+1*
  `PASSIVE: When a Vanara Unit Leaps, it and the copied Unit both gain +1. Leap limit becomes twice per round.`
  *(GDD: both gain +2.)*
- **Angad** (Hero · E · P7) — *R7 wording*
  `PASSIVE: Immune to opponent Mantras. When the opponent plays an Astra, they forfeit their next turn.`
  *(GDD: "Astras cost an additional action" — undefined in a 1-card-per-turn model; realised as a forfeited turn.)*
- **Kishkindha Oath** (Mantra · U) — *R8 wording*
  `Ward a friendly Vanara Unit: the next time it would be destroyed this round it survives at 1 power, and all other friendly Vanara Units gain +1.`
  *(GDD: "about to be destroyed" reaction — realised as a proactive one-shot ward that expires at round end.)*
- **Tataka** (Unit · U · P4) — *R5*
  `ON PLAY: Destroy the lowest power Unit on the board — friendly or enemy.`
  *(Text unchanged from GDD; the ruling: the search **excludes Tataka herself**, so she can hit your other Units but never suicides.)*
- **Riksha** (Unit · R · P4) — *Hanuman adjacency realised as presence*
  `ON PLAY: Move to any position on the row. Gains +3 power while Hanuman is on the board.`
  *(GDD: "+3 if placed adjacent to Hanuman." Heroes are positionless (R6), so realised as "while Hanuman is on the board.")*

---

## Other adaptations (mechanics, not card text)
- **Vayu** (Deva Unit) — GDD "swap positions with the highest enemy Unit; that unit loses 2 power." With per-player rows, the positional swap is realised as a **displace** (the target is hurled out of formation, breaking Vanara Leap adjacency) plus −2 power.
- **Dharma Shield** (Deva passive) — sticky single designation per round (Dharma Kavacha = two sticky). The shield latches onto the strongest Unit at the first shield opportunity and stays; it dies with that Unit and does not re-target. *(Closer to the GDD's "designated once per round" than the old dynamic auto-shield; still auto-picks rather than player-designated.)*
- **Board positioning** — added faction-agnostically (Units occupy ordered slots; adjacency = neighbours). Devas/Asuras ignore position; only Vanara Leap uses it.

---

## Not changed (deliberately)
- **Pavamana** (Deva Mantra) sits ~39% mirror win-rate but is **left as-is** — it's anti-Venom / anti-attrition tech that can't be evaluated until the Naga faction exists.
