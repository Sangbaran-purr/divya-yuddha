# DIVYA YUDDHA — FACTION_MECHANICS_v2
# Supersedes v1 (which was never committed). CLAIM PROTOCOL:
# [PULLED] = read from the engine in a recorded pull (T46/T47/T48,
# the 45b audit, ITEM R, P13); [VERIFY] = never pulled — must be
# read before any page/frame/doc teaches it; [ED] = design
# framing, not an engine claim.
# STATUS: Deva + Asura + VANARA are pull-complete. Two Naga Venom
# edges remain [VERIFY] — closed by P15 before the Nagas Codex.

## DEVAS — DHARMA SHIELD (pull-complete, T47)
Identity [ED]: protection and endurance — the shield is divine
favor placed on a chosen Unit.
THE MECHANIC [PULLED]:
- A shielded Unit becomes astraProtected: it CANNOT BE TARGETED
  by single-target Astras (it drops out of their target pools
  entirely — Agneyastra, Vajra, Gandiva-class find no target).
- It is TARGETING-PREVENTION, not damage absorption: there is
  no absorb-and-break.
- Board-wide Astras PIERCE (Pashupatastra, Brahmastra,
  Suryastra iterate units directly).
- Venom is UNAFFECTED by shields (drain proceeds).
- Shield limit: shieldCap = 1 by default; Dharma Kavacha raises
  it to 2; Vedi Keeper grants an extra instant application this
  round.
- Shields are sticky per-round designations (reset at round
  end). Deva-only.
- Brahmastra explicitly "overrides all shields and immunities."
KEY CARDS [PULLED]: Dharma Kavacha, Vedi Keeper, Airavata's
Calf (enters shielded, respects the limit), Gayatri Mantra
(revives WITH a shield), Vigil Rakshak (+2 while shielded).
COUNTERPLAY [PULLED]: AoE Astras, Venom, and anything that
doesn't target (Tataka's lowest-unit destruction is a [VERIFY]
edge — does "destroy the lowest" target or select?).

## ASURAS — CHAOS SURGE (pull-complete, T48 incl. call sites)
Identity [ED]: the storm the Asura weapons carry — power paid
for in risk. THE PRICE.
THE MECHANIC [PULLED]:
- chaosSurge is Asura-only. When it fires, a RANDOM friendly
  non-ghost Unit gains power (g.rng — the player does not
  choose).
- Amounts (complete reachable set, proven at call sites):
  +3 per surge from Asura Astras resolving, Asura Mantras cast,
  and Chandrahas ON PLAY; +1 "floor" surge when an Asura play
  triggers nothing else that round-step. (+2 exists only as a
  vestigial unwired comment — unreachable.)
- times multiplies: Chandrahas doubles Surge counts while
  active; Vidyutastra fires twice (times Chandrahas = 4).
- chaosThisRound flags the round — Kali Asura's "+3 if Chaos
  Surge triggered this round" reads it.
- R37 (negation-source-dependent): Manasa's negation cancels
  the Astra's effect AND its Surge; Brahmadanda cancels the
  effect only — the Surge still fires.
KEY CARDS [PULLED]: Kali Asura, Chandrahas, Vidyutastra,
Bana Asura (+1 per Astra, doubled counts twice), Asura
Berserker (+1 per Astra either player).
COUNTERPLAY [ED, grounded]: negate the Astra at the source
(Manasa kills the Surge too); survive the burst — Surges bless
random units, so spread damage undoes concentrated luck.

## VANARAS — LEAP (pull-complete, P13 2026-07-22)
Identity [ED]: momentum and the host that moves as one — the
many lending strength to the one.
THE MECHANIC [PULLED — P13, all claims file:line-traced]:
- Leap is a POWER-COPY, NOT movement. The leaping Unit's power
  becomes the current effective power of an ADJACENT friendly
  Unit (adjacency = index neighbours in the ordered units
  array). No Unit changes position. "Leap onto" is metaphor.
- Vanara-only: canLeap gates on faction === vanaras (proven,
  no longer presumed).
- Allowance: base 1 per round (leapsUsed counter, reset at
  endRound). Kishkindha Crown raises the limit to 2. (Wave:
  Anjana adds +1 — not launch.)
