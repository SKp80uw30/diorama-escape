/**
 * Dinosaur Valley. Three creatures, each moved by what it wants:
 *   long-neck (left)       stands over the third egg; leaves at the tall tree draw it away
 *   pterodactyl (right)    perched on a spire with a bone; flies to the nest once it holds three eggs
 *   T-rex (back right)     dozes across the cave mouth; the bone on the flat rock draws it away
 * One egg is in plain sight, one is behind the boulder at the front, one is under the long-neck.
 */
const C = {
  ground: '#7fb84f', groundDark: '#5a9e45', edge: '#71452e', sand: '#dcc890', sandDark: '#c2aa70', water: '#54aeb6', waterLight: '#80cecf',
  rock: '#a89c88', rockDark: '#615d55', rockMid: '#857f74', ink: '#2c231e', lava: '#ef6a52', lavaHot: '#f5e050', smoke: '#c9bda9',
  rex: '#4f7f6a', rexDark: '#2e6b3a', rexBelly: '#d4e6a0', neck: '#6fa0c9', neckDark: '#3f6ea5', neckBelly: '#bce9e4',
  ptero: '#a8502f', pteroWing: '#e08a5c', bone: '#f3eddf', egg: '#f3eddf', eggSpot: '#9d8cc0', twig: '#71452e', twigLight: '#a87b4a',
  leaf: '#2e6b3a', leafLight: '#a9d06b', trunk: '#62452f', white: '#ffffff', red: '#d9503c',
};

