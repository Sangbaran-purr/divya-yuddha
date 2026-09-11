# BATTLE_WIRE_DESIGN_v1 - The real battle screen plays the wire
# Status: SEALED - owner "Ok" 2026-09-11; §9 N1-N6 ruled as
# proposed. Build authority for the BW rung series. AMENDMENTS
# 2026-09-11a (BW1 STEP-0 corrections), 2026-09-11b (BW1 build
# shapes), 2026-09-11c (wire:reject) and 2026-09-11d (BW3b staked
# shapes, the wall, W3-VIEW-2 ordering) recorded in §10. Authority above this doc:
# MULTIPLAYER_DESIGN.md v1.1 (the covenant, A1-A8, THE WALL) and
# LOBBY_DESIGN.md v1.1 (§11 ruled copy, §13 L3 "the real battle
# screen"). Source of facts: G-BATTLE-WIRE-SURVEY-1 (2026-09-11,
# read-only, all three repos). Amendments dated, never silent.

=====================================================
## 0. WHAT THIS IS
=====================================================
Today a multiplayer match plays in the Hall's thin text client:
correct, proven, zero-leak, undressed. This doc makes the GAME'S
OWN BATTLE SCREEN (T42 dress, board, cards, choreography,
overlays) the place a wire match is played - for both humans, on
both roads (FREE and STAKED) - while money, sessions and
settlement stay exactly where they are: in the Hall.

Nothing in this doc is a new room. The battle screen exists. The
engine exists (sacred). The wire protocol exists. The redacted
view exists. The sessions exist. This is plumbing between
finished rooms, ruled and gated like everything else.

=====================================================
## 1. FOUNDING RULINGS (proposed; owner confirms in §9)
=====================================================
F1 THE SHAPE IS (c): THE GAME EMBEDDED IN THE HALL. The Hall
   keeps the socket, the session, the wallet, the escrow acts
   and the settlement. The game runs in a same-origin iframe
   inside the Hall page (the demo's proven pattern: pass seeded
   in the parent, then the frame loads) and gains exactly one
   new thing - a postMessage BRIDGE that receives a match and
   sends acts. THE WALL HOLDS BY CONSTRUCTION: the game never
   opens a socket, never sees a wallet, never reads the chain.
   The G-MENU counters (WebSocket 0 · match-server 0 · ethers 0)
   are asserted on every BW rung.
   Rejected: (a) lifting the screen out of the single-file game
   (a fork by another name); (b) the game page owning a socket
   and a signature (redraws the wall - not ruled, not wanted).

F2 FREE FIRST, STAKED SECOND. On the FREE road the game is the
   engine's home already: seed + relayed moves through the
   existing runAction give the full T42 choreography for free.
   STAKED needs a view-driven render path AND a server-side
   events field; it ships as its own rung, and until then a
   STAKED match keeps playing in the Hall's thin client (never a
   half-dressed staked screen that jumps state to state).

F3 THE SEAT IS A PARAMETER. The battle screen assumes the human
   is seat 0 in ~125 places (95 literal seat sites + 25 screen-
   half picks for Astra/sweep landing + ~7 absolute-seat data
   reads; amendment 2026-09-11a). A joiner sits in seat 1. BW1 replaces
   every hard-coded 0/1 with ME/OPP resolved at match start.
   This is the single largest cost in the project and the first
   thing built, because every later rung stands on it. Engine 0
   lines - this is UI-side seat resolution only. THE RESOLVER LAW:
   absolute seats stay absolute in every piece of data (engine
   state, G.events, roundHistory, ownerPiOfUid); ME/OPP resolve
   only where something is DRAWN (halfSel, the aliases, the
   round banner, snapTo totals). Named exceptions stay literal:
   the for-both-seats iterations, src/chapters.js's story
   predicates (story's player is seat 0 by construction), and
   the engine block.

F4 ONE MOVE FORMAT ON THE WIRE - the server's ({type, indices...}
   as match.js validates). The M-P2 wrapper (DYWrapper, uid-based
   moves) is NOT on the live path and is not brought onto it;
   BW1 records it as the M-P2 proof artifact it is. Two formats
   is how a desync is born.

