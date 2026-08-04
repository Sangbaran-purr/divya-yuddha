# DIVYA YUDDHA - HOW_TO_PLAY_v1 (PUBLIC) - CONTENT DOCUMENT
# Owner-ruled ("The doc is ok", 2026-08-04). Authority for
# T-HOWTO-1. Amendment A1 integrated into Page 5. Built on the
# public-document-master dress (cover + template + medallions,
# docs/public/, page-native composition, every page rasterized
# and eyeballed before ship). Audience: presale customers.

## GOVERNING LAWS (bind every page)
1. SCRUB LAW: the free platform does not exist on these pages.
   No coins, no vault, no free-tier framing, zero mentions.
2. MECHANICS AUTHORITY: FACTION_MECHANICS_v2 (1333ea2). Nothing
   taught may exceed a PULLED line. PULL-AT-BUILD slots are
   filled by the build task's STEP 0 from src/engine.js - never
   from memory, never from CardRoster v1.0 (forbidden source),
   never from the old pitch PDF (poisoned source: DIVYA-token,
   25-card decks, energy limits, and 90/10 splits are all VOID).
3. ECONOMY AUTHORITY: TOKENOMICS_v2 + ICO_v2. Token is DYCoin
   (DYC) everywhere. Tables 10/50/200/1000 DYC + friend tables
   to 10K. Rake 5 percent to treasury. Staking language is
   earns-from-activation, never "automatically."
4. LEAP TEACHING LAW: Leap is COPY/MATCH, never movement. No
   movement arrows, no jumping figures, no crossing imagery in
   any Leap illustration.
5. ART SOURCES: card imagery from the 176 canonical masters;
   UI captures and backdrops from docs/public/assets/howto/.
   Generators contribute zero words. All labels are canvas text.
6. NO PROMISES BEYOND RULINGS: no win-rate claims, no
   neutrality guarantee (C1 closure), no duplicate-policy or
   earnable-card details (open design), no dates.

## PAGE 1 - COVER
Dress: the document-master cover canvas, retitled.
TITLE: DIVYA YUDDHA - BATTLE OF THE CELESTIALS
SUBTITLE: How to Play
STRAP: The war of the four hosts, in your hands.
ART: cover canvas as-is.

## PAGE 2 - WHAT IS DIVYA YUDDHA
BODY:
Divya Yuddha is a card battler drawn from the deep well of
Indian mythology. Two players. Three rounds. The player who
wins two rounds wins the match.

Each round is a contest of raw power: you and your opponent
take turns playing cards to the field, and every card adds its
power to your side's total. When both players have passed, the
round ends - the higher total holds the field.

Simple to state. Ruthless to master. Because your deck is
finite, every card you spend winning one round is a card you
will not have for the next. Divya Yuddha is a game about
knowing when to fight - and when to let a field fall.

Four hosts wage this war, each with a signature power:
- THE DEVAS, who shield their champions with divine favor.
- THE ASURAS, whose weapons carry a storm they cannot aim.
- THE VANARAS, who match one another's strength as one host.
- THE NAGAS, whose poison does not duel - it waits.

ART: four-faction hero lineup from the canonical masters (final
picks at build). No new generation.

## PAGE 3 - ANATOMY OF A MATCH
BODY:
THE DRAW. You begin the match with a hand of ten cards, drawn
from your deck. Before the first round, you may return up to
three of them to the deck and draw replacements - a wise hand
is chosen twice.

THE TURNS. Players alternate. On your turn you play a card
from your hand to the field. Units and Heroes stand on your
row and add their power; Astras strike; Mantras invoke;
Artifacts take their seat and work quietly.

THE PASS. At any point, instead of playing, you may pass.
Passing means you are done with this round - your total is
locked, and your opponent may keep playing into a field you
have already conceded or already won. When both players have
passed, the round is scored: the higher power total takes it.

BETWEEN ROUNDS. The field clears. Each player draws two fresh
cards - but keeps every unspent card in hand. This is the
heart of the game: cards carry forward. Rounds do not.

THE MATCH. First to two rounds wins.

