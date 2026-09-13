import * as T from 'three';
// Repeatable numerical microstructure, not photographic texture claims.
function texture(kind){
  const n=128,data=new Uint8Array(n*n*4);
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){
    const seed=Math.sin(x*127.1+y*311.7)*43758.5453,noise=seed-Math.floor(seed);
    const v=kind==='wood'?.5+.2*Math.sin(x*.65+Math.sin(y*.04)*2)+.08*noise:kind==='linen'?.5+.15*Math.sin(x*Math.PI/2)+.15*Math.sin(y*Math.PI/2)+.05*noise:.5+(noise-.5)*.3;
    const i=(y*n+x)*4;data[i]=data[i+1]=data[i+2]=Math.round(v*255);data[i+3]=255;
  }
  const t=new T.DataTexture(data,n,n);t.wrapS=t.wrapT=T.RepeatWrapping;t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;return t;
}
export function materialLibrary(){
  const grain=texture('wood'),weave=texture('linen'),noise=texture('plaster'),cache=new Map();
  const get=(name,color)=>{
    let type='matte';
    if(/oak|floorboard|table|cabinet|chair|headboard|leg|vanity/.test(name))type='wood';
    if(/sofa|cushion|pillow|duvet|linen|rug|mattress|throw/.test(name))type='linen';
    if(/stone|basin|bowl|cistern|tray|cup|vase/.test(name))type='stone';
    if(/handle|tap|pipe|rain head|burner|lamp base/.test(name))type='metal';
    if(/wall|skirting/.test(name))type='plaster';
    const key=type+color;if(cache.has(key))return cache.get(key);
    const m=new T.MeshPhysicalMaterial({color,roughness:.8,metalness:0});m.name=type;
    if(type==='wood'){m.roughness=.43;m.clearcoat=.16;m.clearcoatRoughness=.55;m.bumpMap=grain;m.bumpScale=.0016;}
    if(type==='linen'){m.roughness=.95;m.sheen=.35;m.sheenColor=new T.Color(color);m.sheenRoughness=.85;m.bumpMap=weave;m.bumpScale=.0013;}
    if(type==='plaster'){m.roughness=.93;m.bumpMap=noise;m.bumpScale=.001;}
    if(type==='stone'){m.roughness=.26;m.clearcoat=.12;m.clearcoatRoughness=.3;m.bumpMap=noise;m.bumpScale=.0007;}
    if(type==='metal'){m.metalness=.88;m.roughness=.31;}
    cache.set(key,m);return m;
  };
  get.dispose=()=>{cache.forEach(m=>m.dispose());grain.dispose();weave.dispose();noise.dispose();};
  return get;
}
