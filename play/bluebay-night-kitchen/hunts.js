/** Standalone, deterministic hunt simulation. Coordinates use y-up world units. */
export const HUNTS = Object.freeze([
  {
    id: 'ironjaw', kind: 'ironjaw', name: '礁背铁颚', title: '碎礁回廊 · 铁颚试炼', subtitle: '装甲冲撞 / 撞礁露腹',
    biome: 'reef', model: 'ironjaw', size: 42, hp: 950, unlockLevel: 0,
    description: '一条长过旧码头的装甲石斑，把废弃的采石礁当成了领地。',
    mechanic: '离开红色冲撞路线；等它撞上礁壁露出腹部，蓄力射中金色弱点，再按 R 收线。',
    tip: '别追着甲壳射。冲撞前向上或向下游开，撞礁后的金色腹部才是机会。',
    reward: { coins: 100, servings: 3, recipe: '海盐慢煨巨石斑' },
    rewardHint: '100 贝币、3 份巨石斑厚切，可制作海盐慢煨巨石斑', accent: '#eeab63', expectedMinutes: '2–3',
  },
  {
    id: 'stormeel', kind: 'stormeel', name: '雷冠长鳗', title: '鸣电裂谷 · 雷冠回响', subtitle: '雷流水层 / 穿越波环',
    biome: 'cave', model: 'stormeel', size: 48, hp: 1120, unlockLevel: 1,
    description: '透明的鳍冠像一座雷雨中的灯塔。它把整条裂谷变成会鸣响的琴弦。',
    mechanic: '游进没有红色条带的水层；环形雷波靠近时闪身穿过。放电结束，鳍冠会短暂熄灭。',
    tip: '雷流之间留着一整条安全水层。看清波环，再用 Shift 的无敌时间穿过去。',
    reward: { coins: 140, servings: 4, recipe: '姜香雷冠鳗暖锅' },
    rewardHint: '140 贝币、4 份雷冠鳗鱼段，可制作姜香雷冠鳗暖锅', accent: '#8fb6ff', expectedMinutes: '2–4',
  },
  {
    id: 'ancientshark', kind: 'ancientshark', name: '吞舟古鲨', title: '沉舟月湾 · 最后的大浪', subtitle: '倒流吸引 / 扇形怒潮',
    biome: 'abyss', model: 'ancientshark', size: 54, hp: 1220, unlockLevel: 2,
    description: '传说它吞下的是沉船的月影。月湾里的每一阵倒流，都像它醒来前的呼吸。',
    mechanic: '逆着吸流游，离开扇形吐浪；吐浪后鳃口发金光。半血后会接连吐出两道浪。',
    tip: '吸流会把你拉近，但不会直接扣血。吐浪前绕到它侧面，别停在张开的嘴前。',
    reward: { coins: 200, servings: 5, recipe: '归航古鲨香煎排' },
    rewardHint: '200 贝币、5 份古鲨净鱼排，可制作归航古鲨香煎排', accent: '#cb91e6', expectedMinutes: '3–4',
  },
]);

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const finite = (v, fallback = 0) => Number.isFinite(v) ? v : fallback;
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const angleDiff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
const lineDistance = (p, a, b) => {
  const dx = b.x - a.x, dy = b.y - a.y, dd = dx * dx + dy * dy;
  const t = dd ? clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / dd, 0, 1) : 0;
  return Math.hypot(p.x - a.x - t * dx, p.y - a.y - t * dy);
};
const event = (h, type, detail = {}) => {
  if (h.events.length < 32) h.events.push({ type, time: h.time, hunt: h.id, ...detail });
};
const effect = (h, type, x, y, size = 4, life = 0.65) => {
  h.effects.push({ id: ++h.serial, type, x, y, age: 0, life, size });
  if (h.effects.length > 48) h.effects.splice(0, h.effects.length - 48);
};

export function createHunt(id = 'ironjaw') {
  const def = HUNTS.find(item => item.id === id);
  if (!def) throw new RangeError(`Unknown hunt: ${String(id)}`);
  const h = {
    id, definition: def, status: 'active', time: 0, serial: 0, cycle: 0,
    world: { width: 180, height: 110, biome: def.biome, obstacles: [] },
    player: {
      x: 37, y: 52, vx: 0, vy: 0, facing: 1, health: 100, oxygen: 120, maxOxygen: 120,
      action: 'swim', actionTime: 0, actionDuration: 0, aimX: 112, aimY: 52,
      charge: 0, dodgeTime: 0, dodgeCooldown: 0, hitCooldown: 0,
      shotCooldown: 0, reelCooldown: 0,
    },
    boss: {
      id, kind: id, model: def.model, size: def.size, x: 125, y: 55,
      hp: def.hp, maxHp: def.hp, phase: 1, skill: '', state: 'telegraph', timer: 0,
      weak: false, weakpoint: { x: 113, y: 48, r: 5.8 }, facing: -1,
      step: -1, elapsed: 0,
    },
    hazards: [], projectiles: [], effects: [], events: [], tether: null,
    message: '', fireHeld: false, dodgeHeld: false, reelHeld: false,
    stats: { shots: 0, weakHits: 0, armorHits: 0, reels: 0, dodges: 0, damageTaken: 0 },
  };
  updateWeakpoint(h);
  enterNextSkill(h);
  return h;
}

