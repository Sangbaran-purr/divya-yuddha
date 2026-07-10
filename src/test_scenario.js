// test_scenario.js — smoke tests for opts.scenario (Story Mode setup hooks).
// Proves: (a) each field works, (b) absent/empty scenario is a byte-identical no-op,
// (c) the event stream stays observational (rule #7). Run: node src/test_scenario.js
const E = require('./engine.js');
function seeded(seed){ let s=seed; return ()=>{ s=(s*1664525+1013904223)>>>0; return s/4294967296; }; }
let pass=0, fail=0;
function ok(name, cond){ if(cond) pass++; else { fail++; console.log('  ✗ '+name); } }
function eqJSON(name, a, b){ ok(name, JSON.stringify(a)===JSON.stringify(b)); if(JSON.stringify(a)!==JSON.stringify(b)) console.log('      a='+JSON.stringify(a)+'\n      b='+JSON.stringify(b)); }

const DECK12 = ['Indra','Surya Dev','Vajra','Brahmastra','Marut','Kubera','Gandharva','Agni','Varuna','Vayu','Yama','Saraswati'];
function playToEnd(opts){ const g=E.newGame(opts); let guard=0; while(!g.over && guard++<800) E.aiTakeTurn(g, g.turn); return g; }
function initSig(opts){ const g=E.newGame(opts); return { realm:g.realm, turn:g.turn, first:g.firstThisRound,
  p0deck:g.players[0].deck.map(c=>c.id), p0hand:g.players[0].hand.map(c=>c.id),
  p1deck:g.players[1].deck.map(c=>c.id), p1hand:g.players[1].hand.map(c=>c.id),
  winTarget:g.winTarget, drawCount:g.drawCount, mulliganCount:g.mulliganCount }; }
// NOTE: uid is a module-global counter, so absolute uids differ between sequential games. Normalize to first-seen
// ordinals so we compare event STRUCTURE (types/targets/amounts), not the arbitrary global uid offset.
function fullSig(g){ const m=new Map(); const nu=u=>{ if(u==null) return null; if(!m.has(u)) m.set(u,m.size); return m.get(u); };
  return { winner:g.winner, over:g.over, rounds:g.roundHistory,
  log:g.log.map(l=>l.msg),
  events:g.events.map(e=>[e.round,e.seq,e.type,nu(e.sourceUid),(e.targetUids||[]).map(nu),e.amount,e.abilityName,e.text]) }; }

/* ============================ (b) NO-OP PROOF ============================ */
console.log('(b) absent / empty / undefined scenario is a byte-identical no-op:');
const MUS = [['devas','asuras'],['nagas','vanaras'],['asuras','nagas'],['vanaras','devas']];
for (let k=0;k<8;k++){ const [f0,f1]=MUS[k%MUS.length];
  const base = { p0:'A', p1:'B', p0Faction:f0, p1Faction:f1 };
  // fresh seeded rng each construction so the ONLY variable is the scenario field
  const iAbsent = initSig({ ...base, rng:seeded(2000+k) });
  const iEmpty  = initSig({ ...base, rng:seeded(2000+k), scenario:{} });
  const iUndef  = initSig({ ...base, rng:seeded(2000+k), scenario:undefined });
  eqJSON(`init no-op seed ${2000+k} (${f0} vs ${f1}): empty === absent`, iEmpty, iAbsent);
  eqJSON(`init no-op seed ${2000+k}: undefined === absent`,             iUndef, iAbsent);
  // full game: every log line + every event + winner identical
  const fAbsent = fullSig(playToEnd({ ...base, rng:seeded(2000+k) }));
  const fEmpty  = fullSig(playToEnd({ ...base, rng:seeded(2000+k), scenario:{} }));
  eqJSON(`full-game no-op seed ${2000+k}: empty === absent`, fEmpty, fAbsent);
}
// the default knobs must materialise to today's hardcoded values
{ const s=initSig({ p0Faction:'devas', p1Faction:'devas', rng:seeded(7) });
  eqJSON('default winTarget=2 / drawCount=2 / mulliganCount=3', [s.winTarget,s.drawCount,s.mulliganCount], [2,2,3]); }
