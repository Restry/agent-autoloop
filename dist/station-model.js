export const STATION_NAMES={claude:'Claude Code',codex:'Codex',copilot:'GitHub Copilot',omp:'OMP',hermes:'Hermes',pi:'Pi Agent',script:'公共脚本'};
const order=['claude','codex','copilot','omp','hermes','pi','script'];
export function executorKind(agent){
 const use=String(agent.use||'').toLowerCase();
 if(order.includes(use)&&use!=='script')return use;
 const value=[agent.id,agent.program,...(use==='command'?[]:[agent.name])].filter(Boolean).join(' ').toLowerCase();
 for(const kind of order.filter(k=>k!=='script'))if(new RegExp('(^|[^a-z])'+kind+'([^a-z]|$)').test(value))return kind;
 if(/oh-my-pi/.test(value))return 'omp';
 return use==='command'?'script':'generic';
}
export function groupStationAgents(list){
 const groups=new Map();
 for(const item of list){const key=executorKind(item),id=String(item.worker||'')+'::'+(key==='generic'?item.id:key);if(!groups.has(id))groups.set(id,{id,key,name:STATION_NAMES[key]||item.name,worker:item.worker,members:[]});groups.get(id).members.push(item);}
 return [...groups.values()].map(g=>({...g,memberIds:g.members.map(a=>a.id),online:g.members.some(a=>a.online),seenAt:g.members.map(a=>a.seenAt).filter(Boolean).sort().at(-1)||null,use:g.key==='script'?'command':g.key,totals:g.members.reduce((out,a)=>{for(const [k,v]of Object.entries(a.totals||{}))if(typeof v==='number')out[k]=(out[k]||0)+v;return out;},{})})).sort((a,b)=>String(a.worker).localeCompare(String(b.worker))||(order.indexOf(a.key)<0?99:order.indexOf(a.key))-(order.indexOf(b.key)<0?99:order.indexOf(b.key)));
}
