/* Shared presentation helpers. These never read or modify gameplay state. */
export const ITEM_ART = Object.freeze({oxygen:0,fin:1,bag:2,harpoon:3,sardine:4,clownfish:5,blue_tang:6,mackerel:7,horse_mackerel:7,eel:8,moray:8,lionfish:9,grouper:10,shrimp:11,soup:12,grilled:13,rice:14,tea:15,butterflyfish:16,parrotfish:17,wrasse:18,cuttlefish:19,soldierfish:20,squirrelfish:21});
export function artIcon(index=4,extra='') {
  if(Number(index)>=22){const cell=Math.max(0,Math.min(19,Number(index)-22));return `<span class="art-icon species-new-art ${extra}" data-icon="${index}" aria-hidden="true" style="--item-x:${cell%5*25}%;--item-y:${Math.floor(cell/5)*100/3}%"></span>`;}
  const n=Math.max(0,Math.min(21,Number(index)||0)),species=n>=16,cell=species?n-16:n;
  const x=species?(cell%3)*50:(cell%4)*100/3,y=species?Math.floor(cell/3)*100:Math.floor(cell/4)*100/3;
  return `<span class="art-icon ${species?'species-art ':''}${extra}" data-icon="${n}" aria-hidden="true" style="--item-x:${x}%;--item-y:${y}%"></span>`;
}
export function fishArt(species) {
  const fresh=["sun_goby", "goatfish", "damselfish", "seabream", "anchovy", "greenling", "mullet", "glass_shrimp", "lanternfish", "spotted_octopus", "red_snapper", "tilefish", "mosaic_wrasse", "ribbon_eel", "moonfish", "silver_cod", "velvet_octopus", "lantern_shrimp", "snow_crab", "frilled_eel"];const idx=fresh.indexOf(species);return idx>=0?22+idx:ITEM_ART[species]??4;
}
export const CHARACTERS=Object.freeze({
  xiaxia:{name:'小夏',role:'把海的颜色画在碗上'},su:{name:'苏婆婆',role:'随换潮靠岸的漂泊行商'},
  ahe:{name:'阿禾',role:'小馆主厨 · 把日子煮热一点'},
  xi:{name:'汐',role:'今天的潜水员 · 明天的常客'},
  zhou:{name:'周叔',role:'蓝湾的老渔民 · 认得每一种潮声'},
  guest:{name:'夜航客',role:'总在海雾散去前离开'}
});
export function portrait(name='ahe',extra='') {
  const key=CHARACTERS[name]?name:'ahe';
  if(key==='xiaxia'||key==='su')return `<div class="portrait portrait-new ${extra}" style="background-position:${key==='xiaxia'?100/3:100}% ${key==='xiaxia'?0:100}%" role="img" aria-label="${CHARACTERS[key].name}的插画立绘"></div>`;
  return `<div class="portrait portrait-${key} ${extra}" role="img" aria-label="${CHARACTERS[key].name}的插画立绘"></div>`;
}
export function characterRail(name='ahe') {
  const key=CHARACTERS[name]?name:'ahe',c=CHARACTERS[key];
  return `<aside class="character-rail"><div class="character-tag">蓝湾 · 人物手记</div>${portrait(key)}<div class="character-name">${c.name}</div><p class="character-role">${c.role}</p><div class="character-stamp">BLUE BAY<br><span>在海风里，慢慢熟悉。</span></div></aside>`;
}
export function decorateModal(root,mode) {
  for(const b of root.querySelectorAll('[data-choice],[data-upgrade],[data-story],[data-release]')){
    let icon;
    if(b.hasAttribute('data-choice'))icon={balanced:2,oxygen:0,fins:1}[b.dataset.choice];
    else if(b.hasAttribute('data-upgrade'))icon={oxygen:0,bag:2,fin:1}[b.dataset.upgrade];
    else if(b.hasAttribute('data-story'))icon=b.dataset.story==='observe'?15:2;
    else if(b.hasAttribute('data-release'))continue;
    if(icon!==undefined){b.classList.add('illustrated-choice');b.insertAdjacentHTML('afterbegin',artIcon(icon));}
  }
  if(mode==='brief')root.querySelectorAll('.step').forEach((step,index)=>step.insertAdjacentHTML('afterbegin',artIcon([3,2,13][index]||0,'step-art')));
  root.querySelector('.panel')?.setAttribute('data-scene',mode);
}
