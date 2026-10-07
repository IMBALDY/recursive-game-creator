'use strict';
(() => {
const G=WB;
G.artDirection={actors:'2d',effects:'2d',environment:'painted-backdrop-and-3d-props',doors:'painted-shrine-gates'};
G.modelFor=()=>null;
G.drawActorAttributes=ctx=>{
 ctx.save();ctx.font='12px WhitebirdSans';ctx.textAlign='center';
 for(const e of G.enemies){if(e.dead)continue;const attr=G.affinities[G.affinityFor(e)],height=e.boss?(e.phaseForm==='beast'||e.kind==='ibuki_heaven'?295:235):e.kind==='kodama'?86:104;ctx.fillStyle=attr.color;ctx.fillText(attr.name,e.x,e.y-height-8);}
 ctx.restore();
};
G.beastSprites={};G.paintedFx=[];G.gateArt=null;
const load=src=>new Promise(resolve=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>resolve(null);im.src=src;});
G.artReady=Promise.all([load('assets/godbeasts_2d_v51.png'),load('assets/shrine_gate_v51.png')]).then(([atlas,gate])=>{
 G.gateArt=gate;
 if(atlas)for(const [row,id] of ['aragami','sea','ibuki_heaven'].entries()){
  G.beastSprites[id]=[];
  for(let col=0;col<4;col++){
   const w=Math.floor(atlas.width/4),h=Math.floor(atlas.height/3),c=document.createElement('canvas');c.width=w;c.height=h;
   const cx=c.getContext('2d',{willReadFrequently:true});cx.drawImage(atlas,col*w,row*h,w,h,0,0,w,h);
   const pixels=cx.getImageData(0,0,w,h).data;let x0=w,y0=h,x1=0,y1=0;
   for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(pixels[(y*w+x)*4+3]>45){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
   const trimmed=document.createElement('canvas');trimmed.width=x1-x0+1;trimmed.height=y1-y0+1;trimmed.getContext('2d').drawImage(c,x0,y0,trimmed.width,trimmed.height,0,0,trimmed.width,trimmed.height);G.beastSprites[id].push(trimmed);
  }
 }
 G.artDirection.ready=!!atlas&&!!gate;
});
// Compatibility entry point used by combat code; effects are now exclusively Canvas 2D.
G.fx3d=(kind,x,y,a=0,strength=1)=>{G.paintedFx.push({kind,x,y,a,strength,start:G.time,duration:kind==='ultimate'?1.5:kind==='wave'?1.05:.65});if(G.paintedFx.length>28)G.paintedFx.shift();};
G.drawPaintedFx=ctx=>{
 G.paintedFx=G.paintedFx.filter(f=>G.time>=f.start&&G.time-f.start<f.duration);
 for(const f of G.paintedFx){
  const t=(G.time-f.start)/f.duration,s=f.strength,fade=Math.sin(Math.PI*Math.min(.98,t+.1));
  ctx.save();ctx.globalAlpha=fade*.65;ctx.translate(f.x,f.y);ctx.rotate(f.a);ctx.lineCap='round';
  const color=f.kind==='bloodSlash'?'#ae3248':f.kind==='fire'?'#dcb174':f.kind==='ultimate'?'#ead298':'#97d4ca';
  if(f.kind==='wave'||f.kind==='orb'){
   const frames=G.motion.anim_fx_water,im=frames?.[Math.min(3,Math.floor(t*4))],size=(f.kind==='wave'?185:110)*Math.min(s,2);
   ctx.translate(t*450,0);if(im){ctx.rotate(-Math.PI/2);ctx.drawImage(im,-size/2,-size*.55,size,size*.9);}
   ctx.strokeStyle='#dce9d2';ctx.lineWidth=1.4;for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(-35-i*15,-65);ctx.bezierCurveTo(20,-30,20,30,-35-i*15,65);ctx.stroke();}
  }else if(f.kind==='slash'||f.kind==='bloodSlash'){
   ctx.strokeStyle=color;ctx.lineWidth=15*(1-t)+1;ctx.beginPath();ctx.ellipse(0,0,90+t*65,55+t*30,0,-1.2,1.2);ctx.stroke();ctx.strokeStyle='#f0e4c5';ctx.lineWidth=2;ctx.stroke();
   for(let i=0;i<5;i++){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(65+t*(100+i*8),i*12-24,8*(1-t),2,0,0,Math.PI*2);ctx.fill();}
  }else if(f.kind==='thunder'){
   ctx.rotate(-f.a);ctx.strokeStyle='#b6bad8';ctx.lineWidth=6*(1-t)+1;
   for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(i*35,-190);ctx.lineTo(i*20+16,-110);ctx.lineTo(i*25-18,-65);ctx.lineTo(i*35,0);ctx.stroke();}ctx.strokeStyle='#e7dec1';ctx.lineWidth=1.5;ctx.stroke();
  }else if(f.kind==='feather'){
   for(let i=0;i<9;i++){const a=i*Math.PI*2/9,r=40+t*130;ctx.save();ctx.translate(Math.cos(a)*r,Math.sin(a)*r*.55);ctx.rotate(a);ctx.fillStyle='#eee7cd';ctx.beginPath();ctx.moveTo(-15,0);ctx.quadraticCurveTo(0,-9,27,0);ctx.quadraticCurveTo(6,6,-15,0);ctx.fill();ctx.strokeStyle='#9d956f';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(-16,0);ctx.lineTo(22,0);ctx.stroke();ctx.restore();}
  }else{
   ctx.strokeStyle=color;ctx.lineWidth=f.kind==='ultimate'?5:2;
   const r=(f.kind==='ultimate'?120+t*460:40+t*125)*Math.min(s,1.4);
   for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(0,0,r-i*12,(r-i*12)*.52,.02*i,.08+i,Math.PI*1.85+i);ctx.stroke();}
   if(f.kind==='ultimate'){ctx.rotate(-f.a);ctx.fillStyle='#f2e4b5';ctx.beginPath();ctx.moveTo(-9,0);ctx.lineTo(-2,-620);ctx.lineTo(9,0);ctx.closePath();ctx.fill();}
  }
  ctx.restore();
 }
};

