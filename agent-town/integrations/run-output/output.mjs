import {randomUUID} from 'node:crypto';
import {readdir,readFile,writeFile,mkdir,rename,realpath,lstat,open} from 'node:fs/promises';
import path from 'node:path';
const LIMIT=4*1024*1024,MAX_TEXT=400000;
export function extractOutput(text,{kind='unknown',terminal=false,truncated=false}={}){
 const lines=text.split('\n'),events=[];let hasStream=false;
 for(const line of lines){try{const e=JSON.parse(line);events.push(e);if(['assistant','user','system','result','thread.started','turn.started','turn.completed','item.completed'].includes(e.type))hasStream=true;}catch{}}
 if(kind==='command'||!hasStream&&kind==='unknown'&&!events.length)return terminal?{text:text.slice(0,MAX_TEXT),source:'command',truncated:truncated||text.length>MAX_TEXT}:null;
 if(!terminal)return null;
 const result=events.findLast(e=>e.type==='result'&&!e.parent_tool_use_id&&typeof e.result==='string'&&e.result.trim());
 if(result)return {text:result.result.slice(0,MAX_TEXT),source:'claude-result',truncated:result.result.length>MAX_TEXT};
 const end=events.findLastIndex(e=>e.type==='turn.completed');
 if(end>=0){const message=events.slice(0,end+1).findLast(e=>e.type==='item.completed'&&e.item?.type==='agent_message'&&typeof e.item.text==='string');if(message)return {text:message.item.text.slice(0,MAX_TEXT),source:'codex-message',truncated:message.item.text.length>MAX_TEXT};}
 return null;
}
export function createRunOutputs(home){
 const cacheRoot=path.join(home,'town-results'),runsRoot=path.join(home,'worker/runs');
 async function snapshot(file){const stat=await lstat(file);if(!stat.isFile()||stat.isSymbolicLink())throw Error('Not a regular log');const fd=await open(file,'r');try{const start=Math.max(0,stat.size-LIMIT),buf=Buffer.alloc(Math.min(stat.size,LIMIT));const {bytesRead}=await fd.read(buf,0,buf.length,start);let text=buf.subarray(0,bytesRead).toString();if(start)text=text.slice(text.indexOf('\n')+1);return {text,truncated:!!start};}finally{await fd.close();}}
 async function get(id,metadata={}){
  if(!Number.isSafeInteger(id)||id<1)throw Error('Invalid run');
  const file=path.join(cacheRoot,id+'.json');let cached;try{cached=JSON.parse(await readFile(file,'utf8'));}catch{}
  const terminal=['done','nothing','cancelled','failed'].includes(metadata.state);
  if(cached&&terminal&&cached.state===metadata.state)return cached;
  let names=[];try{names=(await readdir(runsRoot)).filter(n=>new RegExp('^'+id+'-\\d+$').test(n));}catch{}
  const attempts=[];const canonical=names.length?await realpath(runsRoot):null;
  for(const name of names){const dir=path.join(runsRoot,name);if((await lstat(dir)).isSymbolicLink()||!(await realpath(dir)).startsWith(canonical+path.sep))continue;const logs=(await readdir(dir)).filter(n=>/^stdout-\d+\.log$/.test(n)).sort((a,b)=>Number(a.match(/\d+/)[0])-Number(b.match(/\d+/)[0]));let output=null;for(const log of logs){const tail=await snapshot(path.join(dir,log));const found=extractOutput(tail.text,{kind:metadata.kind,terminal,...tail});if(found)output={...found,log};}
   attempts.push({attempt:Number(name.split('-')[1]),output});
  }
  attempts.sort((a,b)=>b.attempt-a.attempt);
  const answer={run:id,rule:metadata.rule||cached?.rule||'',state:metadata.state||cached?.state||'unknown',attempts:attempts.length?attempts:(cached?.attempts||[]),message:terminal?'未找到可识别的最终回复。旧日志可能已清理；生成文件仍可从交付成果查看。':'任务尚未结束，最终回复会在结束后出现。',savedAt:new Date().toISOString()};
  if(terminal&&attempts.some(a=>a.output)){await mkdir(cacheRoot,{recursive:true,mode:0o700});const temporary=file+'.'+randomUUID()+'.tmp';await writeFile(temporary,JSON.stringify(answer),{mode:0o600,flag:'wx'});await rename(temporary,file);}
  return answer;
 }
 return {get};
}
