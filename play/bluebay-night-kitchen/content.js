/**
 * Original content for 蓝湾夜食. Coordinates are world units, with y pointing up.
 * Every obstacle uses CENTER x/y and FULL w/h. Seeds reproduce the same dive.
 * Surface water (y > height - 8) is always open. Story landmarks remain legible
 * while rock outcrops, gardens, supplies, and fish schools change between seeds.
 */

export const EVENINGS = [
  {
    title: '第一夜 · 灯亮起来了', subtitle: '浅礁鲜味 / 姜香与一碗热汤',
    note: '那张褪色餐券上，只有一行字：还饿，就再添一勺。',
    greeting: '阿禾：菜单夹好了。你把鱼带回来，我让隔壁船闻着香味过来。',
    guestLine: '这张旧餐券……现在还能用吗？我带了新的汤钱。',
    guestAfter: '原来灯又亮了。下次，试试海草湾的清汤吧。',
    servedClue: '夜航客把餐券翻过来：背面画着海草湾的一只旧食材笼。“以前的店主，总说鲜味在那里等人。”',
    closing: '第一盏灯，有人记住了。阿禾把菜单上的油点擦成一颗小星星。',
    methodNames: ['姜香煎', '海盐烤', '清蒸', '柠檬烤'], methodIcons: [13, 13, 12, 13],
  },
  {
    title: '第二夜 · 添汤不加钱', subtitle: '海草湾 / 一点清鲜，一点旧时光',
    note: '旧配方没有克数，只写着：先煨海菜，最后掀盖，让海风进来。',
    greeting: '阿禾：今晚慢慢煨。菜可以换，热汤多添一勺的规矩就留下吧。',
    guestLine: '闻着就很熟悉。以前我夜航迷路，靠这盏灯找到了岸。',
    guestAfter: '味道不必一模一样。有人愿意再添一勺，就对了。',
    servedClue: '夜航客在菜单角画了一颗小星星：“暖水礁洞有种星砂藻。换潮那晚，蓝湾的人会用它点亮汤碗。”',
    closing: '锅底留着海菜香。熟悉的味道，也开始有了你们自己的做法。',
    methodNames: ['海菜清汤 · ', '葱香烤', '海风拌饭 · ', '香煎'], methodIcons: [12, 13, 14, 13],
  },
  {
    title: '第三夜 · 满碗星光', subtitle: '暖水深礁 / 小小的换潮夜宴',
    note: '蓝湾的换潮习俗：每家带一道菜，最后到的人讲一个海上的笑话。',
    greeting: '阿禾：碗摆好了，凳子也借来了。今晚招牌叫“满碗星光”，听着就想加饭。',
    guestLine: '今晚我不赶潮。留个靠海的位置，我也准备了一个笑话。',
    guestAfter: '你们的灯，我在很远的海上也会认得。明年还坐这个位置。',
    servedClue: '夜航客留下了一枚画着小船的木扣：“下次带新海图来。今晚先把这碗喝完，凉了可惜。”',
    closing: '阿禾在账本最后画下三只碗。蓝湾多了一家小馆，你们多了几位熟客。',
    methodNames: ['星砂清汤 · ', '暖礁烤', '夜宴鱼饭 · ', '海盐煎'], methodIcons: [12, 13, 14, 13],
  },
  {
    title: '第四夜 · 空椅子有人坐了', subtitle: '潮阶花园 / 旧石桥上的新朋友',
    note: '修复过的东西不必藏住接缝。陶碗如此，一家小店也是。',
    greeting: '阿禾：小夏答应来尝晚饭。她一边修碗，一边嫌我们留给海风的空椅子太多。',
    guestLine: '可以把这只补过的碗放上桌吗？缺口虽然还看得见，它已经不漏汤了。',
    guestAfter: '你们肯用，我就放心了。下回给店里做一套餐盘。',
    servedClue: '画师小夏指着碗底的螺旋纹：“灯潮深庭也有这样的纹路。苏婆婆那艘小货船，总在那儿等夜色变亮。”',
    closing: '新碗排在旧碗旁边。阿禾说，明天该多备一双筷子。',
    methodNames: ['陶锅焖', '花园香烤', '潮阶鱼饭 · ', '海风慢煨'], methodIcons: [12, 13, 14, 12],
  },
  {
    title: '第五夜 · 不必赶最后一班潮', subtitle: '灯潮深庭 / 给常客留下的位置',
    note: '没有谁必须交出一个惊天的秘密。想留下一起吃饭，就已经是个好故事。',
    greeting: '阿禾：今天把“打烊”牌翻过去一会儿吧。苏婆婆终于肯放下行李坐一坐了。',
    guestLine: '我卖过会发光的纽扣，修过指南针，还是第一次有人问我要不要加饭。',
    guestAfter: '再来半碗吧。其实明早那班潮，也能到我要去的地方。',
    servedClue: '苏婆婆把货单折成一只船，停在桌边：“往后每个换季夜，我都靠这个码头。别特地准备什么，留碗热汤就行。”',
    closing: '门外是大海，灯下是熟人。明天会有新的鱼群、新菜单，还有愿意多坐一会儿的客人。',
    methodNames: ['灯潮慢汤 · ', '星灯香烤', '常客鱼饭 · ', '夜航陶锅 · '], methodIcons: [12, 13, 14, 12],
  },
];

