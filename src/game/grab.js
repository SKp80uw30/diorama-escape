/**
 * Pick up, carry and throw. Press on (or near) a grabbable item and it lifts to
 * a carry height and follows the pointer; release and it keeps its velocity, so
 * a flick is a throw. Pressing anywhere else falls through to camera orbit.
 */
import * as THREE from 'three';

export function createGrab({ canvas, camera, physics, orbit, bounds, carryY = 2.8, pickRadius = 46, maxThrow = 15 }) {
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -carryY);
  const target = new THREE.Vector3();
  const v = new THREE.Vector3();
  let held = null;
  let pointerId = null;
  let occluders = [];

  function setNdc(e) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    return r;
  }

  function pick(e) {
    const r = setNdc(e);
    let best = null;
    let bestD = pickRadius;
    for (const item of physics.items) {
      if (!item.alive || !item.grabbable) continue;
      v.copy(item.mesh.position).project(camera);
      const dx = ((v.x - ndc.x) * r.width) / 2;
      const dy = ((v.y - ndc.y) * r.height) / 2;
      const d = Math.hypot(dx, dy);
      if (d >= bestD) continue;
      // hidden behind scenery? then it cannot be grabbed from this side
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

  function down(e) {
    if (held || (e.button !== 0 && e.pointerType === 'mouse')) return;
    const item = pick(e);
    if (!item) return;
    held = item;
    item.held = true;
    pointerId = e.pointerId;
    orbit.controls.enabled = false;
    canvas.setPointerCapture?.(e.pointerId);
    canvas.style.cursor = 'grabbing';
  }
  function move(e) {
    if (held && e.pointerId === pointerId) setNdc(e);
    else if (!held && e.pointerType === 'mouse') canvas.style.cursor = pick(e) ? 'grab' : '';
  }
  function up(e) {
    if (!held || e.pointerId !== pointerId) return;
    const b = held.body;
    const speed = b.velocity.length();
    if (speed > maxThrow) b.velocity.scale(maxThrow / speed, b.velocity);
    held.held = false;
    held = null;
    pointerId = null;
    orbit.controls.enabled = true;
    canvas.style.cursor = '';
  }

  canvas.addEventListener('pointerdown', down, true);
  canvas.addEventListener('pointermove', move, true);
  canvas.addEventListener('pointerup', up, true);
  canvas.addEventListener('pointercancel', up, true);

  /** Call once per frame before physics.step. */
  function update() {
    if (!held) return;
    if (!held.alive) { up({ pointerId }); return; }
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

  return {
    update,
    setOccluders(list) { occluders = list; },
    get held() { return held; },
    dispose() {
      canvas.removeEventListener('pointerdown', down, true);
      canvas.removeEventListener('pointermove', move, true);
      canvas.removeEventListener('pointerup', up, true);
      canvas.removeEventListener('pointercancel', up, true);
    },
  };
}
