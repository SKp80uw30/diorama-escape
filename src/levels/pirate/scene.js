/**
 * The Pirate Ship, at anchor on open water. The deck is at height 1.
 *   cannon (main deck, pointing at the islet)  -> takes the ball and the powder keg
 *   islet (in front of the ship) with a barrel and the key on top of it
 *   chest (main deck)                          -> takes the key, gives the wheel
 *   helm (raised deck at the stern)            -> takes the wheel, sets sail
 * The cannonball is in plain sight by the bow; the keg is behind the crates.
 * Anything that goes overboard washes back to where it came from.
 */
const C = {
  sea: '#338b98', seaDeep: '#206577', foam: '#bce9e4', hull: '#62452f', hullDark: '#463128', deck: '#b97d55', plank: '#9c6440',
  rail: '#71452e', sail: '#f3eddf', rope: '#d8b878', iron: '#2c3237', ironLight: '#606b70', gold: '#e3c832', goldDark: '#b08420',
  red: '#d9503c', redDark: '#a8322c', sand: '#efe0b8', sandDark: '#dcc890', leaf: '#3f8440', leafLight: '#7fb84f', flag: '#20282c',
  white: '#ffffff', blue: '#3f6ea5', keg: '#9c6440', off: '#463f38', fire: '#ef6a52', hot: '#f5e050', rock: '#857f74', fin: '#51575c',
};
const DECK = 1.0;

