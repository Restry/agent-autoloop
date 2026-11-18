// Presentation only: never changes engine state, queues or authorization decisions.
export const isContinuation=run=>(run.events||[]).length>0&&(run.events||[]).every(e=>e.type==='card.answered');
const final=run=>['done','nothing','cancelled','failed'].includes(run.state);
const blockedText=text=>/\[阻塞\]|【阻塞】|被阻塞|尚未(?:完成|通过|进入)|未(?:进入业务同步|完成|通过验收|通过验证|通过测试|同步|执行同步)|没有完成|待验收|无法(?:继续|执行|开始|完成)|权限(?:缺失|不足)|待你处理|等待(?:授权|确认|人工)|已.*请你.*(?:处理|确认)|需要你.*(?:确认|授权)/.test(text||'');
export function evidenceFromFacts(id,facts){
 const changes=(Array.isArray(facts)?facts:[]).flatMap(f=>f.changes||[]),cards=new Map(),eventIds=new Set();
 for(const c of changes){if(c.table==='run_events'&&c.row?.run_id===id)eventIds.add(c.row.event_id);if(c.table==='cards'&&c.row)cards.set(c.row.id,c.row);}
 const parents=[...cards.values()].filter(c=>eventIds.has(c.answer_event)&&Number.isInteger(c.run_id)&&c.run_id<id).map(c=>c.run_id);
 return {id,parents:[...new Set(parents)],cards:[...cards.values()].filter(c=>c.run_id===id)};
}
function cardsFor(run,evidence,cards){const current=new Map(cards.map(c=>[c.id,c]));return (evidence.get(run.id)?.cards||[]).map(c=>({...c,...current.get(c.id)}));}
export function runProgress(run,evidence=new Map(),cards=[]){
 const asks=cardsFor(run,evidence,cards).filter(c=>c.kind==='ask'&&c.state==='open');
 if(run.stopping)return {state:'stopping',label:'正在停止',complete:false};
 if(run.state==='claimed')return {state:'running',label:isContinuation(run)?'授权后续办中':'执行中',complete:false};
 if(run.state==='queued')return {state:'queued',label:run.attempts>0?'等待重试':isContinuation(run)?'等待授权续办':'等待执行',complete:false};
 if(run.state==='unknown')return {state:'unknown',label:'执行状态不明',complete:false};
 if(run.state==='failed')return {state:'blocked',label:'阻塞 · 执行失败',complete:false};
 if(run.state==='cancelled')return {state:'cancelled',label:'已停止',complete:false};
 if(asks.length||blockedText(run.summary))return {state:'blocked',label:asks.length?'阻塞 · 待处理':'阻塞 · 尚未完成',complete:false};
 if(run.state==='nothing'||/无需同步|无新改动|没有新提交/.test(run.summary||''))return {state:'nothing',label:'无需处理',complete:false};
 const summary=String(run.summary||'');
 const explicit=/同步/.test(run.rule)?/\[完成\]|【完成】|同步(?:已)?完成|已完成[^。\n]*同步/.test(summary):/\[完成\]|【完成】|已完成|已生成|已处理|检查通过|自检完成|巡检正常|试跑通过|COPILOT_HUB_OK/.test(summary);
 if(run.state==='done'&&explicit&&!/完成后|计划同步|准备同步|即将同步/.test(summary)&&/同步/.test(run.rule)&&!evidence.has(run.id))return {state:'unconfirmed',label:'完成回报待核对',complete:false};
 if(run.state==='done'&&explicit&&!/完成后|计划同步|准备同步|即将同步/.test(summary))return {state:'completed',label:'已完成',complete:true};
 return {state:'unconfirmed',label:'本轮结束 · 完成待确认',complete:false};
}
export function groupTasks(runs,evidence=new Map(),cards=[]){
 const unique=[...new Map(runs.map(r=>[r.id,r])).values()],byId=new Map(unique.map(r=>[r.id,r]));
 const rootOf=id=>{let current=id;const seen=new Set();while(!seen.has(current)){seen.add(current);const run=byId.get(current);if(run&&!isContinuation(run))break;const parents=(evidence.get(current)?.parents||[]).filter(p=>p<current&&(!byId.has(p)||byId.get(p).rule===(run||byId.get(id)).rule));if(parents.length!==1)break;current=parents[0];}return current;};
 const groups=new Map();for(const run of unique){const id=rootOf(run.id);if(!groups.has(id))groups.set(id,{id,rule:run.rule,runs:[]});groups.get(id).runs.push(run);}
 for(const group of groups.values()){
  group.runs.sort((a,b)=>a.id-b.id);group.root=byId.get(group.id)||group.runs[0];group.latest=group.runs.at(-1);group.active=group.runs.filter(r=>!final(r));
  group.cards=[...new Map(group.runs.flatMap(r=>cardsFor(r,evidence,cards)).map(c=>[c.id,c])).values()];
  const open=group.cards.filter(c=>c.kind==='ask'&&c.state==='open');
  const working=group.active.find(r=>r.state==='claimed'),queued=group.active.find(r=>r.state==='queued');
  group.progress=open.length?{state:'blocked',label:working?'执行中 · 仍有阻塞':'阻塞 · 待处理',complete:false}:working?runProgress(working,evidence,cards):group.active.some(r=>r.state==='unknown')?{state:'unknown',label:'执行状态不明',complete:false}:queued?runProgress(queued,evidence,cards):runProgress(group.latest,evidence,cards);
  group.continuations=group.runs.filter(isContinuation).length;group.missingRoot=!byId.has(group.id);
 }
 return [...groups.values()].sort((a,b)=>b.latest.id-a.latest.id);
}
