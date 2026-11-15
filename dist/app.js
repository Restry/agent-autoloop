import * as T from 'three';
import {OrbitControls} from './vendor/OrbitControls.js';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {SSAOPass} from 'three/addons/postprocessing/SSAOPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';

const $=s=>document.querySelector(s), canvas=$('#scene');
const scene=new T.Scene(); scene.background=new T.Color('#dce7d9');scene.fog=new T.FogExp2('#dce7d9',.009);
let renderer;
try {renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});}catch(e){$('#loading').innerHTML='<strong>此设备暂时无法启动三维场景</strong><span>请启用浏览器的图形加速后重试。</span>';throw e;}
renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.22;
const camera=new T.OrthographicCamera(-28,28,20,-20,.1,180);
const defaultTarget=new T.Vector3(0,0,0), defaultPosition=new T.Vector3(17,33,46);
camera.position.copy(defaultPosition);camera.lookAt(defaultTarget);
const controls=new OrbitControls(camera,canvas);controls.target.copy(defaultTarget);controls.enableDamping=true;controls.dampingFactor=.055;controls.minPolarAngle=.4;controls.maxPolarAngle=1.12;controls.minZoom=.72;controls.maxZoom=4.5;controls.enablePan=true;controls.maxTargetRadius=80;controls.autoRotate=false;
const composer=new EffectComposer(renderer);composer.addPass(new RenderPass(scene,camera));const aoPass=new SSAOPass(scene,camera,innerWidth,innerHeight,16);aoPass.kernelRadius=.48;aoPass.minDistance=.001;aoPass.maxDistance=.035;aoPass.ssaoMaterial.defines.PERSPECTIVE_CAMERA=0;aoPass.depthRenderMaterial.defines.PERSPECTIVE_CAMERA=0;composer.addPass(aoPass);const bloom=new UnrealBloomPass(new T.Vector2(innerWidth,innerHeight),.38,.55,.86);composer.addPass(bloom);composer.addPass(new OutputPass());
const hemi=new T.HemisphereLight('#fffdf4','#a8b797',2.6);scene.add(hemi);
const moon=new T.DirectionalLight('#becce9',2.6);moon.position.set(-16,32,20);moon.castShadow=true;moon.shadow.mapSize.set(2048,2048);moon.shadow.radius=3;Object.assign(moon.shadow.camera,{left:-33,right:33,top:30,bottom:-30,near:1,far:100});moon.shadow.normalBias=.035;moon.shadow.bias=-.00015;scene.add(moon);
let seed=17;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
const materials={};
function mat(name,color,roughness=.8,metalness=0,extra={}) {return materials[name]=new T.MeshStandardMaterial({color,roughness,metalness,...extra});}
const stone=mat('stone','#b6bcae'),pale=mat('pale','#e9e3ce'),wall=mat('wall','#b3b6ab'),dark=mat('dark','#7b9196',.52,.35),trim=mat('trim','#81918a',.5,.3),roof=mat('roof','#3e505d',.65,.3),roofEdge=mat('roofEdge','#50616c',.5,.4),wood=mat('wood','#6b5b46'),grass=mat('grass','#b2c391'),hedge=mat('hedge','#264835'),soil=mat('soil','#72905d'),pathMat=mat('path','#d0d0bc'),asphalt=mat('asphalt','#d6d2b9'),rail=mat('rail','#53696e',.33,.8),black=mat('black','#172a31',.4,.5);
const warm=mat('warm','#ffe1a2',.35,0,{emissive:'#ffb763',emissiveIntensity:2.5});
const softWarm=mat('softWarm','#d9ba78',.6,0,{emissive:'#d0a05b',emissiveIntensity:.6});
const cool=mat('cool','#a5ebe2',.3,.15,{emissive:'#6bc7c0',emissiveIntensity:2});
const violet=mat('violet','#c2c5ff',.3,.2,{emissive:'#a29cf4',emissiveIntensity:2.2});
const amber=mat('amber','#ffd3a5',.3,.2,{emissive:'#eaa86c',emissiveIntensity:2.2});
const glass=mat('glass','#97c3c2',.2,.4,{transparent:true,opacity:.22,depthWrite:false});
const windowDark=mat('windowDark','#273b42',.2,.5,{emissive:'#37534e',emissiveIntensity:.2});
const leafMats=[mat('leaf1','#365740'),mat('leaf2','#41634b'),mat('leaf3','#274d3a'),mat('leaf4','#4e6650')];
const water=mat('water','#62b9bd',.24,.22,{transparent:true,opacity:.8});
function noiseTexture(c1,c2,n=128){const c=document.createElement('canvas');c.width=c.height=n;const x=c.getContext('2d');x.fillStyle=c1;x.fillRect(0,0,n,n);for(let i=0;i<n*n*.7;i++){x.fillStyle=c2;x.globalAlpha=rand()*.35;x.fillRect(rand()*n,rand()*n,rand()*2+1,1);}const tx=new T.CanvasTexture(c);tx.wrapS=tx.wrapT=T.RepeatWrapping;tx.repeat.set(16,16);tx.colorSpace=T.SRGBColorSpace;return tx;}
grass.map=noiseTexture('#a6bb83','#ccce95');grass.map.repeat.set(26,26);roof.map=noiseTexture('#7c8d98','#b8c2c8');roof.map.repeat.set(1,1);asphalt.map=noiseTexture('#9eaaa8','#d0cec3');asphalt.map.repeat.set(4,1);
const boxGeo=new T.BoxGeometry(1,1,1),sphereGeo=new T.IcosahedronGeometry(1,1),cylGeo=new T.CylinderGeometry(1,1,1,24),treeGeo=new T.IcosahedronGeometry(1,1);
function mesh(geo,m,x=0,y=0,z=0,parent=scene,dynamic=false){const a=new T.Mesh(geo,m);a.position.set(x,y,z);a.castShadow=true;a.receiveShadow=true;a.userData.static=!dynamic;parent.add(a);return a;}
function box(w,h,d,m,x,y,z,parent=scene,dyn=false){const a=mesh(boxGeo,m,x,y,z,parent,dyn);a.scale.set(w,h,d);return a;}
function cyl(rt,rb,h,m,x,y,z,parent=scene,dyn=false,n=48){return mesh(new T.CylinderGeometry(rt,rb,h,n),m,x,y,z,parent,dyn);}
function torus(r,t,m,x,y,z,parent=scene,dyn=false){const a=mesh(new T.TorusGeometry(r,t,8,72),m,x,y,z,parent,dyn);a.rotation.x=Math.PI/2;return a;}
function ball(r,m,x,y,z,parent=scene,dyn=false){let a=mesh(sphereGeo,m,x,y,z,parent,dyn);a.scale.setScalar(r);return a;}
const nightEffects=[];
const glowCanvas=document.createElement('canvas');glowCanvas.width=glowCanvas.height=128;const gctx=glowCanvas.getContext('2d'),gradient=gctx.createRadialGradient(64,64,0,64,64,64);gradient.addColorStop(0,'rgba(255,255,255,.8)');gradient.addColorStop(.15,'rgba(255,255,255,.38)');gradient.addColorStop(.5,'rgba(255,255,255,.08)');gradient.addColorStop(1,'rgba(255,255,255,0)');gctx.fillStyle=gradient;gctx.fillRect(0,0,128,128);const glowTex=new T.CanvasTexture(glowCanvas);
function glow(x,y,z,color,size,opacity=.5,parent=scene){const s=new T.Sprite(new T.SpriteMaterial({map:glowTex,color,transparent:true,opacity,depthWrite:false,blending:T.AdditiveBlending}));s.position.set(x,y,z);s.scale.set(size,size,1);parent.add(s);nightEffects.push(s);return s;}
function groundGlow(x,z,color,size,opacity=.22){const m=new T.MeshBasicMaterial({map:glowTex,color,transparent:true,opacity,depthWrite:false,blending:T.AdditiveBlending});const a=mesh(new T.PlaneGeometry(size,size),m,x,.07,z,scene,true);a.rotation.x=-Math.PI/2;a.castShadow=false;nightEffects.push(a);return a;}
function beam(a,b,r,m,parent=scene,dyn=false){const delta=b.clone().sub(a);const o=mesh(new T.CylinderGeometry(r,r,delta.length(),8),m,...a.clone().add(b).multiplyScalar(.5).toArray(),parent,dyn);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return o;}
function point(x,y,z){return new T.Vector3(x,y,z);}

