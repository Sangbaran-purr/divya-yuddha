# RULING R84 — ASURA WAVE CANON PACKAGE
# Date: 2026-07-16 · Authority: this document supersedes conflicting
# lines in ASURA_WAVE_ART_DIRECTION_v2.md; GDD_DELTAS.md gains the
# summary row. Engine is authority for rules text throughout.

## R84.1 — RENAMES (both ruled by export; frames already exist)
(a) ashlegionnaire · "Ash Legionnaire" → **BHASMA SAINIKA**
    Rationale: "Legionnaire" is Roman — the set's sole register
    violation. Bhasma (ash) + Sainika deliberately mirrors the
    shipped DEVA SAINIKA: the two hosts' rank-and-file rhyme.
(b) bloodoath · "Blood Oath" → **RUDHIRA BALI**
    Rationale: the mechanic IS a blood-offering. Rudhira chosen
    over Rakta to avoid crossing wires with the Rakta tokens of
    Raktabija's Curse. Known echoes, accepted: "Bali"/Mahabali
    (two-word form separates); retired echo: "Oath"/Kishkindha Oath.
Frames on record: Asuras_Unit_BhasmaSainika_P3_rCommon.png and
Asuras_Mantra_RudhiraBali_rUncommon.png (exported, audited,
accepted). The engine must move to the frames' names — the frames
are already canon by acceptance.

## R84.2 — TWO FIRES, FINAL FORM (as practiced by the accepted wave)
(a) VIOLET = MAYA, ABSOLUTE. Illusion, copies, veils, delusion,
    borrowed shapes render violet, and violet renders nothing real.
    Gameplay-legibility law, peer of venom-green. (Enforced: Maya
    Veil, Maya Shade v2, Mohanastra v2, Mayasura's Blueprint,
    Mahishi's shadow.)
(b) EMBER-RED = THE PRICE, preferred. Real payment renders as
    ember light leaving a body — never liquid blood (gore law).
    (Enforced: Rudhira Bali, Raktabija's Curse, Rakta token,
    Dhumraksha's toll.)
(c) ASH-IRON WORLD: demoted from law to preference. The accepted
    wave rolled warm-ruin (Surpanakha, Atikaya, Brahmadanda) and it
    works; world palette is taste, the two fire colors are law.
(d) GARMENT EXEMPTION: the law governs LIGHT, not cloth. Red
    garments are register; red glow is meaning.

## R84.3 — ART-LAW ANNOTATIONS (per-card canon, accepted frames)
(a) SURPANAKHA: one healed scar permitted — deliberate; blood
    never. (Overrides the direction's "no disfigurement visible".)
(b) VRITRA: the hoarded water is canon — the last lake in a dead
    world reads drought-hoarder, not aquatic. The bound-light-
    inside-silhouette concept moves to the play animation.
(c) SIMHIKA: sea-canon correction — she is a sea rakshasi
    (Hanuman's shadow, the ocean crossing); the shoreline/sea is
    her home register, not Naga drift. Doc's "warm-dark shoreline"
    note retired.
(d) SHUMBHA/NISHUMBHA: diptych met BY POSE (enthroned mirror
    pair), not by split backdrop. Accepted as shipped; a Shumbha
    warm-palette re-roll remains an optional one-card fix if the
    adjacency bothers at grid scale.
(e) BRAHMADANDA: the relic reading is canonical — the consecrated
    rod in a serene valley; the negation lives in the play
    animation. (Inversion of the direction's plain-rod thesis,
    accepted on taste.)
(f) MAHISHASURA: magnificent-hunger reading accepted (bulk over
    gauntness; the emptied field carries the demand).

## R84.4 — RAKTA TOKEN, PRESENTATION CANON
Engine def: id 'rakta', n 'Rakta', sub 'Blood-born', p2, r:'C',
txt "A blood-born token.", token:true, ghost:false.
Frame: Asuras_Token_Rakta_P2_rToken.png — RARITY field reads
TOKEN, label iron-grey #6E6E73, no gem (or gem #5A5A5F/#8A8A90).
DELIBERATE frame-vs-engine difference: the frame says TOKEN where
the engine files r:'C'. Recorded here so no future audit flags it
as a mismatch. Tokens are board-only objects: never in the 176,
never in schema v6, never sealed/revealed, invisible to Collection.

## R84.5 — IMPLEMENTATION (one CC task; engine change, full ceremony)
Scope of the rename task:
1. src/engine.js: both defs' n fields (ids unchanged:
   'ashlegionnaire', 'bloodoath' — ids are save-data and stay).
2. Every log/emit string carrying either old name.
3. sim_campaign FIRE_KEYS sweep (the Bridge-scanner lesson): any
   name-keyed matcher moves to the new names.
4. Test suites: STEP 0 greps scenario/venom/story expectations for
   the old names; expectation-string updates are permitted for the
   rename ONLY, each one listed in the report.
5. index.html: any name-derived art-stem mapping must resolve the
   NEW names to the existing frame files; grep for hardcoded old
   names in UI copy.
6. Assertions (report, not code): the board renderer resolves art
   for id 'rakta' (state the mechanism or the one-line mapping it
   needs); token spawn path writes nothing into the schema-v6
   collection map (grep-proof).
7. Docs: GDD_DELTAS.md appends R84; roster annotations updated.
Ceremony: flag-off byte-identical (both cards are wave:1 — launch
baseline untouched by construction, prove it anyway) · 40.9/59.1 ·
ASTRA_DMG set · scenario 50 / venom 38 / story 48 · zero
console.log · do not commit — report for audit.
Sequencing: runs AFTER T35's audit+commit if T35 is in flight;
otherwise before. Never interleaved — both touch index.html.
Asset note (Sangbaran's pipeline, not CC's): the two frames plus
the Rakta token frame ride the normal Downloads → ls -lt →
assets/cards → make_thumbs.sh pass alongside the scrim batch.

## R84.6 — CANDIDATE NOTED, NOT RULED
Vayu (Deva launch): engine txt ends with the dev annotation
"(v0.1: swap omitted)" — player-facing text carrying a dev note,
likely printed on the shipped frame. Candidate R85: engine text
cleanup + frame re-export. Not executed here.
