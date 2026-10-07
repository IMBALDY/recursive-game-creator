import {uiIcon,gameButton,titleMarkup,fieldbookMarkup} from './ui-v6.js';
import {harborMarkup,shopMarkup} from './harbor-ui.js';
import {OceanRenderer} from './renderer.js?v=public-20261007';
import {HUNTS,createHunt,stepHunt} from './hunts.js';
import {ensureHuntProgress,huntAvailability,awardHunt} from './hunt-progress.js';
import {HUNT_COPY,huntBoardMarkup,huntHudMarkup,updateHuntHud} from './hunt-ui.js';
import {ACTION_NAMES,beginFishingAction,advanceFishingAction,flinchPlayer,practiceAction} from './fishing-actions.js';
import {LEVELS,SPECIES,generateWorld} from './content.js';
import {startRestaurant} from './restaurant.js';
import {SEASONS,seasonForDay,BUILDINGS,buildingCost,recipeTier,ensureProgress} from './progression.js';
import {SHOP_ITEMS,buyBuilding,buySupply,useSupply,harborStage,grantMastery} from './harbor.js';
import {startRelationshipScene,CHARACTERS as PEOPLE,characterPortrait} from './relationships.js';
import {artIcon,fishArt,portrait,characterRail,decorateModal} from './art-ui.js';