export function build(ctx) {
  const { THREE, box, cyl, item, zone, mat, group, physics, part, tween } = ctx;
  const Box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  const Cyl = (rt, rb, h, seg = 10) => new THREE.CylinderGeometry(rt, rb, h, seg);
  const flat = { shadow: false, occlude: false };
  const open = { occlude: false };

  ctx.slab(8.5, 5.5, C.sea, C.seaDeep);
  const waves = [[-7, 4], [-4.6, 3.1], [-1, 4.7], [0.6, 3.2], [5.6, 2.9], [7.3, 4.6], [-6.8, -3.4], [-2.5, -4.5], [2, -3.3], [5.8, -4.4], [7.7, -1], [-7.6, 0.6]]
    .map(([x, z], i) => { const m = box(0.7 + (i % 3) * 0.25, 0.02, 0.1, C.foam, x, 0.012, z, flat); m.userData.x = x; return m; });

  // --- hull and decks -------------------------------------------------------------
  box(11, 1.0, 4.2, C.hull, -0.5, 0.5, 0, { solid: true });
  box(11.04, 0.22, 4.24, C.hullDark, -0.5, 0.74, 0);
  box(1.4, 1.0, 3.2, C.hull, 5.7, 0.5, 0, { solid: true });
  box(1.1, 1.0, 1.8, C.hull, 6.9, 0.5, 0, { solid: true });
  box(1.3, 0.14, 0.14, C.rail, 7.9, 1.1, 0);                                  // bowsprit
  box(11, 0.05, 4.0, C.deck, -0.5, DECK + 0.02, 0, flat);
  box(1.4, 0.05, 3.0, C.deck, 5.7, DECK + 0.02, 0, flat);
  box(1.1, 0.05, 1.6, C.deck, 6.9, DECK + 0.02, 0, flat);
  for (let z = -1.5; z <= 1.51; z += 0.5) box(11, 0.052, 0.03, C.plank, -0.5, DECK + 0.02, z, flat);
  // raised deck at the stern
  const QD = 1.9;
  box(3, 0.9, 4.2, C.hull, -4.5, 1.45, 0, { solid: true });
  box(3, 0.05, 4.0, C.deck, -4.5, QD + 0.02, 0, flat);
  box(0.04, 0.66, 0.6, C.hullDark, -2.98, 1.35, -0.9, flat);                  // cabin door
  box(0.05, 0.1, 0.1, C.gold, -2.96, 1.35, -0.7, flat);
  box(0.36, 0.3, 1.0, C.plank, -2.48, 1.15, 1.3, { solid: true });            // steps
  box(0.34, 0.6, 1.0, C.plank, -2.83, 1.3, 1.3, { solid: true });
  // rails: you can reach over and through them
  const rail = (x0, x1, z, y) => {
    const len = x1 - x0;
    for (let i = 0; i <= Math.round(len); i++) box(0.1, 0.5, 0.1, C.rail, x0 + (len * i) / Math.round(len), y + 0.25, z, open);
    box(len, 0.08, 0.14, C.rail, (x0 + x1) / 2, y + 0.52, z, open);
    ctx.solid(len, 0.56, 0.12, (x0 + x1) / 2, y + 0.28, z);
  };
  for (const z of [-2.05, 2.05]) { rail(-3, 5, z, DECK); rail(-6, -3, z, QD); }
  for (let i = 0; i <= 4; i++) box(0.1, 0.5, 0.1, C.rail, -5.95, QD + 0.25, -2.05 + i * 1.025, open);
  box(0.14, 0.08, 4.2, C.rail, -5.95, QD + 0.52, 0, open);
  ctx.solid(0.12, 0.56, 4.2, -5.95, QD + 0.28, 0);

  // --- mast, sail, flag ----------------------------------------------------------------
  const MX = 0.6;
  cyl(0.14, 0.18, 5.2, C.rail, MX, DECK + 2.6, 0, { solid: true });
  box(0.16, 0.16, 3.6, C.rail, MX, 5.2, 0);
  cyl(0.46, 0.36, 0.4, C.plank, MX, 5.75, 0);
  const furled = box(0.34, 0.34, 3.3, C.sail, MX, 4.95, 0, open);
  const sail = new THREE.Group();
  sail.position.set(MX + 0.14, 5.1, 0);
  group.add(sail);
  part(Box(0.06, 3.0, 3.2), C.sail, 0, -1.5, 0, sail);
  for (const y of [-0.6, -1.5, -2.4]) part(Box(0.07, 0.3, 3.2), C.red, 0, y, 0, sail);
  sail.scale.y = 0.02;
  sail.visible = false;
  const flag = part(Box(0.7, 0.4, 0.03), C.flag, MX + 0.4, 6.35, 0);
  part(Box(0.16, 0.16, 0.04), C.white, MX + 0.4, 6.37, 0);
  box(0.05, 0.9, 0.05, C.rail, MX, 6.25, 0, open);
  // parrot on the yard
  box(0.2, 0.3, 0.2, C.red, MX, 5.43, 1.3, open);
  box(0.16, 0.16, 0.2, C.red, MX, 5.66, 1.34, open);
  box(0.06, 0.06, 0.12, C.hot, MX, 5.64, 1.48, open);
  box(0.22, 0.2, 0.06, C.blue, MX, 5.42, 1.19, open);

  // --- helm ---------------------------------------------------------------------------
  const HX = -4.6;
  box(0.24, 0.9, 0.24, C.rail, HX, QD + 0.45, 0, { solid: true });
  box(0.3, 0.1, 0.1, C.iron, HX + 0.2, QD + 0.85, 0, open);
  function makeWheel() {
    const g = new THREE.Group();   // lying flat
    const rim = part(new THREE.TorusGeometry(0.34, 0.06, 6, 12), C.rail, 0, 0, 0, g);
    rim.rotation.x = Math.PI / 2;
    for (let k = 0; k < 4; k++) { const s = part(Box(0.92, 0.07, 0.07), C.deck, 0, 0, 0, g); s.rotation.y = (k * Math.PI) / 4; }
    part(Cyl(0.1, 0.1, 0.12, 8), C.gold, 0, 0, 0, g);
    return g;
  }
  const helmWheel = makeWheel();
  helmWheel.rotation.z = Math.PI / 2;
  helmWheel.position.set(HX + 0.34, QD + 0.85, 0);
  helmWheel.visible = false;
  group.add(helmWheel);
  zone('helm', [HX - 0.85, QD, -0.85], [HX + 0.95, 3.7, 0.85]);

  // --- cannon -------------------------------------------------------------------------
  const K = { x: 2.8, z: 1.15 };
  box(0.7, 0.3, 1.0, C.rail, K.x, DECK + 0.2, K.z - 0.05);
  cyl(0.2, 0.26, 1.4, C.iron, K.x, DECK + 0.5, K.z + 0.2, { rot: [Math.PI / 2, 0, 0] });
  cyl(0.24, 0.24, 0.1, C.ironLight, K.x, DECK + 0.5, K.z + 0.86, { rot: [Math.PI / 2, 0, 0] });
  for (const dx of [-0.42, 0.42]) cyl(0.2, 0.2, 0.1, C.ironLight, K.x + dx, DECK + 0.2, K.z - 0.1, { rot: [0, 0, Math.PI / 2] });
  ctx.solid(0.9, 0.78, 1.5, K.x, DECK + 0.39, K.z + 0.15);
  // two tell-tales on the carriage: ball loaded, powder loaded
  const lamps = { ball: box(0.04, 0.16, 0.16, C.off, K.x + 0.37, DECK + 0.2, K.z + 0.15, flat), keg: box(0.04, 0.16, 0.16, C.off, K.x + 0.37, DECK + 0.2, K.z - 0.2, flat) };
  zone('cannon', [K.x - 0.8, DECK, K.z - 0.9], [K.x + 0.8, 3.5, K.z + 0.9]);
  const muzzle = new THREE.Vector3(K.x, DECK + 0.5, K.z + 0.95);

  // --- islet: a barrel with the key on it, out of reach --------------------------------
  const I = { x: 2.7, z: 4.4 };
  cyl(1.05, 1.35, 0.3, C.sand, I.x + 0.3, 0.15, I.z, { segments: 9 });
  cyl(0.5, 0.7, 0.22, C.sandDark, I.x + 0.9, 0.36, I.z - 0.4, { segments: 7 });
  cyl(0.09, 0.12, 1.5, C.rail, I.x + 1.0, 1.1, I.z - 0.45);
  for (let k = 0; k < 5; k++) { const a = (k / 5) * Math.PI * 2; box(0.7, 0.05, 0.22, k % 2 ? C.leaf : C.leafLight, I.x + 1.0 + Math.cos(a) * 0.32, 1.86, I.z - 0.45 + Math.sin(a) * 0.32, { rotY: -a, occlude: false }); }
  const barrel = new THREE.Group();
  barrel.position.set(I.x, 0.3, I.z);
  group.add(barrel);
  part(Cyl(0.3, 0.3, 0.7, 9), C.keg, 0, 0.35, 0, barrel);
  for (const y of [0.12, 0.58]) part(Cyl(0.315, 0.315, 0.07, 9), C.iron, 0, y, 0, barrel);
  function makeKey() {
    const g = new THREE.Group();
    const ring = part(new THREE.TorusGeometry(0.16, 0.06, 6, 10), C.gold, -0.24, 0, 0, g);
    ring.rotation.x = Math.PI / 2;
    part(Box(0.5, 0.09, 0.09), C.gold, 0.14, 0, 0, g);
    part(Box(0.1, 0.09, 0.2), C.goldDark, 0.33, 0, 0.1, g);
    part(Box(0.1, 0.09, 0.14), C.goldDark, 0.17, 0, 0.07, g);
    return g;
  }
  const key = makeKey();
  key.position.set(I.x, 1.06, I.z);
  group.add(key);

  // --- chest ----------------------------------------------------------------------------
  const T = { x: -1.3, z: 1.25 };
  box(1.2, 0.5, 0.8, C.rail, T.x, DECK + 0.25, T.z, { solid: true });
  for (const dx of [-0.42, 0.42]) box(0.12, 0.52, 0.82, C.goldDark, T.x + dx, DECK + 0.25, T.z);
  const lid = new THREE.Group();
  lid.position.set(T.x, DECK + 0.5, T.z - 0.4);
  group.add(lid);
  part(Box(1.24, 0.28, 0.84), C.hull, 0, 0.14, 0.42, lid);
  for (const dx of [-0.42, 0.42]) part(Box(0.13, 0.3, 0.86), C.goldDark, dx, 0.14, 0.42, lid);
  const lock = part(Box(0.2, 0.26, 0.06), C.gold, 0, 0.02, 0.86, lid);
  const lidBody = ctx.solid(1.24, 0.28, 0.84, T.x, DECK + 0.64, T.z);
  const glow = part(Box(1.0, 0.04, 0.6), C.hot, T.x, DECK + 0.5, T.z, group, { emissive: 0x806000 });
  glow.visible = false;
  zone('chest', [T.x - 0.85, DECK, T.z - 0.75], [T.x + 0.85, 3.3, T.z + 0.75]);

  // --- cargo: the keg is behind these crates ----------------------------------------------
  const G = { x: -1.4, z: -0.6 };
  box(1.2, 0.8, 1.2, C.deck, G.x, DECK + 0.4, G.z, { solid: true });
  box(1.22, 0.1, 1.22, C.plank, G.x, DECK + 0.4, G.z);
  box(0.9, 0.6, 0.9, C.plank, G.x - 0.1, DECK + 1.1, G.z, { solid: true });
  box(0.92, 0.08, 0.92, C.rail, G.x - 0.1, DECK + 1.1, G.z);
  // barrels and a rope coil
  for (const [x, z] of [[4.5, 1.3], [5.0, 0.7]]) { cyl(0.3, 0.3, 0.7, C.keg, x, DECK + 0.35, z, { solid: true }); cyl(0.32, 0.32, 0.07, C.iron, x, DECK + 0.5, z); }
  cyl(0.34, 0.34, 0.14, C.rope, -0.6, DECK + 0.07, -1.5, open);
  cyl(0.16, 0.16, 0.15, C.plank, -0.6, DECK + 0.075, -1.5, open);
  // ball rack by the bow, with two fixed balls
  box(0.9, 0.12, 0.4, C.plank, 4.0, DECK + 0.06, -1.5, open);
  for (const dx of [-0.25, 0.25]) part(new THREE.IcosahedronGeometry(0.2, 1), C.iron, 4.0 + dx, DECK + 0.3, -1.5);
  ctx.solid(0.9, 0.5, 0.4, 4.0, DECK + 0.25, -1.5);
  // a fin circling in the water
  const fin = part(new THREE.CylinderGeometry(0, 0.26, 0.5, 3), C.fin, -5, 0.2, 4);
  fin.scale.z = 0.3;

  // --- loose things -----------------------------------------------------------------------
  const ball = part(new THREE.IcosahedronGeometry(0.2, 1), C.iron, 3.4, DECK + 0.22, -0.9);
  item(ball, { tag: 'ball', shape: { sphere: 0.2 }, soft: true, mass: 1 });
  const keg = new THREE.Group();
  part(Cyl(0.22, 0.22, 0.5, 9), C.red, 0, 0, 0, keg);
  for (const y of [-0.16, 0.16]) part(Cyl(0.235, 0.235, 0.06, 9), C.iron, 0, y, 0, keg);
  part(Box(0.05, 0.16, 0.05), C.rope, 0, 0.32, 0, keg);
  keg.position.set(G.x, DECK + 0.27, G.z - 1.02);
  item(keg, { tag: 'keg', shape: { box: [0.44, 0.5, 0.44] }, soft: true, mass: 0.8 });

  // --- behaviour ------------------------------------------------------------------------
  let sailing = false;
  const fx = {
    load(what) { lamps[what].material = mat(C.gold, { emissive: 0x806000 }); },
    fire() {
      const shot = part(new THREE.IcosahedronGeometry(0.2, 1), C.iron, muzzle.x, muzzle.y, muzzle.z);
      const flash = part(new THREE.IcosahedronGeometry(0.45, 0), C.hot, muzzle.x, muzzle.y, muzzle.z + 0.2, group, { emissive: 0x806000 });
      flash.castShadow = false;
      tween(0.25, (e) => flash.scale.setScalar(1 + e), () => ctx.remove(flash));
      const to = new THREE.Vector3(I.x, 0.7, I.z);
      tween(0.45, (_, k) => { shot.position.lerpVectors(muzzle, to, k); shot.position.y += Math.sin(k * Math.PI) * 0.9; }, () => {
        ctx.remove(shot);
        ctx.remove(barrel);
        ctx.burst(I.x, 0.7, I.z, [C.keg, C.plank, C.iron], 12, 1.1);
        // the key is thrown back over the rail and lands on the main deck
        const k = item(key, { tag: 'key', shape: { box: [0.75, 0.14, 0.4] }, soft: true, mass: 0.5, velocity: [-1.05, 10.6, -4.2] });
        k.home.set(1.6, DECK + 0.3, 0.4);
      }, 0.15);
    },
    openChest() {
      lock.visible = false;
      glow.visible = true;
      physics.removeStatic(lidBody);
      tween(0.6, (e) => { lid.rotation.x = -1.9 * e; });
      tween(0, null, () => {
        const wheel = makeWheel();
        wheel.position.set(T.x, DECK + 0.9, T.z);
        item(wheel, { tag: 'wheel', shape: { box: [0.92, 0.14, 0.92] }, soft: true, mass: 0.8, velocity: [2.4, 6.5, -1.2] });
      }, 0.5);
    },
    sail() {
      helmWheel.visible = true;
      ctx.remove(furled);
      sail.visible = true;
      tween(1.2, (e) => { sail.scale.y = 0.02 + 0.98 * e; }, null, 0.3);
      sailing = true;
    },
  };

  function update(dt, t) {
    waves.forEach((w, i) => { w.position.x = w.userData.x + Math.sin(t * 0.8 + i * 1.9) * 0.3 - (sailing ? ((t * 1.6 + i) % 3) : 0); });
    fin.position.set(-5 + Math.cos(t * 0.5) * 1.3, 0.2, 4.1 + Math.sin(t * 0.5) * 0.8);
    fin.rotation.y = -t * 0.5;
    flag.rotation.y = Math.sin(t * 3) * 0.25;
    if (helmWheel.visible) helmWheel.rotation.x = Math.sin(t * 0.9) * 0.6;
    // overboard: anything loose that reaches the water washes back to where it came from
    for (const it of physics.items) {
      if (!it.alive || it.held || it.body.position.y > 0.72) continue;
      it.body.position.copy(it.home);
      it.body.velocity.setZero();
      it.body.angularVelocity.setZero();
      ctx.burst(it.home.x, it.home.y, it.home.z, [C.foam, C.white], 6, 0.5);
    }
  }

  return { update, fx };
}