function updateWeakpoint(h) {
  const b = h.boss;
  b.weakpoint.x = b.x + b.facing * b.size * 0.23;
  b.weakpoint.y = b.y + (b.kind === 'stormeel' ? b.size * 0.07 : -b.size * 0.13);
}

function plan(h) {
  const enraged = h.boss.phase === 2;
  if (h.id === 'ironjaw') return [
    ['chargeTell', enraged ? 1.9 : 2.7], ['charge', 1.0],
    ...(enraged ? [['chargeTell', 1.55], ['charge', 0.95]] : []),
    ['exposed', 7.2], ['tailTell', 1.8], ['tail', 1.1], ['rest', 4.3],
  ];
  if (h.id === 'stormeel') return [
    ['lanesTell', 2.5], ['lanes', 2.1], ['ringTell', 2], ['ring', 4.8],
    ...(enraged ? [['crossTell', 1.8], ['cross', 1.1]] : []),
    ['exposed', 7.8], ['rest', 2.4],
  ];
  return [
    ['pullTell', 2.4], ['pull', 4.1], ['coneTell', 2.3], ['cone', 1.3],
    ...(enraged ? [['coneTell', 1.65], ['cone', 1.3]] : []),
    ['exposed', 8.1], ['rest', 3.2],
  ];
}

function makeHazard(h, kind, stage, props = {}) {
  const z = {
    id: ++h.serial, kind, stage, x: h.boss.x, y: h.boss.y, width: 8,
    radius: 0, innerRadius: 0, age: 0, duration: h.boss.timer,
    damage: h.id === 'ironjaw' ? 16 : h.id === 'stormeel' ? 17 : 21,
    color: stage === 'warning' ? '#ffad72' : h.definition.accent, ...props,
  };
  h.hazards.push(z);
  return z;
}

