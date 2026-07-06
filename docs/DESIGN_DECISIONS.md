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

## Blocked
- **docs/ASURA_ROSTER.md missing** — the Asura faction (22 cards, Chaos Surge / Chandrahas, Nagastra + Venom tokens, GDD §9 cross-faction rulings) cannot be built until the roster file is provided. Engine faction plumbing is scaffolded: `DECKS = { devas, asuras:[] }`, per-player `faction`, `newGame({p0Faction,p1Faction})`. Faction-select UI + Asura-vs-Deva balance sims also deferred to that file.

## Simulation baselines
- v0.1 (Deva mirror, 500): win split 51/47/6(draw), 53% reach Round 3
- Post-rulings R1–R4 (Deva mirror, 500): win split ~48/47/5(draw), 52% reach Round 3, all invariants pass
