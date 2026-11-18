import assert from 'node:assert/strict';
import {roundedRoute} from '../dist/routes.js';
const examples=[];
for(const x of [-18,-5,-19])for(const z of [-9,7,15])examples.push({name:`villa ${x},${z}`,r:1.15,p:[[x+3.5,.58,z+1.7],[x+3.5,.58,z+4.2],[-9.1,.58,z+4.2]]});
for(const [name,x,z,startZ,turnZ] of [['Codex',17,10,1.4,3],['Claude',16,-9,-1.4,-3],['Copilot',25,0,0,0]])examples.push({name,r:2,p:[[6.3,.85,startZ],[8.5,.7,turnZ],[x-6.4,.7,z],[x-2.1,1.3,z]]});
function cross(a,b,c){return(b.x-a.x)*(c.z-a.z)-(b.z-a.z)*(c.x-a.x);}
function intersects(a,b,c,d){return cross(a,b,c)*cross(a,b,d)<-1e-9&&cross(c,d,a)*cross(c,d,b)<-1e-9;}
let worstRadius=Infinity;
for(const {name,r,p} of examples){const c=roundedRoute(p,r),length=c.getLength(),samples=300,edges=[[],[]];assert(c.getPointAt(0).distanceTo({x:p[0][0],y:p[0][1],z:p[0][2]})<1e-6,name+' start');const end=p.at(-1);assert(c.getPointAt(1).distanceTo({x:end[0],y:end[1],z:end[2]})<1e-6,name+' end');
 for(let i=0;i<=samples;i++){const t=i/samples,q=c.getPointAt(t),d=c.getTangentAt(t),n=Math.hypot(d.x,d.z);assert(Number.isFinite(q.x+q.y+q.z+d.x+d.y+d.z));for(let e=0;e<2;e++){const sign=e?1:-1;edges[e].push({x:q.x-d.z/n*.52*sign,z:q.z+d.x/n*.52*sign});}if(i>1&&i<samples){const prev=c.getTangentAt((i-1)/samples),angle=prev.angleTo(d);if(angle>1e-4){const radius=(length/samples)/angle;worstRadius=Math.min(worstRadius,radius);assert(radius>.65,name+' bend narrower than the conveyor');}}}
 for(const edge of edges)for(let i=0;i<samples;i++)for(let j=i+2;j<samples;j++)assert(!intersects(edge[i],edge[i+1],edge[j],edge[j+1]),name+' rail self-intersection');
 for(let i=0;i<samples;i++)for(let j=0;j<samples;j++)assert(!intersects(edges[0][i],edges[0][i+1],edges[1][j],edges[1][j+1]),name+' opposing edges cross');
}
console.log(JSON.stringify({routes:examples.length,minMeasuredRadius:worstRadius,halfWidth:.52,checks:'endpoints, finite tangents, safe bend radius, no rail crossings'}));
