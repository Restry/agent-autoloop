import * as T from 'three';
import {OrbitControls} from './vendor/OrbitControls.js';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';

const $=s=>document.querySelector(s), canvas=$('#scene');
const scene=new T.Scene(); scene.background=new T.Color('#13282d');scene.fog=new T.FogExp2('#13282d',.0075);
let renderer;
try {renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});}catch(e){$('#loading').innerHTML='<strong>此设备暂时无法启动三维场景</strong><span>请启用浏览器的图形加速后重试。</span>';throw e;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.22;
const camera=new T.OrthographicCamera(-28,28,20,-20,.1,180);
const defaultTarget=new T.Vector3(0,0,0), defaultPosition=new T.Vector3(17,33,46);
camera.position.copy(defaultPosition);camera.lookAt(defaultTarget);
const controls=new OrbitControls(camera,canvas);controls.target.copy(defaultTarget);controls.enableDamping=true;controls.dampingFactor=.055;controls.minPolarAngle=.4;controls.maxPolarAngle=1.12;controls.minZoom=.72;controls.maxZoom=2.5;controls.enablePan=true;controls.maxTargetRadius=15;controls.autoRotate=false;
const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));const bloom=new UnrealBloomPass(new T.Vector2(innerWidth,innerHeight),.38,.55,.86);composer.addPass(bloom);composer.addPass(new OutputPass());
const hemi=new T.HemisphereLight('#afc6e1','#405740',1.7);scene.add(hemi);
const moon=new T.DirectionalLight('#becce9',2.6);moon.position.set(-20,38,-17);moon.castShadow=true;moon.shadow.mapSize.set(2048,2048);Object.assign(moon.shadow.camera,{left:-33,right:33,top:30,bottom:-30,near:1,far:100});moon.shadow.normalBias=.035;moon.shadow.bias=-.00015;scene.add(moon);
let seed=17;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
const materials={};
function mat(name,color,roughness=.8,metalness=0,extra={}) {return materials[name]=new T.MeshStandardMaterial({color,roughness,metalness,...extra});}
const stone=mat('stone','#657378'),pale=mat('pale','#c1bfae'),wall=mat('wall','#b3b6ab'),dark=mat('dark','#354449',.5,.5),trim=mat('trim','#65716f',.45,.4),roof=mat('roof','#3e505d',.65,.3),roofEdge=mat('roofEdge','#50616c',.5,.4),wood=mat('wood','#6b5b46'),grass=mat('grass','#7c927a'),hedge=mat('hedge','#264835'),soil=mat('soil','#1e322c'),pathMat=mat('path','#828b87'),asphalt=mat('asphalt','#56676a'),rail=mat('rail','#53696e',.33,.8),black=mat('black','#172a31',.4,.5);
const warm=mat('warm','#ffe1a2',.35,0,{emissive:'#ffb763',emissiveIntensity:2.5});
const softWarm=mat('softWarm','#d9ba78',.6,0,{emissive:'#d0a05b',emissiveIntensity:.6});
const cool=mat('cool','#a5ebe2',.3,.15,{emissive:'#6bc7c0',emissiveIntensity:2});
const violet=mat('violet','#c2c5ff',.3,.2,{emissive:'#a29cf4',emissiveIntensity:2.2});
const amber=mat('amber','#ffd3a5',.3,.2,{emissive:'#eaa86c',emissiveIntensity:2.2});
const glass=mat('glass','#97c3c2',.2,.4,{transparent:true,opacity:.22,depthWrite:false});
const windowDark=mat('windowDark','#273b42',.2,.5,{emissive:'#37534e',emissiveIntensity:.2});
const leafMats=[mat('leaf1','#365740'),mat('leaf2','#41634b'),mat('leaf3','#274d3a'),mat('leaf4','#4e6650')];
const water=mat('water','#2c6d76',.21,.6,{transparent:true,opacity:.8});
function noiseTexture(c1,c2,n=128){const c=document.createElement('canvas');c.width=c.height=n;const x=c.getContext('2d');x.fillStyle=c1;x.fillRect(0,0,n,n);for(let i=0;i<n*n*.7;i++){x.fillStyle=c2;x.globalAlpha=rand()*.35;x.fillRect(rand()*n,rand()*n,rand()*2+1,1);}const tx=new T.CanvasTexture(c);tx.wrapS=tx.wrapT=T.RepeatWrapping;tx.repeat.set(16,16);tx.colorSpace=T.SRGBColorSpace;return tx;}
grass.map=noiseTexture('#5b7055','#94a575');roof.map=noiseTexture('#7c8d98','#b8c2c8');roof.map.repeat.set(1,1);asphalt.map=noiseTexture('#9eaaa8','#d0cec3');asphalt.map.repeat.set(4,1);
const boxGeo=new T.BoxGeometry(1,1,1),sphereGeo=new T.IcosahedronGeometry(1,1),cylGeo=new T.CylinderGeometry(1,1,1,24),treeGeo=new T.IcosahedronGeometry(1,1);
function mesh(geo,m,x=0,y=0,z=0,parent=scene,dynamic=false){const a=new T.Mesh(geo,m);a.position.set(x,y,z);a.castShadow=true;a.receiveShadow=true;a.userData.static=!dynamic;parent.add(a);return a;}
function box(w,h,d,m,x,y,z,parent=scene,dyn=false){const a=mesh(boxGeo,m,x,y,z,parent,dyn);a.scale.set(w,h,d);return a;}
function cyl(rt,rb,h,m,x,y,z,parent=scene,dyn=false,n=48){return mesh(new T.CylinderGeometry(rt,rb,h,n),m,x,y,z,parent,dyn);}
function torus(r,t,m,x,y,z,parent=scene,dyn=false){const a=mesh(new T.TorusGeometry(r,t,8,72),m,x,y,z,parent,dyn);a.rotation.x=Math.PI/2;return a;}
function ball(r,m,x,y,z,parent=scene,dyn=false){let a=mesh(sphereGeo,m,x,y,z,parent,dyn);a.scale.setScalar(r);return a;}
const glowCanvas=document.createElement('canvas');glowCanvas.width=glowCanvas.height=128;const gctx=glowCanvas.getContext('2d'),gradient=gctx.createRadialGradient(64,64,0,64,64,64);gradient.addColorStop(0,'rgba(255,255,255,.8)');gradient.addColorStop(.15,'rgba(255,255,255,.38)');gradient.addColorStop(.5,'rgba(255,255,255,.08)');gradient.addColorStop(1,'rgba(255,255,255,0)');gctx.fillStyle=gradient;gctx.fillRect(0,0,128,128);const glowTex=new T.CanvasTexture(glowCanvas);
function glow(x,y,z,color,size,opacity=.5,parent=scene){const s=new T.Sprite(new T.SpriteMaterial({map:glowTex,color,transparent:true,opacity,depthWrite:false,blending:T.AdditiveBlending}));s.position.set(x,y,z);s.scale.set(size,size,1);parent.add(s);return s;}
function groundGlow(x,z,color,size,opacity=.22){const m=new T.MeshBasicMaterial({map:glowTex,color,transparent:true,opacity,depthWrite:false,blending:T.AdditiveBlending});const a=mesh(new T.PlaneGeometry(size,size),m,x,.07,z,scene,true);a.rotation.x=-Math.PI/2;a.castShadow=false;return a;}
function beam(a,b,r,m,parent=scene,dyn=false){const delta=b.clone().sub(a);const o=mesh(new T.CylinderGeometry(r,r,delta.length(),8),m,...a.clone().add(b).multiplyScalar(.5).toArray(),parent,dyn);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return o;}
function point(x,y,z){return new T.Vector3(x,y,z);}

