'use strict';
(() => {
const G=WB,d=G.distance;
G.regions.splice(2,0,
 {name:'Ibuki · Mountain’s Wrath',short:'Ibuki',art:'arena_mountain',color:'#abd6a6',boss:'aragami',intro:'The mountain god blocks the path as a white boar. Villagers are trapped on the slopes. Ousu sets out to help them.',enemies:['boar','kodama','thunder'],hazard:'White boars charge after winding up. Mountain-storm impacts follow your trail.'},
 {name:'Hashirimizu · Unbroken Voyage',short:'Hashirimizu',art:'arena_sea',color:'#80e2e3',boss:'sea',intro:'Storms return to Hashirimizu. Carrying Ototachibana’s comb, Ousu reaches the shore to face the sea god.',enemies:['crab','siren','wraith'],hazard:'Crab soldiers close in while sea witches charge three-pronged volleys. Watch for the passage left by the ebbing tide.'});
Object.assign(G.bosses,{
 aragami:{name:'Ibuki Mountain God',title:'Breath of the Mountain · White Boar Lord',line:'“A human sword would decide the fate of a mountain?”',tip:'After the mountain lord stomps, thunderstones follow your footsteps. Avoid the wind pillars. Counterattack when his charge ends.',art:'aragami_portrait',hp:4300,r:44,speed:38},
 sea:{name:'God of Hashirimizu',title:'Lord of Tides · A Sea That Demands No Sacrifice',line:'“How will you cross this sea without leaving someone behind?”',tip:'Pass through the gaps between tide walls before they light up. Defeat the sea witches and wait for the next ebb.',art:'sea_portrait',hp:5600,r:40,speed:32}
});
G.bosses.magatsu.hp=7800;G.bosses.prince.hp=8600;
G.bossKey=()=>G.act===G.regions.length-1&&G.shadowFinal?'prince':G.regions[G.act].boss;
Object.assign(G.enemyDefs,{
 boar:{name:'White Boar Emissary',sprite:1,hp:70,speed:72,r:22,color:'#c9d6b4'},
 crab:{name:'Wave-Armored Crab',sprite:4,hp:85,speed:57,r:24,color:'#72c9c9'},
 siren:{name:'Tide Witch',sprite:3,hp:55,speed:47,r:20,color:'#85e0e7'}
});
const relics=[
 ['mountain_fang','Ibuki · Divine Boar Fang',2,'aragami','Dashing ends with a gust that knocks back nearby enemies. Shockwave damage: 40 per rank.'],
 ['storm_stone','Ibuki · Thunderstone Heart',3,'aragami','F summons pursuing lightning. Add one strike per rank.'],
 ['mountain_rope','Ibuki · Mountain-Binding Rope',4,'aragami','Gain one shield per room. Damage reduction +1 per rank.'],
 ['coral_spear','Hashirimizu · Coral Trident',5,'sea','R releases extra piercing waves. Add one wave blade per rank.'],
 ['tide_pearl','Hashirimizu · Tidal Pearl',6,'sea','R restores 6 HP per rank.'],
 ['home_shell','Hashirimizu · Homeward Shell',7,'sea','Each dash reduces the remaining R cooldown by 0.8 s per rank.'],
 ['coin_pouch','Merchant’s Purse',10,null,'Enemy coin drops +25% per rank.'],
 ['sacred_flask','Sacred-Tree Flask',11,null,'Every 12 kills restore 4 HP per rank.'],
 ['sword_scroll','Cinnabar Sword Scroll',8,null,'F and R damage +12% per rank.'],
 ['gold_charm','Sunwheel Charm',9,null,'Gain one shield per rank on entering each room.']
].map(([id,name,icon,boss,text])=>({id,name,icon,boss,iconSet:'voyage',text,tags:['relic',boss||'merchant']}));
G.relics.push(...relics);G.bossRelics.push(...relics.filter(r=>r.boss));
const additions=[
 ['sword_edge','Mooncleaver',8,'active','F damage +18% per rank.'],
 ['sword_tempo','Flow',8,'active','F cooldown −8% per rank.'],
 ['water_force','Deep Current',6,'active','R damage +18% per rank.'],
 ['water_tempo','Tidal Breath',6,'active','R cooldown −8% per rank.'],
 ['blade_rain','Sword Rain',8,'active','F releases two extra homing swords per rank.'],
 ['foam_guard','Sea Foam',6,'active','R grants one shield. Higher ranks reduce the trigger cooldown.'],
 ['wake_bloom','Featherfall',2,'active','Awakening releases six homing feathers per rank.'],
 ['dash_echo','Feather Return',2,'active','Dashing leaves delayed feather bursts. Damage: 20 per rank.'],
 ['crescent','Moon’s Return',8,'active','F releases a ring of piercing sword waves, four per rank.'],
 ['tide_charge','Spirit Tide',6,'active','R grants 6 awakening charge per rank.'],
 ['iron_skin','Sturdy Robes',9,'passive','Damage reduction +1 per rank.'],
 ['fleet','Light Skiff',2,'passive','Move speed +16 per rank.'],
 ['fortune','Fortune',0,'passive','Coin pickup value +20% per rank.'],
 ['harvest','Harvest',11,'passive','Room-clear healing +4 per rank.'],
 ['focus','Focus',8,'passive','Automatic attack interval −6% per rank.'],
 ['soulwell','Spirit Spring',3,'passive','XP pickup value +15% per rank.'],
 ['resilience','Unyielding',9,'passive','Below half HP, reduce incoming damage by 2 per rank.'],
 ['resolve','Composure',8,'passive','Above half HP, all damage +8% per rank.']
];
G.talents.forEach(t=>t.category=['bird','feather','awakening','water'].includes(t.id)?'active':'passive');
G.talents.push(...additions.map(([id,name,icon,category,text])=>({id,name,icon,iconSet:'voyage',category,family:category==='active'?'Technique Upgrades':'Passives',max:3,text,tags:[category,id]})));
G.relicRank=id=>G.has(id)?G.p.relicRanks?.[id]||1:0;
G.owned=id=>!!G.p?.relics.includes(id);
G.has=id=>!!(G.p?.equipped||[]).includes(id);
const start=G.start;
G.start=(...a)=>{start(...a);if(!G.p)return;G.p.equipped=[...G.p.relics];G.p.relicRanks=Object.fromEntries(G.p.relics.map(id=>[id,1]));G.p.rerolls=2;G.lootPity=0;G.newLoot=[];G.ghosts=[];G.p.attackAnim=0;G.p.blackUnlocked=G.owned("blood_wrap");G.deaths=[];};
const event=G.event;
G.event=(type,data={})=>{if(type==='relic_gained'&&G.p){G.p.relicRanks??={};G.p.equipped??=[];G.p.relicRanks[data.id]??=1;if(!G.p.equipped.includes(data.id))G.p.equipped.push(data.id);data={...data,equipped:G.p.equipped.includes(data.id),rank:G.p.relicRanks[data.id]};}event(type,data);};
G.gainRelic=id=>{if(!G.owned(id)){G.p.relics.push(id);G.event('relic_gained',{id});}else if((G.p.relicRanks[id]||1)<3){G.p.relicRanks[id]=(G.p.relicRanks[id]||1)+1;G.event('relic_upgraded',{id,rank:G.p.relicRanks[id]});}G.toast(G.relics.find(r=>r.id===id).name+' · '+(G.p.relicRanks[id]||1)+'  Rank');};
G.equipRelic=id=>{if(!G.owned(id))return false;const e=G.p.equipped;if(e.includes(id)){G.p.equipped=e.filter(x=>x!==id);}else if(e.length<4)e.push(id);else{G.notice('Relic slots are full. Unequip one first.');return false;}G.event('relic_equipped',{id,active:G.has(id),equipped:[...G.p.equipped]});return true;};
G.relicText=r=>{const rank=G.p?.relicRanks?.[r.id]||1;return r.text+(rank>1?' · Infusion resonance: all damage +'+((rank-1)*4)+'%.':'');};
const addTalent=G.addTalent;
G.addTalent=id=>{const old=G.lv(id);addTalent(id);if(G.lv(id)===old)return;if(id==='fleet')G.p.speed+=16;if(id==='iron_skin')G.p.armor++;};
const power=G.power;G.power=()=>power()*(G.p.hp>G.p.maxHp*.5?1+G.lv('resolve')*.08:1)*(1+(G.p.equipped||[]).reduce((sum,id)=>sum+Math.max(0,(G.p.relicRanks?.[id]||1)-1)*.04,0));
G.offerTalent=(then,context='level_up')=>{
 const offerCache=new Map();const show=(category='all',selected=null)=>{
  const pool=G.talentPool().filter(t=>category==='all'||t.category===category);if(!pool.length){then();return;}
  if(!offerCache.has(category))offerCache.set(category,G.selectGrowth?G.selectGrowth(pool):G.shuffle(pool).slice(0,4));const items=offerCache.get(category);
  G.offer('Choose an Upgrade','Choose the power you need.',items.map(t=>({...t,tag:(t.category==='active'?'Technique Upgrades':'Passives')+' · '+(G.lv(t.id)+1)+'  Rank',effect:{talent:t.id}})),t=>{G.addTalent(t.id);then();},context);
  const foot=G.$('.modal-foot');foot.insertAdjacentHTML('beforebegin',`<div class="growth-filters"><button data-growth="all">All</button><button data-growth="active">Technique Upgrades</button><button data-growth="passive">Passives</button><button id="rerollGrowth" ${G.p.rerolls<=0?'disabled':''}>Reroll · ${G.p.rerolls}</button></div>`);
  document.querySelectorAll('[data-growth]').forEach(b=>b.onclick=()=>{G.event('choice_skipped',{choice_id:G.choice.id,reason:'category_changed'});G.event('growth_category_selected',{category:b.dataset.growth});show(b.dataset.growth);});
  G.$('#rerollGrowth').onclick=()=>{if(G.p.rerolls<=0)return;G.p.rerolls--;G.event('choice_skipped',{choice_id:G.choice.id,reason:'reroll'});G.event('growth_rerolled',{category});offerCache.delete(category);show(category);};
 };show();
};
G.offerRelic=then=>{
 const boss=G.roomType==='boss'&&G.lastBoss, pool=G.relics.filter(r=>(boss?r.boss===G.lastBoss:!r.boss)&&(!G.owned(r.id)||(G.p.relicRanks[r.id]||1)<3));
 if(!pool.length){G.offerTalent(then,'relic_fallback');return;}
 G.offer(boss?G.bosses[G.lastBoss].name+' · Boss Relic':'Relics','Relics take effect on pickup. Duplicates upgrade the relic, up to rank 3.',G.shuffle(pool).slice(0,3).map(r=>({...r,tag:G.owned(r.id)?'Relic Upgrade':'Carried Relic',effect:{relic:r.id,upgrade:G.owned(r.id)}})),r=>{G.gainRelic(r.id);if(r.id==='blood_wrap')G.p.blackUnlocked=true;if(boss){G.event('boss_reward_selected',{boss:G.lastBoss,relic:r.id});if(G.session.actor_type==='human'&&!G.collection.includes(r.id)){G.collection.push(r.id);G.saveCollection();G.event('collection_unlocked',{id:r.id});}}then();},boss?'boss_loot':'relic_reward');
};
G.nextRoute=()=>{
 if(G.stage===3){G.act++;G.stage=0;if(G.act>=G.regions.length){G.finish('victory');return;}G.uiStory(G.act,()=>G.enterRoom('battle'));return;}
 G.stage++;
 if(G.stage===1)G.uiRoute([
  {id:'shop',name:'Lantern Merchant',icon:10,iconSet:'voyage',text:'Spend coins on passives, relics or healing.',tags:['shop','economy']},
  {id:'forge',name:'Flint Forge',icon:11,text:'Temper your weapon and armor, or infuse a relic.',tags:['equipment','upgrade']},
  {id:'shrine',name:'Sanctuary',icon:5,text:'Improve a technique or gain a passive.',tags:['talent']},
  {id:'event',name:'Chance Encounter',icon:10,text:'Campfires, lost belongings and invitations from strangers.',tags:['event','risk']}]);
 else if(G.stage===2)G.uiRoute([{id:'battle',name:'Quiet Path · Purification',icon:6,text:'Follow the lanterns along the path.',tags:['safety','talent']},{id:'elite',name:'Dangerous Path · Wild Spirits',icon:8,text:'Elite enemies guard better treasure.',tags:['risk','relic']}]);
 else G.uiRoute([{id:'boss',name:G.bosses[G.bossKey()].name,icon:0,text:'Prepare to face the god of this land.',tags:['boss']}]);
};
const enter=G.enterRoom;G.enterRoom=type=>{
 enter(type);G.ghosts=[];G.roomTarget=type==='elite'?20:16;G.shopStock=null;G.shopRefresh=0;
 if(type==='shop'){G.obstacles=[];G.interactable={x:G.W/2,y:G.H*.42,type};G.toast('Lantern Merchant · E to talk');}
 G.p.shield+=G.relicRank('gold_charm')+(G.has('mountain_rope')?1:0);
 if(type==='elite'){const e=G.spawn(G.regions[G.act].enemies[0]);e.elite=true;e.hp*=2.2;e.maxHp=e.hp;e.r+=4;e.name='Wild Spirit · '+e.name;}
};
G.completeSupport=()=>{G.event('support_room_completed',{kind:G.roomType});G.roomDone=true;G.nextRoute();};
G.forge=()=>{
 const p=G.p,price=20+p.weaponLevel*12,options=[
  {id:'sharpen',name:'Temper',icon:11,text:'Reforge your weapon to increase its power.',price,disabled:p.gold<price,tags:['weapon','upgrade']},
  {id:'armor',name:'Mend Armor',icon:5,text:'Increase damage reduction and restore HP.',price:25+p.armorLevel*15,disabled:p.gold<25+p.armorLevel*15,tags:['armor','upgrade']},
  ...p.relics.filter(id=>(p.relicRanks[id]||1)<3).map(id=>{const r=G.relics.find(r=>r.id===id),cost=35+(p.relicRanks[id]||1)*20;return {...r,id:'infuse_'+id,name:'Infuse · '+r.name,price:cost,disabled:p.gold<cost,relic:id,text:'Increase this relic’s rank and strengthen its effects.',tags:['relic','upgrade']};})
 ];
 G.offer('Flint Forge',`Coins ${p.gold} · The forge glows against your blade.`,options.map(x=>({...x,text:x.text+` · ${x.price} Coins`,effect:{cost:x.price}})),c=>{
  if(p.gold<c.price)return;p.gold-=c.price;let changed;
  if(c.id==='sharpen'){p.weaponLevel++;changed=p.weaponLevel===1?'Flint sparks catch in the reeds as the blade passes.':p.weaponLevel===3?'Light awakens in the blade. White streaks touch your hair, and your eyes turn gold.':'Your sword grows sharper.';}
  else if(c.id==='armor'){p.armor+=1;p.armorLevel++;p.maxHp+=12;p.hp=Math.min(p.maxHp,p.hp+20);changed='Your armor is repaired. Max HP and defense increase.';}
  else{G.gainRelic(c.relic);changed=G.relics.find(r=>r.id===c.relic).name+'  grows stronger.';}
  G.event('equipment_upgraded',{id:c.id,weapon_level:p.weaponLevel,cost:c.price});G.offer('At the Forge',changed,[{id:'continue',name:'Pack Up',icon:11,text:'Continue your journey.',tags:['continue']}],()=>G.completeSupport(),'upgrade_reveal');
 },'forge',G.completeSupport);
};
G.shop=()=>{
 const p=G.p;if(!G.shopStock){const ts=G.selectGrowth(G.talentPool()),rs=G.shuffle(G.relics.filter(r=>!r.boss&&(!G.owned(r.id)||(p.relicRanks[r.id]||1)<3)));G.shopStock=[
  ...ts.slice(0,3).map(t=>({...t,id:'learn_'+t.id,talent:t.id,price:28+G.act*5,tag:t.category==='active'?'Technique Upgrades':'Passives'})),
  ...rs.slice(0,2).map(r=>({...r,id:'buy_'+r.id,relic:r.id,price:G.owned(r.id)?45:55,tag:'Carried Relic'})),
  {id:'medicine',name:'Sacred Dew',icon:11,iconSet:'voyage',text:'Restore 45 HP.',price:20,tag:'Supplies'}];}
 const options=G.shopStock.filter(x=>!x.sold).map(x=>({...x,text:x.text+' · '+x.price+' Coins',disabled:p.gold<x.price||(x.id==='medicine'&&p.hp>=p.maxHp),effect:{cost:x.price,talent:x.talent,relic:x.relic}}));
 options.push({id:'refresh',name:'Browse New Stock',icon:10,iconSet:'voyage',text:'Spend 15 coins to refresh the stock. Once per visit.',disabled:G.shopRefresh>=1||p.gold<15,effect:{cost:15},tags:['reroll','shop']});
 G.offer('Lantern Merchant',`“A traveler should carry something for protection.” · Coins ${p.gold}`,options,c=>{
  if(c.id==='refresh'){if(p.gold<15||G.shopRefresh>=1)return;p.gold-=15;G.shopRefresh++;G.shopStock=null;G.event('shop_refreshed',{cost:15});G.shop();return;}
  const item=G.shopStock.find(x=>x.id===c.id);if(!item||item.sold||p.gold<item.price)return;p.gold-=item.price;item.sold=true;
  if(item.talent)G.addTalent(item.talent);else if(item.relic)G.gainRelic(item.relic);else p.hp=Math.min(p.maxHp,p.hp+45);
  G.event('shop_purchase',{id:item.id,cost:item.price,remaining:p.gold});G.shop();
 },'shop',G.completeSupport);
};
const interact=G.interact;G.interact=()=>{if(G.state!=='running'||!G.interactable||d(G.p,G.interactable)>110)return;if(G.roomType==='shop')G.shop();else if(G.roomType==='forge')G.forge();else if(G.roomType==='shrine')G.offerTalent(G.completeSupport,'talent_shrine');else interact();};
G.collectLoot=drop=>{if(drop.taken)return;drop.taken=true;if(drop.kind==='coin'){const amount=Math.max(1,Math.round(drop.value*(1+G.lv('fortune')*.2+G.relicRank('coin_pouch')*.25)));G.p.gold+=amount;G.float(drop.x,drop.y-20,'+'+amount+' Coins','#f7d995');G.event('loot_picked',{kind:'coin',amount});}else if(drop.kind==='chest'){G.gainRelic(drop.relic);G.event('loot_picked',{kind:'relic',id:drop.relic,source:drop.source});}else if(drop.kind==='essence'){G.p.power=Math.min(100,G.p.power+8);G.event('loot_picked',{kind:'essence',amount:8});}};
const die=G.die;G.die=e=>{
 if(e.dead)return;const at={x:e.x,y:e.y};G.deaths??=[];G.deaths.push({...e,life:.4,max:.4});
 if(!e.boss&&e.kind!=='seal'){
  if(G.rng()<.12||e.elite)G.drops.push({...at,kind:'coin',value:e.elite?8:1,r:9});
  if(G.rng()<.015)G.drops.push({x:e.x-12,y:e.y,kind:'essence',r:10});
  G.lootPity++;if(e.elite||G.lootPity>=60){G.lootPity=0;const pool=G.relics.filter(r=>!r.boss&&(!G.owned(r.id)||(G.p.relicRanks[r.id]||1)<3));if(pool.length){const r=G.pick(pool);G.drops.push({x:e.x+20,y:e.y,kind:'chest',relic:r.id,source:e.kind,r:17});G.event('loot_dropped',{kind:'relic',id:r.id,source:e.kind});G.toast('A wild spirit left a treasure chest');}}
 }
 die(e);if(!G.r2DerivedDamage&&G.has('sacred_flask')&&G.kills%12===0)G.p.hp=Math.min(G.p.maxHp,G.p.hp+4*G.relicRank('sacred_flask'));
};
const clear=G.clearRoom;G.clearRoom=()=>{if(G.roomDone)return;for(const drop of G.drops)if(['coin','chest','essence'].includes(drop.kind))G.collectLoot(drop);G.p.hp=Math.min(G.p.maxHp,G.p.hp+4*G.lv('harvest'));clear();};
let activeKind=null;
 const activeMultiplier=()=>((activeKind==='sword'?1+G.lv('sword_edge')*.18:activeKind==='water'?1+G.lv('water_force')*.18:1)*(activeKind?1+G.relicRank('sword_scroll')*.12:1));
 const projectile=G.projectile;G.projectile=(x,y,a,n=20,element='water',homing=false,copy=false)=>projectile(x,y,a,n*(copy?1:activeMultiplier()),element,homing,copy);
 
const hit=G.hit;G.hit=(e,n,element='sword',chain=false)=>{if(e.dead)return;const active=activeKind==='sword'?1+G.lv('sword_edge')*.18:activeKind==='water'?1+G.lv('water_force')*.18:1;const before=e.hp;hit(e,n*active*(activeKind?1+G.relicRank('sword_scroll')*.12:1),element,chain);if(before>e.hp){e.recoil=.16;e.recoilA=Math.atan2(e.y-G.p.y,e.x-G.p.x);if(!chain&&G.time>(e.sparkAt||0)){e.sparkAt=G.time+.15;G.effect(e.x,e.y-20,element==='fire'?1:0,65,.2);}}};
const hurt=G.hurt;G.hurt=(n,s)=>{const hp=G.p.hp;hurt(Math.max(1,n-G.relicRank('mountain_rope')-(G.p.hp<G.p.maxHp*.5?G.lv('resilience')*2:0)),s);if(G.p.hp<hp)G.p.hurtAnim=.25;};
const skill=G.skill;G.skill=()=>{const uses=G.metrics.skill_uses;activeKind='sword';try{skill();}finally{activeKind=null;}if(G.metrics.skill_uses===uses)return;const p=G.p;p.attackAnim=.46;p.skillCd*=1-G.lv('sword_tempo')*.08;for(let i=0;i<G.lv('blade_rain')*2;i++)G.projectile(p.x,p.y,i*Math.PI/3,25,'bird',true);if(G.lv('crescent'))G.burst(p.x,p.y,4*G.lv('crescent'),25,'water');if(G.has('storm_stone')){const targets=G.enemies.filter(e=>!e.dead).slice(0,G.relicRank('storm_stone'));for(const e of targets){G.hit(e,65,'thunder');G.effect(e.x,e.y,3,150,.45);}}};
const water=G.waterSkill;G.waterSkill=()=>{const uses=G.metrics.skill_uses,beforeZones=new Set(G.zones);activeKind='water';try{water();for(const z of G.zones)if(!beforeZones.has(z)&&z.friend)z.damage*=activeMultiplier();}finally{activeKind=null;}if(G.metrics.skill_uses===uses)return;const p=G.p;p.castAnim=.55;p.waterCd*=1-G.lv('water_tempo')*.08;if(G.lv('foam_guard')&&G.time>=(p.foamAt||0)){p.shield=Math.min(2,p.shield+1);p.foamAt=G.time+Math.max(10,22-4*G.lv('foam_guard'));};p.power=Math.min(100,p.power+6*G.lv('tide_charge'));if(G.has('tide_pearl'))p.hp=Math.min(p.maxHp,p.hp+6*G.relicRank('tide_pearl'));if(G.has('coral_spear'))for(let i=0;i<2+G.relicRank('coral_spear');i++)G.projectile(p.x,p.y,p.facing+(i-1)*.18,55,'water');};
const dash=G.dash;G.dash=()=>{const before=G.metrics.dashes;dash();if(before===G.metrics.dashes)return;const p=G.p;if(G.has('home_shell'))p.waterCd=Math.max(0,p.waterCd-.8*G.relicRank('home_shell'));const damage=20*G.lv('dash_echo')+40*G.relicRank('mountain_fang');if(damage)G.zones.push({x:p.x+p.dx*130,y:p.y+p.dy*130,r:130,age:0,delay:.45,life:.9,friend:true,damage,element:'bird',once:true});};
const awaken=G.awaken;G.awaken=()=>{const n=G.metrics.awakening_uses;awaken();if(n!==G.metrics.awakening_uses){G.p.castAnim=.8;for(let i=0;i<6*G.lv('wake_bloom');i++)G.projectile(G.p.x,G.p.y,i*.8,45,'bird',true);}};
const attack=G.attack;G.attack=()=>{const at=G.p.attackAt;attack();if(G.p.attackAt>at){G.p.attackAnim=.32;G.p.attackAt=G.time+(G.p.attackAt-G.time)*(1-G.lv('focus')*.06);}};
const trigger=G.event;G.event=(type,data={})=>{trigger(type,data);if(type==='boss_relic_trigger'&&G.p){const rank=G.relicRank(data.id);if(rank>1){G.p.power=Math.min(100,G.p.power+(rank-1)*.5);G.effect(G.p.x,G.p.y,5,210,.35);for(const e of [...G.enemies])if(d(e,G.p)<140)G.hit(e,(rank-1)*16,'relic',true);}}};
const resonanceEvent=G.event;G.event=(type,data={})=>{resonanceEvent(type,data);if(!G.p||!['active_skill','dash','awakening','damage_taken'].includes(type))return;for(const id of G.p.equipped||[]){const r=G.relics.find(r=>r.id===id),rank=G.relicRank(id);if(rank<=1||r.mythic||r.boss||['coin_pouch','sacred_flask','sword_scroll','gold_charm'].includes(id))continue;G.p.resonanceAt??={};if(G.time<(G.p.resonanceAt[id]||0))continue;G.p.resonanceAt[id]=G.time+1;G.p.power=Math.min(100,G.p.power+(rank-1)*2);G.effect(G.p.x,G.p.y,5,200,.3);for(const e of [...G.enemies])if(d(e,G.p)<140)G.hit(e,(rank-1)*16,'relic',true);resonanceEvent('relic_resonance',{id,rank});}};
 const spawn=G.spawn;G.spawn=kind=>{const e=spawn(kind);e.animSeed=G.rng()*10;if(['boar','crab','siren'].includes(kind)){e.specialAt=G.time+2;e.attackAt=Infinity;}return e;};
const spawnBoss=G.spawnBoss;G.spawnBoss=()=>{spawnBoss();if(['aragami','sea'].includes(G.boss.kind)){G.boss.attackAt=Infinity;G.boss.specialAt=Infinity;G.boss.godAt=G.time+1.8;}};
const updateEnemies=G.updateEnemies;G.updateEnemies=dt=>{for(const e of G.enemies){if(e.dead)continue;if(G.time>=e.specialAt&&['boar','crab','siren'].includes(e.kind)){e.specialAt=G.time+3.5;e.castAnim=.6;const a=Math.atan2(G.p.y-e.y,G.p.x-e.x);if(e.kind==='boar'){e.aim=a;e.windup=.7;}else if(e.kind==='crab')G.danger(G.p.x,G.p.y,65,.85);else for(let i=-1;i<=1;i++)G.hostileShot(e,a+i*.25,145);}}updateEnemies(dt);};
const update=G.update;G.update=dt=>{
 if(G.state!=='running')return;const p=G.p;
 for(const e of [p,...G.enemies])for(const key of ['attackAnim','castAnim','hurtAnim','recoil'])e[key]=Math.max(0,(e[key]||0)-dt);
 if(p.dashTime>0){G.ghosts.push({x:p.x,y:p.y,form:G.formIndex(),life:.22,dx:p.dx});}G.ghosts=G.ghosts.filter(g=>(g.life-=dt)>0).slice(-7);G.deaths=(G.deaths||[]).filter(g=>(g.life-=dt)>0);
 for(const drop of G.drops){if(['coin','chest','essence'].includes(drop.kind)){const dist=d(p,drop);if(dist<110+G.lv('magnet')*45){const a=Math.atan2(p.y-drop.y,p.x-drop.x);drop.x+=Math.cos(a)*Math.min(dist,380*dt);drop.y+=Math.sin(a)*Math.min(dist,380*dt);}if(dist<30)G.collectLoot(drop);}else if(drop.kind==='xp'&&!drop.enriched){drop.value*=1+G.lv('soulwell')*.15;drop.enriched=true;}}
 const specials=G.drops.filter(x=>['coin','chest','essence'].includes(x.kind)&&!x.taken);G.drops=G.drops.filter(x=>!['coin','chest','essence'].includes(x.kind));
 const b=G.boss;if(b&&['aragami','sea'].includes(b.kind)&&G.time>=b.godAt){b.godAt=G.time+(b.combatPhase===2?3:4);b.castAnim=.75;G.event('god_pattern',{kind:b.kind,phase:b.combatPhase});
  if(b.kind==='aragami'){b.aim=Math.atan2(p.y-b.y,p.x-b.x);b.windup=.9;for(let i=0;i<(b.combatPhase===2?4:3);i++)G.danger(G.clamp(p.x+i*110-110,130,1310),G.clamp(p.y+(i%2)*90,230,740),65,1.1+i*.25);if(b.combatPhase===2&&G.enemies.length<8)G.spawn('boar');}
  else{const safe=G.clamp(p.y,285,670);for(const y of [220,345,470,595,720])if(Math.abs(y-safe)>90)G.danger(720,y,70,1.3+Math.abs(y-safe)*.001,'hline');for(let i=0;i<12;i++){const a=i*Math.PI/6;if(Math.abs(Math.sin(a))>.3)G.hostileShot(b,a,135);}if(b.combatPhase===2&&G.enemies.length<8)G.spawn('siren');}
 }
 update(dt);G.drops.push(...specials.filter(d=>!d.taken));
};
const summary=G.summary;G.summary=()=>({...summary(),equipped_relics:[...G.p?.equipped||[]],relic_ranks:{...G.p?.relicRanks},gold:G.p?.gold,chapters:G.regions.length});
})();
