# DIVYA YUDDHA — LANE-W (THE SOVEREIGN BUILD)
# HANDOVER_SCOPE_v1 — Web3/P2E Version: Scope, Roadmap, Acceptance
# Status: AUTHORITY. Supersedes all chat discussion of the fork.
# Owner: Sangbaran. Author: Claude. Build: CC. 
# Clock: starts on owner's explicit "START LANE-W" — not before.
# Deadline: handover 4 months (16 weeks) from clock start.
# Lane rule: once started, LANE-W preempts ALL main-lane work.
# Until started: main lane (T42b, frames, queue) continues untouched.

## 1. WHAT THIS IS
A Web3 version of Divya Yuddha built for handover to the investor
team: PvP multiplayer with token staking (winner-take-all), NFT
card ownership, PvE practice (token-free), and house players for
queue backfill. We author, integrate, prove on testnet, hand over
source + docs. They deploy, operate, and own everything after the
handover gate. No written investor annex exists; THIS DOCUMENT'S
ACCEPTANCE GATES DEFINE "DONE." Owner hashes out investor
requirements against this doc as needed; changes land as numbered
amendments, never verbal scope.

## 2. SCOPE OF WORK (WE DELIVER)
D1  Match server: Node service wrapping the FROZEN engine
    (src/engine.js, zero changes, byte-identical law holds).
    Server-held state, action validation (illegal plays rejected
    server-side), server-seeded shuffle, deterministic replay log.
D2  Netcode + matchmaking: real-time PvP, rating-based matching,
    human-first queue, 30s timeout -> house player fires.
D3  House player system: 5-6 named personas, faction-flavored
    avatars from owned art, distinct ratings, real match
    histories. Disclosed as house players. Rating-matched
    difficulty. NEVER asserts humanity: no fake chat, no typing
    indicators, no human bios/photos, no fabricated presence.
D4  Web client: existing frontend (incl. T42 Kshetra) pointed at
    server matches. Two modes: PRACTICE (PvE vs AI, token-free)
    and STAKED (PvP, winner-take-all). Reuse, not rebuild.
D5  Token + escrow contracts (source code): standard ERC-20 +
    stake/settle contract consuming signed match results.
    Integrated end-to-end in the game; proven on a testnet.
D6  Ownership adapter: wallet-held NFTs feed the same schema-v6
    ownership map the collection screen already reads. Launch 88
    = free claim per wallet; wave 88 = mintable collections per
    NFT_PLAN_v1 (separate doc, queued).
D7  Result attestation: server signs match outcomes; settlement
    consumes signatures. Three stub interfaces total: auth
    (wallet-agnostic), ownership provider, attestation consumer.
D8  Docs: API reference, deploy guide, replay verification spec,
    house-player ops notes, contract deployment guide.
D9  Tests: full existing suite green + new server suite (match
    lifecycle, forfeit, crash, settlement paths).

## 3. OUT OF SCOPE (THEIRS — THE WALL)
Chain selection and deployment. Contract audit. Keys, custody,
treasury. Token economics/pricing/liquidity. NFT minting ops and
marketplace. House bankroll funding + persona wallet ops. Hosting
and server ops after handover. Compliance, legal, geo-fencing,
KYC. Marketing, branding of the P2E product (distinct SKU from
the store app). Any post-handover support beyond a single agreed
handover walkthrough. NOTHING on this list migrates to us without
a signed amendment.

## 4. W-SERIES RULINGS (FROZEN)
W-1 TOKEN: We author + integrate + testnet-prove token and escrow
    contracts; delivered as source. They deploy on their chain
    with their keys. Authorship ours, operation theirs.
W-2 HOUSE PLAYERS: As D3. Disclosed-as-house-players amendment
    ruled by owner. Humanity-assertion fence is part of the
    ruling. Real stakes from house treasury (theirs to fund).
    30s queue timeout.
W-3 DISCONNECT: 60s reconnect window, then forfeit; stake settles
    to opponent.
W-4 DOUBLE-CRASH: match unfinishable -> stake returned to both.
W-5 RECOVERY: server state authoritative; deterministic replay
    log adjudicates or resumes any disputed match.

## 5. ROADMAP (16 WEEKS FROM "START LANE-W")
P0  DONE AT CLOCK START: this doc + NFT_PLAN_v1 + W-rulings.
P1  Wk 1-4   Match server (D1) + server test suite. Gate G1-G2.
P2  Wk 5-7   Netcode + matchmaking + house players (D2, D3).
             Gate G3-G4.
P3  Wk 8-9   Web client modes: Practice + Staked (D4). Gate G5.
P4  Wk 10-12 Token + escrow contracts, integration, testnet
             loop stake->match->sign->settle (D5, D7). Gate G6-G7.
P5  Wk 13    Ownership adapter + free-claim/mint flows (D6).
             Gate G8.
P6  Wk 14    Docs + full test pass + acceptance run (D8, D9).
             Gate G9-G10.
BUF Wk 15-16 Buffer + investor walkthrough + HANDOVER GATE.

## 6. ACCEPTANCE GATES (DEFINE "DONE")
G1  Engine parity: flag-off output byte-identical; full suite
    green (scenario 50 / venom 38 / story 48).
G2  Server rejects a scripted illegal-move client in test.
G3  Two real browsers complete a full best-of-3 over the server.
G4  Empty queue 30s -> disclosed house player match completes at
    matched rating; persona never asserts humanity (checklist).
G5  Practice mode runs entirely token-free; Staked mode blocks
    entry without stake.
G6  Testnet: full loop — both stake, match runs, winner receives
    pot minus configured rake, on chain, no manual step.
G7  W-3/W-4 proven: forced disconnect forfeits at 60s and
    settles; forced double-crash returns both stakes.
G8  Fresh wallet claims launch 88 free; mints a wave card; both
    appear in collection via the standard ownership map.
G9  Their engineer (or owner as proxy) deploys from docs alone,
    zero calls to us.
G10 Handover package delivered: source, contracts, docs, test
    reports, walkthrough held. LANE-W CLOSES. Main lane resumes.

## 7. THEIR INPUTS WE WILL NEED (COLLECT EARLY, NOT AT WK 12)
Chain + wallet standard preference. P2E product name/branding.
Rake percentage (G6 config). Persona names sign-off. Treasury
wallet for testnet rehearsal. Each arrives via owner; logged as
amendments to this doc.
