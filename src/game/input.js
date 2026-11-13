/**
 * The one place that acts on fingers and the mouse. The camera library's own
 * pointer handling is switched off (see main.js), so two handlers can never
 * disagree about what is going on.
 *
 *   touch   one finger on an object     pick it up, carry it, flick to throw
 *           one finger on empty space   turn the diorama
 *           two fingers                 drag together to slide the view, pinch to zoom
 *   mouse   left-drag on an object      pick up and carry
 *           left-drag on empty space    turn
 *           right- or middle-drag       slide
 *           wheel                       zoom
 *
 * Touch state is rebuilt from the browser's own list of fingers on every event
 * (TouchEvent.targetTouches) instead of being counted up and down, so a missed
 * "finger lifted" event cannot leave a phantom finger behind.
 *
 * get() returns the level on screen: { controls, grab, slab, tall }.
 * controls is only a holder for the look-at target and the zoom and tilt limits.
 */
import * as THREE from 'three';

export function createInput({ canvas, camera, get }) {
  const right = new THREE.Vector3(), up = new THREE.Vector3(), goal = new THREE.Vector3(), step = new THREE.Vector3(), off = new THREE.Vector3();

  // --- camera moves ------------------------------------------------------------
  function place(c, r, theta, phi) {
    phi = Math.max(c.minPolarAngle, Math.min(c.maxPolarAngle, phi));
    r = Math.max(c.minDistance, Math.min(c.maxDistance, r));
    camera.position.set(
      c.target.x + r * Math.sin(phi) * Math.sin(theta),
      c.target.y + r * Math.cos(phi),
      c.target.z + r * Math.sin(phi) * Math.cos(theta),
    );
    camera.lookAt(c.target);
    camera.updateMatrixWorld();
  }
  function orbit(dTheta, dPhi, scale) {
    const c = get().controls;
    off.copy(camera.position).sub(c.target);
    const r = off.length();
    place(c, r * scale, Math.atan2(off.x, off.z) + dTheta, Math.acos(Math.max(-1, Math.min(1, off.y / r))) + dPhi);
  }
  /** turn by a drag of dx, dy pixels */
  function turn(dx, dy) {
    const k = (2 * Math.PI) / (canvas.clientHeight || 1);
    orbit(-dx * k, -dy * k, 1);
  }
  function zoom(scale) { if (scale > 0 && Number.isFinite(scale)) orbit(0, 0, scale); }
  /** slide so the scene follows a drag of dx, dy pixels; the look-at point stays over the diorama */
  function slide(dx, dy) {
    const { controls: c, slab, tall } = get();
    const r = camera.position.distanceTo(c.target);
    const perPixel = (2 * r * Math.tan((camera.fov * Math.PI) / 360)) / (canvas.clientHeight || 1);
    right.setFromMatrixColumn(camera.matrixWorld, 0);
    up.setFromMatrixColumn(camera.matrixWorld, 1);
    goal.copy(c.target).addScaledVector(right, -dx * perPixel).addScaledVector(up, dy * perPixel);
    goal.set(Math.max(-slab.hx, Math.min(slab.hx, goal.x)), Math.max(-0.5, Math.min(tall, goal.y)), Math.max(-slab.hz, Math.min(slab.hz, goal.z)));
    step.copy(goal).sub(c.target);
    c.target.add(step);
    camera.position.add(step);
    camera.updateMatrixWorld();
  }

  // --- touch ---------------------------------------------------------------------
  let grabFinger = null;          // Touch.identifier of the finger carrying an object
  let viewKey = '';               // which fingers are steering the view
  const last = new Map();         // their last positions

  function onTouch(e) {
    if (e.cancelable) e.preventDefault();
    const { grab } = get();
    const fingers = [...e.targetTouches];
    if (grabFinger !== null) {
      const t = fingers.find((f) => f.identifier === grabFinger);
      if (t && grab.held) grab.aim(t.clientX, t.clientY);
      else { grab.end(); grabFinger = null; }
    }
    // only a lone first finger can pick something up; a second finger is always a view gesture
    if (e.type === 'touchstart' && grabFinger === null && fingers.length === 1 && e.changedTouches.length === 1) {
      const t = fingers[0];
      const item = grab.pick(t.clientX, t.clientY);
      if (item) { grab.begin(item, t.clientX, t.clientY); grabFinger = t.identifier; }
    }
    const view = fingers.filter((f) => f.identifier !== grabFinger).slice(0, 2);
    const key = view.map((f) => f.identifier).join(',');
    if (key === viewKey && view.length === 1) {
      const [a] = view, p = last.get(a.identifier);
      turn(a.clientX - p[0], a.clientY - p[1]);
    } else if (key === viewKey && view.length === 2) {
      const [a, b] = view, pa = last.get(a.identifier), pb = last.get(b.identifier);
      slide((a.clientX + b.clientX - pa[0] - pb[0]) / 2, (a.clientY + b.clientY - pa[1] - pb[1]) / 2);
      const before = Math.hypot(pa[0] - pb[0], pa[1] - pb[1]), now = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
      if (before > 8 && now > 8) zoom(before / now);
    }
    // a change in which fingers are down starts a fresh gesture, so nothing jumps
    viewKey = key;
    last.clear();
    for (const f of view) last.set(f.identifier, [f.clientX, f.clientY]);
  }

  // --- mouse ---------------------------------------------------------------------
  let mouse = null, mx = 0, my = 0;   // 'grab' | 'turn' | 'slide'
  function endMouse() {
    if (mouse === 'grab') get().grab.end();
    mouse = null;
    canvas.style.cursor = '';
  }
  function mouseDown(e) {
    if (mouse) endMouse();
    e.preventDefault();
    canvas.focus?.({ preventScroll: true });
    mx = e.clientX; my = e.clientY;
    const { grab } = get();
    const item = e.button === 0 ? grab.pick(mx, my) : null;
    if (item) { grab.begin(item, mx, my); mouse = 'grab'; } else mouse = e.button === 0 ? 'turn' : 'slide';
    canvas.style.cursor = 'grabbing';
  }
  function mouseMove(e) {
    if (mouse && e.buttons === 0) endMouse();   // the button was let go outside the window
    if (!mouse) {
      if (e.target === canvas) canvas.style.cursor = get().grab.pick(e.clientX, e.clientY) ? 'grab' : '';
      return;
    }
    const dx = e.clientX - mx, dy = e.clientY - my;
    mx = e.clientX; my = e.clientY;
    if (mouse === 'grab') get().grab.aim(mx, my);
    else if (mouse === 'turn') turn(dx, dy);
    else slide(dx, dy);
  }
  function wheel(e) {
    e.preventDefault();
    zoom(Math.exp(Math.max(-240, Math.min(240, e.deltaY)) * 0.0012));
  }

  /** Let go of everything: used when the level changes or the page loses focus. */
  function cancel() {
    get()?.grab.end();
    grabFinger = null; viewKey = ''; last.clear();
    mouse = null; canvas.style.cursor = '';
  }

  const touchOpts = { passive: false };
  for (const type of ['touchstart', 'touchmove', 'touchend', 'touchcancel']) canvas.addEventListener(type, onTouch, touchOpts);
  canvas.addEventListener('mousedown', mouseDown);
  window.addEventListener('mousemove', mouseMove);
  window.addEventListener('mouseup', endMouse);
  canvas.addEventListener('wheel', wheel, { passive: false });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  window.addEventListener('blur', cancel);
  document.addEventListener('visibilitychange', () => { if (document.hidden) cancel(); });

  return {
    cancel, turn, slide, zoom,
    /** for tests: what the input layer currently believes */
    status: () => ({ grabbing: grabFinger !== null, viewFingers: viewKey ? viewKey.split(',').length : 0, mouse }),
  };
}
