import * as THREE from 'three';
import { PixelPost } from './engine/post.js';
import { CAMERA, createCamera, updateCamera } from './engine/camera.js';
import { createView } from './game/view.js';
import { createLighting } from './engine/lighting.js';
import { createGrab } from './game/grab.js';
import { createSession } from './game/session.js';
import { autoplay } from './game/autoplay.js';
import { solve } from './game/puzzle.js';
import { loadProgress, markSolved } from './game/save.js';
import { createHud } from './game/hud.js';
import { LEVELS, levelById, nextOf, isOpen } from './game/registry.js';

const canvas = document.getElementById('stage');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true });
renderer.setPixelRatio(1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;

const scene = new THREE.Scene();
scene.background = null;
const lights = createLighting(renderer, scene);
const LIGHT_DEFAULTS = {
  sun: [lights.sun.color.getHex(), lights.sun.intensity],
  fill: [lights.fill.color.getHex(), lights.fill.intensity],
  hemi: [lights.hemi.color.getHex(), lights.hemi.groundColor.getHex(), lights.hemi.intensity],
};
function resetLights() {
  lights.sun.color.setHex(LIGHT_DEFAULTS.sun[0]); lights.sun.intensity = LIGHT_DEFAULTS.sun[1];
  lights.fill.color.setHex(LIGHT_DEFAULTS.fill[0]); lights.fill.intensity = LIGHT_DEFAULTS.fill[1];
  lights.hemi.color.setHex(LIGHT_DEFAULTS.hemi[0]); lights.hemi.groundColor.setHex(LIGHT_DEFAULTS.hemi[1]);
  lights.hemi.intensity = LIGHT_DEFAULTS.hemi[2];
}
const post = new PixelPost(renderer, 1600);
const camera = createCamera();

const progress = loadProgress(LEVELS[0].id);
const hud = createHud({ levels: LEVELS, isOpen, onPick: (id) => load(id), onRestart: () => load(current.level.id) });

/** Everything belonging to the level on screen; replaced wholesale on load(). */
let current = null;

function fitPoints({ slab, tall = 4, depth = 0.5, fit = [] }) {
  const { hx, hz } = slab;
  const pts = [new THREE.Vector3(0, tall, 0), ...fit.map((p) => new THREE.Vector3(...p))];
  for (const y of [0, -depth]) for (const sx of [-1, 1]) for (const sz of [-1, 1]) pts.push(new THREE.Vector3(sx * hx, y, sz * hz));
  return pts;
}

function size() {
  const w = canvas.clientWidth || 2, h = canvas.clientHeight || 2;
  post.setSize(w, h);
  return w / h;
}

const tapRay = new THREE.Raycaster();
const tapNdc = new THREE.Vector2();
/** A click that was not a drag: did it land on a switch? */
function tapAt(e) {
  const c = current;
  if (!c || !c.kit.taps.length) return;
  const r = canvas.getBoundingClientRect();
  tapNdc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  tapRay.setFromCamera(tapNdc, camera);
  const hits = tapRay.intersectObjects([...c.kit.taps.map((t) => t.object), ...c.kit.occluders], true);
  for (const h of hits) {
    if (h.distance > hits[0].distance + 0.5) break;
    for (let o = h.object; o && o !== c.group; o = o.parent) {
      if (o.userData.tapId) { c.emit({ type: 'tap', target: o.userData.tapId }); return; }
    }
  }
}

function load(id) {
  const level = levelById(id);
  if (!level?.build) return;
  if (current) {
    current.grab.dispose();
    current.view.dispose();
    scene.remove(current.group);
    current.group.traverse((o) => { o.geometry?.dispose(); });
  }
  resetLights();
  hud.setLevel(level);
  const session = createSession(level, { lights, say: (text) => hud.setHint(text), onWin: () => won(session) });
  scene.add(session.group);
  const points = fitPoints(level);
  updateCamera(camera, size(), points);
  const d = camera.userData.distance;
  const { hx, hz } = level.slab;
  let grab = null;
  // the same camera controls for every level: see game/view.js
  const view = createView({
    camera, canvas, target: CAMERA.target, distance: d,
    bounds: { minX: -hx, maxX: hx, minY: -0.5, maxY: (level.tall ?? 4) * 0.8, minZ: -hz, maxZ: hz },
    onSelect: tapAt, onTwoFingers: () => grab?.cancel(),
  });
  const orbit = view.orbit;
  grab = createGrab({
    canvas, camera, physics: session.physics, orbit,
    bounds: { minX: -hx + 0.3, maxX: hx - 0.3, minZ: -hz + 0.3, maxZ: hz - 0.3 },
  });
  grab.setOccluders(session.kit.occluders);
  current = Object.assign(session, { view, orbit, grab, points });
  hud.setProgress(progress, level.id);
}

function won(session) {
  const next = nextOf(session.level.id);
  markSolved(progress, session.level.id, next?.id);
  hud.setProgress(progress, session.level.id);
  setTimeout(() => { if (current === session) hud.showWin(session.level, next); }, (session.level.winDelay ?? 1.1) * 1000);
}

function tick(dt) {
  current.grab.update();
  current.tick(dt);
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  tick(dt);
  post.render(scene, camera);
  requestAnimationFrame(frame);
}

window.addEventListener('resize', () => {
  if (!current) return;
  updateCamera(camera, size(), current.points);
  current.orbit.controls.update();
});

const wanted = new URLSearchParams(location.search).get('level');
load(isOpen(levelById(wanted), progress) ? wanted : progress.unlocked.filter((id) => levelById(id)?.build).at(-1) || LEVELS[0].id);
post.render(scene, camera);
requestAnimationFrame(frame);

// Debug/QA handle (same shape the diorama kit's QA scripts expect, plus game access).
window.__diorama = {
  THREE, scene, camera, renderer, post,
  get game() { return current; },
  levels: LEVELS.filter((l) => l.build).map((l) => l.id),
  load,
  solve: () => solve(current.level.puzzle),
  autoplay: () => { const r = autoplay(current); post.render(scene, camera); return r; },
  /** advance the simulation without waiting for real time */
  advance(seconds) { for (let i = 0; i < Math.round(seconds * 60); i++) tick(1 / 60); post.render(scene, camera); },
};
window.__dioramaReady = true;
