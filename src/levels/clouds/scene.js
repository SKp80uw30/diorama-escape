/**
 * Cloud Castles: three cloud islands floating over nothing.
 *   A (left, big)   castle wall with a portcullis gate, keep, turret with the red
 *                   crystal on top, three pedestals ('pedRed','pedYellow','pedBlue'),
 *                   a pebble
 *   B (front right) little shrine holding the yellow crystal
 *   C (back right)  bell tower ('bell' zone in the belfry) and a sleepy cloud
 *                   sitting on the blue crystal
 * Anything dropped into the gaps falls away and reappears where it started.
 */
const C = {
  cloud: '#ffffff', shade: '#c7d3d8', blush: '#e8c8e0', stone: '#f3eddf', stoneDark: '#c9bda9',
  roofRed: '#d9503c', roofBlue: '#3f6ea5', gold: '#e3c832', iron: '#3b4449', wood: '#9c6440',
  red: '#d9503c', yellow: '#f5e050', blue: '#6fa0c9', pebble: '#857f74', ink: '#2c3237', glowGold: '#fff3a8',
};
const RAINBOW = ['#d9503c', '#e08a5c', '#f5e050', '#7fb84f', '#6fa0c9', '#9d8cc0'];

export function build(ctx) {
  const { THREE, box, cyl, cone, sphere, add, item, zone, mat, glow, group, lights } = ctx;
  lights.sun.color.set(0xfff1d8); lights.sun.intensity = 3.0;
  lights.fill.color.set(0xe8c8e0); lights.fill.intensity = 0.7;
  lights.hemi.color.set(0xeaf4ff); lights.hemi.groundColor.set(0xc9bda9); lights.hemi.intensity = 0.7;
  ctx.bounds(7.8, 5.4);
  const fx = ctx.particles({ max: 300 });
  const rnd = (i) => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

  // --- islands ---------------------------------------------------------------------
  function island(x, z, w, d, top, seed) {
    const rx = w / 2, rz = d / 2;
    const slab = new THREE.Mesh(new THREE.CylinderGeometry(1, 0.82, 0.6, 20), mat(C.cloud));
    add(slab, x, top - 0.3, z, { scale: [rx, 1, rz] });
    const n = Math.round((w + d) * 1.5);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + seed, r = 0.42 + rnd(seed * 10 + i) * 0.32;
      sphere(r, i % 4 ? C.cloud : C.blush, x + Math.cos(a) * rx * 0.93, top - 0.5 + rnd(i + seed) * 0.15, z + Math.sin(a) * rz * 0.93, { occlude: false });
    }
    for (let i = 0; i < 6; i++) {
      const a = i + seed, r = 0.9 + rnd(seed + i * 3) * 0.6;
      sphere(r, i % 2 ? C.cloud : C.shade, x + Math.cos(a) * rx * 0.45, top - 0.9 - rnd(i * 7 + seed) * 0.4, z + Math.sin(a) * rz * 0.45, { occlude: false, shadow: false });
    }
    ctx.solid(w * 0.9, 1, d * 0.55, x, top - 0.5, z);
    ctx.solid(w * 0.55, 1, d * 0.9, x, top - 0.5, z);
    ctx.solid(w * 0.78, 1, d * 0.78, x, top - 0.5, z);
  }
  island(-3.0, 0.2, 9.0, 8.6, 0, 1);
  island(4.6, 2.9, 4.0, 3.6, 0.5, 2);
  island(5.0, -2.6, 4.0, 4.4, 1.0, 3);

  // --- castle on island A ----------------------------------------------------------
  const WZ = -1.4, WH = 1.9;
  box(3.0, WH, 0.5, C.stone, -5.1, WH / 2, WZ, { solid: true });
  box(2.0, WH, 0.5, C.stone, -1.4, WH / 2, WZ, { solid: true });
  box(1.4, 0.5, 0.6, C.stoneDark, -3.0, 1.65, WZ);
  for (let x = -6.4; x <= -0.4; x += 0.5) if (x < -3.7 || x > -2.3) box(0.25, 0.25, 0.55, C.stoneDark, x, WH + 0.12, WZ);
  for (const [x, c] of [[-4.6, C.red], [-1.8, C.blue]]) box(0.5, 0.9, 0.04, c, x, 1.25, WZ + 0.27, { shadow: false, occlude: false });
  // golden light beyond the gate
  box(1.15, 1.35, 0.05, C.glowGold, -3.0, 0.68, WZ - 0.4, { mat: glow(C.glowGold, 0.8), shadow: false, occlude: false });
  const port = new THREE.Group();
  group.add(port);
  for (let i = 0; i < 5; i++) box(0.07, 1.4, 0.07, C.iron, -3.5 + i * 0.25, 0.7, WZ, { parent: port });
  for (let j = 0; j < 3; j++) box(1.15, 0.07, 0.07, C.iron, -3.0, 0.3 + j * 0.45, WZ, { parent: port });
  const portBody = ctx.solid(1.2, 1.4, 0.3, -3.0, 0.7, WZ);
  // corner tower with a red roof and the flat turret with the red crystal
  cyl(0.75, 0.8, 2.8, C.stone, -6.8, 1.4, WZ, { solid: true, segments: 10 });
  cone(0.95, 1.3, C.roofRed, -6.8, 3.45, WZ, { segments: 10 });
  const T = { x: -0.15, z: WZ, h: 2.5 };
  cyl(0.75, 0.8, T.h, C.stone, T.x, T.h / 2, T.z, { solid: true, segments: 10 });
  for (let k = 0; k < 8; k++) {
    const a = (k * Math.PI) / 4;
    box(0.22, 0.28, 0.22, C.stoneDark, T.x + Math.cos(a) * 0.68, T.h + 0.14, T.z + Math.sin(a) * 0.68, { occlude: false });
  }
  // keep behind the wall
  box(3.0, 3.0, 2.0, C.stone, -3.4, 1.5, -3.1, { solid: true });
  for (const x of [-4.3, -2.5]) box(0.3, 0.55, 0.05, C.ink, x, 2.1, -2.08, { shadow: false, occlude: false });
  cyl(0.85, 0.9, 1.6, C.stone, -3.4, 3.8, -3.1, { segments: 10 });
  cone(1.05, 1.5, C.roofBlue, -3.4, 5.35, -3.1, { segments: 10 });
  cyl(0.03, 0.03, 0.8, C.iron, -3.4, 6.4, -3.1);
  const flag = box(0.55, 0.32, 0.03, C.red, -3.12, 6.6, -3.1, { shadow: false, occlude: false });

  // --- pedestals --------------------------------------------------------------------
  const peds = { red: { x: -4.7, z: 0.9 }, yellow: { x: -3.0, z: 1.5 }, blue: { x: -1.3, z: 0.9 } };
  const shown = {};
  const crystalGeo = () => new THREE.OctahedronGeometry(0.28, 0);
  for (const [name, p] of Object.entries(peds)) {
    cyl(0.48, 0.52, 0.2, C.stoneDark, p.x, 0.1, p.z, { segments: 10 });
    cyl(0.3, 0.34, 0.7, C.stone, p.x, 0.55, p.z, { segments: 10 });
    cyl(0.44, 0.4, 0.14, C[name], p.x, 0.97, p.z, { segments: 10 });
    ctx.solid(0.75, 1.04, 0.75, p.x, 0.52, p.z);
    zone(`ped${name[0].toUpperCase()}${name.slice(1)}`, [p.x - 0.5, 0.95, p.z - 0.5], [p.x + 0.5, 2.4, p.z + 0.5]);
    const c = add(new THREE.Mesh(crystalGeo(), glow(C[name], 0.7)), p.x, 1.48, p.z, { scale: [1, 1.5, 1], occlude: false });
    c.visible = false;
    shown[name] = c;
  }
  const crystal = (name, x, y, z, velocity) => {
    const m = new THREE.Mesh(crystalGeo(), glow(C[name], 0.45));
    m.scale.set(1, 1.5, 1);
    m.position.set(x, y, z);
    return item(m, { tag: name, shape: { box: [0.42, 0.62, 0.42] }, mass: 0.6, velocity });
  };
  crystal('red', T.x, T.h + 0.4, T.z);

  // pebble
  const pebble = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 0), mat(C.pebble));
  pebble.position.set(0.0, 0.25, 3.0);
  item(pebble, { tag: 'pebble', shape: { sphere: 0.2 }, mass: 0.5 });

  // --- shrine on island B (yellow crystal) ---------------------------------------
  const S = { x: 4.9, z: 3.2, y: 0.5 };
  box(1.4, 0.15, 1.4, C.stoneDark, S.x, S.y + 0.075, S.z);
  box(0.55, 0.5, 0.55, C.stone, S.x, S.y + 0.4, S.z, { solid: true });
  for (const [dx, dz] of [[-0.55, -0.55], [0.55, -0.55], [-0.55, 0.55], [0.55, 0.55]]) {
    cyl(0.06, 0.07, 1.4, C.stone, S.x + dx, S.y + 0.85, S.z + dz, { occlude: false });
  }
  add(new THREE.Mesh(new THREE.SphereGeometry(0.85, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2), mat(C.gold)), S.x, S.y + 1.55, S.z, { occlude: false });
  crystal('yellow', S.x, S.y + 1.0, S.z);

  // --- bell tower on island C -------------------------------------------------------
  const BT = { x: 5.8, z: -3.4, base: 1.0, top: 4.4 };
  const th = BT.top - BT.base;
  box(1.1, th, 1.1, C.stone, BT.x, BT.base + th / 2, BT.z, { solid: true });
  for (const y of [2.0, 3.2]) box(0.25, 0.45, 0.05, C.ink, BT.x, y, BT.z + 0.56, { shadow: false, occlude: false });
  box(1.25, 0.12, 1.25, C.stoneDark, BT.x, BT.top + 0.06, BT.z);
  for (const [dx, dz] of [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]]) {
    cyl(0.07, 0.07, 1.15, C.stone, BT.x + dx, BT.top + 0.65, BT.z + dz, { occlude: false });
  }
  cone(0.95, 0.9, C.roofRed, BT.x, BT.top + 1.68, BT.z, { segments: 4, rot: [0, Math.PI / 4, 0], occlude: false });
  const bell = new THREE.Group();
  bell.position.set(BT.x, BT.top + 1.15, BT.z);
  group.add(bell);
  const bellMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.34, 0.45, 10, 1, true), mat(C.gold, { side: THREE.DoubleSide }));
  bellMesh.position.y = -0.3;
  bellMesh.castShadow = true;
  bell.add(bellMesh);
  const clapper = new THREE.Mesh(new THREE.IcosahedronGeometry(0.07, 0), mat(C.iron));
  clapper.position.y = -0.5;
  bell.add(clapper);
  zone('bell', [BT.x - 0.75, BT.top + 0.05, BT.z - 0.75], [BT.x + 0.75, BT.top + 1.4, BT.z + 0.75]);

  // the sleepy cloud sitting on the blue crystal
  // (a lavender-grey puff with a face, turned toward the hero camera so it reads as a character)
  const SC = { x: 4.3, z: -1.3, y: 1.0 };
  const sleepy = new THREE.Group();
  sleepy.position.set(SC.x, SC.y, SC.z);
  sleepy.rotation.y = Math.PI / 4;
  group.add(sleepy);
  for (const [dx, dy, dz, r, c] of [[0, 0.6, 0, 0.72, C.shade], [-0.62, 0.42, 0, 0.5, C.shade], [0.62, 0.42, 0, 0.52, C.shade], [0.15, 1.05, -0.1, 0.48, C.cloud], [-0.25, 0.95, 0.05, 0.4, C.cloud]]) {
    sphere(r, c, dx, dy, dz, { parent: sleepy });
  }
  const eyes = [-0.24, 0.24].map((dx) => box(0.22, 0.05, 0.05, C.ink, dx, 0.7, 0.7, { parent: sleepy, shadow: false }));
  const cheeks = [-0.45, 0.45].map((dx) => box(0.16, 0.08, 0.05, C.blush, dx, 0.52, 0.64, { parent: sleepy, shadow: false }));
  box(0.14, 0.05, 0.05, C.ink, 0, 0.45, 0.71, { parent: sleepy, shadow: false });
  let zzzClock = 0;

  // --- birds and drifting puffs ------------------------------------------------------
  const birds = [0, 1, 2].map((i) => {
    const b = new THREE.Group();
    const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.03, 0.1), mat(C.ink));
    const wingR = wingL.clone();
    wingL.position.x = -0.14; wingR.position.x = 0.14;
    b.add(wingL, wingR);
    group.add(b);
    return { b, wingL, wingR, off: i * 2.1 };
  });
  const puffs = [[-6.5, -1.2, 4.2], [1.9, -0.8, 0.2], [2.2, 2.2, -4.6], [-1.0, -1.6, 4.8], [7.0, 3.2, 0.8]].map(([x, y, z], i) => {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    group.add(g);
    for (let k = 0; k < 3; k++) sphere(0.35 + k * 0.08, C.cloud, (k - 1) * 0.4, (k % 2) * 0.12, 0, { parent: g, shadow: false });
    return { g, x, speed: 0.15 + i * 0.03 };
  });

  // --- rainbow (hidden until the end) ---------------------------------------------
  const rainbow = new THREE.Group();
  rainbow.position.set(-3.0, 0.3, WZ + 0.3);
  rainbow.scale.setScalar(0.001);
  group.add(rainbow);
  RAINBOW.forEach((c, i) => {
    const arc = new THREE.Mesh(new THREE.TorusGeometry(2.9 - i * 0.17, 0.09, 4, 24, Math.PI), glow(c, 0.7));
    rainbow.add(arc);
  });

  // --- behaviour ---------------------------------------------------------------------
  let ringT = null, rainbowT = null, cloudGone = false;
  const effects = {
    ring() {
      ringT = 0;
      fx.burst([BT.x, BT.top + 0.9, BT.z], { count: 26, speed: 2.2, colors: [0xfff3a8, 0xffffff], life: 0.9, gravity: 0, drag: 2 });
    },
    place(name) {
      shown[name].visible = true;
      const p = peds[name];
      fx.burst([p.x, 1.5, p.z], { count: 30, speed: 2, colors: [new THREE.Color(C[name]).getHex(), 0xffffff], life: 1, gravity: 0, drag: 2 });
    },
    rainbow() {
      rainbowT = 0;
      ctx.physics.removeStatic(portBody);
    },
  };

  function update(dt, t) {
    fx.update(dt);
    flag.rotation.y = Math.sin(t * 3) * 0.3;
    for (const p of puffs) {
      p.g.position.x = ((p.x + t * p.speed + 9) % 18) - 9;
      p.g.position.y += Math.sin(t + p.x) * 0.0015;
    }
    for (const b of birds) {
      const a = t * 0.45 + b.off;
      b.b.position.set(-2.5 + Math.cos(a) * 3.6, 4.6 + Math.sin(t * 0.9 + b.off) * 0.3, 0.3 + Math.sin(a) * 2.6);
      b.b.rotation.y = -a;
      const flap = Math.sin(t * 8 + b.off) * 0.6;
      b.wingL.rotation.z = flap; b.wingR.rotation.z = -flap;
    }
    if (!cloudGone && ringT === null) {
      sleepy.position.y = SC.y + Math.sin(t * 1.3) * 0.05;
      zzzClock += dt;
      if (zzzClock > 0.9) { // little snore puffs
        zzzClock = 0;
        fx.spawn({ pos: [SC.x + 0.5, SC.y + 1.3, SC.z + 0.3], vel: [0.25, 0.45, 0.1], color: 0x9d8cc0, life: 2.2, scale: 0.9 });
      }
    }
    for (const s of shown ? Object.values(shown) : []) if (s.visible) s.rotation.y = t * 1.2;
    if (ringT !== null) {
      ringT += dt;
      bell.rotation.z = Math.sin(ringT * 10) * 0.5 * Math.exp(-ringT * 1.2);
      // the cloud opens its eyes, then drifts up and away
      if (ringT > 0.4) eyes.forEach((e) => { e.scale.set(0.6, 3, 1); });
      if (ringT > 0.9 && !cloudGone) {
        const k = Math.min(1, (ringT - 0.9) / 2.2);
        sleepy.position.set(SC.x + k * 3.5, SC.y + k * k * 4.5, SC.z - k * 1.5);
        sleepy.scale.setScalar(1 - k * 0.6);
        cheeks.forEach((c) => { c.visible = k < 0.5; });
        if (k >= 1) { cloudGone = true; sleepy.visible = false; }
      }
      if (ringT > 1.4 && ringT - dt <= 1.4) {
        crystal('blue', SC.x, SC.y + 0.45, SC.z, [0, 1.5, 0]);
        fx.burst([SC.x, SC.y + 0.5, SC.z], { count: 24, speed: 1.6, colors: [0x6fa0c9, 0xffffff], life: 1, gravity: 0, drag: 2 });
      }
    }
    if (rainbowT !== null) {
      rainbowT += dt;
      const k = Math.min(1, rainbowT / 1.4);
      rainbow.scale.setScalar(Math.max(0.001, 1 - Math.pow(1 - k, 3)));
      const g = Math.min(1, Math.max(0, (rainbowT - 0.8) / 1.0));
      port.position.y = g * 1.45;
      if (rainbowT < 2.5 && Math.random() < 0.5) {
        fx.spawn({ pos: [-3.0 + (Math.random() - 0.5) * 5, 0.5 + Math.random() * 3, WZ + 0.3], vel: [0, 0.6, 0], color: 0xfff3a8, life: 1.2, scale: 1 });
      }
    }
  }

  return { update, fx: effects };
}