// Polyfork GLB 模型。文件随本站部署，来源和许可见 models/credits.html。
const modelManifest=await fetch('./models/manifest.json?v=3').then(r=>{if(!r.ok)throw new Error('模型清单加载失败');return r.json();});
const loader=new GLTFLoader(),modelLibrary=new Map();let modelLoaded=0;
try{
 await Promise.all(modelManifest.map(async info=>{const gltf=await loader.loadAsync('./'+info.path);const bounds=new T.Box3().setFromObject(gltf.scene),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());gltf.scene.traverse(o=>{if(o.isMesh){o.castShadow=true;o.receiveShadow=true;o.material.roughness=.85;o.material.metalness=Math.min(o.material.metalness,.15);}});modelLibrary.set(info.alias,{root:gltf.scene,size,offset:point(center.x,bounds.min.y,center.z)});modelLoaded++;$('#loading span').textContent='正在布置小镇 · '+modelLoaded+' / '+modelManifest.length;}));
}catch(error){$('#loading').innerHTML='<strong>模型加载失败</strong><span>请刷新页面重试。</span>';throw error;}
function placeModel(name,x,y,z,targetSize=1,dimension='width',parent=scene,dynamic=false,rotation=0){
 const source=modelLibrary.get(name),obj=new T.Group(),content=source.root.clone(true);content.position.sub(source.offset);obj.add(content);const measure=dimension==='height'?source.size.y:Math.max(source.size.x,source.size.z);obj.scale.setScalar(targetSize/measure);obj.rotation.y=rotation;obj.position.set(x,y,z);obj.traverse(o=>{if(o.isMesh)o.userData.static=!dynamic;});parent.add(obj);return obj;
}

