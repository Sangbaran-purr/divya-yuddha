const E = require('./engine.js');

function seeded(seed){ let s=seed; return ()=>{ s=(s*1664525+1013904223)>>>0; return s/4294967296; }; }

let fails=0;
function assert(cond, msg, g){
  if (!cond){ fails++; console.log('FAIL:', msg);
    if (g) console.log(g.log.slice(-12).map(l=>`  R${l.round} ${l.msg}`).join('\n'));
  }
}

const stats = { p0:0, p1:0, draw:0, rounds:0, turns:0, r3:0 };
const N = 500;
for (let k=0;k<N;k++){
  const g = E.newGame({ rng:seeded(1000+k), p0:'A', p1:'B' });
  let guard=0;
  while(!g.over && guard++<500){
    E.aiTakeTurn(g, g.turn);
  }
  assert(g.over, `game ${k} did not terminate`, g);
  // invariants
  for (const pl of g.players){
    assert(pl.hand.length>=0 && pl.deck.length>=0, `negative zone game ${k}`);
    assert(pl.roundWins<=2, `>2 round wins game ${k}`);
    const uids=new Set(); let dup=false;
    for (const zone of [pl.hand, pl.deck, pl.discard, pl.units.filter(u=>!u.ghost), pl.heroes]) for (const c of zone){ if (uids.has(c.uid)) dup=true; uids.add(c.uid); }
    assert(!dup, `duplicate card instance game ${k}`, g);
  }
  assert(g.roundHistory.length>=2 || g.players[0].roundWins===2 || g.players[1].roundWins===2, `too few rounds game ${k}`, g);
  if (g.winner===0) stats.p0++; else if (g.winner===1) stats.p1++; else stats.draw++;
  stats.rounds += g.roundHistory.length;
  if (g.roundHistory.length===3) stats.r3++;
  stats.turns += g.log.length;
}

console.log(`\n=== ${N} AI-vs-AI simulations ===`);
console.log(`P0 wins: ${stats.p0}  P1 wins: ${stats.p1}  Draws: ${stats.draw}`);
console.log(`Avg rounds/match: ${(stats.rounds/N).toFixed(2)}   Matches going to Round 3: ${(100*stats.r3/N).toFixed(0)}%`);
console.log(`Avg log events/match: ${(stats.turns/N).toFixed(0)}`);
console.log(fails? `\n${fails} FAILURES` : '\nALL INVARIANTS PASS');

// one sample game transcript
const g = E.newGame({ rng:seeded(42), p0:'A', p1:'B' });
let guard=0; while(!g.over && guard++<500) E.aiTakeTurn(g, g.turn);
console.log('\n=== Sample match transcript (seed 42) ===');
console.log(g.log.map(l=>`R${l.round}  ${l.msg}`).join('\n'));
