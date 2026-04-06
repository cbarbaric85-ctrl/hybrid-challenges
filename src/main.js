import {
  auth,
  db,
  userDocRef,
  leaderboardDocRef,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  getDoc,
  setDoc,
  serverTimestamp,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from './firebase.js';

// ═══════════════════════════════════════════════════════════════════
// GAME DATA
// ═══════════════════════════════════════════════════════════════════

const STAT_MAX = 18; // max stat value for bar scaling (dinos can reach this)

/** Progression stages (10 animals each). Monetisation hooks: see canAccessStage(). */
const STAGE_BASE = 'base';
const STAGE_APEX = 'apex';
const STAGE_DINO = 'dinosaur';

const ANIMALS = {
  // ── Stage 1: Base animals (3 starters + 7 level unlocks) ──
  wolf:     {id:'wolf', name:'Wolf',           emoji:'🐺', spd:8,  agi:7,  int:6,  str:7,  stage:STAGE_BASE, bio:'Pack hunter with relentless endurance.'},
  bear:     {id:'bear', name:'Bear',           emoji:'🐻', spd:4,  agi:3,  int:5,  str:10, stage:STAGE_BASE, bio:'Apex omnivore with crushing force.'},
  eagle:    {id:'eagle', name:'Eagle',          emoji:'🦅', spd:9,  agi:10, int:7,  str:5,  stage:STAGE_BASE, bio:'Sky predator with razor precision.'},
  lion:     {id:'lion', name:'Lion',           emoji:'🦁', spd:8,  agi:7,  int:6,  str:9,  stage:STAGE_BASE, bio:'King of savanna, born to dominate.'},
  cheetah:  {id:'cheetah', name:'Cheetah',        emoji:'🐆', spd:10, agi:9,  int:5,  str:5,  stage:STAGE_BASE, bio:'Fastest land animal. Pure velocity.'},
  gorilla:  {id:'gorilla', name:'Gorilla',        emoji:'🦍', spd:5,  agi:6,  int:9,  str:10, stage:STAGE_BASE, bio:'Cognitive titan with immense power.'},
  dolphin:  {id:'dolphin', name:'Dolphin',        emoji:'🐬', spd:8,  agi:9,  int:10, str:5,  stage:STAGE_BASE, bio:'Ocean genius. Strategist supreme.'},
  croc:     {id:'croc', name:'Crocodile',      emoji:'🐊', spd:5,  agi:4,  int:4,  str:9,  stage:STAGE_BASE, bio:'Ancient predator. Still undefeated.'},
  tiger:    {id:'tiger', name:'Tiger',          emoji:'🐯', spd:9,  agi:8,  int:6,  str:9,  stage:STAGE_BASE, bio:'Perfect ambush predator.'},
  shark:    {id:'shark', name:'Shark',          emoji:'🦈', spd:8,  agi:7,  int:5,  str:8,  stage:STAGE_BASE, bio:'Evolved over 450 million years.'},
  // ── Stage 2: Apex predators (level gate + per-animal quiz) ──
  rhino:    {id:'rhino', name:'Rhino',          emoji:'🦏', spd:4,  agi:3,  int:4,  str:11, stage:STAGE_APEX, bio:'Living battering ram.'},
  anaconda: {id:'anaconda', name:'Anaconda',       emoji:'🐍', spd:4,  agi:8,  int:5,  str:9,  stage:STAGE_APEX, bio:'Constricting death machine.'},
  komodo:   {id:'komodo', name:'Komodo Dragon',  emoji:'🦎', spd:5,  agi:6,  int:5,  str:8,  stage:STAGE_APEX, bio:'Venomous apex island predator.'},
  mantis:   {id:'mantis', name:'Mantis Shrimp',  emoji:'🦐', spd:10, agi:12, int:8,  str:10, stage:STAGE_APEX, bio:'Punch force of a bullet.'},
  badger:   {id:'badger', name:'Honey Badger',   emoji:'🦡', spd:7,  agi:8,  int:7,  str:8,  stage:STAGE_APEX, bio:'Fearless. Literally never backs down.'},
  wolverine:{id:'wolverine', name:'Wolverine',      emoji:'🦫', spd:7,  agi:8,  int:6,  str:9,  stage:STAGE_APEX, bio:'Pound-for-pound most ferocious.'},
  cassowary:{id:'cassowary', name:'Cassowary',      emoji:'🦤', spd:8,  agi:7,  int:4,  str:9,  stage:STAGE_APEX, bio:'Most dangerous bird. Ever.'},
  pbear:    {id:'pbear', name:'Polar Bear',       emoji:'🐻‍❄️', spd:6,  agi:5,  int:6,  str:13, stage:STAGE_APEX, bio:'Arctic supremacy embodied.'},
  saltcroc: {id:'saltcroc', name:'Saltwater Croc',   emoji:'🐊', spd:7,  agi:6,  int:5,  str:14, stage:STAGE_APEX, bio:'The most lethal reptile alive.'},
  orca:     {id:'orca', name:'Orca',             emoji:'🐋', spd:10, agi:9,  int:13, str:11, stage:STAGE_APEX, bio:'Apex of all ocean predators.'},
  // ── Stage 3: Dinosaurs (later level gate + per-animal quiz) ──
  buffalo:  {id:'buffalo', name:'Cape Buffalo',     emoji:'🦬', spd:7,  agi:6,  int:5,  str:12, stage:STAGE_DINO, bio:'Kills more lions than any prey.'},
  sibtiger: {id:'sibtiger', name:'Siberian Tiger',   emoji:'🐯', spd:11, agi:10, int:8,  str:12, stage:STAGE_DINO, bio:'Peak of feline evolution.'},
  trex:     {id:'trex', name:'T-Rex',            emoji:'🦖', spd:9,  agi:6,  int:6,  str:18, stage:STAGE_DINO, bio:'The tyrant king. Nothing stood against it.'},
  raptor:   {id:'raptor', name:'Velociraptor',     emoji:'🐉', spd:16, agi:15, int:10, str:9,  stage:STAGE_DINO, bio:'Feathered, intelligent, lethal. Nature\'s blade.'},
  spino:    {id:'spino', name:'Spinosaurus',      emoji:'🦕', spd:8,  agi:7,  int:6,  str:16, stage:STAGE_DINO, bio:'Aquatic monster — longer than T-Rex.'},
  ptero:    {id:'ptero', name:'Pterosaur',        emoji:'🪶', spd:18, agi:14, int:8,  str:8,  stage:STAGE_DINO, bio:'The fastest creature to ever exist. True flight.'},
  allo:     {id:'allo', name:'Allosaurus',       emoji:'🦎', spd:12, agi:10, int:7,  str:11, stage:STAGE_DINO, bio:'Jurassic pack hunter — fast, sharp, relentless.'},
  giga:     {id:'giga', name:'Giganotosaurus',   emoji:'🌋', spd:10, agi:8,  int:6,  str:17, stage:STAGE_DINO, bio:'South American giant built to rival T-Rex.'},
  stego:    {id:'stego', name:'Stegosaurus',      emoji:'🦕', spd:4,  agi:5,  int:4,  str:14, stage:STAGE_DINO, bio:'Plated herbivore with a tail like a mace.'},
  trike:    {id:'trike', name:'Triceratops',      emoji:'🦏', spd:5,  agi:4,  int:5,  str:15, stage:STAGE_DINO, bio:'Three horns, one shield — charge first, ask later.'},
};

// Enemy-only components (not player selectable)
const ENEMY_ANIMALS = {
  cat:      {name:'Cat',     emoji:'🐱', spd:7,  agi:8,  int:5,  str:3},
  dog:      {name:'Dog',     emoji:'🐕', spd:6,  agi:6,  int:5,  str:4},
  elephant: {name:'Elephant',emoji:'🐘', spd:3,  agi:2,  int:8,  str:12},
  hippo:    {name:'Hippo',   emoji:'🦛', spd:4,  agi:3,  int:4,  str:11},
  hyena:    {name:'Hyena',   emoji:'🦣', spd:7,  agi:6,  int:6,  str:7},
  panther:  {name:'Panther', emoji:'🐈‍⬛',spd:9,  agi:9,  int:6,  str:7},
};

const ALL_ANIMALS = {...ANIMALS, ...ENEMY_ANIMALS};

const SYLLABLES = {
  wolf:'Wol', bear:'Bær', eagle:'Aeg', lion:'Lyx', cheetah:'Chee',
  gorilla:'Grak', dolphin:'Delph', croc:'Krok', tiger:'Tygr', shark:'Skar',
  rhino:'Rhyn', anaconda:'Akk', komodo:'Kom', mantis:'Mant', badger:'Badg',
  wolverine:'Wolv', cassowary:'Kass', pbear:'Pol', saltcroc:'Sal',
  orca:'Ork', buffalo:'Buph', sibtiger:'Sib', trex:'Rex', raptor:'Rapt',
  spino:'Spin', ptero:'Pter', allo:'Allo', giga:'Giga', stego:'Steg', trike:'Trik',
  cat:'Kat', dog:'Dog', elephant:'Elph', hippo:'Hip', hyena:'Hyen', panther:'Pan',
};

/** First cleared level index → base animal id (stage 1 only). */
const LEVEL_REWARDS = {
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
};

const STARTER_BASE_IDS = ['wolf', 'bear', 'eagle'];
const BASE_IDS = Object.keys(ANIMALS).filter(k => ANIMALS[k].stage === STAGE_BASE);
const APEX_IDS = Object.keys(ANIMALS).filter(k => ANIMALS[k].stage === STAGE_APEX);
const DINO_IDS = Object.keys(ANIMALS).filter(k => ANIMALS[k].stage === STAGE_DINO);

const LEVELS = [
  {id:1,  name:'The Yard Scrapper',   desc:'A scrappy neighbourhood brawler. Nothing to fear… yet.',        animals:['cat','dog'],                  diceBonus:0,useMax:false},
  {id:2,  name:'The Behemoth',        desc:'Thick-skinned and terrifyingly heavy. Brute force incoming.',   animals:['elephant','hippo'],            diceBonus:0,useMax:false},
  {id:3,  name:'Sky Stalker',         desc:'Speed meets cunning. This hybrid hunts from above.',             animals:['wolf','eagle'],                diceBonus:0,useMax:false},
  {id:4,  name:'Apex Duo',            desc:'Raw power combined with primate intelligence. Stay sharp.',     animals:['lion','gorilla'],              diceBonus:1,useMax:false},
  {id:5,  name:'Blitz Crusher',       desc:'Lightning speed and ancient killing instinct. Get ready.',      animals:['cheetah','croc'],              diceBonus:1,useMax:false},
  {id:6,  name:'The Colossus',        desc:'Three apex killers fused. The arena runs red.',                 animals:['tiger','shark','rhino'],       diceBonus:1,useMax:true, isHard:true},
  {id:7,  name:'Tundra Nightmare',    desc:'Arctic fury meets oceanic intelligence. Merciless.',            animals:['pbear','orca','anaconda'],     diceBonus:2,useMax:true, isHard:true},
  {id:8,  name:'The Unstoppable',     desc:'History\'s deadliest predators, fused. Pure destruction.',    animals:['sibtiger','saltcroc','buffalo'],diceBonus:2,useMax:true, isHard:true},
  {id:9,  name:"Venom\'s Edge",       desc:'Speed, fury, relentlessness made manifest. Survive.',          animals:['mantis','badger','wolverine'], diceBonus:3,useMax:true, isHard:true},
  {id:10, name:'OMEGA HYBRID',        desc:'The ultimate fusion. One god-beast. This ends here.',          animals:['sibtiger','orca','pbear'],     diceBonus:3,useMax:true, isHard:true,isFinal:true},
];

// ═══════════════════════════════════════════════════════════════════
// QUIZ DATA — reusable structure, easy to extend
// ═══════════════════════════════════════════════════════════════════

const QUIZZES = {
  // ── APEX PREDATORS ──
  pbear: {
    intro:'The Arctic\'s supreme predator. Prove you know your stuff!',
    questions:[
      {q:'How far away can a polar bear smell prey under the ice?',
       opts:['About 1 mile','About 5 miles','About 20 miles','About 50 miles'],
       correct:2,
       fact:'Polar bears can sniff out a seal beneath 3 feet of solid ice from nearly 20 miles away — one of the most powerful noses on Earth!'},
      {q:'What do polar bears mostly eat?',
       opts:['Fish','Penguins','Ringed seals','Arctic berries'],
       correct:2,
       fact:'Ringed seals are their favourite meal. A hungry polar bear can eat 100 pounds of seal blubber in a single sitting — that\'s like eating 400 burgers at once!'},
      {q:'How fast can a polar bear sprint?',
       opts:['About 15 mph','About 25 mph','About 35 mph','About 50 mph'],
       correct:2,
       fact:'Despite weighing up to 1,500 lbs, polar bears can sprint at 35 mph — that\'s faster than Usain Bolt at his world record speed!'},
      {q:'Polar bear fur looks white, but each hair is actually…',
       opts:['Painted blue','See-through and hollow — light bounces around','Hot pink','Made of metal'],
       correct:1,
       fact:'Their skin is dark under a clever light-trick coat — Arctic camouflage engineering.'},
      {q:'Mother polar bears often dig a snow den to…',
       opts:['Store snacks for squirrels','Keep cubs warm while they are tiny','Hide from penguins','Practice karaoke'],
       correct:1,
       fact:'Winter babies get a cozy nursery — mom is a walking survival school.'},
    ]
  },
  saltcroc: {
    intro:'The saltwater crocodile — the most lethal reptile alive. Do you dare unlock it?',
    questions:[
      {q:'What is the saltwater crocodile\'s bite force?',
       opts:['500 psi — like a dog','1,500 psi — like a spotted hyena','3,700 psi — the strongest ever measured','500 psi — like a lion'],
       correct:2,
       fact:'The saltwater croc\'s 3,700 psi bite force is the strongest ever recorded — stronger than a great white shark, and even matches some estimates for T-Rex!'},
      {q:'How long can a saltwater croc hold its breath underwater?',
       opts:['5 minutes','30 minutes','Up to 2 hours','8 hours'],
       correct:2,
       fact:'By slowing its heart to just 2–3 beats per minute, a saltwater croc can stay submerged for up to 2 hours — like a solar-powered ambush machine!'},
      {q:'Where do saltwater crocodiles live?',
       opts:['Only in freshwater rivers','Coastal areas and open ocean','Only in lakes','Underground burrows'],
       correct:1,
       fact:'Despite being reptiles, saltwater crocs can swim hundreds of miles out to sea — they\'ve even been spotted near remote Pacific islands!'},
      {q:'A saltwater croc waiting at the waterline is using…',
       opts:['Magic','Ambush — most of its body hides underwater','Loud music','A parachute'],
       correct:1,
       fact:'Prey sees “log.” Log says “surprise.”'},
      {q:'Compared with many animals, a big croc’s heart during a long dive can…',
       opts:['Explode','Slow way down to save oxygen','Always beat 200 times a minute','Stop forever on purpose'],
       correct:1,
       fact:'Slow heart = longer underwater stakeouts — patience weapon unlocked.'},
    ]
  },
  orca: {
    intro:'The Orca — ocean genius and apex of all predators. Show you know the killer whale!',
    questions:[
      {q:'Orcas are actually members of which animal family?',
       opts:['Shark family','Dolphin family','Whale family','Seal family'],
       correct:1,
       fact:'Orcas are technically the largest member of the dolphin family! They just happen to be the biggest, most intelligent, and most dangerous dolphins that ever lived.'},
      {q:'How do orcas hunt together as a pod?',
       opts:['Using echolocation alone','Individual surprise attacks','Coordinated team tactics passed down through generations','They don\'t — orcas hunt solo'],
       correct:2,
       fact:'Orca pods have been seen creating waves to wash seals off ice floes, herding fish into balls, and even teaching calves these tactics — it\'s cultural knowledge passed through families!'},
      {q:'What is an orca\'s top swimming speed?',
       opts:['About 10 mph','About 20 mph','About 35 mph','About 55 mph'],
       correct:2,
       fact:'At 35 mph, orcas are fast enough to hunt great white sharks. Great whites have actually been spotted fleeing from orca pods — the ocean\'s top predator runs away from them!'},
      {q:'Orcas talk to each other using…',
       opts:['Only fax machines','Clicks, whistles, and pulsed calls','Silent telepathy only','Smoke signals'],
       correct:1,
       fact:'Different pods even have favorite sound “accents” — underwater culture is real.'},
      {q:'Why is an orca’s big dorsal fin (especially on adult males) useful?',
       opts:['It is just decoration','Stability and steering like a boat rudder','It stores candy','It glows in space'],
       correct:1,
       fact:'That tall fin helps a huge body turn without wiping out at speed.'},
    ]
  },
  buffalo: {
    intro:'The Cape Buffalo — nicknamed "Black Death" by hunters. Learn why it\'s feared!',
    questions:[
      {q:'What deadly nickname have hunters given the Cape Buffalo?',
       opts:['The Gentle Giant','Black Death','The Blood Bull','The Iron Wall'],
       correct:1,
       fact:'Cape buffaloes kill more hunters in Africa than any other big game animal — their nickname "Black Death" is fully earned. They\'re notoriously unpredictable and hold grudges!'},
      {q:'What do Cape Buffalo herds do when threatened by predators?',
       opts:['Scatter and run','Hide in water','Form a protective circle with calves inside','Climb to high ground'],
       correct:2,
       fact:'The whole herd forms a defensive wall facing outward, with calves safe in the middle. Even a lion pride will lose members trying to break through — and buffaloes have been known to hunt down and kill lions that attacked them!'},
      {q:'How heavy can an adult Cape Buffalo get?',
       opts:['About 500 lbs','About 800 lbs','About 1,400 lbs','About 2,200 lbs'],
       correct:2,
       fact:'At around 1,400 lbs of pure muscle and fury, a Cape Buffalo can absorb enormous punishment and keep charging. Lions frequently lose their lives trying to bring one down.'},
      {q:'Cape buffalo horns are shaped to…',
       opts:['Play piano','Hook, lift, and toss a threat during a fight','Pick up Wi-Fi','Hold umbrellas'],
       correct:1,
       fact:'Those curved horns turn a headshake into a lion-launching machine.'},
      {q:'When a buffalo herd fights back, lions learn that…',
       opts:['Prey is always easy','Team buffalo can be scarier than team lion','Grass is spicy','Birds control the weather'],
       correct:1,
       fact:'Buffalo teamwork flips the script — the hunted can become the hunter.'},
    ]
  },
  sibtiger: {
    intro:'The Siberian Tiger — the world\'s largest wild cat. Prove your knowledge!',
    questions:[
      {q:'How long can a Siberian Tiger be from nose to tail tip?',
       opts:['About 6 feet','About 8 feet','About 11 feet','About 14 feet'],
       correct:2,
       fact:'Siberian Tigers can reach over 11 feet long — that\'s longer than a small car! They\'re the undisputed heavyweight champion of all wild cats.'},
      {q:'How far can a Siberian Tiger leap in one bound?',
       opts:['About 10 feet','About 20 feet','About 30 feet','About 40 feet'],
       correct:2,
       fact:'A single Siberian Tiger leap can cover 30 feet — longer than a school bus! They combine this explosive power with absolute silence to ambush prey.'},
      {q:'What temperature can Siberian Tigers survive in?',
       opts:['Down to 0°F','Down to -22°F','Down to -45°F','Down to -70°F'],
       correct:2,
       fact:'With fur up to 3 inches thick and a layer of fat beneath, Siberian Tigers sleep comfortably in -45°F snowstorms — the harshest habitat of any wild cat on Earth.'},
      {q:'Siberian tigers usually hunt…',
       opts:['In big noisy parades','Alone — sneak, ambush, finish fast','Only in pairs of twenty','By asking prey politely'],
       correct:1,
       fact:'Solo stealth mode: fewer witnesses, fewer chances for dinner to escape.'},
      {q:'Stripes on a Siberian tiger help it…',
       opts:['Look taller on camera','Break up its outline in forest and snow edges','Signal airplanes','Store water'],
       correct:1,
       fact:'Blurry stripes = harder to spot — nature’s invisibility cheat (almost).'},
    ]
  },

  // ── DINOSAURS ──
  trex: {
    intro:'T-Rex — the Tyrant Lizard King. One of history\'s most famous predators!',
    questions:[
      {q:'How tall was a T-Rex standing upright?',
       opts:['About 8 feet tall','About 12 feet tall','About 20 feet tall','About 30 feet tall'],
       correct:2,
       fact:'At 20 feet tall at the hips, a T-Rex was roughly the height of a double-decker bus on its side. Looking up at one would be the last thing most creatures ever did!'},
      {q:'Which of these T-Rex facts is TRUE?',
       opts:['It was the fastest dinosaur','It was a scavenger only — never hunted','Scientists still debate what its tiny arms were really for','It was cold-blooded like modern lizards'],
       correct:2,
       fact:'T-Rex\'s tiny arms remain one of science\'s great mysteries! New research suggests they may have gripped prey during biting, or been used in mating displays — but nobody knows for sure after 100 years of debate!'},
      {q:'How big was a T-Rex\'s brain compared to its size?',
       opts:['Very small — it was mostly instinct','Average for its size','It had one of the largest smell-processing areas of any dinosaur','It had two brains — one for each half of the body'],
       correct:2,
       fact:'T-Rex had an enormous olfactory bulb — the part of the brain that processes smell. It could track prey from miles away using scent alone, making it a relentless and intelligent hunter.'},
      {q:'A T-Rex’s banana-sized teeth were great for…',
       opts:['Brushing hair','Piercing and gripping — then ripping big bites','Typing','Planting flowers'],
       correct:1,
       fact:'Those teeth were serrated steak-knives — one chomp changed the whole day.'},
      {q:'T-Rex binocular vision (two eyes facing forward) mainly helps…',
       opts:['Seeing behind walls','Judging distance while targeting prey','Reading tiny books','Sleeping'],
       correct:1,
       fact:'Depth perception turns “somewhere ahead” into “right there.”'},
    ]
  },
  raptor: {
    intro:'The Velociraptor — smarter and stranger than the movies ever showed!',
    questions:[
      {q:'How big was a real Velociraptor?',
       opts:['As big as a horse','As big as a man','About the size of a large turkey','The 6-foot size shown in Jurassic Park'],
       correct:2,
       fact:'Real Velociraptors were only about the size of a turkey! The terrifying 6-foot version from films was actually based on Deinonychus. But the real thing was still fast, smart, and lethal!'},
      {q:'What surprising feature did Velociraptors actually have?',
       opts:['Scales like a fish','Feathers all over their body','Horns like a rhino','Poison glands like a snake'],
       correct:1,
       fact:'Velociraptors were covered in feathers — they\'re closely related to modern birds! In fact, birds ARE living dinosaurs. The next time you see a pigeon, you\'re looking at a tiny dinosaur descendant.'},
      {q:'What was the Velociraptor\'s most deadly physical weapon?',
       opts:['Its powerful jaws','Its whip-like tail','Its sickle-shaped retractable claw','Its running speed alone'],
       correct:2,
       fact:'Each foot had a curved "sickle claw" kept sharp by being held off the ground. Scientists think it was used to pin prey and slash repeatedly — like a biological combat knife!'},
      {q:'Velociraptor lived in a place that was often…',
       opts:['Frozen tundra only','Sandy deserts with dunes — dune-trap ambush zone','Underwater cities','Inside volcanoes'],
       correct:1,
       fact:'Fossils hint at sneaky hunting between dunes — quicksand vibes for prey.'},
      {q:'Velociraptor’s brain (for a dinosaur) suggests it was…',
       opts:['Brain-dead','Pretty clever — a calculating little hunter','Only interested in clouds','Unable to learn'],
       correct:1,
       fact:'Smart + fast + sharp claws = don’t judge by turkey size.'},
    ]
  },
  spino: {
    intro:'Spinosaurus — bigger than T-Rex, stranger than anything that ever lived.',
    questions:[
      {q:'What made Spinosaurus completely unique among large carnivorous dinosaurs?',
       opts:['It could fly short distances','It was a semi-aquatic fish hunter','It was the only dinosaur that lived underground','It could change colour like a chameleon'],
       correct:1,
       fact:'Spinosaurus is the only large carnivorous dinosaur known to have hunted in water. Its paddle-like feet, dense bones, and nostrils positioned high on its skull all point to a life spent semi-submerged — a prehistoric crocodile the size of a bus!'},
      {q:'How long was Spinosaurus?',
       opts:['About 20 feet','About 35 feet','Up to 59 feet','About 75 feet'],
       correct:2,
       fact:'At up to 59 feet long, Spinosaurus was likely the longest carnivorous dinosaur ever discovered — even bigger than T-Rex. It weighed an estimated 20 tonnes!'},
      {q:'What was the giant sail on Spinosaurus\'s back made of?',
       opts:['Pure cartilage like a shark fin','Bone spines up to 6 feet tall covered in skin','Muscle tissue like a hump','Hollow air pockets for buoyancy'],
       correct:1,
       fact:'Those spectacular spines were solid bone, up to 6 feet tall, and likely covered with skin to form a giant sail. Scientists think it helped regulate body temperature — or was used to show off to mates!'},
      {q:'Spinosaurus jaws and cone-shaped teeth look built for…',
       opts:['Only cracking coconuts','Snatching slippery fish and other water prey','Chewing metal','Whistling tunes'],
       correct:1,
       fact:'Fish-hook vibes — river monster menu confirmed.'},
      {q:'Dense bones in Spinosaurus may have helped it…',
       opts:['Float like a balloon','Sink easier in water — less bobbing around','Fly to the moon','Talk louder'],
       correct:1,
       fact:'Heavy bones can be a swim trick — stability beats floating away from lunch.'},
    ]
  },
  ptero: {
    intro:'The Pterosaur — the largest flying animal in Earth\'s history. Prove it!',
    questions:[
      {q:'What was the largest pterosaur species ever discovered?',
       opts:['Pterodactylus','Pteranodon','Quetzalcoatlus','Dimorphodon'],
       correct:2,
       fact:'Quetzalcoatlus had a wingspan of up to 33 feet — as wide as a small aeroplane! Standing on the ground, it would have been as tall as a giraffe. It\'s the largest flying animal ever found.'},
      {q:'Were pterosaurs actually dinosaurs?',
       opts:['Yes, they were flying dinosaurs','No — they were flying reptiles from a separate group','Some were dinosaurs, some weren\'t','Only the very large ones were classified as dinosaurs'],
       correct:1,
       fact:'Pterosaurs were NOT dinosaurs — they were a completely separate group of flying reptiles that evolved alongside dinosaurs. They were the first vertebrates to evolve powered flight, long before birds existed!'},
      {q:'How did large pterosaurs take off from the ground?',
       opts:['They could only glide from cliffs and high places','A powerful four-limbed pole-vault style push off the ground','They ran along the ground and leapt into the air','They couldn\'t take off from flat ground at all'],
       correct:1,
       fact:'Using all four limbs in a powerful vaulting push-off, large pterosaurs could launch themselves nearly 8 feet into the air instantly. This "quad-launch" meant they could take off from flat ground with ease, unlike birds!'},
      {q:'A long pterosaur beak could work like…',
       opts:['A snorkel only','Tweezers in the sky — plucking fish without landing','A parachute','A bicycle pump'],
       correct:1,
       fact:'Some species skimmed or speared food on the wing — drive-through fishing.'},
      {q:'Pterosaur wings were mostly made of…',
       opts:['Metal sheets','A stretchy membrane supported by an extra-long fourth finger','Feathers only like an eagle','Bubble wrap'],
       correct:1,
       fact:'One super-long finger held the wing up — evolution’s kite frame.'},
    ]
  },
  allo: {
    intro:'Allosaurus — a classic Jurassic hunter. Show you know the real deal!',
    questions:[
      {q:'When did Allosaurus mainly live?',
       opts:['The Ice Age','The Jurassic period','Last Tuesday','The Cretaceous only'],
       correct:1,
       fact:'Allosaurus was one of the top predators of the Late Jurassic — millions of years before T-Rex ever appeared!'},
      {q:'What kind of teeth did Allosaurus have?',
       opts:['Flat molars for salad','Sharp, serrated blades for slicing meat','No teeth — only gums','Only one giant tooth'],
       correct:1,
       fact:'Those steak-knife teeth were perfect for taking chunks out of prey — classic carnivore engineering.'},
      {q:'Compared to T-Rex, Allosaurus was usually…',
       opts:['Always bigger','Smaller but still a serious predator','The size of a chicken','A plant eater'],
       correct:1,
       fact:'Allosaurus was big and scary, but T-Rex came later and could grow even larger — different eras, different bosses!'},
      {q:'Allosaurus might have hunted in…',
       opts:['Only solo mode forever','Small groups sometimes — team Jurassic terror','Space only','Pure darkness only'],
       correct:1,
       fact:'Pack hints show up in the fossil story — more brains, more bites.'},
      {q:'Allosaurus arms were…',
       opts:['Longer than its body','Strong grabbers — useful for holding prey while biting','Missing','Made of jelly'],
       correct:1,
       fact:'Not tiny T-Rex arms — Allosaurus had more “grab and slash” reach.'},
    ]
  },
  giga: {
    intro:'Giganotosaurus — one of the largest meat-eaters ever. Earn this giant!',
    questions:[
      {q:'Where have most Giganotosaurus fossils been found?',
       opts:['Antarctica','Argentina in South America','The Moon','Only in cartoons'],
       correct:1,
       fact:'This super-predator roamed what is now Argentina — a warm Cretaceous world full of giants.'},
      {q:'Giganotosaurus is famous for being…',
       opts:['A tiny insect hunter','One of the biggest carnivorous dinosaurs known','A flying dinosaur','A gentle fern nibbler'],
       correct:1,
       fact:'It rivalled T-Rex in size — some estimates put it in the same weight class as the tyrant king!'},
      {q:'Giganotosaurus hunted in a world full of…',
       opts:['Only goldfish','Other huge dinosaurs — real monster vs monster energy','Empty deserts with no life','Modern cities'],
       correct:1,
       fact:'The Cretaceous wasn\'t fair — enormous predators shared the landscape with enormous plant-eaters.'},
      {q:'The name Giganotosaurus basically brags about…',
       opts:['Being tiny','Giant southern lizard vibes','Being a fish','Being invisible'],
       correct:1,
       fact:'“Giganto” is not shy — it warns you a huge meat-eater is on the poster.'},
      {q:'Giganotosaurus skull features suggest it could…',
       opts:['Only hum lullabies','Deliver wide bites to slice big chunks from prey','Read books','Photosynthesize'],
       correct:1,
       fact:'Wide jaws = “meat cleaver” eating style for giant meals.'},
    ]
  },
  stego: {
    intro:'Stegosaurus — plates, spikes, and attitude. Unlock the plated legend!',
    questions:[
      {q:'What are the big flat plates on Stegosaurus\'s back mostly thought to help with?',
       opts:['Wi-Fi signals','Display and temperature control','Holding groceries','Flying'],
       correct:1,
       fact:'Scientists debate details, but many think those plates helped show off to mates and shed extra heat — nature\'s billboard + radiator!'},
      {q:'Stegosaurus defended itself with…',
       opts:['A fluffy tail','Sharp spikes on the tail — a "thagomizer"','Sunglasses','Bubble gum'],
       correct:1,
       fact:'Those tail spikes could swing like a club — predators learned to respect the back end of a Stegosaurus!'},
      {q:'Stegosaurus was mainly…',
       opts:['A fierce hunter of lions','A plant-eating dinosaur','A fish','A robot'],
       correct:1,
       fact:'Those jaws were built for greens, not grizzlies — but don\'t stand behind one when it is annoyed!'},
      {q:'Stegosaurus front legs were shorter than its back legs, so its posture looked…',
       opts:['Perfectly flat like a table','Sloped — head low, big tail high like a seesaw','Upside down','Like a giraffe'],
       correct:1,
       fact:'Weird posture, real animal — think living tank with a mood.'},
      {q:'The thagomizer tail spikes were basically…',
       opts:['Feather dusters','A “no thanks” sign for hungry predators','Jump ropes','Antennas'],
       correct:1,
       fact:'One swing could ruin a predator’s whole week.'},
    ]
  },
  trike: {
    intro:'Triceratops — horns, frill, and charging power. Pass to recruit one!',
    questions:[
      {q:'How many big horns are on a classic Triceratops face?',
       opts:['One horn total','Two above the eyes + one on the nose — three big ones','Zero horns','Ten horns'],
       correct:1,
       fact:'Two long brow horns plus a shorter nose horn made a scary triangle — perfect for saying "back off" to T-Rex!'},
      {q:'The huge bony frill behind Triceratops\'s head may have helped with…',
       opts:['Playing music','Protection and display','Swimming only','Storing water balloons'],
       correct:1,
       fact:'That frill could block bites and also impress rivals — multi-purpose armor + fashion.'},
      {q:'Triceratops ate…',
       opts:['Only meat','Mostly tough plants low to the ground','Pizza','Lightning'],
       correct:1,
       fact:'A beak and rows of teeth sliced through ferns and shrubs — a tank built for salad.'},
      {q:'If a Triceratops charged, what was it probably saying with its body?',
       opts:['Let’s be best friends','Back off — I’m not lunch','Please tickle me','I’m lost, call a taxi'],
       correct:1,
       fact:'That heavy body + horns turned “run away” into the smart option for hungry predators.'},
      {q:'Triceratops teeth were best for…',
       opts:['Slicing steak','Shearing tough leaves and stems','Playing harmonica','Digging tunnels'],
       correct:1,
       fact:'Rows of teeth worked like scissors for greenery — a veggie shredder the size of a truck.'},
    ]
  },
  rhino: {
    intro:'Rhino — armor, attitude, and a charge that shakes the ground. Prove you belong on Team Rhino!',
    questions:[
      {q:'Rhino “horns” are mostly made of…',opts:['Bone','Keratin — like tough fingernail stuff','Sugar glass','Rubber'],correct:1,fact:'Same protein family as your nails — just way bigger and scarier-looking.'},
      {q:'When a rhino runs, it can feel like…',opts:['A sleepy turtle','A furry bulldozer with turbo','A floating balloon','A quiet whisper'],correct:1,fact:'They look heavy — then surprise you with bursts of speed. Physics becomes “uh oh.”'},
      {q:'Rhinos often roll in mud because…',opts:['They love spa day','It can cool them and shield skin from sun/bugs','They think they’re ghosts','Mud tastes like candy'],correct:1,fact:'A mud coat is sunscreen + bug spray — nature’s skincare routine.'},
      {q:'A rhino’s hearing and smell help it…',opts:['Ignore everything','Notice danger even when it can’t see well','Talk to satellites','Only find socks'],correct:1,fact:'With so-so eyesight, super senses keep rhinos from being surprised.'},
      {q:'Baby rhinos stay close to mom mainly to…',opts:['Learn jokes','Stay safer from predators','Practice flying','Hide from homework'],correct:1,fact:'Mom-size backup turns “easy snack” into “bad idea” for hunters.'},
    ]
  },
  anaconda: {
    intro:'Green anaconda — silent river giant. Show you respect the squeeze!',
    questions:[
      {q:'Big anacondas are famous for…',opts:['Singing opera','Hunting near water with stealth power','Living on clouds','Only eating popcorn'],correct:1,fact:'Rivers and swamps are their sneak-attack highways.'},
      {q:'Constriction works because…',opts:['Hugs are magic','Each breath out lets the snake tighten a bit more','Prey falls asleep from jokes','Gravity turns off'],correct:1,fact:'It is less “crush bones” and more “you can’t breathe back in.” Still game over.'},
      {q:'Anacondas swallow food…',opts:['One crumb at a time','Whole — then digest slowly like a portable pantry','Only on Tuesdays','Backward only'],correct:1,fact:'A huge meal can last a long time — snake meal prep is extreme.'},
      {q:'In the water, an anaconda is…',opts:['Helpless','Shockingly agile for its size','Made of bubbles','Afraid of fish'],correct:1,fact:'Water supports that body — suddenly it moves like a shadow.'},
      {q:'Female anacondas are often much bigger than males — that helps…',opts:['Win staring contests','Carry young and dominate food opportunities','Become birds','Glow in the dark'],correct:1,fact:'In some snakes, ladies are the true heavyweights of the swamp.'},
    ]
  },
  komodo: {
    intro:'Komodo dragon — island legend with a bite full of tricks. Unlock the real dragon!',
    questions:[
      {q:'Komodo dragons are famous for…',opts:['Being harmless plush toys','A toxic bite cocktail plus brute strength','Only eating cotton candy','Living in igloos'],correct:1,fact:'Their bite chemistry helps drop big prey — not just “sharp teeth energy.”'},
      {q:'Baby komodos sometimes climb trees to…',opts:['Text friends','Escape hungry grown-ups','Practice DJ skills','Become kites'],correct:1,fact:'Adults can be a threat to babies — up a tree is a kid-safe zone.'},
      {q:'Komodos can smell a dead animal from…',opts:['Only 1 inch away','Surprisingly far away — nose-led GPS','They cannot smell','Only on Sundays'],correct:1,fact:'Forked tongue flicking samples the air like a detective.'},
      {q:'On islands, komodos are often…',opts:['The bottom of the food chain','Top predators that reshape the whole ecosystem','Strict vegetarians','Underwater only'],correct:1,fact:'When you’re the boss carnivore, everything walks carefully.'},
      {q:'A komodo’s tail is useful for…',opts:['Balance, swimming, and whipping when needed','Writing essays','Storing juice boxes','Flying long distance'],correct:0,fact:'That muscular tail is a multi-tool — steering, splashing, and “don’t come closer.”'},
    ]
  },
  mantis: {
    intro:'Mantis shrimp — rainbow eyes and a punch faster than you can blink. Earn the reef warrior!',
    questions:[
      {q:'The mantis shrimp strike is wild because…',opts:['It is slower than a snail','It launches incredibly fast — like a underwater spring trap','It only works on homework','It is imaginary'],correct:1,fact:'That punch can make tiny flashes in water — speed meets physics.'},
      {q:'Some mantis shrimp see…',opts:['Only gray','Polarized light and wild color channels humans don’t have','Nothing at all','Only spreadsheets'],correct:1,fact:'Their eyes are like sci-fi goggles — the reef looks different to them.'},
      {q:'People split mantis shrimp into “spearers” vs “smashers” because…',opts:['Fashion','Different hunting styles — stabby vs hammer-y','Random naming','They live in space'],correct:1,fact:'Same animal group, different weapons loadout.'},
      {q:'If you bothered a mantis shrimp, it might…',opts:['Offer tea','Wallop your gear (or finger) hard enough to crack things','Fall asleep instantly','Ask for autographs'],correct:1,fact:'Aquarium glass stories exist for a reason — respect the click.'},
      {q:'Mantis shrimp live mainly…',opts:['On the moon','In warm coastal waters and burrows','Only in deserts','Inside keyboards'],correct:1,fact:'Reef and sand-bottom homes — peek out, grab prey, vanish.'},
    ]
  },
  badger: {
    intro:'Honey badger — small package, maximum chaos energy. Pass if you can handle the truth!',
    questions:[
      {q:'Honey badgers are legends because they…',opts:['Give up instantly','Pick fights way above their size class','Only nap','Cry when startled'],correct:1,fact:'Tough skin + attitude = predators often regret the encounter.'},
      {q:'Their skin is surprisingly…',opts:['Paper thin','Tough and loose — hard to grip or puncture','Made of jelly','Invisible'],correct:1,fact:'A bite that should end the fight sometimes… doesn’t.'},
      {q:'“Honey” in the name hints they…',opts:['Never eat','Raid beehives for larvae and honey when they can','Fear bees','Only drink soda'],correct:1,fact:'Bee stings happen — honey badgers keep snacking anyway.'},
      {q:'When cornered, a honey badger often…',opts:['Faints','Fights back loud and fierce','Sends email','Turns into mist'],correct:1,fact:'Bold bluff + real toughness = “maybe don’t corner this.”'},
      {q:'Honey badgers are mostly…',opts:['Ocean fish','Land masters that dig, climb, and roam wide','Arctic penguins','Balloons'],correct:1,fact:'They’re versatile survivors — not just memes, real skill points.'},
    ]
  },
  wolverine: {
    intro:'Wolverine — snow tank of the north. Prove you know this fierce forest ninja!',
    questions:[
      {q:'For its size, a wolverine is…',opts:['Weak','Absurdly strong and stubborn','Made of foam','Only cute'],correct:1,fact:'It can stand up to bigger carnivores for a meal — grit matters.'},
      {q:'Wolverines love cold wild places partly because…',opts:['They hate trees','They’re built for snow travel and scavenging huge country','They melt in heat instantly','They only eat ice'],correct:1,fact:'Big paws, thick fur, endless stamina — northern survival build.'},
      {q:'A wolverine’s nickname vibe is…',opts:['Shy bunny','Mini bear that refuses to quit','Slow slug','Sleepy kitten'],correct:1,fact:'They’re not the biggest predator — but they act huge.'},
      {q:'Wolverines find food by…',opts:['Only photosynthesis','Tracking, scavenging, and stealing when opportunity hits','Waiting for delivery apps','Ignoring smells'],correct:1,fact:'Super smell + fearless attitude = dinner shows up eventually.'},
      {q:'Climbing and swimming help wolverines…',opts:['Win video games','Cross rough terrain to hunt and escape danger','Avoid moving','Become dolphins'],correct:1,fact:'They’re more agile than they look — don’t underestimate the fluff.'},
    ]
  },
  cassowary: {
    intro:'Cassowary — dinosaur vibes with feathers. Respect the helmet bird!',
    questions:[
      {q:'Why are cassowaries considered dangerous?',opts:['They only eat candy','A kick can slash with a dagger-like claw','They weigh nothing','They cannot move'],correct:1,fact:'Those legs are built to bolt — and the inner toe is serious business.'},
      {q:'The bony “helmet” on its head may help with…',opts:['Wi-Fi','Pushing through forest brush and maybe showing off','Storing soup','Flying'],correct:1,fact:'Scientists still debate details — but it looks metal.'},
      {q:'Cassowaries eat a lot of fruit, which makes them…',opts:['Boring','Important seed spreaders for the forest','Unable to walk','Glow'],correct:1,fact:'Poop-and-plant = free tree delivery service.'},
      {q:'If you meet one in the wild, the smart move is…',opts:['Run straight at it','Give space — don’t feed or corner it','Play loud music','Try to ride it'],correct:1,fact:'They’re shy until threatened — respect beats selfies.'},
      {q:'Cassowaries can move through jungle by…',opts:['Teleporting','Sprinting and jumping like forest parkour','Only rolling','Sleeping only'],correct:1,fact:'When they decide to go, they’re fast — “slow bird” is a myth.'},
    ]
  },
};

// ═══════════════════════════════════════════════════════════════════
// GAME STATE
// ═══════════════════════════════════════════════════════════════════

let state = {
  profile: null, // { uid, email, username, leaderboardOptIn }
  progress: null,
  playerHybrid: null,
  enemyHybrid: null,
  battle: null,
  selectedAnimals: [],
  quizReturnScreen: 'builder', // where to go after quiz
  /** Bumped on each startBattle(); stale finishBattle timers ignore transitions. */
  battleFlowGen: 0,
};

/** How many questions each Apex/Dino unlock run uses (picked randomly from a larger pool). */
const UNLOCK_QUIZ_SESSION_LEN = 3;

/** Lightweight economy — Hub actions (kid-friendly copy in UI). */
const COIN_TUNING_COST = 12;
const TOKEN_RECRUIT_COST = 5;
const XP_PER_BATTLE_WIN = 28;
/** Commander XP fills this many points per “star” segment on the Hub bar. */
const COMMANDER_XP_SEGMENT = 50;

let levelCompleteAutoNavTimer = null;
let defeatReturnToHubTimer = null;

function clearLevelCompleteAutoNav() {
  if (levelCompleteAutoNavTimer) {
    clearTimeout(levelCompleteAutoNavTimer);
    levelCompleteAutoNavTimer = null;
  }
}

function clearDefeatAutoReturn() {
  if (defeatReturnToHubTimer) {
    clearTimeout(defeatReturnToHubTimer);
    defeatReturnToHubTimer = null;
  }
}

function getCommanderXpSegment(xp) {
  const x = Math.max(0, xp | 0);
  const seg = COMMANDER_XP_SEGMENT;
  const inSeg = x % seg;
  const tier = Math.floor(x / seg) + 1;
  return { tier, inSeg, seg, pct: Math.min(100, (inSeg / seg) * 100) };
}

function findNextTokenRecruitTarget(p) {
  const baseNext = getNextBaseAnimalId(p);
  if (baseNext) return { id: baseNext, mode: 'base' };
  const na = getNextApexAnimalId(p);
  if (na) return { id: na, mode: 'quiz' };
  const nd = getNextDinoAnimalId(p);
  if (nd) return { id: nd, mode: 'quiz' };
  return null;
}

let hubRewardMsgTimer = null;
function flashHubRewardMsg(msg) {
  const el = document.getElementById('hub-reward-msg');
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
  if (hubRewardMsgTimer) clearTimeout(hubRewardMsgTimer);
  hubRewardMsgTimer = setTimeout(() => {
    el.classList.add('hidden');
    hubRewardMsgTimer = null;
  }, 3200);
}

function hubSpendCoinTune() {
  const p = state.progress;
  if (!p || (p.coins || 0) < COIN_TUNING_COST) {
    flashHubRewardMsg('You need more Fusion Coins — win battles!');
    return;
  }
  if (!state.playerHybrid) {
    flashHubRewardMsg('Forge a hybrid in the Forge, then tune stats here.');
    return;
  }
  p.coins -= COIN_TUNING_COST;
  const h = state.playerHybrid;
  const keys = ['spd', 'agi', 'int', 'str'];
  const stat = keys[Math.floor(Math.random() * keys.length)];
  h.stats[stat] = Math.min(STAT_MAX, (h.stats[stat] || 0) + 1);
  h.power = powerScore(h.stats);
  void saveUserProgress(p);
  flashHubRewardMsg(`+1 ${STAT_LABELS_SIMPLE[stat]} — your hybrid grows stronger!`);
  renderHub();
}

function hubSpendTokenRecruit() {
  const p = state.progress;
  if (!p || (p.unlockTokens || 0) < TOKEN_RECRUIT_COST) {
    flashHubRewardMsg('You need more Unlock Tokens — clear levels and daily goals.');
    return;
  }
  const t = findNextTokenRecruitTarget(p);
  if (!t) {
    flashHubRewardMsg('Every animal is unlocked. Use tokens in future updates!');
    return;
  }
  p.unlockTokens -= TOKEN_RECRUIT_COST;
  if (t.mode === 'base') {
    if (!p.unlockedAnimals.includes(t.id)) p.unlockedAnimals.push(t.id);
    flashHubRewardMsg(`${ANIMALS[t.id].name} joined your roster!`);
  } else {
    if (!p.quizUnlocked.includes(t.id)) p.quizUnlocked.push(t.id);
    flashHubRewardMsg(`${ANIMALS[t.id].name} is unlocked — find them in the Forge!`);
  }
  void saveUserProgress(p);
  renderHub();
}

// Quiz sub-state
let quizState = {
  animalId: null,
  currentQ: 0,
  correctCount: 0,
  answered: false,
  /** Shuffled subset of the bank for this attempt (length UNLOCK_QUIZ_SESSION_LEN). */
  sessionQuestions: null,
};

function defaultProgress() {
  return {
    level: 1,
    unlockedAnimals: [...STARTER_BASE_IDS],
    quizUnlocked: [],
    totalWins: 0,
    totalLosses: 0,
    highestLevelReached: 0,
    streakCount: 0,
    lastPlayedDate: null,
    progressSchemaVersion: 1,
    stageAccess: { base: true, apex: true, dinosaur: true },
    coins: 0,
    unlockTokens: 0,
    dailyChallengeDayKey: null,
    dailyWinsToday: 0,
    dailyChallengeRewardClaimed: false,
    totalQuizQuestions: 0,
    totalQuizCorrect: 0,
    /** Meta XP — wins only; drives Hub progress bar (not campaign level). */
    commanderXp: 0,
  };
}

// ═══════════════════════════════════════════════════════════════════
// STAGE ACCESS (monetisation-ready — all true until you wire payments)
// ═══════════════════════════════════════════════════════════════════

/** Placeholder flags: future IAP / entitlements can flip these via Firestore. */
const MONETIZE_PLACEHOLDER = {
  fullBaseStageOwned: true,
  apexStageOwned: true,
  dinosaurStageOwned: true,
};

function canAccessStage(progress, stage) {
  const a = progress.stageAccess || { base: true, apex: true, dinosaur: true };
  if (stage === STAGE_BASE) return a.base !== false && MONETIZE_PLACEHOLDER.fullBaseStageOwned;
  if (stage === STAGE_APEX) return a.apex !== false && MONETIZE_PLACEHOLDER.apexStageOwned;
  if (stage === STAGE_DINO) return a.dinosaur !== false && MONETIZE_PLACEHOLDER.dinosaurStageOwned;
  return true;
}

const STAGE_RANK = { [STAGE_BASE]: 1, [STAGE_APEX]: 2, [STAGE_DINO]: 3 };

// ═══════════════════════════════════════════════════════════════════
// ANIMAL AVAILABILITY LOGIC
// ═══════════════════════════════════════════════════════════════════

function isBaseAnimalUnlocked(id, progress) {
  if (!ANIMALS[id] || ANIMALS[id].stage !== STAGE_BASE) return false;
  return STARTER_BASE_IDS.includes(id) || progress.unlockedAnimals.includes(id);
}

function countBaseUnlocked(progress) {
  return BASE_IDS.filter(id => isBaseAnimalUnlocked(id, progress)).length;
}

function countApexUnlocked(progress) {
  return APEX_IDS.filter(id => progress.quizUnlocked.includes(id)).length;
}

function countDinoUnlocked(progress) {
  return DINO_IDS.filter(id => progress.quizUnlocked.includes(id)).length;
}

/** Beat level 5 (campaign level 6+) → apex quizzes open. */
function apexLevelGateMet(progress) {
  return progress.level >= 6;
}

/** Beat level 8 (campaign level 9+) → dinosaur quizzes open. */
function dinoLevelGateMet(progress) {
  return progress.level >= 9;
}

function getPlayerStageLabel(progress) {
  const b = countBaseUnlocked(progress);
  if (b < BASE_IDS.length || !apexLevelGateMet(progress)) return 'Base Animals';
  if (!dinoLevelGateMet(progress)) return 'Apex Predators';
  return 'Dinosaurs';
}

/** Cleared level number that awards each base recruit (inverse of LEVEL_REWARDS). */
const BASE_UNLOCK_LEVEL = {};
for (let L = 1; L <= 10; L++) {
  const rid = LEVEL_REWARDS[L];
  if (rid) BASE_UNLOCK_LEVEL[rid] = L;
}

function getNextBaseAnimalId(progress) {
  return BASE_IDS.find(id => !isBaseAnimalUnlocked(id, progress)) || null;
}

function getNextApexAnimalId(progress) {
  if (!apexLevelGateMet(progress)) return null;
  return APEX_IDS.find(id => !progress.quizUnlocked.includes(id)) || null;
}

function getNextDinoAnimalId(progress) {
  if (!dinoLevelGateMet(progress)) return null;
  return DINO_IDS.find(id => !progress.quizUnlocked.includes(id)) || null;
}

/** One-line hints for hub / battle overlay (short, kid-friendly). */
function getProgressionNextLines(progress) {
  const lines = [];
  const p = progress;
  const curLv = Math.min(p.level, 10);
  const bNext = getNextBaseAnimalId(p);
  if (bNext) {
    const needLv = BASE_UNLOCK_LEVEL[bNext];
    const nm = ANIMALS[bNext].name;
    if (needLv != null && needLv === curLv && p.level <= 10) {
      lines.push(`<strong>Next goal:</strong> Win this mission to recruit ${nm}.`);
    } else if (needLv != null) {
      lines.push(`<strong>Next unlock:</strong> ${nm} — beat Level ${needLv}.`);
    } else lines.push(`<strong>Next:</strong> ${nm}`);
  } else if (!apexLevelGateMet(p)) {
    lines.push(`<strong>Next goal:</strong> Beat Level 5 to open <strong>Apex Predators</strong>, then quiz in the Forge.`);
  } else if (getNextApexAnimalId(p)) {
    const id = getNextApexAnimalId(p);
    lines.push(`<strong>Next goal:</strong> Pass the <strong>${ANIMALS[id].name}</strong> Apex quiz in the Forge.`);
  } else if (!dinoLevelGateMet(p)) {
    lines.push(`<strong>Next goal:</strong> Beat Level 8 to open <strong>Dinosaurs</strong>, then quiz in the Forge.`);
  } else if (getNextDinoAnimalId(p)) {
    const id = getNextDinoAnimalId(p);
    lines.push(`<strong>Next goal:</strong> Pass the <strong>${ANIMALS[id].name}</strong> Dino quiz in the Forge.`);
  } else {
    lines.push(`<strong>You cleared the roster!</strong> Push levels, coins, and leaderboard rank.`);
  }
  return lines;
}

function getAvailableAnimals(progress) {
  return Object.keys(ANIMALS).filter(id => {
    const a = ANIMALS[id];
    if (a.stage === STAGE_BASE) {
      return canAccessStage(progress, STAGE_BASE) && isBaseAnimalUnlocked(id, progress);
    }
    if (a.stage === STAGE_APEX) {
      return (
        canAccessStage(progress, STAGE_APEX) &&
        apexLevelGateMet(progress) &&
        progress.quizUnlocked.includes(id)
      );
    }
    if (a.stage === STAGE_DINO) {
      return (
        canAccessStage(progress, STAGE_DINO) &&
        dinoLevelGateMet(progress) &&
        progress.quizUnlocked.includes(id)
      );
    }
    return false;
  });
}

function isQuizEligible(id, progress) {
  const a = ANIMALS[id];
  if (!a || a.stage === STAGE_BASE) return false;
  if (progress.quizUnlocked.includes(id)) return false;
  if (a.stage === STAGE_APEX) {
    return canAccessStage(progress, STAGE_APEX) && apexLevelGateMet(progress);
  }
  if (a.stage === STAGE_DINO) {
    return canAccessStage(progress, STAGE_DINO) && dinoLevelGateMet(progress);
  }
  return false;
}

function isLevelLocked(id, progress) {
  const a = ANIMALS[id];
  if (a.stage === STAGE_APEX) return progress.level < 6;
  if (a.stage === STAGE_DINO) return progress.level < 9;
  return false;
}

/** Checklist for hub / roster (base level gates + apex & dinosaurs). */
function unlockGateLinesForAnimal(id, progress) {
  const a = ANIMALS[id];
  if (a.stage === STAGE_BASE && !isBaseAnimalUnlocked(id, progress)) {
    const needLv = BASE_UNLOCK_LEVEL[id];
    if (needLv == null) return [{ ok: false, text: 'Play levels to recruit' }];
    return [{ ok: progress.level > needLv, text: `Beat Level ${needLv}` }];
  }
  if (a.stage === STAGE_APEX) {
    const levelOk = apexLevelGateMet(progress);
    const quizOk = progress.quizUnlocked.includes(id);
    return [
      { ok: levelOk, text: 'Beat Level 5' },
      { ok: quizOk, text: 'Pass Apex quiz' },
    ];
  }
  if (a.stage === STAGE_DINO) {
    const levelOk = dinoLevelGateMet(progress);
    const quizOk = progress.quizUnlocked.includes(id);
    return [
      { ok: levelOk, text: 'Beat Level 8' },
      { ok: quizOk, text: 'Pass Dino quiz' },
    ];
  }
  return null;
}

function quizUiTierType(animalId) {
  return ANIMALS[animalId]?.stage === STAGE_DINO ? 'dino' : 'apex';
}

// ═══════════════════════════════════════════════════════════════════
// RETENTION: streak, daily challenge, coins, soft monetisation copy
// ═══════════════════════════════════════════════════════════════════

function mergeStatBoosts(a, b) {
  const o = EMPTY_STAT_BOOST();
  for (const k of ['spd', 'agi', 'int', 'str']) o[k] = (a[k] || 0) + (b[k] || 0);
  return o;
}

function sumBoostPoints(boost) {
  return ['spd', 'agi', 'int', 'str'].reduce((s, k) => s + (boost[k] || 0), 0);
}

/** Small in-battle stat bonus from consecutive-day streak (stacks with quiz boosts). */
function getStreakBattleBoost(progress) {
  const n = progress?.streakCount || 0;
  const o = EMPTY_STAT_BOOST();
  if (n >= 7) {
    o.spd = 1;
    o.agi = 1;
    o.int = 1;
  } else if (n >= 3) {
    o.spd = 1;
  }
  return o;
}

function getActiveBattleBoosts() {
  const b = state.battle;
  const q = b?.quizBoosts || EMPTY_STAT_BOOST();
  const s = state.progress ? getStreakBattleBoost(state.progress) : EMPTY_STAT_BOOST();
  return mergeStatBoosts(q, s);
}

/** First visit each calendar day: extend or reset streak; +2 coins when continuing a streak. */
function touchDailyStreakIfNeeded(progress) {
  const today = localDateString();
  if (progress.lastPlayedDate === today) return false;
  const yesterday = localYesterdayString();
  if (progress.lastPlayedDate === yesterday) {
    progress.streakCount = (progress.streakCount || 0) + 1;
    progress.coins = (progress.coins || 0) + 2;
  } else {
    progress.streakCount = 1;
  }
  progress.lastPlayedDate = today;
  return true;
}

const DAILY_CHALLENGE_DEFS = [
  { id: 'speed', title: 'Speed squad', desc: 'Win using only animals with Speed 8+' },
  { id: 'light', title: 'Light hitters', desc: 'Win with no animal at Strength 10+' },
  { id: 'double', title: 'Double down', desc: 'Win 2 missions today' },
];

function pickDailyChallenge(dateKey) {
  let h = 2166136261;
  for (let i = 0; i < dateKey.length; i++) h = Math.imul(h ^ dateKey.charCodeAt(i), 16777619);
  const idx = Math.abs(h) % DAILY_CHALLENGE_DEFS.length;
  return DAILY_CHALLENGE_DEFS[idx];
}

function ensureDailyChallengeRolled(progress) {
  const t = localDateString();
  if (progress.dailyChallengeDayKey !== t) {
    progress.dailyChallengeDayKey = t;
    progress.dailyWinsToday = 0;
    progress.dailyChallengeRewardClaimed = false;
  }
}

function dailyChallengeMet(def, progress, hybrid, won) {
  if (!won || progress.dailyChallengeRewardClaimed) return false;
  const ids = hybrid?.animals || [];
  if (!ids.length) return false;
  if (def.id === 'speed') return ids.every(id => (ANIMALS[id]?.spd ?? 0) >= 8);
  if (def.id === 'light') return ids.every(id => (ANIMALS[id]?.str ?? 0) < 10);
  if (def.id === 'double') return (progress.dailyWinsToday || 0) >= 2;
  return false;
}

/** Show friendly “shop later” copy without blocking (hard gates use MONETIZE_PLACEHOLDER + canAccessStage). */
const RETENTION_SOFT_MONETISE_COPY = true;

function getRetentionShopTeasers() {
  if (!RETENTION_SOFT_MONETISE_COPY) return [];
  return [
    '<span class="soft-gate-pill">Shop soon</span> Optional packs will <strong>speed up</strong> unlocks — the whole game stays playable free.',
  ];
}

function getSoftMonetisationHintLines(progress) {
  if (!RETENTION_SOFT_MONETISE_COPY || !progress) return [];
  const lines = [];
  const bFull = countBaseUnlocked(progress) >= BASE_IDS.length;
  if (!MONETIZE_PLACEHOLDER.fullBaseStageOwned && bFull) {
    lines.push('<span class="soft-gate-pill">Unlock full set</span> Continue with every base animal — <strong>instant unlock</strong> when payments go live.');
  }
  if (!MONETIZE_PLACEHOLDER.apexStageOwned && apexLevelGateMet(progress) && countApexUnlocked(progress) < APEX_IDS.length) {
    lines.push('<span class="soft-gate-pill">Unlock Apex</span> Or keep clearing <strong>Apex quizzes</strong> for free — your choice.');
  }
  if (!MONETIZE_PLACEHOLDER.dinosaurStageOwned && dinoLevelGateMet(progress) && countDinoUnlocked(progress) < DINO_IDS.length) {
    lines.push('<span class="soft-gate-pill">Unlock Dinosaurs</span> Or earn each beast with <strong>Dino quizzes</strong>.');
  }
  return lines;
}

function formatMiniStatPreview(a) {
  return `<span class="a-stat-preview">${a.spd}/${a.agi}/${a.int}/${a.str}</span>`;
}

// ═══════════════════════════════════════════════════════════════════
// PERSISTENCE (Firestore users/{uid})
// ═══════════════════════════════════════════════════════════════════

function normalizeProgress(p) {
  if (!p.quizUnlocked) p.quizUnlocked = [];
  if (p.highestLevelReached == null) p.highestLevelReached = 0;
  if (p.streakCount == null) p.streakCount = 0;
  if (!p.stageAccess) p.stageAccess = { base: true, apex: true, dinosaur: true };
  if (p.progressSchemaVersion == null) p.progressSchemaVersion = 0;
  if (p.coins == null) p.coins = 0;
  if (p.unlockTokens == null) p.unlockTokens = 0;
  if (p.dailyWinsToday == null) p.dailyWinsToday = 0;
  if (p.dailyChallengeRewardClaimed == null) p.dailyChallengeRewardClaimed = false;
  if (p.totalQuizQuestions == null) p.totalQuizQuestions = 0;
  if (p.totalQuizCorrect == null) p.totalQuizCorrect = 0;
  if (p.commanderXp == null) p.commanderXp = 0;
  return p;
}

/** Kid-safe display name for hybrid; falls back to generated code-name. */
function sanitizeHybridName(raw, fallback) {
  const fb = (fallback || 'HYBRID').slice(0, 24);
  if (raw == null || typeof raw !== 'string') return fb;
  let s = raw.replace(/[\u0000-\u001F<>]/g, '').trim().slice(0, 24);
  if (!s) return fb;
  return s;
}

function computeQuizAccuracy(progress) {
  const t = progress?.totalQuizQuestions ?? 0;
  if (t <= 0) return null;
  const c = Math.min(progress.totalQuizCorrect ?? 0, t);
  return Math.round((100 * c) / t);
}

function recordQuizAnswers(progress, questionsAnswered, correctCount) {
  if (!progress || questionsAnswered <= 0) return;
  const q = Math.max(0, Math.floor(questionsAnswered));
  const ok = Math.max(0, Math.min(Math.floor(correctCount), q));
  progress.totalQuizQuestions = (progress.totalQuizQuestions || 0) + q;
  progress.totalQuizCorrect = (progress.totalQuizCorrect || 0) + ok;
}

/** Safe migration for saves from before 3-stage roster (implicit free tier-1, apex string, etc.). */
function applyProgressMigration(p) {
  if (p.progressSchemaVersion >= 1) return;
  const played =
    p.level > 1 ||
    p.totalWins + p.totalLosses > 0 ||
    (p.unlockedAnimals && p.unlockedAnimals.length > 0) ||
    p.highestLevelReached > 0 ||
    (p.quizUnlocked && p.quizUnlocked.length > 0);
  const legacyFreeBase = ['wolf', 'bear', 'eagle', 'lion', 'cheetah', 'gorilla', 'dolphin', 'croc'];
  if (played) {
    for (const id of legacyFreeBase) {
      if (!p.unlockedAnimals.includes(id)) p.unlockedAnimals.push(id);
    }
  } else if (!p.unlockedAnimals.length) {
    p.unlockedAnimals = [...STARTER_BASE_IDS];
  }
  p.unlockedAnimals = [...new Set(p.unlockedAnimals)].filter(id => id !== 'apex' && ANIMALS[id]);
  p.progressSchemaVersion = 1;
}

function firestoreDataToProgress(data) {
  if (!data) return normalizeProgress(defaultProgress());
  const apex = data.unlockedApex || [];
  const dinos = data.unlockedDinosaurs || [];
  const quizUnlocked = [...new Set([...apex, ...dinos])].filter(id => ANIMALS[id]);
  const rawUnlocked = data.unlockedAnimals ? [...data.unlockedAnimals] : [];
  const p = {
    level: data.currentLevel ?? 1,
    unlockedAnimals: rawUnlocked.filter(id => id !== 'apex' && ANIMALS[id]),
    quizUnlocked,
    totalWins: data.totalWins ?? 0,
    totalLosses: data.totalLosses ?? 0,
    highestLevelReached: data.highestLevelReached ?? 0,
    streakCount: data.streakCount ?? 0,
    lastPlayedDate: data.lastPlayedDate ?? null,
    progressSchemaVersion: data.progressSchemaVersion ?? 0,
    coins: data.coins ?? data.fusionCoins ?? 0,
    unlockTokens: data.unlockTokens ?? 0,
    dailyChallengeDayKey: data.dailyChallengeDayKey ?? null,
    dailyWinsToday: data.dailyWinsToday ?? 0,
    dailyChallengeRewardClaimed: data.dailyChallengeRewardClaimed === true,
    totalQuizQuestions: data.totalQuizQuestions ?? 0,
    totalQuizCorrect: data.totalQuizCorrect ?? 0,
    commanderXp: data.commanderXp ?? 0,
    stageAccess: {
      base: data.stageAccess?.base !== false,
      apex: data.stageAccess?.apex !== false,
      dinosaur: data.stageAccess?.dinosaur !== false,
    },
  };
  normalizeProgress(p);
  applyProgressMigration(p);
  return p;
}

function serializeHybrid(h) {
  if (!h) return null;
  return {
    animals: [...h.animals],
    stats: { ...h.stats },
    sources: { ...h.sources },
    power: h.power,
    tierClass: h.tierClass,
    name: h.name,
    emojis: h.emojis,
    composition: h.composition,
  };
}

/** Default true; future settings toggle can set false on users/{uid} only. */
function isLeaderboardOptIn() {
  return state.profile?.leaderboardOptIn !== false;
}

function hybridPowerForLeaderboard() {
  return state.playerHybrid?.power ?? 0;
}

/** First-time public row so new accounts appear in queries without waiting for a battle save. */
async function writeLeaderboardBootstrapDoc(uid, username) {
  if (!uid) return;
  try {
    await setDoc(
      leaderboardDocRef(uid),
      {
        uid,
        username: String(username || 'Commander').slice(0, 40),
        hybridName: '',
        highestLevelReached: 0,
        currentCampaignLevel: 1,
        totalWins: 0,
        hybridPowerScore: 0,
        commanderXp: 0,
        totalQuizQuestions: 0,
        totalQuizCorrect: 0,
        quizAccuracy: null,
        leaderboardOptIn: true,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    console.log('[lb] bootstrap leaderboard doc OK', { uid });
  } catch (e) {
    console.error('[lb] bootstrap leaderboard doc failed', { uid, err: e });
  }
}

/** Deterministic public doc at leaderboardEntries/{uid} — never stores email. */
async function syncLeaderboardEntry(progress) {
  const uid = state.profile?.uid;
  if (!uid || !progress) {
    console.log('[lb] sync skip — no uid or progress');
    return;
  }
  const ref = leaderboardDocRef(uid);
  try {
    if (!isLeaderboardOptIn()) {
      console.log('[lb] sync start (opt-out stub)', { uid });
      const payload = {
        uid,
        leaderboardOptIn: false,
        updatedAt: serverTimestamp(),
      };
      await setDoc(ref, payload, { merge: true });
      console.log('[lb] sync success (opt-out)', { uid });
      return;
    }
    const acc = computeQuizAccuracy(progress);
    const pubName = sanitizeHybridName(
      state.playerHybrid?.name,
      state.playerHybrid ? hybridName(state.playerHybrid.animals) : ''
    );
    const hl = Math.max(0, Math.floor(Number(progress.highestLevelReached) || 0));
    const payload = {
      uid,
      username: String(state.profile.username || 'Commander').slice(0, 40),
      hybridName: pubName || '',
      highestLevelReached: hl,
      currentCampaignLevel: Math.max(1, Math.floor(Number(progress.level) || 1)),
      totalWins: Math.max(0, Math.floor(Number(progress.totalWins) || 0)),
      hybridPowerScore: Math.max(0, Math.floor(Number(hybridPowerForLeaderboard()) || 0)),
      commanderXp: Math.max(0, Math.floor(Number(progress.commanderXp) || 0)),
      totalQuizQuestions: Math.max(0, Math.floor(Number(progress.totalQuizQuestions) || 0)),
      totalQuizCorrect: Math.max(0, Math.floor(Number(progress.totalQuizCorrect) || 0)),
      quizAccuracy: acc != null ? acc : null,
      leaderboardOptIn: true,
      updatedAt: serverTimestamp(),
    };
    console.log('[lb] sync start (opt-in)', { uid });
    console.log('[lb] payload', payload);
    await setDoc(ref, payload, { merge: true });
    console.log('[lb] sync success (opt-in)', { uid });
  } catch (e) {
    console.error('[lb] sync failed', { uid, err: e });
  }
}

async function saveUserProgress(progress) {
  const uid = state.profile?.uid;
  if (!uid || !progress) return;
  const p = progress;
  const apex = (p.quizUnlocked || []).filter(id => APEX_IDS.includes(id));
  const dinos = (p.quizUnlocked || []).filter(id => DINO_IDS.includes(id));
  const optIn = isLeaderboardOptIn();
  await setDoc(
    userDocRef(uid),
    {
      uid,
      username: state.profile.username,
      email: state.profile.email,
      currentLevel: p.level,
      highestLevelReached: p.highestLevelReached ?? 0,
      unlockedAnimals: [...(p.unlockedAnimals || [])],
      unlockedApex: apex,
      unlockedDinosaurs: dinos,
      selectedHybridAnimals: [...(state.selectedAnimals || [])],
      hybridStats: serializeHybrid(state.playerHybrid),
      totalWins: p.totalWins ?? 0,
      totalLosses: p.totalLosses ?? 0,
      streakCount: p.streakCount ?? 0,
      lastPlayedDate: p.lastPlayedDate ?? null,
      leaderboardOptIn: optIn,
      progressSchemaVersion: p.progressSchemaVersion ?? 1,
      coins: p.coins ?? 0,
      unlockTokens: p.unlockTokens ?? 0,
      dailyChallengeDayKey: p.dailyChallengeDayKey ?? null,
      dailyWinsToday: p.dailyWinsToday ?? 0,
      dailyChallengeRewardClaimed: p.dailyChallengeRewardClaimed === true,
      totalQuizQuestions: p.totalQuizQuestions ?? 0,
      totalQuizCorrect: p.totalQuizCorrect ?? 0,
      commanderXp: p.commanderXp ?? 0,
      stageAccess: { ...(p.stageAccess || { base: true, apex: true, dinosaur: true }) },
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
  await syncLeaderboardEntry(p);
}

function sortLeaderboardRows(rows) {
  return [...rows].sort((a, b) => {
    const hl = (b.highestLevelReached || 0) - (a.highestLevelReached || 0);
    if (hl !== 0) return hl;
    const hp = (b.hybridPowerScore || 0) - (a.hybridPowerScore || 0);
    if (hp !== 0) return hp;
    return (b.totalWins || 0) - (a.totalWins || 0);
  });
}

/** Top 100 for rank lookup; UI shows first 25. */
async function fetchLeaderboardTop25() {
  const q = query(
    collection(db, 'leaderboardEntries'),
    where('leaderboardOptIn', '==', true),
    orderBy('highestLevelReached', 'desc'),
    limit(100)
  );
  const snap = await getDocs(q);
  const rows = snap.docs.map(d => ({ ...d.data(), _id: d.id }));
  return sortLeaderboardRows(rows).slice(0, 25);
}

async function fetchLeaderboardWithRank() {
  const q = query(
    collection(db, 'leaderboardEntries'),
    where('leaderboardOptIn', '==', true),
    orderBy('highestLevelReached', 'desc'),
    limit(100)
  );
  const snap = await getDocs(q);
  const rows = sortLeaderboardRows(snap.docs.map(d => ({ ...d.data(), _id: d.id })));
  console.log('[lb] query result', { docs: snap.docs.length, sorted: rows.length });
  const myUid = state.profile?.uid;
  let myRank = null;
  if (myUid) {
    const idx = rows.findIndex(r => r.uid === myUid);
    if (idx >= 0) myRank = idx + 1;
  }
  return { rows: rows.slice(0, 25), myRank, scanned: rows.length };
}

function persistGameProgress() {
  if (!state.profile?.uid || !state.progress) return;
  return saveUserProgress(state.progress);
}

// ═══════════════════════════════════════════════════════════════════
// HYBRID LOGIC
// ═══════════════════════════════════════════════════════════════════

function hybridName(animalIds) {
  if (!animalIds || !animalIds.length) return 'UNKNOWN';
  return animalIds.map(id => SYLLABLES[id] || id.slice(0,3).toUpperCase()).join('') + '-X';
}

function powerScore(stats) {
  return stats.spd + stats.agi + stats.int + stats.str;
}

function hybridTierClass(selectedIds) {
  const ranks = selectedIds.map(id => STAGE_RANK[ANIMALS[id]?.stage] || 1);
  const maxR = Math.max(...ranks, 1);
  if (maxR >= 3) return 'dino';
  if (maxR >= 2) return 'apex';
  return 'base';
}

function hybridFromSaved(h) {
  if (!h || !h.animals?.length) return null;
  const auto = hybridName(h.animals);
  const nm = h.name != null && String(h.name).trim() ? String(h.name).trim() : auto;
  return {
    animals: h.animals,
    stats: h.stats,
    sources: h.sources || {},
    power: h.power,
    tierClass: h.tierClass || hybridTierClass(h.animals),
    name: sanitizeHybridName(nm, auto),
    emojis: h.emojis,
    composition: h.composition,
  };
}

function buildPlayerHybrid(selectedIds) {
  const animals = selectedIds.map(id => ALL_ANIMALS[id]);
  const stats = {};
  const sources = {};
  for (const stat of ['spd','agi','int','str']) {
    const src = animals[Math.floor(Math.random() * animals.length)];
    stats[stat] = src[stat];
    sources[stat] = src.name;
  }
  return {
    animals: selectedIds,
    stats,
    sources,
    power: powerScore(stats),
    tierClass: hybridTierClass(selectedIds),
    name: sanitizeHybridName(hybridName(selectedIds), hybridName(selectedIds)),
    emojis: selectedIds.map(id => ALL_ANIMALS[id].emoji).join(''),
    composition: selectedIds.map(id => ALL_ANIMALS[id].name).join(' · '),
  };
}

function buildEnemyHybrid(levelDef) {
  const components = levelDef.animals.map(id => ALL_ANIMALS[id]).filter(Boolean);
  const stats = {};
  for (const stat of ['spd','agi','int','str']) {
    const vals = components.map(a => a[stat]);
    stats[stat] = levelDef.useMax ? Math.max(...vals) : Math.round(vals.reduce((a,b)=>a+b,0)/vals.length);
  }
  return {
    animals: levelDef.animals,
    stats,
    power: powerScore(stats),
    name: levelDef.name.toUpperCase(),
    emojis: components.map(a => a.emoji).join(''),
    composition: components.map(a => a.name).join(' · '),
    diceBonus: levelDef.diceBonus || 0,
  };
}

// ═══════════════════════════════════════════════════════════════════
// BATTLE ENGINE
// ═══════════════════════════════════════════════════════════════════

const STAT_WEIGHTS = ['spd','spd','agi','agi','int','str','str','str'];
const STAT_LABELS = {spd:'SPEED',agi:'AGILITY',int:'INTELLIGENCE',str:'STRENGTH'};
const STAT_LABELS_SIMPLE = {spd:'Speed',agi:'Agility',int:'Intelligence',str:'Strength'};
const STAT_TRAIL_ICONS = { spd: '⚡', agi: '✦', int: '◇', str: '💪' };
const PRE_BATTLE_STAT_WORDS = { spd: 'speed', agi: 'agility', int: 'intelligence', str: 'strength' };
const EMPTY_STAT_BOOST = () => ({ spd: 0, agi: 0, int: 0, str: 0 });

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Surprising fact MCQs — one pool per roster animal; boostStat tags which stat gets +1 when correct. */
const PRE_BATTLE_QUESTIONS = {
  wolf: [
    { q: 'How far away can a wolf sometimes hear a howl in open country?', opts: ['Only a few trees away', 'Roughly as far as a loud concert', 'Miles and miles on a clear night', 'Wolves cannot hear howls'], correct: 2, boostStat: 'int', funFact: 'Wolves tune in to packmates from incredibly far away — their ears and brain teamwork is elite.' },
    { q: 'What is wild about a wolf pack’s teamwork?', opts: ['They never share food', 'They can coordinate big hunts like a sports team', 'Only the youngest wolf hunts', 'They avoid each other'], correct: 1, boostStat: 'agi', funFact: 'Real packs split roles: some chase, some block, so dinner does not get away.' },
    { q: 'A wolf’s paws are like snowshoes because…', opts: ['They are tiny', 'Toes spread wide to spread weight on soft ground', 'They glow', 'They spin'], correct: 1, boostStat: 'agi', funFact: 'Wide paws help wolves cruise snow and sand without sinking — built-in trail gear.' },
    { q: 'Wolves “test” big prey by…', opts: ['Asking for ID', 'Harassing from many sides to find a weak spot', 'Sending emails', 'Doing nothing'], correct: 1, boostStat: 'int', funFact: 'Team pressure turns panic into a mistake — strategy beats brute rushing.' },
    { q: 'Why do wolves howl together?', opts: ['To break glass', 'To sync the pack and warn strangers', 'Because the moon pays them', 'They hate music'], correct: 1, boostStat: 'str', funFact: 'A chorus says “we are here and we are family” — long-distance group chat.' },
  ],
  bear: [
    { q: 'A bear’s sense of smell is so strong it can be compared to…', opts: ['A house cat', 'A superhero nose — kilometers away', 'Only what touches its whiskers', 'Nothing special'], correct: 1, boostStat: 'int', funFact: 'Some bears detect food from an insane distance — like finding one snack in a whole stadium.' },
    { q: 'Climbing trees is a bear skill because…', opts: ['They are too heavy to try', 'They are shockingly strong climbers for their size', 'Only cubs fake-climb', 'Bears hate heights'], correct: 1, boostStat: 'str', funFact: 'Big bears can go up trunks to escape danger or steal a beehive snack.' },
    { q: 'Before winter, many bears focus on…', opts: ['Learning piano', 'Eating a ton to build fat reserves', 'Only drinking soda', 'Growing shorter'], correct: 1, boostStat: 'str', funFact: 'Fat is their battery for months without groceries — nature’s power bank.' },
    { q: 'A mother bear with cubs is dangerous mostly because…', opts: ['She is always calm', 'She protects babies like a bodyguard on turbo', 'She cannot see', 'She loves selfies'], correct: 1, boostStat: 'spd', funFact: 'Never surprise a cub caravan — mom’s job is “no.”' },
    { q: 'Bears often flip rocks and tear logs because…', opts: ['They redecorate', 'Insects and grubs are crunchy protein snacks', 'They hate wood', 'They think it is a game show'], correct: 1, boostStat: 'int', funFact: 'Snack hunting is serious work — muscles + patience = calories.' },
  ],
  eagle: [
    { q: 'Eagle eyes are famous because they can…', opts: ['Only see black and white', 'Spot small prey from very high in the sky', 'See behind their head', 'Only work underwater'], correct: 1, boostStat: 'int', funFact: 'Their vision is like built-in zoom lenses — perfect for a sky hunter.' },
    { q: 'How do eagles usually grab moving prey?', opts: ['They kick it', 'They dive with talons locked like grappling hooks', 'They bark until it stops', 'They never grab prey'], correct: 1, boostStat: 'spd', funFact: 'A stooping eagle is a lightning-fast strike from above.' },
    { q: 'Eagle talons work like…', opts: ['Spoons', 'Locking meat hooks — serious grip strength', 'Feathers only', 'Bubble wands'], correct: 1, boostStat: 'str', funFact: 'Once those toes clamp, escape gets very unlikely.' },
    { q: 'Big eagles sometimes steal food from smaller hunters — that is called…', opts: ['Sharing nicely', 'Kleptoparasitism — lunch robbery', 'Dancing', 'Gardening'], correct: 1, boostStat: 'agi', funFact: 'Why hunt if you can yoink? (Still rude in animal court.)' },
    { q: 'An eagle’s sharp beak is best for…', opts: ['Tearing food into swallowable pieces', 'Brushing hair', 'Typing', 'Playing drums'], correct: 0, boostStat: 'int', funFact: 'Beak + talons = fork-and-knife toolkit built in.' },
  ],
  lion: [
    { q: 'A lion’s roar is special because it can…', opts: ['Only work underwater', 'Travel far and warn rivals away', 'Sound like a bird', 'Be heard only 1 foot away'], correct: 1, boostStat: 'str', funFact: 'That deep roar is a long-distance “this pride is taken” broadcast.' },
    { q: 'Lionesses often hunt in a group — why?', opts: ['They are shy alone', 'Teamwork corners fast prey', 'They never eat meat', 'They only hunt at midnight exactly'], correct: 1, boostStat: 'agi', funFact: 'Coordinated flanking is how prides catch speedy animals on the savanna.' },
    { q: 'Male lions grow manes partly to…', opts: ['Store water balloons', 'Look bigger and protect the neck in fights', 'Hide from fish', 'Cool down instantly'], correct: 1, boostStat: 'str', funFact: 'A fluffy mane screams “I survived battles” to rivals.' },
    { q: 'Lions rest a lot because…', opts: ['They are lazy only', 'Hunting bursts cost huge energy in heat', 'They cannot move', 'They are nocturnal robots'], correct: 1, boostStat: 'int', funFact: 'Save energy, strike smart — lion economics.' },
    { q: 'A pride is basically…', opts: ['A random crowd', 'A family team with roles', 'A school bus', 'A cloud'], correct: 1, boostStat: 'int', funFact: 'Related lionesses often stick together — strength in sisterhood.' },
  ],
  cheetah: [
    { q: 'After a cheetah’s famous sprint, what usually happens?', opts: ['It keeps sprinting for hours', 'It overheats fast and needs a breather', 'It falls asleep instantly', 'It grows taller'], correct: 1, boostStat: 'spd', funFact: 'Top speed is a short turbo boost — biology trades endurance for blink-fast bursts.' },
    { q: 'Cheetahs use their long tails while running to…', opts: ['Look fancy', 'Steer and balance like a rudder', 'Store snacks', 'Signal airplanes'], correct: 1, boostStat: 'agi', funFact: 'That tail helps them corner without wiping out at crazy speeds.' },
    { q: 'Cheetah “tear marks” by the eyes may help with…', opts: ['Fashion week', 'Glare reduction like built-in sunglasses stripes', 'Flying', 'Storing food'], correct: 1, boostStat: 'int', funFact: 'Sharp focus on prey beats squinting in bright sun.' },
    { q: 'Cheetahs prefer hunting during…', opts: ['Loud parades', 'Cooler hours like dawn and dusk', 'Only underwater', 'Never'], correct: 1, boostStat: 'agi', funFact: 'Less heat = better sprint stats — smart scheduling.' },
    { q: 'A cheetah’s non-retractable grip claws act like…', opts: ['Crayons', 'Cleats for traction on dirt', 'Umbrellas', 'Headphones'], correct: 1, boostStat: 'spd', funFact: 'Traction turns speed into a controlled drift, not a slip-n-slide.' },
  ],
  gorilla: [
    { q: 'How does gorilla strength compare to most humans?', opts: ['About the same as a toddler', 'Way beyond what a human can match', 'Weaker than a pigeon', 'Only in cartoons'], correct: 1, boostStat: 'str', funFact: 'Adult gorillas can bend metal-looking behavior in the wild — pure power.' },
    { q: 'Gorillas are smart enough to…', opts: ['Forget everything daily', 'Use tools and learn tricky tasks', 'Only count to two forever', 'Never recognize friends'], correct: 1, boostStat: 'int', funFact: 'They have been seen using sticks and solving problems like puzzle pros.' },
    { q: 'Despite movies, real wild gorillas are usually…', opts: ['Chaos gremlins', 'Gentle plant munchers unless threatened', 'Candy thieves', 'Invisible'], correct: 1, boostStat: 'int', funFact: 'Leafy diet + calm vibes — respect their space and they chill.' },
    { q: 'Silverback means…', opts: ['A fish', 'A mature male leader with a gray saddle on his back', 'A baby', 'A bird'], correct: 1, boostStat: 'str', funFact: 'That silver cape screams “I run this group.”' },
    { q: 'Gorilla knuckle-walking helps…', opts: ['Carry suitcases', 'Support heavy bodies while moving through forest', 'Swim faster', 'Climb clouds'], correct: 1, boostStat: 'agi', funFact: 'Strong arms + clever gait = forest SUV mode.' },
  ],
  dolphin: [
    { q: 'Dolphins sleep in a sneaky way — how?', opts: ['They stop breathing', 'One brain half rests while they keep swimming', 'They only sleep on land', 'They never sleep'], correct: 1, boostStat: 'int', funFact: 'Half-awake mode lets them surface to breathe and still get rest. Wild!' },
    { q: 'Dolphin echolocation is basically…', opts: ['Random clicking', 'A sound map that “sees” underwater', 'Only for jokes', 'Useless in the ocean'], correct: 1, boostStat: 'int', funFact: 'Clicks bounce back as a picture of fish hiding in murky water.' },
    { q: 'Dolphins sometimes surf boat wakes because…', opts: ['They hate fun', 'Free speed boost — smart energy saving', 'They are lost', 'Boats feed them'], correct: 1, boostStat: 'spd', funFact: 'Why swim harder if a wave does the work?' },
    { q: 'A dolphin pod can herd fish into a ball by…', opts: ['Magic spells', 'Teamwork bubbles and coordinated moves', 'Doing nothing', 'Singing only'], correct: 1, boostStat: 'agi', funFact: 'Cooperative fishing is cafeteria teamwork underwater.' },
    { q: 'Dolphins learn hunting tricks from…', opts: ['Only books', 'Moms, friends, and pod culture', 'TV ads', 'Random luck'], correct: 1, boostStat: 'int', funFact: 'Young dolphins copy the cool kids — animal school is real.' },
  ],
  croc: [
    { q: 'A crocodile’s bite is best described as…', opts: ['Gentle like a marshmallow', 'One of the strongest crushes in nature', 'Weaker than a human chew', 'Only for plants'], correct: 1, boostStat: 'str', funFact: 'Closing jaw force is monster-level — opening muscles are weaker though.' },
    { q: 'Crocodiles have been around so long they…', opts: ['Arrived last year', 'Outlived the dinosaurs’ main era', 'Only exist in games', 'Hatched from phones'], correct: 1, boostStat: 'int', funFact: 'Survivors from deep time — same vibe as living fossils with attitude.' },
    { q: 'A croc’s eyes and nostrils on top of its head help it…', opts: ['Wear hats', 'Hide underwater while still peeking and breathing', 'Fly', 'Play piano'], correct: 1, boostStat: 'agi', funFact: 'Looks like a log — actually a surveillance tower.' },
    { q: 'Baby crocs chirp from the nest to…', opts: ['Call mom for help hatching and safety', 'Order pizza', 'Sing opera', 'Turn invisible'], correct: 0, boostStat: 'int', funFact: 'Mom hears the tiny chirps and digs them out — reptile nursery radio.' },
    { q: 'Crocs can go a long time without food partly because…', opts: ['They photosynthesize', 'They are cold-blooded and energy-efficient', 'They only drink soda', 'They never move'], correct: 1, boostStat: 'str', funFact: 'Slow burn metabolism = patient ambush lifestyle.' },
  ],
  tiger: [
    { q: 'Tiger stripes are like fingerprints because…', opts: ['They are painted on', 'Each cat’s pattern is unique', 'All tigers match perfectly', 'Stripes mean nothing'], correct: 1, boostStat: 'int', funFact: 'Scientists can tell individuals apart by stripe layout — nature’s barcode.' },
    { q: 'Tigers often hunt by…', opts: ['Loud marching bands', 'Ambush — sneak, then burst', 'Asking politely', 'Only in groups of 50'], correct: 1, boostStat: 'spd', funFact: 'Stealth + sudden speed is the tiger combo meal.' },
    { q: 'Tigers can swim surprisingly well — useful for…', opts: ['Space travel', 'Crossing rivers and cooling off', 'Flying', 'Digging tunnels'], correct: 1, boostStat: 'agi', funFact: 'Stripes work in water too — sneaky pool mode.' },
    { q: 'A tiger’s rough tongue helps…', opts: ['Comb fur and scrape meat from bones', 'Play violin', 'Stick to walls', 'Glow'], correct: 0, boostStat: 'str', funFact: 'Sandpaper tongue = grooming + last-bite cleanup.' },
    { q: 'White tigers are not a separate species — they are…', opts: ['Aliens', 'A rare color form from special genes', 'Painted', 'Birds'], correct: 1, boostStat: 'int', funFact: 'Same tiger, different paint job — genetics surprise.' },
  ],
  shark: [
    { q: 'Shark skeletons are mostly made of…', opts: ['Solid steel', 'Flexible cartilage like your ears', 'Glass', 'Wood'], correct: 1, boostStat: 'agi', funFact: 'Cartilage keeps them lighter and bendy — handy for tight turns.' },
    { q: 'Some sharks can sense…', opts: ['Only color TV', 'Tiny electric fields from prey muscles', 'Nothing at all', 'Only loud music'], correct: 1, boostStat: 'int', funFact: 'Ampullae of Lorenzini sound sci-fi but are real electric detectors.' },
    { q: 'Sharks must keep water moving over their gills — great whites do it by…', opts: ['Sleeping forever', 'Swimming forward (ram ventilation)', 'Holding breath like humans', 'Clapping'], correct: 1, boostStat: 'spd', funFact: 'Swim or suffocate — motion is oxygen for many big sharks.' },
    { q: 'Shark teeth rows are like…', opts: ['A conveyor belt of replacements', 'One set forever', 'Cotton candy', 'Magnets only'], correct: 0, boostStat: 'str', funFact: 'Lost tooth? Next one slides in — endless bite factory.' },
    { q: 'A shark’s oily liver helps…', opts: ['Play music', 'Float easier in salt water', 'Cook soup', 'Talk'], correct: 1, boostStat: 'int', funFact: 'Big liver = natural floatie — saves energy between hunts.' },
  ],
  rhino: [
    { q: 'Rhino horn is made of…', opts: ['Ivory', 'Keratin — the same stuff as fingernails', 'Chocolate', 'Diamond'], correct: 1, boostStat: 'str', funFact: 'Not bone — it grows like a mega-nail, which surprises most people.' },
    { q: 'A rhino charge is dangerous because…', opts: ['It is very slow always', 'It combines weight + surprising speed', 'It is pretend', 'Rhinos never move'], correct: 1, boostStat: 'spd', funFact: 'Tank body + a sudden rush = do not stand in the way.' },
    { q: 'Rhinos love mud wallows because…', opts: ['They hate water', 'Mud cools skin and blocks biting bugs', 'They think they are hippos', 'Mud is candy'], correct: 1, boostStat: 'int', funFact: 'Spa day with benefits — sunscreen + bug armor.' },
    { q: 'Rhinos use poop piles as…', opts: ['Art projects', 'Scent bulletin boards for other rhinos', 'Hats', 'Food'], correct: 1, boostStat: 'int', funFact: 'Smell-mail helps neighbors know who is around.' },
    { q: 'A rhino’s hearing swivels thanks to…', opts: ['Rotating ears like radar dishes', 'No ears', 'Antennae', 'Feet'], correct: 0, boostStat: 'agi', funFact: 'Cupped ears track weird sounds — listen before you charge.' },
  ],
  anaconda: [
    { q: 'How does a big constrictor like an anaconda finish a hunt?', opts: ['It sings a lullaby', 'It squeezes until the prey cannot breathe well', 'It uses laser eyes', 'It only eats plants'], correct: 1, boostStat: 'str', funFact: 'Each exhale tightens the hug — scary-efficient physics.' },
    { q: 'Anacondas shine in…', opts: ['Desert sand surfing', 'Water — sneaky swimming ambushes', 'Mountain climbing only', 'Flying'], correct: 1, boostStat: 'agi', funFact: 'Rivers are their hide-and-seek playground.' },
    { q: 'After a huge meal, a big anaconda might…', opts: ['Run a marathon', 'Digest slowly for days or weeks', 'Explode', 'Lay eggs on the moon'], correct: 1, boostStat: 'str', funFact: 'Snake food coma is measured in weeks — living pantry mode.' },
    { q: 'Female green anacondas are often much larger than males — that helps…', opts: ['Win jump rope', 'Carry young and dominate river hunting', 'Become birds', 'Glow'], correct: 1, boostStat: 'int', funFact: 'In some species, the ladies are the true river bosses.' },
    { q: 'Heat-sensing pits on a snake’s face help…', opts: ['Play music', 'Notice warm-blooded prey even in the dark', 'Fly', 'Swim in lava'], correct: 1, boostStat: 'int', funFact: 'Night vision bonus track — warmth glows like a target.' },
  ],
  komodo: [
    { q: 'Komodo dragons are famous for…', opts: ['Being harmless plush toys', 'Venomous bite chemistry + brute force', 'Only eating salad', 'Living only in ice'], correct: 1, boostStat: 'str', funFact: 'Their bite cocktail helps take down big prey — real dragon energy.' },
    { q: 'Baby komodos sometimes climb trees to…', opts: ['Text friends', 'Escape hungry adults', 'Practice music', 'Become birds'], correct: 1, boostStat: 'agi', funFact: 'Even babies know the floor can be risky around bigger dragons.' },
    { q: 'Komodos can taste the air with…', opts: ['Their ears', 'A forked tongue flick', 'Their toes', 'Elbows'], correct: 1, boostStat: 'int', funFact: 'Chemical clues on the breeze — dragon detective mode.' },
    { q: 'Komodos can swallow chunks of meat because…', opts: ['They chew carefully always', 'Their jaws stretch and they gulp big bites', 'They only drink', 'They hate food'], correct: 1, boostStat: 'str', funFact: 'Less chewing, more monster swallow — efficient if messy.' },
    { q: 'On islands, komodos often scavenge — that means…', opts: ['They only eat salad', 'They happily clean up carcasses too', 'They never eat', 'They farm plants'], correct: 1, boostStat: 'int', funFact: 'Free calories beat risky hunts — smart island economics.' },
  ],
  mantis: [
    { q: 'The mantis shrimp punch is wild because…', opts: ['It is slower than a snail', 'It accelerates like a bullet leaving a barrel', 'It only works on Mondays', 'It is imaginary'], correct: 1, boostStat: 'spd', funFact: 'That strike can make light flashes in water — speed weapon unlocked.' },
    { q: 'Some mantis shrimp eyes see…', opts: ['Only one color', 'Polarized light humans cannot see', 'Nothing', 'Only spreadsheets'], correct: 1, boostStat: 'int', funFact: 'Their vision is a sci-fi filter for the reef.' },
    { q: '“Smashers” vs “spearers” are names for…', opts: ['Dances', 'Different mantis shrimp hunting styles', 'Fish bands', 'Boats'], correct: 1, boostStat: 'agi', funFact: 'Same animal group, different weapons loadout.' },
    { q: 'A mantis shrimp lives inside a rocky burrow partly to…', opts: ['Host concerts', 'Ambush prey from a safe doorway', 'Sleep 24/7', 'Paint'], correct: 1, boostStat: 'int', funFact: 'Home base + sudden punch = reef booby trap.' },
    { q: 'If you poke at a mantis shrimp shell, it might…', opts: ['Ask for a hug', 'Crack aquarium glass with a punch', 'Turn into mist', 'Sing'], correct: 1, boostStat: 'str', funFact: 'Respect the click — speed beats thickness sometimes.' },
  ],
  badger: [
    { q: 'Honey badgers are legends because they…', opts: ['Give up instantly', 'Fight way above their weight class', 'Only nap', 'Fear everything'], correct: 1, boostStat: 'str', funFact: 'Tough skin + fearless attitude = meme-worthy toughness.' },
    { q: 'A honey badger’s attitude is best described as…', opts: ['Shy and quiet always', 'Bold — they do not back down easy', 'Only friendly to aliens', 'Always sleeping'], correct: 1, boostStat: 'int', funFact: 'Their confidence is a survival strategy — predators think twice.' },
    { q: 'Honey badger skin is oddly…', opts: ['Paper thin', 'Tough and loose — hard to bite through', 'Made of jelly', 'Invisible'], correct: 1, boostStat: 'str', funFact: 'Grip slips, bites fail — chaos armor unlocked.' },
    { q: 'They raid beehives because…', opts: ['They hate bees', 'Bee larvae and honey are high-calorie snacks', 'Bees are friends', 'They collect wax art'], correct: 1, boostStat: 'agi', funFact: 'Stings happen — snack goals win anyway.' },
    { q: '“Ratel” is another name for honey badger — it still means…', opts: ['Shy flower', 'Same fearless mustelid menace', 'A fish', 'A cloud'], correct: 1, boostStat: 'int', funFact: 'Different label, same “do not mess with me” energy.' },
  ],
  wolverine: [
    { q: 'For its size, a wolverine is…', opts: ['The weakest animal alive', 'Absurdly strong and stubborn', 'Made of jelly', 'Unable to climb'], correct: 1, boostStat: 'str', funFact: 'Pound-for-pound tank — can steal food from bigger carnivores.' },
    { q: 'Wolverines thrive in…', opts: ['Only hot lava', 'Cold wild places with grit', 'Shopping malls', 'Only underwater cities'], correct: 1, boostStat: 'int', funFact: 'Snow stamina and toughness = northern survivor build.' },
    { q: 'Wolverines mark territory with…', opts: ['Glitter', 'Scent glands — smell graffiti', 'Balloons', 'Nothing'], correct: 1, boostStat: 'int', funFact: '“This valley is mine” but in stink format.' },
    { q: 'A wolverine’s teeth can crush…', opts: ['Only air', 'Frozen bones and tough scraps', 'Diamonds always', 'Clouds'], correct: 1, boostStat: 'str', funFact: 'Winter pantry includes leftovers others cannot open.' },
    { q: 'Wolverines travel huge distances because…', opts: ['They are lost', 'They patrol wide home ranges for food', 'They follow UFOs', 'They hate walking'], correct: 1, boostStat: 'spd', funFact: 'Marathon feet — low food density means long commutes.' },
  ],
  cassowary: [
    { q: 'Why are cassowaries called dangerous birds?', opts: ['They only eat candy', 'A kick with a dagger-like claw can seriously injure', 'They cannot move', 'They are tiny'], correct: 1, boostStat: 'str', funFact: 'Jurassic Park vibes — respect the dinosaur bird.' },
    { q: 'Cassowaries move through forest with…', opts: ['Rocket boots', 'Fast dodging bursts when threatened', 'They never walk', 'Only rolling'], correct: 1, boostStat: 'spd', funFact: 'They can sprint and leap — do not corner one.' },
    { q: 'The cassowary casque (helmet bump) might help with…', opts: ['Wi-Fi', 'Pushing through brush or showing off', 'Storing soup', 'Flying'], correct: 1, boostStat: 'agi', funFact: 'Scientists still debate — but it looks epic.' },
    { q: 'Cassowaries spread rainforest trees by…', opts: ['Painting', 'Swallowing fruit and pooping seeds elsewhere', 'Mailing seeds', 'Ignoring fruit'], correct: 1, boostStat: 'int', funFact: 'Gardeners in feathers — forest delivery service.' },
    { q: 'Bright blue skin on the neck can work as…', opts: ['Camouflage in snow', 'A warning or signal to others', 'A TV', 'Armor plates'], correct: 1, boostStat: 'int', funFact: 'Color screams “notice me” — sometimes that is a threat flex.' },
  ],
  pbear: [
    { q: 'Polar bears are amazing swimmers because…', opts: ['They avoid water', 'They cross long ocean distances hunting seals', 'They only float like corks for fun', 'They cannot swim'], correct: 1, boostStat: 'str', funFact: 'Marathon swims happen — Arctic survival is serious training.' },
    { q: 'Under ice, polar bears find seals using…', opts: ['Loud karaoke', 'Smell and patience at breathing holes', 'Only luck', 'GPS phones'], correct: 1, boostStat: 'int', funFact: 'They sniff out seal breathing spots like tactical hunters.' },
    { q: 'Polar bear fur looks white because…', opts: ['It is painted', 'Hollow hairs scatter light like snow', 'It is blue metal', 'It is wet only'], correct: 1, boostStat: 'int', funFact: 'Trick-of-the-light camouflage — sneaky science coat.' },
    { q: 'Polar bears are mostly classified as marine mammals because…', opts: ['They hate land', 'They depend on sea ice and ocean hunting', 'They have gills', 'They only eat plants'], correct: 1, boostStat: 'agi', funFact: 'Ice is their highway — seals are the fuel stations.' },
    { q: 'Mother polar bears in dens mainly…', opts: ['Throw parties', 'Keep tiny cubs warm through brutal winter', 'Train sharks', 'Grow wings'], correct: 1, boostStat: 'str', funFact: 'Cozy nursery engineering — survival school starts day one.' },
  ],
  saltcroc: [
    { q: 'Saltwater crocs are extra scary because…', opts: ['They only eat salad', 'They can ambush from water and tolerate saltwater travel', 'They are slow always', 'They are toys'], correct: 1, boostStat: 'str', funFact: '“Salty” is not a joke — they cruise between coasts and rivers.' },
    { q: 'The death roll helps a croc…', opts: ['Dance for fun', 'Rip control of prey underwater', 'Sleep', 'Fly'], correct: 1, boostStat: 'agi', funFact: 'Spinning turns a tug-of-war into a win underwater.' },
    { q: 'A salty’s eyes on top of its head help it…', opts: ['Read books', 'Spy while floating like a log', 'Sing', 'Climb trees'], correct: 1, boostStat: 'int', funFact: 'Mostly submerged surveillance — classic croc trick.' },
    { q: 'Saltwater crocs can grow…', opts: ['Smaller than a gecko always', 'Huge — some of the biggest reptiles alive', 'Only to shoe size', 'Invisible'], correct: 1, boostStat: 'str', funFact: 'Length records sound like monsters — because they are.' },
    { q: 'Baby salties chirp from the nest to…', opts: ['Order pizza', 'Signal mom to dig them out', 'Start a band', 'Turn green'], correct: 1, boostStat: 'int', funFact: 'Tiny chirps, giant mom — reptile rescue radio.' },
  ],
  orca: [
    { q: 'Orcas are actually…', opts: ['The biggest dolphins', 'A kind of goldfish', 'Plants', 'Insects'], correct: 0, boostStat: 'int', funFact: 'Killer “whale” is a dolphin cousin plot twist — biggest, smartest dolphin.' },
    { q: 'Orca pods sometimes hunt using…', opts: ['Random chaos only', 'Coached team tactics passed between generations', 'Only solo luck', 'They never hunt'], correct: 1, boostStat: 'int', funFact: 'Different pods have different cultures — real ocean teamwork.' },
    { q: 'Orcas echolocate clicks mainly to…', opts: ['Paint', 'Map prey and talk underwater', 'Cook', 'Sleep'], correct: 1, boostStat: 'agi', funFact: 'Sound vision — dark water cannot hide everything.' },
    { q: 'An orca’s black-and-white pattern may help with…', opts: ['Confusing prey when seen from above/below', 'Camouflage in lava', 'Flying', 'Growing plants'], correct: 0, boostStat: 'int', funFact: 'Countershading breaks up the silhouette — sneaky tuxedo.' },
    { q: 'Some orca pods specialize diets — that shows…', opts: ['They are picky for no reason', 'Learned culture, not just instinct', 'They hate fish', 'They only eat plastic'], correct: 1, boostStat: 'str', funFact: 'Ocean families pass down hunting styles like recipes.' },
  ],
  buffalo: [
    { q: 'When lions attack, buffalo herds may…', opts: ['Always run and abandon calves', 'Circle up and fight back as a wall', 'Fall asleep', 'Turn invisible'], correct: 1, boostStat: 'str', funFact: 'Buffalo can send lions flying — “prey” is not always helpless.' },
    { q: 'Cape buffalo are nicknamed scary because they…', opts: ['Are harmless plushies', 'Can be unpredictable and protective', 'Only eat grass politely', 'Cannot see'], correct: 1, boostStat: 'int', funFact: 'Guides respect them — smart, strong, and grudge-capable.' },
    { q: 'Buffalo horns curve so fights can…', opts: ['Hook and toss rivals or predators', 'Play violin', 'Store water', 'Glow'], correct: 0, boostStat: 'str', funFact: 'Physics meets attitude — leverage wins shoving matches.' },
    { q: 'Cape buffalo remember threats — stories show they may…', opts: ['Forget instantly', 'Circle back later to confront a predator', 'Only nap', 'Turn into birds'], correct: 1, boostStat: 'int', funFact: 'Grudge mode is real — savanna payback exists.' },
    { q: 'A buffalo herd crossing a river is risky because…', opts: ['Water is always safe', 'Crocodiles ambush at the edges', 'Fish help them', 'Rivers are fake'], correct: 1, boostStat: 'agi', funFact: 'Teamwork helps — but jaws still wait in the shallows.' },
  ],
  sibtiger: [
    { q: 'Siberian tigers deal with cold using…', opts: ['Summer shorts only', 'Thick fur and a serious fat layer', 'Hot cocoa only', 'They live in volcanoes'], correct: 1, boostStat: 'str', funFact: 'They are built like furry tanks for -40 style winters.' },
    { q: 'Among big cats, Siberian tigers are often…', opts: ['The smallest ever', 'Some of the largest and heaviest', 'The size of mice', 'Invisible'], correct: 1, boostStat: 'str', funFact: 'Cold climate giants — extra bulk keeps heat inside.' },
    { q: 'Siberian tigers patrol huge territories because…', opts: ['They are lost', 'Prey is spread thin in cold forests', 'They hate walking', 'They follow trains'], correct: 1, boostStat: 'spd', funFact: 'Big home range = lots of quiet hiking between meals.' },
    { q: 'Their padded paws work like…', opts: ['Sandals on snow — quieter stalking', 'Drums', 'Wings', 'Speakers'], correct: 0, boostStat: 'agi', funFact: 'Snow sneakers for a predator — stealth stays on.' },
    { q: 'Siberian tigers are strong swimmers — useful for…', opts: ['Space travel', 'Crossing rivers in their range', 'Flying', 'Digging'], correct: 1, boostStat: 'int', funFact: 'Water is not a wall — just another path.' },
  ],
  trex: [
    { q: 'T. rex bite force is often compared to…', opts: ['A rubber duck', 'A car-crushing hydraulic press level', 'A butterfly', 'A whisper'], correct: 1, boostStat: 'str', funFact: 'Those jaws were bone-breakers — king of crunch.' },
    { q: 'Scientists still argue about T. rex arms because…', opts: ['They were perfect for typing', 'They were tiny but maybe useful for gripping', 'They did not exist', 'They were wings'], correct: 1, boostStat: 'int', funFact: 'Tiny arms, giant mystery — science loves a good debate.' },
    { q: 'T. rex binocular vision helped it…', opts: ['Read tiny fonts', 'Judge distance while aiming a bite', 'Sleep', 'Fly'], correct: 1, boostStat: 'int', funFact: 'Depth perception turns “somewhere there” into “gotcha.”' },
    { q: 'T. rex teeth were serrated like…', opts: ['Cotton candy', 'Steak knives for ripping dinosaur steak', 'Spoons', 'Feathers'], correct: 1, boostStat: 'str', funFact: 'Each tooth was a saw-edged tool — floss not included.' },
    { q: 'A T. rex could crush bone partly because…', opts: ['It ate only air', 'Huge jaw muscles and teeth focused force', 'It was hollow', 'It was tiny'], correct: 1, boostStat: 'str', funFact: 'Bone crunching unlocks hidden calories — waste not.' },
  ],
  raptor: [
    { q: 'Real Velociraptors were closer in size to…', opts: ['A bus like the movies', 'A big turkey', 'A blue whale', 'A skyscraper'], correct: 1, boostStat: 'agi', funFact: 'Hollywood supersized them — real raptors were still clever hunters.' },
    { q: 'Velociraptor relatives had feathers, which means…', opts: ['They were cold metal', 'They connect dinosaurs to modern birds', 'They could not move', 'They hated color'], correct: 1, boostStat: 'int', funFact: 'Birds are living dinosaurs — feathers are the family badge.' },
    { q: 'The famous sickle claw was likely used to…', opts: ['Pin and slash prey', 'Stir soup', 'Paint', 'Dig tunnels only'], correct: 0, boostStat: 'str', funFact: 'One hooked toe — raptor Swiss Army knife.' },
    { q: 'Velociraptor lived in deserts with…', opts: ['Only penguins', 'Dunes that could hide ambush hunts', 'Skyscrapers', 'Oceans only'], correct: 1, boostStat: 'agi', funFact: 'Sand-trap horror movie set — real ecosystem.' },
    { q: 'Pack-hunting is debated for raptor relatives — if true, it means…', opts: ['They never ate', 'Teamwork could overwhelm bigger prey', 'They were plants', 'They feared air'], correct: 1, boostStat: 'int', funFact: 'Brains + buddies = scary math.' },
  ],
  spino: [
    { q: 'Spinosaurus stands out because many think it…', opts: ['Only flew', 'Hunted fish and lived semi-aquatic', 'Ate only clouds', 'Was a plant'], correct: 1, boostStat: 'str', funFact: 'Sail-backed river monster vibes — weird and awesome.' },
    { q: 'Spinosaurus size hype is about…', opts: ['Being smaller than a cat', 'Being one of the longest meat-eaters ever found', 'Being imaginary', 'Being a balloon'], correct: 1, boostStat: 'str', funFact: 'Length records make it a legendary predator silhouette.' },
    { q: 'Spinosaurus nostrils set far back on the skull helped…', opts: ['Sniff while mostly submerged like a croc', 'Smell space', 'Whistle tunes', 'Hide from birds'], correct: 0, boostStat: 'int', funFact: 'Snorkel-face energy — river hunting hints.' },
    { q: 'Dense bones in Spinosaurus may have helped it…', opts: ['Float away', 'Sink and maneuver in water easier', 'Fly', 'Glow'], correct: 1, boostStat: 'agi', funFact: 'Heavy bones can be a swim trick — stability beats bobbing.' },
    { q: 'The giant sail might have helped with…', opts: ['Wi-Fi', 'Temperature control or showing off', 'Storing candy', 'Becoming invisible'], correct: 1, boostStat: 'int', funFact: 'Billboard + radiator + mate flex — multi-tool spine.' },
  ],
  ptero: [
    { q: 'Pterosaurs were not dinosaurs — they were…', opts: ['Flying reptile cousins', 'Early birds exactly', 'Fish only', 'Robots'], correct: 0, boostStat: 'int', funFact: 'Separate branch of awesome — first vertebrates with powered flight.' },
    { q: 'Giant pterosaurs launched into the air using…', opts: ['Only cliffs always', 'A powerful four-limb push-off leap', 'Helicopter blades', 'They never flew'], correct: 1, boostStat: 'spd', funFact: 'Quad-launch let huge flyers take off without a runway.' },
    { q: 'Pterosaur wing membrane stretched from…', opts: ['Only the legs', 'The body out to an extra-long finger', 'Their nose', 'Their tail only'], correct: 1, boostStat: 'agi', funFact: 'One super finger holds the kite — evolution’s hang glider.' },
    { q: 'Quetzalcoatlus-level giants could have wingspans like…', opts: ['A house cat', 'A small airplane — insanely wide', 'A coin', 'A shoe'], correct: 1, boostStat: 'str', funFact: 'Shadow on the ground meant “look up now.”' },
    { q: 'Pterosaurs had hollow bones partly to…', opts: ['Store water', 'Stay lighter for flight', 'Sink faster', 'Play music'], correct: 1, boostStat: 'int', funFact: 'Strength without extra weight — aerospace homework done.' },
  ],
  allo: [
    { q: 'Allosaurus lived mainly in…', opts: ['The Jurassic', 'Your pocket', 'The year 2020 only', 'Outer space'], correct: 0, boostStat: 'spd', funFact: 'Classic Jurassic predator — older story than T-Rex, still a horror movie star.' },
    { q: 'Allosaurus teeth were built to…', opts: ['Crunch rocks', 'Slice meat like steak knives', 'Paint pictures', 'Whistle tunes'], correct: 1, boostStat: 'str', funFact: 'Serrated blades made it a pro at taking bites out of big prey.' },
    { q: 'Allosaurus had strong arms for a big theropod — handy for…', opts: ['Typing', 'Gripping prey while biting', 'Flying', 'Photosynthesis'], correct: 1, boostStat: 'agi', funFact: 'Arms that actually help — grab-and-bite combo.' },
    { q: 'Fossil trackways hint some allosaurs might have…', opts: ['Never moved', 'Traveled or hunted with buddies sometimes', 'Lived in phones', 'Only swam'], correct: 1, boostStat: 'int', funFact: 'Pack rumors exist — team tactics make scarier movies.' },
    { q: 'Allosaurus prey could include…', opts: ['Only ants', 'Big plant-eaters like sauropods and stegosaurs', 'Cotton candy', 'Clouds'], correct: 1, boostStat: 'str', funFact: 'Jurassic menu featured giants — predators needed courage.' },
  ],
  giga: [
    { q: 'Giganotosaurus fossils are especially tied to…', opts: ['The Moon', 'Argentina', 'Only Europe', 'Under your bed'], correct: 1, boostStat: 'int', funFact: 'South America had its own mega-hunters — size contests with T-Rex still make scientists debate.' },
    { q: 'Giganotosaurus is remembered as…', opts: ['A tiny bug eater', 'One of the largest meat-eating dinosaurs', 'A flying squirrel', 'A house cat'], correct: 1, boostStat: 'str', funFact: 'When you are that big, everything on the menu notices you.' },
    { q: 'Giganotosaurus skull shape suggests bites aimed to…', opts: ['Nibble lettuce', 'Slice huge chunks from big prey', 'Whistle', 'Paint'], correct: 1, boostStat: 'str', funFact: 'Wide jaws = meat cleaver strategy for giant meals.' },
    { q: 'Living beside other mega-hunters meant…', opts: ['Boring times', 'Real monster-vs-monster ecosystems', 'Only fish', 'No plants'], correct: 1, boostStat: 'int', funFact: 'Cretaceous South America was a heavyweight tournament.' },
    { q: 'The name basically means…', opts: ['Tiny lizard', 'Giant southern lizard vibes', 'Flying fish', 'Soft bunny'], correct: 1, boostStat: 'int', funFact: 'Names can brag — this one does not whisper.' },
  ],
  stego: [
    { q: 'Stegosaurus is famous for…', opts: ['Being a fish', 'Plates on its back and spiked tail', 'Playing piano', 'Zero spikes'], correct: 1, boostStat: 'str', funFact: 'Tail spikes nicknamed the thagomizer — do not stand behind a grumpy Stegosaurus.' },
    { q: 'Stegosaurus mostly ate…', opts: ['Steel beams', 'Plants', 'Only candy', 'Clouds'], correct: 1, boostStat: 'int', funFact: 'Gentle diet, heavy armor — the tank build of the Jurassic.' },
    { q: 'Stegosaurus front legs were shorter, so its back sloped…', opts: ['Perfectly flat', 'Head low, tail high — weird but real', 'Upside down', 'Sideways only'], correct: 1, boostStat: 'agi', funFact: 'Goofy posture, serious weapons.' },
    { q: 'Those back plates may have helped with…', opts: ['Wi-Fi', 'Showing off and shedding extra heat', 'Flying', 'Storing marbles'], correct: 1, boostStat: 'int', funFact: 'Billboard + radiator — Jurassic fashion with function.' },
    { q: 'A thagomizer swing was a message that…', opts: ['Come closer', 'Stand behind me at your own risk', 'Let’s hug', 'I sell cookies'], correct: 1, boostStat: 'str', funFact: 'Tail club with spikes — unsubscribe from predator plans.' },
  ],
  trike: [
    { q: 'Triceratops is easy to spot because of…', opts: ['One horn', 'Three big horns + a huge frill', 'Wings', 'Gills'], correct: 1, boostStat: 'str', funFact: 'Face armor made it look tough — and it could back that look up.' },
    { q: 'Triceratops used its horns likely for…', opts: ['Only decoration', 'Defense and showing off to rivals', 'Typing essays', 'Swimming only'], correct: 1, boostStat: 'int', funFact: 'Horns and frill were multi-tool survival gear — nature loves accessories with purpose.' },
    { q: 'Triceratops teeth were best for…', opts: ['Pizza', 'Shearing tough plants', 'Metal cutting', 'Flying'], correct: 1, boostStat: 'int', funFact: 'Rows of scissor teeth — salad shredder at dinosaur scale.' },
    { q: 'A charging Triceratops told predators…', opts: ['Free hugs', 'My face is a weapon — rethink your plan', 'Follow me', 'I am slow always'], correct: 1, boostStat: 'str', funFact: 'Horns + speed + weight = “nope machine.”' },
    { q: 'The frill might impress rivals by…', opts: ['Playing music', 'Looking bigger and scarier face-to-face', 'Storing juice', 'Hiding wings'], correct: 1, boostStat: 'agi', funFact: 'Visual volume knob — turn intimidation to eleven.' },
  ],
};

function shuffleQuestionOpts(q) {
  const labels = [...q.opts];
  const correctLabel = labels[q.correct];
  const shuffled = shuffleArray(labels);
  return {
    ...q,
    opts: shuffled,
    correct: shuffled.indexOf(correctLabel),
  };
}

function preBattleQuestionSig(q) {
  return String(q.q || '')
    .slice(0, 120)
    .replace(/\s+/g, ' ');
}

/** Avoid the exact same question twice in a row per animal (sessionStorage). */
function pickPreBattleQuestionFromBank(animalId, bank) {
  const fallback = {
    q: `Which sounds like a real survival trick for a ${ANIMALS[animalId].name}?`,
    opts: ['Train enemies with jokes', 'Use senses + timing to catch food', 'Only sleep all day', 'Ignore danger'],
    correct: 1,
    boostStat: 'int',
    funFact: `${ANIMALS[animalId].name}s in the wild are tuned for sneak, speed, or power — never underestimate them.`,
  };
  if (!bank?.length) return { ...fallback };
  const key = `hw_pbq_${animalId}`;
  let lastSig = '';
  try {
    lastSig = sessionStorage.getItem(key) || '';
  } catch (_) {
    /* private mode */
  }
  const candidates = bank.filter(q => preBattleQuestionSig(q) !== lastSig);
  const pool = candidates.length ? candidates : bank;
  const pick = pool[Math.floor(Math.random() * pool.length)];
  try {
    sessionStorage.setItem(key, preBattleQuestionSig(pick));
  } catch (_) {
    /* ignore */
  }
  return { ...pick };
}

/** Unlock quiz: `questions` is the full bank; we draw UNLOCK_QUIZ_SESSION_LEN per attempt. */
function getUnlockQuizBank(animalId) {
  const quiz = QUIZZES[animalId];
  if (!quiz) return null;
  return quiz.questionPool || quiz.questions;
}

/**
 * Pick UNLOCK_QUIZ_SESSION_LEN distinct questions; avoid repeating the same index triple
 * as the last attempt when the pool is big enough.
 */
function pickUnlockSessionQuestions(animalId) {
  const pool = getUnlockQuizBank(animalId);
  if (!pool?.length) return [];
  const n = Math.min(UNLOCK_QUIZ_SESSION_LEN, pool.length);
  const key = `hw_uq_${animalId}`;
  let lastKey = '';
  try {
    lastKey = sessionStorage.getItem(key) || '';
  } catch (_) {
    /* ignore */
  }
  for (let attempt = 0; attempt < 14; attempt++) {
    const idxs = shuffleArray(pool.map((_, i) => i)).slice(0, n);
    idxs.sort((a, b) => a - b);
    const sig = idxs.join(',');
    if (pool.length <= n || sig !== lastKey || attempt > 10) {
      try {
        sessionStorage.setItem(key, sig);
      } catch (_) {
        /* ignore */
      }
      return idxs.map(i => shuffleQuestionOpts({ ...pool[i] }));
    }
  }
  return shuffleArray(pool.map((_, i) => i))
    .slice(0, n)
    .sort((a, b) => a - b)
    .map(i => shuffleQuestionOpts({ ...pool[i] }));
}

/** One fact question per team animal; +1 boostStat for this battle if correct. */
function buildPreBattleQuizForAnimals(animalIds) {
  return animalIds.map(animalId => {
    const bank = PRE_BATTLE_QUESTIONS[animalId];
    const pick = pickPreBattleQuestionFromBank(animalId, bank);
    const raw = {
      ...pick,
      animalId,
      emoji: ANIMALS[animalId].emoji,
      name: ANIMALS[animalId].name,
    };
    return shuffleQuestionOpts(raw);
  });
}

function scrollToBattlePreQuiz() {
  requestAnimationFrame(() => {
    document.getElementById('battle-prephase')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

/** Main clash / meters — primary focus during the fight */
function scrollToBattleFocus() {
  requestAnimationFrame(() => {
    document.getElementById('battle-zone-focus')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}

function scrollToBattleTrail() {
  requestAnimationFrame(() => {
    document.getElementById('battle-zone-trail')?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  });
}

function scrollToBattleStageArea() {
  scrollToBattleFocus();
}

function hybridWithTempBoost(player, boosts) {
  if (!player || !boosts) return player;
  const stats = { ...player.stats };
  for (const k of ['spd', 'agi', 'int', 'str']) stats[k] += boosts[k] || 0;
  return { ...player, stats, power: powerScore(stats) };
}

/** Player side shown in arena: base stats during pre-quiz; boosted after quiz. */
function getBattleDisplayPlayerHybrid() {
  const b = state.battle;
  const h = state.playerHybrid;
  if (!h) return null;
  if (!b || b.phase === 'pre_quiz') return h;
  return hybridWithTempBoost(h, getActiveBattleBoosts());
}

function roll(sides) { return Math.ceil(Math.random() * sides); }

function simulateRound(player, enemy) {
  const stat = STAT_WEIGHTS[Math.floor(Math.random() * STAT_WEIGHTS.length)];
  const pBase = player.stats[stat];
  const eBase = enemy.stats[stat];
  const pRoll = roll(6);
  const eRoll = roll(6) + (enemy.diceBonus || 0);
  const pTotal = pBase + pRoll;
  const eTotal = eBase + eRoll;
  return {
    stat, statLabel:STAT_LABELS[stat],
    pBase,pRoll,pTotal, eBase,eRoll,eTotal,
    winner: pTotal > eTotal ? 'player' : pTotal < eTotal ? 'enemy' : 'tie',
  };
}

function runFullBattle(player, enemy, quizBoosts) {
  const pFighter = quizBoosts && Object.values(quizBoosts).some(n => n > 0)
    ? hybridWithTempBoost(player, quizBoosts)
    : player;
  const rounds = [];
  for (let i = 0; i < 5; i++) rounds.push(simulateRound(pFighter, enemy));
  const pWins = rounds.filter(r => r.winner === 'player').length;
  const eWins = rounds.filter(r => r.winner === 'enemy').length;
  return { rounds, pWins, eWins, winner: pWins >= 3 ? 'player' : 'enemy' };
}

// ═══════════════════════════════════════════════════════════════════
// SCREEN MANAGEMENT
// ═══════════════════════════════════════════════════════════════════

function showScreen(name, sub) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(`screen-${name}`);
  if (el) el.classList.add('active');
  if (name === 'auth') setupAuth(sub || 'login');
  if (name === 'hub') renderHub();
  if (name === 'builder') renderBuilder();
  if (name === 'leaderboard') void renderLeaderboard();
  requestAnimationFrame(() => {
    window.scrollTo(0, 0);
    if (name === 'hub') {
      const hb = document.querySelector('#screen-hub .hub-scroll');
      if (hb) hb.scrollTop = 0;
    }
    if (name === 'leaderboard') {
      const lb = document.getElementById('leaderboard-body');
      if (lb) lb.scrollTop = 0;
    }
    if (name === 'builder') {
      const bl = document.querySelector('#screen-builder .builder-left');
      const br = document.querySelector('#screen-builder .builder-right');
      if (bl) bl.scrollTop = 0;
      if (br) br.scrollTop = 0;
    }
    if (name === 'quiz') {
      const qb = document.getElementById('quiz-body');
      if (qb) qb.scrollTop = 0;
    }
    if (name === 'battle') {
      const bb = document.querySelector('#screen-battle .battle-body');
      if (bb) bb.scrollTop = 0;
    }
    if (name === 'level-complete' || name === 'defeat' || name === 'game-complete' || name === 'landing' || name === 'auth') {
      const sec = document.getElementById(`screen-${name}`);
      if (sec && sec.scrollHeight > sec.clientHeight) sec.scrollTop = 0;
    }
  });
}

function showLeaderboard() {
  showScreen('leaderboard');
}

async function renderLeaderboard() {
  const body = document.getElementById('leaderboard-body');
  if (!body) return;
  body.innerHTML = '<p class="lb-loading">Loading rankings…</p>';
  try {
    const myUid = state.profile?.uid;
    const optedIn = isLeaderboardOptIn();
    let myPublic = null;
    if (myUid) {
      const mine = await getDoc(leaderboardDocRef(myUid));
      myPublic = mine.exists() ? mine.data() : null;
      console.log('[lb] render my leaderboard doc', {
        uid: myUid,
        exists: mine.exists(),
        leaderboardOptIn: myPublic?.leaderboardOptIn,
      });
    }

    const { rows, myRank, scanned } = await fetchLeaderboardWithRank();
    console.log('[lb] render query snapshot', { tableRows: rows.length, myRank, scanned });

    let rankBanner = '';
    if (!optedIn) {
      rankBanner =
        '<p class="lb-rank-banner lb-rank-muted">You are browsing as opted out — your row stays private. Opt in from your profile when that toggle ships to earn a rank here.</p>';
    } else if (myPublic && myPublic.leaderboardOptIn === false) {
      rankBanner =
        '<p class="lb-rank-banner lb-rank-muted">Your account is set to stay off the public board.</p>';
    } else if (myRank != null) {
      rankBanner = `<p class="lb-rank-banner lb-rank-you">You are ranked <strong>#${myRank}</strong> among the top ${scanned} commanders we loaded (then we show the top 25).</p>`;
    } else if (myPublic && myPublic.leaderboardOptIn !== false) {
      rankBanner = `<p class="lb-rank-banner lb-rank-muted">You are not in the <strong>top 25</strong> on screen — we load the top <strong>100</strong> by best level first, then sort. Your live stats are always shown in <strong>Your entry</strong> below.</p>`;
    } else {
      rankBanner = `<p class="lb-rank-banner lb-rank-muted">We could not load your public row yet. Open the Hub or finish a mission — your next save publishes your stats to the board.</p>`;
    }

    let yourCard = '';
    if (optedIn && myPublic && myPublic.leaderboardOptIn !== false) {
      const hn = (myPublic.hybridName && String(myPublic.hybridName).trim()) || '';
      const hybridLine = hn ? `<div class="lb-ye-hybrid">🐾 ${escapeHtml(hn)}</div>` : '';
      const tq = myPublic.totalQuizQuestions ?? 0;
      const tc = Math.min(myPublic.totalQuizCorrect ?? 0, tq);
      const accPct =
        tq > 0
          ? myPublic.quizAccuracy != null
            ? myPublic.quizAccuracy
            : Math.round((100 * tc) / tq)
          : null;
      const brain = accPct != null ? `${accPct}%` : '—';
      yourCard = `<div class="lb-your-entry">
        <div class="lb-ye-title">Your entry <span class="lb-ye-tag">synced</span></div>
        <div class="lb-ye-grid">
          <div><em>Commander</em><strong>${escapeHtml(myPublic.username || 'Commander')}</strong>${hybridLine}</div>
          <div><em>Best level</em><strong>${myPublic.highestLevelReached ?? 0}</strong></div>
          <div><em>Power</em><strong>${myPublic.hybridPowerScore ?? 0}</strong></div>
          <div><em>Wins</em><strong>${myPublic.totalWins ?? 0}</strong></div>
          <div><em>Brain</em><strong>${brain}</strong></div>
        </div>
      </div>`;
    }

    const tableRows = rows
      .map((r, i) => {
        const rank = i + 1;
        const isMe = r.uid === myUid;
        const hn = (r.hybridName && String(r.hybridName).trim()) || '';
        const hybridSub = hn
          ? `<div class="lb-hybrid-sub">🐾 ${escapeHtml(hn)}</div>`
          : '';
        const tq = r.totalQuizQuestions ?? 0;
        const tc = Math.min(r.totalQuizCorrect ?? 0, tq);
        const accPct =
          tq > 0
            ? r.quizAccuracy != null
              ? r.quizAccuracy
              : Math.round((100 * tc) / tq)
            : null;
        const brain = accPct != null ? `${accPct}%` : '—';
        return `<tr class="${isMe ? 'lb-row-me' : ''}">
          <td class="lb-rank">${rank}</td>
          <td class="lb-name">${escapeHtml(r.username || 'Commander')}${hybridSub}</td>
          <td class="lb-num">${r.highestLevelReached ?? 0}</td>
          <td class="lb-num">${r.hybridPowerScore ?? 0}</td>
          <td class="lb-num">${r.totalWins ?? 0}</td>
          <td class="lb-brain" title="Fun fact power — from unlock & battle boost quizzes">${brain}</td>
        </tr>`;
      })
      .join('');

    const tableBlock =
      rows.length > 0
        ? `<div class="lb-table-wrap">
        <table class="lb-table">
          <thead><tr>
            <th>#</th><th>Commander</th><th>Best Lv</th><th>Power</th><th>Wins</th><th>Brain</th>
          </tr></thead>
          <tbody>${tableRows}</tbody>
        </table>
      </div>`
        : '<p class="lb-empty">No other commanders matched the live query yet — new players start at level 0 and climb into the top 100 as they play.</p>';

    body.innerHTML = `
      ${rankBanner}
      ${yourCard}
      <p class="lb-note">Top 25 · Sorted by best level, then power, then wins. <strong>Brain</strong> = your quiz hit rate (the more you play, the cooler it gets).</p>
      ${tableBlock}`;
    console.log('[lb] render complete');
  } catch (e) {
    console.error('[lb] render failed', e);
    body.innerHTML =
      '<p class="lb-err">Could not load the leaderboard. Check your connection or Firestore index (leaderboardOptIn + highestLevelReached).</p>';
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ═══════════════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════════════

let authMode = 'login';

function switchTab(mode) {
  authMode = mode;
  document.getElementById('tab-login').classList.toggle('active', mode === 'login');
  document.getElementById('tab-signup').classList.toggle('active', mode === 'signup');
  document.getElementById('fg-confirm').style.display = mode === 'signup' ? 'block' : 'none';
  document.getElementById('fg-username').style.display = mode === 'signup' ? 'block' : 'none';
  document.getElementById('auth-btn').textContent = mode === 'login' ? 'Sign In' : 'Create Account';
  clearAuthErr();
}
function setupAuth(mode) {
  authMode = mode;
  switchTab(mode);
  document.getElementById('auth-email').value = '';
  document.getElementById('auth-username').value = '';
  document.getElementById('auth-password').value = '';
  document.getElementById('auth-confirm').value = '';
}
function showAuthErr(msg) {
  const el = document.getElementById('auth-err');
  el.textContent = msg;
  el.classList.add('show');
}
function clearAuthErr() { document.getElementById('auth-err').classList.remove('show'); }

function firebaseAuthErrorMessage(err) {
  const code = err?.code || '';
  if (code === 'auth/email-already-in-use') return 'That email is already registered. Try signing in.';
  if (code === 'auth/invalid-email') return 'Enter a valid email address.';
  if (code === 'auth/weak-password') return 'Password should be at least 6 characters.';
  if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
    return 'Invalid email or password.';
  }
  if (code === 'auth/too-many-requests') return 'Too many attempts. Try again later.';
  return err?.message || 'Something went wrong. Please try again.';
}

async function handleAuth() {
  const email = document.getElementById('auth-email').value.trim();
  const username = document.getElementById('auth-username').value.trim();
  const password = document.getElementById('auth-password').value;
  const confirm = document.getElementById('auth-confirm').value;
  clearAuthErr();
  if (!email) { showAuthErr('Email is required.'); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { showAuthErr('Enter a valid email address.'); return; }
  if (!password || password.length < 6) { showAuthErr('Password must be at least 6 characters.'); return; }
  if (authMode === 'signup') {
    if (!username || username.length < 2) { showAuthErr('Callsign must be at least 2 characters.'); return; }
    if (password !== confirm) { showAuthErr('Passwords do not match.'); return; }
  }
  try {
    if (authMode === 'signup') {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      console.log('[auth] signup profile write start', cred.user.uid);
      await setDoc(
        userDocRef(cred.user.uid),
        {
          uid: cred.user.uid,
          username,
          email,
          currentLevel: 1,
          highestLevelReached: 0,
          unlockedAnimals: [...STARTER_BASE_IDS],
          unlockedApex: [],
          unlockedDinosaurs: [],
          selectedHybridAnimals: [],
          hybridStats: null,
          totalWins: 0,
          totalLosses: 0,
          streakCount: 0,
          lastPlayedDate: null,
          leaderboardOptIn: true,
          progressSchemaVersion: 1,
          stageAccess: { base: true, apex: true, dinosaur: true },
          coins: 0,
          unlockTokens: 0,
          dailyChallengeDayKey: null,
          dailyWinsToday: 0,
          dailyChallengeRewardClaimed: false,
          totalQuizQuestions: 0,
          totalQuizCorrect: 0,
          commanderXp: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      console.log('[auth] signup profile write OK', cred.user.uid);
      await writeLeaderboardBootstrapDoc(cred.user.uid, username);
    } else {
      await signInWithEmailAndPassword(auth, email, password);
    }
  } catch (e) {
    showAuthErr(firebaseAuthErrorMessage(e));
  }
}

async function logout() {
  clearDefeatAutoReturn();
  clearLevelCompleteAutoNav();
  try {
    await signOut(auth);
  } catch (e) {
    console.error(e);
  }
  state.profile = null;
  state.progress = null;
  state.playerHybrid = null;
  state.selectedAnimals = [];
  showScreen('landing');
}

// ═══════════════════════════════════════════════════════════════════
// HUB
// ═══════════════════════════════════════════════════════════════════

function renderHubProgressionPanel() {
  const el = document.getElementById('hub-progress-panel');
  if (!el || !state.progress) return;
  const p = state.progress;
  const bU = countBaseUnlocked(p);
  const aU = countApexUnlocked(p);
  const dU = countDinoUnlocked(p);
  const stage = getPlayerStageLabel(p);
  const apexOpen = apexLevelGateMet(p);
  const dinoOpen = dinoLevelGateMet(p);
  const apexLine = apexOpen ? `${aU} / ${APEX_IDS.length} unlocked` : 'Locked — beat Level 5 first';
  const dinoLine = dinoOpen ? `${dU} / ${DINO_IDS.length} unlocked` : 'Locked — beat Level 8 first';
  const nextLines = getProgressionNextLines(p);
  el.innerHTML = `
    <div class="hub-progress-hdr">Progression</div>
    <div class="hub-progress-meta">
      <span><em>Level</em> <strong>${p.level > 10 ? '✓' : p.level}</strong></span>
      <span><em>Stage</em> <strong>${stage}</strong></span>
    </div>
    <ul class="hub-progress-stages">
      <li><span class="hps-emoji">◇</span> <span class="hps-name">Base Animals</span> <span class="hps-count">${bU} / ${BASE_IDS.length}</span></li>
      <li><span class="hps-emoji">◈</span> <span class="hps-name">Apex Predators</span> <span class="hps-count">${apexLine}</span></li>
      <li><span class="hps-emoji">🦖</span> <span class="hps-name">Dinosaurs</span> <span class="hps-count">${dinoLine}</span></li>
    </ul>
    <div class="hub-progress-gates">
      <div class="hpg-row"><span class="${apexOpen ? 'hpg-ok' : 'hpg-no'}">${apexOpen ? '✓' : '○'}</span> Apex level gate (Level 6+)</div>
      <div class="hpg-row"><span class="${dinoOpen ? 'hpg-ok' : 'hpg-no'}">${dinoOpen ? '✓' : '○'}</span> Dino level gate (Level 9+)</div>
    </div>
    <div class="hub-progress-next">${nextLines.join('<br>')}</div>
    ${
      sumBoostPoints(getStreakBattleBoost(p)) > 0
        ? `<div class="hub-streak-bonus">🔥 Streak power: +${sumBoostPoints(getStreakBattleBoost(p))} bonus stats in your next battle.</div>`
        : ''
    }
    <div class="hub-soft-gates">${[...getRetentionShopTeasers(), ...getSoftMonetisationHintLines(p)].map(s => `<div class="soft-gate-line">${s}</div>`).join('')}</div>`;
}

function renderHubDailyChallenge() {
  const el = document.getElementById('hub-daily-challenge');
  if (!el || !state.progress) return;
  const p = state.progress;
  ensureDailyChallengeRolled(p);
  const ch = pickDailyChallenge(localDateString());
  const done = p.dailyChallengeRewardClaimed;
  const wins = p.dailyWinsToday || 0;
  let sub = done ? '✓ Reward claimed today — new challenge tomorrow!' : `${wins} mission win${wins === 1 ? '' : 's'} today`;
  if (!done && ch.id === 'double' && wins < 2) sub += ' · need 2 wins today';
  el.innerHTML = `
    <div class="hub-dc-hdr">🎯 Daily Challenge</div>
    <div class="hub-dc-title">${ch.title}</div>
    <div class="hub-dc-desc">${ch.desc}</div>
    <div class="hub-dc-status">${sub}</div>`;
}

function renderHub() {
  const p = state.progress;
  if (touchDailyStreakIfNeeded(p)) void persistGameProgress();
  const levelIdx = Math.min(p.level - 1, LEVELS.length - 1);
  const level = LEVELS[levelIdx];

  document.getElementById('hub-username').textContent = state.profile?.username || '—';
  document.getElementById('hub-wins').textContent = p.totalWins;
  document.getElementById('hub-losses').textContent = p.totalLosses;
  const streakEl = document.getElementById('hub-streak');
  if (streakEl) {
    const n = p.streakCount || 0;
    streakEl.textContent = `🔥 ${n} day streak`;
  }
  const coinsEl = document.getElementById('hsb-coins');
  if (coinsEl) coinsEl.textContent = String(p.coins ?? 0);
  const tokEl = document.getElementById('hsb-tokens');
  if (tokEl) tokEl.textContent = String(p.unlockTokens ?? 0);

  // Status bar
  document.getElementById('hsb-level').textContent = p.level > 10 ? 'Complete!' : `${p.level} / 10`;

  // Tiers unlocked
  const apexCount = APEX_IDS.filter(id => p.quizUnlocked.includes(id)).length;
  const dinoCount = DINO_IDS.filter(id => p.quizUnlocked.includes(id)).length;
  const baseU = countBaseUnlocked(p);
  let tierTxt = `B ${baseU}/10`;
  if (apexLevelGateMet(p)) tierTxt += ` · A ${apexCount}/10`;
  if (dinoLevelGateMet(p)) tierTxt += ` · D ${dinoCount}/10`;
  document.getElementById('hsb-tiers').textContent = tierTxt;
  document.getElementById('hsb-tiers').className = 'hsb-val ' + (dinoCount > 0 ? 'dino' : apexCount > 0 ? 'purple' : '');

  // Current hybrid
  if (state.playerHybrid) {
    const h = state.playerHybrid;
    document.getElementById('hsb-hybrid').textContent = `${h.emojis} ${h.name}`;
    document.getElementById('hsb-power').textContent = `${h.power} ⚡`;
  } else {
    document.getElementById('hsb-hybrid').textContent = '—';
    document.getElementById('hsb-power').textContent = '—';
  }

  const xpUi = getCommanderXpSegment(p.commanderXp || 0);
  const xpFill = document.getElementById('hub-xp-bar-fill');
  const xpMeta = document.getElementById('hub-xp-meta');
  const xpSegLbl = document.getElementById('hub-xp-seg-lbl');
  const xpTrack = document.getElementById('hub-xp-bar-track');
  if (xpFill) xpFill.style.width = `${xpUi.pct}%`;
  if (xpSegLbl) xpSegLbl.textContent = `Spark ${xpUi.tier}`;
  if (xpTrack) xpTrack.setAttribute('aria-valuenow', String(Math.round(xpUi.pct)));
  if (xpMeta) {
    xpMeta.textContent = `Commander XP · ${xpUi.inSeg} / ${xpUi.seg} points in this spark (wins fill the bar)`;
  }

  const coinBtn = document.getElementById('hub-btn-coin-tune');
  const tokBtn = document.getElementById('hub-btn-token-recruit');
  const coinCan = (p.coins || 0) >= COIN_TUNING_COST && !!state.playerHybrid;
  const tokTgt = findNextTokenRecruitTarget(p);
  const tokCan = (p.unlockTokens || 0) >= TOKEN_RECRUIT_COST && !!tokTgt;
  if (coinBtn) coinBtn.disabled = !coinCan;
  if (tokBtn) tokBtn.disabled = !tokCan;

  // Level banner
  document.getElementById('hub-level-num').textContent = p.level > 10 ? '✓' : p.level;
  document.getElementById('hub-level-name').textContent = p.level > 10 ? 'Game Complete!' : `Level ${p.level} — ${level.name}`;
  document.getElementById('hub-level-desc').textContent = p.level > 10 ? 'You conquered all levels.' : level.desc;

  // Badges
  const ba = document.getElementById('hub-badge-area');
  ba.innerHTML = '';
  if (level && level.isFinal) ba.innerHTML += '<span class="lv-badge badge-final">⚠ FINAL BOSS</span>';
  else if (level && level.isHard) ba.innerHTML += '<span class="lv-badge badge-hard">DANGER ZONE</span>';
  if (dinoCount > 0) ba.innerHTML += '<span class="lv-badge badge-dino">🦖 DINO ACTIVE</span>';
  else if (apexCount > 0) ba.innerHTML += '<span class="lv-badge badge-apex">◈ APEX UNLOCKED</span>';

  // Progress pips
  const pips = document.getElementById('lv-progress-pips');
  pips.innerHTML = '';
  for (let i = 1; i <= 10; i++) {
    const pip = document.createElement('div');
    pip.className = 'lv-pip' + (i < p.level ? ' done' : i === p.level ? ' current' : '');
    pips.appendChild(pip);
  }

  // Enemy preview
  if (level) {
    const comps = level.animals.map(id => ALL_ANIMALS[id]).filter(Boolean);
    document.getElementById('hub-enemy-preview').innerHTML =
      `Enemy: <span>${comps.map(a => a.emoji + ' ' + a.name).join(' + ')}</span>`;
  }

  // Hybrid display card
  const hd = document.getElementById('hub-hybrid-display');
  if (state.playerHybrid) {
    const h = state.playerHybrid;
    hd.innerHTML = `
      <div style="font-size:1.9rem;margin-bottom:4px">${h.emojis}</div>
      <div style="font-family:var(--fd);font-size:1rem;font-weight:700;color:var(--text-bright);margin-bottom:2px">${h.name}</div>
      <div style="font-size:.6rem;font-family:var(--fm);color:var(--text-dim);margin-bottom:8px">${h.composition}</div>
      <div class="hub-power-row" style="justify-content:center;gap:16px">
        <div style="text-align:center">
          <div class="hub-power-score">${h.power}</div>
          <div class="hub-power-lbl">Power Score</div>
        </div>
      </div>`;
  } else {
    hd.innerHTML = `<div style="padding:8px 0;color:var(--text-dim);font-size:.72rem">No hybrid forged yet.<br>Go to the Forge to build one.</div>`;
  }

  const rosterHint = document.getElementById('hub-roster-hint');
  if (rosterHint) {
    rosterHint.innerHTML =
      '<strong>Base</strong> — win levels to recruit the full roster (3 starters, then 7 more).<br>' +
      '<strong>Apex</strong> — beat Level 5, then pass each Apex quiz in the Forge.<br>' +
      '<strong>Dinos</strong> — beat Level 8, then pass each Dino quiz. Locked rows show ✓/○ for what’s done.';
  }

  const hintEl = document.getElementById('hub-primary-hint');
  if (hintEl) {
    const lines = getProgressionNextLines(p);
    let t = '';
    if (lines.length) {
      const tmp = document.createElement('div');
      tmp.innerHTML = lines[0];
      t = (tmp.textContent || tmp.innerText || '').replace(/\s+/g, ' ').trim();
    }
    hintEl.textContent =
      t ||
      (p.level > 10
        ? 'Campaign clear — climb the leaderboard or experiment in the Forge.'
        : 'Forge a hybrid below, then fight this level.');
  }

  renderHubProgressionPanel();
  renderHubDailyChallenge();
  renderHubAnimalGrid();
}

function renderHubAnimalGrid() {
  const p = state.progress;
  const available = getAvailableAnimals(p);
  const grid = document.getElementById('hub-animal-grid');
  grid.innerHTML = '';

  for (const id of Object.keys(ANIMALS)) {
    const a = ANIMALS[id];
    const isAvail = available.includes(id);
    const isQL = isQuizEligible(id, p);
    const isLL = isLevelLocked(id, p);

    const chip = document.createElement('div');
    const tierCls = a.stage === STAGE_DINO ? 'dino-chip' : a.stage === STAGE_APEX ? 'apex-chip' : '';
    let cls = 'a-chip ' + tierCls;
    if (isAvail) cls += ' available';
    else if (isQL) cls += ' quiz-locked';
    else if (isLL) cls += ' locked';
    chip.className = cls;

    const tierLbl = a.stage === STAGE_DINO ? 'DINO' : a.stage === STAGE_APEX ? 'APEX' : 'BASE';
    const tierClass = a.stage === STAGE_DINO ? 't4' : a.stage === STAGE_APEX ? 't3' : '';
    const premiumPreview =
      !isAvail && !isQL && (a.stage === STAGE_APEX || a.stage === STAGE_DINO)
        ? `<div class="a-chip-stats-preview" aria-hidden="true">${formatMiniStatPreview(a)}</div>`
        : '';
    if (premiumPreview) chip.classList.add('premium-preview');
    chip.innerHTML = `<span class="a-chip-em">${a.emoji}</span>
      <span class="a-chip-nm">${a.name}</span>
      <span class="a-chip-tier ${tierClass}">${isLL ? '🔒' : isQL ? '📝' : tierLbl}</span>${premiumPreview}`;

    const gates = unlockGateLinesForAnimal(id, p);
    if (gates && !isAvail) {
      const gateHtml = gates
        .map(
          g =>
            `<div class="unlock-gate-row"><span class="${g.ok ? 'unlock-gate-ok' : 'unlock-gate-no'}">${g.ok ? '✓' : '○'}</span> ${g.text}</div>`
        )
        .join('');
      chip.innerHTML += `<div class="unlock-gate-list">${gateHtml}</div>`;
    }

    if (isQL) {
      chip.title = `Unlock ${a.name}: level done ✓ — tap to try the quiz.`;
      chip.onclick = () => {
        state.quizReturnScreen = 'hub';
        openQuiz(id);
      };
    } else if (isLL && gates) {
      chip.title = gates.map(g => `${g.ok ? 'Done' : 'Todo'}: ${g.text}`).join('\n');
    }

    grid.appendChild(chip);
  }
}

// ═══════════════════════════════════════════════════════════════════
// BUILDER
// ═══════════════════════════════════════════════════════════════════

function showBuilder() {
  clearDefeatAutoReturn();
  state.selectedAnimals = state.playerHybrid ? [...state.playerHybrid.animals] : [];
  showScreen('builder');
}
function showHub() {
  clearLevelCompleteAutoNav();
  clearDefeatAutoReturn();
  console.log('[flow] hub shown');
  showScreen('hub');
}

function renderBuilder() {
  const p = state.progress;
  const available = getAvailableAnimals(p);
  const container = document.getElementById('builder-tiers');
  container.innerHTML = '';

  // ── SECTION 1: BASE ROSTER (tier 1 + 2) ──
  const baseIds = available.filter(id => ANIMALS[id].stage === STAGE_BASE);
  if (baseIds.length) {
    const sec = document.createElement('div');
    sec.className = 'tier-section';
    sec.innerHTML = `<div class="tier-hdr"><span class="tier-hdr-nm base">◇ Base Animals</span><div class="tier-hdr-line" style="background:var(--border)"></div></div>`;
    const grid = document.createElement('div');
    grid.className = 'b-animal-grid';
    baseIds.forEach(id => grid.appendChild(makeAnimalCard(id)));
    sec.appendChild(grid);
    container.appendChild(sec);
  }

  // ── SECTION 2: APEX PREDATORS (tier 3) ──
  {
    const sec = document.createElement('div');
    sec.className = 'tier-section';
    sec.innerHTML = `<div class="tier-hdr"><span class="tier-hdr-nm apex">◈ Apex Predators</span><div class="tier-hdr-line" style="background:rgba(176,106,255,.3)"></div></div>`;

    if (p.level < 6) {
      sec.innerHTML += `<div class="tier-locked-notice"><strong>Apex Predators</strong><br>
        <span class="unlock-gate-row"><span class="unlock-gate-no">○</span> Beat Level 5 (you are on level ${p.level})</span><br>
        <span class="unlock-gate-row"><span class="unlock-gate-no">○</span> Pass each Apex quiz in the Forge</span></div>`;
    } else {
      const grid = document.createElement('div');
      grid.className = 'b-animal-grid';
      APEX_IDS.forEach(id => {
        if (available.includes(id)) {
          grid.appendChild(makeAnimalCard(id));
        } else {
          grid.appendChild(makeQuizLockCard(id, 'apex'));
        }
      });
      sec.appendChild(grid);
    }
    container.appendChild(sec);
  }

  // ── SECTION 3: DINOSAUR TIER (tier 4) ──
  {
    const sec = document.createElement('div');
    sec.className = 'tier-section';
    sec.innerHTML = `<div class="tier-hdr"><span class="tier-hdr-nm dino">🦖 Dinosaur Tier</span><div class="tier-hdr-line" style="background:rgba(255,68,0,.3)"></div></div>`;

    if (p.level < 9) {
      const rem = 9 - p.level;
      sec.innerHTML += `<div class="tier-locked-notice"><strong>Dinosaurs</strong><br>
        <span class="unlock-gate-row"><span class="unlock-gate-no">○</span> Beat Level 8 (${rem} level${rem > 1 ? 's' : ''} to go)</span><br>
        <span class="unlock-gate-row"><span class="unlock-gate-no">○</span> Pass each Dino quiz in the Forge</span></div>`;
    } else {
      const grid = document.createElement('div');
      grid.className = 'b-animal-grid';
      DINO_IDS.forEach(id => {
        if (available.includes(id)) {
          grid.appendChild(makeAnimalCard(id));
        } else {
          grid.appendChild(makeQuizLockCard(id, 'dino'));
        }
      });
      sec.appendChild(grid);
    }
    container.appendChild(sec);
  }

  updateSelectionUI();
  renderEnemyPreviewInBuilder();
  if (state.playerHybrid) renderHybridPreview(state.playerHybrid);
  else clearHybridPreview();
  updateForgeNextHint();
}

function makeAnimalCard(id) {
  const a = ANIMALS[id];
  const card = document.createElement('div');
  const isTier3 = a.stage === STAGE_APEX;
  const isTier4 = a.stage === STAGE_DINO;
  const isSelected = state.selectedAnimals.includes(id);
  card.id = `bac-${id}`;
  card.className = `bac${isTier4?' dino-card':isTier3?' apex-card':''}${isSelected?' sel':''}`;
  card.onclick = () => toggleAnimalSelect(id);
  const tierLbl = isTier4 ? '◈◈ DINOSAUR' : isTier3 ? '◈ APEX' : 'BASE';
  const tierCls = isTier4 ? 't4' : isTier3 ? 't3' : '';
  card.innerHTML = `<div class="bac-em">${a.emoji}</div>
    <div class="bac-nm">${a.name}</div>
    <div class="bac-tier-tag ${tierCls}">${tierLbl}</div>
    <div class="bac-stats-mini">
      <div class="bac-s">SPD <em>${a.spd}</em></div>
      <div class="bac-s">AGI <em>${a.agi}</em></div>
      <div class="bac-s">INT <em>${a.int}</em></div>
      <div class="bac-s">STR <em>${a.str}</em></div>
    </div>`;
  return card;
}

function makeQuizLockCard(id, tierType) {
  const a = ANIMALS[id];
  const card = document.createElement('div');
  card.className = `bac-quizlock ${tierType}-quizlock premium-lock-preview`;
  const p = state.progress;
  const eligible = isQuizEligible(id, p);
  const gates = unlockGateLinesForAnimal(id, p) || [];
  const gateHtml = gates
    .map(
      g =>
        `<div class="unlock-gate-row" style="font-size:.52rem"><span class="${g.ok ? 'unlock-gate-ok' : 'unlock-gate-no'}">${g.ok ? '✓' : '○'}</span> ${g.text}</div>`
    )
    .join('');
  card.innerHTML = `<div class="bql-em">${a.emoji}</div>
    <div class="bql-nm">${a.name}</div>
    <div class="bql-lbl ${tierType}">🔒 ${eligible ? 'Quiz next' : 'Level first'}</div>
    <div class="bql-stats-preview bac-stats-mini" aria-hidden="true">
      <div class="bac-s">SPD <em>${a.spd}</em></div>
      <div class="bac-s">AGI <em>${a.agi}</em></div>
      <div class="bac-s">INT <em>${a.int}</em></div>
      <div class="bac-s">STR <em>${a.str}</em></div>
    </div>
    ${gateHtml ? `<div class="unlock-gate-list" style="margin-top:4px">${gateHtml}</div>` : ''}`;
  if (eligible) {
    const btn = document.createElement('button');
    btn.className = `btn btn-sm ${tierType === 'dino' ? 'btn-dino' : 'btn-purple'}`;
    btn.textContent = '📝 Take Quiz';
    btn.style.width = '100%';
    btn.style.marginTop = '5px';
    btn.onclick = () => {
      state.quizReturnScreen = 'builder';
      openQuiz(id);
    };
    card.appendChild(btn);
  }
  return card;
}

function scrollForgeColumnToFusionPanel() {
  const forgeCol = document.getElementById('builder-forge-column');
  const panel = document.getElementById('forge-panel');
  if (!forgeCol || !panel) {
    console.warn('[forge] scroll target missing', { forgeCol: !!forgeCol, panel: !!panel });
    return;
  }
  const pad = 16;
  const relTop = panel.getBoundingClientRect().top - forgeCol.getBoundingClientRect().top + forgeCol.scrollTop;
  const target = Math.max(0, relTop - pad);
  console.log('[forge] fusion section ready — column scroll', { target, colScrollH: forgeCol.scrollHeight });
  forgeCol.scrollTo({ top: target, behavior: 'smooth' });
}

function scrollToForgeAndHighlight() {
  const forgeCol = document.getElementById('builder-forge-column');
  const panel = document.getElementById('forge-panel');
  const msg = document.getElementById('forge-ready-msg');
  console.log('[forge] 3 animals selected — scheduling fusion scroll');

  const runScroll = () => {
    scrollForgeColumnToFusionPanel();
    console.log('[forge] forge scroll triggered');
  };
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      setTimeout(runScroll, 50);
      setTimeout(runScroll, 220);
    });
  });

  if (forgeCol) {
    forgeCol.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }
  if (panel) {
    panel.classList.remove('forge-highlight');
    void panel.offsetWidth;
    panel.classList.add('forge-highlight');
    setTimeout(() => panel.classList.remove('forge-highlight'), 2600);
  }
  if (msg) {
    msg.textContent = 'Team ready — forge your hybrid';
    setTimeout(() => {
      if (msg.textContent === 'Team ready — forge your hybrid') msg.textContent = '';
    }, 4500);
  }
}

function toggleAnimalSelect(id) {
  const idx = state.selectedAnimals.indexOf(id);
  if (idx >= 0) {
    state.selectedAnimals.splice(idx, 1);
  } else {
    if (state.selectedAnimals.length >= 3) return;
    state.selectedAnimals.push(id);
  }
  const card = document.getElementById(`bac-${id}`);
  if (card) card.classList.toggle('sel', state.selectedAnimals.includes(id));
  state.playerHybrid = null;
  updateSelectionUI();
  clearHybridPreview();
  void persistGameProgress();
  if (state.selectedAnimals.length === 3) scrollToForgeAndHighlight();
}

function updateForgeNextHint() {
  const el = document.getElementById('forge-next-hint');
  if (!el) return;
  const n = state.selectedAnimals.length;
  const forged = !!state.playerHybrid;
  if (!forged) {
    if (n === 0) el.textContent = 'Next: choose 1–3 animals from the grid.';
    else if (n < 3) el.textContent = `Next: add up to ${3 - n} more, or tap Fuse with your current picks.`;
    else el.textContent = 'Next: tap Fuse to roll your hybrid’s stats.';
  } else {
    el.textContent = 'Next: Enter Battle — boost quiz, then the fight!';
  }
}

function updateSelectionUI() {
  const n = state.selectedAnimals.length;
  ['sp1','sp2','sp3'].forEach((id, i) => document.getElementById(id).classList.toggle('on', i < n));
  document.getElementById('sel-count-txt').textContent = `${n} / 3 selected`;
  document.getElementById('btn-forge').disabled = n === 0;
  document.getElementById('btn-reroll').disabled = n === 0 || !state.playerHybrid;
  document.getElementById('btn-fight').disabled = !state.playerHybrid;
  updateForgeNextHint();
}

function forgeHybrid() {
  if (!state.selectedAnimals.length) return;
  state.playerHybrid = buildPlayerHybrid(state.selectedAnimals);
  renderHybridPreview(state.playerHybrid);
  syncHybridNameInput();
  document.getElementById('btn-reroll').disabled = false;
  document.getElementById('btn-fight').disabled = false;
  updateForgeNextHint();
  void persistGameProgress();
}

function syncHybridNameInput() {
  const panel = document.getElementById('hybrid-name-panel');
  const inp = document.getElementById('hybrid-name-input');
  if (!panel || !inp) return;
  if (state.playerHybrid) {
    panel.classList.remove('hidden');
    inp.value = state.playerHybrid.name;
  } else {
    panel.classList.add('hidden');
    inp.value = '';
  }
}

function applyHybridDisplayName() {
  if (!state.playerHybrid) return;
  const inp = document.getElementById('hybrid-name-input');
  const raw = inp ? inp.value : '';
  const auto = hybridName(state.playerHybrid.animals);
  state.playerHybrid.name = sanitizeHybridName(raw, auto);
  if (inp) inp.value = state.playerHybrid.name;
  renderHybridPreview(state.playerHybrid);
  void persistGameProgress();
}

function renderHybridPreview(h) {
  document.getElementById('h-emojis').textContent = h.emojis;
  const nameCls = h.tierClass === 'dino' ? 'h-name dino-glow' : h.tierClass === 'apex' ? 'h-name apex-glow' : 'h-name glow';
  document.getElementById('h-name').className = nameCls;
  document.getElementById('h-name').textContent = h.name;
  document.getElementById('h-sub').textContent = h.composition.toUpperCase();
  const hcardCls = h.tierClass === 'dino' ? 'hcard dino-ready' : h.tierClass === 'apex' ? 'hcard apex-ready' : 'hcard ready';
  document.getElementById('hcard').className = hcardCls;
  // Power score
  document.getElementById('h-power').classList.remove('hidden');
  document.getElementById('h-power-num').textContent = h.power;
  // Stats
  for (const stat of ['spd','agi','int','str']) {
    document.getElementById(`hs-${stat}`).style.width = `${Math.min((h.stats[stat]/STAT_MAX)*100,100)}%`;
    document.getElementById(`hv-${stat}`).textContent = h.stats[stat];
  }
  syncHybridNameInput();
}

function clearHybridPreview() {
  document.getElementById('h-emojis').textContent = '—';
  document.getElementById('h-name').className = 'h-name';
  document.getElementById('h-name').textContent = 'No Animals Selected';
  document.getElementById('h-sub').textContent = 'SELECT 1–3 ANIMALS TO FUSE';
  document.getElementById('hcard').className = 'hcard';
  document.getElementById('h-power').classList.add('hidden');
  for (const stat of ['spd','agi','int','str']) {
    document.getElementById(`hs-${stat}`).style.width = '0%';
    document.getElementById(`hv-${stat}`).textContent = '—';
  }
  syncHybridNameInput();
}

function renderEnemyPreviewInBuilder() {
  const p = state.progress;
  const level = LEVELS[Math.min(p.level - 1, LEVELS.length - 1)];
  const comps = level.animals.map(id => ALL_ANIMALS[id]).filter(Boolean);
  const enemyHybrid = buildEnemyHybrid(level);
  const el = document.getElementById('builder-enemy-preview');
  el.innerHTML = `<div style="font-size:1.5rem;margin-bottom:5px">${comps.map(a=>a.emoji).join('')}</div>
    <div style="font-family:var(--fd);font-size:.85rem;font-weight:700;color:var(--red);margin-bottom:2px">${level.name.toUpperCase()}</div>
    <div style="font-family:var(--fm);font-size:.6rem;color:var(--text-dim);margin-bottom:5px">${comps.map(a=>a.name).join(' + ')}</div>
    <div style="font-family:var(--fm);font-size:.65rem;color:var(--orange)">Enemy Power: ${enemyHybrid.power}</div>
    ${level.isHard?'<div style="margin-top:4px;font-family:var(--fm);font-size:.58rem;color:var(--red)">⚠ HARD — Use apex animals!</div>':''}`;
}

// ═══════════════════════════════════════════════════════════════════
// QUIZ SYSTEM
// ═══════════════════════════════════════════════════════════════════

function openQuiz(animalId) {
  const a = ANIMALS[animalId];
  const quiz = QUIZZES[animalId];
  if (!quiz) {
    alert(`Quiz not found for ${a.name}. Please try again later.`);
    return;
  }

  quizState = {
    animalId,
    currentQ: 0,
    correctCount: 0,
    answered: false,
    sessionQuestions: null,
  };
  const tierType = quizUiTierType(animalId);

  // Topbar badge
  document.getElementById('quiz-tier-badge').innerHTML =
    `<div class="tier-badge-topbar ${tierType}">${tierType === 'dino' ? '🦖 DINOSAUR TIER' : '◈ APEX PREDATOR'}</div>`;

  // Render intro (questions drawn when player taps Begin)
  renderQuizIntro(animalId, tierType, quiz.intro);
  showScreen('quiz');
}

function renderQuizIntro(animalId, tierType, introText) {
  const a = ANIMALS[animalId];
  const quiz = QUIZZES[animalId];
  const body = document.getElementById('quiz-body');

  body.innerHTML = `
    <div class="quiz-animal-hdr">
      <span class="quiz-animal-em">${a.emoji}</span>
      <div class="quiz-animal-nm ${tierType}">${a.name}</div>
      <div class="quiz-animal-sub ${tierType}">${tierType === 'dino' ? '◈◈ DINOSAUR TIER' : '◈ APEX PREDATOR'}</div>
      <div class="quiz-animal-bio">${introText}</div>
    </div>
    <div style="background:var(--surface);border:1px solid var(--border);padding:18px;text-align:center;width:100%">
      <div style="font-family:var(--fm);font-size:.68rem;color:var(--text-dim);letter-spacing:.15em;text-transform:uppercase;margin-bottom:10px">Challenge Rules</div>
      <p style="font-size:.9rem;color:var(--text);margin-bottom:8px">Answer all <strong style="color:${tierType==='dino'?'var(--dino)':'var(--purple)'}">${UNLOCK_QUIZ_SESSION_LEN} questions</strong> correctly to unlock ${a.name}. Each run picks a fresh mix from a bigger fact deck.</p>
      <p style="font-size:.82rem;color:var(--text-dim);margin-bottom:16px">Miss any question and you can try again — the deck shuffles each time.</p>
      <div style="display:flex;gap:10px;justify-content:center">
        <button class="btn ${tierType === 'dino' ? 'btn-dino' : 'btn-purple'}" onclick="startQuizQuestions()">Begin Challenge →</button>
        <button class="btn btn-ghost btn-sm" onclick="exitQuiz()">Back</button>
      </div>
    </div>`;
}

function startQuizQuestions() {
  const id = quizState.animalId;
  quizState.sessionQuestions = pickUnlockSessionQuestions(id);
  if (!quizState.sessionQuestions.length) {
    alert('Could not load quiz questions. Please go back and try again.');
    return;
  }
  quizState.currentQ = 0;
  quizState.correctCount = 0;
  quizState.answered = false;
  renderQuizQuestion();
}

function renderQuizQuestion() {
  const a = ANIMALS[quizState.animalId];
  const sess = quizState.sessionQuestions;
  if (!sess?.length) return;
  const q = sess[quizState.currentQ];
  const tierType = quizUiTierType(quizState.animalId);
  const body = document.getElementById('quiz-body');
  const letters = ['A', 'B', 'C', 'D'];

  // Progress pips HTML
  const pipsHtml = sess.map((_, i) => {
    let cls = 'quiz-pip';
    if (i < quizState.currentQ) cls += ' done';
    else if (i === quizState.currentQ) cls += ` current ${tierType}`;
    return `<div class="${cls}"></div>`;
  }).join('');

  const optsHtml = q.opts.map((opt, i) =>
    `<button class="quiz-opt ${tierType}-opt" id="qopt-${i}" onclick="answerQuestion(${i})">
      <span class="qopt-letter">${letters[i]}</span>
      <span>${opt}</span>
    </button>`
  ).join('');

  body.innerHTML = `
    <div class="quiz-animal-hdr" style="display:flex;align-items:center;gap:12px;text-align:left">
      <span style="font-size:3rem">${a.emoji}</span>
      <div>
        <div class="quiz-animal-nm ${tierType}" style="font-size:1.2rem">${a.name}</div>
        <div class="quiz-animal-sub ${tierType}">UNLOCK CHALLENGE</div>
      </div>
    </div>
    <div class="quiz-prog" style="width:100%">
      ${pipsHtml}
      <span class="quiz-pip-lbl">Q${quizState.currentQ+1} of ${sess.length}</span>
    </div>
    <div class="quiz-qcard ${tierType}" style="width:100%">
      <div class="quiz-qnum">Question ${quizState.currentQ + 1}</div>
      <div class="quiz-qtxt">${q.q}</div>
      <div class="quiz-opts" id="quiz-opts-container">${optsHtml}</div>
      <div id="quiz-feedback-area"></div>
    </div>`;
}

function answerQuestion(optIdx) {
  if (quizState.answered) return;
  quizState.answered = true;

  const a = ANIMALS[quizState.animalId];
  const sess = quizState.sessionQuestions;
  const q = sess[quizState.currentQ];
  const tierType = quizUiTierType(quizState.animalId);
  const isCorrect = optIdx === q.correct;
  const letters = ['A','B','C','D'];

  if (isCorrect) quizState.correctCount++;

  // Style the option buttons
  document.querySelectorAll('.quiz-opt').forEach((btn, i) => {
    btn.classList.add('qdisabled');
    if (i === q.correct) btn.classList.add('qcorrect');
    else if (i === optIdx && !isCorrect) btn.classList.add('qwrong');
  });

  // Show feedback
  const feedback = document.getElementById('quiz-feedback-area');
  feedback.innerHTML = `
    <div class="quiz-feedback">
      <div class="qf-icon">${isCorrect ? '✅' : '❌'}</div>
      <div class="qf-verdict ${isCorrect ? 'qpass' : 'qfail'}">${isCorrect ? 'Correct!' : 'Wrong!'}</div>
      <div class="qf-correct-ans">${isCorrect ? 'Great job!' : `Correct answer: <strong>${letters[q.correct]}. ${q.opts[q.correct]}</strong>`}</div>
      <div class="qf-fact"><span class="qf-fact-lbl">💡 Fun Fact</span>${q.fact}</div>
      <button class="btn ${tierType === 'dino' ? 'btn-dino' : 'btn-purple'}" onclick="nextQuizQuestion()">${quizState.currentQ >= sess.length - 1 ? 'See Result →' : 'Next Question →'}</button>
    </div>`;

  // Scroll to feedback
  feedback.scrollIntoView({behavior:'smooth', block:'nearest'});
}

function nextQuizQuestion() {
  const sess = quizState.sessionQuestions;
  const n = sess?.length || 0;
  quizState.currentQ++;
  quizState.answered = false;

  if (quizState.currentQ >= n) {
    const passed = quizState.correctCount === n;
    showQuizResult(passed);
  } else {
    renderQuizQuestion();
    // Scroll back to top of quiz body
    document.getElementById('quiz-body').scrollTo({top:0, behavior:'smooth'});
  }
}

function showQuizResult(passed) {
  const animalId = quizState.animalId;
  const a = ANIMALS[animalId];
  const tierType = quizUiTierType(animalId);
  const p = state.progress;

  const nAsked = quizState.sessionQuestions?.length || UNLOCK_QUIZ_SESSION_LEN;
  recordQuizAnswers(p, nAsked, quizState.correctCount);
  if (passed) {
    if (!p.quizUnlocked.includes(animalId)) p.quizUnlocked.push(animalId);
  }
  void saveUserProgress(p);

  const body = document.getElementById('quiz-body');

  if (passed) {
    body.innerHTML = `
      <div class="quiz-result">
        <span class="qr-icon">🔓</span>
        <div class="qr-title qr-pass">${a.name} Unlocked!</div>
        <p class="qr-sub">${nAsked} / ${nAsked} correct — You know your stuff, Commander.</p>
        <div class="unlock-showcase ${tierType}-showcase">
          <span class="us-em">${a.emoji}</span>
          <div class="us-nm ${tierType}">${a.name}</div>
          <div class="us-bio">${a.bio}</div>
          ${buildMiniStats(a)}
          <div style="margin-top:12px;font-family:var(--fm);font-size:.62rem;color:var(--text-dim)">Now available in the Hybrid Forge.</div>
        </div>
        <div class="qr-acts">
          <button class="btn btn-primary btn-lg" onclick="returnFromQuiz()">⚗ Go to Forge</button>
          <button class="btn btn-ghost btn-sm" onclick="returnFromQuizHub()">Hub</button>
        </div>
      </div>`;
  } else {
    const correctCount = quizState.correctCount;
    body.innerHTML = `
      <div class="quiz-result">
        <span class="qr-icon">😞</span>
        <div class="qr-title qr-fail">Not Quite!</div>
        <p class="qr-sub">You got ${correctCount} / ${nAsked} correct. You need every question right to unlock ${a.name}.</p>
        <div style="background:var(--surface);border:1px solid rgba(255,34,68,.3);padding:20px;margin-bottom:18px;text-align:center">
          <div style="font-size:2.5rem;margin-bottom:8px">${a.emoji}</div>
          <div style="font-family:var(--fd);font-size:1rem;color:var(--text-dim);margin-bottom:6px">${a.name} remains locked.</div>
          <div style="font-family:var(--fm);font-size:.7rem;color:var(--text-dim)">You can attempt the quiz again any time from the Forge or Hub.</div>
        </div>
        <div class="qr-acts">
          <button class="btn btn-secondary" onclick="openQuiz('${animalId}')">↺ Try Again</button>
          <button class="btn btn-ghost btn-sm" onclick="returnFromQuiz()">Back to Forge</button>
        </div>
      </div>`;
  }
}

function returnFromQuiz() {
  state.selectedAnimals = state.playerHybrid ? [...state.playerHybrid.animals] : [];
  void persistGameProgress();
  showScreen('builder');
}
function returnFromQuizHub() {
  showHub();
}
function exitQuiz() {
  if (state.quizReturnScreen === 'hub') showScreen('hub');
  else {
    state.selectedAnimals = state.playerHybrid ? [...state.playerHybrid.animals] : [];
    showScreen('builder');
  }
}

// ═══════════════════════════════════════════════════════════════════
// BATTLE SETUP
// ═══════════════════════════════════════════════════════════════════

function startBattle() {
  if (!state.playerHybrid) return;
  clearDefeatAutoReturn();
  state.battleFlowGen = (state.battleFlowGen || 0) + 1;
  const p = state.progress;
  const levelDef = LEVELS[Math.min(p.level - 1, LEVELS.length - 1)];
  state.enemyHybrid = buildEnemyHybrid(levelDef);
  const questions = buildPreBattleQuizForAnimals(state.playerHybrid.animals);
  state.battle = {
    levelDef,
    rounds: [],
    pWins: 0,
    eWins: 0,
    phase: 'pre_quiz',
    quizBoosts: EMPTY_STAT_BOOST(),
    preQuiz: {
      questions,
      idx: 0,
      boosts: EMPTY_STAT_BOOST(),
      answered: false,
      lastCorrect: null,
    },
  };
  renderBattleScreen();
  showScreen('battle');
  setTimeout(() => scrollToBattlePreQuiz(), 120);
}

function renderPreBattleQuizUI() {
  const wrap = document.getElementById('battle-pre-quiz');
  const b = state.battle;
  if (!wrap || !b?.preQuiz) return;
  const pq = b.preQuiz;
  const q = pq.questions[pq.idx];
  if (!q) return;

  const n = pq.questions.length;
  const teamLine = state.playerHybrid?.composition?.replace(/ · /g, ' • ') || 'Your team';
  const qNum = pq.idx + 1;
  const letters = ['A', 'B', 'C', 'D'];
  const optsHtml = q.opts
    .map(
      (opt, i) =>
        `<button type="button" class="pre-q-opt" id="preq-opt-${i}" onclick="answerPreBattleQuestion(${i})">
          <strong>${letters[i]}.</strong> ${escapeHtml(opt)}
        </button>`
    )
    .join('');

  wrap.innerHTML = `
    <div class="pre-quiz-title"><span class="pre-quiz-emoji" aria-hidden="true">⚡</span>Battle Boost Quiz</div>
    <p class="pre-quiz-sub"><strong>${n >= 3 ? 'Answer 3 questions' : n === 2 ? 'Answer 2 questions' : 'Answer 1 question'} to power up your hybrid.</strong><br>Each right answer adds a tiny battle boost. Wrong answers never hurt you.</p>
    <div class="pre-quiz-team" aria-label="Your team"><strong>${escapeHtml(state.playerHybrid?.name || 'Your hybrid')}</strong> · ${escapeHtml(teamLine)}</div>
    <div class="pre-quiz-hdr">Question ${qNum} of ${n} · ${q.emoji} ${escapeHtml(q.name)}</div>
    <div class="pre-qtxt">${escapeHtml(q.q)}</div>
    <div class="pre-q-opts">${optsHtml}</div>`;
}

function answerPreBattleQuestion(optIdx) {
  const b = state.battle;
  if (!b?.preQuiz || b.preQuiz.answered) return;
  const pq = b.preQuiz;
  const q = pq.questions[pq.idx];
  pq.answered = true;
  const ok = optIdx === q.correct;
  pq.lastCorrect = ok;
  if (ok) pq.boosts[q.boostStat]++;
  if (state.progress) {
    recordQuizAnswers(state.progress, 1, ok ? 1 : 0);
    void persistGameProgress();
  }

  q.opts.forEach((_, i) => {
    const btn = document.getElementById(`preq-opt-${i}`);
    if (!btn) return;
    btn.disabled = true;
    if (i === q.correct) btn.classList.add('qcorrect');
    else if (i === optIdx && !ok) btn.classList.add('qwrong');
  });

  const wrap = document.getElementById('battle-pre-quiz');
  const statWord = PRE_BATTLE_STAT_WORDS[q.boostStat];
  const fb = document.createElement('div');
  fb.className = 'pre-q-feedback';
  fb.style.color = ok ? 'var(--green)' : 'var(--text-dim)';
  fb.innerHTML = ok
    ? `<strong style="display:block;margin-bottom:4px">Boost unlocked!</strong>+1 ${statWord} for this fight.`
    : '<strong style="display:block;margin-bottom:4px">No boost this time</strong>You are still full strength — try the next question!';
  wrap.appendChild(fb);
  if (q.funFact) {
    const fact = document.createElement('div');
    fact.className = 'pre-q-funfact';
    fact.innerHTML = `<strong>Fun fact</strong>${escapeHtml(q.funFact)}`;
    wrap.appendChild(fact);
  }
  const next = document.createElement('div');
  next.style.cssText = 'margin-top:14px;text-align:center';
  next.innerHTML = `<button type="button" class="btn btn-primary" onclick="advancePreBattleQuiz()">${pq.idx >= pq.questions.length - 1 ? 'See boosts →' : 'Next question →'}</button>`;
  wrap.appendChild(next);
}

function advancePreBattleQuiz() {
  const b = state.battle;
  if (!b?.preQuiz) return;
  const pq = b.preQuiz;
  pq.idx++;
  pq.answered = false;
  pq.lastCorrect = null;
  if (pq.idx >= pq.questions.length) {
    b.quizBoosts = { ...pq.boosts };
    b.phase = 'boost_summary';
  }
  renderBattleScreen();
}

function renderBattleBoostSummaryUI() {
  const el = document.getElementById('battle-boost-summary');
  const quizEl = document.getElementById('battle-pre-quiz');
  const b = state.battle;
  if (!el || !b) return;
  el.classList.remove('hidden');
  if (quizEl) quizEl.innerHTML = '';

  const boosts = b.quizBoosts || EMPTY_STAT_BOOST();
  const lines = [];
  for (const k of ['spd', 'agi', 'int', 'str']) {
    const n = boosts[k] || 0;
    if (n > 0) lines.push(`+${n} ${PRE_BATTLE_STAT_WORDS[k]}${n > 1 ? '' : ''} (this battle)`);
  }
  const streakB = state.progress ? getStreakBattleBoost(state.progress) : EMPTY_STAT_BOOST();
  const streakPts = sumBoostPoints(streakB);
  const streakLine =
    streakPts > 0
      ? `<div class="boost-line" style="color:var(--orange)">🔥 +${streakPts} from your daily streak (this battle)</div>`
      : '';
  const list =
    lines.length > 0
      ? lines.map(t => `<div class="boost-line">✓ ${t}</div>`).join('')
      : `<div class="boost-line" style="color:var(--text-dim)">No quiz boosts this time — your base hybrid is ready to fight.</div>`;

  el.innerHTML = `
    <div class="boost-summary-box">
      <div class="boost-summary-title">Boosts for this battle</div>
      ${list}
      ${streakLine}
      <p style="font-family:var(--fm);font-size:.58rem;color:var(--text-dim);margin:12px 0 14px;line-height:1.45">
        Wrong answers do not weaken you — they only skip the extra bonus.
      </p>
      <div style="text-align:center">
        <button type="button" class="btn btn-primary btn-lg" onclick="confirmPreBattleAndStartFight()">⚔ Start fight!</button>
      </div>
    </div>`;
  setTimeout(() => scrollToBattlePreQuiz(), 80);
}

function confirmPreBattleAndStartFight() {
  const b = state.battle;
  if (!b) return;
  b.phase = 'ready';
  const pre = document.getElementById('battle-prephase');
  const boostEl = document.getElementById('battle-boost-summary');
  const stage = document.getElementById('battle-stage');
  const bLog = document.querySelector('#screen-battle .b-log');
  if (pre) pre.classList.add('hidden');
  if (boostEl) boostEl.classList.add('hidden');
  if (stage) stage.classList.remove('pre-quiz-dim');
  if (bLog) bLog.classList.remove('hidden');

  const disp = getBattleDisplayPlayerHybrid();
  document.getElementById('bp-em').textContent = disp.emojis;
  document.getElementById('bp-name').textContent = disp.name;
  document.getElementById('bp-comp').textContent = disp.composition;
  const qPts = sumBoostPoints(state.battle.quizBoosts || EMPTY_STAT_BOOST());
  const sPts = sumBoostPoints(getStreakBattleBoost(state.progress));
  const bonusLbl = [qPts ? `+${qPts} quiz` : '', sPts ? `+${sPts} streak` : ''].filter(Boolean).join(' · ');
  document.getElementById('bp-power').innerHTML =
    bonusLbl
      ? `Power: <strong>${disp.power}</strong> <span style="color:var(--green);font-size:.55rem">(${bonusLbl})</span>`
      : `Power: <strong>${disp.power}</strong>`;
  renderFighterStats('bp-stats', disp.stats);

  beginBattle();
}

function renderBattleScreen() {
  const h = state.playerHybrid;
  const e = state.enemyHybrid;
  const def = state.battle.levelDef;
  const pre = document.getElementById('battle-prephase');
  const boostEl = document.getElementById('battle-boost-summary');
  const stage = document.getElementById('battle-stage');
  const bLog = document.querySelector('#screen-battle .b-log');

  const pill = document.getElementById('battle-level-pill');
  if (pill) pill.textContent = `Level ${def.id} / 10`;
  document.getElementById('b-lvl-tag').textContent = 'Best of 5 rounds · Stat clash';
  document.getElementById('b-title').textContent = def.name.toUpperCase();
  document.getElementById('battle-topbar-info').textContent = `Mission L${def.id} — ${def.name}`;

  const disp = getBattleDisplayPlayerHybrid();
  document.getElementById('bp-em').textContent = disp.emojis;
  document.getElementById('bp-name').textContent = disp.name;
  document.getElementById('bp-comp').textContent = disp.composition;
  const qPts = sumBoostPoints(state.battle.quizBoosts || EMPTY_STAT_BOOST());
  const sPts =
    state.battle.phase !== 'pre_quiz' ? sumBoostPoints(getStreakBattleBoost(state.progress)) : 0;
  const bonusLbl = [qPts ? `+${qPts} quiz` : '', sPts ? `+${sPts} streak` : ''].filter(Boolean).join(' · ');
  document.getElementById('bp-power').innerHTML =
    bonusLbl && state.battle.phase !== 'pre_quiz'
      ? `Power: <strong>${disp.power}</strong> <span style="color:var(--green);font-size:.55rem">(${bonusLbl})</span>`
      : `Power: <strong>${disp.power}</strong>`;
  renderFighterStats('bp-stats', disp.stats);

  document.getElementById('be-em').textContent = e.emojis;
  document.getElementById('be-name').textContent = e.name;
  document.getElementById('be-comp').textContent = e.composition;
  document.getElementById('be-power').innerHTML = `Power: <strong>${e.power}</strong>`;
  renderFighterStats('be-stats', e.stats);

  resetHearts();
  resetRoundPips();
  resetBattleRoundStrip();
  document.getElementById('log-lines').innerHTML = '';
  document.getElementById('clash-box').classList.add('hidden');
  document.getElementById('clash-box').classList.remove('clash-active');
  clearClashStatHighlight();
  resetClashMeters();
  document.getElementById('battle-countdown-overlay')?.classList.add('hidden');
  hideBattleResultOverlay();

  const fp = document.getElementById('fighter-player');
  const fe = document.getElementById('fighter-enemy');
  if (fp) fp.classList.toggle('fighter-champion', !!h);
  if (fe) fe.classList.remove('fighter-champion');

  const phase = state.battle.phase;
  if (phase === 'pre_quiz') {
    if (pre) pre.classList.remove('hidden');
    if (boostEl) boostEl.classList.add('hidden');
    if (stage) stage.classList.add('pre-quiz-dim');
    if (bLog) bLog.classList.add('hidden');
    renderPreBattleQuizUI();
    document.getElementById('b-actions').innerHTML = '';
    return;
  }
  if (phase === 'boost_summary') {
    if (pre) pre.classList.remove('hidden');
    if (stage) stage.classList.add('pre-quiz-dim');
    if (bLog) bLog.classList.add('hidden');
    renderBattleBoostSummaryUI();
    document.getElementById('b-actions').innerHTML = '';
    return;
  }

  if (pre) pre.classList.add('hidden');
  if (boostEl) boostEl.classList.add('hidden');
  if (stage) stage.classList.remove('pre-quiz-dim');
  if (bLog) bLog.classList.remove('hidden');
  document.getElementById('b-actions').innerHTML = `<button class="btn btn-primary btn-lg" onclick="beginBattle()">⚔ Begin Battle</button>`;
}

function renderFighterStats(containerId, stats) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = ['spd', 'agi', 'int', 'str']
    .map(
      s =>
        `<div class="stat-row battle-stat-row" data-stat="${s}">
        <div class="stat-lbl">${s.toUpperCase()}</div>
        <div class="stat-track"><div class="stat-fill sf-${s}" style="width:${Math.min((stats[s] / STAT_MAX) * 100, 100)}%"></div></div>
        <div class="stat-val">${stats[s]}</div>
      </div>`
    )
    .join('');
}

function resetHearts() {
  ['bp-hearts','be-hearts'].forEach(id => {
    const el = document.getElementById(id);
    el.innerHTML = '';
    for (let i = 0; i < 5; i++) el.innerHTML += `<span class="hrt" id="${id.split('-')[0]}-h-${i}">♥</span>`;
  });
}
function resetRoundPips() {
  const pips = document.getElementById('round-pips');
  pips.innerHTML = '';
  for (let i = 0; i < 5; i++) pips.innerHTML += `<div class="r-pip" id="rpip-${i}"></div>`;
  document.getElementById('r-counter').textContent = '0 / 5';
}

function resetBattleRoundStrip() {
  const strip = document.getElementById('battle-round-strip');
  const dots = document.getElementById('brs-dots');
  const label = document.getElementById('brs-label');
  if (!strip || !dots || !label) return;
  strip.classList.add('hidden');
  dots.innerHTML = '';
  for (let i = 0; i < 5; i++) dots.innerHTML += '<span class="brs-dot up" aria-hidden="true"></span>';
  label.textContent = 'Round 1 of 5';
}

function showBattleRoundStrip() {
  document.getElementById('battle-round-strip')?.classList.remove('hidden');
}

function setBattleRoundStripProgress(roundIdx) {
  const label = document.getElementById('brs-label');
  const dots = document.querySelectorAll('#brs-dots .brs-dot');
  if (label) label.textContent = `Round ${roundIdx + 1} of 5`;
  dots.forEach((d, i) => {
    d.classList.remove('done', 'current', 'up');
    if (i < roundIdx) d.classList.add('done');
    else if (i === roundIdx) d.classList.add('current');
    else d.classList.add('up');
  });
}

function finalizeBattleRoundStrip() {
  document.querySelectorAll('#brs-dots .brs-dot').forEach(d => {
    d.classList.remove('current', 'up');
    d.classList.add('done');
  });
  const label = document.getElementById('brs-label');
  if (label) label.textContent = 'Round 5 of 5';
}

// ═══════════════════════════════════════════════════════════════════
// BATTLE EXECUTION (animated)
// ═══════════════════════════════════════════════════════════════════

function runBattleCountdown(done) {
  const overlay = document.getElementById('battle-countdown-overlay');
  const steps = ['3', '2', '1', 'CLASH!'];
  let i = 0;
  overlay.classList.remove('hidden');
  overlay.setAttribute('aria-hidden', 'false');
  function step() {
    if (i >= steps.length) {
      overlay.classList.add('hidden');
      overlay.textContent = '';
      overlay.setAttribute('aria-hidden', 'true');
      done();
      return;
    }
    if (steps[i] === 'CLASH!') scrollToBattleFocus();
    overlay.textContent = steps[i];
    overlay.classList.remove('cd-pop');
    void overlay.offsetWidth;
    overlay.classList.add('cd-pop');
    const ms = i === 3 ? 620 : 820;
    i++;
    setTimeout(step, ms);
  }
  step();
}

function clearClashStatHighlight() {
  document.querySelectorAll('.battle-stat-row').forEach(el => el.classList.remove('clash-stat-active'));
}

function setClashStatHighlight(stat) {
  clearClashStatHighlight();
  document.querySelectorAll(`.battle-stat-row[data-stat="${stat}"]`).forEach(el => el.classList.add('clash-stat-active'));
}

/** Player bar only (rival bar still 0) — staggered reveal */
function setClashMetersPlayerPortion(pTotal, eTotal) {
  const pm = document.getElementById('clash-pmeter');
  const em = document.getElementById('clash-emeter');
  if (!pm || !em) return;
  const sum = Math.max(1, pTotal + eTotal);
  const pw = Math.round((pTotal / sum) * 100);
  pm.style.transition = 'width .45s cubic-bezier(.35,.85,.4,1)';
  em.style.transition = 'width .35s ease';
  em.style.width = '0%';
  pm.style.width = `${pw}%`;
}

/** Finish split: animate rival bar to its share */
function setClashMetersEnemyPortion(pTotal, eTotal) {
  const pm = document.getElementById('clash-pmeter');
  const em = document.getElementById('clash-emeter');
  if (!pm || !em) return;
  const sum = Math.max(1, pTotal + eTotal);
  const ew = Math.round((eTotal / sum) * 100);
  em.style.transition = 'width .45s cubic-bezier(.35,.85,.4,1)';
  em.style.width = `${ew}%`;
}

function clearClashMeterWinHighlight() {
  document.getElementById('clash-meter-row-p')?.classList.remove('clash-meter-win');
  document.getElementById('clash-meter-row-e')?.classList.remove('clash-meter-win');
}

function setClashMeterWinHighlight(winner) {
  clearClashMeterWinHighlight();
  if (winner === 'player') document.getElementById('clash-meter-row-p')?.classList.add('clash-meter-win');
  else if (winner === 'enemy') document.getElementById('clash-meter-row-e')?.classList.add('clash-meter-win');
}

function resetClashMeters() {
  const pm = document.getElementById('clash-pmeter');
  const em = document.getElementById('clash-emeter');
  if (!pm || !em) return;
  clearClashMeterWinHighlight();
  pm.style.transition = 'none';
  em.style.transition = 'none';
  pm.style.width = '0%';
  em.style.width = '0%';
}

function statRoundCounts(result) {
  const won = { spd: 0, agi: 0, int: 0, str: 0 };
  const lost = { spd: 0, agi: 0, int: 0, str: 0 };
  for (const r of result.rounds) {
    if (r.winner === 'player') won[r.stat]++;
    else if (r.winner === 'enemy') lost[r.stat]++;
  }
  return { won, lost };
}

function getBattleVerdict(result) {
  const won = result.winner === 'player';
  const d = result.pWins - result.eWins;
  if (won) {
    if (d >= 3) {
      return {
        brClass: 'br-dom-win',
        title: 'VICTORY 🏆',
        emoji: '🏆',
        tag: 'You crushed it — round after round.',
      };
    }
    if (d === 1) {
      return {
        brClass: 'br-close-win',
        title: 'VICTORY 🏆',
        emoji: '🏆',
        tag: 'That was razor-close — you earned this win.',
      };
    }
    return {
      brClass: 'br-solid-win',
      title: 'VICTORY 🏆',
      emoji: '🏆',
      tag: 'Solid fight — your hybrid delivered.',
    };
  }
  if (d <= -3) {
    return {
      brClass: 'br-dom-loss',
      title: 'DEFEAT 💀',
      emoji: '💀',
      tag: 'They had the edge in most rounds.',
    };
  }
  if (d === -1) {
    return {
      brClass: 'br-close-loss',
      title: 'DEFEAT 💀',
      emoji: '💀',
      tag: 'So close — one more good round could flip it.',
    };
  }
  return {
    brClass: 'br-solid-loss',
    title: 'DEFEAT 💀',
    emoji: '💀',
    tag: 'Rebuild and try a different mix.',
  };
}

function buildBattleSummaryLine(result, won) {
  const { won: wC, lost: lC } = statRoundCounts(result);
  const winStats = Object.entries(wC)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => PRE_BATTLE_STAT_WORDS[k]);
  const lossStats = Object.entries(lC)
    .filter(([, n]) => n > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => PRE_BATTLE_STAT_WORDS[k]);
  const margin = Math.abs(result.pWins - result.eWins);
  const pp = getBattleDisplayPlayerHybrid()?.power ?? state.playerHybrid?.power ?? 0;
  const ep = state.enemyHybrid?.power ?? 0;

  if (won) {
    if (winStats.length >= 2) {
      return `Your hybrid won with strong ${winStats[0]} and ${winStats[1]}.`;
    }
    if (winStats.length === 1) {
      return margin <= 1
        ? `A close clash — ${winStats[0]} made the difference.`
        : `Your hybrid’s ${winStats[0]} helped seal the win.`;
    }
    return 'Your hybrid pulled ahead when it mattered.';
  }

  if (lossStats.length >= 2) {
    return `The other team edged ahead on ${lossStats[0]} and ${lossStats[1]}.`;
  }
  if (lossStats.length === 1) {
    return margin <= 1
      ? `A tight fight — they sneaked ahead on ${lossStats[0]}.`
      : `They had the edge in ${lossStats[0]} this time.`;
  }
  if (ep > pp) {
    return 'The opponent had a bit more total power on the board.';
  }
  return 'The rolls did not go your way — try again with a new fusion.';
}

function showBattleResultOverlay(result, opts) {
  const o = opts || {};
  const won = result.winner === 'player';
  const v = getBattleVerdict(result);
  const summary = buildBattleSummaryLine(result, won);
  const overlay = document.getElementById('battle-result-overlay');
  const card = document.getElementById('battle-result-card');
  const emojiEl = document.getElementById('battle-result-emoji');
  const lootEl = document.getElementById('battle-result-loot');
  card.className = `battle-result-card ${v.brClass} br-moment`;
  if (emojiEl) emojiEl.textContent = '';
  document.getElementById('battle-result-title').textContent = v.title;
  document.getElementById('battle-result-score').textContent = `Final score · ${result.pWins} – ${result.eWins}`;
  if (lootEl) {
    lootEl.classList.remove('br-loot-pop');
    const xg = o.xpGained | 0;
    const cg = o.coinsGained | 0;
    const tg = o.tokensGained | 0;
    if (won && (xg || cg || tg)) {
      lootEl.classList.remove('hidden');
      lootEl.innerHTML = `
        <div class="br-loot-title">You earned</div>
        <div class="br-loot-pills">
          ${xg ? `<span class="br-pill br-pill-xp">+${xg} Commander XP</span>` : ''}
          ${cg ? `<span class="br-pill br-pill-coin">+${cg} Fusion Coins</span>` : ''}
          ${tg ? `<span class="br-pill br-pill-token">+${tg} Unlock Token</span>` : ''}
        </div>`;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => lootEl.classList.add('br-loot-pop'));
      });
    } else {
      lootEl.classList.add('hidden');
      lootEl.innerHTML = '';
    }
  }
  const hy = state.playerHybrid;
  const nameLine =
    hy && hy.name
      ? `<div class="brt-hybrid-id"><span class="brt-hybrid-emoji">${hy.emojis}</span> <strong>${escapeHtml(hy.name)}</strong></div>`
      : '';
  let sumHtml = `${nameLine}<span class="brt-tag">${v.tag}</span><span class="brt-detail">${summary}</span>`;
  if (o.rewardFlash) sumHtml += `<div class="brt-reward-flash">${o.rewardFlash}</div>`;
  document.getElementById('battle-result-summary').innerHTML = sumHtml;
  const nextEl = document.getElementById('battle-result-next');
  if (nextEl && state.progress) {
    const hints = [...getProgressionNextLines(state.progress)];
    if (o.dailyHint) hints.push(o.dailyHint);
    const hint = hints.join(' ');
    nextEl.innerHTML = hint
      ? `<div class="brt-next-lbl">What happens next</div><div class="brt-next-txt">${hint}</div>`
      : '';
  } else if (nextEl) nextEl.innerHTML = '';
  overlay.classList.remove('hidden');
}

function hideBattleResultOverlay() {
  document.getElementById('battle-result-overlay').classList.add('hidden');
  const loot = document.getElementById('battle-result-loot');
  if (loot) {
    loot.classList.add('hidden');
    loot.classList.remove('br-loot-pop');
    loot.innerHTML = '';
  }
}

function beginBattle() {
  const b = state.battle;
  if (!b || b.phase !== 'ready') return;
  b.phase = 'fighting';
  document.getElementById('b-actions').innerHTML = '';
  const boosts = mergeStatBoosts(b.quizBoosts || EMPTY_STAT_BOOST(), getStreakBattleBoost(state.progress));
  runBattleCountdown(() => {
    scrollToBattleFocus();
    showBattleRoundStrip();
    const result = runFullBattle(state.playerHybrid, state.enemyHybrid, boosts);
    state.battle.result = result;
    animateBattle(result, 0);
  });
}

function addLog(html, delay, opts) {
  const o = opts || {};
  setTimeout(() => {
    const log = document.getElementById('log-lines');
    if (!log) return;
    const div = document.createElement('div');
    div.className = 'll';
    div.innerHTML = html;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
    if (o.scrollTrail) scrollToBattleTrail();
    if (o.scrollFocus) scrollToBattleFocus();
  }, delay);
}

function animateBattle(result, roundIdx) {
  if (roundIdx >= result.rounds.length) {
    setTimeout(() => finishBattle(result), 720);
    return;
  }
  const round = result.rounds[roundIdx];
  const roundNum = roundIdx + 1;
  const roundSpan = 4200;
  const baseDelay = roundIdx * roundSpan;
  const statWord = STAT_LABELS_SIMPLE[round.stat];
  const statIcon = STAT_TRAIL_ICONS[round.stat] || '◆';
  const fp = document.getElementById('fighter-player');
  const fe = document.getElementById('fighter-enemy');
  fp.classList.remove('f-side-win', 'f-side-lose');
  fe.classList.remove('f-side-win', 'f-side-lose');

  const clearClashRevealUI = () => {
    const inner = document.querySelector('#clash-box .clash-inner');
    inner?.classList.remove('clash-reveal-p', 'clash-reveal-e');
    document.getElementById('clash-pval')?.classList.remove('clash-winner-n');
    document.getElementById('clash-eval')?.classList.remove('clash-winner-n');
    document.getElementById('clash-box')?.classList.remove('clash-clash-moment');
  };

  setTimeout(() => {
    scrollToBattleFocus();
    setBattleRoundStripProgress(roundIdx);
    const box = document.getElementById('clash-box');
    clearClashRevealUI();
    box.classList.remove('hidden');
    box.classList.add('clash-active', 'clash-peak');
    setTimeout(() => box.classList.remove('clash-peak'), 880);
    setClashStatHighlight(round.stat);
    const tag = document.querySelector('#clash-box .clash-tagline');
    if (tag) tag.textContent = `Category · ${statWord}`;
    const nm = document.getElementById('clash-stat-nm');
    nm.textContent = statWord.toUpperCase();
    nm.className = `clash-stat-nm ${round.stat}`;
    document.getElementById('clash-pval').textContent = '?';
    document.getElementById('clash-eval').textContent = '?';
    resetClashMeters();
  }, baseDelay + 380);

  setTimeout(() => {
    const pv = document.getElementById('clash-pval');
    pv.textContent = round.pTotal;
    pv.classList.add('pop');
    setTimeout(() => pv.classList.remove('pop'), 500);
    setClashMetersPlayerPortion(round.pTotal, round.eTotal);
  }, baseDelay + 1180);

  setTimeout(() => {
    const box = document.getElementById('clash-box');
    box.classList.add('clash-clash-moment');
    setTimeout(() => box.classList.remove('clash-clash-moment'), 580);
    const ev = document.getElementById('clash-eval');
    ev.textContent = round.eTotal;
    ev.classList.add('pop');
    setTimeout(() => ev.classList.remove('pop'), 500);
    setClashMetersEnemyPortion(round.pTotal, round.eTotal);
  }, baseDelay + 1980);

  setTimeout(() => {
    document.getElementById('clash-stat-nm')?.classList.add('clash-suspense');
  }, baseDelay + 2420);

  setTimeout(() => {
    const nm = document.getElementById('clash-stat-nm');
    nm?.classList.remove('clash-suspense');
    const pip = document.getElementById(`rpip-${roundIdx}`);
    let rowCls = 'rt-tie';
    let badgeCls = 'tie';
    let badgeTxt = 'T';
    if (round.winner === 'player') {
      pip.className = 'r-pip pw';
      fp.classList.add('f-side-win', 'flash-win');
      fe.classList.add('f-side-lose', 'flash-lose');
      setTimeout(() => {
        fp.classList.remove('flash-win');
        fe.classList.remove('flash-lose');
        const heartEl = document.getElementById(`be-h-${roundIdx}`);
        if (heartEl) heartEl.classList.add('lost');
      }, 900);
      rowCls = 'rt-win';
      badgeCls = 'win';
      badgeTxt = 'W';
    } else if (round.winner === 'enemy') {
      pip.className = 'r-pip ew';
      fe.classList.add('f-side-win', 'flash-win');
      fp.classList.add('f-side-lose', 'flash-lose');
      setTimeout(() => {
        fe.classList.remove('flash-win');
        fp.classList.remove('flash-lose');
        const heartEl = document.getElementById(`bp-h-${roundIdx}`);
        if (heartEl) heartEl.classList.add('lost');
      }, 900);
      rowCls = 'rt-loss';
      badgeCls = 'loss';
      badgeTxt = 'L';
    } else {
      pip.className = 'r-pip tie';
    }

    const inner = document.querySelector('#clash-box .clash-inner');
    if (round.winner === 'player') {
      inner?.classList.add('clash-reveal-p');
      document.getElementById('clash-pval')?.classList.add('clash-winner-n');
    } else if (round.winner === 'enemy') {
      inner?.classList.add('clash-reveal-e');
      document.getElementById('clash-eval')?.classList.add('clash-winner-n');
    }
    if (round.winner === 'player') setClashMeterWinHighlight('player');
    else if (round.winner === 'enemy') setClashMeterWinHighlight('enemy');
    else clearClashMeterWinHighlight();

    addLog(
      `<div class="round-trail-row ${rowCls}"><span class="rt-icon">${statIcon}</span><span class="rt-cat">${statWord}</span><span class="rt-badge ${badgeCls}">${badgeTxt}</span></div>`,
      0,
      { scrollFocus: true }
    );
    document.getElementById('r-counter').textContent = `${roundNum} / 5`;
  }, baseDelay + 3040);

  setTimeout(() => {
    const box = document.getElementById('clash-box');
    box.classList.add('hidden');
    box.classList.remove('clash-active');
    clearClashStatHighlight();
    resetClashMeters();
    fp.classList.remove('f-side-win', 'f-side-lose');
    fe.classList.remove('f-side-win', 'f-side-lose');
    animateBattle(result, roundIdx + 1);
  }, baseDelay + 3980);
}

/** Local calendar date YYYY-MM-DD — daily streak, challenges, and rollover. */
function localDateString(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function localYesterdayString() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return localDateString(d);
}

function updateStreakOnLevelComplete(p) {
  touchDailyStreakIfNeeded(p);
}

function scrollDefeatIntoView() {
  const root = document.getElementById('screen-defeat');
  const box = root?.querySelector('.def-box');
  console.log('[flow] defeat scroll triggered', { hasScreen: !!root, hasBox: !!box });
  if (!root || !box) return;
  root.scrollTop = 0;
  box.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
}

async function finishBattle(result) {
  const flowGen = state.battleFlowGen;
  const box = document.getElementById('clash-box');
  box.classList.add('hidden');
  box.classList.remove('clash-active');
  clearClashStatHighlight();
  resetClashMeters();
  document.getElementById('fighter-player')?.classList.remove('f-side-win', 'f-side-lose');
  document.getElementById('fighter-enemy')?.classList.remove('f-side-win', 'f-side-lose');

  const won = result.winner === 'player';
  console.log('[battle] resolved', { won, score: `${result.pWins}-${result.eWins}`, flowGen });
  const p = state.progress;
  ensureDailyChallengeRolled(p);
  if (won) touchDailyStreakIfNeeded(p);

  let rewardFlash = '';
  let dailyHint = '';
  let xpGained = 0;
  let coinsGained = 0;
  let tokensGained = 0;
  if (won) {
    xpGained = XP_PER_BATTLE_WIN;
    p.commanderXp = (p.commanderXp || 0) + xpGained;
    p.totalWins++;
    p.dailyWinsToday = (p.dailyWinsToday || 0) + 1;
    coinsGained = 5;
    p.coins = (p.coins || 0) + 5;
    const ch = pickDailyChallenge(localDateString());
    if (!p.dailyChallengeRewardClaimed && dailyChallengeMet(ch, p, state.playerHybrid, true)) {
      p.dailyChallengeRewardClaimed = true;
      p.coins += 8;
      p.unlockTokens = (p.unlockTokens || 0) + 1;
      coinsGained += 8;
      tokensGained += 1;
      rewardFlash =
        '🎯 Daily challenge complete! +8 Fusion Coins · +1 <strong>Unlock token</strong> (save for future rewards).';
    } else if (!p.dailyChallengeRewardClaimed && ch.id === 'double' && (p.dailyWinsToday || 0) < 2) {
      dailyHint = `<strong>Daily:</strong> Win <strong>one more mission today</strong> to finish “${ch.title}”.`;
    } else if (!p.dailyChallengeRewardClaimed) {
      dailyHint = `<strong>Daily:</strong> “${ch.title}” — ${ch.desc}.`;
    }
  } else {
    p.totalLosses++;
    const ch = pickDailyChallenge(localDateString());
    if (!p.dailyChallengeRewardClaimed) {
      dailyHint = `<strong>Daily:</strong> “${ch.title}” — ${ch.desc}. You’ve got this!`;
    }
  }

  finalizeBattleRoundStrip();
  const finCls = won ? 'win' : 'loss';
  const finTxt = won ? `Victory ${result.pWins}–${result.eWins}` : `Defeat ${result.pWins}–${result.eWins}`;
  addLog(`<div class="round-trail-final ${finCls}">${finTxt}</div>`, 0, { scrollTrail: true });
  requestAnimationFrame(() => scrollToBattleTrail());

  try {
    await saveUserProgress(p);
    if (flowGen !== state.battleFlowGen) return;
    console.log('[battle] save complete (post-battle outcome)');
  } catch (e) {
    console.warn('[battle] save failed after outcome', e);
  }
  if (flowGen !== state.battleFlowGen) {
    console.log('[battle] stale flow after save — skip overlay / transition');
    return;
  }

  setTimeout(() => {
    if (flowGen !== state.battleFlowGen) return;
    showBattleResultOverlay(result, { rewardFlash, dailyHint, xpGained, coinsGained, tokensGained });
    console.log('[battle] result overlay shown', { won });
  }, 520);

  if (won) {
    setTimeout(() => {
      if (flowGen !== state.battleFlowGen) return;
      hideBattleResultOverlay();
      state.battle = null;
      console.log('[battle] return to victory / level-complete flow');
      void showLevelComplete();
    }, 3800);
  } else {
    setTimeout(() => {
      if (flowGen !== state.battleFlowGen) return;
      clearDefeatAutoReturn();
      hideBattleResultOverlay();
      state.battle = null;
      document.getElementById('def-sub').textContent =
        `You lost ${result.pWins}–${result.eWins}. Rebuild in the Forge and jump back in.`;
      const defHint = document.getElementById('def-auto-hint');
      if (defHint) {
        defHint.textContent =
          'You will return to your Hub automatically in a few seconds — or tap a button when you are ready.';
      }
      console.log('[battle] defeat resolved — defeat screen next');
      showScreen('defeat');
      console.log('[flow] defeat screen shown');
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          scrollDefeatIntoView();
        });
      });
      defeatReturnToHubTimer = setTimeout(() => {
        defeatReturnToHubTimer = null;
        const d = document.getElementById('screen-defeat');
        if (d && d.classList.contains('active')) {
          console.log('[flow] defeat return to hub');
          showHub();
        }
      }, 9000);
    }, 3800);
  }
}

