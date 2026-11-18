import puzzle from './puzzle.js';
import { build } from './scene.js';

export default {
  id: 'skyscraper',
  title: 'The Skyscraper',
  hint: 'Stranded on the roof at dusk. Fireworks would get someone\'s attention, but the console is caged.',
  slab: { hx: 7.6, hz: 5.0 },
  tall: 6.2,
  depth: 2.6,
  winDelay: 4.5,
  puzzle,
  build,
};
