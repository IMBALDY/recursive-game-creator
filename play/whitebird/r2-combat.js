'use strict';
(() => {
    const G = WB;
    let serial = 0;
    let depth = 0;
    G.r2Areas = [];
    G.r2Clock = () => G.time || 0;
    G.r2Source = (derived = false) => ({
        run: G.session?.session_id, room: G.roomSerial, attack: ++serial,
        item: G.r2CurrentWeapon() ? structuredClone(G.r2CurrentWeapon()) : null,
        derived: derived
    });
    G.r2ResolveSource = (source, segment, run) => {
        if (!source) return run();
        if (source.run !== G.session?.session_id || source.room !== G.roomSerial) return;
        const previous = G.r2HitSource;
        G.r2HitSource = {...source, segment: segment};
        try { return G.r2WithWeapon(source.item, run); }
        finally { G.r2HitSource = previous; }
    };
    G.r2CaptureAttack = run => {
        const starts = [G.shots.length, G.zones.length, G.inkQueue.length, G.inkWaves.length];
        const jadeAt = G.autoJades.length, echoAt = G.echoQueue.length;
        const previousAttack = G.r2AttackContext;
        G.r2AttackContext = {source: G.r2Source(depth > 0), segment: 0};
        let result;
        try { result = run(); }
        finally { G.r2AttackContext = previousAttack; }
        for (const jade of G.autoJades.slice(jadeAt)) jade.r2Source = G.r2Source(false);
        for (const echo of G.echoQueue.slice(echoAt)) echo.r2Source = G.r2Source(true);
        for (const [list, at] of [[G.shots, starts[0]], [G.zones, starts[1]], [G.inkWaves, starts[3]]]) {
            for (const object of list.slice(at)) object.r2Source ||= G.r2Source(depth > 0 || (list === G.zones && !object.once));
        }
        for (const job of G.inkQueue.slice(starts[2])) {
            if (job.r2Bound) continue;
            job.r2Bound = true;
            const source = G.r2Source(depth > 0), callback = job.run;
            job.run = () => G.r2ResolveSource(source, 0, () => G.r2CaptureAttack(callback));
        }
        if (G.p.inkOrbit && !G.p.inkOrbit.r2Source) G.p.inkOrbit.r2Source = G.r2Source(false);
        return result;
    };
    const projectile = G.projectile;
    G.projectile = (...args) => {
        const at = G.shots.length;
        projectile(...args);
        for (const shot of G.shots.slice(at)) shot.r2Source = G.r2Source(depth > 0 || args[6] === true);
        if (args[4] === 'bird' && G.r2Combo('featherWind').active && G.time >= G.p.dashWindowStart && G.time <= G.p.dashWindowEnd && G.r2Proc('featherWind', 3)) {
            const tier = G.r2Combo('featherWind').tier;
            for (const shot of G.shots.slice(at)) { shot.pierce++; shot.r2PierceScale = [0.6, 0.75, 0.9][tier - 1]; }
            G.r2Reaction('featherWind', G.p);
        }
    };
    const specs = [
        ['wetThunder', 'Tidal Conduction', ['water', 'thunder'], 'Direct lightning consumes Wet and arcs to one other target within 200, dealing 20% / 30% / 40% base damage. Cooldown: 1 second.'],
        ['steam', 'Steam Veil', ['fire', 'water'], 'Direct fire consumes Wet, creating steam in a radius of 105 for 2 seconds. Slows by 20% / 25% / 30%. Cooldown: 4 seconds. Elites take half the slow; bosses are capped at 10%. Both last at most 1 second.'],
        ['featherWind', 'Featherwind Pierce', ['bird', 'wind'], 'Within 1.2 seconds after a dash ends, the first feather volley gains one pierce. Piercing hits retain 60% / 75% / 90% damage. Cooldown: 3 seconds.'],
        ['guardThunder', 'Stormward', ['guard', 'thunder'], 'Absorbing damage with a shield charges you for 3 seconds. The next direct lightning hit gains 15% / 25% / 35% damage. Cooldown: 4 seconds.'],
        ['featherGuard', 'Returning Feather Ward', ['bird', 'guard'], '3  seconds: hit 3 different targets with feathers to gain a shield worth 4% / 6% / 8% of maximum HP for 2 seconds. Cooldown: 8 seconds.'],
        ['quench', 'Quench', ['burn', 'water'], 'Water extinguishes the target’s burns and deals 25% / 35% / 45% extra base damage to up to 4 enemies within 115. Retains Wet from this hit. Cooldown: 3 seconds.'],
        ['shatter', 'Frost Shatter', ['water', 'frost'], 'With Frostbind equipped, a water, sword or jade hit within 180 consumes Wet and scatters ice toward up to 2 enemies within 150. Each shard deals 20% / 30% / 40% base damage. Cooldown: 3 seconds.'],
        ['fireWind', 'Emberwake', ['fire', 'wind'], 'A direct fire hit within 1.2 seconds after a dash ends leaves a trail 160 long and 60 wide for 1.5 seconds. Hits each target up to three times for 8% / 12% / 16% base damage. Cooldown: 4 seconds.']
    ];
    G.r2ComboSpecs = specs;
    G.r2Tags = () => {
        const items = G.p ? [G.r2CurrentWeapon()] : [];
        const tags = new Set(items.flatMap(item => ({tide: ['water'], spear: ['water'], ember: ['fire'], wing: ['bird'], jade: ['guard'], hammer: ['thunder']}[item.weapon])));
        const passives = {water: ['vortex'], fire: ['fire'], burn: ['burn', 'fire_feather'], bird: ['feather'], wind: ['bird', 'fleet'], guard: ['ward', 'foam_guard'], thunder: ['thunder'], frost: ['ice']};
        for (const [tag, ids] of Object.entries(passives)) if (ids.some(id => G.lv(id) > 0)) tags.add(tag);
        if (G.p?.rune === 'frost' || G.has('orochi_scale')) tags.add('water');
        if (G.p?.rune === 'burn' || G.lv('fire_feather') || (G.p?.weapon === 'ember' && G.p.weaponLevel >= 2)) tags.add('burn');
        return tags;
    };
    G.r2Combo = id => {
        const spec = specs.find(row => row[0] === id), tags = G.r2Tags();
        const level = G.p?.weaponLevel || 0;
        return {id: id, name: spec[1], active: spec[2].every(tag => tags.has(tag)), tier: Math.min(3, 1 + Math.floor(level / 3)), next: level < 3 ? 3 - level : level < 6 ? 6 - level : 0, text: spec[3]};
    };
    G.r2Proc = (id, cooldown) => {
        G.p.comboAt ||= {};
        if (G.time < (G.p.comboAt[id] || 0)) return false;
        G.p.comboAt[id] = G.time + cooldown;
        return true;
    };
    G.r2FeatherGuard = enemy => {
        const combo = G.r2Combo('featherGuard');
        if (!combo.active || G.time < (G.p.comboAt?.featherGuard || 0)) return;
        if (!G.p.r2FeatherMarks || G.time > G.p.r2FeatherUntil) {
            G.p.r2FeatherMarks = new Set(); G.p.r2FeatherUntil = G.time + 3;
        }
        G.p.r2FeatherMarks.add(enemy.id);
        if (G.p.r2FeatherMarks.size < 3 || !G.r2Proc('featherGuard', 8)) return;
        G.p.r2FeatherMarks.clear();
        G.p.r2Shield = Math.max(G.p.r2Shield || 0, G.p.maxHp * [0.04, 0.06, 0.08][combo.tier - 1]);
        G.p.r2ShieldUntil = G.time + 2;
        G.inkEffect('jade', G.p.x, G.p.y, 0, 150, 0.65, 1);
        G.r2Reaction('featherGuard', enemy);
    };
    G.r2Reaction = (id, enemy) => {
        const combo = G.r2Combo(id);
        G.float(enemy.x, enemy.y - 60, combo.name, '#d9ddd0');
        G.p.reactionCounts ||= {};
        G.p.reactionCounts[id] = (G.p.reactionCounts[id] || 0) + 1;
        G.event('mechanic_reaction', {id, tier: combo.tier, enemy_id: enemy.id});
    };
    G.r2DerivedHit = (enemy, amount, element) => {
        const previous = G.r2HitSource; G.r2HitSource = null;
        try { return G.hit(enemy, amount, element, true, G.r2Source(true)); }
        finally { G.r2HitSource = previous; }
    };
    const dash = G.dash;
    G.dash = () => {
        const count = G.metrics.dashes;
        dash();
        if (count === G.metrics.dashes) return;
        G.p.dashWindowStart = G.time + G.p.dashTime;
        G.p.dashWindowEnd = G.p.dashWindowStart + 1.2;
        G.p.dashDirection = {x: G.p.dx, y: G.p.dy};
    };
    const hurt = G.hurt;
    G.hurt = (amount, source) => {
        if (!Number.isFinite(amount) || amount <= 0) return;
        const eligible = G.state === 'running' && G.p.inv <= 0 && G.p.dashTime <= 0;
        const shield = G.p.shield;
        let absorbed = 0;
        if (eligible && G.p.r2ShieldUntil > G.time && G.p.r2Shield > 0) {
            absorbed = Math.min(amount, G.p.r2Shield);
            G.p.r2Shield -= absorbed;
            amount -= absorbed;
        }
        if (amount > 0) {
            depth++;
            try { G.r2CaptureAttack(() => hurt(amount, source)); }
            finally { depth--; }
        }
        if (eligible && (absorbed > 0 || G.p.shield < shield) && G.r2Combo('guardThunder').active && G.r2Proc('guardThunder', 4)) {
            G.p.r2ChargedUntil = G.time + 3;
            G.float(G.p.x, G.p.y - 65, 'Storm Charge · 3 seconds', '#ddd2a2');
        }
    };
    const hit = G.hit;
    G.hit = (enemy, amount, element = 'sword', chain = false, metadata = null) => {
        const source = metadata || G.r2HitSource || (G.r2AttackContext ? {...G.r2AttackContext.source, segment: G.r2AttackContext.segment++} : null);
        if (!enemy || enemy.dead || !Number.isFinite(enemy.hp) || enemy.hp <= 0 || !Number.isFinite(amount) || amount <= 0 || enemy.transitionUntil > G.time) return {ok: false, reason: 'invalid_or_invulnerable'};
        if (source && (source.run !== G.session?.session_id || source.room !== G.roomSerial)) return {ok: false, reason: 'stale_attack'};
        if (source) {
            enemy.r2Hits ||= new Set();
            const key = source.attack + ':' + (source.segment || 0);
            if (enemy.r2Hits.has(key)) return {ok: false, reason: 'duplicate_hit'};
            enemy.r2Hits.add(key);
        }
        if (!Number.isFinite(G.power()) || !Number.isFinite(G.combatStats().effectPower)) return {ok: false, reason: 'invalid_damage_modifier'};
        const derived = chain || depth > 0 || source?.derived;
        const wet = enemy.wet > 0;
        const burning = enemy.burn > 0 || enemy.inkBurn > 0 || enemy.runeBurn > 0;
        const combo = G.r2Combo(element === 'thunder' ? 'wetThunder' : 'steam');
        const guard = G.r2Combo('guardThunder');
        const base = amount;
        if (!derived && element === 'thunder' && guard.active && G.p.r2ChargedUntil > G.time) {
            amount *= 1 + [0.15, 0.25, 0.35][guard.tier - 1];
            G.p.r2ChargedUntil = 0;
            G.r2Reaction('guardThunder', enemy);
        }
        const previousDerived = G.r2DerivedDamage;
        G.r2DerivedDamage = Boolean(derived);
        depth++;
        try { hit(enemy, amount, element, Boolean(derived)); }
        finally { depth--; G.r2DerivedDamage = previousDerived; }
        if (!derived && combo.active && wet && ['fire', 'thunder'].includes(element) && G.r2Proc(combo.id, element === 'thunder' ? 1 : 4)) {
            enemy.wet = 0;
            if (element === 'thunder') {
                const other = G.enemies.find(target => target !== enemy && !target.dead && G.distance(target, enemy) < 200);
                if (other) {
                    const previous = G.r2HitSource; G.r2HitSource = null;
                    try { G.hit(other, base * [0.2, 0.3, 0.4][combo.tier - 1], 'thunder', true); }
                    finally { G.r2HitSource = previous; }
                    G.fx.push({line: true, x: enemy.x, y: enemy.y, x2: other.x, y2: other.y, life: 0.4, max: 0.4});
                }
            } else {
                G.r2Areas.push({kind: 'steam', x: enemy.x, y: enemy.y, r: 105, until: G.time + 2, start: G.time, tier: combo.tier});
                G.inkEffect('tide', enemy.x, enemy.y, 0, 210, .65, 1);
            }
            G.r2Reaction(combo.id, enemy);
        }
        if (!derived && element === 'bird') G.r2FeatherGuard(enemy);
        if (!derived && element === 'water' && burning && G.r2Proc('quench', 3)) {
            // Extinguishing sacrifices future burn ticks for immediate area damage.
            enemy.burn = 0; enemy.inkBurn = 0; enemy.runeBurn = 0;
            const tier = G.r2Combo('quench').tier;
            for (const other of G.enemies.filter(e => !e.dead && G.distance(e, enemy) < 115).sort((a, b) => G.distance(a, enemy) - G.distance(b, enemy)).slice(0, 4)) {
                G.r2DerivedHit(other, base * [0.25, 0.35, 0.45][tier - 1], 'steam');
            }
            G.inkEffect('tide', enemy.x, enemy.y, 0, 230, .65, 1);
            G.inkEffect('ember', enemy.x, enemy.y, 0, 145, .35, 1);
            G.r2Reaction('quench', enemy);
        } else if (!derived && wet && G.lv('ice') > 0 && ['water', 'sword', 'jewel'].includes(element) && G.distance(enemy, G.p) <= 180 && G.r2Proc('shatter', 3)) {
            enemy.wet = 0;
            const tier = G.r2Combo('shatter').tier;
            for (const other of G.enemies.filter(e => e !== enemy && !e.dead && G.distance(e, enemy) < 150).sort((a, b) => G.distance(a, enemy) - G.distance(b, enemy)).slice(0, 2)) {
                G.r2DerivedHit(other, base * [0.2, 0.3, 0.4][tier - 1], 'ice');
                G.inkEffect('tide', enemy.x, enemy.y, Math.atan2(other.y-enemy.y, other.x-enemy.x), 160, .4);
            }
            G.r2Reaction('shatter', enemy);
        }
        if (!derived && element === 'fire' && G.r2Combo('fireWind').active && G.time >= G.p.dashWindowStart && G.time <= G.p.dashWindowEnd && G.r2Proc('fireWind', 4)) {
            G.r2Reaction('fireWind', enemy);
            G.r2Areas.push({kind: 'fire', x: G.p.x, y: G.p.y, direction: G.p.dashDirection, until: G.time + 1.5, tick: G.time, hits: {}, damage: base * [0.08, 0.12, 0.16][G.r2Combo('fireWind').tier - 1], source: G.r2Source(true)});
        }
        return {ok: true, type: derived ? 'derived' : 'direct'};
    };
    // Accounting lives at the actual HP mutation, below every legacy modifier.
    G.r2AccountDamage = (enemy, before, after) => {
        const actual = Math.min(before, Math.max(0, before - Math.max(0, after)));
        if (Number.isFinite(actual) && G.r2Run) G.r2Run.damage += actual;
    };
    G.r2SteamSlow = enemy => {
        let slow = 0;
        for (const area of G.r2Areas) {
            if (area.kind !== 'steam' || G.distance(enemy, area) >= area.r || G.time >= area.until) continue;
            if ((enemy.boss || enemy.r2Elite) && G.time >= area.start + 1) continue;
            let amount = [0.2, 0.25, 0.3][area.tier - 1];
            if (enemy.boss) amount = Math.min(0.1, amount);
            else if (enemy.r2Elite) amount /= 2;
            slow = Math.max(slow, amount);
        }
        return slow;
    };
    const updateEnemies = G.updateEnemies;
    G.updateEnemies = dt => {
        const restored = [];
        for (const enemy of G.enemies) {
            const slow = G.r2SteamSlow(enemy);
            if (slow) { restored.push([enemy, enemy.speed]); enemy.speed *= 1 - slow; }
        }
        updateEnemies(dt);
        for (const [enemy, speed] of restored) enemy.speed = speed;
    };
    const update = G.update;
    G.update = dt => {
        if (G.state !== 'running' || document.hidden) return;
        if (!Number.isFinite(dt) || dt <= 0 || dt > 0.25) return;
        const before = G.time;
        update(dt);
        if (G.r2Run) G.r2Run.seconds += Math.max(0, G.time - before);
        for (const area of G.r2Areas) if (area.kind === 'fire' && G.time >= area.tick && G.time < area.until) {
            area.tick = G.time + 0.5;
            for (const enemy of [...G.enemies]) {
                const dx = enemy.x - area.x, dy = enemy.y - area.y, dir = area.direction;
                const along = dx * dir.x + dy * dir.y, across = -dx * dir.y + dy * dir.x;
                if (along <= 20 && along >= -160 && Math.abs(across) <= 30 + enemy.r && (area.hits[enemy.id] || 0) < 3) {
                    const count = area.hits[enemy.id] || 0;
                    area.hits[enemy.id] = count + 1;
                    G.r2ResolveSource(area.source, count, () => G.hit(enemy, area.damage, 'fire', true));
                }
            }
        }
        G.r2Areas = G.r2Areas.filter(area => area.until > G.time);
    };
    const enter = G.enterNode;
    G.enterNode = (...args) => {
        const result = enter(...args);
        if (result) {
            G.r2Areas = []; G.echoQueue = []; G.inkQueue = []; G.inkWaves = []; G.autoJades = [];
            G.p.featherOrbitUntil = 0; G.p.inkOrbit = null;
            G.p.r2FeatherMarks = null; G.p.r2ChargedUntil = 0;
        }
        return result;
    };
    window.addEventListener('blur', () => { if (G.state === 'running') G.pause(); });
})();
