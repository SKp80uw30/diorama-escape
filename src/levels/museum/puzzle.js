/**
 * The Ancient Museum: each relic belongs on its own plinth. Two relics unlock
 * the display case, the scarab from the case opens the sarcophagus, and the
 * sun disc from the sarcophagus opens the door.
 */
export default {
  items: {
    vase: { count: 1 },
    idol: { count: 1 },
    scarab: { count: 1, requires: 'caseOpen' },
    disc: { count: 1, requires: 'tombOpen' },
  },
  rules: [
    { on: 'enter', zone: 'plinthVase', tag: 'vase', do: [['fx', 'consume'], ['fx', 'place', 'vase'], ['inc', 'relics']] },
    { on: 'enter', zone: 'plinthIdol', tag: 'idol', do: [['fx', 'consume'], ['fx', 'place', 'idol'], ['inc', 'relics']] },
    { when: { gte: ['relics', 2] }, do: [['set', 'caseOpen'], ['fx', 'openCase'], ['fx', 'hint', 'The display case slides open.']] },
    { on: 'enter', zone: 'plinthScarab', tag: 'scarab', when: { flag: 'caseOpen' },
      do: [['fx', 'consume'], ['fx', 'place', 'scarab'], ['set', 'tombOpen'], ['fx', 'openTomb'], ['fx', 'hint', 'The sarcophagus stirs.']] },
    { on: 'enter', zone: 'door', tag: 'disc', when: { flag: 'tombOpen' }, do: [['fx', 'consume'], ['set', 'doorOpen'], ['fx', 'openDoor'], ['win']] },
  ],
};
