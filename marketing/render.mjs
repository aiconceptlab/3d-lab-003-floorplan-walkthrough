import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Resvg} from '@resvg/resvg-js';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.join(root,'marketing/instagram-4x5');fs.mkdirSync(out,{recursive:true});
const C={bg:'#111c17',ink:'#f5f0e5',muted:'#b1bdb1',line:'#506054',accent:'#d6ba83',card:'#1b2a22'};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const text=(s,x,y,size=28,color=C.ink,weight=400)=>`<text x="${x}" y="${y}" font-size="${size}" fill="${color}" font-weight="${weight}">${esc(s)}</text>`;
const lines=(ss,x,y,size=64,leading=70,color=C.ink,weight=700)=>ss.map((s,i)=>text(s,x,y+i*leading,size,color,weight)).join('');
const rect=(x,y,w,h,fill=C.card,rx=16)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}"/>`;
const image=(rel,x,y,w,h,fit='xMidYMid slice')=>`<svg x="${x}" y="${y}" width="${w}" height="${h}"><image width="${w}" height="${h}" preserveAspectRatio="${fit}" href="data:image/${rel.endsWith('.jpg')?'jpeg':'png'};base64,${fs.readFileSync(path.join(root,rel)).toString('base64')}"/></svg>`;
function frame(n,content){return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350"><rect width="1080" height="1350" fill="${C.bg}"/><g font-family="Arial, sans-serif">${text('AI CONCEPT LAB',72,84,23,C.ink,600)}${text('3D LAB // 003',799,84,23,C.ink,500)}<path d="M72 110H1008 M72 1240H1008" stroke="${C.line}"/>${content}${text('FLOOR PLAN → WALKTHROUGH',72,1288,20,C.muted)}${text('0'+n+' / 05',898,1288,24,C.ink,600)}</g></svg>`;}
const hero='public/assets/cinematic-start.png';
const slides=[
 ['01-cover',frame(1,
   lines(['I gave AI','a floor plan.'],72,222,92,102)+
   text('Then I stepped inside.',72,412,60,C.accent,600)+
   image(hero,72,470,936,530)+
   rect(88,486,310,38,'#111c17',4)+text('HIGGSFIELD CONCEPT PREVIEW',101,512,16,C.ink,600)+
   image('marketing/screenshots/higgsfield-icon.png',72,1048,52,52,'xMidYMid meet')+
   text('Higgsfield',140,1084,31,C.ink,600)+text('+ GPT-6 Astra*',358,1084,31,C.ink,500)+
   text('*Optional plan extraction · generated cinematic preview',72,1134,23,C.muted)+
   text('Swipe from plan to possibility →',72,1197,30,C.accent,500)
 )],
 ['02-plan-to-space',frame(2,
   lines(['A drawing becomes','a space to explore.'],72,219,67,78)+
   text('UPLOAD. REVIEW. WALK INSIDE.',72,362,25,C.accent,600)+
   rect(72,414,304,404,'#f8f5ee')+image('public/sample/floorplan.png',82,452,284,310,'xMidYMid meet')+
   image('marketing/screenshots/dollhouse.jpg',398,414,610,404,'xMidYMid meet')+
   text('01 / THE PLAN',88,861,22,C.accent,600)+text('02 / THE EDITABLE MODEL',414,861,22,C.accent,600)+
   lines(['The same room and furniture geometry', 'drives the plan, the model and the measurements.'],72,947,31,44,C.ink,400)+
   rect(72,1064,936,120)+text('Your plan, your review.',100,1108,30,C.ink,600)+text('Check scale and door openings before building the model.',100,1157,26,C.muted)
 )],
 ['03-materials',frame(3,
   lines(['Make the space','feel believable.'],72,219,76,85)+
   text('MATERIALS. LIGHT. REFLECTIONS.',72,370,25,C.accent,600)+
   image(hero,72,426,936,530)+
   lines(['Satin oak. Matte plaster. Soft linen.', 'Daylight, gentle shadows and restrained reflections.'],72,1018,31,46,C.ink,400)+
   text('Actual Higgsfield output · 8-second concept film included',72,1179,27,C.accent)
 )],
 ['04-decision',frame(4,
   lines(['See the trade-off','before you buy it.'],72,219,72,82)+
   text('SAME APARTMENT. TWO TABLE SIZES.',72,368,25,C.accent,600)+
   rect(72,416,456,420)+rect(552,416,456,420)+
   image('marketing/screenshots/dollhouse.jpg',80,429,440,280,'xMidYMid meet')+
   image('marketing/screenshots/dollhouse-large.jpg',560,429,440,280,'xMidYMid meet')+
   text('4 SEATS / 1.6 M TABLE',98,753,24,C.muted,600)+text('6 SEATS / 2.2 M TABLE',578,753,24,C.muted,600)+
   text('0.95 m',98,814,51,C.ink,700)+text('0.65 m',578,814,51,C.accent,700)+
   text('Table edge → sofa edge',72,914,37,C.ink,600)+
   lines(['Measured in the editable 3D model.', 'Excludes pulled-out chairs and people.', 'A concept comparison, not a compliance assessment.'],72,991,29,48,C.muted,400)+
   text('Floor plan → walkthrough → decision',72,1190,31,C.accent,600)
 )],
 ['05-code',frame(5,
   lines(['Build on it.', 'Make it yours.'],72,224,86,96)+
   text('FREE SOURCE CODE. INCLUDED SAMPLE.',72,405,25,C.accent,600)+
   [ ['01','Explore a furnished 3D apartment'],['02','Upload and review your own plan'],['03','Compare a furniture decision'],['04','Export the model to Blender'] ].map((a,i)=>rect(72,462+i*119,936,95)+text(a[0],98,522+i*119,29,C.accent,600)+text(a[1],171,522+i*119,31,C.ink,500)).join('')+
   lines(['Sample works without keys.', 'Optional AI extraction and new generations use paid APIs.'],72,995,27,42,C.muted,400)+
   rect(72,1112,936,98,C.accent)+text('Comment “CODE” to get the link. →',107,1173,40,C.bg,700)
 )]
];
for(const [name,svg] of slides){const png=new Resvg(svg,{font:{loadSystemFonts:true}}).render();if(png.width!==1080||png.height!==1350)throw new Error('Invalid slide dimensions');fs.writeFileSync(path.join(out,name+'.png'),png.asPng());}
// Contact sheet is a review aid, not an Instagram upload.
const contact=`<svg xmlns="http://www.w3.org/2000/svg" width="1350" height="338">${slides.map(([name],i)=>image('marketing/instagram-4x5/'+name+'.png',i*270,0,270,338,'xMidYMid meet')).join('')}</svg>`;
fs.writeFileSync(path.join(root,'marketing/contact-sheet.png'),new Resvg(contact).render().asPng());
console.log('Rendered five 1080 × 1350 PNG slides and a contact sheet.');
