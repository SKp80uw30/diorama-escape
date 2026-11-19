import puzzle from './puzzle.js';
import { build } from './scene.js';

export default {
  id: 'jungle',
  title: 'The Jungle Temple',
  hint: 'The stone face is blind. Its eyes are close, but out of reach.',
  slab: { hx: 8, hz: 6 },
  tall: 4.4,
  puzzle,
  build,
};
