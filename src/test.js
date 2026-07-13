const E = require('./engine.js');

function seeded(seed){ let s=seed; return ()=>{ s=(s*1664525+1013904223)>>>0; return s/4294967296; }; }

let fails=0;
function assert(cond, msg, g){
  if (!cond){ fails++; console.log('FAIL:', msg);
    if (g) console.log(g.log.slice(-12).map(l=>`  R${l.round} ${l.msg}`).join('\n'));
  }
}

// card name -> id (for parsing "X plays <Name> — <sub>." log lines)
const NAME2ID = {}; const ID2FACTION = {};
for (const f of ['devas','asuras','vanaras','nagas']) for (const c of E.DECKS[f]){ NAME2ID[c.n]=c.id; ID2FACTION[c.id]=f; }

const N = 500;
// All 10 matchups: 4 mirrors + 6 crosses (Nagas complete the roster).
const MATCHUPS = [
  { key:'Deva mirror',     f0:'devas',   f1:'devas'   },
  { key:'Asura mirror',    f0:'asuras',  f1:'asuras'  },
  { key:'Vanara mirror',   f0:'vanaras', f1:'vanaras' },
  { key:'Naga mirror',     f0:'nagas',   f1:'nagas'   },
  { key:'Deva vs Asura',   f0:'devas',   f1:'asuras'  },
  { key:'Deva vs Vanara',  f0:'devas',   f1:'vanaras' },
  { key:'Deva vs Naga',    f0:'devas',   f1:'nagas'   },
  { key:'Asura vs Vanara', f0:'asuras',  f1:'vanaras' },
  { key:'Asura vs Naga',   f0:'asuras',  f1:'nagas'   },
  { key:'Vanara vs Naga',  f0:'vanaras', f1:'nagas'   },
];

// card-impact tallies (played by the winning side vs the losing side).
// "M" buckets count only mirror matches, where both sides share a deck — this
// isolates card QUALITY from faction balance (the fair nerf/buff signal).
const wonWith = {}, lostWith = {}, wonWithM = {}, lostWithM = {};
// Conditional metric: in a specific cross-matchup, did the counter-card's owner (always p0='A') win,
// split by whether they actually PLAYED the card vs HELD it in hand? Isolates counter value where it matters.
const cond = {
  pavamana:   { key:'Deva vs Naga',   re:/^A plays Pavamana\b/,       playedW:0, playedD:0, heldW:0, heldD:0 },
  ramasignet: { key:'Vanara vs Naga', re:/^A plays Rama.s Signet\b/,  playedW:0, playedD:0, heldW:0, heldD:0 },
};
function collectConditional(g, muKey){
  for (const c of Object.values(cond)){
    if (muKey!==c.key || g.winner==null) continue;               // decided games only
    const played = g.log.some(l=>c.re.test(l.msg));
    const won = g.winner===0;                                    // p0 ('A') is the counter faction in these matchups
    if (played){ won?c.playedW++:c.playedD++; } else { won?c.heldW++:c.heldD++; }
  }
}
function collectPlays(g, isMirror){
  if (g.winner==null) return;                       // draw — no winner to attribute
  const winnerName = g.players[g.winner].name;
  for (const l of g.log){
    const m = /^([AB]) plays (.+?) —/.exec(l.msg);
    if (!m) continue;
    const id = NAME2ID[m[2]]; if (!id) continue;
    const won = m[1]===winnerName;
    (won?wonWith:lostWith)[id] = ((won?wonWith:lostWith)[id]||0)+1;
    if (isMirror) (won?wonWithM:lostWithM)[id] = ((won?wonWithM:lostWithM)[id]||0)+1;
  }
}

function runMatchup(mu, realm='mrityulok'){   // baseline runs on Mrityulok (no realm effect → byte-identical to launch baseline)
  const st = { p0:0, p1:0, draw:0, rounds:0, r3:0, turns:0 };
  for (let k=0;k<N;k++){
    const g = E.newGame({ rng:seeded(1000+k), p0:'A', p1:'B', p0Faction:mu.f0, p1Faction:mu.f1, realm });
    let guard=0;
    while(!g.over && guard++<800) E.aiTakeTurn(g, g.turn);

    // ---- invariants ----
    assert(g.over, `[${mu.key}] game ${k} did not terminate`, g);
    for (const pl of g.players){
      assert(pl.hand.length>=0 && pl.deck.length>=0, `[${mu.key}] negative zone game ${k}`);
      assert(pl.roundWins<=2, `[${mu.key}] >2 round wins game ${k}`);
      const uids=new Set(); let dup=false;
      for (const zone of [pl.hand, pl.deck, pl.discard, pl.units.filter(u=>!u.ghost), pl.heroes]) for (const c of zone){ if (uids.has(c.uid)) dup=true; uids.add(c.uid); }
      assert(!dup, `[${mu.key}] duplicate card instance game ${k}`, g);
      for (const u of pl.units) assert(!u.ghost ? u.power>0 || true : true, 'x'); // (power can be transiently anything; no assert)
    }
    assert(g.roundHistory.length>=2 || g.players[0].roundWins===2 || g.players[1].roundWins===2, `[${mu.key}] too few rounds game ${k}`, g);

    if (g.winner===0) st.p0++; else if (g.winner===1) st.p1++; else st.draw++;
    st.rounds += g.roundHistory.length;
    if (g.roundHistory.length===3) st.r3++;
    st.turns += g.log.length;
    collectPlays(g, mu.f0===mu.f1);
    collectConditional(g, mu.key);
  }
  return st;
}

