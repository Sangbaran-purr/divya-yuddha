# Realm Introduction — Content Pack v1.0
# (effect-derived: every Thrives/Suffers line below traces to the engine's
#  REALM_INFO effects as reported 2026-07-09; prose is final, paste as written)

IMPLEMENTATION RULES: The effect line shown in the UI must be rendered at runtime
from the engine's REALM_INFO[id].fx — never hand-typed, never copied from this file.
All other prose below (epithets, mood lines, panels, tips) is final copy.
Realm accent colors match the board art: swarga gold #e8c95a, mrityulok warm stone
#c9a86b, patala teal #2dd4b8, gandharva violet #a78bda, yaksha jade #4fae8a,
rishi bronze-blue #8fa3c8, kalki steel #9db4c9.

## Tab intro line (top of the Realms tab)
Every match is fought in one of seven Cosmic Realms, drawn at random as the armies
assemble. The realm bends the rules for BOTH players equally — the edge goes to
whoever reads it faster. When the realm is revealed, adjust your plan before your
first card, not after.

---

## SWARGA — Realm of Gods and Divine Power
**Mood:** The high court of the Devas. Even your enemies stand taller here.
**Effect:** (runtime: REALM_INFO.swarga.fx)

**Thrives here:**
- Hero-anchored plans — every Hero on both sides carries +1 all match
- Hanuman decks especially: the game's largest Hero grows larger still
- Rounds you intend to win with your Hero on the board

**Suffers here:**
- Nobody directly — the blessing is even-handed
- But Hero answers gain value: Sudarshana Chakra benches an enemy Hero for a
  round (it returns at half power), and the bigger the Hero, the more that swings it
- Plans that bench the Hero waste the realm entirely

**Tip:** The +1 is symmetric — the realm doesn't pick a winner, it raises the
stakes on whose Hero survives.

---

## MRITYULOK — The Mortal Plane of Karma and War
**Mood:** No gods intervene here. Only the armies, and what they've earned.
**Effect:** (runtime: REALM_INFO.mrityulok.fx)

**Thrives here:**
- Fundamentals — the better deck and the better round plan, with no modifier
  to hide behind
- Factions on the strong side of a counter matchup: nothing here softens
  the Naga grip on Devas

**Suffers here:**
- Whoever needed the realm's help — there is none
- Devas facing Nagas: the designed counter bites at full strength

**Tip:** The no-effect realm is not the no-strategy realm. With nothing to
leverage, the round economy IS the whole game here — reread How to Win.

---

## PATALA — Dark Depths of the Serpent Kings
**Mood:** The serpent kings sharpen every blade brought into their halls —
even their enemies'.
**Effect:** (runtime: REALM_INFO.patala.fx)

**Thrives here:**
- Astra aggression: damage-dealing Astras hit +1 harder
- Asuras (Pashupatastra) and Vanaras (Lanka Dahan) — the factions carrying
  the game's damage Astras
- Asura amplifiers stack: a Chandrahas-doubled opening Astra in Patala is the
  hardest single hit in the game

**Suffers here:**
- Boards of mid-power Units — what survived elsewhere dies here
- Devas: bigger incoming hits make every un-shielded unit a liability
- Note the irony: the Naga home realm boosts weapons, not Venom — Nagas gain
  nothing from their own kingdom

**Tip:** Count your opponent's damage Astras before committing a round — each
one is worth 1 more here than your instincts say.

---

## GANDHARVA LOK — Plane of Sages, Mantras, and Wisdom
**Mood:** The sages give freely — to both sides. Knowledge is never a weapon
until someone makes it one.
**Effect:** (runtime: REALM_INFO.gandharva.fx)

**Thrives here:**
- Long-game factions: more total cards means longer rounds 2 and 3 — every
  extra turn is another Venom tick for Nagas
- Combo assembly: the extra draw digs toward your Rama Naam, your Mrityunjaya,
  your missing piece
- Round-1 conceders: the refill softens the cost of a cheap surrender

**Suffers here:**
- Card-advantage grinders: out-carding the enemy matters less when both hands
  refill deeper
- Short-round tempo plans — the realm stretches the match against you

**Tip:** The extra card arrives entering Round 2 — plan Round 1 knowing both
of you get a partial refund on whatever it costs.

---

## YAKSHA LOK — Vault of Celestial Treasures and Secrets
**Mood:** In Kubera's vault, nothing placed is ever taken. Choose what you
lock away with care.
**Effect:** (runtime: REALM_INFO.yaksha.fx)

**Thrives here:**
- Artifact engines, above all Patala Throne: its escalating drain runs the
  whole match untouchable — this is the Throne's dream realm
- Kishkindha Crown, Ananta Coil, Amrita Kalasha — every passive engine
  runs uncontested
- Nagas and any Mythic-artifact deck

**Suffers here:**
- Devas specifically: Vishwakarma's artifact-destruction is blank here —
  the game's only artifact answer does not work
- Anyone whose plan against Artifacts was "destroy it"
- (Tripura is NOT saved by this realm — it ends when any Astra is played,
  which is its own bargain, not destruction)

**Tip:** If you carry an Artifact, play it early and without fear. If your
opponent does, your only answer left is winning faster.

---

## RISHI MANDALA — Dancers, Warriors, and Cosmic Music
**Mood:** In the amphitheater of the cosmos, every verse is sung twice.
**Effect:** (runtime: REALM_INFO.rishi.fx)

**Thrives here:**
- The biggest Mantras gain the most: Rama Naam twice is two board-wide surges
  — the realm's single largest prize
- Nagas: Mrityunjaya twice means two corrupted revivals; Sarpa Satra twice,
  two board drains
- Devas defensively: Pavamana twice is a double cleanse — Venom's worst
  nightmare doubled

**Suffers here:**
- Tempo plans that end matches before Mantras matter
- Nagas AND anti-Nagas both spike here — whoever times their doubled Mantra
  for the deciding round wins the exchange

**Tip:** Your 2-per-deck Mantras become up to 4 casts. Spend the first cast
freely; save the return for the round that decides the match.

---

## KALKI KSHETRA — Future Battlefield of the Final Avatar
**Mood:** The last battlefield rewards the one who strikes last.
**Effect:** (runtime: REALM_INFO.kalki.fx)

**Thrives here:**
- Patience: the player who passes LAST plays the last card — and its +2
- Big closers: end the round on a fat Unit or Hero and bank the blessing
- Protectors: a Dharma Shield on your closer guarantees the +2 lands (the
  bonus is lost if the last card dies before round end)

**Suffers here:**
- Early passers: conceding the round also gifts the enemy a free +2
- Fragile closers — removal on the last card played erases the blessing

**Tip:** This realm turns every pass into a bid. The question each turn is no
longer "should I pass?" but "can I afford to let them have the last word?"

---

## Design-debt note (for CLAUDE.md, not for the UI)
Patala's implementation keys on the hardcoded ASTRA_DMG set and Yaksha's on a
Vishwakarma-only guard. Both equal their printed text TODAY (those are the only
damage Astras / the only artifact-destroyer). Wave 1 MUST revisit both lists if
it adds any damage-dealing Astra or artifact-destruction effect, or realm text
and behavior will silently diverge.
