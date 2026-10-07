import * as THREE from './vendor/build/three.module.js';
import {mergeGeometries,mergeVertices} from './vendor/examples/jsm/utils/BufferGeometryUtils.js';

// Continuous organic surfaces replace the old cylinders, balls and stacked
// ellipsoids. Generated coral GLBs remain the larger landscape landmarks.
export function naturalCoral(variant = 0, seed = 1) {
  let n = seed >>> 0;
  const rand = () => { n = (Math.imul(n, 1664525) + 1013904223) >>> 0; return n / 4294967296; };
  const geometries = [];
  function taper(points, radius) {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
    const g = new THREE.TubeGeometry(curve, 9, radius, 7, false), p = g.attributes.position;
    for (let i = 0; i <= 9; i++) {
      const t = i / 9, c = curve.getPointAt(t), r = Math.pow(1 - t, .65) * .78 + .10;
      for (let j = 0; j <= 7; j++) { const k = i * 8 + j; p.setXYZ(k,c.x+(p.getX(k)-c.x)*r,c.y+(p.getY(k)-c.y)*r,c.z+(p.getZ(k)-c.z)*r); }
    }
    g.computeVertexNormals(); geometries.push(g);
  }
  if (variant === 0) {
    taper([[0,0,0],[.06,.46,.02],[-.08,.95,-.03],[.04,1.57,.08]],.16);
    for (let i = 0; i < 8; i++) {
      const sign = i % 2 ? -1 : 1, by = .18 + i * .13;
      const ex = sign * (.42 + rand() * .48), ey = by + .28 + rand() * .32, ez = (rand()-.5)*.43;
      taper([[0,by,0],[ex*.34,by+.08,ez*.3],[ex*.8,ey-.19,ez*.8],[ex,ey,ez]],.088);
      for(let k=0;k<2;k++){
        const x=ex*(.51+k*.21), y=by+(ey-by)*(.45+k*.20), z=ez*.7;
        taper([[x,y,z],[x-sign*.035,y+.18,z+.03],[x+sign*(.09+rand()*.1),y+.30+rand()*.14,z+.06]],.039);
      }
    }
  } else if (variant === 1) {
    for (let layer = 0; layer < 4; layer++) {
      const segments=48,rings=5,pos=[],indices=[],radius=.83-layer*.12;
      const cx=(rand()-.5)*.30,cy=.15+layer*.27,cz=(rand()-.5)*.18,phase=rand()*6.28;
      for(let i=0;i<=rings;i++)for(let j=0;j<=segments;j++){
        const t=i/rings,a=j/segments*Math.PI*2,r=radius*t*(1+.10*Math.sin(a*5+phase)+.06*Math.cos(a*9-phase));
        pos.push(cx+Math.cos(a)*r,cy+.13*t*t+Math.sin(a*7+phase)*.025*t*t,cz+Math.sin(a)*r*.65);
        if(i<rings&&j<segments){const k=i*(segments+1)+j;indices.push(k,k+1,k+segments+1,k+1,k+segments+2,k+segments+1);}
      }
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(indices);g.computeVertexNormals();geometries.push(g);
      taper([[cx,0,cz],[cx+.02,cy*.45,cz],[cx,cy,cz]],.1);
    }
  } else {
    for(let stem=0;stem<5;stem++){
      const segments=18,rings=7,pos=[],indices=[],h=.46+rand()*.68,cx=(stem-2)*.31,cz=(rand()-.5)*.38,lean=(rand()-.5)*.24;
      // Outer wall and inner wall join around the lip, leaving a dark open cup.
      for(let side=0;side<2;side++)for(let i=0;i<=rings;i++)for(let j=0;j<=segments;j++){
        const t=i/rings,a=j/segments*Math.PI*2,outer=.115*(.72+.35*t+.22*Math.sin(t*Math.PI));
        const r=(side?outer*.65:outer)*(1+.05*Math.sin(a*5+t*9));
        pos.push(cx+lean*t*t+Math.cos(a)*r,h*(side?.18+t*.82:t),cz+Math.sin(a)*r);
        if(i<rings&&j<segments){const k=(side*(rings+1)+i)*(segments+1)+j;indices.push(k,k+1,k+segments+1,k+1,k+segments+2,k+segments+1);}
      }
      for(let j=0;j<segments;j++){const a=rings*(segments+1)+j,b=((rings+1)+rings)*(segments+1)+j;indices.push(a,b,a+1,a+1,b,b+1);}
      const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(indices);g.computeVertexNormals();geometries.push(g);
    }
  }
  for(const g of geometries)g.deleteAttribute('uv');
  const geometry=mergeGeometries(geometries,false);
  geometries.forEach(g=>g.dispose());
  const p=geometry.attributes.position,colors=new Float32Array(p.count*3);
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
    const grain=Math.sin(x*61+Math.sin(y*28))*Math.cos(z*55-y*71)*.035;
    const value=.71+Math.min(1,y/1.65)*.26+grain;
    colors[i*3]=value;colors[i*3+1]=value*.98;colors[i*3+2]=value*.94;
  }
  geometry.setAttribute('color',new THREE.BufferAttribute(colors,3));geometry.computeBoundingSphere();
  return geometry;
}

export function reefStoneGeometry() {
  const source=new THREE.IcosahedronGeometry(1,5);
  source.deleteAttribute('normal');source.deleteAttribute('uv');
  const geometry=mergeVertices(source);source.dispose();
  const p=geometry.attributes.position;
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
    const ridges=Math.sin(x*11+z*5)*Math.sin(y*9-z*3)*.09;
    const facets=Math.cos(x*23-y*16+z*21)*.018;
    const radius=1+ridges+facets+Math.sin(x*4+y*7)*.12;
    p.setXYZ(i,x*radius,y*radius,z*radius);
  }
  geometry.computeVertexNormals();geometry.computeBoundingSphere();return geometry;
}
