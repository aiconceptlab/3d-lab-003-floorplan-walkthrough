// Camera routes are calculated from geometry, never inferred from generated video.
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
export function blocked(p,x,z){
  if(x<.23||z<.23||x>p.width-.23||z>p.depth-.23)return true;
  for(const w of p.walls){const dx=w.x2-w.x1,dz=w.z2-w.z1,t=Math.max(0,Math.min(1,((x-w.x1)*dx+(z-w.z1)*dz)/(dx*dx+dz*dz)));if(Math.hypot(x-w.x1-t*dx,z-w.z1-t*dz)<.26)return true;}
  return p.furniture.some(f=>{const a=f.rotation*Math.PI/180,dx=x-f.x,dz=z-f.z,lx=dx*Math.cos(a)+dz*Math.sin(a),lz=-dx*Math.sin(a)+dz*Math.cos(a);
    // Include the dining chairs in the route footprint.
    const extra=f.kind==='table'?.52:0;
    return Math.abs(lx)<f.w/2+.18&&Math.abs(lz)<f.d/2+.18+extra;
  });
}
export function clearSegment(p,a,b){const n=Math.ceil(distance(a,b)/.04);for(let i=0;i<=n;i++){const t=n?i/n:0;if(blocked(p,a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t))return false;}return true;}
export function findPath(p,from,to){
  if(blocked(p,from.x,from.z)||blocked(p,to.x,to.z))throw new Error('Tour stop is obstructed. Review furniture and door gaps.');
  if(clearSegment(p,from,to))return [from,to];
  const step=.1,nx=Math.floor(p.width/step)+1,nz=Math.floor(p.depth/step)+1,total=nx*nz;
  const xy=id=>({x:(id%nx)*step,z:Math.floor(id/nx)*step});
  const open=new Int8Array(total),parent=new Int32Array(total).fill(-1),queue=new Int32Array(total);
  const free=id=>{if(!open[id]){const q=xy(id);open[id]=blocked(p,q.x,q.z)?-1:1;}return open[id]===1;};
  const start=Math.round(from.z/step)*nx+Math.round(from.x/step);
  if(!free(start)||!clearSegment(p,from,xy(start)))throw new Error('Tour cannot start here. Review the plan.');
  let head=0,tail=1,found=-1;queue[0]=start;parent[start]=start;
  while(head<tail){const id=queue[head++],q=xy(id);if(distance(q,to)<.16&&clearSegment(p,q,to)){found=id;break;}
    const col=id%nx,row=Math.floor(id/nx);
    for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const x=col+dx,z=row+dz;if(x<0||z<0||x>=nx||z>=nz)continue;const next=z*nx+x;if(parent[next]!==-1||!free(next)||!clearSegment(p,q,xy(next)))continue;parent[next]=id;queue[tail++]=next;}
  }
  if(found<0)throw new Error('No doorway route connects these rooms. Review wall gaps and furniture.');
  const raw=[to];for(let id=found;;id=parent[id]){raw.push(xy(id));if(id===start)break;}raw.push(from);raw.reverse();
  // Visibility simplification cannot cut a corner or pass through a wall.
  const route=[from];for(let i=0;i<raw.length-1;){let j=raw.length-1;while(j>i+1&&!clearSegment(p,raw[i],raw[j]))j--;route.push(raw[j]);i=j;}return route;
}
function roomStop(p,r){
  const focus=p.furniture.find(f=>f.x>r.x&&f.x<r.x+r.w&&f.z>r.z&&f.z<r.z+r.d)||{x:r.x+r.w/2,z:r.z+r.d/2};
  const candidates=[];for(let x=r.x+.35;x<r.x+r.w-.3;x+=.1)for(let z=r.z+.35;z<r.z+r.d-.3;z+=.1)if(!blocked(p,x,z))candidates.push({x,z});
  candidates.sort((a,b)=>Math.abs(distance(a,focus)-1.7)-Math.abs(distance(b,focus)-1.7));
  if(!candidates.length)throw new Error('No clear tour stop in '+r.name+'.');
  return {...candidates[0],name:r.name,look:{x:focus.x,z:focus.z}};
}
export function buildTour(p){
  const sample=p.width===9&&p.depth===8&&['bed1','bed2','dining','sofa'].every(id=>p.furniture.some(f=>f.id===id));
  const stops=sample?[
    {name:'Entrance / dining',x:.75,z:4.5,look:{x:4.25,z:5.3}},
    {name:'Kitchen',x:1.3,z:6.2,look:{x:1.6,z:7.55}},
    {name:'Living area',x:5.65,z:6.5,look:{x:7.2,z:5.3}},
    {name:'Main bedroom',x:1.8,z:2.65,look:{x:1.65,z:1.25}},
    {name:'Bathroom',x:4.5,z:2.65,look:{x:4.55,z:.65}},
    {name:'Bedroom / study',x:6.75,z:2.65,look:{x:7.7,z:1.25}}
  ]:[...p.rooms].reverse().map(r=>roomStop(p,r));
  const segments=[];let duration=0;
  for(let i=0;i<stops.length;i++){
    const stop=stops[i];if(blocked(p,stop.x,stop.z))throw new Error('Tour stop is obstructed: '+stop.name);
    if(i){const route=findPath(p,stops[i-1],stop);for(let j=1;j<route.length;j++){const a=route[j-1],b=route[j],seconds=distance(a,b)/.8;segments.push({start:duration,end:duration+seconds,a,b,name:'To '+stop.name,look:b,moving:true,stop:i});duration+=seconds;}}
    segments.push({start:duration,end:duration+4,a:stop,b:stop,look:stop.look,name:stop.name,moving:false,stop:i});duration+=4;
  }
  return {stops,segments,duration};
}
export function tourPose(tour,time){const t=Math.max(0,Math.min(tour.duration,time)),s=tour.segments.find(s=>s.end>t)||tour.segments.at(-1),f=Math.min(1,(t-s.start)/(s.end-s.start));return {...s,x:s.a.x+(s.b.x-s.a.x)*f,z:s.a.z+(s.b.z-s.a.z)*f,progress:t/tour.duration,done:t>=tour.duration};}