// 地形、道路与微缩景观。
const ground=mesh(new T.PlaneGeometry(180,180),grass,0,-.1,0);ground.rotation.x=-Math.PI/2;ground.castShadow=false;
function road(points,width=1.7){const curve=new T.CatmullRomCurve3(points.map(([x,z])=>point(x,.01,z)),false,'catmullrom',.15);const a=mesh(new T.TubeGeometry(curve,80,width/2,8,false),asphalt);a.scale.y=.05;a.castShadow=false;return curve;}
road([[-23,0],[-14,0],[-8,0],[0,0],[4,0]],2.4);road([[-11,-16],[-11,-8],[-11,0],[-11,9],[-11,17]],1.8);road([[-22,-10],[-20,-9],[-11,-9],[-5,-9],[-3,-8]],1.6);road([[-23,9],[-18,9],[-11,9],[-5,9],[-3,10]],1.6);road([[4,0],[9,-4],[15,-8]],1.4);road([[4,0],[10,5],[17,9]],1.4);
function lamp(x,z,h=1.65){cyl(.1,.16,.16,dark,x,.1,z);cyl(.035,.045,h,dark,x,h/2,z);cyl(.17,.1,.12,trim,x,h+.02,z);cyl(.095,.095,.22,warm,x,h-.13,z);cyl(.16,.16,.05,dark,x,h-.27,z);glow(x,h-.12,z,'#ffd598',.8,.35);groundGlow(x,z,'#f8cc88',4.8,.42);}
for(let x=-21;x<1;x+=4.3){lamp(x,1.5);lamp(x,-1.5);}for(let z=-14;z<16;z+=4.8){if(Math.abs(z)>2){lamp(-12.25,z);lamp(-9.7,z);}}
function tree(x,z,s=1,type=0){cyl(.065*s,.13*s,1.7*s,wood,x,.85*s,z,scene,false,7);const m=leafMats[Math.floor(rand()*4)];if(type===1){for(let j=0;j<3;j++){const a=mesh(new T.ConeGeometry((.7-j*.13)*s,1.5*s,7),m,x,(1.5+j*.55)*s,z);a.rotation.y=rand()*2;}}else{for(let j=0;j<6;j++){let a=mesh(treeGeo,m,x+(rand()-.5)*.6*s,(1.8+j*.19)*s,z+(rand()-.5)*.6*s);a.scale.set((.65+rand()*.3)*s,(.7+rand()*.3)*s,(.65+rand()*.3)*s);a.rotation.set(rand(),rand(),rand());}}}
for(let i=0;i<210;i++){const x=(rand()-.5)*95,z=(rand()-.5)*72;if((x>-25&&x<24&&z>-18&&z<18)|| (z>18&&Math.abs(x)<17))continue;tree(x,z,.55+rand()*1.3,rand()>.45?1:0);}
[[-24,-15],[-23,14],[-3,-14],[-1,11],[8,-13],[21,-2],[10,14],[0,-10],[-24,-3],[-23,4]].forEach(([x,z])=>tree(x,z,.6+rand()*.3));
function bush(x,z,w=1){let b=ball(w,hedge,x,.38,z);b.scale.set(w,.4,w*.7);}
for(let i=0;i<44;i++){let x=(rand()-.5)*48,z=(rand()-.5)*33;if(Math.abs(x+11)<2||Math.abs(z)<2)continue;if(x>0 && x<11 && z>7 || x<-22)bush(x,z,.35+rand()*.45);}
// 水池及环绕的石块。
const pondShape=new T.Shape();pondShape.moveTo(-2,0);pondShape.bezierCurveTo(-3,-2,-.8,-3,1,-2.2);pondShape.bezierCurveTo(4,-2,3,0,1.7,1.3);pondShape.bezierCurveTo(0,2,-2,1.6,-2,0);
const pond=mesh(new T.ShapeGeometry(pondShape,40),water,5,.012,10);pond.rotation.x=-Math.PI/2;
for(let i=0;i<29;i++){const a=i/29*Math.PI*2;const b=ball(.2+rand()*.12,stone,5+Math.cos(a)*2.65,.08,10+Math.sin(a)*2.1);b.scale.y=.4;}
const ripples=[];for(let i=0;i<3;i++){let m=new T.MeshBasicMaterial({color:'#89c8b7',transparent:true,opacity:.14,depthWrite:false});ripples.push(torus(.5+i*.5,.009,m,5,.04,10,scene,true));}

