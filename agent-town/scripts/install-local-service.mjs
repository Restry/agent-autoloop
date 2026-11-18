// Deploy an independent UI runtime so launchd never depends on a temporary terminal or Documents access.
import {cp,mkdir,writeFile,rename} from 'node:fs/promises';
import {homedir} from 'node:os';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
if(process.platform!=='darwin')throw Error('This installer requires macOS launchd');
const source=resolve(dirname(fileURLToPath(import.meta.url)),'..'),home=homedir();
const service='cn.restry.agent-town',base=join(home,'.agent-autoloop/town-ui'),release=join(base,'releases',new Date().toISOString().replace(/[:.]/g,'-'));
await mkdir(release,{recursive:true,mode:0o700});
for(const name of ['server.mjs','dist','integrations'])await cp(join(source,name),join(release,name),{recursive:true});
const logs=join(home,'.agent-autoloop/logs');await mkdir(logs,{recursive:true,mode:0o700});
const xml=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const string=value=>'<string>'+xml(value)+'</string>';
const config={PORT:'8765',TOWN_HUB:'http://127.0.0.1:3350',TOWN_CONFIG:join(home,'.agent-autoloop/config.json')};
const plist=`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>Label</key>${string(service)}
<key>ProgramArguments</key><array>${string(process.execPath)}${string(join(release,'server.mjs'))}</array>
<key>WorkingDirectory</key>${string(release)}
<key>EnvironmentVariables</key><dict>${Object.entries(config).map(([key,value])=>'<key>'+xml(key)+'</key>'+string(value)).join('')}</dict>
<key>RunAtLoad</key><true/><key>KeepAlive</key><true/>
<key>ThrottleInterval</key><integer>5</integer>
<key>StandardOutPath</key>${string(join(logs,'town-ui.log'))}
<key>StandardErrorPath</key>${string(join(logs,'town-ui-error.log'))}
</dict></plist>`;
const agents=join(home,'Library/LaunchAgents');await mkdir(agents,{recursive:true});
const file=join(agents,service+'.plist');await writeFile(file+'.tmp',plist,{mode:0o644});
execFileSync('plutil',['-lint',file+'.tmp']);await rename(file+'.tmp',file);
const domain='gui/'+process.getuid();try{execFileSync('launchctl',['bootout',domain+'/'+service],{stdio:'ignore'});}catch{}
let started=false;for(let attempt=0;attempt<20;attempt++){try{execFileSync('launchctl',['bootstrap',domain,file],{stdio:'pipe'});started=true;break;}catch(error){try{execFileSync('launchctl',['print',domain+'/'+service],{stdio:'ignore'});started=true;break;}catch{}if(attempt===19)throw error;await new Promise(r=>setTimeout(r,250));}}if(!started)throw Error('UI service registration failed');
for(let i=0;i<30;i++){try{const response=await fetch('http://127.0.0.1:8765/api/healthz',{signal:AbortSignal.timeout(1500)});if(response.ok){const status={service,release,url:'http://127.0.0.1:8765/',backend:await response.json()};await writeFile(join(base,'deployment.json'),JSON.stringify(status,null,2)+'\n',{mode:0o600});console.log(JSON.stringify(status));process.exit(0);}}catch{}await new Promise(r=>setTimeout(r,500));}
throw Error('UI service did not become healthy; inspect '+join(logs,'town-ui-error.log'));
