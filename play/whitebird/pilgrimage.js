'use strict';
(() => {
const G=WB,d=G.distance;
G.qualities=[{name:'Common',color:'#c4ccc8',bonus:0},{name:'Uncommon',color:'#7ddeac',bonus:.08},{name:'Rare',color:'#74c9ff',bonus:.18},{name:'Epic',color:'#c69bff',bonus:.32},{name:'Legendary',color:'#ffcf76',bonus:.5}];
G.rollQuality=(min=0)=>Math.max(min,(()=>{const v=G.rng();return v<.47?0:v<.75?1:v<.91?2:v<.98?3:4;})());
G.affinities={heaven:{name:'Heaven',color:'#f3d899'},earth:{name:'Earth',color:'#8dd7ac'},human:{name:'Human',color:'#efaaa3'}};
G.weaponProfiles={tide:['earth','effect',23,.65],ember:['human','haste',34,.46],wing:['heaven','crit',24,.65],jade:['earth','effect',20,1.1],mirror:['heaven','effect',65,.95],spear:['human','crit',64,.9],hammer:['heaven','effect',53,.9],talisman:['heaven','haste',26,.85],comb:['earth','effect',26,.65],shaku:['human','crit',44,1],flute:['earth','haste',25,.85],divine:['heaven','crit',70,1.15]};
G.affinityFor=e=>e.affinity||({father:'human',soldier:'human',yomotsu:'human',prince:'human',whitebird:'heaven',ibuki_heaven:'heaven',thunder:'heaven',siren:'heaven',sea:'heaven',aragami:'earth',boar:'earth',kodama:'earth',fox:'earth',guardian:'earth',magatsu:'earth',wraith:'earth',crab:'earth'}[e.kind]||'earth');
G.affinityFactor=(a,b)=>a===b?1:({heaven:'earth',earth:'human',human:'heaven'}[a]===b?1.25:.85);
G.skillDefs=[
 {id:'weapon',name:'Weapon Technique',icon:0,cd:5.5,text:'Use your current weapon’s unique technique.',bias:'crit'},
 {id:'wave',name:'Tide Turn · Water Wave',icon:6,cd:7,text:'Seven piercing water waves, each with 32 base damage.',bias:'effect'},
 {id:'orb',name:'Water Mirror · Drifting Orbs',icon:6,cd:8,text:'Three slow water orbs with 38 base damage, exploding at the end of their path.',bias:'effect'},
 {id:'tide',name:'Hashirimizu · Tidal Wave',icon:6,cd:10,text:'A tidal wall sweeps forward for 140 base damage.',bias:'effect'},
 {id:'orochi',name:'Orochi · Water God’s Slash',icon:6,cd:14,text:'A water serpent attacks repeatedly for 62 base damage per hit.',bias:'effect'},
 {id:'feather',name:'Tokoyo · Thousand Feathers',icon:2,cd:8,text:'Twelve homing feather blades, each with 27 base damage.',bias:'crit'},
 {id:'storm',name:'Thunder · Skybreak',icon:8,cd:9,text:'Three delayed lightning strikes, each with 65 base damage.',bias:'effect'},
 {id:'ember_step',name:'Flintfire · Reflection',icon:7,cd:6,text:'An explosion around you deals 95 base damage and leaves a fire field for 3 s.',bias:'haste'},
 {id:'mirror_guard',name:'Yata · Stillness',icon:5,cd:13,text:'Clear nearby projectiles and gain one shield. Cannot restore another shield during the cooldown.',bias:'effect'}
];
G.blessings=[
 {id:'amaterasu',name:'Amaterasu · Rising Sun',icon:2,affinity:'heaven',text:'Attack +12%. Heaven weapons gain another +15% affinity advantage against Earth.'},
 {id:'susanoo',name:'Susanoo · Tempest',icon:8,affinity:'heaven',text:'Triggered and elemental damage +25%. Technique hits periodically call down lightning.'},
 {id:'kushinada',name:'Kushinada · Rice Ears',icon:9,affinity:'earth',text:'Max HP +24. Restore 8 HP when clearing a room.'},
 {id:'musashi',name:'Future Shadow · Miyamoto Musashi',icon:0,affinity:'human',text:'Crit chance +8%, crit damage +35%. F adds a Two-Heavens slash.'},
 {id:'tsukuyomi',name:'Tsukuyomi · Quiet Night',icon:5,affinity:'heaven',text:'Technique cooldown reduction +15%. Casting briefly increases move speed.'},
 {id:'ibuki_curse',name:'Ibuki-doji · Blood-Sake Pact',icon:7,affinity:'earth',curse:true,text:'Attack +28%, lifesteal +5%. Max HP −20%. Healing room effects are halved.'},
 {id:'sarutahiko',name:'Sarutahiko · Crossroads',icon:3,affinity:'earth',text:'Move speed +24. Reveal every room in this chapter when receiving this blessing.'},
 {id:'yamato',name:'Yamatohime · Sheathed Blade',icon:4,affinity:'human',text:'Defense +3. Dash cooldown reduction +15%. Gain one shield per room.'}
];
const chooseRune=G.chooseRune;G.chooseRune=then=>chooseRune(()=>{for(const id of Object.keys(G.p.talents))if(!G.p.passiveSlots.includes(id)&&G.p.passiveSlots.length<6)G.p.passiveSlots.push(id);then();});
const start=G.start;G.start=(...args)=>{start(...args);if(!G.p)return;Object.assign(G.p,{talentQualities:{},passiveSlots:[],weaponRolls:[],weaponQuality:0,skillBag:[],activeSlots:[null,null],skillCooldowns:{},blessings:[],path:'unbound',pathRank:0,bloodUntil:0,bloodLockUntil:0,bloodLockUsed:false});G.itemSerial=0;G.chapterMaps={};G.currentNode=null;G.cinematic=null;G.acquireSkill('weapon',0,true);G.acquireSkill('wave',0,true);G.p.baseHealth=G.p.maxHp;};
G.rawLv=id=>G.p?.talents[id]||0;
G.lv=id=>{const rank=G.rawLv(id);if(!rank||G.learningTalent||!G.p?.passiveSlots)return rank;const t=G.talents.find(t=>t.id===id);return !t||t.mastery||G.p.passiveSlots.includes(id)?rank:0;};
const addTalent=G.addTalent;G.addTalent=(id,q=G.rollQuality())=>{
 const old=G.rawLv(id),t=G.talents.find(t=>t.id===id);if(!t||old>=t.max)return false;
 G.learningTalent=true;try{addTalent(id);}finally{G.learningTalent=false;}
 if(id==='comb'){G.p.maxHp-=18;G.p.hp=Math.min(G.p.hp,G.p.maxHp);}if(id==='magnet')G.p.speed-=12;if(id==='fleet')G.p.speed-=16;if(id==='iron_skin')G.p.armor--;
 G.p.talentQualities[id]=Math.max(q,G.p.talentQualities[id]||0);
 if(!t.mastery&&!G.p.passiveSlots.includes(id)&&G.p.passiveSlots.length<6)G.p.passiveSlots.push(id);
 G.event('quality_talent_gained',{id,quality:q,rank:G.rawLv(id),equipped:t.mastery||G.p.passiveSlots.includes(id)});return true;
};
G.talentPool=()=>G.talents.filter(t=>G.rawLv(t.id)<t.max&&(!t.weapon||t.weapon===G.p.weapon)&&(!t.needs||t.needs.every(id=>G.rawLv(id)>0))&&(!t.requires||(t.requires==='fusion'?G.rawLv('water')&&G.rawLv('fire'):G.rawLv(t.requires)>0)));
G.talentQualityBonus=()=>Math.min(.18,Object.entries(G.p?.talentQualities||{}).reduce((n,[id,q])=>n+(G.lv(id)?G.qualities[q].bonus*.06:0),0));
G.hasBless=id=>!!G.p?.blessings?.includes(id);
G.bloodActive=()=>!!G.p&&G.p.bloodUntil>G.time;
G.combatStats=()=>{
 const p=G.p;if(!p)return null;const profile=G.weaponProfiles[p.weapon],blood=G.bloodActive(),quality=G.talentQualityBonus();
 const speedBonus=G.lv('focus')*.06+(p.rune==='haste'?.25:0),extraHaste=quality+(blood?1.35:0);
 const critChance=Math.min(.8,.05+(G.has('whitebird_chain')?.08:0)+(G.has('orochi_fang')?.05:0)+G.lv('crit')*.12+(p.rune==='crit'?.25:0)+(G.hasBless('musashi')?.08:0)+(blood?.12:0));
 const critDamage=1.8+(G.hasBless('musashi')?.35:0)+(profile[1]==='crit'?.3:0)+(blood?.3:0);
 const cooldown=Math.min(.6,(G.hasBless('tsukuyomi')?.15:0)+(G.has('whitebird_chain')?.08:0)+quality*.5);
 return {attack:profile[2]*G.power(),armor:p.armor+G.lv('iron_skin')+G.lv('ward')+(G.hasBless('yamato')?3:0)+(G.has('whitebird_veil')?2:0)+(blood?4:0),critChance,critDamage,attackSpeed:(1+extraHaste)/(profile[3]*(1-G.lv('focus')*.06)*(p.rune==='haste'?.75:1)),extraHaste, cooldown, effectPower:1+(profile[1]==='effect'?.25:0)+(G.hasBless('susanoo')?.25:0)+(G.has('orochi_scale')?.18:0)+quality, lifesteal:(G.hasBless('ibuki_curse')?.05:0)+(blood?.3:0),moveSpeed:p.speed+G.lv('magnet')*12+G.lv('fleet')*16+(G.hasBless('sarutahiko')?24:0)+(blood?55:0),affinity:profile[0],bias:profile[1],qualityBonus:quality};
};
const power=G.power;G.power=()=>{
 if(!G.p)return 1;const p=G.p,rolled=(p.weaponRolls||[]).reduce((n,v)=>n+v,0);
 return power()/(1+p.weaponLevel*.19)*(1+rolled)*(1+G.talentQualityBonus())*(G.hasBless('amaterasu')?1.12:1)*(G.hasBless('ibuki_curse')?1.28:1)*(G.bloodActive()?1.55:1);
};
G.activeCastScale=1;
const hit=G.hit;G.hit=(e,n,element='sword',chain=false)=>{
 if(e.dead||e.transitionUntil>G.time||(G.bloodActive()&&G.suppressTalents&&!G.bloodMelee))return;const p=G.p,s=G.combatStats(),before=Math.max(0,e.hp),attr=G.affinityFactor(s.affinity,G.affinityFor(e));
 const effect=['water','thunder','fire','rune','relic','steam','paper'].includes(element)?s.effectPower:1;
 const bias=s.bias==='haste'?1+Math.min(.35,s.extraHaste*.22):1;
 hit(e,n*attr*effect*bias*G.activeCastScale*(G.hasBless('amaterasu')&&s.affinity==='heaven'&&G.affinityFor(e)==='earth'?1.15:1)*(G.has('orochi_fang')&&G.affinityFor(e)==='heaven'?1.18:1),element,chain);
 const dealt=Math.min(before,Math.max(0,before-e.hp));if(!chain&&s.lifesteal&&dealt>0)p.hp=Math.min(p.maxHp,p.hp+dealt*s.lifesteal);
 
 if(!chain&&G.activeCasting&&G.hasBless('susanoo')&&G.time>=(p.blessThunderAt||0)){p.blessThunderAt=G.time+2;G.zones.push({x:e.x,y:e.y,r:100,age:0,delay:.4,life:.7,friend:true,damage:35,element:'thunder',once:true});}
 if(!chain&&element==='water'&&G.has('orochi_scale')&&G.time>=(p.scaleThunderAt||0)){p.scaleThunderAt=G.time+1.5;G.zones.push({x:e.x,y:e.y,r:105,age:0,delay:.25,life:.7,friend:true,damage:42,element:'thunder',once:true});}
};
const attack=G.attack;G.attack=()=>{
 const p=G.p;if(G.bloodActive()){
  if(G.time<p.attackAt)return;const e=G.nearest();if(!e)return;p.facing=Math.atan2(e.y-p.y,e.x-p.x);p.attackAt=G.time+.18;G.action('slash',.18);G.effect(p.x,p.y,0,280,.2,p.facing);G.fx3d?.('bloodSlash',p.x,p.y,p.facing,1);
  G.bloodMelee=true;try{for(const n of [...G.enemies])if(d(p,n)<145)G.hit(n,42,'sword',true);}finally{G.bloodMelee=false;}return;
 }
 const at=p.attackAt;attack();if(p.attackAt>at&&Number.isFinite(p.attackAt)){p.attackAt=G.time+(p.attackAt-G.time)/(1+G.combatStats().extraHaste);}
};
G.acquireSkill=(id,q=G.rollQuality(),auto=false)=>{
 const def=G.skillDefs.find(s=>s.id===id);if(!def)return null;const item={uid:'s'+(++G.itemSerial),id,q,rank:1};G.p.skillBag.push(item);
 if(auto){const free=G.p.activeSlots.indexOf(null);if(free>=0)G.p.activeSlots[free]=item.uid;}
 G.event('skill_received',{...item,equipped:G.p.activeSlots.includes(item.uid)});return item;
};
G.equipSkill=(uid,slot)=>{if(![0,1].includes(slot)||!G.p.skillBag.some(s=>s.uid===uid))return false;if(G.p.activeSlots[slot]===uid)return true;const previous=G.p.activeSlots.indexOf(uid);if(previous>=0)G.p.activeSlots[previous]=G.p.activeSlots[slot];G.p.activeSlots[slot]=uid;G.event('skill_equipped',{uid,slot});return true;};
G.sellSkill=uid=>{if(G.p.activeSlots.includes(uid))return false;const s=G.p.skillBag.find(s=>s.uid===uid);if(!s)return false;const value=8+s.q*5+s.rank*3;G.p.gold+=value;G.p.skillBag=G.p.skillBag.filter(x=>x.uid!==uid);G.event('skill_sold',{uid,value});return true;};
G.skillInfo=i=>G.p?.skillBag.find(s=>s.uid===G.p.activeSlots[i]);
const projectile=G.projectile;G.projectile=(x,y,a,n=20,element='water',homing=false,copy=false)=>projectile(x,y,a,n*(G.legacyCast&&!copy?G.activeCastScale:1),element,homing,copy);
const weaponSkill=G.skill;
G.castSlot=slot=>{
 const p=G.p,item=G.skillInfo(slot);if(G.state!=='running'||!item||G.bloodActive()||p.skillCooldowns[item.id]>0)return false;
 const def=G.skillDefs.find(s=>s.id===item.id),n=G.nearest(),a=n?Math.atan2(n.y-p.y,n.x-p.x):p.facing;
 const s=G.combatStats(),rankScale=1+(item.rank-1)*.18;G.activeCastScale=(1+G.qualities[item.q].bonus)*rankScale;G.activeCasting=true;
 const before=G.metrics.skill_uses;
 try{
  if(item.id==='weapon'){p.skillCd=0;G.legacyCast=true;try{weaponSkill();}finally{G.legacyCast=false;}}
  else{
   G.metrics.skill_uses++;G.action('cast',.65);G.event('active_skill',{id:item.id,slot,quality:item.q,rank:item.rank});
   if(['wave','orb','tide','orochi'].includes(item.id)){
    if(item.id==='wave')for(let i=-3;i<=3;i++)G.projectile(p.x,p.y,a+i*.17,32*G.activeCastScale,'water');
    if(item.id==='orb')for(let i=-1;i<=1;i++){G.projectile(p.x,p.y,a+i*.35,38*G.activeCastScale,'water');const shot=G.shots.at(-1);Object.assign(shot,{life:2.2,orb:true,r:24,pierce:20});shot.vx*=.45;shot.vy*=.45;}
    if(item.id==='tide'){G.beams.push({x:p.x,y:p.y,a,life:.85,max:.85,width:140,water:true});for(const e of [...G.enemies]){const dx=e.x-p.x,dy=e.y-p.y;if(dx*Math.cos(a)+dy*Math.sin(a)>-40&&Math.abs(-dx*Math.sin(a)+dy*Math.cos(a))<160+e.r)G.hit(e,140,'water');}}
    if(item.id==='orochi'){G.zones.push({x:p.x,y:p.y,r:340,age:0,delay:0,life:1.7,friend:true,damage:62*G.activeCastScale,element:'water',tick:0});G.fx.push({orochi:true,x:p.x,y:p.y,size:700,life:1.5,max:1.5});}
    G.fx3d?.(item.id==='orb'?'orb':'wave',p.x,p.y,a,item.id==='tide'?2:1);if(!G.fx6?.fx_combat_v6)G.effect(p.x,p.y,4,360,.7);
   }
   if(item.id==='feather'){for(let i=0;i<12;i++)G.projectile(p.x,p.y,i*Math.PI/6,27*G.activeCastScale,'bird',true);G.fx3d?.('feather',p.x,p.y,a,1);}
   if(item.id==='storm')for(let i=0;i<3;i++)G.zones.push({x:(n?.x||p.x)+(i-1)*100,y:n?.y||p.y,r:125,age:0,delay:.35+i*.28,life:1.4,friend:true,once:true,damage:65*G.activeCastScale,element:'thunder'});
   if(item.id==='ember_step'){for(const e of [...G.enemies])if(d(p,e)<210)G.hit(e,95,'fire');G.zones.push({x:p.x,y:p.y,r:165,age:0,delay:0,life:3,friend:true,damage:22*G.activeCastScale,element:'fire',tick:0});G.fx3d?.('fire',p.x,p.y,a,1);}
   if(item.id==='mirror_guard'){G.hostile=G.hostile.filter(e=>d(e,p)>320);p.shield=Math.min(2,p.shield+1);G.effect(p.x,p.y,5,500,.75);}
  }
 }finally{G.activeCastScale=1;G.activeCasting=false;}
 if(G.metrics.skill_uses===before)return false;
 const cd=def.cd*(1-s.cooldown)*Math.max(.65,1-(item.rank-1)*.06)*(p.rune==='charge'?.75:1)*(1-G.lv(item.id==='weapon'?'sword_tempo':'water_tempo')*.08);
 p.skillCooldowns[item.id]=cd;if(slot===0)p.skillCd=cd;else p.waterCd=cd;
 if(G.hasBless('musashi')){G.effect(p.x,p.y,0,400,.55,a+.4);for(const e of [...G.enemies])if(d(e,p)<230)G.hit(e,40,'sword',true);}
 if(G.hasBless('tsukuyomi'))p.moonStepUntil=G.time+1.5;
 if(!['wave','orb','tide','orochi'].includes(item.id))G.fx3d?.(item.id==='weapon'?'slash':item.id==='storm'?'thunder':'ripple',p.x,p.y,a,1);return true;
};
G.skill=()=>G.castSlot(0);G.waterSkill=()=>G.castSlot(1);
const dash=G.dash;G.dash=()=>{const before=G.metrics.dashes;dash();if(before!==G.metrics.dashes){if(G.hasBless('yamato'))G.p.dashCd*=.85;if(G.has('whitebird_veil'))G.p.veilUntil=G.time+2;G.fx3d?.(G.bloodActive()?'bloodSlash':'feather',G.p.x,G.p.y,Math.atan2(G.p.dy,G.p.dx),.6);}};
G.blackMode=()=>G.notice('Awakening is bound to Q.');
G.formIndex=()=>G.bloodActive()?2:G.p?.path==='blood'?2:G.p?.path==='divine'||G.p?.awakenUntil>G.time?1:0;
G.awaken=()=>{
 const p=G.p;if(G.state!=='running'||p.power<100||G.bloodActive())return;p.power=0;G.metrics.awakening_uses++;G.event('awakening',{path:p.path,rank:p.pathRank});G.hostile=[];G.action('awaken',1);p.inv=Math.max(p.inv,1.8);
 if(p.path==='blood'){
  p.bloodUntil=G.time+10+p.pathRank*2;p.bloodLockUntil=0;p.bloodLockUsed=false;p.attackAt=G.time;G.shots=[];G.zones=G.zones.filter(z=>!z.friend);G.echoQueue=[];G.cinematic={name:'Bloodrage · Severing Blade',line:'This time, I’m the one holding the sword.',art:'hero_blood_v2',until:performance.now()+1900};
 }else{
  p.awakenUntil=G.time+6;G.cinematic={name:p.path==='divine'?'Divine Blade · Ame-no-Murakumo':'Heavenward · Whitebird Crossing',line:'No one will sink into the sea for me again.',art:'hero_divine_v2',until:performance.now()+2100};
  const damage=p.path==='divine'?360+p.pathRank*100:210;for(const e of [...G.enemies])G.hit(e,damage,'divine',true);G.effect(p.x,p.y,2,1150,1.4);G.fx3d?.('ultimate',p.x,p.y,p.facing,2);G.shake=12;
 }
};
const hurt=G.hurt;G.hurt=(n,source)=>{
 const p=G.p;if(G.bloodActive()&&p.bloodLockUntil>G.time){G.event('blood_lock_blocked',{source});return;}
 const s=G.combatStats();if(p.veilUntil>G.time){n*=.5;p.veilUntil=0;}n=Math.max(1,n-G.lv('iron_skin')-(G.hasBless('yamato')?3:0)-(G.has('whitebird_veil')?2:0)-(G.bloodActive()?4:0));
 if(G.bloodActive()&&!p.bloodLockUsed&&p.inv<=0&&p.shield<=0&&p.hp<=n){p.hp=1;p.bloodLockUsed=true;p.bloodLockUntil=G.time+3;G.event('blood_lock_triggered',{until:p.bloodLockUntil});G.toast('Severance · Lethal Hit Prevented');return;}hurt(n,source);
};
const update=G.update;G.update=dt=>{
 if(G.state!=='running')return;const p=G.p;for(const id in p.skillCooldowns)p.skillCooldowns[id]=Math.max(0,p.skillCooldowns[id]-dt);
 const combBonus=18*G.lv('comb');const prior=p.equippedCombBonus||0;if(prior!==combBonus){p.maxHp+=combBonus-prior;p.hp=Math.min(p.hp,p.maxHp);p.equippedCombBonus=combBonus;}
 const oldSpeed=p.speed,oldRune=p.rune;p.speed=G.combatStats().moveSpeed+(p.moonStepUntil>G.time?45:0);
 if(G.bloodActive()){
  p.hp=Math.max(1,p.hp-p.maxHp*.025*dt);G.shots=[];G.zones=G.zones.filter(z=>!z.friend);G.echoQueue=[];
  // Suppress passive attacks while the route ultimate replaces the full move set.
  G.suppressTalents=true;p.rune=null;
 }
 try{update(dt);}finally{p.speed=oldSpeed;p.rune=oldRune;G.suppressTalents=false;}
 p.skillCd=p.skillCooldowns[G.techCooldownKey?G.techCooldownKey(0):G.skillInfo(0)?.id]||0;p.waterCd=p.skillCooldowns[G.techCooldownKey?G.techCooldownKey(1):G.skillInfo(1)?.id]||0;
 if(p.bloodUntil&&G.time>=p.bloodUntil){p.bloodUntil=0;p.bloodLockUntil=0;G.event('blood_ultimate_ended');G.toast('Bloodrage has ended.');}
};
const lv=G.lv;G.lv=id=>G.suppressTalents?0:lv(id);
const has=G.has;G.has=id=>G.suppressTalents?false:has(id);
const summary=G.summary;G.summary=()=>({...summary(),path:G.p?.path,path_rank:G.p?.pathRank,weapon_quality:G.p?.weaponQuality,weapon_rolls:G.p?.weaponRolls,talent_qualities:G.p?.talentQualities,active_skills:G.p?.activeSlots,skill_bag:G.p?.skillBag,passive_slots:G.p?.passiveSlots,blessings:G.p?.blessings,attributes:G.p?G.combatStats():null});
})();

