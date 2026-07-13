# RULINGS R55–R57 — batch-18 readings canonized
# Implemented in wave-1 batch 18 (Naga remainder pt1). Appended to
# GDD_DELTAS.md verbatim; engine cross-check mandatory before append.

R55 — SHANKHAPALA (targeting + timing)
Printed: "Round End: move 1 Venom between enemy Units."
Ruling: (a) Resolves in the R54 pre-drain token slot, BEFORE
venomRoundEnd — the moved token therefore drains its new bearer that
same round; if the source unit retains any venom after the move, it
also drains normally. (b) Auto-targeting: source = the enemy unit
carrying the most venom tokens; destination = the highest-effPower
enemy unit other than the source. (c) Degenerate cases (weakest
reading): if no enemy unit carries venom, or no distinct destination
exists, the effect does nothing.

R56 — SILT STRANGLER (loss routing)
Printed: "On Play: enemy loses power = its Venom count (tokens
remain)."
Ruling: the loss routes through damageUnit and inherits that class's
full semantics: Holika sharpens it; realm Patala does NOT amplify it
(Patala deepens astras only — the Patala Throne artifact is the venom
deepener); it registers on lostPowerUids and is therefore Iron
Crucible-regainable (R52/R53); it is not an astra and ignores
astraProtected. Auto-target: the enemy unit with the highest venom
count; if no enemy unit carries venom, the effect does nothing
(weakest reading). Venom tokens remain in place after the loss.

R57 — HYMN OF THE DEPTHS ("once" semantics)
Printed: "All Venom drains trigger immediately, once."
Ruling: resolves as exactly ONE mid-round pass of the venom pipeline
(venomPassive → venomTokens → sweepDeaths) at cast time — the
Karkotaka precedent. Deaths from this pass fire onUnitDeath and count
toward deathsThisRound. Astika's protection is respected. Tokens are
sticky and persist through the pass. The normal round-end drain still
occurs — the Hymn adds a pass, it does not consume or replace the
round-end one.
