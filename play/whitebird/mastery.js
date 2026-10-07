'use strict';
(() => {
const G=WB,d=G.distance;
const defs={
 tide:[['Forked Tide','Water blades split into two narrow streams.'],['Backflow','Tide-blade hits pull nearby enemies toward the impact point.'],['Tide and Steel','Using R shortens the next F cooldown.']],
 ember:[['Flintstep','Dashing leaves a burning trail.'],['Kindling','Enemies killed by fire blades leave an explosion.'],['Boiling Edge','Fire hits against Wet targets release extra steam blades.']],
 wing:[['Sweeping Feathers','Dashing releases a cluster of homing feathers.'],['Open Sky','Feather blades deal more damage at greater distances.'],['Homeward Flight','F recalls feather blades to orbit you.']],
 jade:[['Twin Jewels','Add two attacking magatama.'],['Jewel Resonance','Periodic jewel pulses cancel nearby projectiles.'],['Jewel Rain','F makes the magatama release light in every direction.']],
 mirror:[['Reflection','F turns nearby projectiles into homing light.'],['Shattered Mirror','A broken shield releases extra mirror shards.'],['Clear Mirror','F grants brief protection.']],
 spear:[['Threefold Spear','F releases three spears.'],['Bonepiercer','Spear projectiles grow stronger with each enemy pierced.'],['Tidepin','Spear hits briefly slow enemies.']],
 hammer:[['Thunder Branch','Lightning branches to nearby enemies.'],['Stormwater','Lightning deals more damage to Wet targets.'],['Echoing Drum','F strikes its impact point again with thunder.']],
 talisman:[['Burning Talisman','Talisman hits trigger explosions with a cooldown.'],['Triple Seal','Three talisman hits on the same enemy trigger a seal burst.'],['Scattered Blossoms','F releases more homing talismans.']],
 comb:[['Returning Breath','Consecutive water-blade hits restore a little HP.'],['Rain Curtain','Using R applies Wet to nearby enemies.'],['Lingering Memory','The first severe wound in each room reduces F and R cooldowns.']],
 shaku:[['Divided Edict','F releases three edict beams in different directions.'],['Broken Command','Edict beams mark enemies, making the next hit stronger.'],['Golden Thread','Dashing leaves an edict beam at its endpoint.']],
 flute:[['Counterpoint','Sound waves gain four extra directions.'],['Lingering Note','Enemies killed by sound waves pass an echo to nearby enemies.'],['Ceasefire','The sound wave from F briefly slows nearby enemies.']],
 divine:[['Patient Edge','Standing still briefly strengthens the next heavy slash.'],['Daybreak','F cleaves forward with three heavy sword waves.'],['Soaring Blade','Dashing reduces the F cooldown and follows with an aerial slash.']]
};
for(const [weapon,items] of Object.entries(defs)){const w=G.weapons.find(w=>w.id===weapon);items.forEach(([name,text],i)=>G.talents.push({id:weapon+'_m'+i,name,weapon,icon:w.icon,iconSet:'weapons',category:i===1?'passive':'active',family:w.name,max:2,text,tags:['weapon_mastery',weapon],mastery:true}));}
const combos=[
 ['rain_thunder','Thunder in the Rain','thunder','water','Lightning hitting Wet targets leaps to nearby enemies.'],
 ['fire_feather','Burning Feathers','feather','fire','Feather blades apply a burn on hit.'],
 ['mirror_thunder','Storm Mirror','ward','thunder','A broken shield calls lightning onto enemies.'],
 ['orbit_dash','Swordflight','orbit','bird','Dashing stirs orbiting swords and sends extra sword waves along the path.'],
 ['frost_vortex','Frozen Deep','ice','vortex','Enemies in vortices are slowed further.'],
 ['ember_return','Returning Fire','return','fire','Returning tide blades ignite enemies along their path.'],
 ['soul_feather','Homeward Soul','awakening','feather','Awakening releases a volley of homing feathers.'],
 ['blood_flame','Firedrinker','leech','burn','Killing burning enemies restores HP, with a cooldown between triggers.']
];
for(const [id,name,a,b,text] of combos)G.talents.push({id,name,needs:[a,b],icon:7,category:'passive',family:'Synergy',max:1,text,tags:['synergy',a,b]});
const pool=G.talentPool;G.talentPool=()=>pool().filter(t=>(!t.weapon||t.weapon===G.p.weapon)&&(!t.needs||t.needs.every(id=>G.lv(id)>0)));
G.selectGrowth=pool=>{const a=G.shuffle(pool.filter(t=>t.mastery)),b=G.shuffle(pool.filter(t=>t.needs)),c=G.shuffle(pool.filter(t=>!t.mastery&&!t.needs));const result=[];if(a.length)result.push(a.shift());if(b.length)result.push(b.shift());return [...result,...G.shuffle([...a,...b,...c])].slice(0,4);};
G.master=i=>G.lv(G.p.weapon+'_m'+i);
const proj=G.projectile;G.projectile=(x,y,a,n=20,element='water',homing=false,copy=false)=>{
 proj(x,y,a,n,element,homing,copy);const s=G.shots.at(-1);if(!s)return;s.weapon=G.p.weapon;if(G.p.weapon==='spear'&&G.master(1))s.skewer=G.master(1);
 // Forked Tide follows water projectiles only; feather and relic attacks keep their own identity.
 if(!copy&&element==='water'&&G.p.weapon==='tide'&&G.master(0)){
  for(const offset of [-.12,.12]){
   proj(x,y,a+offset,n*.32*G.master(0),'water',false,true);
  }
 }
 if(G.lv('fire_feather')&&element==='bird')s.scorch=true;
};
let procLock=false;
const hit=G.hit;G.hit=(e,n,element='sword',chain=false)=>{
 if(e.dead)return;const w=G.p.weapon,wasWet=e.wet>0;
 if(!chain){if(w==='wing'&&G.master(1)&&element==='bird')n*=1+Math.min(.45,d(e,G.p)/1000)*G.master(1);if(w==='hammer'&&G.master(1)&&wasWet&&element==='thunder')n*=1+.25*G.master(1);if(e.edictMark){n*=1.25;e.edictMark=false;}if(w==='divine'&&G.master(0)&&(G.p.stillTime||0)>.65)n*=1+.3*G.master(0);}
 hit(e,n,element,chain);if(chain||procLock||G.state!=='running')return;procLock=true;
 try{
  if(w==='tide'&&G.master(1)&&element==='water')for(const other of G.enemies)if(other!==e&&!other.boss&&d(other,e)<140){other.x+=(e.x-other.x)*.07*G.master(1);other.y+=(e.y-other.y)*.07*G.master(1);}
  if(w==='spear'&&G.master(2)&&['sword','water'].includes(element))e.runeSlow=1.3+.5*(G.master(2)-1);
  if(w==='shaku'&&G.master(1)&&element==='beam')e.edictMark=true;
  if((w==='hammer'&&G.master(0)||G.lv('rain_thunder')&&wasWet)&&element==='thunder'&&G.time>=(G.p.chainAt||0)){G.p.chainAt=G.time+.4;for(const other of G.enemies.filter(x=>x!==e&&d(x,e)<200).slice(0,2)){hit(other,22*(w==='hammer'?Math.max(1,G.master(0)):1),'thunder',true);G.fx.push({line:true,x:e.x,y:e.y,x2:other.x,y2:other.y,life:.25,max:.25});}}
  if(w==='talisman'&&G.master(1)){e.seals=(e.seals||0)+1;if(e.seals%3===0){hit(e,28*G.master(1),'seal',true);G.effect(e.x,e.y,5,140,.4);}}
  if(w==='talisman'&&G.master(0)&&G.time>=(G.p.paperAt||0)){G.p.paperAt=G.time+.7;for(const other of G.enemies)if(other!==e&&d(other,e)<85)hit(other,16*G.master(0),'paper',true);G.effect(e.x,e.y,1,130,.35);}
  if(w==='ember'&&G.master(2)&&wasWet&&element==='fire'&&G.time>=(G.p.steamAt||0)){G.p.steamAt=G.time+.7;G.burst(e.x,e.y,4,16*G.master(2),'steam');}
  if(G.lv('fire_feather')&&element==='bird')e.runeBurn=2;
  if(w==='comb'&&G.master(0)){G.p.combHits=(G.p.combHits||0)+1;if(G.p.combHits%10===0&&G.time>=(G.p.combMAt||0)){G.p.combMAt=G.time+3;G.p.hp=Math.min(G.p.maxHp,G.p.hp+G.master(0)*2);}}
 }finally{procLock=false;}
};
const die=G.die;G.die=e=>{if(e.dead)return;const w=G.p.weapon,burning=e.runeBurn>0||e.burn>0;die(e);if(G.state!=='running'||G.r2DerivedDamage)return;if(w==='ember'&&G.master(1)||w==='flute'&&G.master(1)){G.effect(e.x,e.y,w==='ember'?1:2,180,.4);for(const n of [...G.enemies])if(!n.dead&&d(e,n)<110)G.hit(n,14*G.master(1),'relic',true);}if(G.lv('blood_flame')&&burning&&G.time>=(G.p.drinkAt||0)){G.p.drinkAt=G.time+3;G.p.hp=Math.min(G.p.maxHp,G.p.hp+3);}};
G.masterBeam=(a,n)=>{const p=G.p;G.beams.push({x:p.x,y:p.y,a,width:25,life:.3,max:.3});for(const e of [...G.enemies]){const dx=e.x-p.x,dy=e.y-p.y;if(dx*Math.cos(a)+dy*Math.sin(a)>0&&Math.abs(-dx*Math.sin(a)+dy*Math.cos(a))<e.r+20)G.hit(e,n,'beam',true);}};
const skill=G.skill;G.skill=()=>{const before=G.metrics.skill_uses;skill();if(before===G.metrics.skill_uses)return;const p=G.p,w=p.weapon,a=p.facing;
 if(w==='tide'&&G.master(2)&&p.tideLink>G.time){p.skillCd*=1-(.3+.15*(G.master(2)-1));p.tideLink=0;}
 if(w==='wing'&&G.master(2))p.featherOrbitUntil=G.time+3;
 if(w==='jade'&&G.master(2))G.burst(p.x,p.y,8,24*G.master(2),'jewel');
 if(w==='mirror'){if(G.master(0)){let count=0;G.hostile=G.hostile.filter(s=>{if(d(s,p)>220)return true;if(count++<8)G.projectile(p.x,p.y,G.rng()*6.28,20,'bird',true);return false;});}if(G.master(2))p.inv=Math.max(p.inv,.4+.15*G.master(2));}
 if(w==='spear'&&G.master(0))for(let i=-1;i<=1;i++){G.projectile(p.x,p.y,a+i*.18,45*G.master(0),'water');G.shots.at(-1).pierce=10;}
 if(w==='hammer'&&G.master(2)){const e=G.nearest();if(e)G.zones.push({x:e.x,y:e.y,r:140,age:0,delay:.7,life:1.1,friend:true,damage:45*G.master(2),element:'thunder',once:true});}
 if(w==='talisman'&&G.master(2))for(let i=0;i<4*G.master(2);i++)G.projectile(p.x,p.y,i*.78,20,'bird',true);
 if(w==='shaku'&&G.master(0))for(let i=-1;i<=1;i++)G.masterBeam(a+i*.3,32*G.master(0));
 if(w==='flute'&&G.master(2))for(const e of G.enemies)if(d(e,p)<260)e.runeSlow=2+G.master(2);
 if(w==='divine'&&G.master(1))for(let i=-1;i<=1;i++)G.projectile(p.x,p.y,a+i*.18,55*G.master(1),'sword');
 G.event('mastery_skill',{weapon:w,levels:[G.master(0),G.master(1),G.master(2)]});
};
const water=G.waterSkill;G.waterSkill=()=>{const n=G.metrics.skill_uses;water();if(n===G.metrics.skill_uses)return;if(G.p.weapon==='tide'&&G.master(2))G.p.tideLink=G.time+5;if(G.p.weapon==='comb'&&G.master(1))for(const e of G.enemies)if(d(e,G.p)<250)e.wet=4;};
const dash=G.dash;G.dash=()=>{const n=G.metrics.dashes;dash();if(n===G.metrics.dashes)return;const p=G.p,w=p.weapon;
 if(w==='ember'&&G.master(0))G.zones.push({x:p.x,y:p.y,r:90,age:0,delay:0,life:2.5,friend:true,damage:14*G.master(0),element:'fire',tick:0});
 if(w==='wing'&&G.master(0))for(let i=0;i<3*G.master(0);i++)G.projectile(p.x,p.y,i*.7,20,'bird',true);
 if(w==='shaku'&&G.master(2))G.masterBeam(Math.atan2(p.dy,p.dx),35*G.master(2));
 if(w==='divine'&&G.master(2))p.skillCd=Math.max(0,p.skillCd-1.2*G.master(2));
 if(G.lv('orbit_dash'))G.burst(p.x,p.y,6,18,'sword');
};
const hurt=G.hurt;G.hurt=(n,s)=>{const shield=G.p.shield;hurt(n,s);if(shield>G.p.shield){if(G.p.weapon==='mirror'&&G.master(1))G.burst(G.p.x,G.p.y,6,18*G.master(1),'mirror');if(G.lv('mirror_thunder'))for(const e of G.enemies.slice(0,3)){G.hit(e,25,'thunder',true);G.effect(e.x,e.y,3,90,.4);}}if(G.p.weapon==='comb'&&G.master(2)&&!G.p.memoryUsed&&G.p.hp<G.p.maxHp*.35){G.p.memoryUsed=true;G.p.skillCd=0;G.p.waterCd=Math.max(0,G.p.waterCd-3*G.master(2));}};
const awaken=G.awaken;G.awaken=()=>{const n=G.metrics.awakening_uses;awaken();if(n!==G.metrics.awakening_uses&&G.lv('soul_feather'))for(let i=0;i<8;i++)G.projectile(G.p.x,G.p.y,i*.78,24,'bird',true);};
const attack=G.attack;G.attack=()=>{const at=G.p.attackAt;attack();if(G.p.attackAt>at&&G.p.weapon==='flute'&&G.master(0))for(let i=0;i<4;i++)G.projectile(G.p.x,G.p.y,i*Math.PI/2+.4,16*G.master(0),'bird');};
const enter=G.enterRoom;G.enterRoom=type=>{enter(type);G.p.memoryUsed=false;};
const update=G.update;G.update=dt=>{if(G.state!=='running')return;const p=G.p,m=G.moveVector();p.stillTime=m.x||m.y?0:(p.stillTime||0)+dt;
 G.extraOrbits=(p.weapon==='jade'?2*G.master(0):0)+(p.featherOrbitUntil>G.time?3*(p.weapon==='wing'?Math.max(1,G.master(2)):1):0);
 for(let i=0;i<G.extraOrbits;i++){const a=G.time*2.6+i*6.28/G.extraOrbits,pos={x:p.x+Math.cos(a)*135,y:p.y+Math.sin(a)*135};for(const e of G.enemies)if(d(pos,e)<e.r+15&&G.time>=(e.masterOrbitAt||0)){e.masterOrbitAt=G.time+.7;G.hit(e,17,'jewel',true);}}
 if(p.weapon==='jade'&&G.master(1)&&G.time>=(p.jadeGuardAt||0)){p.jadeGuardAt=G.time+Math.max(2,5-G.master(1));G.hostile=G.hostile.filter(s=>d(s,p)>125);G.effect(p.x,p.y,5,220,.3);}
 for(const s of G.shots){if(s.skewer&&!s.skewerBase)s.skewerBase=s.damage;if(s.skewer)s.damage=s.skewerBase*(1+s.hits.size*.12*s.skewer);if(G.lv('ember_return')&&s.returning)s.element='fire';}
 if(G.lv('frost_vortex'))for(const z of G.zones)if(z.vortex)for(const e of G.enemies)if(d(e,z)<z.r)e.runeSlow=1;
 update(dt);
};
})();
