import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const base=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../data');
const glossary=JSON.parse(readFileSync(path.join(base,'saudi_dialect_glossary_v1.json'),'utf8'));
const cases=readFileSync(path.join(base,'saudi_conversation_edge_cases_v1.jsonl'),'utf8')
 .split('\n').filter(Boolean).map(JSON.parse);

function normalize(text){
 return String(text??'').toLowerCase().replace(/[إأآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه')
  .replace(/[ًٌٍَُِّْـ]/g,'').replace(/[^a-z0-9\u0621-\u064A]+/g,' ').replace(/\s+/g,' ').trim();
}
function phraseMatches(value,phrase){
 const p=normalize(phrase);
 if(p.length<3)return false; // Do not over-interpret short particles like 'لا' or 'مو'.
 return (' '+value+' ').includes(' '+p+' ');
}
const prepared=glossary.map(entry=>({
 entry,forms:[entry.term,...entry.aliases].filter(Boolean).map(normalize)
}));
const indexedCases=new Map(cases.map(item=>[normalize(item.utterance_ar),item]));

export function interpretSaudiSpeech(message,{limit=5}={}){
 const text=normalize(message).slice(0,700);
 const hasVehicleContext=/(?:سيار|مكين|محرك|قير|جير|بريك|فرامل|دركسون|كفر|كفرات|مكيف|كمبروسر|رديتر|سلف|زيت|طقطقه|ونه|رجفه|اهتزاز|سرعه|عداد|شكمان|لمبه)/.test(text);
 const matches=prepared.map(({entry,forms})=>{
  const hits=forms.filter(v=>phraseMatches(text,v));
  const longest=hits.reduce((a,b)=>Math.max(a,b.length),0);
  // Vehicle terms shouldn't be injected into unrelated conversations.
  if(entry.domain==='السيارة'&&!hasVehicleContext)return null;
  if(entry.kind==='ambiguous'&&(!hasVehicleContext||longest<5))return null;
  if(!longest)return null;
  return {entry,score:longest+(entry.domain==='السيارة'?5:0)};
 }).filter(Boolean).sort((a,b)=>b.score-a.score);
 const selected=[];
 const seen=new Set();
 for(const item of matches){
  if(seen.has(item.entry.id))continue;
  selected.push({
    term:item.entry.term,meaning_ar:item.entry.meaning_ar,
    meaning_en:item.entry.meaning_en,kind:item.entry.kind,
    warning:item.entry.kind==='ambiguous'?'Meaning depends on context; ask if unclear.':undefined
  });
  seen.add(item.entry.id);
  if(selected.length>=Math.min(Math.max(limit,1),8))break;
 }
 const exact=indexedCases.get(text);
 let intent=exact?.intent||null;
 // Generalize beyond the synthetic exact strings without declaring a repair.
 if(!intent){
  if(/(?:ما فهمت|وش تقصد|مو كذا|مب كذا|ما اقصد|قلت لك|you misunderstood)/i.test(text))intent='correction';
  else if(/(?:ما اعرف اوصف|مدري اوصف|ما ادري اوصف|شي غريب|شي مو طبيعي|صوت غريب)/i.test(text))intent='unclear';
  else if(/(?:استهب|امزح|نكتة|نكت|زعلانه مني|جوعانه بنزين|تغني)/i.test(text))intent='joke';
  else if(/(?:وش اخبارك|علومك|كيف حالك|هلا|مرحبا|سلام عليكم|hi|hello)/i.test(text)&&!hasVehicleContext)intent='greeting';
  else if(/(?:وش يعني ai|كم عمرك|وش اسمك)/i.test(text))intent='not_vehicle';
  else if(/(?:عطني الزبده|لا تطول|فصل لي|كلمني سعودي|مثل المبتدئ)/i.test(text))intent='preferences';
 }
 const guidance={
  greeting:'Reply warmly and briefly to the greeting. Do not assume the user has a car fault.',
  not_vehicle:'Answer the actual general question helpfully; do not force the topic back to car diagnosis.',
  joke:'Recognize playful/metaphorical wording and respond lightly without claiming a car part is faulty.',
  unclear:'Acknowledge what is unclear; ask ONE specific natural clarifying question about the symptom, context or timing. Never pretend certainty.',
  contradiction:'Ask a gentle clarification about the apparent contradiction without inventing facts.',
  correction:'Accept the correction, revise your interpretation and refer to conversation history. Do not repeat the wrong explanation.',
  limits:'State actual capabilities and limits, especially whether sound/video was analyzed. No invented perception.',
  media_failure:'If media could not be processed, explicitly say you did not analyze it and request a useful verbal description.',
  safety:'Prioritize safe advice and professional assessment; do not provide risky repair instructions.',
  pricing:'Do not invent local repair prices; mention a diagnosis/quote is needed, and use fresh verified data if prices are requested.',
  recall:'Never assert a vehicle is included in a recall from make/model alone. Point to official VIN lookup; do not solicit VIN.',
  preferences:'Adapt length and language to the user request without sacrificing safety and uncertainty.',
  followup:'Use previous user/assistant messages to infer what “it” refers to; if history is missing ask what symptom changed.'
 };
 return {
  normalized:text,
  vocabulary:selected,
  intent:intent||'ordinary',
  conversationGuidance:guidance[intent]||null,
  // This provides behavior guidance rather than a response to copy.
  behaviorExample:exact?.desired_behavior_ar||null
 };
}

export function dialectStats(){return {glossaryEntries:glossary.length,conversationExamples:cases.length};}
