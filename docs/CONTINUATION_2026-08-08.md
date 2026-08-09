# CONTINUATION — 2026-08-08 ("the row closes": swaps, triage, four
# mantras, and the three-repo R93 propagation)

## SESSION SHAPE
Single day, three repos, nineteen commits. Game lane throughout;
LANE-W untouched except the web3 how-to-play propagation. CC ran
under STEP-0 discipline; every stop was legitimate (sync guard,
Mrityunjaya emit, Surface B premise correction). The Mantra row
went 4/8 to 8/8 in one day.

## SHIPPED CHAIN — divya-yuddha (15)
- 9d0d8f6  board tiles: canonicalize Deva/Asura stems (strip
           -board suffix). NOTE: message overclaims "intake Naga
           x15" — contains only the 30 renames; corrected on
           record by fe6b0b1.
- fe6b0b1  intake Naga board tiles x15 — purpose-made set 60/60
           complete (Devas/Asuras/Vanaras/Nagas, plain stems)
- 5d0de7c  BOARD ART ACTIVATION: attachArt 4th arg re-added,
           BOARD_ART_V t93 to b60. Board art program CLOSED
           (T93 arc complete).
- 998d259  HERO ROLLBACK: DEVA_HERO_ENTRY_ON=false gates the whole
           entry branch (24 sheets, 4 recipes, 4 briefs preserved
           dormant — flag flip restores). Aura tints extended to
           all 12 launch heroes (9 new: Mahabali crimson-gold,
           Rahu eclipse violet-black, Shukracharya Venus
           silver-white, Hanuman/Bali vermilion-saffron, Sugriva
           emerald-green, Angad bronze-amber, Vasuki teal-emerald,
           Shesha cosmic indigo, Takshaka acid-chartreuse). Wave
           heroes stay warm-gold. Hero program CLOSED; the "9
           remaining overrides" line from 07-31 is VOID.
- a76e995  PASS BANNERS: "YOU PASSED"/"OPPONENT PASSED" center
           banners on the shared #banner element; banner queue
           serializes pass + round banners. Pass emits no engine
           event — driven off players[pi].passed false-to-true in
           runAction completion (deliberate; Nakama will need a
           real emit later).
- fddf73e  intake: Bali + Narada + ChandraDev masters and board
           tiles at canonical stems
- 37d6963  R93 SWAPS: Hanuman to Bali (The Unrivalled King),
           Saraswati to Narada (The Celestial Messenger), Surya
           Dev to Chandra Dev (Sovereign of Moonlight).
           Rename/reskin, zero mechanical diff. IDs KEPT as logic
           keys (bali id=hanuman, narada id=saraswati, chandradev
           id=surya — canonical, do not "fix"). Identity subs
           KEPT: Kesari "Father of Hanuman", Lanka Dahan "Fire of
           Hanuman", Makardhwaja "Son of Hanuman". Story exception
           (tight): literal Surya Dev strings in chapters.js
           decks/guidance + test_story:108. Old stems deleted.
           CARD_ART_V t64 to t65, BOARD_ART_V b60 to b61. R93 in
           GDD_DELTAS with lore lines + id quirk + sub exemptions.
- cffd29f  PLAYER FEEDBACK TRIAGE x3 (UI only): (1) seesOppHand
           had NO consumer — built the peek panel (chip in opp
           zone header, tap opens face-up hand, Narada overlay
           language) covering Vibhishana AND Vanara Scout. (2+3)
           one root cause — endRound computes winner post-venom
           but the totals strip never showed the final scores and
           the banner double-fired at choreo start; fix:
           animateTotals targets roundHistory[last].{t0,t1}, 800ms
           hold, banner after settle (!choreoActive suppression).
- 2a7a01a  intake: Rama Naam layer set x5
- b30d8da  RAMA NAAM shipped — RADIANT BUFF register, Vanara
           row-plate, floaters UI-computed (no per-unit emit, the
           Pavamana idiom), Vanara lazy-load branch ADDED to
           loadMatchSheets. Seed 0xAA4A11.
