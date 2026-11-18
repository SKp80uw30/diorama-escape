import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, applyEvent, solve } from '../src/game/puzzle.js';
import tennis from '../src/levels/tennis/puzzle.js';
import { LEVELS } from '../src/game/registry.js';

const LEVEL_PUZZLES = Object.fromEntries(LEVELS.filter((l) => l.puzzle).map((l) => [l.id, l.puzzle]));

for (const [id, puzzle] of Object.entries(LEVEL_PUZZLES)) {
  test(`${id}: can be solved`, () => {
    const path = solve(puzzle);
    assert.ok(path, 'no winning sequence of moves exists');
    console.log(`  ${id} shortest solution: ${path.map((m) => `${m.tag}->${m.zone}`).join(', ')}`);
  });
}

test('tennis: key does nothing in the hopper and a ball does nothing in the lock', () => {
  const s = createState(tennis);
  assert.equal(applyEvent(tennis, s, { type: 'enter', zone: 'hopper', tag: 'key' }).accepted, false);
  assert.equal(applyEvent(tennis, s, { type: 'enter', zone: 'lock', tag: 'ball' }).accepted, false);
});

test('tennis: machine fires exactly once, on the third ball', () => {
  let s = createState(tennis);
  const fx = [];
  for (let i = 0; i < 4; i++) {
    const r = applyEvent(tennis, s, { type: 'enter', zone: 'hopper', tag: 'ball' });
    s = r.state;
    fx.push(r.effects.filter((e) => e.name === 'fire').length);
  }
  assert.deepEqual(fx, [0, 0, 1, 0]);
  assert.equal(s.won, false);
});

test('applyEvent does not mutate its input', () => {
  const s = createState(tennis);
  const copy = structuredClone(s);
  applyEvent(tennis, s, { type: 'enter', zone: 'hopper', tag: 'ball' });
  assert.deepEqual(s, copy);
});
