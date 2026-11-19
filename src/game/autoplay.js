/**
 * Plays a level from its own puzzle solution, without a pointer: every
 * "carry X to zone Y" move teleports a real item into the real trigger zone and
 * steps the physics. It proves the scene matches
 * the rules: every zone, switch, item and effect the solution needs exists, and
 * the win is reached. Used by the Node tests and the browser QA.
 */
import { solve, applyEvent } from './puzzle.js';

export function autoplay(s, { maxWait = 12 } = {}) {
  const id = s.level.id;
  const path = solve(s.level.puzzle);
  if (!path) throw new Error(`${id}: the puzzle has no solution`);
  const dt = 1 / 60;
  const run = (sec) => { for (let i = 0; i < Math.round(sec / dt); i++) s.tick(dt); };
  const log = [];
  const puzzle = s.level.puzzle;
  const zoneById = (zid) => s.physics.zones.find((z) => z.id === zid);
  const zoneIds = [...new Set(puzzle.rules.filter((r) => r.zone).map((r) => r.zone))];
  const loose = (tag, zone) => s.physics.items.find((i) => i.alive && i.grabbable && i.tag === tag && !zone?.inside.has(i));

  /** Teleport an item into the middle of a zone and let the physics run. */
  function drop(item, zone) {
    const b = item.body;
    b.position.set((zone.min[0] + zone.max[0]) / 2, (zone.min[1] + zone.max[1]) / 2, (zone.min[2] + zone.max[2]) / 2);
    b.velocity.setZero();
    b.angularVelocity.setZero();
    b.wakeUp();
    run(1.5);
  }

  /**
   * Find a loose item with this tag. The rules do not describe everything a
   * player does, so if none is there yet, behave like a player looking for it:
   * move props no rule cares about (a cone hiding a ticket), and make another
   * accepted move that may produce one (pop another balloon for its candle).
   */
  function find(tag, zone) {
    let nudged = false;
    for (let waited = 0; waited <= maxWait; waited += 0.25) {
      const item = loose(tag, zone);
      if (item) return item;
      if (waited >= 0.5 && !nudged) {
        nudged = true;
        for (const prop of s.physics.items) {
          if (!prop.alive || !prop.grabbable || puzzle.items?.[prop.tag]) continue;
          prop.body.position.x += 1.6;
          prop.body.position.y += 0.6;
          prop.body.wakeUp();
        }
      } else if (waited >= 1) {
        const other = Object.keys(puzzle.items || {}).flatMap((t) => zoneIds.map((z) => [t, z]))
          .find(([t, z]) => t !== tag && loose(t, zoneById(z)) && applyEvent(puzzle, s.state, { type: 'enter', zone: z, tag: t }).accepted);
        if (other) { log.push(`${other[0]} -> ${other[1]} (to find a ${tag})`); drop(loose(other[0], zoneById(other[1])), zoneById(other[1])); continue; }
      }
      run(0.25);
    }
    return null;
  }
  for (const move of path) {
    const before = JSON.stringify(s.state);
    let label;
    if (move.tap) {
      label = `tap ${move.tap}`;
      // the approved input (input.js) has no tapping: everything must be done by carrying items
      throw new Error(`${id}: the puzzle needs a tap on "${move.tap}", but the game has no tap input`);
      s.emit({ type: 'tap', target: move.tap });
      run(0.6);
    } else {
      label = `${move.tag} -> ${move.zone}`;
      const zone = s.physics.zones.find((z) => z.id === move.zone);
      if (!zone) throw new Error(`${id}: no trigger zone called "${move.zone}"`);
      const item = find(move.tag, zone);
      if (!item) throw new Error(`${id}: no "${move.tag}" item ever appeared to carry to ${move.zone}`);
      drop(item, zone);
    }
    if (JSON.stringify(s.state) === before) throw new Error(`${id}: "${label}" had no effect`);
    log.push(label);
  }
  run(5);
  return { path, log, won: s.state.won };
}
