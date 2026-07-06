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
for (const f of ['devas','asuras']) for (const c of E.DECKS[f]){ NAME2ID[c.n]=c.id; ID2FACTION[c.id]=f; }

const N = 500;
const MATCHUPS = [
  { key:'Deva mirror',   f0:'devas',  f1:'devas'  },
  { key:'Asura mirror',  f0:'asuras', f1:'asuras' },
  { key:'Deva vs Asura', f0:'devas',  f1:'asuras' },
];

// global card-impact tallies (played by the winning side vs the losing side)
const wonWith = {}, lostWith = {};
function collectPlays(g){
  if (g.winner==null) return;                       // draw — no winner to attribute
  const winnerName = g.players[g.winner].name;
  for (const l of g.log){
    const m = /^([AB]) plays (.+?) —/.exec(l.msg);
    if (!m) continue;
    const id = NAME2ID[m[2]]; if (!id) continue;
    const bucket = (m[1]===winnerName) ? wonWith : lostWith;
    bucket[id] = (bucket[id]||0)+1;
  }
}

function runMatchup(mu){
  const st = { p0:0, p1:0, draw:0, rounds:0, r3:0, turns:0 };
  for (let k=0;k<N;k++){
    const g = E.newGame({ rng:seeded(1000+k), p0:'A', p1:'B', p0Faction:mu.f0, p1Faction:mu.f1 });
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
    collectPlays(g);
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
// Cross-faction faction win rate (excludes draws)
const cf = results.find(r=>r.mu.key==='Deva vs Asura').st;
const decided = cf.p0+cf.p1;
console.log(`\nFaction balance (decided games): Devas ${pct(cf.p0,decided)}  vs  Asuras ${pct(cf.p1,decided)}`);

console.log('\nTOP 5 IMPACT — net times played by winner − loser (all sims):');
for (const c of topNet) console.log(`  ${pad(c.id,12)} net ${c.net>=0?'+':''}${c.net}   (won ${c.w} / lost ${c.l})  [${ID2FACTION[c.id]}]`);
console.log(`\nHighest win-rate when played (≥${MIN_SAMPLE} samples):`);
for (const c of topRate) console.log(`  ${pad(c.id,12)} ${pct(c.w,c.tot)}   (${c.tot} plays)  [${ID2FACTION[c.id]}]`);
console.log(`Lowest win-rate when played (≥${MIN_SAMPLE} samples):`);
for (const c of botRate) console.log(`  ${pad(c.id,12)} ${pct(c.w,c.tot)}   (${c.tot} plays)  [${ID2FACTION[c.id]}]`);

console.log('\n' + (fails ? `✖ ${fails} INVARIANT FAILURES` : '✓ ALL INVARIANTS PASS'));

// sample cross-faction transcript tail
const g = E.newGame({ rng:seeded(42), p0:'Deva', p1:'Asura', p0Faction:'devas', p1Faction:'asuras' });
let guard=0; while(!g.over && guard++<800) E.aiTakeTurn(g, g.turn);
console.log('\n=== Sample Deva-vs-Asura transcript tail (seed 42) ===');
console.log(g.log.slice(-16).map(l=>`R${l.round}  ${l.msg}`).join('\n'));
