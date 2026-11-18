/**
 * Chunky particle pool for bubbles, sparks and fireworks. One InstancedMesh of
 * small unlit cubes, so every particle stays a crisp block after the pixel pass.
 */
export function createParticles(THREE, parent, { max = 400, size = 0.12 } = {}) {
  const mesh = new THREE.InstancedMesh(
    new THREE.BoxGeometry(size, size, size),
    new THREE.MeshBasicMaterial({ color: 0xffffff }),
    max,
  );
  mesh.frustumCulled = false;
  parent.add(mesh);
  const P = Array.from({ length: max }, () => ({
    life: 0, max: 1, p: new THREE.Vector3(), v: new THREE.Vector3(), g: 0, drag: 0, s: 1, shown: true,
  }));
  const o = new THREE.Object3D();
  const col = new THREE.Color();
  for (let i = 0; i < max; i++) mesh.setColorAt(i, col.set(0xffffff));
  let cursor = 0;

  function spawn({ pos, vel = [0, 0, 0], color = 0xffffff, life = 1, gravity = 0, drag = 0, scale = 1 }) {
    const i = cursor;
    cursor = (cursor + 1) % max;
    const p = P[i];
    p.p.set(pos[0], pos[1], pos[2]);
    p.v.set(vel[0], vel[1], vel[2]);
    p.life = p.max = life;
    p.g = gravity; p.drag = drag; p.s = scale; p.shown = true;
    mesh.setColorAt(i, col.set(color));
    mesh.instanceColor.needsUpdate = true;
  }

  function burst(pos, { count = 50, speed = 3, colors = [0xffffff], life = 1.4, gravity = -1.5, drag = 1.1, scale = 1.4 } = {}) {
    for (let k = 0; k < count; k++) {
      const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, r = Math.sqrt(1 - u * u);
      const s = speed * (0.7 + Math.random() * 0.3);
      spawn({ pos, vel: [Math.cos(a) * r * s, u * s, Math.sin(a) * r * s], color: colors[k % colors.length],
        life: life * (0.75 + Math.random() * 0.25), gravity, drag, scale });
    }
  }

  function update(dt) {
    for (let i = 0; i < max; i++) {
      const p = P[i];
      if (p.life <= 0) {
        if (p.shown) { o.scale.setScalar(0); o.updateMatrix(); mesh.setMatrixAt(i, o.matrix); p.shown = false; }
        continue;
      }
      p.life -= dt;
      p.v.y += p.g * dt;
      p.v.multiplyScalar(Math.max(0, 1 - p.drag * dt));
      p.p.addScaledVector(p.v, dt);
      o.position.copy(p.p);
      o.scale.setScalar(p.s * Math.min(1, (p.life / p.max) * 2.5));
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }

  return { mesh, spawn, burst, update };
}
