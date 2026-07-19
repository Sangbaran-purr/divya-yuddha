# DIVYA YUDDHA — LANE-W
# NFT_PLAN_v1 — Card NFT Design: Collections, Supply, Mint, Market
# Status: AUTHORITY for D6 and D10 of HANDOVER_SCOPE_v1.
# Owner: Sangbaran. Author: Claude. Economics numbers: THEIRS.
# We define structure and law; they price it.

## 1. CANON MAPPING
The chain layer is a mirror of shipped canon, never a fork of it.
Schema v6 ownership map = the single read surface; wallet-held
NFTs are simply an alternate provider of that map (D6 adapter).
Engine (src/engine.js) remains sole authority for card facts;
NFT metadata mirrors engine identifiers (token stems derive from
def.n, same law as frame filenames). Card count at wave-1: 176
total = 88 launch + 88 wave (22 per faction: Naga, Deva, Asura,
Vanara; each 16 Gupta + 6 Ratna).

## 2. RULINGS (N-SERIES)
N-1 LAUNCH CLAIM SOULBOUND: the 88 launch cards are a free claim,
    one set per wallet, NON-TRANSFERABLE. Kills sybil farm-and-
    dump; marketplace trades wave cards only.
N-2 DIRECT MINT ONLY: fixed-price mint per card. No blind packs,
    no gacha, no randomized bundles, ever. (Gambling-adjacent
    mechanics are fenced out of this product permanently.)
N-3 STANDARD: ERC-1155. One token ID per card, quantity per
    holder. Singleton deck rule means one copy per player is
    sufficient for full play.
N-4 SUPPLY MODEL:
    GUPTA (16 per faction): OPEN EDITION while the wave season is
    live; mint closes permanently at season end. Time-scarcity;
    playability never gated during the season.
    RATNA (6 per faction): FIXED SUPPLY, capped at mint-out
    (cap number is theirs to set). True scarcity; premium tier.
    Defensible because Ratna balance audit proves approx. zero
    win-rate advantage: scarcity is prestige, never power.
N-5 BALANCE NEUTRALITY (the law investors quote): money buys
    ownership, never win-rate. One engine, one balance reality.
    No NFT carries any stat, odds, or matchmaking advantage.
    Any request to violate this is STOP-AND-REPORT to owner.

## 3. COLLECTIONS
C0 LAUNCH SET (88): soulbound free claim per wallet (N-1).
   Grants full baseline play incl. staked PvP entry.
C1 NAGA WAVE (22), C2 DEVA WAVE (22), C3 ASURA WAVE (22),
C4 VANARA WAVE (22): sellable collections per N-4 split.
   Release cadence (all at once vs staggered per faction) is a
   marketing decision: THEIRS, logged as amendment when set.
FUTURE: M5-style seasonal waves extend as C5+ under the same
   structure; this doc is the template.

## 4. PRICE LADDER (STRUCTURE OURS, NUMBERS THEIRS)
Relative ratios mirror the proven Amsha ladder so in-game and
on-chain economies rhyme without ever bridging (no-bridge law
holds absolutely: no path between Amsha/coins and token/NFTs).
  Common 1.0x | Uncommon 2.0x | Rare 4.0x | Epic 10.0x
  Legendary 25.0x | Mythic/Ratna 37.5x-plus (their premium call)
They set the base unit price in the deal token. All mint pricing
in token only (second demand source beyond match staking).

## 5. UTILITY
Ownership = playability in the Web3 client. Staked PvP decks may
include any owned card (claimed or minted). Practice mode (PvE,
token-free) uses the same owned pool. Deck rules identical to
main lane: best-of-3, singleton, faction-pure. No utility beyond
play + trade at v1 (staking-the-NFT, breeding, crafting: fenced
out; amendment territory).

## 6. SECONDARY MARKETPLACE (binds A1/D10)
Player-to-player, fixed price, in-game UI on the T39 collection
grid. Escrow-listing contract: list locks the NFT, buy transfers
and auto-splits seller / royalty / rake, delist anytime pre-sale.
Wave cards only (N-1 excludes launch set). Royalty and rake
percentages: THEIRS (S7 input). Fenced out: auctions, offers,
bundles, external marketplaces, off-chain order books.

## 7. ART AND METADATA
NFT art = the frame program masters (GPT master-template frames).
This binds the S5 deployment-scope decision: whatever S5 rules
for in-game display, the CHAIN destination for masters is now
ruled here. Metadata fields: name (def.n), faction, type, power,
rarity, epithet (def.sub live pull), flavor line, wave/season id.
Metadata text is pulled from the engine at mint-pipeline time,
never hand-copied (Indra's Net law applies on-chain too).

## 8. THEIR INPUTS (adds to HANDOVER_SCOPE_v1 S7)
Base unit price in token. Ratna supply caps. Season length /
mint-window dates. Faction release cadence. Royalty and rake
percentages on secondary sales. Collection branding names.

## 9. AMENDMENT LOG
(append below; never edit rulings in place)