export const LEVELS = [
  {
    id: 'reef', biome: 'reef', name: '第一潜 · 今晚开张',
    subtitle: '阳光浅礁 / 小餐馆的第一锅汤',
    description: '你接手了蓝湾的一间木筏小餐馆。搭档阿禾擦亮碗筷，等你从浅礁带回鲜鱼与风味小料。今晚先把三张小桌坐满。',
    goal: '寻找 3 处开张线索，带回至少 3 种、共 6 条普通鱼后返回木筏餐馆。',
    intro: [
      { speaker: '阿禾', text: '锅已经洗了三遍。你再不带鱼回来，我就只能端一锅特别干净的水。' },
      { speaker: '汐', text: '马上。你先别把那张旧餐券当便签，背面好像画着什么。' },
    ],
    outro: [
      { speaker: '阿禾', text: '鱼篓接住了！姜切好了，海风也吹到了，今晚就差把灯点起来。' },
      { speaker: '汐', text: '贝壳勺放汤锅边吧。真有人拿旧餐券来，咱们先给他添一勺。' },
    ],
    color: '#6ddbd0', expectedMinutes: 10, catchGoal: 6,
    chapterNote: '捕鱼、找风味原料、回店做饭，开始木筏餐馆的第一晚。',
    recipes: [
      { id: 0, name: '修桨师傅', dish: '姜香清蒸鱼', text: '“先来一份不花哨的。”邻船师傅嘴上挑剔，筷子却已经拿好了。', cost: 1, reward: 16 },
      { id: 1, name: '夜航客', dish: '蓝湾海菜鱼汤', text: '客人把旧餐券压在茶杯下：“以前这碗汤，总是多给一勺。”', cost: 2, reward: 34 },
      { id: 2, name: '赶晚渡的姑娘', dish: '香煎小鱼饭', text: '渡船快开了。她想带一份能边看海边吃的晚饭。', cost: 1, reward: 18 },
    ],
    customers: ['修桨师傅', '夜航客', '赶晚渡的姑娘'],
  },
  {
    id: 'kelp', biome: 'kelp', name: '第二潜 · 旧餐券的味道',
    subtitle: '海草湾 / 一道菜，一位老客人',
    description: '那张旧餐券背面画着海草湾。旧店主把清汤配方留在防水食材笼里；鱼群从海草间穿过，你也许会遇到一位熟悉这片海的人。',
    goal: '寻找 3 处菜谱线索，带回至少 3 种、共 6 条普通鱼后返回木筏餐馆。',
    intro: [
      { speaker: '阿禾', text: '旧餐券上写着“添汤免费”。看来我们继承的不只是店，还有一笔很香的旧账。' },
      { speaker: '汐', text: '先找到背面画的旧笼子。说不定今天晚饭，还能多一道拿手菜。' },
    ],
    outro: [
      { speaker: '阿禾', text: '“先煨海菜，最后掀盖”。这菜谱可真省墨水，不过闻着已经像回事了。' },
      { speaker: '汐', text: '那就让今晚的客人尝尝。陶罐里还有一张换潮菜单，明天再慢慢研究。' },
    ],
    color: '#9bd989', expectedMinutes: 10, catchGoal: 6,
    chapterNote: '旧菜谱把夜航客、曾经的店主与海草湾的小习俗连在一起。',
    recipes: [
      { id: 0, name: '海菜采收人', dish: '海菜乌贼拌饭', text: '采收人教你把最嫩的一截留到最后拌入，入口会多一点脆。', cost: 1, reward: 20 },
      { id: 1, name: '夜航客', dish: '旧餐券清汤', text: '海草清汤端上桌。他先闻了一下，笑着把那张餐券收了起来。', cost: 2, reward: 40 },
      { id: 2, name: '补网姐妹', dish: '炭香鱼串', text: '姐妹俩一人要焦一点，一人要嫩一点，最后还是会交换着尝。', cost: 1, reward: 22 },
    ],
    customers: ['海菜采收人', '夜航客', '补网姐妹'],
  },
  {
    id: 'cave', biome: 'cave', name: '第三潜 · 满碗星光',
    subtitle: '暖水深礁洞 / 为换潮夜宴备菜',
    description: '蓝湾每到换潮的夜晚，就把几艘木筏系在一起吃饭。旧菜谱里的星砂藻只在温暖礁洞生长。带回这一季的风味，也听听深水里的小秘密。',
    goal: '寻找 3 处夜宴线索，带回至少 3 种、共 6 条普通鱼后返回木筏餐馆。',
    intro: [
      { speaker: '阿禾', text: '大家已经开始搬凳子了。今晚的招牌就叫“满碗星光”——名字起好了，食材还在海里。' },
      { speaker: '汐', text: '陶罐里的菜单画了暖流方向。只带够今晚的分量，明年还想来呢。' },
    ],
    outro: [
      { speaker: '阿禾', text: '凳子已经借好了，碗沿的小花也画好了。夜宴开不开场，就等你一句话。' },
      { speaker: '汐', text: '点灯吧。今天在礁洞看见的大影子，正好够我讲一个不太吓人的故事。' },
    ],
    color: '#86baf0', expectedMinutes: 10, catchGoal: 6,
    chapterNote: '用季节食材完成第一次夜宴，留下下一片海域的轻松悬念。',
    recipes: [
      { id: 0, name: '看潮老人', dish: '暖礁鱼片粥', text: '老人负责报潮，空下来的时候只惦记一碗热粥和半勺葱。', cost: 1, reward: 24 },
      { id: 1, name: '换潮夜宴的邻居', dish: '满碗星光', text: '鱼汤里点上星砂藻。大家先把碗举起来看，再忍不住一起笑。', cost: 2, reward: 48 },
      { id: 2, name: '夜航客', dish: '椒盐乌贼小碟', text: '他说明早就走，今晚还有时间，再坐一会儿。', cost: 1, reward: 26 },
    ],
    customers: ['看潮老人', '换潮夜宴的邻居', '夜航客'],
  },
  {
    id: 'ruins', biome: 'ruins', name: '第四潜 · 潮阶上的空椅子',
    subtitle: '潮阶花园 / 沉入海中的旧集市',
    description: '旧潮汐集市的石阶已经成了珊瑚花园。画师小夏托你找回烧窑用的海盐罐；巨鲸常从旧拱门外经过，身上的藤壶像一排开着灯的小窗。',
    goal: '寻找 3 处花园发现，带回至少 3 种、共 6 条普通鱼，邀请画师来小馆坐坐。',
    intro: [
      { speaker: '阿禾', text: '你说扩建餐厅要买新碗，小夏却捧着一篮缺口碗来了。她说先修修看，旧东西也装得下好汤。' },
      { speaker: '汐', text: '她把取盐的路画在碗底了。今天的海图，记得洗完再还。' },
    ],
    outro: [
      { speaker: '小夏', text: '盐罐找到了？太好了，今晚我带修好的碗来。那把靠海的空椅子，真的不是留给谁的吗？' },
      { speaker: '汐', text: '现在是了。给你留着，别把工作带满一桌就行。' },
    ],
    color: '#d5bd8d', expectedMinutes: 10, catchGoal: 6,
    chapterNote: '画师与海中的旧集市，让扩建的小餐馆有了新餐具和新朋友。',
    recipes: [
      { id: 0, name: '画师小夏', dish: '潮阶陶锅鱼', text: '新修好的碗第一回装汤。小夏先检查碗底，然后才想起拿筷子。', cost: 1, reward: 30 },
      { id: 1, name: '花园守望人', dish: '香草海鲷饭', text: '守望人说，旧集市如今最热闹的摊位是那丛珊瑚，鱼都爱去。', cost: 2, reward: 54 },
      { id: 2, name: '夜航客', dish: '慢煨暖碗汤', text: '他把空椅子朝海挪了一点：“别挡住老朋友认灯的路。”', cost: 1, reward: 32 },
    ],
    customers: ['画师小夏', '花园守望人', '夜航客'],
  },
  {
    id: 'abyss', biome: 'abyss', name: '第五潜 · 留灯的人',
    subtitle: '灯潮深庭 / 温泉与漂浮星河',
    description: '深水温泉托起细小的发光浮游生物。行商苏婆婆的小货船每到换季都会经过这里；她说深庭的长夜灯鳐不是海怪，只是位从不赶时间的老邻居。',
    goal: '寻找 3 处灯潮发现，带回至少 3 种、共 6 条普通鱼，准备一顿让旅人愿意停留的晚饭。',
    intro: [
      { speaker: '阿禾', text: '苏婆婆又说只停一小会儿。她上回“一小会儿”就替我们修好了半个码头。' },
      { speaker: '汐', text: '这次先把晚饭盛好，工具箱放远一点。让她也试试只当客人。' },
    ],
    outro: [
      { speaker: '苏婆婆', text: '我带了新灯芯，还有几枚奇怪但很好看的扣子。别笑，远海的东西总得有个故事才卖得出去。' },
      { speaker: '汐', text: '今天先别卖。汤在桌上，故事吃到一半再讲。' },
    ],
    color: '#a4b7f4', expectedMinutes: 10, catchGoal: 6,
    chapterNote: '神秘行商放下货箱，巨物留下一路微光。餐馆变成朋友们愿意回来的地方。',
    recipes: [
      { id: 0, name: '行商苏婆婆', dish: '长夜归港汤', text: '她把货箱放到椅子底下。这回，手里终于没有账单。', cost: 2, reward: 60 },
      { id: 1, name: '船匠小满', dish: '灯潮鱼饭', text: '小满想先画下盘子，画到一半实在闻着太香，干脆把纸收起来了。', cost: 1, reward: 34 },
      { id: 2, name: '码头老周', dish: '深庭暖锅', text: '老周带来一块新店牌：“字刻得大，远海的客人也认得。”', cost: 1, reward: 36 },
    ],
    customers: ['行商苏婆婆', '船匠小满', '码头老周'],
  },
];