// ═══════════════════════════════════════════════════════════════════
// LEVEL COMPLETE
// ═══════════════════════════════════════════════════════════════════

async function showLevelComplete() {
  const p = state.progress;
  const currentLevel = p.level;
  const isApexUnlock = currentLevel === 5;
  const isDinoUnlock = currentLevel === 8;
  const isFinalLevel = currentLevel === 10;
  const reward = LEVEL_REWARDS[currentLevel];

  updateStreakOnLevelComplete(p);

  p.highestLevelReached = Math.max(p.highestLevelReached || 0, currentLevel);

  // Advance level
  if (currentLevel <= 10) {
    p.level++;
    if (reward && ANIMALS[reward] && !p.unlockedAnimals.includes(reward)) p.unlockedAnimals.push(reward);
  }
  try {
    await saveUserProgress(p);
    console.log('[battle] save complete (level advanced)');
  } catch (e) {
    console.warn('[battle] save failed after level advance', e);
  }

  document.getElementById('lc-sub').textContent = `LEVEL ${currentLevel} CLEARED`;
  document.getElementById('lc-icon').textContent = isFinalLevel ? '👑' : '🏆';

  // Animal unlock box
  const ub = document.getElementById('unlock-box');
  if (reward && ANIMALS[reward]) {
    const a = ANIMALS[reward];
    ub.innerHTML = `
      <div class="unlock-lbl">🔓 New Animal Unlocked!</div>
      <div class="unlock-animal">
        <span class="unlock-em">${a.emoji}</span>
        <div class="unlock-info">
          <h3>${a.name}</h3>
          <p>${a.bio}</p>
          ${buildMiniStats(a)}
        </div>
      </div>`;
    ub.style.display = 'block';
  } else {
    ub.style.display = 'none';
  }

  // Apex unlock notification
  const ab = document.getElementById('apex-box');
  if (isApexUnlock) {
    ab.classList.remove('hidden');
    ab.innerHTML = `
      <div class="apex-bonus-title">◈ Apex Predators Now Available!</div>
      <p style="font-size:.82rem;color:var(--text-dim);margin-bottom:10px">You've earned the right to challenge apex predators.<br>Each unlock uses 3 random questions from a larger fact deck.</p>
      <div class="apex-chips">
        ${APEX_IDS.map(id => {
          const a = ANIMALS[id];
          return `<div class="apex-chip"><span>${a.emoji}</span><span>${a.name}</span></div>`;
        }).join('')}
      </div>
      <p style="font-size:.7rem;color:var(--text-dim);margin-top:10px;font-family:var(--fm)">Find them in the Forge → Apex Predators section.</p>`;
  } else {
    ab.classList.add('hidden');
  }

  // Dino unlock notification
  const db = document.getElementById('dino-box');
  if (isDinoUnlock) {
    db.classList.remove('hidden');
    db.innerHTML = `
      <div class="dino-bonus-title">🦖 Dinosaur Tier Now Available!</div>
      <p style="font-size:.82rem;color:var(--text-dim);margin-bottom:10px">You've reached the ultimate tier. Dinosaurs have stats far beyond anything you've faced.<br>Each unlock uses 3 random questions from a bigger dinosaur deck.</p>
      <div class="apex-chips" style="gap:14px">
        ${DINO_IDS.map(id => {
          const a = ANIMALS[id];
          return `<div class="apex-chip"><span>${a.emoji}</span><span style="color:var(--dino)">${a.name}</span></div>`;
        }).join('')}
      </div>
      <p style="font-size:.7rem;color:var(--text-dim);margin-top:10px;font-family:var(--fm)">Find them in the Forge → Dinosaur Tier section.</p>`;
  } else {
    db.classList.add('hidden');
  }

  // Actions
  const acts = document.getElementById('lc-actions');
  if (isFinalLevel) {
    acts.innerHTML = `<button class="btn btn-orange btn-lg" onclick="showGameComplete()">👑 Claim Victory</button>`;
  } else {
    acts.innerHTML = `<p class="lc-next-hint" style="width:100%;font-family:var(--fm);font-size:.68rem;color:var(--text-dim);margin-bottom:10px;line-height:1.45">Your progress is saved. Forge when you are ready, or head to the Hub for the big picture.</p>
      <button class="btn btn-primary btn-lg" onclick="goNextLevel()">⚗ Forge next hybrid</button>
      <button class="btn btn-secondary btn-sm" type="button" onclick="showHub()">Hub — missions &amp; roster</button>`;
  }

  const autoHint = document.getElementById('lc-auto-hint');
  if (isFinalLevel) {
    if (autoHint) autoHint.textContent = '';
    clearLevelCompleteAutoNav();
  } else {
    if (autoHint) {
      autoHint.textContent =
        'You will return to the Hub automatically in a few seconds — or tap a button when you are ready.';
    }
    clearLevelCompleteAutoNav();
    levelCompleteAutoNavTimer = setTimeout(() => {
      levelCompleteAutoNavTimer = null;
      const lc = document.getElementById('screen-level-complete');
      if (lc && lc.classList.contains('active')) showHub();
    }, 9000);
  }

  showScreen('level-complete');
  console.log('[flow] level complete screen shown');
}