// 地形、道路与微缩景观。
const ground=mesh(new T.PlaneGeometry(180,180),grass,0,-.1,0);ground.rotation.x=-Math.PI/2;ground.castShadow=false;
function road(points,width=1.7){const curve=new T.CatmullRomCurve3(points.map(([x,z])=>point(x,.01,z)),false,'catmullrom',.15);const a=mesh(new T.TubeGeometry(curve,80,width/2,8,false),asphalt);a.scale.y=.05;a.castShadow=false;return curve;}
road([[-23,0],[-14,0],[-8,0],[0,0],[4,0]],2.4);road([[-11,-16],[-11,-8],[-11,0],[-11,9],[-11,17]],1.8);road([[-22,-10],[-20,-9],[-11,-9],[-5,-9],[-3,-8]],1.6);road([[-23,9],[-18,9],[-11,9],[-5,9],[-3,10]],1.6);road([[4,0],[9,-4],[15,-8]],1.4);road([[4,0],[10,5],[17,9]],1.4);
function lamp(x,z,h=1.65){placeModel('lamp',x,0,z,h,'height');ball(.055,warm,x,h*.87,z);glow(x,h*.87,z,'#ffd598',.8,.35);groundGlow(x,z,'#f8cc88',4.8,.3);}
for(let x=-21;x<1;x+=4.3){lamp(x,1.5);lamp(x,-1.5);}for(let z=-14;z<16;z+=4.8){if(Math.abs(z)>2){lamp(-12.25,z);lamp(-9.7,z);}}
function tree(x,z,s=1,type=0){const names=['pineHD','birchHD','mapleHD','pineHD'];return placeModel(names[type%4],x,-.04,z,3.2*s,'height',scene,false,rand()*Math.PI*2);}
// 少量成组树木，给项目与运输线留出清楚的空地。
for(let i=0;i<100;i++){const x=(rand()-.5)*90,z=(rand()-.5)*65;if((x>-25&&x<25&&z>-18&&z<19)||(z>18&&Math.abs(x)<20))continue;tree(x,z,.65+rand()*.8,rand()<.12?2:rand()<.18?3:0);}
[[-24,-15],[-23,14],[-3,-14],[8,-13],[22,-2],[10,15],[0,-10],[-24,-3],[-23,4]].forEach(([x,z],i)=>tree(x,z,.65+rand()*.22,i%3));
function bush(x,z,w=1){return placeModel('shrubHD',x,0,z,w,'width',scene,false,rand()*6);}
for(let i=0;i<35;i++){const x=(rand()-.5)*48,z=(rand()-.5)*33;if(Math.abs(x+11)<2||Math.abs(z)<2)continue;if((x>0&&x<11&&z>7)||x<-22)bush(x,z,.6+rand()*.5);}
placeModel('bench',7.7,.02,12.8,1.7,'width',scene,false,-.6);placeModel('bench',9.4,.02,10.4,1.7,'width',scene,false,-1.3);
placeModel('flowers',7.4,0,14.3,1.7);placeModel('flowers',10.7,0,10,1.4);placeModel('birdbath',2,.05,13.6,.75,'height');
// 水池及环绕的石块。
const pondShape=new T.Shape();pondShape.moveTo(-2,0);pondShape.bezierCurveTo(-3,-2,-.8,-3,1,-2.2);pondShape.bezierCurveTo(4,-2,3,0,1.7,1.3);pondShape.bezierCurveTo(0,2,-2,1.6,-2,0);
const pond=mesh(new T.ShapeGeometry(pondShape,40),water,5,.012,10);pond.rotation.x=-Math.PI/2;
for(let i=0;i<29;i++){const a=i/29*Math.PI*2;const b=ball(.2+rand()*.12,stone,5+Math.cos(a)*2.65,.08,10+Math.sin(a)*2.1);b.scale.y=.4;}
placeModel('lilies',4,.06,10,1.4);placeModel('lilies',5.8,.06,9.4,.9);
const ripples=[];for(let i=0;i<3;i++){let m=new T.MeshBasicMaterial({color:'#89c8b7',transparent:true,opacity:.14,depthWrite:false});ripples.push(torus(.5+i*.5,.009,m,5,.04,10,scene,true));}

const projects=[
{name:'曙光',sub:'家庭影像与生活记录',task:'构建相册时间线',x:-18,z:-9,agent:0,type:0},
{name:'门神',sub:'个人 Agent 凭据管理',task:'整理凭据管理流程',x:-5,z:-9,agent:1,type:1},
{name:'Remotastic',sub:'遥控器与桌面交互',task:'完善按钮映射',x:-19,z:7,agent:0,type:2},
{name:'GemFlow',sub:'业务流程与协作空间',task:'检查库存同步流程',x:-5,z:7,agent:1,type:3},
{name:'灵感花园',sub:'设计参考与视觉探索',task:'归档新的设计灵感',x:-19,z:15,agent:1,type:4},
{name:'实验室',sub:'新想法从这里开始',task:'搭建交互原型',x:-5,z:15,agent:0,type:5}
];
const workDefinitions=[
 [['梳理相册交互','整理照片浏览、筛选和时间线的交互要求。'],['构建相册时间线','实现按日期浏览照片，并连接相册视图。'],['验证照片加载','检查图片加载、日期切换和空状态。']],
 [['梳理凭据权限','整理凭据的使用范围和授权规则。'],['实现凭据检索','实现凭据搜索和筛选入口。'],['验证授权流程','检查授权提示与凭据访问流程。']],
 [['设计按键映射','整理遥控器按键和操作的对应关系。'],['完善按钮映射','实现按键配置和操作切换。'],['检查遥控器交互','验证单击、长按和配置保存。']],
 [['梳理库存流程','整理库存变动与同步规则。'],['实现库存同步','完成库存同步逻辑和异常处理。'],['核对同步结果','检查数据一致性及重复执行。']],
 [['筛选设计参考','整理新参考，标记可以使用的视觉方向。'],['生成灵感页面','把筛选后的内容排成可浏览的页面。'],['检查素材出处','核对素材来源和页面可读性。']],
 [['定义原型范围','明确本轮需要验证的交互和场景。'],['搭建交互原型','把选定的交互制作成可运行原型。'],['验证操作路径','检查关键按钮、导航和任务状态。']]
];
const areaNames=['设计室','开发室','验证室'],bayOffsets=[-1.7,0,1.7];
projects.forEach((p,i)=>{p.nextArea=1;p.workspaces=workDefinitions[i].map((d,j)=>({name:areaNames[j],title:d[0],description:d[1],agent:j===0?1:0,latest:null,anchor:point(p.x+1.83,.55,p.z+bayOffsets[j])}));});
const pickables=[],workspacePickables=[],labels=[];

