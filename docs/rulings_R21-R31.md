# GDD_DELTAS — RULINGS R21–R31 (wave-1 pre-implementation batch)
# Ruled by Sangbaran 2026-07-12 (batch review, all recommendations accepted).
# Append verbatim to GDD_DELTAS.md. These are card-text authority.

R21 — PERMANENT POWER CHANGES
"Permanent" = modifies printed power: the effect changes base AND current
power. All effects that read printed power (restore-to-printed, printed-power
thresholds, copy-at-half-printed, etc.) see the modified value. Grown is
grown. (Ratifies the Task-3 implementation of Dawn Sentinel / Pisacha
Skirmisher.)

R22 — ASTRA DAMAGE vs DESTROY vs DEBUFF
"Astra damage" = deal-N effects only — exactly the dmgAstra tag set.
Destroy-class Astras, debuffs (−X), bind effects, and Venom application are
NOT Astra damage. Consequences: Ratri Hymn prevents dmgAstra sources only
(stops Agneyastra/Suryastra/Vidyutastra/Pashupatastra/Lanka Dahan; does not
stop Vajra, Shakti Spear, Gandiva Arrow, Mohanastra, Nagastra, Tamasa).
Patala sharpens dmgAstra sources only (existing behavior, now defined).
HOLIKA sub-ruling: "immune to Astra damage" = dmgAstra sources deal her 0;
"+1 extra from everything else" = any other power reduction (Venom drains,
unit effects, debuffs) is increased by 1. Plain reading; sim watches it.

R23 — KARTIKEYA: "RESOLVES VS YOUR SIDE"
A negated Astra did not resolve — no Kartikeya trigger (Brahmadanda blanks
it). "Vs your side" = the resolution affected at least one of your Units.
Triggers once per Astra, not once per unit hit.

R24 — BRAHMADANDA (ratified pre-staged ruling)
Negation stops the Astra's effect; the caster's Chaos Surge still procs
(R12 Surasa precedent: the cast happened, the effect did not). Sim fallback
if the Asura mirror shifts >2: soften to "the next enemy Astra deals no
damage."

R25 — VEDI KEEPER vs THE SHIELD ECONOMY
Ruled intent: Vedi Keeper removes the action cost of one Dharma Shield this
round. Implementation must verify against the engine's actual shield economy
(both-ways check in its engine task). If shields are already action-free in
the engine, fallback text: "your next Dharma Shield this round may be applied
instantly on playing Vedi Keeper."

R26 — MAYASURA'S BLUEPRINT
Blueprint modifies turn consumption only: once per round, playing an Astra
does not consume the turn (one extra card that turn). Everything else stands:
Angad's forfeit still triggers (he punishes the play, not the turn), any
Astra-count limits stand, Varuna's cap stands.

R27 — "ROW" DEFINITION (positional canon)
"Row" = the player's ordered units array. Position = array index. Adjacency
= index neighbors — exactly the existing adjacentUnits(). No new spatial
model; the engine's is canon. (Unblocks Saranyu-class and all Vanara
positional cards.)

R28 — NAHUSHA'S TOGGLE
On play, this round only: the realm's effect applies to Nahusha's side and
not the opponent's. A one-round flag; the symmetric realm system is otherwise
untouched. Implementation feasibility check remains in its engine task.

R29 — ARUNA CHARIOTEER: "ROUND 1"
"If Round 1" = the match's first round, evaluated at play time (g.round===1).
Played in round 2 or later: no bonus. (Ratifies Task-2 implementation.)

R30 — SAVITUR VERSE + MAHISHASURA (round-end readings)
Savitur Verse tracks its blessed unit by uid, match-long; if that unit is
absent at a round end, nothing happens and the enchant does not retarget.
Mahishasura's "an enemy Unit died this round" = any destruction of an enemy
Unit this round, any cause; Venom kills at round end COUNT (the Venom
pipeline runs before the round-end card hook). (Ratifies Task-3
implementation.)

R31 — ROUND-END DETERMINISM
Kamadhenu's "lowest friendly Unit" tie resolves first-found (deterministic,
no rng). Pisacha Skirmisher reaching 0 power at round end is destroyed per
the engine's zero-power rule. (Ratifies Task-3 implementation.)
