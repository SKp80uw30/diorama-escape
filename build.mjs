// Adapted from the diorama kit's build.mjs: one esbuild bundle, an index.html
// that loads it, and a single self-contained HTML file for sharing.
import { build } from 'esbuild';
import { readFile, writeFile, mkdir } from 'node:fs/promises';

const minify = process.argv.includes('--minify');
await mkdir('dist', { recursive: true });
await build({
  entryPoints: ['src/main.js'], bundle: true, format: 'iife', target: ['es2020'],
  outfile: 'dist/app.js', minify, sourcemap: minify ? false : 'inline', legalComments: 'none', logLevel: 'info',
});
const js = (await readFile('dist/app.js', 'utf8')).replace(/<\/script/gi, '<\\/script');

const css = `
  * { box-sizing: border-box; }
  html, body { width: 100%; height: 100%; margin: 0; overflow: hidden; background: #fff; }
  body { -webkit-tap-highlight-color: transparent; overscroll-behavior: none; }
  #stage { position: fixed; inset: 0; display: block; width: 100%; height: 100%; background: #fff;
    image-rendering: pixelated; outline: none; touch-action: none; }
`;
const page = (script) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<link rel="icon" href="data:," />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no" />
<title>Diorama Escape</title>
<style>${css}</style>
</head>
<body>
<canvas id="stage" aria-label="A miniature diorama you can orbit and interact with"></canvas>
${script}
</body>
</html>
`;
await writeFile('dist/index.html', page('<script src="./app.js"></script>'));
await writeFile('dist/diorama-escape.html', page(`<script>${js}</script>`));
console.log(`built dist/index.html and dist/diorama-escape.html (${(js.length / 1024).toFixed(0)} kB)`);
