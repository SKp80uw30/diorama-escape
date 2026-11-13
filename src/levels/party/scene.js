/**
 * The Birthday Party. A room with two walls (back and left) and an unseen ceiling
 * that floating balloons rest against.
 *   cactus (front right)   -> pops a balloon that is let go above it
 *   cake (on the table)    -> takes the three candles
 *   big present (left)     -> opens when the candles are lit, holds the key
 *   door (back wall, right)
 * Two balloons float at the ceiling; the third is stuck under the table and can
 * only be reached by tilting the view low.
 */
const C = {
  floor: '#b97d55', floorLine: '#9c6440', edge: '#71452e', wall: '#bce9e4', wallStripe: '#80cecf', skirting: '#f3eddf',
  rug: '#e8c8e0', rugRing: '#9d8cc0', table: '#9c6440', tableDark: '#71452e', white: '#ffffff', cream: '#f3eddf',
  pink: '#f2b08a', hotPink: '#ef6a52', red: '#d9503c', yellow: '#f5e050', blue: '#3f6ea5', sky: '#6fa0c9', green: '#5a9e45',
  greenDark: '#2e6b3a', violet: '#6b5b8a', violetDark: '#4a3f66', gold: '#e3c832', goldDark: '#b08420', pot: '#c96b42',
  door: '#d9503c', doorDark: '#a8322c', day: '#fff3a8', ink: '#2c231e', grey: '#9ba7ab', string: '#f3eddf', fire: '#ef6a52', hot: '#f5e050',
};
const CEILING = 3.9;