const $=s=>document.querySelector(s), ui=$('#interface'), canvas=$('#ocean');
const build=window.TIDE_BUILD||{version:'0.1.0',hash:'unsealed-development'};
const params=new URLSearchParams(location.search), actor=params.get('actor')==='agent'?'agent':'human';
const SAVE_KEY='bluebay-v3-harbor';
const speciesList=Array.isArray(SPECIES)?SPECIES:Object.values(SPECIES);
const speciesById=Object.fromEntries(speciesList.map(s=>[s.id,s]));
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const fresh=()=>ensureHuntProgress(ensureProgress({unlocked:0,credits:0,oxygen:0,bag:0,fin:0,trust:0,metXi:false,pantry:[],collection:{},completed:[],lastSeed:null}));
let progress=fresh();
try{if(actor==='human')progress={...progress,...JSON.parse(localStorage.getItem(SAVE_KEY)||'{}')};}catch{}
progress=ensureHuntProgress(ensureProgress(progress));
const save=()=>{if(actor==='human')localStorage.setItem(SAVE_KEY,JSON.stringify(progress));};
let huntHomecomingPerson='ahe';
let activeHunt=null,huntFireLatch=false,huntPointerDown=false,huntDodge=false,huntReel=false;
let renderer,world,state,mode='title',previousMode='play',levelIndex=0,session=null,lastSession=null,sessionStart=0;
let activeSeconds=0,sampleClock=0,uiClock=0,lastFrame=performance.now(),keys=new Set(),soundEnabled=false,audioContext=null;
let currentDialog=null,discovered=new Set(),sonar=0,sonarCooldown=0,shotCooldown=0,damageCooldown=0,airCooldown=0;
let catchCount=0,cargo=[],missionDone=new Set(),levelCredits=0,loadout='balanced',selectedSeed=null,checkpoint=null;
let toastTimer=0,hasSavedRecord=true,holdE=false,serviceOrders=[],serviceDone=0,finishOutcome=null;
let fogCells=new Set(),returnPending=false,recordQueue=Promise.resolve(),lastCapture=null;
const inputNames={KeyW:'w',KeyA:'a',KeyS:'s',KeyD:'d',ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',Space:'space',ShiftLeft:'shift',ShiftRight:'shift',KeyE:'e',KeyQ:'q'};

function toast(message){const d=document.createElement('div');d.className='toast';d.textContent=message;$('#toasts').append(d);setTimeout(()=>d.remove(),3800);}
function caption(text,seconds=6){$('#caption').textContent=text;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#caption').textContent='',seconds*1000);}
function beep(freq=420,duration=.1,type='sine',volume=.035){if(!soundEnabled)return;try{audioContext??=new (window.AudioContext||window.webkitAudioContext)();audioContext.resume();const o=audioContext.createOscillator(),g=audioContext.createGain();o.type=type;o.frequency.value=freq;o.connect(g);g.connect(audioContext.destination);g.gain.setValueAtTime(volume,audioContext.currentTime);g.gain.exponentialRampToValueAtTime(.0001,audioContext.currentTime+duration);o.start();o.stop(audioContext.currentTime+duration);}catch{}}
function toggleSound(){soundEnabled=!soundEnabled;if(soundEnabled)beep(650,.22);toast(soundEnabled?'环境提示音已开启':'声音已关闭');}
function sessionTime(){return (performance.now()-sessionStart)/1000;}
function log(type,data={}){if(!session||session.closed)return;session.events.push({seq:session.events.length,t:+sessionTime().toFixed(3),type,...data});}
function playerSummary(){return state?{x:+state.player.x.toFixed(2),y:+state.player.y.toFixed(2),oxygen:+state.player.oxygen.toFixed(1),health:+state.player.health.toFixed(1),cargo:cargo.length,main:missionDone.size}:null;}
function newSession(seed){sessionStart=performance.now();session={schema_version:1,actor_type:actor,build_hash:build.hash,session_id:crypto.randomUUID(),seed,level:levelIndex,version:build.version,started_at:new Date().toISOString(),events:[],feedback:null};log('run_start',{level:levelIndex,seed,controls:'keyboard'});}
function offerChoice(id,options,context){log('choice_offered',{choice_id:id,options:options.map(o=>({id:o.id,label:o.title,description:o.description,disabled:!!o.disabled})),context,player:playerSummary()});return performance.now();}
function selectChoice(id,option,start){log('choice_selected',{choice_id:id,option_id:option,decision_ms:Math.round(performance.now()-start),player:playerSummary()});}
// Public web build: session records and optional feedback stay in this browser.
async function post(path,data){
  if(path==='/api/session') localStorage.setItem('bluebay-web:last-session',JSON.stringify(data));
  else {
    const key='bluebay-web:feedback';
    let records=[];try{records=JSON.parse(localStorage.getItem(key)||'[]');}catch{}
    if(!Array.isArray(records))records=[];
    records.push(data);localStorage.setItem(key,JSON.stringify(records.slice(-100)));
  }
  return {ok:true};
}
function closeSession(outcome){if(!session||session.closed)return;log('run_end',{outcome,active_seconds:+activeSeconds.toFixed(2),caught:catchCount,main:missionDone.size,player:playerSummary()});session.duration=+sessionTime().toFixed(3);session.status=outcome;session.active_seconds=+activeSeconds.toFixed(2);session.closed=true;const record={...session};delete record.closed;lastSession=record;hasSavedRecord=false;recordQueue=recordQueue.catch(()=>{}).then(async()=>{try{await post('/api/session',record);hasSavedRecord=true;toast(actor==='human'?'本次下潜记录已保存':'自动试玩记录已保存');}catch{toast('记录未能自动保存，可在反馈页导出');}});}
function downloadJSON(data,name){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
function modal(body,wide=false){
  keys.clear();
  const storyPerson=currentDialog?.npc||'';
  const dialogPortrait=/小夏/.test(storyPerson)?'xiaxia':/苏婆婆/.test(storyPerson)?'su':/夜航|客/.test(storyPerson)?'guest':/周/.test(storyPerson)?'zhou':/阿禾/.test(storyPerson)?'ahe':'xi';
  const character={brief:'xi',loadout:'ahe',dialog:dialogPortrait,hub:'ahe',debrief:'xi','service-result':'ahe','hunt-homecoming':(huntHomecomingPerson||'ahe'),ending:'ahe'}[mode];
  ui.innerHTML=`<div class="overlay"><section class="panel ${wide?'wide':''} ${character?'panel--character':''}" data-scene="${mode}">${character?`<div class="character-layout">${mode==='hunt-homecoming'?huntCharacterRail(character):characterRail(character)}<div class="panel-body">${body}</div></div>`:body}</section></div>`;
  decorateModal(ui,mode);
}
function button(id,text,primary=false){return gameButton(id,text,primary);}
function bind(id,fn){const el=document.getElementById(id);if(el)el.onclick=fn;}
function randSeed(){return crypto.getRandomValues(new Uint32Array(1))[0]%1000000000;}

function makeWorld(index,seed){activeHunt=null;world=generateWorld(index,seed,{season:seasonForDay(progress.day)});state={time:0,biome:world.biome,player:{x:world.start.x,y:world.start.y,vx:0,vy:0,facing:1,harpoon:0,oxygen:100,health:100},fish:world.fish.map(f=>({...speciesById[f.species],...f,alive:true,facing:1,phase:(f.x*.71+f.y*.29)%6.28})),nodes:world.nodes.map(n=>({...n,done:false})),giants:world.giants.map(g=>({...g})),effects:[]};renderer.setWorld(world);}
function showTitle(){
  mode='title';keys.clear();$('#caption').textContent='';makeWorld(0,482391);state.player.x=87;state.player.y=75;
  const unlocked=Math.min(LEVELS.length-1,progress.unlocked);
  ui.innerHTML=titleMarkup(progress,LEVELS);
  bind('title-hunts',showHuntBoard);bind('start',()=>showBrief(unlocked));bind('port',()=>{levelIndex=unlocked;showHub();});bind('help',()=>showHelp('title'));bind('collection',()=>showCollection('title'));bind('feedback',()=>showFeedback('title'));bind('sound',toggleSound);document.querySelectorAll('[data-level]').forEach(b=>b.onclick=()=>showBrief(Number(b.dataset.level)));
}

function showBrief(index){levelIndex=index;mode='brief';const l=LEVELS[index];modal(`<div class="eyebrow">EXPEDITION 0${index+1}</div><h2>${escape(l.name)}</h2><p>${escape(l.description||l.goal)}</p><div class="steps"><div class="step"><b>探索</b><span>找到 3 处风味发现。声呐与海图能帮你判断方向。</span></div><div class="step"><b>补给</b><span>捕获 ${Math.max(3,l.catchGoal||3)} 条鱼，至少 3 种。留意氧气，在水面或补给点补充。</span></div><div class="step"><b>返航</b><span>回到起点的小船。处理食材、交换资源，再继续旅程。</span></div></div><label for="seed">海域编号（留空会生成新海域）</label><input id="seed" type="number" min="0" max="999999999" placeholder="每次下潜都有不同的地形、鱼群和发现物"><div class="button-row">${button('dive','准备下潜',true)}${button('back','返回')}</div><p class="small">WASD / 方向键游动 · 空格捕捉 · E 交互 · Q 声呐 · M 海图</p>`);bind('back',showTitle);bind('dive',()=>{const value=$('#seed').value;startDive(index,value===''?randSeed():clamp(Math.floor(Number(value)),0,999999999));});}
function startDive(index,seed){if(session&&!session.closed)closeSession('abandoned');levelIndex=index;selectedSeed=seed;makeWorld(index,seed);activeSeconds=0;sampleClock=0;catchCount=0;cargo=[];missionDone=new Set();discovered=new Set();fogCells=new Set();levelCredits=0;sonar=0;sonarCooldown=0;shotCooldown=0;damageCooldown=0;airCooldown=0;returnPending=false;finishOutcome=null;checkpoint={x:world.start.x,y:world.start.y};newSession(seed);mode='loadout';const opts=[{id:'balanced',title:'轻便潜水套装',description:'均衡配置。背包可多装 3 件物品，适合采集与打捞。'},{id:'oxygen',title:'备用氧气瓶',description:'额外携带 40 氧气，慢慢探索深处的海。'},{id:'fins',title:'推进脚蹼',description:'游泳速度增加 22%，冲刺额外耗氧也略少。'}];const id='loadout-'+session.session_id,start=offerChoice(id,opts,{level:index,seed});modal(`<div class="eyebrow">准备你的这次下潜</div><h2>带什么出发？</h2><p>搭档阿禾：三套装备都收拾好了。今天先带一套，晚餐的食材就交给你啦。</p><div class="choices">${opts.map(o=>`<button class="choice" data-choice="${o.id}"><strong>${o.title}</strong><span>${o.description}</span></button>`).join('')}</div>`);document.querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>{loadout=b.dataset.choice;selectChoice(id,loadout,start);state.player.oxygen=maxOxygen();mode='play';renderHUD();caption(introText(),8);beep(520,.2);});}
function introText(){const lines=LEVELS[levelIndex].intro;if(Array.isArray(lines)&&lines.length){const l=lines[0];return typeof l==='string'?l:`${l.speaker}：${l.text}`;}return '阿禾：先在附近熟悉水流。水面可以补氧，亮着微光的地方，也许藏着今晚的好食材。';}
function maxOxygen(){return 100+progress.oxygen*18+progress.buildings.dock*8+(loadout==='oxygen'?40:0);}
function capacity(){return 12+progress.bag*4+progress.buildings.dock*2+(loadout==='balanced'?3:0);}
function mainNodes(){return state.nodes.filter(n=>n.main||(n.type==='story'));}
function goalCatch(){return Math.max(3,LEVELS[levelIndex].catchGoal||3);}
function varietyCount(){return new Set(cargo.filter(c=>c.kind==='fish').map(c=>c.species)).size;}
function canFinish(){return missionDone.size>=mainNodes().length&&catchCount>=goalCatch()&&varietyCount()>=3;}
function renderHUD(){ui.innerHTML=`<div class="hud"><div class="hud-top"><div class="hud-mission"><div class="eyebrow">EXPEDITION 0${levelIndex+1}</div><div class="location">${escape(LEVELS[levelIndex].name)}</div><div class="objective"><strong id="mission-title">${escape(LEVELS[levelIndex].goal||'寻找新鲜食材与海湾风味')}</strong><div id="mission-status"></div><div class="progress-dots">${mainNodes().map(n=>`<i id="dot-${n.id}"></i>`).join('')}</div></div></div><div class="hud-stats"><div class="hud-player">${portrait('xi','portrait-medallion')}<div><b>汐</b><span>第 ${progress.day} 日 · ${SEASONS[seasonForDay(progress.day)].name}</span></div></div><div class="bb-dive-instrument"><div class="stat-row"><span>氧气 O₂</span><span id="oxygen-text"></span></div><div class="bar" id="oxygen-bar"><i></i></div></div><div class="stat-row"><span>生命</span><span id="health-text"></span></div><div class="bar danger"><i id="health-bar"></i></div><div class="stat-row"><span id="cargo-text"></span><span id="timer-text"></span></div><div class="hud-actions"><button class="small-button" id="hud-log" aria-label="背包 · I" title="背包 · I">${uiIcon('bag')}<span>背包 · I</span></button><button class="small-button" id="hud-feedback" aria-label="反馈" title="反馈">${uiIcon('quill')}<span>反馈</span></button><button class="small-button" id="hud-pause" aria-label="暂停" title="暂停">${uiIcon('pause')}<span>暂停</span></button></div></div></div><div class="hud-bottom"><div class="controls-line"><span><b>WASD</b>游动</span><span><b>空格</b>捕捉 / 驱赶</span><span><b>I</b>背包</span><span><b>1/2/3</b>补给品</span><span><b>E</b>交互</span><span><b>Shift</b>冲刺</span><span><b>Q</b>声呐</span><span><b>M</b>海图</span></div><div><div class="depth" id="depth-text"></div><canvas id="minimap" width="340" height="224"></canvas></div></div></div><div id="interaction" class="interaction" hidden></div><div id="fish-tag" class="fish-tag" hidden></div>`;bind('hud-log',()=>showCollection('play'));bind('hud-feedback',()=>showFeedback('play'));bind('hud-pause',pause);updateHUD();}
function updateHUD(){if(mode!=='play')return;const p=state.player;$('#oxygen-text').textContent=`${Math.ceil(p.oxygen)} / ${maxOxygen()}`;$('#oxygen-bar i').style.width=`${p.oxygen/maxOxygen()*100}%`;$('#oxygen-bar').classList.toggle('danger',p.oxygen<25);$('#health-text').textContent=`${Math.ceil(p.health)} / 100`;$('#health-bar').style.width=`${p.health}%`;$('#cargo-text').textContent=`背包 ${cargo.length} / ${capacity()}${cargo.length>=capacity()?' · 已满':''}`;const bagLabel=cargo.length>=capacity()?'整理背包 · I':'背包 · I';$('#hud-log span').textContent=bagLabel;$('#hud-log').setAttribute('aria-label',bagLabel);$('#hud-log').setAttribute('title',bagLabel);$('#hud-log').classList.toggle('is-full',cargo.length>=capacity());$('#timer-text').textContent=formatTime(activeSeconds);$('#depth-text').textContent=`深度 ${Math.max(0,Math.round((world.height-p.y)*.8))} m · 海域 ${selectedSeed}`;$('#mission-status').innerHTML=canFinish()?'线索与补给齐了，回小船准备下一次出发。':`风味发现 ${missionDone.size} / ${mainNodes().length}　·　食材 ${catchCount} / ${goalCatch()}　·　品种 ${varietyCount()} / 3`;for(const n of mainNodes())document.getElementById('dot-'+n.id)?.classList.toggle('done',n.done);const target=nearestNode();const interaction=$('#interaction');if(target&&distance(p,target)<6){interaction.hidden=false;interaction.innerHTML=`<kbd>E</kbd>${escape(nodeLabel(target))}`;}else interaction.hidden=true;const fish=nearestFish();const tag=$('#fish-tag');if(fish&&distance(p,fish)<10){const pos=renderer.project(fish.x,fish.y+fish.size*.6);tag.hidden=false;tag.style.left=pos.x+'px';tag.style.top=pos.y+'px';tag.innerHTML=`${escape(speciesById[fish.species]?.name||fish.name||'海洋生物')} ${distance(p,fish)<8?((speciesById[fish.species]?.danger||fish.danger||0)>0?'· 空格驱赶':cargo.length>=capacity()?'· 背包已满 · I 整理':'· 空格捕捉'):'· 靠近观察'}`;}else tag.hidden=true;drawMap($('#minimap'),false);}
function formatTime(s){return `${Math.floor(s/60).toString().padStart(2,'0')}:${Math.floor(s%60).toString().padStart(2,'0')}`;}
function nodeLabel(n){if(n.type==='exit')return canFinish()?'返回小船 · 本航段完成':'小船 · 补充氧气 / 提前返航';if(n.type==='air')return airCooldown>0?'补给正在充能':`补充氧气 · ${n.title||'气泡泉'}`;return n.title||'查看发现';}
function nearestNode(){return state.nodes.filter(n=>!n.done||['air','exit'].includes(n.type)).reduce((best,n)=>!best||distance(state.player,n)<distance(state.player,best)?n:best,null);}
function nearestFish(){return state.fish.filter(f=>f.alive).reduce((best,f)=>!best||distance(state.player,f)<distance(state.player,best)?f:best,null);}
function collides(x,y,r=1.1){return world.obstacles.some(o=>Math.abs(x-o.x)<o.w/2+r&&Math.abs(y-o.y)<o.h/2+r);}
function moveBody(p,dx,dy){const steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/.8));for(let i=0;i<steps;i++){let nx=clamp(p.x+dx/steps,2,world.width-2),ny=clamp(p.y+dy/steps,3,world.height-2);if(!collides(nx,p.y))p.x=nx;if(!collides(p.x,ny))p.y=ny;}}
function update(dt){if(mode==='hunt'){updateHunt(dt);return;}if(mode==='practice'){state.time+=dt;advanceFishingAction(state.player,dt);return;}if(mode!=='play')return;advanceFishingAction(state.player,dt);state.time+=dt;activeSeconds+=dt;shotCooldown=Math.max(0,shotCooldown-dt);sonarCooldown=Math.max(0,sonarCooldown-dt);sonar=Math.max(0,sonar-dt);damageCooldown=Math.max(0,damageCooldown-dt);airCooldown=Math.max(0,airCooldown-dt);state.player.harpoon=Math.max(0,state.player.harpoon-dt*3);const p=state.player;let dx=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0),dy=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0);const moving=dx||dy,sprint=moving&&(keys.has('ShiftLeft')||keys.has('ShiftRight')),speed=(8.2+progress.fin*.65)*(loadout==='fins'?1.22:1)*(sprint?1.65:1);if(moving){const len=Math.hypot(dx,dy);dx=dx/len*speed;dy=dy/len*speed;}p.vx+=(dx-p.vx)*Math.min(1,dt*7);p.vy+=(dy-p.vy)*Math.min(1,dt*7);if(Math.abs(p.vx)>.5)p.facing=p.vx>0?1:-1;moveBody(p,p.vx*dt,p.vy*dt);if(p.y>world.height-8){p.oxygen=Math.min(maxOxygen(),p.oxygen+dt*19);}else{const depth=(world.height-p.y)/world.height;p.oxygen=Math.max(0,p.oxygen-dt*(.64+depth*.33+(sprint?.68:0)));}if(p.oxygen===0)p.health=Math.max(0,p.health-dt*7);if(p.oxygen<25&&p.oxygen+dt>25)caption('阿禾：氧气不多啦，向上游回水面，或者找气泡补给点。');if(p.health<=0){finishDive('defeat');return;}if(keys.has('Space'))harpoon();for(const f of state.fish){if(!f.alive)continue;f.fear=Math.max(0,(f.fear||0)-dt);const s=speciesById[f.species]||f,dist=distance(p,f),hunter=s.behavior==='hunter'&&dist<16&&!f.fear;let vx,vy;const sp=(s.speed||2.5);if(f.fear>0){vx=(f.x-p.x)/Math.max(.1,dist)*sp*2;vy=(f.y-p.y)/Math.max(.1,dist)*sp;}else if(hunter){vx=(p.x-f.x)/Math.max(.1,dist)*sp;vy=(p.y-f.y)/Math.max(.1,dist)*sp;}else if((s.behavior==='shy'||s.behavior==='school')&&dist<5.7){vx=(f.x-p.x)/Math.max(.1,dist)*sp*1.4;vy=(f.y-p.y)/Math.max(.1,dist)*sp*.8;}else{const tx=(f.homeX??f.x)+Math.sin(state.time*.11+f.phase)*9,ty=(f.homeY??f.y)+Math.cos(state.time*.17+f.phase)*4;const fd=Math.hypot(tx-f.x,ty-f.y);vx=(tx-f.x)/Math.max(1,fd)*sp;vy=(ty-f.y)/Math.max(1,fd)*sp*.6;}const nx=clamp(f.x+vx*dt,3,world.width-3),ny=clamp(f.y+vy*dt,4,world.height-7);if(!collides(nx,ny,.6)){f.x=nx;f.y=ny;}else{f.phase+=dt*2;f.homeX=clamp(f.x+(f.facing||1)*-3,3,world.width-3);}f.vx=vx;f.vy=vy;f.facing=vx>=0?1:-1;f.alert=hunter||(dist<6&&s.behavior==='shy');if(s.danger>0&&dist<2.6+f.size*.2&&damageCooldown===0){const damage=8+15*s.danger;p.health=Math.max(0,p.health-damage);flinchPlayer(p);damageCooldown=2.6;log('damage',{species:f.species,amount:damage,player:playerSummary()});beep(110,.2,'triangle');state.effects.push({x:p.x,y:p.y,type:'damage',age:0});caption('保持距离，绕开它的巡游路线。',3);}}for(const n of state.nodes){if(distance(p,n)<27||sonar>0)discovered.add(n.id);}fogCells.add(`${Math.floor(p.x/8)},${Math.floor(p.y/8)}`);state.effects=state.effects.filter(e=>(e.age+=dt)<2.2);sampleClock+=dt;if(sampleClock>=1){sampleClock=0;log('sample',{player:playerSummary(),moving:!!moving,sprinting:!!sprint,nearest_node:nearestNode()?.id});}uiClock+=dt;if(uiClock>.1){uiClock=0;updateHUD();}}
function harpoon(){if(mode!=='play'||shotCooldown>0)return;shotCooldown=1.35;const target=nearestFish();beginFishingAction(state.player,target,'miss');state.player.harpoon=1;beep(240,.09,'triangle',.025);if(!target||distance(state.player,target)>8){log('harpoon_miss',{player:playerSummary()});state.effects.push({x:state.player.x+state.player.facing*5,y:state.player.y,type:'shot',age:0});return;}const s=speciesById[target.species]||target;if((s.danger||0)>0){state.effects.push({x:target.x,y:target.y,type:'shot',age:0});target.fear=6;target.homeX=target.x+20*state.player.facing;caption('鱼叉让它暂时退开。危险生物不计入食材任务。',3);log('predator_deterred',{id:target.id});return;}if(cargo.length>=capacity()){toast('鱼篓满了。按 I 放生腾出空间，仍可继续探索和驱赶危险鱼。');log('capture_blocked_full',{id:target.id,species:target.species,cargo:cargo.length,capacity:capacity(),player:playerSummary()});return;}beginFishingAction(state.player,target,'catch');state.player.caughtFishId=target.id;state.player.caughtSpecies=target.species;target.alive=false;state.player.facing=target.x>=state.player.x?1:-1;cargo.push({id:target.id,species:target.species,name:s.name||'海鱼',value:s.value??8,kind:'fish',sizeFactor:target.sizeFactor??1,weightKg:target.weightKg??1,sizeLabel:target.sizeLabel||'标准'});catchCount++;const beforeTier=recipeTier(progress.mastery[target.species]);grantMastery(progress,target.species,`${levelIndex}:${selectedSeed}:${world.season}:${target.species}:${target.id}`);const afterTier=recipeTier(progress.mastery[target.species]);if(afterTier.level>beforeTier.level)caption(`${s.name}解锁${afterTier.title}！回小馆试试新做法。`,8);progress.collection[target.species]=(progress.collection[target.species]||0)+1;save();state.effects.push({x:target.x,y:target.y,type:'catch',age:0});toast(`捕获 ${s.name||'海鱼'} · ${target.weightKg??1} kg　·　${catchCount}/${goalCatch()}`);beep(720,.15);log('fish_caught',{id:target.id,species:target.species,player:playerSummary()});if(catchCount===goalCatch())caption('补给足够了。继续寻找线索，也可以顺路记录新的生物。');}
function pulseSonar(){if(mode!=='play')return;if(sonarCooldown>0){toast(`声呐 ${Math.ceil(sonarCooldown)} 秒后恢复`);return;}sonar=12;sonarCooldown=18;state.effects.push({x:state.player.x,y:state.player.y,type:'sonar',age:0});for(const n of state.nodes)discovered.add(n.id);beep(950,.4,'sine',.025);log('sonar',{player:playerSummary()});toast('声呐已标出线索与补给点 · 按 M 查看海图');}
function interact(){if(mode!=='play')return;const n=nearestNode();if(!n||distance(state.player,n)>6){toast('靠近发光标记后按 E 交互');return;}log('interact',{node:n.id,player:playerSummary()});if(n.type==='exit'){state.player.oxygen=maxOxygen();if(canFinish())finishDive('victory');else showRetreat();return;}if(n.type==='air'){if(airCooldown>0){toast('气泡泉正在恢复，先等它重新聚集');return;}state.player.oxygen=maxOxygen();state.player.health=Math.min(100,state.player.health+15);airCooldown=12;beep(540,.3);toast('氧气补满 · 生命恢复 15');log('air_refill',{node:n.id});return;}if(n.type==='giant'){showGiant(n);return;}if(n.main||n.type==='story'){showStoryNode(n);return;}n.done=true;const reward=Number(n.reward?.credits??n.reward??12);levelCredits+=Number.isFinite(reward)?reward:12;state.effects.push({x:n.x,y:n.y,type:'collect',age:0});toast(`${n.title||'发现回收材料'}　＋${Number.isFinite(reward)?reward:12} 资源`);beep(640,.12);log('salvage',{node:n.id,value:Number.isFinite(reward)?reward:12});}
function showStoryNode(n){mode='dialog';const id='story-'+n.id,start=performance.now();const text=typeof n.text==='string'?n.text:(Array.isArray(n.text)?n.text.map(l=>typeof l==='string'?l:l.text).join('\n'):n.description||'你记下了这里的水流与食材。今天的菜单又多了一个主意。');const options=[{id:'observe',title:'留下记录，尽量不打扰',description:'仔细观察周围的生活。海洋观察 +1，生命恢复 8。'},{id:'sample',title:'回收附近的废弃材料',description:'带走能使用的材料。获得 20 资源，用于装备和补给。'}];offerChoice(id,options,{node:n.id,title:n.title,level:levelIndex});currentDialog={node:n.id,npc:n.npc||n.speaker||''};modal(`<div class="eyebrow">发现 ${missionDone.size+1} / ${mainNodes().length}</div><h2>${escape(n.title||'海底的线索')}</h2><p style="white-space:pre-line">${escape(text)}</p><div class="choices">${options.map(o=>`<button class="choice" data-story="${o.id}"><strong>${o.title}</strong><span>${o.description}</span></button>`).join('')}</div>`);document.querySelectorAll('[data-story]').forEach(b=>b.onclick=()=>{selectChoice(id,b.dataset.story,start);if(b.dataset.story==='observe'){progress.trust++;state.player.health=Math.min(100,state.player.health+8);}else levelCredits+=20;n.done=true;missionDone.add(n.id);if(n.npc==='夜航客'||n.id==='kelp-story-2')progress.metXi=true;currentDialog=null;save();log('story_completed',{node:n.id,choice:b.dataset.story});mode='play';renderHUD();beep(590,.18);if(canFinish())caption('阿禾：菜单上的好东西找齐了。回小船吧，今晚可以开张啦。',7);});}
function showRetreat(){mode='retreat';modal(`<div class="eyebrow">小船</div><h2>氧气已经补满</h2><p>目前找到 ${missionDone.size}/${mainNodes().length} 处风味发现，收集 ${catchCount}/${goalCatch()} 份食材，${varietyCount()}/3 种鱼。继续探索可以完成本航段。</p><div class="button-row">${button('continue','继续下潜',true)}${button('retreat','带着收获提前返回')}</div><p class="small">提前返回会保留发现的生物与本次收获；这一航段可以重新探索。</p>`);bind('continue',resumePlay);bind('retreat',()=>finishDive('abandoned'));}
function finishDive(outcome){if(session?.closed)return;finishOutcome=outcome;mode='debrief';keys.clear();const reward=levelCredits+(outcome==='victory'?35:0);progress.pantry??=[];progress.pantry.push(...cargo.map(c=>({...c,id:(session?.session_id||Date.now())+':'+c.id}))); progress.credits+=outcome==='defeat'?Math.floor(reward*.5):reward;if(outcome==='victory'){if(!progress.completed.includes(levelIndex))progress.completed.push(levelIndex);progress.unlocked=Math.max(progress.unlocked,Math.min(LEVELS.length-1,levelIndex+1));}save();closeSession(outcome);const l=LEVELS[levelIndex],out=Array.isArray(l.outro)?l.outro.map(o=>typeof o==='string'?o:`${o.speaker}：${o.text}`).join('\n'):'';modal(`<div class="eyebrow">${outcome==='victory'?'EXPEDITION COMPLETE':outcome==='defeat'?'RESCUE COMPLETE':'BACK AT THE POD'}</div><h2>${outcome==='victory'?'带着新的发现回来了':outcome==='defeat'?'阿禾把你接回了小船':'先休息，再出发'}</h2><p style="white-space:pre-line">${escape(outcome==='victory'?out||'海图亮起一片新的区域。陌生的海，开始有了熟悉的名字。':outcome==='defeat'?'应急救援保住了你和一半探索收入。下次留意氧气，先找到水面和气泡补给点。':'本次收获已经存好。你可以换一片海域，再试一次。')}</p><div class="stat-grid"><div><b>${formatTime(activeSeconds)}</b><span>实际探索时间</span></div><div><b>${catchCount}</b><span>带回的食材</span></div><div><b>${outcome==='defeat'?Math.floor(reward*.5):reward}</b><span>探索收入</span></div></div><div class="button-row">${button('galley','料理与补给',true)}${button('review','记录体验')}</div><p class="small">海域编号 ${selectedSeed} · ${actor==='agent'?'自动试玩':'真人试玩'}记录将与此版本绑定保存</p>`);bind('galley',returnConversation);bind('review',()=>showFeedback('debrief'));}

