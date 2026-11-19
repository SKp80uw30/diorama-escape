import puzzle from './puzzle.js';
import { build } from './scene.js';

export default {
  id: 'clouds',
  title: 'Cloud Castles',
  hint: 'The castle gate is shut. Three coloured pedestals stand empty before it.',
  slab: { hx: 7.8, hz: 5.4 },
  tall: 5.6,
  depth: 2.0,
  physics: { gravity: -11, damping: 0.08 }, // light, floaty air
  winDelay: 2.2,
  puzzle,
  build,
};
