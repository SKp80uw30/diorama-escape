/**
 * The Pirate Ship: the cannon needs two different things, a ball and powder.
 * Its shot smashes the barrel on the islet and the key flies back on deck.
 * The key opens the chest, the chest holds the ship's wheel, the wheel on the
 * helm sets sail.
 */
export default {
  items: {
    ball: { count: 1 },
    keg: { count: 1 },
    key: { count: 1, requires: 'fired' },
    wheel: { count: 1, requires: 'chestOpen' },
  },
  rules: [
    { on: 'enter', zone: 'cannon', tag: 'ball', do: [['fx', 'consume'], ['inc', 'loaded'], ['fx', 'load', 'ball'], ['fx', 'hint', 'A cannonball is in. The cannon still needs powder.']] },
    { on: 'enter', zone: 'cannon', tag: 'keg', do: [['fx', 'consume'], ['inc', 'loaded'], ['fx', 'load', 'keg'], ['fx', 'hint', 'Powder is in. The cannon still needs a ball.']] },
    { when: { gte: ['loaded', 2] }, do: [['set', 'fired'], ['fx', 'fire'], ['fx', 'hint', 'The barrel is smashed. Its key flew back on deck.']] },
    { on: 'enter', zone: 'chest', tag: 'key', when: { flag: 'fired' }, do: [['fx', 'consume'], ['set', 'chestOpen'], ['fx', 'openChest'], ['fx', 'hint', 'A wheel for the helm.']] },
    { on: 'enter', zone: 'helm', tag: 'wheel', when: { flag: 'chestOpen' }, do: [['fx', 'consume'], ['set', 'sailing'], ['fx', 'sail'], ['win']] },
  ],
};