function showHub(){
  mode='hub';keys.clear();progress.pantry??=[];
  const season=SEASONS[seasonForDay(progress.day)],upgrades=[{id:'oxygen',title:'扩容氧气瓶',text:'每级增加 18 氧气容量',cost:50+progress.oxygen*30},{id:'bag',title:'打捞背包',text:'每级增加 4 格背包空间',cost:40+progress.bag*25},{id:'fin',title:'轻质脚蹼',text:'每级提升基础游速',cost:65+progress.fin*30}];
  ui.innerHTML=harborMarkup(progress,upgrades);
  bind('open-restaurant',()=>{mode='service';keys.clear();const eveningId=crypto.randomUUID();startRestaurant(ui,{pantry:progress.pantry.map(p=>({...p})),level:levelIndex,day:progress.day,season:seasonForDay(progress.day),mastery:progress.mastery,buildings:progress.buildings,trust:progress.trust,recipes:LEVELS[levelIndex].recipes,onComplete:r=>finishRestaurant({...r,eveningId}),onExit:showHub,log:(type,data)=>recordHubAction(type,data)});});
  document.querySelectorAll('[data-build]').forEach(b=>b.onclick=()=>{const result=buyBuilding(progress,b.dataset.build);if(!result)return;save();recordHubAction('building_purchased',result);toast(result.effect);showHub();});
  document.querySelectorAll('[data-upgrade]').forEach(b=>b.onclick=()=>{const u=upgrades.find(u=>u.id===b.dataset.upgrade);if(progress.credits<u.cost||progress[u.id]>=5)return;progress.credits-=u.cost;progress[u.id]++;save();recordHubAction('equipment_upgrade',{id:u.id,cost:u.cost});toast(u.title+'升级完成');showHub();});
  document.querySelectorAll('[data-sail]').forEach(b=>b.onclick=()=>showBrief(Number(b.dataset.sail)));
  bind('harbor-dive',()=>showBrief(Math.min(progress.unlocked,LEVELS.length-1)));bind('home',showTitle);bind('harbor-ending',showEnding);bind('hub-feedback',()=>showFeedback('hub'));bind('hub-recipes',()=>showCollection('hub'));bind('hub-hunts',showHuntBoard);bind('hub-shop',showShop);bind('hub-friends',()=>showFriends());bind('hub-rest',()=>{progress.day++;save();recordHubAction('rest',{day:progress.day,season:seasonForDay(progress.day)});toast(`第 ${progress.day} 日 · ${SEASONS[seasonForDay(progress.day)].name}`);showHub();});
}
function showShop(){mode='shop';const unlocked=progress.unlocked>=1||progress.giantsSeen.length>0;ui.innerHTML=shopMarkup(progress);bind('shop-back',showHub);document.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>{if(!unlocked)return;const item=buySupply(progress,b.dataset.buy);if(item){save();recordHubAction('supply_purchase',{id:item.id,cost:item.cost});toast('收好了一份'+item.name);showShop();}});bind('trade-relic',()=>{if(!unlocked||!progress.relics)return;if((progress.stock.air||0)>=9||(progress.stock.salve||0)>=9){toast('补给包已满，先用掉一些再来。');return;}progress.relics--;progress.stock.air=(progress.stock.air||0)+1;progress.stock.salve=(progress.stock.salve||0)+1;save();recordHubAction('relic_trade',{relics:progress.relics});showShop();});}
function consumeSupply(id){if(mode!=='play')return;if(!useSupply(progress,id,state.player,maxOxygen())){toast((progress.stock[id]||0)?'现在不需要这份补给。':'没有这份补给，返港后可去潮间行商处购买。');return;}if(id==='beacon'){sonarCooldown=0;pulseSonar();sonarCooldown=0;}save();log('supply_used',{id,remaining:progress.stock[id],player:playerSummary()});toast('使用'+SHOP_ITEMS.find(i=>i.id===id).name);updateHUD();}
function showFriends(selected='ahe'){
  mode='friends';const people=Object.values(PEOPLE).filter(c=>c.id!=='xi'),person=people.find(c=>c.id===selected)||people[0],value=progress.relationships[person.id]||0;
  modal(`<button class="close" id="close" aria-label="合上人物手记">×</button><header class="bb-friends-head"><div class="eyebrow">蓝湾的人们 · 人物手记</div><h2>每一盏灯后，都有一个故事。</h2><p>返港和收摊之后，留一点时间给身边的人。</p></header><div class="bb-friend-album"><div class="bb-friend-art">${characterPortrait(person.id)}</div><article class="bb-friend-page"><span>熟悉度 ${value} · ${value>=6?'愿意交心':value>=2?'渐渐熟悉':'初次相识'}</span><h3>${person.name}</h3><p>${person.role}</p><blockquote>“${escape(person.line)}”</blockquote><div class="bb-heart-track">${Array.from({length:6},(_,i)=>uiIcon('heart',i>=value?'is-empty':'')).join('')}</div><small>每次认真听完一段故事，都会更熟悉一点。</small></article></div><nav class="bb-friend-tabs" aria-label="选择人物">${people.map(c=>`<button data-person="${c.id}" aria-pressed="${c.id===person.id}">${characterPortrait(c.id)}<span>${c.name}</span></button>`).join('')}</nav>`,true);
  bind('close',showHub);document.querySelectorAll('[data-person]').forEach(b=>b.onclick=()=>showFriends(b.dataset.person));
}
function runRelationship(trigger,guestIds=[],served=0,after=showHub){mode='relationship';keys.clear();startRelationshipScene(ui,{progress,trigger,level:levelIndex,guestIds,served,onLog:recordHubAction,onComplete:result=>{if(result&&!progress.seenScenes.includes(result.sceneId)){progress.seenScenes.push(result.sceneId);progress.relationships[result.character]=(progress.relationships[result.character]||0)+result.delta;save();recordHubAction('relationship_gained',result);}after();}});}
function returnConversation(){if(!lastSession||lastSession.returnConversationOpened){showHub();return;}lastSession.returnConversationOpened=true;runRelationship('return');}
function showGiant(n){mode='giant';const g=world.giants.find(g=>g.id===n.giantId),seen=progress.giantsSeen.includes(n.giantId);modal(`<div class="eyebrow">海中的大邻居 · ${progress.giantsSeen.length}/5</div><h2>${escape(g?.name||n.title)}</h2><p>${escape(g?.description||n.text)}</p><p class="small">${seen?'手记里已经有它的名字。再看一会儿，就继续前行吧。':`第一次记录 · ${g?.reward||25} 贝币与一枚潮纹纪念物。行商愿意用补给来交换它。`}</p><div class="button-row">${button('giant-observe','记下它的归路',true)}</div>`);bind('giant-observe',()=>{if(!progress.giantsSeen.includes(n.giantId)){progress.giantsSeen.push(n.giantId);progress.relics++;progress.credits+=g?.reward||25;progress.relationships.yun=(progress.relationships.yun||0)+1;save();log('giant_observed',{id:n.giantId,reward:g?.reward||25,relationship:'yun'});}n.done=true;resumePlay();caption('你给这位大邻居留出了宽宽的水路。回港把它的消息告诉云姨吧。',7);});}
function finishRestaurant(result){
  progress.completedEvenings??=[];if(result.eveningId&&progress.completedEvenings.includes(result.eveningId))return;
  if(result.eveningId)progress.completedEvenings.push(result.eveningId);
  const used=new Set(result.consumedIds||[]);progress.pantry=progress.pantry.filter(p=>!used.has(p.id));progress.credits+=result.earned||0;save();recordHubAction('restaurant_session',{level:levelIndex,seed:selectedSeed,...result});
  mode='service-result';modal(`<div class="eyebrow">灯下开席 · 今晚的营业</div><h2>最后一桌，也吃好了</h2><div class="stat-grid"><div><b>${result.served||0}</b><span>招待的客人</span></div><div><b>${result.earned||0}</b><span>营业收入 / 贝币</span></div><div><b>${progress.pantry.length}</b><span>冷藏剩余食材</span></div></div><p>碗筷可以晚一点收，先把这杯茶喝完。${result.served?'客人还有一个故事，想慢慢讲给你听。':'阿禾给你留了一碗热汤。'}</p><div class="button-row">${button('service-back','收摊后，再坐一会儿',true)}</div>`);
  let continued=false;bind('service-back',()=>{if(continued)return;continued=true;runRelationship('after_service',result.servedGuestIds||[],result.served||0,()=>{progress.day++;save();showHub();});});
}

