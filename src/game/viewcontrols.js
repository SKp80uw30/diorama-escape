/**
 * View controls, laid out like a two-thumb mobile game so that every press on
 * the diorama itself is free for picking things up:
 *
 *   bottom left   MOVE pad   press or drag towards an edge and the view slides
 *                            that way for as long as you hold
 *   bottom right  TURN orb   a globe you roll with your thumb to turn the diorama
 *                 + / −      zoom, stacked above the orb; hold to keep zooming
 *
 * Double-tap the pad or the orb to return to the starting view. Each control
 * tracks its own finger, so they work together, and while an object is held.
 * DOM and 2D canvas only.
 */
const css = `
  .de-ctl { position: fixed; bottom: max(14px, env(safe-area-inset-bottom)); z-index: 5; display: grid; justify-items: center; gap: 8px;
    user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; }
  #de-move { left: max(14px, env(safe-area-inset-left)); }
  #de-view { right: max(14px, env(safe-area-inset-right)); }
  .de-tag { font-size: 10px; letter-spacing: 0.14em; color: #857f74; transition: opacity 0.6s; pointer-events: none; }
  .de-tag.used { opacity: 0; }
  .de-round { width: 96px; height: 96px; border-radius: 50%; display: block; position: relative; touch-action: none; background: #fff;
    border: 1px solid #2c231e; box-shadow: 0 2px 0 #2c231e; outline: none; cursor: grab; }
  .de-round.on { cursor: grabbing; box-shadow: 0 0 0 3px #e3c832, 0 2px 0 #2c231e; }
  .de-round:focus-visible { box-shadow: 0 0 0 3px #338b98; }
  #de-pad svg { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
  #de-knob { position: absolute; left: 50%; top: 50%; width: 34px; height: 34px; margin: -17px 0 0 -17px; border-radius: 50%;
    background: #f3eddf; border: 1.5px solid #2c231e; pointer-events: none; transition: transform 0.12s ease-out; }
  #de-pad.on #de-knob { transition: none; background: #e3c832; }
  #de-zoom { display: grid; border: 1px solid #2c231e; box-shadow: 0 2px 0 #2c231e; background: #fff; }
  #de-zoom button { width: 44px; height: 44px; padding: 0; border: 0; font-size: 20px; line-height: 1; touch-action: none; }
  #de-zoom button + button { border-top: 1px solid #2c231e; }
  #de-zoom button.on { background: #e3c832; color: #2c231e; }
`;
const CHEVRONS = `<svg viewBox="0 0 96 96" fill="none" stroke="#2c231e" stroke-width="2" stroke-linecap="square">
  <path d="M42 17l6-6 6 6M42 79l6 6 6-6M17 42l-6 6 6 6M79 42l6 6-6 6"/></svg>`;

