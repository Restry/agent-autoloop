// Keep the author's incident lifecycle; require both the page and backend health to pass.
import {readFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {probe,receipt} from './upstream-check.ts';
export function validateSite(site){
 if(!/^[A-Za-z0-9_.-]{1,60}$/.test(site.id)||typeof site.name!=='string'||!site.name||site.name.length>100)throw Error('站点编号或名称无效');
 for(const item of [site,site.health]){if(!item||typeof item.contains!=='string'||!item.contains)throw Error('缺少检查内容');const u=new URL(item.url);if(!['http:','https:'].includes(u.protocol)||u.username||u.password||u.search||u.hash)throw Error('检查地址须为不含凭据、查询参数或片段的 HTTP 地址');}
 if(new URL(site.url).origin!==new URL(site.health.url).origin)throw Error('首页和健康接口须属于同一站点');return site;
}
export async function observe(site,request=fetch){
 validateSite(site);const [page,health]=await Promise.all([probe(site,request),probe({...site,...site.health},request)]);
 return {ok:page.ok&&health.ok,reason:`首页：${page.reason}；健康接口：${health.reason}`};
}
export function makeReceipt(site,observation,context){
 const result=receipt(site,observation,context);
 if(result.notice)for(const item of result.notice)item.text=`${observation.reason}\n目标：${site.url}\n已交给只读维护 Agent 排查；恢复后会更新这张卡片。故障未恢复前请保留卡片，避免重新提醒。`;
 return result;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const site=validateSite(JSON.parse(readFileSync(process.argv[2],'utf8')));
 const context=JSON.parse(readFileSync(process.env.AGENT_AUTOLOOP_CONTEXT,'utf8'));
 const observation=await observe(site),result=makeReceipt(site,observation,context);
 console.log(`AI Hub 巡检${observation.ok?'正常':'异常'}：${observation.reason}\n\n\`\`\`agent-autoloop\n${JSON.stringify(result)}\n\`\`\``);
}