function label(text,x,y,z,kind='',action){const el=document.createElement('button');el.className='world-label '+kind;el.innerHTML=text;$('#labels').append(el);if(action)el.addEventListener('click',action);labels.push({el,p:point(x,y,z)});return el;}
function villa(p,index){const group=new T.Group();group.position.set(p.x,0,p.z);scene.add(group);const w=2.65,d=2.6,levels=p.type===3?3:2,h=levels*1.05;
box(6.7,.22,5.8,stone,0,0,0,group);box(6.5,.05,5.6,soil,0,.13,0,group);box(3.7,.06,4.8,pathMat,-.95,.16,0,group);box(2.35,.08,4.8,grass,1.95,.16,0,group);
// 石板接缝、花坛与矮墙。
for(let x=-2.5;x<.9;x+=.4){for(let z=-2.2;z<2.5;z+=.5){if(Math.abs(x+.6)<1.5&&Math.abs(z+.6)<1.5)continue;box(.36,.025,.45,rand()>.5?stone:pathMat,x,.2,z,group);}}
box(6.6,.3,.12,pale,0,.3,-2.85,group);box(.12,.3,5.8,pale,-3.25,.3,0,group);box(.12,.3,5.8,pale,3.25,.3,0,group);box(2.3,.3,.12,pale,-2.1,.3,2.85,group);box(2.3,.3,.12,pale,2.1,.3,2.85,group);
placeModel('hedge',-.2,.2,-2.5,5.8,'width',group).scale.y*=.42;
const houses=['family','split','cottage','townhouse','ranch','family'];
placeModel(houses[index],-.8,.24,-.45,3.35,'width',group);
placeModel('planter',-.8,.2,1.8,1.25,'width',group);
placeModel('shrubHD',-2.7,.2,.9,.62,'width',group);
placeModel('flowers',-2.55,.2,-1.4,.85,'width',group);
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
 const indicatorMaterial=softWarm.clone();const indicator=ball(.075,indicatorMaterial,2.75,.54,z+.58,group,true);p.workspaces[j].indicator=indicator;
 const areaProxy=box(2.1,1.65,1.5,new T.MeshBasicMaterial({visible:false}),p.x+1.83,1,p.z+z,scene,true);areaProxy.visible=false;areaProxy.castShadow=false;areaProxy.userData={project:index,area:j};workspacePickables.push(areaProxy);
 const card=document.createElement('button');card.className='room-card';card.hidden=true;card.innerHTML='<span class=room-top><span>0'+(j+1)+' · '+areaNames[j]+'</span><span class=room-agent>'+(['Codex','Claude'][p.workspaces[j].agent])+'</span></span><strong>'+p.workspaces[j].title+'</strong><span class=room-state>待派送</span>';card.onclick=()=>selectWorkArea(index,j);$('#workspaces').append(card);p.workspaces[j].card=card;
 if(j===0){
  placeModel('shed',1.83,.33,z,1.32,'width',group);
 }else if(j===1){
  box(.73,.15,.7,stone,1.65,.43,z,group);box(.62,.065,.58,softWarm,1.65,.54,z,group);
  box(.32,.28,.32,wood,2.27,.5,z+.28,group);box(.35,.025,.08,pale,2.27,.65,z+.28,group);
 }else{
  box(.38,.32,.38,wood,1.25,.52,z-.25,group);box(.4,.025,.075,softWarm,1.25,.69,z-.25,group);
  box(.48,.4,.43,wood,1.85,.56,z+.2,group);box(.5,.025,.08,pale,1.85,.77,z+.2,group);
 }
});
placeModel('planter',-2.7,.2,2.05,.65,'width',group);
// 小径连到主路。
const roadZ=p.z<0?-9:p.z<10?9:15;road([[p.x,p.z+3],[p.x,p.z+3.8],[-11,roadZ]],.65);
lamp(p.x-3,p.z+3,1.25);lamp(p.x+3,p.z+3,1.25);
const proxy=box(6.7,h+2,5.8,new T.MeshBasicMaterial({visible:false}),p.x,(h+2)/2,p.z,scene,true);proxy.visible=false;proxy.castShadow=false;proxy.receiveShadow=false;proxy.userData.project=index;pickables.push(proxy);
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
const route=new T.CurvePath();route.add(branch);route.add(trunkPart);route.add(feed);p.route=route;p.workspaces.forEach((area,j)=>{const r=new T.CurvePath();r.add(new T.LineCurve3(point(p.x+2.95,beltY,p.z+bayOffsets[j]),point(px,beltY,p.z+bayOffsets[j])));if(j<2)r.add(new T.LineCurve3(point(px,beltY,p.z+bayOffsets[j]),point(px,beltY,p.z+1.7)));route.curves.forEach(c=>r.add(c));area.route=r;});
box(1.1,.1,1.1,trim,trunkX,beltY-.06,joinZ);box(.95,.025,.95,black,trunkX,beltY,joinZ);
});
agents.forEach((a,i)=>{a.route=pipeline([[hub.x+2.7,.85,i===0?1.3:-1.3],[8,.7,i===0?2.8:-2.8],[a.x-4,.7,a.z],[a.x-2.1,1.3,a.z]]);});
// 草地上的零星微光。
const fireCount=75,firePositions=new Float32Array(fireCount*3);for(let i=0;i<fireCount;i++){firePositions[i*3]=(rand()-.5)*48;firePositions[i*3+1]=.3+rand()*3;firePositions[i*3+2]=(rand()-.5)*32;}const fireGeo=new T.BufferGeometry();fireGeo.setAttribute('position',new T.BufferAttribute(firePositions,3));const fireflies=new T.Points(fireGeo,new T.PointsMaterial({color:'#dbdaa5',size:.055,transparent:true,opacity:.55,depthWrite:false,blending:T.AdditiveBlending}));scene.add(fireflies);

