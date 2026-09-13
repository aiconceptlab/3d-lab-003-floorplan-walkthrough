export const kinds = ['bed','desk','shower','vanity','toilet','kitchen','table','sofa','coffee','plant'];
const num = {type:'number'};
const obj = properties => ({type:'object',properties,required:Object.keys(properties),additionalProperties:false});
export const schema = obj({
  name:{type:'string'},width:num,depth:num,height:num,notes:{type:'array',items:{type:'string'}},
  rooms:{type:'array',items:obj({name:{type:'string'},x:num,z:num,w:num,d:num})},
  walls:{type:'array',items:obj({x1:num,z1:num,x2:num,z2:num})},
  furniture:{type:'array',items:obj({id:{type:'string'},kind:{type:'string',enum:kinds},x:num,z:num,w:num,d:num,rotation:num})}
});
export function validatePlan(p) {
  const fail = s => {throw new Error(s)};
  if (!p || typeof p!=='object' || Array.isArray(p)) fail('A plan must be an object.');
  const n=(v,min,max)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
  if(typeof p.name!=='string'||p.name.length>100) fail('Use a name under 100 characters.');
  if(!n(p.width,2,30)||!n(p.depth,2,30)||!n(p.height,2,5)) fail('Plan dimensions must be 2–30 m; height 2–5 m.');
  if(!Array.isArray(p.notes)||p.notes.length>15||p.notes.some(x=>typeof x!=='string'||x.length>500)) fail('Invalid plan notes.');
  for(const [key,max] of [['rooms',20],['walls',100],['furniture',80]]) if(!Array.isArray(p[key])||p[key].length>max) fail(`Invalid ${key} list.`);
  if(!p.rooms.length||!p.walls.length) fail('Include at least one room and wall.');
  const inside=(x,z)=>n(x,0,p.width)&&n(z,0,p.depth);
  for(const r of p.rooms) if(typeof r.name!=='string'||r.name.length>80||!inside(r.x,r.z)||!n(r.w,.2,30)||!n(r.d,.2,30)||!inside(r.x+r.w,r.z+r.d)) fail('A room is outside the plan or has invalid dimensions.');
  for(const w of p.walls) if(!inside(w.x1,w.z1)||!inside(w.x2,w.z2)||Math.hypot(w.x2-w.x1,w.z2-w.z1)<.05) fail('Invalid wall coordinates.');
  const ids=new Set();
  for(const f of p.furniture){
    if(typeof f.id!=='string'||f.id.length>60||ids.has(f.id)||!kinds.includes(f.kind)||!inside(f.x,f.z)||!n(f.w,.1,10)||!n(f.d,.1,10)||!n(f.rotation,-360,360)) fail('Invalid furniture.');
    ids.add(f.id);
    const a=f.rotation*Math.PI/180, w=Math.abs(Math.cos(a))*f.w+Math.abs(Math.sin(a))*f.d,d=Math.abs(Math.sin(a))*f.w+Math.abs(Math.cos(a))*f.d;
    if(f.x-w/2<-.01||f.x+w/2>p.width+.01||f.z-d/2<-.01||f.z+d/2>p.depth+.01) fail('Furniture extends beyond the plan.');
  }
  // Only retain known fields; model output never becomes executable code.
  return {name:p.name,width:p.width,depth:p.depth,height:p.height,notes:[...p.notes],rooms:p.rooms.map(({name,x,z,w,d})=>({name,x,z,w,d})),walls:p.walls.map(({x1,z1,x2,z2})=>({x1,z1,x2,z2})),furniture:p.furniture.map(({id,kind,x,z,w,d,rotation})=>({id,kind,x,z,w,d,rotation}))};
}
export function tableVariant(plan, large=false) {
  const p=structuredClone(plan),t=p.furniture.find(x=>x.id==='dining');
  if(t){t.w=large?2.2:1.6;t.d=large?1:.85;}
  return validatePlan(p);
}
export function tableGap(p) {
  const a=p.furniture.find(x=>x.id==='dining'),b=p.furniture.find(x=>x.id==='sofa');
  if(!a||!b||a.rotation!==0||b.rotation!==0||Math.abs(a.z-b.z)>(a.d+b.d)/2) return null;
  return Math.round((b.x-b.w/2-(a.x+a.w/2))*100)/100;
}
export const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function planSvg(p) {
  const s=80,ox=60,oz=65,W=p.width*s+120,H=p.depth*s+145;
  const x=v=>ox+v*s,z=v=>oz+v*s;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}"><rect width="100%" height="100%" fill="#f8f5ee"/><g font-family="Arial,sans-serif">`+
    p.rooms.map(r=>`<rect x="${x(r.x)}" y="${z(r.z)}" width="${r.w*s}" height="${r.d*s}" fill="#e9e4da" stroke="#d4cec2"/>`).join('')+
    p.furniture.map(f=>`<rect x="${x(f.x-f.w/2)}" y="${z(f.z-f.d/2)}" width="${f.w*s}" height="${f.d*s}" rx="5" fill="#bda98b" fill-opacity=".42" stroke="#8e7960" transform="rotate(${f.rotation},${x(f.x)},${z(f.z)})"/>`).join('')+
    p.walls.map(w=>`<path d="M${x(w.x1)} ${z(w.z1)}L${x(w.x2)} ${z(w.z2)}" stroke="#283a35" stroke-width="9" stroke-linecap="square"/>`).join('')+
    p.rooms.map(r=>`<text x="${x(r.x+r.w/2)}" y="${z(r.z+r.d-.28)}" text-anchor="middle" fill="#283a35" font-size="12" stroke="#f8f5ee" stroke-width="3" paint-order="stroke">${esc(r.name)}</text>`).join('')+
    `<text x="${W/2}" y="30" text-anchor="middle" font-size="16" fill="#283a35">${esc(p.name)} · ${p.width.toFixed(1)} × ${p.depth.toFixed(1)} m</text><text x="${W/2}" y="${H-25}" text-anchor="middle" font-size="13" fill="#665e50">METRES · CONCEPT PLAN · CHECK SCALE BEFORE USE</text></g></svg>`;
}
