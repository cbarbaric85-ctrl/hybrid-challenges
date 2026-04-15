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
/** Roman Empire — unlock after all recruitable Knights are recruited. */
export const STAGE_ROMAN = 'roman';
/** Anglo-Saxons — unlock after all Roman Empire recruits. */
export const STAGE_ANGLO_SAXON = 'anglo_saxon';
/** Samurai Order — unlock after all Anglo-Saxon recruits. */
export const STAGE_SAMURAI = 'samurai';
/** Viking Clans — unlock after all Samurai Order recruits. */
export const STAGE_VIKING = 'viking';

export const STAGE_RANK = {
  [STAGE_BASE]: 1, [STAGE_APEX]: 2, [STAGE_DINO]: 3, [STAGE_LEGENDARY]: 4, [STAGE_MYTHICAL]: 5, [STAGE_EGYPTIAN]: 6, [STAGE_KNIGHTS]: 7,
  [STAGE_ROMAN]: 8, [STAGE_ANGLO_SAXON]: 9, [STAGE_SAMURAI]: 10, [STAGE_VIKING]: 11,
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
  roman_empire: {
    label: 'Roman Empire',
    stage: STAGE_ROMAN,
    intro: 'Spirits of the eternal city — thunder, sea, and iron will.',
    animals: {
      jupiters_champion: {
        id: 'jupiters_champion', name: 'Jupiter’s Champion', icon: '⚡', emoji: '⚡', spd: 19, agi: 18, int: 23, str: 21, stage: STAGE_ROMAN,
        bio: 'Lightning-backed hero — Roman sky-father’s chosen strikes first.',
        battleAbility: { type: 'stat_bonus', stat: 'int', amount: 1, flash: '⚡ Jupiter’s favor — mind sharp!' },
      },
      neptune_guardian: {
        id: 'neptune_guardian', name: 'Neptune Guardian', icon: '🌊', emoji: '🌊', spd: 18, agi: 20, int: 22, str: 20, stage: STAGE_ROMAN,
        bio: 'Salt and tide given form — the sea’s watchful spirit.',
        battleAbility: { type: 'stat_pair_bonus', stats: ['agi', 'int'], amount: 1, flash: '🌊 Neptune’s tide reads the clash!' },
      },
      mars_warrior: {
        id: 'mars_warrior', name: 'Mars Warrior', icon: '⚔️', emoji: '⚔️', spd: 17, agi: 19, int: 20, str: 24, stage: STAGE_ROMAN,
        bio: 'The red god’s fury — discipline and raw power as one.',
        battleAbility: { type: 'stat_bonus', stat: 'str', amount: 1, flash: '⚔️ Mars drives the blade!' },
      },
      imperial_eagle: {
        id: 'imperial_eagle', name: 'Imperial Eagle', icon: '🦅', emoji: '🦅', spd: 22, agi: 21, int: 21, str: 18, stage: STAGE_ROMAN,
        bio: 'Wings of the legion — sees the line before the crowd does.',
        battleAbility: { type: 'stat_bonus', stat: 'spd', amount: 1, flash: '🦅 Eagle sight — first to the mark!' },
      },
      legion_titan: {
        id: 'legion_titan', name: 'Legion Titan', icon: '🛡️', emoji: '🛡️', spd: 16, agi: 17, int: 20, str: 25, stage: STAGE_ROMAN,
        bio: 'Shield-wall made flesh — many hearts, one formation.',
        battleAbility: { type: 'stat_bonus', stat: 'str', amount: 1, flash: '🛡️ Legion holds!' },
      },
      colosseum_beast: {
        id: 'colosseum_beast', name: 'Colosseum Beast', icon: '🦁', emoji: '🦁', spd: 18, agi: 18, int: 18, str: 23, stage: STAGE_ROMAN,
        bio: 'Arena legend — the crowd’s roar becomes its strength.',
        battleAbility: { type: 'bonus_after_loss', amount: 1, flash: '🦁 The arena roars you back!' },
      },
      arena_sand_spirit: {
        id: 'arena_sand_spirit', name: 'Arena Sand Spirit', icon: '🏟️', emoji: '🏟️', spd: 20, agi: 23, int: 21, str: 18, stage: STAGE_ROMAN,
        bio: 'Heat shimmer and grit — flickers where rivals aim.',
        battleAbility: { type: 'stat_bonus', stat: 'agi', amount: 1, flash: '🏟️ Sand veils your step!' },
      },
      shadow_consul: {
        id: 'shadow_consul', name: 'Shadow Consul', icon: '🌑', emoji: '🌑', spd: 18, agi: 20, int: 24, str: 19, stage: STAGE_ROMAN,
        bio: 'Whispers in the Senate — truth and rumor as weapons.',
        battleAbility: { type: 'stat_pair_bonus', stats: ['int', 'spd'], amount: 1, flash: '🌑 Shadow consul outmaneuvers!' },
      },
      divine_judge: {
        id: 'divine_judge', name: 'Divine Judge', icon: '⚖️', emoji: '⚖️', spd: 17, agi: 19, int: 25, str: 20, stage: STAGE_ROMAN,
        bio: 'Scales of fate — weighs intent before the final blow.',
        battleAbility: { type: 'stat_bonus', stat: 'int', amount: 1, flash: '⚖️ Judgment finds the flaw!' },
      },
      stone_colossus: {
        id: 'stone_colossus', name: 'Stone Colossus', icon: '🗿', emoji: '🗿', spd: 15, agi: 16, int: 21, str: 25, stage: STAGE_ROMAN,
        bio: 'Marble giant — the empire carved in stillness and weight.',
        battleAbility: { type: 'last_stand', minEnemyWins: 2, stat: 'str', amount: 1, flash: '🗿 Colossus will not fall!' },
      },
    },
  },
  anglo_saxons: {
    label: 'Anglo-Saxons',
    stage: STAGE_ANGLO_SAXON,
    intro: 'Spirits of fen, hall, and wild wood — hearth and oaths.',
    animals: {
      forest_guardian: {
        id: 'forest_guardian', name: 'Forest Guardian', icon: '🌲', emoji: '🌲', spd: 18, agi: 22, int: 21, str: 19, stage: STAGE_ANGLO_SAXON,
        bio: 'Old trees remember every step — roots hold the line.',
        battleAbility: { type: 'stat_bonus', stat: 'agi', amount: 1, flash: '🌲 Forest roots steady you!' },
      },
      wild_spirit: {
        id: 'wild_spirit', name: 'Wild Spirit', icon: '🐺', emoji: '🐺', spd: 21, agi: 22, int: 19, str: 20, stage: STAGE_ANGLO_SAXON,
        bio: 'Heath-wolf soul — hunts with wind and instinct.',
        battleAbility: { type: 'stat_bonus', stat: 'spd', amount: 1, flash: '🐺 Wild spirit surges!' },
      },
      hearth_spirit: {
        id: 'hearth_spirit', name: 'Hearth Spirit', icon: '🔥', emoji: '🔥', spd: 17, agi: 18, int: 22, str: 21, stage: STAGE_ANGLO_SAXON,
        bio: 'Warmth of the long hall — courage when the storm howls.',
        battleAbility: { type: 'inspire_round', roundIndex: 2, amount: 1, flash: '🔥 Hearth rally — stand together!' },
      },
      night_watcher: {
        id: 'night_watcher', name: 'Night Watcher', icon: '🌙', emoji: '🌙', spd: 19, agi: 21, int: 23, str: 18, stage: STAGE_ANGLO_SAXON,
        bio: 'Moonlit ward — sees threats the sun never catches.',
        battleAbility: { type: 'stat_pair_bonus', stats: ['int', 'agi'], amount: 1, flash: '🌙 Night eyes pierce the dark!' },
      },
      boar_spirit: {
        id: 'boar_spirit', name: 'Boar Spirit', icon: '🐗', emoji: '🐗', spd: 18, agi: 19, int: 18, str: 24, stage: STAGE_ANGLO_SAXON,
        bio: 'Shield-boar fury — charges through fear itself.',
        battleAbility: { type: 'stat_bonus', stat: 'str', amount: 1, flash: '🐗 Boar charge!' },
      },
      wood_warden: {
        id: 'wood_warden', name: 'Wood Warden', icon: '🪵', emoji: '🪵', spd: 17, agi: 20, int: 22, str: 21, stage: STAGE_ANGLO_SAXON,
        bio: 'Speaks with oak and ash — paths open for friends, close for foes.',
        battleAbility: { type: 'stat_bonus', stat: 'int', amount: 1, flash: '🪵 Wood wisdom guides!' },
      },
      mist_walker: {
        id: 'mist_walker', name: 'Mist Walker', icon: '🌫️', emoji: '🌫️', spd: 20, agi: 24, int: 20, str: 18, stage: STAGE_ANGLO_SAXON,
        bio: 'Fen-mist cloak — here, then nowhere.',
        battleAbility: { type: 'stat_bonus', stat: 'agi', amount: 1, flash: '🌫️ Mist hides your move!' },
      },
      owl_seer: {
        id: 'owl_seer', name: 'Owl Seer', icon: '🦉', emoji: '🦉', spd: 18, agi: 20, int: 25, str: 17, stage: STAGE_ANGLO_SAXON,
        bio: 'Silent wings, sharp mind — reads omens in every clash.',
        battleAbility: { type: 'stat_bonus', stat: 'int', amount: 1, flash: '🦉 Owl sees the pattern!' },
      },
      iron_spirit: {
        id: 'iron_spirit', name: 'Iron Spirit', icon: '⚙️', emoji: '⚙️', spd: 16, agi: 18, int: 20, str: 24, stage: STAGE_ANGLO_SAXON,
        bio: 'Smith-song and ring-mail — endurance older than kings.',
        battleAbility: { type: 'stat_bonus', stat: 'str', amount: 1, flash: '⚙️ Iron does not yield!' },
      },
      nature_caller: {
        id: 'nature_caller', name: 'Nature Caller', icon: '🍃', emoji: '🍃', spd: 19, agi: 21, int: 22, str: 19, stage: STAGE_ANGLO_SAXON,
        bio: 'Wind in the leaves — calls allies and confusion alike.',
        battleAbility: { type: 'bonus_after_loss', amount: 1, flash: '🍃 Nature answers your call!' },
      },
    },
  },
  samurai_order: {
    label: 'Samurai Order',
    stage: STAGE_SAMURAI,
    intro: 'Kami-spirits and shadow — blade, blossom, and storm.',
    animals: {
      dragon_spirit: {
        id: 'dragon_spirit', name: 'Dragon Spirit', icon: '🐉', emoji: '🐉', spd: 20, agi: 19, int: 23, str: 23, stage: STAGE_SAMURAI,
        bio: 'River-dragon soul — power that bends before it breaks.',
        battleAbility: { type: 'royal_command' },
      },
      kitsune: {
        id: 'kitsune', name: 'Kitsune', icon: '🦊', emoji: '🦊', spd: 21, agi: 23, int: 24, str: 16, stage: STAGE_SAMURAI,
        bio: 'Fox of nine tales — clever paths where others see walls.',
        battleAbility: { type: 'stat_pair_bonus', stats: ['int', 'agi'], amount: 1, flash: '🦊 Kitsune slips the trap!' },
      },
      oni_warrior: {
        id: 'oni_warrior', name: 'Oni Warrior', icon: '👹', emoji: '👹', spd: 17, agi: 18, int: 19, str: 25, stage: STAGE_SAMURAI,
        bio: 'Horned terror of legend — turns fear into a weapon.',
        battleAbility: { type: 'stat_bonus', stat: 'str', amount: 1, flash: '👹 Oni strength crashes down!' },
      },
      blossom_spirit: {
        id: 'blossom_spirit', name: 'Blossom Spirit', icon: '🌸', emoji: '🌸', spd: 19, agi: 22, int: 23, str: 18, stage: STAGE_SAMURAI,
        bio: 'Sakura calm — beauty that hides a razor edge.',
        battleAbility: { type: 'stat_bonus', stat: 'agi', amount: 1, flash: '🌸 Blossom feints — too fast!' },
      },
      wind_spirit: {
        id: 'wind_spirit', name: 'Wind Spirit', icon: '💨', emoji: '💨', spd: 24, agi: 23, int: 20, str: 17, stage: STAGE_SAMURAI,
        bio: 'Fujin’s whisper — speed that leaves no shadow.',
        battleAbility: { type: 'stat_bonus', stat: 'spd', amount: 1, flash: '💨 Wind carries the strike!' },
      },
      fire_kami: {
        id: 'fire_kami', name: 'Fire Kami', icon: '🔥', emoji: '🔥', spd: 20, agi: 21, int: 22, str: 20, stage: STAGE_SAMURAI,
        bio: 'Sacred flame — burns clean, decides true.',
        battleAbility: { type: 'stat_bonus', stat: 'int', amount: 1, flash: '🔥 Fire kami judges true!' },
      },
      water_kami: {
        id: 'water_kami', name: 'Water Kami', icon: '💧', emoji: '💧', spd: 19, agi: 22, int: 23, str: 19, stage: STAGE_SAMURAI,
        bio: 'Stream and rain — adapts, surrounds, outlasts.',
        battleAbility: { type: 'stat_pair_bonus', stats: ['int', 'spd'], amount: 1, flash: '💧 Water finds the gap!' },
      },
      stone_guardian: {
        id: 'stone_guardian', name: 'Stone Guardian', icon: '⛰️', emoji: '⛰️', spd: 16, agi: 17, int: 21, str: 25, stage: STAGE_SAMURAI,
        bio: 'Mountain kami — stillness that breaks charges.',
        battleAbility: { type: 'stat_bonus', stat: 'str', amount: 1, flash: '⛰️ Stone does not flinch!' },
      },
      shadow_spirit: {
        id: 'shadow_spirit', name: 'Shadow Spirit', icon: '🥷', emoji: '🥷', spd: 22, agi: 24, int: 22, str: 18, stage: STAGE_SAMURAI,
        bio: 'Silent as ink — strikes from the edge of sight.',
        battleAbility: { type: 'stat_bonus', stat: 'agi', amount: 1, flash: '🥷 Shadow slips through!' },
      },
      thunder_shogun: {
        id: 'thunder_shogun', name: 'Thunder Shogun', icon: '⛈️', emoji: '⛈️', spd: 18, agi: 20, int: 24, str: 23, stage: STAGE_SAMURAI,
        bio: 'Storm general — one command, one perfect strike.',
        battleAbility: { type: 'inspire_round', roundIndex: 2, amount: 1, flash: '⛈️ Thunder orders — all as one!' },
      },
    },
  },
  viking_clans: {
    label: 'Viking Clans',
    stage: STAGE_VIKING,
    intro: 'Sea-raiders and saga spirits — longships, runes, and northern fire.',
    animals: {
      berserker: {
        id: 'berserker', name: 'Berserker', icon: '🪓', emoji: '🪓', spd: 19, agi: 18, int: 17, str: 25, stage: STAGE_VIKING,
        bio: 'Berserkir tales tell of warriors who fought with wild courage — stories grew bigger than any one battle.',
        battleAbility: { type: 'stat_bonus', stat: 'str', amount: 1, flash: '🪓 Berserker rage — strength surges!' },
      },
      shield_maiden: {
        id: 'shield_maiden', name: 'Shield Maiden', icon: '🛡️', emoji: '🛡️', spd: 18, agi: 20, int: 21, str: 22, stage: STAGE_VIKING,
        bio: 'Sagas praise shield-maidens as defenders — history and legend both celebrate brave northern fighters.',
        battleAbility: { type: 'bonus_after_loss', amount: 1, flash: '🛡️ Shield Maiden stands again!' },
      },
      storm_caller: {
        id: 'storm_caller', name: 'Storm Caller', icon: '⚡', emoji: '⚡', spd: 20, agi: 19, int: 24, str: 19, stage: STAGE_VIKING,
        bio: 'Thor’s thunder in stories tied storms to travel — lightning meant both danger and awe at sea.',
        battleAbility: { type: 'stat_pair_bonus', stats: ['int', 'spd'], amount: 1, flash: '⚡ Storm reads the field!' },
      },
      wolf_tamer: {
        id: 'wolf_tamer', name: 'Wolf Tamer', icon: '🐺', emoji: '🐺', spd: 21, agi: 22, int: 20, str: 19, stage: STAGE_VIKING,
        bio: 'Wolves in Norse tales stood for loyalty and packs — teamwork turned the wild into allies.',
        battleAbility: { type: 'inspire_round', roundIndex: 1, amount: 1, flash: '🐺 Pack focus — move as one!' },
      },
      battle_wolf: {
        id: 'battle_wolf', name: 'Battle Wolf', icon: '🐺', emoji: '🐺', spd: 22, agi: 21, int: 19, str: 20, stage: STAGE_VIKING,
        bio: 'Viking Age traders and raiders sailed far — speed on land and sea opened new roads.',
        battleAbility: { type: 'stat_bonus', stat: 'spd', amount: 1, flash: '🐺 Battle Wolf runs the line!' },
      },
      snow_bear: {
        id: 'snow_bear', name: 'Snow Bear', icon: '🐻', emoji: '🐻', spd: 16, agi: 17, int: 20, str: 25, stage: STAGE_VIKING,
        bio: 'Scandinavia’s cold coasts and fjords shaped tough ships, tough people, and clever coastal travel.',
        battleAbility: { type: 'last_stand', minEnemyWins: 2, stat: 'str', amount: 1, flash: '🐻 Snow Bear will not yield!' },
      },
      storm_eagle: {
        id: 'storm_eagle', name: 'Storm Eagle', icon: '🦅', emoji: '🦅', spd: 23, agi: 24, int: 20, str: 17, stage: STAGE_VIKING,
        bio: 'Odin’s ravens brought news in myth — sharp eyes and fast wings meant seeing danger first.',
        battleAbility: { type: 'stat_bonus', stat: 'agi', amount: 1, flash: '🦅 Storm Eagle strikes first!' },
      },
      longship_captain: {
        id: 'longship_captain', name: 'Longship Captain', icon: '⛵', emoji: '⛵', spd: 21, agi: 20, int: 23, str: 20, stage: STAGE_VIKING,
        bio: 'Longships were slim, fast, and could sail coasts or rivers — Viking travel linked seas and inland trade.',
        battleAbility: { type: 'stat_pair_bonus', stats: ['int', 'agi'], amount: 1, flash: '⛵ Captain charts the clash!' },
      },
      skald_spirit: {
        id: 'skald_spirit', name: 'Skald Spirit', icon: '📜', emoji: '📜', spd: 18, agi: 19, int: 25, str: 18, stage: STAGE_VIKING,
        bio: 'Skalds were poets who kept history alive — memory and story passed law, legend, and pride.',
        battleAbility: { type: 'stat_bonus', stat: 'int', amount: 1, flash: '📜 Skald finds the clever line!' },
      },
      valkyrie_spirit: {
        id: 'valkyrie_spirit', name: 'Valkyrie Spirit', icon: '🪽', emoji: '🪽', spd: 20, agi: 23, int: 22, str: 19, stage: STAGE_VIKING,
        bio: 'Valkyries in myth chose brave souls — their stories honor courage more than perfect armor.',
        battleAbility: { type: 'stat_bonus', stat: 'agi', amount: 1, flash: '🪽 Valkyrie cuts the angle!' },
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
  jupiters_champion:'JupC', neptune_guardian:'Nept', mars_warrior:'Mars', imperial_eagle:'ImpE',
  legion_titan:'Legi', colosseum_beast:'Colo', arena_sand_spirit:'SandA', shadow_consul:'ShadC',
  divine_judge:'DivJ', stone_colossus:'Ston',
  forest_guardian:'ForG', wild_spirit:'Wild', hearth_spirit:'Hearth', night_watcher:'Nite',
  boar_spirit:'Boar', wood_warden:'WoodW', mist_walker:'Mist', owl_seer:'OwlS',
  iron_spirit:'IronS', nature_caller:'Natu',
  dragon_spirit:'DrgS', kitsune:'Kits', oni_warrior:'Oni', blossom_spirit:'Blos',
  wind_spirit:'Wind', fire_kami:'FireK', water_kami:'WatK', stone_guardian:'StoG',
  shadow_spirit:'ShadS', thunder_shogun:'Thnd',
  berserker:'Bers', shield_maiden:'ShldM', storm_caller:'Storm', wolf_tamer:'WolfT',
  battle_wolf:'BatW', snow_bear:'SnBr', storm_eagle:'StEg', longship_captain:'Long',
  skald_spirit:'Skal', valkyrie_spirit:'Valk',
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

export const ROMAN_IDS = Object.keys(TIER_REGISTRY.roman_empire.animals);
export const ANGLO_SAXON_IDS = Object.keys(TIER_REGISTRY.anglo_saxons.animals);
export const SAMURAI_IDS = Object.keys(TIER_REGISTRY.samurai_order.animals);
export const VIKING_IDS = Object.keys(TIER_REGISTRY.viking_clans.animals);

export const STARTER_BASE_IDS = ['wolf', 'bear', 'eagle'];
