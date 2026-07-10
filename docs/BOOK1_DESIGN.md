# DIVYA YATRA — BOOK OF ORDER (Book 1) — Design Document v1.0
# Story Mode as tutorial: the Samudra Manthan teaches the game.
# Extends LIVE_GAME_DESIGN.md §1. Authority order: GDD_DELTAS → engine → this doc.
# CARD-FACT RULE: no card name/effect in this doc is authoritative. Every deck list
# below is specified by ROLE; final card selection happens against engine DECKS data
# at implementation time. Every win/bonus condition must be validated against the
# actual emitted events before shipping.

═══════════════════════════════════════════════════════════
## 0. DESIGN THESIS
═══════════════════════════════════════════════════════════
Playtest verdict: "too complicated" = too many rules at once, not too many rules.
Book 1 is a curriculum disguised as a myth: SEVEN chapters, ONE new idea each,
taught by guided play inside the Samudra Manthan story. The myth natively supplies
the teaching order: cooperation (basics) → the churning (Mantras) → Halahala poison
(Venom) → Amrita (Artifacts) → the betrayal (real opposition, graduation).
The tutor is BRIHASPATI, guru of the Devas — all guidance is diegetic; the game
never breaks fiction to lecture.

Explicitly NOT taught in Book 1: Leap/Vanaras (Book 3), Asura play-from-the-inside
(Book 2), Naga play-from-the-inside (Book 4). Book 1 = core loop + Devas + Venom
as a THREAT. A tutorial that teaches everything teaches nothing.

Player faction: Devas throughout Book 1.

═══════════════════════════════════════════════════════════
## 1. GUIDANCE SYSTEM (UI layer only)
═══════════════════════════════════════════════════════════
Three modes, per-beat:
- LOCKED   — only the highlighted card/action is playable; all others dimmed &
             inert. Tapping the highlight first shows Brihaspati's line, then plays.
- SUGGESTED— the recommended card glows; ANY legal play allowed. A non-suggested
             play gets one gentle Brihaspati aside (never blocks, never repeats).
- FREE     — no highlights; win condition shown; Brihaspati speaks only in
             cutscenes and on loss.
Mode schedule: Ch1–2 LOCKED · Ch3–5 SUGGESTED · Ch6–7 FREE.
On chapter LOSS: one Brihaspati encouragement line + instant retry (no penalty,
no reward loss). Losses in Ch2 that follow the script are impossible by design.

Implementation: a playable-mask over the existing hand UI + a highlight/glow
treatment + a small dialogue plate (Brihaspati portrait chip + one line, Cinzel).
No engine involvement — legality itself is untouched; the mask only restricts
what the UI will submit.

═══════════════════════════════════════════════════════════
## 2. ENGINE ASK — opts.scenario (the ONLY engine change)
═══════════════════════════════════════════════════════════
Single additive option, read ONLY when present; absent → behavior and g.rng draw
sequence byte-identical to today (opts.realm precedent). Shape:

  opts.scenario = {
    p0Deck?:   [cardName...],   // ordered decklist; routed through mkCard (uid-safe)
    p1Deck?:   [cardName...],
    p0Hand?:   [cardName...],   // opening hand override (drawn from p0Deck entries)
    p1Hand?:   [cardName...],
    winTarget?: 1|2,            // rounds needed; default 2 (best-of-3)
    handSize?:  int,            // default 10
    draws?:     int,            // between-round draw; default 2 (realm bonus still applies)
    mulligan?:  0..3            // 0 disables the phase entirely; default 3
  }

