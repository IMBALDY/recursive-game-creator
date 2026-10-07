import * as THREE from './vendor/build/three.module.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

/** Static Tripo mesh, with measured arm/leg regions, not a skeletal animation.
 * The original UVs/textures remain intact. All poses start from rest vertices,
 * so arm/fin motion cannot accumulate numerical drift over a long dive. */
export function createDiverActionRig(normalizedModel) {
  normalizedModel.updateMatrixWorld(true);
  const visual = new THREE.Group(), meshes = [];
  normalizedModel.traverse(source => {
    if (!source.isMesh) return;
    const geometry = source.geometry.clone().applyMatrix4(source.matrixWorld);
    const mesh = new THREE.Mesh(geometry, source.material);
    mesh.frustumCulled = false;
    const position = geometry.attributes.position, normal = geometry.attributes.normal;
    const rest = position.array.slice(), restNormals = normal?.array.slice();
    const weights = new Float32Array(position.count * 3);
    for (let i = 0; i < position.count; i++) {
      const x = rest[i * 3], y = rest[i * 3 + 1], z = rest[i * 3 + 2];
      // Side view measurements: shoulders (.65,-.36,+/-.57); the hands
      // extend toward +/-Z. The chest, face, mask and tank remain rigid.
      weights[i * 3] = smooth(.56, 1.03, Math.abs(z)) * smooth(-.06, .3, x) * (1 - smooth(-.32, -.03, y)) * (1 - smooth(1.12, 1.46, x));
      weights[i * 3 + 1] = Math.max(1 - smooth(-.95, -.38, x), smooth(-.12, .30, y) * (1 - smooth(-.1, .3, x)));
      weights[i * 3 + 2] = smooth(-.1, .55, y) * (1 - smooth(-.08, .25, x));
    }
    position.setUsage(THREE.DynamicDrawUsage);
    normal?.setUsage(THREE.DynamicDrawUsage);
    visual.add(mesh); meshes.push({ geometry, position, normal, rest, restNormals, weights });
  });
  return {
    visual,
    update(player, time, speed) {
      const action = player.action || 'swim';
      const progress = clamp((player.actionTime || 0) / Math.max(.08, player.actionDuration || .6), 0, 1);
      const armed = ['aim', 'shoot', 'recoil', 'reel', 'catch'].includes(action);
      const recoil = action === 'shoot' || action === 'recoil' ? Math.sin(Math.PI * progress) : 0;
      const pull = action === 'reel' ? Math.sin(progress * Math.PI * 3) * .5 + .5 : 0;
      const celebrate = action === 'catch' ? Math.sin(progress * Math.PI) : 0;
      const tuck = action === 'dodge' ? Math.sin(progress * Math.PI) : 0;
      const kick = time * (3.5 + Math.min(speed, 18) * .35);
      const armYaw = armed ? 1.02 - recoil * .50 - pull * .38 : .08 + Math.sin(time * 1.6) * .045;
      const armLift = armed ? .54 - recoil * .25 + pull * .10 + celebrate * .55 : -.04;
      for (const data of meshes) {
        const {position, normal, rest, restNormals, weights} = data;
        for (let i = 0; i < position.count; i++) {
          const j = i * 3, rx = rest[j], ry = rest[j + 1], rz = rest[j + 2], side = rz < 0 ? -1 : 1;
          let x = rx, y = ry, z = rz, nx = restNormals?.[j] || 0, ny = restNormals?.[j + 1] || 0, nz = restNormals?.[j + 2] || 0;
          const arm = weights[j], leg = weights[j + 1], fin = weights[j + 2];
          if (arm > .001) {
            const a = (armYaw + tuck * .65) * side * arm, ca = Math.cos(a), sa = Math.sin(a);
            let dx = x - .65, dz = z - side * .57;
            x = .65 + dx * ca + dz * sa; z = side * .57 - dx * sa + dz * ca;
            const nnx = nx * ca + nz * sa; nz = -nx * sa + nz * ca; nx = nnx;
            const b = (armLift + tuck * .75) * arm, cb = Math.cos(b), sb = Math.sin(b);
            dx = x - .65; const dy = y + .36;
            x = .65 + dx * cb - dy * sb; y = -.36 + dx * sb + dy * cb;
            const nn = nx * cb - ny * sb; ny = nx * sb + ny * cb; nx = nn;
          }
          if (leg > .001) {
            const legAngle = (Math.sin(kick + (side < 0 ? Math.PI : 0)) * (.12 + Math.min(speed, 12) * .019) + tuck * side * .56 + (action === 'reel' ? .14 : 0)) * leg;
            const c = Math.cos(legAngle), s = Math.sin(legAngle), dx = x + .38, dy = y + .68;
            x = -.38 + dx * c - dy * s; y = -.68 + dx * s + dy * c;
            const nn = nx * c - ny * s; ny = nx * s + ny * c; nx = nn;
            if (fin > .001) z += Math.sin(kick + side * .7) * .16 * fin;
          }
          position.array[j] = x; position.array[j + 1] = y; position.array[j + 2] = z;
          if (normal) { normal.array[j] = nx; normal.array[j + 1] = ny; normal.array[j + 2] = nz; }
        }
        position.needsUpdate = true; if (normal) normal.needsUpdate = true;
      }
    },
    dispose() { for (const {geometry} of meshes) geometry.dispose(); }
  };
}

