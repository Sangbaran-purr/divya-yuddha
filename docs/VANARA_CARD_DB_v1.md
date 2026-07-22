# VANARA CARD DATABASE v1 — launch 22 with epithets
# STATUS: ROSTER-SOURCED DRAFT. Engine is sole card-fact authority.
# GATE: TASK P13 (below) must pull the Vanara table from src/engine.js
# and diff against this doc before any frame run, codex use, or ruling
# cites it. Powers and rarities are corroborated by all 22 shipped card
# PNG filenames (naming convention carries P and r). Ability text is
# CardRoster v1.0 and is the drift-risk layer.
#
# KNOWN DRIFT WATCHLIST (from FACTION_MECHANICS_v1 pulls):
# 1. LEAP mechanic itself: [VERIFY] never pulled. Roster defines it as
#    "one Vanara Unit copies power of adjacent unit, once per round."
#    Engine-verified fragments only: Leap action exists, base once per
#    round, Crown raises to twice.
# 2. RAMA NAAM: engine-fair claim is "+2 to every Vanara Unit" FLAT.
#    Roster's Hanuman +3 conditional and Naga-counter clause are
#    unconfirmed. P13 resolves.
# 3. HANUMAN passive: engine-fair claim wording differs from roster.
#    P13 resolves exact trigger and amount.
# 4. ANGAD ability text truncated in roster source. P13 pulls full text.
# 5. RAMA'S SIGNET: engine-pulled as "Venom negated, floors at 1" —
#    matches roster in substance.

## FACTION FRAME
Identity: agility, loyalty, burst, tempo. Coordinated collective
explosion. Mechanic: LEAP (see watchlist 1). Signature synergy chain:
Hanuman passive, doubled by Jambavan, multiplied across Neela,
Dadhimukha, Warrior stacking.

## HEROES (3)
H1 HANUMAN
   Epithet: Devotion Incarnate
   Power 9 | Legendary
   TXT [ROSTER, watchlist 3]: Passive — whenever the Vanara player
   plays any Unit card, that Unit gains +1 additional power on entry.
   FLAVOR: His name alone is a weapon.

H2 SUGRIVA
   Epithet: King of the Vanaras
   Power 6 | Epic
   TXT [ROSTER]: Triggered — when played, draw 1 extra card
   immediately.
   FLAVOR: From exile came the king who changed the war.

H3 ANGAD
   Epithet: The Unyielding Messenger
   Power 7 | Epic
   TXT [ROSTER, watchlist 4 — TRUNCATED]: Passive — cannot be targeted
   by opponent Mantras. [P13: pull remainder]
   FLAVOR: He planted his foot in Ravana's court and no one could move it.

## UNITS (12)
U01 NALA
   Epithet: The Bridge Builder
   Power 5 | Epic
   TXT [ROSTER]: On play — place one additional copy of the lowest
   power Vanara Unit in your hand directly onto the board at half power.
   FLAVOR: He built a bridge across the impossible. That was the easy part.

U02 NEELA
   Epithet: Commander of the Vanguard
   Power 5 | Rare
   TXT [ROSTER]: On play — all Vanara Units on the board gain +1 power.
   If Sugriva is on the board, +2 instead.
   FLAVOR: Where Neela stands, the line does not break.

U03 JAMBAVAN
   Epithet: The Ancient Bear King
   Power 6 | Epic
   TXT [ROSTER]: Passive — while on the board, Hanuman's passive grants
   +2 per Unit played instead of +1.
   FLAVOR: He was there at creation. He will be there at the end.
   Everything in between is just detail.

U04 KESARI
   Epithet: Father of Hanuman
   Power 5 | Rare
   TXT [ROSTER]: On play — if Hanuman is on the board, gains power
   equal to Hanuman's current power value.
   FLAVOR: The son became legend. The father made him possible.

U05 TARA
   Epithet: Queen of the Vanaras
   Power 4 | Rare
   TXT [ROSTER]: On play — look at the top 3 cards of your deck. Keep
   one, return the other two in any order.
   FLAVOR: She saw what others missed. In war, that is everything.

U06 DWIVIDA
   Epithet: The Rogue Vanara
   Power 5 | Rare
   TXT [ROSTER]: On play — destroy one random card in opponent's hand
   without revealing it.
   FLAVOR: He stole Balarama's weapons for sport. Chaos was his only loyalty.

U07 MAINDA
   Epithet: The Swift Striker
   Power 4 | Uncommon
   TXT [ROSTER]: On play — use Leap immediately on any adjacent Unit
   without spending the faction's one Leap per round.
   FLAVOR: He moved before the command was given. He was already there.

