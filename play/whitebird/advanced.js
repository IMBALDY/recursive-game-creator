'use strict';
(() => {
const G=WB,d=G.distance;
const originalStart=G.start;
G.start=(...args)=>{G.obedience=0;G.autonomy=0;G.shadowFinal=false;G.grass=[];G.beams=[];originalStart(...args);if(G.p){G.p.waterArt='wave';G.p.waterCd=0;G.p.black=false;G.p.blackUnlocked=false;}};
const enter=G.enterRoom;
G.enterRoom=type=>{G.beams=[];G.grass=[{x:450,y:500,r:70,burning:0},{x:990,y:350,r:70,burning:0},{x:1050,y:690,r:60,burning:0}];enter(type);G.p.waterCd=0;if(G.has('bead'))G.p.shield++;};
const oldPower=G.power;G.power=()=>oldPower()*(G.p.black?1.4:1);
G.blackMode=()=>{if(G.state!=='running'||!G.p.blackUnlocked)return;G.p.black=!G.p.black;G.event('black_mode_changed',{active:G.p.black});G.toast(G.p.black?'Imperial Command · Damage +40%; lose 1.5 HP per second':'Bloodrage has ended.');};
G.waterSkill=()=>{
 const p=G.p;if(G.state!=='running'||p.waterCd>0)return;const art=G.waterArts.find(a=>a.id===p.waterArt)||G.waterArts[0];if(G.lv('water')<art.level)return;
 p.waterCd=art.cd;G.metrics.skill_uses++;G.event('active_skill',{id:art.id,kind:'water_art'});const n=G.nearest(),a=n?Math.atan2(n.y-p.y,n.x-p.x):p.facing;
 if(art.id==='wave'){for(let i=-3;i<=3;i++)G.projectile(p.x,p.y,a+i*.17,32,'water');G.effect(p.x,p.y,0,230,.5,a);}
 if(art.id==='orb'){for(let i=-1;i<=1;i++){G.projectile(p.x,p.y,a+i*.35,38,'water');const s=G.shots.at(-1);s.vx*=.45;s.vy*=.45;s.life=2.2;s.orb=true;s.r=24;s.pierce=20;s.boom=false;}}
 if(art.id==='tide'){G.beams.push({x:p.x,y:p.y,a,life:.85,max:.85,width:130,water:true});for(const e of [...G.enemies]){const dx=e.x-p.x,dy=e.y-p.y;if(dx*Math.cos(a)+dy*Math.sin(a)>-40&&Math.abs(-dx*Math.sin(a)+dy*Math.cos(a))<155)G.hit(e,140,'water');}G.effect(p.x,p.y,4,350,.65);}
 if(art.id==='orochi'){G.fx.push({orochi:true,x:p.x,y:p.y,life:1.8,max:1.8,size:780});G.zones.push({x:p.x,y:p.y,r:370,age:0,delay:0,life:1.8,friend:true,damage:62,element:'water',tick:0});G.shake=9;}
 G.beep(540,.3);
};
const skill=G.skill;
G.skill=()=>{if(G.state!=='running'||G.p.skillCd>0)return;const p=G.p,n=G.nearest(),a=n?Math.atan2(n.y-p.y,n.x-p.x):p.facing;skill();if(G.state!=='running')return;G.effect(p.x,p.y,0,340,.5,a);for(const e of [...G.enemies])if(d(e,p)<180)G.hit(e,28,'sword');if(p.weaponLevel>=1){for(const grass of G.grass)if(d(grass,p)<260){grass.burning=4;G.event('grass_ignited',{x:grass.x,y:grass.y});}}
};
const attack=G.attack;
G.attack=()=>{attack();if(G.has('bead'))for(let i=0;i<3;i++){const a=G.time*2+i*Math.PI*2/3,pos={x:G.p.x+Math.cos(a)*75,y:G.p.y+Math.sin(a)*75};for(const e of [...G.enemies])if(d(pos,e)<e.r+17&&(!e.beadAt||G.time>e.beadAt)){e.beadAt=G.time+.5;G.hit(e,22,'jewel');}}};
const addTalent=G.addTalent;
G.addTalent=id=>{addTalent(id);if(id==='water'){const art=[...G.waterArts].reverse().find(a=>a.level<=G.lv('water'));if(art&&art.id!==G.p.waterArt){G.p.waterArt=art.id;G.event('water_art_equipped',{id:art.id,reason:'new_unlock'});}}};
const update=G.update;
G.update=dt=>{if(G.state!=='running')return;G.p.waterCd=Math.max(0,(G.p.waterCd||0)-dt);if(G.p.black){G.p.hp=Math.max(1,G.p.hp-1.5*dt);if(G.p.hp<=1){G.p.black=false;G.event('black_mode_changed',{active:false,reason:'exhausted'});}}for(const grass of G.grass){if(grass.burning>0){grass.burning-=dt;if((grass.tick||0)<G.time){grass.tick=G.time+.5;for(const e of [...G.enemies])if(d(e,grass)<grass.r+e.r)G.hit(e,18,'fire',true);}}}for(const s of G.shots)if(s.orb&&!s.boom&&s.life<.1){s.boom=true;G.effect(s.x,s.y,4,180,.5);for(const e of [...G.enemies])if(d(e,s)<100)G.hit(e,50,'water');}for(const b of G.beams)b.life-=dt;G.beams=G.beams.filter(b=>b.life>0);
 if(G.boss?.kind==='prince'&&G.time>=(G.boss.mirrorAt||0)){const e=G.boss;e.mirrorAt=G.time+4.2;e.aim=Math.atan2(G.p.y-e.y,G.p.x-e.x);e.windup=.9;G.danger(G.p.x,G.p.y,90,1.1,'line');G.danger(G.p.x+200,G.p.y,90,1.4,'line');G.event('boss_mirror_dash');}update(dt);
};
const summary=G.summary;G.summary=()=>({...summary(),autonomy:G.autonomy,obedience:G.obedience,shadow_final:G.shadowFinal,water_art:G.p?.waterArt});
})();
