/**
 * Hot Air Balloons: a launch meadow at sunrise, other balloons already aloft.
 *   centre       our basket ('basket' zone) with burner; the envelope lies
 *                deflated beside it; tethered to a stake that can be pulled up
 *                once the balloon is inflated, and stowed in the basket
 *   around it    three sandbags: two by the basket, one on the hay wagon
 *   front right  chalk-ringed ballast pile ('pile' zone)
 *   back left    shed, with the gas canister hidden behind it
 */
const C = {
  grass: '#7fb84f', grassDark: '#5a9e45', soil: '#71452e', wicker: '#b97d55', wickerDark: '#71452e',
  steel: '#9ba7ab', steelDark: '#51575c', flame: '#f5e050', flameCore: '#ef6a52', red: '#d9503c', yellow: '#f5e050',
  sand: '#c2aa70', sandDark: '#9e8858', white: '#f3eddf', wood: '#9c6440', woodDark: '#62452f', roof: '#a8502f',
  trunk: '#62452f', leaf: '#3f8440', leafDark: '#2e6b3a', hay: '#e3c832', rope: '#efe0b8',
};
export const ENVELOPES = [
  { pos: [-6.0, 4.0, -2.6], r: 0.85, colors: ['#6fa0c9', '#f3eddf'] },
  { pos: [-2.0, 4.6, -4.4], r: 0.95, colors: ['#7fb84f', '#f5e050'] },
  { pos: [3.6, 4.2, -4.2], r: 0.9, colors: ['#9d8cc0', '#e8c8e0'] },
  { pos: [6.8, 4.8, -1.4], r: 0.8, colors: ['#e08a5c', '#f3eddf'] },
];

