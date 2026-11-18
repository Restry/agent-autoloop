import {Vector3,CurvePath,LineCurve3,CubicBezierCurve3} from './vendor/three.module.js';

// Round each polyline corner with tangent-continuous bends, without spline overshoot.
export function roundedRoute(input,radius=1.2){
 const points=input.map(v=>Array.isArray(v)?new Vector3(...v):v.clone()).filter((v,i,a)=>i===0||v.distanceTo(a[i-1])>1e-6);
 if(points.length<2)throw new Error('A route needs two different points');
 const path=new CurvePath();let cursor=points[0].clone();
 const lineTo=end=>{if(cursor.distanceTo(end)>1e-6)path.add(new LineCurve3(cursor.clone(),end.clone()));cursor=end.clone();};
 for(let i=1;i<points.length-1;i++){
  const p=points[i],incoming=p.clone().sub(points[i-1]),outgoing=points[i+1].clone().sub(p),before=incoming.length(),after=outgoing.length();incoming.normalize();outgoing.normalize();
  const angle=Math.acos(Math.max(-1,Math.min(1,incoming.dot(outgoing))));
  if(angle<1e-4){lineTo(p);continue;}
  if(angle>Math.PI-.05)throw new Error('A conveyor route cannot reverse at a corner');
  const cut=Math.min(radius*Math.tan(angle/2),before*.45,after*.45),effectiveRadius=cut/Math.tan(angle/2),handle=4/3*effectiveRadius*Math.tan(angle/4);
  const entry=p.clone().addScaledVector(incoming,-cut),exit=p.clone().addScaledVector(outgoing,cut);
  lineTo(entry);path.add(new CubicBezierCurve3(entry,entry.clone().addScaledVector(incoming,handle),exit.clone().addScaledVector(outgoing,-handle),exit));cursor=exit;
 }
 lineTo(points.at(-1));path.arcLengthDivisions=1200;path.updateArcLengths();return path;
}
