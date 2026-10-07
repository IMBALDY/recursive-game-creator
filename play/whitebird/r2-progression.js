'use strict';
(() => {
    const G = WB;
    const key = 'whitebird.r2.local.en.v1';
    const finite = n => Number.isFinite(n) && n >= 0;
    G.r2StorageStatus = '';
    G.r2NormalizeSave = (raw, legacy = []) => {
        const value = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
        const cleared = Array.isArray(value.cleared) ? [...new Set(value.cleared.filter(n => Number.isInteger(n) && n >= 0 && n <= 15))].sort((a, b) => a - b) : [];
        if (legacy.some(record => record?.status === 'victory') && !cleared.includes(0)) cleared.unshift(0);
        // Reject forged gaps in progression while retaining unrelated fields and collections.
        let unlocked = 0;
        while (cleared.includes(unlocked) && unlocked < 15) unlocked++;
        const validClears = cleared.filter(n => n <= unlocked);
        const rows = Array.isArray(value.runs) ? value.runs.filter(row => row && typeof row.id === 'string' && typeof row.version === 'string' && Number.isInteger(row.n) && row.n >= 0 && row.n <= 15 && ['victory', 'defeat'].includes(row.result) && finite(row.seconds) && finite(row.damage) && Number.isInteger(row.kills) && row.kills >= 0 && Number.isInteger(row.chapters) && row.chapters >= 0 && row.chapters <= 5 && Array.isArray(row.weapons) && row.weapons.every(item => item && G.weaponOrder.includes(item.id) && Number.isInteger(item.rank) && item.rank >= 0 && item.rank <= 6 && Number.isInteger(item.quality) && item.quality >= 0 && item.quality <= 4)) : [];
        return {...value, cleared: validClears, selected: Number.isInteger(value.selected) && value.selected >= 0 && value.selected <= unlocked ? value.selected : 0, runs: rows.filter((row, i) => rows.findIndex(other => other.id === row.id) === i).map(row => { const parts = G.r2Score(row); return {...row, parts: parts, score: Object.values(parts).reduce((sum, value) => sum + value, 0)}; })};
    };
    G.r2Load = () => {
        try { G.r2Save = G.r2NormalizeSave(JSON.parse(localStorage.getItem(key) || '{}'), G.records); }
        catch { G.r2Save = G.r2NormalizeSave({}, G.records); G.r2StorageStatus = 'Local run history could not be loaded. You can still play.'; }
    };
    G.r2SaveLocal = () => {
        try { localStorage.setItem(key, JSON.stringify(G.r2Save)); G.r2StorageStatus = 'Saved locally'; return true; }
        catch { G.r2StorageStatus = 'Local storage is unavailable. Run history will remain on this page for now.'; G.notice(G.r2StorageStatus); return false; }
    };
    G.r2Unlocked = () => {
        let level = 0;
        while (G.r2Save.cleared.includes(level) && level < 15) level++;
        return level;
    };
    G.r2SelectDifficulty = n => {
        if (!Number.isInteger(n) || n < 0 || n > G.r2Unlocked()) return {ok: false, reason: 'difficulty_locked'};
        G.r2Save.selected = n;
        G.r2SaveLocal();
        return {ok: true, difficulty: n};
    };
    G.r2Score = row => ({
        chapters: row.chapters * 10000,
        kills: row.kills * 100,
        damage: Math.floor(row.damage / 10),
        speed: row.result === 'victory' ? Math.max(0, 3000 - Math.floor(row.seconds)) : 0
    });
    G.r2Commit = result => {
        if (!G.r2Run || !['victory', 'defeat'].includes(result)) return false;
        if (G.r2Save.runs.some(row => row.id === G.r2Run.id)) return false;
        G.r2Sync();
        const row = {...G.r2Run, result: result, chapters: result === 'victory' ? 5 : Math.min(5, G.act), kills: G.kills,
            weapons: G.p.loadout.filter(Boolean).map(item => ({id: item.weapon, rank: item.weaponLevel, quality: item.weaponQuality}))};
        row.parts = G.r2Score(row);
        row.score = Object.values(row.parts).reduce((sum, value) => sum + value, 0);
        G.r2Save.runs.push(row);
        if (result === 'victory' && row.n <= G.r2Unlocked() && !G.r2Save.cleared.includes(row.n)) G.r2Save.cleared.push(row.n);
        G.r2SaveLocal();
        return true;
    };
    G.r2Load();
    const start = G.start;
    G.start = (...args) => {
        if (!G.ready) return;
        start(...args);
        G.r2Run = {id: G.session.session_id, version: WHITEBIRD_BUILD.version, baseDifficulty: 'Standard', n: G.r2Save.selected, seconds: 0, damage: 0};
        G.r2N = G.r2Run.n;
        G.r2Areas = [];
        G.r2Encounter = null;
        G.r2Pools = [];
        G.r2InariUsed = false;
        G.r2FirstElites = new Set();
    };
    const finish = G.finish;
    G.finish = result => { if (!G.ended) G.r2Commit(result); finish(result); };
    G.r2DifficultyRules = [
        'Standard rules with all five chapters and paths', 'Alternating elite and melee threats', 'Melee frontline with ranged support', 'Intermittent hazards with a safe central passage', 'Staggered kappa charges and ranged volleys',
        'Kappa encounters with flooded ground', 'Alternating tengu crosswinds', 'Flooded ground followed by mobile melee waves', 'Optional risk rooms: overlapping warnings in exchange for an upgrade', 'Separate melee and ranged waves',
        'Karasu tengu encounters', 'Choose between rest and elite reward routes', 'Flooded ground with delayed lightning', 'Elites summon after a 2-second windup, at most twice per room', 'Boss phase transitions add destructible flanking threats', 'Five-chapter challenge with final-boss flanking threats'
    ];
    G.r2NodeName = node => node?.r2Risk ? 'Risk Trial' : node?.r2Inari ? 'Inari’s Grain' : G.roomNames[node?.type];
    const makeMap = G.makeMap;
    G.makeMap = act => {
        const map = makeMap(act);
        const nodes = Object.values(map.nodes);
        if (act === 2) {
            const camp = nodes.find(node => node.type === 'camp');
            if (camp) camp.r2Inari = true;
        }
        if (G.r2N === 8 || G.r2N === 11) {
            const node = nodes.find(node => node.type === 'treasure');
            if (node) { node.type = 'elite'; node.r2Risk = true; }
        }
        return map;
    };
    const spawn = G.spawn;
    G.spawn = kind => {
        const enemy = spawn(kind);
        const level = G.r2N || 0;
        enemy.hp *= 1 + Math.min(0.25, level * 0.015);
        enemy.maxHp = enemy.hp;
        enemy.speed *= 1 + Math.min(0.15, level * 0.01);
        return enemy;
    };
    G.r2SpawnElite = kind => {
        if (G.enemies.filter(enemy => enemy.r2Elite && !enemy.dead).length >= 2) return null;
        const enemy = G.spawn(kind === 'kappa' ? 'crab' : 'soldier');
        enemy.r2Elite = kind;
        enemy.name = kind === 'kappa' ? 'Kappa · Water-Bowl Keeper' : 'Karasu Tengu · Windway Wanderer';
        enemy.hp *= 1.65;
        enemy.maxHp = enemy.hp;
        enemy.r = kind === 'kappa' ? 27 : 25;
        enemy.speed = kind === 'kappa' ? 65 : 80;
        enemy.r2State = 'wait'; enemy.r2At = G.time + 1.4;
        enemy.x = 1050; enemy.y = 330;
        G.collision(enemy);
        G.toast(enemy.name + ': watch ground warnings and recovery openings');
        return enemy;
    };
    const enter = G.enterNode;
    G.enterNode = (...args) => {
        const ok = enter(...args);
        if (!ok) return ok;
        G.r2Pools = [];
        G.r2Encounter = {wave: 0, next: G.time + 3, hazard: G.time + 5, summons: 0, phase: 1};
        const node = G.currentNode;
        if (!node.cleared && ['battle', 'elite'].includes(node.type)) {
            let elite = null;
            if (G.act === 1 && !G.r2FirstElites.has('kappa')) elite = 'kappa';
            if (G.act === 3 && !G.r2FirstElites.has('tengu')) elite = 'tengu';
            if (!elite && node.type === 'elite' && G.r2N >= 1) elite = G.r2N >= 6 && G.r2N !== 7 ? 'tengu' : 'kappa';
            if (G.r2N === 15) elite = G.act % 2 ? 'tengu' : 'kappa';
            if (elite) { G.r2SpawnElite(elite); G.r2FirstElites.add(elite); }
        }
        return ok;
    };
    const interact = G.interact;
    G.interact = () => {
        const node = G.currentNode;
        if (G.state === 'running' && node?.r2Inari && !node.cleared && !G.r2InariUsed && G.interactable && G.distance(G.p, G.interactable) < 110) {
            G.r2Inari(); return;
        }
        interact();
    };
    G.r2Inari = () => {
        if (G.r2InariUsed) return;
        G.dialogue('Inari · Original Adaptation', 'r2_inari_event', ['Save a handful of grain for those who return. Would you rest, or sharpen your blade?', 'Let me continue with the choice I make today.'], () => {
            const options = [{id: 'heal', name: 'Rest and Eat', icon: 9, disabled: G.p.hp >= G.p.maxHp, text: 'Restore 20% of maximum HP. Unavailable at full health.'}];
            G.r2Sync();
            G.p.loadout.forEach((item, slot) => { if (item) options.push({id: 'temper' + slot, name: 'Temper Weapon', icon: G.weapons.find(w => w.id === item.weapon).icon, iconSet: 'weapons', disabled: !G.canTemper(), text: G.weapons.find(w => w.id === item.weapon).name + ', ' + item.weaponLevel + ' → ' + (item.weaponLevel + 1) + '  rank(s).'}); });
            G.offer('Inari’s Grain', 'Claim once per run.', options, choice => {
                if (G.r2InariUsed) return;
                G.r2InariUsed = true;
                if (choice.id === 'heal') { const before = G.p.hp; G.p.hp = Math.min(G.p.maxHp, G.p.hp + G.p.maxHp * 0.2); G.toast('HP +' + (G.p.hp - before).toFixed(1)); }
                else { G.upgradeWeapon(0); G.toast('Weapon Rank +1'); }
                G.completeSupport();
            }, 'r2_inari', G.completeSupport);
        });
    };
    const clear = G.clearRoom;
    G.clearRoom = () => {
        const done = G.roomDone;
        clear();
        if (!done && G.roomDone && !G.currentNode?.trial && G.currentNode?.r2Risk && !G.currentNode.r2RiskReward) {
            G.currentNode.r2RiskReward = true;
            G.offerTalent(() => { G.hideModal(); G.state = 'running'; }, 'r2_risk_reward');
        }
    };
})();