const projects=[
{name:'曙光',sub:'家庭影像与生活记录',task:'构建相册时间线',x:-18,z:-9,agent:0,type:0},
{name:'门神',sub:'个人 Agent 凭据管理',task:'整理凭据管理流程',x:-5,z:-9,agent:1,type:1},
{name:'Remotastic',sub:'遥控器与桌面交互',task:'完善按钮映射',x:-19,z:7,agent:0,type:2},
{name:'GemFlow',sub:'业务流程与协作空间',task:'检查库存同步流程',x:-5,z:7,agent:1,type:3},
{name:'灵感花园',sub:'设计参考与视觉探索',task:'归档新的设计灵感',x:-19,z:15,agent:1,type:4},
{name:'实验室',sub:'新想法从这里开始',task:'搭建交互原型',x:-5,z:15,agent:0,type:5}
];
const pickables=[],labels=[];
function label(text,x,y,z,kind='',action){const el=document.createElement('button');el.className='world-label '+kind;el.innerHTML=text;$('#labels').append(el);if(action)el.addEventListener('click',action);labels.push({el,p:point(x,y,z)});return el;}
function windowUnit(x,y,z,w,h,side,parent,lit=true){const group=new T.Group();group.position.set(x,y,z);group.rotation.y=side;parent.add(group);box(w+.13,h+.13,.09,trim,0,0,0,group);box(w,h,.1,lit?warm:windowDark,0,0,.04,group);box(.035,h,.04,dark,0,0,.105,group);box(w,.035,.04,dark,0,0,.105,group);box(w+.23,.07,.2,pale,0,-h/2-.08,.06,group);if(lit)box(w*.15,h,.02,softWarm,-w*.35,0,.103,group);}
function villa(p,index){const group=new T.Group();group.position.set(p.x,0,p.z);scene.add(group);const w=2.65,d=2.6,levels=p.type===3?3:2,h=levels*1.05;
box(6.7,.22,5.8,stone,0,0,0,group);box(6.5,.05,5.6,soil,0,.13,0,group);box(3.7,.06,4.8,pathMat,-.95,.16,0,group);box(2.35,.08,4.8,grass,1.95,.16,0,group);
// 石板接缝、花坛与矮墙。
for(let x=-2.5;x<.9;x+=.4){for(let z=-2.2;z<2.5;z+=.5){if(Math.abs(x+.6)<1.5&&Math.abs(z+.6)<1.5)continue;box(.36,.025,.45,rand()>.5?stone:pathMat,x,.2,z,group);}}
box(6.6,.3,.12,pale,0,.3,-2.85,group);box(.12,.3,5.8,pale,-3.25,.3,0,group);box(.12,.3,5.8,pale,3.25,.3,0,group);box(2.3,.3,.12,pale,-2.1,.3,2.85,group);box(2.3,.3,.12,pale,2.1,.3,2.85,group);
for(let j=0;j<8;j++){box(.6,.35,.38,hedge, -2.8+j*.8,.45,-2.5,group);}
box(w+.3,.3,d+.3,pale,-.65,.37,-.55,group);box(w,h,d,wall,-.65,h/2+.5,-.55,group);box(w+.08,.12,d+.08,pale,-.65,1.55,-.55,group);box(w+.1,.12,d+.1,trim,-.65,h+.48,-.55,group);
for(let floor=0;floor<levels;floor++){for(let col=0;col<2;col++){windowUnit(-1.35+col*1.35,.98+floor*1.04,.765,.63,.64,0,group,rand()>.2);windowUnit(.69,.98+floor*1.04,-1.22+col*1.35,.6,.64,Math.PI/2,group,rand()>.28);}windowUnit(-2,.98+floor*1.04,-.7,.6,.64,-Math.PI/2,group,rand()>.5);}
if(p.type%3!==1){const shape=new T.Shape();shape.moveTo(-w/2-.2,0);shape.lineTo(0,1.03);shape.lineTo(w/2+.2,0);shape.closePath();const geo=new T.ExtrudeGeometry(shape,{depth:d+.4,bevelEnabled:false});mesh(geo,roof,-.65,h+.55,-.55-d/2-.2,group);box(.1,.1,d+.5,roofEdge,-.65,h+1.6,-.55,group);
for(let j=0;j<7;j++){let t=j/7;for(const s of [-1,1]){box(.035,.025,d+.42,roofEdge,-.65+s*(w/2+.2)*(1-t),h+.58+t*1.03,-.55,group);}}
box(.36,.85,.38,stone,-1.43,h+1.1,-1.1,group);box(.46,.12,.48,trim,-1.43,h+1.55,-1.1,group);
}else{box(w+.25,.18,d+.25,roof,-.65,h+.6,-.55,group);for(let i=0;i<4;i++){let panel=box(.47,.035,.9,black,-1.48+i*.55,h+.73,-.8,group);panel.rotation.x=.16;for(let j=0;j<3;j++)box(.012,.01,.9,trim,-1.65+i*.55+j*.12,h+.755,-.8,group);}box(.52,.35,.55,trim,.1,h+.87,.15,group);}
// 主楼旁的三个独立工作区：规划、执行、交付。
for(let i=0;i<3;i++)box(1.2,.08*(3-i),.25,pale,-.65,.17+.04*(3-i),1.02+i*.25,group);
const bayZ=[-1.7,0,1.7];
bayZ.forEach((z,j)=>{
 box(1.95,.08,1.43,trim,1.83,.27,z,group);
 box(1.75,.04,1.23,j===1?grass:soil,1.83,.32,z,group);
 box(1.95,.15,.055,pale,1.83,.39,z-.71,group);
 box(1.95,.15,.055,pale,1.83,.39,z+.71,group);
 box(.06,.16,1.43,pale,.86,.39,z,group);
 box(.06,.16,.45,pale,2.81,.39,z-.5,group);
 box(.06,.16,.45,pale,2.81,.39,z+.5,group);
 // 每个工作区都有独立的出口和状态灯。
 box(.45,.075,.55,trim,3.04,.52,z,group);
 box(.46,.015,.4,black,3.04,.565,z,group);
 ball(.055,j===2?softWarm:cool,2.75,.54,z+.58,group);
 if(j===0){
  box(1.05,.12,.4,wood,1.72,.65,z-.29,group);
  box(.06,.4,.06,trim,1.29,.44,z-.29,group);box(.06,.4,.06,trim,2.15,.44,z-.29,group);
  box(.38,.3,.04,dark,1.7,.85,z-.36,group);box(.3,.21,.045,cool,1.7,.85,z-.33,group);
  for(const x of [1,2.65])box(.06,1.15,.06,trim,x,.85,z-.62,group);
  box(1.9,.08,1.2,roof,1.83,1.46,z-.02,group);
 }else if(j===1){
  box(.73,.15,.7,stone,1.65,.43,z,group);box(.62,.065,.58,softWarm,1.65,.54,z,group);
  box(.32,.28,.32,wood,2.27,.5,z+.28,group);box(.35,.025,.08,pale,2.27,.65,z+.28,group);
 }else{
  box(.38,.32,.38,wood,1.25,.52,z-.25,group);box(.4,.025,.075,softWarm,1.25,.69,z-.25,group);
  box(.48,.4,.43,wood,1.85,.56,z+.2,group);box(.5,.025,.08,pale,1.85,.77,z+.2,group);
 }
});
for(let j=0;j<3;j++){cyl(.2,.16,.3,stone,-2.7,.35,1+j*.5,group);ball(.23,hedge,-2.7,.6,1+j*.5,group);}
// 小径连到主路。
const roadZ=p.z<0?-9:p.z<10?9:15;road([[p.x,p.z+3],[p.x,p.z+3.8],[-11,roadZ]],.65);
lamp(p.x-3,p.z+3,1.25);lamp(p.x+3,p.z+3,1.25);
const proxy=box(6.7,h+2,5.8,new T.MeshBasicMaterial({visible:false}),p.x,(h+2)/2,p.z,scene,true);proxy.userData.project=index;pickables.push(proxy);
p.label=label('<i></i>'+p.name+'<span class="count">'+(index%3+2)+'</span>',p.x,.3,p.z+3.45,'',()=>selectProject(index));p.anchor=point(p.x,1,p.z);return group;
}
projects.forEach(villa);