// DEFINITIVE: the g.rng draw SEQUENCE (every value drawn, whole match) is byte-identical absent vs empty
function rngTrace(scenario){ const base=seeded(3000); const trace=[]; const rng=()=>{ const v=base(); trace.push(+v.toFixed(12)); return v; };
  const g=E.newGame({ p0Faction:'devas', p1Faction:'nagas', rng, scenario }); let guard=0; while(!g.over&&guard++<800) E.aiTakeTurn(g,g.turn); return trace; }
{ const tAbsent=rngTrace(undefined), tEmpty=rngTrace({});
  ok(`g.rng draw sequence byte-identical: empty === absent (${tAbsent.length} draws)`, tAbsent.length===tEmpty.length);
  eqJSON('g.rng draw sequence values identical: empty === absent', tEmpty, tAbsent); }

/* ============================ (a) EACH FIELD ============================ */
console.log('(a) each opts.scenario field works:');
// p0Deck — ordered, NOT shuffled: hand+deck (draw order) === injected list
{ const g=E.newGame({ p0Faction:'devas', rng:seeded(11), scenario:{ p0Deck:DECK12 } });
  const drawOrder = g.players[0].hand.concat(g.players[0].deck).map(c=>c.n);
  eqJSON('p0Deck: injected order preserved (no shuffle)', drawOrder, DECK12);
  eqJSON('p0Deck: opening hand = first 10 by default', g.players[0].hand.map(c=>c.n), DECK12.slice(0,10));
  eqJSON('p0Deck: deck = remaining 2', g.players[0].deck.map(c=>c.n), DECK12.slice(10));
  ok('p0Deck: cards are fresh mkCard instances (unique uids)', new Set(g.players[0].hand.concat(g.players[0].deck).map(c=>c.uid)).size===12); }
// p0Hand — opening hand = named cards pulled from the deck
{ const g=E.newGame({ p0Faction:'devas', rng:seeded(12), scenario:{ p0Deck:DECK12, p0Hand:['Brahmastra','Vajra'] } });
  eqJSON('p0Hand: hand = exactly the named cards, in order', g.players[0].hand.map(c=>c.n), ['Brahmastra','Vajra']);
  ok('p0Hand: those cards removed from the deck', !g.players[0].deck.some(c=>c.n==='Brahmastra'||c.n==='Vajra'));
  eqJSON('p0Hand: deck = the other 10 in original order', g.players[0].deck.map(c=>c.n), DECK12.filter(n=>n!=='Brahmastra'&&n!=='Vajra')); }
// handSize — on the normal (shuffled) faction deck
{ const g=E.newGame({ p0Faction:'devas', p1Faction:'nagas', rng:seeded(13), scenario:{ handSize:5 } });
  ok('handSize:5 → both open with 5', g.players[0].hand.length===5 && g.players[1].hand.length===5); }
// p1Deck / p1Hand — symmetric wiring
{ const g=E.newGame({ p1Faction:'devas', rng:seeded(14), scenario:{ p1Deck:DECK12, p1Hand:['Yama'] } });
  eqJSON('p1Deck/p1Hand: opponent side wired', g.players[1].hand.map(c=>c.n), ['Yama']); }
// draws — between-round draw count (realm bonus still applies; use inert Mrityulok)
function drawGrowth(draws){ const g=E.newGame({ p0Faction:'devas', p1Faction:'devas', realm:'mrityulok', rng:seeded(15), scenario:draws==null?undefined:{draws} });
  const before=g.players[0].hand.length; E.pass(g,g.turn); if(!g.over) E.pass(g,g.turn);   // both pass → round 1 draws, advance to round 2
  return { grew:g.players[0].hand.length-before, round:g.round }; }
{ const d4=drawGrowth(4), d2=drawGrowth(null);
  ok('draws:4 → each draws 4 entering round 2', d4.round===2 && d4.grew===4);
  ok('draws default → each draws 2 (control)',  d2.round===2 && d2.grew===2); }