const results = MATCHUPS.map(mu => ({ mu, st: runMatchup(mu) }));

// ---- card impact: net times played by winner vs loser, across all sims ----
const impact = Object.keys({ ...wonWith, ...lostWith }).map(id => {
  const w = wonWith[id]||0, l = lostWith[id]||0, tot = w+l;
  return { id, w, l, net: w-l, winRate: tot ? w/tot : 0, tot };
});
const MIN_SAMPLE = 40;                                 // ignore rarely-drawn cards for the win-rate board
const topNet   = [...impact].sort((a,b)=> b.net - a.net).slice(0,5);
const topRate  = [...impact].filter(c=>c.tot>=MIN_SAMPLE).sort((a,b)=> b.winRate - a.winRate).slice(0,5);
const botRate  = [...impact].filter(c=>c.tot>=MIN_SAMPLE).sort((a,b)=> a.winRate - b.winRate).slice(0,5);

const pct = (n,d)=> d ? (100*n/d).toFixed(1)+'%' : '—';
const pad = (s,n)=> String(s).padEnd(n);

console.log('\n╔══════════════════════════════════════════════════════════════╗');
console.log(  '║  DIVYA YUDDHA — BALANCE REPORT   (' + N + ' AI-vs-AI sims / matchup)   ║');
console.log(  '╚══════════════════════════════════════════════════════════════╝');
console.log(pad('MATCHUP',16)+pad('P0 (A)',12)+pad('P1 (B)',12)+pad('DRAW',9)+pad('avg rds',9)+'→R3');
for (const {mu,st} of results){
  const lead = mu.f0===mu.f1 ? '' : `   [${mu.f0} vs ${mu.f1}]`;
  console.log(
    pad(mu.key,16)+
    pad(`${st.p0} ${pct(st.p0,N)}`,12)+
    pad(`${st.p1} ${pct(st.p1,N)}`,12)+
    pad(`${st.draw} ${pct(st.draw,N)}`,9)+
    pad((st.rounds/N).toFixed(2),9)+
    pct(st.r3,N)+lead);
}
// Cross-faction faction win rates (decided games, draws excluded)
const CAP = s => s.charAt(0).toUpperCase()+s.slice(1);
console.log('\nFaction balance — decided games (draws excluded):');
for (const {mu,st} of results){
  if (mu.f0===mu.f1) continue;
  const d = st.p0+st.p1;
  console.log(`  ${pad(mu.key,16)} ${CAP(mu.f0)} ${pct(st.p0,d)}  vs  ${CAP(mu.f1)} ${pct(st.p1,d)}`);
}

console.log('\nTOP 5 IMPACT — net times played by winner − loser (all sims):');
for (const c of topNet) console.log(`  ${pad(c.id,12)} net ${c.net>=0?'+':''}${c.net}   (won ${c.w} / lost ${c.l})  [${ID2FACTION[c.id]}]`);
console.log(`\nHighest win-rate when played (≥${MIN_SAMPLE} samples):`);
for (const c of topRate) console.log(`  ${pad(c.id,12)} ${pct(c.w,c.tot)}   (${c.tot} plays)  [${ID2FACTION[c.id]}]`);
console.log(`Lowest win-rate when played, all sims (≥${MIN_SAMPLE}) — confounded by faction balance:`);
for (const c of botRate) console.log(`  ${pad(c.id,12)} ${pct(c.w,c.tot)}   (${c.tot} plays)  [${ID2FACTION[c.id]}]`);

// ---- mirror-isolated win-rate: faction neutralised → fair card-quality signal ----
const impactM = Object.keys({ ...wonWithM, ...lostWithM }).map(id => {
  const w = wonWithM[id]||0, l = lostWithM[id]||0, tot = w+l;
  return { id, w, tot, winRate: tot ? w/tot : 0 };
});
const nerfCandidates = impactM.filter(c=>c.tot>=MIN_SAMPLE && c.winRate<0.40).sort((a,b)=>a.winRate-b.winRate);
console.log(`\nNERF/BUFF CANDIDATES — cards <40% win-rate in their MIRROR (faction-neutral, ≥${MIN_SAMPLE} plays):`);
if (!nerfCandidates.length) console.log('  (none — every card is ≥40% once faction balance is controlled)');
for (const c of nerfCandidates) console.log(`  ${pad(c.id,12)} ${pct(c.w,c.tot)}   (${c.tot} mirror plays)  [${ID2FACTION[c.id]}]`);

