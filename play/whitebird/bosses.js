'use strict';
(() => {
const G=WB,d=G.distance;
const definitions=[
 ['oni_hammer','Gatekeeper · Stone Hammer',0,'guardian','F F triggers a tremor, dealing 75 damage within a radius of 260.'],
 ['gate_rope','Gatekeeper · Sacred Rope',1,'guardian','Gain two extra shields per combat room. Each blocks one hit.'],
 ['earth_pulse','Gatekeeper · Sixfold Tremor',2,'guardian','Dashing ends with a shockwave, dealing 40 damage within a radius of 150.'],
 ['broken_edict','Emperor · Broken Seal',3,'father','F F fires three golden edict beams, each dealing 65 damage along its path.'],
 ['unbound_crown','Emperor · Unclaimed Crown',4,'father','After taking damage, gain 0.5 s of extra invulnerability and 12 awakening charge.'],
 ['three_edicts','Emperor · Returning Edicts',5,'father','Every third automatic weapon attack releases three homing edict blades.'],
 ['tidal_heart','Magatsu · Cleansed Tide',6,'magatsu','R R restores 4 HP and reduces the remaining F cooldown by 3 s.'],
 ['clean_mirror','Magatsu · Sea Mirror',7,'magatsu','Q Awakening restores an extra 25 HP and grants one shield.'],
 ['serpent_eye','Magatsu · Orochi Tide-Eye',8,'magatsu','R also summons a water serpent to slash nearby enemies.'],
 ['blood_wrap','Prince · Old Wounds',9,'prince','Start with Bloodrage unlocked. Its HP drain is reduced to 0.75 per second.'],
 ['prince_blade','Prince · Bloodied Blade',10,'prince','Gain 6% damage for every 10% of missing HP.'],
 ['severed_thread','Prince · Severed Feather',11,'prince','Q Awakening ends Bloodrage, restores 20 HP and grants +20% damage for 10 s.']
];
G.bossRelics=definitions.map(([id,name,icon,boss,text])=>({id,name,icon,iconSet:'boss',boss,text,tags:['boss_reward',boss,id]}));G.relics.push(...G.bossRelics);
const PROFILE='whitebird.boss-collection.rsi.en';G.collection=[];G.heirloom=null;
try{const p=JSON.parse(localStorage.getItem(PROFILE)||'{}');G.collection=(p.unlocked||[]).filter(id=>G.bossRelics.some(r=>r.id===id));G.heirloom=G.collection.includes(p.equipped)?p.equipped:null;}catch{}
G.saveCollection=()=>{try{localStorage.setItem(PROFILE,JSON.stringify({unlocked:G.collection,equipped:G.heirloom}));}catch{G.notice('Could not save the collection in this browser. Export this run’s journal.');}};
const event=G.event;G.event=(type,data={})=>{if(type==='run_start')data={...data,unlocks:G.session?.actor_type==='human'?[...G.collection]:[],heirloom:G.session?.actor_type==='human'?G.heirloom:null};event(type,data);};
const start=G.start;G.start=(...args)=>{start(...args);G.lastBoss=null;G.autoCount=0;if(G.session?.actor_type==='human'&&G.heirloom){G.p.relics.push(G.heirloom);G.event('heirloom_equipped',{id:G.heirloom});G.p.blackUnlocked=G.has('blood_wrap');}};
const die=G.die;G.die=e=>{if(e.boss&&!e.dead)G.lastBoss=e.kind;die(e);};
const offerRelic=G.offerRelic;
G.offerRelic=then=>{if(G.roomType!=='boss'||!G.lastBoss){offerRelic(then);return;}const kind=G.lastBoss,options=G.bossRelics.filter(r=>r.boss===kind&&!G.has(r.id));if(!options.length){G.offerTalent(then,'boss_reward_fallback');return;}
 G.offer(G.bosses[kind].name+' · Boss Relic','Choose one relic. It takes effect this run. Relics earned during human play also enter your collection; bring one on your next run.',options.map(r=>({...r,rare:true,effect:{relic:r.id,collection_unlock:true}})),r=>{G.p.relics.push(r.id);if(r.id==='blood_wrap')G.p.blackUnlocked=true;G.event('boss_reward_selected',{boss:kind,relic:r.id});G.event('relic_gained',{id:r.id,source:kind});if(G.session.actor_type==='human'&&!G.collection.includes(r.id)){G.collection.push(r.id);G.saveCollection();G.event('collection_unlocked',{id:r.id});}then();},'boss_loot');
};
const enter=G.enterRoom;G.enterRoom=type=>{enter(type);G.autoCount=0;if(G.has('gate_rope'))G.p.shield+=2;};
const skill=G.skill;G.skill=()=>{const uses=G.metrics.skill_uses;skill();if(G.metrics.skill_uses===uses||G.state!=='running')return;const p=G.p;
 if(G.has('oni_hammer')){G.effect(p.x,p.y,5,540,.55);for(const e of [...G.enemies])if(d(e,p)<260)G.hit(e,75,'sword');G.event('boss_relic_trigger',{id:'oni_hammer'});}
 if(G.has('broken_edict')){const n=G.nearest(),base=n?Math.atan2(n.y-p.y,n.x-p.x):p.facing;for(let i=-1;i<=1;i++){let a=base+i*.35;G.beams.push({x:p.x,y:p.y,a,width:26,life:.35,max:.35});for(const e of [...G.enemies]){let dx=e.x-p.x,dy=e.y-p.y;if(dx*Math.cos(a)+dy*Math.sin(a)>0&&Math.abs(-dx*Math.sin(a)+dy*Math.cos(a))<e.r+23)G.hit(e,65,'beam');}}G.event('boss_relic_trigger',{id:'broken_edict'});}
};
const dash=G.dash;G.dash=()=>{const n=G.metrics.dashes;dash();if(G.metrics.dashes>n&&G.has('earth_pulse'))G.p.quakePending=true;};
const hurt=G.hurt;G.hurt=(n,source)=>{const hp=G.p.hp;hurt(n,source);if(G.state==='running'&&G.p.hp<hp&&G.has('unbound_crown')){G.p.inv+=.5;G.p.power=Math.min(100,G.p.power+12);G.event('boss_relic_trigger',{id:'unbound_crown'});}};
const attack=G.attack;G.attack=()=>{const at=G.p.attackAt;attack();if(G.p.attackAt>at&&G.state==='running'){G.autoCount++;if(G.has('three_edicts')&&G.autoCount%3===0){const n=G.nearest(),a=n?Math.atan2(n.y-G.p.y,n.x-G.p.x):0;for(let i=-1;i<=1;i++)G.projectile(G.p.x,G.p.y,a+i*.5,42,'bird',true);G.event('boss_relic_trigger',{id:'three_edicts'});}}};
const water=G.waterSkill;G.waterSkill=()=>{const uses=G.metrics.skill_uses;water();if(G.metrics.skill_uses===uses||G.state!=='running')return;const p=G.p;if(G.has('tidal_heart')){p.hp=Math.min(p.maxHp,p.hp+4);p.skillCd=Math.max(0,p.skillCd-3);G.event('boss_relic_trigger',{id:'tidal_heart'});}if(G.has('serpent_eye')){G.fx.push({orochi:true,x:p.x,y:p.y,size:560,life:1.2,max:1.2});G.zones.push({x:p.x,y:p.y,r:260,age:0,delay:0,life:1.2,friend:true,damage:40,element:'water',tick:0});G.event('boss_relic_trigger',{id:'serpent_eye'});}};
const awaken=G.awaken;G.awaken=()=>{const uses=G.metrics.awakening_uses;awaken();if(G.metrics.awakening_uses===uses)return;const p=G.p;if(G.has('clean_mirror')){p.hp=Math.min(p.maxHp,p.hp+25);p.shield++;G.event('boss_relic_trigger',{id:'clean_mirror'});}if(G.has('severed_thread')){p.black=false;p.hp=Math.min(p.maxHp,p.hp+20);p.freedomUntil=G.time+10;G.event('boss_relic_trigger',{id:'severed_thread'});}};
const power=G.power;G.power=()=>power()*(G.has('prince_blade')?1+(1-G.p.hp/G.p.maxHp)*.6:1)*(G.p.freedomUntil>G.time?1.2:1);
const spawnBoss=G.spawnBoss;G.spawnBoss=()=>{spawnBoss();G.boss.combatPhase=1;G.boss.specialAt=G.time+3.5;};
const update=G.update;G.update=dt=>{
 if(G.state!=='running')return;const p=G.p;if(p.black&&G.has('blood_wrap'))p.hp=Math.min(p.maxHp,p.hp+.75*dt);if(p.quakePending&&p.dashTime<=0){p.quakePending=false;G.effect(p.x,p.y,5,320,.4);for(const e of [...G.enemies])if(d(e,p)<150)G.hit(e,40,'sword');G.event('boss_relic_trigger',{id:'earth_pulse'});}const b=G.boss;
 if(b){if(b.hp<b.maxHp*.5&&b.combatPhase===1){b.combatPhase=2;G.event('boss_phase_changed',{kind:b.kind,phase:2});G.toast({guardian:'Gatekeeper’s Fury · Sixfold Collapse',father:'Imperial Command · Seals Restored',magatsu:'Reversing Tide · Find a gap in the waves',prince:'The Lost Prince · Cut the puppet strings',aragami:'Mountain’s Fury · Storm Pursuit',sea:'Sea Gates Open · Between the tides'}[b.kind]);
  if(b.kind==='father'){const live=G.enemies.filter(e=>e.kind==='seal'&&!e.dead).length;for(let i=live;i<3;i++)G.enemies.push({id:G.nextId++,kind:'seal',name:'Restoring Edict Seals',x:430+i*290,y:370+(i%2)*160,hp:120,maxHp:120,r:22,speed:0,wet:0,burn:0,flash:0});}}
  if(G.time>=b.specialAt){b.specialAt=G.time+(b.combatPhase===2?4.3:5.8);G.event('boss_special',{kind:b.kind,phase:b.combatPhase});
   if(b.kind==='guardian'){for(let i=0;i<(b.combatPhase===2?6:3);i++){const a=i*Math.PI/3;G.danger(G.clamp(b.x+Math.cos(a)*210,150,1290),G.clamp(b.y+Math.sin(a)*170,220,740),63,1.25+i*.08);}}
   if(b.kind==='father'){for(let i=-2;i<=2;i++)G.hostileShot(b,Math.atan2(p.y-b.y,p.x-b.x)+i*.18,165);if(b.combatPhase===2)G.danger(p.x,p.y,90,1.4,'hline');}
   if(b.kind==='magatsu'){const offset=b.combatPhase===2?125:165;G.danger(p.x,G.clamp(p.y-offset,210,730),80,1.35,'hline');G.danger(p.x,G.clamp(p.y+offset,210,730),80,1.65,'hline');}
   if(b.kind==='prince'){const a=Math.atan2(p.y-b.y,p.x-b.x);for(let i=-2;i<=2;i++)G.hostileShot(b,a+i*.22,190);if(b.combatPhase===2){G.danger(p.x,p.y,95,1.3);G.danger(G.clamp(p.x+180,160,1280),p.y,70,1.6);}}
  }
 }
 if(G.state==='running')update(dt);
};
G.bosses.guardian.tip='The hammer marks circular impact zones and sends six tremors outward. More impacts appear below half HP. Leave red circles before they fill.';
G.bosses.father.tip='Break the three edict seals first. Below half HP, he restores them and adds horizontal beams. Avoid the red lines before counterattacking.';
G.bosses.magatsu.tip='Ring volleys have gaps. A red band marks the coming tide. Attacks accelerate below half HP. Awakening clears projectiles.';
G.bosses.prince.tip='He follows dashes with red sword waves. Below half HP, impact zones track you. Dodge away from his windup.';
const summary=G.summary;G.summary=()=>({...summary(),heirloom:G.session?.events.find(e=>e.type==='run_start')?.heirloom||null,boss_relics:G.p?.relics.filter(id=>G.bossRelics.some(r=>r.id===id))});
})();