ART: howto_board_battle_vfx derivative, cropped to game
viewport, with five authored callouts applied at canvas stage:
YOUR FIELD / THEIR FIELD / HAND / POWER TOTALS / PASS - plus a
sixth on the Vajra strike: ASTRAS STRIKE. Sidebar panel: the
mulligan screen (howto_mulligan_divine_choice derivative)
captioned "A wise hand is chosen twice."
CITATIONS: handSize 10, mulligan 3, draws 2, winTarget 2
[PULLED - STEP-0 report L305/L380/L379/L378].
Deck-size sentence: OMITTED per the enforcement law (pool size
is emergent, not enforced; deckbuilding deferred by design).

## PAGE 4 - THE ROUND ECONOMY (WINNING BY LOSING)
BODY:
Here is the lesson every great player learns first: you do not
need every field. You need two.

Suppose your opponent pours five cards into the first round.
You play one, and pass. They take the field - and now you hold
six cards against their three. In the rounds that decide the
match, you fight at numbers they cannot answer. Every card
they burned on an empty field is a card they will not have
when it matters.

This is the round economy. Cards are the true currency of
Divya Yuddha; power totals are only how you spend them. Force
your enemy to overpay for a field you never wanted. Let them
spend their fury. Then take the war.

Three habits of the patient commander:
- Never chase a round your opponent has decided to buy at any
  price.
- Count hands, not just power. Six against three wins wars.
- A round conceded early costs less than a round lost late.

ART: two-panel diagram composed at canvas stage from mini-card
imagery (masters), authored labels only. Panel 1 "They spend
five, you spend one" / Panel 2 "Rounds two and three: six
cards against three." No generated diagram.

## PAGE 5 - THE CARDS I: UNITS AND HEROES
BODY:
UNITS are the body of your host. Each carries a power number -
its weight on the field - and many carry an ability that fires
on entry, endures while they stand, or triggers when
conditions are met. Units stay on the field until the round
ends or something removes them.

HEROES are the named legends - Hanuman, Ravana, Takshaka, the
great figures of the war. A Hero is a Unit of higher station:
stronger, rarer, and built to bend the battle around itself.
Only one Hero may take the field per round - choose the moment
of your legend with care.

Reading a card:
- The NUMBER is power - what it adds to your total.
- The TEXT is law - what it does is exactly what it says.
- The FRAME tells rarity at a glance.

ART: two canonical masters at full size, one Unit and one Hero,
same faction (recommend Vanara: a warrior Unit beside Hanuman).
Canvas callout arrows to power chip / text panel / frame.
CITATIONS: card anatomy [PULLED]; hero-per-round [PULLED,
heroPlayedThisRound gate L1068 - Amendment A1]. Rarity named
only as "Common through Mythic."

## PAGE 6 - THE CARDS II: ASTRAS, MANTRAS, ARTIFACTS
BODY:
ASTRAS are the celestial weapons. Played from the hand, they
strike and are spent: damage a champion, sweep a field, break
a formation. Some seek a single target; the greatest scour the
whole board and ask no one's permission.

MANTRAS are the sacred words. Where Astras destroy, Mantras
transform: they revive the fallen, cleanse the poisoned,
strengthen the standing. What the churning takes, the sacred
word returns.

ARTIFACTS are the silent engines. An Artifact takes its seat
on your side and works without announcement - turn after turn,
quietly tipping the balance. One Artifact holds the seat at a
time: play another and the newcomer takes its place. At the
round's end, the seat is cleared.

The deadliest players do not ask what a card is. They ask when
it is worth a card. Every Astra fired, every Mantra spoken, is
a card that will not stand in a later round.

ART: three canonical masters in a row - one Astra (recommend
Brahmastra), one Mantra (Gayatri Mantra), one Artifact
(Tripura or Amrita Kalasha).
CITATIONS: type behaviors [PULLED at class level]; artifact
single-seat, replacement-discards, round-end clear [PULLED,
STEP-0 report L308/L1708-1710/L1897].

## PAGE 7 - THE DEVAS: DHARMA SHIELD
BODY:
The Devas endure. Their signature is the DHARMA SHIELD -
divine favor placed upon a chosen champion.

