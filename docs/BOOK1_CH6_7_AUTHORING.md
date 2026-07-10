# DIVYA YATRA — CHAPTERS 6–7 AUTHORING PACK v1.0 (BOOK 1 FINALE)
# Implements BOOK1_DESIGN §3 (ch6–7). Follows the ch3–5 pack format with every
# correction that build taught us: decks are 12 cards (> handSize, so mulligan
# returns and round 2–3 draws exist), the Indra aura carries player viability,
# and every bonus must be validated EARNABLE AND FAILABLE before shipping.
# Card-fact rule unchanged: roles resolve against engine DECKS; report selections.
# Plates verbatim from BOOK1_CUTSCENE_BIBLE §3 where cited.

## GLOBAL — this slice
- Mode: FREE for both chapters (BOOK1_DESIGN §1 schedule). No guidance mask, no
  suggestion glows. Brihaspati speaks only where specified below and on loss.
- ALL art for these chapters is already in assets/story/ — no 404 fallbacks
  expected; verify none occur.
- THE SHARED DEFEAT PANEL: b1_defeat.jpg is in assets/story/. Wire it as the
  defeat cutscene for ALL SEVEN chapters (replacing the text-only defeat plates),
  motion: PUSH-IN very slow, 1.04→1.10, origin 50% 38% (his face), 9s linear,
  no VFX. Plate verbatim §6: "Defeat is a teacher with poor manners. Sit with
  the lesson; then stand." Then the existing retry flow.
- BOOK COMPLETION: on ch7 victory, chapter-select shows all seven cleared and a
  completion line under the book title: "The Book of Order — complete. The
  churning is over. The war is not." Landing caption flips to its existing
  'complete' state (already data-driven — verify). Reward wiring stays STUBBED
  per LIVE_GAME_DESIGN (M1 economy + wave-1 flagship fill these later); do not
  invent numbers.

─────────────────────────────────────────
## CH.6 — THE NECTAR AND THE NET
─────────────────────────────────────────
realm: RANDOM (first unforced realm in story) · opponent asuras · mode FREE
scenario: { p0Deck: 12 roles — Indra + 8 solid Units + the Amrita-Kalasha-role
Artifact + Gayatri + Pavamana (the ch4/5 chassis plus the Artifact — the deck
is now "near-real Deva"); p1Deck: 12 mixed Asura roles, mid-aggression (the
ch4 de-fanged tier plus ONE heavy unit — tuning knob if headless win rate is
off); handSize:10, mulligan:3 }.
OPPONENT: default AI from turn 1 — no script. This is the first fully honest
match in the book.

BRIHASPATI (two lines only):
- Match start, the Artifact line, verbatim §3: "Some treasures do not strike.
  They simply refuse to stop giving." (the Artifact card gets a one-time
  shimmer highlight in hand — a pointer, not a suggestion beat)
- On realm reveal: point at the realm chip once (reuse the existing chip-glow),
  no dialogue — the ch3 line already taught it; the silence IS the graduation.

