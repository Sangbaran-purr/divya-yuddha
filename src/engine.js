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
  { id:'kumbha',   n:'Kumbhakarna',   sub:'The Sleeping Giant',   t:'unit', p:8, r:'E', txt:'ON PLAY: Its power counts at once. At the start of your next turn it wakes and deals 3 damage to all enemy Units.' },
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
  { id:'pashupata',n:'Pashupatastra', sub:'Shiva’s Wrath',   t:'astra', p:0, r:'M', dmgAstra:true, txt:'Deal damage equal to your total board power to ALL enemy Units, split evenly (min 1 each). Triggers Chaos Surge.' },
  { id:'nagastra', n:'Nagastra',      sub:'Serpent Weapon',       t:'astra', p:0, r:'R', txt:'Apply a Venom Token to ALL enemy Units. Venom deals -1 power at round end (0 kills). Triggers Chaos Surge.' },
  { id:'tamasa',   n:'Tamasa',        sub:'The Darkness Weapon',  t:'astra', p:0, r:'R', txt:'The opponent must skip their next turn (single-turn skip, not a round Pass). Triggers Chaos Surge.' },
  // ---- MANTRAS (2) ----
  { id:'sanjivani',n:'Sanjivani Corruption',sub:'Dark Revival',   t:'mantra', p:0, r:'R', txt:'Steal the opponent’s last destroyed Unit this round; place it on your board at its original power.' },
  { id:'ahamkara', n:'Ahamkara',      sub:'The Ego Weapon',       t:'mantra', p:0, r:'U', txt:'Choose a friendly Unit: double its current power until round end, then it is destroyed regardless.' },
  // ---- ARTIFACTS (2) ----
  { id:'tripura',  n:'Tripura',       sub:'The Three Demon Cities',t:'artifact', p:0, r:'M', txt:'PASSIVE: All your Units gain +1 power at the start of every turn. Ends the instant any Astra is played by either player.' },
  { id:'chandrahas',n:'Chandrahas',   sub:'Ravana’s Moon Blade',t:'artifact', p:0, r:'R', txt:'ON PLAY: trigger one Chaos Surge. PASSIVE: your first Astra each round deals double effect; Chaos Surge triggers twice while active.' },
];

// Generic faction registry. Add factions here; mkPlayer selects by key.
// Vanara roster — docs/VANARA_ROSTER.md (GDD v2.0 §7). Mechanic: LEAP (see doLeap()). Units-only positions.
const VANARA_DECK_DEF = [
  // ---- HEROES (3) ----
  { id:'hanuman', n:'Hanuman',       sub:'Devotion Incarnate',   t:'hero', p:9, r:'L', txt:'PASSIVE: Each Vanara Unit of printed power 4+ you play gains +1 on entry (+2 while Jambavan is on the board).' },
  { id:'sugriva', n:'Sugriva',       sub:'King of the Vanaras',  t:'hero', p:6, r:'E', txt:'ON PLAY: Draw 1 extra card immediately.' },
  { id:'angad',   n:'Angad',         sub:'The Unyielding Messenger', t:'hero', p:7, r:'E', txt:'PASSIVE: Immune to opponent Mantras. When the opponent plays an Astra, they forfeit their next turn.' },
  // ---- UNITS (12) ----
  { id:'nala',    n:'Nala',          sub:'The Bridge Builder',   t:'unit', p:5, r:'E', txt:'ON PLAY: Place a copy of the lowest-power Vanara Unit in your hand onto the row at half power.' },
  { id:'neela',   n:'Neela',         sub:'Commander of the Vanguard', t:'unit', p:5, r:'R', txt:'ON PLAY: All Vanara Units on the board gain +1 power.' },
  { id:'jambavan',n:'Jambavan',      sub:'The Ancient Bear King',t:'unit', p:6, r:'E', txt:'PASSIVE: Hanuman’s entry bonus becomes +2 per Unit while Jambavan is on the board.' },
  { id:'kesari',  n:'Kesari',        sub:'Father of Hanuman',    t:'unit', p:5, r:'R', txt:'ON PLAY: If Hanuman is on the board, gain power equal to Hanuman’s current power.' },
  { id:'tara',    n:'Tara',          sub:'Queen of the Vanaras', t:'unit', p:4, r:'R', txt:'ON PLAY: Look at the top 3 cards of your deck; keep one, return the rest.' },
  { id:'dwivida', n:'Dwivida',       sub:'The Rogue Vanara',     t:'unit', p:5, r:'R', txt:'ON PLAY: Destroy one random card in the opponent’s hand.' },
  { id:'mainda',  n:'Mainda',        sub:'The Swift Striker',    t:'unit', p:4, r:'U', txt:'ON PLAY: Immediately Leap onto an adjacent Unit — free, without spending your round’s Leap.' },
  { id:'sharabha',n:'Sharabha',      sub:'The Forest Sentinel',  t:'unit', p:3, r:'U', txt:'PASSIVE: The opponent cannot target your Vanara Units of power 3 or less with Astras.' },
  { id:'scout',   n:'Vanara Scout',  sub:'Eyes of the Jungle',   t:'unit', p:2, r:'C', txt:'ON PLAY: Reveal the opponent’s hand; gain +1 power for each Vanara Unit already on the board.' },
  { id:'warrior', n:'Vanara Warrior',sub:'Loyal to the Last',    t:'unit', p:3, r:'C', txt:'PASSIVE: +1 power for each other Vanara Unit on the board (max +4).' },
  { id:'dadhimukha',n:'Dadhimukha',  sub:'Guardian of Madhuvana',t:'unit', p:3, r:'U', txt:'ON PLAY: Draw 1 card. If Sugriva is on the board, also give all friendly Vanara Units +1 power.' },
  { id:'riksha',  n:'Riksha',        sub:'Son of the Wind',      t:'unit', p:4, r:'R', txt:'ON PLAY: Move to any position on the row. Gains +3 power while Hanuman is on the board.' },
  // ---- ASTRAS (3) ----
  { id:'gandiva', n:'Gandiva Arrow', sub:'Blessed Shaft',        t:'astra', p:0, r:'R', txt:'Destroy one enemy Unit regardless of power. If a Vanara used Leap this round, destroy one more.' },
  { id:'lankadahan',n:'Lanka Dahan', sub:'Fire of Hanuman',      t:'astra', p:0, r:'L', dmgAstra:true, txt:'Deal 2 damage to ALL enemy Units. All friendly Vanara Units gain +1 power.' },
  { id:'sanjeevani',n:'Sanjeevani Call',sub:'Mountain of Life',  t:'astra', p:0, r:'U', txt:'Revive your last destroyed Unit at full power (plus Hanuman’s entry bonus if he is on board).' },
  // ---- MANTRAS (2) ----
  { id:'ramanaam',n:'Rama Naam',     sub:'The Name Above All',   t:'mantra', p:0, r:'R', txt:'All friendly Vanara Units gain +2 power.' },
  { id:'kishkindhaoath',n:'Kishkindha Oath',sub:'Bond of Warriors',t:'mantra', p:0, r:'U', txt:'Ward a friendly Vanara Unit: the next time it would be destroyed this round it survives at 1 power, and all other friendly Vanara Units gain +1.' },
  // ---- ARTIFACTS (2) ----
  { id:'ramasignet',n:'Rama’s Signet',sub:'Seal of Trust',       t:'artifact', p:0, r:'R', txt:'PASSIVE: Your Vanara Units cannot be reduced below 1 power by any effect; Venom on them is negated.' },
  { id:'kishkindhacrown',n:'Kishkindha Crown',sub:'Throne of Unity',t:'artifact', p:0, r:'M', txt:'PASSIVE: When a Vanara Unit Leaps, it and the copied Unit both gain +1. Leap limit becomes twice per round.' },
];

// Naga roster — docs/NAGA_ROSTER.md (GDD v2.0 §8). Mechanic: VENOM (see venomTick / drainAmount). Rulings R10–R16.
const NAGA_DECK_DEF = [
  // ---- HEROES (3) ----
  { id:'vasuki',  n:'Vasuki',         sub:'The Cosmic Serpent',   t:'hero', p:8, r:'L', txt:'ON PLAY: All enemy Units lose 1 power. PASSIVE: In Round 3, the Venom drain is −2 per enemy Unit.' },
  { id:'takshaka',n:'Takshaka',       sub:'The Inevitable',       t:'hero', p:6, r:'E', txt:'PASSIVE: While Takshaka is on the board, enemy Heroes are NOT immune to your Naga Astras.' },
  { id:'shesha',  n:'Shesha',         sub:'The Infinite Serpent', t:'hero', p:7, r:'L', txt:'PASSIVE: If you lose a round, at the start of the next round a random friendly Unit returns from your discard at full power.' },
  // ---- UNITS (12) ----
  { id:'manasa',  n:'Manasa',         sub:'Goddess of Serpents',  t:'unit', p:5, r:'E', txt:'PASSIVE: The opponent’s Astras are cancelled (effect and Chaos Surge). ON PLAY: gain +1 power for each Naga Unit on the board.' },
  { id:'karkotaka',n:'Karkotaka',     sub:'The Venomous King',    t:'unit', p:6, r:'E', txt:'PASSIVE: Your Venom drain ticks at the start of each opponent turn instead of once at round end.' },
  { id:'surasa',  n:'Surasa',         sub:'Mother of Nagas',      t:'unit', p:5, r:'E', txt:'ON PLAY: Trap the opponent’s next card — a Unit enters with −2 power and Surasa gains +2; an Astra is negated (its Chaos Surge still fires).' },
  { id:'ulupi',   n:'Ulupi',          sub:'The River Naga Princess', t:'unit', p:4, r:'R', txt:'ON PLAY: Revive a destroyed friendly Naga Unit from your discard at full power; it can’t be targeted by Astras this round.' },
  { id:'nagasadhu',n:'Naga Sadhu',    sub:'The Poison Ascetic',   t:'unit', p:3, r:'R', txt:'ON PLAY: Apply a Venom Token to ALL enemy Units.' },
  { id:'kaliya',  n:'Kaliya',         sub:'The Multi-Headed Terror', t:'unit', p:6, r:'E', txt:'ON PLAY: Enters with +1 power per round already completed (R1 +0, R2 +1, R3 +2).' },
  { id:'astika',  n:'Astika',         sub:'The Peacemaker',       t:'unit', p:4, r:'U', txt:'ON PLAY: Skip the next Venom tick; all friendly Units recover 1 power.' },
  { id:'nagaarcher',n:'Naga Archer',  sub:'Poison Arrow',         t:'unit', p:3, r:'U', txt:'ON PLAY: Deal 1 damage to an enemy Unit; if it survives, apply a Venom Token to it.' },
  { id:'nagaenchantress',n:'Naga Enchantress',sub:'The Luring Mist',t:'unit', p:3, r:'U', txt:'ON PLAY: The opponent’s next card must be a Unit — they cannot play an Astra or Mantra next turn.' },
  { id:'nagawarrior',n:'Naga Warrior',sub:'Scales of Darkness',   t:'unit', p:3, r:'C', txt:'PASSIVE: +1 power for each Venom Token on the board.' },
  { id:'nagahatchling',n:'Naga Hatchling',sub:'Born of Venom',    t:'unit', p:2, r:'C', txt:'ON PLAY: If any enemy Unit carries a Venom Token, gain +2 power.' },
  { id:'ashvatara',n:'Ashvatara',     sub:'The Naga Prince',      t:'unit', p:5, r:'R', txt:'ON PLAY: An enemy Unit loses power equal to the current round number (R1 −1, R2 −2, R3 −3).' },
  // ---- ASTRAS (3) ----
  { id:'nagapasha',n:'Nagapasha',     sub:'Serpent Noose',        t:'astra', p:0, r:'R', txt:'Bind an enemy Unit — it contributes 0 power until the opponent spends a turn to unbind it.' },
  { id:'venomstrike',n:'Vasuki Venom Strike',sub:'Cosmic Poison', t:'astra', p:0, r:'L', txt:'This round, your Venom drain is tripled (−3, or −4 while Vasuki is on the board).' },
  { id:'mohini',  n:'Mohini Trap',    sub:'The Illusion Snare',   t:'astra', p:0, r:'R', txt:'Steal an enemy Unit until round end; it fights for you (and is exempt from your Venom).' },
  // ---- MANTRAS (2) ----
  { id:'mrityunjaya',n:'Mrityunjaya', sub:'Conquest of Death',    t:'mantra', p:0, r:'R', txt:'Revive any destroyed Unit (either discard) onto your board at full power. It gains a Venom Token.' },
  { id:'sarpasatra',n:'Sarpa Satra',  sub:'The Serpent Sacrifice',t:'mantra', p:0, r:'U', txt:'Sacrifice a friendly Naga Unit: all enemy Units lose power equal to its current power. Venom Tokens deal double this round.' },
  // ---- ARTIFACTS (2) ----
  { id:'patala',  n:'Patala Throne',  sub:'Seat of Serpent Kings',t:'artifact', p:0, r:'M', txt:'PASSIVE: Your Venom drain becomes −(1 + current round number): R1 −2, R2 −3, R3 −4.' },
  { id:'anantacoil',n:'Ananta Coil',  sub:'The Endless Serpent',  t:'artifact', p:0, r:'R', txt:'PASSIVE: When a friendly Naga Unit is destroyed, leave a permanent Venom Coil that drains 1 from a random enemy Unit each Venom tick (persists all match).' },
];