export const SPECIES = [
  { id: 'clownfish', name: '小丑鱼', color: '#f78b47', size: 1.8, speed: 2.0, value: 8, habitat: ['reef'], rarity: 1, behavior: 'school', danger: 0, description: '橙白相间的小身影，总在海葵附近打转。浅礁有它们在，看起来就很热闹。' },
  { id: 'butterflyfish', name: '蝶鱼', color: '#f5d86b', size: 2.0, speed: 2.6, value: 12, habitat: ['reef'], rarity: 0.85, behavior: 'shy', danger: 0, description: '扁扁的身体像一片小叶子，常在珊瑚边成对游动。别急着追，它还会绕回来。' },
  { id: 'parrotfish', name: '鹦嘴鱼', color: '#78d6af', size: 2.7, speed: 2.1, value: 15, habitat: ['reef', 'kelp'], rarity: 0.65, behavior: 'drift', danger: 0, description: '耐心啃食礁面上的藻类，鲜亮的颜色在阳光下尤其醒目。' },
  { id: 'blue_tang', name: '蓝倒吊', color: '#65a5f4', size: 2.2, speed: 3.1, value: 14, habitat: ['reef'], rarity: 0.65, behavior: 'school', danger: 0, description: '一抹蓝色从礁石旁闪过，尾巴上的黄色却还留在眼里。' },
  { id: 'sardine', name: '沙丁鱼', color: '#d4eae6', size: 1.5, speed: 3.0, value: 7, habitat: ['reef', 'kelp', 'cave', 'ruins', 'abyss'], rarity: 1, behavior: 'school', danger: 0, description: '鱼群一起转身时，水中闪过一阵银光。蓝湾小餐馆常把它们煎得两面金黄。' },
  { id: 'wrasse', name: '锦鱼', color: '#ce87a2', size: 2.2, speed: 2.8, value: 13, habitat: ['reef', 'kelp'], rarity: 0.75, behavior: 'shy', danger: 0, description: '在海草与岩石之间灵巧穿梭，一转眼就躲进另一丛阴影。' },
  { id: 'horse_mackerel', name: '竹荚鱼', color: '#b8cfbd', size: 2.3, speed: 3.4, value: 11, habitat: ['kelp'], rarity: 1, behavior: 'school', danger: 0, description: '喜欢结队追随水流。阿禾说，简单撒盐香煎，就足够让隔壁桌加饭。' },
  { id: 'cuttlefish', name: '乌贼', color: '#c9ab85', size: 2.4, speed: 1.7, value: 18, habitat: ['kelp', 'cave'], rarity: 0.65, behavior: 'drift', danger: 0, description: '安静时像一片浮动的落叶，动作起来却很利落。夜航客偏爱椒盐做法。' },
  { id: 'grouper', name: '石斑鱼', color: '#b59d7a', size: 3.2, speed: 1.7, value: 22, habitat: ['kelp', 'cave'], rarity: 0.48, behavior: 'shy', danger: 0, description: '褐色斑点让它融入岩壁，常在洞口耐心等待。清蒸是店里最受欢迎的做法。' },
  { id: 'soldierfish', name: '松毬鱼', color: '#f0b868', size: 2.0, speed: 2.2, value: 16, habitat: ['cave'], rarity: 0.9, behavior: 'school', danger: 0, description: '金黄鳞片排列得像小松果，喜欢背光的礁洞。看潮老人叫它“海里的小灯笼”。' },
  { id: 'squirrelfish', name: '金鳞鱼', color: '#e98d7f', size: 2.1, speed: 2.6, value: 15, habitat: ['cave'], rarity: 0.9, behavior: 'shy', danger: 0, description: '大眼睛适应昏暗的礁洞，白天常聚在岩檐下休息。' },
  { id: 'lionfish', name: '狮子鱼', color: '#d8957c', size: 3.1, speed: 1.4, value: 0, habitat: ['reef', 'kelp'], rarity: 0.18, behavior: 'drift', danger: 0.55, description: '舒展的鳍条漂亮，也带着毒刺。在旁边看一会儿就好，绕开它继续找食材。' },
  { id: 'moray', name: '海鳝', color: '#8ab29a', size: 4.3, speed: 2.2, value: 0, habitat: ['cave'], rarity: 0.22, behavior: 'hunter', danger: 0.8, description: '从岩缝里探出头，守着自己的小领地。保持距离，别打扰它的午觉。' },
  { id: 'sun_goby', name: '桃花鳚', color: '#eea7ae', size: 1.3, speed: 2.1, value: 11, habitat: ['reef'], rarity: 0.9, behavior: 'drift', danger: 0, seasonalWeights: [2, 0.55, 0.35, 0.15], description: '粉色小鳍在花潮季格外鲜亮。阿禾把它做成酥煎小碟，先给等菜的客人垫垫肚子。' },
  { id: 'goatfish', name: '金须羊鱼', color: '#e7c16b', size: 2.4, speed: 2.2, value: 16, habitat: ['reef'], rarity: 0.65, behavior: 'school', danger: 0, seasonalWeights: [0.7, 1.9, 1, 0.25], description: '两根小须在沙地上拨来拨去，好像一位特别认真找钥匙的邻居。长日季更容易遇到。' },
  { id: 'damselfish', name: '蓝雀鲷', color: '#77c6e5', size: 1.6, speed: 2.9, value: 12, habitat: ['reef'], rarity: 0.8, behavior: 'shy', danger: 0, seasonalWeights: [1, 1.8, 0.5, 0.2], description: '在枝珊瑚边守着一小片水域。名字听着像鸟，脾气也像一只护窝的小雀。' },
  { id: 'seabream', name: '银背海鲷', color: '#d7b9bf', size: 3.0, speed: 2.4, value: 23, habitat: ['reef', 'kelp', 'ruins'], rarity: 0.6, behavior: 'drift', danger: 0, seasonalWeights: [1, 1.7, 0.8, 0.5], description: '背上的银边像月光。个头大一些的适合烤，小一些的整条清蒸，价钱也会随着分量变化。' },
  { id: 'anchovy', name: '玻璃鳀', color: '#c8e3d8', size: 1.2, speed: 3.4, value: 9, habitat: ['kelp', 'ruins'], rarity: 1, behavior: 'school', danger: 0, seasonalWeights: [1.7, 0.9, 0.5, 0.8], description: '成群转弯时，身体像透明的玻璃片。烘干后磨一点进汤里，是小馆新学会的提鲜办法。' },
  { id: 'greenling', name: '斑尾六线鱼', color: '#91a36f', size: 2.9, speed: 2.2, value: 22, habitat: ['kelp'], rarity: 0.55, behavior: 'shy', danger: 0, seasonalWeights: [0.7, 0.25, 1.8, 1.4], description: '在海草根边躲得很好。丰浪季肉质饱满，厨师偏爱把鱼皮煎得轻轻卷起。' },
  { id: 'mullet', name: '海风鲻鱼', color: '#a3bdba', size: 2.7, speed: 3.0, value: 19, habitat: ['kelp'], rarity: 0.7, behavior: 'school', danger: 0, seasonalWeights: [1.3, 0.8, 1.6, 0.5], description: '顺着水流去哪里都不着急。老周喜欢它做的鱼饭，吃完会认真替店里擦一遍桌子。' },
  { id: 'glass_shrimp', name: '琉璃虾', color: '#d9c4e4', size: 1.5, speed: 1.5, value: 21, habitat: ['cave', 'ruins'], rarity: 0.7, behavior: 'drift', danger: 0, seasonalWeights: [0.8, 1.3, 0.5, 1.6], description: '微微透明的身体映着洞里的光。料理时只要一点海盐，鲜甜就会自己跑出来。' },
  { id: 'lanternfish', name: '点灯鱼', color: '#c5c5ee', size: 1.7, speed: 2.0, value: 23, habitat: ['cave', 'abyss'], rarity: 0.8, behavior: 'school', danger: 0, seasonalWeights: [0.6, 0.4, 1.1, 2], description: '腹侧的细小光点像沿岸的窗。静灯季喜欢结伴靠近暖泉，远看像一串慢慢移动的灯。' },
  { id: 'spotted_octopus', name: '花点章鱼', color: '#c89b91', size: 2.7, speed: 1.7, value: 27, habitat: ['cave', 'ruins'], rarity: 0.45, behavior: 'shy', danger: 0, seasonalWeights: [0.3, 1.1, 1.8, 0.6], description: '把空贝壳搬到洞口，又嫌位置不对挪回去。阿禾说，它对装修的认真程度和你很像。' },
  { id: 'red_snapper', name: '晚霞笛鲷', color: '#e5988b', size: 3.1, speed: 2.5, value: 28, habitat: ['ruins'], rarity: 0.8, behavior: 'school', danger: 0, seasonalWeights: [0.8, 1.7, 1.2, 0.4], description: '从旧拱门间穿过，红色鱼鳞照亮一小片水。潮阶人喜欢用陶锅焖它，把鲜汤留着拌饭。' },
  { id: 'tilefish', name: '彩额方头鱼', color: '#d8b697', size: 2.6, speed: 2.3, value: 26, habitat: ['ruins'], rarity: 0.7, behavior: 'shy', danger: 0, seasonalWeights: [0.8, 0.3, 1.3, 1.7], description: '额头上一小块粉紫色像颜料没有洗干净。小夏拿它当过新餐盘的配色参考。' },
  { id: 'mosaic_wrasse', name: '花砖锦鱼', color: '#9bcaae', size: 2.3, speed: 2.7, value: 24, habitat: ['ruins'], rarity: 0.8, behavior: 'drift', danger: 0, seasonalWeights: [1.7, 1.1, 0.5, 0.3], description: '青绿鳞片夹着一小点金色，仿佛把旧集市的彩砖穿在身上。花潮季常来啄食藻芽。' },
  { id: 'ribbon_eel', name: '彩带海鳝', color: '#718ebd', size: 5.2, speed: 1.8, value: 0, habitat: ['ruins'], rarity: 0.22, behavior: 'hunter', danger: 0.7, seasonalWeights: [1, 1, 1, 1], description: '旧石缝是它的家。很适合远远观察，别把手伸到洞口，也别往餐馆带。' },
  { id: 'moonfish', name: '月盘鱼', color: '#b5cddd', size: 3.2, speed: 1.6, value: 30, habitat: ['abyss'], rarity: 0.8, behavior: 'drift', danger: 0, seasonalWeights: [0.7, 1.6, 1.2, 0.5], description: '圆圆的身体仿佛一小片月亮。夜航客曾认真问过：用圆盘装它，会不会太整齐？' },
  { id: 'silver_cod', name: '雪脊银鳕', color: '#c2d8e2', size: 3.3, speed: 2.0, value: 33, habitat: ['abyss'], rarity: 0.65, behavior: 'school', danger: 0, seasonalWeights: [0.45, 0.25, 1.2, 2], description: '沿着温泉与冷水交界巡游。静灯季最常见，炖成浓汤会让人自愿把围巾解下来。' },
  { id: 'velvet_octopus', name: '绒伞章鱼', color: '#bca2d4', size: 2.8, speed: 1.5, value: 34, habitat: ['abyss'], rarity: 0.5, behavior: 'shy', danger: 0, seasonalWeights: [1.5, 0.6, 0.3, 1.3], description: '张开柔软腕膜时像一把小伞。苏婆婆说它的颜色和自己的旧斗篷一模一样。' },
  { id: 'lantern_shrimp', name: '星尾灯虾', color: '#dfb8d2', size: 1.8, speed: 1.7, value: 29, habitat: ['abyss'], rarity: 0.8, behavior: 'school', danger: 0, seasonalWeights: [0.8, 0.4, 1.7, 1.3], description: '尾端闪过一线微光。丰浪季成群靠近温泉岩，老客们常拿它的出现猜明天的潮。' },
  { id: 'snow_crab', name: '暖泉白蟹', color: '#d7c7b5', size: 2.5, speed: 1.1, value: 32, habitat: ['abyss'], rarity: 0.6, behavior: 'drift', danger: 0, seasonalWeights: [0.4, 1.1, 1.8, 0.7], description: '浅色甲壳覆着一点细沙，喜欢温泉边的安静角落。蒸好后拆肉很慢，值得配一段长故事。' },
  { id: 'frilled_eel', name: '绸鳍深鳝', color: '#8d88aa', size: 5.6, speed: 2.1, value: 0, habitat: ['abyss'], rarity: 0.25, behavior: 'hunter', danger: 0.75, seasonalWeights: [1, 1, 1, 1], description: '深色长影沿石壁游动，鳍边像一条旧绸带。给它足够距离，它也只想顺路回家。' },
].map((species, index) => ({
  ...species,
  seasonalWeights: species.seasonalWeights ?? [[1.4, 1, 0.7, 0.5], [0.8, 1.5, 1, 0.6], [0.7, 1, 1.6, 0.8], [0.8, 0.6, 1, 1.7]][index % 4],
  baseWeightKg: Math.round(species.size ** 3 * 0.055 * 100) / 100,
}));

