/**
 * Dinosaur Valley: creatures go where the food is.
 *   leaves at the tall tree -> the long-neck walks over, uncovering the third egg
 *   three eggs in the nest  -> the pterodactyl flies down to them and drops her bone
 *   the bone on the flat rock -> the T-rex leaves the cave mouth to eat it
 */
export default {
  items: {
    fern: { count: 1 },
    egg: { count: 2 },
    egg3: { count: 1, requires: 'lured' },
    bone: { count: 1, requires: 'swooped' },
  },
  rules: [
    { on: 'enter', zone: 'tree', tag: 'fern', do: [['fx', 'consume'], ['set', 'lured'], ['fx', 'lure'], ['fx', 'hint', 'The long-neck wanders off to eat. It was standing over something.']] },
    { on: 'enter', zone: 'nest', tag: 'egg', do: [['fx', 'consume'], ['inc', 'eggs'], ['fx', 'egg']] },
    { on: 'enter', zone: 'nest', tag: 'egg3', when: { flag: 'lured' }, do: [['fx', 'consume'], ['inc', 'eggs'], ['fx', 'egg']] },
    { when: { gte: ['eggs', 3] }, do: [['set', 'swooped'], ['fx', 'swoop'], ['fx', 'hint', 'The pterodactyl dropped her bone. Someone is hungry.']] },
    { on: 'enter', zone: 'rexRock', tag: 'bone', when: { flag: 'swooped' }, do: [['fx', 'consume'], ['set', 'fed'], ['fx', 'feed'], ['win']] },
  ],
};