function buildMiniStats(a) {
  const bars = [['spd','sf-spd','SPD'],['agi','sf-agi','AGI'],['int','sf-int','INT'],['str','sf-str','STR']];
  return `<div style="margin-top:8px">${bars.map(([s,cls,lbl]) =>
    `<div class="stat-row"><div class="stat-lbl">${lbl}</div>
    <div class="stat-track"><div class="stat-fill ${cls}" style="width:${Math.min((a[s]/STAT_MAX)*100,100)}%"></div></div>
    <div class="stat-val">${a[s]}</div></div>`).join('')}</div>`;
}

function goNextLevel() {
  clearLevelCompleteAutoNav();
  clearDefeatAutoReturn();
  state.battle = null;
  state.playerHybrid = null;
  state.selectedAnimals = [];
  void persistGameProgress();
  showScreen('builder');
}
function retryLevel() {
  clearLevelCompleteAutoNav();
  clearDefeatAutoReturn();
  state.battle = null;
  state.playerHybrid = null;
  state.selectedAnimals = [];
  void persistGameProgress();
  showScreen('builder');
}

// ═══════════════════════════════════════════════════════════════════
// GAME COMPLETE
// ═══════════════════════════════════════════════════════════════════

function showGameComplete() {
  clearLevelCompleteAutoNav();
  clearDefeatAutoReturn();
  const p = state.progress;
  p.level = 11;
  void saveUserProgress(p);
  const totalPlayable = BASE_IDS.length + APEX_IDS.length + DINO_IDS.length;
  const unlockedPlayable = countBaseUnlocked(p) + countApexUnlocked(p) + countDinoUnlocked(p);
  const quizCount = p.quizUnlocked.length;
  const sb = document.getElementById('gc-stats-box');
  const brain = computeQuizAccuracy(p);
  const brainTxt =
    brain != null ? `${brain}% fun-fact power` : 'Keep playing quizzes to grow your brain score!';
  sb.innerHTML = `<h3>Final Record</h3>
    <div class="gc-stat-row"><span>Total Victories</span><strong>${p.totalWins}</strong></div>
    <div class="gc-stat-row"><span>Total Defeats</span><strong>${p.totalLosses}</strong></div>
    <div class="gc-stat-row"><span>Win Rate</span><strong>${p.totalWins+p.totalLosses>0?Math.round(p.totalWins/(p.totalWins+p.totalLosses)*100):0}%</strong></div>
    <div class="gc-stat-row"><span>Animals Unlocked</span><strong>${unlockedPlayable} / ${totalPlayable}</strong></div>
    <div class="gc-stat-row"><span>Quiz Challenges Passed</span><strong>${quizCount}</strong></div>
    <div class="gc-stat-row"><span>Brain score (quizzes)</span><strong>${brainTxt}</strong></div>`;
  showScreen('game-complete');
}

