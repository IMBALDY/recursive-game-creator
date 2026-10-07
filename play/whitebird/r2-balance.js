'use strict';
(() => {
    const G = WB;
    G.enemyStatScale = .8;
    const act = () => Math.max(0, Math.min(4, G.act || 0));
    G.growthCurve = [
        {rank: 1, quality: 1, weights: [.80,.20,0,0,0], health: 2.15, boss: 1.35, damage: 1, speed: 1},
        {rank: 2, quality: 2, weights: [.55,.33,.12,0,0], health: 2.25, boss: 1.50, damage: 1.06, speed: 1.02},
        {rank: 3, quality: 2, weights: [.38,.40,.22,0,0], health: 2.40, boss: 1.65, damage: 1.12, speed: 1.04},
        {rank: 4, quality: 3, weights: [.22,.38,.30,.10,0], health: 2.60, boss: 1.80, damage: 1.18, speed: 1.06},
        {rank: 6, quality: 4, weights: [.10,.25,.36,.23,.06], health: 2.80, boss: 1.95, damage: 1.25, speed: 1.08}
    ];
    G.temperLimit = () => G.growthCurve[act()].rank;
    G.canTemper = () => !!G.p && G.p.weaponLevel < G.temperLimit();
    G.chapterQuality = q => Math.min(G.growthCurve[act()].quality, Math.max(0, Number.isInteger(q) ? q : 0));
    G.rollQuality = (min = 0) => {
        let sample = G.rng();
        const weights = G.growthCurve[act()].weights;
        for (let q = 0; q < weights.length; q++) {
            sample -= weights[q];
            if (sample < 0) return G.chapterQuality(Math.max(min, q));
        }
        return G.chapterQuality(4);
    };
    G.temperDelta = q => .08 + G.qualities[G.chapterQuality(q)].bonus * .15;
    G.upgradeWeapon = (q = 0) => {
        if (!Number.isInteger(q) || q < 0 || q >= G.qualities.length) return {ok: false, reason: 'invalid_quality'};
        if (!G.canTemper()) return {ok: false, reason: 'chapter_cap'};
        q = G.chapterQuality(q);
        G.p.weaponRolls.push(G.temperDelta(q));
        G.p.weaponLevel++;
        G.p.weaponQuality = Math.max(G.p.weaponQuality, q);
        G.syncWeapon(); G.r2Sync();
        G.event('weapon_reforged', {quality:q, rank:G.p.weaponLevel, chapter:G.act, moves:G.p.skillBag.map(s=>s.id)});
        return {ok:true, type:'upgrade', rank:G.p.weaponLevel};
    };
    const talent = G.addTalent;
    G.addTalent = (id, q = G.rollQuality()) => talent(id, G.chapterQuality(q));
    // The first build decision remains early; the next levels require sustained combat.
    G.experienceForLevel = level => level === 1 ? 10 : level === 2 ? 22 : level === 3 ? 38 : 36 + level * 16;
    const spawn = G.spawn;
    G.spawn = kind => {
        const enemy = spawn(kind), curve = G.growthCurve[act()];
        enemy.hp *= curve.health * G.enemyStatScale; enemy.maxHp = enemy.hp; enemy.speed *= curve.speed;
        return enemy;
    };
    const boss = G.spawnBoss;
    G.spawnBoss = () => {
        boss();
        for (const seal of G.enemies.filter(e=>e.kind==='seal'&&!e.balanceScaled)) { seal.hp*=G.enemyStatScale;seal.maxHp=seal.hp;seal.balanceScaled=true; }
        if (G.boss) { G.boss.hp *= G.growthCurve[act()].boss * G.enemyStatScale; G.boss.maxHp = G.boss.hp; }
    };
    const hurt = G.hurt;
    G.hurt = (amount, source) => hurt(amount * G.growthCurve[act()].damage * G.enemyStatScale, source);
    // Normalize fixed-quality rewards as well as random drops. Do this before UI previews are built.
    const offer = G.offer;
    G.offer = (title, subtitle, options, then, context, skip) => offer(title, subtitle,
        options.map(o => {
            const value = Number.isInteger(o.q) ? {...o, q:G.chapterQuality(o.q)} : {...o};
            if ((o.id === 'reforge' && context === 'shop' || o.id === 'weapon' && context === 'forge') && !G.canTemper()) {
                value.disabled = true; value.text = 'Tempering limit reached for this chapter. Continue next chapter.';
            }
            return value;
        }), choice => {
            if ((choice.id === 'reforge' && context === 'shop' || choice.id === 'weapon' && context === 'forge') && !G.canTemper()) return;
            then(choice);
        }, context, skip);
})();
