import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, applyEvent, solve } from '../src/game/puzzle.js';
import tennis from '../src/levels/tennis/puzzle.js';
import museum from '../src/levels/museum/puzzle.js';
import jungle from '../src/levels/jungle/puzzle.js';
import pirate from '../src/levels/pirate/puzzle.js';
import party from '../src/levels/party/puzzle.js';
import dino from '../src/levels/dino/puzzle.js';
import concert, { COLORS } from '../src/levels/concert/puzzle.js';

import { LEVELS } from '../src/game/registry.js';

const LEVEL_PUZZLES = Object.fromEntries(LEVELS.filter((l) => l.puzzle).map((l) => [l.id, l.puzzle]));
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

test('pirate: the cannon needs both the ball and the powder, in either order', () => {
  assert.ok(!play(pirate, [['cannon', 'ball']]).flags.fired);
  assert.ok(!play(pirate, [['cannon', 'keg']]).flags.fired);
  assert.ok(play(pirate, [['cannon', 'ball'], ['cannon', 'keg']]).flags.fired);
  assert.ok(play(pirate, [['cannon', 'keg'], ['cannon', 'ball']]).flags.fired);
});

test('pirate: key then wheel, and neither works early or in the wrong place', () => {
  const s = createState(pirate);
  assert.equal(applyEvent(pirate, s, enter('chest', 'key')).accepted, false);
  assert.equal(applyEvent(pirate, s, enter('helm', 'wheel')).accepted, false);
  const fired = play(pirate, [['cannon', 'ball'], ['cannon', 'keg']]);
  assert.equal(applyEvent(pirate, fired, enter('helm', 'key')).accepted, false);
  const open = applyEvent(pirate, fired, enter('chest', 'key')).state;
  assert.ok(open.flags.chestOpen && !open.won);
  assert.ok(applyEvent(pirate, open, enter('helm', 'wheel')).state.won);
});

test('party: three pops, three candles, then the key', () => {
  let s = createState(party);
  assert.equal(applyEvent(party, s, enter('door', 'key')).accepted, false);
  assert.equal(applyEvent(party, s, enter('cake', 'balloon')).accepted, false);
  s = play(party, [['pin', 'balloon'], ['cake', 'candle'], ['pin', 'balloon'], ['cake', 'candle']]);
  assert.ok(!s.flags.lit && s.counters.candles === 2);
  s = applyEvent(party, s, enter('cake', 'candle')).state;
  assert.ok(s.flags.lit && !s.won);
  assert.ok(applyEvent(party, s, enter('door', 'key')).state.won);
});

test('dino: the third egg needs the long-neck lured, and the T-rex only takes the bone after the swoop', () => {
  let s = play(dino, [['nest', 'egg'], ['nest', 'egg']]);
  assert.ok(!s.flags.swooped);
  assert.equal(applyEvent(dino, s, enter('nest', 'egg3')).accepted, false);
  assert.equal(applyEvent(dino, s, enter('rexRock', 'bone')).accepted, false);
  s = play(dino, [['nest', 'egg'], ['nest', 'egg'], ['tree', 'fern'], ['nest', 'egg3']]);
  assert.ok(s.flags.swooped && !s.won);
  assert.ok(applyEvent(dino, s, enter('rexRock', 'bone')).state.won);
});

test('concert: a fan only takes the ticket in their own colour', () => {
  const s = createState(concert);
  for (const fan of COLORS) for (const ticket of COLORS) {
    assert.equal(applyEvent(concert, s, enter(`fan-${fan}`, `ticket-${ticket}`)).accepted, fan === ticket, `${ticket} ticket to ${fan} fan`);
  }
});

test('concert: wins only when all five are inside', () => {
  const four = play(concert, COLORS.slice(0, 4).map((c) => [`fan-${c}`, `ticket-${c}`]));
  assert.ok(!four.won && four.counters.inside === 4);
  assert.ok(play(concert, COLORS.map((c) => [`fan-${c}`, `ticket-${c}`])).won);
});
