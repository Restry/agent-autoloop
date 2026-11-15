// Read-only. Never starts an event consumer, sends a message, creates a key or edits settings.
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
const settings=JSON.parse(readFileSync(new URL('./lark-settings.json',import.meta.url),'utf8'));
const arg=process.argv.indexOf('--profile'),profile=arg>=0?process.argv[arg+1]:settings.profile;
if(!profile){console.error('请先选择飞书配置：node preflight.mjs --profile <名称>');process.exit(2);}
const call=args=>{try{return JSON.parse(execFileSync(settings.program,['--profile',profile,...args],{encoding:'utf8',timeout:30000,stdio:['ignore','pipe','pipe'],env:{...process.env,LARKSUITE_CLI_NO_UPDATE_NOTIFIER:'1',LARKSUITE_CLI_NO_SKILLS_NOTIFIER:'1'}}));}catch(e){let d;try{d=JSON.parse(e.stderr||e.stdout);}catch{}return {ok:false,error:{type:d?.error?.type||'cli_failure'}};}};
const auth=call(['auth','status','--json','--verify']);
const events=call(['event','status','--current','--json']);
const preview=call(['event','consume','card.action.trigger','--as','bot','--dry-run']);
const apps=events.apps||events.data?.apps||[];
const consumers=apps.filter(a=>a.app_id===auth.appId).flatMap(a=>a.consumers||[]).filter(c=>c.event_key==='card.action.trigger');
console.log(JSON.stringify({profile,verified:auth.verified===true,botReady:auth.identities?.bot?.status==='ready',userName:auth.identities?.user?.userName||null,userReady:auth.identities?.user?.tokenStatus==='valid',cardEventPreflight:preview.data?.decision?.status||'unknown',existingCardConsumers:consumers.map(c=>({pid:c.pid,event:c.event_key})),activationReady:auth.verified===true&&auth.identities?.bot?.status==='ready'&&preview.data?.decision?.status==='ready'&&consumers.length===0,limitations:['未验证实际发卡、点击回传和续办','同一应用已有卡片消费方时，需要先确定回调归属'],writesPerformed:false},null,2));
