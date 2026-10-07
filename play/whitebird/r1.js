'use strict';

// R1 text basis: “Make the opening harder and reward thoughtful weapon and talent combinations”.
// Only the opening chapter's encounter pacing and existing growth mechanics change.
(() => {
    const G = WB;
    const openingKinds = ['kodama', 'yomotsu', 'fox'];
    const supportTalents = {
        tide: ['ice', 'return', 'water', 'vortex'],
        ember: ['burn', 'vortex', 'fire', 'bird'],
        wing: ['feather', 'bird', 'focus', 'crit'],
        jade: ['orbit', 'ward', 'bird', 'focus'],
        spear: ['ice', 'water_force', 'sword_tempo', 'vortex'],
        hammer: ['vortex', 'thunder', 'water_tempo', 'ward']
    };

    G.experienceForLevel = level => {
        if (level === 1) return 6;
        if (level === 2) return 10;
        if (level === 3) return 16;
        return 26 + level * 12;
    };

    const start = G.start;
    G.start = (...args) => {
        start(...args);
        if (!G.p) return;
        G.p.nextXp = G.experienceForLevel(1);
        G.openingEncounter = null;
    };

    function placeOpeningEnemy(enemy, angle) {
        // Spawn outside melee reach, with walking room even near an arena edge.
        // Search alternative angles after collision fitting instead of spawning on the player.
        for (let attempt = 0; attempt < 12; attempt++) {
            const direction = angle + attempt * Math.PI / 6;
            enemy.x = G.p.x + Math.cos(direction) * 350;
            enemy.y = G.p.y + Math.sin(direction) * 350;
            G.collision(enemy);
            if (G.distance(enemy, G.p) >= 285) return;
        }
    }

    G.updateOpeningSpawns = () => {
        if (G.act !== 0 || !['battle', 'elite'].includes(G.roomType)) return false;
        const node = G.currentNode;
        if (!node || G.roomDone) return true;
        if (G.openingEncounter?.node !== node) {
            G.openingEncounter = {node: node, wave: 0, nextAt: G.time + 0.8, mixed: false};
        }
        const encounter = G.openingEncounter;
        if (G.roomTime >= G.roomTarget || G.time < encounter.nextAt) return true;
        const live = G.enemies.filter(enemy => !enemy.dead);
        const mixed = G.p.level >= 2 && G.roomTime >= 11 && encounter.wave >= 6;
        const limit = G.roomType === 'elite' ? 9 : 7;
        // Do not bank missed waves: a slow clear cannot release a burst of stacked spawns.
        encounter.nextAt = G.time + (mixed ? 1.65 : 1.45);
        if (live.length >= limit) return true;
        let kinds;
        if (encounter.wave < 3) {
            kinds = [openingKinds[encounter.wave]];
        } else if (mixed) {
            kinds = encounter.wave % 2 === 0 ? ['yomotsu', 'fox'] : ['kodama', 'yomotsu'];
        } else {
            kinds = [openingKinds[encounter.wave % 3]];
        }
        if (mixed && !encounter.mixed) {
            encounter.mixed = true;
            G.toast('Pursuers are closing in. Watch where the foxfire is aimed.');
        }
        const angle = G.rng() * Math.PI * 2;
        let spawned = 0;
        for (const kind of kinds) {
            if (live.length + spawned >= limit) break;
            if (kind === 'fox' && live.filter(enemy => enemy.kind === 'fox').length >= 2) continue;
            const enemy = G.spawn(kind);
            // Paired threats use separated approaches, leaving the other half of the arena open.
            placeOpeningEnemy(enemy, angle + spawned * Math.PI * 0.65);
            G.event('opening_enemy_spawned', {
                kind: kind,
                hp: enemy.hp,
                position: [enemy.x, enemy.y],
                distance: G.distance(enemy, G.p),
                mixed: mixed
            });
            spawned++;
        }
        encounter.wave++;
    };

    // Keep the original four cards: reforge, mastery, a compatible passive, an alternative.
    // All are acquired through the existing level/chest/shop UI and passive slot rules.
    G.selectGrowth = pool => {
        const masteries = G.shuffle(pool.filter(talent => talent.mastery));
        const introductory = masteries.find(talent => talent.id === G.p.weapon + '_m0');
        const mastery = !G.rawLv(G.p.weapon + '_m0') ? introductory : masteries[0];
        const compatible = G.shuffle(pool.filter(talent =>
            supportTalents[G.p.weapon]?.includes(talent.id) || talent.needs
        ));
        const selected = [];
        if (mastery) selected.push(mastery);
        if (compatible.length) selected.push(compatible[0]);
        const remaining = G.shuffle(pool.filter(talent => !selected.includes(talent)));
        return [...selected, ...remaining].slice(0, 4);
    };

    const descriptions = {
        ice: 'Water hits slow Wet enemies by an additional 18% / 30%. Ends when Wet expires.',
        tide_m0: 'Water blades split into two narrow streams, each dealing 32% / 64% of the original projectile damage. Works with the initial R art, Water Run; excludes feathers.',
        tide_m1: 'Water hits pull lesser enemies within 140 of the impact toward it, grouping them for a sweeping slash. Bosses resist the pull.',
        tide_m2: 'Use F within 5 seconds after R to reduce that F cast’s cooldown by 30% / 45%.',
        ember_m0: 'Dashing leaves a fire patch with a radius of 90 for 2.5 seconds. It deals 14 / 28 base damage every half-second. Lure pursuers through it.',
        ember_m2: 'Fire hits on Wet targets release four steam blades, each dealing 16 / 32 base damage. Triggers every 0.7 seconds. Pairs with Eye of the Deep.',
        wing_m0: 'Each dash releases 3 / 6 homing feathers, each dealing 20 base damage.',
        wing_m1: 'Feather damage increases by 10% / 20% per 100 distance, up to 45% / 90%.',
        wing_m2: 'Casting F grants 3 / 6 orbiting feathers for 3 seconds.',
        jade_m0: 'Gain 2 / 4 extra magatama orbiting at a radius of 135. Each deals 17 base damage, at most once per target every 0.7 seconds.',
        jade_m1: 'Every 4 / 3 seconds, a jade pulse clears hostile projectiles within 125.',
        spear_m0: 'F F releases three piercing spear beams in a narrow fan, each dealing 45 / 90 base damage.',
        spear_m2: 'Spear thrusts and water hits slow targets by 30% for 1.3 / 1.8 seconds.',
        hammer_m0: 'Lightning hits arc to two nearby enemies within 200 of the impact, dealing 22 / 44 base damage each. Cooldown: 0.4 seconds.',
        hammer_m1: 'Lightning deals 25% / 50% more damage to Wet targets. Pairs with Eye of the Deep or Frost Inscription. No bonus against dry targets.'
    };
    for (const [id, text] of Object.entries(descriptions)) {
        const talent = G.talents.find(item => item.id === id);
        if (talent) talent.text = text;
    }

    const offerTalent = G.offerTalent;
    G.offerTalent = (then, context = 'level_up') => {
        // A resumed level choice gets enough time to read frozen telegraphs and move.
        offerTalent(() => {
            then();
            if (context === 'level_up' && G.state === 'running') {
                G.keys.clear();
                G.p.inv = Math.max(G.p.inv, 0.8);
            }
        }, context);
    };

    // Public observations expose only already-visible warnings and control hit areas.
    const observe = G.bridgeTarget.observe;
    G.bridgeTarget.observe = () => {
        const result = observe();
        if (result.map) {
            const map = G.chapterMaps[G.act];
            result.map = {
                act: map.act,
                revealed: Boolean(map.revealed),
                nodes: Object.fromEntries(Object.values(map.nodes).map(node => {
                    const visible = map.revealed || node.visited || G.currentNode?.links.some(link => link.to === node.id);
                    return [node.id, {
                        id: node.id,
                        x: node.x,
                        y: node.y,
                        type: visible ? node.type : 'unknown',
                        visited: Boolean(node.visited),
                        cleared: Boolean(node.cleared),
                        links: node.links.map(link => ({dir: link.dir, to: link.to}))
                    }];
                }))
            };
        }
        result.pickups = G.drops.map(drop => ({
            kind: drop.kind,
            x: drop.x,
            y: drop.y,
            radius: drop.r,
            value: ['coin', 'xp'].includes(drop.kind) ? drop.value : undefined
        }));
        result.telegraphs = G.zones.filter(zone => !zone.friend && !zone.hit).map(zone => ({
            x: zone.x,
            y: zone.y,
            radius: zone.r,
            shape: zone.kind || 'circle',
            seconds_remaining: Math.max(0, zone.delay - zone.age)
        }));
        result.controls = Array.from(document.querySelectorAll('button')).filter(button =>
            button.getClientRects().length && !button.closest('[hidden]')
        ).map((button, index) => {
            const rect = button.getBoundingClientRect();
            return {
                id: button.id || (button.dataset.choice !== undefined ? 'choice-' + button.dataset.choice : 'button-' + index),
                name: button.innerText.trim(),
                disabled: button.disabled,
                x: rect.x + rect.width / 2,
                y: rect.y + rect.height / 2,
                width: rect.width,
                height: rect.height
            };
        });
        return result;
    };
    const reset = G.bridgeTarget.reset;
    G.bridgeTarget.reset = seed => {
        if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) {
            throw new TypeError('reset(seed) requires an integer from 0 to 4294967295');
        }
        return reset(seed);
    };
})();
