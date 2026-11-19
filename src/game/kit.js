/**
 * The building context handed to a level's build(ctx). Levels place meshes,
 * colliders, items and trigger zones through this and never
 * touch the renderer or the physics library directly.
 *
 * Placement options (o): { parent, rotY, rot:[x,y,z], scale:[x,y,z], shadow,
 *   occlude, solid }. Meshes added to the level root are "occluders" by default:
 * they hide items from the grab picker and are the surfaces a carried item
 * hovers over. Meshes added to a parent group are not, unless occlude:true.
 */
import * as THREE from 'three';
import { createParticles } from './particles.js';

export function createKit({ group, physics, lights, say = () => {} }) {
  const mats = new Map();
  const occluders = [];

  function mat(color, opts = {}) {
    const key = `${color}|${opts.emissive ?? ''}|${opts.side ?? ''}|${opts.glow ?? ''}`;
    if (!mats.has(key)) {
      mats.set(key, new THREE.MeshStandardMaterial({
        color, roughness: 0.92, metalness: 0, flatShading: true,
        emissive: opts.emissive ?? 0x000000, emissiveIntensity: opts.emissive ? (opts.glow ?? 1) : 0,
        side: opts.side ?? THREE.FrontSide,
      }));
    }
    return mats.get(key);
  }
  /** Self-lit material: stays bright in shadow (lamps, crystals, flames). */
  const glow = (color, strength = 0.85) => mat(color, { emissive: color, glow: strength });

  function add(mesh, x = 0, y = 0, z = 0, o = {}) {
    mesh.position.set(x, y, z);
    if (o.rot) mesh.rotation.set(...o.rot);
    if (o.rotY) mesh.rotation.y = o.rotY;
    if (o.scale) mesh.scale.set(...o.scale);
    mesh.traverse((m) => {
      if (!m.isMesh) return;
      m.castShadow = o.shadow ?? true;
      m.receiveShadow = true;
    });
    (o.parent || group).add(mesh);
    if (o.occlude ?? !o.parent) occluders.push(mesh);
    return mesh;
  }

  function box(w, h, d, color, x, y, z, o = {}) {
    const mesh = add(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), o.mat || mat(color)), x, y, z, o);
    if (o.solid) mesh.userData.body = physics.addStaticBox(w, h, d, x, y, z, o.rotY || 0);
    return mesh;
  }

  function cyl(rTop, rBottom, h, color, x, y, z, o = {}) {
    const geo = new THREE.CylinderGeometry(rTop, rBottom, h, o.segments || 10, 1, !!o.open);
    const m = o.mat || mat(color, o.open ? { side: THREE.DoubleSide } : {});
    const mesh = add(new THREE.Mesh(geo, m), x, y, z, o);
    if (o.solid) mesh.userData.body = physics.addStaticBox(Math.max(rTop, rBottom) * 1.8, h, Math.max(rTop, rBottom) * 1.8, x, y, z);
    return mesh;
  }

  const cone = (r, h, color, x, y, z, o = {}) => cyl(0, r, h, color, x, y, z, o);

  function sphere(r, color, x, y, z, o = {}) {
    const geo = new THREE.IcosahedronGeometry(r, o.detail ?? 1);
    return add(new THREE.Mesh(geo, o.mat || mat(color)), x, y, z, o);
  }

  /** A thin rod between two points (ropes, struts, poles). */
  function rod(a, b, r, color, o = {}) {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
    const len = A.distanceTo(B);
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 5), o.mat || mat(color));
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
    const mid = A.add(B).multiplyScalar(0.5);
    return add(mesh, mid.x, mid.y, mid.z, { occlude: false, ...o });
  }

  /** Invisible immovable collider. */
  const solid = (w, h, d, x, y, z, rotY = 0) => physics.addStaticBox(w, h, d, x, y, z, rotY);

  /** A loose object the player can pick up and throw. */
  function item(mesh, opts) {
    mesh.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
    if (!mesh.parent) group.add(mesh);
    return physics.addItem(mesh, opts);
  }

  function ball(radius, color, x, y, z, opts = {}) {
    const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(radius, 1), mat(color));
    mesh.position.set(x, y, z);
    return item(mesh, { tag: 'ball', shape: { sphere: radius }, mass: 0.4, ...opts });
  }

  /** Invisible walls so nothing leaves the board, without a floor. */
  function bounds(hx, hz, H = 16) {
    solid(1, H, hz * 2 + 2, hx + 0.5, H / 2 - 2, 0);
    solid(1, H, hz * 2 + 2, -hx - 0.5, H / 2 - 2, 0);
    solid(hx * 2 + 2, H, 1, 0, H / 2 - 2, hz + 0.5);
    solid(hx * 2 + 2, H, 1, 0, H / 2 - 2, -hz - 0.5);
  }

  /** Standard slab: visible base, ground collider and bounds. */
  function slab(hx, hz, topColor, edgeColor, thick = 0.5) {
    box(hx * 2, thick, hz * 2, edgeColor, 0, -thick / 2 - 0.02, 0, { shadow: false });
    box(hx * 2, 0.04, hz * 2, topColor, 0, -0.02, 0, { shadow: false });
    solid(hx * 2 + 4, 2, hz * 2 + 4, 0, -1, 0);
    bounds(hx, hz);
  }

  /** A bare mesh (never an occluder, never a collider): for item parts and moving props. */
  function part(geometry, color, x = 0, y = 0, z = 0, parent = group, opts) {
    const mesh = new THREE.Mesh(geometry, mat(color, opts));
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }

  /** Take scenery out of the level: mesh, its collider and its line-of-sight blocking. */
  function remove(obj) {
    obj.traverse((o) => {
      const i = occluders.indexOf(o);
      if (i >= 0) occluders.splice(i, 1);
      if (o.userData.body) physics.removeStatic(o.userData.body);
    });
    obj.parent?.remove(obj);
  }

  // --- tiny tween runner: tween(seconds, step(eased, linear), done, delay) ------
  const tweens = [];
  function tween(dur, step, done, delay = 0) { tweens.push({ t: -delay, dur: dur || 1e-6, step, done }); }
  function tick(dt) {
    for (let i = tweens.length - 1; i >= 0; i--) {
      const tw = tweens[i];
      tw.t += dt;
      if (tw.t < 0) continue;
      const k = Math.min(1, tw.t / tw.dur);
      tw.step?.(1 - Math.pow(1 - k, 3), k);
      if (k >= 1) { tweens.splice(i, 1); tw.done?.(); }
    }
  }

  /**
   * A barred cage standing on a surface at height y, holding something the
   * player can see but not take. open(done) retracts the bars.
   */
  function cage(x, y, z, w, h, color) {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    group.add(g);
    const e = w / 2 - 0.04;
    for (let i = 0; i < 4; i++) {
      for (const t of [-1, -0.33, 0.33, 1]) {
        const [bx, bz] = i === 0 ? [t * e, e] : i === 1 ? [t * e, -e] : i === 2 ? [e, t * e] : [-e, t * e];
        part(new THREE.BoxGeometry(0.05, h, 0.05), color, bx, h / 2, bz, g);
      }
    }
    part(new THREE.BoxGeometry(w, 0.06, w), color, 0, h, 0, g);
    const body = solid(w, h + 0.06, w, x, y + h / 2, z);
    return {
      group: g,
      open(done) {
        tween(0.9, (e2) => { g.scale.y = 1 - 0.98 * e2; }, () => { remove(g); physics.removeStatic(body); done?.(); }, 0.3);
      },
    };
  }

  /** A puff of small bits flying out from a point (confetti, splinters), then gone. */
  function burst(x, y, z, colors, count = 14, reach = 1.4) {
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + i * 0.7, r = reach * (0.5 + ((i * 37) % 10) / 20), rise = 0.6 + ((i * 53) % 10) / 12;
      const bit = part(new THREE.BoxGeometry(0.12, 0.12, 0.04), colors[i % colors.length], x, y, z);
      bit.castShadow = false;
      tween(0.7 + (i % 4) * 0.08, (e, k) => {
        bit.position.set(x + Math.cos(a) * r * e, y + rise * Math.sin(k * Math.PI) - 1.2 * k * k, z + Math.sin(a) * r * e);
        bit.rotation.set(k * 6 + i, k * 4, 0);
      }, () => remove(bit));
    }
  }

  const particles = (opts) => createParticles(THREE, group, opts);

  return {
    THREE, group, physics, lights, say, occluders,
    mat, glow, add, box, cyl, cone, sphere, rod, solid, item, ball, slab, bounds, particles,
    part, remove, tween, tick, cage, burst,
    zone: physics.addZone,
  };
}
