/**
 * The Ancient Museum. A sandstone hall with two walls (back and left):
 *   three plinths along the back wall, each marked with the colour of its relic
 *   display case (front left) holding the scarab until two relics are placed
 *   sarcophagus (centre) holding the sun disc until the scarab is placed
 *   door (back wall, right) -> socket trigger zone
 * The vase is in plain sight; the idol is behind the cat statue.
 */
const C = {
  floorA: '#efe0b8', floorB: '#dcc890', edge: '#9e8858', wall: '#f3eddf', wallDark: '#c2aa70', trim: '#9e8858',
  carpet: '#a8322c', carpetEdge: '#d0a82a', column: '#e1d7c5', stone: '#c9bda9', stoneDark: '#857f74',
  door: '#606b70', doorDark: '#3b4449', day: '#fff3a8',
  terracotta: '#c96b42', terracottaDark: '#7d3a24', cream: '#f3eddf',
  gold: '#e3c832', goldMid: '#d0a82a', goldDark: '#b08420',
  blue: '#338b98', blueDark: '#206577', blueLight: '#80cecf',
  cat: '#3b4449', catDark: '#20282c', wood: '#71452e', woodDark: '#463128', steel: '#9ba7ab',
  violet: '#6b5b8a', red: '#d9503c', ink: '#2c231e', pot: '#62452f',
};

