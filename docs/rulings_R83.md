# RULING R83 — NAGA WAVE RENAME BATCH (8 cards)
# Ruled by Sangbaran 2026-07-14. Names only — no mechanic, power,
# rarity, or id changes. Rationale on record: the wave's working
# names split into two registers; the generic-English half is
# lifted into the game's Sanskrit register. Three of the eight are
# Sangbaran's own names from the MJ sessions, formalized.

R83 — THE RENAMES (old → new; ids unchanged):
1. Silt Strangler        → AJAGARA
2. The Long Patience     → VISHA VAYU
3. World-Coil Constrictor→ VISHWAPASHA
4. Grave-Tide Naga       → VAITARANI NAGA
5. Venom Harvester       → VISHADHARA
6. Molting Naga          → NIRMOKA
7. Depth Caller          → AVAHANI
8. Coil Sentry           → NAGA DWARAPALA

NAMING NOTES ON RECORD: "Ananta Pasha" was considered for #3 and
set aside for double collision (launch Ananta Coil + launch
Nagapasha). Vaitarani is the corpse-river of the Garuda Purana —
chosen because the card profits from both graveyards. Naga
Dwarapala joins the launch "Naga <role>" common pattern.

SCOPE OF THE CHANGE (binding on the implementing task):
(a) Card display names (def n:) — the eight above, verbatim.
(b) Every engine string that carries an old name: log templates,
    damage/effect CAUSE strings, and any name-keyed lookup. CAUSE
    strings are semantic (ASTRA_DMG membership checks key on
    cause; the R46 CARD_BY_NAME lesson proved name-keyed lookups
    exist) — the task's STEP 0 must map every occurrence and
    classify display vs logic before any edit.
(c) tools/sim_campaign.js FIRE_KEYS carrying old-name substrings —
    updated in the same task (the Bridge-scanner lesson).
(d) Roster annotations appended-not-rewritten; GDD historical
    entries are append-only history and KEEP old names, with this
    ruling as the bridge.
(e) Art/file side (Sangbaran's, not CC's): among exported frames
    only Ajagara is affected — retitle + rename file, art
    unchanged. Unexported cards proceed on new names per
    NAGA_WAVE_ART_DIRECTION_v2.

INVARIANTS: ids unchanged · flag-off launch baseline byte-identical
(wave names are flag-gated and must not appear in any flag-off
path) · the adopted R82 wave baseline is display-name-independent
and stands.