Acceptance: node src/test.js byte-identical to LAUNCH BASELINE; 38-test suite
green; a new scenario smoke test proves each field works AND that an empty/absent
scenario is a no-op. Events stay observational (rule #7).

Opponent scripting needs NOTHING from the engine: the story driver calls
playCard(g,1,...)/pass(g,1) per script, and may hand control to aiTakeTurn(g,1)
mid-match (hybrid: scripted opening → default AI).

═══════════════════════════════════════════════════════════
## 3. THE SEVEN CHAPTERS
═══════════════════════════════════════════════════════════
Format per chapter: STORY · TEACHES · SETUP · SCRIPT/BEATS · WIN · BONUS · notes.
Rewards: XP/coins numbers deferred to the M1 economy session; bonus-condition
card unlocks reference wave-1 Gupta IDs (stubs until wave 1 exists) per
LIVE_GAME_DESIGN §1. Reward fields ship as placeholders resolvable later.

─────────────────────────────────────────
### CH.1 — THE THRONE BESIEGED
─────────────────────────────────────────
STORY: Shukracharya's raiders probe Swarga's gates. Brihaspati wakes Indra's
guard. (Cold open; the churning hasn't begun.)
TEACHES: play a Unit · power totals · rounds are won by total power.
SETUP: scenario { p0Deck: 6 simplest Deva Units by role (vanilla or near-vanilla
text — choose lowest-complexity from engine data), p1Deck: 6 weak Asura Units,
p0Hand: fixed, winTarget:1, handSize:5, mulligan:0 }. Realm: mrityulok (forced —
the no-effect realm IS the tutorial realm). Opponent: fully scripted, plays
mid Units, never passes early, deliberately loses by ~4–6.
BEATS (LOCKED, complete script):
  T1 Brihaspati: "The gate holds only if someone stands at it. Send the guard." → play Unit A
  T2 (enemy plays) B: "See their number rise? Power against power — the greater
     total holds the field." → play Unit B
  T3 B: "Again. The wall is built one warrior at a time." → play Unit C
  T4 (enemy passes) B: "They yield the field. One more — make the count beyond
     dispute — then rest your hand." → play Unit D, then PASS (the pass button
     itself glows; first time the player passes)
WIN: g.winner===0 (single round).
BONUS: win the round by 5+ power (roundHistory[0] margin).
NOTE: the chapter is ~4 player actions long. Short is correct.

─────────────────────────────────────────
### CH.2 — THE ART OF YIELDING
─────────────────────────────────────────
STORY: The raiders return in force. Brihaspati counsels the unthinkable: let them
take the first field.
TEACHES: the round economy — losing a round on purpose; card advantage; passing.
SETUP: scenario { p0Deck: 10 Deva Units (roles: mixed weights), p1Deck: 10 Asura
Units, winTarget:2 (default), handSize:8, mulligan:0 }. Realm: mrityulok forced.
Opponent script: overcommits R1 (5 cards), then plays honestly (hand to default
AI for R2–3 — hybrid handoff).
BEATS (LOCKED): R1 = play ONE cheap unit, then Brihaspati orders the pass:
  "Let them spend their fury on an empty field. Every card they burn here is a
  card they will not have when it matters." R1 is lost BY DESIGN.
  R2–3: guided plays from superior hand count; B narrates the arithmetic once:
  "Six against three. Now the mathematics of patience."
WIN: match win after losing round 1 (roundHistory[0].winner===1 && g.winner===0).
BONUS: win round 3 with 2+ cards still in hand.
NOTE: this is the game's deepest lesson (the How-to-Win tab's U1 diagram),
taught by experience. It is the most important chapter in the book.

