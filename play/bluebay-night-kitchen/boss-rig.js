import * as THREE from './vendor/build/three.module.js';

const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const smooth=(a,b,v)=>{const q=clamp((v-a)/(b-a),0,1);return q*q*(3-2*q);};
const pulse=(t,frequency=24)=>Math.sin(t*frequency)*Math.exp(-t*5);

/** Pure skill poses. Simulation time is the only clock, so pause freezes every
 * fin, jaw and impact. These are local mesh deformations, not skeletal clips. */
export function bossPose(kind,b,time,hitAge=Infinity) {
  const elapsed=Math.max(0,b.elapsed||0),q=clamp(elapsed/Math.max(.01,b.duration||1),0,1),skill=b.skill||'rest';
  const p={kind,skill,time,elapsed,q,jaw:.08,gill:.13,tail:.11,tailRate:2.0,bend:0,fin:.1,throat:0,recoil:0,coil:0,shock:0,tired:0,hit:hitAge<1?Math.exp(-hitAge*6):0,impact:0};
  if(kind==='ironjaw') {
    if(skill==='chargeTell'){p.bend=.16*smooth(0,.85,q);p.tail=.19;p.tailRate=2.8;p.jaw=.12+.35*q;p.gill=.25+.55*q;p.fin=.32;}
    else if(skill==='charge'){p.bend=-.045*Math.sin(q*Math.PI);p.tail=.35;p.tailRate=13;p.jaw=.18;p.gill=.8;p.fin=-.18;}
    else if(skill==='exposed'){p.impact=elapsed<1?pulse(elapsed,32):0;p.jaw=.32+Math.sin(time*2.4)*.12;p.gill=.65+.18*Math.sin(time*2.4);p.tail=.055;p.tailRate=1.6;p.tired=.75;p.recoil=elapsed<.8?Math.exp(-elapsed*7)*.025:0;}
    else if(skill==='tailTell'){p.bend=.20*smooth(0,.8,q);p.tail=.18;p.jaw=.12;p.fin=.26;}
    else if(skill==='tail'){p.bend=-.19*Math.sin(q*Math.PI*1.5);p.tail=.47;p.tailRate=15;p.fin=.24;}
    else {p.jaw=.12+Math.sin(time*2)*.04;p.tail=.12;p.gill=.3+.08*Math.sin(time*2);p.tired=.2;}
  } else if(kind==='ancientshark') {
    if(skill==='pullTell'){p.jaw=.12+.8*smooth(0,.9,q);p.throat=.7*q;p.tail=.11;p.fin=.30;p.gill=.30;}
    else if(skill==='pull'){p.jaw=.94+Math.sin(time*4)*.04;p.throat=.95;p.tail=.2;p.tailRate=2.8;p.fin=.48;p.gill=.85;}
    else if(skill==='coneTell'){p.jaw=.72-.36*q;p.throat=1.1;p.recoil=.05*q;p.tail=.09;p.bend=.055*q;p.fin=.1;}
    else if(skill==='cone'){p.jaw=.82*Math.exp(-q*2)+.13;p.throat=.8*(1-q);p.recoil=-.075*Math.sin(Math.min(1,q*2)*Math.PI);p.tail=.31;p.tailRate=8;p.fin=-.24;p.shock=Math.exp(-elapsed*5);p.gill=1;}
    else if(skill==='exposed'){p.jaw=.28+Math.sin(time*1.7)*.10;p.gill=.7+.2*Math.sin(time*1.7);p.tail=.06;p.tailRate=1.4;p.tired=.8;p.fin=-.12;}
    else {p.jaw=.12;p.gill=.22;p.tail=.14;p.fin=.12;}
  } else {
    if(skill.endsWith('Tell')){p.coil=.85*smooth(0,.75,q);p.tail=.12;p.tailRate=2.4;p.jaw=.14+.15*q;p.gill=.6;p.shock=q;}
    else if(['lanes','ring','cross'].includes(skill)){p.coil=.30*(1-q);p.tail=skill==='cross'?.38:.26;p.tailRate=skill==='cross'?14:8;p.jaw=.38;p.shock=.8+.2*Math.sin(time*12);p.fin=.35;}
    else if(skill==='exposed'){p.tail=.055;p.tailRate=1.25;p.tired=.8;p.jaw=.12+.1*Math.sin(time*2);p.gill=.65;}
    else {p.tail=.12;p.tailRate=2;p.jaw=.09;}
  }
  p.hitWobble=hitAge<.9?pulse(hitAge,35)*.045:0;
  return p;
}

