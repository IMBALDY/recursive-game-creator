import {BUILDINGS,buildingCost} from './progression.js';
export const SHOP_ITEMS = [
 {id:'air',name:'潮息瓶',icon:0,cost:28,description:'下潜时按 1：补充 45 氧气，用完消耗一瓶。'},
 {id:'salve',name:'海草药膏',icon:15,cost:22,description:'下潜时按 2：恢复 35 生命，用完消耗一份。'},
 {id:'beacon',name:'回声灯',icon:3,cost:35,description:'下潜时按 3：立即扫描全图，并重置声呐冷却。'}
];
export function buyBuilding(progress,id){const def=BUILDINGS.find(b=>b.id===id),cost=buildingCost(progress,id);if(!def||cost===null||progress.credits<cost)return null;progress.credits-=cost;progress.buildings[id]++;return {id,cost,level:progress.buildings[id],effect:def.effects[progress.buildings[id]-1]};}
export function buySupply(progress,id){const item=SHOP_ITEMS.find(i=>i.id===id);if(!item||progress.credits<item.cost||(progress.stock[id]||0)>=9)return null;progress.credits-=item.cost;progress.stock[id]=(progress.stock[id]||0)+1;return item;}
export function useSupply(progress,id,player,maxOxygen){if(!(progress.stock[id]>0))return false;if(id==='air'){if(player.oxygen>=maxOxygen)return false;player.oxygen=Math.min(maxOxygen,player.oxygen+45);}else if(id==='salve'){if(player.health>=100)return false;player.health=Math.min(100,player.health+35);}else if(id!=='beacon')return false;progress.stock[id]--;return true;}
export function harborStage(progress){const total=Object.values(progress.buildings).reduce((a,b)=>a+b,0);return total>=6?'port-full':total>=1?'port-grown':'port';}
export function grantMastery(progress,species,catchKey){progress.masteryCatches??=[];if(progress.masteryCatches.includes(catchKey))return false;progress.masteryCatches.push(catchKey);progress.mastery[species]=(progress.mastery[species]||0)+1;return true;}
