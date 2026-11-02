// A deterministic INTERVIEW, not a deterministic diagnosis.
// Uses only the user's selection as evidence. The AI still writes the final explanation.
const questions={
 location:{ar:'وين تسمع الصوت تقريبًا؟',en:'Where do you hear the sound?',choices:[
 ['engine','من جهة المكينة','Engine area'],['wheels','من جهة الكفرات','Wheels / tires'],
 ['under','من تحت السيارة','Under the car'],['cabin','داخل السيارة','Inside the cabin'],
 ['rear','من الخلف','Rear of the car'],['unknown','مو متأكد','Not sure']]},
 timing:{ar:'متى يطلع الصوت؟',en:'When does the noise happen?',choices:[
 ['startup','عند التشغيل','When starting'],['idle','وهي واقفة والمكينة شغالة','While idling'],
 ['accelerating','مع الدعس','When accelerating'],['braking','وقت الفرامل','When braking'],
 ['turning','عند اللف','When turning'],['bumps','على المطبات','Over bumps'],
 ['driving','أثناء المشي','While driving'],['unknown','مو متأكد','Not sure']]},
 texture:{ar:'كيف توصف الصوت؟',en:'How would you describe it?',choices:[
 ['click','طقطقة','Clicking'],['squeal','صرير','Squealing'],
 ['whistle','صفير','Whistling'],['hum','ونة / طنين','Humming'],
 ['grind','حك أو طحن','Grinding'],['clunk','طقه قوية','Clunking'],
 ['rattle','خشخشة','Rattling'],['vibration','رجفة','Shaking'],
 ['speech','كلام مسجّل مو صوت سيارة','Spoken words, not a car noise'],
 ['unknown','مو متأكد','Not sure']]}
};
const order=['location','timing','texture'];
const valid=new Map(order.map(stage=>[stage,new Set(questions[stage].choices.map(x=>x[0]))]));
function language(language){return language==='en'?'en':'ar';}
function options(stage,lang){
 const en=lang==='en';
 return questions[stage].choices.map(([value,ar,eng])=>({label:en?eng:ar,text:en?eng:ar,stage,value}));
}
export function beginSoundInterview({language:lang='ar',reason='uncertain',error=null}={}){
 const en=language(lang)==='en';
 const context=reason==='classifier-error'
  ? en?'The sound model failed; I cannot identify this clip.':'مودل الصوت تعطل، فما قدرت أتعرف على المقطع.'
  : reason==='classifier-not-configured'
  ? en?'Sound recognition is not enabled, so I cannot identify this recording.':'التعرف على الأصوات مو مفعّل، فما أقدر أحدد هذا التسجيل.'
  : en?'The recording did not produce a reliable sound identification.':'ما طلعت نتيجة موثوقة للتعرف على الصوت من التسجيل.';
 return {reply:context+' '+(en?questions.location.en:questions.location.ar),
  grounding:'sound-guided-questions',audioStatus:reason,
  audioError:reason==='classifier-error'&&typeof error==='string'?error.slice(0,160):null,
  clarificationOptions:options('location',language(lang)),
  audioInterview:{stage:'location',answers:{}}};
}
export function advanceSoundInterview(input,lang='ar'){
 if(!input||typeof input!=='object')return null;
 const stage=input.stage;
 if(!valid.has(stage)||!valid.get(stage).has(input.value))return null;
 const index=order.indexOf(stage);
 // Never accept arbitrary labels/sentences from the browser as automotive facts.
 const existing=input.answers&&typeof input.answers==='object'?input.answers:{};
 const answers={};
 for(const previous of order.slice(0,index)){
  if(!valid.get(previous).has(existing[previous]))return null;
  answers[previous]=existing[previous];
 }
 answers[stage]=input.value;
 if(index<order.length-1){
  const next=order[index+1];return {
   done:false,reply:language(lang)==='en'?questions[next].en:questions[next].ar,
   grounding:'sound-guided-questions',
   clarificationOptions:options(next,lang),
   audioInterview:{stage:next,answers}
  };
 }
 const chosen=order.map(step=>{
  const record=questions[step].choices.find(([id])=>id===answers[step]);
  return language(lang)==='en'?record[2]:record[1];
 });
 return {
  done:true,answers,
  description:language(lang)==='en'
   ? 'User-provided sound description (NOT model recognition): location: '+chosen[0]+', when: '+chosen[1]+', type: '+chosen[2]+'. Explain plausible broad categories only if grounded in reliable references, ask one relevant next question, never claim the audio established a component.'
   : 'وصف صوت أدخله المستخدم بنفسه (ليس تعرفًا من المودل): المكان: '+chosen[0]+'؛ وقت الصوت: '+chosen[1]+'؛ نوعه: '+chosen[2]+'. ناقش احتمالات عامة مبنية على المصادر، ولا تعتبرها تشخيصًا أو نتيجة تصنيف صوت.'
 };
}
export function interviewStats(){return Object.fromEntries(order.map(x=>[x,questions[x].choices.length]));}
