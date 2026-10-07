'use strict';
(() => {
const G=WB,d=G.distance,$=G.$;
G.mythRelics=[
 ['sky_boat','Heavenly Bird-Boat Charm','Ame-no-Torifune appears among the gods and in the pacification of Ashihara-no-Nakatsukuni in the Kojiki.',r=>`Dash cooldown reduced by ${r*10}%.`],
 ['crow_feather','Yatagarasu Feather','The three-legged crow Yatagarasu guides Emperor Jimmu on his eastern expedition.',r=>`Every four melee auto hits release ${r+1}  homing feathers, each dealing 16 base damage.`],
 ['hare_grass','White Hare’s Cattail','Okuninushi heals the Hare of Inaba with fresh water and cattail pollen.',r=>`Clearing a combat room restores ${4*r}  HP.`],
 ['rock_rope','Sacred Cave Rope','After Amaterasu leaves the heavenly rock cave, the gods stretch a rope across its entrance.',r=>`Entering a combat room grants ${r}  shield(s).`],
 ['flood_jewel','Flood-Tide Jewel','The sea god gives Yamasachihiko a jewel that raises the tide.',r=>`R  technique base damage +${r*8}%, range +${r*10}%.`],
 ['ebb_jewel','Ebb-Tide Jewel','The ebb-tide and flood-tide jewels both appear in Yamasachihiko’s story.',r=>`Using R reduces the remaining F cooldown by ${(r*.5).toFixed(1)}  s.`],
 ['lost_hook','Umisachihiko’s Fishhook','Yamasachihiko borrows his brother’s fishhook, then searches for it beneath the sea.',r=>`Water hits pull minor enemies closer by ${20*r}  units. Cooldown: 2 s. Bosses are immune.`],
 ['yomi_peach','Peach of Yomi','Izanagi drives off the pursuers of Yomi with peaches.',r=>`Below 30% HP, restore ${12*r}  HP. Once per combat room.`],
 ['serpent_comb','Kushinada’s Wooden Comb','Susanoo transforms Kushinada-hime into a comb before facing the serpent.',r=>`Defense +${r} .`],
 ['heaven_arrow','Heavenly Feathered Arrow','Ame-no-Wakahiko’s bow and arrows appear in the pacification of Ashihara-no-Nakatsukuni.',r=>`Feather and water blade pierce +${r}.`],
 ['grain_pouch','Five-Grain Seed Pouch','In the Kojiki, grains grow from the body of Ogetsuhime after her death.',r=>`Clearing a combat room grants ${3*r}  coins.`],
 ['dawn_mirror','Mirror of the Dawn Cave','The gods make a mirror to draw Amaterasu out of the heavenly rock cave.',r=>`After a shield blocks an attack, deal damage within 170 range: ${40*r}  base damage. Cooldown: 3 s.`]
];
G.relics.push(...G.mythRelics.map(([id,name,lore,describe],icon)=>({id,name,lore,describe,icon,iconSet:'myth',mythic:true,text:describe(1),tags:['relic','myth']})));
G.has=id=>!G.suppressTalents&&!!G.p?.relics.includes(id);
G.equipRelic=id=>G.owned(id);
const syncRelics=()=>{if(G.p)G.p.equipped=[...G.p.relics];};
const event=G.event;G.event=(type,data={})=>{if(type==='relic_gained')syncRelics();event(type,data);};
const gain=G.gainRelic;G.gainRelic=id=>{gain(id);syncRelics();};
const relicText=G.relicText;G.relicText=r=>r.mythic?r.describe(G.p?.relicRanks?.[r.id]||1):relicText(r);
G.blessings.push(
 {id:'tachibana',name:'Ototachibana-hime · Vigil',icon:8,iconSet:'myth',affinity:'earth',portrait:8,text:'Once per combat room, the first time HP falls below 35%, restore 25% max HP and gain one shield.'},
 {id:'oousu',name:'Oousu-no-Mikoto · Reconciliation',icon:9,iconSet:'myth',affinity:'human',portrait:9,text:'Melee auto-attack damage +20%. Dashing grants +10% crit chance for 3 s.'}
);
G.pathDescription=(id,rank)=>id==='unbound'?'Q: Whitebird Crossing. Deal 210 base damage, release 12 homing feathers and clear projectiles.':id==='divine'?`All damage +${rank*12}%, technique cooldown reduction +${rank*5}%. Gain one shield when entering a combat room.${rank>=2?`Q: Divine Blade · Ame-no-Murakumo. Base damage: ${360+rank*100}. Restore 20% max HP and gain two shields. Sword light strikes once per second for the next 6 s.`:'Q: Whitebird Crossing. Clear projectiles and attack enemies.'}`:`All damage +${rank*8}%, crit chance +${rank*2}%.${rank>=2?`Q: Bloodrage · Severance. Duration: ${10+rank*2}  s. Replace your techniques with melee combos. Attack +55%, attack speed bonus +135%, lifesteal +30%. Lose 2.5% max HP per second. Prevent one lethal hit during the effect.`:'Q: Whitebird Crossing. Clear projectiles and attack enemies.'}`;
const power=G.power;G.power=()=>power()*(1+(G.p?.path==='divine'?.12:G.p?.path==='blood'?.08:0)*(G.p?.pathRank||0));
const stats=G.combatStats;G.combatStats=()=>{const s=stats();if(!s)return s;const p=G.p;s.armor+=G.relicRank('serpent_comb');if(p.path==='divine')s.cooldown=1-(1-s.cooldown)*(1-p.pathRank*.05);if(p.path==='blood')s.critChance=Math.min(.8,s.critChance+p.pathRank*.02);if(G.hasBless('oousu')&&p.brotherUntil>G.time)s.critChance=Math.min(.8,s.critChance+.1);return s;};
const tech=G.techInfo;G.techInfo=(...a)=>{const s=tech(...a);if(s.slot===1){s.damage*=1+.08*G.relicRank('flood_jewel');s.range=Math.round(s.range*(1+.1*G.relicRank('flood_jewel')));}return s;};
const cast=G.castSlot;G.castSlot=slot=>{const ok=cast(slot);if(ok&&slot===1){const key=G.techCooldownKey(0);G.p.skillCooldowns[key]=Math.max(0,(G.p.skillCooldowns[key]||0)-.5*G.relicRank('ebb_jewel'));}return ok;};
const dash=G.dash;G.dash=()=>{const n=G.metrics.dashes;dash();if(G.metrics.dashes===n)return;G.p.dashCd*=1-.1*G.relicRank('sky_boat');if(G.hasBless('oousu'))G.p.brotherUntil=G.time+3;};
G.bosses.prince.art='hero_blood_v2';
G.autoJades=[];
G.meleeStrike=(family,a,range,arc,damage,element)=>{
 if(family==='tide'){range+=G.lv('water')*12;damage*=1+G.lv('water')*.12;}
 G.action('slash',family==='hammer'?.42:.28);G.inkEffect(family,G.p.x+Math.cos(a)*(family==='spear'?85:35),G.p.y+Math.sin(a)*(family==='spear'?85:35),a,range*1.55,.34,0);
 for(const e of [...G.enemies]){if(e.dead||d(e,G.p)>range+e.r)continue;const ea=Math.atan2(e.y-G.p.y,e.x-G.p.x),delta=Math.abs(Math.atan2(Math.sin(ea-a),Math.cos(ea-a)));if(delta>arc+Math.asin(Math.min(.6,e.r/Math.max(1,d(e,G.p)))))continue;
  G.hit(e,damage*(G.hasBless('oousu')?1.2:1),'sword'===element?'sword':element);if(family==='hammer'&&!e.boss)e.inkStunUntil=G.time+.25;
  if(G.has('crow_feather')){G.p.crowHits=(G.p.crowHits||0)+1;if(G.p.crowHits%4===0)for(let i=0;i<G.relicRank('crow_feather')+1;i++)G.projectile(G.p.x,G.p.y,a+(i-.5)*.25,16,'bird',true);}
 }
};
const hit=G.hit;G.hit=(e,n,element='sword',chain=false)=>{const hp=e.hp;hit(e,n,element,chain);if(e.hp<hp&&!e.dead&&!e.boss&&element==='water'&&G.has('lost_hook')&&G.time>=(G.p.hookAt||0)){G.p.hookAt=G.time+2;const len=d(e,G.p),pull=Math.min(Math.max(0,len-65),G.relicRank('lost_hook')*20);e.x+=(G.p.x-e.x)/Math.max(1,len)*pull;e.y+=(G.p.y-e.y)/Math.max(1,len)*pull;}};
const shot=G.projectile;G.projectile=(...a)=>{const index=G.shots.length;const result=shot(...a);if(G.has('heaven_arrow'))for(const s of G.shots.slice(index))if(['bird','water'].includes(s.element))s.pierce=(s.pierce||0)+G.relicRank('heaven_arrow');return result;};
const hurt=G.hurt;G.hurt=(n,source)=>{const shield=G.p.shield;hurt(Math.max(1,n-G.relicRank('serpent_comb')),source);if(shield>G.p.shield&&G.has('dawn_mirror')&&G.time>=(G.p.mirrorAt||0)){G.p.mirrorAt=G.time+3;G.inkEffect('jade',G.p.x,G.p.y,0,340,.55,1);for(const e of [...G.enemies])if(d(e,G.p)<170)G.hit(e,40*G.relicRank('dawn_mirror'),'relic',true);}};
const awaken=G.awaken;G.awaken=()=>{const count=G.metrics.awakening_uses;awaken();if(count===G.metrics.awakening_uses||G.p.path!=='divine'||G.p.pathRank<2)return;G.p.hp=Math.min(G.p.maxHp,G.p.hp+G.p.maxHp*.2);G.p.shield+=2;G.p.divinePulses=6;G.p.divinePulseAt=G.time+.8;};
const clear=G.clearRoom;G.clearRoom=()=>{const done=G.roomDone;clear();if(done||!G.roomDone)return;G.p.hp=Math.min(G.p.maxHp,G.p.hp+4*G.relicRank('hare_grass'));const gold=3*G.relicRank('grain_pouch');G.p.gold+=gold;if(gold)G.event('relic_income',{id:'grain_pouch',amount:gold});if(!['boss','ante'].includes(G.roomType)&&G.rng()<.38){const pool=G.relics.filter(r=>!r.boss&&(!G.owned(r.id)||G.p.relicRanks[r.id]<3));if(pool.length){const r=G.pick(pool);G.drops.push({x:G.p.x+65,y:G.p.y,kind:'chest',relic:r.id,source:'room_clear',r:17});}}};
const arrive=()=>{if(!G.p)return;const n=G.currentNode,key=G.act+':'+(n?.id||G.roomSerial);if(G.p.journeyRoomKey===key)return;G.p.journeyRoomKey=key;G.autoJades=[];G.p.peachUsed=!!n?.peachUsed;G.p.tachibanaUsed=!!n?.tachibanaUsed;G.p.divinePulses=0;G.p.mirrorAt=0;G.p.hookAt=0;if(!n?.journeyEntered&&['battle','elite','boss','ante'].includes(G.roomType)){G.p.shield+=G.relicRank('rock_rope')+(G.p.path==='divine'?1:0);if(n)n.journeyEntered=true;}};
const enter=G.enterRoom;G.enterRoom=(...a)=>{enter(...a);arrive();};
const enterNode=G.enterNode;G.enterNode=(...a)=>{const ok=enterNode(...a);if(ok)arrive();return ok;};
const start=G.start;G.start=(...a)=>{start(...a);G.autoJades=[];syncRelics();};
const update=G.update;G.update=dt=>{update(dt);if(G.state!=='running')return;const p=G.p;
 if(!p.peachUsed&&G.has('yomi_peach')&&p.hp>0&&p.hp<p.maxHp*.3){p.peachUsed=true;if(G.currentNode)G.currentNode.peachUsed=true;p.hp=Math.min(p.maxHp,p.hp+12*G.relicRank('yomi_peach'));G.event('relic_heal',{id:'yomi_peach'});}
 if(!p.tachibanaUsed&&G.hasBless('tachibana')&&p.hp>0&&p.hp<p.maxHp*.35){p.tachibanaUsed=true;if(G.currentNode)G.currentNode.tachibanaUsed=true;p.hp=Math.min(p.maxHp,p.hp+p.maxHp*.25);p.shield++;G.inkEffect('tide',p.x,p.y,0,220,.7,1);G.toast('Ototachibana: Stay on your feet. I’m with you.');}
 if(!G.bloodActive()&&p.divinePulses>0&&G.time>=p.divinePulseAt){p.divinePulses--;p.divinePulseAt=G.time+1;G.inkEffect('divine',p.x,p.y,0,500,.55,1);for(const e of [...G.enemies])if(d(e,p)<420)G.hit(e,60+p.pathRank*20,'sword',true);}
 if(G.bloodActive())G.autoJades=[];G.autoJades=G.autoJades.filter(o=>G.time-o.start<1.05);for(const o of G.autoJades){const a=o.a+(G.time-o.start)*Math.PI*2;const pos={x:p.x+Math.cos(a)*110,y:p.y+Math.sin(a)*110};for(const e of [...G.enemies])if(!e.dead&&!o.hits.has(e.id)&&d(pos,e)<e.r+25){o.hits.add(e.id);G.r2ResolveSource?G.r2ResolveSource(o.r2Source,0,()=>G.hit(e,23,'jewel')):G.hit(e,23,'jewel');}}
};
const draw=G.drawPaintedFx;G.drawPaintedFx=ctx=>{draw(ctx);const im=G.inkAtlases.jade?.[1];if(!im||!G.p)return;for(const o of G.autoJades){const a=o.a+(G.time-o.start)*Math.PI*2;ctx.save();ctx.translate(G.p.x+Math.cos(a)*110,G.p.y+Math.sin(a)*110-15);ctx.rotate(a);ctx.drawImage(im,-25,-25,50,50);ctx.restore();}};
G.drawActorAttributes=()=>{};
const float=G.float;G.float=(x,y,text,...args)=>float(x,y,/^[+-]?\d+(?:\.\d+)?$/.test(String(text))?String(Math.round(Number(text))):text,...args);
const autos={tide:['Melee Arc','Slash toward the target, hitting enemies in a forward arc of 165 range. Base damage: 38.'],ember:['Melee Fire Slash','Slash forward within 140 range. Base damage: 42. Attack interval: 0.46 s.'],wing:['Homing Feathers','Fire two homing feathers per attack. Base damage: 24 each.'],jade:['Orbiting Jewels','Summon three magatama for one orbit at a radius of 110. Base damage: 23 each.'],spear:['Melee Thrust','Pierce a narrow forward path of 235 range. Base damage: 76.'],hammer:['Melee Tremor','Strike within 150 range around you. Base damage: 72. Stun minor enemies for 0.25 s.']};
G.autoDescriptions=autos;for(const w of G.weapons){w.tag=autos[w.id][0];w.text=autos[w.id][1];}
for(const [id,base] of Object.entries({tide:38,ember:42,wing:24,jade:23,spear:76,hammer:72}))G.weaponProfiles[id][2]=base;
})();