// Move each trigger onto the visible stone threshold; entrance points remain inside the room.
Object.assign(G.directions.find(d=>d.id==='up'),{y:250,entry:[720,670]});
Object.assign(G.directions.find(d=>d.id==='down'),{y:742,entry:[720,330]});
Object.assign(G.directions.find(d=>d.id==='left'),{x:120,entry:[1230,480]});
Object.assign(G.directions.find(d=>d.id==='right'),{x:1320,entry:[210,480]});
G.doorState=target=>{
 const map=G.chapterMaps[G.act],combat=Object.values(map.nodes).filter(n=>n.cleared&&['battle','elite'].includes(n.type)).length;
 if(!G.currentNode.cleared)return 'sealed';
 if(target.type==='boss'&&(combat<3||map.ante&&!map.nodes[map.ante].cleared))return 'warded';
 return 'open';
};
G.drawDoors=ctx=>{
 const node=G.currentNode,map=G.chapterMaps?.[G.act];if(!node||!map)return;
 for(const link of node.links){
  const door=G.directions.find(d=>d.id===link.dir),target=map.nodes[link.to],state=G.doorState(target),open=state==='open',near=G.distance(G.p,door)<155;
  const height=link.dir==='up'?162:link.dir==='down'?156:178,width=height*.82,x=door.x,y=door.y+25;
  ctx.save();ctx.translate(x,y);ctx.globalAlpha=link.dir==='down'&&!near?.72:1;
  const glow=ctx.createRadialGradient(0,-18,3,0,-18,93);glow.addColorStop(0,open?'#b5e1c432':'#923c3614');glow.addColorStop(1,'#061e2600');ctx.fillStyle=glow;ctx.fillRect(-95,-105,190,160);
  ctx.fillStyle='#06121980';ctx.beginPath();ctx.ellipse(0,3,width*.53,13,0,0,Math.PI*2);ctx.fill();
  // An ink-dark recess gives the opening depth without a bright UI ring.
  ctx.fillStyle=open?'#08232ab0':'#101b26df';ctx.fillRect(-width*.20,-height*.60,width*.40,height*.41);
  if(G.gateArt)ctx.drawImage(G.gateArt,-width/2,-height,width,height);
  if(!open){
   ctx.strokeStyle=state==='warded'?'#b59b6c':'#9c624d';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-width*.23,-height*.45);ctx.quadraticCurveTo(0,-height*.33,width*.23,-height*.45);ctx.stroke();
   for(const [i,angle] of [[-1,-.22],[0,.06],[1,.19]]){
    ctx.save();ctx.translate(i*width*.14,-height*(i===0?.42:.44));ctx.rotate(angle);ctx.fillStyle='#c9bc99';ctx.fillRect(-5,0,10,25);ctx.strokeStyle='#823e35';ctx.lineWidth=1.2;
    ctx.beginPath();ctx.moveTo(0,4);ctx.lineTo(0,19);ctx.moveTo(-3,8);ctx.lineTo(3,8);ctx.moveTo(-2,12);ctx.lineTo(3,15);ctx.stroke();ctx.restore();
   }
  }else{
   ctx.strokeStyle='#b9cdb270';ctx.lineWidth=1;for(let i=0;i<3;i++){const yy=-17+i*6;ctx.beginPath();ctx.moveTo(-17-i*3,yy);ctx.lineTo(17+i*3,yy);ctx.stroke();}
  }
  const roomColor={boss:'#b77b70',ante:'#b8a1cc',forge:'#d8b17b',shop:'#d6c17f',blessing:'#a7cbb5',treasure:'#d9c17b'}[target.type]||'#c4c6b3';
  // Small hanging placards identify the destination; explanatory text appears only nearby.
  const labelY=link.dir==='up'?20:-height-22;
  ctx.fillStyle='#14272de8';ctx.strokeStyle='#927d54';ctx.lineWidth=1;ctx.fillRect(-35,labelY,70,20);ctx.strokeRect(-35,labelY,70,20);ctx.textAlign='center';ctx.font='12px WhitebirdSans';ctx.fillStyle=roomColor;ctx.fillText((G.r2NodeName?.(target)||G.roomNames[target.type]),0,labelY+14);
  if(near){ctx.font='13px WhitebirdSans';ctx.fillStyle='#ecdec1';ctx.shadowColor='#07151b';ctx.shadowBlur=5;ctx.fillText(open?'Enter':state==='warded'?'Defeat the boss to open':'Clear the room to open',0,link.dir==='up'?58:25);}
  ctx.restore();
 }
};
})();
