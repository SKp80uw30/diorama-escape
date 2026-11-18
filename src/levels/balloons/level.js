import puzzle from './puzzle.js';
import { build, ENVELOPES } from './scene.js';

export default {
  id: 'balloons',
  title: 'Hot Air Balloons',
  hint: 'Your balloon lies flat in the meadow. The burner has no gas and the basket is ringed with sandbags.',
  slab: { hx: 8.4, hz: 5.6 },
  tall: 7.0,
  // keep the floating balloons inside the frame
  fit: ENVELOPES.map(({ pos, r }) => [pos[0], pos[1] + r * 1.3, pos[2]]),
  depth: 0.5,
  winDelay: 3.2,
  puzzle,
  build,
};
