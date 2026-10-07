'use strict';
(() => {
    const G = WB;
    const trials = [
        {kind:'guardian', name:'Stonehammer Spirit', relics:['rock_rope','dawn_mirror','serpent_comb']},
        {kind:'father', name:'Edictbreaker Warrior', relics:['crow_feather','heaven_arrow','sky_boat']},
        {kind:'aragami', name:'Mountain Lord’s Spirit', relics:['hare_grass','serpent_comb','yomi_peach']},
        {kind:'sea', name:'Hashirimizu Spirit', relics:['flood_jewel','ebb_jewel','lost_hook']},
        {kind:'ibuki_heaven', name:'Serpent Throne’s Spirit', relics:['serpent_comb','heaven_arrow','dawn_mirror']}
    ];
    G.bossIsOpen = b => b && G.time >= b.openAt && G.time < b.openUntil && !(b.transitionUntil > G.time);
    // Run at the final HP mutation so direct, reaction and damage-over-time hits share the same rules.
    G.resolveBossDamage = (e, damage) => {
        if (e !== G.boss || !e.ritePhase) return damage;
        if (e.transitionUntil > G.time) return 0;
        damage *= G.bossIsOpen(e) ? 1.35 : .72;
        const floor = e.ritePhase === 1 ? e.maxHp * .619 : e.ritePhase === 2 ? e.maxHp * .279 : 0;
        return Math.min(damage, Math.max(0, e.hp - floor));
    };
    const enter = G.enterNode;
    G.enterNode = (...args) => {
        const ok = enter(...args), node = G.currentNode;
        if (!ok || node?.type !== 'elite') return ok;
        if (node.cleared) {
            if (node.rewardPending && node.trialLootAt) G.interactable = {type:'reward_chest', ...node.trialLootAt};
            return ok;
        }
        const spec = trials[Math.min(4,G.act)];
        node.trial = true; node.trialKind = spec.kind; node.trialBossKilled = false;
        G.enemies = []; G.hostile = []; G.zones = []; G.obstacles = []; G.r2Pools = [];
        G.roomType = 'boss'; G.interactable = null;
        const forced = G.forcedBoss;
        G.forcedBoss = spec.kind;
        try { G.spawnBoss(); } finally { G.forcedBoss = forced; }
        const b = G.boss;
        b.trialBoss = true; b.name = spec.name;
        b.hp *= .60; b.maxHp = b.hp;
        G.event('trial_boss_appeared', {kind:b.kind, hp:b.hp, node:node.id});
        G.toast(spec.name + ' appears'); G.persist(true);
        return ok;
    };
    const clear = G.clearRoom;
    G.clearRoom = () => {
        const node = G.currentNode;
        if (node?.trial && !node.trialBossKilled) return;
        const done = G.roomDone;
        clear();
        if (!done && G.roomDone && node?.trial) {
            G.roomType = 'elite';
            G.interactable = {type:'reward_chest', ...node.trialLootAt};
            G.exitMarker = null;
            G.event('trial_reward_dropped', {kind:node.trialKind, position:node.trialLootAt});
            G.persist(true);
        }
    };
    const interact = G.interact;
    G.interact = () => {
        const n = G.currentNode, o = G.interactable;
        if (G.state !== 'running' || !n?.trial || !n.rewardPending || o?.type !== 'reward_chest' || G.distance(G.p,o) >= 110) return interact();
        const spec = trials[Math.min(4,G.act)];
        const options = spec.relics.map(id => G.relics.find(r=>r.id===id)).filter(r=>!G.owned(r.id)||(G.p.relicRanks[r.id]||1)<3);
        const done = () => { n.rewardPending=false; G.interactable=null; G.hideModal(); G.state='running'; G.persist(true); };
        if (!options.length) {
            G.p.gold += 18; G.event('trial_reward_claimed',{node:n.id,gold:18}); G.toast('Spirit Coins +18'); done(); return;
        }
        G.offer('Boss Relic', 'Choose a relic. An owned relic gains one rank.', options.map(r=>({...r,text:G.relicText(r)})), r=>{
            if (!n.rewardPending) return;
            G.gainRelic(r.id); G.event('trial_reward_claimed',{node:n.id,relic:r.id}); done();
        }, 'trial_boss_reward');
    };
    const hud = G.updateHud;
    G.updateHud = () => {
        hud();
        if (!G.p || G.state === 'home') return;
        const b = G.boss;
        if (b) {
            const label = b.transitionUntil > G.time ? 'Shifting Phase' : G.bossIsOpen(b) ? 'Opening' : 'Poised';
            G.$('#bossName').textContent = b.name + ' · ' + label;
            G.$('#bossBar').style.background = G.bossIsOpen(b) ? '#e8c574' : '';
        }
        if (G.currentNode?.trial) G.$('#roomName').textContent = 'Wild Spirit Trial';
    };
})();
