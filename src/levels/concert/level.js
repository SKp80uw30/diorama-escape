import puzzle from './puzzle.js';
import { build } from './scene.js';

export default {
  id: 'concert',
  title: 'The Concert',
  hint: 'Five fans, five lost tickets. Each fan wants the ticket in their own colour.',
  slab: { hx: 8.5, hz: 6 },
  tall: 3.9,
  puzzle,
  build,
};
