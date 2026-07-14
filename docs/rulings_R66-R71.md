# RULINGS R66–R71 — DESIGN ROUND ONE (Asura/Vanara wave rebalance)
# Ruled by Sangbaran 2026-07-14 (batch review, all recommendations
# accepted). Basis: Task 24a per-card tables + 21b ablations + the
# Task-23 exhausted delta ladder. These rulings CHANGE SHIPPED WAVE
# CARDS: the R40b/R49a/R54 precedent applies — doc append + engine
# delta + full parity ceremony + re-measure gate in one task. All six
# cards are wave-gated; flag-off is structurally safe and the
# ceremony runs anyway.
# ART GATE: every card below changes printed text — all six frames
# are gated (Mahishi was already gated by R64).

R66 — MAHISHI (once-per-game bound)
Old: "Round End: copies strongest Unit's POWER (Hero row kept, no
abilities)." (R59 semantics; R64 P6.)
Measured: +10.0 Δbase AFTER the P6 cut; 73.6% in the epicenter;
ablation −3.0 — an ability problem, not a power problem.
NEW TEXT: "Round End (once per game): becomes a copy of the
strongest friendly Unit's power."
Semantics: (a) fires at the FIRST round end where the copy would
INCREASE her power; a round end where it would not is a hold, not a
spend — the charge is consumed only on a gain. Deterministic, no
picker. (b) All other R59 semantics stand: friendly-only, last in
the canonical hook, counts toward that round's score, power-only,
hero row kept, persists. (c) The once-flag is per-match state on
the hero.

R67 — BLOOD OATH (card-engine haircut)
Old: "Destroy your lowest Unit: draw 2."
Measured: +4.9 Δbase (+7.4 epicenter); the printed price is nearly
free (spent bodies, Rakta tokens) and board-positive with
Raktabija's Curse.
NEW TEXT: "Destroy your lowest Unit: draw 1."
Semantics unchanged otherwise: the destroy is a real destroyUnit
(death listeners fire, Raktabija spawns, deathsThisRound counts).

R68 — SETU MASON (interior payoff)
Old (R40b): "+1 while adjacent to Vanaras on BOTH sides."
Measured: −7.2 Δbase — perfect interior play yields a P3 common.
NEW TEXT: "+2 while adjacent to Vanaras on BOTH sides."
Read-time effPower passive as shipped; only the constant changes.

R69 — DRUMMER OF THE HOST (permanent formation reward)
Old: "On Play: adjacent Units +1 this round."
Measured: −5.0 Δbase at 96% played — the temporary +1s evaporate.
NEW TEXT: "On Play: adjacent Units gain +1 permanently."
Semantics: recipients are his non-ghost immediate neighbours at the
moment he enters (both sides where present); printed "permanently"
→ R21 base+power.

R70 — VAULT OF THE SKY (keeper buff)
Old: "Move a friendly Unit anywhere on your side; it gains +2 this
round."
Measured: −6.9 Δbase, 449 fires — the move works, the payoff is
vapor.
NEW TEXT: "Move a friendly Unit anywhere on your side; it gains +2
permanently."
Move mechanics unchanged (moveUnit primitive, movePosition channel,
R50 picker deferral stands); printed "permanently" → base+power.

R71 — MATANGA'S BLESSING (self-contained rework)
Old: "Your next Leap this round grants +2 to both Units (stacks
with Crown)."
Measured: −9.4 Δbase and 34 fires from 445 casts (92% dead) — the
next-leap window almost never opens after the cast.
NEW TEXT: "Immediately Leap with one friendly Unit (does not count
against the round's Leap limit); both Units gain +2 this round."
Semantics: (a) the leap is a REAL doLeap — onLeap listeners fire
(Kumuda, Rambha) and Gandhamadana's anywhere-targeting widens the
legal pairs. (b) Pair selection: the existing AI bestLeap heuristic;
the human picker joins the R50 deferral list. (c) No legal leap
pair on cast → logged no-op (weakest reading). (d) The +2 to both
is THIS ROUND (no printed "permanently"). (e) The leap-limit
exemption applies only to this granted leap; the Crown clause is
dropped as moot (nothing is consumed).

NOTE — SETU STONES TO THE SEASONAL REDESIGN QUEUE
Measured −14.4 Δbase with 0.002 anchor opportunities/game across
two tasks: a nudge cannot save it. Formally queued for the seasonal
pass as a REDESIGN candidate; no delta this round. The Living
Bridge holds as re-texted (R63 is one measurement old).

GUARDS (binding on the re-measure): Deva–Naga counter ~41/59
re-verified; Naga aggregate must remain in band while moving in
both directions (up from R66/R67, down from R68–R71); Deva
likewise. Targets: both breached factions within ±3, counter held,
in-band factions undisturbed.
