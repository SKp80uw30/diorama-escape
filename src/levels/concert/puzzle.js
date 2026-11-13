/**
 * The Concert: five fans, five colour-coded tickets. A fan only takes the ticket
 * in their own colour, then goes inside to dance. All five inside wins.
 *   red     in plain sight
 *   yellow  behind the ticket booth
 *   violet  under the traffic cone (the scene frees it once the cone is moved)
 *   blue    in the dark under the street lamp: fit the bulb
 *   green   on the dark stage: plug in the power
 */
export const COLORS = ['red', 'blue', 'yellow', 'violet', 'green'];   // queue order, nearest the door first

export default {
  items: {
    bulb: { count: 1 },
    plug: { count: 1 },
    'ticket-red': { count: 1 },
    'ticket-yellow': { count: 1 },
    'ticket-violet': { count: 1 },
    'ticket-blue': { count: 1, requires: 'lampOn' },
    'ticket-green': { count: 1, requires: 'powerOn' },
  },
  rules: [
    { on: 'enter', zone: 'lamp', tag: 'bulb', do: [['fx', 'consume'], ['set', 'lampOn'], ['fx', 'lampOn'], ['fx', 'hint', 'The street lamp is on. Something was lying in the dark.']] },
    { on: 'enter', zone: 'socket', tag: 'plug', do: [['fx', 'consume'], ['set', 'powerOn'], ['fx', 'powerOn'], ['fx', 'hint', 'The stage lights are up. Something is on the stage.']] },
    ...COLORS.map((c) => ({ on: 'enter', zone: `fan-${c}`, tag: `ticket-${c}`, do: [['fx', 'consume'], ['inc', 'inside'], ['fx', 'admit', c]] })),
    { when: { gte: ['inside', 5] }, do: [['set', 'fullHouse'], ['fx', 'finale'], ['win']] },
  ],
};
