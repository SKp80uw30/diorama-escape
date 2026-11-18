/**
 * Thin wrapper over cannon-es so levels never touch the physics library
 * directly. Swap the library here and nothing else changes.
 *
 * Options: { gravity, damping } so a level can feel floaty (underwater, clouds).
 *
 * - statics: immovable boxes (ground, walls, furniture)
 * - items:   dynamic bodies tied to a mesh, with a tag the puzzle rules read
 * - zones:   axis-aligned trigger volumes; an item coming to rest inside one
 *            (not while held) emits { type:'enter', zone, tag, item }
 */
import * as CANNON from 'cannon-es';

export function createPhysics({ gravity = -22, damping = 0.02 } = {}) {
  const world = new CANNON.World({ gravity: new CANNON.Vec3(0, gravity, 0) });
  world.allowSleep = true;
  world.defaultContactMaterial.friction = 0.45;
  world.defaultContactMaterial.restitution = 0.38;
  const items = [];
  const zones = [];

  function addStaticBox(w, h, d, x, y, z, rotY = 0) {
    const body = new CANNON.Body({ type: CANNON.Body.STATIC });
    body.addShape(new CANNON.Box(new CANNON.Vec3(w / 2, h / 2, d / 2)));
    body.position.set(x, y, z);
    body.quaternion.setFromEuler(0, rotY, 0);
    world.addBody(body);
    return body;
  }

  function removeStatic(body) { world.removeBody(body); }

  /** shape: { sphere: r } or { box: [w, h, d] } */
  function addItem(mesh, { tag, shape, mass = 1, grabbable = true, velocity } = {}) {
    const body = new CANNON.Body({ mass, linearDamping: damping, angularDamping: 0.35 });
    if (shape.sphere) body.addShape(new CANNON.Sphere(shape.sphere));
    else body.addShape(new CANNON.Box(new CANNON.Vec3(shape.box[0] / 2, shape.box[1] / 2, shape.box[2] / 2)));
    body.position.copy(mesh.position);
    body.quaternion.copy(mesh.quaternion);
    if (velocity) body.velocity.set(...velocity);
    body.sleepSpeedLimit = 0.15;
    world.addBody(body);
    const item = { body, mesh, tag, grabbable, held: false, alive: true, falls: 0, home: mesh.position.clone() };
    items.push(item);
    return item;
  }

  function removeItem(item) {
    if (!item.alive) return;
    item.alive = false;
    item.held = false;
    world.removeBody(item.body);
    item.mesh.visible = false;
    for (const z of zones) z.inside.delete(item);
  }

  function addZone(id, min, max) {
    const zone = { id, min, max, inside: new Set() };
    zones.push(zone);
    return zone;
  }

  const within = (p, z) =>
    p.x >= z.min[0] && p.x <= z.max[0] && p.y >= z.min[1] && p.y <= z.max[1] && p.z >= z.min[2] && p.z <= z.max[2];

  function step(dt, emit) {
    world.step(1 / 60, dt, 4);
    for (const item of items) {
      if (!item.alive) continue;
      const p = item.body.position;
      if (p.y < -6) {
        // fell off the world: put it back where it started
        item.falls++;
        p.copy(item.home);
        item.body.velocity.setZero();
        item.body.angularVelocity.setZero();
      }
      item.mesh.position.copy(p);
      item.mesh.quaternion.copy(item.body.quaternion);
    }
    for (const zone of zones) {
      for (const item of items) {
        if (!item.alive) continue;
        const inside = !item.held && within(item.body.position, zone);
        if (inside && !zone.inside.has(item)) {
          zone.inside.add(item);
          emit({ type: 'enter', zone: zone.id, tag: item.tag, item });
        } else if (!inside) zone.inside.delete(item);
      }
    }
  }

  return { world, items, zones, gravity, addStaticBox, removeStatic, addItem, removeItem, addZone, step };
}
