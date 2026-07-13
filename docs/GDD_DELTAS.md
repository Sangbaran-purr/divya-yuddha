# GDD DELTAS — divergences from GDD v2.0 (authority for card frame text)

**This file is the single source of truth for printed card text and rules that differ from GDD v2.0.**
When a card frame is (re)arted, use the text here — not the GDD PDF. Implemented in `src/engine.js`.
**Balance is FROZEN FOR LAUNCH (all 4 factions, 2026-07)** — the LAUNCH BASELINE table lives in
docs/DESIGN_DECISIONS.md / CLAUDE.md; all future balance work diffs against it.

Printed numbers = what the game actually does (printed == internal; no hidden values). Where a GDD
value was changed by tuning, the printed card shows the CURRENT number and the GDD original is noted.

---

## Resolved rulings (R1–R16)

- **R1 — Death at 0.** A Unit whose power reaches 0 or less is destroyed (to discard; triggers death effects like Yama). Enforced generically, so power-reduction sources (e.g. Venom) also kill.
- **R2 — Round lead.** Rounds 2 & 3, the previous round's winner plays first; a drawn round keeps the same leader as before.
- **R3 — Deva Soldier** redesigned (see card text below).
- **R4 — Amrita Kalasha** official text (below).
- **R5 — Tataka** — "lowest power Unit" excludes Tataka herself; she never suicides on entry.
- **R6 — Leap adjacency** — Units only. Positioning is units-only (Heroes hold no Yuddha-Row slot and are never valid Leap sources / adjacency anchors). Leap is a **free action** (does not cost your turn), once per round (twice with Kishkindha Crown).
- **R7 — Angad** — while Angad is on the board, when the opponent plays an Astra they forfeit their next turn. Stacks with Varuna's per-round Astra limit (both apply if both are on board).
- **R8 — Kishkindha Oath** — proactive ward (below).
- **R9 — Chandrahas** — gains an ON PLAY effect (below).
- **R10 — Karkotaka (Naga)** — while on board, the Venom drain ticks at the start of each opponent turn instead of once at round end.
- **R11 — Patala Throne** — while active, Venom drain = −(1 + current round number): R1 −2, R2 −3, R3 −4.
- **R12 — Surasa** — one-shot trap on the opponent's next card: a Unit enters with −2 power and Surasa gains +2; an Astra is negated (its Chaos Surge still fires per §9). Trap expires after one card.
- **R13 — Venom Tokens** drain their bearer at each tick regardless of side (Mrityunjaya's revived Unit pays the cost).
- **R14 — Ananta Coil** tokens persist for the rest of the match, draining 1 from a random enemy Unit each Venom tick.
- **R15 — Shesha** — after a lost round, at the start of the next round a random friendly Unit returns from discard at full power.
- **R16 — Kaliya / Ashvatara** — Kaliya enters with +(current round − 1) power; Ashvatara's drain = the current round number.

### Naga engine rulings beyond R10–R16 (owner-confirmed — R17–R20)
- **R17 — Venom stacking:** amount modifiers stack ADDITIVELY. perUnit drain = 1 + (Patala: +round) + (Vasuki on board & R3: +1) + (Venom Strike this round: +2, or +3 with Vasuki). Karkotaka is a timing modifier, orthogonal.
- **R18 — Manasa:** on-board negation — while she is on the board the opponent's Astras are cancelled (effect + Chaos Surge). Surasa (R12) is the one-shot trap; the two are the §9 asymmetry sides.
- **R19 — Astika:** skips the next Venom tick and heals friendly Units +1.
- **R20 — Nagapasha:** the opponent unbinds by spending a whole turn (turn-costing action); an un-freed bound Unit scores 0.

### Wave-1 pre-implementation rulings (owner-confirmed 2026-07-12 — R21–R31)
- **R21 — PERMANENT POWER CHANGES:** "Permanent" = modifies printed power: the effect changes base AND current power. All effects that read printed power (restore-to-printed, printed-power thresholds, copy-at-half-printed, etc.) see the modified value. Grown is grown. (Ratifies the Task-3 implementation of Dawn Sentinel / Pisacha Skirmisher.)
- **R22 — ASTRA DAMAGE vs DESTROY vs DEBUFF:** "Astra damage" = deal-N effects only — exactly the dmgAstra tag set. Destroy-class Astras, debuffs (−X), bind effects, and Venom application are NOT Astra damage. Consequences: Ratri Hymn prevents dmgAstra sources only (stops Agneyastra/Suryastra/Vidyutastra/Pashupatastra/Lanka Dahan; does not stop Vajra, Shakti Spear, Gandiva Arrow, Mohanastra, Nagastra, Tamasa). Patala sharpens dmgAstra sources only (existing behavior, now defined). HOLIKA sub-ruling: "immune to Astra damage" = dmgAstra sources deal her 0; "+1 extra from everything else" = any other power reduction (Venom drains, unit effects, debuffs) is increased by 1. Plain reading; sim watches it.
- **R23 — KARTIKEYA: "RESOLVES VS YOUR SIDE":** A negated Astra did not resolve — no Kartikeya trigger (Brahmadanda blanks it). "Vs your side" = the resolution affected at least one of your Units. Triggers once per Astra, not once per unit hit.
- **R24 — BRAHMADANDA (ratified pre-staged ruling):** Negation stops the Astra's effect; the caster's Chaos Surge still procs (R12 Surasa precedent: the cast happened, the effect did not). Sim fallback if the Asura mirror shifts >2: soften to "the next enemy Astra deals no damage."
- **R25 — VEDI KEEPER vs THE SHIELD ECONOMY:** Ruled intent: Vedi Keeper removes the action cost of one Dharma Shield this round. Implementation must verify against the engine's actual shield economy (both-ways check in its engine task). If shields are already action-free in the engine, fallback text: "your next Dharma Shield this round may be applied instantly on playing Vedi Keeper."
- **R26 — MAYASURA'S BLUEPRINT:** Blueprint modifies turn consumption only: once per round, playing an Astra does not consume the turn (one extra card that turn). Everything else stands: Angad's forfeit still triggers (he punishes the play, not the turn), any Astra-count limits stand, Varuna's cap stands.
- **R27 — "ROW" DEFINITION (positional canon):** "Row" = the player's ordered units array. Position = array index. Adjacency = index neighbors — exactly the existing adjacentUnits(). No new spatial model; the engine's is canon. (Unblocks Saranyu-class and all Vanara positional cards.)
- **R28 — NAHUSHA'S TOGGLE:** On play, this round only: the realm's effect applies to Nahusha's side and not the opponent's. A one-round flag; the symmetric realm system is otherwise untouched. Implementation feasibility check remains in its engine task.
- **R29 — ARUNA CHARIOTEER: "ROUND 1":** "If Round 1" = the match's first round, evaluated at play time (g.round===1). Played in round 2 or later: no bonus. (Ratifies Task-2 implementation.)
- **R30 — SAVITUR VERSE + MAHISHASURA (round-end readings):** Savitur Verse tracks its blessed unit by uid, match-long; if that unit is absent at a round end, nothing happens and the enchant does not retarget. Mahishasura's "an enemy Unit died this round" = any destruction of an enemy Unit this round, any cause; Venom kills at round end COUNT (the Venom pipeline runs before the round-end card hook). (Ratifies Task-3 implementation.)
- **R31 — ROUND-END DETERMINISM:** Kamadhenu's "lowest friendly Unit" tie resolves first-found (deterministic, no rng). Pisacha Skirmisher reaching 0 power at round end is destroyed per the engine's zero-power rule. (Ratifies Task-3 implementation.)

### Wave-1 implementation rulings batch 2 (owner-confirmed 2026-07-12 — R32–R37)
- **R32 — USHAS: "≤2 POWER" BOUNDARY:** Ushas's aura reads CURRENT stored power at evaluation time, non-recursively: a unit mutation-buffed above 2 (e.g. by Kamadhenu) exits the aura; a unit drained to 2 or below enters it; Ushas's own effPower-granted +1 does not feed back into the eligibility check. (Ratifies the Task-4 implementation.)
- **R33 — WARDED BLOOD OATH:** If Blood Oath's chosen lowest Unit carries a Kishkindha-Oath-class ward, the ward does its job: the unit survives at 1 power, the ward is consumed, and the draw still fires. The destroy attempt is the cost; the mantra's benefit does not require the death. Pure destroyUnit composition — no special-casing. Sim watches ward-then-Oath lines. (Ratifies the Task-5 implementation.)
- **R34 — TEMPORARY DEBUFF DURATION MODEL:** "This round" debuffs (Mohanastra-class) are current-power reductions with no scheduled restore. Round-scoping is emergent and canonical: the board clears to discard at round end, and every revival path sets power = base, so the dent never outlives the round. This is the duration model for ALL temporary debuffs, launch and wave. (Ratifies the Task-6 implementation.)
- **R35 — PERMANENT REDUCTIONS BYPASS DAMAGE RULES:** Surpanakha-class permanent cuts are direct base+power mutations (R21 downward). They are NOT damage: they bypass the damageUnit/venomLoss choke points entirely, so damage-conditional effects (Holika's +1 sharpening, Ratri Hymn's prevention) do not apply to them. A base reduction is a different verb from a power loss. (Ratifies the Task-6 implementation.)
- **R36 — VEDI KEEPER: CANONICAL TEXT REWRITE:** Engine verification (Task 7 STEP 0) proved both R25 branches moot: Dharma Shields are already action-free AND instant in the engine. The only reading under which the card exists is ruled canonical: VEDI KEEPER — "On Play: your Dharma Shield limit is +1 this round." One additional shield may be designated this round (stacks with Dharma Kavacha's cap); unconsumed grants expire at round end. This text supersedes the WAVE1_ROSTER_v0.2 entry and R25, and is the frame text for the eventual Canva export. (Ratifies the Task-7 implementation; roster delta noted.)
- **R37 — NEGATED ASTRAS AND CAST-TRIGGERED EFFECTS:** A negated Astra (Manasa-class, and Brahmadanda when implemented) was still CAST: cast-triggered effects fire even though the Astra's own effect does not resolve. Consequences: Chaos Surge procs for the caster (R12/R24 precedent), and Mayasura's Blueprint still grants its extra action. The cast happened; the effect did not. Contrast R23: resolution-triggered effects (Kartikeya) do NOT fire on a negated Astra. Cast-triggers and resolution-triggers are distinct classes. (Ratifies the Task-8 demonstration.)
- **R37 ERRATUM — NEGATION SOURCES AND CHAOS SURGE:** R37's secondary clause overstated. Whether Chaos Surge procs on a negated Astra depends on the NEGATION SOURCE, not on the cast: Manasa-class negation (§9/R18) cancels both the Astra's effect AND the caster's Chaos Surge; Brahmadanda-class negation (R24) cancels the effect but the surge still procs. Mayasura's Blueprint's extra action — a pure cast-trigger — fires under BOTH negation sources. The cast-trigger vs resolution-trigger class distinction stands; Chaos Surge is negation-source-dependent, not a pure cast-trigger.

### Wave-1 implementation rulings batch 3 (owner-confirmed 2026-07-13 — R38–R41; R40 option (b) selected)
- **R38 — AHAMKARA'S DOOM IS NOT A DEATH:** The unit doomed by Ahamkara is not destroyed through destroyUnit; it clears with the board at round end. No death-conditional effect fires on it: Mahishasura is not fed, Kartikeya's Vanguard does not trigger, Vishalakshi the Pale does not grow, Raktabija's Curse does not spawn. The ego shatters; nothing kills it. (Ratifies launch-emergent behavior surfaced in Task 9.)
- **R39 — SHUKRACHARYA'S REVIVE (LAUNCH REPAIR #1):** Timing: ON PLAY — "once per game" is structurally satisfied (a Hero enters once per match and persists; no counter flag). Amount: ceil of half PRINTED power, minimum 1 (Nala precedent); an R21-grown base revives at half the grown value; the revive amount itself is not a permanence effect (base untouched). Target: highest-base fallen friendly Unit auto-selected; explicit targetUid honored; player-choice UI deferred. Empty discard → logged no-op. The revived unit returns cleansed and triggers revival listeners (revival site #9). Wave-1-gated until flag-flip. (Ratifies the Task-9.5 implementation.)
- **R40 — FORMATION SEMANTICS UNDER THE GAPLESS BOARD (OPTION B):** The board is a gapless ordered array, so in a mono-faction deck "adjacent to another Vanara" is true for any Unit that is not alone. Ruling: (1) SETU MASON's canonical text is SHARPENED to: "+1 while adjacent to Vanaras on BOTH sides." Interior positions carry formation value; edges do not. This is a text-and-implementation delta on the shipped Task-10 card. (2) THE LIVING BRIDGE ships as-written — under this board model "an unbroken adjacent line of 4+" is equivalent to "4+ Units at round end," and that equivalence is acknowledged rather than disguised. The card is FORMALLY SIM-FLAGGED: the sim campaign prices whether a body-count mythic at +1 permanent to all is rate-appropriate, with a power/condition haircut as the prepared fallback. (3) Drummer of the Host, Gavaksha, The Setu Stones, and Vault of the Sky are unaffected — placement-choice and index-exchange effects carry real positional content already. Genuine formation content in future designs uses both-neighbor conditions, placement choice, or index-specific effects — not single-neighbor adjacency.
- **R41 — RIKSHA'S MOVE (LAUNCH REPAIR #2):** Timing: ON PLAY, after insertion — Riksha enters at his played (or Stones-overridden) slot, then relocates once via the shared moveUnit primitive; not a persistent ability. Destination: explicit movePosition honored (an additive playCard channel; entry position and move destination are distinct channels and compose with the Setu Stones anchor); otherwise the AI Leap-setup heuristic (adjacent to the highest-effPower friendly); bounds-clamped; lone Unit → structural no-op. Player-choice UI deferred (Vault/Stones status). The Hanuman +3 entry check is untouched launch behavior and stacks with the general Hanuman entry bonus. Wave-1-gated until flag-flip. (Ratifies the Task-10.5 implementation.)

### Wave-1 implementation rulings batch 4 (owner-confirmed 2026-07-13 — R42–R44; R43 strongest-reading exception)
- **R42 — "DAMAGED" DEFINITION + ROUND-END HOOK ORDER:** (1) DAMAGED = current power strictly below base. Consequences: a temporary dent (Mohanastra-class) is damage and is restorable; a PERMANENT cut (Surpanakha/Pisacha-class, R21 downward) lowers base too, leaving power equal to base — such a unit is NOT damaged and there is nothing to restore toward (R21/R35-consistent). "Restore N" = +N current power, capped at base. "Restore to printed power" (Dhanvantari-class) = power set to base, where base reflects all R21 permanent changes, grown or cut. (2) THE ROUND-END HOOK ORDER is canon for all present and future round-end card effects: Savitur Verse → decay effects (Pisacha/Mahishasura) → Kamadhenu → Sushena (restores) → The Living Bridge (permanent +1). The Venom pipeline runs BEFORE the entire hook (R30). New round-end cards slot into this order deliberately, never silently.
- **R43 — DAWN BANNER: CANONICAL TEXT REWRITE (STRONGEST READING, RATIFIED):** Engine verification (Task 12 STEP 0) proved the printed "Round start: all friendly +1 this round" structurally impossible: every round begins with an empty board, and artifacts clear at round end — the card can never witness the moment it names. Ruled canonical, as shipped: DAWN BANNER — "From the next round on, your Units get +1 (this effect outlives the Banner)." Implementation: a match-long stamp set on play (dawnBannerFrom = next round) driving a read-time +1 aura on all friendly Units in every subsequent round; no retroactive buff in the round of play. This is a deliberate strongest-reading exception to the weakest-defensible default, chosen to honor the design's own compounding intent. The SIM flag stays hot: a permanent aura from one Epic play is priced by the sim campaign, with a duration haircut (e.g. "for the next two rounds") as the prepared fallback. Supersedes the WAVE1_ROSTER_v0.2 entry; frame text at art time follows this ruling.
- **R44 — VIDYUTASTRA × CHANDRAHAS: SURGE MULTIPLIERS COMPOSE:** Chaos Surge multipliers are multiplicative: Vidyutastra's "Chaos Surge triggers twice on this card" (×2) under an active Chandrahas ("Chaos Surge triggers twice while active", ×2) composes to FOUR surges (+12 random friendly power) from one Rare Astra cast. Emergent, demonstrated, ratified as-is. NAMED SIM FLAG (alongside the Chandrahas-doubled Mohanastra −4): if the Asura wave warps in the sim campaign, this composition is suspect #1; the prepared fallback is an additive cap ("surge count = max of the multipliers, not the product").

### Wave-1 implementation rulings batch 5 (owner-confirmed 2026-07-13 — R45–R50; R49 option (a) selected)
- **R45 — WORLD-COIL BIND SEMANTICS (AS FOUND):** World-Coil Constrictor and Nagapasha share the t.bound flag; World-Coil's additional marker gates only its venom-drain self-release. Consequences: the manual spend-a-turn unbind (R20) is flag-agnostic and frees a World-Coil bind; a Pavamana-cleansed World-Coil victim has a dead drain-release path (no venom, nothing to lose) but remains freeable via the manual unbind — no bind is ever permanent. (Ratifies the Task-13/14 implementation as found.)
- **R46 — THE BOUNCE ROUND-LOCK:** Any card returned to a hand by a bounce effect (Rite of Shed Skin, Vayavyastra, and all future bounces) is locked for the remainder of the current round (lockedRound) — it cannot be replayed until next round. Rationale: kills the replay-loop class generally (the Brihaspati × Rite of Shed Skin infinite loop found by the Task-14 smoke), and gives enemy-bounces their intended tempo denial: a Vayavyastra'd unit cannot redeploy this round. "It returns exhausted." (Ratifies the Task-14 fix, retroactively covering Task 13.)
- **R47 — THE TARGETING LAYER IS ASTRA-ONLY:** "Cannot be targeted" protections (Andhaka, Maya Veil, Sharabha-class, Dharma Shield) live in the Astra targeting layer (astraProtected / targetSpec). They do NOT prevent unit on-play effects from selecting a victim: Vinata's Talon hits Andhaka; on-play debuffs and steals select normally. Astra-immunity is immunity to Astras, nothing broader. (Ratifies the Task-14 demonstration.)
- **R48 — SONG OF THE CROSSING: CANONICAL TEXT REWRITE (R27 RESOLUTION):** Under R27 there is exactly one row per player (the ordered units array), so "all friendly Units in one row" is all friendly Units. Ruled canonical: SONG OF THE CROSSING — "Your Units +1 this round; +2 instead if you have 4 or more." Current-power (R34). Supersedes the WAVE1_ROSTER_v0.2 entry; frame text at art time follows this ruling. (Ratifies the Task-15 implementation.)
- **R49 — ANJANEYA'S ROAR: PAIRS SHARPENED (OPTION A — R40'S STANDARD):** The flattened reading (+1 to each friendly with any neighbor) degenerates to a full-board buff on a gapless array — the exact flattening R40 names. Ruled per R40's standard: the +1 applies to INTERIOR friendly Units only — those with non-ghost friendly Units on BOTH adjacent sides. Edge units and lone units receive nothing. The enemy-side −1 (all enemies, debuff, dmgAstra:false) is unchanged. Canonical text: ANJANEYA'S ROAR — "All enemy Units −1 this round; your Units flanked on both sides gain +1." This is a text-and-implementation delta on the shipped Task-15 card. The SIM flag (vs Rama Naam's crown) stands with the sharpened reading.
- **R50 — SMALL READINGS BUNDLE (RATIFIED AS SHIPPED):** Vinata's Talon: the Vanara count is self-inclusive, floor(n/2), max 3 hits, single target, non-astra damage (Holika sharpens per hit). Sampati: the reveal is the minimal honest form — the enemy's highest-base hand card, logged by name; empty hand no-ops. Picker deferrals (engine live via targetUid/movePosition, human UI logged, AI/auto heuristics reported): The Setu Stones anchor, Vault of the Sky destination, Riksha destination, Saranyu's two-target pair, Gavaksha's swap partner, Shukracharya's revive target. These UI tasks batch together when the wave-1 UI pass is scheduled; none blocks sim.

### Wave-1 implementation rulings batch 6 (owner-confirmed 2026-07-13 — R51–R54; R54 amends R42)
- **R51 — VRITRA'S BIND (AS FOUND):** Vritra's on-play bind rides the shared t.bound flag and ignores Astra targeting protections (R47 — a hero's on-play is not an Astra). "While Vritra remains": nothing in the current pools destroys a hero, and the bound unit clears with the board regardless, so the bind is round-bound in practice; Sudarshana's temporary hero-removal lifts it; the R20 manual spend-a-turn unbind frees it. (Ratifies the Task-16 implementation as found.)
- **R52 — REGAIN vs RESTORE: TWO VERBS:** "Restore" (Sushena, Dhanvantari-class) is capped at base — R42 stands. "Regain" (The Iron Crucible) is UNCAPPED — +N current power at round end regardless of base, so a permanently-decayed unit (power == base after a Pisacha/Mahishasura cut) still regains. Rationale: anti-decay is the Crucible's ruled identity; a capped regain would be blind to the exact effects the retheme answers. The two verbs are now distinct canon; future card text chooses deliberately. The Crucible's anti-Naga-drift SIM flag stands. (Ratifies the Task-16 implementation.)
- **R53 — "LOST POWER THIS ROUND":** Any power-decrease event during the round qualifies, regardless of net (a unit that lost 2 and gained 3 still lost). Tracked per-unit at every decrease site. The trackable reading, and the generous one for the card's owner. (Ratifies the Task-16 implementation.)
- **R54 — R42 AMENDMENT: THE PRE-DRAIN TOKEN SLOT (PADMAVATI RE-SLOTTED):** Batch-17 shipped Padmavati's round-end Venom application in the R42 hook — AFTER venomRoundEnd — where her token is applied after the round's only drain, onto units that then clear to discard and are cleansed by every revival path: applied into the void, a dead card. Ruled: the R42 canonical order gains a named slot — PRE-DRAIN TOKEN APPLICATIONS — executing immediately BEFORE venomRoundEnd. Padmavati moves there: her Venom lands on the strongest enemy and TICKS THAT SAME ROUND END (deepened in Patala, doubled under the Vasuki-class rules, per the normal pipeline). The amended canonical order: pre-drain token applications (Padmavati-class) → venomRoundEnd → [the R42 hook: Savitur → decay → Kamadhenu → Sushena/Crucible → Living Bridge → Drowned Altar → Kalpavriksha] → scoring. Future round-end token appliers use this slot deliberately. This is a text-preserving implementation re-slot (the printed card text is unchanged; only WHEN it fires moves). (Amends R42; re-slots the Task-17 implementation.)

### Wave-1 implementation rulings batch 7 (owner-confirmed 2026-07-13 — R55–R57; batch-18 readings canonized)
- **R55 — SHANKHAPALA (targeting + timing):** Printed: "Round End: move 1 Venom between enemy Units." Ruling: (a) Resolves in the R54 pre-drain token slot, BEFORE venomRoundEnd — the moved token therefore drains its new bearer that same round; if the source unit retains any venom after the move, it also drains normally. (b) Auto-targeting: source = the enemy unit carrying the most venom tokens; destination = the highest-effPower enemy unit other than the source. (c) Degenerate cases (weakest reading): if no enemy unit carries venom, or no distinct destination exists, the effect does nothing.
- **R56 — SILT STRANGLER (loss routing):** Printed: "On Play: enemy loses power = its Venom count (tokens remain)." Ruling: the loss routes through damageUnit and inherits that class's full semantics: Holika sharpens it; realm Patala does NOT amplify it (Patala deepens astras only — the Patala Throne artifact is the venom deepener); it registers on lostPowerUids and is therefore Iron Crucible-regainable (R52/R53); it is not an astra and ignores astraProtected. Auto-target: the enemy unit with the highest venom count; if no enemy unit carries venom, the effect does nothing (weakest reading). Venom tokens remain in place after the loss.
- **R57 — HYMN OF THE DEPTHS ("once" semantics):** Printed: "All Venom drains trigger immediately, once." Ruling: resolves as exactly ONE mid-round pass of the venom pipeline (venomPassive → venomTokens → sweepDeaths) at cast time — the Karkotaka precedent. Deaths from this pass fire onUnitDeath and count toward deathsThisRound. Astika's protection is respected. Tokens are sticky and persist through the pass. The normal round-end drain still occurs — the Hymn adds a pass, it does not consume or replace the round-end one.

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
- **Pavamana** (Mantra · U) — *fidelity restore (2026-07)*
  `Remove all debuffs and Venom Tokens from all friendly Units. Each cleansed Unit gains +1 power per effect removed.`
  *(v0.1 predated Venom and dropped clause (b): it healed wounds to base+1 but stripped tokens with no power grant. Restored — a Unit with 3 Venom Tokens cleansed gains +3. Non-Venom matchups unchanged, so Deva mirror etc. are identical.)*

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
- **Dharma Shield** (Deva passive) — sticky single designation per round (Dharma Kavacha = two sticky). The shield latches onto a Unit at the shield opportunity and stays; it dies with that Unit and does not re-target. **The HUMAN designates by hand** (🛡 SHIELD button → tap a Unit, `designateShield()`); if unused at round end there is NO auto-fallback (unused is unused — that's the skill). The **AI** keeps designate-at-first-opportunity auto-pick (highest-power) so the balance baseline is untouched (`pl.manualShield` gates the two paths).
- **Board positioning** — added faction-agnostically (Units occupy ordered slots; adjacency = neighbours). Devas/Asuras ignore position; only Vanara Leap uses it.

---

## Rama's Signet vs Venom — semantics (authoritative, do not re-broaden)
Printed text grants **two distinct** things; they are NOT blanket Venom immunity:
- **(a) Floor, not immunity.** A friendly Vanara Unit's power cannot be reduced below 1 by *any* effect. The base Venom **passive drain still applies** — a Signet board is ground down toward 1, it just never dies to Venom. (`venomLoss`: `power = max(1, power − amt)`.)
- **(b) Token negation.** Venom **Tokens** on friendly Vanara Units are negated outright (they deal 0). (`venomTokens` skips Signet-protected Units.)
- **History:** originally over-implemented as blanket immunity (drain negated, not floored), which inflated Vanara-vs-Naga to 63.8/36.2. Corrected to the printed floor → **57.3/42.7** (in band). A board ground to 1s is beatable; a board immune to Venom is not. Keep the two clauses separate.

## Known design holes (flagged for owner — NOT auto-fixed)
- **§9 "destroy the Artifact" counter to Rama's Signet is unprinted.** GDD §9 assumes the Naga player answers Signet by **destroying the Artifact**, but **no Naga card can destroy Artifacts** — Artifact removal exists *only* in the Deva kit (Vishwakarma). So the GDD prescribes counterplay it never printed onto a card. The Signet-vs-Naga polarity therefore has no in-faction Naga answer today. **Owner decision (Season content / errata):** e.g. give a Naga card Artifact-destruction, add a neutral answer, or accept the polarity as the designated counter-matchup. Do not paper over it in the engine.

## Pavamana played-vs-held reads negative — EXPECTED, not a defect
Pavamana is now fidelity-correct (clause (b) restored, above), yet in Deva-vs-Naga its owner wins **~32% when played vs ~50% when held** (Δ ≈ −18pt). This is **reactive tech behaving as designed**, not a bug: you only hold 2+ Venom Tokens once Venom is already grinding you down, so *playing it correlates with (not causes) losing*. It strips Tokens but can't touch the GDD-locked base −1 round-end drain, so Deva-vs-Naga stays ~59/41 — the accepted counter-matchup. Do NOT "fix" the negative delta by buffing Pavamana; that would over-correct a matchup that is working as intended.

## Mulligan (GDD §2.2) — implemented 2026-07
Before Round 1, each player may return up to 3 cards to the deck, reshuffle, and redraw the same count (`mulligan(g,pi,uids)`; consumes rng only when cards are actually swapped, so a fixed-realm zero-swap game stays byte-identical). AI heuristic (`aiMulliganPlan`): toss dead conditionals (Marut w/o Vayu, Kali, Riksha/Kesari w/o Hanuman), low vanilla filler, keep the curve, never ditch your only Hero. The regression harness does NOT mulligan (keeps the LAUNCH BASELINE comparison clean).

## THE 7 COSMIC REALMS (GDD §10) — implemented 2026-07
One realm per match (`g.realm`, random by default, `opts.realm` fixes it). Engine-level modifier at the relevant chokepoint:
- **Swarga** — all Heroes +1 power for the match (`effPower` hero branch).
- **Mrityulok** — no effect (the byte-identical control; harness baseline runs here).
- **Patala** *(realm — distinct from Patala Throne the Naga artifact)* — all Astra damage +1 (`damageUnit`, `ASTRA_DMG` = Pashupatastra, Lanka Dahan).
- **Gandharva Lok** — both players draw 1 extra at the start of Round 2.
- **Yaksha Lok** — Artifacts cannot be destroyed. **Ruling:** Vishwakarma whiffs — his destroy is a no-op and his +2-per-destroyed never triggers all match (plain 4-power body).
- **Rishi Mandala** — each Mantra usable twice. **Ruling:** after its FIRST cast the Mantra returns to hand (once, `rishiUsed` flag), recasting costs another turn; the second cast discards normally.
- **Kalki Kshetra** — the round's last-played card gains +2 at round end. **Ruling:** applies ONLY if that last card is a Unit/Hero still on the board; a round ending on an Astra/Mantra grants no bonus.
- **Balance:** Mrityulok 10-matchup table is byte-identical to the LAUNCH BASELINE. Swarga/Patala swings are modest (mirrors hold ~50; largest cross swing Swarga Deva-vs-Asura +3.7) — realm-induced, reported not tuned. Realms perturb the frozen baseline by design; the baseline is defined on Mrityulok.