function recordHubAction(type,data){post('/api/feedback',{schema_version:1,kind:'hub_action',actor_type:actor,build_hash:build.hash,session_id:lastSession?.session_id,created_at:new Date().toISOString(),type,...data}).catch(()=>{});}
function showEnding(){mode='ending';modal('<div class="eyebrow">第一章 · 蓝湾手记</div><h2>为下一位客人，留一盏灯</h2><p>五片海域都被你记进了小本子，从阳光照亮的浅礁，一直来到灯潮深庭。你认得巨鳐的归路，也开始记住每位客人的口味。</p><p>阿禾把新菜名一个个写在菜单上，又在靠海的桌边添了一把椅子。窗外的风送进来一张没有署名的小纸条。</p><p>“若有一碗热汤，请为我留灯。”背面画着一条很长的鳐，斑点像一排亮着灯的窗。</p><p>你把纸条夹进菜单。明天，还是先把小店开好。</p><hr><p class="small">第一章的海图已经展开。五片海域都可以重新探索；带回新鲜食材，继续开张，客人的故事会在餐桌边慢慢发生。</p><div class="stat-grid"><div><b>'+Object.keys(progress.collection).length+'</b><span>记录的生物</span></div><div><b>'+progress.credits+'</b><span>积攒的贝币</span></div><div><b>'+progress.completed.length+'/5</b><span>发现的海域</span></div></div><div class="button-row">'+button('ending-feedback','聊聊这几次下潜',true)+button('ending-home','重新探索')+'</div>');bind('ending-feedback',()=>showFeedback('ending'));bind('ending-home',showTitle);}
function resumePlay(){mode='play';keys.clear();renderHUD();}
function pause(){if(mode!=='play')return;mode='pause';log('pause');modal(`<div class="eyebrow">蓝湾夜食</div><h2>在海里歇一会儿</h2><p>探索已暂停，氧气不会消耗。</p><div class="choices"><button class="choice" id="resume">${uiIcon('wave')}<strong>继续探索</strong><span>回到刚才的位置</span></button><button class="choice" id="map">${uiIcon('compass')}<strong>查看海图</strong><span>查看线索、补给和返航位置</span></button><button class="choice" id="pause-feedback">${uiIcon('quill')}<strong>记录体验</strong><span>画面、操作、鱼群、地图或剧情，任何想法都可以</span></button><button class="choice" id="quit">${uiIcon('boat')}<strong>结束本次下潜</strong><span>保存已经获得的收获并返回小船</span></button></div><div class="button-row">${button('pause-help','操作说明')}${button('pause-sound','声音开关')}</div>`);bind('resume',resumePlay);bind('map',showMap);bind('pause-feedback',()=>showFeedback('pause'));bind('quit',()=>finishDive('abandoned'));bind('pause-help',()=>showHelp('pause'));bind('pause-sound',toggleSound);}
function returnTo(where){if(where==='hunt-pause'){mode='hunt';pauseHunt();return;}if(where==='hunt-result'){showHuntBoard();return;}if(where==='play')resumePlay();else if(where==='title')showTitle();else if(where==='hub')showHub();else if(where==='ending')showEnding();else if(where==='debrief')returnConversation();else{mode='play';pause();}}
function showHelp(back='title'){mode='help';modal(`<button class="close" id="close">×</button><div class="eyebrow">DIVE MANUAL</div><h2>从一次小小的下潜开始</h2><div class="choices"><div class="choice"><strong>WASD / 方向键 · 游动</strong><span>Shift 加速，额外消耗氧气。水面会补氧，海底气泡泉可用 E 交互补给。</span></div><div class="choice"><strong>空格 / 鼠标左键 · 捕捉</strong><span>靠近鱼后出现名字与准星。鱼叉自动瞄准身边最近的生物。同种鱼累计捕获 5 / 12 条，解锁拿手 / 传奇料理。鱼的体型影响售价。危险鱼可暂时驱赶，不占背包；背包满了仍可驱赶。</span></div><div class="choice"><strong>E · 查看发现 / 返回小船</strong><span>靠近发光标记操作。找到三处主线并捕够食材，回起点完成航段。</span></div><div class="choice"><strong>Q 声呐 · M 海图 · I 背包 · Esc 暂停</strong><span>声呐标出发现物。1 使用潮息瓶，2 使用药膏，3 使用回声灯（港口行商处购买）。海图和手记打开时暂停。反馈按钮或 F 可以随时记录想法。</span></div></div><p class="small">每次下潜的地形和生物位置由海域编号决定。想对比同一张地图，可以再次输入同一编号。记录保存在本机。</p><div class="button-row">${button('gotit','知道了',true)}</div>`);bind('close',()=>returnTo(back));bind('gotit',()=>returnTo(back));}
function showCollection(back='play',page=0,selected=null,filter='all'){
  mode='collection';
  const inventory=back==='play'?`<section class="bag-section"><div class="eyebrow">TODAY'S CATCH</div><h2>今天的鱼篓 <small>${cargo.length} / ${capacity()}</small></h2><p class="small">${cargo.length>=capacity()?'鱼篓满了。放生一条即可腾出空间；危险鱼仍可用空格驱赶。':'可以继续寻找食材，也可以放生后换一种鱼。'}<br>放生会减少食材；若放走某品种最后一条，也会减少当前品种数。返航前请留意任务条件。</p><div class="inventory-grid bag-grid">${cargo.map((c,i)=>`<button class="small-button" data-release="${i}">${artIcon(fishArt(c.species))}<span>${escape(c.name)} · ${c.weightKg??1} kg · 放生</span></button>`).join('')||'<p class="small">鱼篓还是空的，带些新鲜食材回小馆吧。</p>'}</div></section><hr>`:'';
  modal(fieldbookMarkup(speciesList,progress,{page,selected,filter,inventory}),true);
  document.querySelectorAll('[data-book-page]').forEach(b=>b.onclick=()=>showCollection(back,Number(b.dataset.bookPage),null,filter));
  document.querySelectorAll('[data-specimen]').forEach(b=>b.onclick=()=>showCollection(back,page,b.dataset.specimen,filter));
  document.querySelectorAll('[data-book-filter]').forEach(b=>b.onclick=()=>showCollection(back,0,null,b.dataset.bookFilter));
  bind('close',()=>returnTo(back));document.querySelectorAll('[data-release]').forEach(b=>b.onclick=()=>{const idx=Number(b.dataset.release),item=cargo[idx];if(!item)return;const fish=state.fish.find(f=>f.id===item.id);if(fish){fish.alive=true;fish.x=state.player.x+5;fish.y=state.player.y;fish.homeX=fish.x;fish.homeY=fish.y;}cargo.splice(idx,1);catchCount=Math.max(0,catchCount-1);log('fish_released',{id:item.id,species:item.species});showCollection(back,page,selected,filter);});}
