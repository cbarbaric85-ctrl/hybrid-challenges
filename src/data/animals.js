export const STAT_MAX = 18;

export const STAGE_BASE = 'base';
export const STAGE_APEX = 'apex';
export const STAGE_DINO = 'dinosaur';

export const STAGE_RANK = { [STAGE_BASE]: 1, [STAGE_APEX]: 2, [STAGE_DINO]: 3 };

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
  cat:'Kat', dog:'Dog', elephant:'Elph', hippo:'Hip', hyena:'Hyen', panther:'Pan',
};

export const BASE_IDS = Object.keys(TIER_REGISTRY.base.animals);
export const APEX_IDS = Object.keys(TIER_REGISTRY.apex.animals);
export const DINO_IDS = Object.keys(TIER_REGISTRY.dino.animals);

export const STARTER_BASE_IDS = ['wolf', 'bear', 'eagle'];
