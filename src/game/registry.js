/**
 * Every diorama in the world, in unlock order. Adding a level is one import and
 * one line here. An entry without `build` shows as "coming soon".
 *
 * Level contract (see any levels/<id>/level.js):
 *   { id, title, hint, slab:{hx,hz}, tall, depth?, fit?:[[x,y,z]], physics?:{gravity,damping},
 *     winDelay?, puzzle, build(ctx) -> { update?(dt,t,state), fx? } }
 * fx handlers get (payload, state, event); the built-in fx are 'consume' and 'hint'
 * (rules can also use ['say', text], which is the same as a hint).
 */
import tennis from '../levels/tennis/level.js';
import museum from '../levels/museum/level.js';
import jungle from '../levels/jungle/level.js';
import pirate from '../levels/pirate/level.js';
import party from '../levels/party/level.js';
import dino from '../levels/dino/level.js';
import concert from '../levels/concert/level.js';
import underwater from '../levels/underwater/level.js';
import clouds from '../levels/clouds/level.js';
import skyscraper from '../levels/skyscraper/level.js';
import balloons from '../levels/balloons/level.js';

export const LEVELS = [
  tennis,
  museum,
  jungle,
  pirate,
  party,
  dino,
  concert,
  underwater,
  clouds,
  skyscraper,
  balloons,
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
