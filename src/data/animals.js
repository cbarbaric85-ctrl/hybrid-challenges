export const STAT_MAX = 25;

export const STAGE_BASE = 'base';
export const STAGE_APEX = 'apex';
export const STAGE_DINO = 'dinosaur';
export const STAGE_LEGENDARY = 'legendary';
export const STAGE_MYTHICAL = 'mythical';
/** Egyptian Guardians — unlock roster after all Mythical God quizzes; missions from Level 21+. */
export const STAGE_EGYPTIAN = 'egyptian';
/** Knights / Medieval Order — unlock roster after all Egyptian Guardian quizzes; missions from Level 26+. */
export const STAGE_KNIGHTS = 'knights';

export const STAGE_RANK = {
  [STAGE_BASE]: 1, [STAGE_APEX]: 2, [STAGE_DINO]: 3, [STAGE_LEGENDARY]: 4, [STAGE_MYTHICAL]: 5, [STAGE_EGYPTIAN]: 6, [STAGE_KNIGHTS]: 7,
};

/**
 * Tier-grouped animal registry. Add new animals inside the correct tier block.
 * The `icon` field mirrors `emoji` for now; swap to an asset path when ready.
 */
export const TIER_REGISTRY = {
  base: {
    label: 'Base',
    stage: STAGE_BASE,
    animals: {
      wolf:    {id:'wolf',    name:'Wolf',       icon:'🐺', emoji:'🐺', spd:8,  agi:7,  int:6,  str:7,  stage:STAGE_BASE, bio:'Pack hunter with relentless endurance.'},
      bear:    {id:'bear',    name:'Bear',       icon:'🐻', emoji:'🐻', spd:4,  agi:3,  int:5,  str:10, stage:STAGE_BASE, bio:'Apex omnivore with crushing force.'},
      eagle:   {id:'eagle',   name:'Eagle',      icon:'🦅', emoji:'🦅', spd:9,  agi:10, int:7,  str:5,  stage:STAGE_BASE, bio:'Sky predator with razor precision.'},
      lion:    {id:'lion',    name:'Lion',       icon:'🦁', emoji:'🦁', spd:8,  agi:7,  int:6,  str:9,  stage:STAGE_BASE, bio:'King of savanna, born to dominate.'},
      cheetah: {id:'cheetah', name:'Cheetah',    icon:'🐆', emoji:'🐆', spd:10, agi:9,  int:5,  str:5,  stage:STAGE_BASE, bio:'Fastest land animal. Pure velocity.'},
      gorilla: {id:'gorilla', name:'Gorilla',    icon:'🦍', emoji:'🦍', spd:5,  agi:6,  int:9,  str:10, stage:STAGE_BASE, bio:'Cognitive titan with immense power.'},
      dolphin: {id:'dolphin', name:'Dolphin',    icon:'🐬', emoji:'🐬', spd:8,  agi:9,  int:10, str:5,  stage:STAGE_BASE, bio:'Ocean genius. Strategist supreme.'},
      croc:    {id:'croc',    name:'Crocodile',  icon:'🐊', emoji:'🐊', spd:5,  agi:4,  int:4,  str:9,  stage:STAGE_BASE, bio:'Ancient predator. Still undefeated.'},
      tiger:   {id:'tiger',   name:'Tiger',      icon:'🐯', emoji:'🐯', spd:9,  agi:8,  int:6,  str:9,  stage:STAGE_BASE, bio:'Perfect ambush predator.'},
      shark:   {id:'shark',   name:'Shark',      icon:'🦈', emoji:'🦈', spd:8,  agi:7,  int:5,  str:8,  stage:STAGE_BASE, bio:'Evolved over 450 million years.'},
    },
  },
  apex: {
    label: 'Apex Predator',
    stage: STAGE_APEX,
    animals: {
      rhino:     {id:'rhino',     name:'Rhino',          icon:'🦏', emoji:'🦏', spd:4,  agi:3,  int:4,  str:11, stage:STAGE_APEX, bio:'Living battering ram.'},
      anaconda:  {id:'anaconda',  name:'Anaconda',       icon:'🐍', emoji:'🐍', spd:4,  agi:8,  int:5,  str:9,  stage:STAGE_APEX, bio:'Constricting death machine.'},
      komodo:    {id:'komodo',    name:'Komodo Dragon',  icon:'🦎', emoji:'🦎', spd:5,  agi:6,  int:5,  str:8,  stage:STAGE_APEX, bio:'Venomous apex island predator.'},
      mantis:    {id:'mantis',    name:'Mantis Shrimp',  icon:'🦐', emoji:'🦐', spd:10, agi:12, int:8,  str:10, stage:STAGE_APEX, bio:'Punch force of a bullet.'},
      badger:    {id:'badger',    name:'Honey Badger',   icon:'🦡', emoji:'🦡', spd:7,  agi:8,  int:7,  str:8,  stage:STAGE_APEX, bio:'Fearless. Literally never backs down.'},
      wolverine: {id:'wolverine', name:'Wolverine',      icon:'🦫', emoji:'🦫', spd:7,  agi:8,  int:6,  str:9,  stage:STAGE_APEX, bio:'Pound-for-pound most ferocious.'},
      cassowary: {id:'cassowary', name:'Cassowary',      icon:'🦤', emoji:'🦤', spd:8,  agi:7,  int:4,  str:9,  stage:STAGE_APEX, bio:'Most dangerous bird. Ever.'},
      pbear:     {id:'pbear',     name:'Polar Bear',     icon:'🐻‍❄️', emoji:'🐻‍❄️', spd:6,  agi:5,  int:6,  str:13, stage:STAGE_APEX, bio:'Arctic supremacy embodied.'},
      saltcroc:  {id:'saltcroc',  name:'Saltwater Croc', icon:'🐊', emoji:'🐊', spd:7,  agi:6,  int:5,  str:14, stage:STAGE_APEX, bio:'The most lethal reptile alive.'},
      orca:      {id:'orca',      name:'Orca',           icon:'🐋', emoji:'🐋', spd:10, agi:9,  int:13, str:11, stage:STAGE_APEX, bio:'Apex of all ocean predators.'},
    },
  },
  dino: {
    label: 'Dinosaur',
    stage: STAGE_DINO,
    animals: {
      buffalo:  {id:'buffalo',  name:'Cape Buffalo',   icon:'🦬', emoji:'🦬', spd:7,  agi:6,  int:5,  str:12, stage:STAGE_DINO, bio:'Kills more lions than any prey.'},
      sibtiger: {id:'sibtiger', name:'Siberian Tiger', icon:'🐯', emoji:'🐯', spd:11, agi:10, int:8,  str:12, stage:STAGE_DINO, bio:'Peak of feline evolution.'},
      trex:     {id:'trex',     name:'T-Rex',          icon:'🦖', emoji:'🦖', spd:9,  agi:6,  int:6,  str:18, stage:STAGE_DINO, bio:'The tyrant king. Nothing stood against it.'},
      raptor:   {id:'raptor',   name:'Velociraptor',   icon:'🐉', emoji:'🐉', spd:16, agi:15, int:10, str:9,  stage:STAGE_DINO, bio:'Feathered, intelligent, lethal. Nature\'s blade.'},
      spino:    {id:'spino',    name:'Spinosaurus',    icon:'🦕', emoji:'🦕', spd:8,  agi:7,  int:6,  str:16, stage:STAGE_DINO, bio:'Aquatic monster — longer than T-Rex.'},
      ptero:    {id:'ptero',    name:'Pterosaur',      icon:'🪶', emoji:'🪶', spd:18, agi:14, int:8,  str:8,  stage:STAGE_DINO, bio:'The fastest creature to ever exist. True flight.'},
      allo:     {id:'allo',     name:'Allosaurus',     icon:'🦎', emoji:'🦎', spd:12, agi:10, int:7,  str:11, stage:STAGE_DINO, bio:'Jurassic pack hunter — fast, sharp, relentless.'},
      giga:     {id:'giga',     name:'Giganotosaurus', icon:'🌋', emoji:'🌋', spd:10, agi:8,  int:6,  str:17, stage:STAGE_DINO, bio:'South American giant built to rival T-Rex.'},
      stego:    {id:'stego',    name:'Stegosaurus',    icon:'🦕', emoji:'🦕', spd:4,  agi:5,  int:4,  str:14, stage:STAGE_DINO, bio:'Plated herbivore with a tail like a mace.'},
      trike:    {id:'trike',    name:'Triceratops',    icon:'🦏', emoji:'🦏', spd:5,  agi:4,  int:5,  str:15, stage:STAGE_DINO, bio:'Three horns, one shield — charge first, ask later.'},
    },
  },
  legendary: {
    label: 'Legendary Beast',
    stage: STAGE_LEGENDARY,
    intro: 'Ancient creatures of myth, forged in fire, magic, and legend.',
    animals: {
      dragon:   {id:'dragon',   name:'Dragon',    icon:'🐲', emoji:'🐲', spd:14, agi:12, int:16, str:20, stage:STAGE_LEGENDARY, bio:'Fire-breathing sovereign of the skies.'},
      phoenix:  {id:'phoenix',  name:'Phoenix',   icon:'🔥', emoji:'🔥', spd:18, agi:16, int:18, str:10, stage:STAGE_LEGENDARY, bio:'Reborn from ashes. Eternal flame given form.'},
      griffin:  {id:'griffin',   name:'Griffin',    icon:'🦅', emoji:'🦅', spd:16, agi:18, int:14, str:15, stage:STAGE_LEGENDARY, bio:'Lion body, eagle wings. Royalty of myth.'},
      hydra:    {id:'hydra',    name:'Hydra',      icon:'🐍', emoji:'🐍', spd:8,  agi:10, int:14, str:22, stage:STAGE_LEGENDARY, bio:'Cut one head — two grow back.'},
      minotaur: {id:'minotaur', name:'Minotaur',   icon:'🐂', emoji:'🐂', spd:10, agi:8,  int:8,  str:22, stage:STAGE_LEGENDARY, bio:'Labyrinth guardian. Unstoppable brute.'},
      kraken:   {id:'kraken',   name:'Kraken',     icon:'🦑', emoji:'🦑', spd:12, agi:14, int:16, str:20, stage:STAGE_LEGENDARY, bio:'Pulls ships beneath the waves.'},
      cerberus: {id:'cerberus', name:'Cerberus',   icon:'🐕', emoji:'🐕', spd:14, agi:12, int:12, str:18, stage:STAGE_LEGENDARY, bio:'Three heads. One purpose: guard the gates.'},
      pegasus:  {id:'pegasus',  name:'Pegasus',    icon:'🐴', emoji:'🐴', spd:22, agi:20, int:14, str:8,  stage:STAGE_LEGENDARY, bio:'Winged stallion. Faster than thought.'},
      basilisk: {id:'basilisk', name:'Basilisk',   icon:'🐍', emoji:'🐍', spd:10, agi:12, int:20, str:16, stage:STAGE_LEGENDARY, bio:'Its gaze turns flesh to stone.'},
      chimera:  {id:'chimera',  name:'Chimera',    icon:'🦁', emoji:'🦁', spd:14, agi:14, int:14, str:18, stage:STAGE_LEGENDARY, bio:'Lion, goat, serpent — three beasts in one.'},
    },
  },
  mythical: {
    label: 'Mythical God',
    stage: STAGE_MYTHICAL,
    intro: 'Beyond beasts — these are rulers of realms, masters of power itself.',
    animals: {
      zeus:     {id:'zeus',     name:'Zeus',      icon:'⚡', emoji:'⚡', spd:20, agi:18, int:22, str:25, stage:STAGE_MYTHICAL, bio:'King of gods. Lord of thunder.'},
      poseidon: {id:'poseidon', name:'Poseidon',  icon:'🔱', emoji:'🔱', spd:18, agi:16, int:20, str:24, stage:STAGE_MYTHICAL, bio:'Ruler of oceans. Shaker of worlds.'},
      hades:    {id:'hades',    name:'Hades',     icon:'💀', emoji:'💀', spd:14, agi:14, int:25, str:22, stage:STAGE_MYTHICAL, bio:'Lord of the underworld. Judge of souls.'},
      athena:   {id:'athena',   name:'Athena',    icon:'🦉', emoji:'🦉', spd:16, agi:20, int:25, str:16, stage:STAGE_MYTHICAL, bio:'Goddess of wisdom and war strategy.'},
      ares:     {id:'ares',     name:'Ares',      icon:'⚔️', emoji:'⚔️', spd:18, agi:16, int:14, str:25, stage:STAGE_MYTHICAL, bio:'God of war. Destruction incarnate.'},
      apollo:   {id:'apollo',   name:'Apollo',    icon:'☀️', emoji:'☀️', spd:22, agi:20, int:22, str:14, stage:STAGE_MYTHICAL, bio:'God of light, music, and prophecy.'},
      artemis:  {id:'artemis',  name:'Artemis',   icon:'🏹', emoji:'🏹', spd:24, agi:25, int:18, str:14, stage:STAGE_MYTHICAL, bio:'Goddess of the hunt. Never misses.'},
      thor:     {id:'thor',     name:'Thor',      icon:'🔨', emoji:'🔨', spd:16, agi:14, int:16, str:25, stage:STAGE_MYTHICAL, bio:'Thunder god. Mjolnir\'s chosen wielder.'},
      loki:     {id:'loki',     name:'Loki',      icon:'🎭', emoji:'🎭', spd:22, agi:22, int:25, str:12, stage:STAGE_MYTHICAL, bio:'Trickster god. Master of chaos.'},
      anubis:   {id:'anubis',   name:'Anubis',    icon:'⚖️', emoji:'⚖️', spd:18, agi:18, int:22, str:20, stage:STAGE_MYTHICAL, bio:'Guardian of the dead. Weigher of hearts.'},
    },
  },
  egyptian: {
    label: 'Egyptian Guardian',
    stage: STAGE_EGYPTIAN,
    intro: 'Sacred guardians of the Duat — wisdom of the desert, speed of the storm.',
    animals: {
      anubis_guardian: {
        id: 'anubis_guardian', name: 'Anubis Guardian', icon: '🐺', emoji: '🐺', spd: 19, agi: 21, int: 24, str: 18, stage: STAGE_EGYPTIAN,
        bio: 'Jackal-headed sentinel — Soul Guard may deny a lost round once (with Egyptian allegiance).',
      },
      pharaoh_king: {
        id: 'pharaoh_king', name: 'Pharaoh King', icon: '👑', emoji: '👑', spd: 18, agi: 20, int: 23, str: 19, stage: STAGE_EGYPTIAN,
        bio: 'Living god-king — royal decree empowers every stat.',
        battleAbility: { type: 'royal_command' },
      },
      sun_priest: {
        id: 'sun_priest', name: 'Sun Priest', icon: '☀️', emoji: '☀️', spd: 19, agi: 21, int: 24, str: 17, stage: STAGE_EGYPTIAN,
        bio: 'Keeper of the solar barque — clarity in the brightest clash.',
        battleAbility: { type: 'stat_bonus', stat: 'int', amount: 1, flash: '☀️ Sun sigil sharpens your mind!' },
      },
      scarab_warrior: {
        id: 'scarab_warrior', name: 'Scarab Warrior', icon: '🪲', emoji: '🪲', spd: 20, agi: 22, int: 21, str: 17, stage: STAGE_EGYPTIAN,
        bio: 'Rebirth in motion — every setback feeds the next strike.',
        battleAbility: { type: 'bonus_after_loss', amount: 1, flash: '🪲 Scarab rebirth — you rally!' },
      },
      sandstorm_sentinel: {
        id: 'sandstorm_sentinel', name: 'Sandstorm Sentinel', icon: '🌪️', emoji: '🌪️', spd: 21, agi: 24, int: 20, str: 17, stage: STAGE_EGYPTIAN,
        bio: 'Veils the horizon — strikes from whirling dust.',
        battleAbility: { type: 'stat_bonus', stat: 'agi', amount: 1, flash: '🌪️ Sandstorm swiftness!' },
      },
      horus_champion: {
        id: 'horus_champion', name: 'Horus Champion', icon: '🦅', emoji: '🦅', spd: 22, agi: 21, int: 23, str: 18, stage: STAGE_EGYPTIAN,
        bio: 'Sky falcon of kings — sees every opening above.',
        battleAbility: { type: 'stat_pair_bonus', stats: ['int', 'spd'], amount: 1, flash: '🦅 Horus sees the line — sky sharp!' },
      },
      obelisk_titan: {
        id: 'obelisk_titan', name: 'Obelisk Titan', icon: '🗿', emoji: '🗿', spd: 17, agi: 19, int: 22, str: 22, stage: STAGE_EGYPTIAN,
        bio: 'Carved colossus — the desert’s immovable will.',
        battleAbility: { type: 'stat_bonus', stat: 'str', amount: 1, flash: '🗿 Obelisk strength holds!' },
      },
      tomb_defender: {
        id: 'tomb_defender', name: 'Tomb Defender', icon: '⚰️', emoji: '⚰️', spd: 18, agi: 23, int: 23, str: 18, stage: STAGE_EGYPTIAN,
        bio: 'Curse the trespasser — wards mind and step alike.',
        battleAbility: { type: 'stat_pair_bonus', stats: ['agi', 'int'], amount: 1, flash: '⚰️ Tomb wards flash!' },
      },
      desert_spirit: {
        id: 'desert_spirit', name: 'Desert Spirit', icon: '✨', emoji: '✨', spd: 21, agi: 22, int: 22, str: 17, stage: STAGE_EGYPTIAN,
        bio: 'Mirage made real — flickers where foes aim.',
        battleAbility: { type: 'stat_bonus', stat: 'spd', amount: 1, flash: '✨ Desert wind carries you!' },
      },
      ra_avenger: {
        id: 'ra_avenger', name: 'Ra’s Avenger', icon: '🔆', emoji: '🔆', spd: 21, agi: 20, int: 25, str: 18, stage: STAGE_EGYPTIAN,
        bio: 'Solar barque’s champion — judgment at noon.',
        battleAbility: { type: 'stat_bonus', stat: 'int', amount: 1, flash: '🔆 Ra’s light strikes true!' },
      },
    },
  },
  knights: {
    label: 'Knights of the Realm',
    stage: STAGE_KNIGHTS,
    intro: 'Honour-bound defenders — steel, stone, and unbroken will.',
    animals: {
      paladin_guardian: {
        id: 'paladin_guardian', name: 'Paladin Guardian', icon: '🛡️', emoji: '🛡️', spd: 15, agi: 17, int: 18, str: 23, stage: STAGE_KNIGHTS,
        bio: 'Blessed aegis — Holy Shield dulls the first crushing blow of the battle.',
      },
      shield_knight: {
        id: 'shield_knight', name: 'Shield Knight', icon: '🪖', emoji: '🪖', spd: 14, agi: 16, int: 17, str: 22, stage: STAGE_KNIGHTS,
        bio: 'Tower shield raised — Block Stance may turn one lost clash into a stalemate.',
      },
      swordmaster: {
        id: 'swordmaster', name: 'Swordmaster', icon: '⚔️', emoji: '⚔️', spd: 16, agi: 20, int: 18, str: 21, stage: STAGE_KNIGHTS,
        bio: 'Blade ballet — precision cuts where armour thins.',
        battleAbility: { type: 'stat_bonus', stat: 'agi', amount: 1, flash: '⚔️ Swordmaster finds the gap!' },
      },
      royal_champion: {
        id: 'royal_champion', name: 'Royal Champion', icon: '👑', emoji: '👑', spd: 15, agi: 18, int: 19, str: 22, stage: STAGE_KNIGHTS,
        bio: 'Crown on the field — Inspire rallies every stat one decisive round.',
        battleAbility: { type: 'inspire_round', roundIndex: 2, amount: 1, flash: '👑 Royal Inspire — the line holds!' },
      },
      iron_defender: {
        id: 'iron_defender', name: 'Iron Defender', icon: '🔩', emoji: '🔩', spd: 13, agi: 16, int: 16, str: 24, stage: STAGE_KNIGHTS,
        bio: 'Full plate, iron nerve — nothing yields.',
        battleAbility: { type: 'stat_bonus', stat: 'str', amount: 1, flash: '🔩 Iron wall — no quarter!' },
      },
      templar_knight: {
        id: 'templar_knight', name: 'Templar Knight', icon: '✝️', emoji: '✝️', spd: 15, agi: 18, int: 19, str: 21, stage: STAGE_KNIGHTS,
        bio: 'Oath and order — discipline beats chaos.',
        battleAbility: { type: 'stat_pair_bonus', stats: ['str', 'int'], amount: 1, flash: '✝️ Templar focus!' },
      },
      lance_cavalier: {
        id: 'lance_cavalier', name: 'Lance Cavalier', icon: '🐴', emoji: '🐴', spd: 17, agi: 19, int: 16, str: 21, stage: STAGE_KNIGHTS,
        bio: 'Thunder charge — the lists remember his name.',
        battleAbility: { type: 'stat_bonus', stat: 'spd', amount: 1, flash: '🐴 Lance charges — speed strikes!' },
      },
      castle_guardian: {
        id: 'castle_guardian', name: 'Castle Guardian', icon: '🏰', emoji: '🏰', spd: 14, agi: 17, int: 18, str: 23, stage: STAGE_KNIGHTS,
        bio: 'Gate and battlement given legs — the keep never sleeps.',
        battleAbility: { type: 'stat_bonus', stat: 'str', amount: 1, flash: '🏰 Castle ward stands firm!' },
      },
      holy_crusader: {
        id: 'holy_crusader', name: 'Holy Crusader', icon: '✨', emoji: '✨', spd: 15, agi: 17, int: 20, str: 21, stage: STAGE_KNIGHTS,
        bio: 'Banner high — faith sharpens the mind in the fray.',
        battleAbility: { type: 'stat_bonus', stat: 'int', amount: 1, flash: '✨ Holy clarity!' },
      },
      dark_knight: {
        id: 'dark_knight', name: 'Dark Knight', icon: '🖤', emoji: '🖤', spd: 16, agi: 18, int: 19, str: 22, stage: STAGE_KNIGHTS,
        bio: 'When the cause seems lost, the shadow armours up.',
        battleAbility: { type: 'last_stand', minEnemyWins: 2, stat: 'str', amount: 1, flash: '🖤 Last Stand — darkness answers!' },
      },
      kings_champion: {
        id: 'kings_champion', name: 'King’s Champion', icon: '⚜️', emoji: '⚜️', spd: 16, agi: 18, int: 20, str: 25, stage: STAGE_KNIGHTS,
        bio: 'The realm’s chosen — final wall before the crown.',
      },
    },
  },
};

