/**
 * Hot Air Balloons: carry the three sandbags to the ballast pile, put the gas
 * canister (behind the shed) in the basket, and once the balloon has inflated,
 * untie the tether.
 */
export default {
  items: {
    sandbag: { count: 3 },
    gas: { count: 1 },
  },
  rules: [
    { on: 'enter', zone: 'pile', tag: 'sandbag', do: [['fx', 'consume'], ['inc', 'bags'], ['fx', 'stack']] },
    { on: 'enter', zone: 'basket', tag: 'gas', do: [['fx', 'consume'], ['set', 'gas'], ['fx', 'fuel'], ['say', 'Gas connected. The burner hisses into life.']] },
    { when: { flag: 'gas', gte: ['bags', 3] },
      do: [['set', 'ready'], ['fx', 'inflate'], ['say', 'WHOOSH! The balloon fills with hot air and tugs at its tether.']] },
    { on: 'tap', target: 'stake', when: { flag: 'ready', not: 'away' }, do: [['set', 'away'], ['fx', 'liftoff'], ['win']] },
    { on: 'tap', target: 'stake', when: { not: 'ready' },
      do: [['say', "Untying it now won't help: the balloon has no hot air and is still weighed down with ballast."]] },
  ],
};
