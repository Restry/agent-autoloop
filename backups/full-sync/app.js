import {startHub,stateNames,terminal,isBusy,isConnected,ruleAction,action,showWhy,openBoard,message} from './hub.js';
import * as T from 'three';
import {roundedRoute} from './routes.js';
import {OrbitControls} from './vendor/OrbitControls.js';
import {mergeGeometries} from './vendor/BufferGeometryUtils.js';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {UnrealBloomPass} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {SVGLoader} from 'three/addons/loaders/SVGLoader.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {SSAOPass} from 'three/addons/postprocessing/SSAOPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';

const $=s=>document.querySelector(s), canvas=$('#scene');
const agentDefinitions=[
 {key:'codex',name:'Codex',icon:'codex',color:'#b2adff',face:'#6671e4',edge:'#3a46a5',x:17,z:10,busy:'正在构建'},
 {key:'claude',name:'Claude',icon:'claude',color:'#efbd87',face:'#d3916e',edge:'#925c40',x:16,z:-9,busy:'正在规划'},
 {key:'copilot',name:'GitHub Copilot',icon:'copilot',color:'#8bdbdf',face:'#74bcc8',edge:'#306574',x:25,z:0,busy:'正在验证'}
];
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
const cyan=mat('cyan','#8bdbdf',.3,.2,{emissive:'#68c5d0',emissiveIntensity:1.9});
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

const claudeReference=await loader.loadAsync('./icons/claude-reference.glb');
const emblemLibrary=new Map(),svgLoader=new SVGLoader();
try{await Promise.all(agentDefinitions.map(async def=>{const response=await fetch('./icons/'+def.icon+'.svg');if(!response.ok)throw new Error(def.name+' 图标加载失败');const data=svgLoader.parse(await response.text());const vb=(data.xml.getAttribute('viewBox')||'0 0 24 24').split(/[ ,]+/).map(Number),size=vb[2];const geometries=[];for(const path of data.paths){for(const shape of SVGLoader.createShapes(path)){const geometry=new T.ExtrudeGeometry(shape,{depth:size*.1,bevelEnabled:true,bevelThickness:size*.006,bevelSize:size*.0045,bevelSegments:3,curveSegments:20,steps:1});geometries.push(geometry);}}emblemLibrary.set(def.key,geometries);}));}catch(error){$('#loading').innerHTML='<strong>Agent 图标加载失败</strong><span>请刷新页面重试。</span>';throw error;}
function makeEmblem(def,parent){
 const pivot=new T.Group();parent.add(pivot);
 if(def.key==='claude'){
  const model=claudeReference.scene.clone(true);const bounds=new T.Box3().setFromObject(model),center=bounds.getCenter(new T.Vector3()),size=bounds.getSize(new T.Vector3());
  model.position.sub(center);const holder=new T.Group();holder.add(model);holder.scale.setScalar(2.7/Math.max(size.x,size.y));pivot.add(holder);
  model.traverse(o=>{if(o.isMesh){o.userData.static=false;o.castShadow=true;o.receiveShadow=true;o.material=o.material.clone();if(o.material.name.startsWith('White')){o.material.emissive.set('#fff8e8');o.material.emissiveIntensity=.02;pivot.userData.frontMaterial=o.material;}}});
  pivot.userData.baseYaw=.08;
 }else{
  // 采用参考模型的圆角方形徽章结构：厚底座和白色立体品牌标志。
  const shape=new T.Shape(),h=1.2,r=.4;shape.moveTo(-h+r,-h);shape.lineTo(h-r,-h);shape.quadraticCurveTo(h,-h,h,-h+r);shape.lineTo(h,h-r);shape.quadraticCurveTo(h,h,h-r,h);shape.lineTo(-h+r,h);shape.quadraticCurveTo(-h,h,-h,h-r);shape.lineTo(-h,-h+r);shape.quadraticCurveTo(-h,-h,-h+r,-h);
  const baseGeometry=new T.ExtrudeGeometry(shape,{depth:.38,bevelEnabled:true,bevelThickness:.12,bevelSize:.12,bevelSegments:5,curveSegments:16,steps:1});baseGeometry.translate(0,0,-.19);
  const face=new T.MeshStandardMaterial({color:def.face,roughness:.43,metalness:.12});const side=new T.MeshStandardMaterial({color:def.edge,roughness:.45,metalness:.1});mesh(baseGeometry,[face,side],0,0,0,pivot,true);
  const logo=new T.Group();pivot.add(logo);const front=new T.MeshStandardMaterial({color:'#fffaf1',roughness:.4,metalness:.08,emissive:'#fff8e8',emissiveIntensity:.02}),edge=new T.MeshStandardMaterial({color:'#e3e2d7',roughness:.43,metalness:.12});
  emblemLibrary.get(def.key).forEach(geometry=>mesh(geometry,[front,edge],0,0,0,logo,true));const bounds=new T.Box3().setFromObject(logo),center=bounds.getCenter(new T.Vector3()),size=bounds.getSize(new T.Vector3());logo.children.forEach(part=>part.position.sub(center));const scale=2/Math.max(size.x,size.y);logo.scale.set(scale,-scale,scale);logo.position.z=.39;pivot.userData.frontMaterial=front;pivot.userData.baseYaw=.28;
 }
 pivot.position.y=4.25;pivot.rotation.set(-.22,pivot.userData.baseYaw,0);return pivot;
}

