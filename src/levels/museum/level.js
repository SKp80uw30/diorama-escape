import puzzle from './puzzle.js';
import { build } from './scene.js';

export default {
  id: 'museum',
  title: 'The Ancient Museum',
  hint: 'The door is missing its sun. Three plinths stand empty.',
  slab: { hx: 7.5, hz: 5.5 },
  tall: 3.9,
  puzzle,
  build,
};
