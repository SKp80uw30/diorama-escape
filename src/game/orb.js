/**
 * The view orb: a small globe in the bottom-right corner. Dragging it turns the
 * camera around the diorama, so every press on the diorama itself is free for
 * picking things up. The + and - buttons beside it zoom. Double-tap the orb to
 * return to the starting view. DOM and 2D canvas only.
 */
const css = `
  #de-view { position: fixed; right: max(14px, env(safe-area-inset-right)); bottom: max(14px, env(safe-area-inset-bottom)); z-index: 5;
    display: flex; align-items: flex-end; gap: 8px; user-select: none; -webkit-user-select: none; }
  #de-orb { width: 96px; height: 96px; border-radius: 50%; display: block; cursor: grab; touch-action: none; background: #fff;
    border: 1px solid #2c231e; box-shadow: 0 2px 0 #2c231e; outline: none; }
  #de-orb.on { cursor: grabbing; box-shadow: 0 0 0 3px #e3c832, 0 2px 0 #2c231e; }
  #de-orb:focus-visible { box-shadow: 0 0 0 3px #338b98; }
  #de-zoom { display: grid; gap: 6px; }
  #de-zoom button { width: 40px; height: 40px; padding: 0; font-size: 20px; line-height: 1; touch-action: manipulation; }
`;