F5 ZERO-LEAK EXTENDS TO THE BRIDGE. Whatever crosses postMessage
   is audited the way seat B's socket frames are audited today:
   on STAKED the frame receives the redacted view and the events
   the server chooses to send - never a seed, never the raw log,
   never the opponent's hand. The redactedrehearsal audit gains
   the bridge as a second surface.

F6 REWARDS STAY OFF THE WIRE. showGameOver's recordMatchResult
   (XP, coins, Amsha, Sadhana, quests) does NOT fire for a wire
   match - Story already skips these hooks; the wire entry does
   the same. Multiplayer rewards are season territory, ruled
   separately, never granted by accident.

=====================================================
## 2. THE BRIDGE (the only new protocol; parent <-> frame)
=====================================================
As built (FREE road 11b; STAKED road 11d).
Parent (Hall) -> frame (game):
  wire:start  { matchId, seat, seed, p0Faction, p1Faction }  FREE
              { matchId, seat, view, p0Faction, p1Faction }  STAKED
              — exactly one of seed / view; a message carrying
              both or neither is refused loudly. No names: the
              server's names are wallet short forms and no address
              enters the frame (F1's wall); the frame labels seats
              "You" / "Opponent". A staked resync / re-seat
              re-posts wire:start with the resync view (events: []).
  wire:move   { matchId, seq, move } — FREE only; move is the
              server's relayed descriptor and carries seat (F4).
  wire:view   { matchId, seq, view } — STAKED only; the redacted
              view for this seat after one applied move (own,
              opponent's, or the clock's), the events INSIDE
              view.events. seq is numbered by the Hall, monotonic.
              The final view (over: true) precedes wire:result.
              THE WALL: the Hall strips view.myName / view.oppName
              before posting; the frame refuses loudly any view
              that still carries either key.
  wire:result { matchId, winner, roundWins, forfeit } — a draw
              is winner: null.
  wire:reject { matchId, reason } — sent only for the frame's
              OWN refused act; the frame's board is untouched
              (nothing was applied) and the act may be sent again.
  (wire:clock / wire:vanish / wire:returned are reserved words;
  shapes ruled when built.)
Frame -> parent:
  wire:ready  {}            wire:act { matchId, action }
  wire:leave  { matchId }
LAWS: wire:start establishes the matchId; every message after
it carries the matchId; seq rides the ORDERED stream only
(wire:move on FREE, wire:view on STAKED; never both in one
match) and is monotonic; out-of-order, foreign-match and
wrong-origin messages are refused loudly; no message ever
carries a key, address, stake or escrow id.

=====================================================
## 3. THE FREE ROAD IN THE REAL SCREEN (BW1)
=====================================================
- New game entry beside startGame/startStoryChapter:
  startWireMatch(bridge). It builds G = newGame({... rng:
  seeded(seed)}) exactly as the mirror does today, opens the
  mulligan for ME, and routes:
    own acts   -> wire:act ONLY (no local apply); the tap's
                  fly-from origin is held until the relay lands
    ALL acts   -> on wire:move (own moves included, in seq
                  order), runAction(() => applyRelayed(move),
                  {actor: move.seat}) at the pump seam where
                  aiTakeTurn lives today — the absolute seat;
                  runAction compares against OPP per F3's
                  resolver law (the old "1 = opponent"
                  convention is retired). THE LOCKSTEP LAW:
                  the server relays every applied move to both
                  seats, can reject, and can move for a seat on
                  the clock - so nothing is applied that did not
                  come back over the wire (the thin client's own
                  law, matchclient.js:384-386).
- aiThinkTime() is AI-only; for the wire the wait is the real
  network time under the thinking clock (wire:clock).
- The pump's AI branch is bypassed entirely under the wire; no
  AI function is ever called for a wire seat (asserted).
- Both humans see the full choreography because both engines
  produce the events locally, in lockstep - exactly the mirror
  law already proven on the thin client.
- THE MIRROR IS BUILT WITH THE SERVER'S EXACT newGame ARGUMENTS
  (match.js:19-23): p0/p1/factions/rng: seeded(seed) - NO
  manualShield (the engine auto-shields when false; the server
  and thin client never set it), NO wave deck (server is launch-
  pool only), NO difficulty. Any extra argument is a drift trap.
- seeded() is the server's PRNG (rng.js:7); the game gains a
  byte-identical copy pinned by a parity test over N seeds (it
  is the third copy; the pin is what keeps three from drifting).
- The frame is entered by ?wire=1: boot skips the intro and the
  landing, waits, posts wire:ready; opened outside the Hall it
  waits and does nothing.

=====================================================
## 4. THE BRIDGES (BW2) - the L3 strips around the frame
=====================================================
The Hall draws, above/around the frame, what it draws today:
the matched moment, the thinking-clock strip from server
deadlines, the vanish chrome ("opponent reconnecting... 90s")
and the resume state, and the dressed settlement strip on exit
(WON / DRAW / FORFEIT, every variant with the 24h line; FREE =
the one-line result). §11 ruled copy unchanged byte for byte.
The frame's own result face is decorative; the Hall's strip is
the truth and the only cast.

=====================================================
## 5. THE STAKED ROAD IN THE REAL SCREEN (BW3)
=====================================================
Server (web3) half - additive fields on the redacted view, each
audited for leakage before it ships:
  events (the per-action event list the choreography replays;
  survey verified no engine event names a hidden card), realm,
  shielded uids, ghost cells, artifact slot, round totals /
  roundHistory, mulliganCount, own-hand uid + card data by id.
  NEVER: the raw log (Tara's line names a card entering the
  caster's hand), the seed, the opponent's hand, deck order.
  The client builds its own log line from events.
Game half - the view-render path: the ~30 engine QUERY sites
(effPower, totalPower, isShielded, playableIndices, canLeap,
targetSpec, adjacentUnits, shieldCap) read from the view; the
choreography replays view.events instead of G.events; the ~58
G.players reads resolve through a view-shaped adapter that
presents the same fields the renderer already reads. Engine 0
lines. The frame never holds a G it could cheat with.

=====================================================
## 6. THE TWO SIDE GAPS (own tasks, any order)
=====================================================
X1 R20 UNBIND has no wire word: no wire match, in any client,
   can unbind today. A server action {type:"unbind", unitIndex}
   validated like shield; the thin client and the frame both
   gain it. (web3 + site)
X2 WAVE-1 CARDS cannot appear in a wire match: the server's
   newGame takes no deck/wave1 options. Rule the wire deck law
   (base decks only for now, or wave-1 by owner word) before
   the tables open wide. (web3)
Also noted: the thin client never sends position/movePosition,
so Vanara placement and Riksha's move are unreachable on the
wire today - BW1 sends them from the real screen; the thin
client is fixed in passing or retired for play (see §9 N4).

=====================================================
## 7. GATES (every BW rung)
=====================================================
G1 Engine 0 lines; the site copy's pin unchanged; the game
   repo's wall counters (WebSocket / match-server / ethers /
   window.ethereum) 0 -> 0 before and after.
G2 The bridge audit: every message the frame RECEIVES on STAKED
   logged and grepped against seat A's hidden identities and
   the seed - zero (the redactedrehearsal law, second surface).
G3 The seat law: the same match replayed with ME=0 and ME=1
   renders correctly on both sides (board orientation, hands,
   clocks, result). No hard-coded seat survives (grep-pinned).
G4 Full match through REAL BUTTONS in the frame, both roads
   when each lands: coin/mulligan -> play -> target -> astra ->
   pass -> round transition -> pips -> result; both outcomes.
G5 The L4 walk: the owner's two phones, a free match and a
   staked match in the real screen, a vanish + return, every
   settlement variant.
G6 The sync carries the wire-capable game to the site without
   touching mp/; the demo stays dimmed (dyw_demo); the sync's
   count assertions hold or are re-ruled loudly.

=====================================================
## 8. THE RUNG MAP
=====================================================
BW0  THIS DOC ruled; the §9 inputs answered.
BW1  FREE IN THE REAL SCREEN (game + site): ME/OPP (F3), the
     wire entry, the bridge, the Hall's iframe host. Proof: two
     Hall tabs, one free table, a match played to a result in
     the game's screen (freedoor.js extended). Rewards off (F6).
BW2  THE BRIDGES AROUND THE FRAME (site): clock, vanish, matched
     moment, settlement strip above the frame. Proof: every
     strip variant exercised on the free road.
BW3a THE VIEW GROWS (web3): the §5 fields, each leak-audited.
BW3b STAKED IN THE REAL SCREEN (game + site): the view-render
     path; the thin client retires for play (N4). Proof: a
     staked anvil match played entirely in the real screen; the
     bridge audit zero.
BW4  THE L4 WALK (owner). Then the thin client's fate is sealed.
X1/X2 slot wherever the owner rules; X2 before the tables open
wide.

=====================================================
## 9. OPEN INPUTS (rule before BW1)
=====================================================
N1  Confirm F1-F6. (Any "no" reshapes the map.)
N2  Orientation for seat 1: does the joiner see the board
    flipped (their field at the bottom, as the AI game shows
    the human) - proposed YES, the screen is always "me below".
N3  The frame's own result face: keep the game's result screen
    inside the frame (without rewards) under the Hall's strip -
    proposed YES, minus the MAIN MENU button (the Hall owns
    the exit).
N4  The thin client after BW3: retire it for play (the Hall's
    text battle becomes unreachable; wire.html stays the dark
    rig) - proposed YES, once BW3's staked proof and the L4
    walk are sealed; never before.
N5  Wire deck law (X2): base decks only until ruled otherwise -
    proposed YES.
N6  Whether wire matches ever grant rewards (F6 says not now).

=====================================================
## 10. AMENDMENTS
=====================================================
2026-09-11a (BW1 STEP-0, owner-ruled): §3's act order corrected
to send-then-apply-on-relay (the lockstep law); the mirror is
built with the server's exact newGame arguments (no manualShield,
no wave deck, no difficulty); seeded() parity-pinned as a third
copy; the frame entered by ?wire=1; F3's surface re-measured at
~125 with the resolver law stated. Meaning of F1-F6 and N1-N6
unchanged.
2026-09-11b (BW1 build, owner-ruled): §2 rewritten to the shapes
the BW1 proofs exercised; names removed from wire:start (wall);
seq scoped to the ordered stream; §3's actor expression corrected
to the absolute seat under the resolver law. F1-F6, N1-N6
unchanged.
2026-09-11c (S-HALL-WIRE-1 STEP-0, owner-ruled): §2 gains
wire:reject { matchId, reason }, parent -> frame, sent only for
the frame's own refused act. The frame has handled it since BW1
(proven in BW1 P2); the 11b shape list omitted it. F1-F6, N1-N6
unchanged.
2026-09-11d (BW3b game half, owner-ruled R1-R5): §2 gains the
STAKED shapes: wire:start { matchId, seat, view, p0Faction,
p1Faction } - exactly one of seed (free) or view (staked);
wire:view { matchId, seq, view } with the events inside
view.events and seq numbered by the Hall, monotonic; a staked
resync / re-seat re-posts wire:start with the resync view
(events: []). THE WALL: the Hall strips myName / oppName before
posting and the frame refuses loudly any view still carrying
either key (proven by mutation); the Hall's wall scan widens to
the short-form pattern 0x[0-9a-f]{4}…[0-9a-f]{4} in BW3b's site
tail - until then the 40-hex scan was blind to short forms.
The view adapter reads two additive server fields when present
and degrades only when absent: passed [b0, b1] (absolute seats)
and flags { "<uid>": { base, ward, asleep, stolenBy,
lockedRound } } covering both boards, both hero rows and the
viewer's own hand - all public board facts. THE ORDERING (R3):
the degradation is NOT shipped live - W3-VIEW-2 (web3, audited
like VIEW-1) ships passed + flags IMMEDIATELY after this rung and
BEFORE BW3b's site tail; the staked road enters the frame only
once the screen sees everything the text battle sees. Power
colour and the Venom Strike label may stay degraded (cosmetic;
recorded). The engine's eight query functions are read through
one facade (engine on free / vs-AI / story, view on staked; the
29 call sites pinned). §5's game half is built as stated; engine
0 lines. F1-F6, N1-N6 unchanged.
