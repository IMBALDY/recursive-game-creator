import * as THREE from 'three';
import {GLTFLoader} from './vendor/examples/jsm/loaders/GLTFLoader.js';
import {DRACOLoader} from './vendor/examples/jsm/loaders/DRACOLoader.js';

// The 3D layer contains scenery only. Actors and every combat effect are painted in 2D.
const G=window.WB;
G.hybrid={ready:false,models:[],errors:[],renderer:'webgl-scenery',actorMode:'2d',effectMode:'2d'};
G.modelFor=()=>null;
let renderer;
try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});}catch(e){G.hybrid.errors.push(String(e));G.hybrid.ready=true;}
if(renderer){
 renderer.setSize(1440,900,false);renderer.setPixelRatio(1);renderer.setClearColor(0,0);
 renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.85;
 const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-720,720,450,-450,.1,5000);
 camera.position.set(0,1500,1500);camera.lookAt(0,0,0);
 scene.add(new THREE.HemisphereLight(0xb4c6be,0x132e39,2.1));
 const sun=new THREE.DirectionalLight(0xe1cda0,2);sun.position.set(-450,1000,500);scene.add(sun);
 const props=new THREE.Group();scene.add(props);
 const point=(x,y,z=0)=>new THREE.Vector3(x-720,z,(y-450)*Math.SQRT2);
 const stone=new THREE.MeshStandardMaterial({color:0x4b6663,roughness:1,flatShading:true});
 const moss=new THREE.MeshStandardMaterial({color:0x506147,roughness:1,flatShading:true});
 const wood=new THREE.MeshStandardMaterial({color:0x542f27,roughness:1});
 const lacquer=new THREE.MeshStandardMaterial({color:0x253b42,roughness:.9});
 const bronze=new THREE.MeshStandardMaterial({color:0x9c8650,roughness:.8,metalness:.18});
 const dark=new THREE.MeshStandardMaterial({color:0x081b21,roughness:1});
 const shadeMaterial=new THREE.MeshBasicMaterial({color:0x07191e,transparent:true,opacity:.32,depthWrite:false});
 const boxGeo=new THREE.BoxGeometry(1,1,1),shadowGeo=new THREE.CircleGeometry(1,32),rockGeo=new THREE.IcosahedronGeometry(1,0);
 const panelCanvas=document.createElement('canvas');panelCanvas.width=512;panelCanvas.height=256;
 const paint=panelCanvas.getContext('2d');paint.fillStyle='#233a3d';paint.fillRect(0,0,512,256);
 for(let i=0;i<90;i++){paint.strokeStyle=i%2?'#b8b29512':'#07171d28';paint.lineWidth=i%4+1;paint.beginPath();paint.moveTo(0,i*3);paint.bezierCurveTo(160,i*3-2,330,i*3+3,512,i*3);paint.stroke();}
 paint.strokeStyle='#bca570';paint.lineWidth=3;paint.strokeRect(18,18,476,220);paint.lineWidth=1;paint.strokeRect(26,26,460,204);
 for(let i=0;i<5;i++){paint.save();paint.translate(65+i*96,130+(i%2?20:-20));paint.strokeStyle='#a99b688a';paint.lineWidth=2;for(let j=0;j<3;j++){paint.beginPath();paint.moveTo(-35,15+j*7);paint.bezierCurveTo(-35,-28,22,-32,25,0);paint.bezierCurveTo(50,-2,50,30,9,28);paint.stroke();}paint.restore();}
 paint.strokeStyle='#d0b078';paint.lineWidth=3;paint.beginPath();paint.arc(256,126,43,0,Math.PI*2);paint.stroke();paint.lineWidth=1;paint.beginPath();paint.arc(256,126,35,0,Math.PI*2);paint.stroke();
 for(let i=0;i<8;i++){const a=i*Math.PI/4;paint.beginPath();paint.ellipse(256+Math.cos(a)*19,126+Math.sin(a)*19,16,6,a,0,Math.PI*2);paint.stroke();}
 const panelTexture=new THREE.CanvasTexture(panelCanvas);panelTexture.colorSpace=THREE.SRGBColorSpace;
 const panelMaterial=new THREE.MeshStandardMaterial({map:panelTexture,roughness:1}),panelGeo=new THREE.PlaneGeometry(1,1);
 function box(parent,size,pos,material){const mesh=new THREE.Mesh(boxGeo,material);mesh.scale.set(...size);mesh.position.set(...pos);parent.add(mesh);return mesh;}
 function shadow(parent,rx,rz){const mesh=new THREE.Mesh(shadowGeo,shadeMaterial);mesh.rotation.x=-Math.PI/2;mesh.scale.set(rx,rz,1);mesh.position.y=.2;parent.add(mesh);}
 function chest(x,y){
  const g=new THREE.Group();g.position.copy(point(x,y));g.rotation.y=-.12;shadow(g,46,30);
  box(g,[75,36,46],[0,19,0],wood);box(g,[80,5,50],[0,38,0],bronze);box(g,[77,7,49],[0,43,0],lacquer);box(g,[73,6,43],[0,49,0],lacquer);
  const panel=new THREE.Mesh(panelGeo,panelMaterial);panel.scale.set(66,30,1);panel.position.set(0,21,23.1);g.add(panel);
  const lid=new THREE.Mesh(panelGeo,panelMaterial);lid.scale.set(71,40,1);lid.rotation.x=-Math.PI/2;lid.position.set(0,52.1,0);g.add(lid);
  for(const xx of [-29,29]){box(g,[4,38,49],[xx,20,0],bronze);box(g,[4,5,50],[xx,45,0],bronze);box(g,[4,5,44],[xx,51,0],bronze);}
  box(g,[13,16,4],[0,27,25],bronze);box(g,[5,8,5],[0,27,27],dark);
  for(const xx of [-31,31])for(const zz of [-16,16])box(g,[10,9,10],[xx,4,zz],lacquer);
  props.add(g);return g;
 }
 function rock(o,index){
  const g=new THREE.Group();g.position.copy(point(o.x,o.y));shadow(g,o.r*1.1,o.r*.78);
  const mesh=new THREE.Mesh(rockGeo,stone);mesh.scale.set(o.r,o.r*.66,o.r*.7);mesh.position.y=o.r*.43;mesh.rotation.set(.2,index*1.7,.16);g.add(mesh);
  const patch=new THREE.Mesh(rockGeo,moss);patch.scale.set(o.r*.59,o.r*.1,o.r*.43);patch.position.set(-o.r*.15,o.r*.98,1);patch.rotation.y=index;g.add(patch);props.add(g);
 }
 let torii=null;const extraModels={};
 try{
  const draco=new DRACOLoader();draco.setDecoderPath('./vendor/draco/');const loader=new GLTFLoader();loader.setDRACOLoader(draco);
  const gltf=await loader.loadAsync('./assets/models/torii.glb');torii=gltf.scene;
  const bounds=new THREE.Box3().setFromObject(torii),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
  torii.position.set(-center.x,-bounds.min.y,-center.z);const unit=new THREE.Group();unit.add(torii);unit.scale.setScalar(1/size.y);torii=unit;
  torii.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.color.multiply(new THREE.Color(.56,.64,.61));o.material.roughness=1;o.material.metalness=0;}});
  G.hybrid.models.push('torii');for(const name of ['stone_lantern','rock_garden']){try{const model=(await loader.loadAsync('./assets/models/'+name+'.glb')).scene;const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());model.position.set(-center.x,-bounds.min.y,-center.z);const unit=new THREE.Group();unit.add(model);unit.scale.setScalar(1/size.y);extraModels[name]=unit;model.traverse(o=>{if(o.isMesh){o.material=o.material.clone();o.material.color.multiply(new THREE.Color(.68,.74,.69));o.material.roughness=1;o.material.metalness=0;}});G.hybrid.models.push(name);}catch(e){G.hybrid.errors.push(name+': '+String(e));}}draco.dispose();
 }catch(e){G.hybrid.errors.push('torii: '+String(e));}
 G.hybrid.ready=true;G.hybrid.proceduralProps=['moss-stones','lacquer-chest'];
 // Static scenery is rendered only when its objects change. Keep a 2D copy
 // because WebGL may discard the drawing buffer between animation frames.
 const sceneryFrame=document.createElement('canvas');
 sceneryFrame.width=1440;sceneryFrame.height=900;
 const sceneryContext=sceneryFrame.getContext('2d');
 let room='',objects='';
 G.drawScenery=ctx=>{
  if(!G.p)return;
  const token=G.seed+':'+G.roomSerial+':'+G.act,signature=JSON.stringify([G.obstacles,G.interactable?.type,G.drops.filter(d=>d.kind==='chest').map(d=>[d.x,d.y])]);
  if(room!==token||objects!==signature){
   room=token;objects=signature;props.clear();
   if(torii){const gate=torii.clone(true);gate.scale.multiplyScalar(122);gate.position.copy(point(G.act%2?1170:265,305));gate.rotation.y=G.act%2?-.22:.22;props.add(gate);}
   G.obstacles.forEach(rock);for(const [name,x,y,height] of [['stone_lantern',330,280,92],['stone_lantern',1110,280,92],['stone_lantern',340,725,86],['stone_lantern',1100,725,86],['rock_garden',G.act%2?245:1190,600,98]]){if(extraModels[name]){const prop=extraModels[name].clone(true);prop.scale.multiplyScalar(height);prop.position.copy(point(x,y));prop.rotation.y=.35;props.add(prop);}}
   if(['treasure','reward_chest'].includes(G.interactable?.type))chest(G.interactable.x,G.interactable.y);
   for(const d of G.drops)if(d.kind==='chest')chest(d.x,d.y);
   renderer.render(scene,camera);
   G.hybrid.sceneryRefreshes=(G.hybrid.sceneryRefreshes||0)+1;
   sceneryContext.clearRect(0,0,1440,900);
   sceneryContext.drawImage(renderer.domElement,0,0);
  }
  ctx.save();ctx.globalAlpha=.94;ctx.drawImage(sceneryFrame,0,0,1440,900);ctx.restore();
  G.hybrid.drawCalls=renderer.info.render.calls;G.hybrid.triangles=renderer.info.render.triangles;
 };
 G.hasSceneryObject=kind=>kind==='treasure'||kind==='chest'||kind==='reward_chest';
}
