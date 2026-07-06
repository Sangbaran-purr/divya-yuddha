/* ============================================================
   DIVYA YUDDHA — Rules Engine (Devas + Asuras)
   Headless, UI-agnostic. Runs in browser and Node.
   Canonical source; inlined into index.html by src/build.js.
   ============================================================ */
const RARITY_COLOR = { L:'#C9A84C', M:'#E74C3C', E:'#9B59B6', R:'#3498DB', U:'#27AE60', C:'#888888' };
const RARITY_NAME  = { L:'Legendary', M:'Mythic', E:'Epic', R:'Rare', U:'Uncommon', C:'Common' };

const DEVA_DECK_DEF = [
  // ---- HEROES (3) ----
  { id:'indra',   n:'Indra',          sub:'King of Devas',        t:'hero', p:7, r:'L', txt:'PASSIVE: All Deva Units gain +1 power while Indra is on the board.' },
  { id:'agni',    n:'Agni',           sub:'Flame of Sacrifice',   t:'hero', p:5, r:'E', txt:'TRIGGERED: Whenever any Mantra is played, deal 1 damage to a random enemy Unit.' },
  { id:'varuna',  n:'Varuna',         sub:'Lord of Oceans',       t:'hero', p:6, r:'E', txt:'PASSIVE: Opponent cannot play more than 1 Astra per round.' },
  // ---- UNITS (12) ----
  { id:'surya',   n:'Surya Dev',      sub:'Radiance of the Dawn', t:'unit', p:6, r:'E', txt:'ON PLAY: All other friendly Units gain +1 power.' },
  { id:'brihaspati',n:'Brihaspati',   sub:'Guru of the Gods',     t:'unit', p:5, r:'E', txt:'ON PLAY: Copy the effect of the last Mantra played by either player.' },
  { id:'vayu',    n:'Vayu',           sub:'The Invisible Force',  t:'unit', p:5, r:'R', txt:'ON PLAY: The highest power enemy Unit loses 2 power. (v0.1: swap omitted)' },
  { id:'vishwakarma',n:'Vishwakarma', sub:'Divine Architect',     t:'unit', p:4, r:'R', txt:'ON PLAY: Destroy the opponent\u2019s Artifact. Gain +2 power for each Artifact destroyed this game.' },
  { id:'kubera',  n:'Kubera',         sub:'Lord of Wealth',       t:'unit', p:3, r:'R', txt:'ON PLAY: Draw 2 cards. If both are Units they gain +1 power each.' },
  { id:'urvashi', n:'Urvashi',        sub:'The Eternal Apsara',   t:'unit', p:4, r:'R', txt:'ON PLAY: Opponent discards their highest power card from hand.' },
  { id:'yama',    n:'Yama',           sub:'Lord of Dharma',       t:'unit', p:6, r:'E', txt:'PASSIVE: Destroyed friendly Units leave a 1-power ghost token behind.' },
  { id:'saraswati',n:'Saraswati',     sub:'Voice of Creation',    t:'unit', p:4, r:'R', txt:'ON PLAY: Look at opponent\u2019s hand. Lock one card \u2014 it cannot be played this round.' },
  { id:'ashwini', n:'Ashwini Kumars', sub:'Twin Healers',         t:'unit', p:3, r:'U', txt:'ON PLAY: Restore 2 power to the most wounded friendly Unit.' },
  { id:'marut',   n:'Marut',          sub:'Storm Soldier',        t:'unit', p:3, r:'C', txt:'ON PLAY: If Vayu is on your board, gain +3 power.' },
  { id:'gandharva',n:'Gandharva',     sub:'Celestial Warrior',    t:'unit', p:2, r:'C', txt:'ON PLAY: If 3+ friendly Units are on the board, gain +2 power.' },
  { id:'soldier', n:'Deva Soldier',   sub:'Keeper of Order',      t:'unit', p:2, r:'C', txt:'PASSIVE: While Indra is on the board, gains +1 power at the start of each of your turns.' },
  // ---- ASTRAS (3) ----
  { id:'vajra',   n:'Vajra',          sub:'Thunderbolt of Indra', t:'astra', p:0, r:'L', txt:'Destroy one enemy Unit with power 6+. If Indra is on your board: destroy ANY enemy Unit.' },
  { id:'brahmastra',n:'Brahmastra',   sub:'The Ultimate Weapon',  t:'astra', p:0, r:'M', txt:'Destroy ALL enemy Units. Overrides all shields and immunities.' },
  { id:'sudarshana',n:'Sudarshana Chakra',sub:'Disc of Vishnu',   t:'astra', p:0, r:'M', txt:'Remove one enemy Hero for this round. It returns next round at half power.' },
  // ---- MANTRAS (2) ----
  { id:'gayatri', n:'Gayatri Mantra', sub:'Light of All Worlds',  t:'mantra', p:0, r:'R', txt:'Revive the lowest power friendly Unit from your discard pile at full power, with Dharma Shield.' },
  { id:'pavamana',n:'Pavamana',       sub:'The Purifying Chant',  t:'mantra', p:0, r:'U', txt:'Heal all wounded friendly Units to full. Each healed unit gains +1 power.' },
  // ---- ARTIFACTS (2) ----
  { id:'amrita',  n:'Amrita Kalasha', sub:'Vessel of Immortality',t:'artifact', p:0, r:'M', txt:'ON PLAY: Your lowest power Unit gains +2. If that unit is destroyed this round, it revives at 1 power (once).' },
  { id:'kavacha', n:'Dharma Kavacha', sub:'Shield of Sacred Law', t:'artifact', p:0, r:'R', txt:'PASSIVE: Dharma Shield protects TWO Units instead of one.' },
];

