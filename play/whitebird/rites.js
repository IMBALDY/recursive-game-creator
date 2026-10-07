'use strict';
(() => {
const G=WB,d=G.distance;
G.bosses.ibuki_heaven={name:'Ibuki Daimyojin · Yamata-no-Orochi',title:'Ibuki-no-Okami · Serpent of Heaven’s Gate',line:'“The old tale says you died on this mountain. Today, eight heads ask where you will go.”',tip:'Eight heads lock onto your position in turn. Leave the poison pools before the serpent shadows close. Find a path between the heavenly beams.',art:'orochi_portrait',hp:7400,r:100,speed:18};
G.bosses.aragami.name='God of Mount Ibuki';G.bosses.aragami.title='Breath of the Mountain · White Boar Lord';
G.bosses.aragami.tip='The human form swings a stone axe; the divine boar then breaks through the gate. Dodge the tusk charge and strike during its pause.';
G.bosses.sea.tip='The human form pursues with three-pronged tide blades. The sea dragon summons tide walls and vortices. Watch for gaps and counterattack as the water recedes.';
G.bosses.guardian.tip='The hammer strikes your previous position and scatters rocks. Circle around it after the tremor to counterattack.';
G.bosses.father.tip='Break the edict seals, then dodge the falling golden lines. The formations grow denser, but each leaves an escape route.';
G.riteImages={};G.riteFx=[];
const fxnames=['guardian','edict','mountain','sea','prince','whitebird','orochi'];
G.riteReady=Promise.all(fxnames.map(name=>new Promise(resolve=>{const im=new Image();im.onload=()=>{const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const cx=c.getContext('2d',{willReadFrequently:true});cx.drawImage(im,0,0);const data=cx.getImageData(0,0,c.width,c.height),a=data.data,bg=[a[0],a[1],a[2]];for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++){const i=(y*c.width+x)*4,delta=Math.max(Math.abs(a[i]-bg[0]),Math.abs(a[i+1]-bg[1]),Math.abs(a[i+2]-bg[2])),edge=Math.min(x,y,c.width-1-x,c.height-1-y)/Math.min(c.width,c.height);a[i+3]*=G.clamp((delta-18)/75,0,1)*G.clamp(edge/.12,0,1);}cx.putImageData(data,0,0);G.riteImages[name]=c;resolve();};im.onerror=()=>resolve();im.src='assets/fx_'+name+'.png';})));
G.bossEffect=(name,x,y,size=300,rotation=0)=>{G.riteFx.push({name,x,y,size,rotation,start:G.time,duration:1.1});if(G.riteFx.length>24)G.riteFx.shift();};
G.drawBossFx=ctx=>{
 G.riteFx=G.riteFx.filter(f=>G.time>=f.start&&G.time-f.start<f.duration);ctx.save();
 for(const f of G.riteFx){const im=G.riteImages[f.name];if(!im)continue;const t=(G.time-f.start)/f.duration,s=f.size*(.65+t*.5);ctx.save();ctx.globalAlpha=Math.sin(Math.PI*Math.min(.99,t+.1))*.82;ctx.translate(f.x,f.y-30);ctx.rotate(f.rotation);ctx.drawImage(im,-s/2,-s/2,s,s);ctx.restore();}
 ctx.restore();
};
const kindFx=k=>({guardian:'guardian',father:'edict',aragami:'mountain',sea:'sea',ibuki_heaven:'orochi',prince:'prince',whitebird:'whitebird',magatsu:'orochi'}[k]||'guardian');
const hazard=(b,x,y,r,delay,kind='circle')=>{G.casterKind=b.kind;G.danger(x,y,r,delay,kind);G.casterKind=null;const z=G.zones.at(-1);z.ritual=kindFx(b.kind);return z;};
G.enemyImpact=z=>{if(z.ritual){G.bossEffect(z.ritual,z.x,z.y,z.kind==='hline'?560:z.r*3);if(z.ritual==='sea')G.fx3d?.('wave',80,z.y,0,2);if(z.ritual==='mountain')G.fx3d?.('ripple',z.x,z.y,0,1.5);}else G.addEnemyFx(z.source==='thunder'?'thunder':'impact',z.x,z.y,z.source==='siren'?'#7fe5e5':'#ec9c7d',z.r||80);};
function pattern(b){
 const p=G.p,phase=b.ritePhase,k=b.kind,a=Math.atan2(p.y-b.y,p.x-b.x);b.patternStep=(b.patternStep||0)+1;b.animUntil=G.time+.8;b.action={kind:'cast',start:G.time,duration:.8,until:G.time+.8};G.bossEffect(kindFx(k),b.x,b.y,phase===3?390:280);G.event('boss_pattern',{kind:k,phase,step:b.patternStep});
 if(k==='guardian'){
  const x=p.x,y=p.y;hazard(b,x,y,95,.95);for(let i=0;i<phase+2;i++){const ang=i*Math.PI*2/(phase+2);hazard(b,G.clamp(x+Math.cos(ang)*170,140,1300),G.clamp(y+Math.sin(ang)*130,220,700),48,1.3+i*.1);}b.restUntil=G.time+1.9;
 }else if(k==='father'){
  if(b.patternStep%2===1){b.action={kind:'summon',start:G.time,duration:1.2,until:G.time+1.2};const count=Math.min(2+phase,6-G.enemies.filter(e=>e.kind==='soldier'&&!e.dead).length);for(let i=0;i<count;i++){const soldier=G.spawn('soldier');soldier.x=G.clamp(b.x+(i%2?1:-1)*(140+Math.floor(i/2)*85),180,1260);soldier.y=G.clamp(b.y+110,250,670);soldier.action={kind:'cast',start:G.time,duration:.6,until:G.time+.6};soldier.aiAt=G.time+1.5;G.bossEffect('edict',soldier.x,soldier.y,150);}G.event('imperial_summons',{count});G.toast('Imperial Edict · Form Ranks');}else{const gap=Math.floor(G.rng()*5);for(let i=0;i<5;i++)if(i!==gap)hazard(b,260+i*230,480,36,1.5+i*.08,'line');for(let i=-phase;i<=phase;i++){G.hostileShot(b,a+i*.22,130);G.hostile.at(-1).color='#eac881';}b.action={kind:'cast',start:G.time,duration:.9,until:G.time+.9};}b.restUntil=G.time+1.3;
 }else if(k==='aragami'){
  if(phase===1){hazard(b,p.x,p.y,100,1.1);hazard(b,G.clamp(p.x+180,180,1260),p.y,60,1.6);b.restUntil=G.time+1.8;}
  else{b.aim=a;b.windup=1;b.rush=true;for(let i=1;i<=3;i++)hazard(b,G.clamp(b.x+Math.cos(a)*i*140,150,1290),G.clamp(b.y+Math.sin(a)*i*140,240,710),55,1.2+i*.2);if(phase===3)for(let i=-1;i<=1;i++)hazard(b,720+i*240,620,70,2.2);}
 }else if(k==='sea'){
  if(phase===1){for(let i=-2;i<=2;i++)G.hostileShot(b,a+i*.16,170);hazard(b,p.x,p.y,80,1.3);}
  else{
   const safe=G.clamp(p.y,260,690);for(const y of [235,355,475,595,715])if(Math.abs(y-safe)>85)hazard(b,720,y,48,1.4+(y%3)*.08,'hline');
   const z=hazard(b,720,480,145,2.1);z.pull=true;z.life=3;if(phase===3)for(let i=-2;i<=2;i++)G.hostileShot(b,a+i*.27,125);
  }
 }else if(k==='ibuki_heaven'){
  // Eight heads take separate positions. A rotating pair remains quiet as the safe sector.
  const gap=b.patternStep%8;for(let i=0;i<8;i++){const theta=i*Math.PI/4,x=720+Math.cos(theta)*360,y=470+Math.sin(theta)*210;if(i===gap||i===(gap+1)%8)continue;const z=hazard(b,x,y,phase===3?92:72,.85+(i%4)*.22);z.head=i;}
  if(phase>=2){for(let i=0;i<phase;i++)hazard(b,G.clamp(p.x+(i-1)*160,180,1260),G.clamp(p.y,240,700),58,1.8+i*.2);}
  if(phase===3&&b.patternStep%2===0){hazard(b,410,470,35,2,'line');hazard(b,1030,470,35,2,'line');}b.restUntil=G.time+1.1;
 }else if(k==='prince'){
  b.aim=a;b.windup=.75;b.rush=true;const x=p.x;hazard(b,x,p.y,45,1.0,'line');if(phase>1)hazard(b,G.clamp(x+180,160,1280),p.y,45,1.5,'line');if(phase===3)hazard(b,G.clamp(x-180,160,1280),p.y,45,1.9,'line');
 }else if(k==='whitebird'){
  const gap=(b.patternStep*3)%20;for(let i=0;i<20;i++)if((i-gap+20)%20>4)G.hostileShot(b,i*Math.PI/10,105+phase*15);for(let i=0;i<phase+1;i++){const theta=i*Math.PI*2/(phase+1);hazard(b,G.clamp(p.x+Math.cos(theta)*140,140,1300),G.clamp(p.y+Math.sin(theta)*120,230,710),52,1.25+i*.18);}b.restUntil=G.time+1;
 }
}
const spawnBoss=G.spawnBoss;G.spawnBoss=()=>{spawnBoss();const b=G.boss;Object.assign(b,{ritePhase:1,combatPhase:1,riteAt:G.time+(b.kind==='guardian'?.7:2.2),attackAt:Infinity,specialAt:Infinity,godAt:Infinity,mirrorAt:Infinity,patternStep:0,phaseForm:'human'});if(b.kind==='ibuki_heaven'){b.phaseForm='serpent';b.x=720;b.y=355;b.speed=14;b.affinity='heaven';}G.riteFx=[];};
// Retain ordinary enemy AI; replace every boss attack timer with one authored pattern clock.
const ordinary=G.updateEnemies;G.updateEnemies=dt=>{
 const b=G.boss;if(!b){ordinary(dt);return;}
 const saved=G.boss;G.boss=null;G.enemies=G.enemies.filter(e=>e!==b);ordinary(dt);G.boss=saved;if(b.dead)return;G.enemies.push(b);
 b.flash=Math.max(0,b.flash-dt);b.wet=Math.max(0,b.wet-dt);const phase=b.hp/b.maxHp<.28?3:b.hp/b.maxHp<.62?2:1;
 if(phase>b.ritePhase){b.ritePhase=phase;b.combatPhase=phase;b.transitionUntil=G.time+1.2;b.riteAt=G.time+2;b.openAt=Infinity;b.openUntil=0;G.hostile=[];// Guardian's already-visible circles remain committed through phase changes.
  G.zones=G.zones.filter(z=>z.friend||(b.kind==='guardian'&&z.ritual==='guardian'));b.windup=0;b.charge=0;
  if(['sea','aragami'].includes(b.kind)){b.phaseForm='beast';b.r=phase===3?78:68;G.cinematic={name:b.kind==='sea'?'Hashirimizu · Sea Dragon Revealed':'Ibuki · White Boar Lord',line:phase===2?'The gods shed their human forms. Mountain and sea reveal their ancient shapes.':'Heaven and earth bow low. One sword still rises.',art:b.art,until:performance.now()+1800};}
  else G.toast(b.kind==='ibuki_heaven'?(phase===2?'Eight Heads Awaken · Heaven’s Gate Shatters':'Ibuki-no-Okami · The Old Tale Burns'):b.name+' · '+(phase===2?'Wild Form':'Godfall Form'));
  G.bossEffect(kindFx(b.kind),b.x,b.y,phase===3?700:550);G.event('boss_rite_phase',{kind:b.kind,phase,form:b.phaseForm});
 }
 if(b.transitionUntil>G.time)return;
 if(b.charge>0){b.charge-=dt;b.x+=Math.cos(b.aim)*440*dt;b.y+=Math.sin(b.aim)*440*dt;if(b.charge<=0){b.restUntil=G.time+1.35;G.bossEffect(kindFx(b.kind),b.x,b.y,380);}}
 else if(b.windup>0){b.windup-=dt;if(b.windup<=0&&b.rush){b.charge=.6;b.rush=false;}}
 else if(G.time>(b.restUntil||0)&&d(b,G.p)>b.r+110){const a=Math.atan2(G.p.y-b.y,G.p.x-b.x);b.x+=Math.cos(a)*b.speed*dt;b.y+=Math.sin(a)*b.speed*dt;}
 G.collision(b);if(Math.abs(G.p.x-b.x)>90&&!b.windup&&!b.charge&&!(b.action?.until>G.time))b.renderFacing=G.p.x<b.x?-1:1;if(d(b,G.p)<b.r+G.p.r-5)G.hurt(b.charge>0?26:17,b.kind);
 if(G.time>=b.riteAt){pattern(b);const recovery={guardian:1.85,father:1.9,aragami:phase===3?2.35:1.9,sea:phase===1?1.7:2.3,ibuki_heaven:2.35,prince:2.05,whitebird:2};b.openAt=G.time+(recovery[b.kind]||2);b.openUntil=b.openAt+1.45;b.restUntil=b.openUntil;b.riteAt=G.time+({guardian:4.2,father:4.7,aragami:4.7,sea:4.8,ibuki_heaven:4.9,prince:3.9,whitebird:4.4}[b.kind]||4.5)-(phase-1)*.35;b.riteAt=Math.max(b.riteAt,b.openUntil+.3);}
 for(const z of G.zones)if(z.pull&&z.age<z.delay&&d(z,G.p)<270){G.p.x+=(z.x-G.p.x)*dt*.22;G.p.y+=(z.y-G.p.y)*dt*.22;}
};
const update=G.update;G.update=dt=>{if(G.boss){G.boss.attackAt=Infinity;G.boss.specialAt=Infinity;G.boss.godAt=Infinity;G.boss.mirrorAt=Infinity;}update(dt);};
})();
