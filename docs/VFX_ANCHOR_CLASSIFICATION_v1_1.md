# VFX ANCHOR CLASSIFICATION v1.1
Supersedes v1's STOP-AND-REPORT flag on G2. Ruled by Sangbaran 2026-07-29,
same session. Companion to VFX_SPRITE_DIRECTION v5a (ab0f001).

## 1. THE REFINED RULE (owner, verbatim intent)
HERO / UNIT to CARD-ANCHORED. Unchanged, G1.

ASTRA, split by target scope, not a blanket two-layer:
  - Affects exactly ONE unit (destroy/damage/debuff/bind/steal a single
    card) to CARD-ANCHORED, single unit attack effect. No separate row
    plate required - the strike IS the effect.
  - Affects MORE THAN ONE unit (all-enemy, row-wide, board-wide) to
    BOARD EFFECT. No mandatory per-card strike layer - the board effect
    covers legibility across the affected units.
This REFINES v5a's G2 (which mandated two-layer for every Astra
regardless of scope). G2 is not revoked, it is narrowed: the row-plate
layer now applies only to multi-unit Astras, where it was doing real
work; single-unit Astras drop it as redundant with the card-anchored
strike.

MANTRA to BOARD EFFECT. Confirmed, matches shipped G3, unchanged.

ARTIFACT to BOARD EFFECT (arrival). Confirmed for the cast/arrival
moment (matches shipped G4's row-ripple half). OPEN QUESTION, not
resolved today: whether the ongoing card idle-glow layer for
persistent/equipped Artifacts survives this ruling or is cut. Working
assumption until corrected: it survives - an Artifact remains on board
after arrival, unlike a one-shot Astra or Mantra, so a standing idle
layer is a different design question than the arrival effect this
ruling addresses.

## 2. EDGE CASES - NOT UNIT-TARGETED AT ALL
Two Astra shapes exist that hit no specific card:
  (a) Player/system effects (forced pass, hand disruption, negate-next
      wards) - no unit is struck.
  (b) Round-wide mechanic modifiers (changes to how an end-of-round
      mechanic resolves) - a state change, not a strike.
DEFAULT for both: BOARD EFFECT. No card to anchor to; treat as
board-level the same as multi-unit Astras. Revisit if a specific card
in this shape turns out to need its own treatment.

## 3. WORKING CLASSIFICATION - KNOWN ASTRAS (PROVISIONAL)
Target-scope read below is a STRUCTURAL property (how many units the
effect touches), pulled from design-stage rosters for planning only.
NOT CARD-TEXT AUTHORITY - CardRoster_v1.0 stays permanently forbidden
as a text source, and WAVE1_ROSTER entries are pre-sim design text.
Before any single Astra's VFX is generated, confirm its actual target
count against src/engine.js at that time - this table is a planning
aid, not a generation license.

CARD-ANCHORED (single unit):
  Vajra, Sudarshana Chakra, Gandiva Arrow, Sanjeevani Call, Nagapasha,
  Mohini Trap, Agneyastra, Shakti Spear, Mohanastra, Vidyutastra,
  Vayavyastra.

BOARD EFFECT (multi-unit):
  Brahmastra, Pashupatastra, Nagastra, Lanka Dahan, Suryastra.

BOARD EFFECT (edge case - no unit target):
  Tamasa (forced pass, no card struck), Brahmadanda (negate-next ward,
  no card struck), Vasuki Venom Strike (round-wide venom multiplier,
  state change not a strike).

## 4. WHAT THIS DOES NOT CHANGE
G1 stands as-is. C1a (Deva landing, Hero/Unit class) is untouched by
any of this - it was never an Astra question. Wave 1 test order
(C1a first, B1 second) unchanged. MANTRA and ARTIFACT arrival both
confirmed BOARD EFFECT; the idle-glow question (SS3 above) is parked,
not blocking.

## 5. NEXT ACTION - UNCHANGED
MJ Test 1: C1a Deva landing, CARD-ANCHORED per G1. Prompt already
authored and standing. Generate, veto pass, upscale, audit.