export const STORY = {
  title: '蓝湾夜食',
  subtitle: '白天潜进海里，晚上把好味道端上桌。',
  protagonist: '汐，刚接手木筏小餐馆的新潜水员',
  companion: '店里搭档阿禾与一位常在夜里到访的夜航客',
  opening: '蓝湾的旧木筏重新挂起招牌。阿禾管厨房，你管下潜和带回新鲜食材。第一晚还没开门，海风就把一张褪色的旧餐券吹到了桌上。',
  ending: '五片海的风味记进了小馆菜单。那张褪色餐券还夹在灯下，旁边多了小夏修好的碗、苏婆婆折的小船。码头的大影子慢慢经过，阿禾把最后一碗汤端出来：新的季节快到了，今晚先一起吃完这顿饭。',
  next: '五片海域可以重潜；换季会改变鱼群，新的海域编号会改变地形与个体大小。捕获不同个体积累拿手与传奇料理，扩建码头、厨房与餐厅，和熟客继续把日子过成新故事。',
  journal: [
    '阳光浅礁：找到开张所需的海菜与旧店主的小配方，让第一锅鱼汤有了蓝湾的味道。',
    '海草湾：旧餐券引出一道清汤的来历，夜航客记得那位总会多添一勺的店主。',
    '暖水礁洞：带回星砂藻，完成换潮夜宴。小餐馆开始有了属于自己的熟客。',
    '潮阶花园：在旧集市找回海盐罐，认识画师小夏；破损的旧碗重新盛起热汤。',
    '灯潮深庭：跟着漂浮的微光找到远行的小货船。行商苏婆婆愿意留下一晚，明天的潮也来得及。',
  ],
};

