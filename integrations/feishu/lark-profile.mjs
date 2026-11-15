#!/usr/bin/env node
// Explicit profile; never inherits the CLI's globally selected app.
import {readFileSync} from 'node:fs';
import {spawn} from 'node:child_process';
const settings=JSON.parse(readFileSync(new URL('./lark-settings.json',import.meta.url),'utf8'));
if(!settings.profile||!settings.program){console.error('飞书配置尚未选定，不能启动通道。');process.exit(2);}
if(process.argv.slice(2).some(a=>a==='--profile'||a.startsWith('--profile='))){console.error('通道使用固定飞书配置，不能覆盖。');process.exit(2);}
const child=spawn(settings.program,['--profile',settings.profile,...process.argv.slice(2)],{stdio:'inherit',env:{...process.env,LARKSUITE_CLI_NO_UPDATE_NOTIFIER:'1',LARKSUITE_CLI_NO_SKILLS_NOTIFIER:'1'}});
child.on('error',()=>{console.error('无法启动飞书 CLI。');process.exitCode=1;});
for(const sig of ['SIGTERM','SIGINT'])process.on(sig,()=>child.kill(sig));
child.on('exit',(code,signal)=>{process.exitCode=code??(signal?1:0);});