export function createOrb({ getOrbit, camera }) {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.append(style);
  const wrap = document.createElement('div');
  wrap.id = 'de-view';
  wrap.className = 'de';
  const zoom = document.createElement('div');
  zoom.id = 'de-zoom';
  const mk = (label, name) => {
    const b = document.createElement('button');
    b.textContent = label;
    b.setAttribute('aria-label', name);
    zoom.append(b);
    return b;
  };
  const zin = mk('+', 'Zoom in');
  const zout = mk('−', 'Zoom out');
  const orb = document.createElement('canvas');
  orb.id = 'de-orb';
  orb.tabIndex = 0;
  orb.setAttribute('role', 'img');
  orb.setAttribute('aria-label', 'View orb: drag to turn the diorama, double-tap to reset the view');
  const SIZE = 96, DPR = Math.min(2, window.devicePixelRatio || 1);
  orb.width = orb.height = SIZE * DPR;
  wrap.append(zoom, orb);
  document.body.append(wrap);
  const g = orb.getContext('2d');

  /** camera position as angles around the orbit target */
  function angles() {
    const c = getOrbit().controls;
    const o = camera.position.clone().sub(c.target);
    const r = o.length();
    return { c, r, theta: Math.atan2(o.x, o.z), phi: Math.acos(Math.max(-1, Math.min(1, o.y / r))) };
  }
  function place(c, r, theta, phi) {
    phi = Math.max(c.minPolarAngle, Math.min(c.maxPolarAngle, phi));
    r = Math.max(c.minDistance, Math.min(c.maxDistance, r));
    camera.position.set(
      c.target.x + r * Math.sin(phi) * Math.sin(theta),
      c.target.y + r * Math.cos(phi),
      c.target.z + r * Math.sin(phi) * Math.cos(theta),
    );
    camera.lookAt(c.target);
    c.update();
  }
  /** turn the view by a drag of dx, dy pixels on the orb */
  function turn(dx, dy) {
    const a = angles();
    place(a.c, a.r, a.theta - dx * 0.014, a.phi - dy * 0.011);
  }
  function zoomBy(f) {
    const a = angles();
    place(a.c, a.r * f, a.theta, a.phi);
  }

  // --- pointer handling ---------------------------------------------------------
  let id = null, lx = 0, ly = 0, lastTap = 0, moved = 0;
  orb.addEventListener('pointerdown', (e) => {
    if (id !== null) return;
    id = e.pointerId; lx = e.clientX; ly = e.clientY; moved = 0;
    orb.setPointerCapture?.(id);
    orb.classList.add('on');
    e.preventDefault();
  });
  orb.addEventListener('pointermove', (e) => {
    if (e.pointerId !== id) return;
    const dx = e.clientX - lx, dy = e.clientY - ly;
    lx = e.clientX; ly = e.clientY;
    moved += Math.abs(dx) + Math.abs(dy);
    turn(dx, dy);
  });
  const end = (e) => {
    if (e.pointerId !== id) return;
    id = null;
    orb.classList.remove('on');
    if (moved < 6 && e.type === 'pointerup') {
      const now = performance.now();
      if (now - lastTap < 380) { getOrbit().reset(); lastTap = 0; } else lastTap = now;
    }
  };
  orb.addEventListener('pointerup', end);
  orb.addEventListener('pointercancel', end);
  orb.addEventListener('keydown', (e) => {
    const d = { ArrowLeft: [-9, 0], ArrowRight: [9, 0], ArrowUp: [0, -9], ArrowDown: [0, 9] }[e.key];
    if (d) { e.preventDefault(); turn(d[0], d[1]); } else if (e.key === 'Home' || e.key.toLowerCase() === 'r') getOrbit().reset();
  });
  zin.onclick = () => zoomBy(0.85);
  zout.onclick = () => zoomBy(1 / 0.85);

  // --- drawing: a wireframe globe that turns with the camera ------------------------
  let drawn = '';
  function draw() {
    const { theta, phi } = angles();
    const key = `${theta.toFixed(3)}|${phi.toFixed(3)}`;
    if (key === drawn) return;
    drawn = key;
    const R = SIZE / 2 - 9, el = Math.PI / 2 - phi;
    const ct = Math.cos(-theta), st = Math.sin(-theta), ce = Math.cos(el), se = Math.sin(el);
    /** unit-sphere point at longitude/latitude -> [x, y, depth] on the orb */
    const proj = (lon, lat) => {
      const x = Math.cos(lat) * Math.sin(lon), y = Math.sin(lat), z = Math.cos(lat) * Math.cos(lon);
      const x1 = x * ct + z * st, z1 = -x * st + z * ct;
      return [x1 * R, -(y * ce - z1 * se) * R, y * se + z1 * ce];
    };
    const line = (pts, color, width) => {
      g.strokeStyle = color; g.lineWidth = width; g.beginPath();
      let pen = false;
      for (const [x, y, d] of pts) {
        if (d < 0) { pen = false; continue; }
        if (pen) g.lineTo(x, y); else g.moveTo(x, y);
        pen = true;
      }
      g.stroke();
    };
    g.setTransform(DPR, 0, 0, DPR, (SIZE / 2) * DPR, (SIZE / 2) * DPR);
    g.clearRect(-SIZE / 2, -SIZE / 2, SIZE, SIZE);
    g.fillStyle = '#f3eddf'; g.beginPath(); g.arc(0, 0, R, 0, Math.PI * 2); g.fill();
    const N = 36, steps = [...Array(N + 1).keys()];
    for (let m = 0; m < 6; m++) line(steps.map((i) => proj((m * Math.PI) / 6, (i / N) * Math.PI * 2)), '#a89c88', 1);
    for (const lat of [-0.6, 0.6]) line(steps.map((i) => proj((i / N) * Math.PI * 2, lat)), '#a89c88', 1);
    line(steps.map((i) => proj((i / N) * Math.PI * 2, 0)), '#2c231e', 1.5);
    // a gold pin marks the side the level starts facing
    const pin = proj(Math.PI / 4, 0);
    if (pin[2] > 0) { g.fillStyle = '#d0a82a'; g.strokeStyle = '#2c231e'; g.lineWidth = 1; g.beginPath(); g.arc(pin[0], pin[1], 4.5, 0, Math.PI * 2); g.fill(); g.stroke(); }
    g.strokeStyle = '#2c231e'; g.lineWidth = 1.5; g.beginPath(); g.arc(0, 0, R, 0, Math.PI * 2); g.stroke();
  }

  return { draw, turn, zoomBy };
}
