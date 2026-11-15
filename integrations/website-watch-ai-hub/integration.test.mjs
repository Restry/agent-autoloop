import assert from 'node:assert/strict';
import {test} from 'node:test';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createServer} from 'node:http';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {observe,validateSite} from './check.mjs';
const exec=promisify(execFile),dir=dirname(fileURLToPath(import.meta.url));
test('首页和健康接口都须成功，重定向及错误内容不能通过',async()=>{
 const site={id:'test',name:'测试站',url:'https://site.test/',contains:'<title>AI Hub</title>',health:{url:'https://site.test/api/health',contains:'"status":"ok"'}};
 const request=(pageStatus,pageText,healthStatus,healthText)=>async url=>new Response(url.endsWith('/api/health')?healthText:pageText,{status:url.endsWith('/api/health')?healthStatus:pageStatus});
 assert.equal((await observe(site,request(200,'<title>AI Hub</title>',200,'{"status":"ok"}'))).ok,true);
 for(const args of [[500,'error',200,'{"status":"ok"}'],[200,'<title>AI Hub</title>',503,'{"status":"degraded"}'],[302,'moved',200,'{"status":"ok"}'],[200,'login',200,'{"status":"ok"}'],[200,'<title>AI Hub</title>',200,'{"status":"degraded"}']])assert.equal((await observe(site,request(...args))).ok,false);
 assert.equal((await observe(site,async()=>{throw Error('offline')})).ok,false);
 assert.throws(()=>validateSite({...site,health:{url:'https://elsewhere.test/',contains:'ok'}}));
});
test('独立真实中台：正常安静、首次异常飞书卡片、持续异常去重、恢复原卡并派排查',async()=>{
 const home=mkdtempSync(join(tmpdir(),'ai-hub-watch-check-'));process.env.AGENT_AUTOLOOP_HOME=home;process.env.AGENT_AUTOLOOP_RULES=join(home,'rules.json');
 const rules={sources:{'ai-hub-watch':{name:'AI Hub 巡检'}},agents:{probe:{name:'检查',worker:'probe-worker',use:'command',command:['node','--version']},diagnose:{name:'排查',worker:'diagnose-worker',use:'command',command:['node','--version']}},channels:{feishu:{name:'飞书',answerers:['test-owner']}},rules:[{name:'检查AIHub',when:{cron:'*/5 * * * *'},to:'probe',cwd:home,group:'AIHub巡检',channels:['feishu'],emits:{source:'ai-hub-watch',types:['site.down','site.recovered']}},{name:'排查AIHub',when:{source:'ai-hub-watch',types:['site.down','site.recovered']},to:'diagnose',cwd:home,group:'AIHub排查',channels:['feishu']}]};
 writeFileSync(process.env.AGENT_AUTOLOOP_RULES,JSON.stringify(rules));
 const hub=await import('/Users/louis/.agent-autoloop/app/host/runtime.ts');const {rows}=await import('/Users/louis/.agent-autoloop/app/kernel/evolve.ts');const {readMessage,resultFrom}=await import('/Users/louis/.agent-autoloop/app/worker/contract.ts');
 const act=(name,...args)=>hub.execute(name,args);let mode='healthy';
 const server=createServer((req,res)=>{if(mode==='outage'){res.writeHead(503);res.end('unavailable');return;}res.writeHead(200,{'content-type':req.url==='/api/health'?'application/json':'text/html'});res.end(req.url==='/api/health'?' {"status":"ok"} ':'<title>AI Hub</title>');});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const url='http://127.0.0.1:'+server.address().port;
 writeFileSync(join(home,'site.json'),JSON.stringify({id:'test',name:'隔离AIHub',url:url+'/',contains:'<title>AI Hub</title>',health:{url:url+'/api/health',contains:'"status":"ok"'}}));
 let count=0;async function run(){const acknowledged=act('runRule','检查AIHub','test',{}),job=act('claimNext','probe-worker','check-'+(++count));assert.equal(job.run,acknowledged.run);const context=join(home,'context.json');writeFileSync(context,JSON.stringify(job.context));const {stdout}=await exec(process.execPath,[join(dir,'check.mjs'),join(home,'site.json')],{env:{...process.env,AGENT_AUTOLOOP_CONTEXT:context},timeout:25000});const parsed=resultFrom(readMessage(stdout),{});assert.equal(parsed.problem,undefined);const result=act('finish',job.run,job.token,parsed.result);assert.deepEqual(result.rejected,[]);return parsed.result;}
 try{
  await run();assert.equal(rows(hub.getView(),'cards').length,0);assert.equal(rows(hub.getView(),'runs').filter(r=>r.rule==='排查AIHub').length,0);
  mode='outage';await run();const card=act('nextCard','feishu');assert.match(card.title,/隔离AIHub/);assert.match(card.text,/503/);act('delivered','feishu',card.id,card.version,'fake-message');
  const diagnosis=act('claimNext','diagnose-worker','first-incident');assert.equal(diagnosis.rule.name,'排查AIHub');assert.equal(diagnosis.context.events[0].type,'site.down');act('finish',diagnosis.run,diagnosis.token,{outcome:'done',summary:'只读检查完成'});
  await run();assert.equal(rows(hub.getView(),'cards').length,1);assert.equal(rows(hub.getView(),'runs').filter(r=>r.rule==='排查AIHub').length,1);assert.equal(act('nextCard','feishu'),null);
  mode='healthy';await run();const recovered=act('nextCard','feishu');assert.equal(recovered.id,card.id);assert.equal(recovered.state,'closed');assert.match(recovered.result,/巡检已恢复/);
  const follow=act('claimNext','diagnose-worker','recovery');assert.equal(follow.context.events[0].type,'site.recovered');act('finish',follow.run,follow.token,{outcome:'done',summary:'恢复核实完成'});
 }finally{server.closeAllConnections();await new Promise(resolve=>server.close(resolve));if(hub.db.isOpen)hub.db.close();rmSync(home,{recursive:true,force:true});}
});