function enterNextSkill(h) {
  const b = h.boss, p = h.player;
  let moves = plan(h);
  b.step++;
  if (b.step >= moves.length) {
    b.step = 0; h.cycle++;
    // Phase changes at a cycle boundary, so an existing warning is never replaced by damage.
    if (b.phase === 1 && b.hp <= b.maxHp * 0.5) {
      b.phase = 2;
      event(h, 'phase', { phase: 2 });
    }
    moves = plan(h);
  }
  const [skill, duration] = moves[b.step];
  b.skill = skill; b.timer = duration; b.duration = duration; b.elapsed = 0;
  b.weak = skill === 'exposed'; b.facing = p.x < b.x ? -1 : 1;
  b.state = skill.endsWith('Tell') ? 'telegraph' : ['exposed', 'rest'].includes(skill) ? 'recover' : 'attack';
  h.hazards = [];
  updateWeakpoint(h);
  if (skill === 'chargeTell') {
    const dx = p.x - b.x, dy = p.y - b.y, length = Math.hypot(dx, dy) || 1;
    b.chargeFrom = { x: b.x, y: b.y };
    // A long enough run ends in the arena's rock wall, guaranteeing a readable opening.
    b.chargeTo = { x: clamp(b.x + dx / length * 145, 18, 162), y: clamp(b.y + dy / length * 145, 18, 92) };
    makeHazard(h, 'line', 'warning', { x: b.x, y: b.y, toX: b.chargeTo.x, toY: b.chargeTo.y, width: 13 });
    h.message = b.phase === 2 ? '铁颚连撞！离开橙色路线，等第二次撞礁。' : '铁颚压低了头——向上或向下游出橙色冲撞路线！';
  } else if (skill === 'charge') {
    makeHazard(h, 'line', 'active', { ...b.chargeFrom, toX: b.chargeTo.x, toY: b.chargeTo.y, width: 13, moving: true });
    h.message = '冲撞！留在路线侧面。';
  } else if (skill === 'tailTell' || skill === 'tail') {
    makeHazard(h, 'ring', skill === 'tailTell' ? 'warning' : 'active', { radius: 31, innerRadius: 0, width: 31, damage: 14 });
    h.message = '它准备扫尾——离开身边的橙色圆圈。';
  } else if (skill === 'lanesTell' || skill === 'lanes') {
    if (skill === 'lanesTell') b.safeLane = h.cycle % 3;
    [23, 55, 87].forEach((y, i) => {
      if (i !== b.safeLane) makeHazard(h, 'line', skill === 'lanesTell' ? 'warning' : 'active', { x: 0, y, toX: 180, toY: y, width: 23 });
    });
    h.message = `雷冠点亮两层水流——游进${['下', '中', '上'][b.safeLane]}方没有橙色条带的水层。`;
  } else if (skill === 'ringTell' || skill === 'ring') {
    makeHazard(h, 'ring', skill === 'ringTell' ? 'warning' : 'active', { radius: skill === 'ringTell' ? 19 : 12, innerRadius: skill === 'ringTell' ? 13 : 6, width: 6, expanding: skill === 'ring', speed: b.phase === 2 ? 29 : 25, damage: 19 });
    h.message = '环形雷波正在扩散——看准靠近的一刻，按 Shift 闪身穿过！';
  } else if (skill === 'crossTell' || skill === 'cross') {
    if (skill === 'crossTell') b.crossX = p.x;
    makeHazard(h, 'line', skill === 'crossTell' ? 'warning' : 'active', { x: b.crossX, y: 0, toX: b.crossX, toY: 110, width: 13 });
    h.message = '雷冠余电落下！离开竖直的橙色水柱。';
  } else if (skill === 'pullTell' || skill === 'pull') {
    makeHazard(h, 'pull', skill === 'pullTell' ? 'warning' : 'active', { radius: 155, innerRadius: 0, damage: 0, strength: b.phase === 2 ? 22 : 16 });
    h.message = '古鲨深吸一口海水——逆流游动，准备绕到它的侧面。';
  } else if (skill === 'coneTell' || skill === 'cone') {
    if (skill === 'coneTell') b.coneAngle = Math.atan2(p.y - b.y, p.x - b.x);
    makeHazard(h, 'cone', skill === 'coneTell' ? 'warning' : 'active', { angle: b.coneAngle, spread: b.phase === 2 ? 1.08 : 0.92, radius: 160, damage: 24 });
    h.message = b.phase === 2 ? '怒潮连浪！离开扇形区域，还要留神下一道浪。' : '嘴前的水变白了——游出橙色扇形，别迎着吐浪。';
  } else if (skill === 'exposed') {
    h.message = '金色弱点露出来了！按住空格蓄力，松开发射；命中后按 R 收线重创。';
    p.oxygen = Math.min(p.maxOxygen, p.oxygen + 12);
    event(h, 'weak_window', { duration, x: b.weakpoint.x, y: b.weakpoint.y });
    effect(h, 'weak_hit', b.weakpoint.x, b.weakpoint.y, 7, 0.8);
  } else {
    h.message = '潮水稍缓。拉开一点距离，等待它的下一次动作。';
  }
  if (b.state === 'telegraph') event(h, 'warning', { skill, duration, message: h.message });
  else event(h, 'skill', { skill, state: b.state });
}

function setAction(p, action, duration) {
  p.action = action; p.actionTime = 0; p.actionDuration = duration;
}

function hurt(h, damage, source) {
  const p = h.player;
  if (p.dodgeTime > 0) { return; }
  if (p.hitCooldown > 0 || damage <= 0) return;
  const applied = Math.min(p.health, damage);
  p.health -= applied; p.hitCooldown = 1.35; p.charge = 0;
  h.tether = null;
  h.stats.damageTaken += applied;
  setAction(p, 'hurt', 0.4);
  effect(h, 'hurt', p.x, p.y, 5, 0.55);
  event(h, 'player_hit', { damage: applied, source, health: p.health });
}

function finish(h, status) {
  if (h.status !== 'active') return;
  h.status = status; h.player.charge = 0; h.tether = null; h.hazards = []; h.projectiles = [];
  h.message = status === 'victory' ? '狩猎成功！把这份特别的收获带回夜食堂。' : '小船接住了你。休息一下，带着完整状态再试一次。';
  event(h, status, { elapsed: h.time, stats: { ...h.stats } });
  effect(h, status === 'victory' ? 'victory' : 'hurt', h.boss.x, h.boss.y, 24, 2);
}

function hitBoss(h, damage, weak, source) {
  const b = h.boss, applied = Math.min(b.hp, damage);
  b.hp -= applied;
  effect(h, weak ? 'weak_hit' : 'hit', b.weakpoint.x, b.weakpoint.y, weak ? 7 : 3, 0.65);
  event(h, 'boss_hit', { damage: applied, weak, source, hp: b.hp });
  if (b.hp <= 0) finish(h, 'victory');
}

