/**
 * Hot Air Balloons: carry the three sandbags to the ballast pile, put the gas
 * canister (behind the shed) in the basket, and once the balloon has inflated,
 * pull up the tether stake and stow it in the basket to cast off.
 */
export default {
  items: {
    sandbag: { count: 3 },
    gas: { count: 1 },
    stake: { count: 1, requires: 'ready' },
  },
  rules: [
    { on: 'enter', zone: 'pile', tag: 'sandbag', do: [['fx', 'consume'], ['inc', 'bags'], ['fx', 'stack']] },
    { on: 'enter', zone: 'basket', tag: 'gas', do: [['fx', 'consume'], ['set', 'gas'], ['fx', 'fuel'], ['say', 'Gas connected. The burner hisses into life.']] },
    { when: { flag: 'gas', gte: ['bags', 3] },
      do: [['set', 'ready'], ['fx', 'inflate'], ['say', 'WHOOSH! The balloon fills with hot air and tugs at its tether. Pull up the stake!']] },
    { on: 'enter', zone: 'basket', tag: 'stake', when: { flag: 'ready' }, do: [['fx', 'consume'], ['fx', 'liftoff'], ['win']] },
  ],
};