- a1c5af2  intake: Kishkindha Oath layer set x5
- 8b6d8c7  KISHKINDHA OATH shipped — WARD register, two moments:
           cast (ring/veil, square Vajra class) + fire (flash/
           threads/motes + witness floaters) off the EXISTING ward
           emit (no engine touch). Jade ward marker: .wardbadge +
           .bc.warded border-glow, state-driven like shield/venom
           badges, clears on fire AND silent round-end expiry.
           Seed 0x0A7A0A.
- 3105a0b  intake: Mrityunjaya + Sarpa Satra layer sets x5 each
- 33f09fe  MRITYUNJAYA shipped — DEATHLESS register, square
           arrival on the revived cell (Sanjivani structural
           class). THE SESSION'S ONLY ENGINE TOUCH: one
           observational emit at engine.js:877 (passive,
           targetUids=[t.uid], abilityName Mrityunjaya, "reborn")
           — SIXTH sibling-emit member. Consumer-neutrality
           grep-proven, rng-trace intact, launch baseline
           byte-identical. Venombadge renders on arrival for free.
           No double-fire with the mantra play event. Seed
           0xD3AD1A.
- 7540db5  SARPA SATRA shipped — SACRIFICE DRAIN register,
           TWO-ZONE: square fire/serpent/ash on the sacrificed
           cell (destroy event) + wide venom veil/surge on the
           enemy row (first damage event, once-guard). Both
           moments ride EXISTING emits — engine zero-diff. Global
           stagger worst=1. Red damage tick suppressed for the
           unified green drain. Drift-down = negative drift_up
           (existing primitive). sarpaDouble cue PARKED (device
           evidence only). Seed 0x5A4A5A. MANTRA ROW CLOSES 8/8.

## SHIPPED — divya-yuddha-web (3)
- a7a0bb7  Surface A: collection/treasury to Bali/Narada/
           ChandraDev — 3 thumbnail pairs generated (213x320 +
           480x720 from game PNGs), manifest stems renamed,
           cards.js entry, old thumbs dropped.
- 01af4bc  Surface B: embedded game re-synced to 7540db5 (the
           REAL live-404 source — the stale snapshot cross-linked
           deleted stems) + sync_game.sh VFX guard recalibrated
           3 to 5 (two reduced-motion layer loads from ramanaam +
           kishkindhaoath joined the three sheet builders; both
           verified 200 pre-recalibration; assert stays EXACT).
- a1cd435  explore.html manifest stamp v2 to v3 (stamp-binds-to-
           bytes; the manifest changed in a7a0bb7 without a bump —
           corrected next commit).

## SHIPPED — divya-yuddha-web3 (1)
- 1d8652a  Surface C: how-to-play source to Bali (3 html img srcs,
           Bali jpg added, Hanuman jpg removed, content-MD card
           refs at :146/:259). Identity line "named legends —
           Hanuman, Ravana, Takshaka" KEPT verbatim. web3 has no
           live Pages (document-family, PDF-distributed).

