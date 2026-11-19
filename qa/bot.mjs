// A robot that plays one level from its puzzle rules: it asks the solver for the
// winning list of moves, then makes each move with a real mouse drag, trying
// several camera angles until the item can be reached.
//   node build.mjs && node qa/bot.mjs <id>
// It proves the level can be finished by hand: every item spawns, can be reached
// from somewhere, and every zone accepts its drop. It does NOT prove a hiding
// place works (it will happily look from above) or that anything feels good.
// A step the rules do not describe (moving a cover off something, a view only a
// low angle allows) may need a custom step in qa/play.mjs instead.
import { mkdir } from 'node:fs/promises';
import { openLevel } from './lib.mjs';
import { solve } from '../src/game/puzzle.js';

const id = process.argv[2];
if (!id) { console.error('usage: node qa/bot.mjs <id>'); process.exit(1); }
const puzzle = (await import(`../src/levels/${id}/puzzle.js`)).default;
const moves = solve(puzzle);
if (!moves) { console.log(`FAIL  ${id}: the solver finds no way to win, so there is nothing to play`); process.exit(1); }
console.log(`${id}: ${moves.map((m) => `${m.tag}->${m.zone}`).join(', ')}`);

const VIEWS = [[45, 1.25], [45, 0.576], [0, 0.6], [-90, 0.7], [180, 0.7], [90, 0.7], [45, 0.12], [-45, 1.0]];
const L = await openLevel(id, { port: 5398 });
let failed = false;
try {
  await L.adv(1);
  for (const [n, move] of moves.entries()) {
    const before = JSON.stringify(await L.state());
    let done = false, seen = false;
    for (const [az, el] of VIEWS) {
      // things that pop out of chests and cages take a moment to arrive
      let found = [];
      for (let wait = 0; wait < 6 && !found.length; wait++) { found = await L.items(move.tag); if (!found.length) await L.adv(1); }
      if (!found.length) break;
      seen = true;
      await L.lookFrom(az, el);
      await L.carry(found[0].pos, await L.over(move.zone));
      if (JSON.stringify(await L.state()) !== before) { done = true; break; }
    }
    console.log(`${done ? 'PASS' : 'FAIL'}  step ${n + 1}: ${move.tag} -> ${move.zone}${done ? '' : seen ? '  (the item was there but the drop was never accepted)' : '  (no loose item with that tag ever appeared)'}`);
    if (!done) { failed = true; break; }
  }
  const won = (await L.state()).won;
  if (!failed) { console.log(`${won ? 'PASS' : 'FAIL'}  ${id}: ${won ? 'won' : 'all moves made but the level is not won'}`); failed = !won; }
  await L.adv(2);
  await mkdir('qa/shots', { recursive: true });
  await L.lookFrom(45, 0.576);
  await L.page.screenshot({ path: `qa/shots/bot-${id}.png` });
  if (L.errors.length) { console.log('ERRORS:\n  ' + L.errors.join('\n  ')); failed = true; }
} catch (e) { console.log('ERROR ' + e.message.split('\n')[0]); failed = true; } finally { await L.close(); }
process.exit(failed ? 1 : 0);
