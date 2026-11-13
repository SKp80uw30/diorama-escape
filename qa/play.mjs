// End-to-end check in a real browser: plays every level with real pointer
// drags (grab -> carry over a trigger zone -> release), moving on through the
// level-complete card, and saves screenshots to qa/shots/.
//   node build.mjs && node qa/play.mjs
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const PORT = 5391;
const server = spawn('node', ['serve.mjs', PORT], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 600));
await mkdir('qa/shots', { recursive: true });
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
let failed = false;
const check = (ok, msg) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${msg}`); if (!ok) failed = true; };
try {
  const page = await browser.newPage({ viewport: { width: 1000, height: 640 } });
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(`http://127.0.0.1:${PORT}/`);
  await page.waitForFunction(() => window.__dioramaReady);

  // --- helpers ---------------------------------------------------------------
  const adv = (sec) => page.evaluate((sec) => window.__diorama.advance(sec), sec);
  const shot = (name) => page.screenshot({ path: `qa/shots/${name}.png` });
  const screen = (p) => page.evaluate((p) => {
    const { THREE, camera, renderer } = window.__diorama;
    const v = new THREE.Vector3(...p).project(camera);
    const r = renderer.domElement.getBoundingClientRect();
    return [r.left + ((v.x + 1) / 2) * r.width, r.top + ((1 - v.y) / 2) * r.height];
  }, p);
  const items = (tag) => page.evaluate((tag) => window.__diorama.game.physics.items
    .filter((i) => i.alive && i.tag === tag && i.grabbable).map((i) => i.mesh.position.toArray()), tag);
  const state = () => page.evaluate(() => window.__diorama.game.state);
  const levelId = () => page.evaluate(() => window.__diorama.game.level.id);
  /** the point above a trigger zone where a carried item hangs */
  const over = (id) => page.evaluate((id) => {
    const z = window.__diorama.game.physics.zones.find((z) => z.id === id);
    return [(z.min[0] + z.max[0]) / 2, 2.8, (z.min[2] + z.max[2]) / 2];
  }, id);
  const camPos = () => page.evaluate(() => window.__diorama.camera.position.toArray());
  const moved = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  /** a real drag starting at a screen point */
  const drag = async (x, y, dx, dy = 0) => {
    await page.mouse.move(x, y); await page.mouse.down();
    await page.mouse.move(x + dx, y + dy, { steps: 6 }); await page.mouse.up();
    await adv(0.1);
  };
  /** put the camera at an exact azimuth so checks do not depend on drag speed */
  const lookFrom = async (azDeg, el = 0.6) => {
    await page.evaluate(([azDeg, el]) => {
      const { camera, game } = window.__diorama;
      const t = game.orbit.controls.target, r = camera.position.distanceTo(t), az = (azDeg * Math.PI) / 180;
      camera.position.set(t.x + r * Math.cos(el) * Math.cos(az), t.y + r * Math.sin(el), t.z + r * Math.cos(el) * Math.sin(az));
      game.orbit.controls.update();
    }, [azDeg, el]);
    await adv(0.1);
  };
  const carry = async (from, toWorld) => {
    const [x0, y0] = await screen(from);
    const [x1, y1] = await screen(toWorld);
    await page.mouse.move(x0, y0); await page.mouse.down();
    await page.mouse.move(x1, y1, { steps: 8 });
    await adv(1.2);
    await page.mouse.up();
    await adv(1.5);
  };
  /** drag the first loose item with this tag over a zone and let go */
  const put = async (tag, zoneId) => {
    const found = await items(tag);
    if (!found.length) return false;
    await carry(found[0], await over(zoneId));
    return true;
  };
  const finish = async (name, nextTitle) => {
    await adv(2); await page.waitForTimeout(1300);
    await shot(`${name}-won`);
    check(await page.locator('#de-win').isVisible(), `${name}: level-complete card is shown`);
    if (nextTitle) {
      await page.locator('#de-win button').click();
      await adv(1);
    }
  };

  // --- 1. Centre Court ---------------------------------------------------------
  await adv(1);
  await shot('tennis-start');
  const hopper = [-5.3, 2.8, 0.4];
  let balls = await items('ball');
  check(balls.length === 3, `tennis: three balls on the court (${balls.length})`);
  await carry(balls.find((b) => b[0] > 0), hopper);
  check((await state()).counters.balls === 1, 'tennis: dragging the visible ball into the hopper loads it');
  balls = await items('ball');
  await carry(balls.find((b) => b[2] > 3), hopper);
  check((await state()).counters.balls === 2, 'tennis: ball from under the bench loads');
  balls = await items('ball');
  await carry(balls[0], hopper);
  check((await state()).counters.balls === 2, 'tennis: hidden ball cannot be grabbed through the scoreboard');
  // view gestures: drag empty space to turn, right-drag (two fingers on touch) to slide, wheel (pinch) to zoom
  const target = () => page.evaluate(() => window.__diorama.game.orbit.controls.target.toArray());
  await page.locator('#stage').press('r'); // the refused grab above was a drag on empty space, so it turned the view
  await adv(0.1);
  const before = await camPos(), t0 = await target();
  await drag(400, 610, 200);
  let after = await camPos();
  check(moved(before, after) > 1 && Math.abs(Math.hypot(...before) - Math.hypot(...after)) < 0.05, 'view: dragging empty space turns the diorama without zooming');
  check(moved(t0, await target()) < 1e-6, 'view: turning does not slide the view');
  await page.mouse.move(400, 610); await page.mouse.down({ button: 'right' });
  await page.mouse.move(460, 580, { steps: 6 }); await page.mouse.up({ button: 'right' });
  await adv(0.1);
  check(moved(t0, await target()) > 0.3, 'view: right-dragging slides the view');
  for (let i = 0; i < 8; i++) { // keep sliding the same way, staying inside the window
    await page.mouse.move(400, 100); await page.mouse.down({ button: 'right' });
    await page.mouse.move(400, 620, { steps: 6 }); await page.mouse.up({ button: 'right' });
  }
  await page.waitForTimeout(200);
  const far = await target();
  check(far[1] <= 4.8 + 1e-6 && Math.abs(far[0]) <= 8.6 + 1e-6 && Math.abs(far[2]) <= 5.6 + 1e-6, `view: the view stops at the edge of the diorama (${far.map((n) => +n.toFixed(1))})`);
  await page.mouse.move(500, 320); await page.mouse.wheel(0, -300);
  await adv(0.1);
  check(await page.evaluate(() => window.__diorama.camera.position.distanceTo(window.__diorama.game.orbit.controls.target)) < Math.hypot(...before) - 0.5, 'view: scrolling zooms in');
  await page.locator('#stage').press('r');
  await adv(0.1);
  check(moved(before, await camPos()) < 1e-6 && moved(t0, await target()) < 1e-6, 'view: R resets the view');
  check((await page.locator('#de-orb, #de-pad, #de-zoom').count()) === 0, 'view: no on-screen view controls remain');
  await lookFrom(250); // behind the scoreboard
  balls = await items('ball');
  await carry(balls[0], hopper);
  let s = await state();
  check(s.counters.balls === 3 && s.flags.fired, 'tennis: after orbiting, the third ball loads and the machine fires');
  await adv(3);
  const keys = await items('key');
  check(keys.length === 1 && keys[0][1] < 1, 'tennis: key was knocked down and is on the ground');
  check(!(await state()).won, 'tennis: not won before the key is used');
  await carry(keys[0], [7.3, 2.8, 0]);
  s = await state();
  check(s.won && s.flags.gateOpen, 'tennis: dropping the key at the gate opens it and wins');
  await finish('tennis', 'museum');

  // --- 2. The Ancient Museum ------------------------------------------------------
  check((await levelId()) === 'museum', 'museum: the win card leads into the museum');
  await shot('museum-start');
  check((await items('scarab')).length === 0 && (await items('disc')).length === 0, 'museum: scarab and disc are not loose at the start');
  await put('vase', 'plinthIdol');
  check(!(await state()).counters.relics, 'museum: the vase is refused by the idol plinth');
  await lookFrom(45, 1.3); // from above, wherever the refused vase came to rest
  await put('vase', 'plinthVase');
  check((await state()).counters.relics === 1, 'museum: the vase sits on its own plinth');
  await lookFrom(45, 0.576);
  await put('idol', 'plinthIdol');
  check((await state()).counters.relics === 1, 'museum: the idol cannot be grabbed through the cat statue');
  await lookFrom(-20);
  await shot('museum-side');
  await put('idol', 'plinthIdol');
  s = await state();
  check(s.counters.relics === 2 && s.flags.caseOpen, 'museum: from the side the idol is reachable; two relics open the case');
  await lookFrom(45, 0.576);
  await adv(2);
  await shot('museum-case-open');
  check(await put('scarab', 'plinthScarab'), 'museum: the scarab is loose once the case is open');
  check((await state()).flags.tombOpen, 'museum: the scarab on its plinth opens the sarcophagus');
  await adv(3.5);
  await shot('museum-disc');
  const disc = await items('disc');
  check(disc.length === 1 && disc[0][1] < 0.6, `museum: the sun disc landed on the floor (${JSON.stringify(disc[0]?.map((n) => +n.toFixed(2)))})`);
  check(!(await state()).won, 'museum: not won before the disc is used');
  await put('disc', 'door');
  check((await state()).won, 'museum: the disc at the door opens it and wins');
  await finish('museum', 'jungle');

  // --- 3. The Jungle Temple ---------------------------------------------------------
  check((await levelId()) === 'jungle', 'jungle: the win card leads into the jungle');
  await shot('jungle-start');
  check((await items('eye1')).length === 0 && (await items('eye2')).length === 0, 'jungle: both eyes are out of reach at the start');
  await put('torch', 'campfire');
  check(!(await state()).flags.lit, 'jungle: the torch cannot be grabbed through the ruined wall');
  await put('stone', 'plate');
  check((await state()).flags.cageOpen, 'jungle: the carved stone on the plate opens the cage');
  await adv(2);
  await shot('jungle-cage-open');
  check(await put('eye2', 'altar'), 'jungle: the caged eye is loose');
  check((await state()).counters.eyes === 1 && !(await state()).won, 'jungle: one eye on the altar is not enough');
  await lookFrom(0);
  await shot('jungle-side');
  await put('torch', 'vines');
  check(!(await state()).flags.burnt && (await items('torch')).length === 1, 'jungle: an unlit torch does nothing to the vines');
  await put('torch', 'campfire');
  check((await state()).flags.lit && (await items('flame')).length === 1, 'jungle: the campfire lights the torch');
  await lookFrom(45, 0.576);
  await shot('jungle-torch-lit');
  await put('flame', 'vines');
  check((await state()).flags.burnt, 'jungle: the lit torch burns the vines');
  await adv(3);
  await shot('jungle-vines-burnt');
  const eye1 = await items('eye1');
  check(eye1.length === 1 && eye1[0][2] > -4, `jungle: the first eye tumbled out of the shrine (${JSON.stringify(eye1[0]?.map((n) => +n.toFixed(2)))})`);
  await put('eye1', 'altar');
  s = await state();
  check(s.won && s.flags.mouthOpen, 'jungle: both eyes on the altar open the mouth and win');
  await finish('jungle', 'pirate');

  /** from high above, where nothing hides a loose item wherever it came to rest */
  const fromAbove = () => lookFrom(45, 1.25);
  const hero = () => lookFrom(45, 0.576);

  // --- 4. The Pirate Ship ---------------------------------------------------------------
  check((await levelId()) === 'pirate', 'pirate: the win card leads onto the ship');
  await shot('pirate-start');
  check((await items('key')).length === 0 && (await items('wheel')).length === 0, 'pirate: key and wheel are out of reach at the start');
  await put('ball', 'cannon');
  s = await state();
  check(s.counters.loaded === 1 && !s.flags.fired, 'pirate: the ball alone does not fire the cannon');
  await put('keg', 'cannon');
  check((await state()).counters.loaded === 1, 'pirate: the keg cannot be grabbed through the crates');
  await lookFrom(-90, 0.7);
  await shot('pirate-behind');
  await put('keg', 'cannon');
  check((await state()).flags.fired, 'pirate: with ball and powder the cannon fires');
  await hero();
  await adv(3);
  await shot('pirate-fired');
  const pkey = await items('key');
  check(pkey.length === 1 && pkey[0][1] > 0.9, `pirate: the key landed on the deck (${JSON.stringify(pkey[0]?.map((n) => +n.toFixed(2)))})`);
  await fromAbove();
  await put('key', 'chest');
  check((await state()).flags.chestOpen, 'pirate: the key opens the chest');
  await adv(2.5);
  check(!(await state()).won, 'pirate: not won before the wheel is on the helm');
  await put('wheel', 'helm');
  check((await state()).won, 'pirate: the wheel on the helm sets sail and wins');
  await hero();
  await finish('pirate', 'party');

  // --- 5. The Birthday Party --------------------------------------------------------------
  check((await levelId()) === 'party', 'party: the win card leads to the party');
  await shot('party-start');
  const balloons = async () => (await items('balloon')).sort((a, b) => a[1] - b[1]);
  let bs = await balloons();
  check(bs.length === 3 && bs[0][1] < 1.2 && bs[2][1] > 3, `party: one balloon is under the table and two are at the ceiling (${bs.map((b) => b[1].toFixed(1))})`);
  const pin = await over('pin');
  await carry(bs[0], pin);
  check(!(await state()).counters.pops, 'party: the balloon under the table cannot be grabbed from above');
  await hero();
  // a balloon that is let go anywhere else floats back up and can be caught again
  bs = await balloons();
  await carry(bs[2], [-2, 2.8, 3.5]);
  await adv(2);
  bs = await balloons();
  check(bs.length === 3 && bs[2][1] > 3 && !(await state()).counters.pops, 'party: a balloon let go away from the cactus floats back up to the ceiling');
  await carry(bs[2], pin);
  check((await state()).counters.pops === 1 && (await items('candle')).length === 1, 'party: a balloon let go over the cactus pops and drops a candle');
  bs = await balloons();
  await carry(bs[1], pin);
  check((await state()).counters.pops === 2, 'party: the second ceiling balloon pops');
  // the last one: tilt the view low to reach under the table, then carry it out
  await lookFrom(45, 0.12);
  await shot('party-low');
  bs = await balloons();
  const [bx, by] = await screen(bs[0]);
  await page.mouse.move(bx, by); await page.mouse.down();
  await adv(0.2);
  await hero();
  const [qx, qy] = await screen(pin);
  await page.mouse.move(qx, qy, { steps: 10 });
  await adv(1.6);
  await page.mouse.up();
  await adv(1.5);
  check((await state()).counters.pops === 3, 'party: from a low angle the trapped balloon can be pulled out and popped');
  await adv(1.5);
  check((await items('candle')).length === 3, 'party: three candles are loose');
  for (let i = 1; i <= 3; i++) {
    await fromAbove();
    await put('candle', 'cake');
    check((await state()).counters.candles === i, `party: candle ${i} is on the cake`);
  }
  check((await state()).flags.lit, 'party: three candles light the cake');
  await adv(3);
  await hero();
  await shot('party-lit');
  await fromAbove();
  check(await put('key', 'door'), 'party: the present gave up its key');
  check((await state()).won, 'party: the key opens the door and wins');
  await hero();
  await finish('party', 'dino');

  // --- 6. Dinosaur Valley -------------------------------------------------------------------
  check((await levelId()) === 'dino', 'dino: the win card leads to the valley');
  await shot('dino-start');
  check((await items('egg')).length === 2 && (await items('egg3')).length === 0 && (await items('bone')).length === 0, 'dino: two eggs are loose; the third egg and the bone are not');
  const eggs = async () => (await items('egg')).sort((a, b) => a[2] - b[2]);
  await carry((await eggs())[0], await over('nest'));
  check((await state()).counters.eggs === 1, 'dino: the egg in plain sight goes in the nest');
  await put('egg', 'nest');
  check((await state()).counters.eggs === 1, 'dino: the egg behind the boulder cannot be grabbed from the front');
  await lookFrom(0);
  await put('egg', 'nest');
  check((await state()).counters.eggs === 2, 'dino: from the side the hidden egg is reachable');
  await hero();
  await put('fern', 'tree');
  check((await state()).flags.lured, 'dino: leaves at the tall tree lure the long-neck');
  await adv(3.5);
  await shot('dino-lured');
  await fromAbove();
  check(await put('egg3', 'nest'), 'dino: the egg it was standing over is loose');
  s = await state();
  check(s.counters.eggs === 3 && s.flags.swooped, 'dino: three eggs bring the pterodactyl down');
  await adv(3.5);
  await hero();
  await shot('dino-swooped');
  check(!(await state()).won, 'dino: not won before the T-rex is fed');
  await fromAbove();
  check(await put('bone', 'rexRock'), 'dino: the bone was dropped');
  check((await state()).won, 'dino: the bone on the flat rock lures the T-rex away and wins');
  await hero();
  await finish('dino', 'concert');

  // --- 7. The Concert -------------------------------------------------------------------------
  check((await levelId()) === 'concert', 'concert: the win card leads to the concert');
  await shot('concert-start');
  const inside = async () => (await state()).counters.inside || 0;
  const dancing = () => page.evaluate(() => window.__diorama.game.group.children.filter((o) => o.userData.arms && Math.abs(o.userData.arms[0].rotation.z) > 2).length);
  check((await items('ticket-red')).length === 1 && (await items('ticket-yellow')).length === 1, 'concert: red and yellow tickets are loose');
  check((await items('ticket-violet')).length + (await items('ticket-blue')).length + (await items('ticket-green')).length === 0, 'concert: violet, blue and green tickets cannot be taken yet');
  await put('ticket-red', 'fan-blue');
  check((await inside()) === 0, 'concert: the blue fan refuses the red ticket');
  await fromAbove();
  await put('ticket-red', 'fan-red');
  check((await inside()) === 1, 'concert: the red fan takes the red ticket');
  await hero();
  await adv(4);
  await shot('concert-first-dancer');
  check((await dancing()) === 1, 'concert: the red fan walked in and is dancing');
  await put('ticket-yellow', 'fan-yellow');
  check((await inside()) === 1, 'concert: the yellow ticket cannot be grabbed through the booth');
  await lookFrom(0);
  await put('ticket-yellow', 'fan-yellow');
  check((await inside()) === 2, 'concert: from the side the yellow ticket is reachable');
  await hero();
  // the cone
  const cone = (await items('cone'))[0];
  await carry(cone, [-2.5, 2.8, 5.0]);
  check((await items('ticket-violet')).length === 1, 'concert: moving the cone frees the violet ticket');
  await fromAbove();
  await put('ticket-violet', 'fan-violet');
  check((await inside()) === 3, 'concert: the violet fan goes in');
  await hero();
  // the lamp
  await put('bulb', 'lamp');
  check((await state()).flags.lampOn && (await items('ticket-blue')).length === 1, 'concert: the bulb lights the lamp and shows the blue ticket');
  await shot('concert-lamp-on');
  await fromAbove();
  await put('ticket-blue', 'fan-blue');
  check((await inside()) === 4 && !(await state()).won, 'concert: four inside is not enough');
  await hero();
  // the power
  await put('plug', 'socket');
  check((await state()).flags.powerOn && (await items('ticket-green')).length === 1, 'concert: the plug brings the stage lights up and shows the green ticket');
  await fromAbove();
  await put('ticket-green', 'fan-green');
  check((await state()).won, 'concert: the fifth fan goes in and it is a full house');
  await hero();
  await adv(5);
  check((await dancing()) === 5, 'concert: all five fans are dancing');
  await finish('concert');
  check(errors.length === 0, `no console errors ${errors.join(' | ')}`);

  // real touch gestures (through the browser's touch input) on a phone-sized page
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const tp = await ctx.newPage();
    await tp.goto(`http://127.0.0.1:${PORT}/`);
    await tp.waitForFunction(() => window.__dioramaReady);
    await tp.evaluate(() => window.__diorama.advance(0.5));
    const cdp = await ctx.newCDPSession(tp);
    const view = () => tp.evaluate(() => { const d = window.__diorama, t = d.game.orbit.controls.target; return { cam: d.camera.position.toArray(), tgt: t.toArray(), dist: d.camera.position.distanceTo(t) }; });
    const touch = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map(([x, y], id) => ({ x, y, id })) });
    const gesture = async (from, to) => {
      await touch('touchStart', from);
      for (let i = 1; i <= 8; i++) { await touch('touchMove', from.map(([x, y], k) => [x + ((to[k][0] - x) * i) / 8, y + ((to[k][1] - y) * i) / 8])); await tp.waitForTimeout(16); }
      await touch('touchEnd', []);
      await tp.waitForTimeout(120);
    };
    const d3 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
    const v0 = await view();
    await gesture([[195, 700]], [[300, 700]]);
    const v1 = await view();
    check(d3(v0.cam, v1.cam) > 1 && d3(v0.tgt, v1.tgt) < 1e-6 && Math.abs(v0.dist - v1.dist) < 0.05, 'touch: one finger on empty space turns the diorama');
    await gesture([[150, 700], [240, 700]], [[150, 640], [240, 640]]);
    const v2 = await view();
    check(d3(v1.tgt, v2.tgt) > 0.3 && Math.abs(v2.dist - v1.dist) < v1.dist * 0.05, `touch: two fingers dragged together slide the view (${d3(v1.tgt, v2.tgt).toFixed(2)})`);
    await gesture([[170, 700], [220, 700]], [[90, 700], [300, 700]]);
    const v3 = await view();
    check(v3.dist < v2.dist * 0.9, `touch: pinching out zooms in (${v2.dist.toFixed(1)} -> ${v3.dist.toFixed(1)})`);
    await tp.screenshot({ path: 'qa/shots/touch-after-gestures.png' });
    await ctx.close();
  }

  // phone portrait framing of every level (a new page has no saved progress, so unlock them first)
  for (const id of ['tennis', 'museum', 'jungle', 'pirate', 'party', 'dino', 'concert']) {
    const phone = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await phone.addInitScript(() => localStorage.setItem('diorama-escape:v1', JSON.stringify({ unlocked: ['tennis', 'museum', 'jungle', 'pirate', 'party', 'dino', 'concert'], solved: [] })));
    await phone.goto(`http://127.0.0.1:${PORT}/?level=${id}`, { waitUntil: 'commit' });
    await phone.waitForFunction(() => window.__dioramaReady);
    await phone.evaluate(() => window.__diorama.advance(1));
    await phone.screenshot({ path: `qa/shots/${id}-phone.png` });
    await phone.close();
  }
} catch (e) { console.log('ERROR ' + e.message.split('\n')[0]); failed = true; } finally {
  await browser.close();
  server.kill();
}
process.exit(failed ? 1 : 0);
