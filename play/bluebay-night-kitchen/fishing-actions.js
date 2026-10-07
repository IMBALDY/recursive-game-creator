/** Presentation state for the normal fishery. Catch/economy rules remain in game.js. */
export const ACTION_NAMES = {swim:'游动',aim:'抬臂瞄准',shoot:'发射与后坐',recoil:'发射与后坐',reel:'收线拉拽',catch:'收获入篓',hurt:'受击缓冲',dodge:'翻滚闪避',recover:'整理鱼叉'};
export function beginFishingAction(player, target, kind='catch') {
  player.caughtFishId=null;player.caughtSpecies=null;
  player.aimX = player.targetX = target?.x ?? player.x + (player.facing || 1) * 8;
  player.aimY = player.targetY = target?.y ?? player.y;
  player.actionQueue = kind === 'catch'
    ? [['aim',.16],['shoot',.22],['reel',.62],['catch',.35]]
    : [['aim',.16],['shoot',.22],['recover',.35]];
  nextAction(player);
}
function nextAction(player) {
  const next = player.actionQueue?.shift();
  player.action = next?.[0] || 'swim';
  player.actionTime = 0;
  player.actionDuration = next?.[1] || 1;
  if(!next){player.charge=0;player.caughtFishId=null;player.caughtSpecies=null;}
}
export function advanceFishingAction(player, dt) {
  if(!Number.isFinite(dt) || dt <= 0) return;
  player.actionTime = (player.actionTime || 0) + dt;
  if(player.action && player.action !== 'swim' && player.actionTime >= player.actionDuration) nextAction(player);
}
export function flinchPlayer(player) {
  player.actionQueue = [['hurt',.32],['recover',.28]];
  nextAction(player);
}
export function practiceAction(player, action) {
  if(!(action in ACTION_NAMES)) return false;
  player.aimX = player.targetX = player.x + 8;
  player.aimY = player.targetY = player.y + 1;
  player.actionQueue=[];
  player.action=action;
  player.actionTime=0;
  player.actionDuration={aim:2.5,shoot:.8,recoil:.8,reel:2.5,catch:1.5,hurt:.8,dodge:.85,recover:1}[action] || 1;
  player.charge=action==='aim' ? .85 : 0;
  return true;
}
