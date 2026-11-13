/**
 * Every diorama in the world, in unlock order. Adding a level is one import and
 * one line here. An entry without `build` shows as "coming soon".
 *
 * Level contract (see levels/tennis/level.js):
 *   { id, title, hint, slab:{hx,hz}, tall, puzzle, build(ctx) -> { update?, fx? } }
 * fx handlers get (payload, state, event); the built-in fx are 'consume' and 'hint'.
 */
import tennis from '../levels/tennis/level.js';
import museum from '../levels/museum/level.js';
import jungle from '../levels/jungle/level.js';
import pirate from '../levels/pirate/level.js';
import party from '../levels/party/level.js';
import dino from '../levels/dino/level.js';
import concert from '../levels/concert/level.js';

export const LEVELS = [
  tennis,
  museum,
  jungle,
  pirate,
  party,
  dino,
  concert,
];

export const levelById = (id) => LEVELS.find((l) => l.id === id);
export const nextOf = (id) => LEVELS[LEVELS.findIndex((l) => l.id === id) + 1];
