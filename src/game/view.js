/**
 * Camera controls for EVERY level, defined once here. Levels never configure the
 * camera; main.js creates this the same way for each one, and qa/controls.mjs
 * checks every gesture on every level with real touch input.
 *
 *   one finger / left mouse drag ......... orbit
 *   two fingers .......................... pan (drag) and zoom (pinch), together
 *   right mouse drag ..................... pan
 *   mouse wheel .......................... zoom
 *   R key ................................ reset to the starting view
 *
 * Two-finger gestures always win: if the first finger happened to pick up an
 * item, the second finger puts it down (onTwoFingers) and the view moves.
 * The view centre is kept over the diorama so it can never be lost off screen.
 */
import * as THREE from 'three';
import { createDioramaOrbit } from '../engine/orbit.js';

export const VIEW = Object.freeze({
  minZoom: 0.4,          // closest camera distance, as a fraction of the fitted distance
  maxZoom: 1.5,          // furthest
  maxPolarAngle: Math.PI / 2 - 0.06, // never look from below the slab
});

export function createView({ camera, canvas, target, distance, bounds, onSelect = () => {}, onTwoFingers = () => {} }) {
  const orbit = createDioramaOrbit(camera, canvas, {
    target, minDistance: distance * VIEW.minZoom, maxDistance: distance * VIEW.maxZoom,
    maxPolarAngle: VIEW.maxPolarAngle, onSelect,
  });
  const controls = orbit.controls;
  controls.enablePan = true;           // right mouse drag
  controls.screenSpacePanning = true;
  controls.touches.TWO = null;         // two fingers are handled below, not by OrbitControls

  const minD = distance * VIEW.minZoom, maxD = distance * VIEW.maxZoom;
  const shift = new THREE.Vector3();
  const offset = new THREE.Vector3();
  const right = new THREE.Vector3();
  const up = new THREE.Vector3();

  /** Keep the view centre over the diorama (moving the camera with it). */
  function clampTarget() {
    const t = controls.target;
    shift.set(
      THREE.MathUtils.clamp(t.x, bounds.minX, bounds.maxX) - t.x,
      THREE.MathUtils.clamp(t.y, bounds.minY, bounds.maxY) - t.y,
      THREE.MathUtils.clamp(t.z, bounds.minZ, bounds.maxZ) - t.z,
    );
    if (shift.lengthSq() === 0) return;
    t.add(shift);
    camera.position.add(shift);
  }
  controls.addEventListener('change', clampTarget);

  function pan(dxPx, dyPx) {
    const dist = camera.position.distanceTo(controls.target);
    const perPx = (2 * dist * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)) / (canvas.clientHeight || 1);
    right.setFromMatrixColumn(camera.matrix, 0);
    up.setFromMatrixColumn(camera.matrix, 1);
    shift.copy(right).multiplyScalar(-dxPx * perPx).addScaledVector(up, dyPx * perPx);
    camera.position.add(shift);
    controls.target.add(shift);
  }

  function zoom(ratio) {
    offset.subVectors(camera.position, controls.target);
    offset.setLength(THREE.MathUtils.clamp(offset.length() * ratio, minD, maxD));
    camera.position.copy(controls.target).add(offset);
  }

  // --- two-finger pan + pinch ----------------------------------------------------
  const touches = new Map();
  let last = null;
  const measure = () => {
    const [a, b] = [...touches.values()];
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, d: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)) };
  };
  function down(e) {
    if (e.pointerType !== 'touch') return;
    touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (touches.size === 2) { onTwoFingers(); last = measure(); }
  }
  function move(e) {
    const p = touches.get(e.pointerId);
    if (!p) return;
    p.x = e.clientX; p.y = e.clientY;
    if (touches.size !== 2 || !last) return;
    const now = measure();
    pan(now.x - last.x, now.y - last.y);
    zoom(last.d / now.d);
    last = now;
    clampTarget();
    controls.update();
  }
  function end(e) {
    if (!touches.delete(e.pointerId)) return;
    last = touches.size === 2 ? measure() : null;
  }
  const listeners = [['pointerdown', down], ['pointermove', move], ['pointerup', end], ['pointercancel', end]];
  for (const [name, fn] of listeners) canvas.addEventListener(name, fn, true);

  return {
    orbit, controls,
    reset: orbit.reset,
    dispose() {
      for (const [name, fn] of listeners) canvas.removeEventListener(name, fn, true);
      controls.removeEventListener('change', clampTarget);
      orbit.dispose();
    },
  };
}
