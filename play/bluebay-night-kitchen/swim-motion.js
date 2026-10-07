// Each fish owns its shader uniforms; source GLB materials/textures stay shared
// and untouched. Motion is evaluated on the GPU, avoiding CPU vertex copies.
export function attachSwimMotion(model, kind, phase=0) {
  const entries=[];
  model.traverse(mesh=>{
    if(!mesh.isMesh)return;
    const materials=Array.isArray(mesh.material)?mesh.material:[mesh.material];
    const cloned=materials.map(source=>{
      const material=source.clone(),clock={value:phase},speed={value:1};
      mesh.geometry.computeBoundingBox();
      const box=mesh.geometry.boundingBox,zLength=Math.max(.001,box.max.z-box.min.z),zCenter=(box.max.z+box.min.z)*.5;
      material.onBeforeCompile=shader=>{
        shader.uniforms.uSwimTime=clock;shader.uniforms.uSwimSpeed=speed;
        shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nuniform float uSwimTime;\nuniform float uSwimSpeed;');
        const headSign=kind==='whale_shark'?1:-1;
        const motion=kind==='manta_ray'
          ? `float wing=pow(clamp(abs(transformed.x)/${Math.max(.001,box.max.x-box.min.x).toFixed(6)}*2.,0.,1.),1.5); transformed.y+=sin(uSwimTime*1.8-wing*1.4)*wing*${(zLength*.12).toFixed(6)};`
          : `float back=clamp(.5-(transformed.z-${zCenter.toFixed(6)})/${zLength.toFixed(6)}*${headSign.toFixed(1)},0.,1.); float sway=sin(uSwimTime*(3.2+uSwimSpeed*1.3)-back*5.8); transformed.x+=sway*back*back*${(zLength*.06).toFixed(6)}; transformed.y+=sin(uSwimTime*1.3-back*4.)*back*back*${(zLength*.009).toFixed(6)};`;
        shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n'+motion);
      };
      material.customProgramCacheKey=()=>`bluebay-v5-swim-${kind}-${zLength.toFixed(6)}-${zCenter.toFixed(6)}`;
      entries.push({material,clock,speed});return material;
    });
    mesh.material=Array.isArray(mesh.material)?cloned:cloned[0];
    mesh.frustumCulled=false;
  });
  return {update(time,alert=false){for(const e of entries){e.clock.value=time+phase;e.speed.value=alert?2.1:1;}},dispose(){for(const e of entries)e.material.dispose();}};
}