// 圆形中台：石阶、环形工作舱、玻璃穹顶与悬浮核心。
const hub=point(3.6,0,.1);
for(let i=0;i<3;i++)cyl(3.7-i*.2,3.8-i*.2,.18,stone,hub.x,.12+i*.16,hub.z);
cyl(2.9,3.1,1.15,dark,hub.x,1,hub.z);torus(3,.09,trim,hub.x,1.6,hub.z);torus(3.08,.045,cool,hub.x,.65,hub.z);torus(3.15,.06,pale,hub.x,.5,hub.z);
for(let i=0;i<24;i++){const a=i/24*Math.PI*2,x=hub.x+Math.cos(a)*2.97,z=hub.z+Math.sin(a)*2.97;let o=box(.16,.65,.36,i%3===0?warm:trim,x,1.1,z);o.rotation.y=-a;}
const dome=mesh(new T.SphereGeometry(2.8,48,24,0,Math.PI*2,0,Math.PI/2),glass,hub.x,1.65,hub.z);dome.scale.y=.45;
for(let i=0;i<12;i++){const a=i/12*Math.PI*2;const pts=[];for(let j=0;j<=20;j++){const t=j/20*Math.PI/2;pts.push(point(hub.x+Math.cos(a)*Math.cos(t)*2.85,1.65+Math.sin(t)*1.3,hub.z+Math.sin(a)*Math.cos(t)*2.85));}mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),24,.035,6,false),trim);}
cyl(1.2,1.4,.28,black,hub.x,1.6,hub.z);torus(1.18,.035,cool,hub.x,1.77,hub.z);
const hubCore=new T.Group();hubCore.position.set(hub.x,2.35,hub.z);scene.add(hubCore);const core=mesh(new T.IcosahedronGeometry(.42,1),cool,0,0,0,hubCore,true);const coreRing=torus(.82,.025,cool,0,0,0,hubCore,true);coreRing.rotation.z=.5;const coreRing2=torus(.9,.018,trim,0,0,0,hubCore,true);coreRing2.rotation.z=-.6;glow(hub.x,2.2,hub.z,'#9ad8d2',3,.3);groundGlow(hub.x,hub.z,'#79d8cd',8,.14);
const hubLight=new T.PointLight('#9bddd0',18,8,2);hubLight.position.set(hub.x,3,hub.z);scene.add(hubLight);
for(let i=0;i<6;i++){const a=i/6*Math.PI*2;lamp(hub.x+Math.cos(a)*4,hub.z+Math.sin(a)*4,1.2);}
label('调度中台',hub.x,4.2,hub.z,'hub',()=>toast('中台接收任务，再分配给对应的 Agent。'));

