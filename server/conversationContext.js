// Preserves recent dialogue plus the initial user description so the assistant
// does not lose what the person first reported after several follow-up turns.
// No silent diagnoses or AI-generated memory facts are stored.
const allowed=new Set(['user','assistant']);
export function buildChatHistory(entries,{recent=12}={}){
 if(!Array.isArray(entries))return[];
 const valid=entries.filter(x=>x&&allowed.has(x.role)&&typeof x.content==='string')
  .map(x=>({role:x.role,content:x.content.trim().slice(0,650)})).filter(x=>x.content);
 if(valid.length<=recent)return valid;
 const firstUser=valid.find(x=>x.role==='user');
 const tail=valid.slice(-recent);
 // First symptom is explicit user-authored context, not a synthetic summary.
 return firstUser && !tail.includes(firstUser)
  ? [firstUser,...tail] : tail;
}
export function conversationContext(entries,current){
 const prior=buildChatHistory(entries);
 const userTurns=prior.filter(x=>x.role==='user');
 const first=userTurns[0]?.content||'';
 const last=userTurns.at(-1)?.content||'';
 const followUp=Boolean(prior.length)&&
  /^(?:زي |مثل |ايه|ايوه|نعم|لا |بس |لكن |عند |اذا |لما |تزيد|تخف|قصدت|مو |مب |yes|no |it |like |only |when |also |and )/i.test(String(current||'').trim());
 return {firstUserComplaint:first.slice(0,320),latestUserDetail:last.slice(0,200),
  priorTurns:prior.length,isLikelyFollowUp:followUp};
}
