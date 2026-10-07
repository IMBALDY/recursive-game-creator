/** Hunt rewards are save transactions. They never invent a battle victory. */
export const HUNT_ORDER = Object.freeze(['ironjaw', 'stormeel', 'ancientshark']);
export const HUNT_REWARDS = Object.freeze({
  ironjaw: {id:'ironjaw',name:'装甲巨石斑',firstCredits:100,firstPortions:3,repeatCredits:12,ingredient:'巨石斑厚切',recipeName:'海盐慢煨巨石斑',recipePrice:76,recipeIcon:12,weightKg:1.8},
  stormeel: {id:'stormeel',name:'雷冠鳗',firstCredits:140,firstPortions:4,repeatCredits:16,ingredient:'雷冠鳗鱼段',recipeName:'姜香雷冠鳗暖锅',recipePrice:98,recipeIcon:12,weightKg:1.5},
  ancientshark: {id:'ancientshark',name:'吞舟古鲨',firstCredits:200,firstPortions:5,repeatCredits:20,ingredient:'古鲨净鱼排',recipeName:'归航古鲨香煎排',recipePrice:132,recipeIcon:13,weightKg:2.2},
});
export const HUNT_STORIES = Object.freeze({
  ironjaw: {
    commission:'周叔的运菜小船又被追到了浅滩。装甲巨石斑占住了礁口，请替归港的船清出航路。先在练习区熟悉闪避和破甲，别急着逞强。',
    returnScene:{id:'hunt-return-ironjaw',title:'比鱼篓更满的码头',speaker:'阿禾',character:'ahe',text:'周叔已经把凳子搬来了，小满又去隔壁借了两张。阿禾先递给你一条干毛巾，才去看今天的大收获。\n“先坐下喘口气。你带回来的这几份，够我们把靠海的桌子都招待好。”\n周叔把热茶推到你手边：“明早送菜的小船，终于能从礁口直接回家了。”'},
    feastScene:{id:'hunt-feast-ironjaw',title:'给冒险的人留一块',speaker:'周叔',character:'zhou',text:'海盐慢煨巨石斑端上桌，周叔先替你夹了一块。\n“年轻时我总惦记抓到最大的鱼。现在有人平安回来，桌上又有好菜，我就很满足了。”\n阿禾把你的碗往前推了一点：“听见没有？今天不用你收最后一张桌。”'},
  },
  stormeel: {
    commission:'换潮后的雷冠鳗盘踞在海草水道，运灯芯的船迟迟进不了港。留心它蓄电前扬起的鳍冠，绕过电流，再寻找收招的空隙。',
    returnScene:{id:'hunt-return-stormeel',title:'一盏一盏亮起来',speaker:'栗子',character:'lizi',text:'栗子把最后一枚灯芯装好，码头的灯沿着木栏杆次第亮起。\n“苏婆婆的货船已经进港。新灯亮度正好，不晃眼，吃饭也看得清。”\n阿禾从厨房探出头：“还有姜香暖锅。今天谁也别站在风里说话了，都坐进来。”'},
    feastScene:{id:'hunt-feast-stormeel',title:'暖锅边不用赶工',speaker:'栗子',character:'lizi',text:'姜香雷冠鳗暖锅咕嘟作响，栗子惯常伸向工具包的手停在半路。\n“今天的灯，明天再检查一遍也来得及吧？”\n你把锅盖掀开一点，让香气先回答。她笑着把工具包放到椅子底下，认真添了半碗饭。'},
  },
  ancientshark: {
    commission:'老航道的吞舟古鲨不断撞散货网，远行船只只能绕过长长的外海。跟紧它的转向，辨认冲刺和甩尾的前兆，为蓝湾打开更安全的归路。',
    returnScene:{id:'hunt-return-ancientshark',title:'海图上的那条直线',speaker:'夜航客',character:'voyager',text:'夜航客在海图上擦去了一段弯弯绕绕的旧航线，重新画出通向蓝湾的直线。\n“少绕半夜，来得及赶上你们的晚饭。”他把铅笔放下，没有马上收起海图。\n阿禾在门口招手：“今晚的香煎排有你的份。海图晾着，先来吃。”'},
    feastScene:{id:'hunt-feast-ancientshark',title:'故事讲到汤凉之前',speaker:'夜航客',character:'voyager',text:'归航古鲨香煎排端上来时，夜航客正讲到第一次来蓝湾的那个晚上。\n“那时我只想借一盏灯辨方向。没想到后来，一直想着回这张桌子。”\n阿禾又添了一勺热汤。窗外的船灯慢慢停稳，故事可以继续讲，晚饭还热着。'},
  },
});

const object = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const count = value => Number.isFinite(Number(value)) ? Math.max(0,Math.floor(Number(value))) : 0;
const validRuns = value => [...new Set((Array.isArray(value) ? value : []).filter(item => typeof item === 'string' && item.length > 0 && item.length <= 240))];

