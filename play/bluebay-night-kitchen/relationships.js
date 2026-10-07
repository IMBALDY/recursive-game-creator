/* Local, authored harbour vignettes. The caller commits one result after completion. */
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const CHARACTERS = {
  xiaoman:{id:'xiaoman',name:'小满',role:'把船修得比话多的船匠',portraitNew:0,line:'新码头的木头，要先听过一夜海风。',after:'碗底这么干净，可不是漏了，是好吃。'},
  xiaxia:{id:'xiaxia',name:'小夏',role:'总把颜料沾到袖口的画师',portraitNew:1,line:'今天海的蓝色，调了七次都不太对。',after:'这口鲜味，我知道该画在哪儿了。'},
  lizi:{id:'lizi',name:'栗子',role:'会给旧机器起名字的机修师',portraitNew:2,line:'修好的灯比昨天亮了，今晚想吃点脆的。',after:'吃饱了，再去替老水泵换颗螺丝。'},
  nannan:{id:'nannan',name:'南南',role:'认真记下每一次火候的厨徒',portraitNew:3,line:'今天可以先闻香再猜配方吗？',after:'这个火候我记住了，下次做给阿婆吃。'},
  yun:{id:'yun',name:'云姨',role:'保管四十本潮汐日记的人',portraitNew:4,line:'风要换方向了，今晚该喝一碗暖的。',after:'和那年换潮夜一样，汤上面飘着小小的光。'},
  lin:{id:'lin',name:'阿琳',role:'给海草田留出鱼道的采珠人',portraitNew:5,line:'今天珠子不多，海草倒长得很精神。',after:'我给明天的鲜汤留一捆嫩海菜。'},
  mo:{id:'mo',name:'阿墨',role:'替海上人家送信的邮差',portraitNew:6,line:'信送完了，终于可以把饭吃热。',after:'这家店的地址，已经写进我的老本子了。'},
  su:{id:'su',name:'苏婆婆',role:'随换潮靠岸的漂泊行商',portraitNew:7,line:'我的货有点古怪，肚子可不挑食。',after:'好味道值得回头，明天小船还会在。'},
  zhou:{id:'zhou',name:'周叔',role:'记得蓝湾每一块礁石的渔民',portraitOld:2,line:'闻见姜香就知道，你们回来了。',after:'火候刚好，下回带一把自家种的葱。'},
  voyager:{id:'voyager',name:'夜航客',role:'带着旧餐券的远行者',portraitOld:3,line:'老位置还空着吗？今晚不赶路。',after:'灯亮着，就知道有地方喝汤。'},
  ahe:{id:'ahe',name:'阿禾',role:'守着一锅热汤的搭档',portraitOld:0,line:'鱼篓给我，先擦擦头发。',after:'一盏灯，两个人，慢慢来就够了。'},
  xi:{id:'xi',name:'汐',role:'蓝湾小馆的潜水员',portraitOld:1,line:'今天的海里，又多了一点新鲜事。',after:'明天还想再去看看。'},
};

export function characterPortrait(id, extra = '') {
  const person = CHARACTERS[id] || CHARACTERS.ahe;
  const fresh = Number.isInteger(person.portraitNew), cell = fresh ? person.portraitNew : person.portraitOld;
  return `<span class="v3-character ${esc(extra)}" style="background-image:url('./assets/art/${fresh ? 'portraits-new' : 'portraits'}.png');background-size:400% ${fresh ? '200' : '100'}%;background-position:${cell % 4 * 100 / 3}% ${fresh ? Math.floor(cell / 4) * 100 : 50}%;" aria-hidden="true"></span>`;
}