export function build(ctx) {
  const { THREE, box, cyl, item, zone, group, physics, part, tween } = ctx;
  const Box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  const flat = { shadow: false, occlude: false };
  const open = { occlude: false };
  const Ico = (r, d = 1) => new THREE.IcosahedronGeometry(r, d);

  ctx.slab(8.5, 6, C.ground, C.edge);
  for (const [w, d, x, z] of [[4.4, 3.2, 3.2, 1.6], [3.6, 2.6, 4.6, -3.0], [3, 2.4, -4.4, 1.8], [2.6, 2.2, -0.8, -3.6]]) box(w, 0.02, d, C.sand, x, 0.01, z, flat);
  cyl(1.35, 1.35, 0.02, C.water, -1.5, 0.022, 0.9, { segments: 9, ...flat });
  cyl(0.8, 0.8, 0.022, C.waterLight, -1.7, 0.024, 1.0, { segments: 7, ...flat });
  for (const [x, z, r] of [[2.2, -0.9, 0.3], [2.9, -1.6, 0.9], [3.3, -0.6, 0.3], [-3.0, 3.4, 0.5], [-2.4, 2.8, 1.2]]) {   // footprints
    box(0.34, 0.012, 0.44, C.sandDark, x, 0.026, z, { rotY: r, ...flat });
  }

  // --- volcano ---------------------------------------------------------------------
  const V = { x: -6.0, z: -3.9 };
  cyl(0.8, 2.6, 3.2, C.rockDark, V.x, 1.6, V.z, { segments: 8, solid: true });
  cyl(1.4, 2.6, 1.2, C.rockMid, V.x, 0.6, V.z, { segments: 8 });
  const lava = part(new THREE.CylinderGeometry(0.62, 0.7, 0.1, 8), C.lava, V.x, 3.22, V.z, group, { emissive: 0x803010 });
  for (const [dy, off] of [[2.7, 1.0], [2.0, 1.45], [1.3, 1.9]]) { const m = part(Box(0.3, 0.7, 0.12), C.lavaHot, V.x + off * 0.5, dy, V.z + off * 0.87, group, { emissive: 0x806000 }); m.rotation.x = 0.55; m.rotation.y = 0.52; m.castShadow = false; }
  const smoke = [0, 1, 2].map((i) => { const m = part(Ico(0.4, 0), C.smoke, V.x, 3.6, V.z); m.castShadow = false; m.userData.phase = i / 3; return m; });

  // --- cliff and cave -----------------------------------------------------------------
  const CV = { x: 4.5 };
  box(4.8, 2.8, 1.5, C.rock, CV.x, 1.4, -5.25, { solid: true });
  box(2.2, 0.8, 1.3, C.rockMid, CV.x - 0.9, 3.2, -5.3);
  box(1.4, 0.5, 1.1, C.rock, CV.x + 1.2, 3.05, -5.35);
  box(1.7, 1.9, 0.06, C.ink, CV.x, 0.95, -4.48, flat);
  for (const [dx, y, w, h] of [[-1.0, 0.95, 0.34, 1.9], [1.0, 0.95, 0.34, 1.9], [0, 2.05, 2.34, 0.34]]) box(w, h, 0.2, C.rockDark, CV.x + dx, y, -4.42);

  // --- creature builders (origin at the feet, facing +z) ----------------------------------
  function makeRex() {
    const g = new THREE.Group();
    for (const sx of [-0.42, 0.42]) { part(Box(0.4, 1.0, 0.56), C.rexDark, sx, 0.5, 0, g); part(Box(0.44, 0.14, 0.8), C.rexDark, sx, 0.07, 0.14, g); }
    part(Box(1.0, 1.0, 2.1), C.rex, 0, 1.45, 0, g);
    part(Box(0.8, 0.3, 1.8), C.rexBelly, 0, 1.0, 0.05, g);
    part(Box(0.7, 0.7, 1.1), C.rex, 0, 1.45, -1.5, g); part(Box(0.42, 0.42, 1.0), C.rex, 0, 1.35, -2.4, g); part(Box(0.22, 0.22, 0.7), C.rexDark, 0, 1.28, -3.1, g);
    for (let k = 0; k < 4; k++) part(Box(0.12, 0.16, 0.3), C.rexDark, 0, 2.0, 0.6 - k * 0.7, g);
    for (const sx of [-0.56, 0.56]) part(Box(0.14, 0.4, 0.16), C.rexDark, sx, 1.2, 0.9, g);
    const head = new THREE.Group();
    head.position.set(0, 1.85, 1.0);
    g.add(head);
    part(Box(0.8, 0.6, 0.8), C.rex, 0, 0.1, 0.3, head);
    part(Box(0.74, 0.5, 0.9), C.rex, 0, 0.12, 1.0, head);
    part(Box(0.68, 0.18, 1.2), C.rexBelly, 0, -0.26, 0.8, head);
    for (let k = 0; k < 5; k++) for (const sx of [-0.3, 0.3]) part(Box(0.07, 0.12, 0.07), C.white, sx, -0.15, 0.55 + k * 0.2, head);
    const lids = [-0.41, 0.41].map((sx) => part(Box(0.04, 0.05, 0.26), C.ink, sx, 0.26, 0.45, head));
    const eyes = [-0.41, 0.41].map((sx) => { const e = part(Box(0.05, 0.18, 0.18), C.lavaHot, sx, 0.26, 0.45, head); e.visible = false; return e; });
    g.userData = { head, lids, eyes };
    return g;
  }
  function makeLongNeck() {
    const g = new THREE.Group();
    for (const sx of [-0.5, 0.5]) for (const sz of [-0.8, 0.8]) part(Box(0.5, 1.05, 0.5), C.neckDark, sx, 0.525, sz, g);
    part(Box(1.5, 1.2, 2.5), C.neck, 0, 1.6, 0, g);
    part(Box(1.3, 0.3, 2.3), C.neckBelly, 0, 1.08, 0, g);
    part(Box(0.7, 0.7, 1.1), C.neck, 0, 1.6, -1.75, g); part(Box(0.4, 0.4, 1.1), C.neck, 0, 1.4, -2.7, g); part(Box(0.2, 0.2, 0.8), C.neckDark, 0, 1.25, -3.5, g);
    const neck = new THREE.Group();
    neck.position.set(0, 2.1, 1.0);
    g.add(neck);
    part(Box(0.62, 1.0, 0.62), C.neck, 0, 0.45, 0.2, neck); part(Box(0.56, 1.0, 0.56), C.neck, 0, 1.2, 0.5, neck); part(Box(0.5, 0.9, 0.5), C.neck, 0, 1.9, 0.8, neck);
    part(Box(0.6, 0.45, 0.95), C.neck, 0, 2.5, 1.2, neck);
    part(Box(0.5, 0.14, 0.8), C.neckBelly, 0, 2.24, 1.25, neck);
    for (const sx of [-0.31, 0.31]) part(Box(0.04, 0.12, 0.12), C.ink, sx, 2.58, 1.3, neck);
    for (let k = 0; k < 4; k++) part(Box(0.36, 0.08, 0.36), C.neckDark, 0.3 * (k % 2 ? 1 : -1), 2.22, -0.8 + k * 0.5, g);
    g.userData = { neck };
    return g;
  }
  function makeBone() {
    const g = new THREE.Group();
    part(Box(0.7, 0.14, 0.14), C.bone, 0, 0, 0, g);
    for (const sx of [-0.38, 0.38]) for (const sz of [-0.09, 0.09]) part(Ico(0.12, 0), C.bone, sx, 0, sz, g);
    return g;
  }
  function makeEgg() {
    const g = new THREE.Group();
    const shell = part(Ico(0.2, 1), C.egg, 0, 0, 0, g);
    shell.scale.y = 1.25;
    for (const [x, y, z] of [[0.15, 0.08, 0.1], [-0.12, -0.06, 0.15], [0.02, 0.14, -0.17], [-0.16, 0.02, -0.09]]) part(Box(0.07, 0.07, 0.07), C.eggSpot, x, y, z, g);
    return g;
  }
  const eggOpts = { shape: { box: [0.36, 0.48, 0.36] }, soft: true, mass: 0.6 };

  // --- T-rex across the cave mouth ---------------------------------------------------------
  const RS = { x: 4.4, z: -3.3 };
  const rex = makeRex();
  rex.scale.setScalar(0.92);
  rex.position.set(RS.x, 0, RS.z);
  rex.rotation.y = Math.PI / 2;
  group.add(rex);
  const rexBody = ctx.solid(5.0, 2.2, 1.1, RS.x - 0.5, 1.1, RS.z);
  const RK = { x: 1.4, z: 2.5 };                                    // its feeding rock
  cyl(0.85, 0.95, 0.2, C.rock, RK.x, 0.1, RK.z, { segments: 8, solid: true });
  for (const [dx, dz, r] of [[-0.3, 0.2, 0.4], [0.25, -0.2, 1.3], [0.1, 0.36, 2.2]]) box(0.3, 0.05, 0.07, C.bone, RK.x + dx, 0.22, RK.z + dz, { rotY: r, ...flat });
  zone('rexRock', [RK.x - 0.95, 0, RK.z - 0.95], [RK.x + 0.95, 2.2, RK.z + 0.95]);

  // --- long-neck, the tall tree, and the egg under it ------------------------------------------
  const BS = { x: -4.4, z: 1.7 };
  const longNeck = makeLongNeck();
  longNeck.position.set(BS.x, 0, BS.z);
  group.add(longNeck);
  const neckBody = ctx.solid(1.6, 2.2, 2.6, BS.x, 1.1, BS.z);
  const egg3 = makeEgg();
  egg3.position.set(BS.x, 0.25, BS.z);
  group.add(egg3);
  const TR = { x: -0.5, z: -4.8 };
  cyl(0.2, 0.3, 4.2, C.trunk, TR.x, 2.1, TR.z, { solid: true });
  for (const [dx, dy, dz, r, c] of [[0, 0, 0, 1.0, C.leaf], [0.6, -0.4, 0.4, 0.7, C.groundDark], [-0.6, -0.2, 0.3, 0.75, C.leafLight], [0.1, 0.5, -0.2, 0.7, C.groundDark]]) part(Ico(r), c, TR.x + dx, 4.5 + dy, TR.z + dz);
  cyl(0.5, 0.6, 0.3, C.trunk, TR.x + 0.2, 0.15, TR.z + 1.3, { segments: 7, solid: true });      // feeding stump
  zone('tree', [TR.x - 0.8, 0, TR.z + 0.5], [TR.x + 1.2, 2.3, TR.z + 2.2]);

  // --- nest and pterodactyl ---------------------------------------------------------------------
  const N = { x: 5.6, z: 3.3 };
  cyl(1.0, 1.15, 0.24, C.rockMid, N.x, 0.12, N.z, { segments: 8, solid: true });
  for (let k = 0; k < 11; k++) { const a = (k / 11) * Math.PI * 2; box(0.6, 0.14, 0.16, k % 2 ? C.twig : C.twigLight, N.x + Math.cos(a) * 0.78, 0.33 + (k % 3) * 0.04, N.z + Math.sin(a) * 0.78, { rotY: -a + Math.PI / 2, occlude: false }); }
  const nestEggs = [[-0.24, -0.12], [0.24, -0.1], [0, 0.26]].map(([dx, dz]) => { const e = makeEgg(); e.position.set(N.x + dx, 0.5, N.z + dz); e.visible = false; group.add(e); return e; });
  zone('nest', [N.x - 0.95, 0, N.z - 0.95], [N.x + 0.95, 2.3, N.z + 0.95]);
  const SP = { x: 7.5, z: 0.7 };
  cyl(0.45, 0.8, 3.0, C.rock, SP.x, 1.5, SP.z, { segments: 7, solid: true });
  const ptero = new THREE.Group();
  ptero.position.set(SP.x, 3.0, SP.z);
  ptero.rotation.y = -2.2;
  group.add(ptero);
  part(Box(0.4, 0.4, 0.9), C.ptero, 0, 0.35, 0, ptero);
  part(Box(0.24, 0.24, 0.8), C.ptero, 0, 0.6, 0.7, ptero); part(Box(0.1, 0.12, 0.6), C.lavaHot, 0, 0.56, 1.3, ptero); part(Box(0.08, 0.3, 0.5), C.red, 0, 0.82, 0.4, ptero);
  const wings = [-1, 1].map((s) => { const w = new THREE.Group(); w.position.set(s * 0.2, 0.5, 0); ptero.add(w); part(Box(1.5, 0.06, 0.7), C.pteroWing, s * 0.75, 0, 0, w); w.rotation.z = s * -1.1; return w; });
  const heldBone = makeBone();
  heldBone.position.set(0, 0.08, 0.2);
  ptero.add(heldBone);

  // --- scenery ---------------------------------------------------------------------------------
  const BL = { x: -1.4, z: 4.8 };                                   // the boulder that hides an egg
  box(1.7, 1.3, 1.2, C.rock, BL.x, 0.65, BL.z, { solid: true });
  box(1.0, 0.5, 0.9, C.rockMid, BL.x - 0.2, 1.5, BL.z);
  box(0.6, 0.4, 0.5, C.rockDark, BL.x + 1.3, 0.2, BL.z + 0.2, { rotY: 0.5 });
  const cycad = (x, z, h) => {
    cyl(0.16, 0.22, h, C.trunk, x, h / 2, z, { solid: true });
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; const l = box(0.9, 0.06, 0.26, k % 2 ? C.leaf : C.groundDark, x + Math.cos(a) * 0.4, h + 0.02, z + Math.sin(a) * 0.4, { rotY: -a, occlude: false }); l.rotation.z = -0.3; }
  };
  cycad(-7.6, 3.4, 1.6); cycad(1.6, -5.2, 2.0); cycad(7.6, -3.6, 1.4); cycad(-7.4, -0.6, 1.2);
  for (const [x, z, r, c] of [[7.6, 5.4, 0.36, C.leaf], [-7.7, 5.3, 0.42, C.groundDark], [0.9, 5.5, 0.3, C.leaf], [-2.6, -1.4, 0.3, C.groundDark], [6.9, 1.4, 0.3, C.leaf]]) part(Ico(r), c, x, r * 0.7, z);
  // an old ribcage
  for (let k = 0; k < 4; k++) { box(0.08, 0.7, 0.08, C.bone, 2.6 + k * 0.4, 0.35, 5.0, open); box(0.08, 0.7, 0.08, C.bone, 2.6 + k * 0.4, 0.35, 5.5, open); box(0.08, 0.08, 0.58, C.bone, 2.6 + k * 0.4, 0.72, 5.25, open); }
  box(1.5, 0.1, 0.1, C.bone, 3.2, 0.1, 5.25, open);

  // --- loose things -------------------------------------------------------------------------------
  const egg1 = makeEgg();
  egg1.position.set(0.6, 0.25, -0.8);
  item(egg1, { tag: 'egg', ...eggOpts });
  const egg2 = makeEgg();
  egg2.position.set(BL.x, 0.25, BL.z - 1.05);
  item(egg2, { tag: 'egg', ...eggOpts });
  const fern = new THREE.Group();
  for (const [r, c] of [[-0.5, C.leafLight], [0, C.leafLight], [0.5, C.groundDark]]) { const l = part(Box(0.9, 0.05, 0.26), c, 0.12, 0.04, 0, fern); l.rotation.y = r; }
  part(Box(0.2, 0.12, 0.12), C.red, -0.2, 0.03, 0, fern);
  fern.position.set(-6.4, 0.1, 4.7);
  item(fern, { tag: 'fern', shape: { box: [0.9, 0.16, 0.6] }, soft: true, mass: 0.3 });

  // --- behaviour ------------------------------------------------------------------------------------
  /** walk a creature to (x, z), then turn it to face (fx, fz) */
  function walk(g, x, z, faceX, faceZ, seconds, done) {
    const from = g.position.clone(), r0 = g.rotation.y;
    const heading = Math.atan2(x - from.x, z - from.z), facing = Math.atan2(faceX - x, faceZ - z);
    const near = (a, b) => b + Math.round((a - b) / (Math.PI * 2)) * Math.PI * 2;
    const turn = near(r0, heading);
    tween(0.4, (e) => { g.rotation.y = r0 + (turn - r0) * e; });
    tween(seconds, (e, k) => { g.position.set(from.x + (x - from.x) * k, Math.abs(Math.sin(k * Math.PI * seconds * 2.2)) * 0.1, from.z + (z - from.z) * k); }, () => {
      const r1 = g.rotation.y, goal = near(r1, facing);
      tween(0.4, (e) => { g.rotation.y = r1 + (goal - r1) * e; }, done);
    }, 0.4);
  }
  let rexEating = false, neckEating = false, flying = false;
  const fx = {
    lure() {
      physics.removeStatic(neckBody);
      const to = { x: TR.x - 1.9, z: TR.z + 2.9 };
      walk(longNeck, to.x, to.z, TR.x + 0.2, TR.z + 1.3, 1.9, () => { neckEating = true; ctx.solid(1.6, 2.2, 2.2, to.x, 1.1, to.z); });
      tween(0, null, () => item(egg3, { tag: 'egg3', ...eggOpts }), 1.2);
    },
    egg(_, state) { nestEggs[Math.min(3, state.counters.eggs) - 1].visible = true; },
    swoop() {
      const from = ptero.position.clone(), to = new THREE.Vector3(N.x, 0.62, N.z);
      const r0 = ptero.rotation.y, r1 = Math.atan2(to.x - from.x, to.z - from.z);
      flying = true;
      let dropped = false;
      tween(1.7, (e, k) => {
        ptero.position.lerpVectors(from, to, e);
        ptero.position.y += Math.sin(k * Math.PI) * 1.2;
        ptero.rotation.y = r0 + (r1 - r0) * Math.min(1, k * 3);
        if (k > 0.45 && !dropped) {
          dropped = true;
          const p = new THREE.Vector3();
          heldBone.getWorldPosition(p);
          ptero.remove(heldBone);
          heldBone.position.copy(p);
          heldBone.rotation.set(0, 0, 0);
          item(heldBone, { tag: 'bone', shape: { box: [0.9, 0.26, 0.3] }, soft: true, mass: 0.6, velocity: [-2.2, 1, 0.4] });
        }
      }, () => { flying = false; wings.forEach((w, i) => { w.rotation.z = (i ? 1 : -1) * -1.1; }); }, 0.4);
    },
    feed() {
      const { lids, eyes } = rex.userData;
      lids.forEach((l) => { l.visible = false; });
      eyes.forEach((e) => { e.visible = true; });
      physics.removeStatic(rexBody);
      const to = { x: RK.x + 1.9, z: RK.z - 1.5 };
      walk(rex, to.x, to.z, RK.x, RK.z, 1.5, () => { rexEating = true; ctx.solid(1.3, 2.2, 1.3, to.x, 1.1, to.z); });
    },
  };

  function update(dt, t) {
    smoke.forEach((m) => {
      const k = (t * 0.25 + m.userData.phase) % 1;
      m.position.set(V.x + Math.sin(k * 5 + m.userData.phase * 9) * 0.3, 3.4 + k * 1.9, V.z);
      m.scale.setScalar(0.5 + k * 0.9 - k * k * 1.1);
    });
    lava.scale.y = 1 + 0.5 * Math.sin(t * 2);
    rex.userData.head.rotation.x = rexEating ? 0.45 + 0.2 * Math.sin(t * 7) : 0.12 + 0.03 * Math.sin(t * 1.4);   // dozing, then eating
    longNeck.userData.neck.rotation.x = neckEating ? 0.5 + 0.12 * Math.sin(t * 4) : 0.05 * Math.sin(t * 0.9);
    if (flying) wings.forEach((w, i) => { w.rotation.z = (i ? 1 : -1) * 0.5 * Math.sin(t * 14); });
  }

  return { update, fx };
}
