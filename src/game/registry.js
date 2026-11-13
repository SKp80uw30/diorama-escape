/**
 * Every diorama in the world, in unlock order. Adding a level is one import and
 * one line here. An entry without `build` shows as "coming soon".
 *
 * Level contract (see levels/tennis/level.js):
 *   { id, title, hint, slab:{hx,hz}, tall, puzzle, build(ctx) -> { update?, fx? } }
 */
import tennis from '../levels/tennis/level.js';

export const LEVELS = [
  tennis,
  { id: 'museum', title: 'The Ancient Museum' },
  { id: 'jungle', title: 'The Jungle Temple' },
];

export const levelById = (id) => LEVELS.find((l) => l.id === id);
export const nextOf = (id) => LEVELS[LEVELS.findIndex((l) => l.id === id) + 1];
