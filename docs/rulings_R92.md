# RULING R92 — KARKOTAKA ERRATUM (txt-only honesty delta)
# Ruled 2026-07-20. Pattern: T46 (R90/R91). Code is unchanged — the
# single-tick behavior is settled law per EXP-L2 (R10 revision,
# engine.js:644-646); the printed text is stale against that ruling.

OLD TXT (engine.js:206, the lie):
"PASSIVE: Your Venom drain ticks at the start of each opponent turn
instead of once at round end."

NEW TXT (R92):
"PASSIVE: Your Venom drain fires once, the moment either player first
passes each round, instead of at round end."

SCOPE: card txt string only. venomKarkotakaEarly (engine.js:647, called
from pass() @1735 on firstPass) and the round-end skip (@658) are the
authority and do not change. Suite must be byte-identical.

DOWNSTREAM: the Nagas codex venom panel teaches the R92 text. No frame
re-export debt — Karkotaka's wave frame is not yet rolled.
