/**
 * The Skyscraper: the top of a tower block at dusk.
 *   left half   glass-walled penthouse office: filing cabinet (tap the top
 *               drawer: 'drawer'), desk, sofa, and the big printer ('printer' zone)
 *   right half  roof deck: helipad, AC unit with the ink cartridge hidden behind
 *               it, card reader ('reader' zone), caged launch console ('button'),
 *               fireworks rack and antenna mast
 */
const C = {
  roof: '#9ba7ab', body: '#606b70', bodyDark: '#3b4449', winDark: '#3f6ea5', winLit: '#fff3a8',
  wood: '#dcc890', woodDark: '#71452e', glass: '#bce9e4', frame: '#2c3237', white: '#f3eddf',
  printer: '#e1d7c5', printerDark: '#a89c88', steel: '#c7d3d8', steelDark: '#7f8b90', red: '#d9503c',
  green: '#7fb84f', yellow: '#f5e050', blue: '#3f6ea5', cyan: '#54aeb6', magenta: '#9d8cc0',
  plant: '#3f8440', pot: '#c96b42', sofa: '#3f6ea5', pad: '#2c3237', ink: '#20282c',
};
const FIREWORK_COLORS = [[0xd9503c, 0xf5e050], [0x6fa0c9, 0xffffff], [0x7fb84f, 0xf5e050], [0x9d8cc0, 0xe8c8e0], [0xef6a52, 0xfff3a8]];