function showMap(){mode='map';modal(`<button class="close" id="close">×</button><div class="eyebrow">SEA CHART · ${selectedSeed}</div><h2>${escape(LEVELS[levelIndex].name)}</h2><canvas id="fullmap" class="map-full" width="1000" height="480"></canvas><div class="map-legend">● 你的位置　◆ 金色：风味发现　○ 青色：氧气补给　△ 白色：小船<br>暗色地形尚未亲自探索。主要信号始终可见；按 Q 可扫描更多发现物。</div><div class="button-row">${button('map-continue','继续探索',true)}</div>`,true);drawMap($('#fullmap'),true);bind('close',resumePlay);bind('map-continue',resumePlay);}
function drawMap(c,full){
 if(!c||!world)return;
 const ctx=c.getContext('2d'),w=c.width,h=c.height,sx=w/world.width,sy=h/world.height;
 ctx.clearRect(0,0,w,h);ctx.fillStyle='#103b40';ctx.fillRect(0,0,w,h);
 // Quiet currents behind the chart; decorative ink never changes terrain collision.
 if(full){
  ctx.strokeStyle='#71978b20';ctx.lineWidth=1;
  for(let row=0;row<10;row++){ctx.beginPath();for(let x=0;x<=w;x+=12){const y=36+row*53+Math.sin(x/110+row*.6)*13;if(x===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();}
  ctx.fillStyle='#98b39b77';ctx.font='11px "BlueBay Sans",sans-serif';ctx.textAlign='center';
  for(let x=150;x<w-80;x+=170){ctx.fillText(`${Math.round(x/sx)}°`,x,22);}
 }
 for(const o of world.obstacles){
  const cx=o.x*sx,cy=h-o.y*sy,rx=o.w*sx/2,ry=o.h*sy/2;
  const reef=(scale)=>{ctx.beginPath();for(let i=0;i<18;i++){const a=i*Math.PI/9,r=1+Math.sin(i*2.7+o.x*.13+o.y*.09)*.075;const x=cx+Math.sign(Math.cos(a))*Math.pow(Math.abs(Math.cos(a)),.65)*rx*r*scale,y=cy+Math.sign(Math.sin(a))*Math.pow(Math.abs(Math.sin(a)),.65)*ry*r*scale;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.closePath();};
  if(full){reef(1.13);ctx.strokeStyle='#9eaf8340';ctx.lineWidth=1;ctx.stroke();}
  reef(1);ctx.fillStyle='#3b615a';ctx.fill();ctx.strokeStyle=full?'#9aaa795f':'#6f8a6b66';ctx.lineWidth=1;ctx.stroke();
  if(full&&rx>18&&ry>18){reef(.79);ctx.strokeStyle='#92a77b30';ctx.stroke();}
 }
 ctx.fillStyle='#92b7a80c';for(const key of fogCells){const [x,y]=key.split(',').map(Number);ctx.beginPath();ctx.arc((x+.5)*8*sx,h-(y+.5)*8*sy,Math.max(8*sx,8*sy)*.6,0,Math.PI*2);ctx.fill();}
 for(const n of state.nodes){
  if(n.done&&n.type!=='air')continue;
  if(!full&&!discovered.has(n.id)&&!n.main&&n.type!=='exit')continue;
  if(full&&!discovered.has(n.id)&&!n.main&&n.type!=='exit'&&n.type!=='story')continue;
  const x=n.x*sx,y=h-n.y*sy;ctx.fillStyle=n.type==='exit'?'#f4f0d9':n.type==='air'?'#86dcde':n.main||n.type==='story'?'#f7ce80':'#b6d3ba';ctx.strokeStyle=ctx.fillStyle;ctx.lineWidth=1.4;ctx.beginPath();
  if(full&&n.type==='exit'){ctx.moveTo(x,y-7);ctx.lineTo(x+6,y+5);ctx.lineTo(x-6,y+5);ctx.closePath();ctx.fill();}
  else if(full&&n.type==='air'){ctx.arc(x,y,6,0,Math.PI*2);ctx.stroke();}
  else if(full&&(n.main||n.type==='story')){ctx.moveTo(x,y-6);ctx.lineTo(x+4,y);ctx.lineTo(x,y+6);ctx.lineTo(x-4,y);ctx.closePath();ctx.fill();}
  else{ctx.arc(x,y,full?5:3.5,0,Math.PI*2);ctx.fill();}
  if(full){ctx.font='500 14px "BlueBay Sans",sans-serif';ctx.textAlign=x>w-150?'right':'left';ctx.fillText(n.title||nodeLabel(n),x+(x>w-150?-12:12),Math.max(38,y-9));}
 }
 ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(state.player.x*sx,h-state.player.y*sy,full?6:5,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#edce8b';ctx.lineWidth=2;ctx.stroke();
 if(full){
  const x=w-55,y=h-52;ctx.strokeStyle='#b8b68b99';ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y,24,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.moveTo(x,y-33);ctx.lineTo(x,y+33);ctx.moveTo(x-33,y);ctx.lineTo(x+33,y);ctx.stroke();ctx.fillStyle='#dbcb94';ctx.beginPath();ctx.moveTo(x,y-26);ctx.lineTo(x+6,y+10);ctx.lineTo(x,y+5);ctx.lineTo(x-6,y+10);ctx.closePath();ctx.fill();ctx.font='12px Georgia,serif';ctx.textAlign='center';ctx.fillText('N',x,y-36);
 }
}
function showFeedback(back='play'){
  previousMode=back;mode='feedback';log('feedback_opened',{from:back});
  const axes=[['enjoyment','还想不想再潜一次'],['visuals','海洋与整体画面'],['characters','人物立绘与性格'],['ui','界面是否清楚好用'],['icons','物品图标辨识度'],['story','故事与对白'],['controls','游泳与捕捉手感'],['progression','扩建与料理成长'],['ecology','季节与鱼群'],['relationships','人物关系与夜谈'],['giants','巨大生物遭遇'],['bosses','狩猎技能与难度'],['actions','捕鱼动作与反馈']];
  modal(`<button class="close" id="close" aria-label="关闭留言页">×</button><div class="eyebrow">给蓝湾小馆的一封留言</div><h2>下一次开张，想看见什么？</h2><p>可以聊聊喜欢的细节，也可以直说哪里让你出戏。小馆会记下你的话。</p><label for="category">这次最想聊的部分</label><select id="category"><option value="visuals">画面与美术气氛</option><option value="characters">人物立绘与角色</option><option value="ui">界面布局与操作提示</option><option value="icons">物品、装备与菜品图标</option><option value="story">剧情与客人对白</option><option value="exploration">地图与探索</option><option value="controls">游泳与捕捉手感</option><option value="ecology">鱼种与生态</option><option value="cooking">餐馆与装备成长</option><option value="buildings">港口扩建与收入</option><option value="seasons">季节与鱼群变化</option><option value="relationships">人物关系与深夜食堂</option><option value="giants">巨大生物与神秘行商</option><option value="bosses">Boss 技能、弱点与难度</option><option value="actions">捕鱼动作、蓄力与收线</option><option value="performance">流畅度或其他问题</option></select><details class="bb-ratings"><summary>展开细项评价 · 13 项均可选填</summary><div class="rating-grid">${axes.map(([id,label])=>`<label class="rating-row" for="rate-${id}"><span>${label}</span><select id="rate-${id}"><option value="">暂不评价</option><option value="1">1 · 很需要改善</option><option value="2">2 · 有些遗憾</option><option value="3">3 · 还可以</option><option value="4">4 · 喜欢</option><option value="5">5 · 很喜欢</option></select></label>`).join('')}</div></details><label for="feedback-text">想保留什么？希望改变什么？</label><textarea id="feedback-text" placeholder="比如：喜欢阿禾的表情和暖色餐馆，但海草湾的颜色太相近；希望客人能记得上次吃过的菜。"></textarea><p class="small feedback-note">只会记录你主动选择的评价。未评价的项目会留空；留言与试玩记录保存在本机。</p><div class="button-row">${button('send-feedback','把留言留下',true)}${button('feedback-back','返回小馆')}${button('export-record','导出试玩记录')}</div><p class="small" id="feedback-state">版本 ${build.version} · ${build.hash.slice(0,12)}${selectedSeed!==null?' · 海域 '+selectedSeed:''}</p>`);
  bind('close',()=>returnTo(back));bind('feedback-back',()=>returnTo(back));
  bind('export-record',()=>{if(lastSession)downloadJSON(lastSession,`tide-${lastSession.session_id}.json`);else if(session)toast('先结束本次下潜，才能导出完整记录');else toast('完成一次下潜后可以导出记录');});
  bind('send-feedback',async()=>{
    const feedback={schema_version:1,kind:'explicit_feedback',actor_type:actor,build_hash:build.hash,session_id:session?.session_id||lastSession?.session_id||null,seed:selectedSeed,level:levelIndex,context:{day:progress.day,season:seasonForDay(progress.day),buildings:{...progress.buildings},mastery:{...progress.mastery},relationships:{...progress.relationships},giantsSeen:[...progress.giantsSeen],pantry_count:progress.pantry.length,credits:progress.credits,hunts:progress.huntProgress,last_hunt:activeHunt?{id:activeHunt.id,status:activeHunt.status,stats:activeHunt.stats}:null},category:$('#category').value,ratings:Object.fromEntries(axes.filter(([id])=>$('#rate-'+id).value!=='').map(([id])=>[id,Number($('#rate-'+id).value)])),text:$('#feedback-text').value.trim(),created_at:new Date().toISOString(),player:playerSummary()};
    if(!feedback.text){$('#feedback-state').textContent='写下一句具体感受吧，这样下一次才能真正改到你在意的地方。';$('#feedback-text').focus();return;}
    if(session&&!session.closed){session.feedback=feedback;log('explicit_feedback',{category:feedback.category,text:feedback.text,ratings:feedback.ratings});}
    $('#send-feedback').disabled=true;
    try{await post('/api/feedback',feedback);$('#feedback-state').textContent='留言已保存在本机。谢谢，下一次见。';toast('小馆收到了你的留言');}
    catch{downloadJSON(feedback,'tide-feedback-'+Date.now()+'.json');$('#feedback-state').textContent='已为你导出留言文件，可以留到下次改版时参考。';}
    $('#send-feedback').disabled=false;
  });
}

function showHuntBoard(){
  mode='hunt-board';keys.clear();huntFireLatch=false;
  ui.innerHTML=huntBoardMarkup(progress);
  bind('hunt-board-back',showHub);bind('hunt-practice',startActionPractice);
  document.querySelectorAll('[data-hunt]').forEach(b=>b.onclick=()=>startHunt(b.dataset.hunt));
}
function startHunt(id){
  const access=huntAvailability(progress,id);
  if(!access.available){toast(access.reason||'先完成上一场狩猎。');return;}
  if(session&&!session.closed)closeSession('abandoned');
  activeHunt=createHunt(id);huntFireLatch=false;huntPointerDown=false;huntDodge=false;huntReel=false;keys.clear();
  const region={reef:0,cave:2,abyss:4}[activeHunt.world.biome]??0;
  world={...generateWorld(region,620171),...activeHunt.world,huntId:id,start:{x:activeHunt.player.x,y:activeHunt.player.y},fish:[],nodes:[],giants:[],obstacles:[],decor:[],routes:[]};
  state={time:0,biome:world.biome,player:activeHunt.player,fish:[],nodes:[],giants:[],effects:activeHunt.effects,hunt:activeHunt};
  renderer.setWorld(world);activeSeconds=0;sampleClock=0;uiClock=0;catchCount=0;cargo=[];missionDone=new Set();levelCredits=0;
  selectedSeed='hunt-'+id;newSession(selectedSeed);session.activity='boss_hunt';session.hunt_id=id;
  log('hunt_started',{id,attempt:session.session_id});mode='hunt';renderHuntHUD();
}
function renderHuntHUD(){
  keys.clear();ui.innerHTML=huntHudMarkup(activeHunt);
  bind('hunt-pause',pauseHunt);
  bind('hunt-fire',()=>{huntFireLatch=!huntFireLatch;log('hunt_input',{action:huntFireLatch?'charge_start':'charge_release',source:'button'});updateHuntHud(ui,activeHunt,huntFireLatch);});
  bind('hunt-dodge',()=>{huntDodge=true;log('hunt_input',{action:'dodge',source:'button'});});
  bind('hunt-reel',()=>{huntReel=true;log('hunt_input',{action:'reel',source:'button'});});
  updateHuntHud(ui,activeHunt,huntFireLatch);
}
function updateHunt(dt){
  if(mode!=='hunt'||!activeHunt)return;
  const x=Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft'));
  const y=Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown'));
  stepHunt(activeHunt,dt,{x,y,fire:keys.has('Space')||huntFireLatch||huntPointerDown,dodge:huntDodge,reel:huntReel});
  huntDodge=false;huntReel=false;activeSeconds=activeHunt.time;state.time=activeHunt.time;state.effects=activeHunt.effects;
  for(const e of activeHunt.events)log('hunt_'+e.type,{...e,type:'hunt_'+e.type});
  sampleClock+=dt;if(sampleClock>=1){sampleClock=0;log('hunt_sample',{player:playerSummary(),boss_hp:activeHunt.boss.hp,boss_skill:activeHunt.boss.skill,phase:activeHunt.boss.phase,action:state.player.action,charge:state.player.charge});}
  uiClock+=dt;if(uiClock>.08){uiClock=0;updateHuntHud(ui,activeHunt,huntFireLatch);}
  if(activeHunt.status!=='active')finishHunt(activeHunt.status);
}
function pauseHunt(){
  if(mode!=='hunt')return;mode='hunt-pause';keys.clear();huntFireLatch=false;huntPointerDown=false;
  activeHunt.fireHeld=false;activeHunt.player.charge=0;log('hunt_paused');
  modal(`<div class="eyebrow">潮外狩猎 · 暂停</div><h2>海水也歇一会儿。</h2><p>生命、技能与狩猎时间都已暂停。继续后，先看清水流再行动。</p><div class="button-row">${button('hunt-resume','继续狩猎',true)}${button('hunt-leave','安全返航')}${button('hunt-feedback','记录狩猎体验')}</div>`);
  bind('hunt-resume',()=>{mode='hunt';renderHuntHUD();});
  bind('hunt-leave',()=>{closeSession('abandoned');activeHunt=null;showHuntBoard();});
  bind('hunt-feedback',()=>showFeedback('hunt-pause'));
}
function finishHunt(outcome){
  if(mode!=='hunt'||!activeHunt||session?.closed)return;
  mode='hunt-result';keys.clear();huntFireLatch=false;
  const id=activeHunt.id,c=HUNT_COPY[id],win=outcome==='victory';
  const reward=awardHunt(progress,id,{victory:win,runId:session.session_id});save();
  log('hunt_reward',{...reward,id});closeSession(win?'victory':'defeat');
  ui.innerHTML=`<section class="hunt-result"><div class="hunt-result-card"><span class="eyebrow">潮外狩猎 · ${win?'收获归航':'平安归航'}</span><h1>${win?c.title+'，狩猎完成':'阿禾把你接回了船上'}</h1><p>${win?(reward.awarded?'鱼舱已经妥当收好。今晚的小馆，又多了一道值得慢慢吃的菜。':'今天已经领过复战补给。这次记下了新的狩猎成绩。'):'这次先记住它的水流。食材和贝币没有扣除，随时可以重新挑战。'}</p><div class="hunt-loot-grid"><div class="hunt-loot"><b>${formatTime(activeSeconds)}</b><span>狩猎用时</span></div><div class="hunt-loot"><b>${activeHunt.stats.weakHits}</b><span>弱点命中</span></div><div class="hunt-loot"><b>${activeHunt.stats.reels}</b><span>成功收线</span></div><div class="hunt-loot"><b>${reward.credits||0}</b><span>带回贝币</span></div></div><p>${win?(reward.awarded?'专属食材已存入冷藏箱，可以回港挂菜单营业。':'今天的复战补给已领取。本次保留战斗记录，不重复发放奖励。'):c.mechanic}</p><div class="hunt-actions">${button('hunt-home',win&&reward.awarded?'带着食材回小馆':'回到小馆',true)}${button('hunt-again',win?'再挑战一次':'重新挑战')}${button('hunt-more','查看其他狩猎')}${button('hunt-result-feedback','留下狩猎体验')}</div></div></section>`;
  bind('hunt-home',()=>win?showHuntHomecoming(id,reward):showHub());bind('hunt-again',()=>startHunt(id));bind('hunt-more',showHuntBoard);bind('hunt-result-feedback',()=>showFeedback('hunt-result'));
}
function huntCharacterRail(id){const person=PEOPLE[id]||PEOPLE.ahe;return `<aside class="character-rail"><div class="character-tag">蓝湾 · 归航的人们</div>${characterPortrait(id,'hunt-return-portrait')}<div class="character-name">${escape(person.name)}</div><p class="character-role">${escape(person.role)}</p><div class="character-stamp">BLUE BAY<br><span>等你回来，一起吃饭。</span></div></aside>`;}
function showHuntHomecoming(id,reward){
  mode='hunt-homecoming';const c=HUNT_COPY[id],scene=reward.returnScene;
  huntHomecomingPerson=scene?.character||'ahe';
  modal(`<div class="eyebrow">回港之后 · ${escape(scene?.speaker||'阿禾')}</div><h2>${escape(scene?.title||'先坐下来，饭还热着。')}</h2><p style="white-space:pre-line">${escape(scene?.text||c.note)}</p><p>${reward.awarded?'新食材已放进冷藏箱。挂上菜单，就能把这次出海做成一顿晚饭。':'今天的复战补给已经领过。阿禾把热茶递给你，陪你回想这一趟的水流。'}</p><div class="button-row">${button('hunt-home-open','回小馆开张',true)}${button('hunt-home-rest','先歇一会儿')}</div>`);
  bind('hunt-home-open',showHub);bind('hunt-home-rest',showHub);
}

function startActionPractice(){
  if(session&&!session.closed)closeSession('abandoned');
  makeWorld(0,189);state.player.x=25;state.player.y=103;state.player.action='swim';state.player.actionTime=0;
  state.mode='practice';state.fish=state.fish.filter(f=>f.x>50);state.nodes=[];state.giants=[];world.nodes=[];world.giants=[];world.fish=state.fish;renderer.setWorld(world);activeHunt=null;mode='practice';keys.clear();
  ui.innerHTML=`<section class="hunt-practice"><div class="hunt-practice-label"><span class="eyebrow">汐的鱼叉练习 · 不消耗食材</span><h2 id="practice-action-name">换一种姿势，听一听水流。</h2><p>普通捕鱼会依次瞄准、发射、拉拽、收获。狩猎时还可蓄力与闪避。</p></div><div class="hunt-practice-bar">${['aim','shoot','reel','catch','dodge','hurt'].map(a=>`<button class="hunt-action" data-practice-action="${a}">${ACTION_NAMES[a]}</button>`).join('')}<button class="primary" id="practice-all">演示一次完整捕鱼</button><button class="hunt-action" id="practice-back">返回狩猎委托</button></div></section>`;
  document.querySelectorAll('[data-practice-action]').forEach(b=>b.onclick=()=>{practiceAction(state.player,b.dataset.practiceAction);$('#practice-action-name').textContent=ACTION_NAMES[b.dataset.practiceAction];});
  bind('practice-all',()=>{beginFishingAction(state.player,{x:state.player.x+8,y:state.player.y+1});$('#practice-action-name').textContent='瞄准 → 发射 → 拉拽 → 收获';});bind('practice-back',showHuntBoard);
}

window.addEventListener('keydown',e=>{if(['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))return;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab'].includes(e.code))e.preventDefault();if(e.repeat&&e.code!=='Space')return;if(mode==='hunt'){if(!keys.has(e.code)){keys.add(e.code);log('hunt_input',{action:'down',key:e.code});}if(e.code==='ShiftLeft'||e.code==='ShiftRight')huntDodge=true;else if(e.code==='KeyR')huntReel=true;else if(e.code==='Escape')pauseHunt();return;}if(mode==='hunt-pause'&&e.code==='Escape'){mode='hunt';renderHuntHUD();return;}if(mode==='practice'&&e.code==='Escape'){showHuntBoard();return;}if(mode==='play'){if(!keys.has(e.code)){keys.add(e.code);if(inputNames[e.code])log('input',{action:'down',key:inputNames[e.code]});}if(e.code==='Space'&&!e.repeat)harpoon();else if(e.code==='KeyE'&&!e.repeat)interact();else if(e.code==='KeyQ'&&!e.repeat)pulseSonar();else if(e.code==='Digit1')consumeSupply('air');else if(e.code==='Digit2')consumeSupply('salve');else if(e.code==='Digit3')consumeSupply('beacon');else if(e.code==='Escape')pause();else if(e.code==='KeyM'||e.code==='Tab')showMap();else if(e.code==='KeyI')showCollection('play');else if(e.code==='KeyF')showFeedback('play');}else if(e.code==='Escape'){if(mode==='pause'||mode==='map')resumePlay();else if(['feedback','help','collection'].includes(mode))document.getElementById('close')?.click();}});
window.addEventListener('keyup',e=>{if(keys.has(e.code)&&inputNames[e.code])log('input',{action:'up',key:inputNames[e.code]});keys.delete(e.code);});
window.addEventListener('blur',()=>{keys.clear();if(mode==='hunt')pauseHunt();else if(mode==='play')pause();});
canvas.addEventListener('pointerdown',e=>{if(mode==='hunt'&&e.button===0){huntPointerDown=true;log('hunt_input',{action:'charge_start',source:'pointer'});return;}if(mode==='play'&&e.button===0){log('input',{action:'click',button:'left',x:e.clientX,y:e.clientY});harpoon();}});
window.addEventListener('pointerup',e=>{if(huntPointerDown){huntPointerDown=false;log('hunt_input',{action:'charge_release',source:'pointer'});}});
window.addEventListener('resize',()=>renderer?.resize());
window.addEventListener('beforeunload',()=>{if(session&&!session.closed){log('run_end',{outcome:'abandoned',active_seconds:activeSeconds});const payload={...session,duration:+sessionTime().toFixed(3),status:'abandoned'};delete payload.closed;post('/api/session',payload).catch(()=>{});}});

function observe(){return {hunt:activeHunt?{id:activeHunt.id,status:activeHunt.status,boss:activeHunt.boss,stats:activeHunt.stats,hazards:activeHunt.hazards,tether:activeHunt.tether}:null,season:seasonForDay(progress.day),giants:state?.giants,mode,actor_type:actor,build_hash:build.hash,level:levelIndex,seed:selectedSeed,time:activeSeconds,player:state?{...state.player}:null,world:world?{width:world.width,height:world.height,start:world.start,obstacles:world.obstacles}:null,nodes:state?.nodes.map(n=>({id:n.id,type:n.type,title:n.title,x:n.x,y:n.y,main:n.main,done:n.done})),fish:state?.fish.filter(f=>f.alive).map(f=>({id:f.id,species:f.species,x:f.x,y:f.y,danger:f.danger,size:f.size})),mission:{done:missionDone.size,total:state?mainNodes().length:0,catch:catchCount,catchGoal:goalCatch(),variety:varietyCount(),varietyGoal:3,canFinish:state?canFinish():false},inventory:cargo.map(c=>({...c})),progress:{...progress},session_id:session?.session_id,saved:hasSavedRecord};}
window.GameAgentBridge={observe,reset:({seed=482391,level=0}={})=>{if(actor!=='agent')throw new Error('Automated resets require ?actor=agent');progress=fresh();startDive(clamp(level,0,LEVELS.length-1),seed);return observe();}};
window.TideGame={observe};
try{
  renderer=new OceanRenderer(canvas);showTitle();
  let lastPresentedMode=mode,lastMenuRenderAt=-Infinity;
  function frame(now){
    const dt=Math.min(.05,(now-lastFrame)/1000);lastFrame=now;update(dt);
    if(mode==='title'&&state){state.time+=dt;for(const f of state.fish){f.x=(f.homeX??f.x)+Math.sin(state.time*.3+f.phase)*4;f.y=(f.homeY??f.y)+Math.cos(state.time*.2+f.phase)*1.5;f.facing=Math.cos(state.time*.3+f.phase)>0?1:-1;}}
    // Only presentation is throttled: simulation keeps its original frame dt.
    // The opaque illustrated title needs no 3D; other menus retain a quiet backdrop.
    if(mode!=='title'&&(['play','hunt','practice'].includes(mode)||mode!==lastPresentedMode||now-lastMenuRenderAt>=500)){
      renderer.update(state,dt);lastMenuRenderAt=now;
    }
    lastPresentedMode=mode;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}catch(error){$('#fatal').hidden=false;$('#fatal').textContent='海洋画面暂时无法启动。请使用最新版 Chrome 或 Edge，并确认浏览器图形加速可用。\n\n'+error.message;console.error(error);}