// Each option changes what the conversation means; the larger gain rewards listening or sharing.
const choice = (label, response, delta = 1) => ({label,response,delta});
export const RELATIONSHIP_SCENES = [
  {id:'return-reef-xiaoman',trigger:'return',level:0,character:'xiaoman',title:'一块没有用上的木板',opening:'你把湿脚蹼放在码头边。小满正把一块旧木板翻过来，又翻过去。',lines:['“新码头总有人想刷得雪白。我倒喜欢这些划痕，记着谁在这里上过船。”','木板背面刻着一条歪歪扭扭的小鱼。“是我小时候刻的。你说，装在哪儿好？”'],choices:[choice('装在靠海的栏杆上，大家都看得到。','小满用袖口擦擦那条小鱼：“那我把它磨平一点，不扎手。”'),choice('留在回港的第一块踏板旁，像一个欢迎。','“原来旧东西，也能替人说欢迎回来。”他把木板抱得稳稳的。',2)]},
  {id:'return-reef-xiaxia',trigger:'return',level:0,character:'xiaxia',title:'今天的海是哪一种蓝',opening:'小夏把画架支在鱼篓旁。画纸上的浅礁，比你刚见到的还要安静。',lines:['“我画了很多蓝色，却总觉得少了一点什么。”','她看见你潜水镜边的盐花：“水下的海，是什么声音？”'],choices:[choice('像有人慢慢揉开一张纸。','她笑着换了一支软笔：“那我把边缘画轻一点。”'),choice('我陪你去浅滩，听过再画也来得及。','“好呀。今天先收笔，海又不会跑掉。”她第一次没急着画完。',2)]},
  {id:'return-kelp-lin',trigger:'return',level:1,character:'lin',title:'给小鱼留的一条路',opening:'海草挂在晾绳上，落下来的水珠连成短短的线。阿琳正在给幼苗换绳。',lines:['“最整齐的海草田，反而不一定长得最好。要给鱼留几道能穿过去的缝。”','她把一截嫩海草绕在手指上：“我阿爸嫌我留下来的地方太多，你呢？”'],choices:[choice('鱼来来往往，这片田也热闹一点。','“对呀，忙完抬头，总有个邻居。”她往海里看了一眼。'),choice('下次我绕开幼苗潜，替你看看鱼道通不通。','“那就拜托啦。下回给你留最嫩的一束，咱们煮汤。”',2)]},
  {id:'return-kelp-nannan',trigger:'return',level:1,character:'nannan',title:'记不进菜谱的那一勺',opening:'南南站在岸边练撒盐，桌上放着写得密密麻麻的小本子。',lines:['“海菜汤煮了三遍，每遍都像差一点。我把秒数都写下来了。”','你看见菜谱最底下还有一行小字：阿婆喜欢的味道。'],choices:[choice('今天先一起尝尝，看看少的是盐还是鲜。','他把勺子递过来：“这次我先记味道，再记秒数。”'),choice('先问阿婆想吃什么吧，她也许只想和你吃饭。','南南把本子合上：“那我今晚早一点回去，煮给她听。”说完自己也笑了。',2)]},
  {id:'return-cave-yun',trigger:'return',level:2,character:'yun',title:'没有写进天气预报的事',opening:'云姨把潮汐簿压在一只贝壳下，翻到了纸角发软的那页。',lines:['“这一页，记着我第一次看见迁游的巨鳐。它慢得像一座不着急的岛。”','“从那以后，我的预报都会多写一句：别急着赶路。”'],choices:[choice('下次见到它，我也记下潮水和位置。','“好，日记里多一个人的眼睛，海就更清楚一点。”'),choice('那晚你和谁一起看的？','她停了停，笑起来：“一个后来陪我看了四十年潮水的人。谢谢你问。”',2)]},
  {id:'return-cave-zhou',trigger:'return',level:2,character:'zhou',title:'借来的凳子',opening:'周叔搬来三张高低不一的凳子，嘴上说顺路，手心却都是木屑。',lines:['“换潮夜人多，先凑合用。矮的那张，我小时候也坐过。”','他把最稳的一张推到店门口：“你们做生意站一天，也得坐坐。”'],choices:[choice('谢谢周叔，今晚靠海的位置给你留着。','“别留得太久，饿了谁都可以坐。”他嘴上这么说，眼睛却很高兴。'),choice('现在就坐一会儿，我给你倒杯茶。','周叔终于松开抱凳子的手：“那就五分钟。海上的事，正好慢慢讲。”',2)]},
  {id:'return-ruins-mo',trigger:'return',level:3,character:'mo',title:'退不回去的一封信',opening:'码头上，阿墨正在晒一个进过水的邮袋。一封空白信封被单独摆在太阳底下。',lines:['“地址只写着：那家总亮着灯的小馆。好在这里的人都知道是哪一家。”','信纸上没有要紧事，只画了一碗汤。寄信的人说，他已经平安到了下一座岛。'],choices:[choice('把信挂在墙上吧，让客人也看到。','“那它就有一个长久的地址了。”阿墨把信封角压平。'),choice('给他回一封：汤还温着，路上慢一点。','阿墨拿出新信纸：“这句话比地图好用。我会送到。”',2)]},
  {id:'return-ruins-lizi',trigger:'return',level:3,character:'lizi',title:'老水泵的名字',opening:'栗子在旧水泵旁放了一小碟铜螺丝。机器一咳嗽，她也跟着皱一下鼻子。',lines:['“它不坏，就是有点怕换季。我叫它海豹，因为开机要哼两声。”','她手边多出一枚从潮阶花园捡来的旧铃铛：“装在新码头上，听潮的时候也有个伴。”'],choices:[choice('装在门边吧，开店时刚好听得到。','栗子摇了摇铃铛：“这可比我的闹钟温柔。”'),choice('我帮你扶着水管，先让海豹舒服一点。','忙完她递来一条干毛巾：“以后哪台机器闹脾气，我也来搭把手。”',2)]},
  {id:'return-abyss-su',trigger:'return',level:4,character:'su',title:'一间随潮水开门的店',opening:'苏婆婆的小船没有招牌，只有帆上缝着一块月牙形的布。箱子里传来轻轻的瓷器碰撞声。',lines:['“我卖会用得上的小东西，也收舍不得扔的旧东西。”','她从抽屉里取出一只不成对的茶杯：“这一只，等同伴等了好几年。”'],choices:[choice('放在店里吧，单独一只也可以好好喝茶。','“说得对，热茶不认成套不成套。”她笑着把杯子放在柜台。'),choice('说说它从哪儿来，我想把这个故事留下。','“好，那你得先坐下。”她第一次把价签翻了过去，只留下一个故事。',2)]},
  {id:'return-abyss-voyager',trigger:'return',level:4,character:'voyager',title:'很远的灯',opening:'夜航客站在泊绳旁，望着深海方向。远处有一道宽阔的影子从月光下经过。',lines:['“灯潮巨鲸也有认得的灯。它每年到这里，就知道该转弯回家了。”','他拿出那张旧餐券，边缘已经磨得很圆：“人也差不多。”'],choices:[choice('明年我们还把这盏灯点起来。','“好，我会认得。”他把餐券放回贴近胸口的口袋。'),choice('以后不用带餐券了，我们已经记得你。','他低头笑了很久：“那我下回，带一个新故事来。”',2)]},
  {id:'supper-xiaoman',trigger:'after_service',level:0,character:'xiaoman',title:'码头那头的家',opening:'盘子空了，小满却没急着走。他把手上的木屑一点点拂进掌心。',lines:['“我小时候总想修一条跑得最快的船，去越远的地方越好。”','“现在嘛，想先把大家回来的码头修好。听起来是不是有点没出息？”'],choices:[choice('能让船靠稳，也是很大的本事。','他松了一口气：“那明天先把歪着的桩扶正。”'),choice('你把远方留给别人，又把家留给了所有人。','小满低着头捧起汤碗：“这话……我可要记在工具箱上。”',2)]},
  {id:'supper-xiaxia',trigger:'after_service',level:0,character:'xiaxia',title:'画不完的招牌',opening:'小夏把筷子摆得整整齐齐，又从口袋摸出一小支铅笔。',lines:['“有人问我，为什么总画同一片海。我也想过，是不是该去别处才像个画师。”','她指着汤碗里晃动的灯影：“可是每次看见的，都又不一样。”'],choices:[choice('那就把今天这一碗也画下来吧。','“嗯，今天的光比较暖。”纸上很快多了一个圆。'),choice('我愿意每天听你说，今天哪里不一样。','“真的？那明天先看东边那块礁。”她把铅笔收好，认真吃完最后一口。',2)]},
  {id:'supper-lin',trigger:'after_service',level:1,character:'lin',title:'不圆的珍珠',opening:'阿琳从小布袋里倒出一颗弯月形的珍珠。它怎么滚，都滚不远。',lines:['“漂亮是漂亮，可收珠的人只要圆的。我就把这些都留着。”','“也许哪天能做一串，谁的样子都不一样的项链。”'],choices:[choice('这颗像月亮，挂在灯边一定好看。','她举起来对着光：“原来它也挺会发亮。”'),choice('等做好了，你要第一个戴给自己看。','阿琳把珠子放在领口比了一下：“好，不等别人来挑了。”',2)]},
  {id:'supper-nannan',trigger:'after_service',level:1,character:'nannan',title:'第一道失败的菜',opening:'南南吃得很慢，像在认真记住每一个味道。他忽然问起你第一回做饭。',lines:['“我第一次煎鱼，外面黑了，里面还凉。阿婆却说，至少厨房比昨天暖和。”','“你们会不会也有做不好的时候？”'],choices:[choice('当然。我们可以交换一张失败菜谱。','他翻出本子，郑重写下：不要在找盘子时离开锅。'),choice('下次一起做吧。做坏也有人分着吃。','南南笑出了声：“那我先把饭多煮一点，有备无患。”',2)]},
  {id:'supper-yun',trigger:'after_service',level:2,character:'yun',title:'忘了带伞的人',opening:'云姨把潮汐簿搁到一边。今晚她没有记风向，只慢慢拨开碗里的海菜。',lines:['“我年轻时有一回报错了天气，全岛的人都淋了雨。”','“后来他们把湿衣服挂到我家院子，说正好借炉子烤鱼。从那以后，院子一直很热闹。”'],choices:[choice('那一定是最热闹的一次天气预报。','“可不是，第二天还有人问什么时候再报错一回。”'),choice('今天也别急着记天气了，先把饭吃热。','她把笔帽扣上：“好。明天的风，明天再说。”',2)]},
  {id:'supper-zhou',trigger:'after_service',level:2,character:'zhou',title:'少放一点盐',opening:'周叔照例说了句“盐少了”，却把碗里最后一点汤都喝光了。',lines:['“以前她做饭，我也总这么说。她就把盐罐摆在我面前，让我自己动手。”','“其实一次都没加过。人老了，才知道有些话该换个说法。”'],choices:[choice('下次我们把盐罐也放桌上，你自己决定。','他笑着摆手：“不用，今天这样就挺好。”'),choice('今天就说一句吧：这碗汤很好喝。','周叔端正地坐好：“这碗汤，很好喝。谢谢。”说完眼角都松开了。',2)]},
  {id:'supper-mo',trigger:'after_service',level:3,character:'mo',title:'给送信人的信',opening:'阿墨付过钱，又翻了翻自己的空邮袋，像忘记了什么。',lines:['“每天都是别人的消息。我的生日，去年还是信封上的邮戳提醒的。”','他不好意思地笑笑：“其实也不是想要什么礼物。”'],choices:[choice('下次来，我们给你留靠窗的位置。','“好，有一个位置等我就挺好。”他把椅子轻轻推回去。'),choice('拿张纸来，今晚大家给你写一封信。','阿墨盯着第一行“今天辛苦了”，半天才说：“这封我自己来送。”',2)]},
  {id:'supper-lizi',trigger:'after_service',level:3,character:'lizi',title:'终于不用修的东西',opening:'栗子吃完还在转动茶杯，习惯性地检查杯把牢不牢。',lines:['“每天都有人说，这个又坏了，那个能不能快一点。听多了，总觉得只要停下来就会误事。”','“你们这儿有没什么不用修的？”'],choices:[choice('这碗汤刚出锅，不用修，只要喝。','她终于把茶杯放下：“收到，今晚不带工具。”'),choice('今晚谁找你，就说师傅在休息，我来接话。','栗子靠到椅背上，长长呼了口气：“原来休息，也能有人帮忙。”',2)]},
  {id:'supper-su',trigger:'after_service',level:4,character:'su',title:'不标价的东西',opening:'苏婆婆把贝币放好，摸出一枚磨旧的铜扣，迟迟没有收回箱子。',lines:['“总有人问我，船上最贵的是什么。其实最舍不得的，一样也没标价。”','“这枚扣子，是我第一次独自出海时，母亲替我缝上的。”'],choices:[choice('小店里也留一只不标价的盒子吧。','她点点头：“专门装值得带着走的东西。”'),choice('今晚把这个故事讲完吧，我们不赶你开船。','“好，那得从那天的潮水说起。”她把外套脱下，坐得舒服了一点。',2)]},
  {id:'supper-voyager',trigger:'after_service',level:4,character:'voyager',title:'下一次不问名字',opening:'最后一盏灯还亮着。夜航客这次没有把餐券压在碗底，而是放在柜台中央。',lines:['“我每去一个港口，都得重新说自己从哪里来。慢慢就懒得说了。”','“你们从来不催我讲完，好像我明天还会来一样。”'],choices:[choice('明天来，还是坐这里，想讲多少都可以。','他点点头：“那明天，我从一个很小的岛讲起。”'),choice('有一天不想走，也可以在蓝湾住下来。','他看了看空碗和窗外的灯：“嗯。我第一次觉得，停下来也算一种抵达。”',2)]},
];

