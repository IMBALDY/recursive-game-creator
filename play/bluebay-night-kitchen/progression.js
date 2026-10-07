/** Pure, save-compatible progression rules shared by the harbor and kitchen. */
export const SEASONS = Object.freeze([
  { id: 'spring', name: '花潮季', description: '嫩海菜随暖流醒来，竹荚鱼与桃花鳚格外活跃。', color: '#a9d9b3' },
  { id: 'summer', name: '长日季', description: '阳光照进珊瑚台地，金色鱼群沿暖水迁来。', color: '#edcc7c' },
  { id: 'autumn', name: '丰浪季', description: '海草结籽，肥美的鱼群经过蓝湾；正适合练一道拿手菜。', color: '#e9aa7f' },
  { id: 'winter', name: '静灯季', description: '水色澄清，深水鱼更常到访，热汤与窗边的灯最受欢迎。', color: '#a9cfe6' },
]);
const count = (value, max = Number.MAX_SAFE_INTEGER) => Math.max(0, Math.min(max, Math.floor(Number(value) || 0)));
const finite = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const record = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};

/** A season lasts three completed evenings; day one starts in spring. */
export function seasonForDay(day = 1) { return Math.floor(Math.max(0, count(day) - 1) / 3) % SEASONS.length; }

export const BUILDINGS = Object.freeze([
  { id: 'kitchen', name: '扩建厨房', costs: [80, 180, 320], description: '从一口小锅到有准备台的海风厨房。每级让每份料理售价提高 8%。', effects: ['添置备料台 · 菜价 +8%', '双灶海风厨房 · 菜价 +16%', '主厨工作间 · 菜价 +24%'] },
  { id: 'dock', name: '修建码头', costs: [80, 180, 320], description: '铺稳栈桥、安好补给架。每级增加 2 格鱼篓与 8 点氧气上限。', effects: ['木栈桥与补给篮 · 鱼篓 +2 / 氧气 +8', '潮汐补给架 · 鱼篓 +4 / 氧气 +16', '完整潜水码头 · 鱼篓 +6 / 氧气 +24'] },
  { id: 'dining', name: '扩建餐厅', costs: [80, 180, 320], description: '添桌椅、挂灯串，让客人舒服地多坐一会儿。每级让客人的等待耐心增加 3 秒。', effects: ['靠海双人桌 · 客人耐心 +3 秒', '暖灯长桌 · 客人耐心 +6 秒', '月下露台 · 客人耐心 +9 秒'] },
]);

export function buildingCost(progress, id) {
  const building = BUILDINGS.find(item => item.id === id);
  if (!building) return null;
  const level = count(record(progress?.buildings)[id], building.costs.length);
  return building.costs[level] ?? null;
}

export function recipeTier(caughtCount = 0) {
  const caught = count(caughtCount);
  if (caught >= 12) return { level: 2, title: '传奇料理', multiplier: 1.9, threshold: 12, nextAt: null };
  if (caught >= 5) return { level: 1, title: '拿手料理', multiplier: 1.35, threshold: 5, nextAt: 12 };
  return { level: 0, title: '家常料理', multiplier: 1, threshold: 0, nextAt: 5 };
}

export function fishPrice(item = {}, baseValue = item?.value ?? 8, caughtCount = 0, kitchenLevel = 0) {
  const base = Math.max(0, Math.min(10000, finite(baseValue, 8)));
  const size = Math.max(0.6, Math.min(1.8, finite(item?.sizeFactor, 1)));
  const cooking = 1 + count(kitchenLevel, 3) * 0.08;
  return Math.max(0, Math.round(base * size * recipeTier(caughtCount).multiplier * cooking));
}

/** Copy rather than mutate imported saves. Unrecognized fields survive upgrades. */
export function ensureProgress(progress = {}) {
  const source = record(progress);
  const buildings = Object.fromEntries(BUILDINGS.map(({ id }) => [id, count(record(source.buildings)[id], 3)]));
  const sanitizeCounts = value => Object.fromEntries(Object.entries(record(value)).filter(([key]) => !['__proto__', 'prototype', 'constructor'].includes(key)).map(([key, amount]) => [key, count(amount, 1000000)]));
  const strings = value => [...new Set((Array.isArray(value) ? value : []).filter(item => typeof item === 'string'))];
  return {
    ...source, day: Math.max(1, count(source.day)), buildings,
    mastery: sanitizeCounts(source.mastery ?? source.collection),
    relationships: sanitizeCounts(source.relationships),
    seenScenes: strings(source.seenScenes), giantsSeen: strings(source.giantsSeen),
    relics: count(source.relics),
    stock: sanitizeCounts(source.stock),
    stockItems: Array.isArray(source.stockItems) ? source.stockItems.map(item => item && typeof item === 'object' ? { ...item } : item) : [],
  };
}