function shoot(h) {
  const p = h.player;
  if (p.shotCooldown > 0 || p.dodgeTime > 0 || p.action === 'hurt') { p.charge = 0; return; }
  const charge = p.charge;
  const dx = p.aimX - p.x, dy = p.aimY - p.y, length = Math.hypot(dx, dy) || 1;
  h.projectiles.push({
    id: ++h.serial, x: p.x, y: p.y, prevX: p.x, prevY: p.y,
    vx: dx / length * 112, vy: dy / length * 112, radius: 1.2,
    damage: 14 + Math.round(charge * 25), charge, life: 1.25,
  });
  p.shotCooldown = 0.75; p.charge = 0;
  setAction(p, 'recoil', 0.28);
  h.stats.shots++;
  effect(h, 'shot', p.x + dx / length * 2, p.y + dy / length * 2, 2.4, 0.2);
  event(h, 'shot', { charge });
}

/** Advance at most 100ms, in <=20ms collision steps. Omit calls entirely while paused. */
export function stepHunt(h, dt, input = {}) {
  if (!h || !h.player || !h.boss || !Array.isArray(h.events)) throw new TypeError('Invalid hunt state');
  h.events.length = 0;
  if (h.status !== 'active') return h;
  const seconds = clamp(finite(dt), 0, 0.1);
  if (!seconds) return h;
  input = input && typeof input === 'object' ? input : {};
  let ix = clamp(finite(input.x), -1, 1), iy = clamp(finite(input.y), -1, 1);
  const length = Math.hypot(ix, iy);
  if (length > 1) { ix /= length; iy /= length; }
  const p = h.player;
  p.aimX = clamp(finite(input.aimX, h.boss.weakpoint.x), 0, h.world.width);
  p.aimY = clamp(finite(input.aimY, h.boss.weakpoint.y), 0, h.world.height);
  const fire = input.fire === true, dodge = input.dodge === true, reel = input.reel === true;
  if (dodge && !h.dodgeHeld && p.dodgeCooldown <= 0) {
    const dx = length > 0.01 ? ix : -Math.sign(h.boss.x - p.x) || -1;
    const dy = length > 0.01 ? iy : 0;
    p.dodgeX = dx; p.dodgeY = dy; p.dodgeTime = 0.46; p.dodgeCooldown = 2.45; p.charge = 0;
    setAction(p, 'dodge', 0.46);
    h.stats.dodges++;
    effect(h, 'dodge', p.x, p.y, 5, 0.46);
    event(h, 'dodge');
  }
  if (reel && !h.reelHeld) {
    if (h.tether && h.tether.target === 'weak' && h.boss.weak && p.reelCooldown <= 0 && p.dodgeTime <= 0 && dist(p, h.boss.weakpoint) <= 132) {
      const power = 38 + Math.round(h.tether.quality * 28);
      p.reelCooldown = 5.7; setAction(p, 'reel', 0.55); h.stats.reels++;
      effect(h, 'reel', h.boss.weakpoint.x, h.boss.weakpoint.y, 10, 0.65);
      event(h, 'reel', { damage: power });
      h.tether = null;
      hitBoss(h, power, true, 'reel');
    } else event(h, 'reel_miss', { reason: !h.tether ? 'no_tether' : !h.boss.weak ? 'armored' : 'cooldown' });
  }
  if (h.status !== 'active') return h;
  if (!fire && h.fireHeld && p.charge >= 0) shoot(h);
  h.fireHeld = fire; h.dodgeHeld = dodge; h.reelHeld = reel;
  const steps = Math.ceil(seconds / 0.02), subDt = seconds / steps;
  for (let n = 0; n < steps && h.status === 'active'; n++) tick(h, subDt, ix, iy, fire);
  return h;
}

