// Shared helpers for the quick per-level checks (look.mjs, bot.mjs).
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
const { chromium } = createRequire(import.meta.url)('playwright');

/** Serve dist/, open one level with everything unlocked, and return driving helpers. */
export async function openLevel(id, { port = 5397, width = 1000, height = 640 } = {}) {
  const server = spawn('node', ['serve.mjs', port], { stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 600));
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width, height } });
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  // unlock every level: the page reads the list of ids from the game itself on first load
  await page.addInitScript((id) => localStorage.setItem('diorama-escape:v1', JSON.stringify({ unlocked: ['tennis', id], solved: [] })), id);
  await page.goto(`http://127.0.0.1:${port}/?level=${id}`);
  await page.waitForFunction(() => window.__dioramaReady);
  const loaded = await page.evaluate(() => window.__diorama.game.level.id);
  if (loaded !== id) throw new Error(`level "${id}" did not load (got "${loaded}"): is it in src/game/registry.js?`);

  const adv = (sec) => page.evaluate((sec) => window.__diorama.advance(sec), sec);
  const screen = (p) => page.evaluate((p) => {
    const { THREE, camera, renderer } = window.__diorama;
    const v = new THREE.Vector3(...p).project(camera);
    const r = renderer.domElement.getBoundingClientRect();
    return [r.left + ((v.x + 1) / 2) * r.width, r.top + ((1 - v.y) / 2) * r.height];
  }, p);
  const items = (tag) => page.evaluate((tag) => window.__diorama.game.physics.items
    .filter((i) => i.alive && i.grabbable && (!tag || i.tag === tag)).map((i) => ({ tag: i.tag, pos: i.mesh.position.toArray().map((n) => +n.toFixed(2)) })), tag);
  const zones = () => page.evaluate(() => window.__diorama.game.physics.zones.map((z) => ({ id: z.id, min: z.min, max: z.max })));
  const over = async (zoneId) => {
    const z = (await zones()).find((z) => z.id === zoneId);
    if (!z) throw new Error(`no zone "${zoneId}" in the scene`);
    return [(z.min[0] + z.max[0]) / 2, 2.8, (z.min[2] + z.max[2]) / 2];
  };
  const state = () => page.evaluate(() => window.__diorama.game.state);
  /** azimuth in degrees (45 = where the level starts), elevation in radians (0.576 = start, 1.25 = from above) */
  const lookFrom = async (azDeg = 45, el = 0.576) => {
    await page.evaluate(([azDeg, el]) => {
      const { camera, game } = window.__diorama;
      const t = game.orbit.controls.target, r = camera.position.distanceTo(t), az = (azDeg * Math.PI) / 180;
      camera.position.set(t.x + r * Math.cos(el) * Math.cos(az), t.y + r * Math.sin(el), t.z + r * Math.cos(el) * Math.sin(az));
      camera.lookAt(t);
      game.orbit.controls.update();
    }, [azDeg, el]);
    await adv(0.1);
  };
  /** a real mouse drag from one world point to another, then let go */
  const carry = async (from, to) => {
    const [x0, y0] = await screen(from), [x1, y1] = await screen(to);
    await page.mouse.move(x0, y0); await page.mouse.down();
    await page.mouse.move(x1, y1, { steps: 8 });
    await adv(1.2);
    await page.mouse.up();
    await adv(1.5);
  };
  const close = async () => { await browser.close(); server.kill(); };
  return { page, errors, adv, screen, items, zones, over, state, lookFrom, carry, close };
}
