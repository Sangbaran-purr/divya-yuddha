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
- `assets/cards/` — final framed card PNGs, naming: `{Faction}_{Type}_{Name}_P{power}_r{Rarity}_png.png`
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
- Only Deva faction implemented; mirror match only

## OPEN DESIGN RULINGS (ask the owner before implementing around these)
1. **Deva Soldier** "+1 at start of each round with Indra" can never trigger (units clear between rounds) — needs redesign
2. **Amrita Kalasha** same dead-trigger problem — v0.1 reworked to on-play; needs official ruling
3. Who leads Round 2/3? v0.1: previous round winner leads (Gwent-style) — unconfirmed
4. Does a unit die at 0 power? v0.1: yes — unconfirmed, hugely affects Naga/Venom balance

## Current phase: Phase 3
Next up, in order:
1. Real card art in the UI (assets/cards/)
2. Asura faction abilities + Chaos Surge
3. Vanara faction (requires board positioning for Leap adjacency)
4. Naga faction + Venom tokens
5. The 16 cross-faction rulings from GDD Section 9
6. Deck selection screen
