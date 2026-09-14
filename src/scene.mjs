import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {buildTour,tourPose,blocked} from './tour.mjs';
import { materialLibrary } from './materials.mjs';
export function createViewer(host,onRoom=()=>{}) {
  const scene=new T.Scene(); scene.background=new T.Color('#e9e5dc');
  const camera=new T.PerspectiveCamera(42,1,.03,150);
  const renderer=new T.WebGLRenderer({antialias:true,alpha:false,preserveDrawingBuffer:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.95;host.append(renderer.domElement);
  const pmrem=new T.PMREMGenerator(renderer),room=new RoomEnvironment();scene.environment=pmrem.fromScene(room,.04).texture;scene.environmentIntensity=.32;room.dispose();pmrem.dispose();
  renderer.domElement.setAttribute('aria-label','Interactive furnished apartment. Drag to orbit; use Walk and arrow keys to move.');
  renderer.domElement.tabIndex=0;
  const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.maxPolarAngle=Math.PI/2.05;controls.minDistance=1;controls.maxDistance=30;
  scene.add(new T.HemisphereLight(0xf8f7eb,0x8f897a,.9));
  const sun=new T.DirectionalLight(0xffeccb,2.6);sun.position.set(3,10,8);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-12,right:12,top:12,bottom:-12});sun.shadow.bias=-.0003;sun.shadow.normalBias=.035;scene.add(sun);
  const fill=new T.DirectionalLight(0xddeaff,.5);fill.position.set(-5,5,-5);scene.add(fill);
  let group=new T.Group();scene.add(group);let walls=[],plan,walking=false,touring=false,tourTime=0,tour=null,paused=false,last=performance.now(),yaw=0,keys=new Set(),animation,disposed=false;
  const mats={};
  const surface=materialLibrary();
  const mat=(color,roughness=.65,metalness=0)=>mats[color+roughness+metalness]??=(new T.MeshStandardMaterial({color,roughness,metalness}));
  function box(name,x,y,z,w,h,d,color,round=0,parent=group){
    const g=round?new RoundedBoxGeometry(w,h,d,2,Math.min(round,w/3,h/3,d/3)):new T.BoxGeometry(w,h,d);
    const o=new T.Mesh(g,typeof color==='string'?surface(name,color):color);o.name=name;o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;
  }
  function cyl(name,x,y,z,r,h,color,parent=group){const o=new T.Mesh(new T.CylinderGeometry(r,r*.88,h,28),surface(name,color));o.name=name;o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
  function furniture(f){
    const g=new T.Group();g.name=f.id;g.position.set(f.x,0,f.z);g.rotation.y=-f.rotation*Math.PI/180;group.add(g);
    const b=(n,x,y,z,w,h,d,c,r=0)=>box(n,x,y,z,w,h,d,c,r,g),c=(n,x,y,z,r,h,col)=>cyl(n,x,y,z,r,h,col,g);
    const legs=(w,d,h=.65)=>{for(const x of [-1,1])for(const z of [-1,1])b('oak leg',x*(w/2-.08),h/2,z*(d/2-.08),.045,h,.045,'#88704e',.01);};
    if(f.kind==='bed'){
      b('bed base',0,.2,0,f.w,.28,f.d,'#b5a68f',.06);b('mattress',0,.42,0,f.w-.03,.24,f.d-.06,'#f1eee5',.09);b('headboard',0,.65,-f.d/2,f.w+.08,1.1,.09,'#b9afa0',.04);
      b('duvet',0,.57,.25,f.w-.07,.15,f.d-.55,'#dbd4c6',.065);b('linen throw',0,.665,.68,f.w-.1,.035,.45,'#8a9b89',.02);
      for(const side of [-1,1])b('pillow',side*f.w*.23,.61,-f.d*.29,f.w*.4,.15,.43,'#fff9ec',.065);
      for(const side of [-1,1]){c('side table',side*(f.w/2+.24),.3,-.68,.2,.52,'#a78b63');c('lamp base',side*(f.w/2+.24),.6,-.68,.075,.08,'#625f52');c('linen lamp shade',side*(f.w/2+.24),.78,-.68,.12,.26,'#ece0c8');}
    }else if(f.kind==='sofa'){
      b('sofa base',0,.2,0,f.w,.25,f.d,'#aab29e',.07);b('sofa back',0,.64,-f.d/2+.13,f.w,.72,.23,'#bbc0aa',.1);
      for(const side of [-1,1])b('arm',side*(f.w/2-.11),.47,0,.22,.57,f.d,'#b6bca7',.08);
      for(let i=0;i<3;i++){b('seat cushion',(i-1)*(f.w-.48)/3,.43,.09,(f.w-.48)/3-.025,.19,f.d-.3,'#c3c8b5',.07);b('back cushion',(i-1)*(f.w-.45)/3,.74,-.3,(f.w-.45)/3-.03,.45,.2,'#bfc7b1',.07);}
      const pillow=b('rust pillow',-.7,.78,-.12,.4,.42,.16,'#b87b57',.07);pillow.rotation.z=.2;
    }else if(f.kind==='table'||f.kind==='desk'||f.kind==='coffee'){
      const h=f.kind==='coffee'?.4:.75;legs(f.w,f.d,h-.05);b('oak tabletop',0,h,0,f.w,.065,f.d,'#b79b71',.045);
      if(f.kind==='table'){
        const n=f.w>1.8?3:2;
        for(let i=0;i<n;i++)for(const side of [-1,1]){const x=(i-(n-1)/2)*.64,z=side*(f.d/2+.3);b('chair seat',x,.44,z,.43,.055,.42,'#897c60',.035);b('chair back',x,.7,z+side*.17,.43,.45,.055,'#a29270',.035);for(const a of [-1,1])for(const v of [-1,1])b('chair leg',x+a*.15,.22,z+v*.15,.032,.43,.032,'#716550');}
        c('vase',.15,.9,0,.09,.25,'#d1c5af');for(const k of [-1,0,1]){const stem=b('stem',.15+k*.015,1.12,0,.009,.25,.009,'#536449');stem.rotation.z=k*.2;}
        b('book',-.4,.8,.02,.25,.025,.32,'#4b6657');
      }else if(f.kind==='desk'){b('monitor',0,1.1,-.12,f.w*.68,.42,.04,'#303a36',.01);b('screen',0,1.11,-.092,f.w*.6,.32,.012,'#7d918a');b('keyboard',0,.8,.18,.45,.02,.15,'#d8d8ce');}
      else{b('art book',-.15,.455,0,.34,.035,.25,'#be765a');c('cup',.27,.48,.04,.055,.1,'#ece5d9');}
    }else if(f.kind==='kitchen'){
      b('cabinets',0,.45,0,f.w,.86,f.d,'#b5a185');b('stone worktop',0,.91,0,f.w+.04,.055,f.d+.035,'#ece8df',.018);
      for(let i=0;i<5;i++){b('cabinet face',(i-2)*f.w/5,.47,-f.d/2-.01,f.w/5-.018,.73,.03,'#bca987');b('handle',(i-2)*f.w/5,.73,-f.d/2-.035,.2,.015,.025,'#6a6455');}
      b('hob',-.85,.949,0,.6,.015,.46,'#303735',.01);for(const x of [-1,1])for(const z of [-1,1])c('burner',-.85+x*.16,.961,z*.12,.087,.01,'#69716b');
      b('sink',.55,.951,0,.5,.025,.38,'#909b97',.04);c('tap',.55,1.08,.21,.018,.27,'#888b7e');b('splashback',0,1.25,.32,f.w,.65,.035,'#e7ded0');
      for(let i=0;i<3;i++)b('upper cabinet',(i-1)*f.w/3,1.92,.18,f.w/3-.025,.7,.35,'#cbc1ae');
    }else if(f.kind==='shower'){
      b('shower tray',0,.05,0,f.w,.08,f.d,'#ddd9cd',.03);const glass=new T.MeshPhysicalMaterial({color:'#b9d9d5',transparent:true,opacity:.23,roughness:.08,depthWrite:false,side:T.DoubleSide});
      glass.userData.ephemeral=true; b('shower glass',f.w/2,1,0,.015,2,f.d,glass);c('rain head',0,2.3,-.15,.16,.025,'#7f8279');b('shower pipe',0,1.8,-f.d/2,.025,1.1,.025,'#86897c');
    }else if(f.kind==='vanity'){b('vanity cabinet',0,.5,0,f.w,.7,f.d,'#bca680',.04);b('basin',0,.88,0,f.w+.03,.1,f.d+.03,'#f6f2e8',.05);}
    else if(f.kind==='toilet'){b('cistern',0,.6,-f.d*.35,f.w,.65,.17,'#f1eee7',.05);const o=c('bowl',0,.34,.05,f.w/2,.4,'#f4f1ea');o.scale.z=1.3;}
    else if(f.kind==='plant'){
      c('terracotta pot',0,.23,0,.21,.42,'#b58766');for(let i=0;i<14;i++){const a=i*2.4,h=.65+(i%5)*.13;const leaf=new T.Mesh(new T.SphereGeometry(1,12,8),mat(i%2?'#506e4b':'#718958'));leaf.scale.set(.12,.28,.04);leaf.position.set(Math.sin(a)*.22,h,Math.cos(a)*.22);leaf.rotation.set(.5,a,.7);g.add(leaf);}
    }
  }
  function clear(){group.traverse(o=>{o.geometry?.dispose();if(o.material?.userData?.ephemeral)o.material.dispose();});scene.remove(group);group=new T.Group();group.name='Furnished floor plan';scene.add(group);walls=[];}
  function build(p){
    plan=p;clear();walking=false;touring=false;controls.enabled=true;
    box('foundation',p.width/2,-.16,p.depth/2,p.width+.22,.25,p.depth+.22,'#b7b1a3',.04);
    const plankColors=['#c6b08b','#bea680','#c4ad87','#cbb590','#c1aa82'];
    for(let x=0;x<p.width;x+=.18)for(let z=0;z<p.depth;z+=1.5){const len=Math.min(1.5,p.depth-z);box('oak floorboard',x+Math.min(.18,p.width-x)/2,0,z+len/2,Math.min(.18,p.width-x)-.006,.035,len-.006,plankColors[Math.floor(x*10+z)%5]);}
    p.walls.forEach(w=>{const dx=w.x2-w.x1,dz=w.z2-w.z1,len=Math.hypot(dx,dz);const o=box('wall',(w.x1+w.x2)/2,p.height/2,(w.z1+w.z2)/2,len,p.height,.12,'#eee9dc');o.rotation.y=-Math.atan2(dz,dx);walls.push(o);const trim=box('skirting',(w.x1+w.x2)/2,.06,(w.z1+w.z2)/2,len,.1,.145,'#e0d9ca');trim.rotation.y=o.rotation.y;});
    // Decorative window recesses are illustrative; structural wall/door geometry is unchanged.
    const daylight=mat('#c7d9d5',.2);daylight.emissive=new T.Color('#b6d6d0');daylight.emissiveIntensity=.15;
    for(const r of p.rooms.filter(r=>r.x+r.w===p.width&&r.w>2)){
      const z=r.z+r.d*.68,span=Math.min(2.1,r.d*.58);
      box('illustrative window reveal',p.width-.071,1.65,z,.06,1.65,span+.12,'#8f8879');
      box('illustrative glazing',p.width-.11,1.65,z,.02,1.5,span,daylight);
      box('window mullion',p.width-.14,1.65,z,.04,1.54,.025,'#d6d1c4');
      box('window sill',p.width-.17,.88,z,.22,.065,span+.18,'#e6e0d3');
    }
    for(const r of p.rooms){if(r.name.toLowerCase().includes('bath'))box('stone bathroom floor',r.x+r.w/2,.031,r.z+r.d/2,r.w-.12,.035,r.d-.12,'#bfc4bc');}
    p.furniture.forEach(furniture);
    const sofa=p.furniture.find(f=>f.kind==='sofa');if(sofa)box('woven rug',sofa.x,.035,sofa.z+.65,Math.min(3,p.width-1),.015,2.8,'#d7cab5',.01);
    const ground=box('presentation ground',p.width/2,-.36,p.depth/2,70,.1,70,'#e2ddd2');ground.receiveShadow=true;
    view('orbit');
  }
  function view(mode){
    if(mode==='tour')tour=buildTour(plan);
    walking=mode==='walk';touring=mode==='tour';tourTime=0;paused=false;keys.clear();controls.enabled=mode==='orbit';
    if(mode==='orbit'){camera.position.set(plan.width*1.35,plan.width*.98,plan.depth*1.43);controls.target.set(plan.width/2,0,plan.depth/2);controls.update();}
    else{const r=plan.rooms.at(-1);camera.position.set(Math.min(plan.width-.4,Math.max(.4,r.x+.65)),1.6,Math.min(plan.depth-.4,r.z+r.d*.4));yaw=-Math.PI/2;look();renderer.domElement.focus();}
    group.traverse(o=>{if(/illustrative|window mullion|window sill/.test(o.name))o.visible=mode!=='orbit';});
    walls.forEach(w=>{w.scale.y=mode==='orbit'?.37:1;w.position.y=plan.height*w.scale.y/2;});
  }
  function look(){camera.lookAt(camera.position.x-Math.sin(yaw),camera.position.y-.02,camera.position.z-Math.cos(yaw));}
  const collides=(x,z)=>blocked(plan,x,z);
  const keydown=e=>{if(!walking||!host.contains(document.activeElement))return;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d'].includes(e.key)){e.preventDefault();keys.add(e.key);}};
  const keyup=e=>keys.delete(e.key);window.addEventListener('keydown',keydown);window.addEventListener('keyup',keyup);window.addEventListener('blur',()=>keys.clear());
  const resize=()=>{const {width,height}=host.getBoundingClientRect();renderer.setSize(width,height);camera.aspect=width/Math.max(1,height);camera.updateProjectionMatrix();};const ro=new ResizeObserver(resize);ro.observe(host);
  function tick(now){if(disposed)return;const dt=Math.min((now-last)/1000,.05);last=now;
    if(walking){if(keys.has('ArrowLeft')||keys.has('a'))yaw+=dt*1.5;if(keys.has('ArrowRight')||keys.has('d'))yaw-=dt*1.5;const step=(Number(keys.has('ArrowUp')||keys.has('w'))-Number(keys.has('ArrowDown')||keys.has('s')))*dt*1.35;const x=camera.position.x-Math.sin(yaw)*step,z=camera.position.z-Math.cos(yaw)*step;if(!collides(x,camera.position.z))camera.position.x=x;if(!collides(camera.position.x,z))camera.position.z=z;look();}
    if(touring){
      if(!paused)tourTime=Math.min(tour.duration,tourTime+dt);
      const pose=tourPose(tour,tourTime);camera.position.set(pose.x,1.6,pose.z);
      const target=new T.Vector3(pose.look.x,pose.moving?1.6:1.05,pose.look.z);
      if(target.distanceTo(camera.position)>.02){const m=new T.Matrix4().lookAt(camera.position,target,camera.up),q=new T.Quaternion().setFromRotationMatrix(m);camera.quaternion.slerp(q,1-Math.exp(-dt*3));}
      if(pose.done)paused=true;
      onRoom({name:pose.name,progress:pose.progress,paused,done:pose.done,time:tourTime,duration:tour.duration,stops:tour.stops,segments:tour.segments});
    }
    if(controls.enabled)controls.update();renderer.render(scene,camera);animation=requestAnimationFrame(tick);
  }animation=requestAnimationFrame(tick);
  return {build,view,pauseTour:()=>{if(tourTime>=tour.duration)tourTime=0;paused=!paused;},seekTour:f=>{tourTime=Math.max(0,Math.min(1,f))*tour.duration;},move:key=>keys.add(key),stop:()=>keys.clear(),snapshot:()=>renderer.domElement.toDataURL('image/png'),
    exportGLB:async()=>{const ground=group.getObjectByName('presentation ground');ground.visible=false;const windows=[];group.traverse(o=>{if(/illustrative|window mullion|window sill/.test(o.name)){windows.push([o,o.visible]);o.visible=true;}});const old=walls.map(w=>[w.scale.y,w.position.y]);walls.forEach(w=>{w.scale.y=1;w.position.y=plan.height/2;});try{return await new GLTFExporter().parseAsync(group,{binary:true});}finally{ground.visible=true;windows.forEach(([o,v])=>o.visible=v);walls.forEach((w,i)=>{[w.scale.y,w.position.y]=old[i];});}},
    dispose(){disposed=true;cancelAnimationFrame(animation);ro.disconnect();window.removeEventListener('keydown',keydown);window.removeEventListener('keyup',keyup);clear();surface.dispose();Object.values(mats).forEach(m=>m.dispose());scene.environment.dispose();controls.dispose();renderer.dispose();}
  };
}
