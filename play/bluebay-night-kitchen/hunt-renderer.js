import * as THREE from './vendor/build/three.module.js';
import {bossPose,createBossRig,deformBossPoint} from './boss-rig.js';

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const COLORS = { ironjaw: '#e0ab66', stormeel: '#73e2d9', ancientshark: '#c2dba8' };

// Local geometry and material ownership keeps repeated entry/exit of an arena
// from leaking effects. Loaded GLB textures remain shared with OceanRenderer.
export class HuntRenderer {
  constructor(owner) {
    this.owner = owner;
    this.root = new THREE.Group(); owner.scene.add(this.root);
    this.bossRoot = new THREE.Group(); this.root.add(this.bossRoot);
    this.hazardRoot = new THREE.Group(); this.root.add(this.hazardRoot);
    this.shotRoot = new THREE.Group(); this.root.add(this.shotRoot);
    this.resources = [];
    this.hazards = new Map(); this.projectiles = new Map(); this.effectMeshes = [];
    this.bossId = null;
    this.cameraImpulse={x:0,y:0,amount:0};
    this.makePlayerEffects();
  }

  own(resource) { this.resources.push(resource); return resource; }
  material(color, opacity = 1, unlit = true) {
    return this.own(unlit ? new THREE.MeshBasicMaterial({color, transparent:true, opacity, depthWrite:false, side:THREE.DoubleSide, toneMapped:false}) : new THREE.MeshStandardMaterial({color, roughness:.7, metalness:.08}));
  }
  mesh(parent, geometry, color, opacity = 1, unlit = true) {
    const m = new THREE.Mesh(this.own(geometry), this.material(color, opacity, unlit)); parent.add(m); return m;
  }
  line(parent, color, count = 2, opacity = 1) {
    const geo = this.own(new THREE.BufferGeometry()); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    const material = this.own(new THREE.LineBasicMaterial({color, transparent:true, opacity, depthWrite:false, toneMapped:false}));
    const m = new THREE.Line(geo, material); parent.add(m); return m;
  }
  points(line, points) {
    const a = line.geometry.attributes.position;
    for (let i = 0; i < points.length; i++) a.setXYZ(i, ...points[i]);
    a.needsUpdate = true; line.geometry.computeBoundingSphere();
  }
  ellipse(parent, color, x, y, z, sx, sy, sz) {
    const m = this.mesh(parent, new THREE.SphereGeometry(1, 18, 12), color, 1, false); m.position.set(x, y, z); m.scale.set(sx, sy, sz); return m;
  }

