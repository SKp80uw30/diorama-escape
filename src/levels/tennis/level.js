import puzzle from './puzzle.js';
import { build } from './scene.js';

export default {
  id: 'tennis',
  title: 'Centre Court',
  hint: 'The gate is locked. The ball machine is empty.',
  slab: { hx: 8.6, hz: 5.6 },
  tall: 4.8,
  puzzle,
  build,
};
