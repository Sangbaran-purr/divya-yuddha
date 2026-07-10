# DIVYA YATRA — CHAPTERS 3–5 AUTHORING PACK v1.0
# Implements BOOK1_DESIGN §3 (ch3–5) at build detail, following the ch1–2 pattern.
# Card-fact rule unchanged: deck lists below are ROLES — resolve against engine
# DECKS and report selections for design review (the ch1 Chaos-Surge precedent).
# All plates verbatim from BOOK1_CUTSCENE_BIBLE §3/§6 where cited.

## GLOBAL — this slice
- Guidance mode: SUGGESTED debuts here (ch1–2 were LOCKED). Mechanics per
  BOOK1_DESIGN §1: recommended card glows; ANY legal play allowed; the FIRST
  non-suggested play in a chapter gets one Brihaspati aside — verbatim §6:
  "Your hand, your war. But hear an old man's thought before the next." —
  shown once, never blocks, never repeats. Targeting is now allowed (ch3's
  Astra/shield need it): when a suggested card needs a target, the suggested
  TARGET also glows; the player may pick another legal target freely.
- PANEL 404 FALLBACK (the parallel-tracks glue): the cutscene player must fall
  back to a text-only plate when a panel image 404s — art ships later with zero
  code change. Wire ALL manifest entries below now, whether or not the image
  exists yet in assets/story/.