export function build(ctx) {
  const { THREE, box, cyl, item, zone, mat, group, physics, part, tween } = ctx;
  const Box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  const Cyl = (rt, rb, h, seg = 8) => new THREE.CylinderGeometry(rt, rb, h, seg);
  const flat = { shadow: false, occlude: false };

  ctx.slab(7.5, 5.5, C.floorB, C.edge);

  // --- floor: checker tiles and a carpet leading to the door --------------------
  const TX = 1.5, TZ = 11 / 7;
  for (let i = 0; i < 10; i++) for (let j = 0; j < 7; j++) {
    if ((i + j) % 2 === 0) box(TX, 0.02, TZ, C.floorA, -7.5 + TX * (i + 0.5), 0.01, -5.5 + TZ * (j + 0.5), flat);
  }
  box(1.6, 0.02, 8.7, C.carpet, 3.6, 0.03, -0.75, flat);
  for (const dx of [-0.72, 0.72]) box(0.08, 0.022, 8.7, C.carpetEdge, 3.6 + dx, 0.032, -0.75, flat);

  // --- walls ---------------------------------------------------------------------
  const WH = 3.4, BZ = -5.3, LX = -7.3;
  const backWall = (x0, x1) => {
    const len = x1 - x0, cx = (x0 + x1) / 2;
    box(len, WH, 0.4, C.wall, cx, WH / 2, BZ, { solid: true });
    box(len, 0.35, 0.48, C.wallDark, cx, 0.175, BZ);
  };
  backWall(-7.5, 2.6);
  backWall(4.6, 7.5);
  box(2.0, 0.8, 0.4, C.wall, 3.6, 3.0, BZ);                       // lintel over the door
  box(15, 0.22, 0.52, C.wallDark, 0, WH + 0.11, BZ);              // cornice
  box(0.4, WH, 10.6, C.wall, LX, WH / 2, 0.2, { solid: true });
  box(0.48, 0.35, 10.6, C.wallDark, LX, 0.175, 0.2);
  box(0.52, 0.22, 10.6, C.wallDark, LX, WH + 0.11, 0.2);
  // door frame
  for (const x of [2.52, 4.68]) box(0.16, 2.68, 0.5, C.trim, x, 1.34, BZ);
  box(2.32, 0.16, 0.5, C.trim, 3.6, 2.68, BZ);
  // frieze of glyphs along the back wall
  const glyphs = [C.blue, C.terracotta, C.goldMid, C.ink];
  for (let k = 0; k < 15; k++) {
    const x = -6.9 + k * 0.62;
    box(k % 3 === 0 ? 0.16 : 0.34, k % 2 ? 0.34 : 0.2, 0.03, glyphs[k % 4], x, 2.95, BZ + 0.215, flat);
  }
  // banners and a bench on the left wall
  for (const [z, c] of [[-2.4, C.violet], [1.6, C.carpet]]) {
    box(0.05, 2.0, 1.0, c, LX + 0.225, 2.1, z, flat);
    box(0.07, 0.1, 1.16, C.goldDark, LX + 0.235, 3.12, z, flat);
    box(0.06, 0.3, 0.3, C.gold, LX + 0.235, 2.3, z, flat);
  }
  box(0.6, 0.12, 2.0, C.wood, -6.6, 0.5, -0.4, { occlude: false });
  for (const dz of [-0.8, 0.8]) box(0.5, 0.45, 0.12, C.woodDark, -6.6, 0.225, -0.4 + dz, { occlude: false });
  ctx.solid(0.6, 0.56, 2.0, -6.6, 0.28, -0.4);

  // columns
  const column = (x, z) => {
    cyl(0.3, 0.34, WH - 0.4, C.column, x, WH / 2, z, { solid: true });
    box(0.9, 0.2, 0.9, C.wallDark, x, 0.1, z);
    box(0.9, 0.2, 0.9, C.wallDark, x, WH - 0.1, z);
  };
  column(1.9, -4.5); column(5.3, -4.5); column(-6.5, -4.5);

  // --- the door and its socket ----------------------------------------------------
  const DX = 3.6;
  const day = part(Box(2.0, 2.6, 0.02), C.day, DX, 1.3, BZ - 0.19);
  day.material = mat(C.day, { emissive: 0x8a8040 });
  day.castShadow = false;
  const door = new THREE.Group();
  door.position.set(DX, 0, BZ);
  group.add(door);
  part(Box(2.0, 2.6, 0.2), C.door, 0, 1.3, 0, door);
  part(Box(1.7, 2.3, 0.04), C.doorDark, 0, 1.3, 0.1, door);
  const socket = part(new THREE.TorusGeometry(0.4, 0.05, 6, 12), C.goldDark, 0, 1.5, 0.11, door);
  socket.castShadow = false;
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2;
    const ray = part(Box(0.07, 0.22, 0.03), C.goldDark, Math.cos(a) * 0.62, 1.5 + Math.sin(a) * 0.62, 0.115, door);
    ray.rotation.z = a - Math.PI / 2;
    ray.castShadow = false;
  }
  const doorBody = ctx.solid(2.0, 2.6, 0.4, DX, 1.3, BZ);
  zone('door', [DX - 1.0, 0, -5.0], [DX + 1.0, 1.9, -3.3]);

  // --- relics -------------------------------------------------------------------
  function makeVase() {
    const g = new THREE.Group();
    part(Cyl(0.25, 0.13, 0.36), C.terracotta, 0, -0.12, 0, g);
    part(Cyl(0.13, 0.25, 0.2), C.terracotta, 0, 0.16, 0, g);
    part(Cyl(0.255, 0.255, 0.07), C.cream, 0, 0.04, 0, g);
    part(Cyl(0.17, 0.12, 0.1), C.terracottaDark, 0, 0.31, 0, g);
    return g; // spans y -0.30 .. 0.36
  }
  function makeIdol() {
    const g = new THREE.Group();
    part(Box(0.36, 0.12, 0.36), C.goldDark, 0, -0.36, 0, g);
    part(Box(0.26, 0.42, 0.2), C.gold, 0, -0.09, 0, g);
    part(Box(0.34, 0.1, 0.12), C.goldMid, 0, -0.02, 0.07, g);
    part(Box(0.22, 0.22, 0.22), C.gold, 0, 0.23, 0, g);
    part(Box(0.32, 0.1, 0.26), C.blue, 0, 0.37, 0, g);
    return g; // spans y -0.42 .. 0.42
  }
  function makeScarab() {
    const g = new THREE.Group();
    const shell = part(new THREE.IcosahedronGeometry(0.22, 1), C.blue, 0, 0, 0, g);
    shell.scale.set(1, 0.55, 1.3);
    part(Box(0.03, 0.14, 0.5), C.gold, 0, 0.04, 0, g);
    part(Box(0.22, 0.12, 0.14), C.blueDark, 0, -0.02, 0.3, g);
    return g; // about 0.44 x 0.26 x 0.6
  }
  function makeDisc() {
    const g = new THREE.Group();
    part(Cyl(0.3, 0.3, 0.1, 12), C.gold, 0, 0, 0, g);
    part(Cyl(0.13, 0.13, 0.13, 8), C.red, 0, 0, 0, g);
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2;
      const ray = part(Box(0.1, 0.08, 0.14), C.goldMid, Math.sin(a) * 0.34, 0, Math.cos(a) * 0.34, g);
      ray.rotation.y = a;
    }
    return g; // flat, about 0.8 across
  }

  // --- plinths: the colour on top, on the plaque and on the wall names the relic --
  const placed = {};
  const plinth = (name, x, color, make, lift) => {
    const z = -3.2;
    box(1.15, 0.2, 1.15, C.stoneDark, x, 0.1, z);
    box(0.95, 0.85, 0.95, C.stone, x, 0.625, z);
    box(1.15, 0.1, 1.15, color, x, 1.1, z);
    ctx.solid(1.15, 1.15, 1.15, x, 0.575, z);
    box(0.4, 0.4, 0.04, color, x, 0.62, z + 0.49, flat);
    box(1.3, 1.3, 0.05, C.wallDark, x, 2.0, BZ + 0.22, flat);
    box(1.0, 1.0, 0.06, color, x, 2.0, BZ + 0.23, flat);
    zone(`plinth${name[0].toUpperCase()}${name.slice(1)}`, [x - 0.62, 1.15, z - 0.62], [x + 0.62, 2.3, z + 0.62]);
    const copy = make();
    copy.position.set(x, 1.15 + lift, z);
    copy.visible = false;
    group.add(copy);
    placed[name] = copy;
  };
  plinth('vase', -4.4, C.terracotta, makeVase, 0.3);
  plinth('idol', -1.9, C.gold, makeIdol, 0.42);
  plinth('scarab', 0.6, C.blue, makeScarab, 0.13);

  // --- display case with the scarab -------------------------------------------------
  const T = { x: -5.2, z: 2.9 };
  box(1.3, 0.8, 1.3, C.wood, T.x, 0.4, T.z, { solid: true });
  box(1.36, 0.1, 1.36, C.woodDark, T.x, 0.05, T.z);
  box(1.1, 0.04, 1.1, C.violet, T.x, 0.82, T.z, flat);
  const showcase = ctx.cage(T.x, 0.84, T.z, 1.1, 0.95, C.steel);
  const scarab = makeScarab();
  scarab.position.set(T.x, 0.84 + 0.13, T.z);
  group.add(scarab);

  // --- sarcophagus with the sun disc ------------------------------------------------
  const S = { x: -0.8, z: 1.6 };
  box(2.8, 0.7, 1.2, C.goldMid, S.x, 0.35, S.z, { solid: true });
  box(2.9, 0.14, 1.3, C.goldDark, S.x, 0.07, S.z);
  for (const dx of [-0.9, -0.3, 0.3, 0.9]) box(0.18, 0.5, 1.22, C.blue, S.x + dx, 0.42, S.z, flat);
  box(2.5, 0.02, 0.9, C.ink, S.x, 0.705, S.z, flat);
  const lid = new THREE.Group();
  lid.position.set(S.x, 0.72, S.z);
  group.add(lid);
  part(Box(2.9, 0.22, 1.3), C.gold, 0, 0.11, 0, lid);
  part(Box(0.6, 0.2, 0.7), C.goldMid, -0.95, 0.32, 0, lid);          // head
  part(Box(0.5, 0.06, 0.4), C.blue, -0.95, 0.45, 0, lid);           // headdress
  part(Box(0.14, 0.05, 0.9), C.blue, -0.5, 0.245, 0, lid);          // collar
  part(Box(1.5, 0.12, 0.7), C.goldMid, 0.35, 0.28, 0, lid);         // body
  for (const dx of [0, 0.4, 0.8]) part(Box(0.1, 0.05, 0.72), C.terracotta, 0.05 + dx, 0.36, 0, lid);
  let lidBody = ctx.solid(2.9, 0.22, 1.3, S.x, 0.83, S.z);

  // --- cat statue: the idol sits out of sight behind its block ------------------------
  const K = { x: 6.1, z: 1.0 };
  box(1.8, 1.0, 1.8, C.stoneDark, K.x, 0.5, K.z, { solid: true });
  box(1.9, 0.12, 1.9, C.stone, K.x, 1.0, K.z);
  box(0.95, 1.3, 1.1, C.cat, K.x, 1.7, K.z + 0.1);
  box(0.6, 0.5, 0.5, C.cat, K.x, 1.3, K.z - 0.55);                  // front paws
  box(0.7, 0.6, 0.7, C.cat, K.x, 2.65, K.z - 0.1);
  for (const dx of [-0.24, 0.24]) box(0.2, 0.34, 0.2, C.catDark, K.x + dx, 3.1, K.z - 0.1);
  box(0.99, 0.14, 1.14, C.gold, K.x, 2.28, K.z + 0.1);              // collar
  ctx.solid(0.95, 2.4, 1.2, K.x, 2.2, K.z);

  // --- dressing ---------------------------------------------------------------------
  for (const [x, z, s] of [[-6.5, 4.6, 1], [-6.45, -2.4, 0.8]]) {     // big storage jars, fixed
    cyl(0.42 * s, 0.26 * s, 0.9 * s, C.pot, x, 0.45 * s, z, { solid: true });
    cyl(0.26 * s, 0.42 * s, 0.4 * s, C.pot, x, 1.1 * s, z);
    cyl(0.3 * s, 0.24 * s, 0.14 * s, C.woodDark, x, 1.36 * s, z);
  }
  // rope posts in front of the sarcophagus
  for (const dx of [-1.6, 0, 1.6]) {
    cyl(0.05, 0.05, 0.8, C.goldDark, S.x + dx, 0.4, S.z + 1.25, { occlude: false });
    cyl(0.14, 0.16, 0.06, C.goldDark, S.x + dx, 0.03, S.z + 1.25, { occlude: false });
  }
  box(3.2, 0.06, 0.06, C.carpet, S.x, 0.68, S.z + 1.25, { occlude: false });
  // information stand
  cyl(0.04, 0.04, 0.9, C.doorDark, 2.0, 0.45, 4.6, { occlude: false });
  box(0.7, 0.45, 0.05, C.cream, 2.0, 1.0, 4.6, { occlude: false });
  for (const dy of [0.1, 0, -0.1]) box(0.5, 0.04, 0.02, C.stoneDark, 2.0, 1.0 + dy, 4.63, flat);

  // --- loose relics -------------------------------------------------------------------
  const vase = makeVase();
  vase.position.set(1.3, 0.31, 3.3);
  item(vase, { tag: 'vase', shape: { box: [0.48, 0.66, 0.48] }, soft: true, mass: 0.6 });
  const idol = makeIdol();
  idol.position.set(K.x, 0.43, K.z - 1.4);
  item(idol, { tag: 'idol', shape: { box: [0.36, 0.84, 0.36] }, soft: true, mass: 0.8 });

  // --- behaviour ------------------------------------------------------------------------
  const fx = {
    place(name) { placed[name].visible = true; },
    openCase() {
      showcase.open(() => item(scarab, { tag: 'scarab', shape: { box: [0.44, 0.26, 0.6] }, soft: true, mass: 0.5 }));
    },
    openTomb() {
      const SLIDE = 0.6;
      physics.removeStatic(lidBody);
      tween(1.1, (e) => { lid.position.z = S.z - SLIDE * e; }, () => { lidBody = ctx.solid(2.9, 0.22, 1.3, S.x, 0.83, S.z - SLIDE); }, 0.4);
      tween(0, null, () => {
        const disc = makeDisc();
        disc.position.set(S.x, 1.0, S.z + 0.42);
        item(disc, { tag: 'disc', shape: { box: [0.74, 0.12, 0.74] }, soft: true, mass: 0.6, velocity: [0.8, 7.5, 2.4] });
      }, 1.6);
    },
    openDoor() {
      const sun = makeDisc();
      sun.rotation.x = Math.PI / 2;
      sun.position.set(0, 1.5, 0.12);
      door.add(sun);
      physics.removeStatic(doorBody);
      tween(1.3, (e) => { door.position.x = DX + 2.05 * e; }, null, 0.5);
    },
  };

  return { fx };
}
