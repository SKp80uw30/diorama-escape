/** Centre Court: load three balls, the machine knocks the key down, the key opens the gate. */
export default {
  items: {
    ball: { count: 3 },
    key: { count: 1, requires: 'fired' },
  },
  rules: [
    { on: 'enter', zone: 'hopper', tag: 'ball', do: [['fx', 'consume'], ['inc', 'balls'], ['fx', 'loaded']] },
    { when: { gte: ['balls', 3] }, do: [['set', 'fired'], ['fx', 'fire']] },
    { on: 'enter', zone: 'lock', tag: 'key', when: { flag: 'fired' }, do: [['fx', 'consume'], ['set', 'gateOpen'], ['fx', 'openGate'], ['win']] },
  ],
};
