/**
 * "Truth vs Lie" quiz questions for mid-round clashes.
 * Each stat category has a pool of {truth, lie} pairs.
 * During battle a random pair is chosen and the two options
 * are shuffled so the player must identify which is TRUE.
 */

export const CLASH_QUESTIONS = {
  spd: [
    { truth: 'Peregrine falcons can dive at over 240 mph', lie: 'Eagles are faster than peregrine falcons in a dive' },
    { truth: 'Cheetahs accelerate faster than most sports cars', lie: 'Lions are the fastest big cats on land' },
    { truth: 'Sailfish can swim at nearly 70 mph', lie: 'Great white sharks are the fastest fish in the ocean' },
    { truth: 'A cockroach can sprint about 50 body lengths per second', lie: 'Snails can outrun beetles in short sprints' },
    { truth: 'Hummingbirds can fly backwards', lie: 'All birds can hover in place like helicopters' },
    { truth: 'Black mambas can slither at 12 mph — the fastest snake', lie: 'King cobras are the fastest snakes in the world' },
    { truth: 'Pronghorn antelope can sustain 55 mph for miles', lie: 'Deer are faster than antelope over long distances' },
    { truth: 'Dragonflies can reach 35 mph in flight', lie: 'Butterflies are faster fliers than dragonflies' },
  ],
  agi: [
    { truth: 'Cats can twist mid-air to always land on their feet', lie: 'Dogs are more agile than cats in tight spaces' },
    { truth: 'Squirrels can change direction mid-jump', lie: 'Rabbits are more agile than squirrels in trees' },
    { truth: 'Geckos can run upside down on smooth ceilings', lie: 'Frogs have stickier feet than geckos' },
    { truth: 'Mountain goats can climb near-vertical cliff faces', lie: 'Horses are better climbers than mountain goats' },
    { truth: 'Octopuses can squeeze through any gap wider than their beak', lie: 'Jellyfish are more flexible than octopuses' },
    { truth: 'Foxes can pinpoint mice under snow by sound alone', lie: 'Wolves have more precise hearing than foxes' },
    { truth: 'Flying fish can glide over 200 metres through the air', lie: 'Tuna can jump higher out of water than flying fish' },
    { truth: 'Snow leopards can leap 15 metres in a single bound', lie: 'Tigers can jump further than snow leopards' },
  ],
  int: [
    { truth: 'Dolphins can recognise themselves in mirrors', lie: 'Goldfish only have a three-second memory' },
    { truth: 'Crows can use tools to solve multi-step problems', lie: 'Parrots only repeat sounds without understanding them' },
    { truth: 'Octopuses can open screw-top jars from the inside', lie: 'Fish cannot remember anything longer than a few seconds' },
    { truth: 'Elephants mourn their dead and revisit burial sites', lie: 'Only humans and apes can feel grief' },
    { truth: 'Rats can learn to play hide-and-seek and enjoy it', lie: 'Rats are too simple to learn any games' },
    { truth: 'Bees communicate flower locations through waggle dances', lie: 'Ants communicate only by direct touch' },
    { truth: 'Chimps can outperform humans in short-term memory tests', lie: 'Human memory is always better than any animal\'s' },
    { truth: 'Ravens can plan for the future and barter with tools', lie: 'Birds cannot plan ahead at all' },
  ],
  str: [
    { truth: 'Gorillas can lift 10 times their own body weight', lie: 'Elephants are stronger than gorillas pound for pound' },
    { truth: 'Dung beetles can pull 1,141 times their own weight', lie: 'Ants are the strongest insects relative to size' },
    { truth: 'Anacondas can squeeze with over 90 PSI of pressure', lie: 'Pythons have a stronger squeeze than anacondas' },
    { truth: 'A grizzly bear can bend a steel bar with its paws', lie: 'Black bears are physically stronger than grizzlies' },
    { truth: 'Leafcutter ants carry pieces 50 times their body weight', lie: 'Beetles carry more weight than any ant species' },
    { truth: 'Eagles can carry prey 4 times their own body weight', lie: 'Owls can carry heavier prey than eagles' },
    { truth: 'Saltwater crocodiles have the strongest bite ever measured', lie: 'Great white sharks bite harder than any crocodile' },
    { truth: 'Hippos can bite clean through a small wooden boat', lie: 'Rhinos have a stronger bite force than hippos' },
  ],
};

export function getClashQuestion(stat) {
  const pool = CLASH_QUESTIONS[stat];
  if (!pool?.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}