export function createViewControls({ getOrbit, getBounds, camera, THREE }) {
  const style = document.createElement('style');
  style.textContent = css;
  document.head.append(style);
  const el = (tag, id, parent, cls) => {
    const n = document.createElement(tag);
    if (id) n.id = id;
    if (cls) n.className = cls;
    parent.append(n);
    return n;
  };
  // left thumb: move
  const moveBox = el('div', 'de-move', document.body, 'de de-ctl');
  const moveTag = el('div', null, moveBox, 'de-tag');
  moveTag.textContent = 'MOVE';
  const pad = el('div', 'de-pad', moveBox, 'de-round');
  pad.tabIndex = 0;
  pad.setAttribute('role', 'img');
  pad.setAttribute('aria-label', 'Move pad: press towards an edge to slide the view, double-tap to reset the view');
  pad.innerHTML = CHEVRONS;
  const knob = el('div', 'de-knob', pad);
  // right thumb: zoom above turn
  const viewBox = el('div', 'de-view', document.body, 'de de-ctl');
  const zoom = el('div', 'de-zoom', viewBox);
  const zoomBtn = (label, name) => { const b = el('button', null, zoom); b.textContent = label; b.setAttribute('aria-label', name); return b; };
  const zin = zoomBtn('+', 'Zoom in');
  const zout = zoomBtn('−', 'Zoom out');
  const turnTag = el('div', null, viewBox, 'de-tag');
  turnTag.textContent = 'TURN';
  const orb = el('canvas', 'de-orb', viewBox, 'de-round');
  orb.tabIndex = 0;
  orb.setAttribute('role', 'img');
  orb.setAttribute('aria-label', 'Turn orb: drag to turn the diorama, double-tap to reset the view');
  const SIZE = 96, DPR = Math.min(2, window.devicePixelRatio || 1);
  orb.width = orb.height = SIZE * DPR;
  const g = orb.getContext('2d');

  // --- camera maths ----------------------------------------------------------------
  const right = new THREE.Vector3(), up = new THREE.Vector3(), step = new THREE.Vector3(), goal = new THREE.Vector3();
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
  /**
   * Slide the view: kx, ky in -1..1 (right and up on screen), amount as a
   * fraction of the camera distance. The point the camera looks at stays over
   * the diorama, so it can never be lost off screen.
   */
  function pan(kx, ky, amount) {
    const { c, r } = angles();
    const b = getBounds();
    right.setFromMatrixColumn(camera.matrixWorld, 0);
    up.setFromMatrixColumn(camera.matrixWorld, 1);
    goal.copy(c.target).addScaledVector(right, kx * amount * r).addScaledVector(up, ky * amount * r);
    goal.set(Math.max(-b.hx, Math.min(b.hx, goal.x)), Math.max(-0.5, Math.min(b.tall, goal.y)), Math.max(-b.hz, Math.min(b.hz, goal.z)));
    step.copy(goal).sub(c.target);
    c.target.add(step);
    camera.position.add(step);
    camera.updateMatrixWorld();
    c.update();
  }
  const reset = () => getOrbit().reset();

  // --- shared press handling: one finger per control, tap/double-tap detection ----------
  function press(node, tag, { start, move, end }) {
    let id = null, sx = 0, sy = 0, travelled = 0, lastTap = 0;
    node.addEventListener('pointerdown', (e) => {
      if (id !== null) return;
      id = e.pointerId; sx = e.clientX; sy = e.clientY; travelled = 0;
      node.setPointerCapture?.(id);
      node.classList.add('on');
      tag?.classList.add('used');
      e.preventDefault();
      start?.(e);
    });
    node.addEventListener('pointermove', (e) => {
      if (e.pointerId !== id) return;
      travelled += Math.abs(e.clientX - sx) + Math.abs(e.clientY - sy);
      move?.(e, e.clientX - sx, e.clientY - sy);
      sx = e.clientX; sy = e.clientY;
    });
    const stop = (e) => {
      if (e.pointerId !== id) return;
      id = null;
      node.classList.remove('on');
      end?.(e);
      if (travelled < 6 && e.type === 'pointerup') {
        const now = performance.now();
        if (now - lastTap < 380) { reset(); lastTap = 0; } else lastTap = now;
      }
    };
    node.addEventListener('pointerup', stop);
    node.addEventListener('pointercancel', stop);
    node.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  // --- turn orb: direct, like rolling a ball ------------------------------------------------
  press(orb, turnTag, { move: (_, dx, dy) => turn(dx, dy) });
  orb.addEventListener('keydown', (e) => {
    const d = { ArrowLeft: [-9, 0], ArrowRight: [9, 0], ArrowUp: [0, -9], ArrowDown: [0, 9] }[e.key];
    if (d) { e.preventDefault(); turn(d[0], d[1]); } else if (e.key === 'Home') reset();
  });

  // --- move pad: a stick; the further from the centre, the faster the view slides -------------
  const REACH = 30, DEAD = 7, NUDGE = 0.02, SPEED = 0.55;
  const stick = { x: 0, y: 0 };
  function aim(e) {
    const r = pad.getBoundingClientRect();
    let x = e.clientX - (r.left + r.width / 2), y = e.clientY - (r.top + r.height / 2);
    const d = Math.hypot(x, y);
    if (d > REACH) { x *= REACH / d; y *= REACH / d; }
    knob.style.transform = `translate(${x}px, ${y}px)`;
    if (d < DEAD) { stick.x = 0; stick.y = 0; } else { stick.x = x / REACH; stick.y = -y / REACH; }
  }
  press(pad, moveTag, {
    start(e) { aim(e); pan(stick.x, stick.y, NUDGE); },   // a tap on an arrow is one small step
    move: aim,
    end() { stick.x = 0; stick.y = 0; knob.style.transform = ''; },
  });
  pad.addEventListener('keydown', (e) => {
    const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[e.key];
    if (d) { e.preventDefault(); pan(d[0], d[1], 0.04); } else if (e.key === 'Home') reset();
  });

  // --- zoom: tap for a step, hold to keep going ------------------------------------------------
  let zooming = 0;
  for (const [btn, dir] of [[zin, -1], [zout, 1]]) {
    btn.addEventListener('pointerdown', (e) => {
      btn.setPointerCapture?.(e.pointerId);
      btn.classList.add('on');
      zooming = dir;
      zoomBy(dir < 0 ? 0.92 : 1 / 0.92);
      e.preventDefault();
    });
    const stop = () => { btn.classList.remove('on'); if (zooming === dir) zooming = 0; };
    btn.addEventListener('pointerup', stop);
    btn.addEventListener('pointercancel', stop);
    btn.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); zoomBy(dir < 0 ? 0.92 : 1 / 0.92); } });
    btn.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  /** Call once per rendered frame: applies held controls and redraws the globe. */
  function update(dt) {
    if (stick.x || stick.y) pan(stick.x, stick.y, SPEED * dt);
    if (zooming) zoomBy(Math.exp(zooming * 1.1 * dt));
    draw();
  }

  // --- drawing: a wireframe globe that turns with the camera ------------------------------------
  let drawn = '';
  function draw() {
    const { theta, phi } = angles();
    const key = `${theta.toFixed(3)}|${phi.toFixed(3)}`;
    if (key === drawn) return;
    drawn = key;
    const R = SIZE / 2 - 9, elev = Math.PI / 2 - phi;
    const ct = Math.cos(-theta), st = Math.sin(-theta), ce = Math.cos(elev), se = Math.sin(elev);
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

  return { update, turn, zoomBy, pan, reset };
}
