// A real isolated AutoLoop engine, no worker process and no production credentials.
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {once} from 'node:events';
const home=mkdtempSync(join(tmpdir(),'town-hub-test-'));
process.env.AGENT_AUTOLOOP_HOME=home;process.env.AGENT_AUTOLOOP_RULES=join(home,'rules.json');
const rules={sources:{local:{name:'测试事件来源'},unused:{name:'备用来源'}},agents:{claude:{name:'Claude',worker:'test',use:'claude'},gemini:{name:'Gemini 验收助手',worker:'test-new',use:'command',command:['echo','test']}},channels:{desktop:{name:'测试桌面通知'}},elsewhere:[{name:'外部周报',where:'外部应用',source:'local',to:'claude',cron:'0 9 * * 1'}],rules:[{name:'试一下',when:{source:'local',types:['test.try']},to:'claude',cwd:join(home,'try'),prompt:'隔离测试'},...Array.from({length:7},(_,i)=>({name:'自动规则'+(i+1),when:{source:'local',types:['test.rule'+i]},to:'gemini',cwd:join(home,'自动项目'),prompt:'隔离测试',group:'自动规则组',parallel:3}))]};
writeFileSync(process.env.AGENT_AUTOLOOP_RULES,JSON.stringify(rules));
const hub=await import('/Users/louis/projects/agent-autoloop/tests/hub.ts');
const {serve}=await import('/Users/louis/projects/agent-autoloop/host/http.ts');
const owner=hub.addKey('owner','test');writeFileSync(join(home,'config.json'),JSON.stringify({owner}),{mode:0o600});
hub.heartbeat('test-new',[]);hub.heartbeat('test',[]);
hub.ingest('local',{id:'completed',type:'test.rule0'});let job=hub.claimNext('test-new','completed');hub.finish(job.run,job.token,{outcome:'done',summary:'隔离测试已完成',usage:{input:100,output:20,cached:50,cost:.01},later:[{key:'review',at:new Date(Date.now()+86400000).toISOString(),about:'检查隔离结果'}]});
for(let i=0;i<65;i++){const result=hub.execute('runRule',['试一下','test',{subject:String(i)}]);hub.cancel(result.run);}
hub.ingest('local',{id:'unmatched',type:'no.match',summary:'没有规则匹配的测试事件'});
hub.execute('pauseRule',['自动规则2','test',{reason:'等待隔离验收'}]);
hub.ingest('local',{id:'skipped',type:'test.rule1',summary:'暂停期间的测试事件'});
hub.ingest('local',{id:'running',type:'test.rule2'});job=hub.claimNext('test-new','running');hub.started(job.run,job.token,{});
hub.createCard({key:'ui-test',kind:'ask',title:'界面验收卡片',text:'这张卡片只在隔离中台中。',options:['通过','待修复'],recommend:1});
const old=hub.createCard({key:'old',kind:'notice',title:'已处理的验收通知',text:'已核对完成'});hub.resolve(old.card,'验收完成','test');
hub.tell('fyi','仅供知悉','这是一条无需回答的消息');
process.on('SIGUSR2',()=>{rules.rules=rules.rules.filter(r=>r.name!=='新增动态规则');delete rules.agents['runner-two'];rules.rules.find(r=>r.name==='自动规则7').group='移动后的组';writeFileSync(process.env.AGENT_AUTOLOOP_RULES,JSON.stringify(rules));hub.reloadRules();console.log('已移除动态 Agent，并移动规则7');});
const backend=serve(0);await once(backend,'listening');process.env.TOWN_HUB='http://127.0.0.1:'+backend.address().port;process.env.TOWN_CONFIG=join(home,'config.json');process.env.PORT='18768';
const {server}=await import('../server.mjs');await once(server,'listening');
process.on('SIGUSR1',()=>{if(rules.agents['runner-two'])return;rules.agents['runner-two']={name:'新增动态助手',worker:'worker-two',use:'command',command:['echo','test']};rules.rules.push({name:'新增动态规则',when:{source:'local',types:['test.dynamic']},to:'runner-two',cwd:join(home,'新增项目'),prompt:'隔离测试'});writeFileSync(process.env.AGENT_AUTOLOOP_RULES,JSON.stringify(rules));hub.reloadRules();hub.heartbeat('worker-two',[]);console.log('已动态新增规则和 Agent');});
console.log('隔离界面已就绪 http://127.0.0.1:18768 PID '+process.pid);
const cleanup=()=>{server.closeAllConnections();server.close();backend.closeAllConnections();backend.close();if(hub.db.isOpen)hub.db.close();rmSync(home,{recursive:true,force:true});process.exit(0);};process.on('SIGTERM',cleanup);process.on('SIGINT',cleanup);