- "Feeds both" = the Crown's doLeap branch: on a Leap, leaper
  AND copied target each gain +1 (engine truth +1/+1, not the
  roster's +2/+2 — EXP-E).
- Units only: Heroes are positionless (not in the units array)
  and can neither leap nor be copied.
- The copied VALUE is read at leap time and includes the
  target's live auras (Warrior aura, Indra aura, banners); the
  aura SOURCE does not transfer — the leaper gets a number, not
  a passive.
- Venom tokens, shields, wards, and flags never travel; the
  leaper keeps its own state. Venom-drained values are already
  reflected in the copied effPower.
- Free leaps exist (Mainda ON PLAY) and do not consume the
  round's allowance.
- Gandiva Arrow reads leapsUsed greater than zero for its
  second destroy — Leap as a resource other cards check.
KEY CARDS [PULLED]: Kishkindha Crown (limit 2, +1/+1),
Mainda (free entry-leap onto a stronger neighbour), Gandiva
Arrow (leap-conditional second removal), Hanuman (printed-4+
entry bonus +1, +2 with Jambavan), Vanara Warrior (+1 per
other Vanara Unit, cap +4), Rama's Signet (floor 1, Venom
negated), Sharabha (astra cover for effPower 3 or less),
Angad (opponent Astra costs them their next turn).
COUNTERPLAY [ED, grounded]: kill or shrink the copy TARGET
before the leap (the value is read live); removal ignores
Leap entirely since nothing moves; the Signet floor and
Sharabha cover are the defensive spine — board-wide Astras
pierce Sharabha's targeting cover.

## NAGAS — VENOM (mostly pulled; two edges open, P15 pending)
Identity [ED]: patience and inevitability — the abyss collects.
THE MECHANIC [PULLED]:
- A Venom Token on a Unit deals -1 power at round end; at 0
  power the Unit dies (the R90.8 canonical wording).
- Venom STACKS (the vstack render path exists and displays
  multiples).
- Venom ignores Dharma Shields (the T47 pull, from the shield
  side).
- Sarpa Satra: "Venom doubles this round" (sarpaDouble, times-2
  drain, engine-verified).
- Karkotaka: venom ticks on EVERY ENEMY TURN, not just round
  end (R10, engine-verified claim).
- Garuda (Deva side): "Remove all Venom from your Units; each
  gains +1 power per token removed" — the canonical cleanse.
- Rama's Signet (Vanara side): negates Venom on Vanara Units
  (floor 1) [PULLED — reconfirmed P13 from the Vanara side:
  venomLoss floor and venomTokens negation call sites].
[VERIFY] — P15 closes these before the Nagas Codex page:
- The full list of Venom APPLICATION sources (Nagastra applies
  to ALL; which cards apply single tokens; any passive
  appliers) — the "how you poison" panel needs the real set.
- Exact stack semantics (does each token drain -1 each, i.e.
  3 tokens = -3 per tick?) — implied by vstack, never read.
- Whether Venom is Naga-only as an applier class.

## CROSS-FACTION INTERACTION TABLE (verified cells only)
- Shield vs single-target Astra: BLANKED [PULLED]
- Shield vs AoE Astra: PIERCED [PULLED]
- Shield vs Venom: NO PROTECTION [PULLED]
- Shield vs Brahmastra: OVERRIDDEN [PULLED]
- Venom vs Vanara (Signet up): NEGATED, floor 1 [PULLED]
- Venom vs Garuda: CLEANSED into +1/token [PULLED]
- Surge vs negation: source-dependent per R37 [PULLED]
- Leap vs Venom: value copied venom-inclusive; tokens never
  travel [PULLED — P13]
- Leap vs Shields: no interaction (Leap does not target)
  [PULLED — P13]
- Leap vs auras: value at read time; source stays [PULLED — P13]

## EXECUTION
This doc feeds the Vanaras and Nagas Codex content docs. The
Vanaras page is UNGATED as of P13. The Nagas page waits on P15
(the two Venom edges above). Nothing in this doc may be taught
on a page until its line is [PULLED].
