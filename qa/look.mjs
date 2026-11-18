// Quick look at one level: saves a screenshot and lists what is loose and where the trigger zones are.
//   node build.mjs && node qa/look.mjs <id> [azimuthDegrees] [elevationRadians] [--phone]
// 45 / 0.576 is where the level starts; try 0, -90, 180 for other sides, elevation 1.25 for from above.
import { mkdir } from 'node:fs/promises';
import { openLevel } from './lib.mjs';

const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const phone = process.argv.includes('--phone');
const [id, az = '45', el = '0.576'] = args;
if (!id) { console.error('usage: node qa/look.mjs <id> [azimuth] [elevation] [--phone]'); process.exit(1); }
const L = await openLevel(id, phone ? { width: 390, height: 844 } : {});
try {
  await L.adv(1.5);
  await L.lookFrom(Number(az), Number(el));
  await mkdir('qa/shots', { recursive: true });
  const file = `qa/shots/look-${id}${phone ? '-phone' : ''}${az === '45' && el === '0.576' ? '' : `-${az}-${el}`}.png`;
  await L.page.screenshot({ path: file });
  console.log(`saved ${file}`);
  console.log('loose items (after settling):');
  for (const i of await L.items()) console.log(`  ${i.tag.padEnd(16)} ${i.pos.join(', ')}`);
  console.log('trigger zones:');
  for (const z of await L.zones()) console.log(`  ${z.id.padEnd(16)} x ${z.min[0]}..${z.max[0]}  y ${z.min[1]}..${z.max[1]}  z ${z.min[2]}..${z.max[2]}`);
  if (L.errors.length) { console.log('ERRORS:\n  ' + L.errors.join('\n  ')); process.exitCode = 1; }
} finally { await L.close(); }
