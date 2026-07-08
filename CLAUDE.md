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
- `docs/GDD_DELTAS.md` — **authority for card frame text**: every gameplay divergence from GDD v2.0 in printed-card-text form (rulings R1–R9, tuned numbers). Use this, not the GDD PDF, when arting frames.
- `assets/cards/` — final framed card PNGs. **Two filename patterns** by card type:
  - **Powered** (Units/Heroes, `base>0`): `{Faction}_{Type}_{Name}_P{printedPower}_r{RarityName}.png`
  - **Powerless** (Astra/Mantra/Artifact, `base===0`): `{Faction}_{Type}_{Name}_r{RarityName}.png` — **no power segment** (both patterns end in `_r{Rarity}.png`; no `_png` suffix anywhere)
  - Faction is the plural (`Devas`, `Asuras`, `Vanaras`, `Nagas`); Type is Title-cased (`Hero`/`Unit`/`Astra`/`Mantra`/`Artifact`); **Name segment = the card name with ALL non-alphanumeric characters removed** (`c.n.replace(/[^A-Za-z0-9]/g,'')` — strips spaces AND apostrophes etc.: `Rama's Signet`→`RamasSignet`, `Surya Dev`→`SuryaDev`, `Ashwini Kumars`→`AshwiniKumars`); power is the card's **printed/base** power; Rarity is the **full name** (`Legendary`/`Mythic`/`Epic`/`Rare`/`Uncommon`/`Common`).
  - `cardArtSrc` (in index.html UI) branches on `c.base > 0` to pick the pattern.
  - Examples: `Devas_Hero_Indra_P7_rLegendary.png`, `Devas_Unit_SuryaDev_P6_rEpic.png`, `Devas_Astra_Vajra_rLegendary.png`, `Asuras_Hero_Mahabali_P8_rLegendary.png`
