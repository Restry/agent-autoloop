import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
export const AIHOT_URL='https://aihot.news/api/v1/items?window=24h&mode=selected&limit=20';
const delay=ms=>new Promise(r=>setTimeout(r,ms));
export async function collectAihot({fetcher=fetch,wait=delay,skillDir=join(process.env.HOME,'.claude/skills/aihot')}={}){
 let ua='aihot-api/2.0.0';try{const actor=(await readFile(join(skillDir,'.aihot-actor-id'),'utf8')).trim();if(/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(actor))ua+=' aihot-actor/'+actor;}catch{}
 for(let attempt=0;attempt<2;attempt++){
  let r;try{r=await fetcher(AIHOT_URL,{method:'GET',headers:{'user-agent':ua,accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(20000)});}catch(e){if(attempt===0){await wait(3000);continue;}throw Error('AIHOT 暂时无法连接，请稍后重试：https://aihot.news');}
  if((r.status===429||r.status>=500)&&attempt===0){const raw=r.headers.get('retry-after'),seconds=raw?Number(raw):3,ms=Number.isFinite(seconds)?seconds*1000:Date.parse(raw)-Date.now();if(ms>55000)throw Error('AIHOT 请求受限，请在服务指定时间后重试。');await wait(Math.max(1000,ms||3000));continue;}
  if(!r.ok)throw Error('AIHOT 暂时不可用（'+r.status+'）：https://aihot.news');
  const data=await r.json();if(!Array.isArray(data.items))throw Error('AIHOT 返回的数据格式不符，未生成报告。');
  const articles=data.items.map(item=>({id:item.id,title:item.title,summary:item.summary,source:item.source?.name,publishedAt:item.publishedAt??null,discoveredAt:item.discoveredAt,category:item.category,reason:item.reason,url:item.links?.aihot,originalUrl:item.links?.original}));
  if(articles.some(a=>typeof a.url!=='string'||!a.url.startsWith('https://aihot.news/')))throw Error('AIHOT 阅读链接格式不符，未生成报告。');
  return {provider:'AIHOT',topic:'科技与 AI 早报',fetchedAt:new Date().toISOString(),windowHours:24,ordering:data.query?.ordering,hasMore:!!data.page?.hasMore,coverage:'AIHOT 精选标题、摘要和推荐理由；不是原文全文。24 小时范围以 AIHOT 时间线为准，原文发布时间可能较早。',articles};
 }
}