function newGame() {
  clearLevelCompleteAutoNav();
  clearDefeatAutoReturn();
  const fresh = defaultProgress();
  state.progress = fresh;
  void saveUserProgress(fresh);
  state.playerHybrid = null;
  state.selectedAnimals = [];
  showScreen('hub');
}

// ═══════════════════════════════════════════════════════════════════
// BOOT
// ═══════════════════════════════════════════════════════════════════

document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && document.getElementById('screen-auth').classList.contains('active')) {
    handleAuth();
  }
  if (e.key === 'Enter' && e.target && e.target.id === 'hybrid-name-input') {
    e.preventDefault();
    applyHybridDisplayName();
  }
});

onAuthStateChanged(auth, async user => {
  if (!user) {
    clearDefeatAutoReturn();
    clearLevelCompleteAutoNav();
    state.profile = null;
    state.progress = null;
    state.playerHybrid = null;
    state.selectedAnimals = [];
    showScreen('landing');
    return;
  }
  const ref = userDocRef(user.uid);
  let snap = await getDoc(ref);
  let data = snap.data();
  if (!data) {
    const email = user.email || '';
    const derivedName = email.split('@')[0] || 'Commander';
    console.log('[auth] first-login profile creation', user.uid);
    await setDoc(
      ref,
      {
        uid: user.uid,
        username: derivedName,
        email,
        currentLevel: 1,
        highestLevelReached: 0,
        unlockedAnimals: [...STARTER_BASE_IDS],
        unlockedApex: [],
        unlockedDinosaurs: [],
        selectedHybridAnimals: [],
        hybridStats: null,
        totalWins: 0,
        totalLosses: 0,
        streakCount: 0,
        lastPlayedDate: null,
        leaderboardOptIn: true,
        progressSchemaVersion: 1,
        stageAccess: { base: true, apex: true, dinosaur: true },
        coins: 0,
        unlockTokens: 0,
        dailyChallengeDayKey: null,
        dailyWinsToday: 0,
        dailyChallengeRewardClaimed: false,
        totalQuizQuestions: 0,
        totalQuizCorrect: 0,
        commanderXp: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    await writeLeaderboardBootstrapDoc(user.uid, derivedName);
    snap = await getDoc(ref);
    data = snap.data();
  }
  state.profile = {
    uid: user.uid,
    email: user.email || data.email || '',
    username: data.username || 'Commander',
    // Default true for legacy accounts without the field; future Settings can set false.
    leaderboardOptIn: data.leaderboardOptIn !== false,
  };
  state.progress = firestoreDataToProgress(data);
  state.selectedAnimals = [...(data.selectedHybridAnimals || [])];
  state.playerHybrid = hybridFromSaved(data.hybridStats);
  await syncLeaderboardEntry(state.progress);
  console.log('[auth] session ready — leaderboard sync attempted', user.uid);
  showScreen('hub');
});

Object.assign(window, {
  showScreen,
  switchTab,
  handleAuth,
  logout,
  showBuilder,
  showHub,
  showLeaderboard,
  forgeHybrid,
  startBattle,
  beginBattle,
  exitQuiz,
  goNextLevel,
  retryLevel,
  newGame,
  startQuizQuestions,
  answerQuestion,
  nextQuizQuestion,
  returnFromQuiz,
  returnFromQuizHub,
  openQuiz,
  showGameComplete,
  answerPreBattleQuestion,
  advancePreBattleQuiz,
  confirmPreBattleAndStartFight,
  applyHybridDisplayName,
  hubSpendCoinTune,
  hubSpendTokenRecruit,
});