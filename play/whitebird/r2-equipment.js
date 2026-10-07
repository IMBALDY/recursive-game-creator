
'use strict';
(() => {
    const G = WB;
    const fields = ['weapon', 'weaponLevel', 'weaponQuality', 'weaponRolls', 'attackAt'];
    G.r2MaxRank = 6;
    // A snapshot identifies delayed damage. The player carries one weapon.
    G.r2CurrentWeapon = () => G.p ? Object.fromEntries(fields.map(key => [key, G.p[key]])) : null;
    G.r2Sync = () => { if (G.p) G.p.loadout = [G.r2CurrentWeapon()]; };
    G.r2Apply = item => { for (const key of fields) G.p[key] = item[key]; G.p.techStamp = null; };
    G.r2WithWeapon = (item, run) => {
        if (!item) return run();
        const saved = G.r2CurrentWeapon();
        G.r2Apply(item);
        try { return run(); }
        finally { G.r2Apply(saved); }
    };
    const start = G.start;
    G.start = (...args) => { start(...args); if (G.p) G.r2Sync(); };
    const upgrade = G.upgradeWeapon;
    G.upgradeWeapon = (q = 0) => {
        if (!Number.isInteger(q) || q < 0 || q >= G.qualities.length) return {ok: false};
        if (G.p.weaponLevel >= 6) {
            G.p.gold += 15; G.toast('Weapon already at Rank 6. Gain 15 Spirit Coins instead.');
            return {ok: true, type: 'overflow', gold: 15};
        }
        upgrade(q); G.r2Sync();
        return {ok: true, type: 'upgrade', rank: G.p.weaponLevel};
    };
    const cast = G.castSlot;
    G.castSlot = slot => G.r2CaptureAttack(() => cast(slot));
    const attack = G.attack;
    G.attack = () => G.r2CaptureAttack(attack);
})();

(() => {
    const G = WB;
    const select = G.selectGrowth;
    const partners = {
        tide: ['thunder', 'fire', 'ice', 'vortex'], ember: ['vortex', 'bird', 'burn', 'ice'],
        wing: ['ward', 'feather', 'fire', 'bird'], jade: ['thunder', 'vortex', 'ice', 'feather'],
        spear: ['thunder', 'ice', 'fire', 'vortex'], hammer: ['vortex', 'ward', 'ice', 'thunder']
    };
    G.selectGrowth = pool => {
        const original = select(pool);
        const available = pool.filter(t => !t.mastery && G.lv(t.id) === 0 && partners[G.p.weapon]?.includes(t.id));
        const next = G.shuffle(available)[0];
        if (!next || original.includes(next)) return original;
        // Keep mastery and several alternatives; make one missing reaction ingredient obtainable.
        return [...original.slice(0, 1), next, ...original.slice(1)].slice(0, 4);
    };
})();