// 地形、道路与微缩景观。
const pondShape=new T.Shape();pondShape.moveTo(-2.9,-.9);pondShape.bezierCurveTo(-3.5,.1,-2.8,1.8,-1.2,2.1);pondShape.bezierCurveTo(0,2.5,2.8,2.1,3,.8);pondShape.bezierCurveTo(3.2,-.2,2,-.5,1.5,-1.3);pondShape.bezierCurveTo(.8,-2.3,-1.8,-2.2,-2.9,-.9);pondShape.closePath();
const terrainShape=new T.Shape([new T.Vector2(-90,-90),new T.Vector2(90,-90),new T.Vector2(90,90),new T.Vector2(-90,90)]);
const pondHole=new T.Path(pondShape.getPoints(90).map(v=>new T.Vector2(v.x*1.16+5,v.y*1.16-10)));terrainShape.holes.push(pondHole);
const ground=mesh(new T.ShapeGeometry(terrainShape),grass,0,-.1,0);ground.rotation.x=-Math.PI/2;ground.castShadow=false;const groundUV=ground.geometry.attributes.uv;for(let i=0;i<groundUV.count;i++)groundUV.setXY(i,(groundUV.getX(i)+90)/180,(groundUV.getY(i)+90)/180);
function road(points,width=1.7){const curve=new T.CatmullRomCurve3(points.map(([x,z])=>point(x,.01,z)),false,'catmullrom',.15);const a=mesh(new T.TubeGeometry(curve,80,width/2,8,false),asphalt);a.scale.y=.05;a.castShadow=false;return curve;}
road([[-23,0],[-14,0],[-8,0],[0,0],[4,0]],2.4);road([[-11,-16],[-11,-8],[-11,0],[-11,9],[-11,17]],1.8);road([[-22,-10],[-20,-9],[-11,-9],[-5,-9],[-3,-8]],1.6);road([[-23,9],[-18,9],[-11,9],[-5,9],[-3,10]],1.6);
function lamp(x,z,h=1.65){placeModel('lamp',x,0,z,h,'height');ball(.055,warm,x,h*.87,z);glow(x,h*.87,z,'#ffd598',.8,.35);groundGlow(x,z,'#f8cc88',4.8,.3);}
for(let x=-21;x<1;x+=4.3){lamp(x,1.5);lamp(x,-1.5);}for(let z=-14;z<16;z+=4.8){if(Math.abs(z)>2){lamp(-12.25,z);lamp(-9.7,z);}}
function tree(x,z,s=1,type=0){const names=['pineHD','birchHD','mapleHD','pineHD'];return placeModel(names[type%4],x,-.04,z,3.2*s,'height',scene,false,rand()*Math.PI*2);}
// 少量成组树木，给项目与运输线留出清楚的空地。
for(let i=0;i<100;i++){const x=(rand()-.5)*90,z=(rand()-.5)*65;if((x>-25&&x<31&&z>-18&&z<19)||(z>18&&Math.abs(x)<20))continue;tree(x,z,.65+rand()*.8,rand()<.12?2:rand()<.18?3:0);}
[[-24,-15],[-23,14],[-3,-14],[8,-13],[29,-8],[10,15],[0,-10],[-24,-3],[-23,4]].forEach(([x,z],i)=>tree(x,z,.65+rand()*.22,i%3));
function bush(x,z,w=1){return placeModel('shrubHD',x,0,z,w,'width',scene,false,rand()*6);}
for(let i=0;i<35;i++){const x=(rand()-.5)*48,z=(rand()-.5)*33;if(Math.abs(x+11)<2||Math.abs(z)<2)continue;if((x>0&&x<11&&z>7)||x<-22)bush(x,z,.6+rand()*.5);}
placeModel('bench',7.7,.02,12.8,1.7,'width',scene,false,-.6);placeModel('bench',1.05,.02,10.5,1.7,'width',scene,false,Math.PI/2);
placeModel('flowers',7.4,0,14.3,1.7);placeModel('flowers',4,0,13.5,1.4);placeModel('birdbath',9,.05,14,.75,'height');
// 下沉的景观池：地面开孔、池底、低石岸和独立水面。
const pondStoneMaterials=[mat('pondStone1','#a7aaa0',.95),mat('pondStone2','#b7b7a8',.92),mat('pondStone3','#969f96',.96)];
const pondBed=mat('pondBed','#386f67',.95),pondLiner=mat('pondLiner','#6b8274',.9);
const bed=mesh(new T.ShapeGeometry(pondShape,80),pondBed,5,-.78,10);bed.rotation.x=-Math.PI/2;bed.scale.set(1.1,1.1,1);
function pondBand(inner,outer,yInner,yOuter,material){const vertices=[],indices=[],contour=pondShape.getSpacedPoints(120);for(let i=0;i<contour.length;i++){const p=contour[i];vertices.push(5+p.x*inner,yInner,10-p.y*inner,5+p.x*outer,yOuter,10-p.y*outer);if(i<contour.length-1){const k=i*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();const m=material.clone();m.side=T.DoubleSide;return mesh(g,m);}
pondBand(.91,1.17,-.62,-.08,pondLiner);
// 矮而宽的石板收边，避免一圈竖立的“鹅卵石”。
for(let i=0;i<34;i++){const a=pondShape.getPointAt((i+.035)/34),b=pondShape.getPointAt((i+.965)/34),outer=1.17+.018*Math.sin(i*2.7),tile=new T.Shape([a.clone().multiplyScalar(1.015),a.clone().multiplyScalar(outer),b.clone().multiplyScalar(outer),b.clone().multiplyScalar(1.015)]);const g=new T.ExtrudeGeometry(tile,{depth:.11,bevelEnabled:true,bevelThickness:.018,bevelSize:.014,bevelSegments:2,steps:1});const o=mesh(g,pondStoneMaterials[i%3],5,-.08+Math.sin(i*1.7)*.009,10);o.rotation.x=-Math.PI/2;}
const pondWaterMaterial=new T.ShaderMaterial({uniforms:{uTime:{value:0},uDay:{value:1},uDeep:{value:new T.Color('#286c72')},uShallow:{value:new T.Color('#78b5a2')}},transparent:true,depthWrite:false,side:T.DoubleSide,
 vertexShader:'varying vec3 vWorld; varying vec2 vLocal; void main(){vLocal=position.xy;vec4 world=modelMatrix*vec4(position,1.);vWorld=world.xyz;gl_Position=projectionMatrix*viewMatrix*world;}',
 fragmentShader:`uniform float uTime;uniform float uDay;uniform vec3 uDeep;uniform vec3 uShallow;varying vec3 vWorld;varying vec2 vLocal;
 void main(){vec2 p=vLocal;float t=uTime*.32;float wave=sin(p.x*4.2+p.y*1.6+t)*.025+sin(p.y*5.3-p.x*1.2-t*.7)*.018;
 vec3 n=normalize(vec3(cos(p.x*4.2+p.y*1.6+t)*.1,1.,cos(p.y*5.3-p.x*1.2-t*.7)*.09));vec3 viewDir=normalize(cameraPosition-vWorld);float fresnel=pow(1.-max(dot(n,viewDir),0.),3.);
 float depth=clamp(length(p/vec2(3.25,2.4)),0.,1.);vec3 color=mix(uDeep,uShallow,pow(depth,2.)*.7+wave);
 float shimmer=pow(max(0.,sin(p.x*7.+p.y*2.+t)+sin(p.y*8.-p.x*3.-t*.7))*.5,8.);color+=vec3(.045,.065,.055)*shimmer;
 color=mix(color,vec3(.64,.79,.81),fresnel*.55);float highlight=pow(max(dot(reflect(normalize(vec3(.3,-1.,-.4)),n),viewDir),0.),90.);color+=vec3(.8,.85,.7)*highlight*.25;color*=mix(.38,1.,uDay);
 gl_FragColor=vec4(color,.91);
 #include <tonemapping_fragment>
 #include <colorspace_fragment>
 }`});
const pond=mesh(new T.ShapeGeometry(pondShape,80),pondWaterMaterial,5,-.18,10,scene,true);pond.rotation.x=-Math.PI/2;pond.castShadow=false;
placeModel('lilies',3.55,-.15,10.8,.82);placeModel('lilies',5.7,-.15,10.9,.48);
const reeds=mat('reeds','#56774a',.9),reedTips=mat('reedTips','#756241',.95);
for(const [x,z] of [[2.1,8.5],[6.6,7.7],[8.05,9.2]]){for(let j=0;j<7;j++){const dx=(rand()-.5)*.38,dz=(rand()-.5)*.38,h=.42+rand()*.45;beam(point(x+dx,0,z+dz),point(x+dx+.08,h,z+dz-.04),.012,reeds);cyl(.025,.025,.13,reedTips,x+dx+.08,h+.04,z+dz-.04,scene,false,6);}}
for(const [x,z,scale] of [[2.25,8.45,.48],[7.2,7.9,.4],[8.35,9.4,.35]]){const rock=mesh(new T.IcosahedronGeometry(1,1),pondStoneMaterials[0],x,.06,z);rock.scale.set(scale,.14,scale*.7);rock.rotation.y=rand()*3;}

const projects=[
{name:'曙光',sub:'家庭影像与生活记录',x:-18,z:-9,agent:0,type:0},
{name:'门神',sub:'个人 Agent 凭据管理',x:-5,z:-9,agent:1,type:1},
{name:'Remotastic',sub:'遥控器与桌面交互',x:-19,z:7,agent:0,type:2},
{name:'GenFlow',sub:'业务流程与协作空间',x:-5,z:7,agent:1,type:3},
{name:'灵感花园',sub:'设计参考与视觉探索',x:-19,z:15,agent:1,type:4},
{name:'实验室',sub:'新想法从这里开始',x:-5,z:15,agent:0,type:5}
];
const areaNames=['设计室','开发室','验证室'],bayOffsets=[-1.7,0,1.7];
projects.forEach(p=>{p.workspaces=areaNames.map((name,j)=>({name,title:'未绑定规则',description:'在中台面板中分配规则。',agent:1,latest:null,line:null,anchor:point(p.x+1.83,.55,p.z+bayOffsets[j])}));});
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
 const card=document.createElement('button');card.className='room-card';card.hidden=true;card.innerHTML='<span class=room-top><span>0'+(j+1)+' · '+areaNames[j]+'</span><span class=room-agent>'+agentDefinitions[p.workspaces[j].agent].name+'</span></span><strong>'+p.workspaces[j].title+'</strong><span class=room-state>待派送</span>';card.onclick=()=>selectWorkArea(index,j);$('#workspaces').append(card);p.workspaces[j].card=card;
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
p.label=label('<i></i>'+p.name+'<span class="count">'+0+'</span>',p.x,.3,p.z+3.45,'',()=>selectProject(index));p.anchor=point(p.x,1,p.z);return group;
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
function makeAgent(name,x,z,color,m,index){const def=agentDefinitions[index];const root=new T.Group();root.position.set(x,0,z);scene.add(root);
for(let i=0;i<4;i++){cyl(4-i*.25,4.1-i*.25,.16,stone,0,.12+i*.16,0,root);torus(3.9-i*.25,.02,trim,0,.21+i*.16,0,root);}
for(let i=0;i<48;i++){const a=i/48*Math.PI*2;const tile=box(.32,.025,.7,pathMat,Math.cos(a)*3.65,.47,Math.sin(a)*3.65,root);tile.rotation.y=-a+Math.PI/2;}
cyl(2.55,2.8,.42,dark,0,.8,0,root);torus(2.55,.055,m,0,1.04,0,root);cyl(2.05,2.3,.24,black,0,1.13,0,root);torus(1.95,.025,m,0,1.29,0,root);
// 四根钢制支撑与上方轨道。
for(let i=0;i<4;i++){const a=i/4*Math.PI*2+Math.PI/4;const v=point(Math.cos(a)*2.4,1.05,Math.sin(a)*2.4),v2=point(Math.cos(a)*1.48,4.4,Math.sin(a)*1.48);beam(v,v2,.045,trim,root);ball(.09,m,v2.x,v2.y,v2.z,root);}
const columnMat=new T.ShaderMaterial({uniforms:{uColor:{value:new T.Color(color)},uTime:{value:0},uPower:{value:1}},vertexShader:'varying vec2 vUv; varying vec3 vNormal; varying vec3 vView; void main(){vUv=uv;vec4 mv=modelViewMatrix*vec4(position,1.);vNormal=normalize(normalMatrix*normal);vView=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',fragmentShader:'uniform vec3 uColor;uniform float uTime;uniform float uPower;varying vec2 vUv;varying vec3 vNormal;varying vec3 vView;void main(){float rim=pow(1.-abs(dot(normalize(vNormal),normalize(vView))),2.);float scan=pow(.5+.5*sin(vUv.y*110.-uTime*2.),14.);float shafts=pow(.5+.5*sin(vUv.x*90.),5.);float fade=pow(1.-vUv.y,.7);float a=(.025+rim*.18+scan*.05+shafts*.06)*fade*uPower;gl_FragColor=vec4(uColor*1.6,a);}',transparent:true,side:T.DoubleSide,depthWrite:false,blending:T.AdditiveBlending});
const column=mesh(new T.CylinderGeometry(1.38,2.05,4.2,64,1,true),columnMat,0,3.3,0,root,true);column.castShadow=false;
const emblem=makeEmblem(def,root);
const rings=new T.Group();rings.position.set(0,4.25,-.2);root.add(rings);
const orbitMaterial=new T.MeshStandardMaterial({color:'#dbe5dd',roughness:.3,metalness:.62,emissive:def.color,emissiveIntensity:.08});
for(let i=0;i<2;i++){const a=torus(2.05+i*.22,.038,orbitMaterial,0,0,0,rings,true);a.rotation.set(.55+i*.8,.6+i*.7,.4+i*.8);a.castShadow=false;}
glow(x,4.1,z,color,3,.32);groundGlow(x,z,color,10,.12);
for(let i=0;i<8;i++){const a=i/8*Math.PI*2;cyl(.07,.1,.55,trim,Math.cos(a)*3.65,.76,Math.sin(a)*3.65,root);ball(.09,m,Math.cos(a)*3.65,1.08,Math.sin(a)*3.65,root);}
const light=new T.PointLight(color,25,11,2);light.position.set(x,3,z);scene.add(light);
label(name,x,7.0,z,'agent',()=>focusAgent(index));agents[index]={...def,name,x,z,rings,emblem,columnMat,light,root};
}
agentDefinitions.forEach((def,i)=>makeAgent(def.name,def.x,def.z,def.color,[violet,amber,cyan][i],i));

// 开放式双向传送带。带面、边框和滚筒均可见；纸箱在带面上行走。
const beltCanvas=document.createElement('canvas');beltCanvas.width=128;beltCanvas.height=64;
const beltCtx=beltCanvas.getContext('2d');beltCtx.fillStyle='#394443';beltCtx.fillRect(0,0,128,64);
for(let x=0;x<128;x+=16){beltCtx.fillStyle='#6c7972';beltCtx.fillRect(x,0,2,64);beltCtx.fillStyle='#202b2b';beltCtx.fillRect(x+3,0,1,64);}
beltCtx.strokeStyle='#92a18b';beltCtx.lineWidth=2;beltCtx.beginPath();beltCtx.moveTo(48,20);beltCtx.lineTo(60,32);beltCtx.lineTo(48,44);beltCtx.stroke();
const beltTexture=new T.CanvasTexture(beltCanvas);beltTexture.wrapS=beltTexture.wrapT=T.RepeatWrapping;beltTexture.colorSpace=T.SRGBColorSpace;beltTexture.anisotropy=4;
const beltBackTexture=beltTexture.clone();beltBackTexture.needsUpdate=true;
const beltMaterial=mat('belt','#b4c0b4',.8,.15,{map:beltTexture});const beltBackMaterial=mat('beltBack','#9cac9e',.8,.15,{map:beltBackTexture});
function makeCurve(points,radius=1.2){return roundedRoute(points,radius);}
function beltStrip(curve,offset,width,material,height=0){const positions=[],normals=[],uvs=[],indices=[];const n=Math.ceil(curve.getLength()*9),length=curve.getLength();
for(let i=0;i<=n;i++){const t=i/n,p=curve.getPointAt(t),d=curve.getTangentAt(t),side=point(-d.z,0,d.x).normalize();for(let j=0;j<2;j++){const q=p.clone().addScaledVector(side,offset+(j-.5)*width);q.y+=height;positions.push(q.x,q.y,q.z);normals.push(0,1,0);uvs.push(t*length*.7,j);}if(i<n){let k=i*2;indices.push(k,k+1,k+2,k+1,k+3,k+2);}}
const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('normal',new T.Float32BufferAttribute(normals,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));geo.setIndex(indices);return mesh(geo,material);}
function pipeline(points,radius=1.2){const c=Array.isArray(points)?makeCurve(points,radius):points,length=c.getLength();
beltStrip(c,0,1.03,trim,-.09);beltStrip(c,.235,.42,beltMaterial);beltStrip(c,-.235,.42,beltBackMaterial);beltStrip(c,0,.035,rail,.045);
for(const offset of [-.52,.52]){const count=Math.ceil(length*20),points=[];for(let i=0;i<=count;i++){const t=i/count,p=c.getPointAt(t),d=c.getTangentAt(t);points.push(p.addScaledVector(point(-d.z,0,d.x).normalize(),offset).add(point(0,.025,0)));}const railCurve=new T.CatmullRomCurve3(points,false,'centripetal');mesh(new T.TubeGeometry(railCurve,count,.038,5,false),rail);}
for(let i=0;i<=length/1.6;i++){const t=Math.min(i*1.6/length,1),p=c.getPointAt(t),d=c.getTangentAt(t),side=point(-d.z,0,d.x).normalize();beam(p.clone().addScaledVector(side,-.49).add(point(0,-.04,0)),p.clone().addScaledVector(side,.49).add(point(0,-.04,0)),.065,dark);for(const sign of [-1,1]){const v=p.clone().addScaledVector(side,sign*.44);box(.055,v.y-.1,.055,trim,v.x,(v.y-.1)/2,v.z);box(.18,.055,.2,stone,v.x,.02,v.z);}}
return c;}
const trunkX=-9.1,feedZ=.3,beltY=.58;
pipeline([[trunkX,beltY,-6],[trunkX,beltY,20]]);
const feed=pipeline([[trunkX,beltY,feedZ],[-5,beltY,feedZ],[hub.x-2.65,.85,feedZ]]);
projects.forEach((p,i)=>{
const px=p.x+3.5,joinZ=p.z+4.2;
// 院落右侧的小传送带，连接三个工作区。
pipeline([[px,beltY,p.z-1.8],[px,beltY,p.z+1.7]]);
const branch=pipeline([[px,beltY,p.z+1.7],[px,beltY,joinZ],[trunkX,beltY,joinZ]],1.15);
const trunkPart=new T.LineCurve3(point(trunkX,beltY,joinZ),point(trunkX,beltY,feedZ));
const route=new T.CurvePath();route.add(branch);route.add(trunkPart);route.add(feed);p.route=route;p.workspaces.forEach((area,j)=>{const r=new T.CurvePath();r.add(new T.LineCurve3(point(p.x+2.95,beltY,p.z+bayOffsets[j]),point(px,beltY,p.z+bayOffsets[j])));if(j<2)r.add(new T.LineCurve3(point(px,beltY,p.z+bayOffsets[j]),point(px,beltY,p.z+1.7)));route.curves.forEach(c=>r.add(c));area.route=r;});
box(1.1,.1,1.1,trim,trunkX,beltY-.06,joinZ);box(.95,.025,.95,black,trunkX,beltY,joinZ);
});
agents.forEach((a,i)=>{const startZ=i===0?1.4:i===1?-1.4:0,turnZ=i===0?3:i===1?-3:0;a.route=pipeline([[hub.x+2.7,.85,startZ],[8.5,.7,turnZ],[a.x-6.4,.7,a.z],[a.x-2.1,1.3,a.z]],2);const walkPoints=a.route.getSpacedPoints(Math.ceil(a.route.getLength()*12)).map(v=>new T.Vector3(v.x,.012,v.z));beltStrip(new T.CatmullRomCurve3(walkPoints,false,'centripetal'),0,1.45,asphalt);});
// 草地上的零星微光。
const fireCount=75,firePositions=new Float32Array(fireCount*3);for(let i=0;i<fireCount;i++){firePositions[i*3]=(rand()-.5)*48;firePositions[i*3+1]=.3+rand()*3;firePositions[i*3+2]=(rand()-.5)*32;}const fireGeo=new T.BufferGeometry();fireGeo.setAttribute('position',new T.BufferAttribute(firePositions,3));const fireflies=new T.Points(fireGeo,new T.PointsMaterial({color:'#dbdaa5',size:.055,transparent:true,opacity:.55,depthWrite:false,blending:T.AdditiveBlending}));scene.add(fireflies);

const selectionFrame=new T.LineLoop(new T.BufferGeometry().setFromPoints([point(-1,0,-.76),point(1,0,-.76),point(1,0,.76),point(-1,0,.76)]),new T.LineBasicMaterial({color:'#d69a45',depthTest:false}));selectionFrame.renderOrder=20;selectionFrame.visible=false;scene.add(selectionFrame);

// 合并静态建筑，减少渲染调用；动画对象独立保留。
scene.updateMatrixWorld(true);const batches=new Map(),remove=[];
scene.traverse(o=>{if(o.isMesh && o.userData.static && !Array.isArray(o.material)){const key=o.material.uuid+'-'+o.castShadow+'-'+o.receiveShadow+'-'+Object.keys(o.geometry.attributes).sort().join(',');if(!batches.has(key))batches.set(key,{m:o.material,cast:o.castShadow,receive:o.receiveShadow,geos:[]});let geo=o.geometry.clone().applyMatrix4(o.matrixWorld);if(geo.index)geo=geo.toNonIndexed();for(const k of Object.keys(geo.attributes))if(!['position','normal','uv','color'].includes(k))geo.deleteAttribute(k);batches.get(key).geos.push(geo);remove.push(o);}});
for(const b of batches.values()){const geo=mergeGeometries(b.geos,false);if(geo){const o=new T.Mesh(geo,b.m);o.castShadow=b.cast;o.receiveShadow=b.receive;scene.add(o);}b.geos.forEach(g=>g.dispose());}remove.forEach(o=>o.removeFromParent());

let running=!matchMedia('(prefers-reduced-motion: reduce)').matches,sim=0,completed=0,selected=-1,selectedArea=1,focusedTask=null,inspectedTask=null,cameraTween=null;
const tasks=[];
let hubState=null;
function areaState(area){return !hubState?'正在连接':!area.line?'未绑定规则':area.line.paused?'规则已暂停':area.latest?(stateNames[area.latest.run.state]||area.latest.run.state):'等待触发';}
function createParcel(color){const g=placeModel('box',0,0,0,.7,'width',scene,true);const tag=new T.MeshBasicMaterial({color});const label=box(.22,.12,.014,tag,0,.38,.52,g,true);label.userData.ownedMaterial=true;return g;}
function positionOn(obj,c,t,reverse=false){obj.visible=true;const u=T.MathUtils.clamp(reverse?1-t:t,0,1),p=c.getPointAt(u);obj.position.copy(p);const dir=c.getTangentAt(u);obj.position.addScaledVector(point(-dir.z,0,dir.x).normalize(),reverse?-.235:.235);obj.position.y+=.03;obj.rotation.y=Math.atan2(dir.x,dir.z)+(reverse?Math.PI:0);}
function syncHub(data,mapping){
 hubState=data;completed=data.totals.doneToday||0;$('#completed').textContent=completed+' 项今日完成';
 projects.forEach(p=>p.workspaces.forEach(a=>{a.line=null;a.latest=null;a.title='未绑定规则';a.description='在中台面板中分配规则。';}));
 for(const line of data.lines){const m=mapping[line.name],p=projects.find(p=>p.name===m?.project),a=p?.workspaces[m?.area];if(!a||a.line)continue;a.line=line;a.title=line.name;a.agent=agents.findIndex(x=>x.key===line.agent);a.description=line.every?'定时：'+line.every+(line.next?' · 下次 '+new Date(line.next).toLocaleString('zh-CN'):''):'事件：'+(line.types||[]).join('、');}
 const retained=new Set();
 for(const run of data.runs){const pi=projects.findIndex(p=>p.workspaces.some(a=>a.line?.name===run.rule));if(pi<0)continue;const ai=projects[pi].workspaces.findIndex(a=>a.line?.name===run.rule),area=projects[pi].workspaces[ai];let t=tasks.find(t=>t.id===run.id);if(!t){t={id:run.id,package:createParcel(agents[area.agent]?.color||'#aab4af'),hit:document.createElement('button'),stage:0,start:sim};t.hit.className='parcel-hit';t.hit.innerHTML='<span></span>';t.hit.onclick=()=>selectParcel(t);$('#parcels').append(t.hit);tasks.push(t);}const previous=t.run?.state;t.project=pi;t.area=ai;t.agent=agents.findIndex(a=>a.key===run.agent);t.route=area.route;t.title=run.rule;t.description=run.summary||run.error||'等待执行结果';t.run=run;t.done=terminal(run.state);if(previous&&!terminal(previous)&&t.done)t.returnAt=sim;if(!previous&&t.done)t.returnAt=-Infinity;t.stage=run.state==='running'?3:t.done?6:run.state==='queued'?0:1;t.hit.setAttribute('aria-label','查看运行 '+run.id+'：'+run.rule);retained.add(run.id);if(!area.latest||(!t.done&&area.latest.done)||(t.done===area.latest.done&&t.id>area.latest.id))area.latest=t;}
 for(let i=tasks.length-1;i>=0;i--)if(!retained.has(tasks[i].id)){const t=tasks[i];t.package.removeFromParent();t.package.traverse(o=>{if(o.userData.ownedMaterial)o.material.dispose();});t.hit.remove();tasks.splice(i,1);if(inspectedTask===t)closeParcel();}
 focusedTask=tasks.find(t=>!t.done)||tasks[0]||null;
 projects.forEach(p=>{const n=p.workspaces.reduce((sum,a)=>sum+(a.line?.totals?.running||0)+(a.line?.totals?.queued||0),0);p.label.querySelector('.count').textContent=n;p.workspaces.forEach(a=>{a.card.querySelector('strong').textContent=a.title;a.card.querySelector('.room-agent').textContent=a.line?data.agents.find(x=>x.id===a.line.agent)?.name||a.line.agent:'未分配';});});
 agents.forEach(a=>{const live=data.agents.find(x=>x.id===a.key);const online=live?.online;$('#'+a.key+'-status').textContent=!live?'未接入':!online?'离线':live.totals.running?'执行中':'在线 · 空闲';$('#'+a.key+'-signal').textContent=live?(live.totals.running||0)+(live.totals.queued||0):'—';a.columnMat.uniforms.uPower.value=online?(live.totals.running?1.5:.35):.05;a.light.intensity=online?(daylight?2:20):0;});
 if(selected>=0)updateDetail();if(inspectedTask)updateParcelDetail();
}
const parcelScreen=new T.Vector3();
function updateTasks(){
 for(const t of tasks){const a=agents[t.agent];t.package.visible=false;
 if(!t.done){if(t.run.state==='running'&&a){t.package.visible=true;t.package.position.set(a.x-1.4,1.6,a.z);}else positionOn(t.package,t.route,t.run.state==='queued'?.12:.55);}
 else if(sim-t.returnAt<7&&a){const age=sim-t.returnAt;if(age<3)positionOn(t.package,a.route,age/3,true);else positionOn(t.package,t.route,(age-3)/4,true);}
 t.hit.hidden=!t.package.visible;if(t.package.visible){parcelScreen.copy(t.package.position).add(point(0,.25,0)).project(camera);const x=(parcelScreen.x*.5+.5)*innerWidth,y=(-parcelScreen.y*.5+.5)*innerHeight;t.hit.style.left=x+'px';t.hit.style.top=y+'px';t.hit.hidden=parcelScreen.z>1||x<0||x>innerWidth||y<80||y>innerHeight-40;}
 }
 projects.forEach(p=>p.workspaces.forEach(area=>{const color=!area.line?'#9a9f97':area.line.paused?'#a99b83':area.latest?.run.state==='running'?'#a496d6':area.latest?.run.state==='failed'?'#bd665b':'#79ae8c';area.indicator.material.color.set(color);area.indicator.material.emissive.set(color);area.indicator.material.emissiveIntensity=area.latest&&!area.latest.done?.65:.1;area.card.querySelector('.room-state').textContent=areaState(area);}));
 if(focusedTask)updateActivity(focusedTask);else{$('#activity-task').textContent=hubState?'暂无运行记录':'正在连接中台';$('#activity-project').textContent='';$('#activity-status').textContent='等待真实任务';}
 if(selected>=0)updateDetail();if(inspectedTask)updateParcelDetail();
}
function updateActivity(t){$('#activity-task').textContent=t.title;$('#activity-project').textContent=projects[t.project].name;$('#flow-agent').textContent=hubState.agents.find(a=>a.id===t.run.agent)?.name||t.run.agent;$('#activity-status').textContent=stateNames[t.run.state]||t.run.state;const stage=t.stage===0?0:t.stage<3?1:t.stage===3?2:3;document.querySelectorAll('[data-step]').forEach((el,i)=>{el.classList.toggle('active',i===stage);el.classList.toggle('done',i<stage);});}
function moveCamera(target,zoom,resetAngle=false){
 const offset=resetAngle?defaultPosition.clone().sub(defaultTarget):camera.position.clone().sub(controls.target);
 cameraTween={start:performance.now(),duration:matchMedia('(prefers-reduced-motion: reduce)').matches?0:1150,from:controls.target.clone(),to:target.clone(),positionFrom:camera.position.clone(),positionTo:target.clone().add(offset),zoomFrom:camera.zoom,zoomTo:zoom};
}
controls.addEventListener('start',()=>{cameraTween=null;});
function selectProject(i){projects.forEach(p=>p.workspaces.forEach(a=>a.card.hidden=true));selected=i;selectedArea=Math.max(0,projects[i].workspaces.findIndex(a=>a.line));closeParcel();document.body.classList.add('project-focus');$('#detail').hidden=false;$('.intro').style.visibility='hidden';$('#project-title').textContent=projects[i].name;$('#project-desc').textContent=projects[i].sub;moveCamera(point(projects[i].x+.45,.3,projects[i].z+.2),Math.min(3.5,Math.max(2.25,innerWidth/440)),true);updateDetail();}
function selectWorkArea(i,j){if(selected!==i)selectProject(i);selectedArea=j;const area=projects[i].workspaces[j];if(area.latest)focusedTask=area.latest;updateDetail();}
function updateDetail(){if(selected<0)return;const p=projects[selected],area=p.workspaces[selectedArea],line=area.line;$('#project-agent').textContent=line?hubState.agents.find(a=>a.id===line.agent)?.name||line.agent:'未分配';$('#project-state').textContent=areaState(area);$('#workarea-name').textContent=area.name;$('#project-task').textContent=area.title;$('#task-description').textContent=area.description;$('#dispatch').textContent='立即运行';$('#dispatch').disabled=!line||!!line.paused||isBusy('rule:'+line?.name)||!isConnected();$('#rule-toggle').textContent=line?.paused?'恢复规则':'暂停规则';$('#rule-toggle').disabled=!line||isBusy('rule:'+line?.name)||!isConnected();$('#rule-latest').disabled=!area.latest;p.workspaces.forEach((a,j)=>a.card.classList.toggle('selected',j===selectedArea));selectionFrame.visible=true;selectionFrame.position.copy(area.anchor);selectionFrame.position.y=.43;}
function closeProject(){selected=-1;$('#detail').hidden=true;$('.intro').style.visibility='visible';document.body.classList.remove('project-focus');selectionFrame.visible=false;projects.forEach(p=>p.workspaces.forEach(a=>a.card.hidden=true));$('#room-connectors').innerHTML='';}
function overview(){closeProject();closeParcel();moveCamera(defaultTarget,1,true);}
$('#close-detail').onclick=overview;$('#overview').onclick=overview;
async function selectedAction(verb){const line=projects[selected]?.workspaces[selectedArea]?.line;if(!line)return;try{await ruleAction(line,verb);toast('操作已完成');}catch(e){toast(e.message);}}
$('#dispatch').onclick=()=>selectedAction('run');$('#rule-toggle').onclick=()=>selectedAction(projects[selected]?.workspaces[selectedArea]?.line?.paused?'resume':'pause');$('#rule-latest').onclick=()=>{const t=projects[selected]?.workspaces[selectedArea]?.latest;if(t)selectParcel(t);};$('#rule-manage').onclick=()=>openBoard('rules');
function selectParcel(task){inspectedTask=task;focusedTask=task;$('#parcel-detail').hidden=false;$('.agents').style.visibility='hidden';$('#parcel-title').textContent=task.title;$('#parcel-description').textContent=task.description;$('#parcel-id').textContent='包裹 '+String(task.id).padStart(3,'0');$('#parcel-project').textContent=projects[task.project].name+' · '+projects[task.project].workspaces[task.area].name;$('#parcel-agent').textContent=hubState.agents.find(a=>a.id===task.run.agent)?.name||task.run.agent;updateParcelDetail();}
function updateParcelDetail(){const t=inspectedTask;if(!t)return;$('#parcel-description').textContent=t.description;$('#parcel-state').textContent=stateNames[t.run.state]||t.run.state;$('#parcel-destination').textContent=t.done?'已结束':t.run.state==='running'?t.run.agent:'等待中台派送';$('#parcel-progress').style.width=(t.done?100:t.stage===3?60:10)+'%';$('#parcel-note').textContent='创建 '+new Date(t.run.createdAt).toLocaleString('zh-CN')+(t.run.finishedAt?' · 结束 '+new Date(t.run.finishedAt).toLocaleString('zh-CN'):'');$('#run-stop').disabled=t.done||isBusy('run:'+t.id)||!isConnected();document.querySelectorAll('#parcel-stages li').forEach((el,i)=>{const phase=t.done?3:t.stage===3?2:0;el.classList.toggle('active',i===phase);el.classList.toggle('done',i<phase);});}
$('#run-stop').onclick=async()=>{const t=inspectedTask;if(!t)return;try{await action('run:'+t.id,'/v1/runs/'+t.id+'/cancel');toast('停止请求已完成');}catch(e){toast(e.message);}};$('#run-why').onclick=()=>inspectedTask&&showWhy(inspectedTask.id);
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
 nightEffects.forEach(o=>o.visible=!day);fireflies.visible=!day;hubLight.intensity=day?1:14;agents.forEach(a=>{a.light.intensity=day?2:20;a.columnMat.blending=day?T.NormalBlending:T.AdditiveBlending;a.columnMat.needsUpdate=true;a.emblem.userData.frontMaterial.emissiveIntensity=day?.02:.15;});
 pondWaterMaterial.uniforms.uDay.value=day?1:0;
 cyan.emissiveIntensity=day?.25:1.9;cyan.color.set(day?'#589ca8':'#8bdbdf');
 
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
let last=performance.now(),lastUi=-1,frame=0;
function animate(now){requestAnimationFrame(animate);const dt=Math.min((now-last)/1000,.05);last=now;if(document.hidden)return;if(running)sim+=dt;controls.update();
if(cameraTween){const t=cameraTween.duration===0?1:Math.min((now-cameraTween.start)/cameraTween.duration,1),k=t*t*(3-2*t);controls.target.copy(cameraTween.from).lerp(cameraTween.to,k);camera.position.copy(cameraTween.positionFrom).lerp(cameraTween.positionTo,k);camera.zoom=T.MathUtils.lerp(cameraTween.zoomFrom,cameraTween.zoomTo,k);camera.updateProjectionMatrix();camera.lookAt(controls.target);if(t===1)cameraTween=null;}

beltTexture.offset.x=-sim*.32;beltBackTexture.offset.x=sim*.32;hubCore.rotation.y=sim*.45;core.rotation.z=sim*.2;coreRing2.rotation.y=sim*.4;
agents.forEach((a,i)=>{a.rings.rotation.y=sim*(i===0?.22:-.18);a.rings.rotation.z=Math.sin(sim*.3)*.12;a.emblem.position.y=4.25+Math.sin(sim*.8+i)*.09;a.emblem.rotation.y=a.emblem.userData.baseYaw+Math.sin(sim*.32+i)*.22;a.rings.children[0].rotation.y=sim*.28;a.rings.children[1].rotation.y=-sim*.23;a.columnMat.uniforms.uTime.value=sim;});pondWaterMaterial.uniforms.uTime.value=sim;fireflies.rotation.y=Math.sin(sim*.025)*.02;

updateTasks();projectLabels();composer.render();frame++;if(frame===2){$('#loading').classList.add('done');window.__townReady=true;}
if(now-lastUi>1000){lastUi=now;$('#simtime').textContent=new Date().toLocaleTimeString('zh-CN',{timeZone:hubState?.timezone||'Asia/Shanghai',hour:'2-digit',minute:'2-digit'});}
}
window.__town={getStats:()=>({modelsLoaded:modelLoaded,agentCount:agents.length,emblemCount:emblemLibrary.size,daylight,selectedProject:selected,selectedArea,cameraZoom:camera.zoom,inspectedTaskId:inspectedTask?.id??null,tasks:tasks.map(t=>({id:t.id,project:projects[t.project].name,area:t.area,agent:agents[t.agent]?.name||t.run.agent,title:t.title,stage:t.stage,done:t.done})),completed,sim,running,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles}),selectProject,selectWorkArea,selectParcel,overview};requestAnimationFrame(animate);

startHub(syncHub,(online,text)=>{$('#hub-status').textContent=text;document.body.dataset.connected=String(online);});

labels.find(x=>x.el.textContent==='调度中台')?.el.addEventListener('click',()=>openBoard('rules'));