function tick(h, dt, ix, iy, fire) {
  const p = h.player, b = h.boss;
  h.time += dt;
  for (const key of ['dodgeTime', 'dodgeCooldown', 'hitCooldown', 'shotCooldown', 'reelCooldown']) p[key] = Math.max(0, p[key] - dt);
  p.actionTime += dt;
  if (p.actionTime >= p.actionDuration && p.action !== 'aim') p.action = 'swim';
  if (fire && p.dodgeTime <= 0 && p.action !== 'hurt' && p.action !== 'reel' && p.shotCooldown <= 0) {
    p.charge = Math.min(1, p.charge + dt / 1.05);
    if (p.action !== 'aim') setAction(p, 'aim', 1.05);
  } else if (!fire && p.action === 'aim') p.action = 'swim';
  p.facing = p.aimX < p.x ? -1 : 1;
  const speed = fire ? 17 : 23;
  p.vx = p.dodgeTime > 0 ? p.dodgeX * 64 : ix * speed;
  p.vy = p.dodgeTime > 0 ? p.dodgeY * 64 : iy * speed;
  for (const z of h.hazards) {
    if (z.kind === 'pull' && z.stage === 'active') {
      const dx = z.x - p.x, dy = z.y - p.y, d = Math.hypot(dx, dy) || 1;
      if (d < z.radius && p.dodgeTime <= 0) { p.vx += dx / d * z.strength; p.vy += dy / d * z.strength; }
    }
  }
  p.x = clamp(p.x + p.vx * dt, 5, 175); p.y = clamp(p.y + p.vy * dt, 6, 104);
  // The hunting boat supplies a thin oxygen line; mechanics, not an air timer, decide the hunt.
  p.oxygen = Math.max(55, p.oxygen - dt * 0.08);
  if (b.skill === 'charge') {
    const previous = { x: b.x, y: b.y };
    const t = clamp((b.elapsed + dt) / b.duration, 0, 1);
    b.x = b.chargeFrom.x + (b.chargeTo.x - b.chargeFrom.x) * t;
    b.y = b.chargeFrom.y + (b.chargeTo.y - b.chargeFrom.y) * t;
    if (lineDistance(p, previous, b) < 10.5) hurt(h, b.phase === 2 ? 19 : 16, 'charge');
  }
  updateWeakpoint(h);
  for (const z of h.hazards) {
    z.age += dt;
    if (z.expanding) { z.radius += z.speed * dt; z.innerRadius = Math.max(0, z.radius - z.width); }
    if (z.stage !== 'active' || z.kind === 'pull' || z.moving) continue;
    let inside = false;
    if (z.kind === 'line') inside = lineDistance(p, z, { x: z.toX, y: z.toY }) <= z.width / 2 + 1.4;
    if (z.kind === 'ring') { const d = dist(p, z); inside = d <= z.radius + 1.4 && d >= z.innerRadius - 1.4; }
    if (z.kind === 'cone') inside = dist(p, z) <= z.radius && Math.abs(angleDiff(Math.atan2(p.y - z.y, p.x - z.x), z.angle)) <= z.spread / 2;
    if (inside) hurt(h, z.damage, b.skill);
  }
  for (const q of h.projectiles) {
    q.prevX = q.x; q.prevY = q.y; q.x += q.vx * dt; q.y += q.vy * dt; q.life -= dt;
    const weakHit = b.weak && lineDistance(b.weakpoint, { x: q.prevX, y: q.prevY }, q) <= b.weakpoint.r + q.radius;
    const bodyHit = lineDistance(b, { x: q.prevX, y: q.prevY }, q) <= b.size * 0.31;
    // A weakpoint shot must reach the exposed patch; entering the bounding body alone does not block it.
    if (weakHit) {
      q.life = -1; h.stats.weakHits++;
      hitBoss(h, q.damage, true, 'harpoon');
      if (h.status === 'active' && q.charge >= 0.45) {
        h.tether = { x: b.weakpoint.x, y: b.weakpoint.y, time: 3.8, maxTime: 3.8, quality: q.charge, target: 'weak' };
        event(h, 'tether', { duration: 3.8, quality: q.charge });
      }
    } else if (bodyHit && (!b.weak || lineDistance(b.weakpoint, { x: q.x, y: q.y }, { x: q.x + q.vx * 0.24, y: q.y + q.vy * 0.24 }) > b.weakpoint.r + q.radius)) {
      q.life = -1; h.stats.armorHits++;
      hitBoss(h, 1 + Math.round(q.charge * 2), false, 'armor');
    }
    if (h.status !== 'active') break;
  }
  h.projectiles = h.projectiles.filter(q => q.life > 0 && q.x > -8 && q.x < 188 && q.y > -8 && q.y < 118).slice(-20);
  for (const e of h.effects) e.age += dt;
  h.effects = h.effects.filter(e => e.age < e.life);
  if (h.tether) {
    h.tether.time -= dt; h.tether.x = b.weakpoint.x; h.tether.y = b.weakpoint.y;
    if (h.tether.time <= 0 || !b.weak || dist(p, b.weakpoint) > 138) h.tether = null;
  }
  if (p.health <= 0) { finish(h, 'defeat'); return; }
  if (h.status !== 'active') return;
  b.timer -= dt; b.elapsed += dt;
  if (b.timer <= 0) enterNextSkill(h);
}