/** Coordinates are the reviewed normalized model axes: +X is the mouth,
 * -X the tail, +Y the back. The weakpoint hinge (.23,-.13) remains fixed. */
export function deformBossPoint(x,y,z,size,p,out=[0,0,0]) {
  const u=x/size,v=y/size,w=z/size;
  const tail=smooth(-.04,-.44,u),rear=1-smooth(-.25,.08,u),head=smooth(.16,.42,u);
  const weakDistance=Math.hypot(u-.23,v+.13),free=smooth(.018,.105,weakDistance);
  let px=x,py=y,pz=z;
  const bend=(p.bend*Math.sin(rear*Math.PI*.82)+Math.sin(p.time*p.tailRate-rear*3.7)*p.tail*tail*tail)*size;
  py+=bend*free;
  pz+=Math.sin(p.time*p.tailRate-rear*4.3)*size*p.tail*.31*tail*free;
  px-=Math.abs(p.bend)*size*.18*rear*rear*free;
  // Head and throat compress before a water jet; no whole-model scaling.
  px+=p.recoil*size*head*free;
  const neck=Math.exp(-Math.pow((u-.16)/.16,2));
  py+=v*size*p.throat*.21*neck*free;
  pz+=w*size*(p.throat*.18*neck+p.gill*.17*Math.exp(-Math.pow((u-.13)/.09,2)))*free;
  // Lower mouth rotates around its real cheek hinge, while the brow lifts.
  const jawWeight=smooth(.205,.43,u)*(1-smooth(-.04,.025,v));
  const angle=-p.jaw*.67*jawWeight*free,c=Math.cos(angle),s=Math.sin(angle),dx=px-size*.22,dy=py+size*.035;
  px=size*.22+dx*c-dy*s;py=-size*.035+dx*s+dy*c;
  py+=p.jaw*size*.022*head*smooth(.015,.07,v)*free;
  // Separate pectoral/dorsal motion: lateral fins lift and fold from their base.
  const pectoral=smooth(.105,.21,Math.abs(w))*(1-smooth(.07,.24,u))*smooth(-.27,-.08,u);
  py+=size*(p.fin+Math.sin(p.time*2.6+w*8)*.09)*pectoral*Math.sign(w||1)*.22*free;
  pz*=1-pectoral*Math.max(0,-p.fin)*.45;
  const dorsal=smooth(.13,.25,v)*(1-smooth(.06,.3,u));
  py+=size*p.fin*.15*dorsal*free;
  // Impact travels through the body, with the rear lagging behind the head.
  py+=size*(p.impact*.018*Math.cos(u*11)+p.hitWobble*Math.cos(u*9))*free;
  pz+=size*p.hitWobble*.35*Math.sin(u*8)*free;
  py-=size*p.tired*.018*(1-head)*free;
  out[0]=px;out[1]=py;out[2]=pz;return out;
}

export function createBossRig(normalizedModel,kind,size) {
  normalizedModel.updateMatrixWorld(true);
  const visual=new THREE.Group(),meshes=[],materials=new Set(),scratch=[0,0,0];
  normalizedModel.traverse(source=>{
    if(!source.isMesh)return;
    const geometry=source.geometry.clone().applyMatrix4(source.matrixWorld),position=geometry.attributes.position,rest=position.array.slice();
    position.setUsage(THREE.DynamicDrawUsage);
    const cloned=(Array.isArray(source.material)?source.material:[source.material]).map(m=>{const c=m.clone();materials.add(c);return c;});
    const mesh=new THREE.Mesh(geometry,Array.isArray(source.material)?cloned:cloned[0]);mesh.frustumCulled=false;visual.add(mesh);meshes.push({geometry,position,rest});
  });
  return {
    visual,meshes,kind,size,
    update(pose){
      for(const {geometry,position,rest}of meshes){for(let i=0;i<position.count;i++){const j=i*3;deformBossPoint(rest[j],rest[j+1],rest[j+2],size,pose,scratch);position.setXYZ(i,...scratch);}position.needsUpdate=true;geometry.computeVertexNormals();}
      for(const mat of materials)if(mat.emissive){mat.emissive.setRGB(pose.hit*.35,pose.hit*.17,pose.hit*.045);mat.emissiveIntensity=1;}
    },
    deform(x,y,z,p,out){return deformBossPoint(x,y,z,size,p,out);},
    dispose(){for(const {geometry}of meshes)geometry.dispose();for(const mat of materials)mat.dispose();}
  };
}
