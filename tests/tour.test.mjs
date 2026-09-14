import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {buildTour,blocked,clearSegment,findPath,tourPose} from '../src/tour.mjs';import {tableVariant} from '../src/plan.mjs';
const sample=JSON.parse(fs.readFileSync(new URL('../public/sample/apartment.json',import.meta.url)));
for(const large of [false,true])test(`tour visits every room without wall or furniture intersections (${large?'large':'small'} table)`,()=>{
 const p=tableVariant(sample,large),tour=buildTour(p);assert(tour.duration>30);for(const name of ['Kitchen','Living area','Main bedroom','Bathroom','Bedroom / study'])assert(tour.stops.some(s=>s.name===name));
 for(const s of tour.segments)assert(clearSegment(p,s.a,s.b),s.name);
 for(let t=0;t<tour.duration;t+=.05){const pose=tourPose(tour,t);assert(!blocked(p,pose.x,pose.z),pose.name);}
 assert.equal(tourPose(tour,tour.duration+1).done,true);
});
test('sealed room is rejected instead of walking through the wall',()=>{const p=structuredClone(sample);p.walls.push({x1:4.05,z1:3.2,x2:4.95,z2:3.2});assert.throws(()=>findPath(p,{x:4.5,z:3.7},{x:4.5,z:2.65}),/No doorway/);});
test('custom plan tour covers every provided room',()=>{const p={width:6,depth:5,height:2.8,rooms:[{name:'A',x:0,z:0,w:3,d:5},{name:'B',x:3,z:0,w:3,d:5}],walls:[{x1:3,z1:0,x2:3,z2:2},{x1:3,z1:3,x2:3,z2:5}],furniture:[]};const t=buildTour(p);assert.deepEqual(t.stops.map(s=>s.name),['B','A']);assert(t.segments.every(s=>clearSegment(p,s.a,s.b)));});
