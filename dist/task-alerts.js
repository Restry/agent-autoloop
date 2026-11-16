export function taskAlert(run){
 const error=String(run.error||'').trim();
 if(['done','nothing','cancelled'].includes(run.state))return null;
 if(run.state==='unknown')return {id:run.id,rule:run.rule,state:run.state,label:'执行状态不确定',error:error||'尚不能确认任务是否仍在执行。',historical:false};
 if(run.state==='failed')return {id:run.id,rule:run.rule,state:run.state,label:'执行失败',error:error||'任务没有完成，未提供错误详情。',historical:false};
 if(!error)return null;
 return {id:run.id,rule:run.rule,state:run.state,label:run.state==='claimed'?'重试处理中 · 上次有错误':run.state==='queued'?'上次失败 · 等待重试':'任务异常',error,historical:run.state==='claimed'};
}
export const taskAlerts=runs=>runs.map(taskAlert).filter(Boolean).sort((a,b)=>Number(a.historical)-Number(b.historical)||b.id-a.id);

export function errorSummary(error){const parts=[];if(/unrecognized_model|unknown.model|model.not.found/i.test(error))parts.push('所用模型无法识别');if(/Background tasks still running|10m after|timed? ?out|超时/i.test(error))parts.push('后台任务等待超时');return parts.length?parts.join('；'):String(error||'任务未提供详细原因').split('\n')[0].slice(0,120);}