## RULINGS ON RECORD TODAY
- R93 (GDD_DELTAS): the three swaps + four sub-rulings — (a) story
  exception tight scope; (b) lore lives in the R-entry (no engine
  lore field); (c) ids kept; (d) mechanical/identity cross-ref
  split (blind rename produces false mythology — Angad is Bali's
  son, Makardhwaja is Hanuman's).
- Triage rulings: peek panel (not inline face-up); option-1
  UI-only round-end beat, 800ms hold; option-2 deferReset engine
  hook PARKED as polish.
- Mrityunjaya emit APPROVED (the one engine line).
- sarpaDouble cue PARKED. Ward marker APPROVED (badge + glow).
- Sync-guard law candidate RATIFIED BY PRACTICE: snapshot-sync
  guards recalibrate only on owner word with proof-of-200 for
  every new ref; the assert stays exact.
- Intake law grew three clauses today: (1) mv targets come from
  the pasted ls -lt output, never upload-interface filenames;
  (2) upload-to-Claude is not file-on-disk — a wall of "No such
  file" means stop, not scroll; (3) a failed glob aborts an entire
  pasted zsh block — intake blocks carry no glob lines (the
  dual-spelling mv pattern is the standing template).

## VFX CATALOG STATE
MANTRA ROW COMPLETE 8/8: Gayatri (revival) · Pavamana (cleanse) ·
Ahamkara (dark buff) · Sanjivani Corruption (dark revival) · Rama
Naam (radiant buff) · Kishkindha Oath (ward) · Mrityunjaya
(deathless) · Sarpa Satra (sacrifice drain).
Sibling-emit family = 6 (+ Mrityunjaya).
Lazy-load branches: Deva, Naga (T94), Vanara (b30d8da).
REMAINING: Astras 7 (Nagastra, Tamasa, Gandiva Arrow, Lanka Dahan,
Sanjeevani Call, Vasuki Venom Strike, Mohini Trap) · Artifacts 8
(full row untouched). Open rulings that surface with them: Chaos
Surge anchor (Nagastra/Tamasa) · Mohini silhouette-law extension ·
G4 idle-glow (first Artifact).
BRAHMASTRA DRIFT RESOLVED: isolation-proven environmental
(numpy/cv2/PIL moved), not recipe. Sheets stay frozen; the sweep
now reverts it by precedent every run. Open one-liner: pin the
toolchain (requirements file) OR deliberately re-bake + device
re-verify.

## STAMPS
CARD_ART_V=t65 · BOARD_ART_V=b61 · web manifest ?v=3 · embedded
game snapshot 7540db5 (?v=7540db5).

## OWNER BENCH (manual)
- PDF hand-swap: DivyaYuddha_HowToPlay.pdf sheets 2, 5, 9 —
  Hanuman frame to Bali frame ("Bali / The Unrivalled King");
  rendered siblings pages/page_02.jpg, page_05.jpg, page_09.jpg +
  contact_sheet.png share the staleness. NO prose changes (R93
  zero-mechanical-diff); identity line stays.

## DEVICE QUEUE (one phone session clears all; hard-refresh)
Board tiles at b61 · Bali/Narada/ChandraDev hand + board · Bali
aura + six-hero court tints · both pass banners · reveal chip +
peek (play Vibhishana or Scout) · venom-flip round end (totals
settle then banner) · Rama Naam four-beat on a full Vanara board ·
Oath cast-badge-fire arc (Vajra the warded unit) · Mrityunjaya
both revive origins (the enemy-corpse steal is the showcase) ·
Sarpa Satra two-zone with the minus-N rain · live collection page
+ embedded game on mobile.

## PARKED (owner one-liners, no urgency)
Toolchain pin vs brahmastra re-bake · sarpaDouble cue (device
evidence only) · persistent PASSED badge · Bali aura retint
(default vermilion-saffron stands) · scripts/__pycache__ gitignore
line · R93 ripples: Codex pages, generation-DB entries,
masters-archive copy in web3 · Kesari/Riksha frame regen (printed
txt names Hanuman — tolerated under the frame-text ruling) ·
deferReset round-end polish hook · older carry-forwards stand
(S4 squint, Ajagara retitle, rite-mark color, crest-drift squint,
07-27 word register, Security Posture tail, G12 faucet).

## NEXT SESSION OPENS WITH
1. Owner word on the lane: Astra rows (Nagastra/Tamasa forces the
   Chaos Surge anchor early; the Vanara trio banks cheap
   strike-grammar inheritance) — or whatever the device pass
   surfaced.
2. If Astras: layer prompts per card, same intake discipline; the
   strike class inherits Vajra/Nagapasha + victim-showcase; the
   row-plate class inherits Brahmastra.
3. LANE-W standing: W3-PROV-2 (seed broadcast folders), RE-FREEZE
   (one-master-wallet), SECURITY_POSTURE_v1 before StakeEscrow.

## SEEDS USED TODAY (registry)
ramanaam 0xAA4A11 · kishkindhaoath 0x0A7A0A · mrityunjaya 0xD3AD1A
· sarpasatra 0x5A4A5A.
