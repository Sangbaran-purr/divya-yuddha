# CONTINUATION — 2026-09-24 (covers 2026-09-19 → 09-24)
## Divya Yuddha — the Astra shelf completed; Chaos Surge in the lab; the archive road rebuilt; five Hall faults fixed

**Read me first.** Six days, two repos, one engine that never moved (sha 3613706f… through every rung). Replaces the unwritten 09-19-night and 09-20 continuations.

## 1. WHERE EVERYTHING STANDS (2026-09-24)
### Game repo (divya-yuddha) — origin/main = `07c3530` — live game STAMP = `07c3530`
- `07c3530` EXPORT-9: Heroes sharp on desktop (ready-now-right-next; device rung at match start; phone cards to 100, rails 50/66)
- `47b05c2` EXPORT-8: premium effects reach the opponent (earliest prefetch both roads; staked opponent-faction pool; ready-anchored remote casts)
- `65b0a69` LAB-26: Chaos Surge (lab-only; **owner device verdict PENDING**, then export ruling)
- `8f723b2` EXPORT-7 Lanka Dahan · `5f347b6` LAB-25 · `f703d13` EXPORT-6 Vasuki Venom Strike · `961b66a` LAB-24
- Suites: scenario 50 · venom 38 · story 69 · **wire 81** · narrator 35 · logpanel 29 · **test_manifest 102** · **lab 790** (G1 anchored at 07c3530; R1 pins the VFX module at index.html:10657-11392 — lines added above it must net to zero) · invariants 40.9/59.1.
- X1 frozen set: **82 files, digest 61464fbc…** A7 ≈ 856 MB, ~168 MB margin.

### Site repo (divyayuddha.games) — origin/main = `a1005cf`
- `a1005cf` HALL-SYNC-5 (from 07c3530) · `9e0912a` MP-FIX-3A: the Hall tells the truth about stakes · `14d42c4` MP-FIX-2: the Hall steps back during a match · `fb1ddc7` HALL-SYNC-4 · `990eb9d` GATE-FIX-1b · `ed0fb91` stamp guard · `22cffe8` GATE-FIX-1 · `b92dd1a` HALL-SYNC-3 · `8a1d30d` HALL-SYNC-2
- Site suite **659 checks / 19 suites** (freedoor 57 · consoleroad 82 · hallframe 32 · hallstake 33). Stamps: admin.js s37 · hall.css h11 · hall.js h30. Approval-bot commits land on main between rungs — fetch and rebase, never force.

## 2. WHAT SHIPPED, FOR PLAYERS
- **Vasuki Venom Strike** (EXPORT-6) and **Lanka Dahan** (EXPORT-7, reshoot pair fire_v2 + gold_v3 after v1 and gold_v2 were rejected for red sticker contours) — the premium Astra shelf complete: 3 Mythic + 3 Legendary.
- **Multiplayer (EXPORT-8/9 + MP-FIX-2/3A):** effects now reach the OPPONENT's client (staked tables prefetch the opponent-faction pool @256 at match start, 4.4–7.1 MB once; desktop-class Retina chains a 512 pool after it; first cast 256, second 512); the Hall collapses its chrome while a match is live (board identical to solo; status strip a click-through overlay; chrome returns at outcome); the 900–1023 px band closed; phones: card cap 100 (width-aware), rails 50/66, three cards fit unscrolled on every phone row; stake messages tell the truth (no-POL-for-gas / genuine DYC shortage decoded via the OZ5 errors / unlanded approval / wrong network each get their own sentence; unread balance = "tap to retry", never "insufficient"; network guard before any cast; read failover publicnode→drpc; pre-flight liquid+fee line).
- **Owner console (GATE-FIX-1/1b):** keyed endpoint slot honored first; depth probe 1 block; adaptive width (floor 50, exact tiling); checkpointed scans; scaling deadline; truth line logged (URL redacted); a too-narrow keyed endpoint is skipped with a plain sentence and falls over to the public archive.

## 3. STANDING LAWS ADDED (recorded in docs/VFX_MANIFESTATION_v1.md amendments and the site docs)
- Two-moment cards split at the natural seam; payoff visuals gated on their TRUE beat; round-end payoffs only on the empowered event. Units law (heightFraction vs width) unambiguous. Core-body guard satisfied by geometry, never by feathering the body. E1 by sequencing first. Ready-anchored starts for no-impact plates (local EXPORT-6, remote EXPORT-8). Sticker-test packer gate >1.5. Seat identity from EVENTS, never lookups.
- **REMOTE-CAST PROOF LAW (09-23):** no VFX export is proven until a genuine remote cast is seen on the RECEIVING client, both roads, real browser; staked proofs on live bytes (never real DYC, never the owner's wallet); relay proofs on a DEV_ADDRESS_MODE server (which cannot open staked rooms — say so).
- **Rung law (EXPORT-9):** the pooled rung is the DEVICE rung (viewport+DPR), never a board card that isn't there; "ready now, right next" — draw what's ready, fetch what's wanted once; phones stay 256 (MINI_MAX × 2.1 × 2 ≤ 420 guarded).
- **Archive-road key-safety (09-23):** keyed RPC URL lives only in the console browser's dyadmin::config; never committed; one pinned read-only public reader (dashboard.js archiveReadRpc), set may never grow; URL never displayed.
- Cache-stamp law guarded by suites (admin.html I1/I2; mp/ in hallframe). Site suite counts trusted only when measured. Harness must DECLARE its chain (tests/lib.js) — a guard is never loosened to please a test.
- Measured truths: drpc free getLogs = 101 blocks (error text lies "10000"); no free public Polygon archive serves deep getLogs; Alchemy FREE = 10 blocks (PAYG lifts it); the $20 bundle pays 500 DYC and 0 POL.
- Ceremony: finishing an ordered shipment may be committed proactively, the PUSH always waits; bot commits → rebase, never force; kill a listener by pid, never a port's socket list.

## 4. OPEN / QUEUED
1. **Owner's own eyes:** a Bronze table from a POL-less wallet (expect the gas sentence); a free-table match with a friend (their Hero on your screen, the Hall falling away); the Chaos Surge device verdict → export ruling.
2. **Product decision:** how bundle buyers get their first POL (hint at purchase / POL in the bundle / gas sponsorship).
3. **Phone rung decision:** phones at 256 draw 1.5–1.6× upscale and the dead vertical band (~254 px @390×844) needs cards past the rung flip → a 512 phone pool with Save-Data awareness, or accept.
4. **Torana backfill:** drpc crawl (~3 h, checkpointed) or Alchemy PAYG; then FIND ELIGIBLE → RELEASE TORANA.
5. **GATE-FIX-2:** public site's first-visit break — STEP-0 the baked-checkpoint idea.
6. Console follow-ups: sibling panels' checkpoints; PROCESS CLAIM boundaries; runner fail-loud; ceremony-suite transient red; stale comment demo/index.html:134. Save-Data skip for the faction pool. Vasuki flood + a premium Astra on staked not yet cast live.
7. Someday: Sudarshana/Pashupatastra ending reshoots; 320 px rebuilds; Unit-actor cosmetics; premium Mantra/Artifact effects; sounds; Lanka rules-text vs code (+1 all vs Vanara); AI showcase over the rise; effects over a cleared row.

## 5. HOW WE WORK (unchanged)
Two-gate flow; STEP-0 before live code; mutants prove every check; commit word / push word separate; device verdicts on the live lab page; Kling intake by content; never spend the owner's funds or sign with his wallet for a proof.

*End of continuation. Six days; the engine never moved.*
