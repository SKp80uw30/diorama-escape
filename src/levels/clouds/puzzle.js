/**
 * Cloud Castles: ring the bell with a pebble to wake the sleepy cloud hiding the
 * blue crystal, then set the red, yellow and blue crystals on their matching
 * pedestals. A rainbow opens the castle gate.
 */
export default {
  items: {
    pebble: { count: 1 },
    red: { count: 1 },
    yellow: { count: 1 },
    blue: { count: 1, requires: 'bell' },
  },
  rules: [
    { on: 'enter', zone: 'bell', tag: 'pebble', when: { not: 'bell' },
      do: [['set', 'bell'], ['fx', 'ring'], ['say', 'DONG! The sleepy cloud wakes with a start and drifts away.']] },
    { on: 'enter', zone: 'pedRed', tag: 'red', do: [['fx', 'consume'], ['set', 'red'], ['fx', 'place', 'red']] },
    { on: 'enter', zone: 'pedYellow', tag: 'yellow', do: [['fx', 'consume'], ['set', 'yellow'], ['fx', 'place', 'yellow']] },
    { on: 'enter', zone: 'pedBlue', tag: 'blue', do: [['fx', 'consume'], ['set', 'blue'], ['fx', 'place', 'blue']] },
    { when: { flag: ['red', 'yellow', 'blue'] },
      do: [['fx', 'rainbow'], ['say', 'A rainbow arcs over the castle and the gate rises.'], ['win']] },
  ],
};
