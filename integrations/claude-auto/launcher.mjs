#!/usr/bin/env node
// Keep Claude's native adapter/receipt handling; change only the launch permission mode and an explicit one-run resume.
import fs from 'node:fs';import path from 'node:path';import {spawn} from 'node:child_process';import {fileURLToPath} from 'node:url';
export function autoArguments(argv,{settings,resume,previousFolder}={}){
 const out=[];for(let i=0;i<argv.length;i++){const arg=argv[i];if(arg==='--permission-mode'){i++;continue;}if(resume&&(arg==='--session-id'||arg==='--resume')){i++;continue;}out.push(arg);}
 out.push('--permission-mode','auto');if(settings)out.push('--settings',settings);if(resume){out.push('--resume',resume);if(previousFolder)out.push('--add-dir',previousFolder);}return out;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const base=path.dirname(fileURLToPath(import.meta.url)),run=process.env.AGENT_AUTOLOOP_RUN;if(!/^\d+$/.test(run||''))throw Error('This launcher requires an Autoloop run');
 const pending=path.join(base,'claude-sync-auto.resume.json'),used=path.join(base,'claude-sync-auto.resume-'+run+'.json');
 let request;if(fs.existsSync(used))request=JSON.parse(fs.readFileSync(used,'utf8'));else if(fs.existsSync(pending)){request=JSON.parse(fs.readFileSync(pending,'utf8'));if(!/^[0-9a-f-]{36}$/.test(request.session)||request.cwd!==process.cwd())throw Error('Resume scope mismatch');fs.renameSync(pending,used);}
 const args=autoArguments(process.argv.slice(2),{settings:path.join(base,'claude-sync-auto.settings.json'),resume:request?.session,previousFolder:request?.previousFolder});
 const child=spawn('/Users/louis/.nvm/versions/node/v24.18.0/bin/claude',args,{stdio:'inherit',env:process.env});child.on('error',error=>{console.error(error.message);process.exitCode=1;});child.on('exit',(code,signal)=>{process.exit(code??(signal?1:0));});
}
