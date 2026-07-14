# RULINGS R72–R75 — DESIGN ROUND TWO (Asura/Vanara wave rebalance)
# Ruled by Sangbaran 2026-07-14 (batch review, all recommendations
# accepted). Basis: post-Task-25 table (Asura +9.1 / Vanara −10.4,
# epicenter 55.6). Shipped-card changes: R40b/R49a/R54 precedent —
# doc append + engine delta + full ceremony + re-measure in one
# task. All four cards wave-gated; flag-off structurally safe;
# ceremony runs anyway.
# ART GATE: all four frames gated (Mahishi re-gates, third change;
# Runner re-numbers to P4; Talon and Kumuda re-text).

R72 — MAHISHI (the persistence kill)
Old (R59/R64/R66): "Round End (once per game): becomes a copy of
the strongest friendly Unit's power." — the copy persisted across
the board clear on the hero for the rest of the match.
Measured lineage: absolute win-when-played flat through BOTH prior
nerfs (69.6 → 71.2). The cross-round carry IS the ability.
NEW TEXT: "Round End (once per game): becomes a copy of the
strongest friendly Unit's power THIS ROUND ONLY."
Semantics: (a) Trigger unchanged from R66: fires at the first round
end where the copy would increase her power; gain-only; the
once-flag is consumed when it fires (the revert does not refund
it). (b) The copied power COUNTS toward that round's score (R59b
stands — she resolves last in the hook, pre-scoring). (c) REVERT:
at the round-end board clear (the same structural moment artifacts
clear, after scoring), she returns to her power as it was
IMMEDIATELY BEFORE the copy — any separately accrued gains she held
pre-copy are preserved; the borrowed shape alone fails. (d) All
other R59 semantics stand: friendly units only (heroes are not
copy sources), power-only, hero row kept, persists as a hero.

R73 — KISHKINDHA RUNNER (stat lift)
Old: vanilla, P3. Measured −10.0 at 93% played — the cheapest
unconditional aggregate lever in the kit.
NEW: vanilla, P4. Text unchanged (none). Thematic note on record:
the runner who crossed to Lanka out-stats Ash Legionnaire's P3, and
carries it. ART GATE: filename re-numbers to P4.

R74 — VINATA'S TALON (uncap the width payoff)
Old: "On Play: deal 1 to an enemy Unit per two friendly Vanaras on
board (max 3)."
NEW TEXT: "On Play: deal 1 to an enemy Unit per two friendly
Vanaras on board."
Semantics: R50 stands in full except the cap — self-inclusive
count, floor(n/2) hits, single target, non-astra damage, Holika
sharpens PER HIT. Honest expectation on record: at measured AI
widths (peak ~5.2) the old cap rarely bound, so the AI-aggregate
effect will be small; the uncap is for the human swarm ceiling and
design correctness. SIM WATCH: uncapped Talon into Holika (2 extra
per two width) and very wide boards.

R75 — KUMUDA (payoff riding the new leap economy)
Old: "Leaps or is Leapt to → +1 permanently." Measured −7.4
pre-R71; the Matanga rework doubled leap volume (1.36 → 2.20/game),
so the trigger now has fuel.
NEW TEXT: "Leaps or is Leapt to → +2 permanently."
Constant-only change; trigger and permanence class exactly as
shipped (STEP 0 quotes the site; the implementing task changes the
number and nothing else).

HOLDS ON RECORD: no further Asura targets (all at/below base except
Mahishi; dilutive filler untouchable). Vault −8.5 is correlational
noise on a just-buffed card — one more measurement before judging
R70. Setu Stones stays in the seasonal queue. The Bridge stays as
re-texted (R63).

GUARDS (binding on the re-measure): Deva–Naga counter ~41/59
re-verified — R72 moves Asura cross-cells and R74's Holika
interaction touches damage paths; Naga and Deva aggregates in band;
targets: both breached factions closing toward ±3, counter held.
