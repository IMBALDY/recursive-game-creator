'use strict';
(() => {
const G=WB,$=G.$;
G.mapMarkup=()=>`<div class="journey-map">${G.regions.map((r,act)=>`<div class="map-act ${act===G.act?'current':''}"><small>${['I','II','III','IV','V'][act]}</small><h3>${r.name}</h3><div class="map-nodes">${['Old Road','Forge','Onward','Crossroads','Guardian','Rest','Wild Spirit'].map((name,stage)=>`<div class="map-node ${G.route.some(v=>v.act===act&&v.stage===stage)?'visited':''} ${act===G.act&&stage===G.stage?'here':''}"><i>◇</i><span>${name}</span></div>`).join('')}</div></div>`).join('')}</div>`;
G.uiRoute=options=>{G.offer('Follow the Lanterns','',options,c=>G.enterRoom(c.id),'room_route');$('#modal').insertAdjacentHTML('afterbegin',G.mapMarkup());$('#modal').classList.add('route-modal');};
G.showMap=()=>{if(!['running','paused'].includes(G.state))return;const old=G.state;G.state='map';G.event('map_opened');G.modal(`<h2>Homeward Path</h2>${G.mapMarkup()}<button class="primary" id="backMap">Close Map</button>`,'wide');$('#backMap').onclick=()=>{G.hideModal();if(old==='paused')G.pause();else G.state='running';};};
$('#mapBtn').onclick=G.showMap;
const hud=G.updateHud;G.updateHud=()=>{hud();if(!G.p||G.state==='home')return;$('#roomClock').textContent=G.roomType==='boss'?'':G.roomType==='camp'?'A Lantern Still Burns':['battle','elite'].includes(G.roomType)?G.roomTime<G.roomTarget?'Defeat the Enemies':'Clear Remaining Enemies':'';$('#runStamp').textContent='';if(G.roomType==='camp'){$('#roomName').textContent='Stillwind Garden';if(G.interactable)$('#interactHint').textContent='E · Rest';}};
})();
