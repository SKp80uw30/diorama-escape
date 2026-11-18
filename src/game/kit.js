/**
 * The building context handed to a level's build(ctx). Levels place meshes,
 * colliders, items, trigger zones and tappable switches through this and never
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
  const taps = [];

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

  /** Make an object (and its children) respond to taps/clicks with { type:'tap', target:id }. */
  function tappable(object, id) {
    object.userData.tapId = id;
    taps.push({ object, id });
    return object;
  }

  /** Invisible tap target: a generous hit area for a small switch. */
  function hitbox(w, h, d, x, y, z, id, o = {}) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ visible: false }));
    mesh.position.set(x, y, z);
    (o.parent || group).add(mesh);
    return tappable(mesh, id);
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

  const particles = (opts) => createParticles(THREE, group, opts);

  return {
    THREE, group, physics, lights, say, occluders, taps,
    mat, glow, add, box, cyl, cone, sphere, rod, solid, item, ball, tappable, hitbox, slab, bounds, particles,
    zone: physics.addZone,
  };
}
