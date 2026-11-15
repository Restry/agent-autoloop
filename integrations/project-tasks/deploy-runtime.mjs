import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
const home=process.env.AGENT_AUTOLOOP_HOME||process.env.HOME+'/.agent-autoloop',target=home+'/lib/town-project-tasks';await mkdir(target,{recursive:true,mode:0o700});
for(const file of ['collect-brief.mjs','github-poll.mjs']){await writeFile(target+'/'+file+'.tmp',await readFile(new URL(file,import.meta.url)),{mode:0o600});await rename(target+'/'+file+'.tmp',target+'/'+file);}
console.log('已更新中台后台脚本。');
