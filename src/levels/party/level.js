import puzzle from './puzzle.js';
import { build } from './scene.js';

export default {
  id: 'party',
  title: 'The Birthday Party',
  hint: 'The cake has no candles. Something rattles inside the balloons.',
  slab: { hx: 7, hz: 5.2 },
  tall: 4.2,
  puzzle,
  build,
};
