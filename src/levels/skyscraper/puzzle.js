/**
 * The Skyscraper: find the paper (behind the filing cabinet) and the ink
 * cartridge (behind the air-conditioning unit), load both into the printer,
 * take the keycard it prints to the card reader to open the cage, then carry
 * the rocket from the cage to the fireworks launcher.
 */
export default {
  items: {
    paper: { count: 1 },
    ink: { count: 1 },
    keycard: { count: 1, requires: 'printed' },
    rocket: { count: 1, requires: 'cage' },
  },
  rules: [
    { on: 'enter', zone: 'printer', tag: 'paper', do: [['fx', 'consume'], ['set', 'paper'], ['fx', 'loadPaper'], ['say', 'Paper loaded. The ink light is still red.']] },
    { on: 'enter', zone: 'printer', tag: 'ink', do: [['fx', 'consume'], ['set', 'ink'], ['fx', 'loadInk'], ['say', 'Ink cartridge clicks in. The paper light is still red.']] },
    { when: { flag: ['paper', 'ink'] }, do: [['set', 'printed'], ['fx', 'print'], ['say', 'The printer whirs and spits out a keycard.']] },
    { on: 'enter', zone: 'reader', tag: 'keycard',
      do: [['fx', 'consume'], ['set', 'cage'], ['fx', 'openCage'], ['say', 'Beep. The cage swings open. There is a big firework rocket inside.']] },
    { on: 'enter', zone: 'launcher', tag: 'rocket', when: { flag: 'cage' }, do: [['fx', 'consume'], ['fx', 'launch'], ['win']] },
  ],
};
