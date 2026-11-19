/**
 * The Concert. The hall fills the back left of the board behind a low wall, so
 * you can see in; the street runs along the front and the right.
 *   five fans queue along the right side of the hall, at the door
 *   street lamp (front right) with no bulb     -> the bulb is on the ticket booth counter
 *   power box on the hall's front wall          -> the plug is on the road cases
 * Give a fan the ticket in their colour and they walk in and dance.
 */
import { COLORS } from './puzzle.js';

const C = {
  street: '#51575c', streetDark: '#3b4449', kerb: '#9ba7ab', pavement: '#c7d3d8', line: '#f5e050', edge: '#2c3237',
  hallFloor: '#2c3237', wall: '#4a3f66', wallDark: '#20282c', wallTrim: '#6b5b8a', stage: '#62452f', stageTop: '#9c6440',
  black: '#20282c', grey: '#606b70', greyLight: '#9ba7ab', white: '#ffffff', cream: '#f3eddf', off: '#463f38', glow: '#fff3a8',
  booth: '#d9503c', boothDark: '#a8322c', awning: '#f3eddf', orange: '#e08a5c', wood: '#71452e', denim: '#3b4449', case: '#3b4449', steel: '#9ba7ab',
};
const TICKET = { red: '#d9503c', blue: '#3f6ea5', yellow: '#f5e050', violet: '#9d8cc0', green: '#5a9e45' };
const DIM = { red: '#7d3a24', blue: '#164456', yellow: '#86601c', violet: '#4a3f66', green: '#1b3f2a' };
const GLOW = { red: 0x802018, blue: 0x183870, yellow: 0x806000, violet: 0x403070, green: 0x205018 };
const SKIN = ['#f2b08a', '#9c6440', '#e1d7c5', '#b97d55', '#a87b4a'];
const HAIR = ['#2c231e', '#20282c', '#b08420', '#62452f', '#a8322c'];