- The full GDD v2.0 PDF is the design authority (in the owner's Claude Project / Google Drive)

## Engine architecture rules
1. Engine stays headless — no DOM access in engine.js, ever
2. Every card ability is dispatched by card `id` in `playCard()` / passives computed in `effPower()` and helpers
3. All randomness goes through `g.rng` (injectable for seeded, reproducible tests)
4. Every rule change requires `node src/test.js` to pass all invariants before committing
5. Cross-faction rulings (GDD Section 9) must be implemented as explicit code paths with comments citing the ruling
6. **Counter-effects and protective effects: implement the exact printed text — the weakest defensible reading — and flag any strengthening or simplification to the owner.** Fidelity bugs in counters have caused every major balance distortion in this project (Dharma Shield, Karkotaka R10, Rama's Signet, Pavamana candidate).
7. **Event stream (`g.events`) is OBSERVATIONAL, never causal.** Every damage/buff/destroy/revive/trigger/token/faction-passive calls `emit(g,type,{sourceUid,targetUids,amount,abilityName,text})` alongside its `log()`. `emit()` must never touch game state or `g.rng` — outcomes must stay byte-identical whether or not `g.events` is consumed (verify: harness win-rates unchanged vs the LAUNCH BASELINE). The flat `g.log` stays as the backup channel. The UI (`index.html`) choreographs `g.events` **sequentially** via `runAction()`/`playEvent()` (source pulse + ability callout → staggered per-target floaters/dissolves, faction toasts, input-locked with tap-to-skip); `prefers-reduced-motion` bypasses choreography for instant resolution + log.

## Game rules cheat sheet
- 22-card decks, draw 10 at start, +2 at rounds 2 and 3, no hand limit, **mulligan up to 3 before Round 1 (implemented — GDD §2.2)**
- **Each match is assigned one of the 7 Cosmic Realms (GDD §10) — an engine-level modifier; random by default, `opts.realm` fixes it for tests**
- Play exactly 1 card per turn OR pass; once passed, out for the round; round ends when both pass
- Rounds: higher Yuddha Row total wins; best of 3
- Between rounds: Units and Artifacts CLEAR, Heroes PERSIST, unused hand carries forward, played cards never return
- Max 1 Hero played per round; max 1 Astra per turn; max 1 Artifact active
- Heroes are immune to Astras by default (exceptions: Sudarshana, Takshaka rule)
- Faction passives: Devas=Dharma Shield, Asuras=Chaos Surge, Vanaras=Leap, Nagas=Venom

## v0.1 simplifications (KNOWN, intentional — do not treat as bugs)
- Dharma Shield: the HUMAN Deva player **designates manually** (🛡 SHIELD button → tap a friendly Unit; sticky per EXP-A, Kavacha = 2 designations, **no auto-fallback if unused — unused is unused**). The AI keeps its designate-at-first-opportunity auto-pick (highest-power), so the balance baseline is untouched (`pl.manualShield` gates the two paths; `designateShield()` is the manual call).
- Board positioning: units occupy ordered slots (`pl.units` order = position); adjacency = array neighbours. Units-only (Heroes positionless); Devas/Asuras ignore position, Vanaras use it for Leap. Placement passed as `playCard(...position)`.
- Vayu: original GDD ability restored — displaces the highest enemy Unit out of formation (breaks Vanara Leap adjacency) and −2 power.
- All 4 factions implemented (88 cards): Devas + Asuras + Vanaras + **Nagas (complete — cards, §9, Venom pipeline, teal UI)**. Faction select in the UI; any combo playable. (Balance FROZEN for launch — see BALANCE.)
- `index.html` engine is generated from `src/engine.js` by `node src/build.js` (run after every engine change).

## RESOLVED RULINGS (2026-07, official — implemented in engine.js)
- **R1 — Death at 0:** a Unit whose power reaches 0 or less is DESTROYED (to discard, triggers Yama-style death effects). Enforced generically by `sweepDeaths()` so Venom-token ticks also kill.
- **R2 — Round lead:** Rounds 2/3 the previous round's WINNER plays first; on a drawn round, the same leader as before. (`endRound`: `prev.winner ?? firstThisRound`.)
- **R3 — Deva Soldier (redesigned):** "PASSIVE: While Indra is on the board, gains +1 power at the start of each of your turns." Implemented via `onTurnStart()`.
- **R4 — Amrita Kalasha (official):** "ON PLAY: Your lowest power Unit gains +2. If that unit is destroyed this round, it revives at 1 power (once)." (aegis flag, cleared on round reset.)
- **R5 — Tataka:** "lowest Unit on the board" excludes Tataka herself (a removal Unit shouldn't primarily suicide).
- **R6 — Leap adjacency:** Units only; Heroes on the Yuddha Row are never valid Leap sources. (Positioning is units-only; Heroes stay in their own positionless row.)
- **R7 — Angad:** while Angad is on the board, when the opponent plays an Astra they forfeit their next turn (`skipNext`). Stacks with Varuna's astra limit — both apply if both on board.
- **R8 — Kishkindha Oath:** proactive ward — play it on a friendly Vanara Unit; the next time that unit would be destroyed this round it survives at 1 power and all other friendly Vanara Units gain +1. Ward expires at round end if unused (`ward` flag).
- **R9 — Chandrahas (Asura):** ON PLAY, trigger one Chaos Surge (removes its dead turn). Also the standing PASSIVE.
- **R10 — Karkotaka (Naga, flag A):** while on board, the Venom drain ticks at the start of each OPPONENT turn during the round instead of once at round end (continuous attrition).
- **R11 — Patala Throne (flag B):** while active, Venom drain = −(1 + current round number). R1 −2, R2 −3, R3 −4.
- **R12 — Surasa (flag C):** one-shot trap on the opponent's next card — a Unit enters with −2 power and Surasa gains +2; an Astra is negated (Chaos Surge still triggers per §9). Trap expires after one card.
- **R13 — Venom Tokens (flag D):** drain their bearer at each tick regardless of side; Mrityunjaya's revived Unit pays the corruption cost.
- **R14 — Ananta Coil (flag E):** tokens persist for the rest of the MATCH, draining 1 from a random enemy Unit at each Venom tick.
- **R15 — Shesha (flag F):** at the start of the next round after a lost round, a random friendly Unit returns from discard to the board at full power.
- **R16 — Kaliya / Ashvatara (flag G):** Kaliya enters with +(current round − 1) power; Ashvatara's drain = current round number.
- (Four supplementary Naga engine rulings are logged below as **R17–R20**.)

## ASURA RULINGS (2026-07, official — see docs/ASURA_ROSTER.md)
- **Mahabali** "played for free" = the first Unit played the round after a *voluntary* Pass grants an immediate extra turn (tempo, not cost). Forced Pass (Tamasa) does not arm it.
- **Kumbhakarna** power does NOT count while asleep; wakes at the start of its owner's next turn, sweeps 3 damage to all enemy Units, then counts.
- **Nagastra Venom vs Hiranyakashipu** — immunity holds: venom ticks it but floors at 1; only Brahmastra/a Mantra removes it. Venom ticks at round end BEFORE scoring.
- **R5 — Tataka** (confirmed): "lowest Unit on the board" excludes Tataka herself (a removal Unit shouldn't primarily suicide); she can still hit your other Units.
- Chaos Surge / Chandrahas / §9 cross-faction paths — implemented; see engine `resolveAstra`/`chaosSurge`/`onAstraResolved`. §9 Manasa/Surasa now LIVE (Naga shipped).

## NAGA SUPPLEMENTARY RULINGS (R17–R20, official — docs/GDD_DELTAS.md)
- **R17 — Venom stacking** is ADDITIVE: perUnit drain = 1 + (Patala: +round) + (Vasuki on board & R3: +1) + (Venom Strike: +2, or +3 with Vasuki). Karkotaka is an orthogonal *timing* modifier.
- **R18 — Manasa** = on-board negation: while she is on the board the opponent's Astras are cancelled (effect + Chaos Surge). Surasa (R12) is the one-shot trap — the §9 asymmetry sides.
- **R19 — Astika** skips the next Venom tick and heals friendly Units +1.
- **R20 — Nagapasha** unbind is a turn-costing opponent action; an un-freed bound Unit scores 0 (and `totalPower` skips bound Heroes for the Takshaka §9 case).

## BALANCE — FROZEN FOR LAUNCH (2026-07). LAUNCH BASELINE — all future balance work diffs against this table.
`node src/test.js` — 10 matchups (4 mirrors + 6 crosses) × 500 AI-vs-AI sims. Decided-game win% (draws excluded):

| Matchup | Result | Band |
|---|---|---|
| Deva mirror | 49.8 / 50.2 | ✅ |
| Asura mirror | 53.6 / 46.4 | ✅ |
| Vanara mirror | 52.8 / 47.2 | ✅ |
| Naga mirror | 51.4 / 48.6 | ✅ |
| Devas vs Asuras | 47.7 / 52.3 | ✅ |
| Devas vs Vanaras | 45.1 / 54.9 | ✅ |
| Asuras vs Vanaras | 42.3 / 57.7 | ✅ |
| Devas vs **Nagas** | 40.9 / **59.1** | ◆ accepted counter-matchup |
| Asuras vs **Nagas** | 49.0 / 51.0 | ✅ |
| Vanaras vs **Nagas** | 57.3 / 42.7 | ✅ |

- **Band:** every cross sits in [40.9, 59.1]. **Deva-vs-Naga 59.1 is the one accepted >58 point** — the designated poison-vs-go-wide counter-matchup (design intent), reached with all counters fidelity-correct, so the number has clean provenance (not a bug).
- **Naga integration levers (all applied):** **EXP-L** Karkotaka per-turn tick → flat −1 (escalation only round-end). **EXP-L2** Karkotaka → a single flat −1 early tick on the first pass (killed the ~6×/round volume). **EXP-M** counter-piloting AI (Deva holds Pavamana to 2+ tokens/round-end; Vanara prioritises Signet vs Nagas; all AIs devalue go-wide vs Nagas — measurement of competent play, NOT a detune). Base −1 round-end drain is GDD-verbatim and was never touched.
- **Fidelity fixes during the pass (see rule #6 + GDD_DELTAS):** **Rama's Signet** was blanket-immunity → corrected to floor-at-1 + token-negation (Vanara-vs-Naga 63.8 → 57.3). **Pavamana** was missing clause (b) → restored +1 power per effect removed (Deva-vs-Naga 60.4 → 59.1).
- **Pavamana reads −18pt on played-vs-held in Deva-vs-Naga — EXPECTED, not a defect:** it's reactive damage-control tech; you only hold 2+ Venom Tokens once already losing, so playing it correlates with (not causes) losing.
- Pre-Naga tuning (unchanged, folded in): Chandrahas ON-PLAY Surge · Chaos Surge +3 on Astras+Mantras · +1 floor (EXP-J) · Kumbhakarna counts asleep (EXP-G) · Hanuman entry printed ≥4 (EXP-F) · Kishkindha Crown +1/+1 (EXP-E). All gameplay deltas live in **docs/GDD_DELTAS.md**.
- **Known design hole (owner, Season/errata):** GDD §9 says the Naga answers Rama's Signet by destroying the Artifact, but **no Naga card can destroy Artifacts** (only Deva Vishwakarma). Logged in GDD_DELTAS; not papered over in-engine.

## FEATURE-COMPLETE CHECKLIST (core single-player game loop)
**Core loop is COMPLETE** — mulligan → faction-select → best-of-3 rounds under a Cosmic Realm → match result, with AI opponent and full event choreography.
- ✅ All 4 factions, 88 cards, every §9 cross-faction ruling (R1–R20)
- ✅ Best-of-3 round loop, round-lead (R2), between-round persistence
- ✅ Balance FROZEN for launch (LAUNCH BASELINE table; all counters fidelity-correct)
- ✅ Event stream + sequential UI choreography (rule #7), faction toasts, keyword tooltips, `prefers-reduced-motion` bypass
- ✅ **Mulligan (GDD §2.2)** — up to 3 pre-Round-1, tap-to-mark UI + AI heuristic + choreographed redraw
- ✅ **7 Cosmic Realms (GDD §10)** — `g.realm` engine modifier at chokepoints; match banner + tappable header chip; Mrityulok regression byte-identical to baseline, Swarga/Patala swing measured

- ✅ **Dharma Shield player-designation** — human designates by hand (🛡 SHIELD button, sticky, Kavacha=2, no auto-fallback); AI unchanged, harness byte-identical
- ✅ **Game-feel pass (UI/audio only, engine untouched → harness byte-identical)** — AI think-time 1.2–3.5s scaled by decision weight + "thinking" indicator; opponent-card **showcase** (large center reveal 1.4s) → resolve → **result summary** (plain-language, from event `text`); pacing retune (callout 700ms / stagger 280ms / destroy 600ms dwell; significance & round-end theatre with total count-up); **Settings** (gear): Relaxed/Normal/Fast + music/SFX/volume, localStorage-persisted; tap-to-skip in all modes; reduced-motion keeps audio.
- ✅ **Audio + VFX refinement** — music is now **Karplus-Strong plucked tanpura** (noise→feedback-delay→lowpass; Pa-Sa-Sa-Sa cycle, ~4s ring, jvari buzz, −26dB, 2s fades, Round-3 faster plucks + tabla) with a `window.MUSIC_URL` hook to swap in a real recording; **quick-mute** speaker in header (🔊→🎵→🔇 cycle, persisted); **board VFX**: destroy crack + faction-colored shards, damage impact flash + heavy arc numeral, buff rising ring, venom drip + wet badge, Mythic/Legendary screen-shake + board color-wash + showcase shimmer, shield gold ring, Leap arc. All transform/opacity, ≤1 shake/sec, through the choreography queue. **NOTE: music was implemented but not audibly verified in-harness (headless); the MUSIC_URL fallback is wired for the owner.**

**ENGINEERING BACKLOG: EMPTY.** The core single-player game loop is engineering-complete. The only remaining items are art production and a designed deferral (below) — no code work outstanding.

**Deck building — DECIDED: deferred to Season 2 (designed deferral, not open scope).** 22-card decks drawn from 22-card factions have **zero degrees of freedom** — there is nothing to build. Card-level deckbuilding becomes a real feature only when the pool exceeds the deck size (e.g. Rishis expanding it to **44-into-22**). Until then, faction-select is the correct and complete shipping form.

**Art production (content, NOT engineering; `cardArtSrc` naming already handles all of it):**
- ✅ Devas 22/22 · ✅ **Asuras 22/22** · ✅ Vanaras 22/22 (art present)
- ⏳ **Nagas 0/22** pending
- ⏳ **Four blocking re-exports:** Chandrahas, Hanuman, Neela, Angad

**Post-launch (explicitly out of the core loop):** Capacitor mobile wrap · multiplayer (Node + Colyseus/Nakama) · tutorial/onboarding.
