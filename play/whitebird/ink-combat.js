'use strict';
(() => {
const G=WB,d=G.distance;G.blackMode=()=>{};
G.weaponOrder=['tide','ember','wing','jade','spear','hammer'];
G.weapons=G.weapons.filter(w=>G.weaponOrder.includes(w.id));
G.runes=G.runes.filter(r=>['echo','split','pierce','return','homing','blast','chain','frost','burn','orbit','crit','charge'].includes(r.id));
// Each entry is the sole source of truth for ability names, mechanics and inspection UI.
G.techniques={
 tide:[[['Tide Slash',54,175,1,5.5,'A forward water slash that applies Wet.'],['Twin Undertow',40,200,2,5.1,'Two overlapping water slashes that apply Wet.'],['Eightfold Current',36,240,3,4.8,'Three water slashes cover a wide arc.']],[['Watercourse',29,620,5,8,'Fire a fan of piercing water blades.'],['Returning Wave',128,780,1,9,'A wall of water advances through enemies.'],['Orochi Tidecut',48,330,4,12,'An eight-headed water serpent circles you, slashing nearby enemies four times.']]],
 ember:[[['Flint Slash',72,165,1,5.5,'A close-range fire slash.'],['Backdraft',96,195,1,5.2,'A fire slash that burns for 3 s and ignites nearby reeds.'],['Wildfire Purification',128,230,1,4.9,'A wide fire slash that burns and knocks back nearby enemies.']],[['Flintstrike',22,125,4,9,'Leave purifying fire for 2 s, damaging enemies every 0.5 s.'],['Prairie Fire',25,170,6,9,'Leave purifying fire for 3 s and ignite nearby reeds.'],['Shiranui',29,210,8,10,'Leave purifying fire for 4 s. Hits apply a lasting burn.']]],
 wing:[[['Feather Fan',27,700,5,6,'Release homing feathers in a forward fan.'],['Returning Plumes',30,750,7,5.7,'Seven homing feathers pierce enemies and return.'],['Ninefold Flight',33,800,9,5.4,'Nine homing feathers spread in three groups.']],[['Sweeping Feathers',19,105,2,10,'Two feather blades orbit you for 3 s.'],['Homeward Flight',23,125,4,10,'Four feather blades orbit you for 4 s.'],['Flock Crossing',27,145,6,11,'Six feather blades orbit you for 5 s, then seek enemies.']]],
 jade:[[['Jewel Chime',62,160,1,7,'A burst of jewel light knocks nearby enemies back.'],['Twin Jewels',86,205,1,6.6,'Knock back nearby enemies and clear nearby projectiles.'],['Yasakani Wheel',108,250,1,6.2,'An expanding jewel ring clears projectiles and restores one shield.']],[['Jewel Ward',18,105,3,13,'Gain one shield and three orbiting jewels for 3 s.'],['Jewel Barrier',23,125,4,12.5,'Gain one shield and four orbiting jewels for 4 s.'],['Sacred Jewel Fence',28,145,6,12,'Gain two shields and six orbiting jewels for 5 s.']]],
 spear:[[['Cloudpiercer',108,760,1,6.5,'A fast piercing spear beam.'],['Threefold Spear',65,860,3,6.2,'Three piercing spear beams that slow enemies.'],['Tidebreaker',83,980,3,5.9,'Three heavy spears slow targets and push nearby enemies away.']],[['Tidepin',23,110,4,9,'Create a pulling vortex at the impact point for 2 s.'],['Sea Anchor',27,150,6,9.5,'A vortex lasts 3 s and slows enemies on each hit.'],['Vortex Impalement',32,195,8,10,'A large vortex lasts 4 s, then releases a piercing spear strike.']]],
 hammer:[[['Earthshaker',102,125,1,7,'Strike the ground beneath the nearest enemy.'],['Earthsplitter',133,160,1,6.6,'A ground strike briefly stuns enemies.'],['Thunder Drum',108,190,2,6.3,'A ground strike is followed by a second impact.']],[['Lightning Call',76,90,1,9,'One lightning bolt strikes the target.'],['Three Thunders',66,105,3,9.5,'Three lightning strikes pursue the target in sequence.'],['Takemikazuchi’s Drum',64,125,5,10,'Five staggered lightning strikes fall with gaps between them.']]]
};
G.techStage=(level=G.p.weaponLevel)=>Math.min(2,Math.floor(level/2));
G.techInfo=(slot,level=G.p.weaponLevel,weapon=G.p.weapon,q=G.p.weaponQuality)=>{const stage=G.techStage(level),v=G.techniques[weapon][slot][stage],rankBonus=1+level*.04,quality=1+G.qualities[q||0].bonus*.5,stats=G.combatStats();return {id:weapon+'_'+slot+'_'+stage,name:v[0],damage:v[1]*rankBonus*quality*(1+G.lv(slot?'water_force':'sword_edge')*.18)*(1+G.relicRank('sword_scroll')*.12),range:v[2],count:v[3],cd:v[4]*(1-stats.cooldown)*(G.p.rune==='charge'?.75:1)*Math.max(.65,1-G.lv(slot?'water_tempo':'sword_tempo')*.08),text:v[5],stage,slot,weapon,q,rank:level+1,icon:(slot*3+stage)*6+G.weaponOrder.indexOf(weapon),iconSet:'tech',element:{tide:'water',ember:'fire',wing:'bird',jade:'jewel',spear:'water',hammer:'thunder'}[weapon]};};
G.techDescription=s=>`${s.text}\nBase damage per hit ${s.damage.toFixed(1)} · ${s.count>1?'Hits / projectiles '+s.count+' · ':''}Range ${s.range} · Cooldown ${s.cd.toFixed(2)}  s`;
G.syncWeapon=()=>{const p=G.p;if(!p||!p.passiveSlots)return;const stamp=[p.weapon,p.weaponLevel,p.weaponQuality].join(':');if(p.techStamp===stamp)return;p.techStamp=stamp;p.skillBag=[0,1].map(i=>{const s=G.techInfo(i);G.skillDefs=G.skillDefs.filter(x=>x.id!==s.id);G.skillDefs.push({...s,iconSet:'tech',text:G.techDescription(s)});return {id:s.id,uid:'bound-'+i,q:p.weaponQuality||0,rank:p.weaponLevel+1,bound:true};});p.activeSlots=p.skillBag.map(s=>s.uid);};
G.skillInfo=i=>{G.syncWeapon();return G.p?.skillBag[i];};
G.techCooldownKey=slot=>'weapon-slot-'+slot;
const projectile=G.projectile;G.projectile=(...a)=>{const at=G.shots.length;projectile(...a);for(const shot of G.shots.slice(at))shot.inkFamily=G.castFamily||({jewel:'jade',bird:'wing',fire:'ember',thunder:'hammer'}[shot.element]||(['tide','spear'].includes(G.p.weapon)?G.p.weapon:'tide'));};
G.inkFx=[];G.inkEffect=(family,x,y,a=0,size=180,life=.55,row=0,extra={})=>{G.inkFx.push({family,x,y,a,size,life,max:life,start:G.time,row,...extra});if(G.inkFx.length>90)G.inkFx.shift();};
const targetAngle=()=>{const e=G.nearest();return e?Math.atan2(e.y-G.p.y,e.x-G.p.x):Math.atan2(G.p.dy||0,G.p.dx||G.p.moveFacing||1);};
const arcHit=(a,r,damage,element,wide=1.35)=>{for(const e of [...G.enemies]){const da=Math.atan2(Math.sin(Math.atan2(e.y-G.p.y,e.x-G.p.x)-a),Math.cos(Math.atan2(e.y-G.p.y,e.x-G.p.x)-a));if(d(e,G.p)<r+e.r&&Math.abs(da)<wide)G.hit(e,damage,element);}};
G.inkQueue=[];G.inkWaves=[];
G.castSlot=slot=>{const p=G.p,key=G.techCooldownKey(slot);if(G.state!=='running'||G.bloodActive()||(p.skillCooldowns[key]||0)>0)return false;const s=G.techInfo(slot),n=G.nearest(),a=targetAngle(),stage=s.stage,x=p.x,y=p.y;G.castFamily=p.weapon;G.activeCasting=true;G.metrics.skill_uses++;G.action(slot||['jade','hammer'].includes(p.weapon)?'cast':'slash',.55);p.skillCooldowns[key]=s.cd;G.event('active_skill',{id:s.id,weapon:p.weapon,slot,stage,quality:s.q,base_damage:s.damage,count:s.count,range:s.range,cooldown:s.cd});
try{
 if(slot===0){
  if(p.weapon==='tide'){for(let i=0;i<s.count;i++){const run=()=>{G.inkEffect('tide',p.x,p.y,a+(i%2?-.2:.15),s.range*1.6,.42);arcHit(a,s.range,s.damage,'water');};if(i===0)run();else G.inkQueue.push({at:G.time+i*.15,run});}}
  if(p.weapon==='ember'){G.inkEffect('ember',x,y,a,s.range*1.7,.5);arcHit(a,s.range,s.damage,'fire',1.7);if(stage>0){for(const e of G.enemies)if(d(e,p)<s.range){e.inkBurn=3;e.inkBurnDamage=9+stage*5;}for(const grass of G.grass)if(d(grass,p)<s.range+60)grass.burning=4;}if(stage===2)for(const e of G.enemies)if(!e.boss&&d(e,p)<s.range){e.x+=Math.cos(a)*40;e.y+=Math.sin(a)*40;}}
  if(p.weapon==='wing'){for(let i=0;i<s.count;i++){const first=G.shots.length;
   G.projectile(x,y,a+(i-(s.count-1)/2)*.14,s.damage,'bird',true);
   for(const feather of G.shots.slice(first)){
    // Homing feathers travel at 430 units/s; lifetime must match the displayed reach.
    feather.life=s.range/430;
    if(stage>0){feather.pierce=2;feather.runeReturn=true;feather.returnAfterHit=true;}
   }}G.inkEffect('wing',x,y,a,170,.45,0);}
  if(p.weapon==='jade'){G.inkEffect('jade',x,y,0,s.range*2,.75,1);for(const e of [...G.enemies])if(d(e,p)<s.range){G.hit(e,s.damage,'jewel');if(!e.boss){const b=Math.atan2(e.y-y,e.x-x);e.x+=Math.cos(b)*35;e.y+=Math.sin(b)*35;}}if(stage>0)p.shield=Math.max(p.shield,Math.min(3,p.shield+(stage===2?1:0)));if(stage>0)G.hostile=G.hostile.filter(e=>d(e,p)>s.range);}
  if(p.weapon==='spear'){for(let i=0;i<s.count;i++){const b=a+(i-(s.count-1)/2)*.14;G.projectile(x,y,b,s.damage,'water');const shot=G.shots.at(-1);Object.assign(shot,{pierce:20,life:s.range/820,vx:Math.cos(b)*820,vy:Math.sin(b)*820,inkSpear:true});}G.inkEffect('spear',x,y,a,240+stage*50,.4);}
  if(p.weapon==='hammer'){const tx=n?.x||x+Math.cos(a)*100,ty=n?.y||y+Math.sin(a)*100;for(let i=0;i<s.count;i++)G.zones.push({x:tx,y:ty,r:s.range,age:0,delay:.2+i*.38,life:.65+i*.38,friend:true,once:true,damage:s.damage,element:'thunder',inkFamily:'hammer',inkRow:0});}
 }else{
  if(p.weapon==='tide'){
   if(stage===0){
    for(let i=0;i<s.count;i++){
     const first=G.shots.length;
     G.projectile(x,y,a+(i-2)*.2,s.damage,'water');
     // A cast can append rune copies and mastery streams. Fit every emitted
     // projectile to the same visible range, using the homing update's speed.
     for(const shot of G.shots.slice(first)){
      const speed=shot.homing?430:Math.hypot(shot.vx,shot.vy);
      shot.life=s.range/speed;
     }
    }
   }else if(stage===1){
    G.inkEffect('tide',x,y,a,330,1.2,1,{travel:s.range});
    G.inkWaves.push({x:x,y:y,a:a,damage:s.damage,range:s.range,travel:0,hit:new Set()});
   }else{
    G.inkEffect('serpent',x,y,a,480,1.6,1);
    G.zones.push({x:x,y:y,r:s.range,age:0,delay:0,life:1.65,friend:true,damage:s.damage,element:'water',tick:G.time,inkFamily:'serpent'});
   }
  }
  if(p.weapon==='ember'){G.inkEffect('ember',x,y,0,s.range*2,1,1);G.zones.push({x,y,r:s.range,age:0,delay:0,life:s.count*.5-.05,friend:true,damage:s.damage,element:'fire',tick:G.time,inkFamily:'ember'});if(stage>0)for(const grass of G.grass)if(d(grass,p)<s.range+60)grass.burning=4;}
  if(p.weapon==='wing'||p.weapon==='jade'){p.inkOrbit={family:p.weapon,count:s.count,damage:s.damage,r:s.range,until:G.time+3+stage,stage,release:p.weapon==='wing'&&stage===2};if(p.weapon==='jade'){p.shield=Math.max(p.shield,Math.min(3,p.shield+(stage===2?2:1)));G.inkEffect('jade',x,y,0,260,.65,1);}}
  if(p.weapon==='spear'){const tx=n?.x||x+Math.cos(a)*200,ty=n?.y||y+Math.sin(a)*200;G.zones.push({x:tx,y:ty,r:s.range,age:0,delay:0,life:s.count*.5-.05,friend:true,damage:s.damage,element:'water',vortex:true,tick:G.time,inkFamily:'spear'});G.inkEffect('spear',tx,ty,0,s.range*2,1.2,1);if(stage===2)G.inkQueue.push({at:G.time+3.6,run:()=>{G.castFamily='spear';G.projectile(tx,ty,targetAngle(),s.damage*2.5,'water');G.shots.at(-1).pierce=12;G.castFamily=null;}});}
  if(p.weapon==='hammer'){for(let i=0;i<s.count;i++){const tx=(n?.x||x)+Math.sin(i*2.4)*70,ty=(n?.y||y)+Math.cos(i*2.4)*45;G.zones.push({x:tx,y:ty,r:s.range,age:0,delay:.25+i*.22,life:.65+i*.22,friend:true,once:true,damage:s.damage,element:'thunder',inkFamily:'hammer',inkRow:1});}}
 }
 G.applyTechniqueExtras(slot,s,a);
}finally{G.castFamily=null;G.activeCasting=false;}
return true;};
G.skill=()=>G.castSlot(0);G.waterSkill=()=>G.castSlot(1);
G.applyTechniqueExtras=(slot,s,a)=>{const p=G.p,w=p.weapon;if(slot===0){for(let i=0;i<G.lv('blade_rain')*2;i++)G.projectile(p.x,p.y,a+i*.3,25,'bird',true);if(G.lv('crescent'))G.burst(p.x,p.y,4*G.lv('crescent'),25,'water');if(G.has('storm_stone'))for(const e of G.enemies.filter(e=>!e.dead).slice(0,G.relicRank('storm_stone'))){G.hit(e,65,'thunder');G.inkEffect('hammer',e.x,e.y,0,150,.5,1);}if(G.has('oni_hammer')){G.inkEffect('hammer',p.x,p.y,0,420,.55);for(const e of [...G.enemies])if(d(e,p)<260)G.hit(e,75,'sword',true);}if(G.has('broken_edict'))for(let i=-1;i<=1;i++){G.projectile(p.x,p.y,a+i*.22,65,'sword');G.shots.at(-1).pierce=8;}if(G.has('flint'))G.zones.push({x:p.x,y:p.y,r:130,age:0,delay:0,life:3.95,friend:true,damage:24,element:'fire',tick:G.time,inkFamily:'ember'});
 if(w==='tide'&&G.master(2)&&p.tideLink>G.time){p.skillCooldowns[G.techCooldownKey(0)]*=1-(.3+.15*(G.master(2)-1));p.tideLink=0;}
 if(w==='wing'&&G.master(2))p.featherOrbitUntil=G.time+3;
 if(w==='jade'&&G.master(2))G.burst(p.x,p.y,8,24*G.master(2),'jewel');
 if(w==='spear'&&G.master(0))for(let i=-1;i<=1;i++){G.projectile(p.x,p.y,a+i*.18,45*G.master(0),'water');G.shots.at(-1).pierce=10;}
 if(w==='hammer'&&G.master(2)){const n=G.nearest();if(n)G.zones.push({x:n.x,y:n.y,r:140,age:0,delay:.7,life:1.1,friend:true,once:true,damage:45*G.master(2),element:'thunder',inkFamily:'hammer',inkRow:1});}
  }else{if(G.lv('foam_guard')&&G.time>=(p.foamAt||0)){p.shield=Math.max(p.shield,Math.min(3,p.shield+1));p.foamAt=G.time+Math.max(10,22-4*G.lv('foam_guard'));}p.power=Math.min(100,p.power+6*G.lv('tide_charge'));if(G.has('tide_pearl'))p.hp=Math.min(p.maxHp,p.hp+6*G.relicRank('tide_pearl'));if(G.has('coral_spear'))for(let i=0;i<2+G.relicRank('coral_spear');i++)G.projectile(p.x,p.y,a+(i-1)*.18,55,'water');if(G.has('tidal_heart')){p.hp=Math.min(p.maxHp,p.hp+4);p.skillCooldowns[G.techCooldownKey(0)]=Math.max(0,(p.skillCooldowns[G.techCooldownKey(0)]||0)-3);}if(G.has('serpent_eye')){G.inkEffect('serpent',p.x,p.y,0,350,1.1,1);G.zones.push({x:p.x,y:p.y,r:260,age:0,delay:0,life:1.1,friend:true,damage:40,element:'water',tick:G.time,inkFamily:'serpent'});}if(w==='tide'&&G.master(2))p.tideLink=G.time+5;}
 if(G.hasBless('musashi')){G.inkEffect(w,p.x,p.y,a+.3,260,.4);arcHit(a,230,40,'sword');}if(G.hasBless('tsukuyomi'))p.moonStepUntil=G.time+1.5;
};
G.awaken=()=>{const p=G.p;if(G.state!=='running'||p.power<100||G.bloodActive())return;p.power=0;p.inv=Math.max(p.inv,1.2);G.metrics.awakening_uses++;G.hostile=[];G.action('awaken',.7);const divine=p.pathRank>=2&&p.path==='divine',blood=p.pathRank>=2&&p.path==='blood';G.cinematic={name:G.ultimateName(),line:blood?'I’ll do this myself.':divine?'Murakumo, clear the way.':'Take me home.',art:G.portrait(),start:performance.now(),until:performance.now()+820,ultimate:true};
 if(blood){p.bloodUntil=G.time+10+p.pathRank*2;p.bloodLockUsed=false;p.bloodLockUntil=0;p.attackAt=G.time;G.shots=[];G.zones=G.zones.filter(z=>!z.friend);G.inkEffect('ember',p.x,p.y,0,450,1,1,{blood:true});}
 else if(divine){p.awakenUntil=G.time+6;G.inkEffect('divine',p.x,p.y,targetAngle(),850,1.4,0);for(const e of [...G.enemies])G.hit(e,360+p.pathRank*100,'divine',true);}
 else{const a=targetAngle();G.inkEffect('wing',p.x-Math.cos(a)*170,p.y-Math.sin(a)*170,a,500,1.6,1,{travel:900,ultimate:true});for(const e of [...G.enemies])G.hit(e,210,'bird',true);for(let i=0;i<12;i++)G.projectile(p.x,p.y,i*Math.PI/6,15,'bird',true);}
 if(!blood){for(let i=0;i<6*G.lv('wake_bloom')+8*G.lv('soul_feather');i++)G.projectile(p.x,p.y,i*.8,G.lv('wake_bloom')?45:24,'bird',true);}else{G.inkQueue=[];p.inkOrbit=null;}if(G.has('clean_mirror')){p.hp=Math.min(p.maxHp,p.hp+25);p.shield=Math.max(p.shield,Math.min(3,p.shield+1));}if(G.has('severed_thread')){p.hp=Math.min(p.maxHp,p.hp+20);p.freedomUntil=G.time+10;}p.hp=Math.min(p.maxHp,p.hp+8*G.lv('awakening'));G.event('awakening',{path:p.path,rank:p.pathRank,form:blood?'blood':divine?'divine':'whitebird'});};
const dash=G.dash;G.dash=()=>{const uses=G.metrics.dashes;dash();if(G.metrics.dashes>uses&&G.has('home_shell'))G.p.skillCooldowns[G.techCooldownKey(1)]=Math.max(0,(G.p.skillCooldowns[G.techCooldownKey(1)]||0)-.8*G.relicRank('home_shell'));};
const start=G.start;G.start=(...a)=>{start(...a);G.inkFx=[];G.inkQueue=[];G.inkWaves=[];G.p.techStamp=null;G.syncWeapon();};
const enter=G.enterNode;G.enterNode=(...a)=>{const result=enter(...a);if(result){G.inkQueue=[];G.inkFx=[];G.inkWaves=[];if(G.p)G.p.inkOrbit=null;}return result;};
const update=G.update;G.update=dt=>{if(G.state==='running'&&!(G.cinematic&&performance.now()<G.cinematic.until)){for(const wave of G.inkWaves){wave.travel+=wave.range/1.2*dt;for(const e of G.enemies){const dx=e.x-wave.x,dy=e.y-wave.y,along=dx*Math.cos(wave.a)+dy*Math.sin(wave.a),across=-dx*Math.sin(wave.a)+dy*Math.cos(wave.a);if(!wave.hit.has(e.id)&&Math.abs(along-wave.travel)<60+e.r&&Math.abs(across)<125+e.r){wave.hit.add(e.id);G.r2ResolveSource?G.r2ResolveSource(wave.r2Source,0,()=>G.hit(e,wave.damage,'water')):G.hit(e,wave.damage,'water');}}}G.inkWaves=G.inkWaves.filter(w=>w.travel<=w.range);for(const q of G.inkQueue)if(q.at<=G.time){q.done=true;q.run();}G.inkQueue=G.inkQueue.filter(q=>!q.done);const p=G.p,orbit=p.inkOrbit;if(orbit){if(G.time>orbit.until){if(orbit.release)for(let i=0;i<orbit.count;i++)G.projectile(p.x,p.y,i*Math.PI*2/orbit.count,orbit.damage,'bird',true);p.inkOrbit=null;}else for(let i=0;i<orbit.count;i++){const a=G.time*3+i*Math.PI*2/orbit.count,pos={x:p.x+Math.cos(a)*orbit.r,y:p.y+Math.sin(a)*orbit.r*.65};for(const e of [...G.enemies])if(d(pos,e)<e.r+18&&G.time>=(e.inkOrbitAt||0)){e.inkOrbitAt=G.time+.45;G.r2ResolveSource?G.r2ResolveSource(orbit.r2Source,Math.floor(G.time/.45),()=>G.hit(e,orbit.damage,orbit.family==='jade'?'jewel':'bird')):G.hit(e,orbit.damage,orbit.family==='jade'?'jewel':'bird');}}}for(const e of [...G.enemies])if(e.inkBurn>0){e.inkBurn-=dt;if(G.time>=(e.inkBurnAt||0)){e.inkBurnAt=G.time+.5;G.hit(e,e.inkBurnDamage*.5,'fire',true);}}}update(dt);};
})();
