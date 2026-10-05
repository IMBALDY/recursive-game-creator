'use strict';
(() => {
  const data = window.EXPLORATION_DATA;
  const $ = id => document.getElementById(id);
  const map = data.map, [gw, gh] = map.nav_grid_size, size = gw * gh;
  const colors = ['#237d88', '#83739d', '#ba8250'];
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const embedded = document.documentElement.dataset.embed === 'true';
  let surfaceVisible = !embedded;
  const duration = 18000, hold = 3200;
  let play = !reduced, speed = 1, elapsed = reduced ? duration : 0, previousTime = null;
  let lastProgress = -1, heatProgress = -1, totalSamples = 0;
  let visited = new Set(), rooms = new Set(), counts = new Float64Array(size);
  const indices = new Int32Array(48).fill(-1), episodeCells = data.tracks.map(() => new Set());
  const mask = new Uint8Array(size);
  data.mask.forEach(i => mask[i] = 1);
  const heat = document.createElement('canvas'); heat.width = gw; heat.height = gh;
  const heatContext = heat.getContext('2d'), heatImage = heatContext.createImageData(gw, gh);
  const ramps = [[0,[252,249,236]],[.08,[250,237,199]],[.22,[243,211,148]],[.45,[234,165,102]],[.7,[215,108,70]],[1,[150,54,51]]];
  const lut = Array.from({length:256}, (_,i) => {
    const t = i / 255;
    let j = 1; while (j < ramps.length - 1 && ramps[j][0] < t) j++;
    const [a, ac] = ramps[j-1], [b, bc] = ramps[j];
    return ac.map((c,k) => Math.round(c + (bc[k]-c)*(t-a)/(b-a)));
  });
  function polygon(ctx, points, fill, stroke, width=.2) {
    ctx.beginPath(); points.forEach((p,i) => i ? ctx.lineTo(p[0],p[1]) : ctx.moveTo(p[0],p[1])); ctx.closePath();
    if(fill){ctx.fillStyle=fill;ctx.fill();} if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}
  }
  function coordinates(ctx, canvas) { const s=canvas.width/147; ctx.setTransform(s,0,0,s,73*s,58*s); return s; }
  function guides(ctx, scale) {
    for(const [name,label] of [['site_a','A'],['site_b','B']]){
      const [x,,z]=map[name];ctx.beginPath();ctx.arc(x,z,1.5,0,2*Math.PI);ctx.fillStyle='#314c4c';ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=.4;ctx.stroke();
      ctx.fillStyle='#fff';ctx.font='bold 1.8px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,x,z+.06);
    }
    const [x,,z]=map.training_spawn, star=[];
    for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?.85:2.15;star.push([x+Math.cos(a)*r,z+Math.sin(a)*r]);}
    polygon(ctx,star,'#2f4b42','#fff',.42);
  }
  function makePanel(id){
    const canvas=$(id),ctx=canvas.getContext('2d');
    const base=document.createElement('canvas'),walls=document.createElement('canvas');
    function resize(){
      const ratio=Math.min(devicePixelRatio||1,2),width=Math.max(300,Math.round(canvas.getBoundingClientRect().width*ratio));
      canvas.width=width;canvas.height=Math.round(width*115/147);base.width=walls.width=width;base.height=walls.height=canvas.height;
      const b=base.getContext('2d'),w=walls.getContext('2d');coordinates(b,base);coordinates(w,walls);
      polygon(b,map.boundary.map(([x,z])=>[x+.55,z+.75]),'#dce0d880');
      polygon(b,map.boundary,'#f2f3ef','#a8b6b8',.45);
      map.rooms.forEach(r=>polygon(b,r.polygon,'#e7ece7','#c7d2d0',.12));
      map.obstacles.forEach(p=>polygon(w,p.map(([x,z])=>[x+.25,z+.3]),'#879b982a'));
      map.obstacles.forEach(p=>polygon(w,p,'#b8c6c8','#99aeaf',.11));
    }
    resize(); return {canvas,ctx,base,walls,resize};
  }
  const left=makePanel('gui-map'),right=makePanel('policy-map');
  const gui=data.schematic.map(points=>{const lengths=[0];for(let i=1;i<points.length;i++)lengths.push(lengths[i-1]+Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]));return {points,lengths,total:lengths.at(-1)};});
  function resetEvidence(){
    counts.fill(0);indices.fill(-1);episodeCells.forEach(s=>s.clear());visited.clear();rooms.clear();totalSamples=0;heatProgress=-1;
  }
  function collect(progress){
    if(progress<lastProgress) resetEvidence();
    data.tracks.forEach((tr,e)=>{
      const t=progress*tr.seconds;
      while(indices[e]+1<tr.points.length && tr.points[indices[e]+1][0]<=t+1e-7 && progress>0){
        const point=tr.points[++indices[e]],[,x,z,hi,ci,ri]=point;
        if(!episodeCells[e].has(hi)){episodeCells[e].add(hi);counts[hi]++;}
        if(ci>=0)visited.add(ci);if(ri>=0)rooms.add(ri);totalSamples++;
      }
    });
    lastProgress=progress;
  }
  function updateHeat(){
    let field=Float64Array.from(counts),diff=new Float64Array(size);
    for(let step=0;step<8;step++){
      diff.fill(0);
      for(const [a,b] of data.edges){const flux=.2*(field[b]-field[a]);diff[a]+=flux;diff[b]-=flux;}
      for(let i=0;i<size;i++)field[i]+=diff[i];
    }
    for(let i=0;i<size;i++){
      const v=Math.max(0,Math.min(1,field[i]/data.peak)),rgb=lut[Math.round(255*Math.pow(v,.72))],p=i*4;
      heatImage.data[p]=rgb[0];heatImage.data[p+1]=rgb[1];heatImage.data[p+2]=rgb[2];
      heatImage.data[p+3]=mask[i]?Math.round(255*.9*Math.pow(Math.min(1,v/.025),.65)):0;
    }
    heatContext.putImageData(heatImage,0,0);
  }
  function playhead(ctx,p,color,scale,large=false){
    ctx.beginPath();ctx.arc(p[0],p[1],large?1.55:1.05,0,Math.PI*2);ctx.fillStyle=large?'#ffffffaa':'#ffffff55';ctx.fill();
    ctx.beginPath();ctx.arc(p[0],p[1],large?.96:.61,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=large?.35:.2;ctx.stroke();
  }
  function paintGui(progress){
    const {ctx,canvas,base,walls}=left;ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(base,0,0);ctx.drawImage(walls,0,0);
    const scale=coordinates(ctx,canvas);
    gui.forEach((r,index)=>{
      const q=Math.min(1,progress*1.35),distance=q*r.total;
      let i=0;while(i+1<r.points.length&&r.lengths[i+1]<=distance)i++;
      const p=r.points[i].slice();
      if(i+1<r.points.length){const f=(distance-r.lengths[i])/(r.lengths[i+1]-r.lengths[i]);p[0]+=(r.points[i+1][0]-p[0])*f;p[1]+=(r.points[i+1][1]-p[1])*f;}
      ctx.beginPath();ctx.moveTo(...r.points[0]);for(let j=1;j<=i;j++)ctx.lineTo(...r.points[j]);ctx.lineTo(...p);
      ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=1.2;ctx.strokeStyle='#ffffffdf';ctx.stroke();ctx.lineWidth=.68;ctx.strokeStyle=colors[index];ctx.stroke();
      if(progress>0)playhead(ctx,p,colors[index],scale,true);
    });guides(ctx,scale);
  }
  function paintPolicy(progress){
    const {ctx,canvas,base,walls}=right;ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(base,0,0);
    const scale=coordinates(ctx,canvas);
    ctx.save();polygon(ctx,map.boundary);ctx.clip();ctx.imageSmoothingEnabled=true;
    ctx.drawImage(heat,map.nav_min[0]-.5,map.nav_min[1]-.5,gw,gh);ctx.restore();
    // Source wall polygons always remain crisp over the display-only heat.
    ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(walls,0,0);coordinates(ctx,canvas);
    data.tracks.forEach((tr,e)=>{
      const i=indices[e];if(i<0)return;
      const t=progress*tr.seconds,point=tr.points[i],p=[point[1],point[2]];
      if(i+1<tr.points.length){const next=tr.points[i+1],dt=next[0]-point[0],f=dt>0?Math.min(1,(t-point[0])/dt):1;p[0]+=(next[1]-p[0])*f;p[1]+=(next[2]-p[1])*f;}
      if($('trails').checked){
        ctx.beginPath();ctx.moveTo(tr.points[0][1],tr.points[0][2]);for(let j=1;j<=i;j++)ctx.lineTo(tr.points[j][1],tr.points[j][2]);ctx.lineTo(...p);
        ctx.lineWidth=.23;ctx.lineJoin='round';ctx.lineCap='round';ctx.strokeStyle=progress>=1?'#9b613829':'#9b61383a';ctx.stroke();
        // A short darker tail makes each moving policy cursor easy to follow.
        if(progress<1){ctx.beginPath();const first=Math.max(0,i-8);ctx.moveTo(tr.points[first][1],tr.points[first][2]);for(let j=first+1;j<=i;j++)ctx.lineTo(tr.points[j][1],tr.points[j][2]);ctx.lineTo(...p);ctx.strokeStyle='#8749319a';ctx.lineWidth=.35;ctx.stroke();}
      }
      if(progress<1)playhead(ctx,p,'#6d482e',scale);
    });guides(ctx,scale);
  }
  function render(progress,force=false){
    collect(progress);
    if(force || Math.abs(progress-heatProgress)>.005 || (progress!==heatProgress && (progress===0 || progress===1))){updateHeat();heatProgress=progress;}
    paintGui(progress);paintPolicy(progress);
    $('coverage').innerHTML=(100*visited.size/data.metrics.eligible_cells).toFixed(1)+'<span>%</span>';
    $('rooms').innerHTML=rooms.size+'<span> / 11</span>';
    $('sample-count').textContent=totalSamples.toLocaleString('en-US')+' / 17,847 position samples';
    $('timeline').value=Math.round(progress*1000);$('progress').value=Math.round(progress*100)+'%';
    $('status').textContent=progress>=1?'Recorded coverage revealed':play?'Revealing recorded paths':'Paused';
    $('status-dot').classList.toggle('paused',!play);
    $('toggle').textContent=play?'Ⅱ Pause':progress>=1?'↻ Replay':'▶ Play';
  }
  function tick(now){
    const dt=previousTime===null?0:Math.min(now-previousTime,100);previousTime=now;
    if(play && surfaceVisible && !document.hidden){
      elapsed+=dt*speed;
      if(elapsed>duration+hold){if($('loop').checked)elapsed=0;else{play=false;elapsed=duration;}}
      render(Math.min(1,elapsed/duration));
    }
    requestAnimationFrame(tick);
  }
  $('toggle').addEventListener('click',()=>{if(!play&&elapsed>=duration)elapsed=0;play=!play;previousTime=null;render(Math.min(1,elapsed/duration),true);});
  $('replay').addEventListener('click',()=>{elapsed=0;play=true;previousTime=null;render(0,true);});
  $('timeline').addEventListener('input',()=>{play=false;elapsed=Number($('timeline').value)/1000*duration;render(elapsed/duration,true);});
  $('speed').addEventListener('change',()=>{speed=Number($('speed').value);});
  $('trails').addEventListener('change',()=>render(Math.min(1,elapsed/duration),true));
  document.addEventListener('visibilitychange',()=>{previousTime=null;});
  let resizing;
  addEventListener('resize',()=>{clearTimeout(resizing);resizing=setTimeout(()=>{left.resize();right.resize();render(Math.min(1,elapsed/duration),true);},100);});
  if (embedded) {
    const parentOrigin = location.origin;
    addEventListener('message', event => {
      if (event.source !== parent || event.origin !== parentOrigin || event.data?.type !== 'exploration-visibility') return;
      surfaceVisible = event.data.visible === true;
      previousTime = null;
    });
    let lastHeight = 0;
    const reportSize = () => {
      const height = Math.ceil(document.querySelector('main').getBoundingClientRect().height);
      if (height === lastHeight) return;
      lastHeight = height;
      parent.postMessage({type: 'exploration-height', height}, parentOrigin);
    };
    new ResizeObserver(reportSize).observe(document.querySelector('main'));
    parent.postMessage({type: 'exploration-ready'}, parentOrigin);
    reportSize();
  } else {
    new IntersectionObserver(entries => {
      surfaceVisible = entries[0].isIntersecting;
      previousTime = null;
    }).observe(document.querySelector('.figure'));
  }
  render(reduced?1:0,true);requestAnimationFrame(tick);
})();
