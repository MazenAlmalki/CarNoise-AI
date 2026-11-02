import { retrieveTypedSymptoms } from './textRetrieval.js';

// Intent recognition: limited, explainable Saudi Arabic aliases. Avoid turning short
// ambiguous phrases (e.g. "ترج") into a diagnosis without enough context.
const equivalents=[
  [/(?:ترج|يرج|ترجف|يرتج|تنتفض|تهتز|رجفه|رجفة|هزه|هزة)/g,' اهتزاز '],
  [/(?:وهي واقفه|وهي واقفة|بالوقفه|بالوقفة|عند الاشاره|عند الإشارة|وقت الوقوف|اثناء الوقوف)/g,' عند الوقوف '],
  [/(?:المكينه|المكينة|الماكينه|الماكينة)/g,' المحرك '],
  [/(?:البريك|البريكات|الفحمات)/g,' الفرامل '],
  [/(?:الدركسون|الطاره|الطارة)/g,' المقود '],
  [/(?:القير|الجير)/g,' ناقل الحركة '],
  [/(?:تحتر|تسخن|الحراره مرتفعه|الحرارة مرتفعة)/g,' ارتفاع الحرارة '],
  [/(?:ما تدق سلف|ما تدق السلف|ما تشتغل|ماتشتغل)/g,' لا تبدأ التشغيل '],
  [/(?:ما تسحب|مكتومه|مكتومة|عزمها ضعيف)/g,' ضعف التسارع '],
  [/(?:تنتع|ينتع|نتعه|نتعة)/g,' نتعة '],
  [/(?:تطق|يطق|طق طق|طقطقه|طقطقة)/g,' طقطقة '],
  [/(?:صرير|تصفر|يصر|صفير)/g,' صرير ']
];
const simplify=s=>String(s||'').toLowerCase().replace(/[إأآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/[ًٌٍَُِّْـ]/g,'').replace(/\s+/g,' ').trim();
export function normalizeSaudiDescription(text){
 let result=' '+simplify(text).slice(0,700)+' ';
 for(const [regex,replace] of equivalents)result=result.replace(regex,replace);
 return result.replace(/\s+/g,' ').trim();
}
// High-precision composite intents: do not infer a diagnosis from a single word.
// Use canonical existing source cards so references and safety guidance stay auditable.
const intentRules=[
 {pattern:/(?:اهتزاز|رجفه|رجه|ترج|يرج|shaking|vibrat|rough idle)/i, context:/(?:وقوف|واقفه|واقف|اشاره|idle|stopped)/i, canonical:'السيارة ترج وهي واقفة',id:'T008'},
 {pattern:/(?:حراره|حرارة|ارتفاع الحرارة|سخونه|overheat)/i,context:/(?:المحرك|السياره|المكينه|engine|car)/i,canonical:'المكينة تحتر',id:'T013'},
 {pattern:/(?:الفرامل|brake)/i,context:/(?:طحن|حك|grind|scrap)/i,canonical:'الفرامل تحك',id:'T002'}
];
function canonicalMatch(text){
 for(const rule of intentRules){
  if(rule.pattern.test(text)&&rule.context.test(text)){
   const found=retrieveTypedSymptoms(rule.canonical,{limit:5}).find(x=>x.id===rule.id);
   if(found)return {...found,score:Math.max(found.score,10)};
  }
 }
 return null;
}

const serious=/(?:ما تمسك الفرامل|الفرامل ما تمسك|الفرامل لا تعمل|فقدت الفرامل|فقدان التحكم|المقود قفل|الدركسون قفل|الفرامل ضعيفه جدا|الفرامل ضعيفة جدا|حريق|ريحة حريق|رائحه حريق|دخان كثيف|حراره مرتفعه جدا|الحراره احمر|oil pressure|no brakes|loss of steering|smoke|fire|overheat)/i;
export function assessText(description,previous=[]){
 const text=String(description||'').slice(0,700);
 const normalized=normalizeSaudiDescription(text);
 const priorText=Array.isArray(previous)?previous.filter(x=>x?.role==='user').map(x=>String(x.content||'')).slice(-2).join(' '):'';
 const combined=normalizeSaudiDescription(priorText+' '+text);
 const current=retrieveTypedSymptoms(text,{limit:3});
 const expanded=retrieveTypedSymptoms(normalized,{limit:3});
 // Use previous symptom context ONLY when the current turn has few specific
 // automotive terms, such as "ايه تزيد مع المكيف".
 const continuing=Boolean(priorText)&&(/^(ايه|ايوه|نعم|لا|بس|لكن|تزيد|يخف|تخف|اذا|عند|مع|وقت|لما|also|yes|no|only|when|it)/i.test(normalized)||current.length===0);
 const historical=continuing?retrieveTypedSymptoms(combined,{limit:3}):[];
 const exact=canonicalMatch(combined);
 const byId=new Map();
 for(const item of [...(exact?[exact]:[]),...current,...expanded,...historical]){
  const original=byId.get(item.id);
  if(!original||item.score>original.score)byId.set(item.id,item);
 }
 const matches=[...byId.values()].sort((a,b)=>b.score-a.score).slice(0,3);
 const clearAlias=matches[0]&&matches[0].score>=5;
 const isDanger=serious.test(simplify(text))||serious.test(normalized);
 // Only the vetted, original card values may be used as declarative reference content.
 return {normalized,matches,continuing,clearMatch:Boolean(clearAlias),isDanger};
}
const followupQuestions={
 T008:{ar:'هل الرجفة تزيد إذا شغّلت المكيف؟',en:'Does the shaking increase when you turn on the AC?'},
 T005:{ar:'هل يتغير الصوت عند الضغط على الفرامل؟',en:'Does the noise change when you apply the brakes?'},
 T026:{ar:'هل الونة تزيد مع سرعة السيارة؟',en:'Does the hum get louder as the car speeds up?'},
 T029:{ar:'هل التمايل يؤثر على التحكم بالسيارة؟',en:'Is the swaying affecting your ability to control the vehicle?'}
};
export function groundedResponse(assessment,language='ar',previous=[]){
 const card=assessment.matches[0];
 if(!card||!assessment.clearMatch)return null;
 const ar=language!=='en';
 const symptom=ar?card.symptom_ar:card.symptom_en;
 const explanation=ar?card.possible_causes_ar[0]:card.possible_causes_en[0];
 const action=ar?card.safe_next_step_ar:card.safe_next_step_en;
 const priorAssistant=Array.isArray(previous)&&previous.some(x=>x?.role==='assistant');
 const idle=card.id==='T008';
 if(assessment.isDanger||card.urgency_hint==='high'){
  return ar
   ? 'إذا المشكلة تؤثر على الفرامل أو التوجيه أو فيها دخان أو حرارة شديدة، توقف في مكان آمن ولا تواصل القيادة، واطلب فحصًا من مختص. '+explanation+'، لكن ما يمكن تأكيد السبب من الوصف وحده.'
   : 'If braking, steering, smoke, or serious overheating is involved, stop safely and seek professional assistance. '+explanation+' This cannot confirm the cause.';
 }
 if(idle&&priorAssistant&&/مكيف|التكييف|ac|air conditioner/i.test(assessment.normalized)){
  return ar
   ? 'بما أن الرجفة تزيد مع تشغيل المكيف، هذا يساعد في تحديد وقت ظهورها، لكنه ما يثبت سببًا واحدًا. '+explanation+'. '+action+'. هل لمبة المكينة شغالة؟'
   : 'If shaking increases with the AC on, that helps narrow down when it happens but does not prove a cause. '+explanation+'. '+action+'. Is the check-engine light on?';
 }
 const q=followupQuestions[card.id];
 const ask=(!priorAssistant&&q)?' '+(ar?q.ar:q.en):'';
 return ar
  ? 'إذا تقصد '+symptom+'، '+explanation+'. هذا احتمال فقط وليس تشخيصًا مؤكدًا. '+action+'.'+ask
  : 'For '+symptom.toLowerCase()+', '+explanation+'. This is a possibility, not a confirmed diagnosis. '+action+'.'+ask;
}
