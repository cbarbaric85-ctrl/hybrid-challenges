/** First cleared level index -> base animal id (stage 1 only). */
export const LEVEL_REWARDS = {
  1: 'lion',
  2: 'cheetah',
  3: 'gorilla',
  4: 'dolphin',
  5: 'croc',
  6: 'tiger',
  7: 'shark',
  8: null,
  9: null,
  10: null,
  11: null,
  12: null,
  13: null,
  14: null,
  15: null,
  16: null,
  17: null,
  18: null,
  19: null,
  20: null,
  21: null,
  22: null,
  23: null,
  24: null,
  25: null,
};

export const LEVELS = [
  // ── BASE & APEX ARC (Levels 1–10) ──
  {id:1,  name:'The Yard Scrapper',   desc:'A scrappy neighbourhood brawler. Nothing to fear… yet.',        animals:['cat','dog'],                  diceBonus:0,useMax:false, arena:'jungle'},
  {id:2,  name:'The Behemoth',        desc:'Thick-skinned and terrifyingly heavy. Brute force incoming.',   animals:['elephant','hippo'],            diceBonus:0,useMax:false, arena:'jungle'},
  {id:3,  name:'Sky Stalker',         desc:'Speed meets cunning. This hybrid hunts from above.',             animals:['wolf','eagle'],                diceBonus:0,useMax:false, arena:'sky'},
  {id:4,  name:'Apex Duo',            desc:'Raw power combined with primate intelligence. Stay sharp.',     animals:['lion','gorilla'],              diceBonus:1,useMax:false, arena:'volcanic'},
  {id:5,  name:'Blitz Crusher',       desc:'Lightning speed and ancient killing instinct. Get ready.',      animals:['cheetah','croc'],              diceBonus:1,useMax:false, arena:'ocean'},
  {id:6,  name:'The Colossus',        desc:'Three apex killers fused. The arena runs red.',                 animals:['tiger','shark','rhino'],       diceBonus:1,useMax:true, isHard:true, arena:'volcanic'},
  {id:7,  name:'Tundra Nightmare',    desc:'Arctic fury meets oceanic intelligence. Merciless.',            animals:['pbear','orca','anaconda'],     diceBonus:2,useMax:true, isHard:true, arena:'ocean'},
  {id:8,  name:'The Unstoppable',     desc:'History\'s deadliest predators, fused. Pure destruction.',    animals:['sibtiger','saltcroc','buffalo'],diceBonus:2,useMax:true, isHard:true, arena:'jungle'},
  {id:9,  name:"Venom\'s Edge",       desc:'Speed, fury, relentlessness made manifest. Survive.',          animals:['mantis','badger','wolverine'], diceBonus:3,useMax:true, isHard:true, arena:'underworld'},
  {id:10, name:'OMEGA HYBRID',        desc:'The ultimate fusion. One god-beast. This ends here.',          animals:['sibtiger','orca','pbear'],     diceBonus:3,useMax:true, isHard:true,isBoss:true, arena:'volcanic', bossTitle:'OMEGA HYBRID', bossTagline:'The arena trembles. All creatures bow.', bossAbility:{name:'Primal Fury',emoji:'🔥',stat:'str',bonus:2}},

  // ── LEGENDARY BEASTS ARC (Levels 11–15) ──
  {id:11, name:'Wings of Flame',      desc:'Sky and fire collide — a legendary beast descends.',            animals:['phoenix','griffin'],            diceBonus:2,useMax:false, isHard:true, arena:'sky'},
  {id:12, name:'Labyrinth Fury',      desc:'Brute strength meets venomous cunning. The labyrinth awaits.', animals:['minotaur','basilisk'],          diceBonus:2,useMax:true, isHard:true, arena:'underworld'},
  {id:13, name:'Hell\'s Gate',        desc:'Three-headed guardian and the winged stallion. Pure chaos.',    animals:['cerberus','pegasus','chimera'], diceBonus:3,useMax:true, isHard:true, arena:'underworld'},
  {id:14, name:'Abyss Rising',        desc:'Ocean terror and multi-headed fury. The deep fights back.',    animals:['kraken','hydra','dragon'],      diceBonus:3,useMax:true, isHard:true, arena:'ocean'},
  {id:15, name:'TITAN CONVERGENCE',   desc:'Every legendary force combined. This is the mythic threshold.',animals:['kraken','hydra','chimera'],     diceBonus:4,useMax:true, isHard:true, isBoss:true, arena:'volcanic', bossTitle:'TITAN CONVERGENCE', bossTagline:'The sea trembles beneath its power.', bossAbility:{name:'Tidal Crush',emoji:'🌊',stat:'str',bonus:2}},

  // ── MYTHICAL GODS ARC (Levels 16–20) ──
  {id:16, name:'Divine Hunters',      desc:'Gods of the hunt and the forge. Precision beyond mortal ken.',  animals:['artemis','apollo'],             diceBonus:3,useMax:false, isHard:true, arena:'celestial'},
  {id:17, name:'Trickster\'s Gambit', desc:'Chaos meets thunder. The gods themselves clash.',               animals:['loki','thor','ares'],           diceBonus:3,useMax:true, isHard:true, arena:'sky'},
  {id:18, name:'Realm Warden',        desc:'Death and wisdom, the underworld and strategy intertwined.',   animals:['hades','athena','anubis'],      diceBonus:4,useMax:true, isHard:true, arena:'underworld'},
  {id:19, name:'Trident of Doom',     desc:'Ocean\'s wrath and sky\'s fury combined. Nowhere is safe.',    animals:['poseidon','zeus','thor'],        diceBonus:4,useMax:true, isHard:true, arena:'ocean'},
  {id:20, name:'PANTHEON SUPREME',    desc:'All gods united. The gods’ last stand — beyond lies the Duat.', animals:['zeus','poseidon','hades'],       diceBonus:5,useMax:true, isHard:true, isBoss:true, isFinal:false, arena:'celestial', bossTitle:'PANTHEON SUPREME', bossTagline:'The heavens split open. Gods descend.', bossAbility:{name:'Divine Wrath',emoji:'⚡',stat:'int',bonus:2}},

  // ── EGYPTIAN GUARDIANS ARC (Levels 21–25) ──
  {id:21, name:'Dunes of Judgment',   desc:'Sun, sand, and spirits — the Duat’s edge awakens.',            animals:['desert_spirit','sun_priest','sandstorm_sentinel'], diceBonus:3,useMax:true, isHard:true, arena:'desert'},
  {id:22, name:'Scarab March',        desc:'Scarabs, tombs, and stone sentinels rise from the heat.',      animals:['scarab_warrior','tomb_defender','obelisk_titan'], diceBonus:3,useMax:true, isHard:true, arena:'desert'},
  {id:23, name:'Falcon’s Crown',      desc:'Horus circles above; Ra’s light blinds the slow.',            animals:['horus_champion','ra_avenger','anubis_guardian'], diceBonus:4,useMax:true, isHard:true, arena:'desert'},
  {id:24, name:'Throne of Kemet',     desc:'The Pharaoh’s court marches — every grain obeys.',            animals:['pharaoh_king','sun_priest','scarab_warrior'], diceBonus:4,useMax:true, isHard:true, arena:'desert'},
  {id:25, name:'DUAT OVERLORD',       desc:'The jackal and the crown — final trial of the guardians.',     animals:['pharaoh_king','anubis_guardian'], diceBonus:5,useMax:true, isHard:true, isBoss:true, isFinal:true, arena:'desert', bossTitle:'👑 DUAT OVERLORD', bossTagline:'The sands part for the living god.', bossAbility:{name:'Royal Decree',emoji:'👑',stat:'int',bonus:3}},
];
