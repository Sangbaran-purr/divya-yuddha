// Venom pipeline timing/stacking test suite — must pass before Naga card work (per roster order).
const E = require('./engine.js');
function seeded(s){ return ()=>{ s=(s*1664525+1013904223)>>>0; return s/4294967296; }; }
let P=0, F=0;
const ck = (n, cond)=>{ console.log((cond?'✓':'✗')+' '+n); cond?P++:F++; };

// Build a Naga-vs-X game; return {g, naga=p0}. Boards empty, turn to naga.
function game(oppFac, round=1){
  const g = E.newGame({ rng:seeded(7), p0:'N', p1:'X', p0Faction:'nagas', p1Faction:oppFac });
  g.players[0].hand=[]; g.players[1].hand=[]; g.round=round; g.turn=0; g.players[1].passed=false;
  return g;
}
function foe(g,id,pow){ const c={ id, n:id, t:'unit', p:pow, base:pow, power:pow, uid:Math.floor(Math.random()*1e9), ghost:false, venom:0, bound:false, stolenBy:-1 }; g.players[1].units.push(c); return c; }
function mine(g,id,pow){ const c={ id, n:id, t:'unit', p:pow, base:pow, power:pow, uid:Math.floor(Math.random()*1e9), ghost:false, venom:0, bound:false, stolenBy:-1 }; g.players[0].units.push(c); return c; }
function art(g,pi,id){ g.players[pi].artifact={ id, n:id, t:'artifact', p:0 }; }
function hero(g,pi,id){ g.players[pi].heroes.push({ id, n:id, t:'hero', p:8, power:8 }); }

// ---- ADDITIVE drain amount (R11 + Vasuki-R3 + Strike) ----
{ const g=game('devas',1); ck('base drain R1 = 1', E.drainAmount(g,0)===1); }
{ const g=game('devas',1); art(g,0,'patala'); ck('Patala R1 = 2', E.drainAmount(g,0)===2); }
{ const g=game('devas',2); art(g,0,'patala'); ck('Patala R2 = 3', E.drainAmount(g,0)===3); }
{ const g=game('devas',3); art(g,0,'patala'); ck('Patala R3 = 4', E.drainAmount(g,0)===4); }
{ const g=game('devas',3); hero(g,0,'vasuki'); ck('Vasuki R3 base = 2', E.drainAmount(g,0)===2); }
{ const g=game('devas',2); hero(g,0,'vasuki'); ck('Vasuki R2 base = 1 (R3 only)', E.drainAmount(g,0)===1); }
{ const g=game('devas',1); g.players[0].venomStrike=1; ck('Strike R1 no Vasuki = 3', E.drainAmount(g,0)===3); }
{ const g=game('devas',1); g.players[0].venomStrike=1; hero(g,0,'vasuki'); ck('Strike R1 + Vasuki = 4', E.drainAmount(g,0)===4); }
{ const g=game('devas',3); art(g,0,'patala'); hero(g,0,'vasuki'); g.players[0].venomStrike=3; ck('Patala R3 + Vasuki-R3 + Strike(w/Vasuki) = 4+1+3 = 8', E.drainAmount(g,0)===8); }

// ---- ROUND-END passive tick drains enemy units ----
{ const g=game('devas',1); const a=foe(g,'a',5), b=foe(g,'b',3); art(g,0,'patala');
  E.venomRoundEnd(g); ck('Round-end passive: Patala R1 drains all enemy −2', a.power===3 && b.power===1); }

// ---- KARKOTAKA (EXP-L2): a SINGLE flat −1 early tick, NOT per-turn, NOT a separate round-end drain ----
{ const g=game('devas',1); const a=foe(g,'a',5); mine(g,'karkotaka',6);
  E.venomRoundEnd(g); ck('Karkotaka L2: no separate round-end drain (early tick replaces it)', a.power===5);
  E.venomKarkotakaEarly(g); ck('Karkotaka L2: single early tick drains flat −1', a.power===4); }

// ---- PATALA does NOT escalate the Karkotaka early tick (modifiers ride only the round-end tick) ----
{ const g=game('devas',2); const a=foe(g,'a',9); mine(g,'karkotaka',6); art(g,0,'patala');
  E.venomKarkotakaEarly(g); ck('EXP-L2: Karkotaka early tick is flat −1 despite Patala', a.power===8); }

// ---- integration: pass() fires the early tick exactly once, on the FIRST pass ----
{ const g=game('devas',1); const a=foe(g,'a',5); mine(g,'karkotaka',6);
  g.players[0].hand=[]; g.players[1].hand=[]; g.players[0].passed=false; g.players[1].passed=false;
  E.pass(g,1); ck('Karkotaka L2: first pass triggers one early drain (−1)', a.power===4);
  E.pass(g,0); ck('Karkotaka L2: second pass (round end) does not double-drain', a.power===4); }

// ---- ASTIKA pause: skips the early tick / round-end passive ----
{ const g=game('devas',1); const a=foe(g,'a',5); mine(g,'karkotaka',6); g.players[1].astikaPause=true;
  E.venomKarkotakaEarly(g); ck('Astika pause: Karkotaka early tick skipped', a.power===5); }
{ const g=game('devas',1); const a=foe(g,'a',5); g.players[1].astikaPause=true;
  E.venomRoundEnd(g); ck('Astika pause: round-end passive skipped', a.power===5); }