CUTSCENES:
intro: [ b1c6_i1 (Kalasha rises — plate verbatim: "Last of all, carried in a
vessel of gold — Amrita. The undying draught."), b1c6_i2 (the truce before it
dies — plate verbatim: "Everything with a claim converged. Truces are mortal
too.") ]
victory: [ b1c6_v1 (the quiet engine — plate verbatim: "Some treasures do not
strike. They simply refuse to stop giving.") ]
MOTION (add to CUT_MOTION):
- b1c6_i1 · RISE · scale 1.12, view travels from the water up with the vessel
  (translateY +5%→−5%), 8s ease-out · none
- b1c6_i2 · PUSH-IN · 1.05→1.14, origin 50% 40% (the vessel between palm and
  claw), 8s ease-out · none
- b1c6_v1 · PULL-OUT gentle · 1.14→1.05, origin 50% 45%, 8s ease-out · none

WIN: matchWin.
BONUS: "Win with your Artifact on the board at match end" — predicate:
player.artifact non-null at match end AND match won. Failable by choice (never
playing it) and possibly by removal — VALIDATION ITEM: report whether ANY
launch Asura card can destroy/remove an enemy Artifact (Vishwakarma is Deva;
Tripura is their own). If nothing can, the bonus is still legitimately failable
(the lesson is "play the engine early"), but the star text must not imply
protection was involved. Star text: "The Kalasha never left the field."

HEADLESS ACCEPTANCE: a competent unguided driver (play-best-legal heuristic,
Artifact early) wins ≥9/12 seeds; bonus earnable and failable both proven.

─────────────────────────────────────────
## CH.7 — THE BETRAYAL  (BOSS)
─────────────────────────────────────────
realm: RANDOM · opponent asuras (BOSS) · mode FREE · boss plate on the VS screen
scenario: { p0Deck: the ch6 12-card list unchanged (the player's graduation
deck — familiarity is the point); p1Deck: FULL-STRENGTH 12-role Asura boss list
— include the heavies excluded since ch4 (Kumbhakarna-tier, Ravana-tier,
Mahabali if viable) + Chandrahas-role Artifact + 2 Astras incl. Pashupatastra;
p1Hand: Chandrahas GUARANTEED in the boss's opening hand; handSize:10,
mulligan:3 }.
OPPONENT SCRIPT: T1 Unit, T2 Unit, T3 = Chandrahas (the LIVE_GAME_DESIGN boss
pattern: amplified Astra threat online by turn 3), then {handoff:'ai'}.
VALIDATION ITEMS (report): (a) Mahabali's pass-passive in a scripted-then-AI
seat — if it misbehaves across the handoff, exclude him and say so; (b) Chaos
Surge frequency in the boss games (an amplified surge is intended spice, but
report if it swings >2 seeds).

BRIHASPATI: silent all chapter except the loss line. The boss speaks instead —
ONE line, plate-style, at the Chandrahas turn (see mid panel). Graduation
means the teacher stands back.

CUTSCENES:
intro: [ b1c7_i1 (the theft — plate verbatim: "The truce died where it
stood."), b1c7_i2 (the sky breaks — plate verbatim: "And the last battle of
the churning began.") ]
mid: [ { afterTurn: boss T3 (Chandrahas resolves), panel b1c7_i2 REUSED,
fast PULL-OUT (1.16→1.08, 4s) + THE LIGHTNING FLASH (the book's single use of
the flash VFX, per bible §2) + screen dim, plate: "The moon-blade is drawn.
Everything he has, at once." } ]
victory: [ b1c7_v1 (reclaimed + the Mohini drift — plate verbatim: "The Amrita
came home. As for how it STAYED home — that is another book.") ]
MOTION (add to CUT_MOTION):
- b1c7_i1 · PUSH-IN hard · 1.06→1.18, origin 45% 30% (his face and the vessel),
  5s ease-out (faster than book norm — theft tempo) · sparse embers
- b1c7_i2 · PULL-OUT · 1.16→1.06, origin 50% 55%, 8s ease-out · none on intro
  (the mid reuse carries the flash)
- b1c7_v1 · THE MOHINI DRIFT (two-phase, the bible's §3 spec): phase 1 RISE to
  the vessel (scale 1.12, translateY +4%→0, 6s ease-out), 1s hold, phase 2 a
  slow lateral DRIFT toward the right-edge silhouette (translateX 0→−4%, 3s
  linear). If the player component only supports single-phase transforms,
  implement as a keyframed animation for this one panel — the drift IS the
  Book 2 hook and must not be simplified away · embers settling
- b1c6_v1/b1_defeat specs are in their sections above.

WIN: matchWin. BONUS: "Win 2–0" — roundWins sweep. Trivially failable.
STAR TEXT: "The betrayal answered without a round lost."

HEADLESS ACCEPTANCE — the boss difficulty band (new criterion): the competent
unguided driver must win ≥6/12 AND ≤10/12 seeds. Below 6 = unfair wall for a
just-graduated player; 12/12 = paper boss. Tune via the boss list's heavy count
and Astra count, report the final band. Losses are a FEATURE here — the defeat
panel and retry loop exist for exactly this chapter.

─────────────────────────────────────────
## SHARED NOTES
─────────────────────────────────────────
- One content dependency to surface loudly: the boss SHOWCASES Chandrahas on
  T3 — a card still carrying stale pre-delta frame text (the re-export list).
  The showcase will put that stale frame center-screen at the book's climax.
  Note it in the report; the fix is Sangbaran's Canva session, not code.
- test_story grows with both chapters' predicates (both-ways tests) + the two
  boss validation items.
- Chapter-select: 6–7 become playable sequentially; "The churning continues
  soon" stubs retire — Book 1 has no more locked chapters.
- The pre-existing drawImage automation race (CLAUDE.md note) may surface
  under headless cutscene-skipping in these long chapters — it is NOT this
  task's bug; work around with paced clicks as before.
