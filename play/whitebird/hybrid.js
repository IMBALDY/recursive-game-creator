import * as THREE from 'three';
import {GLTFLoader} from './vendor/examples/jsm/loaders/GLTFLoader.js';
import {DRACOLoader} from './vendor/examples/jsm/loaders/DRACOLoader.js';
import {clone as cloneSkinned} from './vendor/examples/jsm/utils/SkeletonUtils.js';
const G=window.WB;
G.hybrid={ready:false,models:[],errors:[],renderer:'webgl'};
let renderer;
try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,preserveDrawingBuffer:true,powerPreference:'high-performance'});}catch(e){G.hybrid.errors.push(String(e));}
if(renderer){
renderer.setSize(1440,900,false);renderer.setPixelRatio(1);renderer.setClearColor(0,0);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.3;
const scene=new THREE.Scene(),camera=new THREE.OrthographicCamera(-720,720,450,-450,.1,5000);
camera.position.set(0,1500,1500);camera.lookAt(0,0,0);scene.add(new THREE.HemisphereLight(0xfff6df,0x284f60,2.6));const key=new THREE.DirectionalLight(0xffe7bd,3.3);key.position.set(-400,900,450);scene.add(key);const rim=new THREE.DirectionalLight(0x76e1ee,2);rim.position.set(400,400,-300);scene.add(rim);
const draco=new DRACOLoader();draco.setDecoderPath('./vendor/draco/');const loader=new GLTFLoader();loader.setDRACOLoader(draco);
const templates={},instances=new Map(),fx=[],props=new THREE.Group();scene.add(props);
const point=(x,y,z=0)=>new THREE.Vector3(x-720,z,(y-450)*Math.SQRT2);
const normalize=g=>{const box=new THREE.Box3().setFromObject(g),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());g.position.set(-center.x,-box.min.y,-center.z);const group=new THREE.Group();group.add(g);group.scale.setScalar(1/Math.max(.001,size.y));return group;};
const load=async name=>{try{const gltf=await loader.loadAsync('./assets/models/'+(name==='hero'?'hero_rig':name)+'.glb');templates[name]=normalize(gltf.scene);G.hybrid.models.push(name);}catch(e){G.hybrid.errors.push(name+': '+String(e));}};
await Promise.all(['torii','hero','kodama','ibuki','sea_dragon','orochi'].map(load));G.hybrid.ready=true;
G.modelFor=(e,hero=false)=>{if(['aragami','sea'].includes(e.kind)&&e.phaseForm!=='beast')return null;if(e.kind==='kodama'&&G.enemies.filter(v=>v.kind==='kodama'&&!v.dead).sort((a,b)=>G.distance(a,G.p)-G.distance(b,G.p)).slice(8).includes(e))return null;const id=hero||['prince','whitebird'].includes(e.kind)?'hero':e.kind==='kodama'?'kodama':e.kind==='ibuki_heaven'?'orochi':['boar','aragami'].includes(e.kind)?'ibuki':e.kind==='sea'?'sea_dragon':null;return id&&templates[id]?id:null;};
function limbShader(material,box,uniforms){
 material.onBeforeCompile=shader=>{Object.assign(shader.uniforms,uniforms);shader.vertexShader='uniform float gait;uniform float stride;uniform float strike;uniform float castWeight;uniform float dash;\n'+shader.vertexShader;
  const bottom=box.min.y,height=Math.max(.01,box.max.y-box.min.y),mid=(box.min.x+box.max.x)/2,width=Math.max(.01,box.max.x-box.min.x);
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   float ny=clamp((position.y-(${bottom.toFixed(6)}))/${height.toFixed(6)},0.,1.);
   float side=position.x<${mid.toFixed(6)}?-1.:1.;
   float legs=1.-smoothstep(.26,.53,ny);
   float arms=smoothstep(.15,.37,abs(position.x-(${mid.toFixed(6)}))/${width.toFixed(6)})*smoothstep(.45,.6,ny)*(1.-smoothstep(.86,.97,ny));
   transformed.z += sin(gait+side*1.5708)*stride*legs*${(height*.09).toFixed(6)};
   transformed.y += max(0.,cos(gait+side*1.5708))*stride*legs*${(height*.03).toFixed(6)};
   transformed.z += arms*(strike*side+castWeight*.4)*${(height*.15).toFixed(6)};
   transformed.y += arms*castWeight*${(height*.08).toFixed(6)};
   transformed.z += ny*ny*dash*${(height*.14).toFixed(6)};
  `);};material.customProgramCacheKey=()=> 'whitebird-deform-'+box.min.y+'-'+box.max.y;
}
function instantiate(id,entity){
 const holder=new THREE.Group(),model=id==='hero'?cloneSkinned(templates[id]):templates[id].clone(true);holder.add(model);scene.add(holder);
 const uniforms={gait:{value:0},stride:{value:0},strike:{value:0},castWeight:{value:0},dash:{value:0}},materials=[];
 const bones={};model.traverse(o=>{if(o.isBone)bones[o.name.replace(/^mixamorig:/,'')]={bone:o,base:o.rotation.clone()};if(!o.isMesh)return;o.material=o.material.clone();o.frustumCulled=false;o.material.roughness=.85;o.material.metalness=.08;o.geometry.computeBoundingBox();if(id==='kodama')limbShader(o.material,o.geometry.boundingBox,uniforms);materials.push(o.material);});
 const shadow=new THREE.Mesh(new THREE.CircleGeometry(1,32),new THREE.MeshBasicMaterial({color:0x020c13,transparent:true,opacity:.4,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=1;holder.add(shadow);
 const wings=new THREE.Group();if(entity?.kind==='whitebird'){
  for(const side of [-1,1])for(let i=0;i<9;i++){const geo=new THREE.ConeGeometry(5,100-i*4,4),mat=new THREE.MeshStandardMaterial({color:0xfff1c6,emissive:0x6d4b19,emissiveIntensity:.5,roughness:.65});const mesh=new THREE.Mesh(geo,mat);mesh.position.set(side*(30+i*12),110+i*2,-10);mesh.rotation.z=side*(-.8-i*.06);wings.add(mesh);}holder.add(wings);
 }
 return {id,holder,model,uniforms,materials,bones,shadow,wings,lastForm:-1};
}
function positionActor(e,hero){
 const id=G.modelFor(e,hero);if(!id)return;const k=hero?'hero':e.id;let obj=instances.get(k);if(!obj||obj.id!==id){if(obj)disposeActor(obj);obj=instantiate(id,e);instances.set(k,obj);}
 obj.used=true;obj.holder.visible=true;obj.holder.position.copy(point(e.x,e.y));
 const size=hero?158:e.kind==='whitebird'?220:e.kind==='prince'?192:e.boss?(id==='orochi'?370:id==='sea_dragon'?320:285):id==='ibuki'?98:100;
 obj.model.scale.setScalar(size*templates[id].scale.x);
 const moving=hero?!!(G.moveVector().x||G.moveVector().y):e.walking,action=hero?G.p.action:e.action,t=action?G.clamp((G.time-action.start)/action.duration,0,1):1;
 const strike=action?.kind==='slash'&&t<1?Math.sin(t*Math.PI*2):0,cast=(action?.kind==='cast'||action?.kind==='awaken')&&t<1?Math.sin(t*Math.PI):e.windup>0?.5:0;
 obj.uniforms.gait.value=(e.walkTime||0)*12;obj.uniforms.stride.value=moving?1:0;obj.uniforms.strike.value=strike;obj.uniforms.castWeight.value=cast;obj.uniforms.dash.value=e.dashTime>0||e.charge>0?1:0;
 if(id==='hero'){
  const phase=(e.walkTime||0)*12,step=moving?Math.sin(phase)*.48:0,dash=e.dashTime>0?.35:0;
  const set=(name,x=0,y=0,z=0)=>{const v=obj.bones[name];if(v){v.bone.rotation.set(v.base.x+x,v.base.y+y,v.base.z+z);}};
  set('LeftUpLeg',step+dash);set('RightUpLeg',-step+dash);
  set('LeftLeg',Math.max(0,-step)*.4);set('RightLeg',Math.max(0,step)*.4);
  set('LeftArm',-step*.65-cast*.8,strike*.25,-cast*.18);
  set('RightArm',step*.65-cast*.8-strike*1.35,-strike*.25,cast*.18);
  set('LeftForeArm',cast*.4);set('RightForeArm',cast*.4+Math.max(0,strike)*.3);
  set('Spine',-dash*.35,0,strike*.18);
 }
 let targetYaw=hero?Math.atan2(G.p.dx||0,G.p.dy||1):Math.atan2(G.p.x-e.x,G.p.y-e.y);if(action?.until>G.time&&hero)targetYaw=Math.PI/2-(G.p.facing||0);
 const delta=Math.atan2(Math.sin(targetYaw-obj.model.rotation.y),Math.cos(targetYaw-obj.model.rotation.y));obj.model.rotation.y+=delta*.17;
 obj.model.rotation.z=strike*.13+(e.charge>0?.09:0);obj.model.rotation.x=e.windup>0?-.09:e.charge>0?.13:0;
 obj.model.position.y=e.charge>0?5:0;obj.shadow.scale.set(size*.3,size*.19,1);obj.wings.rotation.y=Math.sin(G.time*2)*.13;
 const form=hero?G.formIndex():e.kind==='prince'?2:e.kind==='whitebird'?1:0;
 if(obj.lastForm!==form){obj.lastForm=form;for(const m of obj.materials){m.color.set(form===2?0xba7a88:form===1?0xfff1c4:0xffffff);m.emissive?.set(form===2?0x300509:form===1?0x342612:0);m.emissiveIntensity=form?.3:0;}}
 if(e.flash>0)for(const m of obj.materials)m.emissiveIntensity=1.1;else for(const m of obj.materials)m.emissiveIntensity=form?.3:0;
}
function disposeActor(o){scene.remove(o.holder);o.materials.forEach(m=>m.dispose());o.shadow.geometry.dispose();o.shadow.material.dispose();o.wings.traverse(w=>{if(w.isMesh){w.geometry.dispose();w.material.dispose();}});}
let roomToken=null;
function updateProps(){if(roomToken===G.roomSerial)return;roomToken=G.roomSerial;props.clear();if(templates.torii){const torii=templates.torii.clone(true);torii.scale.multiplyScalar(180);torii.position.copy(point(1130,315));torii.rotation.y=-.2;props.add(torii);const other=templates.torii.clone(true);other.scale.multiplyScalar(110);other.position.copy(point(280,275));other.rotation.y=.2;props.add(other);}}
const mat=(color,opacity=.8)=>new THREE.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false,side:THREE.DoubleSide});
const ring=(color,radius=100,thickness=4)=>{const m=new THREE.Mesh(new THREE.TorusGeometry(radius,thickness,6,48),mat(color));m.rotation.x=-Math.PI/2;return m;};
G.fx3d=(kind,x,y,a=0,strength=1)=>{
 const group=new THREE.Group();group.position.copy(point(x,y,15));group.rotation.y=-a;let duration=.8;
 if(kind==='wave'){
  duration=1.2;for(let j=0;j<3;j++){const geo=new THREE.PlaneGeometry(145*strength,90*strength,32,16),pos=geo.attributes.position;for(let i=0;i<pos.count;i++){const xx=pos.getX(i),yy=pos.getY(i),angle=(yy/(90*strength)+.5)*2.6;pos.setXYZ(i,Math.sin(angle)*40*strength+j*24,(1-Math.cos(angle))*48*strength,xx);}geo.computeVertexNormals();const mesh=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:j===0?0xbaf7ee:0x239aaf,emissive:0x064951,transparent:true,opacity:.65-j*.12,side:THREE.DoubleSide,roughness:.2,metalness:.15,depthWrite:false}));group.add(mesh);}
 }else if(kind==='orb'){for(let i=-1;i<=1;i++){const m=new THREE.Mesh(new THREE.SphereGeometry(24,16,12),new THREE.MeshStandardMaterial({color:0x6de5ef,emissive:0x14728f,transparent:true,opacity:.7,roughness:.15}));m.position.set(40,35,i*70);group.add(m);}}
 else if(kind==='thunder'){duration=.55;for(let i=0;i<4;i++){const points=[new THREE.Vector3(i*32-45,270,0),new THREE.Vector3(15-i*10,170,8),new THREE.Vector3(-30+i*15,100,-10),new THREE.Vector3(0,0,0)],geo=new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),12,3,4,false);group.add(new THREE.Mesh(geo,mat(0xdbb6ff)));}group.add(ring(0xcb9cf8,95));}
 else if(kind==='ultimate'){
  duration=1.7;for(let i=0;i<5;i++){const m=ring(0xffe8ad,90+i*65,3+i);m.position.y=i*25;group.add(m);}const beam=new THREE.Mesh(new THREE.CylinderGeometry(10,65,700,16),mat(0xffedb6,.7));beam.position.y=290;group.add(beam);
 }else if(kind==='feather'){
  for(let i=0;i<12;i++){const m=new THREE.Mesh(new THREE.ConeGeometry(5,65,4),mat(0xffeec4));const t=i*Math.PI/6;m.position.set(Math.cos(t)*75,35,Math.sin(t)*75);m.rotation.z=-t;m.rotation.x=.8;group.add(m);}
 }else if(kind==='slash'||kind==='bloodSlash'){
  duration=.4;const geo=new THREE.TorusGeometry(125,5,5,36,Math.PI*1.2),m=new THREE.Mesh(geo,mat(kind==='bloodSlash'?0xff365b:0xcbfcf2));m.rotation.x=-Math.PI/2;m.rotation.z=-Math.PI*.6;group.add(m);
 }else{group.add(ring(kind==='fire'?0xff9246:0x8becdd,95,6));group.add(ring(kind==='fire'?0xffdf90:0xe6ffff,65,3));}
 scene.add(group);fx.push({group,kind,start:G.time,duration,x,y,a,strength});if(fx.length>36)removeFx(fx.shift());
};
function removeFx(f){scene.remove(f.group);f.group.traverse(o=>{if(o.isMesh){o.geometry.dispose();o.material.dispose();}});}
G.drawHybrid=(ctx,dt)=>{
 if(!G.hybrid.ready||!G.p)return;updateProps();for(const o of instances.values())o.used=false;positionActor(G.p,true);for(const e of G.enemies)if(!e.dead)positionActor(e,false);
 for(const [id,o] of instances)if(!o.used){disposeActor(o);instances.delete(id);}
 for(let i=fx.length-1;i>=0;i--){const f=fx[i],t=(G.time-f.start)/f.duration;if(t>=1||t<0){removeFx(f);fx.splice(i,1);continue;}f.group.traverse(o=>{if(o.isMesh)o.material.opacity=(1-t)*.85;});if(['wave','orb'].includes(f.kind)){f.group.position.copy(point(f.x+Math.cos(f.a)*t*520,f.y+Math.sin(f.a)*t*520,10));}else{f.group.scale.setScalar(.65+t*(f.kind==='ultimate'?3:1.6));f.group.rotation.y=-f.a+t*.4;}}
 renderer.render(scene,camera);ctx.drawImage(renderer.domElement,0,0,1440,900);G.hybrid.drawCalls=renderer.info.render.calls;G.hybrid.triangles=renderer.info.render.triangles;
 // Keep enemy health bars and attribute labels readable above the 3D layer.
 ctx.save();ctx.textAlign='center';ctx.font='13px WhitebirdSans';for(const e of G.enemies){if(e.dead)continue;const attr=G.affinities[G.affinityFor(e)],height=e.boss?e.kind==='sea'?230:215:85;ctx.fillStyle=attr.color;ctx.fillText(attr.name,e.x,e.y-height-14);if(!e.boss&&e.hp<e.maxHp){ctx.fillStyle='#071419';ctx.fillRect(e.x-20,e.y-height,40,4);ctx.fillStyle='#dfad98';ctx.fillRect(e.x-20,e.y-height,40*Math.max(0,e.hp/e.maxHp),4);}}ctx.restore();
};
}


