# REALMS_CODEX_CONTENT_v1 — Factions & Realms: REALMS page
# [PULLED file:line] = engine-read (P10) · [VERIFY] · [ED].
# Mockup rules LAYOUT+THEME only. Existing realms tab
# (fiRenderRealms + docs/realm_intro_content.md prose) is SUPERSEDED
# by this page; its per-realm prose is carried as [ED, existing].
# Owner-approved 2026-07-20.

## THEME / CHROME
.fi-realms-page — cosmic violet-gold, portal iconography, per-realm
accent colors on the shared shell. [ED]

## HERO BANNER
Title: REALMS
Tagline: "Every battle is fought in a different world. Learn the
world before you fight the war." [ED]
Chip: STRATEGIC LAYER [ED]

## HOW REALMS WORK — 4 steps (engine-true)
  1 — THE WHEEL TURNS: as the match begins, one of seven Cosmic
      Realms is drawn at random. [PULLED newGame 387: uniform rng]
  2 — THE WORLD BENDS: the Realm's law applies to both sides alike.
      [PULLED realmActiveFor 281: symmetric by default]
  3 — IT HOLDS ALL MATCH: the Realm never changes mid-battle.
      [PULLED: g.realm assigned once, never reassigned]
  4 — ONE KING BENDS IT: only Nahusha, Fallen King can steal a
      Realm's blessing for his side alone — one round. [PULLED
      1616-1618, realmSuppressedRound]

## KEY REALM EXAMPLES (trio — the mockup's three, all engine-true)
SWARGA — "All Heroes have +1 power for the match." [PULLED 418]
PATALA — "All Astra damage is increased by +1." [PULLED 751]
MRITYULOK — "The mortal plane — no realm effect." [PULLED REALM_INFO]

## THE SEVEN REALMS — grid
Order: Swarga · Yaksha Lok · Gandharva Lok · Mrityulok · Patala ·
Rishi Mandala · Kalki Kshetra. [PULLED REALM_INFO 267-276 — count 7
confirmed R6]
Each card: realm name + epithet [ED, mockup/existing prose] + effect
line rendered LIVE from REALM_INFO[id].fx — ZERO hardcoded effect
text (the live-c.txt discipline, realm edition) + one prose line
from realm_intro_content.md [ED, existing].
Epithets [ED]: Swarga/Realm of Gods · Yaksha Lok/Vault of Treasures ·
Gandharva Lok/Plane of Music · Mrityulok/The Mortal Plane ·
Patala/Serpent Kingdom · Rishi Mandala/Realm of Wisdom · Kalki
Kshetra/Field of Reckoning.
Interaction line: "Tap a Realm to learn more." [ED — no hover-ism]

## WINNING WITH REALMS (4, all [ED])
1. READ THE REALM — who benefits, who struggles.
2. CHANGE YOUR PLAN — adjust your mulligan to the world.
3. PLAY THE LONG GAME — don't force the combo the Realm punishes.
4. MASTER ADAPTATION — winners don't fight the Realm. They use it.

## REALM LORE column [ED — mockup lines, kept]
At the peak lies SWARGA, seat of the gods. Below it shines YAKSHA
LOK, keeper of wealth. Where songs never end is GANDHARVA LOK. At
the heart of the wheel — MRITYULOK. Beneath the earth coils PATALA,
ancient and deep. In hidden places exists RISHI MANDALA. At the edge
of time awaits KALKI KSHETRA.
Closing: "Seven realms. One wheel. Infinite battles."

## FOOTER
"THE BATTLEFIELD CHOOSES NO SIDE. WISDOM CHOOSES THE VICTOR." [ED]
CTAs: VIEW REALM GUIDE omitted — this page IS the guide.
BACK TO HOW TO WIN → win tab. BUILD A DECK [locked].

## VOID REGISTER (from mockup)
Gandharva="Mantras twice" (that is Rishi's law) · Rishi="draw 1
extra" (that is Gandharva's) · Kalki="extra card arrives Round 2"
(real Kalki: last card played gains +2, Units/Heroes only — engine
truth, never before taught) · the matchup wheel + advantage dots
(invented analytics) · "affects everyone equally" as absolute (Nahusha
exists) · "Hover or click" (desktop-ism) · the old intro line "bends
the rules for BOTH players equally" (superseded by steps 2+4).