/** Flat animal lookup derived from TIER_REGISTRY — backward-compatible. */
export const ANIMALS = Object.fromEntries(
  Object.values(TIER_REGISTRY).flatMap(t => Object.entries(t.animals))
);

export const ENEMY_ANIMALS = {
  cat:      {name:'Cat',      emoji:'🐱', spd:7, agi:8, int:5, str:3},
  dog:      {name:'Dog',      emoji:'🐕', spd:6, agi:6, int:5, str:4},
  elephant: {name:'Elephant', emoji:'🐘', spd:3, agi:2, int:8, str:12},
  hippo:    {name:'Hippo',    emoji:'🦛', spd:4, agi:3, int:4, str:11},
  hyena:    {name:'Hyena',    emoji:'🦣', spd:7, agi:6, int:6, str:7},
  panther:  {name:'Panther',  emoji:'🐈‍⬛',spd:9, agi:9, int:6, str:7},
};

export const ALL_ANIMALS = {...ANIMALS, ...ENEMY_ANIMALS};

export const SYLLABLES = {
  wolf:'Wol', bear:'Bær', eagle:'Aeg', lion:'Lyx', cheetah:'Chee',
  gorilla:'Grak', dolphin:'Delph', croc:'Krok', tiger:'Tygr', shark:'Skar',
  rhino:'Rhyn', anaconda:'Akk', komodo:'Kom', mantis:'Mant', badger:'Badg',
  wolverine:'Wolv', cassowary:'Kass', pbear:'Pol', saltcroc:'Sal',
  orca:'Ork', buffalo:'Buph', sibtiger:'Sib', trex:'Rex', raptor:'Rapt',
  spino:'Spin', ptero:'Pter', allo:'Allo', giga:'Giga', stego:'Steg', trike:'Trik',
  dragon:'Drak', phoenix:'Phyx', griffin:'Gryph', hydra:'Hyd', minotaur:'Mino',
  kraken:'Krak', cerberus:'Cerb', pegasus:'Pegs', basilisk:'Bazl', chimera:'Kymr',
  zeus:'Zeu', poseidon:'Psdn', hades:'Had', athena:'Athn', ares:'Ars',
  apollo:'Apol', artemis:'Artm', thor:'Thor', loki:'Lok', anubis:'Anb',
  anubis_guardian:'AnbG', pharaoh_king:'Phar', sun_priest:'SunP', scarab_warrior:'Scar',
  sandstorm_sentinel:'Sand', horus_champion:'Horu', obelisk_titan:'Obel', tomb_defender:'Tomb',
  desert_spirit:'Dsp', ra_avenger:'RaAv',
  paladin_guardian:'PalG', shield_knight:'Shld', swordmaster:'Swrd', royal_champion:'RoyC',
  iron_defender:'Iron', templar_knight:'Temp', lance_cavalier:'Lanc', castle_guardian:'Cast',
  holy_crusader:'Crus', dark_knight:'DrkK', kings_champion:'KingC',
  cat:'Kat', dog:'Dog', elephant:'Elph', hippo:'Hip', hyena:'Hyen', panther:'Pan',
};

export const BASE_IDS = Object.keys(TIER_REGISTRY.base.animals);
export const APEX_IDS = Object.keys(TIER_REGISTRY.apex.animals);
export const DINO_IDS = Object.keys(TIER_REGISTRY.dino.animals);
export const LEGENDARY_IDS = Object.keys(TIER_REGISTRY.legendary.animals);
export const MYTHICAL_IDS = Object.keys(TIER_REGISTRY.mythical.animals);
export const EGYPTIAN_IDS = Object.keys(TIER_REGISTRY.egyptian.animals);

/** Recruitable knights (excludes boss-only King’s Champion). */
export const KNIGHT_IDS = Object.keys(TIER_REGISTRY.knights.animals).filter(id => id !== 'kings_champion');

export const STARTER_BASE_IDS = ['wolf', 'bear', 'eagle'];
