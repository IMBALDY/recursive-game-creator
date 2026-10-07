'use strict';
(() => {
const G=WB,d=G.distance;
G.stages=['battle','forge','battle','support','elite','camp','boss'];
G.enemyFx=[];G.action=(kind,duration=.5)=>{G.p.action={kind,start:G.time,duration,until:G.time+duration};const n=G.nearest();if(kind!=='dash'&&n&&Math.abs(n.x-G.p.x)>40)G.p.renderFacing=Math.sign(n.x-G.p.x);};
const start=G.start;G.start=(...a)=>{start(...a);if(!G.p)return;G.p.action=null;G.p.renderFacing=1;G.p.walkTime=0;G.p.awakenUntil=0;G.enemyFx=[];G.roomSerial=0;};
G.nextRoute=()=>{
 if(G.stage===6){G.act++;G.stage=0;if(G.act>=G.regions.length){G.finish('victory');return;}G.uiStory(G.act,()=>G.enterRoom('battle'));return;}
 G.stage++;const type=G.stages[G.stage];
 if(type==='support')G.uiRoute([{id:'shop',name:'Lantern Merchant',icon:10,iconSet:'voyage',text:'The lantern is still lit. A merchant waits beside it.',tags:['shop']},{id:'shrine',name:'Sanctuary',icon:5,text:'Sit for a moment and learn a new sword art.',tags:['talent']},{id:'event',name:'Crossroads Encounter',icon:10,text:'A stranger’s voice comes from behind the reeds.',tags:['event']}]);
 else G.uiRoute([{id:type,name:{battle:'Deeper Along the Old Road',forge:'Flint Forge',elite:'Spirit Guardian',camp:'Stillwind Garden',boss:G.bosses[G.bossKey()].name}[type],icon:type==='forge'?11:type==='camp'?9:0,text:type==='boss'?'Open the gate at the end of the path.':type==='forge'?'The forge is still warm. Hand your weapon to the smith.':'Follow the lanterns onward.',tags:[type]}]);
};
const enter=G.enterRoom;G.enterRoom=type=>{G.roomSerial++;enter(type);G.enemyFx=[];G.p.action=null;G.p.shield=Math.min(2,G.p.shield);G.roomTarget=type==='elite'?40:G.stage===2?35:30;G.spawnAt=G.time+1.5;G.p.power=Math.min(100,G.p.power);if(type==='camp'){G.interactable={x:720,y:400,type:'camp'};G.obstacles=[];G.toast('Stillwind Garden');}G.event('chapter_pacing',{chapter:G.act,stage:G.stage,serial:G.roomSerial});};
const interact=G.interact;G.interact=()=>{if(G.roomType==='camp'&&G.state==='running'&&G.interactable&&d(G.p,G.interactable)<110){G.offer('Stillwind Garden','There will be time to talk at dawn.',[{id:'rest',name:'Rest by the Lantern',icon:9,text:'Restore a little HP.',tags:['recovery']},{id:'temper',name:'Practice Your Swordplay',icon:0,text:'Leave with your awakening charge at least half full.',tags:['awakening']}],c=>{if(c.id==='rest')G.p.hp=Math.min(G.p.maxHp,G.p.hp+18);else G.p.power=Math.max(50,G.p.power);G.completeSupport();},'camp');return;}interact();};
G.clearRoom=()=>{
 if(G.roomDone||G.ended)return;G.roomDone=true;G.state='reward';G.keys.clear();G.hostile=[];G.zones=[];G.shots=[];G.enemies=[];
 for(const drop of G.drops)if(['coin','chest','essence'].includes(drop.kind))G.collectLoot(drop);
 const gold=G.roomType==='boss'?30:G.roomType==='elite'?20:12;G.p.gold+=gold;G.p.hp=Math.min(G.p.maxHp,G.p.hp+2+2*G.lv('harvest'));
 G.event('room_cleared',{act:G.act,stage:G.stage,kind:G.roomType,gold,duration:G.roomTime,serial:G.roomSerial});
 const serial=G.roomSerial,proceed=()=>{if(serial!==G.roomSerial)return;G.offer('Fading Embers','There are still lanterns ahead.',[{id:'continue',name:'Continue Onward',icon:2,text:'Sheathe your sword and take the next path.',tags:['continue']}],()=>G.nextRoute(),'room_departure');};
 if(G.roomType==='boss')G.offerRelic(proceed);else if(G.roomType==='elite')G.offerTalent(proceed,'elite_reward');else proceed();
};
const spawn=G.spawn;G.spawn=kind=>{const e=spawn(kind);e.hp*=1.5;e.maxHp=e.hp;e.renderFacing=G.p.x<e.x?-1:1;e.walkTime=0;e.aiAt=G.time+1.8+G.rng();return e;};
const boss=G.spawnBoss;G.spawnBoss=()=>{boss();G.boss.hp*=1.4;G.boss.maxHp=G.boss.hp;G.boss.renderFacing=1;};
G.addEnemyFx=(kind,x,y,color='#ef927c',r=120,a=0)=>{G.enemyFx.push({kind,x,y,color,r,a,start:G.time,duration:kind==='tide'?.7:.55});if(G.enemyFx.length>70)G.enemyFx.shift();};
G.enemyImpact=z=>G.addEnemyFx(z.kind==='hline'?'tide':z.kind==='line'?'slash':z.source==='thunder'?'thunder':'impact',z.x,z.y,z.source==='sea'||z.source==='wraith'?'#65ded8':'#ee9274',z.r||100);
const danger=G.danger;G.danger=(...args)=>{danger(...args);G.zones.at(-1).source=G.casterKind||G.boss?.kind||'guardian';};
const hostile=G.hostileShot;G.hostileShot=(e,a,speed)=>{hostile(e,a,speed);const shot=G.hostile.at(-1);if(shot){shot.color=['fox','guardian'].includes(e.kind)?'#ffae65':['sea','wraith','siren'].includes(e.kind)?'#79eee4':'#e09bff';shot.kind=e.kind;shot.damage=e.boss?16:12;}if(G.time>(e.fxAt||0)){e.fxAt=G.time+.2;e.animUntil=G.time+.45;G.addEnemyFx(e.kind==='thunder'?'thunder':'slash',e.x,e.y,shot?.color||'#edb888',80,a);}};
const oldEnemies=G.updateEnemies;
G.updateEnemies=dt=>{
 const ordinary=G.enemies.filter(e=>!e.boss&&e.kind!=='seal'),major=G.enemies.filter(e=>e.boss||e.kind==='seal');G.enemies=major;oldEnemies(dt);G.enemies.push(...ordinary.filter(e=>!e.dead));
 for(const e of ordinary){if(e.dead||e.inkStunUntil>G.time)continue;e.flash=Math.max(0,e.flash-dt);e.wet=Math.max(0,e.wet-dt);const a=Math.atan2(G.p.y-e.y,G.p.x-e.x),dist=d(e,G.p);const ranged=['fox','thunder','siren','wraith'].includes(e.kind);
  if(e.burn>0){e.burn-=dt;e.burnTick=(e.burnTick||0)+dt;if(e.burnTick>.5){e.burnTick=0;G.hit(e,3.5*G.lv('burn'),'burn',true);if(e.dead)continue;}}
  if(e.charge>0){e.charge-=dt;e.x+=Math.cos(e.aim)*370*dt;e.y+=Math.sin(e.aim)*370*dt;G.addEnemyFx('slash',e.x,e.y,'#eea277',40,e.aim);}
  else if(e.windup>0){e.windup-=dt;if(e.windup<=0){e.animUntil=G.time+.45;G.casterKind=e.kind;if(['soldier','boar'].includes(e.kind))e.charge=.42;else if(ranged){if(e.kind==='thunder'){G.danger(e.targetX,e.targetY,68,.55);G.addEnemyFx('thunder',e.x,e.y,'#dbb1ff',80);}else for(let i=-1;i<=1;i++)G.hostileShot(e,e.aim+i*.18,e.kind==='fox'?170:140);}else G.danger(e.targetX,e.targetY,e.kind==='crab'?82:58,.2);G.casterKind=null;G.addEnemyFx('slash',e.x,e.y,'#eea277',100,e.aim);}}
  else if(G.time>=e.aiAt&&(ranged||dist<250)){e.aim=a;e.targetX=G.p.x;e.targetY=G.p.y;e.windup=e.kind==='boar'?.8:.65;e.aiAt=G.time+(ranged?3.4:2.6);e.renderFacing=Math.cos(a)<0?-1:1;}
  else if(dist>e.r+G.p.r){const f=e.wet>0?.8*(1-Math.min(.3,G.lv('ice')*.18)):1,k=ranged&&dist<230?-.3:1;e.x+=Math.cos(a)*e.speed*dt*f*k;e.y+=Math.sin(a)*e.speed*dt*f*k;}
  G.collision(e);if(d(e,G.p)<e.r+G.p.r-3)G.hurt(e.charge>0?18:10,e.kind);
 }
};
G.weaponTechnique=()=>{
 const p=G.p,w=p.weapon,n=G.nearest(),a=n?Math.atan2(n.y-p.y,n.x-p.x):p.facing;
 if(w==='jade'){G.burst(p.x,p.y,10,28,'jewel');p.featherOrbitUntil=G.time+2;G.effect(p.x,p.y,5,270,.6);}
 if(w==='mirror'){G.effect(p.x,p.y,5,370,.65);for(const e of [...G.enemies])if(d(e,p)<220){G.hit(e,65,'mirror');if(!e.boss){e.x+=(e.x-p.x)*.2;e.y+=(e.y-p.y)*.2;}}}
 if(w==='spear'){G.projectile(p.x,p.y,a,115,'water');const s=G.shots.at(-1);s.pierce=20;s.r=20;s.vx*=1.6;s.vy*=1.6;G.effect(p.x,p.y,0,190,.4,a);}
 if(w==='hammer'&&n){G.effect(n.x,n.y,3,240,.7);G.zones.push({x:n.x,y:n.y,r:140,age:0,delay:.25,life:.65,friend:true,damage:105,element:'thunder',once:true});}
 if(w==='talisman'){for(let i=-2;i<=2;i++)G.projectile(p.x,p.y,a+i*.45,35,'bird',true);G.effect(p.x,p.y,5,180,.5);}
 if(w==='comb'){for(let i=-2;i<=2;i++)G.projectile(p.x,p.y,a+i*.12,40,'water');p.hp=Math.min(p.maxHp,p.hp+3);G.effect(p.x,p.y,4,220,.65);}
 if(w==='shaku')G.masterBeam?.(a,115);
 if(w==='flute'){G.burst(p.x,p.y,12,28,'bird');G.effect(p.x,p.y,2,380,.65);}
 if(w==='divine'){G.effect(p.x,p.y,0,410,.65,a);for(const e of [...G.enemies])if(d(e,p)<240)G.hit(e,115,'sword');}
};
const skill=G.skill;G.skill=()=>{const n=G.metrics.skill_uses;skill();if(G.metrics.skill_uses>n)G.action(['jade','mirror','hammer','talisman','flute','comb'].includes(G.p.weapon)?'cast':'slash',.55);};
const water=G.waterSkill;G.waterSkill=()=>{const n=G.metrics.skill_uses;water();if(G.metrics.skill_uses>n)G.action('cast',.65);};
const dash=G.dash;G.dash=()=>{const n=G.metrics.dashes;dash();if(G.metrics.dashes>n){G.action('dash',.24);if(Math.abs(G.p.dx)>.2)G.p.renderFacing=Math.sign(G.p.dx);}};
const awaken=G.awaken;G.awaken=()=>{const n=G.metrics.awakening_uses;awaken();if(G.metrics.awakening_uses>n){G.p.awakenUntil=G.time+4;G.action('awaken',.85);}};
const attack=G.attack;G.attack=()=>{const p=G.p,at=p.attackAt;attack();if(p.attackAt>at&&!(p.action?.until>G.time)){if(!G.moveVector().x&&!G.moveVector().y)G.action('slash',.28);}p.attackAnim=0;};
const hurt=G.hurt;G.hurt=(amount,source)=>hurt(Math.max(amount,amount*.45+G.p.armor+G.lv('ward')),source);
const update=G.update;G.update=dt=>{
 if(G.state!=='running')return;const p=G.p,m=G.moveVector(),snap=G.enemies.map(e=>[e,e.x,e.y]);
 if(m.x||m.y){p.walkTime+=dt;if(!(p.action?.until>G.time)&&Math.abs(m.x)>.2)p.renderFacing=Math.sign(m.x);}
 G.p.shield=Math.min(2,G.p.shield);update(dt);G.enemyFx=G.enemyFx.filter(f=>G.time-f.start<f.duration);G.p.shield=Math.min(2,G.p.shield);
 for(const [e,x,y] of snap){e.walking=Math.hypot(e.x-x,e.y-y)>.3;if(e.walking)e.walkTime=(e.walkTime||0)+dt;if(!e.windup&&!e.charge&&!(e.animUntil>G.time)&&Math.abs(G.p.x-e.x)>65&&G.time>(e.faceAt||0)){e.renderFacing=Math.sign(G.p.x-e.x);e.faceAt=G.time+.4;}}
};
})();
