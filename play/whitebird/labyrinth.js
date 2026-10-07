'use strict';
(() => {
const G=WB,d=G.distance;
G.directions=[{id:'up',dx:0,dy:-1,x:720,y:183,entry:[720,718],label:'N'},{id:'right',dx:1,dy:0,x:1350,y:470,entry:[160,470],label:'E'},{id:'down',dx:0,dy:1,x:720,y:758,entry:[720,235],label:'S'},{id:'left',dx:-1,dy:0,x:90,y:470,entry:[1280,470],label:'W'}];
G.roomNames={battle:'Purification Grounds',elite:'Wild Spirit Trial',forge:'Flint Forge',shop:'Lantern Merchant',blessing:'Hidden Sanctuary',event:'Crossroads Encounter',camp:'Stillwind Garden',boss:'Seat of the Wild Spirit',ante:'Ibuki Heaven’s Gate',treasure:'Lost Treasure'};
G.layouts=[
 [{x:440,y:330,r:40},{x:1000,y:630,r:40}],
 [{x:510,y:330,r:42},{x:930,y:330,r:42},{x:510,y:630,r:42},{x:930,y:630,r:42}],
 [{x:470,y:470,r:55},{x:970,y:470,r:55}],
 [{x:430,y:300,r:35},{x:600,y:580,r:35},{x:840,y:360,r:35},{x:1010,y:640,r:35}],
 [{x:550,y:370,r:48},{x:890,y:570,r:48}],
 [{x:380,y:610,r:50},{x:1060,y:310,r:50}],
 [{x:520,y:300,r:28},{x:720,y:300,r:28},{x:920,y:300,r:28},{x:520,y:650,r:28},{x:920,y:650,r:28}],
 []
];
G.makeMap=act=>{
 const nodes={},add=(x,y,type='battle')=>{const n={id:x+','+y,x,y,type,cleared:false,visited:false,layout:Math.floor(G.rng()*G.layouts.length),flip:G.rng()<.5};nodes[n.id]=n;return n;};
 let node=add(0,0),path=[node];
 for(let i=1;i<7;i++){
  const dirs=G.shuffle(G.directions).filter(a=>a.dx>=0&&!nodes[(node.x+a.dx)+','+(node.y+a.dy)]);
  if(!dirs.length)break;const dir=dirs[0];node=add(node.x+dir.dx,node.y+dir.dy);path.push(node);
 }
 // Main route never traps generation, even if the walk winds around itself.
 while(path.length<7){node=path.at(-1);let x=node.x,y=node.y-1;while(nodes[x+','+y])y--;node=add(node.x,y);path.push(node);}
 path[1].type='forge';path[3].type='elite';path[4].type='camp';path[5].type=act===4?'ante':'elite';path[6].type='boss';
 for(const type of ['shop','blessing','treasure','event','battle','battle']){
  const candidates=G.shuffle(Object.values(nodes).filter(n=>!['boss','ante'].includes(n.type)));let placed=false;
  for(const n of candidates){for(const dir of G.shuffle(G.directions)){const x=n.x+dir.dx,y=n.y+dir.dy;if(!nodes[x+','+y]){add(x,y,type);placed=true;break;}}if(placed)break;}
 }
 const map={act,nodes,start:'0,0',boss:path[6].id,ante:act===4?path[5].id:null,revealed:false};
 // All cardinal adjacencies are real doors; final door requires the false guardian.
 for(const n of Object.values(nodes))n.links=G.directions.flatMap(dir=>{const target=nodes[(n.x+dir.dx)+','+(n.y+dir.dy)];return target?[{dir:dir.id,to:target.id}]:[];});
 G.event('map_generated',{act,rooms:Object.values(nodes).map(n=>({id:n.id,type:n.type,layout:n.layout,links:n.links})),boss:map.boss});return map;
};
const enter=G.enterRoom;
G.enterNode=(id,via=null)=>{
 const map=G.chapterMaps[G.act],node=map?.nodes[id];if(!node||G.ended)return false;
 if(node.type==='boss'&&map.ante&&!map.nodes[map.ante].cleared){G.notice('The mountain god’s true form still bars Heaven’s Gate.');return false;}
 if(node.type==='boss'&&Object.values(map.nodes).filter(n=>n.cleared&&['battle','elite'].includes(n.type)).length<3){G.notice('Three wild spirits remain. The gate will not open yet.');return false;}
 const visit=node.visited;G.currentNode=node;G.stage=Object.values(map.nodes).filter(n=>n.cleared).length;node.visited=true;G.mapVisible=new Set([node.id,...node.links.map(l=>l.to)]);
 if(node.type==='ante')G.forcedBoss='ibuki_heaven';else G.forcedBoss=null;
 if(visit&&node.cleared){
  G.roomSerial++;G.roomType=node.type==='ante'?'boss':node.type;G.roomDone=true;G.enemies=[];G.boss=null;G.shots=[];G.hostile=[];G.zones=[];G.fx=[];G.drops=[];G.interactable=null;G.state='running';G.roomTime=0;G.hideModal();
 }else{
  enter(node.type==='ante'?'boss':node.type);G.roomTarget=node.type==='elite'?28:22+G.act*2;
  if(['blessing','treasure'].includes(node.type)){G.interactable={x:720,y:440,type:node.type};G.roomDone=false;G.obstacles=[];}
 }
 G.obstacles=['battle','elite'].includes(node.type)?G.layouts[node.layout].map(o=>({...o})):[];
 G.p.x=via?G.directions.find(d=>d.id===via).entry[0]:720;G.p.y=via?G.directions.find(d=>d.id===via).entry[1]:600;
 G.doorCooldown=G.time+1;G.event('map_room_entered',{act:G.act,node:id,type:node.type,revisit:visit,via});G.persist(true);return true;
};
G.enterRoom=type=>{if(!G.chapterMaps[G.act]){G.chapterMaps[G.act]=G.makeMap(G.act);G.enterNode(G.chapterMaps[G.act].start);}else if(!G.currentNode||G.currentNode!==G.chapterMaps[G.act].nodes[G.currentNode.id])G.enterNode(G.chapterMaps[G.act].start);else enter(type);};
G.leaveChapter=()=>{if(!G.currentNode?.cleared||G.currentNode.type!=='boss')return;G.act++;G.currentNode=null;if(G.act>=G.regions.length){G.finish('victory');return;}G.uiStory(G.act,()=>G.enterRoom('battle'));};
G.nextRoute=()=>{if(G.currentNode&&!G.currentNode.cleared&&!['boss','ante','battle','elite'].includes(G.currentNode.type)){G.completeSupport();return;}G.hideModal();G.state='running';};
G.completeSupport=()=>{if(!G.currentNode||G.currentNode.cleared)return;G.currentNode.cleared=true;G.roomDone=true;G.interactable=null;G.hideModal();G.state='running';G.event('support_room_completed',{kind:G.currentNode.type,node:G.currentNode.id});G.toast('The lanterns beyond the gate are lit.');};
G.clearRoom=()=>{
 if(G.roomDone||G.ended)return;G.roomDone=true;G.state='reward';G.keys.clear();G.hostile=[];G.zones=[];G.shots=[];G.enemies=[];
 const node=G.currentNode;if(node)node.cleared=true;for(const drop of G.drops)if(['coin','chest','essence'].includes(drop.kind))G.collectLoot(drop);
 G.p.gold+=G.roomType==='boss'?35:G.roomType==='elite'?20:12;
 G.p.hp=Math.min(G.p.maxHp,G.p.hp+(2+G.lv('harvest')*2+(G.hasBless('kushinada')?8:0))*(G.hasBless('ibuki_curse')?.5:1));
 G.event('room_cleared',{act:G.act,node:node?.id,kind:node?.type||G.roomType,duration:G.roomTime});
 const done=()=>{G.hideModal();G.state='running';G.toast('Spirits quelled · Gates open');if(node?.type==='boss')G.interactable={x:720,y:420,type:'departure'};};
 if(node?.type==='ante'){G.offerRelic(()=>G.offerBlessing(done));return;}
 if(G.roomType==='boss')G.offerRelic(()=>G.offerBlessing(done));else if(G.roomType==='elite')G.offerTalent(done,'elite_reward');else if(G.rng()<.34)G.offerSkill(done);else done();
};
G.travel=dir=>{
 if(G.state!=='running'||!G.currentNode?.cleared||G.time<G.doorCooldown)return false;
 const link=G.currentNode.links.find(l=>l.dir===dir);if(!link)return false;return G.enterNode(link.to,dir);
};
const interact=G.interact;G.interact=()=>{
 if(G.state!=='running')return;const o=G.interactable;
 if(o&&d(G.p,o)<110){if(o.type==='departure'){G.offer('Before Dawn','Choose how your journey ends.',[{id:'depart',name:'Depart',icon:2,text:'Continue to the next chapter.'}],G.leaveChapter,'chapter_departure');return;}if(o.type==='blessing'){G.offerBlessing(G.completeSupport);return;}if(o.type==='treasure'){G.offerSkill(G.completeSupport);return;}}
 if(G.currentNode?.cleared){const near=G.directions.find(a=>d(G.p,a)<105);if(near&&G.travel(near.id))return;}
 interact();
};
const update=G.update;G.update=dt=>{update(dt);if(G.state==='running'&&G.currentNode?.cleared&&G.time>=G.doorCooldown){const dir=G.directions.find(a=>d(G.p,a)<43);if(dir)G.travel(dir.id);}};
Object.assign(G.bosses,{
 ibuki_heaven:{name:'Ibuki Daimyojin',title:'False Throne of Heaven · The Mountain God’s True Form',line:'“I borrow heaven’s name, but I will not return you to the old tale.”',tip:'The horns mark lightning paths. After three impacts, the mountain god exposes its back.',art:'aragami_portrait',hp:6200,r:70,speed:32},
 whitebird:{name:'Whitebird · A Cage of Purity',title:'Heavenward Shadow · Your Purified Self',line:'“Give up every desire, and nothing can hurt you again.”',tip:'Cross the gap before the white feathers close. Light inside the feather cage falls after a brief delay.',art:'hero_divine_v2',hp:9600,r:58,speed:62}
});
G.bossKey=()=>G.forcedBoss||(G.act===4?(G.p.path==='blood'?'whitebird':'prince'):G.regions[G.act].boss);
G.bosses.prince.hp=9600;
const finalRelics=[
 {id:'orochi_scale',name:'Orochi · Heaven’s Reversed Scale',icon:8,boss:'ibuki_heaven',text:'Effect power +18%. Water Art hits call down pursuing lightning.',tags:['boss_reward','effect']},
 {id:'orochi_fang',name:'Orochi · Severed Fang',icon:10,boss:'ibuki_heaven',text:'Damage against Heaven enemies +18%. Crit chance +5%.',tags:['boss_reward','crit']},
 {id:'whitebird_chain',name:'Whitebird · Broken Chain',icon:2,boss:'whitebird',text:'Crit chance +8%. Technique cooldown reduction +8%.',tags:['boss_reward','crit']},
 {id:'whitebird_veil',name:'Whitebird · Homeward Feather',icon:11,boss:'whitebird',text:'Defense +2. After dashing, gain a 2 s feather ward that halves the first incoming hit.',tags:['boss_reward','survival']}
].map(r=>({...r,iconSet:'boss'}));
G.relics.push(...finalRelics);G.bossRelics.push(...finalRelics);
try{const saved=JSON.parse(localStorage.getItem('whitebird.boss-collection.rsi.en')||'{}');for(const id of saved.unlocked||[])if(G.bossRelics.some(r=>r.id===id)&&!G.collection.includes(id))G.collection.push(id);if(G.collection.includes(saved.equipped))G.heirloom=saved.equipped;}catch{}
const spawnBoss=G.spawnBoss;G.spawnBoss=()=>{spawnBoss();const b=G.boss;b.affinity=G.affinityFor(b);b.hp*=.75;b.maxHp=b.hp;b.riteAt=G.time+3;b.ritePhase=1;b.r=['sea','aragami','ibuki_heaven'].includes(b.kind)?70:b.r;b.visualScale=1.45;};
const enemies=G.updateEnemies;G.updateEnemies=dt=>{
 const b=G.boss;if(b&&!b.dead){
  const phase=b.hp/b.maxHp<.3?3:b.hp/b.maxHp<.65?2:1;
  if(phase>b.ritePhase){b.ritePhase=phase;b.transitionUntil=G.time+1.2;b.riteAt=G.time+1.5;G.hostile=[];G.toast(`${b.name} · ${['','First Form','Wild Form','Godfall Form'][phase]}`);G.event('boss_rite_phase',{kind:b.kind,phase});G.fx3d?.('ripple',b.x,b.y,0,3);}
  if(G.time>=b.riteAt){b.riteAt=G.time+Math.max(2,4-phase*.55);b.animUntil=G.time+.8;b.action={kind:'cast',start:G.time,duration:.8,until:G.time+.8};const p=G.p,a=Math.atan2(p.y-b.y,p.x-b.x);
   if(['aragami','ibuki_heaven'].includes(b.kind)){for(let i=0;i<phase+2;i++)G.danger(G.clamp(p.x+(i-1)*120,160,1280),G.clamp(p.y+Math.sin(i)*90,240,700),60,.7+i*.25);b.aim=a;b.windup=.85;}
   else if(b.kind==='sea'){G.fx3d?.('wave',b.x,b.y,a,3);for(let i=-1;i<=1;i++)G.danger(720,G.clamp(p.y+i*200,240,700),50,1.2+Math.abs(i)*.3,'hline');}
   else if(['whitebird','prince'].includes(b.kind)){const gap=Math.floor(G.rng()*16);for(let i=0;i<16;i++)if((i-gap+16)%16>3)G.hostileShot(b,i*Math.PI/8,110+phase*22);for(let i=0;i<phase;i++)G.danger(G.clamp(p.x+(i-1)*170,140,1300),p.y,55,1+i*.2,b.kind==='prince'?'line':'circle');G.fx3d?.(b.kind==='prince'?'bloodSlash':'feather',b.x,b.y,a,2);}
   else if(phase===3){G.danger(p.x,p.y,100,1.1);G.fx3d?.('thunder',b.x,b.y,0,2);}
  }
 }enemies(dt);
};
const spawn=G.spawn;G.spawn=kind=>{const e=spawn(kind);e.affinity=G.affinityFor(e);return e;};
G.drawDoors=ctx=>{
 const node=G.currentNode;if(!node)return;ctx.save();ctx.textAlign='center';ctx.font='17px WhitebirdSans';
 for(const link of node.links){const a=G.directions.find(d=>d.id===link.dir),target=G.chapterMaps[G.act].nodes[link.to],open=node.cleared;ctx.save();ctx.translate(a.x,a.y);ctx.fillStyle=open?'#072b2acf':'#220f1bcf';ctx.strokeStyle=open?'#bdebdc':'#b46c73';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(0,0,link.dir==='up'||link.dir==='down'?58:24,link.dir==='up'||link.dir==='down'?22:60,0,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.fillStyle=open?'#ecdfba':'#c88e91';ctx.fillText(open?'◇':'Seal',0,6);if(open){ctx.fillStyle='#e8dac0';ctx.fillText((G.r2NodeName?.(target)||G.roomNames[target.type]),0,link.dir==='down'?-35:45);}ctx.restore();}
 ctx.restore();
};
const observe=G.bridgeTarget.observe;G.bridgeTarget.observe=()=>{const o=observe();return {...o,node:G.currentNode?{id:G.currentNode.id,cleared:G.currentNode.cleared,links:G.currentNode.links}:null,map:G.chapterMaps?.[G.act],active_slots:G.p?.activeSlots,skill_bag:G.p?.skillBag,attributes:G.p?G.combatStats():null};};
})();
