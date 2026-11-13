import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, applyEvent, solve } from '../src/game/puzzle.js';
import tennis from '../src/levels/tennis/puzzle.js';
import museum from '../src/levels/museum/puzzle.js';
import jungle from '../src/levels/jungle/puzzle.js';

const LEVEL_PUZZLES = { tennis, museum, jungle };
const enter = (zone, tag) => ({ type: 'enter', zone, tag });
const play = (puzzle, moves) => moves.reduce((s, [zone, tag]) => applyEvent(puzzle, s, enter(zone, tag)).state, createState(puzzle));

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

test('museum: a relic only fits its own plinth', () => {
  const s = createState(museum);
  assert.equal(applyEvent(museum, s, enter('plinthIdol', 'vase')).accepted, false);
  assert.equal(applyEvent(museum, s, enter('plinthVase', 'idol')).accepted, false);
  assert.equal(applyEvent(museum, s, enter('plinthVase', 'vase')).accepted, true);
});

test('museum: case opens after two relics, tomb after the scarab, door only takes the disc', () => {
  let s = play(museum, [['plinthVase', 'vase']]);
  assert.ok(!s.flags.caseOpen);
  assert.equal(applyEvent(museum, s, enter('plinthScarab', 'scarab')).accepted, false);
  s = play(museum, [['plinthVase', 'vase'], ['plinthIdol', 'idol']]);
  assert.ok(s.flags.caseOpen && !s.flags.tombOpen);
  assert.equal(applyEvent(museum, s, enter('door', 'disc')).accepted, false);
  s = applyEvent(museum, s, enter('plinthScarab', 'scarab')).state;
  assert.ok(s.flags.tombOpen && !s.won);
  assert.equal(applyEvent(museum, s, enter('door', 'vase')).accepted, false);
  assert.ok(applyEvent(museum, s, enter('door', 'disc')).state.won);
});

test('jungle: an unlit torch does not burn the vines', () => {
  const s = createState(jungle);
  assert.equal(applyEvent(jungle, s, enter('vines', 'torch')).accepted, false);
  assert.equal(applyEvent(jungle, s, enter('vines', 'flame')).accepted, false);
  const lit = applyEvent(jungle, s, enter('campfire', 'torch')).state;
  assert.ok(applyEvent(jungle, lit, enter('vines', 'flame')).state.flags.burnt);
});

test('jungle: the mouth opens only with both eyes, and the plate works once', () => {
  let s = play(jungle, [['plate', 'stone']]);
  assert.ok(s.flags.cageOpen);
  assert.equal(applyEvent(jungle, s, enter('plate', 'stone')).accepted, false);
  s = play(jungle, [['altar', 'eye2']]);
  assert.ok(!s.won && s.counters.eyes === 1);
  assert.ok(play(jungle, [['altar', 'eye2'], ['altar', 'eye1']]).won);
});
