// Camera controls regression test with REAL touch input, on EVERY level.
// The controls must behave identically everywhere (see src/game/view.js):
//   two-finger drag pans, pinch zooms, one-finger drag on empty space orbits,
//   a two-finger gesture that starts on an item still pans (and drops the item),
//   R resets. Run: node build.mjs && node qa/controls.mjs
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
const { chromium } = createRequire(import.meta.url)('playwright');

const PORT = 5394;
const server = spawn('node', ['serve.mjs', PORT], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 600));
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
let failed = false;
const check = (ok, msg) => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${msg}`); if (!ok) failed = true; };
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 760 }, hasTouch: true, isMobile: true });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(`http://127.0.0.1:${PORT}/`);
  await page.waitForFunction(() => window.__dioramaReady);
  const cdp = await page.context().newCDPSession(page);
  const touch = (type, points) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: points.map(([x, y], id) => ({ x, y, id })) });
  /** Fingers move from `from` to `to` (arrays of [x,y] per finger) in small steps. */
  async function gesture(from, to, steps = 12) {
    await touch('touchStart', from.slice(0, 1));
    if (from.length > 1) await touch('touchStart', from);
    for (let i = 1; i <= steps; i++) {
      await touch('touchMove', from.map(([x, y], f) => [x + ((to[f][0] - x) * i) / steps, y + ((to[f][1] - y) * i) / steps]));
    }
    await touch('touchEnd', []);
    await page.evaluate(() => window.__diorama.advance(0.05));
  }
  const cam = () => page.evaluate(() => {
    const { camera, game } = window.__diorama;
    const t = game.orbit.controls.target, p = camera.position;
    return { tx: t.x, ty: t.y, tz: t.z, dist: p.distanceTo(t), az: Math.atan2(p.x - t.x, p.z - t.z), held: !!game.grab.held };
  });
  const near = (a, b, eps = 1e-3) => Math.abs(a - b) < eps;

  const ids = await page.evaluate(() => window.__diorama.levels);
  for (const id of ids) {
    await page.evaluate((id) => { window.__diorama.load(id); window.__diorama.advance(0.3); }, id);
    const s0 = await cam();

    // 1. two-finger drag sideways: the view centre moves, the zoom does not
    await gesture([[150, 600], [240, 600]], [[60, 600], [150, 600]]);
    const s1 = await cam();
    const moved = Math.hypot(s1.tx - s0.tx, s1.ty - s0.ty, s1.tz - s0.tz);
    check(moved > 0.5 && near(s1.dist, s0.dist, 0.05), `${id}: two-finger drag pans (moved ${moved.toFixed(2)})`);

    // 2. pinch out: zooms in, roughly in place
    await gesture([[170, 620], [220, 620]], [[100, 620], [290, 620]]);
    const s2 = await cam();
    check(s2.dist < s1.dist - 0.5, `${id}: pinch zooms (${s1.dist.toFixed(1)} -> ${s2.dist.toFixed(1)})`);

    // 3. a two-finger gesture whose first finger lands on an item still pans, and drops the item
    await page.evaluate(() => window.__diorama.game.orbit.reset());
    const onItem = await page.evaluate(() => {
      const { THREE, camera, renderer, game } = window.__diorama;
      const r = renderer.domElement.getBoundingClientRect();
      for (const it of game.physics.items) {
        if (!it.alive || !it.grabbable) continue;
        const v = it.mesh.position.clone().project(camera);
        const x = r.left + ((v.x + 1) / 2) * r.width, y = r.top + ((1 - v.y) / 2) * r.height;
        if (x > 40 && x < r.width - 40 && y > 120 && y < r.height - 40) return [x, y];
      }
      return null;
    });
    if (onItem) {
      const before = await cam();
      const [x, y] = onItem;
      await gesture([[x, y], [x + 80, y]], [[x, y - 70], [x + 80, y - 70]]);
      const after = await cam();
      const m = Math.hypot(after.tx - before.tx, after.ty - before.ty, after.tz - before.tz);
      check(m > 0.3 && !after.held, `${id}: two fingers starting on an item still pan (moved ${m.toFixed(2)}, item not held)`);
    }

    // 4. one finger on empty space orbits
    await page.evaluate(() => window.__diorama.game.orbit.reset());
    const b4 = await cam();
    await gesture([[30, 740]], [[200, 740]]);
    const a4 = await cam();
    check(Math.abs(a4.az - b4.az) > 0.2, `${id}: one-finger drag orbits (${(a4.az - b4.az).toFixed(2)} rad)`);

    // 5. you can't pan the diorama off screen
    for (let i = 0; i < 6; i++) await gesture([[100, 300], [200, 300]], [[390, 760], [490, 760]], 6);
    const far = await cam();
    const lvl = await page.evaluate(() => window.__diorama.game.level.slab);
    check(Math.abs(far.tx) <= lvl.hx + 1e-3 && Math.abs(far.tz) <= lvl.hz + 1e-3, `${id}: panning stops at the edge of the diorama`);

    // 6. reset brings back the starting view
    await page.evaluate(() => window.__diorama.game.orbit.reset());
    const r = await cam();
    check(near(r.tx, s0.tx) && near(r.tz, s0.tz) && near(r.dist, s0.dist, 0.01), `${id}: reset returns to the starting view`);
  }
  check(errors.length === 0, `no page errors ${errors.join(' | ')}`);
} catch (e) {
  failed = true;
  console.log('ERROR ' + e.message.split('\n')[0]);
} finally {
  await browser.close();
  server.kill();
}
process.exit(failed ? 1 : 0);
