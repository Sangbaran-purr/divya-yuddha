# RULINGS R58–R62 — batch-19 ratifications + the final-two pre-rulings
# (v2 — R58 parenthetical corrected to power-only after the Task 20
# STEP-0 ratification check caught a drafting error: the original
# "(R21 base+power)" contradicted the batch-19 engine, the Pavamana
# precedent, and R58's own rationale. Engine unchanged; the ruling
# text was wrong, not the code.)
# R58–R60 canonize readings already implemented in batch 19 (engine
# cross-check mandatory before append — ratification check).
# R61–R62 are PRE-RULINGS: they SPEC the two unimplemented cards
# (Kartikeya-vs-Brahmadanda precedent). For these, the ruling is the
# implementation authority; STEP-0 feasibility findings that contradict
# them are STOP-AND-REPORT, not silent deviation.

R58 — GARUDA (recipient of "+1 per token")
Printed: "On Play: remove all friendly Venom; +1 per token."
Ruling: per-unit distribution — each friendly unit gains +1 POWER per
venom token removed from IT (power-only, the Pavamana precedent; base
untouched — the buff is lost when the unit leaves the board, whether
by the round-end clear or by death, and a later revival resets to
printed base). The hero-self-buff reading is REJECTED: a self-buff on
a persistent hero compounds across rounds — per-unit power-only is
the weakest defensible reading and the better design (the cleanser
restores the sufferers). Degenerate: no friendly venom on board =
no-op.

R59 — MAHISHI (ownership + timing)
Printed: "Round End: copies strongest Unit's POWER (Hero row kept,
no abilities)."
Ruling: (a) "strongest Unit" = strongest FRIENDLY unit by effPower —
strictly weaker-or-equal to a global-strongest reading, since
friendly-max ≤ either-side-max by definition. (b) Resolves LAST in
the canonical round-end hook (after Kalpavriksha), reads the settled
post-hook state, and counts toward that round's score — consistent
with every other hook effect; carving Mahishi out to post-scoring
would be a structural exception. (c) Copy is power-only, never
abilities; Mahishi remains in the Hero row and persists. Degenerate:
no friendly unit on board = keeps current power.

R60 — KULIKA (degenerate case)
Printed: "On Play: transfer all friendly Venom to enemies (random)."
Ruling: transfer requires a destination — with no enemy units on
board the effect does nothing and the friendly venom STAYS in place.
The free-cleanse reading (venom removed regardless) is strictly
stronger and is rejected. Random distribution is per-token via g.rng.

R61 — NAHUSHA, FALLEN KING (realm-side toggle semantics) [PRE-RULING]
Printed: "On Play: choose the realm's effect to apply to YOUR side
only this round."
Ruling: (a) Mechanical model: each side carries a realm-enabled state,
default ON. Nahusha's on-play SUPPRESSES the realm on the ENEMY side
for the remainder of the current round; his own side is unchanged.
"Yours only" is achieved by subtraction, not addition. (b) Reverts at
round end — the suppression is round-bound and does not persist or
recur. (c) With a single active realm the printed "choose" is
degenerate; resolves automatically on play, no picker (nothing joins
the R50 deferred-picker list). (d) No active realm in the match =
no-op. (e) Mirror case: if both players resolve Nahusha in the same
round, each suppresses the other's side — the realm is dead for the
round on both sides. This is the coherent consequence of the model,
not a bug. (f) Re-entry via bounce re-triggers the on-play normally;
R46's bounce round-lock is the loop guard, unchanged.

R62 — THRONE OF THE SECOND KING (drain-steal semantics) [PRE-RULING]
Printed: "Venom drains STEAL: strongest friendly gains what Venom
takes."
Ruling: (a) Scope: applies to venom-caused power loss suffered by
ENEMY units only, while the Throne is on the owner's board. Drains
on the owner's OWN units (Uraga Colossus's self-price, any venom
returned to the owner's side) are NOT stolen — converting your own
price into profit is the strictly stronger reading and is rejected.
(b) Trigger set: EVERY enemy-side venom drain event while active —
the round-end pipeline (passive + tokens), any mid-round pipeline
pass (Hymn of the Depths), and any deepened amounts (Vasuki's
round-3 passive, the launch Patala Throne artifact). The steal
follows the drain wherever the drain fires. (c) Amount: per drain
event, the recipient gains exactly the power venom actually REMOVED —
overkill on a dying unit does not transfer (what venom takes, not
what it attempts). (d) Recipient: the owner's highest-effPower
friendly at the moment of each drain event, re-evaluated per event;
heroes are eligible. Gains are POWER-ONLY (base untouched) — the
printed text does not say "permanently", and the canon convention
reserves R21 base+power for that printed word; on a hero recipient
the gained power still persists across rounds because heroes survive
the clear. (e) No
friendly presence on board at the event = that steal is lost, not
banked. (f) No cap, as printed — the Iron Crucible precedent (R52):
uncapped as-written, the sim campaign decides. Named sim lines:
(i) Second King × launch Patala Throne — deepened drains steal
deepened amounts, the steal SCALES; (ii) hero-recipient gains persist
across the round-end clear — the compounding vector; (iii) Second
King × Hymn — two steal windows per round.
