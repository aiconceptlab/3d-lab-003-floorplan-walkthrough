import './style.css';
import {createViewer} from './scene.mjs';
import {validatePlan,tableVariant,tableGap,planSvg} from './plan.mjs';
const $=s=>document.querySelector(s),all=s=>[...document.querySelectorAll(s)];
let plan,base,sample,viewer,imageData=null,isSample=true,currentMode='orbit',sourceUrl;
const message=s=>$('#message').textContent=s;
function save(data,name,type='application/json'){const url=URL.createObjectURL(new Blob([data],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function update(){
  $('#plan-name').textContent=plan.name;$('#json').value=JSON.stringify(plan,null,2);viewer.build(plan);currentMode='orbit';viewButtons();
  if(sourceUrl)URL.revokeObjectURL(sourceUrl);sourceUrl=URL.createObjectURL(new Blob([planSvg(plan)],{type:'image/svg+xml'}));$('#plan-image').src=sourceUrl;
  const gap=tableGap(plan);$('#gap').replaceChildren(document.createTextNode(isSample&&gap!==null?gap.toFixed(2):'—'));const span=document.createElement('span');span.textContent='m';$('#gap').append(span);
  all('[data-size]').forEach(b=>b.disabled=!isSample);
  $('#measurement-note').textContent=isSample?'Measured from model geometry. Excludes pulled-out chairs and people. No accessibility or building-code assessment.':'The table comparison is specific to the included apartment. Your imported model uses its own geometry.';
}
function viewButtons(){all('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===currentMode));$('#walk-pad').hidden=currentMode!=='walk';$('#tour-controls').hidden=currentMode!=='tour';$('#view-hint').textContent=currentMode==='orbit'?'Drag to orbit · scroll to zoom':currentMode==='walk'?'Arrow keys / WASD or buttons · walls and furniture block movement':'Guided route through every reachable room';}
all('[data-view]').forEach(b=>b.addEventListener('click',()=>{try{viewer.view(b.dataset.view);currentMode=b.dataset.view;viewButtons();}catch(e){message(e.message);}}));
all('[data-size]').forEach(b=>b.addEventListener('click',()=>{try{plan=tableVariant(base,b.dataset.size==='large');update();all('[data-size]').forEach(x=>x.classList.toggle('active',x===b));}catch(e){message(e.message);}}));
all('[data-key]').forEach(b=>{b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);viewer.move(b.dataset.key);});for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>viewer.stop());});
$('#sample').addEventListener('click',()=>{isSample=true;base=structuredClone(sample);plan=structuredClone(base);imageData=null;$('#extraction').hidden=true;$('#source-label').textContent='INCLUDED SAMPLE · 72 M² FOOTPRINT';all('[data-size]').forEach(b=>b.classList.toggle('active',b.dataset.size==='compact'));update();message('Sample restored.');});
$('#upload').addEventListener('change',async e=>{
  const f=e.target.files[0];if(!f)return;e.target.value='';if(f.size>5*1024*1024)return message('Choose a file under 5 MB.');
  try{
    if(f.name.toLowerCase().endsWith('.json')){const p=validatePlan(JSON.parse(await f.text()));$('#json').value=JSON.stringify(p,null,2);$('#review').open=true;message('Plan loaded for review. Select Build reviewed plan to replace the model.');return;}
    if(!['image/png','image/jpeg','image/webp'].includes(f.type))throw new Error('Use PNG, JPEG, WebP or JSON.');
    imageData=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(f);});
    $('#plan-image').src=imageData;$('#source-label').textContent='YOUR REFERENCE · '+f.name;$('#extraction').hidden=false;
    message('Image loaded locally. Enter the overall footprint and extract a draft. The 3D sample remains visible until you build a reviewed plan.');
  }catch(e){message(e.message||'Could not read this file.');}
});
$('#extract').addEventListener('click',async()=>{
  if(!imageData)return;$('#extract').disabled=true;message('Reading the plan. This may take a minute…');
  try{const r=await fetch('/api/extract',{method:'POST',headers:{'Content-Type':'application/json',...($('#access').value?{Authorization:'Bearer '+$('#access').value}:{})},body:JSON.stringify({image:imageData,width:Number($('#width').value),depth:Number($('#depth').value)})});const d=await r.json();if(!r.ok)throw new Error(d.error);$('#json').value=JSON.stringify(d.plan,null,2);$('#review').open=true;message('Draft extracted. Review the scale, rooms, door gaps and assumptions below, then Build reviewed plan.');}
  catch(e){message(e.message||'Extraction failed.');}finally{$('#extract').disabled=false;}
});
$('#apply').addEventListener('click',()=>{try{const p=validatePlan(JSON.parse($('#json').value));isSample=false;base=p;plan=structuredClone(p);imageData=null;$('#extraction').hidden=true;$('#source-label').textContent='REVIEWED PLAN · '+(p.width*p.depth).toFixed(1)+' M² FOOTPRINT';update();message('Your reviewed plan is now the 3D model. '+p.notes.join(' '));}catch(e){message(e.message);}});
$('#download-plan').addEventListener('click',()=>save(JSON.stringify(plan,null,2),'reviewed-floorplan.json'));
$('#download-glb').addEventListener('click',async()=>{try{$('#download-glb').disabled=true;save(await viewer.exportGLB(),'furnished-apartment.glb','model/gltf-binary');message('3D model exported. Import it into Blender using File → Import → glTF 2.0.');}catch{message('Export failed. Please try again.');}finally{$('#download-glb').disabled=false;}});
$('#download-image').addEventListener('click',()=>{const a=document.createElement('a');a.download='apartment-view.png';a.href=viewer.snapshot();a.click();});
$('#download-brief').addEventListener('click',()=>save(`HIGGSFIELD WALKTHROUGH BRIEF\n\nProject: ${plan.name}\nFootprint: ${plan.width} × ${plan.depth} m. Ceiling: ${plan.height} m.\nRooms: ${plan.rooms.map(r=>r.name).join(', ')}.\n\nUse an exported eye-level screenshot as start image. Slow architectural dolly at human eye level. Preserve all visible walls, doorways, furniture positions and room proportions. Natural daylight, warm oak, quiet residential atmosphere. One continuous shot. No people, no added rooms, no transitions, no text.\n\nConcept video only: do not derive dimensions from generated footage. Review the plan JSON and GLB for spatial decisions.\n\nAssumptions:\n${plan.notes.join('\n')}\n`,'higgsfield-walkthrough-brief.txt','text/plain'));
try{
  sample=validatePlan(await(await fetch('/sample/apartment.json')).json());base=structuredClone(sample);plan=structuredClone(base);viewer=createViewer($('#viewer'),tourUpdate);update();
  const config=await(await fetch('/api/config')).json();$('#access-label').hidden=!config.accessRequired;$('#extract').disabled=!config.aiEnabled;
  $('#ai-info').textContent=config.aiEnabled?'Extract sends this image to OpenAI for a draft. Review before building.':'AI extraction is not configured. Add the server key in .env, or import a reviewed JSON plan. The included sample is fully interactive.';
  const film=await fetch('/assets/walkthrough.mp4',{method:'HEAD'});$('#cinema').hidden=!film.ok;
}catch(e){message('Could not start the viewer: '+e.message);}

let tourStopsKey='';
function tourUpdate(t){
  $('#tour-room').textContent=t.done?'Tour complete':t.name;
  $('#tour-time').textContent=(t.done?Math.ceil(t.duration):Math.floor(t.time))+' / '+Math.ceil(t.duration)+' sec';
  $('#tour-progress').value=Math.round(t.progress*1000);$('#tour-pause').textContent=t.done?'Replay':t.paused?'Resume':'Pause';
  const key=t.stops.map(s=>s.name).join('|')+t.duration;
  if(key!==tourStopsKey){tourStopsKey=key;$('#tour-stops').replaceChildren(...t.stops.map((s,i)=>{const b=document.createElement('button');b.textContent=s.name;b.addEventListener('click',()=>viewer.seekTour(t.segments.find(s=>s.stop===i&&!s.moving).start/t.duration));return b;}));}
}
$('#tour-pause').addEventListener('click',()=>viewer.pauseTour());
$('#tour-progress').addEventListener('input',e=>viewer.seekTour(Number(e.target.value)/1000));

all('[data-film-time]').forEach(b=>b.addEventListener('click',()=>{const v=$('#cinema-film');v.currentTime=Number(b.dataset.filmTime);v.play().catch(()=>{});}));