- Victory cutscenes for ch3–5: text plates only for now (bible's cut-list rule);
  wire victory panel ids anyway (v1 slots) so images drop in later.
- Doc correction to fold in: BOOK1_CUTSCENE_BIBLE ch2 intro is now TWO panels
  (i3 moved to mid-round) — one-line edit in the bible.

─────────────────────────────────────────
## CH.3 — THE WEAPONS OF HEAVEN
─────────────────────────────────────────
realm: swarga (forced) · playerFaction devas · opponent asuras · mode SUGGESTED
scenario: { p0Deck: 9 roles — 6 solid Units + 1 Deva Hero + 2 targeted Deva
Astras (choose the two whose engine texts are simplest to read); p1Deck: 8 Asura
Units + 2 Astras (one is the telegraphed strike); handSize:9, mulligan:0 }.
Dharma Shield uses the faction's normal player-controlled mechanic — no scenario
field needed; the guidance beat teaches its UI.

OPPONENT SCRIPT: T1 Unit, T2 Unit, T3 Unit, [MID PANEL fires before T4], T4 =
Astra at the player's strongest Unit (explicit target), then {handoff:'ai'}.

CUTSCENES:
intro: [ b1c3_i1 (blade raised — plate verbatim bible: "Shukracharya no longer
asks questions."), b1c3_i3 = REUSE assets/img/board_swarga.jpg re-motioned
(PULL-OUT 1.18→1.06 from the lotus center, 8s; plate verbatim: "Swarga itself
takes the field. Read the sky before you read your hand.") ]
mid: [ { afterTurn: opponent T3 resolved, panel b1c3_i1 REUSED with the fast
push (1.05→1.12 in 4s) + screen dim, plate verbatim: "The blade seeks your
champion." } ]
victory: text plate — "Heaven's weapons answer only when heaven is ready."

GUIDANCE BEATS (SUGGESTED):
- Match start, one line (realm chip intro), Brihaspati: "The realm itself takes
  sides evenly — read the sky before you read your hand." (chip glows once)
- Before opponent T4 (right after the mid panel): suggest SHIELDING the
  threatened Unit — Brihaspati verbatim §3: "Shield first. Strike after."
- After the Astra is survived: suggest the player's own Astra targeting the
  enemy's largest Unit — line: "Now answer. Heaven's weapons answer only when
  heaven is ready."
WIN: matchWin. BONUS: hero-never-destroyed — predicate: no `destroy` event whose
targetUids include the player's hero uid, any round. (Validate: shields cause
`block`/`shield` events, not destroys — confirm the hero-destroy path emits
`destroy` with the hero uid before shipping the predicate.)

─────────────────────────────────────────
## CH.4 — THE CHURNING BEGINS
─────────────────────────────────────────
realm: gandharva (forced — Mantra plane, extra draw softens the first mulligan)
mode SUGGESTED · scenario: { p0Deck: 10 roles — 8 Units + the Deva revival
Mantra + the Deva cleanse Mantra; p1Deck: 10 neutral-aggression Asura roles with
ONE Astra hand-injected so the scripted kill is guaranteed; handSize:10,
mulligan:3 — FIRST TIME the mulligan phase runs in story }.

PRE-MATCH BEAT (before mulligan UI): Brihaspati verbatim §3: "Three of your ten
may return to the deck. A wise hand is chosen twice." (mulligan proceeds
normally; no forced choices)

OPPONENT SCRIPT: T1 Unit, T2 Unit, T3 Unit, T4 = the injected Astra at the
player's strongest Unit (the scripted casualty), then {handoff:'ai'}.

GUIDANCE BEATS:
- After the casualty resolves: suggest the revival Mantra on the fallen Unit —
  Brihaspati verbatim §3: "What the churning takes, the sacred word returns."
- No other beats — the chapter breathes; the AI plays honestly from T5.
CUTSCENES:
intro: [ b1c4_i1 (serpent & mountain — plate verbatim: "A truce, of a kind. The
ocean of milk holds treasures neither side can raise alone."), b1c4_i2 (pulling
as one — plate verbatim: "Deva and Asura, hand over hand. The world holds its
breath."), b1c4_i3 (ocean wakes — plate verbatim: "And the deep began to give.") ]
victory: text plate verbatim: "What the churning takes, the sacred word returns."
WIN: matchWin. BONUS: revive at least one Unit — predicate: any `revive` event
on side 0 sourced by the revival Mantra (match abilityName; validate the actual
label in the stream before shipping).

─────────────────────────────────────────
## CH.5 — THE POISON RISES
─────────────────────────────────────────
realm: patala (forced) · opponent NAGAS (first non-Asura enemy) · mode SUGGESTED
scenario: { p0Deck: ch4's 10 roles with the cleanse Mantra guaranteed in the
opening hand (p0Hand includes it); p1Deck: 10 Naga roles with Venom-appliers
foregrounded; handSize:10, mulligan:3 }.

OPPONENT SCRIPT: T1 Venom-applier Unit, T2 Venom-applier Unit (2 player Units
carry Venom by T3 — pick appliers whose engine text applies on entry), T3 Unit,
then {handoff:'ai'}.

GUIDANCE BEATS:
- Realm chip line at start (Patala irony, from the realm content voice):
  "Their kingdom sharpens blades, not fangs. Small mercies."
- On the FIRST Venom tick against the player: Brihaspati verbatim §6: "Poison
  does not duel. It waits." — AND the mid panel fires here (below).
- When player-side Venom tokens reach their max count so far: suggest the
  cleanse Mantra — line: "What fire cannot purify, the sacred word can."
- Round 2 start: one pacing line — verbatim §3: "A short battle starves a slow
  poison — end rounds quickly." (suggest nothing; it's advice, not a beat)
CUTSCENES:
intro: [ b1c5_i1 (water blackens — plate verbatim: "Before the nectar — the
price. The ocean's first gift was Halahala."), b1c5_i2 (Halahala column — plate
verbatim: "It did not attack. It simply was — and everything near it lessened."),
b1c5_i3 (serpent eyes — plate verbatim: "The Nagas drank what spilled. And
remembered whose churning spilled it.") ]
mid: [ { afterEvent: first venom tick on side 0, panel b1c5_i2 REUSED (RISE,
faster: 5s), plate verbatim §6: "Poison does not duel. It waits." — the
Brihaspati line becomes the plate; suppress the duplicate dialogue bubble } ]
victory: text plate verbatim: "Poison does not duel. But it can be answered."
WIN: matchWin. BONUS: no friendly Unit destroyed by Venom — predicate: no
`destroy` event on side-0 units whose cause/abilityName is the venom-death path
(VALIDATE the exact cause label in the event stream first — flagged in
BOOK1_DESIGN as needing implementation-time confirmation).

─────────────────────────────────────────
## SHARED IMPLEMENTATION NOTES
─────────────────────────────────────────
- chapters.js gains b1c3/b1c4/b1c5 per the §4 schema; ch3–5 unlock sequentially
  (existing gating); chapter-select stubs 6–7 remain "The churning continues soon."
- Headless drivers first (the ch1–2 discipline): each chapter must win headless
  across 12 seeds following its suggested beats BEFORE browser wiring; report
  resolved deck lists + any faction-passive surprises (the Chaos-Surge precedent).
- SUGGESTED-mode mask: nothing disabled; glow on suggestion + suggested-target
  glow; the once-per-chapter aside on first deviation.
- Predicate tests: synthetic-stream unit tests for all three bonuses + the two
  validation items (hero-destroy emission shape; venom-death cause label) checked
  against REAL streams and reported.
- Smart caption: landing "Continue — Chapter N" must now advance to 3–5 (already
  data-driven; verify).
- Panel images may not exist yet (art in flight): 404 → text-plate fallback,
  zero rework on drop-in.
