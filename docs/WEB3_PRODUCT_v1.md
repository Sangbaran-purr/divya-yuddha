# DIVYA YUDDHA — WEB3_PRODUCT_v1
# THE LANE-W AUTHORITY DOCUMENT. The fork's GDD_DELTAS: every
# LANE-W task, contract, and UI cites THIS doc; where it conflicts
# with HANDOVER_SCOPE_v1, NFT_PLAN_v1, or amendments A1/A2, this
# doc wins pending the partner-doc amendment pass (section 8).
# Rulings recorded 2026-07-24 (the START LANE-W date; handover
# clock runs to ~2026-11-24).
# LANE-M (the shipped game) is UNTOUCHED by everything below.

## 1. PRODUCT DEFINITION (C4 — RULED: COMPANION WEBSITE)
Divya Yuddha Web3 is a DEDICATED COMPANION WEBSITE. No app, no
store builds, no Apple/Google policy surface. The shipped game
remains free-to-play at its current home with its economy intact;
the companion is where ownership, trading, and staked multiplayer
live.
WALLET IS IDENTITY: connecting a wallet IS sign-in. The address
is the account. No email/password layer. (C3 partial closure: on
this surface the chain is not synced WITH an account system —
it IS the account system. The game's local-first dy_meta is not
touched, not migrated, not synced.)
FILE BOUNDARY (the old three-lanes-one-index.html collision):
DISSOLVED BY CONSTRUCTION. LANE-W never writes to the game's
index.html. Architecture (repo/hosting/stack) is the next ruling
(section 9 Q1); the boundary principle is already law.

## 2. THE ECONOMY RULINGS (R-W1..R-W7, owner-ruled 2026-07-24)
R-W1 — THE ACCESS NFT. One purchasable NFT grants the four
factions and all 88 launch cards on the companion surface. The
free game remains free; the Access NFT sells OWNERSHIP of the
base collection, not entry to the game.
R-W2 — ALL WAVE CARDS ARE INDIVIDUAL NFTS. Every wave card
released from now on is an individually purchasable NFT. The
Ratna/Gupta split, the Ratna vault, and A2's Vault-storefront
framing are RETIRED on this surface. (LANE-M's shipped economy
keeps its own structures untouched.)
R-W3 — XP AND ADAPTIVE OPPONENTS. Players accrue XP through
play. XP feeds matchmaking and calibrates House Player
difficulty (see R-W7 guardrail G1 for the staked-match lock).
R-W4 — THE EARNABLE THREE. Per faction, per wave: exactly 3
cards are earnable through play as NFTs (free-to-play P2E path).
R-W5 — RARITY CEILING ON THE EARNABLE THREE. The earnable three
never include Hero, Legendary, or Mythic cards.
R-W6 — RANDOM PER-PLAYER ALLOCATION. Each player's earnable
three are randomly assigned to that player. Different players
chase and win different cards — every player's earnings are a
distinct market inventory, which is the marketplace's supply
engine. Earned-not-bought randomization: no money is paid for
the chance, so no loot-box shape exists.
OPEN DESIGN DETAIL (flagged, not blocking): DUPLICATE POLICY —
what happens when a player earns a card they also bought (or
buys one they later earn). The answer sets mint-supply rules;
rule it before the mint contract is specified.
R-W7 — STAKED MULTIPLAYER. Multiplayer matches carry DY Coin
stakes. Winner takes the pot; the platform takes a 5 percent
rake. Primary matchmaking is player-vs-player; when the queue
is empty, a HOUSE PLAYER fills the seat:
- DISCLOSED: labeled "House Player" — never disguised as human.
- The House Player stakes like any opponent.
- ADAPTIVE between matches per the player's XP.
- TRIAL CLAUSE (owner-ruled): the House Player ships as a
  ONE-MONTH TRIAL; if found unsuitable it is removed.
GUARDRAILS (standing unless owner strikes them):
G1 — DIFFICULTY LOCKS AT MATCH START. Set from player XP when
  the staked match begins; never moves mid-match. The house
  never tunes against live money.
G2 — THE TRIAL IS MEASURED, NOT FELT. Telemetry from day one:
  House Player win-rate at matched difficulty (fail threshold:
  sustained drift meaningfully above 50 percent), pot flow
  to and from the house seat, post-loss churn vs
  post-loss-to-human churn, queue-fill rate actually
  attributable to it. "Not suitable" is defined by these
  numbers before launch, not after.

