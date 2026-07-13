# GDD_DELTAS — RULINGS R42–R44 (wave-1 implementation batch 4)
# Ruled by Sangbaran 2026-07-13 (batch review, all recommendations accepted;
# R43 ratified as shipped — strongest reading, canonical text updated).
# Append verbatim to GDD_DELTAS.md. These are card-text authority.

R42 — "DAMAGED" DEFINITION + ROUND-END HOOK ORDER
(1) DAMAGED = current power strictly below base. Consequences: a temporary
dent (Mohanastra-class) is damage and is restorable; a PERMANENT cut
(Surpanakha/Pisacha-class, R21 downward) lowers base too, leaving power
equal to base — such a unit is NOT damaged and there is nothing to restore
toward (R21/R35-consistent). "Restore N" = +N current power, capped at
base. "Restore to printed power" (Dhanvantari-class) = power set to base,
where base reflects all R21 permanent changes, grown or cut.
(2) THE ROUND-END HOOK ORDER is canon for all present and future round-end
card effects: Savitur Verse → decay effects (Pisacha/Mahishasura) →
Kamadhenu → Sushena (restores) → The Living Bridge (permanent +1). The
Venom pipeline runs BEFORE the entire hook (R30). New round-end cards slot
into this order deliberately, never silently.

R43 — DAWN BANNER: CANONICAL TEXT REWRITE (STRONGEST READING, RATIFIED)
Engine verification (Task 12 STEP 0) proved the printed "Round start: all
friendly +1 this round" structurally impossible: every round begins with an
empty board, and artifacts clear at round end — the card can never witness
the moment it names. Ruled canonical, as shipped:
  DAWN BANNER — "From the next round on, your Units get +1 (this effect
  outlives the Banner)."
Implementation: a match-long stamp set on play (dawnBannerFrom = next
round) driving a read-time +1 aura on all friendly Units in every
subsequent round; no retroactive buff in the round of play. This is a
deliberate strongest-reading exception to the weakest-defensible default,
chosen to honor the design's own compounding intent. The SIM flag stays
hot: a permanent aura from one Epic play is priced by the sim campaign,
with a duration haircut (e.g. "for the next two rounds") as the prepared
fallback. Supersedes the WAVE1_ROSTER_v0.2 entry; frame text at art time
follows this ruling.

R44 — VIDYUTASTRA × CHANDRAHAS: SURGE MULTIPLIERS COMPOSE
Chaos Surge multipliers are multiplicative: Vidyutastra's "Chaos Surge
triggers twice on this card" (×2) under an active Chandrahas ("Chaos Surge
triggers twice while active", ×2) composes to FOUR surges (+12 random
friendly power) from one Rare Astra cast. Emergent, demonstrated, ratified
as-is. NAMED SIM FLAG (alongside the Chandrahas-doubled Mohanastra −4): if
the Asura wave warps in the sim campaign, this composition is suspect #1;
the prepared fallback is an additive cap ("surge count = max of the
multipliers, not the product").