// ---- TOKENS: drain bearer any side (R13), Signet negates, Sarpa doubles ----
// (neutral game: no faction passive so token drain is isolated)
function neutral(){ const g=E.newGame({rng:seeded(7),p0:'A',p1:'B',p0Faction:'devas',p1Faction:'devas'}); g.players[0].hand=[]; g.players[1].hand=[]; g.round=1; g.turn=0; g.players[1].passed=false; return g; }
{ const g=neutral(); const a=foe(g,'a',5); a.venom=2; E.venomRoundEnd(g); ck('Token drains bearer (−2)', a.power===3); }
{ const g=neutral(); const own=mine(g,'x',5); own.venom=1; E.venomRoundEnd(g); ck('R13: token drains OWN unit too', own.power===4); }
{ const g=neutral(); const a=foe(g,'a',5); a.venom=1; g.players[0].sarpaDouble=true; E.venomRoundEnd(g); ck('Sarpa Satra doubles token on foe (−2)', a.power===3); }
{ const g=neutral(); const a=foe(g,'a',3); a.venom=2; art(g,1,'ramasignet'); g.players[1].faction='vanaras';
  E.venomRoundEnd(g); ck('§9 (b) Rama’s Signet NEGATES Venom Tokens on friendly Vanara Units', a.power===3); }

// ---- §9 (a) SIGNET FLOOR (fidelity fix): the BASE passive drain still applies, grinding to 1 — NOT blanket immunity ----
{ const g=game('vanaras',1); const a=foe(g,'a',5); art(g,1,'ramasignet');   // p1 = Vanaras, foe of Naga p0
  E.venomRoundEnd(g); ck('Signet: passive drain APPLIES and floors (5 → 4, not negated)', a.power===4); }
{ const g=game('vanaras',1); const a=foe(g,'a',1); art(g,1,'ramasignet');
  E.venomRoundEnd(g); ck('Signet: passive drain cannot push a Vanara Unit below 1', a.power===1); }
{ const g=game('vanaras',3); const a=foe(g,'a',5); art(g,1,'ramasignet'); art(g,0,'patala');   // Naga Patala R3 = −4
  E.venomRoundEnd(g); ck('Signet: even escalated drain (−4) only grinds to 1, never destroys', a.power===1); }

// ---- ANANTA COIL board-tokens (persist, drain random enemy) ----
{ const g=neutral(); const a=foe(g,'a',5); g.players[0].boardTokens=2; E.venomRoundEnd(g); ck('Ananta: 2 board-tokens drain enemy −2 total', a.power===3); }

// ---- DEATH at 0 (R1) via venom ----
{ const g=game('devas',1); const a=foe(g,'a',2); art(g,0,'patala'); E.venomRoundEnd(g); ck('R1: venom to 0 destroys (Patala −2 kills a 2)', !g.players[1].units.includes(a)); }

// ---- PAVAMANA fidelity (GDD): (a) cleanse debuffs + tokens, (b) +1 power PER effect removed ----
function pavGame(){ const g=E.newGame({rng:seeded(7),p0Faction:'devas',p1Faction:'nagas'}); g.players[0].hand=[]; g.players[1].hand=[]; g.round=1; g.turn=0; g.players[0].passed=false; g.players[1].passed=false; return g; }
function dUnit(g,pow,base,ven){ const u={ id:'x',n:'X',sub:'',t:'unit',p:base,base,power:pow,uid:Math.floor(Math.random()*1e9),ghost:false,venom:ven,bound:false,stolenBy:-1,lockedRound:0,aegis:false,revivedShield:false,ward:false,asleep:false,doomed:false,revealPending:false,astraImmuneRound:0 }; g.players[0].units.push(u); return u; }
function castPav(g){ const pav={ id:'pavamana',n:'Pavamana',sub:'',t:'mantra',p:0,base:0,power:0,uid:Math.floor(Math.random()*1e9),ghost:false,lockedRound:0 }; g.players[0].hand.push(pav); E.playCard(g,0,g.players[0].hand.length-1); }
{ const g=pavGame(); const u=dUnit(g,5,5,3); castPav(g); ck('Pavamana (b): full-power Unit, 3 Venom Tokens cleansed → +3 (5→8), tokens gone', u.power===8 && u.venom===0); }
{ const g=pavGame(); const u=dUnit(g,3,5,2); castPav(g); ck('Pavamana: wounded (−2) + 2 tokens → healed to base then +1 per effect (1+2) = 8', u.power===8 && u.venom===0); }
{ const g=pavGame(); const u=dUnit(g,3,5,0); castPav(g); ck('Pavamana: wounded no-token → base+1 = 6 (v0.1 behaviour preserved)', u.power===6); }
{ const g=pavGame(); const u=dUnit(g,8,5,1); castPav(g); ck('Pavamana: buffed Unit (8>base 5) keeps its buff, +1 for the token → 9', u.power===9 && u.venom===0); }
{ const g=pavGame(); const u=dUnit(g,8,5,0); castPav(g); ck('Pavamana: clean/buffed Unit with nothing to cleanse is untouched (stays 8)', u.power===8); }

console.log('\n'+(F? `✗ ${F} VENOM TESTS FAILED (${P} passed)` : `✓ ALL ${P} VENOM TIMING TESTS PASS`));
process.exit(F?1:0);
