import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createGithubProjects,normalizeRepo,projectKey,ownedNames} from '../integrations/project-tasks/github-projects.mjs';
import {issueEvents,issueBatch} from '../integrations/project-tasks/github-poll.mjs';
import {readMessage,resultFrom} from '/Users/louis/.agent-autoloop/app/worker/contract.ts';
import {localDate,formatReceipt} from '../integrations/project-tasks/collect-brief.mjs';
import {parseRules} from '/Users/louis/.agent-autoloop/app/protocol/rules.ts';
const dir=await mkdtemp(join(tmpdir(),'town-project-tasks-'));
try{
 const config=join(dir,'config.json');await writeFile(config,JSON.stringify({worker:{name:'test'}}));const a=join(dir,'one'),b=join(dir,'two');
 for(const [folder,repo]of [[a,'acme/one'],[b,'acme/two']]){await mkdir(folder);execFileSync('git',['init','-q',folder]);execFileSync('git',['-C',folder,'remote','add','origin','https://github.com/'+repo+'.git']);}
 const gh=join(dir,'gh');await writeFile(gh,'#!/usr/bin/env node\nconsole.log(JSON.stringify({nameWithOwner:process.argv[4]}));',{mode:0o700});
 let text=JSON.stringify({sources:{},agents:{codex:{name:'Codex',worker:'test',use:'codex'}},channels:{},rules:[{name:'existing',to:'codex',cwd:a,when:{cron:'0 9 * * *'},prompt:'Keep this rule'}]}),runs=[];
 const hubCall=async(method,path,body)=>{if(path==='/v1/state')return {runs};if(method==='GET')return {text};parseRules(body.text,Date.now(),'Asia/Shanghai');if(method==='PUT')text=body.text;return {ok:true};};
 const service=createGithubProjects({home:dir,configPath:config,node:process.execPath,poller:'/trusted/poll.mjs',gh,hubCall});
 const input=(group,repo,cwd,revision)=>({group,repo,cwd,revision,agent:'codex',cron:'*/5 * * * *',label:'bug',includeExisting:false,enabled:true});
 assert.equal(normalizeRepo('https://github.com/acme/one.git'),'acme/one');assert.throws(()=>normalizeRepo('acme/one;touch /tmp/no'));
 const first=await service.view('项目甲');assert.equal(first.project.cwd,'');const v1=input('项目甲','acme/one',a,first.revision);await service.check(v1);assert.equal(JSON.parse(text).rules.length,1);await service.save(v1);
 const savedA=(await service.view('项目甲')).project;assert(savedA.since);await assert.rejects(service.check(input('重复院落','acme/one',a,(await service.view('重复院落')).revision)),e=>e.status===400);const v2=input('项目乙','acme/two',b,(await service.view('项目乙')).revision);await service.save(v2);
 let rules=JSON.parse(text);assert.equal(rules.rules.length,5);assert(rules.rules.some(r=>r.name==='existing'));assert.notEqual(rules.rules[2].when.source,rules.rules[4].when.source);assert.equal(Object.keys(rules.sources).length,2);
 await assert.rejects(service.save(v1),e=>e.status===409);
 const fresh=await service.view('项目甲');runs=[{rule:ownedNames(savedA)[1],state:'claimed'}];await assert.rejects(service.save({...v1,revision:fresh.revision}),e=>e.status===409);runs=[];
 await service.save({...v1,cwd:'/missing/project',enabled:false,revision:fresh.revision});rules=JSON.parse(text);assert.equal(rules.rules.length,3);assert(rules.rules.some(r=>r.group==='项目乙'));
 const one={repo:'acme/one',since:'2026-11-15T00:00:00Z'},two={...one,repo:'acme/two'},sample={number:1,title:'fix',body:'test',created_at:'2026-11-15T01:00:00Z',html_url:'https://github.com/acme/one/issues/1'};
 assert.notEqual(issueEvents(one,[[sample]])[0].id,issueEvents(two,[[sample]])[0].id);assert.equal(issueEvents(one,[[{...sample,pull_request:{}},{...sample,created_at:'2020-01-01'}]]).length,0);
 const all=Array.from({length:225},(_,id)=>({id})),found=[];let cursor=0;for(let i=0;i<3;i++){const batch=issueBatch(all,cursor);assert(batch.events.length<=100);found.push(...batch.events.map(e=>e.id));cursor=batch.next;}assert.equal(new Set(found).size,225);assert.equal(cursor,0);
 const receipt=resultFrom(readMessage(formatReceipt({outcome:'done',summary:'已采集',events:[{id:'morning-2026-11-15',type:'brief.morning.ready',subject:'2026-11-15'}]})),{});assert.equal(receipt.problem,undefined);assert.equal(receipt.result.events.length,1);
 assert.equal(localDate(new Date('2026-11-15T17:00:00Z')),'2026-11-16');
 console.log('Passed: project isolation, rule validation, non-mutating check, revision conflicts, active-run guard, disable, issue deduplication/batching and Shanghai date.');
}finally{await rm(dir,{recursive:true,force:true});}
