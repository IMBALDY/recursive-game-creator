'use strict';
(() => {
const G=WB;
const spawn=G.spawn;G.spawn=kind=>{const e=spawn(kind);e.hp*=1.18+G.act*.04;e.maxHp=e.hp;e.speed*=1.06;e.guardFacing=e.renderFacing||1;return e;};
const boss=G.spawnBoss;G.spawnBoss=()=>{boss();G.boss.hp*=1.12;G.boss.maxHp=G.boss.hp;};
const hurt=G.hurt;G.hurt=(n,source)=>hurt(n*(1.1+G.act*.02),source);
const hit=G.hit;G.hit=(e,n,element='sword',chain=false)=>{if(!e.boss&&!e.dead){const open=e.windup>0||e.charge>0||e.animUntil>G.time;if(e.kind==='soldier'&&!open&&element!=='fire'&&element!=='thunder'&&Math.sign(G.p.x-e.x)===(e.guardFacing||1)){n*=.6;if(G.time>=(e.guardTextAt||0)){e.guardTextAt=G.time+1;G.float(e.x,e.y-60,'Blocked','#cfbd8d');}}
 if(e.kind==='crab'&&!open&&element!=='thunder')n*=.7;
 if(!chain&&G.techStage()>0){if(G.p.weapon==='spear'&&element==='water'){e.runeSlow=1.2;if(G.techStage()===2){const a=Math.atan2(e.y-G.p.y,e.x-G.p.x);e.x+=Math.cos(a)*12;e.y+=Math.sin(a)*12;}}if(G.p.weapon==='hammer'&&element==='thunder')e.inkStunUntil=G.time+.35;if(G.p.weapon==='ember'&&G.techStage()===2&&element==='fire'){e.inkBurn=3;e.inkBurnDamage=19;}}
 }hit(e,n,element,chain);};
const enemies=G.updateEnemies;G.updateEnemies=dt=>{const records=G.enemies.filter(e=>!e.boss&&!e.dead).map(e=>({e,windup:e.windup||0,x:e.x,y:e.y,charge:e.charge,ai:e.aiAt,stunned:e.inkStunUntil>G.time}));enemies(dt);for(const r of records){const e=r.e;if(e.dead)continue;if(r.stunned){e.x=r.x;e.y=r.y;e.charge=r.charge;e.aiAt=Math.max(e.aiAt,G.time+.2);}e.guardFacing=e.renderFacing||e.guardFacing;
 if(r.windup>0&&e.windup<=0){if(e.kind==='fox')G.inkQueue.push({at:G.time+.42,run:()=>{if(e.dead)return;G.casterKind='fox';for(let i=-1;i<=1;i++)G.hostileShot(e,(e.aim||0)+i*.25,150);G.casterKind=null;G.inkEffect('ember',e.x,e.y,e.aim,130,.35,0);}});if(e.kind==='thunder'){G.casterKind='thunder';G.danger(G.p.x,G.p.y,58,1.15);G.casterKind=null;}}
 }};
const update=G.update;G.update=dt=>{const spawnAt=G.spawnAt;update(dt);if(G.state==='running'&&!G.roomDone&&G.spawnAt>spawnAt&&G.spawnAt-G.time<2)G.spawnAt=G.time+(G.spawnAt-G.time)*.9;};
const clear=G.clearRoom;G.clearRoom=()=>{clear();G.doorCooldown=G.time+1.2;};
})();