const DECKS = { devas: DEVA_DECK_DEF, asuras: ASURA_DECK_DEF, vanaras: VANARA_DECK_DEF, nagas: NAGA_DECK_DEF };
// name → card DEF (for opts.scenario deck/hand injection; instances are minted via mkCard for uid safety). Built once; touches no rng/UID.
const CARD_BY_NAME = {}; for (const f in DECKS) for (const c of DECKS[f]) CARD_BY_NAME[c.n] = c;

/* THE 7 COSMIC REALMS (GDD §10). One is assigned per match (random by default; fixable via opts.realm for tests).
   Each is an engine-level modifier consulted at the relevant chokepoint — NOTE: realm key 'patala' is the REALM
   (astra damage +1); the Naga artifact is card.id 'patala' (Patala Throne). They never mix: realm is g.realm,
   artifact is card.id, always accessed distinctly. */
const REALMS = ['swarga','mrityulok','patala','gandharva','yaksha','rishi','kalki'];
const REALM_INFO = {
  swarga:    { name:'Swarga',        fx:'All Heroes have +1 power for the match.' },
  mrityulok: { name:'Mrityulok',     fx:'The mortal plane — no realm effect.' },
  patala:    { name:'Patala',        fx:'All Astra damage is increased by +1.' },
  gandharva: { name:'Gandharva Lok', fx:'Both players draw 1 extra card at the start of Round 2.' },
  yaksha:    { name:'Yaksha Lok',    fx:'Artifacts cannot be destroyed.' },
  rishi:     { name:'Rishi Mandala', fx:'Each Mantra can be used twice — it returns to your hand after its first cast.' },
  kalki:     { name:'Kalki Kshetra', fx:'The last card played each round gains +2 power (only if it is a Unit or Hero).' },
};
const realmIs = (g, key) => g.realm===key;
// Damage-dealing Astras (Patala realm +1), DERIVED from the `dmgAstra:true` card tag (keyed by name — the `cause` string).
// A permanent invariant in test.js pins the expected members so a tag typo fails loudly. (Wave-1 dmgAstra cards tag in behind the wave1 flag.)
const ASTRA_DMG = new Set(Object.values(CARD_BY_NAME).filter(c => c.dmgAstra).map(c => c.n));