export function build(ctx) {
  const { THREE, box, cyl, item, zone, mat, group, physics, part, tween } = ctx;
  const Box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  const flat = { shadow: false, occlude: false };
  const open = { occlude: false };

  ctx.slab(8.5, 6, C.street, C.edge);

  // --- street -----------------------------------------------------------------------
  const HX = 1.5, HZ = 1.0;                                  // the hall's right and front edges
  box(17, 0.04, 2.6, C.pavement, 0, 0.02, HZ + 1.3, flat);           // pavement along the front of the hall
  box(7 - HX + 1.5, 0.04, 7, C.pavement, (8.5 + HX) / 2, 0.021, HZ - 3.5, flat);   // and down its right side
  box(17, 0.06, 0.16, C.kerb, 0, 0.03, HZ + 2.65, flat);
  for (let x = -7.5; x < 8; x += 2.2) box(1.1, 0.012, 0.14, C.line, x, 0.012, 5.0, flat);

  // --- hall: tall walls at the back and left, low walls at the front and right ---------------
  const WH = 3.5, BZ = -5.8, LX = -8.3;
  box(HX + 8.5, 0.03, HZ + 6, C.hallFloor, (HX - 8.5) / 2, 0.025, (HZ - 6) / 2, flat);
  box(HX + 8.5, WH, 0.4, C.wall, (HX - 8.5) / 2, WH / 2, BZ, { solid: true });
  box(0.4, WH, HZ + 6 - 0.4, C.wall, LX, WH / 2, (HZ - 6) / 2 + 0.2, { solid: true });
  box(HX + 8.5, 0.2, 0.46, C.wallTrim, (HX - 8.5) / 2, WH + 0.1, BZ);
  box(0.46, 0.2, HZ + 6, C.wallTrim, LX, WH + 0.1, (HZ - 6) / 2);
  const LOW = 0.9;
  box(HX + 8.5, LOW, 0.3, C.wallDark, (HX - 8.5) / 2, LOW / 2, HZ, { solid: true });
  box(HX + 8.5, 0.08, 0.36, C.wallTrim, (HX - 8.5) / 2, LOW + 0.04, HZ);
  const DZ = -1.5;                                           // the door is in the right-hand wall
  for (const [z0, z1] of [[BZ, DZ - 0.7], [DZ + 0.7, HZ]]) {
    box(0.3, LOW, z1 - z0, C.wallDark, HX, LOW / 2, (z0 + z1) / 2, { solid: true });
    box(0.36, 0.08, z1 - z0, C.wallTrim, HX, LOW + 0.04, (z0 + z1) / 2);
  }
  for (const dz of [-0.78, 0.78]) box(0.34, 2.6, 0.2, C.wallTrim, HX, 1.3, DZ + dz, { solid: true });
  box(0.4, 0.5, 1.9, C.black, HX, 2.85, DZ);
  for (let k = 0; k < 4; k++) box(0.05, 0.3, 0.22, [TICKET.red, TICKET.yellow, TICKET.blue, TICKET.green][k], HX + 0.22, 2.85, DZ + 0.6 - k * 0.4, flat);   // sign over the door
  for (const [x, c] of [[-6.6, TICKET.red], [-5.2, TICKET.yellow], [0.2, TICKET.blue]]) {       // posters on the back wall
    box(0.9, 1.3, 0.03, C.cream, x, 2.3, BZ + 0.22, flat);
    box(0.7, 0.6, 0.04, c, x, 2.5, BZ + 0.23, flat);
  }

  // --- stage, band, lights ------------------------------------------------------------------
  const ST = { x: -3.6, z: -4.5, top: 0.6 };
  box(6.4, ST.top, 2.2, C.stage, ST.x, ST.top / 2, ST.z, { solid: true });
  box(6.4, 0.04, 2.2, C.stageTop, ST.x, ST.top + 0.02, ST.z, flat);
  for (const dx of [-2.8, 2.8]) {
    box(0.8, 1.5, 0.7, C.black, ST.x + dx, ST.top + 0.75, ST.z - 0.5, { solid: true });
    for (const y of [0.4, 1.1]) cyl(0.26, 0.26, 0.04, C.grey, ST.x + dx, ST.top + y, ST.z - 0.13, { rot: [Math.PI / 2, 0, 0], ...flat });
  }
  cyl(0.4, 0.4, 0.4, C.cream, ST.x + 1.2, ST.top + 0.4, ST.z - 0.5, open);         // drums
  cyl(0.24, 0.24, 0.3, C.booth, ST.x + 0.6, ST.top + 0.55, ST.z - 0.3, open);
  cyl(0.3, 0.3, 0.03, C.line, ST.x + 1.8, ST.top + 0.9, ST.z - 0.4, open);
  cyl(0.02, 0.02, 0.9, C.grey, ST.x + 1.8, ST.top + 0.45, ST.z - 0.4, open);
  cyl(0.03, 0.03, 1.3, C.grey, ST.x - 1.0, ST.top + 0.65, ST.z + 0.5, open);       // mic stand
  box(0.1, 0.1, 0.2, C.black, ST.x - 1.0, ST.top + 1.32, ST.z + 0.56, open);
  // lighting truss
  for (const dx of [-3.1, 3.1]) cyl(0.07, 0.07, 3.3, C.grey, ST.x + dx, 1.65, ST.z + 1.0, open);
  box(6.4, 0.14, 0.14, C.grey, ST.x, 3.3, ST.z + 1.0, open);
  const spots = COLORS.map((c, i) => { const m = box(0.3, 0.3, 0.36, C.off, ST.x - 2.4 + i * 1.2, 3.1, ST.z + 1.0, open); m.userData.color = c; return m; });
  const spotPool = cyl(0.7, 0.7, 0.02, C.stageTop, ST.x - 0.2, ST.top + 0.05, ST.z + 0.35, { segments: 12, ...flat });
  // dance floor: tiles that light up when the power is on
  const tiles = [];
  for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) {
    const c = COLORS[(i + j * 2) % 5];
    const m = box(1.08, 0.03, 1.08, DIM[c], -6.3 + i * 1.16, 0.045, -2.6 + j * 1.16, flat);
    m.userData = { c, i, j };
    tiles.push(m);
  }

  // --- people ----------------------------------------------------------------------------------
  function makePerson(shirt, n) {
    const g = new THREE.Group();
    part(Box(0.36, 0.6, 0.26), C.denim, 0, 0.3, 0, g);
    part(Box(0.5, 0.62, 0.3), shirt, 0, 0.91, 0, g);
    part(Box(0.34, 0.34, 0.34), SKIN[n % 5], 0, 1.4, 0, g);
    part(Box(0.38, 0.14, 0.38), HAIR[n % 5], 0, 1.6, 0, g);
    part(Box(0.38, 0.2, 0.1), HAIR[n % 5], 0, 1.5, -0.16, g);
    for (const s of [-0.08, 0.08]) part(Box(0.05, 0.05, 0.02), C.black, s, 1.42, 0.175, g);
    const arms = [-1, 1].map((s) => { const a = new THREE.Group(); a.position.set(s * 0.32, 1.16, 0); g.add(a); part(Box(0.14, 0.56, 0.16), shirt, 0, -0.24, 0, a); part(Box(0.12, 0.12, 0.14), SKIN[n % 5], 0, -0.56, 0, a); return a; });
    g.userData = { arms };
    return g;
  }
  /** glow: for the ticket pictured in a fan's bubble, so its colour reads from any angle */
  function makeTicket(color, glow) {
    const g = new THREE.Group();
    part(Box(0.62, 0.05, 0.36), color, 0, 0, 0, g, glow ? { emissive: glow } : undefined);
    part(Box(0.05, 0.055, 0.36), C.white, 0.16, 0, 0, g);
    part(Box(0.18, 0.055, 0.14), C.white, -0.12, 0, 0, g);
    return g;
  }
  const ticketOpts = { shape: { box: [0.62, 0.07, 0.36] }, soft: true, mass: 0.2 };

  // the queue, nearest the door first; each fan has a bubble showing the ticket they want
  const QZ = DZ, danceSpots = [[-0.6, -0.4], [-2.9, -1.5], [-5.2, -0.3], [-1.7, -2.5], [-4.2, -2.4]];
  const fans = {};
  COLORS.forEach((c, n) => {
    const x = 2.8 + n * 1.25;
    const g = makePerson(TICKET[c], n);
    g.position.set(x, 0, QZ);
    g.rotation.y = -Math.PI / 2;                             // facing the door
    group.add(g);
    const bubble = new THREE.Group();
    bubble.position.set(x, 2.35, QZ);
    group.add(bubble);
    part(Box(0.84, 0.58, 0.06), C.white, 0, 0, 0, bubble).castShadow = false;
    part(Box(0.14, 0.14, 0.05), C.white, -0.14, -0.36, 0, bubble).castShadow = false;
    const want = makeTicket(TICKET[c], GLOW[c]);
    want.rotation.x = Math.PI / 2;
    want.position.z = 0.05;
    bubble.add(want);
    bubble.rotation.y = Math.PI / 4;                         // towards where the level starts facing
    const body = ctx.solid(0.5, 1.6, 0.4, x, 0.8, QZ);
    zone(`fan-${c}`, [x - 0.56, 0, QZ - 0.6], [x + 0.56, 2.7, QZ + 0.6]);
    fans[c] = { g, bubble, body, n, x, spot: danceSpots[n], dancing: false, phase: n * 1.3 };
  });
  for (let k = 0; k <= 5; k++) cyl(0.05, 0.05, 0.8, C.line, 2.2 + k * 1.25, 0.4, QZ - 0.95, open);   // queue rope
  box(6.25, 0.05, 0.05, C.boothDark, 5.325, 0.72, QZ - 0.95, open);

  // --- ticket booth: the bulb is on its counter, a ticket is behind it -------------------------
  const B = { x: 5.6, z: 3.5 };
  box(1.7, 2.0, 1.4, C.booth, B.x, 1.0, B.z, { solid: true });
  box(1.9, 0.14, 1.7, C.awning, B.x, 2.07, B.z + 0.1);
  for (const dx of [-0.6, 0, 0.6]) box(0.3, 0.15, 1.72, C.boothDark, B.x + dx, 2.07, B.z + 0.1, flat);
  box(1.1, 0.7, 0.04, C.black, B.x, 1.45, B.z + 0.71, flat);
  box(1.5, 0.08, 0.4, C.cream, B.x, 1.0, B.z + 0.85, { solid: true });
  box(1.2, 0.3, 0.04, C.cream, B.x, 0.55, B.z + 0.71, flat);
  for (const dx of [-0.4, 0, 0.4]) box(0.24, 0.14, 0.05, C.boothDark, B.x + dx, 0.55, B.z + 0.72, flat);

  // --- street lamp with no bulb ------------------------------------------------------------------
  const L = { x: 2.4, z: 4.3 };
  cyl(0.08, 0.12, 3.2, C.black, L.x, 1.6, L.z, { solid: true });
  cyl(0.2, 0.24, 0.16, C.black, L.x, 0.08, L.z, open);
  box(0.9, 0.1, 0.1, C.black, L.x + 0.4, 3.2, L.z, open);
  const lampHead = box(0.5, 0.2, 0.4, C.off, L.x + 0.75, 3.06, L.z, open);
  const pool = cyl(1.25, 1.25, 0.02, C.streetDark, L.x + 0.75, 0.05, L.z, { segments: 14, ...flat });
  zone('lamp', [L.x - 0.7, 0, L.z - 0.7], [L.x + 1.4, 3.0, L.z + 0.7]);
  const blue = makeTicket(TICKET.blue);
  blue.position.set(L.x + 1.1, 0.09, L.z + 0.35);
  blue.rotation.y = 0.5;
  blue.visible = false;
  group.add(blue);

  // --- power box on the hall's front wall, and the road cases with the plug ------------------------
  const P = { x: -4.6, z: HZ + 0.32 };
  box(0.9, 1.3, 0.3, C.greyLight, P.x, 0.65, P.z, { solid: true });
  box(0.5, 0.5, 0.04, C.line, P.x, 0.85, P.z + 0.16, flat);
  box(0.12, 0.34, 0.05, C.black, P.x, 0.85, P.z + 0.17, flat);
  const powerLamp = box(0.16, 0.16, 0.05, C.off, P.x + 0.28, 1.15, P.z + 0.16, flat);
  box(0.24, 0.24, 0.05, C.black, P.x - 0.2, 0.35, P.z + 0.16, flat);
  zone('socket', [P.x - 0.8, 0, P.z - 0.1], [P.x + 0.8, 2.6, P.z + 1.3]);
  const RC = { x: -7.3, z: 3.2 };
  box(1.3, 0.9, 0.9, C.case, RC.x, 0.45, RC.z, { solid: true });
  for (const dx of [-0.6, 0.6]) box(0.08, 0.92, 0.92, C.steel, RC.x + dx, 0.45, RC.z);
  box(0.9, 0.6, 0.8, C.case, RC.x + 1.2, 0.3, RC.z + 0.2, { solid: true });
  box(0.92, 0.07, 0.82, C.steel, RC.x + 1.2, 0.6, RC.z + 0.2);

  // --- dressing -----------------------------------------------------------------------------------
  cyl(0.3, 0.26, 0.8, C.grey, 0.4, 0.4, HZ + 0.6, { solid: true });          // bin
  cyl(0.32, 0.32, 0.06, C.black, 0.4, 0.82, HZ + 0.6);
  for (const [x, c] of [[-1.6, TICKET.green], [-2.6, TICKET.violet]]) {          // posters on the low wall
    box(0.7, 0.6, 0.03, C.cream, x, 0.5, HZ + 0.17, flat);
    box(0.5, 0.3, 0.04, c, x, 0.56, HZ + 0.18, flat);
  }

  // --- loose things ---------------------------------------------------------------------------------
  const tickets = {};
  const loose = (c, x, y, z, r, opts = {}) => {
    const t = makeTicket(TICKET[c]);
    t.position.set(x, y, z);
    t.rotation.y = r;
    tickets[c] = item(t, { tag: `ticket-${c}`, ...ticketOpts, ...opts });
  };
  loose('red', -2.4, 0.1, 4.4, 0.4);                                          // in plain sight
  loose('yellow', B.x, 0.1, B.z - 1.0, -0.3);                                 // behind the booth
  loose('violet', 0.2, 0.1, 3.9, 0.9, { grabbable: false });                  // under the cone
  const cone = new THREE.Group();
  part(new THREE.CylinderGeometry(0.06, 0.25, 0.7, 8), C.orange, 0, 0.03, 0, cone);
  part(new THREE.CylinderGeometry(0.135, 0.175, 0.14, 8), C.white, 0, 0.1, 0, cone);
  part(Box(0.56, 0.06, 0.56), C.orange, 0, -0.32, 0, cone);
  cone.position.set(0.05, 0.5, 3.85);
  const coneItem = item(cone, { tag: 'cone', shape: { box: [0.56, 0.7, 0.56] }, soft: true, mass: 0.5 });
  const bulb = new THREE.Group();
  part(new THREE.IcosahedronGeometry(0.17, 1), C.glow, 0, 0.06, 0, bulb);
  part(new THREE.CylinderGeometry(0.09, 0.09, 0.16, 7), C.greyLight, 0, -0.14, 0, bulb);
  bulb.position.set(B.x - 0.3, 1.27, B.z + 0.85);
  item(bulb, { tag: 'bulb', shape: { box: [0.3, 0.44, 0.3] }, soft: true, mass: 0.3 });
  const plug = new THREE.Group();
  part(Box(0.3, 0.26, 0.4), C.line, 0, 0, 0, plug);
  for (const s of [-0.08, 0.08]) part(Box(0.05, 0.06, 0.2), C.greyLight, s, 0, 0.28, plug);
  part(new THREE.TorusGeometry(0.2, 0.05, 5, 10), C.black, 0, -0.06, -0.36, plug).rotation.x = Math.PI / 2;
  plug.position.set(RC.x, 1.05, RC.z);
  item(plug, { tag: 'plug', shape: { box: [0.4, 0.26, 0.9] }, soft: true, mass: 0.5 });

  // --- behaviour ------------------------------------------------------------------------------------
  let powerOn = false, coneMoved = false, finale = false;
  /** walk a figure through a list of [x, z] points at a steady pace */
  function walkPath(g, points, done) {
    const [x, z] = points[0];
    const from = g.position.clone(), d = Math.hypot(x - from.x, z - from.z);
    g.rotation.y = Math.atan2(x - from.x, z - from.z);
    tween(Math.max(0.05, d / 4.2), (_, k) => { g.position.set(from.x + (x - from.x) * k, Math.abs(Math.sin(k * d * 4)) * 0.12, from.z + (z - from.z) * k); },
      () => (points.length > 1 ? walkPath(g, points.slice(1), done) : done()));
  }
  const fx = {
    lampOn() {
      lampHead.material = mat(C.glow, { emissive: 0x8a8040 });
      pool.material = mat(C.glow);
      blue.visible = true;
      tickets.blue = item(blue, { tag: 'ticket-blue', ...ticketOpts });
    },
    powerOn() {
      powerOn = true;
      powerLamp.material = mat(TICKET.green, { emissive: GLOW.green });
      spots.forEach((m) => { m.material = mat(TICKET[m.userData.color], { emissive: GLOW[m.userData.color] }); });
      spotPool.material = mat(C.glow);
      const green = makeTicket(TICKET.green);
      green.position.set(ST.x - 0.2, ST.top + 0.12, ST.z + 0.35);
      green.rotation.y = -0.4;
      tickets.green = item(green, { tag: 'ticket-green', ...ticketOpts });
    },
    admit(color) {
      const f = fans[color];
      ctx.remove(f.bubble);
      physics.removeStatic(f.body);
      ctx.burst(f.x, 2.0, QZ, [TICKET[color], C.white], 8, 0.7);
      walkPath(f.g, [[HX + 0.7, DZ], [HX - 0.9, DZ], f.spot], () => { f.dancing = true; });
    },
    finale() { finale = true; },
  };

  let confetti = 0;
  function update(dt, t) {
    // the cone hides the violet ticket until it has been moved off it
    if (!coneMoved && tickets.violet.alive) {
      const a = coneItem.body.position, b = tickets.violet.body.position;
      if (Math.hypot(a.x - b.x, a.z - b.z) > 0.65 || a.y > 1.2) { coneMoved = true; tickets.violet.grabbable = true; }
    }
    for (const c of COLORS) {
      const f = fans[c];
      if (f.dancing) {
        f.g.position.y = Math.abs(Math.sin(t * 6.5 + f.phase)) * 0.38;
        f.g.rotation.y += dt * 1.6 * (f.n % 2 ? 1 : -1);
        f.g.userData.arms.forEach((a, i) => { a.rotation.z = (i ? 1 : -1) * (2.5 + 0.35 * Math.sin(t * 13 + f.phase)); });
      } else if (f.bubble.parent) {
        f.bubble.position.y = 2.35 + 0.06 * Math.sin(t * 2.4 + f.phase);
        f.g.userData.arms[1].rotation.x = -0.25 + 0.2 * Math.sin(t * 3 + f.phase);    // impatient
      }
    }
    if (powerOn) {
      const beat = Math.floor(t * 2.5);
      for (const m of tiles) {
        const lit = (m.userData.i + m.userData.j * 2 + beat) % 3 === 0;
        m.material = lit ? mat(TICKET[m.userData.c], { emissive: GLOW[m.userData.c] }) : mat(DIM[m.userData.c]);
      }
    }
    if (finale) {
      confetti -= dt;
      if (confetti <= 0) { confetti = 0.5; ctx.burst(-5.5 + ((t * 37) % 5.5), 2.6, -2.4 + ((t * 23) % 2.6), Object.values(TICKET), 10, 1.5); }
    }
  }

  return { update, fx };
}