const selectionFrame=new T.LineLoop(new T.BufferGeometry().setFromPoints([point(-1,0,-.76),point(1,0,-.76),point(1,0,.76),point(-1,0,.76)]),new T.LineBasicMaterial({color:'#d69a45',depthTest:false}));selectionFrame.renderOrder=20;selectionFrame.visible=false;scene.add(selectionFrame);

// 合并静态建筑，减少渲染调用；动画对象独立保留。
scene.updateMatrixWorld(true);const batches=new Map(),remove=[];
scene.traverse(o=>{if(o.isMesh && o.userData.static && !Array.isArray(o.material)){const key=o.material.uuid+'-'+o.castShadow+'-'+o.receiveShadow+'-'+Object.keys(o.geometry.attributes).sort().join(',');if(!batches.has(key))batches.set(key,{m:o.material,cast:o.castShadow,receive:o.receiveShadow,geos:[]});let geo=o.geometry.clone().applyMatrix4(o.matrixWorld);if(geo.index)geo=geo.toNonIndexed();for(const k of Object.keys(geo.attributes))if(!['position','normal','uv','color'].includes(k))geo.deleteAttribute(k);batches.get(key).geos.push(geo);remove.push(o);}});
for(const b of batches.values()){const geo=mergeGeometries(b.geos,false);if(geo){const o=new T.Mesh(geo,b.m);o.castShadow=b.cast;o.receiveShadow=b.receive;scene.add(o);}b.geos.forEach(g=>g.dispose());}remove.forEach(o=>o.removeFromParent());