// Asura roster — docs/ASURA_ROSTER.md (GDD v2.0 §6). Mechanic: Chaos Surge (see chaosSurge()).
const ASURA_DECK_DEF = [
  // ---- HEROES (3) ----
  { id:'mahabali', n:'Mahabali',      sub:'The Eternal Emperor',  t:'hero', p:8, r:'L', txt:'PASSIVE: After you Pass voluntarily, the first Unit you play next round grants an immediate extra turn. Forced Pass (Tamasa) does not count.' },
  { id:'shukra',   n:'Shukracharya',  sub:'Master of Mritasanjivani', t:'hero', p:5, r:'E', txt:'ON PLAY: Once per game, revive a fallen friendly Unit from your discard at half its original power.' },
  { id:'rahu',     n:'Rahu',          sub:'The Shadow That Devours', t:'hero', p:4, r:'E', txt:'PASSIVE: At the start of each round, the opponent discards 1 random card from their hand.' },
  // ---- UNITS (12) ----
  { id:'hiranya',  n:'Hiranyakashipu',sub:'The Immortal Tyrant',  t:'unit', p:7, r:'E', txt:'PASSIVE: Cannot be destroyed by any Astra (Brahmastra overrides). Only a Mantra may remove it.' },
  { id:'ravana',   n:'Ravana',        sub:'The Ten Headed King',  t:'unit', p:7, r:'E', txt:'ON PLAY: Gains +1 power for each card in the opponent’s hand (max +5).' },
  { id:'kumbha',   n:'Kumbhakarna',   sub:'The Sleeping Giant',   t:'unit', p:8, r:'E', txt:'ON PLAY: Sleeps (power does not count). At the start of your next turn it wakes and deals 3 damage to all enemy Units.' },
  { id:'meghnad',  n:'Meghnad',       sub:'Son of Thunder',       t:'unit', p:6, r:'R', txt:'ON PLAY: If an enemy Hero is on the board, deal 2 damage to it directly (bypasses Hero immunity).' },
  { id:'kalanemi', n:'Kalanemi',      sub:'The False Saint',      t:'unit', p:5, r:'R', txt:'ON PLAY: Disguised until your next turn; when revealed, deal 2 damage to all enemy Units.' },
  { id:'bana',     n:'Bana Asura',    sub:'The Thousand Armed',   t:'unit', p:6, r:'E', txt:'PASSIVE: Gains +1 power for each Astra played this round (a Chandrahas-doubled Astra counts twice). No limit.' },
  { id:'maricha',  n:'Maricha',       sub:'The Deceptive Demon',  t:'unit', p:3, r:'R', txt:'ON PLAY: Transform into a copy of any Unit on the board, inheriting its power.' },
  { id:'vibhishana',n:'Vibhishana',   sub:'The Righteous Asura',  t:'unit', p:4, r:'U', txt:'ON PLAY: Reveal the opponent’s hand to you for this round.' },
  { id:'tataka',   n:'Tataka',        sub:'The Forest Terror',    t:'unit', p:4, r:'U', txt:'ON PLAY: Destroy the lowest power Unit on the board — friendly or enemy.' },
  { id:'kali',     n:'Kali Asura',    sub:'Embodiment of Discord',t:'unit', p:3, r:'C', txt:'ON PLAY: If Chaos Surge triggered this round, gain +3 power.' },
  { id:'berserker',n:'Asura Berserker',sub:'Chaos Foot Soldier',  t:'unit', p:3, r:'C', txt:'PASSIVE: Gains +1 power each time any Astra is played this round by either player.' },
  { id:'naraka',   n:'Narakasura',    sub:'Lord of Darkness',     t:'unit', p:5, r:'R', txt:'ON PLAY: Steal 1 power from every enemy Unit and add it to this Unit.' },
  // ---- ASTRAS (3) ----
  { id:'pashupata',n:'Pashupatastra', sub:'Shiva’s Wrath',   t:'astra', p:0, r:'M', txt:'Deal damage equal to your total board power to ALL enemy Units, split evenly (min 1 each). Triggers Chaos Surge.' },
  { id:'nagastra', n:'Nagastra',      sub:'Serpent Weapon',       t:'astra', p:0, r:'R', txt:'Apply a Venom Token to ALL enemy Units. Venom deals -1 power at round end (0 kills). Triggers Chaos Surge.' },
  { id:'tamasa',   n:'Tamasa',        sub:'The Darkness Weapon',  t:'astra', p:0, r:'R', txt:'The opponent must skip their next turn (single-turn skip, not a round Pass). Triggers Chaos Surge.' },
  // ---- MANTRAS (2) ----
  { id:'sanjivani',n:'Sanjivani Corruption',sub:'Dark Revival',   t:'mantra', p:0, r:'R', txt:'Steal the opponent’s last destroyed Unit this round; place it on your board at its original power.' },
  { id:'ahamkara', n:'Ahamkara',      sub:'The Ego Weapon',       t:'mantra', p:0, r:'U', txt:'Choose a friendly Unit: double its current power until round end, then it is destroyed regardless.' },
  // ---- ARTIFACTS (2) ----
  { id:'tripura',  n:'Tripura',       sub:'The Three Demon Cities',t:'artifact', p:0, r:'M', txt:'PASSIVE: All your Units gain +1 power at the start of every turn. Ends the instant any Astra is played by either player.' },
  { id:'chandrahas',n:'Chandrahas',   sub:'Ravana’s Moon Blade',t:'artifact', p:0, r:'R', txt:'PASSIVE: Your first Astra each round deals double effect. Chaos Surge triggers twice while active.' },
];

// Generic faction registry. Add factions here; mkPlayer selects by key.
const DECKS = { devas: DEVA_DECK_DEF, asuras: ASURA_DECK_DEF };

