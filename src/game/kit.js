/**
 * The building context handed to a level's build(ctx). Levels place boxes,
 * cylinders, items and trigger zones through this and never touch the renderer
 * or the physics library directly.
 */
import * as THREE from 'three';

export function createKit({ group, physics }) {
  const mats = new Map();
  const occluders = [];

  function mat(color, opts = {}) {
    const key = `${color}|${opts.emissive || ''}`;
    if (!mats.has(key)) {
      mats.set(key, new THREE.MeshStandardMaterial({
        color, roughness: 0.92, metalness: 0, flatShading: true,
        emissive: opts.emissive || 0x000000, emissiveIntensity: opts.emissive ? 1 : 0,
      }));
    }
    return mats.get(key);
  }

  function place(mesh, x, y, z, o) {
    mesh.position.set(x, y, z);
    if (o.rotY) mesh.rotation.y = o.rotY;
    mesh.castShadow = o.shadow ?? true;
    mesh.receiveShadow = true;
    (o.parent || group).add(mesh);
    if (!o.parent && o.occlude !== false) occluders.push(mesh);
    return mesh;
  }

  /** Box centred at x,y,z. { solid:true } also makes it an immovable collider. */
  function box(w, h, d, color, x, y, z, o = {}) {
    const mesh = place(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color)), x, y, z, o);
    if (o.solid) mesh.userData.body = physics.addStaticBox(w, h, d, x, y, z, o.rotY || 0);
    return mesh;
  }

  function cyl(rTop, rBottom, h, color, x, y, z, o = {}) {
    const geo = new THREE.CylinderGeometry(rTop, rBottom, h, o.segments || 10, 1, !!o.open);
    const mesh = place(new THREE.Mesh(geo, mat(color)), x, y, z, o);
    if (o.open) mesh.material = mesh.material.clone(), (mesh.material.side = THREE.DoubleSide);
    if (o.rot) mesh.rotation.set(...o.rot);
    if (o.solid) mesh.userData.body = physics.addStaticBox(rBottom * 2, h, rBottom * 2, x, y, z);
    return mesh;
  }

  /** Invisible collider. */
  const solid = (w, h, d, x, y, z) => physics.addStaticBox(w, h, d, x, y, z);

  /** A loose object the player can pick up and throw. */
  function item(mesh, opts) {
    mesh.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
    group.add(mesh);
    return physics.addItem(mesh, opts);
  }

  function ball(radius, color, x, y, z, opts = {}) {
    const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(radius, 1), mat(color));
    mesh.position.set(x, y, z);
    return item(mesh, { tag: 'ball', shape: { sphere: radius }, mass: 0.4, ...opts });
  }

  /** Standard slab, ground collider and invisible walls so nothing leaves the board. */
  function slab(hx, hz, topColor, edgeColor, thick = 0.5) {
    box(hx * 2, thick, hz * 2, edgeColor, 0, -thick / 2 - 0.02, 0, { shadow: false });
    box(hx * 2, 0.04, hz * 2, topColor, 0, -0.02, 0, { shadow: false });
    solid(hx * 2 + 4, 2, hz * 2 + 4, 0, -1, 0);
    const H = 14;
    solid(1, H, hz * 2 + 2, hx + 0.5, H / 2, 0);
    solid(1, H, hz * 2 + 2, -hx - 0.5, H / 2, 0);
    solid(hx * 2 + 2, H, 1, 0, H / 2, hz + 0.5);
    solid(hx * 2 + 2, H, 1, 0, H / 2, -hz - 0.5);
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

  return { THREE, group, physics, occluders, mat, box, cyl, solid, item, ball, slab, part, remove, tween, tick, cage, zone: physics.addZone };
}
