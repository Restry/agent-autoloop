import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,dirname,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {Readable} from 'node:stream';
import {listArtifacts,readArtifact,artifactCollectorReady} from './integrations/artifacts/store.mjs';
import {createReports} from './integrations/project-tasks/reports.mjs';
import {createGithubProjects} from './integrations/project-tasks/github-projects.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'dist');
const port=Number(process.env.PORT||8765),hub=process.env.TOWN_HUB||'http://127.0.0.1:3350';
const config=process.env.TOWN_CONFIG||process.env.HOME+'/.agent-autoloop/config.json';
const githubProjects=createGithubProjects({home:dirname(config),hub,configPath:config,node:process.execPath,poller:resolve(dirname(config),'lib/town-project-tasks/github-poll.mjs')});
const reports=createReports(dirname(config));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.glb':'model/gltf-binary'};
export const server=createServer(async(req,res)=>{
 const fail=(code,message)=>{if(!res.headersSent)res.writeHead(code,{'content-type':'application/json'});res.end(JSON.stringify({error:message}));};
 try{
  const hosts=new Set(['127.0.0.1:'+port,'localhost:'+port]);
  if(!hosts.has(req.headers.host))return fail(403,'不允许的主机');
  const url=new URL(req.url,'http://'+req.headers.host);
  if(url.pathname.startsWith('/api/')){
   const path=url.pathname.slice(4);
   const allowed=req.method==='GET'? /^\/(healthz|v1\/state|v1\/stream|v1\/rules-file|v1\/runs\/\d+\/why)$/.test(path):req.method==='POST'&&/^\/v1\/(runs\/\d+\/cancel|cards\/\d+\/(answer|resolve)|rules\/[^/]+\/(pause|resume|replay|run))$/.test(path);
   const rulesWrite=(req.method==='POST'&&path==='/v1/rules-file/check')||(req.method==='PUT'&&path==='/v1/rules-file');
   const projectApi=(req.method==='GET'&&path==='/projects/github')||(req.method==='POST'&&path==='/projects/github/check')||(req.method==='PUT'&&path==='/projects/github');
   const reportApi=req.method==='GET'&&path==='/reports';
   const artifactMatch=req.method==='GET'&&/^\/runs\/(\d+)\/artifacts(?:\/(\d+)\/([a-f0-9]{24}))?$/.exec(path);
   if(!allowed&&!rulesWrite&&!projectApi&&!reportApi&&!artifactMatch)return fail(404,'没有这个接口');
   if(req.headers['sec-fetch-site']==='cross-site')return fail(403,'不允许跨站请求');
   if(req.headers.origin&&!['http://127.0.0.1:'+port,'http://localhost:'+port].includes(req.headers.origin))return fail(403,'不允许的来源');
   if(artifactMatch){try{const [,run,attempt,id]=artifactMatch;if(!id){res.writeHead(200,{'content-type':'application/json','cache-control':'no-store'});res.end(JSON.stringify({...listArtifacts(dirname(config),Number(run)),collectorReady:artifactCollectorReady(dirname(config))}));}else{const {item,data}=readArtifact(dirname(config),Number(run),Number(attempt),id);res.writeHead(200,{'content-type':'application/octet-stream','content-length':data.length,'content-disposition':"attachment; filename*=UTF-8''"+encodeURIComponent(item.name.split('/').pop()),'cache-control':'no-store','x-content-type-options':'nosniff','content-security-policy':"default-src 'none'; sandbox"});res.end(data);}}catch(e){fail(404,'成果不存在、已丢失或校验失败');}return;}
   if(reportApi){try{const name=url.searchParams.get('name');const result=name?await reports.read(url.searchParams.get('kind'),name):await reports.list();res.writeHead(200,{'content-type':'application/json','cache-control':'no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify(result));}catch(e){fail(e.status|| (e.code==='ENOENT'?404:500),'报告读取失败：'+(e.status?e.message:'文件不存在或暂时无法读取'));}return;}
   let body;
   if(req.method==='POST'||req.method==='PUT'){
    if(!req.headers['content-type']?.startsWith('application/json'))return fail(415,'需要 JSON');
    const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>1048576)return fail(413,'内容过长');chunks.push(chunk);}body=Buffer.concat(chunks);JSON.parse(body.toString()||'{}');
   }
   if(projectApi){try{const result=req.method==='GET'?await githubProjects.view(url.searchParams.get('group')||''):req.method==='POST'?await githubProjects.check(JSON.parse(body)):await githubProjects.save(JSON.parse(body));res.writeHead(200,{'content-type':'application/json','cache-control':'no-store'});res.end(JSON.stringify(result));}catch(e){fail(e.status||500,e.status?e.message:'项目配置未保存，请稍后重试');}return;}
   const {owner}=JSON.parse(await readFile(config,'utf8'));
   const controller=new AbortController();res.on('close',()=>controller.abort());
   const timeout=path==='/v1/stream'?null:setTimeout(()=>controller.abort(),15000);
   try{
    const headers={authorization:'Bearer '+owner,'content-type':'application/json'};
    if(req.headers['last-event-id'])headers['last-event-id']=req.headers['last-event-id'];
    const upstream=await fetch(hub+path+url.search,{method:req.method,headers,body,signal:controller.signal,redirect:'error'});
    if(path==='/v1/state'&&upstream.ok){const state=await upstream.json();try{const readiness=JSON.parse(await readFile(dirname(config)+'/town-agent-readiness.json','utf8'));state.localAgentReadiness=readiness;}catch{}try{state.githubProjects=JSON.parse(await readFile(dirname(config)+'/town-projects.json','utf8')).projects;}catch{state.githubProjects={};}res.writeHead(200,{'content-type':'application/json','cache-control':'no-store'});res.end(JSON.stringify(state));return;}
    res.writeHead(upstream.status,{'content-type':upstream.headers.get('content-type')||'application/json','cache-control':'no-store','x-content-type-options':'nosniff','x-accel-buffering':'no'});
    res.flushHeaders();if(upstream.body){const stream=Readable.fromWeb(upstream.body);stream.on('error',()=>res.destroy());stream.pipe(res);}else res.end();
   }finally{clearTimeout(timeout);}return;
  }
  if(!['GET','HEAD'].includes(req.method))return fail(405,'不支持此操作');
  const file=resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
  if(!file.startsWith(root+sep))return fail(403,'不允许的路径');
  const data=await readFile(file);res.writeHead(200,{'content-type':mime[extname(file)]||'application/octet-stream','cache-control':'no-cache','x-content-type-options':'nosniff'});res.end(req.method==='HEAD'?undefined:data);
 }catch(error){if(res.headersSent)res.destroy();else fail(error.code==='ENOENT'?404:502,error.code==='ENOENT'?'文件不存在':'中台连接失败，请稍后重试');}
});
server.listen(port,'127.0.0.1',()=>console.log('Agent 小镇 http://127.0.0.1:'+port));
