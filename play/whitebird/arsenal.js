'use strict';
(() => {
const G=WB,d=G.distance;
const forms=[
 ['tide','Kusanagi · Tides','Tide','fan','Fire a fan of piercing water blades that apply Wet.'],['ember','Flint · Wildfire','Flame','short','Fast melee fire slashes with short-range flame blades.'],['wing','Whitebird · Feather Bow','Feather','seek','Two feather blades seek the nearest enemy.'],
 ['jade','Yasakani · Magatama','Tide','jade','Three magatama orbit you and periodically release six rays of light.'],['mirror','Yata · Sacred Mirror','Ward','pulse','The mirror pulses against nearby enemies. Stay close and keep moving.'],['spear','Amanonuhoko · Spear','Tide','lance','A fast, long-range piercing thrust that hits hard along a narrow line.'],
 ['hammer','Thunder · War Hammer','Thunder','thunder','Lightning strikes the target and nearby enemies.'],['talisman','Heavenly Edict · Talismans','Spirit','swarm','Three slow homing talismans approach the target from different angles.'],['comb','Hashirimizu · Comb','Tide','comb','Crossing water blades with periodic healing.'],
 ['shaku','Imperial Command · Broken Scepter','Sword','beam','A brief beam of imperial light pierces the entire corridor.'],['flute','Tokoyo · Flute','Feather','radial','Sound waves spread in eight directions to clear surrounding enemies.'],['divine','Ame-no-Murakumo · Awakening','Sword','heavy','Slow, powerful sweeping slashes supported by heavy sword waves.']
];
G.weapons=forms.map(([id,name,family,pattern,text],i)=>({id,name,family,pattern,text,icon:i,iconSet:'weapons',tag:family+' / '+({fan:'Fan',short:'Fire Slash',seek:'Homing',jade:'Orbit',pulse:'Pulse',lance:'Piercing',thunder:'Lightning',swarm:'Talisman',comb:'Sustain',beam:'Edict Beam',radial:'Eight-Way',heavy:'Heavy Slash'}[pattern]),color:'#aadbd4',tags:[pattern,family],effect:{weapon:id}}));
const runes=[
 ['echo','Echo','Repeat projectiles after 0.18 s. Non-projectile damage gains an extra 25% hit.'],['split','Split','Split projectiles into two extra streams at 72% damage each. Melee attacks gain splash damage.'],['pierce','Armor Break','Projectile pierce +4. All damage +12%.'],['return','Return','Projectiles return and can hit again. Melee hits trigger a follow-up slash.'],['homing','Soulseeker','Projectiles steer toward enemies. Melee attacks launch a long-range seeking blade.'],
 ['blast','Flare','Hits trigger a small explosion. Cooldown: 0.35 s.'],['chain','Resonance','Hits chain to two nearby enemies. Cooldown: 0.45 s.'],['frost','Frost Seal','Hits apply Wet and briefly slow targets by 30%.'],['burn','Embers','Hits burn for 3 s, dealing 9 damage per second.'],['vamp','Dewdrinker','Eight consecutive hits restore 2 HP, with a cooldown between activations.'],
 ['guard','Mirror Ward','Gain one shield per room and another every 28 kills.'],['orbit','Sword Ring','Gain two orbiting swords. Each can hit once every 0.5 s.'],['dash','Feather Rush','Dashing launches homing feathers. Dash cooldown is reduced by another 0.25 s.'],['crit','Keen Edge','Gain an extra 25% chance to deal 1.8× damage.'],['execute','Severance','Deal 1.6× damage to targets below 30% HP.'],
 ['thorns','Thorns','Taking damage triggers a counterattack against nearby enemies. Cooldown: 1 s.'],['gravity','Undertow','Create a pulling vortex beneath the target every 4 s.'],['haste','Fleetfoot','Reduce the interval between automatic weapon attacks by 25%.'],['charge','Spirit Charge','Reduce F and R technique cooldowns by 25%.'],['risk','Wild Pact','All damage +35%. Damage taken +20%.']
];
G.runes=runes.map(([id,name,text],i)=>({id,name:'Inscription · '+name,text,icon:i,iconSet:'runes',family:'Inscription',tags:[id],effect:{rune:id}}));
G.chooseRune=then=>G.offer('Choose a weapon inscription','Bind an inscription to your weapon.',G.runes,r=>{G.p.rune=r.id;G.event('rune_equipped',{id:r.id,weapon:G.p.weapon});then();},'core_rune');
G.form=()=>G.weapons.find(w=>w.id===G.p?.weapon)||G.weapons[0];
G.recipe=(weapon,rune)=>{const w=G.weapons.find(x=>x.id===weapon),r=G.runes.find(x=>x.id===rune);return `${w.name} × ${r.name.replace('Inscription · ','')}: ${w.text} ${r.text}`;};
const proj=G.projectile;
G.projectile=(x,y,a,damage=20,element='water',homing=false,copy=false)=>{
 const rune=G.p.rune;proj(x,y,a,damage*(rune==='split'?.72:1),element,homing||rune==='homing');let shot=G.shots.at(-1);if(rune==='pierce')shot.pierce+=4;if(rune==='return')shot.runeReturn=true;
 if(!copy&&rune==='split')for(const offset of [-.22,.22])G.projectile(x,y,a+offset,damage,element,homing,true);
 if(!copy&&rune==='echo')G.echoQueue.push({at:G.time+.18,x,y,a,damage,element,homing});
};
const enter=G.enterRoom;
G.enterRoom=type=>{G.echoQueue=[];G.runeHits=0;G.procAt=0;G.runeGravityAt=0;enter(type);if(G.p.rune==='guard')G.p.shield++;};
const power=G.power;G.power=()=>power()*(G.p.rune==='risk'?1.35:G.p.rune==='pierce'?1.12:1);
const hit=G.hit;
G.hit=(e,amount,element='sword',chain=false)=>{
 if(e.dead)return;const rune=G.p.rune,origin={x:e.x,y:e.y};if(!chain){if(rune==='execute'&&e.hp/e.maxHp<.3)amount*=1.6;if(rune==='frost'){e.wet=3;e.runeSlow=1.8;}if(rune==='burn')e.runeBurn=3;if(['echo','return'].includes(rune)&&['sword','thunder','mirror','beam'].includes(element))amount*=1.25;}
 hit(e,amount,element,chain);if(chain||G.state!=='running')return;G.runeHits=(G.runeHits||0)+1;if(rune==='vamp'&&G.runeHits%8===0&&G.time>=(G.p.vampAt||0)){G.p.hp=Math.min(G.p.maxHp,G.p.hp+2);G.p.vampAt=G.time+2;}
 if(G.time>=(G.procAt||0)){
  if(['blast','chain','split','homing'].includes(rune)){G.procAt=G.time+(rune==='chain'?.45:.35);let targets=G.enemies.filter(n=>n!==e&&!n.dead).sort((a,b)=>d(origin,a)-d(origin,b));if(rune==='blast'||rune==='split'){const radius=rune==='blast'?95:65;G.effect(origin.x,origin.y,rune==='blast'?1:5,radius*2,.3);for(const n of targets)if(d(origin,n)<radius)hit(n,rune==='blast'?20:12,'rune',true);}else if(rune==='chain'){for(const n of targets.slice(0,2)){if(d(origin,n)<260){hit(n,22,'rune',true);G.fx.push({line:true,x:origin.x,y:origin.y,x2:n.x,y2:n.y,life:.25,max:.25});}}}else if(['sword','thunder','mirror','beam'].includes(element)&&targets[0])G.projectile(origin.x,origin.y,Math.atan2(targets[0].y-origin.y,targets[0].x-origin.x),15,'bird',true,true);}
 }
};
const die=G.die;G.die=e=>{if(e.dead)return;die(e);if(G.p.rune==='guard'&&G.kills%28===0)G.p.shield=Math.min(2,G.p.shield+1);};
const hurt=G.hurt;G.hurt=(n,source)=>{const hp=G.p.hp;hurt(n*(G.p.rune==='risk'?1.2:1),source);if(G.p.rune==='thorns'&&G.p.hp<hp&&G.state==='running'&&G.time>=(G.thornAt||0)){G.thornAt=G.time+1;G.effect(G.p.x,G.p.y,5,300,.4);for(const e of [...G.enemies])if(d(G.p,e)<170)hit(e,45,'rune',true);}};
const dash=G.dash;G.dash=()=>{let count=G.metrics.dashes;dash();if(G.metrics.dashes>count&&G.p.rune==='dash'){G.p.dashCd=Math.max(.5,G.p.dashCd-.25);for(let i=0;i<5;i++)G.projectile(G.p.x,G.p.y,i*Math.PI*2/5,23,'bird',true);}};
const skill=G.skill;G.skill=()=>{const before=G.metrics.skill_uses;skill();if(G.metrics.skill_uses>before){if(G.p.rune==='charge')G.p.skillCd*=.75;if(!['tide','ember','wing'].includes(G.p.weapon))G.weaponTechnique();}};
const water=G.waterSkill;G.waterSkill=()=>{const before=G.metrics.skill_uses;water();if(G.metrics.skill_uses>before&&G.p.rune==='charge')G.p.waterCd*=.75;};
const attack=G.attack;
G.attack=()=>{
 const p=G.p,at=p.attackAt;p.attackAt=Infinity;attack();p.attackAt=at;const n=G.nearest();if(!n||G.time<p.attackAt)return;const w=G.form(),a=Math.atan2(n.y-p.y,n.x-p.x);p.facing=a;let interval=.65;
 if(w.pattern==='fan'){G.meleeStrike('tide',a,165,1.05,38,'water');}
 if(w.pattern==='short'){G.meleeStrike('ember',a,140,1.3,42,'fire');interval=.46;}
 if(w.pattern==='seek'){for(const offset of [-.18,.18])G.projectile(p.x,p.y,a+offset,24,'bird',true);}
 if(w.pattern==='jade'){G.autoJades??=[];for(let i=0;i<3;i++)G.autoJades.push({start:G.time,a:i*Math.PI*2/3,hits:new Set()});interval=1.1;}
 if(w.pattern==='pulse'){G.effect(p.x,p.y,5,360,.45);for(const e of [...G.enemies])if(d(p,e)<190)G.hit(e,65,'mirror');G.projectile(p.x,p.y,a,30,'water');interval=.95;}
 if(w.pattern==='lance'){G.meleeStrike('spear',a,235,.22,76,'sword');interval=.9;}
 if(w.pattern==='thunder'){G.meleeStrike('hammer',a,150,Math.PI,72,'thunder');interval=.9;}
 if(w.pattern==='swarm'){for(let i=-1;i<=1;i++){G.projectile(p.x,p.y,a+i*.65,26,'bird',true);G.shots.at(-1).life=2.2;}interval=.85;}
 if(w.pattern==='comb'){for(const i of [-1,1])G.projectile(p.x+i*22,p.y,a-i*.12,26,'water');if(G.time>(p.combRegen||0)){p.hp=Math.min(p.maxHp,p.hp+1);p.combRegen=G.time+4;}}
 if(w.pattern==='beam'){G.beams.push({x:p.x,y:p.y,a,life:.23,max:.23,width:28});for(const e of [...G.enemies]){const dx=e.x-p.x,dy=e.y-p.y;if(dx*Math.cos(a)+dy*Math.sin(a)>0&&Math.abs(-dx*Math.sin(a)+dy*Math.cos(a))<e.r+25)G.hit(e,44,'beam');}interval=1;}
 if(w.pattern==='radial'){G.burst(p.x,p.y,8,25,'bird');interval=.85;}
 if(w.pattern==='heavy'){G.effect(p.x,p.y,0,400,.45,a);for(const e of [...G.enemies])if(d(p,e)<220)G.hit(e,70,'sword');G.projectile(p.x,p.y,a,70,'water');interval=1.15;}
 if(!['fan','short','lance','thunder','jade','seek','pulse','heavy'].includes(w.pattern)){G.effect(p.x+Math.cos(a)*20,p.y+Math.sin(a)*20,0,110,.22,a);for(const e of [...G.enemies])if(d(p,e)<85)G.hit(e,18,'sword');}
 p.attackAt=G.time+interval*(p.rune==='haste'?.75:1);
};
const update=G.update;
G.update=dt=>{if(G.state!=='running')return;for(const e of [...G.enemies]){if(e.runeSlow>0){e.runeSlow-=dt;if(!e.baseSpeed)e.baseSpeed=e.speed;e.speed=e.baseSpeed*.7;}else if(e.baseSpeed)e.speed=e.baseSpeed;if(e.runeBurn>0){e.runeBurn-=dt;if((e.runeBurnAt||0)<G.time){e.runeBurnAt=G.time+.5;hit(e,4.5,'rune',true);}}}if(G.state!=='running')return;
 for(const q of G.echoQueue||[])if(q.at<=G.time){if(G.r2ResolveSource)G.r2ResolveSource(q.r2Source,0,()=>G.projectile(q.x,q.y,q.a,q.damage*.65,q.element,q.homing,true));else G.projectile(q.x,q.y,q.a,q.damage*.65,q.element,q.homing,true);q.done=true;}G.echoQueue=(G.echoQueue||[]).filter(q=>!q.done);
 for(const s of G.shots)if(s.runeReturn&&s.age>.6&&!s.orb&&(!s.returnAfterHit||s.returning||s.hits.size>0)){
  if(!s.returning){
   s.returning=true;s.hits.clear();
   // A successful evolved feather has enough life for its return leg.
   if(s.returnAfterHit)s.life=Math.max(s.life,d(s,G.p)/500+.15);
  }s.a=Math.atan2(G.p.y-s.y,G.p.x-s.x);s.vx=Math.cos(s.a)*500;s.vy=Math.sin(s.a)*500;if(d(G.p,s)<20)s.life=0;}
 if(G.p.rune==='gravity'&&G.time>=(G.runeGravityAt||0)){const n=G.nearest();if(n){G.runeGravityAt=G.time+4;G.zones.push({x:n.x,y:n.y,r:120,age:0,delay:0,life:2.5,friend:true,damage:12,element:'water',vortex:true,tick:0});}}
 const count=(G.p.rune==='orbit'?2:0)+(G.p.weapon==='jade'?3:0);for(let i=0;i<count;i++){const a=G.time*2.5+i*Math.PI*2/count,pos={x:G.p.x+Math.cos(a)*100,y:G.p.y+Math.sin(a)*100};for(const e of [...G.enemies])if(d(pos,e)<e.r+17&&G.time>=(e.runeOrbitAt||0)){e.runeOrbitAt=G.time+.5;G.hit(e,26,'jewel');}}update(dt);
};
const summary=G.summary;G.summary=()=>({...summary(),rune:G.p?.rune,combination:G.p?.rune?G.p.weapon+'__'+G.p.rune:null});
})();
