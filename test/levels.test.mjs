// Builds every level headlessly (real three.js scene + real physics, no renderer)
// and plays it from its own puzzle solution. Fails if a zone, switch, item or
// effect the solution needs is missing, if anything falls out of the world, or
// if the level cannot be won.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { LEVELS } from '../src/game/registry.js';
import { createSession } from '../src/game/session.js';
import { autoplay } from '../src/game/autoplay.js';

const lights = () => ({ sun: new THREE.DirectionalLight(), fill: new THREE.DirectionalLight(), hemi: new THREE.HemisphereLight() });

for (const level of LEVELS.filter((l) => l.build)) {
  test(`${level.id}: settles without triggering anything or losing items`, () => {
    const s = createSession(level, { lights: lights() });
    const start = JSON.stringify(s.state);
    for (let i = 0; i < 180; i++) s.tick(1 / 60);
    assert.equal(JSON.stringify(s.state), start, 'puzzle state changed with no player input');
    const lost = s.physics.items.filter((i) => i.falls > 0).map((i) => i.tag);
    assert.deepEqual(lost, [], 'items fell out of the world while settling');
  });

  test(`${level.id}: can be played to the win`, () => {
    const said = [];
    let wins = 0;
    const s = createSession(level, { lights: lights(), say: (t) => said.push(t), onWin: () => wins++ });
    const r = autoplay(s);
    console.log(`  ${level.id}: ${r.log.join(' | ')}`);
    assert.ok(r.won, 'not won after the full solution');
    assert.equal(wins, 1);
    const lost = s.physics.items.filter((i) => i.falls > 0).map((i) => i.tag);
    assert.deepEqual(lost, [], 'items fell out of the world during play');
  });
}