export function build(ctx) {
  const { THREE, box, cyl, cone, sphere, add, item, zone, mat, glow, group, tappable, hitbox, lights } = ctx;
  lights.sun.color.set(0xffc890); lights.sun.intensity = 2.7;
  lights.fill.color.set(0x6f7fc9); lights.fill.intensity = 0.8;
  lights.hemi.color.set(0x9d8cc0); lights.hemi.groundColor.set(0x463f38); lights.hemi.intensity = 0.8;
  const HX = 7.6, HZ = 5.0, DEPTH = 2.6;
  ctx.slab(HX, HZ, C.roof, C.body, DEPTH);
  const fx = ctx.particles({ max: 900, size: 0.13 });
  const deco = { occlude: false };

  // --- tower body: window grid on all four faces -------------------------------------
  const dark = [], lit = [];
  let k = 0;
  const faces = [
    { len: HX, at: (u) => [u, HZ + 0.03], rot: 0 }, { len: HX, at: (u) => [u, -HZ - 0.03], rot: 0 },
    { len: HZ, at: (u) => [HX + 0.03, u], rot: Math.PI / 2 }, { len: HZ, at: (u) => [-HX - 0.03, u], rot: Math.PI / 2 },
  ];
  for (const f of faces) {
    const cols = Math.floor((2 * f.len - 0.4) / 0.62), start = -((cols - 1) * 0.62) / 2;
    for (let i = 0; i < cols; i++) {
      for (let r = 0; r < 3; r++) {
        const [x, z] = f.at(start + i * 0.62);
        const h = Math.sin(++k * 91.7) * 43758.5;
        ((h - Math.floor(h)) > 0.6 ? lit : dark).push([x, -0.62 - r * 0.72, z, f.rot]);
      }
    }
  }
  for (const [list, m] of [[dark, mat(C.winDark)], [lit, glow(C.winLit, 0.8)]]) {
    const inst = new THREE.InstancedMesh(new THREE.BoxGeometry(0.4, 0.48, 0.06), m, list.length);
    const o = new THREE.Object3D();
    list.forEach(([x, y, z, r], i) => { o.position.set(x, y, z); o.rotation.set(0, r, 0); o.updateMatrix(); inst.setMatrixAt(i, o.matrix); });
    group.add(inst);
  }
  box(HX * 2 + 0.16, 0.16, HZ * 2 + 0.16, C.bodyDark, 0, -0.14, 0, { shadow: false });

  // --- penthouse office (left half) ------------------------------------------------
  const OX0 = -7.3, OX1 = -0.6;
  box(OX1 - OX0, 0.04, 9.4, C.wood, (OX0 + OX1) / 2, 0.02, 0, { shadow: false });
  for (let x = OX0; x <= OX1 + 0.01; x += (OX1 - OX0) / 4) box(0.08, 2.3, 0.08, C.frame, x, 1.15, -4.75);
  box(OX1 - OX0, 2.2, 0.05, C.glass, (OX0 + OX1) / 2, 1.1, -4.78, { shadow: false });
  for (let z = -4.7; z <= 4.71; z += 9.4 / 5) box(0.08, 2.3, 0.08, C.frame, -7.35, 1.15, z);
  box(0.05, 2.2, 9.4, C.glass, -7.38, 1.1, 0, { shadow: false });
  box(OX1 - OX0, 0.1, 0.12, C.frame, (OX0 + OX1) / 2, 2.3, -4.75);
  box(0.12, 0.1, 9.4, C.frame, -7.35, 2.3, 0);
  box(0.06, 0.45, 9.4, C.frame, OX1 + 0.05, 0.22, 0, deco);

  // desk + monitor + chair
  const DK = { x: -5.4, z: -3.0 };
  box(1.9, 0.08, 0.9, C.woodDark, DK.x, 0.78, DK.z, { solid: true });
  for (const [dx, dz] of [[-0.85, -0.38], [0.85, -0.38], [-0.85, 0.38], [0.85, 0.38]]) box(0.07, 0.74, 0.07, C.frame, DK.x + dx, 0.37, DK.z + dz);
  ctx.solid(1.9, 0.8, 0.9, DK.x, 0.4, DK.z);
  box(0.75, 0.46, 0.05, C.ink, DK.x, 1.15, DK.z - 0.25);
  box(0.68, 0.38, 0.02, C.blue, DK.x, 1.15, DK.z - 0.22, { mat: glow(C.cyan, 0.5), shadow: false, occlude: false });
  box(0.08, 0.2, 0.08, C.frame, DK.x, 0.9, DK.z - 0.25);
  box(0.5, 0.03, 0.18, C.steelDark, DK.x, 0.83, DK.z + 0.12);
  box(0.55, 0.08, 0.5, C.bodyDark, DK.x, 0.5, DK.z + 0.85);
  box(0.55, 0.55, 0.08, C.bodyDark, DK.x, 0.82, DK.z + 1.08);
  cyl(0.04, 0.04, 0.45, C.frame, DK.x, 0.24, DK.z + 0.85);

  // sofa, coffee table, plants
  box(2.2, 0.4, 0.8, C.sofa, -5.0, 0.3, 3.9, { solid: true });
  box(2.2, 0.6, 0.25, C.sofa, -5.0, 0.6, 4.35);
  box(1.2, 0.06, 0.6, C.woodDark, -5.0, 0.42, 2.8, { solid: true });
  for (const [x, z] of [[-6.9, -4.3], [-1.1, 4.3], [-6.9, 4.3]]) {
    cyl(0.25, 0.2, 0.45, C.pot, x, 0.22, z, { solid: true });
    sphere(0.42, C.plant, x, 0.75, z, { detail: 0, occlude: false });
  }

  // filing cabinet with the tappable top drawer
  const FC = { x: -6.75, z: 0.8 };
  box(0.8, 1.35, 0.75, C.steelDark, FC.x, 0.675, FC.z, { solid: true });
  for (const y of [0.25, 0.7]) {
    box(0.04, 0.38, 0.65, C.steel, FC.x + 0.41, y, FC.z);
    box(0.04, 0.05, 0.22, C.frame, FC.x + 0.44, y + 0.08, FC.z);
  }
  const drawer = new THREE.Group();
  drawer.position.set(FC.x, 1.15, FC.z);
  group.add(drawer);
  box(0.04, 0.36, 0.65, C.steel, 0.41, 0, 0, { parent: drawer });
  box(0.04, 0.05, 0.22, C.yellow, 0.44, 0.08, 0, { parent: drawer });
  box(0.75, 0.3, 0.6, C.steelDark, 0.03, 0, 0, { parent: drawer });
  tappable(drawer, 'drawer');
  hitbox(0.5, 0.45, 0.8, FC.x + 0.45, 1.15, FC.z, 'drawer');

  // the printer
  const P = { x: -2.6, z: -3.7 };
  const printer = new THREE.Group();
  printer.position.set(P.x, 0, P.z);
  group.add(printer);
  box(1.3, 1.0, 1.0, C.printer, 0, 0.5, 0, { parent: printer, occlude: true });
  box(1.32, 0.1, 1.02, C.printerDark, 0, 1.05, 0, { parent: printer, occlude: true });
  box(1.1, 0.25, 0.04, C.printerDark, 0, 0.3, 0.52, { parent: printer });
  box(0.4, 0.04, 0.04, C.frame, 0, 0.36, 0.55, { parent: printer });
  box(0.45, 0.08, 0.28, C.frame, 0.35, 1.12, 0.3, { parent: printer });
  const paperLight = box(0.09, 0.05, 0.09, C.red, 0.25, 1.17, 0.36, { parent: printer, mat: glow(C.red, 0.6) });
  const inkLight = box(0.09, 0.05, 0.09, C.red, 0.45, 1.17, 0.36, { parent: printer, mat: glow(C.red, 0.6) });
  box(0.4, 0.04, 0.7, C.printerDark, 0.82, 0.62, 0, { parent: printer, rot: [0, 0, -0.25] });
  const sheet = box(0.3, 0.015, 0.42, C.white, 0.8, 0.67, 0, { parent: printer, rot: [0, 0, -0.25] });
  sheet.visible = false;
  ctx.solid(1.3, 1.1, 1.0, P.x, 0.55, P.z);
  zone('printer', [P.x - 0.75, 1.05, P.z - 0.6], [P.x + 0.75, 2.5, P.z + 0.6]);

  // --- roof deck (right half) ------------------------------------------------------
  for (const [w, d, x, z] of [[8.2, 0.12, 3.5, -4.9], [0.12, 9.8, 7.5, 0], [8.2, 0.12, 3.5, 4.9]]) box(w, 0.45, d, C.body, x, 0.22, z, deco);
  for (let x = 0; x <= 7; x += 1.4) box(0.03, 0.01, 9.6, C.steelDark, x, 0.005, 0, { shadow: false, occlude: false });

  // helipad
  const HP = { x: 2.6, z: 2.2 };
  cyl(1.7, 1.75, 0.1, C.pad, HP.x, 0.05, HP.z, { segments: 20 });
  add(new THREE.Mesh(new THREE.TorusGeometry(1.42, 0.06, 3, 24), mat(C.yellow)), HP.x, 0.11, HP.z, { rot: [Math.PI / 2, 0, 0], occlude: false, shadow: false });
  for (const dx of [-0.35, 0.35]) box(0.16, 0.02, 1.1, C.white, HP.x + dx, 0.11, HP.z, { shadow: false, occlude: false });
  box(0.7, 0.02, 0.16, C.white, HP.x, 0.11, HP.z, { shadow: false, occlude: false });
  const padLights = [];
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    padLights.push(box(0.1, 0.08, 0.1, C.green, HP.x + Math.cos(a) * 1.62, 0.14, HP.z + Math.sin(a) * 1.62, { mat: glow(C.green, 0.8), shadow: false, occlude: false }));
  }

  // AC unit, with the ink cartridge hidden behind it
  const AC = { x: 6.0, z: 3.0 };
  box(1.6, 1.3, 1.2, C.steel, AC.x, 0.65, AC.z, { solid: true });
  for (const dz of [-0.3, 0.3]) cyl(0.26, 0.26, 0.04, C.frame, AC.x, 1.32, AC.z + dz, { segments: 12 });
  const fans = [-0.3, 0.3].map((dz) => box(0.46, 0.02, 0.08, C.steelDark, AC.x, 1.36, AC.z + dz));
  for (let i = 0; i < 5; i++) box(0.03, 0.9, 0.02, C.steelDark, AC.x - 0.6 + i * 0.3, 0.6, AC.z + 0.61, { shadow: false });
  const cart = new THREE.Group();
  const cBody = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.24, 0.22), mat(C.ink));
  cart.add(cBody);
  [C.cyan, C.magenta, C.yellow].forEach((c, i) => {
    const s = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.25, 0.23), mat(c));
    s.position.x = -0.12 + i * 0.12;
    cart.add(s);
  });
  cart.position.set(4.9, 0.14, 1.85);
  item(cart, { tag: 'ink', shape: { box: [0.42, 0.24, 0.22] }, mass: 0.4 });

  // stair hut with a jammed door (the "way out" that does not work)
  box(1.6, 1.9, 1.3, C.body, 0.4, 0.95, -4.1, { solid: true });
  box(1.8, 0.12, 1.5, C.bodyDark, 0.4, 1.96, -4.1);
  box(0.7, 1.4, 0.05, C.woodDark, 0.4, 0.7, -3.43);
  for (const r of [0.6, -0.6]) box(0.9, 0.05, 0.05, C.steelDark, 0.4, 0.75, -3.4, { rot: [0, 0, r], shadow: false });

  // card reader on a post
  const R = { x: 3.5, z: -2.5 };
  cyl(0.06, 0.06, 1.0, C.steelDark, R.x, 0.5, R.z);
  box(0.32, 0.44, 0.12, C.frame, R.x, 1.15, R.z);
  box(0.2, 0.03, 0.02, C.steelDark, R.x, 1.25, R.z + 0.07);
  const readerLed = box(0.08, 0.06, 0.02, C.red, R.x, 1.05, R.z + 0.07, { mat: glow(C.red, 0.8), shadow: false });
  ctx.solid(0.3, 1.4, 0.3, R.x, 0.7, R.z);
  zone('reader', [R.x - 0.6, 0.5, R.z - 0.5], [R.x + 0.6, 2.1, R.z + 0.7]);

  // caged launch console
  const CG = { x: 2.0, z: -3.4 };
  box(0.9, 0.85, 0.6, C.bodyDark, CG.x, 0.43, CG.z, { solid: true });
  box(0.9, 0.08, 0.5, C.steelDark, CG.x, 0.9, CG.z + 0.05, { rot: [0.35, 0, 0] });
  const button = cyl(0.16, 0.18, 0.12, C.red, CG.x, 1.0, CG.z + 0.08, { mat: glow(C.red, 0.5), segments: 12 });
  tappable(button, 'button');
  hitbox(1.0, 0.6, 0.8, CG.x, 1.0, CG.z, 'button');
  const cage = new THREE.Group();
  group.add(cage);
  const cw = 1.4, cd = 1.2, ch = 1.6;
  for (const [dx, dz] of [[-cw / 2, -cd / 2], [cw / 2, -cd / 2], [-cw / 2, cd / 2], [cw / 2, cd / 2]]) {
    box(0.06, ch, 0.06, C.steelDark, CG.x + dx, ch / 2, CG.z + dz, { parent: cage, occlude: true });
  }
  for (let i = 1; i < 6; i++) {
    box(0.03, ch, 0.03, C.steelDark, CG.x - cw / 2 + (i * cw) / 6, ch / 2, CG.z - cd / 2, { parent: cage });
    box(0.03, ch, 0.03, C.steelDark, CG.x + cw / 2, ch / 2, CG.z - cd / 2 + (i * cd) / 6, { parent: cage });
    box(0.03, ch, 0.03, C.steelDark, CG.x - cw / 2, ch / 2, CG.z - cd / 2 + (i * cd) / 6, { parent: cage });
  }
  box(cw, 0.04, cd, C.steelDark, CG.x, ch, CG.z, { parent: cage });
  const cageDoor = new THREE.Group();
  cageDoor.position.set(CG.x - cw / 2, 0, CG.z + cd / 2);
  group.add(cageDoor);
  for (let i = 1; i < 6; i++) box(0.03, ch, 0.03, C.steelDark, (i * cw) / 6, ch / 2, 0, { parent: cageDoor });
  for (const y of [0.1, ch / 2, ch - 0.05]) box(cw, 0.04, 0.04, C.steelDark, cw / 2, y, 0, { parent: cageDoor });
  box(0.12, 0.16, 0.08, C.yellow, cw - 0.12, 0.85, 0.04, { parent: cageDoor });
  tappable(cage, 'button');
  tappable(cageDoor, 'button');
  const cageBody = ctx.solid(cw, ch, cd, CG.x, ch / 2, CG.z);

  // fireworks rack
  const FW = { x: 5.6, z: -2.9 };
  box(1.7, 0.3, 1.0, C.red, FW.x, 0.15, FW.z, { solid: true });
  const tubes = [];
  for (let i = 0; i < 6; i++) {
    const tx = FW.x - 0.62 + (i % 3) * 0.62, tz = FW.z - 0.22 + Math.floor(i / 3) * 0.44;
    cyl(0.12, 0.12, 0.85, C.bodyDark, tx, 0.72, tz, { segments: 8 });
    cyl(0.13, 0.13, 0.06, [C.yellow, C.cyan, C.green, C.magenta, C.red, C.white][i], tx, 1.17, tz, { segments: 8 });
    tubes.push([tx, 1.25, tz]);
  }

  // antenna mast
  const AN = { x: 6.8, z: -4.3 };
  cyl(0.07, 0.1, 5.4, C.steelDark, AN.x, 2.7, AN.z, { segments: 6 });
  for (let y = 0.8; y < 5; y += 0.8) box(0.5 - y * 0.06, 0.04, 0.04, C.steelDark, AN.x, y, AN.z, deco);
  const beacon = sphere(0.1, C.red, AN.x, 5.45, AN.z, { mat: glow(C.red, 1), detail: 0, occlude: false });

  // --- behaviour ---------------------------------------------------------------------
  let drawerT = null, printT = null, cageT = null, showT = null, nextRocket = 0, burstN = 0;
  const rockets = [];

  const effects = {
    openDrawer() {
      drawerT = 0;
      const ream = new THREE.Group();
      const r = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.15, 0.36), mat(C.white));
      const band = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.16, 0.37), mat(C.blue));
      ream.add(r, band);
      ream.position.set(FC.x + 0.75, 1.5, FC.z);
      item(ream, { tag: 'paper', shape: { box: [0.5, 0.15, 0.36] }, mass: 0.5, velocity: [1.2, 1.2, 0] });
    },
    loadPaper() { paperLight.material = glow(C.green, 0.8); },
    loadInk() { inkLight.material = glow(C.green, 0.8); },
    print() { printT = 0; },
    openCage() {
      cageT = 0;
      readerLed.material = glow(C.green, 0.9);
      ctx.physics.removeStatic(cageBody);
    },
    launch() {
      showT = 0;
      button.position.y = 0.95;
    },
  };

  function update(dt, t) {
    fx.update(dt);
    fans.forEach((f, i) => { f.rotation.y = t * (9 + i); });
    beacon.visible = Math.floor(t * 1.5) % 2 === 0;
    padLights.forEach((l, i) => { l.visible = Math.floor(t * 4 - i) % 8 !== 0; });
    if (drawerT !== null && drawerT < 1) {
      drawerT = Math.min(1, drawerT + dt / 0.5);
      drawer.position.x = FC.x + 0.5 * (1 - Math.pow(1 - drawerT, 3));
    }
    if (printT !== null) {
      printT += dt;
      const busy = printT < 1.6;
      printer.position.set(P.x + (busy ? Math.sin(printT * 60) * 0.015 : 0), busy ? Math.abs(Math.sin(printT * 45)) * 0.01 : 0, P.z);
      paperLight.visible = inkLight.visible = !busy || Math.floor(printT * 8) % 2 === 0;
      if (busy) { sheet.visible = true; sheet.position.y = 0.67 + Math.sin(printT * 3) * 0.02; }
      if (printT - dt < 1.6 && printT >= 1.6) {
        const card = new THREE.Group();
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.04, 0.3), mat(C.white));
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.05, 0.08), mat(C.blue));
        stripe.position.z = -0.06;
        card.add(body, stripe);
        card.position.set(P.x + 1.0, 0.9, P.z);
        item(card, { tag: 'keycard', shape: { box: [0.45, 0.08, 0.3] }, mass: 0.15, velocity: [2.4, 1.2, 0.8] });
        fx.burst([P.x + 0.9, 0.9, P.z], { count: 18, speed: 1.4, colors: [0xffffff, 0x6fa0c9], life: 0.7, gravity: 0, drag: 2.5, scale: 0.8 });
      }
    }
    if (cageT !== null && cageT < 1) {
      cageT = Math.min(1, cageT + dt / 0.8);
      cageDoor.rotation.y = 1.9 * (1 - Math.pow(1 - cageT, 3));
    }
    if (showT !== null) {
      showT += dt;
      nextRocket -= dt;
      if (showT < 4.2 && nextRocket <= 0) {
        nextRocket = 0.28;
        const [x, y, z] = tubes[Math.floor(Math.random() * tubes.length)];
        rockets.push({ p: new THREE.Vector3(x, y, z), v: new THREE.Vector3((Math.random() - 0.5) * 1.6, 7.5 + Math.random(), (Math.random() - 0.5) * 1.6 + 0.5), fuse: 0.7 + Math.random() * 0.25 });
      }
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.v.y -= 3 * dt;
        r.p.addScaledVector(r.v, dt);
        r.fuse -= dt;
        fx.spawn({ pos: r.p.toArray(), vel: [0, -0.5, 0], color: 0xfff3a8, life: 0.35, scale: 0.8 });
        if (r.fuse <= 0) {
          rockets.splice(i, 1);
          fx.burst(r.p.toArray(), { count: 70, speed: 3.4, colors: FIREWORK_COLORS[burstN++ % FIREWORK_COLORS.length], life: 1.6, gravity: -1.4, drag: 1.1, scale: 1.5 });
        }
      }
    }
  }

  return { update, fx: effects };
}