let UID = 1;
function mkCard(def){ return { ...def, uid: UID++, power: def.p, base: def.p, ghost:false, lockedRound:0, aegis:false, revivedShield:false, asleep:false, revealPending:false, venom:0, doomed:false, disguisedAs:null }; }
function shuffle(a, rng){ for (let i=a.length-1;i>0;i--){ const j=Math.floor(rng()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }

function mkPlayer(name, rng, faction='devas'){
  const src = DECKS[faction] || DECKS.devas;
  const deck = shuffle(src.map(mkCard), rng);
  const hand = deck.splice(0,10);
  return { name, faction, deck, hand, discard:[],
    units:[], heroes:[], artifact:null,
    passed:false, roundWins:0,
    heroPlayedThisRound:false, astrasThisRound:0,
    artifactsDestroyedByMe:0, removedHeroes:[],
    skipNext:false, mahabaliArm:-1, chaosThisRound:false, seesOppHand:false };
}

function newGame(opts={}){
  const rng = opts.rng || Math.random;
  const g = {
    rng, round:1, over:false, winner:null,
    players:[ mkPlayer(opts.p0||'You', rng, opts.p0Faction||'devas'),
              mkPlayer(opts.p1||'Opponent', rng, opts.p1Faction||'devas') ],
    turn: rng()<0.5?0:1, lastMantra:null, log:[],
    roundHistory:[],
    lastKillThisRound:null, astraPlays:0, astraBanaCount:0, grantExtraTurn:null,
  };
  g.firstThisRound = g.turn;
  { const nm=g.players[g.turn].name; log(g, `Coin flip \u2014 ${nm} ${nm==='You'?'play':'plays'} first.`); }
  onTurnStart(g, g.turn);
  return g;
}

function log(g, msg){ g.log.push({ round:g.round, msg }); }

/* ---------- power & shields ---------- */
function indraOnBoard(pl){ return pl.heroes.some(h=>h.id==='indra'); }
function effPower(g, pi, c){
  if (c.t==='hero') return c.power;
  if (c.asleep) return 0;                                // Kumbhakarna: no power while asleep
  let p = c.power;
  if (!c.ghost && indraOnBoard(g.players[pi])) p += 1;   // Indra aura (Deva)
  return p;
}
function shieldedSet(g, pi){
  // Dharma Shield is the DEVA faction passive — Asura (and other) units never hold it.
  const pl = g.players[pi];
  if (pl.faction!=='devas') return new Set();
  // v0.1 auto-shield: highest effective-power unit(s) hold Dharma Shield.
  const n = pl.artifact && pl.artifact.id==='kavacha' ? 2 : 1;
  const real = pl.units.filter(u=>!u.ghost);
  const sorted = [...real].sort((a,b)=>effPower(g,pi,b)-effPower(g,pi,a));
  const set = new Set(sorted.slice(0,n).map(u=>u.uid));
  for (const u of real) if (u.revivedShield) set.add(u.uid); // Gayatri revival shield
  return set;
}
function isShielded(g, pi, c){ return shieldedSet(g, pi).has(c.uid); }
function totalPower(g, pi){
  const pl = g.players[pi];
  let t = 0;
  for (const h of pl.heroes) t += effPower(g, pi, h);
  for (const u of pl.units)  t += effPower(g, pi, u);
  return t;
}

/* ---------- destruction / damage ---------- */
// \u00a79: Hiranyakashipu cannot be destroyed by any Astra \u2014 EXCEPT Brahmastra (which overrides immunity).
const ASTRA_KILL = new Set(['Vajra','Brahmastra','Pashupatastra']);
function isAstraImmune(unit, cause){ return unit.id==='hiranya' && ASTRA_KILL.has(cause) && cause!=='Brahmastra'; }

function destroyUnit(g, pi, unit, cause){
  const pl = g.players[pi];
  if (isAstraImmune(unit, cause)){ log(g, `${unit.n} shrugs off the Astra \u2014 immune.`); return; }
  const ix = pl.units.indexOf(unit); if (ix<0) return;
  pl.units.splice(ix,1);
  log(g, `${unit.n} is destroyed (${cause}).`);
  if (unit.aegis && !unit.ghost){
    unit.aegis=false; unit.power=1;
    pl.units.push(unit);
    log(g, `Amrita Kalasha revives ${unit.n} at 1 power!`);
    return;
  }
  if (!unit.ghost){
    pl.discard.push(unit);
    g.lastKillThisRound = { owner: pi, unit };            // for Sanjivani Corruption
    if (pl.units.some(u=>u.id==='yama')){
      pl.units.push({ uid:UID++, id:'ghost', n:`Ghost of ${unit.n}`, sub:'Yama\u2019s token', t:'unit', p:1, r:'C', power:1, base:1, ghost:true, txt:'' });
      log(g, `Yama binds a 1-power ghost of ${unit.n} to the row.`);
    }
  }
}
function damageUnit(g, pi, unit, amt, cause){
  unit.power -= amt;
  log(g, `${unit.n} takes ${amt} damage (${cause}) \u2192 ${Math.max(unit.power,0)}.`);
  if (unit.power<=0){
    if (isAstraImmune(unit, cause)){ unit.power=1; log(g, `${unit.n} endures the Astra \u2014 floors at 1.`); return; }
    destroyUnit(g, pi, unit, cause);
  }
}

/* R1 (RESOLVED): any Unit at 0 or less power is DESTROYED \u2014 generic enforcement so
   non-damage reductions (e.g. Venom Token round-end ticks) also trigger death effects. */
function sweepDeaths(g){
  for (let pi=0; pi<2; pi++){
    const pl=g.players[pi];
    for (const u of [...pl.units]) if (!u.ghost && u.power<=0) destroyUnit(g, pi, u, 'reduced to 0');
  }
}

/* Fires when player pi begins a turn. Home for start-of-turn passives and status ticks. */
function onTurnStart(g, pi){
  const pl=g.players[pi];
  if (g.over || pl.passed) return;

  // R3: Deva Soldier steels +1 each of your turns under Indra.
  if (indraOnBoard(pl)){
    for (const u of pl.units) if (!u.ghost && u.id==='soldier'){ u.power+=1; log(g, `${u.n} steels under Indra\u2019s banner (+1 \u2192 ${u.power}).`); }
  }
  // Tripura: any owner's Units gain +1 at the start of every turn (ends when an Astra is played).
  for (let s=0;s<2;s++){
    const p=g.players[s];
    if (p.artifact && p.artifact.id==='tripura'){
      const real=p.units.filter(u=>!u.ghost);
      if (real.length){ for (const u of real) u.power+=1; log(g, `Tripura\u2019s cities blaze \u2014 ${p.name}\u2019s host +1 (\u00d7${real.length}).`); }
    }
  }
  // Kumbhakarna wakes at the start of its owner's next turn: 3 damage to all enemy Units.
  for (const u of [...pl.units]){
    if (!u.ghost && u.id==='kumbha' && u.asleep){
      u.asleep=false;
      log(g, `Kumbhakarna wakes \u2014 3 damage to all enemy Units!`);
      for (const f of [...g.players[1-pi].units]) if (!f.ghost) damageUnit(g, 1-pi, f, 3, 'Kumbhakarna');
    }
  }
  // Kalanemi reveal at the start of your next turn: 2 damage to all enemy Units.
  for (const u of [...pl.units]){
    if (!u.ghost && u.id==='kalanemi' && u.revealPending){
      u.revealPending=false;
      log(g, `Kalanemi is unmasked \u2014 2 damage to all enemy Units!`);
      for (const f of [...g.players[1-pi].units]) if (!f.ghost) damageUnit(g, 1-pi, f, 2, 'Kalanemi');
    }
  }
  sweepDeaths(g);
}

/* CHAOS SURGE \u2014 Asura faction passive. Fires when the Asura player plays an Astra:
   one random friendly Unit gains +2. Chandrahas makes it fire twice per Astra. */
function chaosSurge(g, pi, times){
  const pl=g.players[pi];
  if (pl.faction!=='asuras') return;
  for (let k=0;k<times;k++){
    const real=pl.units.filter(u=>!u.ghost);
    if (!real.length) continue;
    const u=real[Math.floor(g.rng()*real.length)];
    u.power+=2;
    log(g, `Chaos Surge! ${u.n} +2 \u2192 ${u.power}.`);
  }
  pl.chaosThisRound=true;                                 // for Kali Asura
}

/* Runs after any Astra resolves (either player). Bana Asura / Asura Berserker counters,
   and Tripura's break condition. */
function onAstraResolved(g, astraPi, doubled){
  g.astraPlays += 1;                       // Berserker counter (per Astra card)
  g.astraBanaCount += doubled?2:1;         // Bana counter (doubled Astra counts twice \u2014 \u00a79)
  for (let s=0;s<2;s++){
    for (const u of g.players[s].units){
      if (u.ghost) continue;
      if (u.id==='bana'){ const inc=doubled?2:1; u.power+=inc; log(g, `Bana Asura\u2019s arms multiply (+${inc} \u2192 ${u.power}).`); }
      else if (u.id==='berserker'){ u.power+=1; log(g, `Asura Berserker rages (+1 \u2192 ${u.power}).`); }
    }
  }
  for (let s=0;s<2;s++){
    const pl=g.players[s];
    if (pl.artifact && pl.artifact.id==='tripura'){ log(g, `An Astra shatters Tripura \u2014 the three cities fall.`); pl.discard.push(pl.artifact); pl.artifact=null; }
  }
}

/* ---------- mantra effects (shared for Brihaspati copy) ---------- */
function castMantra(g, pi, id, targetUid=null){
  const pl=g.players[pi], opp=g.players[1-pi];
  if (id==='gayatri'){
    const units = pl.discard.filter(c=>c.t==='unit');
    if (!units.length){ log(g,'Gayatri Mantra: no fallen Unit to revive.'); return; }
    const lowest = units.reduce((a,b)=>a.base<=b.base?a:b);
    pl.discard.splice(pl.discard.indexOf(lowest),1);
    lowest.power = lowest.base; lowest.revivedShield = true;
    pl.units.push(lowest);
    log(g, `Gayatri Mantra revives ${lowest.n} at full power, shielded.`);
  } else if (id==='pavamana'){
    let healed=0;
    for (const u of pl.units){ if (!u.ghost && u.power<u.base){ u.power=u.base+1; healed++; } }
    log(g, healed?`Pavamana purifies ${healed} unit(s): healed +1.`:'Pavamana: nothing to purify.');
  } else if (id==='sanjivani'){
    // Steal the opponent's last destroyed Unit this round; place it at original power for the Asura player.
    const lk=g.lastKillThisRound;
    if (lk && lk.owner===1-pi && opp.discard.includes(lk.unit)){
      const u=lk.unit; opp.discard.splice(opp.discard.indexOf(u),1);
      u.power=u.base; u.aegis=false; u.revivedShield=false; u.venom=0; u.asleep=false; u.doomed=false; u.revealPending=false;
      pl.units.push(u); g.lastKillThisRound=null;
      log(g, `Sanjivani Corruption drags ${u.n} back to fight for ${pl.name}.`);
    } else log(g, 'Sanjivani Corruption: no fallen enemy Unit to steal.');
  } else if (id==='ahamkara'){
    const real=pl.units.filter(u=>!u.ghost);
    if (!real.length){ log(g, 'Ahamkara: no friendly Unit to inflame.'); }
    else {
      let t = targetUid!=null ? real.find(u=>u.uid===targetUid) : null;
      if (!t) t = real.reduce((a,b)=>effPower(g,pi,a)>=effPower(g,pi,b)?a:b);
      t.power*=2; t.doomed=true;
      log(g, `Ahamkara doubles ${t.n} to ${t.power} — doomed to shatter at round end.`);
    }
  }
  // Agni trigger — any mantra, either player
  for (let s=0;s<2;s++){
    if (g.players[s].heroes.some(h=>h.id==='agni')){
      const foes = g.players[1-s].units.filter(u=>!u.ghost);
      if (foes.length){
        const t = foes[Math.floor(g.rng()*foes.length)];
        log(g, `Agni (${g.players[s].name}) flares at the mantra!`);
        damageUnit(g, 1-s, t, 1, 'Agni');
      }
    }
  }
  g.lastMantra = id;
}

/* ---------- legality ---------- */
function playableIndices(g, pi){
  const pl=g.players[pi], opp=g.players[1-pi], res=[];
  pl.hand.forEach((c,i)=>{
    if (c.lockedRound===g.round) return;
    if (c.t==='hero' && pl.heroPlayedThisRound) return;
    if (c.t==='astra'){
      if (opp.heroes.some(h=>h.id==='varuna') && pl.astrasThisRound>=1) return;
      if (c.id==='vajra'){
        const indra = indraOnBoard(pl);
        const targets = opp.units.filter(u=>!u.ghost && !isShielded(g,1-pi,u) && (indra || effPower(g,1-pi,u)>=6));
        if (!targets.length) return;
      }
      if (c.id==='sudarshana' && !opp.heroes.length) return;
      if (c.id==='brahmastra' && !opp.units.some(u=>!u.ghost)) return;
      if ((c.id==='pashupata'||c.id==='nagastra') && !opp.units.some(u=>!u.ghost)) return;
    }
    if (c.t==='mantra'){
      if (c.id==='gayatri' && !pl.discard.some(x=>x.t==='unit')) return;
      if (c.id==='ahamkara' && !pl.units.some(u=>!u.ghost)) return;
      if (c.id==='sanjivani'){ const lk=g.lastKillThisRound; if (!(lk && lk.owner===1-pi && opp.discard.includes(lk.unit))) return; }
    }
    res.push(i);
  });
  return res;
}

/* Targets a card needs (for UI): returns {kind, options} or null */
function targetSpec(g, pi, card){
  const opp=g.players[1-pi];
  if (card.id==='vajra'){
    const indra = indraOnBoard(g.players[pi]);
    return { kind:'enemyUnit', options: opp.units.filter(u=>!u.ghost && !isShielded(g,1-pi,u) && (indra||effPower(g,1-pi,u)>=6)) };
  }
  if (card.id==='sudarshana') return { kind:'enemyHero', options:[...opp.heroes] };
  if (card.id==='saraswati' && opp.hand.length) return { kind:'oppHandCard', options:[...opp.hand] };
  if (card.id==='ahamkara') return { kind:'friendlyUnit', options: g.players[pi].units.filter(u=>!u.ghost) };
  return null;
}

/* ---------- astra resolution (shared by normal + Chandrahas double) ---------- */
function resolveAstra(g, pi, c, targetUid){
  const pl=g.players[pi], opp=g.players[1-pi];
  switch(c.id){
    case 'vajra': {
      const spec=targetSpec(g,pi,c);
      if (!spec.options.length){ log(g,'Vajra finds no mark.'); break; }
      let t = targetUid!=null ? spec.options.find(u=>u.uid===targetUid) : null;
      if (!t) t = spec.options.reduce((a,b)=>effPower(g,1-pi,a)>=effPower(g,1-pi,b)?a:b);
      log(g,'Vajra falls!'); destroyUnit(g, 1-pi, t, 'Vajra'); break;
    }
    case 'brahmastra':
      log(g,'BRAHMASTRA. The earth remembers, and trembles.');
      for (const u of [...opp.units]) destroyUnit(g, 1-pi, u, 'Brahmastra'); break;
    case 'sudarshana': {
      if (!opp.heroes.length){ log(g,'Sudarshana finds no Hero.'); break; }
      let t = targetUid!=null ? opp.heroes.find(h=>h.uid===targetUid) : null;
      if (!t) t = opp.heroes.reduce((a,b)=>a.power>=b.power?a:b);
      opp.heroes.splice(opp.heroes.indexOf(t),1); opp.removedHeroes.push(t);
      log(g,`Sudarshana Chakra removes ${t.n} for this round.`); break;
    }
    case 'pashupata': {
      const foes=opp.units.filter(u=>!u.ghost);
      if (!foes.length){ log(g,'Pashupatastra finds no target.'); break; }
      const total=totalPower(g,pi);
      const per=Math.max(1, Math.floor(total/foes.length));
      log(g,`Pashupatastra rains ${per} on each enemy Unit (board power ${total}).`);
      for (const u of [...foes]) damageUnit(g, 1-pi, u, per, 'Pashupatastra'); break;
    }
    case 'nagastra': {
      const foes=opp.units.filter(u=>!u.ghost);
      for (const u of foes) u.venom=(u.venom||0)+1;
      log(g, foes.length?`Nagastra envenoms ${foes.length} enemy Unit(s).`:'Nagastra hisses at empty air.'); break;
    }
    case 'tamasa':
      opp.skipNext=true;
      log(g, `Tamasa smothers ${opp.name}’s next turn.`); break;
  }
}

/* ---------- play a card ---------- */
function playCard(g, pi, handIndex, targetUid=null){
  const pl=g.players[pi], opp=g.players[1-pi];
  const c = pl.hand[handIndex];
  if (!c) throw new Error('bad hand index');
  pl.hand.splice(handIndex,1);
  log(g, `${pl.name} plays ${c.n}${c.sub?' \u2014 '+c.sub:''}.`);

  if (c.t==='hero'){
    pl.heroes.push(c); pl.heroPlayedThisRound=true;
  }
  else if (c.t==='unit'){
    // Mahabali (§9): the first Unit played the round after a VOLUNTARY Pass grants an extra turn.
    const mahaBonus = pl.mahabaliArm===g.round-1 && pl.heroes.some(h=>h.id==='mahabali');
    if (mahaBonus) pl.mahabaliArm=0;
    pl.units.push(c);
    switch(c.id){
      case 'surya': for (const u of pl.units) if (u!==c && !u.ghost) u.power+=1;
        log(g,'Surya Dev: all other friendly Units +1.'); break;
      case 'vayu': {
        const foes=opp.units.filter(u=>!u.ghost);
        if (foes.length){ const t=foes.reduce((a,b)=>effPower(g,1-pi,a)>=effPower(g,1-pi,b)?a:b); damageUnit(g,1-pi,t,2,'Vayu'); }
        break; }
      case 'vishwakarma':
        if (opp.artifact){ log(g,`Vishwakarma unmakes ${opp.artifact.n}.`); opp.discard.push(opp.artifact); opp.artifact=null; pl.artifactsDestroyedByMe++; }
        if (pl.artifactsDestroyedByMe>0){ c.power += 2*pl.artifactsDestroyedByMe; log(g,`Vishwakarma stands at ${c.power}.`); }
        break;
      case 'kubera': {
        const drawn = pl.deck.splice(0,2); pl.hand.push(...drawn);
        log(g, `Kubera draws ${drawn.length} card(s).`);
        if (drawn.length===2 && drawn.every(d=>d.t==='unit')){ drawn.forEach(d=>d.power+=1); log(g,'Both were Units \u2014 each gains +1.'); }
        break; }
      case 'urvashi': {
        const withP = opp.hand.filter(h=>h.p>0);
        if (withP.length){ const t=withP.reduce((a,b)=>a.p>=b.p?a:b); opp.hand.splice(opp.hand.indexOf(t),1); opp.discard.push(t);
          log(g,`Urvashi\u2019s glance \u2014 ${opp.name} discards ${t.n}.`); }
        break; }
      case 'saraswati': {
        let t = targetUid!=null ? opp.hand.find(h=>h.uid===targetUid) : null;
        if (!t && opp.hand.length) t = opp.hand.reduce((a,b)=>a.p>=b.p?a:b);
        if (t){ t.lockedRound=g.round; log(g,`Saraswati locks ${t.n} for this round.`); }
        break; }
      case 'ashwini': {
        const wounded = pl.units.filter(u=>!u.ghost && u.power<u.base);
        if (wounded.length){ const t=wounded.reduce((a,b)=>(a.base-a.power)>=(b.base-b.power)?a:b);
          t.power=Math.min(t.base, t.power+2); log(g,`Ashwini Kumars heal ${t.n} \u2192 ${t.power}.`); }
        else log(g,'Ashwini Kumars: no wounds to heal.');
        break; }
      case 'marut': if (pl.units.some(u=>u.id==='vayu')){ c.power+=3; log(g,'Marut rides Vayu\u2019s wind: +3.'); } break;
      case 'gandharva': if (pl.units.filter(u=>!u.ghost).length>=4){ c.power+=2; log(g,'Gandharva\u2019s harmony: +2.'); } break; // itself + 3 others
      case 'brihaspati':
        if (g.lastMantra){ log(g,`Brihaspati repeats ${g.lastMantra==='gayatri'?'Gayatri Mantra':'Pavamana'}.`); castMantra(g, pi, g.lastMantra); }
        else log(g,'Brihaspati: no Mantra has been spoken yet.');
        break;
      // ---- Asura units ----
      case 'ravana': { const b=Math.min(5, opp.hand.length); c.power+=b; log(g,`Ravana feeds on the enemy hand: +${b}.`); break; }
      case 'kumbha': c.asleep=true; log(g,'Kumbhakarna slumbers — it will wake next turn.'); break;
      case 'meghnad':
        if (opp.heroes.length){ const t=opp.heroes.reduce((a,b)=>a.power>=b.power?a:b); t.power=Math.max(0,t.power-2); log(g,`Meghnad’s bolt strikes ${t.n} for 2 → ${t.power}.`); }
        else log(g,'Meghnad: no enemy Hero to strike.');
        break;
      case 'kalanemi': {
        c.revealPending=true;
        if (opp.hand.length) c.disguisedAs = opp.hand[Math.floor(g.rng()*opp.hand.length)].n;   // cosmetic disguise (UI)
        log(g,'Kalanemi slips into disguise.'); break; }
      case 'maricha': {
        const pool=[]; for (let s=0;s<2;s++) for (const u of g.players[s].units) if (!u.ghost && u!==c) pool.push([s,u]);
        if (pool.length){ const [,t]=pool.reduce((a,b)=>effPower(g,a[0],a[1])>=effPower(g,b[0],b[1])?a:b);
          c.id=t.id; c.n=t.n; c.sub=t.sub; c.r=t.r; c.txt=t.txt; c.base=t.base; c.power=t.power;
          log(g,`Maricha becomes ${t.n} (power ${t.power}).`); }
        else log(g,'Maricha finds no form to mimic.'); break; }
      case 'vibhishana': pl.seesOppHand=g.round; log(g,`Vibhishana lays bare ${opp.name}’s hand.`); break;
      case 'tataka': {
        // "lowest power Unit on the board — friendly or enemy." Interpretation: excludes Tataka itself
        // (a removal Unit shouldn't primarily suicide); can still hit your OTHER Units. Owner may revisit.
        const pool=[]; for (let s=0;s<2;s++) for (const u of g.players[s].units) if (!u.ghost && u!==c) pool.push([s,u]);
        if (pool.length){ let mn=Math.min(...pool.map(([s,u])=>effPower(g,s,u)));
          const cands=pool.filter(([s,u])=>effPower(g,s,u)===mn);
          const pick=cands.find(([s])=>s===1-pi)||cands[0];   // tie → prefer enemy
          log(g,`Tataka rends the weakest — ${pick[1].n}.`); destroyUnit(g, pick[0], pick[1], 'Tataka'); }
        break; }
      case 'kali': if (pl.chaosThisRound){ c.power+=3; log(g,'Kali Asura drinks the discord: +3.'); } break;
      case 'berserker': if (g.astraPlays>0){ c.power+=g.astraPlays; log(g,`Asura Berserker enters raging (+${g.astraPlays}).`); } break;
      case 'bana': if (g.astraBanaCount>0){ c.power+=g.astraBanaCount; log(g,`Bana Asura enters many-armed (+${g.astraBanaCount}).`); } break;
      case 'naraka': {
        const foes=opp.units.filter(u=>!u.ghost);
        if (foes.length){ let stolen=0; for (const f of foes){ f.power-=1; stolen++; } c.power+=stolen;
          log(g,`Narakasura drains ${stolen} power from the enemy line (→ ${c.power}).`); }
        else log(g,'Narakasura: no enemy Units to drain.'); break; }
    }
    if (mahaBonus){ g.grantExtraTurn=pi; log(g,`Mahabali’s decree — ${c.n} is played free; ${pl.name} takes another turn.`); }
  }
  else if (c.t==='astra'){
    const firstAstra = pl.astrasThisRound===0;
    pl.astrasThisRound++;
    const chandrahasActive = pl.faction==='asuras' && pl.artifact && pl.artifact.id==='chandrahas';
    // §9 negation (Naga): Manasa cancels the Astra AND its Chaos Surge; Surasa cancels the effect but
    // Chaos Surge STILL triggers. Dormant until the Naga faction lands (ids manasa/surasa).
    const negator = opp.units.find(u=>!u.ghost && (u.id==='manasa'||u.id==='surasa'));
    let effectNegated=false, surgeNegated=false;
    if (negator){ effectNegated=true; if (negator.id==='manasa') surgeNegated=true;
      log(g, `${negator.n} negates ${c.n}${surgeNegated?' — its Chaos Surge fizzles too (§9)':' — but Chaos Surge still churns (§9)'}.`); }
    const doubled = chandrahasActive && firstAstra && !effectNegated;
    if (!effectNegated){
      resolveAstra(g, pi, c, targetUid);
      if (doubled){ log(g,`Chandrahas doubles ${c.n}!`); resolveAstra(g, pi, c, targetUid); }
    }
    if (pl.faction==='asuras' && !surgeNegated) chaosSurge(g, pi, chandrahasActive?2:1);
    onAstraResolved(g, pi, doubled);
    pl.discard.push(c);
  }
  else if (c.t==='mantra'){ castMantra(g, pi, c.id, targetUid); pl.discard.push(c); }
  else if (c.t==='artifact'){
    if (pl.artifact){ pl.discard.push(pl.artifact); log(g,`${pl.artifact.n} is replaced.`); }
    pl.artifact = c;
    if (c.id==='amrita'){
      // R4 (RESOLVED): your lowest power Unit gains +2; if destroyed this round it revives once at 1 power (aegis).
      const real=pl.units.filter(u=>!u.ghost);
      if (real.length){ const t=real.reduce((a,b)=>effPower(g,pi,a)<=effPower(g,pi,b)?a:b);
        t.power+=2; t.aegis=true; log(g,`Amrita Kalasha blesses ${t.n}: +2, revives once if destroyed.`); }
      else log(g,'Amrita Kalasha: no Unit to bless.');
    }
    else if (c.id==='kavacha') log(g,'Dharma Kavacha raised \u2014 two Units now shielded.');
    else if (c.id==='tripura')  log(g,'Tripura rises \u2014 the three cities empower the host each turn.');
    else if (c.id==='chandrahas') log(g,'Chandrahas gleams \u2014 Astras redouble.');
  }
  afterAction(g, pi);
}

function pass(g, pi){
  const pl=g.players[pi];
  pl.passed=true;
  log(g, `${pl.name} passes.`);
  if (pl.heroes.some(h=>h.id==='mahabali')) pl.mahabaliArm=g.round;   // §9: voluntary Pass arms Mahabali
  afterAction(g, pi);
}

function afterAction(g, pi){
  sweepDeaths(g);                                    // R1: enforce death-at-0 generically
  const a=g.players[0], b=g.players[1];
  if (a.passed && b.passed){ endRound(g); return; }
  // Mahabali free-play extra turn — the acting player keeps the turn once.
  if (g.grantExtraTurn===pi && !g.players[pi].passed){ g.grantExtraTurn=null; g.turn=pi; onTurnStart(g, pi); return; }
  let next = g.players[1-pi].passed ? pi : 1-pi;
  // Tamasa forced single-turn skip (one-shot, does not leave the round).
  let guard=0;
  while (g.players[next].skipNext && guard++<4){
    g.players[next].skipNext=false;
    log(g, `${g.players[next].name} is forced to skip a turn (Tamasa).`);
    next = g.players[1-next].passed ? next : 1-next;
  }
  g.turn = next;
  onTurnStart(g, g.turn);
}

/* ---------- round / match resolution ---------- */
function endRound(g){
  // Venom Tokens tick at round end, BEFORE scoring \u2014 R1: reaching 0 kills.
  for (let pi=0;pi<2;pi++){
    for (const u of g.players[pi].units){
      if (!u.ghost && u.venom>0){
        u.power-=u.venom; log(g, `Venom courses through ${u.n} (-${u.venom}).`);
        // Ruling (2026-07): venom is Astra-sourced, so Hiranyakashipu's immunity holds \u2014 floors at 1.
        if (u.id==='hiranya' && u.power<1){ u.power=1; log(g, `${u.n} endures the venom \u2014 immune.`); }
      }
    }
  }
  sweepDeaths(g);
  const t0=totalPower(g,0), t1=totalPower(g,1);
  log(g, `Round ${g.round} ends \u2014 ${g.players[0].name} ${t0} vs ${g.players[1].name} ${t1}.`);
  let winner=null;
  if (t0>t1) winner=0; else if (t1>t0) winner=1;
  if (winner!=null){ g.players[winner].roundWins++; log(g, `${g.players[winner].name} wins Round ${g.round}!`); }
  else log(g, 'The round is a draw \u2014 both sides bleed.');
  g.roundHistory.push({ round:g.round, t0, t1, winner });

  if (g.players[0].roundWins>=2 || g.players[1].roundWins>=2 || g.round>=3){
    g.over=true;
    if (g.players[0].roundWins>g.players[1].roundWins) g.winner=0;
    else if (g.players[1].roundWins>g.players[0].roundWins) g.winner=1;
    else g.winner=null;
    log(g, g.winner==null ? 'The match ends in a cosmic stalemate.' : `\u2694 ${g.players[g.winner].name} WINS THE MATCH ${g.players[g.winner].roundWins}\u2013${g.players[1-(g.winner)].roundWins}!`);
    return;
  }

  // board reset
  for (let s=0;s<2;s++){
    const pl=g.players[s];
    for (const u of pl.units) if (!u.ghost){ u.revivedShield=false; u.aegis=false; u.venom=0; u.asleep=false; u.doomed=false; u.revealPending=false; pl.discard.push(u); }
    pl.units=[];
    if (pl.artifact){ pl.discard.push(pl.artifact); pl.artifact=null; }
    // removed heroes return at half power
    for (const h of pl.removedHeroes){ h.power=Math.max(1, Math.ceil(h.power/2)); pl.heroes.push(h); log(g,`${h.n} returns at ${h.power} power.`); }
    pl.removedHeroes=[];
    pl.passed=false; pl.heroPlayedThisRound=false; pl.astrasThisRound=0;
    pl.skipNext=false; pl.chaosThisRound=false; pl.seesOppHand=false;   // mahabaliArm persists for next-round consumption
    const drawn = pl.deck.splice(0,2); pl.hand.push(...drawn);
    for (const c of pl.hand) c.lockedRound=0;
  }
  g.lastKillThisRound=null; g.astraPlays=0; g.astraBanaCount=0; g.grantExtraTurn=null;
  g.round++;
  const prev = g.roundHistory[g.roundHistory.length-1];
  // R2 (RESOLVED): previous round's WINNER plays first; on a drawn round, the same leader as before.
  g.turn = prev.winner!=null ? prev.winner : g.firstThisRound;
  g.firstThisRound = g.turn;
  // Rahu: at the start of each round the opponent discards 1 random card.
  for (let s=0;s<2;s++){
    if (g.players[s].heroes.some(h=>h.id==='rahu')){
      const foe=g.players[1-s];
      if (foe.hand.length){ const i=Math.floor(g.rng()*foe.hand.length); const d=foe.hand.splice(i,1)[0]; foe.discard.push(d);
        log(g, `Rahu devours a card from ${foe.name}\u2019s hand (${d.n}).`); }
    }
  }
  log(g, `\u2014\u2014 Round ${g.round} begins. Each side draws 2. ${g.players[g.turn].name} leads. \u2014\u2014`);
  onTurnStart(g, g.turn);                            // start-of-turn hooks for the new round
}

/* ---------- AI ---------- */
function aiScoreCard(g, pi, c){
  const pl=g.players[pi], opp=g.players[1-pi];
  let s = c.p;
  switch(c.id){
    case 'indra': s += Math.min(pl.units.filter(u=>!u.ghost).length, 5) + 2; break;
    case 'varuna': s += 2; break;
    case 'agni': s += 1; break;
    case 'surya': s += pl.units.filter(u=>!u.ghost).length; break;
    case 'marut': if (pl.units.some(u=>u.id==='vayu')) s += 3; break;
    case 'gandharva': if (pl.units.filter(u=>!u.ghost).length>=3) s += 2; break;
    case 'kubera': s += 2.5; break;
    case 'urvashi': s += 2; break;
    case 'saraswati': s += opp.hand.length? 2:0; break;
    case 'vayu': s += opp.units.some(u=>!u.ghost)? 2:0; break;
    case 'vishwakarma': s += opp.artifact? 3:0; break;
    case 'yama': s += 1.5; break;
    case 'brihaspati': s += g.lastMantra? 2:0; break;
    case 'vajra': { const spec=targetSpec(g,pi,c); s = spec.options.length? 1+Math.max(...spec.options.map(u=>effPower(g,1-pi,u))) : -99; break; }
    case 'brahmastra': s = opp.units.filter(u=>!u.ghost).reduce((k,u)=>k+effPower(g,1-pi,u),0); break;
    case 'sudarshana': s = opp.heroes.length? 2+Math.max(...opp.heroes.map(h=>h.power))/2 : -99; break;
    case 'gayatri': { const u=pl.discard.filter(x=>x.t==='unit'); s = u.length? 1+Math.min(...u.map(x=>x.base))+2 : -99; break; }
    case 'pavamana': s = pl.units.filter(u=>!u.ghost&&u.power<u.base).length*2 - 1; break;
    case 'amrita': s = pl.units.some(u=>!u.ghost)? 2.5 : -1; break;
    case 'kavacha': s = pl.units.filter(u=>!u.ghost).length>=2? 2 : 0; break;
    // ---- Asura ----
    case 'mahabali': s += 2; break;
    case 'shukra': s += pl.discard.some(x=>x.t==='unit')? 2.5 : 0; break;
    case 'rahu': s += 2; break;
    case 'hiranya': s += 2; break;                                   // durable body
    case 'ravana': s += Math.min(5, opp.hand.length); break;
    case 'kumbha': s -= 1; break;                                    // strong but sleeps a turn
    case 'meghnad': s += opp.heroes.length? 2 : 0; break;
    case 'kalanemi': s += opp.units.filter(u=>!u.ghost).length>=2? 2 : 0; break;
    case 'bana': s += 1 + Math.min(4, g.astraBanaCount); break;
    case 'maricha': { const pool=[]; for (let t=0;t<2;t++) for (const u of g.players[t].units) if (!u.ghost && u.id!=='maricha') pool.push(effPower(g,t,u));
      s = pool.length? Math.max(...pool) : 3; break; }
    case 'vibhishana': s += 0.5; break;
    case 'tataka': s += 1.5; break;
    case 'kali': s += pl.chaosThisRound? 3 : 0; break;
    case 'berserker': s += Math.min(3, g.astraPlays); break;
    case 'naraka': s += opp.units.filter(u=>!u.ghost).length; break;
    case 'pashupata': { const foes=opp.units.filter(u=>!u.ghost); s = foes.length? 2+Math.min(foes.length*2, totalPower(g,pi)) : -99; break; }
    case 'nagastra': { const foes=opp.units.filter(u=>!u.ghost); s = foes.length? 1+foes.length : -99; break; }
    case 'tamasa': s = 2; break;
    case 'sanjivani': { const lk=g.lastKillThisRound; s = (lk && lk.owner===1-pi && opp.discard.includes(lk.unit))? 1+lk.unit.base : -99; break; }
    case 'ahamkara': { const real=pl.units.filter(u=>!u.ghost); s = real.length? Math.max(...real.map(u=>effPower(g,pi,u))) : -99; break; }
    case 'tripura': s += 2; break;
    case 'chandrahas': s += 1.5; break;
  }
  // Chaos Surge upside: Asuras value Astras a touch more when they have Units to buff.
  if (c.t==='astra' && pl.faction==='asuras' && pl.units.some(u=>!u.ghost)) s += 1;
  return s;
}

function aiMove(g, pi){
  const pl=g.players[pi], opp=g.players[1-pi];
  const idxs = playableIndices(g, pi);
  const my=totalPower(g,pi), their=totalPower(g,1-pi);
  const lead = my-their;
  const mustWin = opp.roundWins===1;               // losing this round loses the match
  const wantWin = pl.roundWins===1;                // winning this round wins the match

  if (!idxs.length) return { pass:true };

  if (opp.passed){
    if (lead>0) return { pass:true };
    // find cheapest single play that flips the round
    let best=null;
    for (const i of idxs){
      const c=pl.hand[i];
      const gain = c.t==='unit'||c.t==='hero' ? c.p + (indraOnBoard(pl)&&c.t==='unit'?1:0) : aiScoreCard(g,pi,c)-c.p;
      if (gain > -lead){ if (!best || pl.hand[best].p>c.p) best=i; }
    }
    if (best!=null) return { play:best };
    // can't flip with one card: fight on if the match is at stake, else concede the round
    if (mustWin){ const i = idxs.reduce((a,b)=> aiScoreCard(g,pi,pl.hand[a])>=aiScoreCard(g,pi,pl.hand[b])?a:b); return { play:i }; }
    return { pass:true };
  }

  // opponent still active
  if (!mustWin && !wantWin && g.round===1 && lead>=10 && pl.hand.length<=opp.hand.length-1) return { pass:true }; // card-advantage bluff
  if (!mustWin && lead<=-14 && g.round<3) return { pass:true };  // concede a lost round, preserve cards

  const i = idxs.reduce((a,b)=> aiScoreCard(g,pi,pl.hand[a])>=aiScoreCard(g,pi,pl.hand[b])?a:b);
  return { play:i };
}

function aiTakeTurn(g, pi){
  const mv = aiMove(g, pi);
  if (mv.pass) pass(g, pi); else playCard(g, pi, mv.play, null);
}

/* ---------- Node export & simulation harness ---------- */
if (typeof module!=='undefined'){
  module.exports = { newGame, playCard, pass, aiMove, aiTakeTurn, totalPower, playableIndices, targetSpec, effPower, isShielded, DECKS, DEVA_DECK_DEF, ASURA_DECK_DEF, RARITY_COLOR, RARITY_NAME };
}
