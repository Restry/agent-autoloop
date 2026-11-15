#!/usr/bin/env node
import {readFileSync} from 'node:fs';
import {spawn} from 'node:child_process';
const settings=JSON.parse(readFileSync(new URL('./lark-settings.json',import.meta.url),'utf8'));
const runtime=JSON.parse(readFileSync(new URL('./live-test-runtime.json',import.meta.url),'utf8'));
const args=process.argv.slice(2),index=args.indexOf('--idempotency-key');
if(index>=0)args[index+1]=runtime.prefix+args[index+1];
const child=spawn(settings.program,['--profile',settings.profile,...args],{stdio:'inherit',env:{...process.env,LARKSUITE_CLI_NO_UPDATE_NOTIFIER:'1',LARKSUITE_CLI_NO_SKILLS_NOTIFIER:'1'}});
child.on('error',()=>{console.error('测试飞书 CLI 启动失败');process.exitCode=1;});
for(const sig of ['SIGTERM','SIGINT'])process.on(sig,()=>child.kill(sig));
child.on('exit',code=>{process.exitCode=code??1;});