A shielded Unit cannot be targeted by single-target Astras at
all. The blade seeking your champion finds no champion to
seek. This is prevention, not absorption: the shield does not
break under a blow - the blow simply cannot be aimed.

But favor has limits, and the wise Deva knows all three:
- Weapons that scour the WHOLE field do not aim - they pierce.
- Poison ignores shields entirely. The serpents do not aim
  either.
- One shield stands at a time, unless relics extend the grace.
  And Brahmastra - the word of the Creator - overrides every
  shield and every immunity there is.

Play the Devas if you want to choose what survives - and make
your opponent pay full price to disagree.

ART: howto_bg_swarga backdrop + Deva hero master + Dharma
Kavacha master + Deva gold crest spot-icon (cropped from
howto_faction_select_crests).
CITATIONS: all claims [PULLED, FACTION_MECHANICS_v2 Devas].

## PAGE 8 - THE ASURAS: CHAOS SURGE
BODY:
The Asuras pay for power in risk. Their signature is CHAOS
SURGE - the storm their weapons carry.

When an Asura Astra resolves or a dark Mantra is spoken, the
storm blesses one of your Units with surging power. But the
storm chooses, not you. A random champion rises. Your battle
plan must be built to profit from luck you cannot aim.

And the storm compounds. Certain relics and weapons make the
surge strike twice - and their doublings multiply together.
An Asura board in full storm is the most explosive sight in
the game.

The counterplay is known to your enemies, so know it first:
negate the weapon at its source and some counters kill the
storm with it; survive the burst, and blessings scattered at
random undo themselves against a disciplined field.

Play the Asuras if you would rather ride lightning than aim
it.

ART: howto_bg_asura_storm backdrop + Ravana master +
Chandrahas or Vidyutastra master + Asura crimson crest
spot-icon.
CITATIONS: all claims [PULLED, FACTION_MECHANICS_v2 Asuras;
composition per R44; negation split per R37]. Untaught by
design: exact surge amounts.

## PAGE 9 - THE VANARAS: LEAP
BODY:
The Vanaras move as one host. Their signature is the LEAP - a
bond of devotion between two warriors.

Once each round, free of cost, a Vanara may LEAP TO MATCH an
ally: its power becomes equal to that ally's power, in that
moment. The small warrior beside the giant becomes a giant.
Leap costs you nothing - not your turn, not a card - and it
compounds with everything the Vanaras already do to swell one
another's strength.

The art of the Leap is sequencing: raise one champion high,
then mirror that height across the host. Certain legends
deepen the bond - some let the host leap twice in a round,
some reward every leap with growing strength for the faithful
who witness it.

Play the Vanaras if you believe an army's strength is its
devotion - measured by its greatest heart, not its weakest
hand.

ART: howto_bg_vanara_forest backdrop + Hanuman master +
Kishkindha-lineage master + Vanara green crest spot-icon.
LEAP LAW IN FORCE: no movement arrows, no jumping figures, no
crossing imagery anywhere on this page.
CITATIONS: all claims [PULLED, FACTION_MECHANICS_v2 Vanaras].
Named cards kept generic ("certain legends").

## PAGE 10 - THE NAGAS: VENOM
BODY:
The Nagas are patient. Their signature is VENOM - and venom
does not duel. It waits.

A Venom Token placed on an enemy drains one power at every
round's end - and the token REMAINS. It drains again the next
round, and the next, until the victim falls or the poison is
cleansed. Tokens stack: three tokens drain three, every
single round. A champion at zero power dies.

Venom answers what nothing else answers: it ignores Dharma
Shields completely, seeps past protection, and punishes long
rounds. Against the serpents, patience is your enemy's weapon
- a short battle starves a slow poison.

And a secret your enemies learned too late: even the Asuras
stole the serpents' poison. One dark weapon in their arsenal
sows venom across an entire field. The abyss collects from
every hand.

Play the Nagas if you would rather be inevitable than fast.

ART: howto_bg_patala backdrop + Takshaka master + venom-bearing
master (Karkotaka recommended) + Naga teal crest spot-icon.
CITATIONS: all claims [PULLED, FACTION_MECHANICS_v2 Nagas].
Untaught by design: Sarpa doubling, cleanse specifics, applier
roster.