export function build(ctx) {
  const { THREE, box, cyl, item, zone, mat, group, physics, part, tween } = ctx;
  const Box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  const Cyl = (rt, rb, h, seg = 10) => new THREE.CylinderGeometry(rt, rb, h, seg);
  const flat = { shadow: false, occlude: false };
  const open = { occlude: false };

  ctx.slab(7, 5.2, C.floor, C.edge);
  ctx.solid(16, 0.4, 13, 0, CEILING + 0.2, 0);          // what the balloons float up against
  for (let z = -4.4; z < 5; z += 0.8) box(14, 0.02, 0.04, C.floorLine, 0, 0.01, z, flat);
  cyl(3.1, 3.1, 0.02, C.rugRing, 0, 0.02, 0.6, { segments: 18, ...flat });
  cyl(2.8, 2.8, 0.022, C.rug, 0, 0.022, 0.6, { segments: 18, ...flat });
  for (const [x, z, c] of [[-3.6, 4.2, C.yellow], [2.9, 4.4, C.hotPink], [5.9, 0.4, C.sky], [-5.6, -1.4, C.green], [3.4, -2.6, C.yellow], [-2.2, -3.6, C.hotPink], [1.2, 3.9, C.sky]]) {
    box(0.14, 0.012, 0.14, c, x, 0.03, z, { rotY: x, ...flat });
  }

  // --- walls and door ---------------------------------------------------------------
  const WH = 3.6, BZ = -5.0, LX = -6.8, DX = 4.2;
  const backWall = (x0, x1) => {
    box(x1 - x0, WH, 0.4, C.wall, (x0 + x1) / 2, WH / 2, BZ, { solid: true });
    box(x1 - x0, 0.3, 0.46, C.skirting, (x0 + x1) / 2, 0.15, BZ);
  };
  backWall(-7, DX - 0.9);
  backWall(DX + 0.9, 7);
  box(1.8, WH - 2.6, 0.4, C.wall, DX, 2.6 + (WH - 2.6) / 2, BZ);
  box(0.4, WH, 10.2, C.wall, LX, WH / 2, 0.1, { solid: true });
  box(0.46, 0.3, 10.2, C.skirting, LX, 0.15, 0.1);
  for (let x = -6.2; x < DX - 1; x += 1.0) box(0.3, WH - 0.3, 0.02, C.wallStripe, x, WH / 2 + 0.15, BZ + 0.21, flat);
  for (let z = -4.2; z < 5; z += 1.0) box(0.02, WH - 0.3, 0.3, C.wallStripe, LX + 0.21, WH / 2 + 0.15, z, flat);
  // bunting along the back wall
  box(11, 0.03, 0.03, C.string, -1.7, 3.2, BZ + 0.24, flat);
  [C.red, C.yellow, C.blue, C.green, C.hotPink, C.violet].forEach((c, i) => {
    for (let k = 0; k < 3; k++) {
      const f = box(0.36, 0.36, 0.03, c, -6.6 + (i + k * 6) * 0.58, 2.98, BZ + 0.24, flat);
      f.rotation.z = Math.PI / 4;
    }
  });
  // big number on the left wall
  for (const [y, z, h, d] of [[2.9, 0.4, 0.2, 1.0], [2.4, 0.8, 0.8, 0.2], [1.9, 0.4, 0.2, 1.0], [1.4, 0.0, 0.8, 0.2], [0.9, 0.4, 0.2, 1.0]]) box(0.05, h, d, C.gold, LX + 0.23, y, z - 2.0, flat);
  // door
  for (const x of [DX - 0.98, DX + 0.98]) box(0.16, 2.68, 0.5, C.skirting, x, 1.34, BZ);
  box(2.12, 0.16, 0.5, C.skirting, DX, 2.68, BZ);
  const day = part(Box(1.8, 2.6, 0.02), C.day, DX, 1.3, BZ - 0.19, group, { emissive: 0x8a8040 });
  day.castShadow = false;
  const door = new THREE.Group();
  door.position.set(DX, 0, BZ);
  group.add(door);
  part(Box(1.8, 2.6, 0.2), C.door, 0, 1.3, 0, door);
  for (const y of [0.75, 1.95]) part(Box(1.3, 0.9, 0.04), C.doorDark, 0, y, 0.1, door);
  part(Box(0.2, 0.34, 0.05), C.gold, 0.62, 1.3, 0.11, door);
  part(Box(0.06, 0.12, 0.06), C.ink, 0.62, 1.26, 0.12, door);
  const doorBody = ctx.solid(1.8, 2.6, 0.4, DX, 1.3, BZ);
  zone('door', [DX - 0.9, 0, -4.7], [DX + 0.9, 1.9, -3.2]);

  // --- table and cake -----------------------------------------------------------------
  const TZ = 0.6, TOP = 1.27;
  box(4.4, 0.14, 2.2, C.table, 0, TOP - 0.07, TZ, { solid: true });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(0.16, TOP - 0.14, 0.16, C.tableDark, sx * 2.0, (TOP - 0.14) / 2, TZ + sz * 0.9, { solid: true, occlude: false });
  const CK = { x: -0.9, z: TZ };
  cyl(0.86, 0.86, 0.05, C.white, CK.x, TOP + 0.025, CK.z, open);
  cyl(0.7, 0.7, 0.45, C.pink, CK.x, TOP + 0.275, CK.z, open);
  cyl(0.72, 0.72, 0.08, C.white, CK.x, TOP + 0.5, CK.z, open);
  cyl(0.48, 0.48, 0.36, C.cream, CK.x, TOP + 0.72, CK.z, open);
  cyl(0.5, 0.5, 0.07, C.hotPink, CK.x, TOP + 0.92, CK.z, open);
  for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; box(0.1, 0.1, 0.1, C.red, CK.x + Math.cos(a) * 0.6, TOP + 0.58, CK.z + Math.sin(a) * 0.6, flat); }
  ctx.solid(1.4, 0.95, 1.4, CK.x, TOP + 0.475, CK.z);
  const CAKE_TOP = TOP + 0.955;
  zone('cake', [CK.x - 0.85, TOP, CK.z - 0.85], [CK.x + 0.85, 3.3, CK.z + 0.85]);
  // plates, cups, a party hat
  for (const [x, z] of [[0.8, TZ - 0.5], [1.5, TZ + 0.5]]) { cyl(0.3, 0.3, 0.04, C.white, x, TOP + 0.02, z, flat); cyl(0.1, 0.08, 0.2, [C.sky, C.yellow][x > 1 ? 1 : 0], x + 0.36, TOP + 0.1, z - 0.2, open); }
  cyl(0, 0.2, 0.46, C.blue, 1.75, TOP + 0.23, TZ - 0.6, { segments: 8, occlude: false });
  // chairs along the back and at the ends (the front is left open)
  const chair = (x, z, rotY, c) => {
    const g = new THREE.Group();
    g.position.set(x, 0, z); g.rotation.y = rotY; group.add(g);
    part(Box(0.7, 0.1, 0.7), c, 0, 0.66, 0, g);
    part(Box(0.7, 0.8, 0.1), c, 0, 1.1, -0.3, g);
    for (const sx of [-0.28, 0.28]) for (const sz of [-0.28, 0.28]) part(Box(0.08, 0.62, 0.08), C.tableDark, sx, 0.31, sz, g);
  };
  chair(-1.2, TZ - 1.75, 0, C.sky); chair(1.2, TZ - 1.75, 0, C.yellow); chair(-3.0, TZ, Math.PI / 2, C.hotPink); chair(3.0, TZ, -Math.PI / 2, C.green);

  // --- cactus: the one prickly thing at the party -----------------------------------------
  const P = { x: 5.4, z: 2.6 };
  box(1.0, 0.8, 1.0, C.cream, P.x, 0.4, P.z, { solid: true });
  box(1.06, 0.08, 1.06, C.grey, P.x, 0.8, P.z);
  cyl(0.3, 0.22, 0.34, C.pot, P.x, 1.01, P.z, open);
  cyl(0.2, 0.24, 0.95, C.green, P.x, 1.65, P.z, { segments: 7, occlude: false });
  box(0.36, 0.14, 0.14, C.green, P.x + 0.3, 1.6, P.z, open); box(0.14, 0.4, 0.14, C.green, P.x + 0.42, 1.8, P.z, open);
  box(0.3, 0.14, 0.14, C.green, P.x - 0.28, 1.4, P.z, open); box(0.14, 0.3, 0.14, C.green, P.x - 0.38, 1.55, P.z, open);
  for (let k = 0; k < 10; k++) { const a = k * 2.4; box(0.05, 0.05, 0.05, C.white, P.x + Math.cos(a) * 0.23, 1.3 + k * 0.085, P.z + Math.sin(a) * 0.23, flat); }
  ctx.solid(0.5, 1.3, 0.5, P.x, 1.45, P.z);
  zone('pin', [P.x - 0.75, 0.9, P.z - 0.75], [P.x + 0.75, CEILING, P.z + 0.75]);

  // --- the big present ------------------------------------------------------------------
  const G = { x: -4.7, z: 2.8 };
  box(1.4, 1.1, 1.4, C.violet, G.x, 0.55, G.z, { solid: true });
  box(0.24, 1.12, 1.42, C.gold, G.x, 0.55, G.z); box(1.42, 1.12, 0.24, C.gold, G.x, 0.55, G.z);
  const lid = new THREE.Group();
  lid.position.set(G.x, 1.1, G.z);
  group.add(lid);
  part(Box(1.54, 0.3, 1.54), C.violetDark, 0, 0.15, 0, lid);
  part(Box(0.26, 0.32, 1.56), C.gold, 0, 0.15, 0, lid); part(Box(1.56, 0.32, 0.26), C.gold, 0, 0.15, 0, lid);
  for (const s of [-1, 1]) { const b = part(Box(0.5, 0.26, 0.2), C.gold, s * 0.24, 0.42, 0, lid); b.rotation.z = s * 0.5; }
  const lidBody = ctx.solid(1.54, 0.3, 1.54, G.x, 1.25, G.z);
  // small presents and a music box for dressing
  for (const [x, z, w, h, c, r] of [[-5.9, -3.9, 0.9, 0.6, C.red, C.yellow], [-5.0, -4.0, 0.7, 0.9, C.sky, C.white], [-5.6, -3.8, 0.5, 0.4, C.green, C.hotPink]]) {
    const y = c === C.green ? 0.8 : h / 2;
    box(w, h, w, c, x, y, z, { solid: c !== C.green });
    box(w + 0.02, h + 0.02, 0.14, r, x, y, z);
  }
  box(1.1, 0.6, 0.4, C.ink, 6.0, 0.3, -4.2, { solid: true });
  for (const dx of [-0.3, 0.3]) cyl(0.18, 0.18, 0.04, C.grey, 6.0 + dx, 0.3, -3.98, { rot: [Math.PI / 2, 0, 0], ...flat });

  // --- balloons and candles ---------------------------------------------------------------
  const candleColor = { [C.red]: C.sky, [C.yellow]: C.hotPink, [C.blue]: C.yellow };
  function balloon(x, y, z, color) {
    const g = new THREE.Group();
    const skin = part(new THREE.IcosahedronGeometry(0.34, 1), color, 0, 0, 0, g);
    skin.scale.y = 1.15;
    part(new THREE.CylinderGeometry(0.02, 0.08, 0.1, 5), color, 0, -0.42, 0, g);
    const str = part(Box(0.025, 0.8, 0.025), C.string, 0, -0.86, 0, g);
    str.castShadow = false;
    g.position.set(x, y, z);
    g.userData.color = color;
    return item(g, { tag: 'balloon', shape: { sphere: 0.34 }, mass: 0.1, lift: 7, upright: true });
  }
  balloon(0.9, 0.8, TZ + 0.45, C.blue);     // stuck under the table: only its underside shows from the front
  balloon(-3.2, CEILING - 0.4, -2.6, C.red);
  balloon(2.4, CEILING - 0.4, -1.9, C.yellow);
  function makeCandle(color, lit) {
    const g = new THREE.Group();
    part(Cyl(0.07, 0.07, 0.42, 7), color, 0, 0, 0, g);
    for (const y of [-0.1, 0.06]) part(Cyl(0.075, 0.075, 0.05, 7), C.white, 0, y, 0, g);
    part(Box(0.02, 0.08, 0.02), C.ink, 0, 0.25, 0, g);
    if (lit) { const f = part(new THREE.CylinderGeometry(0, 0.06, 0.18, 5), C.hot, 0, 0.36, 0, g, { emissive: 0x806000 }); f.castShadow = false; g.userData.flame = f; }
    return g;
  }
  const onCake = [];

  // --- behaviour ------------------------------------------------------------------------
  const fx = {
    pop(_, __, ev) {
      const p = ev.item.mesh.position, color = ev.item.mesh.userData.color;
      ctx.burst(p.x, p.y, p.z, [color, C.white, C.yellow, C.hotPink], 16, 1.3);
      const candle = makeCandle(candleColor[color], false);
      candle.position.copy(p);
      candle.userData.color = candleColor[color];
      item(candle, { tag: 'candle', shape: { box: [0.18, 0.46, 0.18] }, soft: true, mass: 0.3, velocity: [-1.6, 1.5, -0.4] });
    },
    candle(_, state, ev) {
      const n = state.counters.candles - 1, a = (n / 3) * Math.PI * 2 + 0.5;
      const c = makeCandle(ev.item.mesh.userData.color, true);
      c.position.set(CK.x + Math.cos(a) * 0.24, CAKE_TOP + 0.21, CK.z + Math.sin(a) * 0.24);
      group.add(c);
      onCake.push(c);
    },
    party() {
      ctx.burst(CK.x, CAKE_TOP + 0.6, CK.z, [C.red, C.yellow, C.sky, C.green, C.hotPink], 18, 1.6);
      physics.removeStatic(lidBody);
      tween(0.7, (e, k) => { lid.position.set(G.x - 1.5 * e, 1.1 + Math.sin(k * Math.PI) * 1.4 - 1.02 * k, G.z - 0.3 * e); lid.rotation.z = 0.5 * e; }, null, 0.5);
      tween(0, null, () => {
        ctx.burst(G.x, 1.4, G.z, [C.gold, C.violet, C.white], 12, 1.2);
        const key = new THREE.Group();
        const ring = part(new THREE.TorusGeometry(0.16, 0.06, 6, 10), C.gold, -0.24, 0, 0, key);
        ring.rotation.x = Math.PI / 2;
        part(Box(0.5, 0.09, 0.09), C.gold, 0.14, 0, 0, key);
        part(Box(0.1, 0.09, 0.2), C.goldDark, 0.33, 0, 0.1, key);
        key.position.set(G.x, 1.3, G.z);
        item(key, { tag: 'key', shape: { box: [0.75, 0.14, 0.4] }, soft: true, mass: 0.5, velocity: [2.6, 7, -0.4] });
      }, 1.0);
    },
    openDoor() {
      physics.removeStatic(doorBody);
      tween(1.2, (e) => { door.position.x = DX + 1.85 * e; }, null, 0.4);
    },
  };

  function update(dt, t) {
    onCake.forEach((c, i) => { c.userData.flame.scale.y = 1 + 0.3 * Math.sin(t * 11 + i * 2); });
  }

  return { update, fx };
}
