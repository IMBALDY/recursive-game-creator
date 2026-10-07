import * as THREE from './vendor/build/three.module.js';
import { mergeGeometries, mergeVertices } from './vendor/examples/jsm/utils/BufferGeometryUtils.js';
import { GLTFLoader } from './vendor/examples/jsm/loaders/GLTFLoader.js';
import { createDiverActionRig, animateDiver } from './action-rig.js';
import { HuntRenderer } from './hunt-renderer.js';
import { naturalCoral, reefStoneGeometry } from './reef-detail.js';
import { attachSwimMotion } from './swim-motion.js';

// A small, entirely local underwater art system. All motion is driven by update().
const TAU = Math.PI * 2;
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
function random(seed) {
  let s = seed >>> 0;
  return () => { s += 0x6D2B79F5; let t = s; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
function hashString(s) { let v = 2166136261; for (const c of String(s)) v = Math.imul(v ^ c.charCodeAt(0), 16777619); return v >>> 0; }
const PALETTES = {
  reef: { top: '#73d8d3', middle: '#218d9c', bottom: '#124b68', fog: '#327f8c', rock: '#8b9a85', rockLight: '#b2b59a', sand: '#c2c5a0', leaf: '#4a9e76', coral: ['#ee9979', '#e7c08e', '#bc7685', '#eeac88', '#80b9a1'], sun: '#fff2cc' },
  kelp: { top: '#a3d1b0', middle: '#358c86', bottom: '#12485b', fog: '#367c7a', rock: '#5d8576', rockLight: '#92a18a', sand: '#aaa985', leaf: '#719e51', coral: ['#d7ae75', '#cb8275', '#a0bfa0', '#daa287', '#c5b380'], sun: '#fff0ad' },
  cave: { top: '#72b9bd', middle: '#2b6e87', bottom: '#14364e', fog: '#296780', rock: '#577b83', rockLight: '#839596', sand: '#8caba6', leaf: '#518b91', coral: ['#c0a2b1', '#89b4bb', '#cab995', '#c69ca0', '#89bcbd'], sun: '#cfefee' },
  ruins: { top: '#83c6bc', middle: '#397c81', bottom: '#183f57', fog: '#356f79', rock: '#9b9d83', rockLight: '#c2bc99', sand: '#b9bb9f', leaf: '#5c977e', coral: ['#d89d73', '#a9c4b7', '#d5bb82', '#bb8da0', '#7eb5b1'], sun: '#ffe1ac' },
  abyss: { top: '#447e99', middle: '#214c71', bottom: '#0d213f', fog: '#23465e', rock: '#526477', rockLight: '#8296a5', sand: '#627e90', leaf: '#578c9a', coral: ['#b096cf', '#7bbfc8', '#d5a992', '#82a7d2', '#80c5bb'], sun: '#b9e1ff' },
};

export class OceanRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.16;
    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-33, 33, 18.56, -18.56, .1, 220);
    this.camera.position.set(32, 45, 70);
    this.camera.lookAt(32, 45, 0);
    this.worldGroup = new THREE.Group();
    this.scene.add(this.worldGroup);
    this.materials = new Map();
    this.geometry = {
      sphere: new THREE.SphereGeometry(1, 16, 10),
      detailed: new THREE.SphereGeometry(1, 24, 16),
      pebble: reefStoneGeometry(),
      lowSphere: new THREE.SphereGeometry(1, 9, 6),
      cylinder: new THREE.CylinderGeometry(1, 1, 1, 10),
      cone: new THREE.ConeGeometry(1, 1, 9),
      box: new THREE.BoxGeometry(1, 1, 1),
      ring: new THREE.TorusGeometry(1, .045, 5, 32),
    };
    this.hemi = new THREE.HemisphereLight('#defcf1', '#245464', 2.5);
    this.sun = new THREE.DirectionalLight('#fff2d5', 2.25);
    this.sun.position.set(-35, 70, 45);
    this.fill = new THREE.DirectionalLight('#80d3df', .8);
    this.fill.position.set(30, -10, 30);
    this.scene.add(this.hemi, this.sun, this.fill);
    this.fishObjects = new Map();
    this.swimRigs = [];
    this.reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches || false;
    this.giantObjects = new Map();
    this.nodeObjects = new Map();
    this.plants = [];
    this.rays = [];
    this.disposables = [];
    this.playerObject = this.makeDiver();
    this.scene.add(this.playerObject);
    this.effectsGroup = new THREE.Group();
    this.scene.add(this.effectsGroup);
    this.effectPool = [];
    for (let i = 0; i < 28; i++) {
      const m = new THREE.Mesh(new THREE.RingGeometry(.9, 1, 24), new THREE.MeshBasicMaterial({ color: '#e8ffe7', transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false }));
      m.visible = false;
      this.effectsGroup.add(m);
      this.effectPool.push(m);
    }
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.vector = new THREE.Vector3();
    this.cameraReady = false;
    this.lastTime = 0;
    this.residents = [];
    this.loadedModels = new Map();
    this.modelLoader = new GLTFLoader();
    this.paintings = new Map();
    this.paintingLoader = new THREE.TextureLoader();
    this.huntRenderer = new HuntRenderer(this);
    this.resize();
    this.loadGeneratedModels();
  }

  material(color, extra = {}) {
    const key = (color?.isColor ? color.getHexString() : String(color)) + JSON.stringify(extra);
    if (!this.materials.has(key)) this.materials.set(key, new THREE.MeshStandardMaterial({ color, roughness: .9, metalness: 0, ...extra }));
    return this.materials.get(key);
  }
  stoneMaterial(color) {
    const key = `stone:${color?.isColor ? color.getHexString() : color}`;
    if (!this.materials.has(key)) {
      const material = new THREE.MeshStandardMaterial({ color, roughness: 1, metalness: 0 });
      material.onBeforeCompile = shader => {
        shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vStonePosition;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvStonePosition=position;');
        shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `#include <common>
          varying vec3 vStonePosition;
          float stoneHash(vec3 p){p=fract(p*.1031);p+=dot(p,p.yzx+33.33);return fract((p.x+p.y)*p.z);}
          float stoneNoise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
            return mix(mix(mix(stoneHash(i),stoneHash(i+vec3(1,0,0)),f.x),mix(stoneHash(i+vec3(0,1,0)),stoneHash(i+vec3(1,1,0)),f.x),f.y),mix(mix(stoneHash(i+vec3(0,0,1)),stoneHash(i+vec3(1,0,1)),f.x),mix(stoneHash(i+vec3(0,1,1)),stoneHash(i+vec3(1,1,1)),f.x),f.y),f.z);}
        `).replace('#include <color_fragment>', `#include <color_fragment>
          float broad=stoneNoise(vStonePosition*.24)*2.-1.;
          float grain=stoneNoise(vStonePosition*1.7)*2.-1.;
          float fine=stoneNoise(vStonePosition*7.3)*2.-1.;
          diffuseColor.rgb*=.87+broad*.14+grain*.075+fine*.022;
          diffuseColor.rgb*=mix(vec3(.83,.94,.87),vec3(1.05,1.01,.93),broad*.5+.5);`);
      };
      material.customProgramCacheKey = () => 'natural-reef-stone-1';
      this.materials.set(key, material);
    }
    return this.materials.get(key);
  }
  mesh(parent, geom, color, x, y, z, sx = 1, sy = sx, sz = sx, extra = {}) {
    const m = new THREE.Mesh(typeof geom === 'string' ? this.geometry[geom] : geom, color?.isMaterial ? color : this.material(color, extra));
    m.position.set(x, y, z); m.scale.set(sx, sy, sz); parent.add(m); return m;
  }
  line(parent, points, color, opacity = 1) {
    const geo = new THREE.BufferGeometry().setFromPoints(points.map(p => new THREE.Vector3(...p)));
    const mat = new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity });
    const line = new THREE.Line(geo, mat); parent.add(line); this.disposables.push(geo, mat); return line;
  }
  tube(parent, points, radius, color, segments = 9) {
    const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)));
    const geo = new THREE.TubeGeometry(curve, segments, radius, 6, false);
    this.disposables.push(geo);
    return this.mesh(parent, geo, color, 0, 0, 0);
  }
  polygon(parent, coords, color, z = 0, extra = {}) {
    const shape = new THREE.Shape();
    coords.forEach((p, i) => i ? shape.lineTo(p[0], p[1]) : shape.moveTo(p[0], p[1]));
    shape.closePath();
    const geo = new THREE.ShapeGeometry(shape); this.disposables.push(geo);
    return this.mesh(parent, geo, color, 0, 0, z, 1, 1, 1, { side: THREE.DoubleSide, ...extra });
  }

  setWorld(world) {
    // Release level-specific geometry when revisiting any of the five regions.
    // Shared base geometry, generated GLBs and cached paintings stay reusable.
    if (this.worldDisposableStart !== undefined) for (const resource of this.disposables.splice(this.worldDisposableStart)) resource.dispose?.();
    this.worldDisposableStart = this.disposables.length;
    for (const resident of this.residents) resident.userData.actionRig?.dispose();
    for (const rig of this.swimRigs) rig.dispose();
    this.swimRigs = [];
    this.huntRenderer.reset();
    this.world = world;
    this.biome = world.biome || 'reef';
    this.palette = PALETTES[this.biome] || PALETTES.reef;
    this.rng = random(world.seed || 4217);
    this.worldGroup.clear();
    for (const f of this.fishObjects.values()) this.scene.remove(f);
    for (const g of this.giantObjects.values()) this.scene.remove(g);
    this.giantObjects.clear();
    this.generatedSceneryWorld = null;
    this.fishObjects.clear(); this.nodeObjects.clear(); this.plants = []; this.rays = []; this.residents = [];
    this.rayMaterial = null;
    const p = this.palette;
    this.scene.background = new THREE.Color(p.middle);
    this.scene.fog = new THREE.Fog(p.fog, 74, 118);
    this.sun.color.set(p.sun);
    this.sun.intensity = this.biome === 'abyss' ? 1.15 : this.biome === 'cave' ? 1.45 : 2.25;
    this.hemi.intensity = this.biome === 'abyss' ? 1.85 : this.biome === 'cave' ? 2.05 : 2.5;
    this.makeWater();
    this.makeDistantLandscape();
    this.makePaintedBackdrop();
    if (world.huntId) this.gardenAnchors = [];
    else this.makeReefGardens();
    this.makeSeabed();
    for (const obstacle of world.obstacles || []) this.makeObstacle(obstacle);
    if (world.huntId) this.makeArenaBoundary();
    else this.makeScenery();
    this.makeParticles();
    this.makeSurface();
    for (const f of world.fish || []) this.addFish(f);
    for (const n of world.nodes || []) this.addNode(n);
    this.batchStaticMeshes();
    this.installGeneratedAssets();
    this.cameraReady = false;
  }

  makePaintedBackdrop() {
    // A slow parallax painting adds habitat detail behind the playable geometry.
    // It never participates in collision, node discovery, or fish targeting.
    const biome = this.biome;
    let texture = this.paintings.get(biome);
    if (!texture) {
      texture = this.paintingLoader.load(`./assets/art/${biome}.png`);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = Math.min(4, this.renderer.capabilities.getMaxAnisotropy());
      this.paintings.set(biome, texture);
    }
    const material = new THREE.MeshBasicMaterial({map:texture, fog:false, toneMapped:false});
    this.paintedBackdrop = new THREE.Mesh(new THREE.PlaneGeometry(1,1), material);
    this.paintedBackdrop.position.z = -26;
    this.paintedBackdrop.renderOrder = -80;
    this.worldGroup.add(this.paintedBackdrop);
    this.disposables.push(this.paintedBackdrop.geometry, material);
  }

  makeWater() {
    const p = this.palette, world = this.world;
    this.waterMaterial = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 }, topColor: { value: new THREE.Color(p.top) }, midColor: { value: new THREE.Color(p.middle) }, lowColor: { value: new THREE.Color(p.bottom) }, worldHeight: { value: world.height }, cave: { value: this.biome === 'cave' ? 1 : 0 } },
      vertexShader: `varying vec3 vWorld; void main(){ vec4 w=modelMatrix*vec4(position,1.);vWorld=w.xyz;gl_Position=projectionMatrix*viewMatrix*w; }`,
      fragmentShader: `varying vec3 vWorld; uniform vec3 topColor,midColor,lowColor; uniform float time,worldHeight,cave;
        void main(){ float h=clamp(vWorld.y/worldHeight,0.,1.);vec3 col=mix(lowColor,midColor,smoothstep(0.,.72,h)); col=mix(col,topColor,pow(h,3.2)*.72);
        float a=sin(vWorld.x*.08+vWorld.y*.11+time*.055)*sin(vWorld.x*.034-vWorld.y*.065-time*.035);
        col+=a*.019;float shaft=pow(max(0.,sin(vWorld.x*.095+vWorld.y*.042+sin(time*.035)*.2)),14.);col+=vec3(.08,.13,.11)*shaft*pow(h,.7)*(1.-cave*.7);
        gl_FragColor=vec4(col,1.); #include <tonemapping_fragment> #include <colorspace_fragment> }`,
      depthWrite: false,
    });
    // Shader chunks require their own lines in GLSL.
    this.waterMaterial.fragmentShader = this.waterMaterial.fragmentShader.replace(' #include', '\n#include').replace(' #include', '\n#include').replace(' }', '\n}');
    const plane = new THREE.Mesh(new THREE.PlaneGeometry(world.width + 260, world.height + 180), this.waterMaterial);
    plane.position.set(world.width / 2, world.height / 2, -73); plane.renderOrder = -100;
    this.worldGroup.add(plane); this.disposables.push(plane.geometry, this.waterMaterial);
    if (this.biome !== 'cave') {
      const rayMat = new THREE.ShaderMaterial({
        uniforms: { time: { value: 0 }, tint: { value: new THREE.Color(this.palette.sun) } },
        vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
        fragmentShader: `varying vec2 vUv;uniform float time;uniform vec3 tint;void main(){float edge=pow(sin(vUv.x*3.14159),3.);float fade=smoothstep(0.,.3,vUv.y)*smoothstep(1.,.86,vUv.y);float waves=.7+.3*sin(vUv.y*11.+time*.4);gl_FragColor=vec4(tint,edge*fade*waves*.045);}`,
        transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide,
      });
      this.rayMaterial = rayMat; this.disposables.push(rayMat);
      for (let i = 0; i < 12; i++) {
        const ray = new THREE.Mesh(new THREE.PlaneGeometry(3 + this.rng() * 6, world.height * 1.35), rayMat);
        ray.position.set((i / 11) * world.width, world.height * .55, -20 - this.rng() * 13); ray.rotation.z = -.25;
        this.worldGroup.add(ray); this.rays.push(ray); this.disposables.push(ray.geometry);
      }
    }
  }

  makeDistantLandscape() {
    const w = this.world.width, h = this.world.height, rand = this.rng;
    for (let layer = 0; layer < 3; layer++) {
      const base = -4 + layer * 1.5;
      const points = [[-30, -25]];
      for (let x = -30; x < w + 36; x += 5) {
        const y = base + (layer === 0 ? h * .48 : layer === 1 ? h * .28 : 7) + Math.sin(x * .043 + layer * 3) * (layer === 0 ? 22 : 10) + Math.sin(x * .12 + layer) * 3 + rand() * 3;
        points.push([x, y]);
      }
      points.push([w + 40, -25]);
      const color = new THREE.Color(this.palette.bottom).lerp(new THREE.Color(this.palette.middle), .42 - layer * .1);
      const mat = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }); this.disposables.push(mat);
      const land = this.polygon(this.worldGroup, points, mat, -52 + layer * 11); land.renderOrder = -90 + layer;
      for (let i = 0; i < 16; i++) {
        const x = rand() * w, y = 1 + Math.sin(x * .043 + layer * 3) * 5;
        this.makePlant(x, y, -48 + layer * 11, 5 + rand() * 13, color, true, rand());
      }
    }
    // Broken ridgelines give the upper cave a continuous geological structure.
    if (this.biome === 'cave') {
      for (let layer = 0; layer < 2; layer++) {
        const points = [[-30, h + 30]];
        for (let x = -30; x < w + 35; x += 5) points.push([x, h - 6 - Math.sin(x * .09 + layer) * 4 - rand() * 7]);
        points.push([w + 40, h + 30]);
        const m = new THREE.MeshBasicMaterial({ color: layer ? '#27596a' : '#326e7b', side: THREE.DoubleSide }); this.disposables.push(m);
        this.polygon(this.worldGroup, points, m, -43 + layer * 18);
      }
    }
    // Quiet silhouettes well behind the playable layer.
    this.distantSchool = new THREE.Group(); this.worldGroup.add(this.distantSchool);
    const fishMat = new THREE.MeshBasicMaterial({ color: this.palette.bottom, transparent: true, opacity: .30, side: THREE.DoubleSide }); this.disposables.push(fishMat);
    for (let i = 0; i < 65; i++) {
      const x = rand() * w, y = 15 + rand() * (h - 25), s = .16 + rand() * .42;
      const body = this.mesh(this.distantSchool, 'lowSphere', fishMat, x, y, -35 - rand() * 12, s * 1.6, s * .5, s * .35);
      const tail = this.polygon(this.distantSchool, [[x - s, y], [x - s * 2.1, y + s * .65], [x - s * 2.1, y - s * .65]], fishMat, body.position.z);
      body.userData.origin = x; body.userData.phase = rand() * TAU; tail.userData.origin = 0; tail.userData.phase = body.userData.phase;
    }
  }

  makeSeabed() {
    const w = this.world.width, rand = this.rng, p = this.palette;
    const pts = [[-20, -14]];
    for (let x = -20; x <= w + 20; x += 3) pts.push([x, 1 + Math.sin(x * .084) * .45 + Math.sin(x * .23) * .3]);
    pts.push([w + 20, -14]);
    this.polygon(this.worldGroup, pts, p.sand, -2);
    for (let i = 0; i < 90; i++) {
      const x = rand() * w, y = rand() * 1.6 - .25, s = .12 + rand() * .48;
      this.mesh(this.worldGroup, 'pebble', i % 4 ? p.rockLight : '#c1c2a2', x, y, .5 + rand() * 2, s * 1.5, s * .62, s);
    }
    // A transparent moving caustic pattern falls across sand and rocks.
    this.causticMat = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 }, strength: { value: this.biome === 'cave' ? .0015 : .0045 } },
      vertexShader: `varying vec2 vWorld;void main(){vec4 w=modelMatrix*vec4(position,1.);vWorld=w.xy;gl_Position=projectionMatrix*viewMatrix*w;}`,
      fragmentShader: `varying vec2 vWorld;uniform float time,strength;void main(){vec2 p=vWorld*.9;float a=sin(p.x+sin(p.y*1.3+time*.3)*1.4+time*.17);float b=cos(p.y*1.4+sin(p.x*.8-time*.2)*1.2);float edge=pow(1.-abs(a*b),17.);gl_FragColor=vec4(.76,1.,.86,edge*strength);}`,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const c = new THREE.Mesh(new THREE.PlaneGeometry(w + 40, this.world.height + 20), this.causticMat); c.position.set(w / 2, this.world.height / 2, 5.5); c.renderOrder = 5;
    this.worldGroup.add(c); this.disposables.push(c.geometry, this.causticMat);
  }

  makeObstacle(o) {
    const rand = random(hashString(o.id || `${o.x},${o.y}`) + (this.world.seed || 1));
    const g = new THREE.Group(); g.position.set(o.x, o.y, -.6); this.worldGroup.add(g);
    const width = o.w || 8, height = o.h || 5, p = this.palette;
    const rockGeometry = mergeVertices(new THREE.IcosahedronGeometry(1, 3));
    const positions = rockGeometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
      const bump = 1 + .13 * Math.sin(x * 8 + z * 3) * Math.sin(y * 7 - z * 4) + .035 * Math.cos(y * 17 + x * 9);
      const shelf = y * .45 + Math.sign(y) * Math.pow(Math.abs(y), .62) * .55;
      positions.setXYZ(i, x * bump, shelf * (1 + .085 * Math.sin(x * 11 + z * 7)), z * bump);
    }
    rockGeometry.computeVertexNormals();
    this.disposables.push(rockGeometry);
    const body = this.mesh(g, rockGeometry, this.stoneMaterial(p.rock), 0, -.08 * height, -.5, width * .49, height * .48, Math.min(width, height) * .48 + 1);
    body.rotation.z = (rand() - .5) * .12;
    for (let j = 0; j < 4; j++) {
      const x = (rand() - .5) * width * .54, y = (rand() - .38) * height * .54;
      const c = new THREE.Color(p.rock).lerp(new THREE.Color(p.rockLight), .15 + Math.floor(rand() * 4) * .15);
      const rock = this.mesh(g, 'pebble', c, x, y, rand() * 1.1, width * (.14 + rand() * .17), height * (.2 + rand() * .15), 1.1 + rand() * 1.7);
      rock.rotation.set(rand() * .5, rand() * .5, rand() * .6);
    }
    for (let j = 0; j < 7; j++) {
      const nx = (rand() - .5) * 1.45, ny = (rand() - .5) * 1.45;
      const nz = Math.sqrt(Math.max(.08, 1 - nx * nx - ny * ny));
      const zz = nz * (Math.min(width, height) * .48 + 1) - .38;
      const r = .07 + rand() * .14;
      this.mesh(g, 'pebble', p.rockLight, nx * width * .46, ny * height * .44 - .08 * height, zz, r * 1.3, r, r * .4);
    }
    // Pale, rounded crust on the lit upper edge.
    for (let j = 0; j < Math.min(6, Math.ceil(width / 2)); j++) {
      const x = (j / Math.max(1, Math.ceil(width / 2) - 1) - .5) * width * .72;
      const y = height * (.36 - .13 * Math.abs(x / width));
      this.mesh(g, 'sphere', p.rockLight, x, y, .8, .8 + rand() * 1.5, .16 + rand() * .2, .8);
    }
    const count = Math.min(5, Math.max(1, Math.round(width / 4)));
    for (let j = 0; j < count; j++) {
      const x = o.x + (rand() - .5) * width * .62;
      const y = o.y + height * .37;
      if (this.biome === 'kelp' || rand() < .4) this.makePlant(x, y, 1 + rand(), 1.8 + rand() * (this.biome === 'kelp' ? 10 : 3), p.leaf, false, rand());
      else this.makeCoral(x, y, 1 + rand(), .7 + rand() * 1.3, p.coral[Math.floor(rand() * p.coral.length)], rand());
    }
    if (o.type === 'coral') for (let i = 0; i < 3; i++) this.makeCoral(o.x + (i - 1) * width * .2, o.y + height * .38, 2, 1 + rand() * 1.2, p.coral[i % p.coral.length], rand());
  }

  makeScenery() {
    const rand = this.rng, w = this.world.width, h = this.world.height, p = this.palette;
    // A reef face frames the entry without changing the open swimming corridor.
    const bankColor = new THREE.Color(p.rock).lerp(new THREE.Color(p.middle), .3);
    this.polygon(this.worldGroup, [[-30, 0], [-30, h - 13], [-5, h - 22], [2, h - 29], [9, h - 46], [3, h - 65], [15, h - 85], [20, 0]], bankColor, -11);
    for (let i = 0; i < 10; i++) {
      const xx = -4 + (i % 4) * 2.5, yy = h - 28 - Math.floor(i / 4) * 13;
      this.makeCoral(xx, yy, -8, 1.5 + rand(), p.coral[i % p.coral.length], rand());
      if (i % 2 === 0) this.makePlant(xx + 1, yy - .5, -9, 3 + rand() * 4, p.leaf, false, rand());
    }
    for (let i = 0; i < 62; i++) {
      const x = rand() * w, y = 1 + Math.sin(x * .084) * .4;
      if (i % 3 || this.biome === 'kelp') this.makePlant(x, y, i % 5 ? 1.5 : 7, 1.6 + rand() * (this.biome === 'kelp' ? 13 : 4), p.leaf, false, rand());
      else this.makeCoral(x, y, 1 + rand() * 3, .65 + rand() * 1.4, p.coral[i % p.coral.length], rand());
    }
    // Sparse plants behind the route create depth without concealing hazards.
    if (this.biome === 'kelp') for (let i = 0; i < 28; i++) this.makePlant(rand() * w, 2 + rand() * 10, -8 - rand() * 10, 14 + rand() * 24, '#4d806a', false, rand());
    // Natural recesses in the cavern: stalactite clusters and tiny cold-water anemones.
    if (this.biome === 'cave') for (let i = 0; i < 32; i++) {
      const x = rand() * w, s = 1 + rand() * 3.5;
      const rock = this.mesh(this.worldGroup, 'cone', p.rock, x, h - s * .5, -3, s * .65, s * 2.5, s * .6); rock.rotation.z = Math.PI;
      if (i % 4 === 0) this.makeCoral(x, 1 + rand() * 1.5, 2, .7, '#9fc4b4', rand());
    }
    if (this.biome === 'cave') {
      for (let i = 0; i < 6; i++) this.makeVent(22 + i * (w - 36) / 6, 1.1, i % 2 ? -5 : 1.3, 1 + rand() * .5);
    }
    for (const d of this.world.decor || []) {
      if (!Number.isFinite(d.x) || !Number.isFinite(d.y)) continue;
      const s = d.size || d.scale || 1;
      const baseRock = (this.world.obstacles || []).find(o => Math.abs(d.x - o.x) < o.w * .49 && Math.abs(d.y - o.y - o.h / 2) < 1.6);
      const yy = baseRock ? baseRock.y - baseRock.h * .03 + baseRock.h * .46 * Math.sqrt(Math.max(.1, 1 - Math.pow((d.x - baseRock.x) / (baseRock.w * .54), 2))) : d.y;
      if (d.type === 'kelp' || d.type === 'grass' || d.type === 'seaweed') this.makePlant(d.x, yy, d.z || 1.6, s * 3, d.color || p.leaf, false, rand());
      else if (d.type === 'coral' || d.type === 'anemone') this.makeCoral(d.x, yy, d.z || 1.6, s, d.color || p.coral[Math.floor(rand() * p.coral.length)], rand());
      else if (d.type === 'shell') this.makeShell(this.worldGroup, d.x, d.y, 2, s * .4, '#e5c0a0');
    }
  }

  makeArenaBoundary() {
    // Hunt collision is an open rectangle: scenery must describe that same
    // space. Reef shelves live outside its edges, never in the fighting lane.
    const {width:w,height:h}=this.world,p=this.palette,rand=this.rng;
    for(const side of [-1,1]) {
      for(let i=0;i<5;i++) {
        const x=side<0?-12:w+12,y=6+i*(h-12)/4;
        const distant=new THREE.Color(p.rock).lerp(new THREE.Color(p.middle),.55);
        this.mesh(this.worldGroup,'pebble',this.stoneMaterial(distant),x,y,-21,3.8+rand(),4+rand()*2,2);
        if(i%2===0)this.makeSeaFan(side<0?-4:w+4,y-3,-16,1.2+rand()*.5,p.coral[i%p.coral.length]);
      }
    }
    for(let i=0;i<20;i++) {
      const x=(i+.5)/20*w;
      this.mesh(this.worldGroup,'pebble',this.stoneMaterial(p.rockLight),x,-3,-5,4+rand()*2,3.5,3);
      if(i%3===0)this.makeCoral(x,-.5,-4,.7+rand()*.45,p.coral[i%p.coral.length],rand());
    }
  }

  makeReefGardens() {
    const rand = this.rng, p = this.palette, w = this.world.width, h = this.world.height;
    this.gardenAnchors = [];
    // These gardens occupy the rear wall of the bay. Their blue distance and
    // smaller silhouettes separate them from the brighter, collidable outcrops.
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 4; col++) {
        const x = 30 + col * (w - 42) / 4 + (row % 2 ? 19 : 0);
        const y = 16 + row * (h - 47) / 2 + (rand() - .5) * 8;
        const z = -17 - (col % 2) * 4;
        const stone = new THREE.Color(p.rock).lerp(new THREE.Color(p.middle), .60);
        const pale = new THREE.Color(p.rockLight).lerp(new THREE.Color(p.middle), .53);
        this.mesh(this.worldGroup, 'pebble', this.stoneMaterial(stone), x, y - 5, z - 4, 14, 7.2, 4);
        this.mesh(this.worldGroup, 'pebble', this.stoneMaterial(stone), x - 8, y - 2, z - 1, 8, 4.5, 3.1);
        this.mesh(this.worldGroup, 'pebble', this.stoneMaterial(pale), x + 7, y - 1.5, z - 1, 7, 3.7, 2.5);
        this.gardenAnchors.push({ x: x - 4, y: y + 1.5, z: z + 3 });
        for (let i = 0; i < 9; i++) {
          const xx = x - 14 + i * 3.2, yy = y + 1.3 - Math.abs(i - 4) * .16;
          const c = new THREE.Color(p.coral[(i + row + col) % p.coral.length]).lerp(new THREE.Color(p.middle), .24);
          if (this.biome === 'kelp' && i % 3) this.makePlant(xx, yy, z + 4, 6 + rand() * 11, '#648f61', true, rand());
          else this.makeCoral(xx, yy, z + 4, 1.2 + rand() * 1.1, c, i % 4 ? rand() * .3 : .38 + rand() * .25);
          if (i % 3 === 0) this.makePlant(xx + 1, yy, z + 4.5, 3.1 + rand() * 5, p.leaf, true, rand());
        }
        this.makeSeaFan(x + 6, y + 1.5, z + 4.5, 2.5 + rand(), p.coral[(col + 2) % p.coral.length]);
      }
    }
  }

  makeSeaFan(x, y, z, scale, color) {
    const g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(scale); this.worldGroup.add(g);
    const cooler = new THREE.Color(color).lerp(new THREE.Color(this.palette.middle), .2);
    this.tube(g, [[0, 0, 0], [.03, .47, 0], [0, .95, 0]], .054, cooler, 7);
    for (let i = 0; i < 11; i++) {
      const a = -.94 + i * .188, ex = Math.sin(a) * 1.58, ey = .4 + Math.cos(a) * 1.54;
      this.tube(g, [[0, .22, 0], [ex * .48, ey * .6, 0], [ex, ey, .015]], .023, cooler, 8);
      const jx = ex * .58, jy = ey * .65;
      this.tube(g, [[jx, jy, .02], [jx + .23, jy + .24, .025], [ex + .18, ey + .15, .02]], .012, cooler, 6);
    }
  }

  makePlant(x, y, z, height, color, distant = false, phase = 0) {
    const g = new THREE.Group(); g.position.set(x, y, z); this.worldGroup.add(g);
    const rand = random(Math.round((x + 20) * 783 + y * 227 + height * 519));
    const blades = distant ? 2 : height > 8 ? 2 : 3;
    const mat = distant ? new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }) : this.material(color, { side: THREE.DoubleSide });
    if (distant) this.disposables.push(mat);
    for (let i = 0; i < blades; i++) {
      const hi = height * (.64 + rand() * .36), lean = (rand() - .5) * height * .28, wid = Math.min(.4, hi * .045) * (distant ? 1.5 : 1);
      const curve = new THREE.CatmullRomCurve3([new THREE.Vector3((i - 1) * .18, 0, 0), new THREE.Vector3(lean * .3, hi * .38, 0), new THREE.Vector3(lean * .7 + .3, hi * .74, 0), new THREE.Vector3(lean, hi, 0)]);
      const points = curve.getPoints(10), coords = [];
      for (let k = 0; k < points.length; k++) coords.push([points[k].x - wid * Math.sin(Math.PI * (k + .4) / points.length), points[k].y]);
      for (let k = points.length - 1; k >= 0; k--) coords.push([points[k].x + wid * Math.sin(Math.PI * (k + .4) / points.length), points[k].y]);
      this.polygon(g, coords, mat, i * .08);
      if (height > 5 && !distant) for (let j = 2; j < 8; j++) {
        const t = j / 9, pp = curve.getPoint(t), sign = j % 2 ? 1 : -1;
        const leaf = this.mesh(g, 'sphere', color, pp.x + sign * height * .055, pp.y, .06, height * .08, height * .02, .055);
        leaf.rotation.z = sign * .6;
      }
    }
    g.userData = { phase: phase * TAU, strength: Math.min(.12, height * .007), animated: !distant };
    if (!distant) this.plants.push(g); return g;
  }

  makeCoral(x, y, z, scale, color, phase) {
    const variant = phase < .33 ? 0 : phase < .68 ? 1 : 2;
    const geometry = naturalCoral(variant, Math.floor(phase * 100000) + 177);
    this.disposables.push(geometry);
    const mat = this.material(color, {vertexColors:true,side:THREE.DoubleSide,roughness:.87});
    const coral = this.mesh(this.worldGroup,geometry,mat,x,y,z,scale,scale,scale);
    coral.rotation.y = Math.sin(phase*28)*.25;
    return coral;
  }

  makeParticles() {
    const rand = this.rng, count = 360, positions = new Float32Array(count * 3), seeds = new Float32Array(count);
    for (let i = 0; i < count; i++) { positions[i * 3] = rand() * (this.world.width + 20) - 10; positions[i * 3 + 1] = rand() * this.world.height; positions[i * 3 + 2] = -18 + rand() * 27; seeds[i] = rand(); }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(positions, 3)); geo.setAttribute('seed', new THREE.BufferAttribute(seeds, 1));
    this.particleMat = new THREE.ShaderMaterial({
      uniforms: { time: { value: 0 }, height: { value: this.world.height }, ratio: { value: this.renderer.getPixelRatio() } },
      vertexShader: `attribute float seed;varying float vA;uniform float time,height,ratio;void main(){vec3 p=position;p.y=mod(p.y+time*(.08+seed*.18),height);p.x+=sin(time*.13+seed*80.)*.8;vA=.1+seed*.24;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=(1.+seed*2.2)*ratio;}`,
      fragmentShader: `varying float vA;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;gl_FragColor=vec4(.83,1.,.93,vA*smoothstep(.5,.13,d));}`,
      transparent: true, depthWrite: false,
    });
    this.particles = new THREE.Points(geo, this.particleMat); this.worldGroup.add(this.particles); this.disposables.push(geo, this.particleMat);
    this.bubbles = new THREE.Group(); this.worldGroup.add(this.bubbles);
    const bubbleMat = new THREE.MeshBasicMaterial({ color: '#c5eff0', transparent: true, opacity: .34, depthWrite: false }); this.disposables.push(bubbleMat);
    for (let i = 0; i < 18; i++) {
      const b = this.mesh(this.bubbles, 'ring', bubbleMat, 0, 0, 3, .045 + rand() * .07); b.userData = { phase: i / 18, shift: rand() - .5 }; this.bubbles.add(b);
    }
  }

  makeSurface() {
    if (this.biome === 'cave') return;
    const y = this.world.surfaceY ?? this.world.height - .6, width = this.world.width;
    const water = new THREE.Mesh(new THREE.PlaneGeometry(width + 50, 1.8), new THREE.MeshBasicMaterial({ color: '#dafff0', transparent: true, opacity: .28, depthWrite: false }));
    water.position.set(width / 2, y, 2); this.worldGroup.add(water); this.disposables.push(water.geometry, water.material);
    for (let i = 0; i < 3; i++) {
      const ps = []; for (let x = -20; x < width + 20; x += 2) ps.push([x, y - i * .5 + Math.sin(x * .3 + i) * .18, 3]);
      this.line(this.worldGroup, ps, '#d5fff2', .3 - i * .07);
    }
  }

  makeDiver() {
    const g = new THREE.Group();
    const suit = '#e2ad61', dark = '#314d58', skin = '#dcb18b';
    this.mesh(g, 'sphere', suit, -.3, 0, 0, .78, .46, .42);
    this.mesh(g, 'sphere', dark, -.72, -.05, 0, .37, .39, .4);
    this.mesh(g, 'sphere', '#ecc49a', .61, .12, .03, .43, .43, .4);
    this.mesh(g, 'sphere', '#c48149', .48, .29, -.02, .38, .35, .34);
    this.mesh(g, 'sphere', '#243f4c', .76, .16, .33, .36, .26, .13);
    this.mesh(g, 'sphere', '#a8e7dc', .82, .2, .41, .28, .16, .045, { roughness: .24, metalness: .12 });
    this.mesh(g, 'sphere', '#e4fff0', .89, .24, .45, .09, .045, .008);
    this.mesh(g, 'sphere', dark, .89, -.06, .27, .13, .12, .12);
    this.mesh(g, 'sphere', '#7baba7', -.32, .5, -.13, .62, .26, .3, { metalness: .2, roughness: .48 });
    this.mesh(g, 'sphere', '#d1c5a2', -.87, .5, -.13, .10, .21, .24);
    this.mesh(g, 'sphere', dark, -.23, .52, .15, .09, .28, .08);
    this.mesh(g, 'sphere', dark, -.63, .44, .15, .065, .24, .08);
    this.tube(g, [[.86, -.07, .21], [.6, -.34, .2], [.13, -.24, .07], [-.77, .53, -.06]], .043, '#213c48', 12);
    const legs = [];
    for (let i = 0; i < 2; i++) {
      const leg = new THREE.Group(); leg.position.set(-.78, -.13, i ? .24 : -.24);
      this.mesh(leg, 'sphere', dark, -.38, -.05, 0, .58, .19, .2);
      const knee = new THREE.Group(); knee.position.set(-.77, -.04, 0); leg.add(knee);
      this.mesh(knee, 'sphere', suit, -.26, -.05, 0, .4, .155, .17);
      const fin = this.polygon(knee, [[-.48, .08], [-1.14, .12], [-1.40, -.16], [-.45, -.20]], '#cb7849', .035);
      this.line(knee, [[-.5, -.06, .075], [-1.28, -.04, .075]], '#e9b17a', .8);
      g.add(leg); legs.push({ leg, knee, fin });
    }
    const arms = [];
    for (let i = 0; i < 2; i++) {
      const arm = new THREE.Group(); arm.position.set(.1, -.2, i ? .47 : -.25);
      this.mesh(arm, 'sphere', suit, .28, -.15, 0, .36, .145, .145).rotation.z = -.35;
      this.mesh(arm, 'sphere', dark, .69, -.24, 0, .27, .11, .115);
      this.mesh(arm, 'sphere', skin, .96, -.24, 0, .15, .12, .115);
      g.add(arm); arms.push(arm);
    }
    const spear = new THREE.Group(); spear.position.set(.75, -.44, .45); g.add(spear);
    this.mesh(spear, 'cylinder', '#6b7c73', .62, 0, 0, .038, 1.75, .038).rotation.z = Math.PI / 2;
    this.polygon(spear, [[1.55, .1], [1.91, 0], [1.55, -.1]], '#d4ded0', 0);
    this.mesh(spear, 'box', '#594b3e', .1, -.10, 0, .3, .18, .16).rotation.z = -.3;
    // Soft lantern glow has no extra dynamic light or shadow-map cost.
    const glowMat = new THREE.ShaderMaterial({
      vertexShader: 'varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: 'varying vec2 vUv;void main(){float d=length((vUv-.5)*2.);gl_FragColor=vec4(.88,1.,.78,pow(max(0.,1.-d),3.)*.12);}',
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    });
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(7, 5), glowMat); glow.position.set(2, 0, -.6); g.add(glow);
    g.userData = { legs, arms, spear, glow, direction: 1, lean: 0 };
    g.scale.setScalar(1.05);
    if (this.loadedModels?.has('diver')) this.installDiverModel(g);
    return g;
  }

  fishStyle(species) {
    const id = String(species || '').toLowerCase();
    if (/shrimp|虾/.test(id)) return 'shrimp';
    if (/octopus|章鱼/.test(id)) return 'octopus';
    if (/crab|蟹/.test(id)) return 'crab';
    if (/shark|鲨/.test(id)) return 'shark';
    if (/moray|eel|鳗/.test(id)) return 'eel';
    if (/^ray$|manta|sting|魟|鳐/.test(id)) return 'ray';
    if (/cuttle|squid|乌贼/.test(id)) return 'cuttle';
    if (/parrot|wrasse|翠|莓/.test(id)) return 'wrasse';
    if (/grouper|石斑|斑岩/.test(id)) return 'grouper';
    if (/soldier|squirrel|暖灯|红瞳/.test(id)) return 'lantern';
    if (/lion|狮/.test(id)) return 'lion';
    if (/butter|angel|蝶|神仙|banner/.test(id)) return 'butterfly';
    if (/clown|小丑/.test(id)) return 'clown';
    if (/puffer|河豚/.test(id)) return 'puffer';
    if (/jelly|水母/.test(id)) return 'jelly';
    if (/tang|surgeon|蓝|刺尾/.test(id)) return 'tang';
    if (/tuna|金枪/.test(id)) return 'tuna';
    return 'small';
  }

  addFish(f) {
    const g = new THREE.Group(), style = this.fishStyle(f.species), tail = new THREE.Group();
    const color = f.color || ({ shark: '#7b9a9e', ray: '#809999', lion: '#c78567', butterfly: '#e6c969', clown: '#df8b50', puffer: '#bcb17a', jelly: '#d3c4bd', tang: '#659ebc', tuna: '#6a9da1', eel: '#8aab89', cuttle: '#c9b592', wrasse: '#79c3a8', grouper: '#afa581', lantern: '#e2ad7e', small: '#c2c99c' })[style];
    let body;
    const fins = [];
    if (style === 'eel') {
      this.tube(g, [[1.05, .02, 0], [.52, .04, 0], [-.26, -.05, 0], [-.92, .06, 0], [-1.7, -.09, 0]], .22, color, 16);
      this.mesh(g, 'sphere', color, 1.08, .02, .01, .43, .25, .25);
      this.mesh(g, 'sphere', '#243e3d', 1.25, .11, .235, .06, .065, .02);
      this.line(g, [[1.45, -.04, .15], [1.02, -.08, .23]], '#526e59');
      this.polygon(g, [[.35, .13], [.21, .40], [-1.46, .26], [-1.67, -.04]], '#97b18d', -.03);
      this.polygon(tail, [[0, 0], [-.4, .26], [-.72, 0], [-.3, -.21]], color); tail.position.x = -1.54; g.add(tail);
    } else if (style === 'cuttle') {
      this.mesh(g, 'sphere', color, -.25, 0, 0, 1, .46, .32);
      this.mesh(g, 'sphere', '#ddd1ad', .63, -.02, 0, .4, .31, .26);
      const skirt = this.mesh(g, 'sphere', '#d5c6a4', -.25, -.03, -.08, 1.1, .58, .14); fins.push(skirt);
      this.mesh(g, 'sphere', '#354a45', .69, .1, .27, .15, .085, .035);
      for (let i = 0; i < 5; i++) fins.push(this.tube(g, [[.79, -.1, 0], [1.1, -.07 + i * .065, .1], [1.43, -.27 + i * .12, .04]], .045, '#d6c5a3', 5));
      for (let i = 0; i < 4; i++) this.mesh(g, 'sphere', '#a69472', -.8 + i * .35, .07, .314, .065, .22, .023).rotation.z = -.2;
    } else if (style === 'ray') {
      body = this.mesh(g, 'sphere', color, 0, 0, 0, 1.18, .22, .66);
      for (const sign of [-1, 1]) {
        const wing = this.polygon(g, [[.73, 0], [-.45, sign * 1.04], [-1.02, sign * 1.2], [-.82, sign * .19]], color, .04); fins.push(wing);
      }
      this.tube(g, [[-.7, 0, 0], [-1.5, -.08, 0], [-2.3, -.18, .02]], .05, color, 8);
      this.mesh(g, 'sphere', '#2e454a', .54, .17, .4, .095, .065, .05);
    } else if (style === 'jelly') {
      this.mesh(g, 'sphere', color, 0, .25, 0, .72, .52, .46, { transparent: true, opacity: .78 });
      this.mesh(g, 'sphere', '#f2d6bc', 0, .3, .2, .4, .31, .28, { transparent: true, opacity: .62 });
      for (let i = 0; i < 5; i++) {
        const tentacle = this.tube(g, [[(i - 2) * .22, .1, .04], [(i - 2) * .24 + .12, -.6, .08], [(i - 2) * .22, -1.1 - i % 2 * .3, .04]], .025, '#dddcc6', 8); fins.push(tentacle);
      }
    } else {
      const wide = style === 'butterfly' || style === 'tang', shark = style === 'shark', puffer = style === 'puffer';
      body = this.mesh(g, 'sphere', color, 0, 0, 0, shark ? 1.55 : wide ? .93 : puffer ? .71 : 1.03, shark ? .38 : wide ? .68 : puffer ? .6 : .43, wide ? .23 : .34);
      this.mesh(g, 'sphere', '#d8d2ac', .12, shark ? -.17 : -.2, .03, shark ? 1.1 : .7, shark ? .20 : .21, .28);
      tail.position.set(shark ? -1.3 : -.86, 0, 0); g.add(tail);
      this.polygon(tail, [[0, 0], [shark ? -.88 : -.62, .49], [-.47, 0], [shark ? -.7 : -.62, -.49]], style === 'tang' ? '#e7cb65' : color, .02);
      const top = this.polygon(g, [[-.45, .24], [shark ? -.13 : -.45, shark ? 1.05 : .75], [.42, .23]], color, -.03); fins.push(top);
      this.polygon(g, [[.05, -.12], [-.46, -.58], [-.5, -.2]], color, .29);
      const eyeX = shark ? 1.1 : wide ? .62 : .68;
      this.mesh(g, 'sphere', '#efead0', eyeX, .13, .29, .105, .105, .055);
      this.mesh(g, 'sphere', '#203e45', eyeX + .035, .13, .335, .067, .075, .018);
      this.mesh(g, 'sphere', '#f8ffec', eyeX + .045, .16, .354, .019, .019, .008);
      this.line(g, [[eyeX + .20, -.05, .24], [eyeX + .26, -.09, .2]], '#506765', .65);
      if (style === 'butterfly' || style === 'clown') {
        const bands = style === 'clown' ? [-.55, .02, .56] : [-.4, .15];
        for (const xx of bands) {
          const hh = (style === 'clown' ? .35 : .56) * Math.sqrt(Math.max(.2, 1 - xx * xx));
          this.mesh(g, 'sphere', style === 'clown' ? '#f0e1c1' : '#414f47', xx, .03, .295, .075, hh, .045).rotation.z = -.1;
        }
      }
      if (style === 'tang') this.mesh(g, 'sphere', '#36576a', -.14, .12, .241, .65, .22, .025).rotation.z = .24;
      if (style === 'lion') {
        for (let i = 0; i < 5; i++) this.mesh(g, 'sphere', '#efe0bd', -.65 + i * .29, 0, .322, .045, .38, .025).rotation.z = -.26;
        for (let i = 0; i < 7; i++) {
          const xx = -.65 + i * .19;
          const spine = this.polygon(g, [[xx - .08, .25], [xx - .27, .83 + Math.sin(i) * .18], [xx + .06, .29]], i % 2 ? '#dcbd96' : '#9e725b', .01); fins.push(spine);
        }
        const fan = this.polygon(g, [[.18, 0], [-.75, -.86], [.38, -.68]], '#cba788', .36); fins.push(fan);
      }
      if (puffer) {
        for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; this.mesh(g, 'cone', '#d3c79c', Math.cos(a) * .64, Math.sin(a) * .55, .05, .06, .2, .06).rotation.z = a - Math.PI / 2; }
        for (let i = 0; i < 6; i++) this.mesh(g, 'sphere', '#777f64', -.4 + (i % 3) * .28, -.1 + Math.floor(i / 3) * .28, .323, .047, .05, .01);
      }
      if (shark) for (let i = 0; i < 3; i++) this.line(g, [[.51 - i * .13, .17, .332], [.43 - i * .13, -.12, .33]], '#506f75', .8);
      if (style === 'wrasse') {
        this.mesh(g, 'sphere', '#bedeb4', -.1, .07, .333, .78, .052, .023);
        this.mesh(g, 'sphere', '#8eafad', -.1, -.11, .337, .72, .044, .019);
      }
      if (style === 'grouper') for (let i = 0; i < 11; i++) this.mesh(g, 'sphere', '#757e69', -.65 + (i % 4) * .35, -.2 + Math.floor(i / 4) * .19, .337, .06, .045, .013);
      if (style === 'lantern') {
        this.mesh(g, 'sphere', '#f2e4bc', eyeX, .13, .33, .15, .15, .06);
        this.mesh(g, 'sphere', '#243e4b', eyeX + .025, .13, .385, .11, .12, .02);
        for (let i = 0; i < 4; i++) this.mesh(g, 'sphere', '#f2d7a3', -.58 + i * .27, -.23, .27, .046, .035, .02, { emissive: '#b87530', emissiveIntensity: .38 });
      }
    }
    const scale = clamp((Number(f.size) || 1.8) / 2.65, .2, 2.2);
    g.scale.setScalar(scale);
    g.position.set(f.x, f.y, .2);
    g.userData = { tail, fins, style, species: f.species, phase: (hashString(f.id) % 1000) / 1000 * TAU, direction: 1, lastX: f.x, lastY: f.y, scale };
    this.scene.add(g); this.fishObjects.set(f.id, g);
    this.installFishModel(g);
  }

  makeShell(parent, x, y, z, scale, color) {
    const shell = new THREE.Group(); shell.position.set(x, y, z); shell.scale.setScalar(scale); parent.add(shell);
    this.mesh(shell, 'sphere', color, 0, 0, 0, .8, .53, .25);
    for (let j = -2; j <= 2; j++) this.line(shell, [[0, -.38, .23], [j * .2, .22, .245]], '#f0d5b1', .75);
    return shell;
  }

  addNode(n) {
    const g = new THREE.Group(); g.position.set(n.x, n.y, 2.5); this.worldGroup.add(g);
    let ringColor = '#f4d99b';
    if (n.type === 'air') {
      this.mesh(g, 'cylinder', '#c2d0b1', 0, 0, 0, .49, 1.35, .4);
      this.mesh(g, 'sphere', '#dce8c5', 0, .69, 0, .48, .19, .39);
      this.mesh(g, 'box', '#557b77', 0, .1, .39, .78, .38, .09);
      this.mesh(g, 'cylinder', '#4d7170', 0, .98, 0, .1, .35, .1);
      this.mesh(g, 'box', '#e2c883', .2, 1.12, 0, .6, .12, .15);
      this.line(g, [[.1, .9, .25], [.64, .6, .3], [.63, -.2, .3]], '#405c5e'); ringColor = '#bce2ce';
    } else if (n.type === 'exit') {
      this.mesh(g, 'sphere', '#996c46', 0, .52, 0, 2.35, .57, .72);
      this.mesh(g, 'sphere', '#ccaa75', 0, .89, .03, 2.29, .13, .68);
      this.mesh(g, 'sphere', '#76634c', 0, .92, .03, 1.88, .1, .5);
      for (const yy of [.27, .49, .71]) this.line(g, [[-1.87, yy + .12, .43], [-.8, yy, .68], [.8, yy, .68], [1.87, yy + .12, .43]], '#ceb281', .7);
      for (const xx of [-1.13, 1.13]) this.mesh(g, 'box', '#c7ac7b', xx, 1, 0, .4, .13, 1.2);
      this.mesh(g, 'cylinder', '#ad8357', -.75, 1.36, .02, .38, .7, .35);
      for (const yy of [1.13, 1.52]) { const hoop = this.mesh(g, 'ring', '#576d67', -.75, yy, .02, .38, .38, .38); hoop.rotation.x = Math.PI / 2; }
      this.mesh(g, 'cylinder', '#aab7a1', .4, 1.24, .15, .26, .46, .25);
      const lifering = this.mesh(g, 'ring', '#e4b889', .7, .37, .69, .36, .36, .36); lifering.scale.z = 2.5;
      this.mesh(g, 'cylinder', '#9a956f', .25, 2.1, -.15, .043, 2.5, .043);
      this.polygon(g, [[.31, 3.33], [1.19, 3.1], [.31, 2.88]], '#e7bc7e', -.12);
      for (const xx of [-.48, -.05]) this.line(g, [[xx, .64, .72], [xx - .2, -2.8, .72]], '#c7c19b', .9);
      for (let i = 0; i < 6; i++) this.line(g, [[-.52 - i * .025, .1 - i * .47, .73], [-.09 - i * .025, .1 - i * .47, .73]], '#c7ac7b', .95);
      ringColor = '#ebd7a4';
    } else if (n.type === 'story') {
      this.mesh(g, 'box', '#ac9873', 0, -.05, 0, 1.25, .9, .5).rotation.z = -.13;
      this.mesh(g, 'box', '#dbcda2', .05, .05, .3, .91, .61, .03).rotation.z = -.13;
      this.line(g, [[-.26, .23, .33], [.35, .15, .33], [.31, -.15, .33], [-.23, -.08, .33]], '#7e927a', .8);
      this.mesh(g, 'sphere', '#dfb777', .35, -.2, .39, .10, .10, .05);
    } else if (n.type === 'shell') {
      this.makeShell(g, 0, 0, 0, 1, '#e6ba91');
    } else {
      this.mesh(g, 'box', '#987e59', 0, -.1, 0, 1.4, .8, .8);
      this.mesh(g, 'sphere', '#baa076', 0, .25, 0, .72, .28, .44);
      for (const x of [-.44, .44]) this.mesh(g, 'box', '#d3bd87', x, -.02, .43, .1, .83, .06);
      this.mesh(g, 'box', '#e2c993', 0, .06, .44, .18, .24, .08);
    }
    const mat = new THREE.MeshBasicMaterial({ color: ringColor, transparent: true, opacity: .4, depthWrite: false }); this.disposables.push(mat);
    const ring = this.mesh(g, 'ring', mat, 0, .05, -.6, 1.65, 1.65, 1.65);
    g.userData = { ring, y: n.y, type: n.type, phase: hashString(n.id) % 100 / 100 * TAU, animated: true };
    this.nodeObjects.set(n.id, g);
    if (n.type === 'story' && n.npc) {
      const visitor = this.makeDiver(); visitor.position.set(n.x - 2.7, n.y + .5, 2.6); visitor.scale.set(.88, .88, .88);
      visitor.userData.glow.visible = false;
      visitor.traverse(o => { if (o.isMesh && o.material?.color?.getHexString() === 'e2ad61') { o.material = o.material.clone(); o.material.color.set('#758274'); this.disposables.push(o.material); } });
      visitor.userData.baseY = n.y + .5; visitor.userData.phase = 1.5; visitor.userData.animated = true;
      this.worldGroup.add(visitor); this.residents.push(visitor);
    }
  }

  makeResident(x, y, index) {
    const g = new THREE.Group(); g.position.set(x, y, 2.7); this.worldGroup.add(g);
    const body = index ? '#a6c9aa' : '#96c8c0', fin = index ? '#c8b689' : '#d4b68f';
    this.mesh(g, 'sphere', body, 0, 0, 0, .62, .83, .43);
    this.mesh(g, 'sphere', body, 0, .88, .04, .79, .6, .42);
    this.mesh(g, 'sphere', '#d4ddba', 0, .69, .31, .48, .28, .17);
    for (const sign of [-1, 1]) {
      this.mesh(g, 'sphere', '#344b46', sign * .3, .93, .417, .104, .135, .039);
      this.mesh(g, 'sphere', '#f2efce', sign * .28, .98, .45, .033, .041, .012);
      this.mesh(g, 'sphere', '#d1a894', sign * .49, .71, .357, .15, .062, .033);
      for (let j = 0; j < 3; j++) {
        const leaf = this.mesh(g, 'sphere', fin, sign * (.72 + j * .12), .73 + j * .23, -.03, .36, .1, .1); leaf.rotation.z = sign * (.4 + j * .23);
      }
      this.mesh(g, 'sphere', body, sign * .51, -.08, .12, .18, .53, .19).rotation.z = sign * .35;
      this.mesh(g, 'sphere', fin, sign * .35, -.87, .05, .25, .35, .15).rotation.z = sign * .35;
    }
    this.line(g, [[-.12, .61, .49], [0, .58, .5], [.12, .61, .49]], '#738b70');
    this.mesh(g, 'sphere', '#697e54', 0, -.23, .05, .63, .34, .42);
    this.mesh(g, 'sphere', '#c0b88b', -.15, -.03, .465, .16, .16, .055);
    this.tube(g, [[-.37, .4, .26], [-.02, -.12, .46], [.48, -.4, .17]], .06, '#c7b389', 7);
    g.userData = { animated: true, baseY: y, phase: index * 2.8 };
    this.residents.push(g);
  }

  makeVent(x, y, z, scale) {
    const g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(scale); this.worldGroup.add(g);
    this.mesh(g, 'pebble', '#546e70', 0, .42, -.2, 1.9, .8, .9);
    for (let i = 0; i < 3; i++) {
      const xx = (i - 1) * .65, hh = 1 + i % 2 * .8;
      this.mesh(g, 'cone', '#657879', xx, hh * .5, 0, .51, hh, .43);
      this.mesh(g, 'sphere', '#cf9770', xx, hh * .81, .22, .13, .17, .035, { emissive: '#b35f35', emissiveIntensity: .35 });
    }
    for (let i = 0; i < 5; i++) {
      const xx = -1.7 + i * .8, hh = .6 + (i % 3) * .25;
      this.tube(g, [[xx, 0, .3], [xx + .13, hh * .6, .3], [xx + .08, hh, .31]], .07, '#c0c6b0', 5);
      this.mesh(g, 'sphere', '#c68876', xx + .08, hh + .06, .31, .20, .16, .13);
    }
  }

  batchStaticMeshes() {
    this.worldGroup.updateMatrixWorld(true);
    const batches = new Map();
    this.worldGroup.traverse(o => {
      if (!o.isMesh || !o.material?.isMeshStandardMaterial || o.material.transparent) return;
      for (let p = o; p && p !== this.worldGroup; p = p.parent) if (p.userData.animated) return;
      if (!batches.has(o.material)) batches.set(o.material, new Map());
      const layouts = batches.get(o.material);
      const layout = Object.keys(o.geometry.attributes).sort().map(name => {
        const a = o.geometry.attributes[name];
        return `${name}:${a.itemSize}:${a.normalized}:${a.array.constructor.name}`;
      }).join('|');
      if (!layouts.has(layout)) layouts.set(layout, []);
      layouts.get(layout).push(o);
    });
    for (const [material, layouts] of batches) for (const meshes of layouts.values()) {
      if (meshes.length < 4) continue;
      const geometries = meshes.map(m => (m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone()).applyMatrix4(m.matrixWorld));
      const merged = mergeGeometries(geometries, false);
      geometries.forEach(g => g.dispose());
      if (!merged) continue;
      this.disposables.push(merged);
      const mesh = new THREE.Mesh(merged, material); this.worldGroup.add(mesh);
      meshes.forEach(m => m.removeFromParent());
    }
  }

  async loadGeneratedModels() {
    // The manifest only exposes completed, locally stored generation results.
    let additions = [];
    try { const response = await fetch('./assets/model-index-v3.json'); const index = await response.json(); additions = (index.assets || []).filter(a => a.file && a.status === 'success').map(a => a.id); } catch { /* Existing assets remain available offline. */ }
    for (const id of ['coral_reef', 'tropical_fish', ...additions]) {
      this.modelLoader.load(`./assets/models/${id}.glb`, gltf => {
        if (this.destroyed) return;
        gltf.scene.traverse(o => {
          if (!o.isMesh) return;
          o.castShadow = false; o.receiveShadow = false;
          const materials = Array.isArray(o.material) ? o.material : [o.material];
          for (const m of materials) { if ('roughness' in m) m.roughness = Math.max(.72, m.roughness); if ('metalness' in m) m.metalness = 0; }
        });
        this.loadedModels.set(id, gltf.scene);
        if (id === 'diver') { this.installDiverModel(); for (const resident of this.residents) if (resident.userData.spear) this.installDiverModel(resident); }
        if (this.world) this.installGeneratedAssets();
      }, undefined, () => { /* Procedural art remains a complete local fallback. */ });
    }
  }

  normalizedModel(id, size = 1, ground = false) {
    const source = this.loadedModels.get(id); if (!source) return null;
    const visual = source.clone(true), oriented = new THREE.Group(); oriented.add(visual);
    // Each generated model's actual forward direction was visually reviewed.
    if (!['coral_reef', 'ancient_arch', 'harbor_tavern'].includes(id)) visual.rotation.y = ['whale_shark', 'shrimp'].includes(id) ? Math.PI / 2 : -Math.PI / 2;
    if (id === 'ancient_arch') visual.rotation.y = Math.PI / 2;
    if (id === 'harbor_tavern') visual.rotation.y = -.65;
    const bounds = new THREE.Box3().setFromObject(oriented), extents = bounds.getSize(new THREE.Vector3()), center = bounds.getCenter(new THREE.Vector3());
    visual.position.sub(center);
    if (ground) visual.position.y += extents.y / 2;
    const scale = size / Math.max(extents.x, extents.y, extents.z, .0001);
    oriented.scale.setScalar(scale); oriented.userData.generatedId = id;
    return oriented;
  }

  installFishModel(obj) {
    if (!obj || obj.userData.generated || !this.loadedModels) return;
    const id = ({butterfly:'tropical_fish', clown:'clownfish', wrasse:'parrotfish', grouper:'grouper', shrimp:'shrimp', octopus:'octopus', crab:'crab'})[obj.userData.style];
    if (!id || !this.loadedModels.has(id)) return;
    const model = this.normalizedModel(id, 2.65);
    obj.clear(); obj.add(model); obj.userData.generated = id;
    obj.userData.generatedVisual = model; obj.userData.fins = [];
    if (!['crab','octopus','shrimp'].includes(id)) {
      obj.userData.swimRig = attachSwimMotion(model,id,obj.userData.phase||0);
      this.swimRigs.push(obj.userData.swimRig);
    }
  }

  installDiverModel(diver = this.playerObject) {
    if (!diver || diver.userData.generated) return;
    const model = this.normalizedModel('diver', 4.2); if (!model) return;
    for (const child of diver.children) if (child !== diver.userData.spear && child !== diver.userData.glow) child.visible = false;
    const rig = createDiverActionRig(model);
    rig.visual.position.set(-.15, .04, 0); diver.add(rig.visual);
    diver.userData.generated = true; diver.userData.generatedVisual = rig.visual; diver.userData.actionRig = rig;
  }

  installGiantModels() {
    for (const giant of this.world.giants || []) {
      if (this.giantObjects.has(giant.id)) continue;
      const model = this.normalizedModel(giant.model || 'whale_shark', giant.size || 24); if (!model) continue;
      const group = new THREE.Group(); group.add(model);
      group.position.set(giant.x, giant.y, -6);
      group.userData = {generated:true, visual:model, phase:hashString(giant.id)%1000/1000*TAU, model:giant.model, lastX:giant.x, direction:1};
      group.userData.swimRig = attachSwimMotion(model,giant.model||'whale_shark',group.userData.phase);
      this.swimRigs.push(group.userData.swimRig);
      this.scene.add(group); this.giantObjects.set(giant.id, group);
    }
  }

  installGeneratedAssets() {
    if (!this.world) return;
    if (this.loadedModels.has('coral_reef') && this.assetWorld !== this.world) {
      this.assetWorld = this.world;
      const template = this.loadedModels.get('coral_reef');
      const selected = (this.world.obstacles || []).filter(o => o.w > 8 && o.y > 20 && o.y < this.world.height - 15).sort((a, b) => b.y - a.y).slice(0, this.biome === 'reef' ? 13 : 6);
      selected.forEach((o, i) => {
        const model = template.clone(true), scale = Math.min(o.w * .40, 5.3) * (this.biome === 'cave' ? .55 : 1);
        model.scale.setScalar(scale); model.rotation.y = (i % 3 - 1) * .45;
        model.position.set(o.x - o.w * .17, o.y + o.h * .4 + .43732 * scale, 1.6);
        this.worldGroup.add(model);
      });
      if (this.biome !== 'cave') {
        for (const [i, anchor] of (this.gardenAnchors || []).entries()) {
          if (i % 2) continue;
          const model = template.clone(true), scale = 3.8 + (i % 3)*.5;
          model.scale.setScalar(scale); model.rotation.y = (i % 3 - 1) * .5;
          model.position.set(anchor.x, anchor.y + .43732 * scale, anchor.z + 2);
          this.worldGroup.add(model);
        }
      }
    }
    for (const obj of this.fishObjects.values()) this.installFishModel(obj);
    this.installGiantModels();
    if (this.world.huntId) return;
    // Scenery stays behind the swimming layer and has no hidden collision.
    if (this.generatedSceneryWorld !== this.world) { this.generatedSceneryWorld = this.world; this.installedScenery = new Set(); }
    if (this.loadedModels.has('ancient_arch') && !this.installedScenery.has('ancient_arch')) {
      this.installedScenery.add('ancient_arch');
      const count = this.biome === 'ruins' ? 5 : this.biome === 'abyss' ? 3 : this.biome === 'cave' ? 2 : 1;
      for (let i = 0; i < count; i++) {
        const arch = this.normalizedModel('ancient_arch', this.biome === 'ruins' ? 22 : 16, true);
        arch.position.set(this.world.width * (.24 + .6 * (i + 1) / (count + 1)), this.world.height * (.13 + (i % 2) * .3), -10 - i % 2 * 2);
        arch.rotation.y = -.2 + (i % 3) * .15; this.worldGroup.add(arch);
      }
    }
    if (this.biome === 'reef' && this.loadedModels.has('harbor_tavern') && !this.installedScenery.has('harbor_tavern')) {
      this.installedScenery.add('harbor_tavern');
      const dock = this.normalizedModel('harbor_tavern', 18, true);
      dock.position.set(13, (this.world.surfaceY ?? this.world.height - .6) - 1, -4); dock.rotation.y = .25;
      this.worldGroup.add(dock);
    }
  }

  update(state, dt = 1 / 60) {
    if (!this.world || !state || !state.player) return;
    const time = Number(state.time) || 0, delta = clamp(dt, 0, .1), player = state.player;
    this.lastTime = time;
    this.waterMaterial.uniforms.time.value = time;
    if (this.rayMaterial) this.rayMaterial.uniforms.time.value = time;
    if (this.causticMat) this.causticMat.uniforms.time.value = time;
    if (this.particleMat) this.particleMat.uniforms.time.value = time;
    for (const p of this.plants) p.rotation.z = Math.sin(time * .6 + p.userData.phase + p.position.x * .045) * p.userData.strength;
    for (const r of this.residents) { r.position.y = r.userData.baseY + Math.sin(time * 1.1 + r.userData.phase) * .15; r.rotation.z = Math.sin(time * .8 + r.userData.phase) * .04; }
    if (this.distantSchool) for (const p of this.distantSchool.children) p.position.x = p.userData.origin + Math.sin(time * .065 + p.userData.phase) * 7;
    const diver = this.playerObject, d = diver.userData;
    const pose = animateDiver(diver, player, time, delta, this.biome);
    this.huntRenderer.update(state.hunt, player, time, pose);
    if (this.bubbles) for (const b of this.bubbles.children) {
      const age = (time * .27 + b.userData.phase) % 1;
      b.position.set(player.x - d.direction * age * 1.5 + b.userData.shift * .9 + Math.sin(age * 8) * .12, player.y + .35 + age * 3.8, 3.5);
      b.visible = age < .9;
    }
    for (const f of state.fish || []) {
      let obj = this.fishObjects.get(f.id); if (!obj) { this.addFish(f); obj = this.fishObjects.get(f.id); }
      obj.visible = f.alive !== false; if (!obj.visible) continue;
      const u = obj.userData, dx = f.x - u.lastX, dy = f.y - u.lastY;
      if (Math.abs(dx) > .003) u.direction = dx > 0 ? 1 : -1;
      obj.position.set(f.x, f.y, .15 + Math.sin(u.phase) * .3);
      obj.scale.x = u.scale * u.direction;
      obj.rotation.z = u.style === 'jelly' ? Math.sin(time * 1.2 + u.phase) * .08 : clamp(Math.atan2(dy, Math.max(.015, Math.abs(dx))) * .25, -.28, .28) * u.direction;
      u.tail.rotation.y = Math.sin(time * (f.alert ? 10 : 5) + u.phase) * .55;
      for (let j = 0; j < u.fins.length; j++) u.fins[j].rotation.x = Math.sin(time * 2.5 + u.phase + j * .6) * (u.style === 'ray' ? .48 : .1);
      if (u.generatedVisual) u.generatedVisual.rotation.y = Math.sin(time * 3.5 + u.phase) * .09;
      u.swimRig?.update(time,Boolean(f.alert||f.fear));
      if (u.style === 'jelly') obj.scale.y = u.scale * (1 + Math.sin(time * 2.4 + u.phase) * .07);
      u.lastX = f.x; u.lastY = f.y;
    }
    // Capture accounting happens once in game.js. For the remaining animation
    // the original fish mesh is carried by the line, without restoring its
    // collision/AI or adding a second inventory item.
    if (!state.hunt && player.caughtFishId && ['aim', 'shoot', 'recoil', 'reel', 'catch'].includes(pose.action)) {
      const caught = this.fishObjects.get(player.caughtFishId);
      if (caught) {
        caught.visible = true;
        const caughtScale = caught.userData.scale * (pose.action === 'catch' ? Math.max(.2, 1 - pose.progress * .45) : 1);
        caught.scale.set(caughtScale * caught.userData.direction, caughtScale, caughtScale);
        if (pose.action === 'reel' || pose.action === 'catch') {
          caught.position.copy(this.huntRenderer.harpoon.position);
          caught.position.z = 4.2;
          caught.rotation.z = Math.sin(time * 19) * .16;
        }
      }
    }
    for (const giant of state.giants || this.world.giants || []) {
      const obj = this.giantObjects.get(giant.id); if (!obj) continue;
      const u = obj.userData;
      // Slow local circuits keep enormous wildlife present beside its encounter.
      const orbit = Math.sin(time * .07 + u.phase), x = giant.x + orbit * 9;
      const dx = x - u.lastX; if (Math.abs(dx) > .003) u.direction = dx > 0 ? 1 : -1;
      obj.position.set(x, giant.y + Math.sin(time * .11 + u.phase) * 2, -6);
      obj.scale.x = u.direction; obj.rotation.z = Math.sin(time * .09 + u.phase) * .035 * u.direction;
      u.visual.rotation.x = (u.model === 'manta_ray' ? .15 : .04) + Math.sin(time * .55 + u.phase) * .055;
      u.visual.rotation.y = Math.sin(time * .32 + u.phase) * .08; u.lastX = x;
      u.swimRig?.update(time*.55);
    }
    for (const n of state.nodes || []) {
      const obj = this.nodeObjects.get(n.id); if (!obj) continue;
      obj.visible = !n.done || n.type === 'exit' || n.type === 'air';
      const u = obj.userData;
      if (u.type === 'exit') obj.position.y = u.y + Math.sin(time * 1.3) * .11;
      u.ring.material.opacity = .21 + (Math.sin(time * 2.1 + u.phase) + 1) * .08;
      u.ring.scale.setScalar(1.65 + Math.sin(time * 2.1 + u.phase) * .05);
    }
    const effects = state.effects || [];
    this.effectPool.forEach((m, i) => {
      const e = effects[i]; m.visible = !!e && (e.age || 0) < 1.1;
      if (!m.visible) return;
      const age = e.age || 0;
      m.position.set(e.x, e.y, 5); m.scale.setScalar(.25 + age * (e.type === 'hit' ? 2 : 3));
      m.material.opacity = Math.max(0, .8 - age);
      m.material.color.set(e.type === 'hit' || e.type === 'damage' ? '#eda07c' : e.type === 'catch' ? '#f6d792' : '#d3f0d4');
    });
    const aspect = this.width / this.height;
    let targetX, targetY;
    let viewHeight = state.mode === 'practice' ? 17 : aspect < 1 ? 43 : 37.125;
    if (state.hunt?.boss && this.world.huntId) {
      const boss = state.hunt.boss, margin = 13;
      const left = Math.min(player.x - 5, boss.x - boss.size * .60) - margin;
      const right = Math.max(player.x + 5, boss.x + boss.size * .60) + margin;
      const bottom = Math.min(player.y - 5, boss.y - boss.size * .29) - margin;
      const top = Math.max(player.y + 5, boss.y + boss.size * .31) + margin;
      viewHeight = Math.max(66, (right - left) / aspect, top - bottom);
      targetX = (left + right) * .5; targetY = (top + bottom) * .5;
      // Wide framing remains centered on both combatants, even at an arena
      // edge. The 54-unit boss is never clipped to keep the small diver large.
      this.viewHeight = this.cameraReady ? Math.max(viewHeight, (this.viewHeight || viewHeight) + (viewHeight - (this.viewHeight || viewHeight)) * (1 - Math.exp(-delta * 2))) : viewHeight;
    } else {
      this.viewHeight = viewHeight;
      const hx = viewHeight * aspect * .5, hy = viewHeight * .5;
      targetX = this.world.width < hx * 2 ? this.world.width / 2 : clamp(player.x + (player.vx || 0) * .65, hx - 1, this.world.width - hx + 1);
      targetY = this.world.height < hy * 2 ? this.world.height / 2 : clamp(player.y + 2, hy - 3, this.world.height - hy + 3);
    }
    const halfY = this.viewHeight * .5, halfX = halfY * aspect;
    this.camera.left = -halfX; this.camera.right = halfX; this.camera.top = halfY; this.camera.bottom = -halfY;
    this.camera.updateProjectionMatrix();
    const follow = state.hunt?.boss ? 1 : this.cameraReady ? 1 - Math.exp(-delta * 3.4) : 1;
    this.camera.position.x += (targetX - this.camera.position.x) * follow;
    this.camera.position.y += (targetY - this.camera.position.y) * follow;
    if (state.hunt && !this.reducedMotion) {
      let impact=0;
      for (const e of state.hunt.effects||[]) {
        const amplitude=({hurt:.48,reel:.28,weak_hit:.20})[e.type]||0;
        impact=Math.max(impact,amplitude*Math.max(0,1-e.age/.24));
      }
      const t=state.hunt.time;
      this.camera.position.x+=Math.sin(t*103)*impact;
      this.camera.position.y+=Math.cos(t*79)*impact*.7;
    }
    this.cameraReady = true;
    if (this.paintedBackdrop) {
      const viewW = halfX * 2, viewH = halfY * 2;
      const artH = Math.max(viewH * 1.2, viewW / (1672/941) * 1.2);
      const artW = artH * (1672/941);
      const parallaxX = (this.camera.position.x / this.world.width - .5) * (artW-viewW) * .6;
      const parallaxY = (this.camera.position.y / this.world.height - .5) * (artH-viewH) * .6;
      this.paintedBackdrop.scale.set(artW, artH, 1);
      this.paintedBackdrop.position.set(this.camera.position.x-parallaxX, this.camera.position.y-parallaxY, -26);
    }
    this.camera.updateMatrixWorld();
    this.renderer.render(this.scene, this.camera);
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.width = Math.max(1, rect.width || this.canvas.clientWidth || window.innerWidth);
    this.height = Math.max(1, rect.height || this.canvas.clientHeight || window.innerHeight);
    const aspect = this.width / this.height;
    const viewHeight = aspect < 1 ? 43 : 37.125;
    this.camera.left = -viewHeight * aspect / 2; this.camera.right = viewHeight * aspect / 2;
    this.camera.top = viewHeight / 2; this.camera.bottom = -viewHeight / 2;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height, false);
  }

  project(x, y) {
    this.vector.set(x, y, 3).project(this.camera);
    return { x: (this.vector.x + 1) * this.width / 2, y: (1 - this.vector.y) * this.height / 2, visible: Math.abs(this.vector.x) < 1.1 && Math.abs(this.vector.y) < 1.1 };
  }

  unproject(x, y) {
    this.vector.set(x / this.width * 2 - 1, 1 - y / this.height * 2, 0).unproject(this.camera);
    return { x: this.vector.x, y: this.vector.y };
  }

  raycast(x, y) {
    this.pointer.set(x / this.width * 2 - 1, 1 - y / this.height * 2);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    return this.raycaster.intersectObjects([...this.fishObjects.values(), ...this.nodeObjects.values()], true);
  }

  destroy() {
    this.destroyed = true;
    this.huntRenderer.dispose();
    this.playerObject.userData.actionRig?.dispose();
    for (const rig of this.swimRigs) rig.dispose();
    const geometries = new Set(), materials = new Set();
    this.scene.traverse(o => { if (o.geometry) geometries.add(o.geometry); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => materials.add(m)); });
    for (const g of Object.values(this.geometry)) geometries.add(g);
    for (const m of this.materials.values()) materials.add(m);
    for (const g of geometries) g.dispose(); for (const m of materials) m.dispose();
    for (const d of this.disposables) if (d.dispose) d.dispose();
    for (const painting of this.paintings.values()) painting.dispose();
    this.renderer.dispose();
    this.fishObjects.clear(); this.nodeObjects.clear();
  }
}