/** Returns a normalized copy and preserves all unrelated save fields. */
export function ensureHuntProgress(progress = {}) {
  const source=object(progress),old=object(source.huntProgress);
  const cleared=HUNT_ORDER.filter(id => (Array.isArray(old.cleared) && old.cleared.includes(id)) || count(old.wins?.[id]) > 0);
  return {...source,pantry:Array.isArray(source.pantry)?source.pantry.map(item=>item && typeof item==='object'?{...item}:item):[],huntProgress:{
    ...old,version:1,cleared,wins:Object.fromEntries(HUNT_ORDER.map(id=>[id,Math.max(cleared.includes(id)?1:0,count(old.wins?.[id]))])),
    claimedRuns:validRuns(old.claimedRuns),repeatPaidDays:Object.fromEntries(HUNT_ORDER.map(id=>[id,[...new Set((Array.isArray(old.repeatPaidDays?.[id])?old.repeatPaidDays[id]:[]).filter(day=>Number.isInteger(day)&&day>=1))]])),
  }};
}

export function huntAvailability(progress,id) {
  const index=HUNT_ORDER.indexOf(id);
  if(index<0)return {available:false,cleared:false,wins:0,reason:'这张委托不在蓝湾的告示板上。',prerequisiteId:null};
  const {huntProgress}=ensureHuntProgress(progress),prerequisiteId=index?HUNT_ORDER[index-1]:null;
  const available=!prerequisiteId||huntProgress.cleared.includes(prerequisiteId);
  return {available,cleared:huntProgress.cleared.includes(id),wins:huntProgress.wins[id],prerequisiteId,
    reason:available?'':`先完成「${HUNT_REWARDS[prerequisiteId].name}」的首次狩猎。`};
}

/** Mutates the caller's progress only for a valid, unlocked, fresh victory. */
export function awardHunt(progress,id,{victory=false,runId}={}) {
  const empty={awarded:false,duplicate:false,firstClear:false,credits:0,ingredients:[],unlockedId:null,returnScene:null,feastScene:null};
  if(!progress||typeof progress!=='object'||Array.isArray(progress))return {...empty,reason:'无效的存档。'};
  if(typeof runId!=='string'||!runId.trim()||runId.length>240)return {...empty,reason:'这次狩猎缺少有效记录，尚未发放奖励。'};
  const normalized=ensureHuntProgress(progress),availability=huntAvailability(normalized,id);
  if(!availability.available)return {...empty,reason:availability.reason};
  if(normalized.huntProgress.claimedRuns.includes(runId))return {...empty,duplicate:true,reason:'这次狩猎的收获已经放进冷藏箱。'};
  if(victory!==true)return {...empty,reason:'先平安回港。休整后还可以再来，未完成狩猎不会获得食材。'};
  const hunt=normalized.huntProgress,definition=HUNT_REWARDS[id],day=Math.max(1,count(progress.day));
  const firstClear=!hunt.cleared.includes(id),repeatPaid=!hunt.repeatPaidDays[id].includes(day);
  const portionCount=firstClear?definition.firstPortions:repeatPaid?1:0;
  const credits=firstClear?definition.firstCredits:repeatPaid?definition.repeatCredits:0;
  hunt.claimedRuns.push(runId);hunt.wins[id]++;
  if(firstClear)hunt.cleared.push(id);else if(repeatPaid)hunt.repeatPaidDays[id].push(day);
  const ingredients=Array.from({length:portionCount},(_,index)=>({id:`hunt:${id}:${runId}:${index+1}`,kind:'fish',species:`hunt_${id}`,huntId:id,
    name:definition.ingredient,value:Math.round((definition.recipePrice-8)/1.8),sizeFactor:1,sizeLabel:'精选切份',weightKg:definition.weightKg,
    recipeName:definition.recipeName,recipePrice:definition.recipePrice,recipeIcon:definition.recipeIcon}));
  progress.huntProgress=hunt;progress.pantry=[...normalized.pantry,...ingredients.map(item=>({...item}))];
  progress.credits=Math.max(0,Number.isFinite(Number(progress.credits))?Number(progress.credits):0)+credits;
  const next=HUNT_ORDER[HUNT_ORDER.indexOf(id)+1];
  return {...empty,awarded:credits>0||ingredients.length>0,firstClear,credits,ingredients,
    unlockedId:firstClear&&next?next:null,returnScene:firstClear?HUNT_STORIES[id].returnScene:null,
    feastScene:firstClear?HUNT_STORIES[id].feastScene:null,
    reason:firstClear?'首次委托完成，专属食材已存入冷藏箱。':repeatPaid?'今天的复战补给已收好。':'今天这份复战补给已领过；本次记下战绩，明天再来。'};
}