─────────────────────────────────────────
### CH.3 — THE WEAPONS OF HEAVEN
─────────────────────────────────────────
STORY: The Asuras unveil a true Astra. Brihaspati answers with the Dharma Shield.
Realm LOCKED: swarga (home realm per LIVE_GAME_DESIGN — and its Hero +1 lets
Brihaspati introduce the realm chip in one line).
TEACHES: Astras (yours and theirs) · Dharma Shield · the realm chip.
SETUP: scenario { p0Deck: Units + 1 Deva Hero + 2 Deva Astras + shield access
per engine's shield mechanic, p1Deck: Asura Units + 2 telegraphed Astras,
handSize:9, mulligan:0 }. Opponent: scripted opening — plays Units T1–T2, VISIBLY
telegraphs the Astra turn (cutscene panel mid-match: "Shukracharya raises the
blade"), fires Astra at the player's strongest Unit on T4.
BEATS (SUGGESTED from here): shield the threatened Unit BEFORE T4 ("The blade
seeks your champion. Shield first; strike after."); after surviving, answer with
the player's own Astra on the enemy's largest Unit.
WIN: match win.
BONUS: win with your Hero never destroyed (no destroy event targeting your hero uid).
NOTE: realm-chip introduction line, once, on match start: "The realm itself
takes sides evenly — read the sky before you read your hand." (tap-the-chip hint)

─────────────────────────────────────────
### CH.4 — THE CHURNING BEGINS
─────────────────────────────────────────
STORY: The truce. Devas and Asuras bind Vasuki to Mandara and churn the ocean.
The first treasures rise; so does loss.
TEACHES: Mantras (revival) · the mulligan (enabled for the first time).
SETUP: scenario { p0Deck: Units + Gayatri-role Mantra + Pavamana-role Mantra,
p1Deck: neutral-aggression Asura list, handSize:10, mulligan:3 (FIRST TIME) }.
Realm: gandharva forced (the Mantra plane — realm and lesson rhyme; its extra
draw also softens the first unguided hand).
BEATS (SUGGESTED): pre-match, Brihaspati teaches the mulligan: "Three of your
ten may return to the deck. A wise hand is chosen twice." Mid-match, a scripted
enemy Astra kills a player Unit → suggest the revival Mantra: "What the churning
takes, the sacred word returns."
WIN: match win.
BONUS: revive at least one Unit (revive event, source = the revival Mantra).

─────────────────────────────────────────
### CH.5 — THE POISON RISES
─────────────────────────────────────────
STORY: Halahala surfaces — the world-poison. The serpents drink deep and turn.
First fight against Nagas; the player SUFFERS Venom before ever wielding anything
like it.
TEACHES: Venom (from the receiving end) · cleansing (Pavamana-role) · reading
enemy tokens.
SETUP: scenario { p0Deck: ch.4 list + emphasis on the cleanse Mantra, p1Deck:
Naga list with Venom appliers foregrounded, handSize:10, mulligan:3 }.
Realm: patala forced (the serpent halls — atmosphere; note the realm boosts
Astra damage, NOT venom — Brihaspati can even say so: "Their kingdom sharpens
blades, not fangs. Small mercies.").
Opponent: scripted opening stacks 2 Venom tokens by T3, then default AI.
BEATS (SUGGESTED): first venom tick gets a one-liner ("Poison does not duel.
It waits."); suggest the cleanse at maximum token count; suggest racing the
round short ("A short battle starves a slow poison — end rounds quickly.").
WIN: match win.
BONUS: no friendly Unit destroyed by Venom (no destroy event with venom cause
on side 0 — validate exact cause labeling at implementation).

─────────────────────────────────────────
### CH.6 — THE NECTAR AND THE NET
─────────────────────────────────────────
STORY: The Amrita rises at last, carried in the Kalasha. Everything with a claim
converges.
TEACHES: Artifacts (via Amrita Kalasha — the artifact the story is ABOUT) ·
random realms (first unforced realm) · full round economy without training wheels.
SETUP: scenario { p0Deck: near-real Deva list incl. Amrita-Kalasha-role Artifact,
p1Deck: mixed Asura list, defaults otherwise }. Realm: RANDOM (first time).
Opponent: default AI, no script.
MODE: FREE (win condition only; Brihaspati opens the match with one line on
Artifacts: "Some treasures do not strike. They simply refuse to stop giving."
and one line on the realm draw: whatever realm rises, point at the chip.)
WIN: match win.
BONUS: win with your Artifact on the board at match end (player.artifact non-null).

─────────────────────────────────────────
### CH.7 — THE BETRAYAL  (BOSS)
─────────────────────────────────────────
STORY: Shukracharya seizes the Amrita. The truce dies where it stood. Mohini's
shadow passes over the field (one panel; Book 2 hook).
TEACHES: nothing new — graduation. Full rules, real opponent, no guidance.
SETUP: scenario { p1Deck: boss Asura list (full 22-role list, Astra-heavy),
scripted opening per LIVE_GAME_DESIGN boss pattern: Chandrahas-role Artifact
guaranteed by turn 3 (hand injection), then default AI }. Realm: RANDOM.
MODE: FREE. Boss plate on the VS screen.
WIN: match win.
BONUS: win 2–0 (roundWins).
REWARD: Book completion per LIVE_GAME_DESIGN — faction Gupta flagship (wave-1
stub) + a cosmetic board skin (candidate already in hand: the rejected fire
arena as a Patala alt-skin, or a Book-of-Order Swarga variant).

═══════════════════════════════════════════════════════════
## 4. chapters.json SCHEMA
═══════════════════════════════════════════════════════════
{
  "id": "b1c1",
  "book": 1,
  "title": "The Throne Besieged",
  "cutscenes": { "intro": [panelId...], "mid": [{afterEvent|afterTurn, panels}], "victory": [...], "defeat": [...] },
  "realm": "mrityulok" | null,            // null = random
  "playerFaction": "devas",
  "opponentFaction": "asuras",
  "scenario": { ...opts.scenario fields... },
  "opponentScript": [ {turn, action: play|pass, cardRole|cardName, target?} , ..., {handoff:"ai"} ],
  "guidance": [ {beat, mode, highlight: cardRole|action, line: brihaspatiLineId} ],
  "win":   { "type": "matchWin" | "roundWin", "extra": predicateId },
  "bonus": { "predicateId": "...", "rewardId": "wave1-stub-..." },
  "rewards": { "xp": null, "coins": null },   // M1 session fills these
  "unlocks": "b1c2"
}
Predicates are named functions in the story driver evaluated against g.events +
authoritative state (g.roundHistory, roundWins, player.artifact, destroy causes).
Every predicate gets a unit test against a synthetic event stream before shipping.

═══════════════════════════════════════════════════════════
## 5. CUTSCENES — "MOVING PANELS" v1 SPEC
═══════════════════════════════════════════════════════════
v1 = single MJ stills + slow Ken Burns (CSS transform pan/zoom, 6–9s per panel)
+ crossfade + text plate (Cinzel, bottom third, tap to advance) + EXISTING VFX
module overlaid where the shot earns it (embers on battle panels, smoke on the
Halahala panel, the lightning flash on the betrayal panel) + existing SFX/ambience
hooks. Skippable always (top-right "skip ›"). Portrait 2:3. Target 3–4 panels per
chapter intro, 1 mid-match panel where scripted (ch3, ch5, ch7), 1 victory panel.
Total Book 1 panel budget: ~30 images.

CHARACTER SHEETS FIRST (blocking requirement): before ANY panel generation,
lock reference sheets via --cref for: BRIHASPATI (aged guru, white beard, saffron,
mala beads, gentle severity), INDRA (regal, storm-crowned, golden), SHUKRACHARYA
(silver-haired, one-eyed, white robes, cold), VASUKI (the great serpent — reuse
the card art's design language), plus MANDARA/ocean environment plates.
Style anchor: --sref the existing card art family so cutscenes and cards are
one world. Panel prompts follow the realm-board discipline: no text in image,
consistent palette per scene, portrait 2:3.

Shot lists (intro sequences, one line per panel):
CH1: gates of Swarga at dusk → raiders' silhouettes on the ridge → Brihaspati's
hand on Indra's shoulder.
CH2: the horde at full strength → Brihaspati alone, unafraid → an empty field,
banners planted.
CH3: Shukracharya raising the blade (also the mid-match telegraph panel) →
the Dharma Shield igniting → Swarga's lotus arena from above (the actual board!).
CH4: Vasuki coiled around Mandara → gods and demons pulling as one → the ocean
beginning to glow.
CH5: the water blackening → Halahala rising as smoke (VFX smoke overlay) →
serpent eyes opening in the dark.
CH6: the Kalasha breaking the surface, radiant → every hand reaching.
CH7: Shukracharya's theft mid-stride → the truce shattering (lightning VFX) →
armies wheeling to face each other. Victory panel: the Amrita reclaimed;
Mohini's silhouette watermark (Book 2 hook).

═══════════════════════════════════════════════════════════
## 6. BRIHASPATI — VOICE GUIDE + CORE LINES
═══════════════════════════════════════════════════════════
Voice: a guru, not a tooltip. Short. Aphoristic. Never says "click" or "card" when
"send", "shield", "the word" will do. Never exceeds two sentences. All mechanical
truth, mythic diction.
Core lines are in §3 beats. Additional stock lines:
- LOSS (any chapter): "Defeat is a teacher with poor manners. Sit with the lesson;
  then stand."
- Non-suggested play (SUGGESTED mode, once per chapter): "Your hand, your war.
  But hear an old man's thought before the next."
- Pass hint (whenever pass is the suggestion): "Strength held in reserve is
  still strength."
- Venom tick: "Poison does not duel. It waits."
- Realm chip: "Read the sky before you read your hand."

═══════════════════════════════════════════════════════════
## 7. BUILD ORDER (M2 slice 1)
═══════════════════════════════════════════════════════════
1. ENGINE: opts.scenario (additive, byte-identical proof) — the only engine task.
2. STORY DRIVER (UI): chapter loader (chapters.json), opponent scripting via
   playCard/pass + AI handoff, guidance mask + Brihaspati plate, predicate
   evaluator + tests, chapter-select screen (Story button on landing goes live,
   Book 1 only, chapters gate sequentially).
3. CUTSCENE PLAYER (UI): panel component (Ken Burns, crossfade, text plate,
   VFX overlay hooks, skip), fed by a panels manifest.
4. CONTENT: character sheets → ~30 panels (MJ sessions) → Claude compresses/
   names them; chapter deck lists finalized against engine DECKS; all Brihaspati
   lines written into chapters.json; predicates validated against real event
   streams.
5. TUNE: each chapter played on-device; guidance beats adjusted to what the
   scripted opponent actually does.
Slices 1–3 are parallelizable with 4. Rewards wiring waits on the M1 economy
session (fields ship as stubs).
