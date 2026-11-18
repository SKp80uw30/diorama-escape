/**
 * The Skyscraper: open the filing cabinet for paper, find the ink cartridge
 * behind the air-conditioning unit, load both into the printer, take the keycard
 * it prints to the card reader, then press the launch button for the fireworks.
 */
export default {
  items: {
    paper: { count: 1, requires: 'drawer' },
    ink: { count: 1 },
    keycard: { count: 1, requires: 'printed' },
  },
  rules: [
    { on: 'tap', target: 'drawer', when: { not: 'drawer' },
      do: [['set', 'drawer'], ['fx', 'openDrawer'], ['say', 'The drawer slides open. A ream of printer paper!']] },
    { on: 'enter', zone: 'printer', tag: 'paper', do: [['fx', 'consume'], ['set', 'paper'], ['fx', 'loadPaper'], ['say', 'Paper loaded. The ink light is still red.']] },
    { on: 'enter', zone: 'printer', tag: 'ink', do: [['fx', 'consume'], ['set', 'ink'], ['fx', 'loadInk'], ['say', 'Ink cartridge clicks in. The paper light is still red.']] },
    { when: { flag: ['paper', 'ink'] }, do: [['set', 'printed'], ['fx', 'print'], ['say', 'The printer whirs and spits out a keycard.']] },
    { on: 'enter', zone: 'reader', tag: 'keycard',
      do: [['fx', 'consume'], ['set', 'cage'], ['fx', 'openCage'], ['say', 'Beep. The cage around the launch console swings open.']] },
    { on: 'tap', target: 'button', when: { flag: 'cage', not: 'launched' }, do: [['set', 'launched'], ['fx', 'launch'], ['win']] },
    { on: 'tap', target: 'button', when: { not: 'cage' }, do: [['say', 'The launch console is locked in a cage. There is a card reader beside it.']] },
  ],
};
