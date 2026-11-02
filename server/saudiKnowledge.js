import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const filename=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../data/saudi_official_context_v1.json');
const context=JSON.parse(readFileSync(filename,'utf8'));
const n=s=>String(s||'').toLowerCase().replace(/[إأآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/\s+/g,' ').trim();
const recall=/استدعاء|استدعاءات|عيب مصنعي|recall|الوكالة|الوكيل/i;
const camera=/كاميرا|اصطفاف|ركن|parking|reverse camera/i;
const engine=/مكينه|مكينة|محرك|engine|طقه|طقطقة|نقص عزم|فقدان قوة/i;
const braking=/فرامل|بريك|brake/i;
const loss=/قير|جير|نقل|تسارع|gear|transmission/i;

export function retrieveSaudiGuidance(message,{limit=2}={}){
 const text=n(message);
 const found=[];
 for(const item of context){
  const matched=item.triggers.filter(phrase=>text.includes(n(phrase)));
  if(!matched.length)continue;
  // Never imply a manufacturer-wide recall from a car brand alone.
  const relevant=
   item.id==='SAU001' ? true :
   item.id==='SAU002' ? true :
   item.id==='SAU003' ? true :
   item.id==='SAU004' ? (recall.test(text)||camera.test(text)) :
   item.id==='SAU005' ? (recall.test(text)||engine.test(text)) :
   item.id==='SAU006' ? (recall.test(text)||braking.test(text)) :
   item.id==='SAU007' ? (recall.test(text)||loss.test(text)) : false;
  if(relevant)found.push({item,score:matched.reduce((acc,x)=>acc+x.length,0)});
 }
 return found.sort((a,b)=>b.score-a.score).slice(0,limit).map(({item})=>({
  id:item.id,topic:item.topic,fact_ar:item.fact_ar,fact_en:item.fact_en,
  action_ar:item.action_ar,source_url:item.source_url,
  source_type:item.source_type,verification_status:'official_publisher_statement_not_vehicle_diagnosis'
 }));
}

export function conversationHints({message,history=[],hasMedia=false,mediaFailed=false,hasMatches=false,language='ar'}){
 const txt=n(message);
 const v=[];
 const justGreeting=/^(?:هلا|هلو|مرحبا|السلام عليكم|صباح الخير|مساء الخير|hi|hello|hey)[\s!؟?]*$/i.test(txt);
 if(justGreeting)v.push('GREETING: Reply naturally and invite the user to describe their car issue; do not suggest any fault.');
 if(!hasMatches&&!justGreeting)v.push('LOW-EVIDENCE: Do not guess components or assert causes. Acknowledge what the user said and ask ONE specific question about when the issue happens, where it comes from, or whether it is a sound, warning light or vibration. Make it tailored to the actual message; avoid generic canned replies.');
 if(mediaFailed)v.push('MEDIA UNAVAILABLE: The media model DID NOT analyze the attachment. Explicitly state this and ask for a text description of sound type (clicking/squeal/hum), when it happens, and/or a shorter clearer recording. Never hallucinate what a recording contains.');
 if(hasMedia&&!mediaFailed)v.push('MEDIA: Discuss only observations explicitly present in mediaInsight. A similar audio class is not a confirmed vehicle defect.');
 if(/ما فهمت|وش تقصد|لا مو كذا|غلط|you misunderstood|not what i mean/i.test(txt))v.push('CORRECTION: Acknowledge misunderstanding briefly, restate the updated interpretation and ask only the most useful clarification; never double down.');
 if(/متى|كم|الآن|اليوم|today|date|time/i.test(txt))v.push('CURRENT INFORMATION: If answering real-time maintenance price, recall, law or hours beyond provided official references, say an updated check is needed; do not invent.');
 return v.slice(0,3);
}