const agents=[];
function makeAgent(name,x,z,color,m,index){const root=new T.Group();root.position.set(x,0,z);scene.add(root);
for(let i=0;i<4;i++){cyl(4-i*.25,4.1-i*.25,.16,stone,0,.12+i*.16,0,root);torus(3.9-i*.25,.02,trim,0,.21+i*.16,0,root);}
for(let i=0;i<48;i++){const a=i/48*Math.PI*2;const tile=box(.32,.025,.7,pathMat,Math.cos(a)*3.65,.47,Math.sin(a)*3.65,root);tile.rotation.y=-a+Math.PI/2;}
cyl(2.55,2.8,.42,dark,0,.8,0,root);torus(2.55,.055,m,0,1.04,0,root);cyl(2.05,2.3,.24,black,0,1.13,0,root);torus(1.95,.025,m,0,1.29,0,root);
// 四根钢制支撑与上方轨道。
for(let i=0;i<4;i++){const a=i/4*Math.PI*2+Math.PI/4;const v=point(Math.cos(a)*2.4,1.05,Math.sin(a)*2.4),v2=point(Math.cos(a)*1.48,4.4,Math.sin(a)*1.48);beam(v,v2,.045,trim,root);ball(.09,m,v2.x,v2.y,v2.z,root);}
const columnMat=new T.ShaderMaterial({uniforms:{uColor:{value:new T.Color(color)},uTime:{value:0},uPower:{value:1}},vertexShader:'varying vec2 vUv; varying vec3 vNormal; varying vec3 vView; void main(){vUv=uv;vec4 mv=modelViewMatrix*vec4(position,1.);vNormal=normalize(normalMatrix*normal);vView=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',fragmentShader:'uniform vec3 uColor;uniform float uTime;uniform float uPower;varying vec2 vUv;varying vec3 vNormal;varying vec3 vView;void main(){float rim=pow(1.-abs(dot(normalize(vNormal),normalize(vView))),2.);float scan=pow(.5+.5*sin(vUv.y*110.-uTime*2.),14.);float shafts=pow(.5+.5*sin(vUv.x*90.),5.);float fade=pow(1.-vUv.y,.7);float a=(.025+rim*.18+scan*.05+shafts*.06)*fade*uPower;gl_FragColor=vec4(uColor*1.6,a);}',transparent:true,side:T.DoubleSide,depthWrite:false,blending:T.AdditiveBlending});
const column=mesh(new T.CylinderGeometry(1.38,2.05,4.2,64,1,true),columnMat,0,3.3,0,root,true);column.castShadow=false;
const orb=mesh(new T.IcosahedronGeometry(.68,3),new T.MeshStandardMaterial({color,emissive:color,emissiveIntensity:.8,metalness:.35,roughness:.24,transparent:true,opacity:.66}),0,4.25,0,root,true);
const rings=new T.Group();rings.position.y=4.25;root.add(rings);for(let i=0;i<3;i++){const a=torus(1.06+i*.12,.025,i===1?trim:m,0,0,0,rings,true);a.rotation.set(.5+i*.7,.4+i*.8,.3+i*.6);}
const iconCanvas=document.createElement('canvas');iconCanvas.width=256;iconCanvas.height=128;const ic=iconCanvas.getContext('2d');ic.fillStyle='#fff6e7';ic.textAlign='center';ic.textBaseline='middle';ic.font=index===0?'bold 58px monospace':'66px sans-serif';ic.fillText(index===0?'>_':'✳',128,64);const icon=new T.Sprite(new T.SpriteMaterial({map:new T.CanvasTexture(iconCanvas),transparent:true,depthWrite:false}));icon.position.set(0,2.65,.7);icon.scale.set(1.8,.9,1);root.add(icon);
glow(x,4.1,z,color,3,.32);groundGlow(x,z,color,10,.12);
for(let i=0;i<8;i++){const a=i/8*Math.PI*2;cyl(.07,.1,.55,trim,Math.cos(a)*3.65,.76,Math.sin(a)*3.65,root);ball(.09,m,Math.cos(a)*3.65,1.08,Math.sin(a)*3.65,root);}
const light=new T.PointLight(color,25,11,2);light.position.set(x,3,z);scene.add(light);
label(name,x,6.2,z,'agent',()=>focusAgent(index));agents[index]={name,x,z,rings,orb,columnMat,light,root};
}
makeAgent('Claude',16,-8,'#efbd87',amber,1);makeAgent('Codex',18,9,'#b2adff',violet,0);

