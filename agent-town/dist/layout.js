// Business membership comes exclusively from the hub snapshot. Position is presentation only.
export function assignLayout(state){
 const result=Object.create(null),groups=new Map();
 for(const line of state.lines||[]){if(typeof line.group!=='string'||!line.group.length)continue;if(!groups.has(line.group))groups.set(line.group,[]);groups.get(line.group).push(line);}
 for(const [group,lines]of [...groups].sort(([a],[b])=>a.localeCompare(b))){lines.sort((a,b)=>a.name.localeCompare(b.name));lines.forEach((line,area)=>{result[line.name]={group,area};});}
 return result;
}
export function topologyKey(state){return JSON.stringify({groups:[...new Set((state.lines||[]).filter(l=>typeof l.group==='string'&&l.group).map(l=>l.group))].sort(),agents:(state.agents||[]).map(a=>[a.id,a.use]).sort(([a],[b])=>a.localeCompare(b))});}
