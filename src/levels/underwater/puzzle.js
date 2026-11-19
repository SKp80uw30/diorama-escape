/**
 * Underwater City: drop the anchor on the giant clam, put its pearl in the
 * beacon to power the city, and put the airlock wheel (lying in the sand) back
 * on the hatch. With power and the wheel, the airlock opens.
 */
export default {
  items: {
    anchor: { count: 1 },
    pearl: { count: 1, requires: 'clamOpen' },
    wheel: { count: 1 },
  },
  rules: [
    { on: 'enter', zone: 'clam', tag: 'anchor', when: { not: 'clamOpen' },
      do: [['set', 'clamOpen'], ['fx', 'openClam'], ['say', 'Clunk! The giant clam snaps open and a pearl floats out.']] },
    { on: 'enter', zone: 'beacon', tag: 'pearl',
      do: [['fx', 'consume'], ['set', 'power'], ['fx', 'powerOn'], ['say', 'The beacon blazes. Lights flicker on all over the city.']] },
    { on: 'enter', zone: 'hatch', tag: 'wheel',
      do: [['fx', 'consume'], ['set', 'wheelOn'], ['fx', 'fitWheel'], ['say', 'The wheel clicks onto the hatch. It needs power to turn.']] },
    { when: { flag: ['power', 'wheelOn'] }, do: [['fx', 'openHatch'], ['say', 'The wheel spins and the airlock swings open.'], ['win']] },
  ],
};