let running=!matchMedia('(prefers-reduced-motion: reduce)').matches,sim=0,completed=0,selected=-1,selectedArea=1,lastDispatch=0,autoIndex=0,focusedTask=null,inspectedTask=null,cameraTween=null,taskSequence=0;
const tasks=[];
const phaseNames=['前往中台','中台分配中','送往 Agent','Agent 执行中','结果返回中台','送回工作区','已交付'];
function areaState(area){const t=area.latest;return t?phaseNames[t.stage]:'待派送';}
function createParcel(color){const g=placeModel('box',0,0,0,.7,'width',scene,true);const tag=new T.MeshBasicMaterial({color});const label=box(.22,.12,.014,tag,0,.38,.52,g,true);label.userData.ownedMaterial=true;return g;}
function dispatch(i,manual=false,areaIndex=null){
 const p=projects[i];let j=areaIndex??p.nextArea;const existing=tasks.find(t=>t.project===i&&t.area===j&&!t.done);
 if(existing){if(manual){selectParcel(existing);toast('这项任务正在进行。');}return existing;}
 if(tasks.filter(t=>!t.done).length>=9){if(manual)toast('当前任务较多，请等一项任务完成。');return null;}
 const area=p.workspaces[j];p.nextArea=(j+1)%3;
 const task={project:i,area:j,agent:area.agent,title:area.title,description:area.description,route:area.route,start:sim,stage:0,package:createParcel(area.agent===0?'#b6a0f3':'#eabb77'),id:++taskSequence,done:false};
 const hit=document.createElement('button');hit.className='parcel-hit';hit.setAttribute('aria-label','查看包裹：'+p.name+' · '+task.title+' · '+agents[task.agent].name);hit.title='查看任务';hit.innerHTML='<span></span>';hit.onclick=e=>{e.stopPropagation();selectParcel(task);};$('#parcels').append(hit);task.hit=hit;
 area.latest=task;tasks.push(task);if(manual||!focusedTask||focusedTask.done)focusedTask=task;
 if(manual){toast(area.name+'的任务已发出');selectParcel(task);}if(focusedTask===task)updateActivity(task);return task;
}
function phaseFor(age){if(age<5.5)return 0;if(age<7)return 1;if(age<11.5)return 2;if(age<19.5)return 3;if(age<24)return 4;if(age<29.5)return 5;return 6;}
function positionOn(obj,c,t,reverse=false){obj.visible=true;const u=T.MathUtils.clamp(reverse?1-t:t,0,1),p=c.getPointAt(u);obj.position.copy(p);const dir=c.getTangentAt(u);obj.position.addScaledVector(point(-dir.z,0,dir.x).normalize(),reverse?-.235:.235);obj.position.y+=.03;obj.rotation.y=Math.atan2(dir.x,dir.z)+(reverse?Math.PI:0);}
const parcelScreen=new T.Vector3();
function updateTasks(){
 for(const t of tasks){const age=sim-t.start,a=agents[t.agent],phase=phaseFor(age);t.stage=phase;t.package.visible=false;
  if(phase===0)positionOn(t.package,t.route,age/5.5);
  if(phase===1){t.package.visible=true;t.package.position.set(hub.x+Math.cos(age*3)*.9,2.1,hub.z+Math.sin(age*3)*.9);}
  if(phase===2)positionOn(t.package,a.route,(age-7)/4.5);
  if(phase===4)positionOn(t.package,a.route,(age-19.5)/4.5,true);
  if(phase===5)positionOn(t.package,t.route,(age-24)/5.5,true);
  t.hit.hidden=!t.package.visible;
  if(t.package.visible){parcelScreen.copy(t.package.position).add(point(0,.25,0)).project(camera);const x=(parcelScreen.x*.5+.5)*innerWidth,y=(-parcelScreen.y*.5+.5)*innerHeight;t.hit.style.left=x+'px';t.hit.style.top=y+'px';t.hit.hidden=parcelScreen.z>1||x<0||x>innerWidth||y<80||y>innerHeight-40;t.hit.classList.toggle('inspected',inspectedTask===t);}
  if(phase===6&&!t.done){t.done=true;completed++;$('#completed').textContent=completed+' 项已交付';t.package.removeFromParent();t.hit.remove();t.package.traverse(o=>{if(o.isMesh&&o.userData.ownedMaterial)o.material.dispose();});}
 }
 for(let i=tasks.length-1;i>=0;i--)if(tasks[i].done&&tasks[i]!==focusedTask&&tasks[i]!==inspectedTask)tasks.splice(i,1);
 for(let i=0;i<2;i++){const busy=tasks.filter(t=>t.agent===i&&t.stage===3).length,count=tasks.filter(t=>t.agent===i&&!t.done).length,id=i===0?'codex':'claude';$('#'+id+'-status').textContent=busy?(i===0?'正在构建':'正在规划'):(count?'等待包裹':'准备就绪');$('#'+id+'-signal').textContent=count;agents[i].columnMat.uniforms.uPower.value=busy?1.5:.6;}
 projects.forEach((p,i)=>{const n=tasks.filter(t=>t.project===i&&!t.done).length;p.label.querySelector('.count').textContent=n;p.label.querySelector('i').style.background=n?'#e6bf82':'#8caa8c';p.workspaces.forEach(area=>{const t=area.latest,color=!t?'#90a68a':t.done?'#79ae8c':t.stage===3?'#a496d6':'#e3b168';area.indicator.material.color.set(color);area.indicator.material.emissive.set(color);area.indicator.material.emissiveIntensity=t&&!t.done?.65:.15;const status=areaState(area);if(area.card.querySelector('.room-state').textContent!==status)area.card.querySelector('.room-state').textContent=status;});});
 if(focusedTask)updateActivity(focusedTask);if(selected>=0)updateDetail();if(inspectedTask)updateParcelDetail();
}
function updateActivity(t){const p=projects[t.project],a=agents[t.agent],stage=t.stage===0?0:t.stage<=2?1:t.stage===3?2:3;$('#activity-task').textContent=t.title;$('#activity-project').textContent=p.name;$('#flow-agent').textContent=a.name;$('#activity-status').textContent=phaseNames[t.stage];document.querySelectorAll('[data-step]').forEach((el,i)=>{el.classList.toggle('active',i===stage);el.classList.toggle('done',i<stage);});}
function moveCamera(target,zoom,resetAngle=false){
 const offset=resetAngle?defaultPosition.clone().sub(defaultTarget):camera.position.clone().sub(controls.target);
 cameraTween={start:performance.now(),duration:matchMedia('(prefers-reduced-motion: reduce)').matches?0:1150,from:controls.target.clone(),to:target.clone(),positionFrom:camera.position.clone(),positionTo:target.clone().add(offset),zoomFrom:camera.zoom,zoomTo:zoom};
}
controls.addEventListener('start',()=>{cameraTween=null;});
function selectProject(i){projects.forEach(p=>p.workspaces.forEach(a=>a.card.hidden=true));selected=i;selectedArea=1;closeParcel();document.body.classList.add('project-focus');$('#detail').hidden=false;$('.intro').style.visibility='hidden';$('#project-title').textContent=projects[i].name;$('#project-desc').textContent=projects[i].sub;moveCamera(point(projects[i].x+.45,.3,projects[i].z+.2),Math.min(3.5,Math.max(2.25,innerWidth/440)),true);updateDetail();}
function selectWorkArea(i,j){if(selected!==i)selectProject(i);selectedArea=j;const area=projects[i].workspaces[j];if(area.latest)focusedTask=area.latest;updateDetail();}
function updateDetail(){if(selected<0)return;const p=projects[selected],area=p.workspaces[selectedArea];$('#project-agent').textContent=agents[area.agent].name;$('#project-state').textContent=areaState(area);$('#workarea-name').textContent=area.name;$('#project-task').textContent=area.title;$('#task-description').textContent=area.description;$('#dispatch').innerHTML=area.latest&&!area.latest.done?'查看正在进行的任务 <span>↗</span>':'派送这项任务 <span>↗</span>';p.workspaces.forEach((a,j)=>a.card.classList.toggle('selected',j===selectedArea));selectionFrame.visible=true;selectionFrame.position.copy(area.anchor);selectionFrame.position.y=.43;}
function closeProject(){selected=-1;$('#detail').hidden=true;$('.intro').style.visibility='visible';document.body.classList.remove('project-focus');selectionFrame.visible=false;projects.forEach(p=>p.workspaces.forEach(a=>a.card.hidden=true));$('#room-connectors').innerHTML='';}
function overview(){closeProject();closeParcel();moveCamera(defaultTarget,1,true);}
$('#close-detail').onclick=overview;$('#overview').onclick=overview;
$('#dispatch').onclick=()=>{if(selected<0)return;const area=projects[selected].workspaces[selectedArea];if(area.latest&&!area.latest.done){selectParcel(area.latest);return;}if(!running)setRunning(true);dispatch(selected,true,selectedArea);};
function selectParcel(task){inspectedTask=task;focusedTask=task;$('#parcel-detail').hidden=false;$('.agents').style.visibility='hidden';$('#parcel-title').textContent=task.title;$('#parcel-description').textContent=task.description;$('#parcel-id').textContent='包裹 '+String(task.id).padStart(3,'0');$('#parcel-project').textContent=projects[task.project].name+' · '+projects[task.project].workspaces[task.area].name;$('#parcel-agent').textContent=agents[task.agent].name;updateParcelDetail();}
function updateParcelDetail(){const t=inspectedTask;if(!t)return;$('#parcel-state').textContent=phaseNames[t.stage];$('#parcel-destination').textContent=t.stage<2?'调度中台':t.stage<4?agents[t.agent].name:t.stage===4?'调度中台':projects[t.project].name+' · '+projects[t.project].workspaces[t.area].name;$('#parcel-progress').style.width=Math.min(100,((sim-t.start)/29.5)*100)+'%';document.querySelectorAll('#parcel-stages li').forEach((el,i)=>{const phase=t.stage===0?0:t.stage<3?1:t.stage===3?2:3;el.classList.toggle('active',i===phase&&!t.done);el.classList.toggle('done',i<phase||t.done);});$('#parcel-note').textContent=t.done?'已送回工作区，查看窗口会保留这次交付。':t.stage===3?'Agent 正在处理任务，完成后包裹会带回结果。':'状态会随这个包裹实时更新。';}
function closeParcel(){inspectedTask=null;$('#parcel-detail').hidden=true;$('.agents').style.visibility='visible';}
$('#close-parcel').onclick=closeParcel;$('#parcel-locate').onclick=()=>{if(!inspectedTask)return;const t=inspectedTask;selectProject(t.project);selectWorkArea(t.project,t.area);};
function focusAgent(i){closeProject();const a=agents[i];moveCamera(point(a.x-2,0,a.z),1.45);toast(a.name+' 工作站');}
document.querySelectorAll('[data-agent]').forEach(el=>el.onclick=()=>focusAgent(Number(el.dataset.agent)));
addEventListener('keydown',e=>{if(e.key==='Escape'){if(inspectedTask)closeParcel();else if(selected>=0)overview();}});
function setRunning(v){running=v;$('#pause').ariaLabel=v?'暂停动画':'播放动画';$('#pause').innerHTML=v?'<svg viewBox="0 0 20 20"><path d="M7 5v10M13 5v10"/></svg>':'<svg viewBox="0 0 20 20"><path d="m7 4 9 6-9 6Z"/></svg>';}
$('#pause').onclick=()=>setRunning(!running);setRunning(running);
let showLabels=true;$('#labels-toggle').onclick=()=>{showLabels=!showLabels;$('#labels').style.display=showLabels?'block':'none';$('#labels-toggle').classList.toggle('selected',showLabels);$('#labels-toggle').ariaLabel=showLabels?'隐藏建筑标签':'显示建筑标签';};
$('#zoom-in').onclick=()=>{cameraTween=null;camera.zoom=Math.min(4.5,camera.zoom*1.15);camera.updateProjectionMatrix();};$('#zoom-out').onclick=()=>{cameraTween=null;camera.zoom=Math.max(.72,camera.zoom/1.15);camera.updateProjectionMatrix();};
let daylight=true;
function lighting(day){
 daylight=day;document.body.dataset.theme=day?'day':'night';$('#night').classList.toggle('selected',!day);$('#dawn').classList.toggle('selected',day);$('#night').setAttribute('aria-pressed',String(!day));$('#dawn').setAttribute('aria-pressed',String(day));
 scene.background.set(day?'#dce7d9':'#465c75');scene.fog.color.copy(scene.background);scene.fog.density=day?.0025:.005;
 hemi.color.set(day?'#fffdf4':'#c1d5ff');hemi.groundColor.set(day?'#a8b797':'#708876');hemi.intensity=day?2:1.8;
 moon.intensity=day?2.5:1.5;moon.color.set(day?'#fff1d8':'#bfd2ff');renderer.toneMappingExposure=day?.96:1.06;bloom.strength=day?.14:.28;
 warm.emissiveIntensity=day?.25:2.4;softWarm.emissiveIntensity=day?.1:.6;cool.emissiveIntensity=day?.7:1.7;violet.emissiveIntensity=day?.25:1.9;amber.emissiveIntensity=day?.25:1.9;violet.color.set(day?'#8975c4':'#c2c5ff');amber.color.set(day?'#c68b45':'#ffd3a5');
 nightEffects.forEach(o=>o.visible=!day);fireflies.visible=!day;hubLight.intensity=day?1:14;agents.forEach(a=>{a.light.intensity=day?2:20;a.columnMat.blending=day?T.NormalBlending:T.AdditiveBlending;a.columnMat.needsUpdate=true;});
 $('#simtime').textContent=day?'10:24':'20:42';
}
$('#night').onclick=()=>lighting(false);$('#dawn').onclick=()=>lighting(true);lighting(true);
let toastTimeout;function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>$('#toast').classList.remove('show'),3200);}
const raycaster=new T.Raycaster();let down=null;
function hitTest(e){const r=canvas.getBoundingClientRect();raycaster.setFromCamera(new T.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1),camera);if(selected>=0){const rooms=raycaster.intersectObjects(workspacePickables.filter(o=>o.userData.project===selected));if(rooms.length)return {...rooms[0].object.userData,kind:'room'};}const hits=raycaster.intersectObjects(pickables);return hits.length?{...hits[0].object.userData,kind:'project'}:null;}
canvas.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY};});canvas.addEventListener('pointerup',e=>{const tap=down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<5;down=null;if(!tap)return;const hit=hitTest(e);if(hit?.kind==='room')selectWorkArea(hit.project,hit.area);else if(hit)selectProject(hit.project);});canvas.addEventListener('pointermove',e=>{canvas.style.cursor=hitTest(e)?'pointer':'grab';});
function resize(){const aspect=innerWidth/innerHeight,extent=aspect>1?21:30;camera.left=-extent*aspect;camera.right=extent*aspect;camera.top=extent;camera.bottom=-extent;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight);}
addEventListener('resize',resize);resize();
const screenVector=new T.Vector3();
function projectLabels(){
 for(const {el,p} of labels){screenVector.copy(p).project(camera);const x=(screenVector.x*.5+.5)*innerWidth,y=(-screenVector.y*.5+.5)*innerHeight;el.style.left=x+'px';el.style.top=y+'px';el.style.visibility=screenVector.z>1||x<0||x>innerWidth||y<75||y>innerHeight-50?'hidden':'visible';}
 if(selected<0)return;
 if(inspectedTask){projects[selected].workspaces.forEach(a=>a.card.hidden=true);$('#room-connectors').innerHTML='';return;}
 const p=projects[selected],spots=p.workspaces.map(a=>{const v=a.anchor.clone().project(camera);return {x:(v.x*.5+.5)*innerWidth,y:(-v.y*.5+.5)*innerHeight};});
 const order=[0,1,2].sort((a,b)=>spots[a].y-spots[b].y),cardWidth=innerWidth<700?166:190,gap=78;
 const x=Math.min(innerWidth-cardWidth-24,Math.max(...spots.map(v=>v.x))+125);let firstY=Math.max(110,Math.min(innerHeight-300,spots[order[0]].y-35));let lines='';
 order.forEach((j,k)=>{const area=p.workspaces[j],pos=spots[j],y=Math.max(firstY+k*gap,pos.y-32);area.card.hidden=false;area.card.style.left=x+'px';area.card.style.top=Math.min(innerHeight-150,y)+'px';lines+='<path d="M '+pos.x+' '+pos.y+' L '+(x-18)+' '+(Math.min(innerHeight-150,y)+32)+' L '+x+' '+(Math.min(innerHeight-150,y)+32)+'"/>';});
 $('#room-connectors').innerHTML=lines;
}
let last=performance.now(),lastUi=-1,frame=0;dispatch(0);tasks[0].start=-1.8;dispatch(1);tasks[1].start=-12;dispatch(2);tasks[2].start=-21;focusedTask=tasks[0];
function animate(now){requestAnimationFrame(animate);const dt=Math.min((now-last)/1000,.05);last=now;if(document.hidden)return;if(running)sim+=dt;controls.update();
if(cameraTween){const t=cameraTween.duration===0?1:Math.min((now-cameraTween.start)/cameraTween.duration,1),k=t*t*(3-2*t);controls.target.copy(cameraTween.from).lerp(cameraTween.to,k);camera.position.copy(cameraTween.positionFrom).lerp(cameraTween.positionTo,k);camera.zoom=T.MathUtils.lerp(cameraTween.zoomFrom,cameraTween.zoomTo,k);camera.updateProjectionMatrix();camera.lookAt(controls.target);if(t===1)cameraTween=null;}

beltTexture.offset.x=-sim*.32;beltBackTexture.offset.x=sim*.32;hubCore.rotation.y=sim*.45;core.rotation.z=sim*.2;coreRing2.rotation.y=sim*.4;
agents.forEach((a,i)=>{a.rings.rotation.y=sim*(i===0?.22:-.18);a.rings.rotation.z=Math.sin(sim*.3)*.12;a.orb.position.y=4.25+Math.sin(sim*.8+i)*.09;a.columnMat.uniforms.uTime.value=sim;});ripples.forEach((a,i)=>{const k=((sim*.18+i*.33)%1);a.scale.setScalar(.4+k*1.8);a.material.opacity=(1-k)*.12;});fireflies.rotation.y=Math.sin(sim*.025)*.02;
if(sim-lastDispatch>6.8){lastDispatch=sim;autoIndex=(autoIndex+1)%projects.length;dispatch(autoIndex);}
updateTasks();projectLabels();composer.render();frame++;if(frame===2){$('#loading').classList.add('done');window.__townReady=true;}
if(sim-lastUi>1){lastUi=sim;const minutes=(daylight?24:42)+Math.floor(sim/30);$('#simtime').textContent=((daylight?10:20)+Math.floor(minutes/60)).toString().padStart(2,'0')+':'+(minutes%60).toString().padStart(2,'0');}
}
window.__town={getStats:()=>({modelsLoaded:modelLoaded,daylight,selectedProject:selected,selectedArea,cameraZoom:camera.zoom,inspectedTaskId:inspectedTask?.id??null,tasks:tasks.map(t=>({id:t.id,project:projects[t.project].name,area:t.area,agent:agents[t.agent].name,title:t.title,stage:t.stage,done:t.done})),completed,sim,running,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles}),dispatch,selectProject,selectWorkArea,selectParcel,overview};requestAnimationFrame(animate);
