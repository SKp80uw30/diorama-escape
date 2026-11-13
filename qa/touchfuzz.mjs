// Stress test for touch input: random sequences of one to three fingers going
// down, moving and lifting (some landing on loose objects), then checks that no
// finger is left "stuck" in the camera controls or the grab code.
//   node build.mjs && node qa/touchfuzz.mjs [rounds]
import { createRequire } from 'node:module';
const { chromium } = createRequire(import.meta.url)('playwright');
import { spawn } from 'node:child_process';

const PORT = 5394, ROUNDS = Number(process.argv[2]) || 60;
const server = spawn('node', ['serve.mjs', PORT], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 600));
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
let seed = 12345;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
let failed = 0;
try {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.addInitScript(() => localStorage.setItem('diorama-escape:v1', JSON.stringify({ unlocked: ['tennis', 'museum', 'jungle'], solved: [] })));
  await page.goto(`http://127.0.0.1:${PORT}/?level=tennis`);
  await page.waitForFunction(() => window.__dioramaReady);
  const cdp = await ctx.newCDPSession(page);
  /** touchStart / touchMove take every finger that is down; lift(...) takes the fingers being lifted */
  const send = (type, fingers) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: [...fingers].map(([id, p]) => ({ id, x: Math.round(p[0]), y: Math.round(p[1]) })) });
  const lift = (...points) => send('touchEnd', points);
  const itemSpots = () => page.evaluate(() => {
    const { THREE, camera, renderer, game } = window.__diorama;
    const r = renderer.domElement.getBoundingClientRect();
    return game.physics.items.filter((i) => i.alive && i.grabbable).map((i) => {
      const v = new THREE.Vector3().copy(i.mesh.position).project(camera);
      return [r.left + ((v.x + 1) / 2) * r.width, r.top + ((1 - v.y) / 2) * r.height];
    }).filter(([x, y]) => x > 5 && x < 385 && y > 70 && y < 840);
  });
  const status = () => page.evaluate(() => ({ ...window.__diorama.input.status(), held: !!window.__diorama.game.grab.held }));
  const view = () => page.evaluate(() => { const d = window.__diorama, t = d.game.orbit.controls.target; return [...d.camera.position.toArray(), ...t.toArray()]; });
  // first, the basics with real touch input: carry a ball to the hopper with one finger,
  // turning the view with a second finger on the way
  {
    const proj = (p) => page.evaluate((p) => { const { THREE, camera, renderer } = window.__diorama; const v = new THREE.Vector3(...p).project(camera); const r = renderer.domElement.getBoundingClientRect(); return [r.left + ((v.x + 1) / 2) * r.width, r.top + ((1 - v.y) / 2) * r.height]; }, p);
    const ball = await page.evaluate(() => window.__diorama.game.physics.items.find((i) => i.tag === 'ball' && i.mesh.position.x > 0).mesh.position.toArray());
    const from = await proj(ball);
    const f = new Map([[0, [...from]]]);
    await send('touchStart', f);
    const held = (await status()).held;
    f.set(1, [60, 780]); await send('touchStart', f);
    const cam0 = (await view()).slice(0, 3);
    for (let i = 1; i <= 6; i++) { f.get(1)[0] = 60 + i * 8; await send('touchMove', f); await page.waitForTimeout(16); }
    const cam1 = (await view()).slice(0, 3);
    await lift([1, f.get(1)]); f.delete(1);
    const turned = Math.hypot(cam0[0] - cam1[0], cam0[2] - cam1[2]) > 0.5;
    const to = await proj([-5.3, 2.8, 0.4]);
    for (let i = 1; i <= 8; i++) { f.set(0, [from[0] + ((to[0] - from[0]) * i) / 8, from[1] + ((to[1] - from[1]) * i) / 8]); await send('touchMove', f); await page.waitForTimeout(30); }
    await page.evaluate(() => window.__diorama.advance(1.2));
    await lift([0, f.get(0)]); f.delete(0);
    await page.evaluate(() => window.__diorama.advance(1.5));
    const balls = await page.evaluate(() => window.__diorama.game.state.counters.balls);
    const ok = held && turned && balls === 1;
    console.log(`${ok ? 'PASS' : 'FAIL'}  touch: one finger carries a ball to the hopper while a second finger turns the view (held ${held}, turned ${turned}, loaded ${balls})`);
    if (!ok) failed++;
    await page.locator('#stage').press('r');
  }
  for (let round = 0; round < ROUNDS; round++) {
    const fingers = new Map();
    const log = [];
    const spots = await itemSpots();
    const steps = 4 + Math.floor(rnd() * 10);
    for (let s = 0; s < steps; s++) {
      const roll = rnd();
      if (fingers.size < 3 && (roll < 0.35 || fingers.size === 0)) {
        const id = [0, 1, 2].find((i) => !fingers.has(i));
        const onItem = spots.length && rnd() < 0.4;
        const p = onItem ? spots[Math.floor(rnd() * spots.length)].map((n) => n + (rnd() - 0.5) * 30) : [20 + rnd() * 350, 90 + rnd() * 730];
        fingers.set(id, p);
        log.push(`down${id}${onItem ? '*' : ''}`);
        await send('touchStart', fingers);
      } else if (roll < 0.75) {
        for (let k = 0; k < 4; k++) {
          for (const p of fingers.values()) { p[0] = Math.max(2, Math.min(388, p[0] + (rnd() - 0.5) * 60)); p[1] = Math.max(60, Math.min(842, p[1] + (rnd() - 0.5) * 60)); }
          await send('touchMove', fingers);
        }
        log.push('move');
      } else {
        const id = [...fingers.keys()][Math.floor(rnd() * fingers.size)];
        await lift([id, fingers.get(id)]);
        fingers.delete(id);
        log.push(`up${id}`);
      }
      await page.waitForTimeout(12);
    }
    while (fingers.size) { const id = fingers.keys().next().value; await lift([id, fingers.get(id)]); fingers.delete(id); log.push(`up${id}`); }
    await page.waitForTimeout(40);
    const st = await status();
    // nothing may be held or tracked once every finger is up, and the view must then stay still
    const v0 = await view();
    await page.waitForTimeout(60);
    const v1 = await view();
    const drift = Math.max(...v0.map((n, i) => Math.abs(n - v1[i])));
    const bad = st.grabbing || st.viewFingers !== 0 || st.held || drift > 1e-9 || v1.some((n) => !Number.isFinite(n)) || errors.length;
    if (bad) { failed++; console.log(`FAIL  round ${round}: ${JSON.stringify(st)} ${errors.splice(0).join(' | ')}\n      ${log.join(' ')}`); if (failed >= 4) break; await page.reload(); await page.waitForFunction(() => window.__dioramaReady); }
    else await page.locator('#stage').press('r');
  }
  console.log(failed ? `${failed} round(s) left the controls in a bad state` : `PASS  ${ROUNDS} random multi-finger rounds, no stuck fingers, no errors`);
} catch (e) { console.log('ERROR ' + e.message.split('\n')[0]); failed = 1; } finally {
  await browser.close();
  server.kill();
}
process.exit(failed ? 1 : 0);