  makePlayerEffects() {
    this.playerHalo = this.mesh(this.root, new THREE.RingGeometry(2.85, 3.08, 48), '#d3f5d5', .62);
    this.playerHalo.position.z=8;this.playerHalo.renderOrder=45;this.playerHalo.material.depthTest=false;
    this.playerHaloInner = this.mesh(this.root, new THREE.CircleGeometry(2.85, 48), '#163e46', .15);
    this.playerHaloInner.position.z=2.95;
    this.tether = this.line(this.root, '#efd8a4', 25, .92); this.tether.renderOrder = 35;
    this.aimLine = this.line(this.root, '#d0eee0', 2, .42); this.aimLine.renderOrder = 32;
    this.crosshair = this.mesh(this.root, new THREE.RingGeometry(.76, .9, 32), '#f0e3ab', .76); this.crosshair.position.z = 5;
    this.charge = this.mesh(this.root, new THREE.RingGeometry(2.4, 2.58, 48), '#9ce9db', .8); this.charge.position.z = 5;
    this.flash = this.mesh(this.root, new THREE.CircleGeometry(1, 24), '#fff1bc', .7); this.flash.position.z = 4.5;
    this.harpoon = this.arrow(this.root, '#e8eee0');
    this.weakRing = this.mesh(this.root, new THREE.RingGeometry(1, 1.08, 48), '#f7d480', .9); this.weakRing.position.z = 5;
    this.weakInner = this.mesh(this.root, new THREE.RingGeometry(.18, .3, 16), '#fff5c7', .9); this.weakInner.position.z = 5.1;
    this.weakCross = [];
    for (let i = 0; i < 4; i++) {
      const m = this.mesh(this.root, new THREE.PlaneGeometry(.55, 1.5), '#ffe7a4', .9); m.position.z = 5.1; this.weakCross.push(m);
    }
    this.wake = [];
    for (let i = 0; i < 8; i++) {
      const m = this.mesh(this.root, new THREE.RingGeometry(.9, 1, 28), '#b4fff3', .0); m.position.z = 3.5; this.wake.push(m);
    }
    for (let i = 0; i < 28; i++) {
      const m = this.mesh(this.root, new THREE.RingGeometry(.8, 1, 24), '#f7dea4', 0); m.position.z = 6; this.effectMeshes.push(m);
    }
    this.hitBursts=[];
    const chipGeometry=this.own(new THREE.TetrahedronGeometry(.18));
    for(let i=0;i<8;i++) {
      const group=new THREE.Group();this.root.add(group);
      const rays=new THREE.LineSegments(this.own(new THREE.BufferGeometry()),this.own(new THREE.LineBasicMaterial({color:'#ffedb3',transparent:true,opacity:0,depthTest:false,depthWrite:false,toneMapped:false})));
      rays.geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(12*2*3),3).setUsage(THREE.DynamicDrawUsage));group.add(rays);
      const flash=this.mesh(group,new THREE.CircleGeometry(1,20),'#fff4ce',0);flash.material.depthTest=false;
      const chips=new THREE.InstancedMesh(chipGeometry,this.material('#dcc98c',.8),8);chips.frustumCulled=false;group.add(chips);
      group.renderOrder=48;group.traverse(o=>o.renderOrder=48);this.hitBursts.push({group,rays,flash,chips});
    }
    this.chipDummy=new THREE.Object3D();
    this.reset();
  }

  arrow(parent, color) {
    const g = new THREE.Group(); parent.add(g);
    const shaft = this.mesh(g, new THREE.CylinderGeometry(.045, .045, 2.5, 6), color); shaft.rotation.z = -Math.PI / 2;
    const tip = this.mesh(g, new THREE.ConeGeometry(.25, .8, 5), '#fff3c8'); tip.rotation.z = -Math.PI / 2; tip.position.x = 1.6;
    const trail = this.line(g, '#d7f5e4', 2, .38); this.points(trail, [[-1.4,0,0],[-4.5,0,0]]);
    return g;
  }

  reset() {
    this.bossRig?.dispose();this.bossRig=null;this.lastBossHp=null;this.recentHitAt=-Infinity;
    this.cameraImpulse={x:0,y:0,amount:0};
    this.bossId = null; this.modelId = null;
    this.bossRoot.clear(); this.hazardRoot.clear(); this.shotRoot.clear();
    this.hazards.clear(); this.projectiles.clear();
    for(const burst of this.hitBursts||[])burst.group.visible=false;
    for (const o of [this.playerHalo,this.playerHaloInner,this.tether, this.aimLine, this.crosshair, this.charge, this.flash, this.harpoon, this.weakRing, this.weakInner, ...this.weakCross, ...this.wake, ...this.effectMeshes]) if (o) o.visible = false;
    // Player-effect objects survive resets; only arena objects are transient.
    if (this.arenaResourceStart !== undefined) for (const r of this.resources.splice(this.arenaResourceStart)) r.dispose?.();
    this.arenaResourceStart = this.resources.length;
  }

  ensureBoss(boss) {
    const desiredModel = boss.kind === 'ironjaw' ? 'grouper' : boss.kind === 'ancientshark' ? 'whale_shark' : null;
    const modelReady = desiredModel && this.owner.loadedModels.has(desiredModel);
    if (this.bossId === boss.id && this.modelReady === modelReady) return;
    this.bossRig?.dispose();this.bossRig=null;
    this.bossRoot.clear(); this.bossId = boss.id; this.modelReady = modelReady; this.bossKind = boss.kind;
    this.bossVisual = new THREE.Group(); this.bossRoot.add(this.bossVisual);
    this.bossParts = [];
    const color = COLORS[boss.kind] || COLORS.ironjaw, size = boss.size || 42;
    if (modelReady) {
      this.bossRig=createBossRig(this.owner.normalizedModel(desiredModel,size),boss.kind,size);
      this.bossVisual.add(this.bossRig.visual);
    } else if (boss.kind !== 'stormeel') {
      this.ellipse(this.bossVisual, boss.kind === 'ironjaw' ? '#637c67' : '#547b85', 0,0,0, size*.37,size*.15,size*.12);
      this.ellipse(this.bossVisual, '#324c55', size*.30,-size*.04,size*.11,size*.07,size*.035,size*.015);
      const tail = this.mesh(this.bossVisual,new THREE.ConeGeometry(size*.14,size*.20,3),'#3f6b70',1,false); tail.rotation.z=Math.PI/2;tail.position.x=-size*.43;
    }
    if (boss.kind === 'stormeel') {
      this.makeSmoothEel(size);
    } else if (boss.kind === 'ancientshark') {
      // Small, dark membrane ridges follow the real dorsal silhouette; no
      // bead-tipped crown competes with the generated shark's natural texture.
      for(let i=0;i<8;i++) {
        const t=i/7,x=(t-.5)*size*.58,y=size*(.027+Math.sin(t*Math.PI)*.056);
        const height=size*(.024+.013*Math.sin(i*2.3)),width=size*(.03+.008*Math.cos(i));
        const shape=new THREE.Shape();shape.moveTo(-width,0);shape.quadraticCurveTo(-width*.1,height*.35,width*.15,height);shape.quadraticCurveTo(width*.3,height*.2,width,0);shape.closePath();
        const fin=this.mesh(this.bossVisual,new THREE.ShapeGeometry(shape),'#315963',1,false);fin.position.set(x,y,size*.02);fin.material.side=THREE.DoubleSide;this.bossParts.push({object:fin,rest:[x,y,size*.02]});
        if(i%3===0){const edge=this.line(this.bossVisual,'#78b6be',3,.24);this.points(edge,[[x-width,y,size*.026],[x+width*.15,y+height,size*.026],[x+width,y,size*.026]]);}
      }
    } else {
      // Low, irregular fin plates replace the toy-like bead-tipped cones.
      for(let i=0;i<8;i++) {
        const t=i/7,x=(t-.55)*size*.54,y=Math.sin(t*Math.PI)*size*.194;
        const width=size*(.023+.007*Math.sin(i*1.6)),height=size*(.033+.018*Math.cos(i*1.8));
        const shape=new THREE.Shape();shape.moveTo(-width,0);shape.lineTo(-width*.28,height*.7);shape.quadraticCurveTo(width*.25,height,width*.40,height*.54);shape.lineTo(width,.02);shape.closePath();
        const plate=this.mesh(this.bossVisual,new THREE.ShapeGeometry(shape),i%2?'#77564e':'#8d705a',1,false);plate.material.side=THREE.DoubleSide;plate.position.set(x,y,size*.015);this.bossParts.push({object:plate,rest:[x,y,size*.015]});
      }
    }
    // The generated heads are single closed surfaces. Their original lips and
    // textures deform with the jaw; an added "inside mouth" ellipsoid would
    // protrude outside that topology and look like an extra chin.
    this.mouthInterior=null;
    this.bossAura=this.mesh(this.bossRoot,new THREE.RingGeometry(.98,1,64),color,.09);this.bossAura.position.z=-1;this.bossAura.scale.set(size*.60,size*.25,1);
  }

  eelRadius(t,size) {
    const profile=[[0,.016],[.055,.043],[.14,.077],[.26,.079],[.43,.063],[.63,.041],[.83,.017],[1,.0015]];
    for(let i=1;i<profile.length;i++)if(t<=profile[i][0]){const a=profile[i-1],b=profile[i],q=clamp((t-a[0])/(b[0]-a[0]),0,1),s=q*q*(3-2*q);return size*(a[1]+(b[1]-a[1])*s);}
    return size*.0015;
  }

  makeSmoothEel(size) {
    const rings=72,sides=24,positions=new Float32Array((rings+1)*(sides+1)*3),uv=new Float32Array((rings+1)*(sides+1)*2),indices=[];
    for(let i=0;i<=rings;i++)for(let j=0;j<=sides;j++){const k=i*(sides+1)+j;uv[k*2]=i/rings;uv[k*2+1]=j/sides;if(i<rings&&j<sides){const a=k,b=k+sides+1;indices.push(a,b,a+1,b,b+1,a+1);}}
    const geometry=this.own(new THREE.BufferGeometry());geometry.setAttribute('position',new THREE.BufferAttribute(positions,3).setUsage(THREE.DynamicDrawUsage));geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2));geometry.setIndex(indices);
    const skin=this.own(new THREE.MeshStandardMaterial({color:'#537e79',roughness:.57,metalness:.04}));
    skin.onBeforeCompile=shader=>{
      shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec2 vEelUv;').replace('#include <begin_vertex>','#include <begin_vertex>\nvEelUv=uv;');
      shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec2 vEelUv;').replace('#include <color_fragment>',`#include <color_fragment>
        float dorsal=cos(vEelUv.y*6.2831853);
        vec3 hide=mix(vec3(.43,.52,.39),vec3(.055,.16,.18),smoothstep(-.75,.75,dorsal));
        float row=floor(vEelUv.y*30.);
        vec2 cell=fract(vec2(vEelUv.x*150.+mod(row,2.)*.5,vEelUv.y*30.))-.5;
        float scaleEdge=smoothstep(.40,.49,length(cell*vec2(1.,1.3)));
        float mottling=sin(vEelUv.x*103.+sin(vEelUv.y*21.)*1.7)*sin(vEelUv.y*35.+vEelUv.x*17.);
        hide*=.91+scaleEdge*.075+mottling*.08;
        diffuseColor.rgb=hide;`);
    };
    skin.customProgramCacheKey=()=> 'bluebay-smooth-eel-scales-v1';
    const body=new THREE.Mesh(geometry,skin);body.frustumCulled=false;this.bossVisual.add(body);
    const finGeometry=this.own(new THREE.BufferGeometry()),finPoints=new Float32Array((rings+1)*2*3),finIndices=[];
    for(let i=0;i<rings;i++){const a=i*2;finIndices.push(a,a+2,a+1,a+2,a+3,a+1);}
    finGeometry.setAttribute('position',new THREE.BufferAttribute(finPoints,3).setUsage(THREE.DynamicDrawUsage));finGeometry.setIndex(finIndices);
    const finMaterial=this.own(new THREE.MeshStandardMaterial({color:'#477f80',emissive:'#17565a',emissiveIntensity:.35,roughness:.65,transparent:true,opacity:.76,side:THREE.DoubleSide,depthWrite:false}));
    const fin=new THREE.Mesh(finGeometry,finMaterial);fin.frustumCulled=false;this.bossVisual.add(fin);
    const edge=this.line(this.bossVisual,'#84d5cc',rings+1,.55);
    this.eelHead=new THREE.Group();this.bossVisual.add(this.eelHead);
    for(const side of [-1,1]) {
      this.ellipse(this.eelHead,'#b1b777',size*.368,size*.018,side*size*.041,size*.0065,size*.008,size*.0035);
      this.ellipse(this.eelHead,'#102b31',size*.370,size*.019,side*size*.044,size*.0026,size*.006,size*.0018);
      const mouth=this.line(this.eelHead,'#122d32',6,.92);
      this.points(mouth,[[.485,-.006,.012],[.45,-.020,.026],[.415,-.031,.034],[.377,-.042,.040],[.346,-.047,.043],[.328,-.044,.045]].map(([x,y,z])=>[x*size,y*size,z*size*side]));
      const lip=this.line(this.eelHead,'#799789',5,.62);
      this.points(lip,[[.47,-.026,.018],[.435,-.038,.029],[.395,-.050,.035],[.355,-.057,.040],[.327,-.05,.043]].map(([x,y,z])=>[x*size,y*size,z*size*side]));
      for(let i=0;i<3;i++){const gill=this.line(this.eelHead,'#163e44',5,.75),x=.294-i*.022;this.points(gill,[[x,.040,.036],[x-.010,.018,.048],[x-.009,-.008,.050],[x,-.035,.041],[x+.005,-.044,.034]].map(([xx,y,z])=>[xx*size,y*size,z*size*side]));}
    }
    this.eelBody={geometry,finGeometry,finMaterial,edge,rings,sides,size};this.animateSmoothEel(0,{state:'recover',skill:'rest',elapsed:0,duration:1});
  }

  animateSmoothEel(time,boss,pose=bossPose('stormeel',boss,time)) {
    const e=this.eelBody;if(!e)return;
    const {geometry,finGeometry,finMaterial,edge,rings,sides,size}=e,p=geometry.attributes.position,f=finGeometry.attributes.position,outline=[];
    for(let i=0;i<=rings;i++) {
      const t=i/rings,rear=clamp((t-.24)/.76,0,1),coil=pose.coil*rear*rear;
      const x=size*(.49-.98*t)+size*coil*.25,r=this.eelRadius(t,size);
      // The neck stays by the simulation weakpoint while the long rear body
      // curls back to charge, then sends an accelerating wave into the tail.
      const wave=Math.sin(time*pose.tailRate-t*7.2)*size*pose.tail*.60*t*t+Math.sin(rear*Math.PI*1.3)*size*coil*.29+size*pose.hitWobble*Math.sin(t*9);
      const roll=Math.sin(time*pose.tailRate*.6-t*5)*size*pose.tail*.2*t*t;
      for(let j=0;j<=sides;j++){const a=j/sides*TAU,lower=Math.max(0,-Math.cos(a)),mouth=Math.max(0,1-t/.18)*pose.jaw*lower; p.setXYZ(i*(sides+1)+j,x,wave+Math.cos(a)*r-size*.027*mouth,roll+Math.sin(a)*r*.66*(1+pose.gill*.1*Math.exp(-Math.pow((t-.23)/.08,2))));}
      const finFade=Math.sin(clamp((t-.09)/.91,0,1)*Math.PI),height=size*(.028+.032*Math.sin(t*Math.PI)) * finFade*(.80+pose.shock*.30+Math.sin(t*50-time*2.5)*.12);
      f.setXYZ(i*2,x,wave+r*.92,roll);f.setXYZ(i*2+1,x,wave+r+height,roll+Math.sin(time*2-t*12)*height*.16);
      outline.push([x,wave+r+height,roll+Math.sin(time*2-t*12)*height*.16]);
    }
    p.needsUpdate=true;geometry.computeVertexNormals();f.needsUpdate=true;finGeometry.computeVertexNormals();
    this.points(edge,outline);edge.material.opacity=boss.state==='telegraph'?.82:boss.state==='attack'?.95:.28;
    finMaterial.emissiveIntensity=boss.state==='attack'?.85:boss.state==='telegraph'?.45:.16;
    this.eelHead.position.y=Math.sin(time*pose.tailRate-.12*7.2)*size*pose.tail*.60*.12*.12+size*pose.hitWobble*Math.sin(.12*9);
  }

  createHazard(h) {
    const resourceStart=this.resources.length;
    const group = new THREE.Group(); this.hazardRoot.add(group);
    const color = h.color || '#eaa679', fill = this.material(color,.24), stroke = this.material(color,.9);
    fill.depthTest=false;stroke.depthTest=false;
    const kind = h.kind;
    if (kind === 'line') {
      const plate = new THREE.Mesh(this.own(new THREE.PlaneGeometry(1,1)),fill); group.add(plate);
      const borders=[];
      for(const side of [-1,1]) {const m=new THREE.Mesh(this.own(new THREE.PlaneGeometry(1,.38)),stroke);group.add(m);borders.push({m,side});}
      const current=this.line(group,'#d8ffff',33,.0);
      group.userData={plate,borders,fill,stroke,current};
    } else if (kind === 'ring') {
      const radius=Math.max(.01,h.radius||8),inner=Math.max(0,(h.innerRadius||0)/radius);
      const plate=new THREE.Mesh(this.own(new THREE.RingGeometry(.5,1,64)),fill);group.add(plate);
      const edge=new THREE.Mesh(this.own(new THREE.RingGeometry(.982,1,64)),stroke);group.add(edge);
      const innerEdge=new THREE.Mesh(this.own(new THREE.RingGeometry(.982,1,64)),stroke);group.add(innerEdge);
      group.userData={plate,fill,stroke,innerEdge};
    } else if (kind === 'cone') {
      const spread=h.spread||Math.PI*.32, shape=new THREE.Shape();shape.moveTo(0,0);
      for(let i=0;i<=32;i++) {const a=-spread*.5+spread*i/32;shape.lineTo(Math.cos(a),Math.sin(a));}shape.closePath();
      const plate=new THREE.Mesh(this.own(new THREE.ShapeGeometry(shape)),fill);group.add(plate);
      const rays=[];for(const a of [-spread*.5,spread*.5]) {const ray=this.line(group,color,2,.8);this.points(ray,[[0,0,.1],[Math.cos(a),Math.sin(a),.1]]);rays.push(ray);}
      const waves=[];for(let i=0;i<4;i++)waves.push(this.line(group,'#e3ffff',33,.0));
      group.userData={plate,fill,stroke,rays,waves,spread};
    } else {
      const rings=[];for(let i=0;i<4;i++) {const ring=new THREE.Mesh(this.own(new THREE.RingGeometry(.965,1,64)),stroke);group.add(ring);rings.push(ring);}
      const streams=[];for(let i=0;i<16;i++)streams.push(this.line(group,'#cef3e3',9,.0));
      group.userData={rings,fill,stroke,streams};
    }
    group.userData.resources=this.resources.slice(resourceStart);
    group.position.z=5.7;group.renderOrder=20;group.traverse(o=>{if(o.isMesh||o.isLine)o.renderOrder=20;});
    return group;
  }

  updateHazards(hunt,time) {
    const visible=new Set();
    for(const h of hunt.hazards||[]) {
      visible.add(h.id);let g=this.hazards.get(h.id);if(!g){g=this.createHazard(h);this.hazards.set(h.id,g);}
      g.visible=true;const u=g.userData,warning=h.stage==='warning',progress=clamp((h.age||0)/Math.max(.01,h.duration||1),0,1);
      u.fill.opacity=warning?.17+progress*.13:.31+Math.sin(time*10)*.04;
      u.stroke.opacity=warning?.72+progress*.25:1;
      if(h.kind==='line') {
        const dx=(h.toX??h.x)-h.x,dy=(h.toY??h.y)-h.y,length=Math.hypot(dx,dy),width=h.width||5;
        g.position.set((h.x+(h.toX??h.x))/2,(h.y+(h.toY??h.y))/2,5.7);g.rotation.z=Math.atan2(dy,dx);
        u.plate.scale.set(length,width,1);for(const {m,side}of u.borders){m.scale.x=length;m.position.y=side*width*.5;}
        u.current.material.opacity=warning?0:hunt.id==='stormeel'?.8:.28;
        const currentPoints=[];for(let i=0;i<33;i++){const q=i/32;currentPoints.push([(q-.5)*length,Math.sin(i*8.7+time*31)*(hunt.id==='stormeel'?width*.22:width*.045),.15]);}this.points(u.current,currentPoints);
      } else {
        g.position.set(h.x,h.y,5.7);g.rotation.z=h.angle||0;const radius=h.radius||16;
        g.scale.set(radius,radius,1);
        if(h.kind==='ring') {
          // The damaging band stays six units thick as the shockwave grows;
          // scaling an old ring alone would incorrectly widen the warning.
          const inner=clamp((h.innerRadius||0)/radius,0,1),position=u.plate.geometry.attributes.position;
          for(let i=0;i<position.count;i++){const a=(i%65)/64*TAU,r=i<65?inner:1;position.setXYZ(i,Math.cos(a)*r,Math.sin(a)*r,0);}
          position.needsUpdate=true;u.innerEdge.visible=inner>0;u.innerEdge.scale.setScalar(inner);
        }
        if(u.rings) for(let i=0;i<u.rings.length;i++){const q=(i/4+time*.24)%1;u.rings[i].scale.setScalar(.12+q*.88);u.rings[i].material.opacity=warning?.35:.6;}
        if(u.waves) for(let i=0;i<u.waves.length;i++) {
          const q=(i/u.waves.length+time*.9)%1,ps=[];
          for(let j=0;j<33;j++){const a=-u.spread*.5+u.spread*j/32;ps.push([Math.cos(a)*q,Math.sin(a)*q,.18]);}
          this.points(u.waves[i],ps);u.waves[i].material.opacity=warning?0:(1-q)*.72;
        }
        if(u.streams) for(let i=0;i<u.streams.length;i++) {
          const a=i/u.streams.length*TAU+time*.045,q=1-(time*.43+i*.13)%1,ps=[];
          for(let j=0;j<9;j++){const r=Math.max(.02,q-j*.009),theta=a+j*.015;ps.push([Math.cos(theta)*r,Math.sin(theta)*r,.18]);}
          this.points(u.streams[i],ps);u.streams[i].material.opacity=warning?.12:.66;
        }
      }
    }
    for(const [id,g]of this.hazards) if(!visible.has(id)) {
      g.removeFromParent();this.hazards.delete(id);const retired=new Set(g.userData.resources||[]);
      for(const r of retired)r.dispose?.();this.resources=this.resources.filter(r=>!retired.has(r));
    }
  }

  updatePlayer(player,time,pose,hunt) {
    this.playerHalo.visible=this.playerHaloInner.visible=!!hunt;
    if(hunt){this.playerHalo.position.set(player.x,player.y,8);this.playerHaloInner.position.set(player.x,player.y,2.95);this.playerHalo.material.opacity=pose.action==='hurt'?.85:.50+Math.sin(time*2)*.06;this.playerHalo.material.color.set(pose.action==='hurt'?'#ffa892':'#d3f5d5');}
    const aimX=player.aimX??player.x+12*pose.direction,aimY=player.aimY??player.y;
    const aimDX=aimX-player.x,aimDY=aimY-player.y,dist=Math.max(.001,Math.hypot(aimDX,aimDY));
    const nx=aimDX/dist,ny=aimDY/dist,mx=player.x+nx*2.7,my=player.y+ny*2.7;
    const aiming=pose.action==='aim';
    this.aimLine.visible=aiming;this.crosshair.visible=aiming;this.charge.visible=aiming;
    if(aiming){
      const range=hunt?Math.min(dist,60):Math.min(dist,12);
      this.points(this.aimLine,[[mx,my,4.1],[player.x+nx*range,player.y+ny*range,4.1]]);
      this.crosshair.position.set(aimX,aimY,5);this.crosshair.scale.setScalar(1+(1-(player.charge||0))*.6);this.crosshair.rotation.z=time;
      this.charge.position.set(player.x,player.y,4.5);this.charge.scale.setScalar(.7+(player.charge||0)*.5);this.charge.material.opacity=.18+(player.charge||0)*.62;
      this.charge.material.color.set((player.charge||0)>.8?'#ffe0a1':'#9ce9db');
    }
    const shooting=pose.action==='shoot'||pose.action==='recoil';
    this.flash.visible=shooting&&pose.progress<.4;
    if(this.flash.visible){this.flash.position.set(mx,my,4.5);this.flash.scale.setScalar(.35+(1-pose.progress)*.65);this.flash.material.opacity=(1-pose.progress)*.65;}
    const tether=hunt?.tether;
    const ordinaryTether=!hunt&&['shoot','recoil','reel','catch'].includes(pose.action);
    this.tether.visible=!!tether||ordinaryTether;
    this.harpoon.visible=ordinaryTether;
    if(this.tether.visible){
      let tx=tether?.x??aimX,ty=tether?.y??aimY;
      if(ordinaryTether&&shooting){const q=clamp(pose.progress*2.7,0,1);tx=mx+(tx-mx)*q;ty=my+(ty-my)*q;}
      if(ordinaryTether&&pose.action==='reel'){const q=1-.72*(1-(1-pose.progress)*(1-pose.progress));tx=mx+(tx-mx)*q;ty=my+(ty-my)*q;}
      if(ordinaryTether&&pose.action==='catch'){const q=.28*(1-pose.progress);tx=mx+(tx-mx)*q;ty=my+(ty-my)*q;}
      const pull=pose.action==='reel',sag=pull?.5:1.4;
      const points=[];for(let i=0;i<25;i++){const t=i/24;points.push([mx+(tx-mx)*t,my+(ty-my)*t-Math.sin(t*Math.PI)*sag+Math.sin(t*12+time*12)*(pull?.12:.035),4.4]);}
      this.points(this.tether,points);this.tether.material.color.set(tether?.quality>.65?'#ffe5ac':'#b9dfd3');
      this.harpoon.position.set(tx,ty,4.5);this.harpoon.rotation.z=Math.atan2(ty-my,tx-mx);
    }
    for(let i=0;i<this.wake.length;i++) {
      const m=this.wake[i];m.visible=pose.action==='dodge';if(!m.visible)continue;
      const q=i/this.wake.length;m.position.set(player.x-(player.vx||pose.direction*12)*q*.13,player.y-(player.vy||0)*q*.13,3.5);m.scale.set(1.1+q*1.5,.45+q*.6,1);m.rotation.z=Math.atan2(player.vy||0,player.vx||pose.direction);m.material.opacity=(1-q)*.38;
    }
  }

  update(hunt,player,time,pose) {
    time=hunt?.time??time;
    this.updatePlayer(player,time,pose,hunt);
    this.bossRoot.visible=!!hunt?.boss;
    this.hazardRoot.visible=!!hunt;
    this.shotRoot.visible=!!hunt;
    this.weakRing.visible=this.weakInner.visible=!!hunt?.boss?.weak;
    for(const m of this.weakCross)m.visible=!!hunt?.boss?.weak;
    if(!hunt?.boss){for(const m of this.effectMeshes)m.visible=false;for(const burst of this.hitBursts)burst.group.visible=false;this.cameraImpulse={x:0,y:0,amount:0};return;}
    const b=hunt.boss;this.ensureBoss(b);const facing=b.facing||-1;
    if(this.lastBossHp!==null&&b.hp<this.lastBossHp)this.recentHitAt=time;
    this.lastBossHp=b.hp;
    const motion=bossPose(b.kind,b,time,time-this.recentHitAt);
    this.lastBossPose=motion;
    this.bossRoot.position.set(b.x,b.y,0);this.bossVisual.scale.x=facing;
    this.bossVisual.rotation.z=0;
    this.bossAura.material.opacity=b.state==='telegraph'?.16+Math.sin(time*6)*.035:.025;
    this.bossAura.rotation.z=Math.sin(time*.25)*.03;
    if(b.kind==='stormeel'){
      this.animateSmoothEel(time,b,motion);
    }else{
      this.bossRig?.update(motion);
      for(const part of this.bossParts)if(part.object){const transformed=deformBossPoint(...part.rest,b.size,motion);part.object.position.set(...transformed);part.object.rotation.z=Math.sin(time*motion.tailRate)*motion.tail*.20;}
    }
    const shake=Math.abs(motion.impact)*.22+motion.hit*.16+motion.shock*.035;
    this.cameraImpulse={x:Math.sin(time*63)*shake,y:Math.cos(time*49)*shake*.65,amount:shake};
    const weak=b.weakpoint||{x:b.x+facing*b.size*.3,y:b.y,r:4.8};
    this.weakRing.position.set(weak.x,weak.y,5);this.weakRing.scale.setScalar((weak.r||4.8)*(1+Math.sin(time*5)*.025));
    this.weakInner.position.set(weak.x,weak.y,5.1);this.weakInner.scale.setScalar(weak.r||4.8);
    for(let i=0;i<4;i++){const a=i*Math.PI*.5+time*.3,m=this.weakCross[i];m.position.set(weak.x+Math.cos(a)*(weak.r+1.25),weak.y+Math.sin(a)*(weak.r+1.25),5.1);m.rotation.z=a+Math.PI*.5;}
    this.updateHazards(hunt,time);
    const shotIds=new Set();
    for(const p of hunt.projectiles||[]){shotIds.add(p.id);let m=this.projectiles.get(p.id);if(!m){const start=this.resources.length;m=this.arrow(this.shotRoot,'#e5f3db');m.userData.resources=this.resources.slice(start);this.projectiles.set(p.id,m);}m.visible=true;m.position.set(p.x,p.y,4.5);m.rotation.z=Math.atan2(p.vy,p.vx);m.scale.setScalar(.9+(p.charge||0)*.5);}
    for(const[id,m]of this.projectiles)if(!shotIds.has(id)) {
      m.removeFromParent();this.projectiles.delete(id);const retired=new Set(m.userData.resources||[]);
      for(const r of retired)r.dispose?.();this.resources=this.resources.filter(r=>!retired.has(r));
    }
    const effects=hunt.effects||[];
    this.effectMeshes.forEach((m,i)=>{const e=effects[i];m.visible=!!e;if(!e)return;const q=clamp((e.age||0)/Math.max(.1,e.life||.7),0,1);m.position.set(e.x,e.y,6);m.scale.setScalar((e.size||2)*(.25+q));m.material.opacity=(1-q)*.9;m.material.color.set(e.type==='hurt'?'#efa18f':e.type==='weak_hit'?'#ffe7a2':'#c7f9e1');});
    const hits=effects.filter(e=>['hit','weak_hit','reel'].includes(e.type)&&e.age<.65).slice(-8);
    this.hitBursts.forEach((burst,i)=>{
      const e=hits[i];burst.group.visible=!!e;if(!e)return;
      const q=clamp(e.age/.65,0,1),strong=e.type!=='hit',radius=(strong?7:3)*q,seed=(e.id||i)*1.731;
      burst.group.position.set(e.x,e.y,8);burst.flash.scale.setScalar((strong?2.5:1.2)*(1-q));burst.flash.material.opacity=Math.max(0,1-q*4)*.82;
      const a=burst.rays.geometry.attributes.position;
      for(let k=0;k<12;k++){const angle=k/12*TAU+seed,r=radius*(.75+.25*Math.sin(k*7+seed));a.setXYZ(k*2,Math.cos(angle)*r*.40,Math.sin(angle)*r*.40,0);a.setXYZ(k*2+1,Math.cos(angle)*r,Math.sin(angle)*r,0);}
      a.needsUpdate=true;burst.rays.geometry.computeBoundingSphere();burst.rays.material.opacity=(1-q)*.86;burst.rays.material.color.set(strong?'#ffedb3':'#c7e8e0');
      for(let k=0;k<8;k++){const angle=k/8*TAU+seed;this.chipDummy.position.set(Math.cos(angle)*radius*.65,Math.sin(angle)*radius*.65-q*q*1.4,0);this.chipDummy.rotation.set(q*9+k,q*6+k,q*4);this.chipDummy.scale.setScalar((strong?1.9:1.0)*(1-q));this.chipDummy.updateMatrix();burst.chips.setMatrixAt(k,this.chipDummy.matrix);}
      burst.chips.instanceMatrix.needsUpdate=true;burst.chips.material.opacity=(1-q)*.85;
    });
  }

  dispose() { this.bossRig?.dispose();this.bossRig=null;this.root.removeFromParent(); for(const r of this.resources)r.dispose?.();this.resources=[]; }
}
