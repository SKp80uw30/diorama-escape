import * as THREE from 'three';
import { PixelPost } from './engine/post.js';
import { CAMERA, createCamera, updateCamera } from './engine/camera.js';
import { createDioramaOrbit } from './engine/orbit.js';
import { createLighting } from './engine/lighting.js';
import { createGrab } from './game/grab.js';
import { createInput } from './game/input.js';
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
// levels may recolour the lights (underwater, dusk...); every load starts from these
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
// All finger and mouse input goes through this one handler (see input.js).
const input = createInput({
  canvas, camera,
  get: () => current && { controls: current.orbit.controls, grab: current.grab, slab: current.level.slab, tall: current.level.tall },
});

function fitPoints({ slab, tall, depth = 0.5, fit = [] }) {
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

function load(id) {
  const level = levelById(id);
  if (!level?.build) return;
  if (current) {
    input.cancel();
    current.orbit.dispose();
    scene.remove(current.group);
    current.group.traverse((o) => { o.geometry?.dispose(); });
  }
  resetLights();
  hud.setLevel(level);
  // the level's scene, physics, kit and puzzle state (see game/session.js)
  const session = createSession(level, { lights, say: (text) => hud.setHint(text), onWin: () => won(session) });
  const { group, physics, kit } = session;
  scene.add(group);
  const points = fitPoints(level);
  updateCamera(camera, size(), points);
  const d = camera.userData.distance;
  const orbit = createDioramaOrbit(camera, canvas, {
    target: CAMERA.target, minDistance: d * 0.45, maxDistance: d * 1.5, maxPolarAngle: Math.PI / 2 - 0.06,
  });
  // The orbit object only holds the look-at target, the limits and the reset pose.
  // Its own pointer handling is switched off: input.js is the only input handler.
  orbit.controls.disconnect();
  canvas.style.touchAction = 'none';
  const { hx, hz } = level.slab;
  const grab = createGrab({
    canvas, camera, physics,
    bounds: { minX: -hx + 0.3, maxX: hx - 0.3, minZ: -hz + 0.3, maxZ: hz - 0.3 },
  });
  grab.setOccluders(kit.occluders);
  current = Object.assign(session, { orbit, grab, points });
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
  current.tick(dt); // physics, puzzle events, tweens and the level's own animation
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
  current.orbit.controls.target.copy(CAMERA.target);
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
  input,
  levels: LEVELS.filter((l) => l.build).map((l) => l.id),
  load,
  solve: () => solve(current.level.puzzle),
  autoplay: () => { const r = autoplay(current); post.render(scene, camera); return r; },
  /** advance the simulation without waiting for real time */
  advance(seconds) { for (let i = 0; i < Math.round(seconds * 60); i++) tick(1 / 60); post.render(scene, camera); },
};
window.__dioramaReady = true;
