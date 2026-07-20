# VANARAS_CODEX_CONTENT_v1 — Factions & Realms: VANARAS page
# Claim protocol: [PULLED file:line] = engine-read · [VERIFY] = CC must
# confirm before teaching · [ED] = editorial, no mechanic claim.
# Source: TASK P9 read-only pull (2026-07-20). Mockup rules LAYOUT+THEME
# only. Owner-approved 2026-07-20.

## THEME / CHROME
.fi-vanaras-page — jungle-green/gold voice on the parameterized shell
(fiCM/fiCMtxt/fiCMtrio). Canopy-and-vine world, lotus-dais centerpiece,
seated sentinel hero-left. [ED — mockup-ruled]

## HERO BANNER
Title: VANARAS
Tagline: "The devoted. One is weak. Ten thousand, moving as one, are not." [ED]
Difficulty chip: EASY TO LEARN, DEEP TO MASTER [ED]
Playstyle chip: MOMENTUM AND SWARM [ED]
Trait icons: LOYALTY · AGILITY · UNITY [ED]

## SIGNATURE MECHANIC — LEAP
Panel copy:
"Once per round, one of your Vanara Units may LEAP — its power becomes
equal to an adjacent ally's current power. A free action: it costs no
card and no turn. Go wide first; then leap your line into a wall."
[PULLED doLeap 514-523: hard SET to effPower of target; power only, no
shield/venom transfer 513; free action, leapsUsed limit 551; adjacency
via adjacentUnits 494/539]

Sub-line: "Kishkindha Crown raises the limit to twice per round and
feeds both — leaper and copied ally each gain +1. Anjana grants a
third leap." [PULLED 512, 520]

STEP diagram:
  STEP 1 — Choose a Vanara on your row
  STEP 2 — Pick an ADJACENT ally (Gandhamadana may be copied from
           anywhere) [PULLED 536-539]
  STEP 3 — Its power becomes that ally's. Free, once per round.

[VERIFY — BLOCKING]: doLeap itself carries no adjacency guard; the
constraint lives in bestLeap (AI path). CC must confirm the HUMAN UI
leap path enforces adjacency before this panel ships. Mismatch = STOP.

## KEY CARDS TRIO (real texts, verbatim)
1. RAMA NAAM (Mantra, Rare): "All friendly Vanara Units gain +2 power."
   [PULLED C1] — chip: ARMY BUFF
   NOTE: engine text has NO Hanuman +3 rider — the launch-roster rider
   never shipped. Teach +2 flat only.
2. KISHKINDHA CROWN (Artifact, Mythic): "When a Vanara Unit Leaps, it
   and the copied Unit both gain +1. Leap limit becomes twice per
   round." [PULLED 166] — chip: LEAP ENGINE
3. HANUMAN (Hero, Legendary, P9): "Each Vanara Unit of printed power
   4+ you play gains +1 on entry (+2 while Jambavan is on the board)."
   [PULLED 143] — chip: MOMENTUM ENGINE

TIP strip: "Leap before you fire Gandiva Arrow — if a Vanara Leapt
this round, the Arrow destroys a second Unit." [PULLED gandiva 1252]

## STRENGTHS / WEAKNESSES
STRENGTHS [each engine-grounded]:
- Swarm scaling: Units that grow with every ally (Vanara Warrior,
  Neela, Song of the Crossing) [PULLED C1]
- Free tempo: Leap adds power without spending a card or a turn [PULLED]
- Formation payoffs: adjacency rewards (Setu Mason, Drummer, The
  Living Bridge) [PULLED C1]
- Card advantage: Sugriva, Dadhimukha, Tara [PULLED C1]
- The ward: Kishkindha Oath keeps a key Unit alive at 1 [PULLED C1]
WEAKNESSES [ED, engine-consistent]:
- Small bodies alone — the army IS the unit
- Formations break when removal snipes the middle of a line
- A Leap moves power sideways; without the Crown it adds nothing net
- Venom pressures wide boards — Rama's Signet is the answer, and
  only one artifact slot exists

## CORE STRATEGY — HOW VANARAS WIN
1. GO WIDE — cheap bodies early; every Vanara makes the next better. [ED]
2. LEAP AND AMPLIFY — leap into your tallest ally; Kumuda and Rambha
   grow permanently with every leap. [PULLED 528, 530]
3. STRIKE AS ONE — Rama Naam, Lanka Dahan, Anjaneya's Roar: the whole
   line rises at once. [PULLED C1]

## GALLERY
Header: THE DEVOTED HOST — "44 CARDS" (22 launch + 22 wave; no
"of 66", no reveal count). Filters per shell. All texts render live
card.txt [PULLED C3: zero UI deltas].

## SIGNATURE SYNERGIES (4)
1. THE CROWN ENGINE — Crown + Kumuda: two leaps, both fed, Kumuda +2
   permanent each time it leaps or is leapt-to. [PULLED 520, 528]
2. THE BRIDGE — Setu Stones + Drummer + The Living Bridge: enter in
   formation, buff the line, the unbroken four gains +2 permanent.
   [PULLED C1]
3. THE SECOND SHAFT — Leap first, then Gandiva Arrow destroys two.
   [PULLED 1252]
4. THE BOLD RISE — Rambha + Matanga's Blessing + Mainda: free leaps
   stack permanent power outside the round limit. [PULLED 1027-1032,
   1589, 530]

## FOOTER
"THE VANARAS DO NOT SEEK GLORY. THEY SEEK VICTORY." [ED]
CTAs per shell: VIEW COLLECTION · BUILD A DECK · CONTINUE TO NAGAS

## VOID REGISTER (from mockup — never revive)
Vajra Leap · Gayatri-as-Vanara w/ shield rider · Vayu · Maruti Scout ·
Brihaspati-as-Vanara · Hanuman P7 choose-one · Angada P3 · "44 of 66" ·
"choose any ally" (adjacency is the law) · shield-based weaknesses
(shields are Deva-only).
