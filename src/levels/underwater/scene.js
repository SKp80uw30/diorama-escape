/**
 * Underwater City, on a sandy seabed:
 *   ruined arch (centre left) with an anchor lying on top
 *   giant clam (front)        -> 'clam' zone, opens when the anchor lands on it
 *   beacon (right)            -> 'beacon' zone, takes the pearl and powers the city
 *   airlock bunker (back right): put the fallen wheel back ('hatch' zone) = the exit
 * Ambient: swaying kelp, circling fish, bubble vents.
 */
const C = {
  sand: '#dcc890', sandDark: '#c2aa70', deep: '#164456', rock: '#615d55', rockDark: '#463f38',
  stone: '#e1d7c5', stoneDark: '#a89c88', glass: '#80cecf', teal: '#338b98', tealDark: '#206577',
  kelp: '#3f8440', kelpDark: '#245432', coral: '#ef6a52', pink: '#e8c8e0', violet: '#9d8cc0',
  clam: '#9d8cc0', clamIn: '#e8c8e0', gold: '#e3c832', iron: '#51575c', ironDark: '#3b4449',
  off: '#2c3237', light: '#fff3a8', red: '#d9503c', green: '#7fb84f', fish: '#f5e050', fish2: '#e08a5c',
  pearl: '#ffffff', bubble: '#bce9e4',
};

