// End-to-end check in a real browser: plays Centre Court with real pointer
// drags (grab ball -> carry over hopper -> release), then the key to the gate,
// and saves screenshots to qa/shots/.   node build.mjs && node qa/play.mjs
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
  await page.evaluate(() => window.__diorama.advance(1));
  await page.screenshot({ path: 'qa/shots/01-start.png' });

  // screen position of a world point, and of loose items
  const screen = (p) => page.evaluate((p) => {
    const { THREE, camera, renderer } = window.__diorama;
    const v = new THREE.Vector3(...p).project(camera);
    const r = renderer.domElement.getBoundingClientRect();
    return [r.left + ((v.x + 1) / 2) * r.width, r.top + ((1 - v.y) / 2) * r.height];
  }, p);
  const items = (tag) => page.evaluate((tag) => window.__diorama.game.physics.items
    .filter((i) => i.alive && i.tag === tag && i.grabbable).map((i) => i.mesh.position.toArray()), tag);
  const state = () => page.evaluate(() => window.__diorama.game.state);
  const adv = (sec) => page.evaluate((sec) => window.__diorama.advance(sec), sec);
  const orbitBy = async (dx) => {
    await page.mouse.move(100, 620); await page.mouse.down();
    await page.mouse.move(100 + dx, 620, { steps: 6 }); await page.mouse.up();
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

  const hopper = [-5.2, 1.3, 0.4]; // point at the hopper itself; the carried item hovers above what is under the pointer
  let balls = await items('ball');
  check(balls.length === 3, `three balls on the court (${balls.length})`);
  // ball in plain sight
  await carry(balls.find((b) => b[0] > 0), hopper);
  check((await state()).counters.balls === 1, 'dragging the visible ball into the hopper loads it');
  // ball under the bench
  balls = await items('ball');
  await carry(balls.find((b) => b[2] > 3), hopper);
  check((await state()).counters.balls === 2, 'ball from under the bench loads');
  // ball behind the scoreboard: must NOT be grabbable from the front
  balls = await items('ball');
  await carry(balls[0], hopper);
  check((await state()).counters.balls === 2, 'hidden ball cannot be grabbed through the scoreboard');
  await orbitBy(200); // a real drag, to prove orbit still works alongside grabbing
  // then place the camera exactly behind the scoreboard so the check does not depend on drag speed
  await page.evaluate(() => {
    const { camera, game } = window.__diorama;
    const t = game.orbit.controls.target, r = camera.position.distanceTo(t), az = (250 * Math.PI) / 180, el = 0.6;
    camera.position.set(t.x + r * Math.cos(el) * Math.cos(az), t.y + r * Math.sin(el), t.z + r * Math.cos(el) * Math.sin(az));
    game.orbit.controls.update();
  });
  await adv(0.1);
  await page.screenshot({ path: 'qa/shots/02-behind.png' });
  balls = await items('ball');
  await carry(balls[0], hopper);
  let s = await state();
  check(s.counters.balls === 3 && s.flags.fired, 'after orbiting, the third ball loads and the machine fires');
  await adv(3);
  await page.screenshot({ path: 'qa/shots/03-key-dropped.png' });
  const keys = await items('key');
  check(keys.length === 1 && keys[0][1] < 1, `key was knocked down and is on the ground (${JSON.stringify(keys[0]?.map((n) => +n.toFixed(2)))})`);
  check(!(await state()).won, 'not won before the key is used');
  await carry(keys[0], [7.3, 0.05, 0]);
  s = await state();
  check(s.won && s.flags.gateOpen, 'dropping the key at the gate opens it and wins');
  await adv(1.5); await page.waitForTimeout(1300);
  await page.screenshot({ path: 'qa/shots/04-won.png' });
  check(await page.locator('#de-win').isVisible(), 'level-complete card is shown');

  // --- new mechanics with real pointer input ---------------------------------
  // tap: clicking the airlock wheel without power gives the "no power" message
  await page.evaluate(() => { window.__diorama.load('underwater'); window.__diorama.advance(0.5); });
  await page.mouse.click(...(await screen([6.4, 1.1, -2.16])));
  await adv(0.2);
  check((await page.locator('#de-hint').textContent()).includes('no power'), 'clicking the airlock wheel reaches the puzzle (no power yet)');
  // carry up high: drag the pebble onto the bell tower top and drop it in the belfry
  await page.evaluate(() => { window.__diorama.load('clouds'); window.__diorama.advance(0.5); });
  const pebble = (await items('pebble'))[0];
  await carry(pebble, [5.8, 4.45, -3.4]);
  check((await state()).flags.bell === true, 'pebble carried onto the tower top rings the bell');
  await adv(2);
  check((await items('blue')).length === 1, 'the blue crystal appears after the cloud drifts away');
  await page.screenshot({ path: 'qa/shots/06-bell.png' });
  // tap in the skyscraper: the filing cabinet drawer gives up the paper
  await page.evaluate(() => { window.__diorama.load('skyscraper'); window.__diorama.advance(0.5); });
  await page.mouse.click(...(await screen([-6.3, 1.15, 0.8])));
  await adv(1);
  check((await items('paper')).length === 1, 'clicking the cabinet drawer releases the paper');

  check(errors.length === 0, `no console errors ${errors.join(' | ')}`);

  // phone portrait framing
  await page.close();
  const phone = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await phone.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'commit' });
  await phone.waitForFunction(() => window.__dioramaReady);
  await phone.evaluate(() => window.__diorama.advance(1));
  await phone.screenshot({ path: 'qa/shots/05-phone.png' });
} catch (e) { console.log('ERROR ' + e.message.split('\n')[0]); failed = true; } finally {
  await browser.close();
  server.kill();
}
process.exit(failed ? 1 : 0);
