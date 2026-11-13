/**
 * The Jungle Temple: two jade eyes, two ways to free them.
 *   torch -> campfire lights it -> the lit torch burns the vines -> first eye
 *   carved stone -> pressure plate -> the cage drops -> second eye
 * Both eyes on the altar and the stone face opens its mouth.
 * The scene retags the torch from 'torch' to 'flame' when it is lit.
 */
export default {
  items: {
    torch: { count: 1 },
    flame: { count: 1, requires: 'lit' },
    stone: { count: 1 },
    eye1: { count: 1, requires: 'burnt' },
    eye2: { count: 1, requires: 'cageOpen' },
  },
  rules: [
    { on: 'enter', zone: 'campfire', tag: 'torch', do: [['set', 'lit'], ['fx', 'ignite'], ['fx', 'hint', 'The torch is burning. Vines do not like fire.']] },
    { on: 'enter', zone: 'vines', tag: 'flame', when: { flag: 'lit' }, do: [['fx', 'consume'], ['set', 'burnt'], ['fx', 'burn']] },
    { on: 'enter', zone: 'plate', tag: 'stone', when: { not: 'cageOpen' }, do: [['set', 'cageOpen'], ['fx', 'press']] },
    { on: 'enter', zone: 'altar', tag: 'eye1', do: [['fx', 'consume'], ['inc', 'eyes'], ['fx', 'eye']] },
    { on: 'enter', zone: 'altar', tag: 'eye2', do: [['fx', 'consume'], ['inc', 'eyes'], ['fx', 'eye']] },
    { when: { gte: ['eyes', 2] }, do: [['set', 'mouthOpen'], ['fx', 'openMouth'], ['win']] },
  ],
};
