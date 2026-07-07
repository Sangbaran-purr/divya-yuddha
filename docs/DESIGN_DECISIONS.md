# Divya Yuddha — Design Decisions & QA Log

## Naga faction — COMPLETE, BALANCE FROZEN FOR LAUNCH (2026-07, docs/NAGA_ROSTER.md)
Flags A–G ruled official as **R10–R16**; four supplementary engine rulings carry **R17–R20** (see GDD_DELTAS.md). R17 additive Venom stacking · R18 Manasa on-board Astra negation (effect + Surge) · R19 Astika skip-tick + heal · R20 Nagapasha turn-costing unbind.

**Venom pipeline (verified, one ordered system):** `drainAmount` (additive: 1 + Patala round + Vasuki-R3 + Strike), `venomPassive`, `venomTokens` (R13 any-side + Sarpa double + R14 Ananta board-tokens), Karkotaka **single early tick on first pass** (`venomKarkotakaEarly`, post-L2) vs round-end (`venomRoundEnd`), Astika pause, Signet floor / Hiranya floor. **`src/test_venom.js` — 31 tests all green** (incl. §9 Patala+Karkotaka, Signet floor, Pavamana +1/effect).

**Cards + §9 + UI + harness (DONE):** all 22 card behaviours wired. §9 live — **Manasa** on-board Astra negation (effect + Surge); **Surasa** R12 one-shot trap (Unit −2 / Astra negated but Surge still fires — the asymmetry with Manasa); **Takshaka** Hero-immunity break (Nagapasha may bind a Hero; `totalPower` skips bound Heroes); **Pavamana** anti-Venom (see fidelity below); **Rama Naam** uncounterable-by-Naga (satisfied — Manasa negates Astras only, not Mantras). Nagapasha **bind + turn-costing unbind** in AI (`aiMove`→`{unbind}`) and UI (UNBIND button). `astraProtected` helper folds shields + Sharabha + Ulupi's round immunity. Shesha R15 round-start revive. Teal UI (#1F6B62 frames, venom-green accents, `☠×stack` / ⛓ bind / 🌀 steal badges, faction-select entry). 640 smoke games / 16 matchups crash-free; `node src/test.js` (10×500) **ALL INVARIANTS PASS**.

### BALANCE — FROZEN. LAUNCH BASELINE (all future balance work diffs against this table)
Decided-game win% (draws excluded), 500 sims/matchup:

| Matchup | Result | Note |
|---|---|---|
| Deva mirror | 49.8 / 50.2 | |
| Asura mirror | 53.6 / 46.4 | |
| Vanara mirror | 52.8 / 47.2 | |
| Naga mirror | 51.4 / 48.6 | |
| Devas vs Asuras | 47.7 / 52.3 | |
| Devas vs Vanaras | 45.1 / 54.9 | |
| Asuras vs Vanaras | 42.3 / 57.7 | |
| **Devas vs Nagas** | 40.9 / **59.1** | ◆ ACCEPTED counter-matchup (Venom vs go-wide = design intent; all counters fidelity-correct; clean provenance) |
| Asuras vs Nagas | 49.0 / 51.0 | |
| Vanaras vs Nagas | 57.3 / 42.7 | |

