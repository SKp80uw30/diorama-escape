/**
 * Plays a level from its own puzzle solution, without a pointer: every
 * "carry X to zone Y" move teleports a real item into the real trigger zone and
 * steps the physics, every tap move fires the tap. It proves the scene matches
 * the rules: every zone, switch, item and effect the solution needs exists, and
 * the win is reached. Used by the Node tests and the browser QA.
 */
import { solve } from './puzzle.js';

export function autoplay(s, { maxWait = 12 } = {}) {
  const id = s.level.id;
  const path = solve(s.level.puzzle);
  if (!path) throw new Error(`${id}: the puzzle has no solution`);
  const dt = 1 / 60;
  const run = (sec) => { for (let i = 0; i < Math.round(sec / dt); i++) s.tick(dt); };
  const log = [];
  for (const move of path) {
    const before = JSON.stringify(s.state);
    let label;
    if (move.tap) {
      label = `tap ${move.tap}`;
      if (!s.kit.taps.some((t) => t.id === move.tap)) throw new Error(`${id}: nothing tappable is called "${move.tap}"`);
      s.emit({ type: 'tap', target: move.tap });
      run(0.6);
    } else {
      label = `${move.tag} -> ${move.zone}`;
      const zone = s.physics.zones.find((z) => z.id === move.zone);
      if (!zone) throw new Error(`${id}: no trigger zone called "${move.zone}"`);
      let item = null;
      for (let waited = 0; waited <= maxWait && !item; waited += 0.25) {
        item = s.physics.items.find((i) => i.alive && i.grabbable && i.tag === move.tag && !zone.inside.has(i));
        if (!item) run(0.25);
      }
      if (!item) throw new Error(`${id}: no "${move.tag}" item ever appeared to carry to ${move.zone}`);
      const b = item.body;
      b.position.set((zone.min[0] + zone.max[0]) / 2, (zone.min[1] + zone.max[1]) / 2, (zone.min[2] + zone.max[2]) / 2);
      b.velocity.setZero();
      b.angularVelocity.setZero();
      b.wakeUp();
      run(1.5);
    }
    if (JSON.stringify(s.state) === before) throw new Error(`${id}: "${label}" had no effect`);
    log.push(label);
  }
  run(5);
  return { path, log, won: s.state.won };
}
