// Scaffold a new level: creates src/levels/<id>/ from a working starter, registers
// it last in the unlock order, adds it to the solver test and bumps the build label.
//   node scripts/new-level.mjs <id> "<Title>"
// The starter is a complete, winnable one-step level (carry the key to the gate),
// so the game builds and the checks pass before any design work starts.
import { readFile, writeFile, mkdir, access } from 'node:fs/promises';

const [id, title] = process.argv.slice(2);
if (!id || !title || !/^[a-z][a-z0-9]*$/.test(id)) {
  console.error('usage: node scripts/new-level.mjs <id> "<Title>"   (id: lowercase letters and digits, e.g. spacestation)');
  process.exit(1);
}
const dir = `src/levels/${id}`;
if (await access(dir).then(() => true, () => false)) { console.error(`${dir} already exists`); process.exit(1); }
await mkdir(dir, { recursive: true });

await writeFile(`${dir}/level.js`, `import puzzle from './puzzle.js';
import { build } from './scene.js';

export default {
  id: '${id}',
  title: ${JSON.stringify(title)},
  hint: 'The gate is locked.',          // one or two short sentences: the goal, not the solution
  slab: { hx: 8, hz: 5.5 },             // half-width and half-depth of the board
  tall: 4,                              // height of the tallest thing, so the camera fits it
  puzzle,
  build,
};
`);

await writeFile(`${dir}/puzzle.js`, `/**
 * ${title}: describe the chain of steps here, one line per step.
 */
export default {
  // everything the player can carry; requires = the flag that must be set before it exists
  items: {
    key: { count: 1 },
  },
  rules: [
    { on: 'enter', zone: 'gate', tag: 'key', do: [['fx', 'consume'], ['set', 'gateOpen'], ['fx', 'openGate'], ['win']] },
  ],
};
`);

await writeFile(`${dir}/scene.js`, `/**
 * ${title}. Say what is where, and where each loose thing starts.
 * The level starts viewed from the +x, +z corner, so tall walls belong on the -x and -z edges.
 */
const C = {   // palette colours only (src/engine/palette.js)
  ground: '#7fb84f', edge: '#71452e', stone: '#a89c88', stoneDark: '#615d55', wood: '#71452e', gold: '#e3c832', goldDark: '#b08420',
};

export function build(ctx) {
  const { THREE, box, cyl, item, zone, mat, group, physics, part, tween } = ctx;
  const Box = (w, h, d) => new THREE.BoxGeometry(w, h, d);
  const flat = { shadow: false, occlude: false };   // for decals lying on the ground

  ctx.slab(8, 5.5, C.ground, C.edge);

  // --- the gate (the way out) --------------------------------------------------
  const G = { x: 5.5, z: -5.0 };
  for (const dx of [-1.1, 1.1]) box(0.4, 2.4, 0.4, C.stone, G.x + dx, 1.2, G.z, { solid: true });
  box(2.6, 0.4, 0.4, C.stoneDark, G.x, 2.6, G.z);
  const gate = box(1.8, 2.4, 0.2, C.wood, G.x, 1.2, G.z, { solid: true });
  zone('gate', [G.x - 1.0, 0, G.z + 0.1], [G.x + 1.0, 1.9, G.z + 1.6]);

  // --- loose things ----------------------------------------------------------------
  const key = new THREE.Group();
  part(Box(0.5, 0.09, 0.09), C.gold, 0.14, 0, 0, key);
  part(Box(0.24, 0.09, 0.3), C.goldDark, -0.2, 0, 0, key);
  key.position.set(-2, 0.2, 2);
  item(key, { tag: 'key', shape: { box: [0.75, 0.14, 0.4] }, soft: true, mass: 0.5 });

  // --- behaviour --------------------------------------------------------------------
  const fx = {
    openGate() {
      tween(1.0, (e) => { gate.position.y = 1.2 - 2.3 * e; }, () => ctx.remove(gate), 0.3);
      physics.removeStatic(gate.userData.body);
    },
  };

  function update(dt, t) { /* per-frame animation */ }

  return { update, fx };
}
`);

const edit = async (file, fn) => writeFile(file, fn(await readFile(file, 'utf8')));
const must = (s, needle, file) => { if (!s.includes(needle)) throw new Error(`could not find ${JSON.stringify(needle)} in ${file}`); };

await edit('src/game/registry.js', (s) => {
  must(s, '\nexport const LEVELS = [', 'registry.js');
  s = s.replace('\nexport const LEVELS = [', `import ${id} from '../levels/${id}/level.js';\n\nexport const LEVELS = [`).replace(/\n\nimport /, '\nimport ');
  return s.replace(/(export const LEVELS = \[[\s\S]*?)\n\];/, `$1\n  ${id},\n];`);
});
await edit('test/puzzle.test.mjs', (s) => {
  must(s, '\nconst LEVEL_PUZZLES = {', 'puzzle.test.mjs');
  s = s.replace('\nconst LEVEL_PUZZLES = {', `import ${id} from '../src/levels/${id}/puzzle.js';\n\nconst LEVEL_PUZZLES = {`).replace(/\n\nimport /, '\nimport ');
  return s.replace(/(const LEVEL_PUZZLES = \{[^}]*?) \};/, `$1, ${id} };`);
});
await edit('src/game/hud.js', (s) => s.replace(/export const BUILD = 'build (\d+)';/, (_, n) => `export const BUILD = 'build ${Number(n) + 1}';`));

console.log(`created ${dir}/ and registered "${title}" as the last level.
next:
  node build.mjs && node qa/look.mjs ${id}     # screenshot it
  npm test                                      # the solver must find a way to win
  node qa/bot.mjs ${id}                         # a robot plays it with real pointer drags`);
