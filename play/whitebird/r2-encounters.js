'use strict';
(() => {
    const G = WB;
    const distance = G.distance;
    G.r2WarningCount = except => G.enemies.filter(enemy => enemy !== except && enemy.r2Elite && !enemy.dead).reduce((sum, enemy) => sum + (enemy.r2State === 'water' ? 2 : ['aim', 'wind', 'slash'].includes(enemy.r2State) ? 1 : 0), 0) + G.zones.filter(zone => zone.r2Challenge && !zone.hit).length;
    function begin(enemy, state, duration) {
        if (['water', 'wind'].includes(state) && G.r2WarningCount(enemy) + (state === 'water' ? 2 : 1) > 2) {
            enemy.r2State = 'wait'; enemy.r2At = G.time + 0.25;
            return;
        }
        enemy.r2State = state;
        enemy.r2PoseStart = G.time;
        enemy.r2At = G.time + duration;
        enemy.aim = Math.atan2(G.p.y - enemy.y, G.p.x - enemy.x);
        enemy.targetX = G.p.x; enemy.targetY = G.p.y;
    }
    function inCorridor(enemy, point, width = 65) {
        const dx = point.x - enemy.x, dy = point.y - enemy.y;
        const forward = dx * Math.cos(enemy.aim) + dy * Math.sin(enemy.aim);
        // The visible warning is 900 units long; no invisible push past its end.
        return forward > 0 && forward < 900 + point.r && Math.abs(-dx * Math.sin(enemy.aim) + dy * Math.cos(enemy.aim)) < width + point.r;
    }
    G.r2UpdateElite = (enemy, dt) => {
        enemy.wet = Math.max(0, enemy.wet - dt);
        enemy.flash = Math.max(0, enemy.flash - dt);
        if (enemy.burn > 0) {
            enemy.burn -= dt;
            if (G.time >= (enemy.r2BurnAt || 0)) {
                enemy.r2BurnAt = G.time + 0.5;
                G.hit(enemy, 3.5 * G.lv('burn'), 'burn', true);
                if (enemy.dead) return;
            }
        }
        if (enemy.r2State === 'charge') {
            enemy.x += Math.cos(enemy.aim) * 440 * dt * (1 - G.r2SteamSlow(enemy));
            enemy.y += Math.sin(enemy.aim) * 440 * dt * (1 - G.r2SteamSlow(enemy));
            G.collision(enemy);
            if (distance(enemy, G.p) < enemy.r + G.p.r) G.hurt(22, 'kappa_charge');
            if (enemy.x <= 85 || enemy.x >= 1355 || enemy.y <= 180 || enemy.y >= 775 || G.time >= enemy.r2At) begin(enemy, 'exposed', 1.2);
            return;
        }
        if (G.time < enemy.r2At) return;
        switch (enemy.r2State) {
            case 'wait':
            case 'exposed':
                begin(enemy, enemy.r2Elite === 'kappa' ? 'water' : 'wind', 1.1);
                break;
            case 'water':
                for (const offset of [-120, 120]) G.r2Pools.push({x: G.clamp(enemy.targetX + offset, 200, 1240), y: G.clamp(enemy.targetY, 250, 680), r: 72, until: G.time + 5});
                begin(enemy, 'aim', 0.9);
                break;
            case 'aim':
                enemy.r2State = 'charge'; enemy.r2PoseStart = G.time; enemy.r2At = G.time + 2.5;
                break;
            case 'wind':
                if (inCorridor(enemy, G.p)) {
                    const sign = enemy.r2WindSign || 1;
                    G.p.x -= Math.sin(enemy.aim) * 105 * sign;
                    G.p.y += Math.cos(enemy.aim) * 105 * sign;
                    G.collision(G.p);
                }
                enemy.r2WindSign = -(enemy.r2WindSign || 1);
                if (G.r2N >= 6 && !enemy.r2SecondWind) {
                    enemy.r2SecondWind = true;
                    begin(enemy, 'wind', 1.1);
                    enemy.aim += Math.PI / 2;
                } else {
                    enemy.r2SecondWind = false;
                    begin(enemy, 'slash', 0.9);
                }
                break;
            case 'slash': {
                const angle = Math.atan2(G.p.y - enemy.y, G.p.x - enemy.x);
                const delta = Math.abs(Math.atan2(Math.sin(angle - enemy.aim), Math.cos(angle - enemy.aim)));
                if (distance(enemy, G.p) < 220 + G.p.r && delta < 1.1) G.hurt(25, 'tengu_slash');
                G.inkEffect('wing', enemy.x, enemy.y, enemy.aim, 300, 0.45);
                begin(enemy, 'exposed', 1);
                break;
            }
        }
    };
    const enemies = G.updateEnemies;
    G.updateEnemies = dt => {
        const elites = G.enemies.filter(enemy => enemy.r2Elite && !enemy.dead);
        G.enemies = G.enemies.filter(enemy => !enemy.r2Elite);
        enemies(dt);
        G.enemies.push(...elites.filter(enemy => !enemy.dead));
        for (const enemy of elites) if (!enemy.dead) G.r2UpdateElite(enemy, dt);
    };
    const hit = G.hit;
    G.hit = (enemy, amount, element, chain, metadata) => hit(enemy, amount * (enemy?.r2State === 'exposed' ? 1.2 : 1), element, chain, metadata);
    function addFormation(kinds) {
        for (let i = 0; i < kinds.length; i++) {
            const enemy = G.spawn(kinds[i]);
            enemy.x = i % 2 ? 1150 : 300;
            enemy.y = kinds[i] === 'fox' || kinds[i] === 'thunder' ? 270 : 490;
            G.collision(enemy);
        }
    }
    G.r2UpdateChallenge = () => {
        const level = G.r2N || 0, encounter = G.r2Encounter;
        if (!encounter || G.roomDone || !['battle', 'elite', 'boss'].includes(G.roomType)) return;
        if (level >= 14 && G.boss && G.boss.ritePhase > encounter.phase) {
            encounter.phase = G.boss.ritePhase;
            addFormation(['fox', 'soldier']);
            G.toast('Flanking enemies have appeared. Take them down first.');
        }
        if (G.roomType === 'boss') return;
        if (G.time >= encounter.next && encounter.wave < 2 && G.roomTime < G.roomTarget) {
            encounter.next = G.time + 8;
            encounter.wave++;
            if ([2, 4].includes(level)) addFormation(encounter.wave === 1 ? ['soldier'] : ['fox']);
            if (level === 7) {
                if (encounter.wave === 1) G.r2Pools.push({x: 480, y: 420, r: 90, until: G.time + 9});
                else addFormation(['soldier', 'boar']);
            }
            if (level === 9) addFormation(encounter.wave === 1 ? ['soldier', 'boar'] : ['fox', 'thunder']);
            if (level === 1 && encounter.wave === 2) addFormation(['yomotsu']);
        }
        if ([3, 8, 12, 15].includes(level) && G.time >= encounter.hazard) {
            encounter.hazard = G.time + 6;
            const side = Math.floor(G.roomTime / 6) % 2 ? 420 : 1020;
            if (level === 12) G.r2Pools.push({x: side, y: 450, r: 85, until: G.time + 4});
            // Only two added warnings, both outside the central 400-unit safe lane.
            if (G.r2WarningCount() < 2) {
                G.danger(side, 390, 85, 1.5); G.zones.at(-1).r2Challenge = true;
                if (level === 8 && G.currentNode?.r2Risk && G.r2WarningCount() < 2) { G.danger(1440 - side, 590, 85, 1.8); G.zones.at(-1).r2Challenge = true; }
            }
        }
        if ((level === 13 || level === 15) && encounter.summons < 2) {
            const carrier = G.enemies.find(enemy => enemy.r2Elite && !enemy.dead);
            if (carrier && !carrier.r2SummonAt) carrier.r2SummonAt = G.time + 2;
            if (carrier && G.time >= carrier.r2SummonAt) {
                addFormation(['yomotsu', 'fox']);
                encounter.summons++;
                carrier.r2SummonAt = G.time + 7;
                G.toast('A talisman bearer is summoning reinforcements. Defeat it to stop further summons.');
            }
        }
    };
    const update = G.update;
    G.update = dt => {
        if (G.state !== 'running' || document.hidden) return;
        const speed = G.p.speed;
        if (G.r2Pools.some(pool => pool.until > G.time && distance(pool, G.p) < pool.r)) G.p.speed *= 0.72;
        update(dt);
        G.p.speed = speed;
        if (G.state !== 'running') return;
        G.r2Pools = G.r2Pools.filter(pool => pool.until > G.time);
        G.r2UpdateChallenge();
    };
    // Supplied portraits face left. Feet stay on the same ground anchor as the
    // original actors; transforms affect presentation, never collision or range.
    G.r2DrawElite = (ctx, enemy, deathSprite = false) => {
        if (!enemy.r2Elite) return false;
        const kappa = enemy.r2Elite === 'kappa';
        const image = G.images[kappa ? 'r2_kappa_elite' : 'r2_tengu_elite'];
        if (!image) return true; // These files are part of the startup preload.
        const height = kappa ? 112 : 154;
        const width = height * image.width / image.height;
        const state = enemy.r2State;
        const elapsed = Math.max(0, G.time - (enemy.r2PoseStart || 0));
        const winding = ['water', 'aim', 'wind', 'slash'].includes(state);
        const facingRight = state === 'wait' || state === 'exposed'
            ? G.p.x > enemy.x : Math.cos(enemy.aim) > 0;
        const facing = facingRight ? -1 : 1;
        const pulse = Math.sin(G.time * 3 + enemy.x) * 0.012;
        let lean = pulse, squash = 1;
        if (winding) {
            const progress = Math.min(1, elapsed / (state === 'aim' || state === 'slash' ? 0.9 : 1.1));
            lean = 0.04 + progress * 0.09;
            squash = 1 - progress * (kappa ? 0.1 : 0.04);
        } else if (state === 'charge') {
            lean = -0.19;
            squash = 0.94 + Math.sin(elapsed * 30) * 0.025;
        } else if (state === 'exposed') {
            lean = -0.12 * Math.max(0, 1 - elapsed / 0.4);
            squash = 0.94 + Math.min(1, elapsed / 0.6) * 0.06;
        }
        ctx.save();
        ctx.translate(enemy.x, enemy.y);
        if (!enemy.dead && !deathSprite) {
            ctx.fillStyle = '#03101890';
            ctx.beginPath(); ctx.ellipse(0, 8, enemy.r * 1.2, enemy.r * 0.38, 0, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = state === 'exposed' ? '#f4dda0' : '#bfa57588';
            ctx.lineWidth = state === 'exposed' ? 3 : 1.5;
            ctx.beginPath(); ctx.ellipse(0, 6, enemy.r + 4, 11, 0, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.save();
        ctx.translate(0, 12);
        ctx.scale(facing, squash);
        ctx.rotate(lean);
        if (enemy.flash > 0) { ctx.filter = 'brightness(1.65)'; ctx.translate(3, 0); }
        // Tengu's wings extend right of its feet in the source; center its stance.
        ctx.drawImage(image, -width * (kappa ? 0.52 : 0.45), -height, width, height);
        ctx.restore();
        if (!enemy.dead && !deathSprite) {
            ctx.fillStyle = '#17242c'; ctx.fillRect(-36, -height - 9, 72, 6);
            ctx.fillStyle = '#c9b881'; ctx.fillRect(-36, -height - 9, 72 * Math.max(0, enemy.hp / enemy.maxHp), 6);
            ctx.textAlign = 'center'; ctx.font = '16px "Whitebird Sans"'; ctx.fillStyle = '#f0dfb5';
            ctx.fillText(kappa ? 'Kappa' : 'Karasu Tengu', 0, -height - 18);
            if (state === 'exposed') ctx.fillText('Opening · Damage +20%', 0, 35);
            if (enemy.r2SummonAt > G.time && enemy.r2SummonAt - G.time <= 2) ctx.fillText('Summon ' + (enemy.r2SummonAt - G.time).toFixed(1), 0, -height - 40);
        }
        ctx.restore();
        return true;
    };
    const draw = G.drawPaintedFx;
    G.drawPaintedFx = ctx => {
        draw(ctx);
        ctx.save();
        ctx.lineWidth = 3; ctx.font = '17px "Whitebird Sans"'; ctx.textAlign = 'center';
        if (G.currentNode?.r2Inari && !G.r2InariUsed && !G.currentNode.cleared && G.interactable) {
            const image = G.images.r2_inari_event;
            if (image) {
                const height = 158, width = height * image.width / image.height;
                ctx.save();
                ctx.globalAlpha = Math.min(1, G.roomTime / 0.5);
                ctx.drawImage(image, G.interactable.x + 75 - width / 2, G.interactable.y + 10 - height, width, height);
                ctx.restore();
            }
        }
        for (const pool of G.r2Pools) {
            ctx.fillStyle = '#80afb63a'; ctx.strokeStyle = '#a8c6c4';
            ctx.beginPath(); ctx.arc(pool.x, pool.y, pool.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.fillStyle = '#e2e5d9'; ctx.fillText('Flooded Ground · Slow', pool.x, pool.y);
        }
        for (const area of G.r2Areas) {
            ctx.strokeStyle = area.kind === 'steam' ? '#e3e0c9' : '#ce8b63'; ctx.fillStyle = area.kind === 'steam' ? '#e3e0c938' : '#ce8b6340';
            ctx.save(); ctx.translate(area.x, area.y);
            if (area.kind === 'steam') { ctx.beginPath(); ctx.arc(0, 0, area.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
            else { ctx.rotate(Math.atan2(area.direction.y, area.direction.x)); ctx.fillRect(-160, -30, 180, 60); ctx.strokeRect(-160, -30, 180, 60); }
            ctx.restore(); ctx.fillStyle = '#e9debc'; ctx.fillText((area.kind === 'steam' ? 'Steam ' : 'Fire Trail ') + Math.max(0, area.until - G.time).toFixed(1), area.x, area.y - 15);
        }
        for (const enemy of G.enemies) {
            if (enemy.wet > 0) { ctx.strokeStyle = '#a5d9df'; ctx.beginPath(); ctx.arc(enemy.x, enemy.y - 70, 8, 0, Math.PI * 2); ctx.stroke(); }
            if (!enemy.r2Elite || !['water', 'aim', 'wind', 'slash'].includes(enemy.r2State)) continue;
            ctx.strokeStyle = enemy.r2State === 'wind' ? '#bfd7cb' : '#e1a484'; ctx.fillStyle = '#dfab7b25';
            ctx.save(); ctx.translate(enemy.x, enemy.y); ctx.rotate(enemy.aim);
            if (enemy.r2State === 'aim' || enemy.r2State === 'wind') {
                ctx.fillRect(0, -65, 900, 130); ctx.strokeRect(0, -65, 900, 130);
                for (let x = 100; x < 850; x += 150) {
                    ctx.beginPath();
                    if (enemy.r2State === 'wind') {
                        // Push is perpendicular to the corridor, matching its real displacement.
                        const sign = enemy.r2WindSign || 1;
                        ctx.moveTo(x, -28 * sign); ctx.lineTo(x, 28 * sign);
                        ctx.moveTo(x - 12, 12 * sign); ctx.lineTo(x, 28 * sign); ctx.lineTo(x + 12, 12 * sign);
                    } else {
                        ctx.moveTo(x - 20, -15); ctx.lineTo(x, 0); ctx.lineTo(x - 20, 15);
                    }
                    ctx.stroke();
                }
            } else if (enemy.r2State === 'slash') { ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 220, -1.1, 1.1); ctx.closePath(); ctx.fill(); ctx.stroke(); }
            ctx.restore();
            if (enemy.r2State === 'water') for (const offset of [-120, 120]) { ctx.beginPath(); ctx.arc(G.clamp(enemy.targetX + offset, 200, 1240), G.clamp(enemy.targetY, 250, 680), 72, 0, Math.PI * 2); ctx.stroke(); }
            ctx.fillStyle = '#f0dfb5'; ctx.fillText(({water: 'Ripples', aim: 'Charge', wind: 'Crosswind', slash: 'Sweeping Slash'}[enemy.r2State]) + ' ' + Math.max(0, enemy.r2At - G.time).toFixed(1), enemy.x, enemy.y + 55);
        }
        if (G.p.r2ChargedUntil > G.time) { ctx.fillStyle = '#ecdb9b'; ctx.fillText('ϟ Stormward ' + (G.p.r2ChargedUntil - G.time).toFixed(1), G.p.x, G.p.y - 105); }
        ctx.restore();
    };
})();
