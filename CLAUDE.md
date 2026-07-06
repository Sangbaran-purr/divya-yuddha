# Divya Yuddha — Battle of the Celestials

Mobile-first strategic card battle game based on Indian mythology (Ramayana, Mahabharata, Puranas).
Gwent-style best-of-3 rounds + Hearthstone-style card abilities. 4 factions, 88 cards at launch.
Solo developer (Sangbaran, Creative Director) with Claude as the engineering team.

## Tech stack (decided July 2026 — Unity was abandoned)
- Pure JavaScript rules engine, **zero framework dependencies**, runs in browser AND Node
- UI: vanilla JS + CSS (may migrate to a bundler/TS later; keep engine UI-agnostic)
- Testing: headless AI-vs-AI simulation via Node (`node src/test.js`)
- Mobile shipping plan: Capacitor wrap → iOS App Store + Google Play
- Multiplayer (later): Node backend, Colyseus or Nakama

## Repo layout
- `src/engine.js` — the rules engine. UI-agnostic. All game logic lives here.
- `src/test.js` — simulation harness: 500 AI-vs-AI matches + rule invariants. RUN THIS AFTER EVERY ENGINE CHANGE.
- `index.html` — playable prototype (engine is inlined by a build step; keep src/engine.js canonical)
- `docs/DESIGN_DECISIONS.md` — QA log, approved art, open rulings. Update when decisions are made.
- `assets/cards/` — final framed card PNGs. **Two filename patterns** by card type:
  - **Powered** (Units/Heroes, `base>0`): `{Faction}_{Type}_{Name}_P{printedPower}_r{RarityName}_png.png`
  - **Powerless** (Astra/Mantra/Artifact, `base===0`): `{Faction}_{Type}_{Name}_r{RarityName}.png` — **no power segment, no `_png` suffix**
  - Faction is the plural (`Devas`, `Asuras`, `Vanaras`, `Nagas`); Type is Title-cased (`Hero`/`Unit`/`Astra`/`Mantra`/`Artifact`); Name strips all spaces to CamelCase (no `%20`); power is the card's **printed/base** power; Rarity is the **full name** (`Legendary`/`Mythic`/`Epic`/`Rare`/`Uncommon`/`Common`).
  - `cardArtSrc` (in index.html UI) branches on `c.base > 0` to pick the pattern.
  - Examples: `Devas_Hero_Indra_P7_rLegendary_png.png`, `Devas_Unit_SuryaDev_P6_rEpic_png.png`, `Devas_Astra_Vajra_rLegendary.png`, `Asuras_Mantra_Ahamkara_rUncommon.png`
- The full GDD v2.0 PDF is the design authority (in the owner's Claude Project / Google Drive)

## Engine architecture rules
1. Engine stays headless — no DOM access in engine.js, ever
2. Every card ability is dispatched by card `id` in `playCard()` / passives computed in `effPower()` and helpers
3. All randomness goes through `g.rng` (injectable for seeded, reproducible tests)
4. Every rule change requires `node src/test.js` to pass all invariants before committing
5. Cross-faction rulings (GDD Section 9) must be implemented as explicit code paths with comments citing the ruling

## Game rules cheat sheet
- 22-card decks, draw 10 at start, +2 at rounds 2 and 3, no hand limit, mulligan 3 (NOT yet implemented)
- Play exactly 1 card per turn OR pass; once passed, out for the round; round ends when both pass
- Rounds: higher Yuddha Row total wins; best of 3
- Between rounds: Units and Artifacts CLEAR, Heroes PERSIST, unused hand carries forward, played cards never return
- Max 1 Hero played per round; max 1 Astra per turn; max 1 Artifact active
- Heroes are immune to Astras by default (exceptions: Sudarshana, Takshaka rule)
- Faction passives: Devas=Dharma Shield, Asuras=Chaos Surge, Vanaras=Leap, Nagas=Venom

## v0.1 simplifications (KNOWN, intentional — do not treat as bugs)
- Dharma Shield auto-targets highest-power unit (should be player-designated once per round)
- Vayu: position-swap omitted (no board positioning yet — needed for Vanara Leap adjacency later)
- Mulligan not implemented
- Devas + Asuras implemented (44 cards). Vanaras/Nagas pending. Faction select in the UI; any combo playable.
- `index.html` engine is generated from `src/engine.js` by `node src/build.js` (run after every engine change).

## RESOLVED RULINGS (2026-07, official — implemented in engine.js)
- **R1 — Death at 0:** a Unit whose power reaches 0 or less is DESTROYED (to discard, triggers Yama-style death effects). Enforced generically by `sweepDeaths()` so Venom-token ticks also kill.
- **R2 — Round lead:** Rounds 2/3 the previous round's WINNER plays first; on a drawn round, the same leader as before. (`endRound`: `prev.winner ?? firstThisRound`.)
- **R3 — Deva Soldier (redesigned):** "PASSIVE: While Indra is on the board, gains +1 power at the start of each of your turns." Implemented via `onTurnStart()`.
- **R4 — Amrita Kalasha (official):** "ON PLAY: Your lowest power Unit gains +2. If that unit is destroyed this round, it revives at 1 power (once)." (aegis flag, cleared on round reset.)

## ASURA RULINGS (2026-07, official — see docs/ASURA_ROSTER.md)
- **Mahabali** "played for free" = the first Unit played the round after a *voluntary* Pass grants an immediate extra turn (tempo, not cost). Forced Pass (Tamasa) does not arm it.
- **Kumbhakarna** power does NOT count while asleep; wakes at the start of its owner's next turn, sweeps 3 damage to all enemy Units, then counts.
- **Nagastra Venom vs Hiranyakashipu** — immunity holds: venom ticks it but floors at 1; only Brahmastra/a Mantra removes it. Venom ticks at round end BEFORE scoring.
- **Tataka** interpretation (owner may revisit): "lowest Unit on the board" excludes Tataka itself (a removal Unit shouldn't primarily suicide); it can still hit your other Units.
- Chaos Surge / Chandrahas / §9 cross-faction paths (Manasa/Surasa dormant until Naga) — implemented; see engine `resolveAstra`/`chaosSurge`/`onAstraResolved`.

## BALANCE (500 sims/matchup, `node src/test.js`)
- Deva mirror 48/47/5 · Asura mirror 53/43/3 · Deva-vs-Asura Devas **66%** vs Asuras **34%**.
- Asuras currently underperform (combo-heavy kit + simple AI; Chandrahas mispiloted). Tuning is an owner call — data in the BALANCE REPORT.

## Current phase: Phase 3
Next up, in order:
1. Real card art in the UI (Deva PNGs live; Asura art pending — `Asuras_...` naming, cardArtSrc already handles it)
2. ~~Asura faction abilities + Chaos Surge~~ ✅ done
3. Vanara faction (requires board positioning for Leap adjacency)
4. Naga faction + Venom tokens (generic token infra already built for Nagastra; Manasa/Surasa §9 hooks dormant)
5. The 16 cross-faction rulings from GDD Section 9 (Asura ones done)
6. Deck selection screen (faction select done; card-level deckbuilding later)