export function pickRelationshipScene({progress = {},trigger = 'return',level = 0,served = 0,guestIds = []} = {}) {
  const seen = new Set(progress.seenScenes || progress.storySeen || []);
  const eligible = RELATIONSHIP_SCENES.filter(scene => scene.trigger === trigger && scene.level <= level && !seen.has(scene.id) && (trigger !== 'after_service' || (served > 0 && guestIds.includes(scene.character))));
  eligible.sort((a,b) => Number(b.level === level) - Number(a.level === level) || a.level - b.level);
  if (eligible.length) return eligible[0];
  const quietId = `quiet-${trigger}-${Math.floor(Number(progress.day) || 1)}-${level}`;
  if (seen.has(quietId)) return null;
  const person = trigger === 'after_service' && served > 0 ? guestIds.find(id => CHARACTERS[id]) : 'ahe';
  // A quiet coda keeps every genuine return warm without inventing a guest who never ate.
  const character = person || 'ahe';
  return {id:quietId,trigger,level,character,title:trigger === 'return' ? '平安回来就好' : '收摊后的那杯茶',opening:trigger === 'return' ? '绳子系稳了，船边的水声也慢了下来。有人递来一条干毛巾。' : served > 0 ? '碗筷收好了，留下来的客人捧着热茶，谁也没有急着开口。' : '今晚没有客人吃到晚饭。阿禾把空碗收好，又给你们倒了两杯茶。',lines:trigger === 'return' ? ['“今天海里怎么样？忙了一天，也别把自己忘在鱼篓后头。”','海风刚好。可以说一句今天的新鲜事，也可以就这样坐一会儿。'] : ['“明天的事明天再做。今晚先让灯多亮一会儿。”','茶杯暖着手，蓝湾又安静了一点。'],choices:[choice('说一件今天觉得有意思的小事。','对方认真听完，笑着说：“下次我也留个故事给你。”'),choice('坐近一点，一起把这杯茶慢慢喝完。','这回不用说什么。有人愿意陪着，就已经很好。',2)]};
}

