# NAGAS_CODEX_CONTENT_v1 — Factions & Realms: NAGAS page
# Claim protocol: [PULLED file:line] = engine-read · [VERIFY] = CC must
# confirm before teaching · [ED] = editorial, no mechanic claim.
# Sources: TASK P9 pull (2026-07-20) · R92 (docs/rulings_R92.md, T50
# shipped 2caa722). Mockup rules LAYOUT+THEME only.
# Owner-approved 2026-07-20.

## THEME / CHROME
.fi-nagas-page — blue-black abyss + bioluminescent teal on the
parameterized shell. Underwater Patala, venom ALWAYS green (faction
law), twin-serpent altar divider, Vasuki enthroned hero. [ED]

## HERO BANNER
Title: NAGAS
Tagline: "The serpent kings of Patala. They do not rush. They do not
need to." [ED]
Difficulty chip: ADVANCED [ED]
Playstyle chip: ATTRITION AND INEVITABILITY [ED]
Trait icons: VENOM · ATTRITION · DEPTH [ED]

## SIGNATURE MECHANIC — VENOM
Panel copy:
"The Nagas do not race. Every round's end, the deep itself drains the
enemy — and every Venom Token your cards plant bites for more. No
single tick matters. All of them together decide the match."
[PULLED venomPassive 615-625 + venomTokens 627-634]

HOW VENOM WORKS — 4 steps (the mockup's slot, engine-true):
  1 — Being Nagas is the weapon: at round's end, EVERY enemy Unit
      loses 1 power. Automatic. [PULLED venomPassive; drainAmount 575]
  2 — Your cards stack Venom Tokens; each token drains an extra −1
      at the tick. Tokens have no cap. [PULLED venomTokens 627-634]
  3 — Nothing shields against it: Dharma Shield does not stop Venom.
      [PULLED B3(b) 600-643]
  4 — At 0 power, the Unit dies. Venom kills. [PULLED B3(a);
      sweepDeaths 657; Nagastra txt]

Sub-line: "Patala Throne and Vasuki deepen the drain as rounds pass.
Karkotaka moves it: your Venom fires once, the moment either player
first passes each round, instead of at round end." [PULLED drainAmount
575-580; R92 txt verbatim, T50]

## KEY CARDS TRIO (real texts, verbatim; the mockup's "Ananta" is out)
1. VASUKI (Hero, Legendary, P8): "ON PLAY: All enemy Units lose 1
   power. PASSIVE: In Round 3, the Venom drain is −2 per enemy Unit."
   [PULLED C2] — chip: THE DEEP CLOCK
2. MANASA (Unit, Epic, P5): "PASSIVE: The opponent's Astras are
   cancelled (effect and Chaos Surge). ON PLAY: gain +1 power for each
   Naga Unit on the board." [PULLED C2] — chip: THE SILENCER
3. PATALA THRONE (Artifact, Mythic): "PASSIVE: Your Venom drain
   becomes −(1 + current round number): R1 −2, R2 −3, R3 −4."
   [PULLED C2] — chip: DRAIN ENGINE

TIP strip: "Sarpa Satra doubles what your Tokens bite — stack Venom
first, then make the sacrifice." [PULLED B3(c): token drain only]

## STRENGTHS / WEAKNESSES
STRENGTHS:
- The passive tide: chip damage that ignores unit quality [PULLED]
- Scaling clocks: the drain deepens by round (Vasuki, Patala Throne,
  Kaliya, Ashvatara) [PULLED C2]
- The designed Deva counter: shields never stop attrition [PULLED B3(b)]
- Corrupted revival: even the dead serve the poison (Mrityunjaya,
  Ulupi, Shesha) [PULLED C2]
- Denial: Manasa, Surasa, Nagapasha, Naga Enchantress [PULLED C2]
WEAKNESSES [ED, engine-consistent]:
- Slow starts: short rounds starve the Venom clock
- Rama's Signet blunts the poison against Vanaras — Tokens on their
  Units are negated and the passive cannot drop them below 1 (the
  drain is dulled, not switched off) [PULLED 603, 630]
- Demands planning rounds ahead; mistakes compound quietly
- Low bodies: the clock must survive long enough to matter

## CORE STRATEGY — HOW NAGAS WIN
1. POISON EARLY — plant Tokens from the opening turns; start the
   clock. [ED]
2. CONTROL THE DEPTHS — cancel, bind, trap, revive; let the drain
   work while the enemy stalls. [PULLED C2: manasa/nagapasha/surasa]
3. OUTLAST — their board sinks a little every round; in Round 3 the
   deep bites hardest. [PULLED 575-580]

## GALLERY (T47/T48 host pattern from birth)
fiSecTitle: THE SERPENT KINGDOM — subline "44 Cards" (no "of 66", no
reveal count, no sealed slots, NO bulk grid). Curated host six, all
LAUNCH: Vasuki (hero) · Naga Warrior · Kaliya · Naga Sadhu (units) ·
Vasuki Venom Strike (astra) · Ananta Coil (artifact) — live c.txt.
Then fi-dcta "View Full Collection ›" → colFaction='nagas';
showCollection().

## SIGNATURE SYNERGIES (4)
1. THE DEEP CLOCK — Patala Throne + Vasuki: by Round 3 the drain
   alone is −4/−2 stacking across every enemy. [PULLED 575-580]
2. THE HARVEST — Vishalakshi + any Token spread: every venomed death
   feeds her +2 permanently. [PULLED C2]
3. THE SECOND KING — Throne of the Second King + a stacked board:
   every point Venom takes, your strongest Unit gains. [PULLED C2]
4. DEATH SERVES US — Mrityunjaya: steal any corpse, either discard;
   it returns venomed, and it fights for you. [PULLED C2]

## FOOTER
"THE NAGAS DO NOT SEEK GLORY. THEY OUTLAST." [ED]
CTAs per shell: VIEW COLLECTION · BUILD A DECK [locked] ·
CONTINUE TO REALMS

## VOID REGISTER (from mockup — never revive)
Vasuki P7 (engine P8) · Karkotaka P5 (P6) · Mahapadma P4 (P5) ·
Shesha P3 (P7) · "ANANTA the Endless One" creature (real card is the
artifact Ananta Coil) · "SARPA SUTRA — Venom Chant" (real: Sarpa
Satra, a sacrifice) · chips Poison Arrow / Early Venom / Tempo
Control (not cards) · "44 of 66" · "Signet switches your faction
mechanic off entirely" (overstatement — see Weaknesses) · "at the end
of each round, Venom drains" as the whole story (flattens the
two-drain truth and predates R92).