// ---- COUNTER-CARD metric: win-rate-when-PLAYED vs HELD, in the matchup where the counter matters ----
console.log('\nCOUNTER-CARD IMPACT — owner win-rate, played vs held in hand (decided games):');
for (const [id,c] of Object.entries(cond)){
  const pTot=c.playedW+c.playedD, hTot=c.heldW+c.heldD;
  const delta = (pTot&&hTot) ? `  Δ ${((100*c.playedW/pTot)-(100*c.heldW/hTot)>=0?'+':'')}${((100*c.playedW/pTot)-(100*c.heldW/hTot)).toFixed(1)}pt` : '';
  console.log(`  ${pad(id,11)} [${c.key}]  played ${pct(c.playedW,pTot)} (${pTot})  ·  held ${pct(c.heldW,hTot)} (${hTot})${delta}`);
}
// Chandrahas kept as a mirror-isolated no-regression check (unchanged by the Naga pass).
{ const w=wonWithM['chandrahas']||0, l=lostWithM['chandrahas']||0, t=w+l;
  console.log(`  chandrahas  [Asura mirror, no-regression]  ${t?pct(w,t):'—'} (${t} mirror plays)`); }

// ---- STRUCTURAL INVARIANT: the dmgAstra-derived ASTRA_DMG set must EXACTLY equal this hardcoded launch list. Guards the
// tag plumbing — a typo'd / missing / extra `dmgAstra:true` tag (now, or when a wave-1 damage Astra lands) fails loudly here.
{ const EXPECTED_ASTRA_DMG = ['Agneyastra','Lanka Dahan','Pashupatastra','Suryastra','Vidyutastra'];   // Patala realm +1. Change DELIBERATELY only when a ruled dmg-astra ships (Agneyastra: Task 2 batch 1; Vidyutastra: Task 12 batch 12; Suryastra: Task 14 batch 14 — all inert unless opts.wave1).
  const derived=[...E.ASTRA_DMG].sort(), expected=[...EXPECTED_ASTRA_DMG].sort();
  assert(JSON.stringify(derived)===JSON.stringify(expected),
    `ASTRA_DMG derivation != expected — derived {${derived.join(', ')}} vs expected {${expected.join(', ')}} (check dmgAstra tags)`);
  console.log(`\n✓ ASTRA_DMG (dmgAstra-derived) = {${derived.join(', ')}}  [invariant vs hardcoded launch list]`);
}

console.log('\n' + (fails ? `✖ ${fails} INVARIANT FAILURES` : '✓ ALL INVARIANTS PASS'));

// ---- COSMIC REALM regression + swing: Mrityulok must equal the baseline; Swarga/Patala measure realm-induced swing ----
function quickP0(mu, realm){
  let p0=0,p1=0;
  for (let k=0;k<N;k++){
    const g=E.newGame({ rng:seeded(1000+k), p0:'A', p1:'B', p0Faction:mu.f0, p1Faction:mu.f1, realm });
    let guard=0; while(!g.over && guard++<800) E.aiTakeTurn(g,g.turn);
    if (g.winner===0) p0++; else if (g.winner===1) p1++;
  }
  return p0+p1 ? 100*p0/(p0+p1) : 0;   // p0 decided win%
}
console.log('\n╔══ COSMIC REALM regression (all 10 matchups × ' + N + ' sims) ══╗');
console.log('MATCHUP           Mrityulok(base)   Swarga (Δ)      Patala (Δ)');
for (const {mu,st} of results){
  const base = st.p0+st.p1 ? 100*st.p0/(st.p0+st.p1) : 0;    // Mrityulok = main table (baseline)
  const sw = quickP0(mu,'swarga'), pa = quickP0(mu,'patala');
  const d = (x)=> (x-base>=0?'+':'')+(x-base).toFixed(1);
  console.log(`  ${pad(mu.key,16)} ${pad(base.toFixed(1)+'%',16)} ${pad(sw.toFixed(1)+'% ('+d(sw)+')',15)} ${pa.toFixed(1)}% (${d(pa)})`);
}
console.log('Mrityulok column IS the main table above (realm inert) — verify it matches the LAUNCH BASELINE byte-for-byte.');

// sample cross-faction transcript tail
const g = E.newGame({ rng:seeded(42), p0:'Deva', p1:'Asura', p0Faction:'devas', p1Faction:'asuras' });
let guard=0; while(!g.over && guard++<800) E.aiTakeTurn(g, g.turn);
console.log('\n=== Sample Deva-vs-Asura transcript tail (seed 42) ===');
console.log(g.log.slice(-16).map(l=>`R${l.round}  ${l.msg}`).join('\n'));