// winTarget — rounds needed to win the match
function decisiveRound1(scenario){ const g=E.newGame({ p0Faction:'devas', p1Faction:'devas', realm:'mrityulok', rng:seeded(16), scenario });
  let guard=0; while(!g.over && g.round===1 && guard++<60){ const pi=g.turn;
    if(pi===0 && !g.players[0].passed && !g.players[0].units.length){ const ui=g.players[0].hand.findIndex(c=>c.t==='unit'); if(ui>=0){ E.playCard(g,0,ui); continue; } }
    E.pass(g,pi); }
  return g; }   // p0 puts one Unit down, p1 never plays → p0 wins round 1 on board
{ const gW1=decisiveRound1({winTarget:1});
  ok('winTarget:1 → match over after a decided round 1', gW1.over===true && gW1.roundHistory.length===1 && gW1.winner===0);
  const gW2=decisiveRound1(undefined);
  ok('winTarget default(2) → NOT over after round 1 (control)', gW2.over===false && gW2.round===2 && gW2.roundHistory.length===1); }
// mulligan — 0 disables the phase
{ const g0=E.newGame({ p0Faction:'devas', rng:seeded(17), scenario:{mulligan:0} });
  const h0=g0.players[0].hand.map(c=>c.uid);
  const r0=E.mulligan(g0,0,[g0.players[0].hand[0].uid, g0.players[0].hand[1].uid]);
  ok('mulligan:0 → mulligan() is a no-op (returns [], hand unchanged)', r0.length===0 && JSON.stringify(g0.players[0].hand.map(c=>c.uid))===JSON.stringify(h0));
  ok('mulligan:0 → aiMulliganPlan returns []', E.aiMulliganPlan(g0,0).length===0);
  const g3=E.newGame({ p0Faction:'devas', rng:seeded(17) });   // default 3
  const r3=E.mulligan(g3,0,[g3.players[0].hand[0].uid]);
  ok('mulligan default → swaps normally (control)', r3.length===1); }

/* ==================== (c) EVENTS STAY OBSERVATIONAL ==================== */
console.log('(c) event stream is observational (rule #7):');
// draining g.events mid-game must not change the outcome; and rng-call-count must be identical whether or not events are consumed.
function playCounted(opts, drain){ let n=0; const rng0=seeded(99); const rng=()=>{ n++; return rng0(); };
  const g=E.newGame({ ...opts, rng }); let guard=0;
  while(!g.over && guard++<800){ E.aiTakeTurn(g, g.turn); if(drain) g.events.length=0; }
  return { rngCalls:n, winner:g.winner, log:g.log.map(l=>l.msg) }; }
{ const sc={ p0Deck:DECK12, p1Faction:'nagas' };   // exercise events under a scenario
  const kept    = playCounted({ p0Faction:'devas', p1Faction:'nagas', scenario:sc }, false);
  const drained = playCounted({ p0Faction:'devas', p1Faction:'nagas', scenario:sc }, true);
  eqJSON('draining g.events every action does NOT change the outcome (winner+log)', {w:drained.winner,l:drained.log}, {w:kept.winner,l:kept.log});
  ok('emit consumes no rng: identical rng-call-count with/without draining', kept.rngCalls===drained.rngCalls);
  // well-formed & deterministic: same seed twice → identical event stream
  const gA=E.newGame({ p0Faction:'devas', p1Faction:'nagas', rng:seeded(123), scenario:sc }); let ga=0; while(!gA.over&&ga++<800) E.aiTakeTurn(gA,gA.turn);
  const gB=E.newGame({ p0Faction:'devas', p1Faction:'nagas', rng:seeded(123), scenario:sc }); let gb=0; while(!gB.over&&gb++<800) E.aiTakeTurn(gB,gB.turn);
  eqJSON('event stream deterministic across identical seeds', fullSig(gA).events, fullSig(gB).events);
  ok('event seq is monotonic 0..n-1', gA.events.every((e,i)=>e.seq===i)); }

/* ============================ RESULT ============================ */
console.log(`\n${fail===0?'✓ ALL':'✗'} ${pass} SCENARIO CHECKS PASS${fail?`, ${fail} FAILED`:''}`);
process.exit(fail===0?0:1);
