export default async ({project})=>{
 const p=await project({dir:'/home/user/room-tour',size:'1280x720',fps:24,background:'#111c17'});
 const labels=['Living / dining / kitchen','Main bedroom','Bathroom','Bedroom / study'];
 for(let i=0;i<4;i++){
  const h=await p.add('/home/user/clip'+i+'.mp4');p.cut(h,{from:0,dur:8,at:i*8,fit:'contain'});
  p.compose(<frame width={1280} height={720} layout="none">
   <frame x={36} y={32} width={565} height={40} background="#111c17" layout="none" radius={5}><text x={14} y={10} width={540} height={28} fontFamily="Montserrat" fontSize={17} color="#f5f0e5">AI CONCEPT LAB | 3D LAB // 003 | CONCEPT TOUR</text></frame>
   <frame x={36} y={624} width={520} height={60} background="#111c17" layout="none" radius={5}><text x={18} y={17} width={485} height={40} fontFamily="Montserrat" fontSize={24} color="#f5f0e5">{labels[i]}</text></frame>
  </frame>,{at:i*8,dur:8,name:labels[i]});
 }
 await p.render('/home/user/all-rooms-tour.mp4',{depth:8,bitrate:6000000,concurrency:2});
};