/** Also drives the complete procedural fallback, so slow GLB loading does not
 * hide any combat state. World translation, aiming and whole-body roll live
 * here, while the generated mesh rig above articulates limbs locally. */
export function animateDiver(diver, player, time, delta, biome) {
  const d = diver.userData, speed = Math.hypot(player.vx || 0, player.vy || 0);
  const action = player.action || 'swim', armed = ['aim', 'shoot', 'recoil', 'reel', 'catch'].includes(action);
  const progress = clamp((player.actionTime || 0) / Math.max(.08, player.actionDuration || .6), 0, 1);
  const aimDX = (player.aimX ?? player.x + 10) - player.x, aimDY = (player.aimY ?? player.y) - player.y;
  if (armed && Math.abs(aimDX) > .05) d.direction = aimDX < 0 ? -1 : 1;
  else if (Math.abs(player.vx || 0) > .1) d.direction = player.vx > 0 ? 1 : -1;
  else if (player.facing) d.direction = player.facing < 0 ? -1 : 1;
  const localAim = Math.atan2(aimDY, Math.max(.01, Math.abs(aimDX)));
  const tilt = armed ? clamp(localAim * .55, -.7, .7) : speed > .2 ? clamp(Math.atan2(player.vy || 0, Math.max(.01, Math.abs(player.vx || 0))) * .5, -.68, .68) : Math.sin(time * 1.2) * .045;
  d.lean += (tilt - d.lean) * (1 - Math.exp(-delta * 10));
  const recoil = action === 'shoot' || action === 'recoil' ? Math.sin(progress * Math.PI) : 0;
  const pull = action === 'reel' ? Math.sin(progress * Math.PI * 3) : 0;
  const hurt = action === 'hurt' ? Math.sin(progress * Math.PI * 5) * .18 : 0;
  diver.position.set(player.x - d.direction * (recoil * .42 + Math.max(0, pull) * .16), player.y, 3.1);
  diver.rotation.z = d.lean * d.direction + hurt + (action === 'dodge' ? Math.PI * 2 * progress * d.direction : 0);
  diver.rotation.x = action === 'dodge' ? Math.sin(progress * Math.PI) * .65 : 0;
  diver.scale.set(d.direction * 1.05, 1.05, 1.05);
  const kick = time * (4 + speed * .5);
  d.legs.forEach(({leg, knee}, i) => { leg.rotation.z = Math.sin(kick + i * Math.PI) * (.1 + Math.min(.28, speed * .04)) + (action === 'dodge' ? .7 : 0); knee.rotation.z = Math.sin(kick + i * Math.PI + .8) * .24; });
  d.arms.forEach((arm, i) => { arm.rotation.z = (armed ? localAim - d.lean + .20 : Math.sin(time * 2.7 + i) * .09) - recoil * .45 - pull * .18; });
  d.spear.position.set(.92 - recoil * .55 - Math.max(0, pull) * .3, -.35 + (action === 'catch' ? Math.sin(progress * Math.PI) * .7 : 0), .72);
  d.spear.rotation.z = armed ? localAim - d.lean : -.10;
  d.spear.visible = action !== 'dodge';
  d.glow.visible = biome === 'cave' || biome === 'abyss';
  if (d.actionRig) d.actionRig.update(player, time, speed);
  if (d.generatedVisual) d.generatedVisual.rotation.x = Math.sin(kick * .55) * .035;
  return { action, progress, direction: d.direction, aimDX, aimDY, recoil, pull };
}