export function build(ctx) {
  const { THREE, box, cyl, cone, sphere, add, rod, item, zone, mat, glow, group, lights } = ctx;
  lights.sun.color.set(0xfff0d8); lights.sun.intensity = 3.2;
  lights.hemi.color.set(0xcfe8ff); lights.hemi.groundColor.set(0x5a9e45); lights.hemi.intensity = 0.45;
  ctx.slab(8.4, 5.6, C.grass, C.soil, 0.5);
  const fx = ctx.particles({ max: 300 });
  const deco = { occlude: false };

  function envelope(r, colors, gores = 10) {
    const outer = new THREE.Group();
    const g = new THREE.Group();
    g.scale.y = 1.15;
    outer.add(g);
    for (let i = 0; i < gores; i++) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(r, 2, 10, (i * 2 * Math.PI) / gores, (2 * Math.PI) / gores, 0, Math.PI * 0.78), mat(colors[i % colors.length]));
      m.castShadow = true;
      g.add(m);
    }
    const throat = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.64, r * 0.3, r * 0.45, 10, 1, true), mat(colors[0], { side: THREE.DoubleSide }));
    throat.position.y = -r;
    g.add(throat);
    return outer;
  }

  // --- other balloons, already flying -----------------------------------------------
  const flyers = ENVELOPES.map(({ pos, r, colors }, i) => {
    const b = new THREE.Group();
    b.position.set(...pos);
    group.add(b);
    b.add(envelope(r, colors));
    const bk = new THREE.Mesh(new THREE.BoxGeometry(r * 0.45, r * 0.35, r * 0.45), mat(C.wicker));
    bk.position.y = -r * 1.75;
    b.add(bk);
    for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, r * 0.65, 3), mat(C.rope));
      rope.position.set(dx * r * 0.2, -r * 1.33, dz * r * 0.2);
      b.add(rope);
    }
    b.traverse((m) => { m.castShadow = true; });
    return { b, base: pos, off: i * 1.7 };
  });

  // --- our balloon --------------------------------------------------------------------
  const B = { x: 0.4, z: 0.6 };
  const rig = new THREE.Group();
  group.add(rig);
  const R = { parent: rig, occlude: true };
  box(1.3, 0.08, 1.3, C.wickerDark, B.x, 0.04, B.z, R);
  for (const [dx, dz, w, d] of [[0.6, 0, 0.1, 1.3], [-0.6, 0, 0.1, 1.3], [0, 0.6, 1.3, 0.1], [0, -0.6, 1.3, 0.1]]) {
    box(w, 0.95, d, C.wicker, B.x + dx, 0.5, B.z + dz, R);
    box(w + 0.06, 0.1, d + 0.06, C.wickerDark, B.x + dx, 1.0, B.z + dz, R);
    for (const y of [0.3, 0.65]) box(w + 0.02, 0.04, d + 0.02, C.wickerDark, B.x + dx, y, B.z + dz, { parent: rig });
    ctx.solid(w, 1.0, d, B.x + dx, 0.5, B.z + dz);
  }
  for (const [dx, dz] of [[-0.55, -0.55], [0.55, -0.55], [-0.55, 0.55], [0.55, 0.55]]) {
    rod([B.x + dx, 1.0, B.z + dz], [B.x + dx * 0.3, 2.15, B.z + dz * 0.3], 0.03, C.steelDark, { parent: rig });
  }
  cyl(0.22, 0.18, 0.3, C.steel, B.x, 2.2, B.z, { parent: rig });
  const flame = cone(0.15, 0.55, C.flame, B.x, 2.65, B.z, { parent: rig, mat: glow(C.flame, 1) });
  flame.visible = false;
  const tank = cyl(0.2, 0.2, 0.6, C.red, B.x - 0.3, 0.38, B.z - 0.3, { parent: rig });
  tank.visible = false;
  zone('basket', [B.x - 0.55, 0.1, B.z - 0.55], [B.x + 0.55, 2.0, B.z + 0.55]);

  const env = envelope(1.8, [C.red, C.yellow], 12);
  rig.add(env);
  const DEFLATED = { pos: new THREE.Vector3(B.x - 2.4, 0.42, B.z - 0.4), scale: new THREE.Vector3(0.24, 0.72, 0.8), rotZ: Math.PI / 2 };
  const INFLATED = { pos: new THREE.Vector3(B.x, 4.75, B.z), scale: new THREE.Vector3(1, 1, 1), rotZ: 0 };
  env.position.copy(DEFLATED.pos);
  env.scale.copy(DEFLATED.scale);
  env.rotation.z = DEFLATED.rotZ;
  const ropes = [[-0.55, -0.55], [0.55, -0.55], [-0.55, 0.55], [0.55, 0.55]].map(([dx, dz]) =>
    rod([B.x + dx, 1.0, B.z + dz], [B.x + dx * 1.6, 2.75, B.z + dz * 1.6], 0.02, C.rope, { parent: rig }));
  ropes.forEach((r) => { r.visible = false; });

  // tether stake
  const ST = { x: 2.6, z: 2.5 };
  const stake = cyl(0.07, 0.04, 0.7, C.woodDark, ST.x, 0.3, ST.z, { rot: [0.25, 0, -0.2], occlude: false });
  const knot = [B.x + 0.6, 0.85, B.z + 0.6];
  const tether = rod(knot, [ST.x - 0.05, 0.55, ST.z], 0.03, C.rope);
  let loose = null; // the stake becomes a loose item once the balloon is ready
  const ropeFrom = new THREE.Vector3(...knot), ropeTo = new THREE.Vector3(), yAxis = new THREE.Vector3(0, 1, 0);

  // --- sandbags and the ballast pile -------------------------------------------------
  const bagMesh = (x, y, z) => {
    const g = new THREE.Group();
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.32, 0.32), mat(C.sand));
    const tie = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 0.1, 6), mat(C.sandDark));
    tie.position.y = 0.2;
    g.add(b, tie);
    g.position.set(x, y, z);
    return g;
  };
  const bag = (x, y, z) => item(bagMesh(x, y, z), { tag: 'sandbag', shape: { box: [0.42, 0.34, 0.32] }, mass: 1.2 });
  bag(B.x + 0.9, 0.17, B.z + 1.0);
  bag(B.x + 1.15, 0.17, B.z - 0.3);

  const PL = { x: 4.6, z: 3.1 };
  add(new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.04, 3, 20), mat(C.white)), PL.x, 0.02, PL.z, { rot: [Math.PI / 2, 0, 0], shadow: false, occlude: false });
  cyl(0.04, 0.04, 1.1, C.woodDark, PL.x + 1.0, 0.55, PL.z - 0.6);
  box(0.6, 0.4, 0.04, C.white, PL.x + 1.0, 1.0, PL.z - 0.58);
  box(0.28, 0.2, 0.02, C.sand, PL.x + 1.0, 0.98, PL.z - 0.55, { shadow: false });
  zone('pile', [PL.x - 0.9, 0, PL.z - 0.9], [PL.x + 0.9, 1.6, PL.z + 0.9]);
  const stacked = [[-0.24, 0.17, 0], [0.24, 0.17, 0], [0, 0.49, 0]].map(([dx, y, dz]) => {
    const g = bagMesh(PL.x + dx, y, PL.z + dz);
    g.visible = false;
    g.traverse((m) => { m.castShadow = true; });
    group.add(g);
    return g;
  });

  // --- hay wagon (third sandbag) -------------------------------------------------------
  const WG = { x: -4.6, z: 2.8 };
  box(2.0, 0.15, 1.1, C.wood, WG.x, 0.72, WG.z, { solid: true });
  for (const dz of [-0.55, 0.55]) box(2.0, 0.25, 0.06, C.woodDark, WG.x, 0.9, WG.z + dz);
  for (const [dx, dz] of [[-0.7, -0.6], [0.7, -0.6], [-0.7, 0.6], [0.7, 0.6]]) {
    cyl(0.32, 0.32, 0.08, C.woodDark, WG.x + dx, 0.32, WG.z + dz, { rot: [Math.PI / 2, 0, 0], segments: 10 });
  }
  ctx.solid(2.0, 0.8, 1.1, WG.x, 0.4, WG.z);
  cyl(0.38, 0.38, 0.9, C.hay, WG.x - 0.45, 1.17, WG.z, { rot: [Math.PI / 2, 0, 0], segments: 10, solid: false });
  ctx.solid(0.8, 0.8, 0.9, WG.x - 0.45, 1.17, WG.z);
  rod([WG.x + 1.0, 0.75, WG.z], [WG.x + 1.9, 0.3, WG.z], 0.04, C.woodDark);
  bag(WG.x + 0.45, 0.97, WG.z);

  // --- shed (gas canister hidden behind) ---------------------------------------------
  const SH = { x: -5.6, z: -3.2 };
  box(2.4, 1.8, 1.8, C.wood, SH.x, 0.9, SH.z, { solid: true });
  for (const s of [-1, 1]) box(2.6, 0.1, 1.2, C.roof, SH.x, 2.08, SH.z + s * 0.5, { rot: [s * 0.5, 0, 0] });
  box(0.7, 1.3, 0.05, C.woodDark, SH.x + 0.4, 0.65, SH.z + 0.92);
  box(0.4, 0.35, 0.05, C.white, SH.x - 0.6, 1.1, SH.z + 0.92, { shadow: false });
  const can = new THREE.Group();
  const cb = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.62, 10), mat(C.red));
  const valve = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.14, 6), mat(C.steelDark));
  valve.position.y = 0.38;
  can.add(cb, valve);
  can.position.set(SH.x + 0.2, 0.33, SH.z - 1.4);
  item(can, { tag: 'gas', shape: { box: [0.44, 0.76, 0.44] }, mass: 1 });

  // --- meadow dressing -----------------------------------------------------------------
  for (const [x, z, s] of [[-7.4, -4.6, 1], [-7.6, 0.2, 0.8], [7.6, 4.8, 0.9], [7.5, -4.6, 1.1], [-2.6, -4.9, 0.8], [-7.3, 4.8, 0.7]]) {
    cyl(0.1 * s, 0.14 * s, 0.8 * s, C.trunk, x, 0.4 * s, z, { solid: true });
    sphere(0.65 * s, C.leaf, x, 1.15 * s, z, { detail: 0 });
    sphere(0.45 * s, C.leafDark, x + 0.2 * s, 1.6 * s, z - 0.1 * s, { detail: 0, occlude: false });
  }
  for (let x = -2.0; x <= 3.6; x += 0.9) {
    box(0.08, 0.7, 0.08, C.woodDark, x, 0.35, -5.2, deco);
    if (x < 3.5) box(0.9, 0.06, 0.04, C.woodDark, x + 0.45, 0.5, -5.2, deco);
  }
  for (let i = 0; i < 26; i++) {
    const h = Math.sin(i * 77.7) * 999, x = ((h % 1) + 1) % 1 * 15 - 7.5, z = ((Math.sin(i * 12.3) * 999 % 1) + 1) % 1 * 10 - 5;
    if (Math.hypot(x - B.x, z - B.z) < 3 || Math.hypot(x - PL.x, z - PL.z) < 1.4) continue;
    box(0.1, 0.1, 0.1, ['#f5e050', '#ffffff', '#e8c8e0', '#ef6a52'][i % 4], x, 0.06, z, { shadow: false, occlude: false });
  }
  // windsock
  const WS = { x: 6.9, z: -4.0 };
  cyl(0.04, 0.05, 2.2, C.steelDark, WS.x, 1.1, WS.z);
  const sock = new THREE.Group();
  sock.position.set(WS.x, 2.1, WS.z);
  group.add(sock);
  for (let i = 0; i < 3; i++) cyl(0.16 - i * 0.03, 0.13 - i * 0.03, 0.28, i % 2 ? C.white : C.red, 0, 0, 0.14 + i * 0.28, { rot: [Math.PI / 2, 0, 0], parent: sock, segments: 8 });

  // --- behaviour -------------------------------------------------------------------------
  let inflateT = null, liftT = null, burnClock = 0;
  const effects = {
    stack(_, state) {
      stacked.forEach((g, i) => { g.visible = i < state.counters.bags; });
      fx.burst([PL.x, 0.4, PL.z], { count: 16, speed: 1.4, colors: [0xc2aa70, 0x9e8858], life: 0.6, gravity: -4, drag: 1 });
    },
    fuel() {
      tank.visible = true;
      flame.visible = true;
      flame.scale.setScalar(0.4);
    },
    inflate() {
      inflateT = 0;
      stake.visible = false;
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.04, 0.7, 10), mat(C.woodDark));
      m.position.set(ST.x, 0.36, ST.z);
      loose = item(m, { tag: 'stake', shape: { box: [0.16, 0.7, 0.16] }, mass: 0.4 });
    },
    liftoff() {
      liftT = 0;
      tether.visible = false;
      loose = null;
      fx.burst([B.x + 0.6, 0.85, B.z + 0.6], { count: 14, speed: 1.6, colors: [0xefe0b8], life: 0.6, gravity: -5, drag: 1 });
    },
  };

  function update(dt, t) {
    fx.update(dt);
    for (const f of flyers) {
      f.b.position.set(f.base[0] + Math.sin(t * 0.15 + f.off) * 0.6, f.base[1] + Math.sin(t * 0.6 + f.off) * 0.3, f.base[2]);
    }
    sock.rotation.y = 0.9 + Math.sin(t * 0.7) * 0.25;
    if (loose?.alive) { // the tether follows the stake while it is carried
      ropeTo.copy(loose.mesh.position);
      tether.position.copy(ropeFrom).add(ropeTo).multiplyScalar(0.5);
      tether.scale.y = Math.max(0.05, ropeFrom.distanceTo(ropeTo) / tether.geometry.parameters.height);
      tether.quaternion.setFromUnitVectors(yAxis, ropeTo.clone().sub(ropeFrom).normalize());
    }
    sock.rotation.x = Math.sin(t * 1.9) * 0.08;
    if (flame.visible) {
      const base = inflateT === null ? 0.4 : 1;
      flame.scale.set(base, base * (0.85 + Math.sin(t * 23) * 0.15), base);
      burnClock += dt;
      if (inflateT !== null && burnClock > 0.05) {
        burnClock = 0;
        fx.spawn({ pos: [B.x, 2.9, B.z], vel: [(Math.random() - 0.5) * 0.4, 2.5, (Math.random() - 0.5) * 0.4], color: Math.random() < 0.5 ? 0xf5e050 : 0xef6a52, life: 0.4, scale: 1 });
      }
    }
    if (inflateT !== null && inflateT < 1) {
      inflateT = Math.min(1, inflateT + dt / 2.6);
      const k = inflateT * inflateT * (3 - 2 * inflateT);
      env.position.lerpVectors(DEFLATED.pos, INFLATED.pos, k);
      env.scale.lerpVectors(DEFLATED.scale, INFLATED.scale, k);
      env.rotation.z = DEFLATED.rotZ * (1 - k);
      if (inflateT >= 1) ropes.forEach((r) => { r.visible = true; });
    }
    if (inflateT >= 1 && liftT === null) env.position.y = INFLATED.pos.y + Math.sin(t * 2.2) * 0.05;
    if (liftT !== null) {
      liftT += dt;
      const k = Math.min(liftT, 5);
      rig.position.set(k * k * 0.12, k * k * 0.45, -k * k * 0.06);
    }
  }

  return { update, fx: effects };
}
