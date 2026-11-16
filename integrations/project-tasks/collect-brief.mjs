import {readFile,writeFile,mkdir,readdir,stat,access} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {resolve,basename,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const exec=promisify(execFile),home=process.env.AGENT_AUTOLOOP_HOME||process.env.HOME+'/.agent-autoloop';
export const localDate=date=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(date);
async function git(cwd,args){return (await exec('git',['-C',cwd,...args],{timeout:10000,maxBuffer:1024*1024})).stdout.trim();}
export async function collect(kind,{preview=false}={}){if(!['morning','projects'].includes(kind))throw Error('Unknown brief type');const now=new Date(),date=localDate(now),dir=home+'/work/daily-'+kind;await mkdir(dir+'/inputs',{recursive:true,mode:0o700});await mkdir(dir+'/briefs',{recursive:true,mode:0o700});
 try{if(preview)throw Error('preview');await access(dir+'/briefs/'+date+'.md');return {outcome:'nothing',summary:'今天的简报已经生成。',events:[]};}catch{}
 let input={date,window:{from:new Date(now.getTime()-86400000).toISOString(),to:now.toISOString()},timezone:'Asia/Shanghai',generatedAt:now.toISOString(),mode:kind};
 if(kind==='morning'){
  const {stdout}=await exec('/usr/bin/python3',[fileURLToPath(new URL('./collect-news.py',import.meta.url))],{timeout:30000,maxBuffer:4*1024*1024});input.news=JSON.parse(stdout);
 }
 let rules;
 if(kind==='projects'){
  const config=JSON.parse(await readFile(home+'/config.json','utf8'));rules=JSON.parse(await readFile(home+'/rules.json','utf8'));const response=await fetch((config.url||'http://127.0.0.1:3350').replace(/\/$/,'')+'/v1/state',{headers:{authorization:'Bearer '+config.owner},signal:AbortSignal.timeout(10000)});if(!response.ok)throw Error('中台状态读取失败');const state=await response.json();input.tasks={totals:state.totals,runs:state.runs.slice(0,50).map(r=>({rule:r.rule,state:r.state,createdAt:r.createdAt,finishedAt:r.finishedAt,summary:r.summary})),cards:state.cards.map(c=>({title:c.title,rule:c.rule,text:c.text})),next:state.lines.map(l=>({name:l.name,group:l.group,next:l.next,paused:!!l.paused}))};
 }
 if(kind==='projects'){
  const roots=new Set(),unavailable=[];
  const bases=[...new Set(rules.rules.map(r=>r.cwd.replace(/^~(?=\/)/,process.env.HOME)).filter(p=>!p.startsWith(home+'/')))];
  for(const base of bases){try{roots.add(await git(base,['rev-parse','--show-toplevel']));}catch{let found=false;try{for(const e of await readdir(base,{withFileTypes:true})){if(!e.isDirectory()||e.name.startsWith('.')||['node_modules','vendor','dist','build','test-results'].includes(e.name))continue;try{roots.add(await git(join(base,e.name),['rev-parse','--show-toplevel']));found=true;}catch{}}}catch{}if(!found)unavailable.push({name:basename(base),path:base,gitAvailable:false,error:'没有可读取的 Git 仓库，提交和改动未知'});}}
  input.projects=[...unavailable];for(const root of roots){try{const changes=(await git(root,['status','--short'])).split('\n').filter(Boolean),commits=(await git(root,['log','--since='+input.window.from,'--until='+input.window.to,'--max-count=35','--format=%h %ad %s','--date=iso-strict'])).split('\n').filter(Boolean),total=Number(await git(root,['rev-list','--count','--since='+input.window.from,'--until='+input.window.to,'HEAD']));input.projects.push({name:basename(root),path:root,branch:await git(root,['branch','--show-current']),changes:{total:changes.length,items:changes.slice(0,80),truncated:changes.length>80},commits:{total,items:commits,truncated:total>commits.length}});}catch{input.projects.push({name:basename(root),path:root,error:'Git 状态读取失败'});}}
 }
 if(preview)return input;
 const file='inputs/'+date+'.json';await writeFile(dir+'/'+file,JSON.stringify(input,null,2)+'\n',{mode:0o600});return {outcome:'done',summary:'已采集'+(kind==='projects'?'项目进展':'科技和 AI 新闻')+'，准备生成简报。',events:[{id:kind+'-'+date,type:'brief.'+kind+'.ready',subject:date,summary:date+' '+(kind==='projects'?'每日项目简报':'每日早报'),detail:JSON.stringify({date,input:file,output:'briefs/'+date+'.md'})}]};
}
export const formatReceipt=result=>(result.outcome==='nothing'?'没事可做：':'')+result.summary+'\n\n```agent-autoloop\n'+JSON.stringify({events:result.events})+'\n```';
if(process.argv[1]===fileURLToPath(import.meta.url)){try{console.log(formatReceipt(await collect(process.argv[2])));}catch(e){console.error(e.message);process.exitCode=1;}}
