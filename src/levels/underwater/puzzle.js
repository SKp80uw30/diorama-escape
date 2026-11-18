/**
 * Underwater City: drop the anchor on the giant clam, put its pearl in the
 * beacon to power the city, then turn the airlock wheel.
 */
export default {
  items: {
    anchor: { count: 1 },
    pearl: { count: 1, requires: 'clamOpen' },
  },
  rules: [
    { on: 'enter', zone: 'clam', tag: 'anchor', when: { not: 'clamOpen' },
      do: [['set', 'clamOpen'], ['fx', 'openClam'], ['say', 'Clunk! The giant clam snaps open and a pearl floats out.']] },
    { on: 'enter', zone: 'beacon', tag: 'pearl',
      do: [['fx', 'consume'], ['set', 'power'], ['fx', 'powerOn'], ['say', 'The beacon blazes. Lights flicker on all over the city.']] },
    { on: 'tap', target: 'wheel', when: { flag: 'power', not: 'open' }, do: [['set', 'open'], ['fx', 'openHatch'], ['win']] },
    { on: 'tap', target: 'wheel', when: { not: 'power' }, do: [['say', "The airlock wheel won't budge. The city has no power."]] },
  ],
};