export function startRelationshipScene(container, options = {}) {
  if (!(container instanceof HTMLElement)) throw new TypeError('夜谈需要一个有效的界面容器。');
  const scene = pickRelationshipScene(options);
  if (!scene) { options.onComplete?.(null); return {destroy(){},getState(){return {finished:true,sceneId:null};}}; }
  if (!document.querySelector('link[data-tide-relationships-style]')) { const link=document.createElement('link');link.rel='stylesheet';link.href=new URL('./relationships.css',import.meta.url).href;link.dataset.tideRelationshipsStyle='';document.head.appendChild(link); }
  let sceneStyle=document.querySelector('link[data-tide-relationships-v6-style],link[href$="relationships-v6.css"]');if(!sceneStyle){sceneStyle=document.createElement('link');sceneStyle.rel='stylesheet';sceneStyle.href=new URL('./relationships-v6.css',import.meta.url).href;sceneStyle.dataset.tideRelationshipsV6Style='';}document.head.appendChild(sceneStyle);
  const person = CHARACTERS[scene.character];
  const root=document.createElement('section');root.className=`tide-relationship rel-v6 rel-${options.trigger === 'after_service' ? 'supper' : 'return'}`;root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label',scene.title);container.appendChild(root);
  let page=0, chosen=null, finished=false;
  const log=(type,data={})=>{try{options.onLog?.(`relationship.${type}`,{sceneId:scene.id,character:scene.character,trigger:scene.trigger,...data});}catch(_){}};
  function render() {
    const current = Number(options.progress?.relationships?.[scene.character]) || 0;
    const copy = chosen ? chosen.response : page === 0 ? scene.opening : scene.lines[page-1];
    const ready = page >= scene.lines.length;
    root.dataset.sceneState=chosen?'finish':ready?'choice':'story';
    root.innerHTML=`<div class="rel-backdrop"></div><div class="rel-fireflies" aria-hidden="true"><i></i><i></i><i></i><i></i></div><div class="rel-shell"><header class="rel-story-heading"><span class="rel-eyebrow">${scene.trigger === 'return' ? '靠岸之后' : '深夜食堂'} · 蓝湾的人们</span><h2>${esc(scene.title)}</h2><span class="rel-story-thread" aria-hidden="true">❦</span></header><div class="rel-character-side">${characterPortrait(scene.character,'rel-portrait')}<div class="rel-person"><span>${esc(person.role)}</span><strong>${esc(person.name)}</strong><small>熟悉度 ${current}${chosen ? ` → ${current + chosen.delta}` : ''}</small></div></div><div class="rel-dialog"><div class="rel-nameplate"><span class="rel-speaker">${page === 0 && !chosen ? '海风轻轻吹过' : esc(person.name)}</span><span class="rel-name-shell" aria-hidden="true">✦</span></div><span class="rel-sail-tie rel-sail-tie-left" aria-hidden="true"></span><span class="rel-sail-tie rel-sail-tie-right" aria-hidden="true"></span><p class="rel-copy" aria-live="polite">${esc(copy)}</p>${chosen ? `<div class="rel-gain"><span aria-hidden="true">✿</span><span>${esc(person.name)}把你当作更熟悉的人了 · +${chosen.delta}</span></div><button data-rel-action="finish" class="rel-primary rel-keep-moment"><span>把这一刻记下来</span><span class="rel-button-leaf" aria-hidden="true">❧</span></button>` : ready ? `<div class="rel-choices" aria-label="选择你的回应">${scene.choices.map((item,index)=>`<button data-rel-choice="${index}" class="rel-choice-ribbon"><kbd>${index+1}</kbd><span>${esc(item.label)}</span><i aria-hidden="true">❧</i></button>`).join('')}</div>` : '<button data-rel-action="next" class="rel-primary rel-next-shell"><span>继续听</span><kbd>Enter</kbd><i aria-hidden="true">▸</i></button>'}<div class="rel-foot"><span class="rel-page-beads"><span aria-hidden="true">${Array.from({length:scene.lines.length+1},(_,i)=>`<i class="${i<=page?'is-read':''}"></i>`).join('')}</span>${chosen ? '把相处记在心里' : `${Math.min(page+1,scene.lines.length+1)} / ${scene.lines.length+1} · 不计时，慢慢聊`}</span><button data-rel-action="skip">今天先聊到这里</button></div></div></div>`;
    root.querySelector('[data-rel-action="finish"], [data-rel-action="next"], [data-rel-choice="0"]')?.focus();
  }
  function close(result) { if(finished)return;finished=true;root.removeEventListener('click',onClick);document.removeEventListener('keydown',onKey,true);root.remove();log(result?'completed':'skipped',result?{choice:result.choice,delta:result.delta}:{});options.onComplete?.(result); }
  function act(action,index) { if(finished)return;if(action==='skip'){close(null);return;}if(action==='next'&&!chosen){page=Math.min(scene.lines.length,page+1);render();return;}if(action==='choice'&&!chosen&&page>=scene.lines.length){const item=scene.choices[index];if(!item)return;chosen={...item,index};log('choice',{choice:index,delta:item.delta});render();return;}if(action==='finish'&&chosen)close({character:scene.character,sceneId:scene.id,delta:chosen.delta,choice:chosen.index,text:chosen.response,trigger:scene.trigger}); }
  function onClick(event){const button=event.target.closest('[data-rel-action], [data-rel-choice]');if(!button||!root.contains(button))return;event.stopPropagation();act(button.dataset.relAction||'choice',Number(button.dataset.relChoice));}
  function onKey(event){if(finished)return;if(['1','2'].includes(event.key)&&page>=scene.lines.length&&!chosen){event.preventDefault();event.stopImmediatePropagation();act('choice',Number(event.key)-1);}else if(event.key==='Enter'&&!root.contains(event.target)){event.preventDefault();event.stopImmediatePropagation();act(chosen?'finish':'next');}else if(root.contains(event.target))event.stopPropagation();}
  root.addEventListener('click',onClick);document.addEventListener('keydown',onKey,true);render();log('opened');
  return {destroy(){close(null);},getState(){return {sceneId:scene.id,character:scene.character,page,chosen:chosen?.index??null,finished};}};
}
