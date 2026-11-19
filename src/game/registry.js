/**
 * Every diorama in the world, in unlock order. Adding a level is one import and
 * one line here. An entry without `build` shows as "coming soon".
 *
 * Level contract (see any levels/<id>/level.js):
 *   { id, title, hint, slab:{hx,hz}, tall, depth?, fit?:[[x,y,z]], physics?:{gravity,damping},
 *     winDelay?, puzzle, build(ctx) -> { update?(dt,t,state), fx? } }
 */
import tennis from '../levels/tennis/level.js';
import underwater from '../levels/underwater/level.js';
import clouds from '../levels/clouds/level.js';
import skyscraper from '../levels/skyscraper/level.js';
import balloons from '../levels/balloons/level.js';

export const LEVELS = [
  tennis,
  underwater,
  clouds,
  skyscraper,
  balloons,
  { id: 'museum', title: 'The Ancient Museum' },
  { id: 'jungle', title: 'The Jungle Temple' },
];

/**
 * While true, every built level can be picked from the Worlds menu without
 * finishing the ones before it. Set to false to bring back unlock-by-escaping.
 */
export const ALL_LEVELS_OPEN = true;

/** Can this level be played right now? */
export const isOpen = (level, progress) => !!level?.build && (ALL_LEVELS_OPEN || progress.unlocked.includes(level.id));

export const levelById = (id) => LEVELS.find((l) => l.id === id);
export const nextOf = (id) => LEVELS[LEVELS.findIndex((l) => l.id === id) + 1];
