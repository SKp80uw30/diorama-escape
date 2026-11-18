import puzzle from './puzzle.js';
import { build } from './scene.js';

export default {
  id: 'underwater',
  title: 'Underwater City',
  hint: 'The airlock is sealed and the sunken city is dark.',
  slab: { hx: 8.2, hz: 5.4 },
  tall: 4.4,
  depth: 0.6,
  physics: { gravity: -7, damping: 0.55 }, // everything sinks slowly
  puzzle,
  build,
};