export function build(ctx) {
  const { THREE, box, cyl, cone, sphere, add, item, zone, mat, glow, group, lights } = ctx;
  lights.sun.color.set(0xb8ecf2); lights.sun.intensity = 2.5;
  lights.fill.color.set(0x54aeb6); lights.fill.intensity = 0.9;
  lights.hemi.color.set(0x80cecf); lights.hemi.groundColor.set(0x206577); lights.hemi.intensity = 1.0;
  ctx.slab(8.2, 5.4, C.sand, C.deep, 0.6);
  const fx = ctx.particles({ max: 500 });
  const flat = { shadow: false, occlude: false };

  // --- seabed dressing ---------------------------------------------------------
  for (let i = 0; i < 8; i++) box(2.4 + (i % 3), 0.03, 0.12, C.sandDark, -4 + ((i * 3.7) % 9), 0.015, -4.4 + i * 1.25, flat);
  for (const [x, z, r] of [[-7.2, -4.6, 0.6], [7.4, 4.6, 0.5], [-3.6, 4.7, 0.4], [3.4, -1.9, 0.35], [7.5, 1.2, 0.45]]) {
    sphere(r, C.rock, x, r * 0.35, z, { scale: [1, 0.6, 1], detail: 0 });
  }
  for (const [x, z, c] of [[-4.6, 4.2, C.coral], [-4.2, 4.5, C.pink], [5.9, 3.0, C.violet], [6.3, 3.3, C.coral], [-0.6, -2.3, C.pink]]) {
    for (let k = 0; k < 3; k++) cyl(0.05, 0.09, 0.5 + k * 0.18, c, x + (k - 1) * 0.16, 0.25 + k * 0.09, z + (k % 2) * 0.12, { rot: [0, 0, (k - 1) * 0.35], occlude: false });
  }

  // --- glass dome (back left) -------------------------------------------------
  const D = { x: -4.9, z: -2.9 };
  cyl(2.15, 2.25, 0.35, C.stone, D.x, 0.175, D.z, { segments: 16 });
  add(new THREE.Mesh(new THREE.SphereGeometry(1.9, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(C.glass)), D.x, 0.35, D.z);
  ctx.solid(3.2, 2.3, 3.2, D.x, 1.15, D.z);
  for (let i = 0; i < 3; i++) {
    const rib = new THREE.Mesh(new THREE.TorusGeometry(1.93, 0.05, 4, 16, Math.PI), mat(C.tealDark));
    add(rib, D.x, 0.35, D.z, { rotY: (i * Math.PI) / 3, occlude: false });
  }
  cyl(0.1, 0.12, 0.9, C.stoneDark, D.x, 2.6, D.z);
  cone(0.22, 0.5, C.gold, D.x, 3.3, D.z);
  const domeRing = add(new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.07, 4, 24), mat(C.off)), D.x, 0.38, D.z, { rot: [Math.PI / 2, 0, 0], occlude: false });

  // --- towers (back) -----------------------------------------------------------
  const windows = [];
  function tower(x, z, r, h, roof) {
    cyl(r, r * 1.1, h, C.stone, x, h / 2, z, { solid: true, segments: 10 });
    cyl(r * 1.18, r * 1.18, 0.18, C.stoneDark, x, h + 0.09, z, { segments: 10 });
    cone(r * 1.15, r * 1.7, roof, x, h + 0.18 + r * 0.85, z, { segments: 10 });
    for (let row = 0; row * 0.8 + 0.7 < h - 0.3; row++) {
      for (let k = 0; k < 6; k++) {
        const a = (k * Math.PI) / 3 + row * 0.5;
        windows.push(box(0.14, 0.3, 0.06, C.off, x + Math.cos(a) * r * 1.03, 0.7 + row * 0.8, z + Math.sin(a) * r * 1.03,
          { rotY: Math.PI / 2 - a, shadow: false, occlude: false }));
      }
    }
  }
  tower(-1.1, -4.2, 0.75, 3.2, C.teal);
  tower(1.3, -4.5, 0.6, 2.4, C.violet);
  tower(3.2, -4.0, 0.48, 1.7, C.coral);
  box(1.6, 0.18, 0.4, C.stoneDark, 0.1, 2.0, -4.35);

  // --- columns (left edge) -----------------------------------------------------
  for (const [z, h] of [[-0.6, 2.4], [1.2, 1.1], [3.0, 2.4]]) {
    box(0.75, 0.2, 0.75, C.stoneDark, -7.0, 0.1, z);
    cyl(0.26, 0.3, h, C.stone, -7.0, 0.2 + h / 2, z, { solid: true, segments: 8 });
    if (h > 2) box(0.75, 0.2, 0.75, C.stoneDark, -7.0, 0.3 + h, z);
  }
  cyl(0.28, 0.28, 1.2, C.stone, -5.9, 0.28, 2.2, { rot: [0, 0.6, Math.PI / 2], segments: 8 });

  // --- arch with the anchor on top ---------------------------------------------
  const A = { x: -2.4, z: 1.0 };
  for (const dx of [-0.95, 0.95]) {
    box(0.55, 2.0, 0.65, C.stone, A.x + dx, 1.0, A.z, { solid: true });
    box(0.7, 0.16, 0.8, C.stoneDark, A.x + dx, 0.08, A.z);
  }
  box(2.7, 0.42, 0.8, C.stoneDark, A.x, 2.21, A.z, { solid: true });
  const anchor = new THREE.Group();
  const iron = mat(C.ironDark);
  const part = (geo, x, y, z, rz = 0) => { const m = new THREE.Mesh(geo, iron); m.position.set(x, y, z); m.rotation.z = rz; anchor.add(m); };
  part(new THREE.BoxGeometry(0.12, 1.0, 0.12), 0, 0, 0);
  part(new THREE.TorusGeometry(0.13, 0.04, 5, 10), 0, 0.62, 0);
  part(new THREE.BoxGeometry(0.62, 0.09, 0.09), 0, 0.4, 0);
  part(new THREE.TorusGeometry(0.36, 0.06, 5, 10, Math.PI), 0, -0.2, 0, Math.PI);
  part(new THREE.ConeGeometry(0.1, 0.22, 4), 0.36, -0.12, 0);
  part(new THREE.ConeGeometry(0.1, 0.22, 4), -0.36, -0.12, 0);
  anchor.position.set(A.x, 2.85, A.z);
  anchor.rotation.z = Math.PI / 2;
  item(anchor, { tag: 'anchor', shape: { box: [0.8, 1.2, 0.3] }, mass: 3 });

  // --- giant clam (front) -------------------------------------------------------
  const K = { x: 1.2, z: 3.0 };
  const shellMat = mat(C.clam, { side: THREE.DoubleSide });
  add(new THREE.Mesh(new THREE.SphereGeometry(0.95, 12, 5, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), shellMat), K.x, 0.42, K.z, { scale: [1, 0.45, 0.85] });
  const lid = new THREE.Group();
  lid.position.set(K.x, 0.42, K.z - 0.8);
  group.add(lid);
  const top = new THREE.Mesh(new THREE.SphereGeometry(0.95, 12, 5, 0, Math.PI * 2, 0, Math.PI / 2), shellMat);
  top.scale.set(1, 0.42, 0.85);
  top.position.z = 0.8;
  top.castShadow = true;
  lid.add(top);
  for (let i = -2; i <= 2; i++) {
    const ridge = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 1.5), mat(C.violet));
    ridge.position.set(i * 0.3, 0.3 - Math.abs(i) * 0.05, 0.8);
    ridge.rotation.z = i * 0.25;
    lid.add(ridge);
  }
  ctx.solid(1.7, 0.45, 1.5, K.x, 0.225, K.z);
  zone('clam', [K.x - 0.95, 0.3, K.z - 0.85], [K.x + 0.95, 2.0, K.z + 0.85]);
  const inside = sphere(0.7, C.clamIn, K.x, 0.42, K.z, { scale: [1, 0.12, 0.85], occlude: false, shadow: false });
  inside.visible = false;

  // --- beacon (right) -------------------------------------------------------------
  const B = { x: 4.8, z: 0.6 };
  cyl(0.62, 0.72, 0.35, C.stoneDark, B.x, 0.175, B.z, { segments: 12 });
  cyl(0.22, 0.3, 1.5, C.stone, B.x, 1.1, B.z, { segments: 8 });
  ctx.solid(0.55, 1.85, 0.55, B.x, 0.92, B.z);
  cyl(0.48, 0.22, 0.35, C.gold, B.x, 2.0, B.z, { open: true, segments: 12 });
  ctx.solid(0.5, 0.06, 0.5, B.x, 1.86, B.z);
  for (const [dx, dz, w, d] of [[0.42, 0, 0.06, 0.8], [-0.42, 0, 0.06, 0.8], [0, 0.42, 0.8, 0.06], [0, -0.42, 0.8, 0.06]]) {
    ctx.solid(w, 0.35, d, B.x + dx, 2.0, B.z + dz);
  }
  zone('beacon', [B.x - 0.55, 1.75, B.z - 0.55], [B.x + 0.55, 3.2, B.z + 0.55]);
  const litPearl = sphere(0.2, C.pearl, B.x, 2.08, B.z, { mat: glow(C.pearl, 1), occlude: false });
  litPearl.visible = false;

  // --- airlock bunker (back right): the exit -------------------------------------
  const H = { x: 6.4, z: -3.6 };
  box(3.0, 2.4, 2.6, C.iron, H.x, 1.2, H.z, { solid: true });
  box(3.2, 0.2, 2.8, C.ironDark, H.x, 2.5, H.z);
  cyl(0.9, 0.9, 2.6, C.iron, H.x, 2.5, H.z, { rot: [Math.PI / 2, 0, 0], segments: 10 });
  for (const dx of [-1.3, 1.3]) cyl(0.12, 0.12, 2.2, C.ironDark, H.x + dx, 0.6, H.z + 1.32, { rot: [0, 0, 0] });
  const doorZ = H.z + 1.3;
  add(new THREE.Mesh(new THREE.TorusGeometry(0.82, 0.1, 5, 16), mat(C.ironDark)), H.x, 1.1, doorZ + 0.02);
  cyl(0.72, 0.72, 0.04, C.off, H.x, 1.1, doorZ - 0.01, { rot: [Math.PI / 2, 0, 0], segments: 16, occlude: false });
  const door = new THREE.Group();
  door.position.set(H.x - 0.74, 1.1, doorZ + 0.06);
  group.add(door);
  cyl(0.72, 0.72, 0.12, C.teal, 0.74, 0, 0, { rot: [Math.PI / 2, 0, 0], segments: 16, parent: door });
  const wheel = new THREE.Group();
  wheel.position.set(0.74, 0, 0.14);
  door.add(wheel);
  add(new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.05, 5, 12), mat(C.gold)), 0, 0, 0, { parent: wheel });
  box(0.72, 0.07, 0.07, C.gold, 0, 0, 0, { parent: wheel });
  box(0.07, 0.72, 0.07, C.gold, 0, 0, 0, { parent: wheel });
  cyl(0.08, 0.08, 0.12, C.gold, 0, 0, 0.04, { rot: [Math.PI / 2, 0, 0], parent: wheel });
  wheel.visible = false; // fitted when the player brings the loose wheel back
  zone('hatch', [H.x - 1.0, 0.2, doorZ], [H.x + 1.0, 3.2, doorZ + 1.1]);
  // the loose wheel, lying in the sand in front of the columns
  const loose = new THREE.Group();
  loose.add(new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.05, 5, 12), mat(C.gold)));
  for (const [w, h] of [[0.72, 0.07], [0.07, 0.72]]) loose.add(new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.07), mat(C.gold)));
  loose.position.set(-5.3, 0.09, 0.4);
  loose.rotation.x = -Math.PI / 2;
  item(loose, { tag: 'wheel', shape: { box: [0.8, 0.8, 0.14] }, mass: 0.8 });
  const doorLamps = [-0.5, 0.5].map((dx) => box(0.2, 0.14, 0.1, C.red, H.x + dx, 2.1, doorZ + 0.05, { mat: glow(C.red, 0.6), shadow: false }));

  // --- kelp, vents, fish ------------------------------------------------------------
  const kelps = [];
  for (const [x, z, n] of [[-6.0, 4.3, 6], [-5.5, 4.6, 4], [6.0, 4.0, 5], [5.5, 4.4, 7], [2.8, -1.4, 5], [-3.9, 3.5, 4], [7.2, -0.6, 6], [-0.4, 4.6, 4]]) {
    let parent = group;
    const segs = [];
    for (let i = 0; i < n; i++) {
      const g = new THREE.Group();
      if (i === 0) g.position.set(x, 0, z); else g.position.y = 0.42;
      parent.add(g);
      const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.44, 0.05), mat(i % 2 ? C.kelp : C.kelpDark));
      leaf.position.y = 0.22;
      leaf.castShadow = true;
      g.add(leaf);
      segs.push(g);
      parent = g;
    }
    kelps.push({ segs, phase: x * 1.7 + z });
  }
  const vents = [[-5.4, 2.2], [3.6, 3.9], [-0.2, -1.6]];
  for (const [x, z] of vents) cone(0.3, 0.35, C.rockDark, x, 0.17, z, { segments: 6, occlude: false });

  const fish = [];
  for (const [cx, cz, r, y, n, speed, color] of [[-1.0, -1.0, 3.3, 2.7, 5, 0.32, C.fish], [2.6, 1.4, 2.0, 1.5, 4, -0.48, C.fish2]]) {
    for (let i = 0; i < n; i++) {
      const f = new THREE.Group();
      const body = new THREE.Mesh(new THREE.IcosahedronGeometry(0.15, 0), mat(color));
      body.scale.set(1.7, 1, 0.6);
      const tail = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.2, 4), mat(color));
      tail.rotation.z = Math.PI / 2;
      tail.position.x = -0.3;
      f.add(body, tail);
      f.traverse((m) => { m.castShadow = true; });
      group.add(f);
      fish.push({ f, tail, cx, cz, r: r + (i % 2) * 0.4, y: y + (i % 3) * 0.25, speed, off: i * 0.42 });
    }
  }

  // --- behaviour --------------------------------------------------------------------
  let clamT = null, hatchT = null, powered = false, bubbleClock = 0;

  const effects = {
    openClam() {
      clamT = 0;
      inside.visible = true;
      const pearl = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 1), glow(C.pearl, 0.5));
      pearl.position.set(K.x, 0.75, K.z + 0.1);
      item(pearl, { tag: 'pearl', shape: { sphere: 0.2 }, mass: 0.3, velocity: [0.2, 3.2, 2.0] });
      fx.burst([K.x, 0.8, K.z], { count: 30, speed: 1.6, colors: [0xffffff, 0xbce9e4], life: 1.4, gravity: 1, drag: 1.5, scale: 1 });
    },
    powerOn() {
      powered = true;
      litPearl.visible = true;
      for (const w of windows) w.material = glow(C.light, 0.9);
      domeRing.material = glow(C.light, 0.8);
      for (const l of doorLamps) l.material = glow(C.light, 0.9);
      fx.burst([B.x, 2.2, B.z], { count: 50, speed: 2.4, colors: [0xfff3a8, 0xffffff], life: 1.3, gravity: 0, drag: 1.4 });
    },
    fitWheel() {
      wheel.visible = true;
      fx.burst([H.x, 1.1, doorZ + 0.3], { count: 16, speed: 1.2, colors: [0xe3c832, 0xffffff], life: 0.8, gravity: 0, drag: 2 });
    },
    openHatch() {
      hatchT = 0;
      for (const l of doorLamps) l.material = glow(C.green, 0.9);
    },
  };

  function update(dt, t) {
    fx.update(dt);
    for (const { segs, phase } of kelps) {
      segs.forEach((g, i) => {
        g.rotation.z = Math.sin(t * 1.1 + phase + i * 0.6) * 0.14;
        g.rotation.x = Math.cos(t * 0.8 + phase + i * 0.5) * 0.08;
      });
    }
    for (const p of fish) {
      const a = t * p.speed + p.off, dir = Math.sign(p.speed);
      p.f.position.set(p.cx + Math.cos(a) * p.r, p.y + Math.sin(t * 1.6 + p.off * 3) * 0.12, p.cz + Math.sin(a) * p.r);
      const dx = -Math.sin(a) * dir, dz = Math.cos(a) * dir;
      p.f.rotation.y = Math.atan2(-dz, dx);
      p.tail.rotation.y = Math.sin(t * 9 + p.off) * 0.5;
    }
    bubbleClock += dt;
    if (bubbleClock > 0.16) {
      bubbleClock = 0;
      const [x, z] = vents[Math.floor(Math.random() * vents.length)];
      fx.spawn({ pos: [x, 0.4, z], vel: [(Math.random() - 0.5) * 0.3, 1.0, (Math.random() - 0.5) * 0.3], color: 0xbce9e4, life: 3.2, gravity: 0.15, scale: 0.9 });
      if (powered) fx.spawn({ pos: [B.x, 2.25, B.z], vel: [(Math.random() - 0.5) * 0.2, 1.6, (Math.random() - 0.5) * 0.2], color: 0xfff3a8, life: 1.6, scale: 1.1 });
    }
    if (clamT !== null && clamT < 1) {
      clamT = Math.min(1, clamT + dt / 0.8);
      lid.rotation.x = -1.1 * (1 - Math.pow(1 - clamT, 3));
    }
    if (hatchT !== null) {
      hatchT += dt;
      wheel.rotation.z = -Math.min(hatchT, 0.9) * 7;
      const k = Math.min(1, Math.max(0, (hatchT - 0.9) / 1.0));
      door.rotation.y = -1.75 * (1 - Math.pow(1 - k, 3));
      if (hatchT > 0.9 && hatchT < 1.6) fx.spawn({ pos: [H.x + (Math.random() - 0.5), 1.1 + (Math.random() - 0.5), doorZ + 0.2], vel: [0, 1.2, 1.4], color: 0xbce9e4, life: 2, gravity: 0.3 });
    }
  }

  return { update, fx: effects };
}
