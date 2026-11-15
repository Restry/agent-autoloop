import {readFile,writeFile,rename,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';
const exec=promisify(execFile);
export function issueEvents(project,pages){return pages.flat().filter(i=>!i.pull_request&&(!project.since||Date.parse(i.created_at)>=Date.parse(project.since))).map(i=>({id:project.repo.toLowerCase()+'#'+i.number+':opened',type:'issues.opened',subject:('issue-'+i.number+'@'+createHash('sha256').update(project.repo).digest('hex').slice(0,12)),summary:String(i.title||'').slice(0,200),detail:('Repository: '+project.repo+'; Issue: '+i.number+'\n'+String(i.body||'')).slice(0,4000),link:i.html_url}));}
export async function poll(project,gh='/opt/homebrew/bin/gh'){
 if(!project.enabled)return [];
 const query=new URLSearchParams({state:'open',per_page:'100',sort:'created',direction:'asc'});if(project.since)query.set('since',project.since);if(project.label)query.set('labels',project.label);
 const {stdout}=await exec(gh,['api','--paginate','--slurp','repos/'+project.repo+'/issues?'+query],{timeout:90000,maxBuffer:32*1024*1024});return issueEvents(project,JSON.parse(stdout));
}
export function issueBatch(events,index){const batches=Math.max(1,Math.ceil(events.length/100)),current=index%batches;return {events:events.slice(current*100,(current+1)*100),next:(current+1)%batches,total:events.length};}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 try{const home=process.env.AGENT_AUTOLOOP_HOME||process.env.HOME+'/.agent-autoloop',registry=JSON.parse(await readFile(home+'/town-projects.json','utf8')),project=registry.projects[process.argv[2]];if(!project)throw Error('院落没有 GitHub 配置');const events=await poll(project),dir=home+'/work/github-poll-cursors';await mkdir(dir,{recursive:true,mode:0o700});const name=createHash('sha256').update(project.repo+'|'+project.since+'|'+project.label).digest('hex').slice(0,20),file=dir+'/'+name+'.json';let index=0;try{index=JSON.parse(await readFile(file,'utf8')).next||0;}catch{}const batch=issueBatch(events,index);await writeFile(file+'.tmp',JSON.stringify({next:batch.next}),{mode:0o600});await rename(file+'.tmp',file);console.log('检查 '+project.repo+'，本轮 '+batch.events.length+' 条，共 '+events.length+' 条匹配 Issue。\n\n```agent-autoloop\n'+JSON.stringify({events:batch.events})+'\n```');}
 catch(e){console.error('GitHub 检查失败：'+String(e.message).replace(/gh[pousr]_[A-Za-z0-9_]+/g,'[redacted]').slice(0,600));process.exitCode=1;}
}