U08 SHARABHA
   Epithet: The Forest Sentinel
   Power 3 | Uncommon
   TXT [ROSTER]: Passive — opponent cannot target any Vanara Unit with
   power 3 or less with Astras.
   FLAVOR: The small ones fight under his shadow. He makes sure they
   live long enough to matter.

U09 VANARA SCOUT
   Epithet: Eyes of the Jungle
   Power 2 | Common
   TXT [ROSTER]: On play — reveal opponent's full hand for one turn.
   Gain +1 power for each Vanara Unit already on the board.
   FLAVOR: No army moves without Rama knowing first.

U10 VANARA WARRIOR
   Epithet: Loyal to the Last
   Power 3 | Common
   TXT [ROSTER]: Passive — gains +1 power for each other Vanara Unit
   on the board (max +4).
   FLAVOR: Alone he is one soldier. Together they are an avalanche.

U11 DADHIMUKHA
   Epithet: Guardian of Madhuvana
   Power 3 | Uncommon
   TXT [ROSTER]: On play — if Sugriva is on the board, draw 1 card AND
   give all friendly Vanara Units +1 power. If not, draw 1 card only.
   FLAVOR: He ran beaten and breathless to his king — not in defeat,
   but in triumph.

U12 RIKSHA
   Epithet: Son of the Wind
   Power 4 | Rare
   TXT [ROSTER]: On play — move to any position on the Yuddha Row. If
   placed adjacent to Hanuman, gain +3 power.
   FLAVOR: The wind fathers many sons. Each one carries its fury differently.

## ASTRAS (3)
A1 GANDIVA ARROW
   Epithet: Blessed Shaft
   Rare
   TXT [ROSTER]: Destroy one enemy Unit of your choice regardless of
   power. If a Vanara Unit used Leap this round, destroy one additional
   enemy Unit.
   FLAVOR: Arjuna's bow blessed every arrow it released. The Vanaras
   carried that blessing forward.

A2 LANKA DAHAN
   Epithet: Fire of Hanuman
   Legendary
   TXT [ROSTER]: Deal 2 damage to ALL enemy Units. All friendly Vanara
   Units gain +1 power.
   FLAVOR: He burned their finest city. Then he flew home.

A3 SANJEEVANI CALL
   Epithet: Mountain of Life
   Uncommon
   TXT [ROSTER]: Revive the last destroyed friendly Unit at full power.
   It immediately gains Hanuman's passive bonus if he is on board.
   FLAVOR: He carried the entire mountain because he could not waste
   time identifying one herb.

## MANTRAS (2)
M1 RAMA NAAM
   Epithet: The Name Above All
   Rare
   TXT [ROSTER, watchlist 2 — ENGINE DIVERGES]: roster reads +2 all
   friendly Vanara Units, +3 if Hanuman on board, cannot be countered
   by Naga effects. Engine-fair claim on record: "+2 to every Vanara
   Unit" flat. P13 resolves; the flat form is presumed shipped.
   FLAVOR: Two syllables. Ra and Ma. Together they form the name that
   holds the universe together.

M2 KISHKINDHA OATH
   Epithet: Bond of Warriors
   Uncommon
   TXT [ROSTER]: Choose one friendly Vanara Unit about to be destroyed.
   It survives with 1 power. All other friendly Vanara Units gain +1.
   FLAVOR: No Vanara falls alone. Every wound witnessed becomes the
   army's fury.

## ARTIFACTS (2)
R1 RAMA'S SIGNET
   Epithet: Seal of Trust
   Rare
   TXT [PULLED-corroborated]: Passive — friendly Vanara Units cannot be
   reduced below 1 power; Venom on friendly units is negated.
   FLAVOR: Rama gave Sita his ring as proof of identity. He gave the
   Vanaras something more — his absolute trust.

R2 KISHKINDHA CROWN
   Epithet: Throne of Unity
   Mythic
   TXT [ROSTER + PULLED fragment]: Passive — when a Vanara Unit uses
   Leap, that unit and the copied unit both gain +2. Leap limit becomes
   twice per round. (The twice-per-round half is engine-verified.)
   FLAVOR: Sugriva's crown was not gold. It was the loyalty of ten
   thousand warriors who needed only a reason to fight.

## TASK P13 — THE GATE (CC prompt, run before this doc is ruled)
STEP 0: read the Vanara card definitions in src/engine.js. Report as
plain text: exact ability implementation for all 22, the Leap action's
full effect and economy, Hanuman's exact passive trigger and amount,
Angad's complete ability, Rama Naam's exact effect and any conditionals.
Diff every line against docs/VANARA_CARD_DB_v1.md. Report deltas only.
No code changes. STOP after reporting.
