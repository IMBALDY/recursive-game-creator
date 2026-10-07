'use strict';
(() => {
const G=WB, W=G.W,H=G.H;
G.$=s=>document.querySelector(s);G.clamp=(v,a,b)=>Math.max(a,Math.min(b,v));G.distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const {clamp,distance:d}=G;
G.state='home';G.time=0;G.keys=new Set();G.enemies=[];G.shots=[];G.hostile=[];G.drops=[];G.zones=[];G.fx=[];G.obstacles=[];G.boss=null;G.p=null;G.session=null;G.choiceId=0;G.choice=null;G.sound=true;G.ready=false;
const STORE='whitebird.sessions.rsi.en',ACTIVE='whitebird.active.rsi.en';
G.records=[];try{G.records=JSON.parse(localStorage.getItem(STORE)||'[]');if(!Array.isArray(G.records))G.records=[];let r=JSON.parse(localStorage.getItem(ACTIVE)||'null');if(r?.actor_type==='human'&&!G.records.some(x=>x.session_id===r.session_id)){r.status='interrupted';G.records.unshift(r);localStorage.setItem(STORE,JSON.stringify(G.records));localStorage.removeItem(ACTIVE);}}catch{}
G.event=(type,data={})=>{if(G.session)G.session.events.push({seq:G.session.events.length,t:+G.time.toFixed(3),type,...data});};
G.rng=()=>.5;
function randomSeed(s){let a=s>>>0;return()=>{a+=0x6D2B79F5;let t=Math.imul(a^a>>>15,1|a);t^=t+Math.imul(t^t>>>7,61|t);return((t^t>>>14)>>>0)/4294967296;};}
G.pick=arr=>arr[Math.floor(G.rng()*arr.length)];
G.shuffle=arr=>{arr=[...arr];for(let i=arr.length-1;i>0;i--){let j=Math.floor(G.rng()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}return arr;};
G.lv=id=>G.p?.talents[id]||0;G.has=id=>G.p?.relics.includes(id);
G.power=()=>{const p=G.p;return (1+p.weaponLevel*.19)*(1+(G.has('bead')&&['water','fire','bird'].every(k=>G.lv(k)>0)?.25:0))*p.damage;};
G.summary=()=>({kills:G.kills,level:G.p?.level||1,hp:Math.ceil(G.p?.hp||0),max_hp:G.p?.maxHp||100,build:{...G.p?.talents},weapon:G.p?.weapon,weapon_level:G.p?.weaponLevel,relics:[...G.p?.relics||[]],rooms:G.route?.length||0,bosses_defeated:G.bossKills,...G.metrics});
G.persist=(active=false)=>{if(!G.session)return;G.session.duration=+G.time.toFixed(3);G.session.summary=G.summary();try{if(active)localStorage.setItem(ACTIVE,JSON.stringify(G.session));else{G.records=G.records.filter(r=>r.session_id!==G.session.session_id);G.records.unshift(JSON.parse(JSON.stringify(G.session)));localStorage.setItem(STORE,JSON.stringify(G.records));localStorage.removeItem(ACTIVE);}}catch{G.notice('Local storage is full. Please export your journal.');}};
G.upload=async()=>{if(!G.session)return;G.persist();G.notice('Run history is stored in this browser. You can export it as JSON.');};
G.download=(record=G.session)=>{if(!record)return;const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(record,null,2)],{type:'application/json'}));a.download=`whitebird-v2-${record.actor_type}-${record.session_id}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);};
G.start=(actor='human',seed=Math.floor(Math.random()*2147483647))=>{
 if(!G.ready){G.notice('Artwork is still loading. Please wait.');return;}
 if(G.session&&!G.ended){G.event('run_end',{outcome:'abandoned'});G.session.status='abandoned';G.persist();}
 Object.assign(G,{seed,rng:randomSeed(seed),time:0,roomTime:0,kills:0,nextId:1,choiceId:0,choice:null,act:0,stage:0,route:[],bossKills:0,ended:false,sampleAt:0,checkpointAt:0,spawnAt:0,boss:null,enemies:[],shots:[],hostile:[],drops:[],zones:[],fx:[],obstacles:[],metrics:{damage_taken:0,dashes:0,skill_uses:0,awakening_uses:0,food_used:0,choices:0,synergies:0}});G.keys.clear();
 G.p={x:W/2,y:H*.6,r:16,hp:110,maxHp:110,speed:228,level:1,xp:0,nextXp:30,gold:25,weapon:'tide',weaponLevel:0,armor:0,armorLevel:0,talents:{},relics:[],power:0,damage:1,attackAt:0,fireAt:0,thunderAt:0,vortexAt:0,dashCd:0,dashTime:0,skillCd:0,inv:0,dx:0,dy:-1,facing:0,shield:0,regen:0};
 G.session={schema_version:1,session_id:crypto.randomUUID(),actor_type:actor,build_hash:WHITEBIRD_BUILD.hash,version:WHITEBIRD_BUILD.version,seed,started_at:new Date().toISOString(),viewport:{width:innerWidth,height:innerHeight},status:'playing',duration:0,events:[],feedback:null};
 G.event('run_start',{mode:'short_rooms',controls:'WASD move / SPACE dash / F sword art / Q awakening / E interact / C character / M map',unlocks:[]});
 G.activate('play');G.resize();G.uiStory(0,()=>G.offer('Starting Weapon','Choose a weapon for this journey.',G.weapons.map(w=>({...w,effect:{weapon:w.id},tags:[w.tag]})),w=>{G.p.weapon=w.id;G.p.talents[({tide:'water',ember:'fire',wing:'bird',jade:'orbit',mirror:'ward',spear:'sword_edge',hammer:'thunder',talisman:'focus',comb:'leech',shaku:'crit',flute:'bird',divine:'sword_edge'}[w.id]||'water')]=1;G.chooseRune(()=>G.enterRoom('battle'));},'starting_weapon'));
 G.persist(true);
};
G.enterRoom=type=>{
 G.roomType=type;G.roomTime=0;G.spawnAt=.8;G.roomDone=false;G.choice=null;G.enemies=[];G.shots=[];G.hostile=[];G.drops=[];G.zones=[];G.fx=[];G.boss=null;G.keys.clear();G.p.x=W/2;G.p.y=H*.63;G.p.inv=1.5;G.p.shield=G.lv('ward')+(G.has('mirror')?1:0);G.p.combUsed=false;G.p.skillCd=0;G.p.dashCd=0;
 G.roomTarget=type==='elite'?25:22;G.roomQuota=type==='elite'?18:15;G.roomKills=0;
 G.obstacles=type==='boss'?[]:[{x:330+(G.act*51)%100,y:345,r:35},{x:1070,y:590,r:38}];
 G.route.push({act:G.act,stage:G.stage,type});G.event('room_entered',{act:G.act,stage:G.stage,kind:type,weapon:G.p.weapon,build:{...G.p.talents},relics:[...G.p.relics]});
 G.hideModal();G.state='running';G.toast(G.regions[G.act].short+' · '+(G.roomNames?.[type]||{battle:'Purification Grounds',elite:'Wild Spirit Trial',forge:'Flint Forge',shrine:'Sanctuary',event:'Chance Encounter',boss:'Seat of the Wild Spirit'}[type]||'Homeward Path'));
 if(['forge','shrine','event'].includes(type)){G.obstacles=[];G.interactable={x:W/2,y:H*.42,type};}else G.interactable=null;
 if(type==='boss'){G.spawnBoss();G.uiBoss(()=>{G.state='running';G.hideModal();});}
 G.persist(true);G.updateHud();
};
G.nextRoute=()=>{
 if(G.stage===3){G.act++;G.stage=0;if(G.act>=3){G.finish('victory');return;}G.uiStory(G.act,()=>G.enterRoom('battle'));return;}
 G.stage++;
 if(G.stage===1)G.uiRoute([
  {id:'forge',name:'Flint Forge',icon:11,text:'Spend coins to forge a weapon, reinforce armor or change weapons.',tags:['equipment','damage']},
  {id:'shrine',name:'Sanctuary',icon:5,text:'Upgrade an existing talent for free or gain a new passive.',tags:['talent','specialization']},
  {id:'event',name:'Chance Encounter',icon:10,text:'Meet a nameless traveler: share a meal, find a relic or make a costly bargain.',tags:['event','risk']}
 ]);
 else if(G.stage===2)G.uiRoute([
  {id:'battle',name:'Quiet Path · Purification',icon:6,text:'22  s combat. Rewards a passive and 30 coins.',tags:['safety','talent']},
  {id:'elite',name:'Dangerous Path · Wild Spirits',icon:8,text:'More enemies. Rewards a rare relic and 55 coins.',tags:['risk','relic']}
 ]);
 else G.uiRoute([{id:'boss',name:G.bosses[G.bossKey()].name,icon:0,text:'Defeat the spirit of this land to reach the next chapter. Restore 15 HP before entering.',tags:['boss']}]);
};
G.clearRoom=()=>{
 if(G.roomDone||G.ended)return;G.roomDone=true;G.state='reward';G.hostile=[];G.zones=[];G.enemies=[];G.shots=[];G.p.hp=Math.min(G.p.maxHp,G.p.hp+8);
 const gold=G.roomType==='elite'?55:G.roomType==='boss'?60:30;G.p.gold+=gold;G.event('room_cleared',{act:G.act,stage:G.stage,kind:G.roomType,gold,duration:+G.roomTime.toFixed(2)});G.toast('Room cleared · Coins +'+gold);
 if(G.roomType==='elite'||G.roomType==='boss')G.offerRelic(()=>G.nextRoute());else G.offerTalent(()=>G.nextRoute(),'room_reward');
};
G.talentPool=()=>G.talents.filter(c=>G.lv(c.id)<c.max&&(!c.requires||(c.requires==='fusion'?G.lv('water')&&G.lv('fire'):G.lv(c.requires)>0)));
G.addTalent=id=>{const t=G.talents.find(c=>c.id===id);if(!t||G.lv(id)>=t.max)return;G.p.talents[id]=G.lv(id)+1;if(id==='comb'){G.p.maxHp+=18;G.p.hp=Math.min(G.p.maxHp,G.p.hp+18);}if(id==='magnet')G.p.speed+=12;if(id==='ward')G.p.shield++;G.event('talent_gained',{id,level:G.lv(id)});};
G.offerTalent=(then,context='level_up')=>{let pool=G.shuffle(G.talentPool());if(!pool.length){G.p.gold+=15;then();return;}G.offer('A New Gift','Talents change your techniques. Check their requirements and synergies.',pool.slice(0,3).map(t=>({...t,text:t.text+` · ${G.lv(t.id)}/${t.max}  Rank`,effect:{talent:t.id}})),t=>{G.addTalent(t.id);then();},context);};
G.offerRelic=then=>{let pool=G.shuffle(G.relics.filter(r=>!r.boss&&!G.has(r.id)));if(!pool.length){G.offerTalent(then,'relic_fallback');return;}G.offer('Mythic Relics','Relics change how your techniques trigger. Their effects last for this run.',pool.slice(0,3).map(r=>({...r,rare:true,effect:{relic:r.id}})),r=>{G.p.relics.push(r.id);G.event('relic_gained',{id:r.id});then();},'relic_reward');};
G.interact=()=>{
 if(G.state!=='running'||!G.interactable||d(G.p,G.interactable)>110)return;
 const p=G.p,complete=()=>{G.event('support_room_completed',{kind:G.roomType});G.roomDone=true;G.nextRoute();};
 if(G.roomType==='forge'){
  const price=30+p.weaponLevel*15,armorPrice=25+p.armorLevel*15;
  G.offer('Flint Forge',`Coins ${p.gold} · Upgrades last until the end of this run.`,[
   {id:'sharpen',name:'Temper',icon:11,text:`Weapon rank +1. Base damage multiplier +19%. Cost: ${price}  coins.`,disabled:p.gold<price,effect:{cost:price,weaponLevel:1},tags:['damage','upgrade']},
   {id:'armor',name:'Mend Armor',icon:5,text:`Damage reduction +2, max HP +12, restore 20 HP. Cost: ${armorPrice}  coins.`,disabled:p.gold<armorPrice,effect:{cost:armorPrice,armor:2},tags:['survival','upgrade']},
   {id:'reforge',name:'Change Weapon',icon:0,text:'Change weapons for free. Keep your upgrade level.',tags:['weapon','experiment'],effect:{change_weapon:true}}
  ],c=>{if(c.id==='reforge'){G.offer('A New Weapon','Choose another attack style. Your upgrade level stays the same.',G.weapons.map(w=>({...w,tags:[w.tag],effect:{weapon:w.id}})),w=>{p.weapon=w.id;complete();},'weapon_swap');return;}p.gold-=c.effect.cost;if(c.id==='sharpen')p.weaponLevel++;else{p.armor+=2;p.armorLevel++;p.maxHp+=12;p.hp=Math.min(p.maxHp,p.hp+20);}complete();},'forge',complete);
 }else if(G.roomType==='shrine'){
  const owned=G.shuffle(G.talentPool().filter(t=>G.lv(t.id)>0));
  const pool=[...owned,...G.shuffle(G.talentPool().filter(t=>!G.lv(t.id)))].slice(0,3);
  G.offer('Sanctuary','Choose a talent to upgrade by one rank.',pool.map(t=>({...t,text:t.text+` · Current ${G.lv(t.id)}  Rank`,effect:{talent:t.id}})),t=>{G.addTalent(t.id);complete();},'talent_shrine');
 }else{
  const relic=G.pick(G.relics.filter(r=>!r.boss&&!G.has(r.id)));
  G.offer('The Traveler’s Rice Ball','“Swordsman, you should eat before dawn.”',[{id:'meal',name:'Sit by the Fire',icon:9,text:'Restore 45 HP and gain 15 coins.',effect:{heal:45,gold:15},tags:['recovery','safety']},{id:'oath',name:'Borrow Magatsu’s Fire',icon:7,text:'All damage +25%. Max HP −18 for this run.',effect:{damage:.25,maxHp:-18},tags:['risk','damage']},{id:'memory',name:'Pick Up the Lost Item',icon:relic?.icon||4,text:relic?`Lose 20 HP and gain [${relic.name}]: ${relic.text}`:'Spend 10 coins to restore 30 HP.',disabled:relic?p.hp<=20:p.gold<10,effect:relic?{relic:relic.id,hp:-20}:{gold:-10,heal:30},tags:['relic','trade']}],c=>{if(c.id==='meal'){p.hp=Math.min(p.maxHp,p.hp+45);p.gold+=15;}else if(c.id==='oath'){p.damage+=.25;p.maxHp=Math.max(30,p.maxHp-18);p.hp=Math.min(p.hp,p.maxHp);}else if(relic){p.hp-=20;p.relics.push(relic.id);G.event('relic_gained',{id:relic.id});}else{p.gold-=10;p.hp=Math.min(p.maxHp,p.hp+30);}complete();},'encounter');
 }
};
G.spawn=kind=>{
 const def=G.enemyDefs[kind],a=G.rng()*Math.PI*2;let x=clamp(G.p.x+Math.cos(a)*540,90,W-90),y=clamp(G.p.y+Math.sin(a)*360,175,H-135);if(Math.hypot(x-G.p.x,y-G.p.y)<250){x=G.p.x<W/2?W-120:120;y=200+G.rng()*500;}
 let mult=(1+G.act*.25)*(G.roomType==='elite'?1.25:1);const e={...def,id:G.nextId++,kind,x,y,hp:def.hp*mult,maxHp:def.hp*mult,attackAt:G.time+2+G.rng(),wet:0,burn:0,flash:0,phase:0};G.enemies.push(e);return e;
};
G.spawnBoss=()=>{const kind=G.bossKey(),def=G.bosses[kind];G.boss={...def,kind,boss:true,id:G.nextId++,x:W/2,y:310,maxHp:def.hp,attackAt:G.time+2,wet:0,burn:0,flash:0,phase:0};G.enemies.push(G.boss);G.event('boss_appeared',{kind});if(kind==='father')for(let i=0;i<3;i++)G.enemies.push({id:G.nextId++,kind:'seal',name:'Edict Seal',x:430+i*290,y:390+(i%2)*180,hp:60,maxHp:60,r:22,speed:0,wet:0,burn:0,flash:0});};
G.hit=(e,amount,element='sword',chain=false)=>{
 if(e.dead||!Number.isFinite(amount)||amount<=0||!Number.isFinite(e.hp)||e.hp<=0)return;let damage=amount*G.power();if(!Number.isFinite(damage)||damage<=0)return;if(G.rng()<(G.combatStats?.().critChance??G.lv('crit')*.12)){damage*=G.combatStats?.().critDamage??1.8;G.float(e.x,e.y-40,Math.round(damage)+'!','#ffe8a1');}
 if(e.kind==='father'&&G.enemies.some(x=>x.kind==='seal'&&!x.dead))damage*=.25;
 if(element==='water')e.wet=3;
 if(element==='fire'){if(G.lv('burn'))e.burn=3;if(e.wet>0&&!chain){e.wet=0;damage*=1.5;G.metrics.synergies++;if(G.lv('steam')){G.effect(e.x,e.y,4,125,.5);for(const n of G.enemies)if(n!==e&&!n.dead&&d(e,n)<120)G.hit(n,24,'steam',true);}if(G.metrics.synergies%8===1)G.event('synergy',{name:'steam',enemy_id:e.id});}}
 if(!Number.isFinite(damage)||damage<=0)return;damage=G.resolveBossDamage?.(e,damage)??damage;const hpBefore=e.hp;e.hp=Math.max(0,e.hp-damage);G.r2AccountDamage?.(e,hpBefore,e.hp);e.flash=.09;
 if(e.hp<=0)G.die(e);else if(!e.boss&&e.kind!=='seal'){const a=Math.atan2(e.y-G.p.y,e.x-G.p.x);e.x+=Math.cos(a)*3;e.y+=Math.sin(a)*3;}
};
G.die=e=>{if(e.dead)return;e.dead=true;G.kills++;if(e.kind!=='seal')G.roomKills++;G.p.power=Math.min(100,G.p.power+(e.boss?18:1.1)*(1+G.lv('awakening')*.25));G.particles(e.x,e.y,e.color||'#e5c991',e.boss?25:6);G.event('enemy_defeated',{enemy_id:e.id,kind:e.kind,boss:!!e.boss});G.drops.push({x:e.x,y:e.y,kind:'xp',value:e.boss?10:1,r:6});
 if(!G.r2DerivedDamage&&G.lv('leech')&&G.kills%10===0)G.p.hp=Math.min(G.p.maxHp,G.p.hp+3*G.lv('leech'));
 if(!G.r2DerivedDamage&&G.lv('nova')&&G.kills%8===0){G.effect(e.x,e.y,1,150,.5);for(const n of [...G.enemies])if(n!==e&&!n.dead&&d(e,n)<125)G.hit(n,25*G.lv('nova'),'fire',true);}
 if(e.boss){G.event(e.trialBoss?'trial_boss_defeated':'boss_defeated',{kind:e.kind});if(e.trialBoss){G.currentNode.trialBossKilled=true;G.currentNode.trialLootAt={x:G.clamp(e.x,150,1290),y:G.clamp(e.y,240,700)};}else G.bossKills++;G.boss=null;G.clearRoom();return;}
 if(G.kills%45===0||G.rng()<.006)G.drops.push({x:e.x+16,y:e.y,kind:G.rng()<.65?'rice':'dango',r:12});
 if(e.kind==='wraith'&&G.enemies.length<55){const n=G.spawn('yomotsu');n.x=e.x+25;n.y=e.y;n.hp=15;n.maxHp=15;n.split=true;}
};
G.hurt=(amount,source)=>{const p=G.p;if(G.state!=='running'||p.inv>0||p.dashTime>0)return;p.inv=.65;if(p.shield>0){p.shield--;G.effect(p.x,p.y,5,110,.45);G.event('shield_broken',{source});if(G.has('mirror'))G.burst(p.x,p.y,12,18);return;}const dmg=Math.max(1,amount-p.armor-G.lv('ward'));p.hp=Math.max(0,p.hp-dmg);G.metrics.damage_taken+=dmg;G.event('damage_taken',{amount:dmg,source,hp:p.hp,position:[p.x,p.y]});G.float(p.x,p.y-50,'−'+dmg,'#ffaaaa');G.shake=6;G.beep(110,.13);if(G.has('comb')&&!p.combUsed&&p.hp<p.maxHp*.3&&p.hp>0){p.combUsed=true;p.hp=Math.min(p.maxHp,p.hp+35);G.float(p.x,p.y-70,'Comb +35','#a7e5d4');G.event('relic_triggered',{id:'comb'});}if(p.hp<=0)G.finish('defeat');};
G.projectile=(x,y,a,damage=20,element='water',homing=false)=>{G.shots.push({x,y,a,vx:Math.cos(a)*500,vy:Math.sin(a)*500,damage,element,homing,life:1.35,age:0,hits:new Set(),pierce:element==='water'?2+G.lv('water'):1,returning:false,r:10});};
G.burst=(x,y,count,damage,element='water')=>{for(let i=0;i<count;i++)G.projectile(x,y,i/count*Math.PI*2,damage,element);};
G.nearest=(origin=G.p)=>G.enemies.filter(e=>!e.dead).sort((a,b)=>d(origin,a)-d(origin,b))[0];
G.dash=()=>{const p=G.p;if(G.state!=='running'||p.dashCd>0)return;const v=G.moveVector();if(v.x||v.y){p.dx=v.x;p.dy=v.y;}p.dashTime=.2;p.dashCd=Math.max(.65,2.2-G.lv('bird')*.25-(p.weapon==='wing'?.35:0));G.metrics.dashes++;G.event('dash',{position:[p.x,p.y],hp:p.hp});G.effect(p.x,p.y,2,100,.35);if(G.lv('feather')){const e=G.nearest();for(let i=0;i<3+G.lv('feather');i++)G.projectile(p.x,p.y,(e?Math.atan2(e.y-p.y,e.x-p.x):0)+(i-2)*.3,19,'bird',true);}if(G.has('feather'))G.zones.push({x:p.x,y:p.y,r:110,age:0,delay:.6,life:1,friend:true,damage:45,element:'bird',once:true});G.beep(650,.1);};
G.skill=()=>{const p=G.p;if(G.state!=='running'||p.skillCd>0)return;p.skillCd=5.5;G.metrics.skill_uses++;G.event('active_skill',{weapon:p.weapon});const e=G.nearest(),a=e?Math.atan2(e.y-p.y,e.x-p.x):p.facing;
 if(p.weapon==='tide'){for(let i=-2;i<=2;i++)G.projectile(p.x,p.y,a+i*.25,48,'water');G.effect(p.x,p.y,0,210,.5,a);}
 if(p.weapon==='ember'){G.effect(p.x,p.y,1,360,.6);for(const n of [...G.enemies])if(d(p,n)<190)G.hit(n,80,'fire');}
 if(p.weapon==='wing'){for(let i=0;i<9;i++)G.projectile(p.x,p.y,i/9*Math.PI*2,32,'bird',true);G.effect(p.x,p.y,2,250,.6);}
 if(G.has('flint'))G.zones.push({x:p.x,y:p.y,r:130,age:0,delay:0,life:4,friend:true,damage:24,element:'fire',tick:0});
 if(G.has('drum')&&G.metrics.skill_uses%3===0){p.skillCd=0;for(const n of [...G.enemies]){G.hit(n,35,'thunder');G.effect(n.x,n.y,3,100,.35);}G.event('relic_triggered',{id:'drum'});}G.beep(480,.25);
};
G.awaken=()=>{const p=G.p;if(G.state!=='running'||p.power<100)return;p.power=0;p.inv=2;p.hp=Math.min(p.maxHp,p.hp+G.lv('awakening')*8);G.metrics.awakening_uses++;G.event('awakening');G.hostile=[];G.effect(p.x,p.y,2,1000,1.1);G.shake=10;for(const n of [...G.enemies])G.hit(n,210,'bird');G.toast('Heavenward · Whitebird Crossing');G.beep(800,.5);};
G.moveVector=()=>{let x=(G.keys.has('KeyD')||G.keys.has('ArrowRight')?1:0)-(G.keys.has('KeyA')||G.keys.has('ArrowLeft')?1:0),y=(G.keys.has('KeyS')||G.keys.has('ArrowDown')?1:0)-(G.keys.has('KeyW')||G.keys.has('ArrowUp')?1:0),l=Math.hypot(x,y);return{x:l?x/l:0,y:l?y/l:0};};
G.collision=e=>{e.x=clamp(e.x,80,W-80);e.y=clamp(e.y,175,H-120);for(const o of G.obstacles){let dx=e.x-o.x,dy=e.y-o.y,dist=Math.hypot(dx,dy),r=e.r+o.r;if(dist<r){if(dist<.01){dx=1;dist=1;}e.x=o.x+dx/dist*r;e.y=o.y+dy/dist*r;}}};
G.danger=(x,y,r=90,delay=1,kind='circle')=>G.zones.push({x,y,r,delay,age:0,life:delay+.25,kind,hit:false});
G.hostileShot=(e,a,speed=140)=>{if(G.hostile.length<150)G.hostile.push({x:e.x,y:e.y,vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,r:7,life:6});};
G.updateEnemies=dt=>{for(const e of [...G.enemies]){if(e.dead)continue;e.flash=Math.max(0,e.flash-dt);e.wet=Math.max(0,e.wet-dt);if(e.burn>0){e.burn-=dt;e.burnTick=(e.burnTick||0)+dt;if(e.burnTick>.5){e.burnTick=0;G.hit(e,3.5*G.lv('burn'),'burn',true);if(e.dead)continue;}}if(e.kind==='seal')continue;const a=Math.atan2(G.p.y-e.y,G.p.x-e.x),distance=d(e,G.p);if(e.charge>0){e.charge-=dt;e.x+=Math.cos(e.aim)*420*dt;e.y+=Math.sin(e.aim)*420*dt;}else if(e.windup>0){e.windup-=dt;if(e.windup<=0)e.charge=.5;}else if(distance>e.r+G.p.r){let factor=e.wet>0?1-Math.min(.3,G.lv('ice')*.18):1;if(['fox','thunder'].includes(e.kind)&&distance<270)factor*=-.3;e.x+=Math.cos(a)*e.speed*dt*factor;e.y+=Math.sin(a)*e.speed*dt*factor;}G.collision(e);
 if(distance<e.r+G.p.r-4)G.hurt(e.boss?17:e.kind==='yomotsu'?8:10,e.kind);
 if(G.time>=e.attackAt){e.phase++;if(e.boss){if(e.kind==='guardian'){G.danger(G.p.x,G.p.y,95,1.1);if(e.hp<e.maxHp*.5){G.danger(G.p.x+150,G.p.y,85,1.4);G.spawn('kodama');}e.attackAt=G.time+2.7;}else if(e.kind==='father'){G.danger(G.p.x,G.p.y,90,1.1,'line');if(e.phase%2===0)G.danger(G.p.x+190,G.p.y,90,1.45,'line');if(e.phase%3===0)G.spawn('soldier');e.attackAt=G.time+3;}else{const gap=(e.phase*3)%16;for(let i=0;i<16;i++)if(![gap,(gap+1)%16,(gap+2)%16].includes(i))G.hostileShot(e,i*Math.PI/8,e.hp<e.maxHp/2?170:125);G.danger(G.p.x,G.p.y,80,1.2);e.attackAt=G.time+(e.hp<e.maxHp/2?2:2.8);}}else if(e.kind==='thunder'){for(let i=-1;i<=1;i++)G.hostileShot(e,a+i*.2,145);e.attackAt=G.time+3.4;}else if(e.kind==='fox'){G.hostileShot(e,a,175);e.attackAt=G.time+2.6;}else if(e.kind==='soldier'){e.windup=.75;e.aim=a;e.attackAt=G.time+4;}else e.attackAt=G.time+4;}}
 G.enemies=G.enemies.filter(e=>!e.dead);
};
G.attack=()=>{const p=G.p,n=G.nearest();if(n&&G.time>=p.attackAt){const a=Math.atan2(n.y-p.y,n.x-p.x);p.facing=a;let count=p.weapon==='wing'?2:1+Math.min(4,G.lv('water'));for(let i=0;i<count;i++)G.projectile(p.x,p.y,a+(i-(count-1)/2)*.16,p.weapon==='ember'?16:21+G.lv('water')*3,p.weapon==='wing'?'bird':'water',p.weapon==='wing');p.attackAt=G.time+(p.weapon==='ember'?.4:.62);G.effect(p.x+Math.cos(a)*35,p.y+Math.sin(a)*35,0,130,.22,a);for(const e of [...G.enemies])if(d(e,p)<100)G.hit(e,p.weapon==='ember'?38:24,p.weapon==='ember'?'fire':'sword');}
 if(G.lv('fire')&&G.time>=p.fireAt){const r=95+G.lv('fire')*14;G.effect(p.x,p.y,1,r*2,.42);for(const e of [...G.enemies])if(d(e,p)<r+e.r)G.hit(e,24+G.lv('fire')*12,'fire');p.fireAt=G.time+1.8;}
 if(n&&G.lv('thunder')&&G.time>=p.thunderAt){const targets=G.enemies.filter(e=>!e.dead).sort((a,b)=>d(n,a)-d(n,b)).slice(0,2+G.lv('thunder'));for(const e of targets){G.hit(e,30+G.lv('thunder')*8,'thunder');G.effect(e.x,e.y,3,100,.4);}for(let i=1;i<targets.length;i++)G.fx.push({line:true,x:targets[i-1].x,y:targets[i-1].y,x2:targets[i].x,y2:targets[i].y,life:.25,max:.25});p.thunderAt=G.time+2.8;}
 if(n&&G.lv('vortex')&&G.time>=p.vortexAt){G.zones.push({x:n.x,y:n.y,r:95+G.lv('vortex')*15,age:0,delay:0,life:2.2,friend:true,damage:18,element:'water',vortex:true,tick:0});p.vortexAt=G.time+4;}
 for(let i=0;i<G.lv('orbit');i++){const a=G.time*2.8+i*Math.PI*2/G.lv('orbit'),orb={x:p.x+Math.cos(a)*98,y:p.y+Math.sin(a)*98};for(const e of [...G.enemies])if(d(e,orb)<e.r+20&&(!e.orbitAt||G.time>e.orbitAt)){e.orbitAt=G.time+.45;G.hit(e,24,'sword');}}
};
G.update=dt=>{
 if(G.state!=='running')return;G.time+=dt;G.roomTime+=dt;const p=G.p;for(const k of ['inv','dashCd','dashTime','skillCd'])p[k]=Math.max(0,p[k]-dt);
 let v=G.moveVector();if(v.x||v.y){if(!p.dashTime){p.dx=v.x;p.dy=v.y;}}if(p.dashTime>0){v={x:p.dx,y:p.dy};for(const e of [...G.enemies])if(d(e,p)<e.r+40&&e.lastDash!==G.metrics.dashes){e.lastDash=G.metrics.dashes;G.hit(e,35+G.lv('bird')*18,'bird');}}p.x+=v.x*(p.dashTime>0?780:p.speed)*dt;p.y+=v.y*(p.dashTime>0?780:p.speed)*dt;G.collision(p);if(p.regen>0){p.regen-=dt;p.hp=Math.min(p.maxHp,p.hp+4*dt);}
 const combat=['battle','elite','boss'].includes(G.roomType);
 if(combat&&!G.roomDone){if(G.updateOpeningSpawns?.()!==true){if(G.roomType!=='boss'&&G.time>=G.spawnAt&&G.roomTime<G.roomTarget){if(G.enemies.length<55){G.spawn(G.pick(G.regions[G.act].enemies));if(G.roomType==='elite'||G.act>0&&G.rng()<.4)G.spawn(G.pick(G.regions[G.act].enemies));}G.spawnAt=G.time+Math.max(.48,.95-G.act*.08);}}G.updateEnemies(dt);if(G.state!=='running')return;G.attack();if(G.state!=='running')return;
  for(const s of G.shots){s.age+=dt;s.life-=dt;if(s.homing&&!s.returning){let n=G.nearest(s);if(n){s.a=Math.atan2(n.y-s.y,n.x-s.x);s.vx=Math.cos(s.a)*430;s.vy=Math.sin(s.a)*430;}}if(G.lv('return')&&s.element==='water'&&s.age>.6){if(!s.returning){s.returning=true;s.hits.clear();}s.a=Math.atan2(p.y-s.y,p.x-s.x);s.vx=Math.cos(s.a)*500;s.vy=Math.sin(s.a)*500;if(d(p,s)<20)s.life=0;}s.x+=s.vx*dt;s.y+=s.vy*dt;for(const e of [...G.enemies])if(!e.dead&&!s.hits.has(e.id)&&d(e,s)<e.r+s.r){s.hits.add(e.id);G.r2ResolveSource?G.r2ResolveSource(s.r2Source,s.returning?1:0,()=>G.hit(e,s.damage*(s.r2PierceScale&&s.hits.size>1?s.r2PierceScale:1),s.element)):G.hit(e,s.damage,s.element);G.particles(s.x,s.y,s.element==='bird'?'#f2e7bf':'#8ddfdb',3);if(s.hits.size>=s.pierce){s.life=0;break;}}if(G.state!=='running')return;}
  G.shots=G.shots.filter(s=>s.life>0&&s.x>0&&s.x<W&&s.y>80&&s.y<H);
  for(const s of G.hostile){s.x+=s.vx*dt;s.y+=s.vy*dt;s.life-=dt;if(d(s,p)<s.r+p.r){G.hurt(s.damage||12,'projectile');s.life=0;}}G.hostile=G.hostile.filter(s=>s.life>0&&s.x>0&&s.x<W&&s.y>80&&s.y<H);if(G.state!=='running')return;
  for(const z of [...G.zones]){z.age+=dt;z.life-=dt;if(z.friend){if(z.vortex)for(const e of G.enemies)if(!e.boss&&d(e,z)<z.r){e.x+=(z.x-e.x)*dt*.9;e.y+=(z.y-e.y)*dt*.9;}if(z.age>=z.delay&&(!z.once||!z.hit)&&(z.tick||0)<=G.time){for(const e of [...G.enemies])if(d(e,z)<z.r){if(G.r2ResolveSource)G.r2ResolveSource(z.r2Source,Math.floor(z.age*2),()=>G.hit(e,z.damage,z.element));else G.hit(e,z.damage,z.element);}z.tick=G.time+.5;z.hit=true;if(z.once){if(G.inkEffect)G.inkEffect(z.inkFamily||({fire:'ember',water:'tide',thunder:'hammer',bird:'wing',jewel:'jade'}[z.element]||'hammer'),z.x,z.y,0,z.r*2,.6,z.inkRow||0);else G.effect(z.x,z.y,3,z.r*2,.45);}}}else if(z.age>=z.delay&&!z.hit){z.hit=true;const range=z.kind==='line'?Math.abs(p.x-z.x):z.kind==='hline'?Math.abs(p.y-z.y):d(p,z);if(range<(['line','hline'].includes(z.kind)?48:z.r)+p.r)G.hurt(23,'boss_telegraph');G.enemyImpact?.(z);if(!z.ritual)G.effect(z.x,z.y,3,z.r*2,.35);}if(G.state!=='running')return;}
  G.zones=G.zones.filter(z=>z.life>0);
  if(G.roomType!=='boss'&&G.roomTime>=G.roomTarget&&G.enemies.length===0){G.clearRoom();return;}
 }
 for(const drop of G.drops){let distance=d(drop,p);if(drop.kind==='xp'&&distance<120+G.lv('magnet')*45){const a=Math.atan2(p.y-drop.y,p.x-drop.x);drop.x+=Math.cos(a)*340*dt;drop.y+=Math.sin(a)*340*dt;}if(distance<p.r+drop.r){if(drop.kind==='xp'){p.xp+=drop.value;drop.taken=true;}else if(p.hp<p.maxHp){drop.taken=true;const heal=Math.min(drop.kind==='rice'?25:12,p.maxHp-p.hp);p.hp+=heal;if(drop.kind==='dango')p.regen=5;G.metrics.food_used++;G.float(p.x,p.y-50,(drop.kind==='rice'?'Rice Ball':'Dango')+' +'+Math.round(heal),'#c1efc8');G.event('food_used',{kind:drop.kind,immediate_heal:heal,hp:p.hp});}}}G.drops=G.drops.filter(x=>!x.taken).slice(-200);
 if(combat&&p.xp>=p.nextXp){p.xp-=p.nextXp;p.level++;p.nextXp=G.experienceForLevel?.(p.level)??(26+p.level*12);G.offerTalent(()=>{G.state='running';G.hideModal();});}
 if(G.time>=G.sampleAt){G.event('sample',{x:+p.x.toFixed(1),y:+p.y.toFixed(1),hp:+p.hp.toFixed(1),enemies:G.enemies.length,nearest_enemy:G.enemies.length?+Math.min(...G.enemies.map(e=>d(e,p))).toFixed(1):null,keys:[...G.keys],build:{...p.talents},act:G.act,room:G.roomType,weapon:p.weapon});G.sampleAt=G.time+.5;}
 if(G.time>=G.checkpointAt){G.persist(true);G.checkpointAt=G.time+5;}
};
G.finish=outcome=>{if(G.ended)return;G.ended=true;G.state='result';G.keys.clear();G.event('run_end',{outcome});G.session.status=outcome;G.persist();G.uiResult();};
window.WhitebirdEvidence=Object.freeze({exportSession:()=>{if(G.session){G.session.duration=+G.time.toFixed(3);G.session.summary=G.summary();}return G.session?JSON.parse(JSON.stringify(G.session)):null;}});
G.bridgeTarget={reset(seed){G.start('agent',seed);},observe(){return{state:G.state,version:WHITEBIRD_BUILD.version,build_hash:WHITEBIRD_BUILD.hash,actor_type:G.session?.actor_type,time:+G.time.toFixed(2),room_time:G.roomTime,room_type:G.roomType,act:G.act,stage:G.stage,player:G.p?{x:G.p.x,y:G.p.y,hp:G.p.hp,max_hp:G.p.maxHp,power:G.p.power,dash_cooldown:G.p.dashCd,skill_cooldown:G.p.skillCd,level:G.p.level,weapon:G.p.weapon,weapon_level:G.p.weaponLevel,armor:G.p.armor,gold:G.p.gold,build:{...G.p.talents},relics:[...G.p.relics]}:null,enemies:G.enemies.filter(e=>!e.dead).map(e=>({id:e.id,kind:e.kind,x:e.x,y:e.y,hp:e.hp,r:e.r,boss:!!e.boss,charging:!!e.windup})),projectiles:G.hostile.map(s=>({x:s.x,y:s.y})),pickups:G.drops.map(v=>({...v})),obstacles:G.obstacles,interactable:G.interactable,choices:G.choice?G.choice.options.map((c,i)=>({...c,index:i,key:'Digit'+(i+1)})):[],boss:G.boss?{kind:G.boss.kind,hp:G.boss.hp,max_hp:G.boss.maxHp}:null,terminal:G.state==='result',outcome:G.ended?G.session?.status:null};}};
})();
