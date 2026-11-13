/**
 * Pick up, carry and throw. This module knows nothing about fingers or mice:
 * input.js decides when a press is on an object and drives begin / aim / end.
 * A held item lifts to a carry height and follows the pointer; on release it
 * keeps its velocity, so a flick is a throw.
 */
import * as THREE from 'three';

export function createGrab({ canvas, camera, physics, bounds, carryY = 2.8, pickRadius = 42, maxThrow = 15 }) {
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();      // where the held item is being aimed
  const probe = new THREE.Vector2();    // scratch for pick tests
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -carryY);
  const target = new THREE.Vector3();
  const v = new THREE.Vector3();
  let held = null;
  let occluders = [];

  function toNdc(out, x, y) {
    const r = canvas.getBoundingClientRect();
    out.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
    return r;
  }

  /** The loose item at (or near) a screen point, or null. Items hidden behind scenery cannot be picked. */
  function pick(x, y) {
    const r = toNdc(probe, x, y);
    let best = null;
    let bestD = pickRadius;
    for (const item of physics.items) {
      if (!item.alive || !item.grabbable) continue;
      v.copy(item.mesh.position).project(camera);
      const d = Math.hypot(((v.x - probe.x) * r.width) / 2, ((v.y - probe.y) * r.height) / 2);
      if (d >= bestD) continue;
      const to = v.copy(item.mesh.position).sub(camera.position);
      const dist = to.length();
      ray.set(camera.position, to.normalize());
      const hit = ray.intersectObjects(occluders, true)[0];
      if (hit && hit.distance < dist - 0.35) continue;
      best = item;
      bestD = d;
    }
    return best;
  }

  function begin(item, x, y) {
    if (held) end();
    held = item;
    item.held = true;
    toNdc(ndc, x, y);
  }
  function aim(x, y) { if (held) toNdc(ndc, x, y); }
  function end() {
    if (!held) return;
    const b = held.body;
    const speed = b.velocity.length();
    if (speed > maxThrow) b.velocity.scale(maxThrow / speed, b.velocity);
    held.held = false;
    held = null;
  }

  /** Call once per frame before physics.step. */
  function update() {
    if (!held) return;
    if (!held.alive) { end(); return; }
    ray.setFromCamera(ndc, camera);
    if (!ray.ray.intersectPlane(plane, target)) return;
    target.x = Math.max(bounds.minX, Math.min(bounds.maxX, target.x));
    target.z = Math.max(bounds.minZ, Math.min(bounds.maxZ, target.z));
    const b = held.body;
    b.wakeUp();
    v.set(target.x - b.position.x, target.y - b.position.y, target.z - b.position.z).multiplyScalar(12);
    if (v.length() > 30) v.setLength(30);
    b.velocity.set(v.x, v.y, v.z);
    b.angularVelocity.scale(0.9, b.angularVelocity);
  }

  return { pick, begin, aim, end, update, setOccluders(list) { occluders = list; }, get held() { return held; } };
}
