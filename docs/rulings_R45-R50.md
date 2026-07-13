# GDD_DELTAS — RULINGS R45–R50 (wave-1 implementation batch 5)
# Ruled by Sangbaran 2026-07-13 (batch review, all recommendations accepted;
# R49 option (a) selected — both-sides interior).
# Append verbatim to GDD_DELTAS.md. These are card-text authority.

R45 — WORLD-COIL BIND SEMANTICS (AS FOUND)
World-Coil Constrictor and Nagapasha share the t.bound flag; World-Coil's
additional marker gates only its venom-drain self-release. Consequences:
the manual spend-a-turn unbind (R20) is flag-agnostic and frees a
World-Coil bind; a Pavamana-cleansed World-Coil victim has a dead
drain-release path (no venom, nothing to lose) but remains freeable via
the manual unbind — no bind is ever permanent. (Ratifies the Task-13/14
implementation as found.)

R46 — THE BOUNCE ROUND-LOCK
Any card returned to a hand by a bounce effect (Rite of Shed Skin,
Vayavyastra, and all future bounces) is locked for the remainder of the
current round (lockedRound) — it cannot be replayed until next round.
Rationale: kills the replay-loop class generally (the Brihaspati ×
Rite of Shed Skin infinite loop found by the Task-14 smoke), and gives
enemy-bounces their intended tempo denial: a Vayavyastra'd unit cannot
redeploy this round. "It returns exhausted." (Ratifies the Task-14 fix,
retroactively covering Task 13.)

R47 — THE TARGETING LAYER IS ASTRA-ONLY
"Cannot be targeted" protections (Andhaka, Maya Veil, Sharabha-class,
Dharma Shield) live in the Astra targeting layer (astraProtected /
targetSpec). They do NOT prevent unit on-play effects from selecting a
victim: Vinata's Talon hits Andhaka; on-play debuffs and steals select
normally. Astra-immunity is immunity to Astras, nothing broader.
(Ratifies the Task-14 demonstration.)

R48 — SONG OF THE CROSSING: CANONICAL TEXT REWRITE (R27 RESOLUTION)
Under R27 there is exactly one row per player (the ordered units array),
so "all friendly Units in one row" is all friendly Units. Ruled canonical:
  SONG OF THE CROSSING — "Your Units +1 this round; +2 instead if you
  have 4 or more."
Current-power (R34). Supersedes the WAVE1_ROSTER_v0.2 entry; frame text
at art time follows this ruling. (Ratifies the Task-15 implementation.)

R49 — ANJANEYA'S ROAR: PAIRS SHARPENED (OPTION A — R40'S STANDARD)
The flattened reading (+1 to each friendly with any neighbor) degenerates
to a full-board buff on a gapless array — the exact flattening R40 names.
Ruled per R40's standard: the +1 applies to INTERIOR friendly Units only —
those with non-ghost friendly Units on BOTH adjacent sides. Edge units
and lone units receive nothing. The enemy-side −1 (all enemies, debuff,
dmgAstra:false) is unchanged. Canonical text:
  ANJANEYA'S ROAR — "All enemy Units −1 this round; your Units flanked on
  both sides gain +1."
This is a text-and-implementation delta on the shipped Task-15 card. The
SIM flag (vs Rama Naam's crown) stands with the sharpened reading.

R50 — SMALL READINGS BUNDLE (RATIFIED AS SHIPPED)
Vinata's Talon: the Vanara count is self-inclusive, floor(n/2), max 3
hits, single target, non-astra damage (Holika sharpens per hit).
Sampati: the reveal is the minimal honest form — the enemy's highest-base
hand card, logged by name; empty hand no-ops.
Picker deferrals (engine live via targetUid/movePosition, human UI
logged, AI/auto heuristics reported): The Setu Stones anchor, Vault of
the Sky destination, Riksha destination, Saranyu's two-target pair,
Gavaksha's swap partner, Shukracharya's revive target. These UI tasks
batch together when the wave-1 UI pass is scheduled; none blocks sim.