## PAGE 11 - THE REALMS
BODY:
No two battles are fought on the same ground. Each match takes
place in one of seven REALMS of the mythic cosmos, chosen by
fate - and the realm bends the war beneath it.

The realm is shown at the table's edge. Read the sky before
you read your hand - the same deck fights differently under
different heavens.

THE SEVEN REALMS (sidebar, exact effects):
- SWARGA - All Heroes +1 power for the match.
- MRITYULOK - The mortal plane. No realm effect: only your
  play decides.
- PATALA - All Astra damage +1.
- GANDHARVA LOK - Both players draw 1 extra card at the start
  of Round 2.
- YAKSHA LOK - Artifacts cannot be destroyed.
- RISHI MANDALA - Each Mantra can be used twice; it returns to
  hand after its first cast.
- KALKI KSHETRA - The last card played each round gains +2
  power, if it is a Unit or Hero.

ART: realm-chip iconography strip from shipped UI assets + one
atmospheric backdrop (existing realm art preferred).
CITATIONS: full table [PULLED, STEP-0 report - REALMS L267,
REALM_INFO L268-276, selection L386, per-realm implementation
lines on record].

## PAGE 12 - YOUR DECK IS YOURS
BODY:
In Divya Yuddha, the cards you battle with are yours in the
fullest sense: each card is an NFT in your wallet. Not a
license. Not an entry in our database. Yours.

THE TORANA is the gateway - the access pass that opens the
platform. Through it, your collection, your battles, and the
marketplace.

THE WAVES. The card pool grows in waves - new legends, new
weapons, new words of power entering the war over time. Waves
are how the world expands and how supply enters the market:
finite, collectible, ownable.

THE MARKETPLACE. Because every card is yours, every card is
tradeable. Build the deck you believe in; trade what you have
outgrown; hunt the piece your strategy is missing. The
marketplace runs on DYCoin, the platform's native token.

What we sell is ownership. The battle itself is decided the
same way it has always been decided - by the player.

ART: TORANA Access Card master centerpiece + fanned hand of
wave-card masters.
CITATIONS: [RULED - WEB3_PRODUCT_v1 + N-series]. Untaught:
earnable-card mechanics, duplicate policy; no neutrality
guarantee (C1).

## PAGE 13 - THE STAKED TABLES
BODY:
When you are ready to play for stakes, the tables are waiting.

Multiplayer matches on the platform may carry a DYCoin stake.
Both players commit the stake; the winner takes the pot, with
a 5 percent rake to the platform treasury. Standard tables run
at 10, 50, 200, and 1000 DYC - and friend tables can be
arranged up to 10,000 DYC for those who want the war at its
fullest weight.

The rules of the table:
- Stakes are committed before the match and settled by the
  match result. The pot's history travels with it - winnings
  inherit their source.
- Staked play is between people. When no opponent is in queue,
  a House Player may take the seat - always labeled as the
  House, never disguised, staking like any opponent.
- Your winnings are yours to use across the platform.

Skill decides staked matches exactly as it decides free ones.
The table raises the stakes - never the odds.

ART: howto_board_clean derivative as the dress base + DYC
medallion at canvas stage.
CITATIONS: all numbers [RULED - TOKENOMICS_v2 human-tables
clause]; House disclosure [RULED - R-W7]. "Never the odds"
speaks to staked-match integrity (G1 difficulty-lock), not a
balance guarantee (C1-safe). Untaught: trial clause,
redemption desk.

## PAGE 14 - BACK COVER
BODY:
THE FIELD IS YOURS.
Learn the round economy. Choose your host. Own your deck.

Divya Yuddha - Battle of the Celestials.

[Site URL + document-family footer matching the tokenomics
master's back page.]

ART: back-cover canvas from the master dress, retitled.

## AMENDMENT RECORD
A1 (owner-ruled 2026-08-04, post-STEP-0-pull): hero-per-round
sentence added to Page 5 (engine-enforced, L1068); deck-size
sentence omitted (unenforced, deckbuilding deferred). Both
integrated above.
