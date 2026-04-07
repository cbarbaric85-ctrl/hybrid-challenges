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
};

export const LEVELS = [
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