**Naga integration levers (applied, in order):**
- **EXP-L** — Karkotaka per-opponent-turn tick → flat −1; escalation (Patala/Vasuki/Strike) rides only the round-end tick.
- **EXP-L2** — Karkotaka → a single flat −1 early tick fired the moment the first player passes each round (removed the ~6×/round attrition volume that drove the win-rate).
- **EXP-M** — counter-piloting AI (Deva holds Pavamana until 2+ Venom Tokens / round-end; Vanara prioritises Rama's Signet vs Nagas; all AIs devalue go-wide vs Nagas). This MEASURES the matchup at competent play — deliberately NOT a detune. Base −1 round-end drain is GDD-verbatim, never touched.

**Fidelity fixes (the cautionary record behind engine rule #6):** four counters have been over/under-implemented in this project, each causing a balance distortion:
1. **Dharma Shield** (Deva) — dynamic auto-retarget → corrected to sticky single designation (EXP-A).
2. **Karkotaka R10** (Naga) — escalated amount × per-turn volume → EXP-L flat, EXP-L2 single early tick.
3. **Rama's Signet** (Vanara) — blanket Venom immunity → corrected to floor-at-1 + token-negation (Vanara-vs-Naga 63.8 → 57.3).
4. **Pavamana** (Deva) — v0.1 dropped clause (b) → restored +1 power per effect removed (Deva-vs-Naga 60.4 → 59.1).

**Pavamana played-vs-held reads −18pt in Deva-vs-Naga — EXPECTED, not a defect:** it's reactive damage-control; you only hold 2+ Venom Tokens once already being ground down, so playing it correlates with (not causes) losing. Left as-is.

**Known design hole (owner — Season content / errata):** GDD §9 prescribes answering Rama's Signet by **destroying the Artifact**, but no Naga card can destroy Artifacts (only Deva Vishwakarma). Flagged in GDD_DELTAS; not papered over in-engine.

## Locked decisions
- 2026-04: GDD v2.0 locked (88 cards, 4 factions, best-of-3)
- 2026-07: Engine/stack switched from Unity to JS web stack + Capacitor
- Yama card art: scales-of-justice version (Image 2) APPROVED
- All 15 framed Deva cards approved (3 Heroes + 12 Units)
- Round leader rule (v0.1, unconfirmed): previous round winner leads

## Card QA fixes pending (framed PNGs)
- [ ] Yama: ability text "I-power" → "1-power"
- [ ] Surya Dev: ability text "+I power" → "+1 power"
- [ ] Ashwini Kumars: rarity star shows RARE/blue, must be UNCOMMON/green
- [ ] Name bar subtitles inconsistent across cards — pick one standard
- [ ] Urvashi: costume review for 12+ rating before store submission

## Resolved rulings (2026-07 — official, implemented in engine.js)
1. **R1 Death at 0** — Unit at ≤0 power is destroyed (discard + death triggers); enforced generically by `sweepDeaths()`.
2. **R2 Round lead** — R2/R3 previous winner leads; a drawn round keeps the prior leader.
3. **R3 Deva Soldier** — redesigned: "While Indra is on the board, +1 power at the start of each of your turns" (`onTurnStart()`).
4. **R4 Amrita Kalasha** — "ON PLAY: your lowest power Unit gains +2; if destroyed this round it revives at 1 power (once)."
5. **R5 Tataka self-exclusion** (2026-07, confirmed) — Tataka's "lowest power Unit on the board" **excludes Tataka herself**; she can still destroy your other Units, but never suicides on entry. (`playCard` tataka case filters `u!==c`.)
6. **R6 Leap adjacency** — Units only; Heroes on the Yuddha Row are never valid Leap sources. Positioning is **units-only** (Heroes stay in a separate positionless row); Riksha's "+3 adjacent to Hanuman" → "+3 while Hanuman is on the board."
7. **R7 Angad** — while Angad is on the board, when the opponent plays an Astra they forfeit their next turn (`skipNext`). Stacks with Varuna's per-round astra limit (both apply if both on board).
8. **R8 Kishkindha Oath** — a proactive ward: play on a friendly Vanara Unit; the next time it would be destroyed this round it survives at 1 power and all other friendly Vanara Units gain +1. Expires at round end if unused (`ward` flag).

## Vanara faction (2026-07 — implemented, docs/VANARA_ROSTER.md)
- 22 cards; mechanic **LEAP** (a Vanara Unit copies an adjacent ally's power). **Board positioning** added faction-agnostically (units occupy ordered slots; adjacency = array neighbours; `playCard(...position)`). Devas/Asuras ignore position.
- Owner ambiguity rulings: **units-only positions** (heroes positionless); once/round (twice with Kishkindha Crown). Mainda gives a free bonus Leap on entry (no limit spent); Crown → both units +2 per Leap.
- **Leap turn-cost:** originally implemented as a free action; **changed to COST the turn** during Vanara-release balance tuning (owner-approved nuclear lever). AI Leaps only when the gain beats the best card play; UI Leap yields the turn.
- **Vayu restored** to its GDD ability now that positioning is real: displaces the highest enemy Unit out of formation (breaks Leap adjacency) and −2 power.
- §9 paths: Leap copies power only (never the Dharma Shield); Venom hits leapers; Rama's Signet negates Venom on friendly Vanara Units + floors them at 1; Rama Naam "uncounterable by Naga" hook pre-wired (dormant).
- AI: free-Leap when gain ≥3; placement slots new Units beside the strongest ally (Leap pairs, no edge isolation).

## Asura faction (2026-07 — implemented, docs/ASURA_ROSTER.md)
- 22 cards; mechanic CHAOS SURGE; Chandrahas double; generic Venom-token infra (reused later by Nagas).
- §9 cross-faction paths coded (Brahmastra>Hiranya, Chandrahas+Bana, Tamasa≠Mahabali). Manasa/Surasa hooks present but dormant (Naga not built).
- Ambiguity rulings: Mahabali extra-turn tempo; Kumbhakarna asleep=0 then wakes+sweeps; Nagastra venom vs Hiranyakashipu → immunity holds (floors at 1); **Tataka excludes itself** from "lowest Unit" (owner may revisit).
- UI: faction-select screen (any Deva/Asura combo); Asura half/cards/HUD themed crimson; Asura art naming `Asuras_...` (PNGs pending, text fallback shows crimson frames).

## Build
- `node src/build.js` inlines src/engine.js into index.html between ENGINE markers. Run after every engine change.

## Simulation baselines (500 sims/matchup)
- v0.1 (Deva mirror): 51/47/6(draw), 53% reach R3
- Post R1–R4 (Deva mirror): ~48/47/5, 52% R3
- **Asura release**: Deva mirror 48/47/5 · Asura mirror 53/43/3 · Deva-vs-Asura **Devas 66% / Asuras 34%**.
- After Asura-AI piloting fixes: essentially unchanged (Devas 65 / Asuras 35) — piloting was not the lever.

## Balance experiments (2026-07 — one change each, full harness between)
- **EXP-A — Dharma Shield sticky (fidelity fix, implemented):** shield latches onto the strongest Unit at the first shield opportunity of the round and STAYS (no dynamic re-targeting); Dharma Kavacha = 2 sticky slots (`designateShields()`). Result: Deva mirror shifted slightly (47/48, +draws) — Vajra can now hit a big *unshielded* Unit; **Deva-vs-Asura unchanged (Devas ~65 / Asuras ~35)**. Dharma Shield only interacts with Vajra (Deva-only astra), so it is invisible cross-faction. Pure fidelity fix, not a balance lever.
- **EXP-B — Chandrahas R6-candidate (implemented):** added `ON PLAY: trigger one Chaos Surge` to Chandrahas. Result: **Deva-vs-Asura Devas 61.8 / Asuras 38.2** (gap −3pts); Chandrahas mirror win-rate 36.5% → 39.2% (still marginally sub-40%). Helps but does not close the gap.
- **R6 (candidate, pending owner sign-off):** the Chandrahas ON PLAY Chaos Surge above. Currently live in engine.js.

## Not touched
- **Pavamana** — sits at ~39% mirror win-rate but is deliberately **left alone**: it is anti-Venom / anti-attrition tech whose value can't be measured until the **Naga** faction (Venom decks) exists. Any nerf now would be measuring it in a meta it isn't designed for. Revisit after Nagas ship.

## Balance experiments — Vanara release tuning (2026-07, one change each, 6-matchup harness between)
- **EXP-A** sticky Dharma Shield (correctness) + **EXP-B / R9-candidate** Chandrahas "ON PLAY: one Chaos Surge" — both already live from earlier tuning.
- **EXP-C** Chaos Surge **+2 → +3** (faction-wide Asura lever). Deva-vs-Asura 61.8/38.2 → **57.7/42.3**; Asura-vs-Vanara barely moved (31→32). Helps Asura vs Deva, not vs Vanara.
- **EXP-D** Vanara trim: Neela flat +1 (dropped Sugriva upgrade), Rama Naam flat +2 (dropped Hanuman upgrade). Deva-vs-Vanara 57.7 → **57.0**; Asura-vs-Vanara 67.8 → **66.2**. Marginal.
- **EXP-E NOT RUN** — gate ("Vanaras >58% vs both") closed after EXP-D (Vanaras-vs-Deva 57.0%). Kishkindha Crown +2/+2 untouched.
- **EXP-nuclear — Leap costs the turn** (tried, then **REVERTED**). It bought only ~3 pts on the worst matchup (Asura-vs-Vanara 66.2 → 63.4) while reversing the free-Leap design the owner had chosen. Owner call: the gain didn't justify the design cost → **Leap is FREE again** (R6-era behaviour restored in `aiTakeTurn` + UI `leapClick`). Confirmed Leap is not the load-bearing Vanara lever.
- **EXP-F — Hanuman entry bonus gated to printed power ≥4** (units-only; Sanjeevani revive gated too; card text + AI updated: midsize units valued up, go-wide chaff nudged down under Hanuman). Result vs its free-Leap baseline (EXP-D): Deva-vs-Vanara 57.0 → **55.9**, Asura-vs-Vanara 66.2 → **64.6**. Modest again.
- **Asura-vs-Vanara still 64.6/35.4 (>60/40) after EXP-F** → owner chose an Asura-floor sequence preserving the spell-gated identity:
  - **EXP-G — Kumbhakarna ruling revision** (revisiting our own harsh reading, like Dharma Shield): his power now counts while asleep; `asleep` only defers the wake-sweep. No printed-stat/art change. Result: ~flat (marginal card; buff only bites when the round ends before he wakes).
  - **EXP-H — Chaos Surge triggers on Astras AND Mantras** (5 spell-triggers in deck, not 3). Big hit: **Deva-vs-Asura 58/42 → 53.4/46.6 (in band)**; Asura-vs-Vanara 67→63.8. Still spell-gated.
  - **EXP-I — Chaos Surge on Unit plays at +2**: literal "every Unit" version **overshot 3×** (23/77) → reverted; **tamed** to spell-starved-only → Deva/Asura 48.3/51.7, Asura/Vanara 60.0. But the spell-starved condition is **human-exploitable** (dump spells early to switch on permanent unit-surges) → replaced by EXP-J.
  - **EXP-J — "Chaos always finds a way" (replaces tamed-I):** if no Chaos Surge has fired this round, the Asura player's first Unit play triggers exactly one — a guaranteed, non-exploitable floor. A full +3 surge fired ~every round → overshot 3×; **settled at +1** (spell surges stay +3). Result: Deva/Asura **45.4/54.6 (in band)**, Asura/Vanara 40.9/59.1. Matches tamed-I's balance, exploit-free.
  - **EXP-E — Kishkindha Crown +2/+2 → +1/+1** (un-gated Vanara trim). Deva/Vanara 55.9 → **55.4**, Asura/Vanara 59.1 → **57.7**.
  - **EXP-K NOT RUN** — gate ("both Vanara crosses >57/43") not met after EXP-E: Deva/Vanara is 55.4 (≤57). Hanuman "first 2 Units per round" untouched.

## BALANCE FROZEN (2026-07)
Tuning is frozen here — EXP-K and all further levers are **not** to be run. Rationale:
1. **Noise-level gap.** The one remaining out-of-band cross (Asura-vs-Vanara 57.7/42.3) is ~2.7 pts out; at 500 sims the per-cell std error is ~2.2 pts, so it's barely distinguishable from the band edge. Chasing it risks over-fitting to AI/sim artefacts.
2. **Nagas will reshape the meta.** A 4th faction (Venom) is next; every cross number will move once it exists. Fine-tuning the 3-faction meta now is throwaway work.
3. **Venom naturally counters go-wide.** Vanara's edge is board-wide buffs / many Units; Venom (a token on *every* enemy Unit, −1 at round end, 0 kills) is a structural answer to wide boards. The remaining Vanara lean is likely self-correcting once Nagas ship.
Revisit balance only after the Naga faction lands (re-run the harness at 8 matchups then).

## Current balance (post EXP-A..H + J + E — 6 matchups, 500 sims each)
- Mirrors (P0/P1/draw): Deva 47/48/5 · Asura 52/45/3 · Vanara 51/46/3 — all internally balanced.
- Cross (decided): **Devas 45.4 / Asuras 54.6 (in band)** · **Vanaras 55.4 / Devas 44.6** · **Vanaras 57.7 / Asuras 42.3**.
- From the ugly start of this saga (Asura/Vanara 68.8/31.2) to **57.7/42.3** — worst cross is now 57.7. Deva/Asura in band; Deva/Vanara at the 55/45 edge (within noise); Asura/Vanara the last ~2.7 out. EXP-K's gate closed, so per plan we stop here. Every mirror stayed balanced throughout; all invariants pass.
