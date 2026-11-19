import puzzle from './puzzle.js';
import { build } from './scene.js';

export default {
  id: 'pirate',
  title: 'The Pirate Ship',
  hint: 'The helm has no wheel, the chest is locked, and the key is out on the islet.',
  slab: { hx: 8.5, hz: 5.5 },
  tall: 6.4,
  puzzle,
  build,
};
