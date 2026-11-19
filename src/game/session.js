/**
 * One playable level: its scene group, physics world, building kit and puzzle
 * state, plus the glue that routes physical events through the puzzle rules and
 * the resulting effects back into the scene. No DOM and no renderer, so it runs
 * the same in the browser and in Node tests.
 */
import * as THREE from 'three';
import { createPhysics } from './physics.js';
import { createKit } from './kit.js';
import { createState, applyEvent } from './puzzle.js';

export function createSession(level, { lights, say = () => {}, onWin = () => {}, strict = false } = {}) {
  const group = new THREE.Group();
  const physics = createPhysics(level.physics);
  const kit = createKit({ group, physics, lights, say });
  const s = { level, group, physics, kit, state: createState(level.puzzle), t: 0, built: {} };
  s.built = level.build(kit) || {};

  s.emit = (event) => {
    const r = applyEvent(level.puzzle, s.state, { ...event, item: undefined });
    if (!r.accepted) return false;
    const wasWon = s.state.won;
    s.state = r.state;
    for (const fx of r.effects) {
      if (fx.name === 'consume') { if (event.item) physics.removeItem(event.item); }
      else if (fx.name === 'say' || fx.name === 'hint') say(fx.payload);
      else {
        const f = s.built.fx?.[fx.name];
        if (!f && !strict) continue; // in the game a missing effect is skipped; tests run strict
        if (!f) throw new Error(`level ${level.id}: the puzzle asks for effect "${fx.name}" but the scene has none`);
        f(fx.payload, s.state, event);
      }
    }
    if (s.state.won && !wasWon) onWin();
    return true;
  };

  s.tick = (dt) => {
    s.t += dt;
    physics.step(dt, s.emit);
    kit.tick(dt);
    s.built.update?.(dt, s.t, s.state);
  };

  return s;
}
