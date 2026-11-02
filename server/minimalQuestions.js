// Minimize repetitive questions while keeping a useful, cautious answer.
// Evidence comes from what the user wrote, not guessed audio classifications.
const timing=[
 {id:'braking',re:/(?:فرامل|افرمل|بريك|brak|stopp?ing)/i,label:'وقت الفرامل'},
 {id:'turning',re:/(?:دركسون|الف|اللف|انعطف|turning|corner|cv joint)/i,label:'مع اللف'},
 {id:'bumps',re:/(?:مطب|المطبات|حفر|bumps?|pothole)/i,label:'على المطبات'},
 {id:'startup',re:/(?:تشغيل|اشغل السيارة|سلف|start(?:ing)?|crank)/i,label:'عند التشغيل'},
 {id:'idle',re:/(?:واقفة|واقف|الوقوف|وقوف|idle|idling)/i,label:'وقت الوقوف'},
 {id:'acceleration',re:/(?:دعس|ادعس|تسارع|accelerat|under load)/i,label:'مع التسارع'},
 {id:'driving',re:/(?:سرعة|امشي|مشي|الخط|highway|driving|speed)/i,label:'أثناء القيادة'}
];
const texture=[
 {id:'squeal',re:/(?:صرير|تصفر|صفير|squeal|screech|chirp)/i,label:'صرير أو صفير'},
 {id:'click',re:/(?:طقطقة|طقه|طق|تكتكة|click|tick|clunk)/i,label:'طقطقة أو طقة'},
 {id:'grind',re:/(?:حك|احتكاك|طحن|grind|scrap)/i,label:'احتكاك أو طحن'},
 {id:'hum',re:/(?:ونة|ونّة|طنين|صوت هوا|hum|whin|rumbl)/i,label:'ونة أو طنين'},
 {id:'rattle',re:/(?:خشخشة|رجه|رجة|رجفة|يرج|ترج|rattl|vibrat|shak)/i,label:'خشخشة أو رجفة'}
];
const location=[
 {id:'engine',re:/(?:مكينة|المحرك|كبوت|engine|hood)/i,label:'جهة المحرك'},
 {id:'wheel',re:/(?:كفر|عجل|اطار|تاير|wheel|tire|tyre)/i,label:'جهة الكفرات'},
 {id:'under',re:/(?:تحت السيارة|اسفل السيارة|شكمان|exhaust|underneath)/i,label:'تحت السيارة'},
 {id:'cabin',re:/(?:داخل السيارة|الطبلون|المكيف|الداخل|cabin|dashboard)/i,label:'داخل السيارة'}
];
const unsafe=/(?:الفرامل ما تمسك|ما توقف|الدركسون ثقيل جدا|فقدان التحكم|دخان|ريحة حريق|حرارة مرتفعة جدا|brake failure|lost steering|smoke|fire|overheating)/i;
const normalize=t=>String(t||'').toLowerCase().replace(/[إأآ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/[^\p{L}\p{N}]+/gu,' ').trim();
function lastValue(sentences,rules){
 for(let i=sentences.length-1;i>=0;i--) {
  const match=rules.find(r=>r.re.test(sentences[i]));
  if(match)return {id:match.id,label:match.label,source:sentences[i]};
 }
 return null;
}
function questionCount(messages){
 return (Array.isArray(messages)?messages:[]).filter(m=>m?.role==='assistant'&&typeof m.content==='string')
  .reduce((count,m)=>count+(/[؟?]/.test(m.content)?1:0),0);
}
function lastAssistantQuestions(messages){
 return (Array.isArray(messages)?messages:[]).filter(m=>m?.role==='assistant'&&typeof m.content==='string')
 .slice(-10).flatMap(m=>m.content.split(/[؟?]/).map(x=>normalize(x)).filter(x=>x.length>8)).slice(-10);
}
const insufficient=t=>/^(?:حلل(?: المقطع| الصوت| التسجيل| المرفق)?|اسمع(?: الصوت| المقطع)?|وش المشكلة|صوت غريب|مشكلة في سيارتي|help|analyze audio)[؟?!.\s]*$/i.test(String(t||'').trim());
export function planMinimalQuestions({messages=[],current='',hasAudioCandidates=false}={}){
 const texts=[...(Array.isArray(messages)?messages:[]).filter(m=>m?.role==='user').map(m=>m.content).filter(x=>typeof x==='string').slice(-10),String(current||'')];
 const notes={timing:lastValue(texts,timing),texture:lastValue(texts,texture),location:lastValue(texts,location)};
 const total=questionCount(messages);
 const asked=lastAssistantQuestions(messages);
 const gaps=Object.entries(notes).filter(([,v])=>!v).map(([k])=>k);
 const isAmbiguous=insufficient(current)||(!notes.timing&&!notes.texture&&!notes.location&&!hasAudioCandidates);
 const critical=unsafe.test(texts.join(' '));
 const canAsk=!critical&&(total<2)&&(isAmbiguous||gaps.length>0)&&!hasAudioCandidates;
 const questionType=gaps.includes('timing')?'timing':gaps.includes('texture')?'texture':gaps.includes('location')?'location':null;
 const text=questionType==='timing'?'متى يظهر الصوت بالضبط: عند التشغيل، الفرامل، اللف، المطبات، أو المشي؟'
  :questionType==='texture'?'وش أقرب وصف للصوت: طقطقة، صرير، ونة، أو حك؟'
  :questionType==='location'?'تحس الصوت من جهة المكينة، الكفرات، أو داخل السيارة؟':null;
 const english=questionType==='timing'?'When does the sound occur: starting, braking, turning, bumps, or driving?'
  :questionType==='texture'?'Does it sound like clicking, squealing, humming, or grinding?'
  :questionType==='location'?'Does it come from the engine area, wheels, or cabin?':null;
 const repeated=Boolean(text&&asked.some(q=>normalize(text).includes(q)||q.includes(normalize(text))));
 return {known:notes,answeredFields:Object.values(notes).filter(Boolean).length,
  questionBudget:Math.max(0,2-total),askQuestion:Boolean(canAsk&&questionType&&!repeated),
  questionType:canAsk&&!repeated?questionType:null,suggestedQuestion:canAsk&&!repeated?text:null,
  suggestedQuestionEnglish:canAsk&&!repeated?english:null,
  stopAsking:total>=2||critical||(!gaps.length),urgent:critical,
  evidenceRule:'Describe ranked possibilities now if at least two details are known; do not require completing every field. Never diagnose a particular failed part from sound alone.'};
}
export function enforceQuestionBudget(reply,plan,{language='ar'}={}){
 const raw=String(reply||'').trim();
 if(!raw)return raw;
 // Treat '?' as question marks, not as turn-boundary markers in URLs.
 let without=raw;
 const questions=[...raw.matchAll(/[^\n؟?]*[؟?]/g)];
 if(questions.length){
  without=raw.replace(/[^\n؟?]*[؟?]/g,'').replace(/\s{2,}/g,' ').trim();
 }
 if(plan.askQuestion&&plan.questionBudget>0){
  const prompt=language==='en'?plan.suggestedQuestionEnglish:plan.suggestedQuestion;
  return (without?without+'\n':'')+prompt;
 }
 return without|| (language==='en'?'The information is not enough to identify a specific fault; a mechanic can inspect it.':'المعلومات ما تكفي لتحديد قطعة معينة، والفحص عند مختص يقدر يحسم السبب.');
}
