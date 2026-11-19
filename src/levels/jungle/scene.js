/**
 * The Jungle Temple. A stepped pyramid with a great stone face in front of it:
 *   altar (in front of the face)  -> both jade eyes go here
 *   campfire (front right)        -> lights the torch
 *   vine-covered shrine (back right) holding the first eye
 *   pressure plate (front centre) wired to the cage (right) holding the second eye
 * The torch lies behind the ruined wall (front left); the carved stone is in plain sight.
 */
const C = {
  ground: '#3f8440', groundLight: '#5a9e45', edge: '#62452f', path: '#a87b4a', pathDark: '#9c6440',
  stone: '#a89c88', stoneLight: '#c9bda9', stoneDark: '#857f74', stoneDeep: '#615d55', ink: '#2c231e',
  moss: '#2e6b3a', leaf: '#245432', leafLight: '#7fb84f', vine: '#2e6b3a', vineLight: '#5a9e45',
  jade: '#a9d06b', jadeDark: '#4f7f6a', wood: '#71452e', woodLight: '#b97d55', bark: '#62452f', char: '#463128',
  fire: '#ef6a52', fireHot: '#f5e050', plate: '#c2aa70', plateDark: '#9e8858', gold: '#d0a82a',
};

export function build(ctx) {
  const { THREE, box, cyl, item, zone, mat, group, physics, part, tween } = ctx;
  const Box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  const flat = { shadow: false, occlude: false };
  const FIRE = { emissive: 0x803010 }, HOT = { emissive: 0x806000 }, GLOW = { emissive: 0x2a5010 };

  ctx.slab(8, 6, C.ground, C.edge);

  // --- ground: lighter clearings and a dirt path to the altar ----------------------
  for (const [w, d, x, z] of [[5, 3.4, 3.6, 2.6], [3.2, 2.6, -5.4, 3.2], [3, 2.4, 5.8, -1.6]]) box(w, 0.02, d, C.groundLight, x, 0.01, z, flat);
  box(1.5, 0.02, 4.4, C.path, -2.6, 0.02, 3.8, flat);
  box(2.4, 0.02, 1.9, C.path, -2.6, 0.021, 1.3, flat);
  for (const [x, z] of [[-3.1, 4.6], [-2.2, 3.4], [-2.9, 2.5]]) box(0.5, 0.022, 0.36, C.pathDark, x, 0.024, z, flat);

  // --- temple ----------------------------------------------------------------------
  const TX = -2.6;
  box(7, 1, 4.4, C.stone, TX, 0.5, -3.3, { solid: true });
  box(5.2, 1, 3.2, C.stoneLight, TX, 1.5, -3.7, { solid: true });
  box(3.4, 1, 2.0, C.stone, TX, 2.5, -4.2, { solid: true });
  box(1.6, 0.9, 1.2, C.stoneDark, TX, 3.45, -4.3, { solid: true });
  box(2.0, 0.2, 1.6, C.stoneDeep, TX, 4.0, -4.3);
  box(0.7, 0.6, 0.06, C.ink, TX, 3.35, -3.69, flat);
  for (const [w, d, x, y, z] of [[1.6, 0.7, -5.0, 1.01, -1.6], [1.2, 0.6, -0.4, 1.01, -1.5], [1.4, 0.5, -4.2, 2.01, -2.5], [0.9, 0.5, -1.0, 2.01, -2.4], [1.0, 0.4, -2.0, 3.01, -3.5]]) {
    box(w, 0.04, d, C.moss, x, y, z, flat);
  }
  // steps up either side of the face
  for (const side of [-1, 1]) for (let s = 0; s < 3; s++) {
    const h = (s + 1) / 3;
    box(0.9, h, 0.3, C.stoneDark, TX + side * 2.55, h / 2, -0.35 - s * 0.3, { solid: true });
  }

  // the stone face
  const FZ = -0.8;                                               // centre of the face block; its front is at z = -0.5
  box(2.6, 1.3, 0.6, C.stoneLight, TX, 1.55, FZ, { solid: true });
  for (const side of [-1, 1]) box(0.7, 0.9, 0.6, C.stoneLight, TX + side * 0.95, 0.45, FZ, { solid: true });
  box(1.2, 0.9, 0.04, C.ink, TX, 0.45, -1.07, flat);
  box(2.8, 0.24, 0.7, C.stone, TX, 2.06, FZ + 0.03);             // brow
  box(3.0, 0.5, 0.5, C.stoneDark, TX, 2.45, FZ - 0.05);          // headdress
  for (const dx of [-1.1, -0.37, 0.37, 1.1]) box(0.4, 0.3, 0.52, C.stone, TX + dx, 2.82, FZ - 0.05);
  box(0.4, 0.7, 0.24, C.stone, TX, 1.3, -0.4);                   // nose
  for (const side of [-1, 1]) {
    box(0.56, 0.44, 0.05, C.ink, TX + side * 0.75, 1.6, -0.485, flat);
    box(0.3, 0.9, 0.5, C.stoneDark, TX + side * 1.45, 1.2, FZ - 0.02);  // ears
  }
  const eyes = [-1, 1].map((side) => {
    const e = part(new THREE.OctahedronGeometry(0.2), C.jade, TX + side * 0.75, 1.6, -0.44, group, GLOW);
    e.scale.set(1.15, 0.9, 0.5);
    e.visible = false;
    return e;
  });
  const mouth = new THREE.Group();
  mouth.position.set(TX, 0.45, -0.62);
  group.add(mouth);
  part(Box(1.2, 0.9, 0.2), C.stoneDark, 0, 0, 0, mouth);
  for (const dx of [-0.36, 0, 0.36]) part(Box(0.2, 0.7, 0.21), C.stoneDeep, dx, 0, 0, mouth);
  const mouthBody = ctx.solid(1.2, 0.9, 0.3, TX, 0.45, -0.65);

  // altar
  const A = { x: TX, z: 1.3 };
  cyl(0.7, 0.55, 0.5, C.stoneLight, A.x, 0.25, A.z, { solid: true });
  cyl(0.78, 0.78, 0.1, C.stoneDark, A.x, 0.5, A.z);
  cyl(0.5, 0.5, 0.02, C.ink, A.x, 0.56, A.z, flat);
  zone('altar', [A.x - 0.85, 0.5, A.z - 0.85], [A.x + 0.85, 2.0, A.z + 0.85]);

  // --- jade eyes ------------------------------------------------------------------
  function makeEye() {
    const g = new THREE.Group();
    part(new THREE.OctahedronGeometry(0.24), C.jade, 0, 0, 0, g, GLOW);
    part(Box(0.12, 0.12, 0.36), C.jadeDark, 0, 0, 0, g);
    return g;
  }
  const eyeShape = { box: [0.34, 0.34, 0.34] };

  // --- vine shrine with the first eye -----------------------------------------------
  const V = { x: 5.6, z: -4.5 };
  box(2.3, 2.0, 0.3, C.stone, V.x, 1.0, V.z - 0.85, { solid: true });
  for (const side of [-1, 1]) box(0.3, 2.0, 1.7, C.stone, V.x + side * 1.0, 1.0, V.z, { solid: true });
  box(2.7, 0.3, 2.1, C.stoneDark, V.x, 2.15, V.z);
  box(1.2, 0.04, 0.8, C.moss, V.x - 0.4, 2.32, V.z, flat);
  box(0.6, 0.6, 0.6, C.stoneLight, V.x, 0.3, V.z - 0.1);
  const eye1 = makeEye();
  eye1.position.set(V.x, 0.84, V.z - 0.1);
  group.add(eye1);
  const vines = new THREE.Group();
  vines.position.set(V.x, 2.0, V.z + 0.87);
  group.add(vines);
  const strips = [];
  for (let k = 0; k < 8; k++) {
    const len = 1.7 + ((k * 7) % 3) * 0.12;
    strips.push(part(Box(0.2, len, 0.08), k % 2 ? C.vine : C.vineLight, -0.77 + k * 0.22, -len / 2, (k % 2) * 0.05, vines));
    if (k % 3 === 0) strips.push(part(Box(0.3, 0.16, 0.1), C.leafLight, -0.77 + k * 0.22, -0.5 - k * 0.12, 0.08, vines));
  }
  zone('vines', [V.x - 1.0, 0, V.z + 0.8], [V.x + 1.0, 2.0, V.z + 2.3]);

  // --- campfire ---------------------------------------------------------------------
  const F = { x: 4.2, z: 2.4 };
  for (let k = 0; k < 7; k++) {
    const a = (k / 7) * Math.PI * 2;
    box(0.26, 0.18, 0.26, k % 2 ? C.stone : C.stoneDark, F.x + Math.cos(a) * 0.62, 0.09, F.z + Math.sin(a) * 0.62, { rotY: a, occlude: false });
  }
  box(0.9, 0.12, 0.14, C.char, F.x, 0.07, F.z, { rotY: 0.6, occlude: false });
  box(0.9, 0.12, 0.14, C.bark, F.x, 0.1, F.z, { rotY: -0.7, occlude: false });
  const flames = [[0, 0, 0.3, 0.8, C.fire, FIRE], [0.16, 0.1, 0.18, 0.5, C.fireHot, HOT], [-0.14, -0.1, 0.2, 0.6, C.fireHot, HOT]].map(([dx, dz, r, h, c, glow]) => {
    const m = part(new THREE.CylinderGeometry(0, r, h, 5), c, F.x + dx, 0.12 + h / 2, F.z + dz, group, glow);
    m.castShadow = false;
    m.userData.h = h;
    return m;
  });
  zone('campfire', [F.x - 0.8, 0, F.z - 0.8], [F.x + 0.8, 1.7, F.z + 0.8]);

  // --- pressure plate, wired to the cage with the second eye --------------------------
  const P = { x: 0.6, z: 4.0 };
  const K = { x: 6.5, z: 0.3 };
  box(1.8, 0.06, 1.8, C.stoneDeep, P.x, 0.03, P.z, flat);
  const plate = box(1.4, 0.14, 1.4, C.plate, P.x, 0.1, P.z, { occlude: false });
  const mark = box(0.6, 0.02, 0.6, C.plateDark, P.x, 0.18, P.z, flat);
  ctx.solid(1.4, 0.12, 1.4, P.x, 0.06, P.z);
  zone('plate', [P.x - 0.75, 0.05, P.z - 0.75], [P.x + 0.75, 1.3, P.z + 0.75]);
  // the channel in the ground that links them
  box(K.x - P.x - 0.9, 0.02, 0.22, C.stoneDeep, (K.x + P.x + 0.9) / 2, 0.015, P.z, flat);
  box(0.22, 0.02, P.z - K.z - 0.55 + 0.11, C.stoneDeep, K.x, 0.015, (P.z + K.z + 0.55 + 0.11) / 2, flat);
  box(1.1, 0.7, 1.1, C.stone, K.x, 0.35, K.z, { solid: true });
  box(1.2, 0.1, 1.2, C.stoneDark, K.x, 0.05, K.z);
  const pen = ctx.cage(K.x, 0.7, K.z, 1.0, 0.9, C.woodLight);
  const eye2 = makeEye();
  eye2.position.set(K.x, 0.7 + 0.24, K.z);
  group.add(eye2);

  // --- ruined wall: the torch lies behind it -------------------------------------------
  const R = { x: -5.6, z: 3.4 };
  box(1.9, 1.5, 1.3, C.stone, R.x, 0.75, R.z, { solid: true });
  box(1.0, 0.6, 1.2, C.stoneDark, R.x - 0.4, 1.8, R.z);
  box(0.5, 0.4, 0.5, C.stoneLight, R.x + 1.4, 0.2, R.z + 0.5, { rotY: 0.5 });
  box(0.4, 0.3, 0.4, C.stoneDark, R.x + 1.1, 0.15, R.z + 1.2, { rotY: 1.1 });
  box(1.0, 0.04, 0.6, C.moss, R.x + 0.3, 1.52, R.z, flat);
  ctx.solid(1.0, 0.6, 1.2, R.x - 0.4, 1.8, R.z);

  // --- trees and undergrowth -------------------------------------------------------------
  const tree = (x, z, h, r) => {
    cyl(0.16, 0.24, h, C.bark, x, h / 2, z, { solid: true });
    for (const [dx, dy, dz, s, c] of [[0, 0, 0, 1, C.leaf], [0.5, -0.3, 0.3, 0.7, C.moss], [-0.45, 0.25, -0.2, 0.65, C.leafLight]]) {
      part(new THREE.IcosahedronGeometry(r * s, 1), c, x + dx * r, h + r * 0.45 + dy * r, z + dz * r);
    }
  };
  tree(-7.2, 0.4, 3.3, 1.15); tree(2.6, -5.0, 3.6, 1.25); tree(-7.1, 5.2, 2.7, 0.95);
  for (const [x, z, r, c] of [[7.3, 5.3, 0.4, C.leaf], [-7.4, -5.3, 0.5, C.moss], [1.9, 5.5, 0.32, C.leafLight], [-0.2, 0.2, 0.3, C.moss], [7.4, 2.6, 0.36, C.leafLight], [3.2, -3.4, 0.34, C.leaf]]) {
    part(new THREE.IcosahedronGeometry(r, 1), c, x, r * 0.7, z);
  }

  // --- loose things -------------------------------------------------------------------
  const torch = new THREE.Group();
  part(Box(0.8, 0.08, 0.08), C.woodLight, -0.05, 0, 0, torch);
  part(Box(0.24, 0.16, 0.16), C.char, 0.36, 0, 0, torch);
  const torchFire = [part(new THREE.IcosahedronGeometry(0.2, 0), C.fire, 0.42, 0.05, 0, torch, FIRE), part(new THREE.IcosahedronGeometry(0.12, 0), C.fireHot, 0.44, 0.14, 0, torch, HOT)];
  torchFire.forEach((m) => { m.visible = false; m.castShadow = false; });
  torch.position.set(R.x - 0.2, 0.1, R.z - 1.1);
  item(torch, { tag: 'torch', shape: { box: [0.9, 0.16, 0.16] }, soft: true, mass: 0.3 });

  const stone = new THREE.Group();
  part(Box(0.56, 0.56, 0.56), C.stoneLight, 0, 0, 0, stone);
  for (const [w, h, d, x, y, z] of [[0.3, 0.3, 0.02, 0, 0, 0.285], [0.3, 0.3, 0.02, 0, 0, -0.285], [0.02, 0.3, 0.3, 0.285, 0, 0], [0.02, 0.3, 0.3, -0.285, 0, 0], [0.3, 0.02, 0.3, 0, 0.285, 0]]) {
    part(Box(w, h, d), C.plateDark, x, y, z, stone);
  }
  stone.position.set(1.7, 0.3, -0.3);
  item(stone, { tag: 'stone', shape: { box: [0.56, 0.56, 0.56] }, soft: true, mass: 1.5 });

  // --- behaviour ------------------------------------------------------------------------
  const fx = {
    ignite(_, __, ev) {
      ev.item.tag = 'flame';
      torchFire.forEach((m) => { m.visible = true; });
    },
    burn() {
      strips.forEach((m, i) => { m.material = mat(i % 2 ? C.fire : C.fireHot, i % 2 ? FIRE : HOT); m.castShadow = false; });
      tween(1.1, (_, k) => { vines.scale.y = 1 - 0.98 * k; }, () => {
        ctx.remove(vines);
        // the eye tumbles out of the shrine
        item(eye1, { tag: 'eye1', shape: eyeShape, soft: true, mass: 0.5, velocity: [0, 4, 4.2] });
      }, 0.15);
    },
    press() {
      tween(0.3, (e) => { plate.position.y = 0.1 - 0.07 * e; mark.position.y = 0.18 - 0.07 * e; });
      pen.open(() => item(eye2, { tag: 'eye2', shape: eyeShape, soft: true, mass: 0.5 }));
    },
    eye(_, state) { eyes[Math.min(2, state.counters.eyes) - 1].visible = true; },
    openMouth() {
      physics.removeStatic(mouthBody);
      tween(1.3, (e) => { mouth.position.y = 0.45 + 0.9 * e; }, null, 0.6);
    },
  };

  function update(dt, t) {
    flames.forEach((m, i) => {
      const s = 1 + 0.16 * Math.sin(t * (9 + i * 2.3) + i * 1.7);
      m.scale.set(1, s, 1);
      m.position.y = 0.12 + (m.userData.h * s) / 2;
    });
    if (torchFire[0].visible) torchFire[1].scale.setScalar(1 + 0.25 * Math.sin(t * 13));
  }

  return { update, fx };
}