## 3. THE NEUTRALITY AMENDMENT (C1 closure — RULED)
THE OLD LAW: "money buys ownership, never win-rate" (encoded in
LANE-W's original authority docs) and LANE-M's "money buys time,
never permanence; never bridge coins-Amsha."
THE RULING: LANE-M's law stands UNTOUCHED inside the shipped
game. On the companion surface, strict balance-neutrality is
RETIRED as a guarantee: wave cards are not deliberately designed
stronger, but organically stronger cards will NOT be withheld
or nerfed for neutrality's sake. Power emerges; commerce
follows.
CONSEQUENCE (must-do): the partner-facing docs promise
neutrality. Section 8's amendment pass rewrites that clause so
the partner holds the promise actually being made: "no
deliberate pay-for-power design; no neutrality guarantee."
HISTORY IN VIEW (C7 discharge): Web3 was once abandoned FOR the
clean F2P model. Tonight's rulings reverse that knowingly, in
daylight, with the old rationale on the record. The free game
remains the clean game; the reversal lives on its own surface.

## 4. THE NFT SET (C2 closure)
The NFT set = THE ACCESS NFT + EVERY WAVE CARD (purchasable) +
THE EARNABLE THREE per faction per wave (play-acquired, fully
tradeable). Launch-88 cards are collectively represented by the
Access NFT, not individually minted. Nothing else is an NFT
(no cosmetic class exists yet; adding one later is a new
ruling). G11's testnet gate ("a wave card lists, transfers,
splits, updates both collections") remains the acceptance shape.

## 5. MARKETPLACE (A1's D10, carried forward intact)
Fixed-price P2P only. Escrow-listing contract: list, then lock,
then buy, then auto-split (seller / royalty / rake); delist
anytime pre-sale. Priced in the deal token. FENCED OUT
(unchanged): auctions, offers, bundles, external marketplaces,
off-chain order books. UI reuses the collection-grid pattern
with price chip + BUY/LIST/DELIST.

## 6. LEGAL POSTURE (recorded, not litigated here)
India's PROG Act 2025 + Online Gaming Rules 2026 (in force
2026-05-01) ban online money games — skill or chance — with
criminal penalties, and prohibit facilitation; classification
factors include stakes and monetised in-game assets. OWNER
RULING ON RECORD: corporate structure exists; owner's counsel
has cleared the owner's position; the build hold on staking is
LIFTED on that confirmation. STANDING REQUEST (non-blocking):
the structural summary (operating entity, geo-fence list,
jurisdiction posture) lands in the handover doc, because the
contracts must ENCODE parts of it (geo-gating, jurisdiction
flags, treasury addresses) as build inputs.

## 7. WHAT DOES NOT EXIST HERE (fences)
- No changes of any kind to the shipped game: economy, engine,
  UI, index.html — all LANE-M, all frozen from this lane.
- No coins-to-Amsha bridge anywhere; the companion's DY Coin
  and the game's currencies never touch.
- No auctions, offers, or bundles (D10 fence).
- No undisclosed bots, ever, anywhere.
- No staking against mid-match-tunable opponents (G1).
- No store builds, no app wrappers, for this product.

## 8. THE PARTNER-DOC AMENDMENT PASS (owed next)
One amendment doc (A3) updating: HANDOVER_SCOPE_v1 (neutrality
clause rewrite per section 3; schedule re-anchor to the
2026-07-24 clock per C6), NFT_PLAN_v1 (the section 4 NFT set
replaces prior set language; Access-NFT model added), A2
(Vault-storefront framing retired per R-W2). A3 is authored by
Claude, ruled by owner, then goes to the partner.

## 9. OPEN QUESTIONS (the build gates on these, in order)
Q1 ARCHITECTURE: separate repo (recommended) vs a web3
   directory; hosting (Pages vs partner infra); frontend stack;
   chain + wallet standard confirmation from the partner's
   preference in HANDOVER_SCOPE. One session.
Q2 C5 GATE ARCHITECTURE: the chain analog of the parity
   ceremony — contract test discipline, testnet rehearsal
   protocol, audit posture. Designed before any Solidity.
Q3 DUPLICATE POLICY (R-W6 flag).
Q4 C6 SCHEDULE: re-sequence the week-numbered handover plan
   against the 2026-07-24 clock; LANE-M's parked queue shares
   owner-time and needs its ration stated.
