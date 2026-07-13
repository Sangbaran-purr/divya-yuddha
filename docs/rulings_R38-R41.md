# GDD_DELTAS — RULINGS R38–R41 (wave-1 implementation batch 3)
# Ruled by Sangbaran 2026-07-13 (batch review, all recommendations accepted,
# R40 option (b) selected).
# Append verbatim to GDD_DELTAS.md. These are card-text authority.

R38 — AHAMKARA'S DOOM IS NOT A DEATH
The unit doomed by Ahamkara is not destroyed through destroyUnit; it clears
with the board at round end. No death-conditional effect fires on it:
Mahishasura is not fed, Kartikeya's Vanguard does not trigger, Vishalakshi
the Pale does not grow, Raktabija's Curse does not spawn. The ego shatters;
nothing kills it. (Ratifies launch-emergent behavior surfaced in Task 9.)

R39 — SHUKRACHARYA'S REVIVE (LAUNCH REPAIR #1)
Timing: ON PLAY — "once per game" is structurally satisfied (a Hero enters
once per match and persists; no counter flag). Amount: ceil of half PRINTED
power, minimum 1 (Nala precedent); an R21-grown base revives at half the
grown value; the revive amount itself is not a permanence effect (base
untouched). Target: highest-base fallen friendly Unit auto-selected;
explicit targetUid honored; player-choice UI deferred. Empty discard →
logged no-op. The revived unit returns cleansed and triggers revival
listeners (revival site #9). Wave-1-gated until flag-flip. (Ratifies the
Task-9.5 implementation.)

R40 — FORMATION SEMANTICS UNDER THE GAPLESS BOARD (OPTION B)
The board is a gapless ordered array, so in a mono-faction deck "adjacent to
another Vanara" is true for any Unit that is not alone. Ruling:
(1) SETU MASON's canonical text is SHARPENED to: "+1 while adjacent to
Vanaras on BOTH sides." Interior positions carry formation value; edges do
not. This is a text-and-implementation delta on the shipped Task-10 card.
(2) THE LIVING BRIDGE ships as-written — under this board model "an unbroken
adjacent line of 4+" is equivalent to "4+ Units at round end," and that
equivalence is acknowledged rather than disguised. The card is FORMALLY
SIM-FLAGGED: the sim campaign prices whether a body-count mythic at +1
permanent to all is rate-appropriate, with a power/condition haircut as the
prepared fallback.
(3) Drummer of the Host, Gavaksha, The Setu Stones, and Vault of the Sky are
unaffected — placement-choice and index-exchange effects carry real
positional content already.
Genuine formation content in future designs uses both-neighbor conditions,
placement choice, or index-specific effects — not single-neighbor adjacency.

R41 — RIKSHA'S MOVE (LAUNCH REPAIR #2)
Timing: ON PLAY, after insertion — Riksha enters at his played (or
Stones-overridden) slot, then relocates once via the shared moveUnit
primitive; not a persistent ability. Destination: explicit movePosition
honored (an additive playCard channel; entry position and move destination
are distinct channels and compose with the Setu Stones anchor); otherwise
the AI Leap-setup heuristic (adjacent to the highest-effPower friendly);
bounds-clamped; lone Unit → structural no-op. Player-choice UI deferred
(Vault/Stones status). The Hanuman +3 entry check is untouched launch
behavior and stacks with the general Hanuman entry bonus. Wave-1-gated
until flag-flip. (Ratifies the Task-10.5 implementation.)
