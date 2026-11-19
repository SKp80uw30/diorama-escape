import puzzle from './puzzle.js';
import { build } from './scene.js';

export default {
  id: 'dino',
  title: 'Dinosaur Valley',
  hint: 'A T-rex is dozing in front of the cave. The nest is empty.',
  slab: { hx: 8.5, hz: 6 },
  tall: 5.6,
  puzzle,
  build,
};
