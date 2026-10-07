'use strict';
(() => {
    const G = WB, $ = G.$;
    const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[char]));
    const name = item => G.weapons.find(weapon => weapon.id === item?.weapon)?.name || 'Unequipped';
    const resume = previous => { G.hideModal(); G.state = previous; };
    G.r2ComboHTML = () => '<h2>Reactions</h2><p>Weapons and equipped passives provide the required elements. Water hits and Frost Inscription apply Wet. Lightning and fire consume Wet; Quench extinguishes burns.</p>' + G.r2ComboSpecs.map(spec => {
            const combo = G.r2Combo(spec[0]);
            const labels = {water: 'Wet: water hits, Eye of the Deep or Frost Inscription', thunder: 'Lightning: Thunderchain or War Hammer', fire: 'Fire hits: Wildfire Rite or Wildfire Blade', burn: 'Burn: Ember Inscription, Undying Flint or Blazing Feathers', bird: 'Feathers: Feather Bow or Thousand Feathers', wind: 'Dash enhancement: Featherstep or Fleetfoot', guard: 'Protection: Spirit Jade, Mirror Ward or Foam Guard', frost: 'Frostbind passive'};
            const missing = spec[2].filter(tag => !G.r2Tags().has(tag)).map(tag => labels[tag]).join('; ');
            return '<article><h3>' + combo.name + ' · ' + (combo.active ? 'Available · ' + combo.tier + '  Rank' : 'Missing requirements') + '</h3><p>' + combo.text + '</p>' + (missing ? '<p class="r2-missing">Add: ' + missing + '</p>' : '') + '<small>' + (combo.next ? 'Temper the weapon by ' + combo.next + '  more ranks to improve this reaction'  : 'Combination at maximum rank') + '; triggers this run: ' + (G.p.reactionCounts?.[spec[0]] || 0) + ' ; cooldown:' + Math.max(0, (G.p.comboAt?.[spec[0]] || 0) - G.time).toFixed(1) + '  s</small></article>';
        }).join('');
    G.r2ShowDifficulty = () => {
        G.modal('<h2>Journey Ascension</h2><p>Clear Standard to unlock N1. Clearing a tier unlocks the next one. Every tier includes all five chapters.</p><div class="r2-levels">' + G.r2DifficultyRules.map((rule, n) => '<button id="r2Difficulty' + n + '" data-r2-level="' + n + '" ' + (n > G.r2Unlocked() ? 'disabled' : '') + '><b>' + (n ? 'N' + n : 'Standard N0') + (G.r2Save.selected === n ? ' ✓' : '') + '</b><span>' + rule + '</span><small>' + (n > G.r2Unlocked() ? 'Clear ' + (n === 1 ? 'Standard' : 'N' + (n - 1)) + '  to unlock' : G.r2Save.cleared.includes(n) ? 'Cleared · Replay available' : 'Unlocked') + '</small></button>').join('') + '</div><p>N5  unlocks Inari’s Grain; N10 unlocks Kappa; N15 unlocks Karasu Tengu and the epilogue. Lesser enemy HP scales up to ×1.225 and movement speed up to ×1.15.</p><button id="r2DifficultyClose">Back</button>', 'r2-panel');
        $('#overlay').classList.remove('battle-dock');
        document.querySelectorAll('[data-r2-level]').forEach(button => button.onclick = () => { G.r2SelectDifficulty(Number(button.dataset.r2Level)); G.r2ShowDifficulty(); });
        $('#r2DifficultyClose').onclick = G.hideModal;
    };
    G.r2ShowLedger = (n = G.r2Save.selected, sort = 'score') => {
        const rows = G.r2Save.runs.filter(row => row.n === n).slice().sort((a, b) => sort === 'seconds' ? a.seconds - b.seconds : (b[sort] || 0) - (a[sort] || 0));
        const group = result => '<h3>' + (result === 'victory' ? 'Victory' : 'Defeat') + '</h3>' + (rows.filter(row => row.result === result).map(row => '<article><b>' + row.score + '  points · ' + row.seconds.toFixed(1) + '  sec · Actual damage ' + row.damage.toFixed(1) + '</b><p>' + row.kills + '  kills; ' + row.weapons.map(item => escape(G.weapons.find(w => w.id === item.id)?.name || item.id) + ' +' + item.rank).join(' / ') + '</p><small>Chapters ' + row.parts.chapters + ' + Kills ' + row.parts.kills + ' + Damage ' + row.parts.damage + ' + Speed ' + row.parts.speed + '<br>' + escape(row.version) + '<br>Run ID ' + escape(row.id) + '</small></article>').join('') || '<p>No runs recorded</p>');
        G.modal('<h2>Local Leaderboard</h2><p>Chapters cleared × 10000 + kills × 100 + floor(actual damage ÷ 10) + victory speed bonus max(0, 3000 − floor(active seconds)). Pauses, dialogue, shops and choices do not count toward time.</p><label>Difficulty <select id="r2LedgerLevel">' + G.r2DifficultyRules.map((_, index) => '<option value="' + index + '" ' + (index === n ? 'selected' : '') + '>N' + index + '</option>').join('') + '</select></label><label>Sort by <select id="r2LedgerSort">' + [['score', 'Score'], ['seconds', 'Active Time'], ['damage', 'Actual Damage']].map(([key, label]) => '<option value="' + key + '" ' + (key === sort ? 'selected' : '') + '>' + label + '</option>').join('') + '</select></label>' + group('victory') + group('defeat') + '<p>Older runs remain in the Run Journal. Damage and score were not recorded for those runs.</p><p>' + escape(G.r2StorageStatus) + '</p><button id="r2LedgerClose">Back</button>', 'r2-panel');
        $('#overlay').classList.remove('battle-dock');
        $('#r2LedgerLevel').onchange = event => G.r2ShowLedger(Number(event.target.value), sort);
        $('#r2LedgerSort').onchange = event => G.r2ShowLedger(n, event.target.value);
        $('#r2LedgerClose').onclick = () => G.state === 'result' ? G.uiResult() : G.hideModal();
    };
    G.r2ShowCollection = () => {
        const entries = [[5, 'Inari’s Grain', 'You have passed five trials, yet still leave grain for those who follow.', 'inari_event'], [10, 'The Kappa’s Water Bowl', 'When its bowl ran dry, the kappa stopped the chase. You left water by the shore.', 'kappa_elite'], [15, 'At the End of the Windway', 'The karasu tengu folds its feather fan. The road home finally bears your own name.', 'tengu_elite']];
        G.modal('<h2>Journey Archive · Original Adaptation</h2><div class="r2-columns">' + entries.map(([n, title, text, asset]) => '<article><h3>' + title + '</h3>' + (G.r2Save.cleared.includes(n) ? '<img class="r2-collection-art" src="assets/r2_' + asset + '.png" alt="' + title + '"><p>' + text + '</p>' : '<p>Clear N' + n + '  to unlock</p>') + '</article>').join('') + '</div><button id="r2CollectionClose">Back</button>', 'r2-panel');
        $('#overlay').classList.remove('battle-dock'); $('#r2CollectionClose').onclick = () => G.state === 'result' ? G.uiResult() : G.hideModal();
    };
    document.querySelector('.home-actions').insertAdjacentHTML('beforeend', '<button id="r2Difficulty">Ascension</button><button id="r2Ledger">Leaderboard</button><button id="r2Collection">Journey Archive</button>');
    $('#r2Difficulty').onclick = G.r2ShowDifficulty; $('#r2Ledger').onclick = () => G.r2ShowLedger(); $('#r2Collection').onclick = G.r2ShowCollection;
    const hud = G.updateHud;
    G.updateHud = () => {
        hud(); if (!G.p?.loadout) return;
        G.r2Sync();
        if (G.currentNode?.r2Inari && !G.currentNode.cleared) $('#interactHint').textContent = 'Approach the offering table. E · Inari’s Grain';
        $('#runStamp').textContent = WHITEBIRD_BUILD.version + ' · N' + (G.r2N || 0);
    };
    const result = G.uiResult;
    G.uiResult = () => {
        result();
        $('#modal').insertAdjacentHTML('beforeend', '<div class="r2-result-links"><button id="r2ResultLedger">This Run and Leaderboard</button><button id="r2ResultCollection">Journey Archive</button><span>N' + (G.r2N || 0) + ' · ' + G.r2StorageStatus + '</span></div>');
        $('#r2ResultLedger').onclick = () => G.r2ShowLedger(G.r2N); $('#r2ResultCollection').onclick = G.r2ShowCollection;
    };
    const observe = G.bridgeTarget.observe;
    G.bridgeTarget.observe = () => {
        const value = observe();
        value.difficulty = G.r2N || 0;
        value.loadout = G.p?.loadout?.map(item => item ? {weapon: item.weapon, rank: item.weaponLevel, quality: item.weaponQuality} : null) || [];
        value.combinations = G.p ? G.r2ComboSpecs.map(spec => G.r2Combo(spec[0])) : [];
        value.elite_warnings = G.enemies.filter(enemy => enemy.r2Elite).map(enemy => ({id: enemy.id, name: enemy.name, state: enemy.r2State, seconds: Math.max(0, enemy.r2At - G.time), direction: enemy.aim}));
        return value;
    };
})();
