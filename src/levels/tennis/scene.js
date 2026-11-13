/**
 * Centre Court. Everything is authored geometry on a clay court:
 *   ball machine (left)  -> hopper trigger zone
 *   floodlight (back right) with the gate key hanging from it
 *   gate (right edge)    -> lock trigger zone
 * Three balls: one in plain sight, one under the bench, one behind the scoreboard.
 */
const C = {
  grass: '#5a9e45', grassDark: '#3f8440', slabEdge: '#71452e', clay: '#c96b42', clayDark: '#a8502f',
  line: '#ffffff', net: '#2c3237', post: '#3b4449', steel: '#9ba7ab', steelDark: '#606b70',
  red: '#d9503c', redDark: '#a8322c', ball: '#f5e050', gold: '#e3c832', goldDark: '#b08420',
  wood: '#b97d55', woodDark: '#71452e', board: '#245432', lamp: '#fff3a8', off: '#463f38', path: '#dcc890',
};
const G = 22; // must match physics gravity magnitude

export function build(ctx) {
  const { THREE, box, cyl, ball, item, zone, mat, group, physics } = ctx;
  ctx.slab(8.6, 5.6, C.grass, C.slabEdge);

  // --- court -----------------------------------------------------------------
  box(13, 0.03, 7, C.clay, 0, 0.015, 0, { shadow: false, occlude: false });
  const line = (w, d, x, z) => box(w, 0.012, d, C.line, x, 0.038, z, { shadow: false, occlude: false });
  line(12, 0.09, 0, 3); line(12, 0.09, 0, -3); line(12, 0.09, 0, 2.25); line(12, 0.09, 0, -2.25);
  line(0.09, 6.09, 6, 0); line(0.09, 6.09, -6, 0); line(0.09, 4.5, 3.2, 0); line(0.09, 4.5, -3.2, 0);
  line(6.4, 0.09, 0, 0);
  // net
  box(0.06, 0.74, 6.9, C.net, 0, 0.37, 0, { solid: true });
  box(0.1, 0.1, 6.9, C.line, 0, 0.78, 0);
  cyl(0.08, 0.08, 0.95, C.post, 0, 0.475, 3.5); cyl(0.08, 0.08, 0.95, C.post, 0, 0.475, -3.5);

  // --- fences (back and right, with the gate in the right one) ----------------
  const fence = (x0, z0, x1, z1) => {
    const len = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(len / 1.5));
    const alongX = Math.abs(x1 - x0) > Math.abs(z1 - z0);
    for (let i = 0; i <= n; i++) cyl(0.06, 0.06, 1.5, C.post, x0 + ((x1 - x0) * i) / n, 0.75, z0 + ((z1 - z0) * i) / n, { occlude: false });
    for (const y of [0.45, 0.95, 1.42]) {
      box(alongX ? len : 0.05, 0.05, alongX ? 0.05 : len, C.steelDark, (x0 + x1) / 2, y, (z0 + z1) / 2, { occlude: false }); // you can reach through a fence
    }
    ctx.solid(alongX ? len : 0.12, 1.5, alongX ? 0.12 : len, (x0 + x1) / 2, 0.75, (z0 + z1) / 2);
  };
  fence(-8.2, -5.2, 8.2, -5.2);
  fence(8.2, -5.2, 8.2, -1.1);
  fence(8.2, 1.1, 8.2, 5.2);

  // gate: two leaves hinged on the posts either side of the gap
  const leaves = [-1, 1].map((side) => {
    const pivot = new THREE.Group();
    pivot.position.set(8.2, 0, side * 1.1);
    group.add(pivot);
    box(0.08, 1.3, 1.02, C.woodDark, 0, 0.72, -side * 0.55, { parent: pivot });
    box(0.1, 0.1, 1.02, C.wood, 0, 1.3, -side * 0.55, { parent: pivot });
    box(0.1, 0.1, 1.02, C.wood, 0, 0.2, -side * 0.55, { parent: pivot });
    return { pivot, side };
  });
  const gateBody = ctx.solid(0.2, 1.5, 2.2, 8.2, 0.75, 0);
  const padlock = box(0.22, 0.34, 0.4, C.gold, 8.05, 0.8, 0);
  const shackle = cyl(0.13, 0.13, 0.06, C.steel, 8.05, 1.02, 0, { rot: [0, 0, Math.PI / 2] });
  box(1.2, 0.02, 1.6, C.path, 7.5, 0.03, 0, { shadow: false, occlude: false });
  zone('lock', [6.6, 0, -1.0], [8.1, 1.6, 1.0]);

  // --- ball machine ----------------------------------------------------------
  const M = { x: -5.2, z: 0.4 };
  box(1.1, 0.75, 0.95, C.red, M.x, 0.5, M.z, { solid: true });
  box(1.14, 0.12, 0.99, C.redDark, M.x, 0.14, M.z);
  for (const dz of [-0.5, 0.5]) cyl(0.2, 0.2, 0.1, C.net, M.x - 0.2, 0.2, M.z + dz, { rot: [Math.PI / 2, 0, 0] });
  cyl(0.17, 0.2, 0.6, C.steelDark, M.x + 0.62, 0.72, M.z, { rot: [0, 0, -Math.PI / 2.6] });
  cyl(0.62, 0.3, 0.5, C.steel, M.x - 0.1, 1.12, M.z, { open: true, segments: 12 });
  const lamps = [-0.28, 0, 0.28].map((dz) => box(0.04, 0.14, 0.14, C.off, M.x + 0.56, 0.36, M.z + dz, { shadow: false }));
  zone('hopper', [M.x - 0.7, 0.86, M.z - 0.62], [M.x + 0.5, 1.75, M.z + 0.62]);
  const muzzle = new THREE.Vector3(M.x + 0.95, 1.05, M.z);

  // --- floodlight with the key ------------------------------------------------
  const L = { x: 6.9, z: -4.5 };
  cyl(0.1, 0.14, 4.3, C.post, L.x, 2.15, L.z, { solid: true });
  box(1.3, 0.5, 0.3, C.steelDark, L.x - 0.3, 4.4, L.z + 0.1);
  for (const dx of [-0.7, -0.3, 0.1]) box(0.3, 0.3, 0.06, C.lamp, L.x + dx, 4.4, L.z + 0.28, { shadow: false });
  box(0.9, 0.06, 0.06, C.post, L.x - 0.45, 3.3, L.z);
  const hookAt = new THREE.Vector3(L.x - 0.85, 3.0, L.z);
  const key = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.06, 6, 10), mat(C.gold));
  ring.position.x = -0.24;
  const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.09, 0.09), mat(C.gold));
  shaft.position.x = 0.14;
  const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 0.09), mat(C.goldDark));
  tooth.position.set(0.33, -0.1, 0);
  const tooth2 = tooth.clone(); tooth2.position.x = 0.17; tooth2.scale.y = 0.7;
  key.add(ring, shaft, tooth, tooth2);
  key.position.copy(hookAt);
  key.rotation.z = -Math.PI / 2;
  key.traverse((m) => { m.castShadow = true; });
  group.add(key);

  // --- furniture -------------------------------------------------------------
  // scoreboard: solid to the ground, so it hides what is behind it
  const S = { x: -2.6, z: -4.35 };
  box(2.8, 0.5, 0.5, C.woodDark, S.x, 0.25, S.z, { solid: true });
  box(2.6, 1.6, 0.25, C.board, S.x, 1.3, S.z, { solid: true });
  box(2.8, 0.12, 0.35, C.wood, S.x, 2.16, S.z);
  const digit = (x, y, lit) => box(0.34, 0.5, 0.04, lit ? C.line : C.grassDark, S.x + x, y, S.z + 0.14, { shadow: false });
  [[-0.85, 1.65, 1], [-0.4, 1.65, 1], [0.4, 1.65, 1], [0.85, 1.65, 0], [-0.85, 0.95, 1], [-0.4, 0.95, 0], [0.4, 0.95, 1], [0.85, 0.95, 1]]
    .forEach(([x, y, lit]) => digit(x, y, lit));
  // bench (decorative: you can reach under it)
  const B = { x: -2.8, z: 4.5 };
  box(2.2, 0.1, 0.55, C.wood, B.x, 0.62, B.z, { occlude: false });
  box(2.2, 0.5, 0.08, C.wood, B.x, 1.0, B.z - 0.3, { occlude: false });
  for (const dx of [-0.95, 0.95]) box(0.1, 0.6, 0.5, C.post, B.x + dx, 0.3, B.z, { occlude: false });
  // umpire chair
  const U = { x: 0, z: -4.2 };
  for (const [dx, dz] of [[-0.35, -0.3], [0.35, -0.3], [-0.35, 0.3], [0.35, 0.3]]) cyl(0.05, 0.05, 1.7, C.steel, U.x + dx, 0.85, U.z + dz);
  box(0.85, 0.1, 0.75, C.wood, U.x, 1.72, U.z);
  box(0.85, 0.7, 0.08, C.wood, U.x, 2.1, U.z - 0.34);
  ctx.solid(0.8, 1.8, 0.7, U.x, 0.9, U.z);
  // a few shrubs outside the court for scale
  for (const [x, z, r] of [[-7.6, -4.4, 0.55], [-7.7, 4.6, 0.45], [4.6, 4.9, 0.4], [7.4, 4.5, 0.5]]) {
    const s = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), mat(C.grassDark));
    s.position.set(x, r * 0.8, z); s.castShadow = true; s.receiveShadow = true; group.add(s);
  }

  // --- the three balls --------------------------------------------------------
  ball(0.2, C.ball, 3.4, 0.22, 1.6);
  ball(0.2, C.ball, B.x + 0.3, 0.22, B.z - 0.05);
  ball(0.2, C.ball, S.x - 0.5, 0.22, S.z - 0.5);

  // --- behaviour ---------------------------------------------------------------
  const FLIGHT = 0.85;
  let shot = null;      // time since the machine fired
  let gateT = null;     // time since the gate opened
  let recoil = 0;

  const fx = {
    loaded(_, state) {
      lamps.forEach((l, i) => { l.material = mat(i < state.counters.balls ? C.gold : C.off, i < state.counters.balls ? { emissive: 0x806000 } : {}); });
    },
    fire() {
      const d = hookAt.clone().sub(muzzle);
      const v = [d.x / FLIGHT, (d.y + 0.5 * G * FLIGHT * FLIGHT) / FLIGHT, d.z / FLIGHT];
      const b = ball(0.2, C.ball, muzzle.x, muzzle.y, muzzle.z, { velocity: v });
      b.body.linearDamping = 0;
      shot = 0; recoil = 1;
    },
    openGate() {
      gateT = 0;
      physics.removeStatic(gateBody);
      padlock.visible = false; shackle.visible = false;
    },
  };

  function update(dt) {
    if (shot !== null) {
      shot += dt;
      if (shot >= FLIGHT + 0.06) {
        shot = null;
        // the hit knocks the key off its hook; from now on it is a loose item
        key.position.copy(hookAt);
        item(key, { tag: 'key', shape: { box: [0.75, 0.3, 0.14] }, mass: 0.5, velocity: [-2.5, 2, 3.6] });
      }
    }
    recoil = Math.max(0, recoil - dt * 4);
    if (gateT !== null && gateT < 1) {
      gateT = Math.min(1, gateT + dt / 0.9);
      const e = 1 - Math.pow(1 - gateT, 3);
      for (const { pivot, side } of leaves) pivot.rotation.y = side * e * 1.75;
    }
  }

  return { update, fx };
}