let UID = 1;
function mkCard(def){ return { ...def, uid: UID++, power: def.p, base: def.p, ghost:false, lockedRound:0, aegis:false, revivedShield:false, asleep:false, revealPending:false, venom:0, doomed:false, disguisedAs:null, ward:false, bound:false, astraImmuneRound:0, stolenBy:-1 }; }
function shuffle(a, rng){ for (let i=a.length-1;i>0;i--){ const j=Math.floor(rng()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }

function mkPlayer(name, rng, faction='devas', spec){
  const src = DECKS[faction] || DECKS.devas;
  let deck, hand;
  if (spec && (spec.deck || spec.hand || spec.handSize!=null)){
    // opts.scenario injection (read ONLY when present — opts.realm precedent). Custom decklist → ordered, NO shuffle; else the normal shuffled faction deck.
    deck = spec.deck ? spec.deck.map(n=>{ const d=CARD_BY_NAME[n]; if (!d) throw new Error(`opts.scenario: unknown card name "${n}"`); return mkCard(d); }) : shuffle(src.map(mkCard), rng);   // hard error on a bad name (authoring safety, design ruling)
    if (spec.hand){ hand=[]; for (const n of spec.hand){ const i=deck.findIndex(c=>c.n===n); if (i<0) throw new Error(`opts.scenario: hand card "${n}" is not in the deck`); hand.push(deck.splice(i,1)[0]); } }   // opening hand = named cards pulled from the deck
    else hand = deck.splice(0, spec.handSize!=null ? spec.handSize : 10);
  } else {
    deck = shuffle(src.map(mkCard), rng);                              // ↓ absent/empty scenario: byte-identical to pre-scenario code
    hand = deck.splice(0,10);
  }
  return { name, faction, deck, hand, discard:[],
    units:[], heroes:[], artifact:null,
    passed:false, roundWins:0,
    heroPlayedThisRound:false, astrasThisRound:0,
    artifactsDestroyedByMe:0, removedHeroes:[],
    skipNext:false, mahabaliArm:-1, chaosThisRound:false, seesOppHand:false,
    shieldUids:[], leapsUsed:0,
    boardTokens:0, surasaTrap:false, astikaPause:false, sarpaDouble:false, venomStrike:0, mustPlayUnit:false,
    mulliganed:false, manualShield:false };
}

/* MULLIGAN (GDD §2.2): before Round 1, a player may swap up to 3 cards — returned to deck, reshuffled, redraw the
   same count. Consumes rng (reshuffle) only when cards are actually swapped. */
function mulligan(g, pi, uids){
  const pl=g.players[pi];
  const cap = g.mulliganCount!=null ? g.mulliganCount : 3;               // opts.scenario.mulligan (0 disables); default 3
  if (g.round!==1 || g.roundHistory.length || pl.mulliganed || cap<=0) return [];   // pre-Round-1, once
  const swap=(uids||[]).slice(0,cap).map(u=>pl.hand.find(c=>c.uid===u)).filter(Boolean);
  pl.mulliganed=true;
  if (!swap.length) return [];
  for (const c of swap){ pl.hand.splice(pl.hand.indexOf(c),1); pl.deck.push(c); }
  shuffle(pl.deck, g.rng);
  const redrawn=pl.deck.splice(0, swap.length); pl.hand.push(...redrawn);
  log(g, `${pl.name} mulligans ${swap.length} card(s).`);
  emit(g,'toast',{abilityName:'Mulligan',text:`${pl.name} redraws ${swap.length}`});
  return redrawn.map(c=>c.uid);
}
// AI mulligan heuristic: toss dead conditionals (Marut w/o Vayu, Kali, Riksha/Kesari w/o Hanuman) and low vanilla
// filler, keep the curve, never ditch your only Hero. Returns up to 3 uids.
function aiMulliganPlan(g, pi){
  const pl=g.players[pi], hand=pl.hand;
  const has=id=>hand.some(c=>c.id===id);
  const heroCount=hand.filter(c=>c.t==='hero').length;
  const bad=[];
  for (const c of hand){
    let b=0;
    if (c.id==='marut' && !has('vayu')) b+=3;                          // dead without Vayu
    if (c.id==='kali') b+=2;                                            // needs a prior Chaos Surge
    if (c.id==='riksha' && !has('hanuman')) b+=1.5;
    if (c.id==='kesari' && !has('hanuman')) b+=1.5;
    if (c.id==='marut' && has('vayu')) b-=1;
    if (c.id==='soldier') b+=1.2;                                      // 2-power vanilla unless Indra
    if (c.id==='gandharva') b+=1;                                     // needs a wide board
    if (c.id==='nagahatchling') b+=1;                                 // needs enemy Venom Tokens
    if (b>0 && !(c.t==='hero' && heroCount<=1)) bad.push([c,b]);      // keep your only Hero
  }
  bad.sort((a,b)=>b[1]-a[1]);
  const cap = g.mulliganCount!=null ? g.mulliganCount : 3;   // opts.scenario.mulligan (0 disables); default 3
  return bad.slice(0, cap).map(([c])=>c.uid);
}

function newGame(opts={}){
  const rng = opts.rng || Math.random;
  const sc = opts.scenario;                              // opts.scenario: additive, read ONLY when present (opts.realm precedent). Absent/empty → identical behavior + rng sequence.
  const g = {
    rng, round:1, over:false, winner:null,
    players:[ mkPlayer(opts.p0||'You', rng, opts.p0Faction||'devas', sc && {deck:sc.p0Deck, hand:sc.p0Hand, handSize:sc.handSize}),
              mkPlayer(opts.p1||'Opponent', rng, opts.p1Faction||'devas', sc && {deck:sc.p1Deck, hand:sc.p1Hand, handSize:sc.handSize}) ],
    turn: rng()<0.5?0:1, lastMantra:null, log:[], events:[],
    roundHistory:[],
    lastKillThisRound:null, astraPlays:0, astraBanaCount:0, grantExtraTurn:null,
    lastCardThisRound:null,                            // Kalki Kshetra: {uid, isBody}
  };
  // scenario knobs — each defaults to today's hardcoded value, so an absent/empty scenario is a full no-op (no rng consumed here).
  g.winTarget     = (sc && sc.winTarget!=null) ? sc.winTarget : 2;   // rounds needed to win the match (best-of-3 default)
  g.drawCount     = (sc && sc.draws!=null)     ? sc.draws     : 2;   // between-round draw count (realm bonus still added on top)
  g.mulliganCount = (sc && sc.mulligan!=null)  ? sc.mulligan  : 3;   // mulligan swaps allowed; 0 disables the phase
  // Realm: fixed via opts.realm consumes NO rng (so a fixed-realm test stays byte-identical); random default draws one.
  g.realm = opts.realm || REALMS[Math.floor(rng()*REALMS.length)];
  g.firstThisRound = g.turn;
  log(g, `Cosmic Realm: ${REALM_INFO[g.realm].name} — ${REALM_INFO[g.realm].fx}`);
  { const nm=g.players[g.turn].name; log(g, `Coin flip \u2014 ${nm} ${nm==='You'?'play':'plays'} first.`); }
  onTurnStart(g, g.turn);
  return g;
}

function log(g, msg){ g.log.push({ round:g.round, msg }); }
/* Structured event stream — the UI choreographs these SEQUENTIALLY. Purely OBSERVATIONAL:
   emit() never touches game state or g.rng, so outcomes are byte-identical whether or not g.events
   is consumed. Every damage / buff / destroy / revive / trigger / token / faction-passive emits one. */
function emit(g, type, o){
  o = o||{};
  if (!g.events) g.events = [];
  g.events.push({ round:g.round, seq:g.events.length, type,
    sourceUid: o.sourceUid==null?null:o.sourceUid,
    targetUids: o.targetUids||[], amount: o.amount==null?null:o.amount,
    abilityName: o.abilityName||null, text: o.text||null });
}

/* ---------- power & shields ---------- */
function indraOnBoard(pl){ return pl.heroes.some(h=>h.id==='indra'); }
function effPower(g, pi, c){
  if (c.t==='hero') return c.power + (g.realm==='swarga'?1:0);   // Swarga realm: all Heroes +1 for the match
  // EXP-G (ruling revision): Kumbhakarna's power DOES count while asleep — 'asleep' now only defers his wake-sweep.
  let p = c.power;
  if (!c.ghost && indraOnBoard(g.players[pi])) p += 1;   // Indra aura (Deva)
  if (!c.ghost && c.id==='warrior'){                     // Vanara Warrior: +1 per other Vanara Unit (max +4)
    const n = g.players[pi].units.filter(u=>!u.ghost && u!==c).length;
    p += Math.min(4, n);
  }
  if (!c.ghost && c.id==='nagawarrior') p += venomTokenCount(g);   // Naga Warrior: +1 per Venom Token on the board
  return p;
}
/* EXP-A (GDD-accurate Dharma Shield): the shield is a STICKY designation, not dynamic re-targeting.
   At each shield opportunity (a Deva Unit hitting the board) an open slot latches onto the highest-power
   unshielded Unit and STAYS there for the round — even if a bigger Unit arrives later or the shielded one
   dies (the shield dies with it). Dharma Kavacha = 2 sticky slots. */
function shieldCap(pl){ return pl.artifact && pl.artifact.id==='kavacha' ? 2 : 1; }
function designateShields(g, pi){
  const pl = g.players[pi];
  if (pl.faction!=='devas') return;
  if (pl.manualShield) return;   // human designates Dharma Shield manually (see designateShield) — no auto-assignment
  const cap = shieldCap(pl);
  while (pl.shieldUids.length < cap){
    const cands = pl.units.filter(u=>!u.ghost && !pl.shieldUids.includes(u.uid));
    if (!cands.length) break;
    const pick = cands.reduce((a,b)=>effPower(g,pi,a)>=effPower(g,pi,b)?a:b);   // AI designates highest-power
    pl.shieldUids.push(pick.uid);
    emit(g,'toast',{abilityName:'Dharma Shield',text:'Dharma Shield'});
    emit(g,'shield',{targetUids:[pick.uid],abilityName:'Dharma Shield',text:`${pick.n} shielded`});
  }
}
// Manual Dharma Shield designation (human): sticky (EXP-A), one Unit per call, up to cap (Kavacha=2). No un-designate.
function designateShield(g, pi, uid){
  const pl = g.players[pi];
  if (pl.faction!=='devas' || pl.shieldUids.length >= shieldCap(pl)) return false;
  const u = pl.units.find(x=>!x.ghost && x.uid===uid && !pl.shieldUids.includes(uid));
  if (!u) return false;
  pl.shieldUids.push(uid);
  log(g, `${pl.name} raises Dharma Shield over ${u.n}.`);
  emit(g,'toast',{abilityName:'Dharma Shield',text:'Dharma Shield'});
  emit(g,'shield',{targetUids:[uid],abilityName:'Dharma Shield',text:`${u.n} shielded`});
  return true;
}
function shieldedSet(g, pi){
  // Dharma Shield is the DEVA faction passive — Asura (and other) units never hold it.
  const pl = g.players[pi];
  if (pl.faction!=='devas') return new Set();
  const set = new Set(pl.shieldUids);                         // sticky designations (dead uids harmlessly ignored)
  for (const u of pl.units) if (!u.ghost && u.revivedShield) set.add(u.uid); // Gayatri revival shield
  return set;
}
function isShielded(g, pi, c){ return shieldedSet(g, pi).has(c.uid); }

/* ---------- Vanara: faction helpers, positioning, LEAP ---------- */
function heroOnBoard(pl, id){ return pl.heroes.some(h=>h.id===id); }
function hasUnit(pl, id){ return pl.units.some(u=>!u.ghost && u.id===id); }
// Hanuman's on-entry bonus: +1, or +2 while Jambavan is on the board; 0 without Hanuman.
function hanumanEntryBonus(pl){ return heroOnBoard(pl,'hanuman') ? (hasUnit(pl,'jambavan')?2:1) : 0; }
// Rama's Signet active for a Vanara player.
function signetActive(pl){ return pl.faction==='vanaras' && pl.artifact && pl.artifact.id==='ramasignet'; }
// Positioning: Units occupy ordered slots in pl.units (index = position). Adjacency = array neighbours.
function adjacentUnits(pl, unit){
  const i = pl.units.indexOf(unit); if (i<0) return [];
  return [pl.units[i-1], pl.units[i+1]].filter(Boolean);
}
function leapLimit(pl){ return (pl.artifact && pl.artifact.id==='kishkindhacrown') ? 2 : 1; }
// LEAP: `leaper` copies `target`'s current power (§9: power only — not the shield). Crown → both +2. free = Mainda's bonus.
function doLeap(g, pi, leaper, target, free){
  const pl = g.players[pi];
  leaper.power = effPower(g, pi, target);
  log(g, `Leap! ${leaper.n} copies ${target.n} → ${leaper.power}.`);
  emit(g,'toast',{abilityName:'Leap',text:'Leap!'});
  emit(g,'buff',{sourceUid:leaper.uid,targetUids:[leaper.uid],amount:null,abilityName:'Leap',text:`copies ${target.n}`});
  if (pl.artifact && pl.artifact.id==='kishkindhacrown'){ leaper.power += 1; target.power += 1; log(g, `Kishkindha Crown: ${leaper.n} and ${target.n} both +1.`); emit(g,'buff',{targetUids:[leaper.uid,target.uid],amount:1,abilityName:'Kishkindha Crown',text:'+1'}); }   // EXP-E: +1/+1 (was +2/+2)
  if (!free) pl.leapsUsed++;
}
// AI helper: best beneficial (leaper, adjacent target) pair by power gain.
function bestLeap(g, pi){
  const pl = g.players[pi]; let best=null;
  for (const u of pl.units){
    if (u.ghost) continue;
    for (const t of adjacentUnits(pl, u)){
      if (t.ghost || t===u) continue;
      const gain = effPower(g,pi,t) - effPower(g,pi,u);
      if (gain>0 && (!best || gain>best.gain)) best={ leaper:u, target:t, gain };
    }
  }
  return best;
}
function canLeap(g, pi){
  const pl = g.players[pi];
  return pl.faction==='vanaras' && pl.leapsUsed < leapLimit(pl) && !!bestLeap(g, pi);
}
function totalPower(g, pi){
  const pl = g.players[pi];
  let t = 0;
  for (const h of pl.heroes) if (!h.bound) t += effPower(g, pi, h);   // Takshaka+Nagapasha can bind a Hero (§9)
  for (const u of pl.units)  if (!u.bound) t += effPower(g, pi, u);   // Nagapasha-bound Units contribute 0
  return t;
}

/* ================= VENOM PIPELINE (Naga) — one ordered system =================
   Base drain (faction passive: enemy Units −N at each tick) + Venom Tokens (per-unit).
   Order per tick: pause check → passive drain → token drain → Ananta board-tokens → sweep.
   Amount is ADDITIVE (R11 Patala + Vasuki-R3 + Venom Strike); timing is round-end, or
   per-opponent-turn while Karkotaka is on the Naga board (R10). Signet/Pavamana counter tokens. */
function isNaga(pl){ return pl.faction==='nagas'; }
function nagaHasUnit(pl, id){ return pl.units.some(u=>!u.ghost && u.id===id); }
// Total Venom Tokens visible on the board (per-unit stacks both sides + Ananta board-coils). Naga Warrior scales on this.
function venomTokenCount(g){
  let n=0;
  for (let s=0;s<2;s++){ for (const u of g.players[s].units) if (!u.ghost) n+=(u.venom||0); n+=g.players[s].boardTokens; }
  return n;
}
// Per-Unit passive drain for Naga np this round (additive; ruling: Patala + Vasuki-R3 + Strike stack).
function drainAmount(g, np){
  const pl=g.players[np]; let amt=1;
  if (pl.artifact && pl.artifact.id==='patala') amt += g.round;            // R11: −(1+round)
  if (heroOnBoard(pl,'vasuki') && g.round===3) amt += 1;                   // Vasuki R3 passive → −2 base
  if (pl.venomStrike===g.round) amt += (heroOnBoard(pl,'vasuki')?3:2);     // Venom Strike this round → +2 (+3 w/Vasuki)
  return amt;
}
// A Venom power loss to unit u (owner pi). §9: Signet FLOORS friendly Vanara Units at 1 (the drain still applies,
// grinding them down — but never below 1, never destroyed). Token negation is handled separately in venomTokens (b).
function venomLoss(g, pi, u, amt){
  const before=u.power;
  if (signetActive(g.players[pi]) && u.t==='unit'){ u.power = Math.max(1, u.power - amt); emit(g,'venom',{targetUids:[u.uid],amount:u.power-before,abilityName:'Venom',text:'☠'}); return; }   // §9 Signet: floor, not immunity
  u.power -= amt;
  if (u.power<1 && u.id==='hiranya') u.power=1;                            // Hiranyakashipu endures venom
  emit(g,'venom',{targetUids:[u.uid],amount:u.power-before,abilityName:'Venom',text:'☠'});
}
// PASSIVE drain: Naga np drains its opponent's surviving Units. Skips Astika-paused / Mohini-stolen Units.
function venomPassive(g, np, amtOverride){
  const opp=1-np, o=g.players[opp];
  if (o.astikaPause) return;
  const amt = amtOverride!=null ? amtOverride : drainAmount(g, np);   // EXP-L: Karkotaka per-turn tick passes a flat 1
  const foes=o.units.filter(u=>!u.ghost && u.stolenBy!==np);
  if (!foes.length) return;
  emit(g,'toast',{abilityName:'Venom',text:`Venom drains ${o.name}’s Units −${amt}`});
  for (const u of foes) venomLoss(g, opp, u, amt);
  log(g, `Venom drains ${o.name}’s Units −${amt} each.`);
}
// TOKEN drain (R13: drains bearer on any side) + Ananta board-tokens. Sarpa Satra doubles tokens on the caster's foes.
function venomTokens(g){
  for (let pi=0;pi<2;pi++){
    if (g.players[pi].astikaPause) continue;
    const dbl=g.players[1-pi].sarpaDouble ? 2 : 1;
    for (const u of g.players[pi].units){
      if (u.ghost || !u.venom) continue;
      if (signetActive(g.players[pi]) && u.t==='unit') continue;          // §9 (b): Venom Tokens are NEGATED on friendly Vanara Units
      venomLoss(g, pi, u, u.venom*dbl);
    }
  }
  for (let np=0;np<2;np++){                                                 // R14: Ananta Coil board-tokens (persist all match)
    const pl=g.players[np], opp=1-np;
    if (pl.boardTokens>0 && !g.players[opp].astikaPause){
      for (let k=0;k<pl.boardTokens;k++){
        const foes=g.players[opp].units.filter(u=>!u.ghost && u.stolenBy!==np);
        if (foes.length) venomLoss(g, opp, foes[Math.floor(g.rng()*foes.length)], 1);
      }
    }
  }
}
// EXP-L2 (R10 revision): while a Karkotaka Naga is on board, the drain is a SINGLE flat −1 tick fired the
// moment the first player passes each round (early snipe) — no longer per-opponent-turn. Escalation modifiers
// ride only the (non-Karkotaka) round-end tick. Called once, from pass(), on the first pass of the round.
function venomKarkotakaEarly(g){
  for (let np=0;np<2;np++){
    if (!isNaga(g.players[np]) || !nagaHasUnit(g.players[np],'karkotaka')) continue;
    const opp=1-np;
    if (g.players[opp].astikaPause){ g.players[opp].astikaPause=false; log(g, `Astika’s calm holds the venom back.`); continue; }
    venomPassive(g, np, 1);
  }
  sweepDeaths(g);
}
// The round-end tick (before scoring): non-Karkotaka Naga passives + all tokens. R1 death-at-0 via sweep.
function venomRoundEnd(g){
  for (let np=0;np<2;np++) if (isNaga(g.players[np]) && !nagaHasUnit(g.players[np],'karkotaka')) venomPassive(g, np);
  venomTokens(g);
  g.players[0].astikaPause=false; g.players[1].astikaPause=false;
  sweepDeaths(g);
}

/* ---------- destruction / damage ---------- */
// \u00a79: Hiranyakashipu cannot be destroyed by any Astra \u2014 EXCEPT Brahmastra (which overrides immunity).
const ASTRA_KILL = new Set(['Vajra','Brahmastra','Pashupatastra']);
function isAstraImmune(unit, cause){ return unit.id==='hiranya' && ASTRA_KILL.has(cause) && cause!=='Brahmastra'; }

function destroyUnit(g, pi, unit, cause){
  const pl = g.players[pi];
  if (isAstraImmune(unit, cause)){ log(g, `${unit.n} shrugs off the Astra \u2014 immune.`); emit(g,'block',{targetUids:[unit.uid],abilityName:cause,text:`${unit.n} immune`}); return; }
  // R8: Kishkindha Oath ward \u2014 the next destruction is prevented; unit survives at 1, others rally +1.
  if (unit.ward && !unit.ghost){
    unit.ward=false; unit.power=1;
    log(g, `Kishkindha Oath \u2014 ${unit.n} refuses to fall, surviving at 1 power!`);
    emit(g,'ward',{targetUids:[unit.uid],abilityName:'Kishkindha Oath',text:`${unit.n} survives at 1`});
    for (const u of pl.units) if (!u.ghost && u!==unit) u.power+=1;
    return;
  }
  const ix = pl.units.indexOf(unit); if (ix<0) return;
  pl.units.splice(ix,1);
  log(g, `${unit.n} is destroyed (${cause}).`);
  emit(g,'destroy',{targetUids:[unit.uid],abilityName:cause,text:`${unit.n} destroyed`});
  if (unit.aegis && !unit.ghost){
    unit.aegis=false; unit.power=1;
    pl.units.push(unit);
    log(g, `Amrita Kalasha revives ${unit.n} at 1 power!`);
    emit(g,'revive',{targetUids:[unit.uid],abilityName:'Amrita Kalasha',text:`${unit.n} revives at 1`});
    return;
  }
  if (!unit.ghost){
    pl.discard.push(unit);
    g.lastKillThisRound = { owner: pi, unit };            // for Sanjivani Corruption
    // R14: Ananta Coil — a destroyed friendly Naga Unit leaves a permanent Venom Coil (persists all match).
    if (pl.faction==='nagas' && pl.artifact && pl.artifact.id==='anantacoil'){ pl.boardTokens++; log(g, `Ananta Coil: ${unit.n}’s venom lingers on the field.`); emit(g,'passive',{abilityName:'Ananta Coil',text:'A Venom Coil lingers'}); }
    if (pl.units.some(u=>u.id==='yama')){
      pl.units.push({ uid:UID++, id:'ghost', n:`Ghost of ${unit.n}`, sub:'Yama\u2019s token', t:'unit', p:1, r:'C', power:1, base:1, ghost:true, txt:'' });
      log(g, `Yama binds a 1-power ghost of ${unit.n} to the row.`);
    }
  }
}
function damageUnit(g, pi, unit, amt, cause){
  if (g.realm==='patala' && ASTRA_DMG.has(cause)) amt += 1;   // Patala realm: all Astra damage +1
  unit.power -= amt;
  log(g, `${unit.n} takes ${amt} damage (${cause}) \u2192 ${Math.max(unit.power,0)}.`);
  emit(g,'damage',{targetUids:[unit.uid],amount:-amt,abilityName:cause,text:`\u2212${amt}`});
  if (unit.power<=0){
    if (isAstraImmune(unit, cause)){ unit.power=1; log(g, `${unit.n} endures the Astra \u2014 floors at 1.`); emit(g,'block',{targetUids:[unit.uid],abilityName:cause,text:`${unit.n} floors at 1`}); return; }
    // Rama's Signet: friendly Vanara Units cannot be reduced below 1 by any effect (damage floors, no death).
    if (!unit.ghost && signetActive(g.players[pi])){ unit.power=1; log(g, `Rama's Signet holds ${unit.n} at 1.`); emit(g,'block',{targetUids:[unit.uid],abilityName:"Rama's Signet",text:`held at 1`}); return; }
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

/* CHAOS SURGE \u2014 Asura faction passive. Fires when the Asura player plays an Astra OR a Mantra (EXP-H):
   one random friendly Unit gains +3 (EXP-C). Chandrahas makes it fire twice while active. */
function chaosSurge(g, pi, times, amount=3){
  const pl=g.players[pi];
  if (pl.faction!=='asuras') return;
  for (let k=0;k<times;k++){
    const real=pl.units.filter(u=>!u.ghost);
    if (!real.length) continue;
    const u=real[Math.floor(g.rng()*real.length)];
    u.power+=amount;                                        // EXP-C: +3 from spells; EXP-I: +2 from Unit plays
    log(g, `Chaos Surge! ${u.n} +${amount} \u2192 ${u.power}.`);
    emit(g,'toast',{abilityName:'Chaos Surge',text: amount===1 ? 'Chaos finds a way\u2026' : 'Chaos Surge!'});
    emit(g,'buff',{sourceUid:u.uid,targetUids:[u.uid],amount,abilityName:'Chaos Surge',text:`+${amount}`});
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
      if (u.id==='bana'){ const inc=doubled?2:1; u.power+=inc; log(g, `Bana Asura\u2019s arms multiply (+${inc} \u2192 ${u.power}).`); emit(g,'buff',{sourceUid:u.uid,targetUids:[u.uid],amount:inc,abilityName:'Bana Asura',text:`+${inc}`}); }
      else if (u.id==='berserker'){ u.power+=1; log(g, `Asura Berserker rages (+1 \u2192 ${u.power}).`); emit(g,'buff',{sourceUid:u.uid,targetUids:[u.uid],amount:1,abilityName:'Asura Berserker',text:`+1`}); }
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
    // GDD fidelity: (a) remove ALL debuffs (net power loss) AND Venom Tokens from ALL friendly Units;
    // (b) grant +1 power PER effect removed — one for the power-debuff, one per Venom Token. v0.1 dropped (b) for tokens.
    let cleansed=0, effects=0;
    for (const u of pl.units){
      if (u.ghost) continue;
      const deb = u.power < u.base ? 1 : 0;              // engine represents a debuff as net power below base
      const tok = u.venom||0;                            // each Venom Token is a removable effect
      if (deb+tok===0) continue;                         // nothing to cleanse — don't disturb clean / buffed Units
      if (deb) u.power = u.base;                          // (a) heal the net debuff (preserve any buff above base)
      u.venom = 0;                                        // (a) strip Venom Tokens
      u.power += deb + tok;                               // (b) +1 power PER effect removed
      effects += deb + tok; cleansed++;
    }
    log(g, cleansed ? `Pavamana purifies ${cleansed} Unit(s) — ${effects} effect(s) lifted, +1 power each.` : 'Pavamana: nothing to purify.');
  } else if (id==='mrityunjaya'){
    // R13: revive ANY destroyed Unit (either discard) onto your board at full power; it takes a Venom Token.
    const pool=[]; for (let s=0;s<2;s++) for (const u of g.players[s].discard) if (u.t==='unit' && !u.ghost) pool.push([s,u]);
    if (pool.length){ const [s,t] = targetUid!=null ? (pool.find(x=>x[1].uid===targetUid)||pool.reduce((a,b)=>a[1].base>=b[1].base?a:b)) : pool.reduce((a,b)=>a[1].base>=b[1].base?a:b);
      g.players[s].discard.splice(g.players[s].discard.indexOf(t),1);
      t.power=t.base; t.venom=1; t.bound=false; t.stolenBy=-1; t.aegis=false; t.revivedShield=false; t.ward=false; t.asleep=false; t.doomed=false; t.revealPending=false; t.astraImmuneRound=0;
      pl.units.push(t); log(g, `Mrityunjaya wrests ${t.n} from death — it rises venom-marked (Token).`);
    } else log(g, 'Mrityunjaya: no fallen Unit to reclaim.');
  } else if (id==='sarpasatra'){
    const real=pl.units.filter(u=>!u.ghost);
    if (real.length){
      let sac = targetUid!=null ? real.find(u=>u.uid===targetUid) : null;
      if (!sac) sac = real.reduce((a,b)=>effPower(g,pi,a)<=effPower(g,pi,b)?a:b);   // default: offer the weakest
      const dmg = effPower(g,pi,sac);
      destroyUnit(g, pi, sac, 'Sarpa Satra');                                        // triggers Ananta Coil hook
      const foes=opp.units.filter(u=>!u.ghost);
      for (const f of [...foes]) damageUnit(g, 1-pi, f, dmg, 'Sarpa Satra');
      pl.sarpaDouble=true;                                                           // Venom Tokens deal double this round
      log(g, `Sarpa Satra — ${sac.n} is offered; the enemy line withers −${dmg}, and Venom runs double this round.`);
    } else log(g, 'Sarpa Satra: no Naga Unit to sacrifice.');
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
  } else if (id==='ramanaam'){
    // §9: cannot be countered by any Naga effect this round (dormant hook — Nagas not built).
    const buff = 2;   // EXP-D: flat +2 (dropped Hanuman upgrade)
    for (const u of pl.units) if (!u.ghost) u.power+=buff;
    log(g, `Rama Naam resounds — all Vanara Units +${buff}.`);
  } else if (id==='kishkindhaoath'){
    const real=pl.units.filter(u=>!u.ghost);
    if (!real.length){ log(g, 'Kishkindha Oath: no Vanara Unit to ward.'); }
    else {
      let t = targetUid!=null ? real.find(u=>u.uid===targetUid) : null;
      if (!t) t = real.reduce((a,b)=>effPower(g,pi,a)>=effPower(g,pi,b)?a:b);   // AI wards the strongest
      t.ward=true;
      log(g, `Kishkindha Oath wards ${t.n} — it will survive its next fall this round.`);
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
// Sharabha: the opponent cannot target the Vanara player's Units of power ≤3 with Astras.
function sharabhaProtected(g, ownerPi, unit){
  const pl=g.players[ownerPi];
  return !unit.ghost && pl.units.some(u=>!u.ghost && u.id==='sharabha') && effPower(g,ownerPi,unit)<=3;
}
// Any reason unit (owned by ownerPi) is an illegal Astra target: Dharma Shield, Sharabha, or Ulupi's round immunity.
function astraProtected(g, ownerPi, unit){
  return isShielded(g,ownerPi,unit) || sharabhaProtected(g,ownerPi,unit) || unit.astraImmuneRound===g.round;
}

function playableIndices(g, pi){
  const pl=g.players[pi], opp=g.players[1-pi], res=[];
  pl.hand.forEach((c,i)=>{
    if (c.lockedRound===g.round) return;
    if (pl.mustPlayUnit && (c.t==='astra'||c.t==='mantra')) return;   // Naga Enchantress: next card must be a Unit
    if (c.t==='hero' && pl.heroPlayedThisRound) return;
    if (c.t==='astra'){
      if (opp.heroes.some(h=>h.id==='varuna') && pl.astrasThisRound>=1) return;
      if (c.id==='vajra'){
        const indra = indraOnBoard(pl);
        const targets = opp.units.filter(u=>!u.ghost && !astraProtected(g,1-pi,u) && (indra || effPower(g,1-pi,u)>=6));
        if (!targets.length) return;
      }
      if (c.id==='sudarshana' && !opp.heroes.length) return;
      if (c.id==='brahmastra' && !opp.units.some(u=>!u.ghost)) return;
      if ((c.id==='pashupata'||c.id==='nagastra'||c.id==='lankadahan') && !opp.units.some(u=>!u.ghost)) return;
      if (c.id==='gandiva' && !opp.units.some(u=>!u.ghost && !astraProtected(g,1-pi,u))) return;
      if (c.id==='sanjeevani'){ const lk=g.lastKillThisRound; if (!(lk && lk.owner===pi && pl.discard.includes(lk.unit))) return; }
      // ---- Naga astras ----
      if (c.id==='nagapasha'){
        const bindUnit = opp.units.some(u=>!u.ghost && !u.bound && !astraProtected(g,1-pi,u));
        const bindHero = heroOnBoard(pl,'takshaka') && opp.heroes.some(h=>!h.bound);   // §9 Takshaka
        if (!bindUnit && !bindHero) return;
      }
      if (c.id==='mohini' && !opp.units.some(u=>!u.ghost && !u.bound && !astraProtected(g,1-pi,u))) return;
      // venomstrike is always legal (self-buff, useful even pre-emptively)
    }
    if (c.t==='mantra'){
      if (c.id==='gayatri' && !pl.discard.some(x=>x.t==='unit')) return;
      if ((c.id==='ahamkara'||c.id==='kishkindhaoath') && !pl.units.some(u=>!u.ghost)) return;
      if (c.id==='sanjivani'){ const lk=g.lastKillThisRound; if (!(lk && lk.owner===1-pi && opp.discard.includes(lk.unit))) return; }
      if (c.id==='sarpasatra' && !pl.units.some(u=>!u.ghost)) return;
      if (c.id==='mrityunjaya' && !g.players[0].discard.concat(g.players[1].discard).some(u=>u.t==='unit' && !u.ghost)) return;
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
    return { kind:'enemyUnit', options: opp.units.filter(u=>!u.ghost && !astraProtected(g,1-pi,u) && (indra||effPower(g,1-pi,u)>=6)) };
  }
  if (card.id==='gandiva') return { kind:'enemyUnit', options: opp.units.filter(u=>!u.ghost && !astraProtected(g,1-pi,u)) };
  if (card.id==='sudarshana') return { kind:'enemyHero', options:[...opp.heroes] };
  if (card.id==='saraswati' && opp.hand.length) return { kind:'oppHandCard', options:[...opp.hand] };
  if (card.id==='ahamkara' || card.id==='kishkindhaoath' || card.id==='sarpasatra') return { kind:'friendlyUnit', options: g.players[pi].units.filter(u=>!u.ghost) };
  // ---- Naga targeted cards ----
  if (card.id==='nagapasha'){
    let opts = opp.units.filter(u=>!u.ghost && !u.bound && !astraProtected(g,1-pi,u));
    if (heroOnBoard(g.players[pi],'takshaka')) opts = opts.concat(opp.heroes.filter(h=>!h.bound));   // §9 Takshaka breaks Hero immunity
    return { kind:'enemyUnit', options:opts };
  }
  if (card.id==='mohini') return { kind:'enemyUnit', options: opp.units.filter(u=>!u.ghost && !u.bound && !astraProtected(g,1-pi,u)) };
  if (card.id==='ashvatara' || card.id==='nagaarcher') return { kind:'enemyUnit', options: opp.units.filter(u=>!u.ghost) };
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
      if (foes.length) emit(g,'token',{targetUids:foes.map(u=>u.uid),abilityName:'Nagastra',text:'Venom Token'});
      log(g, foes.length?`Nagastra envenoms ${foes.length} enemy Unit(s).`:'Nagastra hisses at empty air.'); break;
    }
    case 'tamasa':
      opp.skipNext=true;
      log(g, `Tamasa smothers ${opp.name}’s next turn.`); break;
    case 'gandiva': {
      const spec=targetSpec(g,pi,c);
      if (!spec.options.length){ log(g,'Gandiva Arrow finds no mark.'); break; }
      let t = targetUid!=null ? spec.options.find(u=>u.uid===targetUid) : null;
      if (!t) t = spec.options.reduce((a,b)=>effPower(g,1-pi,a)>=effPower(g,1-pi,b)?a:b);
      log(g,'Gandiva Arrow flies true!'); destroyUnit(g, 1-pi, t, 'Gandiva');
      if (pl.leapsUsed>0){                                    // a Vanara Leaped this round → a second shaft
        const more=opp.units.filter(u=>!u.ghost && !astraProtected(g,1-pi,u));
        if (more.length){ const t2=more.reduce((a,b)=>effPower(g,1-pi,a)>=effPower(g,1-pi,b)?a:b); log(g,'The Leap empowers a second shaft!'); destroyUnit(g, 1-pi, t2, 'Gandiva'); }
      }
      break; }
    case 'lankadahan':
      log(g,'Lanka Dahan blazes across the field.');
      for (const u of [...opp.units]) if (!u.ghost) damageUnit(g, 1-pi, u, 2, 'Lanka Dahan');
      for (const u of pl.units) if (!u.ghost) u.power+=1;
      log(g,'The fire inspires the host: all Vanara Units +1.'); break;
    case 'sanjeevani': {
      const lk=g.lastKillThisRound;
      if (lk && lk.owner===pi && pl.discard.includes(lk.unit)){
        const u=lk.unit; pl.discard.splice(pl.discard.indexOf(u),1);
        u.power=u.base; u.aegis=false; u.revivedShield=false; u.venom=0; u.asleep=false; u.doomed=false; u.ward=false;
        const hb = u.base>=4 ? hanumanEntryBonus(pl) : 0; if (hb) u.power+=hb;   // EXP-F: entry bonus only for printed ≥4
        pl.units.push(u); g.lastKillThisRound=null;
        log(g,`Sanjeevani Call revives ${u.n} at full power${hb?` (+${hb} Hanuman)`:''}.`);
      } else log(g,'Sanjeevani Call: no fallen ally to revive.'); break; }
    // ---- Naga astras ----
    case 'nagapasha': {
      const spec=targetSpec(g,pi,c);
      if (!spec.options.length){ log(g,'Nagapasha finds nothing to bind.'); break; }
      let t = targetUid!=null ? spec.options.find(u=>u.uid===targetUid) : null;
      if (!t) t = spec.options.reduce((a,b)=>effPower(g,1-pi,a)>=effPower(g,1-pi,b)?a:b);
      t.bound=true;
      log(g, `Nagapasha nooses ${t.n} — it cannot fight until ${opp.name} spends a turn to free it.`); break; }
    case 'venomstrike':
      pl.venomStrike=g.round;
      log(g, `Vasuki Venom Strike — the Venom runs ${heroOnBoard(pl,'vasuki')?'quadruple':'triple'} this round.`); break;
    case 'mohini': {
      const spec=targetSpec(g,pi,c);
      if (!spec.options.length){ log(g,'Mohini finds no mind to snare.'); break; }
      let t = targetUid!=null ? spec.options.find(u=>u.uid===targetUid) : null;
      if (!t) t = spec.options.reduce((a,b)=>effPower(g,1-pi,a)>=effPower(g,1-pi,b)?a:b);
      const ti=opp.units.indexOf(t);
      if (ti>=0){ opp.units.splice(ti,1); t.stolenBy=pi; t.origOwner=1-pi; pl.units.push(t);
        log(g, `Mohini’s illusion turns ${t.n} to ${pl.name}’s side (exempt from your Venom).`); }
      break; }
  }
}

/* ---------- play a card ---------- */
function playCard(g, pi, handIndex, targetUid=null, position=null){
  const pl=g.players[pi], opp=g.players[1-pi];
  const c = pl.hand[handIndex];
  if (!c) throw new Error('bad hand index');
  pl.hand.splice(handIndex,1);
  pl.mustPlayUnit=false;                                   // consume Naga Enchantress restriction (this card satisfies it)
  log(g, `${pl.name} plays ${c.n}${c.sub?' \u2014 '+c.sub:''}.`);
  emit(g,'play',{sourceUid:c.uid,abilityName:c.n,text:`${pl.name} plays ${c.n}`});

  // R12: Surasa's trap on the opponent's next card \u2014 a Unit is sapped (\u22122) and feeds Surasa (+2); an Astra is negated.
  let surasaNegateAstra=false;
  if (opp.surasaTrap){
    const sur = opp.units.find(u=>u.uid===opp.surasaTrap && !u.ghost);
    if (c.t==='unit'){ c.power-=2; if (sur) sur.power+=2; opp.surasaTrap=false;
      log(g, `Surasa\u2019s trap saps ${c.n} (\u22122)${sur?` and feeds Surasa (+2 \u2192 ${sur.power})`:''}.`); }
    else if (c.t==='astra'){ surasaNegateAstra=true; opp.surasaTrap=false;
      log(g, `Surasa\u2019s trap swallows ${c.n} \u2014 its effect is negated (Chaos Surge still churns, \u00a79).`); }
    else { opp.surasaTrap=false; }                         // any other card springs and expires the trap harmlessly
  }

  if (c.t==='hero'){
    pl.heroes.push(c); pl.heroPlayedThisRound=true;
    if (c.id==='sugriva'){ const d=pl.deck.splice(0,1); pl.hand.push(...d); if(d.length) log(g,`Sugriva rallies: ${pl.name} draws a card.`); }   // Sugriva TRIGGERED
    if (c.id==='vasuki'){                                   // ON PLAY: all enemy Units lose 1 power
      const foes=opp.units.filter(u=>!u.ghost);
      for (const f of [...foes]) damageUnit(g, 1-pi, f, 1, 'Vasuki');
      log(g, foes.length?`Vasuki uncoils — the enemy line recoils (−1 each).`:`Vasuki uncoils over an empty field.`);
    }
  }
  else if (c.t==='unit'){
    // Mahabali (§9): the first Unit played the round after a VOLUNTARY Pass grants an extra turn.
    const mahaBonus = pl.mahabaliArm===g.round-1 && pl.heroes.some(h=>h.id==='mahabali');
    if (mahaBonus) pl.mahabaliArm=0;
    // Positioning: insert at the chosen slot (Vanaras leverage adjacency; others just append).
    if (position!=null && position>=0 && position<=pl.units.length) pl.units.splice(position, 0, c);
    else pl.units.push(c);
    // Hanuman: every Unit the Vanara player plays gains +1 (or +2 with Jambavan) on entry.
    // EXP-F: Hanuman's entry bonus only applies to Vanara Units of printed power ≥4.
    if (pl.faction==='vanaras' && c.base>=4){ const hb=hanumanEntryBonus(pl); if (hb){ c.power+=hb; log(g,`Hanuman blesses ${c.n}: +${hb} on entry.`); } }
    switch(c.id){
      case 'surya': { const tgt=pl.units.filter(u=>u!==c && !u.ghost); for (const u of tgt) u.power+=1;
        if (tgt.length) emit(g,'buff',{sourceUid:c.uid,targetUids:tgt.map(u=>u.uid),amount:1,abilityName:'Surya Dev',text:'+1'});
        log(g,'Surya Dev: all other friendly Units +1.'); break; }
      case 'vayu': {
        const foes=opp.units.filter(u=>!u.ghost);
        if (foes.length){
          const t=foes.reduce((a,b)=>effPower(g,1-pi,a)>=effPower(g,1-pi,b)?a:b);
          // GDD Vayu (positioning now real): "swap positions with the highest enemy Unit" — adapted to
          // per-player rows as a DISPLACE that hurls it out of formation (breaks Vanara Leap adjacency), then -2.
          const ti=opp.units.indexOf(t);
          if (ti>=0){ opp.units.splice(ti,1); opp.units.push(t); log(g,'Vayu’s gale hurls it out of formation.'); }
          damageUnit(g,1-pi,t,2,'Vayu');
        }
        break; }
      case 'vishwakarma':
        // Yaksha Lok: Artifacts cannot be destroyed → Vishwakarma whiffs (no destroy, no +2 scaling all match).
        if (opp.artifact && g.realm==='yaksha'){ log(g,`Yaksha Lok shields ${opp.artifact.n} — Vishwakarma cannot unmake it.`); }
        else if (opp.artifact){ log(g,`Vishwakarma unmakes ${opp.artifact.n}.`); opp.discard.push(opp.artifact); opp.artifact=null; pl.artifactsDestroyedByMe++; }
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
        // R5 (RESOLVED): "lowest power Unit on the board — friendly or enemy" EXCLUDES Tataka herself
        // (a removal Unit shouldn't primarily suicide); can still hit your OTHER Units.
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
      // ---- Vanara units (passives — jambavan / sharabha / warrior — handled in helpers/effPower) ----
      case 'neela': { const buff = 1; const tgt=pl.units.filter(u=>!u.ghost); for (const u of tgt) u.power+=buff; emit(g,'buff',{sourceUid:c.uid,targetUids:tgt.map(u=>u.uid),amount:buff,abilityName:'Neela',text:`+${buff}`}); log(g,`Neela rallies the host: +${buff} to all Vanara Units.`); break; }   // EXP-D: flat +1 (dropped Sugriva upgrade)
      case 'kesari': { const h=pl.heroes.find(x=>x.id==='hanuman'); if (h){ c.power+=h.power; log(g,`Kesari swells with Hanuman’s might: +${h.power}.`); } break; }
      case 'tara': { const top=pl.deck.splice(0,3);
        if (top.length){ const keep=top.reduce((a,b)=>a.p>=b.p?a:b); pl.hand.push(keep); pl.deck.unshift(...top.filter(x=>x!==keep)); log(g,`Tara scouts the deck and keeps ${keep.n}.`); } break; }
      case 'dwivida': { if (opp.hand.length){ const i=Math.floor(g.rng()*opp.hand.length); const d=opp.hand.splice(i,1)[0]; opp.discard.push(d); log(g,`Dwivida’s blade takes a card from ${opp.name}.`); } else log(g,'Dwivida: the enemy hand is empty.'); break; }
      case 'scout': { const others=pl.units.filter(u=>!u.ghost && u!==c).length; if (others) c.power+=others; pl.seesOppHand=g.round; log(g,`Vanara Scout eyes the foe (+${others}).`); break; }
      case 'dadhimukha': { const d=pl.deck.splice(0,1); pl.hand.push(...d);
        if (pl.heroes.some(h=>h.id==='sugriva')){ for (const u of pl.units) if(!u.ghost) u.power+=1; log(g,'Dadhimukha draws; under Sugriva the host swells +1.'); }
        else log(g,'Dadhimukha draws a card.'); break; }
      case 'riksha': if (pl.heroes.some(h=>h.id==='hanuman')){ c.power+=3; log(g,'Riksha fights beside Hanuman: +3.'); } break;   // ruling: +3 while Hanuman on board
      case 'nala': {
        const inHand=pl.hand.filter(x=>x.t==='unit');
        if (inHand.length){ const low=inHand.reduce((a,b)=>a.base<=b.base?a:b);
          const tok=mkCard(low); tok.power=Math.max(1, Math.ceil(low.base/2)); tok.base=tok.power;
          const idx=pl.units.indexOf(c); pl.units.splice(idx+1, 0, tok);
          log(g,`Nala builds a bridge — a copy of ${low.n} joins at ${tok.power} power.`); }
        else log(g,'Nala: no Unit in hand to copy.'); break; }
      case 'mainda': { const adj=adjacentUnits(pl, c).filter(u=>!u.ghost);
        if (adj.length){ const t=adj.reduce((a,b)=>effPower(g,pi,a)>=effPower(g,pi,b)?a:b);
          if (effPower(g,pi,t)>effPower(g,pi,c)) doLeap(g, pi, c, t, true); else log(g,'Mainda: no stronger neighbour to vault from.'); }
        else log(g,'Mainda finds no adjacent ally.'); break; }
      // ---- Naga units ----
      case 'manasa': { const n=pl.units.filter(u=>!u.ghost).length; if (n){ c.power+=n; } log(g,`Manasa coils forth (+${n} for the serpent host); the opponent’s Astras now fizzle.`); break; }   // PASSIVE negation handled in astra branch
      case 'karkotaka': log(g,'Karkotaka takes the field — Venom now bites at the start of each enemy turn.'); break;   // R10 timing handled in venomKarkotakaTick
      case 'surasa': pl.surasaTrap=c.uid; log(g,`Surasa coils to strike — the opponent’s next card is trapped.`); break;   // R12
      case 'ulupi': {
        const units=pl.discard.filter(x=>x.t==='unit' && !x.ghost);
        if (units.length){ const t=units.reduce((a,b)=>a.base>=b.base?a:b);   // recall the strongest fallen Naga
          pl.discard.splice(pl.discard.indexOf(t),1);
          t.power=t.base; t.venom=0; t.bound=false; t.stolenBy=-1; t.aegis=false; t.ward=false; t.astraImmuneRound=g.round;
          pl.units.push(t); log(g,`Ulupi calls ${t.n} back from the deep — untouchable by Astras this round.`); }
        else log(g,'Ulupi: no fallen Naga to revive.'); break; }
      case 'nagasadhu': { const foes=opp.units.filter(u=>!u.ghost); for (const f of foes) f.venom=(f.venom||0)+1;
        if (foes.length) emit(g,'token',{sourceUid:c.uid,targetUids:foes.map(u=>u.uid),abilityName:'Naga Sadhu',text:'Venom Token'});
        log(g, foes.length?`Naga Sadhu envenoms all ${foes.length} enemy Unit(s).`:'Naga Sadhu: no enemy to poison.'); break; }
      case 'kaliya': { const b=g.round-1; if (b>0){ c.power+=b; log(g,`Kaliya rises many-headed (+${b}).`); } break; }   // R16
      case 'astika': pl.astikaPause=true; for (const u of pl.units) if (!u.ghost) u.power+=1;
        log(g,`Astika calls a truce — the next Venom tick is stayed and friendly Units recover +1.`); break;   // R19
      case 'nagaarcher': { const foes=opp.units.filter(u=>!u.ghost);
        if (foes.length){ let t = targetUid!=null ? foes.find(u=>u.uid===targetUid) : null; if (!t) t=foes.reduce((a,b)=>effPower(g,1-pi,a)>=effPower(g,1-pi,b)?a:b);
          damageUnit(g, 1-pi, t, 1, 'Naga Archer');
          if (opp.units.includes(t) && !t.ghost){ t.venom=(t.venom||0)+1; log(g,`The poison arrow festers in ${t.n}.`); emit(g,'token',{sourceUid:c.uid,targetUids:[t.uid],abilityName:'Naga Archer',text:'Venom Token'}); } }
        else log(g,'Naga Archer: no target.'); break; }
      case 'nagaenchantress': opp.mustPlayUnit=true; log(g,`Naga Enchantress lures — ${opp.name}’s next card must be a Unit.`); break;
      case 'nagawarrior': break;   // PASSIVE handled in effPower (venomTokenCount)
      case 'nagahatchling': if (opp.units.some(u=>!u.ghost && u.venom>0)){ c.power+=2; log(g,'Naga Hatchling feeds on the venom in the air (+2).'); } break;
      case 'ashvatara': { const foes=opp.units.filter(u=>!u.ghost);
        if (foes.length){ let t = targetUid!=null ? foes.find(u=>u.uid===targetUid) : null; if (!t) t=foes.reduce((a,b)=>effPower(g,1-pi,a)>=effPower(g,1-pi,b)?a:b);
          damageUnit(g, 1-pi, t, g.round, 'Ashvatara'); }   // R16: −current round number
        else log(g,'Ashvatara: no target.'); break; }
    }
    if (mahaBonus){ g.grantExtraTurn=pi; log(g,`Mahabali’s decree — ${c.n} is played free; ${pl.name} takes another turn.`); }
    // EXP-J — "Chaos always finds a way": if no Chaos Surge has fired this round, the Asura player's
    // first Unit play triggers exactly one. Guaranteed floor; can't be stacked or engineered beyond that.
    if (pl.faction==='asuras' && !pl.chaosThisRound) chaosSurge(g, pi, 1, 1);   // floor surge is +1 (spell surges stay +3)
    designateShields(g, pi);   // EXP-A: a shield opportunity — latch an open slot onto the strongest Unit
  }
  else if (c.t==='astra'){
    const firstAstra = pl.astrasThisRound===0;
    pl.astrasThisRound++;
    const chandrahasActive = pl.faction==='asuras' && pl.artifact && pl.artifact.id==='chandrahas';
    // §9 negation (Naga): Manasa (on board) cancels the Astra AND its Chaos Surge; Surasa's armed trap
    // (surasaNegateAstra, resolved at the top of playCard) cancels the effect but the Chaos Surge STILL fires.
    const manasa = opp.units.find(u=>!u.ghost && u.id==='manasa');
    let effectNegated=false, surgeNegated=false;
    if (manasa){ effectNegated=true; surgeNegated=true;
      log(g, `Manasa negates ${c.n} — its Chaos Surge fizzles too (§9).`); }
    else if (surasaNegateAstra){ effectNegated=true; /* R12: Surge still churns (logged at trap spring) */ }
    const doubled = chandrahasActive && firstAstra && !effectNegated;
    if (!effectNegated){
      resolveAstra(g, pi, c, targetUid);
      if (doubled){ log(g,`Chandrahas doubles ${c.n}!`); resolveAstra(g, pi, c, targetUid); }
    }
    if (pl.faction==='asuras' && !surgeNegated) chaosSurge(g, pi, chandrahasActive?2:1);
    onAstraResolved(g, pi, doubled);
    // R7: Angad — playing an Astra while the opponent has Angad forfeits your next turn (stacks with Varuna).
    if (opp.heroes.some(h=>h.id==='angad')){ pl.skipNext=true; log(g,`Angad exacts the cost — ${pl.name} forfeits their next turn.`); }
    pl.discard.push(c);
  }
  else if (c.t==='mantra'){
    castMantra(g, pi, c.id, targetUid);
    // EXP-H: Chaos Surge also triggers on the Asura player's Mantras (5 spell-triggers in deck, not 3).
    // Still spell-gated; Chandrahas's "twice while active" applies, but Bana/Berserker/Tripura (Astra-only) do not.
    if (pl.faction==='asuras'){ const chandra = pl.artifact && pl.artifact.id==='chandrahas'; chaosSurge(g, pi, chandra?2:1); }
    // Rishi Mandala: each Mantra is usable twice — after its FIRST cast it returns to hand (once) instead of the discard.
    if (g.realm==='rishi' && !c.rishiUsed){ c.rishiUsed=true; c.lockedRound=0; pl.hand.push(c);
      log(g,`Rishi Mandala returns ${c.n} to ${pl.name}'s hand — it may be cast once more.`);
      emit(g,'passive',{sourceUid:c.uid,abilityName:'Rishi Mandala',text:`${c.n} returns to hand`}); }
    else pl.discard.push(c);
  }
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
    else if (c.id==='kavacha'){ designateShields(g, pi); log(g,'Dharma Kavacha raised \u2014 two Units now shielded.'); }
    else if (c.id==='tripura')  log(g,'Tripura rises \u2014 the three cities empower the host each turn.');
    else if (c.id==='chandrahas'){ log(g,'Chandrahas gleams \u2014 Astras redouble.'); chaosSurge(g, pi, 1); }   // R9-candidate (EXP-B): ON PLAY one Chaos Surge
    else if (c.id==='ramasignet') log(g,'Rama\u2019s Signet seals the host \u2014 none may be ground below 1.');
    else if (c.id==='kishkindhacrown') log(g,'Kishkindha Crown shines \u2014 Leaps empower, and may be twice this round.');
    else if (c.id==='patala') log(g, `Patala Throne rises \u2014 Venom deepens to \u2212${1+g.round} this round.`);   // R11
    else if (c.id==='anantacoil') log(g,'Ananta Coil uncoils \u2014 every fallen Naga will leave its venom on the field.');   // R14
  }
  // Kalki Kshetra tracks the round's last-played card (the +2 lands at round end, only if it's a Unit/Hero).
  g.lastCardThisRound = { uid:c.uid, isBody:(c.t==='unit'||c.t==='hero') };
  afterAction(g, pi);
}

function pass(g, pi){
  const pl=g.players[pi];
  const firstPass = !g.players[1-pi].passed;   // EXP-L2: Karkotaka's single early drain fires the moment the first player passes
  pl.passed=true;
  log(g, `${pl.name} passes.`);
  if (firstPass) venomKarkotakaEarly(g);
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
  // Kalki Kshetra: the round's last-played card — if a Unit/Hero still on the board — gains +2 (before venom & scoring).
  if (g.realm==='kalki' && g.lastCardThisRound && g.lastCardThisRound.isBody){
    const uid=g.lastCardThisRound.uid;
    for (let s=0;s<2;s++){ const c=[...g.players[s].units, ...g.players[s].heroes].find(u=>u.uid===uid && !u.ghost);
      if (c){ c.power+=2; log(g,`Kalki Kshetra blesses the last-played ${c.n}: +2.`); emit(g,'buff',{sourceUid:c.uid,targetUids:[c.uid],amount:2,abilityName:'Kalki Kshetra',text:'+2'}); break; } }
  }
  venomRoundEnd(g);                                  // Venom pipeline ticks BEFORE scoring (R1 death-at-0 via sweep)
  const t0=totalPower(g,0), t1=totalPower(g,1);
  log(g, `Round ${g.round} ends \u2014 ${g.players[0].name} ${t0} vs ${g.players[1].name} ${t1}.`);
  let winner=null;
  if (t0>t1) winner=0; else if (t1>t0) winner=1;
  if (winner!=null){ g.players[winner].roundWins++; log(g, `${g.players[winner].name} wins Round ${g.round}!`); }
  else log(g, 'The round is a draw \u2014 both sides bleed.');
  g.roundHistory.push({ round:g.round, t0, t1, winner });

  if (g.players[0].roundWins>=g.winTarget || g.players[1].roundWins>=g.winTarget || g.round>=3){   // g.winTarget default 2
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
    for (const u of pl.units) if (!u.ghost){ u.revivedShield=false; u.aegis=false; u.venom=0; u.asleep=false; u.doomed=false; u.revealPending=false; u.ward=false; u.bound=false; u.stolenBy=-1; u.astraImmuneRound=0; pl.discard.push(u); }
    pl.units=[];
    if (pl.artifact){ pl.discard.push(pl.artifact); pl.artifact=null; }
    // removed heroes return at half power
    for (const h of pl.removedHeroes){ h.power=Math.max(1, Math.ceil(h.power/2)); pl.heroes.push(h); log(g,`${h.n} returns at ${h.power} power.`); }
    pl.removedHeroes=[];
    pl.passed=false; pl.heroPlayedThisRound=false; pl.astrasThisRound=0;
    pl.skipNext=false; pl.chaosThisRound=false; pl.seesOppHand=false; pl.shieldUids=[]; pl.leapsUsed=0;   // shields + Leaps re-designate each round; mahabaliArm persists
    pl.surasaTrap=false; pl.astikaPause=false; pl.venomStrike=0; pl.sarpaDouble=false; pl.mustPlayUnit=false;   // Naga per-round flags reset; boardTokens PERSIST all match
    // Gandharva Lok: both players draw 1 extra at the START of Round 2 (g.round is still 1 here, pre-increment).
    const extra = (g.realm==='gandharva' && g.round===1) ? 1 : 0;
    const drawn = pl.deck.splice(0, g.drawCount+extra); pl.hand.push(...drawn);   // g.drawCount default 2
    if (extra) log(g,`Gandharva Lok: ${pl.name} draws an extra card for Round 2.`);
    for (const c of pl.hand) c.lockedRound=0;
  }
  g.lastKillThisRound=null; g.astraPlays=0; g.astraBanaCount=0; g.grantExtraTurn=null; g.lastCardThisRound=null;
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
  // R15: Shesha \u2014 if the Naga player LOST the round just ended, a random friendly Unit returns to the board.
  for (let s=0;s<2;s++){
    const pl=g.players[s];
    if (pl.heroes.some(h=>h.id==='shesha') && prev.winner!=null && prev.winner===1-s){
      const units=pl.discard.filter(u=>u.t==='unit' && !u.ghost);
      if (units.length){ const t=units[Math.floor(g.rng()*units.length)];
        pl.discard.splice(pl.discard.indexOf(t),1);
        t.power=t.base; t.venom=0; t.bound=false; t.stolenBy=-1; t.aegis=false; t.ward=false; t.astraImmuneRound=0;
        pl.units.push(t); log(g, `Shesha\u2019s coils stir \u2014 ${t.n} rises to fight again for ${pl.name}.`); }
    }
  }
  log(g, `\u2014\u2014 Round ${g.round} begins. Each side draws 2. ${g.players[g.turn].name} leads. \u2014\u2014`);
  onTurnStart(g, g.turn);                            // start-of-turn hooks for the new round
}

/* ---------- AI ---------- */
function aiScoreCard(g, pi, c){
  const pl=g.players[pi], opp=g.players[1-pi];
  const astrasInHand = pl.hand.filter(x=>x.t==='astra').length;
  const unitsInHand  = pl.hand.filter(x=>x.t==='unit').length;
  const chandrahasActive = pl.artifact && pl.artifact.id==='chandrahas';
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
    case 'pavamana': {
      const wounded = pl.units.filter(u=>!u.ghost&&u.power<u.base).length;
      if (isNaga(opp)){   // EXP-M: hold Pavamana until 2+ friendly Venom Tokens, or the round is ending
        const ftok = pl.units.filter(u=>!u.ghost).reduce((n,u)=>n+(u.venom||0),0);
        s = (ftok>=2 || opp.passed) ? 3 + wounded + ftok*2 : -6;
      } else s = wounded*2 - 1;
      break; }
    case 'amrita': s = pl.units.some(u=>!u.ghost)? 2.5 : -1; break;
    case 'kavacha': s = pl.units.filter(u=>!u.ghost).length>=2? 2 : 0; break;
    // ---- Asura ----
    case 'mahabali': s += 3; break;                                 // (d) get it down early to arm free plays
    case 'shukra': s += pl.discard.some(x=>x.t==='unit')? 2.5 : 0; break;
    case 'rahu': s += 2; break;
    case 'hiranya': s += 2; break;                                   // durable body
    case 'ravana': s += Math.min(5, opp.hand.length); break;
    case 'kumbha': s += 1; break;                                    // EXP-G: P8 that counts now AND detonates next turn
    case 'meghnad': s += opp.heroes.length? 2 : 0; break;
    case 'kalanemi': s += opp.units.filter(u=>!u.ghost).length>=2? 2 : 0; break;
    case 'bana': s += 1 + Math.min(4, g.astraBanaCount) + (astrasInHand>0 ? 2+Math.min(3,astrasInHand) : 0); break;   // (c) play BEFORE the round's Astras
    case 'maricha': { const pool=[]; for (let t=0;t<2;t++) for (const u of g.players[t].units) if (!u.ghost && u.id!=='maricha') pool.push(effPower(g,t,u));
      s = pool.length? Math.max(...pool) : 3; break; }
    case 'vibhishana': s += 0.5; break;
    case 'tataka': s += 1.5; break;
    case 'kali': if (pl.chaosThisRound) s += 3; else if (astrasInHand>0) s -= 2; break;   // (e) hold Kali until after a Surge
    case 'berserker': s += Math.min(3, g.astraPlays); break;
    case 'naraka': s += opp.units.filter(u=>!u.ghost).length; break;
    case 'pashupata': { const foes=opp.units.filter(u=>!u.ghost); s = foes.length? 2+Math.min(foes.length*2, totalPower(g,pi)) : -99; break; }
    case 'nagastra': { const foes=opp.units.filter(u=>!u.ghost); s = foes.length? 1+foes.length : -99; break; }
    case 'tamasa': s = 2; break;
    case 'sanjivani': { const lk=g.lastKillThisRound; s = (lk && lk.owner===1-pi && opp.discard.includes(lk.unit))? 1+lk.unit.base : -99; break; }
    case 'ahamkara': { const real=pl.units.filter(u=>!u.ghost); s = real.length? Math.max(...real.map(u=>effPower(g,pi,u))) : -99; break; }
    case 'tripura': s = unitsInHand>=2 ? (astrasInHand ? 0.5 : 3) : -99; break;   // (a) only with a Unit-heavy hand; own Astras break it
    case 'chandrahas': s = astrasInHand>=2 ? 4 : -99; break;                       // (a) only worth playing holding 2+ Astras
    // ---- Vanara ----
    case 'hanuman': s += 3; break;                                  // build engine early
    case 'sugriva': s += 2; break;                                  // card advantage + enables others
    case 'angad': s += 2; break;
    case 'jambavan': s += pl.heroes.some(h=>h.id==='hanuman')? 3 : 1.5; break;
    case 'neela': s += 1 + pl.units.filter(u=>!u.ghost).length; break;
    case 'kesari': { const h=pl.heroes.find(x=>x.id==='hanuman'); s += h? h.power : 0; break; }
    case 'tara': s += 1.5; break;
    case 'dwivida': s += opp.hand.length? 2:0; break;
    case 'mainda': { const best=Math.max(0,...pl.units.filter(u=>!u.ghost).map(u=>effPower(g,pi,u))); s += Math.max(0, best-4)*0.5 + 1; break; }
    case 'sharabha': s += 1; break;
    case 'scout': s += pl.units.filter(u=>!u.ghost).length*0.5 + 0.5; break;
    case 'warrior': s += Math.min(4, pl.units.filter(u=>!u.ghost).length); break;
    case 'dadhimukha': s += pl.heroes.some(h=>h.id==='sugriva')? 2.5 : 1; break;
    case 'riksha': s += pl.heroes.some(h=>h.id==='hanuman')? 3 : 0; break;
    case 'nala': s += pl.hand.some(x=>x.t==='unit')? 1.5 : 0; break;
    case 'gandiva': { const spec=targetSpec(g,pi,c); s = spec.options.length? 2+Math.max(...spec.options.map(u=>effPower(g,1-pi,u))) : -99; break; }
    case 'lankadahan': { const foes=opp.units.filter(u=>!u.ghost); s = foes.length? 2+foes.length : -99; break; }
    case 'sanjeevani': { const lk=g.lastKillThisRound; s = (lk && lk.owner===pi && pl.discard.includes(lk.unit))? 1+lk.unit.base : -99; break; }
    case 'ramanaam': s = pl.units.filter(u=>!u.ghost).length ? 1+pl.units.filter(u=>!u.ghost).length*2 : -99; break;
    case 'kishkindhaoath': s = pl.units.some(u=>!u.ghost)? 1.5 : -99; break;
    case 'ramasignet': s += isNaga(opp) ? 5 : 1.5; break;   // EXP-M: Vanara AI prioritises Signet vs Nagas (floors venom)
    case 'kishkindhacrown': s += 2; break;
    // ---- Naga ----
    case 'vasuki': s += 2 + opp.units.filter(u=>!u.ghost).length; break;                 // body + on-play sweep + R3 venom
    case 'takshaka': s += opp.heroes.length? 2 : 1; break;
    case 'shesha': s += 2; break;
    case 'manasa': s += pl.units.filter(u=>!u.ghost).length + (opp.hand.some(x=>x.t==='astra')||opp.astrasThisRound>0? 2 : 0); break;
    case 'karkotaka': s += 2; break;
    case 'surasa': s += 1.5; break;
    case 'ulupi': s += pl.discard.some(x=>x.t==='unit'&&!x.ghost)? 2 : 0; break;
    case 'nagasadhu': s += opp.units.filter(u=>!u.ghost).length*0.7; break;
    case 'kaliya': s += g.round-1; break;
    case 'astika': s += (isNaga(opp)||opp.units.some(u=>!u.ghost&&u.venom>0))? 1.5 : 0.3; break;
    case 'nagaarcher': s += opp.units.some(u=>!u.ghost)? 1 : 0; break;
    case 'nagaenchantress': s += 1; break;
    case 'nagawarrior': s += venomTokenCount(g); break;
    case 'nagahatchling': s += opp.units.some(u=>!u.ghost && u.venom>0)? 2 : 0; break;
    case 'ashvatara': s += opp.units.some(u=>!u.ghost)? g.round : 0; break;
    case 'nagapasha': { const spec=targetSpec(g,pi,c); s = spec.options.length? 2+Math.max(...spec.options.map(u=>effPower(g,1-pi,u))) : -99; break; }
    case 'venomstrike': { const foes=opp.units.filter(u=>!u.ghost).length; s = foes>=2? 2+foes : (foes?1:-2); break; }
    case 'mohini': { const spec=targetSpec(g,pi,c); s = spec.options.length? 3+Math.max(...spec.options.map(u=>effPower(g,1-pi,u))) : -99; break; }
    case 'mrityunjaya': { const pool=[...pl.discard,...opp.discard].filter(u=>u.t==='unit'&&!u.ghost); s = pool.length? 2+Math.max(...pool.map(u=>u.base)) : -99; break; }
    case 'sarpasatra': { const real=pl.units.filter(u=>!u.ghost); const foes=opp.units.filter(u=>!u.ghost).length; s = real.length? 1+foes : -99; break; }
    case 'patala': s += 2.5; break;
    case 'anantacoil': s += 1.5; break;
  }
  // Chaos Surge upside: Asuras value Astras more with Units to buff, and much more once Chandrahas is down.
  if (c.t==='astra' && pl.faction==='asuras'){
    if (pl.units.some(u=>!u.ghost)) s += 1;
    if (chandrahasActive) s += (pl.astrasThisRound===0 ? 5 : 3);   // (b) prefer Astras; grab the doubled first one
  }
  // EXP-F: Hanuman's entry bonus only helps printed power ≥4 — value those Units up, nudge go-wide chaff down under Hanuman.
  if (c.t==='unit' && pl.faction==='vanaras' && pl.heroes.some(h=>h.id==='hanuman')){
    s += c.base>=4 ? (pl.units.some(u=>!u.ghost && u.id==='jambavan')?2:1) : -0.75;
  }
  // EXP-M: facing Nagas, each extra small body is just another Venom target — devalue go-wide chaff slightly (tall > wide).
  if (c.t==='unit' && isNaga(opp) && c.base<=3){
    const mine=pl.units.filter(u=>!u.ghost).length;
    s -= 0.5 + mine*0.15;
  }
  return s;
}

function aiMove(g, pi){
  const pl=g.players[pi], opp=g.players[1-pi];
  const idxs = playableIndices(g, pi);
  const my=totalPower(g,pi), their=totalPower(g,1-pi);
  const lead = my-their;
  const mustWin = opp.roundWins===1;               // losing this round loses the match
  const wantWin = pl.roundWins===1;                // winning this round wins the match

  // R20: a Nagapasha-bound Unit costs the owner a whole turn to free. Unbind if freeing it is worth more
  // than the best card play this turn (and it actually matters — contested round, not already coasting ahead).
  const bound = pl.units.filter(u=>u.bound && !u.ghost);
  if (bound.length && !(opp.passed && lead>0)){
    const t = bound.reduce((a,b)=>effPower(g,pi,a)>=effPower(g,pi,b)?a:b);
    const freeVal = effPower(g,pi,t);
    const bestScore = idxs.length ? Math.max(...idxs.map(i=>aiScoreCard(g,pi,pl.hand[i]))) : -Infinity;
    if (freeVal>=4 && freeVal>=bestScore) return { unbind:t.uid };
  }

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
  // (d) if behind and Mahabali is on our board, concede sooner — the Pass arms a free Unit + extra turn next round.
  const mahaOnBoard = pl.faction==='asuras' && pl.heroes.some(h=>h.id==='mahabali');
  const concedeAt = (mahaOnBoard && g.round<3) ? -8 : -14;
  if (!mustWin && lead<=concedeAt && g.round<3) return { pass:true };  // concede a lost round, preserve cards

  const i = idxs.reduce((a,b)=> aiScoreCard(g,pi,pl.hand[a])>=aiScoreCard(g,pi,pl.hand[b])?a:b);
  return { play:i };
}

// AI placement (Vanara Units only): slot the new Unit beside the strongest ally so Leap pairs form
// and Leap-enabled Units aren't edge-isolated. Non-Vanara / non-Unit → append (position irrelevant).
function aiPlacement(g, pi, card){
  const pl=g.players[pi];
  if (pl.faction!=='vanaras' || card.t!=='unit') return null;
  if (!pl.units.length) return 0;
  let bestIdx=0, bestP=-1;
  pl.units.forEach((u,idx)=>{ const p=effPower(g,pi,u); if (p>bestP){ bestP=p; bestIdx=idx; } });
  return bestIdx+1;                                   // immediately after the strongest ally
}
function aiTakeTurn(g, pi){
  const pl=g.players[pi];
  // LEAP is a FREE action (reverted from the costs-a-turn experiment): take the best beneficial Leap(s) before playing.
  if (pl.faction==='vanaras'){
    let guard=0;
    while (canLeap(g, pi) && guard++<4){
      const bl=bestLeap(g, pi);
      if (!bl || bl.gain < 3) break;                 // only spend a Leap on a meaningful gain
      doLeap(g, pi, bl.leaper, bl.target, false);
    }
  }
  const mv = aiMove(g, pi);
  if (mv.unbind!=null){                                    // R20: spend the turn to free a bound Unit
    const u=pl.units.find(x=>x.uid===mv.unbind);
    if (u){ u.bound=false; log(g, `${pl.name} wrenches ${u.n} free of the Nagapasha noose.`); }
    afterAction(g, pi); return;
  }
  if (mv.pass) pass(g, pi); else playCard(g, pi, mv.play, null, aiPlacement(g, pi, pl.hand[mv.play]));
}

/* ---------- Node export & simulation harness ---------- */
if (typeof module!=='undefined'){
  module.exports = { newGame, playCard, pass, aiMove, aiTakeTurn, totalPower, playableIndices, targetSpec, effPower, isShielded,
    canLeap, bestLeap, doLeap, adjacentUnits, leapLimit, sharabhaProtected,
    drainAmount, venomPassive, venomTokens, venomRoundEnd, venomKarkotakaEarly, sweepDeaths,
    mulligan, aiMulliganPlan, REALMS, REALM_INFO, designateShield, shieldCap,
    DECKS, DEVA_DECK_DEF, ASURA_DECK_DEF, VANARA_DECK_DEF, NAGA_DECK_DEF, RARITY_COLOR, RARITY_NAME, ASTRA_DMG };
}