function seedNumber(seed) {
  const str = String(seed ?? 'tide-2026');
  let value = 2166136261;
  for (let i = 0; i < str.length; i++) {
    value ^= str.charCodeAt(i);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function randomFromSeed(seed) {
  let state = seedNumber(seed);
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const rounded = value => Math.round(value * 100) / 100;
const intersects = (a, b, pad = 0) => Math.abs(a.x - b.x) < (a.w + b.w) / 2 + pad && Math.abs(a.y - b.y) < (a.h + b.h) / 2 + pad;

const CHAPTERS = [
  [
    ['浅礁的海菜采收点', '采收点挂着旧店主的小木牌：“嫩叶煮汤，老叶留给小鱼。”你取了一小篮嫩海菜。阿禾在耳机里提醒：今晚的汤，总算不只有水了。'],
    ['石缝里的防水配方盒', '盒子里是一张简单的开张配方：鲜鱼、海菜、一点姜。背面还写着蓝湾的规矩——新店第一锅汤，要给邻船先送一碗。'],
    ['旧码头边的贝壳勺', '你找到了旧店主用来添汤的贝壳勺，柄上刻着“还饿就再来一勺”。回去擦干净，今晚正好放在汤锅边。'],
  ],
  [
    ['餐券背面的老食材笼', '笼子只是用来暂存风味海菜，早就没有关着鱼。你打开防水夹层，找到清汤的第一条秘诀：先煨海菜，等鲜味慢慢出来。'],
    ['正在潜水的夜航客', '一位穿旧潜水服的人正在清理食材笼。他在写字板上画出你们的招牌：“第一次夜航迷路，是这盏灯让我找到岸。”想了一会儿，他又添上一行：“今晚要是开门，给我留个靠海的位置。”'],
    ['海草根旁的风味陶罐', '你取回旧店主存放晒干海菜的密封陶罐。罐底夹着换潮夜宴的菜单，最后一道叫“满碗星光”。旁边画着暖水礁洞和一小撮会发光的藻。'],
  ],
  [
    ['夜宴采收者的绳结', '绳结标出了平缓的暖流。附在上面的木片写着蓝湾的换潮习俗：每家带一道菜，最后到的人负责讲一件海上的趣事。阿禾说她已经准备好了三件。'],
    ['岩缝里的星砂藻', '细小的光点在岩缝里轻轻闪烁。这是蓝湾故事里独有的星砂藻，点在鱼汤上就像盛了一碗星光。你取了够做夜宴的分量，留下新芽。'],
    ['深水旧桌上的夜宴碗', '这里原是一处退潮时能歇脚的石台，一只旧碗仍稳稳放着。你记下碗沿的花样，准备回店画在菜单上。远处掠过一片宽大的影子；也许是鳐，也许只是海光。今晚正好有故事可讲了。'],
  ],
  [
    ['旧集市的花砖路牌', '石阶的釉色被海水磨淡了，细看仍是一只一只小碗。背面有人新写了一行字：“画坏也没关系，端起汤就只看见碗底了。”小夏的字，认得出来。'],
    ['拱门下的海盐罐', '防水盖还牢牢扣着。罐上绑着小夏的画笔，她总把工具忘在觉得颜色漂亮的地方。你把罐和画笔一并装好，今晚可以试试陶锅鱼。'],
    ['花园里的空石凳', '石凳上留着新刷过的蓝色花纹。小夏的纸条说：“等我把最后一道裂缝补好，就去你们店坐坐。”你在旁边写下今晚开饭的时间，不必等所有裂缝都消失。'],
  ],
  [
    ['温泉边的邮筒', '这只小邮筒不寄信，只让往来的潜水员留下潮讯。阿墨夹了一张画着小船的明信片：苏婆婆带了新灯芯，夜里会顺着暖流靠岸。'],
    ['小货船落下的货签', '货签上写着会发光的扣子、旧指南针、三双花袜子。最后还有一项被划掉的“热汤”。你把它重新圈起来，旁边添上：本店有售，熟人添饭。'],
    ['深庭的灯潮石', '温泉把细小的光点轻轻托起来，看着像一座倒悬的星河。石上刻着旧航线，却没有终点。耳机里阿禾说：“不用替每个故事找结尾，先叫她回家吃饭吧。”'],
  ],
];

export const GIANTS = [
  { id: 'reef-sailray', name: '花帆巨鳐', model: 'manta_ray', size: 23, color: '#abc9c3', description: '像一张展开的旧帆缓缓经过，翼尖掠起一串小气泡。蓝湾的人说，看见它的傍晚适合把桌子搬到屋外。', reward: 25 },
  { id: 'kelp-mossback', name: '苔岛鲸鲨', model: 'whale_shark', size: 29, color: '#799fa1', description: '它宽大的背上有岛屿似的斑纹，小鱼跟着它在海草顶端散步。你只记下它的路线，让这位慢性子邻居继续巡游。', reward: 30 },
  { id: 'cave-silverwing', name: '银翼古鳐', model: 'manta_ray', size: 25, color: '#b3c5df', description: '岩洞的微光沿着鳍缘移动，仿佛有人用银线描了一笔。它转身时给你留出宽宽的水路，十分有礼貌。', reward: 35 },
  { id: 'ruins-windowback', name: '拱窗鲸鲨', model: 'whale_shark', size: 30, color: '#b0bfa4', description: '斑点像一排亮着灯的小窗，庞大的身影从旧集市拱门外经过。小夏等了好几天，想把这排“窗户”画上新碗。', reward: 40 },
  { id: 'abyss-nightlantern', name: '长夜灯鳐', model: 'manta_ray', size: 28, color: '#b2aedd', description: '它的身边跟着一点一点微光，像把整条夜航路披在身上。苏婆婆说，认得这位老邻居，就不必害怕深庭的夜色。', reward: 45 },
];

/** Deterministic dive layout. Landmarks have recognizable order, with bounded jitter. */
export function generateWorld(levelIndex = 0, seed = 'tide-2026', options = {}) {
  const index = clamp(Math.floor(Number(levelIndex) || 0), 0, LEVELS.length - 1);
  const level = LEVELS[index];
  const seasonInput = Number(options?.season);
  const season = Number.isFinite(seasonInput) ? ((Math.floor(seasonInput) % 4) + 4) % 4 : 0;
  const random = randomFromSeed(`${seed}:${level.id}`);
  const range = (min, max) => min + random() * (max - min);
  const pick = items => items[Math.floor(random() * items.length)];
  const world = {
    width: 260, height: 125, seed, biome: level.biome, season,
    start: { x: 14, y: 114 }, obstacles: [], decor: [], nodes: [], fish: [], giants: [],
    surfaceY: 117, levelIndex: index, routes: [],
  };

  const landmarkPlaces = index === 3 ? [[58, 84], [142, 65], [223, 24]] : index === 4 ? [[61, 89], [149, 42], [232, 35]] : [[64, 84], [139, 53], [226, 27]];
  const mainNodes = landmarkPlaces.map(([x, y], step) => ({
    id: `${level.id}-story-${step + 1}`, type: 'story', main: true,
    step: step + 1, x: rounded(x + range(-5, 5)), y: rounded(y + range(-4, 4)),
    title: CHAPTERS[index][step][0], text: CHAPTERS[index][step][1],
    reward: 20 + step * 5,
    interaction: index === 1 && step === 1 ? '和夜航客交谈' : '查看发现',
    npc: index === 1 && step === 1 ? '夜航客' : null,
  }));
  world.nodes.push(...mainNodes);

  // Giant animals live in a separate, non-catchable layer. Their observation
  // marker is on a reserved swimming route, never inside a rock or the body.
  const giant = { ...GIANTS[index], x: rounded(mainNodes[1].x + 12), y: rounded(mainNodes[1].y + 18) };
  giant.route = [{ x: giant.x - 15, y: giant.y + 3 }, { x: giant.x + 18, y: giant.y - 4 }];
  giant.catchable = false;
  world.giants.push(giant);
  world.nodes.push({ id: `${level.id}-giant-observation`, type: 'giant', main: false, giantId: giant.id, x: giant.x - 10, y: giant.y - 5, title: `观察${giant.name}`, text: giant.description, reward: giant.reward, interaction: '安静观察巨型生物' });

  world.nodes.push(
    { id: `${level.id}-air-1`, type: 'air', x: rounded(range(92, 111)), y: rounded(range(77, 86)), title: '潜水补气浮标', text: '附近潜水员共同维护的小浮标。补好气，把阀门轻轻关回去。', reward: 0 },
    { id: `${level.id}-air-2`, type: 'air', x: rounded(range(181, 196)), y: rounded(range(44, 56)), title: '岩壁补气站', text: '阿禾昨天检查过的补气站。停一会儿，听听海水从岩石旁经过。', reward: 0 },
    { id: `${level.id}-exit`, type: 'exit', x: 14, y: 114, title: '返回木筏餐馆', text: '带着今天的新鲜食材回去。阿禾已经点好灯，等着一起开门。', reward: 0 },
  );

  const optionalPlaces = [[35, 66], [77, 32], [111, 107], [130, 25], [165, 93], [185, 18], [232, 83], [247, 49]];
  optionalPlaces.forEach(([x, y], i) => {
    const isCache = i % 3 === 0;
    world.nodes.push({
      id: `${level.id}-${isCache ? 'cache' : 'shell'}-${i + 1}`,
      type: isCache ? 'cache' : 'shell', main: false,
      x: rounded(x + range(-5, 5)), y: rounded(y + range(-5, 5)),
      title: isCache ? ['旧码头的工具盒', '搁在礁旁的铜器', '沙地里的打捞袋'][Math.floor(i / 3)] : pick(['珍珠母贝', '光滑的海玻璃', '漂亮的空贝壳', '一小块彩色海石']),
      text: isCache ? '带回码头整理后可以换些零钱，添置装备，或给餐馆与码头添一块新木板。' : '这份小发现可以换些零钱，也可以摆在餐馆窗边，让客人猜猜在哪里找到的。',
      reward: isCache ? 18 : 8,
    });
  });

  // A broad, descending spine links the chapter landmarks. A separate open
  // surface lane makes returning possible without repeating every turn.
  const route = [world.start, { x: 37, y: 104 }, ...mainNodes, { x: 245, y: 83 }, { x: 239, y: 118 }];
  world.routes = route.map(({ x, y }) => ({ x, y }));
  const reserved = world.nodes.map(node => ({ x: node.x, y: node.y, w: 12, h: 12 }));
  // Keep a wide natural clearing along the giants' short patrol, so the first
  // encounter reveals the animal's scale instead of hiding it behind a rock.
  for (const resident of world.giants) reserved.push({x:resident.x,y:resident.y,w:resident.size+24,h:30});
  for (let i = 1; i < route.length; i++) {
    const a = route[i - 1], b = route[i];
    const count = Math.ceil(Math.hypot(a.x - b.x, a.y - b.y) / 4);
    for (let s = 0; s <= count; s++) {
      const t = s / count;
      reserved.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, w: 10, h: 10 });
    }
  }

  const addObstacle = (x, y, w, h, type = 'rock', allowOverlap = false) => {
    const rock = { id: `${level.id}-rock-${world.obstacles.length}`, x: rounded(x), y: rounded(y), w: rounded(w), h: rounded(h), type, seed: Math.floor(random() * 10000) };
    if (y + h / 2 > 113 || reserved.some(zone => intersects(rock, zone, 1.8))) return false;
    if (!allowOverlap && world.obstacles.some(other => intersects(rock, other, 2))) return false;
    world.obstacles.push(rock);
    return true;
  };

  // Low, uneven seabed: no map-wide rectangles that could sever a route.
  for (let x = 0; x < world.width; x += 23) {
    const h = range(8, 15);
    addObstacle(x + 11.5, h / 2 - 1, 24, h, index === 0 ? 'coral' : 'rock', true);
  }

  if (index === 0) {
    // Open reef: scattered, rounded coral heads and two generous swim-throughs.
    [[40, 38, 29, 17], [87, 60, 25, 17], [114, 36, 20, 19], [169, 69, 33, 19], [205, 102, 29, 13], [216, 51, 19, 19]]
      .forEach(([x, y, w, h]) => addObstacle(x + range(-7, 7), y + range(-6, 6), w + range(-4, 5), h + range(-3, 4), 'coral'));
  } else if (index === 1) {
    // Kelp bay: taller, separated rock ribs support vertical plant gardens.
    [[42, 29, 19, 33], [82, 48, 18, 38], [108, 57, 20, 34], [162, 34, 17, 42], [199, 79, 19, 39], [238, 58, 16, 31]]
      .forEach(([x, y, w, h]) => addObstacle(x + range(-6, 6), y + range(-7, 7), w + range(-3, 4), h + range(-6, 6)));
  } else if (index === 2) {
    // Blue-hole overhangs alternate with floor pillars; the descending spine
    // and the space around each air station always remain broad and passable.
    [[53, 48, 30, 28], [89, 104, 38, 16], [111, 65, 29, 24], [146, 101, 28, 20], [169, 25, 24, 29], [205, 76, 36, 21], [231, 102, 27, 15]]
      .forEach(([x, y, w, h]) => addObstacle(x + range(-5, 5), y + range(-4, 4), w + range(-4, 5), h + range(-3, 4)));
  } else if (index === 3) {
    // Former tidal market: broad stone terraces, columns, and garden courtyards.
    [[40, 27, 43, 13], [94, 42, 34, 13], [126, 88, 34, 10], [174, 24, 42, 14], [211, 72, 31, 11], [232, 102, 27, 10]]
      .forEach(([x, y, w, h]) => addObstacle(x + range(-3, 3), y + range(-3, 3), w, h, 'terrace'));
    [[50, 47, 8, 30], [92, 84, 9, 32], [177, 79, 9, 36], [219, 50, 8, 28]]
      .forEach(([x, y, w, h]) => addObstacle(x, y, w, h, 'column'));
  } else {
    // Deep garden: narrow warm-water chimneys and wide luminous sand basins.
    [[38, 38, 15, 42], [93, 50, 18, 55], [124, 24, 23, 30], [180, 79, 19, 42], [205, 23, 20, 35], [241, 61, 14, 33]]
      .forEach(([x, y, w, h]) => addObstacle(x + range(-4, 4), y + range(-3, 3), w + range(-2, 2), h, 'vent'));
    [[63, 103, 30, 11], [127, 96, 25, 10], [212, 97, 33, 11]]
      .forEach(([x, y, w, h]) => addObstacle(x, y, w, h, 'overhang'));
  }

  // Secondary rock arrangements vary the silhouette and optional approaches.
  const target = [29, 30, 32, 30, 31][index];
  for (let attempt = 0; attempt < 180 && world.obstacles.length < target; attempt++) {
    addObstacle(range(26, 248), range(20, 106), range(8, index === 2 ? 24 : 20), range(7, index === 1 ? 25 : 19), index === 0 && random() < 0.6 ? 'coral' : 'rock');
  }

  const inRock = (x, y, padding = 2) => world.obstacles.some(rock => Math.abs(x - rock.x) < rock.w / 2 + padding && Math.abs(y - rock.y) < rock.h / 2 + padding);

  // Rare corner pockets can be formed by touching random shapes. Remove only
  // the secondary rocks responsible until all intended discoveries are reachable.
  let connectivity = validateWorld(world);
  let repairs = 0;
  while (!connectivity.valid && world.obstacles.length > 10 && repairs < 24) {
    world.obstacles.pop();
    repairs++;
    connectivity = validateWorld(world);
  }

  // Plants grow on real rock tops, avoiding hovering vegetation. Surface
  // details share the same seed but do not affect swimming collisions.
  world.obstacles.forEach(rock => {
    const count = Math.max(2, Math.floor(rock.w / 3));
    for (let i = 0; i < count; i++) {
      world.decor.push({
        type: index === 1 ? (random() < 0.8 ? 'kelp' : 'grass') : index === 0 ? pick(['coral', 'coral', 'anemone', 'grass']) : index === 3 ? pick(['coral', 'grass', 'anemone', 'shell']) : pick(['grass', 'anemone', 'coral']),
        x: rounded(rock.x + range(-rock.w * 0.43, rock.w * 0.43)),
        y: rounded(rock.y + rock.h / 2), scale: rounded(index === 1 ? range(1.0, 2.7) : range(0.6, 1.7)),
        color: index === 0 ? pick(['#f09f90', '#edc77f', '#97cdac', '#c29ec8']) : index === 1 ? pick(['#6aab80', '#8dc385', '#a6ca7c']) : index === 3 ? pick(['#d5c69b', '#a8c4ac', '#d9aba5']) : index === 4 ? pick(['#b5a4df', '#8fcdd0', '#d6b0d2']) : pick(['#789fbd', '#a394b6', '#c696ac']),
        rotation: range(-0.18, 0.18), seed: Math.floor(random() * 10000),
      });
    }
  });
  for (let i = 0; i < 45; i++) {
    const x = range(10, 250), y = range(14, 112);
    if (!inRock(x, y, 0.8)) world.decor.push({ type: 'bubble', x: rounded(x), y: rounded(y), scale: range(0.3, 1), color: '#dcf5ec', rotation: 0, seed: i });
  }

  const available = SPECIES.filter(species => species.habitat.includes(level.biome) && !species.danger && species.seasonalWeights[season] > 0);
  const seasonalWeight = species => species.rarity * species.seasonalWeights[season];
  const chooseSpecies = () => {
    let weight = random() * available.reduce((sum, species) => sum + seasonalWeight(species), 0);
    for (const species of available) {
      weight -= seasonalWeight(species);
      if (weight <= 0) return species;
    }
    return available[available.length - 1];
  };
  const freePosition = (preferred = null) => {
    for (let attempt = 0; attempt < 140; attempt++) {
      const x = preferred && attempt < 40 ? clamp(preferred.x + range(-12, 12), 16, 248) : range(22, 248);
      const y = preferred && attempt < 40 ? clamp(preferred.y + range(-9, 9), 14, 109) : range(17, 109);
      if (!inRock(x, y, 3.5)) return { x: rounded(x), y: rounded(y) };
    }
    return { x: 35, y: 116 };
  };
  const addFish = (species, point, schoolId = null) => {
    const sizeFactor = rounded(range(0.7, 1.6));
    world.fish.push({
      id: `${level.id}-fish-${world.fish.length}`, species: species.id,
      x: point.x, y: point.y, homeX: point.x, homeY: point.y,
      size: rounded(species.size * sizeFactor), sizeFactor,
      weightKg: Math.max(0.01, rounded(species.baseWeightKg * sizeFactor ** 3)),
      sizeLabel: sizeFactor < 0.9 ? '小' : sizeFactor < 1.18 ? '标准' : sizeFactor < 1.42 ? '大' : '巨', color: species.color,
      alive: true, speed: species.speed, value: species.value, behavior: species.behavior,
      danger: species.danger, name: species.name, schoolId, phase: range(0, Math.PI * 2),
    });
  };

  // A few easy catches near entry make the objective robust to random seeds.
  for (let i = 0; i < 5; i++) addFish(available.find(s => s.id === 'sardine') || available[0], freePosition({ x: 35 + i * 6, y: 97 }), 'entry-school');
  for (let school = 0; school < 5; school++) {
    const species = chooseSpecies();
    const center = freePosition({ x: 42 + school * 40, y: 95 - school * 14 });
    const schoolSize = species.behavior === 'school' ? 4 : 2;
    for (let i = 0; i < schoolSize; i++) addFish(species, freePosition(center), `school-${school}`);
  }
  // Guarantee the three-species meal objective independently of weighted rolls.
  // These are real fish spawned in open water, not credited task progress.
  for (const species of available.slice(0, 3)) {
    if (!world.fish.some(fish => fish.species === species.id)) addFish(species, freePosition());
  }
  while (world.fish.length < [38, 40, 39, 42, 42][index]) addFish(chooseSpecies(), freePosition());

  // Hazards live off the main spine and never camp on oxygen or story nodes.
  const dangerSpecies = SPECIES.filter(species => species.habitat.includes(level.biome) && species.danger > 0);
  for (let i = 0; i < (index === 2 ? 3 : 2); i++) {
    const species = pick(dangerSpecies);
    for (let attempt = 0; attempt < 100; attempt++) {
      const point = freePosition({ x: range(100, 241), y: range(25, 71) });
      if (world.nodes.every(node => Math.hypot(node.x - point.x, node.y - point.y) > 16) && point.x > 80) {
        addFish(species, point);
        break;
      }
    }
  }
  world.validation = { valid: connectivity.valid, repairedRocks: repairs };
  return world;
}

/** Flood-fill checks swimmer clearance, not merely point-to-point sight lines. */
export function validateWorld(world, swimmerRadius = 2) {
  const spacing = 2;
  const columns = Math.floor(world.width / spacing) + 1;
  const rows = Math.floor(world.height / spacing) + 1;
  const blocked = new Uint8Array(columns * rows);
  const visited = new Uint8Array(columns * rows);
  const cellId = (x, y) => clamp(Math.round(y / spacing), 0, rows - 1) * columns + clamp(Math.round(x / spacing), 0, columns - 1);
  for (let iy = 0; iy < rows; iy++) {
    for (let ix = 0; ix < columns; ix++) {
      const x = ix * spacing, y = iy * spacing;
      if (x < swimmerRadius || x > world.width - swimmerRadius || y < swimmerRadius || y > world.height - swimmerRadius || world.obstacles.some(rock => Math.abs(x - rock.x) < rock.w / 2 + swimmerRadius && Math.abs(y - rock.y) < rock.h / 2 + swimmerRadius)) blocked[iy * columns + ix] = 1;
    }
  }
  const start = cellId(world.start.x, world.start.y);
  const queue = new Int32Array(columns * rows);
  let head = 0, tail = 0;
  if (!blocked[start]) { queue[tail++] = start; visited[start] = 1; }
  while (head < tail) {
    const current = queue[head++];
    const x = current % columns;
    const candidates = [];
    if (x > 0) candidates.push(current - 1);
    if (x + 1 < columns) candidates.push(current + 1);
    if (current >= columns) candidates.push(current - columns);
    if (current + columns < visited.length) candidates.push(current + columns);
    for (const next of candidates) if (!blocked[next] && !visited[next]) { visited[next] = 1; queue[tail++] = next; }
  }
  const unreachable = world.nodes.filter(node => !visited[cellId(node.x, node.y)]).map(node => node.id);
  return { valid: !blocked[start] && unreachable.length === 0, unreachable, accessibleCells: tail, totalCells: columns * rows };
}
