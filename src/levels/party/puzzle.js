/**
 * The Birthday Party: balloons float. Each one hides a candle; pop a balloon on
 * the cactus and its candle drops out. Three candles on the cake light up, the
 * big present opens, and the key inside opens the door.
 */
export default {
  items: {
    balloon: { count: 3 },
    candle: { count: 3, requires: 'popped' },
    key: { count: 1, requires: 'lit' },
  },
  rules: [
    { on: 'enter', zone: 'pin', tag: 'balloon', do: [['fx', 'pop'], ['fx', 'consume'], ['set', 'popped'], ['inc', 'pops']] },
    { on: 'enter', zone: 'cake', tag: 'candle', do: [['fx', 'consume'], ['inc', 'candles'], ['fx', 'candle']] },
    { when: { gte: ['candles', 3] }, do: [['set', 'lit'], ['fx', 'party'], ['fx', 'hint', 'Make a wish. The big present just opened.']] },
    { on: 'enter', zone: 'door', tag: 'key', when: { flag: 'lit' }, do: [['fx', 'consume'], ['set', 'doorOpen'], ['fx', 'openDoor'], ['win']] },
  ],
};