// 开放式双向传送带。带面、边框和滚筒均可见；纸箱在带面上行走。
const beltCanvas=document.createElement('canvas');beltCanvas.width=128;beltCanvas.height=64;
const beltCtx=beltCanvas.getContext('2d');beltCtx.fillStyle='#394443';beltCtx.fillRect(0,0,128,64);
for(let x=0;x<128;x+=16){beltCtx.fillStyle='#6c7972';beltCtx.fillRect(x,0,2,64);beltCtx.fillStyle='#202b2b';beltCtx.fillRect(x+3,0,1,64);}
beltCtx.strokeStyle='#92a18b';beltCtx.lineWidth=2;beltCtx.beginPath();beltCtx.moveTo(48,20);beltCtx.lineTo(60,32);beltCtx.lineTo(48,44);beltCtx.stroke();
const beltTexture=new T.CanvasTexture(beltCanvas);beltTexture.wrapS=beltTexture.wrapT=T.RepeatWrapping;beltTexture.colorSpace=T.SRGBColorSpace;beltTexture.anisotropy=4;
const beltBackTexture=beltTexture.clone();beltBackTexture.needsUpdate=true;
const beltMaterial=mat('belt','#b4c0b4',.8,.15,{map:beltTexture});const beltBackMaterial=mat('beltBack','#9cac9e',.8,.15,{map:beltBackTexture});
function makeCurve(points){return new T.CatmullRomCurve3(points.map(v=>point(...v)),false,'catmullrom',.12);}
function beltStrip(curve,offset,width,material,height=0){const positions=[],normals=[],uvs=[],indices=[];const n=Math.ceil(curve.getLength()*9),length=curve.getLength();
for(let i=0;i<=n;i++){const t=i/n,p=curve.getPointAt(t),d=curve.getTangentAt(t),side=point(-d.z,0,d.x).normalize();for(let j=0;j<2;j++){const q=p.clone().addScaledVector(side,offset+(j-.5)*width);q.y+=height;positions.push(q.x,q.y,q.z);normals.push(0,1,0);uvs.push(t*length*.7,j);}if(i<n){let k=i*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}}
const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('normal',new T.Float32BufferAttribute(normals,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));geo.setIndex(indices);return mesh(geo,material);}
function pipeline(points){const c=Array.isArray(points)?makeCurve(points):points,length=c.getLength();
beltStrip(c,0,1.03,trim,-.09);beltStrip(c,.235,.42,beltMaterial);beltStrip(c,-.235,.42,beltBackMaterial);beltStrip(c,0,.035,rail,.045);
for(const offset of [-.52,.52]){const railCurve=new T.CatmullRomCurve3(c.getPoints(Math.ceil(length*8)).map((p,i,arr)=>{const d=c.getTangent(i/(arr.length-1));return p.clone().addScaledVector(point(-d.z,0,d.x).normalize(),offset).add(point(0,.025,0));}));mesh(new T.TubeGeometry(railCurve,Math.ceil(length*8),.038,5,false),rail);}
for(let i=0;i<=length/1.6;i++){const t=Math.min(i*1.6/length,1),p=c.getPointAt(t),d=c.getTangentAt(t),side=point(-d.z,0,d.x).normalize();beam(p.clone().addScaledVector(side,-.49).add(point(0,-.04,0)),p.clone().addScaledVector(side,.49).add(point(0,-.04,0)),.065,dark);for(const sign of [-1,1]){const v=p.clone().addScaledVector(side,sign*.44);box(.055,v.y-.1,.055,trim,v.x,(v.y-.1)/2,v.z);box(.18,.055,.2,stone,v.x,.02,v.z);}}
return c;}
const trunkX=-9.1,feedZ=.3,beltY=.58;
pipeline([[trunkX,beltY,-6],[trunkX,beltY,19]]);
const feed=pipeline([[trunkX,beltY,feedZ],[-5,beltY,feedZ],[hub.x-2.65,.85,feedZ]]);
projects.forEach((p,i)=>{
const px=p.x+3.5,joinZ=p.z+3.6;
// 院落右侧的小传送带，连接三个工作区。
pipeline([[px,beltY,p.z-1.8],[px,beltY,p.z+1.7]]);
const branch=pipeline([[px,beltY,p.z+1.7],[px,beltY,p.z+3],[px-.45,beltY,joinZ],[trunkX,beltY,joinZ]]);
const trunkPart=new T.LineCurve3(point(trunkX,beltY,joinZ),point(trunkX,beltY,feedZ));
const route=new T.CurvePath();route.add(branch);route.add(trunkPart);route.add(feed);p.route=route;
box(1.1,.1,1.1,trim,trunkX,beltY-.06,joinZ);box(.95,.025,.95,black,trunkX,beltY,joinZ);
});
agents.forEach((a,i)=>{a.route=pipeline([[hub.x+2.7,.85,i===0?1.3:-1.3],[8,.7,i===0?2.8:-2.8],[a.x-4,.7,a.z],[a.x-2.1,1.3,a.z]]);});
// 草地上的零星微光。
const fireCount=75,firePositions=new Float32Array(fireCount*3);for(let i=0;i<fireCount;i++){firePositions[i*3]=(rand()-.5)*48;firePositions[i*3+1]=.3+rand()*3;firePositions[i*3+2]=(rand()-.5)*32;}const fireGeo=new T.BufferGeometry();fireGeo.setAttribute('position',new T.BufferAttribute(firePositions,3));const fireflies=new T.Points(fireGeo,new T.PointsMaterial({color:'#dbdaa5',size:.055,transparent:true,opacity:.55,depthWrite:false,blending:T.AdditiveBlending}));scene.add(fireflies);

// 合并静态建筑，减少渲染调用；动画对象独立保留。
scene.updateMatrixWorld(true);const batches=new Map(),remove=[];
scene.traverse(o=>{if(o.isMesh && o.userData.static && !Array.isArray(o.material)){const key=o.material.uuid+'-'+o.castShadow+'-'+o.receiveShadow;if(!batches.has(key))batches.set(key,{m:o.material,cast:o.castShadow,receive:o.receiveShadow,geos:[]});let geo=o.geometry.clone().applyMatrix4(o.matrixWorld);if(geo.index)geo=geo.toNonIndexed();for(const k of Object.keys(geo.attributes))if(!['position','normal','uv'].includes(k))geo.deleteAttribute(k);batches.get(key).geos.push(geo);remove.push(o);}});
for(const b of batches.values()){const geo=mergeGeometries(b.geos,false);if(geo){const o=new T.Mesh(geo,b.m);o.castShadow=b.cast;o.receiveShadow=b.receive;scene.add(o);}b.geos.forEach(g=>g.dispose());}remove.forEach(o=>o.removeFromParent());

