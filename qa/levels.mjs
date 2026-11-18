// Renders every level in a real browser: the opening hero view, then the end
// after an automatic play-through. Saves qa/shots/<id>-start.png and -end.png.
//   node build.mjs && node qa/levels.mjs [id ...]
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
const { chromium } = createRequire(import.meta.url)('playwright');

const PORT = 5392;
const server = spawn('node', ['serve.mjs', PORT], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 600));
await mkdir('qa/shots', { recursive: true });
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
let failed = false;
try {
  const page = await browser.newPage({ viewport: { width: 1000, height: 640 } });
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(`http://127.0.0.1:${PORT}/`);
  await page.waitForFunction(() => window.__dioramaReady);
  const only = process.argv.slice(2);
  const ids = (await page.evaluate(() => window.__diorama.levels)).filter((id) => !only.length || only.includes(id));
  for (const id of ids) {
    await page.evaluate((id) => { window.__diorama.load(id); window.__diorama.advance(1.5); }, id);
    await page.screenshot({ path: `qa/shots/${id}-start.png` });
    const r = await page.evaluate(() => window.__diorama.autoplay());
    await page.evaluate(() => window.__diorama.advance(0.1));
    await page.screenshot({ path: `qa/shots/${id}-end.png` });
    console.log(`${r.won ? 'PASS' : 'FAIL'}  ${id}: ${r.log.join(' | ')}`);
    if (!r.won) failed = true;
  }
  if (errors.length) { failed = true; console.log('FAIL  console errors: ' + errors.join(' | ')); }
} catch (e) {
  failed = true;
  console.log('ERROR ' + e.message.split('\n')[0]);
} finally {
  await browser.close();
  server.kill();
}
process.exit(failed ? 1 : 0);
