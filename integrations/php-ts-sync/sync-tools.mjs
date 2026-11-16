import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const exec=promisify(execFile);
const root='/Users/louis/projects/GenFlow';
export const repositories=['GemFlow','nexora-genflow-service','GemFlow-Services','GemFlow-AI'].map(name=>({name,cwd:root+'/'+name,remote:'origin',branch:'main'}));
async function git(repo,args){try{return (await exec('git',['-C',repo.cwd,...args],{timeout:120000,maxBuffer:2*1024*1024})).stdout.trim();}catch{throw Error('Git 操作失败：'+args[0]+'；请检查仓库、远端连接与权限。');}}
export async function prepare({repos=repositories,run=git}={}){
 const result={at:new Date().toISOString(),status:'blocked',repositories:[]};
 // Fetch every repository before deciding whether any working tree can be updated.
 for(const repo of repos){const row={name:repo.name,target:repo.remote+'/'+repo.branch,blockers:[]};result.repositories.push(row);try{await run(repo,['fetch','--prune',repo.remote]);row.targetCommit=await run(repo,['rev-parse','--verify',row.target+'^{commit}']);row.branch=await run(repo,['symbolic-ref','--short','HEAD']);row.before=await run(repo,['rev-parse','HEAD']);row.dirty=!!(await run(repo,['status','--porcelain']));if(row.dirty)row.blockers.push('存在未提交或未跟踪改动，保留现场');if(await run(repo,['ls-files','-u']))row.blockers.push('存在未解决的冲突');const counts=(await run(repo,['rev-list','--left-right','--count','HEAD...'+row.targetCommit])).split(/\s+/).map(Number);if(counts.length!==2||counts.some(n=>!Number.isFinite(n)))throw Error('无法判断分支关系');[row.ahead,row.behind]=counts;if(row.ahead&&row.behind)row.blockers.push('本地与 origin/main 分叉，不能快进');}catch(e){row.blockers.push(e.message);}}
 if(result.repositories.some(r=>r.blockers.length))return result;
 for(let i=0;i<repos.length;i++){const repo=repos[i],row=result.repositories[i];try{if(await run(repo,['status','--porcelain'])||(await run(repo,['rev-parse','HEAD']))!==row.before)throw Error('检查后工作区发生变化，停止更新');if(row.behind)await run(repo,['merge','--ff-only',row.targetCommit]);row.after=await run(repo,['rev-parse','HEAD']);await run(repo,['merge-base','--is-ancestor',row.targetCommit,'HEAD']);}catch(e){row.blockers.push(e.message);return result;}}
 result.status='ready';result.sourceCommit=result.repositories.find(r=>r.name==='nexora-genflow-service')?.targetCommit;return result;
}
async function main(action){if(action==='prepare'){const result=await prepare();const dir=path.dirname(fileURLToPath(import.meta.url));await writeFile(path.join(dir,'prepare-result.json'),JSON.stringify(result,null,2)+'\n',{mode:0o600});console.log(JSON.stringify(result,null,2));if(result.status!=='ready')process.exitCode=2;}else if(action==='verify'){const cwd=root+'/GemFlow-Services';const pkg=JSON.parse(await readFile(cwd+'/package.json'));if(!pkg.scripts?.verify)throw Error('TS 后端没有 verify 脚本');const child=(await import('node:child_process')).spawn('pnpm',['run','verify'],{cwd,stdio:'inherit',shell:false});child.on('error',()=>{console.error('无法启动 pnpm');process.exitCode=1;});child.on('exit',code=>{process.exitCode=code??1;});}else throw Error('只支持 prepare 或 verify；不接收任意命令');}
if(process.argv[1]===fileURLToPath(import.meta.url)){main(process.argv[2]).catch(e=>{console.error(e.message);process.exitCode=1;});}
