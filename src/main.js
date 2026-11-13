import * as THREE from 'three';
import { PixelPost } from './engine/post.js';
import { CAMERA, createCamera, updateCamera } from './engine/camera.js';
import { createDioramaOrbit } from './engine/orbit.js';
import { createLighting } from './engine/lighting.js';
import { createPhysics } from './game/physics.js';
import { createGrab } from './game/grab.js';
import { createKit } from './game/kit.js';
import { createState, applyEvent } from './game/puzzle.js';
import { loadProgress, markSolved } from './game/save.js';
import { createHud } from './game/hud.js';
import { createViewControls } from './game/viewcontrols.js';
import { LEVELS, levelById, nextOf } from './game/registry.js';

const canvas = document.getElementById('stage');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true });
renderer.setPixelRatio(1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;

const scene = new THREE.Scene();
scene.background = null;
createLighting(renderer, scene);
const post = new PixelPost(renderer, 1600);
const camera = createCamera();

const progress = loadProgress(LEVELS[0].id);
const hud = createHud({ levels: LEVELS, onPick: (id) => load(id), onRestart: () => load(current.level.id) });

/** Everything belonging to the level on screen; replaced wholesale on load(). */
let current = null;
// The view is moved, turned and zoomed with the corner controls, never by dragging on the diorama.
const view = createViewControls({
  getOrbit: () => current.orbit, getBounds: () => ({ ...current.level.slab, tall: current.level.tall }), camera, THREE,
});

function fitPoints({ slab, tall }) {
  const { hx, hz } = slab;
  const pts = [new THREE.Vector3(0, tall, 0)];
  for (const y of [0, -0.5]) for (const sx of [-1, 1]) for (const sz of [-1, 1]) pts.push(new THREE.Vector3(sx * hx, y, sz * hz));
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
    current.grab.dispose();
    current.orbit.dispose();
    scene.remove(current.group);
    current.group.traverse((o) => { o.geometry?.dispose(); });
  }
  const group = new THREE.Group();
  scene.add(group);
  const physics = createPhysics();
  const kit = createKit({ group, physics });
  const built = level.build(kit) || {};
  const points = fitPoints(level);
  updateCamera(camera, size(), points);
  const d = camera.userData.distance;
  const orbit = createDioramaOrbit(camera, canvas, {
    target: CAMERA.target, minDistance: d * 0.45, maxDistance: d * 1.5, maxPolarAngle: Math.PI / 2 - 0.06,
  });
  orbit.controls.enableRotate = false; // dragging the diorama is for objects; the corner controls move the view
  const { hx, hz } = level.slab;
  const grab = createGrab({
    canvas, camera, physics, orbit,
    bounds: { minX: -hx + 0.3, maxX: hx - 0.3, minZ: -hz + 0.3, maxZ: hz - 0.3 },
  });
  grab.setOccluders(kit.occluders);
  current = { level, group, physics, kit, built, orbit, grab, points, state: createState(level.puzzle), t: 0 };
  hud.setLevel(level);
  hud.setProgress(progress, level.id);
}

/** Every physical event goes through the puzzle rules; effects come back out. */
function emit(event) {
  const c = current;
  const r = applyEvent(c.level.puzzle, c.state, { ...event, item: undefined });
  if (!r.accepted) return;
  const wasWon = c.state.won;
  c.state = r.state;
  for (const fx of r.effects) {
    if (fx.name === 'consume') c.physics.removeItem(event.item);
    else if (fx.name === 'hint') hud.setHint(fx.payload);
    else c.built.fx?.[fx.name]?.(fx.payload, c.state, event);
  }
  if (c.state.won && !wasWon) {
    const next = nextOf(c.level.id);
    markSolved(progress, c.level.id, next?.id);
    hud.setProgress(progress, c.level.id);
    setTimeout(() => { if (current === c) hud.showWin(c.level, next); }, 1100);
  }
}

function tick(dt) {
  const c = current;
  c.t += dt;
  c.grab.update();
  c.physics.step(dt, emit);
  c.kit.tick(dt);
  c.built.update?.(dt, c.t, c.state);
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  tick(dt);
  view.update(dt);
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
load(progress.unlocked.includes(wanted) ? wanted : progress.unlocked.filter((id) => levelById(id)?.build).at(-1) || LEVELS[0].id);
post.render(scene, camera);
requestAnimationFrame(frame);

// Debug/QA handle (same shape the diorama kit's QA scripts expect, plus game access).
window.__diorama = {
  THREE, scene, camera, renderer, post,
  get game() { return current; },
  view,
  /** advance the simulation without waiting for real time */
  advance(seconds) { for (let i = 0; i < Math.round(seconds * 60); i++) tick(1 / 60); post.render(scene, camera); },
};
window.__dioramaReady = true;
