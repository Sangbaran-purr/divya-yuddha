# Divya Yuddha — Design Decisions & QA Log

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
- **Asura release**: Deva mirror 48/47/5 · Asura mirror 53/43/3 · Deva-vs-Asura **Devas 66% / Asuras 34%**. All invariants pass.
- ⚠ Asuras underperform (~34% vs Devas) — combo-heavy kit + simple AI; Chandrahas correlates with losing (33% win-rate when played). Flag for balance tuning; not yet adjusted (roster is verbatim GDD).
