# GDD_DELTAS — RULINGS R51–R54 (wave-1 implementation batch 6)
# Ruled by Sangbaran 2026-07-13 (batch review, all recommendations accepted).
# Append verbatim to GDD_DELTAS.md. These are card-text authority.

R51 — VRITRA'S BIND (AS FOUND)
Vritra's on-play bind rides the shared t.bound flag and ignores Astra
targeting protections (R47 — a hero's on-play is not an Astra). "While
Vritra remains": nothing in the current pools destroys a hero, and the
bound unit clears with the board regardless, so the bind is round-bound
in practice; Sudarshana's temporary hero-removal lifts it; the R20
manual spend-a-turn unbind frees it. (Ratifies the Task-16
implementation as found.)

R52 — REGAIN vs RESTORE: TWO VERBS
"Restore" (Sushena, Dhanvantari-class) is capped at base — R42 stands.
"Regain" (The Iron Crucible) is UNCAPPED — +N current power at round
end regardless of base, so a permanently-decayed unit (power == base
after a Pisacha/Mahishasura cut) still regains. Rationale: anti-decay
is the Crucible's ruled identity; a capped regain would be blind to the
exact effects the retheme answers. The two verbs are now distinct canon;
future card text chooses deliberately. The Crucible's anti-Naga-drift
SIM flag stands. (Ratifies the Task-16 implementation.)

R53 — "LOST POWER THIS ROUND"
Any power-decrease event during the round qualifies, regardless of net
(a unit that lost 2 and gained 3 still lost). Tracked per-unit at every
decrease site. The trackable reading, and the generous one for the
card's owner. (Ratifies the Task-16 implementation.)

R54 — R42 AMENDMENT: THE PRE-DRAIN TOKEN SLOT (PADMAVATI RE-SLOTTED)
Batch-17 shipped Padmavati's round-end Venom application in the R42
hook — AFTER venomRoundEnd — where her token is applied after the
round's only drain, onto units that then clear to discard and are
cleansed by every revival path: applied into the void, a dead card.
Ruled: the R42 canonical order gains a named slot — PRE-DRAIN TOKEN
APPLICATIONS — executing immediately BEFORE venomRoundEnd. Padmavati
moves there: her Venom lands on the strongest enemy and TICKS THAT SAME
ROUND END (deepened in Patala, doubled under the Vasuki-class rules,
per the normal pipeline). The amended canonical order:
  pre-drain token applications (Padmavati-class) → venomRoundEnd →
  [the R42 hook: Savitur → decay → Kamadhenu → Sushena/Crucible →
  Living Bridge → Drowned Altar → Kalpavriksha] → scoring.
Future round-end token appliers use this slot deliberately. This is a
text-preserving implementation re-slot (the printed card text is
unchanged; only WHEN it fires moves). (Amends R42; re-slots the
Task-17 implementation.)