let running=!matchMedia('(prefers-reduced-motion: reduce)').matches,sim=0,completed=0,selected=-1,lastDispatch=0,autoIndex=0,focusedTask=null;
const tasks=[];const taskMessages=['包裹正前往中台','中台正在分配任务','Agent 正在处理任务','结果正在返回项目'];
const cardboard=mat('cardboard','#c69a62',.95,0),packingTape=mat('packingTape','#dfc693',.75,0),paperLabel=mat('paperLabel','#eeead6',.8,0);
function createParcel(color){const g=new T.Group();g.scale.setScalar(1.25);scene.add(g);box(.38,.34,.42,cardboard,0,.17,0,g,true);box(.39,.014,.075,packingTape,0,.347,0,g,true);box(.075,.34,.425,packingTape,0,.17,0,g,true);box(.14,.013,.13,paperLabel,.09,.349,.08,g,true);const tag=new T.MeshBasicMaterial({color});box(.17,.11,.008,tag,0,.23,.215,g,true);return g;}

function dispatch(i,manual=false){if(tasks.length>=9){toast('当前演示任务较多，请等待部分任务完成。');return;}const p=projects[i],a=agents[p.agent];const task={project:i,start:sim,stage:0,package:createParcel(p.agent===0?'#c0b9ff':'#ffd29e'),id:sim+rand(),done:false};tasks.push(task);if(manual||!focusedTask||focusedTask.done)focusedTask=task;if(manual){toast(p.name+'的任务已发出');updateDetail();}if(focusedTask===task)updateActivity(task);}
function phaseFor(age){if(age<5.5)return 0;if(age<7)return 1;if(age<11.5)return 2;if(age<19.5)return 3;if(age<24)return 4;if(age<29.5)return 5;return 6;}
function positionOn(obj,c,t,reverse=false){obj.visible=true;const u=T.MathUtils.clamp(reverse?1-t:t,0,1),p=c.getPointAt(u);obj.position.copy(p);const dir=c.getTangentAt(u);obj.position.addScaledVector(point(-dir.z,0,dir.x).normalize(),reverse?-.235:.235);obj.position.y+=.03;obj.rotation.y=Math.atan2(dir.x,dir.z)+(reverse?Math.PI:0);}
function updateTasks(){for(const t of tasks){const age=sim-t.start,p=projects[t.project],a=agents[p.agent],phase=phaseFor(age);t.stage=phase;t.package.visible=false;
if(phase===0)positionOn(t.package,p.route,age/5.5);
if(phase===1){t.package.visible=true;t.package.position.set(hub.x+Math.cos(age*3)*.9,2.1,hub.z+Math.sin(age*3)*.9);}
if(phase===2)positionOn(t.package,a.route,(age-7)/4.5);
if(phase===4)positionOn(t.package,a.route,(age-19.5)/4.5,true);
if(phase===5)positionOn(t.package,p.route,(age-24)/5.5,true);
if(phase===6&&!t.done){t.done=true;completed++;$('#completed').textContent=completed+' 项已交付';t.package.removeFromParent();t.package.traverse(o=>{if(o.isSprite){o.material.dispose();}else if(o.isMesh&&!Object.values(materials).includes(o.material)){o.material.dispose();}});}
}
for(let i=tasks.length-1;i>=0;i--)if(tasks[i].done&&tasks[i]!==focusedTask)tasks.splice(i,1);
for(let i=0;i<2;i++){const busy=tasks.filter(t=>projects[t.project].agent===i&&t.stage===3).length;const count=tasks.filter(t=>projects[t.project].agent===i&&!t.done).length;const id=i===0?'codex':'claude';$('#'+id+'-status').textContent=busy?(i===0?'正在构建':'正在规划'):(count?'等待包裹':'准备就绪');$('#'+id+'-signal').textContent=count;agents[i].columnMat.uniforms.uPower.value=busy?1.5:.6;}
projects.forEach((p,i)=>{const n=tasks.filter(t=>t.project===i&&!t.done).length;p.label.querySelector('.count').textContent=n;p.label.querySelector('i').style.background=n?'#e6bf82':'#8caa8c';});if(focusedTask)updateActivity(focusedTask);if(selected>=0)updateDetail();}
function updateActivity(t){const p=projects[t.project],a=agents[p.agent],stage=t.stage===0?0:t.stage<=2?1:t.stage===3?2:3;$('#activity-task').textContent=p.task;$('#activity-project').textContent=p.name;$('#flow-agent').textContent=a.name;$('#activity-status').textContent=t.done?'结果已送达，项目已更新':t.stage===2?'任务正前往 '+a.name:taskMessages[stage];document.querySelectorAll('[data-step]').forEach((el,i)=>{el.classList.toggle('active',i===stage);el.classList.toggle('done',i<stage);});}
function selectProject(i){selected=i;$('#detail').hidden=false;$('.intro').style.visibility='hidden';$('#project-title').textContent=projects[i].name;$('#project-desc').textContent=projects[i].sub;$('#project-agent').textContent=agents[projects[i].agent].name;$('#project-task').textContent=projects[i].task;const t=tasks.find(t=>t.project===i&&!t.done);if(t)focusedTask=t;updateDetail();}
function updateDetail(){if(selected<0)return;const active=tasks.filter(t=>t.project===selected&&!t.done);$('#project-state').textContent=active.length?active.some(t=>t.stage===3)?'正在执行':'正在流转':'准备就绪';}
$('#close-detail').onclick=()=>{selected=-1;$('#detail').hidden=true;$('.intro').style.visibility='visible';};$('#dispatch').onclick=()=>{if(!running){setRunning(true);}dispatch(selected,true);};
let cameraTween=null;
function focusAgent(i){const a=agents[i];cameraTween={start:performance.now(),from:controls.target.clone(),to:point(a.x-2,0,a.z),zoomFrom:camera.zoom,zoomTo:1.45};toast(a.name+' 工作站 · 点击项目可派送任务');}
document.querySelectorAll('[data-agent]').forEach(el=>el.onclick=()=>focusAgent(Number(el.dataset.agent)));
$('#overview').onclick=()=>{controls.target.copy(defaultTarget);camera.position.copy(defaultPosition);camera.zoom=1;camera.updateProjectionMatrix();cameraTween=null;controls.update();};
function setRunning(v){running=v;$('#pause').ariaLabel=v?'暂停动画':'播放动画';$('#pause').innerHTML=v?'<svg viewBox="0 0 20 20"><path d="M7 5v10M13 5v10"/></svg>':'<svg viewBox="0 0 20 20"><path d="m7 4 9 6-9 6Z"/></svg>';}
$('#pause').onclick=()=>setRunning(!running);setRunning(running);
let showLabels=true;$('#labels-toggle').onclick=()=>{showLabels=!showLabels;$('#labels').style.display=showLabels?'block':'none';$('#labels-toggle').classList.toggle('selected',showLabels);$('#labels-toggle').ariaLabel=showLabels?'隐藏建筑标签':'显示建筑标签';};
$('#zoom-in').onclick=()=>{camera.zoom=Math.min(2.5,camera.zoom*1.15);camera.updateProjectionMatrix();};$('#zoom-out').onclick=()=>{camera.zoom=Math.max(.72,camera.zoom/1.15);camera.updateProjectionMatrix();};
let daylight=false;function lighting(day){daylight=day;$('#night').classList.toggle('selected',!day);$('#dawn').classList.toggle('selected',day);scene.background.set(day?'#738b91':'#13282d');scene.fog.color.copy(scene.background);hemi.intensity=day?2.8:1.7;moon.intensity=day?4:2.6;moon.color.set(day?'#ffe2b7':'#becce9');renderer.toneMappingExposure=day?1.35:1.22;bloom.strength=day?.2:.38;warm.emissiveIntensity=day?1.1:2.5;}
$('#night').onclick=()=>lighting(false);$('#dawn').onclick=()=>lighting(true);
let toastTimeout;function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>$('#toast').classList.remove('show'),3200);}
const raycaster=new T.Raycaster();let down=null;canvas.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY};});canvas.addEventListener('pointerup',e=>{if(!down||Math.hypot(e.clientX-down.x,e.clientY-down.y)>5)return;const xy=new T.Vector2(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1);raycaster.setFromCamera(xy,camera);const hits=raycaster.intersectObjects(pickables);if(hits.length)selectProject(hits[0].object.userData.project);down=null;});canvas.addEventListener('pointermove',e=>{raycaster.setFromCamera(new T.Vector2(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1),camera);canvas.style.cursor=raycaster.intersectObjects(pickables).length?'pointer':'grab';});
function resize(){const aspect=innerWidth/innerHeight,extent=aspect>1?21:30;camera.left=-extent*aspect;camera.right=extent*aspect;camera.top=extent;camera.bottom=-extent;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight);}
addEventListener('resize',resize);resize();
const screenVector=new T.Vector3();function projectLabels(){for(const {el,p} of labels){screenVector.copy(p).project(camera);const x=(screenVector.x*.5+.5)*innerWidth,y=(-screenVector.y*.5+.5)*innerHeight;el.style.left=x+'px';el.style.top=y+'px';el.style.visibility=screenVector.z>1||x<0||x>innerWidth||y<75||y>innerHeight-50?'hidden':'visible';}}
let last=performance.now(),lastUi=-1,frame=0;dispatch(0);tasks[0].start=-1.8;dispatch(1);tasks[1].start=-12;dispatch(2);tasks[2].start=-21;focusedTask=tasks[0];
function animate(now){requestAnimationFrame(animate);const dt=Math.min((now-last)/1000,.05);last=now;if(document.hidden)return;if(running)sim+=dt;controls.update();
if(cameraTween){const t=Math.min((now-cameraTween.start)/1100,1),k=1-Math.pow(1-t,3),delta=cameraTween.to.clone().sub(controls.target);const next=cameraTween.from.clone().lerp(cameraTween.to,k);camera.position.add(next.clone().sub(controls.target));controls.target.copy(next);camera.zoom=T.MathUtils.lerp(cameraTween.zoomFrom,cameraTween.zoomTo,k);camera.updateProjectionMatrix();if(t===1)cameraTween=null;}
beltTexture.offset.x=-sim*.32;beltBackTexture.offset.x=sim*.32;hubCore.rotation.y=sim*.45;core.rotation.z=sim*.2;coreRing2.rotation.y=sim*.4;
agents.forEach((a,i)=>{a.rings.rotation.y=sim*(i===0?.22:-.18);a.rings.rotation.z=Math.sin(sim*.3)*.12;a.orb.position.y=4.25+Math.sin(sim*.8+i)*.09;a.columnMat.uniforms.uTime.value=sim;});ripples.forEach((a,i)=>{const k=((sim*.18+i*.33)%1);a.scale.setScalar(.4+k*1.8);a.material.opacity=(1-k)*.12;});fireflies.rotation.y=Math.sin(sim*.025)*.02;
if(sim-lastDispatch>6.8){lastDispatch=sim;autoIndex=(autoIndex+1)%projects.length;dispatch(autoIndex);}
updateTasks();projectLabels();composer.render();frame++;if(frame===2){$('#loading').classList.add('done');window.__townReady=true;}
if(sim-lastUi>1){lastUi=sim;const minutes=42+Math.floor(sim/30);$('#simtime').textContent=(20+Math.floor(minutes/60)).toString().padStart(2,'0')+':'+(minutes%60).toString().padStart(2,'0');}
}
window.__town={getStats:()=>({tasks:tasks.map(t=>({project:projects[t.project].name,stage:t.stage,done:t.done})),completed,sim,running,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles}),dispatch,selectProject};requestAnimationFrame(animate);
